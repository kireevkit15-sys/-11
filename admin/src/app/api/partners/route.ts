/**
 * Diva Admin — Partners API
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { partners } from '@/lib/schema';
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
    const all = await db.query.partners.findMany({ orderBy: (p, { asc }) => [asc(p.sortOrder)] });
    return NextResponse.json({ data: all });
  } catch (error) {
    console.error('[API] GET partners:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await request.json();
    if (!body.name?.trim()) return NextResponse.json({ error: 'Имя обязательно' }, { status: 400 });
    if (!body.role?.trim()) return NextResponse.json({ error: 'Роль обязательна' }, { status: 400 });

    const result = await db.insert(partners).values({
      name: body.name,
      role: body.role,
      company: body.company || null,
      bio: body.bio || null,
      photoUrl: body.photoUrl || null,
      skills: body.skills || [],
      githubLink: body.githubLink || null,
      portfolioLink: body.portfolioLink || null,
      vkLink: body.vkLink || null,
      telegramLink: body.telegramLink || null,
      contact: body.contact || null,
      badge: body.badge || 'team',
      hue: body.hue || 240,
      available: body.available ?? true,
      featured: body.featured ?? false,
      category: body.category || 'fullstack',
      sortOrder: body.sortOrder || 0,
    }).returning();
    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('[API] POST partners:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
