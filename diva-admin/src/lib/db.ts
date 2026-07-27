/**
 * Diva Admin - Database Connection
 * Uses the shared db/schema.ts as the single source of truth.
 *
 * DATABASE_URL is read lazily (on first real use), not at module import time.
 * `next build` imports every route module to collect page/route metadata —
 * if this threw at import time, the build would fail on any machine without
 * DATABASE_URL set at build stage (it's only injected at runtime via compose).
 * See DEPLOY-BLOCKERS.md, блокер 4.
 *
 * Таймауты:
 *   - statement_timeout (default 15s) — убивает зависший SELECT/UPDATE.
 *   - idle_in_transaction_session_timeout (default 60s) — закрывает забытые транзакции.
 * Переопределяются через env:
 *   ADMIN_DB_STATEMENT_TIMEOUT_MS, ADMIN_DB_IDLE_IN_TXN_TIMEOUT_MS.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from '@db/schema';

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

function getDb() {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const statementTimeoutMs = Number(process.env.ADMIN_DB_STATEMENT_TIMEOUT_MS ?? 15_000);
  const idleInTxnTimeoutMs = Number(process.env.ADMIN_DB_IDLE_IN_TXN_TIMEOUT_MS ?? 60_000);

  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => { /* swallow NOTICE */ },
  });

  _db = drizzle(client, { schema });

  // Поскольку postgres-js использует пул соединений, нет способа поставить
  // SET-параметры на каждое соединение без хака. Прагматичное решение:
  // выставляем через текущее соединение один раз. Значения применяются
  // только к тому соединению, через которое выполнится init — на остальные
  // не распространяется. Для production лучше ADMIN_DB_STATEMENT_TIMEOUT_MS
  // задавать через DATABASE_URL (?statement_timeout=...).
  //
  // Альтернатива: SET LOCAL внутри каждой транзакции. Используем в критичных
  // местах через `db.execute(sql\`SET LOCAL ...\`)`.
  void _db.execute(
    sql.raw(
      `SET statement_timeout = ${statementTimeoutMs}; ` +
      `SET idle_in_transaction_session_timeout = ${idleInTxnTimeoutMs};`,
    ),
  ).catch((err) => {
    // не критично, лог
    console.warn('[db] failed to apply session timeouts:', err);
  });

  return _db;
}

// Proxy defers getDb() (и проверку DATABASE_URL + postgres()) до первого обращения.
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export type DB = typeof db;