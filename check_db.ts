import { db } from "./server/db.js";
import * as schema from "./shared/schema.js";

async function checkStaff() {
    const staff = await db.select().from(schema.staff);
    console.log("=== STAFF ===");
    console.log(JSON.stringify(staff, null, 2));

    const users = await db.select().from(schema.users);
    console.log("=== USERS ===");
    console.log(JSON.stringify(users, null, 2));

    process.exit(0);
}

checkStaff().catch(err => {
    console.error(err);
    process.exit(1);
});
