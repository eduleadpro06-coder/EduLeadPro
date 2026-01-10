import pg from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = pg;

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const sql = fs.readFileSync('./server/migrations/add-location-upsert-rpc.sql', 'utf8');
        console.log('Running migration...');
        await pool.query(sql);
        console.log('✅ Migration successful!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
