import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Palette,
  RotateCcw,
  Check,
  Copy,
  Pipette,
  Sparkles,
  Square,
  Type,
  PaintBucket,
  Sun,
  Disc,
  X,
} from "lucide-react";
import type { ButtonCustomConfig } from "../types/buttonCustomization";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableButton } from "./CustomizableButton";

export type ColorTargetProperty =
  | "backgroundColor"
  | "textColor"
  | "borderColor"
  | "accentColor";

export interface RadialColorPickerProps {
  currentConfig?: ButtonCustomConfig;
  onUpdateStyle?: (styleUpdates: Partial<ButtonCustomConfig>) => void;
  selectedCount?: number;
  className?: string;
  // Standalone direct color mode:
  color?: string;
  onChange?: (color: string) => void;
  onSubmit?: (color: string) => void;
  label?: string;
  initialTarget?: ColorTargetProperty;
  showChannelButtons?: boolean;
  buttonLabel?: string;
  buttonClassName?: string;
  compactTrigger?: boolean;
  style?: React.CSSProperties;
}

// Helpers for HSL <-> Hex color conversion
function hslToHex(h: number, s: number, l: number, a: number = 1): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const aVal = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) =>
    lNorm - aVal * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  const toHex = (x: number) => {
    const val = Math.max(0, Math.min(255, Math.round(x * 255)));
    return val.toString(16).padStart(2, "0");
  };

  const r = toHex(f(0));
  const g = toHex(f(8));
  const b = toHex(f(4));

  if (a < 0.999) {
    const alphaHex = Math.max(0, Math.min(255, Math.round(a * 255)))
      .toString(16)
      .padStart(2, "0");
    return `#${r}${g}${b}${alphaHex}`.toLowerCase();
  }
  return `#${r}${g}${b}`.toLowerCase();
}

function hexToHsl(hexStr?: string): { h: number; s: number; l: number; a: number } {
  if (!hexStr || hexStr === "transparent") {
    return { h: 180, s: 100, l: 50, a: hexStr === "transparent" ? 0 : 1 };
  }

  let clean = hexStr.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  } else if (clean.length === 4) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }

  let a = 1;
  if (clean.length === 8) {
    a = parseInt(clean.slice(6, 8), 16) / 255;
    clean = clean.slice(0, 6);
  }

  const r = parseInt(clean.slice(0, 2), 16) / 255 || 0;
  const g = parseInt(clean.slice(2, 4), 16) / 255 || 0;
  const b = parseInt(clean.slice(4, 6), 16) / 255 || 0;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = h * 60;
  }

  return {
    h: Math.round(h) % 360,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a: Math.round(a * 100) / 100,
  };
}

export const TARGET_PROPERTIES: Array<{
  id: ColorTargetProperty;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultFallback: string;
}> = [
  {
    id: "backgroundColor",
    label: "Background",
    shortLabel: "Bg",
    icon: PaintBucket,
    defaultFallback: "#064e3b",
  },
  {
    id: "textColor",
    label: "Text & Icon",
    shortLabel: "Text",
    icon: Type,
    defaultFallback: "#ffffff",
  },
  {
    id: "borderColor",
    label: "Border Outline",
    shortLabel: "Border",
    icon: Square,
    defaultFallback: "#00f0ff",
  },
  {
    id: "accentColor",
    label: "Accent Glow",
    shortLabel: "Accent",
    icon: Sparkles,
    defaultFallback: "#10b981",
  },
];

export const MINIMAL_SWATCHES = [
  { label: "Pure White", color: "#ffffff" },
  { label: "Obsidian", color: "#090d16" },
  { label: "Cyan", color: "#00f0ff" },
  { label: "Emerald", color: "#10b981" },
  { label: "Amber", color: "#f59e0b" },
  { label: "Rose", color: "#f43f5e" },
  { label: "Purple", color: "#a855f7" },
  { label: "Transparent", color: "transparent" },
];

export interface StyleColorwayPreset {
  label: string;
  bg: string;
  text: string;
  border: string;
  accent: string;
}

