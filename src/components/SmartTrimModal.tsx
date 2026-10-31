import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  Crop,
  Layers,
  Check,
  X,
  RefreshCw,
  Maximize2,
  Sliders,
  ArrowDown,
  ArrowUp,
  LayoutGrid,
  Pipette,
  Palette,
  ShieldCheck,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import JSZip from "jszip";
import {
  trimAlphaPadding,
  batchTrimAlphaPadding,
  TrimAnchor,
  TrimBackgroundMode,
  TrimOptions,
  TrimResult,
} from "../utils/imageUtils";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export interface TrimTargetItem {
  id: string;
  name?: string;
  url: string;
  isSelected?: boolean;
}

export interface SmartTrimModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TrimTargetItem[];
  activeItemId?: string | null;
  onApplyTrimmedItems: (trimmedResults: Array<{ id: string; url: string; result: TrimResult }>) => void;
}

const ANCHOR_PRESETS: Array<{ id: TrimAnchor; label: string; desc: string; icon: string }> = [
  { id: "tight", label: "Tight", desc: "Trim exactly to character bounds", icon: "🎯" },
  { id: "bottom-center", label: "Bottom-Center", desc: "Ground pivot for 2D character sprites", icon: "⚓" },
  { id: "center", label: "Center", desc: "Centered pivot for symmetric items & icons", icon: "🧭" },
  { id: "top-center", label: "Top-Center", desc: "Top-anchored hanging elements", icon: "⬆️" },
  { id: "top-left", label: "Top-Left", desc: "Standard top-left grid origin", icon: "↖️" },
  { id: "bottom-left", label: "Bottom-Left", desc: "Bottom-left corner origin", icon: "↙️" },
  { id: "bottom-right", label: "Bottom-Right", desc: "Bottom-right corner origin", icon: "↘️" },
  { id: "top-right", label: "Top-Right", desc: "Top-right corner origin", icon: "↗️" },
];

const BG_MODES: Array<{ id: TrimBackgroundMode; label: string; icon: string; desc: string }> = [
  { id: "auto", label: "Auto Detect", icon: "🌟", desc: "Smart perimeter & alpha analysis" },
  { id: "alpha", label: "Alpha (Transparent)", icon: "🔲", desc: "Strips transparent padding" },
  { id: "white", label: "White BG", icon: "⚪", desc: "Strips & keys out #FFFFFF" },
  { id: "black", label: "Black BG", icon: "⚫", desc: "Strips & keys out #000000" },
  { id: "color", label: "Custom Key Color", icon: "🎨", desc: "Key out sampled or picked color" },
];

