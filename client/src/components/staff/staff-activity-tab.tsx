import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { 
  User, 
  IndianRupee, 
  CheckCircle, 
  Clock, 
  Edit, 
  AlertCircle,
  Activity as ActivityIcon 
} from "lucide-react";

interface Activity {
  id: string;
  type: 'notification' | 'payroll';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionType: string;
  timestamp: string;
  metadata: any;
}

interface StaffActivityTabProps {
  staffId: number;
}

export default function StaffActivityTab({ staffId }: StaffActivityTabProps) {
  const { data: activities = [], isLoading, error } = useQuery<Activity[]>({
    queryKey: [`/api/staff/${staffId}/activity`],
    queryFn: async () => {
      const response = await fetch(`/api/staff/${staffId}/activity`);
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      return response.json();
    },
    enabled: !!staffId,
  });

  const getActivityIcon = (actionType: string, priority: string) => {
    switch (actionType) {
      case 'staff_status_change':
        return <User className={`w-4 h-4 ${priority === 'high' ? 'text-red-500' : 'text-blue-500'}`} />;
      case 'staff_salary_change':
        return <IndianRupee className="w-4 h-4 text-green-500" />;
      case 'staff_profile_change':
        return <Edit className="w-4 h-4 text-blue-500" />;
      case 'staff_role_change':
        return <User className="w-4 h-4 text-purple-500" />;
      case 'staff_department_change':
        return <User className="w-4 h-4 text-indigo-500" />;
      case 'staff_banking_change':
        return <IndianRupee className="w-4 h-4 text-orange-500" />;
      case 'staff_bulk_update':
        return <Edit className="w-4 h-4 text-blue-600" />;
      case 'payroll_generated':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'payroll_processed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'payroll_status_change':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'payroll_amount_change':
        return <IndianRupee className="w-4 h-4 text-green-600" />;
      case 'view_payroll':
        return <IndianRupee className="w-4 h-4 text-gray-500" />;
      case 'view_staff':
      default:
        return <Edit className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityColor = (actionType: string) => {
    switch (actionType) {
      case 'staff_status_change':
        return 'border-l-red-500';
      case 'staff_salary_change':
        return 'border-l-green-500';
      case 'staff_profile_change':
        return 'border-l-blue-500';
      case 'staff_role_change':
        return 'border-l-purple-500';
      case 'staff_department_change':
        return 'border-l-indigo-500';
      case 'staff_banking_change':
        return 'border-l-orange-500';
      case 'staff_bulk_update':
        return 'border-l-blue-600';
      case 'payroll_generated':
        return 'border-l-yellow-500';
      case 'payroll_processed':
        return 'border-l-green-600';
      case 'payroll_status_change':
        return 'border-l-blue-500';
      case 'payroll_amount_change':
        return 'border-l-green-600';
      case 'view_payroll':
        return 'border-l-gray-400';
      default:
        return 'border-l-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="w-full glass-card rounded-lg border bg-card text-card-foreground shadow-lg p-6 min-h-[400px]">
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <ActivityIcon className="w-8 h-8 text-gray-400 animate-pulse" />
            <p className="text-gray-500">Loading activity...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full glass-card rounded-lg border bg-card text-card-foreground shadow-lg p-6 min-h-[400px]">
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-red-500">Failed to load activity</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full glass-card rounded-lg border bg-card text-card-foreground shadow-lg p-6 min-h-[400px]">
      <div className="flex items-center gap-3 mb-6">
        <ActivityIcon className="w-5 h-5 text-[#643ae5]" />
        <h3 className="font-semibold text-lg">Recent Activity</h3>
        <Badge variant="secondary" className="ml-auto">
          {activities.length} {activities.length === 1 ? 'record' : 'records'}
        </Badge>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ActivityIcon className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No activity recorded yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Staff activities will appear here when profile changes, payroll actions, or status updates occur.
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start gap-4 p-4 border rounded-lg border-l-4 ${getActivityColor(activity.actionType)} hover:bg-gray-50 transition-colors`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.actionType, activity.priority)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{activity.title}</h4>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                          {activity.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{activity.message}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(activity.timestamp), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                        {activity.metadata && activity.metadata.payrollId && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Payroll ID: {activity.metadata.payrollId}
                          </span>
                        )}
                        {activity.metadata && activity.metadata.month && activity.metadata.year && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                            {activity.metadata.month}/{activity.metadata.year}
                          </span>
                        )}
                        {activity.actionType.includes('change') && (
                          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
                            Profile Update
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(activity.priority)} flex-shrink-0`}
                    >
                      {activity.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
