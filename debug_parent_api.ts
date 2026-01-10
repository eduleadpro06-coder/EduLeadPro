
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

// Bypass SSL for local dev
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API_BASE_URL = 'http://localhost:5000/api/v1/mobile';
const PARENT_TOKEN = ''; // We need a parent token to test auth, but first let's try to mock the DB call logic without full auth if difficult, OR query the DB logic directly.
// Actually, since this is a backend script, let's just RUN the logic that the API runs, but manually.

import { db } from './server/db';
import { busLiveLocations, busTripPassengerEvents } from './shared/schema';
import { eq, desc } from 'drizzle-orm';
import pg from 'pg';

const { Pool } = pg;

async function checkParentLogic() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('--- Simulating Parent Portal Logic ---');

        // 1. Get the ACTIVE route (from our previous finding, route_id=2)
        const ROUTE_ID = 2; // Hardcoded from previous debug output

        console.log(`Checking Route ID: ${ROUTE_ID}...`);

        // Logic from parent.ts -> /bus/:routeId/live-location

        // 1. Get latest location from the synchronized table
        const resLocation = await pool.query(`
            SELECT * FROM bus_live_locations 
            WHERE route_id = $1 
            AND is_active = true 
            ORDER BY timestamp DESC 
            LIMIT 1
        `, [ROUTE_ID]);

        const location = resLocation.rows[0];
        console.log('1. Location Found:', location ? 'YES' : 'NO');
        if (location) {
            console.log('   Lat/Lng:', location.latitude, location.longitude);
            console.log('   Timestamp:', location.timestamp);

            // Check recency
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const isRecent = new Date(location.timestamp) >= fiveMinutesAgo;
            console.log('   Is Recent (>5m ago):', isRecent);
            console.log('   Is Active:', location.is_active);
        }

        // 2. Logic to check why Frontend might show "Tracking Inactive"
        if (!location) {
            console.log('   FAILURE: No active location record found for this route.');
        } else {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const isRecent = new Date(location.timestamp) >= fiveMinutesAgo;
            if (!isRecent) {
                console.log('   FAILURE: Location is STALE (older than 5 mins).');
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkParentLogic();
