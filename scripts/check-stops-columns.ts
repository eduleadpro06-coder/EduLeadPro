
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Checking columns for bus_stops...");
    try {
        const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bus_stops'
      ORDER BY ordinal_position;
    `);
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error checking columns:", error);
        process.exit(1);
    }
}

main();
