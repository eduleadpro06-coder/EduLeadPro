
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Checking Bus Route ID types...");
    try {
        const busRoutesId = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bus_routes' AND column_name = 'id';
    `);
        console.log("bus_routes.id:", JSON.stringify(busRoutesId, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error checking types:", error);
        process.exit(1);
    }
}

main();
