/**
 * ДИВА — Drizzle ORM-схема общей БД.
 *
 * Зеркалит init.sql и является единым источником правды на уровне TypeScript
 * для приложений web/ (Next.js API routes), bot/ (Telegram-бот) и diva-admin/.
 * Импортируется относительными путями (например, `../db/schema`).
 */

import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  bigint,
  boolean,
  unique,
  index,
  serial,
  varchar,
} from 'drizzle-orm/pg-core';

// =====================================================================
// leads — заявки с форм сайта
// =====================================================================
export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: text('name').notNull(),
    contact: text('contact').notNull(),
    source: text('source'),
    page: text('page'),
    utm: jsonb('utm').$type<Record<string, string> | null>(),
    status: text('status').notNull().default('new'),
    notes: text('notes'),
    interactionAt: timestamp('interaction_at', { withTimezone: true }),
    notified: boolean('notified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    createdAtIdx: index('idx_leads_created_at').on(t.createdAt),
    statusIdx: index('idx_leads_status').on(t.status),
    notifiedIdx: index('idx_leads_notified').on(t.notified),
  }),
);

// =====================================================================
// lead_notes — заметки по заявкам
// =====================================================================
export const leadNotes = pgTable(
  'lead_notes',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    leadId: uuid('lead_id').notNull().references(() => leads.id, {
      onDelete: 'cascade',
    }),
    text: text('text').notNull(),
    author: text('author').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    leadIdIdx: index('idx_lead_notes_lead_id').on(t.leadId),
  }),
);

// =====================================================================
// reminders — напоминания по заявкам
// =====================================================================
export const reminders = pgTable(
  'reminders',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    leadId: uuid('lead_id').notNull().references(() => leads.id, {
      onDelete: 'cascade',
    }),
    chatId: text('chat_id').notNull(),
    messageId: integer('message_id').notNull(),
    fireAt: timestamp('fire_at', { withTimezone: true }).notNull(),
    sent: boolean('sent').notNull().default(false),
  },
  (t) => ({
    fireAtIdx: index('idx_reminders_fire_at').on(t.fireAt),
  }),
);

// =====================================================================
// clients — клиенты на базе лидов
// =====================================================================
export const clients = pgTable(
  'clients',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    leadId: uuid('lead_id').notNull().references(() => leads.id, {
      onDelete: 'cascade',
    }),
    tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    notes: text('notes').notNull().default(''),
    nextContactAt: timestamp('next_contact_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    leadIdIdx: index('idx_clients_lead_id').on(t.leadId),
  }),
);

// =====================================================================
// subscribers — подписчики рассылки
// =====================================================================
export const subscribers = pgTable(
  'subscribers',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    email: text('email').unique(),
    telegramUsername: text('telegram_username').unique(),
    source: text('source'),
    subscribedAt: timestamp('subscribed_at', { withTimezone: true }).defaultNow(),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  },
  (t) => ({
    emailIdx: index('idx_subscribers_email').on(t.email),
  }),
);

// =====================================================================
// calculator_logs — лог использования калькулятора стоимости
// =====================================================================
export const calculatorLogs = pgTable(
  'calculator_logs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    inputs: jsonb('inputs').notNull(),
    resultPrice: integer('result_price'),
    leadId: uuid('lead_id').references(() => leads.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    createdAtIdx: index('idx_calculator_logs_created_at').on(t.createdAt),
  }),
);

// =====================================================================
// fsi_deadline_subscriptions — подписки на дедлайны грантов ФСИ
// =====================================================================
export const fsiDeadlineSubscriptions = pgTable(
  'fsi_deadline_subscriptions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    telegramChatId: bigint('telegram_chat_id', { mode: 'number' }).notNull(),
    grantType: text('grant_type'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    chatGrantUnique: unique('fsi_deadline_subscriptions_chat_grant_key').on(
      t.telegramChatId,
      t.grantType,
    ),
  }),
);

