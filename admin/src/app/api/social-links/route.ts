/**
 * Diva Admin — Social Links API
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { socialLinks } from '@/lib/schema';
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
    const all = await db.query.socialLinks.findMany({ orderBy: (sl, { asc }) => [asc(sl.sortOrder)] });
    return NextResponse.json({ data: all });
  } catch (error) {
    console.error('[API] GET social_links:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await request.json();
    if (!body.platform?.trim()) return NextResponse.json({ error: 'Платформа обязательна' }, { status: 400 });
    if (!body.label?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
    if (!body.href?.trim()) return NextResponse.json({ error: 'URL обязателен' }, { status: 400 });

    const result = await db.insert(socialLinks).values({
      platform: body.platform,
      label: body.label,
      href: body.href,
      actionText: body.actionText || null,
      iconColor: body.iconColor || null,
      sortOrder: body.sortOrder || 0,
    }).returning();
    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('[API] POST social_links:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
