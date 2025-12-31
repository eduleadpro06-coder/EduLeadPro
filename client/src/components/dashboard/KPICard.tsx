import { Card } from "@/components/ui/card";
import { LucideIcon, Info } from "lucide-react";
import { useState } from "react";

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string; // New: Optional subtitle for secondary metrics like Conv. Rate
    change: string;
    icon: LucideIcon;
    color: "green" | "blue" | "amber" | "purple" | "orange" | "red";
    progress?: number; // 0-100
    tooltip?: string; // Optional tooltip text
}

const colorClasses = {
    green: {
        icon: "text-green-600",
        iconBg: "bg-green-50",
        progressFrom: "from-green-400",
        progressTo: "to-green-600",
        badge: "text-green-600 bg-green-50"
    },
    blue: {
        icon: "text-blue-600",
        iconBg: "bg-blue-50",
        progressFrom: "from-blue-400",
        progressTo: "to-blue-600",
        badge: "text-blue-600 bg-blue-50"
    },
    amber: {
        icon: "text-amber-600",
        iconBg: "bg-amber-50",
        progressFrom: "from-amber-400",
        progressTo: "to-amber-600",
        badge: "text-amber-600 bg-amber-50"
    },
    purple: {
        icon: "text-purple-600",
        iconBg: "bg-purple-50",
        progressFrom: "from-purple-400",
        progressTo: "to-purple-600",
        badge: "text-purple-600 bg-purple-50"
    },
    orange: {
        icon: "text-orange-600",
        iconBg: "bg-orange-50",
        progressFrom: "from-orange-400",
        progressTo: "to-orange-600",
        badge: "text-orange-600 bg-orange-50"
    },
    red: {
        icon: "text-red-600",
        iconBg: "bg-red-50",
        progressFrom: "from-red-400",
        progressTo: "to-red-600",
        badge: "text-red-600 bg-red-50"
    }
};

export default function KPICard({ title, value, subtitle, change, icon: Icon, color, progress, tooltip }: KPICardProps) {
    const colors = colorClasses[color];
    const isPositive = !change.startsWith("-") && change !== "Outstanding";
    const changeColor = change === "Outstanding" ? "text-red-500" : (isPositive ? "text-green-600" : "text-red-600");
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <Card className="bg-white/90 backdrop-blur-md border border-gray-100/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl p-[14px]">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-sm font-medium text-gray-500">{title}</p>
                        {tooltip && (
                            <div className="relative">
                                <Info
                                    className="h-3.5 w-3.5 text-gray-400 cursor-help hover:text-gray-600 transition-colors"
                                    onMouseEnter={() => setShowTooltip(true)}
                                    onMouseLeave={() => setShowTooltip(false)}
                                />
                                {showTooltip && (
                                    <div className="absolute left-0 top-5 z-50 w-56 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
                                        <div className="absolute -top-1 left-2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                                        {tooltip}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-[18px] font-bold text-gray-900 leading-tight">{value}</p>
                        {subtitle && (
                            <span className="text-[12px] font-medium text-gray-400">{subtitle}</span>
                        )}
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] mt-1 font-medium ${change ? changeColor : 'invisible'}`}>
                        {change || "-"}
                    </div>
                </div>
                <div className={`p-2 rounded-xl ${colors.iconBg}`}>
                    <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
            </div>

            {progress !== undefined && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                        className={`h-1.5 rounded-full bg-gradient-to-r ${colors.progressFrom} ${colors.progressTo} transition-all duration-500`}
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                </div>
            )}
        </Card>
    );
}
