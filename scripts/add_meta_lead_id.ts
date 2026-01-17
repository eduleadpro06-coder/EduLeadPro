
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Adding meta_lead_id column to leads table...");

    try {
        await db.execute(sql`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS meta_lead_id text;
    `);
        console.log("✅ Successfully added meta_lead_id column.");
    } catch (error) {
        console.error("❌ Failed to add column:", error);
    }

    process.exit(0);
}

main();
