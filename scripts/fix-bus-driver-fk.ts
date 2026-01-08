
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Fixing bus_routes driver_id foreign key...");
    try {
        // 1. Drop the existing constraint (which points to users)
        // We use a safe approach checking if it exists
        await db.execute(sql`
      ALTER TABLE bus_routes 
      DROP CONSTRAINT IF EXISTS bus_routes_driver_id_fkey;
    `);
        console.log("Dropped old constraint.");

        // 2. Add the new constraint pointing to staff
        await db.execute(sql`
      ALTER TABLE bus_routes 
      ADD CONSTRAINT bus_routes_driver_id_fkey 
      FOREIGN KEY (driver_id) REFERENCES staff(id);
    `);
        console.log("Successfully updated foreign key to reference staff table.");

        process.exit(0);
    } catch (error) {
        console.error("Error fixing foreign key:", error);
        process.exit(1);
    }
}

main();
