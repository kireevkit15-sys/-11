/**
 * Diva Admin — seed-скрипт первого администратора.
 * Запуск: npx tsx scripts/seed-admin.ts
 *
 * Безопасность: сгенерированный пароль НИКОГДА не пишется в stdout/logs.
 * Если ADMIN_INITIAL_PASSWORD пуст — пароль генерируется и сохраняется в файл,
 * путь к которому выводится оператору (по умолчанию /run/secrets/diva-admin-initial-password,
 * fallback — ./.diva-admin-initial-password).
 */

import { db } from '../src/lib/db';
import { adminUsers } from '@db/schema';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';

function generatePassword(length = 16) {
  // Rejection sampling: исключаем modulo bias (chars.length не степень 2).
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
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
    process.env.ADMIN_INITIAL_PASSWORD_FILE ||
    (process.platform === 'linux' && require('fs').existsSync('/run/secrets')
      ? '/run/secrets/diva-admin-initial-password'
      : join(process.cwd(), '.diva-admin-initial-password'));

  try {
    writeFileSync(filePath, content + '\n', { mode: 0o600 });
    chmodSync(filePath, 0o600);
  } catch (err) {
    throw new Error(
      `Не удалось записать пароль в ${filePath}: ${(err as Error).message}. ` +
        `Укажите ADMIN_INITIAL_PASSWORD явно через переменную окружения.`,
    );
  }
  return filePath;
}

async function main() {
  const email = process.env.ADMIN_INITIAL_EMAIL || 'admin@diva.ru';
  const explicitPassword = process.env.ADMIN_INITIAL_PASSWORD;
  let generatedPassword: string | null = null;
  const rawPassword = explicitPassword ?? (generatedPassword = generatePassword(16));

  const existing = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, email),
  });

  if (existing) {
    console.log(`Администратор ${email} уже существует. Пропускаем создание.`);
    process.exit(0);
  }

  const passwordHash = await hash(rawPassword, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const [user] = await db
    .insert(adminUsers)
    .values({
      email,
      passwordHash,
      name: 'Администратор',
      role: 'admin',
      requirePasswordChange: true,
    })
    .returning();

  if (!user) {
    console.error('Не удалось создать администратора (пустой результат)');
    process.exit(1);
  }
  console.log(`Создан администратор:`);
  console.log(`  Email:    ${user.email}`);
  console.log(`  Role:     ${user.role}`);
  console.log(`  ID:       ${user.id}`);

  if (generatedPassword) {
    const path = writeSecretToFile(generatedPassword);
    console.log(`  Пароль:   записан в ${path} (0600, НЕ в stdout).`);
    console.log(`            После первого входа требуется сменить пароль.`);
  } else {
    console.log(`  Пароль:   задан через ADMIN_INITIAL_PASSWORD (не сохраняется скриптом).`);
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});