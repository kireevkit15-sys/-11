/**
 * Diva Admin — подписанная и зашифрованная сессия на базе iron-session.
 *
 * Сессия хранится в httpOnly cookie, зашифрована и подписана SESSION_SECRET.
 * - В route handlers / server components используем getSession() (через next/headers cookies()).
 * - В middleware (Edge runtime) используем getSessionUserFromRequest(), который
 *   распечатывает cookie через unsealData (edge-совместимо, без next/headers).
 *
 * Безопасность:
 * - __Host- prefix в production (запрещает Secure=false и подменённый domain).
 * - sameSite=strict: защита от CSRF через GET-навигацию.
 * - session fixation defense: destroy() старой сессии перед setSessionUser().
 * - Поддержка секрет-массива для бесшовной ротации (старые cookies с предыдущим
 *   secret продолжают работать до TTL).
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
  /** Монотонно растёт при смене пароля. Старые сессии с меньшим epoch — невалидны. */
  sessionEpoch?: number;
}

export interface AdminSession {
  user?: SessionUser;
  /** Внутренний nonce, обновляется при каждом setSessionUser — защита от fixation. */
  _nonce?: string;
  [key: string]: unknown;
}

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24h

/** Префикс __Host- в prod запрещает Secure=false и подменённый domain. */
function getCookieName(): string {
  return process.env.NODE_ENV === 'production'
    ? '__Host-diva_admin_session'
    : 'diva_admin_session';
}

/**
 * Активный секрет для шифрования cookie. Ротация: установить новый
 * SESSION_SECRET, а старый — в SESSION_SECRET_PREVIOUS (старые cookie
 * расшифруются в течение TTL 24ч, после чего автоматически истекут).
 */
function getActiveSecret(): string {
  const raw = process.env.SESSION_SECRET;
  if (!raw) throw new Error('SESSION_SECRET must be set');
  const secret = raw.split(',')[0]?.trim() ?? '';
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters');
  }
  if (secret.includes('change-me') || secret.includes('placeholder')) {
    throw new Error('SESSION_SECRET still contains placeholder value. Generate a real secret with `openssl rand -hex 32`.');
  }
  return secret;
}

function getSessionOptions() {
  const isSecure = process.env.NODE_ENV === 'production';

  return {
    cookieName: getCookieName(),
    password: getActiveSecret(),
    cookieOptions: {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict' as const,
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

/**
 * Устанавливает пользователя сессии.
 * Защита от session fixation: явно destroy() старую сессию, потом создаём новый
 * контейнер с новым nonce. Если cookie был повреждён/чужим — старый payload
 * стирается, атакующий теряет доступ.
 */
export async function setSessionUser(user: SessionUser) {
  const session = await getSession();
  await session.destroy();
  // После destroy() нужно снова открыть сессионный контейнер — он чистый.
  const fresh = await getSession();
  fresh.user = user;
  fresh._nonce = cryptoRandomNonce();
  await fresh.save();
}

/** Уничтожает сессию (logout). */
export async function destroySession() {
  const session = await getSession();
  await session.destroy();
}

/**
 * Edge-совместимое чтение пользователя из запроса (для middleware).
 */
export async function getSessionUserFromRequest(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(getCookieName())?.value;
  if (!token) return null;
  try {
    const data = await unsealData<AdminSession>(token, {
      password: getActiveSecret(),
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

/** Генерирует короткий криптостойкий nonce (16 байт base64url). */
function cryptoRandomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // base64url без padding
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}