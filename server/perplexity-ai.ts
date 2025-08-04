// Perplexity AI integration for EduLeadPro
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const DEFAULT_MODEL = 'sonar-pro'; // Good balance of performance and capability
const REASONING_MODEL = 'sonar-reasoning-pro'; // Best for complex analytical tasks

export interface AdmissionPrediction {
  likelihood: number;
  confidence: number;
  factors: string[];
  recommendations: string[];
}

export interface EnrollmentForecast {
  predictedEnrollments: number;
  confidence: number;
  trend: "increasing" | "decreasing" | "stable";
  factors: string[];
}

export interface MarketingRecommendation {
  campaign_type: string;
  target_audience: string;
  platform: string;
  budget_suggestion: string;
  ad_copy: string;
  expected_leads: number;
}

export interface FeeOptimizationRecommendation {
  studentId: number;
  currentFeeStructure: string;
  recommendedAction: string;
  riskLevel: "low" | "medium" | "high";
  paymentPlan: string;
  emiAmount: number;
  confidence: number;
  reasons: string[];
}

export interface StaffPerformanceAnalysis {
  staffId: number;
  performanceScore: number;
  attendancePattern: string;
  salaryRecommendation: number;
  trainingNeeds: string[];
  promotionEligibility: boolean;
  insights: string[];
}

// Initialize Perplexity AI with error handling
async function callPerplexityAPI(prompt: string, model: string = DEFAULT_MODEL, temperature: number = 0.3): Promise<string> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key not found. Please set PERPLEXITY_API_KEY environment variable.');
  }

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Perplexity API call failed:', error);
    throw error;
  }
}

// Future: Import ML prediction when ready
// import { predictWithML } from './ml-prediction';

export async function predictAdmissionLikelihood(leadData: {
  status: string;
  source: string;
  daysSinceCreation: number;
  followUpCount: number;
  lastContactDays?: number;
  class: string;
  stream?: string;
  hasParentInfo: boolean;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  interestedProgram?: string;
  notes?: string;
  counselorAssigned: boolean;
  followUpOutcomes?: string[];
  seasonalFactor?: string;
  competitionLevel?: string;
}): Promise<AdmissionPrediction> {
  try {
    // Calculate seasonal factor
    const currentMonth = new Date().getMonth();
    const isAdmissionSeason = [2, 3, 4, 5].includes(currentMonth); // March-June
    const isPlanningPhase = [10, 11, 0, 1].includes(currentMonth); // Nov-Feb
    
    // Determine engagement quality
    const engagementScore = leadData.followUpCount > 0 ? 
      (leadData.followUpOutcomes?.filter(o => ['interested', 'needs_more_info'].includes(o)).length || 0) / leadData.followUpCount : 0;
    
    const prompt = `You are an expert educational admission consultant with 15+ years of experience analyzing student enrollment patterns. Analyze this lead comprehensively using data-driven insights.

LEAD PROFILE:
Student: ${leadData.name}
Grade: ${leadData.class}${leadData.stream ? ` (${leadData.stream})` : ''}
Current Status: ${leadData.status}
Lead Source: ${leadData.source}
Program Interest: ${leadData.interestedProgram || 'Not specified'}

ENGAGEMENT METRICS:
- Days since inquiry: ${leadData.daysSinceCreation}
- Follow-up interactions: ${leadData.followUpCount}
- Last contact: ${leadData.lastContactDays || 'Never contacted'} days ago
- Counselor assigned: ${leadData.counselorAssigned ? 'Yes' : 'No'}
- Follow-up outcomes: ${leadData.followUpOutcomes?.join(', ') || 'None recorded'}
- Engagement quality score: ${(engagementScore * 100).toFixed(1)}%

CONTACT & FAMILY DATA:
- Phone available: ${leadData.phone ? 'Yes' : 'No'}
- Email available: ${leadData.email ? 'Yes' : 'No'}
- Complete parent info: ${leadData.hasParentInfo ? 'Yes' : 'No'}
- Address provided: ${leadData.address ? 'Yes' : 'No'}
- Additional notes: ${leadData.notes || 'None'}

CONTEXTUAL FACTORS:
- Current season: ${isAdmissionSeason ? 'Peak admission season' : isPlanningPhase ? 'Planning phase' : 'Off-season'}
- Competition level: ${leadData.competitionLevel || 'Standard'}

ANALYSIS REQUIREMENTS:
1. Consider lead source quality (referral > website > social media > cold outreach)
2. Evaluate engagement timeline and response patterns
3. Assess information completeness and family involvement
4. Factor in seasonal admission trends
5. Account for grade-specific conversion patterns
6. Analyze follow-up outcome quality

Provide your analysis in this EXACT JSON format (no additional text):
{
  "likelihood": [integer 0-100],
  "confidence": [decimal 0.0-1.0],
  "factors": ["specific factor 1", "specific factor 2", "specific factor 3", "specific factor 4"],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"]
}`;

    const response = await callPerplexityAPI(prompt, REASONING_MODEL, 0.2); // Use reasoning model with low temperature for accuracy

    try {
      const analysis = JSON.parse(response);
      
      // Validate the response structure
      if (typeof analysis.likelihood !== 'number' || 
          typeof analysis.confidence !== 'number' ||
          !Array.isArray(analysis.factors) ||
          !Array.isArray(analysis.recommendations)) {
        throw new Error('Invalid response format');
      }

      return {
        likelihood: Math.max(0, Math.min(100, analysis.likelihood)),
        confidence: Math.max(0, Math.min(1, analysis.confidence)),
        factors: analysis.factors.slice(0, 5), // Limit to 5 factors
        recommendations: analysis.recommendations.slice(0, 4) // Limit to 4 recommendations
      };
    } catch (parseError) {
      console.error('Failed to parse Perplexity response:', parseError);
      // Fallback to rule-based system
      return fallbackAdmissionPrediction(leadData);
    }

  } catch (error) {
    console.error('Perplexity prediction failed:', error);
    return fallbackAdmissionPrediction(leadData);
  }
}

