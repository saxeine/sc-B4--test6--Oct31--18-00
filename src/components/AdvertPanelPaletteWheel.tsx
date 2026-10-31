import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Palette,
  Sun,
  Disc,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableButton } from "./CustomizableButton";

export interface PanelStyleValues {
  borderColor?: string;
  backgroundColor?: string;
  accentColor?: string;
  textColor?: string;
}

export interface AdvertPanelPaletteWheelProps {
  selectedBoxId: number;
  totalBoxes: number;
  currentStyle: PanelStyleValues;
  onUpdateStyle: (updates: PanelStyleValues) => void;
  onApplyToAllPanels: (style: PanelStyleValues) => void;
}

export type PaletteChannel = "borderColor" | "backgroundColor" | "accentColor" | "textColor";

interface ChannelConfig {
  id: PaletteChannel;
  label: string;
  shortLabel: string;
  defaultColor: string;
}

const CHANNELS: ChannelConfig[] = [
  { id: "borderColor", label: "Border Color", shortLabel: "Border", defaultColor: "#10b981" },
  { id: "backgroundColor", label: "Background Tint", shortLabel: "Background", defaultColor: "transparent" },
  { id: "accentColor", label: "Accent / Glow", shortLabel: "Accent", defaultColor: "#10b981" },
  { id: "textColor", label: "Text / Badge", shortLabel: "Text", defaultColor: "#38bdf8" },
];

const PANEL_BACKGROUND_SWATCHES = [
  { label: "None", hex: "transparent" },
  { label: "Dark Slate", hex: "#0f172a" },
  { label: "Dark Cyan", hex: "#082f49" },
  { label: "Dark Indigo", hex: "#1e1b4b" },
  { label: "Dark Purple", hex: "#2e1065" },
  { label: "Dark Amber", hex: "#451a03" },
  { label: "Dark Red", hex: "#4c0519" },
];

const COLORWAY_PRESETS: Array<{
  name: string;
  style: PanelStyleValues;
}> = [
  {
    name: "Cyber Fuchsia",
    style: {
      borderColor: "#d946ef",
      backgroundColor: "#160524",
      accentColor: "#d946ef",
      textColor: "#f5d0fe",
    },
  },
  {
    name: "Electric Cyan",
    style: {
      borderColor: "#06b6d4",
      backgroundColor: "#031726",
      accentColor: "#06b6d4",
      textColor: "#cffafe",
    },
  },
  {
    name: "Emerald Matrix",
    style: {
      borderColor: "#10b981",
      backgroundColor: "#031d13",
      accentColor: "#10b981",
      textColor: "#d1fae5",
    },
  },
  {
    name: "Solar Amber",
    style: {
      borderColor: "#f59e0b",
      backgroundColor: "#1f0f03",
      accentColor: "#f59e0b",
      textColor: "#fef3c7",
    },
  },
  {
    name: "Slate Minimal",
    style: {
      borderColor: "#475569",
      backgroundColor: "#0b1220",
      accentColor: "#94a3b8",
      textColor: "#e2e8f0",
    },
  },
  {
    name: "Deep Violet",
    style: {
      borderColor: "#8b5cf6",
      backgroundColor: "#140c24",
      accentColor: "#8b5cf6",
      textColor: "#ddd6fe",
    },
  },
];

// Color conversions
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
    clean = clean.split("").map((c) => c + c).join("");
  } else if (clean.length === 4) {
    clean = clean.split("").map((c) => c + c).join("");
  }

  let a = 1;
  if (clean.length === 8) {
    a = parseInt(clean.slice(6, 8), 16) / 255;
    clean = clean.slice(0, 6);
  }

  const r = (parseInt(clean.slice(0, 2), 16) || 0) / 255;
  const g = (parseInt(clean.slice(2, 4), 16) || 0) / 255;
  const b = (parseInt(clean.slice(4, 6), 16) || 0) / 255;

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
    a,
  };
}

