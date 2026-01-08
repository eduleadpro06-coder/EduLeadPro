
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Resetting Bus Schema to use Integers (Serial)...");
    try {
        // 1. Drop tables in reverse order of dependency
        console.log("Dropping tables...");
        await db.execute(sql`DROP TABLE IF EXISTS student_bus_assignments CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS bus_stops CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS bus_routes CASCADE`);

        // 2. Create bus_routes
        console.log("Creating bus_routes...");
        await db.execute(sql`
      CREATE TABLE bus_routes (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        route_name VARCHAR(100) NOT NULL,
        bus_number VARCHAR(50) NOT NULL,
        driver_id INTEGER REFERENCES staff(id),
        helper_name VARCHAR(100),
        helper_phone VARCHAR(20),
        capacity INTEGER,
        start_time VARCHAR(10),
        end_time VARCHAR(10),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

        // 3. Create bus_stops
        console.log("Creating bus_stops...");
        await db.execute(sql`
      CREATE TABLE bus_stops (
        id SERIAL PRIMARY KEY,
        route_id INTEGER NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
        stop_name VARCHAR(100) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        arrival_time VARCHAR(10),
        pickup_price DECIMAL(10, 2) DEFAULT '0',
        stop_order INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

        // 4. Create student_bus_assignments
        console.log("Creating student_bus_assignments...");
        await db.execute(sql`
      CREATE TABLE student_bus_assignments (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        route_id INTEGER NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
        pickup_stop_id INTEGER REFERENCES bus_stops(id),
        drop_stop_id INTEGER REFERENCES bus_stops(id),
        assigned_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

        console.log("Bus schema reset successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error resetting schema:", error);
        process.exit(1);
    }
}

main();
