import { describe, it, expect } from 'vitest';

/**
 * rate-limit.ts использует PostgreSQL через Drizzle.
 * Тестирование требует реальной БД, поэтому здесь только проверяем,
 * что API-функции экспортируются и возвращают ожидаемый контракт.
 *
 * Полноценные интеграционные тесты — в ops/ (или в CI с testcontainers).
 */

describe('rate-limit (контракт)', () => {
  it('loginRateStatus экспортируется и возвращает Promise<{blocked, retryAfterSec}>', async () => {
    const { loginRateStatus } = await import('@/lib/rate-limit');
    const r = await loginRateStatus('test-key-not-exists');
    expect(typeof r.blocked).toBe('boolean');
    expect(typeof r.retryAfterSec).toBe('number');
  });

  it('recordLoginFailure экспортируется и возвращает RateStatus', async () => {
    const { recordLoginFailure } = await import('@/lib/rate-limit');
    const result = await recordLoginFailure('test-key');
    expect(typeof result).toBe('object');
    expect(typeof result.blocked).toBe('boolean');
    expect(typeof result.retryAfterSec).toBe('number');
  });

  it('clearLoginRate экспортируется', async () => {
    const { clearLoginRate } = await import('@/lib/rate-limit');
    await expect(clearLoginRate('test-key')).resolves.toBeUndefined();
  });

  it('повторный вызов loginRateStatus с одним ключом идемпотентен', async () => {
    const { loginRateStatus } = await import('@/lib/rate-limit');
    const a = await loginRateStatus('idem-key');
    const b = await loginRateStatus('idem-key');
    expect(a).toEqual(b);
  });
});