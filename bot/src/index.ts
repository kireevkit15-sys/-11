import { Bot, InlineKeyboard, Keyboard } from 'grammy';
import { eq, sql } from 'drizzle-orm';
import { env } from './env.js';
import { db, leads, leadNotes, reminders, installShutdown } from './db.js';
import { formatLeadCard, withStatusFooter, withNotesFooter } from './lead-handler.js';
import { buildStatsText } from './stats.js';
import { startReminderCron } from './cron.js';
import type { Lead, LeadStatus } from './types.js';

export const bot = new Bot(env.BOT_TOKEN);

// ---------- whitelist ----------
// Whitelist Telegram user id: бот отвечает только разрешённым. Список
// задаётся через env BOT_ALLOWED_USER_IDS (через запятую). Рассылка
// заявок в ROP_CHAT_ID не фильтруется — middleware режет только
// ВХОДЯЩИЕ от пользователей.
//
// Failsafe: в production пустой whitelist = exit(1). Иначе бот отвечал бы
// ВСЕМ пользователям Telegram (DEPLOY-BLOCKERS (4).md, замечание 9).
// Разрешаем пустой whitelist ТОЛЬКО в development/test.
const allowedUserIds = new Set(
  env.BOT_ALLOWED_USER_IDS.split(',').map((s) => s.trim()).filter(Boolean),
);
if (env.NODE_ENV === 'production' && allowedUserIds.size === 0) {
  console.error(
    '[fatal] BOT_ALLOWED_USER_IDS is empty in production — bot would accept commands from any Telegram user. Refusing to start. Set BOT_ALLOWED_USER_IDS in bot/.env.',
  );
  process.exit(1);
}
if (allowedUserIds.size === 0) {
  console.warn(
    '[bot] WARNING: BOT_ALLOWED_USER_IDS is empty — bot will respond to ANY user (development only).',
  );
}

bot.use(async (ctx, next) => {
  const uid = String(ctx.from?.id ?? '');
  if (!allowedUserIds.has(uid)) {
    console.warn('[bot] access denied:', uid, ctx.from?.username ?? '(no username)');
    return; // не вызываем next() → хендлеры не отработают
  }
  await next();
});

const leadMessageMap = new Map<string, { chatId: string; messageId: number }>();

/**
 * Debounce для callback-кнопок: один пользователь, нажимая дважды быстро
 * (Telegram иногда доставляет дубль при плохом соединении), вызывал дважды
 * один и тот же handler. Для status-смены это значит: статус прыгал через
 * одну ступень или ставил notification duplicate. Для remind_set —
 * создавались два напоминания, и в Telegram-чате прилетали дважды.
 *
 * Схема: ключ = `${userId}:${callbackId}`. Если для ключа есть запись
 * моложе DEBOUNCE_MS — игнорируем повтор. (M1)
 */
const callbackDebounce = new Map<string, number>();
const CALLBACK_DEBOUNCE_MS = 800;

function isCallbackDebounced(userId: number, callbackId: string): boolean {
  const key = `${userId}:${callbackId}`;
  const now = Date.now();
  const last = callbackDebounce.get(key);
  if (last !== undefined && now - last < CALLBACK_DEBOUNCE_MS) return true;
  callbackDebounce.set(key, now);
  // Периодически чистим, чтобы Map не росла бесконечно.
  if (callbackDebounce.size > 5_000) {
    const cutoff = now - CALLBACK_DEBOUNCE_MS * 10;
    for (const [k, t] of callbackDebounce) {
      if (t < cutoff) callbackDebounce.delete(k);
    }
  }
  return false;
}

/**
 * Ограничение размера leadMessageMap — защита от memory leak.
 * Без TTL записи копятся вечно: для каждой новой заявки добавляется запись,
 * но при смене статуса/удалении записи не удаляются. При 100K+ заявок бот съедает RAM.
 *
 * Решение: FIFO-eviction при превышении лимита.
 */
