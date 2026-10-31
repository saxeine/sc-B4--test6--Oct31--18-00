import React, { useState, useMemo } from "react";
import {
  X,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Scissors,
  Grid3x3,
  MessageSquare,
  Ruler,
  Maximize2,
  Trash2,
  Copy,
  Plus,
  Download,
  Tag,
  Film,
  Play,
  FileText,
  RefreshCw,
  Layers,
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Sparkles,
  Check,
  RotateCcw,
  Lock,
  Unlock,
  Palette,
  Bookmark,
} from "lucide-react";
import JSZip from "jszip";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export interface StoryboardSlotItem {
  url: string | null;
  name: string;
  story: string;
  title?: string;
}

export const DARK_STRIP_PRESETS = [
  { color: "#000000", label: "Pure Black (Default)" },
  { color: "#050505", label: "Jet Black" },
  { color: "#0a0a0a", label: "Dark Charcoal" },
  { color: "#020617", label: "Slate 950" },
  { color: "#070d1e", label: "Midnight Navy" },
  { color: "#0f172a", label: "Slate 900" },
  { color: "#18181b", label: "Zinc 900" },
];

export interface StoryboardOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: StoryboardSlotItem[];
  selectedIndices: Set<number>;
  onUpdateSelectedIndices: (newSet: Set<number>) => void;
  onUpdateSlots: (newSlots: StoryboardSlotItem[]) => void;
  onSendToCrop?: (url: string, index: number) => void;
  onSendToCarve?: (url: string, name?: string) => void;
  onSendToNeo1?: (index: number, url?: string, name?: string) => void;
  onSendToBubba1?: (index: number, url?: string, name?: string) => void;
  onSendToShapeStudio?: (index: number) => void;
  onSendToPlayer?: () => void;
  onSendToAniComper4?: () => void;
  onSendToRenameStudio?: () => void;
  onSendToScreenplay?: () => void;
  isStoryboardLocked?: boolean;
  onToggleStoryboardLock?: () => void;
  stripPanelBackground?: string;
  onUpdateStripPanelBackground?: (color: string) => void;
  onSaveDefaultState?: () => void;
  onRestoreDefaultState?: () => void;
  onClearDefaultState?: () => void;
  savedDefaultInfo?: {
    savedAt: string;
    slotsCount: number;
    slicesCount: number;
    layout: string;
    cellMode: string;
  } | null;
}

