
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Checking ID types...");
    try {
        const busStopsId = await db.execute(sql`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'bus_stops' AND column_name = 'id';
    `);
        console.log("bus_stops.id:", JSON.stringify(busStopsId, null, 2));

        const assignmentsStopId = await db.execute(sql`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'student_bus_assignments' AND column_name = 'stop_id';
    `);
        console.log("student_bus_assignments.stop_id:", JSON.stringify(assignmentsStopId, null, 2));

        process.exit(0);
    } catch (error) {
        console.error("Error checking types:", error);
        process.exit(1);
    }
}

main();
