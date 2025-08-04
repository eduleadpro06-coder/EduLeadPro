// Local AI implementation - no external dependencies required

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

export async function predictAdmissionLikelihood(leadData: {
  status: string;
  source: string;
  daysSinceCreation: number;
  followUpCount: number;
  lastContactDays?: number;
  class: string;
  hasParentInfo: boolean;
}): Promise<AdmissionPrediction> {
  // Rule-based AI prediction system
  let likelihood = 50; // Base likelihood
  let confidence = 0.7;
  const factors: string[] = [];
  const recommendations: string[] = [];

  // Status impact
  if (leadData.status === "hot") {
    likelihood += 25;
    factors.push("High interest level");
  } else if (leadData.status === "warm") {
    likelihood += 10;
    factors.push("Moderate interest level");
  } else if (leadData.status === "cold") {
    likelihood -= 20;
    factors.push("Low engagement");
    recommendations.push("Re-engage with personalized communication");
  }

  // Source quality analysis
  if (leadData.source === "referral") {
    likelihood += 20;
    factors.push("High-quality referral source");
  } else if (leadData.source === "website") {
    likelihood += 10;
    factors.push("Direct website inquiry");
  } else if (leadData.source === "social_media") {
    likelihood += 5;
    factors.push("Social media engagement");
  }

  // Timing factors
  if (leadData.daysSinceCreation <= 3) {
    likelihood += 15;
    factors.push("Recent inquiry");
  } else if (leadData.daysSinceCreation > 14) {
    likelihood -= 10;
    factors.push("Older lead requiring attention");
    recommendations.push("Immediate follow-up required");
  }

  // Follow-up engagement
  if (leadData.followUpCount >= 3) {
    likelihood += 10;
    factors.push("Good follow-up engagement");
  } else if (leadData.followUpCount === 0) {
    likelihood -= 15;
    factors.push("No follow-up interactions");
    recommendations.push("Schedule initial follow-up call");
  }

  // Contact recency
  if (leadData.lastContactDays && leadData.lastContactDays <= 2) {
    likelihood += 10;
    factors.push("Recent contact");
  } else if (leadData.lastContactDays && leadData.lastContactDays > 7) {
    likelihood -= 10;
    factors.push("Stale contact");
    recommendations.push("Immediate re-engagement needed");
  }

  // Parent information
  if (leadData.hasParentInfo) {
    likelihood += 10;
    factors.push("Complete parent information available");
  } else {
    likelihood -= 5;
    factors.push("Missing parent information");
    recommendations.push("Collect complete parent details");
  }

  // Ensure reasonable bounds
  likelihood = Math.max(0, Math.min(100, likelihood));

  // Add default recommendations if none exist
  if (recommendations.length === 0) {
    recommendations.push("Continue regular follow-up schedule");
  }

  return {
    likelihood,
    confidence,
    factors,
    recommendations
  };
}

