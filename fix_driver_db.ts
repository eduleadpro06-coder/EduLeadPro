
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Bypass SSL check for self-signed certs

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('No connection string found');
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        await client.connect();
        console.log('Connected to database');

        // 1. Fix bus_live_locations constraint
        console.log('Checking bus_live_locations constraint...');
        try {
            await client.query(`
                ALTER TABLE bus_live_locations 
                ADD CONSTRAINT bus_live_locations_route_id_key UNIQUE (route_id);
            `);
            console.log('✅ Unique constraint added to bus_live_locations');
        } catch (e: any) {
            if (e.code === '42710') { // duplicate_object
                console.log('ℹ️ Constraint already exists on bus_live_locations');
            } else {
                console.error('❌ Failed to add constraint:', e.message);
            }
        }

        // 2. Create bus_trip_passenger_events table
        console.log('Creating bus_trip_passenger_events table...');
        const sqlPath = path.join(process.cwd(), 'db', 'migrations', 'add-boarding-events.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        // Split and run commands individually generally safer, but here it's simple DDL
        try {
            await client.query(sql);
            console.log('✅ boarding events table created/verified');
        } catch (e: any) {
            console.error('❌ Failed to create table:', e.message);
        }

    } catch (err) {
        console.error('Database connection error:', err);
    } finally {
        await client.end();
    }
}

main();