export const AdvertPanelPaletteWheel: React.FC<AdvertPanelPaletteWheelProps> = ({
  selectedBoxId,
  totalBoxes,
  currentStyle,
  onUpdateStyle,
  onApplyToAllPanels,
}) => {
  const [activeChannel, setActiveChannel] = useState<PaletteChannel>("borderColor");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [copiedHex, setCopiedHex] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active color string for the currently selected channel
  const rawColor =
    currentStyle[activeChannel] ||
    CHANNELS.find((c) => c.id === activeChannel)?.defaultColor ||
    "#10b981";

  const { h: initialH, s: initialS, l: initialL, a: initialA } = hexToHsl(rawColor);
  const [hue, setHue] = useState<number>(initialH);
  const [saturation, setSaturation] = useState<number>(initialS);
  const [lightness, setLightness] = useState<number>(initialL);
  const [alpha, setAlpha] = useState<number>(initialA);
  const [hexInput, setHexInput] = useState<string>(rawColor.toUpperCase());

  // Keep slider/wheel state in sync when activeChannel or currentStyle updates externally
  useEffect(() => {
    const { h, s, l, a } = hexToHsl(rawColor);
    setHue(h);
    setSaturation(s);
    setLightness(l);
    setAlpha(a);
    setHexInput(rawColor === "transparent" ? "NONE" : rawColor.toUpperCase());
  }, [rawColor, activeChannel]);

  // Apply color change to the active channel
  const applyColor = useCallback(
    (colorHex: string) => {
      onUpdateStyle({ [activeChannel]: colorHex });
    },
    [activeChannel, onUpdateStyle]
  );

  // Render the radial color wheel canvas
  useEffect(() => {
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

    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fillStyle = hslToHex(hue, saturation, 50, 1);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, py, 7.5, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
    ctx.stroke();

    ctx.restore();
  }, [hue, saturation, lightness]);

  // Pointer coordination for radial wheel
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
      applyColor(computed);
    },
    [alpha, lightness, applyColor]
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

  const handleLightnessChange = (newVal: number) => {
    setLightness(newVal);
    const computed =
      alpha <= 0.01 ? "transparent" : hslToHex(hue, saturation, newVal, alpha);
    setHexInput(computed.toUpperCase());
    applyColor(computed);
  };

  const handleAlphaChange = (newAlpha: number) => {
    setAlpha(newAlpha);
    const computed =
      newAlpha <= 0.01 ? "transparent" : hslToHex(hue, saturation, lightness, newAlpha);
    setHexInput(computed.toUpperCase());
    applyColor(computed);
  };

  const handleHexInputChange = (val: string) => {
    setHexInput(val);
    let clean = val.trim();
    if (clean.toLowerCase() === "none" || clean.toLowerCase() === "transparent") {
      setAlpha(0);
      applyColor("transparent");
      return;
    }
    if (!clean.startsWith("#")) clean = "#" + clean;
    if (/^#[0-9a-fA-F]{3,8}$/.test(clean)) {
      const { h, s, l, a } = hexToHsl(clean);
      setHue(h);
      setSaturation(s);
      setLightness(l);
      setAlpha(a);
      applyColor(clean.toLowerCase());
    }
  };

  const handleCopyHex = () => {
    const textToCopy = rawColor === "transparent" ? "transparent" : rawColor;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedHex(true);
    setTimeout(() => setCopiedHex(false), 1500);
  };

  return (
    <div className="space-y-2.5 animate-in fade-in duration-100 text-slate-200">
      {/* Header Banner */}
      <div className="p-2.5 bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-emerald-950/40 rounded-xl border border-cyan-500/30 space-y-1.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-cyan-300 flex items-center gap-1.5">
            <Disc className="w-3.5 h-3.5 text-cyan-400 animate-[spin_12s_linear_infinite]" />
            <span>{uiText("components_advert_panel_palette_wheel.span.panel", "Panel ")}{selectedBoxId}{uiText("components_advert_panel_palette_wheel.span.chromatic_palette_wheel", " Chromatic Palette Wheel")}</span>
          </span>
          <span className="text-[8px] font-mono text-cyan-300 font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40">
            {totalBoxes === 16 ? "4×4 Matrix (16 Panels)" : "3×3 Matrix (9 Panels)"}
          </span>
        </div>
        <p className="text-[8.5px] text-slate-300 leading-normal">
          {uiText("components_advert_panel_palette_wheel.p.tune_colors_using_the_360_radial_wheel_adjus", "Tune colors using the 360° radial wheel, adjust brightness & alpha, and broadcast changes to individual panels or across the entire grid.")}
        </p>
      </div>

      {/* Target Channel Selector Tabs */}
      <div className="bg-[#050b18] p-2 rounded-xl border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between text-[9px]">
          <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
            <span>{uiText("components_advert_panel_palette_wheel.span.target_channel", "Target Channel:")}</span>
          </span>
          <span className="font-mono text-cyan-400 font-bold text-[8.5px]">
            {CHANNELS.find((c) => c.id === activeChannel)?.label}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {CHANNELS.map((ch) => {
            const isActive = activeChannel === ch.id;
            const chVal = currentStyle[ch.id] || ch.defaultColor;
            return (
              <CustomizableButton
                buttonId="advert_panel_palette_wheel_btn_7"
                key={ch.id}
type="button"
onClick={() => setActiveChannel(ch.id)}
className={cn(
                  "px-2 py-1.5 rounded-lg border text-[8.5px] font-bold flex items-center justify-between transition-all cursor-pointer",
                  isActive
                    ? "bg-slate-800 text-cyan-300 border-cyan-500/60 shadow-xs ring-1 ring-cyan-400/40"
                    : "bg-[#020612] text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700"
                )}
              >
                  {() => (
                      <>
                        <span>{ch.shortLabel}</span>
                      <span
                  className="w-3 h-3 rounded-full border border-slate-600 shadow-inner shrink-0 relative overflow-hidden"
                  style={{ backgroundColor: chVal === "transparent" ? "#020617" : chVal }}
                >
                  {chVal === "transparent" && (
                    <span className="absolute inset-0 bg-[linear-gradient(45deg,transparent_40%,#ef4444_45%,#ef4444_55%,transparent_60%)]" />
                  )}
                </span>
                      </>
                    )}
              </CustomizableButton>
            );
          })}
        </div>
      </div>

      {/* Radial Wheel Core */}
      <div className="bg-[#050b18] p-2.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
        <div className="relative p-1 rounded-full bg-slate-950 border border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-[170px] h-[170px] rounded-full cursor-crosshair touch-none select-none"
            title={uiText("components_advert_panel_palette_wheel.canvas.drag_around_the_wheel_to_choose_hue_and_satu.title", "Drag around the wheel to choose Hue and Saturation")}
          />
          {/* Center Hub Indicator */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-white/60 pointer-events-none shadow-md overflow-hidden"
            style={{
              backgroundColor: rawColor === "transparent" ? "#020617" : rawColor,
            }}
          >
            {rawColor === "transparent" && (
              <div className="w-full h-full bg-[linear-gradient(45deg,transparent_40%,#ef4444_45%,#ef4444_55%,transparent_60%)]" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 text-[8.5px] font-mono text-slate-400">
          <span>{uiText("components_advert_panel_palette_wheel.span.h", "H: ")}{hue}°</span>
          <span>{uiText("components_advert_panel_palette_wheel.span.s", "S: ")}{saturation}%</span>
          <span>{uiText("components_advert_panel_palette_wheel.span.l", "L: ")}{lightness}%</span>
          <span>{uiText("components_advert_panel_palette_wheel.span.a", "A: ")}{Math.round(alpha * 100)}%</span>
        </div>
      </div>

      {/* Brightness & Opacity Sliders */}
      <div className="bg-[#050b18] p-2.5 rounded-xl border border-slate-800 space-y-2">
        {/* Brightness / Lightness */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9.5px]">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-400" />
              <span>{uiText("components_advert_panel_palette_wheel.span.brightness", "Brightness:")}</span>
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
              background: `linear-gradient(to right, #000000 0%, ${hslToHex(hue, saturation, 50, 1)} 50%, #ffffff 100%)`,
            }}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer border border-slate-700"
          />
        </div>

        {/* Opacity / Alpha */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9.5px]">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <Palette className="w-3 h-3 text-cyan-400" />
              <span>{uiText("components_advert_panel_palette_wheel.span.opacity", "Opacity:")}</span>
            </span>
            <div className="flex items-center gap-1">
              <CustomizableButton
                buttonId="advert_panel_palette_wheel_btn_6"
                type="button"
onClick={() => handleAlphaChange(0)}
className="text-[8px] px-1 py-0.2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer font-bold"
              >
                  {() => (
                      <>
                        {uiText("components_advert_panel_palette_wheel.button.transp", "Transp")}
                      </>
                    )}
              </CustomizableButton>
              <span className="font-mono text-slate-400">{Math.round(alpha * 100)}%</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(alpha * 100)}
            onChange={(e) => handleAlphaChange(Number(e.target.value) / 100)}
            style={{
              background: `linear-gradient(to right, transparent 0%, ${hslToHex(hue, saturation, lightness, 1)} 100%)`,
            }}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer border border-slate-700"
          />
        </div>
      </div>

      {/* Quick Swatches & Hex Input */}
      <div className="bg-[#050b18] p-2.5 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center gap-2">
          {/* Swatch Preview */}
          <div
            className="w-8 h-8 rounded-lg border border-slate-700 shrink-0 shadow-inner relative overflow-hidden"
            style={{ backgroundColor: rawColor === "transparent" ? "#020617" : rawColor }}
          >
            {rawColor === "transparent" && (
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_40%,#ef4444_45%,#ef4444_55%,transparent_60%)]" />
            )}
          </div>

          {/* Hex Input */}
          <div className="flex-1 flex items-center bg-[#020612] border border-slate-700 rounded-lg px-2 py-1">
            <span className="text-[10px] font-mono text-slate-500 mr-1">{uiText("components_advert_panel_palette_wheel.span.hex", "HEX")}</span>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexInputChange(e.target.value)}
              className="bg-transparent text-slate-200 font-mono text-[10px] font-bold outline-none w-full"
              placeholder="#38BDF8"
            />
            <CustomizableButton
              buttonId="advert_panel_palette_wheel_btn_5"
              type="button"
