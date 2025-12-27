import { db } from "./server/db.js";
import { sql } from "drizzle-orm";

async function checkEmails() {
    try {
        const emails = ["sbaksi51@gmail.com", "gaurav.kachwaha16@gmail.com"];
        for (const email of emails) {
            const user = await db.execute(sql`SELECT * FROM users WHERE email = ${email}`);
            console.log(`User with email ${email}:`, JSON.stringify(user, null, 2));
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

checkEmails();
