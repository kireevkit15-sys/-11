/**
 * Diva Admin — подписанная и зашифрованная сессия на базе iron-session.
 *
 * Сессия хранится в httpOnly cookie, зашифрована и подписана SESSION_SECRET.
 * - В route handlers / server components используем getSession() (через next/headers cookies()).
 * - В middleware (Edge runtime) используем getSessionUserFromRequest(), который
 *   распечатывает cookie через unsealData (edge-совместимо, без next/headers).
 */

import { getIronSession, sealData, unsealData } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export type AdminRole = 'admin' | 'editor' | 'viewer';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  requirePasswordChange?: boolean;
}

export interface AdminSession {
  user?: SessionUser;
  [key: string]: unknown;
}

export const SESSION_COOKIE = 'diva_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24h

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters');
  }
  return secret;
}

function getSessionOptions() {
  const isSecure = process.env.NODE_ENV === 'production';

  return {
    cookieName: SESSION_COOKIE,
    password: getSecret(),
    cookieOptions: {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax' as const,
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    },
    ttl: SESSION_MAX_AGE_SECONDS,
  };
}

/** Чтение/запись сессии в route handlers и server components. */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<AdminSession>(cookieStore, getSessionOptions());
}

export async function setSessionUser(user: SessionUser) {
  const session = await getSession();
  session.user = user;
  await session.save();
}

export async function destroySession() {
  const session = await getSession();
  session.destroy();
}

/**
 * Edge-совместимое чтение пользователя из запроса (для middleware).
 * Распечатывает зашифрованный cookie без обращения к next/headers.
 */
export async function getSessionUserFromRequest(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const data = await unsealData<AdminSession>(token, {
      password: getSecret(),
      ttl: SESSION_MAX_AGE_SECONDS,
    });
    return data.user ?? null;
  } catch {
    return null;
  }
}

// Совместимость со старым именем, использовавшимся в роутах/мидлваре.
export const getCurrentUserFromRequest = getSessionUserFromRequest;

// re-export на случай прямого использования
export { sealData, unsealData };
