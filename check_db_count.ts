
import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function check() {
    try {
        const users = await db.execute(sql`SELECT id, username FROM users`);
        console.log('Users:', JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

check();
