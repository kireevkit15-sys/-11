/**
 * Diva Admin — Журнал действий (audit log).
 * GET /api/audit — последние записи журнала с именем автора (LEFT JOIN admin_users),
 * сортировка по createdAt desc. Только для роли admin (audit:read).
 *
 * Query-параметры:
 *   ?action=  — фильтр по действию
 *   ?entity=  — фильтр по сущности
 *   ?from=    — ISO-timestamp, начало периода
 *   ?to=      — ISO-timestamp, конец периода
 *   ?limit=   — записей на странице (1..500, default 100)
 *   ?offset=  — смещение (>= 0, default 0)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
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
  const fromStr = searchParams.get('from');
  const toStr = searchParams.get('to');

  const rawLimit = parseInt(searchParams.get('limit') ?? '', 10);
  const limit = Number.isNaN(rawLimit)
    ? DEFAULT_LIMIT
    : Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
  const offset = Math.max(0, Number(searchParams.get('offset') ?? 0));

  const from = fromStr ? new Date(fromStr) : null;
  const to = toStr ? new Date(toStr) : null;
  const fromValid = from && !Number.isNaN(from.getTime()) ? from : null;
  const toValid = to && !Number.isNaN(to.getTime()) ? to : null;

  const conditions = [
    action ? eq(auditLogs.action, action) : undefined,
    entity ? eq(auditLogs.entity, entity) : undefined,
    fromValid ? gte(auditLogs.createdAt, fromValid) : undefined,
    toValid ? lte(auditLogs.createdAt, toValid) : undefined,
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
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ data: rows, pagination: { limit, offset } });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
