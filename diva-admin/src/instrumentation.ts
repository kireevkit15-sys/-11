/**
 * Diva Admin — глобальные обработчики непойманных ошибок.
 *
 * Без этого падающий unhandledRejection в Server Component / route handler
 * уходит в Vercel/Node stderr без структурированного уведомления и без
 * возможности отдать 500 пользователю.
 *
 * Регистрируем:
 *   - process.on('uncaughtException')       — синхронные crash'и.
 *   - process.on('unhandledRejection')      — необработанные Promise rejection.
 *
 * В production пишем в console.error (сборщик логов подхватит).
 * НЕ делаем process.exit(1) после unhandledRejection — Next runtime сам решает,
 * когда упасть, иначе можно прервать обработку текущего запроса на полпути.
 */

export async function register() {
  if (process.env.NODE_ENV === 'development') {
    return; // dev-режим достаточно тихий, не дублируем вывод
  }

  process.on('uncaughtException', (err, origin) => {
    console.error('[DIVA-ADMIN] uncaughtException:', { err, origin });
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[DIVA-ADMIN] unhandledRejection:', {
      reason,
      // Не выводим весь promise (он большой), только тип
      promiseKind: promise?.constructor?.name,
    });
  });
}