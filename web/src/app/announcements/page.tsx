/**
 * Server-component обёртка для /announcements.
 *
 * Раньше страница была полностью 'use client' и подтягивала партнёров через
 * fetch к /api/content/partners. Это приводило к:
 *   - пустому HTML на SSR (FCP мигал «1 команда», потом дорисовывался реальный список);
 *   - «новый партнёр появится только после F5» при ручном изменении в admin;
 *   - лишнему HTTP-циклу на каждый заход.
 *
 * Сейчас данные грузятся **напрямую из БД** через getServerPartners() в
 * рамках одного RSC-рендера, мапятся в типизированный `Partner[]` shape,
 * понятный клиентскому `AnnouncementsView`, и передаются как prop. Это
 * гарантирует:
 *   - SSR HTML уже содержит все карточки (важно для SEO и быстрого FCP);
 *   - между admin PUT и видимостью на сайте — разница ровно в одну
 *     on-demand revalidation (см. diva-admin/src/lib/revalidate-web.ts),
 *     без ручного F5.
 */

import { getServerPartners } from '@/lib/server-cms'
import type { Partner } from '@/data/partners'
import { AnnouncementsView } from './announcements-view'

// Server-component children могут быть Promise<...> в React 19 — но в Next.js
// 15 мы используем обычный async/await: данные приходят до возврата JSX.

// Страница должна рендериться на каждый запрос, а не закэшироваться в
// build-time статикой. Иначе Next рендерит RSC на этапе `next build` без
// DATABASE_URL (БД доступна только в runtime), getServerPartners() падает
// в catch (return []), и страница кешируется ПУСТОЙ — даже если в БД
// уже есть партнёры. С force-dynamic RSC выполняется при каждом заходе
// пользователя, что и нужно для динамического контента.
export const dynamic = 'force-dynamic'

export default async function AnnouncementsPage() {
  const rows = await getServerPartners()

  // Маппинг ServerPartner → Partner (UI-shape). Защита от null/undefined по
  // каждому полю, потому что в БД много опциональных колонок.
  const initialPartners: Partner[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    company: r.company ?? '',
    logoUrl: r.logoUrl,
    bio: r.bio ?? '',
    skills: Array.isArray(r.skills) ? (r.skills as string[]) : [],
    links: {
      github: r.githubLink ?? undefined,
      portfolio: r.portfolioLink ?? undefined,
      vk: r.vkLink ?? undefined,
      telegram: r.telegramLink ?? undefined,
    },
    contact: r.contact ?? '',
    // В БД badge может быть null (новые записи в админке не заполняются);
    // в UI допустимы только 'team' | 'client'.
    badge: r.badge === 'client' ? 'client' : 'team',
    hue: typeof r.hue === 'number' ? r.hue : 240,
    available: r.available,
    featured: r.featured ?? false,
    // DB хранит произвольный текст; на UI ожидается enum-категория.
    category: normalizeCategory(r.category),
    // Множественные категории для фильтров на сайте. Гарантируем массив
    // и фильтруем только строки (защита от мусора в jsonb).
    categories: Array.isArray(r.categories)
      ? r.categories.filter((c): c is string => typeof c === 'string')
      : [],
  }))

  return <AnnouncementsView initialPartners={initialPartners} />
}

function normalizeCategory(
  raw: string | null | undefined,
): Partner['category'] {
  const allowed: Partner['category'][] = [
    'fullstack',
    'mobile',
    'ai',
    'devops',
    'design',
    'other',
  ]
  return allowed.includes(raw as Partner['category'])
    ? (raw as Partner['category'])
    : 'fullstack'
}
