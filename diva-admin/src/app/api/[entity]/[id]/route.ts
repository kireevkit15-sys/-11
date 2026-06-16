/**
 * Diva Admin — динамический CRUD API по id.
 * GET    /api/[entity]/[id] — получить
 * PUT    /api/[entity]/[id] — обновить
 * DELETE /api/[entity]/[id] — удалить
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq, sql, type SQL } from 'drizzle-orm';
import { getEntity } from '@/lib/entities';
import { authorize, coerceBody, dbErrorResponse, jsonError, clientIp } from '@/lib/api-helpers';
import { logAudit } from '@/lib/audit';

/**
 * Сравнение id, устойчивое к типу колонки (uuid или integer-serial):
 * приводим колонку к тексту, чтобы сравнить со строковым параметром из URL.
 */
function whereId(entity: ReturnType<typeof getEntity>, id: string): SQL {
  const col = (entity!.table as unknown as Record<string, unknown>).id;
  return eq(sql`${col}::text`, id);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string; id: string }> },
) {
  const { entity: slug, id } = await params;
  const entity = getEntity(slug);
  if (!entity) return jsonError('Неизвестная сущность', 404);

  const auth = await authorize('content:read');
  if ('error' in auth) return auth.error;

  try {
    const [row] = await db.select().from(entity.table).where(whereId(entity, id)).limit(1);
    if (!row) return jsonError('Запись не найдена', 404);
    return NextResponse.json({ data: row });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string; id: string }> },
) {
  const { entity: slug, id } = await params;
  const entity = getEntity(slug);
  if (!entity) return jsonError('Неизвестная сущность', 404);

  const auth = await authorize('content:write');
  if ('error' in auth) return auth.error;

  try {
    const raw = (await request.json()) as Record<string, unknown>;
    const { data, error } = coerceBody(entity, raw);
    if (error) return jsonError(error, 400);

    // updatedAt обновляем, если колонка есть
    const table = entity.table as unknown as Record<string, unknown>;
    if ('updatedAt' in table) data.updatedAt = new Date();

    const [updated] = await db
      .update(entity.table)
      .set(data)
      .where(whereId(entity, id))
      .returning();

    if (!updated) return jsonError('Запись не найдена', 404);

    await logAudit({
      userId: auth.user.id,
      action: 'update',
      entity: slug,
      entityId: id,
      payload: { fields: Object.keys(data) },
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
  { params }: { params: Promise<{ entity: string; id: string }> },
) {
  const { entity: slug, id } = await params;
  const entity = getEntity(slug);
  if (!entity) return jsonError('Неизвестная сущность', 404);

  const auth = await authorize('content:delete');
  if ('error' in auth) return auth.error;

  try {
    const [deleted] = await db
      .delete(entity.table)
      .where(whereId(entity, id))
      .returning();
    if (!deleted) return jsonError('Запись не найдена', 404);

    await logAudit({
      userId: auth.user.id,
      action: 'delete',
      entity: slug,
      entityId: id,
      ip: clientIp(request),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
