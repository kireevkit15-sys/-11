/**
 * Diva Admin — динамический CRUD API (список + создание) для любой сущности из реестра.
 * GET  /api/[entity]      — список
 * POST /api/[entity]      — создать
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { asc, desc } from 'drizzle-orm';
import { getEntity } from '@/lib/entities';
import { authorize, coerceBody, dbErrorResponse, jsonError, clientIp } from '@/lib/api-helpers';
import { logAudit } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> },
) {
  const { entity: slug } = await params;
  const entity = getEntity(slug);
  if (!entity) return jsonError('Неизвестная сущность', 404);

  const auth = await authorize('content:read');
  if ('error' in auth) return auth.error;

  try {
    const table = entity.table as unknown as Record<string, unknown>;
    const col = table[entity.orderBy] as never;
    const orderFn = entity.orderDir === 'desc' ? desc : asc;
    const rows = await db
      .select()
      .from(entity.table)
      .orderBy(orderFn(col));
    return NextResponse.json({ data: rows });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> },
) {
  const { entity: slug } = await params;
  const entity = getEntity(slug);
  if (!entity) return jsonError('Неизвестная сущность', 404);

  const auth = await authorize('content:write');
  if ('error' in auth) return auth.error;

  try {
    const raw = (await request.json()) as Record<string, unknown>;
    const { data, error } = coerceBody(entity, raw);
    if (error) return jsonError(error, 400);

    const [created] = await db.insert(entity.table).values(data).returning();

    await logAudit({
      userId: auth.user.id,
      action: 'create',
      entity: slug,
      entityId: (created as { id?: string })?.id ?? null,
      payload: { fields: Object.keys(data) },
      ip: clientIp(request),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
