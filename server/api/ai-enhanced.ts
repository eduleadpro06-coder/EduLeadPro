import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db.js";
import { leads, staff, feePayments } from "../../shared/schema.js";
import { eq, desc, gte, sql } from "drizzle-orm";
import { 
  calculateAdvancedLeadScore, 
  generateSmartCommunicationPlan,
  generateFinancialAnalytics,
  analyzeStaffPerformance,
  type AdvancedLeadScore,
  type SmartCommunicationPlan,
  type FinancialAnalytics,
  type StaffPerformanceInsights
} from "../ai-enhanced.js";

const router = Router();

// Enhanced Lead Scoring Endpoint
router.get("/lead-score/:leadId", async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.leadId);
    
    // Fetch lead data with engagement history
    const leadData = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);
    
    if (leadData.length === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    const lead = leadData[0];
    
    // Calculate days since creation
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Calculate last contact days
    const lastContactDays = lead.lastContactedAt ? 
      Math.floor((Date.now() - new Date(lead.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24)) 
      : undefined;
    
    // Get follow-up count (simplified - would join with followUps table)
    const followUpCount = 0; // Placeholder - implement follow-up counting
    
    const enhancedLeadData = {
      id: lead.id,
      name: lead.name,
      email: lead.email || undefined,
      phone: lead.phone,
      class: lead.class,
      stream: lead.stream || undefined,
      status: lead.status,
      source: lead.source,
      daysSinceCreation,
      followUpCount,
      lastContactDays,
      hasParentInfo: !!(lead.parentName && lead.parentPhone),
      interestedProgram: lead.interestedProgram || undefined,
      admissionLikelihood: lead.admissionLikelihood ? parseFloat(lead.admissionLikelihood) : undefined
    };
    
    const leadScore = await calculateAdvancedLeadScore(enhancedLeadData);
    
    res.json(leadScore);
  } catch (error) {
    console.error("Error calculating lead score:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Smart Communication Plan Endpoint
router.post("/communication-plan", async (req: Request, res: Response) => {
  try {
    const { leadId } = req.body;
    
    if (!leadId) {
      return res.status(400).json({ error: "Lead ID is required" });
    }
    
    // Get lead data and score
    const leadData = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);
    
    if (leadData.length === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    const lead = leadData[0];
    
    // Calculate enhanced lead data for scoring
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const enhancedLeadData = {
      id: lead.id,
      name: lead.name,
      email: lead.email || undefined,
      phone: lead.phone,
      class: lead.class,
      stream: lead.stream || undefined,
      status: lead.status,
      source: lead.source,
      daysSinceCreation,
      followUpCount: 0, // Simplified
      hasParentInfo: !!(lead.parentName && lead.parentPhone),
      interestedProgram: lead.interestedProgram || undefined
    };
    
    const leadScore = await calculateAdvancedLeadScore(enhancedLeadData);
    const communicationPlan = await generateSmartCommunicationPlan(enhancedLeadData, leadScore);
    
    res.json({
      leadScore,
      communicationPlan
    });
  } catch (error) {
    console.error("Error generating communication plan:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Financial Analytics Endpoint
router.get("/financial-analytics", async (req: Request, res: Response) => {
  try {
    // Fetch historical payment data
    const historicalPayments = await db
      .select()
      .from(feePayments)
      .orderBy(desc(feePayments.paymentDate))
      .limit(1000); // Last 1000 payments for analysis
    
    const analytics = await generateFinancialAnalytics(historicalPayments);
    
    res.json(analytics);
  } catch (error) {
    console.error("Error generating financial analytics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Staff Performance Analysis Endpoint
router.get("/staff-performance/:staffId", async (req: Request, res: Response) => {
  try {
    const staffId = parseInt(req.params.staffId);
    
    // Fetch staff data
    const staffData = await db
      .select()
      .from(staff)
      .where(eq(staff.id, staffId))
      .limit(1);
    
    if (staffData.length === 0) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    
    // Get performance metrics (simplified - would get from actual performance tracking)
    const performanceMetrics = [
      // Placeholder data - would come from actual performance tracking
      { type: "lead_follow_up", timestamp: new Date().toISOString(), outcome: "interested", score: 85 },
      { type: "lead_follow_up", timestamp: new Date().toISOString(), outcome: "enrolled", score: 90 },
      { type: "lead_follow_up", timestamp: new Date().toISOString(), outcome: "not_interested", score: 70 }
    ];
    
    const staffPerformance = await analyzeStaffPerformance(staffData[0], performanceMetrics);
    
    res.json(staffPerformance);
  } catch (error) {
    console.error("Error analyzing staff performance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Bulk Lead Scoring Endpoint
router.get("/bulk-lead-scores", async (req: Request, res: Response) => {
  try {
    const { limit = 50, status, source } = req.query;
    
    let queryBuilder = db.select().from(leads);
    
    if (status && typeof status === 'string') {
      queryBuilder = queryBuilder.where(eq(leads.status, status));
    }
    
    if (source && typeof source === 'string') {
      queryBuilder = queryBuilder.where(eq(leads.source, source));
    }
    
    const leadsData = await queryBuilder
      .orderBy(desc(leads.createdAt))
      .limit(parseInt(limit as string));
    
    const leadScores = await Promise.all(
      leadsData.map(async (lead) => {
        const daysSinceCreation = Math.floor(
          (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const lastContactDays = lead.lastContactedAt ? 
          Math.floor((Date.now() - new Date(lead.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24)) 
          : undefined;
        
        const enhancedLeadData = {
          id: lead.id,
          name: lead.name,
          email: lead.email || undefined,
          phone: lead.phone,
          class: lead.class,
          stream: lead.stream || undefined,
          status: lead.status,
          source: lead.source,
          daysSinceCreation,
          followUpCount: 0, // Simplified
          lastContactDays,
          hasParentInfo: !!(lead.parentName && lead.parentPhone),
          interestedProgram: lead.interestedProgram || undefined,
          admissionLikelihood: lead.admissionLikelihood ? parseFloat(lead.admissionLikelihood) : undefined
        };
        
        const score = await calculateAdvancedLeadScore(enhancedLeadData);
        
        return {
          leadId: lead.id,
          leadName: lead.name,
          score: score.overallScore,
          urgencyLevel: score.urgencyLevel,
          conversionProbability: score.conversionProbability,
          nextBestAction: score.nextBestAction,
          topRecommendations: score.recommendedActions.slice(0, 2)
        };
      })
    );
    
    // Sort by score descending
    leadScores.sort((a, b) => b.score - a.score);
    
    res.json({
      totalLeads: leadScores.length,
      averageScore: leadScores.reduce((sum, l) => sum + l.score, 0) / leadScores.length,
      highPriorityLeads: leadScores.filter(l => l.urgencyLevel === "critical" || l.urgencyLevel === "high").length,
      leadScores
    });
  } catch (error) {
    console.error("Error calculating bulk lead scores:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// AI Insights Dashboard Endpoint
router.get("/insights-dashboard", async (req: Request, res: Response) => {
  try {
    // Get overall system insights
    const totalLeads = await db.select({ count: sql<number>`count(*)` }).from(leads);
    const activeStaff = await db.select({ count: sql<number>`count(*)` }).from(staff).where(eq(staff.isActive, true));
    
    // Get recent payment data for financial insights
    const recentPayments = await db
      .select()
      .from(feePayments)
      .where(gte(feePayments.paymentDate, sql`CURRENT_DATE - INTERVAL '30 days'`));
    
    const monthlyRevenue = recentPayments.reduce((sum, payment) => 
      sum + parseFloat(payment.amount), 0
    );
    
    // Get high-priority leads
    const criticalLeadsQuery = await db
      .select()
      .from(leads)
      .where(eq(leads.status, "interested"))
      .limit(10);
    
    const criticalLeadsWithScores = await Promise.all(
      criticalLeadsQuery.map(async (lead) => {
        const enhancedLeadData = {
          id: lead.id,
          name: lead.name,
          email: lead.email || undefined,
          phone: lead.phone,
          class: lead.class,
          stream: lead.stream || undefined,
          status: lead.status,
          source: lead.source,
          daysSinceCreation: Math.floor(
            (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          ),
          followUpCount: 0,
          hasParentInfo: !!(lead.parentName && lead.parentPhone),
          interestedProgram: lead.interestedProgram || undefined
        };
        
        const score = await calculateAdvancedLeadScore(enhancedLeadData);
        return { lead, score };
      })
    );
    
    const highPriorityLeads = criticalLeadsWithScores
      .filter(item => item.score.urgencyLevel === "critical" || item.score.urgencyLevel === "high")
      .sort((a, b) => b.score.overallScore - a.score.overallScore);
    
    res.json({
      summary: {
        totalLeads: totalLeads[0]?.count || 0,
        activeStaff: activeStaff[0]?.count || 0,
        monthlyRevenue,
        highPriorityLeadsCount: highPriorityLeads.length
      },
      highPriorityLeads: highPriorityLeads.slice(0, 5).map(item => ({
        id: item.lead.id,
        name: item.lead.name,
        score: item.score.overallScore,
        urgencyLevel: item.score.urgencyLevel,
        nextAction: item.score.nextBestAction.action
      })),
      recommendations: [
        "Focus on converting " + highPriorityLeads.length + " high-priority leads",
        "Review staff performance for optimization opportunities",
        "Implement automated follow-up sequences for warm leads",
        "Analyze revenue trends for better financial planning"
      ],
      trends: {
        leadQuality: "improving",
        conversionRate: "stable",
        staffPerformance: "improving",
        revenue: "increasing"
      }
    });
  } catch (error) {
    console.error("Error generating insights dashboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;