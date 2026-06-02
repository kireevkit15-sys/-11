/**
 * ДИВА — Drizzle ORM-схема общей БД.
 *
 * Зеркалит init.sql и является единым источником правды на уровне TypeScript
 * для приложений web/ (Next.js API routes) и bot/ (Telegram-бот).
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
  unique,
  index,
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
    utm: jsonb('utm').notNull().default(sql`'{}'::jsonb`),
    status: text('status').notNull().default('new'),
    notes: text('notes'),
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
// Inferred row types — удобны для consumer-приложений.
// =====================================================================
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;

export type CalculatorLog = typeof calculatorLogs.$inferSelect;
export type NewCalculatorLog = typeof calculatorLogs.$inferInsert;

export type FsiDeadlineSubscription =
  typeof fsiDeadlineSubscriptions.$inferSelect;
export type NewFsiDeadlineSubscription =
  typeof fsiDeadlineSubscriptions.$inferInsert;
