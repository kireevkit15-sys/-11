/**
 * Diva Admin — seed-скрипт первого администратора.
 * Запуск: npx tsx scripts/seed-admin.ts
 * Ожидает DATABASE_URL и ADMIN_INITIAL_PASSWORD (или генерации пароля).
 */

import { db } from '../src/lib/db';
import { adminUsers } from '@db/schema';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';

function generatePassword(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

async function main() {
  const email = process.env.ADMIN_INITIAL_EMAIL || 'admin@diva.ru';
  const rawPassword = process.env.ADMIN_INITIAL_PASSWORD || generatePassword(16);

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

  console.log(`Создан администратор:`);
  console.log(`  Email:    ${user.email}`);
  console.log(`  Password: ${rawPassword}`);
  console.log(`  Role:     ${user.role}`);
  console.log(`  ID:       ${user.id}`);
  console.log('Сохраните пароль в надёжном месте. При первом входе требуется смена пароля.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
