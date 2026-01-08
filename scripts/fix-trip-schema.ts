
import postgres from "postgres";
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL!;

async function fixSchema() {
    console.log('🛠️ Fixing active_bus_sessions schema...');
    const sql = postgres(connectionString);

    try {
        // 1. Drop the table and recreate it with correct types
        // This is safer than ALTER if we have type mismatches on FKs
        console.log('Dropping active_bus_sessions...');
        await sql`DROP TABLE IF EXISTS active_bus_sessions CASCADE`;

        console.log('Recreating active_bus_sessions with INTEGER route_id...');
        await sql`
      CREATE TABLE active_bus_sessions (
        id SERIAL PRIMARY KEY,
        route_id INTEGER NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
        driver_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'live',
        started_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP,
        current_latitude DECIMAL(10, 8),
        current_longitude DECIMAL(11, 8),
        current_speed DECIMAL(5, 2),
        current_heading DECIMAL(5, 2),
        last_updated TIMESTAMP DEFAULT NOW()
      )
    `;

        console.log('✅ Schema fixed!');
    } catch (err) {
        console.error('❌ Error fixing schema:', err);
    } finally {
        await sql.end();
    }
}

fixSchema();
