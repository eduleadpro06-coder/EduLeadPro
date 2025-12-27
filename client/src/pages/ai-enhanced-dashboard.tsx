import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Brain,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  MessageSquare,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Zap,
  Lightbulb,
  Rocket,
  Shield,
  Star,
  ThumbsUp,
  Activity,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { Glow } from "@/components/ui/feature-steps";

// Enhanced AI Dashboard Component
export default function AIEnhancedDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch AI Insights Dashboard
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/ai/insights-dashboard"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch Bulk Lead Scores
  const { data: leadScores, isLoading: leadScoresLoading } = useQuery({
    queryKey: ["/api/ai/bulk-lead-scores", { limit: 20 }],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch Financial Analytics
  const { data: financialAnalytics, isLoading: financialLoading } = useQuery({
    queryKey: ["/api/ai/financial-analytics"],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Generate Communication Plan Mutation
  const generatePlanMutation = useMutation({
    mutationFn: async (leadId: number) => {
      const response = await fetch("/api/ai/communication-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      if (!response.ok) throw new Error("Failed to generate communication plan");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/bulk-lead-scores"] });
    },
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (dashboardLoading || leadScoresLoading) {
    return (
      <div className="min-h-screen bg-gray-50 relative overflow-hidden">
        <Glow />
        <Header className="py-4 relative z-10" />
        <main className="p-6 relative z-10">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-[#23243a] rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-64 bg-[#23243a] rounded-2xl"></div>
              <div className="h-64 bg-[#23243a] rounded-2xl"></div>
              <div className="h-64 bg-[#23243a] rounded-2xl"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <Glow />
      <Header className="py-4 relative z-10" />

      <main className="p-6 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
              <Brain className="text-purple-400" size={40} />
              AI-Enhanced Dashboard
            </h1>
            <p className="text-gray-300 text-lg">
              Advanced AI insights and automation for educational institution management
            </p>
          </motion.div>

          {/* Key Metrics Overview */}
          <motion.div variants={itemVariants}>
            <Card className="bg-[#1a1a2e]/90 border-purple-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="text-purple-400" size={24} />
                  AI System Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {dashboardData?.summary?.totalLeads || 0}
                    </div>
                    <div className="text-gray-300 text-sm">Total Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      {dashboardData?.summary?.highPriorityLeadsCount || 0}
                    </div>
                    <div className="text-gray-300 text-sm">High Priority</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      ₹{dashboardData?.summary?.monthlyRevenue?.toLocaleString() || 0}
                    </div>
                    <div className="text-gray-300 text-sm">Monthly Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-2">
                      {dashboardData?.summary?.activeStaff || 0}
                    </div>
                    <div className="text-gray-300 text-sm">Active Staff</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Features Tabs */}
          <motion.div variants={itemVariants}>
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-[#1a1a2e]/50">
                <TabsTrigger value="overview" className="text-white data-[state=active]:bg-purple-600">
                  <Target className="mr-2" size={16} />
                  Smart Leads
                </TabsTrigger>
                <TabsTrigger value="communication" className="text-white data-[state=active]:bg-purple-600">
                  <MessageSquare className="mr-2" size={16} />
                  AI Communication
                </TabsTrigger>
                <TabsTrigger value="financial" className="text-white data-[state=active]:bg-purple-600">
                  <DollarSign className="mr-2" size={16} />
                  Financial AI
                </TabsTrigger>
                <TabsTrigger value="staff" className="text-white data-[state=active]:bg-purple-600">
                  <Users className="mr-2" size={16} />
                  Staff Analytics
                </TabsTrigger>
              </TabsList>

              {/* Smart Lead Scoring Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* High Priority Leads */}
                  <Card className="bg-[#1a1a2e]/90 border-purple-500/30 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Zap className="text-yellow-400" size={20} />
                        High-Priority Leads
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {dashboardData?.highPriorityLeads?.map((lead: any) => (
                        <div key={lead.id} className="flex items-center justify-between p-4 bg-[#2a2a3e]/60 rounded-lg border border-purple-500/20">
                          <div className="space-y-1">
                            <div className="font-medium text-white">{lead.name}</div>
                            <div className="text-sm text-gray-300">{lead.nextAction}</div>
                          </div>
                          <div className="text-right space-y-1">
                            <Badge className={getUrgencyColor(lead.urgencyLevel)}>
                              {lead.urgencyLevel}
                            </Badge>
                            <div className={`text-lg font-bold ${getScoreColor(lead.score)}`}>
                              {lead.score}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Lead Score Distribution */}
                  <Card className="bg-[#1a1a2e]/90 border-purple-500/30 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <BarChart3 className="text-blue-400" size={20} />
                        Lead Score Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Average Score</span>
                          <span className="text-white font-bold">
                            {leadScores?.averageScore?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Total Leads Analyzed</span>
                          <span className="text-white font-bold">
                            {leadScores?.totalLeads || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">High Priority Count</span>
                          <span className="text-green-400 font-bold">
                            {leadScores?.highPriorityLeads || 0}
                          </span>
                        </div>
                        <Progress
                          value={(leadScores?.averageScore || 0)}
                          className="h-3 bg-gray-700"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Lead Scores */}
                <Card className="bg-[#1a1a2e]/90 border-purple-500/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Star className="text-yellow-400" size={20} />
                      AI-Powered Lead Scoring
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {leadScores?.leadScores?.slice(0, 10).map((lead: any) => (
                        <div key={lead.leadId} className="flex items-center justify-between p-4 bg-[#2a2a3e]/60 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all">
                          <div className="space-y-2">
                            <div className="font-medium text-white">{lead.leadName}</div>
                            <div className="text-sm text-gray-300">
                              Next: {lead.nextBestAction?.action}
                            </div>
                            <div className="flex gap-2">
                              {lead.topRecommendations?.map((rec: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs text-purple-300 border-purple-500/30">
                                  {rec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div className={`text-2xl font-bold ${getScoreColor(lead.score)}`}>
                              {lead.score}%
                            </div>
                            <Badge className={getUrgencyColor(lead.urgencyLevel)}>
                              {lead.urgencyLevel}
                            </Badge>
                            <div className="text-xs text-gray-400">
                              {(lead.conversionProbability * 100).toFixed(1)}% conversion
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI Communication Tab */}
              <TabsContent value="communication" className="space-y-6">
                <Card className="bg-[#1a1a2e]/90 border-purple-500/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Rocket className="text-green-400" size={20} />
                      Smart Communication Automation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-[#2a2a3e]/60 rounded-lg border border-green-500/20">
                        <Phone className="mx-auto mb-4 text-green-400" size={32} />
                        <h3 className="font-semibold text-white mb-2">Smart Calling</h3>
                        <p className="text-gray-300 text-sm">AI determines optimal call timing and scripts</p>
                      </div>
                      <div className="text-center p-6 bg-[#2a2a3e]/60 rounded-lg border border-blue-500/20">
                        <MessageSquare className="mx-auto mb-4 text-blue-400" size={32} />
                        <h3 className="font-semibold text-white mb-2">WhatsApp AI</h3>
                        <p className="text-gray-300 text-sm">Personalized messaging with perfect timing</p>
                      </div>
                      <div className="text-center p-6 bg-[#2a2a3e]/60 rounded-lg border border-purple-500/20">
                        <Mail className="mx-auto mb-4 text-purple-400" size={32} />
                        <h3 className="font-semibold text-white mb-2">Email Sequences</h3>
                        <p className="text-gray-300 text-sm">Automated nurturing campaigns</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white">Generate Communication Plan</h4>
                      <div className="flex gap-4">
                        <Select onValueChange={(value) => setSelectedLeadId(parseInt(value))}>
                          <SelectTrigger className="flex-1 bg-[#2a2a3e] border-purple-500/30 text-white">
                            <SelectValue placeholder="Select a lead for AI communication plan" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                            {leadScores?.leadScores?.slice(0, 10).map((lead: any) => (
                              <SelectItem key={lead.leadId} value={lead.leadId.toString()} className="text-white">
                                {lead.leadName} (Score: {lead.score}%)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => selectedLeadId && generatePlanMutation.mutate(selectedLeadId)}
                          disabled={!selectedLeadId || generatePlanMutation.isPending}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {generatePlanMutation.isPending ? "Generating..." : "Generate Plan"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Financial AI Tab */}
              <TabsContent value="financial" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-[#1a1a2e]/90 border-purple-500/30 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="text-green-400" size={20} />
                        Revenue Forecasting
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Next Month</span>
                        <span className="text-green-400 font-bold">
                          ₹{financialAnalytics?.revenueForecasting?.nextMonth?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Next Quarter</span>
                        <span className="text-blue-400 font-bold">
                          ₹{financialAnalytics?.revenueForecasting?.nextQuarter?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Year End</span>
                        <span className="text-purple-400 font-bold">
                          ₹{financialAnalytics?.revenueForecasting?.yearEnd?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div className="text-sm text-green-300">
                          <CheckCircle className="inline mr-2" size={16} />
                          {((financialAnalytics?.revenueForecasting?.confidence || 0) * 100).toFixed(0)}% Confidence Level
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1a1a2e]/90 border-purple-500/30 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Shield className="text-red-400" size={20} />
                        Payment Risk Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">High Risk Students</span>
                        <span className="text-red-400 font-bold">
                          {financialAnalytics?.paymentRiskAnalysis?.highRiskStudents?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Total Amount at Risk</span>
                        <span className="text-orange-400 font-bold">
                          ₹{financialAnalytics?.paymentRiskAnalysis?.totalAtRisk?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-white">Preventive Actions:</div>
                        {financialAnalytics?.paymentRiskAnalysis?.preventiveActions?.slice(0, 3).map((action: string, idx: number) => (
                          <div key={idx} className="text-xs text-gray-300 flex items-center gap-2">
                            <Lightbulb className="text-yellow-400" size={12} />
                            {action}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-[#1a1a2e]/90 border-purple-500/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <PieChart className="text-blue-400" size={20} />
                      Cash Flow Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium text-white">Optimal Schedule</h4>
                        <p className="text-gray-300 text-sm">
                          {financialAnalytics?.cashFlowOptimization?.optimalPaymentSchedule || "Analyzing payment patterns..."}
                        </p>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-medium text-white">Discount Recommendations</h4>
                        {financialAnalytics?.cashFlowOptimization?.discountRecommendations?.map((rec: any, idx: number) => (
                          <div key={idx} className="p-3 bg-[#2a2a3e]/60 rounded-lg border border-blue-500/20">
                            <div className="text-sm font-medium text-white">{rec.segment}</div>
                            <div className="text-xs text-blue-300">{rec.discountPercentage}% discount - {rec.expectedImpact}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Staff Analytics Tab */}
              <TabsContent value="staff" className="space-y-6">
                <Card className="bg-[#1a1a2e]/90 border-purple-500/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <ThumbsUp className="text-green-400" size={20} />
                      AI-Powered Staff Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 space-y-4">
                      <Brain className="mx-auto text-purple-400" size={48} />
                      <h3 className="text-xl font-semibold text-white">Staff Performance AI</h3>
                      <p className="text-gray-300 max-w-2xl mx-auto">
                        Our AI analyzes staff performance patterns, predicts productivity trends, and provides personalized recommendations for improvement and workload optimization.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="p-4 bg-[#2a2a3e]/60 rounded-lg border border-green-500/20">
                          <TrendingUp className="mx-auto mb-2 text-green-400" size={24} />
                          <div className="text-sm font-medium text-white">Performance Prediction</div>
                          <div className="text-xs text-gray-300">Future performance forecasting</div>
                        </div>
                        <div className="p-4 bg-[#2a2a3e]/60 rounded-lg border border-blue-500/20">
                          <Calendar className="mx-auto mb-2 text-blue-400" size={24} />
                          <div className="text-sm font-medium text-white">Workload Optimization</div>
                          <div className="text-xs text-gray-300">Smart task distribution</div>
                        </div>
                        <div className="p-4 bg-[#2a2a3e]/60 rounded-lg border border-purple-500/20">
                          <Lightbulb className="mx-auto mb-2 text-purple-400" size={24} />
                          <div className="text-sm font-medium text-white">Training Recommendations</div>
                          <div className="text-xs text-gray-300">Personalized skill development</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* AI Recommendations */}
          <motion.div variants={itemVariants}>
            <Card className="bg-[#1a1a2e]/90 border-purple-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lightbulb className="text-yellow-400" size={20} />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData?.recommendations?.map((recommendation: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-[#2a2a3e]/60 rounded-lg border border-yellow-500/20">
                      <Star className="text-yellow-400 flex-shrink-0" size={16} />
                      <span className="text-gray-300">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}