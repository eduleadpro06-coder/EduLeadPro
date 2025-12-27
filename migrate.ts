import { db } from "./server/db.js";
import { sql } from "drizzle-orm";

async function migrate() {
    try {
        console.log("Adding name column to users table...");
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`);
        console.log("Successfully added name column.");
    } catch (err) {
        console.error("Migration failed:", err);
    }
    process.exit(0);
}

migrate();