// =====================================================================
// admin_users — пользователи админ-панели
// =====================================================================
export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    role: text('role').notNull().default('editor'),
    requirePasswordChange: boolean('require_password_change').notNull().default(true),
    sessionEpoch: integer('session_epoch').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailIdx: index('idx_admin_users_email').on(t.email),
  }),
);

// =====================================================================
// login_attempts — счётчик неудачных попыток входа (persistent rate-limit)
// =====================================================================
// Схема совпадает с db/init.sql: одна строка на ключ, UPSERT-инкремент
// failure_count, окно отслеживается через first_failure_at.
export const loginAttempts = pgTable('login_attempts', {
  key: text('key').primaryKey(),
  failureCount: integer('failure_count').notNull().default(0),
  firstFailureAt: timestamp('first_failure_at', { withTimezone: true }).notNull().defaultNow(),
  blockedUntil: timestamp('blocked_until', { withTimezone: true }),
});

// =====================================================================
// audit_logs — журнал изменений в админ-панели
// =====================================================================
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id'),
    payload: jsonb('payload').$type<Record<string, unknown> | null>(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdIdx: index('idx_audit_logs_user_id').on(t.userId),
    actionIdx: index('idx_audit_logs_action').on(t.action),
    entityIdx: index('idx_audit_logs_entity').on(t.entity),
    createdAtIdx: index('idx_audit_logs_created_at').on(t.createdAt),
  }),
);

// =====================================================================
// frontend_sections — управляемые секции фронтенда
// =====================================================================
export const frontendSections = pgTable(
  'frontend_sections',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    key: text('key').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    page: text('page').notNull().default('home'),
    isEnabled: boolean('is_enabled').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    config: jsonb('config').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    keyIdx: index('idx_frontend_sections_key').on(t.key),
    pageIdx: index('idx_frontend_sections_page').on(t.page),
    sortIdx: index('idx_frontend_sections_sort_order').on(t.sortOrder),
  }),
);

// =====================================================================
// site_settings — глобальные настройки сайта
// =====================================================================
export const siteSettings = pgTable(
  'site_settings',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    key: text('key').notNull().unique(),
    value: jsonb('value').notNull().default(sql`'{}'::jsonb`),
    group: text('group').notNull().default('general'),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    keyIdx: index('idx_site_settings_key').on(t.key),
    groupIdx: index('idx_site_settings_group').on(t.group),
  }),
);

// =====================================================================
// page_versions — версии конфигурации страниц
// =====================================================================
export const pageVersions = pgTable(
  'page_versions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    pageKey: text('page_key').notNull(),
    version: integer('version').notNull(),
    config: jsonb('config').notNull().default(sql`'{}'::jsonb`),
    isPublished: boolean('is_published').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pageKeyIdx: index('idx_page_versions_page_key').on(t.pageKey),
    versionIdx: index('idx_page_versions_version').on(t.version),
    publishedIdx: index('idx_page_versions_is_published').on(t.isPublished),
    pageVersionUnique: unique('page_versions_page_version_key').on(t.pageKey, t.version),
  }),
);

// =====================================================================
// services — бухгалтерские услуги
// =====================================================================
export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    taxSystem: text('tax_system').notNull().default('УСН-Д'),
    basePrice: integer('base_price'),
    includes: jsonb('includes').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    targetAudience: text('target_audience'),
    isHighlighted: boolean('is_highlighted').notNull().default(false),
    key: text('key'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    slugIdx: index('idx_services_slug').on(t.slug),
    sortIdx: index('idx_services_sort_order').on(t.sortOrder),
  }),
);

// =====================================================================
// faqs — вопросы-ответы
// =====================================================================
export const faqs = pgTable(
  'faqs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    category: text('category').notNull().default('Бухгалтерия'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    categoryIdx: index('idx_faqs_category').on(t.category),
    sortIdx: index('idx_faqs_sort_order').on(t.sortOrder),
  }),
);

