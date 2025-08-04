import { Ollama } from 'ollama';

const ollama = new Ollama();


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

// Initialize Ollama with fallback handling
async function initializeOllama() {
  try {
    // Check if Ollama is running and pull required models
    const models = await ollama.list();
    
    // Pull llama3.2 if not available (lightweight but powerful model)
    const requiredModel = 'llama3.2:3b';
    const hasModel = models.models.some(model => model.name.includes('llama3.2'));
    
    if (!hasModel) {
      console.log('Pulling Ollama model llama3.2:3b...');
      await ollama.pull({ model: requiredModel });
      console.log('Model llama3.2:3b ready for use');
    }
    
    return requiredModel;
  } catch (error) {
    console.error('Ollama initialization failed:', error);
    throw new Error('Ollama service unavailable. Please ensure Ollama is running.');
  }
}

export async function predictAdmissionLikelihood(leadData: {
  status: string;
  source: string;
  daysSinceCreation: number;
  followUpCount: number;
  lastContactDays?: number;
  class: string;
  hasParentInfo: boolean;
  name: string;
  phone?: string;
  email?: string;
}): Promise<AdmissionPrediction> {
  try {
    const model = await initializeOllama();
    
    const prompt = `As an AI expert in educational admissions, analyze this lead data and predict admission likelihood:

Lead Information:
- Student Name: ${leadData.name}
- Class/Grade: ${leadData.class}
- Status: ${leadData.status}
- Lead Source: ${leadData.source}
- Days since inquiry: ${leadData.daysSinceCreation}
- Follow-up interactions: ${leadData.followUpCount}
- Last contact: ${leadData.lastContactDays || 'N/A'} days ago
- Parent info available: ${leadData.hasParentInfo ? 'Yes' : 'No'}
- Contact methods: ${leadData.phone ? 'Phone' : ''} ${leadData.email ? 'Email' : ''}

Please provide analysis in this exact JSON format:
{
  "likelihood": [number 0-100],
  "confidence": [number 0.0-1.0],
  "factors": ["factor1", "factor2", "factor3"],
  "recommendations": ["rec1", "rec2", "rec3"]
}

Consider factors like:
- Lead freshness and engagement level
- Quality of lead source
- Parent involvement and information completeness
- Response patterns and communication history
- Grade-specific admission patterns`;

    const response = await ollama.generate({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.3, // Lower temperature for more consistent results
        top_p: 0.9
      }
    });

    try {
      const analysis = JSON.parse(response.response);
      
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
      console.error('Failed to parse Ollama response:', parseError);
      // Fallback to rule-based system
      return fallbackAdmissionPrediction(leadData);
    }

  } catch (error) {
    console.error('Ollama prediction failed:', error);
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
    const model = await initializeOllama();
    const trendData = currentData.monthlyTrend.map(m => `${m.month}: ${m.enrollments}`).join(', ');
    const conversionRate = currentData.totalLeads > 0 ? (currentData.conversions / currentData.totalLeads * 100).toFixed(1) : '0';
    const prompt = `As an AI expert in educational enrollment forecasting, analyze this institutional data and reply with ONLY valid JSON (no explanation, no markdown, no extra text):\n\nCurrent Metrics:\n- Total Active Leads: ${currentData.totalLeads}\n- Hot Leads: ${currentData.hotLeads}\n- Recent Conversions: ${currentData.conversions}\n- Conversion Rate: ${conversionRate}%\n- Monthly Trend: ${trendData}\n- Current Season: ${currentData.currentSeason || 'Standard'}\n\nReply in this exact JSON format:\n{\n  "predictedEnrollments": [number],\n  "confidence": [number 0.0-1.0],\n  "trend": ["increasing" | "decreasing" | "stable"],\n  "factors": ["factor1", "factor2", "factor3", "factor4"]\n}`;
    const response = await ollama.generate({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.2,
        top_p: 0.8
      }
    });
    // Extract first JSON object from the response string
    const jsonMatch = response.response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in response');
    const forecast = JSON.parse(jsonMatch[0]);
    return {
      predictedEnrollments: Math.max(0, Math.floor(forecast.predictedEnrollments)),
      confidence: Math.max(0, Math.min(1, forecast.confidence)),
      trend: ['increasing', 'decreasing', 'stable'].includes(forecast.trend) ? forecast.trend : 'stable',
      factors: forecast.factors.slice(0, 5)
    };
  } catch (error) {
    console.error('Ollama forecasting failed:', error);
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
    const model = await initializeOllama();
    
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

    const response = await ollama.generate({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.4,
        top_p: 0.9
      }
    });

    try {
      const recommendations = JSON.parse(response.response);
      
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
    console.error('Ollama marketing failed:', error);
    return fallbackMarketingRecommendations(targetData);
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

export async function analyzeFeeOptimization(studentData: {
  studentId: number;
  totalFees: number;
  paidAmount: number;
  overdueAmount: number;
  parentIncome?: number;
  paymentHistory: Array<{ amount: number; date: string; method: string }>;
}): Promise<FeeOptimizationRecommendation> {
  try {
    await initializeOllama();
    
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

    const response = await ollama.generate({
      model: 'llama3.2',
      prompt,
      stream: false,
    });

    const analysis = JSON.parse(response.response);
    return {
      studentId: studentData.studentId,
      currentFeeStructure: `Total: ₹${studentData.totalFees}, Paid: ₹${studentData.paidAmount}`,
      ...analysis
    };
  } catch (error: any) {
    console.log('Ollama fee optimization failed:', error?.message || 'Unknown error');
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
    await initializeOllama();
    
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

    const response = await ollama.generate({
      model: 'llama3.2',
      prompt,
      stream: false,
    });

    const analysis = JSON.parse(response.response);
    return {
      staffId: staffData.staffId,
      ...analysis
    };
  } catch (error: any) {
    console.log('Ollama staff analysis failed:', error?.message || 'Unknown error');
    return fallbackStaffAnalysis(staffData);
  }
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