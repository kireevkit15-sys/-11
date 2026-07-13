/**
 * DIVA — Content API Routes (Single Item)
 *
 * GET /api/content/[entity]/[id] — получить одну запись по ID
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { eq, getTableColumns } from 'drizzle-orm';
import type { AnyPgTable } from 'drizzle-orm/pg-core';
import {
  services,
  caseStudies,
  teamMembers,
  announcements,
  reviews,
  faqs,
  articles,
  videos,
  siteStatistics,
  districtStats,
  navigationItems,
  socialLinks,
  trustPillars,
  fsiDeadlines,
  glossaryTerms,
} from '@/db/schema';

const TABLES: Record<string, AnyPgTable> = {
  'services': services,
  'case-studies': caseStudies,
  'team-members': teamMembers,
  'announcements': announcements,
  'reviews': reviews,
  'faqs': faqs,
  'articles': articles,
  'videos': videos,
  'site-statistics': siteStatistics,
  'district-stats': districtStats,
  'navigation-items': navigationItems,
  'social-links': socialLinks,
  'trust-pillars': trustPillars,
  'fsi-deadlines': fsiDeadlines,
  'glossary-terms': glossaryTerms,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string; id: string }> }
) {
  const { entity, id } = await params;

  if (!TABLES[entity]) {
    return NextResponse.json({ error: 'Неизвестная сущность' }, { status: 400 });
  }

  try {
    const table = TABLES[entity];
    const { id: idColumn } = getTableColumns(table);
    if (!idColumn) {
      return NextResponse.json({ error: 'У сущности нет колонки id' }, { status: 500 });
    }

    const record = await db
      .select()
      .from(table)
      .where(eq(idColumn, id))
      .limit(1);

    if (record.length === 0) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
    }

    return NextResponse.json({ data: record[0] });
  } catch (error) {
    console.error(`[Content API] GET /${entity}/${id}:`, error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