// =====================================================================
// team_members — команда
// =====================================================================
export const teamMembers = pgTable(
  'team_members',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    fullName: text('full_name').notNull(),
    position: text('position').notNull(),
    photoUrl: text('photo_url'),
    bio: text('bio'),
    education: text('education'),
    yearsExperience: integer('years_experience'),
    specialization: text('specialization'),
    quote: text('quote'),
    sortOrder: integer('sort_order').notNull().default(0),
    isFounder: boolean('is_founder').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    sortIdx: index('idx_team_members_sort_order').on(t.sortOrder),
  }),
);

// =====================================================================
// case_studies — кейсы клиентов
// =====================================================================
export const caseStudies = pgTable(
  'case_studies',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    clientName: text('client_name'),
    clientLogoUrl: text('client_logo_url'),
    tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    task: text('task'),
    solution: text('solution'),
    result: text('result'),
    quote: text('quote'),
    quoteAuthor: text('quote_author'),
    period: text('period'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    slugIdx: index('idx_case_studies_slug').on(t.slug),
    sortIdx: index('idx_case_studies_sort_order').on(t.sortOrder),
  }),
);

// =====================================================================
// reviews — отзывы
// =====================================================================
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    authorName: text('author_name').notNull(),
    authorProject: text('author_project'),
    text: text('text').notNull(),
    source: text('source').notNull().default('Email'),
    sourceUrl: text('source_url'),
    rating: integer('rating').notNull().default(5),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    sortIdx: index('idx_reviews_sort_order').on(t.sortOrder),
  }),
);

// =====================================================================
// articles — статьи блога
// =====================================================================
export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    excerpt: text('excerpt'),
    body: text('body'),
    coverUrl: text('cover_url'),
    category: text('category').notNull().default('Прочее'),
    readingMinutes: integer('reading_minutes').notNull().default(5),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    slugIdx: index('idx_articles_slug').on(t.slug),
    categoryIdx: index('idx_articles_category').on(t.category),
    sortIdx: index('idx_articles_sort_order').on(t.sortOrder),
  }),
);

// =====================================================================
// videos — видео
// =====================================================================
export const videos = pgTable(
  'videos',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    title: text('title').notNull(),
    videoId: text('video_id').notNull(),
    platform: text('platform').notNull().default('youtube'),
    description: text('description'),
    views: integer('views').notNull().default(0),
    duration: text('duration'),
    thumbnailUrl: text('thumbnail_url'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    sortIdx: index('idx_videos_sort_order').on(t.sortOrder),
  }),
);

// =====================================================================
// site_statistics — статистика сайта
// =====================================================================
export const siteStatistics = pgTable(
  'site_statistics',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    key: text('key').notNull().unique(),
    value: integer('value').notNull(),
    suffix: text('suffix'),
    label: text('label').notNull(),
    caption: text('caption'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    keyIdx: index('idx_site_statistics_key').on(t.key),
    sortIdx: index('idx_site_statistics_sort_order').on(t.sortOrder),
  }),
);

// =====================================================================
// district_stats — статистика по округам
// =====================================================================
export const districtStats = pgTable(
  'district_stats',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    code: text('code').notNull().unique(),
    shortName: text('short_name').notNull(),
    name: text('name').notNull(),
    capital: text('capital'),
    clients: integer('clients').notNull().default(0),
    color: text('color'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    codeIdx: index('idx_district_stats_code').on(t.code),
    sortIdx: index('idx_district_stats_sort_order').on(t.sortOrder),
  }),
);

// =====================================================================
// navigation_items — пункты меню
// =====================================================================
export const navigationItems = pgTable(
  'navigation_items',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    label: text('label').notNull(),
    href: text('href').notNull(),
    type: text('type').notNull().default('nav'),
    icon: text('icon'),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    typeIdx: index('idx_navigation_items_type').on(t.type),
    sortIdx: index('idx_navigation_items_sort_order').on(t.sortOrder),
  }),
);

