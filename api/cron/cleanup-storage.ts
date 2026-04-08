import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../server/db.js';
import * as schema from '../../shared/schema.js';
import { supabase } from '../../server/supabase.js';
import { lt } from 'drizzle-orm';

/**
 * Vercel Cron Job Handler for Data Retention & Cleanup
 * 
 * Policy:
 * 1. Storage: Delete all files older than 30 days in 'backups', 'uploads', and 'media' buckets.
 * 2. Database: Delete 'daily_updates' and 'notifications' older than 30 days.
 * 3. Keep: 'student_gate_logs' and 'visitor_logs' database records (as per user request).
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
        console.log('[CLEANUP] Starting storage and database cleanup...');
        const retentionDays = 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        
        const results: any = {
            storage: {},
            database: {}
        };

        // --- 1. Storage Cleanup ---
        
        /**
         * Helper to list and delete old files in a bucket/folder
         */
        const cleanupBucket = async (bucket: string, folder: string = '') => {
            console.log(`[CLEANUP] Processing bucket: ${bucket}, folder: ${folder}`);
            
            // List files in the folder
            const { data: files, error } = await supabase.storage
                .from(bucket)
                .list(folder, {
                    limit: 1000,
                    sortBy: { column: 'created_at', order: 'asc' }
                });

            if (error) {
                console.error(`[CLEANUP] Error listing ${bucket}/${folder}:`, error);
                return { error: error.message };
            }

            if (!files || files.length === 0) return { deleted: 0, message: 'No files found' };

            const toDelete = files.filter(f => {
                // Skip folders (they don't have created_at in 'list' result usually, or metadata is different)
                if (!f.created_at) return false;
                const createdAt = new Date(f.created_at);
                return createdAt < cutoffDate;
            });

            if (toDelete.length === 0) return { deleted: 0, message: 'No old files found' };

            const pathsToDelete = toDelete.map(f => folder ? `${folder}/${f.name}` : f.name);
            
            console.log(`[CLEANUP] Deleting ${pathsToDelete.length} files from ${bucket}...`);
            const { error: deleteError } = await supabase.storage
                .from(bucket)
                .remove(pathsToDelete);

            if (deleteError) {
                console.error(`[CLEANUP] Error deleting from ${bucket}:`, deleteError);
                return { error: deleteError.message };
            }

            return { deleted: pathsToDelete.length };
        };

        // Prune Backups (Backups have no folders)
        results.storage.backups = await cleanupBucket('backups');
        results.storage.backupsPayments = await cleanupBucket('backups', 'payments');

        // Prune Uploads (Updates) - Handled recursively or for specific org folders if needed
        // For now, we list the root of 'uploads' to find org folders
        const { data: orgFolders } = await supabase.storage.from('uploads').list('', { limit: 100 });
        if (orgFolders) {
            results.storage.uploads = { deleted: 0 };
            for (const folder of orgFolders) {
                if (folder.id === null) { // It's a folder
                    const res = await cleanupBucket('uploads', `updates/${folder.name}`);
                    if (res.deleted) results.storage.uploads.deleted += res.deleted;
                }
            }
        }

        // Prune Media (Gate Logs & Visitors)
        results.storage.mediaGateLogs = await cleanupBucket('media', 'public/gate_logs');
        results.storage.mediaVisitors = await cleanupBucket('media', 'public/visitors');

        // --- 2. Database Cleanup ---

        // Prune Notifications
        console.log('[CLEANUP] Pruning old notifications...');
        const deletedNotifications = await db.delete(schema.notifications)
            .where(lt(schema.notifications.createdAt, cutoffDate))
            .returning({ id: schema.notifications.id });
        results.database.notifications = { deleted: deletedNotifications.length };

        // Prune Daily Updates (Media links will be broken anyway)
        console.log('[CLEANUP] Pruning old daily updates...');
        const deletedUpdates = await db.delete(schema.dailyUpdates)
            .where(lt(schema.dailyUpdates.postedAt, cutoffDate))
            .returning({ id: schema.dailyUpdates.id });
        results.database.dailyUpdates = { deleted: deletedUpdates.length };

        console.log('[CLEANUP] Cleanup completed successfully:', results);

        return res.status(200).json({
            success: true,
            retentionDays,
            cutoffDate: cutoffDate.toISOString(),
            results
        });

    } catch (error) {
        console.error('[CLEANUP] Critical error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        });
    }
}
