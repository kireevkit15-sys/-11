/**
 * Diva Admin — общие помощники для динамического API сущностей.
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { getSession, SessionUser } from '@/lib/session';
import { hasPermission, Permission } from '@/lib/rbac';
import { db } from '@/lib/db';
import { adminUsers } from '@db/schema';
import type { EntityConfig, FieldConfig } from '@/lib/entities';

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Текущий пользователь из сессии (route handlers). */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user ?? null;
}

/**
 * Сверяет sessionEpoch из cookie с текущим значением в БД.
 * Если в БД epoch больше — сессия была инвалидирована сменой пароля или logout.
 * Возвращает false если сессия мертва (её нужно уничтожить).
 *
 * Fail-CLOSED: при сбое БД считаем сессию невалидной. Admin-сессия — критический
 * ресурс, fail-OPEN означал бы, что атакующий с украденным cookie (epoch != БД)
 * работает даже когда БД не отвечает. Атакующий может создавать DDoS на БД →
 * войти как admin. Это неприемлемо.
 *
 * Кэширование: в middleware Edge-runtime не имеет доступа к БД, поэтому epoch
 * сверяется здесь. Чтобы не делать SELECT на КАЖДЫЙ API-запрос (1-3ms × N запросов
 * на странице списка), кэшируем положительный результат на 5 секунд в in-memory
 * Map. TTL балансирует между нагрузкой и задержкой инвалидации (если админ
 * сбросил пароль — старые сессии умрут максимум через 5 секунд).
 *
 * TODO(long-term): вынести epoch в Redis или proxy-API /api/_session/check.
 */
const SESSION_VALID_TTL_MS = 5_000;
const SESSION_VALID_MAX_ENTRIES = 1_000;
const sessionValidCache = new Map<
  string,
  { epoch: number; expiresAt: number }
>();
function purgeExpiredSessionCache(now: number): void {
  if (sessionValidCache.size < SESSION_VALID_MAX_ENTRIES) return;
  for (const [key, value] of sessionValidCache) {
    if (value.expiresAt <= now) sessionValidCache.delete(key);
  }
  // Если всё равно переполнено — LRU-эвикция (Map сохраняет порядок вставки).
  if (sessionValidCache.size >= SESSION_VALID_MAX_ENTRIES) {
    const overflow = sessionValidCache.size - SESSION_VALID_MAX_ENTRIES + 1;
    const it = sessionValidCache.keys();
    for (let i = 0; i < overflow; i++) {
      const next = it.next();
      if (next.done) break;
      sessionValidCache.delete(next.value);
    }
  }
}

async function isSessionValid(user: SessionUser): Promise<boolean> {
  if (user.sessionEpoch === undefined) return true; // старая сессия без epoch — пропускаем
  const cacheKey = `${user.id}:${user.sessionEpoch}`;
  const now = Date.now();
  const cached = sessionValidCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return true;

  try {
    const rows = await db
      .select({ epoch: adminUsers.sessionEpoch })
      .from(adminUsers)
      .where(eq(adminUsers.id, user.id))
      .limit(1);
    const row = rows[0];
    if (!row) return false; // пользователь удалён
    const valid = row.epoch === user.sessionEpoch;
    if (valid) {
      purgeExpiredSessionCache(now);
      sessionValidCache.set(cacheKey, { epoch: row.epoch, expiresAt: now + SESSION_VALID_TTL_MS });
    }
    return valid;
  } catch (err) {
    console.error('[session] epoch check failed (fail-closed):', err);
    return false;
  }
}

/** Гарантирует авторизацию и нужное право. Возвращает либо пользователя, либо Response-ошибку. */
export async function authorize(
  permission: Permission,
): Promise<{ user: SessionUser } | { error: NextResponse }> {
  const user = await currentUser();
  if (!user) return { error: jsonError('Не авторизован', 401) };
  if (!hasPermission(user, permission)) return { error: jsonError('Недостаточно прав', 403) };
  if (!(await isSessionValid(user))) {
    return { error: jsonError('Сессия истекла — войдите снова', 401) };
  }
  return { user };
}

