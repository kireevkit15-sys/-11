/**
 * Diva Admin — Services API Routes (by ID)
 *
 * GET    /api/services/:id — Get service by ID
 * PUT    /api/services/:id — Update service
 * DELETE /api/services/:id — Delete service
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { services } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

async function requireAuth() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('admin_session')?.value;
  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
  return null;
}

// GET /api/services/:id
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const service = await db.query.services.findFirst({
    where: eq(services.id, id),
  });

  if (!service) {
    return NextResponse.json({ error: 'Услуга не найдена' }, { status: 404 });
  }

  return NextResponse.json({ data: service });
}

// PUT /api/services/:id
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  // Validate required fields
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
  }
  if (!body.slug?.trim()) {
    return NextResponse.json({ error: 'Slug обязателен' }, { status: 400 });
  }

  // Check for duplicate slug (excluding current service)
  if (body.slug) {
    const existing = await db.query.services.findFirst({
      where: eq(services.slug, body.slug),
    });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: 'Slug уже существует' }, { status: 400 });
    }
  }

  const result = await db.update(services)
    .set({
      title: body.title,
      slug: body.slug,
      taxSystem: body.taxSystem,
      basePrice: body.basePrice,
      includes: body.includes,
      targetAudience: body.targetAudience,
      isHighlighted: body.isHighlighted,
      key: body.key,
      sortOrder: body.sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(services.id, id))
    .returning();

  if (!result[0]) {
    return NextResponse.json({ error: 'Услуга не найдена' }, { status: 404 });
  }

  return NextResponse.json({ data: result[0] });
}

// DELETE /api/services/:id
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const result = await db.delete(services)
    .where(eq(services.id, id))
    .returning();

  if (!result[0]) {
    return NextResponse.json({ error: 'Услуга не найдена' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
