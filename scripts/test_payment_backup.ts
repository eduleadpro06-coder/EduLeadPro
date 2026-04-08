import 'dotenv/config';
import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';
import { supabase } from '../server/supabase.js';
import { PgTable } from 'drizzle-orm/pg-core';

async function runPaymentBackup() {
    console.log('[TEST] Starting manual payment backup test...');

    try {
        const backupData: Record<string, any> = {};
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        const paymentRelatedTables = [
            'organizations',
            'leads',
            'students',
            'feeStructure',
            'globalClassFees',
            'feePayments',
            'eMandates',
            'emiSchedule',
            'emiPlans',
            'expenses',
            'payroll',
            'daycarePayments',
            'daycareEnrollments',
            'daycareBillingConfig',
            'inventoryItems',
            'inventoryTransactions',
            'sellOrders',
            'sellOrderItems'
        ];

        console.log('[TEST] Dumping financial tables...');
        let tableCount = 0;

        for (const tableName of paymentRelatedTables) {
            const table = (schema as any)[tableName];
            
            if (table && (table instanceof PgTable || (typeof table === 'object' && table !== null && 'config' in table))) {
                try {
                    // console.log(`[TEST] Dumping ${tableName}...`);
                    const records = await db.select().from(table);
                    backupData[tableName] = records;
                    tableCount++;
                } catch (err) {
                    console.error(`[TEST] Failed to dump ${tableName}:`, err);
                }
            }
        }

        console.log(`[TEST] Dumped ${tableCount} tables.`);

        const buffer = Buffer.from(JSON.stringify(backupData, null, 2), 'utf-8');
        const fileName = `payments/test_payment_backup_${timestamp}.json`;

        console.log(`[TEST] Uploading ${fileName} (${buffer.length} bytes) to 'backups' bucket...`);

        const { data, error } = await supabase.storage
            .from('backups')
            .upload(fileName, buffer, {
                contentType: 'application/json',
                upsert: false
            });

        if (error) {
            console.error('[TEST] Supabase upload failed:', error);
            console.log('NOTE: Ensure the "backups" bucket exists and you have write permissions.');
        } else {
            console.log('[TEST] Payment backup successful!', data);
            console.log(`[TEST] Path: ${data.path}`);
        }

    } catch (error) {
        console.error('[TEST] Error during backup operation:', error);
    }

    process.exit(0);
}

runPaymentBackup();
