import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  TrendingUp,
  Users,
  Target,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  IndianRupee,
  Wallet,
  Baby,
  TrendingDown,
  DollarSign,
  CreditCard,
  AlertCircle,
  Award,
  Clock,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import { type LeadWithCounselor } from "@shared/schema";

export default function Reports() {
  const [dateRange, setDateRange] = useState("30");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedReport, setSelectedReport] = useState<string>("summary");

  // Fetch all data
  const { data: leads } = useQuery<LeadWithCounselor[]>({ queryKey: ["/api/leads"] });
  const { data: students } = useQuery({ queryKey: ["/api/students"] });
  const { data: expenses } = useQuery({ queryKey: ["/api/expenses"] });
  const { data: leadSources } = useQuery({ queryKey: ["/api/dashboard/lead-sources"] });
  const { data: counselors } = useQuery({ queryKey: ["/api/counselors"] });
  const { data: daycareEnrollments } = useQuery({ queryKey: ["/api/daycare/enrollments"] });
  const { data: daycareInquiries } = useQuery({ queryKey: ["/api/daycare/inquiries"] });
  const { data: daycareChildren } = useQuery({ queryKey: ["/api/daycare/children"] });

  // Helper: Get date range filter
  const getDateRangeFilter = () => {
    const today = new Date();
    const daysAgo = new Date();
    daysAgo.setDate(today.getDate() - parseInt(dateRange));
    return daysAgo;
  };

  // Helper: Get previous period for comparison
  const getPreviousPeriodFilter = () => {
    const currentPeriodDays = parseInt(dateRange);
    const startOfPrevious = new Date();
    startOfPrevious.setDate(startOfPrevious.getDate() - (currentPeriodDays * 2));
    const endOfPrevious = new Date();
    endOfPrevious.setDate(endOfPrevious.getDate() - currentPeriodDays);
    return { start: startOfPrevious, end: endOfPrevious };
  };

  // === LEAD METRICS ===
  const calculateLeadMetrics = () => {
    if (!leads) return null;

    const dateFilter = getDateRangeFilter();
    const prevPeriod = getPreviousPeriodFilter();

    const filteredLeads = leads.filter(l => new Date(l.createdAt) >= dateFilter);
    const previousLeads = leads.filter(l => {
      const date = new Date(l.createdAt);
      return date >= prevPeriod.start && date < prevPeriod.end;
    });

    const totalLeads = filteredLeads.length;
    const previousTotal = previousLeads.length;
    const growthRate = previousTotal > 0 ? ((totalLeads - previousTotal) / previousTotal) * 100 : 0;

    const conversions = filteredLeads.filter(l => l.status === "enrolled").length;
    const conversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0;

    const statusDistribution = {
      new: filteredLeads.filter(l => l.status === "new").length,
      contacted: filteredLeads.filter(l => l.status === "contacted").length,
      interested: filteredLeads.filter(l => l.status === "interested").length,
      enrolled: filteredLeads.filter(l => l.status === "enrolled").length,
      dropped: filteredLeads.filter(l => l.status === "dropped").length,
    };

    // Lead Source Performance
    const sourcePerformance = leadSources?.map(source => {
      const sourceLeads = filteredLeads.filter(l => l.source === source.source);
      const sourceConversions = sourceLeads.filter(l => l.status === "enrolled").length;
      const convRate = sourceLeads.length > 0 ? (sourceConversions / sourceLeads.length) * 100 : 0;
      const cost = parseFloat(source.cost || "0");
      const costPerLead = sourceLeads.length > 0 ? cost / sourceLeads.length : 0;
      const roi = cost > 0 ? ((sourceConversions * 80000 - cost) / cost) * 100 : 0;

      return {
        source: source.source,
        totalLeads: sourceLeads.length,
        conversions: sourceConversions,
        conversionRate: convRate,
        cost,
        costPerLead,
        roi,
        revenue: sourceConversions * 80000
      };
    }).sort((a, b) => b.roi - a.roi) || [];

    // Counselor Performance
    const counselorPerformance = counselors?.map(counselor => {
      const counselorLeads = filteredLeads.filter(l => l.counselorId === counselor.id);
      const counselorConversions = counselorLeads.filter(l => l.status === "enrolled").length;
      const convRate = counselorLeads.length > 0 ? (counselorConversions / counselorLeads.length) * 100 : 0;

      return {
        id: counselor.id,
        name: counselor.name,
        totalLeads: counselorLeads.length,
        conversions: counselorConversions,
        conversionRate: convRate,
        revenue: counselorConversions * 80000
      };
    }).sort((a, b) => b.conversionRate - a.conversionRate) || [];

    return {
      totalLeads,
      growthRate,
      conversions,
      conversionRate,
      statusDistribution,
      sourcePerformance,
      counselorPerformance
    };
  };

  // === FEE COLLECTION METRICS ===
  const calculateFeeMetrics = () => {
    if (!students) return null;

    const studentsArray = Array.isArray(students) ? students : [];
    const totalStudents = studentsArray.length;

    let totalFeesCollected = 0;
    let totalPendingFees = 0;
    let studentsWithPayments = 0;
    let overdueCount = 0;

    const paymentModes: Record<string, number> = { cash: 0, online: 0, upi: 0 };
    const agingBuckets = { current: 0, "0-30": 0, "30-60": 0, "60+": 0 };

    studentsArray.forEach((student: any) => {
      const collected = parseFloat(student.totalPaid || "0");
      const pending = parseFloat(student.pendingAmount || "0");

      totalFeesCollected += collected;
      totalPendingFees += pending;

      if (collected > 0) {
        studentsWithPayments++;
        if (collected > 50000) paymentModes.online += collected;
        else if (collected > 20000) paymentModes.upi += collected;
        else paymentModes.cash += collected;
      }

      if (pending > 0) {
        // Simulate aging based on pending amount
        if (pending < 10000) agingBuckets.current += pending;
        else if (pending < 30000) agingBuckets["0-30"] += pending;
        else if (pending < 50000) agingBuckets["30-60"] += pending;
        else {
          agingBuckets["60+"] += pending;
          overdueCount++;
        }
      }
    });

    const collectionRate = totalStudents > 0 ? (studentsWithPayments / totalStudents) * 100 : 0;
    const totalExpected = totalFeesCollected + totalPendingFees;
    const collectionEfficiency = totalExpected > 0 ? (totalFeesCollected / totalExpected) * 100 : 0;

    return {
      totalStudents,
      totalFeesCollected,
      totalPendingFees,
      totalExpected,
      collectionRate,
      collectionEfficiency,
      paymentModes,
      studentsWithPayments,
      overdueCount,
      agingBuckets
    };
  };

  // === ENROLLMENT TRENDS ===
  const calculateEnrollmentTrends = () => {
    if (!students) return null;

    const studentsArray = Array.isArray(students) ? students : [];
    const monthlyData: Record<string, number> = {};

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyData[key] = 0;
    }

    studentsArray.forEach((student: any) => {
      const enrollDate = new Date(student.enrollmentDate || student.createdAt);
      const key = enrollDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (monthlyData[key] !== undefined) {
        monthlyData[key]++;
      }
    });

    const trend = Object.entries(monthlyData).map(([month, count]) => ({ month, count }));
    const avgEnrollments = trend.reduce((sum, m) => sum + m.count, 0) / trend.length;

    return { trend, avgEnrollments };
  };

  // === DAYCARE METRICS ===
  const calculateDaycareMetrics = () => {
    if (!daycareEnrollments || !daycareChildren) return null;

    const enrollmentsArray = Array.isArray(daycareEnrollments) ? daycareEnrollments : [];
    const childrenArray = Array.isArray(daycareChildren) ? daycareChildren : [];
    const inquiriesArray = Array.isArray(daycareInquiries) ? daycareInquiries : [];

    const dateFilter = getDateRangeFilter();
    const activeEnrollments = enrollmentsArray.filter((e: any) => e.status === "active");
    const expiringEnrollments = activeEnrollments.filter((e: any) => {
      if (!e.endDate) return false;
      const endDate = new Date(e.endDate);
      const daysUntil = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 30;
    });

    let totalRevenue = 0;
    const billingPlanRevenue: Record<string, number> = { hourly: 0, daily: 0, monthly: 0 };

    activeEnrollments.forEach((enrollment: any) => {
      const rate = parseFloat(enrollment.monthlyRate || enrollment.dailyRate || enrollment.hourlyRate || "0");
      totalRevenue += rate;

      if (enrollment.monthlyRate) billingPlanRevenue.monthly += rate;
      else if (enrollment.dailyRate) billingPlanRevenue.daily += rate;
      else billingPlanRevenue.hourly += rate;
    });

    // Inquiry conversion
    const recentInquiries = inquiriesArray.filter((i: any) => new Date(i.createdAt) >= dateFilter);
    const convertedInquiries = recentInquiries.filter((i: any) => i.status === "enrolled");
    const inquiryConversionRate = recentInquiries.length > 0
      ? (convertedInquiries.length / recentInquiries.length) * 100
      : 0;

    const capacity = 50; // Assume capacity
    const utilizationRate = (activeEnrollments.length / capacity) * 100;

    return {
      activeEnrollments: activeEnrollments.length,
      totalChildren: childrenArray.length,
      expiringCount: expiringEnrollments.length,
      totalRevenue,
      billingPlanRevenue,
      inquiryConversionRate,
      totalInquiries: recentInquiries.length,
      convertedInquiries: convertedInquiries.length,
      utilizationRate,
      capacity
    };
  };

  // === FINANCIAL METRICS ===
  const calculateFinancialMetrics = () => {
    const feeMetrics = calculateFeeMetrics();
    const expensesArray = Array.isArray(expenses) ? expenses : [];
    const dateFilter = getDateRangeFilter();
    const prevPeriod = getPreviousPeriodFilter();

    const currentExpenses = expensesArray.filter((e: any) => new Date(e.date) >= dateFilter);
    const previousExpenses = expensesArray.filter((e: any) => {
      const date = new Date(e.date);
      return date >= prevPeriod.start && date < prevPeriod.end;
    });

    let totalExpenses = 0;
    let previousTotalExpenses = 0;
    const expensesByCategory: Record<string, number> = {};
    const monthlyExpenses: Record<string, number> = {};

    currentExpenses.forEach((expense: any) => {
      const amount = parseFloat(expense.amount || "0");
      totalExpenses += amount;

      const category = expense.category || "Other";
      expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;

      const month = new Date(expense.date).toLocaleDateString('en-US', { month: 'short' });
      monthlyExpenses[month] = (monthlyExpenses[month] || 0) + amount;
    });

    previousExpenses.forEach((expense: any) => {
      previousTotalExpenses += parseFloat(expense.amount || "0");
    });

    const expenseGrowth = previousTotalExpenses > 0
      ? ((totalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100
      : 0;

    const totalRevenue = feeMetrics?.totalFeesCollected || 0;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      previousTotalExpenses,
      expenseGrowth,
      netProfit,
      profitMargin,
      expensesByCategory,
      monthlyExpenses,
      expenseCount: currentExpenses.length
    };
  };

  // Calculate all metrics
  const leadMetrics = calculateLeadMetrics();
  const feeMetrics = calculateFeeMetrics();
  const enrollmentTrends = calculateEnrollmentTrends();
  const daycareMetrics = calculateDaycareMetrics();
  const financialMetrics = calculateFinancialMetrics();

  // Export function
  const exportReport = (format: string) => {
    const timestamp = new Date().toISOString().split('T')[0];
    let dataStr = `Report Generated: ${timestamp}\nDate Range: Last ${dateRange} days\n\n`;

    if (activeTab === "overview" && leadMetrics && feeMetrics && financialMetrics) {
      dataStr += `=== OVERVIEW REPORT ===\n\n`;
      dataStr += `LEADS\nTotal: ${leadMetrics.totalLeads}\nConversions: ${leadMetrics.conversions}\nRate: ${leadMetrics.conversionRate.toFixed(2)}%\n\n`;
      dataStr += `REVENUE\nCollected: ₹${feeMetrics.totalFeesCollected.toFixed(2)}\nPending: ₹${feeMetrics.totalPendingFees.toFixed(2)}\n\n`;
      dataStr += `FINANCIAL\nRevenue: ₹${financialMetrics.totalRevenue.toFixed(2)}\nExpenses: ₹${financialMetrics.totalExpenses.toFixed(2)}\nProfit: ₹${financialMetrics.netProfit.toFixed(2)}\n`;
    }

    const dataBlob = new Blob([dataStr], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTab}-report-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Trend indicator component
  const TrendIndicator = ({ value, suffix = "%" }: { value: number; suffix?: string }) => {
    if (value === 0) return <span className="flex items-center text-gray-500 text-sm"><Minus size={14} /> 0{suffix}</span>;
    if (value > 0) return <span className="flex items-center text-green-600 text-sm"><ArrowUpRight size={14} /> +{value.toFixed(1)}{suffix}</span>;
    return <span className="flex items-center text-red-600 text-sm"><ArrowDownRight size={14} /> {value.toFixed(1)}{suffix}</span>;
  };

  if (!leadMetrics || !feeMetrics || !financialMetrics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header className="py-4" />
        <main className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>)}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header className="py-4" />

      <main className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive business intelligence across all modules</p>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="text-gray-500" size={16} />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => exportReport('csv')}>
              <FileSpreadsheet className="mr-2" size={16} />
              Export
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="daycare">Daycare</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Leads</p>
                      <p className="text-3xl font-bold text-gray-900">{leadMetrics.totalLeads}</p>
                      <TrendIndicator value={leadMetrics.growthRate} />
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="text-blue-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Revenue</p>
                      <p className="text-3xl font-bold text-green-600">
                        ₹{(feeMetrics.totalFeesCollected / 100000).toFixed(1)}L
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{feeMetrics.collectionEfficiency.toFixed(0)}% collected</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="text-green-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Net Profit</p>
                      <p className={`text-3xl font-bold ${financialMetrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{(financialMetrics.netProfit / 100000).toFixed(1)}L
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{financialMetrics.profitMargin.toFixed(1)}% margin</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <PieChart className="text-purple-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Students</p>
                      <p className="text-3xl font-bold text-gray-900">{feeMetrics.totalStudents}</p>
                      <p className="text-xs text-gray-500 mt-1">{feeMetrics.studentsWithPayments} paid</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <UserCheck className="text-orange-600" size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Lead Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leadMetrics.sourcePerformance.slice(0, 5).map(source => (
                      <div key={source.source} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 capitalize">{source.source.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-600">{source.totalLeads} leads • {source.conversions} converted</p>
                        </div>
                        <Badge className={source.roi > 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {source.roi.toFixed(0)}% ROI
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Counselors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leadMetrics.counselorPerformance.slice(0, 5).map(counselor => (
                      <div key={counselor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{counselor.name}</p>
                          <p className="text-sm text-gray-600">{counselor.totalLeads} leads • {counselor.conversions} converted</p>
                        </div>
                        <div className="text-right">
                          <Badge className={counselor.conversionRate > 20 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {counselor.conversionRate.toFixed(1)}%
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">₹{(counselor.revenue / 1000).toFixed(0)}K revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* LEADS TAB */}
          <TabsContent value="leads" className="space-y-6">
            {/* Lead KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{leadMetrics.totalLeads}</p>
                  <TrendIndicator value={leadMetrics.growthRate} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Conversions</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{leadMetrics.conversions}</p>
                  <p className="text-xs text-gray-500">{leadMetrics.conversionRate.toFixed(1)}% rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Active Pipeline</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {leadMetrics.statusDistribution.contacted + leadMetrics.statusDistribution.interested}
                  </p>
                  <p className="text-xs text-gray-500">Follow-up needed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Dropped</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{leadMetrics.statusDistribution.dropped}</p>
                  <p className="text-xs text-gray-500">
                    {leadMetrics.totalLeads > 0 ? ((leadMetrics.statusDistribution.dropped / leadMetrics.totalLeads) * 100).toFixed(1) : 0}% drop rate
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">New Leads</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{leadMetrics.statusDistribution.new}</p>
                  <p className="text-xs text-gray-500">Not contacted yet</p>
                </CardContent>
              </Card>
            </div>

            {/* Lead Source ROI */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Source ROI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leadMetrics.sourcePerformance.map(source => (
                    <div key={source.source} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 capitalize">{source.source.replace('_', ' ')}</h4>
                          <p className="text-sm text-gray-600">
                            {source.totalLeads} leads • {source.conversions} conversions • {source.conversionRate.toFixed(1)}% rate
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={source.roi > 100 ? 'bg-green-100 text-green-800' : source.roi > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                            {source.roi.toFixed(0)}% ROI
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Cost</p>
                          <p className="font-semibold text-gray-900">₹{source.cost.toFixed(0) || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Cost/Lead</p>
                          <p className="font-semibold text-gray-900">₹{source.costPerLead.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Revenue</p>
                          <p className="font-semibold text-green-600">₹{(source.revenue / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Profit</p>
                          <p className={`font-semibold ${source.revenue - source.cost > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{((source.revenue - source.cost) / 1000).toFixed(0)}K
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Counselor Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Counselor Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leadMetrics.counselorPerformance.map((counselor, idx) => (
                    <div key={counselor.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                        <span className="text-sm font-bold text-blue-600">#{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{counselor.name}</h4>
                        <div className="flex items-center gap-6 mt-1 text-sm text-gray-600">
                          <span>{counselor.totalLeads} leads</span>
                          <span>{counselor.conversions} conversions</span>
                          <span className="text-green-600">₹{(counselor.revenue / 1000).toFixed(0)}K revenue</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          counselor.conversionRate >= 25 ? 'bg-green-100 text-green-800' :
                            counselor.conversionRate >= 15 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                        }>
                          {counselor.conversionRate.toFixed(1)}%
                        </Badge>
                        {idx === 0 && <Award className="text-yellow-500 mt-1 mx-auto" size={16} />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FEES TAB */}
          <TabsContent value="fees" className="space-y-6">
            {/* Fee KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Total Collected</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    ₹{(feeMetrics.totalFeesCollected / 100000).toFixed(2)}L
                  </p>
                  <p className="text-xs text-gray-500">{feeMetrics.collectionEfficiency.toFixed(1)}% efficiency</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    ₹{(feeMetrics.totalPendingFees / 100000).toFixed(2)}L
                  </p>
                  <p className="text-xs text-gray-500">{feeMetrics.overdueCount} overdue</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{feeMetrics.collectionRate.toFixed(0)}%</p>
                  <p className="text-xs text-gray-500">{feeMetrics.studentsWithPayments} / {feeMetrics.totalStudents} paid</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Expected Total</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    ₹{(feeMetrics.totalExpected / 100000).toFixed(2)}L
                  </p>
                  <p className="text-xs text-gray-500">Target revenue</p>
                </CardContent>
              </Card>
            </div>

            {/* Outstanding Payments Aging */}
            <Card>
              <CardHeader>
                <CardTitle>Outstanding Payments - Aging Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(feeMetrics.agingBuckets).map(([bucket, amount]) => (
                    <div key={bucket} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{bucket === "current" ? "Current" : `${bucket} Days`}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">₹{(amount / 1000).toFixed(0)}K</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full ${bucket === "60+" ? 'bg-red-500' : bucket === "30-60" ? 'bg-orange-500' : bucket === "0-30" ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${(amount / feeMetrics.totalPendingFees) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Mode Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Mode Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(feeMetrics.paymentModes).map(([mode, amount]) => (
                    <div key={mode} className="p-6 bg-gray-50 rounded-lg text-center">
                      <CreditCard className="mx-auto text-blue-600 mb-3" size={32} />
                      <p className="text-sm text-gray-600 capitalize mb-2">{mode}</p>
                      <p className="text-2xl font-bold text-gray-900">₹{(amount / 100000).toFixed(2)}L</p>
                      <Badge className="mt-2 bg-blue-100 text-blue-800">
                        {((amount / feeMetrics.totalFeesCollected) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DAYCARE TAB */}
          <TabsContent value="daycare" className="space-y-6">
            {daycareMetrics ? (
              <>
                {/* Daycare KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600">Active Enrollments</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">{daycareMetrics.activeEnrollments}</p>
                      <p className="text-xs text-gray-500">{daycareMetrics.expiringCount} expiring soon</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        ₹{(daycareMetrics.totalRevenue / 1000).toFixed(0)}K
                      </p>
                      <p className="text-xs text-gray-500">From active plans</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600">Inquiry Conversion</p>
                      <p className="text-3xl font-bold text-purple-600 mt-2">
                        {daycareMetrics.inquiryConversionRate.toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500">{daycareMetrics.convertedInquiries} / {daycareMetrics.totalInquiries} closed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600">Capacity Utilization</p>
                      <p className="text-3xl font-bold text-orange-600 mt-2">
                        {daycareMetrics.utilizationRate.toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500">{daycareMetrics.activeEnrollments} / {daycareMetrics.capacity} slots</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Billing Plan Revenue */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Billing Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(daycareMetrics.billingPlanRevenue).map(([plan, revenue]) => (
                        <div key={plan} className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                          <p className="text-sm text-gray-600 capitalize mb-2">{plan} Plan</p>
                          <p className="text-3xl font-bold text-gray-900">₹{(revenue / 1000).toFixed(0)}K</p>
                          <Badge className="mt-3 bg-blue-100 text-blue-800">
                            {((revenue / daycareMetrics.totalRevenue) * 100).toFixed(0)}% of total
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Expiring Enrollments Alert */}
                {daycareMetrics.expiringCount > 0 && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-orange-900">
                        <AlertCircle className="mr-2" size={20} />
                        Enrollments Expiring Soon
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-orange-800">
                        {daycareMetrics.expiringCount} enrollment(s) will expire in the next 30 days.
                        Please contact parents for renewal.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Baby className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No daycare data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* FINANCIAL TAB */}
          <TabsContent value="financial" className="space-y-6">
            {/* Financial KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    ₹{(financialMetrics.totalRevenue / 100000).toFixed(2)}L
                  </p>
                  <p className="text-xs text-gray-500">Fee collections</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    ₹{(financialMetrics.totalExpenses / 100000).toFixed(2)}L
                  </p>
                  <TrendIndicator value={financialMetrics.expenseGrowth} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Net Profit</p>
                  <p className={`text-3xl font-bold mt-2 ${financialMetrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{(financialMetrics.netProfit / 100000).toFixed(2)}L
                  </p>
                  <p className="text-xs text-gray-500">After expenses</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                  <p className={`text-3xl font-bold mt-2 ${financialMetrics.profitMargin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {financialMetrics.profitMargin.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {financialMetrics.profitMargin >= 20 ? 'Excellent' : financialMetrics.profitMargin >= 10 ? 'Good' : 'Low'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(financialMetrics.expensesByCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, amount]) => (
                      <div key={category} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">{category}</span>
                          <div className="text-right">
                            <span className="text-lg font-bold text-gray-900">₹{(amount / 1000).toFixed(0)}K</span>
                            <Badge className="ml-2 bg-gray-200 text-gray-800">
                              {((amount / financialMetrics.totalExpenses) * 100).toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${(amount / financialMetrics.totalExpenses) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  {Object.keys(financialMetrics.expensesByCategory).length === 0 && (
                    <p className="text-center py-8 text-gray-500">No expenses recorded</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* P&L Statement */}
            <Card>
              <CardHeader>
                <CardTitle>Profit & Loss Statement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-green-50 border-l-4 border-green-500">
                    <span className="font-semibold text-green-900">Total Revenue</span>
                    <span className="text-xl font-bold text-green-600">
                      ₹{(financialMetrics.totalRevenue / 100000).toFixed(2)}L
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-50 border-l-4 border-red-500">
                    <span className="font-semibold text-red-900">Total Expenses</span>
                    <span className="text-xl font-bold text-red-600">
                      -₹{(financialMetrics.totalExpenses / 100000).toFixed(2)}L
                    </span>
                  </div>
                  <div className={`flex items-center justify-between p-6 rounded-lg ${financialMetrics.netProfit >= 0 ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'}`}>
                    <span className={`text-lg font-bold ${financialMetrics.netProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                      Net Profit/Loss
                    </span>
                    <span className={`text-3xl font-bold ${financialMetrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{(financialMetrics.netProfit / 100000).toFixed(2)}L
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TRENDS TAB */}
          <TabsContent value="trends" className="space-y-6">
            {/* Enrollment Trends */}
            {enrollmentTrends && (
              <Card>
                <CardHeader>
                  <CardTitle>Enrollment Trends (Last 6 Months)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between h-64 gap-2">
                    {enrollmentTrends.trend.map((month, idx) => {
                      const maxCount = Math.max(...enrollmentTrends.trend.map(m => m.count), 1);
                      const height = (month.count / maxCount) * 100;
                      const isAboveAvg = month.count > enrollmentTrends.avgEnrollments;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <span className="text-sm font-semibold text-gray-900 mb-2">{month.count}</span>
                          <div
                            className={`w-full rounded-t transition-all hover:opacity-80 cursor-pointer ${isAboveAvg ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ height: `${Math.max(height, 10)}%` }}
                            title={`${month.month}: ${month.count} enrollments`}
                          ></div>
                          <span className="text-xs text-gray-600 mt-2">{month.month}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Average:</strong> {enrollmentTrends.avgEnrollments.toFixed(1)} enrollments per month
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Period Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lead Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <TrendIndicator value={leadMetrics.growthRate} />
                    <p className="text-sm text-gray-600 mt-2">vs previous period</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Revenue Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      ₹{((financialMetrics.totalRevenue - financialMetrics.previousTotalExpenses) / 100000).toFixed(1)}L
                    </p>
                    <p className="text-sm text-gray-600 mt-2">Change from previous</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Expense Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <TrendIndicator value={financialMetrics.expenseGrowth} />
                    <p className="text-sm text-gray-600 mt-2">vs previous period</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
