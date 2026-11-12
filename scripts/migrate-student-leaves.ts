import pg from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = pg;

async function runStudentLeavesMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const sqlPath = path.join(process.cwd(), 'scripts', 'add-student-leaves.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Running student_leaves migration...');
    await pool.query(sql);
    console.log('✅ student_leaves table created successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runStudentLeavesMigration();