export const STYLE_COLORWAY_PRESETS: StyleColorwayPreset[] = [
  { label: "Neon Cyan", bg: "#082f49", text: "#38bdf8", border: "#00f0ff", accent: "#00f0ff" },
  { label: "Emerald Mint", bg: "#064e3b", text: "#6ee7b7", border: "#10b981", accent: "#10b981" },
  { label: "Amber Sunset", bg: "#451a03", text: "#fcd34d", border: "#f59e0b", accent: "#f59e0b" },
  { label: "Cyber Fuchsia", bg: "#4c0519", text: "#f472b6", border: "#ec4899", accent: "#ec4899" },
  { label: "Royal Violet", bg: "#2e1065", text: "#c084fc", border: "#8b5cf6", accent: "#8b5cf6" },
  { label: "Slate Minimal", bg: "#0f172a", text: "#e2e8f0", border: "#334155", accent: "#64748b" },
  { label: "Clean Ghost", bg: "transparent", text: "#ffffff", border: "#475569", accent: "transparent" },
  { label: "Vibrant Ruby", bg: "#4c0519", text: "#fda4af", border: "#f43f5e", accent: "#f43f5e" },
];

/**
 * Minimalist & Effective Radial Color Picker
 * Renders a compact single button trigger that opens a sleek drawing-tool style radial dial modal.
 * User tweaks hue/saturation on the circular dial, adjusts brightness/alpha, and hits Submit.
 */
