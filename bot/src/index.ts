import { Bot, InlineKeyboard, Keyboard } from 'grammy';
import { eq } from 'drizzle-orm';
import { env } from './env.js';
import { db, leads, leadNotes, reminders } from './db.js';
import { formatLeadCard, withStatusFooter, withNotesFooter } from './lead-handler.js';
import { buildStatsText } from './stats.js';
import { startReminderCron } from './cron.js';
import type { Lead, LeadStatus } from './types.js';

export const bot = new Bot(env.BOT_TOKEN);

const leadMessageMap = new Map<string, { chatId: string; messageId: number }>();

function buildLeadKeyboard(leadId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ Взял в работу', `status:in_progress:${leadId}`)
    .text('⛔ Спам', `status:spam:${leadId}`)
    .row()
    .text('⏰ Напомнить', `remind:${leadId}`);
}

function buildReminderKeyboard(leadId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('Через 1 мин', `remind_set:1m:${leadId}`)
    .text('Через 1 час', `remind_set:1h:${leadId}`)
    .row()
    .text('Через 3 часа', `remind_set:3h:${leadId}`)
    .text('Завтра утром', `remind_set:tomorrow:${leadId}`)
    .row()
    .text('Отмена', `remind_cancel:${leadId}`);
}

const ALLOWED_STATUSES: ReadonlySet<LeadStatus> = new Set(['new', 'in_progress', 'spam', 'converted']);
function isLeadStatus(v: string): v is LeadStatus { return ALLOWED_STATUSES.has(v as LeadStatus); }

async function getLeadOrFail(id: string): Promise<Lead | null> {
  const [row] = await db.select().from(leads).where(eq(leads.id, id));
  if (!row) return null;
  return {
    id: row.id, name: row.name, contact: row.contact,
    source: row.source, page: row.page,
    utm: row.utm as Record<string, string> | null,
    status: row.status as LeadStatus,
    interactionAt: row.interactionAt,
    createdAt: row.createdAt,
  };
}

async function rebuildCard(lead: Lead, actor?: string): Promise<string> {
  const notes = await db.select().from(leadNotes).where(eq(leadNotes.leadId, lead.id));
  let card = formatLeadCard(lead);
  card = withStatusFooter(card, lead.status, actor);
  if (notes.length > 0) card = withNotesFooter(card, notes);
  return card;
}

export async function sendLeadToRop(lead: Lead): Promise<void> {
  console.log('[lead] sending', lead.name);
  try {
    const text = formatLeadCard(lead);
    const msg = await bot.api.sendMessage(env.ROP_CHAT_ID, text, {
      parse_mode: 'HTML',
      reply_markup: buildLeadKeyboard(lead.id),
    });
    leadMessageMap.set(lead.id, { chatId: env.ROP_CHAT_ID, messageId: msg.message_id });
  } catch (err) {
    console.error('[lead] failed', err);
  }
}

// ---------- keyboard ----------

const mainKeyboard = new Keyboard()
  .text('📊 Статистика').text('📋 Заявки')
  .resized().persistent();

// ---------- commands ----------

bot.command('start', async (ctx) => {
  await ctx.reply('Привет! Я бот ДИВА — слежу за заявками.', { reply_markup: mainKeyboard });
});

bot.hears('📊 Статистика', async (ctx) => {
  const text = await buildStatsText();
  await ctx.reply(text, { parse_mode: 'HTML' });
});

bot.hears('📋 Заявки', async (ctx) => {
  const rows = await db.select().from(leads)
    .where(eq(leads.status, 'new'))
    .orderBy(leads.createdAt);

  if (rows.length === 0) {
    await ctx.reply('Новых заявок нет.');
    return;
  }

  for (const row of rows) {
    const lead: Lead = {
      id: row.id, name: row.name, contact: row.contact,
      source: row.source, page: row.page,
      utm: row.utm as Record<string, string> | null,
      status: row.status as LeadStatus,
      interactionAt: row.interactionAt,
      createdAt: row.createdAt,
    };
    await ctx.reply(formatLeadCard(lead), {
      parse_mode: 'HTML',
      reply_markup: buildLeadKeyboard(row.id),
    });
  }
});

// ---------- reply → note ----------

