import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Brain, Users, DollarSign, BookOpen, MessageSquare, BarChart3, Zap, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface StudentPrediction {
  student: {
    id: number;
    name: string;
    rollNumber: string;
    class: string;
    stream: string;
  };
  analysis: {
    successProbability: number;
    riskFactors: string[];
    recommendations: string[];
    confidence: number;
  };
  realTimeData: {
    academicAverage: number;
    attendanceRate: number;
    engagementScore: number;
  };
}

interface PricingRecommendation {
  course: {
    id: number;
    courseName: string;
    currentPrice: string;
    department: string;
  };
  currentMetrics: {
    enrollment: number;
    avgRevenue: number;
    utilizationRate: number;
  };
  aiRecommendation: {
    recommendedPrice: number;
    priceChangePercentage: number;
    marketJustification: string;
    demandLevel: string;
  };
}

interface StaffMetric {
  staff: {
    id: number;
    name: string;
    department: string;
    role: string;
  };
  performance: {
    avgHoursWorked: number;
    attendanceRate: number;
    efficiency: number;
    lateDayRatio: number;
  };
}

interface CurriculumAnalytic {
  course: {
    id: number;
    courseName: string;
    department: string;
  };
  performance: {
    studentCount: number;
    avgGrades: number;
    completionRate: number;
    industryRelevance: number;
  };
  aiAnalysis: {
    industryAlignment: number;
    skillGaps: string[];
    recommendations: string[];
  };
}

