
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Checking Leads ID type...");
    try {
        const leadsId = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'leads' AND column_name = 'id';
    `);
        console.log("leads.id:", JSON.stringify(leadsId, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error checking types:", error);
        process.exit(1);
    }
}

main();
