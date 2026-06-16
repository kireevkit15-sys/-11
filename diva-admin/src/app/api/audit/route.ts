/**
 * Diva Admin — Журнал действий (audit log).
 * GET /api/audit — последние записи журнала с именем автора (LEFT JOIN admin_users),
 * сортировка по createdAt desc. Только для роли admin (audit:read).
 *
 * Query-параметры:
 *   ?action=  — фильтр по действию
 *   ?entity=  — фильтр по сущности
 *   ?limit=   — максимум записей (по умолчанию 100, максимум 500)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { and, desc, eq } from 'drizzle-orm';
import { auditLogs, adminUsers } from '@db/schema';
import { authorize, dbErrorResponse } from '@/lib/api-helpers';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export async function GET(request: NextRequest) {
  const auth = await authorize('audit:read');
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action')?.trim();
  const entity = searchParams.get('entity')?.trim();

  const rawLimit = parseInt(searchParams.get('limit') ?? '', 10);
  const limit = Number.isNaN(rawLimit)
    ? DEFAULT_LIMIT
    : Math.min(Math.max(rawLimit, 1), MAX_LIMIT);

  const conditions = [
    action ? eq(auditLogs.action, action) : undefined,
    entity ? eq(auditLogs.entity, entity) : undefined,
  ].filter(Boolean);

  try {
    const rows = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        actorName: adminUsers.name,
        actorEmail: adminUsers.email,
        ip: auditLogs.ip,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(adminUsers, eq(auditLogs.userId, adminUsers.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    return NextResponse.json({ data: rows });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
