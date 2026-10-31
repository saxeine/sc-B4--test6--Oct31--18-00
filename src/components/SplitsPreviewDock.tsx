import React, { useState } from "react";
import {
  Grid,
  Columns3,
  Rows3,
  X,
  CheckSquare,
  Square,
  SquareArrowRight,
  Download,
  CheckCircle2,
  Maximize2,
  Sparkles,
  SlidersHorizontal,
  Camera,
} from "lucide-react";
import { cn } from "../utils/cn";
import { CustomizableButton } from "./CustomizableButton";
import { getSegmentPresetLabel, type GridLabelPreset } from "../utils/gridLabelPresets";
import { uiText } from "../hooks/useUIConfig";

export interface GridSegmentData {
  r: number;
  c: number;
  seq: number;
  topPercent: number;
  leftPercent: number;
  widthPercent: number;
  heightPercent: number;
  widthPx: number;
  heightPx: number;
}

export interface SplitsPreviewDockProps {
  gridSegments: GridSegmentData[];
  selectedSplitIndices: Set<number>;
  toggleSplitIndex: (seq: number) => void;
  toggleSelectAllSplits: (total: number) => void;
  imageSrc: string;
  orientation: "horizontal" | "vertical";
  onToggleOrientation: () => void;
  onClose: () => void;
  onSendToStoryboard: (onlySelected?: boolean) => void;
  onDownloadZip: (onlySelected?: boolean) => void;
  onOpenRenameStudio?: () => void;
  onCopySnapshotFirst?: () => void;
  copySnapshotFirst?: boolean;
  onToggleCopySnapshotFirst?: (val: boolean) => void;
  gridLabelPreset: GridLabelPreset;
  customGridLabelPrefix: string;
  splitPreviewSize: "small" | "medium" | "large";
  setSplitPreviewSize: React.Dispatch<React.SetStateAction<"small" | "medium" | "large">>;
  isProcessing?: boolean;
}

