// AI-Powered Dynamic Pricing & Revenue Optimization
import { eq, sql, desc, and, gte, lt, avg, count } from "drizzle-orm";
import { db } from "./lib/db.js";
import { students, feePayments, leads, staff } from "../shared/schema.js";

// Dynamic Pricing Interfaces
export interface DynamicPricingRecommendation {
  courseId: string;
  courseName: string;
  currentPrice: number;
  recommendedPrice: number;
  priceChangePercentage: number;
  reasoning: string[];
  demandLevel: 'low' | 'medium' | 'high' | 'very_high';
  competitivePosition: 'below_market' | 'at_market' | 'above_market';
  priceElasticity: number;
  estimatedRevenueImpact: number;
  confidenceLevel: number;
}

export interface ScholarshipRecommendation {
  studentId: number;
  studentName: string;
  eligibilityScore: number; // 0-100
  recommendedScholarshipType: 'merit' | 'need' | 'hybrid' | 'special_category';
  recommendedAmount: number;
  recommendedPercentage: number;
  justification: string[];
  expectedROI: number; // Return on investment
  riskLevel: 'low' | 'medium' | 'high';
  priority: 'immediate' | 'high' | 'medium' | 'low';
}

export interface OptimalPaymentPlan {
  studentId: number;
  totalAmount: number;
  recommendedPlan: PaymentPlan;
  alternativePlans: PaymentPlan[];
  familyCapacityScore: number; // 0-100
  defaultRisk: number; // 0-100
  expectedCollectionRate: number; // 0-100
}

export interface PaymentPlan {
  planId: string;
  planName: string;
  installments: Installment[];
  totalAmount: number;
  interestRate: number;
  processingFee: number;
  collectionProbability: number;
  timeToComplete: number; // months
}

export interface Installment {
  installmentNumber: number;
  amount: number;
  dueDate: string;
  description: string;
}

export interface RevenueOptimization {
  currentMonthlyRevenue: number;
  projectedMonthlyRevenue: number;
  optimizationOpportunities: OptimizationOpportunity[];
  pricingRecommendations: DynamicPricingRecommendation[];
  scholarshipBudget: ScholarshipBudget;
  paymentPlanImpact: PaymentPlanImpact;
}

export interface OptimizationOpportunity {
  type: 'pricing' | 'scholarship' | 'payment_plan' | 'capacity' | 'retention';
  description: string;
  potentialImpact: number; // Revenue impact in rupees
  implementationEffort: 'low' | 'medium' | 'high';
  timeframe: string;
  priority: number; // 1-10
}

export interface ScholarshipBudget {
  totalBudget: number;
  allocatedAmount: number;
  remainingBudget: number;
  expectedStudents: number;
  averageScholarshipAmount: number;
  projectedROI: number;
}

export interface PaymentPlanImpact {
  studentsOnPaymentPlans: number;
  totalPlannedRevenue: number;
  averageCollectionRate: number;
  riskAdjustedRevenue: number;
}

// AI Dynamic Pricing Engine
export async function generateDynamicPricingRecommendations(): Promise<DynamicPricingRecommendation[]> {
  try {
    // Get current course enrollment and pricing data
    const courseData = await analyzeCoursePerformance();
    const marketConditions = await analyzeMarketConditions();
    const capacityData = await analyzeCapacityUtilization();

    const recommendations: DynamicPricingRecommendation[] = [];

    for (const course of courseData) {
      const recommendation = await generateCoursepricing(course, marketConditions, capacityData);
      recommendations.push(recommendation);
    }

    return recommendations.sort((a, b) => Math.abs(b.priceChangePercentage) - Math.abs(a.priceChangePercentage));
  } catch (error) {
    console.error('Error generating dynamic pricing recommendations:', error);
    return [];
  }
}

