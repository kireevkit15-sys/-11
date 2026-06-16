/**
 * Diva Admin — Audit log helper.
 */

import { db } from '@/lib/db';
import { auditLogs, NewAuditLog } from '@db/schema';

export type AuditAction =
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'password_change'
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'reorder'
  | 'toggle';

export interface AuditEvent {
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  payload?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
}

export async function logAudit(event: AuditEvent): Promise<void> {
  try {
    const data: NewAuditLog = {
      userId: event.userId ?? null,
      action: event.action,
      entity: event.entity,
      entityId: event.entityId ?? null,
      payload: event.payload ?? null,
      ip: event.ip ?? null,
      userAgent: event.userAgent ?? null,
    };
    await db.insert(auditLogs).values(data);
  } catch (err) {
    console.error('[Audit] failed to log:', err);
  }
}