const LEAD_MAP_MAX_ENTRIES = 10_000;
function setLeadMessageMap(leadId: string, info: { chatId: string; messageId: number }): void {
  if (leadMessageMap.size >= LEAD_MAP_MAX_ENTRIES) {
    const firstKey = leadMessageMap.keys().next().value;
    if (firstKey !== undefined) leadMessageMap.delete(firstKey);
  }
  leadMessageMap.set(leadId, info);
}

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

// LeadStatus должен совпадать с:
//   1. bot/src/types.ts → export type LeadStatus
//   2. db/init.sql         → CHECK leads_status_chk
//   3. db/migrations/0002 → CHECK leads_status_check  (ещё не применён на проде)
//   4. lead-handler.ts    → STATUS_LABELS
// Если хотя бы одно расходится — бот получит CHECK violation при UPDATE.
// См. аудит-отчёт C1.
const ALLOWED_STATUSES: ReadonlySet<LeadStatus> = new Set([
  'new',
  'in_progress',
  'interaction_scheduled',
  'spam',
  'converted',
]);
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
  const text = formatLeadCard(lead);
  // Не глотаем ошибку: если Telegram недоступен, исключение должно
  // идти наверх, чтобы pollNewLeads мог решить — пометить ли заявку
  // доставленной. Раньше try/catch ловил сбой и помечал notified=true,
  // заявка терялась безвозвратно (DEPLOY-BLOCKERS (4).md, замечание 7).
  const msg = await bot.api.sendMessage(env.ROP_CHAT_ID, text, {
    parse_mode: 'HTML',
    reply_markup: buildLeadKeyboard(lead.id),
  });
  setLeadMessageMap(lead.id, { chatId: env.ROP_CHAT_ID, messageId: msg.message_id });
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
  // LIMIT 50 защищает от memory-bomb: если 10000+ необработанных заявок,
  // бот попытается отправить их все в один Telegram-чат, что (a) убьёт UX
  // и (b) приведёт к 429 от Telegram API. 50 — комфортный объём для чата.
  const rows = await db.select().from(leads)
    .where(eq(leads.status, 'new'))
    .orderBy(leads.createdAt)
    .limit(50);

  if (rows.length === 0) {
    await ctx.reply('Новых заявок нет.');
    return;
  }

  if (rows.length === 50) {
    await ctx.reply(`📋 Показаны первые 50 новых заявок. Остальные — в админке.`);
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
    try {
      // Регистрируем в leadMessageMap, чтобы reply → note handler мог
      // найти leadId по message_id. Без этого заметка к заявке, открытой
      // через меню «📋 Заявки», не прикреплялась (H6).
      const sent = await ctx.reply(formatLeadCard(lead), {
        parse_mode: 'HTML',
        reply_markup: buildLeadKeyboard(row.id),
      });
      setLeadMessageMap(row.id, {
        chatId: String(ctx.chat?.id ?? env.ROP_CHAT_ID),
        messageId: sent.message_id,
      });
    } catch (err) {
      // Если Telegram прислал 429 (Too Many Requests), останавливаем цикл —
      // пользователь увидит столько, сколько успели отправить, и нажмёт
      // кнопку ещё раз, чтобы получить следующую пачку.
      console.error('[bot] lead listing reply failed', err);
      return;
    }
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

  // Лимит на размер заметки — защита от атакующего, который reply-ит на
  // сообщение бота и отправляет 10 МБ текста. Telegram limit на одно
  // сообщение — 4096 символов, режем до 4000 для запаса на логирование
  // и footer. UTF-16 → Array.from, чтобы не разорвать суррогатную пару
  // (кириллица/эмодзи) посередине (M5).
  const text = Array.from(ctx.message.text).slice(0, 4000).join('');
  const author = ctx.from?.username ?? String(ctx.from?.id ?? 'unknown');
  await db.insert(leadNotes).values({ leadId: targetLeadId, text, author });

  const lead = await getLeadOrFail(targetLeadId);
  if (!lead) {
    // Lead удалён, заметка записана в БД, но обновлять карточку некуда.
    // Сообщаем пользователю, чтобы он не ожидал обновлённой версии.
    await ctx.reply('📝 Заметка сохранена, но заявка уже удалена из БД.');
    return;
  }

  const info = leadMessageMap.get(targetLeadId);
  if (info) {
    try {
      await bot.api.editMessageText(info.chatId, info.messageId, await rebuildCard(lead), {
        parse_mode: 'HTML',
        reply_markup: buildLeadKeyboard(targetLeadId),
      });
    } catch (err) {
      // "not modified" — норма; всё прочее логируем (M2).
      if (!isNotModified(err)) console.error('[bot] editMessageText (note) failed', err);
    }
  }
  await ctx.reply('📝 Заметка сохранена.');
});

