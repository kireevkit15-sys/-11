/**
 * Diva Admin — сброс/создание пароля администратора.
 * Запуск: npx tsx scripts/reset-admin.ts <email> <password>
 * По умолчанию email=admin@diva.ru. Если пароль не указан — генерируется.
 */

import { db } from '../src/lib/db';
import { adminUsers } from '@db/schema';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';

function generatePassword(length = 16) {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

async function main() {
  const email = (process.argv[2] || 'admin@diva.ru').toLowerCase();
  const rawPassword = process.argv[3] || generatePassword(16);

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
      .set({ passwordHash, requirePasswordChange: false, updatedAt: new Date() })
      .where(eq(adminUsers.id, existing.id));
    console.log(`Пароль администратора ${email} сброшен.`);
  } else {
    const [user] = await db
      .insert(adminUsers)
      .values({ email, passwordHash, name: 'Администратор', role: 'admin', requirePasswordChange: false })
      .returning();
    console.log(`Создан администратор ${user.email}.`);
  }

  console.log('--------------------------------------');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${rawPassword}`);
  console.log('--------------------------------------');
  console.log('Сохраните пароль в надёжном месте.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
