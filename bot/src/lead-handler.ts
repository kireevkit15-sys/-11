import type { Lead, LeadNote } from './types.js';

function escapeHtml(value: string): string {
  // Full HTML escape: & < > " '. Telegram в parse_mode=HTML парсит и атрибуты,
  // и контент. Без escape ' / " пользовательский ввод мог бы сломать форматирование
  // (например, имя `O'Brien` или контакт `tex<strong>t</strong>`).
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Жёсткий лимит на длину пользовательского ввода — Telegram отправляет
// текст до 4096 символов, но мы не хотим рендерить 4000 символов в один alert.
const MAX_USER_TEXT_LEN = 500;
function safeUserText(value: string): string {
  // Итерируемся по code points (Array.from), чтобы slice не разорвал
  // суррогатную пару эмодзи или символ кириллицы/китайского посередине.
  // Старый код: value.slice(0, 500) — UTF-16 кодовые единицы, мог отрезать
  // половину суррогата → битый символ в чате. (M5)
  const chars = Array.from(value);
  if (chars.length <= MAX_USER_TEXT_LEN) return value;
  return chars.slice(0, MAX_USER_TEXT_LEN).join('') + '…';
}

function formatMoscowTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')}.${get('month')}.${get('year')} ${get('hour')}:${get('minute')} МСК`;
}

function formatUtm(utm: Lead['utm']): string {
  if (!utm) return '—';
  const source = utm['utm_source'] ?? '—';
  const campaign = utm['utm_campaign'] ?? '—';
  return `utm_source=${source} | utm_campaign=${campaign}`;
}

export const STATUS_LABELS: Record<Lead['status'], string> = {
  new: '🆕 новая',
  in_progress: '🔄 в работе',
  interaction_scheduled: '📞 взаимодействие назначено',
  spam: '⛔ спам',
  converted: '✅ сконвертирована',
};

const TIME_LABELS: Record<string, string> = {
  morning: 'утром (09–12)',
  day: 'днём (12–17)',
  evening: 'вечером (17–20)',
};

export function formatLeadCard(lead: Lead): string {
  const preferredTime = lead.utm?.['preferred_time'];
  const timeLabel = preferredTime ? (TIME_LABELS[preferredTime] ?? preferredTime) : '—';

  const lines = [
    '🔔 <b>Новая заявка</b>',
    `<b>Имя:</b> ${escapeHtml(safeUserText(lead.name))}`,
    `<b>Контакт:</b> ${escapeHtml(safeUserText(lead.contact))}`,
    `<b>Удобное время:</b> ${escapeHtml(timeLabel)}`,
    `<b>Источник:</b> ${escapeHtml(lead.source ?? '—')}`,
    `<b>Время заявки:</b> ${escapeHtml(formatMoscowTime(lead.createdAt))}`,
  ];
  return lines.join('\n');
}

export function withStatusFooter(
  card: string,
  status: Lead['status'],
  actor?: string,
  interactionAt?: Date | null,
): string {
  // diva-admin пишет в БД статусы из расширенного списка (включая 'lost'),
  // а Lead['status'] их не покрывает. Если лид в этом "чужом" статусе
  // попадает в бота (например, через cron-reminder), STATUS_LABELS[status]
  // даст undefined → escapeHtml упадёт. Fallback на сырой статус. (M7)
  const label = STATUS_LABELS[status] ?? status;
  const by = actor ? ` (@${escapeHtml(actor)})` : '';
  let footer = `\n\n<b>Статус:</b> ${escapeHtml(label)}${by}`;
  if (status === 'interaction_scheduled' && interactionAt) {
    footer += `\n<b>Взаимодействие:</b> ${escapeHtml(formatMoscowTime(interactionAt))}`;
  }
  return `${card}${footer}`;
}

export function withNotesFooter(card: string, notes: LeadNote[]): string {
  if (notes.length === 0) return card;
  const notesText = notes
    .map((n) => `• ${escapeHtml(safeUserText(n.text))} <i>(@${escapeHtml(n.author)})</i>`)
    .join('\n');
  return `${card}\n\n<b>Заметки:</b>\n${notesText}`;
}

export function formatMoscowTimeExport(date: Date): string {
  return formatMoscowTime(date);
}
