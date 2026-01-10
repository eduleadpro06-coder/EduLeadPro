import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

// Bypass SSL for local dev
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = pg;

async function checkTrackingState() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('--- Checking Tracking DB State (Raw SQL) ---');

        // 1. Active Bus Sessions
        console.log('\n1. Active Bus Sessions (Last 5):');
        const res1 = await pool.query(`
            SELECT id, route_id, status, started_at, driver_id 
            FROM active_bus_sessions 
            ORDER BY started_at DESC 
            LIMIT 5
        `);
        console.log(JSON.stringify(res1.rows, null, 2));

        // 2. Bus Live Locations
        console.log('\n2. Bus Live Locations (Last 5):');
        const res2 = await pool.query(`
            SELECT route_id, latitude, longitude, is_active, timestamp, driver_id 
            FROM bus_live_locations 
            ORDER BY timestamp DESC 
            LIMIT 5
        `);
        console.log(JSON.stringify(res2.rows, null, 2));

        // 3. System Time Check
        const res3 = await pool.query('SELECT NOW()::text as server_time');
        console.log('\n3. DB Server Time:', res3.rows[0].server_time);

        // 4. Routes Check
        const res4 = await pool.query('SELECT id, route_name FROM bus_routes LIMIT 5');
        console.log('\n4. Bus Routes:', JSON.stringify(res4.rows, null, 2));

        // 5. Check Assignments for Route 3 (The active one)
        console.log('\n5. Students assigned to Route 3:');
        const res5 = await pool.query(`
            SELECT sba.student_id, l.name, sba.route_id 
            FROM student_bus_assignments sba
            JOIN leads l ON sba.student_id = l.id
            WHERE sba.route_id = 3
        `);
        console.log(JSON.stringify(res5.rows, null, 2));


    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkTrackingState();