// Analyze course performance
async function analyzeCoursePerformance() {
  try {
    const courses = await db
      .select({
        courseId: students.course,
        courseName: students.course,
        studentCount: count(students.id),
        averageFee: avg(sql`CAST(${students.feeAmount} AS DECIMAL)`),
        enrollmentTrend: sql<number>`COUNT(CASE WHEN ${students.enrollmentDate} >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)`
      })
      .from(students)
      .where(eq(students.isActive, true))
      .groupBy(students.course);

    return courses.map(course => ({
      courseId: course.courseId || 'unknown',
      courseName: course.courseName || 'Unknown Course',
      studentCount: Number(course.studentCount) || 0,
      averageFee: Number(course.averageFee) || 0,
      enrollmentTrend: Number(course.enrollmentTrend) || 0,
      currentPrice: Number(course.averageFee) || 80000 // Default price
    }));
  } catch (error) {
    console.error('Error analyzing course performance:', error);
    return [];
  }
}

// Analyze market conditions (simulated)
async function analyzeMarketConditions() {
  // In a real implementation, this would connect to market research APIs
  return {
    economicIndex: 0.75, // 0-1 scale, economic favorability
    competitionLevel: 0.6, // 0-1 scale, competition intensity
    demandGrowth: 0.15, // YoY growth rate
    seasonality: 0.8, // Current seasonal factor
    inflationRate: 0.06 // Current inflation rate
  };
}

// Analyze capacity utilization
async function analyzeCapacityUtilization() {
  try {
    const totalStudents = await db
      .select({ count: count(students.id) })
      .from(students)
      .where(eq(students.isActive, true));

    const totalStaff = await db
      .select({ count: count(staff.id) })
      .from(staff)
      .where(eq(staff.isActive, true));

    const studentCount = Number(totalStudents[0]?.count) || 0;
    const staffCount = Number(totalStaff[0]?.count) || 1;

    return {
      currentCapacity: studentCount,
      maxCapacity: staffCount * 50, // Assume 50 students per staff member
      utilizationRate: (studentCount / (staffCount * 50)) * 100,
      growthCapacity: Math.max(0, (staffCount * 50) - studentCount)
    };
  } catch (error) {
    console.error('Error analyzing capacity utilization:', error);
    return {
      currentCapacity: 0,
      maxCapacity: 100,
      utilizationRate: 0,
      growthCapacity: 100
    };
  }
}

// Generate course-specific pricing
async function generateCoursepricing(
  course: any, 
  market: any, 
  capacity: any
): Promise<DynamicPricingRecommendation> {
  const currentPrice = course.currentPrice;
  let recommendedPrice = currentPrice;
  const reasoning: string[] = [];

  // Demand-based pricing
  const demandScore = calculateDemandScore(course.enrollmentTrend, course.studentCount);
  let demandLevel: 'low' | 'medium' | 'high' | 'very_high';
  
  if (demandScore >= 80) {
    demandLevel = 'very_high';
    recommendedPrice *= 1.15; // 15% increase
    reasoning.push('Very high demand allows for premium pricing');
  } else if (demandScore >= 60) {
    demandLevel = 'high';
    recommendedPrice *= 1.08; // 8% increase
    reasoning.push('High demand supports price increase');
  } else if (demandScore >= 40) {
    demandLevel = 'medium';
    recommendedPrice *= 1.02; // 2% increase
    reasoning.push('Moderate demand allows slight price adjustment');
  } else {
    demandLevel = 'low';
    recommendedPrice *= 0.95; // 5% decrease
    reasoning.push('Low demand requires competitive pricing');
  }

  // Capacity-based adjustment
  if (capacity.utilizationRate > 90) {
    recommendedPrice *= 1.05;
    reasoning.push('Near capacity - premium pricing justified');
  } else if (capacity.utilizationRate < 50) {
    recommendedPrice *= 0.97;
    reasoning.push('Underutilized capacity - competitive pricing needed');
  }

  // Market condition adjustment
  if (market.economicIndex < 0.5) {
    recommendedPrice *= 0.95;
    reasoning.push('Economic conditions require careful pricing');
  }

  // Seasonal adjustment
  recommendedPrice *= market.seasonality;
  if (market.seasonality > 1) {
    reasoning.push('Peak season allows for premium pricing');
  }

  // Inflation adjustment
  recommendedPrice *= (1 + market.inflationRate * 0.5);
  reasoning.push(`Inflation adjustment: ${(market.inflationRate * 50).toFixed(1)}%`);

  // Round to nearest 1000
  recommendedPrice = Math.round(recommendedPrice / 1000) * 1000;

  const priceChangePercentage = ((recommendedPrice - currentPrice) / currentPrice) * 100;
  const estimatedRevenueImpact = calculateRevenueImpact(course.studentCount, priceChangePercentage);

  return {
    courseId: course.courseId,
    courseName: course.courseName,
    currentPrice,
    recommendedPrice,
    priceChangePercentage: Math.round(priceChangePercentage * 100) / 100,
    reasoning,
    demandLevel,
    competitivePosition: getCompetitivePosition(recommendedPrice),
    priceElasticity: calculatePriceElasticity(demandLevel),
    estimatedRevenueImpact,
    confidenceLevel: calculatePricingConfidence(course, market)
  };
}

