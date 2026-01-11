
import postgres from "postgres";
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL!;

async function checkLiveStatus() {
    const routeId = 3;
    console.log(`🔍 Checking Live Status for Route ${routeId}...`);
    const sql = postgres(connectionString);

    try {
        // 1. Check for active session
        const sessions = await sql`
            SELECT id, route_id, driver_id, status, started_at FROM active_bus_sessions 
            WHERE route_id = ${routeId} AND status = 'live'
            ORDER BY started_at DESC
        `;
        console.log(`\n🔥 Active Sessions Count: ${sessions.length}`);
        sessions.forEach(s => console.log(JSON.stringify(s)));

        // 2. Check for live location
        const locations = await sql`
            SELECT id, route_id, latitude, longitude, is_active, timestamp,
            (EXTRACT(EPOCH FROM (NOW() AT TIME ZONE 'Asia/Kolkata' - timestamp))) as seconds_ago
            FROM bus_live_locations 
            WHERE route_id = ${routeId}
            ORDER BY timestamp DESC 
            LIMIT 5
        `;
        console.log(`\n📍 Latest Live Locations Count: ${locations.length}`);
        locations.forEach(l => console.log(JSON.stringify(l)));

        // 3. Check Route details
        const routes = await sql`SELECT id, route_name FROM bus_routes WHERE id = ${routeId}`;
        console.log(`\n🚌 Route Details: ${JSON.stringify(routes[0] || 'NONE')}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.end();
    }
}

checkLiveStatus();
