
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Checking and fixing bus_routes schema...");

    try {
        // Add vehicle_number if missing
        await db.execute(sql`
      ALTER TABLE bus_routes 
      ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN';
    `);
        console.log("Verified/Added vehicle_number");

        // Add other potentially missing columns just in case
        await db.execute(sql`
      ALTER TABLE bus_routes 
      ADD COLUMN IF NOT EXISTS helper_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS helper_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS start_time VARCHAR(10),
      ADD COLUMN IF NOT EXISTS end_time VARCHAR(10),
      ADD COLUMN IF NOT EXISTS driver_id INTEGER REFERENCES staff(id);
    `);
        console.log("Verified/Added other columns");

        // Remove default 'UNKNOWN' constraint if we want (optional, but good for cleanliness if we added it above)
        // For now keeping it simple.

        console.log("Schema fix completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error fixing schema:", error);
        process.exit(1);
    }
}

main();
