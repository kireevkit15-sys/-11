import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { z } from 'zod'

import { leads } from '@/db/schema'

// Валидация контакта: телефон, Telegram или email. Без этого форма
// принимала мусор вроде "+7777", "+1234" и т.п., что приводило к
// нерабочим лидам в CRM. Email принимается только в footer-форме
// (чеклист), но проверяем единообразно. См. DEPLOY-BLOCKERS (4).md,
// замечание 8.
const contactRefine = (v: string): boolean =>
  /^\+?[0-9][0-9\s()-]{6,}$/.test(v) ||                    // телефон
  /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(v) ||              // @username
  /(?:^|t\.me\/)[a-zA-Z][a-zA-Z0-9_]{4,31}$/i.test(v) ||  // t.me/username
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)                     // email

const leadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  contact: z.string().trim().min(3).max(120).refine(contactRefine, 'Укажите телефон или Telegram'),
  source: z.string().trim().max(80).optional(),
  page: z.string().trim().max(240).optional(),
  utm: z.record(z.string().max(64), z.string().max(240)).optional(),
})

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 8

/**
 * In-memory rate-limit store с защитой от memory leak.
 *
 * Утечка в предыдущей версии: `Map<string, ...>` росла бесконечно — при каждом
 * уникальном IP/UA создавалась новая запись, которая никогда не удалялась.
 * В Edge runtime это приводит к OOM за часы/дни при скан-ботах.
 *
 * Текущее решение:
 *   - TTL через `expiresAt`;
 *   - lazy sweep при превышении порога записей (MAP_SWEEP_THRESHOLD);
 *   - верхний предел на размер Map (MAP_MAX_ENTRIES) — старые записи вытесняются.
 */
const MAP_MAX_ENTRIES = 10_000
const MAP_SWEEP_THRESHOLD = 2_000
const rateLimit = new Map<string, { count: number; expiresAt: number }>()

function sweepRateLimit(now: number) {
  if (rateLimit.size < MAP_SWEEP_THRESHOLD) return
  for (const [key, value] of rateLimit) {
    if (value.expiresAt <= now) rateLimit.delete(key)
  }
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  sweepRateLimit(now)
  const entry = rateLimit.get(key)
  if (!entry || entry.expiresAt <= now) {
    if (rateLimit.size >= MAP_MAX_ENTRIES) {
      const firstKey = rateLimit.keys().next().value
      if (firstKey !== undefined) rateLimit.delete(firstKey)
    }
    rateLimit.set(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > RATE_LIMIT_MAX
}

let db: ReturnType<typeof drizzle<{ leads: typeof leads }>> | null = null

function getDb() {
  if (db) return db
  if (!process.env.DATABASE_URL) return null
  const client = postgres(process.env.DATABASE_URL, { max: 2 })
  db = drizzle(client, { schema: { leads } })
  return db
}

// Отдельный клиент пишет в audit_log; лимит 1 (только INSERT), живёт рядом с db.
let auditSql: ReturnType<typeof postgres> | null = null
function getAuditSql() {
  if (auditSql) return auditSql
  if (!process.env.DATABASE_URL) return null
  auditSql = postgres(process.env.DATABASE_URL, { max: 1 })
  return auditSql
}

/**
 * Фиксирует факт создания публичного лида в общем audit_log.
 * Делается неблокирующе — если INSERT падает, лид всё равно сохранён,
 * а админ просто не увидит эту запись в журнале.
 */
async function logLeadCreated(leadId: string, payload: Record<string, unknown>) {
  const sqlClient = getAuditSql()
  if (!sqlClient) return
  try {
    const ipStr = typeof payload['ip'] === 'string' ? payload['ip'] : null
    const uaStr = typeof payload['userAgent'] === 'string' ? payload['userAgent'] : null
    // Преобразуем payload к JSONValue, который принимает postgres.js.
    const payloadJson = JSON.stringify(payload) as unknown as never
    await sqlClient`
      INSERT INTO audit_logs (user_id, action, entity, entity_id, payload, ip, user_agent, created_at)
      VALUES (NULL, 'create'::text, 'leads'::text, ${leadId}, ${sqlClient.json(payloadJson)},
              ${ipStr}, ${uaStr}, now())
    `
  } catch (err) {
    console.error('[leads] audit_log insert failed:', err)
  }
}

function getClientKey(req: NextRequest): string {
  // Берём ПОСЛЕДНИЙ IP из XFF — самый близкий к серверу, его туда
  // кладёт Caddy. Первый IP — это клиент, и клиент может его подделать.
  // Раньше брался первый IP и доверялся без валидации — простейший
  // bypass: `X-Forwarded-For: 1.1.1.1, 1.1.1.1, 1.1.1.1` создавал
  // бесконечное количество ключей в in-memory Map, и rate-limit
  // обнулялся. Теперь: валидируем формат IP, иначе игнорируем заголовок.
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map((p) => p.trim())
    const last = parts[parts.length - 1] ?? ''
    if (isValidIp(last)) return last
  }
  const xRealIp = req.headers.get('x-real-ip')
  if (xRealIp && isValidIp(xRealIp)) return xRealIp
  return 'local'
}

function isValidIp(s: string): boolean {
  if (!s) return false
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(s)) {
    return s.split('.').every((octet) => {
      const n = Number(octet)
      return n >= 0 && n <= 255
    })
  }
  // IPv6 (упрощённо: hex + двоеточия, минимум 2 группы)
  if (/^[a-f0-9:]+$/i.test(s) && s.includes(':')) return true
  return false
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
  const clientKey = getClientKey(req)
  const userAgent = req.headers.get('user-agent')
  const referer = req.headers.get('referer')

  if (isRateLimited(clientKey)) {
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
    // БД-колонка utm NOT NULL с default '{}'::jsonb. Drizzle не знает про
    // DB-default и при отсутствии ключа в values всё равно подставляет
    // literal NULL в INSERT — БД отвергает (23502). Передаём явный '{}'
    // когда UTM нет, чтобы INSERT прошёл.
    const utm = pickUtm(parsed.data.utm, req)
    const values: typeof leads.$inferInsert = {
      name: parsed.data.name,
      contact: parsed.data.contact,
      source: parsed.data.source ?? 'site',
      page: parsed.data.page ?? '/',
      utm: utm ?? {},
      notified: false,
    }
    const [lead] = await database.insert(leads).values(values).returning()

    if (!lead) {
      console.error('[leads] insert returned no row')
      return NextResponse.json({ error: 'lead submit failed' }, { status: 500 })
    }
    // Fire-and-forget audit log
    void logLeadCreated(lead.id, {
      source: 'site_form',
      utm: lead.utm,
      page: lead.page,
      ip: clientKey,
      userAgent: userAgent?.slice(0, 240) ?? null,
      referer: referer?.slice(0, 240) ?? null,
    })

    // Уведомление бота — через polling: diva-bot SELECT-ит
    // `leads WHERE notified=false` каждые ~3с и шлёт карточки в Telegram.
    // Раньше здесь был fetch в BOT_NOTIFY_URL, но бот этот URL не
    // слушает — код был мёртвым и только добавлял round-trip в hot-path
    // формы (мог зависнуть на 5+с если endpoint недоступен).
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[leads] insert failed', error)
    return NextResponse.json({ error: 'lead submit failed' }, { status: 500 })
  }
}