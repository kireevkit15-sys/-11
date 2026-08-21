import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import {
  validateCredentials,
  changePassword,
  validatePasswordStrength,
} from '@/lib/auth';
import { adminUsers } from '@db/schema';
import { currentUser } from '@/lib/api-helpers';
import { setSessionUser } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import { db } from '@/lib/db';
import { readJsonBody } from '@/lib/cp1251';

const schema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword: z.string().min(1, 'Введите новый пароль'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const parsed = schema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Некорректные данные';
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const { currentPassword, newPassword } = parsed.data;

    // Проверяем текущий пароль
    const ok = await validateCredentials(user.email, currentPassword);
    if (!ok) return NextResponse.json({ error: 'Текущий пароль неверен' }, { status: 400 });

    // Проверяем стойкость нового
    const strength = validatePasswordStrength(newPassword, user.email);
    if (!strength.valid) return NextResponse.json({ error: strength.error }, { status: 400 });

    if (newPassword === currentPassword) {
      return NextResponse.json({ error: 'Новый пароль должен отличаться от текущего' }, { status: 400 });
    }

    await changePassword(user.id, newPassword);

    // Перечитываем пользователя из БД — там уже новый sessionEpoch (инвалидирует
    // старые сессии) и снят флаг обязательной смены пароля. Без этого middleware
    // выкинет пользователя, потому что cookie содержит старый epoch.
    const [fresh] = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        requirePasswordChange: adminUsers.requirePasswordChange,
        sessionEpoch: adminUsers.sessionEpoch,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, user.id))
      .limit(1);
    if (!fresh) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });

    await setSessionUser({
      id: fresh.id,
      email: fresh.email,
      name: fresh.name,
      role: fresh.role as 'admin' | 'editor' | 'viewer',
      requirePasswordChange: fresh.requirePasswordChange,
      sessionEpoch: fresh.sessionEpoch,
    });

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
