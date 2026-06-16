/**
 * Diva Admin — Auth helpers, password hashing and session validation.
 */

import { db } from '@/lib/db';
import { adminUsers } from '@db/schema';
import { eq } from 'drizzle-orm';
import { hash, verify } from '@node-rs/argon2';
import { getSession, SessionUser } from '@/lib/session';

export type AdminRole = SessionUser['role'];

export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
};

export function hasRole(user: SessionUser, required: AdminRole): boolean {
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[required];
}

export function requireRole(user: SessionUser | null, required: AdminRole): SessionUser {
  if (!user) {
    throw new Error('Unauthorized');
  }
  if (!hasRole(user, required)) {
    throw new Error('Forbidden');
  }
  return user;
}

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

export async function verifyPassword(hashValue: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashValue, plain);
  } catch {
    return false;
  }
}

export async function validateCredentials(email: string, password: string): Promise<SessionUser | null> {
  const user = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, email.toLowerCase().trim()),
  });

  if (!user) return null;

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as AdminRole,
    requirePasswordChange: user.requirePasswordChange,
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user ?? null;
}

export async function changePassword(userId: string, newPassword: string): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  await db
    .update(adminUsers)
    .set({
      passwordHash,
      requirePasswordChange: false,
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, userId));
}

export const PASSWORD_MIN_LENGTH = 8;

export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Пароль должен быть не короче ${PASSWORD_MIN_LENGTH} символов` };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну заглавную букву' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну строчную букву' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну цифру' };
  }
  return { valid: true };
}
