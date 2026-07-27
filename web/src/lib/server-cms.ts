/**
 * Server-only data loaders для RSC.
 *
 * Загружают данные напрямую из БД через Drizzle, минуя HTTP-цикл
 * `/api/content/*`. Это нужно потому что:
 *   - внутри Next.js RSC fetch() на относительный URL хрупок
 *     (особенно когда NEXT_PUBLIC_SITE_URL указывает на порт,
 *     занятый другим стеком);
 *   - прямой доступ к БД в 10× быстрее (нет HTTP overhead);
 *   - SSR сразу получает реальные данные, без client fetch race.
 *
 * Используется только в server components (async function page()).
 * На клиенте — обычные fetch к /api/content/*.
 */

import { cache } from 'react';
import { asc, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { teamMembers, faqs, partners } from '@/db/schema';

export type ServerFaq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
};

/**
 * Загружает FAQ из БД для RSC. Кешируется в рамках одного запроса через React.cache.
 * Сортировка: по sortOrder, чтобы порядок, заданный в админке, сохранялся.
 */
export const getServerFaqs = cache(async (): Promise<ServerFaq[]> => {
  try {
    const rows = await db
      .select({
        id: faqs.id,
        question: faqs.question,
        answer: faqs.answer,
        category: faqs.category,
        sortOrder: faqs.sortOrder,
      })
      .from(faqs)
      .orderBy(asc(faqs.sortOrder));
    return rows;
  } catch (err) {
    console.error('[serverCms] getServerFaqs failed', err);
    return [];
  }
});

export type ServerPartner = {
  id: string;
  name: string;
  role: string;
  company: string | null;
  logoUrl: string | null;
  bio: string | null;
  skills: unknown;
  githubLink: string | null;
  portfolioLink: string | null;
  vkLink: string | null;
  telegramLink: string | null;
  contact: string | null;
  badge: string | null;
  hue: number | null;
  available: boolean;
  featured: boolean | null;
  category: string;
  sortOrder: number;
};

/**
 * Загружает доступных партнёров из БД для RSC.
 * Кешируется в рамках одного запроса через React.cache.
 *
 * Применяем фильтр available=true: «серый»/архивный партнёр не должен
 * показываться на публичном сайте. Сортировка по sortOrder — порядок
 * задаётся в admin через drag-and-drop.
 */
export const getServerPartners = cache(async (): Promise<ServerPartner[]> => {
  try {
    const rows = await db
      .select({
        id: partners.id,
        name: partners.name,
        role: partners.role,
        company: partners.company,
        logoUrl: partners.logoUrl,
        bio: partners.bio,
        skills: partners.skills,
        githubLink: partners.githubLink,
        portfolioLink: partners.portfolioLink,
        vkLink: partners.vkLink,
        telegramLink: partners.telegramLink,
        contact: partners.contact,
        badge: partners.badge,
        hue: partners.hue,
        available: partners.available,
        featured: partners.featured,
        category: partners.category,
        sortOrder: partners.sortOrder,
      })
      .from(partners)
      .where(eq(partners.available, true))
      .orderBy(asc(partners.sortOrder));
    return rows;
  } catch (err) {
    console.error('[serverCms] getServerPartners failed', err);
    return [];
  }
});

export type ServerTeamMember = {
  id: string;
  fullName: string;
  position: string;
  photoUrl: string | null;
  bio: string | null;
  education: string | null;
  yearsExperience: number | null;
  specialization: string | null;
  quote: string | null;
  isFounder: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Загружает команду из БД для RSC.
 * Кешируется в рамках одного запроса через React.cache.
 */
export const getServerTeamMembers = cache(async (): Promise<ServerTeamMember[]> => {
  try {
    const rows = await db
      .select({
        id: teamMembers.id,
        fullName: teamMembers.fullName,
        position: teamMembers.position,
        photoUrl: teamMembers.photoUrl,
        bio: teamMembers.bio,
        education: teamMembers.education,
        yearsExperience: teamMembers.yearsExperience,
        specialization: teamMembers.specialization,
        quote: teamMembers.quote,
        isFounder: teamMembers.isFounder,
        sortOrder: teamMembers.sortOrder,
        createdAt: teamMembers.createdAt,
        updatedAt: teamMembers.updatedAt,
      })
      .from(teamMembers)
      .orderBy(teamMembers.sortOrder, desc(teamMembers.isFounder));
    return rows;
  } catch (err) {
    console.error('[serverCms] getServerTeamMembers failed', err);
    return [];
  }
});
