import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  GitBranch,
  ImagePlus,
  Lock,
  LockOpen,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export type SequencerWrapMode = "loop" | "pingpong" | "once";
export type SequencerTurnMode = "step" | "spin" | "pulse";
export type SequencerWarp = "none" | "bend" | "arc" | "wave" | "fisheye" | "tilt";
export type SequencerPreset = "all" | "snake" | "columns" | "spiral" | "ring";

export interface SequencerSource {
  id: string;
  name: string;
  url: string;
  timestamp: string;
}

export interface SequencerPanelState {
  /** Secondary artwork chosen for each front-page slot. */
  secondaryImages: Record<number, string>;
  /** Slots currently switched on in the Sequence Selection Matrix. */
  activeSlots: number[];
  /** Ordered runtime path shown by the transport. */
  path: number[];
  wrapMode: SequencerWrapMode;
  turnMode: SequencerTurnMode;
  warp: SequencerWarp;
  preset: SequencerPreset;
  stepIntervalMs: number;
  currentStep: number;
  direction: 1 | -1;
  playing: boolean;
  /** When bypassed, the front page ignores the sequencer runtime. */
  bypassed: boolean;
  /** When locked, source assignments cannot be replaced accidentally. */
  locked: boolean;
  /** When true, locked padlock icon is displayed on front screen panels with mouse-over images. Default is false. */
  showMouseOverLockIcons?: boolean;
  notes: string;
}

export const SEQUENCER_SOURCE_IMAGES = [
  "/sequencer/sources/source-01.jpg",
  "/sequencer/sources/source-02.jpg",
  "/sequencer/sources/source-03.jpg",
  "/sequencer/sources/source-04.jpg",
  "/sequencer/sources/source-05.jpg",
  "/sequencer/sources/source-06.jpg",
  "/sequencer/sources/source-07.jpg",
  "/sequencer/sources/source-08.jpg",
  "/sequencer/sources/source-09.jpg",
  "/sequencer/sources/source-10.jpg",
  "/sequencer/sources/source-11.jpg",
  "/sequencer/sources/source-12.jpg",
];

/** Clean default opening state without hardcoded secondary locks so windows are not permanently stuck. */
export const DEFAULT_SEQUENCER_PANEL_STATE: SequencerPanelState = {
  secondaryImages: {},
  activeSlots: Array.from({ length: 16 }, (_, index) => index + 1),
  path: [1, 2, 3, 4, 8, 12, 16, 9],
  wrapMode: "loop",
  turnMode: "step",
  warp: "bend",
  preset: "ring",
  stepIntervalMs: 900,
  currentStep: 1,
  direction: 1,
  playing: false,
  bypassed: false,
  locked: false,
  showMouseOverLockIcons: false,
  notes: "",
};

export function createSequencerPanelState(totalSlots = 16): SequencerPanelState {
  const slots = Array.from({ length: totalSlots }, (_, index) => index + 1);
  return {
    ...DEFAULT_SEQUENCER_PANEL_STATE,
    secondaryImages: {},
    activeSlots: slots,
    path: getPresetPath("ring", totalSlots),
  };
}

export function getPresetPath(preset: SequencerPreset, totalSlots: number): number[] {
  const side = totalSlots === 9 ? 3 : 4;

  switch (preset) {
    case "snake": {
      const result: number[] = [];
      for (let row = 0; row < side; row += 1) {
        for (let col = 0; col < side; col += 1) {
          const orderedCol = row % 2 === 0 ? col : side - 1 - col;
          result.push(row * side + orderedCol + 1);
        }
      }
      return result;
    }
    case "columns": {
      const result: number[] = [];
      for (let col = 0; col < side; col += 1) {
        for (let row = 0; row < side; row += 1) result.push(row * side + col + 1);
      }
      return result;
    }
    case "spiral":
      return side === 4
        ? [1, 2, 3, 4, 8, 12, 16, 15, 14, 13, 9, 5, 6, 7, 11, 10]
        : [1, 2, 3, 6, 9, 8, 7, 4, 5];
    case "ring":
      return side === 4
        ? [1, 2, 3, 4, 8, 12, 16, 9]
        : [1, 2, 3, 6, 9, 8, 7, 4];
    case "all":
    default:
      return Array.from({ length: totalSlots }, (_, index) => index + 1);
  }
}

