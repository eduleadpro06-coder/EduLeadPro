import cron from 'node-cron';
import { daycareStorage, storage } from './storage.js';
import logger from './config/logger.js';
import { db } from './db.js';
import * as schema from '../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { checkPaymentDuesAndNotify } from './cron-utils.js';

/**
 * Cron Jobs
 * Automated scheduled tasks for the application
 */
export function initializeCronJobs() {
    // 1. Daycare Cron Jobs
    // Run enrollment expiration and overdue follow-up checks daily at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
        try {
            logger.info('[CRON] Running daily daycare checks...');

            // 1. Check enrollment expirations
            const expirationResult = await daycareStorage.checkEnrollmentExpirations();

            logger.info('[CRON] Enrollment expiration check completed', {
                expiring: expirationResult.expiring,
                expired: expirationResult.expired,
                notifications: expirationResult.notifications
            });

            // 2. Check for overdue follow-ups
            const overdueFollowups = await daycareStorage.getOverdueFollowups();

            logger.info('[CRON] Overdue follow-ups check completed', {
                count: overdueFollowups.length
            });

            // Create notifications for overdue follow-ups
            let overdueNotifications = 0;
            for (const followup of overdueFollowups) {
                try {
                    // Get the inquiry details
                    const inquiry = await daycareStorage.getDaycareInquiry(followup.inquiryId);

                    if (inquiry) {
                        await db.insert(schema.notifications).values({
                            userId: followup.assignedTo || 1,
                            type: 'daycare',
                            title: 'Overdue Daycare Follow-up',
                            message: `Follow-up for ${inquiry.parentName} (${inquiry.childName}) was scheduled for ${new Date(followup.scheduledAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })} and is now overdue.`,
                            priority: 'high',
                            actionType: 'view_daycare_inquiry',
                            actionId: inquiry.id.toString()
                        });
                        overdueNotifications++;
                    }
                } catch (error) {
                    logger.error('[CRON] Error creating notification for overdue follow-up:', error);
                }
            }

            logger.info(`[CRON] Created ${overdueNotifications} notifications for overdue follow-ups`);

            // Log summary
            const totalIssues = expirationResult.expiring + expirationResult.expired + overdueFollowups.length;
            if (totalIssues > 0) {
                logger.warn(`[CRON] Summary: ${expirationResult.expiring} enrollments expiring tomorrow, ${expirationResult.expired} expired enrollments, ${overdueFollowups.length} overdue follow-ups`);
            } else {
                logger.info('[CRON] All clear - no expiring enrollments or overdue follow-ups');
            }
        } catch (error) {
            logger.error('[CRON] Error during daily daycare checks:', error);
        }
    }, {
        timezone: "Asia/Kolkata" // Indian timezone
    });

    // 2. Payment Due Notification Cron
    // Run daily at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
        try {
            logger.info('[CRON] Running daily payment due checks...');

            const notificationCount = await checkPaymentDuesAndNotify(db, schema, storage, logger);

            logger.info(`[CRON] Created ${notificationCount} payment notifications`);

        } catch (error) {
            logger.error('[CRON] Error checking payment dues:', error);
        }
    }, {
        timezone: "Asia/Kolkata"
    });

    // 3. Automated Payment Backup Cron
    // Run daily at 2:00 AM IST to backup all financial records
    cron.schedule('0 2 * * *', async () => {
        try {
            logger.info('[CRON] Starting automated payment backup...');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupData: Record<string, any> = {};

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
                if (table) {
                    try {
                        const records = await db.select().from(table);
                        backupData[tableName] = records;
                        tableCount++;
                    } catch (err) {
                        logger.error(`[CRON] Failed to dump ${tableName}:`, err);
                    }
                }
            }

            const buffer = Buffer.from(JSON.stringify(backupData, null, 2), 'utf-8');
            const fileName = `payments/backup_payments_${timestamp}.json`;

            // Import supabase dynamically to avoid top-level dependency if not initialized
            const { supabase } = await import('./supabase.js');

            const { data, error } = await supabase.storage
                .from('backups')
                .upload(fileName, buffer, {
                    contentType: 'application/json',
                    upsert: false
                });

            if (error) {
                logger.error('[CRON] Payment backup upload failed:', error);
            } else {
                logger.info(`[CRON] Payment backup successful: ${data.path} (${tableCount} tables)`);
            }

        } catch (error) {
            logger.error('[CRON] Error in payment backup cron:', error);
        }
    }, {
        timezone: "Asia/Kolkata"
    });

    // 4. Automated Storage & Data Cleanup Cron
    // Run daily at 3:00 AM IST to prune files/data older than 30 days
    cron.schedule('0 3 * * *', async () => {
        try {
            logger.info('[CRON] Starting automated storage cleanup...');
            const retentionDays = 30;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

            // Import supabase dynamically
            const { supabase } = await import('./supabase.js');

            // 1. Storage Cleanup Helper
            const cleanupBucket = async (bucket: string, folder: string = '') => {
                const { data: files } = await supabase.storage.from(bucket).list(folder, { limit: 1000 });
                if (!files || files.length === 0) return 0;

                const toDelete = files.filter(f => f.created_at && new Date(f.created_at) < cutoffDate);
                if (toDelete.length === 0) return 0;

                const paths = toDelete.map(f => folder ? `${folder}/${f.name}` : f.name);
                const { error } = await supabase.storage.from(bucket).remove(paths);
                
                if (error) logger.error(`[CRON] Error cleaning ${bucket}/${folder}:`, error);
                return paths.length;
            };

            // Cleanup storage
            const backupsDeleted = await cleanupBucket('backups');
            const paymentBackupsDeleted = await cleanupBucket('backups', 'payments');
            
            // Cleanup updates (per org)
            let updatesDeleted = 0;
            const { data: orgFolders } = await supabase.storage.from('uploads').list('', { limit: 100 });
            if (orgFolders) {
                for (const org of orgFolders) {
                    if (org.id === null) updatesDeleted += await cleanupBucket('uploads', `updates/${org.name}`);
                }
            }

            const gateLogsMediaDeleted = await cleanupBucket('media', 'public/gate_logs');
            const visitorsMediaDeleted = await cleanupBucket('media', 'public/visitors');

            // 2. Database Cleanup
            const delNotifications = await db.delete(schema.notifications).where(lt(schema.notifications.createdAt, cutoffDate)).returning();
            const delUpdates = await db.delete(schema.dailyUpdates).where(lt(schema.dailyUpdates.postedAt, cutoffDate)).returning();

            logger.info(`[CRON] Cleanup successful: ${backupsDeleted + paymentBackupsDeleted} backups, ${updatesDeleted} updates, ${gateLogsMediaDeleted + visitorsMediaDeleted} media, ${delNotifications.length} notifications, ${delUpdates.length} updates removed.`);

        } catch (error) {
            logger.error('[CRON] Error in cleanup cron:', error);
        }
    }, {
        timezone: "Asia/Kolkata"
    });

    logger.info('[CRON] Cron jobs initialized - Daily checks scheduled (Daycare & Payments: 9:00 AM IST, Backup: 2:00 AM IST, Cleanup: 3:00 AM IST)');
}
