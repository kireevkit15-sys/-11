/**
 * Diva Admin — Social Links API (by ID)
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { socialLinks } from '@/lib/schema';
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
  const item = await db.query.socialLinks.findFirst({ where: eq(socialLinks.id, id) });
  if (!item) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
  return NextResponse.json({ data: item });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const body = await request.json();
  const result = await db.update(socialLinks).set({
    platform: body.platform,
    label: body.label,
    href: body.href,
    actionText: body.actionText,
    iconColor: body.iconColor,
    sortOrder: body.sortOrder,
  }).where(eq(socialLinks.id, id)).returning();
  if (!result[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
  return NextResponse.json({ data: result[0] });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const result = await db.delete(socialLinks).where(eq(socialLinks.id, id)).returning();
  if (!result[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
  return NextResponse.json({ success: true });
}