/** Shared by the deck preview and the live front-page board. */
export function getSequencerRuntimeStyle(
  warp: SequencerWarp,
  turnMode: SequencerTurnMode,
  isActive: boolean,
  intervalMs: number,
): React.CSSProperties {
  if (!isActive) return {};

  const warpTransform: Record<SequencerWarp, string> = {
    none: "",
    bend: "perspective(450px) rotateX(12deg) skewY(-3deg)",
    arc: "perspective(500px) rotateY(-14deg) scale(1.05)",
    wave: "perspective(420px) rotateZ(3deg) skewX(5deg)",
    fisheye: "scale(1.14)",
    tilt: "perspective(480px) rotateX(-12deg) rotateY(12deg)",
  };

  const turnTransform: Record<SequencerTurnMode, string> = {
    step: "",
    spin: "animate-[sequencer-spin_0.85s_linear_infinite]",
    pulse: "animate-[sequencer-pulse_0.75s_ease-in-out_infinite]",
  };

  const style: React.CSSProperties = {
    transition: `transform ${Math.min(intervalMs * 0.45, 420)}ms cubic-bezier(0.2, 0.9, 0.3, 1.2)`,
  };

  if (warp !== "none") style.transform = warpTransform[warp];
  if (turnMode === "spin") {
    style.animation = "sequencer-spin 0.9s linear infinite";
  } else if (turnMode === "pulse") {
    style.animation = "sequencer-pulse 0.75s ease-in-out infinite";
  }

  return style;
}

const VIEWER_SURFACE =
  "rounded-2xl border border-[#112439] bg-gradient-to-b from-[#071322] to-[#040913] shadow-[0_12px_32px_rgba(0,0,0,0.6)]";
const CONTROL_SURFACE =
  "rounded-2xl border border-[#12283f] bg-gradient-to-b from-[#061424] to-[#030913] shadow-[0_10px_28px_rgba(0,0,0,0.55)]";
const RED_TILE_STYLE: React.CSSProperties = {
  backgroundColor: "#160507",
  backgroundImage:
    "linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(127,29,29,0.3) 50%, rgba(41,5,8,0.85) 100%)",
};

interface SequencerPanelProps {
  totalSlots: number;
  is4x4: boolean;
  sources: SequencerSource[];
  state: SequencerPanelState;
  setState: React.Dispatch<React.SetStateAction<SequencerPanelState>>;
  sourceUploadRef: React.RefObject<HTMLInputElement | null>;
  onAddSource: (source: SequencerSource) => void;
  onDeleteSource: (id: string) => void;
  onToggleLock: () => void;
  showToast: (message: string) => void;
}

