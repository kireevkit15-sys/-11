/**
 * Diva Admin — Case Studies API
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

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const all = await db.query.caseStudies.findMany({ orderBy: (cs, { desc }) => [desc(cs.createdAt)] });
    return NextResponse.json({ data: all });
  } catch (error) {
    console.error('[API] GET case_studies:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await request.json();
    if (!body.title?.trim()) return NextResponse.json({ error: 'Заголовок обязателен' }, { status: 400 });
    if (!body.slug?.trim()) return NextResponse.json({ error: 'Slug обязателен' }, { status: 400 });

    const existing = await db.query.caseStudies.findFirst({ where: eq(caseStudies.slug, body.slug) });
    if (existing) return NextResponse.json({ error: 'Slug уже существует' }, { status: 400 });

    const result = await db.insert(caseStudies).values({
      title: body.title,
      slug: body.slug,
      clientName: body.clientName || null,
      clientLogoUrl: body.clientLogoUrl || null,
      tags: body.tags || [],
      task: body.task || null,
      solution: body.solution || null,
      result: body.result || null,
      quote: body.quote || null,
      quoteAuthor: body.quoteAuthor || null,
      period: body.period || null,
      sortOrder: body.sortOrder || 0,
    }).returning();
    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('[API] POST case_studies:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}