
import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        console.log("Adding billing_formula column...");
        await db.execute(sql`ALTER TABLE daycare_billing_config ADD COLUMN IF NOT EXISTS billing_formula TEXT DEFAULT 'Amount Due = Hourly Rate × Total Hours'`);
        console.log("Successfully added billing_formula column.");
        process.exit(0);
    } catch (error) {
        console.error("Error adding column:", error);
        process.exit(1);
    }
}

main();