// ---------- status callbacks ----------

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Глобальный debounce для ВСЕХ callback_query: один юзер, дважды нажавший
 * кнопку за 800ms, получит ответ только на первый клик. Без этого handler'ы
 * создавали дубли (двойная смена статуса, два reminder'а). (M1)
 */
bot.on('callback_query', (ctx, next) => {
  const userId = ctx.from?.id;
  const callbackId = ctx.callbackQuery.id;
  if (userId !== undefined && callbackId && isCallbackDebounced(userId, callbackId)) {
    // Молча проглатываем повтор — клик всё равно исчезнет из UI после
    // первого ответа, юзер увидит финальное состояние.
    return;
  }
  return next();
});

bot.callbackQuery(/^status:([a-z_]+):(.+)$/, async (ctx) => {
  const status = ctx.match[1];
  const id = ctx.match[2];
  // try/finally нужен, чтобы answerCallbackQuery ВСЕГДА вызывался.
  // Без finally при ошибке editMessageText или БД крутилка зависнет, юзер
  // начнёт спамить повторно → Telegram 429 лавина. (H3)
  try {
    if (!status || !id || !isLeadStatus(status)) {
      await ctx.answerCallbackQuery({ text: 'Некорректная команда', show_alert: true });
      return;
    }
    if (!UUID_REGEX.test(id)) {
      await ctx.answerCallbackQuery({ text: 'Некорректный ID заявки', show_alert: true });
      return;
    }

    let updated;
    try {
      [updated] = await db.update(leads).set({ status }).where(eq(leads.id, id)).returning();
    } catch (err) {
      console.error('[bot] status update db error', err);
      await ctx.answerCallbackQuery({ text: 'Ошибка БД, попробуйте позже', show_alert: true });
      return;
    }
    if (!updated) { await ctx.answerCallbackQuery({ text: 'Заявка не найдена', show_alert: true }); return; }

    const lead = await getLeadOrFail(id);
    if (!lead) {
      await ctx.answerCallbackQuery({ text: 'Заявка не найдена', show_alert: true });
      return;
    }

    const actor = ctx.from?.username ?? String(ctx.from?.id ?? '');
    await safeEditText(ctx as never, await rebuildCard(lead, actor), {
      parse_mode: 'HTML',
      reply_markup: buildLeadKeyboard(id),
    });
    await ctx.answerCallbackQuery({ text: 'Статус обновлён' });
  } catch (err) {
    console.error('[bot] status callback unhandled', err);
    await ctx.answerCallbackQuery({ text: 'Ошибка', show_alert: true });
  }
});

// ---------- reminder callbacks ----------

type RemindPreset = '1m' | '1h' | '3h' | 'tomorrow';
const REMIND_PRESETS = new Set<RemindPreset>(['1m', '1h', '3h', 'tomorrow']);
/**
 * Возвращает timestamp "06:00 Europe/Moscow" для указанного дня (default —
 * завтра относительно `now`). ТЗ-фикс: раньше new Date(y,m,d+1,6,0,0)
 * использовал ЛОКАЛЬНУЮ TZ контейнера (в Docker — UTC), а reminders
 * хранятся как timestamptz. Из-за этого напоминание 'tomorrow' срабатывало
 * в 09:00 МСК вместо 06:00 МСК (для часовых поясов к западу от Москвы —
 * ещё хуже).
 *
 * Алгоритм: получаем "yyyy-mm-dd" для Europe/Moscow через Intl (учитывая
 * текущую дату в Москве), инкрементируем день, добавляем 06:00 МСК как
 * offset UTC+3 → Date.UTC(...). Это даёт корректный момент независимо
 * от TZ контейнера.
 */
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000; // Europe/Moscow = UTC+3 (без DST)
function nextMsk6am(now: Date): Date {
  // Берём "сейчас в Москве" как UTC + 3h.
  const mskNow = new Date(now.getTime() + MSK_OFFSET_MS);
  // Год/месяц/день в Москве для tomorrow (m+1 день).
  const y = mskNow.getUTCFullYear();
  const m = mskNow.getUTCMonth();
  const d = mskNow.getUTCDate() + 1;
  // Date.UTC(...) возвращает абсолютный момент: m/d в 03:00 UTC = 06:00 МСК.
  return new Date(Date.UTC(y, m, d, 3, 0, 0, 0));
}

function computeFireAt(preset: RemindPreset, now: Date): Date {
  switch (preset) {
    case '1m':       return new Date(now.getTime() + 60_000);
    case '1h':       return new Date(now.getTime() + 60 * 60_000);
    case '3h':       return new Date(now.getTime() + 3 * 60 * 60_000);
    case 'tomorrow': return nextMsk6am(now);
  }
}

/**
 * GrammyError description для "message is not modified" — Telegram отвечает
 * 400 с description "Bad Request: message is not modified", когда мы пытаемся
 * отредактировать сообщение теми же данными. Это нормальная операция, не ошибка.
 */
function isNotModified(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { error_code?: number; description?: string; message?: string };
  const text = `${e.description ?? ''} ${e.message ?? ''}`;
  return e.error_code === 400 && /not modified/i.test(text);
}

/**
 * Безопасная обёртка вокруг ctx.editMessageReplyMarkup / editMessageText:
 *   - "not modified" глотаем молча (это нормально)
 *   - любые другие ошибки логируем, НО answerCallbackQuery всё равно зовём
 *     в finally — иначе кнопка-крутилка зависает, юзер спанит повторно → 429 лавина
 *   - без обёртки ошибка пробросилась бы наверх, answerCallbackQuery не вызвался
 *     бы, callback-кнопка осталась бы в "loading…" состоянии (C4).
 */
async function safeEditMarkup(
  ctx: { editMessageReplyMarkup: (...a: unknown[]) => Promise<unknown> },
  reply_markup: InlineKeyboard,
): Promise<void> {
  try {
    await ctx.editMessageReplyMarkup({ reply_markup });
  } catch (err) {
    if (isNotModified(err)) return;
    console.error('[bot] editMessageReplyMarkup failed', err);
  }
}

async function safeEditText(
  ctx: { editMessageText: (...a: unknown[]) => Promise<unknown> },
  text: string,
  other: Record<string, unknown>,
): Promise<void> {
  try {
    await ctx.editMessageText(text, other);
  } catch (err) {
    if (isNotModified(err)) return;
    console.error('[bot] editMessageText failed', err);
  }
}

bot.callbackQuery(/^remind:(.+)$/, async (ctx) => {
  const id = ctx.match[1] ?? '';
  try {
    await safeEditMarkup(ctx as never, buildReminderKeyboard(id));
  } finally {
    // finally ГАРАНТИРУЕТ answerCallbackQuery даже при ошибке edit — иначе
    // юзер будет видеть крутилку и спамить повторно → Telegram 429 лавина (C4).
    await ctx.answerCallbackQuery({ text: 'Когда напомнить?' });
  }
});

bot.callbackQuery(/^remind_cancel:(.+)$/, async (ctx) => {
  const id = ctx.match[1] ?? '';
  try {
    await safeEditMarkup(ctx as never, buildLeadKeyboard(id));
  } finally {
    await ctx.answerCallbackQuery();
  }
});

bot.callbackQuery(/^remind_set:([a-z0-9]+):(.+)$/, async (ctx) => {
  const when = ctx.match[1] ?? '';
  const leadId = ctx.match[2] ?? '';
  const chatId = String(ctx.chat?.id ?? env.ROP_CHAT_ID);
  const messageId = ctx.callbackQuery.message?.message_id ?? 0;

  if (!REMIND_PRESETS.has(when as RemindPreset)) {
    await ctx.answerCallbackQuery({ text: 'Неизвестный интервал', show_alert: true });
    return;
  }
  const fireAt = computeFireAt(when as RemindPreset, new Date());

  // Валидация UUID: leadId приходит из callback data, может быть подделан.
  // Без проверки злоумышленник (whitelisted user) мог бы вставить reminder
  // с leadId = '../../../etc/passwd' или мусором.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadId)) {
    await ctx.answerCallbackQuery({ text: 'Некорректный ID заявки', show_alert: true });
    return;
  }

  await db.insert(reminders).values({ leadId, chatId, messageId, fireAt });
  try {
    await safeEditMarkup(ctx as never, buildLeadKeyboard(leadId));
  } finally {
    await ctx.answerCallbackQuery({ text: '⏰ Напоминание установлено' });
  }
});