export const RadialColorPicker: React.FC<RadialColorPickerProps> = ({
  currentConfig,
  onUpdateStyle,
  selectedCount = 1,
  className = "",
  color,
  onChange,
  onSubmit,
  label = "Radial Dial",
  initialTarget = "backgroundColor",
  showChannelButtons = true,
  buttonLabel,
  buttonClassName = "",
  compactTrigger = false,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState<ColorTargetProperty>(initialTarget);

  // Snapshot of styles when modal opened so Cancel can cleanly revert
  const snapshotConfigRef = useRef<ButtonCustomConfig | null>(null);
  const snapshotColorRef = useRef<string>("#00f0ff");

  // Determine current color for active target or standalone color
  const resolveCurrentColor = useCallback(
    (target: ColorTargetProperty): string => {
      if (color !== undefined) {
        return color;
      }
      if (currentConfig && currentConfig[target] !== undefined) {
        return currentConfig[target] || "transparent";
      }
      const fallback =
        TARGET_PROPERTIES.find((p) => p.id === target)?.defaultFallback || "#00f0ff";
      return fallback;
    },
    [color, currentConfig]
  );

  const currentColorString = resolveCurrentColor(activeTarget);

  // Internal color state
  const [hue, setHue] = useState<number>(180);
  const [saturation, setSaturation] = useState<number>(100);
  const [lightness, setLightness] = useState<number>(50);
  const [alpha, setAlpha] = useState<number>(1);
  const [hexInput, setHexInput] = useState<string>("#00F0FF");
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync internal HSL when active target changes or modal opens
  const syncFromColorString = useCallback((colStr: string) => {
    if (colStr === "transparent") {
      setAlpha(0);
      setHexInput("transparent");
    } else {
      const parsed = hexToHsl(colStr);
      setHue(parsed.h);
      setSaturation(parsed.s);
      setLightness(parsed.l);
      setAlpha(parsed.a);
      setHexInput(colStr.toUpperCase());
    }
  }, []);

  const handleOpen = (target?: ColorTargetProperty) => {
    const nextTarget = target || activeTarget;
    if (target) {
      setActiveTarget(target);
    }
    const col = resolveCurrentColor(nextTarget);
    snapshotColorRef.current = col;
    if (currentConfig) {
      snapshotConfigRef.current = { ...currentConfig };
    }
    syncFromColorString(col);
    setIsOpen(true);
  };

  // Derived active hex
  const activeHex = useMemo(() => {
    if (alpha <= 0.01) return "transparent";
    return hslToHex(hue, saturation, lightness, alpha);
  }, [hue, saturation, lightness, alpha]);

  // Live update while tweaking inside dial
  const applyLiveColor = useCallback(
    (newHex: string) => {
      if (onChange) {
        onChange(newHex);
      }
      if (onUpdateStyle) {
        onUpdateStyle({ [activeTarget]: newHex });
      }
    },
    [activeTarget, onChange, onUpdateStyle]
  );

  // Render the radial color wheel canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 180;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 8;

    ctx.clearRect(0, 0, size, size);

    // 1. Conic chromatic rainbow ring
    if (typeof ctx.createConicGradient === "function") {
      const conic = ctx.createConicGradient(0, cx, cy);
      conic.addColorStop(0 / 6, "#ff0000");
      conic.addColorStop(1 / 6, "#ffff00");
      conic.addColorStop(2 / 6, "#00ff00");
      conic.addColorStop(3 / 6, "#00ffff");
      conic.addColorStop(4 / 6, "#0000ff");
      conic.addColorStop(5 / 6, "#ff00ff");
      conic.addColorStop(1, "#ff0000");

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = conic;
      ctx.fill();
    } else {
      ctx.save();
      for (let deg = 0; deg < 360; deg += 1) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, (deg * Math.PI) / 180, ((deg + 1.5) * Math.PI) / 180);
        ctx.closePath();
        ctx.fillStyle = `hsl(${deg}, 100%, 50%)`;
        ctx.fill();
      }
    }

    // 2. Radial white desaturation gradient from center
    const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    radial.addColorStop(0, "rgba(255, 255, 255, 1)");
    radial.addColorStop(0.12, "rgba(255, 255, 255, 0.92)");
    radial.addColorStop(0.85, "rgba(255, 255, 255, 0.08)");
    radial.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = radial;
    ctx.fill();

    // 3. Crisp rings
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(15, 23, 42, 0.8)";
    ctx.stroke();

    // 4. Selector thumb crosshair
    const angleRad = (hue * Math.PI) / 180;
    const dist = (saturation / 100) * radius;
    const px = cx + Math.cos(angleRad) * dist;
    const py = cy + Math.sin(angleRad) * dist;

    // Outer ring with glow
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    // Inner thumb showing color
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = hslToHex(hue, saturation, lightness, 1);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
    ctx.stroke();

    ctx.restore();
  }, [isOpen, hue, saturation, lightness]);

  // Pointer coordination for radial dial
  const handlePointerCoord = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const size = rect.width;
      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 8;

      const dx = x - cx;
      const dy = y - cy;

      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < 0) angle += 360;

      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), radius);
      const sat = Math.round((dist / radius) * 100);
      const newHue = Math.round(angle) % 360;

      setHue(newHue);
      setSaturation(sat);

      const computed =
        alpha <= 0.01 ? "transparent" : hslToHex(newHue, sat, lightness, alpha);
      setHexInput(computed.toUpperCase());
      applyLiveColor(computed);
    },
    [alpha, lightness, applyLiveColor]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    handlePointerCoord(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    handlePointerCoord(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      handlePointerCoord(e.clientX, e.clientY);
    }
  };

  // Lightness Slider
  const handleLightnessChange = (newL: number) => {
    setLightness(newL);
    const computed =
      alpha <= 0.01 ? "transparent" : hslToHex(hue, saturation, newL, alpha);
    setHexInput(computed.toUpperCase());
    applyLiveColor(computed);
  };

  // Alpha Slider
  const handleAlphaChange = (newA: number) => {
    setAlpha(newA);
    const computed =
      newA <= 0.01 ? "transparent" : hslToHex(hue, saturation, lightness, newA);
    setHexInput(computed === "transparent" ? "TRANSPARENT" : computed.toUpperCase());
    applyLiveColor(computed);
  };

  // Direct Hex Input Commit
  const handleHexSubmit = (val: string) => {
    setHexInput(val);
    const trimmed = val.trim().toLowerCase();
    if (trimmed === "transparent") {
      setAlpha(0);
      applyLiveColor("transparent");
      return;
    }
    if (/^#?([0-9a-f]{3,8})$/i.test(trimmed)) {
      const normalized = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
      const parsed = hexToHsl(normalized);
      setHue(parsed.h);
      setSaturation(parsed.s);
      setLightness(parsed.l);
      setAlpha(parsed.a);
      applyLiveColor(normalized);
    }
  };

  // Pick Swatch
  const handleSelectSwatch = (swatchColor: string) => {
    if (swatchColor === "transparent") {
      setAlpha(0);
      setHexInput("TRANSPARENT");
      applyLiveColor("transparent");
      return;
    }
    const parsed = hexToHsl(swatchColor);
    setHue(parsed.h);
    setSaturation(parsed.s);
    setLightness(parsed.l);
    setAlpha(parsed.a);
    setHexInput(swatchColor.toUpperCase());
    applyLiveColor(swatchColor);
  };

  // Pick Colorway Preset
  const handleSelectColorwayPreset = (preset: StyleColorwayPreset) => {
    if (onUpdateStyle && currentConfig) {
      onUpdateStyle({
        backgroundColor: preset.bg,
        textColor: preset.text,
        borderColor: preset.border,
        accentColor: preset.accent,
      });
    }
    const targetColor =
      activeTarget === "backgroundColor"
        ? preset.bg
        : activeTarget === "textColor"
        ? preset.text
        : activeTarget === "borderColor"
        ? preset.border
        : preset.accent;

    handleSelectSwatch(targetColor);
  };

  // Browser EyeDropper API
  const handleEyeDropper = async () => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          handleSelectSwatch(result.sRGBHex);
        }
      } catch {}
    }
  };

  // Copy Hex
  const handleCopyHex = () => {
    navigator.clipboard?.writeText(activeHex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  // Cancel & Revert
  const handleCancel = () => {
    if (snapshotConfigRef.current && onUpdateStyle) {
      onUpdateStyle(snapshotConfigRef.current);
    } else if (snapshotColorRef.current) {
      applyLiveColor(snapshotColorRef.current);
    }
    setIsOpen(false);
  };

  // Submit and lock in changes
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(activeHex);
    }
    if (onUpdateStyle) {
      onUpdateStyle({ [activeTarget]: activeHex });
    }
    setIsOpen(false);
  };

  // Switch property target inside the popup
  const handleSwitchTargetInModal = (target: ColorTargetProperty) => {
    setActiveTarget(target);
    const col = resolveCurrentColor(target);
    syncFromColorString(col);
  };

  // Escape & Enter keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      } else if (e.key === "Enter" && !e.shiftKey) {
        // Only submit if not in a text area
        if ((e.target as HTMLElement)?.tagName !== "TEXTAREA") {
          e.preventDefault();
          handleSubmit();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeHex]);

  const activeDisplayColor = currentColorString;

  return (
    <div data-ibc-ui="true" className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      {/* The Small Single Button to pop up the radial */}
      <CustomizableButton
        buttonId="radial_color_picker_btn_11"
        defaultIcon={<Disc className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-45 transition-transform shrink-0" />}
        type="button"
onClick={() => handleOpen()}
style={style}
className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-cyan-500/50 transition-all cursor-pointer shadow-xs group ${buttonClassName}`}
title={uiText("components_radial_color_picker.button.open_radial_color_dial_adjust_color_on_the_w.title", "Open Radial Color Dial: adjust color on the wheel, then submit")}
      >
          {() => (
              <>
                <div
          className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-xs relative overflow-hidden shrink-0"
          style={{
            backgroundColor:
              activeDisplayColor === "transparent" ? "#020617" : activeDisplayColor,
          }}
        >
          {activeDisplayColor === "transparent" && (
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_40%,#ef4444_45%,#ef4444_55%,transparent_60%)]" />
          )}
        </div>
              <span className="text-xs font-semibold text-slate-200">
          {buttonLabel || label}
        </span>
              <span className="text-[10px] font-mono font-bold text-cyan-400">
          {activeDisplayColor === "transparent"
            ? "NONE"
            : activeDisplayColor.toUpperCase()}
        </span>
              </>
            )}
      </CustomizableButton>

      {/* Optional Compact Channel Trigger Pills (Bg, Text, Border, Accent) */}
      {!compactTrigger && showChannelButtons && currentConfig && (
        <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800/80">
          {TARGET_PROPERTIES.map((prop) => {
            const val = currentConfig[prop.id] || prop.defaultFallback;
            const isCurrentActive = activeTarget === prop.id;
            return (
              <CustomizableButton
                buttonId="radial_color_picker_btn_10"
                key={prop.id}
type="button"
onClick={() => handleOpen(prop.id)}
className={`px-1.5 py-0.5 rounded-lg flex items-center gap-1 text-[10px] font-medium transition-colors cursor-pointer ${
                  isCurrentActive
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
title={`Open Radial Dial for ${prop.label}`}
              >
                  {() => (
                      <>
                        <div
                  className="w-2.5 h-2.5 rounded-full border border-slate-700 shrink-0"
                  style={{
                    backgroundColor: val === "transparent" ? "#020617" : val,
                  }}
                />
                      <span>{prop.shortLabel}</span>
                      </>
                    )}
              </CustomizableButton>
            );
          })}
        </div>
      )}

      {/* Floating Radial Dial Modal Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          data-ibc-ui="true"
          className="fixed inset-0 z-[10080] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 select-none animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancel();
            }
          }}
        >
          <div className="w-full max-w-[324px] bg-[#090d19] border border-cyan-500/30 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col gap-3 text-slate-200 relative animate-in zoom-in-95 duration-150">
            {/* Header: Title + Target Name + Close */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-cyan-500/15 text-cyan-400">
                  <Disc className="w-4 h-4 animate-[spin_10s_linear_infinite]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{uiText("components_radial_color_picker.span.radial_color_dial", "Radial Color Dial")}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-500/30">
                      360°
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {TARGET_PROPERTIES.find((p) => p.id === activeTarget)?.label || "Color"}
                    {selectedCount > 1 && ` • ${selectedCount} elements`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {typeof window !== "undefined" && "EyeDropper" in window && (
                  <CustomizableButton
                    buttonId="radial_color_picker_btn_9"
                    defaultIcon={<Pipette className="w-3.5 h-3.5" />}
                    type="button"
onClick={handleEyeDropper}
className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
title={uiText("components_radial_color_picker.button.eyedropper_sample_color_from_screen.title", "Eyedropper: Sample color from screen")}
                  />
                )}
                <CustomizableButton
                  buttonId="radial_color_picker_btn_8"
                  defaultIcon={<X className="w-3.5 h-3.5" />}
                  type="button"
onClick={handleCancel}
className="p-1 rounded-lg text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
title={uiText("components_radial_color_picker.button.cancel_and_close.title", "Cancel and close")}
                />
              </div>
            </div>

            {/* Target Property Switcher (if multi-property config exists) */}
            {currentConfig && (
              <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl bg-slate-950 border border-slate-800/80">
                {TARGET_PROPERTIES.map((prop) => {
                  const isActive = activeTarget === prop.id;
                  const val = currentConfig[prop.id] || prop.defaultFallback;
                  return (
                    <CustomizableButton
                      buttonId="radial_color_picker_btn_7"
                      key={prop.id}
type="button"
onClick={() => handleSwitchTargetInModal(prop.id)}
className={`px-1.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isActive
                          ? "bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-xs"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                        {() => (
                            <>
                              <div
                        className="w-2 h-2 rounded-full border border-slate-600 shrink-0"
                        style={{
                          backgroundColor: val === "transparent" ? "#020617" : val,
                        }}
                      />
                            <span>{prop.shortLabel}</span>
                            </>
                          )}
                    </CustomizableButton>
                  );
                })}
              </div>
            )}

            {/* Canvas Wheel Core */}
            <div className="flex flex-col items-center justify-center py-0.5">
              <div className="relative p-1 rounded-full bg-slate-950 border border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="w-[180px] h-[180px] rounded-full cursor-crosshair touch-none"
                  title={uiText("components_radial_color_picker.canvas.drag_around_the_wheel_to_choose_hue_and_satu.title", "Drag around the wheel to choose Hue and Saturation")}
                />
                {/* Center Hub Indicator */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-white/50 pointer-events-none shadow-md overflow-hidden"
                  style={{
                    backgroundColor:
                      activeHex === "transparent" ? "#020617" : activeHex,
                  }}
                >
                  {activeHex === "transparent" && (
                    <div className="w-full h-full bg-[linear-gradient(45deg,transparent_40%,#ef4444_45%,#ef4444_55%,transparent_60%)]" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 mt-1.5 text-[9.5px] font-mono text-slate-400">
                <span>{uiText("components_radial_color_picker.span.h", "H: ")}{hue}°</span>
                <span>{uiText("components_radial_color_picker.span.s", "S: ")}{saturation}%</span>
                <span>{uiText("components_radial_color_picker.span.l", "L: ")}{lightness}%</span>
                <span>{uiText("components_radial_color_picker.span.a", "A: ")}{Math.round(alpha * 100)}%</span>
              </div>
            </div>

            {/* Sliders: Lightness & Opacity */}
            <div className="space-y-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
              {/* Lightness Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-300 font-medium flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-400" />
                    <span>{uiText("components_radial_color_picker.span.brightness", "Brightness:")}</span>
                  </span>
                  <span className="font-mono text-slate-400">{lightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={lightness}
                  onChange={(e) => handleLightnessChange(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #000000 0%, ${hslToHex(
                      hue,
                      saturation,
                      50,
                      1
                    )} 50%, #ffffff 100%)`,
                  }}
                  className="w-full h-2.5 rounded-lg appearance-none cursor-pointer border border-slate-700"
                />
              </div>

              {/* Opacity / Alpha Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-300 font-medium flex items-center gap-1">
                    <Palette className="w-3 h-3 text-cyan-400" />
                    <span>{uiText("components_radial_color_picker.span.opacity", "Opacity:")}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <CustomizableButton
                      buttonId="radial_color_picker_btn_6"
                      type="button"
onClick={() => handleAlphaChange(0)}
className="text-[9px] px-1 py-0.2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer"
                    >
                        {() => (
                            <>
                              {uiText("components_radial_color_picker.button.transp", "Transp")}
                            </>
                          )}
                    </CustomizableButton>
                    <span className="font-mono text-slate-400">
                      {Math.round(alpha * 100)}%
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(alpha * 100)}
                  onChange={(e) => handleAlphaChange(Number(e.target.value) / 100)}
                  style={{
                    background: `linear-gradient(to right, transparent 0%, ${hslToHex(
                      hue,
                      saturation,
                      lightness,
                      1
                    )} 100%)`,
                  }}
                  className="w-full h-2.5 rounded-lg appearance-none cursor-pointer border border-slate-700"
                />
              </div>
            </div>

            {/* Split Swatch (Before vs After) & Hex Input */}
            <div className="flex items-center gap-2">
              {/* Dual Swatch */}
              <div
                className="w-16 h-8 rounded-xl border border-slate-700 flex overflow-hidden shrink-0 shadow-inner cursor-pointer"
                title={uiText("components_radial_color_picker.div.click_left_side_to_restore_original_color.title", "Click left side to restore original color")}
              >
                {/* Original / Previous */}
                <div
                  onClick={() => handleSelectSwatch(snapshotColorRef.current)}
                  className="w-1/2 h-full relative"
                  style={{
                    backgroundColor:
                      snapshotColorRef.current === "transparent"
                        ? "#020617"
                        : snapshotColorRef.current,
                  }}
                  title={uiText("components_radial_color_picker.div.previous_color_click_to_restore.title", "Previous color (click to restore)")}
                >
                  {snapshotColorRef.current === "transparent" && (
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_40%,#ef4444_45%,#ef4444_55%,transparent_60%)]" />
                  )}
                </div>
                {/* Newly Picked */}
                <div
                  className="w-1/2 h-full relative border-l border-white/20"
                  style={{
                    backgroundColor:
                      activeHex === "transparent" ? "#020617" : activeHex,
                  }}
                  title={uiText("components_radial_color_picker.div.adjusted_color.title", "Adjusted color")}
                >
                  {activeHex === "transparent" && (
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_40%,#ef4444_45%,#ef4444_55%,transparent_60%)]" />
                  )}
                </div>
              </div>

              {/* Hex Input */}
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                  #
                </span>
                <input
                  type="text"
                  value={hexInput.replace("#", "")}
                  onChange={(e) => handleHexSubmit(`#${e.target.value}`)}
                  placeholder={uiText("components_radial_color_picker.input.00f0ff.placeholder", "00F0FF")}
                  className="w-full pl-6 pr-7 py-1.5 bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl text-xs font-mono font-bold text-cyan-300 uppercase focus:outline-none"
                />
                <CustomizableButton
                  buttonId="radial_color_picker_btn_5"
                  type="button"
onClick={handleCopyHex}
className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
title={uiText("components_radial_color_picker.button.copy_hex.title", "Copy Hex")}
                >
                    {() => (
                        <>
                          {copied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>

            {/* Drawing tool fast swatches */}
            <div className="flex items-center justify-between gap-1">
              {MINIMAL_SWATCHES.map((swatch) => (
                <CustomizableButton
                  buttonId="radial_color_picker_btn_4"
                  key={swatch.label}
type="button"
onClick={() => handleSelectSwatch(swatch.color)}
style={{
                    backgroundColor:
                      swatch.color === "transparent" ? "#020617" : swatch.color,
                  }}
className="w-6 h-6 rounded-lg border border-slate-800 hover:border-white transition-all cursor-pointer relative overflow-hidden shrink-0 shadow-xs hover:scale-110"
title={swatch.label}
                >
                    {() => (
                        <>
                          {swatch.color === "transparent" && (
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_40%,#ef4444_45%,#ef4444_55%,transparent_60%)]" />
                  )}
                        </>
                      )}
                </CustomizableButton>
              ))}
            </div>

            {/* Quick 1-Click Style Colorway Presets in Color Dial */}
            <div className="space-y-1.5 pt-1.5 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{uiText("components_radial_color_picker.span.colorway_presets", "Colorway Presets:")}</span>
                </span>
                <span className="text-[8.5px] font-mono text-cyan-400">{uiText("components_radial_color_picker.span.1_click_harmonized", "1-click harmonized")}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {STYLE_COLORWAY_PRESETS.map((preset) => (
                  <CustomizableButton
                    buttonId="radial_color_picker_btn_3"
                    key={preset.label}
type="button"
onClick={() => handleSelectColorwayPreset(preset)}
className="px-1.5 py-1 rounded-lg border text-[9px] font-bold text-center transition-all cursor-pointer hover:scale-105 shadow-xs truncate flex items-center justify-center gap-1"
style={{
                      backgroundColor: preset.bg === "transparent" ? "#090d19" : preset.bg,
                      color: preset.text,
                      borderColor: preset.border,
                      boxShadow: `0 0 6px ${preset.accent}30`,
                    }}
title={`${preset.label}: Bg ${preset.bg}, Text ${preset.text}, Border ${preset.border}, Accent ${preset.accent}`}
                  >
                      {() => (
                          <>
                            <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: preset.accent }}
                    />
                          <span className="truncate">{preset.label}</span>
                          </>
                        )}
                  </CustomizableButton>
                ))}
              </div>
            </div>

            {/* Actions: Cancel & Submit Buttons */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
              <CustomizableButton
                buttonId="radial_color_picker_btn_2"
                type="button"
onClick={handleCancel}
className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
              >
                  {() => (
                      <>
                        {uiText("components_radial_color_picker.button.cancel", "Cancel")}
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="radial_color_picker_btn_1"
                defaultIcon={<Check className="w-3.5 h-3.5" />}
                type="button"
onClick={handleSubmit}
className="flex-[1.5] py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-950/50 flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02]"
              >
                  {() => (
                      <>
                        <span>{uiText("components_radial_color_picker.span.submit_color", "Submit Color")}</span>
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadialColorPicker;