export const SequencerPanel: React.FC<SequencerPanelProps> = ({
  totalSlots,
  is4x4,
  sources: incomingSources,
  state,
  setState,
  sourceUploadRef,
  onAddSource,
  onDeleteSource,
  onToggleLock,
  showToast,
}) => {
  const columns = is4x4 ? 4 : 3;
  const slotList = useMemo(
    () => Array.from({ length: totalSlots }, (_, index) => index + 1),
    [totalSlots],
  );
  const [sources, setSources] = useState<SequencerSource[]>(() => incomingSources.slice(0, 12));
  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    () => incomingSources[4]?.id || incomingSources[0]?.id || "",
  );
  const [selectedSlot, setSelectedSlot] = useState<number>(1);

  useEffect(() => {
    setSources(incomingSources.slice(0, 12));
  }, [incomingSources]);

  useEffect(() => {
    if (!sources.some((source) => source.id === selectedSourceId)) {
      setSelectedSourceId(sources[0]?.id || "");
    }
  }, [sources, selectedSourceId]);

  const runtimePath = useMemo(
    () => state.path.filter((slot) => slot <= totalSlots && state.activeSlots.includes(slot)),
    [state.path, state.activeSlots, totalSlots],
  );

  const activeRuntimeSlot = runtimePath[state.currentStep - 1] ?? null;
  const selectedSource = sources.find((source) => source.id === selectedSourceId) || sources[0];
  const assignedCount = Object.values(state.secondaryImages).filter(Boolean).length;
  const isLive = !state.bypassed && runtimePath.length > 0;

  const updateState = (updates: Partial<SequencerPanelState>) => {
    setState((previous) => ({ ...previous, ...updates }));
  };

  const startRuntimeIfPossible = (extra: Partial<SequencerPanelState> = {}) => {
    setState((previous) => {
      const merged: SequencerPanelState = {
        ...previous,
        ...extra,
        bypassed: false,
      };
      const candidatePath = merged.path.filter(
        (slot) => slot <= totalSlots && merged.activeSlots.includes(slot),
      );
      return {
        ...merged,
        playing: candidatePath.length > 0 ? true : previous.playing,
        currentStep: previous.currentStep > candidatePath.length ? 1 : previous.currentStep,
      };
    });
  };

  const handleSlotClick = (slot: number) => {
    setSelectedSlot(slot);
    setState((previous) => {
      const isActive = previous.activeSlots.includes(slot);
      const nextSecondary = { ...previous.secondaryImages };
      if (isActive) {
        delete nextSecondary[slot];
      }
      return {
        ...previous,
        activeSlots: isActive
          ? previous.activeSlots.filter((candidate) => candidate !== slot)
          : [...previous.activeSlots, slot].sort((a, b) => a - b),
        secondaryImages: nextSecondary,
        currentStep: 1,
      };
    });
  };

  const handleSourceClick = (source: SequencerSource) => {
    setSelectedSourceId(source.id);
    if (state.locked) {
      showToast("Images are locked in — unlock to replace an assignment");
      return;
    }

    const targetSlot = selectedSlot > totalSlots ? 1 : selectedSlot;
    setState((previous) => ({
      ...previous,
      secondaryImages: { ...previous.secondaryImages, [targetSlot]: source.url },
      activeSlots: previous.activeSlots.includes(targetSlot)
        ? previous.activeSlots
        : [...previous.activeSlots, targetSlot].sort((a, b) => a - b),
      currentStep: 1,
    }));
    showToast(`✓ Secondary image assigned to slot #${targetSlot}`);
  };

  const handleClearSlotSecondary = (slot: number) => {
    setState((previous) => {
      const next = { ...previous.secondaryImages };
      delete next[slot];
      return { ...previous, secondaryImages: next };
    });
    showToast(`✓ Unlocked and cleared slot #${slot}`);
  };

  const handleClearAllSecondary = () => {
    setState((previous) => ({
      ...previous,
      secondaryImages: {},
    }));
    showToast("✓ Unlocked and cleared all secondary images");
  };

  const toggleMouseOverLockIcons = () => {
    const nextVal = !state.showMouseOverLockIcons;
    setState((previous) => ({
      ...previous,
      showMouseOverLockIcons: nextVal,
    }));
    showToast(
      nextVal
        ? "✓ Mouse-over lock icons shown on front screen"
        : "Mouse-over lock icons hidden on front screen (default off)",
    );
  };

  const handleBulkSlots = (action: "all" | "blank" | "invert") => {
    setState((previous) => {
      const nextActive =
        action === "all"
          ? [...slotList]
          : action === "blank"
            ? []
            : slotList.filter((slot) => !previous.activeSlots.includes(slot));
      const nextSecondary = { ...previous.secondaryImages };
      Object.keys(nextSecondary).forEach((k) => {
        const slotNum = Number(k);
        if (!nextActive.includes(slotNum)) {
          delete nextSecondary[slotNum];
        }
      });
      return {
        ...previous,
        activeSlots: nextActive,
        secondaryImages: nextSecondary,
        currentStep: 1,
      };
    });
  };

  const handlePreset = (preset: SequencerPreset) => {
    const path = getPresetPath(preset, totalSlots);
    startRuntimeIfPossible({ preset, path });
    showToast(`✓ ${preset[0].toUpperCase()}${preset.slice(1)} path active`);
  };

  const handleWrapMode = (wrapMode: SequencerWrapMode) => {
    startRuntimeIfPossible({ wrapMode });
    showToast(`✓ ${wrapMode === "pingpong" ? "Ping-pong" : wrapMode} sequence active`);
  };

  const handleTurnMode = (turnMode: SequencerTurnMode) => {
    startRuntimeIfPossible({ turnMode });
    showToast(`✓ ${turnMode} turn applied to live panel`);
  };

  const handleWarp = (warp: SequencerWarp) => {
    startRuntimeIfPossible({ warp });
    showToast(`✓ ${warp} warp applied`);
  };

  const handleSourceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result?.toString() || "";
      if (!url) return;
      const source: SequencerSource = {
        id: `seq_source_${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, ""),
        url,
        timestamp: new Date().toISOString(),
      };
      setSources((previous) => [source, ...previous].slice(0, 12));
      setSelectedSourceId(source.id);
      onAddSource(source);
      showToast(`✓ Added "${source.name}" to Saved sources`);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleDeleteSelectedSource = () => {
    if (!selectedSource) {
      showToast("Select a saved source to remove");
      return;
    }
    if (state.locked) {
      showToast("Unlock images before removing a saved source");
      return;
    }
    setSources((previous) => previous.filter((source) => source.id !== selectedSource.id));
    setState((previous) => {
      const secondaryImages = { ...previous.secondaryImages };
      Object.keys(secondaryImages).forEach((key) => {
        if (secondaryImages[Number(key)] === selectedSource.url) delete secondaryImages[Number(key)];
      });
      return { ...previous, secondaryImages };
    });
    onDeleteSource(selectedSource.id);
    showToast(`✓ Removed "${selectedSource.name}"`);
  };

  const toggleBypass = () => {
    setState((previous) => ({
      ...previous,
      bypassed: !previous.bypassed,
      playing: previous.bypassed ? previous.playing : false,
    }));
    showToast(state.bypassed ? "✓ Sequencer transmitting to front page" : "Sequencer bypassed");
  };

  const togglePlayback = () => {
    setState((previous) => ({
      ...previous,
      playing: !previous.playing,
      bypassed: false,
      currentStep: previous.currentStep > runtimePath.length ? 1 : previous.currentStep,
    }));
  };

  const activeRuntimeStyle = getSequencerRuntimeStyle(
    state.warp,
    state.turnMode,
    state.playing && isLive,
    state.stepIntervalMs,
  );

  return (
    <div className="flex w-full flex-col gap-2 text-slate-200 select-none">
      <input
        ref={sourceUploadRef}
        type="file"
        accept="image/*"
        onChange={handleSourceUpload}
        className="hidden"
      />

      {/* Compact single-line notes and live telemetry strip */}
      <div className="relative h-7 shrink-0 rounded-xl border border-[#112b3e] bg-[#050c17]/90 flex items-center px-3 justify-between">
        <input
          type="text"
          value={state.notes}
          onChange={(event) => updateState({ notes: event.target.value })}
          aria-label={uiText("sequencer.notes.aria_label", "Sequence runtime notes")}
          className="h-full flex-1 bg-transparent text-[11px] text-slate-200 outline-none placeholder:text-slate-600"
          placeholder={uiText("sequencer.notes.placeholder", "Sequence runtime notes...")}
        />
        <div className="flex items-center gap-2 text-[8.5px] font-mono tracking-wider text-slate-500 shrink-0">
          <span className={cn("h-1.5 w-1.5 rounded-full", isLive ? "bg-emerald-400" : "bg-slate-700")} />
          <span>{isLive ? "Front page live" : "Bypassed"}</span>
        </div>
      </div>

      {/* Three inline viewers — compacted to fit cleanly in pane without vertical scrolling */}
      <div className="grid h-[215px] min-h-0 shrink-0 grid-cols-1 md:grid-cols-3 gap-2 overflow-hidden">
        {/* VIEWER 1 — Sequence selection matrix */}
        <section className={cn(VIEWER_SURFACE, "flex min-h-0 min-w-0 flex-col overflow-hidden p-2")}>
          <div className="mb-1 flex h-5 shrink-0 items-center justify-between px-1">
            <CustomizableLabel
              labelId="sequencer_panel_item_17"
              as="h3"
              className="text-xs font-bold tracking-tight text-white"
            >
                {() => (
                    <>
                      {uiText("sequencer.matrix_title", "Sequence selection matrix")}
                    </>
                  )}
            </CustomizableLabel>
            <span className="text-[8.5px] font-mono text-cyan-400 font-bold">
              {runtimePath.length} steps
            </span>
          </div>

          <div
            className="grid min-h-0 flex-1 gap-1"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {slotList.map((slot) => {
              const active = state.activeSlots.includes(slot);
              const pathIndex = runtimePath.indexOf(slot);
              const isRuntimeSlot = state.playing && isLive && activeRuntimeSlot === slot;
              const slotImage = state.secondaryImages[slot];
              const isSelected = selectedSlot === slot;

              return (
                <CustomizableButton
                  buttonId="sequencer_panel_btn_16"
                  key={`sequence-matrix-${slot}`}
type="button"
onClick={() => handleSlotClick(slot)}
title={`Slot #${slot} — ${active ? "active" : "off"}`}
className={cn(
                    "relative min-h-0 overflow-hidden rounded-lg border text-center transition-all cursor-pointer",
                    active
                      ? "border-emerald-500/80 bg-[#151c18]"
                      : "border-slate-800 bg-[#09101b] opacity-60",
                    isRuntimeSlot && "border-cyan-300 ring-2 ring-cyan-400/50",
                    isSelected && "outline outline-1 outline-amber-400",
                  )}
                >
                    {() => (
                        <>
                          {slotImage && (
                    <img
                      src={slotImage}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-25 grayscale-[0.3]"
                    />
                  )}
                        <span className="absolute left-1 top-0.5 text-[7px] font-mono text-slate-400">
                    {pathIndex >= 0 ? `P${pathIndex + 1}` : ""}
                  </span>
                        <span className="relative z-10 flex h-full flex-col items-center justify-center">
                    <span className="text-xs font-black text-white">#{slot}</span>
                    <span
                      className={cn(
                        "text-[7px] font-mono font-bold leading-none",
                        active ? "text-emerald-400" : "text-slate-500",
                      )}
                    >
                      {active ? "ON" : "OFF"}
                    </span>
                  </span>
                        </>
                      )}
                </CustomizableButton>
              );
            })}
          </div>

          <div className="mt-1 flex h-6 shrink-0 items-center justify-between gap-1 px-0.5">
            <div className="flex items-center gap-1">
              {(["all", "blank", "invert"] as const).map((action) => (
                <CustomizableButton
                  buttonId="sequencer_panel_btn_15"
                  key={`bulk-${action}`}
type="button"
onClick={() => handleBulkSlots(action)}
className="h-[18px] px-1.5 text-[8.5px] font-bold rounded-md border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-300 capitalize cursor-pointer transition-colors"
                >
                    {() => (
                        <>
                          {action}
                        </>
                      )}
                </CustomizableButton>
              ))}
            </div>
            <CustomizableButton
              buttonId="sequencer_panel_btn_14"
              type="button"
