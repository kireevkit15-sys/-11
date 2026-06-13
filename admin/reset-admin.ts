import { db } from './src/lib/db';
import { adminUsers } from './src/lib/schema';
import { hash } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';

async function resetPassword() {
  const email = 'admin@diva.ru';
  const newPassword = 'admin123';

  console.log('🔑 Resetting admin password...');

  // Hash new password
  const passwordHash = await hash(newPassword, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  // Update password
  await db
    .update(adminUsers)
    .set({ passwordHash })
    .where(eq(adminUsers.email, email));

  console.log('✅ Password reset!');
  console.log('📧 Email:', email);
  console.log('🔑 Password:', newPassword);
}

resetPassword().catch(console.error);