export async function forecastEnrollments(currentData: {
  totalLeads: number;
  hotLeads: number;
  conversions: number;
  monthlyTrend: Array<{ month: string; enrollments: number }>;
  currentSeason?: string;
}): Promise<EnrollmentForecast> {
  try {
    const trendData = currentData.monthlyTrend.map(m => `${m.month}: ${m.enrollments}`).join(', ');
    const conversionRate = currentData.totalLeads > 0 ? (currentData.conversions / currentData.totalLeads * 100).toFixed(1) : '0';
    
    const prompt = `As an AI expert in educational enrollment forecasting, analyze this institutional data and reply with ONLY valid JSON (no explanation, no markdown, no extra text):

Current Metrics:
- Total Active Leads: ${currentData.totalLeads}
- Hot Leads: ${currentData.hotLeads}
- Recent Conversions: ${currentData.conversions}
- Conversion Rate: ${conversionRate}%
- Monthly Trend: ${trendData}
- Current Season: ${currentData.currentSeason || 'Standard'}

Reply in this exact JSON format:
{
  "predictedEnrollments": [number],
  "confidence": [number 0.0-1.0],
  "trend": ["increasing" | "decreasing" | "stable"],
  "factors": ["factor1", "factor2", "factor3", "factor4"]
}`;

    const response = await callPerplexityAPI(prompt, DEFAULT_MODEL, 0.2);
    
    // Extract first JSON object from the response string
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in response');
    
    const forecast = JSON.parse(jsonMatch[0]);
    return {
      predictedEnrollments: Math.max(0, Math.floor(forecast.predictedEnrollments)),
      confidence: Math.max(0, Math.min(1, forecast.confidence)),
      trend: ['increasing', 'decreasing', 'stable'].includes(forecast.trend) ? forecast.trend : 'stable',
      factors: forecast.factors.slice(0, 5)
    };
  } catch (error) {
    console.error('Perplexity forecasting failed:', error);
    return fallbackEnrollmentForecast(currentData);
  }
}

