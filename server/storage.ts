import { eq, and, ne, gte, lte, lt, sql, desc, or, isNull, isNotNull, not, asc, ilike, aliasedTable } from "drizzle-orm";
import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { cacheService } from "./cache-service.js";
import type {
  User, InsertUser, Lead, InsertLead, FollowUp, InsertFollowUp,
  LeadSource, InsertLeadSource, Staff, InsertStaff, Attendance, InsertAttendance,
  Payroll, InsertPayroll, Expense, InsertExpense, Student, InsertStudent,
  FeeStructure, InsertFeeStructure, FeePayment, InsertFeePayment,
  EMandate, InsertEMandate, EmiSchedule, InsertEmiSchedule,
  GlobalClassFee, InsertGlobalClassFee, EmiPlan, InsertEmiPlan,
  Notification, InsertNotification, MessageTemplate, InsertMessageTemplate,
  CommunicationLog, InsertCommunicationLog, Organization, InsertOrganization,
  DailyUpdate, InsertDailyUpdate, StudentAttendance, InsertStudentAttendance,
  PreschoolHomework, InsertPreschoolHomework, PreschoolAnnouncement, InsertPreschoolAnnouncement,
  PreschoolEvent, InsertPreschoolEvent,
  BusRoute, InsertBusRoute, BusStop, InsertBusStop, StudentBusAssignment, InsertStudentBusAssignment
} from "../shared/schema.js";

// Type definitions for complex queries
export type LeadWithCounselor = Lead & {
  counselor?: Staff;
};

export type ExpenseWithApprover = Expense & {
  approver?: any; // Decoupled from User type to avoid dependency
};

export type StaffWithDetails = Staff;

export type StudentWithFees = Student & {
  feeStructure?: FeeStructure;
  payments?: FeePayment[];
  eMandate?: EMandate;
  emiSchedule?: EmiSchedule[];
};

export interface IStorage {
  // Organizations
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationByName(name: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, updates: Partial<Organization>): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserNotificationPreferences(id: number, preferences: any): Promise<User | undefined>;
  getAllCounselors(): Promise<User[]>;


  // Leads
  getLead(id: number): Promise<LeadWithCounselor | undefined>;
  getAllLeads(includeDeleted?: boolean): Promise<LeadWithCounselor[]>;
  getLeadsByStatus(status: string): Promise<LeadWithCounselor[]>;
  getLeadsByCounselor(counselorId: number): Promise<LeadWithCounselor[]>;
  getLeadsByDateRange(startDate: Date, endDate: Date): Promise<LeadWithCounselor[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  checkDuplicateLead(phone: string, email?: string): Promise<LeadWithCounselor | null>;
  updateLead(id: number, updates: Partial<Lead>): Promise<LeadWithCounselor | undefined>;
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

  getDashboardAnalytics(organizationId?: number): Promise<{
    kpis: {
      leadManagement: { value: number; change: string };
      studentFee: { value: number; change: string };
      staffManagement: { value: number; change: string };
      expenses: { value: number; change: string };
    };
    leadAnalytics: {
      sourceDistribution: Array<{ label: string; value: number }>;
      monthlyTrends: Array<{ month: string; leads: number; conversions: number }>;
      conversionRate: number;
      bestPerformingSource: string;
    };
    feeAnalytics: {
      paidVsPending: Array<{ label: string; value: number }>;
      monthlyCollection: Array<{ month: string; collected: number; pending: number }>;
      collectionRate: number;
      totalRevenue: number;
    };
    staffAnalytics: {
      departmentDistribution: Array<{ label: string; value: number }>;
      totalStaff: number;
      attendanceRate: number;
    };
    expenseAnalytics: {
      categoryBreakdown: Array<{ label: string; value: number }>;
      totalExpenses: number;
      monthlyTrend: Array<{ month: string; amount: number }>;
    };
  }>;

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
  getAllExpenses(organizationId?: number): Promise<ExpenseWithApprover[]>;
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

  // Communication Logs
  createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog>;
  getCommunicationLogs(limit?: number): Promise<CommunicationLog[]>;

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
  updateFeePayment(id: number, updates: Partial<FeePayment>): Promise<FeePayment | undefined>;

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
  createEmiPlan(emiPlan: InsertEmiPlan, installments?: { amount: string, dueDate: string }[]): Promise<EmiPlan>;
  updateEmiPlan(id: number, updates: Partial<EmiPlan>): Promise<EmiPlan | undefined>;
  deleteEmiPlan(id: number): Promise<boolean>;

  // EMI Payment tracking operations
  getPendingEmisForPlan(emiPlanId: number): Promise<any[]>;
  getEmiPlanSchedule(emiPlanId: number): Promise<any[]>;
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

  // Message Templates
  getMessageTemplate(id: number): Promise<MessageTemplate | undefined>;
  getAllMessageTemplates(category?: string): Promise<MessageTemplate[]>;
  createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;
  updateMessageTemplate(id: number, updates: Partial<MessageTemplate>): Promise<MessageTemplate | undefined>;
  deleteMessageTemplate(id: number): Promise<boolean>;

  // New method
  generateMonthlyPayrollForAllStaff(month: number, year: number): Promise<{ created: number; skipped: number; errors: any[] }>;

  // Mobile Content Management
  getAnnouncementsForAdmin(organizationId: number): Promise<PreschoolAnnouncement[]>;
  createAnnouncement(announcement: InsertPreschoolAnnouncement): Promise<PreschoolAnnouncement>;
  deleteAnnouncement(id: number): Promise<boolean>;

  getEventsForAdmin(organizationId: number): Promise<PreschoolEvent[]>;
  createEvent(event: InsertPreschoolEvent): Promise<PreschoolEvent>;
  deleteEvent(id: number): Promise<boolean>;

  getDailyUpdatesForAdmin(organizationId: number): Promise<DailyUpdate[]>;
  createDailyUpdate(update: InsertDailyUpdate): Promise<DailyUpdate>;
  deleteDailyUpdate(id: number): Promise<boolean>;

  getHomeworkForAdmin(organizationId: number): Promise<PreschoolHomework[]>;
  createHomework(homework: InsertPreschoolHomework): Promise<PreschoolHomework>;
  deleteHomework(id: number): Promise<boolean>;

  // Bus Management
  getBusRoutes(organizationId: number): Promise<BusRoute[]>;
  createBusRoute(route: InsertBusRoute): Promise<BusRoute>;
  updateBusRoute(id: number, updates: Partial<BusRoute>): Promise<BusRoute | undefined>;
  deleteBusRoute(id: number): Promise<void>;

  getBusStops(routeId: number): Promise<BusStop[]>;
  createBusStop(stop: InsertBusStop): Promise<BusStop>;
  updateBusStop(id: number, updates: Partial<BusStop>): Promise<BusStop | undefined>;
  deleteBusStop(id: number): Promise<void>;

  getStudentAssignments(routeId?: number): Promise<StudentBusAssignment[]>;
  assignStudentToBus(assignment: InsertStudentBusAssignment): Promise<StudentBusAssignment>;
  removeStudentAssignment(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    const result = await db.select().from(schema.organizations).where(eq(schema.organizations.id, id));
    return result[0];
  }

  async getOrganizationByName(name: string): Promise<Organization | undefined> {
    // Case-insensitive search
    const result = await db.select().from(schema.organizations)
      .where(sql`LOWER(${schema.organizations.name}) = LOWER(${name})`)
      .limit(1);
    return result[0];
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const result = await db.select().from(schema.organizations).where(eq(schema.organizations.slug, slug));
    return result[0];
  }

  async createOrganization(insertOrganization: InsertOrganization): Promise<Organization> {
    const result = await db.insert(schema.organizations).values(insertOrganization).returning();
    return result[0];
  }

  async updateOrganization(id: number, updates: Partial<Organization>): Promise<Organization | undefined> {
    const result = await db.update(schema.organizations).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(schema.organizations.id, id)).returning();
    return result[0];
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(schema.organizations);
  }

