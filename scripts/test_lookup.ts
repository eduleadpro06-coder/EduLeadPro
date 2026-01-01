import { storage } from '../server/storage.js';
import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function testLookup() {
    const testEmails = [
        'melonspreschool@gmail.com',
        'MELONSPRESCHOOL@GMAIL.COM',
        'melons.preschool@gmail.com',
        'MeLoNsPrEsChOoL@gMaIl.CoM'
    ];

    console.log('--- Testing User Lookup Robustness ---');

    for (const email of testEmails) {
        console.log(`\nTesting with: "${email}"`);

        const byUsername = await storage.getUserByUsername(email);
        const byEmail = await storage.getUserByEmail(email);

        console.log(`  getUserByUsername: ${byUsername ? '✅ Found' : '❌ Not Found'}`);
        console.log(`  getUserByEmail:    ${byEmail ? '✅ Found' : '❌ Not Found'}`);
    }
}

testLookup().catch(console.error);
