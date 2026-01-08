/**
 * Apply bus live locations migration
 * Run with: npx tsx scripts/apply-bus-tracking-migration.ts
 */

import { db } from "../server/db.js";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function applyMigration() {
    try {
        console.log("🚀 Applying bus live locations migration...");

        // Read the migration file
        const migrationPath = path.join(process.cwd(), "db/migrations/add-bus-live-locations.sql");
        const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

        // Execute the migration
        await db.execute(sql.raw(migrationSQL));

        console.log("✅ Migration completed successfully!");
        console.log("");
        console.log("📍 Created table: bus_live_locations");
        console.log("📊 Created indexes for better performance");
        console.log("");
        console.log("🎉 Real-time bus tracking is now ready to use!");

        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

applyMigration();
