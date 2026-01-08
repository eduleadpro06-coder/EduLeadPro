
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Connection details (using public keys/url from env if possible, or hardcoded for this check if known, 
// but asking user environment is better. I'll try to rely on env vars from .env file or just use the local db if I can access it via pg)
// Actually I can use the Drizzle config to connect via Postgres directly which is safer/better.

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
    console.error("❌ DATABASE_URL is missing!");
    process.exit(1);
}

async function checkRoutes() {
    console.log('🔍 Checking Bus Routes...');
    const sql = postgres(connectionString);
    const db = drizzle(sql);

    try {
        const columns = await sql`
        SELECT table_name, column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name IN ('active_bus_sessions', 'student_bus_assignments', 'leads', 'staff', 'bus_routes', 'bus_location_history', 'bus_live_locations')
        ORDER BY table_name, ordinal_position
    `;
        console.table(columns);
        fs.writeFileSync('table_columns_v2.json', JSON.stringify(columns, null, 2));
        console.log('✅ Columns written to table_columns_v2.json');

        const routes = await sql`SELECT * FROM bus_routes`;
        console.log('\n🚌 Actual Bus Routes in DB:');
        routes.forEach(r => console.log(JSON.stringify(r)));

        const assignments = await sql`SELECT * FROM student_bus_assignments`;
        console.log('\n🎒 Student Bus Assignments count:', assignments.length);
        if (assignments.length > 0) {
            console.log('Sample assignment:', JSON.stringify(assignments[0]));
            const firstStudentId = assignments[0].student_id;
            const lead = await sql`SELECT id, name FROM leads WHERE id = ${firstStudentId}`;
            console.log(`\n🔍 Lead check for ID ${firstStudentId}:`, lead.length > 0 ? lead[0] : 'NOT FOUND');
        }

        const madan = await sql`SELECT id, name, role FROM staff WHERE name ILIKE '%Madan%'`;
        console.log('\n👤 Madan Search Result:');
        console.table(madan);

        const drivers = await sql`SELECT id, name, role FROM staff WHERE role::text ILIKE 'driver'`;
        console.log('\n👨‍✈️ Drivers by case-insensitive Role:');
        console.table(drivers);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.end();
    }
}

checkRoutes();
