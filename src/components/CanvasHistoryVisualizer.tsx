import React from "react";
import {
  History,
  Undo2,
  Redo2,
  RotateCcw,
  Check,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Camera,
} from "lucide-react";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

interface CanvasHistoryVisualizerProps {
  isOpen: boolean;
  onClose: () => void;
  cropHistory: string[];
  cropHistoryIndex: number;
  onJumpToSnapshot: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onRevertToOriginal?: () => void;
  onCopySnapshotToStoryboardFirst?: (snapshotUrl: string, index: number) => void;
  mode?: "crop" | "carve" | "storyboard";
}

export const CanvasHistoryVisualizer: React.FC<CanvasHistoryVisualizerProps> = ({
  isOpen,
  onClose,
  cropHistory,
  cropHistoryIndex,
  onJumpToSnapshot,
  onUndo,
  onRedo,
  onRevertToOriginal,
  onCopySnapshotToStoryboardFirst,
  mode = "crop",
}) => {
  if (!isOpen) return null;

  const totalSnapshots = cropHistory.length;
  const currentStep = cropHistoryIndex + 1;
  const canUndo = cropHistoryIndex > 0;
  const canRedo = cropHistoryIndex >= 0 && cropHistoryIndex < totalSnapshots - 1;

  return (
    <div
      id="canvas-history-visualizer-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="canvas-history-visualizer-modal"
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CustomizableLabel
                  labelId="canvas_history_visualizer_item_10"
                  as="h3"
                  className="text-sm font-bold tracking-tight text-white"
                >
                    {() => (
                        <>
                          {uiText("components_canvas_history_visualizer.h3.canvas_undo_redo_history", "Canvas Undo / Redo History")}
                        </>
                      )}
                </CustomizableLabel>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  {totalSnapshots === 0 ? "0 snapshots" : `Step ${currentStep} of ${totalSnapshots}`}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  {mode.toUpperCase()}{uiText("components_canvas_history_visualizer.span.mode", " MODE")}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {uiText("components_canvas_history_visualizer.p.jump_directly_to_any_previous_canvas_state_s", "Jump directly to any previous canvas state snapshot or inspect edits")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <CustomizableButton
              buttonId="canvas_history_visualizer_btn_9"
              defaultIcon={<X className="w-4 h-4" />}
              id="history-visualizer-close"
type="button"
onClick={onClose}
className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
title={uiText("components_canvas_history_visualizer.button.close_history_panel_esc.title", "Close History Panel (Esc)")}
            />
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-950/40 border-b border-slate-800 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <CustomizableButton
              buttonId="canvas_history_visualizer_btn_8"
              defaultIcon={<Undo2 className="w-3.5 h-3.5" />}
              type="button"
onClick={onUndo}
disabled={!canUndo}
className={cn(
                "px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all text-xs border shadow-sm",
                canUndo
                  ? "bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 hover:border-amber-500/50 cursor-pointer"
                  : "bg-slate-900/60 text-slate-600 border-slate-800/60 cursor-not-allowed"
              )}
title={uiText("components_canvas_history_visualizer.button.single_step_undo_ctrl_z.title", "Single-step Undo (Ctrl+Z)")}
            >
                {() => (
                    <>
                      <span>{uiText("components_canvas_history_visualizer.span.step_undo", "Step Undo")}</span>
                    </>
                  )}
            </CustomizableButton>

            <CustomizableButton
              buttonId="canvas_history_visualizer_btn_7"
              defaultIcon={<Redo2 className="w-3.5 h-3.5" />}
              type="button"
onClick={onRedo}
disabled={!canRedo}
className={cn(
                "px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all text-xs border shadow-sm",
                canRedo
                  ? "bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 hover:border-amber-500/50 cursor-pointer"
                  : "bg-slate-900/60 text-slate-600 border-slate-800/60 cursor-not-allowed"
              )}
title={uiText("components_canvas_history_visualizer.button.single_step_redo_ctrl_y.title", "Single-step Redo (Ctrl+Y)")}
            >
                {() => (
                    <>
                      <span>{uiText("components_canvas_history_visualizer.span.step_redo", "Step Redo")}</span>
                    </>
                  )}
            </CustomizableButton>

            {onRevertToOriginal && (
              <CustomizableButton
                buttonId="canvas_history_visualizer_btn_6"
                defaultIcon={<RotateCcw className="w-3.5 h-3.5" />}
                type="button"
onClick={() => {
                  onRevertToOriginal();
                  onClose();
                }}
className="px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all text-xs bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 hover:border-rose-500/60 cursor-pointer"
title={uiText("components_canvas_history_visualizer.button.revert_back_to_initial_original_image.title", "Revert back to initial original image")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_canvas_history_visualizer.span.revert_to_original", "Revert to Original")}</span>
                      </>
                    )}
              </CustomizableButton>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onCopySnapshotToStoryboardFirst && cropHistoryIndex >= 0 && cropHistory[cropHistoryIndex] && (
              <CustomizableButton
                buttonId="canvas_history_visualizer_btn_5"
                defaultIcon={<Camera className="w-3.5 h-3.5 text-cyan-400" />}
                type="button"
onClick={() => {
                  onCopySnapshotToStoryboardFirst(cropHistory[cropHistoryIndex], cropHistoryIndex);
                  onClose();
                }}
className="px-2.5 py-1 text-[11px] rounded font-semibold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
title={uiText("components_canvas_history_visualizer.button.copy_current_active_snapshot_to_storyboard_f.title", "Copy current active snapshot to Storyboard first")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_canvas_history_visualizer.span.copy_current_to_storyboard_first", "Copy Current to Storyboard First")}</span>
                      </>
                    )}
              </CustomizableButton>
            )}
            <CustomizableButton
              buttonId="canvas_history_visualizer_btn_4"
              type="button"
onClick={() => onJumpToSnapshot(0)}
disabled={cropHistoryIndex === 0 || totalSnapshots <= 1}
className="px-2.5 py-1 text-[11px] rounded font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/60 cursor-pointer"
title={uiText("components_canvas_history_visualizer.button.jump_to_initial_state_1.title", "Jump to Initial State (#1)")}
            >
                {() => (
                    <>
                      {uiText("components_canvas_history_visualizer.button.jump_to_first", "Jump to First")}
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="canvas_history_visualizer_btn_3"
              type="button"
onClick={() => onJumpToSnapshot(totalSnapshots - 1)}
disabled={cropHistoryIndex === totalSnapshots - 1 || totalSnapshots <= 1}
className="px-2.5 py-1 text-[11px] rounded font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/60 cursor-pointer"
title={uiText("components_canvas_history_visualizer.button.jump_to_most_recent_edit.title", "Jump to Most Recent Edit")}
            >
                {() => (
                    <>
                      {uiText("components_canvas_history_visualizer.button.jump_to_latest", "Jump to Latest")}
                    </>
                  )}
            </CustomizableButton>
          </div>
        </div>

        {/* Snapshots Grid / Timeline */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {totalSnapshots === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="font-semibold">{uiText("components_canvas_history_visualizer.p.no_canvas_snapshots_recorded_yet", "No canvas snapshots recorded yet")}</p>
              <p className="text-[11px] text-slate-600 mt-1">
                {uiText("components_canvas_history_visualizer.p.make_crops_or_modifications_on_the_canvas_to", "Make crops or modifications on the canvas to begin capturing state history")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cropHistory.map((snapshotUrl, idx) => {
                const isCurrent = idx === cropHistoryIndex;
                const isPast = idx < cropHistoryIndex;
                const isFuture = idx > cropHistoryIndex;
                const isOriginal = idx === 0;

                return (
                  <div
                    key={`snapshot-${idx}`}
                    id={`snapshot-card-${idx}`}
                    onClick={() => onJumpToSnapshot(idx)}
                    className={cn(
                      "group relative flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none",
                      isCurrent
                        ? "bg-emerald-950/40 border-emerald-500/80 shadow-md ring-2 ring-emerald-500/30"
                        : isPast
                        ? "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                        : "bg-slate-950/40 border-slate-800/80 border-dashed hover:border-amber-500/50 hover:bg-slate-800/30 opacity-75 hover:opacity-100"
                    )}
                  >
                    {/* Thumbnail Preview */}
                    <div className="relative w-20 h-20 rounded-lg bg-black/60 border border-slate-700/60 overflow-hidden flex items-center justify-center shrink-0">
                      <img
                        src={snapshotUrl}
                        alt={`Snapshot ${idx + 1}`}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 text-[9px] font-mono font-bold text-slate-300 rounded">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Snapshot Metadata & Jump State */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-20 py-0.5">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={cn(
                              "text-xs font-bold truncate",
                              isCurrent
                                ? "text-emerald-300"
                                : isFuture
                                ? "text-amber-300"
                                : "text-slate-200"
                            )}
                          >
                            {isOriginal ? "Initial Base Canvas" : `Snapshot #${idx + 1}`}
                          </span>

                          {isCurrent && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500 text-slate-950 flex items-center gap-1 shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              {uiText("components_canvas_history_visualizer.span.active", "ACTIVE")}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          {isOriginal
                            ? "Original un-cropped loaded image"
                            : isCurrent
                            ? "Current active canvas display"
                            : isPast
                            ? "Previous edit checkpoint"
                            : "Available redo step"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                        <span className="font-mono">
                          {isPast
                            ? `${cropHistoryIndex - idx} step${cropHistoryIndex - idx > 1 ? "s" : ""} back`
                            : isFuture
                            ? `${idx - cropHistoryIndex} step${idx - cropHistoryIndex > 1 ? "s" : ""} forward`
                            : "Present"}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {onCopySnapshotToStoryboardFirst && (
                            <CustomizableButton
                              buttonId="canvas_history_visualizer_btn_2"
                              defaultIcon={<Camera className="w-2.5 h-2.5 text-emerald-400" />}
                              type="button"
onClick={(e) => {
                                e.stopPropagation();
                                onCopySnapshotToStoryboardFirst(snapshotUrl, idx);
                              }}
className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-105"
title={uiText("components_canvas_history_visualizer.button.copy_this_snapshot_reflecting_canvas_appeara.title", "Copy this snapshot reflecting canvas appearance to Storyboard first")}
                            >
                                {() => (
                                    <>
                                      <span>{uiText("components_canvas_history_visualizer.span.storyboard_first", "Storyboard First")}</span>
                                    </>
                                  )}
                            </CustomizableButton>
                          )}
                          <span
                            className={cn(
                              "font-semibold transition-colors flex items-center gap-0.5",
                              isCurrent
                                ? "text-emerald-400"
                                : "text-slate-400 group-hover:text-emerald-400"
                            )}
                          >
                            {isCurrent ? "Current" : "Jump"}
                            {!isCurrent && <ChevronRight className="w-2.5 h-2.5" />}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>{uiText("components_canvas_history_visualizer.span.click_any_snapshot_card_above_to_jump_your_c", "Click any snapshot card above to jump your canvas directly to that state.")}</span>
          </div>
          <CustomizableButton
            buttonId="canvas_history_visualizer_btn_1"
            type="button"
onClick={onClose}
className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors cursor-pointer"
          >
              {() => (
                  <>
                    {uiText("components_canvas_history_visualizer.button.done", "Done")}
                  </>
                )}
          </CustomizableButton>
        </div>
      </div>
    </div>
  );
};
