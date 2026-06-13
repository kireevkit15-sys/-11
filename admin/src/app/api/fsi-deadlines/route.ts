/**
 * Diva Admin — FSI Deadlines API
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fsiDeadlines } from '@/lib/schema';
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
    const all = await db.query.fsiDeadlines.findMany({ orderBy: (fd, { asc }) => [asc(fd.deadlineDate)] });
    return NextResponse.json({ data: all });
  } catch (error) {
    console.error('[API] GET fsi_deadlines:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await request.json();
    if (!body.title?.trim()) return NextResponse.json({ error: 'Заголовок обязателен' }, { status: 400 });
    if (!body.deadlineDate) return NextResponse.json({ error: 'Дата дедлайна обязательна' }, { status: 400 });

    const result = await db.insert(fsiDeadlines).values({
      title: body.title,
      description: body.description || null,
      deadlineDate: new Date(body.deadlineDate),
      grantType: body.grantType || 'Старт',
      stage: body.stage || null,
      url: body.url || null,
    }).returning();
    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('[API] POST fsi_deadlines:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
