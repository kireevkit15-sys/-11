import { NextRequest, NextResponse } from 'next/server';
import { destroySession, getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const user = session.user;
    await destroySession();

    if (user) {
      await logAudit({
        userId: user.id,
        action: 'logout',
        entity: 'admin_users',
        entityId: user.id,
        ip:
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          request.headers.get('x-real-ip') ||
          null,
        userAgent: request.headers.get('user-agent'),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
