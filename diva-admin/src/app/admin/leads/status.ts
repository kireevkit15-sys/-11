/**
 * Diva Admin — статусы заявок (CRM). Единый источник цветов/подписей.
 *
 * Значения должны совпадать с CHECK-ограничением leads_status_check в БД
 * (см. db/init.sql:21): 6 статусов, включая 'interaction_scheduled'
 * (пишется ботом при планировании звонка/встречи).
 */

export type LeadStatus =
  | 'new'
  | 'in_progress'
  | 'interaction_scheduled'
  | 'converted'
  | 'lost'
  | 'spam';

export interface StatusMeta {
  label: string;
  /** Классы tailwind для бейджа-пилюли. */
  badge: string;
}

export const LEAD_STATUSES: Record<LeadStatus, StatusMeta> = {
  new: {
    label: 'Новая',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  },
  in_progress: {
    label: 'В работе',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  interaction_scheduled: {
    label: 'Встреча назначена',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  },
  converted: {
    label: 'Клиент',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  lost: {
    label: 'Потерян',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
  spam: {
    label: 'Спам',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  },
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  'new',
  'in_progress',
  'interaction_scheduled',
  'converted',
  'lost',
  'spam',
];

/** Whitelist для серверной валидации переходов статуса. */
export const ALLOWED_LEAD_STATUSES: ReadonlySet<LeadStatus> = new Set(LEAD_STATUS_ORDER);

export function statusMeta(status: string | null | undefined): StatusMeta {
  if (status && status in LEAD_STATUSES) return LEAD_STATUSES[status as LeadStatus];
  return { label: status ? String(status) : '—', badge: 'bg-slate-100 text-slate-600' };
}

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && ALLOWED_LEAD_STATUSES.has(value as LeadStatus);
}