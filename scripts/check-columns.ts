
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Checking columns for student_bus_assignments...");
    try {
        const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'student_bus_assignments'
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
