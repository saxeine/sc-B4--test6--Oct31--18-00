import React, { useState } from "react";
import { useButtonCustomization } from "../context/ButtonCustomizationContext";
import {
  Scissors,
  Crop as CropIcon,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Sparkles,
  Square,
  LayoutGrid,
  Circle,
  RefreshCw,
  Check,
  Undo2,
  Redo2,
  RotateCcw,
  Plus,
  Grid,
  Split,
  ArrowLeft,
  Layers,
  GripVertical,
  Scaling,
  ChevronDown,
  X,
  History,
  Maximize2,
  Bookmark,
} from "lucide-react";
import { CustomizableButton } from "./CustomizableButton";
import { CustomizableLabel } from "./CustomizableLabel";
import { MesshiIcon } from "./MesshiIcon";
import { KrumsIcon } from "./KrumsIcon";
import { CanvasHistoryVisualizer } from "./CanvasHistoryVisualizer";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";

export interface CropSidebarProps {
  onToggleFullScreenControlPanel?: () => void;
  isFullScreenControlPanelOpen?: boolean;
  cropPanelsOrder: string[];
  cropQuickToolsOrder: string[];
  cropSbFrameOrder: string[];
  cropAspectOrder: string[];
  cropPrimaryOrder: string[];
  cropUtilityOrder: string[];
  cropShapeStudioOrder: string[];
  cropMultiCropBatchOrder: string[];

  draggedCropPanel: string | null;
  dragOverCropPanel: string | null;
  handleCropPanelDragStart: (e: React.DragEvent, panelId: string) => void;
  handleCropPanelDragOver: (e: React.DragEvent, panelId: string) => void;
  handleCropPanelDrop: (e: React.DragEvent, targetPanelId: string) => void;
  handleCropPanelDragEnd: () => void;

  draggedCropItem: { id: string; zone: string } | null;
  dragOverCropItem: string | null;
  handleCropItemDragStart: (e: React.DragEvent, id: string, zone: string) => void;
  handleCropItemDragOver: (e: React.DragEvent, id: string) => void;
  handleCropItemDrop: (e: React.DragEvent, targetId: string, zone: string) => void;
  handleCropItemDragEnd: () => void;
  handleCropZoneDrop: (e: React.DragEvent, zone: string) => void;
  handleResetCropLayout: () => void;
  handleSavePresentCropStateAsDefault?: () => void | Promise<void>;

  cropNotice: string | null;
  setCropNotice: (notice: string | null) => void;
  completedPercentCrop: any;
  completedPixelCrop: any;
  crop: any;
  setCrop: (c: any) => void;
  setCompletedPercentCrop: (c: any) => void;
  setCompletedPixelCrop: (c: any) => void;
  isCircularCrop: boolean;
  cropAspect: number | undefined;
  handleSetAspect: (aspect: number | undefined | "circle" | "oval") => void;

  shapeStudioCropIndex: number | null;
  setShapeStudioCropIndex: (idx: number | null) => void;
  resentFromStoryboardSliceIndex: number | null;
  setResentFromStoryboardSliceIndex: (idx: number | null) => void;
  storyboardSlices: any[];
  setStoryboardSlices: React.Dispatch<React.SetStateAction<any[]>>;
  cropHistory: any[];
  cropHistoryIndex: number;
  originalImageSrc: string | null;
  imageSrc: string | null;
  setImageSrc: (s: string) => void;
  croppedImageSrc: string | null;
  setCroppedImageSrc: (s: string) => void;
  multiCrops: any[];
  setMultiCrops: React.Dispatch<React.SetStateAction<any[]>>;
  setMode: (mode: any) => void;

  handleOpenAutoSlice: () => void;
  handleOpenSmartTrim: (target: "canvas" | "storyboard" | "grid") => void;
  handleApplyCrop: (proceedToCarve?: boolean) => void | Promise<void>;
  handleCropToStoryboard: () => void | Promise<void>;
  handleCropToStoryboardReplace: () => void | Promise<void>;
  handleUndoCrop: () => void;
  handleRedoCrop: () => void;
  handleRevertToOriginal: () => void;
  handleJumpToCropHistoryIndex?: (index: number) => void;
  onOpenHistoryVisualizer?: () => void;
  setIsGridMeshModalOpen: (v: boolean) => void;
  setIsJoinImagesModalOpen: (v: boolean) => void;
  handleOpenMesshi: (src: string) => void;
  handleOpenKrums?: () => void;
  handleApplyCropDirectToStoryboard: () => void;
  handleApplyCropAndBackToShapeStudio: () => void;
  handleCancelBackToShapeStudio: () => void;
  handleApplyMultiCrops: (dest: string) => void;
  handleSendSingleMultiCropToStoryboard: (item: any, directSlot: boolean) => void;

  // Mesh tool props
  isMeshToolActive: boolean;
  setIsMeshToolActive: (v: boolean) => void;
  imgRef: React.RefObject<HTMLImageElement | null>;
  meshBounds: any;
  meshSquareSize: number;
  meshMode: "uniform" | "freestyle";
  setMeshMode: (m: "uniform" | "freestyle") => void;
  freestyleSquares: any[];
  setFreestyleSquares: React.Dispatch<React.SetStateAction<any[]>>;
  selectedFreestyleSquareId: string | null;
  setSelectedFreestyleSquareId: (id: string | null) => void;
  selectedFreestyleSquareIds: string[];
  setSelectedFreestyleSquareIds: (ids: string[]) => void;
  handleInitializeDefaultFreestyleSquares: () => void;
  freestyleSlicePreviewRef: React.RefObject<HTMLDivElement | null>;
  isMeshImageInfoOpen: boolean;
  setIsMeshImageInfoOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMeshAppearanceOpen: boolean;
  setIsMeshAppearanceOpen: React.Dispatch<React.SetStateAction<boolean>>;
  meshGridLineColor: string;
  setMeshGridLineColor: (c: string) => void;
  meshGridLineWidth: number;
  setMeshGridLineWidth: (w: number) => void;
  meshAutoGotoAfterCut: boolean;
  setMeshAutoGotoAfterCut: (v: boolean) => void;
  meshDestination: any;
  setMeshDestination: (d: any) => void;
  handleCutMeshIntoSquares: () => void;
  MESH_COLOR_PRESETS: Array<{ id: string; name: string; hex: string }>;
  MESH_LINE_WIDTHS: number[];
}

