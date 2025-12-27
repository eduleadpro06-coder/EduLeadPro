import { eq, and, gte, lte, desc, sql, isNull, or, asc } from "drizzle-orm";
import { db } from "./db.js";
import * as schema from "../shared/schema.js";
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

    async getAllDaycareChildren(includeDeleted = false): Promise<DaycareChild[]> {
        let query = db.select().from(schema.daycareChildren);

        if (!includeDeleted) {
            query = query.where(isNull(schema.daycareChildren.deletedAt)) as any;
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

    async searchDaycareChildren(query: string): Promise<DaycareChild[]> {
        const searchPattern = `%${query}%`;
        const result = await db.select().from(schema.daycareChildren)
            .where(
                and(
                    isNull(schema.daycareChildren.deletedAt),
                    or(
                        sql`${schema.daycareChildren.childName} ILIKE ${searchPattern}`,
                        sql`${schema.daycareChildren.parentName} ILIKE ${searchPattern}`,
                        sql`${schema.daycareChildren.parentPhone} ILIKE ${searchPattern}`
                    )
                )
            );
        return result;
    }

    async getActiveDaycareChildren(): Promise<DaycareChild[]> {
        const result = await db.select().from(schema.daycareChildren)
            .where(
                and(
                    eq(schema.daycareChildren.status, "active"),
                    isNull(schema.daycareChildren.deletedAt)
                )
            )
            .orderBy(schema.daycareChildren.childName);
        return result;
    }

    // ==========================================
    // INQUIRY MANAGEMENT
    // ==========================================

    async getAllDaycareInquiries(): Promise<DaycareInquiry[]> {
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

    async getInquiriesByStatus(status: string): Promise<DaycareInquiry[]> {
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

    async getOverdueFollowups(): Promise<DaycareInquiryFollowup[]> {
        const now = new Date();
        return await db.select().from(schema.daycareInquiryFollowups)
            .where(
                and(
                    eq(schema.daycareInquiryFollowups.status, "pending"),
                    sql`${schema.daycareInquiryFollowups.scheduledAt} < ${now}`
                )
            )
            .orderBy(schema.daycareInquiryFollowups.scheduledAt);
    }

    async getTodayFollowups(): Promise<DaycareInquiryFollowup[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return await db.select().from(schema.daycareInquiryFollowups)
            .where(
                and(
                    eq(schema.daycareInquiryFollowups.status, "pending"),
                    gte(schema.daycareInquiryFollowups.scheduledAt, today),
                    sql`${schema.daycareInquiryFollowups.scheduledAt} < ${tomorrow.toISOString()}`
                )
            )
            .orderBy(schema.daycareInquiryFollowups.scheduledAt);
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

    async getAllDaycareEnrollments(includeInactive = false): Promise<DaycareEnrollment[]> {
        const baseConditions = isNull(schema.daycareEnrollments.deletedAt);

        const query = includeInactive
            ? db.select().from(schema.daycareEnrollments).where(baseConditions)
            : db.select().from(schema.daycareEnrollments).where(
                and(
                    baseConditions,
                    eq(schema.daycareEnrollments.status, "active")
                )
            );

        return (await query).sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
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

    async cancelEnrollment(id: number, reason: string): Promise<DaycareEnrollment | undefined> {
        return await this.updateEnrollment(id, {
            status: "cancelled",
            endDate: new Date(),
            notes: reason
        });
    }

    // ==========================================
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
            .where(eq(schema.daycareAttendance.id, attendanceId));

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

    async getTodayAttendance(): Promise<DaycareAttendance[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        return await db.select().from(schema.daycareAttendance)
            .where(gte(schema.daycareAttendance.attendanceDate, todayStr))
            .orderBy(desc(schema.daycareAttendance.checkInTime));
    }

    async getCurrentlyCheckedIn(): Promise<DaycareAttendance[]> {
        return await db.select().from(schema.daycareAttendance)
            .where(isNull(schema.daycareAttendance.checkOutTime))
            .orderBy(schema.daycareAttendance.checkInTime);
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

    async getAllDaycarePayments(): Promise<DaycarePayment[]> {
        return await db.select().from(schema.daycarePayments)
            .orderBy(desc(schema.daycarePayments.paymentDate));
    }

    async getPaymentsByChild(childId: number): Promise<DaycarePayment[]> {
        return await db.select().from(schema.daycarePayments)
            .where(eq(schema.daycarePayments.childId, childId))
            .orderBy(desc(schema.daycarePayments.paymentDate));
    }

    async getPaymentsByDateRange(startDate: Date, endDate: Date): Promise<DaycarePayment[]> {
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        return await db.select().from(schema.daycarePayments)
            .where(
                and(
                    gte(schema.daycarePayments.paymentDate, startStr),
                    lte(schema.daycarePayments.paymentDate, endStr)
                )
            )
            .orderBy(desc(schema.daycarePayments.paymentDate));
    }

    async getPendingPayments(): Promise<DaycarePayment[]> {
        return await db.select().from(schema.daycarePayments)
            .where(eq(schema.daycarePayments.status, "pending"))
            .orderBy(schema.daycarePayments.paymentDate);
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
        return await this.createDaycarePayment({
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
    }

    async updatePayment(id: number, updates: Partial<DaycarePayment>): Promise<DaycarePayment | undefined> {
        const result = await db.update(schema.daycarePayments)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(schema.daycarePayments.id, id))
            .returning();
        return result[0];
    }

    async deleteDaycarePayment(id: number): Promise<boolean> {
        const result = await db.delete(schema.daycarePayments)
            .where(eq(schema.daycarePayments.id, id))
            .returning();
        return result.length > 0;
    }

    // ==========================================
    // BILLING CONFIGURATION
    // ==========================================

    async getBillingConfigs(): Promise<DaycareBillingConfig[]> {
        return await db.select().from(schema.daycareBillingConfig)
            .orderBy(desc(schema.daycareBillingConfig.createdAt));
    }

    async getActiveBillingConfig(): Promise<DaycareBillingConfig | undefined> {
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

    async getDaycareStats(): Promise<{
        totalChildren: number;
        activeEnrollments: number;
        newInquiries: number;
        currentlyCheckedIn: number;
        todayRevenue: number;
        monthRevenue: number;
        pendingPayments: number;
    }> {
        const totalChildren = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycareChildren)
            .where(isNull(schema.daycareChildren.deletedAt));

        const activeEnrollments = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycareEnrollments)
            .where(
                and(
                    eq(schema.daycareEnrollments.status, "active"),
                    isNull(schema.daycareEnrollments.deletedAt)
                )
            );

        const newInquiries = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycareInquiries)
            .where(eq(schema.daycareInquiries.status, "new"));

        const currentlyCheckedIn = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycareAttendance)
            .where(isNull(schema.daycareAttendance.checkOutTime));

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format

        const todayRevenue = await db.select({
            sum: sql<string>`COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0)`
        })
            .from(schema.daycarePayments)
            .where(
                and(
                    gte(schema.daycarePayments.paymentDate, todayStr),
                    eq(schema.daycarePayments.status, "completed")
                )
            );

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstDayStr = firstDayOfMonth.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format

        const monthRevenue = await db.select({
            sum: sql<string>`COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0)`
        })
            .from(schema.daycarePayments)
            .where(
                and(
                    gte(schema.daycarePayments.paymentDate, firstDayStr),
                    eq(schema.daycarePayments.status, "completed")
                )
            );

        const pendingPayments = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycarePayments)
            .where(eq(schema.daycarePayments.status, "pending"));

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

    async getMonthlyRevenue(year: number, month: number): Promise<number> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        const result = await db.select({
            sum: sql<string>`COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0)`
        })
            .from(schema.daycarePayments)
            .where(
                and(
                    gte(schema.daycarePayments.paymentDate, startStr),
                    lte(schema.daycarePayments.paymentDate, endStr),
                    eq(schema.daycarePayments.status, "completed")
                )
            );

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

    async getInquiryConversionRate(): Promise<number> {
        const totalInquiries = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycareInquiries);

        const enrolled = await db.select({ count: sql<number>`count(*)` })
            .from(schema.daycareInquiries)
            .where(eq(schema.daycareInquiries.status, "enrolled"));

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
