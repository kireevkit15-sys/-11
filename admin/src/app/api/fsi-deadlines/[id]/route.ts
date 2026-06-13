/**
 * Diva Admin — FSI Deadlines API (by ID)
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fsiDeadlines } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

async function requireAuth() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('admin_session')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  return null;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const item = await db.query.fsiDeadlines.findFirst({ where: eq(fsiDeadlines.id, id) });
  if (!item) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
  return NextResponse.json({ data: item });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const body = await request.json();
  const result = await db.update(fsiDeadlines).set({
    title: body.title,
    description: body.description,
    deadlineDate: body.deadlineDate ? new Date(body.deadlineDate) : undefined,
    grantType: body.grantType,
    stage: body.stage,
    url: body.url,
  }).where(eq(fsiDeadlines.id, id)).returning();
  if (!result[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
  return NextResponse.json({ data: result[0] });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const result = await db.delete(fsiDeadlines).where(eq(fsiDeadlines.id, id)).returning();
  if (!result[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
  return NextResponse.json({ success: true });
}