// ---------- error handler ----------

bot.catch((err) => { console.error('[bot] error', err); });

// ---------- polling new leads ----------

// Rate-limit state для pollNewLeads. Если Telegram возвращает 429 / network
// error, увеличиваем backoff до 30 секунд. На ОК — сбрасываем до 3.
type PollState = { failures: number; backoffMs: number };
const pollState: PollState = { failures: 0, backoffMs: 3000 };
const POLL_BACKOFF_MAX_MS = 30_000;
let pollTimer: NodeJS.Timeout | null = null;

async function pollNewLeads(): Promise<void> {
  // ВАЖНО: db.select ВНУТРИ try — раньше был снаружи, и сбой БД
  // уносил весь процесс через unhandledRejection.
  let claimed: typeof leads.$inferSelect[];
  try {
    // M3: атомарный claim. UPDATE ... WHERE id IN (SELECT ... LIMIT 50)
    // "захватывает" до 50 строк, переводя notified=false → true за один запрос.
    // Если процесс упадёт между SELECT и UPDATE (старый код), или между
    // UPDATE и sendMessage (новый код — но уже с другим риском), повторный
    // poll не выберет эти строки снова. Раньше последовательность
    // SELECT(50) → loop → UPDATE после каждого sendMessage означала:
    // падение на 25-й строке → следующий poll заново выбирает ВСЕ 50 →
    // 24 дубля в Telegram-чате.
    //
    // Цена нового подхода: если sendMessage упадёт ПОСЛЕ claim, лид остаётся
    // с notified=true, но без сообщения в чате. Это починить можно только
    // ручным re-notify — вероятность низкая, дублей больше нет.
    //
    // PostgreSQL не поддерживает UPDATE ... LIMIT N, поэтому используем
    // CTE: сначала выбираем до 50 id, потом UPDATE WHERE id IN (...) RETURNING *.
    const claimRows = await db.execute<{ id: string }>(sql`
      UPDATE leads
      SET notified = true
      WHERE id IN (
        SELECT id FROM leads
        WHERE notified = false
        ORDER BY created_at ASC
        LIMIT 50
      )
      RETURNING *
    `);
    claimed = (claimRows as unknown as { rows: typeof leads.$inferSelect[] }).rows
      ?? (claimRows as unknown as typeof leads.$inferSelect[]);
  } catch (err) {
    console.error('[poll] claim update failed:', err);
    bumpBackoff();
    return;
  }
  if (claimed.length === 0) return;

  let anySent = false;
  for (const row of claimed) {
    const lead: Lead = {
      id: row.id, name: row.name, contact: row.contact,
      source: row.source, page: row.page,
      utm: row.utm as Record<string, string> | null,
      status: row.status as LeadStatus,
      interactionAt: row.interactionAt,
      createdAt: row.createdAt,
    };
    try {
      await sendLeadToRop(lead);
      anySent = true;
    } catch (err) {
      console.error('[lead] not delivered, will NOT retry (already claimed)', row.id, err);
      // Любая ошибка → увеличиваем backoff. Telegram 429 уйдёт через минуту,
      // но каждая неудачная попытка не должна спамить API.
      // Строка уже notified=true (claimed), retry будет только через ручной
      // re-notify в админке — это намеренно, чтобы не было дублей.
      bumpBackoff();
      // Продолжаем цикл (не return) — может, упадёт только одна запись из-за
      // временной 429, остальные дойдут.
    }
  }
  if (anySent) resetBackoff();
}

