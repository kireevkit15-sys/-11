/**
 * Diva Admin — Site Statistics API
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { siteStatistics } from '@/lib/schema';
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
    const all = await db.query.siteStatistics.findMany({ orderBy: (ss, { asc }) => [asc(ss.sortOrder)] });
    return NextResponse.json({ data: all });
  } catch (error) {
    console.error('[API] GET site_statistics:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await request.json();
    if (!body.key?.trim()) return NextResponse.json({ error: 'Ключ обязателен' }, { status: 400 });
    if (body.value === undefined) return NextResponse.json({ error: 'Значение обязательно' }, { status: 400 });
    if (!body.label?.trim()) return NextResponse.json({ error: 'Подпись обязательна' }, { status: 400 });

    const result = await db.insert(siteStatistics).values({
      key: body.key,
      value: body.value,
      suffix: body.suffix || null,
      label: body.label,
      caption: body.caption || null,
      sortOrder: body.sortOrder || 0,
    }).returning();
    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('[API] POST site_statistics:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}