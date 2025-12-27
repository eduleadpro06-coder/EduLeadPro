import { db } from "./server/db.js";
import { sql } from "drizzle-orm";

async function checkTables() {
    try {
        const result = await db.execute(sql`SELECT table_name, table_schema FROM information_schema.tables WHERE table_name = 'staff'`);
        console.log("=== STAFF TABLES ===");
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

checkTables();
