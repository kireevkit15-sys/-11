/**
 * Diva Admin — Glossary Terms API
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { glossaryTerms } from '@/lib/schema';
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
    const all = await db.query.glossaryTerms.findMany({ orderBy: (gt, { asc }) => [asc(gt.term)] });
    return NextResponse.json({ data: all });
  } catch (error) {
    console.error('[API] GET glossary_terms:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await request.json();
    if (!body.term?.trim()) return NextResponse.json({ error: 'Термин обязателен' }, { status: 400 });
    if (!body.definition?.trim()) return NextResponse.json({ error: 'Определение обязательно' }, { status: 400 });

    const result = await db.insert(glossaryTerms).values({
      term: body.term,
      definition: body.definition,
      category: body.category || null,
      sortOrder: body.sortOrder || 0,
    }).returning();
    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('[API] POST glossary_terms:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
