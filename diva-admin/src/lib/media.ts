/**
 * Резолвит URL изображения для превью в админке.
 *
 * В админке (admin.diva-start-up.ru) и на сайте (diva-start-up.ru) разные
 * Caddy-origin'ы. Файлы team/, case-studies/, partners/, videos/ лежат в
 * web-standalone (`/app/web/public/`), доступны только через публичный домен.
 * А файлы /uploads/* отдаются обоими origin через Caddy file_server.
 *
 * Поэтому:
 *   - относительный путь вида `/team/....jpg` или `/uploads/....png` →
 *     превращаем в абсолютный через PUBLIC_SITE_URL;
 *   - абсолютный http/https — оставляем как есть.
 *
 * Поиск base URL в порядке приоритета:
 *   1. window.location.origin — на client (если origin админки сам умеет отдать файлы,
 *      например через Caddy file_server для /uploads/*, мы всё равно предпочитаем сайт
 *      чтобы кэш фото был общий между админкой и сайтом);
 *   2. process.env.NEXT_PUBLIC_SITE_URL — на SSR/client, инлайнится webpack'ом;
 *   3. захардкоженный fallback на продовый домен;
 *   4. если ничего — оставляем относительный (на dev).
 *
 * Захардкоженный fallback нужен потому, что webpack DefinePlugin для
 * NEXT_PUBLIC_* иногда даёт undefined в standalone-сборке (см. memory:
 * `diva_visual_direction` → раздел про env-инлайн). Хардкод — последняя
 * линия обороны.
 */
const FALLBACK_SITE_URL = 'https://diva-start-up.ru';

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (!url.startsWith('/')) return url;

  let base =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SITE_URL) ||
    '';
  // Клиент: пробуем инжектнуть base из window, если он совпадает с продовым
  // паттерном. Иначе используем fallback.
  if (!base && typeof window !== 'undefined') {
    // Если мы уже на продовом админ-домене — путь /team/* надо брать с сайта,
    // не с админки (там этих файлов нет). Поэтому используем захардкоженный
    // продовый домен.
    if (window.location.hostname.endsWith('diva-start-up.ru')) {
      base = FALLBACK_SITE_URL;
    } else {
      // На dev — используем текущий origin (там vite/webdev отдаёт /public).
      base = window.location.origin;
    }
  }
  if (!base) base = FALLBACK_SITE_URL;
  return `${base.replace(/\/$/, '')}${url}`;
}
