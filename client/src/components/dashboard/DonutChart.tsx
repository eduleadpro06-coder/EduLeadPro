import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface DonutChartProps {
  title: string;
  data: { label: string; value: number }[];
  colors: string[];
}

const DonutChart: React.FC<DonutChartProps> = ({ title, data, colors }) => {
  return (
    <div className="flex flex-col items-center w-full h-full min-h-0">
      {title && <h3 className="mb-2 text-base font-semibold text-gray-800">{title}</h3>}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              paddingAngle={2}
              label={false}
            >
              {data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#ffffff', borderRadius: 12, color: '#374151', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#374151', fontSize: '14px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend below the chart - compact */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
        {data.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[idx % colors.length] }}></span>
            <span className="text-[12px] text-gray-600 font-medium whitespace-nowrap">{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart; 