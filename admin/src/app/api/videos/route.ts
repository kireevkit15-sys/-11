/**
 * Diva Admin — Videos API
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { videos } from '@/lib/schema';
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
    const all = await db.query.videos.findMany({ orderBy: (v, { asc }) => [asc(v.sortOrder)] });
    return NextResponse.json({ data: all });
  } catch (error) {
    console.error('[API] GET videos:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await request.json();
    if (!body.title?.trim()) return NextResponse.json({ error: 'Заголовок обязателен' }, { status: 400 });
    if (!body.videoId?.trim()) return NextResponse.json({ error: 'ID видео обязателен' }, { status: 400 });

    const result = await db.insert(videos).values({
      title: body.title,
      videoId: body.videoId,
      platform: body.platform || 'youtube',
      description: body.description || null,
      views: body.views || 0,
      duration: body.duration || null,
      thumbnailUrl: body.thumbnailUrl || null,
      sortOrder: body.sortOrder || 0,
    }).returning();
    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('[API] POST videos:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
