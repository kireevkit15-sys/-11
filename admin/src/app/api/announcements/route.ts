/**
 * Diva Admin — Announcements API
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { announcements } from '@/lib/schema';
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
    const all = await db.query.announcements.findMany({ orderBy: (a, { asc }) => [asc(a.sortOrder)] });
    return NextResponse.json({ data: all });
  } catch (error) {
    console.error('[API] GET announcements:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await request.json();
    if (!body.title?.trim()) return NextResponse.json({ error: 'Заголовок обязателен' }, { status: 400 });
    if (!body.key?.trim()) return NextResponse.json({ error: 'Ключ обязателен' }, { status: 400 });

    const existing = await db.query.announcements.findFirst({ where: eq(announcements.key, body.key) });
    if (existing) return NextResponse.json({ error: 'Ключ уже существует' }, { status: 400 });

    const result = await db.insert(announcements).values({
      title: body.title,
      content: body.content || '',
      key: body.key,
      category: body.category || 'Общее',
      badge: body.badge || 'team',
      hue: body.hue || 200,
      available: body.available !== false,
      featured: body.featured || false,
      sortOrder: body.sortOrder || 0,
    }).returning();
    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('[API] POST announcements:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
