
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { db } from '../server/db';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define table insertion order to satisfy Foreign Key constraints
// Tables not listed here will be inserted after these in arbitrary order
const TABLE_PRIORITY = [
    'organizations',
    'users',
    'staff', // Depends on orgs
    'leadSources',
    'messageTemplates',
    'leads', // Depends on orgs, staff
    'students', // Depends on orgs
    'courses',
    'feeStructure', // Depends on orgs
    'followUps', // Depends on leads, staff
    'attendance', // Depends on staff
    'payroll', // Depends on staff
    'expenses', // Depends on orgs
    'feePayments', // Depends on leads, orgs
    'eMandates', // Depends on leads
    'emiPlans', // Depends on students (leads)
    'emiSchedule', // Depends on emiPlans
];

async function restoreBackup() {
    const fileName = 'test_backup_2026-01-12T19-58-09-943Z.json';
    console.log(`🚀 Starting restore from ${fileName}...`);

    try {
        // 1. Download Backup
        console.log('📥 Downloading backup file...');
        const { data, error } = await supabase.storage.from('backups').download(fileName);

        if (error) {
            throw new Error(`Failed to download backup: ${error.message}`);
        }

        const text = await data.text();
        const backupData = JSON.parse(text);

        console.log('✅ Backup downloaded and parsed.');

        // 2. Prepare Tables List (Sorted by Priority)
        const tablesToRestore = Object.keys(backupData).sort((a, b) => {
            const indexA = TABLE_PRIORITY.indexOf(a);
            const indexB = TABLE_PRIORITY.indexOf(b);

            // If both are in priority list, sort by index
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            // If only A is in list, A comes first
            if (indexA !== -1) return -1;
            // If only B is in list, B comes first
            if (indexB !== -1) return 1;
            // Otherwise, keep original order (or sort alphabetically for consistency)
            return a.localeCompare(b);
        });

        // 3. Insert Data
        for (const tableName of tablesToRestore) {
            const records = backupData[tableName];

            if (!records || records.length === 0) {
                console.log(`⚠️  Skipping ${tableName} (No records)`);
                continue;
            }

            console.log(`\n⏳ Restoring ${tableName} (${records.length} records)...`);

            // Get schema object
            const tableSchema = schema[tableName];
            if (!tableSchema) {
                console.warn(`❌ Table schema for '${tableName}' not found in shared/schema.ts. Skipping.`);
                continue;
            }

            // Process records to fix dates/types
            const processedRecords = records.map(record => {
                const newRecord: any = { ...record };

                // Helper to check if a string looks like a date
                const isDateString = (val: any) => {
                    return typeof val === 'string' &&
                        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val);
                };

                // Helper to check if a simple date string (YYYY-MM-DD)
                const isSimpleDateString = (val: any) => {
                    return typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val);
                };

                for (const key in newRecord) {
                    const value = newRecord[key];

                    // Convert ISO strings to Date objects
                    if (isDateString(value)) {
                        newRecord[key] = new Date(value);
                    }
                    // Convert simple date strings to Date objects if the key suggests it involves a date/time
                    // but be careful not to corrupt other strings. 
                    // Drizzle 'date' type often expects string "YYYY-MM-DD" or Date object.
                    // 'timestamp' expects Date object or ISO string.
                    // The 'toISOString' error implies something expects specific Date methods.
                    else if (isSimpleDateString(value) && (key.endsWith('Date') || key.endsWith('At') || key === 'date' || key === 'dob')) {
                        newRecord[key] = new Date(value);
                    }
                }
                return newRecord;
            });

            // Insert in chunks to avoid query size limits
            const CHUNK_SIZE = 50;
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < processedRecords.length; i += CHUNK_SIZE) {
                const chunk = processedRecords.slice(i, i + CHUNK_SIZE);
                try {
                    // Start transaction for the chunk? No, just atomic insert
                    await db.insert(tableSchema).values(chunk).onConflictDoNothing();
                    successCount += chunk.length;
                } catch (err: any) {
                    console.error(`❌ Failed to insert chunk for ${tableName}:`, err.message);

                    // Retry individually
                    for (const rec of chunk) {
                        try {
                            await db.insert(tableSchema).values(rec).onConflictDoNothing();
                            successCount++;
                        } catch (singleErr: any) {
                            console.error(`   - Failed row in ${tableName} (ID: ${rec.id}):`, singleErr.message);
                            // console.log('     Row data:', JSON.stringify(rec)); // Debug only
                            errorCount++;
                        }
                    }
                }
            }

            console.log(`   ✅ Restored ${successCount} / ${records.length} records.`);
            if (errorCount > 0) console.log(`   ⚠️  ${errorCount} failed records.`);
        }

        console.log('\n✨ Restore process completed!');

    } catch (error) {
        console.error('❌ FATAL ERROR During Restore:', error);
        process.exit(1);
    }
}

restoreBackup();
