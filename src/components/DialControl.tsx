import React, { useState, useRef, useCallback, useEffect, useId } from "react";
import { Disc, RotateCcw, Sliders, Sun } from "lucide-react";
import { cn } from "../utils/cn";
import { RadialColorPicker, type RadialColorPickerProps } from "./RadialColorPicker";

export interface RotaryDialKnobProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  size?: "sm" | "md" | "lg";
  accentColor?: string;
  showTicks?: boolean;
  className?: string;
  onChange: (value: number) => void;
  tooltip?: string;
}

/**
 * Hardware-inspired Rotary Dial Control
 * Interactive rotary dial knob with continuous angle drag, sweep track, tick indicators, and value readout.
 */
export const RotaryDialKnob: React.FC<RotaryDialKnobProps> = ({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  defaultValue = min,
  unit = "",
  size = "md",
  accentColor = "#00f0ff",
  showTicks = true,
  className = "",
  onChange,
  tooltip,
}) => {
  const dialRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startY: number; startVal: number }>({ startY: 0, startVal: value });

  // Size dimensions
  const diameter = size === "sm" ? 44 : size === "lg" ? 72 : 56;
  const strokeWidth = size === "sm" ? 3.5 : size === "lg" ? 5 : 4;
  const radius = diameter / 2 - strokeWidth - 2;
  const center = diameter / 2;

  // Arc range: 270 degrees total (from 135 deg to 405 deg / -135 to +135)
  const START_ANGLE = 135;
  const END_ANGLE = 405;
  const ANGLE_RANGE = END_ANGLE - START_ANGLE;

  // Normalize value to 0..1
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const currentAngle = START_ANGLE + normalized * ANGLE_RANGE;

  // Pointer drag calculation
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = { startY: e.clientY, startVal: value };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dialRef.current) return;

    // We support both circular angle tracking and vertical swipe sensitivity
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    // Angle tracking
    let deg = Math.atan2(dy, dx) * (180 / Math.PI);
    if (deg < 0) deg += 360;

    // Map 0-360 relative to START_ANGLE (135 deg)
    let relative = (deg - START_ANGLE + 360) % 360;
    if (relative > ANGLE_RANGE) {
      // In the dead zone at bottom
      const distToStart = 360 - relative;
      const distToEnd = relative - ANGLE_RANGE;
      relative = distToStart < distToEnd ? 0 : ANGLE_RANGE;
    }

    const ratio = Math.max(0, Math.min(1, relative / ANGLE_RANGE));
    let newVal = min + ratio * (max - min);

    // Apply step
    if (step > 0) {
      newVal = Math.round(newVal / step) * step;
    }
    newVal = Math.max(min, Math.min(max, newVal));
    onChange(Number(newVal.toFixed(2)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleDoubleClick = () => {
    onChange(defaultValue);
  };

  // SVG Arc calculation
  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return ["M", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y].join(" ");
  };

  // Circumference calculation for stroke dash
  const trackArc = describeArc(center, center, radius, START_ANGLE, END_ANGLE);
  const activeArc = describeArc(center, center, radius, START_ANGLE, currentAngle);

  // Pointer indicator line
  const needlePoint = polarToCartesian(center, center, radius - 4, currentAngle);

  return (
    <div
      className={cn("flex flex-col items-center gap-1 select-none", className)}
      title={tooltip || `${label || "Dial"}: ${value}${unit} (Drag to adjust, double-click to reset)`}
    >
      {label && (
        <span className="text-[9.5px] font-bold text-slate-300 uppercase tracking-wider text-center truncate max-w-full">
          {label}
        </span>
      )}

      {/* Rotary Dial Knob */}
      <div
        ref={dialRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        style={{ width: diameter, height: diameter }}
        className={cn(
          "relative rounded-full cursor-grab active:cursor-grabbing transition-transform touch-none shadow-lg",
          isDragging && "scale-105"
        )}
      >
        <svg width={diameter} height={diameter} className="overflow-visible">
          {/* Background Track */}
          <path
            d={trackArc}
            fill="none"
            stroke="rgba(30, 41, 59, 0.8)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Filled Arc Track */}
          {normalized > 0.005 && (
            <path
              d={activeArc}
              fill="none"
              stroke={accentColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 4px ${accentColor}80)`,
              }}
            />
          )}

          {/* Tick Marks */}
          {showTicks &&
            [0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const tickAngle = START_ANGLE + pct * ANGLE_RANGE;
              const inner = polarToCartesian(center, center, radius + strokeWidth + 2, tickAngle);
              const outer = polarToCartesian(center, center, radius + strokeWidth + 5, tickAngle);
              return (
                <line
                  key={i}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke={pct <= normalized ? accentColor : "rgba(100, 116, 139, 0.5)"}
                  strokeWidth={1}
                />
              );
            })}
        </svg>

        {/* Center Knob Cap */}
        <div
          style={{
            width: diameter - strokeWidth * 2 - 8,
            height: diameter - strokeWidth * 2 - 8,
            top: strokeWidth + 4,
            left: strokeWidth + 4,
            background: "radial-gradient(circle at 35% 35%, #1e293b 0%, #0f172a 70%, #020617 100%)",
            boxShadow: `inset 0 1px 2px rgba(255,255,255,0.15), 0 3px 6px rgba(0,0,0,0.6)`,
          }}
          className="absolute rounded-full border border-slate-700/80 flex items-center justify-center pointer-events-none"
        >
          {/* Needle / Indicator Dot */}
          <div
            style={{
              transform: `rotate(${currentAngle - 90}deg)`,
              transformOrigin: "center center",
            }}
            className="w-full h-full absolute inset-0 flex items-start justify-center pt-1"
          >
            <div
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 0 6px ${accentColor}`,
              }}
              className="w-1.5 h-1.5 rounded-full"
            />
          </div>

          {/* Subtle center icon or dot */}
          <div className="w-2 h-2 rounded-full bg-slate-800 border border-slate-600/50" />
        </div>
      </div>

      {/* Readout Display */}
      <div className="flex items-center gap-1 font-mono text-[9.5px]">
        <span className="font-bold text-slate-200" style={{ color: accentColor }}>
          {value.toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)}
        </span>
        {unit && <span className="text-slate-400 text-[8.5px]">{unit}</span>}
      </div>
    </div>
  );
};

export interface DialControlProps extends RadialColorPickerProps {
  // Can wrap RadialColorPicker with standard button customizer appearance
  variant?: "color" | "knob";
  knobProps?: Omit<RotaryDialKnobProps, "className">;
}

/**
 * Universal Dial Control
 * Renders either the Radial Color Dial (similar to Button Customizer) or the Rotary Knob Dial
 */
export const DialControl: React.FC<DialControlProps> = ({
  variant = "color",
  knobProps,
  ...colorPickerProps
}) => {
  if (variant === "knob" && knobProps) {
    return <RotaryDialKnob {...knobProps} />;
  }

  return (
    <RadialColorPicker
      compactTrigger={true}
      buttonLabel={colorPickerProps.buttonLabel || "Dial"}
      buttonClassName={cn(
        "px-2.5 py-1 text-[10px] font-bold bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-xl cursor-pointer shadow-xs transition-all flex items-center gap-1.5 active:scale-95",
        colorPickerProps.buttonClassName
      )}
      {...colorPickerProps}
    />
  );
};

export default DialControl;
