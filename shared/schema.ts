import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("counselor"), // counselor, admin, marketing_head
  name: text("name").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  class: text("class").notNull(), // Class 9, Class 10, etc.
  stream: text("stream"), // Science, Commerce, Arts
  status: text("status").notNull().default("new"), // new, contacted, interested, enrolled, dropped
  source: text("source").notNull(), // facebook, google_ads, website, referral, etc.
  counselorId: integer("counselor_id").references(() => users.id),
  assignedAt: timestamp("assigned_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastContactedAt: timestamp("last_contacted_at"),
  admissionLikelihood: decimal("admission_likelihood", { precision: 5, scale: 2 }), // AI prediction 0-100
  notes: text("notes"),
  parentName: text("parent_name"),
  parentPhone: text("parent_phone"),
  address: text("address"),
  interestedProgram: text("interested_program"),
  deletedAt: timestamp("deleted_at"),
});

export const followUps = pgTable("follow_ups", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  counselorId: integer("counselor_id").references(() => users.id).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  completedAt: timestamp("completed_at"),
  remarks: text("remarks"),
  outcome: text("outcome"), // interested, not_interested, needs_more_info, enrolled, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leadSources = pgTable("lead_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  conversions: integer("conversions").default(0),
  totalLeads: integer("total_leads").default(0),
});

