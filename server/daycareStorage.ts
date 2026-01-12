import { eq, and, gte, lte, desc, sql, isNull, or, asc, type SQL } from "drizzle-orm";
import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { cacheService } from "./cache-service.js";
import type {
    DaycareChild, InsertDaycareChild,
    DaycareInquiry, InsertDaycareInquiry,
    DaycareInquiryFollowup, InsertDaycareInquiryFollowup,
    DaycareBillingConfig, InsertDaycareBillingConfig,
    DaycareEnrollment, InsertDaycareEnrollment,
    DaycareAttendance, InsertDaycareAttendance,
    DaycarePayment, InsertDaycarePayment,
    DaycareChildWithEnrollment,
    DaycareEnrollmentWithChild,
    DaycareInquiryWithFollowups
} from "../shared/schema.js";

/**
 * Daycare Storage - Complete CRUD operations for Daycare Management Module
 * This is a standalone module independent from student/lead management
 */
export class DaycareStorage {

    // ==========================================
    // CHILDREN MANAGEMENT
    // ==========================================

    async getAllDaycareChildren(includeDeleted = false, organizationId?: number): Promise<DaycareChild[]> {
        const conditions = [];

        if (!includeDeleted) {
            conditions.push(isNull(schema.daycareChildren.deletedAt));
        }

        if (organizationId) {
            conditions.push(eq(schema.daycareChildren.organizationId, organizationId));
        }

        let query = db.select().from(schema.daycareChildren);

        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
        }

        return (await query).sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    async getDaycareChild(id: number): Promise<DaycareChild | undefined> {
        const result = await db.select().from(schema.daycareChildren)
            .where(eq(schema.daycareChildren.id, id));
        return result[0];
    }

    async getDaycareChildByPhone(phone: string): Promise<DaycareChild | undefined> {
        const result = await db.select().from(schema.daycareChildren)
            .where(eq(schema.daycareChildren.parentPhone, phone))
            .limit(1);
        return result[0];
    }

    async createDaycareChild(child: InsertDaycareChild): Promise<DaycareChild> {
        // Generate unique child ID
        const childId = await this.generateChildId();

        const result = await db.insert(schema.daycareChildren)
            .values({ ...child, childId })
            .returning();
        return result[0];
    }

