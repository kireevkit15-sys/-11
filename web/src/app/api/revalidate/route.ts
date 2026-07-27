/**
 * DIVA Web — On-Demand Revalidation Endpoint.
 *
 * Принимает POST от diva-admin: после успешной мутации в админке,
 * admin шлёт сюда запрос с list of paths и tags, чтобы сбросить
 * ISR-кеш немедленно (а не ждать 60 сек).
 *
 * Безопасность:
 *   - Требует общий REVALIDATE_SECRET в заголовке x-revalidate-secret.
 *   - Constant-time compare через crypto.timingSafeEqual — защита от timing-attack.
 *   - 401 если секрет отсутствует или неверный.
 *
 * Поведение:
 *   - Сбой revalidate логируется, но не валит весь запрос — мы возвращаем
 *     200 если аутентификация прошла, даже если часть путей не сбросилась.
 *   - Невалидный payload — 400.
 */

import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import crypto from 'node:crypto';

const payloadSchema = z.object({
  paths: z.array(z.string().min(1).max(200)).max(50).optional(),
  tags: z.array(z.string().min(1).max(200)).max(50).optional(),
});

function authorized(request: Request): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  // Fail-CLOSED: требуем секрет минимум 32 символа (как SESSION_SECRET).
  if (!secret || secret.length < 32) return false;

  const provided = request.headers.get('x-revalidate-secret');
  if (!provided) return false;

  const a = Buffer.from(secret, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  // Constant-time compare. lengths проверяются отдельно — это часть контракта,
  // а не секрет (злоумышленник и так знает длину секрета из исходников).
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid payload', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const invalidations = { paths: [] as string[], tags: [] as string[] };

  for (const path of parsed.data.paths ?? []) {
    try {
      revalidatePath(path);
      invalidations.paths.push(path);
    } catch (err) {
      console.error('[revalidate] path failed', path, err);
    }
  }

  for (const tag of parsed.data.tags ?? []) {
    try {
      revalidateTag(tag);
      invalidations.tags.push(tag);
    } catch (err) {
      console.error('[revalidate] tag failed', tag, err);
    }
  }

  return NextResponse.json({ ok: true, invalidated: invalidations });
}

export async function GET(): Promise<NextResponse> {
  // Не отдаём секрет через GET, но сообщаем что endpoint существует.
  return NextResponse.json({ error: 'method not allowed' }, { status: 405 });
}
