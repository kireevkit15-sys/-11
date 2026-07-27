/**
 * Web — глобальные обработчики непойманных ошибок.
 *
 * Аналог instrumentation.ts для diva-admin. Регистрирует uncaughtException
 * и unhandledRejection, чтобы они попадали в structured logs.
 *
 * В production пишем в console.error (сборщик логов подхватит).
 */

export async function register() {
  if (process.env.NODE_ENV === 'development') {
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