import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface DonutChartProps {
  title: string;
  data: { label: string; value: number }[];
  colors: string[];
}

const DonutChart: React.FC<DonutChartProps> = ({ title, data, colors }) => {
  return (
    <div className="flex flex-col items-center w-full h-full">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">{title}</h3>
      <div className="w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              label={false}
            >
              {data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#ffffff', borderRadius: 8, color: '#374151', border: '1px solid #e5e7eb' }}
              itemStyle={{ color: '#374151' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend below the chart */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: colors[idx % colors.length] }}></span>
            <span className="text-sm text-gray-700">{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart; 