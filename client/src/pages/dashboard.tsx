import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import DonutChart from "@/components/dashboard/DonutChart";
import KPICard from "@/components/dashboard/KPICard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { TrendingUp, Users, IndianRupee, BarChart2, AlertCircle, Clock, Wallet, CreditCard, Banknote } from "lucide-react";
import { AreaChart as RCAreaChart, BarChart as RCBarChart, PieChart as RCPieChart, LineChart as RCLineChart, Area, Bar, Pie, Line, Cell, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import Header from "@/components/layout/header";
import { useQuery } from "@tanstack/react-query";
import { Notification } from "@shared/schema";

interface DashboardAnalytics {
  kpis: {
    leadManagement: { value: number; change: string };
    studentFee: { value: number; change: string };
    staffManagement: { value: number; change: string };
    payroll: { value: number; change: string };
    expenses: { value: number; change: string };
    totalReceivables: { value: number; change: string };
    avgOrderValue: { value: number; change: string };
    conversionRate: { value: number; change: string };
    daycareRevenue: { value: number; change: string };
  };
  leadAnalytics: {
    sourceDistribution: Array<{ label: string; value: number }>;
    monthlyTrends: Array<{ month: string; leads: number; conversions: number }>;
    conversionRate: number;
    bestPerformingSource: string;
    engagementCurve: Array<{ date: string; impressions: number; conversions: number }>;
    funnelData: Array<{ month: string; captured: number; engaged: number; qualified: number; converted: number }>;
  };
  feeAnalytics: {
    paidVsPending: Array<{ label: string; value: number }>;
    monthlyCollection: Array<{ month: string; collected: number; pending: number }>;
    collectionRate: number;
    totalRevenue: number;
    totalPending: number;
  };
  staffAnalytics: {
    departmentDistribution: Array<{ label: string; value: number }>;
    totalStaff: number;
    attendanceRate: number;
  };
  expenseAnalytics: {
    categoryBreakdown: Array<{ label: string; value: number }>;
    totalExpenses: number;
    monthlyTrend: Array<{ month: string; amount: number }>;
  };
  recentLeads: Array<any>;
  recentActivity: Array<Notification>;
}

export default function Dashboard() {
  const { data: analytics, isLoading, error } = useQuery<DashboardAnalytics>({
    queryKey: ['/api/dashboard/analytics'],
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen w-full bg-gray-50 text-gray-900 px-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard analytics...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen w-full bg-gray-50 text-gray-900 px-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold">Failed to load dashboard analytics</p>
            <p className="text-gray-600 text-sm mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </div>
      </>
    );
  }

  if (!analytics) {
    return (
      <>
        <Header />
        <div className="min-h-screen w-full bg-gray-50 text-gray-900 px-4 flex items-center justify-center">
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </>
    );
  }

  // Calculate progress percentages for KPIs
  const collectionProgress = analytics.feeAnalytics.totalRevenue > 0
    ? ((analytics.feeAnalytics.totalRevenue / (analytics.feeAnalytics.totalRevenue + analytics.feeAnalytics.totalPending)) * 100)
    : 0;

  const totalLeadCapacity = 1000; // Can be dynamic based on org settings
  const leadProgress = (analytics.kpis.leadManagement.value / totalLeadCapacity) * 100;

  return (
    <>
      <Header />
      <div className="min-h-screen w-full bg-gray-50 text-gray-900 px-4 pb-8">

        {/* KPI Cards - 8 Total */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            title="Total Leads"
            value={analytics.kpis.leadManagement.value}
            subtitle={`(${analytics.kpis.conversionRate.value}% Conv. Rate)`}
            change={analytics.kpis.leadManagement.change}
            icon={Users}
            color="blue"
            progress={leadProgress}
            tooltip="Total number of leads captured. Conversion Rate (Conv. Rate) shows the percentage of leads that have successfully enrolled."
          />

          <KPICard
            title="Total Revenue"
            value={`₹${analytics.kpis.studentFee.value.toLocaleString()}`}
            change={analytics.kpis.studentFee.change}
            icon={IndianRupee}
            color="green"
            progress={collectionProgress}
            tooltip="Includes: Student Fee Payments (Registration, EMI, Admission Form Fee, Other) + Daycare Revenue. Excludes staff payroll and expenses."
          />

          <KPICard
            title="Staff Payroll"
            value={`₹${analytics.kpis.payroll.value.toLocaleString()}`}
            change={analytics.kpis.payroll.change}
            icon={Banknote}
            color="purple"
            progress={80}
          />

          <KPICard
            title="Total Expenses"
            value={`₹${analytics.kpis.expenses.value.toLocaleString()}`}
            change={analytics.kpis.expenses.change}
            icon={CreditCard}
            color="orange"
            progress={60}
          />

          <KPICard
            title="Total Receivables"
            value={`₹${analytics.kpis.totalReceivables.value.toLocaleString()}`}
            change={analytics.kpis.totalReceivables.change}
            icon={IndianRupee}
            color="orange"
            progress={100}
            tooltip="The gross total of all fees currently billable for all enrolled students based on their fee structure."
          />

          <KPICard
            title="Fee Collected"
            value={`₹${analytics.kpis.avgOrderValue.value.toLocaleString()}`}
            change={analytics.kpis.avgOrderValue.change}
            icon={Wallet}
            color="purple"
            progress={65}
          />

          <KPICard
            title="Pending Fees"
            value={`₹${analytics.feeAnalytics.totalPending.toLocaleString()}`}
            change="Outstanding"
            icon={AlertCircle}
            color="red"
            progress={100 - collectionProgress}
          />

          <KPICard
            title="Total Daycare Revenue"
            value={`₹${analytics.kpis.daycareRevenue.value.toLocaleString()}`}
            change={analytics.kpis.daycareRevenue.change}
            icon={IndianRupee}
            color="amber"
            progress={50}
          />
        </div>


        {/* Intelligence Grid - 3 Columns (Moved to Top) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Lead Funnel Progression */}
          <Card className="bg-white/90 backdrop-blur-md border border-gray-100/50 shadow-lg rounded-2xl p-4">
            <CardHeader className="px-0 pt-0 pb-3">
              <CardTitle className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Lead Funnel
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col items-center">
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RCPieChart>
                    <Pie
                      data={[
                        { label: 'New', value: analytics.leadAnalytics.funnelData[analytics.leadAnalytics.funnelData.length - 1]?.captured || 0 },
                        { label: 'Contacted', value: analytics.leadAnalytics.funnelData[analytics.leadAnalytics.funnelData.length - 1]?.engaged || 0 },
                        { label: 'Interested', value: analytics.leadAnalytics.funnelData[analytics.leadAnalytics.funnelData.length - 1]?.qualified || 0 },
                        { label: 'Enrolled', value: analytics.leadAnalytics.funnelData[analytics.leadAnalytics.funnelData.length - 1]?.converted || 0 }
                      ]}
                      dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" paddingAngle={5}
                    >
                      <Cell fill="#3b82f6" /><Cell fill="#8b5cf6" /><Cell fill="#f59e0b" /><Cell fill="#10b981" />
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </RCPieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 w-full">
                <div className="text-center py-1.5 bg-blue-50/50 rounded-lg">
                  <p className="text-[12px] text-gray-500 uppercase font-bold tracking-tight">New</p>
                  <p className="text-sm font-bold text-blue-600">{analytics.leadAnalytics.funnelData[analytics.leadAnalytics.funnelData.length - 1]?.captured || 0}</p>
                </div>
                <div className="text-center py-1.5 bg-green-50/50 rounded-lg">
                  <p className="text-[12px] text-gray-500 uppercase font-bold tracking-tight">Enrolled</p>
                  <p className="text-sm font-bold text-green-600">{analytics.leadAnalytics.funnelData[analytics.leadAnalytics.funnelData.length - 1]?.converted || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Source Distribution */}
          <Card className="bg-white/90 backdrop-blur-md border border-gray-100/50 shadow-lg rounded-2xl p-4">
            <CardHeader className="px-0 pt-0 pb-3">
              <CardTitle className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                Lead Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col items-center">
              <div className="h-[180px] w-full">
                <DonutChart
                  title=""
                  data={analytics.leadAnalytics.sourceDistribution.map(item => ({
                    ...item,
                    label: item.label.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                  }))}
                  colors={["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]}
                />
              </div>
              <div className="mt-4 text-center">
                <p className="text-[12px] text-gray-500 uppercase tracking-wider font-bold">Best Source</p>
                <p className="text-sm font-bold text-indigo-600">
                  {(analytics.leadAnalytics.bestPerformingSource || "N/A").split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Expense Category Analysis */}
          <Card className="bg-white/90 backdrop-blur-md border border-gray-100/50 shadow-lg rounded-2xl p-4">
            <CardHeader className="px-0 pt-0 pb-3">
              <CardTitle className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-rose-600" />
                Expense Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col items-center">
              <div className="h-[180px] w-full">
                <DonutChart
                  title=""
                  data={analytics.expenseAnalytics.categoryBreakdown.map(item => ({
                    ...item,
                    label: item.label.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                  }))}
                  colors={["#f43f5e", "#f97316", "#eab308", "#84cc16", "#06b6d4"]}
                />
              </div>
              <div className="mt-4 text-center">
                <p className="text-[12px] text-gray-500 uppercase tracking-wider font-bold">Top Category</p>
                <p className="text-sm font-bold text-rose-600">
                  {(analytics.expenseAnalytics.categoryBreakdown.sort((a, b) => b.value - a.value)[0]?.label || "N/A").split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Row - Financial Performance & Expense Trend Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card className="bg-white/90 backdrop-blur-md border border-gray-100/50 shadow-lg rounded-2xl p-4 flex flex-col min-h-[300px]">
            <CardHeader className="px-0 pt-0 pb-3">
              <CardTitle className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-green-600" />
                Financial Performance
              </CardTitle>
              <p className="text-[12px] text-gray-500">Total Revenue vs Total Operating Expense</p>
            </CardHeader>
            <CardContent className="flex-1 w-full min-h-[220px] px-0">
              <ResponsiveContainer width="100%" height="100%">
                <RCLineChart
                  data={analytics.feeAnalytics.monthlyCollection.map(c => {
                    const expense = analytics.expenseAnalytics.monthlyTrend.find(e => e.month === c.month);
                    return {
                      month: c.month,
                      revenue: c.collected,
                      expense: expense ? expense.amount : 0,
                    };
                  })}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                    itemStyle={{ fontSize: '14px' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, undefined]}
                  />
                  <Line type="monotone" dataKey="revenue" name="Total Revenue" stroke="#10b981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#10b981' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="expense" name="Total Operating Expense" stroke="#ef4444" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                </RCLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-md border border-gray-100/50 shadow-lg rounded-2xl p-4 flex flex-col min-h-[300px]">
            <CardHeader className="px-0 pt-0 pb-3">
              <CardTitle className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                Monthly Expense Trend
              </CardTitle>
              <p className="text-[12px] text-gray-500">Monthly Operating Expense trajectory</p>
            </CardHeader>
            <CardContent className="flex-1 w-full min-h-[220px] px-0">
              <ResponsiveContainer width="100%" height="100%">
                <RCAreaChart data={analytics.expenseAnalytics.monthlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorExpenseTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                    itemStyle={{ fontSize: '14px' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, "Total Expense"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenseTrend)" dot={{ fill: '#f97316', r: 3 }} />
                </RCAreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

      </div>
    </>
  );
}
