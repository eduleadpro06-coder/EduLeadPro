
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Checking bus_routes constraints...");
    try {
        const constraints = await db.execute(sql`
      SELECT conname, confrelid::regclass as referenced_table
      FROM pg_constraint 
      WHERE conrelid = 'bus_routes'::regclass;
    `);
        console.log("Constraints on bus_routes:", constraints);
        process.exit(0);
    } catch (error) {
        console.error("Error checking constraints:", error);
        process.exit(1);
    }
}

main();
