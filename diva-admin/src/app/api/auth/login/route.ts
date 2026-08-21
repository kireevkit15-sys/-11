import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateCredentials } from '@/lib/auth';
import { setSessionUser } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import { loginRateStatus, recordLoginFailure, clearLoginRate } from '@/lib/rate-limit';
import { readJsonBody } from '@/lib/cp1251';

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

function clientIp(request: NextRequest): string | null {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Некорректные данные';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const ip = clientIp(request);
    const userAgent = request.headers.get('user-agent');
    const rateKey = `${ip ?? 'noip'}:${email.toLowerCase()}`;

    const rate = await loginRateStatus(rateKey);
    if (rate.blocked) {
      const mins = Math.ceil(rate.retryAfterSec / 60);
      return NextResponse.json(
        { error: `Слишком много попыток. Попробуйте через ${mins} мин.` },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } },
      );
    }

    const user = await validateCredentials(email, password);

    if (!user) {
      const status = await recordLoginFailure(rateKey);
      await logAudit({ action: 'login_failed', entity: 'admin_users', ip, userAgent });
      if (status.blocked) {
        const mins = Math.ceil(status.retryAfterSec / 60);
        return NextResponse.json(
          { error: `Слишком много попыток. Попробуйте через ${mins} мин.` },
          { status: 429, headers: { 'Retry-After': String(status.retryAfterSec) } },
        );
      }
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    await clearLoginRate(rateKey);
    await setSessionUser(user);
    await logAudit({
      userId: user.id,
      action: 'login',
      entity: 'admin_users',
      entityId: user.id,
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        requirePasswordChange: user.requirePasswordChange,
      },
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
