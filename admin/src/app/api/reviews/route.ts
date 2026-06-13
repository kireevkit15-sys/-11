/**
 * Reviews API
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews } from '@/lib/schema';
import { cookies } from 'next/headers';

async function getSession() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const all = await db.query.reviews.findMany({ orderBy: (r, { desc }) => [desc(r.createdAt)] });
  return NextResponse.json({ data: all });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const body = await request.json();

  if (!body.authorName?.trim()) return NextResponse.json({ error: 'Имя автора обязательно' }, { status: 400 });
  if (!body.text?.trim()) return NextResponse.json({ error: 'Текст отзыва обязателен' }, { status: 400 });

  const [review] = await db.insert(reviews).values({
    authorName: body.authorName,
    authorProject: body.authorProject || null,
    text: body.text,
    source: body.source || 'Email',
    sourceUrl: body.sourceUrl || null,
    rating: body.rating || 5,
    sortOrder: body.sortOrder || 0,
  }).returning();

  return NextResponse.json({ data: review }, { status: 201 });
}
