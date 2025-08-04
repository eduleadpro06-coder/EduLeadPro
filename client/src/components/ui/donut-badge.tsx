import React from "react";

type DonutBadgeProps = {
  segments: { color: string; value: number }[]; // value is the percentage (out of 100)
  icon: React.ReactNode;
  size?: number;
};

export function DonutBadge({ segments, icon, size = 80 }: DonutBadgeProps) {
  // Calculate the circumference of the circle
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;

  // Calculate the dasharray and dashoffset for each segment
  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const length = (seg.value / 100) * circumference;
    const arc = (
      <circle
        key={i}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        fill="none"
        stroke={seg.color}
        strokeWidth={10}
        strokeDasharray={`${length} ${circumference - length}`}
        strokeDashoffset={-offset}
        style={{ transition: "stroke-dasharray 0.3s" }}
      />
    );
    offset += length;
    return arc;
  });

  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      {/* Background circle */}
      <circle
        r={radius}
        cx={size / 2}
        cy={size / 2}
        fill="none"
        stroke="#222"
        strokeWidth={10}
      />
      {/* Colored segments */}
      {arcs}
      {/* Center icon */}
      <foreignObject
        x={size / 2 - 18}
        y={size / 2 - 18}
        width={36}
        height={36}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      </foreignObject>
    </svg>
  );
} 