import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../server/db.js';
import * as schema from '../../shared/schema.js';
import { supabase } from '../../server/supabase.js';
import { PgTable } from 'drizzle-orm/pg-core';

/**
 * Vercel Cron Job Handler for Payment Section Backups
 * 
 * Specifically backs up all tables related to student fees, EMI plans,
 * daycare billing, expenses, and payroll.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify authorization
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        console.log('[PAYMENT-BACKUP] Starting payment data backup...');
        const backupData: Record<string, any> = {};
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        // List of tables to include in the payment backup
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

        let tableCount = 0;

        for (const tableName of paymentRelatedTables) {
            const table = (schema as any)[tableName];
            
            if (table && (table instanceof PgTable || (typeof table === 'object' && table !== null && 'config' in table))) {
                try {
                    console.log(`[PAYMENT-BACKUP] Dumping table: ${tableName}`);
                    const records = await db.select().from(table);
                    backupData[tableName] = records;
                    tableCount++;
                } catch (err) {
                    console.error(`[PAYMENT-BACKUP] Failed to dump table ${tableName}:`, err);
                    backupData[tableName] = { error: String(err) };
                }
            } else {
                console.warn(`[PAYMENT-BACKUP] Table ${tableName} not found in schema or invalid.`);
            }
        }

        const buffer = Buffer.from(JSON.stringify(backupData, null, 2), 'utf-8');
        const fileName = `payments/backup_payments_${timestamp}.json`;

        // Upload to Supabase Storage
        console.log(`[PAYMENT-BACKUP] Uploading ${fileName} (${buffer.length} bytes) to 'backups' bucket...`);

        const { data, error } = await supabase.storage
            .from('backups')
            .upload(fileName, buffer, {
                contentType: 'application/json',
                upsert: false
            });

        if (error) {
            console.error('[PAYMENT-BACKUP] Supabase upload failed:', error);
            throw error;
        }

        console.log('[PAYMENT-BACKUP] Payment backup completed successfully:', data);

        return res.status(200).json({
            success: true,
            message: 'Payment backup created successfully',
            file: data.path,
            tablesDumped: tableCount,
            size: buffer.length
        });

    } catch (error) {
        console.error('[PAYMENT-BACKUP] Critical error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        });
    }
}
