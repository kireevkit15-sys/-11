/**
 * Diva Admin — Articles API
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { articles } from '@/lib/schema';
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
    const all = await db.query.articles.findMany({ orderBy: (a, { desc }) => [desc(a.createdAt)] });
    return NextResponse.json({ data: all });
  } catch (error) {
    console.error('[API] GET articles:', error);
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

    const existing = await db.query.articles.findFirst({ where: eq(articles.slug, body.slug) });
    if (existing) return NextResponse.json({ error: 'Slug уже существует' }, { status: 400 });

    const result = await db.insert(articles).values({
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt || null,
      body: body.body || null,
      coverUrl: body.coverUrl || null,
      category: body.category || 'Прочее',
      readingMinutes: body.readingMinutes || 5,
      seoTitle: body.seoTitle || null,
      seoDescription: body.seoDescription || null,
      sortOrder: body.sortOrder || 0,
    }).returning();
    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('[API] POST articles:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
