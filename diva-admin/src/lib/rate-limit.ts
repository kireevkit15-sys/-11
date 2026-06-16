/**
 * Diva Admin — простой in-memory rate-limit для логина.
 * Защита от брутфорса: после MAX неудачных попыток в окне WINDOW — блок на COOLDOWN.
 *
 * Ограничение: in-memory, на один инстанс. Для нескольких реплик нужен Redis.
 * Для одиночного VPS-деплоя достаточно.
 */

const WINDOW_MS = 15 * 60 * 1000; // окно учёта попыток
const MAX_FAILURES = 8; // допустимо неудач в окне
const COOLDOWN_MS = 15 * 60 * 1000; // блок после превышения

interface Entry {
  failures: number[]; // timestamps неудачных попыток
  blockedUntil?: number;
}

const store = new Map<string, Entry>();

export function loginRateStatus(key: string): { blocked: boolean; retryAfterSec: number } {
  const now = Date.now();
  const e = store.get(key);
  if (!e) return { blocked: false, retryAfterSec: 0 };
  if (e.blockedUntil && e.blockedUntil > now) {
    return { blocked: true, retryAfterSec: Math.ceil((e.blockedUntil - now) / 1000) };
  }
  return { blocked: false, retryAfterSec: 0 };
}

export function recordLoginFailure(key: string): void {
  const now = Date.now();
  const e = store.get(key) ?? { failures: [] };
  e.failures = e.failures.filter((t) => now - t < WINDOW_MS);
  e.failures.push(now);
  if (e.failures.length >= MAX_FAILURES) {
    e.blockedUntil = now + COOLDOWN_MS;
    e.failures = [];
  }
  store.set(key, e);
}

export function clearLoginRate(key: string): void {
  store.delete(key);
}
