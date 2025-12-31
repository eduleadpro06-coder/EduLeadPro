
import { db } from "../server/db";
import { users } from "../shared/schema";

async function checkUsers() {
    console.log("Checking all users...");
    const allUsers = await db.select().from(users);

    allUsers.forEach(user => {
        console.log("User:", {
            id: user.id,
            username: user.username,
            organizationId: user.organizationId
        });
    });

    process.exit(0);
}

checkUsers().catch(console.error);
