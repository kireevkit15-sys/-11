/**
 * Web — глобальные обработчики непойманных ошибок.
 *
 * Аналог instrumentation.ts для diva-admin. Регистрирует uncaughtException
 * и unhandledRejection, чтобы они попадали в structured logs.
 *
 * В production пишем в console.error (сборщик логов подхватит).
 *
 * На момент написания у web нет middleware.ts, и instrumentation загружается
 * только в Node runtime. Но мы фиксируем runtime явно и проверяем `process`,
 * чтобы при добавлении middleware в будущем не словить ту же ошибку, что в
 * diva-admin ("process.on is not a function" в Edge runtime).
 */

export const runtime = 'nodejs';

export async function register() {
  if (typeof process === 'undefined') return;
  if (process.env?.NODE_ENV === 'development') {
    return;
  }

  process.on('uncaughtException', (err, origin) => {
    console.error('[DIVA-WEB] uncaughtException:', { err, origin });
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[DIVA-WEB] unhandledRejection:', {
      reason,
      promiseKind: promise?.constructor?.name,
    });
  });
}