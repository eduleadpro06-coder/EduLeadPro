import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Calendar,
  BookOpen,
  GraduationCap,
  Calculator,
  HeadphonesIcon,
  UserCheck,
  Award,
  TrendingUpIcon,
  AlertCircle,
  Bot,
  Settings,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { Glow } from "@/components/ui/feature-steps";

// Comprehensive AI Dashboard Component
export default function ComprehensiveAIDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch comprehensive AI dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, refetch } = useQuery({
    queryKey: ["/api/ai-comprehensive/dashboard/comprehensive"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch AI system health
  const { data: systemHealth, isLoading: healthLoading } = useQuery({
    queryKey: ["/api/ai-comprehensive/health"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: ["/api/ai-comprehensive/health"] })
    ]);
    setRefreshing(false);
  };

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

  if (dashboardLoading || healthLoading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <Glow />
        <Header className="py-4 relative z-10" />
        <main className="p-6 relative z-10">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-[#23243a] rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="h-48 bg-[#23243a] rounded-2xl"></div>
              <div className="h-48 bg-[#23243a] rounded-2xl"></div>
              <div className="h-48 bg-[#23243a] rounded-2xl"></div>
              <div className="h-48 bg-[#23243a] rounded-2xl"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const summary = dashboardData?.summary || {};
  const studentSuccess = dashboardData?.studentSuccess || {};
  const revenueOptimization = dashboardData?.revenueOptimization || {};
  const staffManagement = dashboardData?.staffManagement || {};
  const aiInsights = dashboardData?.aiInsights || {};

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical": return "text-red-500 bg-red-100/20 border-red-500/30";
      case "high": return "text-orange-500 bg-orange-100/20 border-orange-500/30";
      case "medium": return "text-yellow-500 bg-yellow-100/20 border-yellow-500/30";
      default: return "text-green-500 bg-green-100/20 border-green-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <Glow />
      <Header className="py-4 relative z-10" />
      
      <main className="p-6 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Header with Refresh */}
          <motion.div variants={itemVariants} className="flex justify-between items-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
                <Bot className="text-purple-400" size={40} />
                Comprehensive AI Control Center
              </h1>
              <p className="text-gray-300 text-lg">
                Advanced AI-powered educational institution management platform
              </p>
            </div>
            <Button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
            >
              <RefreshCw className={`${refreshing ? 'animate-spin' : ''}`} size={16} />
              Refresh Data
            </Button>
          </motion.div>

          {/* System Health Bar */}
          <motion.div variants={itemVariants}>
            <Card className="bg-[#1a1a2e]/90 border-green-500/30 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-400" size={24} />
                    <span className="text-white font-semibold">AI Systems Status</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-green-400 font-bold">{systemHealth?.systemsOnline || 6}</div>
                      <div className="text-gray-300 text-xs">Systems Online</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-400 font-bold">{systemHealth?.avgAccuracy?.toFixed(0) || 85}%</div>
                      <div className="text-gray-300 text-xs">Avg Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-400 font-bold">{aiInsights?.totalPredictions || 0}</div>
                      <div className="text-gray-300 text-xs">Active Predictions</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Key Metrics Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Student Success Metrics */}
              <Card className="bg-[#1a1a2e]/90 border-blue-500/30 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2 text-sm">
                    <GraduationCap className="text-blue-400" size={20} />
                    Student Success
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-xs">Total Students</span>
                      <span className="text-white font-bold">{summary.totalStudents || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-xs">Critical Risk</span>
                      <span className="text-red-400 font-bold">{summary.criticalRiskStudents || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-xs">Success Rate</span>
                      <span className="text-green-400 font-bold">{summary.avgSuccessProbability || 0}%</span>
                    </div>
                    <Progress value={summary.avgSuccessProbability || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Optimization */}
              <Card className="bg-[#1a1a2e]/90 border-green-500/30 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2 text-sm">
                    <DollarSign className="text-green-400" size={20} />
                    Revenue AI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-xs">Optimization</span>
                      <span className="text-green-400 font-bold">₹{summary.revenueOptimizationOpportunity?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-xs">Scholarships</span>
                      <span className="text-blue-400 font-bold">{summary.scholarshipEligible || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-xs">Budget</span>
                      <span className="text-purple-400 font-bold">₹{(summary.totalScholarshipBudget || 0).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Staff Management */}
              <Card className="bg-[#1a1a2e]/90 border-orange-500/30 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2 text-sm">
                    <Users className="text-orange-400" size={20} />
                    Staff AI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-xs">Total Staff</span>
                      <span className="text-white font-bold">{staffManagement?.optimization?.totalStaff || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-xs">Burnout Alerts</span>
                      <span className="text-red-400 font-bold">{summary.staffBurnoutAlerts || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-xs">Efficiency</span>
                      <span className="text-green-400 font-bold">{staffManagement?.optimization?.avgEfficiencyScore || 0}%</span>
                    </div>
                    <Progress value={staffManagement?.optimization?.avgEfficiencyScore || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* AI Insights */}
              <Card className="bg-[#1a1a2e]/90 border-purple-500/30 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2 text-sm">
                    <Brain className="text-purple-400" size={20} />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-xs">Urgent Warnings</span>
                      <span className="text-red-400 font-bold">{summary.urgentWarnings || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-xs">Hiring Needs</span>
                      <span className="text-yellow-400 font-bold">{summary.immediateHiringNeeds || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-xs">Accuracy</span>
                      <span className="text-blue-400 font-bold">{systemHealth?.avgAccuracy?.toFixed(0) || 85}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-400 h-2 rounded-full" style={{ width: `${systemHealth?.avgAccuracy || 85}%` }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Detailed AI Modules */}
          <motion.div variants={itemVariants}>
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-[#1a1a2e]/50">
                <TabsTrigger value="overview" className="text-white data-[state=active]:bg-purple-600">
                  <Target className="mr-2" size={16} />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="students" className="text-white data-[state=active]:bg-blue-600">
                  <GraduationCap className="mr-2" size={16} />
                  Student Success
                </TabsTrigger>
                <TabsTrigger value="revenue" className="text-white data-[state=active]:bg-green-600">
                  <DollarSign className="mr-2" size={16} />
                  Revenue AI
                </TabsTrigger>
                <TabsTrigger value="staff" className="text-white data-[state=active]:bg-orange-600">
                  <Users className="mr-2" size={16} />
                  Staff Intelligence
                </TabsTrigger>
                <TabsTrigger value="virtual" className="text-white data-[state=active]:bg-indigo-600">
                  <HeadphonesIcon className="mr-2" size={16} />
                  Virtual Counselor
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* AI System Performance */}
                  <Card className="bg-[#1a1a2e]/90 border-purple-500/30 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Activity className="text-purple-400" size={20} />
                        AI System Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {systemHealth?.systems?.map((system: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-[#2a2a3e]/60 rounded-lg border border-purple-500/20">
                          <div className="space-y-1">
                            <div className="font-medium text-white">{system.system}</div>
                            <div className="text-sm text-gray-300">Accuracy: {system.accuracy}</div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-100/20 text-green-400 border-green-500/30">
                              {system.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Key Recommendations */}
                  <Card className="bg-[#1a1a2e]/90 border-yellow-500/30 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Lightbulb className="text-yellow-400" size={20} />
                        AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dashboardData?.recommendations?.slice(0, 6).map((rec: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-[#2a2a3e]/60 rounded-lg border border-yellow-500/20">
                          <Star className="text-yellow-400 flex-shrink-0 mt-0.5" size={14} />
                          <span className="text-gray-300 text-sm">{rec}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Efficiency Gains */}
                <Card className="bg-[#1a1a2e]/90 border-green-500/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUpIcon className="text-green-400" size={20} />
                      Expected Efficiency Gains
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-[#2a2a3e]/60 rounded-lg border border-green-500/20">
                        <div className="text-2xl font-bold text-green-400 mb-2">
                          {aiInsights?.efficiencyGains?.expectedTimeReduction || '40%'}
                        </div>
                        <div className="text-gray-300 text-sm">Time Reduction</div>
                      </div>
                      <div className="text-center p-4 bg-[#2a2a3e]/60 rounded-lg border border-blue-500/20">
                        <div className="text-2xl font-bold text-blue-400 mb-2">
                          {aiInsights?.efficiencyGains?.processAutomation || '60%'}
                        </div>
                        <div className="text-gray-300 text-sm">Process Automation</div>
                      </div>
                      <div className="text-center p-4 bg-[#2a2a3e]/60 rounded-lg border border-purple-500/20">
                        <div className="text-2xl font-bold text-purple-400 mb-2">
                          {aiInsights?.efficiencyGains?.decisionAccuracy || '+25%'}
                        </div>
                        <div className="text-gray-300 text-sm">Decision Accuracy</div>
                      </div>
                      <div className="text-center p-4 bg-[#2a2a3e]/60 rounded-lg border border-orange-500/20">
                        <div className="text-2xl font-bold text-orange-400 mb-2">
                          {aiInsights?.efficiencyGains?.studentRetention || '+15%'}
                        </div>
                        <div className="text-gray-300 text-sm">Student Retention</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Student Success Tab */}
              <TabsContent value="students" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* High-Risk Students */}
                  <Card className="bg-[#1a1a2e]/90 border-red-500/30 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <AlertTriangle className="text-red-400" size={20} />
                        Critical Risk Students
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {studentSuccess?.predictions?.filter((s: any) => s.riskLevel === 'critical' || s.riskLevel === 'high').slice(0, 5).map((student: any) => (
                        <div key={student.studentId} className="flex items-center justify-between p-4 bg-[#2a2a3e]/60 rounded-lg border border-red-500/20">
                          <div className="space-y-1">
                            <div className="font-medium text-white">Student #{student.studentId}</div>
                            <div className="text-sm text-gray-300">
                              Success Probability: {student.successProbability}%
                            </div>
                            <div className="text-xs text-gray-400">
                              Predicted: {student.predictedOutcome}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <Badge className={getRiskColor(student.riskLevel)}>
                              {student.riskLevel}
                            </Badge>
                            <div className="text-xs text-gray-400">
                              {student.recommendedInterventions?.[0]?.priority || 'immediate'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Risk Distribution */}
                  <Card className="bg-[#1a1a2e]/90 border-blue-500/30 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <PieChart className="text-blue-400" size={20} />
                        Risk Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {studentSuccess?.riskDistribution && Object.entries(studentSuccess.riskDistribution).map(([risk, count]: [string, any]) => (
                        <div key={risk} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              risk === 'critical' ? 'bg-red-500' :
                              risk === 'high' ? 'bg-orange-500' :
                              risk === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <span className="text-gray-300 capitalize">{risk} Risk</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-white font-bold">{count}</span>
                            <div className="w-20 bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  risk === 'critical' ? 'bg-red-500' :
                                  risk === 'high' ? 'bg-orange-500' :
                                  risk === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, (count / summary.totalStudents) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Early Warning Alerts */}
                <Card className="bg-[#1a1a2e]/90 border-orange-500/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertCircle className="text-orange-400" size={20} />
                      Early Warning Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {studentSuccess?.earlyWarnings?.map((alert: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-[#2a2a3e]/60 rounded-lg border border-orange-500/20 hover:border-orange-500/40 transition-all">
                          <div className="space-y-2">
                            <div className="font-medium text-white">Student #{alert.studentId}</div>
                            <div className="text-sm text-gray-300">{alert.message}</div>
                            <div className="flex gap-2">
                              <Badge variant="outline" className={`text-xs ${
                                alert.severity === 'critical' ? 'text-red-300 border-red-500/30' :
                                alert.severity === 'urgent' ? 'text-orange-300 border-orange-500/30' :
                                'text-yellow-300 border-yellow-500/30'
                              }`}>
                                {alert.alertType}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <Badge className={`${
                              alert.severity === 'critical' ? 'bg-red-100/20 text-red-400 border-red-500/30' :
                              alert.severity === 'urgent' ? 'bg-orange-100/20 text-orange-400 border-orange-500/30' :
                              'bg-yellow-100/20 text-yellow-400 border-yellow-500/30'
                            }`}>
                              {alert.severity}
                            </Badge>
                            {alert.actionRequired && (
                              <div className="text-xs text-gray-400">Action Required</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Revenue AI Tab */}
              <TabsContent value="revenue" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pricing Recommendations */}
                  <Card className="bg-[#1a1a2e]/90 border-green-500/30 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Calculator className="text-green-400" size={20} />
                        Dynamic Pricing Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {revenueOptimization?.pricingRecommendations?.map((pricing: any, idx: number) => (
                        <div key={idx} className="p-4 bg-[#2a2a3e]/60 rounded-lg border border-green-500/20">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-white">{pricing.courseName}</div>
                            <Badge className={`${
                              pricing.priceChangePercentage > 0 ? 'bg-green-100/20 text-green-400 border-green-500/30' :
                              'bg-red-100/20 text-red-400 border-red-500/30'
                            }`}>
                              {pricing.priceChangePercentage > 0 ? '+' : ''}{pricing.priceChangePercentage.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-300 mb-2">
                            ₹{pricing.currentPrice.toLocaleString()} → ₹{pricing.recommendedPrice.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            Demand: {pricing.demandLevel} | Impact: ₹{pricing.estimatedRevenueImpact.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Scholarship Recommendations */}
                  <Card className="bg-[#1a1a2e]/90 border-blue-500/30 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Award className="text-blue-400" size={20} />
                        AI Scholarship Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {revenueOptimization?.scholarshipRecommendations?.map((scholarship: any, idx: number) => (
                        <div key={idx} className="p-4 bg-[#2a2a3e]/60 rounded-lg border border-blue-500/20">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-white">{scholarship.studentName}</div>
                            <Badge className="bg-blue-100/20 text-blue-400 border-blue-500/30">
                              {scholarship.eligibilityScore}/100
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-300 mb-2">
                            {scholarship.recommendedScholarshipType} | {scholarship.recommendedPercentage}% off
                          </div>
                          <div className="text-xs text-gray-400">
                            Amount: ₹{scholarship.recommendedAmount.toLocaleString()} | Priority: {scholarship.priority}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Revenue Impact Summary */}
                <Card className="bg-[#1a1a2e]/90 border-purple-500/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="text-purple-400" size={20} />
                      Revenue Optimization Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-[#2a2a3e]/60 rounded-lg border border-green-500/20">
                        <TrendingUp className="mx-auto mb-4 text-green-400" size={32} />
                        <h3 className="font-semibold text-white mb-2">Total Revenue Impact</h3>
                        <p className="text-2xl font-bold text-green-400">
                          ₹{revenueOptimization?.totalRevenueImpact?.toLocaleString() || 0}
                        </p>
                        <p className="text-gray-300 text-sm">Potential increase</p>
                      </div>
                      <div className="text-center p-6 bg-[#2a2a3e]/60 rounded-lg border border-blue-500/20">
                        <Award className="mx-auto mb-4 text-blue-400" size={32} />
                        <h3 className="font-semibold text-white mb-2">Scholarship Budget</h3>
                        <p className="text-2xl font-bold text-blue-400">
                          ₹{summary.totalScholarshipBudget?.toLocaleString() || 0}
                        </p>
                        <p className="text-gray-300 text-sm">Recommended allocation</p>
                      </div>
                      <div className="text-center p-6 bg-[#2a2a3e]/60 rounded-lg border border-orange-500/20">
                        <Calculator className="mx-auto mb-4 text-orange-400" size={32} />
                        <h3 className="font-semibold text-white mb-2">High Impact Changes</h3>
                        <p className="text-2xl font-bold text-orange-400">
                          {revenueOptimization?.highImpactChanges || 0}
                        </p>
                        <p className="text-gray-300 text-sm">Courses affected</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Staff Intelligence Tab */}
              <TabsContent value="staff" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Staff Optimization Summary */}
                  <Card className="bg-[#1a1a2e]/90 border-orange-500/30 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <UserCheck className="text-orange-400" size={20} />
                        Staff Optimization Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-[#2a2a3e]/60 rounded-lg border border-orange-500/20">
                          <div className="text-2xl font-bold text-white mb-1">
                            {staffManagement?.optimization?.totalStaff || 0}
                          </div>
                          <div className="text-gray-300 text-xs">Total Staff</div>
                        </div>
                        <div className="text-center p-4 bg-[#2a2a3e]/60 rounded-lg border border-green-500/20">
                          <div className="text-2xl font-bold text-green-400 mb-1">
                            {staffManagement?.optimization?.avgEfficiencyScore || 0}%
                          </div>
                          <div className="text-gray-300 text-xs">Avg Efficiency</div>
                        </div>
                        <div className="text-center p-4 bg-[#2a2a3e]/60 rounded-lg border border-red-500/20">
                          <div className="text-2xl font-bold text-red-400 mb-1">
                            {staffManagement?.optimization?.burnoutAlerts || 0}
                          </div>
                          <div className="text-gray-300 text-xs">Burnout Alerts</div>
                        </div>
                        <div className="text-center p-4 bg-[#2a2a3e]/60 rounded-lg border border-yellow-500/20">
                          <div className="text-2xl font-bold text-yellow-400 mb-1">
                            {staffManagement?.hiringPredictions?.length || 0}
                          </div>
                          <div className="text-gray-300 text-xs">Hiring Needs</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Improvement Opportunities */}
                  <Card className="bg-[#1a1a2e]/90 border-blue-500/30 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Lightbulb className="text-blue-400" size={20} />
                        Optimization Opportunities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {staffManagement?.topOpportunities?.map((opportunity: any, idx: number) => (
                        <div key={idx} className="p-4 bg-[#2a2a3e]/60 rounded-lg border border-blue-500/20">
                          <div className="font-medium text-white mb-2">{opportunity.description}</div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-300">
                              Efficiency Gain: +{opportunity.potentialEfficiencyGain}%
                            </div>
                            <Badge variant="outline" className="text-blue-300 border-blue-500/30">
                              {opportunity.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            Payback: {opportunity.paybackPeriod}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Hiring Predictions */}
                <Card className="bg-[#1a1a2e]/90 border-purple-500/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <UserCheck className="text-purple-400" size={20} />
                      AI Hiring Predictions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {staffManagement?.hiringPredictions?.map((prediction: any, idx: number) => (
                        <div key={idx} className="p-4 bg-[#2a2a3e]/60 rounded-lg border border-purple-500/20">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-medium text-white">{prediction.department} Department</div>
                              <div className="text-sm text-gray-300">
                                Recommended Hires: {prediction.recommendedHires}
                              </div>
                            </div>
                            <Badge className={`${
                              prediction.urgency === 'immediate' ? 'bg-red-100/20 text-red-400 border-red-500/30' :
                              prediction.urgency === 'within_month' ? 'bg-orange-100/20 text-orange-400 border-orange-500/30' :
                              'bg-yellow-100/20 text-yellow-400 border-yellow-500/30'
                            }`}>
                              {prediction.urgency}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-300 mb-2">
                            Budget: ₹{prediction.budgetEstimate.toLocaleString()} | ROI: {prediction.expectedROI}%
                          </div>
                          <div className="text-xs text-gray-400">
                            Skills: {prediction.skillsRequired.slice(0, 3).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Virtual Counselor Tab */}
              <TabsContent value="virtual" className="space-y-6">
                <Card className="bg-[#1a1a2e]/90 border-indigo-500/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <HeadphonesIcon className="text-indigo-400" size={20} />
                      AI Virtual Counselor System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 space-y-4">
                      <Bot className="mx-auto text-indigo-400" size={64} />
                      <h3 className="text-2xl font-semibold text-white">24/7 AI-Powered Support</h3>
                      <p className="text-gray-300 max-w-2xl mx-auto">
                        Our intelligent virtual counselor provides instant support to students and parents, 
                        handling inquiries about admissions, fees, courses, and technical issues with 90% accuracy.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <div className="p-6 bg-[#2a2a3e]/60 rounded-lg border border-indigo-500/20">
                          <MessageSquare className="mx-auto mb-4 text-indigo-400" size={32} />
                          <div className="text-lg font-medium text-white mb-2">Instant Responses</div>
                          <div className="text-sm text-gray-300">Average response time: 2.3 seconds</div>
                        </div>
                        <div className="p-6 bg-[#2a2a3e]/60 rounded-lg border border-green-500/20">
                          <CheckCircle className="mx-auto mb-4 text-green-400" size={32} />
                          <div className="text-lg font-medium text-white mb-2">Smart Escalation</div>
                          <div className="text-sm text-gray-300">Intelligently routes complex queries</div>
                        </div>
                        <div className="p-6 bg-[#2a2a3e]/60 rounded-lg border border-blue-500/20">
                          <Brain className="mx-auto mb-4 text-blue-400" size={32} />
                          <div className="text-lg font-medium text-white mb-2">Sentiment Analysis</div>
                          <div className="text-sm text-gray-300">Monitors satisfaction in real-time</div>
                        </div>
                      </div>
                      <div className="mt-8">
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                          Test Virtual Counselor
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}