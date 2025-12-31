import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { Filter } from "lucide-react";

interface FunnelChartProps {
    data: Array<{
        month: string;
        captured: number;
        engaged: number;
        qualified: number;
        converted: number;
    }>;
}

export default function FunnelChart({ data }: FunnelChartProps) {
    return (
        <Card className="bg-white/90 backdrop-blur-md border border-gray-100/50 shadow-lg rounded-2xl">
            <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Filter className="h-5 w-5 text-purple-600" />
                    Lead Funnel Progression
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">Monthly stage evolution with conversion tracking</p>
            </CardHeader>

            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="month"
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
                            cursor={{ fill: '#f3f4f6' }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="square"
                        />
                        <Bar
                            dataKey="captured"
                            stackId="funnel"
                            fill="#3b82f6"
                            radius={[0, 0, 0, 0]}
                            name="Captured"
                        />
                        <Bar
                            dataKey="engaged"
                            stackId="funnel"
                            fill="#8b5cf6"
                            radius={[0, 0, 0, 0]}
                            name="Engaged"
                        />
                        <Bar
                            dataKey="qualified"
                            stackId="funnel"
                            fill="#f59e0b"
                            radius={[0, 0, 0, 0]}
                            name="Qualified"
                        />
                        <Bar
                            dataKey="converted"
                            stackId="funnel"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            name="Converted"
                        />
                    </BarChart>
                </ResponsiveContainer>

                {/* Conversion insights */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600">Engagement Rate</p>
                        <p className="text-lg font-bold text-blue-600">
                            {data.length > 0 && data[data.length - 1].captured > 0
                                ? Math.round((data[data.length - 1].engaged / data[data.length - 1].captured) * 100)
                                : 0}%
                        </p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs text-gray-600">Qualification Rate</p>
                        <p className="text-lg font-bold text-purple-600">
                            {data.length > 0 && data[data.length - 1].engaged > 0
                                ? Math.round((data[data.length - 1].qualified / data[data.length - 1].engaged) * 100)
                                : 0}%
                        </p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600">Conversion Rate</p>
                        <p className="text-lg font-bold text-green-600">
                            {data.length > 0 && data[data.length - 1].qualified > 0
                                ? Math.round((data[data.length - 1].converted / data[data.length - 1].qualified) * 100)
                                : 0}%
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
