/**
 * Diva Admin — Trust Pillars API
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trustPillars } from '@/lib/schema';
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
    const all = await db.query.trustPillars.findMany({ orderBy: (tp, { asc }) => [asc(tp.sortOrder)] });
    return NextResponse.json({ data: all });
  } catch (error) {
    console.error('[API] GET trust_pillars:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await request.json();
    if (!body.number?.trim()) return NextResponse.json({ error: 'Номер обязателен' }, { status: 400 });
    if (!body.title?.trim()) return NextResponse.json({ error: 'Заголовок обязателен' }, { status: 400 });

    const result = await db.insert(trustPillars).values({
      number: body.number,
      title: body.title,
      content: body.content || null,
      quote: body.quote || null,
      hue: body.hue || 270,
      sortOrder: body.sortOrder || 0,
    }).returning();
    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('[API] POST trust_pillars:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
