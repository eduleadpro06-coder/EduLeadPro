// Intelligent Student Success Prediction Engine
import { eq, sql, desc, and, gte, lt } from "drizzle-orm";
import { db } from "./lib/db.js";
import { students, feePayments, leads } from "../shared/schema.js";

// Student Success Prediction Interfaces
export interface StudentRiskProfile {
  studentId: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  successProbability: number; // 0-100
  riskFactors: RiskFactor[];
  recommendedInterventions: Intervention[];
  predictedOutcome: 'graduate' | 'dropout' | 'transfer';
  confidenceScore: number;
  lastUpdated: string;
}

export interface RiskFactor {
  category: 'financial' | 'academic' | 'engagement' | 'family' | 'behavioral';
  factor: string;
  weight: number; // 0-1
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface Intervention {
  type: 'financial_aid' | 'academic_support' | 'counseling' | 'family_engagement' | 'peer_support';
  priority: 'immediate' | 'urgent' | 'scheduled';
  description: string;
  estimatedImpact: number; // 0-100
  resources: string[];
  timeline: string;
}

export interface EarlyWarningAlert {
  studentId: number;
  alertType: 'attendance_drop' | 'payment_delay' | 'grade_decline' | 'engagement_low' | 'family_issue';
  severity: 'info' | 'warning' | 'urgent' | 'critical';
  message: string;
  actionRequired: boolean;
  assignedCounselor?: string;
  dueDate?: string;
}

// AI Student Success Prediction Engine
export async function predictStudentSuccess(studentId: number): Promise<StudentRiskProfile> {
  try {
    // Get student data
    const studentData = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (studentData.length === 0) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    const student = studentData[0];

    // Get financial history
    const paymentHistory = await db
      .select()
      .from(feePayments)
      .where(eq(feePayments.studentId, studentId))
      .orderBy(desc(feePayments.paymentDate));

    // Calculate risk factors
    const riskFactors: RiskFactor[] = [];
    let totalRiskScore = 0;

    // 1. Financial Risk Analysis
    const financialRisk = analyzeFinancialRisk(paymentHistory);
    riskFactors.push(...financialRisk.factors);
    totalRiskScore += financialRisk.score * 0.35; // 35% weight

    // 2. Academic Risk Analysis (simulated - would integrate with LMS)
    const academicRisk = analyzeAcademicRisk(student);
    riskFactors.push(...academicRisk.factors);
    totalRiskScore += academicRisk.score * 0.25; // 25% weight

    // 3. Engagement Risk Analysis
    const engagementRisk = analyzeEngagementRisk(student);
    riskFactors.push(...engagementRisk.factors);
    totalRiskScore += engagementRisk.score * 0.20; // 20% weight

    // 4. Family/Social Risk Analysis
    const familyRisk = analyzeFamilyRisk(student);
    riskFactors.push(...familyRisk.factors);
    totalRiskScore += familyRisk.score * 0.20; // 20% weight

    // Calculate success probability (inverse of risk)
    const successProbability = Math.max(10, Math.min(95, 100 - totalRiskScore));

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (successProbability >= 80) riskLevel = 'low';
    else if (successProbability >= 60) riskLevel = 'medium';
    else if (successProbability >= 40) riskLevel = 'high';
    else riskLevel = 'critical';

    // Generate interventions
    const recommendedInterventions = generateInterventions(riskFactors, riskLevel);

    // Predict outcome
    const predictedOutcome = successProbability >= 70 ? 'graduate' : 
                           successProbability >= 40 ? 'transfer' : 'dropout';

    // Confidence score based on data quality and completeness
    const confidenceScore = calculateConfidenceScore(paymentHistory.length, student);

    return {
      studentId,
      riskLevel,
      successProbability: Math.round(successProbability),
      riskFactors,
      recommendedInterventions,
      predictedOutcome,
      confidenceScore: Math.round(confidenceScore),
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Error predicting student success for ID ${studentId}:`, error);
    throw error;
  }
}

// Financial Risk Analysis
function analyzeFinancialRisk(paymentHistory: any[]): { score: number; factors: RiskFactor[] } {
  const factors: RiskFactor[] = [];
  let score = 0;

  if (paymentHistory.length === 0) {
    factors.push({
      category: 'financial',
      factor: 'no_payment_history',
      weight: 0.8,
      severity: 'high',
      description: 'No payment history available - high financial risk'
    });
    return { score: 80, factors };
  }

  // Analyze payment delays
  const latePayments = paymentHistory.filter(p => 
    p.status === 'pending' || (p.dueDate && new Date(p.dueDate) < new Date(p.paymentDate))
  );

  const latePaymentRatio = latePayments.length / paymentHistory.length;
  
  if (latePaymentRatio > 0.3) {
    factors.push({
      category: 'financial',
      factor: 'frequent_late_payments',
      weight: 0.7,
      severity: latePaymentRatio > 0.6 ? 'high' : 'medium',
      description: `${Math.round(latePaymentRatio * 100)}% of payments are late`
    });
    score += latePaymentRatio * 60;
  }

  // Analyze outstanding amounts
  const pendingPayments = paymentHistory.filter(p => p.status === 'pending');
  const totalPending = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  if (totalPending > 50000) {
    factors.push({
      category: 'financial',
      factor: 'high_outstanding_amount',
      weight: 0.6,
      severity: totalPending > 100000 ? 'high' : 'medium',
      description: `₹${totalPending.toLocaleString()} pending payment`
    });
    score += Math.min(40, totalPending / 2500); // Scale to max 40 points
  }

  return { score: Math.min(80, score), factors };
}

// Academic Risk Analysis (simulated)
function analyzeAcademicRisk(student: any): { score: number; factors: RiskFactor[] } {
  const factors: RiskFactor[] = [];
  let score = 0;

  // Simulate academic indicators based on available data
  const enrollmentDate = new Date(student.enrollmentDate);
  const monthsEnrolled = (Date.now() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

  // Early enrollment indicator
  if (monthsEnrolled > 6 && student.currentYear === '1st Year') {
    factors.push({
      category: 'academic',
      factor: 'slow_academic_progress',
      weight: 0.5,
      severity: 'medium',
      description: 'Student appears to be progressing slowly through curriculum'
    });
    score += 25;
  }

  // Course load analysis (simulated)
  const simulatedGPA = 3.0 + Math.random() * 1.0; // Simulate GPA 3.0-4.0
  if (simulatedGPA < 3.2) {
    factors.push({
      category: 'academic',
      factor: 'low_gpa',
      weight: 0.7,
      severity: simulatedGPA < 3.0 ? 'high' : 'medium',
      description: `Simulated GPA: ${simulatedGPA.toFixed(2)} - below average`
    });
    score += (3.5 - simulatedGPA) * 20;
  }

  return { score: Math.min(60, score), factors };
}

// Engagement Risk Analysis
function analyzeEngagementRisk(student: any): { score: number; factors: RiskFactor[] } {
  const factors: RiskFactor[] = [];
  let score = 0;

  // Contact information completeness
  if (!student.email || !student.phone) {
    factors.push({
      category: 'engagement',
      factor: 'incomplete_contact_info',
      weight: 0.4,
      severity: 'medium',
      description: 'Missing contact information reduces engagement opportunities'
    });
    score += 20;
  }

  // Parent engagement
  if (!student.parentName || !student.parentPhone) {
    factors.push({
      category: 'engagement',
      factor: 'no_parent_contact',
      weight: 0.5,
      severity: 'medium',
      description: 'No parent contact information available'
    });
    score += 25;
  }

  // Enrollment recency
  const enrollmentDate = new Date(student.enrollmentDate);
  const daysEnrolled = (Date.now() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysEnrolled < 30) {
    factors.push({
      category: 'engagement',
      factor: 'new_student',
      weight: 0.3,
      severity: 'low',
      description: 'Recently enrolled - adjustment period'
    });
    score += 15;
  }

  return { score: Math.min(50, score), factors };
}

// Family Risk Analysis
function analyzeFamilyRisk(student: any): { score: number; factors: RiskFactor[] } {
  const factors: RiskFactor[] = [];
  let score = 0;

  // Family contact availability
  if (!student.parentName) {
    factors.push({
      category: 'family',
      factor: 'no_family_contact',
      weight: 0.6,
      severity: 'high',
      description: 'No family contact available for support'
    });
    score += 30;
  }

  // Multiple students (potential financial strain)
  // This would be calculated by checking other students with same parent info
  // For now, simulate based on common names
  const commonNames = ['Kumar', 'Singh', 'Sharma', 'Patel'];
  if (commonNames.some(name => student.name.includes(name))) {
    factors.push({
      category: 'family',
      factor: 'potential_multiple_children',
      weight: 0.3,
      severity: 'low',
      description: 'May have multiple children in education system'
    });
    score += 10;
  }

  return { score: Math.min(40, score), factors };
}

// Generate AI-powered interventions
function generateInterventions(riskFactors: RiskFactor[], riskLevel: string): Intervention[] {
  const interventions: Intervention[] = [];

  const financialFactors = riskFactors.filter(f => f.category === 'financial');
  const academicFactors = riskFactors.filter(f => f.category === 'academic');
  const engagementFactors = riskFactors.filter(f => f.category === 'engagement');
  const familyFactors = riskFactors.filter(f => f.category === 'family');

  // Financial interventions
  if (financialFactors.length > 0) {
    const severity = financialFactors.some(f => f.severity === 'high') ? 'high' : 'medium';
    interventions.push({
      type: 'financial_aid',
      priority: severity === 'high' ? 'immediate' : 'urgent',
      description: severity === 'high' 
        ? 'Emergency financial counseling and scholarship evaluation'
        : 'Payment plan restructuring and financial assistance evaluation',
      estimatedImpact: severity === 'high' ? 70 : 50,
      resources: ['Financial Aid Office', 'Payment Plans', 'Scholarship Programs'],
      timeline: severity === 'high' ? 'Within 48 hours' : 'Within 1 week'
    });
  }

  // Academic interventions
  if (academicFactors.length > 0) {
    interventions.push({
      type: 'academic_support',
      priority: 'scheduled',
      description: 'Personalized tutoring and study skills development',
      estimatedImpact: 60,
      resources: ['Tutoring Center', 'Study Groups', 'Academic Advisors'],
      timeline: 'Within 2 weeks'
    });
  }

  // Engagement interventions
  if (engagementFactors.length > 0) {
    interventions.push({
      type: 'counseling',
      priority: 'urgent',
      description: 'One-on-one counseling session to address engagement issues',
      estimatedImpact: 55,
      resources: ['Student Counselors', 'Peer Mentors'],
      timeline: 'Within 3-5 days'
    });
  }

  // Family interventions
  if (familyFactors.length > 0) {
    interventions.push({
      type: 'family_engagement',
      priority: 'scheduled',
      description: 'Family meeting to discuss student progress and support strategies',
      estimatedImpact: 45,
      resources: ['Family Liaison', 'Parent Coordinator'],
      timeline: 'Within 2 weeks'
    });
  }

  // Critical risk interventions
  if (riskLevel === 'critical') {
    interventions.unshift({
      type: 'counseling',
      priority: 'immediate',
      description: 'Comprehensive intervention meeting with all stakeholders',
      estimatedImpact: 80,
      resources: ['Dean', 'Financial Aid', 'Academic Advisor', 'Counselor'],
      timeline: 'Within 24 hours'
    });
  }

  return interventions;
}

// Calculate confidence score
function calculateConfidenceScore(dataPoints: number, student: any): number {
  let confidence = 50; // Base confidence

  // More data points increase confidence
  confidence += Math.min(30, dataPoints * 5);

  // Complete profile increases confidence
  if (student.email && student.phone && student.parentName && student.parentPhone) {
    confidence += 15;
  }

  // Recent enrollment affects confidence
  const enrollmentDate = new Date(student.enrollmentDate);
  const daysEnrolled = (Date.now() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysEnrolled > 180) {
    confidence += 10; // More history = more confidence
  }

  return Math.min(95, confidence);
}

// Generate early warning alerts
export async function generateEarlyWarningAlerts(): Promise<EarlyWarningAlert[]> {
  const alerts: EarlyWarningAlert[] = [];

  try {
    // Get all active students
    const activeStudents = await db
      .select()
      .from(students)
      .where(eq(students.isActive, true));

    for (const student of activeStudents) {
      const riskProfile = await predictStudentSuccess(student.id);

      // Generate alerts based on risk level
      if (riskProfile.riskLevel === 'critical') {
        alerts.push({
          studentId: student.id,
          alertType: 'engagement_low',
          severity: 'critical',
          message: `${student.name} is at critical risk of dropping out (${riskProfile.successProbability}% success probability)`,
          actionRequired: true,
          assignedCounselor: 'system',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        });
      } else if (riskProfile.riskLevel === 'high') {
        alerts.push({
          studentId: student.id,
          alertType: 'grade_decline',
          severity: 'urgent',
          message: `${student.name} shows high risk indicators - intervention recommended`,
          actionRequired: true,
          assignedCounselor: 'system',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days
        });
      }

      // Check for specific financial alerts
      const financialRisks = riskProfile.riskFactors.filter(f => f.category === 'financial' && f.severity === 'high');
      if (financialRisks.length > 0) {
        alerts.push({
          studentId: student.id,
          alertType: 'payment_delay',
          severity: 'warning',
          message: `${student.name} has significant financial risk factors`,
          actionRequired: true,
          assignedCounselor: 'financial_aid'
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error generating early warning alerts:', error);
    return [];
  }
}

// Bulk prediction for dashboard
export async function bulkStudentSuccessPrediction(limit: number = 50): Promise<StudentRiskProfile[]> {
  try {
    const students = await db
      .select()
      .from(db.select().from(students).where(eq(students.isActive, true)))
      .limit(limit);

    const predictions = await Promise.all(
      students.map(student => predictStudentSuccess(student.id))
    );

    return predictions.sort((a, b) => a.successProbability - b.successProbability);
  } catch (error) {
    console.error('Error in bulk student success prediction:', error);
    return [];
  }
}