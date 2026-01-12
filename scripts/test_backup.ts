import 'dotenv/config';
import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';
import { supabase } from '../server/supabase.js';
import { PgTable } from 'drizzle-orm/pg-core';

async function runBackup() {
    console.log('[TEST] Starting local backup test...');

    try {
        const backupData: Record<string, any> = {};
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        console.log('[TEST] Dumping tables...');
        let tableCount = 0;

        for (const [key, value] of Object.entries(schema)) {
            if (value instanceof PgTable || (typeof value === 'object' && value !== null && 'config' in value)) {
                try {
                    // console.log(`[TEST] Dumping ${key}...`);
                    const records = await db.select().from(value as any);
                    backupData[key] = records;
                    tableCount++;
                } catch (err) {
                    console.error(`[TEST] Failed to dump ${key}:`, err);
                }
            }
        }

        console.log(`[TEST] Dumped ${tableCount} tables.`);

        const buffer = Buffer.from(JSON.stringify(backupData, null, 2), 'utf-8');
        const fileName = `test_backup_${timestamp}.json`;

        console.log(`[TEST] Uploading ${fileName} (${buffer.length} bytes) to 'backups' bucket...`);

        const { data, error } = await supabase.storage
            .from('backups')
            .upload(fileName, buffer, {
                contentType: 'application/json',
                upsert: false
            });

        if (error) {
            // If bucket not found, try to create it
            if (error.message.includes('Bucket not found') || (error as any).statusCode === '404') {
                console.log('[TEST] Bucket "backups" not found. Attempting to create it...');
                const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('backups', {
                    public: false // Make it private for security
                });

                if (bucketError) {
                    console.error('[TEST] Failed to create bucket:', bucketError);
                } else {
                    console.log('[TEST] Bucket created successfully:', bucketData);
                    // Retry upload
                    console.log('[TEST] Retrying upload...');
                    const { data: retryData, error: retryError } = await supabase.storage
                        .from('backups')
                        .upload(fileName, buffer, {
                            contentType: 'application/json',
                            upsert: false
                        });

                    if (retryError) {
                        console.error('[TEST] Retry upload failed:', retryError);
                    } else {
                        console.log('[TEST] Backup successful after bucket creation!', retryData);
                        process.exit(0);
                    }
                }
            } else {
                console.error('[TEST] Supabase upload failed:', error);
                console.log('NOTE: Ensure the "backups" bucket exists in your Supabase Storage and is set to public or allows writing.');
            }
        } else {
            console.log('[TEST] Backup successful!', data);
        }

    } catch (error) {
        console.error('[TEST] Error:', error);
    }

    process.exit(0);
}

runBackup();
