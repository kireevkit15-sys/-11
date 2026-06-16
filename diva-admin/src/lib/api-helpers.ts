/**
 * Diva Admin — общие помощники для динамического API сущностей.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, SessionUser } from '@/lib/session';
import { hasPermission, Permission } from '@/lib/rbac';
import type { EntityConfig, FieldConfig } from '@/lib/entities';

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Текущий пользователь из сессии (route handlers). */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user ?? null;
}

/** Гарантирует авторизацию и нужное право. Возвращает либо пользователя, либо Response-ошибку. */
export async function authorize(
  permission: Permission,
): Promise<{ user: SessionUser } | { error: NextResponse }> {
  const user = await currentUser();
  if (!user) return { error: jsonError('Не авторизован', 401) };
  if (!hasPermission(user, permission)) return { error: jsonError('Недостаточно прав', 403) };
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
