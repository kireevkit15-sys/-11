/**
 * Diva Admin — Заявки (CRM): одна заявка.
 * GET   /api/leads/[id] — лид + его заметки (leadNotes, по createdAt asc).
 * PATCH /api/leads/[id] — обновить status и/или notes / interactionAt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import { leads, leadNotes } from '@db/schema';
import { authorize, dbErrorResponse, jsonError, clientIp } from '@/lib/api-helpers';
import { logAudit } from '@/lib/audit';
import { isLeadStatus, LEAD_STATUSES } from '@/app/admin/leads/status';
import { readJsonBody } from '@/lib/cp1251';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const auth = await authorize('leads:read');
  if ('error' in auth) return auth.error;

  try {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    if (!lead) return jsonError('Заявка не найдена', 404);

    const notes = await db
      .select()
      .from(leadNotes)
      .where(eq(leadNotes.leadId, id))
      .orderBy(asc(leadNotes.createdAt));

    return NextResponse.json({ data: { lead, notes } });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const auth = await authorize('leads:write');
  if ('error' in auth) return auth.error;

  try {
    const raw = await readJsonBody<Record<string, unknown>>(request);
    const data: Record<string, unknown> = {};
    let prevStatus: string | undefined;

    if (raw.status !== undefined) {
      if (!isLeadStatus(raw.status)) {
        return jsonError(
          `Недопустимый статус. Допустимые: ${Object.keys(LEAD_STATUSES).join(', ')}`,
          400,
        );
      }
      prevStatus = raw.status;
      data.status = raw.status;
    }

    if (raw.notes !== undefined) {
      data.notes = raw.notes === null ? null : String(raw.notes);
    }

    if (raw.interactionAt !== undefined) {
      if (raw.interactionAt === null || raw.interactionAt === '') {
        data.interactionAt = null;
      } else {
        const d = new Date(String(raw.interactionAt));
        if (Number.isNaN(d.getTime())) return jsonError('Некорректная дата взаимодействия', 400);
        data.interactionAt = d;
      }
    }

    if (Object.keys(data).length === 0) {
      return jsonError('Нет полей для обновления', 400);
    }

    data.updatedAt = new Date();

    const [updated] = await db.update(leads).set(data).where(eq(leads.id, id)).returning();
    if (!updated) return jsonError('Заявка не найдена', 404);

    const auditPayload: Record<string, unknown> = { fields: Object.keys(data) };
    if (prevStatus !== undefined && prevStatus !== updated.status) {
      auditPayload.status = { from: prevStatus, to: updated.status };
    }

    await logAudit({
      userId: auth.user.id,
      action: 'update',
      entity: 'leads',
      entityId: id,
      payload: auditPayload,
      ip: clientIp(request),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
