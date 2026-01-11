/**
 * Apply unique constraint migration
 * Run with: npx tsx scripts/apply-unique-constraint.ts
 */

import { db } from "../server/db.js";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function applyMigration() {
    try {
        console.log("🚀 Applying unique constraint migration...");

        // Read the migration file
        const migrationPath = path.join(process.cwd(), "db/migrations/add-route-id-unique.sql");
        const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

        // Execute the migration
        await db.execute(sql.raw(migrationSQL));

        console.log("✅ Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

applyMigration();
