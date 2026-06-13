/**
 * Diva Admin — Database Schema
 */

import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';

// admin_users
export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('editor'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// services
export const services = pgTable('services', {
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
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// faqs
export const faqs = pgTable('faqs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  category: text('category').notNull().default('Бухгалтерия'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// team_members
export const teamMembers = pgTable('team_members', {
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
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// reviews
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  authorName: text('author_name').notNull(),
  authorProject: text('author_project'),
  text: text('text').notNull(),
  source: text('source').notNull().default('Email'),
  sourceUrl: text('source_url'),
  rating: integer('rating').notNull().default(5),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// articles
export const articles = pgTable('articles', {
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
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// videos
export const videos = pgTable('videos', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  videoId: text('video_id').notNull(),
  platform: text('platform').notNull().default('youtube'),
  description: text('description'),
  views: integer('views').notNull().default(0),
  duration: text('duration'),
  thumbnailUrl: text('thumbnail_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// site_statistics
export const siteStatistics = pgTable('site_statistics', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  key: text('key').notNull().unique(),
  value: integer('value').notNull(),
  suffix: text('suffix'),
  label: text('label').notNull(),
  caption: text('caption'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// announcements
export const announcements = pgTable('announcements', {
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
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// case_studies
export const caseStudies = pgTable('case_studies', {
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
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// district_stats
export const districtStats = pgTable('district_stats', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  code: text('code').notNull().unique(),
  shortName: text('short_name').notNull(),
  name: text('name').notNull(),
  capital: text('capital'),
  clients: integer('clients').notNull().default(0),
  color: text('color'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// navigation_items
export const navigationItems = pgTable('navigation_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  label: text('label').notNull(),
  href: text('href').notNull(),
  type: text('type').notNull().default('nav'),
  icon: text('icon'),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// social_links
export const socialLinks = pgTable('social_links', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  platform: text('platform').notNull(),
  label: text('label').notNull(),
  href: text('href').notNull(),
  actionText: text('action_text'),
  iconColor: text('icon_color'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// trust_pillars
export const trustPillars = pgTable('trust_pillars', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  number: text('number').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  quote: text('quote'),
  hue: integer('hue').notNull().default(270),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// fsi_deadlines
export const fsiDeadlines = pgTable('fsi_deadlines', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  description: text('description'),
  deadlineDate: timestamp('deadline_date', { withTimezone: true }).notNull(),
  grantType: text('grant_type').notNull().default('Старт'),
  stage: text('stage'),
  url: text('url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// glossary_terms
export const glossaryTerms = pgTable('glossary_terms', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  term: text('term').notNull(),
  definition: text('definition').notNull(),
  category: text('category'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// partners — команды и партнёры
export const partners = pgTable('partners', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  role: text('role').notNull(),
  company: text('company'),
  bio: text('bio'),
  photoUrl: text('photo_url'),
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
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
