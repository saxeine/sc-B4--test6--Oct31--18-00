import React from "react";

export const KrumsIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
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
      {/* Back Layer Frame */}
      <rect x="2" y="6" width="14" height="14" rx="2" strokeOpacity="0.4" strokeWidth="1.5" />
      {/* Front Layer Frame */}
      <rect x="7" y="3" width="15" height="15" rx="2.5" strokeWidth="2" />
      {/* Dynamic Transform Aperture / Orbit Spin Ring */}
      <circle cx="14.5" cy="10.5" r="4" strokeWidth="1.5" strokeDasharray="3 2" />
      {/* Spin / Rotation Pointer */}
      <path d="M14.5 4.5 L17 7 L14.5 7" strokeWidth="1.5" fill="none" />
      {/* Zoom / Stretch Crosshairs */}
      <circle cx="14.5" cy="10.5" r="1.5" fill="currentColor" />
      {/* Lower Multi-Image Indicators (Krums Crumbs) */}
      <circle cx="4.5" cy="17.5" r="1" fill="currentColor" fillOpacity="0.7" />
      <circle cx="7.5" cy="20.5" r="1" fill="currentColor" fillOpacity="0.9" />
      <circle cx="10.5" cy="20.5" r="1" fill="currentColor" fillOpacity="0.9" />
    </svg>
  );
};
