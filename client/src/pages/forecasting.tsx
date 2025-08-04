import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnrollmentChart } from "@/components/charts/enrollment-chart";
import { useForecast } from "@/hooks/use-forecasting";
import { useLeads } from "@/hooks/use-leads";
import { Brain, TrendingUp, Calendar, Users, Target, AlertCircle } from "lucide-react";

export default function Forecasting() {
  const { data: forecast, isLoading, refetch } = useForecast();
  const { data: leads = [] } = useLeads();

  const highProbabilityLeads = leads.filter(l => 
    (l.admissionLikelihood && l.admissionLikelihood > 70) || 
    l.status === "Interested" || 
    l.status === "Hot"
  );

  const atRiskLeads = leads.filter(l => 
    l.status === "Cold" || 
    (l.admissionLikelihood && l.admissionLikelihood < 30)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Forecasting</h1>
          <p className="text-gray-600 mt-2">Predict enrollment trends and identify opportunities</p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <Brain className="w-4 h-4 mr-2" />
          {isLoading ? "Generating..." : "Refresh Forecast"}
        </Button>
      </div>

      {/* Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <Badge variant="secondary">Next Month</Badge>
            </div>
            <h3 className="text-2xl font-bold text-blue-900 mb-1">
              {forecast?.nextMonth || 0} students
            </h3>
            <p className="text-blue-700 text-sm">Predicted enrollments</p>
            <div className="mt-3 flex items-center text-xs text-blue-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              {forecast?.confidence ? `${Math.round(forecast.confidence * 100)}% confidence` : "Calculating..."}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <Badge variant="secondary">Next Quarter</Badge>
            </div>
            <h3 className="text-2xl font-bold text-green-900 mb-1">
              {forecast?.nextQuarter || 0} students
            </h3>
            <p className="text-green-700 text-sm">3-month projection</p>
            <div className="mt-3 flex items-center text-xs text-green-600">
              <Users className="w-3 h-3 mr-1" />
              Based on current pipeline
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <Badge variant="secondary">AI Insights</Badge>
            </div>
            <h3 className="text-2xl font-bold text-purple-900 mb-1">
              {highProbabilityLeads.length}
            </h3>
            <p className="text-purple-700 text-sm">High probability leads</p>
            <div className="mt-3 flex items-center text-xs text-purple-600">
              <AlertCircle className="w-3 h-3 mr-1" />
              Ready for conversion
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enrollment Trend Chart */}
        <EnrollmentChart />

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="w-5 h-5 mr-2 text-purple-600" />
              AI Insights & Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {forecast?.trends && forecast.trends.length > 0 ? (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Key Trends Identified</h4>
                  <ul className="space-y-2">
                    {forecast.trends.map((trend, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-gray-700">{trend}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No insights available yet. Add more leads to get AI-powered trends.</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-3">Lead Pipeline Analysis</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-green-800">High Probability</p>
                    <p className="text-2xl font-bold text-green-900">{highProbabilityLeads.length}</p>
                    <p className="text-xs text-green-600">Expected to convert</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-red-800">At Risk</p>
                    <p className="text-2xl font-bold text-red-900">{atRiskLeads.length}</p>
                    <p className="text-xs text-red-600">Need attention</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actionable Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Focus on Hot Leads</h4>
              <p className="text-sm text-blue-700 mb-3">
                {highProbabilityLeads.length} leads show high conversion potential
              </p>
              <Button size="sm" variant="outline">Review Hot Leads</Button>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-900 mb-2">Re-engage Cold Leads</h4>
              <p className="text-sm text-orange-700 mb-3">
                {atRiskLeads.length} leads need immediate attention
              </p>
              <Button size="sm" variant="outline">Create Campaign</Button>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Optimize Top Sources</h4>
              <p className="text-sm text-green-700 mb-3">
                Invest more in your best-performing lead sources
              </p>
              <Button size="sm" variant="outline">View Analytics</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
