import { describe, it, expect, vi } from 'vitest';

/**
 * Тестируем чистую функцию hasPermission из rbac.ts.
 *
 * rbac.ts на верхнем уровне импортирует server-only модули:
 *   @/lib/auth  → @/lib/db → postgres (бросает без DATABASE_URL),
 *   @/lib/session → next/headers,
 *   next/server.
 * Все они мокируются, чтобы импорт rbac.ts не падал. Сама матрица прав
 * (константа PERMISSIONS + hasPermission) — чистая и тестируется как есть.
 */
vi.mock('@/lib/auth', () => ({
  hasRole: vi.fn(),
  requireRole: vi.fn(),
}));
vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
  getCurrentUserFromRequest: vi.fn(),
}));
vi.mock('next/server', () => ({
  NextRequest: class {},
}));

import { hasPermission, type Permission } from '@/lib/rbac';

type Role = 'admin' | 'editor' | 'viewer';
function user(role: Role) {
  return { id: '1', email: 'a@b.c', name: 'X', role } as Parameters<typeof hasPermission>[0];
}

describe('hasPermission — admin', () => {
  it('может users:write', () => {
    expect(hasPermission(user('admin'), 'users:write')).toBe(true);
  });
  it('может content:write / content:delete', () => {
    expect(hasPermission(user('admin'), 'content:write')).toBe(true);
    expect(hasPermission(user('admin'), 'content:delete')).toBe(true);
  });
  it('может frontend:publish и settings:write', () => {
    expect(hasPermission(user('admin'), 'frontend:publish')).toBe(true);
    expect(hasPermission(user('admin'), 'settings:write')).toBe(true);
  });
});

describe('hasPermission — editor', () => {
  it('может content:write', () => {
    expect(hasPermission(user('editor'), 'content:write')).toBe(true);
  });
  it('НЕ может users:write', () => {
    expect(hasPermission(user('editor'), 'users:write')).toBe(false);
  });
  it('НЕ может settings:write / audit:read', () => {
    expect(hasPermission(user('editor'), 'settings:write')).toBe(false);
    expect(hasPermission(user('editor'), 'audit:read')).toBe(false);
  });
});

describe('hasPermission — viewer', () => {
  it('НЕ может content:write', () => {
    expect(hasPermission(user('viewer'), 'content:write')).toBe(false);
  });
  it('может content:read', () => {
    expect(hasPermission(user('viewer'), 'content:read')).toBe(true);
  });
  it('НЕ может users:read / frontend:write', () => {
    expect(hasPermission(user('viewer'), 'users:read')).toBe(false);
    expect(hasPermission(user('viewer'), 'frontend:write')).toBe(false);
  });
});

describe('hasPermission — матрица согласованности', () => {
  const writePerms: Permission[] = ['content:write', 'users:write', 'settings:write'];
  it('admin перекрывает права editor и viewer', () => {
    for (const p of writePerms) {
      if (hasPermission(user('viewer'), p)) expect(hasPermission(user('admin'), p)).toBe(true);
      if (hasPermission(user('editor'), p)) expect(hasPermission(user('admin'), p)).toBe(true);
    }
  });
});