onClick={handleCopyHex}
className="text-slate-400 hover:text-white p-0.5 ml-1 transition-colors cursor-pointer"
title={uiText("components_advert_panel_palette_wheel.button.copy_hex_code.title", "Copy hex code")}
            >
                {() => (
                    <>
                      {copiedHex ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </>
                  )}
            </CustomizableButton>
          </div>
        </div>

        {/* Quick Swatches */}
        <div className="flex items-center justify-between gap-1">
          {["#10b981", "#38bdf8", "#d946ef", "#f59e0b", "#8b5cf6", "#f43f5e", "#ffffff", "transparent"].map((sw) => (
            <CustomizableButton
              buttonId="advert_panel_palette_wheel_btn_4"
              key={sw}
type="button"
onClick={() => {
                if (sw === "transparent") {
                  setAlpha(0);
                  applyColor("transparent");
                  setHexInput("NONE");
                } else {
                  handleHexInputChange(sw);
                }
              }}
style={{ backgroundColor: sw === "transparent" ? "#020617" : sw }}
className="w-5 h-5 rounded-md border border-slate-700 hover:border-white/80 transition-all cursor-pointer relative overflow-hidden shadow-xs hover:scale-110"
title={sw}
            >
                {() => (
                    <>
                      {sw === "transparent" && (
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_40%,#ef4444_45%,#ef4444_55%,transparent_60%)]" />
              )}
                    </>
                  )}
            </CustomizableButton>
          ))}
        </div>
      </div>

      {/* PANEL BACKGROUND Swatches Row */}
      <div className="bg-[#050b18] p-2.5 rounded-xl border border-slate-800 space-y-1.5">
        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider block">
          {uiText("components_advert_panel_palette_wheel.span.panel_background", "Panel Background:")}
        </span>
        <div className="grid grid-cols-7 gap-1">
          {PANEL_BACKGROUND_SWATCHES.map((bg) => {
            const isCurrentBg = (currentStyle.backgroundColor || "transparent") === bg.hex;
            return (
              <CustomizableButton
                buttonId="advert_panel_palette_wheel_btn_3"
                key={bg.label}
type="button"
onClick={() => onUpdateStyle({ backgroundColor: bg.hex })}
className={cn(
                  "h-6 rounded border transition-all cursor-pointer relative overflow-hidden flex items-center justify-center shadow-xs",
                  isCurrentBg
                    ? "ring-2 ring-emerald-400 border-emerald-400 scale-105"
                    : "border-slate-700 hover:border-slate-500 hover:scale-105"
                )}
style={{ backgroundColor: bg.hex === "transparent" ? "#040814" : bg.hex }}
title={`${bg.label} (${bg.hex})`}
              >
                  {() => (
                      <>
                        {bg.hex === "transparent" ? (
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_40%,#ef4444_45%,#ef4444_55%,transparent_60%)]" />
                ) : (
                  isCurrentBg && <Check className="w-2.5 h-2.5 text-emerald-400" />
                )}
                      </>
                    )}
              </CustomizableButton>
            );
          })}
        </div>
      </div>

      {/* 1-Click Curated Colorways */}
      <div className="bg-[#050b18] p-2.5 rounded-xl border border-slate-800 space-y-1.5">
        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider block">
          {uiText("components_advert_panel_palette_wheel.span.1_click_colorway_presets", "1-Click Colorway Presets:")}
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {COLORWAY_PRESETS.map((cw) => (
            <CustomizableButton
              buttonId="advert_panel_palette_wheel_btn_2"
              key={cw.name}
type="button"
onClick={() => onUpdateStyle(cw.style)}
style={{
                backgroundColor: cw.style.backgroundColor,
                color: cw.style.textColor,
                borderColor: cw.style.borderColor,
              }}
className="p-1.5 rounded-lg border text-[8.5px] font-bold flex items-center justify-between transition-all cursor-pointer hover:scale-102 shadow-xs"
            >
                {() => (
                    <>
                      <span>{cw.name}</span>
                    <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cw.style.accentColor }}
              />
                    </>
                  )}
            </CustomizableButton>
          ))}
        </div>
      </div>

      {/* Broadcast to all panels button */}
      <div className="pt-1">
        <CustomizableButton
          buttonId="advert_panel_palette_wheel_btn_1"
          defaultIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
          type="button"
onClick={() =>
            onApplyToAllPanels(
              currentStyle || {
                borderColor: "#10b981",
                backgroundColor: "transparent",
                accentColor: "#10b981",
                textColor: "#38bdf8",
              }
            )
          }
className="w-full py-2 px-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-black text-[9.5px] rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99]"
        >
            {() => (
                <>
                  <span>{uiText("components_advert_panel_palette_wheel.span.apply_this_style_to_all", "✓ Apply This Style to All ")}{totalBoxes}{uiText("components_advert_panel_palette_wheel.span.panels", " Panels")}</span>
                </>
              )}
        </CustomizableButton>
      </div>
    </div>
  );
};
