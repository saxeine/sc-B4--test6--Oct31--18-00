import React from "react";

export const MesshiIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = "w-4 h-4",
  style,
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {/* Outer bounding mesh frame with corner ticks */}
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
      {/* Grid Mesh vertical lines */}
      <line x1="9" y1="3" x2="9" y2="21" strokeDasharray="1 1.5" strokeWidth="1.5" />
      <line x1="15" y1="3" x2="15" y2="21" strokeDasharray="1 1.5" strokeWidth="1.5" />
      {/* Grid Mesh horizontal lines */}
      <line x1="3" y1="9" x2="21" y2="9" strokeDasharray="1 1.5" strokeWidth="1.5" />
      <line x1="3" y1="15" x2="21" y2="15" strokeDasharray="1 1.5" strokeWidth="1.5" />
      {/* Active center sliced node with highlight */}
      <rect x="9" y="9" width="6" height="6" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" />
      {/* Precision corner marks */}
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="9" r="1" fill="currentColor" />
      <circle cx="9" cy="15" r="1" fill="currentColor" />
      <circle cx="15" cy="15" r="1" fill="currentColor" />
    </svg>
  );
};
