import 'dotenv/config';
import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';
import { supabase } from '../server/supabase.js';
import { lt } from 'drizzle-orm';

async function runCleanup() {
    console.log('[TEST] Starting manual storage and data cleanup...');
    const retentionDays = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    console.log(`[TEST] Cutoff Date: ${cutoffDate.toISOString()}`);

    try {
        // 1. Storage Cleanup Helper
        const cleanupBucket = async (bucket: string, folder: string = '') => {
            console.log(`[TEST] Checking ${bucket}/${folder}...`);
            const { data: files, error: listError } = await supabase.storage
                .from(bucket)
                .list(folder, { limit: 1000 });

            if (listError) {
                console.error(`[TEST] Error listing ${bucket}/${folder}:`, listError);
                return 0;
            }

            if (!files || files.length === 0) return 0;

            const toDelete = files.filter(f => f.created_at && new Date(f.created_at) < cutoffDate);
            if (toDelete.length === 0) {
                console.log(`[TEST] No files to delete in ${bucket}/${folder}.`);
                return 0;
            }

            const paths = toDelete.map(f => folder ? `${folder}/${f.name}` : f.name);
            console.log(`[TEST] Deleting ${paths.length} files from ${bucket}/${folder}...`);
            
            const { error: delError } = await supabase.storage
                .from(bucket)
                .remove(paths);

            if (delError) {
                console.error(`[TEST] Error deleting from ${bucket}/${folder}:`, delError);
                return 0;
            }

            return paths.length;
        };

        // --- Execute Storage Cleanup ---
        console.log('\n--- Storage Cleanup ---');
        const backupsDeleted = await cleanupBucket('backups');
        const paymentBackupsDeleted = await cleanupBucket('backups', 'payments');
        
        let updatesMediaDeleted = 0;
        const { data: orgFolders } = await supabase.storage.from('uploads').list('', { limit: 100 });
        if (orgFolders) {
            for (const org of orgFolders) {
                if (org.id === null) {
                    updatesMediaDeleted += await cleanupBucket('uploads', `updates/${org.name}`);
                }
            }
        }

        const gateMediaDeleted = await cleanupBucket('media', 'public/gate_logs');
        const visitorMediaDeleted = await cleanupBucket('media', 'public/visitors');

        // --- Execute Database Cleanup ---
        console.log('\n--- Database Cleanup ---');
        
        console.log('[TEST] Pruning old notifications...');
        const delNotifications = await db.delete(schema.notifications)
            .where(lt(schema.notifications.createdAt, cutoffDate))
            .returning();
        
        console.log('[TEST] Pruning old daily updates...');
        const delUpdates = await db.delete(schema.dailyUpdates)
            .where(lt(schema.dailyUpdates.postedAt, cutoffDate))
            .returning();

        console.log('\n--- Cleanup Summary ---');
        console.log(`Files Deleted:`);
        console.log(` - Backups: ${backupsDeleted + paymentBackupsDeleted}`);
        console.log(` - Activity Media: ${updatesMediaDeleted}`);
        console.log(` - Gate/Visitor Media: ${gateMediaDeleted + visitorMediaDeleted}`);
        console.log(`DB Records Deleted:`);
        console.log(` - Notifications: ${delNotifications.length}`);
        console.log(` - Daily Updates: ${delUpdates.length}`);
        console.log(`\nNOTE: Gate logs and Visitor logs database records were KEPT as requested.`);

    } catch (error) {
        console.error('[TEST] Cleanup error:', error);
    }

    process.exit(0);
}

runCleanup();
