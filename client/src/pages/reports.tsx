import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  FileSpreadsheet
} from "lucide-react";
import { type LeadWithCounselor } from "@shared/schema";

export default function Reports() {
  const [dateRange, setDateRange] = useState("30");
  const [reportType, setReportType] = useState("overview");

  const { data: leads } = useQuery<LeadWithCounselor[]>({
    queryKey: ["/api/leads"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: leadSources } = useQuery({
    queryKey: ["/api/dashboard/lead-sources"],
  });

  const { data: enrollmentTrend } = useQuery({
    queryKey: ["/api/dashboard/enrollment-trend"],
  });

  const { data: counselors } = useQuery({
    queryKey: ["/api/counselors"],
  });

  // Calculate report metrics
  const calculateMetrics = () => {
    if (!leads) return null;

    const totalLeads = leads.length;
    const conversions = leads.filter(lead => lead.status === "enrolled").length;
    const conversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0;

    // Counselor performance
    const counselorStats = counselors?.map(counselor => {
      const counselorLeads = leads.filter(lead => lead.counselorId === counselor.id);
      const counselorConversions = counselorLeads.filter(lead => lead.status === "enrolled").length;
      const counselorConversionRate = counselorLeads.length > 0 ?
        (counselorConversions / counselorLeads.length) * 100 : 0;

      return {
        ...counselor,
        totalLeads: counselorLeads.length,
        conversions: counselorConversions,
        conversionRate: counselorConversionRate
      };
    }) || [];

    // Status distribution
    const statusDistribution = {
      new: leads.filter(lead => lead.status === "new").length,
      contacted: leads.filter(lead => lead.status === "contacted").length,
      interested: leads.filter(lead => lead.status === "interested").length,
      enrolled: leads.filter(lead => lead.status === "enrolled").length,
      dropped: leads.filter(lead => lead.status === "dropped").length,
    };

    // Source performance
    const sourceStats = leadSources?.map(source => ({
      ...source,
      conversionRate: source.totalLeads > 0 ? (source.conversions / source.totalLeads) * 100 : 0,
      costPerLead: source.totalLeads > 0 && source.cost ?
        (Number(source.cost) / source.totalLeads) : 0
    })) || [];

    return {
      totalLeads,
      conversions,
      conversionRate,
      counselorStats,
      statusDistribution,
      sourceStats
    };
  };

  const metrics = calculateMetrics();

  const exportReport = (format: string) => {
    // In a real implementation, this would generate and download the report
    console.log(`Exporting ${reportType} report in ${format} format for last ${dateRange} days`);

    // Mock data for export
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange: `Last ${dateRange} days`,
      type: reportType,
      metrics: metrics
    };

    // Create a blob and download it
    const dataStr = format === 'json' ?
      JSON.stringify(reportData, null, 2) :
      convertToCSV(reportData);

    const dataBlob = new Blob([dataStr], {
      type: format === 'json' ? 'application/json' : 'text/csv'
    });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-report-${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any) => {
    if (!metrics) return "";

    let csv = "Lead Report\n";
    csv += `Generated: ${new Date().toLocaleDateString()}\n`;
    csv += `Date Range: Last ${dateRange} days\n\n`;

    csv += "Overall Metrics\n";
    csv += "Metric,Value\n";
    csv += `Total Leads,${metrics.totalLeads}\n`;
    csv += `Conversions,${metrics.conversions}\n`;
    csv += `Conversion Rate,${metrics.conversionRate.toFixed(2)}%\n\n`;

    csv += "Status Distribution\n";
    csv += "Status,Count\n";
    Object.entries(metrics.statusDistribution).forEach(([status, count]) => {
      csv += `${status},${count}\n`;
    });

    return csv;
  };

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header className="py-4" />
        <main className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
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
        {/* Report Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-h3 flex items-center">
              <FileText className="mr-3 text-blue-600" size={24} />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="flex items-center space-x-2">
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
                </div>

                <div className="flex items-center space-x-2">
                  <Filter className="text-gray-500" size={16} />
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overview">Overview Report</SelectItem>
                      <SelectItem value="conversion">Conversion Analysis</SelectItem>
                      <SelectItem value="source">Source Performance</SelectItem>
                      <SelectItem value="counselor">Counselor Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportReport('csv')}>
                  <FileSpreadsheet className="mr-2" size={16} />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => exportReport('json')}>
                  <Download className="mr-2" size={16} />
                  Export JSON
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-medium text-gray-600">Total Leads</p>
                  <p className="text-h1 font-bold text-gray-900">{metrics.totalLeads}</p>
                  <p className="text-sm text-blue-600 mt-1 flex items-center">
                    <TrendingUp className="mr-1" size={12} />
                    Last {dateRange} days
                  </p>
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
                  <p className="text-caption font-medium text-gray-600">Conversions</p>
                  <p className="text-h1 font-bold text-gray-900">{metrics.conversions}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {metrics.conversionRate.toFixed(1)}% rate
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="text-green-600" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-medium text-gray-600">Active Pipeline</p>
                  <p className="text-h1 font-bold text-gray-900">
                    {metrics.statusDistribution.contacted + metrics.statusDistribution.interested}
                  </p>
                  <p className="text-sm text-orange-600 mt-1">Requires follow-up</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-orange-600" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-medium text-gray-600">Revenue Impact</p>
                  <p className="text-h1 font-bold text-gray-900">
                    ₹{((metrics.conversions * 80000) / 100000).toFixed(1)}L
                  </p>
                  <p className="text-sm text-purple-600 mt-1">Estimated value</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <PieChart className="text-purple-600" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-h3">Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(metrics.statusDistribution).map(([status, count]) => (
                <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-h2 font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{status}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {((count / metrics.totalLeads) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Lead Source Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.sourceStats.map((source, index) => (
                  <div key={source.source} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {source.source.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {source.totalLeads} leads • {source.conversions} conversions
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${source.conversionRate >= 20 ? 'bg-green-100 text-green-800' :
                          source.conversionRate >= 10 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                        {source.conversionRate.toFixed(1)}%
                      </Badge>
                      {source.costPerLead > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          ₹{source.costPerLead.toFixed(0)} per lead
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Counselor Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Counselor Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.counselorStats.map((counselor) => (
                  <div key={counselor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{counselor.name}</div>
                      <div className="text-sm text-gray-600">
                        {counselor.totalLeads} leads assigned
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {counselor.conversions}
                      </div>
                      <Badge className={`${counselor.conversionRate >= 20 ? 'bg-green-100 text-green-800' :
                          counselor.conversionRate >= 10 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                        {counselor.conversionRate.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
                {metrics.counselorStats.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No counselor data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-h3">Enrollment Trend Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 bg-gradient-to-t from-blue-50 to-transparent rounded-lg flex items-end justify-between p-4">
              {enrollmentTrend?.map((data, index) => {
                const maxEnrollments = Math.max(...(enrollmentTrend?.map(t => t.enrollments) || [1]));
                const height = (data.enrollments / maxEnrollments) * 200;

                return (
                  <div key={data.month} className="flex flex-col items-center">
                    <div
                      className="w-12 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${Math.max(height, 20)}px` }}
                    ></div>
                    <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                    <span className="text-xs font-medium text-gray-900">{data.enrollments}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-sm text-gray-600 text-center">
              Monthly enrollment numbers over the past 6 months
            </div>
          </CardContent>
        </Card>

        {/* Report Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-h3">Report Summary & Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-body font-semibold text-gray-900 mb-3">Key Findings</h4>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-600">
                      Overall conversion rate: {metrics.conversionRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-600">
                      {metrics.sourceStats[0]?.source.replace('_', ' ')} is the top performing source
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-600">
                      {metrics.statusDistribution.contacted + metrics.statusDistribution.interested} leads in active pipeline
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-body font-semibold text-gray-900 mb-3">Recommendations</h4>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-600">
                      Focus on following up with {metrics.statusDistribution.interested} interested leads
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-600">
                      Analyze and improve {metrics.sourceStats.filter(s => s.conversionRate < 10).length} underperforming sources
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-600">
                      Implement retention strategies for {metrics.statusDistribution.dropped} dropped leads
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
