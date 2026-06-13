/**
 * FAQs API by ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { faqs } from '@/lib/schema';
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
  const faq = await db.query.faqs.findFirst({ where: eq(faqs.id, id) });
  if (!faq) return NextResponse.json({ error: 'FAQ не найден' }, { status: 404 });

  return NextResponse.json({ data: faq });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const [updated] = await db.update(faqs)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(faqs.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'FAQ не найден' }, { status: 404 });
  return NextResponse.json({ data: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { id } = await params;
  const [deleted] = await db.delete(faqs).where(eq(faqs.id, id)).returning();

  if (!deleted) return NextResponse.json({ error: 'FAQ не найден' }, { status: 404 });
  return NextResponse.json({ success: true });
}
