/**
 * Diva Admin — Health-check endpoint.
 *
 * GET /api/health        — liveness: всегда 200 если процесс жив.
 * GET /api/health/deep   — readiness: проверяет доступность БД (SELECT 1).
 *
 * /api/health не должен открывать БД — иначе рестарт контейнера на
 * недоступной БД станет бесконечным циклом (Compose restart_policy).
 * Deep-проверка — отдельный endpoint, его дёргает внешний мониторинг.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

export async function POST(request: NextRequest) {
  // Deep-check: SELECT 1 через БД, с таймаутом.
  const url = new URL(request.url);
  if (url.searchParams.get('deep') !== '1') {
    return NextResponse.json({ error: 'Use ?deep=1' }, { status: 400 });
  }
  try {
    const start = Date.now();
    await Promise.race([
      db.execute(sql`SELECT 1 as ok`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
    ]);
    return NextResponse.json({
      status: 'ok',
      db: 'up',
      latencyMs: Date.now() - start,
    });
  } catch (err) {
    return NextResponse.json(
      { status: 'degraded', db: 'down', error: 'DB unreachable' },
      { status: 503 },
    );
  }
}