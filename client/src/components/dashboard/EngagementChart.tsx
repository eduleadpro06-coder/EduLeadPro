import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from "lucide-react";
import { useState } from "react";

interface EngagementChartProps {
    data: Array<{ date: string; impressions: number; conversions: number }>;
}

type Period = "daily" | "weekly" | "monthly";

export default function EngagementChart({ data }: EngagementChartProps) {
    const [period, setPeriod] = useState<Period>("daily");

    // Format data based on selected period
    const formattedData = data.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    return (
        <Card className="bg-white/90 backdrop-blur-md border border-gray-100/50 shadow-lg rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Engagement Overview
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Daily lead capture and conversion trends</p>
                </div>

                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setPeriod("daily")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${period === "daily"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        Daily
                    </button>
                    <button
                        onClick={() => setPeriod("weekly")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${period === "weekly"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        Weekly
                    </button>
                    <button
                        onClick={() => setPeriod("monthly")}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${period === "monthly"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        Monthly
                    </button>
                </div>
            </CardHeader>

            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={formattedData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                backgroundColor: 'white'
                            }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="circle"
                        />
                        <Line
                            type="monotone"
                            dataKey="impressions"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Lead Impressions"
                        />
                        <Line
                            type="monotone"
                            dataKey="conversions"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ fill: '#10b981', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Conversions"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
