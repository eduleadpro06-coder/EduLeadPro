import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync } from 'fs';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const migration = readFileSync('./migrations/add_emi_schedule_adjustments.sql', 'utf8');

try {
  await sql.unsafe(migration);
  console.log('✅ Migration completed successfully!');
} catch (err) {
  if (err.message && err.message.includes('already exists')) {
    console.log('✅ Columns already exist - migration already applied.');
  } else {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
} finally {
  await sql.end();
}
