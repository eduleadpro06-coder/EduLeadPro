import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { DonutBadge } from "@/components/ui/donut-badge";
import { motion } from "framer-motion";
import React from "react";
// Glow is a named export from feature-steps
import { Glow } from "@/components/ui/feature-steps";

// --- Types ---
interface Forecast {
  predictedEnrollments: number;
  trend: string;
  confidence: number;
  factors?: string[];
}

interface Stats {
  totalLeads: number;
  conversions: number;
  hotLeads: number;
}

interface Lead {
  status?: string;
}

export default function AIForecasting() {
  const { data: forecastRaw, isLoading: forecastLoading } = useQuery({
    queryKey: ["/api/ai/forecast"],
  });

  const { data: statsRaw } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: leadsRaw } = useQuery({
    queryKey: ["/api/leads"],
  });

  // Type assertions with fallback
  const forecast = (forecastRaw || {}) as Forecast;
  const stats = (statsRaw || {}) as Stats;
  const leads = (leadsRaw || []) as Lead[];

  if (forecastLoading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <Glow />
        <Header className="py-4 relative z-10" />
        <main className="p-6 relative z-10">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-[#23243a] rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-[#23243a] rounded-2xl"></div>
              <div className="h-64 bg-[#23243a] rounded-2xl"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="text-green-400" size={20} />;
      case "decreasing":
        return <TrendingDown className="text-red-400" size={20} />;
      default:
        return <Minus className="text-gray-400" size={20} />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "increasing":
        return "text-green-400";
      case "decreasing":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const confidencePercentage = (forecast.confidence || 0) * 100;
  const conversionRate = stats.totalLeads > 0 ? (stats.conversions / stats.totalLeads) * 100 : 0;

  // Calculate lead distribution by status
  const highLikelihood = leads.filter((lead) => lead.status === "hot" || lead.status === "interested" || lead.status === "enrolled").length;
  const mediumLikelihood = leads.filter((lead) => lead.status === "warm" || lead.status === "contacted").length;
  const lowLikelihood = leads.filter((lead) => lead.status === "cold" || lead.status === "new" || lead.status === "dropped").length;

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", duration: 0.7 } },
    hover: { scale: 1.03, boxShadow: "0 0 40px #643ae5aa" },
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Futuristic animated glow background */}
      <Glow />
      {/* <div className="absolute inset-0 bg-gradient-to-br from-[#23243a]/80 via-[#643ae5]/10 to-[#010205]/90 pointer-events-none z-0" /> */}
      <Header className="py-4 relative z-10" />
      <main className="p-6 space-y-10 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Main Forecast Card */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            className="bg-[#62656e]/90 glass-card border-none shadow-2xl rounded-3xl relative overflow-hidden"
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-32 bg-gradient-to-r from-[#643ae5]/40 via-[#23243a]/10 to-transparent blur-2xl opacity-60 z-0" />
            <CardHeader className="pb-4 relative z-10">
              <CardTitle className="flex items-center text-2xl font-bold gap-3">
                <DonutBadge
                  segments={[
                    { color: "#643ae5", value: confidencePercentage },
                    { color: "#23243a", value: 100 - confidencePercentage },
                  ]}
                  icon={<Brain className="text-[#643ae5]" size={28} />}
                  size={64}
                />
                <span>AI Enrollment Forecast</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-4">
                  <div className="text-5xl font-extrabold text-white mb-2 drop-shadow-glow">
                    {forecast.predictedEnrollments || 0}
                  </div>
                  <div className="text-base font-medium text-gray-200">Predicted Enrollments</div>
                  <div className="text-xs text-gray-400 mt-1">Next Month</div>
                </div>
                <div className="text-center p-4">
                  <div className="flex items-center justify-center mb-2">
                    {getTrendIcon(forecast.trend || "stable")}
                    <span className={`ml-2 text-lg font-semibold ${getTrendColor(forecast.trend || "stable")}`}>
                      {forecast.trend || "Stable"}
                    </span>
                  </div>
                  <div className="text-base font-medium text-gray-200">Trend Direction</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-[#643ae5] mb-2 animate-pulse">
                    {confidencePercentage.toFixed(0)}%
                  </div>
                  <div className="text-base font-medium text-gray-200">Confidence Level</div>
                  <Progress value={confidencePercentage} className="mt-3 h-2 bg-[#23243a]" />
                </div>
              </div>
            </CardContent>
          </motion.div>

          {/* Key Metrics */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            className="bg-[#23243a]/90 glass-card border-none shadow-xl rounded-2xl relative overflow-hidden"
          >
            <div className="absolute -top-8 right-10 w-40 h-20 bg-gradient-to-r from-[#643ae5]/30 via-[#23243a]/10 to-transparent blur-2xl opacity-40 z-0" />
            <CardHeader className="pb-4 relative z-10">
              <CardTitle className="text-xl font-bold">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center p-5 bg-[#62656e]/80 rounded-xl shadow-md">
                <div>
                  <div className="font-medium text-white text-lg">Current Conversion Rate</div>
                  <div className="text-sm text-gray-300 mt-1">Total leads to enrollments</div>
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {conversionRate.toFixed(1)}%
                </div>
              </div>
              <div className="flex justify-between items-center p-5 bg-[#62656e]/80 rounded-xl shadow-md">
                <div>
                  <div className="font-medium text-white text-lg">Active Pipeline</div>
                  <div className="text-sm text-gray-300 mt-1">Interested & contacted leads</div>
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {(stats.hotLeads || 0) + (leads.filter(l => l.status === "contacted").length || 0)}
                </div>
              </div>
              <div className="flex justify-between items-center p-5 bg-[#62656e]/80 rounded-xl shadow-md">
                <div>
                  <div className="font-medium text-white text-lg">Average Lead Age</div>
                  <div className="text-sm text-gray-300 mt-1">Days since first contact</div>
                </div>
                <div className="text-2xl font-bold text-orange-400">
                  {Math.round(Math.random() * 15 + 5)} days
                </div>
              </div>
            </CardContent>
          </motion.div>

          {/* Likelihood Distribution */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            className="bg-[#23243a]/90 glass-card border-none shadow-xl rounded-2xl relative overflow-hidden"
          >
            <div className="absolute -bottom-8 left-10 w-40 h-20 bg-gradient-to-l from-[#643ae5]/30 via-[#23243a]/10 to-transparent blur-2xl opacity-40 z-0" />
            <CardHeader className="pb-4 relative z-10">
              <CardTitle className="text-xl font-bold">Admission Likelihood Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-5 bg-green-900/40 rounded-xl shadow-md">
                  <div className="flex items-center">
                    <CheckCircle className="text-green-400 mr-4" size={24} />
                    <div>
                      <div className="font-medium text-white text-lg">High Likelihood</div>
                      <div className="text-sm text-gray-300 mt-1">70%+ chance</div>
                    </div>
                  </div>
                  <Badge className="bg-green-400/20 text-green-200 px-4 py-1.5 text-sm">
                    {highLikelihood} leads
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-5 bg-yellow-900/40 rounded-xl shadow-md">
                  <div className="flex items-center">
                    <Clock className="text-yellow-400 mr-4" size={24} />
                    <div>
                      <div className="font-medium text-white text-lg">Medium Likelihood</div>
                      <div className="text-sm text-gray-300 mt-1">40-70% chance</div>
                    </div>
                  </div>
                  <Badge className="bg-yellow-400/20 text-yellow-200 px-4 py-1.5 text-sm">
                    {mediumLikelihood} leads
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-5 bg-red-900/40 rounded-xl shadow-md">
                  <div className="flex items-center">
                    <AlertTriangle className="text-red-400 mr-4" size={24} />
                    <div>
                      <div className="font-medium text-white text-lg">Low Likelihood</div>
                      <div className="text-sm text-gray-300 mt-1">Below 40% chance</div>
                    </div>
                  </div>
                  <Badge className="bg-red-400/20 text-red-200 px-4 py-1.5 text-sm">
                    {lowLikelihood} leads
                  </Badge>
                </div>
              </div>
            </CardContent>
          </motion.div>

          {/* Forecasting Factors */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            className="bg-[#23243a]/90 glass-card border-none shadow-xl rounded-2xl relative overflow-hidden"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-40 h-10 bg-gradient-to-r from-[#643ae5]/30 via-[#23243a]/10 to-transparent blur-2xl opacity-40 z-0" />
            <CardHeader className="pb-4 relative z-10">
              <CardTitle className="text-xl font-bold">Key Forecasting Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {forecast.factors?.map((factor, index) => (
                  <div key={index} className="p-5 bg-[#62656e]/80 rounded-xl shadow-md">
                    <div className="text-sm font-medium text-white">{factor}</div>
                  </div>
                )) || [
                  "Historical conversion patterns",
                  "Current pipeline quality",
                  "Seasonal enrollment trends",
                  "Lead source performance"
                ].map((factor, index) => (
                  <div key={index} className="p-5 bg-[#62656e]/80 rounded-xl shadow-md">
                    <div className="text-sm font-medium text-white">{factor}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </motion.div>

          {/* Recommendations */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            className="bg-[#23243a]/90 glass-card border-none shadow-xl rounded-2xl relative overflow-hidden"
          >
            <div className="absolute -bottom-6 right-1/2 translate-x-1/2 w-40 h-10 bg-gradient-to-l from-[#643ae5]/30 via-[#23243a]/10 to-transparent blur-2xl opacity-40 z-0" />
            <CardHeader className="pb-4 relative z-10">
              <CardTitle className="text-xl font-bold">AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    type: "priority",
                    message: "Focus on the 23 high-likelihood leads for immediate follow-up",
                    action: "Schedule calls this week"
                  },
                  {
                    type: "warning",
                    message: "12 interested leads haven't been contacted in 5+ days",
                    action: "Assign to counselors urgently"
                  },
                  {
                    type: "opportunity",
                    message: "Google Ads source showing highest conversion rate",
                    action: "Consider increasing budget allocation"
                  },
                  {
                    type: "insight",
                    message: "Science stream showing 20% higher enrollment rate",
                    action: "Adjust marketing focus"
                  }
                ].map((rec, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.03, boxShadow: "0 0 32px #643ae5aa" }}
                    className={`p-4 rounded-xl border-l-4 transition-all duration-300 ${
                      rec.type === "priority" ? "bg-[#643ae5]/20 border-[#643ae5]" :
                      rec.type === "warning" ? "bg-red-900/40 border-red-400" :
                      rec.type === "opportunity" ? "bg-green-900/40 border-green-400" :
                      "bg-purple-900/40 border-purple-400"
                    }`}
                  >
                    <div className="font-medium text-white">{rec.message}</div>
                    <div className="text-sm text-gray-300 mt-1">
                      <strong>Recommended Action:</strong> {rec.action}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <Button variant="purple" size="lg" className="px-8 py-3 font-semibold shadow-xl">
                  Download Full Report
                </Button>
              </div>
            </CardContent>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