export async function forecastEnrollments(currentData: {
  totalLeads: number;
  hotLeads: number;
  conversions: number;
  monthlyTrend: Array<{ month: string; enrollments: number }>;
}): Promise<EnrollmentForecast> {
  // Rule-based enrollment forecasting
  let predictedEnrollments = 0;
  const confidence = 0.75;
  const factors: string[] = [];
  
  // Calculate conversion rate
  const conversionRate = currentData.totalLeads > 0 ? currentData.conversions / currentData.totalLeads : 0.1;
  
  // Base prediction from hot leads
  predictedEnrollments = Math.floor(currentData.hotLeads * conversionRate);
  factors.push(`${currentData.hotLeads} hot leads with ${(conversionRate * 100).toFixed(1)}% conversion rate`);
  
  // Analyze monthly trend
  const recentMonths = currentData.monthlyTrend.slice(-3);
  if (recentMonths.length >= 2) {
    const lastMonth = recentMonths[recentMonths.length - 1];
    const previousMonth = recentMonths[recentMonths.length - 2];
    
    if (lastMonth.enrollments > previousMonth.enrollments) {
      predictedEnrollments = Math.floor(predictedEnrollments * 1.2);
      factors.push("Positive enrollment trend detected");
    } else if (lastMonth.enrollments < previousMonth.enrollments) {
      predictedEnrollments = Math.floor(predictedEnrollments * 0.8);
      factors.push("Declining enrollment trend");
    } else {
      factors.push("Stable enrollment pattern");
    }
  }
  
  // Seasonal adjustments (assuming academic calendar)
  const currentMonth = new Date().getMonth();
  if ([2, 3, 4].includes(currentMonth)) { // March-May (admission season)
    predictedEnrollments = Math.floor(predictedEnrollments * 1.3);
    factors.push("Peak admission season boost");
  } else if ([10, 11].includes(currentMonth)) { // Nov-Dec (planning season)
    predictedEnrollments = Math.floor(predictedEnrollments * 1.1);
    factors.push("Planning season increase");
  }
  
  // Determine trend
  let trend: "increasing" | "decreasing" | "stable" = "stable";
  if (recentMonths.length >= 2) {
    const avgRecent = recentMonths.reduce((sum, month) => sum + month.enrollments, 0) / recentMonths.length;
    const avgPrevious = currentData.monthlyTrend.slice(-6, -3).reduce((sum, month) => sum + month.enrollments, 0) / 3;
    
    if (avgRecent > avgPrevious * 1.1) {
      trend = "increasing";
    } else if (avgRecent < avgPrevious * 0.9) {
      trend = "decreasing";
    }
  }
  
  return {
    predictedEnrollments: Math.max(0, predictedEnrollments),
    confidence,
    trend,
    factors
  };
}

export async function generateMarketingRecommendations(targetData: {
  targetClass: string;
  budget: number;
  currentLeadSources: string[];
  competitorAnalysis?: string;
}): Promise<MarketingRecommendation[]> {
  const recommendations: MarketingRecommendation[] = [];
  
  // Digital Marketing Recommendations
  if (targetData.budget >= 10000) {
    recommendations.push({
      campaign_type: "Google Ads",
      target_audience: `Parents seeking quality education for ${targetData.targetClass} students`,
      platform: "Google Search & YouTube",
      budget_suggestion: `₹${Math.floor(targetData.budget * 0.4).toLocaleString()} (40% of budget)`,
      ad_copy: `Secure your child's future with our comprehensive ${targetData.targetClass} program. Experienced faculty, proven results. Enroll now!`,
      expected_leads: Math.floor(targetData.budget * 0.4 / 200) // Assuming ₹200 per lead
    });
  }
  
  if (targetData.budget >= 5000) {
    recommendations.push({
      campaign_type: "Facebook & Instagram",
      target_audience: `Local parents with children of ${targetData.targetClass} age group`,
      platform: "Meta (Facebook & Instagram)",
      budget_suggestion: `₹${Math.floor(targetData.budget * 0.3).toLocaleString()} (30% of budget)`,
      ad_copy: `Join hundreds of successful students at our school. ${targetData.targetClass} admissions open. Schedule a campus visit today!`,
      expected_leads: Math.floor(targetData.budget * 0.3 / 150) // Assuming ₹150 per lead
    });
  }
  
  // Referral program
  recommendations.push({
    campaign_type: "Referral Program",
    target_audience: "Existing parents and satisfied families",
    platform: "WhatsApp & Direct Communication",
    budget_suggestion: `₹${Math.floor(targetData.budget * 0.15).toLocaleString()} (15% of budget)`,
    ad_copy: "Refer a friend and get exclusive benefits! Help other families discover quality education while earning rewards.",
    expected_leads: Math.floor(targetData.budget * 0.15 / 100) // Assuming ₹100 per referral lead
  });
  
  // Local community engagement
  if (!targetData.currentLeadSources || !targetData.currentLeadSources.includes("community_events")) {
    recommendations.push({
      campaign_type: "Community Events",
      target_audience: "Local community and neighborhood families",
      platform: "Local Events & Partnerships",
      budget_suggestion: `₹${Math.floor(targetData.budget * 0.15).toLocaleString()} (15% of budget)`,
      ad_copy: "Experience our teaching methodology firsthand. Join our weekend workshops and parent interaction sessions.",
      expected_leads: Math.floor(targetData.budget * 0.15 / 300) // Assuming ₹300 per event lead
    });
  }
  
  return recommendations;
}