    async updateDaycareChild(id: number, updates: Partial<DaycareChild>): Promise<DaycareChild | undefined> {
        const result = await db.update(schema.daycareChildren)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(schema.daycareChildren.id, id))
            .returning();
        return result[0];
    }

    async deleteDaycareChild(id: number): Promise<boolean> {
        // Soft delete
        const result = await db.update(schema.daycareChildren)
            .set({ deletedAt: new Date() })
            .where(eq(schema.daycareChildren.id, id))
            .returning();
        return result.length > 0;
    }

    async searchDaycareChildren(query: string, organizationId?: number): Promise<DaycareChild[]> {
        const searchPattern = `%${query}%`;
        const conditions = [
            isNull(schema.daycareChildren.deletedAt),
            or(
                sql`${schema.daycareChildren.childName} ILIKE ${searchPattern}`,
                sql`${schema.daycareChildren.parentName} ILIKE ${searchPattern}`,
                sql`${schema.daycareChildren.parentPhone} ILIKE ${searchPattern}`
            )
        ];

        if (organizationId) {
            conditions.push(eq(schema.daycareChildren.organizationId, organizationId));
        }

        const result = await db.select().from(schema.daycareChildren)
            .where(and(...conditions));
        return result;
    }

    async getActiveDaycareChildren(organizationId?: number): Promise<DaycareChild[]> {
        const conditions = [
            eq(schema.daycareChildren.status, "active"),
            isNull(schema.daycareChildren.deletedAt)
        ];

        if (organizationId) {
            conditions.push(eq(schema.daycareChildren.organizationId, organizationId));
        }

        const result = await db.select().from(schema.daycareChildren)
            .where(and(...conditions))
            .orderBy(schema.daycareChildren.childName);
        return result;
    }

    // ==========================================
    // INQUIRY MANAGEMENT
    // ==========================================

    async getAllDaycareInquiries(organizationId?: number): Promise<DaycareInquiry[]> {
        if (organizationId) {
            return await db.select().from(schema.daycareInquiries)
                .where(eq(schema.daycareInquiries.organizationId, organizationId))
                .orderBy(desc(schema.daycareInquiries.createdAt));
        }
        return await db.select().from(schema.daycareInquiries)
            .orderBy(desc(schema.daycareInquiries.createdAt));
    }

    async getDaycareInquiry(id: number): Promise<DaycareInquiry | undefined> {
        const result = await db.select().from(schema.daycareInquiries)
            .where(eq(schema.daycareInquiries.id, id));
        return result[0];
    }

    async createDaycareInquiry(inquiry: InsertDaycareInquiry): Promise<DaycareInquiry> {
        const inquiryNumber = await this.generateInquiryNumber();

        const result = await db.insert(schema.daycareInquiries)
            .values({ ...inquiry, inquiryNumber })
            .returning();
        return result[0];
    }

    async updateDaycareInquiry(id: number, updates: Partial<DaycareInquiry>): Promise<DaycareInquiry | undefined> {
        const result = await db.update(schema.daycareInquiries)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(schema.daycareInquiries.id, id))
            .returning();
        return result[0];
    }

    async updateDaycareInquiryStatus(id: number, status: string): Promise<DaycareInquiry | undefined> {
        return await this.updateDaycareInquiry(id, { status });
    }

    async assignInquiry(id: number, userId: number): Promise<DaycareInquiry | undefined> {
        return await this.updateDaycareInquiry(id, { assignedTo: userId });
    }

    async getInquiriesByStatus(status: string, organizationId?: number): Promise<DaycareInquiry[]> {
        if (organizationId) {
            return await db.select().from(schema.daycareInquiries)
                .where(and(
                    eq(schema.daycareInquiries.status, status),
                    eq(schema.daycareInquiries.organizationId, organizationId)
                ))
                .orderBy(desc(schema.daycareInquiries.createdAt));
        }
        return await db.select().from(schema.daycareInquiries)
            .where(eq(schema.daycareInquiries.status, status))
            .orderBy(desc(schema.daycareInquiries.createdAt));
    }

    async getMyInquiries(userId: number): Promise<DaycareInquiry[]> {
        return await db.select().from(schema.daycareInquiries)
            .where(eq(schema.daycareInquiries.assignedTo, userId))
            .orderBy(desc(schema.daycareInquiries.createdAt));
    }

    async convertInquiryToEnrollment(inquiryId: number, childData: InsertDaycareChild): Promise<{ child: DaycareChild; enrollment: DaycareEnrollment }> {
        // Create child from inquiry
        const child = await this.createDaycareChild(childData);

        // Create enrollment
        const enrollmentNumber = await this.generateEnrollmentNumber();
        const enrollment = await db.insert(schema.daycareEnrollments)
            .values({
                childId: child.id,
                enrollmentNumber,
                enrollmentDate: new Date(),
                startDate: new Date(),
                status: "active"
            } as any)
            .returning();

        // Update inquiry status
        await this.updateDaycareInquiryStatus(inquiryId, "enrolled");

        return { child, enrollment: enrollment[0] };
    }

    // ==========================================
    // INQUIRY FOLLOW-UPS
    // ==========================================

    async createInquiryFollowup(followup: InsertDaycareInquiryFollowup): Promise<DaycareInquiryFollowup> {
        const result = await db.insert(schema.daycareInquiryFollowups)
            .values(followup)
            .returning();
        return result[0];
    }

    async getFollowupsByInquiry(inquiryId: number): Promise<DaycareInquiryFollowup[]> {
        return await db.select().from(schema.daycareInquiryFollowups)
            .where(eq(schema.daycareInquiryFollowups.inquiryId, inquiryId))
            .orderBy(desc(schema.daycareInquiryFollowups.scheduledAt));
    }

    async getOverdueFollowups(organizationId?: number): Promise<DaycareInquiryFollowup[]> {
        const now = new Date();
        const conditions: SQL[] = [
            eq(schema.daycareInquiryFollowups.status, "pending"),
            sql`${schema.daycareInquiryFollowups.scheduledAt} < ${now.toISOString()}`
        ];

        if (organizationId) {
            conditions.push(eq(schema.daycareInquiries.organizationId, organizationId));
        }

        const result = await db.select()
            .from(schema.daycareInquiryFollowups)
            .leftJoin(schema.daycareInquiries, eq(schema.daycareInquiryFollowups.inquiryId, schema.daycareInquiries.id))
            .where(and(...conditions))
            .orderBy(schema.daycareInquiryFollowups.scheduledAt);

        return result.map(row => row.daycare_inquiry_followups);
    }

    async getTodayFollowups(organizationId?: number): Promise<DaycareInquiryFollowup[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const conditions: SQL[] = [
            eq(schema.daycareInquiryFollowups.status, "pending"),
            gte(schema.daycareInquiryFollowups.scheduledAt, today),
            sql`${schema.daycareInquiryFollowups.scheduledAt} < ${tomorrow.toISOString()}`
        ];

        if (organizationId) {
            conditions.push(eq(schema.daycareInquiries.organizationId, organizationId));
        }

        const result = await db.select()
            .from(schema.daycareInquiryFollowups)
            .leftJoin(schema.daycareInquiries, eq(schema.daycareInquiryFollowups.inquiryId, schema.daycareInquiries.id))
            .where(and(...conditions))
            .orderBy(schema.daycareInquiryFollowups.scheduledAt);

        return result.map(row => row.daycare_inquiry_followups);
    }

    async completeFollowup(id: number, outcome: string, notes: string, userId: number): Promise<DaycareInquiryFollowup | undefined> {
        const result = await db.update(schema.daycareInquiryFollowups)
            .set({
                status: "completed",
                completedAt: new Date(),
                outcome,
                notes,
                completedBy: userId,
                updatedAt: new Date()
            })
            .where(eq(schema.daycareInquiryFollowups.id, id))
            .returning();
        return result[0];
    }

    // ==========================================
    // ENROLLMENT MANAGEMENT
    // ==========================================

    async getAllDaycareEnrollments(includeInactive = false, organizationId?: number): Promise<DaycareEnrollment[]> {
        const conditions: SQL[] = [isNull(schema.daycareEnrollments.deletedAt)];

        if (!includeInactive) {
            conditions.push(eq(schema.daycareEnrollments.status, "active"));
        }

        if (organizationId) {
            conditions.push(eq(schema.daycareEnrollments.organizationId, organizationId));
        }

        return await db.select()
            .from(schema.daycareEnrollments)
            .where(and(...conditions))
            .orderBy(desc(schema.daycareEnrollments.createdAt));
    }

    async getDaycareEnrollment(id: number): Promise<DaycareEnrollment | undefined> {
        const result = await db.select().from(schema.daycareEnrollments)
            .where(eq(schema.daycareEnrollments.id, id));
        return result[0];
    }

    async getEnrollmentsByChild(childId: number): Promise<DaycareEnrollment[]> {
        return await db.select().from(schema.daycareEnrollments)
            .where(eq(schema.daycareEnrollments.childId, childId))
            .orderBy(desc(schema.daycareEnrollments.createdAt));
    }

    async createEnrollment(enrollment: InsertDaycareEnrollment): Promise<DaycareEnrollment> {
        const enrollmentNumber = await this.generateEnrollmentNumber();

        const result = await db.insert(schema.daycareEnrollments)
            .values({
                ...enrollment,
                enrollmentNumber,
                enrollmentDate: new Date().toISOString().split('T')[0]
            })
            .returning();

        // Invalidate dashboard cache
        cacheService.clearAll();
        return result[0];
    }

    async updateEnrollment(id: number, updates: Partial<DaycareEnrollment>): Promise<DaycareEnrollment | undefined> {
        const result = await db.update(schema.daycareEnrollments)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(schema.daycareEnrollments.id, id))
            .returning();
        return result[0];
    }

    async deleteEnrollment(id: number): Promise<boolean> {
        const result = await db.update(schema.daycareEnrollments)
            .set({ deletedAt: new Date() })
            .where(eq(schema.daycareEnrollments.id, id))
            .returning();
        return result.length > 0;
    }

    async pauseEnrollment(id: number, reason: string): Promise<DaycareEnrollment | undefined> {
        return await this.updateEnrollment(id, {
            status: "paused",
            notes: reason
        });
    }

    async deactivateEnrollment(id: number): Promise<DaycareEnrollment | undefined> {
        return this.updateEnrollment(id, { status: "cancelled" });
    }

    async cancelEnrollment(id: number, reason: string): Promise<DaycareEnrollment | undefined> {
        return await this.updateEnrollment(id, {
            status: "cancelled",
            endDate: new Date().toISOString().split('T')[0],
            notes: reason
        });
    }

    // NEW: Get enrollments expiring within specified days
    async getExpiringEnrollments(daysAhead: number = 30, organizationId?: number): Promise<DaycareEnrollment[]> {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + daysAhead);

        const todayStr = today.toISOString().split('T')[0];
        const futureDateStr = futureDate.toISOString().split('T')[0];

        const conditions: SQL[] = [
            isNull(schema.daycareEnrollments.deletedAt),
            eq(schema.daycareEnrollments.status, "active"),
            gte(schema.daycareEnrollments.endDate, todayStr),
            lte(schema.daycareEnrollments.endDate, futureDateStr)
        ];

        if (organizationId) {
            conditions.push(eq(schema.daycareEnrollments.organizationId, organizationId));
        }

        return await db.select()
            .from(schema.daycareEnrollments)
            .where(and(...conditions))
            .orderBy(asc(schema.daycareEnrollments.endDate));
    }

    // NEW: Get enrollments that have expired (past end date)
    async getExpiredEnrollments(organizationId?: number): Promise<DaycareEnrollment[]> {
        const today = new Date().toISOString().split('T')[0];

        const conditions: SQL[] = [
            isNull(schema.daycareEnrollments.deletedAt),
            eq(schema.daycareEnrollments.status, "active"),
            lte(schema.daycareEnrollments.endDate, today)
        ];

        if (organizationId) {
            conditions.push(eq(schema.daycareEnrollments.organizationId, organizationId));
        }

        return await db.select()
            .from(schema.daycareEnrollments)
            .where(and(...conditions))
            .orderBy(desc(schema.daycareEnrollments.endDate));
    }

    // NEW: Check enrollment expirations and create notifications
    async checkEnrollmentExpirations(organizationId?: number): Promise<{
        expiring: number;
        expired: number;
        notifications: number;
    }> {
        // Get expiring enrollments (1 day ahead)
        const expiringEnrollments = await this.getExpiringEnrollments(1, organizationId);

        // Get expired enrollments
        const expiredEnrollments = await this.getExpiredEnrollments(organizationId);

        // Auto-update expired enrollments to "expired" status
        for (const enrollment of expiredEnrollments) {
            await this.updateEnrollment(enrollment.id, { status: "expired" });
        }

        // Create notifications for expiring enrollments (within 30 days)
        let notificationCount = 0;
        for (const enrollment of expiringEnrollments) {
            const child = await this.getDaycareChild(enrollment.childId);
            if (child) {
                const daysUntilExpiry = Math.ceil(
                    (new Date(enrollment.endDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );

                await db.insert(schema.notifications).values({
                    userId: 1, // System user
                    type: 'daycare',
                    title: `Daycare Enrollment Expiring Tomorrow`,
                    message: `${child.childName}'s enrollment will expire tomorrow on ${new Date(enrollment.endDate!).toLocaleDateString()}. Please request parent to re-enroll urgently.`,
                    priority: 'high',
                    actionType: 'view_daycare',
                    actionId: enrollment.id.toString()
                });
                notificationCount++;
            }
        }

        // Create notifications for newly expired enrollments
        for (const enrollment of expiredEnrollments) {
            const child = await this.getDaycareChild(enrollment.childId);
            if (child) {
                await db.insert(schema.notifications).values({
                    userId: 1, // System user
                    type: 'daycare',
                    title: `Daycare Enrollment Expired`,
                    message: `${child.childName}'s enrollment has expired. Status changed to "Expired". Please contact parent for re-enrollment.`,
                    priority: 'high',
                    actionType: 'view_daycare',
                    actionId: enrollment.id.toString()
                });
                notificationCount++;
            }
        }

        return {
            expiring: expiringEnrollments.length,
            expired: expiredEnrollments.length,
            notifications: notificationCount
        };
    }

    // ATTENDANCE MANAGEMENT
    // ==========================================

    async checkInChild(enrollmentId: number, checkInTime: Date, userId: number, notes?: string): Promise<DaycareAttendance> {
        const now = new Date();
        const result = await db.insert(schema.daycareAttendance)
            .values({
                enrollmentId,
                attendanceDate: now.toISOString().split('T')[0],
                checkInTime,
                checkedInBy: userId,
                notes
            } as any)
            .returning();
        return result[0];
    }

    async checkOutChild(attendanceId: number, checkOutTime: Date, userId: number): Promise<DaycareAttendance | undefined> {
        // Get attendance record
        const attendance = await db.select().from(schema.daycareAttendance)

        if (!attendance[0]) return undefined;

        // Calculate duration in minutes
        const checkInTime = new Date(attendance[0].checkInTime);
        const durationMinutes = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));

        // Calculate charge based on enrollment billing plan
        const calculatedCharge = await this.calculateAttendanceCharge(
            attendance[0].enrollmentId,
            durationMinutes
        );

        // Determine billing type
        const billingType = this.determineBillingType(durationMinutes);

        const result = await db.update(schema.daycareAttendance)
            .set({
                checkOutTime,
                durationMinutes,
                calculatedCharge: calculatedCharge.toString(),
                billingType,
                checkedOutBy: userId,
                updatedAt: new Date()
            })
            .where(eq(schema.daycareAttendance.id, attendanceId))
            .returning();

        return result[0];
    }

    async getTodayAttendance(organizationId?: number): Promise<DaycareAttendance[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const conditions: SQL[] = [gte(schema.daycareAttendance.attendanceDate, todayStr)];

        if (organizationId) {
            conditions.push(eq(schema.daycareChildren.organizationId, organizationId));
        }

        const result = await db.select()
            .from(schema.daycareAttendance)
            .leftJoin(schema.daycareEnrollments, eq(schema.daycareAttendance.enrollmentId, schema.daycareEnrollments.id))
            .leftJoin(schema.daycareChildren, eq(schema.daycareEnrollments.childId, schema.daycareChildren.id))
            .where(and(...conditions))
            .orderBy(desc(schema.daycareAttendance.checkInTime));

        return result.map(row => row.daycare_attendance);
    }

    async getCurrentlyCheckedIn(organizationId?: number): Promise<DaycareAttendance[]> {
        const conditions: SQL[] = [isNull(schema.daycareAttendance.checkOutTime)];

        if (organizationId) {
            conditions.push(eq(schema.daycareChildren.organizationId, organizationId));
        }

        const result = await db.select()
            .from(schema.daycareAttendance)
            .leftJoin(schema.daycareEnrollments, eq(schema.daycareAttendance.enrollmentId, schema.daycareEnrollments.id))
            .leftJoin(schema.daycareChildren, eq(schema.daycareEnrollments.childId, schema.daycareChildren.id))
            .where(and(...conditions))
            .orderBy(schema.daycareAttendance.checkInTime);

        return result.map(row => row.daycare_attendance);
    }

    async getAttendanceHistory(enrollmentId: number, startDate?: Date, endDate?: Date): Promise<DaycareAttendance[]> {
        const conditions = [eq(schema.daycareAttendance.enrollmentId, enrollmentId)];

        if (startDate) {
            conditions.push(gte(schema.daycareAttendance.attendanceDate, startDate.toISOString().split('T')[0]));
        }

        if (endDate) {
            conditions.push(lte(schema.daycareAttendance.attendanceDate, endDate.toISOString().split('T')[0]));
        }

        const query = db.select().from(schema.daycareAttendance)
            .where(and(...conditions));

        return (await query).sort((a, b) =>
            new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
        );
    }

    async updateAttendanceManual(
        id: number,
        updates: Partial<DaycareAttendance>,
        userId: number,
        reason: string
    ): Promise<DaycareAttendance | undefined> {
        // Recalculate if times changed
        if (updates.checkInTime || updates.checkOutTime) {
            const existing = await db.select().from(schema.daycareAttendance)
                .where(eq(schema.daycareAttendance.id, id));

            if (existing[0]) {
                const checkIn = new Date(updates.checkInTime || existing[0].checkInTime);
                const checkOut = updates.checkOutTime ? new Date(updates.checkOutTime) :
                    existing[0].checkOutTime ? new Date(existing[0].checkOutTime) : null;

                if (checkOut) {
                    const durationMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60));
                    updates.durationMinutes = durationMinutes;
                    updates.billingType = this.determineBillingType(durationMinutes);

                    const charge = await this.calculateAttendanceCharge(existing[0].enrollmentId, durationMinutes);
                    updates.calculatedCharge = charge.toString();
                }
            }
        }

        const result = await db.update(schema.daycareAttendance)
            .set({
                ...updates,
                isManualEdit: true,
                editedBy: userId,
                editReason: reason,
                updatedAt: new Date()
            })
            .where(eq(schema.daycareAttendance.id, id))
            .returning();

        return result[0];
    }

    // ==========================================
    // PAYMENT MANAGEMENT
    // ==========================================

    async createDaycarePayment(payment: InsertDaycarePayment): Promise<DaycarePayment> {
        const paymentNumber = await this.generatePaymentNumber();
        const receiptNumber = await this.generateReceiptNumber();

        const result = await db.insert(schema.daycarePayments)
            .values({ ...payment, paymentNumber, receiptNumber })
            .returning();
        return result[0];
    }

    async getAllDaycarePayments(organizationId?: number): Promise<DaycarePayment[]> {
        const conditions: SQL[] = [];
        if (organizationId) {
            conditions.push(eq(schema.daycareChildren.organizationId, organizationId));
        }

        const result = await db.select()
            .from(schema.daycarePayments)
            .leftJoin(schema.daycareChildren, eq(schema.daycarePayments.childId, schema.daycareChildren.id))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(schema.daycarePayments.paymentDate));

        return result.map(row => row.daycare_payments);
    }

    async getPaymentsByChild(childId: number): Promise<DaycarePayment[]> {
        return await db.select().from(schema.daycarePayments)
            .where(eq(schema.daycarePayments.childId, childId))
            .orderBy(desc(schema.daycarePayments.paymentDate));
    }

    async getPaymentsByDateRange(startDate: Date, endDate: Date, organizationId?: number): Promise<DaycarePayment[]> {
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        const conditions: SQL[] = [
            gte(schema.daycarePayments.paymentDate, startStr),
            lte(schema.daycarePayments.paymentDate, endStr)
        ];

        if (organizationId) {
            conditions.push(eq(schema.daycareChildren.organizationId, organizationId));
        }

        const result = await db.select()
            .from(schema.daycarePayments)
            .leftJoin(schema.daycareChildren, eq(schema.daycarePayments.childId, schema.daycareChildren.id))
            .where(and(...conditions))
            .orderBy(desc(schema.daycarePayments.paymentDate));

        return result.map(row => row.daycare_payments);
    }

    async getPendingPayments(organizationId?: number): Promise<DaycarePayment[]> {
        const conditions: SQL[] = [eq(schema.daycarePayments.status, "pending")];
        if (organizationId) {
            conditions.push(eq(schema.daycareChildren.organizationId, organizationId));
        }

        const result = await db.select()
            .from(schema.daycarePayments)
            .leftJoin(schema.daycareChildren, eq(schema.daycarePayments.childId, schema.daycareChildren.id))
            .where(and(...conditions))
            .orderBy(schema.daycarePayments.paymentDate);

        return result.map(row => row.daycare_payments);
    }

    async recordPayment(
        childId: number,
        amount: number,
        paymentMode: string,
        userId: number,
        paymentType: string,
        enrollmentId?: number,
        status: string = "completed"
    ): Promise<DaycarePayment> {
        const result = await this.createDaycarePayment({
            childId,
            enrollmentId,
            amount: amount.toString(),
            totalAmount: amount.toString(),
            discount: "0",
            lateFee: "0",
            paymentDate: new Date().toISOString().split('T')[0],
            paymentMode,
            paymentType,
            status,
            collectedBy: userId
        } as any);

        // Invalidate dashboard cache
        cacheService.clearAll();
        return result;
    }

    async updatePayment(id: number, updates: Partial<DaycarePayment>): Promise<DaycarePayment | undefined> {
        const result = await db.update(schema.daycarePayments)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(schema.daycarePayments.id, id))
            .returning();

        // Invalidate dashboard cache
        cacheService.clearAll();
        return result[0];
    }

    async deleteDaycarePayment(id: number): Promise<boolean> {
        const result = await db.delete(schema.daycarePayments)
            .where(eq(schema.daycarePayments.id, id))
            .returning();

        // Invalidate dashboard cache
        cacheService.clearAll();
        return result.length > 0;
    }

    // ==========================================
    // BILLING CONFIGURATION
    // ==========================================

    async getBillingConfigs(organizationId?: number): Promise<DaycareBillingConfig[]> {
        if (organizationId) {
            return await db.select().from(schema.daycareBillingConfig)
                .where(eq(schema.daycareBillingConfig.organizationId, organizationId))
                .orderBy(desc(schema.daycareBillingConfig.createdAt));
        }
        return await db.select().from(schema.daycareBillingConfig)
            .orderBy(desc(schema.daycareBillingConfig.createdAt));
    }

    async getActiveBillingConfig(organizationId?: number): Promise<DaycareBillingConfig | undefined> {
        if (organizationId) {
            const result = await db.select().from(schema.daycareBillingConfig)
                .where(and(
                    eq(schema.daycareBillingConfig.isActive, true),
                    eq(schema.daycareBillingConfig.organizationId, organizationId)
                ))
                .limit(1);
            return result[0];
        }
        const result = await db.select().from(schema.daycareBillingConfig)
            .where(eq(schema.daycareBillingConfig.isActive, true))
            .limit(1);
        return result[0];
    }

    async createBillingConfig(config: InsertDaycareBillingConfig): Promise<DaycareBillingConfig> {
        const result = await db.insert(schema.daycareBillingConfig)
            .values(config)
            .returning();
        return result[0];
    }

    async updateBillingConfig(id: number, updates: Partial<DaycareBillingConfig>): Promise<DaycareBillingConfig | undefined> {
        const result = await db.update(schema.daycareBillingConfig)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(schema.daycareBillingConfig.id, id))
            .returning();
        return result[0];
    }

    async setActiveBillingConfig(id: number): Promise<DaycareBillingConfig | undefined> {
        // Deactivate all configs
        await db.update(schema.daycareBillingConfig)
            .set({ isActive: false });

        // Activate the selected one
        return await this.updateBillingConfig(id, { isActive: true });
    }

    // ==========================================
    // ANALYTICS & REPORTS
    // ==========================================

    async getDaycareStats(organizationId?: number): Promise<{
        totalChildren: number;
        activeEnrollments: number;
        newInquiries: number;
        currentlyCheckedIn: number;
        todayRevenue: number;
        monthRevenue: number;
        pendingPayments: number;
    }> {
        // 1. Total Children
        const childrenConditions: SQL[] = [isNull(schema.daycareChildren.deletedAt)];
        if (organizationId) childrenConditions.push(eq(schema.daycareChildren.organizationId, organizationId));

        const totalChildren = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycareChildren)
            .where(and(...childrenConditions));

        // 2. Active Enrollments (Join Children)
        const enrollConditions: SQL[] = [
            eq(schema.daycareEnrollments.status, "active"),
            isNull(schema.daycareEnrollments.deletedAt)
        ];
        if (organizationId) enrollConditions.push(eq(schema.daycareChildren.organizationId, organizationId));

        const activeEnrollments = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycareEnrollments)
            .leftJoin(schema.daycareChildren, eq(schema.daycareEnrollments.childId, schema.daycareChildren.id))
            .where(and(...enrollConditions));

        // 3. New Inquiries
        const inquiryConditions: SQL[] = [eq(schema.daycareInquiries.status, "new")];
        if (organizationId) inquiryConditions.push(eq(schema.daycareInquiries.organizationId, organizationId));

        const newInquiries = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycareInquiries)
            .where(and(...inquiryConditions));

        // 4. Currently Checked In (Join Attendance -> Enrollments -> Children)
        const checkInConditions: SQL[] = [isNull(schema.daycareAttendance.checkOutTime)];
        if (organizationId) checkInConditions.push(eq(schema.daycareChildren.organizationId, organizationId));

        const currentlyCheckedIn = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycareAttendance)
            .leftJoin(schema.daycareEnrollments, eq(schema.daycareAttendance.enrollmentId, schema.daycareEnrollments.id))
            .leftJoin(schema.daycareChildren, eq(schema.daycareEnrollments.childId, schema.daycareChildren.id))
            .where(and(...checkInConditions));

        // 5. & 6. Revenue queries (Join Payments -> Children)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];

        // Today Revenue
        const todayRevConditions: SQL[] = [
            gte(schema.daycarePayments.paymentDate, todayStr),
            eq(schema.daycarePayments.status, "completed")
        ];
        if (organizationId) todayRevConditions.push(eq(schema.daycareChildren.organizationId, organizationId));

        const todayRevenue = await db.select({
            sum: sql<string>`COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0)`
        })
            .from(schema.daycarePayments)
            .leftJoin(schema.daycareChildren, eq(schema.daycarePayments.childId, schema.daycareChildren.id))
            .where(and(...todayRevConditions));

        // Month Revenue
        const monthRevConditions: SQL[] = [
            gte(schema.daycarePayments.paymentDate, firstDayStr),
            eq(schema.daycarePayments.status, "completed")
        ];
        if (organizationId) monthRevConditions.push(eq(schema.daycareChildren.organizationId, organizationId));

        const monthRevenue = await db.select({
            sum: sql<string>`COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0)`
        })
            .from(schema.daycarePayments)
            .leftJoin(schema.daycareChildren, eq(schema.daycarePayments.childId, schema.daycareChildren.id))
            .where(and(...monthRevConditions));

        // 7. Pending Payments (Join Payments -> Children)
        const pendingConditions: SQL[] = [eq(schema.daycarePayments.status, "pending")];
        if (organizationId) pendingConditions.push(eq(schema.daycareChildren.organizationId, organizationId));

        const pendingPayments = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycarePayments)
            .leftJoin(schema.daycareChildren, eq(schema.daycarePayments.childId, schema.daycareChildren.id))
            .where(and(...pendingConditions));

        return {
            totalChildren: totalChildren[0]?.count || 0,
            activeEnrollments: activeEnrollments[0]?.count || 0,
            newInquiries: newInquiries[0]?.count || 0,
            currentlyCheckedIn: currentlyCheckedIn[0]?.count || 0,
            todayRevenue: parseFloat(todayRevenue[0]?.sum || "0"),
            monthRevenue: parseFloat(monthRevenue[0]?.sum || "0"),
            pendingPayments: pendingPayments[0]?.count || 0
        };
    }

    async getMonthlyRevenue(year: number, month: number, organizationId?: number): Promise<number> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        const conditions: SQL[] = [
            gte(schema.daycarePayments.paymentDate, startStr),
            lte(schema.daycarePayments.paymentDate, endStr),
            eq(schema.daycarePayments.status, "completed")
        ];
        if (organizationId) conditions.push(eq(schema.daycareChildren.organizationId, organizationId));

        const result = await db.select({
            sum: sql<string>`COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0)`
        })
            .from(schema.daycarePayments)
            .leftJoin(schema.daycareChildren, eq(schema.daycarePayments.childId, schema.daycareChildren.id))
            .where(and(...conditions));

        return parseFloat(result[0].sum);
    }

    async getAttendanceReport(childId: number, year: number, month: number): Promise<{
        totalDays: number;
        totalHours: number;
        totalCharges: number;
        attendances: DaycareAttendance[];
    }> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Get enrollment for this child
        const enrollments = await this.getEnrollmentsByChild(childId);
        if (enrollments.length === 0) {
            return { totalDays: 0, totalHours: 0, totalCharges: 0, attendances: [] };
        }

        const attendances = await this.getAttendanceHistory(enrollments[0].id, startDate, endDate);

        const totalDays = attendances.length;
        const totalHours = attendances.reduce((sum, att) => sum + (att.durationMinutes || 0) / 60, 0);
        const totalCharges = attendances.reduce((sum, att) => sum + parseFloat(att.calculatedCharge || "0"), 0);

        return {
            totalDays,
            totalHours,
            totalCharges,
            attendances
        };
    }

    async getInquiryConversionRate(organizationId?: number): Promise<number> {
        // Enrolled
        const enrolledConditions: SQL[] = [eq(schema.daycareInquiries.status, "enrolled")];
        if (organizationId) enrolledConditions.push(eq(schema.daycareInquiries.organizationId, organizationId));

        const enrolled = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycareInquiries)
            .where(and(...enrolledConditions));

        // Total
        const totalConditions: SQL[] = [];
        if (organizationId) totalConditions.push(eq(schema.daycareInquiries.organizationId, organizationId));

        const totalInquiries = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycareInquiries)
            .where(totalConditions.length > 0 ? and(...totalConditions) : undefined);

        if (totalInquiries[0].count === 0) return 0;
        return (enrolled[0].count / totalInquiries[0].count) * 100;
    }

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================

    private async generateChildId(): Promise<string> {
        const year = new Date().getFullYear();
        const count = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycareChildren);
        const nextNumber = (count[0].count + 1).toString().padStart(4, '0');
        return `DC${year}${nextNumber}`;
    }

    private async generateInquiryNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const count = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycareInquiries);
        const nextNumber = (count[0].count + 1).toString().padStart(4, '0');
        return `INQ${year}${nextNumber}`;
    }

    private async generateEnrollmentNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const count = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycareEnrollments);
        const nextNumber = (count[0].count + 1).toString().padStart(4, '0');
        return `ENR${year}${nextNumber}`;
    }

    private async generatePaymentNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const count = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycarePayments);
        const nextNumber = (count[0].count + 1).toString().padStart(4, '0');
        return `PAY${year}${nextNumber}`;
    }

    private async generateReceiptNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const count = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycarePayments);
        const nextNumber = (count[0].count + 1).toString().padStart(4, '0');
        return `RCP${year}${nextNumber}`;
    }

    private determineBillingType(durationMinutes: number): string {
        if (durationMinutes >= 480) return "full-day"; // 8+ hours
        if (durationMinutes >= 240) return "half-day"; // 4+ hours
        return "hourly";
    }

    private async calculateAttendanceCharge(enrollmentId: number, durationMinutes: number): Promise<number> {
        // Get enrollment with billing plan
        const enrollment = await this.getDaycareEnrollment(enrollmentId);
        if (!enrollment) return 0;

        let billing: DaycareBillingConfig | undefined;

        // Check for custom rates
        if (enrollment.customHourlyRate || enrollment.customHalfDayRate || enrollment.customFullDayRate) {
            // Use custom rates
            billing = {
                hourlyRate: enrollment.customHourlyRate,
                halfDayRate: enrollment.customHalfDayRate,
                fullDayRate: enrollment.customFullDayRate,
                halfDayHours: 4,
                fullDayHours: 8,
                minHourlyChargeMinutes: 60
            } as any;
        } else if (enrollment.billingPlanId) {
            // Get billing config
            const config = await db.select().from(schema.daycareBillingConfig)
                .where(eq(schema.daycareBillingConfig.id, enrollment.billingPlanId));
            billing = config[0];
        } else {
            // Get active billing config
            billing = await this.getActiveBillingConfig();
        }

        if (!billing) return 0;

        const hours = durationMinutes / 60;

        // Full day check
        if (hours >= (billing.fullDayHours || 8)) {
            return parseFloat(billing.fullDayRate || "0");
        }

        // Half day check
        if (hours >= (billing.halfDayHours || 4)) {
            return parseFloat(billing.halfDayRate || "0");
        }

        // Hourly calculation
        const minHours = (billing.minHourlyChargeMinutes || 60) / 60;
        const chargeableHours = Math.max(hours, minHours);
        return parseFloat(billing.hourlyRate || "0") * Math.ceil(chargeableHours);
    }
}

export const daycareStorage = new DaycareStorage();
