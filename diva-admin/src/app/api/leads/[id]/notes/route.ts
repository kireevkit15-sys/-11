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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const auth = await authorize('content:write');
  if ('error' in auth) return auth.error;

  try {
    const raw = (await request.json()) as Record<string, unknown>;
    const text = raw.text === null || raw.text === undefined ? '' : String(raw.text).trim();
    if (text === '') return jsonError('Текст заметки обязателен', 400);

    const [lead] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, id)).limit(1);
    if (!lead) return jsonError('Заявка не найдена', 404);

    const user = await currentUser();
    const author = user?.name ?? 'Система';

    const [note] = await db
      .insert(leadNotes)
      .values({ leadId: id, text, author })
      .returning();

    await logAudit({
      userId: auth.user.id,
      action: 'create',
      entity: 'lead_notes',
      entityId: note.id,
      payload: { leadId: id, text },
      ip: clientIp(request),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
