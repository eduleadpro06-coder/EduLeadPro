import { db } from "./server/db.js";
import { sql } from "drizzle-orm";

async function inspectAll() {
    try {
        const users = await db.execute(sql`SELECT * FROM users`);
        console.log("=== ALL USERS ===");
        console.log(JSON.stringify(users, null, 2));

        const staff = await db.execute(sql`SELECT * FROM staff WHERE role ILIKE 'counselor'`);
        console.log("=== COUNSELOR STAFF ===");
        console.log(JSON.stringify(staff, null, 2));

    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

inspectAll();
