import { Express } from "express";
import { daycareStorage, storage } from "./storage.js";
import type { Request } from "express";

async function requireOrganizationId(req: Request): Promise<number> {
    // Check session first (secure)
    let username = (req as any).session?.username;

    // Fallback to header (legacy/insecure)
    if (!username) {
        username = req.headers['x-user-name'] as string;
    }

    if (!username) throw new Error("Authentication required");
    const user = await storage.getUserByUsername(username);

    if (!user?.organizationId) throw new Error("Organization context required");

    return user.organizationId;
}

/**
 * Daycare Management API Routes
 * Complete REST API for the standalone Daycare Management module
 */
export function registerDaycareRoutes(app: Express): void {

    // ============================================
    // CHILDREN MANAGEMENT
    // ============================================

    app.get("/api/daycare/children", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const includeDeleted = req.query.includeDeleted === 'true';
            const children = await daycareStorage.getAllDaycareChildren(includeDeleted, organizationId);
            res.json(children);
        } catch (error) {
            console.error("Error fetching daycare children:", error);
            res.status(500).json({ error: "Failed to fetch children" });
        }
    });

    app.get("/api/daycare/children/active", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const children = await daycareStorage.getActiveDaycareChildren(organizationId);
            res.json(children);
        } catch (error) {
            console.error("Error fetching active daycare children:", error);
            res.status(500).json({ error: "Failed to fetch active children" });
        }
    });

    app.get("/api/daycare/children/search", async (req, res) => {
        try {
            const query = req.query.q as string;
            if (!query) {
                return res.status(400).json({ error: "Search query is required" });
            }
            const organizationId = await requireOrganizationId(req);
            const children = await daycareStorage.searchDaycareChildren(query, organizationId);
            res.json(children);
        } catch (error) {
            console.error("Error searching daycare children:", error);
            res.status(500).json({ error: "Failed to search children" });
        }
    });

    app.get("/api/daycare/children/:id", async (req, res) => {
        try {
            const child = await daycareStorage.getDaycareChild(Number(req.params.id));
            if (!child) {
                return res.status(404).json({ error: "Child not found" });
            }
            res.json(child);
        } catch (error) {
            console.error("Error fetching daycare child:", error);
            res.status(500).json({ error: "Failed to fetch child" });
        }
    });

    app.post("/api/daycare/children", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const child = await daycareStorage.createDaycareChild({ ...req.body, organizationId });
            res.status(201).json(child);
        } catch (error) {
            console.error("Error creating daycare child:", error);
            res.status(500).json({ error: "Failed to create child" });
        }
    });

    app.put("/api/daycare/children/:id", async (req, res) => {
        try {
            const child = await daycareStorage.updateDaycareChild(Number(req.params.id), req.body);
            if (!child) {
                return res.status(404).json({ error: "Child not found" });
            }
            res.json(child);
        } catch (error) {
            console.error("Error updating daycare child:", error);
            res.status(500).json({ error: "Failed to update child" });
        }
    });

    app.delete("/api/daycare/children/:id", async (req, res) => {
        try {
            const success = await daycareStorage.deleteDaycareChild(Number(req.params.id));
            if (!success) {
                return res.status(404).json({ error: "Child not found" });
            }
            res.json({ success: true });
        } catch (error) {
            console.error("Error deleting daycare child:", error);
            res.status(500).json({ error: "Failed to delete child" });
        }
    });

    // ============================================
    // INQUIRY MANAGEMENT
    // ============================================

    app.get("/api/daycare/inquiries", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const status = req.query.status as string;
            const inquiries = status
                ? await daycareStorage.getInquiriesByStatus(status, organizationId)
                : await daycareStorage.getAllDaycareInquiries(organizationId);
            res.json(inquiries);
        } catch (error) {
            console.error("Error fetching daycare inquiries:", error);
            res.status(500).json({ error: "Failed to fetch inquiries" });
        }
    });

    app.get("/api/daycare/inquiries/my/:userId", async (req, res) => {
        try {
            const inquiries = await daycareStorage.getMyInquiries(Number(req.params.userId));
            res.json(inquiries);
        } catch (error) {
            console.error("Error fetching my inquiries:", error);
            res.status(500).json({ error: "Failed to fetch inquiries" });
        }
    });

    app.get("/api/daycare/inquiries/:id", async (req, res) => {
        try {
            const inquiry = await daycareStorage.getDaycareInquiry(Number(req.params.id));
            if (!inquiry) {
                return res.status(404).json({ error: "Inquiry not found" });
            }
            res.json(inquiry);
        } catch (error) {
            console.error("Error fetching daycare inquiry:", error);
            res.status(500).json({ error: "Failed to fetch inquiry" });
        }
    });

    app.post("/api/daycare/inquiries", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const inquiry = await daycareStorage.createDaycareInquiry({ ...req.body, organizationId });
            res.status(201).json(inquiry);
        } catch (error) {
            console.error("Error creating daycare inquiry:", error);
            res.status(500).json({ error: "Failed to create inquiry" });
        }
    });

    app.put("/api/daycare/inquiries/:id", async (req, res) => {
        try {
            const inquiry = await daycareStorage.updateDaycareInquiry(Number(req.params.id), req.body);
            if (!inquiry) {
                return res.status(404).json({ error: "Inquiry not found" });
            }
            res.json(inquiry);
        } catch (error) {
            console.error("Error updating daycare inquiry:", error);
            res.status(500).json({ error: "Failed to update inquiry" });
        }
    });

    app.post("/api/daycare/inquiries/:id/assign", async (req, res) => {
        try {
            const { userId } = req.body;
            const inquiry = await daycareStorage.assignInquiry(Number(req.params.id), userId);
            if (!inquiry) {
                return res.status(404).json({ error: "Inquiry not found" });
            }
            res.json(inquiry);
        } catch (error) {
            console.error("Error assigning inquiry:", error);
            res.status(500).json({ error: "Failed to assign inquiry" });
        }
    });

    app.post("/api/daycare/inquiries/:id/convert", async (req, res) => {
        try {
            const result = await daycareStorage.convertInquiryToEnrollment(Number(req.params.id), req.body);
            res.json(result);
        } catch (error) {
            console.error("Error converting inquiry:", error);
            res.status(500).json({ error: "Failed to convert inquiry" });
        }
    });

    // ============================================
    // INQUIRY FOLLOW-UPS
    // ============================================

    app.get("/api/daycare/followups/inquiry/:inquiryId", async (req, res) => {
        try {
            const followups = await daycareStorage.getFollowupsByInquiry(Number(req.params.inquiryId));
            res.json(followups);
        } catch (error) {
            console.error("Error fetching inquiry followups:", error);
            res.status(500).json({ error: "Failed to fetch follow-ups" });
        }
    });

    app.get("/api/daycare/followups/overdue", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const followups = await daycareStorage.getOverdueFollowups(organizationId);
            res.json(followups);
        } catch (error) {
            console.error("Error fetching overdue followups:", error);
            res.status(500).json({ error: "Failed to fetch overdue follow-ups" });
        }
    });

    app.get("/api/daycare/followups/today", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const followups = await daycareStorage.getTodayFollowups(organizationId);
            res.json(followups);
        } catch (error) {
            console.error("Error fetching today's followups:", error);
            res.status(500).json({ error: "Failed to fetch today's follow-ups" });
        }
    });

    app.post("/api/daycare/followups", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const followup = await daycareStorage.createInquiryFollowup({ ...req.body, organizationId });
            res.status(201).json(followup);
        } catch (error) {
            console.error("Error creating followup:", error);
            res.status(500).json({ error: "Failed to create follow-up" });
        }
    });

    app.post("/api/daycare/followups/:id/complete", async (req, res) => {
        try {
            const { outcome, notes, userId } = req.body;
            const followup = await daycareStorage.completeFollowup(
                Number(req.params.id),
                outcome,
                notes,
                userId
            );
            if (!followup) {
                return res.status(404).json({ error: "Follow-up not found" });
            }
            res.json(followup);
        } catch (error) {
            console.error("Error completing followup:", error);
            res.status(500).json({ error: "Failed to complete follow-up" });
        }
    });

    // ============================================
    // ENROLLMENT MANAGEMENT
    // ============================================

    app.get("/api/daycare/enrollments", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const includeInactive = req.query.includeInactive === 'true';
            const enrollments = await daycareStorage.getAllDaycareEnrollments(includeInactive, organizationId);
            res.json(enrollments);
        } catch (error) {
            console.error("Error fetching enrollments:", error);
            res.status(500).json({ error: "Failed to fetch enrollments" });
        }
    });

    app.get("/api/daycare/enrollments/:id", async (req, res) => {
        try {
            const enrollment = await daycareStorage.getDaycareEnrollment(Number(req.params.id));
            if (!enrollment) {
                return res.status(404).json({ error: "Enrollment not found" });
            }
            res.json(enrollment);
        } catch (error) {
            console.error("Error fetching enrollment:", error);
            res.status(500).json({ error: "Failed to fetch enrollment" });
        }
    });

    app.get("/api/daycare/enrollments/child/:childId", async (req, res) => {
        try {
            const enrollments = await daycareStorage.getEnrollmentsByChild(Number(req.params.childId));
            res.json(enrollments);
        } catch (error) {
            console.error("Error fetching child enrollments:", error);
            res.status(500).json({ error: "Failed to fetch enrollments" });
        }
    });

    app.post("/api/daycare/enrollments", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const enrollment = await daycareStorage.createEnrollment({ ...req.body, organizationId });
            res.status(201).json(enrollment);
        } catch (error) {
            console.error("Error creating enrollment:", error);
            res.status(500).json({ error: "Failed to create enrollment" });
        }
    });

    app.put("/api/daycare/enrollments/:id", async (req, res) => {
        try {
            const enrollment = await daycareStorage.updateEnrollment(Number(req.params.id), req.body);
            if (!enrollment) {
                return res.status(404).json({ error: "Enrollment not found" });
            }
            res.json(enrollment);
        } catch (error) {
            console.error("Error updating enrollment:", error);
            res.status(500).json({ error: "Failed to update enrollment" });
        }
    });

    app.delete("/api/daycare/enrollments/:id", async (req, res) => {
        try {
            const success = await daycareStorage.deleteEnrollment(Number(req.params.id));
            if (!success) {
                return res.status(404).json({ error: "Enrollment not found" });
            }
            res.status(204).end();
        } catch (error) {
            console.error("Error deleting enrollment:", error);
            res.status(500).json({ error: "Failed to delete enrollment" });
        }
    });

    app.post("/api/daycare/enrollments/:id/pause", async (req, res) => {
        try {
            const { reason } = req.body;
            const enrollment = await daycareStorage.pauseEnrollment(Number(req.params.id), reason);
            if (!enrollment) {
                return res.status(404).json({ error: "Enrollment not found" });
            }
            res.json(enrollment);
        } catch (error) {
            console.error("Error pausing enrollment:", error);
            res.status(500).json({ error: "Failed to pause enrollment" });
        }
    });

    app.post("/api/daycare/enrollments/:id/cancel", async (req, res) => {
        try {
            const { reason } = req.body;
            const enrollment = await daycareStorage.cancelEnrollment(Number(req.params.id), reason);
            if (!enrollment) {
                return res.status(404).json({ error: "Enrollment not found" });
            }
            res.json(enrollment);
        } catch (error) {
            console.error("Error cancelling enrollment:", error);
            res.status(500).json({ error: "Failed to cancel enrollment" });
        }
    });

    // ============================================
    // ATTENDANCE MANAGEMENT
    // ============================================

    app.post("/api/daycare/attendance/check-in", async (req, res) => {
        try {
            const { enrollmentId, checkInTime, userId, notes } = req.body;
            const attendance = await daycareStorage.checkInChild(
                enrollmentId,
                new Date(checkInTime),
                userId,
                notes
            );
            res.status(201).json(attendance);
        } catch (error) {
            console.error("Error checking in child:", error);
            res.status(500).json({ error: "Failed to check in child" });
        }
    });

    app.post("/api/daycare/attendance/:id/check-out", async (req, res) => {
        try {
            const { checkOutTime, userId } = req.body;
            const attendance = await daycareStorage.checkOutChild(
                Number(req.params.id),
                new Date(checkOutTime),
                userId
            );
            if (!attendance) {
                return res.status(404).json({ error: "Attendance record not found" });
            }
            res.json(attendance);
        } catch (error) {
            console.error("Error checking out child:", error);
            res.status(500).json({ error: "Failed to check out child" });
        }
    });

    app.get("/api/daycare/attendance/today", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const attendance = await daycareStorage.getTodayAttendance(organizationId);
            res.json(attendance);
        } catch (error) {
            console.error("Error fetching today's attendance:", error);
            res.status(500).json({ error: "Failed to fetch attendance" });
        }
    });

    app.get("/api/daycare/attendance/checked-in", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const attendance = await daycareStorage.getCurrentlyCheckedIn(organizationId);
            res.json(attendance);
        } catch (error) {
            console.error("Error fetching checked-in children:", error);
            res.status(500).json({ error: "Failed to fetch checked-in children" });
        }
    });

    app.get("/api/daycare/attendance/history/:enrollmentId", async (req, res) => {
        try {
            const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

            const attendance = await daycareStorage.getAttendanceHistory(
                Number(req.params.enrollmentId),
                startDate,
                endDate
            );
            res.json(attendance);
        } catch (error) {
            console.error("Error fetching attendance history:", error);
            res.status(500).json({ error: "Failed to fetch attendance history" });
        }
    });

    app.put("/api/daycare/attendance/:id/manual", async (req, res) => {
        try {
            const { updates, userId, reason } = req.body;
            const attendance = await daycareStorage.updateAttendanceManual(
                Number(req.params.id),
                updates,
                userId,
                reason
            );
            if (!attendance) {
                return res.status(404).json({ error: "Attendance record not found" });
            }
            res.json(attendance);
        } catch (error) {
            console.error("Error updating attendance manually:", error);
            res.status(500).json({ error: "Failed to update attendance" });
        }
    });

    // ============================================
    // PAYMENT MANAGEMENT
    // ============================================

    app.get("/api/daycare/payments", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const payments = await daycareStorage.getAllDaycarePayments(organizationId);
            res.json(payments);
        } catch (error) {
            console.error("Error fetching payments:", error);
            res.status(500).json({ error: "Failed to fetch payments" });
        }
    });

    app.get("/api/daycare/payments/child/:childId", async (req, res) => {
        try {
            const payments = await daycareStorage.getPaymentsByChild(Number(req.params.childId));
            res.json(payments);
        } catch (error) {
            console.error("Error fetching child payments:", error);
            res.status(500).json({ error: "Failed to fetch payments" });
        }
    });

    app.get("/api/daycare/payments/pending", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const payments = await daycareStorage.getPendingPayments(organizationId);
            res.json(payments);
        } catch (error) {
            console.error("Error fetching pending payments:", error);
            res.status(500).json({ error: "Failed to fetch pending payments" });
        }
    });

    app.get("/api/daycare/payments/date-range", async (req, res) => {
        try {
            const startDate = new Date(req.query.startDate as string);
            const endDate = new Date(req.query.endDate as string);
            const organizationId = await requireOrganizationId(req);

            const payments = await daycareStorage.getPaymentsByDateRange(startDate, endDate, organizationId);
            res.json(payments);
        } catch (error) {
            console.error("Error fetching payments by date range:", error);
            res.status(500).json({ error: "Failed to fetch payments" });
        }
    });

    app.post("/api/daycare/payments", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const payment = await daycareStorage.createDaycarePayment({ ...req.body, organizationId });
            res.status(201).json(payment);
        } catch (error) {
            console.error("Error creating payment:", error);
            res.status(500).json({ error: "Failed to create payment" });
        }
    });

    app.post("/api/daycare/payments/record", async (req, res) => {
        try {
            const { childId, amount, paymentMode, userId, paymentType, enrollmentId, status } = req.body;
            const payment = await daycareStorage.recordPayment(
                childId,
                amount,
                paymentMode,
                userId,
                paymentType,
                enrollmentId,
                status
            );
            res.status(201).json(payment);
        } catch (error) {
            console.error("Error recording payment:", error);
            res.status(500).json({ error: "Failed to record payment" });
        }
    });

    app.put("/api/daycare/payments/:id", async (req, res) => {
        try {
            const payment = await daycareStorage.updatePayment(Number(req.params.id), req.body);
            if (!payment) {
                return res.status(404).json({ error: "Payment not found" });
            }
            res.json(payment);
        } catch (error) {
            console.error("Error updating payment:", error);
            res.status(500).json({ error: "Failed to update payment" });
        }
    });

    app.delete("/api/daycare/payments/:id", async (req, res) => {
        try {
            const success = await daycareStorage.deleteDaycarePayment(Number(req.params.id));
            if (!success) {
                return res.status(404).json({ error: "Payment not found" });
            }
            res.status(204).end();
        } catch (error) {
            console.error("Error deleting payment:", error);
            res.status(500).json({ error: "Failed to delete payment" });
        }
    });

    // ============================================
    // BILLING CONFIGURATION
    // ============================================

    app.get("/api/daycare/billing-config", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const configs = await daycareStorage.getBillingConfigs(organizationId);
            res.json(configs);
        } catch (error) {
            console.error("Error fetching billing configs:", error);
            res.status(500).json({ error: "Failed to fetch billing configurations" });
        }
    });

    app.get("/api/daycare/billing-config/active", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const config = await daycareStorage.getActiveBillingConfig(organizationId);
            res.json(config);
        } catch (error) {
            console.error("Error fetching active billing config:", error);
            res.status(500).json({ error: "Failed to fetch active configuration" });
        }
    });

    app.post("/api/daycare/billing-config", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const config = await daycareStorage.createBillingConfig({ ...req.body, organizationId });
            res.status(201).json(config);
        } catch (error) {
            console.error("Error creating billing config:", error);
            res.status(500).json({ error: "Failed to create configuration" });
        }
    });

    app.put("/api/daycare/billing-config/:id", async (req, res) => {
        try {
            const config = await daycareStorage.updateBillingConfig(Number(req.params.id), req.body);
            if (!config) {
                return res.status(404).json({ error: "Configuration not found" });
            }
            res.json(config);
        } catch (error) {
            console.error("Error updating billing config:", error);
            res.status(500).json({ error: "Failed to update configuration" });
        }
    });

    app.post("/api/daycare/billing-config/:id/activate", async (req, res) => {
        try {
            const config = await daycareStorage.setActiveBillingConfig(Number(req.params.id));
            if (!config) {
                return res.status(404).json({ error: "Configuration not found" });
            }
            res.json(config);
        } catch (error) {
            console.error("Error activating billing config:", error);
            res.status(500).json({ error: "Failed to activate configuration" });
        }
    });

    // ============================================
    // ANALYTICS & REPORTS
    // ============================================

    app.get("/api/daycare/stats", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const stats = await daycareStorage.getDaycareStats(organizationId);
            res.json(stats);
        } catch (error) {
            console.error("Error fetching daycare stats:", error);
            res.status(500).json({ error: "Failed to fetch statistics" });
        }
    });

    app.get("/api/daycare/revenue/monthly", async (req, res) => {
        try {
            const year = Number(req.query.year);
            const month = Number(req.query.month);
            const organizationId = await requireOrganizationId(req);
            const revenue = await daycareStorage.getMonthlyRevenue(year, month, organizationId);
            res.json({ revenue });
        } catch (error) {
            console.error("Error fetching monthly revenue:", error);
            res.status(500).json({ error: "Failed to fetch revenue" });
        }
    });

    app.get("/api/daycare/reports/attendance/:childId", async (req, res) => {
        try {
            const year = Number(req.query.year);
            const month = Number(req.query.month);
            const report = await daycareStorage.getAttendanceReport(
                Number(req.params.childId),
                year,
                month
            );
            res.json(report);
        } catch (error) {
            console.error("Error fetching attendance report:", error);
            res.status(500).json({ error: "Failed to fetch report" });
        }
    });

    app.get("/api/daycare/conversion-rate", async (req, res) => {
        try {
            const organizationId = await requireOrganizationId(req);
            const rate = await daycareStorage.getInquiryConversionRate(organizationId);
            res.json({ conversionRate: rate });
        } catch (error) {
            console.error("Error fetching conversion rate:", error);
            res.status(500).json({ error: "Failed to fetch conversion rate" });
        }
    });
}