export async function generateMarketingRecommendations(targetData: {
  targetClass: string;
  budget: number;
  currentLeadSources: string[];
  location?: string;
  competitorAnalysis?: string;
  ageGroup?: string;
}): Promise<MarketingRecommendation[]> {
  try {
    const prompt = `As an AI marketing expert for educational institutions, create marketing campaign recommendations:

Campaign Parameters:
- Target Grade/Class: ${targetData.targetClass}
- Marketing Budget: ₹${targetData.budget.toLocaleString()}
- Current Lead Sources: ${targetData.currentLeadSources.join(', ')}
- Location: ${targetData.location || 'Metro City'}
- Age Group: ${targetData.ageGroup || '14-18 years'}
- Competition: ${targetData.competitorAnalysis || 'Moderate local competition'}

Provide 3-4 campaign recommendations in this exact JSON format:
[
  {
    "campaign_type": "Campaign Name",
    "target_audience": "Specific audience description",
    "platform": "Platform/Channel",
    "budget_suggestion": "₹X,XXX (X% of budget)",
    "ad_copy": "Compelling ad copy under 100 words",
    "expected_leads": [number]
  }
]

Focus on:
- Digital marketing strategies (Google, Meta, YouTube)
- Local community engagement
- Referral programs
- Content marketing
- Parent-focused messaging
- Age-appropriate channels
- Cost-effective lead generation`;

    const response = await callPerplexityAPI(prompt, DEFAULT_MODEL, 0.4);

    try {
      const recommendations = JSON.parse(response);
      
      if (!Array.isArray(recommendations)) {
        throw new Error('Expected array of recommendations');
      }

      return recommendations.slice(0, 4).map(rec => ({
        campaign_type: rec.campaign_type || 'Digital Campaign',
        target_audience: rec.target_audience || 'Parents and students',
        platform: rec.platform || 'Digital Platforms',
        budget_suggestion: rec.budget_suggestion || `₹${Math.floor(targetData.budget * 0.25).toLocaleString()}`,
        ad_copy: rec.ad_copy || 'Quality education for your child\'s bright future.',
        expected_leads: Math.max(1, rec.expected_leads || Math.floor(targetData.budget / 200))
      }));
      
    } catch (parseError) {
      console.error('Failed to parse marketing response:', parseError);
      return fallbackMarketingRecommendations(targetData);
    }

  } catch (error) {
    console.error('Perplexity marketing failed:', error);
    return fallbackMarketingRecommendations(targetData);
  }
}

export async function analyzeFeeOptimization(studentData: {
  studentId: number;
  totalFees: number;
  paidAmount: number;
  overdueAmount: number;
  parentIncome?: number;
  paymentHistory: Array<{ amount: number; date: string; method: string }>;
}): Promise<FeeOptimizationRecommendation> {
  try {
    const prompt = `Analyze the following student fee data and provide optimization recommendations:
    
Student ID: ${studentData.studentId}
Total Amount: ₹${studentData.totalFees}
Paid Amount: ₹${studentData.paidAmount}
Overdue Amount: ₹${studentData.overdueAmount}
Parent Income: ₹${studentData.parentIncome || 'Unknown'}
Payment History: ${JSON.stringify(studentData.paymentHistory)}

Provide fee optimization recommendations in JSON format with:
- recommendedAction (string)
- riskLevel (low/medium/high)
- paymentPlan (string description)
- emiAmount (number)
- confidence (0-1)
- reasons (array of strings)`;

    const response = await callPerplexityAPI(prompt, DEFAULT_MODEL, 0.3);
    const analysis = JSON.parse(response);
    
    return {
      studentId: studentData.studentId,
      currentFeeStructure: `Total: ₹${studentData.totalFees}, Paid: ₹${studentData.paidAmount}`,
      ...analysis
    };
  } catch (error: any) {
    console.log('Perplexity fee optimization failed:', error?.message || 'Unknown error');
    return fallbackFeeOptimization(studentData);
  }
}

export async function analyzeStaffPerformance(staffData: {
  staffId: number;
  attendance: Array<{ date: string; status: string; hoursWorked: number }>;
  salary: number;
  role: string;
  joiningDate: string;
}): Promise<StaffPerformanceAnalysis> {
  try {
    const prompt = `Analyze the following staff performance data:
    
Staff ID: ${staffData.staffId}
Role: ${staffData.role}
Current Salary: ₹${staffData.salary}
Joining Date: ${staffData.joiningDate}
Attendance Data: ${JSON.stringify(staffData.attendance.slice(-30))}

Provide performance analysis in JSON format with:
- performanceScore (0-100)
- attendancePattern (string description)
- salaryRecommendation (number)
- trainingNeeds (array of strings)
- promotionEligibility (boolean)
- insights (array of strings)`;

    const response = await callPerplexityAPI(prompt, DEFAULT_MODEL, 0.3);
    const analysis = JSON.parse(response);
    
    return {
      staffId: staffData.staffId,
      ...analysis
    };
  } catch (error: any) {
    console.log('Perplexity staff analysis failed:', error?.message || 'Unknown error');
    return fallbackStaffAnalysis(staffData);
  }
}