// =====================================================================
// social_links — социальные сети
// =====================================================================
export const socialLinks = pgTable(
  'social_links',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    platform: text('platform').notNull(),
    label: text('label').notNull(),
    href: text('href').notNull(),
    actionText: text('action_text'),
    iconColor: text('icon_color'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    sortIdx: index('idx_social_links_sort_order').on(t.sortOrder),
  }),
);

// =====================================================================
// trust_pillars — столпы доверия
// =====================================================================
export const trustPillars = pgTable(
  'trust_pillars',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    number: text('number').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    quote: text('quote'),
    hue: integer('hue').notNull().default(270),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    sortIdx: index('idx_trust_pillars_sort_order').on(t.sortOrder),
  }),
);

// =====================================================================
// fsi_deadlines — дедлайны грантов ФСИ
// =====================================================================
export const fsiDeadlines = pgTable(
  'fsi_deadlines',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    title: text('title').notNull(),
    description: text('description'),
    deadlineDate: timestamp('deadline_date', { withTimezone: true }).notNull(),
    grantType: text('grant_type').notNull().default('Старт'),
    stage: text('stage'),
    url: text('url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    deadlineIdx: index('idx_fsi_deadlines_deadline_date').on(t.deadlineDate),
    grantTypeIdx: index('idx_fsi_deadlines_grant_type').on(t.grantType),
  }),
);

// =====================================================================
// glossary_terms — термины глоссария
// =====================================================================
export const glossaryTerms = pgTable(
  'glossary_terms',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    term: text('term').notNull(),
    definition: text('definition').notNull(),
    category: text('category'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    termIdx: index('idx_glossary_terms_term').on(t.term),
    sortIdx: index('idx_glossary_terms_sort_order').on(t.sortOrder),
  }),
);

// =====================================================================
// announcements — объявления
// =====================================================================
export const announcements = pgTable(
  'announcements',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    title: text('title').notNull(),
    content: text('content').notNull(),
    key: text('key').notNull().unique(),
    category: text('category').notNull().default('Общее'),
    badge: text('badge').notNull().default('team'),
    hue: integer('hue').notNull().default(200),
    available: boolean('available').notNull().default(true),
    featured: boolean('featured').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    keyIdx: index('idx_announcements_key').on(t.key),
    sortIdx: index('idx_announcements_sort_order').on(t.sortOrder),
  }),
);

// =====================================================================
// partners — команды и партнёры (ранее "announcements" в data/)
// =====================================================================
export const partners = pgTable(
  'partners',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: text('name').notNull(),
    role: text('role').notNull(),
    company: text('company'),
    logoUrl: text('logo_url'),
    bio: text('bio'),
    skills: jsonb('skills').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    githubLink: text('github_link'),
    portfolioLink: text('portfolio_link'),
    vkLink: text('vk_link'),
    telegramLink: text('telegram_link'),
    contact: text('contact'),
    badge: text('badge').notNull().default('team'),
    hue: integer('hue').notNull().default(240),
    available: boolean('available').notNull().default(true),
    featured: boolean('featured').notNull().default(false),
    category: text('category').notNull().default('fullstack'),
    // Множественные категории для фильтрации на сайте (/announcements).
    // Содержит строки из фиксированного списка partnerTags
    // (web/src/data/partners.ts): «Разработка сайтов», «Разработка
    // мобильных приложений» и т.д. Пустой массив = показывается во «все».
    categories: jsonb('categories').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    categoryIdx: index('idx_partners_category').on(t.category),
    sortIdx: index('idx_partners_sort_order').on(t.sortOrder),
  }),
);

// =====================================================================
// Управляемые блоки фронтенда (singleton-конфиги key='main')
// Зеркалят фактические таблицы в БД (serial id, varchar, timestamp без tz).
// =====================================================================

