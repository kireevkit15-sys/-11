/**
 * Diva Admin — Заявки (CRM): список лидов.
 * GET /api/leads — список лидов, сортировка по createdAt desc.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { desc } from 'drizzle-orm';
import { leads } from '@db/schema';
import { authorize, dbErrorResponse } from '@/lib/api-helpers';

export async function GET() {
  const auth = await authorize('content:read');
  if ('error' in auth) return auth.error;

  try {
    const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
    return NextResponse.json({ data: rows });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
