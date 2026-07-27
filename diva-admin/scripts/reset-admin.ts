/**
 * Diva Admin — сброс/создание пароля администратора.
 * Запуск: npx tsx scripts/reset-admin.ts <email> <password>
 * По умолчанию email=admin@diva.ru. Если пароль не указан — генерируется.
 *
 * Безопасность: сгенерированный пароль НИКОГДА не пишется в stdout/logs.
 * Пароль сохраняется в файл с правами 0600 (по умолчанию
 * /run/secrets/diva-admin-reset-password, fallback ./.diva-admin-reset-password).
 *
 * Требует явное подтверждение через --yes или RESET_CONFIRM=1, чтобы избежать
 * случайного запуска против production-БД.
 */

import { db } from '../src/lib/db';
import { adminUsers } from '@db/schema';
import { eq, sql } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { writeFileSync, chmodSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function generatePassword(length = 16) {
  // Rejection sampling: исключаем modulo bias.
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const maxValid = Math.floor(0xffffffff / chars.length) * chars.length;
  const buf = new Uint32Array(length * 2);
  let result = '';
  while (result.length < length) {
    crypto.getRandomValues(buf);
    for (let i = 0; i < buf.length && result.length < length; i++) {
      const v = buf[i];
      if (v !== undefined && v < maxValid) {
        const c = chars[v % chars.length];
        if (c !== undefined) result += c;
      }
    }
  }
  return result;
}

function writeSecretToFile(content: string): string {
  const filePath =
    process.env.ADMIN_RESET_PASSWORD_FILE ||
    (process.platform === 'linux' && existsSync('/run/secrets')
      ? '/run/secrets/diva-admin-reset-password'
      : join(process.cwd(), '.diva-admin-reset-password'));

  try {
    writeFileSync(filePath, content + '\n', { mode: 0o600 });
    chmodSync(filePath, 0o600);
  } catch (err) {
    throw new Error(
      `Не удалось записать пароль в ${filePath}: ${(err as Error).message}. ` +
        `Передайте пароль явно вторым аргументом.`,
    );
  }
  return filePath;
}

async function main() {
  const email = (process.argv[2] || 'admin@diva.ru').toLowerCase();

  // Safety: требуем явного подтверждения, чтобы случайно не сбросить прод-пароль.
  const hasConfirmFlag =
    process.argv.includes('--yes') || process.env.RESET_CONFIRM === '1';
  if (!hasConfirmFlag) {
    console.error(
      'ВНИМАНИЕ: сброс пароля администратора — деструктивная операция.\n' +
        'Запустите с флагом --yes или переменной RESET_CONFIRM=1 для подтверждения.',
    );
    process.exit(2);
  }

  // Refuse если DATABASE_URL указывает на production-хост (heuristic).
  const dbUrl = process.env.DATABASE_URL || '';
  if (/prod|production/i.test(dbUrl) && process.env.ALLOW_PROD_RESET !== '1') {
    console.error(
      'Отказано: DATABASE_URL похож на production.\n' +
        'Если это намеренно — задайте ALLOW_PROD_RESET=1.',
    );
    process.exit(3);
  }

  const explicitPassword = process.argv[3];
  let generatedPassword: string | null = null;
  const rawPassword = explicitPassword ?? (generatedPassword = generatePassword(16));

  const passwordHash = await hash(rawPassword, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const existing = await db.query.adminUsers.findFirst({ where: eq(adminUsers.email, email) });

  if (existing) {
    await db
      .update(adminUsers)
      .set({
        passwordHash,
        // Требуем смену пароля после сброса — безопаснее,
        // чем оставлять сброшенный пароль «навсегда».
        requirePasswordChange: true,
        updatedAt: new Date(),
        // Инкрементируем session_epoch — все активные сессии становятся невалидны.
        sessionEpoch: sql`${adminUsers.sessionEpoch} + 1`,
      })
      .where(eq(adminUsers.id, existing.id));
    console.log(`Пароль администратора ${email} сброшен. Все активные сессии инвалидированы.`);
  } else {
    const [user] = await db
      .insert(adminUsers)
      .values({
        email,
        passwordHash,
        name: 'Администратор',
        role: 'admin',
        requirePasswordChange: true,
        sessionEpoch: 1,
      })
      .returning();
    if (!user) {
      console.error('Не удалось создать администратора (пустой результат)');
      process.exit(1);
    }
    console.log(`Создан администратор ${user.email}.`);
  }

  console.log(`  Email:  ${email}`);
  if (generatedPassword) {
    const path = writeSecretToFile(generatedPassword);
    console.log(`  Пароль: записан в ${path} (0600, НЕ в stdout).`);
  } else {
    console.log(`  Пароль: передан явно, скрипт его не сохраняет.`);
  }
  console.log('Сохраните пароль в надёжном месте и удалите файл.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});