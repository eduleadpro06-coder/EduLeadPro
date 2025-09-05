// Predictive Staff Management & Optimization System
import { eq, sql, desc, and, gte, lt, count, avg } from "drizzle-orm";
import { db } from "./lib/db.js";
import { staff, students, leads } from "../shared/schema.js";

// Staff Management Interfaces
export interface WorkloadOptimization {
  staffId: number;
  staffName: string;
  department: string;
  currentWorkload: WorkloadMetrics;
  optimalWorkload: WorkloadMetrics;
  recommendations: WorkloadRecommendation[];
  efficiencyScore: number; // 0-100
  burnoutRisk: 'low' | 'medium' | 'high' | 'critical';
  redistributionSuggestions: TaskRedistribution[];
}

export interface WorkloadMetrics {
  totalTasks: number;
  avgTaskComplexity: number; // 1-10
  hoursPerWeek: number;
  leadCount: number;
  studentCount: number;
  meetingHours: number;
  adminHours: number;
  teachingHours: number;
}

export interface WorkloadRecommendation {
  type: 'reduce_load' | 'increase_efficiency' | 'redistribute_tasks' | 'provide_support';
  description: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  estimatedImpact: number; // 0-100
  resourcesRequired: string[];
  timeframe: string;
}

export interface TaskRedistribution {
  fromStaffId: number;
  toStaffId: number;
  taskType: string;
  taskCount: number;
  reasoning: string;
  estimatedEfficiencyGain: number;
}

export interface HiringPrediction {
  department: string;
  recommendedHires: number;
  urgency: 'immediate' | 'within_month' | 'within_quarter' | 'within_year';
  reasoning: string[];
  skillsRequired: string[];
  budgetEstimate: number;
  expectedROI: number;
  hiringTimeline: HiringMilestone[];
}

export interface HiringMilestone {
  phase: string;
  description: string;
  estimatedDuration: string;
  dependencies: string[];
}

export interface PerformanceEnhancement {
  staffId: number;
  currentPerformance: PerformanceMetrics;
  potentialPerformance: PerformanceMetrics;
  trainingNeeds: TrainingRecommendation[];
  careerPath: CareerPathSuggestion[];
  mentorshipRecommendations: string[];
  performanceGap: number; // 0-100
}

export interface PerformanceMetrics {
  taskCompletionRate: number; // 0-100
  qualityScore: number; // 0-100
  studentSatisfaction: number; // 0-100
  teamCollaboration: number; // 0-100
  innovation: number; // 0-100
  leadership: number; // 0-100
}