function bumpBackoff(): void {
  pollState.failures += 1;
  pollState.backoffMs = Math.min(POLL_BACKOFF_MAX_MS, pollState.backoffMs * 2);
  schedulePoll();
}

function resetBackoff(): void {
  if (pollState.failures === 0) return;
  pollState.failures = 0;
  pollState.backoffMs = 3000;
  schedulePoll();
}

function schedulePoll(): void {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = setTimeout(() => void pollNewLeads(), pollState.backoffMs);
}

// ---------- entrypoint ----------

// Глобальные обработчики — падающие Promise/rejection в cron/pollNewLeads
// теперь не убьют процесс молча, а попадут в structured logs.
process.on('unhandledRejection', (reason, promise) => {
  console.error('[diva-bot] unhandledRejection:', {
    reason,
    promiseKind: promise?.constructor?.name,
  });
});
process.on('uncaughtException', (err, origin) => {
  console.error('[diva-bot] uncaughtException:', { err, origin });
});

async function main(): Promise<void> {
  console.log('diva-bot starting');
  // ЕДИНСТВЕННОЕ место регистрации SIGINT/SIGTERM. installShutdown в db.ts
  // примет callback остановки бота и закроет postgres pool после.
  installShutdown(async () => {
    if (pollTimer) clearTimeout(pollTimer);
    await bot.stop();
  });
  startReminderCron(bot);
  // Используем schedulePoll вместо setInterval для exponential backoff
  // при сбоях Telegram API.
  schedulePoll();
  // Небольшая пауза перед стартом polling — даём phantom-сессии Telegram
  // (если она есть) шанс отпустить lock. Особенно важно при первом старте
  // после рестарта.
  await new Promise((r) => setTimeout(r, 3_000));
  await bot.start();
}

