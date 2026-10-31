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
  Layers,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Columns,
  Focus,
  Wand2,
  FileDown,
  Layers2,
  Image as ImageIcon,
} from "lucide-react";
import {
  SharpenerOptions,
  DEFAULT_SHARPENER_OPTIONS,
  SHARPENER_PRESETS,
  processEnhancedImage,
} from "../utils/imageSharpener";
import { CustomizableButton } from "./CustomizableButton";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";

export interface ImageSharpenerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  sliceName?: string;
  sliceIndex?: number | null;
  slices?: Array<{ name: string; url: string }>;
  onNavigateFrame?: (index: number) => void;
  onApplyEnhanced?: (
    enhancedUrl: string,
    targetSliceIndex?: number | null,
    name?: string,
    mode?: "replace" | "new_frame" | "asset_pool" | "canvas"
  ) => void;
}

type ViewMode = "split" | "side_by_side" | "enhanced_only";

export const ImageSharpenerModal: React.FC<ImageSharpenerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  sliceName,
  sliceIndex,
  slices,
  onNavigateFrame,
  onApplyEnhanced,
}) => {
  // Active slice indexing
  const [activeIdx, setActiveIdx] = useState<number>(sliceIndex ?? 0);

  useEffect(() => {
    if (sliceIndex !== undefined && sliceIndex !== null) {
      setActiveIdx(sliceIndex);
    }
  }, [sliceIndex]);

  // Resolve current active image & name
  const currentSlice = slices?.[activeIdx];
  const activeImageUrl = currentSlice?.url || imageUrl || "";
  const activeName =
    currentSlice?.name || sliceName || `Frame ${(activeIdx ?? 0) + 1}`;

  // Processing state
  const [options, setOptions] = useState<SharpenerOptions>(DEFAULT_SHARPENER_OPTIONS);
  const [activePresetId, setActivePresetId] = useState<string>("super_sharp_2x");
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancedDataUrl, setEnhancedDataUrl] = useState<string | null>(null);

  // Resolution metadata
  const [origDims, setOrigDims] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // UI Display state
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [splitPos, setSplitPos] = useState<number>(50); // percentage 0 - 100
  const [isHoldingOriginal, setIsHoldingOriginal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [activeTab, setActiveTab] = useState<"sharpness" | "clarity" | "color" | "presets">("sharpness");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // References
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Navigate to prev / next frame
  const handleNavigate = useCallback(
    (newIdx: number) => {
      if (!slices || slices.length === 0) return;
      if (newIdx < 0 || newIdx >= slices.length) return;
      setActiveIdx(newIdx);
      if (onNavigateFrame) {
        onNavigateFrame(newIdx);
      }
    },
    [slices, onNavigateFrame]
  );

  // Load image dimensions
  useEffect(() => {
    if (!activeImageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = activeImageUrl;
    img.onload = () => {
      setOrigDims({ width: img.naturalWidth, height: img.naturalHeight });
      sourceImageRef.current = img;
      triggerProcessing(img, options);
    };
  }, [activeImageUrl]);

  // Debounced processing
  const triggerProcessing = useCallback(
    (img: HTMLImageElement, opts: SharpenerOptions) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setIsProcessing(true);
      debounceTimerRef.current = setTimeout(() => {
        try {
          const canvas = processEnhancedImage(img, opts);
          const dataUrl = canvas.toDataURL("image/png");
          setEnhancedDataUrl(dataUrl);
        } catch (err) {
          console.error("Sharpener processing error:", err);
        } finally {
          setIsProcessing(false);
        }
      }, 50);
    },
    []
  );

  // Update options & trigger re-render
  const updateOption = <K extends keyof SharpenerOptions>(
    key: K,
    val: SharpenerOptions[K]
  ) => {
    const next = { ...options, [key]: val };
    setOptions(next);
    setActivePresetId("custom");
    if (sourceImageRef.current) {
      triggerProcessing(sourceImageRef.current, next);
    }
  };

  // Apply preset
  const handleApplyPreset = (preset: typeof SHARPENER_PRESETS[0]) => {
    setActivePresetId(preset.id);
    setOptions(preset.options);
    if (sourceImageRef.current) {
      triggerProcessing(sourceImageRef.current, preset.options);
    }
  };

  // Reset to factory defaults
  const handleReset = () => {
    setOptions(DEFAULT_SHARPENER_OPTIONS);
    setActivePresetId("super_sharp_2x");
    if (sourceImageRef.current) {
      triggerProcessing(sourceImageRef.current, DEFAULT_SHARPENER_OPTIONS);
    }
  };

  // Handle Split drag
  const handleSplitMouseMove = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!isDraggingSplit || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.min(100, Math.max(0, (x / rect.width) * 100));
      setSplitPos(pct);
    },
    [isDraggingSplit]
  );

  const handleSplitMouseUp = useCallback(() => {
    setIsDraggingSplit(false);
  }, []);

  useEffect(() => {
    if (isDraggingSplit) {
      window.addEventListener("mousemove", handleSplitMouseMove);
      window.addEventListener("mouseup", handleSplitMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleSplitMouseMove);
        window.removeEventListener("mouseup", handleSplitMouseUp);
      };
    }
  }, [isDraggingSplit, handleSplitMouseMove, handleSplitMouseUp]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "Escape") {
        onClose();
      } else if (e.code === "Space") {
        e.preventDefault();
        setIsHoldingOriginal(true);
      } else if (e.key === "ArrowLeft" && slices && slices.length > 1) {
        handleNavigate(Math.max(0, activeIdx - 1));
      } else if (e.key === "ArrowRight" && slices && slices.length > 1) {
        handleNavigate(Math.min(slices.length - 1, activeIdx + 1));
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        handleApplyAction("replace");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsHoldingOriginal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isOpen, activeIdx, slices, handleNavigate, onClose]);

  // Final actions
  const handleApplyAction = (
    mode: "replace" | "new_frame" | "asset_pool" | "canvas"
  ) => {
    if (!enhancedDataUrl) return;
    if (onApplyEnhanced) {
      onApplyEnhanced(
        enhancedDataUrl,
        activeIdx,
        `${activeName}_sharpened_${options.scale}x`,
        mode
      );
    }
    const label =
      mode === "replace"
        ? "Updated active frame!"
        : mode === "new_frame"
        ? "Added as new Storyboard frame!"
        : mode === "asset_pool"
        ? "Sent to Asset Pool!"
        : "Replaced main workspace canvas!";
    setFeedbackMsg(label);
    setTimeout(() => {
      setFeedbackMsg(null);
      if (mode === "replace") {
        onClose();
      }
    }, 1200);
  };

  const handleDownload = () => {
    if (!enhancedDataUrl) return;
    const a = document.createElement("a");
    a.href = enhancedDataUrl;
    a.download = `${activeName.replace(/\.[^/.]+$/, "")}_sharp_${options.scale}x.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setFeedbackMsg("Downloaded enhanced image!");
    setTimeout(() => setFeedbackMsg(null), 2000);
  };

  if (!isOpen) return null;

  const targetWidth = Math.round(origDims.width * options.scale);
  const targetHeight = Math.round(origDims.height * options.scale);

  return (
    <div
      className="fixed inset-0 bg-slate-950/92 backdrop-blur-md z-50 flex flex-col overflow-hidden animate-in fade-in duration-200 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Header Toolbar */}
      <div className="h-12 bg-[#090d16] border-b border-slate-800/90 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center shadow-inner">
            <Focus className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CustomizableButton
                buttonId="sharpener_studio_label_title"
                defaultLabel="Resolution Sharpener Studio"
                defaultIcon={<Focus className="w-3.5 h-3.5 text-amber-400" />}
                className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-default"
              />
              <span className="text-[10px] text-amber-400/80 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.2 rounded font-sans font-semibold normal-case">
                {options.scale}{uiText("components_image_sharpener_modal.span.x_hd", "x HD")}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[300px]">
              {uiText("components_image_sharpener_modal.p.editing", "Editing: ")}<span className="text-slate-200 font-medium">{activeName}</span>
            </p>
          </div>

          {/* Slices Navigation */}
          {slices && slices.length > 1 && (
            <div className="hidden sm:flex items-center gap-1 bg-[#020617] px-2 py-1 rounded-lg border border-slate-800 ml-3">
              <CustomizableButton
                buttonId="sharpener_studio_slice_prev"
                defaultLabel="Prev"
                defaultIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                onClick={() => handleNavigate(Math.max(0, activeIdx - 1))}
                disabled={activeIdx <= 0}
                className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                title="Previous Slice (Left Arrow)"
              />
              <span className="text-[10px] font-mono text-amber-300 px-1 font-semibold">
                {activeIdx + 1} / {slices.length}
              </span>
              <CustomizableButton
                buttonId="sharpener_studio_slice_next"
                defaultLabel="Next"
                defaultIcon={<ChevronRight className="w-3.5 h-3.5" />}
                onClick={() => handleNavigate(Math.min(slices.length - 1, activeIdx + 1))}
                disabled={activeIdx >= slices.length - 1}
                className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                title="Next Slice (Right Arrow)"
              />
            </div>
          )}
        </div>

        {/* Center View Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#020617] border border-slate-800 p-0.5 rounded-lg">
          <CustomizableButton
            buttonId="sharpener_studio_view_split"
            defaultLabel="Split Compare"
            defaultIcon={<SplitSquareVertical className="w-3.5 h-3.5" />}
            onClick={() => setViewMode("split")}
            className={cn(
              "px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer flex items-center gap-1",
              viewMode === "split"
                ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                : "text-slate-400 hover:text-slate-200"
            )}
            title="Split-Screen Comparison Slider"
          />
          <CustomizableButton
            buttonId="sharpener_studio_view_side_by_side"
            defaultLabel="Side by Side"
            defaultIcon={<Columns className="w-3.5 h-3.5" />}
            onClick={() => setViewMode("side_by_side")}
            className={cn(
              "px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer flex items-center gap-1",
              viewMode === "side_by_side"
                ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                : "text-slate-400 hover:text-slate-200"
            )}
            title="Side-by-Side Comparison"
          />
          <CustomizableButton
            buttonId="sharpener_studio_view_enhanced"
            defaultLabel="Enhanced"
            defaultIcon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={() => setViewMode("enhanced_only")}
            className={cn(
              "px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer flex items-center gap-1",
              viewMode === "enhanced_only"
                ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                : "text-slate-400 hover:text-slate-200"
            )}
            title="Full Enhanced Output"
          />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Hold to View Original Button */}
          <CustomizableButton
            buttonId="sharpener_studio_hold_original"
            defaultLabel="Hold for Original"
            defaultIcon={isHoldingOriginal ? <Eye className="w-3.5 h-3.5 text-rose-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            onMouseDown={() => setIsHoldingOriginal(true)}
            onMouseUp={() => setIsHoldingOriginal(false)}
            onMouseLeave={() => setIsHoldingOriginal(false)}
            onTouchStart={() => setIsHoldingOriginal(true)}
            onTouchEnd={() => setIsHoldingOriginal(false)}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer select-none",
              isHoldingOriginal
                ? "bg-rose-500/30 text-rose-200 border-rose-400"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
            )}
            title="Hold button (or press Spacebar) to preview original raw image"
          />

          {/* Reset button */}
          <CustomizableButton
            buttonId="sharpener_studio_reset"
            defaultLabel="Reset"
            defaultIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
            title="Reset to default settings"
          />

          {/* Close button */}
          <CustomizableButton
            buttonId="sharpener_studio_close"
            defaultLabel=""
            defaultIcon={<X className="w-4 h-4" />}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
            title="Close (Esc)"
          />
        </div>
      </div>

      {/* 2. Main Content Area: Split View + Control Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left / Center Viewport */}
        <div className="flex-1 relative flex flex-col bg-[#050811] overflow-hidden">
          {/* Zoom Bar & Dimension Badges */}
          <div className="h-8 bg-[#0a0f1d]/80 border-b border-slate-800/80 px-3 flex items-center justify-between text-[11px] text-slate-400 z-10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-400 text-[10px]">
                {uiText("components_image_sharpener_modal.span.raw", "Raw: ")}<strong className="text-slate-200">{origDims.width}×{origDims.height}</strong>
              </span>
              <ArrowRight className="w-3 h-3 text-amber-400/80" />
              <span className="font-mono text-amber-300 text-[10px]">
                {uiText("components_image_sharpener_modal.span.sharp_hd", "Sharp HD: ")}<strong className="text-amber-200">{targetWidth}×{targetHeight}</strong> ({options.scale}{uiText("components_image_sharpener_modal.span.x", "x)")}
              </span>
              {isProcessing && (
                <span className="ml-2 flex items-center gap-1 text-[10px] text-cyan-400 font-mono animate-pulse">
                  <Wand2 className="w-3 h-3 animate-spin" />{uiText("components_image_sharpener_modal.span.sharpening", " Sharpening...")}
                </span>
              )}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <CustomizableButton
                buttonId="sharpener_studio_zoom_out"
                defaultLabel=""
                defaultIcon={<ZoomOut className="w-3 h-3" />}
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title="Zoom Out (-)"
              />
              <span className="font-mono text-[10px] text-slate-300 min-w-[38px] text-center font-bold">
                {Math.round(zoomLevel * 100)}%
              </span>
              <CustomizableButton
                buttonId="sharpener_studio_zoom_in"
                defaultLabel=""
                defaultIcon={<ZoomIn className="w-3 h-3" />}
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title="Zoom In (+)"
              />
              <CustomizableButton
                buttonId="sharpener_studio_zoom_fit"
                defaultLabel="Fit"
                onClick={() => setZoomLevel(1)}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer",
                  zoomLevel === 1
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                )}
                title="Fit to Container"
              />
            </div>
          </div>

          {/* Interactive Image Canvas Area */}
          <div
            ref={splitContainerRef}
            className="flex-1 relative flex items-center justify-center p-4 overflow-auto cursor-grab active:cursor-grabbing"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+CjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMwNDAzMGMiIC8+CjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMwNDAzMGMiIC8+Cjwvc3ZnPg==\")",
            }}
          >
            {/* If Holding Original, show raw */}
            {isHoldingOriginal ? (
              <div
                className="relative transition-transform duration-100"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={activeImageUrl}
                  alt={uiText("components_image_sharpener_modal.img.original.alt", "Original")}
                  className="max-w-[75vw] max-h-[70vh] object-contain rounded-lg border-2 border-rose-500 shadow-2xl"
                />
                <span className="absolute top-2 left-2 bg-rose-950/90 text-rose-300 border border-rose-500/60 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  {uiText("components_image_sharpener_modal.span.viewing_raw_original_space_pressed", "Viewing Raw Original (Space Pressed)")}
                </span>
              </div>
            ) : viewMode === "split" ? (
              /* Split-Slider Comparison */
              <div
                className="relative select-none max-w-[75vw] max-h-[70vh] overflow-hidden rounded-lg border border-slate-850 shadow-2xl"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {/* Background: Enhanced Sharpened Image */}
                <img
                  src={enhancedDataUrl || activeImageUrl}
                  alt={uiText("components_image_sharpener_modal.img.enhanced.alt", "Enhanced")}
                  className="w-full h-auto max-w-[75vw] max-h-[70vh] object-contain block pointer-events-none"
                />

                {/* Foreground: Original Image with clip path based on splitPos */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                >
                  <img
                    src={activeImageUrl}
                    alt={uiText("components_image_sharpener_modal.img.raw_original.alt", "Raw Original")}
                    className="w-full h-auto max-w-[75vw] max-h-[70vh] object-contain block"
                  />
                  <div className="absolute top-2 left-2 bg-slate-950/80 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider">
                    {uiText("components_image_sharpener_modal.div.raw_original", "Raw Original")}
                  </div>
                </div>

                {/* Right Badge */}
                <div
                  className="absolute top-2 right-2 bg-amber-950/85 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider pointer-events-none"
                  style={{ opacity: splitPos < 80 ? 1 : 0 }}
                >
                  {uiText("components_image_sharpener_modal.div.enhanced_hd", "Enhanced HD (")}{options.scale}{uiText("components_image_sharpener_modal.div.x", "x)")}
                </div>

                {/* Split Handle Divider */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400 cursor-ew-resize z-20"
                  style={{ left: `${splitPos}%` }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsDraggingSplit(true);
                  }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-500 border-2 border-slate-950 shadow-lg flex items-center justify-center cursor-ew-resize text-slate-950">
                    <SplitSquareVertical className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ) : viewMode === "side_by_side" ? (
              /* Side-by-Side Comparison */
              <div
                className="flex items-center gap-4 max-w-[80vw] max-h-[70vh]"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <div className="flex-1 relative rounded-lg border border-slate-800 overflow-hidden shadow-xl">
                  <div className="absolute top-2 left-2 z-10 bg-slate-950/80 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[9.5px] font-bold uppercase">
                    {uiText("components_image_sharpener_modal.div.raw_original_2", "Raw Original")}
                  </div>
                  <img
                    src={activeImageUrl}
                    alt={uiText("components_image_sharpener_modal.img.original.alt_2", "Original")}
                    className="max-w-[36vw] max-h-[65vh] object-contain block"
                  />
                </div>
                <div className="flex-1 relative rounded-lg border border-amber-500/40 overflow-hidden shadow-xl">
                  <div className="absolute top-2 left-2 z-10 bg-amber-950/90 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded text-[9.5px] font-bold uppercase">
                    {uiText("components_image_sharpener_modal.div.sharpened_hd", "Sharpened HD (")}{options.scale}{uiText("components_image_sharpener_modal.div.x_2", "x)")}
                  </div>
                  <img
                    src={enhancedDataUrl || activeImageUrl}
                    alt={uiText("components_image_sharpener_modal.img.enhanced.alt_2", "Enhanced")}
                    className="max-w-[36vw] max-h-[65vh] object-contain block"
                  />
                </div>
              </div>
            ) : (
              /* Enhanced Only */
              <div
                className="relative max-w-[75vw] max-h-[70vh] rounded-lg border border-amber-500/30 overflow-hidden shadow-2xl"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={enhancedDataUrl || activeImageUrl}
                  alt={uiText("components_image_sharpener_modal.img.enhanced_only.alt", "Enhanced Only")}
                  className="max-w-[75vw] max-h-[70vh] object-contain block"
                />
                <div className="absolute top-2 left-2 bg-amber-950/90 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded text-[9.5px] font-bold uppercase">
                  {uiText("components_image_sharpener_modal.div.enhanced_resolution", "Enhanced Resolution (")}{options.scale}{uiText("components_image_sharpener_modal.div.x_3", "x)")}
                </div>
              </div>
            )}
          </div>

          {/* Feedback notification toast */}
          {feedbackMsg && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-emerald-950/95 border border-emerald-500/60 text-emerald-200 px-3.5 py-1.5 rounded-lg shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{feedbackMsg}</span>
            </div>
          )}
        </div>

        {/* Right Studio Sidebar: Controls & Presets */}
        <div className="w-full md:w-80 lg:w-96 bg-[#0c101c] border-t md:border-t-0 md:border-l border-slate-800/90 flex flex-col shrink-0">
          {/* Preset Buttons Carousel */}
          <div className="p-3 border-b border-slate-800 bg-[#080c16]">
            <CustomizableButton
              buttonId="sharpener_studio_label_presets"
              defaultLabel="One-Click Enhancement Presets"
              defaultIcon={<Sparkles className="w-3 h-3 text-amber-400" />}
              className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5 cursor-default"
            />
            <div className="grid grid-cols-2 gap-1.5">
              {SHARPENER_PRESETS.map((p) => {
                const isSelected = activePresetId === p.id;
                return (
                  <CustomizableButton
                    buttonId="image_sharpener_modal_btn_11"
                    key={p.id}
onClick={() => handleApplyPreset(p)}
className={cn(
                      "text-left p-1.5 rounded-lg border transition-all cursor-pointer",
                      isSelected
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-sm"
                        : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800"
                    )}
                  >
                      {() => (
                          <>
                            <div className="text-[11px] font-bold truncate">{p.name}</div>
                          <div className="text-[9px] text-slate-400 truncate opacity-80">
                      {p.options.scale}{uiText("components_image_sharpener_modal.div.x_4", "x · ")}{p.options.amount}{uiText("components_image_sharpener_modal.div.usm", "% USM")}
                    </div>
                          </>
                        )}
                  </CustomizableButton>
                );
              })}
            </div>
          </div>

          {/* Navigation Sub-tabs */}
          <div className="flex items-center border-b border-slate-800 bg-[#090d18] px-2 pt-1 gap-1 text-xs">
            <CustomizableButton
              buttonId="sharpener_studio_tab_sharpness"
              defaultLabel="Sharpness & Scale"
              onClick={() => setActiveTab("sharpness")}
              className={cn(
                "px-2.5 py-1.5 border-b-2 font-semibold transition-colors cursor-pointer text-[11px]",
                activeTab === "sharpness"
                  ? "border-amber-400 text-amber-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            />
            <CustomizableButton
              buttonId="sharpener_studio_tab_clarity"
              defaultLabel="Clarity & Edges"
              onClick={() => setActiveTab("clarity")}
              className={cn(
                "px-2.5 py-1.5 border-b-2 font-semibold transition-colors cursor-pointer text-[11px]",
                activeTab === "clarity"
                  ? "border-amber-400 text-amber-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            />
            <CustomizableButton
              buttonId="sharpener_studio_tab_color"
              defaultLabel="Tone & Saturation"
              onClick={() => setActiveTab("color")}
              className={cn(
                "px-2.5 py-1.5 border-b-2 font-semibold transition-colors cursor-pointer text-[11px]",
                activeTab === "color"
                  ? "border-amber-400 text-amber-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            />
          </div>

          {/* Sliders Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3.5 scrollbar-thin text-xs">
            {activeTab === "sharpness" && (
              <>
                {/* Resolution Super-Sample Factor */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <CustomizableLabel
                      labelId="image_sharpener_modal_item_10"
                      defaultIcon={<Maximize2 className="w-3.5 h-3.5 text-amber-400" />}
                      as="label"
                      className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5"
                    >
                        {() => (
                            <>
                              {uiText("components_image_sharpener_modal.label.resolution_upscale_factor", "Resolution Upscale Factor")}
                            </>
                          )}
                    </CustomizableLabel>
                    <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
                      {options.scale}{uiText("components_image_sharpener_modal.span.x_2", "x (")}{targetWidth}×{targetHeight})
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 pt-1">
                    <CustomizableButton
                      buttonId="sharpener_studio_scale_1x"
                      defaultLabel="1x"
                      onClick={() => updateOption("scale", 1)}
                      className={cn(
                        "py-1 rounded text-center text-xs font-bold border transition-all cursor-pointer",
                        options.scale === 1
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                      )}
                    />
                    <CustomizableButton
                      buttonId="sharpener_studio_scale_1_5x"
                      defaultLabel="1.5x"
                      onClick={() => updateOption("scale", 1.5)}
                      className={cn(
                        "py-1 rounded text-center text-xs font-bold border transition-all cursor-pointer",
                        options.scale === 1.5
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                      )}
                    />
                    <CustomizableButton
                      buttonId="sharpener_studio_scale_2x"
                      defaultLabel="2x"
                      onClick={() => updateOption("scale", 2)}
                      className={cn(
                        "py-1 rounded text-center text-xs font-bold border transition-all cursor-pointer",
                        options.scale === 2
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                      )}
                    />
                    <CustomizableButton
                      buttonId="sharpener_studio_scale_3x"
                      defaultLabel="3x"
                      onClick={() => updateOption("scale", 3)}
                      className={cn(
                        "py-1 rounded text-center text-xs font-bold border transition-all cursor-pointer",
                        options.scale === 3
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                      )}
                    />
                    <CustomizableButton
                      buttonId="sharpener_studio_scale_4x"
                      defaultLabel="4x"
                      onClick={() => updateOption("scale", 4)}
                      className={cn(
                        "py-1 rounded text-center text-xs font-bold border transition-all cursor-pointer",
                        options.scale === 4
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                      )}
                    />
                  </div>
                  <p className="text-[9.5px] text-slate-500 mt-1">
                    {uiText("components_image_sharpener_modal.p.upscales_image_resolution_with_high_fidelity", "Upscales image resolution with high-fidelity interpolation before sharpening.")}
                  </p>
                </div>

                {/* Sharpening Strength (Amount) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <CustomizableLabel
                      labelId="image_sharpener_modal_item_9"
                      as="label"
                      className="text-[11px] font-semibold text-slate-200"
                    >
                        {() => (
                            <>
                              {uiText("components_image_sharpener_modal.label.sharpen_strength_usm_amount", "Sharpen Strength (USM Amount)")}
                            </>
                          )}
                    </CustomizableLabel>
                    <span className="text-[11px] font-mono text-amber-300 font-bold">
                      {options.amount}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="5"
                    value={options.amount}
                    onChange={(e) => updateOption("amount", Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                    <span>{uiText("components_image_sharpener_modal.span.subtle_50", "Subtle (50%)")}</span>
                    <span>{uiText("components_image_sharpener_modal.span.standard_140", "Standard (140%)")}</span>
                    <span>{uiText("components_image_sharpener_modal.span.maximum_300", "Maximum (300%)")}</span>
                  </div>
                </div>

                {/* Filter Radius */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <CustomizableLabel
                      labelId="image_sharpener_modal_item_8"
                      as="label"
                      className="text-[11px] font-semibold text-slate-200"
                    >
                        {() => (
                            <>
                              {uiText("components_image_sharpener_modal.label.edge_detection_radius", "Edge Detection Radius")}
                            </>
                          )}
                    </CustomizableLabel>
                    <span className="text-[11px] font-mono text-amber-300 font-bold">
                      {options.radius.toFixed(1)}{uiText("components_image_sharpener_modal.span.px", " px")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="4.0"
                    step="0.1"
                    value={options.radius}
                    onChange={(e) => updateOption("radius", Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <p className="text-[9.5px] text-slate-500 mt-0.5">
                    {uiText("components_image_sharpener_modal.p.smaller_radii_sharpen_fine_micro_textures_la", "Smaller radii sharpen fine micro-textures; larger radii emphasize bold outlines.")}
                  </p>
                </div>

                {/* Noise Threshold */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <CustomizableLabel
                      labelId="image_sharpener_modal_item_7"
                      as="label"
                      className="text-[11px] font-semibold text-slate-200"
                    >
                        {() => (
                            <>
                              {uiText("components_image_sharpener_modal.label.noise_threshold_suppress_grain", "Noise Threshold (Suppress grain)")}
                            </>
                          )}
                    </CustomizableLabel>
                    <span className="text-[11px] font-mono text-amber-300 font-bold">
                      {options.threshold}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="1"
                    value={options.threshold}
                    onChange={(e) => updateOption("threshold", Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <p className="text-[9.5px] text-slate-500 mt-0.5">
                    {uiText("components_image_sharpener_modal.p.prevents_flat_areas_and_subtle_gradients_fro", "Prevents flat areas and subtle gradients from becoming noisy.")}
                  </p>
                </div>
              </>
            )}

            {activeTab === "clarity" && (
              <>
                {/* High-Pass Edge Crispness */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <CustomizableLabel
                      labelId="image_sharpener_modal_item_6"
                      defaultIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                      as="label"
                      className="text-[11px] font-semibold text-slate-200 flex items-center gap-1"
                    >
                        {() => (
                            <>
                              {uiText("components_image_sharpener_modal.label.high_pass_edge_crispness", "High-Pass Edge Crispness")}
                            </>
                          )}
                    </CustomizableLabel>
                    <span className="text-[11px] font-mono text-amber-300 font-bold">
                      {options.edgeCrispness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="2"
                    value={options.edgeCrispness}
                    onChange={(e) => updateOption("edgeCrispness", Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <p className="text-[9.5px] text-slate-500 mt-0.5">
                    {uiText("components_image_sharpener_modal.p.extracts_high_frequency_lines_anime_ink_and", "Extracts high-frequency lines, anime ink, and typography edges for extreme definition.")}
                  </p>
                </div>

                {/* Local Clarity */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <CustomizableLabel
                      labelId="image_sharpener_modal_item_5"
                      as="label"
                      className="text-[11px] font-semibold text-slate-200"
                    >
                        {() => (
                            <>
                              {uiText("components_image_sharpener_modal.label.midtone_clarity_micro_contrast", "Midtone Clarity (Micro-Contrast)")}
                            </>
                          )}
                    </CustomizableLabel>
                    <span className="text-[11px] font-mono text-amber-300 font-bold">
                      {options.clarity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="2"
                    value={options.clarity}
                    onChange={(e) => updateOption("clarity", Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <p className="text-[9.5px] text-slate-500 mt-0.5">
                    {uiText("components_image_sharpener_modal.p.adds_optical_depth_without_blowing_out_highl", "Adds optical depth without blowing out highlights or clipping shadows.")}
                  </p>
                </div>

                {/* Denoise Filter */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <CustomizableLabel
                      labelId="image_sharpener_modal_item_4"
                      as="label"
                      className="text-[11px] font-semibold text-slate-200"
                    >
                        {() => (
                            <>
                              {uiText("components_image_sharpener_modal.label.artifact_and_noise_suppression", "Artifact & Noise Suppression")}
                            </>
                          )}
                    </CustomizableLabel>
                    <span className="text-[11px] font-mono text-amber-300 font-bold">
                      {options.denoise}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={options.denoise}
                    onChange={(e) => updateOption("denoise", Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <p className="text-[9.5px] text-slate-500 mt-0.5">
                    {uiText("components_image_sharpener_modal.p.cleans_compression_speckles_in_flat_color_ar", "Cleans compression speckles in flat color areas.")}
                  </p>
                </div>
              </>
            )}

            {activeTab === "color" && (
              <>
                {/* Contrast */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <CustomizableLabel
                      labelId="image_sharpener_modal_item_3"
                      as="label"
                      className="text-[11px] font-semibold text-slate-200"
                    >
                        {() => (
                            <>
                              {uiText("components_image_sharpener_modal.label.contrast", "Contrast")}
                            </>
                          )}
                    </CustomizableLabel>
                    <span className="text-[11px] font-mono text-amber-300 font-bold">
                      {options.contrast > 0 ? `+${options.contrast}` : options.contrast}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    step="1"
                    value={options.contrast}
                    onChange={(e) => updateOption("contrast", Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Brightness */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <CustomizableLabel
                      labelId="image_sharpener_modal_item_2"
                      as="label"
                      className="text-[11px] font-semibold text-slate-200"
                    >
                        {() => (
                            <>
                              {uiText("components_image_sharpener_modal.label.brightness", "Brightness")}
                            </>
                          )}
                    </CustomizableLabel>
                    <span className="text-[11px] font-mono text-amber-300 font-bold">
                      {options.brightness > 0 ? `+${options.brightness}` : options.brightness}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    step="1"
                    value={options.brightness}
                    onChange={(e) => updateOption("brightness", Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Saturation */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <CustomizableLabel
                      labelId="image_sharpener_modal_item_1"
                      as="label"
                      className="text-[11px] font-semibold text-slate-200"
                    >
                        {() => (
                            <>
                              {uiText("components_image_sharpener_modal.label.saturation", "Saturation")}
                            </>
                          )}
                    </CustomizableLabel>
                    <span className="text-[11px] font-mono text-amber-300 font-bold">
                      {options.saturation > 0 ? `+${options.saturation}` : options.saturation}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    step="1"
                    value={options.saturation}
                    onChange={(e) => updateOption("saturation", Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>

          {/* Action Export Buttons */}
          <div className="p-3 border-t border-slate-800 bg-[#080c16] space-y-2 shrink-0">
            {/* Primary Action: Update active frame */}
            <CustomizableButton
              buttonId="sharpener_studio_apply_current"
              defaultLabel={`Apply to Current Frame (${options.scale}x)`}
              defaultIcon={<Check className="w-4 h-4" />}
              onClick={() => handleApplyAction("replace")}
              disabled={isProcessing || !enhancedDataUrl}
              className="w-full py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-950/40 disabled:opacity-50"
              title="Apply sharpened image directly onto this frame/slice"
            />

            {/* Secondary Actions Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              <CustomizableButton
                buttonId="sharpener_studio_apply_new_frame"
                defaultLabel="+ New Frame"
                defaultIcon={<Layers className="w-3.5 h-3.5 text-amber-400" />}
                onClick={() => handleApplyAction("new_frame")}
                disabled={isProcessing || !enhancedDataUrl}
                className="py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="Add sharpened image as a new Storyboard frame"
              />

              <CustomizableButton
                buttonId="sharpener_studio_apply_asset_pool"
                defaultLabel="To Asset Pool"
                defaultIcon={<Layers2 className="w-3.5 h-3.5 text-emerald-400" />}
                onClick={() => handleApplyAction("asset_pool")}
                disabled={isProcessing || !enhancedDataUrl}
                className="py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="Send sharpened image into the Asset Pool"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <CustomizableButton
                buttonId="sharpener_studio_apply_canvas"
                defaultLabel="To Carver Canvas"
                defaultIcon={<ImageIcon className="w-3.5 h-3.5 text-cyan-400" />}
                onClick={() => handleApplyAction("canvas")}
                disabled={isProcessing || !enhancedDataUrl}
                className="py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="Replace Carver workspace image with this sharpened resolution"
              />

              <CustomizableButton
                buttonId="sharpener_studio_download_png"
                defaultLabel="Download PNG"
                defaultIcon={<Download className="w-3.5 h-3.5" />}
                onClick={handleDownload}
                disabled={isProcessing || !enhancedDataUrl}
                className="py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="Download sharpened image file directly"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
