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
import { and, count, eq, ne, sql } from 'drizzle-orm';
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

    const updates: Partial<typeof adminUsers.$inferInsert> & Record<string, unknown> = { updatedAt: new Date() };
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
      // Запрещаем менять роль самому себе — это закрывает и повышение,
      // и понижение, чтобы исключить эскалацию привилегий.
      if (id === auth.user.id) {
        return jsonError('Нельзя изменить собственную роль', 400);
      }
      updates.role = role;
      auditPayload.role = role;
    }

    // Новый пароль (опционально) — например, кнопка «Сбросить пароль».
    if (raw.password !== undefined && String(raw.password) !== '') {
      const password = String(raw.password);
      const strength = validatePasswordStrength(password, existing.email);
      if (!strength.valid) return jsonError(strength.error ?? 'Слабый пароль', 400);
      updates.passwordHash = await hashPassword(password.normalize('NFKC'));
      updates.requirePasswordChange = true;
      // Инкрементируем epoch — это сразу инвалидирует все активные сессии
      // пользователя, кроме текущего админа, выполняющего сброс.
      (updates as Record<string, unknown>).sessionEpoch = sql`${adminUsers.sessionEpoch} + 1`;
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
    // Атомарная проверка и удаление в одной транзакции с SELECT ... FOR UPDATE —
    // иначе гонка: два админа одновременно удаляют последних admin'ов → лок-аут.
    const result = await db.transaction(async (tx) => {
      const targetRows = await tx
        .select({ id: adminUsers.id, role: adminUsers.role, email: adminUsers.email })
        .from(adminUsers)
        .where(eq(adminUsers.id, id))
        .for('update');
      const target = targetRows[0];
      if (!target) return { error: 'Пользователь не найден' as const };

      if (target.role === 'admin') {
        const countRows = await tx
          .select({ c: count() })
          .from(adminUsers)
          .where(and(eq(adminUsers.role, 'admin'), ne(adminUsers.id, id)));
        const c = countRows[0]?.c ?? 0;
        if (Number(c) === 0) {
          return { error: 'Нельзя удалить последнего администратора' as const };
        }
      }

      await tx.delete(adminUsers).where(eq(adminUsers.id, id));
      return { ok: true as const, target };
    });

    if ('error' in result) return jsonError(result.error ?? 'Ошибка', 404);

    await logAudit({
      userId: auth.user.id,
      action: 'delete',
      entity: 'admin_users',
      entityId: id,
      payload: { email: result.target.email, role: result.target.role },
      ip: clientIp(request),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
