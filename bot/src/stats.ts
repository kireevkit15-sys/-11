import { db, leads } from './db.js';
import { count, gte } from 'drizzle-orm';

function getMoscowDayStart(): Date {
  const now = new Date();
  const moscowOffset = 3 * 60;
  const utcMinutes = now.getTime() / 60000;
  const moscowMinutes = utcMinutes + moscowOffset;
  const dayStart = Math.floor(moscowMinutes / (24 * 60)) * 24 * 60 - moscowOffset;
  return new Date(dayStart * 60000);
}

export async function buildStatsText(): Promise<string> {
  const start = getMoscowDayStart();

  const [todayRows, totalRows] = await Promise.all([
    db.select({ c: count() }).from(leads).where(gte(leads.createdAt, start)),
    db.select({ c: count() }).from(leads),
  ]);

  const today = todayRows[0]?.c ?? 0;
  const total = totalRows[0]?.c ?? 0;
  const updated = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

  return (
    `📊 <b>Статистика ДИВА</b>\n\n` +
    `<b>Заявок сегодня:</b> ${today}\n` +
    `<b>Заявок всего:</b> ${total}\n\n` +
    `<i>Обновлено: ${updated} МСК</i>`
  );
}
