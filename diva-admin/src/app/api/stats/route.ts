/**
 * Diva Admin — статистика по заявкам (CRM) для дашборда.
 * GET /api/stats — агрегаты: воронка статусов, новые заявки за 14 дней, конверсия.
 * Доступ: content:read. Безопасно при пустой/недоступной БД.
 */

import { NextResponse } from 'next/server';
import { authorize, dbErrorResponse } from '@/lib/api-helpers';
import { getLeadStats } from '@/lib/stats';

export async function GET() {
  const auth = await authorize('content:read');
  if ('error' in auth) return auth.error;

  try {
    const stats = await getLeadStats();
    return NextResponse.json(stats);
  } catch (error) {
    return dbErrorResponse(error);
  }
}
