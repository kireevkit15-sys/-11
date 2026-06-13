/**
 * Diva Admin — Services API Routes
 *
 * GET  /api/services      — List all services
 * POST /api/services      — Create new service
 * GET  /api/services/:id — Get service by ID
 * PUT  /api/services/:id — Update service
 * DELETE /api/services/:id — Delete service
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { services } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

// Require authentication helper
async function requireAuth() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('admin_session')?.value;
  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
  return null;
}

// GET /api/services — List all
export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const all = await db.query.services.findMany({
      orderBy: (services, { asc }) => [asc(services.sortOrder)],
    });
    return NextResponse.json({ data: all });
  } catch (error) {
    console.error('[API] GET services:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST /api/services — Create
export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
    }
    if (!body.slug?.trim()) {
      return NextResponse.json({ error: 'Slug обязателен' }, { status: 400 });
    }

    // Check for duplicate slug
    const existing = await db.query.services.findFirst({
      where: eq(services.slug, body.slug),
    });
    if (existing) {
      return NextResponse.json({ error: 'Slug уже существует' }, { status: 400 });
    }

    const result = await db.insert(services).values({
      title: body.title,
      slug: body.slug,
      taxSystem: body.taxSystem || 'УСН-Д',
      basePrice: body.basePrice || null,
      includes: body.includes || [],
      targetAudience: body.targetAudience || null,
      isHighlighted: body.isHighlighted || false,
      key: body.key || null,
      sortOrder: body.sortOrder || 0,
    }).returning();

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('[API] POST services:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
