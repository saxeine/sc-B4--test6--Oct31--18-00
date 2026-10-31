// UTF-8: ✓ SeqCarver Studio - Front Page Panel 1 Full Screen Control Panel
import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { motion, AnimatePresence } from "motion/react";
import {
  Crop as CropIcon,
  Maximize2,
  Minimize2,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Scissors,
  Download,
  Copy,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ZoomIn,
  ZoomOut,
  Scaling,
  History,
  Grid,
  Layers,
  ArrowRight,
  Square,
  Circle,
  Undo2,
  Redo2,
  CheckCircle2,
  LayoutGrid,
  Plus,
  RefreshCw,
  Image as ImageIcon,
  Palette,
  Disc,
} from "lucide-react";
import { cn } from "../utils/cn";
import { getCroppedImg } from "../utils/imageUtils";
import { saveAs } from "file-saver";
import { RadialColorPicker } from "./RadialColorPicker";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export interface FullScreenCropControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // Image Sources
  imageSrc: string;
  originalImageSrc?: string;
  croppedImageSrc?: string;
  setImageSrc: (src: string) => void;
  setCroppedImageSrc: (src: string) => void;

  // Active Crop State
  crop: Crop | undefined;
  setCrop: React.Dispatch<React.SetStateAction<Crop | undefined>>;
  completedPercentCrop: Crop | null;
  setCompletedPercentCrop: React.Dispatch<React.SetStateAction<Crop | null>>;
  completedPixelCrop: Crop | null;
  setCompletedPixelCrop: React.Dispatch<React.SetStateAction<Crop | null>>;
  isCircularCrop: boolean;
  cropAspect: number | undefined;
  handleSetAspect: (aspect: number | undefined | "circle" | "oval") => void;

  // Storyboard Frames Navigation
  storyboardSlices: Array<{ name: string; url: string; [key: string]: any }>;
  setStoryboardSlices: React.Dispatch<React.SetStateAction<any[]>>;
  shapeStudioCropIndex: number | null;
  setShapeStudioCropIndex: React.Dispatch<React.SetStateAction<number | null>>;
  resentFromStoryboardSliceIndex: number | null;
  setResentFromStoryboardSliceIndex: React.Dispatch<React.SetStateAction<number | null>>;

  // Crop & Tool Actions
  handleApplyCrop: (proceedToCarve?: boolean) => Promise<void> | void;
  handleCropToStoryboard: () => void;
  handleCropToStoryboardReplace: () => void;
  handleApplyCropDirectToStoryboard: () => void;
  handleOpenAutoSlice: () => void;
  handleOpenSmartTrim: (origin: "canvas" | "grid" | "storyboard") => void;

  // History & Visualizer
  cropHistory: string[];
  cropHistoryIndex: number;
  handleUndoCrop: () => void;
  handleRedoCrop: () => void;
  handleRevertToOriginal: () => void;
  handleJumpToCropHistoryIndex?: (index: number) => void;

  // Multi-Crops
  multiCrops: Array<{ id: string; crop: Crop; isCircular?: boolean }>;
  setMultiCrops: React.Dispatch<React.SetStateAction<any[]>>;
  handleApplyMultiCrops?: (targetMode?: "storyboard-slices" | "storyboard-slots" | "stay-in-crop") => Promise<void> | void;
  handleSendSingleMultiCropToStoryboard?: (item: any, directToGrid?: boolean) => void;

  // Notification Toast
  cropNotice: string | null;
  setCropNotice: (notice: string | null) => void;
}