// Calculate demand score
function calculateDemandScore(enrollmentTrend: number, totalStudents: number): number {
  const trendScore = Math.min(50, enrollmentTrend * 5); // Recent enrollments
  const volumeScore = Math.min(50, totalStudents * 2); // Total student base
  return trendScore + volumeScore;
}

// Get competitive position
function getCompetitivePosition(price: number): 'below_market' | 'at_market' | 'above_market' {
  const marketAverage = 75000; // Simulated market average
  if (price < marketAverage * 0.9) return 'below_market';
  if (price > marketAverage * 1.1) return 'above_market';
  return 'at_market';
}

// Calculate price elasticity
function calculatePriceElasticity(demandLevel: string): number {
  switch (demandLevel) {
    case 'very_high': return -0.5; // Inelastic
    case 'high': return -0.8;
    case 'medium': return -1.2;
    case 'low': return -2.0; // Elastic
    default: return -1.0;
  }
}

// Calculate revenue impact
function calculateRevenueImpact(studentCount: number, priceChangePercentage: number): number {
  const elasticity = -1.0; // Simplified elasticity
  const demandChange = elasticity * (priceChangePercentage / 100);
  const newStudentCount = studentCount * (1 + demandChange);
  const priceMultiplier = (1 + priceChangePercentage / 100);
  
  const currentRevenue = studentCount * 80000; // Assume average fee
  const newRevenue = newStudentCount * 80000 * priceMultiplier;
  
  return newRevenue - currentRevenue;
}

// Calculate pricing confidence
function calculatePricingConfidence(course: any, market: any): number {
  let confidence = 60; // Base confidence
  
  if (course.studentCount > 20) confidence += 15; // More data
  if (course.enrollmentTrend > 5) confidence += 10; // Strong trend
  if (market.economicIndex > 0.7) confidence += 10; // Stable economy
  
  return Math.min(95, confidence);
}

// Generate scholarship recommendations
export async function generateScholarshipRecommendations(): Promise<ScholarshipRecommendation[]> {
  try {
    const students = await db
      .select()
      .from(students)
      .where(eq(students.isActive, true))
      .limit(50);

    const recommendations: ScholarshipRecommendation[] = [];

    for (const student of students) {
      const recommendation = await analyzeScholarshipEligibility(student);
      if (recommendation.eligibilityScore >= 60) {
        recommendations.push(recommendation);
      }
    }

    return recommendations.sort((a, b) => b.eligibilityScore - a.eligibilityScore);
  } catch (error) {
    console.error('Error generating scholarship recommendations:', error);
    return [];
  }
}

