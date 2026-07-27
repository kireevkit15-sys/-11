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
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { teamMembers } from '@/db/schema';

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
