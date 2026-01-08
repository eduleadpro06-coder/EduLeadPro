
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Running fix-bus-schema migration...");

  try {
    // 1. Check if 'bus_routes' table exists
    const tableCheck = await db.execute(sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'bus_routes'
            );
        `);

    if (!tableCheck[0]?.exists) {
      console.log("'bus_routes' table does not exist. It will be created by the app logic or standard migrations.");
      return;
    }

    // 2. Check if 'status' column exists in 'bus_routes'
    const columnCheck = await db.execute(sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'bus_routes' AND column_name = 'status';
        `);

    if (columnCheck.length === 0) {
      console.log("Column 'status' missing in 'bus_routes'. Adding it now...");
      await db.execute(sql`
                ALTER TABLE bus_routes 
                ADD COLUMN status VARCHAR(20) DEFAULT 'active';
            `);
      console.log("Successfully added 'status' column to 'bus_routes'.");
    } else {
      console.log("Column 'status' already exists in 'bus_routes'. No action needed.");
    }

    console.log("Migration completed.");
    process.exit(0);

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
