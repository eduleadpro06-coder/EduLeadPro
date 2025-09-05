import { eq, and, gte, lte, sql, desc, or, isNull, not } from "drizzle-orm";
import { db } from "./db.js";
import * as schema from "./shared/schema.js";
import type {
  User, InsertUser, Lead, InsertLead, FollowUp, InsertFollowUp,
  LeadSource, InsertLeadSource, Staff, InsertStaff, Attendance, InsertAttendance,
  Payroll, InsertPayroll, Expense, InsertExpense, Student, InsertStudent,
  FeeStructure, InsertFeeStructure, FeePayment, InsertFeePayment,
  EMandate, InsertEMandate, EmiSchedule, InsertEmiSchedule,
  GlobalClassFee, InsertGlobalClassFee, EmiPlan, InsertEmiPlan,
  Notification, InsertNotification
} from "../shared/schema.js";

// Type definitions for complex queries
export type LeadWithCounselor = Lead & {
  counselor?: User;
};

export type ExpenseWithApprover = Expense & {
  approver?: User;
};

export type StaffWithDetails = Staff;

export type StudentWithFees = Student & {
  feeStructure?: FeeStructure;
  payments?: FeePayment[];
  eMandate?: EMandate;
  emiSchedule?: EmiSchedule[];
};

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllCounselors(): Promise<User[]>;

  // Leads
  getLead(id: number): Promise<LeadWithCounselor | undefined>;
  getAllLeads(includeDeleted?: boolean): Promise<LeadWithCounselor[]>;
  getLeadsByStatus(status: string): Promise<LeadWithCounselor[]>;
  getLeadsByCounselor(counselorId: number): Promise<LeadWithCounselor[]>;
  getLeadsByDateRange(startDate: Date, endDate: Date): Promise<LeadWithCounselor[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  checkDuplicateLead(phone: string, email?: string): Promise<LeadWithCounselor | null>;
  updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined>;
  getRecentLeads(limit?: number): Promise<LeadWithCounselor[]>;
  getLeadsRequiringFollowUp(): Promise<LeadWithCounselor[]>;
  restoreLead(id: number): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<void>;

  // Follow-ups
  getFollowUp(id: number): Promise<FollowUp | undefined>;
  getFollowUpsByLead(leadId: number): Promise<FollowUp[]>;
  getFollowUpsByCounselor(counselorId: number): Promise<FollowUp[]>;
  createFollowUp(followUp: InsertFollowUp): Promise<FollowUp>;
  updateFollowUp(id: number, updates: Partial<FollowUp>): Promise<FollowUp | undefined>;
  getOverdueFollowUps(): Promise<FollowUp[]>;

  // Lead Sources
  getAllLeadSources(): Promise<LeadSource[]>;
  createLeadSource(source: InsertLeadSource): Promise<LeadSource>;
  updateLeadSource(id: number, updates: Partial<LeadSource>): Promise<LeadSource | undefined>;

  // Analytics
  getLeadStats(): Promise<{
    totalLeads: number;
    hotLeads: number;
    conversions: number;
    newLeadsToday: number;
  }>;
  getEnrollmentStats(): Promise<{
    totalEnrollments: number;
    activeEnrollments: number;
    newEnrollmentsThisMonth: number;
    enrollmentTrend: number;
  }>;
  getLeadSourcePerformance(): Promise<Array<{
    source: string;
    totalLeads: number;
    conversions: number;
    conversionRate: number;
  }>>;
  getMonthlyEnrollmentTrend(): Promise<Array<{
    month: string;
    enrollments: number;
  }>>;

  // Staff Management
  getStaff(id: number): Promise<Staff | undefined>;
  getAllStaff(): Promise<StaffWithDetails[]>;
  getStaffByRole(role: string): Promise<Staff[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: number, updates: Partial<Staff>): Promise<Staff | undefined>;
  deleteStaff(id: number): Promise<boolean>;

  // Attendance
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendanceByStaff(staffId: number, month?: number, year?: number): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, updates: Partial<Attendance>): Promise<Attendance | undefined>;
  getAttendanceStats(month: number, year: number): Promise<{
    totalPresent: number;
    totalAbsent: number;
    averageHours: number;
  }>;

  // Payroll
  getPayroll(id: number): Promise<Payroll | undefined>;
  getPayrollByStaff(staffId: number): Promise<Payroll[]>;
  getPayrollByMonth(month: number, year: number): Promise<Payroll[]>;
  getAllPayroll(): Promise<Payroll[]>;
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  updatePayroll(id: number, updates: Partial<Payroll>): Promise<Payroll | undefined>;
  deletePayroll(id: number): Promise<boolean>;
  getPayrollStats(month: number, year: number): Promise<{
    totalSalaries: number;
    totalDeductions: number;
    totalAllowances: number;
    netPayroll: number;
  }>;
  getPayrollByStaffMonthYear(staffId: number, month: number, year: number): Promise<Payroll | undefined>;

  // Expenses
  getExpense(id: number): Promise<ExpenseWithApprover | undefined>;
  getAllExpenses(): Promise<ExpenseWithApprover[]>;
  getExpensesByCategory(category: string): Promise<ExpenseWithApprover[]>;
  getExpensesByDateRange(startDate: string, endDate: string): Promise<ExpenseWithApprover[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, updates: Partial<Expense>): Promise<Expense | undefined>;
  getExpenseStats(month: number, year: number): Promise<{
    totalExpenses: number;
    categoryBreakdown: Array<{ category: string; amount: number }>;
    monthlyTrend: Array<{ month: string; amount: number }>;
  }>;
  deleteExpense(id: number): Promise<boolean>;

  // Students
  getStudent(id: number): Promise<StudentWithFees | undefined>;
  getAllStudents(): Promise<StudentWithFees[]>;
  getStudentsByClass(className: string): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, updates: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  convertLeadToStudent(leadId: number, studentData: InsertStudent): Promise<Student>;

  // Fee Management
  getFeeStructure(id: number): Promise<FeeStructure | undefined>;
  getAllFeeStructures(): Promise<FeeStructure[]>;
  getFeeStructureByStudent(studentId: number): Promise<FeeStructure[]>;
  createFeeStructure(feeStructure: InsertFeeStructure): Promise<FeeStructure>;
  updateFeeStructure(id: number, updates: Partial<FeeStructure>): Promise<FeeStructure | undefined>;
  
  // Global Class Fee Management
  getGlobalClassFee(id: number): Promise<GlobalClassFee | undefined>;
  getAllGlobalClassFees(): Promise<GlobalClassFee[]>;
  getGlobalClassFeesByClass(className: string): Promise<GlobalClassFee[]>;
  createGlobalClassFee(globalClassFee: InsertGlobalClassFee): Promise<GlobalClassFee>;
  updateGlobalClassFee(id: number, updates: Partial<GlobalClassFee>): Promise<GlobalClassFee | undefined>;
  deleteGlobalClassFee(id: number): Promise<boolean>;
  
  getFeePayment(id: number): Promise<FeePayment | undefined>;
  getAllFeePayments(): Promise<FeePayment[]>;
  getFeePaymentsByStudent(studentId: number): Promise<FeePayment[]>;
  createFeePayment(feePayment: InsertFeePayment): Promise<FeePayment>;
  
  getFeeStats(): Promise<{
    totalPending: number;
    totalPaid: number;
    totalOverdue: number;
    collectionRate: number;
  }>;

  // E-Mandate
  getEMandate(id: number): Promise<EMandate | undefined>;
  getEMandateByStudent(studentId: number): Promise<EMandate | undefined>;
  getAllEMandates(): Promise<EMandate[]>;
  createEMandate(eMandate: InsertEMandate): Promise<EMandate>;
  updateEMandate(id: number, updates: Partial<EMandate>): Promise<EMandate | undefined>;
  deleteEMandate(id: number): Promise<boolean>;
  
  getEmiSchedule(id: number): Promise<EmiSchedule | undefined>;
  getEmiScheduleByMandate(eMandateId: number): Promise<EmiSchedule[]>;
  createEmiSchedule(emiSchedule: InsertEmiSchedule): Promise<EmiSchedule>;
  updateEmiSchedule(id: number, updates: Partial<EmiSchedule>): Promise<EmiSchedule | undefined>;
  getUpcomingEmis(): Promise<EmiSchedule[]>;
  
  // EMI Plan operations
  getEmiPlan(id: number): Promise<EmiPlan | undefined>;
  getEmiPlansByStudent(studentId: number): Promise<EmiPlan[]>;
  getAllEmiPlans(): Promise<EmiPlan[]>;
  createEmiPlan(emiPlan: InsertEmiPlan): Promise<EmiPlan>;
  updateEmiPlan(id: number, updates: Partial<EmiPlan>): Promise<EmiPlan | undefined>;
  deleteEmiPlan(id: number): Promise<boolean>;
  
  // EMI Payment tracking operations
  getPendingEmisForPlan(emiPlanId: number): Promise<any[]>;
  getEmiPaymentProgress(emiPlanId: number): Promise<any>;
  checkEmiPlanCompletion(emiPlanId: number): Promise<boolean>;

  // Fee Payment Deletion
  deleteFeePayment(id: number): Promise<boolean>;

  // Notifications
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUser(userId: number, limit?: number): Promise<Notification[]>;
  getUnreadNotificationsByUser(userId: number): Promise<Notification[]>;
  getNotificationsByType(type: string, limit?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: number, updates: Partial<Notification>): Promise<Notification | undefined>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<number>;
  deleteNotification(id: number): Promise<boolean>;
  deleteAllNotifications(userId: number): Promise<number>;
  getNotificationStats(userId: number): Promise<{
    total: number;
    unread: number;
    byType: Array<{ type: string; count: number }>;
  }>;

  // New method
  generateMonthlyPayrollForAllStaff(month: number, year: number): Promise<{ created: number; skipped: number; errors: any[] }>;
}

