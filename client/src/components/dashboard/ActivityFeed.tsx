import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, Bell, User, DollarSign, Users, Calendar, CheckCircle } from "lucide-react";
import { Notification } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
    activities: Notification[];
}

const iconMap: Record<string, any> = {
    admission: User,
    payment: DollarSign,
    lead: Users,
    followup: Calendar,
    default: Bell
};

const colorMap: Record<string, string> = {
    high: "text-red-600 bg-red-50",
    medium: "text-amber-600 bg-amber-50",
    low: "text-blue-600 bg-blue-50"
};

export default function ActivityFeed({ activities }: ActivityFeedProps) {
    return (
        <Card className="bg-white/90 backdrop-blur-md border border-gray-100/50 shadow-lg rounded-2xl">
            <CardHeader className="py-4 px-5">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-gray-600" />
                    Recent Activity
                </CardTitle>
            </CardHeader>

            <CardContent className="max-h-[350px] overflow-y-auto space-y-2 p-4 pt-0">
                {activities.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                        <Bell className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>No recent activity</p>
                    </div>
                ) : (
                    activities.map((activity) => {
                        const IconComponent = iconMap[activity.type] || iconMap.default;
                        const priorityClass = colorMap[activity.priority || "low"];

                        return (
                            <div
                                key={activity.id}
                                className="flex gap-2 items-start p-2 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                            >
                                <div className={`p-1.5 rounded-lg ${priorityClass}`}>
                                    <IconComponent className="h-3.5 w-3.5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                            {activity.title}
                                        </p>
                                        {activity.read && (
                                            <CheckCircle className="h-3.5 w-3.5 text-green-500 ml-2 flex-shrink-0" />
                                        )}
                                    </div>

                                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                                        {activity.message}
                                    </p>

                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}

                {activities.length > 0 && (
                    <button className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-1 mt-2">
                        View All Activity
                    </button>
                )}
            </CardContent>
        </Card>
    );
}