export const StoryboardOperationsModal: React.FC<StoryboardOperationsModalProps> = ({
  isOpen,
  onClose,
  slots,
  selectedIndices,
  onUpdateSelectedIndices,
  onUpdateSlots,
  onSendToCrop,
  onSendToCarve,
  onSendToNeo1,
  onSendToBubba1,
  onSendToShapeStudio,
  onSendToPlayer,
  onSendToAniComper4,
  onSendToRenameStudio,
  onSendToScreenplay,
  isStoryboardLocked = false,
  onToggleStoryboardLock,
  stripPanelBackground = "#000000",
  onUpdateStripPanelBackground,
  onSaveDefaultState,
  onRestoreDefaultState,
  onClearDefaultState,
  savedDefaultInfo,
}) => {
  const [activeTab, setActiveTab] = useState<"select" | "move" | "tools" | "delete" | "board">("select");
  const [shiftAmount, setShiftAmount] = useState<number>(1);
  const [insertBlankCount, setInsertBlankCount] = useState<number>(1);
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(Math.min(9, slots.length || 9));
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const showFeedback = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => {
      setFeedbackNotice((curr) => (curr === msg ? null : curr));
    }, 2500);
  };

  const selectedCount = selectedIndices.size;
  const filledSelectedSlots = useMemo(() => {
    return Array.from(selectedIndices)
      .sort((a, b) => a - b)
      .map((idx) => ({ slot: slots[idx], index: idx }))
      .filter((item) => item.slot && item.slot.url);
  }, [selectedIndices, slots]);

  const currentStripColor = stripPanelBackground || "#000000";

  const handleCycleStripColor = () => {
    if (!onUpdateStripPanelBackground) return;
    const colors = DARK_STRIP_PRESETS.map((p) => p.color);
    const currIdx = colors.indexOf(currentStripColor.toLowerCase());
    const nextColor = colors[(currIdx + 1) % colors.length];
    onUpdateStripPanelBackground(nextColor);
    showFeedback(`Strip background color set to ${nextColor}`);
  };

  if (!isOpen) return null;

  // --- SELECTION HELPERS ---
  const handleSelectAll = () => {
    const all = new Set<number>(slots.map((_, i) => i));
    onUpdateSelectedIndices(all);
    showFeedback(`Selected all ${slots.length} slots`);
  };

  const handleSelectFilled = () => {
    const filled = new Set<number>();
    slots.forEach((s, i) => {
      if (s.url) filled.add(i);
    });
    onUpdateSelectedIndices(filled);
    showFeedback(`Selected ${filled.size} filled slots`);
  };

  const handleSelectEmpty = () => {
    const empty = new Set<number>();
    slots.forEach((s, i) => {
      if (!s.url) empty.add(i);
    });
    onUpdateSelectedIndices(empty);
    showFeedback(`Selected ${empty.size} empty slots`);
  };

  const handleInvertSelection = () => {
    const inverted = new Set<number>();
    slots.forEach((_, i) => {
      if (!selectedIndices.has(i)) inverted.add(i);
    });
    onUpdateSelectedIndices(inverted);
    showFeedback(`Inverted selection (${inverted.size} selected)`);
  };

  const handleClearSelection = () => {
    onUpdateSelectedIndices(new Set());
    showFeedback("Cleared selection");
  };

  const handleSelectEven = () => {
    const even = new Set<number>();
    slots.forEach((_, i) => {
      if ((i + 1) % 2 === 0) even.add(i);
    });
    onUpdateSelectedIndices(even);
    showFeedback(`Selected ${even.size} even slots`);
  };

  const handleSelectOdd = () => {
    const odd = new Set<number>();
    slots.forEach((_, i) => {
      if ((i + 1) % 2 !== 0) odd.add(i);
    });
    onUpdateSelectedIndices(odd);
    showFeedback(`Selected ${odd.size} odd slots`);
  };

  const handleSelectRange = () => {
    const start = Math.max(0, Math.min(slots.length - 1, rangeStart - 1));
    const end = Math.max(0, Math.min(slots.length - 1, rangeEnd - 1));
    const min = Math.min(start, end);
    const max = Math.max(start, end);
    const rangeSet = new Set<number>();
    for (let i = min; i <= max; i++) {
      rangeSet.add(i);
    }
    onUpdateSelectedIndices(rangeSet);
    showFeedback(`Selected slots #${min + 1} to #${max + 1}`);
  };

  // --- MOVE / SHIFT HELPERS ---
  const handleShiftPositions = (direction: "left" | "right") => {
    if (selectedIndices.size === 0 || slots.length <= 1) return;
    const amount = Math.max(1, Math.min(slots.length - 1, shiftAmount));
    let curSlots = [...slots];
    let curSelected = new Set(selectedIndices);
    const n = curSlots.length;

    for (let step = 0; step < amount; step++) {
      if (direction === "right") {
        for (let i = n - 2; i >= 0; i--) {
          if (curSelected.has(i) && !curSelected.has(i + 1)) {
            const temp = curSlots[i];
            curSlots[i] = curSlots[i + 1];
            curSlots[i + 1] = temp;
            curSelected.delete(i);
            curSelected.add(i + 1);
          }
        }
      } else {
        for (let i = 1; i < n; i++) {
          if (curSelected.has(i) && !curSelected.has(i - 1)) {
            const temp = curSlots[i];
            curSlots[i] = curSlots[i - 1];
            curSlots[i - 1] = temp;
            curSelected.delete(i);
            curSelected.add(i - 1);
          }
        }
      }
    }

    onUpdateSlots(curSlots);
    onUpdateSelectedIndices(curSelected);
    showFeedback(
      `Shifted ${selectedIndices.size} slots ${direction === "left" ? "backward" : "forward"} by ${amount} position${amount > 1 ? "s" : ""}`
    );
  };

  const handleMoveToStart = () => {
    if (selectedIndices.size === 0 || slots.length <= 1) return;
    const selected: StoryboardSlotItem[] = [];
    const unselected: StoryboardSlotItem[] = [];
    slots.forEach((s, i) => {
      if (selectedIndices.has(i)) selected.push(s);
      else unselected.push(s);
    });
    const newSlots = [...selected, ...unselected];
    const newSelected = new Set<number>(selected.map((_, i) => i));
    onUpdateSlots(newSlots);
    onUpdateSelectedIndices(newSelected);
    showFeedback(`Moved ${selected.length} slots to start`);
  };

  const handleMoveToEnd = () => {
    if (selectedIndices.size === 0 || slots.length <= 1) return;
    const selected: StoryboardSlotItem[] = [];
    const unselected: StoryboardSlotItem[] = [];
    slots.forEach((s, i) => {
      if (selectedIndices.has(i)) selected.push(s);
      else unselected.push(s);
    });
    const newSlots = [...unselected, ...selected];
    const startIdx = unselected.length;
    const newSelected = new Set<number>(selected.map((_, i) => startIdx + i));
    onUpdateSlots(newSlots);
    onUpdateSelectedIndices(newSelected);
    showFeedback(`Moved ${selected.length} slots to end`);
  };

  const handleReverseSelected = () => {
    if (selectedIndices.size <= 1) {
      // If 0 or 1 slot is selected, reverse all slots
      const allIndices = new Set<number>(slots.map((_, i) => i));
      onUpdateSelectedIndices(allIndices);
      onUpdateSlots([...slots].reverse());
      showFeedback(`Reversed order of all ${slots.length} storyboard frames`);
      return;
    }
    const sortedIndices = Array.from(selectedIndices).sort((a, b) => a - b);
    const reversedSlots = sortedIndices.map((i) => slots[i]).reverse();
    const nextSlots = [...slots];
    sortedIndices.forEach((origIdx, i) => {
      nextSlots[origIdx] = reversedSlots[i];
    });
    onUpdateSlots(nextSlots);
    showFeedback(`Reversed order of ${sortedIndices.length} selected slots`);
  };

  const handleSelectAndReverseAll = () => {
    const allIndices = new Set<number>(slots.map((_, i) => i));
    onUpdateSelectedIndices(allIndices);
    onUpdateSlots([...slots].reverse());
    showFeedback(`Selected and reversed order of all ${slots.length} storyboard frames`);
  };

  const handleSelectFilledAndReverse = () => {
    const filledIndices = slots
      .map((s, i) => (s.url ? i : -1))
      .filter((i) => i !== -1);
    if (filledIndices.length <= 1) {
      showFeedback("Need at least 2 filled slots to reverse");
      return;
    }
    const filledSet = new Set<number>(filledIndices);
    onUpdateSelectedIndices(filledSet);
    const sortedIndices = [...filledIndices];
    const reversedSlots = sortedIndices.map((i) => slots[i]).reverse();
    const nextSlots = [...slots];
    sortedIndices.forEach((origIdx, i) => {
      nextSlots[origIdx] = reversedSlots[i];
    });
    onUpdateSlots(nextSlots);
    showFeedback(`Selected and reversed ${sortedIndices.length} filled storyboard frames`);
  };

  const handleSelectRangeAndReverse = () => {
    const start = Math.max(0, Math.min(rangeStart - 1, slots.length - 1));
    const end = Math.max(0, Math.min(rangeEnd - 1, slots.length - 1));
    const low = Math.min(start, end);
    const high = Math.max(start, end);

    if (high <= low) {
      showFeedback("Range must span at least 2 slots to reverse");
      return;
    }

    const rangeIndices: number[] = [];
    for (let i = low; i <= high; i++) {
      rangeIndices.push(i);
    }

    const rangeSet = new Set<number>(rangeIndices);
    onUpdateSelectedIndices(rangeSet);

    const reversedSlots = rangeIndices.map((i) => slots[i]).reverse();
    const nextSlots = [...slots];
    rangeIndices.forEach((origIdx, i) => {
      nextSlots[origIdx] = reversedSlots[i];
    });

    onUpdateSlots(nextSlots);
    showFeedback(`Selected & reversed slots #${low + 1} to #${high + 1}`);
  };

  const handleDuplicateSelected = () => {
    if (selectedIndices.size === 0) {
      // Duplicate all filled frames if none selected
      handleDuplicateAllFilled();
      return;
    }
    const sortedIndices = Array.from(selectedIndices).sort((a, b) => a - b);
    const nextSlots: StoryboardSlotItem[] = [];
    const newSelectedIndices = new Set<number>();

    slots.forEach((slot, i) => {
      nextSlots.push(slot);
      if (selectedIndices.has(i)) {
        const copy: StoryboardSlotItem = {
          ...slot,
          name: slot.name ? `${slot.name} (Copy)` : "Copy",
        };
        nextSlots.push(copy);
        newSelectedIndices.add(nextSlots.length - 1);
      }
    });

    onUpdateSlots(nextSlots);
    onUpdateSelectedIndices(newSelectedIndices);
    showFeedback(`Duplicated ${sortedIndices.length} frame(s) in storyboard`);
  };

  const handleDuplicateAllFilled = () => {
    const filledCount = slots.filter((s) => s.url).length;
    if (filledCount === 0) {
      showFeedback("No filled slots to duplicate");
      return;
    }
    const nextSlots: StoryboardSlotItem[] = [];
    const newSelectedIndices = new Set<number>();

    slots.forEach((slot) => {
      nextSlots.push(slot);
      if (slot.url) {
        const copy: StoryboardSlotItem = {
          ...slot,
          name: slot.name ? `${slot.name} (Copy)` : "Copy",
        };
        nextSlots.push(copy);
        newSelectedIndices.add(nextSlots.length - 1);
      }
    });

    onUpdateSlots(nextSlots);
    onUpdateSelectedIndices(newSelectedIndices);
    showFeedback(`Duplicated all ${filledCount} filled frame(s) in storyboard`);
  };

  const handleDuplicateAndReverse = () => {
    let targetIndices = Array.from(selectedIndices).sort((a, b) => a - b);
    if (targetIndices.length === 0) {
      targetIndices = slots
        .map((s, i) => (s.url ? i : -1))
        .filter((i) => i !== -1);
    }
    if (targetIndices.length === 0) {
      showFeedback("No slots to duplicate & reverse");
      return;
    }

    const duplicates = targetIndices
      .map((i) => slots[i])
      .reverse()
      .map((slot) => ({
        ...slot,
        name: slot.name ? `${slot.name} (Loop)` : "Loop",
        title: slot.title ? `${slot.title} (Loop)` : undefined,
      }));

    const nextSlots = [...slots, ...duplicates];
    const newSelected = new Set<number>();
    for (let i = slots.length; i < nextSlots.length; i++) {
      newSelected.add(i);
    }

    onUpdateSlots(nextSlots);
    onUpdateSelectedIndices(newSelected);
    showFeedback(`Duplicated ${duplicates.length} frame(s) in reverse order (Ping-Pong Loop)`);
  };

  const handleInsertBlanks = (position: "before" | "after") => {
    const count = Math.max(1, Math.min(20, insertBlankCount));
    const blanks: StoryboardSlotItem[] = Array.from({ length: count }, () => ({
      url: null,
      name: "",
      story: "",
    }));

    if (selectedIndices.size === 0) {
      onUpdateSlots([...slots, ...blanks]);
      showFeedback(`Appended ${count} blank slot(s)`);
      return;
    }

    const sortedIndices = Array.from(selectedIndices).sort((a, b) => a - b);
    const targetIdx = position === "before" ? sortedIndices[0] : sortedIndices[sortedIndices.length - 1] + 1;
    const nextSlots = [...slots.slice(0, targetIdx), ...blanks, ...slots.slice(targetIdx)];
    const newSelected = new Set<number>();
    for (let i = 0; i < count; i++) {
      newSelected.add(targetIdx + i);
    }
    onUpdateSlots(nextSlots);
    onUpdateSelectedIndices(newSelected);
    showFeedback(`Inserted ${count} blank slot(s) ${position} selection`);
  };

  // --- DELETE & CLEAR HELPERS ---
  const handleDeleteSelected = () => {
    if (selectedIndices.size === 0) return;
    const remaining = slots.filter((_, i) => !selectedIndices.has(i));
    const finalSlots =
      remaining.length > 0
        ? remaining
        : Array.from({ length: 9 }, () => ({ url: null, name: "", story: "" }));
    onUpdateSlots(finalSlots);
    onUpdateSelectedIndices(new Set());
    showFeedback(`Deleted ${selectedIndices.size} slot(s)`);
  };

  const handleClearSelectedContent = () => {
    if (selectedIndices.size === 0) return;
    const nextSlots = slots.map((s, i) => {
      if (selectedIndices.has(i)) {
        return { url: null, name: "", story: "" };
      }
      return s;
    });
    onUpdateSlots(nextSlots);
    showFeedback(`Cleared contents of ${selectedIndices.size} slot(s)`);
  };

  const handleDeleteEmptySlots = () => {
    const filled = slots.filter((s) => Boolean(s.url));
    const finalSlots =
      filled.length > 0
        ? filled
        : Array.from({ length: 9 }, () => ({ url: null, name: "", story: "" }));
    onUpdateSlots(finalSlots);
    onUpdateSelectedIndices(new Set());
    showFeedback(`Deleted ${slots.length - filled.length} empty slot(s)`);
  };

  const handleResetTo9Defaults = () => {
    onUpdateSlots(Array.from({ length: 9 }, () => ({ url: null, name: "", story: "" })));
    onUpdateSelectedIndices(new Set());
    showFeedback("Reset storyboard to 9 empty slots");
  };

  // --- DOWNLOAD AS ZIP ---
  const handleDownloadZip = async () => {
    if (filledSelectedSlots.length === 0) {
      showFeedback("No filled slots selected to download");
      return;
    }
    try {
      setIsZipping(true);
      const zip = new JSZip();
      const folder = zip.folder("storyboard-frames");

      for (let idx = 0; idx < filledSelectedSlots.length; idx++) {
        const { slot, index } = filledSelectedSlots[idx];
        if (!slot.url) continue;
        const res = await fetch(slot.url);
        const blob = await res.blob();
        const cleanName = (slot.name || `frame_${index + 1}`).replace(/[^a-zA-Z0-9_-]/g, "_");
        folder?.file(`${String(idx + 1).padStart(2, "0")}_${cleanName}.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `storyboard_frames_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showFeedback(`Downloaded ${filledSelectedSlots.length} frame(s) in ZIP`);
    } catch (err) {
      console.error("ZIP download failed", err);
      showFeedback("Failed to build ZIP archive");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#090e1a] border border-[#1e293b] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 animate-in zoom-in-95 duration-150 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0b1329] px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CustomizableLabel
                  labelId="storyboard_operations_modal_item_59"
                  as="h3"
                  className="font-bold text-sm text-slate-100"
                >
                    {() => (
                        <>
                          {uiText("components_storyboard_operations_modal.h3.storyboard_slot_operations", "Storyboard Slot Operations")}
                        </>
                      )}
                </CustomizableLabel>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/30 text-amber-300">
                  {selectedCount} / {slots.length}{uiText("components_storyboard_operations_modal.span.selected", " Selected")}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {uiText("components_storyboard_operations_modal.p.multi_select_deselect_shift_positions_by_x_s", "Multi select/deselect, shift positions by X, send to tools, and manage frame slots")}
              </p>
            </div>
          </div>
          <CustomizableButton
            buttonId="storyboard_operations_modal_btn_58"
            defaultIcon={<X className="w-4 h-4" />}
            onClick={onClose}
className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          />
        </div>

        {/* Storyboard Controls Strip: Unlock Icon & Custom Panel Strip Color */}
        <div className="bg-[#030712]/95 px-3.5 py-2 border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Storyboard Lock / Unlock Button */}
            {onToggleStoryboardLock && (
              <CustomizableButton
                buttonId="storyboard_operations_modal_btn_57"
                type="button"
onClick={onToggleStoryboardLock}
className={cn(
                  "px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm select-none",
                  isStoryboardLocked
                    ? "bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700/90 hover:text-slate-100 shadow-slate-900/40"
                    : "bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border-emerald-500/50 hover:border-emerald-400 shadow-emerald-950/30"
                )}
title={
                  isStoryboardLocked
                    ? "Storyboard is Locked (Drag & Drop slots protected) - Click to Unlock"
                    : "Storyboard is Unlocked (Drag & Drop slots enabled) - Click to Lock"
                }
              >
                  {() => (
                      <>
                        {isStoryboardLocked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                )}
                      <span>{isStoryboardLocked ? "Storyboard Locked" : "Storyboard Unlocked"}</span>
                      </>
                    )}
              </CustomizableButton>
            )}

            {/* Custom Panel Strip Color Button & Color Picker */}
            {onUpdateStripPanelBackground && (
              <div className="relative group/modalstripbg flex items-center">
                <CustomizableButton
                  buttonId="storyboard_operations_modal_btn_56"
                  defaultIcon={<Palette className="w-3.5 h-3.5 text-cyan-400" />}
                  type="button"
onClick={handleCycleStripColor}
className="px-2.5 py-1.5 bg-[#0b1329] hover:bg-[#101b38] border border-[#1e293b] hover:border-cyan-500/50 rounded-lg text-cyan-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
title={`Custom Panel Strip Color: ${currentStripColor} - Click to cycle presets / Hover or click picker to customize`}
                >
                    {() => (
                        <>
                          <span>{uiText("components_storyboard_operations_modal.span.panel_strip_color", "Panel Strip Color")}</span>
                        <span
                    className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-inner inline-block shrink-0 ring-1 ring-cyan-500/30"
                    style={{ backgroundColor: currentStripColor }}
                  />
                        <span className="font-mono text-[10px] text-slate-300 uppercase hidden xs:inline">
                    {currentStripColor}
                  </span>
                        </>
                      )}
                </CustomizableButton>
                <input
                  type="color"
                  value={currentStripColor}
                  onChange={(e) => onUpdateStripPanelBackground(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none group-hover/modalstripbg:pointer-events-auto"
                  title={uiText("components_storyboard_operations_modal.input.pick_custom_strip_panel_and_image_background.title", "Pick custom Strip Panel & Image background color")}
                />
              </div>
            )}
          </div>

          {/* Quick Preset Palette Swatches & Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            {onUpdateStripPanelBackground && (
              <div className="flex items-center gap-1 bg-[#0b1329]/80 px-2 py-1 rounded-lg border border-[#1e293b]/80">
                <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">{uiText("components_storyboard_operations_modal.span.presets", "Presets:")}</span>
                {DARK_STRIP_PRESETS.map((p) => {
                  const isSelected = currentStripColor.toLowerCase() === p.color.toLowerCase();
                  return (
                    <CustomizableButton
                      buttonId="storyboard_operations_modal_btn_55"
                      key={p.color}
type="button"
onClick={() => onUpdateStripPanelBackground(p.color)}
className={cn(
                        "w-4 h-4 rounded border transition-transform hover:scale-125 cursor-pointer relative",
                        isSelected
                          ? "border-cyan-400 ring-2 ring-cyan-400/60 scale-110"
                          : "border-slate-700 hover:border-slate-500"
                      )}
style={{ backgroundColor: p.color }}
title={`${p.label} (${p.color})`}
                    />
                  );
                })}
              </div>
            )}

            {/* Quick-Access Select & Reverse button */}
            <CustomizableButton
              buttonId="storyboard_operations_modal_btn_54"
              defaultIcon={<ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />}
              type="button"
onClick={handleReverseSelected}
className="px-2.5 py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/50 hover:border-emerald-400 rounded-lg text-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
title={
                selectedCount > 1
                  ? `Reverse sequence order of ${selectedCount} selected slots`
                  : "Select all and reverse storyboard frame sequence"
              }
            >
                {() => (
                    <>
                      <span>{selectedCount > 1 ? `Reverse Selected (${selectedCount})` : "Select & Reverse"}</span>
                    </>
                  )}
            </CustomizableButton>

            {/* Quick-Access Duplicate Frames button */}
            <CustomizableButton
              buttonId="storyboard_operations_modal_btn_53"
              defaultIcon={<Copy className="w-3.5 h-3.5 text-indigo-400" />}
              type="button"
onClick={handleDuplicateSelected}
className="px-2.5 py-1.5 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/50 hover:border-indigo-400 rounded-lg text-indigo-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
title={
                selectedCount > 0
                  ? `Duplicate ${selectedCount} selected slot(s)`
                  : "Duplicate all filled frames in storyboard"
              }
            >
                {() => (
                    <>
                      <span>{selectedCount > 0 ? `Duplicate (${selectedCount})` : "Duplicate Frames"}</span>
                    </>
                  )}
            </CustomizableButton>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1e293b] bg-[#020617]/60 px-3 pt-2 gap-1 overflow-x-auto text-xs font-semibold shrink-0">
          <CustomizableButton
            buttonId="storyboard_operations_modal_btn_52"
            defaultIcon={<CheckSquare className="w-3.5 h-3.5 text-emerald-400" />}
            onClick={() => setActiveTab("select")}
className={`px-3 py-2 rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "select"
                ? "border-emerald-500 text-emerald-300 bg-[#090e1a]"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
              {() => (
                  <>
                    <span>{uiText("components_storyboard_operations_modal.span.multi_select_deselect", "Multi-Select / Deselect")}</span>
                  </>
                )}
          </CustomizableButton>
          <CustomizableButton
            buttonId="storyboard_operations_modal_btn_51"
            defaultIcon={<ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />}
            onClick={() => setActiveTab("move")}
className={`px-3 py-2 rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "move"
                ? "border-amber-500 text-amber-300 bg-[#090e1a]"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
              {() => (
                  <>
                    <span>{uiText("components_storyboard_operations_modal.span.move_and_shift_positions", "Move & Shift Positions")}</span>
                  </>
                )}
          </CustomizableButton>
          <CustomizableButton
            buttonId="storyboard_operations_modal_btn_50"
            defaultIcon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
            onClick={() => setActiveTab("tools")}
className={`px-3 py-2 rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "tools"
                ? "border-cyan-500 text-cyan-300 bg-[#090e1a]"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
              {() => (
                  <>
                    <span>{uiText("components_storyboard_operations_modal.span.send_to_tools", "Send to Tools (")}{filledSelectedSlots.length})</span>
                  </>
                )}
          </CustomizableButton>
          <CustomizableButton
            buttonId="storyboard_operations_modal_btn_49"
            defaultIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
            onClick={() => setActiveTab("delete")}
className={`px-3 py-2 rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "delete"
                ? "border-rose-500 text-rose-300 bg-[#090e1a]"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
              {() => (
                  <>
                    <span>{uiText("components_storyboard_operations_modal.span.delete_and_clear", "Delete & Clear")}</span>
                  </>
                )}
          </CustomizableButton>
          <CustomizableButton
            buttonId="storyboard_operations_modal_btn_48"
            defaultIcon={<Palette className="w-3.5 h-3.5 text-purple-400" />}
            onClick={() => setActiveTab("board")}
className={`px-3 py-2 rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "board"
                ? "border-purple-500 text-purple-300 bg-[#090e1a]"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
              {() => (
                  <>
                    <span>{uiText("components_storyboard_operations_modal.span.board_and_strip_settings", "Board & Strip Settings")}</span>
                  </>
                )}
          </CustomizableButton>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: MULTI SELECT / DESELECT */}
          {activeTab === "select" && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                {uiText("components_storyboard_operations_modal.div.quickly_select_deselect_or_filter_slots_acro", "Quickly select, deselect, or filter slots across the entire storyboard matrix:")}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <CustomizableButton
                  buttonId="storyboard_operations_modal_btn_47"
                  defaultIcon={<CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />}
                  type="button"
onClick={handleSelectAll}
className="px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 hover:border-emerald-500/50 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                    {() => (
                        <>
                          <span>{uiText("components_storyboard_operations_modal.span.select_all", "Select All (")}{slots.length})</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="storyboard_operations_modal_btn_46"
                  defaultIcon={<Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />}
                  type="button"
onClick={handleSelectFilled}
className="px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 hover:border-emerald-500/50 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                    {() => (
                        <>
                          <span>{uiText("components_storyboard_operations_modal.span.select_filled", "Select Filled (")}{slots.filter((s) => s.url).length})</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="storyboard_operations_modal_btn_45"
                  defaultIcon={<Square className="w-4 h-4 text-amber-400 shrink-0" />}
                  type="button"
onClick={handleSelectEmpty}
className="px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 hover:border-amber-500/50 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                    {() => (
                        <>
                          <span>{uiText("components_storyboard_operations_modal.span.select_empty", "Select Empty (")}{slots.filter((s) => !s.url).length})</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="storyboard_operations_modal_btn_44"
                  defaultIcon={<RefreshCw className="w-4 h-4 text-cyan-400 shrink-0" />}
                  type="button"
onClick={handleInvertSelection}
className="px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 hover:border-cyan-500/50 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                    {() => (
                        <>
                          <span>{uiText("components_storyboard_operations_modal.span.invert_selection", "Invert Selection")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="storyboard_operations_modal_btn_43"
                  type="button"
onClick={handleSelectOdd}
className="px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 hover:border-indigo-500/50 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                    {() => (
                        <>
                          <span className="font-mono font-black text-indigo-400">1,3,5</span>
                        <span>{uiText("components_storyboard_operations_modal.span.select_odd_slots", "Select Odd Slots")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="storyboard_operations_modal_btn_42"
                  type="button"
onClick={handleSelectEven}
className="px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 hover:border-indigo-500/50 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                    {() => (
                        <>
                          <span className="font-mono font-black text-indigo-400">2,4,6</span>
                        <span>{uiText("components_storyboard_operations_modal.span.select_even_slots", "Select Even Slots")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>

              {/* Range Selector */}
              <div className="p-3 bg-[#020617]/70 border border-[#1e293b] rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span>{uiText("components_storyboard_operations_modal.span.select_range_from_slot", "Select Range from Slot")}</span>
                  <input
                    type="number"
                    min={1}
                    max={slots.length}
                    value={rangeStart}
                    onChange={(e) => setRangeStart(parseInt(e.target.value) || 1)}
                    className="w-14 bg-[#090e1a] border border-[#1e293b] rounded px-2 py-1 text-center font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span>{uiText("components_storyboard_operations_modal.span.to", "to")}</span>
                  <input
                    type="number"
                    min={1}
                    max={slots.length}
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(parseInt(e.target.value) || 1)}
                    className="w-14 bg-[#090e1a] border border-[#1e293b] rounded px-2 py-1 text-center font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_41"
                    type="button"
onClick={handleSelectRange}
className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                      {() => (
                          <>
                            {uiText("components_storyboard_operations_modal.button.select_range", "Select Range")}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_40"
                    defaultIcon={<ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />}
                    type="button"
onClick={handleSelectRangeAndReverse}
className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
title={uiText("components_storyboard_operations_modal.button.select_this_range_and_instantly_reverse_thei.title", "Select this range and instantly reverse their order")}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_storyboard_operations_modal.span.select_and_reverse_range", "Select & Reverse Range")}</span>
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>

              {/* Slot Operations: Select & Reverse + Duplicate Frames */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-indigo-950/30 border border-emerald-500/40 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <ArrowUpDown className="w-4 h-4 text-emerald-400" />
                    <span>{uiText("components_storyboard_operations_modal.span.slot_operations_select_and_reverse_and_frame", "Slot Operations: Select & Reverse & Frame Duplication")}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                    {selectedCount > 0 ? `${selectedCount} Selected` : `${slots.length} Total Slots`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {uiText("components_storyboard_operations_modal.div.select_and_reverse_frame_ordering_or_clone_f", "Select and reverse frame ordering, or clone frames across the storyboard:")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_39"
                    defaultIcon={<ArrowUpDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    type="button"
onClick={handleSelectAndReverseAll}
className="p-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
title={uiText("components_storyboard_operations_modal.button.select_all_slots_and_reverse_frame_order.title", "Select all slots and reverse frame order")}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_storyboard_operations_modal.span.select_all_and_reverse", "Select All & Reverse")}</span>
                          </>
                        )}
                  </CustomizableButton>

                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_38"
                    defaultIcon={<ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    type="button"
onClick={handleSelectFilledAndReverse}
className="p-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
title={uiText("components_storyboard_operations_modal.button.select_all_filled_slots_and_reverse_sequence.title", "Select all filled slots and reverse sequence order")}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_storyboard_operations_modal.span.select_filled_and_reverse", "Select Filled & Reverse")}</span>
                          </>
                        )}
                  </CustomizableButton>

                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_37"
                    defaultIcon={<ArrowUpDown className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                    type="button"
onClick={handleReverseSelected}
className={cn(
                      "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm",
                      selectedCount > 1
                        ? "bg-teal-950/70 hover:bg-teal-900/90 border-teal-500/60 text-teal-200"
                        : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300"
                    )}
title={uiText("components_storyboard_operations_modal.button.reverse_only_the_currently_selected_frames_i.title", "Reverse only the currently selected frames in-place")}
                  >
                      {() => (
                          <>
                            <span>{selectedCount > 1 ? `Reverse Selected (${selectedCount})` : "Reverse Selected"}</span>
                          </>
                        )}
                  </CustomizableButton>

                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_36"
                    defaultIcon={<Copy className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    type="button"
onClick={handleDuplicateSelected}
className="p-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/50 text-indigo-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
title={uiText("components_storyboard_operations_modal.button.duplicate_selected_frame_s_with_copy_suffix.title", "Duplicate selected frame(s) with (Copy) suffix or all filled if none selected")}
                  >
                      {() => (
                          <>
                            <span>{selectedCount > 0 ? `Duplicate Selected (${selectedCount})` : "Duplicate Filled"}</span>
                          </>
                        )}
                  </CustomizableButton>

                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_35"
                    defaultIcon={<Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                    type="button"
onClick={handleDuplicateAllFilled}
className="p-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/50 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
title={uiText("components_storyboard_operations_modal.button.duplicate_all_filled_frames_across_storyboar.title", "Duplicate all filled frames across storyboard")}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_storyboard_operations_modal.span.duplicate_all_filled", "Duplicate All Filled")}</span>
                          </>
                        )}
                  </CustomizableButton>

                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_34"
                    defaultIcon={<RefreshCw className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    type="button"
onClick={handleDuplicateAndReverse}
className="p-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/50 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
title={uiText("components_storyboard_operations_modal.button.duplicate_selected_filled_frames_and_append.title", "Duplicate selected/filled frames and append in reverse sequence for a ping-pong loop")}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_storyboard_operations_modal.span.duplicate_and_reverse_loop", "Duplicate & Reverse (Loop)")}</span>
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>

              {selectedCount > 0 && (
                <div className="pt-2 flex justify-end">
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_33"
                    type="button"
onClick={handleClearSelection}
className="px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg border border-transparent hover:border-rose-900/50 transition-colors cursor-pointer"
                  >
                      {() => (
                          <>
                            {uiText("components_storyboard_operations_modal.button.deselect_all_clear_selection", "Deselect All / Clear Selection")}
                          </>
                        )}
                  </CustomizableButton>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MOVE & SHIFT POSITIONS */}
          {activeTab === "move" && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                {uiText("components_storyboard_operations_modal.div.move_the", "Move the ")}{selectedCount}{uiText("components_storyboard_operations_modal.div.selected_slot_s_by_a_custom_amount_of_positi", " selected slot(s) by a custom amount of positions, jump to start/end, or duplicate and insert blanks:")}
              </div>

              {/* Move by X Amount */}
              <div className="p-3.5 bg-[#020617]/80 border border-[#1e293b] rounded-xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CustomizableLabel
                    labelId="storyboard_operations_modal_item_32"
                    as="label"
                    className="text-xs font-semibold text-slate-200"
                  >
                      {() => (
                          <>
                            {uiText("components_storyboard_operations_modal.label.shift_selected_by_x_positions", "Shift Selected by 'X' Positions:")}
                          </>
                        )}
                  </CustomizableLabel>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{uiText("components_storyboard_operations_modal.span.x", "X =")}</span>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, slots.length - 1)}
                      value={shiftAmount}
                      onChange={(e) => setShiftAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 bg-[#090e1a] border border-amber-500/50 text-amber-300 font-mono font-black text-center text-sm rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="text-xs text-slate-400">{uiText("components_storyboard_operations_modal.span.slot", "slot")}{shiftAmount > 1 ? "s" : ""}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_31"
                    defaultIcon={<ArrowLeft className="w-4 h-4 text-amber-400" />}
                    type="button"
disabled={selectedCount === 0}
onClick={() => handleShiftPositions("left")}
className="px-3 py-2 rounded-xl bg-amber-950/50 hover:bg-amber-900/70 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_storyboard_operations_modal.span.move", "Move -")}{shiftAmount}{uiText("components_storyboard_operations_modal.span.backward", " (Backward)")}</span>
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_30"
                    defaultIcon={<ArrowRight className="w-4 h-4 text-amber-400" />}
                    type="button"
disabled={selectedCount === 0}
onClick={() => handleShiftPositions("right")}
className="px-3 py-2 rounded-xl bg-amber-950/50 hover:bg-amber-900/70 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_storyboard_operations_modal.span.move_2", "Move +")}{shiftAmount}{uiText("components_storyboard_operations_modal.span.forward", " (Forward)")}</span>
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>

              {/* Jump & Order Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <CustomizableButton
                  buttonId="storyboard_operations_modal_btn_29"
                  defaultIcon={<ChevronsLeft className="w-4 h-4 text-sky-400" />}
                  type="button"
disabled={selectedCount === 0}
onClick={handleMoveToStart}
className="px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {() => (
                        <>
                          <span>{uiText("components_storyboard_operations_modal.span.jump_to_start_1", "Jump to Start (#1)")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="storyboard_operations_modal_btn_28"
                  defaultIcon={<ChevronsRight className="w-4 h-4 text-sky-400" />}
                  type="button"
disabled={selectedCount === 0}
onClick={handleMoveToEnd}
className="px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {() => (
                        <>
                          <span>{uiText("components_storyboard_operations_modal.span.jump_to_end", "Jump to End (#")}{slots.length})</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="storyboard_operations_modal_btn_27"
                  defaultIcon={<ArrowUpDown className="w-4 h-4 text-emerald-400" />}
                  type="button"
onClick={handleReverseSelected}
className={cn(
                    "px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm",
                    selectedCount > 1
                      ? "bg-emerald-950/70 hover:bg-emerald-900/80 border-emerald-500/50 text-emerald-200"
                      : "bg-slate-800/70 hover:bg-slate-700/80 border-slate-700 text-slate-200"
                  )}
title={
                    selectedCount > 1
                      ? `Reverse order of ${selectedCount} selected slots`
                      : "Reverse order of all frames in storyboard"
                  }
                >
                    {() => (
                        <>
                          <span>{selectedCount > 1 ? `Reverse Selected (${selectedCount})` : "Select & Reverse All"}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="storyboard_operations_modal_btn_26"
                  defaultIcon={<Copy className="w-4 h-4 text-indigo-400" />}
                  type="button"
onClick={handleDuplicateSelected}
className={cn(
                    "px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm",
                    selectedCount > 0
                      ? "bg-indigo-950/70 hover:bg-indigo-900/80 border-indigo-500/50 text-indigo-200"
                      : "bg-slate-800/70 hover:bg-slate-700/80 border-slate-700 text-slate-200"
                  )}
title={
                    selectedCount > 0
                      ? `Duplicate ${selectedCount} selected slot(s)`
                      : "Duplicate all filled frames in storyboard"
                  }
                >
                    {() => (
                        <>
                          <span>{selectedCount > 0 ? `Duplicate Selected (${selectedCount})` : "Duplicate Filled"}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="storyboard_operations_modal_btn_25"
                  defaultIcon={<RefreshCw className="w-4 h-4 text-amber-400" />}
                  type="button"
onClick={handleDuplicateAndReverse}
className="px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm bg-amber-950/60 hover:bg-amber-900/80 border-amber-500/40 text-amber-200"
title={uiText("components_storyboard_operations_modal.button.duplicate_frames_and_append_in_reverse_order.title", "Duplicate frames and append in reverse order for a ping-pong loop")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_storyboard_operations_modal.span.duplicate_and_reverse_loop_2", "Duplicate & Reverse (Loop)")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>

              {/* Insert Blank Slots */}
              <div className="p-3 bg-[#020617]/70 border border-[#1e293b] rounded-xl flex items-center justify-between flex-wrap gap-2.5">
                <div className="flex items-center gap-2 text-xs">
                  <span>{uiText("components_storyboard_operations_modal.span.insert", "Insert")}</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={insertBlankCount}
                    onChange={(e) => setInsertBlankCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 bg-[#090e1a] border border-[#1e293b] rounded px-2 py-1 text-center font-mono font-bold text-slate-100"
                  />
                  <span>{uiText("components_storyboard_operations_modal.span.blank_slot_s", "Blank Slot(s):")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_24"
                    type="button"
onClick={() => handleInsertBlanks("before")}
className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                      {() => (
                          <>
                            {uiText("components_storyboard_operations_modal.button.insert_before", "Insert Before")}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_23"
                    type="button"
onClick={() => handleInsertBlanks("after")}
className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                      {() => (
                          <>
                            {uiText("components_storyboard_operations_modal.button.insert_after", "Insert After")}
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SEND TO TOOLS */}
          {activeTab === "tools" && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                {uiText("components_storyboard_operations_modal.div.send_images_from", "Send images from ")}{filledSelectedSlots.length}{uiText("components_storyboard_operations_modal.div.selected_filled_slot_s_directly_to_the_creat", " selected filled slot(s) directly to the creative tools:")}
              </div>

              {filledSelectedSlots.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-[#1e293b] rounded-xl bg-[#020617]/50">
                  <Film className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-300">{uiText("components_storyboard_operations_modal.p.no_filled_slots_currently_selected", "No filled slots currently selected")}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {uiText("components_storyboard_operations_modal.p.select_one_or_more_slots_that_have_images_to", "Select one or more slots that have images to activate these tools.")}
                  </p>
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_22"
                    type="button"
onClick={handleSelectFilled}
className="mt-3 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                      {() => (
                          <>
                            {uiText("components_storyboard_operations_modal.button.select_all_filled_slots", "Select All Filled Slots")}
                          </>
                        )}
                  </CustomizableButton>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Send to Crop */}
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_21"
                    type="button"
onClick={() => {
                      const first = filledSelectedSlots[0];
                      if (first && first.slot.url && onSendToCrop) {
                        onSendToCrop(first.slot.url, first.index);
                        onClose();
                      }
                    }}
className="p-3 rounded-xl bg-[#020617] hover:bg-emerald-950/30 border border-[#1e293b] hover:border-emerald-500/50 transition-all text-left flex items-start gap-3 cursor-pointer group"
                  >
                      {() => (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Scissors className="w-4 h-4" />
                    </div>
                          <div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-300">
                        {uiText("components_storyboard_operations_modal.div.send_to_crop_tool", "Send to Crop Tool")}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {uiText("components_storyboard_operations_modal.div.open_slot", "Open slot #")}{filledSelectedSlots[0]?.index + 1}{uiText("components_storyboard_operations_modal.div.in_crop_to_adjust_boundary_or_carve", " in Crop to adjust boundary or carve")}
                      </div>
                    </div>
                          </>
                        )}
                  </CustomizableButton>

                  {/* Send to Carver */}
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_20"
                    type="button"
onClick={() => {
                      const first = filledSelectedSlots[0];
                      if (first && first.slot.url && onSendToCarve) {
                        onSendToCarve(first.slot.url, first.slot.name);
                        onClose();
                      }
                    }}
className="p-3 rounded-xl bg-[#020617] hover:bg-sky-950/30 border border-[#1e293b] hover:border-sky-500/50 transition-all text-left flex items-start gap-3 cursor-pointer group"
                  >
                      {() => (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Grid3x3 className="w-4 h-4" />
                    </div>
                          <div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-sky-300">
                        {uiText("components_storyboard_operations_modal.div.send_to_grid_carver", "Send to Grid Carver")}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {uiText("components_storyboard_operations_modal.div.slice_frame", "Slice frame #")}{filledSelectedSlots[0]?.index + 1} into multi-cell grids
                      </div>
                    </div>
                          </>
                        )}
                  </CustomizableButton>

                  {/* Send to Bubba1 Studio */}
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_19"
                    type="button"
onClick={() => {
                      const first = filledSelectedSlots[0];
                      if (first && first.slot.url && onSendToBubba1) {
                        onSendToBubba1(first.index, first.slot.url, first.slot.name);
                        onClose();
                      }
                    }}
className="p-3 rounded-xl bg-[#020617] hover:bg-purple-950/30 border border-[#1e293b] hover:border-purple-500/50 transition-all text-left flex items-start gap-3 cursor-pointer group"
                  >
                      {() => (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                          <div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-purple-300">
                        {uiText("components_storyboard_operations_modal.div.bubba1_studio", "Bubba1 Studio")}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {uiText("components_storyboard_operations_modal.div.add_speech_bubbles_dialogue_narration_and_ca", "Add speech bubbles, dialogue narration, and captions")}
                      </div>
                    </div>
                          </>
                        )}
                  </CustomizableButton>

                  {/* Send to Neo1 Studio */}
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_18"
                    type="button"
onClick={() => {
                      const first = filledSelectedSlots[0];
                      if (first && first.slot.url && onSendToNeo1) {
                        onSendToNeo1(first.index, first.slot.url, first.slot.name);
                        onClose();
                      }
                    }}
className="p-3 rounded-xl bg-[#020617] hover:bg-cyan-950/30 border border-[#1e293b] hover:border-cyan-500/50 transition-all text-left flex items-start gap-3 cursor-pointer group"
                  >
                      {() => (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Ruler className="w-4 h-4" />
                    </div>
                          <div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300">
                        {uiText("components_storyboard_operations_modal.div.neo1_studio_design_and_layers", "Neo1 Studio (Design & Layers)")}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {uiText("components_storyboard_operations_modal.div.add_text_typography_shapes_and_graphic_layer", "Add text, typography, shapes, and graphic layers")}
                      </div>
                    </div>
                          </>
                        )}
                  </CustomizableButton>

                  {/* Send to Animation Player */}
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_17"
                    type="button"
onClick={() => {
                      if (onSendToPlayer) {
                        onSendToPlayer();
                        onClose();
                      }
                    }}
className="p-3 rounded-xl bg-[#020617] hover:bg-rose-950/30 border border-[#1e293b] hover:border-rose-500/50 transition-all text-left flex items-start gap-3 cursor-pointer group"
                  >
                      {() => (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4" />
                    </div>
                          <div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-rose-300">
                        {uiText("components_storyboard_operations_modal.div.animation_player", "Animation player")}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {uiText("components_storyboard_operations_modal.div.preview_selected_frames_in_sequence_player", "Preview selected frames in sequence player")}
                      </div>
                    </div>
                          </>
                        )}
                  </CustomizableButton>

                  {/* Send to AniComper4 Studio */}
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_16"
                    type="button"
onClick={() => {
                      if (onSendToAniComper4) {
                        onSendToAniComper4();
                        onClose();
                      }
                    }}
className="p-3 rounded-xl bg-[#020617] hover:bg-cyan-950/30 border border-[#1e293b] hover:border-cyan-500/50 transition-all text-left flex items-start gap-3 cursor-pointer group"
                  >
                      {() => (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Film className="w-4 h-4" />
                    </div>
                          <div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300">
                        {uiText("components_storyboard_operations_modal.div.anicomper4_studio", "Anicomper4 studio")}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {uiText("components_storyboard_operations_modal.div.keyframed_timeline_onion_skinning_and_speed", "Keyframed timeline, onion-skinning & speed ramping")}
                      </div>
                    </div>
                          </>
                        )}
                  </CustomizableButton>

                  {/* Send to Rename Studio */}
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_15"
                    type="button"
onClick={() => {
                      if (onSendToRenameStudio) {
                        onSendToRenameStudio();
                        onClose();
                      }
                    }}
className="p-3 rounded-xl bg-[#020617] hover:bg-amber-950/30 border border-[#1e293b] hover:border-amber-500/50 transition-all text-left flex items-start gap-3 cursor-pointer group"
                  >
                      {() => (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Tag className="w-4 h-4" />
                    </div>
                          <div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-amber-300">
                        {uiText("components_storyboard_operations_modal.div.rename_studio", "Rename Studio")}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {uiText("components_storyboard_operations_modal.div.bulk_rename_selected_frames_with_naming_patt", "Bulk rename selected frames with naming patterns")}
                      </div>
                    </div>
                          </>
                        )}
                  </CustomizableButton>

                  {/* Send to Screenplay Writer */}
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_14"
                    type="button"
onClick={() => {
                      if (onSendToScreenplay) {
                        onSendToScreenplay();
                        onClose();
                      }
                    }}
className="p-3 rounded-xl bg-[#020617] hover:bg-indigo-950/30 border border-[#1e293b] hover:border-indigo-500/50 transition-all text-left flex items-start gap-3 cursor-pointer group"
                  >
                      {() => (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <FileText className="w-4 h-4" />
                    </div>
                          <div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-indigo-300">
                        {uiText("components_storyboard_operations_modal.div.screenplay_writer", "Screenplay Writer")}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {uiText("components_storyboard_operations_modal.div.turn_selected_frames_into_screenplay_storybo", "Turn selected frames into screenplay storyboard slides")}
                      </div>
                    </div>
                          </>
                        )}
                  </CustomizableButton>

                  {/* Download Selected as ZIP */}
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_13"
                    type="button"
disabled={isZipping}
onClick={handleDownloadZip}
className="p-3 rounded-xl bg-[#020617] hover:bg-emerald-950/30 border border-[#1e293b] hover:border-emerald-500/50 transition-all text-left flex items-start gap-3 cursor-pointer group"
                  >
                      {() => (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Download className="w-4 h-4" />
                    </div>
                          <div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-300">
                        {isZipping ? "Packaging ZIP..." : "Download Selected as ZIP"}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {uiText("components_storyboard_operations_modal.div.download", "Download ")}{filledSelectedSlots.length}{uiText("components_storyboard_operations_modal.div.image_file_s_in_a_single_archive", " image file(s) in a single archive")}
                      </div>
                    </div>
                          </>
                        )}
                  </CustomizableButton>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DELETE & CLEAR */}
          {activeTab === "delete" && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                {uiText("components_storyboard_operations_modal.div.delete_slots_completely_from_the_matrix_or_c", "Delete slots completely from the matrix or clear contents while keeping the layout:")}
              </div>

              <div className="space-y-3">
                {/* Delete Selected Slots */}
                <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-rose-300">
                      {uiText("components_storyboard_operations_modal.div.delete_selected_frame_slots", "Delete Selected Frame Slots (")}{selectedCount})
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {uiText("components_storyboard_operations_modal.div.permanently_removes_these_slot_cells_from_th", "Permanently removes these slot cells from the storyboard array")}
                    </div>
                  </div>
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_12"
                    defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                    type="button"
disabled={selectedCount === 0}
onClick={handleDeleteSelected}
className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center gap-1.5"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_storyboard_operations_modal.span.delete_slots", "Delete Slots")}</span>
                          </>
                        )}
                  </CustomizableButton>
                </div>

                {/* Clear Selected Slot Content */}
                <div className="p-3.5 bg-amber-950/20 border border-amber-900/40 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-amber-300">
                      {uiText("components_storyboard_operations_modal.div.clear_image_content_from_selected_slots", "Clear Image Content from Selected Slots (")}{selectedCount})
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {uiText("components_storyboard_operations_modal.div.clears_image_and_notes_from_selected_slots_w", "Clears image and notes from selected slots without changing slot count")}
                    </div>
                  </div>
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_11"
                    defaultIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    type="button"
disabled={selectedCount === 0}
onClick={handleClearSelectedContent}
className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center gap-1.5"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_storyboard_operations_modal.span.clear_images", "Clear Images")}</span>
                          </>
                        )}
                  </CustomizableButton>
                </div>

                {/* Delete All Empty Slots */}
                <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-200">{uiText("components_storyboard_operations_modal.div.prune_all_empty_slots", "Prune All Empty Slots")}</div>
                    <div className="text-[10px] text-slate-400">
                      {uiText("components_storyboard_operations_modal.div.removes_any_slot_that_does_not_have_an_image", "Removes any slot that does not have an image assigned")}
                    </div>
                  </div>
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_10"
                    type="button"
onClick={handleDeleteEmptySlots}
className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                      {() => (
                          <>
                            {uiText("components_storyboard_operations_modal.button.prune_empty", "Prune Empty")}
                          </>
                        )}
                  </CustomizableButton>
                </div>

                {/* Reset to 9 Blank Slots */}
                <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-200">{uiText("components_storyboard_operations_modal.div.reset_to_9_blank_slots", "Reset to 9 Blank Slots")}</div>
                    <div className="text-[10px] text-slate-400">
                      {uiText("components_storyboard_operations_modal.div.resets_the_storyboard_matrix_to_standard_9_b", "Resets the storyboard matrix to standard 9 blank slots")}
                    </div>
                  </div>
                  <CustomizableButton
                    buttonId="storyboard_operations_modal_btn_9"
                    type="button"
onClick={handleResetTo9Defaults}
className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                      {() => (
                          <>
                            {uiText("components_storyboard_operations_modal.button.reset_to_9", "Reset to 9")}
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BOARD & STRIP SETTINGS */}
          {activeTab === "board" && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                {uiText("components_storyboard_operations_modal.div.configure_storyboard_lock_protection_and_cus", "Configure Storyboard lock protection and customize the frame strip panel background color:")}
              </div>

              {/* 1. Storyboard Drag & Drop Lock Section */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                      isStoryboardLocked
                        ? "bg-slate-800/90 text-slate-300 border-slate-700"
                        : "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                    )}>
                      {isStoryboardLocked ? (
                        <Lock className="w-5 h-5 text-slate-300" />
                      ) : (
                        <Unlock className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                        <span>{uiText("components_storyboard_operations_modal.span.storyboard_drag_and_drop_lock", "Storyboard Drag & Drop Lock")}</span>
                        <span className={cn(
                          "text-[10px] font-mono px-2 py-0.5 rounded-full border",
                          isStoryboardLocked
                            ? "bg-slate-800 text-slate-300 border-slate-700"
                            : "bg-emerald-950 text-emerald-300 border-emerald-500/50"
                        )}>
                          {isStoryboardLocked ? "LOCKED" : "UNLOCKED"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isStoryboardLocked
                          ? "Slot dragging and swapping are protected against accidental moves."
                          : "Slot dragging, swapping, and reordering are currently enabled."}
                      </div>
                    </div>
                  </div>

                  {onToggleStoryboardLock && (
                    <CustomizableButton
                      buttonId="storyboard_operations_modal_btn_8"
                      type="button"
onClick={onToggleStoryboardLock}
className={cn(
                        "px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm",
                        isStoryboardLocked
                          ? "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-500/60 hover:border-emerald-400"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600"
                      )}
                    >
                        {() => (
                            <>
                              {isStoryboardLocked ? (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{uiText("components_storyboard_operations_modal.span.unlock_board", "Unlock Board")}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{uiText("components_storyboard_operations_modal.span.lock_board", "Lock Board")}</span>
                        </>
                      )}
                            </>
                          )}
                    </CustomizableButton>
                  )}
                </div>
              </div>

              {/* 2. Custom Panel Strip Color Section */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                        <span>{uiText("components_storyboard_operations_modal.span.custom_panel_strip_color", "Custom Panel Strip Color")}</span>
                        <span className="font-mono text-[10px] text-cyan-300 uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30">
                          {currentStripColor}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {uiText("components_storyboard_operations_modal.div.configures_the_background_color_of_the_story", "Configures the background color of the storyboard strip panel and frame container")}
                      </div>
                    </div>
                  </div>

                  {/* Live color preview and custom picker */}
                  {onUpdateStripPanelBackground && (
                    <div className="relative group/customcolorpicker flex items-center shrink-0">
                      <CustomizableButton
                        buttonId="storyboard_operations_modal_btn_7"
                        type="button"
className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 rounded-xl text-xs font-bold text-slate-200 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                      >
                          {() => (
                              <>
                                <span
                          className="w-4 h-4 rounded-full border border-white/40 shadow-inner inline-block shrink-0 ring-1 ring-cyan-500/40"
                          style={{ backgroundColor: currentStripColor }}
                        />
                              <span>{uiText("components_storyboard_operations_modal.span.pick_custom_color", "Pick Custom Color")}</span>
                              </>
                            )}
                      </CustomizableButton>
                      <input
                        type="color"
                        value={currentStripColor}
                        onChange={(e) => onUpdateStripPanelBackground(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none group-hover/customcolorpicker:pointer-events-auto"
                        title={uiText("components_storyboard_operations_modal.input.pick_custom_color.title", "Pick custom color")}
                      />
                    </div>
                  )}
                </div>

                {/* Dark Palette Presets */}
                {onUpdateStripPanelBackground && (
                  <div className="space-y-2 pt-1 border-t border-slate-800/80">
                    <div className="text-[11px] font-semibold text-slate-400">{uiText("components_storyboard_operations_modal.div.quick_palette_presets", "Quick Palette Presets:")}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {DARK_STRIP_PRESETS.map((preset) => {
                        const isSelected = currentStripColor.toLowerCase() === preset.color.toLowerCase();
                        return (
                          <CustomizableButton
                            buttonId="storyboard_operations_modal_btn_6"
                            key={preset.color}
type="button"
onClick={() => {
                              onUpdateStripPanelBackground(preset.color);
                              showFeedback(`Strip color set to ${preset.label}`);
                            }}
className={cn(
                              "p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer",
                              isSelected
                                ? "bg-cyan-950/60 border-cyan-500/70 shadow-sm shadow-cyan-950/40"
                                : "bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-300"
                            )}
                          >
                              {() => (
                                  <>
                                    <span
                              className={cn(
                                "w-4 h-4 rounded-md border shrink-0",
                                isSelected ? "border-cyan-300 ring-2 ring-cyan-400/50" : "border-slate-700"
                              )}
                              style={{ backgroundColor: preset.color }}
                            />
                                  <div className="min-w-0">
                              <div className="text-[11px] font-bold text-slate-200 truncate">{preset.label}</div>
                              <div className="text-[9.5px] font-mono text-slate-400 uppercase">{preset.color}</div>
                            </div>
                                  </>
                                )}
                          </CustomizableButton>
                        );
                      })}
                      <CustomizableButton
                        buttonId="storyboard_operations_modal_btn_5"
                        defaultIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-400" />}
                        type="button"
onClick={() => {
                          onUpdateStripPanelBackground("#000000");
                          showFeedback("Strip color reset to default black (#000000)");
                        }}
className="p-2 rounded-xl border bg-slate-900/80 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
title={uiText("components_storyboard_operations_modal.button.reset_to_pure_black_000000.title", "Reset to pure black (#000000)")}
                      >
                          {() => (
                              <>
                                <span className="text-[11px] font-bold">{uiText("components_storyboard_operations_modal.span.reset_black", "Reset Black")}</span>
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Default State Management Section */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                      <Bookmark className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                        <span>{uiText("components_storyboard_operations_modal.span.default_state_management", "Default State Management")}</span>
                        <span
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded-full border",
                            savedDefaultInfo
                              ? "bg-amber-950 text-amber-300 border-amber-500/50"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          )}
                        >
                          {savedDefaultInfo ? "PERSISTENT DEFAULT SAVED" : "NO SAVED DEFAULT"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {uiText("components_storyboard_operations_modal.div.present_state_as_default_captures_the_storyb", "Present State as Default: Captures the storyboard's present slots, sliced fragments, layout, cell mode, button state and sorting configuration as its persistent default state (STORYBOARD_DEFAULT_STATE_KEY).")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Default State Status Details */}
                {savedDefaultInfo ? (
                  <div className="bg-[#020617] border border-amber-500/30 rounded-xl p-3 text-xs space-y-1.5 font-mono">
                    <div className="flex items-center justify-between text-amber-300 text-[11px] font-bold pb-1 border-b border-slate-800/80">
                      <span>{uiText("components_storyboard_operations_modal.span.saved_default_parameters", "Saved Default Parameters:")}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(savedDefaultInfo.savedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-300">
                      <div>
                        <span className="text-slate-500">{uiText("components_storyboard_operations_modal.span.slots", "Slots: ")}</span>
                        <span className="font-bold text-white">{savedDefaultInfo.slotsCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">{uiText("components_storyboard_operations_modal.span.slices", "Slices: ")}</span>
                        <span className="font-bold text-white">{savedDefaultInfo.slicesCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">{uiText("components_storyboard_operations_modal.span.layout", "Layout: ")}</span>
                        <span className="font-bold text-cyan-300 uppercase">{savedDefaultInfo.layout}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">{uiText("components_storyboard_operations_modal.span.cell", "Cell: ")}</span>
                        <span className="font-bold text-emerald-300 uppercase">{savedDefaultInfo.cellMode}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#020617]/50 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400">
                    {uiText("components_storyboard_operations_modal.div.no_custom_default_storyboard_state_has_been", "No custom default storyboard state has been saved yet. Use the button below to preserve your current slots, sliced fragments, layout, cell mode, buttons, and sorting configuration.")}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {onSaveDefaultState && (
                    <CustomizableButton
                      buttonId="storyboard_operations_modal_btn_4"
                      defaultIcon={<Bookmark className="w-3.5 h-3.5" />}
                      type="button"
onClick={() => {
                        onSaveDefaultState();
                        showFeedback("✓ Present state captured as persistent default state!");
                      }}
className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-amber-950/30 active:scale-95"
                    >
                        {() => (
                            <>
                              <span>{uiText("components_storyboard_operations_modal.span.set_present_state_as_default", "Set Present State as Default")}</span>
                            </>
                          )}
                    </CustomizableButton>
                  )}

                  {onRestoreDefaultState && (
                    <CustomizableButton
                      buttonId="storyboard_operations_modal_btn_3"
                      defaultIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
                      type="button"
onClick={() => {
                        onRestoreDefaultState();
                        showFeedback("✓ Restored storyboard to saved default state!");
                      }}
disabled={!savedDefaultInfo}
className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none active:scale-95"
                    >
                        {() => (
                            <>
                              <span>{uiText("components_storyboard_operations_modal.span.restore_default_state", "Restore Default State")}</span>
                            </>
                          )}
                    </CustomizableButton>
                  )}

                  {savedDefaultInfo && onClearDefaultState && (
                    <CustomizableButton
                      buttonId="storyboard_operations_modal_btn_2"
                      defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                      type="button"
onClick={() => {
                        onClearDefaultState();
                        showFeedback("Cleared saved default state.");
                      }}
className="px-3 py-2 bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 border border-rose-900/50 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
title={uiText("components_storyboard_operations_modal.button.clear_the_saved_persistent_default_state.title", "Clear the saved persistent default state")}
                    >
                        {() => (
                            <>
                              <span>{uiText("components_storyboard_operations_modal.span.clear_default", "Clear Default")}</span>
                            </>
                          )}
                    </CustomizableButton>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Bar */}
        {feedbackNotice && (
          <div className="px-4 py-2 bg-emerald-950/80 border-t border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-100">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{feedbackNotice}</span>
            </span>
          </div>
        )}

        {/* Modal Footer */}
        <div className="bg-[#0b1329] px-4 py-2.5 border-t border-[#1e293b] flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            {slots.length}{uiText("components_storyboard_operations_modal.span.total_slots", " total slots • ")}{slots.filter((s) => s.url).length}{uiText("components_storyboard_operations_modal.span.filled", " filled • ")}{selectedCount}{uiText("components_storyboard_operations_modal.span.selected_2", " selected")}
          </span>
          <CustomizableButton
            buttonId="storyboard_operations_modal_btn_1"
            onClick={onClose}
className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all cursor-pointer"
          >
              {() => (
                  <>
                    {uiText("components_storyboard_operations_modal.button.done", "Done")}
                  </>
                )}
          </CustomizableButton>
        </div>
      </div>
    </div>
  );
};
