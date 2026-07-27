/**
 * DIVA — CMS API Client (PostgreSQL/Drizzle)
 *
 * Заменяет Strapi. Все функции обращаются напрямую к нашей БД через API routes.
 * Типы данных соответствуют схеме БД (db/schema.ts).
 */

import type {
  Service,
  Faq,
  TeamMember,
  CaseStudy,
  Review,
  Article,
  Video,
  SiteStatistic,
  DistrictStat,
  NavigationItem,
  SocialLink,
  TrustPillar,
  FsiDeadline,
  GlossaryTerm,
  Announcement,
  Partner,
  HeroConfig,
  FooterConfig,
  AnnouncementMessage,
} from '@/db/schema';

// =============================================================================
// Конфигурация
// =============================================================================

// На клиенте относительный URL — браузер бьёт свой origin (где открыт сайт),
// это устраняет проблему, когда NEXT_PUBLIC_SITE_URL указывает на порт,
// занятый другим стеком. На сервере используем абсолютный URL из env.
const API_BASE = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_SITE_URL ?? '')
  : '';

// =============================================================================
// Типы для API ответов
// =============================================================================

interface ApiResponse<T> {
  data: T[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface ApiError {
  error: string;
}

// =============================================================================
// Вспомогательные функции
// =============================================================================

/**
 * Извлекает имя сущности из endpoint для тегирования ISR-кеша.
 *   '/services'         → 'services'
 *   '/videos?limit=10'  → 'videos'
 *   '/'                 → 'all'
 * Тег формируется как `cms:<entity>` в fetchApi ниже.
 */
function entityNameFromEndpoint(endpoint: string): string {
  const cleaned = endpoint.replace(/^\/+/, '').split('?')[0]!.split('/')[0]!;
  return cleaned || 'all';
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T[]> {
  const url = `${API_BASE}/api/content${endpoint}`;

  // Tag из slug: '/services' → 'cms:services'. Используется admin'ом
  // для on-demand revalidate через revalidateTag('cms:services').
  const tag = `cms:${entityNameFromEndpoint(endpoint)}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      // Кеширование: 60 секунд для Server Components + tag для on-demand
      // инвалидации через /api/revalidate из diva-admin.
      next: { revalidate: 60, tags: [tag] },
    });

    if (!response.ok) {
      console.debug(`[CMS] ${response.status} for ${endpoint}`);
      return [];
    }

    const result = await response.json() as ApiResponse<T>;
    return result.data || [];
  } catch {
    console.debug(`[CMS] Unavailable: ${endpoint}`);
    return [];
  }
}

// =============================================================================
// Services — Услуги
// =============================================================================

export type { Service };

export async function getServices(): Promise<Service[]> {
  try {
    return await fetchApi<Service>('/services');
  } catch {
    console.warn('[CMS] Failed to fetch services, using fallback');
    return [];
  }
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  try {
    const services = await fetchApi<Service>(`/services?slug=${encodeURIComponent(slug)}`);
    return services[0] ?? null;
  } catch {
    return null;
  }
}

// =============================================================================
// FAQs — Вопросы-ответы
// =============================================================================

export type { Faq };

export async function getFaqs(): Promise<Faq[]> {
  try {
    return await fetchApi<Faq>('/faqs');
  } catch {
    console.warn('[CMS] Failed to fetch FAQs, using fallback');
    return [];
  }
}

export async function getFaqsByCategory(category: string): Promise<Faq[]> {
  try {
    return await fetchApi<Faq>(`/faqs?category=${encodeURIComponent(category)}`);
  } catch {
    return [];
  }
}

// =============================================================================
// Team Members — Команда
// =============================================================================

export type { TeamMember };

export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    return await fetchApi<TeamMember>('/team-members');
  } catch {
    console.warn('[CMS] Failed to fetch team members, using fallback');
    return [];
  }
}

export async function getFounders(): Promise<TeamMember[]> {
  try {
    return await fetchApi<TeamMember>('/team-members?isFounder=true');
  } catch {
    return [];
  }
}

// =============================================================================
// Case Studies — Кейсы
// =============================================================================

export type { CaseStudy };

export async function getCaseStudies(): Promise<CaseStudy[]> {
  try {
    return await fetchApi<CaseStudy>('/case-studies');
  } catch {
    console.warn('[CMS] Failed to fetch case studies, using fallback');
    return [];
  }
}

export async function getCaseStudyBySlug(slug: string): Promise<CaseStudy | null> {
  try {
    const cases = await fetchApi<CaseStudy>(`/case-studies?slug=${encodeURIComponent(slug)}`);
    return cases[0] ?? null;
  } catch {
    return null;
  }
}

// =============================================================================
// Reviews — Отзывы
// =============================================================================

export type { Review };

export async function getReviews(limit?: number): Promise<Review[]> {
  try {
    const endpoint = limit ? `/reviews?limit=${limit}` : '/reviews';
    return await fetchApi<Review>(endpoint);
  } catch {
    console.warn('[CMS] Failed to fetch reviews, using fallback');
    return [];
  }
}

// =============================================================================
// Articles — Статьи
// =============================================================================

export type { Article };

export async function getArticles(): Promise<Article[]> {
  try {
    return await fetchApi<Article>('/articles');
  } catch {
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const articles = await fetchApi<Article>(`/articles?slug=${encodeURIComponent(slug)}`);
    return articles[0] ?? null;
  } catch {
    return null;
  }
}

export async function getArticlesByCategory(category: string): Promise<Article[]> {
  try {
    return await fetchApi<Article>(`/articles?category=${encodeURIComponent(category)}`);
  } catch {
    return [];
  }
}

// =============================================================================
// Videos — Видео
// =============================================================================

export type { Video };

export async function getVideos(): Promise<Video[]> {
  try {
    return await fetchApi<Video>('/videos');
  } catch {
    return [];
  }
}

// =============================================================================
// Site Statistics — Статистика сайта
// =============================================================================

export type { SiteStatistic };

export async function getSiteStatistics(): Promise<SiteStatistic[]> {
  try {
    return await fetchApi<SiteStatistic>('/site-statistics');
  } catch {
    return [];
  }
}

// =============================================================================
// District Stats — Статистика по округам
// =============================================================================

export type { DistrictStat };

export async function getDistrictStats(): Promise<DistrictStat[]> {
  try {
    return await fetchApi<DistrictStat>('/district-stats');
  } catch {
    return [];
  }
}

// =============================================================================
// Navigation Items — Пункты меню
// =============================================================================

export type { NavigationItem };

export async function getNavigationItems(): Promise<NavigationItem[]> {
  try {
    return await fetchApi<NavigationItem>('/navigation-items');
  } catch {
    return [];
  }
}

export async function getNavigationItemsByType(type: 'nav' | 'footer' | 'social'): Promise<NavigationItem[]> {
  try {
    return await fetchApi<NavigationItem>(`/navigation-items?type=${type}`);
  } catch {
    return [];
  }
}

// =============================================================================
// Social Links — Социальные сети
// =============================================================================

export type { SocialLink };

export async function getSocialLinks(): Promise<SocialLink[]> {
  try {
    return await fetchApi<SocialLink>('/social-links');
  } catch {
    return [];
  }
}

// =============================================================================
// Trust Pillars — Столпы доверия
// =============================================================================

export type { TrustPillar };

export async function getTrustPillars(): Promise<TrustPillar[]> {
  try {
    return await fetchApi<TrustPillar>('/trust-pillars');
  } catch {
    return [];
  }
}

// =============================================================================
// FSI Deadlines — Дедлайны грантов ФСИ
// =============================================================================

export type { FsiDeadline };

export async function getFsiDeadlines(): Promise<FsiDeadline[]> {
  try {
    return await fetchApi<FsiDeadline>('/fsi-deadlines');
  } catch {
    return [];
  }
}

export async function getUpcomingFsiDeadlines(limit = 5): Promise<FsiDeadline[]> {
  try {
    return await fetchApi<FsiDeadline>(`/fsi-deadlines?upcoming=true&limit=${limit}`);
  } catch {
    return [];
  }
}

// =============================================================================
// Glossary Terms — Термины глоссария
// =============================================================================

export type { GlossaryTerm };

export async function getGlossaryTerms(): Promise<GlossaryTerm[]> {
  try {
    return await fetchApi<GlossaryTerm>('/glossary-terms');
  } catch {
    return [];
  }
}

// =============================================================================
// Partners — Партнёры и команды
// =============================================================================

export type { Partner };

export async function getPartners(): Promise<Partner[]> {
  try {
    return await fetchApi<Partner>('/partners');
  } catch {
    console.warn('[CMS] Failed to fetch partners, using fallback');
    return [];
  }
}

export async function getFeaturedPartner(): Promise<Partner | null> {
  try {
    const partners = await fetchApi<Partner>('/partners?featured=true');
    return partners[0] || null;
  } catch {
    return null;
  }
}

export async function getPartnersByCategory(category: string): Promise<Partner[]> {
  try {
    return await fetchApi<Partner>(`/partners?category=${encodeURIComponent(category)}`);
  } catch {
    return [];
  }
}

// =============================================================================
// Announcements — Объявления
// =============================================================================

export type { Announcement };

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    return await fetchApi<Announcement>('/announcements');
  } catch {
    console.warn('[CMS] Failed to fetch announcements, using fallback');
    return [];
  }
}

export async function getFeaturedAnnouncements(): Promise<Announcement[]> {
  try {
    return await fetchApi<Announcement>('/announcements?featured=true');
  } catch {
    return [];
  }
}

export async function getAvailableAnnouncements(): Promise<Announcement[]> {
  try {
    return await fetchApi<Announcement>('/announcements?available=true');
  } catch {
    return [];
  }
}

// =============================================================================
// Управление фронтендом — Hero / Footer / Announcement bar
// =============================================================================

export type { HeroConfig, FooterConfig, AnnouncementMessage };

export async function getHeroConfig(): Promise<HeroConfig | null> {
  try {
    const rows = await fetchApi<HeroConfig>('/hero-configs');
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getFooterConfig(): Promise<FooterConfig | null> {
  try {
    const rows = await fetchApi<FooterConfig>('/footer-configs');
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getAnnouncementMessages(): Promise<AnnouncementMessage[]> {
  try {
    return await fetchApi<AnnouncementMessage>('/announcement-messages');
  } catch {
    return [];
  }
}

// =============================================================================
// Медиа URL helper
// =============================================================================

export function getMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  // Если уже полный URL — возвращаем как есть
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Локальный путь возвращаем относительным (начинается с /). Не клеим
  // API_BASE (= NEXT_PUBLIC_SITE_URL): иначе next/image получает абсолютный
  // URL, требует host в images.remotePatterns и возвращает 400
  // ("url" parameter is not allowed) для собственного домена.
  // См. DEPLOY-BLOCKERS (4).md, замечание 4.
  return path.startsWith('/') ? path : `/${path}`;
}

// =============================================================================
// Утилиты для конвертации данных
// =============================================================================

/**
 * Конвертирует Service из БД в формат для ServicesSection
 */
export function serviceToLocalService(service: Service): {
  title: string;
  price: string;
  perUnit: string;
  icon: 'Lightning' | 'Rocket' | 'Buildings' | 'Trophy';
  items: string[];
  isFsi: boolean;
} {
  const isFsi = service.taxSystem === 'ФСИ';

  return {
    title: service.title,
    price: service.basePrice?.toLocaleString('ru-RU') || '0',
    perUnit: isFsi ? '₽ / грант' : '₽ / мес',
    icon: getIconForTaxSystem(service.taxSystem),
    items: service.includes || [],
    isFsi,
  };
}

const ICON_BY_TAX_SYSTEM: Record<string, 'Lightning' | 'Rocket' | 'Buildings' | 'Trophy'> = {
  'ФСИ': 'Trophy',
  'УСН-Д': 'Rocket',
  'УСН-ДР': 'Rocket',
  'ОСН': 'Buildings',
  'АУСН': 'Lightning',
};

function getIconForTaxSystem(taxSystem: string): 'Lightning' | 'Rocket' | 'Buildings' | 'Trophy' {
  return ICON_BY_TAX_SYSTEM[taxSystem] ?? 'Lightning';
}
