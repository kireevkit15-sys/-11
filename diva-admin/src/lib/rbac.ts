/**
 * Diva Admin — Role-based access control helpers.
 */

import { AdminRole, hasRole, requireRole } from '@/lib/auth';
import { getSession, getCurrentUserFromRequest, SessionUser } from '@/lib/session';
import { NextRequest } from 'next/server';

export { hasRole, requireRole };
export type { AdminRole };

export type Permission =
  | 'content:read'
  | 'content:write'
  | 'content:delete'
  | 'leads:read'    // список заявок CRM (PII). Editor/admin.
  | 'leads:write'   // изменение статуса/заметок. Editor/admin.
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'settings:read'
  | 'settings:write'
  | 'audit:read'
  | 'frontend:read'
  | 'frontend:write'
  | 'frontend:publish';

const PERMISSIONS: Record<AdminRole, Permission[]> = {
  // viewer — только контент сайта (без PII заявок).
  viewer: ['content:read', 'settings:read', 'frontend:read'],
  editor: [
    'content:read',
    'content:write',
    'content:delete',
    'leads:read',
    'leads:write',
    'settings:read',
    'frontend:read',
    'frontend:write',
  ],
  admin: [
    'content:read',
    'content:write',
    'content:delete',
    'leads:read',
    'leads:write',
    'users:read',
    'users:write',
    'users:delete',
    'settings:read',
    'settings:write',
    'audit:read',
    'frontend:read',
    'frontend:write',
    'frontend:publish',
  ],
};

export function hasPermission(user: SessionUser, permission: Permission): boolean {
  return PERMISSIONS[user.role].includes(permission);
}

export function requirePermission(user: SessionUser | null, permission: Permission): SessionUser {
  if (!user) throw new Error('Unauthorized');
  if (!hasPermission(user, permission)) throw new Error('Forbidden');
  return user;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user ?? null;
}

export async function getCurrentUserFromRequestSafe(request: NextRequest): Promise<SessionUser | null> {
  return getCurrentUserFromRequest(request);
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  const user = session.user;
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requireAuthApi(request: NextRequest): Promise<SessionUser> {
  const user = await getCurrentUserFromRequest(request);
  if (!user) throw new Error('Unauthorized');
  return user;
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  admin: 'Администратор',
  editor: 'Редактор',
  viewer: 'Наблюдатель',
};
