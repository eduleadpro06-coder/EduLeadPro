import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../server/db.js';
import * as schema from '../../shared/schema.js';
import { supabase } from '../../server/supabase.js';
import { is } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

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
        console.log('[BACKUP] Starting database backup...');
        const backupData: Record<string, any> = {};
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        // Iterate over all exports in schema
        for (const [key, value] of Object.entries(schema)) {
            // Check if the export is a Drizzle PgTable
            // We use 'is' from drizzle-orm but for simplicity effectively checking prototype or properties is enough
            // Using a simple check for internal symbol or characteristic properties
            if (value instanceof PgTable || (typeof value === 'object' && value !== null && 'config' in value && 'name' in (value as any).config)) {
                try {
                    console.log(`[BACKUP] Dumping table: ${key}`);
                    const records = await db.select().from(value as any);
                    backupData[key] = records;
                } catch (err) {
                    console.error(`[BACKUP] Failed to dump table ${key}:`, err);
                    backupData[key] = { error: String(err) };
                }
            }
        }

        const buffer = Buffer.from(JSON.stringify(backupData, null, 2), 'utf-8');
        const fileName = `backup_${timestamp}.json`;

        // Upload to Supabase Storage
        console.log(`[BACKUP] Uploading ${fileName} to 'backups' bucket...`);

        // Ensure bucket exists (optional, might fail if no permissions to create buckets)
        // Note: It's better to create the bucket manually in Supabase dashboard to ensure public/private settings are correct.
        // We will assume 'backups' bucket exists.

        const { data, error } = await supabase.storage
            .from('backups')
            .upload(fileName, buffer, {
                contentType: 'application/json',
                upsert: false
            });

        if (error) {
            console.error('[BACKUP] Supabase upload failed:', error);
            throw error;
        }

        console.log('[BACKUP] Backup completed successfully:', data);

        return res.status(200).json({
            success: true,
            message: 'Backup created successfully',
            file: data.path,
            size: buffer.length
        });

    } catch (error) {
        console.error('[BACKUP] Critical error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        });
    }
}
