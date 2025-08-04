import { ResponsiveContainer, AreaChart as RCAreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

interface AreaChartProps {
  data: { label: string; value: number }[];
  color?: string;
}

export default function AreaChart({ data, color = "#38bdf8" }: AreaChartProps) {
  return (
    <div className="w-full h-40">
      <ResponsiveContainer width="100%" height="100%">
        <RCAreaChart data={data}>
          <defs>
            <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="label" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke={color} fillOpacity={1} fill="url(#colorArea)" />
        </RCAreaChart>
      </ResponsiveContainer>
    </div>
  );
} 