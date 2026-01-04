import { db } from "../server/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
    console.log("=== Running Organization Contact Info Migration ===\n");

    try {
        const migrationPath = path.join(__dirname, "../db/migrations/add-org-contact-info.sql");
        const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

        console.log("Executing migration...");
        await db.execute(sql.raw(migrationSQL));

        console.log("✓ Migration completed successfully!");

        // Verify the changes
        const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      AND column_name IN ('phone', 'address', 'city', 'state', 'pincode')
      ORDER BY column_name;
    `);

        console.log("\nVerified columns:");
        console.log(result.rows);

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }

    console.log("\n=== Migration Complete ===");
    process.exit(0);
}

runMigration();
