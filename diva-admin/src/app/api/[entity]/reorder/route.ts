/**
 * Diva Admin — массовая перестановка порядка записей.
 * POST /api/[entity]/reorder — body { ids: string[] }
 *
 * Для каждой сущности из реестра, у которой есть колонка sortOrder,
 * назначает sortOrder = индекс id в переданном массиве.
 *
 * ВНИМАНИЕ: статический сегмент `reorder` соседствует с динамическим `[id]`.
 * Next.js приоритезирует статический сегмент, поэтому конфликта нет.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { getEntity } from '@/lib/entities';
import { authorize, dbErrorResponse, jsonError, clientIp } from '@/lib/api-helpers';
import { logAudit } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> },
) {
  const { entity: slug } = await params;
  const entity = getEntity(slug);
  if (!entity) return jsonError('Неизвестная сущность', 404);

  const auth = await authorize('content:write');
  if ('error' in auth) return auth.error;

  // Есть ли у сущности поле порядка
  const hasSortOrder = entity.fields.some((f) => f.name === 'sortOrder');
  if (!hasSortOrder) return jsonError('Сущность не поддерживает сортировку', 400);

  try {
    const raw = (await request.json()) as { ids?: unknown };
    const ids = Array.isArray(raw.ids) ? raw.ids.map((v) => String(v)) : null;
    if (!ids || ids.length === 0) return jsonError('Ожидается непустой массив ids', 400);

    const table = entity.table as unknown as Record<string, unknown>;
    const idCol = table.id;

    // Назначаем sortOrder = позиция id в массиве. Каждое обновление —
    // через ::text-каст id (устойчиво к uuid/serial), последовательно.
    for (let i = 0; i < ids.length; i++) {
      await db
        .update(entity.table)
        .set({ sortOrder: i } as Record<string, unknown>)
        .where(eq(sql`${idCol}::text`, ids[i]));
    }

    await logAudit({
      userId: auth.user.id,
      action: 'reorder',
      entity: slug,
      payload: { count: ids.length },
      ip: clientIp(request),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
