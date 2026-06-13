/**
 * Diva Admin — Public Content API
 *
 * This endpoint provides all public content for the website.
 * No authentication required.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [
      services,
      faqs,
      teamMembers,
      reviews,
      articles,
      videos,
      statistics,
      announcements,
    ] = await Promise.all([
      db.query.services.findMany({
        where: (s, { eq }) => eq(s.isHighlighted, true),
        orderBy: (s, { asc }) => [asc(s.sortOrder)],
      }),
      db.query.faqs.findMany({
        orderBy: (f, { asc }) => [asc(f.sortOrder)],
      }),
      db.query.teamMembers.findMany({
        orderBy: (tm, { asc }) => [asc(tm.sortOrder)],
      }),
      db.query.reviews.findMany({
        orderBy: (r, { desc }) => [desc(r.createdAt)],
        limit: 10,
      }),
      db.query.articles.findMany({
        orderBy: (a, { desc }) => [desc(a.createdAt)],
        limit: 6,
      }),
      db.query.videos.findMany({
        orderBy: (v, { asc }) => [asc(v.sortOrder)],
      }),
      db.query.siteStatistics.findMany({
        orderBy: (ss, { asc }) => [asc(ss.sortOrder)],
      }),
      db.query.announcements.findMany({
        where: (a, { and, eq }) => and(eq(a.available, true)),
        orderBy: (a, { asc }) => [asc(a.sortOrder)],
      }),
    ]);

    return NextResponse.json({
      services,
      faqs,
      teamMembers,
      reviews,
      articles,
      videos,
      statistics,
      announcements,
    });
  } catch (error) {
    console.error('[API] GET content:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
