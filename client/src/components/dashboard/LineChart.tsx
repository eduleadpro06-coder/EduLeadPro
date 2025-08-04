import React from "react";
import { LineChart as ReLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface LineChartProps {
  data: { x: string; y: number }[];
  color?: string;
  height?: number;
  hideAxes?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({ data, color = "#7C3AED", height = 200, hideAxes = false }) => (
  <ResponsiveContainer width="100%" height={height}>
    <ReLineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
      <Line type="monotone" dataKey="y" stroke={color} strokeWidth={2} dot={false} />
      {!hideAxes && <XAxis dataKey="x" axisLine={false} tickLine={false} />}
      {!hideAxes && <YAxis axisLine={false} tickLine={false} />}
      <Tooltip />
    </ReLineChart>
  </ResponsiveContainer>
);

export default LineChart; 