// Analyze scholarship eligibility
async function analyzeScholarshipEligibility(student: any): Promise<ScholarshipRecommendation> {
  let eligibilityScore = 0;
  const justification: string[] = [];

  // Financial need analysis
  const paymentHistory = await db
    .select()
    .from(feePayments)
    .where(eq(feePayments.studentId, student.id));

  const financialNeedScore = analyzeFinancialNeed(paymentHistory);
  eligibilityScore += financialNeedScore * 0.4; // 40% weight

  if (financialNeedScore > 70) {
    justification.push('High financial need demonstrated');
  }

  // Academic merit simulation
  const meritScore = simulateAcademicMerit();
  eligibilityScore += meritScore * 0.35; // 35% weight

  if (meritScore > 80) {
    justification.push('Excellent academic performance');
  }

  // Enrollment duration bonus
  const enrollmentDate = new Date(student.enrollmentDate);
  const monthsEnrolled = (Date.now() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  if (monthsEnrolled > 12) {
    eligibilityScore += 15;
    justification.push('Long-term student commitment');
  }

  // Family situation
  if (student.parentName && student.parentPhone) {
    eligibilityScore += 10;
    justification.push('Strong family support system');
  }

  // Determine scholarship type
  let scholarshipType: 'merit' | 'need' | 'hybrid' | 'special_category';
  if (meritScore > 85 && financialNeedScore > 70) {
    scholarshipType = 'hybrid';
  } else if (meritScore > 85) {
    scholarshipType = 'merit';
  } else if (financialNeedScore > 80) {
    scholarshipType = 'need';
  } else {
    scholarshipType = 'special_category';
  }

  // Calculate recommended amount
  const baseAmount = parseFloat(student.feeAmount) || 80000;
  let scholarshipPercentage = Math.min(50, eligibilityScore * 0.5); // Max 50%
  
  if (scholarshipType === 'hybrid') {
    scholarshipPercentage = Math.min(60, eligibilityScore * 0.6);
  }

  const recommendedAmount = (baseAmount * scholarshipPercentage) / 100;

  return {
    studentId: student.id,
    studentName: student.name,
    eligibilityScore: Math.round(eligibilityScore),
    recommendedScholarshipType: scholarshipType,
    recommendedAmount: Math.round(recommendedAmount),
    recommendedPercentage: Math.round(scholarshipPercentage),
    justification,
    expectedROI: calculateScholarshipROI(scholarshipType, recommendedAmount),
    riskLevel: calculateScholarshipRisk(financialNeedScore, meritScore),
    priority: eligibilityScore > 85 ? 'immediate' : 
             eligibilityScore > 75 ? 'high' :
             eligibilityScore > 65 ? 'medium' : 'low'
  };
}

// Analyze financial need
function analyzeFinancialNeed(paymentHistory: any[]): number {
  if (paymentHistory.length === 0) return 80; // No payments = high need

  const latePayments = paymentHistory.filter(p => p.status === 'pending').length;
  const totalPayments = paymentHistory.length;
  const lateRatio = latePayments / totalPayments;

  return Math.min(100, 30 + (lateRatio * 70));
}

// Simulate academic merit
function simulateAcademicMerit(): number {
  // In real implementation, this would connect to academic systems
  return 60 + Math.random() * 40; // Random score 60-100
}

// Calculate scholarship ROI
function calculateScholarshipROI(type: string, amount: number): number {
  const retentionBonus = type === 'merit' ? 0.95 : 0.85;
  const referralValue = 0.3; // 30% chance of referral
  const brandValue = 0.2; // Brand reputation value
  
  return (retentionBonus + referralValue + brandValue) * 100;
}

// Calculate scholarship risk
function calculateScholarshipRisk(financialNeed: number, merit: number): 'low' | 'medium' | 'high' {
  const riskScore = (100 - merit) + (financialNeed * 0.5);
  
  if (riskScore > 70) return 'high';
  if (riskScore > 40) return 'medium';
  return 'low';
}

// Generate optimal payment plans
export async function generateOptimalPaymentPlan(studentId: number): Promise<OptimalPaymentPlan> {
  try {
    const student = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (student.length === 0) {
      throw new Error('Student not found');
    }

    const studentData = student[0];
    const totalAmount = parseFloat(studentData.feeAmount) || 80000;
    
    // Analyze family financial capacity
    const familyCapacityScore = await analyzeFamilyCapacity(studentData);
    
    // Generate payment plans
    const plans = generatePaymentPlans(totalAmount, familyCapacityScore);
    
    // Calculate default risk
    const defaultRisk = calculateDefaultRisk(familyCapacityScore, studentData);
    
    return {
      studentId,
      totalAmount,
      recommendedPlan: plans[0],
      alternativePlans: plans.slice(1),
      familyCapacityScore,
      defaultRisk,
      expectedCollectionRate: Math.max(70, 100 - defaultRisk)
    };
  } catch (error) {
    console.error('Error generating optimal payment plan:', error);
    throw error;
  }
}

// Analyze family financial capacity
async function analyzeFamilyCapacity(student: any): Promise<number> {
  let capacityScore = 50; // Base score

  // Payment history analysis
  const paymentHistory = await db
    .select()
    .from(feePayments)
    .where(eq(feePayments.studentId, student.id));

  if (paymentHistory.length > 0) {
    const onTimePayments = paymentHistory.filter(p => p.status === 'paid').length;
    const punctualityRatio = onTimePayments / paymentHistory.length;
    capacityScore += punctualityRatio * 30;
  }

  // Enrollment timing (early enrollments indicate financial readiness)
  const enrollmentDate = new Date(student.enrollmentDate);
  const academicYearStart = new Date(enrollmentDate.getFullYear(), 5, 1); // June 1st
  const enrollmentSpeed = (enrollmentDate.getTime() - academicYearStart.getTime()) / (1000 * 60 * 60 * 24);
  
  if (enrollmentSpeed < 30) {
    capacityScore += 15; // Early enrollment bonus
  }

  // Contact completeness (indicates organization and engagement)
  if (student.email && student.phone && student.parentPhone) {
    capacityScore += 10;
  }

  return Math.min(95, capacityScore);
}

// Generate payment plans
function generatePaymentPlans(totalAmount: number, capacityScore: number): PaymentPlan[] {
  const plans: PaymentPlan[] = [];

  // Plan 1: Standard Plan (based on capacity)
  const installmentCount = capacityScore > 70 ? 4 : capacityScore > 50 ? 6 : 8;
  const standardPlan = createInstallmentPlan('standard', totalAmount, installmentCount, 0.05);
  plans.push(standardPlan);

  // Plan 2: Flexible Plan
  const flexiblePlan = createInstallmentPlan('flexible', totalAmount, 10, 0.08);
  plans.push(flexiblePlan);

  // Plan 3: Express Plan (for high capacity families)
  if (capacityScore > 80) {
    const expressPlan = createInstallmentPlan('express', totalAmount, 2, 0.02);
    plans.push(expressPlan);
  }

  // Plan 4: Budget Plan (for low capacity families)
  if (capacityScore < 60) {
    const budgetPlan = createInstallmentPlan('budget', totalAmount, 12, 0.10);
    plans.push(budgetPlan);
  }

  return plans;
}

// Create installment plan
function createInstallmentPlan(
  planType: string, 
  totalAmount: number, 
  installmentCount: number, 
  interestRate: number
): PaymentPlan {
  const principalPerInstallment = totalAmount / installmentCount;
  const totalWithInterest = totalAmount * (1 + interestRate);
  const installmentAmount = totalWithInterest / installmentCount;
  const processingFee = totalAmount * 0.01; // 1% processing fee

  const installments: Installment[] = [];
  const startDate = new Date();

  for (let i = 1; i <= installmentCount; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(startDate.getMonth() + i);

    installments.push({
      installmentNumber: i,
      amount: Math.round(installmentAmount),
      dueDate: dueDate.toISOString(),
      description: `Installment ${i} of ${installmentCount}`
    });
  }

  const planNames = {
    standard: 'Standard Payment Plan',
    flexible: 'Flexible Payment Plan',
    express: 'Express Payment Plan',
    budget: 'Budget-Friendly Plan'
  };

  return {
    planId: `${planType}_${installmentCount}`,
    planName: planNames[planType as keyof typeof planNames] || 'Custom Plan',
    installments,
    totalAmount: totalWithInterest + processingFee,
    interestRate,
    processingFee,
    collectionProbability: calculateCollectionProbability(installmentCount, interestRate),
    timeToComplete: installmentCount
  };
}

// Calculate collection probability
function calculateCollectionProbability(installmentCount: number, interestRate: number): number {
  let probability = 85; // Base probability

  // More installments = lower probability
  probability -= (installmentCount - 4) * 2;

  // Higher interest = lower probability
  probability -= interestRate * 100;

  return Math.max(60, Math.min(95, probability));
}

// Calculate default risk
function calculateDefaultRisk(capacityScore: number, student: any): number {
  let riskScore = 100 - capacityScore; // Inverse of capacity

  // Adjust based on course type (some courses have lower default rates)
  const lowRiskCourses = ['engineering', 'medical', 'mba'];
  if (lowRiskCourses.some(course => 
    student.course?.toLowerCase().includes(course)
  )) {
    riskScore *= 0.8;
  }

  return Math.max(5, Math.min(80, riskScore));
}