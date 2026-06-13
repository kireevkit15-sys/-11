/**
 * Diva Admin — Partners API (single item)
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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const item = await db.query.partners.findFirst({ where: eq(partners.id, id) });
    if (!item) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
    return NextResponse.json({ data: item });
  } catch (error) {
    console.error('[API] GET partner:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.name?.trim()) return NextResponse.json({ error: 'Имя обязательно' }, { status: 400 });
    if (!body.role?.trim()) return NextResponse.json({ error: 'Роль обязательна' }, { status: 400 });

    const result = await db.update(partners).set({
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
    }).where(eq(partners.id, id)).returning();

    if (!result[0]) return NextResponse.json({ error: 'Не найден' }, { status: 404 });
    return NextResponse.json({ data: result[0] });
  } catch (error) {
    console.error('[API] PUT partner:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    await db.delete(partners).where(eq(partners.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE partner:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
