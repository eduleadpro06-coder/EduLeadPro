/**
 * Migration: Add 'type' column to expenses table for Cash Ledger feature
 * This column differentiates inward (budget/income) vs outward (expense) entries.
 * Existing rows default to 'outward'.
 */
import 'dotenv/config';
import postgres from 'postgres';

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const sql = postgres(connectionString);
  
  try {
    console.log('🔄 Adding "type" column to expenses table...');
    await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'outward'`;
    console.log('✅ Column added successfully (existing rows defaulted to "outward").');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
