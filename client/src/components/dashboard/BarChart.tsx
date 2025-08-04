import React from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  xLabel?: string;
  yLabel?: string;
}

export default function BarChart({ data, height = 120, xLabel, yLabel }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="relative flex flex-col items-stretch h-full" style={{ height }}>
      {/* Y-axis label */}
      {yLabel && (
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 rotate-[-90deg]">
          {yLabel}
        </div>
      )}
      <div className="flex items-end gap-2 h-full">
        {data.map((d, i) => (
          <TooltipProvider key={d.label}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className="w-6 rounded-t transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-300"
                  style={{
                    background: d.color || "#a78bfa",
                  }}
                  tabIndex={0}
                  aria-label={`${d.label}: ${d.value}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.value / max) * (height - 24)}px` }}
                  transition={{ duration: 0.7, type: "spring" }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <span className="font-semibold">{d.label}</span>: {d.value}
              </TooltipContent>
            </Tooltip>
            <span className="text-xs mt-1 text-gray-300 text-center w-16 block truncate">{d.label}</span>
          </TooltipProvider>
        ))}
      </div>
      {/* X-axis label */}
      {xLabel && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">{xLabel}</div>
      )}
    </div>
  );
} 