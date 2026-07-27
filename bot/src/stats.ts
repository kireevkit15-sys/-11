import { db, leads } from './db.js';
import { count, gte } from 'drizzle-orm';

/**
 * Начало сегодняшнего дня по Москве (UTC+3) — вычисляем через Intl,
 * а не через фиксированный offset, потому что IANA TZ правильнее в
 * переходные периоды и DST (исторически Москва была +4 летом).
 *
 * Возвращаем Date в UTC, от которого Drizzle отнимет `created_at` для фильтра.
 */
function getMoscowDayStart(): Date {
  // Берём now в московском TZ, отрезаем время, потом переводим обратно в Date.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === 'year')?.value ?? '1970');
  const month = Number(parts.find((p) => p.type === 'month')?.value ?? '01');
  const day = Number(parts.find((p) => p.type === 'day')?.value ?? '01');
  // 00:00:00 по Москве = предыдущий день 21:00 UTC.
  // Считаем через Date.UTC, потом subtract 3 часа.
  const utcStart = Date.UTC(year, month - 1, day, 0, 0, 0);
  return new Date(utcStart - 3 * 60 * 60 * 1000);
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
