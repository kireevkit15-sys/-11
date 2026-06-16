import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateCredentials, changePassword, validatePasswordStrength } from '@/lib/auth';
import { currentUser } from '@/lib/api-helpers';
import { setSessionUser } from '@/lib/session';
import { logAudit } from '@/lib/audit';

const schema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword: z.string().min(1, 'Введите новый пароль'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { currentPassword, newPassword } = parsed.data;

    // Проверяем текущий пароль
    const ok = await validateCredentials(user.email, currentPassword);
    if (!ok) return NextResponse.json({ error: 'Текущий пароль неверен' }, { status: 400 });

    // Проверяем стойкость нового
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) return NextResponse.json({ error: strength.error }, { status: 400 });

    if (newPassword === currentPassword) {
      return NextResponse.json({ error: 'Новый пароль должен отличаться от текущего' }, { status: 400 });
    }

    await changePassword(user.id, newPassword);
    // Обновляем сессию — снимаем флаг обязательной смены
    await setSessionUser({ ...user, requirePasswordChange: false });

    await logAudit({
      userId: user.id,
      action: 'password_change',
      entity: 'admin_users',
      entityId: user.id,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Auth] change-password error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
