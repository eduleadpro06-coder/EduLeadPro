import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = pg;

async function setTimezone() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('--- Setting Database Timezone to Asia/Kolkata ---');

        // Use ALTER DATABASE to make it persistent
        await pool.query(`ALTER DATABASE postgres SET timezone TO 'Asia/Kolkata'`);
        console.log('✅ ALTER DATABASE executed.');

        // Verify
        const result = await pool.query(`SHOW timezone;`);
        console.log('Current Timezone:', result.rows[0].TimeZone);

        const timeCheck = await pool.query(`SELECT NOW() as current_time;`);
        console.log('Current DB Time:', timeCheck.rows[0].current_time);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

setTimezone();
