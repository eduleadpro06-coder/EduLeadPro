import { storage } from '../server/storage.js';
import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';

async function checkUsers() {
    console.log('--- Checking Users Table ---');
    const users = await db.select().from(schema.users);

    if (users.length === 0) {
        console.log('No users found.');
        return;
    }

    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
        console.log(`ID: ${u.id}, Username: ${u.username}, Email: ${u.email}, Role: ${u.role}, OrgID: ${u.organizationId}`);
    });
}

checkUsers().catch(console.error);
