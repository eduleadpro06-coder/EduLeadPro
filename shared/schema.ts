import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, date, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Organizations - Multi-tenant support
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }), // Organization phone number
  address: text("address"), // Organization address
  city: varchar("city", { length: 100 }), // City
  state: varchar("state", { length: 100 }), // State
  pincode: varchar("pincode", { length: 10 }), // PIN code
  email: varchar("email", { length: 255 }), // Organization official email
  settings: jsonb("settings"), // JSON for logo, timezone, billing config, etc.
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Organization Holidays - School closures and holidays
export const organizationHolidays = pgTable("organization_holidays", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  holidayName: varchar("holiday_name", { length: 255 }).notNull(),
  holidayDate: date("holiday_date").notNull(),
  description: text("description"),
  isRepeating: boolean("is_repeating").default(false),
  createdBy: varchar("created_by", { length: 255 }), // Stored as varchar in DB
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("counselor"), // counselor, admin, marketing_head, super_admin
  name: text("name"),
  email: text("email"),
  profilePhoto: text("profile_photo"), // Profile photo URL
  organizationId: integer("organization_id").references(() => organizations.id),
  notificationPreferences: jsonb("notification_preferences"), // JSON for notification settings
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  class: text("class").notNull(), // Class 9, Class 10, etc.
  section: text("section"), // Section A, B, etc.
  batch: text("batch"), // Batch time/year
  stream: text("stream"), // Science, Commerce, Arts
  status: text("status").notNull().default("new"), // new, contacted, interested, ready_for_admission, future_intake, enrolled, dropped
  source: text("source").notNull(), // facebook, google_ads, website, referral, etc.
  counselorId: integer("counselor_id").references(() => staff.id), // Changed to reference staff instead of users
  assignedAt: timestamp("assigned_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastContactedAt: timestamp("last_contacted_at"),

  notes: text("notes"),
  fatherFirstName: text("father_first_name"),
  fatherLastName: text("father_last_name"),
  fatherPhone: text("father_phone"),
  motherFirstName: text("mother_first_name"),
  motherLastName: text("mother_last_name"),
  motherPhone: text("mother_phone"),
  address: text("address"),
  interestedProgram: text("interested_program"),
  admissionLikelihood: text("admission_likelihood"),
  deletedAt: timestamp("deleted_at"),
  organizationId: integer("organization_id").references(() => organizations.id),
  appPassword: text("app_password"),
  isAppActive: boolean("is_app_active").default(true),
  isEnrolled: boolean("is_enrolled").default(false), // Enrollment status flag
  metaLeadId: text("meta_lead_id"), // Meta Lead ID for CAPI tracking
});

