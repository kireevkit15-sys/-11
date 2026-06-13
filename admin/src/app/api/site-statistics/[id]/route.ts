/**
 * Diva Admin — Site Statistics API (by ID)
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { siteStatistics } from '@/lib/schema';
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
  const stat = await db.query.siteStatistics.findFirst({ where: eq(siteStatistics.id, id) });
  if (!stat) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
  return NextResponse.json({ data: stat });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const body = await request.json();
  const result = await db.update(siteStatistics).set({
    key: body.key,
    value: body.value,
    suffix: body.suffix,
    label: body.label,
    caption: body.caption,
    sortOrder: body.sortOrder,
  }).where(eq(siteStatistics.id, id)).returning();
  if (!result[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
  return NextResponse.json({ data: result[0] });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const result = await db.delete(siteStatistics).where(eq(siteStatistics.id, id)).returning();
  if (!result[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
  return NextResponse.json({ success: true });
}