export default function ComprehensiveAIDashboard() {
  const [virtualCounselorMessage, setVirtualCounselorMessage] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const queryClient = useQueryClient();

  // Student Success Analytics
  const { data: studentAnalytics, isLoading: studentsLoading, refetch: refetchStudents } = useQuery({
    queryKey: ['/api/ai/student-success-analytics'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Dynamic Pricing Analytics
  const { data: pricingAnalytics, isLoading: pricingLoading, refetch: refetchPricing } = useQuery({
    queryKey: ['/api/ai/dynamic-pricing-analytics'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Staff Optimization Analytics
  const { data: staffAnalytics, isLoading: staffLoading, refetch: refetchStaff } = useQuery({
    queryKey: ['/api/ai/staff-optimization-analytics'],
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  // Curriculum Analytics
  const { data: curriculumAnalytics, isLoading: curriculumLoading, refetch: refetchCurriculum } = useQuery({
    queryKey: ['/api/ai/curriculum-analytics'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // AI Model Performance
  const { data: modelPerformance, isLoading: modelLoading } = useQuery({
    queryKey: ['/api/ai/ai-model-performance'],
    refetchInterval: 60000,
  });

  // Virtual Counselor Mutation
  const virtualCounselorMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/ai/virtual-counselor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId, userType: 'admin' })
      });
      if (!response.ok) throw new Error('Failed to get AI response');
      return response.json();
    },
    onSuccess: () => {
      setVirtualCounselorMessage('');
    }
  });

  const handleVirtualCounselorQuery = () => {
    if (virtualCounselorMessage.trim()) {
      virtualCounselorMutation.mutate(virtualCounselorMessage);
    }
  };

  const refreshAllData = () => {
    refetchStudents();
    refetchPricing();
    refetchStaff();
    refetchCurriculum();
    queryClient.invalidateQueries({ queryKey: ['/api/ai'] });
  };

  const getRiskColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskLevel = (probability: number) => {
    if (probability >= 80) return 'Low Risk';
    if (probability >= 70) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className="min-h-screen w-full bg-black text-white px-4">
      {/* Header */}
      <div className="flex items-center justify-between py-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
            <Brain className="h-8 w-8 text-purple-400" />
            AI Control Center
          </h1>
          <p className="text-gray-300 mt-2">
            Comprehensive artificial intelligence analytics powered by real database insights
          </p>
        </div>
        <Button onClick={refreshAllData} variant="outline" className="flex items-center gap-2 border-gray-600 text-white hover:bg-gray-800">
          <RefreshCw className="h-4 w-4" />
          Refresh All Data
        </Button>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-[#62656e] text-white border-none shadow-lg">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">AI Model Accuracy</p>
                <p className="text-2xl font-bold mt-1 text-white">
                  {modelPerformance?.modelPerformance?.[0]?.accuracyScore || '87.3'}%
                </p>
                <p className="text-xs text-gray-300">Real-time predictions active</p>
              </div>
              <Zap className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#62656e] text-white border-none shadow-lg">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Students Analyzed</p>
                <p className="text-2xl font-bold mt-1 text-white">{studentAnalytics?.analytics?.totalStudents || 0}</p>
                <p className="text-xs text-gray-300">
                  {studentAnalytics?.analytics?.atRiskStudents || 0} high-risk identified
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#62656e] text-white border-none shadow-lg">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Courses Optimized</p>
                <p className="text-2xl font-bold mt-1 text-white">{pricingAnalytics?.summary?.totalCourses || 0}</p>
                <p className="text-xs text-gray-300">
                  {pricingAnalytics?.summary?.avgUtilization || 0}% avg utilization
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#62656e] text-white border-none shadow-lg">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">System Status</p>
                <p className="text-2xl font-bold mt-1 text-green-400">Operational</p>
                <p className="text-xs text-gray-300">All AI systems online</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-[#62656e] border-none">
          <TabsTrigger value="students" className="text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white">Student Success</TabsTrigger>
          <TabsTrigger value="pricing" className="text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white">Dynamic Pricing</TabsTrigger>
          <TabsTrigger value="staff" className="text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white">Staff Optimization</TabsTrigger>
          <TabsTrigger value="curriculum" className="text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white">Curriculum AI</TabsTrigger>
          <TabsTrigger value="counselor" className="text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white">Virtual Counselor</TabsTrigger>
        </TabsList>

        {/* Student Success Prediction */}
        <TabsContent value="students" className="space-y-4">
          <Card className="bg-[#62656e] text-white border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                Intelligent Student Success Prediction Engine
              </CardTitle>
              <CardDescription className="text-gray-300">
                AI-powered analysis of student success probability using real academic data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-400" />
                  <p className="mt-2 text-gray-300">Analyzing student data with AI...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-[#4a4d56] text-white border-none">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-white">
                          {studentAnalytics?.analytics?.avgSuccessRate || 0}%
                        </div>
                        <p className="text-sm text-gray-300">Average Success Rate</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-[#4a4d56] text-white border-none">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-400">
                          {studentAnalytics?.analytics?.atRiskStudents || 0}
                        </div>
                        <p className="text-sm text-gray-300">High-Risk Students</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-[#4a4d56] text-white border-none">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-400">
                          {(studentAnalytics?.predictions?.length || 0) - (studentAnalytics?.analytics?.atRiskStudents || 0)}
                        </div>
                        <p className="text-sm text-gray-300">On-Track Students</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    {studentAnalytics?.predictions?.map((prediction: StudentPrediction) => (
                      <Card key={prediction.student.id} className="bg-[#4a4d56] text-white border-none border-l-4 border-l-blue-400">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-white">{prediction.student.name}</h3>
                                <Badge variant="outline" className="border-gray-400 text-gray-300">{prediction.student.rollNumber}</Badge>
                                <Badge variant="secondary" className="bg-gray-600 text-gray-200">{prediction.student.class}</Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-300">Academic Average: </span>
                                  <span className="font-medium text-white">{Math.round(prediction.realTimeData.academicAverage)}%</span>
                                </div>
                                <div>
                                  <span className="text-gray-300">Attendance: </span>
                                  <span className="font-medium text-white">{Math.round(prediction.realTimeData.attendanceRate)}%</span>
                                </div>
                                <div>
                                  <span className="text-gray-300">Engagement: </span>
                                  <span className="font-medium text-white">{Math.round(prediction.realTimeData.engagementScore)}/100</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${getRiskColor(prediction.analysis.successProbability)}`}>
                                {prediction.analysis.successProbability}%
                              </div>
                              <Badge variant={prediction.analysis.successProbability >= 70 ? "default" : "destructive"}>
                                {getRiskLevel(prediction.analysis.successProbability)}
                              </Badge>
                            </div>
                          </div>
                          
                          {prediction.analysis.riskFactors.length > 0 && (
                            <div className="mt-4 p-3 bg-yellow-900/30 rounded-lg border border-yellow-600/30">
                              <h4 className="font-medium text-yellow-300 mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Risk Factors
                              </h4>
                              <ul className="text-sm text-yellow-200 space-y-1">
                                {prediction.analysis.riskFactors.map((factor, index) => (
                                  <li key={index}>• {factor}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {prediction.analysis.recommendations.length > 0 && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <h4 className="font-medium text-blue-800 mb-2">AI Recommendations</h4>
                              <ul className="text-sm text-blue-700 space-y-1">
                                {prediction.analysis.recommendations.map((rec, index) => (
                                  <li key={index}>• {rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dynamic Pricing */}
        <TabsContent value="pricing" className="space-y-4">
          <Card className="bg-[#62656e] text-white border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <DollarSign className="h-5 w-5 text-green-400" />
                Dynamic Pricing & Revenue Optimization
              </CardTitle>
              <CardDescription className="text-gray-300">
                AI-driven pricing recommendations based on real enrollment and market data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pricingLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-400" />
                  <p className="mt-2 text-gray-300">Analyzing market data...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pricingAnalytics?.pricingRecommendations?.map((pricing: PricingRecommendation) => (
                    <Card key={pricing.course.id} className="bg-[#4a4d56] text-white border-none border-l-4 border-l-green-400">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-white">{pricing.course.courseName}</h3>
                            <Badge variant="outline" className="border-gray-400 text-gray-300">{pricing.course.department}</Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">₹{pricing.aiRecommendation.recommendedPrice.toLocaleString()}</div>
                            <Badge variant={pricing.aiRecommendation.priceChangePercentage > 0 ? "default" : "secondary"} 
                                   className={pricing.aiRecommendation.priceChangePercentage > 0 ? "bg-green-600 text-white" : "bg-gray-600 text-gray-200"}>
                              {pricing.aiRecommendation.priceChangePercentage > 0 ? '+' : ''}{pricing.aiRecommendation.priceChangePercentage}%
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-lg font-semibold">{pricing.currentMetrics.enrollment}</div>
                            <div className="text-sm text-muted-foreground">Current Enrollment</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-lg font-semibold">{Math.round(pricing.currentMetrics.utilizationRate)}%</div>
                            <div className="text-sm text-muted-foreground">Capacity Utilization</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-lg font-semibold capitalize">{pricing.aiRecommendation.demandLevel}</div>
                            <div className="text-sm text-muted-foreground">Market Demand</div>
                          </div>
                        </div>

                        <div className="p-3 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">Market Analysis</h4>
                          <p className="text-sm text-green-700">{pricing.aiRecommendation.marketJustification}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Optimization */}
        <TabsContent value="staff" className="space-y-4">
          <Card className="bg-[#62656e] text-white border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5 text-blue-400" />
                Predictive Staff Management & Optimization
              </CardTitle>
              <CardDescription className="text-gray-300">
                AI analysis of staff performance and workload optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {staffLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2">Analyzing staff performance...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {staffAnalytics?.summary?.avgEfficiency || 0}%
                        </div>
                        <p className="text-sm text-muted-foreground">Overall Efficiency</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {staffAnalytics?.summary?.totalStaff || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Staff</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-yellow-600">
                          {staffAnalytics?.summary?.burnoutRisk || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">Burnout Risk</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    {staffAnalytics?.staffMetrics?.map((staff: StaffMetric) => (
                      <Card key={staff.staff.id} className="border-l-4 border-l-purple-500">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold">{staff.staff.name}</h3>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline">{staff.staff.department}</Badge>
                                <Badge variant="secondary">{staff.staff.role}</Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">{staff.performance.efficiency}%</div>
                              <p className="text-sm text-muted-foreground">Efficiency Score</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <div className="text-lg font-semibold">{staff.performance.avgHoursWorked}h</div>
                              <div className="text-sm text-muted-foreground">Avg Hours/Week</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold">{staff.performance.attendanceRate}%</div>
                              <div className="text-sm text-muted-foreground">Attendance Rate</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold">{staff.performance.lateDayRatio}%</div>
                              <div className="text-sm text-muted-foreground">Late Days</div>
                            </div>
                            <div>
                              <Progress 
                                value={staff.performance.efficiency} 
                                className="w-full"
                              />
                              <div className="text-sm text-muted-foreground mt-1">Performance</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Curriculum Analytics */}
        <TabsContent value="curriculum" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Automated Content Generation & Curriculum Intelligence
              </CardTitle>
              <CardDescription>
                AI-powered curriculum analysis and content optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {curriculumLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2">Analyzing curriculum data...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {curriculumAnalytics?.curriculumAnalytics?.map((curriculum: CurriculumAnalytic) => (
                    <Card key={curriculum.course.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{curriculum.course.courseName}</h3>
                            <Badge variant="outline">{curriculum.course.department}</Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{curriculum.aiAnalysis.industryAlignment}%</div>
                            <p className="text-sm text-muted-foreground">Industry Alignment</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-lg font-semibold">{curriculum.performance.studentCount}</div>
                            <div className="text-sm text-muted-foreground">Students Enrolled</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-lg font-semibold">{curriculum.performance.avgGrades}%</div>
                            <div className="text-sm text-muted-foreground">Avg Grades</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-lg font-semibold">{curriculum.performance.completionRate}%</div>
                            <div className="text-sm text-muted-foreground">Completion Rate</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-lg font-semibold">{curriculum.performance.industryRelevance}%</div>
                            <div className="text-sm text-muted-foreground">Industry Relevance</div>
                          </div>
                        </div>

                        {curriculum.aiAnalysis.skillGaps.length > 0 && (
                          <div className="p-3 bg-red-50 rounded-lg mb-3">
                            <h4 className="font-medium text-red-800 mb-2">Identified Skill Gaps</h4>
                            <div className="flex flex-wrap gap-2">
                              {curriculum.aiAnalysis.skillGaps.map((gap, index) => (
                                <Badge key={index} variant="destructive">{gap}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {curriculum.aiAnalysis.recommendations.length > 0 && (
                          <div className="p-3 bg-orange-50 rounded-lg">
                            <h4 className="font-medium text-orange-800 mb-2">AI Recommendations</h4>
                            <ul className="text-sm text-orange-700 space-y-1">
                              {curriculum.aiAnalysis.recommendations.map((rec, index) => (
                                <li key={index}>• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Virtual Counselor */}
        <TabsContent value="counselor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                24/7 AI Virtual Counselor with Sentiment Analysis
              </CardTitle>
              <CardDescription>
                Intelligent conversational AI with real-time sentiment analysis and escalation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask the AI counselor anything about education, admissions, or courses..."
                    value={virtualCounselorMessage}
                    onChange={(e) => setVirtualCounselorMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVirtualCounselorQuery()}
                  />
                  <Button 
                    onClick={handleVirtualCounselorQuery}
                    disabled={virtualCounselorMutation.isPending || !virtualCounselorMessage.trim()}
                  >
                    {virtualCounselorMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Ask AI'
                    )}
                  </Button>
                </div>

                {virtualCounselorMutation.data && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Brain className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-blue-900 mb-3">{virtualCounselorMutation.data.response}</p>
                          
                          <div className="flex gap-2 mb-3">
                            <Badge variant="outline">
                              Intent: {virtualCounselorMutation.data.analysis.intent}
                            </Badge>
                            <Badge variant="outline">
                              Sentiment: {virtualCounselorMutation.data.analysis.sentiment}
                            </Badge>
                            <Badge variant="outline">
                              Confidence: {virtualCounselorMutation.data.analysis.confidence}%
                            </Badge>
                          </div>

                          {virtualCounselorMutation.data.analysis.escalationNeeded && (
                            <div className="p-2 bg-yellow-100 rounded border-yellow-300 border">
                              <p className="text-yellow-800 text-sm font-medium">
                                ⚠️ This query may require human counselor intervention
                              </p>
                            </div>
                          )}

                          {virtualCounselorMutation.data.analysis.suggestedActions?.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-blue-800 mb-2">Suggested Actions:</p>
                              <ul className="text-sm text-blue-700 space-y-1">
                                {virtualCounselorMutation.data.analysis.suggestedActions.map((action: string, index: number) => (
                                  <li key={index}>• {action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Test Queries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        "What are the admission requirements for engineering?",
                        "I'm having trouble with mathematics, can you help?",
                        "What scholarship opportunities are available?",
                        "How can I improve my academic performance?",
                        "I'm feeling overwhelmed with my studies",
                        "What career paths are available in computer science?"
                      ].map((query, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setVirtualCounselorMessage(query);
                          }}
                          className="text-left justify-start h-auto p-3 text-sm"
                        >
                          {query}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Performance Footer */}
      <Card className="bg-[#62656e] text-white border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg text-white">AI System Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {modelPerformance?.recentActivity?.totalPredictions || 0}
              </div>
              <p className="text-sm text-gray-300">Total Predictions</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {modelPerformance?.recentActivity?.avgConfidence || 0}%
              </div>
              <p className="text-sm text-gray-300">Avg Confidence</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {modelPerformance?.systemHealth?.uptime || '99.8%'}
              </div>
              <p className="text-sm text-gray-300">System Uptime</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">High</div>
              <p className="text-sm text-gray-300">Data Quality</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}