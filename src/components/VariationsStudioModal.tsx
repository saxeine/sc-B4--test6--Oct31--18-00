import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  X,
  Sparkles,
  Play,
  Pause,
  RefreshCw,
  Sliders,
  Download,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Layers,
  Film,
  Eye,
  EyeOff,
  FileDown,
  Archive,
  Wand2,
  Shuffle,
  Repeat,
  Zap,
  Sun,
  Move,
  Palette,
  Waves,
  Focus,
  Camera,
  Video,
  SplitSquareVertical,
  CheckCircle2,
  Copy,
  Plus,
} from "lucide-react";
import {
  VariationsStudioConfig,
  DEFAULT_VARIATIONS_CONFIG,
  VARIATIONS_PRESETS,
  VariationsPreset,
  GeneratedVariationFrame,
  generateVariationsSeries,
  loadImageAsync,
  DistributionMode,
} from "../utils/variationsEngine";
import { CustomizableButton } from "./CustomizableButton";
import { cn } from "../utils/cn";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";

export interface VariationsStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  sliceName?: string;
  sliceIndex?: number | null;
  slices?: Array<{ name: string; url: string }>;
  onNavigateFrame?: (index: number) => void;
  onApplyVariations?: (
    frames: Array<{ name: string; url: string }>,
    mode: "append_storyboard" | "replace_frame",
    targetSliceIndex?: number | null
  ) => void;
}

type ModalSize = "lg" | "xl" | "fullscreen";

