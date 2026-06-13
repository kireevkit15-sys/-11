/**
 * Team Members API by ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teamMembers } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

async function getSession() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { id } = await params;
  const member = await db.query.teamMembers.findFirst({ where: eq(teamMembers.id, id) });
  if (!member) return NextResponse.json({ error: 'Не найден' }, { status: 404 });

  return NextResponse.json({ data: member });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const [updated] = await db.update(teamMembers)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(teamMembers.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
  return NextResponse.json({ data: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { id } = await params;
  const [deleted] = await db.delete(teamMembers).where(eq(teamMembers.id, id)).returning();

  if (!deleted) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
  return NextResponse.json({ success: true });
}
