import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function test() {
  console.log('Testing database connection...');
  try {
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('Connected:', JSON.stringify(result));
  } catch (e: any) {
    console.log('Error:', e.message);
    console.log('Full error:', e);
  }
}

test();