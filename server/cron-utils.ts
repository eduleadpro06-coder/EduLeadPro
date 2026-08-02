import { eq, and, isNull } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function checkPaymentDuesAndNotify(db: any, schema: any, storage: any, logger: any) {
    try {
        const now = new Date();
        // Use Asia/Kolkata time zone for consistency
        const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        logger.info(`[CRON] Checking payments due on ${todayStr}`);

        const dueEmis = await db.select({
            id: schema.emiSchedule.id,
            amount: schema.emiSchedule.amount,
            studentId: schema.emiSchedule.studentId,
            dueDate: schema.emiSchedule.dueDate,
            studentName: schema.leads.name,
            counselorId: schema.leads.counselorId,
            organizationId: schema.leads.organizationId
        })
            .from(schema.emiSchedule)
            .innerJoin(schema.leads, eq(schema.emiSchedule.studentId, schema.leads.id))
            .where(and(
                eq(schema.emiSchedule.status, 'pending'),
                eq(schema.emiSchedule.dueDate, todayStr)
            ));

        logger.info(`[CRON] Found ${dueEmis.length} payments due today`);

        let notificationCount = 0;
        for (const emi of dueEmis) {
            let userIdToNotify: number | null = null;
            if (emi.counselorId) {
                // Find user by staff email
                const staffMember = await storage.getStaff(emi.counselorId);
                if (staffMember && staffMember.email) {
                    const user = await storage.getUserByEmail(staffMember.email);
                    if (user) userIdToNotify = user.id;
                }
            }

            if (userIdToNotify) {
                try {
                    await storage.createNotification({
                        userId: userIdToNotify,
                        type: 'payment',
                        title: 'Payment Due Today',
                        message: `EMI of ₹${emi.amount} for Student ${emi.studentName} is due today (${emi.dueDate}).`,
                        priority: 'high',
                        actionType: 'view_student_fees',
                        actionId: emi.studentId.toString(),
                        read: false
                    });
                    notificationCount++;
                } catch (notifyError) {
                    logger.error(`[CRON] Failed to create notification for student ${emi.studentId}:`, notifyError);
                }
            } else {
                logger.warn(`[CRON] Could not find user to notify for payment due. Student: ${emi.studentName}`);
            }
        }

        return notificationCount;

    } catch (error) {
        logger.error('[CRON] Error in checkPaymentDuesAndNotify:', error);
        throw error;
    }
}

/**
 * Birthday Notification Cron
 * Runs daily. Finds all leads whose date_of_birth matches today (same month+day).
 * Notifies: assigned counselor + all principals/directors in the same org.
 * Channels: web app notifications table + mobile app mobile_notifications table (Supabase).
 */
export async function checkBirthdaysAndNotify(db: any, schema: any, storage: any, logger: any) {
    try {
        const now = new Date();
        const todayMonth = now.toLocaleString('en-US', { month: '2-digit', timeZone: 'Asia/Kolkata' });
        const todayDay = now.toLocaleString('en-US', { day: '2-digit', timeZone: 'Asia/Kolkata' });

        logger.info(`[CRON-BIRTHDAY] Checking birthdays for month=${todayMonth}, day=${todayDay}`);

        // Find leads whose date_of_birth month and day match today (year-agnostic)
        const birthdayLeads = await db.execute(
            sql`SELECT id, name, date_of_birth, counselor_id, organization_id
                FROM leads
                WHERE date_of_birth IS NOT NULL
                  AND deleted_at IS NULL
                  AND EXTRACT(MONTH FROM date_of_birth) = ${parseInt(todayMonth)}
                  AND EXTRACT(DAY FROM date_of_birth) = ${parseInt(todayDay)}`
        );

        const leads = birthdayLeads.rows || birthdayLeads || [];
        logger.info(`[CRON-BIRTHDAY] Found ${leads.length} birthday student(s) today`);

        if (leads.length === 0) return 0;

        // Set up Supabase client for mobile_notifications
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

        let notificationCount = 0;

        for (const lead of leads) {
            const studentName = lead.name;
            const orgId = lead.organization_id;
            const counselorStaffId = lead.counselor_id;
            const leadId = lead.id;

            const title = `🎂 Birthday Today!`;
            const message = `${studentName}'s birthday is today! Wish them well.`;

            // Collect all user IDs to notify
            const userIdsToNotify: Set<number> = new Set();

            // 1. Assigned counselor (teacher)
            if (counselorStaffId) {
                try {
                    const staffMember = await storage.getStaff(counselorStaffId);
                    if (staffMember?.email) {
                        const user = await storage.getUserByEmail(staffMember.email);
                        if (user) userIdsToNotify.add(user.id);
                    }
                } catch (e) {
                    logger.warn(`[CRON-BIRTHDAY] Could not find counselor user for staffId=${counselorStaffId}`);
                }
            }

            // 2. All principals and directors in the org
            if (orgId) {
                try {
                    const adminStaff = await db.execute(
                        sql`SELECT email FROM staff
                            WHERE organization_id = ${orgId}
                              AND is_active = true
                              AND LOWER(role) IN ('principal', 'director', 'admin')`
                    );
                    const adminRows = adminStaff.rows || adminStaff || [];
                    for (const admin of adminRows) {
                        if (admin.email) {
                            const user = await storage.getUserByEmail(admin.email);
                            if (user) userIdsToNotify.add(user.id);
                        }
                    }
                } catch (e) {
                    logger.warn(`[CRON-BIRTHDAY] Could not fetch admin staff for orgId=${orgId}`);
                }
            }

            logger.info(`[CRON-BIRTHDAY] Notifying ${userIdsToNotify.size} user(s) for ${studentName}'s birthday`);

            for (const userId of userIdsToNotify) {
                try {
                    // Web app notification (bell icon)
                    await storage.createNotification({
                        userId,
                        type: 'birthday',
                        title,
                        message,
                        priority: 'medium',
                        actionType: 'view_lead',
                        actionId: leadId.toString(),
                        read: false
                    });

                    // Mobile app notification (Supabase mobile_notifications)
                    if (supabase) {
                        await supabase.from('mobile_notifications').insert({
                            user_id: userId,
                            notification_type: 'birthday',
                            title,
                            body: message,
                            sent_at: new Date().toISOString(),
                            read_at: null,
                            delivered: false
                        });
                    }

                    notificationCount++;
                } catch (err) {
                    logger.error(`[CRON-BIRTHDAY] Failed to send notification to userId=${userId}:`, err);
                }
            }
        }

        logger.info(`[CRON-BIRTHDAY] Sent ${notificationCount} birthday notification(s)`);
        return notificationCount;

    } catch (error) {
        logger.error('[CRON-BIRTHDAY] Error in checkBirthdaysAndNotify:', error);
        throw error;
    }
}