bot.on('message:text', async (ctx) => {
  const replyTo = ctx.message.reply_to_message;
  if (!replyTo) return;

  let targetLeadId: string | null = null;
  for (const [leadId, info] of leadMessageMap.entries()) {
    if (info.messageId === replyTo.message_id) { targetLeadId = leadId; break; }
  }
  if (!targetLeadId) return;

  const author = ctx.from?.username ?? String(ctx.from?.id ?? 'unknown');
  await db.insert(leadNotes).values({ leadId: targetLeadId, text: ctx.message.text, author });

  const lead = await getLeadOrFail(targetLeadId);
  if (!lead) return;

  const info = leadMessageMap.get(targetLeadId);
  if (info) {
    try {
      await bot.api.editMessageText(info.chatId, info.messageId, await rebuildCard(lead), {
        parse_mode: 'HTML',
        reply_markup: buildLeadKeyboard(targetLeadId),
      });
    } catch { /* unchanged */ }
  }
  await ctx.reply('📝 Заметка сохранена.');
});

// ---------- status callbacks ----------

bot.callbackQuery(/^status:([a-z_]+):(.+)$/, async (ctx) => {
  const status = ctx.match[1];
  const id = ctx.match[2];
  if (!status || !id || !isLeadStatus(status)) {
    await ctx.answerCallbackQuery({ text: 'Некорректная команда', show_alert: true });
    return;
  }

  const [updated] = await db.update(leads).set({ status }).where(eq(leads.id, id)).returning();
  if (!updated) { await ctx.answerCallbackQuery({ text: 'Заявка не найдена', show_alert: true }); return; }

  const lead = await getLeadOrFail(id);
  if (!lead) return;

  const actor = ctx.from?.username ?? String(ctx.from?.id ?? '');
  try {
    await ctx.editMessageText(await rebuildCard(lead, actor), {
      parse_mode: 'HTML',
      reply_markup: buildLeadKeyboard(id),
    });
  } catch { /* unchanged */ }

  await ctx.answerCallbackQuery({ text: 'Статус обновлён' });
});

// ---------- reminder callbacks ----------

bot.callbackQuery(/^remind:(.+)$/, async (ctx) => {
  const id = ctx.match[1] ?? '';
  await ctx.editMessageReplyMarkup({ reply_markup: buildReminderKeyboard(id) });
  await ctx.answerCallbackQuery({ text: 'Когда напомнить?' });
});

bot.callbackQuery(/^remind_cancel:(.+)$/, async (ctx) => {
  const id = ctx.match[1] ?? '';
  await ctx.editMessageReplyMarkup({ reply_markup: buildLeadKeyboard(id) });
  await ctx.answerCallbackQuery();
});

bot.callbackQuery(/^remind_set:([a-z0-9]+):(.+)$/, async (ctx) => {
  const when = ctx.match[1] ?? '';
  const leadId = ctx.match[2] ?? '';
  const chatId = String(ctx.chat?.id ?? env.ROP_CHAT_ID);
  const messageId = ctx.callbackQuery.message?.message_id ?? 0;

  const now = new Date();
  let fireAt: Date;
  if (when === '1m') fireAt = new Date(now.getTime() + 60 * 1000);
  else if (when === '1h') fireAt = new Date(now.getTime() + 60 * 60 * 1000);
  else if (when === '3h') fireAt = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  else fireAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 6, 0, 0);

  await db.insert(reminders).values({ leadId, chatId, messageId, fireAt });
  await ctx.editMessageReplyMarkup({ reply_markup: buildLeadKeyboard(leadId) });
  await ctx.answerCallbackQuery({ text: '⏰ Напоминание установлено' });
});

// ---------- error handler ----------

bot.catch((err) => { console.error('[bot] error', err); });

// ---------- polling new leads ----------

async function pollNewLeads(): Promise<void> {
  const newLeads = await db.select().from(leads).where(eq(leads.notified, false));
  for (const row of newLeads) {
    const lead: Lead = {
      id: row.id, name: row.name, contact: row.contact,
      source: row.source, page: row.page,
      utm: row.utm as Record<string, string> | null,
      status: row.status as LeadStatus,
      interactionAt: row.interactionAt,
      createdAt: row.createdAt,
    };
    await sendLeadToRop(lead);
    await db.update(leads).set({ notified: true }).where(eq(leads.id, row.id));
  }
}

// ---------- entrypoint ----------

async function main(): Promise<void> {
  console.log('diva-bot starting');
  startReminderCron(bot);
  setInterval(() => void pollNewLeads(), 3000);
  process.once('SIGINT', () => void bot.stop().then(() => process.exit(0)));
  process.once('SIGTERM', () => void bot.stop().then(() => process.exit(0)));
  await bot.start();
}

main().catch((err) => {
  process.stderr.write('[fatal] ' + String(err) + '\n');
  process.exit(1);
});