export const VariationsStudioModal: React.FC<VariationsStudioModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  sliceName,
  sliceIndex,
  slices,
  onNavigateFrame,
  onApplyVariations,
}) => {
  // Navigation across sequence if slices provided
  const [activeSliceIdx, setActiveSliceIdx] = useState<number>(sliceIndex ?? 0);

  useEffect(() => {
    if (sliceIndex !== undefined && sliceIndex !== null) {
      setActiveSliceIdx(sliceIndex);
    }
  }, [sliceIndex]);

  const currentSlice = slices?.[activeSliceIdx];
  const activeImageUrl = currentSlice?.url || imageUrl || "";
  const activeBaseName = currentSlice?.name || sliceName || `Frame ${(activeSliceIdx ?? 0) + 1}`;

  // Studio Configurations
  const [config, setConfig] = useState<VariationsStudioConfig>(DEFAULT_VARIATIONS_CONFIG);
  const [activePresetId, setActivePresetId] = useState<string>("kinetic_motion");
  const [activeTab, setActiveTab] = useState<"motion_fx" | "color_distort" | "atmosphere" | "presets">("motion_fx");

  // Generated Frames
  const [frames, setFrames] = useState<GeneratedVariationFrame[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<string>("");
  const [selectedFrameIdx, setSelectedFrameIdx] = useState<number>(0);

  // Animation Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackFps, setPlaybackFps] = useState<number>(10);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Preview display & layout
  const [isHoldingOriginal, setIsHoldingOriginal] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [modalSize, setModalSize] = useState<ModalSize>("xl");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isBottomPanelFolded, setIsBottomPanelFolded] = useState<boolean>(true);
  const [layoutView, setLayoutView] = useState<"split" | "stage" | "controls">("split");

  // Source image object cache
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper feedback toast
  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Generate Variations runner
  const triggerGeneration = useCallback(
    async (sourceImgUrl: string, currentConfig: VariationsStudioConfig, baseNameStr: string) => {
      if (!sourceImgUrl) return;
      setIsGenerating(true);
      try {
        let img = loadedImageRef.current;
        if (!img || img.src !== sourceImgUrl) {
          img = await loadImageAsync(sourceImgUrl);
          loadedImageRef.current = img;
        }

        const generated = await generateVariationsSeries(
          img,
          baseNameStr,
          currentConfig,
          (cur, tot, status) => {
            setGenerationProgress(`${cur}/${tot}: ${status}`);
          }
        );

        setFrames(generated);
        setSelectedFrameIdx(0);
      } catch (err: any) {
        console.error("Variations generation error:", err);
        showFeedback("Failed to synthesize frame variations.");
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  // Debounce regeneration when config or source image changes
  useEffect(() => {
    if (!isOpen || !activeImageUrl) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      triggerGeneration(activeImageUrl, config, activeBaseName);
    }, 180);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [isOpen, activeImageUrl, config, activeBaseName, triggerGeneration]);

  // Flipbook Animation Loop
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      return;
    }

    const intervalMs = Math.max(20, Math.floor(1000 / playbackFps));
    playbackTimerRef.current = setInterval(() => {
      setSelectedFrameIdx((prev) => (prev + 1) % frames.length);
    }, intervalMs);

    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying, frames.length, playbackFps]);

  // Frame navigation
  const handleNavigateSequence = (newIdx: number) => {
    if (!slices || slices.length === 0) return;
    if (newIdx < 0 || newIdx >= slices.length) return;
    setActiveSliceIdx(newIdx);
    if (onNavigateFrame) onNavigateFrame(newIdx);
  };

  // Preset Selector
  const applyPreset = (preset: VariationsPreset) => {
    setActivePresetId(preset.id);
    setConfig((prev) => ({
      ...prev,
      ...preset.config,
      // preserve frameCount if desired, or accept preset
      frameCount: preset.config.frameCount || prev.frameCount,
    }));
    showFeedback(`Applied "${preset.name}" preset`);
  };

  // Export All as Animated GIF
  const handleExportGif = async () => {
    if (frames.length === 0) return;
    setIsExporting(true);
    showFeedback("Encoding animated GIF loop...");

    try {
      // Load all frame images
      const loadedImgs = await Promise.all(frames.map((f) => loadImageAsync(f.url)));
      const width = loadedImgs[0].naturalWidth || loadedImgs[0].width;
      const height = loadedImgs[0].naturalHeight || loadedImgs[0].height;

      const gif = GIFEncoder();
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");

      const delayMs = Math.floor(1000 / playbackFps);

      for (let i = 0; i < loadedImgs.length; i++) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(loadedImgs[i], 0, 0);
        const imgData = ctx.getImageData(0, 0, width, height);

        const palette = quantize(imgData.data, 256);
        const index = applyPalette(imgData.data, palette);

        gif.writeFrame(index, width, height, {
          palette,
          delay: delayMs,
          repeat: 0,
        });
      }

      gif.finish();
      const bytes = gif.bytesView();
      const blob = new Blob([bytes], { type: "image/gif" });
      saveAs(blob, `${activeBaseName}_variations_loop.gif`);
      showFeedback("Exported animated GIF successfully!");
    } catch (err: any) {
      console.error("GIF export failed:", err);
      showFeedback("Failed to encode GIF.");
    } finally {
      setIsExporting(false);
    }
  };

  // Export All as ZIP
  const handleExportZip = async () => {
    if (frames.length === 0) return;
    setIsExporting(true);
    showFeedback("Packing variations into ZIP archive...");

    try {
      const zip = new JSZip();
      const folder = zip.folder(`${activeBaseName}_variations`);

      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const commaIdx = frame.url.indexOf(",");
        const base64Data = commaIdx !== -1 ? frame.url.substring(commaIdx + 1) : frame.url;
        folder?.file(`${frame.name}.jpg`, base64Data, { base64: true });
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${activeBaseName}_variations.zip`);
      showFeedback("ZIP archive downloaded!");
    } catch (err: any) {
      console.error("ZIP export failed:", err);
      showFeedback("Failed to generate ZIP.");
    } finally {
      setIsExporting(false);
    }
  };

  // Apply to Asset Organiser / Storyboard
  const handleApplyToStoryboard = (mode: "append_storyboard" | "replace_frame") => {
    if (frames.length === 0) return;
    const formatted = frames.map((f) => ({ name: f.name, url: f.url }));
    if (onApplyVariations) {
      onApplyVariations(formatted, mode, activeSliceIdx);
      showFeedback(
        mode === "append_storyboard"
          ? `Added ${frames.length} variation frames to Storyboard!`
          : `Replaced sequence with ${frames.length} frames!`
      );
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  if (!isOpen) return null;

  const currentActiveFrame = frames[selectedFrameIdx] || frames[0];
  const displayedImageUrl = isHoldingOriginal ? activeImageUrl : currentActiveFrame?.url || activeImageUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={cn(
          "bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200",
          modalSize === "fullscreen"
            ? "w-full h-full max-w-none rounded-none"
            : modalSize === "xl"
            ? "w-full max-w-7xl h-[92vh]"
            : "w-full max-w-5xl h-[85vh]"
        )}
      >
        {/* TOP HEADER */}
        <div className="px-5 py-3.5 border-b border-slate-800/90 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/15 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CustomizableLabel
                  labelId="variations_studio_modal_item_40"
                  as="h2"
                  className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2"
                >
                    {() => (
                        <>
                          <span>{uiText("components_variations_studio_modal.span.frame_variations_studio", "Frame Variations Studio")}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                    {uiText("components_variations_studio_modal.span.procedural_motion_and_multi_fx", "Procedural Motion & Multi-FX")}
                  </span>
                        </>
                      )}
                </CustomizableLabel>
                {slices && slices.length > 1 && (
                  <div className="flex items-center gap-1 ml-2 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-0.5 text-xs text-slate-300">
                    <CustomizableButton
                      buttonId="variations_studio_modal_btn_39"
                      defaultIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                      onClick={() => handleNavigateSequence(activeSliceIdx - 1)}
disabled={activeSliceIdx <= 0}
className="p-1 hover:text-cyan-400 disabled:opacity-30 cursor-pointer"
title={uiText("components_variations_studio_modal.button.previous_slice_in_sequence.title", "Previous slice in sequence")}
                    />
                    <span className="font-mono text-cyan-300">
                      {activeSliceIdx + 1} / {slices.length}
                    </span>
                    <CustomizableButton
                      buttonId="variations_studio_modal_btn_38"
                      defaultIcon={<ChevronRight className="w-3.5 h-3.5" />}
                      onClick={() => handleNavigateSequence(activeSliceIdx + 1)}
disabled={activeSliceIdx >= slices.length - 1}
className="p-1 hover:text-cyan-400 disabled:opacity-30 cursor-pointer"
title={uiText("components_variations_studio_modal.button.next_slice_in_sequence.title", "Next slice in sequence")}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>{uiText("components_variations_studio_modal.span.active_target", "Active Target:")}</span>
                <span className="text-amber-300 font-medium truncate max-w-xs">{activeBaseName}</span>
                {frames.length > 0 && (
                  <span className="text-slate-500">
                    • {frames.length}{uiText("components_variations_studio_modal.span.variations_synthesized", " variations synthesized")}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher (Split, Controls, Stage) */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-lg p-0.5 text-xs text-slate-300">
              <CustomizableButton
                buttonId="variations_studio_modal_btn_37"
                defaultIcon={<SplitSquareVertical className="w-3.5 h-3.5" />}
                onClick={() => setLayoutView("split")}
className={cn(
                  "px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-1",
                  layoutView === "split" ? "bg-cyan-600 text-white font-semibold" : "hover:bg-slate-700 text-slate-400"
                )}
title={uiText("components_variations_studio_modal.button.side_by_side_stage_and_controls.title", "Side-by-side Stage & Controls")}
              >
                  {() => (
                      <>
                        <span className="hidden sm:inline">{uiText("components_variations_studio_modal.span.split", "Split")}</span>
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="variations_studio_modal_btn_36"
                defaultIcon={<Sliders className="w-3.5 h-3.5" />}
                onClick={() => setLayoutView("controls")}
className={cn(
                  "px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-1",
                  layoutView === "controls" ? "bg-cyan-600 text-white font-semibold" : "hover:bg-slate-700 text-slate-400"
                )}
title={uiText("components_variations_studio_modal.button.direct_full_access_to_effect_controls.title", "Direct Full Access to Effect Controls")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_variations_studio_modal.span.controls", "Controls")}</span>
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="variations_studio_modal_btn_35"
                defaultIcon={<Film className="w-3.5 h-3.5" />}
                onClick={() => setLayoutView("stage")}
className={cn(
                  "px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-1",
                  layoutView === "stage" ? "bg-cyan-600 text-white font-semibold" : "hover:bg-slate-700 text-slate-400"
                )}
title={uiText("components_variations_studio_modal.button.stage_and_flipbook_animation_preview_only.title", "Stage & Flipbook Animation Preview Only")}
              >
                  {() => (
                      <>
                        <span className="hidden sm:inline">{uiText("components_variations_studio_modal.span.stage", "Stage")}</span>
                      </>
                    )}
              </CustomizableButton>
            </div>

            {/* Modal size switch */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-lg p-0.5 text-xs text-slate-300">
              <CustomizableButton
                buttonId="variations_studio_modal_btn_34"
                onClick={() => setModalSize("lg")}
className={cn(
                  "px-2 py-1 rounded cursor-pointer transition-colors",
                  modalSize === "lg" ? "bg-cyan-600 text-white" : "hover:bg-slate-700"
                )}
title={uiText("components_variations_studio_modal.button.standard_size.title", "Standard Size")}
              >
                  {() => (
                      <>
                        {uiText("components_variations_studio_modal.button.normal", "Normal")}
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="variations_studio_modal_btn_33"
                onClick={() => setModalSize("xl")}
className={cn(
                  "px-2 py-1 rounded cursor-pointer transition-colors",
                  modalSize === "xl" ? "bg-cyan-600 text-white" : "hover:bg-slate-700"
                )}
title={uiText("components_variations_studio_modal.button.extra_wide_workspace.title", "Extra Wide Workspace")}
              >
                  {() => (
                      <>
                        {uiText("components_variations_studio_modal.button.wide", "Wide")}
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="variations_studio_modal_btn_32"
                onClick={() => setModalSize(modalSize === "fullscreen" ? "xl" : "fullscreen")}
className={cn(
                  "p-1.5 rounded cursor-pointer transition-colors",
                  modalSize === "fullscreen" ? "bg-cyan-600 text-white" : "hover:bg-slate-700"
                )}
title={uiText("components_variations_studio_modal.button.fullscreen_toggle.title", "Fullscreen Toggle")}
              >
                  {() => (
                      <>
                        {modalSize === "fullscreen" ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
                      </>
                    )}
              </CustomizableButton>
            </div>

            <CustomizableButton
              buttonId="variations_studio_modal_btn_31"
              defaultIcon={<X className="w-5 h-5" />}
              onClick={onClose}
className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
title={uiText("components_variations_studio_modal.button.close_variations_studio.title", "Close Variations Studio")}
            />
          </div>
        </div>

        {/* FEEDBACK TOAST */}
        {feedbackMsg && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-cyan-950/95 border border-cyan-500/50 text-cyan-200 px-4 py-1.5 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* WORKSPACE BODY */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* LEFT: INTERACTIVE LIVE PREVIEW & ANIMATION FLIPBOOK */}
          <div
            className={cn(
              "flex-1 flex flex-col bg-slate-950/80 border-r border-slate-800/80 min-h-0 relative",
              layoutView === "controls" && "hidden md:hidden",
              layoutView === "split" && "max-md:max-h-[44vh] max-md:shrink-0"
            )}
          >
            {/* PREVIEW TOOLBAR */}
            <div className="px-4 py-2 border-b border-slate-800/70 bg-slate-900/60 flex items-center justify-between gap-3 text-xs flex-wrap">
              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                <CustomizableButton
                  buttonId="variations_studio_modal_btn_30"
                  onClick={() => setIsPlaying(!isPlaying)}
className={cn(
                    "px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer",
                    isPlaying
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                      : "bg-emerald-600 text-white hover:bg-emerald-500"
                  )}
title={isPlaying ? "Pause flipbook loop" : "Play animated motion loop"}
                >
                    {() => (
                        <>
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{isPlaying ? "Pause Loop" : "Play Loop"}</span>
                        </>
                      )}
                </CustomizableButton>

                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-slate-300">
                  <Film className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px] font-mono text-cyan-300 font-bold">{playbackFps}{uiText("components_variations_studio_modal.span.fps", " FPS")}</span>
                  <input
                    type="range"
                    min={2}
                    max={24}
                    step={1}
                    value={playbackFps}
                    onChange={(e) => setPlaybackFps(Number(e.target.value))}
                    className="w-16 sm:w-20 accent-cyan-400 cursor-pointer h-1.5 ml-1"
                    title={`Playback Speed: ${playbackFps} frames per second`}
                  />
                </div>
              </div>

              {/* View & Compare Controls */}
              <div className="flex items-center gap-2">
                <CustomizableButton
                  buttonId="variations_studio_modal_btn_29"
                  defaultIcon={<Eye className="w-3.5 h-3.5" />}
                  onMouseDown={() => setIsHoldingOriginal(true)}
onMouseUp={() => setIsHoldingOriginal(false)}
onMouseLeave={() => setIsHoldingOriginal(false)}
onTouchStart={() => setIsHoldingOriginal(true)}
onTouchEnd={() => setIsHoldingOriginal(false)}
className={cn(
                    "px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 font-medium select-none transition-all cursor-pointer",
                    isHoldingOriginal
                      ? "bg-amber-500/30 text-amber-200 border-amber-400"
                      : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
                  )}
title={uiText("components_variations_studio_modal.button.hold_down_to_momentarily_inspect_original_fr.title", "Hold down to momentarily inspect original frame without variations")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_variations_studio_modal.span.hold_to_view_original", "Hold to View Original")}</span>
                        </>
                      )}
                </CustomizableButton>

                {/* Zoom Controls */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-slate-400">
                  <CustomizableButton
                    buttonId="variations_studio_modal_btn_28"
                    defaultIcon={<ZoomOut className="w-3.5 h-3.5" />}
                    onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
className="p-1 hover:text-white cursor-pointer"
title={uiText("components_variations_studio_modal.button.zoom_out.title", "Zoom Out")}
                  />
                  <CustomizableButton
                    buttonId="variations_studio_modal_btn_27"
                    defaultLabel={"%"}
                    onClick={() => setZoomLevel(1)}
className="px-1.5 text-[11px] font-mono hover:text-white cursor-pointer"
title={uiText("components_variations_studio_modal.button.reset_zoom.title", "Reset Zoom")}
                  >
                      {(ibcProps) => (
                          <>
                            {Math.round(zoomLevel * 100)}
                          {!ibcProps.isTextHidden ? ibcProps.label : null}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="variations_studio_modal_btn_26"
                    defaultIcon={<ZoomIn className="w-3.5 h-3.5" />}
                    onClick={() => setZoomLevel((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
className="p-1 hover:text-white cursor-pointer"
title={uiText("components_variations_studio_modal.button.zoom_in.title", "Zoom In")}
                  />
                </div>
              </div>
            </div>

            {/* STAGE CANVAS / IMAGE DISPLAY */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative select-none">
              {/* Checkerboard Pattern for transparent edges */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+CjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMwNzA1MTIiIC8+CjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMwNzA1MTIiIC8+Cjwvc3ZnPg==\")",
                }}
              />

              {displayedImageUrl ? (
                <div
                  className="relative transition-transform duration-100 ease-out max-h-full max-w-full flex items-center justify-center"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={displayedImageUrl}
                    alt={uiText("components_variations_studio_modal.img.variation_preview.alt", "Variation preview")}
                    className="max-h-[50vh] md:max-h-[64vh] max-w-full object-contain rounded-lg border border-slate-800/80 shadow-2xl"
                  />

                  {/* Badges / Indicators */}
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
                    {isHoldingOriginal ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 font-bold text-[10px] tracking-wide uppercase shadow-lg">
                        {uiText("components_variations_studio_modal.span.original_frame", "Original Frame")}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-cyan-600/90 text-white font-bold text-[10px] tracking-wide uppercase shadow-lg flex items-center gap-1">
                        <span>{uiText("components_variations_studio_modal.span.frame", "Frame ")}{selectedFrameIdx + 1}{uiText("components_variations_studio_modal.span.of", " of ")}{frames.length}</span>
                        {isPlaying && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      </span>
                    )}
                  </div>

                  {currentActiveFrame?.summary && !isHoldingOriginal && (
                    <div className="absolute bottom-2 left-2 z-10 bg-slate-950/80 backdrop-blur-sm border border-slate-800 px-2.5 py-1 rounded-md text-[11px] text-slate-300 max-w-[85%] truncate">
                      {currentActiveFrame.summary}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-500 text-sm flex flex-col items-center gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                  <span>{uiText("components_variations_studio_modal.span.synthesizing_variation_frames", "Synthesizing variation frames...")}</span>
                </div>
              )}

              {/* Generating Spinner Overlay */}
              {isGenerating && (
                <div className="absolute bottom-4 right-4 z-20 bg-slate-900/90 border border-cyan-500/40 text-cyan-300 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xl backdrop-blur-md">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{generationProgress || "Updating variations..."}</span>
                </div>
              )}
            </div>

            {/* BOTTOM FILMSTRIP TIMELINE - SMALLER & FOLDED AWAY TOGGLE */}
            {isBottomPanelFolded ? (
              <div className="border-t border-slate-800/80 bg-slate-950/90 px-3 py-1.5 shrink-0 flex items-center justify-between text-xs">
                <CustomizableButton
                  buttonId="variations_studio_modal_btn_25"
                  defaultIcon={<Layers className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />}
                  onClick={() => setIsBottomPanelFolded(false)}
className="flex items-center gap-2 text-slate-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer group"
title={uiText("components_variations_studio_modal.button.unfold_bottom_timeline_to_inspect_frame_film.title", "Unfold bottom timeline to inspect frame filmstrip")}
                >
                    {() => (
                        <>
                          <span className="text-[11px] font-semibold">{uiText("components_variations_studio_modal.span.filmstrip_timeline", "Filmstrip Timeline (")}{frames.length}{uiText("components_variations_studio_modal.span.frames", " frames)")}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded font-mono">
                    {uiText("components_variations_studio_modal.span.active", "Active: #")}{selectedFrameIdx + 1}
                  </span>
                        <span className="text-[10px] text-cyan-400 flex items-center gap-0.5 group-hover:underline ml-1">
                    <span>{uiText("components_variations_studio_modal.span.show_timeline", "Show Timeline")}</span>
                    <ChevronUp className="w-3 h-3" />
                  </span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="variations_studio_modal_btn_24"
                  defaultIcon={<ChevronUp className="w-3 h-3 text-cyan-400" />}
                  onClick={() => setIsBottomPanelFolded(false)}
className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 cursor-pointer transition-colors"
title={uiText("components_variations_studio_modal.button.unfold_timeline.title", "Unfold timeline")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_variations_studio_modal.span.expand", "Expand")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            ) : (
              <div className="border-t border-slate-800 bg-slate-950/90 px-3 py-1.5 shrink-0 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-[11px]">
                      <Layers className="w-3 h-3 text-cyan-400" />
                      <span>{uiText("components_variations_studio_modal.span.variations_timeline", "Variations Timeline (")}{frames.length}{uiText("components_variations_studio_modal.span.frames_2", " frames)")}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                      {uiText("components_variations_studio_modal.span.click_frame_to_inspect_jump", "Click frame to inspect/jump")}
                    </span>
                  </div>

                  <CustomizableButton
                    buttonId="variations_studio_modal_btn_23"
                    defaultIcon={<ChevronDown className="w-3 h-3 text-amber-400" />}
                    onClick={() => setIsBottomPanelFolded(true)}
className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-amber-300 px-2 py-0.5 rounded hover:bg-slate-800/80 transition-colors cursor-pointer"
title={uiText("components_variations_studio_modal.button.fold_away_bottom_timeline_panel.title", "Fold away bottom timeline panel")}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_variations_studio_modal.span.fold_away", "Fold Away")}</span>
                          </>
                        )}
                  </CustomizableButton>
                </div>

                {/* Compact Scrollable frames track */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-0.5 scrollbar-thin">
                  {frames.map((frame, idx) => {
                    const isSelected = selectedFrameIdx === idx;
                    return (
                      <CustomizableButton
                        buttonId="variations_studio_modal_btn_22"
                        key={frame.id}
onClick={() => {
                          setSelectedFrameIdx(idx);
                          setIsPlaying(false);
                        }}
className={cn(
                          "relative shrink-0 rounded overflow-hidden border transition-all p-0.5 group cursor-pointer text-left",
                          isSelected
                            ? "border-cyan-400 ring-1 ring-cyan-400/50 scale-105 bg-cyan-950/50 z-10"
                            : "border-slate-800 hover:border-slate-600 bg-slate-950/60 opacity-80 hover:opacity-100"
                        )}
title={`Frame ${idx + 1}: ${frame.summary}`}
                      >
                          {() => (
                              <>
                                <img
                          src={frame.url}
                          alt={frame.name}
                          className="w-11 h-8 sm:w-12 sm:h-9 object-cover rounded-sm"
                        />
                              <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 text-center py-0.2 text-[8px] font-mono font-bold text-slate-300 group-hover:text-cyan-300 leading-tight">
                          #{idx + 1}
                        </div>
                              </>
                            )}
                      </CustomizableButton>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: CONTROLS & EFFECTS SUITE */}
          <div
            className={cn(
              "w-full md:w-80 lg:w-[380px] xl:w-[420px] flex flex-col bg-slate-900/95 border-t md:border-t-0 md:border-l border-slate-800/80 min-h-0 shrink-0",
              layoutView === "stage" && "hidden md:hidden",
              layoutView === "controls" && "flex-1 w-full md:w-full lg:w-full xl:w-full"
            )}
          >
            {/* FRAME COUNT & PROGRESSION HEADER (COMPACT) */}
            <div className="p-2.5 sm:p-3 border-b border-slate-800 bg-slate-950/50 flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between">
                <CustomizableLabel
                  labelId="variations_studio_modal_item_21"
                  defaultIcon={<Film className="w-3.5 h-3.5 text-cyan-400" />}
                  as="label"
                  className="text-xs font-bold text-slate-200 flex items-center gap-1.5"
                >
                    {() => (
                        <>
                          <span>{uiText("components_variations_studio_modal.span.amount_of_extra_frames", "Amount of Extra Frames")}</span>
                        </>
                      )}
                </CustomizableLabel>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                  {config.frameCount}{uiText("components_variations_studio_modal.span.frames_3", " Frames")}
                </span>
              </div>

              {/* Quick Frame Count Chips + Fine Slider */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[2, 4, 6, 8, 12, 16, 24].map((cnt) => (
                  <CustomizableButton
                    buttonId="variations_studio_modal_btn_20"
                    defaultLabel={"+"}
                    key={cnt}
onClick={() => setConfig((prev) => ({ ...prev, frameCount: cnt }))}
className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer",
                      config.frameCount === cnt
                        ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm"
                        : "bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-slate-700"
                    )}
                  >
                      {(ibcProps) => (
                          <>
                            {!ibcProps.isTextHidden ? ibcProps.label : null}
                          {cnt}
                          </>
                        )}
                  </CustomizableButton>
                ))}
                <input
                  type="range"
                  min={2}
                  max={32}
                  step={1}
                  value={config.frameCount}
                  onChange={(e) => setConfig((prev) => ({ ...prev, frameCount: Number(e.target.value) }))}
                  className="flex-1 min-w-[70px] accent-cyan-400 cursor-pointer h-1.5 ml-1"
                />
              </div>

              {/* Distribution / Progression Mode (Compact) */}
              <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                <span className="text-[10px] font-semibold text-slate-400 shrink-0">{uiText("components_variations_studio_modal.span.curve", "Curve:")}</span>
                <div className="grid grid-cols-4 gap-1 flex-1 max-w-[280px]">
                  {(
                    [
                      { id: "loop", label: "Loop", desc: "Ping-Pong" },
                      { id: "linear", label: "Linear", desc: "Start -> End" },
                      { id: "oscillate", label: "Sine", desc: "Oscillation" },
                      { id: "random", label: "Random", desc: "Organic" },
                    ] as { id: DistributionMode; label: string; desc: string }[]
                  ).map((m) => (
                    <CustomizableButton
                      buttonId="variations_studio_modal_btn_19"
                      key={m.id}
onClick={() => setConfig((prev) => ({ ...prev, distributionMode: m.id }))}
className={cn(
                        "py-0.5 px-1 rounded text-[10px] font-bold transition-all border text-center cursor-pointer",
                        config.distributionMode === m.id
                          ? "bg-cyan-600/30 text-cyan-200 border-cyan-500/60"
                          : "bg-slate-800/60 text-slate-400 border-slate-800 hover:bg-slate-800"
                      )}
title={m.desc}
                    >
                        {() => (
                            <>
                              {m.label}
                            </>
                          )}
                    </CustomizableButton>
                  ))}
                </div>
              </div>
            </div>

            {/* EFFECT TABS */}
            <div className="flex items-center border-b border-slate-800 bg-slate-950/30 px-2 pt-1">
              {[
                { id: "motion_fx", label: "Motion & Zoom", icon: Move },
                { id: "color_distort", label: "Color & Warp", icon: Palette },
                { id: "atmosphere", label: "6 Extra FX", icon: Zap },
                { id: "presets", label: "Presets", icon: Wand2 },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <CustomizableButton
                    buttonId="variations_studio_modal_btn_18"
                    key={tab.id}
onClick={() => setActiveTab(tab.id as any)}
className={cn(
                      "flex-1 py-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer",
                      isActive
                        ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    )}
                  >
                      {() => (
                          <>
                            <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                          </>
                        )}
                  </CustomizableButton>
                );
              })}
            </div>

            {/* TAB CONTENTS (SCROLLABLE) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
              {/* TAB 1: MOTION & ZOOM */}
              {activeTab === "motion_fx" && (
                <div className="space-y-4">
                  {/* EFFECT 1: SPATIAL MOTION (ILLUSION OF MOTION) */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Move className="w-4 h-4 text-emerald-400" />
                        <div>
                          <CustomizableLabel
                            labelId="variations_studio_modal_item_17"
                            as="h4"
                            className="font-bold text-slate-200 text-xs"
                          >
                              {() => (
                                  <>
                                    {uiText("components_variations_studio_modal.h4.spatial_movement_illusion_of_motion", "Spatial Movement (Illusion of Motion)")}
                                  </>
                                )}
                          </CustomizableLabel>
                          <p className="text-[10px] text-slate-400">{uiText("components_variations_studio_modal.p.drift_pan_handheld_micro_shake_and_parallax", "Drift, pan, handheld micro-shake & parallax motion")}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.spatialMotion.enabled}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            spatialMotion: { ...prev.spatialMotion, enabled: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 accent-emerald-400 cursor-pointer rounded"
                      />
                    </div>

                    {config.spatialMotion.enabled && (
                      <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                        <div>
                          <CustomizableLabel
                            labelId="variations_studio_modal_item_16"
                            as="label"
                            className="text-[11px] text-slate-300 font-semibold mb-1 block"
                          >
                              {() => (
                                  <>
                                    {uiText("components_variations_studio_modal.label.motion_pattern", "Motion Pattern")}
                                  </>
                                )}
                          </CustomizableLabel>
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { id: "lateral_pan", label: "Lateral Pan" },
                              { id: "vertical_bob", label: "Vertical Bob" },
                              { id: "handheld_shake", label: "Handheld Jitter" },
                              { id: "diagonal_kinetic", label: "Diagonal Thrust" },
                              { id: "micro_tilt", label: "Micro Tilt" },
                            ].map((m) => (
                              <CustomizableButton
                                buttonId="variations_studio_modal_btn_15"
                                key={m.id}
onClick={() =>
                                  setConfig((prev) => ({
                                    ...prev,
                                    spatialMotion: { ...prev.spatialMotion, mode: m.id as any },
                                  }))
                                }
className={cn(
                                  "py-1 px-1.5 rounded text-[10px] font-bold border transition-colors cursor-pointer",
                                  config.spatialMotion.mode === m.id
                                    ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/50"
                                    : "bg-slate-800/50 text-slate-400 border-slate-800 hover:bg-slate-800"
                                )}
                              >
                                  {() => (
                                      <>
                                        {m.label}
                                      </>
                                    )}
                              </CustomizableButton>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>{uiText("components_variations_studio_modal.span.travel_distance", "Travel Distance")}</span>
                            <span className="font-mono text-emerald-300 font-bold">{config.spatialMotion.distance}{uiText("components_variations_studio_modal.span.px", "px")}</span>
                          </div>
                          <input
                            type="range"
                            min={2}
                            max={45}
                            value={config.spatialMotion.distance}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                spatialMotion: { ...prev.spatialMotion, distance: Number(e.target.value) },
                              }))
                            }
                            className="w-full accent-emerald-400 cursor-pointer h-1.5"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>{uiText("components_variations_studio_modal.span.micro_tilt_rotation", "Micro-Tilt Rotation")}</span>
                            <span className="font-mono text-emerald-300 font-bold">{config.spatialMotion.tiltAngle}°</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={6}
                            step={0.5}
                            value={config.spatialMotion.tiltAngle}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                spatialMotion: { ...prev.spatialMotion, tiltAngle: Number(e.target.value) },
                              }))
                            }
                            className="w-full accent-emerald-400 cursor-pointer h-1.5"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* EFFECT 2: ZOOM VARIATION */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ZoomIn className="w-4 h-4 text-cyan-400" />
                        <div>
                          <CustomizableLabel
                            labelId="variations_studio_modal_item_14"
                            as="h4"
                            className="font-bold text-slate-200 text-xs"
                          >
                              {() => (
                                  <>
                                    {uiText("components_variations_studio_modal.h4.zoom_variation", "Zoom Variation")}
                                  </>
                                )}
                          </CustomizableLabel>
                          <p className="text-[10px] text-slate-400">{uiText("components_variations_studio_modal.p.pulsing_zoom_stepped_zoom_in_or_zoom_out", "Pulsing zoom, stepped zoom-in or zoom-out")}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.zoom.enabled}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            zoom: { ...prev.zoom, enabled: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 accent-cyan-400 cursor-pointer rounded"
                      />
                    </div>

                    {config.zoom.enabled && (
                      <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { id: "pulse", label: "Pulse Wave" },
                            { id: "zoom_in", label: "Zoom In" },
                            { id: "zoom_out", label: "Zoom Out" },
                          ].map((zm) => (
                            <CustomizableButton
                              buttonId="variations_studio_modal_btn_13"
                              key={zm.id}
onClick={() =>
                                setConfig((prev) => ({
                                  ...prev,
                                  zoom: { ...prev.zoom, mode: zm.id as any },
                                }))
                              }
className={cn(
                                "py-1 px-1.5 rounded text-[10px] font-bold border transition-colors cursor-pointer",
                                config.zoom.mode === zm.id
                                  ? "bg-cyan-600/30 text-cyan-300 border-cyan-500/50"
                                  : "bg-slate-800/50 text-slate-400 border-slate-800 hover:bg-slate-800"
                              )}
                            >
                                {() => (
                                    <>
                                      {zm.label}
                                    </>
                                  )}
                            </CustomizableButton>
                          ))}
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>{uiText("components_variations_studio_modal.span.zoom_strength", "Zoom Strength")}</span>
                            <span className="font-mono text-cyan-300 font-bold">{config.zoom.strength}%</span>
                          </div>
                          <input
                            type="range"
                            min={4}
                            max={45}
                            value={config.zoom.strength}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                zoom: { ...prev.zoom, strength: Number(e.target.value) },
                              }))
                            }
                            className="w-full accent-cyan-400 cursor-pointer h-1.5"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* EFFECT 3: BLUR & SPEED STREAKS */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Focus className="w-4 h-4 text-amber-400" />
                        <div>
                          <CustomizableLabel
                            labelId="variations_studio_modal_item_12"
                            as="h4"
                            className="font-bold text-slate-200 text-xs"
                          >
                              {() => (
                                  <>
                                    {uiText("components_variations_studio_modal.h4.blur_and_speed_streaks", "Blur & Speed Streaks")}
                                  </>
                                )}
                          </CustomizableLabel>
                          <p className="text-[10px] text-slate-400">{uiText("components_variations_studio_modal.p.directional_motion_blur_and_explosive_radial", "Directional motion blur & explosive radial zoom")}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.blur.enabled}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            blur: { ...prev.blur, enabled: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 accent-amber-400 cursor-pointer rounded"
                      />
                    </div>

                    {config.blur.enabled && (
                      <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { id: "motion_blur", label: "Motion Blur" },
                            { id: "radial_blur", label: "Radial Zoom" },
                            { id: "lens_bokeh", label: "Lens Bokeh" },
                          ].map((bm) => (
                            <CustomizableButton
                              buttonId="variations_studio_modal_btn_11"
                              key={bm.id}
onClick={() =>
                                setConfig((prev) => ({
                                  ...prev,
                                  blur: { ...prev.blur, mode: bm.id as any },
                                }))
                              }
className={cn(
                                "py-1 px-1.5 rounded text-[10px] font-bold border transition-colors cursor-pointer",
                                config.blur.mode === bm.id
                                  ? "bg-amber-600/30 text-amber-300 border-amber-500/50"
                                  : "bg-slate-800/50 text-slate-400 border-slate-800 hover:bg-slate-800"
                              )}
                            >
                                {() => (
                                    <>
                                      {bm.label}
                                    </>
                                  )}
                            </CustomizableButton>
                          ))}
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>{uiText("components_variations_studio_modal.span.blur_intensity", "Blur Intensity")}</span>
                            <span className="font-mono text-amber-300 font-bold">{config.blur.strength}{uiText("components_variations_studio_modal.span.px_2", "px")}</span>
                          </div>
                          <input
                            type="range"
                            min={2}
                            max={26}
                            value={config.blur.strength}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                blur: { ...prev.blur, strength: Number(e.target.value) },
                              }))
                            }
                            className="w-full accent-amber-400 cursor-pointer h-1.5"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: COLOR & DISTORTION */}
              {activeTab === "color_distort" && (
                <div className="space-y-4">
                  {/* EFFECT 4: COLOR SHIFT & TEMPERATURE */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-pink-400" />
                        <div>
                          <CustomizableLabel
                            labelId="variations_studio_modal_item_10"
                            as="h4"
                            className="font-bold text-slate-200 text-xs"
                          >
                              {() => (
                                  <>
                                    {uiText("components_variations_studio_modal.h4.color_shift_and_temperature", "Color Shift & Temperature")}
                                  </>
                                )}
                          </CustomizableLabel>
                          <p className="text-[10px] text-slate-400">{uiText("components_variations_studio_modal.p.hue_rotation_saturation_cycle_and_warm_cool", "Hue rotation, saturation cycle & warm/cool drift")}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.color.enabled}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            color: { ...prev.color, enabled: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 accent-pink-400 cursor-pointer rounded"
                      />
                    </div>

                    {config.color.enabled && (
                      <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { id: "hue_shift", label: "Hue Sweep" },
                            { id: "warm_cool", label: "Warm / Cool" },
                            { id: "saturation_cycle", label: "Saturation" },
                            { id: "duotone", label: "Duotone" },
                            { id: "vintage", label: "Vintage Fade" },
                          ].map((cm) => (
                            <CustomizableButton
                              buttonId="variations_studio_modal_btn_9"
                              key={cm.id}
onClick={() =>
                                setConfig((prev) => ({
                                  ...prev,
                                  color: { ...prev.color, mode: cm.id as any },
                                }))
                              }
className={cn(
                                "py-1 px-1.5 rounded text-[10px] font-bold border transition-colors cursor-pointer",
                                config.color.mode === cm.id
                                  ? "bg-pink-600/30 text-pink-300 border-pink-500/50"
                                  : "bg-slate-800/50 text-slate-400 border-slate-800 hover:bg-slate-800"
                              )}
                            >
                                {() => (
                                    <>
                                      {cm.label}
                                    </>
                                  )}
                            </CustomizableButton>
                          ))}
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>{uiText("components_variations_studio_modal.span.hue_delta", "Hue Delta")}</span>
                            <span className="font-mono text-pink-300 font-bold">{config.color.hueDelta}°</span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={180}
                            value={config.color.hueDelta}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                color: { ...prev.color, hueDelta: Number(e.target.value) },
                              }))
                            }
                            className="w-full accent-pink-400 cursor-pointer h-1.5"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* EFFECT 5: DISTORTION & WARP */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Waves className="w-4 h-4 text-purple-400" />
                        <div>
                          <CustomizableLabel
                            labelId="variations_studio_modal_item_8"
                            as="h4"
                            className="font-bold text-slate-200 text-xs"
                          >
                              {() => (
                                  <>
                                    {uiText("components_variations_studio_modal.h4.distortion_and_wave_warp", "Distortion & Wave Warp")}
                                  </>
                                )}
                          </CustomizableLabel>
                          <p className="text-[10px] text-slate-400">{uiText("components_variations_studio_modal.p.undulating_wave_ripples_and_horizontal_glitc", "Undulating wave ripples and horizontal glitch slices")}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.distortion.enabled}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            distortion: { ...prev.distortion, enabled: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 accent-purple-400 cursor-pointer rounded"
                      />
                    </div>

                    {config.distortion.enabled && (
                      <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                        <div className="grid grid-cols-2 gap-1">
                          {[
                            { id: "wave_ripple", label: "Sine Wave Ripple" },
                            { id: "horizontal_glitch", label: "Horizontal Glitch" },
                          ].map((dm) => (
                            <CustomizableButton
                              buttonId="variations_studio_modal_btn_7"
                              key={dm.id}
onClick={() =>
                                setConfig((prev) => ({
                                  ...prev,
                                  distortion: { ...prev.distortion, mode: dm.id as any },
                                }))
                              }
className={cn(
                                "py-1 px-1.5 rounded text-[10px] font-bold border transition-colors cursor-pointer",
                                config.distortion.mode === dm.id
                                  ? "bg-purple-600/30 text-purple-300 border-purple-500/50"
                                  : "bg-slate-800/50 text-slate-400 border-slate-800 hover:bg-slate-800"
                              )}
                            >
                                {() => (
                                    <>
                                      {dm.label}
                                    </>
                                  )}
                            </CustomizableButton>
                          ))}
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>{uiText("components_variations_studio_modal.span.warp_intensity", "Warp Intensity")}</span>
                            <span className="font-mono text-purple-300 font-bold">{config.distortion.intensity}%</span>
                          </div>
                          <input
                            type="range"
                            min={5}
                            max={80}
                            value={config.distortion.intensity}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                distortion: { ...prev.distortion, intensity: Number(e.target.value) },
                              }))
                            }
                            className="w-full accent-purple-400 cursor-pointer h-1.5"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: 6 EXTRA EFFECTS */}
              {activeTab === "atmosphere" && (
                <div className="space-y-3">
                  {/* EXTRA EFFECT 6: FILM GRAIN */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{uiText("components_variations_studio_modal.span.1_film_grain_and_iso_noise", "1. Film Grain & ISO Noise")}</span>
                      <input
                        type="checkbox"
                        checked={config.grain.enabled}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            grain: { ...prev.grain, enabled: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 accent-cyan-400 cursor-pointer rounded"
                      />
                    </div>
                    {config.grain.enabled && (
                      <div className="pt-1">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{uiText("components_variations_studio_modal.span.grain_intensity", "Grain Intensity: ")}{config.grain.intensity}%</span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={60}
                          value={config.grain.intensity}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              grain: { ...prev.grain, intensity: Number(e.target.value) },
                            }))
                          }
                          className="w-full accent-cyan-400 cursor-pointer h-1.5"
                        />
                      </div>
                    )}
                  </div>

                  {/* EXTRA EFFECT 7: RGB CHANNEL SPLIT */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{uiText("components_variations_studio_modal.span.2_rgb_split_chromatic_aberration", "2. RGB Split / Chromatic Aberration")}</span>
                      <input
                        type="checkbox"
                        checked={config.rgbSplit.enabled}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            rgbSplit: { ...prev.rgbSplit, enabled: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 accent-rose-400 cursor-pointer rounded"
                      />
                    </div>
                    {config.rgbSplit.enabled && (
                      <div className="pt-1">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{uiText("components_variations_studio_modal.span.offset", "Offset: ")}{config.rgbSplit.offset}{uiText("components_variations_studio_modal.span.px_3", "px")}</span>
                        </div>
                        <input
                          type="range"
                          min={2}
                          max={25}
                          value={config.rgbSplit.offset}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              rgbSplit: { ...prev.rgbSplit, offset: Number(e.target.value) },
                            }))
                          }
                          className="w-full accent-rose-400 cursor-pointer h-1.5"
                        />
                      </div>
                    )}
                  </div>

                  {/* EXTRA EFFECT 8: VIGNETTE */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{uiText("components_variations_studio_modal.span.3_vignette_and_shadow_falloff", "3. Vignette & Shadow Falloff")}</span>
                      <input
                        type="checkbox"
                        checked={config.vignette.enabled}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            vignette: { ...prev.vignette, enabled: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 accent-amber-400 cursor-pointer rounded"
                      />
                    </div>
                    {config.vignette.enabled && (
                      <div className="pt-1">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{uiText("components_variations_studio_modal.span.intensity", "Intensity: ")}{config.vignette.intensity}%</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={90}
                          value={config.vignette.intensity}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              vignette: { ...prev.vignette, intensity: Number(e.target.value) },
                            }))
                          }
                          className="w-full accent-amber-400 cursor-pointer h-1.5"
                        />
                      </div>
                    )}
                  </div>

                  {/* EXTRA EFFECT 9: LIGHT LEAK & FLARE */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{uiText("components_variations_studio_modal.span.4_optical_flare_and_light_leak", "4. Optical Flare & Light Leak")}</span>
                      <input
                        type="checkbox"
                        checked={config.lightLeak.enabled}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            lightLeak: { ...prev.lightLeak, enabled: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 accent-amber-300 cursor-pointer rounded"
                      />
                    </div>
                    {config.lightLeak.enabled && (
                      <div className="pt-1 space-y-1.5">
                        <div className="grid grid-cols-2 gap-1">
                          {[
                            { id: "warm_amber", label: "Warm Amber" },
                            { id: "golden_hour", label: "Golden Hour" },
                            { id: "cool_cyan", label: "Cool Cyan" },
                            { id: "magenta_neon", label: "Neon Flare" },
                          ].map((th) => (
                            <CustomizableButton
                              buttonId="variations_studio_modal_btn_6"
                              key={th.id}
onClick={() =>
                                setConfig((prev) => ({
                                  ...prev,
                                  lightLeak: { ...prev.lightLeak, theme: th.id as any },
                                }))
                              }
className={cn(
                                "py-1 text-[10px] font-bold rounded border cursor-pointer",
                                config.lightLeak.theme === th.id
                                  ? "bg-amber-600/30 text-amber-200 border-amber-500/50"
                                  : "bg-slate-800/40 text-slate-400 border-slate-800"
                              )}
                            >
                                {() => (
                                    <>
                                      {th.label}
                                    </>
                                  )}
                            </CustomizableButton>
                          ))}
                        </div>
                        <input
                          type="range"
                          min={15}
                          max={85}
                          value={config.lightLeak.intensity}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              lightLeak: { ...prev.lightLeak, intensity: Number(e.target.value) },
                            }))
                          }
                          className="w-full accent-amber-300 cursor-pointer h-1.5"
                        />
                      </div>
                    )}
                  </div>

                  {/* EXTRA EFFECT 10: POSTERIZE & COMIC EDGE */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{uiText("components_variations_studio_modal.span.5_posterize_and_comic_shading", "5. Posterize & Comic Shading")}</span>
                      <input
                        type="checkbox"
                        checked={config.posterize.enabled}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            posterize: { ...prev.posterize, enabled: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 accent-teal-400 cursor-pointer rounded"
                      />
                    </div>
                    {config.posterize.enabled && (
                      <div className="pt-1">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{uiText("components_variations_studio_modal.span.color_steps", "Color Steps: ")}{config.posterize.steps}</span>
                        </div>
                        <input
                          type="range"
                          min={3}
                          max={12}
                          value={config.posterize.steps}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              posterize: { ...prev.posterize, steps: Number(e.target.value) },
                            }))
                          }
                          className="w-full accent-teal-400 cursor-pointer h-1.5"
                        />
                      </div>
                    )}
                  </div>

                  {/* EXTRA EFFECT 11: SHUTTER STROBE */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{uiText("components_variations_studio_modal.span.6_shutter_strobe_exposure_pulse", "6. Shutter Strobe / Exposure Pulse")}</span>
                      <input
                        type="checkbox"
                        checked={config.exposureStrobe.enabled}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            exposureStrobe: { ...prev.exposureStrobe, enabled: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 accent-yellow-400 cursor-pointer rounded"
                      />
                    </div>
                    {config.exposureStrobe.enabled && (
                      <div className="pt-1">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{uiText("components_variations_studio_modal.span.brightness_flash", "Brightness Flash: ±")}{config.exposureStrobe.brightnessDelta}%</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={45}
                          value={config.exposureStrobe.brightnessDelta}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              exposureStrobe: { ...prev.exposureStrobe, brightnessDelta: Number(e.target.value) },
                            }))
                          }
                          className="w-full accent-yellow-400 cursor-pointer h-1.5"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: PRESETS */}
              {activeTab === "presets" && (
                <div className="space-y-2">
                  {VARIATIONS_PRESETS.map((preset) => {
                    const isCurrent = activePresetId === preset.id;
                    return (
                      <CustomizableButton
                        buttonId="variations_studio_modal_btn_5"
                        key={preset.id}
onClick={() => applyPreset(preset)}
className={cn(
                          "w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer group",
                          isCurrent
                            ? "bg-cyan-950/40 border-cyan-500/60 shadow-lg"
                            : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                        )}
                      >
                          {() => (
                              <>
                                <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 group-hover:text-cyan-300">
                              {preset.name}
                            </span>
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border", preset.badgeColor)}>
                              {preset.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{preset.subtitle}</p>
                        </div>
                              {isCurrent && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                              </>
                            )}
                      </CustomizableButton>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ACTION FOOTER */}
            <div className="p-2.5 sm:p-3 border-t border-slate-800 bg-slate-950/90 flex flex-col gap-1.5 shrink-0">
              <div className="grid grid-cols-2 gap-1.5">
                <CustomizableButton
                  buttonId="variations_studio_modal_btn_4"
                  defaultIcon={<Plus className="w-3.5 h-3.5 shrink-0" />}
                  onClick={() => handleApplyToStoryboard("append_storyboard")}
disabled={frames.length === 0}
className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow cursor-pointer transition-all active:scale-98"
title={uiText("components_variations_studio_modal.button.add_all_generated_variations_as_new_consecut.title", "Add all generated variations as new consecutive frames in the Storyboard asset organizer")}
                >
                    {() => (
                        <>
                          <span className="truncate">{uiText("components_variations_studio_modal.span.add_all", "Add All (")}{frames.length})</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="variations_studio_modal_btn_3"
                  defaultIcon={<Repeat className="w-3.5 h-3.5 shrink-0" />}
                  onClick={() => handleApplyToStoryboard("replace_frame")}
disabled={frames.length === 0}
className="py-1.5 px-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow cursor-pointer transition-all active:scale-98"
title={uiText("components_variations_studio_modal.button.replace_the_target_slice_with_this_variation.title", "Replace the target slice with this variation sequence")}
                >
                    {() => (
                        <>
                          <span className="truncate">{uiText("components_variations_studio_modal.span.replace_sequence", "Replace Sequence")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>

              {/* Export Buttons */}
              <div className="grid grid-cols-2 gap-1.5">
                <CustomizableButton
                  buttonId="variations_studio_modal_btn_2"
                  defaultIcon={<Film className="w-3 h-3 text-amber-400 shrink-0" />}
                  onClick={handleExportGif}
disabled={isExporting || frames.length === 0}
className="py-1.5 px-2 bg-slate-800/90 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-[10px] sm:text-[11px] font-semibold flex items-center justify-center gap-1 border border-slate-700/80 cursor-pointer transition-colors"
title={uiText("components_variations_studio_modal.button.export_seamless_loop_animation_as_gif.title", "Export seamless loop animation as GIF")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_variations_studio_modal.span.export_gif", "Export GIF")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="variations_studio_modal_btn_1"
                  defaultIcon={<Archive className="w-3 h-3 text-cyan-400 shrink-0" />}
                  onClick={handleExportZip}
disabled={isExporting || frames.length === 0}
className="py-1.5 px-2 bg-slate-800/90 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-[10px] sm:text-[11px] font-semibold flex items-center justify-center gap-1 border border-slate-700/80 cursor-pointer transition-colors"
title={uiText("components_variations_studio_modal.button.download_all_generated_variation_frames_in_a.title", "Download all generated variation frames in a ZIP archive")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_variations_studio_modal.span.download_zip", "Download ZIP")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
