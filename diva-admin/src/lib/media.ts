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
 *     превращаем в абсолютный через NEXT_PUBLIC_SITE_URL;
 *   - абсолютный http/https — оставляем как есть.
 *
 * На SSR-стороне возвращаем relative путь как есть (для случая, когда
 * NEXT_PUBLIC_SITE_URL не задан в dev).
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  // Относительный путь — резолвим через публичный домен сайта.
  if (url.startsWith('/')) {
    const base = process.env.NEXT_PUBLIC_SITE_URL || '';
    return base ? `${base.replace(/\/$/, '')}${url}` : url;
  }
  return url;
}