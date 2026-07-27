/**
 * Diva Admin — защита от брутфорса с persistent storage в PostgreSQL.
 * Используем таблицу login_attempts, поэтому лимиты переживают рестарт контейнера
 * и работают корректно при нескольких репликах.
 *
 * Схема (см. db/init.sql и db/migrations/0002_*):
 *   login_attempts(
 *     key           text        PRIMARY KEY,    -- составной ключ "email|ip"
 *     failure_count integer     NOT NULL DEFAULT 0,  -- счётчик в окне
 *     first_failure_at timestamptz NOT NULL DEFAULT now(),  -- начало окна
 *     blocked_until timestamptz                 -- NULL = не заблокирован
 *   )
 *
 * Fail-CLOSED: при сбое БД функции возвращают «заблокировано» (см. loginRateStatus).
 * Это критично — иначе атакующий через DDoS/сбой БД обходит rate-limit.
 *
 * Предыдущая версия использовала CTE с INSERT одной строки на ключ + count() —
 * при дубликате PK возникал конфликт, count() считал неправильно,
 * и блок срабатывал только теоретически. Текущая версия использует
 * UPSERT с инкрементом счётчика — атомарно и без гонок.
 */

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

const WINDOW_MS = 15 * 60 * 1000;       // окно учёта попыток
const MAX_FAILURES = 8;                 // допустимо неудач в окне
const COOLDOWN_MS = 15 * 60 * 1000;     // блок после превышения

export interface RateStatus {
  blocked: boolean;
  retryAfterSec: number;
}

/**
 * Возвращает текущее состояние блокировки для ключа.
 * Fail-CLOSED: при сбое БД возвращаем «заблокировано».
 */
export async function loginRateStatus(key: string): Promise<RateStatus> {
  try {
    const rows = await db.execute<{ blocked_until: string | null }>(sql`
      SELECT blocked_until
      FROM login_attempts
      WHERE key = ${key}
        AND blocked_until IS NOT NULL
        AND blocked_until > now()
      LIMIT 1
    `);
    const row = (rows as unknown as { rows?: Array<{ blocked_until: string }> }).rows?.[0];
    if (row) {
      const blockedUntil = new Date(row.blocked_until).getTime();
      const retryAfterSec = Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000));
      return { blocked: true, retryAfterSec };
    }
    return { blocked: false, retryAfterSec: 0 };
  } catch (err) {
    console.error('[rate-limit] status check failed (fail-closed):', err);
    return { blocked: true, retryAfterSec: 60 };
  }
}

/**
 * Регистрирует неудачную попытку.
 *
 * Алгоритм (атомарный, через UPSERT):
 *   1. Если строки нет — создаём со счётчиком 1, окном now().
 *   2. Если строка есть и first_failure_at в окне — инкрементируем счётчик.
 *      Если счётчик >= MAX_FAILURES — выставляем blocked_until = now() + COOLDOWN_MS.
 *   3. Если first_failure_at вне окна — сбрасываем окно (счётчик = 1).
 *
 * Возвращает обновлённое состояние, чтобы вызывающий мог сразу вернуть retryAfter.
 */
export async function recordLoginFailure(key: string): Promise<RateStatus> {
  try {
    const rows = await db.execute<{
      failure_count: number;
      blocked_until: string | null;
    }>(sql`
      INSERT INTO login_attempts (key, failure_count, first_failure_at)
      VALUES (${key}, 1, now())
      ON CONFLICT (key) DO UPDATE
        SET failure_count = CASE
              WHEN login_attempts.first_failure_at > now() - (${WINDOW_MS}::int * INTERVAL '1 millisecond')
                THEN login_attempts.failure_count + 1
              ELSE 1
            END,
            first_failure_at = CASE
              WHEN login_attempts.first_failure_at > now() - (${WINDOW_MS}::int * INTERVAL '1 millisecond')
                THEN login_attempts.first_failure_at
              ELSE now()
            END,
            blocked_until = CASE
              WHEN (
                CASE
                  WHEN login_attempts.first_failure_at > now() - (${WINDOW_MS}::int * INTERVAL '1 millisecond')
                    THEN login_attempts.failure_count + 1
                  ELSE 1
                END
              ) >= ${MAX_FAILURES}
                AND (login_attempts.blocked_until IS NULL OR login_attempts.blocked_until <= now())
                THEN now() + (${COOLDOWN_MS}::int * INTERVAL '1 millisecond')
              ELSE login_attempts.blocked_until
            END
      RETURNING failure_count, blocked_until
    `);

    const row = (rows as unknown as { rows?: Array<{ failure_count: number; blocked_until: string | null }> }).rows?.[0];
    if (row?.blocked_until) {
      const blockedUntil = new Date(row.blocked_until).getTime();
      return {
        blocked: blockedUntil > Date.now(),
        retryAfterSec: Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000)),
      };
    }
    return { blocked: false, retryAfterSec: 0 };
  } catch (err) {
    console.error('[rate-limit] record failed:', err);
    return { blocked: true, retryAfterSec: 60 };
  }
}

/**
 * Сбрасывает счётчик для ключа (при успешном логине или смене пароля).
 */
export async function clearLoginRate(key: string): Promise<void> {
  try {
    await db.execute(sql`DELETE FROM login_attempts WHERE key = ${key}`);
  } catch (err) {
    console.error('[rate-limit] clear failed:', err);
  }
}

/**
 * Чистит устаревшие записи (вызывается периодически).
 * Помечена как lazy — может вызываться из cron-задачи или при каждой 100-й попытке.
 */
export async function cleanupLoginAttempts(): Promise<number> {
  try {
    const rows = await db.execute<{ deleted: number }>(sql`
      WITH deleted AS (
        DELETE FROM login_attempts
        WHERE first_failure_at < now() - (${WINDOW_MS}::int * INTERVAL '1 millisecond')
          AND (blocked_until IS NULL OR blocked_until <= now())
        RETURNING 1
      )
      SELECT count(*)::int AS deleted FROM deleted
    `);
    const row = (rows as unknown as { rows?: Array<{ deleted: number }> }).rows?.[0];
    return row?.deleted ?? 0;
  } catch (err) {
    console.error('[rate-limit] cleanup failed:', err);
    return 0;
  }
}