export const SmartTrimModal: React.FC<SmartTrimModalProps> = ({
  isOpen,
  onClose,
  items,
  activeItemId = null,
  onApplyTrimmedItems,
}) => {
  const [selectedAnchor, setSelectedAnchor] = useState<TrimAnchor>("tight");
  const [padding, setPadding] = useState<number>(0);
  const [alphaThreshold, setAlphaThreshold] = useState<number>(10);
  const [backgroundMode, setBackgroundMode] = useState<TrimBackgroundMode>("auto");
  const [customBgColor, setCustomBgColor] = useState<{ r: number; g: number; b: number }>({ r: 255, g: 255, b: 255 });
  const [colorTolerance, setColorTolerance] = useState<number>(25);
  const [removeBackgroundColor, setRemoveBackgroundColor] = useState<boolean>(true);
  const [standardizeBatchSize, setStandardizeBatchSize] = useState<boolean>(false);
  const [preserveOriginalSize, setPreserveOriginalSize] = useState<boolean>(false);
  const [scope, setScope] = useState<"all" | "selected" | "active">("all");

  // Advanced manual margin adjustments
  const [showAdvancedMargins, setShowAdvancedMargins] = useState<boolean>(false);
  const [marginTop, setMarginTop] = useState<number>(0);
  const [marginBottom, setMarginBottom] = useState<number>(0);
  const [marginLeft, setMarginLeft] = useState<number>(0);
  const [marginRight, setMarginRight] = useState<number>(0);

  // Eyedropper state
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);

  const [previewItemId, setPreviewItemId] = useState<string>("");
  const [previewResult, setPreviewResult] = useState<TrimResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize preview item ID
  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    if (activeItemId && items.some((i) => i.id === activeItemId)) {
      setPreviewItemId(activeItemId);
      setScope("active");
    } else {
      setPreviewItemId(items[0].id);
      setScope(items.some((i) => i.isSelected) ? "selected" : "all");
    }
  }, [isOpen, activeItemId, items]);

  const currentPreviewItem = items.find((i) => i.id === previewItemId) || items[0];

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace("#", "");
    const bigint = parseInt(cleanHex, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  };

  const rgbToHex = (r: number, g: number, b: number) =>
    "#" + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0")).join("");

  // Calculate live preview for currently previewed slice
  useEffect(() => {
    if (!isOpen || !currentPreviewItem?.url) return;
    let isMounted = true;
    setIsProcessing(true);

    const timer = setTimeout(async () => {
      const options: TrimOptions = {
        alphaThreshold,
        backgroundMode,
        backgroundColor: backgroundMode === "color" ? customBgColor : undefined,
        colorTolerance,
        padding,
        customMargins: showAdvancedMargins
          ? { top: marginTop, bottom: marginBottom, left: marginLeft, right: marginRight }
          : undefined,
        anchor: selectedAnchor,
        preserveOriginalSize,
        removeBackgroundColor,
      };

      try {
        const res = await trimAlphaPadding(currentPreviewItem.url, options);
        if (isMounted) {
          setPreviewResult(res);
          setIsProcessing(false);
        }
      } catch (e) {
        console.error("Preview trim error:", e);
        if (isMounted) setIsProcessing(false);
      }
    }, 60);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    isOpen,
    currentPreviewItem?.url,
    selectedAnchor,
    padding,
    alphaThreshold,
    backgroundMode,
    customBgColor,
    colorTolerance,
    preserveOriginalSize,
    removeBackgroundColor,
    showAdvancedMargins,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
  ]);

  // Handle Eyedropper click on original image canvas
  const handleOriginalCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEyedropperActive || !originalCanvasRef.current) return;

    const canvas = originalCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    setCustomBgColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
    setBackgroundMode("color");
    setIsEyedropperActive(false);
  };

  // Draw original image with detected crop overlay on originalCanvasRef
  useEffect(() => {
    if (!currentPreviewItem?.url || !originalCanvasRef.current) return;
    const canvas = originalCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Draw green bounding crop box overlay
      if (previewResult && previewResult.contentBounds) {
        const { x, y, width, height } = previewResult.contentBounds;
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = Math.max(2, Math.floor(img.naturalWidth / 250));
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(x, y, width, height);

        // Semi-transparent dimming outside the crop box
        ctx.fillStyle = "rgba(2, 6, 23, 0.45)";
        // Top
        ctx.fillRect(0, 0, canvas.width, y);
        // Bottom
        ctx.fillRect(0, y + height, canvas.width, canvas.height - (y + height));
        // Left
        ctx.fillRect(0, y, x, height);
        // Right
        ctx.fillRect(x + width, y, canvas.width - (x + width), height);
      }
    };
    img.src = currentPreviewItem.url;
  }, [currentPreviewItem?.url, previewResult]);

  const targetItemsToTrim = React.useMemo(() => {
    if (scope === "active") {
      return items.filter((i) => i.id === previewItemId);
    }
    if (scope === "selected") {
      const selected = items.filter((i) => i.isSelected);
      return selected.length > 0 ? selected : items;
    }
    return items;
  }, [items, scope, previewItemId]);

  // Apply Presets
  const applyPreset = (presetKey: "character" | "clean_png" | "white_strip" | "icon") => {
    if (presetKey === "character") {
      setSelectedAnchor("bottom-center");
      setBackgroundMode("auto");
      setRemoveBackgroundColor(true);
      setPadding(0);
      setStandardizeBatchSize(true);
      setPreserveOriginalSize(false);
    } else if (presetKey === "clean_png") {
      setSelectedAnchor("tight");
      setBackgroundMode("alpha");
      setPadding(0);
      setPreserveOriginalSize(false);
      setStandardizeBatchSize(false);
    } else if (presetKey === "white_strip") {
      setSelectedAnchor("tight");
      setBackgroundMode("white");
      setCustomBgColor({ r: 255, g: 255, b: 255 });
      setRemoveBackgroundColor(true);
      setColorTolerance(25);
      setPadding(0);
      setPreserveOriginalSize(false);
    } else if (presetKey === "icon") {
      setSelectedAnchor("center");
      setBackgroundMode("auto");
      setPadding(4);
      setPreserveOriginalSize(false);
    }
  };

  const handleApply = async () => {
    if (targetItemsToTrim.length === 0) return;
    setIsApplying(true);

    try {
      const options: TrimOptions = {
        alphaThreshold,
        backgroundMode,
        backgroundColor: backgroundMode === "color" ? customBgColor : undefined,
        colorTolerance,
        padding,
        customMargins: showAdvancedMargins
          ? { top: marginTop, bottom: marginBottom, left: marginLeft, right: marginRight }
          : undefined,
        anchor: selectedAnchor,
        preserveOriginalSize,
        removeBackgroundColor,
        standardizeBatchSize,
      };

      const results = await batchTrimAlphaPadding(
        targetItemsToTrim.map((i) => ({ id: i.id, url: i.url })),
        options
      );

      onApplyTrimmedItems(results);
      onClose();
    } catch (err) {
      console.error("Smart Trim Apply error:", err);
    } finally {
      setIsApplying(false);
    }
  };

  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);

  const handleExportZip = async () => {
    if (targetItemsToTrim.length === 0) return;
    setIsExportingZip(true);
    try {
      const options: TrimOptions = {
        alphaThreshold,
        backgroundMode,
        backgroundColor: backgroundMode === "color" ? customBgColor : undefined,
        colorTolerance,
        padding,
        customMargins: showAdvancedMargins
          ? { top: marginTop, bottom: marginBottom, left: marginLeft, right: marginRight }
          : undefined,
        anchor: selectedAnchor,
        preserveOriginalSize,
        removeBackgroundColor,
        standardizeBatchSize,
        format: "image/png",
      };

      const results = await batchTrimAlphaPadding(
        targetItemsToTrim.map((i) => ({ id: i.id, url: i.url })),
        options
      );

      const zip = new JSZip();
      const usedNames = new Set<string>();

      results.forEach((res, i) => {
        const originalItem = targetItemsToTrim.find((t) => t.id === res.id);
        let baseName = originalItem?.name || `slice-${i + 1}.png`;
        if (!baseName.toLowerCase().endsWith(".png")) {
          baseName = baseName.replace(/\.[^/.]+$/, "") + ".png";
        }
        let finalName = baseName;
        let counter = 1;
        while (usedNames.has(finalName)) {
          const dotIdx = baseName.lastIndexOf(".");
          const prefix = dotIdx > 0 ? baseName.slice(0, dotIdx) : baseName;
          finalName = `${prefix}_${counter}.png`;
          counter++;
        }
        usedNames.add(finalName);
        const base64Data = res.url.replace(/^data:image\/\w+;base64,/, "");
        zip.file(finalName, base64Data, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "smart-trimmed-assets.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Smart Trim ZIP export error:", err);
    } finally {
      setIsExportingZip(false);
    }
  };

  if (!isOpen || items.length === 0) return null;

  return (
    <div
      id="smart_trim_modal_overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="smart_trim_modal_container"
        className="relative w-full max-w-5xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col max-h-[94vh] overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/90 border-b border-cyan-500/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/40 shadow-sm">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <CustomizableLabel
                labelId="smart_trim_modal_item_25"
                as="h2"
                className="text-sm sm:text-base font-bold text-white flex items-center gap-2"
              >
                  {() => (
                      <>
                        {uiText("components_smart_trim_modal.h2.smart_auto_crop_and_alpha_trimming", "Smart Auto-Crop & Alpha Trimming")}
                      <span className="text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/40">
                  {uiText("components_smart_trim_modal.span.precision_ground_pivot", "Precision Ground Pivot")}
                </span>
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-[11px] text-slate-400">
                {uiText("components_smart_trim_modal.p.strips_excess_transparent_padding_or_solid_b", "Strips excess transparent padding or solid backgrounds while aligning sprite ground pivots.")}
              </p>
            </div>
          </div>
          <CustomizableButton
            buttonId="smart_trim_modal_btn_24"
            defaultIcon={<X className="w-5 h-5" />}
            type="button"
onClick={onClose}
className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
title={uiText("components_smart_trim_modal.button.close_smart_trim_modal.title", "Close Smart Trim Modal")}
          />
        </div>

        {/* Quick Presets Bar */}
        <div className="px-4 py-1.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 shrink-0">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{uiText("components_smart_trim_modal.span.workflow_presets", "Workflow Presets:")}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <CustomizableButton
              buttonId="smart_trim_modal_btn_23"
              type="button"
onClick={() => applyPreset("character")}
className="px-2 py-1 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 text-[10.5px] font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0"
title={uiText("components_smart_trim_modal.button.bottom_center_ground_anchor_auto_alpha_color.title", "Bottom-Center ground anchor, auto alpha/color trim, batch dimension standardization for 2D sprites")}
            >
                {() => (
                    <>
                      <span>🎮</span>
                    <span>{uiText("components_smart_trim_modal.span.2d_character_sprites", "2D Character Sprites")}</span>
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="smart_trim_modal_btn_22"
              type="button"
onClick={() => applyPreset("clean_png")}
className="px-2 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 text-[10.5px] font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0"
title={uiText("components_smart_trim_modal.button.tight_bounding_crop_for_transparent_png_asse.title", "Tight bounding crop for transparent PNG assets")}
            >
                {() => (
                    <>
                      <span>🔲</span>
                    <span>{uiText("components_smart_trim_modal.span.tight_alpha_trim", "Tight Alpha Trim")}</span>
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="smart_trim_modal_btn_21"
              type="button"
onClick={() => applyPreset("white_strip")}
className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-[10.5px] font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0"
title={uiText("components_smart_trim_modal.button.strip_white_canvas_backgrounds_to_transparen.title", "Strip white canvas backgrounds to transparent PNG")}
            >
                {() => (
                    <>
                      <span>⚪</span>
                    <span>{uiText("components_smart_trim_modal.span.white_bg_stripper", "White BG Stripper")}</span>
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="smart_trim_modal_btn_20"
              type="button"
onClick={() => applyPreset("icon")}
className="px-2 py-1 rounded-md bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-200 text-[10.5px] font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0"
title={uiText("components_smart_trim_modal.button.center_anchor_with_uniform_padding_for_icons.title", "Center anchor with uniform padding for icons and props")}
            >
                {() => (
                    <>
                      <span>🎯</span>
                    <span>{uiText("components_smart_trim_modal.span.centered_icon_4px", "Centered Icon (+4px)")}</span>
                    </>
                  )}
            </CustomizableButton>
          </div>
        </div>

        {/* Modal Body: Split into Left (Live Canvas Previews) and Right (Options & Sliders) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto lg:overflow-hidden">
          {/* Left: Dual Canvas Comparison (Before & After) */}
          <div className="lg:col-span-7 bg-slate-950/90 p-3 sm:p-4 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 relative overflow-hidden">
            {/* Slice Switcher Bar (if batch) */}
            {items.length > 1 && (
              <div className="pb-2 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
                <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                  {uiText("components_smart_trim_modal.span.preview_item", "Preview Item (")}{items.length}):
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  {items.map((item, idx) => (
                    <CustomizableButton
                      buttonId="smart_trim_modal_btn_19"
                      key={item.id}
type="button"
onClick={() => setPreviewItemId(item.id)}
className={cn(
                        "w-8 h-8 rounded-lg border p-0.5 transition-all cursor-pointer shrink-0 bg-slate-900 overflow-hidden",
                        previewItemId === item.id
                          ? "border-cyan-400 ring-2 ring-cyan-500/40 scale-105"
                          : "border-slate-800 opacity-60 hover:opacity-100"
                      )}
title={item.name || `Slice #${idx + 1}`}
                    >
                        {() => (
                            <>
                              <img
                        src={item.url}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                            </>
                          )}
                    </CustomizableButton>
                  ))}
                </div>
              </div>
            )}

            {/* Before vs After Dual Canvas Visual Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2 flex-1 items-center">
              {/* Original Canvas with Live Crop Box Overlay & Eyedropper */}
              <div className="space-y-1.5 flex flex-col items-center w-full">
                <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>{uiText("components_smart_trim_modal.span.original_frame", "Original Frame")}</span>
                  <CustomizableButton
                    buttonId="smart_trim_modal_btn_18"
                    defaultIcon={<Pipette className="w-2.5 h-2.5" />}
                    type="button"
onClick={() => setIsEyedropperActive(!isEyedropperActive)}
className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 border",
                      isEyedropperActive
                        ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm animate-pulse"
                        : "bg-slate-800 text-slate-300 hover:text-amber-300 border-slate-700"
                    )}
title={uiText("components_smart_trim_modal.button.click_to_activate_eyedropper_then_click_on_t.title", "Click to activate Eyedropper, then click on the original image to select background color")}
                  >
                      {() => (
                          <>
                            <span>{isEyedropperActive ? "Click Image..." : "Eyedrop BG"}</span>
                          </>
                        )}
                  </CustomizableButton>
                </div>

                <div
                  className={cn(
                    "w-full h-44 sm:h-52 bg-[linear-gradient(45deg,#0f172a_25%,transparent_25%),linear-gradient(-45deg,#0f172a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0f172a_75%),linear-gradient(-45deg,transparent_75%,#0f172a_75%)] bg-[size:12px_12px] bg-[#020617] rounded-xl border p-1 flex items-center justify-center relative overflow-hidden shadow-inner",
                    isEyedropperActive ? "border-amber-400 cursor-crosshair ring-2 ring-amber-500/30" : "border-slate-800"
                  )}
                >
                  <canvas
                    ref={originalCanvasRef}
                    onClick={handleOriginalCanvasClick}
                    className="max-w-full max-h-full object-contain"
                  />
                  {previewResult && (
                    <div className="absolute bottom-1.5 left-1.5 bg-slate-900/90 text-slate-300 font-mono text-[9.5px] px-1.5 py-0.5 rounded border border-slate-700">
                      {previewResult.originalWidth} × {previewResult.originalHeight}{uiText("components_smart_trim_modal.div.px", " px")}
                    </div>
                  )}
                  {previewResult?.detectedBackground && (
                    <div className="absolute top-1.5 right-1.5 bg-slate-900/90 text-slate-300 font-mono text-[9.5px] px-1.5 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-slate-600 inline-block shrink-0"
                        style={{ backgroundColor: previewResult.detectedBackground.hex }}
                      />
                      <span>{previewResult.detectedBackground.isAlpha ? "Alpha" : previewResult.detectedBackground.hex}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Trimmed Result Canvas */}
              <div className="space-y-1.5 flex flex-col items-center w-full">
                <div className="w-full flex items-center justify-between text-[11px] font-bold text-cyan-300">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>{uiText("components_smart_trim_modal.span.trimmed_result", "Trimmed Result")}</span>
                  </div>
                  {isProcessing && (
                    <span className="text-[10px] text-cyan-400 flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      {uiText("components_smart_trim_modal.span.rendering", "Rendering...")}
                    </span>
                  )}
                </div>

                <div className="w-full h-44 sm:h-52 bg-[linear-gradient(45deg,#0f172a_25%,transparent_25%),linear-gradient(-45deg,#0f172a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0f172a_75%),linear-gradient(-45deg,transparent_75%,#0f172a_75%)] bg-[size:12px_12px] bg-[#020617] rounded-xl border border-cyan-500/40 p-1 flex items-center justify-center relative overflow-hidden shadow-inner">
                  {previewResult?.url && (
                    <img
                      src={previewResult.url}
                      alt={uiText("components_smart_trim_modal.img.trimmed.alt", "Trimmed")}
                      className="max-w-full max-h-full object-contain transition-all"
                    />
                  )}
                  {previewResult && (
                    <div className="absolute bottom-1.5 right-1.5 bg-cyan-950/90 text-cyan-300 font-mono font-bold text-[9.5px] px-1.5 py-0.5 rounded border border-cyan-500/50 shadow-sm">
                      {previewResult.trimmedWidth} × {previewResult.trimmedHeight}{uiText("components_smart_trim_modal.div.px_2", " px")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Trimming Metrics Summary */}
            {previewResult && (
              <div className="p-2 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-[11px] text-slate-300 font-mono shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{uiText("components_smart_trim_modal.span.trimmed_margins", "Trimmed Margins:")}</span>
                  <span className="text-cyan-400 font-bold">
                    {uiText("components_smart_trim_modal.span.t", "T:")}{previewResult.margins.top}{uiText("components_smart_trim_modal.span.px_b", "px B:")}{previewResult.margins.bottom}{uiText("components_smart_trim_modal.span.px_l", "px L:")}{previewResult.margins.left}{uiText("components_smart_trim_modal.span.px_r", "px R:")}{previewResult.margins.right}{uiText("components_smart_trim_modal.span.px", "px")}
                  </span>
                </div>
                <div className="text-emerald-400 font-bold">
                  {Math.round(
                    (1 -
                      (previewResult.trimmedWidth * previewResult.trimmedHeight) /
                        Math.max(1, previewResult.originalWidth * previewResult.originalHeight)) *
                      100
                  )}
                  {uiText("components_smart_trim_modal.div.space_saved", "% Space Saved")}
                </div>
              </div>
            )}
          </div>

          {/* Right: Controls, Anchors, Background Mode & Sliders */}
          <div className="lg:col-span-5 p-3 sm:p-4 space-y-3.5 overflow-y-auto max-h-[60vh] lg:max-h-full bg-slate-900/60">
            {/* Scope Selection */}
            {items.length > 1 && (
              <div className="space-y-1">
                <CustomizableLabel
                  labelId="smart_trim_modal_item_17"
                  defaultIcon={<Layers className="w-3.5 h-3.5 text-cyan-400" />}
                  as="label"
                  className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5"
                >
                    {() => (
                        <>
                          {uiText("components_smart_trim_modal.label.apply_scope", "Apply Scope")}
                        </>
                      )}
                </CustomizableLabel>
                <div className="grid grid-cols-3 gap-1.5">
                  <CustomizableButton
                    buttonId="smart_trim_modal_btn_16"
                    defaultLabel={")"}
                    type="button"
onClick={() => setScope("all")}
className={cn(
                      "py-1 px-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                      scope === "all"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-sm"
                        : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                    )}
                  >
                      {(ibcProps) => (
                          <>
                            {uiText("components_smart_trim_modal.button.all", "All (")}
                          {items.length}
                          {!ibcProps.isTextHidden ? ibcProps.label : null}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="smart_trim_modal_btn_15"
                    defaultLabel={")"}
                    type="button"
onClick={() => setScope("selected")}
className={cn(
                      "py-1 px-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                      scope === "selected"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-sm"
                        : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                    )}
                  >
                      {(ibcProps) => (
                          <>
                            {uiText("components_smart_trim_modal.button.selected", "Selected (")}
                          {items.filter((i) => i.isSelected).length || items.length}
                          {!ibcProps.isTextHidden ? ibcProps.label : null}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="smart_trim_modal_btn_14"
                    type="button"
onClick={() => setScope("active")}
className={cn(
                      "py-1 px-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                      scope === "active"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-sm"
                        : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                    )}
                  >
                      {() => (
                          <>
                            {uiText("components_smart_trim_modal.button.active_only_1", "Active Only (1)")}
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>
            )}

            {/* Background & Alpha Detection Mode */}
            <div className="space-y-1.5">
              <CustomizableLabel
                labelId="smart_trim_modal_item_13"
                as="label"
                className="text-[11px] font-bold text-slate-300 flex items-center justify-between"
              >
                  {() => (
                      <>
                        <span className="flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  {uiText("components_smart_trim_modal.span.background_trim_mode", "Background Trim Mode")}
                </span>
                      <span className="text-[10px] text-cyan-300 font-bold">
                  {BG_MODES.find((m) => m.id === backgroundMode)?.label}
                </span>
                      </>
                    )}
              </CustomizableLabel>

              <div className="grid grid-cols-2 gap-1.5">
                {BG_MODES.map((mode) => (
                  <CustomizableButton
                    buttonId="smart_trim_modal_btn_12"
                    key={mode.id}
type="button"
onClick={() => setBackgroundMode(mode.id)}
className={cn(
                      "p-1.5 rounded-lg text-left border transition-all cursor-pointer text-xs flex items-center gap-1.5",
                      backgroundMode === mode.id
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-200 shadow-sm"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                    )}
                  >
                      {() => (
                          <>
                            <span className="text-sm shrink-0">{mode.icon}</span>
                          <div className="min-w-0">
                      <div className="font-bold truncate text-[11px]">{mode.label}</div>
                    </div>
                          </>
                        )}
                  </CustomizableButton>
                ))}
              </div>

              {/* Custom Color Eyedropper & Color Input */}
              {backgroundMode === "color" && (
                <div className="p-2 bg-slate-950/80 rounded-xl border border-cyan-500/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={rgbToHex(customBgColor.r, customBgColor.g, customBgColor.b)}
                      onChange={(e) => setCustomBgColor(hexToRgb(e.target.value))}
                      className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <div className="text-[11px] font-mono text-slate-300">
                      {rgbToHex(customBgColor.r, customBgColor.g, customBgColor.b).toUpperCase()}
                    </div>
                  </div>
                  <CustomizableButton
                    buttonId="smart_trim_modal_btn_11"
                    defaultIcon={<Pipette className="w-3 h-3" />}
                    type="button"
onClick={() => setIsEyedropperActive(!isEyedropperActive)}
className="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 rounded-md text-[10.5px] font-bold cursor-pointer flex items-center gap-1"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_smart_trim_modal.span.pick_from_image", "Pick From Image")}</span>
                          </>
                        )}
                  </CustomizableButton>
                </div>
              )}

              {/* Make Background Transparent Toggle */}
              {(backgroundMode === "color" || backgroundMode === "white" || backgroundMode === "black" || backgroundMode === "auto") && (
                <CustomizableLabel
                  labelId="smart_trim_modal_item_10"
                  as="label"
                  className="flex items-center justify-between text-xs p-2 bg-slate-950/70 rounded-lg border border-slate-800 cursor-pointer"
                >
                    {() => (
                        <>
                          <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-200 font-medium">{uiText("components_smart_trim_modal.span.make_trimmed_bg_transparent", "Make Trimmed BG Transparent")}</span>
                  </div>
                        <input
                    type="checkbox"
                    checked={removeBackgroundColor}
                    onChange={(e) => setRemoveBackgroundColor(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 accent-cyan-500 cursor-pointer"
                  />
                        </>
                      )}
                </CustomizableLabel>
              )}
            </div>

            {/* Color Tolerance & Alpha Threshold Sliders */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-400 font-semibold">{uiText("components_smart_trim_modal.span.color_tolerance", "Color Tolerance")}</span>
                  <span className="text-cyan-400 font-mono font-bold">{colorTolerance}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={colorTolerance}
                  onChange={(e) => setColorTolerance(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-400 font-semibold">{uiText("components_smart_trim_modal.span.alpha_threshold", "Alpha Threshold")}</span>
                  <span className="text-cyan-400 font-mono font-bold">{alphaThreshold}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="255"
                  step="1"
                  value={alphaThreshold}
                  onChange={(e) => setAlphaThreshold(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            {/* Anchor / Pivot Alignment */}
            <div className="space-y-1.5">
              <CustomizableLabel
                labelId="smart_trim_modal_item_9"
                as="label"
                className="text-[11px] font-bold text-slate-300 flex items-center justify-between"
              >
                  {() => (
                      <>
                        <span>{uiText("components_smart_trim_modal.span.anchor_pivot_alignment", "Anchor / Pivot Alignment")}</span>
                      <span className="text-cyan-400 text-xs font-mono font-bold">
                  {ANCHOR_PRESETS.find((a) => a.id === selectedAnchor)?.label}
                </span>
                      </>
                    )}
              </CustomizableLabel>

              <div className="grid grid-cols-2 gap-1.5">
                {ANCHOR_PRESETS.map((preset) => (
                  <CustomizableButton
                    buttonId="smart_trim_modal_btn_8"
                    key={preset.id}
type="button"
onClick={() => setSelectedAnchor(preset.id)}
className={cn(
                      "p-1.5 rounded-lg text-left border transition-all cursor-pointer text-xs",
                      selectedAnchor === preset.id
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-200 shadow-sm"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    )}
                  >
                      {() => (
                          <>
                            <div className="font-bold flex items-center gap-1.5">
                      <span>{preset.icon}</span>
                      <span>{preset.label}</span>
                    </div>
                          <div className="text-[9px] text-slate-500 leading-tight pt-0.5">{preset.desc}</div>
                          </>
                        )}
                  </CustomizableButton>
                ))}
              </div>
            </div>

            {/* Uniform Padding Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  {uiText("components_smart_trim_modal.span.uniform_padding", "Uniform Padding")}
                </span>
                <span className="text-cyan-400 font-mono font-bold text-xs">
                  +{padding}{uiText("components_smart_trim_modal.span.px_2", " px")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="48"
                  step="1"
                  value={padding}
                  onChange={(e) => setPadding(parseInt(e.target.value, 10))}
                  className="flex-1 accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex items-center gap-1">
                  {[0, 2, 4, 8, 16].map((p) => (
                    <CustomizableButton
                      buttonId="smart_trim_modal_btn_7"
                      key={p}
type="button"
onClick={() => setPadding(p)}
className={cn(
                        "px-1.5 py-0.5 text-[9.5px] font-mono rounded border transition-all cursor-pointer",
                        padding === p
                          ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                      )}
                    >
                        {() => (
                            <>
                              {p}
                            {uiText("components_smart_trim_modal.button.px", "px")}
                            </>
                          )}
                    </CustomizableButton>
                  ))}
                </div>
              </div>
            </div>

            {/* Batch Standardization (Animation Frames) */}
            {items.length > 1 && (
              <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <CustomizableLabel
                  labelId="smart_trim_modal_item_6"
                  as="label"
                  className="flex items-center justify-between text-xs cursor-pointer"
                >
                    {() => (
                        <>
                          <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                    {uiText("components_smart_trim_modal.span.standardize_batch_frame_dimensions", "Standardize Batch Frame Dimensions")}
                  </span>
                        <input
                    type="checkbox"
                    checked={standardizeBatchSize}
                    onChange={(e) => {
                      setStandardizeBatchSize(e.target.checked);
                      if (e.target.checked) setPreserveOriginalSize(false);
                    }}
                    className="w-4 h-4 rounded border-slate-700 accent-cyan-500 cursor-pointer"
                  />
                        </>
                      )}
                </CustomizableLabel>
                <p className="text-[9.5px] text-slate-500">
                  {uiText("components_smart_trim_modal.p.standardizes_all_animation_frames_to_the_max", "Standardizes all animation frames to the maximum content bounding box with ground anchor alignment.")}
                </p>
              </div>
            )}

            {/* Preserve Original Canvas Dimensions Toggle */}
            <div className="p-2 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <CustomizableLabel
                labelId="smart_trim_modal_item_5"
                as="label"
                className="flex items-center justify-between text-xs cursor-pointer"
              >
                  {() => (
                      <>
                        <span className="text-slate-300 font-medium">{uiText("components_smart_trim_modal.span.preserve_original_canvas_size", "Preserve Original Canvas Size")}</span>
                      <input
                  type="checkbox"
                  checked={preserveOriginalSize}
                  onChange={(e) => {
                    setPreserveOriginalSize(e.target.checked);
                    if (e.target.checked) setStandardizeBatchSize(false);
                  }}
                  className="w-4 h-4 rounded border-slate-700 accent-cyan-500 cursor-pointer"
                />
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-[9.5px] text-slate-500">
                {uiText("components_smart_trim_modal.p.maintains_identical_canvas_width_and_height", "Maintains identical canvas width & height while shifting content to the selected anchor pivot.")}
              </p>
            </div>

            {/* Advanced Margin Fine-Tuning Dropdown */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <CustomizableButton
                buttonId="smart_trim_modal_btn_4"
                type="button"
onClick={() => setShowAdvancedMargins(!showAdvancedMargins)}
className="w-full px-2.5 py-1.5 bg-slate-950/80 hover:bg-slate-950 text-left text-xs font-semibold text-slate-300 flex items-center justify-between cursor-pointer"
              >
                  {() => (
                      <>
                        <span>{uiText("components_smart_trim_modal.span.individual_edge_offsets_t_b_l_r", "Individual Edge Offsets (T, B, L, R)")}</span>
                      {showAdvancedMargins ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </>
                    )}
              </CustomizableButton>

              {showAdvancedMargins && (
                <div className="p-2.5 bg-slate-950/50 grid grid-cols-2 gap-2 animate-in fade-in duration-100">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400">{uiText("components_smart_trim_modal.span.top_offset", "Top Offset: ")}{marginTop}{uiText("components_smart_trim_modal.span.px_3", "px")}</span>
                    <input
                      type="number"
                      value={marginTop}
                      onChange={(e) => setMarginTop(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 text-xs px-2 py-1 rounded border border-slate-700 text-slate-100"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400">{uiText("components_smart_trim_modal.span.bottom_offset", "Bottom Offset: ")}{marginBottom}{uiText("components_smart_trim_modal.span.px_4", "px")}</span>
                    <input
                      type="number"
                      value={marginBottom}
                      onChange={(e) => setMarginBottom(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 text-xs px-2 py-1 rounded border border-slate-700 text-slate-100"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400">{uiText("components_smart_trim_modal.span.left_offset", "Left Offset: ")}{marginLeft}{uiText("components_smart_trim_modal.span.px_5", "px")}</span>
                    <input
                      type="number"
                      value={marginLeft}
                      onChange={(e) => setMarginLeft(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 text-xs px-2 py-1 rounded border border-slate-700 text-slate-100"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400">{uiText("components_smart_trim_modal.span.right_offset", "Right Offset: ")}{marginRight}{uiText("components_smart_trim_modal.span.px_6", "px")}</span>
                    <input
                      type="number"
                      value={marginRight}
                      onChange={(e) => setMarginRight(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 text-xs px-2 py-1 rounded border border-slate-700 text-slate-100"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            {uiText("components_smart_trim_modal.div.applying_to", "Applying to ")}<span className="text-cyan-400 font-bold">{targetItemsToTrim.length}</span>{uiText("components_smart_trim_modal.div.slice_s", " slice(s)")}
          </div>

          <div className="flex items-center gap-2">
            <CustomizableButton
              buttonId="smart_trim_modal_btn_3"
              type="button"
onClick={onClose}
className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
                {() => (
                    <>
                      {uiText("components_smart_trim_modal.button.cancel", "Cancel")}
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="smart_trim_modal_btn_2"
              type="button"
disabled={isExportingZip || isApplying || targetItemsToTrim.length === 0}
onClick={handleExportZip}
className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
title={uiText("components_smart_trim_modal.button.streamline_asset_export_download_all_trimmed.title", "Streamline asset export: Download all trimmed slices as a clean ZIP archive")}
            >
                {() => (
                    <>
                      {isExportingZip ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{uiText("components_smart_trim_modal.span.exporting_zip", "Exporting ZIP...")}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{uiText("components_smart_trim_modal.span.download_trimmed_zip", "Download Trimmed ZIP (")}{targetItemsToTrim.length})</span>
                </>
              )}
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="smart_trim_modal_btn_1"
              type="button"
disabled={isApplying || isExportingZip || targetItemsToTrim.length === 0}
onClick={handleApply}
className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer transition-all flex items-center gap-1.5"
            >
                {() => (
                    <>
                      {isApplying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{uiText("components_smart_trim_modal.span.trimming", "Trimming...")}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{uiText("components_smart_trim_modal.span.apply_smart_trim", "Apply Smart Trim (")}{targetItemsToTrim.length})</span>
                </>
              )}
                    </>
                  )}
            </CustomizableButton>
          </div>
        </div>
      </div>
    </div>
  );
};
