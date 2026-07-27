import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env.js';
import { leads, leadNotes, reminders, clients } from './schema.js';

// connect_timeout: 10 — без него, если postgres не отвечает (БД лежит,
// firewall блокирует), висим бесконечно. 10с даёт шанс упасть в retry-loop
// pollNewLeads, который через bumpBackoff() сделает следующую попытку через
// 60с. (M6)
const client = postgres(env.DATABASE_URL, { max: 5, idle_timeout: 30, connect_timeout: 10 });
export const db = drizzle(client, { schema: { leads, leadNotes, reminders, clients } });

// Re-export для обратной совместимости с другими модулями бота.
export { leads, leadNotes, reminders, clients };

/**
 * Graceful shutdown: закрыть соединения postgres перед выходом.
 * Без этого после SIGTERM в логе остаются "connection terminated" от postgres
 * и теряются in-flight запросы.
 *
 * `onSignal` — опциональный колбэк остановки внешних ресурсов (например,
 * grammY bot). Вызывается ДО закрытия postgres, чтобы бот успел
 * завершить текущий update. Если колбэк бросит — ловим и идём дальше.
 *
 * Регистрирует обработчики SIGINT/SIGTERM ОДИН раз за процесс. Раньше
 * параллельно дублировались в index.ts — process.once позволял обоим
 * сработать, что приводило к двойному bot.stop() + двойному exit().
 */
let shutdownHandlerInstalled = false;
export function installShutdown(onSignal?: () => Promise<unknown> | unknown): void {
  if (shutdownHandlerInstalled) return;
  shutdownHandlerInstalled = true;
  const close = async (signal: NodeJS.Signals) => {
    console.log(`[db] received ${signal}, stopping bot and closing postgres pool`);
    if (onSignal) {
      try {
        await Promise.race([
          Promise.resolve(onSignal()),
          new Promise((r) => setTimeout(r, 5_000)),
        ]);
      } catch (err) {
        console.error('[db] shutdown onSignal error', err);
      }
    }
    try {
      await client.end({ timeout: 5 });
    } catch (err) {
      console.error('[db] shutdown error', err);
    }
  };
  process.once('SIGINT', () => {
    void close('SIGINT').then(() => process.exit(0));
  });
  process.once('SIGTERM', () => {
    void close('SIGTERM').then(() => process.exit(0));
  });
}