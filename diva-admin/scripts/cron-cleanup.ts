/**
 * Diva Admin — фоновый housekeeping.
 *
 * Запускается через cron/CI раз в 15 минут:
 *   - чистит устаревшие login_attempts (если pg_cron не задействован);
 *   - помечает истёкшие сессии (для будущего SRP-сессионного стора).
 *
 * Использование: `tsx scripts/cron-cleanup.ts` (можно через systemd timer,
 * k8s CronJob или внешний scheduler).
 */

import { cleanupLoginAttempts } from '../src/lib/rate-limit';

async function main(): Promise<void> {
  const deleted = await cleanupLoginAttempts();
  console.log(`[cron-cleanup] login_attempts: cleared ${deleted} stale rows`);
}

main().catch((err) => {
  console.error('[cron-cleanup] fatal:', err);
  process.exit(1);
});