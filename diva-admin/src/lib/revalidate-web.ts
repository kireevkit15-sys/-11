/**
 * Diva Admin — webhook для on-demand revalidation web-сайта.
 *
 * После успешной мутации (POST/PUT/DELETE/reorder) admin шлёт web'у
 * запрос на сброс ISR-кеша. Web немедленно перерендерит затронутые
 * страницы и теги, без 60-секундного ожидания.
 *
 * Design choices:
 *   - Fire-and-forget: вызывающий код не блокируется на ответе web'а.
 *     Если web недоступен — логируем warning, но save-операция не ломается.
 *     ISR-кеш — это ускорение, не источник истины (БД — истина).
 *   - Timeout: 2 секунды. Webhook не должен задерживать API-ответ admin'а.
 *   - Конфиг из entities.ts: `revalidatePaths` + `revalidateTags`.
 *     Если у сущности нет этих полей (например, admin_users) — revalidate
 *     не вызывается вообще.
 *   - Авторизация: общий REVALIDATE_SECRET в заголовке x-revalidate-secret.
 *     Секреты должны совпадать в diva-admin и web env.
 */

import { ENTITIES } from '@/lib/entities';

const TIMEOUT_MS = 2_000;

interface RevalidateOptions {
  paths?: readonly string[];
  tags?: readonly string[];
}

/**
 * Сырая функция — отправляет POST на web /api/revalidate.
 * Используется напрямую (для тестов или admin-tools), и через
 * revalidateFromEntity() для типичной мутации.
 */
export async function triggerWebRevalidate(
  entitySlug: string,
  opts: RevalidateOptions = {},
): Promise<{ ok: boolean; status?: number }> {
  const url = process.env.NEXT_PUBLIC_WEB_REVALIDATE_URL;
  const secret = process.env.WEB_REVALIDATE_SECRET;

  if (!url || !secret) {
    console.warn(
      '[revalidate] NEXT_PUBLIC_WEB_REVALIDATE_URL / WEB_REVALIDATE_SECRET not set; ' +
        `skip revalidate for ${entitySlug}`,
    );
    return { ok: false };
  }

  const payload = {
    paths: Array.from(opts.paths ?? []),
    tags: Array.from(opts.tags ?? [`cms:${entitySlug}`]),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      // Не задерживать ответ admin — вызывающий код сам не ждёт.
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn(`[revalidate] web responded ${res.status} for ${entitySlug}:`, text);
      return { ok: false, status: res.status };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    console.warn(`[revalidate] failed for ${entitySlug} (web down?):`, err);
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Хук, который вызывают API-роуты после успешной мутации.
 * Берёт paths/tags из реестра сущности и шлёт их в web.
 *
 * Использование в роуте:
 *   revalidateFromEntity(slug);  // после audit log, не await.
 *
 * Не await'им — нам не нужно ждать ответа web'а в критическом пути save.
 * Ошибка запишется в логи для диагностики, но клиент получит свой
 * 200 быстро.
 */
export function revalidateFromEntity(slug: string): void {
  const entity = ENTITIES[slug];
  // Если у сущности нет revalidate-конфига — пропускаем.
  // Например, admin_users не должны триггерить перерендер web'а.
  if (!entity || !entity.revalidatePaths?.length) return;

  const tags = entity.revalidateTags?.length
    ? entity.revalidateTags
    : [`cms:${slug}`];

  // Fire-and-forget — намеренно не await.
  void triggerWebRevalidate(slug, {
    paths: entity.revalidatePaths,
    tags,
  });
}
