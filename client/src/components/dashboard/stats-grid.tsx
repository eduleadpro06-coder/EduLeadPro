import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Info, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import AnimatedAnalyticsIcon from "./AnimatedAnalyticsIcon";

export default function StatsGrid() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-green-600 bg-green-50 border-green-200";
    if (trend < 0) return "text-red-600 bg-red-50 border-red-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-3 h-3" />;
    if (trend < 0) return <TrendingDown className="w-3 h-3" />;
    return null;
  };

  const statCards = [
    {
      title: "Total Leads",
      value: stats?.totalLeads || 0,
      trend: stats?.leadTrend || 0,
      description: "Total number of leads in the system",
      link: "/leads",
    },
    {
      title: "Active Enrollments",
      value: stats?.activeStudents || 0,
      trend: stats?.studentTrend || 0,
      description: "Currently enrolled and active students",
      link: "/student-fees",
    },
    {
      title: "Conversion",
      value: `${stats?.conversionRate || 0}%`,
      trend: stats?.conversionTrend || 0,
      description: "Lead to student conversion rate",
      link: "/ai-forecasting",
    },
    {
      title: "Revenue",
      value: `₹${(stats?.revenue || 0).toLocaleString()}`,
      trend: stats?.revenueTrend || 0,
      description: "Total revenue this month",
      link: "/analytics",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  // Assign a unique color for each card
  const cardBgColors = [
    "bg-blue-50 border-blue-100",
    "bg-green-50 border-green-100",
    "bg-yellow-50 border-yellow-100",
    "bg-indigo-50 border-indigo-100",
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {statCards.map((stat, index) => (
        <motion.div 
          key={stat.title} 
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className={`hover:shadow-xl transition-all duration-300 group ${cardBgColors[index % cardBgColors.length]} border backdrop-blur-sm bg-opacity-90`}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{stat.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">
                      {isLoading ? (
                        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        stat.value
                      )}
                    </p>
                    {!isLoading && (
                      <Badge
                        variant="outline"
                        className={`ml-2 ${getTrendColor(stat.trend)}`}
                      >
                        <span className="flex items-center gap-1">
                          {getTrendIcon(stat.trend)}
                          {Math.abs(stat.trend)}%
                        </span>
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gray-100"
                  onClick={() => setLocation(stat.link)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      <motion.div variants={itemVariants} className="col-span-full">
        <Card className="bg-blue-50 border-blue-100 border flex flex-col items-center justify-center p-8">
          <CardContent className="flex flex-col items-center justify-center">
            <AnimatedAnalyticsIcon className="w-16 h-12 mb-4" />
            <div className="text-lg font-medium text-gray-700 mt-2">Real-time Performance Metrics</div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