export interface TrainingRecommendation {
  trainingType: 'technical' | 'soft_skills' | 'leadership' | 'certification';
  skillGap: string;
  recommendedProgram: string;
  estimatedDuration: string;
  cost: number;
  expectedImprovement: number; // 0-100
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface CareerPathSuggestion {
  currentRole: string;
  suggestedNextRole: string;
  timeframe: string;
  skillsToAcquire: string[];
  experienceNeeded: string[];
  certifications: string[];
  mentorshipRequired: boolean;
}

export interface StaffOptimizationDashboard {
  totalStaff: number;
  avgEfficiencyScore: number;
  burnoutAlerts: number;
  hiringRecommendations: HiringPrediction[];
  topPerformers: StaffPerformanceSummary[];
  improvementOpportunities: OptimizationOpportunity[];
  workloadDistribution: WorkloadDistributionAnalysis;
}

export interface StaffPerformanceSummary {
  staffId: number;
  name: string;
  department: string;
  overallScore: number;
  strengths: string[];
  improvementAreas: string[];
  nextCareerStep: string;
}

export interface OptimizationOpportunity {
  type: 'workload_rebalancing' | 'skill_development' | 'process_improvement' | 'technology_adoption';
  description: string;
  affectedStaff: number[];
  potentialEfficiencyGain: number;
  implementationCost: number;
  paybackPeriod: string;
}

export interface WorkloadDistributionAnalysis {
  departments: DepartmentWorkload[];
  overloadedStaff: number;
  underutilizedStaff: number;
  optimalDistributionScore: number; // 0-100
  rebalancingRecommendations: string[];
}

export interface DepartmentWorkload {
  department: string;
  staffCount: number;
  avgWorkload: number;
  workloadVariance: number;
  efficiencyScore: number;
}

// Main Staff Optimization Function
export async function analyzeStaffOptimization(): Promise<StaffOptimizationDashboard> {
  try {
    const allStaff = await db
      .select()
      .from(staff)
      .where(eq(staff.isActive, true));

    const staffOptimizations = await Promise.all(
      allStaff.map(staffMember => optimizeStaffWorkload(staffMember.id))
    );

    const hiringPredictions = await generateHiringPredictions();
    const workloadDistribution = await analyzeWorkloadDistribution();
    
    // Calculate summary metrics
    const totalStaff = allStaff.length;
    const avgEfficiencyScore = staffOptimizations.reduce((sum, opt) => sum + opt.efficiencyScore, 0) / totalStaff;
    const burnoutAlerts = staffOptimizations.filter(opt => opt.burnoutRisk === 'high' || opt.burnoutRisk === 'critical').length;

    // Get top performers
    const topPerformers = await getTopPerformers(allStaff);

    // Identify improvement opportunities
    const improvementOpportunities = await identifyOptimizationOpportunities(staffOptimizations);

    return {
      totalStaff,
      avgEfficiencyScore: Math.round(avgEfficiencyScore),
      burnoutAlerts,
      hiringRecommendations: hiringPredictions,
      topPerformers,
      improvementOpportunities,
      workloadDistribution
    };

  } catch (error) {
    console.error('Error analyzing staff optimization:', error);
    throw error;
  }
}

// Optimize individual staff workload
export async function optimizeStaffWorkload(staffId: number): Promise<WorkloadOptimization> {
  try {
    const staffMember = await db
      .select()
      .from(staff)
      .where(eq(staff.id, staffId))
      .limit(1);

    if (staffMember.length === 0) {
      throw new Error(`Staff member with ID ${staffId} not found`);
    }

    const staffData = staffMember[0];

    // Calculate current workload metrics
    const currentWorkload = await calculateWorkloadMetrics(staffId);
    
    // Calculate optimal workload
    const optimalWorkload = calculateOptimalWorkload(staffData, currentWorkload);
    
    // Generate recommendations
    const recommendations = generateWorkloadRecommendations(currentWorkload, optimalWorkload, staffData);
    
    // Calculate efficiency score
    const efficiencyScore = calculateEfficiencyScore(currentWorkload, optimalWorkload);
    
    // Assess burnout risk
    const burnoutRisk = assessBurnoutRisk(currentWorkload, staffData);
    
    // Generate redistribution suggestions
    const redistributionSuggestions = await generateRedistributionSuggestions(staffId, currentWorkload);

    return {
      staffId,
      staffName: staffData.name,
      department: staffData.department || 'General',
      currentWorkload,
      optimalWorkload,
      recommendations,
      efficiencyScore,
      burnoutRisk,
      redistributionSuggestions
    };

  } catch (error) {
    console.error(`Error optimizing workload for staff ${staffId}:`, error);
    throw error;
  }
}

// Calculate workload metrics
async function calculateWorkloadMetrics(staffId: number): Promise<WorkloadMetrics> {
  try {
    // Get assigned students (simulated - would integrate with actual assignment system)
    const studentCount = await db
      .select({ count: count(students.id) })
      .from(students)
      .where(eq(students.isActive, true));

    // Get assigned leads (simulated)
    const leadCount = await db
      .select({ count: count(leads.id) })
      .from(leads)
      .where(eq(leads.status, 'interested'));

    // Simulate other metrics based on department and role
    const baseHours = 40; // Standard work week
    const studentsPerStaff = Math.floor((Number(studentCount[0]?.count) || 0) / 5); // Assume 5 staff members
    const leadsPerStaff = Math.floor((Number(leadCount[0]?.count) || 0) / 3); // Assume 3 staff handle leads

    return {
      totalTasks: studentsPerStaff + leadsPerStaff + 10, // Base administrative tasks
      avgTaskComplexity: 6.5, // Average complexity
      hoursPerWeek: baseHours + (studentsPerStaff * 0.5) + (leadsPerStaff * 0.3),
      leadCount: leadsPerStaff,
      studentCount: studentsPerStaff,
      meetingHours: 8, // Average meeting hours per week
      adminHours: 12, // Administrative hours
      teachingHours: Math.max(0, baseHours - 20) // Remaining hours for teaching
    };

  } catch (error) {
    console.error('Error calculating workload metrics:', error);
    return {
      totalTasks: 25,
      avgTaskComplexity: 5,
      hoursPerWeek: 40,
      leadCount: 10,
      studentCount: 30,
      meetingHours: 8,
      adminHours: 12,
      teachingHours: 20
    };
  }
}

// Calculate optimal workload
function calculateOptimalWorkload(staffData: any, currentWorkload: WorkloadMetrics): WorkloadMetrics {
  const experience = calculateExperience(staffData);
  const departmentFactor = getDepartmentWorkloadFactor(staffData.department);
  
  return {
    totalTasks: Math.floor(25 + (experience * 5) + departmentFactor),
    avgTaskComplexity: Math.min(8, 5 + experience),
    hoursPerWeek: Math.min(45, 40 + (experience * 2)),
    leadCount: Math.floor(8 + (experience * 3)),
    studentCount: Math.floor(25 + (experience * 8)),
    meetingHours: Math.min(10, 6 + experience),
    adminHours: Math.max(8, 15 - experience),
    teachingHours: Math.max(15, 25 - (experience * 2))
  };
}

// Calculate experience level
function calculateExperience(staffData: any): number {
  const joiningDate = new Date(staffData.joiningDate);
  const monthsOfExperience = (Date.now() - joiningDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  if (monthsOfExperience > 36) return 3; // Senior (3+ years)
  if (monthsOfExperience > 12) return 2; // Intermediate (1-3 years)
  return 1; // Junior (< 1 year)
}

// Get department workload factor
function getDepartmentWorkloadFactor(department: string | null): number {
  const factors: Record<string, number> = {
    'Academic': 5,
    'Admissions': 8,
    'Finance': 3,
    'Administration': 2,
    'Student Affairs': 6,
    'Technical': 4
  };
  
  return factors[department || 'General'] || 3;
}

// Generate workload recommendations
function generateWorkloadRecommendations(
  current: WorkloadMetrics,
  optimal: WorkloadMetrics,
  staffData: any
): WorkloadRecommendation[] {
  const recommendations: WorkloadRecommendation[] = [];

  // Check if overloaded
  if (current.hoursPerWeek > optimal.hoursPerWeek * 1.2) {
    recommendations.push({
      type: 'reduce_load',
      description: `Reduce weekly hours from ${current.hoursPerWeek} to ${optimal.hoursPerWeek} to prevent burnout`,
      priority: current.hoursPerWeek > 50 ? 'immediate' : 'high',
      estimatedImpact: 75,
      resourcesRequired: ['Task redistribution', 'Additional support staff'],
      timeframe: '1-2 weeks'
    });
  }

  // Check if underutilized
  if (current.hoursPerWeek < optimal.hoursPerWeek * 0.8) {
    recommendations.push({
      type: 'increase_efficiency',
      description: `Increase utilization from ${current.hoursPerWeek} to ${optimal.hoursPerWeek} hours per week`,
      priority: 'medium',
      estimatedImpact: 60,
      resourcesRequired: ['Additional responsibilities', 'Cross-training'],
      timeframe: '2-4 weeks'
    });
  }

  // Check task complexity mismatch
  if (current.avgTaskComplexity > optimal.avgTaskComplexity * 1.3) {
    recommendations.push({
      type: 'provide_support',
      description: 'Provide additional training or support for complex tasks',
      priority: 'high',
      estimatedImpact: 65,
      resourcesRequired: ['Training programs', 'Mentorship'],
      timeframe: '1-3 months'
    });
  }

  // Check task distribution
  if (current.totalTasks > optimal.totalTasks * 1.2) {
    recommendations.push({
      type: 'redistribute_tasks',
      description: `Redistribute ${current.totalTasks - optimal.totalTasks} tasks to optimize workload`,
      priority: 'high',
      estimatedImpact: 70,
      resourcesRequired: ['Team coordination', 'Task management system'],
      timeframe: '1-2 weeks'
    });
  }

  return recommendations;
}

// Calculate efficiency score
function calculateEfficiencyScore(current: WorkloadMetrics, optimal: WorkloadMetrics): number {
  const hoursDiff = Math.abs(current.hoursPerWeek - optimal.hoursPerWeek) / optimal.hoursPerWeek;
  const tasksDiff = Math.abs(current.totalTasks - optimal.totalTasks) / optimal.totalTasks;
  const complexityDiff = Math.abs(current.avgTaskComplexity - optimal.avgTaskComplexity) / optimal.avgTaskComplexity;

  const efficiency = 100 - ((hoursDiff + tasksDiff + complexityDiff) / 3) * 100;
  return Math.max(0, Math.min(100, efficiency));
}

// Assess burnout risk
function assessBurnoutRisk(workload: WorkloadMetrics, staffData: any): 'low' | 'medium' | 'high' | 'critical' {
  const experience = calculateExperience(staffData);
  let riskScore = 0;

  // Hours-based risk
  if (workload.hoursPerWeek > 50) riskScore += 30;
  else if (workload.hoursPerWeek > 45) riskScore += 20;
  else if (workload.hoursPerWeek > 40) riskScore += 10;

  // Task complexity risk
  if (workload.avgTaskComplexity > 8) riskScore += 25;
  else if (workload.avgTaskComplexity > 7) riskScore += 15;

  // Task volume risk
  if (workload.totalTasks > 40) riskScore += 20;
  else if (workload.totalTasks > 30) riskScore += 10;

  // Experience factor (less experienced staff have higher risk)
  riskScore += (4 - experience) * 5;

  if (riskScore > 70) return 'critical';
  if (riskScore > 50) return 'high';
  if (riskScore > 30) return 'medium';
  return 'low';
}

// Generate redistribution suggestions
async function generateRedistributionSuggestions(
  staffId: number,
  workload: WorkloadMetrics
): Promise<TaskRedistribution[]> {
  const suggestions: TaskRedistribution[] = [];

  try {
    // Get other staff members for potential redistribution
    const otherStaff = await db
      .select()
      .from(staff)
      .where(and(eq(staff.isActive, true), sql`${staff.id} != ${staffId}`))
      .limit(5);

    if (workload.hoursPerWeek > 45) {
      // Find staff with lower workload
      for (const member of otherStaff) {
        const memberWorkload = await calculateWorkloadMetrics(member.id);
        
        if (memberWorkload.hoursPerWeek < 40) {
          suggestions.push({
            fromStaffId: staffId,
            toStaffId: member.id,
            taskType: 'Administrative tasks',
            taskCount: Math.min(5, Math.floor((workload.hoursPerWeek - 45) / 2)),
            reasoning: `${member.name} has capacity for additional administrative work`,
            estimatedEfficiencyGain: 15
          });
        }
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Error generating redistribution suggestions:', error);
    return [];
  }
}

// Generate hiring predictions
export async function generateHiringPredictions(): Promise<HiringPrediction[]> {
  try {
    const predictions: HiringPrediction[] = [];

    // Analyze current staff capacity vs student growth
    const currentStudents = await db
      .select({ count: count(students.id) })
      .from(students)
      .where(eq(students.isActive, true));

    const currentStaff = await db
      .select({ count: count(staff.id) })
      .from(staff)
      .where(eq(staff.isActive, true));

    const studentCount = Number(currentStudents[0]?.count) || 0;
    const staffCount = Number(currentStaff[0]?.count) || 1;
    const studentToStaffRatio = studentCount / staffCount;

    // Predict hiring needs based on ratio and growth projections
    if (studentToStaffRatio > 25) {
      predictions.push({
        department: 'Academic',
        recommendedHires: Math.ceil((studentToStaffRatio - 20) / 15),
        urgency: studentToStaffRatio > 30 ? 'immediate' : 'within_month',
        reasoning: [
          `Current student-to-staff ratio is ${studentToStaffRatio.toFixed(1)}:1`,
          'Optimal ratio should be 20:1 for quality education',
          'High workload detected among current academic staff'
        ],
        skillsRequired: ['Subject matter expertise', 'Teaching experience', 'Student mentoring'],
        budgetEstimate: 800000, // Average annual salary
        expectedROI: 150, // Return on investment percentage
        hiringTimeline: [
          {
            phase: 'Job Posting',
            description: 'Create and post job descriptions',
            estimatedDuration: '1 week',
            dependencies: ['Budget approval', 'HR coordination']
          },
          {
            phase: 'Candidate Screening',
            description: 'Review applications and conduct initial interviews',
            estimatedDuration: '2-3 weeks',
            dependencies: ['Job posting completion']
          },
          {
            phase: 'Final Selection',
            description: 'Final interviews and selection process',
            estimatedDuration: '1 week',
            dependencies: ['Candidate screening']
          },
          {
            phase: 'Onboarding',
            description: 'Complete hiring process and initial training',
            estimatedDuration: '2 weeks',
            dependencies: ['Candidate selection']
          }
        ]
      });
    }

    // Check for specific department needs
    const departments = ['Admissions', 'Finance', 'Student Affairs', 'Technical'];
    for (const dept of departments) {
      const deptStaff = await db
        .select({ count: count(staff.id) })
        .from(staff)
        .where(and(eq(staff.isActive, true), eq(staff.department, dept)));

      const deptCount = Number(deptStaff[0]?.count) || 0;
      
      if (deptCount < 2 && studentCount > 100) {
        predictions.push({
          department: dept,
          recommendedHires: 1,
          urgency: 'within_quarter',
          reasoning: [
            `Only ${deptCount} staff member(s) in ${dept} department`,
            'Department needs backup and specialized skills',
            'Growing student base requires dedicated support'
          ],
          skillsRequired: getDepartmentSkills(dept),
          budgetEstimate: 600000,
          expectedROI: 120,
          hiringTimeline: [
            {
              phase: 'Needs Assessment',
              description: 'Define specific role requirements',
              estimatedDuration: '1 week',
              dependencies: ['Department head consultation']
            },
            {
              phase: 'Recruitment',
              description: 'Post job and source candidates',
              estimatedDuration: '3-4 weeks',
              dependencies: ['Needs assessment']
            },
            {
              phase: 'Selection & Hiring',
              description: 'Interview and hire suitable candidate',
              estimatedDuration: '2-3 weeks',
              dependencies: ['Recruitment completion']
            }
          ]
        });
      }
    }

    return predictions;
  } catch (error) {
    console.error('Error generating hiring predictions:', error);
    return [];
  }
}

// Get department-specific skills
function getDepartmentSkills(department: string): string[] {
  const skillMap: Record<string, string[]> = {
    'Admissions': ['Student counseling', 'Marketing', 'Communication skills', 'Data analysis'],
    'Finance': ['Accounting', 'Financial planning', 'ERP systems', 'Compliance'],
    'Student Affairs': ['Counseling', 'Event management', 'Conflict resolution', 'Student engagement'],
    'Technical': ['IT support', 'System administration', 'Software troubleshooting', 'Network management'],
    'Academic': ['Subject expertise', 'Teaching', 'Curriculum development', 'Assessment']
  };

  return skillMap[department] || ['General administration', 'Communication', 'Problem solving'];
}

// Analyze performance enhancement opportunities
export async function analyzePerformanceEnhancement(staffId: number): Promise<PerformanceEnhancement> {
  try {
    const staffMember = await db
      .select()
      .from(staff)
      .where(eq(staff.id, staffId))
      .limit(1);

    if (staffMember.length === 0) {
      throw new Error(`Staff member with ID ${staffId} not found`);
    }

    const staffData = staffMember[0];

    // Calculate current performance metrics (simulated)
    const currentPerformance = simulateCurrentPerformance(staffData);
    
    // Calculate potential performance
    const potentialPerformance = calculatePotentialPerformance(currentPerformance, staffData);
    
    // Generate training recommendations
    const trainingNeeds = generateTrainingRecommendations(currentPerformance, potentialPerformance, staffData);
    
    // Generate career path suggestions
    const careerPath = generateCareerPathSuggestions(staffData, currentPerformance);
    
    // Generate mentorship recommendations
    const mentorshipRecommendations = generateMentorshipRecommendations(staffData);
    
    // Calculate performance gap
    const performanceGap = calculatePerformanceGap(currentPerformance, potentialPerformance);

    return {
      staffId,
      currentPerformance,
      potentialPerformance,
      trainingNeeds,
      careerPath,
      mentorshipRecommendations,
      performanceGap
    };

  } catch (error) {
    console.error(`Error analyzing performance enhancement for staff ${staffId}:`, error);
    throw error;
  }
}

// Simulate current performance (would integrate with actual performance data)
function simulateCurrentPerformance(staffData: any): PerformanceMetrics {
  const experience = calculateExperience(staffData);
  const baseScore = 60 + (experience * 10);
  
  return {
    taskCompletionRate: Math.min(95, baseScore + Math.random() * 15),
    qualityScore: Math.min(95, baseScore + Math.random() * 10),
    studentSatisfaction: Math.min(95, baseScore + Math.random() * 20),
    teamCollaboration: Math.min(95, baseScore + Math.random() * 15),
    innovation: Math.min(95, 50 + (experience * 15) + Math.random() * 10),
    leadership: Math.min(95, 40 + (experience * 20) + Math.random() * 15)
  };
}

// Calculate potential performance
function calculatePotentialPerformance(current: PerformanceMetrics, staffData: any): PerformanceMetrics {
  const improvementFactor = 1.2; // 20% improvement potential
  
  return {
    taskCompletionRate: Math.min(95, current.taskCompletionRate * improvementFactor),
    qualityScore: Math.min(95, current.qualityScore * improvementFactor),
    studentSatisfaction: Math.min(95, current.studentSatisfaction * improvementFactor),
    teamCollaboration: Math.min(95, current.teamCollaboration * improvementFactor),
    innovation: Math.min(95, current.innovation * 1.3), // Higher potential for innovation
    leadership: Math.min(95, current.leadership * 1.25) // Higher potential for leadership
  };
}

// Generate training recommendations
function generateTrainingRecommendations(
  current: PerformanceMetrics,
  potential: PerformanceMetrics,
  staffData: any
): TrainingRecommendation[] {
  const recommendations: TrainingRecommendation[] = [];

  // Check each performance area
  if (potential.taskCompletionRate - current.taskCompletionRate > 10) {
    recommendations.push({
      trainingType: 'technical',
      skillGap: 'Task management and productivity',
      recommendedProgram: 'Advanced Project Management Certification',
      estimatedDuration: '6-8 weeks',
      cost: 25000,
      expectedImprovement: 20,
      priority: 'high'
    });
  }

  if (potential.leadership - current.leadership > 15) {
    recommendations.push({
      trainingType: 'leadership',
      skillGap: 'Leadership and team management',
      recommendedProgram: 'Leadership Development Program',
      estimatedDuration: '3 months',
      cost: 50000,
      expectedImprovement: 25,
      priority: 'high'
    });
  }

  if (potential.innovation - current.innovation > 12) {
    recommendations.push({
      trainingType: 'soft_skills',
      skillGap: 'Creative thinking and innovation',
      recommendedProgram: 'Design Thinking Workshop',
      estimatedDuration: '2 weeks',
      cost: 15000,
      expectedImprovement: 18,
      priority: 'medium'
    });
  }

  return recommendations;
}

// Generate career path suggestions
function generateCareerPathSuggestions(staffData: any, performance: PerformanceMetrics): CareerPathSuggestion[] {
  const experience = calculateExperience(staffData);
  const currentRole = staffData.role || 'Staff Member';
  const department = staffData.department || 'General';

  const suggestions: CareerPathSuggestion[] = [];

  // Based on performance and experience
  if (experience >= 2 && performance.leadership > 70) {
    suggestions.push({
      currentRole,
      suggestedNextRole: `Senior ${currentRole}`,
      timeframe: '6-12 months',
      skillsToAcquire: ['Advanced leadership', 'Strategic planning', 'Team management'],
      experienceNeeded: ['Lead major projects', 'Mentor junior staff', 'Cross-departmental collaboration'],
      certifications: ['Leadership Certification', 'Management Excellence'],
      mentorshipRequired: true
    });
  }

  if (experience >= 3 && performance.innovation > 75) {
    suggestions.push({
      currentRole,
      suggestedNextRole: `${department} Manager`,
      timeframe: '12-18 months',
      skillsToAcquire: ['Department management', 'Budget planning', 'Policy development'],
      experienceNeeded: ['Department operations', 'Staff supervision', 'Strategic initiatives'],
      certifications: ['Management Certification', 'Department-specific credentials'],
      mentorshipRequired: true
    });
  }

  return suggestions;
}

// Generate mentorship recommendations
function generateMentorshipRecommendations(staffData: any): string[] {
  const experience = calculateExperience(staffData);
  const department = staffData.department || 'General';

  const recommendations: string[] = [];

  if (experience <= 1) {
    recommendations.push('Pair with senior colleague for daily guidance');
    recommendations.push('Assign department head as primary mentor');
    recommendations.push('Participate in new employee mentorship program');
  } else if (experience <= 2) {
    recommendations.push('Cross-departmental mentorship for broader perspective');
    recommendations.push('Leadership mentorship from management team');
  } else {
    recommendations.push('External industry mentor for advanced development');
    recommendations.push('Reverse mentorship opportunity with junior staff');
  }

  return recommendations;
}

// Calculate performance gap
function calculatePerformanceGap(current: PerformanceMetrics, potential: PerformanceMetrics): number {
  const gaps = [
    potential.taskCompletionRate - current.taskCompletionRate,
    potential.qualityScore - current.qualityScore,
    potential.studentSatisfaction - current.studentSatisfaction,
    potential.teamCollaboration - current.teamCollaboration,
    potential.innovation - current.innovation,
    potential.leadership - current.leadership
  ];

  const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  return Math.max(0, Math.min(100, avgGap));
}

// Get top performers
async function getTopPerformers(allStaff: any[]): Promise<StaffPerformanceSummary[]> {
  const performances = await Promise.all(
    allStaff.map(async staff => {
      const performance = simulateCurrentPerformance(staff);
      const overallScore = Object.values(performance).reduce((sum, score) => sum + score, 0) / 6;
      
      return {
        staffId: staff.id,
        name: staff.name,
        department: staff.department || 'General',
        overallScore: Math.round(overallScore),
        strengths: getTopStrengths(performance),
        improvementAreas: getImprovementAreas(performance),
        nextCareerStep: getNextCareerStep(staff, performance)
      };
    })
  );

  return performances
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 5);
}

// Get top strengths
function getTopStrengths(performance: PerformanceMetrics): string[] {
  const metrics = Object.entries(performance);
  return metrics
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([key]) => formatMetricName(key));
}

// Get improvement areas
function getImprovementAreas(performance: PerformanceMetrics): string[] {
  const metrics = Object.entries(performance);
  return metrics
    .sort(([,a], [,b]) => a - b)
    .slice(0, 2)
    .filter(([,score]) => score < 80)
    .map(([key]) => formatMetricName(key));
}

// Format metric name
function formatMetricName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

// Get next career step
function getNextCareerStep(staff: any, performance: PerformanceMetrics): string {
  const experience = calculateExperience(staff);
  const avgPerformance = Object.values(performance).reduce((sum, score) => sum + score, 0) / 6;

  if (avgPerformance > 85 && experience >= 2) {
    return 'Ready for leadership role';
  } else if (avgPerformance > 75 && experience >= 1) {
    return 'Consider senior position';
  } else {
    return 'Focus on skill development';
  }
}

// Identify optimization opportunities
async function identifyOptimizationOpportunities(
  staffOptimizations: WorkloadOptimization[]
): Promise<OptimizationOpportunity[]> {
  const opportunities: OptimizationOpportunity[] = [];

  // Workload rebalancing opportunity
  const overloadedStaff = staffOptimizations.filter(opt => opt.burnoutRisk === 'high' || opt.burnoutRisk === 'critical');
  const underutilizedStaff = staffOptimizations.filter(opt => opt.efficiencyScore < 70);

  if (overloadedStaff.length > 0 && underutilizedStaff.length > 0) {
    opportunities.push({
      type: 'workload_rebalancing',
      description: `Redistribute workload from ${overloadedStaff.length} overloaded staff to ${underutilizedStaff.length} underutilized staff`,
      affectedStaff: [...overloadedStaff.map(s => s.staffId), ...underutilizedStaff.map(s => s.staffId)],
      potentialEfficiencyGain: 25,
      implementationCost: 50000,
      paybackPeriod: '2-3 months'
    });
  }

  // Skill development opportunity
  const lowPerformers = staffOptimizations.filter(opt => opt.efficiencyScore < 75);
  if (lowPerformers.length > 2) {
    opportunities.push({
      type: 'skill_development',
      description: `Implement training program for ${lowPerformers.length} staff members with efficiency scores below 75%`,
      affectedStaff: lowPerformers.map(s => s.staffId),
      potentialEfficiencyGain: 30,
      implementationCost: 100000,
      paybackPeriod: '6-9 months'
    });
  }

  return opportunities;
}

// Analyze workload distribution
async function analyzeWorkloadDistribution(): Promise<WorkloadDistributionAnalysis> {
  try {
    const allStaff = await db
      .select()
      .from(staff)
      .where(eq(staff.isActive, true));

    const departmentStats = new Map<string, { staff: any[], workloads: WorkloadMetrics[] }>();

    // Group staff by department and calculate workloads
    for (const staffMember of allStaff) {
      const dept = staffMember.department || 'General';
      if (!departmentStats.has(dept)) {
        departmentStats.set(dept, { staff: [], workloads: [] });
      }
      departmentStats.get(dept)!.staff.push(staffMember);
      
      const workload = await calculateWorkloadMetrics(staffMember.id);
      departmentStats.get(dept)!.workloads.push(workload);
    }

    // Calculate department metrics
    const departments: DepartmentWorkload[] = [];
    let totalOverloaded = 0;
    let totalUnderutilized = 0;

    for (const [deptName, data] of departmentStats) {
      const avgWorkload = data.workloads.reduce((sum, w) => sum + w.hoursPerWeek, 0) / data.workloads.length;
      const workloadVariance = calculateVariance(data.workloads.map(w => w.hoursPerWeek));
      const efficiencyScore = data.workloads.reduce((sum, w) => sum + (w.hoursPerWeek > 50 ? 60 : 80), 0) / data.workloads.length;

      departments.push({
        department: deptName,
        staffCount: data.staff.length,
        avgWorkload: Math.round(avgWorkload),
        workloadVariance: Math.round(workloadVariance),
        efficiencyScore: Math.round(efficiencyScore)
      });

      // Count overloaded and underutilized staff
      totalOverloaded += data.workloads.filter(w => w.hoursPerWeek > 45).length;
      totalUnderutilized += data.workloads.filter(w => w.hoursPerWeek < 35).length;
    }

    const optimalDistributionScore = Math.max(0, 100 - (totalOverloaded + totalUnderutilized) * 10);

    return {
      departments,
      overloadedStaff: totalOverloaded,
      underutilizedStaff: totalUnderutilized,
      optimalDistributionScore,
      rebalancingRecommendations: [
        'Redistribute high-workload tasks from overloaded departments',
        'Cross-train staff for better flexibility',
        'Implement task automation where possible',
        'Consider hiring in high-demand departments'
      ]
    };

  } catch (error) {
    console.error('Error analyzing workload distribution:', error);
    return {
      departments: [],
      overloadedStaff: 0,
      underutilizedStaff: 0,
      optimalDistributionScore: 70,
      rebalancingRecommendations: []
    };
  }
}

// Calculate variance
function calculateVariance(numbers: number[]): number {
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
}