  // Basic user operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select({
      id: schema.users.id,
      username: schema.users.username,
      password: schema.users.password,
      role: schema.users.role,
      name: schema.users.name,
      email: schema.users.email,
      organizationId: schema.users.organizationId,
      createdAt: schema.users.createdAt,
      updatedAt: schema.users.updatedAt
    }).from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select({
      id: schema.users.id,
      username: schema.users.username,
      password: schema.users.password,
      role: schema.users.role,
      name: schema.users.name,
      email: schema.users.email,
      organizationId: schema.users.organizationId,
      createdAt: schema.users.createdAt,
      updatedAt: schema.users.updatedAt
    }).from(schema.users).where(ilike(schema.users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select({
      id: schema.users.id,
      username: schema.users.username,
      password: schema.users.password,
      role: schema.users.role,
      name: schema.users.name,
      email: schema.users.email,
      organizationId: schema.users.organizationId,
      createdAt: schema.users.createdAt,
      updatedAt: schema.users.updatedAt
    }).from(schema.users).where(ilike(schema.users.email, email));
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(schema.users).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(schema.users.id, id)).returning();
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(insertUser).returning();
    return result[0];
  }

  async updateUserNotificationPreferences(id: number, preferences: any): Promise<User | undefined> {
    const result = await db.update(schema.users).set({
      notificationPreferences: preferences,
      updatedAt: new Date()
    }).where(eq(schema.users.id, id)).returning();
    return result[0];
  }

  async getAllCounselors(organizationId?: number): Promise<User[]> {
    let conditions = [eq(schema.users.role, "counselor")];
    if (organizationId) {
      conditions.push(eq(schema.users.organizationId, organizationId));
    }

    const users = await db.select().from(schema.users).where(and(...conditions));
    return users.map(u => ({
      ...u,
      name: u.name || u.username
    }));
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
        admissionLikelihood: schema.leads.admissionLikelihood,
        notes: schema.leads.notes,
        counselorId: schema.leads.counselorId,
        assignedAt: schema.leads.assignedAt,
        createdAt: schema.leads.createdAt,
        updatedAt: schema.leads.updatedAt,
        lastContactedAt: schema.leads.lastContactedAt,

        fatherFirstName: schema.leads.fatherFirstName,
        fatherLastName: schema.leads.fatherLastName,
        fatherPhone: schema.leads.fatherPhone,
        motherFirstName: schema.leads.motherFirstName,
        motherLastName: schema.leads.motherLastName,
        motherPhone: schema.leads.motherPhone,
        address: schema.leads.address,
        deletedAt: schema.leads.deletedAt,
        organizationId: schema.leads.organizationId,
        isAppActive: schema.leads.isAppActive,
        counselor: schema.staff
      })
      .from(schema.leads)
      .leftJoin(schema.staff, eq(schema.leads.counselorId, schema.staff.id))
      .where(eq(schema.leads.id, id));

    return (result[0] ? {
      ...result[0],
      counselor: result[0].counselor || undefined
    } : undefined) as LeadWithCounselor | undefined;
  }

  async getAllLeads(includeDeleted = false, organizationId?: number): Promise<LeadWithCounselor[]> {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
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
        admissionLikelihood: schema.leads.admissionLikelihood,
        interestedProgram: schema.leads.interestedProgram,
        notes: schema.leads.notes,
        counselorId: schema.leads.counselorId,
        assignedAt: schema.leads.assignedAt,
        createdAt: schema.leads.createdAt,
        updatedAt: schema.leads.updatedAt,
        lastContactedAt: schema.leads.lastContactedAt,

        fatherFirstName: schema.leads.fatherFirstName,
        fatherLastName: schema.leads.fatherLastName,
        fatherPhone: schema.leads.fatherPhone,
        motherFirstName: schema.leads.motherFirstName,
        motherLastName: schema.leads.motherLastName,
        motherPhone: schema.leads.motherPhone,
        address: schema.leads.address,
        deletedAt: schema.leads.deletedAt,
        organizationId: schema.leads.organizationId,
        isAppActive: schema.leads.isAppActive,
        counselor: schema.staff
      })
      .from(schema.leads)
      .leftJoin(schema.staff, eq(schema.leads.counselorId, schema.staff.id));

    // Build WHERE conditions
    const conditions = [];

    // Organization filter (CRITICAL for multi-tenancy)
    if (organizationId !== undefined) {
      conditions.push(eq(schema.leads.organizationId, organizationId));
    }

    // Deleted filter
    if (!includeDeleted) {
      conditions.push(
        or(
          isNull(schema.leads.deletedAt),
          gte(schema.leads.deletedAt, ninetyDaysAgo)
        ),
        not(eq(schema.leads.status, "deleted"))
      );
    }

    if (conditions.length > 0) {
      query = (query as any).where(and(...conditions));
    }

    // Apply order by at the end
    query = (query as any).orderBy(desc(schema.leads.createdAt));

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
        fatherFirstName: schema.leads.fatherFirstName,
        fatherLastName: schema.leads.fatherLastName,
        fatherPhone: schema.leads.fatherPhone,
        motherFirstName: schema.leads.motherFirstName,
        motherLastName: schema.leads.motherLastName,
        motherPhone: schema.leads.motherPhone,

        address: schema.leads.address,
        deletedAt: schema.leads.deletedAt,
        organizationId: schema.leads.organizationId,
        isAppActive: schema.leads.isAppActive,
        counselor: schema.staff
      })
      .from(schema.leads)
      .leftJoin(schema.staff, eq(schema.leads.counselorId, schema.staff.id))
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

        fatherFirstName: schema.leads.fatherFirstName,
        fatherLastName: schema.leads.fatherLastName,
        fatherPhone: schema.leads.fatherPhone,
        motherFirstName: schema.leads.motherFirstName,
        motherLastName: schema.leads.motherLastName,
        motherPhone: schema.leads.motherPhone,
        address: schema.leads.address,
        deletedAt: schema.leads.deletedAt,
        organizationId: schema.leads.organizationId,
        isAppActive: schema.leads.isAppActive,
        counselor: schema.staff
      })
      .from(schema.leads)
      .leftJoin(schema.staff, eq(schema.leads.counselorId, schema.staff.id))
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

        fatherFirstName: schema.leads.fatherFirstName,
        fatherLastName: schema.leads.fatherLastName,
        fatherPhone: schema.leads.fatherPhone,
        motherFirstName: schema.leads.motherFirstName,
        motherLastName: schema.leads.motherLastName,
        motherPhone: schema.leads.motherPhone,
        address: schema.leads.address,
        deletedAt: schema.leads.deletedAt,
        organizationId: schema.leads.organizationId,
        isAppActive: schema.leads.isAppActive,
        counselor: schema.staff
      })
      .from(schema.leads)
      .leftJoin(schema.staff, eq(schema.leads.counselorId, schema.staff.id))
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
    try {
      // Auto-assign counselor if only one counselor exists in staff table
      let leadData = { ...insertLead };

      if (!leadData.counselorId && leadData.organizationId) {
        try {
          // Get all counselors and filter by organization
          const allCounselors = await this.getStaffByRole("Counselor");
          const counselors = allCounselors.filter(c => c.organizationId === leadData.organizationId);

          if (counselors.length === 1) {
            leadData.counselorId = counselors[0].id;
            leadData.assignedAt = new Date();
          }
        } catch (counselorError) {
          console.error("Error auto-assigning counselor:", counselorError);
          // Continue without auto-assignment if there's an error
        }
      }

      // Default isAppActive to false if not provided
      // Use logic to retain value if explicitly passed (e.g. true or false), but default to false if undefined/null
      if (leadData.isAppActive === undefined || leadData.isAppActive === null) {
        leadData.isAppActive = false;
      }

      // CRITICAL: Only include fields with actual values (not undefined, null, or empty strings)
      // This prevents the UNDEFINED_VALUE error from postgres
      const sanitizedData: any = {};
      Object.entries(leadData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          sanitizedData[key] = value;
        }
      });

      console.log("Inserting lead with fields:", Object.keys(sanitizedData));
      // console.log("Lead data:", JSON.stringify(sanitizedData, null, 2));

      const result = await db.insert(schema.leads).values(sanitizedData).returning();
      const lead = result[0];

      // Performance: Invalidate relevant caches
      if (lead.organizationId) {
        cacheService.invalidateOrganization(lead.organizationId);
      }
      cacheService.invalidate('dashboard:*');
      cacheService.invalidate('leads:*');

      // Try to create notification, but don't fail if it doesn't work
      try {
        await this.notifyChange(
          'lead',
          'Lead Created',
          `New lead ${lead.name} (${lead.phone}) added${lead.counselorId ? ' and auto-assigned to counselor' : ''}`,
          'medium',
          'view_lead',
          lead.id.toString()
        );
      } catch (notifyError) {
        console.error("Failed to create notification for new lead:", notifyError);
        // Don't fail the lead creation just because notification failed
      }

      return lead;
    } catch (error) {
      console.error("Error in createLead:", error);
      throw error;
    }
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

  async updateLead(id: number, updates: Partial<Lead>): Promise<LeadWithCounselor | undefined> {
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
      // Return the full lead with counselor details
      return await this.getLead(id);
    }
    return undefined;
  }

  async getRecentLeads(limit: number = 10): Promise<LeadWithCounselor[]> {
    const result = await db
      .select({
        lead: schema.leads,
        counselor: schema.staff
      })
      .from(schema.leads)
      .leftJoin(schema.staff, eq(schema.leads.counselorId, schema.staff.id))
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

        fatherFirstName: schema.leads.fatherFirstName,
        fatherLastName: schema.leads.fatherLastName,
        fatherPhone: schema.leads.fatherPhone,
        motherFirstName: schema.leads.motherFirstName,
        motherLastName: schema.leads.motherLastName,
        motherPhone: schema.leads.motherPhone,
        address: schema.leads.address,
        deletedAt: schema.leads.deletedAt,
        organizationId: schema.leads.organizationId,
        isAppActive: schema.leads.isAppActive,
        counselor: schema.staff
      })
      .from(schema.leads)
      .leftJoin(schema.staff, eq(schema.leads.counselorId, schema.staff.id))
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
    console.log("updateFollowUp - Received updates:", JSON.stringify(updates, null, 2));

    // Convert ISO string dates to Date objects
    const processedUpdates: any = { ...updates };
    if (typeof processedUpdates.completedAt === 'string') {
      processedUpdates.completedAt = new Date(processedUpdates.completedAt);
    }
    if (typeof processedUpdates.scheduledAt === 'string') {
      processedUpdates.scheduledAt = new Date(processedUpdates.scheduledAt);
    }

    console.log("updateFollowUp - Processed updates:", JSON.stringify(processedUpdates, null, 2));

    try {
      const result = await db.update(schema.followUps)
        .set(processedUpdates)
        .where(eq(schema.followUps.id, id))
        .returning();

      console.log("updateFollowUp - Database result:", JSON.stringify(result[0], null, 2));
      return result[0];
    } catch (error) {
      console.error("updateFollowUp - Database error:", error);
      throw error;
    }
  }

  async getOverdueFollowUps(): Promise<FollowUp[]> {
    const now = new Date();
    return await db.select().from(schema.followUps)
      .where(and(
        isNull(schema.followUps.completedAt),
        lt(schema.followUps.scheduledAt, now)
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
      ...updates
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

  async getDashboardAnalytics(organizationId?: number): Promise<{
    kpis: {
      leadManagement: { value: number; change: string };
      studentFee: { value: number; change: string };
      staffManagement: { value: number; change: string };
      payroll: { value: number; change: string };
      expenses: { value: number; change: string };
      totalReceivables: { value: number; change: string }; // New KPI replacing responseTime
      avgOrderValue: { value: number; change: string }; // New KPI
      conversionRate: { value: number; change: string }; // New KPI
      daycareRevenue: { value: number; change: string }; // New KPI
    };
    leadAnalytics: {
      sourceDistribution: Array<{ label: string; value: number }>;
      monthlyTrends: Array<{ month: string; leads: number; conversions: number }>;
      conversionRate: number;
      bestPerformingSource: string;
      engagementCurve: Array<{ date: string; impressions: number; conversions: number }>; // New Chart Data
      funnelData: Array<{ month: string; captured: number; engaged: number; qualified: number; converted: number }>; // Updated for monthly trend
      statusTotals: { new: number; contacted: number; interested: number; readyForAdmission: number; enrolled: number }; // All-time status counts
    };
    feeAnalytics: {
      paidVsPending: Array<{ label: string; value: number }>;
      monthlyCollection: Array<{ month: string; collected: number; pending: number }>;
      collectionRate: number;
      totalRevenue: number;
      totalPending: number;
    };
    staffAnalytics: {
      departmentDistribution: Array<{ label: string; value: number }>;
      totalStaff: number;
      attendanceRate: number;
    };
    expenseAnalytics: {
      categoryBreakdown: Array<{ label: string; value: number }>;
      totalExpenses: number;
      monthlyTrend: Array<{ month: string; amount: number }>;
    };
    recentLeads: Array<Lead>;
    recentActivity: Array<Notification>;
  }> {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Helper to get YYYY-MM-DD from a Date object using local time instead of UTC
    // This fixes the Dec 31st / timezone bug
    const toLocalDateString = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Current month date range
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const currentMonthStartStr = toLocalDateString(currentMonthStart);
    const currentMonthEndStr = toLocalDateString(currentMonthEnd);

    // Previous month date range for trend calculation
    const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const prevMonthStartStr = toLocalDateString(prevMonthStart);
    const prevMonthEndStr = toLocalDateString(prevMonthEnd);

    // ===== KPI CALCULATIONS =====

    // 1. Lead Management KPI (Total Leads)
    const [currentLeads, prevLeads] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as integer)` })
        .from(schema.leads)
        .where(organizationId ? eq(schema.leads.organizationId, organizationId) : sql`1=1`),
      db.select({ count: sql<number>`cast(count(*) as integer)` })
        .from(schema.leads)
        .where(
          and(
            organizationId ? eq(schema.leads.organizationId, organizationId) : sql`1=1`,
            lt(schema.leads.createdAt, currentMonthStart)
          )
        )
    ]);

    const totalLeads = currentLeads[0]?.count || 0;
    const previousTotalLeads = prevLeads[0]?.count || 0;
    const leadChange = previousTotalLeads > 0
      ? (((totalLeads - previousTotalLeads) / previousTotalLeads) * 100).toFixed(1)
      : "0.0";

    // 2. Student Fee KPI (Collected THIS Month)
    const [currentMonthRevenueResult, prevMonthRevenueResult] = await Promise.all([
      db.select({ total: sql<number>`cast(coalesce(sum(${schema.feePayments.amount}), 0) as integer)` })
        .from(schema.feePayments)
        .where(
          and(
            organizationId ? eq(schema.feePayments.organizationId, organizationId) : sql`1=1`,
            gte(schema.feePayments.paymentDate, currentMonthStartStr),
            lte(schema.feePayments.paymentDate, currentMonthEndStr)
          )
        ),
      db.select({ total: sql<number>`cast(coalesce(sum(${schema.feePayments.amount}), 0) as integer)` })
        .from(schema.feePayments)
        .where(
          and(
            organizationId ? eq(schema.feePayments.organizationId, organizationId) : sql`1=1`,
            gte(schema.feePayments.paymentDate, prevMonthStartStr),
            lte(schema.feePayments.paymentDate, prevMonthEndStr)
          )
        )
    ]);

    const monthlyRevenue = currentMonthRevenueResult[0]?.total || 0;
    const prevRevenue = prevMonthRevenueResult[0]?.total || 0;
    const revenueChange = prevRevenue > 0
      ? (((monthlyRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)
      : monthlyRevenue > 0 ? "100.0" : "0.0";

    // 3. Staff Management KPI (Active Staff)
    const [currentStaff, prevStaff] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as integer)` })
        .from(schema.staff)
        .where(
          and(
            eq(schema.staff.isActive, true),
            organizationId ? eq(schema.staff.organizationId, organizationId) : sql`1=1`
          )
        ),
      db.select({ count: sql<number>`cast(count(*) as integer)` })
        .from(schema.staff)
        .where(
          and(
            eq(schema.staff.isActive, true),
            organizationId ? eq(schema.staff.organizationId, organizationId) : sql`1=1`,
            lt(schema.staff.createdAt, currentMonthStart)
          )
        )
    ]);

    const totalStaff = currentStaff[0]?.count || 0;
    const prevTotalStaff = prevStaff[0]?.count || 0;
    const staffChange = prevTotalStaff > 0
      ? (((totalStaff - prevTotalStaff) / prevTotalStaff) * 100).toFixed(1)
      : totalStaff > 0 ? "100.0" : "0.0";

    // 4. Payroll KPI (Current Month Cost)
    // We try to get from payroll table first
    let currentPayroll = 0;
    let prevPayroll = 0;

    const [currPayrollResult, prevPayrollResult] = await Promise.all([
      db.select({ total: sql<number>`cast(coalesce(sum(${schema.payroll.netSalary}), 0) as integer)` })
        .from(schema.payroll)
        .where(
          and(
            organizationId ? eq(schema.staff.organizationId, organizationId) : sql`1=1`,
            eq(schema.payroll.month, currentMonth + 1), // JS month is 0-based
            eq(schema.payroll.year, currentYear)
          )
        )
        .leftJoin(schema.staff, eq(schema.payroll.staffId, schema.staff.id)), // Implicit join for org filter
      db.select({ total: sql<number>`cast(coalesce(sum(${schema.payroll.netSalary}), 0) as integer)` })
        .from(schema.payroll)
        .where(
          and(
            organizationId ? eq(schema.staff.organizationId, organizationId) : sql`1=1`,
            eq(schema.payroll.month, currentMonth), // Previous month
            eq(schema.payroll.year, currentMonth === 0 ? currentYear - 1 : currentYear)
          )
        )
        .leftJoin(schema.staff, eq(schema.payroll.staffId, schema.staff.id))
    ]);

    currentPayroll = currPayrollResult[0]?.total || 0;
    prevPayroll = prevPayrollResult[0]?.total || 0;

    // Fallback: If no payroll data for this month, sum up active staff salaries as an estimate
    if (currentPayroll === 0) {
      const staffSalaries = await db.select({ total: sql<number>`cast(coalesce(sum(${schema.staff.salary}), 0) as integer)` })
        .from(schema.staff)
        .where(
          and(
            eq(schema.staff.isActive, true),
            organizationId ? eq(schema.staff.organizationId, organizationId) : sql`1=1`
          )
        );
      currentPayroll = staffSalaries[0]?.total || 0;
    }
    // Fallback for previous if 0 (rough estimate)
    if (prevPayroll === 0) {
      // Just use same as current for fallback to avoid wild swings, unless we truly have 0 payroll history
      prevPayroll = currentPayroll;
    }

    const payrollChange = prevPayroll > 0
      ? (((currentPayroll - prevPayroll) / prevPayroll) * 100).toFixed(1)
      : "0.0";

    // 5. Expenses KPI
    // 5. Expenses KPI
    const [currentExpenses, prevExpenses, allTimeExpenses] = await Promise.all([
      db.select({ total: sql<number>`cast(coalesce(sum(${schema.expenses.amount}), 0) as integer)` })
        .from(schema.expenses)
        .where(
          and(
            organizationId ? eq(schema.expenses.organizationId, organizationId) : sql`1=1`,
            gte(schema.expenses.date, currentMonthStart.toISOString().split('T')[0]),
            lte(schema.expenses.date, currentMonthEnd.toISOString().split('T')[0])
          )
        ),
      db.select({ total: sql<number>`cast(coalesce(sum(${schema.expenses.amount}), 0) as integer)` })
        .from(schema.expenses)
        .where(
          and(
            organizationId ? eq(schema.expenses.organizationId, organizationId) : sql`1=1`,
            gte(schema.expenses.date, prevMonthStart.toISOString().split('T')[0]),
            lte(schema.expenses.date, prevMonthEnd.toISOString().split('T')[0])
          )
        ),
      db.select({ total: sql<number>`cast(coalesce(sum(${schema.expenses.amount}), 0) as integer)` })
        .from(schema.expenses)
        .where(organizationId ? eq(schema.expenses.organizationId, organizationId) : sql`1=1`)
    ]);

    const monthlyExpenses = currentExpenses[0]?.total || 0;
    const prevMonthlyExpenses = prevExpenses[0]?.total || 0;
    const totalExpensesAllTime = allTimeExpenses[0]?.total || 0;

    const expenseChange = prevMonthlyExpenses > 0
      ? (((monthlyExpenses - prevMonthlyExpenses) / prevMonthlyExpenses) * 100).toFixed(1)
      : monthlyExpenses > 0 ? "100.0" : "0.0";


    // ===== DETAILED ANALYTICS =====

    // --- Lead Analytics (Same as before) ---
    const sourceData = await db
      .select({
        source: schema.leads.source,
        count: sql<number>`cast(count(*) as integer)`
      })
      .from(schema.leads)
      .where(organizationId ? eq(schema.leads.organizationId, organizationId) : sql`1=1`)
      .groupBy(schema.leads.source);

    const sourceDistribution = sourceData.map(s => ({
      label: s.source || 'Unknown',
      value: s.count
    }));

    const monthlyTrendsData = await db
      .select({
        month: sql<string>`to_char(${schema.leads.createdAt}, 'Mon')`,
        yearMonth: sql<string>`to_char(${schema.leads.createdAt}, 'YYYY-MM')`,
        totalLeads: sql<number>`cast(count(*) as integer)`,
        conversions: sql<number>`cast(count(*) filter (where ${schema.leads.status} = 'enrolled') as integer)`
      })
      .from(schema.leads)
      .where(
        and(
          organizationId ? eq(schema.leads.organizationId, organizationId) : sql`1=1`,
          gte(schema.leads.createdAt, new Date(currentYear, currentMonth - 5, 1))
        )
      )
      .groupBy(sql`to_char(${schema.leads.createdAt}, 'Mon')`, sql`to_char(${schema.leads.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${schema.leads.createdAt}, 'YYYY-MM')`);

    const monthlyTrends = monthlyTrendsData.map(m => ({
      month: m.month,
      leads: m.totalLeads,
      conversions: m.conversions
    }));

    const conversionData = await db
      .select({
        total: sql<number>`cast(count(*) as integer)`,
        enrolled: sql<number>`cast(count(*) filter (where ${schema.leads.status} = 'enrolled') as integer)`
      })
      .from(schema.leads)
      .where(organizationId ? eq(schema.leads.organizationId, organizationId) : sql`1=1`);

    const conversionRate = conversionData[0]?.total > 0
      ? ((conversionData[0].enrolled / conversionData[0].total) * 100)
      : 0;

    const bestSource = await db
      .select({
        source: schema.leads.source,
        conversionRate: sql<number>`cast(
          (count(*) filter (where ${schema.leads.status} = 'enrolled')::float / 
           nullif(count(*)::float, 0) * 100) as integer
        )`
      })
      .from(schema.leads)
      .where(organizationId ? eq(schema.leads.organizationId, organizationId) : sql`1=1`)
      .groupBy(schema.leads.source)
      .orderBy(sql`(count(*) filter (where ${schema.leads.status} = 'enrolled')::float / 
                     nullif(count(*)::float, 0) * 100) desc`)
      .limit(1);

    const bestPerformingSource = bestSource[0]?.source || 'N/A';


    // --- FEE ANALYTICS (IMPROVED) ---

    // 1. Total Collected (All Time) - USED FOR REVENUE
    const allTimeCollectedResult = await db
      .select({ total: sql<number>`cast(coalesce(sum(${schema.feePayments.amount}), 0) as integer)` })
      .from(schema.feePayments)
      .where(organizationId ? eq(schema.feePayments.organizationId, organizationId) : sql`1=1`);
    const totalCollectedAllTime = allTimeCollectedResult[0]?.total || 0;

    // 2. Total Pending (Calculated)
    // Get all enrolled students and their fee structures
    const enrolledStudents = await db
      .select({
        id: schema.leads.id,
        class: schema.leads.class,
        stream: schema.leads.stream
      })
      .from(schema.leads)
      .where(
        and(
          eq(schema.leads.status, 'enrolled'),
          organizationId ? eq(schema.leads.organizationId, organizationId) : sql`1=1`
        )
      );

    // Get all fee structures AND global class fees
    const [allFeeStructures, allEmiPlans, allInstallments, allGlobalClassFees] = await Promise.all([
      db.select().from(schema.feeStructure)
        .where(organizationId ? eq(schema.feeStructure.organizationId, organizationId) : sql`1=1`),
      db.select().from(schema.emiPlans)
        .where(organizationId ? eq(schema.emiPlans.organizationId, organizationId) : sql`1=1`),
      db.select().from(schema.emiSchedule)
        .where(ne(schema.emiSchedule.status, 'paid')),
      db.select().from(schema.globalClassFees)
        .where(
          and(
            organizationId ? eq(schema.globalClassFees.organizationId, organizationId) : sql`1=1`,
            eq(schema.globalClassFees.isActive, true)
          )
        )
    ]);

    // Map EMI plans for quick lookup: studentId -> totalAmount
    const emiPlanMap = new Map<number, number>();
    allEmiPlans.forEach(plan => {
      emiPlanMap.set(plan.studentId, Number(plan.totalAmount));
    });

    // Map fee structures for quick lookup: class_stream -> amount
    const feeMap = new Map<string, number>();
    allFeeStructures.forEach(fs => {
      // Create a key that handles potential null streams
      const key = `${fs.class}_${fs.stream}`;
      feeMap.set(key, Number(fs.totalFees));
    });

    // Map global class fees for quick lookup: className -> total amount
    const globalFeeMap = new Map<string, number>();
    allGlobalClassFees.forEach(gcf => {
      const existing = globalFeeMap.get(gcf.className) || 0;
      // Sum all fee types for a class (tuition, library, etc.)
      globalFeeMap.set(gcf.className, existing + Number(gcf.amount));
    });

    // Memory-safe filtering for Pending installments (avoiding complex JOIN syntax issues)
    const enrolledStudentIds = new Set(enrolledStudents.map(s => s.id));
    const totalPendingEMIs = allInstallments
      .filter(i => enrolledStudentIds.has(i.studentId))
      .reduce((sum, i) => sum + Number(i.amount), 0);

    // REFINED GROSS POTENTIAL CALCULATION (User Accounting Model):
    // Total Receivables = Sum of all Enrolled Students' Defined Plans
    // Priority: EMI Plan > Fee Structure > Global Class Fees

    let totalExpectedRevenue = 0;

    enrolledStudents.forEach(student => {
      // 1. Priority: specific EMI plan
      if (emiPlanMap.has(student.id)) {
        totalExpectedRevenue += emiPlanMap.get(student.id) || 0;
      }
      // 2. Fallback: Class+Stream specific fee structure
      else {
        const key = `${student.class}_${student.stream}`;
        if (feeMap.has(key)) {
          totalExpectedRevenue += feeMap.get(key) || 0;
        }
        // 3. Final fallback: Global class fees
        else if (globalFeeMap.has(student.class)) {
          totalExpectedRevenue += globalFeeMap.get(student.class) || 0;
        }
      }
    });

    // Separating "Plan Fees" from "Additional Charges" per user request.
    // Additional charges are not part of receivables/pending calculation.

    // 1. Get total core fees collected (excluding additional charges)
    const planFeesCollectedResult = await db
      .select({ total: sql<number>`cast(coalesce(sum(${schema.feePayments.amount}), 0) as integer)` })
      .from(schema.feePayments)
      .where(
        and(
          organizationId ? eq(schema.feePayments.organizationId, organizationId) : sql`1=1`,
          ne(schema.feePayments.paymentCategory, 'additional_charge')
        )
      );
    const totalCollectedPlanFees = planFeesCollectedResult[0]?.total || 0;

    // 2. Get total additional charges collected
    const additionalChargesResult = await db
      .select({ total: sql<number>`cast(coalesce(sum(${schema.feePayments.amount}), 0) as integer)` })
      .from(schema.feePayments)
      .where(
        and(
          organizationId ? eq(schema.feePayments.organizationId, organizationId) : sql`1=1`,
          eq(schema.feePayments.paymentCategory, 'additional_charge')
        )
      );
    const additionalCollected = additionalChargesResult[0]?.total || 0;

    // Receivables (Pending) Logic:
    // Total Pending = (Total Plan Expectation) - (Total Plan Fees Collected)
    // Additional charges are NOT added to expectation.
    // Collection rate: Collected Plan Fees / Expected Plan Fees
    const collectionRate = totalExpectedRevenue > 0
      ? (totalCollectedPlanFees / totalExpectedRevenue) * 100
      : (totalCollectedPlanFees > 0 ? 100 : 0);

    const totalPending = totalExpectedRevenue > 0
      ? Math.max(0, totalExpectedRevenue - totalCollectedPlanFees)
      : 0;

    // Chart Data focuses on Plan Fees only
    const paidVsPending = [
      { label: 'Collected', value: totalCollectedPlanFees },
      { label: 'Pending', value: totalPending }
    ];


    // Monthly Collection Trend (last 6 months)
    const monthlyCollectionData = await db
      .select({
        month: sql<string>`to_char(${schema.feePayments.paymentDate}, 'Mon')`,
        yearMonth: sql<string>`to_char(${schema.feePayments.paymentDate}, 'YYYY-MM')`,
        collected: sql<number>`cast(coalesce(sum(${schema.feePayments.amount}), 0) as integer)`
      })
      .from(schema.feePayments)
      .where(
        and(
          organizationId ? eq(schema.feePayments.organizationId, organizationId) : sql`1=1`,
          gte(schema.feePayments.paymentDate, new Date(currentYear, currentMonth - 5, 1).toISOString().split('T')[0])
        )
      )
      .groupBy(sql`to_char(${schema.feePayments.paymentDate}, 'Mon')`, sql`to_char(${schema.feePayments.paymentDate}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${schema.feePayments.paymentDate}, 'YYYY-MM')`);

    const monthlyCollection = monthlyCollectionData.map(m => ({
      month: m.month,
      collected: m.collected + 0, // Placeholder for daycare revenue per month
      pending: 0
    }));


    // --- STAFF ANALYTICS ---
    const deptData = await db
      .select({
        department: schema.staff.department,
        count: sql<number>`cast(count(*) as integer)`
      })
      .from(schema.staff)
      .where(
        and(
          eq(schema.staff.isActive, true),
          organizationId ? eq(schema.staff.organizationId, organizationId) : sql`1=1`
        )
      )
      .groupBy(schema.staff.department);

    const departmentDistribution = deptData.map(d => ({
      label: d.department || 'Unassigned',
      value: d.count
    }));

    const attendanceData = await db
      .select({
        totalDays: sql<number>`cast(count(*) as integer)`,
        presentDays: sql<number>`cast(count(*) filter (where ${schema.attendance.status} = 'present') as integer)`
      })
      .from(schema.attendance)
      .where(
        and(
          gte(schema.attendance.date, currentMonthStart.toISOString().split('T')[0]),
          lte(schema.attendance.date, currentMonthEnd.toISOString().split('T')[0])
        )
      );

    const attendanceRate = attendanceData[0]?.totalDays > 0
      ? ((attendanceData[0].presentDays / attendanceData[0].totalDays) * 100)
      : 0;


    // --- EXPENSE ANALYTICS ---
    // Category Breakdown
    const categoryData = await db
      .select({
        category: schema.expenses.category,
        total: sql<number>`cast(coalesce(sum(${schema.expenses.amount}), 0) as integer)`
      })
      .from(schema.expenses)
      .where(organizationId ? eq(schema.expenses.organizationId, organizationId) : sql`1=1`)
      .groupBy(schema.expenses.category);

    const categoryBreakdown = categoryData.map(c => ({
      label: c.category || 'Other',
      value: c.total
    }));

    const expenseTrendData = await db
      .select({
        month: sql<string>`to_char(${schema.expenses.date}, 'Mon')`,
        yearMonth: sql<string>`to_char(${schema.expenses.date}, 'YYYY-MM')`,
        amount: sql<number>`cast(coalesce(sum(${schema.expenses.amount}), 0) as integer)`
      })
      .from(schema.expenses)
      .where(
        and(
          organizationId ? eq(schema.expenses.organizationId, organizationId) : sql`1=1`,
          gte(schema.expenses.date, new Date(currentYear, currentMonth - 5, 1).toISOString().split('T')[0])
        )
      )
      .groupBy(sql`to_char(${schema.expenses.date}, 'Mon')`, sql`to_char(${schema.expenses.date}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${schema.expenses.date}, 'YYYY-MM')`);

    // Monthly Payroll Trend
    const payrollTrendData = await db
      .select({
        month: sql<string>`to_char(to_date(year || '-' || month || '-01', 'YYYY-MM-DD'), 'Mon')`,
        yearMonth: sql<string>`year || '-' || lpad(month::text, 2, '0')`,
        amount: sql<number>`cast(coalesce(sum(${schema.payroll.netSalary}), 0) as integer)`
      })
      .from(schema.payroll)
      .where(
        organizationId ? eq(schema.staff.organizationId, organizationId) : sql`1=1`
      )
      .leftJoin(schema.staff, eq(schema.payroll.staffId, schema.staff.id))
      .groupBy(sql`to_char(to_date(year || '-' || month || '-01', 'YYYY-MM-DD'), 'Mon')`, sql`year || '-' || lpad(month::text, 2, '0')`)
      .orderBy(sql`year || '-' || lpad(month::text, 2, '0')`);

    // Merge General Expenses + Payroll for "Total Operating Expenses"
    const monthlyTrend = expenseTrendData.map(e => {
      const payroll = payrollTrendData.find(p => p.month === e.month);
      return {
        month: e.month,
        amount: e.amount + (payroll ? payroll.amount : 0)
      };
    });


    // ===== NEW ANALYTICS CALCULATIONS =====

    // 1. RESPONSE TIME CALCULATION
    const responseTimeData = await db
      .select({
        avgMinutes: sql<number>`
          cast(
            avg(
              extract(epoch from (${schema.leads.lastContactedAt} - ${schema.leads.createdAt})) / 60
            ) filter (where ${schema.leads.lastContactedAt} is not null)
          as integer)
        `
      })
      .from(schema.leads)
      .where(organizationId ? eq(schema.leads.organizationId, organizationId) : sql`1=1`);

    const avgResponseMinutes = responseTimeData[0]?.avgMinutes || 0;
    const avgResponseHours = avgResponseMinutes > 0 ? (avgResponseMinutes / 60).toFixed(1) : "0.0";

    // Previous period response time for trend
    const prevResponseTimeData = await db
      .select({
        avgMinutes: sql<number>`
          cast(
            avg(
              extract(epoch from (${schema.leads.lastContactedAt} - ${schema.leads.createdAt})) / 60
            ) filter (where ${schema.leads.lastContactedAt} is not null)
          as integer)
        `
      })
      .from(schema.leads)
      .where(
        and(
          organizationId ? eq(schema.leads.organizationId, organizationId) : sql`1=1`,
          lt(schema.leads.createdAt, currentMonthStart)
        )
      );

    const prevAvgResponseMinutes = prevResponseTimeData[0]?.avgMinutes || avgResponseMinutes;
    const responseTimeChange = prevAvgResponseMinutes > 0
      ? (((avgResponseMinutes - prevAvgResponseMinutes) / prevAvgResponseMinutes) * 100).toFixed(1)
      : "0.0";

    // 2. CONVERSION RATE KPI (All-Time Value, Monthly Trend)
    // First, get ALL-TIME conversion data for the main KPI value
    const allTimeConversionData = await db
      .select({
        total: sql<number>`cast(count(*) as integer)`,
        enrolled: sql<number>`cast(count(*) filter (where ${schema.leads.status} = 'enrolled') as integer)`
      })
      .from(schema.leads)
      .where(organizationId ? eq(schema.leads.organizationId, organizationId) : sql`1=1`);

    // Next, get monthly data purely for the TREND calculation
    const currentMonthConversionData = await db
      .select({
        total: sql<number>`cast(count(*) as integer)`,
        enrolled: sql<number>`cast(count(*) filter (where ${schema.leads.status} = 'enrolled') as integer)`
      })
      .from(schema.leads)
      .where(
        and(
          organizationId ? eq(schema.leads.organizationId, organizationId) : sql`1=1`,
          gte(schema.leads.createdAt, currentMonthStart)
        )
      );

    const prevMonthConversionData = await db
      .select({
        total: sql<number>`cast(count(*) as integer)`,
        enrolled: sql<number>`cast(count(*) filter (where ${schema.leads.status} = 'enrolled') as integer)`
      })
      .from(schema.leads)
      .where(
        and(
          organizationId ? eq(schema.leads.organizationId, organizationId) : sql`1=1`,
          gte(schema.leads.createdAt, prevMonthStart),
          lt(schema.leads.createdAt, currentMonthStart)
        )
      );

    // Main KPI Value (All-Time)
    const currentConversionRate = allTimeConversionData[0]?.total > 0
      ? ((allTimeConversionData[0].enrolled / allTimeConversionData[0].total) * 100)
      : 0;

    // Trend Calculation (Month over Month)
    const currentMonthRate = currentMonthConversionData[0]?.total > 0
      ? ((currentMonthConversionData[0].enrolled / currentMonthConversionData[0].total) * 100)
      : 0;

    const prevMonthRate = prevMonthConversionData[0]?.total > 0
      ? ((prevMonthConversionData[0].enrolled / prevMonthConversionData[0].total) * 100)
      : 0;

    const conversionRateChange = prevMonthRate > 0
      ? (((currentMonthRate - prevMonthRate) / prevMonthRate) * 100).toFixed(1)
      : currentMonthRate > 0 ? "100.0" : "0.0";

    // 3. AVERAGE FEE COLLECTED (Per Enrolled Student - Student Fees Only)
    const enrolledCount = enrolledStudents.length;
    const avgFeeCollected = enrolledCount > 0
      ? Math.round(totalCollectedAllTime / enrolledCount)
      : 0;

    // Previous period avg fee for trend
    const prevPeriodCollected = await db
      .select({ total: sql<number>`cast(coalesce(sum(${schema.feePayments.amount}), 0) as integer)` })
      .from(schema.feePayments)
      .where(
        and(
          organizationId ? eq(schema.feePayments.organizationId, organizationId) : sql`1=1`,
          lt(schema.feePayments.paymentDate, currentMonthStart.toISOString().split('T')[0])
        )
      );

    const prevPeriodEnrolledCount = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(schema.leads)
      .where(
        and(
          eq(schema.leads.status, 'enrolled'),
          organizationId ? eq(schema.leads.organizationId, organizationId) : sql`1=1`,
          lt(schema.leads.createdAt, currentMonthStart)
        )
      );

    const prevAvgFee = prevPeriodEnrolledCount[0]?.count > 0
      ? Math.round((prevPeriodCollected[0]?.total || 0) / prevPeriodEnrolledCount[0].count)
      : avgFeeCollected;

    const avgFeeChange = prevAvgFee > 0
      ? (((avgFeeCollected - prevAvgFee) / prevAvgFee) * 100).toFixed(1)
      : "0.0";

    // 4. DAYCARE REVENUE
    const [currentDaycareRevenueResult, prevDaycareRevenueResult, totalDaycareResult] = await Promise.all([
      db.select({ total: sql<number>`cast(coalesce(sum(${schema.daycarePayments.totalAmount}), 0) as integer)` })
        .from(schema.daycarePayments)
        .where(
          and(
            organizationId ? eq(schema.daycareChildren.organizationId, organizationId) : sql`1=1`,
            gte(schema.daycarePayments.paymentDate, currentMonthStartStr),
            lte(schema.daycarePayments.paymentDate, currentMonthEndStr)
          )
        )
        .leftJoin(schema.daycareChildren, eq(schema.daycarePayments.childId, schema.daycareChildren.id)),
      db.select({ total: sql<number>`cast(coalesce(sum(${schema.daycarePayments.totalAmount}), 0) as integer)` })
        .from(schema.daycarePayments)
        .where(
          and(
            organizationId ? eq(schema.daycareChildren.organizationId, organizationId) : sql`1=1`,
            gte(schema.daycarePayments.paymentDate, prevMonthStartStr),
            lte(schema.daycarePayments.paymentDate, prevMonthEndStr)
          )
        )
        .leftJoin(schema.daycareChildren, eq(schema.daycarePayments.childId, schema.daycareChildren.id)),
      db.select({ total: sql<number>`cast(coalesce(sum(${schema.daycarePayments.totalAmount}), 0) as integer)` })
        .from(schema.daycarePayments)
        .where(organizationId ? eq(schema.daycareChildren.organizationId, organizationId) : sql`1=1`)
        .leftJoin(schema.daycareChildren, eq(schema.daycarePayments.childId, schema.daycareChildren.id))
    ]);

    const monthlyDaycareRevenue = currentDaycareRevenueResult[0]?.total || 0;
    const prevMonthDaycareRevenue = prevDaycareRevenueResult[0]?.total || 0;
    const totalDaycareAllTime = totalDaycareResult[0]?.total || 0;

    const daycareRevenueChange = prevMonthDaycareRevenue > 0
      ? (((monthlyDaycareRevenue - prevMonthDaycareRevenue) / prevMonthDaycareRevenue) * 100).toFixed(1)
      : monthlyDaycareRevenue > 0 ? "100.0" : "0.0";
    const planExpectation = totalExpectedRevenue > 0 ? totalExpectedRevenue : totalCollectedPlanFees;
    const totalCalculatedRevenue = planExpectation + additionalCollected + totalDaycareAllTime;

    const currentTotalMonthlyCollection = monthlyRevenue + monthlyDaycareRevenue;
    const prevTotalMonthlyCollection = prevRevenue + prevMonthDaycareRevenue;

    // Calculate change but cap at 100% to avoid extreme values like 1500%
    const rawRevenueChange = prevTotalMonthlyCollection > 0
      ? ((currentTotalMonthlyCollection - prevTotalMonthlyCollection) / prevTotalMonthlyCollection) * 100
      : currentTotalMonthlyCollection > 0 ? 100 : 0;
    const totalRevenueChange = Math.min(rawRevenueChange, 100).toFixed(1);

    // 4. ENGAGEMENT CURVE DATA (Last 30 days)
    const engagementCurveData = await db
      .select({
        date: sql<string>`date(${schema.leads.createdAt})`,
        impressions: sql<number>`cast(count(*) as integer)`,
        conversions: sql<number>`cast(count(*) filter (where ${schema.leads.status} = 'enrolled') as integer)`
      })
      .from(schema.leads)
      .where(
        and(
          organizationId ? eq(schema.leads.organizationId, organizationId) : sql`1=1`,
          gte(schema.leads.createdAt, new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000))
        )
      )
      .groupBy(sql`date(${schema.leads.createdAt})`)
      .orderBy(sql`date(${schema.leads.createdAt})`);

    const engagementCurve = engagementCurveData.map(d => ({
      date: d.date,
      impressions: d.impressions,
      conversions: d.conversions
    }));

    // 5. FUNNEL PROGRESSION DATA (Monthly stages)
    const funnelProgressionData = await db
      .select({
        month: sql<string>`to_char(${schema.leads.createdAt}, 'Mon')`,
        yearMonth: sql<string>`to_char(${schema.leads.createdAt}, 'YYYY-MM')`,
        captured: sql<number>`cast(count(*) filter (where ${schema.leads.status} = 'new') as integer)`,
        engaged: sql<number>`cast(count(*) filter (where ${schema.leads.status} = 'contacted') as integer)`,
        qualified: sql<number>`cast(count(*) filter (where ${schema.leads.status} = 'interested') as integer)`,
        readyForAdmission: sql<number>`cast(count(*) filter (where ${schema.leads.status} = 'ready_for_admission') as integer)`,
        converted: sql<number>`cast(count(*) filter (where ${schema.leads.status} = 'enrolled') as integer)`
      })
      .from(schema.leads)
      .where(
        and(
          organizationId ? eq(schema.leads.organizationId, organizationId) : sql`1=1`,
          gte(schema.leads.createdAt, new Date(currentYear, currentMonth - 5, 1))
        )
      )
      .groupBy(sql`to_char(${schema.leads.createdAt}, 'Mon')`, sql`to_char(${schema.leads.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${schema.leads.createdAt}, 'YYYY-MM')`);

    const funnelData = funnelProgressionData.map(f => ({
      month: f.month,
      captured: f.captured,
      engaged: f.engaged,
      qualified: f.qualified,
      readyForAdmission: f.readyForAdmission,
      converted: f.converted
    }));

    // All-time status totals for Lead Funnel (not grouped by month)
    const statusTotalsData = await db
      .select({
        new: sql<number>`cast(count(*) filter (where ${schema.leads.status} = 'new') as integer)`,
        contacted: sql<number>`cast(count(*) filter (where ${schema.leads.status} = 'contacted') as integer)`,
        interested: sql<number>`cast(count(*) filter (where ${schema.leads.status} = 'interested') as integer)`,
        readyForAdmission: sql<number>`cast(count(*) filter (where ${schema.leads.status} = 'ready_for_admission') as integer)`,
        enrolled: sql<number>`cast(count(*) filter (where ${schema.leads.status} = 'enrolled') as integer)`
      })
      .from(schema.leads)
      .where(organizationId ? eq(schema.leads.organizationId, organizationId) : sql`1=1`);

    const statusTotals = {
      new: statusTotalsData[0]?.new || 0,
      contacted: statusTotalsData[0]?.contacted || 0,
      interested: statusTotalsData[0]?.interested || 0,
      readyForAdmission: statusTotalsData[0]?.readyForAdmission || 0,
      enrolled: statusTotalsData[0]?.enrolled || 0
    };

    // 6. RECENT ACTIVITY (Last 10 notifications)
    const recentActivity = await db
      .select()
      .from(schema.notifications)
      .orderBy(desc(schema.notifications.createdAt))
      .limit(10);

    // 7. RECENT LEADS (Last 10 leads)
    const recentLeads = await db
      .select()
      .from(schema.leads)
      .where(organizationId ? eq(schema.leads.organizationId, organizationId) : sql`1=1`)
      .orderBy(desc(schema.leads.createdAt))
      .limit(10);

    // 9. TOTAL REVENUE (What we actually collected: Plans + Additional + Daycare)
    const totalRevenue = totalCalculatedRevenue;

    // For change trend, we continue to use the collections trend calculated earlier as 'totalRevenueChange'.
    // (Note: The variable 'totalRevenueChange' was already defined in step 5, so we don't redefine it here).
    // To ensure TS safety if 'totalRevenueChange' isn't in scope due to block issues, we ensure it is available.
    // Ideally, we should unify the definitions.

    return {
      kpis: {
        leadManagement: {
          value: totalLeads,
          change: `${leadChange >= "0" ? '+' : ''}${leadChange}%`
        },
        studentFee: {
          value: totalCalculatedRevenue,
          change: `${parseFloat(totalRevenueChange) >= 0 ? '+' : ''}${totalRevenueChange}%`
        },
        staffManagement: {
          value: totalStaff,
          change: `${staffChange >= "0" ? '+' : ''}${staffChange}%`
        },
        payroll: {
          value: currentPayroll,
          change: `${payrollChange >= "0" ? '+' : ''}${payrollChange}%`
        },
        expenses: {
          value: totalExpensesAllTime,
          change: `${parseFloat(expenseChange) >= 0 ? '+' : ''}${expenseChange}%`
        },
        totalReceivables: {
          value: planExpectation,
          change: totalExpectedRevenue > 0 ? "" : "No fee structures"
        },
        conversionRate: {
          value: Math.round(currentConversionRate * 100) / 100,
          change: `${parseFloat(conversionRateChange) >= 0 ? '+' : ''}${conversionRateChange}%`
        },
        avgOrderValue: {
          value: avgFeeCollected,
          change: `${parseFloat(avgFeeChange) >= 0 ? '+' : ''}${avgFeeChange}%`
        },
        daycareRevenue: {
          value: monthlyDaycareRevenue,
          change: `${parseFloat(daycareRevenueChange) >= 0 ? '+' : ''}${daycareRevenueChange}%`
        }
      },
      leadAnalytics: {
        sourceDistribution,
        monthlyTrends,
        conversionRate: Math.round(conversionRate * 100) / 100,
        bestPerformingSource,
        engagementCurve,
        funnelData,
        statusTotals
      },
      feeAnalytics: {
        paidVsPending,
        monthlyCollection,
        collectionRate: Math.round(collectionRate * 100) / 100,
        totalRevenue: totalCollectedPlanFees,
        totalPending: totalPending
      },
      staffAnalytics: {
        departmentDistribution,
        totalStaff,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      },
      expenseAnalytics: {
        categoryBreakdown,
        totalExpenses: totalExpensesAllTime,
        monthlyTrend
      },
      recentLeads,
      recentActivity
    };
  }

  // Staff operations - simplified implementations to avoid errors
  async getStaff(id: number): Promise<Staff | undefined> {
    const result = await db.select().from(schema.staff).where(eq(schema.staff.id, id));
    return result[0];
  }

  async getAllStaff(organizationId?: number): Promise<StaffWithDetails[]> {
    if (organizationId) {
      return await db.select().from(schema.staff).where(eq(schema.staff.organizationId, organizationId));
    }
    return await db.select().from(schema.staff);
  }

  async getStaffByRole(role: string, organizationId?: number): Promise<Staff[]> {
    if (organizationId) {
      return await db.select().from(schema.staff).where(and(eq(schema.staff.role, role), eq(schema.staff.organizationId, organizationId)));
    }
    return await db.select().from(schema.staff).where(eq(schema.staff.role, role));
  }



  // ... (maintain other methods)

  async getAllExpenses(organizationId?: number): Promise<ExpenseWithApprover[]> {
    let query = db
      .select()
      .from(schema.expenses);

    if (organizationId) {
      query = query.where(eq(schema.expenses.organizationId, organizationId)) as any;
    }

    const result = await query.orderBy(desc(schema.expenses.date));

    return result.map(row => ({
      ...row,
      approver: undefined // No longer joining with users table
    }));
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
          basicSalary: String(basicSalary),
          allowances: String(allowances),
          deductions: String(deductions),
          overtime: String(overtime),
          netSalary: String(netSalary),
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
          const employeeName = updates.name !== undefined ? updates.name : updatedStaff.name;
          const attendedDays = payroll.attendedDays || 30;
          const netSalary = (basicSalary / 30) * attendedDays;
          await this.updatePayroll(payroll.id, {
            basicSalary: String(basicSalary),
            netSalary: String(netSalary)
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
          paymentDate: schema.payroll.paymentDate,
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
          timestamp: payroll.status === 'processed' && payroll.paymentDate ? new Date(payroll.paymentDate) : payroll.createdAt,
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
    let query: any = db.select().from(schema.attendance).where(eq(schema.attendance.staffId, staffId));

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
      ...updates
    }).where(eq(schema.attendance.id, id)).returning();
    return result[0];
  }

  async getAttendanceStats(month: number, year: number, organizationId?: number): Promise<{
    totalPresent: number;
    totalAbsent: number;
    averageHours: number;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    let query = db
      .select({
        totalPresent: sql<number>`count(*) filter (where ${schema.attendance.status} = 'present')`,
        totalAbsent: sql<number>`count(*) filter (where ${schema.attendance.status} = 'absent')`,
        averageHours: sql<number>`avg(CASE WHEN ${schema.attendance.hoursWorked} IS NOT NULL THEN ${schema.attendance.hoursWorked} ELSE 0 END)`
      })
      .from(schema.attendance);

    if (organizationId) {
      // Use raw SQL for complex join if needed, or just chain if typings allow.
      // Since manual join might be tricky with typings, we use a simpler approach if possible.
      // Using 'leftJoin' on the query builder.
      // query = query.leftJoin(...)
      // But 'query' type inference is tricky here.
      // I'll use the 'staffId' filter if possible, but we don't have list of staff IDs.
      // I'll use 'any' casting to bypass TS issues for now as verified in other methods.

      query = query.leftJoin(schema.staff, eq(schema.attendance.staffId, schema.staff.id))
        .where(and(
          gte(schema.attendance.date, startDate.toISOString().split('T')[0]),
          lte(schema.attendance.date, endDate.toISOString().split('T')[0]),
          eq(schema.staff.organizationId, organizationId)
        )) as any;
    } else {
      query = query.where(and(
        gte(schema.attendance.date, startDate.toISOString().split('T')[0]),
        lte(schema.attendance.date, endDate.toISOString().split('T')[0])
      )) as any;
    }

    const stats = await query;

    return {
      totalPresent: Number(stats[0]?.totalPresent) || 0,
      totalAbsent: Number(stats[0]?.totalAbsent) || 0,
      averageHours: Number(stats[0]?.averageHours) || 0
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

  async getPayrollByMonth(month: number, year: number, organizationId?: number): Promise<Payroll[]> {
    try {
      if (!db) return [];

      if (organizationId) {
        return await db.select()
          .from(schema.payroll)
          .leftJoin(schema.staff, eq(schema.payroll.staffId, schema.staff.id))
          .where(and(
            eq(schema.payroll.month, month),
            eq(schema.payroll.year, year),
            eq(schema.staff.organizationId, organizationId)
          ))
          .then(res => res.map(r => r.payroll));
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

  async getAllPayroll(organizationId?: number): Promise<Payroll[]> {
    try {
      if (!db) return [];

      if (organizationId) {
        return await db.select()
          .from(schema.payroll)
          .leftJoin(schema.staff, eq(schema.payroll.staffId, schema.staff.id))
          .where(eq(schema.staff.organizationId, organizationId))
          .then(res => res.map(r => r.payroll));
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
      ...updates
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

  async getPayrollStats(month: number, year: number, organizationId?: number): Promise<{
    totalSalaries: number;
    totalDeductions: number;
    totalAllowances: number;
    netPayroll: number;
  }> {
    let query = db
      .select({
        totalSalaries: sql<number>`sum(CAST(${schema.payroll.basicSalary} AS DECIMAL))`,
        totalDeductions: sql<number>`sum(CAST(${schema.payroll.deductions} AS DECIMAL))`,
        totalAllowances: sql<number>`sum(CAST(${schema.payroll.allowances} AS DECIMAL))`,
        netPayroll: sql<number>`sum(CAST(${schema.payroll.netSalary} AS DECIMAL))`
      })
      .from(schema.payroll);

    if (organizationId) {
      query = query.leftJoin(schema.staff, eq(schema.payroll.staffId, schema.staff.id))
        .where(and(
          eq(schema.payroll.month, month),
          eq(schema.payroll.year, year),
          eq(schema.staff.organizationId, organizationId)
        )) as any;
    } else {
      query = query.where(and(
        eq(schema.payroll.month, month),
        eq(schema.payroll.year, year)
      )) as any;
    }

    const stats = await query;

    return {
      totalSalaries: Number(stats[0]?.totalSalaries) || 0,
      totalDeductions: Number(stats[0]?.totalDeductions) || 0,
      totalAllowances: Number(stats[0]?.totalAllowances) || 0,
      netPayroll: Number(stats[0]?.netPayroll) || 0
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
          eq(schema.payroll.month, month),
          eq(schema.payroll.year, year),
          eq(schema.payroll.staffId, staffId)
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
        approverId: schema.users.id,
        approverName: schema.users.name,
        approverEmail: schema.users.email,
        approverUsername: schema.users.username,
        approverPassword: schema.users.password,
        approverRole: schema.users.role,
        approverCreatedAt: schema.users.createdAt,
        approverUpdatedAt: schema.users.updatedAt,
        organizationId: schema.expenses.organizationId,
        approverOrganizationId: schema.users.organizationId
      })
      .from(schema.expenses)
      .leftJoin(schema.users, eq(schema.expenses.approvedBy, schema.users.id))
      .where(eq(schema.expenses.id, id));

    if (!result[0]) return undefined;

    const row = result[0];
    return {
      id: row.id,
      description: row.description,
      amount: row.amount,
      category: row.category,
      date: row.date,
      status: row.status,
      receiptUrl: row.receiptUrl,
      submittedBy: row.submittedBy,
      approvedBy: row.approvedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      approver: row.approverId ? {
        id: row.approverId,
        name: row.approverName,
        email: row.approverEmail,
        username: row.approverUsername!,
        password: row.approverPassword!,
        role: row.approverRole!,
        organizationId: row.approverOrganizationId,
        createdAt: row.approverCreatedAt!,
        updatedAt: row.approverUpdatedAt!
      } : undefined,
      organizationId: row.organizationId
    };
  }





  async getExpensesByCategory(category: string, organizationId?: number): Promise<ExpenseWithApprover[]> {
    let query = db
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
        organizationId: schema.expenses.organizationId,
        createdAt: schema.expenses.createdAt,
        updatedAt: schema.expenses.updatedAt,
        approverId: schema.users.id,
        approverName: schema.users.name,
        approverEmail: schema.users.email,
        approverUsername: schema.users.username,
        approverPassword: schema.users.password,
        approverRole: schema.users.role,
        approverCreatedAt: schema.users.createdAt,
        approverUpdatedAt: schema.users.updatedAt,
        approverOrganizationId: schema.users.organizationId
      })
      .from(schema.expenses)
      .leftJoin(schema.users, eq(schema.expenses.approvedBy, schema.users.id))
      .where(eq(schema.expenses.category, category));

    if (organizationId) {
      query = (query as any).where(and(eq(schema.expenses.category, category), eq(schema.expenses.organizationId, organizationId)));
    }

    const result = await query;

    return result.map(row => ({
      id: row.id,
      description: row.description,
      amount: row.amount,
      category: row.category,
      date: row.date,
      status: row.status,
      receiptUrl: row.receiptUrl,
      submittedBy: row.submittedBy,
      approvedBy: row.approvedBy,
      organizationId: row.organizationId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      approver: row.approverId ? {
        id: row.approverId,
        name: row.approverName,
        email: row.approverEmail,
        username: row.approverUsername!,
        password: row.approverPassword!,
        role: row.approverRole!,
        organizationId: row.organizationId,
        createdAt: row.approverCreatedAt!,
        updatedAt: row.approverUpdatedAt!
      } : undefined
    }));
  }

  async getExpensesByDateRange(startDate: string, endDate: string, organizationId?: number): Promise<ExpenseWithApprover[]> {
    let query = db
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
        organizationId: schema.expenses.organizationId,
        createdAt: schema.expenses.createdAt,
        updatedAt: schema.expenses.updatedAt,
        approverId: schema.users.id,
        approverName: schema.users.name,
        approverEmail: schema.users.email,
        approverUsername: schema.users.username,
        approverPassword: schema.users.password,
        approverRole: schema.users.role,
        approverCreatedAt: schema.users.createdAt,
        approverUpdatedAt: schema.users.updatedAt,
        approverOrganizationId: schema.users.organizationId
      })
      .from(schema.expenses)
      .leftJoin(schema.users, eq(schema.expenses.approvedBy, schema.users.id));

    if (organizationId) {
      query = query.where(and(
        gte(schema.expenses.date, startDate),
        lte(schema.expenses.date, endDate),
        eq(schema.expenses.organizationId, organizationId)
      )) as any;
    } else {
      query = query.where(and(
        gte(schema.expenses.date, startDate),
        lte(schema.expenses.date, endDate)
      )) as any;
    }

    const result = await query;

    return result.map(row => ({
      id: row.id,
      description: row.description,
      amount: row.amount,
      category: row.category,
      date: row.date,
      status: row.status,
      receiptUrl: row.receiptUrl,
      submittedBy: row.submittedBy,
      approvedBy: row.approvedBy,
      organizationId: row.organizationId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      approver: row.approverId ? {
        id: row.approverId,
        name: row.approverName,
        email: row.approverEmail,
        username: row.approverUsername!,
        password: row.approverPassword!,
        role: row.approverRole!,
        organizationId: row.organizationId,
        createdAt: row.approverCreatedAt!,
        updatedAt: row.approverUpdatedAt!
      } : undefined
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
    const payments = await db.select().from(schema.feePayments).where(eq(schema.feePayments.leadId, id));
    const eMandate = await db.select().from(schema.eMandates).where(eq(schema.eMandates.leadId, id));
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
          activePayments: [] as any[],
          activePlans: [] as any[],
          pendingFeePayments: [] as any[],
          activeMandates: [] as any[],
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
      if ((error as any).code === 'ACTIVE_FINANCIAL_OBLIGATIONS') {
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

  async getAllFeeStructures(organizationId?: number): Promise<FeeStructure[]> {
    if (organizationId) {
      return await db.select().from(schema.feeStructure).where(eq(schema.feeStructure.organizationId, organizationId));
    }
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

  async getAllFeePayments(organizationId?: number): Promise<FeePayment[]> {
    if (organizationId) {
      // Need to join with leads to filter by organizationId if not present on payment itself
      // But looking at schema, feePayments usually links to lead. Let's check schema.
      // If feePayments doesn't have organizationId, we filter by lead's organizationId.
      return await db.select()
        .from(schema.feePayments)
        .leftJoin(schema.leads, eq(schema.feePayments.leadId, schema.leads.id))
        .where(eq(schema.leads.organizationId, organizationId))
        .then(rows => rows.map(r => r.fee_payments)); // Extract just the payment object
    }
    return await db.select().from(schema.feePayments);
  }

  async getFeePaymentsByStudent(studentId: number): Promise<FeePayment[]> {
    return await db.select().from(schema.feePayments).where(eq(schema.feePayments.leadId, studentId));
  }

  async createFeePayment(insertFeePayment: InsertFeePayment): Promise<FeePayment> {
    const result = await db.insert(schema.feePayments).values(insertFeePayment).returning();
    const payment = result[0];

    // Get student details for notification
    const lead = await this.getLead(payment.leadId);
    const studentName = lead ? lead.name : `Student ${payment.leadId}`;

    // Invalidate dashboard and organization cache
    if (payment.organizationId) {
      cacheService.invalidateOrganization(payment.organizationId);
    }
    cacheService.invalidate('dashboard:*');

    await this.notifyChange(
      'fee',
      'Fee Payment Recorded',
      `Payment of ₹${payment.amount} received from ${studentName}`,
      'medium',
      'view_payment',
      payment.id.toString()
    );
    return payment;
  }

  async updateFeePayment(id: number, updates: Partial<FeePayment>): Promise<FeePayment | undefined> {
    const result = await db.update(schema.feePayments).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(schema.feePayments.id, id)).returning();
    const payment = result[0];
    if (payment && payment.organizationId) {
      cacheService.invalidateOrganization(payment.organizationId);
      cacheService.invalidate('dashboard:*');
    }
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
    const result = await db.select().from(schema.eMandates).where(eq(schema.eMandates.leadId, studentId));
    return result[0];
  }

  async getAllEMandates(organizationId?: number): Promise<EMandate[]> {
    if (organizationId) {
      return await db.select()
        .from(schema.eMandates)
        .leftJoin(schema.leads, eq(schema.eMandates.leadId, schema.leads.id))
        .where(eq(schema.leads.organizationId, organizationId))
        .then(rows => rows.map(r => r.e_mandates));
    }
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

  async getAllGlobalClassFees(organizationId?: number): Promise<GlobalClassFee[]> {
    if (organizationId) {
      return await db.select().from(schema.globalClassFees).where(eq(schema.globalClassFees.organizationId, organizationId));
    }
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

  async getAllEmiPlans(organizationId?: number): Promise<EmiPlan[]> {
    if (organizationId) {
      return await db.select()
        .from(schema.emiPlans)
        .leftJoin(schema.leads, eq(schema.emiPlans.studentId, schema.leads.id))
        .where(eq(schema.leads.organizationId, organizationId))
        .then(rows => rows.map(r => r.emi_plans));
    }
    return await db.select().from(schema.emiPlans);
  }

  async getEmiPlanById(id: number) {
    const result = await db.select().from(schema.emiPlans)
      .where(eq(schema.emiPlans.id, id));
    return result[0];
  }

  async getActiveEmiPlans(studentId: number) {
    return await db.select().from(schema.emiPlans)
      .where(and(
        eq(schema.emiPlans.studentId, studentId),
        eq(schema.emiPlans.status, 'active')
      ));
  }

  async getEmiPlanByStudentId(studentId: number) {
    const result = await db.select().from(schema.emiPlans)
      .where(and(
        eq(schema.emiPlans.studentId, studentId),
        eq(schema.emiPlans.status, 'active')
      ))
      .orderBy(desc(schema.emiPlans.createdAt))
      .limit(1);
    return result[0];
  }

  async getEmiPlanPayments(planId: number) {
    const plan = await this.getEmiPlanById(planId);
    if (!plan) return [];

    return await db.select().from(schema.feePayments)
      .where(and(
        eq(schema.feePayments.leadId, plan.studentId),
        isNotNull(schema.feePayments.installmentNumber)
      ))
      .orderBy(schema.feePayments.installmentNumber);
  }

  async getCompletedInstallments(planId: number): Promise<number> {
    const payments = await this.getEmiPlanPayments(planId);
    if (!payments) return 0;
    const uniqueInstallments = new Set(payments.map(p => p.installmentNumber));
    return uniqueInstallments.size;
  }

  async createEmiPlan(insertEmiPlan: InsertEmiPlan, installments?: { amount: string, dueDate: string }[]): Promise<EmiPlan> {
    const result = await db.insert(schema.emiPlans).values(insertEmiPlan).returning();
    const plan = result[0];

    // If custom installments provided, create schedule
    if (installments && installments.length > 0) {
      for (let i = 0; i < installments.length; i++) {
        await db.insert(schema.emiSchedule).values({
          studentId: plan.studentId,
          emiPlanId: plan.id,
          installmentNumber: i + 1,
          amount: installments[i].amount,
          dueDate: installments[i].dueDate,
          status: 'pending'
        });
      }
    }

    // Get student/lead details for the notification
    const lead = await this.getLead(plan.studentId);
    const studentName = lead ? lead.name : `Student ${plan.studentId}`;

    // Invalidate dashboard and organization cache
    if (plan.organizationId) {
      cacheService.invalidateOrganization(plan.organizationId);
    }
    cacheService.invalidate('dashboard:*');

    await this.notifyChange(
      'emi',
      'EMI Plan Created',
      `EMI plan for ${studentName} created`,
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
      // Invalidate dashboard and organization cache
      if (plan.organizationId) {
        cacheService.invalidateOrganization(plan.organizationId);
      }
      cacheService.invalidate('dashboard:*');

      // Get student/lead details for the notification
      const lead = await this.getLead(plan.studentId);
      const studentName = lead ? lead.name : `Student ${plan.studentId}`;

      await this.notifyChange(
        'emi',
        'EMI Plan Updated',
        `EMI plan for ${studentName} updated`,
        'medium',
        'view_emi_plan',
        plan.id.toString()
      );
    }
    return plan;
  }

  async deleteEmiPlan(id: number): Promise<boolean> {
    // Get plan details before deletion for the notification
    const plan = await this.getEmiPlanById(id);
    let studentName = `Student (Plan ${id})`;

    if (plan) {
      const lead = await this.getLead(plan.studentId);
      if (lead) {
        studentName = lead.name;
      }
    }

    // Delete associated schedule first
    await db.delete(schema.emiSchedule).where(eq(schema.emiSchedule.emiPlanId, id));

    await db.delete(schema.emiPlans).where(eq(schema.emiPlans.id, id));

    // Invalidate dashboard and organization cache
    if (plan && plan.organizationId) {
      cacheService.invalidateOrganization(plan.organizationId);
    }
    cacheService.invalidate('dashboard:*');

    return true;
  }

  // EMI Payment tracking operations
  async getPendingEmisForPlan(emiPlanId: number): Promise<any[]> {
    try {
      const emiPlan = await this.getEmiPlan(emiPlanId);
      if (!emiPlan) {
        throw new Error("EMI plan not found");
      }

      // Check for stored schedule first
      const storedSchedule = await db.select().from(schema.emiSchedule)
        .where(eq(schema.emiSchedule.emiPlanId, emiPlanId))
        .orderBy(schema.emiSchedule.installmentNumber);

      // Get all payments for this EMI plan
      const payments = await db.select().from(schema.feePayments)
        .where(eq(schema.feePayments.leadId, emiPlan.studentId))
        .orderBy(schema.feePayments.installmentNumber);

      const paidInstallments = new Set(
        payments
          .filter(p => p.installmentNumber !== null)
          .map(p => p.installmentNumber!)
      );

      const pendingEmis = [];

      if (storedSchedule.length > 0) {
        // Use stored schedule
        for (const item of storedSchedule) {
          if (!paidInstallments.has(item.installmentNumber)) {
            pendingEmis.push({
              installmentNumber: item.installmentNumber,
              amount: item.amount,
              dueDate: item.dueDate,
              status: item.status
            });
          }
        }
      } else {
        // Fallback to dynamic calculation
        for (let i = 1; i <= emiPlan.numberOfInstallments; i++) {
          if (!paidInstallments.has(i)) {
            pendingEmis.push({
              installmentNumber: i,
              amount: emiPlan.installmentAmount,
              dueDate: this.calculateEmiDueDate(emiPlan.startDate, i, 'monthly'),
              status: 'pending'
            });
          }
        }
      }

      return pendingEmis;
    } catch (error) {
      console.error("Error getting pending EMIs:", error);
      throw error;
    }
  }

  async getEmiPlanSchedule(emiPlanId: number): Promise<any[]> {
    try {
      const emiPlan = await this.getEmiPlan(emiPlanId);
      if (!emiPlan) {
        throw new Error("EMI plan not found");
      }

      // Check for stored schedule first
      const storedSchedule = await db.select().from(schema.emiSchedule)
        .where(eq(schema.emiSchedule.emiPlanId, emiPlanId))
        .orderBy(schema.emiSchedule.installmentNumber);

      // Get payments to map status
      const payments = await db.select().from(schema.feePayments)
        .where(eq(schema.feePayments.leadId, emiPlan.studentId))
        .orderBy(schema.feePayments.installmentNumber);

      const paidInstallments = new Set(
        payments
          .filter(p => p.installmentNumber !== null)
          .map(p => p.installmentNumber!)
      );

      const fullSchedule = [];

      if (storedSchedule.length > 0) {
        // Use stored schedule
        for (const item of storedSchedule) {
          fullSchedule.push({
            installmentNumber: item.installmentNumber,
            amount: item.amount,
            dueDate: item.dueDate,
            status: paidInstallments.has(item.installmentNumber) ? 'paid' : item.status
          });
        }
      } else {
        // Fallback to dynamic calculation for older plans
        for (let i = 1; i <= emiPlan.numberOfInstallments; i++) {
          fullSchedule.push({
            installmentNumber: i,
            amount: emiPlan.installmentAmount,
            dueDate: this.calculateEmiDueDate(emiPlan.startDate, i, 'monthly'),
            status: paidInstallments.has(i) ? 'paid' : 'pending'
          });
        }
      }

      return fullSchedule;
    } catch (error) {
      console.error("Error getting EMI schedule:", error);
      throw error;
    }
  }

  async getEmiPaymentProgress(emiPlanId: number): Promise<any> {
    try {
      const emiPlan = await this.getEmiPlan(emiPlanId);
      if (!emiPlan) {
        throw new Error("EMI plan not found");
      }

      // Get all payments for this EMI plan (excluding down payment which has installmentNumber: 0)
      const payments = await db.select().from(schema.feePayments)
        .where(eq(schema.feePayments.leadId, emiPlan.studentId))
        .orderBy(schema.feePayments.installmentNumber);

      // Filter out down payments (installmentNumber: 0) when calculating EMI progress
      const emiPayments = payments.filter(p => p.installmentNumber && p.installmentNumber > 0);

      const totalPaid = emiPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const totalAmount = parseFloat(emiPlan.totalAmount);
      const paidInstallments = emiPayments.length;
      const totalInstallments = emiPlan.numberOfInstallments;
      const nextInstallment = paidInstallments + 1;

      const isCompleted = paidInstallments >= totalInstallments;

      // Auto-update status if completed but not marked as such
      if (isCompleted && emiPlan.status !== 'completed') {
        await this.updateEmiPlan(emiPlanId, { status: 'completed' });
      }

      return {
        emiPlanId,
        totalAmount,
        totalPaid,
        remainingAmount: totalAmount - totalPaid,
        paidInstallments,
        totalInstallments,
        nextInstallment: nextInstallment <= totalInstallments ? nextInstallment : null,
        completionPercentage: (paidInstallments / totalInstallments) * 100,
        isCompleted,
        payments: emiPayments.map(p => ({
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
    const payment = await this.getFeePayment(id);
    if (payment && payment.organizationId) {
      cacheService.invalidateOrganization(payment.organizationId);
      cacheService.invalidate('dashboard:*');
    }
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
      query = (query as any).limit(limit);
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
      query = (query as any).limit(limit);
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
        fatherFirstName: deletedLead.father_first_name,
        fatherLastName: deletedLead.father_last_name,
        fatherPhone: deletedLead.father_phone,
        motherFirstName: deletedLead.mother_first_name,
        motherLastName: deletedLead.mother_last_name,
        motherPhone: deletedLead.mother_phone,
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
        father_first_name: lead.fatherFirstName || null,
        father_last_name: lead.fatherLastName || null,
        father_phone: lead.fatherPhone || null,
        mother_first_name: lead.motherFirstName || null,
        mother_last_name: lead.motherLastName || null,
        mother_phone: lead.motherPhone || null,
        address: lead.address,
        interested_program: lead.interestedProgram,
        deleted_at: new Date(),
      };

      console.log('Step 3: Inserting into recently_deleted_leads...');
      await db.insert(schema.recentlyDeletedLeads).values(insertObj);
      console.log('Insert into recently_deleted_leads successful');

      console.log('Step 4: Deleting from main leads table...');
      const deleteResult = await db.delete(schema.leads).where(eq(schema.leads.id, id));
      console.log('Delete from main leads table successful, rows affected:', (deleteResult as any).rowCount);

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
          basicSalary: String(basicSalary),
          allowances: String(allowances),
          deductions: String(deductions),
          overtime: String(overtime),
          netSalary: String(netSalary),
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
      // Get a system user (first available user) since we don't have a dedicated system user
      // This prevents foreign key errors if user with ID 1 does not exist
      const systemUser = await db.select().from(schema.users).limit(1);
      const userId = systemUser.length > 0 ? systemUser[0].id : 1;

      // Create notification object with explicit undefined checks
      const notificationData: any = {
        userId,
        type,
        title,
        message,
        priority,
        metadata: JSON.stringify({ systemGenerated: true })
      };

      if (actionType) notificationData.actionType = actionType;
      if (actionId) notificationData.actionId = actionId;

      await this.createNotification(notificationData);
    } catch (err) {
      console.error('Failed to create notification', err);
    }
  }
  // Message Templates
  async getAllMessageTemplates(
    organizationId?: number,
    filters?: {
      category?: string;
      isActive?: boolean;
      searchTerm?: string;
    }
  ): Promise<schema.MessageTemplate[]> {
    const conditions = [];

    // Organization filter
    if (organizationId) {
      conditions.push(eq(schema.messageTemplates.organizationId, organizationId));
    }

    // Category filter
    if (filters?.category) {
      conditions.push(eq(schema.messageTemplates.category, filters.category));
    }

    // Active status filter
    if (filters?.isActive !== undefined) {
      conditions.push(eq(schema.messageTemplates.isActive, filters.isActive));
    }

    // Search filter
    if (filters?.searchTerm) {
      conditions.push(
        or(
          ilike(schema.messageTemplates.displayName, `%${filters.searchTerm}%`),
          ilike(schema.messageTemplates.name, `%${filters.searchTerm}%`),
          ilike(schema.messageTemplates.content, `%${filters.searchTerm}%`)
        )
      );
    }

    const query = conditions.length > 0
      ? db.select().from(schema.messageTemplates)
        .where(and(...conditions))
        .orderBy(schema.messageTemplates.displayName)
      : db.select().from(schema.messageTemplates)
        .orderBy(schema.messageTemplates.displayName);

    return await query;
  }

  async getMessageTemplate(id: number): Promise<schema.MessageTemplate | undefined> {
    const result = await db.select().from(schema.messageTemplates)
      .where(eq(schema.messageTemplates.id, id));
    return result[0];
  }

  async createMessageTemplate(template: schema.InsertMessageTemplate): Promise<schema.MessageTemplate> {
    // Auto-generate internal name from displayName if not provided
    const templateData = {
      ...template,
      name: template.name || template.displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      isActive: template.isActive !== undefined ? template.isActive : true,
      isDefault: template.isDefault || false,
    };

    const result = await db.insert(schema.messageTemplates).values(templateData).returning();
    return result[0];
  }

  async updateMessageTemplate(id: number, updates: Partial<schema.MessageTemplate>): Promise<schema.MessageTemplate | undefined> {
    const result = await db.update(schema.messageTemplates)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(schema.messageTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteMessageTemplate(id: number): Promise<boolean> {
    // Check if it's a default template
    const template = await this.getMessageTemplate(id);
    if (template?.isDefault) {
      throw new Error("Cannot delete default templates");
    }
    await db.delete(schema.messageTemplates).where(eq(schema.messageTemplates.id, id));
    return true;
  }

  // Communication Logs Implementation
  async createCommunicationLog(log: schema.InsertCommunicationLog): Promise<schema.CommunicationLog> {
    const result = await db.insert(schema.communicationLogs).values(log).returning();
    return result[0];
  }

  async getCommunicationLogs(limit: number = 50): Promise<schema.CommunicationLog[]> {
    return await db.select().from(schema.communicationLogs)
      .orderBy(desc(schema.communicationLogs.sentAt))
      .limit(limit);
  }

  // =====================================================
  // INVENTORY/STOCK MANAGEMENT FUNCTIONS
  // =====================================================

  // Inventory Categories
  async getInventoryCategories(organizationId: number) {
    return await db.select()
      .from(schema.inventoryCategories)
      .where(eq(schema.inventoryCategories.organizationId, organizationId))
      .orderBy(schema.inventoryCategories.name);
  }

  async createInventoryCategory(category: schema.InsertInventoryCategory) {
    const result = await db.insert(schema.inventoryCategories).values(category).returning();
    return result[0];
  }

  async updateInventoryCategory(id: number, updates: Partial<schema.InventoryCategory>) {
    const result = await db.update(schema.inventoryCategories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.inventoryCategories.id, id))
      .returning();
    return result[0];
  }

  async deleteInventoryCategory(id: number, force: boolean = false) {
    // Check for existing items
    const [existingItem] = await db.select({ id: schema.inventoryItems.id })
      .from(schema.inventoryItems)
      .where(eq(schema.inventoryItems.categoryId, id))
      .limit(1);

    if (existingItem) {
      if (force) {
        // Unlink items (set categoryId to null)
        await db.update(schema.inventoryItems)
          .set({ categoryId: null, updatedAt: new Date() })
          .where(eq(schema.inventoryItems.categoryId, id));
      } else {
        throw new Error("Cannot delete category with associated inventory items");
      }
    }

    await db.delete(schema.inventoryCategories).where(eq(schema.inventoryCategories.id, id));
    return true;
  }

  // Inventory Suppliers
  async getInventorySuppliers(organizationId: number) {
    return await db.select()
      .from(schema.inventorySuppliers)
      .where(eq(schema.inventorySuppliers.organizationId, organizationId))
      .orderBy(schema.inventorySuppliers.name);
  }

  async createInventorySupplier(supplier: schema.InsertInventorySupplier) {
    const result = await db.insert(schema.inventorySuppliers).values(supplier).returning();
    return result[0];
  }

  async updateInventorySupplier(id: number, updates: Partial<schema.InventorySupplier>) {
    const result = await db.update(schema.inventorySuppliers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.inventorySuppliers.id, id))
      .returning();
    return result[0];
  }

  async deleteInventorySupplier(id: number, force: boolean = false) {
    // Check for existing items
    const [existingItem] = await db.select({ id: schema.inventoryItems.id })
      .from(schema.inventoryItems)
      .where(eq(schema.inventoryItems.supplierId, id))
      .limit(1);

    if (existingItem) {
      if (force) {
        // Unlink items (set supplierId to null)
        await db.update(schema.inventoryItems)
          .set({ supplierId: null, updatedAt: new Date() })
          .where(eq(schema.inventoryItems.supplierId, id));
      } else {
        throw new Error("Cannot delete supplier with associated inventory items");
      }
    }

    await db.delete(schema.inventorySuppliers).where(eq(schema.inventorySuppliers.id, id));
    return true;
  }

  // Inventory Items - Main CRUD operations
  async getInventoryItems(organizationId: number, filters?: {
    categoryId?: number;
    supplierId?: number;
    searchTerm?: string;
    isActive?: boolean;
  }) {
    let query = db.select({
      item: schema.inventoryItems,
      category: schema.inventoryCategories,
      supplier: schema.inventorySuppliers
    })
      .from(schema.inventoryItems)
      .leftJoin(schema.inventoryCategories, eq(schema.inventoryItems.categoryId, schema.inventoryCategories.id))
      .leftJoin(schema.inventorySuppliers, eq(schema.inventoryItems.supplierId, schema.inventorySuppliers.id))
      .where(eq(schema.inventoryItems.organizationId, organizationId));

    // Apply filters
    const conditions = [eq(schema.inventoryItems.organizationId, organizationId)];

    if (filters?.categoryId) {
      conditions.push(eq(schema.inventoryItems.categoryId, filters.categoryId));
    }
    if (filters?.supplierId) {
      conditions.push(eq(schema.inventoryItems.supplierId, filters.supplierId));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(schema.inventoryItems.isActive, filters.isActive));
    }
    if (filters?.searchTerm) {
      conditions.push(
        or(
          ilike(schema.inventoryItems.name, `%${filters.searchTerm}%`),
          ilike(schema.inventoryItems.itemCode, `%${filters.searchTerm}%`)
        )
      );
    }

    query = query.where(and(...conditions)) as any;
    const results = await query.orderBy(schema.inventoryItems.name);

    return results.map(({ item, category, supplier }) => ({
      ...item,
      category,
      supplier
    }));
  }

  async getInventoryItem(id: number, organizationId: number) {
    const result = await db.select({
      item: schema.inventoryItems,
      category: schema.inventoryCategories,
      supplier: schema.inventorySuppliers
    })
      .from(schema.inventoryItems)
      .leftJoin(schema.inventoryCategories, eq(schema.inventoryItems.categoryId, schema.inventoryCategories.id))
      .leftJoin(schema.inventorySuppliers, eq(schema.inventoryItems.supplierId, schema.inventorySuppliers.id))
      .where(and(
        eq(schema.inventoryItems.id, id),
        eq(schema.inventoryItems.organizationId, organizationId)
      ));

    if (result.length === 0) return undefined;

    const { item, category, supplier } = result[0];
    return { ...item, category, supplier };
  }

  async createInventoryItem(item: schema.InsertInventoryItem) {
    const result = await db.insert(schema.inventoryItems).values(item).returning();
    return result[0];
  }

  async updateInventoryItem(id: number, updates: Partial<schema.InventoryItem>) {
    const result = await db.update(schema.inventoryItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.inventoryItems.id, id))
      .returning();
    return result[0];
  }

  async deleteInventoryItem(id: number) {
    // Check for dependencies (transactions or expenses)
    const [transaction] = await db.select({ id: schema.inventoryTransactions.id })
      .from(schema.inventoryTransactions)
      .where(eq(schema.inventoryTransactions.itemId, id))
      .limit(1);

    const [expense] = await db.select({ id: schema.expenses.id })
      .from(schema.expenses)
      .where(eq(schema.expenses.inventoryItemId, id))
      .limit(1);

    if (transaction || expense) {
      // Soft Delete
      await db.update(schema.inventoryItems)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(schema.inventoryItems.id, id));
      return { success: true, method: 'soft_delete', message: "Item archived to preserve history" };
    } else {
      // Hard Delete
      await db.delete(schema.inventoryItems).where(eq(schema.inventoryItems.id, id));
      return { success: true, method: 'hard_delete' };
    }
  }

  // Stock Transactions - Complete audit trail
  async createInventoryTransaction(transaction: schema.InsertInventoryTransaction & { createExpense?: boolean; expenseCategory?: string }) {
    const { createExpense, expenseCategory, ...txData } = transaction;

    // Start a transaction to ensure atomic operations
    const result = await db.transaction(async (tx) => {
      // Create the inventory transaction
      const [inventoryTx] = await tx.insert(schema.inventoryTransactions).values(txData).returning();

      // Update item stock level
      await tx.update(schema.inventoryItems)
        .set({
          currentStock: inventoryTx.stockAfter,
          updatedAt: new Date()
        })
        .where(eq(schema.inventoryItems.id, inventoryTx.itemId));

      // Check for low stock and create alert if necessary
      const [item] = await tx.select()
        .from(schema.inventoryItems)
        .where(eq(schema.inventoryItems.id, inventoryTx.itemId));

      if (item && item.minimumStock && inventoryTx.stockAfter < item.minimumStock) {
        // Check if there's already an unresolved alert
        const existingAlerts = await tx.select()
          .from(schema.lowStockAlerts)
          .where(and(
            eq(schema.lowStockAlerts.itemId, item.id),
            eq(schema.lowStockAlerts.isResolved, false)
          ));

        if (existingAlerts.length === 0) {
          await tx.insert(schema.lowStockAlerts).values({
            itemId: item.id,
            currentStock: inventoryTx.stockAfter,
            minimumStock: item.minimumStock
          });
        }
      }

      // Create expense record if requested (for purchases)
      if (createExpense && inventoryTx.transactionType === 'in' && inventoryTx.totalCost) {
        const [expense] = await tx.insert(schema.expenses).values({
          description: `Purchase: ${item?.name || inventoryTx.reference || 'Inventory Item'}`,
          amount: inventoryTx.totalCost,
          category: expenseCategory || 'School Supplies',
          date: new Date().toISOString().split('T')[0],
          status: 'pending',
          inventoryItemId: inventoryTx.itemId,
          organizationId: item?.organizationId
        }).returning();

        // Link expense to transaction
        await tx.update(schema.inventoryTransactions)
          .set({ expenseId: expense.id })
          .where(eq(schema.inventoryTransactions.id, inventoryTx.id));

        return { ...inventoryTx, expenseId: expense.id };
      }

      return inventoryTx;
    });

    return result;
  }

  async getInventoryTransactions(organizationId: number, filters?: {
    itemId?: number;
    transactionType?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    let conditions = [];

    // We need to filter by organization through the item
    const query = db.select({
      transaction: schema.inventoryTransactions,
      item: schema.inventoryItems,
      lead: schema.leads
    })
      .from(schema.inventoryTransactions)
      .innerJoin(schema.inventoryItems, eq(schema.inventoryTransactions.itemId, schema.inventoryItems.id))
      .leftJoin(schema.leads, eq(schema.inventoryTransactions.leadId, schema.leads.id))
      .where(eq(schema.inventoryItems.organizationId, organizationId));

    if (filters?.itemId) {
      conditions.push(eq(schema.inventoryTransactions.itemId, filters.itemId));
    }
    if (filters?.transactionType) {
      conditions.push(eq(schema.inventoryTransactions.transactionType, filters.transactionType));
    }
    if (filters?.startDate) {
      conditions.push(gte(schema.inventoryTransactions.transactionDate, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(schema.inventoryTransactions.transactionDate, filters.endDate));
    }

    const finalQuery = conditions.length > 0
      ? query.where(and(eq(schema.inventoryItems.organizationId, organizationId), ...conditions))
      : query;

    const results = await finalQuery.orderBy(desc(schema.inventoryTransactions.transactionDate));

    return results.map(({ transaction, item, lead }) => ({
      ...transaction,
      item,
      lead
    }));
  }

  async getItemTransactionHistory(itemId: number, organizationId: number) {
    const results = await db.select({
      transaction: schema.inventoryTransactions,
      user: schema.users
    })
      .from(schema.inventoryTransactions)
      .innerJoin(schema.inventoryItems, eq(schema.inventoryTransactions.itemId, schema.inventoryItems.id))
      .leftJoin(schema.users, eq(schema.inventoryTransactions.userId, schema.users.id))
      .where(and(
        eq(schema.inventoryTransactions.itemId, itemId),
        eq(schema.inventoryItems.organizationId, organizationId)
      ))
      .orderBy(desc(schema.inventoryTransactions.transactionDate));

    return results.map(({ transaction, user }) => ({ ...transaction, user }));
  }

  // Low Stock Management
  async getLowStockItems(organizationId: number) {
    const results = await db.select({
      item: schema.inventoryItems,
      category: schema.inventoryCategories,
      supplier: schema.inventorySuppliers,
      alert: schema.lowStockAlerts
    })
      .from(schema.inventoryItems)
      .innerJoin(schema.lowStockAlerts, eq(schema.inventoryItems.id, schema.lowStockAlerts.itemId))
      .leftJoin(schema.inventoryCategories, eq(schema.inventoryItems.categoryId, schema.inventoryCategories.id))
      .leftJoin(schema.inventorySuppliers, eq(schema.inventoryItems.supplierId, schema.inventorySuppliers.id))
      .where(and(
        eq(schema.inventoryItems.organizationId, organizationId),
        eq(schema.lowStockAlerts.isResolved, false)
      ))
      .orderBy(schema.inventoryItems.name);

    return results.map(({ item, category, supplier, alert }) => ({
      ...item,
      category,
      supplier,
      alert
    }));
  }

  async resolveLowStockAlert(itemId: number) {
    await db.update(schema.lowStockAlerts)
      .set({ isResolved: true, resolvedAt: new Date() })
      .where(eq(schema.lowStockAlerts.itemId, itemId));
    return true;
  }

  // Expense Integration Functions
  async getExpensesByInventoryItem(itemId: number, organizationId: number) {
    return await db.select()
      .from(schema.expenses)
      .where(and(
        eq(schema.expenses.inventoryItemId, itemId),
        eq(schema.expenses.organizationId, organizationId)
      ))
      .orderBy(desc(schema.expenses.date));
  }

  async getInventoryRelatedExpenses(organizationId: number) {
    return await db.select({
      expense: schema.expenses,
      item: schema.inventoryItems
    })
      .from(schema.expenses)
      .leftJoin(schema.inventoryItems, eq(schema.expenses.inventoryItemId, schema.inventoryItems.id))
      .where(and(
        eq(schema.expenses.organizationId, organizationId),
        isNotNull(schema.expenses.inventoryItemId)
      ))
      .orderBy(desc(schema.expenses.date));
  }

  // Analytics & Statistics
  async getInventoryStats(organizationId: number) {
    // Get all items
    const items = await db.select()
      .from(schema.inventoryItems)
      .where(and(
        eq(schema.inventoryItems.organizationId, organizationId),
        eq(schema.inventoryItems.isActive, true)
      ));

    // Calculate total items
    const totalItems = items.length;

    // Calculate low stock count
    const lowStockCount = items.filter(item =>
      item.minimumStock && item.currentStock < item.minimumStock
    ).length;

    // Calculate total stock value
    const totalValue = items.reduce((sum, item) => {
      const cost = parseFloat(item.costPrice?.toString() || '0');
      const stock = item.currentStock || 0;
      return sum + (cost * stock);
    }, 0);

    // Get recent transactions count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = await db.select()
      .from(schema.inventoryTransactions)
      .innerJoin(schema.inventoryItems, eq(schema.inventoryTransactions.itemId, schema.inventoryItems.id))
      .where(and(
        eq(schema.inventoryItems.organizationId, organizationId),
        gte(schema.inventoryTransactions.transactionDate, thirtyDaysAgo)
      ));

    return {
      totalItems,
      lowStockCount,
      totalValue: totalValue.toFixed(2),
      recentTransactionsCount: recentTransactions.length,
      categories: await this.getInventoryCategories(organizationId),
      suppliers: await this.getInventorySuppliers(organizationId)
    };
  }

  // Bus Management Implementation
  async getBusRoutes(organizationId: number): Promise<BusRoute[]> {
    return await db.select().from(schema.busRoutes).where(eq(schema.busRoutes.organizationId, organizationId));
  }

  async createBusRoute(insertBusRoute: InsertBusRoute): Promise<BusRoute> {
    const result = await db.insert(schema.busRoutes).values(insertBusRoute).returning();
    return result[0];
  }

  async updateBusRoute(id: number, updates: Partial<BusRoute>): Promise<BusRoute | undefined> {
    const result = await db.update(schema.busRoutes).set({ ...updates, updatedAt: new Date() }).where(eq(schema.busRoutes.id, id)).returning();
    return result[0];
  }

  async deleteBusRoute(id: number): Promise<void> {
    await db.delete(schema.busRoutes).where(eq(schema.busRoutes.id, id));
  }

  async getBusStops(routeId: number): Promise<BusStop[]> {
    return await db.select().from(schema.busStops).where(eq(schema.busStops.routeId, routeId)).orderBy(schema.busStops.stopOrder);
  }

  async createBusStop(insertBusStop: InsertBusStop): Promise<BusStop> {
    const result = await db.insert(schema.busStops).values(insertBusStop).returning();
    return result[0];
  }

  async updateBusStop(id: number, updates: Partial<BusStop>): Promise<BusStop | undefined> {
    const result = await db.update(schema.busStops).set(updates).where(eq(schema.busStops.id, id)).returning();
    return result[0];
  }

  async deleteBusStop(id: number): Promise<void> {
    await db.delete(schema.busStops).where(eq(schema.busStops.id, id));
  }

  async getStudentAssignments(routeId?: number): Promise<StudentBusAssignment[]> {
    if (routeId) {
      return await db.select().from(schema.studentBusAssignments).where(eq(schema.studentBusAssignments.routeId, routeId));
    }
    return await db.select().from(schema.studentBusAssignments);
  }

  async assignStudentToBus(insertAssignment: InsertStudentBusAssignment): Promise<StudentBusAssignment> {
    const result = await db.insert(schema.studentBusAssignments).values(insertAssignment).returning();
    return result[0];
  }

  async removeStudentAssignment(id: number): Promise<void> {
    await db.delete(schema.studentBusAssignments).where(eq(schema.studentBusAssignments.id, id));
  }

  async getStockValuation(organizationId: number) {
    const items = await db.select()
      .from(schema.inventoryItems)
      .where(and(
        eq(schema.inventoryItems.organizationId, organizationId),
        eq(schema.inventoryItems.isActive, true)
      ));

    const valuation = items.map(item => ({
      itemId: item.id,
      itemName: item.name,
      currentStock: item.currentStock,
      costPrice: parseFloat(item.costPrice?.toString() || '0'),
      totalValue: (item.currentStock || 0) * parseFloat(item.costPrice?.toString() || '0')
    }));

    const totalValue = valuation.reduce((sum, item) => sum + item.totalValue, 0);

    return {
      items: valuation,
      totalValue: totalValue.toFixed(2),
      generatedAt: new Date().toISOString()
    };
  }

  // Mobile Content Management
  async getAnnouncementsForAdmin(organizationId: number): Promise<PreschoolAnnouncement[]> {
    return await db.select()
      .from(schema.preschoolAnnouncements)
      .where(eq(schema.preschoolAnnouncements.organizationId, organizationId))
      .orderBy(desc(schema.preschoolAnnouncements.publishedAt));
  }

  async createAnnouncement(announcement: InsertPreschoolAnnouncement): Promise<PreschoolAnnouncement> {
    const result = await db.insert(schema.preschoolAnnouncements).values(announcement).returning();
    return result[0];
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    await db.delete(schema.preschoolAnnouncements).where(eq(schema.preschoolAnnouncements.id, id));
    return true;
  }

  async getEventsForAdmin(organizationId: number): Promise<PreschoolEvent[]> {
    return await db.select()
      .from(schema.preschoolEvents)
      .where(eq(schema.preschoolEvents.organizationId, organizationId))
      .orderBy(asc(schema.preschoolEvents.eventDate));
  }

  async createEvent(event: InsertPreschoolEvent): Promise<PreschoolEvent> {
    const result = await db.insert(schema.preschoolEvents).values(event).returning();
    return result[0];
  }

  async deleteEvent(id: number): Promise<boolean> {
    await db.delete(schema.preschoolEvents).where(eq(schema.preschoolEvents.id, id));
    return true;
  }

  async getDailyUpdatesForAdmin(organizationId: number): Promise<DailyUpdate[]> {
    return await db.select()
      .from(schema.dailyUpdates)
      .where(eq(schema.dailyUpdates.organizationId, organizationId))
      .orderBy(desc(schema.dailyUpdates.postedAt));
  }

  async createDailyUpdate(update: InsertDailyUpdate): Promise<DailyUpdate> {
    const result = await db.insert(schema.dailyUpdates).values(update).returning();
    return result[0];
  }

  async deleteDailyUpdate(id: number): Promise<boolean> {
    await db.delete(schema.dailyUpdates).where(eq(schema.dailyUpdates.id, id));
    return true;
  }

  async getHomeworkForAdmin(organizationId: number): Promise<PreschoolHomework[]> {
    return await db.select()
      .from(schema.preschoolHomework)
      .where(eq(schema.preschoolHomework.organizationId, organizationId))
      .orderBy(desc(schema.preschoolHomework.postedAt));
  }

  async createHomework(homework: InsertPreschoolHomework): Promise<PreschoolHomework> {
    const result = await db.insert(schema.preschoolHomework).values(homework).returning();
    return result[0];
  }

  async deleteHomework(id: number): Promise<boolean> {
    await db.delete(schema.preschoolHomework).where(eq(schema.preschoolHomework.id, id));
    return true;
  }

  async getStudentBusAssignment(studentId: number) {
    const pickupStopApi = aliasedTable(schema.busStops, "pickup_stop");
    const dropStopApi = aliasedTable(schema.busStops, "drop_stop");

    const result = await db.select({
      assignment: schema.studentBusAssignments,
      route: schema.busRoutes,
      pickupStop: pickupStopApi,
      dropStop: dropStopApi,
      driver: schema.staff
    })
      .from(schema.studentBusAssignments)
      .innerJoin(schema.busRoutes, eq(schema.studentBusAssignments.routeId, schema.busRoutes.id))
      .leftJoin(schema.staff, eq(schema.busRoutes.driverId, schema.staff.id))
      .leftJoin(pickupStopApi, eq(schema.studentBusAssignments.pickupStopId, pickupStopApi.id))
      .leftJoin(dropStopApi, eq(schema.studentBusAssignments.dropStopId, dropStopApi.id))
      .where(eq(schema.studentBusAssignments.studentId, studentId));

    return result[0];
  }

  // Bus Live Location Tracking Methods
  async saveBusLocation(locationData: InsertBusLiveLocation) {
    const [result] = await db.insert(schema.busLiveLocations).values(locationData).returning();
    return result;
  }

  async getLatestBusLocation(routeId: number) {
    const result = await db.select()
      .from(schema.busLiveLocations)
      .where(and(
        eq(schema.busLiveLocations.routeId, routeId),
        eq(schema.busLiveLocations.isActive, true)
      ))
      .orderBy(desc(schema.busLiveLocations.timestamp))
      .limit(1);

    return result[0];
  }

  async deactivateBusLocation(routeId: number) {
    await db.update(schema.busLiveLocations)
      .set({ isActive: false })
      .where(eq(schema.busLiveLocations.routeId, routeId));
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

// Daycare Storage - Standalone module for daycare management
export { daycareStorage } from "./daycareStorage.js";

// Meta Marketing Storage - Standalone module for Meta marketing integration
export { metaStorage } from "./metaStorage.js";

// Only seed when explicitly enabled in non-production environments
const shouldSeed = process.env.NODE_ENV !== 'production' && process.env.SEED_ON_START === 'true';

if (shouldSeed) {
  initializeBasicData().catch((err) => {
    console.error("Error initializing basic data:", err);
  });
}