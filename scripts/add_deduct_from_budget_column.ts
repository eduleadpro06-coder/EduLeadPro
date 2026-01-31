import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Adding deduct_from_budget column to expenses table...");

    try {
        await db.execute(sql`
      ALTER TABLE expenses 
      ADD COLUMN IF NOT EXISTS deduct_from_budget BOOLEAN DEFAULT false NOT NULL;
    `);
        console.log("✅ Successfully added deduct_from_budget column.");
    } catch (error) {
        console.error("❌ Failed to add column:", error);
    }

    process.exit(0);
}

main();
