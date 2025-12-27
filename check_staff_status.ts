import { db } from "./server/db.js";
import { sql } from "drizzle-orm";

async function checkStaffStatus() {
    try {
        const staff = await db.execute(sql`SELECT id, name, role, is_active FROM staff`);
        console.log("=== STAFF STATUS ===");
        console.log(JSON.stringify(staff, null, 2));
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

checkStaffStatus();
