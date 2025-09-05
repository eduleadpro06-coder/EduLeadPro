import { NotificationService } from "./notificationService";

export class NotificationManager {
  static async createLeadNotification(leadData: { name: string; class: string; source: string }) {
    return await NotificationService.createNotification({
      userId: 1, // Default to admin
      type: "lead",
      title: "New Lead Received",
      message: `${leadData.name} from Class ${leadData.class} has been added via ${leadData.source}`,
      priority: "medium",
      read: false,
      actionType: "view_lead",
      actionId: `lead-${Date.now()}`,
      metadata: JSON.stringify({ leadData })
    });
  }

  static async createFollowUpNotification(followUpData: { leadName: string; scheduledAt: string; counselorName: string }) {
    return await NotificationService.createNotification({
      userId: 1, // Default to admin
      type: "followup",
      title: "Follow-up Scheduled",
      message: `Follow-up scheduled for ${followUpData.leadName} on ${new Date(followUpData.scheduledAt).toLocaleDateString()} by ${followUpData.counselorName}`,
      priority: "medium",
      read: false,
      actionType: "view_followup",
      actionId: `followup-${Date.now()}`,
      metadata: JSON.stringify({ followUpData })
    });
  }

  static async createPaymentNotification(paymentData: { amount: number; studentName: string; paymentMode: string }) {
    return await NotificationService.createNotification({
      userId: 1, // Default to admin
      type: "payment",
      title: "Payment Received",
      message: `Payment of ₹${paymentData.amount.toLocaleString()} received from ${paymentData.studentName} via ${paymentData.paymentMode}`,
      priority: "medium",
      read: false,
      actionType: "view_payment",
      actionId: `payment-${Date.now()}`,
      metadata: JSON.stringify({ paymentData })
    });
  }

  static async createStaffNotification(staffData: { name: string; action: string; details?: string }) {
    return await NotificationService.createNotification({
      userId: 1, // Default to admin
      type: "staff",
      title: `Staff ${staffData.action}`,
      message: `${staffData.name} has been ${staffData.action}${staffData.details ? ` - ${staffData.details}` : ''}`,
      priority: "medium",
      read: false,
      actionType: "view_staff",
      actionId: `staff-${Date.now()}`,
      metadata: JSON.stringify({ staffData })
    });
  }

  static async createAttendanceAlert(attendanceData: { className: string; percentage: number; date: string }) {
    return await NotificationService.createNotification({
      userId: 1, // Default to admin
      type: "attendance",
      title: "Low Attendance Alert",
      message: `Class ${attendanceData.className} attendance is ${attendanceData.percentage}% on ${attendanceData.date}`,
      priority: attendanceData.percentage < 70 ? "high" : "medium",
      read: false,
      actionType: "view_attendance",
      actionId: `attendance-${Date.now()}`,
      metadata: JSON.stringify({ attendanceData })
    });
  }

  static async createExpenseNotification(expenseData: { amount: number; category: string; description: string }) {
    return await NotificationService.createNotification({
      userId: 1, // Default to admin
      type: "expense",
      title: "New Expense Added",
      message: `Expense of ₹${expenseData.amount.toLocaleString()} added for ${expenseData.category}: ${expenseData.description}`,
      priority: "medium",
      read: false,
      actionType: "view_expense",
      actionId: `expense-${Date.now()}`,
      metadata: JSON.stringify({ expenseData })
    });
  }

  static async createStudentNotification(studentData: { name: string; action: string; class: string }) {
    return await NotificationService.createNotification({
      userId: 1, // Default to admin
      type: "student",
      title: `Student ${studentData.action}`,
      message: `${studentData.name} from Class ${studentData.class} has been ${studentData.action}`,
      priority: "medium",
      read: false,
      actionType: "view_student",
      actionId: `student-${Date.now()}`,
      metadata: JSON.stringify({ studentData })
    });
  }

  static async createSystemNotification(title: string, message: string, priority: 'high' | 'medium' | 'low' = 'medium', type: string = 'system') {
    return await NotificationService.createNotification({
      userId: 1, // Default to admin
      type,
      title,
      message,
      priority,
      read: false,
      actionType: "view_system",
      actionId: `system-${Date.now()}`,
      metadata: JSON.stringify({ systemGenerated: true })
    });
  }

  static async createOverdueFollowUpNotification(overdueData: { leadName: string; daysOverdue: number; counselorName: string }) {
    return await NotificationService.createNotification({
      userId: 1, // Default to admin
      type: "followup",
      title: "Follow-up Overdue",
      message: `Follow-up for ${overdueData.leadName} is ${overdueData.daysOverdue} days overdue. Assigned to ${overdueData.counselorName}`,
      priority: "high",
      read: false,
      actionType: "view_followup",
      actionId: `overdue-${Date.now()}`,
      metadata: JSON.stringify({ overdueData })
    });
  }

  static async createFeeDueNotification(feeData: { studentName: string; amount: number; dueDate: string }) {
    return await NotificationService.createNotification({
      userId: 1, // Default to admin
      type: "payment",
      title: "Fee Due Reminder",
      message: `Fee of ₹${feeData.amount.toLocaleString()} is due for ${feeData.studentName} on ${feeData.dueDate}`,
      priority: "high",
      read: false,
      actionType: "view_fee",
      actionId: `fee-${Date.now()}`,
      metadata: JSON.stringify({ feeData })
    });
  }
} 