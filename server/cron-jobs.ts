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
                            message: `Follow-up for ${inquiry.parentName} (${inquiry.childName}) was scheduled for ${new Date(followup.scheduledAt).toLocaleDateString()} and is now overdue.`,
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

    logger.info('[CRON] Cron jobs initialized - Daily checks scheduled (Daycare & Payments: 9:00 AM IST)');
}
