/**
 * Diva Admin — обновление/удаление администратора админ-панели.
 * PATCH  /api/users/[id] — обновить name/role и опционально пароль (только admin)
 * DELETE /api/users/[id] — удалить (только admin)
 *
 * passwordHash НИКОГДА не возвращается клиенту.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminUsers } from '@db/schema';
import { and, count, eq, ne } from 'drizzle-orm';
import { authorize, dbErrorResponse, jsonError, clientIp } from '@/lib/api-helpers';
import { hashPassword, validatePasswordStrength, type AdminRole } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const ROLES: AdminRole[] = ['admin', 'editor', 'viewer'];

const SAFE_COLUMNS = {
  id: adminUsers.id,
  email: adminUsers.email,
  name: adminUsers.name,
  role: adminUsers.role,
  requirePasswordChange: adminUsers.requirePasswordChange,
  createdAt: adminUsers.createdAt,
} as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const auth = await authorize('users:write');
  if ('error' in auth) return auth.error;

  try {
    const existing = await db.query.adminUsers.findFirst({ where: eq(adminUsers.id, id) });
    if (!existing) return jsonError('Пользователь не найден', 404);

    const raw = (await request.json()) as Record<string, unknown>;

    const updates: Partial<typeof adminUsers.$inferInsert> = { updatedAt: new Date() };
    const auditPayload: Record<string, unknown> = {};

    if (raw.name !== undefined) {
      const name = String(raw.name).trim();
      if (!name) return jsonError('Поле «Имя» обязательно', 400);
      updates.name = name;
      auditPayload.name = name;
    }

    if (raw.role !== undefined) {
      const role = String(raw.role) as AdminRole;
      if (!ROLES.includes(role)) return jsonError('Недопустимая роль', 400);
      // Запрещаем менять роль самому себе, чтобы не разжаловать единственного админа.
      if (id === auth.user.id && role !== existing.role) {
        return jsonError('Нельзя изменить собственную роль', 400);
      }
      updates.role = role;
      auditPayload.role = role;
    }

    // Новый пароль (опционально) — например, кнопка «Сбросить пароль».
    if (raw.password !== undefined && String(raw.password) !== '') {
      const password = String(raw.password);
      const strength = validatePasswordStrength(password);
      if (!strength.valid) return jsonError(strength.error ?? 'Слабый пароль', 400);
      updates.passwordHash = await hashPassword(password);
      updates.requirePasswordChange = true;
      auditPayload.passwordReset = true;
    }

    const [updated] = await db
      .update(adminUsers)
      .set(updates)
      .where(eq(adminUsers.id, id))
      .returning(SAFE_COLUMNS);

    await logAudit({
      userId: auth.user.id,
      action: 'update',
      entity: 'admin_users',
      entityId: id,
      payload: auditPayload,
      ip: clientIp(request),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const auth = await authorize('users:delete');
  if ('error' in auth) return auth.error;

  // Нельзя удалить самого себя.
  if (id === auth.user.id) {
    return jsonError('Нельзя удалить собственную учётную запись', 400);
  }

  try {
    const target = await db.query.adminUsers.findFirst({ where: eq(adminUsers.id, id) });
    if (!target) return jsonError('Пользователь не найден', 404);

    // Нельзя удалить последнего администратора.
    if (target.role === 'admin') {
      const [{ c }] = await db
        .select({ c: count() })
        .from(adminUsers)
        .where(and(eq(adminUsers.role, 'admin'), ne(adminUsers.id, id)));
      if (Number(c) === 0) {
        return jsonError('Нельзя удалить последнего администратора', 400);
      }
    }

    await db.delete(adminUsers).where(eq(adminUsers.id, id));

    await logAudit({
      userId: auth.user.id,
      action: 'delete',
      entity: 'admin_users',
      entityId: id,
      payload: { email: target.email, role: target.role },
      ip: clientIp(request),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
