/**
 * Diva Admin — Case Studies API (by ID)
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { caseStudies } from '@/lib/schema';
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
  const cs = await db.query.caseStudies.findFirst({ where: eq(caseStudies.id, id) });
  if (!cs) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
  return NextResponse.json({ data: cs });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const body = await request.json();

  if (body.slug) {
    const existing = await db.query.caseStudies.findFirst({ where: eq(caseStudies.slug, body.slug) });
    if (existing && existing.id !== id) return NextResponse.json({ error: 'Slug уже существует' }, { status: 400 });
  }

  const result = await db.update(caseStudies).set({
    title: body.title,
    slug: body.slug,
    clientName: body.clientName,
    clientLogoUrl: body.clientLogoUrl,
    tags: body.tags,
    task: body.task,
    solution: body.solution,
    result: body.result,
    quote: body.quote,
    quoteAuthor: body.quoteAuthor,
    period: body.period,
    sortOrder: body.sortOrder,
  }).where(eq(caseStudies.id, id)).returning();
  if (!result[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
  return NextResponse.json({ data: result[0] });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const result = await db.delete(caseStudies).where(eq(caseStudies.id, id)).returning();
  if (!result[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
  return NextResponse.json({ success: true });
}