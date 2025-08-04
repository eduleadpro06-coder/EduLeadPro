import React from "react";

// Animated SVG bar chart (simple, modern, and free to use)
const AnimatedAnalyticsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="64"
    height="48"
    viewBox="0 0 64 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="8" y="28" width="8" height="12" rx="2" fill="#60A5FA">
      <animate attributeName="y" values="28;18;28" dur="1.2s" repeatCount="indefinite" />
      <animate attributeName="height" values="12;22;12" dur="1.2s" repeatCount="indefinite" />
    </rect>
    <rect x="24" y="18" width="8" height="22" rx="2" fill="#34D399">
      <animate attributeName="y" values="18;28;18" dur="1.2s" repeatCount="indefinite" begin="0.4s" />
      <animate attributeName="height" values="22;12;22" dur="1.2s" repeatCount="indefinite" begin="0.4s" />
    </rect>
    <rect x="40" y="10" width="8" height="30" rx="2" fill="#FBBF24">
      <animate attributeName="y" values="10;20;10" dur="1.2s" repeatCount="indefinite" begin="0.8s" />
      <animate attributeName="height" values="30;20;30" dur="1.2s" repeatCount="indefinite" begin="0.8s" />
    </rect>
    <rect x="56" y="36" width="8" height="4" rx="2" fill="#F472B6">
      <animate attributeName="y" values="36;32;36" dur="1.2s" repeatCount="indefinite" begin="0.2s" />
      <animate attributeName="height" values="4;8;4" dur="1.2s" repeatCount="indefinite" begin="0.2s" />
    </rect>
  </svg>
);

export default AnimatedAnalyticsIcon; 