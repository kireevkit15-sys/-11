import { describe, it, expect, beforeEach } from 'vitest';
import { loginRateStatus, recordLoginFailure, clearLoginRate } from '@/lib/rate-limit';

/**
 * rate-limit.ts — чистый in-memory модуль без server-only зависимостей.
 * MAX_FAILURES = 8: блокировка наступает на 8-й неудаче.
 * Используем уникальный ключ на каждый тест, плюс clear в beforeEach.
 */
describe('rate-limit', () => {
  beforeEach(() => {
    clearLoginRate('k');
  });

  it('неизвестный ключ — не заблокирован', () => {
    const s = loginRateStatus('fresh-key');
    expect(s.blocked).toBe(false);
    expect(s.retryAfterSec).toBe(0);
  });

  it('меньше лимита неудач — не блокирует', () => {
    for (let i = 0; i < 7; i++) recordLoginFailure('k');
    expect(loginRateStatus('k').blocked).toBe(false);
  });

  it('после 8 неудач — blocked=true с retryAfter > 0', () => {
    for (let i = 0; i < 8; i++) recordLoginFailure('k');
    const s = loginRateStatus('k');
    expect(s.blocked).toBe(true);
    expect(s.retryAfterSec).toBeGreaterThan(0);
  });

  it('clearLoginRate сбрасывает блокировку', () => {
    for (let i = 0; i < 8; i++) recordLoginFailure('k');
    expect(loginRateStatus('k').blocked).toBe(true);
    clearLoginRate('k');
    expect(loginRateStatus('k').blocked).toBe(false);
  });

  it('разные ключи изолированы', () => {
    for (let i = 0; i < 8; i++) recordLoginFailure('user-a');
    expect(loginRateStatus('user-a').blocked).toBe(true);
    expect(loginRateStatus('user-b').blocked).toBe(false);
    clearLoginRate('user-a');
  });
});