// Fallback functions (simplified versions of the original rule-based system)
function fallbackAdmissionPrediction(leadData: any): AdmissionPrediction {
  let likelihood = 50;
  const factors = [];
  const recommendations = [];

  if (leadData.status === "hot") {
    likelihood += 25;
    factors.push("High interest level");
  } else if (leadData.status === "warm") {
    likelihood += 10;
    factors.push("Moderate interest level");
  }

  if (leadData.source === "referral") {
    likelihood += 20;
    factors.push("Quality referral source");
  }

  if (leadData.daysSinceCreation <= 3) {
    likelihood += 15;
    factors.push("Recent inquiry");
  }

  if (leadData.followUpCount === 0) {
    recommendations.push("Schedule initial follow-up");
  }

  return {
    likelihood: Math.max(0, Math.min(100, likelihood)),
    confidence: 0.7,
    factors: factors.length > 0 ? factors : ["Standard assessment"],
    recommendations: recommendations.length > 0 ? recommendations : ["Continue engagement"]
  };
}

function fallbackEnrollmentForecast(currentData: any): EnrollmentForecast {
  const conversionRate = currentData.totalLeads > 0 ? currentData.conversions / currentData.totalLeads : 0.1;
  const predicted = Math.floor(currentData.hotLeads * conversionRate);
  
  return {
    predictedEnrollments: predicted,
    confidence: 0.6,
    trend: "stable",
    factors: ["Based on current conversion patterns", "Historical performance data"]
  };
}

function fallbackMarketingRecommendations(targetData: any): MarketingRecommendation[] {
  return [
    {
      campaign_type: "Digital Marketing",
      target_audience: `Parents of ${targetData.targetClass} students`,
      platform: "Google Ads & Social Media",
      budget_suggestion: `₹${Math.floor(targetData.budget * 0.4).toLocaleString()} (40% of budget)`,
      ad_copy: `Secure your child's future with quality ${targetData.targetClass} education. Expert faculty, proven results.`,
      expected_leads: Math.floor(targetData.budget * 0.4 / 200)
    }
  ];
}

function fallbackFeeOptimization(studentData: any): FeeOptimizationRecommendation {
  const outstandingRatio = studentData.overdueAmount / studentData.totalFees;
  let riskLevel: "low" | "medium" | "high" = "low";
  let recommendedAction = "Continue current payment schedule";
  let emiAmount = 0;

  if (outstandingRatio > 0.5) {
    riskLevel = "high";
    recommendedAction = "Immediate payment plan required";
    emiAmount = Math.ceil(studentData.overdueAmount / 6);
  } else if (outstandingRatio > 0.2) {
    riskLevel = "medium";
    recommendedAction = "Consider EMI option";
    emiAmount = Math.ceil(studentData.overdueAmount / 3);
  }

  return {
    studentId: studentData.studentId,
    currentFeeStructure: `Total: ₹${studentData.totalFees}, Outstanding: ₹${studentData.overdueAmount}`,
    recommendedAction,
    riskLevel,
    paymentPlan: emiAmount > 0 ? `${emiAmount > 0 ? Math.ceil(studentData.overdueAmount / emiAmount) : 0} installments of ₹${emiAmount}` : "Current plan is suitable",
    emiAmount,
    confidence: 0.75,
    reasons: [
      `Outstanding ratio: ${(outstandingRatio * 100).toFixed(1)}%`,
      "Based on payment history analysis",
      "Risk assessment completed"
    ]
  };
}

function fallbackStaffAnalysis(staffData: any): StaffPerformanceAnalysis {
  const recentAttendance = staffData.attendance.slice(-30);
  const presentDays = recentAttendance.filter((a: any) => a.status === 'present').length;
  const attendanceRate = (presentDays / recentAttendance.length) * 100;
  
  let performanceScore = Math.min(100, attendanceRate + 10);
  let salaryRecommendation = staffData.salary;
  let promotionEligibility = false;

  if (attendanceRate > 90) {
    performanceScore = Math.min(100, performanceScore + 10);
    salaryRecommendation = staffData.salary * 1.1;
    promotionEligibility = true;
  }

  return {
    staffId: staffData.staffId,
    performanceScore: Math.round(performanceScore),
    attendancePattern: `${attendanceRate.toFixed(1)}% attendance rate`,
    salaryRecommendation: Math.round(salaryRecommendation),
    trainingNeeds: attendanceRate < 80 ? ["Time management", "Work commitment"] : ["Leadership development"],
    promotionEligibility,
    insights: [
      `Attendance: ${attendanceRate.toFixed(1)}%`,
      `Performance trending ${performanceScore > 80 ? 'upward' : 'needs improvement'}`,
      `${promotionEligibility ? 'Eligible' : 'Not eligible'} for promotion`
    ]
  };
}