/**
 * Diva Admin — Заявки (CRM): заметки по заявке.
 * POST /api/leads/[id]/notes — добавить заметку (text), author = текущий пользователь.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { leads, leadNotes } from '@db/schema';
import { authorize, currentUser, dbErrorResponse, jsonError, clientIp } from '@/lib/api-helpers';
import { logAudit } from '@/lib/audit';
import { readJsonBody } from '@/lib/cp1251';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const auth = await authorize('leads:write');
  if ('error' in auth) return auth.error;

  try {
    const raw = await readJsonBody<Record<string, unknown>>(request);
    let text = raw.text === null || raw.text === undefined ? '' : String(raw.text).trim();
    if (text === '') return jsonError('Текст заметки обязателен', 400);
    // Ограничение на длину — без этого можно залить 10 МБ в одно поле.
    const MAX_NOTE_LEN = 5000;
    if (text.length > MAX_NOTE_LEN) {
      return jsonError(`Заметка слишком длинная (макс. ${MAX_NOTE_LEN} символов)`, 400);
    }

    const [lead] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, id)).limit(1);
    if (!lead) return jsonError('Заявка не найдена', 404);

    const user = await currentUser();
    const author = user?.name ?? 'Система';

    const [note] = await db
      .insert(leadNotes)
      .values({ leadId: id, text, author })
      .returning();

    // В audit лог кладём только метаданные, без полного текста заметки
    // (PII не должно утекать в логи и бэкапы).
    await logAudit({
      userId: auth.user.id,
      action: 'create',
      entity: 'lead_notes',
      entityId: note?.id ?? null,
      payload: { leadId: id, length: text.length },
      ip: clientIp(request),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
