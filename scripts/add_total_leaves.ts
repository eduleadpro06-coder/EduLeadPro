
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Running migration to add total_leaves to staff table...");
    try {
        await db.execute(sql`ALTER TABLE staff ADD COLUMN IF NOT EXISTS total_leaves INTEGER DEFAULT 15;`);
        console.log("Migration successful!");
    } catch (error) {
        console.error("Migration failed:", error);
    }
    process.exit(0);
}

main();
