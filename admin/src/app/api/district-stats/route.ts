/**
 * Diva Admin — District Stats API
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { districtStats } from '@/lib/schema';
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
    const all = await db.query.districtStats.findMany({ orderBy: (ds, { asc }) => [asc(ds.sortOrder)] });
    return NextResponse.json({ data: all });
  } catch (error) {
    console.error('[API] GET district_stats:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await request.json();
    if (!body.code?.trim()) return NextResponse.json({ error: 'Код обязателен' }, { status: 400 });
    if (!body.shortName?.trim()) return NextResponse.json({ error: 'Короткое название обязательно' }, { status: 400 });

    const result = await db.insert(districtStats).values({
      code: body.code,
      shortName: body.shortName,
      name: body.name || body.shortName,
      capital: body.capital || null,
      clients: body.clients || 0,
      color: body.color || null,
      sortOrder: body.sortOrder || 0,
    }).returning();
    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('[API] POST district_stats:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}