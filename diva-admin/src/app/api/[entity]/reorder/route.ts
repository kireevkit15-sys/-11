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
import { sql } from 'drizzle-orm';
import { getEntity } from '@/lib/entities';
import { authorize, dbErrorResponse, jsonError, clientIp } from '@/lib/api-helpers';
import { logAudit } from '@/lib/audit';
import { revalidateFromEntity } from '@/lib/revalidate-web';
import { readJsonBody } from '@/lib/cp1251';

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
    const raw = await readJsonBody<{ ids?: unknown }>(request);
    const ids = Array.isArray(raw.ids) ? raw.ids.map((v) => String(v)) : null;
    if (!ids || ids.length === 0) return jsonError('Ожидается непустой массив ids', 400);

    const table = entity.table as unknown as Record<string, unknown>;
    const idCol = table.id;

    // Строим VALUES-таблицу (id, position) и одним UPDATE применяем порядок.
    // Это атомарно (single SQL statement), нет N+1 round-trip, и не оставляет
    // промежуточного «полу-sorted» состояния для читателей.
    //
    // position кастим в ::int явно: VALUES (…) без указания типа создаёт
    // text-колонку, а services.sort_order / faqs.sortOrder / etc. — integer.
    // Без ::int Postgres возвращает 42804 ("column … is of type integer but
    // expression is of type text") и reorder возвращает 500.
    const values = sql.join(
      ids.map((id, i) => sql`(${id}::text, ${i}::int)`),
      sql`, `,
    );

    await db.execute(sql`
      UPDATE ${entity.table}
      SET sort_order = v.position
      FROM (VALUES ${values}) AS v(id, position)
      WHERE ${entity.table}.id::text = v.id
        AND ${idCol} IS NOT NULL
    `);

    await logAudit({
      userId: auth.user.id,
      action: 'reorder',
      entity: slug,
      payload: { count: ids.length },
      ip: clientIp(request),
      userAgent: request.headers.get('user-agent'),
    });

    // Reorder меняет sortOrder — это меняет порядок на главной и в других
    // местах, где эти сущности выводятся. Сбрасываем ISR-кеш.
    revalidateFromEntity(slug);

    return NextResponse.json({ success: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
