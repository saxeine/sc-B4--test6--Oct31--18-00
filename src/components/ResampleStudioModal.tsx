import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  X,
  Sparkles,
  Sliders,
  Download,
  Check,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  SplitSquareVertical,
  RotateCcw,
  Eye,
  Columns,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Image as ImageIcon,
  Activity,
  Layers2,
  FileDown,
  Lock,
  Unlock,
  Wand2,
} from "lucide-react";
import {
  ResampleOptions,
  DEFAULT_RESAMPLE_OPTIONS,
  RESAMPLE_PRESETS,
  ResampleAlgorithm,
  executeResample,
} from "../utils/imageResampler";
import { CustomizableButton } from "./CustomizableButton";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";

export interface ResampleStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  sliceName?: string;
  sliceIndex?: number | null;
  slices?: Array<{ name: string; url: string }>;
  onNavigateFrame?: (index: number) => void;
  onApplyResampled?: (
    resampledUrl: string,
    targetSliceIndex?: number | null,
    name?: string,
    mode?: "replace" | "new_frame" | "asset_pool" | "canvas"
  ) => void;
}

type ViewMode = "split" | "side_by_side" | "enhanced_only";

export const ResampleStudioModal: React.FC<ResampleStudioModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  sliceName,
  sliceIndex,
  slices,
  onNavigateFrame,
  onApplyResampled,
}) => {
  // Active frame selection
  const [activeIdx, setActiveIdx] = useState<number>(sliceIndex ?? 0);

  useEffect(() => {
    if (sliceIndex !== undefined && sliceIndex !== null) {
      setActiveIdx(sliceIndex);
    }
  }, [sliceIndex]);

  const currentSlice = slices?.[activeIdx];
  const activeImageUrl = currentSlice?.url || imageUrl || "";
  const activeName =
    currentSlice?.name || sliceName || `Frame ${(activeIdx ?? 0) + 1}`;

  // Resample Options
  const [options, setOptions] = useState<ResampleOptions>(DEFAULT_RESAMPLE_OPTIONS);
  const [activePresetId, setActivePresetId] = useState<string>("hd_2x_degrain");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resampledDataUrl, setResampledDataUrl] = useState<string | null>(null);

  // Resolution Metadata
  const [origDims, setOrigDims] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [resampledDims, setResampledDims] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  // Custom Resolution & Aspect Ratio Lock
  const [isAspectLocked, setIsAspectLocked] = useState(true);
  const [customW, setCustomW] = useState<number>(0);
  const [customH, setCustomH] = useState<number>(0);

  // UI display state
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [splitPos, setSplitPos] = useState<number>(50); // percentage 0 - 100
  const [isHoldingOriginal, setIsHoldingOriginal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "presets" | "resolution" | "noise" | "blur" | "color"
  >("presets");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // References
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const processDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load original image dimensions
  useEffect(() => {
    if (!activeImageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      setOrigDims({ width: w, height: h });
      setCustomW(Math.round(w * options.scale));
      setCustomH(Math.round(h * options.scale));
    };
    img.src = activeImageUrl;
  }, [activeImageUrl, options.scale]);

  // Main processing pipeline with debounce
  const runProcessing = useCallback(
    async (optsToRun: ResampleOptions) => {
      if (!activeImageUrl) return;
      setIsProcessing(true);
      try {
        const result = await executeResample(activeImageUrl, optsToRun);
        setResampledDataUrl(result.dataUrl);
        setResampledDims({
          width: result.resampledWidth,
          height: result.resampledHeight,
        });
      } catch (err) {
        console.error("Resample execution error:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [activeImageUrl]
  );

  // Trigger processing on options change
  useEffect(() => {
    if (!isOpen || !activeImageUrl) return;

    if (processDebounceRef.current) {
      clearTimeout(processDebounceRef.current);
    }

    processDebounceRef.current = setTimeout(() => {
      runProcessing(options);
    }, 180);

    return () => {
      if (processDebounceRef.current) {
        clearTimeout(processDebounceRef.current);
      }
    };
  }, [options, activeImageUrl, isOpen, runProcessing]);

  // Update scale helper
  const handleSelectScale = (scaleFactor: number) => {
    setOptions((prev) => ({
      ...prev,
      scale: scaleFactor,
      targetWidth: undefined,
      targetHeight: undefined,
    }));
    setActivePresetId("custom");
    if (origDims.width > 0) {
      setCustomW(Math.round(origDims.width * scaleFactor));
      setCustomH(Math.round(origDims.height * scaleFactor));
    }
  };

  // Custom dimension change
  const handleCustomWidthChange = (val: number) => {
    const newW = Math.max(16, val);
    setCustomW(newW);
    let newH = customH;
    if (isAspectLocked && origDims.width > 0 && origDims.height > 0) {
      newH = Math.round((newW / origDims.width) * origDims.height);
      setCustomH(newH);
    }
    setOptions((prev) => ({
      ...prev,
      targetWidth: newW,
      targetHeight: newH,
    }));
    setActivePresetId("custom");
  };

  const handleCustomHeightChange = (val: number) => {
    const newH = Math.max(16, val);
    setCustomH(newH);
    let newW = customW;
    if (isAspectLocked && origDims.width > 0 && origDims.height > 0) {
      newW = Math.round((newH / origDims.height) * origDims.width);
      setCustomW(newW);
    }
    setOptions((prev) => ({
      ...prev,
      targetWidth: newW,
      targetHeight: newH,
    }));
    setActivePresetId("custom");
  };

  // Apply preset
  const handleSelectPreset = (preset: (typeof RESAMPLE_PRESETS)[0]) => {
    setActivePresetId(preset.id);
    setOptions((prev) => {
      const next = {
        ...prev,
        ...preset.options,
        targetWidth: undefined,
        targetHeight: undefined,
      };
      if (origDims.width > 0 && next.scale) {
        setCustomW(Math.round(origDims.width * next.scale));
        setCustomH(Math.round(origDims.height * next.scale));
      }
      return next;
    });
  };

  // Split view dragging
  const handleMouseDownSplit = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSplit(true);
  };

  const handleMouseMoveSplit = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingSplit || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const percent = Math.min(100, Math.max(0, (relativeX / rect.width) * 100));
      setSplitPos(percent);
    },
    [isDraggingSplit]
  );

  const handleMouseUpSplit = useCallback(() => {
    setIsDraggingSplit(false);
  }, []);

  useEffect(() => {
    if (isDraggingSplit) {
      window.addEventListener("mousemove", handleMouseMoveSplit);
      window.addEventListener("mouseup", handleMouseUpSplit);
      return () => {
        window.removeEventListener("mousemove", handleMouseMoveSplit);
        window.removeEventListener("mouseup", handleMouseUpSplit);
      };
    }
  }, [isDraggingSplit, handleMouseMoveSplit, handleMouseUpSplit]);

  // Frame navigation
  const handlePrevFrame = () => {
    if (!slices || slices.length <= 1) return;
    const nextIdx = (activeIdx - 1 + slices.length) % slices.length;
    setActiveIdx(nextIdx);
    onNavigateFrame?.(nextIdx);
  };

  const handleNextFrame = () => {
    if (!slices || slices.length <= 1) return;
    const nextIdx = (activeIdx + 1) % slices.length;
    setActiveIdx(nextIdx);
    onNavigateFrame?.(nextIdx);
  };

  // Action handlers
  const handleApply = (
    mode: "replace" | "new_frame" | "asset_pool" | "canvas"
  ) => {
    if (!resampledDataUrl) return;
    onApplyResampled?.(resampledDataUrl, activeIdx, activeName, mode);
    setFeedbackMsg(
      mode === "replace"
        ? `Frame replaced with ${resampledDims.width}×${resampledDims.height} HD definition!`
        : mode === "new_frame"
        ? "Resampled HD frame added to storyboard!"
        : mode === "canvas"
        ? "Resampled HD image loaded onto main canvas!"
        : "Sent to asset pool!"
    );
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleDownload = () => {
    if (!resampledDataUrl) return;
    const link = document.createElement("a");
    link.download = `${activeName.replace(/\.[^/.]+$/, "")}-resampled-${
      resampledDims.width || "hd"
    }x${resampledDims.height || "hd"}.png`;
    link.href = resampledDataUrl;
    link.click();
  };

  if (!isOpen) return null;

  const pixelMultiplier =
    origDims.width > 0 && resampledDims.width > 0
      ? (
          (resampledDims.width * resampledDims.height) /
          (origDims.width * origDims.height)
        ).toFixed(1)
      : (options.scale * options.scale).toFixed(1);

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex flex-col items-stretch overflow-hidden select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="flex-1 flex flex-col bg-[#020617] border border-cyan-500/30 m-2 sm:m-4 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Studio Header */}
        <div className="bg-[#090d16] px-4 py-2.5 border-b border-cyan-950/80 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CustomizableButton
                  buttonId="resample_studio_label_title"
                  defaultLabel="Resample Studio"
                  defaultIcon={<Sparkles className="w-4 h-4 text-cyan-400" />}
                  className="text-sm sm:text-base font-extrabold text-white tracking-wide flex items-center gap-1.5 cursor-default"
                />
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {uiText("components_resample_studio_modal.span.hd_resolution_and_de_grain", "HD Resolution & De-Grain")}
                </span>
                {isProcessing && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-400 animate-pulse font-mono font-medium">
                    <Activity className="w-3.5 h-3.5 animate-spin" />
                    {uiText("components_resample_studio_modal.span.resampling", "Resampling...")}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {uiText("components_resample_studio_modal.p.resample_individual_frames_to_higher_definit", "Resample individual frames to higher definitions, eliminate graininess, and restore razor-sharp edge focus")}
              </p>
            </div>
          </div>

          {/* Center Frame Navigation */}
          {slices && slices.length > 1 && (
            <div className="flex items-center gap-1.5 bg-[#020617] p-1 rounded-xl border border-slate-800 shadow-inner">
              <CustomizableButton
                buttonId="resample_studio_frame_prev"
                defaultLabel="Prev"
                defaultIcon={<ChevronLeft className="w-4 h-4" />}
                onClick={handlePrevFrame}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Previous Frame"
              />
              <div className="px-2.5 py-0.5 text-center">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {uiText("components_resample_studio_modal.span.frame", "Frame ")}{activeIdx + 1}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {" "}
                  / {slices.length}
                </span>
              </div>
              <CustomizableButton
                buttonId="resample_studio_frame_next"
                defaultLabel="Next"
                defaultIcon={<ChevronRight className="w-4 h-4" />}
                onClick={handleNextFrame}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Next Frame"
              />
            </div>
          )}

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode Selector */}
            <div className="flex items-center bg-[#020617] p-0.5 rounded-lg border border-slate-800 text-xs">
              <CustomizableButton
                buttonId="resample_studio_view_split"
                defaultLabel="Split"
                defaultIcon={<SplitSquareVertical className="w-3.5 h-3.5" />}
                onClick={() => setViewMode("split")}
                className={cn(
                  "px-2.5 py-1 rounded-md flex items-center gap-1 font-semibold transition-all cursor-pointer",
                  viewMode === "split"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
                title="Interactive Split Slider"
              />
              <CustomizableButton
                buttonId="resample_studio_view_side_by_side"
                defaultLabel="Side-by-Side"
                defaultIcon={<Columns className="w-3.5 h-3.5" />}
                onClick={() => setViewMode("side_by_side")}
                className={cn(
                  "px-2.5 py-1 rounded-md flex items-center gap-1 font-semibold transition-all cursor-pointer",
                  viewMode === "side_by_side"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
                title="Side by Side Dual Comparison"
              />
              <CustomizableButton
                buttonId="resample_studio_view_enhanced"
                defaultLabel="Resampled"
                defaultIcon={<Layers className="w-3.5 h-3.5" />}
                onClick={() => setViewMode("enhanced_only")}
                className={cn(
                  "px-2.5 py-1 rounded-md flex items-center gap-1 font-semibold transition-all cursor-pointer",
                  viewMode === "enhanced_only"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
                title="Resampled Output Only"
              />
            </div>

            {/* Hold to Preview Original */}
            <CustomizableButton
              buttonId="resample_studio_hold_original"
              defaultLabel="Hold for Original"
              defaultIcon={<Eye className="w-3.5 h-3.5 text-amber-400" />}
              onMouseDown={() => setIsHoldingOriginal(true)}
              onMouseUp={() => setIsHoldingOriginal(false)}
              onMouseLeave={() => setIsHoldingOriginal(false)}
              onTouchStart={() => setIsHoldingOriginal(true)}
              onTouchEnd={() => setIsHoldingOriginal(false)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer select-none",
                isHoldingOriginal
                  ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                  : "bg-[#020617] hover:bg-slate-900 text-slate-300 border-slate-800"
              )}
              title="Click and hold to compare with Original"
            />

            {/* Zoom Controls */}
            <div className="flex items-center bg-[#020617] rounded-lg border border-slate-800 p-0.5">
              <CustomizableButton
                buttonId="resample_studio_zoom_out"
                defaultLabel=""
                defaultIcon={<ZoomOut className="w-3.5 h-3.5" />}
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                title="Zoom Out"
              />
              <CustomizableButton
                buttonId="resample_studio_zoom_reset"
                defaultLabel={`${Math.round(zoomLevel * 100)}%`}
                onClick={() => setZoomLevel(1)}
                className="px-1.5 text-[10px] font-mono font-semibold text-cyan-400 cursor-pointer hover:bg-slate-800 rounded"
                title="Reset Zoom to 100%"
              />
              <CustomizableButton
                buttonId="resample_studio_zoom_in"
                defaultLabel=""
                defaultIcon={<ZoomIn className="w-3.5 h-3.5" />}
                onClick={() => setZoomLevel((z) => Math.min(4, z + 0.25))}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                title="Zoom In"
              />
            </div>

            <CustomizableButton
              buttonId="resample_studio_close"
              defaultLabel=""
              defaultIcon={<X className="w-4 h-4" />}
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
              title="Close Resample Studio"
            />
          </div>
        </div>

        {/* Resolution Inspector Bar */}
        <div className="bg-[#040813] px-4 py-1.5 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-3 text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              <span className="text-slate-400">{uiText("components_resample_studio_modal.span.native", "Native:")}</span>
              <span className="text-white font-bold">
                {origDims.width} × {origDims.height}{uiText("components_resample_studio_modal.span.px", " px")}
              </span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
              <span className="text-slate-400">{uiText("components_resample_studio_modal.span.resampled", "Resampled:")}</span>
              <span className="text-cyan-300 font-bold">
                {resampledDims.width || customW} ×{" "}
                {resampledDims.height || customH}{uiText("components_resample_studio_modal.span.px_2", " px")}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black">
                {pixelMultiplier}{uiText("components_resample_studio_modal.span.x_pixels", "x Pixels")}
              </span>
            </span>
          </div>

          {feedbackMsg && (
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold animate-in fade-in text-xs bg-emerald-950/60 px-3 py-0.5 rounded-full border border-emerald-500/40 shadow-lg">
              <Check className="w-3.5 h-3.5" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">{activeName}</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-cyan-400 uppercase">
              {options.algorithm}
            </span>
          </div>
        </div>

        {/* Center Main Split: Canvas Viewer (Left) + Control Panel (Right) */}
        <div className="flex-1 flex flex-col md:flex-row items-stretch overflow-hidden relative">
          {/* Main Visualizer Area */}
          <div
            ref={splitContainerRef}
            className="flex-1 relative overflow-hidden flex items-center justify-center p-4 bg-[#010409]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+CjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMwNzA1MTIiIC8+CjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMwNzA1MTIiIC8+Cjwvc3ZnPg==\")",
            }}
          >
            {/* View Mode: Split Comparison */}
            {viewMode === "split" && (
              <div
                className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-75 select-none"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {/* Resampled (Bottom/Right layer) */}
                <img
                  src={
                    isHoldingOriginal
                      ? activeImageUrl
                      : resampledDataUrl || activeImageUrl
                  }
                  alt={uiText("components_resample_studio_modal.img.resampled_frame.alt", "Resampled frame")}
                  className="max-w-[85vw] md:max-w-[55vw] max-h-[60vh] object-contain rounded-lg shadow-2xl pointer-events-none select-none border border-slate-800"
                />

                {/* Original (Clipped Top/Left layer) */}
                {!isHoldingOriginal && resampledDataUrl && (
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg"
                    style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                  >
                    <img
                      src={activeImageUrl}
                      alt={uiText("components_resample_studio_modal.img.original_frame.alt", "Original frame")}
                      className="w-full h-full object-contain pointer-events-none select-none"
                    />
                  </div>
                )}

                {/* Draggable Divider Line */}
                {!isHoldingOriginal && resampledDataUrl && (
                  <div
                    className="absolute top-0 bottom-0 z-20 pointer-events-auto cursor-ew-resize group"
                    style={{ left: `${splitPos}%`, transform: "translateX(-50%)" }}
                    onMouseDown={handleMouseDownSplit}
                  >
                    <div className="w-0.5 h-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,1)] group-hover:w-1 transition-all"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-cyan-500 border-2 border-slate-950 text-slate-950 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <SplitSquareVertical className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}

                {/* Watermark badges */}
                <div className="absolute top-3 left-3 z-10 pointer-events-none px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-slate-400 font-bold">
                  {uiText("components_resample_studio_modal.div.original_1x", "Original (1x)")}
                </div>
                <div className="absolute top-3 right-3 z-10 pointer-events-none px-2 py-0.5 rounded-md bg-cyan-950/90 backdrop-blur-md border border-cyan-500/50 text-[10px] font-mono text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                  {uiText("components_resample_studio_modal.div.resampled_hd", "Resampled HD (")}{options.scale}{uiText("components_resample_studio_modal.div.x", "x)")}
                </div>
              </div>
            )}

            {/* View Mode: Side by Side */}
            {viewMode === "side_by_side" && (
              <div
                className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-4 transition-transform duration-75 select-none"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {/* Left: Original */}
                <div className="flex-1 flex flex-col items-center justify-center relative max-h-[55vh]">
                  <img
                    src={activeImageUrl}
                    alt={uiText("components_resample_studio_modal.img.original.alt", "Original")}
                    className="max-w-full max-h-[50vh] object-contain rounded-lg border border-slate-800 shadow-xl"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-slate-400 font-bold">
                    {uiText("components_resample_studio_modal.div.original", "Original • ")}{origDims.width}×{origDims.height}
                  </div>
                </div>

                {/* Right: Resampled */}
                <div className="flex-1 flex flex-col items-center justify-center relative max-h-[55vh]">
                  <img
                    src={resampledDataUrl || activeImageUrl}
                    alt={uiText("components_resample_studio_modal.img.resampled.alt", "Resampled")}
                    className="max-w-full max-h-[50vh] object-contain rounded-lg border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-500/50 text-[10px] font-mono text-cyan-300 font-bold shadow-lg">
                    {uiText("components_resample_studio_modal.div.resampled_hd_2", "Resampled HD • ")}{resampledDims.width}×{resampledDims.height}
                  </div>
                </div>
              </div>
            )}

            {/* View Mode: Enhanced Only */}
            {viewMode === "enhanced_only" && (
              <div
                className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-75 select-none"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={
                    isHoldingOriginal
                      ? activeImageUrl
                      : resampledDataUrl || activeImageUrl
                  }
                  alt={uiText("components_resample_studio_modal.img.resampled_full.alt", "Resampled Full")}
                  className="max-w-[85vw] md:max-w-[60vw] max-h-[60vh] object-contain rounded-lg border border-cyan-500/40 shadow-2xl"
                />
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-500/50 text-[10px] font-mono text-cyan-300 font-bold shadow-lg">
                  {isHoldingOriginal
                    ? "PREVIEWING ORIGINAL"
                    : `RESAMPLED ${options.scale}x HD (${resampledDims.width}×${resampledDims.height})`}
                </div>
              </div>
            )}
          </div>

          {/* Right Control Inspector Sidebar */}
          <div className="w-full md:w-84 lg:w-96 bg-[#040813] border-t md:border-t-0 md:border-l border-slate-800/80 flex flex-col shrink-0 overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-800/80 bg-[#020617] text-xs font-semibold overflow-x-auto">
              <CustomizableButton
                buttonId="resample_studio_tab_presets"
                defaultLabel="Presets"
                onClick={() => setActiveTab("presets")}
                className={cn(
                  "flex-1 py-2 px-2.5 text-center border-b-2 transition-all cursor-pointer whitespace-nowrap",
                  activeTab === "presets"
                    ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                )}
              />
              <CustomizableButton
                buttonId="resample_studio_tab_resolution"
                defaultLabel="Resolution"
                onClick={() => setActiveTab("resolution")}
                className={cn(
                  "flex-1 py-2 px-2.5 text-center border-b-2 transition-all cursor-pointer whitespace-nowrap",
                  activeTab === "resolution"
                    ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                )}
              />
              <CustomizableButton
                buttonId="resample_studio_tab_degrain"
                defaultLabel="De-Grain"
                onClick={() => setActiveTab("noise")}
                className={cn(
                  "flex-1 py-2 px-2.5 text-center border-b-2 transition-all cursor-pointer whitespace-nowrap",
                  activeTab === "noise"
                    ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                )}
              />
              <CustomizableButton
                buttonId="resample_studio_tab_deblur"
                defaultLabel="De-Blur"
                onClick={() => setActiveTab("blur")}
                className={cn(
                  "flex-1 py-2 px-2.5 text-center border-b-2 transition-all cursor-pointer whitespace-nowrap",
                  activeTab === "blur"
                    ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                )}
              />
              <CustomizableButton
                buttonId="resample_studio_tab_tone"
                defaultLabel="Tone"
                onClick={() => setActiveTab("color")}
                className={cn(
                  "flex-1 py-2 px-2.5 text-center border-b-2 transition-all cursor-pointer whitespace-nowrap",
                  activeTab === "color"
                    ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                )}
              />
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* TAB 1: PRESETS */}
              {activeTab === "presets" && (
                <div className="space-y-2.5">
                  <div className="text-[11px] text-slate-400 font-medium">
                    {uiText("components_resample_studio_modal.div.curated_one_click_resampling_and_clarity_enh", "Curated one-click resampling and clarity enhancements:")}
                  </div>
                  {RESAMPLE_PRESETS.map((p) => {
                    const isSelected = activePresetId === p.id;
                    return (
                      <CustomizableButton
                        buttonId="resample_studio_modal_btn_5"
                        key={p.id}
type="button"
onClick={() => handleSelectPreset(p)}
className={cn(
                          "w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1",
                          isSelected
                            ? "bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.2)] ring-1 ring-cyan-400/30"
                            : "bg-[#090e1a] hover:bg-[#0f172a] border-slate-800 hover:border-slate-700"
                        )}
                      >
                          {() => (
                              <>
                                <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "font-bold text-xs",
                              isSelected ? "text-cyan-300" : "text-white"
                            )}
                          >
                            {p.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            {p.badge}
                          </span>
                        </div>
                              <p className="text-[10px] text-slate-400 leading-relaxed">
                          {p.description}
                        </p>
                              </>
                            )}
                      </CustomizableButton>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: RESOLUTION & SCALING */}
              {activeTab === "resolution" && (
                <div className="space-y-4">
                  <div>
                    <CustomizableLabel
                      labelId="resample_studio_modal_item_4"
                      as="label"
                      className="text-slate-300 font-semibold block mb-2"
                    >
                        {() => (
                            <>
                              {uiText("components_resample_studio_modal.label.resolution_scaling_factor", "Resolution Scaling Factor:")}
                            </>
                          )}
                    </CustomizableLabel>
                    <div className="grid grid-cols-3 gap-1.5">
                      <CustomizableButton
                        buttonId="resample_studio_scale_1x"
                        defaultLabel="1x Native"
                        onClick={() => handleSelectScale(1)}
                        className={cn(
                          "py-2 rounded-lg font-mono font-bold text-xs border transition-all cursor-pointer",
                          options.scale === 1
                            ? "bg-cyan-500 text-slate-950 border-cyan-300 shadow-md font-extrabold"
                            : "bg-[#090e1a] hover:bg-[#0f172a] text-slate-300 border-slate-800"
                        )}
                      />
                      <CustomizableButton
                        buttonId="resample_studio_scale_1_25x"
                        defaultLabel="1.25x"
                        onClick={() => handleSelectScale(1.25)}
                        className={cn(
                          "py-2 rounded-lg font-mono font-bold text-xs border transition-all cursor-pointer",
                          options.scale === 1.25
                            ? "bg-cyan-500 text-slate-950 border-cyan-300 shadow-md font-extrabold"
                            : "bg-[#090e1a] hover:bg-[#0f172a] text-slate-300 border-slate-800"
                        )}
                      />
                      <CustomizableButton
                        buttonId="resample_studio_scale_1_5x"
                        defaultLabel="1.5x"
                        onClick={() => handleSelectScale(1.5)}
                        className={cn(
                          "py-2 rounded-lg font-mono font-bold text-xs border transition-all cursor-pointer",
                          options.scale === 1.5
                            ? "bg-cyan-500 text-slate-950 border-cyan-300 shadow-md font-extrabold"
                            : "bg-[#090e1a] hover:bg-[#0f172a] text-slate-300 border-slate-800"
                        )}
                      />
                      <CustomizableButton
                        buttonId="resample_studio_scale_2x"
                        defaultLabel="2x HD"
                        onClick={() => handleSelectScale(2)}
                        className={cn(
                          "py-2 rounded-lg font-mono font-bold text-xs border transition-all cursor-pointer",
                          options.scale === 2
                            ? "bg-cyan-500 text-slate-950 border-cyan-300 shadow-md font-extrabold"
                            : "bg-[#090e1a] hover:bg-[#0f172a] text-slate-300 border-slate-800"
                        )}
                      />
                      <CustomizableButton
                        buttonId="resample_studio_scale_3x"
                        defaultLabel="3x QHD"
                        onClick={() => handleSelectScale(3)}
                        className={cn(
                          "py-2 rounded-lg font-mono font-bold text-xs border transition-all cursor-pointer",
                          options.scale === 3
                            ? "bg-cyan-500 text-slate-950 border-cyan-300 shadow-md font-extrabold"
                            : "bg-[#090e1a] hover:bg-[#0f172a] text-slate-300 border-slate-800"
                        )}
                      />
                      <CustomizableButton
                        buttonId="resample_studio_scale_4x"
                        defaultLabel="4x 4K"
                        onClick={() => handleSelectScale(4)}
                        className={cn(
                          "py-2 rounded-lg font-mono font-bold text-xs border transition-all cursor-pointer",
                          options.scale === 4
                            ? "bg-cyan-500 text-slate-950 border-cyan-300 shadow-md font-extrabold"
                            : "bg-[#090e1a] hover:bg-[#0f172a] text-slate-300 border-slate-800"
                        )}
                      />
                    </div>
                  </div>

                  {/* Custom Dimensions */}
                  <div className="bg-[#090e1a] p-3 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300">
                        {uiText("components_resample_studio_modal.span.custom_pixel_dimensions", "Custom Pixel Dimensions:")}
                      </span>
                      <CustomizableButton
                        buttonId="resample_studio_aspect_lock"
                        defaultLabel={isAspectLocked ? "Locked" : "Free"}
                        defaultIcon={isAspectLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        onClick={() => setIsAspectLocked((prev) => !prev)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] flex items-center gap-1 border transition-colors cursor-pointer",
                          isAspectLocked
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        )}
                        title={
                          isAspectLocked
                            ? "Aspect ratio locked"
                            : "Aspect ratio unlocked"
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">
                          {uiText("components_resample_studio_modal.span.width_px", "Width (px)")}
                        </span>
                        <input
                          type="number"
                          value={customW}
                          onChange={(e) =>
                            handleCustomWidthChange(Number(e.target.value))
                          }
                          className="w-full bg-[#020617] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-400 outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">
                          {uiText("components_resample_studio_modal.span.height_px", "Height (px)")}
                        </span>
                        <input
                          type="number"
                          value={customH}
                          onChange={(e) =>
                            handleCustomHeightChange(Number(e.target.value))
                          }
                          className="w-full bg-[#020617] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-400 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resampling Algorithm */}
                  <div>
                    <CustomizableLabel
                      labelId="resample_studio_modal_item_3"
                      as="label"
                      className="text-slate-300 font-semibold block mb-1.5"
                    >
                        {() => (
                            <>
                              {uiText("components_resample_studio_modal.label.resampling_algorithm", "Resampling Algorithm:")}
                            </>
                          )}
                    </CustomizableLabel>
                    <select
                      value={options.algorithm}
                      onChange={(e) => {
                        setOptions((prev) => ({
                          ...prev,
                          algorithm: e.target.value as ResampleAlgorithm,
                        }));
                        setActivePresetId("custom");
                      }}
                      className="w-full bg-[#090e1a] border border-slate-800 rounded-lg px-3 py-2 text-xs text-cyan-300 font-bold focus:border-cyan-400 outline-none cursor-pointer"
                    >
                      <option value="lanczos3">
                        {uiText("components_resample_studio_modal.option.lanczos_3_sinc_sharpest_edges_and_detail", "Lanczos-3 Sinc (Sharpest Edges & Detail)")}
                      </option>
                      <option value="super_resolution">
                        {uiText("components_resample_studio_modal.option.super_resolution_micro_detail_synthesis", "Super-Resolution (Micro-Detail Synthesis)")}
                      </option>
                      <option value="bicubic">
                        {uiText("components_resample_studio_modal.option.bicubic_hermite_continuous_smooth_spline", "Bicubic Hermite (Continuous Smooth Spline)")}
                      </option>
                      <option value="bilinear">
                        {uiText("components_resample_studio_modal.option.bilinear_fast_artifact_free_smooth", "Bilinear (Fast Artifact-Free Smooth)")}
                      </option>
                      <option value="nearest">
                        {uiText("components_resample_studio_modal.option.nearest_neighbor_pixel_art_integer_exact", "Nearest Neighbor (Pixel Art Integer Exact)")}
                      </option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 3: FIX GRAININESS & NOISE */}
              {activeTab === "noise" && (
                <div className="space-y-4">
                  <div className="text-[11px] text-slate-400 bg-cyan-950/20 p-2.5 rounded-xl border border-cyan-900/50">
                    {uiText("components_resample_studio_modal.div.bilateral_edge_preserving_filter_targets_iso", "Bilateral edge-preserving filter targets ISO sensor noise, film grain, and compression speckles without blurring sharp lines.")}
                  </div>

                  {/* Denoise Strength */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-300 font-semibold">
                        {uiText("components_resample_studio_modal.span.denoise_strength", "Denoise Strength:")}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {options.denoiseStrength}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={options.denoiseStrength}
                      onChange={(e) => {
                        setOptions((prev) => ({
                          ...prev,
                          denoiseStrength: Number(e.target.value),
                        }));
                        setActivePresetId("custom");
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* Grain Reduction */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-300 font-semibold">
                        {uiText("components_resample_studio_modal.span.grain_and_speckle_reduction", "Grain & Speckle Reduction:")}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {options.grainReduction}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={options.grainReduction}
                      onChange={(e) => {
                        setOptions((prev) => ({
                          ...prev,
                          grainReduction: Number(e.target.value),
                        }));
                        setActivePresetId("custom");
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* Chroma Denoise */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-300 font-semibold">
                        {uiText("components_resample_studio_modal.span.chroma_noise_clean_color_specks", "Chroma Noise Clean (Color Specks):")}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {options.chromaDenoise}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={options.chromaDenoise}
                      onChange={(e) => {
                        setOptions((prev) => ({
                          ...prev,
                          chromaDenoise: Number(e.target.value),
                        }));
                        setActivePresetId("custom");
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: FIX BLUR & RESTORE FOCUS */}
              {activeTab === "blur" && (
                <div className="space-y-4">
                  <div className="text-[11px] text-slate-400 bg-cyan-950/20 p-2.5 rounded-xl border border-cyan-900/50">
                    {uiText("components_resample_studio_modal.div.high_pass_deconvolution_restores_lens_softne", "High-pass deconvolution restores lens softness, motion blur, and edge contrast boundaries.")}
                  </div>

                  {/* De-blur Amount */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-300 font-semibold">
                        {uiText("components_resample_studio_modal.span.de_blur_amount", "De-Blur Amount:")}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {options.deblurAmount}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={300}
                      value={options.deblurAmount}
                      onChange={(e) => {
                        setOptions((prev) => ({
                          ...prev,
                          deblurAmount: Number(e.target.value),
                        }));
                        setActivePresetId("custom");
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* De-blur Radius */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-300 font-semibold">
                        {uiText("components_resample_studio_modal.span.blur_radius_target", "Blur Radius Target:")}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {options.deblurRadius.toFixed(1)}{uiText("components_resample_studio_modal.span.px_3", " px")}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.4}
                      max={4.0}
                      step={0.1}
                      value={options.deblurRadius}
                      onChange={(e) => {
                        setOptions((prev) => ({
                          ...prev,
                          deblurRadius: Number(e.target.value),
                        }));
                        setActivePresetId("custom");
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* Edge Crispness */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-300 font-semibold">
                        {uiText("components_resample_studio_modal.span.edge_crispness_and_inks", "Edge Crispness & Inks:")}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {options.edgeCrispness}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={options.edgeCrispness}
                      onChange={(e) => {
                        setOptions((prev) => ({
                          ...prev,
                          edgeCrispness: Number(e.target.value),
                        }));
                        setActivePresetId("custom");
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* Clarity */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-300 font-semibold">
                        {uiText("components_resample_studio_modal.span.micro_clarity_and_texture", "Micro-Clarity & Texture:")}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {options.clarity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={options.clarity}
                      onChange={(e) => {
                        setOptions((prev) => ({
                          ...prev,
                          clarity: Number(e.target.value),
                        }));
                        setActivePresetId("custom");
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: TONE & COLOR */}
              {activeTab === "color" && (
                <div className="space-y-4">
                  {/* Contrast */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-300 font-semibold">
                        {uiText("components_resample_studio_modal.span.contrast", "Contrast:")}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {options.contrast > 0
                          ? `+${options.contrast}`
                          : options.contrast}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={options.contrast}
                      onChange={(e) => {
                        setOptions((prev) => ({
                          ...prev,
                          contrast: Number(e.target.value),
                        }));
                        setActivePresetId("custom");
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* Brightness */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-300 font-semibold">
                        {uiText("components_resample_studio_modal.span.brightness", "Brightness:")}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {options.brightness > 0
                          ? `+${options.brightness}`
                          : options.brightness}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={options.brightness}
                      onChange={(e) => {
                        setOptions((prev) => ({
                          ...prev,
                          brightness: Number(e.target.value),
                        }));
                        setActivePresetId("custom");
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* Saturation */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-300 font-semibold">
                        {uiText("components_resample_studio_modal.span.saturation", "Saturation:")}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {options.saturation > 0
                          ? `+${options.saturation}`
                          : options.saturation}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      value={options.saturation}
                      onChange={(e) => {
                        setOptions((prev) => ({
                          ...prev,
                          saturation: Number(e.target.value),
                        }));
                        setActivePresetId("custom");
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <CustomizableButton
                    buttonId="resample_studio_modal_btn_2"
                    defaultIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    type="button"
onClick={() => {
                      setOptions(DEFAULT_RESAMPLE_OPTIONS);
                      setActivePresetId("hd_2x_degrain");
                    }}
className="w-full py-2 bg-[#090e1a] hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
                  >
                      {() => (
                          <>
                            {uiText("components_resample_studio_modal.button.reset_to_factory_defaults", "Reset to Factory Defaults")}
                          </>
                        )}
                  </CustomizableButton>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Strip of Frames (if available) + Action Buttons */}
        <div className="bg-[#090d16] px-4 py-3 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
          {/* Thumbnails of other frames */}
          {slices && slices.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto max-w-full md:max-w-[45vw] py-1 select-none">
              <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">
                {uiText("components_resample_studio_modal.span.frames", "Frames:")}
              </span>
              {slices.map((s, idx) => (
                <CustomizableButton
                  buttonId="resample_studio_modal_btn_1"
                  key={idx}
type="button"
onClick={() => {
                    setActiveIdx(idx);
                    onNavigateFrame?.(idx);
                  }}
className={cn(
                    "w-12 h-9 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer relative",
                    activeIdx === idx
                      ? "border-cyan-400 ring-2 ring-cyan-400/50 scale-105"
                      : "border-slate-800 opacity-60 hover:opacity-100"
                  )}
title={s.name || `Frame ${idx + 1}`}
                >
                    {() => (
                        <>
                          <img
                    src={s.url}
                    alt={s.name}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-white font-mono text-center truncate">
                    #{idx + 1}
                  </span>
                        </>
                      )}
                </CustomizableButton>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-slate-500">
              {uiText("components_resample_studio_modal.div.ready_to_replace_or_create_new_enhanced_fram", "Ready to replace or create new enhanced frames.")}
            </div>
          )}

          {/* Action Execution Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <CustomizableButton
              buttonId="resample_studio_download"
              defaultLabel="Download"
              defaultIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleDownload}
              className="px-3 py-2 bg-[#020617] hover:bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download Resampled Image (PNG)"
            />

            <CustomizableButton
              buttonId="resample_studio_apply_canvas"
              defaultLabel="To Canvas"
              defaultIcon={<ImageIcon className="w-3.5 h-3.5" />}
              onClick={() => handleApply("canvas")}
              className="px-3 py-2 bg-slate-900 hover:bg-cyan-950 border border-cyan-800/60 text-cyan-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Apply resampled image to the Main Carver/Crop Canvas"
            />

            <CustomizableButton
              buttonId="resample_studio_apply_new_frame"
              defaultLabel="Add New Frame"
              defaultIcon={<Layers2 className="w-3.5 h-3.5" />}
              onClick={() => handleApply("new_frame")}
              className="px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-[1.02]"
              title="Add as a new enhanced frame into the Storyboard"
            />

            <CustomizableButton
              buttonId="resample_studio_apply_replace"
              defaultLabel="Replace Frame"
              defaultIcon={<Check className="w-4 h-4 stroke-[3]" />}
              onClick={() => handleApply("replace")}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:scale-[1.02] active:scale-95"
              title="Replace the current frame with the Resampled HD output"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