export const SplitsPreviewDock: React.FC<SplitsPreviewDockProps> = ({
  gridSegments,
  selectedSplitIndices,
  toggleSplitIndex,
  toggleSelectAllSplits,
  imageSrc,
  orientation,
  onToggleOrientation,
  onClose,
  onSendToStoryboard,
  onDownloadZip,
  onOpenRenameStudio,
  onCopySnapshotFirst,
  copySnapshotFirst = true,
  onToggleCopySnapshotFirst,
  gridLabelPreset,
  customGridLabelPrefix,
  splitPreviewSize,
  setSplitPreviewSize,
  isProcessing = false,
}) => {
  const isAllSelected =
    gridSegments.length > 0 && selectedSplitIndices.size === gridSegments.length;
  const hasSelection = selectedSplitIndices.size > 0;

  // Render a single slice preview card
  const renderSliceCard = (seg: GridSegmentData, isCompact = false) => {
    const isSelected = selectedSplitIndices.has(seg.seq);
    const displayLabel = getSegmentPresetLabel(
      gridLabelPreset,
      { r: seg.r, c: seg.c, seq: seg.seq },
      customGridLabelPrefix
    );

    const sizeClasses = {
      small: isCompact ? "w-16 h-16" : "h-24",
      medium: isCompact ? "w-24 h-24" : "h-32",
      large: isCompact ? "w-32 h-32" : "h-40",
    }[splitPreviewSize];

    return (
      <div
        key={`dock-slice-${seg.r}-${seg.c}-${seg.seq}`}
        onClick={() => toggleSplitIndex(seg.seq)}
        className={cn(
          "group relative rounded-xl overflow-hidden cursor-pointer select-none transition-all duration-150 border flex flex-col justify-between shrink-0",
          isSelected
            ? "border-[#10b981] ring-2 ring-[#10b981]/50 bg-emerald-950/40 shadow-lg shadow-emerald-950/60 scale-[1.02]"
            : "border-[#1e293b] hover:border-slate-600 bg-[#020617] hover:scale-[1.01]",
          sizeClasses
        )}
        style={{
          aspectRatio: isCompact ? undefined : `${seg.widthPx} / ${seg.heightPx}`,
        }}
        title={`Slice ${displayLabel} (${seg.widthPx} × ${seg.heightPx} px) — Click to select/deselect`}
      >
        {/* Optical Segment Viewport Preview (Direct Scaled Image Clip) */}
        <div className="absolute inset-0 overflow-hidden bg-slate-950">
          {imageSrc && (
            <img
              src={imageSrc}
              alt={`Slice ${displayLabel}`}
              className="absolute max-w-none pointer-events-none select-none"
              style={{
                width: `${(100 / seg.widthPercent) * 100}%`,
                height: `${(100 / seg.heightPercent) * 100}%`,
                top: `-${(seg.topPercent / seg.heightPercent) * 100}%`,
                left: `-${(seg.leftPercent / seg.widthPercent) * 100}%`,
                objectFit: "fill",
              }}
            />
          )}
        </div>

        {/* Top Header Overlay: Preset Label Badge & Selection Indicator */}
        <div className="relative z-10 p-1 flex items-center justify-between pointer-events-none">
          <span
            className={cn(
              "font-mono font-black text-[10px] px-1.5 py-0.5 rounded shadow-md backdrop-blur-md border",
              isSelected
                ? "bg-[#10b981] text-slate-950 border-emerald-300"
                : "bg-slate-950/85 text-emerald-400 border-slate-700/80 group-hover:text-emerald-300"
            )}
          >
            {displayLabel}
          </span>

          <div
            className={cn(
              "w-4 h-4 rounded flex items-center justify-center transition-colors shadow-sm",
              isSelected
                ? "bg-[#10b981] text-slate-950"
                : "bg-black/60 text-slate-400 group-hover:text-slate-200"
            )}
          >
            {isSelected ? (
              <CheckSquare className="w-3.5 h-3.5" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </div>
        </div>

        {/* Bottom Dimension Badge */}
        <div className="relative z-10 p-1 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] font-mono font-bold bg-slate-950/90 text-slate-300 px-1 py-0.5 rounded border border-slate-800 shadow-md">
            {seg.widthPx}×{seg.heightPx}
          </span>
        </div>
      </div>
    );
  };

  if (orientation === "vertical") {
    return (
      <aside
        id="live_splits_vertical_sidebar"
        className="w-72 lg:w-80 bg-[#090e1a]/95 border-l border-[#1e293b] flex flex-col shrink-0 overflow-hidden shadow-2xl backdrop-blur-md z-20 animate-in slide-in-from-right-4 duration-200 select-none"
      >
        {/* Top Header */}
        <div className="px-3.5 py-2.5 border-b border-[#1e293b] flex items-center justify-between shrink-0 bg-[#0b1329]">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-[#10b981]" />
            <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              {uiText("components_splits_preview_dock.span.splits_preview", "Splits Preview")}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#10b981] bg-[#10b981]/15 px-1.5 py-0.5 rounded-full border border-[#10b981]/30">
              {gridSegments.length}{uiText("components_splits_preview_dock.span.cuts", " Cuts")}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <CustomizableButton
              buttonId="splits_preview_dock_btn_14"
              defaultIcon={<Rows3 className="w-3.5 h-3.5" />}
              type="button"
onClick={onToggleOrientation}
className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-[#10b981] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-700"
title={uiText("components_splits_preview_dock.button.switch_to_horizontal_bottom_dock_layout.title", "Switch to Horizontal (Bottom) Dock Layout")}
            />
            <CustomizableButton
              buttonId="splits_preview_dock_btn_13"
              defaultIcon={<X className="w-3.5 h-3.5" />}
              type="button"
onClick={onClose}
className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
title={uiText("components_splits_preview_dock.button.close_live_splits_preview_dock.title", "Close Live Splits Preview Dock")}
            />
          </div>
        </div>

        {/* Action Controls & Thumbnail Sizing Bar */}
        <div className="p-2.5 border-b border-[#1e293b] bg-[#020617]/70 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <CustomizableButton
              buttonId="splits_preview_dock_btn_12"
              type="button"
onClick={() => toggleSelectAllSplits(gridSegments.length)}
className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer",
                isAllSelected
                  ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
              )}
            >
                {() => (
                    <>
                      {isAllSelected ? (
                <CheckSquare className="w-3 h-3 text-[#10b981]" />
              ) : (
                <Square className="w-3 h-3 text-slate-400" />
              )}
                    <span>{isAllSelected ? "Deselect All" : "Select All"}</span>
                    </>
                  )}
            </CustomizableButton>

            <div className="flex items-center gap-1 bg-[#020617] p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
              {(["small", "medium", "large"] as const).map((sz) => (
                <CustomizableButton
                  buttonId="splits_preview_dock_btn_11"
                  key={sz}
type="button"
onClick={() => setSplitPreviewSize(sz)}
className={cn(
                    "px-1.5 py-0.5 rounded capitalize transition-all cursor-pointer",
                    splitPreviewSize === sz
                      ? "bg-[#10b981] text-slate-950 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                    {() => (
                        <>
                          {sz[0].toUpperCase()}
                        </>
                      )}
                </CustomizableButton>
              ))}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="space-y-1.5 pt-0.5">
            {onCopySnapshotFirst && (
              <CustomizableButton
                buttonId="splits_preview_dock_btn_10"
                defaultIcon={<Camera className="w-3.5 h-3.5 text-cyan-200 shrink-0" />}
                type="button"
onClick={onCopySnapshotFirst}
disabled={isProcessing}
className="w-full py-1.5 px-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm border border-cyan-500/50 cursor-pointer"
title={uiText("components_splits_preview_dock.button.capture_snapshot_reflecting_exact_live_canva.title", "Capture snapshot reflecting exact live canvas appearance and copy to Storyboard first")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_splits_preview_dock.span.canvas_snapshot_to_storyboard_first", "Canvas Snapshot to Storyboard First")}</span>
                      </>
                    )}
              </CustomizableButton>
            )}

            <div className="grid grid-cols-2 gap-1.5">
              <CustomizableButton
                buttonId="splits_preview_dock_btn_9"
                defaultIcon={<CheckCircle2 className="w-3 h-3 shrink-0" />}
                type="button"
onClick={() => onSendToStoryboard(hasSelection)}
disabled={isProcessing || gridSegments.length === 0}
className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
title={
                  hasSelection
                    ? `Send ${selectedSplitIndices.size} selected slice(s) to Storyboard (with Live Canvas Snapshot first)`
                    : "Send all carved slices to Storyboard (with Live Canvas Snapshot first)"
                }
              >
                  {() => (
                      <>
                        <span>{hasSelection ? `Send (${selectedSplitIndices.size})` : "Send All"}</span>
                      </>
                    )}
              </CustomizableButton>

              <CustomizableButton
                buttonId="splits_preview_dock_btn_8"
                defaultIcon={<Download className="w-3 h-3 text-[#10b981] shrink-0" />}
                type="button"
onClick={() => onDownloadZip(hasSelection)}
disabled={isProcessing || gridSegments.length === 0}
className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-[10px] font-bold border border-slate-700 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
title={
                  hasSelection
                    ? `Download ${selectedSplitIndices.size} selected slice(s) ZIP`
                    : "Download all carved slices as ZIP"
                }
              >
                  {() => (
                      <>
                        <span>{hasSelection ? `ZIP (${selectedSplitIndices.size})` : "ZIP All"}</span>
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>
        </div>

        {/* Scrollable Slices Grid */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {gridSegments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-slate-500 text-xs">
              <Grid className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
              <p>{uiText("components_splits_preview_dock.p.no_grid_cuts_yet", "No grid cuts yet.")}</p>
              <p className="text-[10px] text-slate-600 mt-1">
                {uiText("components_splits_preview_dock.p.adjust_rows_and_columns_in_the_canvas_to_see", "Adjust rows and columns in the canvas to see live splits.")}
              </p>
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-2",
                splitPreviewSize === "small"
                  ? "grid-cols-3"
                  : splitPreviewSize === "large"
                  ? "grid-cols-1"
                  : "grid-cols-2"
              )}
            >
              {gridSegments.map((seg) => renderSliceCard(seg, false))}
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="p-2 border-t border-[#1e293b] bg-[#020617] text-[10px] text-slate-400 flex items-center justify-between shrink-0">
          <span>
            {hasSelection
              ? `${selectedSplitIndices.size} of ${gridSegments.length} selected`
              : `${gridSegments.length} total slices`}
          </span>
          <span className="font-mono text-emerald-400 font-semibold">{uiText("components_splits_preview_dock.span.live_live_sync", "Live Live-Sync")}</span>
        </div>
      </aside>
    );
  }

  // Horizontal (Bottom) Dock
  return (
    <div
      id="live_splits_horizontal_dock"
      className="w-full bg-[#090e1a]/95 border-t border-[#1e293b] flex flex-col shrink-0 shadow-2xl backdrop-blur-md z-20 animate-in slide-in-from-bottom-4 duration-200 select-none"
    >
      {/* Top Header of Horizontal Dock */}
      <div className="px-4 py-1.5 border-b border-[#1e293b] flex items-center justify-between shrink-0 bg-[#0b1329] text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Grid className="w-3.5 h-3.5 text-[#10b981]" />
            <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">
              {uiText("components_splits_preview_dock.span.live_splits_dock", "Live Splits Dock")}
            </span>
          </div>

          <span className="text-[10px] font-mono font-bold text-[#10b981] bg-[#10b981]/15 px-1.5 py-0.5 rounded-full border border-[#10b981]/30">
            {gridSegments.length}{uiText("components_splits_preview_dock.span.cuts_2", " Cuts")}
          </span>

          <span className="text-[10px] text-slate-400 hidden sm:inline">
            {hasSelection ? `${selectedSplitIndices.size} selected` : "Click cards to select"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Action buttons */}
          <CustomizableButton
            buttonId="splits_preview_dock_btn_7"
            type="button"
onClick={() => toggleSelectAllSplits(gridSegments.length)}
className={cn(
              "px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer",
              isAllSelected
                ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
            )}
          >
              {() => (
                  <>
                    {isAllSelected ? (
              <CheckSquare className="w-3 h-3 text-[#10b981]" />
            ) : (
              <Square className="w-3 h-3 text-slate-400" />
            )}
                  <span>{isAllSelected ? "Deselect" : "Select All"}</span>
                  </>
                )}
          </CustomizableButton>

          {onCopySnapshotFirst && (
            <CustomizableButton
              buttonId="splits_preview_dock_btn_6"
              defaultIcon={<Camera className="w-3 h-3 text-cyan-200" />}
              type="button"
onClick={onCopySnapshotFirst}
disabled={isProcessing}
className="py-1 px-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm border border-cyan-500/40"
title={uiText("components_splits_preview_dock.button.capture_snapshot_reflecting_exact_live_canva.title_2", "Capture snapshot reflecting exact live canvas appearance and copy to Storyboard first")}
            >
                {() => (
                    <>
                      <span>{uiText("components_splits_preview_dock.span.snapshot_first", "Snapshot First")}</span>
                    </>
                  )}
            </CustomizableButton>
          )}

          <CustomizableButton
            buttonId="splits_preview_dock_btn_5"
            defaultIcon={<CheckCircle2 className="w-3 h-3" />}
            type="button"
onClick={() => onSendToStoryboard(hasSelection)}
disabled={isProcessing || gridSegments.length === 0}
className="py-1 px-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
title={
              hasSelection
                ? `Send ${selectedSplitIndices.size} selected slice(s) to Storyboard (with Live Canvas Snapshot first)`
                : "Send all carved slices to Storyboard (with Live Canvas Snapshot first)"
            }
          >
              {() => (
                  <>
                    <span>{hasSelection ? `Send (${selectedSplitIndices.size})` : "Send All"}</span>
                  </>
                )}
          </CustomizableButton>

          <CustomizableButton
            buttonId="splits_preview_dock_btn_4"
            defaultIcon={<Download className="w-3 h-3 text-[#10b981]" />}
            type="button"
onClick={() => onDownloadZip(hasSelection)}
disabled={isProcessing || gridSegments.length === 0}
className="py-1 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-[10px] font-bold border border-slate-700 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
title={
              hasSelection
                ? `Download ${selectedSplitIndices.size} selected slice(s) ZIP`
                : "Download all carved slices as ZIP"
            }
          >
              {() => (
                  <>
                    <span>{uiText("components_splits_preview_dock.span.zip", "ZIP")}</span>
                  </>
                )}
          </CustomizableButton>

          {/* S/M/L Size toggles */}
          <div className="flex items-center gap-0.5 bg-[#020617] p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
            {(["small", "medium", "large"] as const).map((sz) => (
              <CustomizableButton
                buttonId="splits_preview_dock_btn_3"
                key={sz}
type="button"
onClick={() => setSplitPreviewSize(sz)}
className={cn(
                  "px-1.5 py-0.5 rounded capitalize transition-all cursor-pointer",
                  splitPreviewSize === sz
                    ? "bg-[#10b981] text-slate-950 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                  {() => (
                      <>
                        {sz[0].toUpperCase()}
                      </>
                    )}
              </CustomizableButton>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          {/* Switch to Vertical Sidebar Dock */}
          <CustomizableButton
            buttonId="splits_preview_dock_btn_2"
            defaultIcon={<Columns3 className="w-3.5 h-3.5" />}
            type="button"
onClick={onToggleOrientation}
className="p-1 hover:bg-slate-800 text-slate-400 hover:text-[#10b981] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-700 flex items-center gap-1 text-[10px] font-semibold"
title={uiText("components_splits_preview_dock.button.switch_to_vertical_sidebar_dock_layout.title", "Switch to Vertical (Sidebar) Dock Layout")}
          >
              {() => (
                  <>
                    <span className="hidden sm:inline">{uiText("components_splits_preview_dock.span.vertical_sidebar", "Vertical Sidebar")}</span>
                  </>
                )}
          </CustomizableButton>

          <CustomizableButton
            buttonId="splits_preview_dock_btn_1"
            defaultIcon={<X className="w-3.5 h-3.5" />}
            type="button"
onClick={onClose}
className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
title={uiText("components_splits_preview_dock.button.close_live_splits_preview_dock.title_2", "Close Live Splits Preview Dock")}
          />
        </div>
      </div>

      {/* Horizontal Scrolling Strip of Slice Cards */}
      <div className="overflow-x-auto p-2.5 flex items-center gap-2 min-h-[96px]">
        {gridSegments.length === 0 ? (
          <div className="flex items-center justify-center w-full py-4 text-xs text-slate-500">
            {uiText("components_splits_preview_dock.div.no_grid_cuts_active", "No grid cuts active.")}
          </div>
        ) : (
          gridSegments.map((seg) => renderSliceCard(seg, false))
        )}
      </div>
    </div>
  );
};
