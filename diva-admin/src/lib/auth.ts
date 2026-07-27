/**
 * Diva Admin — Auth helpers, password hashing and session validation.
 */

import { db } from '@/lib/db';
import { adminUsers } from '@db/schema';
import { eq, sql } from 'drizzle-orm';
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

// Фиктивный хэш для constant-time ответа при ненайденном email.
// Argon2id-формат, верификация которого всегда ~50–100 мс,
// как у реального хэша — это скрывает факт существования email.
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$ZHVtbXlzYWx0ZHVtbXlzYWx0$Rd7AqJKz4EWcpK/1c2Jv0C0M7Ov1W2xQzG6Ck8YJd1Q';

export async function validateCredentials(email: string, password: string): Promise<SessionUser | null> {
  const user = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, email.toLowerCase().trim()),
  });

  // NFKC: введённый пароль нормализуется так же, как при регистрации/смене.
  // Иначе пользователь с fullwidth-формой не сможет войти.
  const normalized = password.normalize('NFKC');

  if (!user) {
    // Constant-time: даже если пользователь не найден, выполняем verify против
    // фиктивного хэша, чтобы не утекало время ответа различием «email есть» vs «нет».
    await verifyPassword(DUMMY_HASH, normalized);
    return null;
  }

  const ok = await verifyPassword(user.passwordHash, normalized);
  if (!ok) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as AdminRole,
    requirePasswordChange: user.requirePasswordChange,
    sessionEpoch: user.sessionEpoch ?? 1,
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user ?? null;
}

export async function changePassword(userId: string, newPassword: string): Promise<void> {
  // NFKC перед хэшем: одинаковые визуально пароли хэшируются одинаково.
  const passwordHash = await hashPassword(newPassword.normalize('NFKC'));
  await db
    .update(adminUsers)
    .set({
      passwordHash,
      requirePasswordChange: false,
      // Инкрементируем epoch — это инвалидирует все ранее выданные сессии.
      sessionEpoch: sql`${adminUsers.sessionEpoch} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, userId));
}

export const PASSWORD_MIN_LENGTH = 8;

/**
 * Проверка стойкости пароля с нормализацией NFKC.
 *
 * NFKC нужна потому, что `password.length` в JS считает code units UTF-16:
 * один emoji занимает 2 единицы, `ﬁ` (U+FB01) — 1, а его NFKC-форма `fi` — 2,
 * `Ａ` (fullwidth A) — 1, его NFKC-форма `A` — 1. Без нормализации пользователь
 * может создать «слабый» пароль, который выглядит длинным.
 *
 * Дополнительно отклоняем пароли, в которых содержится email (whole или local-part):
 * классическая ошибка — `ivan2025` для `ivan@example.com`, перебор по словарю
 * в 10⁶ раз сокращает пространство поиска.
 */
export function validatePasswordStrength(
  password: string,
  email?: string,
): { valid: boolean; error?: string } {
  // NFKC: каноническая композиция + совместимая декомпозиция. Ноль аллокаций
  // если строка уже в NFKC (V8 кеширует форму).
  const normalized = password.normalize('NFKC');

  if (normalized.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `Пароль должен быть не короче ${PASSWORD_MIN_LENGTH} символов`,
    };
  }
  if (!/[A-Z]/.test(normalized)) {
    return {
      valid: false,
      error: 'Пароль должен содержать хотя бы одну заглавную букву',
    };
  }
  if (!/[a-z]/.test(normalized)) {
    return {
      valid: false,
      error: 'Пароль должен содержать хотя бы одну строчную букву',
    };
  }
  if (!/[0-9]/.test(normalized)) {
    return {
      valid: false,
      error: 'Пароль должен содержать хотя бы одну цифру',
    };
  }

  // Email-блок: 4+ символа подряд из email-логина внутри пароля = reject.
  if (email) {
    const local = email.split('@')[0]?.toLowerCase().trim();
    if (local && local.length >= 4) {
      const lowerPassword = normalized.toLowerCase();
      // Экранируем regex-символы из local (на случай `ivan.dev`).
      const safe = local.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(safe).test(lowerPassword)) {
        return {
          valid: false,
          error: 'Пароль не должен содержать ваш email или его часть',
        };
      }
    }
  }

  return { valid: true };
}