export function clientIp(request: NextRequest): string | null {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  );
}

const SYSTEM_FIELDS = new Set(['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at']);
const MAX_TEXT_LEN = 50000;

export interface CoerceResult {
  data: Record<string, unknown>;
  error?: string;
}

/**
 * Приводит «сырое» тело запроса к типам полей сущности.
 * - пустые text/number/date — пропускаются (срабатывает DEFAULT БД либо null);
 * - checkbox — всегда boolean;
 * - list — массив строк (jsonb).
 * Проверяет обязательные поля.
 */
export function coerceBody(entity: EntityConfig, raw: Record<string, unknown>): CoerceResult {
  const data: Record<string, unknown> = {};

  for (const field of entity.fields) {
    if (SYSTEM_FIELDS.has(field.name)) continue;
    const value = raw[field.name];

    switch (field.type) {
      case 'checkbox': {
        data[field.name] = value === true || value === 'true';
        break;
      }
      case 'number': {
        if (value === '' || value === null || value === undefined) {
          if (field.required) return { data, error: `Поле «${field.label}» обязательно` };
          break; // пропускаем — сработает DEFAULT/NULL
        }
        const n = typeof value === 'number' ? value : parseInt(String(value), 10);
        if (Number.isNaN(n)) return { data, error: `Поле «${field.label}» должно быть числом` };
        data[field.name] = n;
        break;
      }
      case 'date': {
        if (value === '' || value === null || value === undefined) {
          if (field.required) return { data, error: `Поле «${field.label}» обязательно` };
          break;
        }
        const d = new Date(String(value));
        if (Number.isNaN(d.getTime())) return { data, error: `Поле «${field.label}» — некорректная дата` };
        data[field.name] = d;
        break;
      }
      case 'json': {
        const s = value === null || value === undefined ? '' : String(value).trim();
        if (s === '') {
          if (field.required) return { data, error: `Поле «${field.label}» обязательно` };
          break;
        }
        try {
          data[field.name] = JSON.parse(s);
        } catch {
          return { data, error: `Поле «${field.label}» — некорректный JSON` };
        }
        break;
      }
      case 'list': {
        if (Array.isArray(value)) {
          data[field.name] = value.map((v) => String(v)).filter((v) => v.trim() !== '');
        } else if (typeof value === 'string' && value.trim() !== '') {
          // на случай строки с переносами
          data[field.name] = value.split('\n').map((v) => v.trim()).filter(Boolean);
        } else {
          data[field.name] = [];
        }
        break;
      }
      default: {
        // text / textarea / select / image
        const s = value === null || value === undefined ? '' : String(value).trim();
        if (s === '') {
          if (field.required) return { data, error: `Поле «${field.label}» обязательно` };
          // image: пустая строка = null в БД (явный сброс фото через UI).
          // Без этого при PUT с пустым полем старое значение фото сохранялось бы,
          // потому что drizzle.update игнорирует ключи, которых нет в объекте.
          if (field.type === 'image') data[field.name] = null;
          break; // пропускаем пустое необязательное
        }
        if (s.length > MAX_TEXT_LEN) {
          return { data, error: `Поле «${field.label}» слишком длинное (макс. ${MAX_TEXT_LEN})` };
        }
        if (/^\s*(javascript|vbscript):/i.test(s) || /^\s*data:text\/html/i.test(s)) {
          return { data, error: `Поле «${field.label}» содержит недопустимое значение` };
        }
        data[field.name] = s;
      }
    }
  }

  return { data };
}

/** Сопоставление ошибок Postgres к человекочитаемому ответу. */
export function dbErrorResponse(error: unknown): NextResponse {
  const code = (error as { code?: string })?.code;
  if (code === '23505') return jsonError('Запись с таким уникальным полем уже существует', 409);
  if (code === '23503') return jsonError('Нарушение связи (внешний ключ)', 400);
  console.error('[Admin API] DB error:', error);
  return jsonError('Ошибка сервера', 500);
}
