import type { Bot } from 'grammy';
import { db, reminders, leads, leadNotes } from './db.js';
import { eq, lte, and } from 'drizzle-orm';
import { formatLeadCard, withStatusFooter, withNotesFooter, formatMoscowTimeExport } from './lead-handler.js';
import type { Lead } from './types.js';

export function startReminderCron(bot: Bot): void {
  setInterval(() => void checkReminders(bot), 60_000);
  console.log('[cron] reminder cron started');
}

async function checkReminders(bot: Bot): Promise<void> {
  const due = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.sent, false), lte(reminders.fireAt, new Date())));

  for (const reminder of due) {
    try {
      const [lead] = await db.select().from(leads).where(eq(leads.id, reminder.leadId));
      if (!lead) continue;

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

      await db.update(reminders).set({ sent: true }).where(eq(reminders.id, reminder.id));
    } catch (err) {
      console.error('[cron] reminder send failed', err);
    }
  }
}
