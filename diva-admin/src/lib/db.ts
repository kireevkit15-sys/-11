/**
 * Diva Admin - Database Connection
 * Uses the shared db/schema.ts as the single source of truth.
 *
 * DATABASE_URL is read lazily (on first real use), not at module import time.
 * `next build` imports every route module to collect page/route metadata —
 * if this threw at import time, the build would fail on any machine without
 * DATABASE_URL set at build stage (it's only injected at runtime via compose).
 * See DEPLOY-BLOCKERS.md, блокер 4.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@db/schema';

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

function getDb() {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  _db = drizzle(client, { schema });
  return _db;
}

// Proxy defers getDb() (and therefore the DATABASE_URL check + postgres()
// connection) until the first property access — e.g. `db.query...` or
// `db.select()` inside a request handler, never at import time.
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export type DB = typeof db;
