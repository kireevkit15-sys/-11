/**
 * Diva Admin — Session Management
 */

import { db } from '@/lib/db';
import { adminUsers } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUser(sessionId: string | undefined) {
  if (!sessionId) return null;

  try {
    const user = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, sessionId),
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch (error) {
    console.error('[Auth] getCurrentUser error:', error);
    return null;
  }
}
