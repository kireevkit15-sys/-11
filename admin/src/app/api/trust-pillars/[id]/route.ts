/**
 * Diva Admin — Trust Pillars API (by ID)
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trustPillars } from '@/lib/schema';
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
  const item = await db.query.trustPillars.findFirst({ where: eq(trustPillars.id, id) });
  if (!item) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
  return NextResponse.json({ data: item });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const body = await request.json();
  const result = await db.update(trustPillars).set({
    number: body.number,
    title: body.title,
    content: body.content,
    quote: body.quote,
    hue: body.hue,
    sortOrder: body.sortOrder,
  }).where(eq(trustPillars.id, id)).returning();
  if (!result[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
  return NextResponse.json({ data: result[0] });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const result = await db.delete(trustPillars).where(eq(trustPillars.id, id)).returning();
  if (!result[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
  return NextResponse.json({ success: true });
}
