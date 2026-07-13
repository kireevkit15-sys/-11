/**
 * DIVA — Content API Routes
 *
 * Публичные API маршруты для контента сайта.
 * Заменяет Strapi — все данные из PostgreSQL через Drizzle ORM.
 *
 * GET /api/content/[entity] — получить список записей
 * GET /api/content/[entity]/[id] — получить одну запись
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { eq, asc, and, gte, getTableColumns, type SQL } from 'drizzle-orm';
import type { AnyPgTable, AnyPgColumn } from 'drizzle-orm/pg-core';
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
  partners,
  heroConfigs,
  footerConfigs,
  announcementMessages,
} from '@/db/schema';

// Маппинг entity name -> schema
const TABLES: Record<string, AnyPgTable> = {
  'hero-configs': heroConfigs,
  'footer-configs': footerConfigs,
  'announcement-messages': announcementMessages,
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
  'partners': partners,
};

// Маппинг для where clauses
const TABLE_WHERE_COLUMNS: Record<string, Record<string, AnyPgColumn>> = {
  'services': { slug: services.slug, key: services.key },
  'case-studies': { slug: caseStudies.slug },
  'team-members': { isFounder: teamMembers.isFounder },
  'announcements': { featured: announcements.featured, available: announcements.available },
  'reviews': {},
  'faqs': { category: faqs.category },
  'articles': { slug: articles.slug, category: articles.category },
  'videos': {},
  'site-statistics': {},
  'district-stats': {},
  'navigation-items': { type: navigationItems.type },
  'social-links': {},
  'trust-pillars': {},
  'fsi-deadlines': { upcoming: fsiDeadlines.deadlineDate },
  'glossary-terms': {},
  'partners': { category: partners.category, featured: partners.featured },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;

  if (!TABLES[entity]) {
    return NextResponse.json({ error: 'Неизвестная сущность' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const table = TABLES[entity];
    const whereColumns = TABLE_WHERE_COLUMNS[entity] || {};

    // Базовый запрос (dynamic — позволяет докручивать where/orderBy/limit без потери типа)
    let query = db.select().from(table).$dynamic();

    // Применяем фильтры из query params
    const filters: SQL[] = [];

    // Фильтр по slug
    if (searchParams.has('slug') && whereColumns.slug) {
      filters.push(eq(whereColumns.slug, searchParams.get('slug')!));
    }

    // Фильтр по category
    if (searchParams.has('category') && whereColumns.category) {
      filters.push(eq(whereColumns.category, searchParams.get('category')!));
    }

    // Фильтр по type
    if (searchParams.has('type') && whereColumns.type) {
      filters.push(eq(whereColumns.type, searchParams.get('type')!));
    }

    // Фильтр по isFounder
    if (searchParams.has('isFounder') && whereColumns.isFounder) {
      filters.push(eq(whereColumns.isFounder, searchParams.get('isFounder') === 'true'));
    }

    // Фильтр по featured
    if (searchParams.has('featured') && whereColumns.featured) {
      filters.push(eq(whereColumns.featured, searchParams.get('featured') === 'true'));
    }

    // Фильтр по available
    if (searchParams.has('available') && whereColumns.available) {
      filters.push(eq(whereColumns.available, searchParams.get('available') === 'true'));
    }

    // Фильтр по upcoming (fsi-deadlines)
    if (searchParams.has('upcoming') && entity === 'fsi-deadlines') {
      filters.push(gte(fsiDeadlines.deadlineDate, new Date()));
    }

    // Применяем фильтры и сортировку
    if (filters.length > 0) {
      query = query.where(and(...filters));
    }

    // Сортировка по sortOrder
    const { sortOrder } = getTableColumns(table);
    if (sortOrder) {
      query = query.orderBy(asc(sortOrder));
    }

    // Лимит
    const limit = parseInt(searchParams.get('limit') || '100');
    query = query.limit(limit);

    const records = await query;

    return NextResponse.json({ data: records });
  } catch (error) {
    console.error(`[Content API] GET /${entity}:`, error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
