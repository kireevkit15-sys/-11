import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pgTable, uuid, text, jsonb, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { env } from './env.js';
import type { LeadStatus } from './types.js';

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  contact: text('contact').notNull(),
  source: text('source'),
  page: text('page'),
  utm: jsonb('utm').$type<Record<string, string> | null>(),
  status: text('status').$type<LeadStatus>().notNull().default('new'),
  interactionAt: timestamp('interaction_at', { withTimezone: true }),
  notified: boolean('notified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const leadNotes = pgTable('lead_notes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  author: text('author').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  chatId: text('chat_id').notNull(),
  messageId: integer('message_id').notNull(),
  fireAt: timestamp('fire_at', { withTimezone: true }).notNull(),
  sent: boolean('sent').notNull().default(false),
});

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  notes: text('notes').notNull().default(''),
  nextContactAt: timestamp('next_contact_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

const client = postgres(env.DATABASE_URL, { max: 5 });
export const db = drizzle(client, { schema: { leads, leadNotes, reminders, clients } });
