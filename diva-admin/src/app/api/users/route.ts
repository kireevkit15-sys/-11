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

export async function GET() {
  const auth = await authorize('users:read');
  if ('error' in auth) return auth.error;

  try {
    const rows = await db
      .select(SAFE_COLUMNS)
      .from(adminUsers)
      .orderBy(desc(adminUsers.createdAt));
    return NextResponse.json({ data: rows });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorize('users:write');
  if ('error' in auth) return auth.error;

  try {
    const raw = (await request.json()) as Record<string, unknown>;
    const email = String(raw.email ?? '').trim().toLowerCase();
    const name = String(raw.name ?? '').trim();
    const role = String(raw.role ?? '') as AdminRole;
    const password = String(raw.password ?? '');

    if (!email) return jsonError('Поле «Email» обязательно', 400);
    if (!name) return jsonError('Поле «Имя» обязательно', 400);
    if (!ROLES.includes(role)) return jsonError('Недопустимая роль', 400);

    const strength = validatePasswordStrength(password);
    if (!strength.valid) return jsonError(strength.error ?? 'Слабый пароль', 400);

    const passwordHash = await hashPassword(password);

    const [created] = await db
      .insert(adminUsers)
      .values({ email, name, role, passwordHash, requirePasswordChange: true })
      .returning(SAFE_COLUMNS);

    await logAudit({
      userId: auth.user.id,
      action: 'create',
      entity: 'admin_users',
      entityId: created.id,
      payload: { email, name, role },
      ip: clientIp(request),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
