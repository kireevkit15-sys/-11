/**
 * Diva Admin — агрегация статистики по заявкам (CRM) для дашборда и /api/stats.
 * Все запросы безопасны при пустой БД и недоступности соединения.
 */

import { db } from '@/lib/db';
import { count, gte, sql } from 'drizzle-orm';
import { leads } from '@db/schema';
import { LEAD_STATUS_ORDER, type LeadStatus } from '@/app/admin/leads/status';

export type LeadsByStatus = Record<LeadStatus, number>;

export interface LeadsByDayPoint {
  /** Дата в формате YYYY-MM-DD. */
  day: string;
  count: number;
}

export interface LeadStats {
  leadsByStatus: LeadsByStatus;
  leadsByDay: LeadsByDayPoint[];
  /** Процент converted от общего числа лидов (0 если лидов нет). */
  conversion: number;
}

/** Число дней в графике «новые заявки». */
export const LEADS_BY_DAY_RANGE = 14;

function emptyByStatus(): LeadsByStatus {
  return {
    new: 0,
    in_progress: 0,
    converted: 0,
    lost: 0,
    spam: 0,
  };
}

/** Формат YYYY-MM-DD из объекта Date (UTC-безопасно через локальные части). */
function formatDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Список из RANGE дней (включая сегодня), от старого к новому. */
function rangeDays(days: number): string[] {
  const result: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    result.push(formatDay(d));
  }
  return result;
}

/** Count по каждому статусу одним запросом GROUP BY. */
async function getLeadsByStatus(): Promise<LeadsByStatus> {
  const result = emptyByStatus();
  try {
    const rows = await db
      .select({ status: leads.status, c: count() })
      .from(leads)
      .groupBy(leads.status);
    for (const row of rows) {
      const status = row.status as LeadStatus;
      if (status in result) {
        result[status] = Number(row.c ?? 0);
      }
    }
  } catch {
    return emptyByStatus();
  }
  return result;
}

/** Новые заявки по дням за последние RANGE дней, нули добавляются на стороне JS. */
async function getLeadsByDay(days: number): Promise<LeadsByDayPoint[]> {
  const skeleton = rangeDays(days);
  const counts = new Map<string, number>();
  try {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const rows = await db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${leads.createdAt}), 'YYYY-MM-DD')`,
        c: count(),
      })
      .from(leads)
      .where(gte(leads.createdAt, since))
      .groupBy(sql`date_trunc('day', ${leads.createdAt})`);

    for (const row of rows) {
      if (row.day) counts.set(row.day, Number(row.c ?? 0));
    }
  } catch {
    // при ошибке вернём скелет с нулями
  }

  return skeleton.map((day) => ({ day, count: counts.get(day) ?? 0 }));
}

/** Полная статистика по заявкам для дашборда / API. */
export async function getLeadStats(): Promise<LeadStats> {
  const [leadsByStatus, leadsByDay] = await Promise.all([
    getLeadsByStatus(),
    getLeadsByDay(LEADS_BY_DAY_RANGE),
  ]);

  const total = LEAD_STATUS_ORDER.reduce((sum, s) => sum + leadsByStatus[s], 0);
  const conversion = total > 0 ? Math.round((leadsByStatus.converted / total) * 100) : 0;

  return { leadsByStatus, leadsByDay, conversion };
}