export const FullScreenCropControlPanel: React.FC<FullScreenCropControlPanelProps> = ({
  isOpen,
  onClose,
  imageSrc,
  originalImageSrc,
  croppedImageSrc,
  setImageSrc,
  setCroppedImageSrc,
  crop,
  setCrop,
  completedPercentCrop,
  setCompletedPercentCrop,
  completedPixelCrop,
  setCompletedPixelCrop,
  isCircularCrop,
  cropAspect,
  handleSetAspect,
  storyboardSlices,
  setStoryboardSlices,
  shapeStudioCropIndex,
  setShapeStudioCropIndex,
  resentFromStoryboardSliceIndex,
  setResentFromStoryboardSliceIndex,
  handleApplyCrop,
  handleCropToStoryboard,
  handleCropToStoryboardReplace,
  handleApplyCropDirectToStoryboard,
  handleOpenAutoSlice,
  handleOpenSmartTrim,
  cropHistory,
  cropHistoryIndex,
  handleUndoCrop,
  handleRedoCrop,
  handleRevertToOriginal,
  handleJumpToCropHistoryIndex,
  multiCrops,
  setMultiCrops,
  handleApplyMultiCrops,
  handleSendSingleMultiCropToStoryboard,
  cropNotice,
  setCropNotice,
}) => {
  const modalImgRef = useRef<HTMLImageElement | null>(null);

  // Zoom and Canvas View Controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [showRuleOfThirds, setShowRuleOfThirds] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"aspects" | "quick_tools" | "actions" | "multi_crops">("aspects");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [customRatioInput, setCustomRatioInput] = useState<{ w: string; h: string }>({ w: "16", h: "9" });

  // Manual pixel input states
  const [manualPixels, setManualPixels] = useState<{ x: string; y: string; w: string; h: string }>({
    x: "0",
    y: "0",
    w: "100",
    h: "100",
  });

  // Custom in-panel Style & Color Dial state
  const [cropAccentColor, setCropAccentColor] = useState<string>("#10b981");

  // Sync image natural dimensions when image loads
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setNaturalDimensions({ width: naturalWidth, height: naturalHeight });
    setManualPixels({
      x: "0",
      y: "0",
      w: String(naturalWidth),
      h: String(naturalHeight),
    });
  };

  // Keyboard Escape listener to exit fullscreen
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Center the current crop
  const handleCenterCrop = () => {
    if (!crop || !crop.width || !crop.height) {
      // Default to 80% centered square/aspect
      const width = 80;
      const height = cropAspect ? 80 / cropAspect : 80;
      const x = (100 - width) / 2;
      const y = (100 - height) / 2;
      const newCrop: Crop = { unit: "%", x, y, width, height };
      setCrop(newCrop);
      setCompletedPercentCrop(newCrop);
      return;
    }
    const width = crop.width;
    const height = crop.height;
    const x = Math.max(0, (100 - width) / 2);
    const y = Math.max(0, (100 - height) / 2);
    const updated: Crop = { ...crop, unit: "%", x, y, width, height };
    setCrop(updated);
    setCompletedPercentCrop(updated);
  };

  // Maximize crop to cover 100% of image
  const handleMaximizeCrop = () => {
    const fullCrop: Crop = { unit: "%", x: 0, y: 0, width: 100, height: 100 };
    setCrop(fullCrop);
    setCompletedPercentCrop(fullCrop);
    handleSetAspect(undefined);
  };

  // Flip aspect ratio (Landscape <-> Portrait)
  const handleFlipAspect = () => {
    if (cropAspect && typeof cropAspect === "number" && cropAspect > 0) {
      handleSetAspect(1 / cropAspect);
    } else if (crop && crop.width && crop.height) {
      const swapped: Crop = {
        unit: "%",
        x: crop.x || 0,
        y: crop.y || 0,
        width: Math.min(100, crop.height),
        height: Math.min(100, crop.width),
      };
      setCrop(swapped);
      setCompletedPercentCrop(swapped);
    }
  };

  // Apply manual exact pixel coordinates
  const handleApplyManualPixels = () => {
    if (!naturalDimensions.width || !naturalDimensions.height) return;
    const pxX = Math.max(0, Math.min(naturalDimensions.width, parseFloat(manualPixels.x) || 0));
    const pxY = Math.max(0, Math.min(naturalDimensions.height, parseFloat(manualPixels.y) || 0));
    const pxW = Math.max(1, Math.min(naturalDimensions.width - pxX, parseFloat(manualPixels.w) || 100));
    const pxH = Math.max(1, Math.min(naturalDimensions.height - pxY, parseFloat(manualPixels.h) || 100));

    const percentCrop: Crop = {
      unit: "%",
      x: (pxX / naturalDimensions.width) * 100,
      y: (pxY / naturalDimensions.height) * 100,
      width: (pxW / naturalDimensions.width) * 100,
      height: (pxH / naturalDimensions.height) * 100,
    };
    setCrop(percentCrop);
    setCompletedPercentCrop(percentCrop);
    setCropNotice(`✓ Applied exact crop: ${Math.round(pxW)}×${Math.round(pxH)}px`);
    setTimeout(() => setCropNotice(null), 2500);
  };

  // Copy cropped image to clipboard
  const handleCopyCroppedToClipboard = async () => {
    const sourceImage = imageSrc || originalImageSrc;
    if (!sourceImage) return;
    const targetCrop = completedPercentCrop || crop || completedPixelCrop;
    if (!targetCrop || !targetCrop.width || !targetCrop.height) return;

    try {
      const croppedUrl = await getCroppedImg(
        sourceImage,
        targetCrop,
        "image/png",
        modalImgRef.current,
        isCircularCrop
      );
      if (croppedUrl && navigator.clipboard && window.ClipboardItem) {
        const res = await fetch(croppedUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        setCropNotice("✓ Cropped image copied to clipboard!");
        setTimeout(() => setCropNotice(null), 2500);
      }
    } catch (err) {
      console.error("Clipboard copy error:", err);
    }
  };

  // Direct download cropped PNG
  const handleDownloadCroppedPNG = async () => {
    const sourceImage = imageSrc || originalImageSrc;
    if (!sourceImage) return;
    const targetCrop = completedPercentCrop || crop || completedPixelCrop;
    if (!targetCrop || !targetCrop.width || !targetCrop.height) return;

    setIsDownloading(true);
    try {
      const croppedUrl = await getCroppedImg(
        sourceImage,
        targetCrop,
        "image/png",
        modalImgRef.current,
        isCircularCrop
      );
      if (croppedUrl) {
        saveAs(croppedUrl, `seqcarver_crop_${Date.now()}.png`);
        setCropNotice("✓ Cropped PNG downloaded!");
        setTimeout(() => setCropNotice(null), 2500);
      }
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Current calculated pixel dimensions for display
  const currentPixelWidth = naturalDimensions.width && completedPercentCrop?.width
    ? Math.round((completedPercentCrop.width / 100) * naturalDimensions.width)
    : naturalDimensions.width;
  const currentPixelHeight = naturalDimensions.height && completedPercentCrop?.height
    ? Math.round((completedPercentCrop.height / 100) * naturalDimensions.height)
    : naturalDimensions.height;

  // Active Storyboard Frame Index
  const currentStoryboardIdx = (resentFromStoryboardSliceIndex ?? shapeStudioCropIndex ?? 0);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={uiText("components_full_screen_crop_control_panel.div.crop_and_canvas_control_panel_full_screen_st.aria_label", "Crop and Canvas Control Panel - Full Screen Studio")}
      className="fixed inset-0 z-50 bg-[#070b14] text-slate-100 flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-150"
    >
      {/* ======================================================== */}
      {/* 1. TOP HEADER BAR WITH CONTROLS & EXIT TOGGLE           */}
      {/* ======================================================== */}
      <header className="h-14 px-4 bg-[#0a1120] border-b border-emerald-500/20 flex items-center justify-between shrink-0 shadow-lg relative z-30">
        {/* Left: Branding & Dimensions info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
              <CropIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CustomizableLabel
                  labelId="full_screen_crop_control_panel_item_47"
                  as="h1"
                  className="text-sm font-black text-emerald-300 tracking-wide flex items-center gap-1.5"
                >
                    {() => (
                        <>
                          {uiText("components_full_screen_crop_control_panel.h1.panel_1_crop_and_canvas_control_panel", "PANEL 1 : CROP & CANVAS CONTROL PANEL")}
                        </>
                      )}
                </CustomizableLabel>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {uiText("components_full_screen_crop_control_panel.span.full_screen_mode", "FULL SCREEN MODE")}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-2">
                <span>{uiText("components_full_screen_crop_control_panel.span.original", "Original: ")}{naturalDimensions.width} × {naturalDimensions.height}{uiText("components_full_screen_crop_control_panel.span.px", " px")}</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  {uiText("components_full_screen_crop_control_panel.span.crop", "Crop: ")}{currentPixelWidth} × {currentPixelHeight}{uiText("components_full_screen_crop_control_panel.span.px_2", " px")}
                  {completedPercentCrop?.width ? ` (${Math.round(completedPercentCrop.width)}% × ${Math.round(completedPercentCrop.height || 0)}%)` : " (100%)"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Center: Storyboard Frame Navigation & History Snapshots */}
        <div className="flex items-center gap-2">
          {storyboardSlices.length > 0 && (
            <div className="flex items-center gap-1 bg-[#020617] p-1 rounded-xl border border-indigo-500/30 shadow-inner">
              <CustomizableButton
                buttonId="full_screen_crop_control_panel_btn_46"
                defaultIcon={<ChevronLeft className="w-4 h-4" />}
                type="button"
onClick={() => {
                  const prevIdx = (currentStoryboardIdx - 1 + storyboardSlices.length) % storyboardSlices.length;
                  const slice = storyboardSlices[prevIdx];
                  if (slice) {
                    setImageSrc(slice.url);
                    setCroppedImageSrc(slice.url);
                    setCrop(undefined);
                    setCompletedPercentCrop(null);
                    setCompletedPixelCrop(null);
                    setResentFromStoryboardSliceIndex(prevIdx);
                    if (shapeStudioCropIndex !== null) setShapeStudioCropIndex(prevIdx);
                  }
                }}
className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
title={uiText("components_full_screen_crop_control_panel.button.previous_frame.title", "Previous Frame")}
              />
              <span className="text-xs font-mono font-bold text-cyan-300 px-2">
                {uiText("components_full_screen_crop_control_panel.span.frame", "Frame ")}{currentStoryboardIdx + 1} / {storyboardSlices.length}
              </span>
              <CustomizableButton
                buttonId="full_screen_crop_control_panel_btn_45"
                defaultIcon={<ChevronRight className="w-4 h-4" />}
                type="button"
onClick={() => {
                  const nextIdx = (currentStoryboardIdx + 1) % storyboardSlices.length;
                  const slice = storyboardSlices[nextIdx];
                  if (slice) {
                    setImageSrc(slice.url);
                    setCroppedImageSrc(slice.url);
                    setCrop(undefined);
                    setCompletedPercentCrop(null);
                    setCompletedPixelCrop(null);
                    setResentFromStoryboardSliceIndex(nextIdx);
                    if (shapeStudioCropIndex !== null) setShapeStudioCropIndex(nextIdx);
                  }
                }}
className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
title={uiText("components_full_screen_crop_control_panel.button.next_frame.title", "Next Frame")}
              />
            </div>
          )}

          {/* History Controls */}
          {cropHistory && cropHistory.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-800">
              <CustomizableButton
                buttonId="full_screen_crop_control_panel_btn_44"
                defaultIcon={<Undo2 className="w-4 h-4" />}
                type="button"
onClick={handleUndoCrop}
disabled={cropHistoryIndex <= 0}
className="p-1 text-slate-400 hover:text-emerald-400 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
title={uiText("components_full_screen_crop_control_panel.button.undo_crop_ctrl_z.title", "Undo Crop (Ctrl+Z)")}
              />
              <CustomizableButton
                buttonId="full_screen_crop_control_panel_btn_43"
                defaultIcon={<Redo2 className="w-4 h-4" />}
                type="button"
onClick={handleRedoCrop}
disabled={cropHistoryIndex >= cropHistory.length - 1}
className="p-1 text-slate-400 hover:text-emerald-400 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
title={uiText("components_full_screen_crop_control_panel.button.redo_crop_ctrl_y.title", "Redo Crop (Ctrl+Y)")}
              />
              <span className="text-[10px] font-mono text-slate-400 px-1 border-l border-slate-800">
                {cropHistoryIndex + 1}/{cropHistory.length}
              </span>
            </div>
          )}
        </div>

        {/* Right: Exit Toggle & Close Button */}
        <div className="flex items-center gap-2">
          {/* Style & Color Dial Modal Trigger */}
          <RadialColorPicker
            color={cropAccentColor}
            onChange={(col) => setCropAccentColor(col)}
            compactTrigger
            buttonLabel="Style Dial"
            buttonClassName="px-2.5 py-1.5 rounded-lg bg-pink-950/80 hover:bg-pink-900 border border-pink-500/50 text-pink-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-pink-950/40"
          />

          {/* Revert Original */}
          <CustomizableButton
            buttonId="full_screen_crop_control_panel_btn_42"
            defaultIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
            type="button"
onClick={handleRevertToOriginal}
className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
title={uiText("components_full_screen_crop_control_panel.button.revert_image_to_original_state.title", "Revert Image to Original State")}
          >
              {() => (
                  <>
                    <span className="text-[11px] font-semibold">{uiText("components_full_screen_crop_control_panel.span.revert_original", "Revert Original")}</span>
                  </>
                )}
          </CustomizableButton>

          {/* PROMINENT TOGGLE: Exit Full Screen (returns to normal sidebar panel) */}
          <CustomizableButton
            buttonId="full_screen_crop_control_panel_btn_41"
            defaultIcon={<Minimize2 className="w-4 h-4 text-slate-950" />}
            type="button"
onClick={onClose}
className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
title={uiText("components_full_screen_crop_control_panel.button.toggle_return_to_normal_sidebar_view_esc.title", "Toggle / Return to Normal Sidebar View (Esc)")}
          >
              {() => (
                  <>
                    <span>{uiText("components_full_screen_crop_control_panel.span.exit_full_screen", "Exit Full Screen")}</span>
                  </>
                )}
          </CustomizableButton>

          {/* Close X */}
          <CustomizableButton
            buttonId="full_screen_crop_control_panel_btn_40"
            defaultIcon={<X className="w-5 h-5" />}
            type="button"
onClick={onClose}
className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
title={uiText("components_full_screen_crop_control_panel.button.close_full_screen_control_panel_esc.title", "Close Full Screen Control Panel (Esc)")}
          />
        </div>
      </header>

      {/* Toast Notification Notice */}
      <AnimatePresence>
        {cropNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-300"
          >
            <Check className="w-4 h-4" />
            <span>{cropNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 2. MAIN WORKSPACE: CANVAS (LEFT) & CONTROL DECK (RIGHT)   */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* ==================================================== */}
        {/* LEFT PANE: HIGH RESOLUTION INTERACTIVE CROP CANVAS   */}
        {/* ==================================================== */}
        <section className="flex-1 flex flex-col bg-[#050811] relative overflow-hidden border-r border-[#1a2333]">
          {/* Canvas Top Toolbar */}
          <div className="h-11 px-3 bg-[#0c1322] border-b border-slate-800/80 flex items-center justify-between shrink-0">
            {/* Zoom & Viewport Controls */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">{uiText("components_full_screen_crop_control_panel.span.zoom", "Zoom:")}</span>
              <CustomizableButton
                buttonId="full_screen_crop_control_panel_btn_39"
                defaultIcon={<ZoomOut className="w-3.5 h-3.5" />}
                type="button"
onClick={() => setZoomLevel((z) => Math.max(0.25, z - 0.15))}
className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
title={uiText("components_full_screen_crop_control_panel.button.zoom_out.title", "Zoom Out")}
              />
              <span className="text-xs font-mono font-bold text-emerald-400 min-w-[45px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <CustomizableButton
                buttonId="full_screen_crop_control_panel_btn_38"
                defaultIcon={<ZoomIn className="w-3.5 h-3.5" />}
                type="button"
onClick={() => setZoomLevel((z) => Math.min(3, z + 0.15))}
className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
title={uiText("components_full_screen_crop_control_panel.button.zoom_in.title", "Zoom In")}
              />
              <CustomizableButton
                buttonId="full_screen_crop_control_panel_100"
                defaultLabel={"100%"}
                type="button"
onClick={() => setZoomLevel(1)}
className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 ml-1 transition-colors cursor-pointer"
title={uiText("components_full_screen_crop_control_panel.button.fit_reset_zoom.title", "Fit / Reset Zoom")}
              />
            </div>

            {/* Quick Geometric Crop Actions */}
            <div className="flex items-center gap-1.5">
              <CustomizableButton
                buttonId="full_screen_crop_control_panel_btn_37"
                defaultIcon={<Scaling className="w-3.5 h-3.5 text-cyan-400" />}
                type="button"
onClick={handleCenterCrop}
className="px-2 py-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
title={uiText("components_full_screen_crop_control_panel.button.center_the_active_crop_box.title", "Center the active crop box")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_full_screen_crop_control_panel.span.center_crop", "Center Crop")}</span>
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="full_screen_crop_control_panel_btn_36"
                defaultIcon={<Maximize2 className="w-3.5 h-3.5 text-emerald-400" />}
                type="button"
onClick={handleMaximizeCrop}
className="px-2 py-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
title={uiText("components_full_screen_crop_control_panel.button.expand_crop_to_full_100_canvas.title", "Expand Crop to Full 100% Canvas")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_full_screen_crop_control_panel.span.full_image", "Full Image")}</span>
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="full_screen_crop_control_panel_btn_35"
                defaultIcon={<RefreshCw className="w-3.5 h-3.5 text-amber-400" />}
                type="button"
onClick={handleFlipAspect}
className="px-2 py-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
title={uiText("components_full_screen_crop_control_panel.button.flip_crop_orientation_landscape_portrait.title", "Flip Crop Orientation (Landscape / Portrait)")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_full_screen_crop_control_panel.span.flip_h_v", "Flip (H/V)")}</span>
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="full_screen_crop_control_panel_btn_34"
                defaultIcon={<Grid className="w-3.5 h-3.5" />}
                type="button"
onClick={() => setShowRuleOfThirds((prev) => !prev)}
className={cn(
                  "px-2 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1",
                  showRuleOfThirds
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-900 text-slate-400 border-slate-800"
                )}
title={uiText("components_full_screen_crop_control_panel.button.toggle_rule_of_thirds_guide_lines.title", "Toggle Rule of Thirds Guide Lines")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_full_screen_crop_control_panel.span.thirds_grid", "Thirds Grid")}</span>
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>

          {/* Interactive ReactCrop Stage Area */}
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[radial-gradient(#152033_1px,transparent_1px)] [background-size:16px_16px] relative">
            <div
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center center",
                transition: "transform 100ms ease-out",
              }}
              className="relative shadow-2xl rounded-lg border border-slate-800 overflow-hidden bg-black/80 flex items-center justify-center max-w-full max-h-full"
            >
              <ReactCrop
                crop={crop}
                aspect={cropAspect}
                circularCrop={isCircularCrop}
                ruleOfThirds={showRuleOfThirds}
                onChange={(c, pc) => {
                  setCrop(c);
                  setCompletedPercentCrop(pc);
                }}
                onComplete={(c, pc) => {
                  setCompletedPixelCrop(c);
                  setCompletedPercentCrop(pc);
                }}
                className="max-h-[calc(100vh-190px)] max-w-full select-none"
              >
                <img
                  ref={modalImgRef}
                  alt={uiText("components_full_screen_crop_control_panel.img.full_screen_crop_source.alt", "Full Screen Crop Source")}
                  src={imageSrc || originalImageSrc}
                  onLoad={handleImageLoad}
                  className="max-h-[calc(100vh-190px)] max-w-full w-auto h-auto object-contain block select-none pointer-events-auto"
                />
              </ReactCrop>
            </div>

            {/* Floating Live Dimensions HUD Overlay */}
            <div className="absolute bottom-4 left-4 z-20 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold">
                <CropIcon className="w-3.5 h-3.5" />
                <span>{currentPixelWidth} × {currentPixelHeight}{uiText("components_full_screen_crop_control_panel.span.px_3", " px")}</span>
              </div>
              <div className="text-slate-500">•</div>
              <div className="text-slate-300 font-mono text-[11px]">
                {completedPercentCrop?.width ? `${Math.round(completedPercentCrop.width)}% × ${Math.round(completedPercentCrop.height || 0)}%` : "Full"}
              </div>
              <div className="text-slate-500">•</div>
              <div className="text-slate-400 font-semibold text-[11px]">
                {isCircularCrop ? (cropAspect === 1 ? "Circle" : "Oval") : cropAspect ? `Aspect: ${typeof cropAspect === "number" ? cropAspect.toFixed(2) : cropAspect}` : "Free Aspect"}
              </div>
            </div>
          </div>

          {/* Bottom Snapshots Filmstrip */}
          {cropHistory && cropHistory.length > 0 && (
            <div className="h-16 px-4 bg-[#0a1120] border-t border-slate-800 flex items-center justify-between shrink-0 gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold shrink-0">
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>{uiText("components_full_screen_crop_control_panel.span.timeline_snapshots", "Timeline Snapshots (")}{cropHistory.length}):</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin flex-1">
                {cropHistory.map((thumbUrl, hIdx) => {
                  const isCurrent = hIdx === cropHistoryIndex;
                  return (
                    <CustomizableButton
                      buttonId="full_screen_crop_control_panel_btn_33"
                      key={`fs-crop-snap-${hIdx}`}
type="button"
onClick={() => handleJumpToCropHistoryIndex && handleJumpToCropHistoryIndex(hIdx)}
className={cn(
                        "relative w-10 h-10 rounded-lg border overflow-hidden shrink-0 transition-all cursor-pointer bg-black/60",
                        isCurrent
                          ? "ring-2 ring-emerald-400 border-emerald-400 scale-105"
                          : "border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100"
                      )}
title={`Jump to Snapshot #${hIdx + 1}${isCurrent ? " (Active)" : ""}`}
                    >
                        {() => (
                            <>
                              <img src={thumbUrl} alt={`Snap #${hIdx + 1}`} className="w-full h-full object-contain" />
                            <span className="absolute bottom-0 right-0 px-1 text-[8px] font-mono font-bold bg-black/80 text-white rounded-tl">
                        {hIdx + 1}
                      </span>
                            </>
                          )}
                    </CustomizableButton>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ==================================================== */}
        {/* RIGHT PANE: COMPREHENSIVE CONTROL DECK               */}
        {/* ==================================================== */}
        <aside className="w-96 bg-[#0a1120] flex flex-col shrink-0 overflow-hidden">
          {/* Deck Tab Navigation */}
          <div className="grid grid-cols-4 p-1.5 bg-[#070b14] border-b border-slate-800 gap-1 text-[11px] font-bold">
            <CustomizableButton
              buttonId="full_screen_crop_control_panel_btn_32"
              type="button"
onClick={() => setActiveTab("aspects")}
className={cn(
                "py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer",
                activeTab === "aspects"
                  ? "bg-emerald-600 text-slate-950 font-black shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              )}
            >
                {() => (
                    <>
                      {uiText("components_full_screen_crop_control_panel.button.aspects", "Aspects")}
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="full_screen_crop_control_panel_btn_31"
              type="button"
onClick={() => setActiveTab("quick_tools")}
className={cn(
                "py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer",
                activeTab === "quick_tools"
                  ? "bg-emerald-600 text-slate-950 font-black shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              )}
            >
                {() => (
                    <>
                      {uiText("components_full_screen_crop_control_panel.button.optical_tools", "Optical Tools")}
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="full_screen_crop_control_panel_btn_30"
              type="button"
onClick={() => setActiveTab("actions")}
className={cn(
                "py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer",
                activeTab === "actions"
                  ? "bg-emerald-600 text-slate-950 font-black shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              )}
            >
                {() => (
                    <>
                      {uiText("components_full_screen_crop_control_panel.button.export_and_apply", "Export & Apply")}
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="full_screen_crop_control_panel_btn_29"
              type="button"
onClick={() => setActiveTab("multi_crops")}
className={cn(
                "py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer relative",
                activeTab === "multi_crops"
                  ? "bg-emerald-600 text-slate-950 font-black shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              )}
            >
                {() => (
                    <>
                      <span>{uiText("components_full_screen_crop_control_panel.span.multi_crops", "Multi-Crops")}</span>
                    {multiCrops.length > 0 && (
                <span className="ml-1 px-1 py-0.2 rounded-full text-[9px] bg-indigo-500 text-white font-bold">
                  {multiCrops.length}
                </span>
              )}
                    </>
                  )}
            </CustomizableButton>
          </div>

          {/* Deck Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* ============================================== */}
            {/* TAB 1: ASPECT RATIO STUDIO & MANUAL NUMERICS   */}
            {/* ============================================== */}
            {activeTab === "aspects" && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div className="bg-[#0e172a] p-3 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Scaling className="w-3.5 h-3.5" />
                      {uiText("components_full_screen_crop_control_panel.span.aspect_ratio_presets", "Aspect Ratio Presets")}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {uiText("components_full_screen_crop_control_panel.span.active", "Active: ")}{isCircularCrop ? (cropAspect === 1 ? "1:1 Circle" : "Oval") : cropAspect === undefined ? "Free" : `${cropAspect.toFixed(2)}`}
                    </span>
                  </div>

                  {/* Preset Grid Matrix */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Free */}
                    <CustomizableButton
                      buttonId="full_screen_crop_control_panel_btn_28"
                      defaultIcon={<Square className="w-4 h-4 text-emerald-400" />}
                      type="button"
onClick={() => handleSetAspect(undefined)}
className={cn(
                        "p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5",
                        cropAspect === undefined && !isCircularCrop
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md font-bold"
                          : "bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300"
                      )}
                    >
                        {() => (
                            <>
                              <span className="text-[11px] font-bold">{uiText("components_full_screen_crop_control_panel.span.free", "Free")}</span>
                            <span className="text-[9px] text-slate-500">{uiText("components_full_screen_crop_control_panel.span.unconstrained", "Unconstrained")}</span>
                            </>
                          )}
                    </CustomizableButton>

                    {/* 1:1 Square */}
                    <CustomizableButton
                      buttonId="full_screen_crop_control_panel_btn_27"
                      defaultIcon={<Square className="w-4 h-4 text-emerald-400" />}
                      type="button"
onClick={() => handleSetAspect(1)}
className={cn(
                        "p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5",
                        cropAspect === 1 && !isCircularCrop
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md font-bold"
                          : "bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300"
                      )}
                    >
                        {() => (
                            <>
                              <span className="text-[11px] font-bold">{uiText("components_full_screen_crop_control_panel.span.1_1_square", "1:1 Square")}</span>
                            <span className="text-[9px] text-slate-500">{uiText("components_full_screen_crop_control_panel.span.avatar_post", "Avatar / Post")}</span>
                            </>
                          )}
                    </CustomizableButton>

                    {/* 16:9 Wide */}
                    <CustomizableButton
                      buttonId="full_screen_crop_control_panel_btn_26"
                      defaultIcon={<LayoutGrid className="w-4 h-4 text-emerald-400" />}
                      type="button"
onClick={() => handleSetAspect(16 / 9)}
className={cn(
                        "p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5",
                        typeof cropAspect === "number" && Math.abs(cropAspect - 16 / 9) < 0.02 && !isCircularCrop
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md font-bold"
                          : "bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300"
                      )}
                    >
                        {() => (
                            <>
                              <span className="text-[11px] font-bold">{uiText("components_full_screen_crop_control_panel.span.16_9_wide", "16:9 Wide")}</span>
                            <span className="text-[9px] text-slate-500">{uiText("components_full_screen_crop_control_panel.span.cinema_tv", "Cinema / TV")}</span>
                            </>
                          )}
                    </CustomizableButton>

                    {/* 9:16 Story */}
                    <CustomizableButton
                      buttonId="full_screen_crop_control_panel_btn_25"
                      defaultIcon={<LayoutGrid className="w-4 h-4 text-emerald-400" />}
                      type="button"
onClick={() => handleSetAspect(9 / 16)}
className={cn(
                        "p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5",
                        typeof cropAspect === "number" && Math.abs(cropAspect - 9 / 16) < 0.02 && !isCircularCrop
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md font-bold"
                          : "bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300"
                      )}
                    >
                        {() => (
                            <>
                              <span className="text-[11px] font-bold">{uiText("components_full_screen_crop_control_panel.span.9_16_reel", "9:16 Reel")}</span>
                            <span className="text-[9px] text-slate-500">{uiText("components_full_screen_crop_control_panel.span.stories_shorts", "Stories / Shorts")}</span>
                            </>
                          )}
                    </CustomizableButton>

                    {/* 4:3 Classic */}
                    <CustomizableButton
                      buttonId="full_screen_crop_control_panel_btn_24"
                      defaultIcon={<Square className="w-4 h-4 text-emerald-400" />}
                      type="button"
onClick={() => handleSetAspect(4 / 3)}
className={cn(
                        "p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5",
                        typeof cropAspect === "number" && Math.abs(cropAspect - 4 / 3) < 0.02 && !isCircularCrop
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md font-bold"
                          : "bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300"
                      )}
                    >
                        {() => (
                            <>
                              <span className="text-[11px] font-bold">{uiText("components_full_screen_crop_control_panel.span.4_3_classic", "4:3 Classic")}</span>
                            <span className="text-[9px] text-slate-500">{uiText("components_full_screen_crop_control_panel.span.retro_crt", "Retro CRT")}</span>
                            </>
                          )}
                    </CustomizableButton>

                    {/* 3:2 Photo */}
                    <CustomizableButton
                      buttonId="full_screen_crop_control_panel_btn_23"
                      defaultIcon={<Square className="w-4 h-4 text-emerald-400" />}
                      type="button"
onClick={() => handleSetAspect(1.5)}
className={cn(
                        "p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5",
                        typeof cropAspect === "number" && Math.abs(cropAspect - 1.5) < 0.02 && !isCircularCrop
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md font-bold"
                          : "bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300"
                      )}
                    >
                        {() => (
                            <>
                              <span className="text-[11px] font-bold">{uiText("components_full_screen_crop_control_panel.span.3_2_photo", "3:2 Photo")}</span>
                            <span className="text-[9px] text-slate-500">{uiText("components_full_screen_crop_control_panel.span.35mm_dslr", "35mm DSLR")}</span>
                            </>
                          )}
                    </CustomizableButton>

                    {/* 21:9 Ultrawide */}
                    <CustomizableButton
                      buttonId="full_screen_crop_control_panel_btn_22"
                      defaultIcon={<LayoutGrid className="w-4 h-4 text-emerald-400" />}
                      type="button"
onClick={() => handleSetAspect(21 / 9)}
className={cn(
                        "p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5",
                        typeof cropAspect === "number" && Math.abs(cropAspect - 21 / 9) < 0.02 && !isCircularCrop
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md font-bold"
                          : "bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300"
                      )}
                    >
                        {() => (
                            <>
                              <span className="text-[11px] font-bold">{uiText("components_full_screen_crop_control_panel.span.21_9_scope", "21:9 Scope")}</span>
                            <span className="text-[9px] text-slate-500">{uiText("components_full_screen_crop_control_panel.span.anamorphic", "Anamorphic")}</span>
                            </>
                          )}
                    </CustomizableButton>

                    {/* Circle 1:1 */}
                    <CustomizableButton
                      buttonId="full_screen_crop_control_panel_btn_21"
                      defaultIcon={<Circle className="w-4 h-4 text-emerald-400" />}
                      type="button"
onClick={() => handleSetAspect("circle")}
className={cn(
                        "p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5",
                        isCircularCrop && cropAspect === 1
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md font-bold"
                          : "bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300"
                      )}
                    >
                        {() => (
                            <>
                              <span className="text-[11px] font-bold">{uiText("components_full_screen_crop_control_panel.span.circle_1_1", "Circle 1:1")}</span>
                            <span className="text-[9px] text-slate-500">{uiText("components_full_screen_crop_control_panel.span.round_mask", "Round Mask")}</span>
                            </>
                          )}
                    </CustomizableButton>

                    {/* Oval */}
                    <CustomizableButton
                      buttonId="full_screen_crop_control_panel_btn_20"
                      defaultIcon={<Circle className="w-4 h-4 text-emerald-400" />}
                      type="button"
onClick={() => handleSetAspect("oval")}
className={cn(
                        "p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5",
                        isCircularCrop && cropAspect !== 1
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md font-bold"
                          : "bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300"
                      )}
                    >
                        {() => (
                            <>
                              <span className="text-[11px] font-bold">{uiText("components_full_screen_crop_control_panel.span.oval", "Oval")}</span>
                            <span className="text-[9px] text-slate-500">{uiText("components_full_screen_crop_control_panel.span.elliptical_mask", "Elliptical Mask")}</span>
                            </>
                          )}
                    </CustomizableButton>
                  </div>

                  {/* Custom Aspect Ratio Input */}
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-[10px] text-slate-400 block font-semibold">{uiText("components_full_screen_crop_control_panel.span.custom_ratio_width_height", "Custom Ratio (Width : Height)")}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={customRatioInput.w}
                        onChange={(e) => setCustomRatioInput((prev) => ({ ...prev, w: e.target.value }))}
                        placeholder={uiText("components_full_screen_crop_control_panel.input.w.placeholder", "W")}
                        className="w-16 bg-[#020617] border border-slate-800 rounded px-2 py-1 text-xs text-center font-mono focus:border-emerald-500 focus:outline-none"
                      />
                      <span className="text-slate-500 font-bold">:</span>
                      <input
                        type="number"
                        min="1"
                        value={customRatioInput.h}
                        onChange={(e) => setCustomRatioInput((prev) => ({ ...prev, h: e.target.value }))}
                        placeholder={uiText("components_full_screen_crop_control_panel.input.h.placeholder", "H")}
                        className="w-16 bg-[#020617] border border-slate-800 rounded px-2 py-1 text-xs text-center font-mono focus:border-emerald-500 focus:outline-none"
                      />
                      <CustomizableButton
                        buttonId="full_screen_crop_control_panel_btn_19"
                        type="button"
onClick={() => {
                          const w = parseFloat(customRatioInput.w) || 16;
                          const h = parseFloat(customRatioInput.h) || 9;
                          if (w > 0 && h > 0) {
                            handleSetAspect(w / h);
                          }
                        }}
className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded transition-all cursor-pointer text-center"
                      >
                          {() => (
                              <>
                                {uiText("components_full_screen_crop_control_panel.button.set_ratio", "Set Ratio")}
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  </div>
                </div>

                {/* Exact Numeric Pixel Editor */}
                <div className="bg-[#0e172a] p-3 rounded-xl border border-slate-800 space-y-2.5">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    {uiText("components_full_screen_crop_control_panel.span.exact_pixel_coordinates", "Exact Pixel Coordinates")}
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <CustomizableLabel
                        labelId="full_screen_crop_control_panel_item_18"
                        as="label"
                        className="text-[10px] text-slate-400 block mb-0.5"
                      >
                          {() => (
                              <>
                                {uiText("components_full_screen_crop_control_panel.label.x_position_px", "X Position (px)")}
                              </>
                            )}
                      </CustomizableLabel>
                      <input
                        type="number"
                        value={manualPixels.x}
                        onChange={(e) => setManualPixels((p) => ({ ...p, x: e.target.value }))}
                        className="w-full bg-[#020617] border border-slate-800 rounded px-2 py-1 font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <CustomizableLabel
                        labelId="full_screen_crop_control_panel_item_17"
                        as="label"
                        className="text-[10px] text-slate-400 block mb-0.5"
                      >
                          {() => (
                              <>
                                {uiText("components_full_screen_crop_control_panel.label.y_position_px", "Y Position (px)")}
                              </>
                            )}
                      </CustomizableLabel>
                      <input
                        type="number"
                        value={manualPixels.y}
                        onChange={(e) => setManualPixels((p) => ({ ...p, y: e.target.value }))}
                        className="w-full bg-[#020617] border border-slate-800 rounded px-2 py-1 font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <CustomizableLabel
                        labelId="full_screen_crop_control_panel_item_16"
                        as="label"
                        className="text-[10px] text-slate-400 block mb-0.5"
                      >
                          {() => (
                              <>
                                {uiText("components_full_screen_crop_control_panel.label.width_px", "Width (px)")}
                              </>
                            )}
                      </CustomizableLabel>
                      <input
                        type="number"
                        value={manualPixels.w}
                        onChange={(e) => setManualPixels((p) => ({ ...p, w: e.target.value }))}
                        className="w-full bg-[#020617] border border-slate-800 rounded px-2 py-1 font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <CustomizableLabel
                        labelId="full_screen_crop_control_panel_item_15"
                        as="label"
                        className="text-[10px] text-slate-400 block mb-0.5"
                      >
                          {() => (
                              <>
                                {uiText("components_full_screen_crop_control_panel.label.height_px", "Height (px)")}
                              </>
                            )}
                      </CustomizableLabel>
                      <input
                        type="number"
                        value={manualPixels.h}
                        onChange={(e) => setManualPixels((p) => ({ ...p, h: e.target.value }))}
                        className="w-full bg-[#020617] border border-slate-800 rounded px-2 py-1 font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <CustomizableButton
                    buttonId="full_screen_crop_control_panel_btn_14"
                    type="button"
onClick={handleApplyManualPixels}
className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                      {() => (
                          <>
                            {uiText("components_full_screen_crop_control_panel.button.apply_exact_pixels", "Apply Exact Pixels")}
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/* TAB 2: OPTICAL AUTO-SLICE & SMART TRIM TOOLS   */}
            {/* ============================================== */}
            {activeTab === "quick_tools" && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div className="bg-gradient-to-br from-emerald-950/40 via-cyan-950/30 to-slate-900/60 p-3.5 rounded-xl border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-emerald-500/20">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      {uiText("components_full_screen_crop_control_panel.span.optical_detection_tools", "Optical Detection Tools")}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {uiText("components_full_screen_crop_control_panel.p.ai_powered_edge_segmentation_alpha_transpare", "AI-powered edge segmentation, alpha transparent trimming, and auto-slicing for sprites, panels, and illustrations.")}
                  </p>

                  <div className="space-y-2 pt-1">
                    <CustomizableButton
                      buttonId="full_screen_crop_control_panel_btn_13"
                      defaultIcon={<Scissors className="w-4 h-4 text-slate-950" />}
                      type="button"
onClick={() => {
                        onClose();
                        handleOpenAutoSlice();
                      }}
className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                        {() => (
                            <>
                              <span>{uiText("components_full_screen_crop_control_panel.span.launch_optical_auto_slice", "Launch Optical Auto-Slice")}</span>
                            </>
                          )}
                    </CustomizableButton>
                    <p className="text-[10px] text-slate-400 px-1">
                      {uiText("components_full_screen_crop_control_panel.p.scans_optical_bounding_boxes_of_individual_c", "Scans optical bounding boxes of individual characters and objects based on transparent alphas.")}
                    </p>

                    <CustomizableButton
                      buttonId="full_screen_crop_control_panel_btn_12"
                      defaultIcon={<CropIcon className="w-4 h-4 text-cyan-200" />}
                      type="button"
onClick={() => {
                        onClose();
                        handleOpenSmartTrim("canvas");
                      }}
className="w-full py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all mt-3"
                    >
                        {() => (
                            <>
                              <span>{uiText("components_full_screen_crop_control_panel.span.launch_smart_trim_and_crop", "Launch Smart Trim & Crop")}</span>
                            </>
                          )}
                    </CustomizableButton>
                    <p className="text-[10px] text-slate-400 px-1">
                      {uiText("components_full_screen_crop_control_panel.p.automatically_detects_and_trims_transparent", "Automatically detects and trims transparent padding borders with pivot alignment.")}
                    </p>
                  </div>
                </div>

                {/* Shift + Drag Multi-Crop Tip */}
                <div className="bg-[#0e172a] p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    {uiText("components_full_screen_crop_control_panel.span.multi_crop_workflow", "Multi-Crop Workflow")}
                  </span>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {uiText("components_full_screen_crop_control_panel.p.hold", "Hold ")}<kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[10px]">{uiText("components_full_screen_crop_control_panel.kbd.shift", "Shift")}</kbd>{uiText("components_full_screen_crop_control_panel.p.while_dragging_a_new_crop_on_the_canvas_to_q", " while dragging a new crop on the canvas to queue multiple sub-crops without replacing the current one.")}
                  </p>
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/* TAB 3: PRIMARY ACTIONS & STORYBOARD EXPORT     */}
            {/* ============================================== */}
            {activeTab === "actions" && (
              <div className="space-y-3 animate-in fade-in duration-100">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block px-0.5">
                  {uiText("components_full_screen_crop_control_panel.span.commit_crop_and_storyboard_actions", "Commit Crop & Storyboard Actions")}
                </span>

                {/* Apply Crop to Canvas */}
                <CustomizableButton
                  buttonId="full_screen_crop_control_panel_btn_11"
                  defaultIcon={<Check className="w-4 h-4 text-emerald-200" />}
                  type="button"
onClick={async () => {
                    await handleApplyCrop(false);
                    setCropNotice("✓ Crop applied to canvas image!");
                    setTimeout(() => setCropNotice(null), 2500);
                  }}
className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                    {() => (
                        <>
                          <span>{uiText("components_full_screen_crop_control_panel.span.apply_crop_to_working_canvas", "Apply Crop to Working Canvas")}</span>
                        </>
                      )}
                </CustomizableButton>

                {/* Add to Storyboard */}
                <CustomizableButton
                  buttonId="full_screen_crop_control_panel_btn_10"
                  defaultIcon={<Plus className="w-4 h-4 text-indigo-200" />}
                  type="button"
onClick={() => {
                    handleCropToStoryboard();
                    setCropNotice("✓ Added new frame to Storyboard!");
                    setTimeout(() => setCropNotice(null), 2500);
                  }}
className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                    {() => (
                        <>
                          <span>{uiText("components_full_screen_crop_control_panel.span.add_to_storyboard_new_frame", "+ Add to Storyboard (New Frame)")}</span>
                        </>
                      )}
                </CustomizableButton>

                {/* Replace Frame in Storyboard */}
                {storyboardSlices.length > 0 && (
                  <CustomizableButton
                    buttonId="full_screen_crop_control_panel_btn_9"
                    defaultIcon={<RefreshCw className="w-4 h-4 text-purple-200" />}
                    type="button"
onClick={() => {
                      handleCropToStoryboardReplace();
                      setCropNotice(`✓ Replaced Storyboard Frame ${currentStoryboardIdx + 1}!`);
                      setTimeout(() => setCropNotice(null), 2500);
                    }}
className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_full_screen_crop_control_panel.span.replace_frame", "Replace Frame ")}{currentStoryboardIdx + 1}</span>
                          </>
                        )}
                  </CustomizableButton>
                )}

                {/* Direct to Grid Slot */}
                <CustomizableButton
                  buttonId="full_screen_crop_control_panel_btn_8"
                  defaultIcon={<LayoutGrid className="w-4 h-4" />}
                  type="button"
onClick={() => {
                    handleApplyCropDirectToStoryboard();
                    setCropNotice("✓ Sent direct to Storyboard Grid Slot!");
                    setTimeout(() => setCropNotice(null), 2500);
                  }}
className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                    {() => (
                        <>
                          <span>{uiText("components_full_screen_crop_control_panel.span.send_direct_to_storyboard_grid_slot", "Send Direct to Storyboard Grid Slot")}</span>
                        </>
                      )}
                </CustomizableButton>

                {/* Download Cropped PNG */}
                <CustomizableButton
                  buttonId="full_screen_crop_control_panel_btn_7"
                  defaultIcon={<Download className="w-4 h-4 text-cyan-400" />}
                  type="button"
onClick={handleDownloadCroppedPNG}
disabled={isDownloading}
className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                    {() => (
                        <>
                          <span>{isDownloading ? "Downloading..." : "Download Cropped PNG"}</span>
                        </>
                      )}
                </CustomizableButton>

                {/* Copy to Clipboard */}
                <CustomizableButton
                  buttonId="full_screen_crop_control_panel_btn_6"
                  type="button"
onClick={handleCopyCroppedToClipboard}
className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                    {() => (
                        <>
                          {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                        <span>{isCopied ? "Copied to Clipboard!" : "Copy Cropped to Clipboard"}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            )}

            {/* ============================================== */}
            {/* TAB 4: MULTI-CROPS BATCH QUEUE                 */}
            {/* ============================================== */}
            {activeTab === "multi_crops" && (
              <div className="space-y-3 animate-in fade-in duration-100">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    {uiText("components_full_screen_crop_control_panel.span.queued_multi_crops", "Queued Multi-Crops (")}{multiCrops.length})
                  </span>
                  {multiCrops.length > 0 && (
                    <CustomizableButton
                      buttonId="full_screen_crop_control_panel_btn_5"
                      type="button"
onClick={() => setMultiCrops([])}
className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                    >
                        {() => (
                            <>
                              {uiText("components_full_screen_crop_control_panel.button.clear_all", "Clear All")}
                            </>
                          )}
                    </CustomizableButton>
                  )}
                </div>

                {multiCrops.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
                    <Layers className="w-6 h-6 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">{uiText("components_full_screen_crop_control_panel.p.no_multi_crops_queued", "No Multi-Crops Queued")}</p>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      {uiText("components_full_screen_crop_control_panel.p.hold_2", "Hold ")}<kbd className="px-1 py-0.5 rounded bg-slate-800 text-indigo-300">{uiText("components_full_screen_crop_control_panel.kbd.shift_2", "Shift")}</kbd>{uiText("components_full_screen_crop_control_panel.p.and_drag_boxes_on_the_canvas_to_queue_multip", " and drag boxes on the canvas to queue multiple crops here for batch export.")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                      {multiCrops.map((item, idx) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-400">#{idx + 1}</span>
                            <span className="text-slate-300">
                              {item.isCircular ? "Oval" : "Rect"} ({Math.round(item.crop.width || 0)}% × {Math.round(item.crop.height || 0)}%)
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {handleSendSingleMultiCropToStoryboard && (
                              <CustomizableButton
                                buttonId="full_screen_crop_control_panel_btn_4"
                                defaultIcon={<Plus className="w-3 h-3" />}
                                type="button"
onClick={() => handleSendSingleMultiCropToStoryboard(item, false)}
className="p-1 text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 rounded border border-indigo-700/50 cursor-pointer"
title={uiText("components_full_screen_crop_control_panel.button.send_to_storyboard.title", "Send to Storyboard")}
                              />
                            )}
                            <CustomizableButton
                              buttonId="full_screen_crop_control_panel_btn_3"
                              defaultIcon={<Trash2 className="w-3 h-3" />}
                              type="button"
onClick={() => setMultiCrops((prev) => prev.filter((c) => c.id !== item.id))}
className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
title={uiText("components_full_screen_crop_control_panel.button.delete_crop.title", "Delete Crop")}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {handleApplyMultiCrops && (
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <CustomizableButton
                          buttonId="full_screen_crop_control_panel_btn_2"
                          type="button"
onClick={() => handleApplyMultiCrops("storyboard-slices")}
className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                        >
                            {() => (
                                <>
                                  {uiText("components_full_screen_crop_control_panel.button.batch_send_all_to_storyboard_slices", "Batch Send All to Storyboard Slices")}
                                </>
                              )}
                        </CustomizableButton>
                        <CustomizableButton
                          buttonId="full_screen_crop_control_panel_btn_1"
                          type="button"
onClick={() => handleApplyMultiCrops("storyboard-slots")}
className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
                        >
                            {() => (
                                <>
                                  {uiText("components_full_screen_crop_control_panel.button.batch_send_all_to_storyboard_slots", "Batch Send All to Storyboard Slots")}
                                </>
                              )}
                        </CustomizableButton>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
