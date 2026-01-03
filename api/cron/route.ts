import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../server/db.js';
import * as schema from '../../shared/schema.js';
import logger from '../../server/config/logger.js';

/**
 * Vercel Cron Job Handler
 * 
 * This serverless function is triggered by Vercel's cron scheduler
 * to run daily daycare management tasks including:
 * - Enrollment expiration checks
 * - Overdue follow-up notifications
 * 
 * Schedule: "30 3 * * *" (9:00 AM IST / 3:30 AM UTC)
 * 
 * Authorization: Requires Bearer token matching CRON_SECRET env variable
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify authorization
    const authHeader = req.headers.authorization;
    const expectedSecret = process.env.CRON_SECRET;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('[CRON] Unauthorized attempt - missing or invalid Authorization header');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (token !== expectedSecret) {
        logger.warn('[CRON] Unauthorized attempt - invalid token');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        logger.info('[CRON] Starting daily daycare checks...');

        // Import daycare storage functions
        const { daycareStorage } = await import('../../server/storage.js');

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

        // Return success response
        return res.status(200).json({
            ok: true,
            summary: {
                enrollmentsExpiringTomorrow: expirationResult.expiring,
                expiredEnrollments: expirationResult.expired,
                overdueFollowups: overdueFollowups.length,
                notificationsCreated: expirationResult.notifications + overdueNotifications
            }
        });

    } catch (error) {
        logger.error('[CRON] Error during daily daycare checks:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
