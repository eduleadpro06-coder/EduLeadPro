import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import LineChart from "./LineChart";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// AnimatedNumber helper (inlined for linter fix)
interface AnimatedNumberProps {
  value: number | string;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}
function AnimatedNumber({ value, duration = 1.2, className = "", prefix = "", suffix = "" }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = typeof value === "number" ? value : parseFloat(value as string);
    if (isNaN(end)) return;
    const step = (end - start) / (duration * 60);
    let frame = 0;
    function animate() {
      frame++;
      const next = start + step * frame;
      if ((step > 0 && next >= end) || (step < 0 && next <= end)) {
        setDisplay(end);
        return;
      }
      setDisplay(next);
      requestAnimationFrame(animate);
    }
    animate();
    // eslint-disable-next-line
  }, [value]);
  return <span className={className}>{prefix}{typeof value === "number" ? Math.round(display) : display}{suffix}</span>;
}

interface HighlightCardProps {
  title: string;
  value: number;
  miniGraphData: { x: string; y: number }[];
  accentColor?: string;
  badgeText?: string;
  badgeClass?: string;
  tooltip?: string;
}

const HighlightCard: React.FC<HighlightCardProps> = ({ title, value, miniGraphData, accentColor = "#7C3AED", badgeText = "+8%", badgeClass = "bg-orange-100 text-orange-700 mt-2", tooltip = "Total outstanding fees for this month" }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
    whileHover={{ scale: 1.04, boxShadow: "0 8px 32px rgba(99,102,241,0.12)" }}
    className="col-span-1 md:col-span-3"
  >
    <Card className="flex flex-col items-center p-6 shadow-xl bg-gradient-to-br from-white/60 via-orange-50/60 to-white/80 rounded-2xl backdrop-blur-md min-h-[220px] border-0">
      <div className="text-sm text-gray-500 mb-2 font-semibold tracking-wide text-center">{title}</div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-3xl font-extrabold mb-2 flex items-center gap-2" style={{ color: accentColor, letterSpacing: "-0.01em" }}>
              <AnimatedNumber value={value} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <span>{tooltip}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="w-full h-12 mt-2">
        <LineChart data={miniGraphData} color={accentColor} height={48} hideAxes />
      </div>
      <Badge className={badgeClass}>{badgeText}</Badge>
    </Card>
  </motion.div>
);

export default HighlightCard; 