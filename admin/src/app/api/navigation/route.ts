/**
 * Diva Admin — Navigation Items API
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { navigationItems } from '@/lib/schema';
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
    const all = await db.query.navigationItems.findMany({ orderBy: (ni, { asc }) => [asc(ni.sortOrder)] });
    return NextResponse.json({ data: all });
  } catch (error) {
    console.error('[API] GET navigation_items:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await request.json();
    if (!body.label?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
    if (!body.href?.trim()) return NextResponse.json({ error: 'Ссылка обязательна' }, { status: 400 });

    const result = await db.insert(navigationItems).values({
      label: body.label,
      href: body.href,
      type: body.type || 'nav',
      icon: body.icon || null,
      description: body.description || null,
      sortOrder: body.sortOrder || 0,
    }).returning();
    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('[API] POST navigation_items:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}