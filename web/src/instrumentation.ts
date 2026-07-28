/**
 * Web — глобальные обработчики непойманных ошибок.
 *
 * Аналог instrumentation.ts для diva-admin. Регистрирует uncaughtException
 * и unhandledRejection, чтобы они попадали в structured logs.
 *
 * В production пишем в console.error (сборщик логов подхватит).
 *
 * На момент написания у web нет middleware.ts, и instrumentation загружается
 * только в Node runtime. Но мы всё равно делаем ранний return на Edge runtime —
 * на случай, если middleware появится позже (тот же bug уже сломал diva-admin).
 */

export async function register() {
  if (typeof process === 'undefined') return;
  if (process.env.NEXT_RUNTIME === 'edge') return;

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