onClick={onToggleLock}
title={state.locked ? "Unlock secondary assignments" : "Lock secondary assignments"}
className={cn(
                "h-[18px] px-1.5 flex items-center gap-1 rounded-md border text-[8.5px] font-bold cursor-pointer transition-colors",
                state.locked
                  ? "border-emerald-400/80 bg-emerald-500/20 text-emerald-300"
                  : "border-slate-700 bg-slate-900 text-slate-400 hover:text-white",
              )}
            >
                {() => (
                    <>
                      {state.locked ? <Lock className="h-2.5 w-2.5" /> : <LockOpen className="h-2.5 w-2.5" />}
                    <span>{state.locked ? "Locked" : "Unlocked"}</span>
                    </>
                  )}
            </CustomizableButton>
          </div>
        </section>

        {/* VIEWER 2 — Saved sources */}
        <section className={cn(VIEWER_SURFACE, "flex min-h-0 min-w-0 flex-col overflow-hidden p-2")}>
          <div className="mb-1 flex h-5 shrink-0 items-center justify-between px-1">
            <CustomizableLabel
              labelId="sequencer_panel_item_13"
              as="h3"
              className="text-xs font-bold tracking-tight text-[#9db4cc]"
            >
                {() => (
                    <>
                      {uiText("sequencer.saved_sources", "Saved sources")}
                    </>
                  )}
            </CustomizableLabel>
            <span className="text-[8.5px] font-mono text-slate-500">
              {sources.length} sources
            </span>
          </div>

          <div
            className="grid min-h-0 flex-1 grid-cols-3 gap-1 overflow-hidden"
            style={{ gridTemplateRows: "repeat(4, minmax(0, 1fr))" }}
          >
            {Array.from({ length: 12 }, (_, index) => {
              const source = sources[index];
              if (!source) {
                return (
                  <div
                    key={`empty-source-${index}`}
                    className="rounded-md border border-dashed border-slate-800 bg-[#07101d]"
                  />
                );
              }
              const selected = selectedSourceId === source.id;
              return (
                <CustomizableButton
                  buttonId="sequencer_panel_btn_12"
                  key={source.id}
type="button"
onClick={() => handleSourceClick(source)}
title={`${source.name} — assign to slot #${selectedSlot}`}
className={cn(
                    "group relative min-h-0 overflow-hidden rounded-md border bg-black transition-all cursor-pointer",
                    selected
                      ? "border-emerald-400 shadow-[0_0_8px_rgba(0,223,145,0.35)] ring-1 ring-emerald-400"
                      : "border-slate-800 opacity-90 hover:opacity-100",
                  )}
                >
                    {() => (
                        <>
                          <img src={source.url} alt={source.name} className="h-full w-full object-cover" />
                        {selected && (
                    <span className="absolute right-0.5 top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-400 text-slate-950">
                      <Check className="h-2 w-2 stroke-[3]" />
                    </span>
                  )}
                        </>
                      )}
                </CustomizableButton>
              );
            })}
          </div>

          <div className="mt-1 flex h-6 shrink-0 items-center justify-between gap-1 px-0.5">
            <CustomizableButton
              buttonId="sequencer_panel_btn_11"
              defaultIcon={<ImagePlus className="h-2.5 w-2.5" />}
              type="button"
