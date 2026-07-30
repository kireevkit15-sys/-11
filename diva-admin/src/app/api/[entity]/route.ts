/**
 * Diva Admin — динамический CRUD API (список + создание) для любой сущности из реестра.
 * GET  /api/[entity]      — список
 * POST /api/[entity]      — создать
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { asc, desc } from 'drizzle-orm';
import { getVisibleEntity } from '@/lib/entities';
import { authorize, coerceBody, dbErrorResponse, jsonError, clientIp } from '@/lib/api-helpers';
import { logAudit } from '@/lib/audit';
import { revalidateFromEntity } from '@/lib/revalidate-web';
import { readJsonBody } from '@/lib/cp1251';

// Пагинация по умолчанию — защита от DoS / утечки PII на больших таблицах.
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> },
) {
  const { entity: slug } = await params;
  const entity = getVisibleEntity(slug);
  if (!entity) return jsonError('Неизвестная сущность', 404);

  const auth = await authorize('content:read');
  if ('error' in auth) return auth.error;

  try {
    // Пагинация: ?limit= (1..200, default 50), ?offset= (>= 0, default 0).
    const sp = request.nextUrl.searchParams;
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(sp.get('limit') ?? DEFAULT_LIMIT)));
    const offset = Math.max(0, Number(sp.get('offset') ?? 0));

    const table = entity.table as unknown as Record<string, unknown>;
    const col = table[entity.orderBy] as never;
    const orderFn = entity.orderDir === 'desc' ? desc : asc;
    const rows = await db
      .select()
      .from(entity.table)
      .orderBy(orderFn(col))
      .limit(limit)
      .offset(offset);
    return NextResponse.json({ data: rows, pagination: { limit, offset } });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> },
) {
  const { entity: slug } = await params;
  const entity = getVisibleEntity(slug);
  if (!entity) return jsonError('Неизвестная сущность', 404);

  const auth = await authorize('content:write');
  if ('error' in auth) return auth.error;

  // Singleton-сущности (hero-configs, footer-configs) — единственная запись
  // редактируется через PUT, создавать вторую нельзя. Раньше попытка
  // возвращала 500 (constraint violation), теперь — понятный 409.
  if (entity.singleton) {
    return jsonError(
      'Эта сущность — singleton: редактируйте существующую запись через PUT /api/' +
        slug +
        '/:id',
      409,
    );
  }

  try {
    const raw = await readJsonBody<Record<string, unknown>>(request);
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

    // On-demand revalidation web'а — сразу перерендерит затронутые страницы.
    // Fire-and-forget: не блокируем ответ на случай если web недоступен.
    revalidateFromEntity(slug);

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
