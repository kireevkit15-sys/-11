import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

const leads = pgTable('leads', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  contact: text('contact').notNull(),
  source: text('source'),
  page: text('page'),
  utm: jsonb('utm').$type<Record<string, string> | null>(),
  status: text('status').notNull().default('new'),
  interactionAt: timestamp('interaction_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

const client = postgres(process.env.DATABASE_URL!, { max: 2 })
const db = drizzle(client, { schema: { leads } })

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.name || !body?.contact) {
    return NextResponse.json({ error: 'name and contact required' }, { status: 400 })
  }

  const utm: Record<string, string> = { ...(body.utm ?? {}) }
  const url = new URL(req.url)
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const val = url.searchParams.get(key)
    if (val) utm[key] = val
  }

  const [lead] = await db.insert(leads).values({
    name: body.name,
    contact: body.contact,
    source: body.source ?? 'site',
    page: body.page ?? '/',
    utm: Object.keys(utm).length > 0 ? utm : null,
  }).returning()

  // Notify bot
  const botUrl = process.env.BOT_NOTIFY_URL
  if (botUrl) {
    await fetch(botUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    }).catch(() => null)
  }

  return NextResponse.json({ ok: true })
}
