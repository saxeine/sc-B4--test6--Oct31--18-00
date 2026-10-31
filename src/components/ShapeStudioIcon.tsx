import React from "react";

export const ShapeStudioIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer Set Square Triangle */}
      <path d="M4 3v17h17L4 3z" />
      {/* Inner Triangular Cutout */}
      <path d="M8 11v5h5L8 11z" />
      {/* Measurement Ticks along Hypotenuse */}
      <line x1="7.4" y1="6.4" x2="6.2" y2="7.6" />
      <line x1="10" y1="9" x2="8.8" y2="10.2" />
      <line x1="12.5" y1="11.5" x2="11.3" y2="12.7" />
      <line x1="15" y1="14" x2="13.8" y2="15.2" />
      <line x1="17.6" y1="16.6" x2="16.4" y2="17.8" />
    </svg>
  );
};