export const followUps = pgTable("follow_ups", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(), // Removed foreign key reference to allow independent existence
  counselorId: integer("counselor_id").references(() => staff.id).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  completedAt: timestamp("completed_at"),
  remarks: text("remarks"),
  outcome: text("outcome"), // interested, not_interested, needs_more_info, enrolled, etc.
  organizationId: integer("organization_id").references(() => organizations.id),
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
  organizationId: integer("organization_id").references(() => organizations.id),
  appPassword: varchar("app_password", { length: 255 }),
  clLimit: integer("cl_limit").default(10), // Casual Leave Limit
  elLimit: integer("el_limit").default(5),  // Emergency Leave Limit
  totalLeaves: integer("total_leaves").default(15),
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
  submittedBy: integer("submitted_by"),
  approvedBy: integer("approved_by"),
  receiptUrl: varchar("receipt_url", { length: 500 }),
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected
  inventoryItemId: integer("inventory_item_id"), // Link to inventory purchases - will add reference after inventory tables are defined
  deductFromBudget: boolean("deduct_from_budget").default(false), // Whether this expense should deduct from budget
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  organizationId: integer("organization_id").references(() => organizations.id),
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
  organizationId: integer("organization_id").references(() => organizations.id),
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
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feePayments = pgTable("fee_payments", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  paymentDate: date("payment_date").notNull(),
  paymentMode: varchar("payment_mode", { length: 20 }).notNull(), // UPI, Cash, Card, Cheque, Bank Transfer
  receiptNumber: varchar("receipt_number", { length: 100 }),
  installmentNumber: integer("installment_number"),
  transactionId: varchar("transaction_id", { length: 100 }),
  status: varchar("status", { length: 20 }).default("completed"), // completed, pending, failed
  paymentCategory: varchar("payment_category", { length: 50 }).default("fee_payment"), // 'fee_payment' or 'additional_charge'
  chargeType: varchar("charge_type", { length: 50 }), // Type of additional charge (annual_function, sports_day, etc.)
  organizationId: integer("organization_id").references(() => organizations.id),
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
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emiSchedule = pgTable("emi_schedule", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => leads.id).notNull(), // Changed to leads to match emiPlans
  emiPlanId: integer("emi_plan_id").references(() => emiPlans.id), // Link to parent plan
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
  studentId: integer("student_id").references(() => leads.id).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  numberOfInstallments: integer("number_of_installments").notNull(),
  installmentAmount: decimal("installment_amount", { precision: 10, scale: 2 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: varchar("status", { length: 20 }).default("active"), // active, completed, cancelled
  organizationId: integer("organization_id").references(() => organizations.id),
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

// Push Tokens for Mobile Notifications
export const pushTokens = pgTable("push_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // For staff/admins
  leadId: integer("lead_id").references(() => leads.id), // For parents (linked via leads)
  token: varchar("token", { length: 255 }).notNull().unique(),
  deviceType: varchar("device_type", { length: 20 }), // ios, android
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
  father_first_name: text("father_first_name"),
  father_last_name: text("father_last_name"),
  father_phone: text("father_phone"),
  mother_first_name: text("mother_first_name"),
  mother_last_name: text("mother_last_name"),
  mother_phone: text("mother_phone"),
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

// Message Templates for WhatsApp/SMS/Email
export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // Internal reference name (e.g., "welcome", "followup")
  displayName: varchar("display_name", { length: 100 }).notNull(), // User-facing name (e.g., "Welcome Message")
  content: text("content").notNull(), // Template message content
  category: varchar("category", { length: 50 }).default("whatsapp"), // whatsapp, sms, email
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false), // System default templates (cannot be deleted)
  variables: text("variables"), // JSON array of available variables like ["name", "class", "instituteName"]
  createdBy: integer("created_by").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});




export const aiAnalytics = pgTable("ai_analytics", {
  id: serial("id").primaryKey(),
  analysisType: varchar("analysis_type", { length: 100 }).notNull(), // curriculum, staff_optimization, pricing, etc.
  analysisData: text("analysis_data").notNull(), // JSON string
  insights: text("insights"), // JSON array of insights
  recommendations: text("recommendations"), // JSON array of recommendations
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  userId: integer("user_id"), // Can be null for anonymous users
  userType: varchar("user_type", { length: 50 }), // student, parent, staff, anonymous
  messageCount: integer("message_count").default(0),
  satisfaction: decimal("satisfaction", { precision: 5, scale: 2 }), // 0-100
  resolved: boolean("resolved").default(false),
  escalated: boolean("escalated").default(false),
  tags: text("tags"), // JSON array of conversation tags
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

export const aiMessages = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => aiConversations.id).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // user, assistant, system
  content: text("content").notNull(),
  intent: varchar("intent", { length: 100 }), // admission_inquiry, fee_query, technical_support, etc.
  sentiment: varchar("sentiment", { length: 20 }), // positive, negative, neutral, frustrated
  responseTime: integer("response_time"), // milliseconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiModelPerformance = pgTable("ai_model_performance", {
  id: serial("id").primaryKey(),
  modelType: varchar("model_type", { length: 100 }).notNull(),
  modelVersion: varchar("model_version", { length: 50 }).notNull(),
  accuracyScore: decimal("accuracy_score", { precision: 5, scale: 2 }).notNull(),
  predictionCount: integer("prediction_count").default(0),
  correctPredictions: integer("correct_predictions").default(0),
  lastEvaluated: timestamp("last_evaluated").defaultNow().notNull(),
  evaluationMetrics: text("evaluation_metrics"), // JSON object with detailed metrics
});

// AI Predictions Table
export const aiPredictions = pgTable("ai_predictions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  predictionType: varchar("prediction_type", { length: 100 }).notNull(), // success_probability, dropout_risk, etc.
  prediction: text("prediction").notNull(), // JSON object with prediction details
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 0-100
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Interventions Table  
export const aiInterventions = pgTable("ai_interventions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  predictionId: integer("prediction_id").references(() => aiPredictions.id),
  interventionType: varchar("intervention_type", { length: 100 }).notNull(), // academic_support, financial_aid, etc.
  priority: varchar("priority", { length: 20 }).notNull(), // immediate, high, medium, low
  description: text("description").notNull(),
  recommendedActions: text("recommended_actions"), // JSON array of actions
  status: varchar("status", { length: 20 }).default("pending"), // pending, in_progress, completed, cancelled
  assignedTo: integer("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Academic Performance Tracking for Enhanced AI
export const academicRecords = pgTable("academic_records", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  term: varchar("term", { length: 50 }).notNull(), // semester/quarter/year
  subject: varchar("subject", { length: 100 }).notNull(),
  marksObtained: decimal("marks_obtained", { precision: 5, scale: 2 }),
  totalMarks: decimal("total_marks", { precision: 5, scale: 2 }),
  grade: varchar("grade", { length: 5 }),
  attendance: decimal("attendance", { precision: 5, scale: 2 }), // percentage
  teacherRemarks: text("teacher_remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studentEngagement = pgTable("student_engagement", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  activityType: varchar("activity_type", { length: 100 }).notNull(), // assignment, quiz, project, extracurricular
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }), // 0-100
  timeSpent: integer("time_spent"), // minutes
  participationLevel: varchar("participation_level", { length: 20 }), // high, medium, low
  date: date("date").notNull(),
  metadata: text("metadata"), // JSON for additional engagement data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enhanced Course and Curriculum Tables
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  courseCode: varchar("course_code", { length: 50 }).unique().notNull(),
  courseName: varchar("course_name", { length: 200 }).notNull(),
  description: text("description"),
  credits: integer("credits"),
  duration: varchar("duration", { length: 50 }), // "6 months", "1 year", etc.
  level: varchar("level", { length: 50 }), // beginner, intermediate, advanced
  department: varchar("department", { length: 100 }),
  prerequisites: text("prerequisites"), // JSON array of prerequisite course codes
  learningOutcomes: text("learning_outcomes"), // JSON array
  industryRelevance: decimal("industry_relevance", { precision: 5, scale: 2 }), // 0-100
  marketDemand: decimal("market_demand", { precision: 5, scale: 2 }), // 0-100
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const coursePricing = pgTable("course_pricing", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  priceType: varchar("price_type", { length: 50 }).notNull(), // base, promotional, dynamic
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until"),
  demandLevel: varchar("demand_level", { length: 20 }), // low, medium, high
  capacityUtilization: decimal("capacity_utilization", { precision: 5, scale: 2 }),
  aiRecommended: boolean("ai_recommended").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true })
  .extend({
    name: z.string()
      .min(1, { message: "Name is required" })
      .refine((val) => val.trim().split(/\s+/).length >= 2, { message: "Please enter both First and Last name" }),
    fatherFirstName: z.string()
      .min(1, { message: "Father's name is required" }),
    fatherLastName: z.string()
      .min(1, { message: "Father's last name is required" }),
    fatherPhone: z.string()
      .regex(/^\d{10}$/, { message: "Father phone must be exactly 10 digits" }),
    motherFirstName: z.string().optional().or(z.literal("")),
    motherLastName: z.string().optional().or(z.literal("")),
    motherPhone: z.string()
      .regex(/^\d{10}$/, { message: "Mother phone must be exactly 10 digits" })
      .optional()
      .or(z.literal("")),
    address: z.string()
      .min(1, { message: "Address is required" }),
    email: z.string()
      .email({ message: "Please enter a valid email address" })
      .optional()
      .or(z.literal("")),
  });

// Extended schema for client-side validation (Add/Edit forms)
export const extendedLeadSchema = insertLeadSchema.superRefine((data, ctx) => {
  // Check if class is greater than 10
  const classString = data.class || "";
  const match = classString.match(/(\d+)/);

  if (match) {
    const classNum = parseInt(match[0], 10);
    // If class > 10, Stream is required
    if (classNum > 10) {
      if (!data.stream || data.stream.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stream is required for Class 11 and above",
          path: ["stream"],
        });
      }
    }
  }
});

export type ExtendedLead = z.infer<typeof extendedLeadSchema>;
export const insertFollowUpSchema = createInsertSchema(followUps)
  .omit({ id: true, createdAt: true })
  .extend({
    scheduledAt: z.coerce.date(),
    completedAt: z.coerce.date().nullable().optional(),
    leadId: z.coerce.number(),
    counselorId: z.coerce.number()
  });
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
export const insertPushTokenSchema = createInsertSchema(pushTokens).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRecentlyDeletedEmployeeSchema = createInsertSchema(recentlyDeletedEmployee).omit({ id: true, created_at: true, updated_at: true });
export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({ id: true, createdAt: true, updatedAt: true });



export const insertAIConversationSchema = createInsertSchema(aiConversations).omit({ id: true, startedAt: true });
export const insertAIMessageSchema = createInsertSchema(aiMessages).omit({ id: true, createdAt: true });
export const insertAIModelPerformanceSchema = createInsertSchema(aiModelPerformance).omit({ id: true, lastEvaluated: true });
export const insertAIPredictionSchema = createInsertSchema(aiPredictions).omit({ id: true, createdAt: true });
export const insertAIInterventionSchema = createInsertSchema(aiInterventions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAcademicRecordSchema = createInsertSchema(academicRecords).omit({ id: true, createdAt: true });
export const insertStudentEngagementSchema = createInsertSchema(studentEngagement).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCoursePricingSchema = createInsertSchema(coursePricing).omit({ id: true, createdAt: true });

// Create types
export type Organization = typeof organizations.$inferSelect;
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
export type PushToken = typeof pushTokens.$inferSelect;
export type RecentlyDeletedEmployee = typeof recentlyDeletedEmployee.$inferSelect;
export type MessageTemplate = typeof messageTemplates.$inferSelect;



export type AIConversation = typeof aiConversations.$inferSelect;
export type AIMessage = typeof aiMessages.$inferSelect;
export type AIModelPerformance = typeof aiModelPerformance.$inferSelect;
export type AIPrediction = typeof aiPredictions.$inferSelect;
export type AIIntervention = typeof aiInterventions.$inferSelect;
export type AcademicRecord = typeof academicRecords.$inferSelect;
export type StudentEngagement = typeof studentEngagement.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type CoursePricing = typeof coursePricing.$inferSelect;

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
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
export type InsertPushToken = z.infer<typeof insertPushTokenSchema>;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;


// AI-related insert types
export type InsertAIPrediction = z.infer<typeof insertAIPredictionSchema>;
export type InsertAIIntervention = z.infer<typeof insertAIInterventionSchema>;
// export type InsertAIAnalytics = z.infer<typeof insertAIAnalyticsSchema>;
export type InsertAIConversation = z.infer<typeof insertAIConversationSchema>;
export type InsertAIMessage = z.infer<typeof insertAIMessageSchema>;
export type InsertAIModelPerformance = z.infer<typeof insertAIModelPerformanceSchema>;
export type InsertAcademicRecord = z.infer<typeof insertAcademicRecordSchema>;
export type InsertStudentEngagement = z.infer<typeof insertStudentEngagementSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertCoursePricing = z.infer<typeof insertCoursePricingSchema>;

// Complex types for joins
export type LeadWithCounselor = Lead & {
  counselor?: Staff; // Changed from User to Staff
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

// Communication Logs
export const communicationLogs = pgTable("communication_logs", {
  id: serial("id").primaryKey(),
  recipientType: varchar("recipient_type", { length: 20 }).notNull(), // student, parent, staff, group
  recipientId: integer("recipient_id"),
  groupName: varchar("group_name", { length: 100 }),
  type: varchar("type", { length: 20 }).notNull(), // sms, email, whatsapp, call
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).default("sent"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

export const insertCommunicationLogSchema = createInsertSchema(communicationLogs).omit({ id: true, sentAt: true });
export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type InsertCommunicationLog = z.infer<typeof insertCommunicationLogSchema>;

// =====================================================
// DAYCARE MANAGEMENT SYSTEM - Standalone Module
// =====================================================

// 1. Daycare Children - Complete child information
export const daycareChildren = pgTable("daycare_children", {
  id: serial("id").primaryKey(),
  childId: varchar("child_id", { length: 50 }).unique().notNull(),
  childName: varchar("child_name", { length: 100 }).notNull(),
  dateOfBirth: date("date_of_birth"),
  ageYears: integer("age_years"),
  ageMonths: integer("age_months"),
  gender: varchar("gender", { length: 10 }),
  bloodGroup: varchar("blood_group", { length: 10 }),
  photoUrl: text("photo_url"),

  // Parent/Guardian Information
  parentName: varchar("parent_name", { length: 100 }).notNull(),
  parentPhone: varchar("parent_phone", { length: 20 }).notNull(),
  parentEmail: varchar("parent_email", { length: 255 }),
  alternatePhone: varchar("alternate_phone", { length: 20 }),

  // Address
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  pincode: varchar("pincode", { length: 10 }),

  // Emergency Contact
  emergencyContactName: varchar("emergency_contact_name", { length: 100 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
  emergencyContactRelation: varchar("emergency_contact_relation", { length: 50 }),

  // Medical Information
  allergies: text("allergies"),
  medicalConditions: text("medical_conditions"),
  specialNeeds: text("special_needs"),

  // Status
  status: varchar("status", { length: 20 }).default("active"), // active, inactive, graduated

  // Organization
  organizationId: integer("organization_id").references(() => organizations.id),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// 2. Daycare Inquiries - Lead management for daycare
export const daycareInquiries = pgTable("daycare_inquiries", {
  id: serial("id").primaryKey(),
  inquiryNumber: varchar("inquiry_number", { length: 50 }).unique().notNull(),
  childName: varchar("child_name", { length: 100 }).notNull(),
  childAgeYears: integer("child_age_years"),
  childAgeMonths: integer("child_age_months"),

  parentName: varchar("parent_name", { length: 100 }).notNull(),
  parentPhone: varchar("parent_phone", { length: 20 }).notNull(),
  parentEmail: varchar("parent_email", { length: 255 }),

  preferredStartDate: date("preferred_start_date"),
  preferredTimings: varchar("preferred_timings", { length: 50 }), // full-day, half-day, hourly
  source: varchar("source", { length: 100 }), // website, referral, walk-in, etc.

  status: varchar("status", { length: 20 }).default("new"), // new, contacted, visited, enrolled, dropped
  assignedTo: integer("assigned_to").references(() => users.id),
  priority: varchar("priority", { length: 20 }).default("medium"), // high, medium, low

  notes: text("notes"),
  followUpDate: date("follow_up_date"),
  lastContactedAt: timestamp("last_contacted_at"),

  organizationId: integer("organization_id").references(() => organizations.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Daycare Inquiry Follow-ups
export const daycareInquiryFollowups = pgTable("daycare_inquiry_followups", {
  id: serial("id").primaryKey(),
  inquiryId: integer("inquiry_id").references(() => daycareInquiries.id).notNull(),

  scheduledAt: timestamp("scheduled_at").notNull(),
  completedAt: timestamp("completed_at"),

  followupType: varchar("followup_type", { length: 30 }), // call, visit, email, whatsapp
  status: varchar("status", { length: 20 }).default("pending"), // pending, completed, cancelled

  notes: text("notes"),
  outcome: varchar("outcome", { length: 30 }), // interested, not_interested, enrolled, need_more_info
  nextAction: text("next_action"),

  assignedTo: integer("assigned_to").references(() => users.id),
  completedBy: integer("completed_by").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. Daycare Billing Configuration
export const daycareBillingConfig = pgTable("daycare_billing_config", {
  id: serial("id").primaryKey(),
  configName: varchar("config_name", { length: 100 }).notNull(),
  billingFormula: text("billing_formula").default("Amount Due = Hourly Rate × Total Hours"),

  // Hourly rates
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  minHourlyChargeMinutes: integer("min_hourly_charge_minutes").default(60),

  // Half-day rates
  halfDayRate: decimal("half_day_rate", { precision: 10, scale: 2 }),
  halfDayHours: integer("half_day_hours").default(4),

  // Full-day rates
  fullDayRate: decimal("full_day_rate", { precision: 10, scale: 2 }),
  fullDayHours: integer("full_day_hours").default(8),

  // Monthly plans
  monthlyUnlimitedRate: decimal("monthly_unlimited_rate", { precision: 10, scale: 2 }),

  // Late pickup
  gracePeriodMinutes: integer("grace_period_minutes").default(15),
  latePickupChargePerHour: decimal("late_pickup_charge_per_hour", { precision: 10, scale: 2 }),

  // Registration & Security
  registrationFee: decimal("registration_fee", { precision: 10, scale: 2 }),
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }),

  isActive: boolean("is_active").default(true),
  effectiveFrom: date("effective_from"),
  effectiveUntil: date("effective_until"),

  organizationId: integer("organization_id").references(() => organizations.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 5. Daycare Enrollments
export const daycareEnrollments = pgTable("daycare_enrollments", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => daycareChildren.id).notNull(),
  enrollmentNumber: varchar("enrollment_number", { length: 50 }).unique().notNull(),
  enrollmentDate: date("enrollment_date").notNull(),

  billingPlanId: integer("billing_plan_id").references(() => daycareBillingConfig.id),
  customHourlyRate: decimal("custom_hourly_rate", { precision: 10, scale: 2 }),
  customHalfDayRate: decimal("custom_half_day_rate", { precision: 10, scale: 2 }),
  customFullDayRate: decimal("custom_full_day_rate", { precision: 10, scale: 2 }),
  customMonthlyRate: decimal("custom_monthly_rate", { precision: 10, scale: 2 }),

  status: varchar("status", { length: 20 }).default("active"), // active, paused, cancelled, completed
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),

  organizationId: integer("organization_id").references(() => organizations.id),

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// 6. Daycare Attendance
export const daycareAttendance = pgTable("daycare_attendance", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => daycareEnrollments.id).notNull(),
  attendanceDate: date("attendance_date").notNull(),

  checkInTime: timestamp("check_in_time", { withTimezone: true }).notNull(),
  checkOutTime: timestamp("check_out_time", { withTimezone: true }),

  durationMinutes: integer("duration_minutes"),
  billingType: varchar("billing_type", { length: 20 }), // hourly, half-day, full-day, monthly
  calculatedCharge: decimal("calculated_charge", { precision: 10, scale: 2 }),

  checkedInBy: integer("checked_in_by").references(() => users.id),
  checkedOutBy: integer("checked_out_by").references(() => users.id),

  notes: text("notes"),
  isManualEdit: boolean("is_manual_edit").default(false),
  editedBy: integer("edited_by").references(() => users.id),
  editReason: text("edit_reason"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 7. Daycare Payments
export const daycarePayments = pgTable("daycare_payments", {
  id: serial("id").primaryKey(),
  paymentNumber: varchar("payment_number", { length: 50 }).unique().notNull(),
  childId: integer("child_id").references(() => daycareChildren.id).notNull(),
  enrollmentId: integer("enrollment_id").references(() => daycareEnrollments.id),

  paymentType: varchar("payment_type", { length: 30 }), // attendance, monthly_plan, registration, late_fee
  billingPeriodStart: date("billing_period_start"),
  billingPeriodEnd: date("billing_period_end"),

  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  lateFee: decimal("late_fee", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),

  paymentDate: date("payment_date").notNull(),
  paymentMode: varchar("payment_mode", { length: 30 }), // UPI, Cash, Card, Cheque, Bank Transfer
  transactionId: varchar("transaction_id", { length: 100 }),
  chequeNumber: varchar("cheque_number", { length: 50 }),

  status: varchar("status", { length: 20 }).default("pending"), // pending, completed, failed, refunded
  receiptNumber: varchar("receipt_number", { length: 50 }).unique(),

  collectedBy: integer("collected_by").references(() => users.id),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertDaycareChildSchema = createInsertSchema(daycareChildren).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDaycareInquirySchema = createInsertSchema(daycareInquiries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDaycareInquiryFollowupSchema = createInsertSchema(daycareInquiryFollowups).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDaycareBillingConfigSchema = createInsertSchema(daycareBillingConfig).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDaycareEnrollmentSchema = createInsertSchema(daycareEnrollments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDaycareAttendanceSchema = createInsertSchema(daycareAttendance).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDaycarePaymentSchema = createInsertSchema(daycarePayments).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type DaycareChild = typeof daycareChildren.$inferSelect;
export type DaycareInquiry = typeof daycareInquiries.$inferSelect;
export type DaycareInquiryFollowup = typeof daycareInquiryFollowups.$inferSelect;
export type DaycareBillingConfig = typeof daycareBillingConfig.$inferSelect;
export type DaycareEnrollment = typeof daycareEnrollments.$inferSelect;
export type DaycareAttendance = typeof daycareAttendance.$inferSelect;
export type DaycarePayment = typeof daycarePayments.$inferSelect;

export type InsertDaycareChild = z.infer<typeof insertDaycareChildSchema>;
export type InsertDaycareInquiry = z.infer<typeof insertDaycareInquirySchema>;
export type InsertDaycareInquiryFollowup = z.infer<typeof insertDaycareInquiryFollowupSchema>;
export type InsertDaycareBillingConfig = z.infer<typeof insertDaycareBillingConfigSchema>;
export type InsertDaycareEnrollment = z.infer<typeof insertDaycareEnrollmentSchema>;
export type InsertDaycareAttendance = z.infer<typeof insertDaycareAttendanceSchema>;
export type InsertDaycarePayment = z.infer<typeof insertDaycarePaymentSchema>;

// Complex types for joins
export type DaycareChildWithEnrollment = DaycareChild & {
  enrollment?: DaycareEnrollment;
  payments?: DaycarePayment[];
};

export type DaycareEnrollmentWithChild = DaycareEnrollment & {
  child: DaycareChild;
  billingPlan?: DaycareBillingConfig;
  attendance?: DaycareAttendance[];
};

export type DaycareInquiryWithFollowups = DaycareInquiry & {
  followups?: DaycareInquiryFollowup[];
  assignedUser?: User;
};

// =====================================================
// INVENTORY/STOCK MANAGEMENT SYSTEM
// =====================================================

// 1. Inventory Categories - Organize items by categories
export const inventoryCategories = pgTable("inventory_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }), // For UI color coding (e.g., "#8b5cf6")
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Inventory Suppliers - Vendor/Supplier information
export const inventorySuppliers = pgTable("inventory_suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  contactPerson: varchar("contact_person", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  notes: text("notes"),
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Inventory Items - Main inventory items table
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  itemCode: varchar("item_code", { length: 50 }), // SKU/Barcode
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => inventoryCategories.id),

  // Stock information
  currentStock: integer("current_stock").default(0).notNull(),
  minimumStock: integer("minimum_stock").default(0), // For low stock alerts
  unit: varchar("unit", { length: 50 }), // kg, pieces, liters, boxes, etc.

  // Pricing
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }), // Purchase/cost price
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }), // Optional selling price

  // Supplier
  supplierId: integer("supplier_id").references(() => inventorySuppliers.id),

  // Additional fields
  location: varchar("location", { length: 100 }), // Storage location/shelf
  imageUrl: text("image_url"),
  notes: text("notes"),

  // Status
  isActive: boolean("is_active").default(true),

  // Multi-tenant
  organizationId: integer("organization_id").references(() => organizations.id),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. Inventory Transactions - Track all stock movements (audit trail)
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => inventoryItems.id).notNull(),
  transactionType: varchar("transaction_type", { length: 20 }).notNull(), // 'in' or 'out'
  quantity: integer("quantity").notNull(),

  // Before and after stock levels for audit trail
  stockBefore: integer("stock_before").notNull(),
  stockAfter: integer("stock_after").notNull(),

  // Transaction details
  reason: varchar("reason", { length: 100 }), // purchase, sale, damage, adjustment, return, etc.
  reference: varchar("reference", { length: 100 }), // Bill no, order no, etc.
  notes: text("notes"),

  // Pricing for this transaction
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),

  // Expense integration - link to expense record
  expenseId: integer("expense_id").references(() => expenses.id),
  leadId: integer("lead_id").references(() => leads.id), // Link to lead for sales (e.g., selling books to parents)

  // User tracking
  userId: integer("user_id").references(() => users.id),

  // Timestamp
  transactionDate: timestamp("transaction_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Low Stock Alerts - Track when items fall below minimum stock
export const lowStockAlerts = pgTable("low_stock_alerts", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => inventoryItems.id).notNull(),
  alertDate: timestamp("alert_date").defaultNow().notNull(),
  currentStock: integer("current_stock").notNull(),
  minimumStock: integer("minimum_stock").notNull(),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Sell Orders - Track sales to enrolled parents/students with GST
export const sellOrders = pgTable("sell_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).unique().notNull(),
  leadId: integer("lead_id").references(() => leads.id).notNull(), // Enrolled parent/student
  parentName: varchar("parent_name", { length: 200 }).notNull(), // Snapshot of parent name

  // Amounts
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(), // Total before GST
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).default("18.00").notNull(), // GST percentage
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }).notNull(), // Calculated GST
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(), // Grand total (subtotal + GST)

  // Payment information
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"), // pending, paid, partial
  paymentMode: varchar("payment_mode", { length: 30 }), // UPI, Cash, Card, Cheque, Bank Transfer
  paymentDate: date("payment_date"),
  transactionId: varchar("transaction_id", { length: 100 }),

  // Additional info
  notes: text("notes"),
  billGeneratedBy: integer("bill_generated_by").references(() => users.id),

  // Multi-tenant
  organizationId: integer("organization_id").references(() => organizations.id),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 7. Sell Order Items - Line items for each sell order
export const sellOrderItems = pgTable("sell_order_items", {
  id: serial("id").primaryKey(),
  sellOrderId: integer("sell_order_id").references(() => sellOrders.id).notNull(),
  inventoryItemId: integer("inventory_item_id").references(() => inventoryItems.id).notNull(),

  // Item details (snapshot at time of sale)
  itemName: varchar("item_name", { length: 200 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(), // Price per unit

  // Calculated amounts
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(), // quantity * unitPrice
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }).notNull(), // GST for this item
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(), // subtotal + gstAmount

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schemas for Sell Orders
export const insertSellOrderSchema = createInsertSchema(sellOrders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSellOrderItemSchema = createInsertSchema(sellOrderItems).omit({ id: true, createdAt: true });

// Types for Sell Orders
export type SellOrder = typeof sellOrders.$inferSelect;
export type SellOrderItem = typeof sellOrderItems.$inferSelect;

export type InsertSellOrder = z.infer<typeof insertSellOrderSchema>;
export type InsertSellOrderItem = z.infer<typeof insertSellOrderItemSchema>;

// Complex type for sell order with items
export type SellOrderWithItems = SellOrder & {
  items: SellOrderItem[];
  lead?: Lead;
};

// Insert Schemas for Inventory
export const insertInventoryCategorySchema = createInsertSchema(inventoryCategories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInventorySupplierSchema = createInsertSchema(inventorySuppliers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions).omit({ id: true, createdAt: true });
export const insertLowStockAlertSchema = createInsertSchema(lowStockAlerts).omit({ id: true, createdAt: true });

// Types for Inventory
export type InventoryCategory = typeof inventoryCategories.$inferSelect;
export type InventorySupplier = typeof inventorySuppliers.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type LowStockAlert = typeof lowStockAlerts.$inferSelect;

export type InsertInventoryCategory = z.infer<typeof insertInventoryCategorySchema>;
export type InsertInventorySupplier = z.infer<typeof insertInventorySupplierSchema>;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;
export type InsertLowStockAlert = z.infer<typeof insertLowStockAlertSchema>;

// Complex types for joins
export type InventoryItemWithDetails = InventoryItem & {
  category?: InventoryCategory;
  supplier?: InventorySupplier;
  transactions?: InventoryTransaction[];
  totalExpenses?: number;
};

export type InventoryTransactionWithItem = InventoryTransaction & {
  item: InventoryItem;
  user?: User;
};


// =====================================================
// META MARKETING INTEGRATION
// =====================================================

// Meta Connections - Store OAuth connection per organization
export const metaConnections = pgTable("meta_connections", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  accessToken: text("access_token").notNull(),
  tokenExpiresAt: timestamp("token_expires_at").notNull(),
  refreshToken: text("refresh_token"),
  adAccountId: varchar("ad_account_id", { length: 100 }).notNull(),
  pageId: varchar("page_id", { length: 100 }),
  pageName: varchar("page_name", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Meta Campaigns
export const metaCampaigns = pgTable("meta_campaigns", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  metaCampaignId: varchar("meta_campaign_id", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  objective: varchar("objective", { length: 100 }).notNull(), // LEADS, TRAFFIC, AWARENESS, etc.
  status: varchar("status", { length: 50 }).default("ACTIVE"),
  dailyBudget: decimal("daily_budget", { precision: 10, scale: 2 }),
  lifetimeBudget: decimal("lifetime_budget", { precision: 10, scale: 2 }),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Meta Ad Sets
export const metaAdSets = pgTable("meta_ad_sets", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  campaignId: integer("campaign_id").references(() => metaCampaigns.id).notNull(),
  metaAdSetId: varchar("meta_ad_set_id", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  targeting: jsonb("targeting"), // JSON for audience targeting config
  bidAmount: decimal("bid_amount", { precision: 10, scale: 2 }),
  optimizationGoal: varchar("optimization_goal", { length: 100 }),
  billingEvent: varchar("billing_event", { length: 100 }),
  status: varchar("status", { length: 50 }).default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Meta Ads
export const metaAds = pgTable("meta_ads", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  adSetId: integer("ad_set_id").references(() => metaAdSets.id).notNull(),
  metaAdId: varchar("meta_ad_id", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  creative: jsonb("creative").notNull(), // JSON for ad creative (image, text, CTA, etc.)
  status: varchar("status", { length: 50 }).default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Meta Lead Forms
export const metaLeadForms = pgTable("meta_lead_forms", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  metaFormId: varchar("meta_form_id", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  questions: jsonb("questions").notNull(), // JSON array of form questions
  privacyPolicyUrl: text("privacy_policy_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Meta Synced Leads - Maps Meta leads to CRM leads
export const metaSyncedLeads = pgTable("meta_synced_leads", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  metaLeadId: varchar("meta_lead_id", { length: 100 }).notNull(),
  crmLeadId: integer("crm_lead_id").references(() => leads.id).notNull(),
  formId: integer("form_id").references(() => metaLeadForms.id),
  campaignId: integer("campaign_id").references(() => metaCampaigns.id),
  adId: integer("ad_id").references(() => metaAds.id),
  rawData: jsonb("raw_data").notNull(), // Full lead data from Meta
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
});

// Insert schemas
export const insertMetaConnectionSchema = createInsertSchema(metaConnections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMetaCampaignSchema = createInsertSchema(metaCampaigns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMetaAdSetSchema = createInsertSchema(metaAdSets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMetaAdSchema = createInsertSchema(metaAds).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMetaLeadFormSchema = createInsertSchema(metaLeadForms).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMetaSyncedLeadSchema = createInsertSchema(metaSyncedLeads).omit({ id: true, syncedAt: true });

// Types
export type MetaConnection = typeof metaConnections.$inferSelect;
export type MetaCampaign = typeof metaCampaigns.$inferSelect;
export type MetaAdSet = typeof metaAdSets.$inferSelect;
export type MetaAd = typeof metaAds.$inferSelect;
export type MetaLeadForm = typeof metaLeadForms.$inferSelect;
export type MetaSyncedLead = typeof metaSyncedLeads.$inferSelect;

export type InsertMetaConnection = z.infer<typeof insertMetaConnectionSchema>;
export type InsertMetaCampaign = z.infer<typeof insertMetaCampaignSchema>;
export type InsertMetaAdSet = z.infer<typeof insertMetaAdSetSchema>;
export type InsertMetaAd = z.infer<typeof insertMetaAdSchema>;
export type InsertMetaLeadForm = z.infer<typeof insertMetaLeadFormSchema>;
export type InsertMetaSyncedLead = z.infer<typeof insertMetaSyncedLeadSchema>;

// =====================================================
// BUS MANAGEMENT SYSTEM
// =====================================================

export const busRoutes = pgTable("bus_routes", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  routeName: varchar("route_name", { length: 100 }).notNull(),
  vehicleNumber: varchar("bus_number", { length: 50 }).notNull(),
  driverId: integer("driver_id").references(() => staff.id),
  helperName: varchar("helper_name", { length: 100 }),
  helperPhone: varchar("helper_phone", { length: 20 }),
  capacity: integer("capacity"),
  startTime: varchar("start_time", { length: 10 }),
  endTime: varchar("end_time", { length: 10 }),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const busStops = pgTable("bus_stops", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").notNull().references(() => busRoutes.id),
  stopName: varchar("stop_name", { length: 100 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  arrivalTime: varchar("arrival_time", { length: 10 }),
  pickupPrice: decimal("pickup_price", { precision: 10, scale: 2 }).default("0"),
  stopOrder: integer("stop_order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studentBusAssignments = pgTable("student_bus_assignments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => leads.id),
  routeId: integer("route_id").notNull().references(() => busRoutes.id),
  pickupStopId: integer("pickup_stop_id").references(() => busStops.id),
  dropStopId: integer("drop_stop_id").references(() => busStops.id),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

// Bus Live Locations - for real-time tracking
export const busLiveLocations = pgTable("bus_live_locations", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").notNull().references(() => busRoutes.id),
  driverId: integer("driver_id").references(() => staff.id),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  speed: decimal("speed", { precision: 5, scale: 2 }),
  heading: decimal("heading", { precision: 5, scale: 2 }),
  accuracy: decimal("accuracy", { precision: 8, scale: 2 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// Bus Location History - historical tracking data  
export const busLocationHistory = pgTable("bus_location_history", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").notNull().references(() => busRoutes.id),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  speed: decimal("speed", { precision: 5, scale: 2 }),
  heading: decimal("heading", { precision: 5, scale: 2 }),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertBusRouteSchema = createInsertSchema(busRoutes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBusStopSchema = createInsertSchema(busStops).omit({ id: true, createdAt: true });
export const insertStudentBusAssignmentSchema = createInsertSchema(studentBusAssignments)
  .omit({ id: true, assignedAt: true })
  .extend({
    pickupStopId: z.number().nullable().optional(),
    dropStopId: z.number().nullable().optional()
  });
export const insertBusLiveLocationSchema = createInsertSchema(busLiveLocations).omit({ id: true, timestamp: true });
export const insertBusLocationHistorySchema = createInsertSchema(busLocationHistory).omit({ id: true, recordedAt: true });

// Types
export type BusRoute = typeof busRoutes.$inferSelect;
export type BusStop = typeof busStops.$inferSelect;
export type StudentBusAssignment = typeof studentBusAssignments.$inferSelect;
export type BusLiveLocation = typeof busLiveLocations.$inferSelect;
export type BusLocationHistory = typeof busLocationHistory.$inferSelect;

export type InsertBusRoute = z.infer<typeof insertBusRouteSchema>;
export type InsertBusStop = z.infer<typeof insertBusStopSchema>;
export type InsertStudentBusAssignment = z.infer<typeof insertStudentBusAssignmentSchema>;
export type InsertBusLiveLocation = z.infer<typeof insertBusLiveLocationSchema>;
export type InsertBusLocationHistory = z.infer<typeof insertBusLocationHistorySchema>;


// =====================================================
// MOBILE APP TABLES - for Parent/Teacher/Driver Apps
// =====================================================

// Daily Updates - Teacher posts about activities
export const dailyUpdates = pgTable("daily_updates", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  leadId: integer("lead_id").references(() => leads.id),
  title: varchar("title", { length: 200 }),
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array(),
  activityType: varchar("activity_type", { length: 50 }),
  mood: varchar("mood", { length: 20 }),
  teacherName: varchar("teacher_name", { length: 100 }),
  className: varchar("class_name", { length: 50 }),
  section: varchar("section", { length: 10 }),
  isPinned: boolean("is_pinned").default(false),
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'approved', 'rejected'
  rejectionReason: text("rejection_reason"),
  postedAt: timestamp("posted_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Student Attendance
export const studentAttendance = pgTable("student_attendance", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  date: date("date").notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  checkInTime: varchar("check_in_time", { length: 10 }),
  checkOutTime: varchar("check_out_time", { length: 10 }),
  markedBy: varchar("marked_by", { length: 100 }),
  markedAt: timestamp("marked_at").defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Homework
export const preschoolHomework = pgTable("preschool_homework", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  className: varchar("class_name", { length: 50 }).notNull(),
  section: varchar("section", { length: 10 }),
  teacherName: varchar("teacher_name", { length: 100 }),
  subject: varchar("subject", { length: 100 }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  mediaUrls: text("media_urls").array(),
  dueDate: date("due_date"),
  postedAt: timestamp("posted_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const homeworkSubmissions = pgTable("homework_submissions", {
  id: serial("id").primaryKey(),
  homeworkId: integer("homework_id").notNull().references(() => preschoolHomework.id),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  submissionText: text("submission_text"),
  mediaUrls: text("media_urls").array(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  feedback: text("feedback"),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const preschoolAnnouncements = pgTable("preschool_announcements", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  mediaUrl: text("media_url"),
  priority: varchar("priority", { length: 20 }).default("normal"),
  targetRoles: varchar("target_roles", { length: 20 }).array(),
  targetClasses: varchar("target_classes", { length: 50 }).array(),
  createdBy: varchar("created_by", { length: 100 }),
  publishedAt: timestamp("published_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const preschoolEvents = pgTable("preschool_events", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  eventDate: date("event_date").notNull(),
  eventTime: varchar("event_time", { length: 10 }),
  endTime: varchar("end_time", { length: 10 }),
  location: varchar("location", { length: 200 }),
  eventType: varchar("event_type", { length: 50 }),
  forClasses: varchar("for_classes", { length: 50 }).array(),
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const parentTeacherMessages = pgTable("parent_teacher_messages", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  leadId: integer("lead_id").references(() => leads.id),
  fromName: varchar("from_name", { length: 100 }).notNull(),
  fromEmail: varchar("from_email", { length: 255 }).notNull(),
  toName: varchar("to_name", { length: 100 }).notNull(),
  toEmail: varchar("to_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  mediaUrls: text("media_urls").array(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  parentMessageId: integer("parent_message_id").references((): any => parentTeacherMessages.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leadPreschoolProfiles = pgTable("lead_preschool_profiles", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().unique().references(() => leads.id),
  photoUrl: text("photo_url"),
  bloodGroup: varchar("blood_group", { length: 10 }),
  medicalConditions: text("medical_conditions"),
  allergies: text("allergies"),
  emergencyContactName: varchar("emergency_contact_name", { length: 100 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
  emergencyContactRelation: varchar("emergency_contact_relation", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertDailyUpdateSchema = createInsertSchema(dailyUpdates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStudentAttendanceSchema = createInsertSchema(studentAttendance).omit({ id: true, createdAt: true });
export const insertPreschoolHomeworkSchema = createInsertSchema(preschoolHomework).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHomeworkSubmissionSchema = createInsertSchema(homeworkSubmissions).omit({ id: true, createdAt: true });
export const insertPreschoolAnnouncementSchema = createInsertSchema(preschoolAnnouncements).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPreschoolEventSchema = createInsertSchema(preschoolEvents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertParentTeacherMessageSchema = createInsertSchema(parentTeacherMessages).omit({ id: true, createdAt: true });
export const insertLeadPreschoolProfileSchema = createInsertSchema(leadPreschoolProfiles).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type DailyUpdate = typeof dailyUpdates.$inferSelect;
export type StudentAttendance = typeof studentAttendance.$inferSelect;
export type PreschoolHomework = typeof preschoolHomework.$inferSelect;
export type HomeworkSubmission = typeof homeworkSubmissions.$inferSelect;
export type PreschoolAnnouncement = typeof preschoolAnnouncements.$inferSelect;
export type PreschoolEvent = typeof preschoolEvents.$inferSelect;
export type ParentTeacherMessage = typeof parentTeacherMessages.$inferSelect;
export type LeadPreschoolProfile = typeof leadPreschoolProfiles.$inferSelect;

export type InsertDailyUpdate = z.infer<typeof insertDailyUpdateSchema>;
export type InsertStudentAttendance = z.infer<typeof insertStudentAttendanceSchema>;
export type InsertPreschoolHomework = z.infer<typeof insertPreschoolHomeworkSchema>;
export type InsertHomeworkSubmission = z.infer<typeof insertHomeworkSubmissionSchema>;
export type InsertPreschoolAnnouncement = z.infer<typeof insertPreschoolAnnouncementSchema>;
export type InsertPreschoolEvent = z.infer<typeof insertPreschoolEventSchema>;
export type InsertParentTeacherMessage = z.infer<typeof insertParentTeacherMessageSchema>;
export type InsertLeadPreschoolProfile = z.infer<typeof insertLeadPreschoolProfileSchema>;

// =====================================================
// BANK STATEMENT-DRIVEN ACCOUNTING MODULE
// =====================================================

// 1. Chart of Accounts (Account Master)
export const accountMaster = pgTable("account_master", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 50 }), // Optional generic code
  type: varchar("type", { length: 50 }).notNull(), // Asset, Liability, Equity, Income, Expense
  parentId: integer("parent_id").references((): any => accountMaster.id),
  isSystem: boolean("is_system").default(false), // System accounts cannot be deleted
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Bank Statements (File Tracking)
export const bankStatements = pgTable("bank_statements", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(), // Storage path
  status: varchar("status", { length: 50 }).default("pending"), // pending, parsing, processing, completed, failed
  uploadedBy: integer("uploaded_by").references(() => users.id),
  totalTransactions: integer("total_transactions").default(0),
  processedTransactions: integer("processed_transactions").default(0),
  errorLog: text("error_log"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Bank Transactions (Parsed Raw Data)
export const bankTransactions = pgTable("bank_transactions", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  statementId: integer("statement_id").notNull().references(() => bankStatements.id),
  date: date("date").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(), // Signed amount for bank lines
  type: varchar("type", { length: 20 }).notNull(), // credit, debit
  reference: varchar("reference", { length: 200 }),
  balance: decimal("balance", { precision: 12, scale: 2 }), // Running balance

  // Classification status
  status: varchar("status", { length: 20 }).default("pending"), // pending, classified, posted
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }),
  suggestedAccountId: integer("suggested_account_id").references(() => accountMaster.id),
  classificationReason: text("classification_reason"),

  // Audit
  rowHash: varchar("row_hash", { length: 64 }).notNull(), // Prevent duplicates
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Ledger Entries (Double Entry System)
export const ledgerEntries = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  transactionId: integer("transaction_id").references(() => bankTransactions.id), // Link to source
  accountId: integer("account_id").notNull().references(() => accountMaster.id),
  debit: decimal("debit", { precision: 12, scale: 2 }).default("0"),
  credit: decimal("credit", { precision: 12, scale: 2 }).default("0"),
  description: text("description"),
  entryDate: date("entry_date").notNull(),
  postedAt: timestamp("posted_at").defaultNow().notNull(),
});

// 5. Classification Rules
export const classificationRules = pgTable("classification_rules", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  name: varchar("name", { length: 100 }).notNull(),
  priority: integer("priority").default(0), // Higher runs first
  ruleType: varchar("rule_type", { length: 50 }).default("keyword"), // keyword, regex, amount_range
  pattern: text("pattern").notNull(), // "STARBUCKS", "^TXN.*", etc.
  targetAccountId: integer("target_account_id").notNull().references(() => accountMaster.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Classification Feedback (AI Learning)
export const classificationFeedback = pgTable("classification_feedback", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  transactionDescription: text("transaction_description").notNull(),
  correctAccountId: integer("correct_account_id").notNull().references(() => accountMaster.id),
  userCorrection: boolean("user_correction").default(true), // Was this a manual correction?
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 7. Accounting Audit Logs
export const accountingAuditLogs = pgTable("accounting_audit_logs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // transaction, rule, ledger
  entityId: integer("entity_id").notNull(),
  action: varchar("action", { length: 50 }).notNull(), // create, update, approve
  changes: jsonb("changes"), // Old vs New values
  performedBy: integer("performed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertAccountMasterSchema = createInsertSchema(accountMaster).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBankStatementSchema = createInsertSchema(bankStatements).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBankTransactionSchema = createInsertSchema(bankTransactions).omit({ id: true, createdAt: true });
export const insertLedgerEntrySchema = createInsertSchema(ledgerEntries).omit({ id: true, postedAt: true });
export const insertClassificationRuleSchema = createInsertSchema(classificationRules).omit({ id: true, createdAt: true });
export const insertClassificationFeedbackSchema = createInsertSchema(classificationFeedback).omit({ id: true, createdAt: true });
export const insertAccountingAuditLogSchema = createInsertSchema(accountingAuditLogs).omit({ id: true, createdAt: true });

// Types
export type AccountMaster = typeof accountMaster.$inferSelect;
export type BankStatement = typeof bankStatements.$inferSelect;
export type BankTransaction = typeof bankTransactions.$inferSelect;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type ClassificationRule = typeof classificationRules.$inferSelect;
export type ClassificationFeedback = typeof classificationFeedback.$inferSelect;
export type AccountingAuditLog = typeof accountingAuditLogs.$inferSelect;


// Teacher Leaves & Tasks
export const teacherLeaves = pgTable("teacher_leaves", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").references(() => staff.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason").notNull(),
  leaveType: varchar("leave_type", { length: 20 }).default("CL").notNull(), // CL, EL, Other
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teacherTasks = pgTable("teacher_tasks", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").references(() => staff.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  isCompleted: boolean("is_completed").default(false),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTeacherLeaveSchema = createInsertSchema(teacherLeaves).omit({ id: true, appliedAt: true, updatedAt: true });
export const insertTeacherTaskSchema = createInsertSchema(teacherTasks).omit({ id: true, createdAt: true });

export type TeacherLeave = typeof teacherLeaves.$inferSelect;
export type TeacherTask = typeof teacherTasks.$inferSelect;
export type InsertTeacherLeave = z.infer<typeof insertTeacherLeaveSchema>;
export type InsertTeacherTask = z.infer<typeof insertTeacherTaskSchema>;

export type InsertAccountMaster = z.infer<typeof insertAccountMasterSchema>;
export type InsertBankStatement = z.infer<typeof insertBankStatementSchema>;
export type InsertBankTransaction = z.infer<typeof insertBankTransactionSchema>;
export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;
export type InsertClassificationRule = z.infer<typeof insertClassificationRuleSchema>;
export type InsertClassificationFeedback = z.infer<typeof insertClassificationFeedbackSchema>;
export type InsertAccountingAuditLog = z.infer<typeof insertAccountingAuditLogSchema>;

// Teacher-Student Assignments
export const teacherStudentAssignments = pgTable("teacher_student_assignments", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  teacherStaffId: integer("teacher_staff_id").notNull().references(() => staff.id),
  studentLeadId: integer("student_lead_id").notNull().references(() => leads.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: varchar("assigned_by", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTeacherStudentAssignmentSchema = createInsertSchema(teacherStudentAssignments).omit({ id: true, assignedAt: true, createdAt: true, updatedAt: true });
export type TeacherStudentAssignment = typeof teacherStudentAssignments.$inferSelect;
export type InsertTeacherStudentAssignment = z.infer<typeof insertTeacherStudentAssignmentSchema>;

