/**
 * Team Members API
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teamMembers } from '@/lib/schema';
import { cookies } from 'next/headers';

async function getSession() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const all = await db.query.teamMembers.findMany({ orderBy: (tm, { asc }) => [asc(tm.sortOrder)] });
  return NextResponse.json({ data: all });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const body = await request.json();

  if (!body.fullName?.trim()) return NextResponse.json({ error: 'ФИО обязательно' }, { status: 400 });
  if (!body.position?.trim()) return NextResponse.json({ error: 'Должность обязательна' }, { status: 400 });

  const [member] = await db.insert(teamMembers).values({
    fullName: body.fullName,
    position: body.position,
    photoUrl: body.photoUrl || null,
    bio: body.bio || null,
    education: body.education || null,
    yearsExperience: body.yearsExperience || null,
    specialization: body.specialization || null,
    quote: body.quote || null,
    sortOrder: body.sortOrder || 0,
    isFounder: body.isFounder || false,
  }).returning();

  return NextResponse.json({ data: member }, { status: 201 });
}
