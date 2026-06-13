/**
 * FAQs API
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { faqs } from '@/lib/schema';
import { cookies } from 'next/headers';

async function getSession() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  try {
    const all = await db.query.faqs.findMany({ orderBy: (f, { asc }) => [asc(f.sortOrder)] });
    return NextResponse.json({ data: all });
  } catch (error) {
    console.error('[API] GET faqs:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  try {
    const { question, answer, category, sortOrder } = await request.json();

    if (!question?.trim()) return NextResponse.json({ error: 'Вопрос обязателен' }, { status: 400 });
    if (!answer?.trim()) return NextResponse.json({ error: 'Ответ обязателен' }, { status: 400 });

    const [faq] = await db.insert(faqs).values({
      question,
      answer,
      category: category || 'Бухгалтерия',
      sortOrder: sortOrder || 0,
    }).returning();

    return NextResponse.json({ data: faq }, { status: 201 });
  } catch (error) {
    console.error('[API] POST faqs:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
