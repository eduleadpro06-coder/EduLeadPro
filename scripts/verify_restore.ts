
import 'dotenv/config';
import { db } from '../server/db';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

async function verifyRestore() {
    console.log('🔍 Verifying Database Record Counts...');

    // List of tables we expect to have data based on the backup analysis
    // (You can expand this list based on what was in the backup)
    const tablesToCheck = [
        'organizations',
        'users',
        'staff',
        'leads',
        'students',
        'courses',
        'feeStructure',
        'followUps',
        'attendance',
        'payroll',
        'expenses',
        'feePayments',
        'eMandates',
        'emiPlans',
        'emiSchedule',
        'notifications',
        'departments', // if exists
        'roles' // if exists
    ];

    for (const tableName of tablesToCheck) {
        if (schema[tableName]) {
            try {
                // @ts-ignore
                const result = await db.select({ count: sql`count(*)` }).from(schema[tableName]);
                console.log(`${tableName}: ${result[0].count} records`);
            } catch (err) {
                console.log(`Error checking ${tableName}:`, err.message);
            }
        }
    }
}

verifyRestore();
