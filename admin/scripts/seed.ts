/**
 * Diva Admin — Seed Script
 * Run: npm run seed
 */

import { db } from '../src/lib/db';
import { adminUsers } from '../src/lib/schema';
import { hash } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Creating admin user...');

  const email = 'admin@diva.ru';
  const password = 'admin123';
  const name = 'Администратор';

  // Check if exists
  const existing = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, email),
  });

  if (existing) {
    console.log('⚠️  User already exists');
    console.log('📧 Email:', email);
    console.log('🔑 Password: admin123');
    return;
  }

  // Hash password
  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  // Create user
  await db.insert(adminUsers).values({
    email,
    passwordHash,
    name,
    role: 'admin',
  });

  console.log('✅ Admin user created!');
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);
  console.log('\n🌐 Open http://localhost:3001/login');
}

seed().catch(console.error);
