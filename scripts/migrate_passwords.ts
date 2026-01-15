/**
 * Password Migration Script
 * Migrates plaintext passwords to bcrypt hashes in users and staff tables.
 * Safe to run multiple times (idempotent) - only hashes passwords not already using bcrypt.
 * 
 * Usage: npx tsx scripts/migrate_passwords.ts
 */

import 'dotenv/config';
import { db } from '../server/db.js';
import { users, staff } from '../shared/schema.js';
import bcrypt from 'bcrypt';
import { eq, sql } from 'drizzle-orm';

const SALT_ROUNDS = 12;

async function isHashed(password: string): boolean {
    // bcrypt hashes start with $2a$, $2b$, or $2y$
    return password.startsWith('$2');
}

async function migrateUserPasswords() {
    console.log('\n📦 Migrating USER passwords...');

    const allUsers = await db.select({
        id: users.id,
        username: users.username,
        password: users.password
    }).from(users);

    let migrated = 0;
    let skipped = 0;

    for (const user of allUsers) {
        if (!user.password) {
            console.log(`  ⏭️ User ${user.username}: No password set, skipping`);
            skipped++;
            continue;
        }

        if (isHashed(user.password)) {
            console.log(`  ✅ User ${user.username}: Already hashed, skipping`);
            skipped++;
            continue;
        }

        // Hash the plaintext password
        const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

        await db.update(users)
            .set({ password: hashedPassword })
            .where(eq(users.id, user.id));

        console.log(`  🔒 User ${user.username}: Password hashed`);
        migrated++;
    }

    console.log(`\n  Users: ${migrated} migrated, ${skipped} skipped`);
    return { migrated, skipped };
}

async function migrateStaffPasswords() {
    console.log('\n📦 Migrating STAFF passwords...');

    // Staff uses app_password column
    const allStaff = await db.execute(sql`
    SELECT id, name, app_password FROM staff WHERE app_password IS NOT NULL
  `);

    let migrated = 0;
    let skipped = 0;

    for (const member of allStaff.rows as any[]) {
        if (!member.app_password) {
            skipped++;
            continue;
        }

        if (isHashed(member.app_password)) {
            console.log(`  ✅ Staff ${member.name}: Already hashed, skipping`);
            skipped++;
            continue;
        }

        // Hash the plaintext password
        const hashedPassword = await bcrypt.hash(member.app_password, SALT_ROUNDS);

        await db.execute(sql`
      UPDATE staff SET app_password = ${hashedPassword} WHERE id = ${member.id}
    `);

        console.log(`  🔒 Staff ${member.name}: Password hashed`);
        migrated++;
    }

    console.log(`\n  Staff: ${migrated} migrated, ${skipped} skipped`);
    return { migrated, skipped };
}

async function migrateLeadPasswords() {
    console.log('\n📦 Migrating LEAD/PARENT passwords...');

    // Leads/Parents use app_password column
    const allLeads = await db.execute(sql`
    SELECT id, name, app_password FROM leads WHERE app_password IS NOT NULL
  `);

    let migrated = 0;
    let skipped = 0;

    for (const lead of allLeads.rows as any[]) {
        if (!lead.app_password) {
            skipped++;
            continue;
        }

        if (isHashed(lead.app_password)) {
            console.log(`  ✅ Lead ${lead.name}: Already hashed, skipping`);
            skipped++;
            continue;
        }

        // Hash the plaintext password
        const hashedPassword = await bcrypt.hash(lead.app_password, SALT_ROUNDS);

        await db.execute(sql`
      UPDATE leads SET app_password = ${hashedPassword} WHERE id = ${lead.id}
    `);

        console.log(`  🔒 Lead ${lead.name}: Password hashed`);
        migrated++;
    }

    console.log(`\n  Leads: ${migrated} migrated, ${skipped} skipped`);
    return { migrated, skipped };
}

async function main() {
    console.log('🔐 PASSWORD MIGRATION SCRIPT');
    console.log('============================');
    console.log('This script hashes plaintext passwords using bcrypt.');
    console.log('Safe to run multiple times - skips already hashed passwords.\n');

    try {
        const userResults = await migrateUserPasswords();
        const staffResults = await migrateStaffPasswords();
        const leadResults = await migrateLeadPasswords();

        console.log('\n============================');
        console.log('📊 SUMMARY');
        console.log('============================');
        console.log(`Users:  ${userResults.migrated} migrated, ${userResults.skipped} skipped`);
        console.log(`Staff:  ${staffResults.migrated} migrated, ${staffResults.skipped} skipped`);
        console.log(`Leads:  ${leadResults.migrated} migrated, ${leadResults.skipped} skipped`);
        console.log('\n✅ Migration complete!');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

main();
