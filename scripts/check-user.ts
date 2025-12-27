
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkUser() {
    console.log("Checking for user ID 1...");
    const user1 = await db.select().from(users).where(eq(users.id, 1));

    if (user1.length > 0) {
        console.log("User 1 exists:", user1[0].username);
    } else {
        console.log("User 1 does NOT exist.");
        const allUsers = await db.select().from(users).limit(5);
        console.log("First 5 users:", allUsers.map(u => ({ id: u.id, username: u.username })));
    }
    process.exit(0);
}

checkUser().catch(err => {
    console.error(err);
    process.exit(1);
});