export class DatabaseStorage implements IStorage {
  // Basic user operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(insertUser).returning();
    return result[0];
  }

  async getAllCounselors(): Promise<User[]> {
    return await db.select().from(schema.users).where(eq(schema.users.role, "counselor"));
  }

  // Lead operations with counselor details
  async getLead(id: number): Promise<LeadWithCounselor | undefined> {
    const result = await db
      .select({
        id: schema.leads.id,
        name: schema.leads.name,
        email: schema.leads.email,
        phone: schema.leads.phone,
        class: schema.leads.class,
        stream: schema.leads.stream,
        source: schema.leads.source,
        status: schema.leads.status,
        interestedProgram: schema.leads.interestedProgram,
        notes: schema.leads.notes,
        counselorId: schema.leads.counselorId,
        assignedAt: schema.leads.assignedAt,
        createdAt: schema.leads.createdAt,
        updatedAt: schema.leads.updatedAt,
        lastContactedAt: schema.leads.lastContactedAt,

        parentName: schema.leads.parentName,
        parentPhone: schema.leads.parentPhone,
        address: schema.leads.address,
        deletedAt: schema.leads.deletedAt,
        counselor: {
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          password: schema.users.password,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt
        }
      })
      .from(schema.leads)
      .leftJoin(schema.users, eq(schema.leads.counselorId, schema.users.id))
      .where(eq(schema.leads.id, id));
    
    return result[0] ? {
      ...result[0],
      counselor: result[0].counselor || undefined
    } : undefined;
  }

  async getAllLeads(includeDeleted = false): Promise<LeadWithCounselor[]> {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90*24*60*60*1000);
    let query = db
      .select({
        id: schema.leads.id,
        name: schema.leads.name,
        email: schema.leads.email,
        phone: schema.leads.phone,
        class: schema.leads.class,
        stream: schema.leads.stream,
        source: schema.leads.source,
        status: schema.leads.status,
        interestedProgram: schema.leads.interestedProgram,
        notes: schema.leads.notes,
        counselorId: schema.leads.counselorId,
        assignedAt: schema.leads.assignedAt,
        createdAt: schema.leads.createdAt,
        updatedAt: schema.leads.updatedAt,
        lastContactedAt: schema.leads.lastContactedAt,

        parentName: schema.leads.parentName,
        parentPhone: schema.leads.parentPhone,
        address: schema.leads.address,
        deletedAt: schema.leads.deletedAt,
        counselor: {
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          password: schema.users.password,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt
        }
      })
      .from(schema.leads)
      .leftJoin(schema.users, eq(schema.leads.counselorId, schema.users.id))
      .orderBy(desc(schema.leads.createdAt));
    if (!includeDeleted) {
      query = query.where(and(
        or(
          isNull(schema.leads.deletedAt),
          gte(schema.leads.deletedAt, ninetyDaysAgo)
        ),
        not(eq(schema.leads.status, "deleted"))
      ));
    }
    const result = await query;
    return result.map((item: any) => ({
      ...item,
      counselor: item.counselor || undefined
    }));
  }

  async getLeadsByStatus(status: string): Promise<LeadWithCounselor[]> {
    const result = await db
      .select({
        id: schema.leads.id,
        name: schema.leads.name,
        email: schema.leads.email,
        phone: schema.leads.phone,
        class: schema.leads.class,
        stream: schema.leads.stream,
        source: schema.leads.source,
        status: schema.leads.status,
        interestedProgram: schema.leads.interestedProgram,
        notes: schema.leads.notes,
        counselorId: schema.leads.counselorId,
        assignedAt: schema.leads.assignedAt,
        createdAt: schema.leads.createdAt,
        updatedAt: schema.leads.updatedAt,
        lastContactedAt: schema.leads.lastContactedAt,

        parentName: schema.leads.parentName,
        parentPhone: schema.leads.parentPhone,
        address: schema.leads.address,
        counselor: {
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          password: schema.users.password,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt
        }
      })
      .from(schema.leads)
      .leftJoin(schema.users, eq(schema.leads.counselorId, schema.users.id))
      .where(eq(schema.leads.status, status))
      .orderBy(desc(schema.leads.createdAt));
    
    return result.map((item: any) => ({
      ...item,
      counselor: item.counselor || undefined
    }));
  }

  async getLeadsByCounselor(counselorId: number): Promise<LeadWithCounselor[]> {
    const result = await db
      .select({
        id: schema.leads.id,
        name: schema.leads.name,
        email: schema.leads.email,
        phone: schema.leads.phone,
        class: schema.leads.class,
        stream: schema.leads.stream,
        source: schema.leads.source,
        status: schema.leads.status,
        interestedProgram: schema.leads.interestedProgram,
        notes: schema.leads.notes,
        counselorId: schema.leads.counselorId,
        assignedAt: schema.leads.assignedAt,
        createdAt: schema.leads.createdAt,
        updatedAt: schema.leads.updatedAt,
        lastContactedAt: schema.leads.lastContactedAt,

        parentName: schema.leads.parentName,
        parentPhone: schema.leads.parentPhone,
        address: schema.leads.address,
        counselor: {
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          password: schema.users.password,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt
        }
      })
      .from(schema.leads)
      .leftJoin(schema.users, eq(schema.leads.counselorId, schema.users.id))
      .where(eq(schema.leads.counselorId, counselorId))
      .orderBy(desc(schema.leads.createdAt));
    
    return result.map((item: any) => ({
      ...item,
      counselor: item.counselor || undefined
    }));
  }

  async getLeadsByDateRange(startDate: Date, endDate: Date): Promise<LeadWithCounselor[]> {
    const result = await db
      .select({
        id: schema.leads.id,
        name: schema.leads.name,
        email: schema.leads.email,
        phone: schema.leads.phone,
        class: schema.leads.class,
        stream: schema.leads.stream,
        source: schema.leads.source,
        status: schema.leads.status,
        interestedProgram: schema.leads.interestedProgram,
        notes: schema.leads.notes,
        counselorId: schema.leads.counselorId,
        assignedAt: schema.leads.assignedAt,
        createdAt: schema.leads.createdAt,
        updatedAt: schema.leads.updatedAt,
        lastContactedAt: schema.leads.lastContactedAt,

        parentName: schema.leads.parentName,
        parentPhone: schema.leads.parentPhone,
        address: schema.leads.address,
        counselor: {
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          password: schema.users.password,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt
        }
      })
      .from(schema.leads)
      .leftJoin(schema.users, eq(schema.leads.counselorId, schema.users.id))
      .where(and(
        gte(schema.leads.createdAt, startDate),
        lte(schema.leads.createdAt, endDate)
      ))
      .orderBy(desc(schema.leads.createdAt));
    
    return result.map((item: any) => ({
      ...item,
      counselor: item.counselor || undefined
    }));
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const result = await db.insert(schema.leads).values(insertLead).returning();
    const lead = result[0];
    await this.notifyChange(
      'lead',
      'Lead Created',
      `New lead ${lead.name} (${lead.phone}) added`,
      'medium',
      'view_lead',
      lead.id.toString()
    );
    return lead;
  }

  async checkDuplicateLead(phone: string, email?: string): Promise<LeadWithCounselor | null> {
    // First check by phone number (required field)
    const phoneResult = await db
      .select()
      .from(schema.leads)
      .where(eq(schema.leads.phone, phone))
      .limit(1);
    
    if (phoneResult.length > 0) {
      // If found by phone, get the full lead with counselor details
      const lead = await this.getLead(phoneResult[0].id);
      return lead || null;
    }
    
    // If email is provided, also check by email
    if (email) {
      const emailResult = await db
        .select()
        .from(schema.leads)
        .where(eq(schema.leads.email, email))
        .limit(1);
      
      if (emailResult.length > 0) {
        const lead = await this.getLead(emailResult[0].id);
        return lead || null;
      }
    }
    
    return null;
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    const result = await db.update(schema.leads).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(schema.leads.id, id)).returning();
    const lead = result[0];
    if (lead) {
      await this.notifyChange(
        'lead',
        'Lead Updated',
        `Lead ${lead.name} (${lead.phone}) updated`,
        'medium',
        'view_lead',
        lead.id.toString()
      );
    }
    return lead;
  }

  async getRecentLeads(limit: number = 10): Promise<LeadWithCounselor[]> {
    const result = await db
      .select({
        lead: schema.leads,
        counselor: schema.users
      })
      .from(schema.leads)
      .leftJoin(schema.users, eq(schema.leads.counselorId, schema.users.id))
      .orderBy(desc(schema.leads.createdAt))
      .limit(limit);

    return result.map(({ lead, counselor }) => ({
      ...lead,
      counselor: counselor || undefined
    }));
  }

  async getLeadsRequiringFollowUp(): Promise<LeadWithCounselor[]> {
    const result = await db
      .select({
        id: schema.leads.id,
        name: schema.leads.name,
        email: schema.leads.email,
        phone: schema.leads.phone,
        class: schema.leads.class,
        stream: schema.leads.stream,
        source: schema.leads.source,
        status: schema.leads.status,
        interestedProgram: schema.leads.interestedProgram,
        notes: schema.leads.notes,
        counselorId: schema.leads.counselorId,
        assignedAt: schema.leads.assignedAt,
        createdAt: schema.leads.createdAt,
        updatedAt: schema.leads.updatedAt,
        lastContactedAt: schema.leads.lastContactedAt,

        parentName: schema.leads.parentName,
        parentPhone: schema.leads.parentPhone,
        address: schema.leads.address,
        counselor: {
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          password: schema.users.password,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt
        }
      })
      .from(schema.leads)
      .leftJoin(schema.users, eq(schema.leads.counselorId, schema.users.id))
      .where(eq(schema.leads.status, "interested"))
      .orderBy(desc(schema.leads.createdAt));
    
    return result.map((item: any) => ({
      ...item,
      counselor: item.counselor || undefined
    }));
  }

  // Follow-up operations
  async getFollowUp(id: number): Promise<FollowUp | undefined> {
    const result = await db.select().from(schema.followUps).where(eq(schema.followUps.id, id));
    return result[0];
  }

  async getFollowUpsByLead(leadId: number): Promise<FollowUp[]> {
    return await db.select().from(schema.followUps)
      .where(eq(schema.followUps.leadId, leadId))
      .orderBy(desc(schema.followUps.scheduledAt));
  }

  async getFollowUpsByCounselor(counselorId: number): Promise<FollowUp[]> {
    return await db.select().from(schema.followUps)
      .where(eq(schema.followUps.counselorId, counselorId))
      .orderBy(desc(schema.followUps.scheduledAt));
  }

  async createFollowUp(insertFollowUp: InsertFollowUp): Promise<FollowUp> {
    const result = await db.insert(schema.followUps).values(insertFollowUp).returning();
    return result[0];
  }

  async updateFollowUp(id: number, updates: Partial<FollowUp>): Promise<FollowUp | undefined> {
    const result = await db.update(schema.followUps).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(schema.followUps.id, id)).returning();
    return result[0];
  }

  async getOverdueFollowUps(): Promise<FollowUp[]> {
    const now = new Date();
    return await db.select().from(schema.followUps)
      .where(and(
        eq(schema.followUps.status, "scheduled"),
        sql`${schema.followUps.scheduledAt} < ${now}`
      ));
  }

  // Lead source operations
  async getAllLeadSources(): Promise<LeadSource[]> {
    return await db.select().from(schema.leadSources);
  }

  async createLeadSource(insertSource: InsertLeadSource): Promise<LeadSource> {
    const result = await db.insert(schema.leadSources).values(insertSource).returning();
    return result[0];
  }

  async updateLeadSource(id: number, updates: Partial<LeadSource>): Promise<LeadSource | undefined> {
    const result = await db.update(schema.leadSources).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(schema.leadSources.id, id)).returning();
    return result[0];
  }

  // Analytics operations
  async getLeadStats(): Promise<{
    totalLeads: number;
    hotLeads: number;
    conversions: number;
    newLeadsToday: number;
  }> {
    const totalLeads = await db.select({ count: sql<number>`count(*)` }).from(schema.leads);
    const hotLeads = await db.select({ count: sql<number>`count(*)` }).from(schema.leads).where(eq(schema.leads.status, "hot"));
    const conversions = await db.select({ count: sql<number>`count(*)` }).from(schema.leads).where(eq(schema.leads.status, "enrolled"));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newLeadsToday = await db.select({ count: sql<number>`count(*)` }).from(schema.leads)
      .where(gte(schema.leads.createdAt, today));

    return {
      totalLeads: totalLeads[0].count,
      hotLeads: hotLeads[0].count,
      conversions: conversions[0].count,
      newLeadsToday: newLeadsToday[0].count
    };
  }

  async getEnrollmentStats(): Promise<{
    totalEnrollments: number;
    activeEnrollments: number;
    newEnrollmentsThisMonth: number;
    enrollmentTrend: number;
  }> {
    // Get total enrollments (leads with status "enrolled")
    const totalEnrollments = await db.select({ count: sql<number>`count(*)` })
      .from(schema.leads)
      .where(eq(schema.leads.status, "enrolled"));
    
    // Get active enrollments (leads with status "enrolled")
    const activeEnrollments = await db.select({ count: sql<number>`count(*)` })
      .from(schema.leads)
      .where(eq(schema.leads.status, "enrolled"));
    
    // Get new enrollments this month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    
    const newEnrollmentsThisMonth = await db.select({ count: sql<number>`count(*)` })
      .from(schema.leads)
      .where(
        and(
          eq(schema.leads.status, "enrolled"),
          gte(schema.leads.createdAt, monthStart),
          lte(schema.leads.createdAt, monthEnd)
        )
      );
    
    // Get previous month enrollments for trend calculation
    const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthEnd = new Date(currentYear, currentMonth, 0);
    
    const prevMonthEnrollments = await db.select({ count: sql<number>`count(*)` })
      .from(schema.leads)
      .where(
        and(
          eq(schema.leads.status, "enrolled"),
          gte(schema.leads.createdAt, prevMonthStart),
          lte(schema.leads.createdAt, prevMonthEnd)
        )
      );
    
    // Calculate trend percentage
    const currentCount = newEnrollmentsThisMonth[0]?.count || 0;
    const prevCount = prevMonthEnrollments[0]?.count || 0;
    const enrollmentTrend = prevCount > 0 ? ((currentCount - prevCount) / prevCount) * 100 : 0;
    
    return {
      totalEnrollments: totalEnrollments[0]?.count || 0,
      activeEnrollments: activeEnrollments[0]?.count || 0,
      newEnrollmentsThisMonth: currentCount,
      enrollmentTrend: Math.round(enrollmentTrend * 100) / 100, // Round to 2 decimal places
    };
  }

  async getLeadSourcePerformance(): Promise<Array<{
    source: string;
    totalLeads: number;
    conversions: number;
    conversionRate: number;
  }>> {
    const sources = await db.select().from(schema.leadSources);
    const performance = [];

    for (const source of sources) {
      const totalLeads = await db.select({ count: sql<number>`count(*)` })
        .from(schema.leads)
        .where(eq(schema.leads.source, source.name));
      
      const conversions = await db.select({ count: sql<number>`count(*)` })
        .from(schema.leads)
        .where(and(
          eq(schema.leads.source, source.name),
          eq(schema.leads.status, "enrolled")
        ));

      const total = totalLeads[0].count;
      const converted = conversions[0].count;
      
      performance.push({
        source: source.name,
        totalLeads: total,
        conversions: converted,
        conversionRate: total > 0 ? (converted / total) * 100 : 0
      });
    }

    return performance;
  }

  async getMonthlyEnrollmentTrend(): Promise<Array<{
    month: string;
    enrollments: number;
  }>> {
    // Get enrollments by month for the last 12 months
    const enrollments = await db
      .select({
        month: sql<string>`to_char(${schema.leads.updatedAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)`
      })
      .from(schema.leads)
      .where(eq(schema.leads.status, "enrolled"))
      .groupBy(sql`to_char(${schema.leads.updatedAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${schema.leads.updatedAt}, 'YYYY-MM')`);

    return enrollments.map(e => ({
      month: e.month,
      enrollments: e.count
    }));
  }

  // Staff operations - simplified implementations to avoid errors
  async getStaff(id: number): Promise<Staff | undefined> {
    const result = await db.select().from(schema.staff).where(eq(schema.staff.id, id));
    return result[0];
  }

  async getAllStaff(): Promise<StaffWithDetails[]> {
    return await db.select().from(schema.staff);
  }

  async getStaffByRole(role: string): Promise<Staff[]> {
    return await db.select().from(schema.staff).where(eq(schema.staff.role, role));
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    // Insert staff record
    const result = await db.insert(schema.staff).values(insertStaff).returning();
    const staff = result[0];
    await this.notifyChange(
      'staff',
      'Staff Added',
      `Staff ${staff.name} added`,
      'medium',
      'view_staff',
      staff.id.toString()
    );

    // After staff is created, create payroll for the current month only
    if (staff && staff.id) {
      const now = new Date();
      const month = now.getMonth() + 1; // JS months are 0-based
      const year = now.getFullYear();
      const basicSalary = Number(staff.salary) || 0;
      const attendedDays = 30;
      const allowances = 0;
      const deductions = 0;
      const overtime = 0;
      const netSalary = basicSalary; // No deductions/allowances/overtime by default
      try {
        await this.createPayroll({
          staffId: staff.id,
          month,
          year,
          basicSalary: basicSalary.toString(),
          allowances: allowances.toString(),
          deductions: deductions.toString(),
          overtime: overtime.toString(),
          netSalary: netSalary.toString(),
          attendedDays,
          status: 'pending',
        });
      } catch (err) {
        // Log error but do not block staff creation
        console.error('Failed to create payroll for new staff:', err);
      }
    }
    return staff;
  }

  async updateStaff(id: number, updates: Partial<Staff>): Promise<Staff | undefined> {
    try {
      console.log("=== updateStaff DEBUG ===");
      console.log("ID:", id);
      console.log("Updates received:", updates);
      console.log("isActive in updates:", 'isActive' in updates);
      console.log("isActive value:", updates.isActive);
      console.log("isActive type:", typeof updates.isActive);
      
      // First, let's get the current staff record to see what we're working with
      const currentStaff = await this.getStaff(id);
      console.log("Current staff record:", currentStaff);
      
      // Prepare the update object with explicit field mapping
      const updateData: any = { ...updates };
      
      // Handle date fields
      const dateFields = ["dateOfJoining", "createdAt", "updatedAt"];
      for (const field of dateFields) {
        if (Object.prototype.hasOwnProperty.call(updates, field)) {
          const val = (updates as any)[field];
          if (field === "dateOfJoining" && val instanceof Date) {
            updateData[field] = val.toISOString().split('T')[0];
          } else if ((field === "createdAt" || field === "updatedAt") && typeof val === "string" && !isNaN(Date.parse(val))) {
            updateData[field] = new Date(val);
          }
        }
      }
      
      console.log("After date processing, updateData:", updateData);
      
      // Special handling for isActive - this is our main fix
      if ('isActive' in updates) {
        const isActiveValue = Boolean(updates.isActive);
        console.log("Converting isActive:", updates.isActive, "->", isActiveValue);
        updateData.isActive = isActiveValue;
      }
      
      console.log("Final updateData before DB call:", updateData);
      
      const result = await db.update(schema.staff)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(schema.staff.id, id))
        .returning();
        
      const updatedStaff = result[0];
      console.log("Database result:", updatedStaff);
      console.log("=== updateStaff COMPLETE ===");

      // --- Update payroll if name or salary changed ---
      if (updatedStaff && (updates.name || updates.salary)) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const payroll = await this.getPayrollByStaffMonthYear(id, month, year);
        if (payroll) {
          const basicSalary = updates.salary !== undefined ? Number(updates.salary) : Number(updatedStaff.salary);
          const attendedDays = payroll.attendedDays || 30;
          const netSalary = (basicSalary / 30) * attendedDays;
          await this.updatePayroll(payroll.id, {
            basicSalary: basicSalary.toString(),
            netSalary: netSalary.toString()
          });
        }
      }
      
      if (updatedStaff && currentStaff) {
        // Track specific field changes with detailed notifications
        const changes: string[] = [];
        
        // Track name changes
        if (updates.name && currentStaff.name !== updatedStaff.name) {
          changes.push(`name from "${currentStaff.name}" to "${updatedStaff.name}"`);
        await this.notifyChange(
          'staff',
            'Employee Name Updated',
            `Employee name changed from "${currentStaff.name}" to "${updatedStaff.name}"`,
          'medium',
            'staff_profile_change',
          updatedStaff.id.toString()
        );
        }
        
        // Track email changes
        if (updates.email && currentStaff.email !== updatedStaff.email) {
          changes.push(`email from "${currentStaff.email || 'N/A'}" to "${updatedStaff.email || 'N/A'}"`);
          await this.notifyChange(
            'staff',
            'Employee Email Updated',
            `Email updated for ${updatedStaff.name} from "${currentStaff.email || 'N/A'}" to "${updatedStaff.email || 'N/A'}"`,
            'medium',
            'staff_profile_change',
            updatedStaff.id.toString()
          );
        }
        
        // Track phone changes
        if (updates.phone && currentStaff.phone !== updatedStaff.phone) {
          changes.push(`phone from "${currentStaff.phone}" to "${updatedStaff.phone}"`);
          await this.notifyChange(
            'staff',
            'Employee Phone Updated',
            `Phone updated for ${updatedStaff.name} from "${currentStaff.phone}" to "${updatedStaff.phone}"`,
            'medium',
            'staff_profile_change',
            updatedStaff.id.toString()
          );
        }
        
        // Track role changes
        if (updates.role && currentStaff.role !== updatedStaff.role) {
          changes.push(`role from "${currentStaff.role}" to "${updatedStaff.role}"`);
          await this.notifyChange(
            'staff',
            'Employee Role Updated',
            `Role updated for ${updatedStaff.name} from "${currentStaff.role}" to "${updatedStaff.role}"`,
            'high',
            'staff_role_change',
            updatedStaff.id.toString()
          );
        }
        
        // Track department changes
        if (updates.department && currentStaff.department !== updatedStaff.department) {
          changes.push(`department from "${currentStaff.department || 'N/A'}" to "${updatedStaff.department || 'N/A'}"`);
          await this.notifyChange(
            'staff',
            'Employee Department Updated',
            `Department updated for ${updatedStaff.name} from "${currentStaff.department || 'N/A'}" to "${updatedStaff.department || 'N/A'}"`,
            'medium',
            'staff_department_change',
            updatedStaff.id.toString()
          );
        }
        
        // Track address changes
        if (updates.address && currentStaff.address !== updatedStaff.address) {
          changes.push(`address updated`);
          await this.notifyChange(
            'staff',
            'Employee Address Updated',
            `Address updated for ${updatedStaff.name}`,
            'low',
            'staff_profile_change',
            updatedStaff.id.toString()
          );
        }
        
        // Track emergency contact changes
        if (updates.emergencyContact && currentStaff.emergencyContact !== updatedStaff.emergencyContact) {
          changes.push(`emergency contact from "${currentStaff.emergencyContact || 'N/A'}" to "${updatedStaff.emergencyContact || 'N/A'}"`);
          await this.notifyChange(
            'staff',
            'Emergency Contact Updated',
            `Emergency contact updated for ${updatedStaff.name} from "${currentStaff.emergencyContact || 'N/A'}" to "${updatedStaff.emergencyContact || 'N/A'}"`,
            'medium',
            'staff_profile_change',
            updatedStaff.id.toString()
          );
        }
        
        // Track qualifications changes
        if (updates.qualifications && currentStaff.qualifications !== updatedStaff.qualifications) {
          changes.push(`qualifications updated`);
          await this.notifyChange(
            'staff',
            'Employee Qualifications Updated',
            `Qualifications updated for ${updatedStaff.name}`,
            'medium',
            'staff_profile_change',
            updatedStaff.id.toString()
          );
        }
        
        // Track banking details changes
        if (updates.bankAccountNumber && currentStaff.bankAccountNumber !== updatedStaff.bankAccountNumber) {
          changes.push(`bank account number updated`);
          await this.notifyChange(
            'staff',
            'Banking Details Updated',
            `Bank account number updated for ${updatedStaff.name}`,
            'medium',
            'staff_banking_change',
            updatedStaff.id.toString()
          );
        }
        
        if (updates.ifscCode && currentStaff.ifscCode !== updatedStaff.ifscCode) {
          changes.push(`IFSC code updated`);
          await this.notifyChange(
            'staff',
            'Banking Details Updated',
            `IFSC code updated for ${updatedStaff.name}`,
            'medium',
            'staff_banking_change',
            updatedStaff.id.toString()
          );
        }
        
        if (updates.panNumber && currentStaff.panNumber !== updatedStaff.panNumber) {
          changes.push(`PAN number updated`);
          await this.notifyChange(
            'staff',
            'PAN Number Updated',
            `PAN number updated for ${updatedStaff.name}`,
            'medium',
            'staff_profile_change',
            updatedStaff.id.toString()
          );
        }
        
        // Track date of joining changes
        if (updates.dateOfJoining && currentStaff.dateOfJoining !== updatedStaff.dateOfJoining) {
          const oldDate = currentStaff.dateOfJoining ? new Date(currentStaff.dateOfJoining).toLocaleDateString() : 'N/A';
          const newDate = updatedStaff.dateOfJoining ? new Date(updatedStaff.dateOfJoining).toLocaleDateString() : 'N/A';
          changes.push(`date of joining from "${oldDate}" to "${newDate}"`);
          await this.notifyChange(
            'staff',
            'Date of Joining Updated',
            `Date of joining updated for ${updatedStaff.name} from "${oldDate}" to "${newDate}"`,
            'medium',
            'staff_profile_change',
            updatedStaff.id.toString()
          );
        }
        
        // Track salary changes (existing logic)
        if (updates.salary && Number(currentStaff.salary) !== Number(updatedStaff.salary)) {
          changes.push(`salary from ₹${Number(currentStaff.salary).toLocaleString()} to ₹${Number(updatedStaff.salary).toLocaleString()}`);
          await this.notifyChange(
            'staff',
            'Employee Salary Updated',
            `Salary updated for ${updatedStaff.name} from ₹${Number(currentStaff.salary).toLocaleString()} to ₹${Number(updatedStaff.salary).toLocaleString()}`,
            'high',
            'staff_salary_change',
            updatedStaff.id.toString()
          );
        }
        
        // Track status changes (existing logic)
        if ('isActive' in updates && currentStaff.isActive !== updatedStaff.isActive) {
          const statusAction = updatedStaff.isActive ? 'activated' : 'deactivated';
          changes.push(`status ${statusAction}`);
          await this.notifyChange(
            'staff',
            'Employee Status Changed',
            `Employee ${updatedStaff.name} has been ${statusAction}`,
            'high',
            'staff_status_change',
            updatedStaff.id.toString()
          );
        }
        
        // Create a comprehensive summary notification if multiple changes were made
        if (changes.length > 1) {
          await this.notifyChange(
            'staff',
            'Employee Profile Updated',
            `${updatedStaff.name}'s profile was updated: ${changes.join(', ')}`,
            'medium',
            'staff_bulk_update',
            updatedStaff.id.toString()
          );
        }
      }
      
      return updatedStaff;
    } catch (error) {
      console.error("Error in updateStaff:", error);
      throw error;
    }
  }

  async deleteStaff(id: number): Promise<boolean> {
    // Replicate deleteLead behaviour for staff
    const staff = await this.getStaff(id);
    if (!staff) return false;
    try {
      await this.notifyChange(
        'staff',
        'Staff Deleted',
        `Staff ${staff.name} deleted`,
        'medium',
        'staff_deleted',
        staff.id.toString()
      );
      const insertObj = {
        original_staff_id: staff.id,
        employee_id: staff.employeeId,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        department: staff.department,
        date_of_joining: staff.dateOfJoining,
        salary: staff.salary,
        is_active: staff.isActive,
        address: staff.address,
        emergency_contact: staff.emergencyContact,
        qualifications: staff.qualifications,
        bank_account_number: staff.bankAccountNumber,
        ifsc_code: staff.ifscCode,
        pan_number: staff.panNumber,
        created_at: staff.createdAt,
        updated_at: staff.updatedAt,
        deleted_at: new Date()
      };
      await db.insert(schema.recentlyDeletedEmployee).values(insertObj);
      await db.delete(schema.payroll).where(eq(schema.payroll.staffId, id));
      await db.delete(schema.attendance).where(eq(schema.attendance.staffId, id));
      await db.delete(schema.staff).where(eq(schema.staff.id, id));
      return true;
    } catch (err) {
      console.error('Error moving staff to recently_deleted_employee:', err);
      throw err;
    }
  }

  async checkDuplicateStaff(phone: string, email?: string, employeeId?: string): Promise<Staff | null> {
    // First check by phone number (required field)
    if (phone) {
      const phoneResult = await db
        .select()
        .from(schema.staff)
        .where(eq(schema.staff.phone, phone))
        .limit(1);
      
      if (phoneResult.length > 0) {
        return phoneResult[0];
      }
    }
    
    // Check by employee ID if provided
    if (employeeId) {
      const employeeIdResult = await db
        .select()
        .from(schema.staff)
        .where(eq(schema.staff.employeeId, employeeId))
        .limit(1);
      
      if (employeeIdResult.length > 0) {
        return employeeIdResult[0];
      }
    }
    
    // If email is provided, also check by email
    if (email) {
      const emailResult = await db
        .select()
        .from(schema.staff)
        .where(eq(schema.staff.email, email))
        .limit(1);
      
      if (emailResult.length > 0) {
        return emailResult[0];
      }
    }
    
    return null;
  }

  async getStaffActivities(staffId: number): Promise<any[]> {
    try {
      console.log(`[ACTIVITY DEBUG] Fetching activities for staff ID: ${staffId}`);
      
      // Get notifications related to this staff member - simplified query
      const staffNotifications = await db
        .select()
        .from(schema.notifications)
        .where(eq(schema.notifications.actionId, staffId.toString()))
        .orderBy(desc(schema.notifications.createdAt))
        .limit(50);

      console.log(`[ACTIVITY DEBUG] Found ${staffNotifications.length} notifications for staff ${staffId}`);
      console.log(`[ACTIVITY DEBUG] Sample notification:`, staffNotifications[0]);

      // Also get payroll records for this staff member
      const payrollRecords = await db
        .select({
          id: schema.payroll.id,
          month: schema.payroll.month,
          year: schema.payroll.year,
          status: schema.payroll.status,
          netSalary: schema.payroll.netSalary,
          createdAt: schema.payroll.createdAt,
        })
        .from(schema.payroll)
        .where(eq(schema.payroll.staffId, staffId))
        .orderBy(desc(schema.payroll.createdAt));

      // Combine and format activities
      const activities: any[] = [];

      // Add notification-based activities
      staffNotifications.forEach(notification => {
        activities.push({
          id: `notification_${notification.id}`,
          type: 'notification',
          title: notification.title,
          message: notification.message,
          priority: notification.priority || 'medium',
          actionType: notification.actionType || 'view_staff',
          timestamp: notification.createdAt,
          metadata: notification.metadata ? (typeof notification.metadata === 'string' ? JSON.parse(notification.metadata) : notification.metadata) : null,
        });
      });

      // Add payroll-based activities
      payrollRecords.forEach(payroll => {
        activities.push({
          id: `payroll_${payroll.id}`,
          type: 'payroll',
          title: `Payroll ${payroll.status === 'processed' ? 'Processed' : 'Generated'}`,
          message: `${payroll.month}/${payroll.year} - ₹${Number(payroll.netSalary).toLocaleString()} (${payroll.status})`,
          priority: payroll.status === 'processed' ? 'high' : 'medium',
          actionType: payroll.status === 'processed' ? 'payroll_processed' : 'payroll_generated',
          timestamp: payroll.createdAt,
          metadata: {
            payrollId: payroll.id,
            month: payroll.month,
            year: payroll.year,
            netSalary: payroll.netSalary,
            status: payroll.status,
          },
        });
      });

      // Sort all activities by timestamp (newest first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      console.log(`[ACTIVITY DEBUG] Returning ${activities.length} activities for staff ${staffId}`);
      
      // Return real activities data (latest 20 activities)
      return activities.slice(0, 20);
    } catch (error) {
      console.error("Error fetching staff activities:", error);
      console.error("Error details:", error);
      return [];
    }
  }

  // Attendance operations
  async getAttendance(id: number): Promise<Attendance | undefined> {
    const result = await db.select().from(schema.attendance).where(eq(schema.attendance.id, id));
    return result[0];
  }

  async getAttendanceByStaff(staffId: number, month?: number, year?: number): Promise<Attendance[]> {
    let query = db.select().from(schema.attendance).where(eq(schema.attendance.staffId, staffId));
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query = query.where(and(
        eq(schema.attendance.staffId, staffId),
        gte(schema.attendance.date, startDate.toISOString().split('T')[0]),
        lte(schema.attendance.date, endDate.toISOString().split('T')[0])
      )) as any;
    }
    
    return await query;
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const result = await db.insert(schema.attendance).values(insertAttendance).returning();
    return result[0];
  }

  async updateAttendance(id: number, updates: Partial<Attendance>): Promise<Attendance | undefined> {
    const result = await db.update(schema.attendance).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(schema.attendance.id, id)).returning();
    return result[0];
  }

  async getAttendanceStats(month: number, year: number): Promise<{
    totalPresent: number;
    totalAbsent: number;
    averageHours: number;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const stats = await db
      .select({
        totalPresent: sql<number>`count(*) filter (where status = 'present')`,
        totalAbsent: sql<number>`count(*) filter (where status = 'absent')`,
        averageHours: sql<number>`avg(CASE WHEN hours_worked IS NOT NULL THEN hours_worked ELSE 0 END)`
      })
      .from(schema.attendance)
      .where(and(
        gte(schema.attendance.date, startDate.toISOString().split('T')[0]),
        lte(schema.attendance.date, endDate.toISOString().split('T')[0])
      ));

    return {
      totalPresent: stats[0].totalPresent || 0,
      totalAbsent: stats[0].totalAbsent || 0,
      averageHours: stats[0].averageHours || 0
    };
  }

  // Payroll operations
  async getPayroll(id: number): Promise<Payroll | undefined> {
    try {
      if (!db) {
        console.log("Database not available, returning undefined for payroll");
        return undefined;
      }
      const result = await db.select().from(schema.payroll).where(eq(schema.payroll.id, id));
      return result[0];
    } catch (error) {
      console.error("Error fetching payroll by ID:", error);
      return undefined;
    }
  }

  async getPayrollByStaff(staffId: number): Promise<Payroll[]> {
    try {
      if (!db) {
        console.log("Database not available, returning empty payroll array for staff");
        return [];
      }
      return await db.select().from(schema.payroll).where(eq(schema.payroll.staffId, staffId));
    } catch (error) {
      console.error("Error fetching payroll by staff:", error);
      return [];
    }
  }

  async getPayrollByMonth(month: number, year: number): Promise<Payroll[]> {
    try {
      if (!db) {
        console.log("Database not available, returning empty payroll array for month");
        return [];
      }
      return await db.select().from(schema.payroll)
        .where(and(
          eq(schema.payroll.month, month),
          eq(schema.payroll.year, year)
        ));
    } catch (error) {
      console.error("Error fetching payroll by month:", error);
      return [];
    }
  }

  async getAllPayroll(): Promise<Payroll[]> {
    try {
      if (!db) {
        console.log("Database not available, returning empty payroll array");
        return [];
      }
      return await db.select().from(schema.payroll);
    } catch (error) {
      console.error("Error fetching payroll:", error);
      return [];
    }
  }

  async createPayroll(insertPayroll: InsertPayroll): Promise<Payroll> {
    try {
      if (!db) {
        console.log("Database not available, cannot create payroll");
        throw new Error("Database not available");
      }
      // Ensure attendedDays is included if present
      console.log('Storage createPayroll - Input data:', JSON.stringify(insertPayroll, null, 2));
      const result = await db.insert(schema.payroll).values(insertPayroll).returning();
      console.log('Storage createPayroll - Result:', JSON.stringify(result[0], null, 2));
      
      const payroll = result[0];
      
      // Get staff details for notification
      const staff = await this.getStaff(payroll.staffId);
      if (staff) {
        await this.notifyChange(
          'payroll',
          'Payroll Generated',
          `Payroll generated for ${staff.name} - Month: ${payroll.month}/${payroll.year}, Net Salary: ₹${Number(payroll.netSalary).toLocaleString()}`,
          'medium',
          'view_payroll',
          payroll.id.toString()
        );
      }
      
      return payroll;
    } catch (error) {
      console.error("Error creating payroll:", error);
      throw error;
    }
  }

  async updatePayroll(id: number, updates: Partial<Payroll>): Promise<Payroll | undefined> {
    // Get current payroll for comparison
    const currentPayroll = await this.getPayroll(id);
    
    const result = await db.update(schema.payroll).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(schema.payroll.id, id)).returning();
    
    const updatedPayroll = result[0];
    
    if (updatedPayroll && currentPayroll) {
      const staff = await this.getStaff(updatedPayroll.staffId);
      if (staff) {
        // Log status changes
        if (updates.status && currentPayroll.status !== updatedPayroll.status) {
          await this.notifyChange(
            'payroll',
            'Payroll Status Updated',
            `Payroll status changed for ${staff.name} from ${currentPayroll.status} to ${updatedPayroll.status} - Month: ${updatedPayroll.month}/${updatedPayroll.year}`,
            updatedPayroll.status === 'processed' ? 'high' : 'medium',
            'payroll_status_change',
            updatedPayroll.id.toString()
          );
        }
        
        // Log salary changes
        if (updates.netSalary && Number(currentPayroll.netSalary) !== Number(updatedPayroll.netSalary)) {
          await this.notifyChange(
            'payroll',
            'Payroll Amount Updated',
            `Net salary updated for ${staff.name} from ₹${Number(currentPayroll.netSalary).toLocaleString()} to ₹${Number(updatedPayroll.netSalary).toLocaleString()} - Month: ${updatedPayroll.month}/${updatedPayroll.year}`,
            'medium',
            'payroll_amount_change',
            updatedPayroll.id.toString()
          );
        }
      }
    }
    
    return updatedPayroll;
  }

  async deletePayroll(id: number): Promise<boolean> {
    const result = await db.delete(schema.payroll).where(eq(schema.payroll.id, id));
    return true;
  }

  async getPayrollStats(month: number, year: number): Promise<{
    totalSalaries: number;
    totalDeductions: number;
    totalAllowances: number;
    netPayroll: number;
  }> {
    const stats = await db
      .select({
        totalSalaries: sql<number>`sum(CAST(base_salary AS DECIMAL))`,
        totalDeductions: sql<number>`sum(CAST(deductions AS DECIMAL))`,
        totalAllowances: sql<number>`sum(CAST(allowances AS DECIMAL))`,
        netPayroll: sql<number>`sum(CAST(net_salary AS DECIMAL))`
      })
      .from(schema.payroll)
      .where(and(
        eq(schema.payroll.month, month),
        eq(schema.payroll.year, year)
      ));

    return {
      totalSalaries: stats[0].totalSalaries || 0,
      totalDeductions: stats[0].totalDeductions || 0,
      totalAllowances: stats[0].totalAllowances || 0,
      netPayroll: stats[0].netPayroll || 0
    };
  }

  async getPayrollByStaffMonthYear(staffId: number, month: number, year: number): Promise<Payroll | undefined> {
    try {
      if (!db) {
        console.log("Database not available, returning undefined for payroll by staff/month/year");
        return undefined;
      }
      const result = await db.select().from(schema.payroll)
        .where(and(
          eq(schema.payroll.staffId, staffId),
          eq(schema.payroll.month, month),
          eq(schema.payroll.year, year)
        ));
      return result[0];
    } catch (error) {
      console.error("Error fetching payroll by staff/month/year:", error);
      return undefined;
    }
  }

  // Expense operations
  async getExpense(id: number): Promise<ExpenseWithApprover | undefined> {
    const result = await db
      .select({
        id: schema.expenses.id,
        description: schema.expenses.description,
        amount: schema.expenses.amount,
        category: schema.expenses.category,
        date: schema.expenses.date,
        status: schema.expenses.status,
        receiptUrl: schema.expenses.receiptUrl,
        submittedBy: schema.expenses.submittedBy,
        approvedBy: schema.expenses.approvedBy,
        createdAt: schema.expenses.createdAt,
        updatedAt: schema.expenses.updatedAt,
        approver: {
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          password: schema.users.password,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt
        }
      })
      .from(schema.expenses)
      .leftJoin(schema.users, eq(schema.expenses.approvedBy, schema.users.id))
      .where(eq(schema.expenses.id, id));
    
    return result[0] ? {
      ...result[0],
      approver: result[0].approver || undefined
    } : undefined;
  }

  async getAllExpenses(): Promise<ExpenseWithApprover[]> {
    const result = await db
      .select({
        id: schema.expenses.id,
        description: schema.expenses.description,
        amount: schema.expenses.amount,
        category: schema.expenses.category,
        date: schema.expenses.date,
        status: schema.expenses.status,
        receiptUrl: schema.expenses.receiptUrl,
        submittedBy: schema.expenses.submittedBy,
        approvedBy: schema.expenses.approvedBy,
        createdAt: schema.expenses.createdAt,
        updatedAt: schema.expenses.updatedAt,
        approver: {
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          password: schema.users.password,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt
        }
      })
      .from(schema.expenses)
      .leftJoin(schema.users, eq(schema.expenses.approvedBy, schema.users.id));
    
    return result.map(item => ({
      ...item,
      approver: item.approver || undefined
    }));
  }

  async getExpensesByCategory(category: string): Promise<ExpenseWithApprover[]> {
    const result = await db
      .select({
        id: schema.expenses.id,
        description: schema.expenses.description,
        amount: schema.expenses.amount,
        category: schema.expenses.category,
        date: schema.expenses.date,
        status: schema.expenses.status,
        receiptUrl: schema.expenses.receiptUrl,
        submittedBy: schema.expenses.submittedBy,
        approvedBy: schema.expenses.approvedBy,
        createdAt: schema.expenses.createdAt,
        updatedAt: schema.expenses.updatedAt,
        approver: {
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          password: schema.users.password,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt
        }
      })
      .from(schema.expenses)
      .leftJoin(schema.users, eq(schema.expenses.approvedBy, schema.users.id))
      .where(eq(schema.expenses.category, category));
    
    return result.map(item => ({
      ...item,
      approver: item.approver || undefined
    }));
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<ExpenseWithApprover[]> {
    const result = await db
      .select({
        id: schema.expenses.id,
        description: schema.expenses.description,
        amount: schema.expenses.amount,
        category: schema.expenses.category,
        date: schema.expenses.date,
        status: schema.expenses.status,
        receiptUrl: schema.expenses.receiptUrl,
        submittedBy: schema.expenses.submittedBy,
        approvedBy: schema.expenses.approvedBy,
        createdAt: schema.expenses.createdAt,
        updatedAt: schema.expenses.updatedAt,
        approver: {
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          password: schema.users.password,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt
        }
      })
      .from(schema.expenses)
      .leftJoin(schema.users, eq(schema.expenses.approvedBy, schema.users.id))
      .where(and(
        gte(schema.expenses.date, startDate),
        lte(schema.expenses.date, endDate)
      ));
    
    return result.map(item => ({
      ...item,
      approver: item.approver || undefined
    }));
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const result = await db.insert(schema.expenses).values(insertExpense).returning();
    const expense = result[0];
    await this.notifyChange(
      'expense',
      'Expense Added',
      `Expense of ₹${expense.amount} (${expense.category}) added`,
      'medium',
      'view_expense',
      expense.id.toString()
    );
    return expense;
  }

  async updateExpense(id: number, updates: Partial<Expense>): Promise<Expense | undefined> {
    const result = await db.update(schema.expenses).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(schema.expenses.id, id)).returning();
    const expense = result[0];
    if (expense) {
      await this.notifyChange(
        'expense',
        'Expense Updated',
        `Expense ID ${expense.id} updated`,
        'medium',
        'view_expense',
        expense.id.toString()
      );
    }
    return expense;
  }

  async getExpenseStats(month: number, year: number): Promise<{
    totalExpenses: number;
    categoryBreakdown: Array<{ category: string; amount: number }>;
    monthlyTrend: Array<{ month: string; amount: number }>;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const total = await db
      .select({
        total: sql<number>`sum(CAST(amount AS DECIMAL))`
      })
      .from(schema.expenses)
      .where(and(
        gte(schema.expenses.date, startDate.toISOString().split('T')[0]),
        lte(schema.expenses.date, endDate.toISOString().split('T')[0])
      ));

    const categoryBreakdown = await db
      .select({
        category: schema.expenses.category,
        amount: sql<number>`sum(CAST(amount AS DECIMAL))`
      })
      .from(schema.expenses)
      .where(and(
        gte(schema.expenses.date, startDate.toISOString().split('T')[0]),
        lte(schema.expenses.date, endDate.toISOString().split('T')[0])
      ))
      .groupBy(schema.expenses.category);

    const monthlyTrend = await db
      .select({
        month: sql<string>`to_char(${schema.expenses.date}::date, 'YYYY-MM')`,
        amount: sql<number>`sum(CAST(amount AS DECIMAL))`
      })
      .from(schema.expenses)
      .groupBy(sql`to_char(${schema.expenses.date}::date, 'YYYY-MM')`)
      .orderBy(sql`to_char(${schema.expenses.date}::date, 'YYYY-MM')`);

    return {
      totalExpenses: total[0].total || 0,
      categoryBreakdown: categoryBreakdown.map(c => ({
        category: c.category,
        amount: c.amount
      })),
      monthlyTrend: monthlyTrend.map(m => ({
        month: m.month,
        amount: m.amount
      }))
    };
  }

  async deleteExpense(id: number): Promise<boolean> {
    const expense = await this.getExpense(id);
    if (!expense) return false;
    
    await db.delete(schema.expenses).where(eq(schema.expenses.id, id));
    
    await this.notifyChange(
      'expense',
      'Expense Deleted',
      `Expense of ₹${expense.amount} (${expense.category}) deleted`,
      'medium',
      'view_expense',
      id.toString()
    );
    
    return true;
  }

  // Student operations
  async getStudent(id: number): Promise<StudentWithFees | undefined> {
    const student = await db.select().from(schema.students).where(eq(schema.students.id, id));
    if (!student[0]) return undefined;

    const feeStructure = await db.select().from(schema.feeStructure);
    // TODO: Re-enable after migration adds studentId columns
    // const payments = await db.select().from(schema.feePayments).where(eq(schema.feePayments.studentId, id));
    // const eMandate = await db.select().from(schema.eMandates).where(eq(schema.eMandates.studentId, id));
    const payments: any[] = [];
    const eMandate: any[] = [];
    const emiSchedule = await db.select().from(schema.emiSchedule).where(eq(schema.emiSchedule.studentId, id));

    return {
      ...student[0],
      feeStructure: feeStructure[0],
      payments,
      eMandate: eMandate[0],
      emiSchedule
    };
  }

  async getAllStudents(): Promise<StudentWithFees[]> {
    const students = await db.select().from(schema.students);
    return students.map(student => ({
      ...student,
      feeStructure: undefined,
      payments: [],
      eMandate: undefined,
      emiSchedule: []
    }));
  }

  async getStudentsByClass(className: string): Promise<Student[]> {
    return await db.select().from(schema.students).where(eq(schema.students.class, className));
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const result = await db.insert(schema.students).values(insertStudent).returning();
    const student = result[0];
    await this.notifyChange(
      'student',
      'Student Added',
      `Student ${student.name} admitted`,
      'medium',
      'view_student',
      student.id.toString()
    );
    return student;
  }

  async updateStudent(id: number, updates: Partial<Student>): Promise<Student | undefined> {
    const result = await db.update(schema.students).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(schema.students.id, id)).returning();
    const student = result[0];
    if (student) {
      await this.notifyChange(
        'student',
        'Student Updated',
        `Student ${student.name} record updated`,
        'medium',
        'view_student',
        student.id.toString()
      );
    }
    return student;
  }

  async deleteStudent(id: number): Promise<boolean> {
    try {
      console.log(`\n=== DETAILED STUDENT DELETION DEBUG FOR ID: ${id} ===`);
      
      // First, get student details for debugging
      const student = await db.select().from(schema.students).where(eq(schema.students.id, id));
      if (student.length === 0) {
        console.log(`Student with ID ${id} not found`);
        throw new Error(`Student with ID ${id} not found`);
      }
      console.log(`Found student: ${student[0].name} (${student[0].rollNumber})`);
      
      // Check all EMI schedules (both active and inactive) for debugging
      console.log(`\n--- Checking ALL EMI schedules for student ${id} ---`);
      const allEmiSchedules = await db
        .select()
        .from(schema.emiSchedule)
        .where(eq(schema.emiSchedule.studentId, id));
      
      console.log(`Total EMI schedules found: ${allEmiSchedules.length}`);
      allEmiSchedules.forEach(emi => {
        console.log(`  - EMI ${emi.id}: Status="${emi.status}", Amount=${emi.amount}, Due=${emi.dueDate}`);
      });
      
      // Check specifically for active EMI schedules
      const activeEmiSchedules = allEmiSchedules.filter(emi => 
        emi.status === 'pending' || emi.status === 'overdue'
      );
      console.log(`🎯 ACTIVE EMI SCHEDULES FILTER:`);
      console.log(`  - Total schedules: ${allEmiSchedules.length}`);
      console.log(`  - Filtered to active: ${activeEmiSchedules.length}`);
      console.log(`  - Filter criteria: status === 'pending' OR status === 'overdue'`);
      allEmiSchedules.forEach(emi => {
        const isActive = emi.status === 'pending' || emi.status === 'overdue';
        console.log(`    * Schedule ${emi.id}: status="${emi.status}" → ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
      });
      
      // Check all EMI plans (both active and inactive) for debugging
      console.log(`\n--- Checking ALL EMI plans for student ${id} ---`);
      const allEmiPlans = await db
        .select()
        .from(schema.emiPlans)
        .where(eq(schema.emiPlans.studentId, id));
      
      console.log(`Total EMI plans found: ${allEmiPlans.length}`);
      allEmiPlans.forEach(plan => {
        console.log(`  - Plan ${plan.id}: Status="${plan.status}", Total=${plan.totalAmount}, Installments=${plan.numberOfInstallments}`);
      });
      
      // Check specifically for active EMI plans
      const activeEmiPlans = allEmiPlans.filter(plan => plan.status === 'active');
      console.log(`🎯 ACTIVE EMI PLANS FILTER:`);
      console.log(`  - Total plans: ${allEmiPlans.length}`);
      console.log(`  - Filtered to active: ${activeEmiPlans.length}`);
      console.log(`  - Filter criteria: status === 'active'`);
      allEmiPlans.forEach(plan => {
        const isActive = plan.status === 'active';
        console.log(`    * Plan ${plan.id}: status="${plan.status}" → ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
      });
      
      // Check for pending regular fee payments
      console.log(`\n--- Checking pending fee payments for student ${id} ---`);
      const pendingFeePayments = await db
        .select()
        .from(schema.feePayments)
        .where(
          and(
            eq(schema.feePayments.leadId, id),
            eq(schema.feePayments.status, 'pending')
          )
        );
      
      console.log(`Found ${pendingFeePayments.length} pending fee payment(s)`);
      pendingFeePayments.forEach(payment => {
        console.log(`  - Payment ${payment.id}: ₹${payment.amount} (${payment.paymentMode}) - ${payment.status}`);
      });
      
      console.log(`🎯 FEE PAYMENTS QUERY DEBUG:`);
      console.log(`  - Query: SELECT * FROM fee_payments WHERE lead_id = ${id} AND status = 'pending'`);
      console.log(`  - Total pending payments found: ${pendingFeePayments.length}`);
      
      // Check for active mandates
      console.log(`\n--- Checking active mandates for student ${id} ---`);
      const activeMandates = await db
        .select()
        .from(schema.eMandates)
        .where(
          and(
            eq(schema.eMandates.leadId, id),
            eq(schema.eMandates.status, 'active')
          )
        );
      
      console.log(`Found ${activeMandates.length} active mandate(s)`);
      activeMandates.forEach(mandate => {
        console.log(`  - Mandate ${mandate.id}: ${mandate.mandateId} - Max Amount: ₹${mandate.maxAmount} (${mandate.status})`);
      });
      
      console.log(`🎯 E-MANDATES QUERY DEBUG:`);
      console.log(`  - Query: SELECT * FROM e_mandates WHERE lead_id = ${id} AND status = 'active'`);
      console.log(`  - Total active mandates found: ${activeMandates.length}`);
      
      // If there are blocking records, prepare detailed information
      console.log(`\n🔍 FINANCIAL OBLIGATION SUMMARY:`);
      console.log(`  - Active EMI Schedules: ${activeEmiSchedules.length}`);
      console.log(`  - Active EMI Plans: ${activeEmiPlans.length}`);
      console.log(`  - Pending Fee Payments: ${pendingFeePayments.length}`);
      console.log(`  - Active Mandates: ${activeMandates.length}`);
      
      const hasBlockingRecords = activeEmiSchedules.length > 0 || activeEmiPlans.length > 0 || pendingFeePayments.length > 0 || activeMandates.length > 0;
      console.log(`  - TOTAL BLOCKING RECORDS: ${hasBlockingRecords ? 'YES' : 'NO'}`);
      
      if (hasBlockingRecords) {
        console.log(`❌ BLOCKING: Student deletion prevented by active financial records`);
        console.log(`🎯 ABOUT TO THROW ACTIVE_FINANCIAL_OBLIGATIONS ERROR`);
        
        const blockingReasons = [];
        const blockingDetails = {
          activePayments: [],
          activePlans: [],
          pendingFeePayments: [],
          activeMandates: [],
          totalOutstanding: 0
        };
        
        if (activeEmiSchedules.length > 0) {
          console.log(`  - ${activeEmiSchedules.length} active EMI payment(s):`);
          activeEmiSchedules.forEach(emi => {
            console.log(`    EMI ${emi.id}: ₹${emi.amount} due ${emi.dueDate} (${emi.status})`);
            blockingDetails.activePayments.push({
              id: emi.id,
              amount: parseFloat(emi.amount),
              dueDate: emi.dueDate,
              status: emi.status,
              installmentNumber: emi.installmentNumber
            });
            blockingDetails.totalOutstanding += parseFloat(emi.amount);
          });
          blockingReasons.push(`${activeEmiSchedules.length} pending EMI payment${activeEmiSchedules.length > 1 ? 's' : ''}`);
        }
        
        if (activeEmiPlans.length > 0) {
          console.log(`  - ${activeEmiPlans.length} active EMI plan(s):`);
          activeEmiPlans.forEach(plan => {
            console.log(`    Plan ${plan.id}: ₹${plan.totalAmount} (${plan.numberOfInstallments} installments)`);
            blockingDetails.activePlans.push({
              id: plan.id,
              totalAmount: parseFloat(plan.totalAmount),
              installmentAmount: parseFloat(plan.installmentAmount),
              numberOfInstallments: plan.numberOfInstallments,
              startDate: plan.startDate,
              endDate: plan.endDate
            });
          });
          blockingReasons.push(`${activeEmiPlans.length} active EMI plan${activeEmiPlans.length > 1 ? 's' : ''}`);
        }
        
        if (pendingFeePayments.length > 0) {
          console.log(`  - ${pendingFeePayments.length} pending fee payment(s):`);
          pendingFeePayments.forEach(payment => {
            console.log(`    Payment ${payment.id}: ₹${payment.amount} (${payment.paymentMode})`);
            blockingDetails.pendingFeePayments.push({
              id: payment.id,
              amount: parseFloat(payment.amount),
              paymentMode: payment.paymentMode,
              paymentDate: payment.paymentDate,
              receiptNumber: payment.receiptNumber,
              installmentNumber: payment.installmentNumber
            });
            blockingDetails.totalOutstanding += parseFloat(payment.amount);
          });
          blockingReasons.push(`${pendingFeePayments.length} pending fee payment${pendingFeePayments.length > 1 ? 's' : ''}`);
        }
        
        if (activeMandates.length > 0) {
          console.log(`  - ${activeMandates.length} active mandate(s):`);
          activeMandates.forEach(mandate => {
            console.log(`    Mandate ${mandate.id}: ${mandate.mandateId} (Max: ₹${mandate.maxAmount})`);
            blockingDetails.activeMandates.push({
              id: mandate.id,
              mandateId: mandate.mandateId,
              maxAmount: parseFloat(mandate.maxAmount),
              bankAccount: mandate.bankAccount,
              bankName: mandate.bankName,
              startDate: mandate.startDate,
              endDate: mandate.endDate
            });
          });
          blockingReasons.push(`${activeMandates.length} active mandate${activeMandates.length > 1 ? 's' : ''}`);
        }
        
        const errorMessage = `Cannot delete student: ${blockingReasons.join(' and ')}`;
        const error: any = new Error(errorMessage);
        error.code = 'ACTIVE_FINANCIAL_OBLIGATIONS';
        error.details = blockingDetails;
        console.log(`🎯 THROWING ERROR:`, {
          message: errorMessage,
          code: error.code,
          detailsKeys: Object.keys(blockingDetails),
          hasDetails: !!blockingDetails
        });
        throw error;
      }
      
      console.log(`✅ No active EMI schedules or plans found - proceeding with deletion`);
      console.log(`🎯 CONTINUING TO DELETION LOGIC (no financial blocking records found)`);
      
      // Check academic records
      console.log(`\n--- Checking academic records for student ${id} ---`);
      const academicRecords = await db
        .select()
        .from(schema.academicRecords)
        .where(eq(schema.academicRecords.studentId, id));
      console.log(`Found ${academicRecords.length} academic record(s)`);
      
      // Check student engagement records
      console.log(`\n--- Checking student engagement records for student ${id} ---`);
      const engagementRecords = await db
        .select()
        .from(schema.studentEngagement)
        .where(eq(schema.studentEngagement.studentId, id));
      console.log(`Found ${engagementRecords.length} engagement record(s)`);
      
      // Check fee payments (using leadId as studentId relationship)
      console.log(`\n--- Checking fee payments for student ${id} ---`);
      const feePayments = await db
        .select()
        .from(schema.feePayments)
        .where(eq(schema.feePayments.leadId, id));
      console.log(`Found ${feePayments.length} fee payment(s) linked via leadId`);
      
      // Note: AI interventions foreign key constraint has been removed
      // Students can now be deleted without worrying about AI records
      console.log(`\n--- AI interventions constraint removed ---`);
      console.log(`Students can be deleted without clearing AI records first`);
      
      
      console.log(`\n--- Starting deletion process for student ${id} ---`);
      
      // Delete all related records in correct order
      if (allEmiSchedules.length > 0) {
        console.log(`Deleting ${allEmiSchedules.length} EMI schedule(s)...`);
        await db.delete(schema.emiSchedule).where(eq(schema.emiSchedule.studentId, id));
        console.log(`✅ EMI schedules deleted`);
      }
      
      if (allEmiPlans.length > 0) {
        console.log(`Deleting ${allEmiPlans.length} EMI plan(s)...`);
        await db.delete(schema.emiPlans).where(eq(schema.emiPlans.studentId, id));
        console.log(`✅ EMI plans deleted`);
      }
      
      if (academicRecords.length > 0) {
        console.log(`Deleting ${academicRecords.length} academic record(s)...`);
        await db.delete(schema.academicRecords).where(eq(schema.academicRecords.studentId, id));
        console.log(`✅ Academic records deleted`);
      }
      
      if (engagementRecords.length > 0) {
        console.log(`Deleting ${engagementRecords.length} engagement record(s)...`);
        await db.delete(schema.studentEngagement).where(eq(schema.studentEngagement.studentId, id));
        console.log(`✅ Student engagement records deleted`);
      }
      
      if (feePayments.length > 0) {
        console.log(`Deleting ${feePayments.length} fee payment(s)...`);
        await db.delete(schema.feePayments).where(eq(schema.feePayments.leadId, id));
        console.log(`✅ Fee payments deleted`);
      }
      
      // AI interventions no longer block student deletion (constraint removed)
      console.log(`✅ AI interventions constraint removed - no cleanup needed`);
      
      
      // Now delete the student record
      console.log(`\n--- Deleting student record ${id} ---`);
      const result = await db.delete(schema.students).where(eq(schema.students.id, id));
      console.log(`Delete operation completed, checking result...`);
      
      // Verify deletion
      const remainingStudent = await db.select().from(schema.students).where(eq(schema.students.id, id));
      
      if (remainingStudent.length === 0) {
        console.log(`✅ SUCCESS: Student ${id} (${student[0].name}) deleted successfully!`);
        await this.notifyChange(
          'student',
          'Student Deleted',
          `Student ${student[0].name} deleted successfully`,
          'high',
          'view_student',
          id.toString()
        );
        console.log(`=== END DELETION DEBUG ===\n`);
        return true;
      } else {
        console.log(`❌ FAILED: Student ${id} still exists after deletion attempt`);
        console.log(`Remaining student:`, remainingStudent[0]);
        console.log(`=== END DELETION DEBUG ===\n`);
        return false;
      }
    } catch (error) {
      console.error(`❌ ERROR during student deletion:`, error);
      console.log(`=== END DELETION DEBUG ===\n`);
      
      // Re-throw financial obligation errors so they can be handled properly by the API
      if (error.code === 'ACTIVE_FINANCIAL_OBLIGATIONS') {
        console.log(`🎯 RE-THROWING FINANCIAL OBLIGATIONS ERROR to API route`);
        throw error;
      }
      
      // Only return false for unexpected errors
      return false;
    }
  }

  async convertLeadToStudent(leadId: number, studentData: InsertStudent): Promise<Student> {
    const student = await this.createStudent(studentData);
    await this.updateLead(leadId, { status: "enrolled" });
    return student;
  }

  // Fee management operations
  async getFeeStructure(id: number): Promise<FeeStructure | undefined> {
    const result = await db.select().from(schema.feeStructure).where(eq(schema.feeStructure.id, id));
    return result[0];
  }

  async getAllFeeStructures(): Promise<FeeStructure[]> {
    return await db.select().from(schema.feeStructure);
  }

  async getFeeStructureByStudent(studentId: number): Promise<FeeStructure[]> {
    return await db.select().from(schema.feeStructure);
  }

  async createFeeStructure(insertFeeStructure: InsertFeeStructure): Promise<FeeStructure> {
    const result = await db.insert(schema.feeStructure).values(insertFeeStructure).returning();
    return result[0];
  }

  async updateFeeStructure(id: number, updates: Partial<FeeStructure>): Promise<FeeStructure | undefined> {
    const result = await db.update(schema.feeStructure).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(schema.feeStructure.id, id)).returning();
    return result[0];
  }

  async getFeePayment(id: number): Promise<FeePayment | undefined> {
    const result = await db.select().from(schema.feePayments).where(eq(schema.feePayments.id, id));
    return result[0];
  }

  async getAllFeePayments(): Promise<FeePayment[]> {
    return await db.select().from(schema.feePayments);
  }

  async getFeePaymentsByStudent(studentId: number): Promise<FeePayment[]> {
    return await db.select().from(schema.feePayments).where(eq(schema.feePayments.leadId, studentId));
  }

  async createFeePayment(insertFeePayment: InsertFeePayment): Promise<FeePayment> {
    const result = await db.insert(schema.feePayments).values(insertFeePayment).returning();
    const payment = result[0];
    await this.notifyChange(
      'fee',
      'Fee Payment Recorded',
      `Payment of ₹${payment.amount} received`,
      'medium',
      'view_payment',
      payment.id.toString()
    );
    return payment;
  }

  async getFeeStats(): Promise<{
    totalPending: number;
    totalPaid: number;
    totalOverdue: number;
    collectionRate: number;
  }> {
    return {
      totalPending: 0,
      totalPaid: 0,
      totalOverdue: 0,
      collectionRate: 0
    };
  }

  // E-Mandate operations
  async getEMandate(id: number): Promise<EMandate | undefined> {
    const result = await db.select().from(schema.eMandates).where(eq(schema.eMandates.id, id));
    return result[0];
  }

  async getEMandateByStudent(studentId: number): Promise<EMandate | undefined> {
    // TODO: Re-enable after migration adds studentId column to eMandates
    // const result = await db.select().from(schema.eMandates).where(eq(schema.eMandates.studentId, studentId));
    // return result[0];
    return undefined;
  }

  async getAllEMandates(): Promise<EMandate[]> {
    return await db.select().from(schema.eMandates);
  }

  async createEMandate(insertEMandate: InsertEMandate): Promise<EMandate> {
    const result = await db.insert(schema.eMandates).values(insertEMandate).returning();
    return result[0];
  }

  async updateEMandate(id: number, updates: Partial<EMandate>): Promise<EMandate | undefined> {
    const result = await db.update(schema.eMandates).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(schema.eMandates.id, id)).returning();
    return result[0];
  }

  async deleteEMandate(id: number): Promise<boolean> {
    try {
      console.log(`🔥 deleteEMandate called with id: ${id}`);
      
      // Follow the same simple pattern as other working delete functions
      const mandate = await this.getEMandate(id);
      console.log(`🔍 getEMandate result:`, mandate ? JSON.stringify(mandate, null, 2) : 'Not found');
      if (!mandate) {
        console.log(`❌ Mandate ${id} not found, returning false`);
        return false;
      }
      
      // First, delete all EMI schedule records that reference this mandate
      console.log(`🧹 Deleting EMI schedule records for mandate ${id}...`);
      const emiScheduleDeleteResult = await db.delete(schema.emiSchedule)
        .where(eq(schema.emiSchedule.eMandateId, id));
      console.log(`🧹 EMI schedule delete result:`, emiScheduleDeleteResult);
      
      console.log(`🗑️ About to execute delete for mandate ${id}...`);
      const result = await db.delete(schema.eMandates).where(eq(schema.eMandates.id, id));
      console.log(`✅ Delete executed, result:`, result);
      return true;
    } catch (error: any) {
      console.error(`💥 deleteEMandate error for id ${id}:`, error?.message);
      console.error(`💥 Full error:`, error);
      return false;
    }
  }

  async getEmiSchedule(id: number): Promise<EmiSchedule | undefined> {
    const result = await db.select().from(schema.emiSchedule).where(eq(schema.emiSchedule.id, id));
    return result[0];
  }

  async getEmiScheduleByMandate(eMandateId: number): Promise<EmiSchedule[]> {
    return await db.select().from(schema.emiSchedule).where(eq(schema.emiSchedule.eMandateId, eMandateId));
  }

  async createEmiSchedule(insertEmiSchedule: InsertEmiSchedule): Promise<EmiSchedule> {
    const result = await db.insert(schema.emiSchedule).values(insertEmiSchedule).returning();
    return result[0];
  }

  async updateEmiSchedule(id: number, updates: Partial<EmiSchedule>): Promise<EmiSchedule | undefined> {
    const result = await db.update(schema.emiSchedule).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(schema.emiSchedule.id, id)).returning();
    return result[0];
  }

  async getUpcomingEmis(): Promise<EmiSchedule[]> {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    return await db.select().from(schema.emiSchedule)
      .where(and(
        eq(schema.emiSchedule.status, "scheduled"),
        lte(schema.emiSchedule.dueDate, sevenDaysFromNow.toISOString().split('T')[0])
      ));
  }

  // Global Class Fee Management
  async getGlobalClassFee(id: number): Promise<GlobalClassFee | undefined> {
    const result = await db.select().from(schema.globalClassFees).where(eq(schema.globalClassFees.id, id));
    return result[0];
  }

  async getAllGlobalClassFees(): Promise<GlobalClassFee[]> {
    return await db.select().from(schema.globalClassFees);
  }

  async getGlobalClassFeesByClass(className: string): Promise<GlobalClassFee[]> {
    return await db.select().from(schema.globalClassFees).where(eq(schema.globalClassFees.className, className));
  }

  async createGlobalClassFee(globalClassFee: InsertGlobalClassFee): Promise<GlobalClassFee> {
    const result = await db.insert(schema.globalClassFees).values(globalClassFee).returning();
    return result[0];
  }

  async updateGlobalClassFee(id: number, updates: Partial<GlobalClassFee>): Promise<GlobalClassFee | undefined> {
    const result = await db.update(schema.globalClassFees).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(schema.globalClassFees.id, id)).returning();
    return result[0];
  }

  async deleteGlobalClassFee(id: number): Promise<boolean> {
    await db.delete(schema.globalClassFees).where(eq(schema.globalClassFees.id, id));
    return true;
  }

  // EMI Plan operations
  async getEmiPlan(id: number): Promise<EmiPlan | undefined> {
    const result = await db.select().from(schema.emiPlans).where(eq(schema.emiPlans.id, id));
    return result[0];
  }

  async getEmiPlansByStudent(studentId: number): Promise<EmiPlan[]> {
    return await db.select().from(schema.emiPlans).where(eq(schema.emiPlans.studentId, studentId));
  }

  async getAllEmiPlans(): Promise<EmiPlan[]> {
    return await db.select().from(schema.emiPlans);
  }

  async createEmiPlan(insertEmiPlan: InsertEmiPlan): Promise<EmiPlan> {
    const result = await db.insert(schema.emiPlans).values(insertEmiPlan).returning();
    const plan = result[0];
    await this.notifyChange(
      'emi',
      'EMI Plan Created',
      `EMI plan for student ${plan.studentId} created`,
      'medium',
      'view_emi_plan',
      plan.id.toString()
    );
    return plan;
  }

  async updateEmiPlan(id: number, updates: Partial<EmiPlan>): Promise<EmiPlan | undefined> {
    const result = await db.update(schema.emiPlans).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(schema.emiPlans.id, id)).returning();
    const plan = result[0];
    if (plan) {
      await this.notifyChange(
        'emi',
        'EMI Plan Updated',
        `EMI plan ID ${plan.id} updated`,
        'medium',
        'view_emi_plan',
        plan.id.toString()
      );
    }
    return plan;
  }

  async deleteEmiPlan(id: number): Promise<boolean> {
    await db.delete(schema.emiPlans).where(eq(schema.emiPlans.id, id));
    await this.notifyChange(
      'emi',
      'EMI Plan Deleted',
      `EMI plan ID ${id} deleted`,
      'medium',
      'emi_plan_deleted',
      id.toString()
    );
    return true;
  }

  // EMI Payment tracking operations
  async getPendingEmisForPlan(emiPlanId: number): Promise<any[]> {
    try {
      const emiPlan = await this.getEmiPlan(emiPlanId);
      if (!emiPlan) {
        throw new Error("EMI plan not found");
      }

      // Get all payments for this EMI plan
      const payments = await db.select().from(schema.feePayments)
        .where(eq(schema.feePayments.leadId, emiPlan.studentId))
        .orderBy(schema.feePayments.installmentNumber);

      // Calculate which EMIs are pending
      const paidInstallments = new Set(payments.map(p => p.installmentNumber));
      const pendingEmis = [];

      for (let i = 1; i <= emiPlan.emiPeriod; i++) {
        if (!paidInstallments.has(i)) {
          pendingEmis.push({
            installmentNumber: i,
            amount: emiPlan.emiAmount,
            dueDate: this.calculateEmiDueDate(emiPlan.startDate, i, emiPlan.frequency),
            status: 'pending'
          });
        }
      }

      return pendingEmis;
    } catch (error) {
      console.error("Error getting pending EMIs:", error);
      throw error;
    }
  }

  async getEmiPaymentProgress(emiPlanId: number): Promise<any> {
    try {
      const emiPlan = await this.getEmiPlan(emiPlanId);
      if (!emiPlan) {
        throw new Error("EMI plan not found");
      }

      // Get all payments for this EMI plan
      const payments = await db.select().from(schema.feePayments)
        .where(eq(schema.feePayments.leadId, emiPlan.studentId))
        .orderBy(schema.feePayments.installmentNumber);

      const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const totalAmount = parseFloat(emiPlan.totalAmount);
      const paidInstallments = payments.length;
      const totalInstallments = emiPlan.emiPeriod;
      const nextInstallment = paidInstallments + 1;

      return {
        emiPlanId,
        totalAmount,
        totalPaid,
        remainingAmount: totalAmount - totalPaid,
        paidInstallments,
        totalInstallments,
        nextInstallment: nextInstallment <= totalInstallments ? nextInstallment : null,
        completionPercentage: (paidInstallments / totalInstallments) * 100,
        isCompleted: paidInstallments >= totalInstallments,
        payments: payments.map(p => ({
          installmentNumber: p.installmentNumber,
          amount: p.amount,
          paymentDate: p.paymentDate,
          status: p.status
        }))
      };
    } catch (error) {
      console.error("Error getting EMI payment progress:", error);
      throw error;
    }
  }

  async checkEmiPlanCompletion(emiPlanId: number): Promise<boolean> {
    try {
      const progress = await this.getEmiPaymentProgress(emiPlanId);
      return progress.isCompleted;
    } catch (error) {
      console.error("Error checking EMI plan completion:", error);
      return false;
    }
  }

  private calculateEmiDueDate(startDate: string, installmentNumber: number, frequency: string): string {
    const start = new Date(startDate);
    let dueDate = new Date(start);
    
    switch (frequency) {
      case 'monthly':
        dueDate.setMonth(start.getMonth() + installmentNumber - 1);
        break;
      case 'quarterly':
        dueDate.setMonth(start.getMonth() + (installmentNumber - 1) * 3);
        break;
      case 'yearly':
        dueDate.setFullYear(start.getFullYear() + installmentNumber - 1);
        break;
      default:
        dueDate.setMonth(start.getMonth() + installmentNumber - 1);
    }
    
    return dueDate.toISOString().split('T')[0];
  }

  // Fee Payment Deletion
  async deleteFeePayment(id: number): Promise<boolean> {
    await db.delete(schema.feePayments).where(eq(schema.feePayments.id, id));
    return true;
  }

  // Notifications
  async getNotification(id: number): Promise<Notification | undefined> {
    const result = await db.select().from(schema.notifications).where(eq(schema.notifications.id, id));
    return result[0];
  }

  async getNotificationsByUser(userId: number, limit?: number): Promise<Notification[]> {
    let query = db.select().from(schema.notifications).where(eq(schema.notifications.userId, userId)).orderBy(desc(schema.notifications.createdAt));
    if (limit) {
      query = query.limit(limit);
    }
    return await query;
  }

  async getUnreadNotificationsByUser(userId: number): Promise<Notification[]> {
    const result = await db.select().from(schema.notifications)
      .where(and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.read, false)
      ))
      .orderBy(desc(schema.notifications.createdAt));
    return result;
  }

  async getNotificationsByType(type: string, limit?: number): Promise<Notification[]> {
    let query = db.select().from(schema.notifications)
      .where(eq(schema.notifications.type, type))
      .orderBy(desc(schema.notifications.createdAt));
    if (limit) {
      query = query.limit(limit);
    }
    return await query;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(schema.notifications).values(notification).returning();
    return result[0];
  }

  async updateNotification(id: number, updates: Partial<Notification>): Promise<Notification | undefined> {
    const result = await db.update(schema.notifications)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(schema.notifications.id, id))
      .returning();
    return result[0];
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const result = await db.update(schema.notifications)
      .set({
        read: true,
        updatedAt: new Date()
      })
      .where(eq(schema.notifications.id, id))
      .returning();
    return result[0];
  }

  async markAllNotificationsAsRead(userId: number): Promise<number> {
    const result = await db.update(schema.notifications)
      .set({
        read: true,
        updatedAt: new Date()
      })
      .where(eq(schema.notifications.userId, userId))
      .returning();
    return result.length;
  }

  async deleteNotification(id: number): Promise<boolean> {
    await db.delete(schema.notifications).where(eq(schema.notifications.id, id));
    return true;
  }

  async deleteAllNotifications(userId: number): Promise<number> {
    try {
      // First, count how many notifications will be deleted
      const [countResult] = await db.select({ count: sql<number>`count(*)` })
        .from(schema.notifications)
        .where(eq(schema.notifications.userId, userId));
      
      const count = Number(countResult.count);
      
      // Then perform the delete operation
      await db.delete(schema.notifications)
        .where(eq(schema.notifications.userId, userId));
      
      return count;
    } catch (error) {
      console.error("Error in deleteAllNotifications:", error);
      throw error;
    }
  }

  async getNotificationStats(userId: number): Promise<{
    total: number;
    unread: number;
    byType: Array<{ type: string; count: number }>;
  }> {
    const [totalResult] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId));
    
    const [unreadResult] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.read, false)
      ));
    
    const notificationsByType = await db.select({ 
      type: schema.notifications.type, 
      count: sql<number>`count(*)` 
    })
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .groupBy(schema.notifications.type);

    return {
      total: totalResult.count,
      unread: unreadResult.count,
      byType: notificationsByType.map(n => ({
        type: n.type,
        count: n.count
      }))
    };
  }

  async restoreLead(originalLeadId: number): Promise<Lead | undefined> {
    // Find the deleted lead in recentlyDeletedLeads table
    const deletedLeadResult = await db
      .select()
      .from(schema.recentlyDeletedLeads)
      .where(eq(schema.recentlyDeletedLeads.original_lead_id, originalLeadId))
      .limit(1);
    
    if (deletedLeadResult.length === 0) {
      console.log("No deleted lead found with original_lead_id:", originalLeadId);
      return undefined;
    }
    
    const deletedLead = deletedLeadResult[0];
    console.log("Restoring deleted lead:", deletedLead);
    
    try {
      // Insert the lead back into the main leads table
      const restoredLeadData = {
        name: deletedLead.name,
        email: deletedLead.email,
        phone: deletedLead.phone,
        class: deletedLead.class,
        stream: deletedLead.stream,
        status: "new", // Reset status to new when restoring
        source: deletedLead.source,
        counselorId: deletedLead.counselor_id,
        assignedAt: deletedLead.assigned_at,
        lastContactedAt: deletedLead.last_contacted_at,

        notes: deletedLead.notes,
        parentName: deletedLead.parent_name,
        parentPhone: deletedLead.parent_phone,
        address: deletedLead.address,
        interestedProgram: deletedLead.interested_program,
      };
      
      const [restoredLead] = await db
        .insert(schema.leads)
        .values(restoredLeadData)
        .returning();
      
      // Remove from recentlyDeletedLeads table
      await db
        .delete(schema.recentlyDeletedLeads)
        .where(eq(schema.recentlyDeletedLeads.id, deletedLead.id));
      
      // Create notification
      await this.notifyChange(
        'lead',
        'Lead Restored',
        `Lead ${restoredLead.name} (${restoredLead.phone}) has been restored`,
        'medium',
        'lead_restored',
        restoredLead.id.toString()
      );
      
      console.log("Lead restored successfully:", restoredLead);
      return restoredLead;
      
    } catch (error) {
      console.error("Error restoring lead:", error);
      throw error;
    }
  }

  async deleteLead(id: number): Promise<void> {
    console.log(`=== DELETING LEAD ${id} ===`);
    
    // Fetch the lead
    const lead = await this.getLead(id);
    console.log("Found lead to delete:", lead ? `${lead.name} (${lead.phone})` : "No lead found");
    
    if (!lead) {
      console.log("Lead not found, aborting deletion");
      return;
    }
    
    try {
      console.log("Step 1: Creating notification...");
      // Notify before actual deletion so details are still available
      await this.notifyChange(
        'lead',
        'Lead Deleted',
        `Lead ${lead.name} (${lead.phone}) deleted`,
        'medium',
        'lead_deleted',
        lead.id.toString()
      );
      console.log("Notification created successfully");

      console.log("Step 2: Preparing insert data for recently_deleted_leads...");
      const insertObj = {
        original_lead_id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        class: lead.class,
        stream: lead.stream,
        status: lead.status,
        source: lead.source,
        counselor_id: lead.counselorId,
        assigned_at: lead.assignedAt,
        created_at: lead.createdAt,
        updated_at: lead.updatedAt,
        last_contacted_at: lead.lastContactedAt,

        notes: lead.notes,
        parent_name: lead.parentName,
        parent_phone: lead.parentPhone,
        address: lead.address,
        interested_program: lead.interestedProgram,
        deleted_at: new Date(),
      };
      
      console.log('Step 3: Inserting into recently_deleted_leads...');
      await db.insert(schema.recentlyDeletedLeads).values(insertObj);
      console.log('Insert into recently_deleted_leads successful');
      
      console.log('Step 4: Deleting from main leads table...');
      const deleteResult = await db.delete(schema.leads).where(eq(schema.leads.id, id));
      console.log('Delete from main leads table successful, rows affected:', deleteResult.rowCount);
      
      console.log(`=== LEAD ${id} DELETION COMPLETED ===`);
    } catch (err) {
      console.error('Error during lead deletion process:', err);
      console.error('Error details:', err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  /**
   * Generate payroll for all active staff for a given month and year.
   * Skips staff who already have a payroll record for that month/year.
   * Uses default values for allowances, deductions, overtime, attendedDays, and status.
   */
  async generateMonthlyPayrollForAllStaff(month: number, year: number): Promise<{ created: number; skipped: number; errors: any[] }> {
    const staffList = await this.getAllStaff();
    let created = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (const staff of staffList) {
      // Only process active staff
      if (staff.isActive === false) continue;
      // Check if payroll already exists for this staff/month/year
      const existing = await this.getPayrollByStaffMonthYear(staff.id, month, year);
      if (existing) {
        skipped++;
        continue;
      }
      try {
        const basicSalary = Number(staff.salary) || 0;
        const attendedDays = 30;
        const allowances = 0;
        const deductions = 0;
        const overtime = 0;
        const netSalary = basicSalary; // No deductions/allowances/overtime by default
        await this.createPayroll({
          staffId: staff.id,
          month,
          year,
          basicSalary: basicSalary.toString(),
          allowances: allowances.toString(),
          deductions: deductions.toString(),
          overtime: overtime.toString(),
          netSalary: netSalary.toString(),
          attendedDays,
          status: 'pending',
        });
        created++;
      } catch (err) {
        errors.push({ staffId: staff.id, error: err });
      }
    }
    return { created, skipped, errors };
  }

  /**
   * Helper to create system-generated notifications.
   * Defaults to admin user (ID 1) until authentication is wired up.
   */
  private async notifyChange(
    type: string,
    title: string,
    message: string,
    priority: 'high' | 'medium' | 'low' = 'medium',
    actionType?: string,
    actionId?: string
  ): Promise<void> {
    try {
      await this.createNotification({
        userId: 1,
        type,
        title,
        message,
        priority,
        actionType,
        actionId,
        metadata: JSON.stringify({ systemGenerated: true })
      });
    } catch (err) {
      console.error('Failed to create notification', err);
    }
  }
}

// Initialize database with admin user and CSV data
async function initializeBasicData() {
  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByUsername("admin");
    if (!existingAdmin) {
      // Create admin user only if it doesn't exist
      await storage.createUser({
        username: "admin",
        password: "admin123",
        role: "admin",
        email: "admin@school.com"
      });
      console.log("Admin user created successfully!");
    } else {
      console.log("Admin user already exists.");
    }

    // Import real CSV data
    try {
      const { importCSVLeads, realLeadsData } = await import("./csv-import");
      await importCSVLeads(realLeadsData);
      console.log("CSV leads data imported successfully!");
    } catch (error) {
      console.log("CSV import skipped or error occurred:", error);
    }
  } catch (error) {
    console.error("Error initializing basic data:", error);
  }
}

export const storage = new DatabaseStorage();

// Only seed when explicitly enabled in non-production environments
const shouldSeed = process.env.NODE_ENV !== 'production' && process.env.SEED_ON_START === 'true';

if (shouldSeed) {
  initializeBasicData().catch((err) => {
    console.error("Error initializing basic data:", err);
  });
}