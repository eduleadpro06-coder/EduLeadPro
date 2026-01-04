import { eq, and } from 'drizzle-orm';

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