export const CropSidebar: React.FC<CropSidebarProps> = ({
  onToggleFullScreenControlPanel,
  isFullScreenControlPanelOpen,
  cropPanelsOrder,
  cropQuickToolsOrder,
  cropSbFrameOrder,
  cropAspectOrder,
  cropPrimaryOrder,
  cropUtilityOrder,
  cropShapeStudioOrder,
  cropMultiCropBatchOrder,

  draggedCropPanel,
  dragOverCropPanel,
  handleCropPanelDragStart,
  handleCropPanelDragOver,
  handleCropPanelDrop,
  handleCropPanelDragEnd,

  draggedCropItem,
  dragOverCropItem,
  handleCropItemDragStart,
  handleCropItemDragOver,
  handleCropItemDrop,
  handleCropItemDragEnd,
  handleCropZoneDrop,
  handleResetCropLayout,
  handleSavePresentCropStateAsDefault,

  cropNotice,
  setCropNotice,
  completedPercentCrop,
  completedPixelCrop,
  crop,
  setCrop,
  setCompletedPercentCrop,
  setCompletedPixelCrop,
  isCircularCrop,
  cropAspect,
  handleSetAspect,

  shapeStudioCropIndex,
  setShapeStudioCropIndex,
  resentFromStoryboardSliceIndex,
  setResentFromStoryboardSliceIndex,
  storyboardSlices,
  setStoryboardSlices,
  cropHistory,
  cropHistoryIndex,
  originalImageSrc,
  imageSrc,
  setImageSrc,
  croppedImageSrc,
  setCroppedImageSrc,
  multiCrops,
  setMultiCrops,
  setMode,

  handleOpenAutoSlice,
  handleOpenSmartTrim,
  handleApplyCrop,
  handleCropToStoryboard,
  handleCropToStoryboardReplace,
  handleUndoCrop,
  handleRedoCrop,
  handleRevertToOriginal,
  handleJumpToCropHistoryIndex,
  onOpenHistoryVisualizer,
  setIsGridMeshModalOpen,
  setIsJoinImagesModalOpen,
  handleOpenMesshi,
  handleOpenKrums,
  handleApplyCropDirectToStoryboard,
  handleApplyCropAndBackToShapeStudio,
  handleCancelBackToShapeStudio,
  handleApplyMultiCrops,
  handleSendSingleMultiCropToStoryboard,

  isMeshToolActive,
  setIsMeshToolActive,
  imgRef,
  meshBounds,
  meshSquareSize,
  meshMode,
  setMeshMode,
  freestyleSquares,
  setFreestyleSquares,
  selectedFreestyleSquareId,
  setSelectedFreestyleSquareId,
  selectedFreestyleSquareIds,
  setSelectedFreestyleSquareIds,
  handleInitializeDefaultFreestyleSquares,
  freestyleSlicePreviewRef,
  isMeshImageInfoOpen,
  setIsMeshImageInfoOpen,
  isMeshAppearanceOpen,
  setIsMeshAppearanceOpen,
  meshGridLineColor,
  setMeshGridLineColor,
  meshGridLineWidth,
  setMeshGridLineWidth,
  meshAutoGotoAfterCut,
  setMeshAutoGotoAfterCut,
  meshDestination,
  setMeshDestination,
  handleCutMeshIntoSquares,
  MESH_COLOR_PRESETS,
  MESH_LINE_WIDTHS,
}) => {
  const { showCropDragHandles } = useButtonCustomization();
  const [isAspectPresetsOpen, setIsAspectPresetsOpen] = useState(false); // default closed!
  const [isLocalHistoryVisualizerOpen, setIsLocalHistoryVisualizerOpen] = useState(false);

  const renderCropItemContent = (btnId: string) => {
    switch (btnId) {
      case "crop_auto_slice":
        return (
          <CustomizableButton
            buttonId="crop_auto_slice"
            defaultLabel="Auto-Slice"
            defaultIcon={<Scissors className="w-3.5 h-3.5 text-slate-950 shrink-0" />}
            onClick={handleOpenAutoSlice}
            className="w-full py-1.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Auto-detect individual sprites & bounds via optical alpha thresholding"
          />
        );
      case "crop_smart_trim":
        return (
          <CustomizableButton
            buttonId="crop_smart_trim"
            defaultLabel="Smart Trim"
            defaultIcon={<CropIcon className="w-3.5 h-3.5 text-cyan-200 shrink-0" />}
            onClick={() => handleOpenSmartTrim("canvas")}
            className="w-full py-1.5 px-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Smart Auto-Crop & Alpha Trimming with character pivot alignment"
          />
        );
      case "crop_sb_frame_prev":
        return (
          <CustomizableButton
            buttonId="crop_sb_frame_prev"
            defaultLabel=""
            forceZeroText={true}
            defaultIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            onClick={() => {
              const currentIdx = resentFromStoryboardSliceIndex ?? (shapeStudioCropIndex ?? 0);
              const prevIdx = (currentIdx - 1 + storyboardSlices.length) % storyboardSlices.length;
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
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors cursor-pointer active:scale-95"
            title="Previous Storyboard Frame"
          />
        );
      case "crop_sb_frame_counter": {
        const currentIdx = (resentFromStoryboardSliceIndex ?? shapeStudioCropIndex ?? 0) + 1;
        const totalCount = storyboardSlices.length;
        const countText = `${currentIdx} / ${totalCount}`;
        return (
          <CustomizableLabel
            labelId="crop_sb_frame_counter"
            defaultText={countText}
            showLabelAlways={true}
            showIconAlways={false}
            className="text-xs font-bold font-mono text-cyan-400 min-w-[48px] text-center px-1.5 py-0.5 rounded bg-slate-950/70 border border-slate-800 cursor-pointer shadow-inner inline-flex items-center justify-center"
            title={`Storyboard Frame ${countText} (Right-click to customize)`}
          >
            {({ config }) => (
              <span className="text-xs font-bold font-mono text-cyan-400 whitespace-nowrap">
                {config?.label && config.label !== "Frame Counter"
                  ? `${config.label} ${countText}`
                  : countText}
              </span>
            )}
          </CustomizableLabel>
        );
      }
      case "crop_sb_frame_next":
        return (
          <CustomizableButton
            buttonId="crop_sb_frame_next"
            defaultLabel=""
            forceZeroText={true}
            defaultIcon={<ChevronRight className="w-3.5 h-3.5" />}
            onClick={() => {
              const currentIdx = resentFromStoryboardSliceIndex ?? (shapeStudioCropIndex ?? 0);
              const nextIdx = (currentIdx + 1) % storyboardSlices.length;
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
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors cursor-pointer active:scale-95"
            title="Next Storyboard Frame"
          />
        );
      case "crop_sb_frame_delete":
        return (
          <CustomizableButton
            buttonId="crop_sb_frame_delete"
            defaultLabel=""
            forceZeroText={true}
            defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => {
              const currentIdx = resentFromStoryboardSliceIndex ?? (shapeStudioCropIndex ?? 0);
              if (currentIdx < 0 || currentIdx >= storyboardSlices.length) return;
              const newSlices = storyboardSlices.filter((_, idx) => idx !== currentIdx);
              setStoryboardSlices(newSlices);

              if (newSlices.length === 0) {
                setResentFromStoryboardSliceIndex(null);
                if (shapeStudioCropIndex !== null) setShapeStudioCropIndex(null);
              } else {
                const nextIdx = currentIdx >= newSlices.length ? newSlices.length - 1 : currentIdx;
                const nextSlice = newSlices[nextIdx];
                if (nextSlice) {
                  setImageSrc(nextSlice.url);
                  setCroppedImageSrc(nextSlice.url);
                  setCrop(undefined);
                  setCompletedPercentCrop(null);
                  setCompletedPixelCrop(null);
                  if (resentFromStoryboardSliceIndex !== null) setResentFromStoryboardSliceIndex(nextIdx);
                  if (shapeStudioCropIndex !== null) setShapeStudioCropIndex(nextIdx);
                }
              }
            }}
            className="p-1 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer active:scale-95"
            title="Delete Frame directly from Storyboard"
          />
        );
      case "crop_aspect_free":
      case "crop_aspect_1_1":
      case "crop_aspect_16_9":
      case "crop_aspect_9_16":
      case "crop_aspect_4_3":
      case "crop_aspect_3_2":
      case "crop_aspect_circle":
      case "crop_aspect_oval": {
        const aspectDefs: Record<string, { label: string; icon: React.ReactNode; tooltip: string; value: any }> = {
          crop_aspect_free: { label: "Free", icon: <Sparkles className="w-3 h-3" />, tooltip: "Freeform selection without fixed aspect", value: undefined },
          crop_aspect_1_1: { label: "1:1", icon: <Square className="w-3 h-3" />, tooltip: "1:1 Square aspect ratio", value: 1 },
          crop_aspect_16_9: { label: "16:9", icon: <LayoutGrid className="w-3 h-3" />, tooltip: "16:9 Wide cinema aspect ratio", value: 16 / 9 },
          crop_aspect_9_16: { label: "9:16", icon: <LayoutGrid className="w-3 h-3" />, tooltip: "9:16 Vertical Story aspect ratio", value: 9 / 16 },
          crop_aspect_4_3: { label: "4:3", icon: <LayoutGrid className="w-3 h-3" />, tooltip: "4:3 Classic TV aspect ratio", value: 4 / 3 },
          crop_aspect_3_2: { label: "3:2", icon: <LayoutGrid className="w-3 h-3" />, tooltip: "3:2 Photo print aspect ratio", value: 1.5 },
          crop_aspect_circle: { label: "Circle", icon: <Circle className="w-3 h-3" />, tooltip: "1:1 Circular crop mask", value: "circle" },
          crop_aspect_oval: { label: "Oval", icon: <Circle className="w-3 h-3" />, tooltip: "Oval freeform deform crop mask", value: "oval" },
        };
        const def = aspectDefs[btnId];
        if (!def) return null;
        let active = false;
        if (btnId === "crop_aspect_circle") active = isCircularCrop && cropAspect === 1;
        else if (btnId === "crop_aspect_oval") active = isCircularCrop && cropAspect === undefined;
        else if (btnId === "crop_aspect_free") active = !isCircularCrop && cropAspect === undefined;
        else if (btnId === "crop_aspect_1_1") active = !isCircularCrop && cropAspect === 1;
        else if (btnId === "crop_aspect_16_9") active = !isCircularCrop && typeof cropAspect === "number" && Math.abs(cropAspect - 16 / 9) < 0.02;
        else if (btnId === "crop_aspect_9_16") active = !isCircularCrop && typeof cropAspect === "number" && Math.abs(cropAspect - 9 / 16) < 0.02;
        else if (btnId === "crop_aspect_4_3") active = !isCircularCrop && typeof cropAspect === "number" && Math.abs(cropAspect - 4 / 3) < 0.02;
        else if (btnId === "crop_aspect_3_2") active = !isCircularCrop && typeof cropAspect === "number" && Math.abs(cropAspect - 1.5) < 0.02;

        return (
          <CustomizableButton
            buttonId={btnId}
            defaultLabel={def.label}
            defaultIcon={def.icon}
            onClick={() => handleSetAspect(def.value)}
            className={cn(
              "w-full py-1 px-1.5 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer truncate",
              active
                ? "bg-[#10b981] text-[#020617] shadow-sm font-black"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
            title={def.tooltip}
          />
        );
      }
      case "crop_2canvas":
        return (
          <CustomizableButton
            buttonId="crop_2canvas"
            defaultLabel="2canvas"
            defaultIcon={<CropIcon className="w-3.5 h-3.5" />}
            onClick={() => handleApplyCrop(false)}
            className="w-full bg-[#10b981] hover:bg-emerald-400 text-[#020617] py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 text-[11px] shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Crop & Set as Canvas Base"
          />
        );
      case "crop_and_go":
        return (
          <CustomizableButton
            buttonId="crop_and_go"
            defaultLabel="Crop & Go"
            defaultIcon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={async () => {
              await handleApplyCrop(true);
            }}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#020617] py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 text-[11px] shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Apply Crop and proceed straight to Split Grid mode"
          />
        );
      case "crop_2sbrd":
        return (
          <CustomizableButton
            buttonId="crop_2sbrd"
            defaultLabel="2SBrd"
            defaultIcon={<LayoutGrid className="w-3.5 h-3.5" />}
            onClick={() => handleCropToStoryboard()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 text-[11px] shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Crop & Add to Storyboard"
          />
        );
      case "crop_replace_sbrd":
        return (
          <CustomizableButton
            buttonId="crop_replace_sbrd"
            defaultLabel="Replace"
            defaultIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => handleCropToStoryboardReplace()}
            disabled={storyboardSlices.length === 0}
            className="w-full bg-amber-600/90 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 text-[11px] shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title={
              storyboardSlices.length === 0
                ? "No Storyboard frames to replace"
                : `Replace current Storyboard frame #${(resentFromStoryboardSliceIndex ?? shapeStudioCropIndex ?? 0) + 1} with this cropped area`
            }
          />
        );
      case "crop_select_all":
        return (
          <CustomizableButton
            buttonId="crop_select_all"
            defaultLabel="Select All"
            defaultIcon={<Check className="w-3.5 h-3.5" />}
            onClick={() => {
              setCrop({ unit: "%", x: 0, y: 0, width: 100, height: 100 });
              setCompletedPercentCrop({ unit: "%", x: 0, y: 0, width: 100, height: 100 });
              setCompletedPixelCrop(null);
            }}
            className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors cursor-pointer shadow-sm shrink-0"
            title="Select All (Reset Crop Area to Full Image)"
            forceZeroText={true}
          />
        );
      case "crop_undo":
        return (
          <CustomizableButton
            buttonId="crop_undo"
            defaultLabel="Undo"
            defaultIcon={<Undo2 className="w-3.5 h-3.5" />}
            onClick={handleUndoCrop}
            disabled={cropHistoryIndex <= 0}
            className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-amber-400 border border-slate-700 rounded-lg transition-colors cursor-pointer shadow-sm shrink-0"
            title="Undo Crop"
            forceZeroText={true}
          />
        );
      case "crop_redo":
        return (
          <CustomizableButton
            buttonId="crop_redo"
            defaultLabel="Redo"
            defaultIcon={<Redo2 className="w-3.5 h-3.5" />}
            onClick={handleRedoCrop}
            disabled={cropHistoryIndex < 0 || cropHistoryIndex >= cropHistory.length - 1}
            className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-amber-400 border border-slate-700 rounded-lg transition-colors cursor-pointer shadow-sm shrink-0"
            title="Redo Crop"
            forceZeroText={true}
          />
        );
      case "crop_revert":
        if (!originalImageSrc || originalImageSrc === imageSrc || shapeStudioCropIndex !== null) return null;
        return (
          <CustomizableButton
            buttonId="crop_revert"
            defaultLabel="Revert"
            defaultIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleRevertToOriginal}
            className="w-8 h-8 flex items-center justify-center bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg transition-colors cursor-pointer shadow-sm shrink-0"
            title="Revert Original"
            forceZeroText={true}
          />
        );
      case "crop_history_visualizer":
        return (
          <CustomizableButton
            buttonId="crop_history_visualizer"
            defaultLabel={`History (${cropHistory.length})`}
            defaultIcon={<History className="w-3.5 h-3.5 text-amber-400" />}
            onClick={() => {
              if (onOpenHistoryVisualizer) {
                onOpenHistoryVisualizer();
              } else {
                setIsLocalHistoryVisualizerOpen(true);
              }
            }}
            className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg transition-colors cursor-pointer shadow-sm shrink-0"
            title={`Canvas Undo/Redo Snapshots Timeline (${cropHistory.length} snapshots, current: #${cropHistoryIndex + 1})`}
            forceZeroText={true}
          />
        );
      case "multiCropAdd":
        return (
          <CustomizableButton
            buttonId="multiCropAdd"
            defaultLabel="Multi-Crops"
            defaultIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => {
              const targetCrop = completedPercentCrop || crop || completedPixelCrop;
              if (targetCrop && targetCrop.width && targetCrop.width > 0) {
                setMultiCrops((prev) => [
                  ...prev,
                  {
                    id: Math.random().toString(36).substr(2, 9),
                    crop: { ...targetCrop },
                    isCircular: isCircularCrop,
                  },
                ]);
                setCrop(undefined);
                setCompletedPercentCrop(null);
                setCompletedPixelCrop(null);
                setCropNotice("Added area to multi-crops!");
                setTimeout(() => setCropNotice(null), 2000);
              } else {
                alert("Please select a crop area first.");
              }
            }}
            className="w-8 h-8 flex items-center justify-center bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 rounded-lg transition-colors cursor-pointer shadow-sm shrink-0"
            title="Add Area to Multi-Crops"
            forceZeroText={true}
          />
        );
      case "crop_mesh_tool":
        return (
          <CustomizableButton
            buttonId="crop_mesh_tool"
            defaultLabel="Grid Mesh Studio"
            defaultIcon={<Grid className="w-3.5 h-3.5" />}
            onClick={() => {
              const source = croppedImageSrc || imageSrc || originalImageSrc || storyboardSlices[0]?.url || "";
              if (!source) {
                setCropNotice("Please load or select an image first to open Grid Mesh Studio!");
                setTimeout(() => setCropNotice(null), 3000);
                return;
              }
              setIsGridMeshModalOpen(true);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer shadow-sm border shrink-0 bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700 hover:border-emerald-500/60"
            title="Grid Mesh Studio: Full-screen precision grid & freestyle polygon slicer with live previews"
            forceZeroText={true}
          />
        );
      case "join_images_tool":
        return (
          <CustomizableButton
            buttonId="join_images_tool"
            defaultLabel="Join Images"
            defaultIcon={<Split className="w-3.5 h-3.5" />}
            onClick={() => {
              setIsJoinImagesModalOpen(true);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer shadow-sm border shrink-0 bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700 hover:border-cyan-500/60"
            title="Join / Stitch Images: Join multiple images together horizontally (H) or vertically (V)"
            forceZeroText={true}
          />
        );
      case "messhi_grid_tool":
        return (
          <CustomizableButton
            buttonId="messhi_grid_tool"
            defaultLabel="Messhi"
            defaultIcon={<MesshiIcon className="w-3.5 h-3.5 text-cyan-400" />}
            onClick={() => handleOpenMesshi(imageSrc || originalImageSrc || croppedImageSrc || "")}
            className="px-2 h-8 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 rounded-lg font-bold transition-all flex items-center justify-center gap-1 text-[11px] cursor-pointer shadow-sm shrink-0"
            title="Open Messhi Mesh Grid Studio: Advanced subdivision & slicing"
          />
        );
      case "crop_panel_fullscreen_toggle":
        return (
          <CustomizableButton
            buttonId="crop_panel_fullscreen_toggle"
            defaultLabel="Full Screen"
            defaultIcon={<Maximize2 className="w-3.5 h-3.5 text-emerald-400" />}
            onClick={() => {
              if (onToggleFullScreenControlPanel) onToggleFullScreenControlPanel();
            }}
            className="px-2 h-8 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 rounded-lg font-bold transition-all flex items-center justify-center gap-1 text-[11px] cursor-pointer shadow-sm shrink-0"
            title="Launch Full Screen Control Panel (Panel 1)"
          />
        );
      case "krums_loader_tool":
        return (
          <CustomizableButton
            buttonId="krums_loader_tool"
            defaultLabel="Krums"
            defaultIcon={<KrumsIcon className="w-3.5 h-3.5 text-amber-400" />}
            onClick={() => {
              if (handleOpenKrums) handleOpenKrums();
            }}
            className="px-2 h-8 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/50 hover:border-amber-400 rounded-lg font-bold transition-all flex items-center justify-center gap-1 text-[11px] cursor-pointer shadow-sm shrink-0"
            title="Open Krums Image Loader Studio: Multi-image loader, reorder to storyboard, spin, zoom, stretch & effects"
          />
        );
      case "crop_ss_send_direct":
        return (
          <CustomizableButton
            buttonId="crop_ss_send_direct"
            defaultLabel="Send Crop Direct to Storyboard"
            defaultIcon={<CropIcon className="w-3.5 h-3.5" />}
            onClick={handleApplyCropDirectToStoryboard}
            className="w-full bg-[#10b981] hover:bg-emerald-400 text-[#020617] py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 text-xs shadow-md cursor-pointer"
          />
        );
      case "crop_ss_apply_back":
        return (
          <CustomizableButton
            buttonId="crop_ss_apply_back"
            defaultLabel="Apply Crop & Back to ShapeStudio"
            defaultIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={handleApplyCropAndBackToShapeStudio}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 text-xs shadow-md cursor-pointer"
          />
        );
      case "crop_ss_cancel_back":
        return (
          <CustomizableButton
            buttonId="crop_ss_cancel_back"
            defaultLabel="Cancel & Back to ShapeStudio"
            defaultIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={handleCancelBackToShapeStudio}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-2 rounded-lg font-bold transition-colors cursor-pointer text-center text-xs flex items-center justify-center gap-1.5"
          />
        );
      case "multiCropSendAllGrid":
        return (
          <CustomizableButton
            buttonId="multiCropSendAllGrid"
            defaultLabel={`Send All (${multiCrops.length}) to Storyboard Grid`}
            defaultIcon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={() => handleApplyMultiCrops("storyboard-slots")}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 text-xs shadow-md cursor-pointer"
          />
        );
      case "multiCropToSlices":
        return (
          <CustomizableButton
            buttonId="multiCropToSlices"
            defaultLabel="To Slices"
            defaultIcon={<LayoutGrid className="w-3 h-3" />}
            onClick={() => handleApplyMultiCrops("storyboard-slices")}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 text-[10px] shadow-sm cursor-pointer"
          />
        );
      case "multiCropStayInCrop":
        return (
          <CustomizableButton
            buttonId="multiCropStayInCrop"
            defaultLabel="Stay in Crop"
            defaultIcon={<Plus className="w-3 h-3" />}
            onClick={() => handleApplyMultiCrops("stay-in-crop")}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 text-[10px] cursor-pointer"
          />
        );
      default:
        return null;
    }
  };

  const renderCropItem = (id: string, zone: string, options?: { extraClasses?: string; fullWidth?: boolean }) => {
    const content = renderCropItemContent(id);
    if (!content) return null;

    const isDragging = draggedCropItem?.id === id;
    const isDragOver = dragOverCropItem === id;

    return (
      <div
        key={id}
        onDragOver={(e) => handleCropItemDragOver(e, id)}
        onDrop={(e) => handleCropItemDrop(e, id, zone)}
        onDragEnd={handleCropItemDragEnd}
        className={cn(
          "relative group/crop-item transition-all flex items-center shrink-0",
          isDragging && "ring-2 ring-emerald-400/90 bg-emerald-500/15 rounded-lg scale-[0.98]",
          isDragOver && "ring-2 ring-emerald-400 bg-emerald-500/25 rounded-lg shadow-lg",
          options?.fullWidth ? "w-full" : "",
          options?.extraClasses
        )}
      >
        {showCropDragHandles && (
          <div
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              handleCropItemDragStart(e, id, zone);
            }}
            onDragEnd={handleCropItemDragEnd}
            className="opacity-70 group-hover/crop-item:opacity-100 hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-emerald-400 cursor-grab active:cursor-grabbing shrink-0 flex items-center justify-center"
            title={uiText("components_crop_sidebar.div.drag_to_reposition_item.title", "Drag to reposition item")}
          >
            <GripVertical className="w-2.5 h-2.5" />
          </div>
        )}
        <div className="flex-1 min-w-0 flex items-center justify-center">
          {content}
        </div>
      </div>
    );
  };

  const renderMeshToolConfigPanel = () => {
    const naturalW = imgRef.current?.naturalWidth || 800;
    const naturalH = imgRef.current?.naturalHeight || 600;
    const meshPxX = Math.round((meshBounds.x / 100) * naturalW);
    const meshPxY = Math.round((meshBounds.y / 100) * naturalH);
    const meshPxW = Math.max(1, Math.round((meshBounds.width / 100) * naturalW));
    const meshPxH = Math.max(1, Math.round((meshBounds.height / 100) * naturalH));
    const effectiveSquare = Math.max(8, meshSquareSize);
    const meshCols = Math.max(1, Math.floor(meshPxW / effectiveSquare));
    const meshRows = Math.max(1, Math.floor(meshPxH / effectiveSquare));
    const meshTotalSquares = meshCols * meshRows;
    const selectedSq = freestyleSquares.find((s) => s.id === selectedFreestyleSquareId) || null;
    const selectedSqIdx = selectedSq ? freestyleSquares.findIndex((s) => s.id === selectedSq.id) : -1;
    const sqPxX = selectedSq ? Math.round((selectedSq.x / 100) * naturalW) : 0;
    const sqPxY = selectedSq ? Math.round((selectedSq.y / 100) * naturalH) : 0;
    const sqPxW = selectedSq ? Math.round((selectedSq.width / 100) * naturalW) : 0;
    const sqPxH = selectedSq ? Math.round((selectedSq.height / 100) * naturalH) : 0;

    return (
      <div className="bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/40 space-y-2.5 mt-2 shadow-inner">
        {/* Panel Header */}
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-emerald-300 flex items-center gap-1.5">
            <Grid className="w-3.5 h-3.5 text-emerald-400" />
            {uiText("components_crop_sidebar.span.mesh_grid_tool_square_slicer", "Mesh Grid Tool (Square Slicer)")}
          </span>
          <div className="flex items-center gap-1">
            <CustomizableButton
              buttonId="grid_mesh_studio_tool"
              defaultLabel="Messhi Studio"
              defaultIcon={<MesshiIcon className="w-3 h-3 text-cyan-400" />}
              onClick={() => handleOpenMesshi(imageSrc || originalImageSrc || croppedImageSrc || "")}
              className="px-1.5 py-0.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded text-[9.5px] font-bold flex items-center gap-1 cursor-pointer"
              title="Open in Messhi Studio"
            />
            <CustomizableButton
              buttonId="krums_mesh_studio_tool"
              defaultLabel="Krums Studio"
              defaultIcon={<KrumsIcon className="w-3 h-3 text-amber-400" />}
              onClick={() => {
                if (handleOpenKrums) handleOpenKrums();
              }}
              className="px-1.5 py-0.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40 rounded text-[9.5px] font-bold flex items-center gap-1 cursor-pointer"
              title="Open in Krums Image Loader Studio"
            />
            <CustomizableButton
              buttonId="crop_sidebar_btn_14"
              defaultIcon={<X className="w-3 h-3" />}
              type="button"
onClick={() => setIsMeshToolActive(false)}
className="text-slate-400 hover:text-rose-400 text-[10px] cursor-pointer p-0.5"
title={uiText("components_crop_sidebar.button.close_mesh_tool.title", "Close Mesh Tool")}
            />
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950/80 rounded-lg border border-slate-800 text-[10px]">
          <CustomizableButton
            buttonId="crop_sidebar_btn_13"
            defaultIcon={<Grid className="w-3 h-3" />}
            type="button"
onClick={() => setMeshMode("uniform")}
className={cn(
              "py-1 px-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center justify-center gap-1",
              meshMode === "uniform"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
              {() => (
                  <>
                    <span>{uiText("components_crop_sidebar.span.uniform_grid", "Uniform Grid")}</span>
                  </>
                )}
          </CustomizableButton>
          <CustomizableButton
            buttonId="crop_sidebar_btn_12"
            defaultIcon={<Sparkles className="w-3 h-3" />}
            type="button"
onClick={() => {
              if (freestyleSquares.length === 0) {
                handleInitializeDefaultFreestyleSquares();
              } else {
                setMeshMode("freestyle");
                if (selectedFreestyleSquareIds.length === 0 && freestyleSquares.length > 0) {
                  setSelectedFreestyleSquareIds([freestyleSquares[0].id]);
                }
                setTimeout(() => {
                  if (freestyleSlicePreviewRef.current) {
                    freestyleSlicePreviewRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "nearest",
                    });
                  }
                }, 60);
              }
            }}
className={cn(
              "py-1 px-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center justify-center gap-1",
              meshMode === "freestyle"
                ? "bg-cyan-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
              {() => (
                  <>
                    <span>{uiText("components_crop_sidebar.span.freestyle_mesh", "Freestyle Mesh")}</span>
                  </>
                )}
          </CustomizableButton>
        </div>

        {/* Real-time Image Coordinates Card */}
        <div className="bg-slate-950/90 rounded-lg border border-emerald-500/30 overflow-hidden text-[10px] font-mono transition-all">
          <CustomizableButton
            buttonId="crop_sidebar_btn_11"
            type="button"
onClick={() => setIsMeshImageInfoOpen((prev) => !prev)}
className="w-full flex items-center justify-between p-2 text-slate-400 hover:bg-slate-900/60 cursor-pointer transition-colors"
          >
              {() => (
                  <>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              {isMeshImageInfoOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{uiText("components_crop_sidebar.span.image_size", "Image Size:")}</span>
            </div>
                  <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">
                {naturalW} × {naturalH}{uiText("components_crop_sidebar.span.px", " px")}
              </span>
            </div>
                  </>
                )}
          </CustomizableButton>

          {isMeshImageInfoOpen && (
            <div className="px-2 pb-2 pt-0.5 space-y-1 border-t border-slate-800/80">
              {meshMode === "uniform" ? (
                <div className="space-y-0.5 pt-0.5 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{uiText("components_crop_sidebar.span.position_x_y", "Position (X, Y):")}</span>
                    <span className="text-emerald-300">
                      {meshPxX}{uiText("components_crop_sidebar.span.px_2", "px, ")}{meshPxY}{uiText("components_crop_sidebar.span.px_3", "px (")}{meshBounds.x.toFixed(1)}%, {meshBounds.y.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{uiText("components_crop_sidebar.span.area_w_h", "Area (W × H):")}</span>
                    <span className="text-emerald-300">
                      {meshPxW} × {meshPxH}{uiText("components_crop_sidebar.span.px_4", " px (")}{meshBounds.width.toFixed(1)}% × {meshBounds.height.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{uiText("components_crop_sidebar.span.grid_matrix", "Grid Matrix:")}</span>
                    <span className="text-cyan-300 font-bold">
                      {meshCols}{uiText("components_crop_sidebar.span.c", "c × ")}{meshRows}{uiText("components_crop_sidebar.span.r", "r (")}{meshTotalSquares}{uiText("components_crop_sidebar.span.tiles", " tiles @ ")}{meshSquareSize}{uiText("components_crop_sidebar.span.px_5", "px)")}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5 pt-0.5 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{uiText("components_crop_sidebar.span.active_squares", "Active Squares:")}</span>
                    <span className="text-cyan-300 font-bold">
                      {freestyleSquares.length}{uiText("components_crop_sidebar.span.tiles_2", " tiles")}
                    </span>
                  </div>
                  {selectedSq ? (
                    <>
                      <div className="flex items-center justify-between text-amber-300 border-t border-slate-800/80 pt-0.5 mt-0.5">
                        <span className="text-slate-400">{uiText("components_crop_sidebar.span.selected", "Selected #")}{selectedSqIdx + 1}:</span>
                        <span className="font-bold truncate max-w-[120px]">
                          {selectedSq.label || `Square ${selectedSqIdx + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">{uiText("components_crop_sidebar.span.position_x_y_2", "Position (X, Y):")}</span>
                        <span className="text-cyan-300">
                          {sqPxX}{uiText("components_crop_sidebar.span.px_6", "px, ")}{sqPxY}{uiText("components_crop_sidebar.span.px_7", "px (")}{selectedSq.x.toFixed(1)}%, {selectedSq.y.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">{uiText("components_crop_sidebar.span.tile_size_w_h", "Tile Size (W × H):")}</span>
                        <span className="text-amber-400 font-bold">
                          {sqPxW} × {sqPxH}{uiText("components_crop_sidebar.span.px_8", " px (")}{selectedSq.width.toFixed(1)}% × {selectedSq.height.toFixed(1)}%)
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500 text-[9.5px] italic pt-0.5 text-center">
                      {uiText("components_crop_sidebar.div.click_any_square_on_canvas_to_inspect_and_re", "Click any square on canvas to inspect & resize")}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mesh Appearance Accordion */}
        <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-2 text-xs space-y-1.5">
          <CustomizableButton
            buttonId="crop_sidebar_btn_10"
            type="button"
onClick={() => setIsMeshAppearanceOpen((prev) => !prev)}
className="w-full flex items-center justify-between text-[10px] text-slate-300 font-semibold cursor-pointer"
          >
              {() => (
                  <>
                    <div className="flex items-center gap-1.5">
              {isMeshAppearanceOpen ? <ChevronDown className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              <span>{uiText("components_crop_sidebar.span.grid_styling_and_colors", "Grid Styling & Colors")}</span>
            </div>
                  </>
                )}
          </CustomizableButton>
          {isMeshAppearanceOpen && (
            <div className="space-y-1.5 pt-1.5 pl-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {MESH_COLOR_PRESETS.map((color) => (
                  <CustomizableButton
                    buttonId="crop_sidebar_btn_9"
                    key={color.id}
type="button"
onClick={() => setMeshGridLineColor(color.hex)}
className={cn(
                      "w-4 h-4 rounded-full border transition-transform cursor-pointer",
                      meshGridLineColor === color.hex ? "scale-125 ring-2 ring-white border-transparent" : "border-slate-700 hover:scale-110"
                    )}
style={{ backgroundColor: color.hex }}
title={color.name}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between pt-0.5 text-[10px]">
                <span className="text-slate-400">{uiText("components_crop_sidebar.span.line_thickness", "Line Thickness:")}</span>
                <div className="flex items-center gap-1">
                  {MESH_LINE_WIDTHS.map((w) => (
                    <CustomizableButton
                      buttonId="crop_sidebar_btn_8"
                      key={w}
type="button"
onClick={() => setMeshGridLineWidth(w)}
className={cn(
                        "px-1.5 py-0.5 rounded text-[9.5px] font-mono border cursor-pointer",
                        meshGridLineWidth === w ? "bg-emerald-500 text-slate-950 font-bold border-emerald-400" : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                      )}
                    >
                        {() => (
                            <>
                              {w}
                            {uiText("components_crop_sidebar.button.px", "px")}
                            </>
                          )}
                    </CustomizableButton>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cut Destination & Auto-Goto */}
        <div className="space-y-1.5 pt-1.5 border-t border-emerald-900/40">
          <div className="flex items-center justify-between text-[10px]">
            <CustomizableLabel
              labelId="crop_sidebar_item_7"
              as="label"
              className="font-semibold text-slate-400"
            >
                {() => (
                    <>
                      {uiText("components_crop_sidebar.label.cut_destination", "Cut Destination:")}
                    </>
                  )}
            </CustomizableLabel>
            <CustomizableLabel
              labelId="crop_sidebar_item_6"
              as="label"
              className="flex items-center gap-1 text-[9.5px] text-slate-300 cursor-pointer"
            >
                {() => (
                    <>
                      <input
                type="checkbox"
                checked={meshAutoGotoAfterCut}
                onChange={(e) => setMeshAutoGotoAfterCut(e.target.checked)}
                className="rounded border-slate-700 accent-emerald-500 w-3 h-3"
              />
                    <span>{uiText("components_crop_sidebar.span.auto_goto_storyboard", "Auto Goto Storyboard")}</span>
                    </>
                  )}
            </CustomizableLabel>
          </div>
          <select
            value={meshDestination}
            onChange={(e) => setMeshDestination(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="storyboard-slices">{uiText("components_crop_sidebar.option.storyboard_slices_asset_pool", "Storyboard Slices (Asset Pool)")}</option>
            <option value="storyboard-slots">{uiText("components_crop_sidebar.option.storyboard_frame_slots_direct_load", "Storyboard Frame Slots (Direct Load)")}</option>
            <option value="multi-crops">{uiText("components_crop_sidebar.option.multi_crops_regions", "Multi-Crops Regions")}</option>
          </select>
        </div>

        {/* Action Cut Button */}
        <div className="pt-1">
          <CustomizableButton
            buttonId="crop_mesh_cut"
            defaultLabel={meshMode === "freestyle" ? `Cut Freestyle Squares (${freestyleSquares.length})` : "Cut Mesh into Squares"}
            defaultIcon={<Scissors className="w-3.5 h-3.5 text-slate-950" />}
            onClick={() => handleCutMeshIntoSquares()}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold h-8 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-98 transition-all"
            title="Cut mesh area into individual square slices"
          />
        </div>
      </div>
    );
  };

  const renderMultiCropsPanel = () => {
    return (
      <div
        key="multi_crops"
        onDragOver={(e) => handleCropPanelDragOver(e, "multi_crops")}
        onDrop={(e) => handleCropPanelDrop(e, "multi_crops")}
        onDragEnd={handleCropPanelDragEnd}
        className={cn(
          "bg-[#020617]/60 p-3 rounded-xl border border-[#1e293b] space-y-2 group/panel transition-all",
          draggedCropPanel === "multi_crops" && "ring-2 ring-indigo-400 bg-indigo-500/10 scale-[0.99]",
          dragOverCropPanel === "multi_crops" && "ring-2 ring-emerald-400 bg-emerald-500/10"
        )}
      >
        <div className="flex items-center justify-between text-[11px] font-bold pb-1 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            {showCropDragHandles && (
              <div
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  handleCropPanelDragStart(e, "multi_crops");
                }}
                onDragEnd={handleCropPanelDragEnd}
                className="opacity-70 group-hover/panel:opacity-100 hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-indigo-400 cursor-grab active:cursor-grabbing shrink-0"
                title={uiText("components_crop_sidebar.div.drag_panel_to_reorder_section.title", "Drag panel to reorder section")}
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>
            )}
            <CustomizableLabel
              labelId="label_multicrop_section"
              defaultText={`Multi-Crops (${multiCrops.length})`}
              defaultIcon={<Layers className="w-3.5 h-3.5 text-indigo-400" />}
              className="text-slate-300 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
            />
          </div>
          {multiCrops.length > 0 && (
            <CustomizableButton
              buttonId="multiCropClearAll"
              defaultLabel="Clear All"
              defaultIcon={<Trash2 className="w-3 h-3" />}
              onClick={() => setMultiCrops([])}
              className="text-rose-400 hover:text-rose-300 text-[10px] cursor-pointer flex items-center gap-0.5"
            />
          )}
        </div>

        {multiCrops.length === 0 ? (
          <div className="text-[10px] text-slate-500 text-center py-2 border border-dashed border-slate-800 rounded-lg">
            {uiText("components_crop_sidebar.div.hold", "Hold ")}<kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">{uiText("components_crop_sidebar.kbd.shift", "Shift")}</kbd>{uiText("components_crop_sidebar.div.while_drawing_to_automatically_add_multiple", " while drawing to automatically add multiple crop areas!")}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5">
              {multiCrops.map((item, idx) => (
                <div
                  key={item.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleCropItemDragEnd();
                    const srcIdxStr = e.dataTransfer.getData("application/x-multicrop-idx");
                    if (srcIdxStr !== "") {
                      const srcIdx = Number(srcIdxStr);
                      if (!isNaN(srcIdx) && srcIdx !== idx) {
                        setMultiCrops((prev) => {
                          const copy = [...prev];
                          const [removed] = copy.splice(srcIdx, 1);
                          copy.splice(idx, 0, removed);
                          return copy;
                        });
                      }
                    }
                  }}
                  className="p-1.5 px-2 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between text-[10px] gap-1 group/mcitem hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {showCropDragHandles && (
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          e.dataTransfer.setData("application/x-multicrop-idx", String(idx));
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={handleCropItemDragEnd}
                        className="cursor-grab active:cursor-grabbing p-0.5"
                        title={uiText("components_crop_sidebar.div.drag_to_reorder.title", "Drag to reorder")}
                      >
                        <GripVertical className="w-2.5 h-2.5 text-slate-500 group-hover/mcitem:text-slate-300 shrink-0" />
                      </div>
                    )}
                    <span className="text-[#10b981] font-bold shrink-0">#{idx + 1}</span>
                    <span className="text-slate-300 font-medium truncate">
                      {item.isCircular ? "Oval" : "Rect"} ({Math.round(item.crop.width || 0)}%×{Math.round(item.crop.height || 0)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <CustomizableButton
                      buttonId="multiCropItemSendAsset"
                      defaultLabel=""
                      defaultIcon={<Plus className="w-3 h-3" />}
                      onClick={() => handleSendSingleMultiCropToStoryboard(item, false)}
                      className="p-1 text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 rounded border border-indigo-700/50 cursor-pointer"
                      title="Send to Storyboard Asset Organizer"
                    />
                    <CustomizableButton
                      buttonId="multiCropItemSendSlot"
                      defaultLabel=""
                      defaultIcon={<Sparkles className="w-3 h-3" />}
                      onClick={() => handleSendSingleMultiCropToStoryboard(item, true)}
                      className="p-1 text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 rounded border border-emerald-700/50 cursor-pointer"
                      title="Send direct to Storyboard Grid Slot"
                    />
                    <CustomizableButton
                      buttonId="multiCropItemDelete"
                      defaultLabel=""
                      defaultIcon={<Trash2 className="w-3 h-3" />}
                      onClick={() => setMultiCrops((prev) => prev.filter((c) => c.id !== item.id))}
                      className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                      title="Remove from multi-crops"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Batch Action Buttons to Storyboard */}
            <div
              className="space-y-1.5 pt-1 border-t border-slate-800"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => handleCropZoneDrop(e, "multicrop_batch")}
            >
              <div className="flex flex-col gap-1 min-h-[32px]">
                {cropMultiCropBatchOrder.map((btnId) => renderCropItem(btnId, "multicrop_batch", { fullWidth: true }))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCropPanel = (panelId: string) => {
    switch (panelId) {
      case "quick_tools":
        return (
          <div
            key="quick_tools"
            onDragOver={(e) => handleCropPanelDragOver(e, "quick_tools")}
            onDrop={(e) => handleCropPanelDrop(e, "quick_tools")}
            onDragEnd={handleCropPanelDragEnd}
            className={cn(
              "p-2 bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-900/50 rounded-xl border border-emerald-500/30 shadow-inner group/panel transition-all",
              draggedCropPanel === "quick_tools" && "ring-2 ring-emerald-400 bg-emerald-500/10 scale-[0.99]",
              dragOverCropPanel === "quick_tools" && "ring-2 ring-emerald-400 bg-emerald-500/10"
            )}
          >
            <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-emerald-500/20">
              <div className="flex items-center gap-1.5">
                {showCropDragHandles && (
                  <div
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      handleCropPanelDragStart(e, "quick_tools");
                    }}
                    onDragEnd={handleCropPanelDragEnd}
                    className="opacity-70 group-hover/panel:opacity-100 hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-emerald-400 cursor-grab active:cursor-grabbing shrink-0"
                    title={uiText("components_crop_sidebar.div.drag_panel_to_reorder_section.title_2", "Drag panel to reorder section")}
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                )}
                <CustomizableLabel
                  labelId="label_quick_tools"
                  defaultText="Quick Tools"
                  defaultIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                  className="text-[11px] font-bold text-emerald-300 flex items-center gap-1 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1.5">
                {onToggleFullScreenControlPanel && (
                  <CustomizableButton
                    buttonId="crop_sidebar_btn_5"
                    defaultIcon={<Maximize2 className="w-3 h-3 text-emerald-400" />}
                    type="button"
onClick={onToggleFullScreenControlPanel}
className="p-1 text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/60 rounded transition-colors cursor-pointer"
title={uiText("components_crop_sidebar.button.launch_full_screen_control_panel_of_panel_1.title", "Launch Full Screen Control Panel of Panel 1")}
                  />
                )}
                <span className="text-[9px] text-slate-500">{uiText("components_crop_sidebar.span.drag_panel_to_move", "Drag panel to move")}</span>
              </div>
            </div>
            <div
              className="grid grid-cols-2 gap-1.5 min-h-[36px]"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => handleCropZoneDrop(e, "quick_tools")}
            >
              {cropQuickToolsOrder.map((btnId) => renderCropItem(btnId, "quick_tools", { fullWidth: true }))}
            </div>
          </div>
        );

      case "sb_frame":
        if (storyboardSlices.length === 0) return null;
        return (
          <div
            key="sb_frame"
            onDragOver={(e) => handleCropPanelDragOver(e, "sb_frame")}
            onDrop={(e) => handleCropPanelDrop(e, "sb_frame")}
            onDragEnd={handleCropPanelDragEnd}
            className={cn(
              "bg-indigo-950/40 border border-indigo-500/40 rounded-xl p-2.5 flex items-center justify-between shadow-sm group/panel transition-all",
              draggedCropPanel === "sb_frame" && "ring-2 ring-indigo-400 bg-indigo-500/10 scale-[0.99]",
              dragOverCropPanel === "sb_frame" && "ring-2 ring-emerald-400 bg-indigo-950/80"
            )}
          >
            <div className="flex items-center gap-1 min-w-0">
              {showCropDragHandles && (
                <div
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    handleCropPanelDragStart(e, "sb_frame");
                  }}
                  onDragEnd={handleCropPanelDragEnd}
                  className="opacity-70 group-hover/panel:opacity-100 hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-indigo-400 cursor-grab active:cursor-grabbing shrink-0"
                  title={uiText("components_crop_sidebar.div.drag_panel_to_reorder_section.title_3", "Drag panel to reorder section")}
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
              )}
              <CustomizableLabel
                labelId="label_crop_storyboard_frame"
                defaultText="Storyboard Frame"
                defaultIcon={<LayoutGrid className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                className="text-[11px] font-bold text-indigo-200 truncate cursor-pointer"
              />
            </div>
            <div
              className="flex items-center gap-1 bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800 shrink-0 min-h-[32px]"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => handleCropZoneDrop(e, "sb_frame")}
            >
              {cropSbFrameOrder.map((btnId) => renderCropItem(btnId, "sb_frame"))}
            </div>
          </div>
        );

      case "crop_area":
        return (
          <div
            key="crop_area"
            onDragOver={(e) => handleCropPanelDragOver(e, "crop_area")}
            onDrop={(e) => handleCropPanelDrop(e, "crop_area")}
            onDragEnd={handleCropPanelDragEnd}
            className={cn(
              "bg-[#020617]/60 p-3 rounded-xl border border-[#1e293b] space-y-3 group/panel transition-all",
              draggedCropPanel === "crop_area" && "ring-2 ring-emerald-400 bg-emerald-500/10 scale-[0.99]",
              dragOverCropPanel === "crop_area" && "ring-2 ring-emerald-400 bg-emerald-500/10"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between text-xs text-slate-300 pb-1 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                {showCropDragHandles && (
                  <div
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      handleCropPanelDragStart(e, "crop_area");
                    }}
                    onDragEnd={handleCropPanelDragEnd}
                    className="opacity-70 group-hover/panel:opacity-100 hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-emerald-400 cursor-grab active:cursor-grabbing shrink-0"
                    title={uiText("components_crop_sidebar.div.drag_panel_to_reorder_section.title_4", "Drag panel to reorder section")}
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                )}
                <CustomizableLabel
                  labelId="label_crop_area_header"
                  defaultText="Crop Area:"
                  defaultIcon={<CropIcon className="w-3 h-3 text-slate-400" />}
                  className="font-semibold text-slate-400 flex items-center gap-1.5 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                {onToggleFullScreenControlPanel && (
                  <CustomizableButton
                    buttonId="crop_sidebar_btn_4"
                    defaultIcon={<Maximize2 className="w-3 h-3 text-emerald-400" />}
                    type="button"
onClick={onToggleFullScreenControlPanel}
className="p-1 text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/60 rounded transition-colors cursor-pointer"
title={uiText("components_crop_sidebar.button.launch_full_screen_control_panel_of_panel_1.title_2", "Launch Full Screen Control Panel of Panel 1")}
                  />
                )}
                <span className="font-mono text-[#10b981] font-bold">
                  {completedPercentCrop?.width && completedPercentCrop.height
                    ? `${Math.round(completedPercentCrop.width)}% × ${Math.round(completedPercentCrop.height)}%`
                    : "Full Image"}
                </span>
              </div>
            </div>

            {/* Aspect Ratio Presets & Free Selection Panel (Collapsible, Default Closed) */}
            <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 p-2 space-y-2">
              <CustomizableButton
                buttonId="crop_sidebar_btn_3"
                type="button"
onClick={() => setIsAspectPresetsOpen((prev) => !prev)}
className="w-full flex items-center justify-between text-left cursor-pointer group/aspect hover:text-white transition-colors"
title={isAspectPresetsOpen ? "Click to collapse Aspect Ratio Presets" : "Click to expand Aspect Ratio Presets"}
              >
                  {() => (
                      <>
                        <div className="flex items-center gap-1.5">
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
                      !isAspectPresetsOpen && "-rotate-90"
                    )}
                  />
                  <CustomizableLabel
                    labelId="label_aspect_ratio_header"
                    defaultText="Aspect Ratio Presets"
                    defaultIcon={<Scaling className="w-3 h-3 text-slate-400" />}
                    className="text-[10px] font-bold tracking-wider text-slate-300 uppercase flex items-center gap-1.5 pointer-events-none"
                  />
                </div>
                      <div className="flex items-center gap-1.5">
                  <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-emerald-400">
                    {isCircularCrop
                      ? cropAspect === 1
                        ? "1:1 Circle"
                        : "Oval"
                      : cropAspect === undefined
                      ? "Free"
                      : cropAspect === 1
                      ? "1:1"
                      : typeof cropAspect === "number" && Math.abs(cropAspect - 16 / 9) < 0.02
                      ? "16:9"
                      : typeof cropAspect === "number" && Math.abs(cropAspect - 9 / 16) < 0.02
                      ? "9:16"
                      : typeof cropAspect === "number" && Math.abs(cropAspect - 4 / 3) < 0.02
                      ? "4:3"
                      : typeof cropAspect === "number" && Math.abs(cropAspect - 1.5) < 0.02
                      ? "3:2"
                      : "Custom"}
                  </span>
                  <span className="text-[9px] text-slate-500 group-hover/aspect:text-slate-300 transition-colors">
                    {isAspectPresetsOpen ? "Hide" : "Show"}
                  </span>
                </div>
                      </>
                    )}
              </CustomizableButton>

              {isAspectPresetsOpen && (
                <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[9px] text-slate-500">{uiText("components_crop_sidebar.span.click_preset_or_drag_to_reorder", "Click preset or drag to reorder")}</span>
                  </div>
                  <div
                    className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800 min-h-[36px]"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e) => handleCropZoneDrop(e, "aspect")}
                  >
                    {cropAspectOrder.map((btnId) => renderCropItem(btnId, "aspect", { fullWidth: true }))}
                  </div>

                  {/* Fallback Dropdown */}
                  <select
                    value={
                      isCircularCrop
                        ? cropAspect === 1
                          ? "circle"
                          : "oval"
                        : cropAspect === undefined
                        ? "free"
                        : String(cropAspect)
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "circle") handleSetAspect("circle" as any);
                      else if (val === "oval") handleSetAspect("oval" as any);
                      else if (val === "free") handleSetAspect(undefined);
                      else handleSetAspect(Number(val));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer mt-1"
                  >
                    <option value="free">{uiText("components_crop_sidebar.option.free_selection", "Free Selection")}</option>
                    <option value="1">{uiText("components_crop_sidebar.option.1_1_square", "1:1 Square")}</option>
                    <option value="1.7777777777777777">{uiText("components_crop_sidebar.option.16_9_wide", "16:9 Wide")}</option>
                    <option value="0.5625">{uiText("components_crop_sidebar.option.9_16_story", "9:16 Story")}</option>
                    <option value="1.3333333333333333">{uiText("components_crop_sidebar.option.4_3_classic", "4:3 Classic")}</option>
                    <option value="1.5">{uiText("components_crop_sidebar.option.3_2_photo", "3:2 Photo")}</option>
                    <option value="circle">{uiText("components_crop_sidebar.option.circle_1_1", "Circle 1:1")}</option>
                    <option value="oval">{uiText("components_crop_sidebar.option.oval_deform", "Oval Deform")}</option>
                  </select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-[#1e293b]">
              {shapeStudioCropIndex !== null ? (
                <div
                  className="space-y-2"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => handleCropZoneDrop(e, "ss")}
                >
                  <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-2.5 mb-2 text-center">
                    <span className="text-[11px] text-indigo-200 font-semibold block">
                      {uiText("components_crop_sidebar.span.shapestudio_frame", "ShapeStudio Frame ")}{shapeStudioCropIndex + 1}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {uiText("components_crop_sidebar.span.crop_will_update_this_frame_s_base_canvas", "Crop will update this frame's base canvas.")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {cropShapeStudioOrder.map((btnId) => renderCropItem(btnId, "ss", { fullWidth: true }))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Primary crop actions */}
                  <div
                    className="grid grid-cols-4 gap-1 min-h-[38px] p-0.5 rounded-lg border border-transparent hover:border-slate-800/60"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e) => handleCropZoneDrop(e, "primary")}
                  >
                    {cropPrimaryOrder.map((btnId) => renderCropItem(btnId, "primary", { fullWidth: true }))}
                  </div>

                  {/* Utility crop actions */}
                  <div
                    className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-800/80 min-h-[36px]"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e) => handleCropZoneDrop(e, "utility")}
                  >
                    {cropUtilityOrder.map((btnId) => renderCropItem(btnId, "utility"))}
                  </div>

                  {/* Inline History Snapshots Strip */}
                  {cropHistory && cropHistory.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between mb-1.5 px-0.5 text-[10px]">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <History className="w-3 h-3 text-amber-400" />
                          {uiText("components_crop_sidebar.span.history", "History (")}{cropHistoryIndex + 1}/{cropHistory.length})
                        </span>
                        <CustomizableButton
                          buttonId="crop_sidebar_btn_2"
                          type="button"
onClick={() => {
                            if (onOpenHistoryVisualizer) {
                              onOpenHistoryVisualizer();
                            } else {
                              setIsLocalHistoryVisualizerOpen(true);
                            }
                          }}
className="text-[9.5px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-0.5"
title={uiText("components_crop_sidebar.button.open_canvas_history_visualizer.title", "Open Canvas History Visualizer")}
                        >
                            {() => (
                                <>
                                  {uiText("components_crop_sidebar.button.view_snapshots", "View Snapshots")}
                                </>
                              )}
                        </CustomizableButton>
                      </div>

                      {/* Horizontal Mini Thumbnails Bar */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                        {cropHistory.map((thumbUrl, hIdx) => {
                          const isCurrent = hIdx === cropHistoryIndex;
                          return (
                            <CustomizableButton
                              buttonId="crop_sidebar_btn_1"
                              key={`crop-hist-thumb-${hIdx}`}
type="button"
onClick={() => {
                                if (handleJumpToCropHistoryIndex) {
                                  handleJumpToCropHistoryIndex(hIdx);
                                }
                              }}
className={cn(
                                "relative w-8 h-8 rounded border overflow-hidden shrink-0 transition-all cursor-pointer bg-black/60",
                                isCurrent
                                  ? "ring-2 ring-emerald-400 border-emerald-400 scale-105"
                                  : "border-slate-700/80 hover:border-slate-500 opacity-60 hover:opacity-100"
                              )}
title={`Jump to Snapshot #${hIdx + 1}${isCurrent ? " (Active)" : ""}`}
                            >
                                {() => (
                                    <>
                                      <img
                                src={thumbUrl}
                                alt={`Snapshot #${hIdx + 1}`}
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                                    <span className="absolute bottom-0 right-0 px-0.5 text-[7.5px] font-mono font-bold bg-black/80 text-white rounded-tl">
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
                </div>
              )}
            </div>

            {/* Dedicated Grid Mesh Tool Configuration Panel if active */}
            {isMeshToolActive && renderMeshToolConfigPanel()}
          </div>
        );

      case "multi_crops":
        return renderMultiCropsPanel();

      default:
        return null;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header with Title and Reset Layout */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
        <CustomizableLabel
          labelId="label_define_canvas_crop"
          defaultText=""
          defaultIcon={<CropIcon className="w-3.5 h-3.5" />}
          className="text-xs font-bold text-[#10b981] flex items-center gap-1.5 cursor-pointer"
        />
        <div className="flex items-center gap-1.5">
          {handleSavePresentCropStateAsDefault && (
            <CustomizableButton
              buttonId="btn_crop_set_default_state"
              defaultLabel="Set as Default"
              defaultIcon={<Bookmark className="w-3 h-3 text-amber-400" />}
              onClick={handleSavePresentCropStateAsDefault}
              className="text-[10px] text-amber-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-all px-2 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 hover:border-amber-400 shadow-sm active:scale-95"
              title="Set Present State as Persistent Default Setup for 'Define Canvas & Crop'"
            />
          )}
          {onToggleFullScreenControlPanel && (
            <CustomizableButton
              buttonId="crop_panel_fullscreen_toggle"
              defaultLabel="Full Screen"
              defaultIcon={<Maximize2 className="w-3.5 h-3.5 text-emerald-400" />}
              onClick={onToggleFullScreenControlPanel}
              className="text-[10px] text-emerald-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-all px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 hover:border-emerald-400 shadow-sm active:scale-95"
              title="Launch Full Screen Control Panel (Panel 1)"
            />
          )}
          <CustomizableButton
            buttonId="btn_crop_reset_layout"
            defaultLabel="Reset Layout"
            defaultIcon={<RotateCcw className="w-3 h-3" />}
            onClick={handleResetCropLayout}
            className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800 border border-transparent hover:border-slate-700"
            title="Reset all panels and buttons to default arrangement"
          />
        </div>
      </div>

      {/* Toast Notice */}
      <AnimatePresence>
        {cropNotice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs p-2.5 rounded-lg flex items-center gap-2 font-medium"
          >
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{cropNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draggable Panels */}
      <div className="space-y-4">
        {cropPanelsOrder.map((panelId) => renderCropPanel(panelId))}
      </div>

      {/* Canvas History Snapshots Visualizer Modal */}
      <CanvasHistoryVisualizer
        isOpen={isLocalHistoryVisualizerOpen}
        onClose={() => setIsLocalHistoryVisualizerOpen(false)}
        cropHistory={cropHistory}
        cropHistoryIndex={cropHistoryIndex}
        onJumpToSnapshot={(idx) => {
          if (handleJumpToCropHistoryIndex) {
            handleJumpToCropHistoryIndex(idx);
          }
        }}
        onUndo={handleUndoCrop}
        onRedo={handleRedoCrop}
        onRevertToOriginal={handleRevertToOriginal}
        mode="crop"
      />
    </div>
  );
};
