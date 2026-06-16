import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { pgTable, uuid, text, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { z } from 'zod'

const leads = pgTable('leads', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  contact: text('contact').notNull(),
  source: text('source'),
  page: text('page'),
  utm: jsonb('utm').$type<Record<string, string> | null>(),
  status: text('status').notNull().default('new'),
  interactionAt: timestamp('interaction_at', { withTimezone: true }),
  notified: boolean('notified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

const leadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  contact: z.string().trim().min(3).max(120),
  source: z.string().trim().max(80).optional(),
  page: z.string().trim().max(240).optional(),
  utm: z.record(z.string().max(64), z.string().max(240)).optional(),
})

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 8
const rateLimit = new Map<string, { count: number; resetAt: number }>()

let db: ReturnType<typeof drizzle<{ leads: typeof leads }>> | null = null

function getDb() {
  if (db) return db
  if (!process.env.DATABASE_URL) return null
  const client = postgres(process.env.DATABASE_URL, { max: 2 })
  db = drizzle(client, { schema: { leads } })
  return db
}

function getClientKey(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwardedFor || req.headers.get('x-real-ip') || 'local'
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(key)
  if (!entry || entry.resetAt <= now) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > RATE_LIMIT_MAX
}

function pickUtm(bodyUtm: Record<string, string> | undefined, req: NextRequest): Record<string, string> | null {
  const utm: Record<string, string> = {}
  for (const [key, value] of Object.entries(bodyUtm ?? {})) {
    if (value) utm[key] = value
  }

  const url = new URL(req.url)
  for (const key of UTM_KEYS) {
    const value = url.searchParams.get(key)
    if (value) utm[key] = value.slice(0, 240)
  }

  return Object.keys(utm).length > 0 ? utm : null
}

export async function POST(req: NextRequest) {
  if (isRateLimited(getClientKey(req))) {
    return NextResponse.json({ error: 'too many requests' }, { status: 429 })
  }

  const json = await req.json().catch(() => null)
  const parsed = leadSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid lead payload' }, { status: 400 })
  }

  const database = getDb()
  if (!database) {
    console.error('[leads] DATABASE_URL is not configured')
    return NextResponse.json({ error: 'lead service unavailable' }, { status: 503 })
  }

  try {
    const [lead] = await database.insert(leads).values({
      name: parsed.data.name,
      contact: parsed.data.contact,
      source: parsed.data.source ?? 'site',
      page: parsed.data.page ?? '/',
      utm: pickUtm(parsed.data.utm, req),
      notified: false,
    }).returning()

    const botUrl = process.env.BOT_NOTIFY_URL
    if (botUrl) {
      await fetch(botUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      }).catch((error) => console.error('[leads] bot notify failed', error))
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[leads] insert failed', error)
    return NextResponse.json({ error: 'lead submit failed' }, { status: 500 })
  }
}
