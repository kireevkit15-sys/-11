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
 *
 * ВАЖНО: в проекте есть middleware.ts — Next.js ТАКЖЕ собирает instrumentation
 * в Edge runtime. В Edge нет глобального `process`, и без раннего return на
 * `NEXT_RUNTIME === 'edge'` модуль падает с "process.on is not a function".
 * Прямой `export const runtime = 'nodejs'` в instrumentation.ts НЕ поддерживается
 * Next.js — runtime фиксируется только для page/layout. Корректный способ —
 * ранний return по `process.env.NEXT_RUNTIME`.
 */

export async function register() {
  // В Edge runtime instrumentation грузится только ради 'register', но API Node
  // там недоступно. Ранний выход до любых обращений к process.
  if (typeof process === 'undefined') return;
  if (process.env.NEXT_RUNTIME === 'edge') return;

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