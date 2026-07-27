import type { Bot } from 'grammy';
import { db, reminders, leads, leadNotes } from './db.js';
import { eq, lte, and, sql } from 'drizzle-orm';
import { formatLeadCard, withStatusFooter, withNotesFooter, formatMoscowTimeExport } from './lead-handler.js';
import type { Lead } from './types.js';

export function startReminderCron(bot: Bot): void {
  setInterval(() => void checkReminders(bot), 60_000);
  console.log('[cron] reminder cron started');
}

/**
 * Re-entrancy guard. setInterval может вызвать checkReminders повторно,
 * пока предыдущий тик ещё работает (например, БД тормозит, и мы упёрлись
 * в SELECT на 5+ секунд). Без guard'а накапливаются параллельные
 * попытки отправить один и тот же reminder, что приводит к дублям
 * в Telegram-чате. (H4)
 */
let isRunning = false;

async function checkReminders(bot: Bot): Promise<void> {
  if (isRunning) {
    console.warn('[cron] previous tick still running, skipping');
    return;
  }
  isRunning = true;
  try {
    await runCheckReminders(bot);
  } finally {
    isRunning = false;
  }
}

async function runCheckReminders(bot: Bot): Promise<void> {
  let due: typeof reminders.$inferSelect[];
  try {
    due = await db
      .select()
      .from(reminders)
      .where(and(eq(reminders.sent, false), lte(reminders.fireAt, new Date())))
      .limit(100);
  } catch (err) {
    console.error('[cron] db.select failed:', err);
    return;
  }

  for (const reminder of due) {
    // Skip stale reminders: если reminder старше 24 часов, но ещё не отправлен,
    // помечаем sent=true и пропускаем. Без этого бот спамил бы в нотификации
    // протухшие напоминания (DEPLOY-BLOCKERS, замечание 3).
    const ageMs = Date.now() - reminder.fireAt.getTime();
    if (ageMs > 24 * 60 * 60 * 1000) {
      try {
        await db.update(reminders).set({ sent: true }).where(eq(reminders.id, reminder.id));
      } catch (err) {
        console.error('[cron] failed to mark stale reminder sent', err);
      }
      continue;
    }

    let lead: typeof leads.$inferSelect | undefined;
    try {
      [lead] = await db.select().from(leads).where(eq(leads.id, reminder.leadId));
      if (!lead) {
        // Lead удалён — помечаем reminder как sent, чтобы не крутиться вечно.
        await db.update(reminders).set({ sent: true }).where(eq(reminders.id, reminder.id));
        console.warn('[cron] reminder for deleted lead, marked sent', reminder.id);
        continue;
      }

      const notes = await db.select().from(leadNotes).where(eq(leadNotes.leadId, lead.id));

      const typedLead: Lead = {
        id: lead.id,
        name: lead.name,
        contact: lead.contact,
        source: lead.source,
        page: lead.page,
        utm: lead.utm as Record<string, string> | null,
        status: lead.status as Lead['status'],
        interactionAt: lead.interactionAt,
        createdAt: lead.createdAt,
      };

      let card = formatLeadCard(typedLead);
      card = withStatusFooter(card, typedLead.status, undefined, typedLead.interactionAt);
      if (notes.length > 0) card = withNotesFooter(card, notes);

      await bot.api.sendMessage(
        reminder.chatId,
        `⏰ <b>Напоминание о заявке</b>\n\n${card}`,
        { parse_mode: 'HTML' },
      );

      // Помечаем sent=true ТОЛЬКО после успешной отправки. Если update упадёт —
      // reminder отправится повторно через минуту, но это лучше, чем тихо
      // терять напоминание. Дубль-сообщение в Telegram-чате лучше пропущенного.
      await db.update(reminders).set({ sent: true }).where(eq(reminders.id, reminder.id));
    } catch (err) {
      // H5: если Telegram вернул 403 (chat not found / bot blocked) или 400
      // (chat_id invalid) — это "мёртвый" chat. Без обработки бот будет
      // долбиться в API каждую минуту вечно (или до рестарта). Помечаем
      // reminder как sent, чтобы cron перестал его крутить.
      const e = err as { error_code?: number; description?: string; message?: string };
      const desc = `${e?.description ?? ''} ${e?.message ?? ''}`;
      const isDead =
        e?.error_code === 403 ||
        e?.error_code === 400 ||
        /chat not found|bot was blocked|chat_id is invalid|PEER_ID_INVALID|chat is deactivated/i.test(desc);
      if (isDead) {
        console.error('[cron] dead chatId, marking reminder sent', reminder.chatId, desc);
        try {
          await db.update(reminders).set({ sent: true }).where(eq(reminders.id, reminder.id));
        } catch (e2) {
          console.error('[cron] failed to mark dead-chat reminder sent', e2);
        }
        continue;
      }
      console.error('[cron] reminder send failed', reminder.id, err);
    }
  }
}