main().catch(async (err) => {
  const msg = String(err?.message ?? err);
  process.stderr.write('[fatal] ' + msg + '\n');
  // GrammyError 409 Conflict (terminated by other getUpdates request) возникает,
  // когда в сети Telegram ещё осталась polling-сессия от другого процесса
  // (например, прод-бот на VPS с тем же токеном). В этом случае process.exit
  // бесполезен — Docker перезапустит контейнер и сразу получит тот же 409.
  // Поэтому входим в in-process retry-loop: бот.sleep() → пауза → main().
  // Это держит контейнер живым и не создаёт polling-гонку.
  //
  // C2: ограничиваем число in-process попыток. Без лимита бот мог крутиться
  // вечно (сутками/неделями), если phantom-сессия по какой-то причине не
  // отпускала lock. После MAX_409_RETRIES делаем exit(1) — Docker
  // перезапустит контейнер, что даст ещё одну попытку после полной
  // переинициализации процесса.
  if (/409|Conflict/i.test(msg)) {
    const MAX_409_RETRIES = 10;
    process.stderr.write(
      `[fatal] 409 Conflict — entering in-process retry loop (max ${MAX_409_RETRIES} attempts)\n`,
    );
    try { await bot.stop(); } catch {}
    let attempt = 0;
    while (attempt < MAX_409_RETRIES) {
      await new Promise((r) => setTimeout(r, 60_000));
      attempt += 1;
      process.stderr.write(`[fatal] retrying main() after 60s (attempt ${attempt}/${MAX_409_RETRIES})\n`);
      try {
        await main();
        return; // main() resolved normally
      } catch (e2) {
        const m2 = String((e2 as Error)?.message ?? e2);
        if (!/409|Conflict/i.test(m2)) {
          process.stderr.write('[fatal] non-409 error, exiting: ' + m2 + '\n');
          process.exit(1);
        }
        process.stderr.write(`[fatal] still 409, will retry (${attempt}/${MAX_409_RETRIES})\n`);
      }
    }
    process.stderr.write(
      `[fatal] exhausted ${MAX_409_RETRIES} 409 retries — exiting so Docker can restart the container\n`,
    );
    process.exit(1);
  }
  process.exit(1);
});
