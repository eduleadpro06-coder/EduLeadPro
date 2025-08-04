const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read database URL from environment or use default
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/school_management';

const pool = new Pool({
  connectionString: databaseUrl,
});

async function createEmiPlansTable() {
  try {
    const sqlPath = path.join(__dirname, 'create-emi-plans-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Creating emi_plans table...');
    await pool.query(sql);
    console.log('✅ emi_plans table created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating emi_plans table:', error.message);
  } finally {
    await pool.end();
  }
}

createEmiPlansTable(); 