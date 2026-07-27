/**
 * Diva Admin — Заявки (CRM): список лидов.
 * GET /api/leads — список лидов, сортировка по createdAt desc.
 *
 * Поддерживает:
 * - ?limit= (1..200, default 50),
 * - ?offset= (>= 0, default 0),
 * - ?status= (one of: new, in_progress, interaction_scheduled, spam, converted, lost),
 * - ?search= (ILIKE по contact и name).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { and, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { leads } from '@db/schema';
import { authorize, dbErrorResponse } from '@/lib/api-helpers';

const ALLOWED_STATUSES = [
  'new',
  'in_progress',
  'interaction_scheduled',
  'spam',
  'converted',
  'lost',
] as const;
type LeadStatus = (typeof ALLOWED_STATUSES)[number];

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * Экранирует SQL wildcards для LIKE/ILIKE.
 * Без этого пользовательский ввод `%` или `_` интерпретируется как wildcard,
 * и `?search=%` возвращает все заявки (PII).
 *
 * Также ограничиваем длину и обрезаем потенциальные символы, ломающие regex.
 */
function escapeLike(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

export async function GET(request: NextRequest) {
  const auth = await authorize('leads:read');
  if ('error' in auth) return auth.error;

  try {
    const sp = request.nextUrl.searchParams;
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(sp.get('limit') ?? DEFAULT_LIMIT)));
    const offset = Math.max(0, Number(sp.get('offset') ?? 0));
    const status = sp.get('status');
    const search = sp.get('search')?.trim();

    const filters: SQL[] = [];

    if (status && (ALLOWED_STATUSES as readonly string[]).includes(status)) {
      filters.push(eq(leads.status, status as LeadStatus));
    }

    if (search && search.length > 0 && search.length <= 200) {
      // Поиск по контакту и имени — ILIKE для нечувствительности к регистру.
      // Wildcards в user input экранируются — иначе ?search=% вернёт все записи.
      const pattern = `%${escapeLike(search)}%`;
      filters.push(or(ilike(leads.contact, pattern), ilike(leads.name, pattern))!);
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    const rows = await db
      .select()
      .from(leads)
      .where(where)
      .orderBy(desc(leads.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ data: rows, pagination: { limit, offset } });
  } catch (error) {
    return dbErrorResponse(error);
  }
}