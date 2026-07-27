/**
 * DIVA — client-side contact validation
 *
 * Шарится между формами заявки (consult-modal.tsx, footer.tsx).
 * Серверная проверка в web/src/app/api/leads/route.ts — главная;
 * эта — для UX (моментальная обратная связь без round-trip).
 * Формат принимает телефон или Telegram (см. DEPLOY-BLOCKERS (4).md,
 * замечание 8): без этого в CRM попадал мусор вроде «+7777».
 */
export function isValidContact(value: string): boolean {
  const v = value.trim()
  if (v.length < 3 || v.length > 120) return false

  // телефон: "+7", цифра в начале, всего 7+ цифр, разделители -/()
  if (/^\+?[0-9][0-9\s()-]{6,}$/.test(v)) return true

  // @username Telegram (правила Telegram: латиница, 5–32 символа,
  // начинается с буквы; @ опционален)
  if (/^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(v)) return true

  // ссылка вида t.me/username (https опционален)
  if (/(?:^|t\.me\/)[a-zA-Z][a-zA-Z0-9_]{4,31}$/i.test(v)) return true

  // email (для footer-формы «получить чек-лист»)
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return true

  return false
}