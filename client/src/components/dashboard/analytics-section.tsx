import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockDashboardData } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, IndianRupee, BookOpen, Users, Info, User } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const AnalyticsSection = () => {
  const [, setLocation] = useLocation();
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/analytics"],
    queryFn: () => Promise.resolve(mockDashboardData.analytics),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enrollment Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-opacity-90">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
                <span>Enrollment Trend</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Monthly enrollment trends and projections</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/analytics/enrollment")}
                className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
              >
                View Detailed Report
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[300px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4">
              {/* Chart component will go here */}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Other Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Conversion Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-opacity-90">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <span>Conversion Rate</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[200px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4">
                {/* Chart component will go here */}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lead Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-opacity-90">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <span>Lead Sources</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[200px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4">
                {/* Chart component will go here */}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsSection; 