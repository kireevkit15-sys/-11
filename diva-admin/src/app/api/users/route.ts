/**
 * Diva Admin — управление администраторами админ-панели.
 * GET  /api/users — список (только admin)
 * POST /api/users — создать (только admin)
 *
 * passwordHash НИКОГДА не возвращается клиенту.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminUsers } from '@db/schema';
import { desc } from 'drizzle-orm';
import { authorize, dbErrorResponse, jsonError, clientIp } from '@/lib/api-helpers';
import { hashPassword, validatePasswordStrength, type AdminRole } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { readJsonBody } from '@/lib/cp1251';

const ROLES: AdminRole[] = ['admin', 'editor', 'viewer'];

/** Безопасный набор колонок — без passwordHash. */
const SAFE_COLUMNS = {
  id: adminUsers.id,
  email: adminUsers.email,
  name: adminUsers.name,
  role: adminUsers.role,
  requirePasswordChange: adminUsers.requirePasswordChange,
  createdAt: adminUsers.createdAt,
} as const;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(request: NextRequest) {
  const auth = await authorize('users:read');
  if ('error' in auth) return auth.error;

  try {
    const sp = request.nextUrl.searchParams;
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(sp.get('limit') ?? DEFAULT_LIMIT)));
    const offset = Math.max(0, Number(sp.get('offset') ?? 0));
    const rows = await db
      .select(SAFE_COLUMNS)
      .from(adminUsers)
      .orderBy(desc(adminUsers.createdAt))
      .limit(limit)
      .offset(offset);
    return NextResponse.json({ data: rows, pagination: { limit, offset } });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorize('users:write');
  if ('error' in auth) return auth.error;

  try {
    const raw = await readJsonBody<Record<string, unknown>>(request);
    const email = String(raw.email ?? '').trim().toLowerCase();
    const name = String(raw.name ?? '').trim();
    const role = String(raw.role ?? '') as AdminRole;
    const password = String(raw.password ?? '');

    if (!email) return jsonError('Поле «Email» обязательно', 400);
    if (!name) return jsonError('Поле «Имя» обязательно', 400);
    if (!ROLES.includes(role)) return jsonError('Недопустимая роль', 400);

    const strength = validatePasswordStrength(password, email);
    if (!strength.valid) return jsonError(strength.error ?? 'Слабый пароль', 400);

    // NFKC-нормализация перед хэшированием: одинаковые визуально пароли
    // (например, fullwidth vs ascii) хэшируются в одну строку.
    const passwordHash = await hashPassword(password.normalize('NFKC'));

    const [created] = await db
      .insert(adminUsers)
      .values({ email, name, role, passwordHash, requirePasswordChange: true })
      .returning(SAFE_COLUMNS);

    await logAudit({
      userId: auth.user.id,
      action: 'create',
      entity: 'admin_users',
      entityId: created?.id ?? null,
      payload: { email, name, role },
      ip: clientIp(request),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