// hero_configs — настройки hero-секции главной
export const heroConfigs = pgTable('hero_configs', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 50 }).default('main'),
  headline: text('headline'),
  subheadline: text('subheadline'),
  ctaText: varchar('cta_text', { length: 100 }),
  badges: jsonb('badges').$type<string[]>().default(sql`'[]'::jsonb`),
  statNumber: varchar('stat_number', { length: 50 }),
  statLabel: varchar('stat_label', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// footer_configs — настройки утилити-футера
export const footerConfigs = pgTable('footer_configs', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 50 }).default('main'),
  email: varchar('email', { length: 255 }),
  phones: jsonb('phones').$type<string[]>().default(sql`'[]'::jsonb`),
  address: text('address'),
  legalInfo: text('legal_info'),
  workHours: varchar('work_hours', { length: 100 }),
  navColumns: jsonb('nav_columns')
    .$type<{ title: string; links: { label: string; href: string }[] }[]>()
    .default(sql`'[]'::jsonb`),
  socialLinks: jsonb('social_links').$type<unknown[]>().default(sql`'[]'::jsonb`),
  copyright: varchar('copyright', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// announcement_messages — сообщения в полоске-объявлении над шапкой
export const announcementMessages = pgTable('announcement_messages', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 50 }),
  message: text('message'),
  ctaText: varchar('cta_text', { length: 100 }),
  href: varchar('href', { length: 255 }),
  badge: varchar('badge', { length: 50 }),
  hue: integer('hue').default(200),
  available: boolean('available').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =====================================================================
// Inferred row types
// =====================================================================
export type HeroConfig = typeof heroConfigs.$inferSelect;
export type NewHeroConfig = typeof heroConfigs.$inferInsert;

export type FooterConfig = typeof footerConfigs.$inferSelect;
export type NewFooterConfig = typeof footerConfigs.$inferInsert;

export type AnnouncementMessage = typeof announcementMessages.$inferSelect;
export type NewAnnouncementMessage = typeof announcementMessages.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type LeadNote = typeof leadNotes.$inferSelect;
export type NewLeadNote = typeof leadNotes.$inferInsert;

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;

export type CalculatorLog = typeof calculatorLogs.$inferSelect;
export type NewCalculatorLog = typeof calculatorLogs.$inferInsert;

export type FsiDeadlineSubscription = typeof fsiDeadlineSubscriptions.$inferSelect;
export type NewFsiDeadlineSubscription = typeof fsiDeadlineSubscriptions.$inferInsert;

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type FrontendSection = typeof frontendSections.$inferSelect;
export type NewFrontendSection = typeof frontendSections.$inferInsert;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type NewSiteSetting = typeof siteSettings.$inferInsert;

export type PageVersion = typeof pageVersions.$inferSelect;
export type NewPageVersion = typeof pageVersions.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type Faq = typeof faqs.$inferSelect;
export type NewFaq = typeof faqs.$inferInsert;

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;

export type CaseStudy = typeof caseStudies.$inferSelect;
export type NewCaseStudy = typeof caseStudies.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;

export type SiteStatistic = typeof siteStatistics.$inferSelect;
export type NewSiteStatistic = typeof siteStatistics.$inferInsert;

export type DistrictStat = typeof districtStats.$inferSelect;
export type NewDistrictStat = typeof districtStats.$inferInsert;

export type NavigationItem = typeof navigationItems.$inferSelect;
export type NewNavigationItem = typeof navigationItems.$inferInsert;

export type SocialLink = typeof socialLinks.$inferSelect;
export type NewSocialLink = typeof socialLinks.$inferInsert;

export type TrustPillar = typeof trustPillars.$inferSelect;
export type NewTrustPillar = typeof trustPillars.$inferInsert;

export type FsiDeadline = typeof fsiDeadlines.$inferSelect;
export type NewFsiDeadline = typeof fsiDeadlines.$inferInsert;

export type GlossaryTerm = typeof glossaryTerms.$inferSelect;
export type NewGlossaryTerm = typeof glossaryTerms.$inferInsert;

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;