onClick={() => sourceUploadRef.current?.click()}
className="flex h-[18px] items-center gap-1 rounded-md border border-emerald-400/60 bg-emerald-950/40 px-2 text-[8.5px] font-bold text-emerald-300 hover:bg-emerald-900/60 cursor-pointer transition-colors"
            >
                {() => (
                    <>
                      <span>+ Image</span>
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="sequencer_panel_btn_10"
              defaultIcon={<Trash2 className="h-2.5 w-2.5" />}
              type="button"
onClick={handleDeleteSelectedSource}
title={uiText("sequencer.delete_source.title", "Delete selected saved source")}
className="flex h-[18px] items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-1.5 text-[8.5px] text-slate-400 hover:text-rose-300 cursor-pointer transition-colors"
            />
          </div>
        </section>

        {/* VIEWER 3 — Preview with unassign/unlock support */}
        <section className={cn(VIEWER_SURFACE, "flex min-h-0 min-w-0 flex-col overflow-hidden p-2")}>
          <div className="mb-1 flex h-5 shrink-0 items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <CustomizableLabel
                labelId="sequencer_panel_item_9"
                as="h3"
                className="text-xs font-bold tracking-tight text-[#9db4cc]"
              >
                  {() => (
                      <>
                        {uiText("sequencer.preview", "Preview")}
                      </>
                    )}
              </CustomizableLabel>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isLive ? "bg-emerald-400 shadow-[0_0_6px_#00df91]" : "bg-slate-600",
                )}
              />
            </div>
            <span className="text-[8.5px] font-mono text-cyan-400">
              {assignedCount} assigned
            </span>
          </div>

          <div
            className="grid min-h-0 flex-1 gap-1"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {slotList.map((slot) => {
              const secondaryImage = state.activeSlots.includes(slot) ? state.secondaryImages[slot] : undefined;
              const isRuntimeSlot = state.playing && isLive && activeRuntimeSlot === slot;
              const pathIndex = runtimePath.indexOf(slot);

              return (
                <div
                  key={`secondary-preview-${slot}`}
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    "group relative min-h-0 overflow-hidden rounded-lg border border-slate-800 transition-all cursor-pointer",
                    isRuntimeSlot && "ring-2 ring-cyan-300/80 ring-offset-1 ring-offset-[#06101d]",
                    selectedSlot === slot && "border-amber-400",
                  )}
                  style={RED_TILE_STYLE}
                  title={
                    secondaryImage
                      ? `Slot #${slot} secondary image (click padlock or X to clear)`
                      : `Slot #${slot} (no secondary image)`
                  }
                >
                  {secondaryImage ? (
                    <>
                      <img
                        src={secondaryImage}
                        alt={`Slot ${slot}`}
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{
                          objectPosition: `${((slot - 1) % columns) * 33}% ${Math.floor((slot - 1) / columns) * 33}%`,
                        }}
                      />
                      <div className="pointer-events-none absolute inset-0 bg-[#c6202a]/15 mix-blend-color" />
                      {/* Clickable padlock icon representation */}
                      <CustomizableButton
                        buttonId="sequencer_panel_btn_8"
                        defaultIcon={<Lock className="h-2 w-2" />}
                        type="button"
onClick={(e) => {
                          e.stopPropagation();
                          handleClearSlotSecondary(slot);
                        }}
title={`Click to unlock and clear slot #${slot}`}
className="absolute right-0.5 top-0.5 z-10 rounded-full bg-black/70 hover:bg-rose-950 p-0.5 text-emerald-300 hover:text-rose-300 transition-colors cursor-pointer"
                      />
                      {/* Clickable quick unlock/remove button to prevent windows from staying permanently locked */}
                      <CustomizableButton
                        buttonId="sequencer_panel_btn_7"
                        defaultIcon={<X className="h-2 w-2 stroke-[3]" />}
                        type="button"
onClick={(e) => {
                          e.stopPropagation();
                          handleClearSlotSecondary(slot);
                        }}
title={`Unlock and clear secondary image for window #${slot}`}
className="absolute left-0.5 top-0.5 z-20 rounded bg-rose-950/90 hover:bg-rose-700 p-0.5 text-rose-200 border border-rose-500/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[9px] font-mono text-slate-600">
                      #{slot}
                    </div>
                  )}

                  {isRuntimeSlot && (
                    <div
                      className="pointer-events-none absolute inset-[2px] rounded border border-cyan-200/70"
                      style={activeRuntimeStyle}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-1 flex h-6 shrink-0 items-center justify-between gap-1 px-0.5">
            <span className="text-[8.5px] font-mono text-slate-400 truncate">
              Slot #{selectedSlot}
            </span>
            <CustomizableButton
              buttonId="sequencer_panel_clear_all"
              defaultLabel={"Clear all"}
              type="button"
onClick={handleClearAllSecondary}
title="Unlock and clear all secondary window assignments"
className="h-[18px] px-1.5 text-[8.5px] font-bold rounded-md border border-rose-500/40 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 cursor-pointer transition-colors"
            />
          </div>
        </section>
      </div>

      {/* Compact controls deck with 60% reduced button sizes */}
      <div className="grid h-[105px] min-h-0 shrink-0 grid-cols-1 md:grid-cols-3 gap-2">
        {/* SECTION 1: Sequence mode (60% smaller buttons) */}
        <section className={cn(CONTROL_SURFACE, "flex min-h-0 flex-col overflow-hidden p-2.5 justify-between")}>
          <div className="flex items-center justify-between">
            <CustomizableLabel
              labelId="sequencer_panel_item_6"
              as="h3"
              className="text-xs font-bold text-white"
            >
                {() => (
                    <>
                      {uiText("sequencer.sequence_mode", "Sequence mode")}
                    </>
                  )}
            </CustomizableLabel>
            <span className="text-[8.5px] font-mono text-slate-400 capitalize">
              {state.wrapMode} / {state.turnMode}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {([
              ["loop", "Loop"],
              ["pingpong", "Ping-pong"],
              ["once", "Once"],
              ["step", "Step"],
              ["spin", "Spin"],
              ["pulse", "Pulse"],
            ] as const).map(([id, label]) => {
              const isWrap = id === "loop" || id === "pingpong" || id === "once";
              const selected = isWrap ? state.wrapMode === id : state.turnMode === id;
              return (
                <CustomizableButton
                  buttonId="sequencer_panel_btn_5"
                  key={id}
type="button"
onClick={() =>
                    isWrap
                      ? handleWrapMode(id as SequencerWrapMode)
                      : handleTurnMode(id as SequencerTurnMode)
                  }
className={cn(
                    "h-[20px] rounded-md border text-[9px] font-bold transition-all cursor-pointer flex items-center justify-center px-1 leading-none",
                    selected
                      ? isWrap
                        ? "border-[#8f5bd8] bg-[#3b1c68] text-[#ead8ff] shadow-xs"
                        : "border-[#36c9e8] bg-[#0d687f] text-[#d9fbff] shadow-xs"
                      : "border-slate-800 bg-[#091322] text-slate-400 hover:text-slate-200",
                  )}
                >
                    {() => (
                        <>
                          {label}
                        </>
                      )}
                </CustomizableButton>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-400 pt-0.5 border-t border-slate-800/80">
            <span>Front page link:</span>
            <span className={cn("font-bold", isLive ? "text-emerald-400" : "text-slate-500")}>
              {isLive ? "Live link" : "Bypassed"}
            </span>
          </div>
        </section>

        {/* SECTION 2: Transport controls */}
        <section className={cn(CONTROL_SURFACE, "flex min-h-0 flex-col overflow-hidden p-2.5 justify-between")}>
          <div className="flex items-center gap-2">
            <CustomizableButton
              buttonId="sequencer_panel_btn_4"
              type="button"
onClick={togglePlayback}
title={state.playing ? "Pause sequence" : "Play sequence on front page"}
className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-950 font-bold transition-all active:scale-95 cursor-pointer shadow-xs",
                state.playing ? "bg-amber-400" : "bg-[#00d68a]",
              )}
            >
                {() => (
                    <>
                      {state.playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                    </>
                  )}
            </CustomizableButton>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  {uiText("sequencer.transport", "Transport")}
                </span>
                <span className="text-[10px] font-mono font-bold text-cyan-300">
                  Step {Math.min(state.currentStep, runtimePath.length || 1)}/{runtimePath.length}
                </span>
              </div>
              <div className="mt-1 h-[4px] overflow-hidden rounded-full bg-[#18263b]">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all duration-200"
                  style={{
                    width: `${runtimePath.length ? (Math.min(state.currentStep, runtimePath.length) / runtimePath.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
            <span className="text-[8.5px] font-mono text-slate-400 shrink-0">
              Speed: {state.stepIntervalMs}ms
            </span>
            <input
              type="range"
              min={120}
              max={2500}
              step={20}
              value={state.stepIntervalMs}
              onChange={(event) => updateState({ stepIntervalMs: Number(event.target.value) })}
              className="sequencer-range h-1 w-full cursor-pointer rounded-full"
            />
          </div>
        </section>

        {/* SECTION 3: Path presets & Warp distortion (60% smaller buttons) */}
        <section className={cn(CONTROL_SURFACE, "flex min-h-0 flex-col overflow-hidden p-2.5 justify-between")}>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8.5px] font-mono font-bold tracking-wider text-slate-400">
                Path presets
              </span>
              <span className="text-[8px] font-mono text-cyan-400 uppercase">{state.preset}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(["all", "snake", "columns", "spiral", "ring"] as const).map((preset) => (
                <CustomizableButton
                  buttonId="sequencer_panel_btn_3"
                  key={`preset-${preset}`}
type="button"
onClick={() => handlePreset(preset)}
className={cn(
                    "h-[18px] px-1.5 py-0 text-[8.5px] rounded-md font-bold leading-none capitalize transition-all cursor-pointer border",
                    state.preset === preset
                      ? "border-cyan-400/80 bg-[#0b3a49] text-cyan-200"
                      : "border-slate-800 bg-[#071322] text-slate-400 hover:text-slate-200",
                  )}
                >
                    {() => (
                        <>
                          {preset}
                        </>
                      )}
                </CustomizableButton>
              ))}
            </div>
          </div>

          <div className="pt-1 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8.5px] font-mono font-bold tracking-wider text-slate-400">
                Warp distortion
              </span>
              <span className="text-[8px] font-mono text-cyan-400 uppercase">{state.warp}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(["none", "bend", "arc", "wave", "fisheye", "tilt"] as const).map((warp) => (
                <CustomizableButton
                  buttonId="sequencer_panel_btn_2"
                  key={`warp-${warp}`}
type="button"
onClick={() => handleWarp(warp)}
className={cn(
                    "h-[18px] px-1.5 py-0 text-[8px] rounded-md font-bold leading-none uppercase transition-all cursor-pointer border",
                    state.warp === warp
                      ? "border-cyan-400/80 bg-[#0c6e85] text-white"
                      : "border-slate-800 bg-[#071322] text-slate-400 hover:text-slate-200",
                  )}
                >
                    {() => (
                        <>
                          {warp}
                        </>
                      )}
                </CustomizableButton>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* DROPPED DOWN TO THE END: Sequencer bypassed panel + Front screen lock icons toggle */}
      <section className={cn(CONTROL_SURFACE, "h-[46px] shrink-0 rounded-xl px-3 flex items-center justify-between gap-3")}>
        {/* Left: Sequencer bypassed switch */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <GitBranch className={cn("h-4 w-4", state.bypassed ? "text-slate-500" : "text-emerald-400")} />
            <span className="text-xs font-bold text-white">
              {state.bypassed ? "Sequencer bypassed" : "Sequencer active"}
            </span>
          </div>

          <CustomizableButton
            buttonId="sequencer_panel_btn_1"
            type="button"
onClick={toggleBypass}
title={state.bypassed ? "Transmit sequence to front page" : "Bypass front-page sequence"}
className={cn(
              "relative h-5 w-10 shrink-0 rounded-full p-[2px] transition-colors cursor-pointer",
              state.bypassed ? "bg-slate-700" : "bg-[#00d68a]",
            )}
          >
              {() => (
                  <>
                    <span
              className={cn(
                "block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                !state.bypassed && "translate-x-5",
              )}
            />
                  </>
                )}
          </CustomizableButton>
        </div>

        {/* Center: Live runtime chips */}
        <div className="hidden sm:flex items-center gap-2 text-[9px] font-mono text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            Slot: <strong className="text-cyan-300">{activeRuntimeSlot ? `#${activeRuntimeSlot}` : "—"}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            Mode: <strong className="text-slate-200">{state.wrapMode}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            Warp: <strong className="text-slate-200">{state.warp}</strong>
          </span>
        </div>

        {/* Right: Front screen lock icon representation toggle + Unlock all button */}
        <div className="flex items-center gap-2 shrink-0">
          <CustomizableButton
            buttonId="sequencer_panel_toggle_mouse_over_locked_icon_repr"
            defaultIcon={<Lock className="w-2.5 h-2.5 text-emerald-400" />}
            type="button"
onClick={toggleMouseOverLockIcons}
title="Toggle mouse-over locked icon representation on front screen (Default: Off)"
className={cn(
              "h-[24px] px-2 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-xs active:scale-95",
              state.showMouseOverLockIcons
                ? "border-emerald-400/80 bg-emerald-950/60 text-emerald-300 shadow-[0_0_8px_rgba(0,223,145,0.3)]"
                : "border-slate-700 bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:border-slate-600",
            )}
          >
              {() => (
                  <>
                    <span>Front screen lock icons:</span>
                  <strong className={state.showMouseOverLockIcons ? "text-emerald-300" : "text-slate-500"}>
              {state.showMouseOverLockIcons ? "ON" : "OFF"}
            </strong>
                  </>
                )}
          </CustomizableButton>

          <CustomizableButton
            buttonId="sequencer_panel_unlock_and_clear_all_secondary_win"
            defaultIcon={<RotateCcw className="w-2.5 h-2.5" />}
            type="button"
onClick={handleClearAllSecondary}
title="Unlock and clear all secondary window assignments"
className="h-[24px] px-2 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1 border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 cursor-pointer transition-colors"
          >
              {() => (
                  <>
                    <span>Reset windows</span>
                  </>
                )}
          </CustomizableButton>
        </div>
      </section>
    </div>
  );
};