// Staff Management
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id", { length: 50 }).unique(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 15 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(), // Teacher, Admin, Counselor, etc.
  department: varchar("department", { length: 100 }),
  dateOfJoining: date("date_of_joining").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  address: text("address"),
  emergencyContact: varchar("emergency_contact", { length: 15 }),
  qualifications: text("qualifications"),
  bankAccountNumber: varchar("bank_account_number", { length: 50 }),
  ifscCode: varchar("ifsc_code", { length: 11 }),
  panNumber: varchar("pan_number", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").references(() => staff.id).notNull(),
  date: date("date").notNull(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  hoursWorked: decimal("hours_worked", { precision: 4, scale: 2 }),
  status: varchar("status", { length: 20 }).default("present"), // present, absent, half-day, late
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payroll = pgTable("payroll", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").references(() => staff.id).notNull(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  basicSalary: decimal("basic_salary", { precision: 10, scale: 2 }).notNull(),
  allowances: decimal("allowances", { precision: 10, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).default("0"),
  overtime: decimal("overtime", { precision: 10, scale: 2 }).default("0"),
  netSalary: decimal("net_salary", { precision: 10, scale: 2 }).notNull(),
  attendedDays: integer("attended_days").default(30),
  paymentDate: date("payment_date"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, paid, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  date: date("date").notNull(),
  approvedBy: integer("approved_by").references(() => users.id),
  receiptUrl: varchar("receipt_url", { length: 500 }),
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Student Management
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  rollNumber: varchar("roll_number", { length: 50 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 15 }).notNull(),
  class: varchar("class", { length: 20 }).notNull(),
  stream: varchar("stream", { length: 50 }).notNull(),
  parentName: varchar("parent_name", { length: 100 }).notNull(),
  parentPhone: varchar("parent_phone", { length: 15 }).notNull(),
  address: text("address"),
  dateOfBirth: date("date_of_birth"),
  admissionDate: date("admission_date").notNull(),
  status: varchar("status", { length: 20 }).default("active"), // active, graduated, dropped_out
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feeStructure = pgTable("fee_structure", {
  id: serial("id").primaryKey(),
  class: varchar("class", { length: 20 }).notNull(),
  stream: varchar("stream", { length: 50 }).notNull(),
  totalFees: decimal("total_fees", { precision: 10, scale: 2 }).notNull(),
  installments: integer("installments").notNull(),
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Global Class Fee Structure - for setting fees per class that can be used for calculations
export const globalClassFees = pgTable("global_class_fees", {
  id: serial("id").primaryKey(),
  className: varchar("class_name", { length: 20 }).notNull(),
  feeType: varchar("fee_type", { length: 50 }).notNull(), // tuition, admission, library, etc.
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  frequency: varchar("frequency", { length: 20 }).notNull(), // monthly, quarterly, yearly, one-time
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feePayments = pgTable("fee_payments", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  paymentDate: date("payment_date").notNull(),
  paymentMode: varchar("payment_mode", { length: 20 }).notNull(), // cash, online, cheque, emi
  receiptNumber: varchar("receipt_number", { length: 100 }),
  installmentNumber: integer("installment_number"),
  transactionId: varchar("transaction_id", { length: 100 }),
  status: varchar("status", { length: 20 }).default("completed"), // completed, pending, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eMandates = pgTable("e_mandates", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  mandateId: varchar("mandate_id", { length: 100 }).unique().notNull(),
  bankAccount: varchar("bank_account", { length: 50 }).notNull(),
  ifscCode: varchar("ifsc_code", { length: 11 }).notNull(),
  maxAmount: decimal("max_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("active"), // active, inactive, cancelled
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emiSchedule = pgTable("emi_schedule", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  eMandateId: integer("e_mandate_id").references(() => eMandates.id),
  installmentNumber: integer("installment_number").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  paidDate: date("paid_date"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, paid, failed, overdue
  transactionId: varchar("transaction_id", { length: 100 }),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// EMI Plan Configuration - stores the EMI plan details for students
export const emiPlans = pgTable("emi_plans", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  numberOfInstallments: integer("number_of_installments").notNull(),
  installmentAmount: decimal("installment_amount", { precision: 10, scale: 2 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: varchar("status", { length: 20 }).default("active"), // active, completed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // admission, payment, attendance, exam, staff, maintenance, event, parent, lead, followup
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  priority: varchar("priority", { length: 20 }).default("medium"), // high, medium, low
  read: boolean("read").default(false),
  actionType: varchar("action_type", { length: 50 }), // view_admission, view_payment, view_attendance, etc.
  actionId: varchar("action_id", { length: 100 }), // ID of the related record
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const recentlyDeletedLeads = pgTable("recently_deleted_leads", {
  id: serial("id").primaryKey(),
  original_lead_id: integer("original_lead_id"),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  class: text("class").notNull(),
  stream: text("stream"),
  status: text("status").notNull(),
  source: text("source").notNull(),
  counselor_id: integer("counselor_id"),
  assigned_at: timestamp("assigned_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  last_contacted_at: timestamp("last_contacted_at"),
  admission_likelihood: decimal("admission_likelihood", { precision: 5, scale: 2 }),
  notes: text("notes"),
  parent_name: text("parent_name"),
  parent_phone: text("parent_phone"),
  address: text("address"),
  interested_program: text("interested_program"),
  deleted_at: timestamp("deleted_at").notNull(),
});

export const recentlyDeletedEmployee = pgTable("recently_deleted_employee", {
  id: serial("id").primaryKey(),
  original_staff_id: integer("original_staff_id"),
  employee_id: varchar("employee_id", { length: 50 }),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 15 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  department: varchar("department", { length: 100 }),
  date_of_joining: date("date_of_joining").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  is_active: boolean("is_active").default(true),
  address: text("address"),
  emergency_contact: varchar("emergency_contact", { length: 15 }),
  qualifications: text("qualifications"),
  bank_account_number: varchar("bank_account_number", { length: 50 }),
  ifsc_code: varchar("ifsc_code", { length: 11 }),
  pan_number: varchar("pan_number", { length: 10 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at").notNull(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true });
export const insertFollowUpSchema = createInsertSchema(followUps).omit({ id: true, createdAt: true });
export const insertLeadSourceSchema = createInsertSchema(leadSources).omit({ id: true });
export const insertStaffSchema = createInsertSchema(staff)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    phone: z.string()
      .max(10, { message: "Phone number must be exactly 10 digits" })
      .regex(/^\d{10}$/, { message: "Ph number must contain only 10 digits (0-9)" })
  });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, createdAt: true });
export const insertPayrollSchema = createInsertSchema(payroll).omit({ id: true, createdAt: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFeeStructureSchema = createInsertSchema(feeStructure).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGlobalClassFeeSchema = createInsertSchema(globalClassFees).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFeePaymentSchema = createInsertSchema(feePayments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEMandateSchema = createInsertSchema(eMandates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmiScheduleSchema = createInsertSchema(emiSchedule).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmiPlanSchema = createInsertSchema(emiPlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRecentlyDeletedEmployeeSchema = createInsertSchema(recentlyDeletedEmployee).omit({ id: true, created_at: true, updated_at: true });

// Create types
export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type FollowUp = typeof followUps.$inferSelect;
export type LeadSource = typeof leadSources.$inferSelect;
export type Staff = typeof staff.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Payroll = typeof payroll.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Student = typeof students.$inferSelect;
export type FeeStructure = typeof feeStructure.$inferSelect;
export type GlobalClassFee = typeof globalClassFees.$inferSelect;
export type FeePayment = typeof feePayments.$inferSelect;
export type EMandate = typeof eMandates.$inferSelect;
export type EmiSchedule = typeof emiSchedule.$inferSelect;
export type EmiPlan = typeof emiPlans.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type RecentlyDeletedEmployee = typeof recentlyDeletedEmployee.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertFollowUp = z.infer<typeof insertFollowUpSchema>;
export type InsertLeadSource = z.infer<typeof insertLeadSourceSchema>;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertFeeStructure = z.infer<typeof insertFeeStructureSchema>;
export type InsertGlobalClassFee = z.infer<typeof insertGlobalClassFeeSchema>;
export type InsertFeePayment = z.infer<typeof insertFeePaymentSchema>;
export type InsertEMandate = z.infer<typeof insertEMandateSchema>;
export type InsertEmiSchedule = z.infer<typeof insertEmiScheduleSchema>;
export type InsertEmiPlan = z.infer<typeof insertEmiPlanSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Complex types for joins
export type LeadWithCounselor = Lead & {
  counselor?: User;
};

export type StaffWithDetails = Staff & {
  recentAttendance?: Attendance[];
  currentPayroll?: Payroll;
};

export type StudentWithFees = Student & {
  feeStructure?: FeeStructure;
  payments?: FeePayment[];
  eMandate?: EMandate;
  emiSchedule?: EmiSchedule[];
  emiPlans?: EmiPlan[];
};

export type ExpenseWithApprover = Expense & {
  approver?: User;
};