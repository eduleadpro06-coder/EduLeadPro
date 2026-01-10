import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = pg;

async function fixTimestamp() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('--- Fixing Route 3 timestamp using RPC ---');

        // Call RPC with real route_id 3
        const testResult = await pool.query(`
            SELECT upsert_bus_location(
                3,     -- real route_id
                2,     -- driver_id
                19.0465::numeric,  -- current lat
                73.0839::numeric,  -- current lng
                0::numeric,        -- speed
                0::numeric         -- heading
            )
        `);
        console.log('RPC call completed');

        // Check the result
        const checkResult = await pool.query(`
            SELECT route_id, timestamp, NOW() as db_now,
                   NOW() - timestamp as time_diff
            FROM bus_live_locations 
            WHERE route_id = 3
        `);
        console.log('\nTimestamp comparison for Route 3:');
        console.log('Stored timestamp:', checkResult.rows[0]?.timestamp);
        console.log('DB NOW():       ', checkResult.rows[0]?.db_now);
        console.log('Time difference:', checkResult.rows[0]?.time_diff);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

fixTimestamp();
