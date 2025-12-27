import { db } from "./server/db.js";
import { sql } from "drizzle-orm";

async function inspectUsers() {
    try {
        const columns = await db.execute(sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'`);
        console.log("=== USERS COLUMNS ===");
        console.log(JSON.stringify(columns, null, 2));

        const counselors = await db.execute(sql`SELECT id, username, role FROM users WHERE role = 'counselor'`);
        console.log("=== COUNSELORS ===");
        console.log(JSON.stringify(counselors, null, 2));

        const staff = await db.execute(sql`SELECT id, name, role, email FROM staff`);
        console.log("=== STAFF ===");
        console.log(JSON.stringify(staff, null, 2));

    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

inspectUsers();
