import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Zap,
  Film,
  Download,
  Sliders,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Layers,
  Scissors,
  Crop as CropIcon,
  Check,
  AlertCircle,
  Video,
  Type,
  Clock,
  FileVideo,
  Image as ImageIcon,
  Edit3,
  GripVertical,
} from "lucide-react";
import { cn } from "../utils/cn";
import { HoldButton } from "./HoldButton";
import { useButtonCustomization } from "../context/ButtonCustomizationContext";
import { CustomizableButton } from "./CustomizableButton";
import { CustomizableLabel } from "./CustomizableLabel";
import {
  exportSequenceMovie,
  ExportFormat,
  sanitizeExportFilename,
} from "../utils/sequenceExport";
import { uiText } from "../hooks/useUIConfig";
import { remoteStore } from "../services/remoteKeyValueStore";

export type TransitionEffect = "none" | "crossfade" | "slide-left" | "slide-right" | "zoom" | "fade-black" | "pause";
export type LoopMode = "loop" | "ping-pong" | "once";
export type AniSidebarPanelId = "speed" | "transitions" | "export";
export type AniColumnId = "stage" | "controls";

export interface FrameItem {
  url: string;
  name: string;
  story?: string;
}

interface FramePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyboardSlots: Array<{ url: string | null; name: string; story: string }>;
  storyboardSlices: Array<{ url: string; name: string }>;
  onResendFrameToCarve?: (url: string, name?: string) => void;
  onResendFrameToCrop?: (url: string) => void;
}

export const FramePlayerModal: React.FC<FramePlayerModalProps> = ({
  isOpen,
  onClose,
  storyboardSlots = [],
  storyboardSlices = [],
  onResendFrameToCarve,
  onResendFrameToCrop,
}) => {
  const [sequenceSource, setSequenceSource] = useState<"storyboard" | "slices">("storyboard");
  const [fps, setFps] = useState<number>(1);
  const [transitionEffect, setTransitionEffect] = useState<TransitionEffect>("zoom");
  const [transitionDuration, setTransitionDuration] = useState<number>(0.2); // seconds
  const [pauseDuration, setPauseDuration] = useState<number>(2.0); // pause slide x seconds
  const [loopMode, setLoopMode] = useState<LoopMode>("loop");

  // Playback State
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playDirection, setPlayDirection] = useState<"forward" | "reverse">("forward");

  // Canvas / Video Export state
  const [exportFormat, setExportFormat] = useState<ExportFormat>("mp4");
  const [exportFilename, setExportFilename] = useState<string>("storyboard_sequence");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatusText, setExportStatusText] = useState<string>("");
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastStepTimeRef = useRef<number>(0);
  const isPingPongReverseRef = useRef<boolean>(false);
  const prevFrameIdxRef = useRef<number>(0);
  const animFrameReqRef = useRef<number | null>(null);

  const { showAniPlayerDragHandles } = useButtonCustomization();

  // Panels and columns drag and drop reordering
  const [aniPanelsOrder, setAniPanelsOrder] = useState<AniSidebarPanelId[]>(() => {
    try {
      const saved = remoteStore.getItem("seqcarver_aniplayer_panels_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 3) return parsed;
      }
    } catch {}
    return ["speed", "transitions", "export"];
  });

  const [aniColumnsOrder, setAniColumnsOrder] = useState<AniColumnId[]>(() => {
    try {
      const saved = remoteStore.getItem("seqcarver_aniplayer_columns_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 2) return parsed;
      }
    } catch {}
    return ["stage", "controls"];
  });

  const [aniTransportOrder, setAniTransportOrder] = useState<string[]>(() => {
    try {
      const saved = remoteStore.getItem("seqcarver_aniplayer_transport_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 5) return parsed;
      }
    } catch {}
    return ["ani_play_reverse", "ani_play_pause", "ani_step_next", "ani_play_fwd", "ani_loop_mode"];
  });

  // Visual drag state for highlighting
  const [draggedAniPanel, setDraggedAniPanel] = useState<string | null>(null);
  const [dragOverAniPanel, setDragOverAniPanel] = useState<string | null>(null);

  const [draggedAniColumn, setDraggedAniColumn] = useState<string | null>(null);
  const [dragOverAniColumn, setDragOverAniColumn] = useState<string | null>(null);

  const [draggedTransportItem, setDraggedTransportItem] = useState<string | null>(null);
  const [dragOverTransportItem, setDragOverTransportItem] = useState<string | null>(null);

  // Toggle to show / hide all other panels in AniPlayer for maximum viewing area
  const [hideOtherPanels, setHideOtherPanels] = useState<boolean>(() => {
    try {
      return remoteStore.getItem("seqcarver_aniplayer_hide_panels") === "true";
    } catch {
      return false;
    }
  });

  const toggleHideOtherPanels = useCallback(() => {
    setHideOtherPanels((prev) => {
      const next = !prev;
      try {
        remoteStore.setItem("seqcarver_aniplayer_hide_panels", String(next));
      } catch {}
      return next;
    });
  }, []);

  // Drag handlers for sidebar panels
  const handleAniPanelDragStart = (e: React.DragEvent, panelId: AniSidebarPanelId) => {
    e.stopPropagation();
    setDraggedAniPanel(panelId);
    e.dataTransfer.setData("application/x-anipanel", panelId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleAniPanelDragOver = (e: React.DragEvent, panelId: AniSidebarPanelId) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragOverAniPanel !== panelId) {
      setDragOverAniPanel(panelId);
    }
  };

  const handleAniPanelDragEnd = () => {
    setDraggedAniPanel(null);
    setDragOverAniPanel(null);
  };

  const handleAniPanelDrop = (e: React.DragEvent, targetPanelId: AniSidebarPanelId) => {
    e.preventDefault();
    e.stopPropagation();
    const sourcePanelId = (e.dataTransfer.getData("application/x-anipanel") || draggedAniPanel) as AniSidebarPanelId;
    setDraggedAniPanel(null);
    setDragOverAniPanel(null);

    if (sourcePanelId && sourcePanelId !== targetPanelId) {
      setAniPanelsOrder((prev) => {
        const copy = [...prev];
        const srcIdx = copy.indexOf(sourcePanelId);
        const tgtIdx = copy.indexOf(targetPanelId);
        if (srcIdx !== -1 && tgtIdx !== -1) {
          copy.splice(srcIdx, 1);
          copy.splice(tgtIdx, 0, sourcePanelId);
          try {
            remoteStore.setItem("seqcarver_aniplayer_panels_v2", JSON.stringify(copy));
          } catch {}
          return copy;
        }
        return prev;
      });
    }
  };

  // Drag handlers for stage vs controls columns
  const handleAniColumnDragStart = (e: React.DragEvent, colId: AniColumnId) => {
    e.stopPropagation();
    setDraggedAniColumn(colId);
    e.dataTransfer.setData("application/x-anicolumn", colId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleAniColumnDragOver = (e: React.DragEvent, colId: AniColumnId) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragOverAniColumn !== colId) {
      setDragOverAniColumn(colId);
    }
  };

  const handleAniColumnDragEnd = () => {
    setDraggedAniColumn(null);
    setDragOverAniColumn(null);
  };

  const handleAniColumnDrop = (e: React.DragEvent, targetColId: AniColumnId) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceColId = (e.dataTransfer.getData("application/x-anicolumn") || draggedAniColumn) as AniColumnId;
    setDraggedAniColumn(null);
    setDragOverAniColumn(null);

    if (sourceColId && sourceColId !== targetColId) {
      setAniColumnsOrder((prev) => {
        const copy = [...prev];
        const srcIdx = copy.indexOf(sourceColId);
        const tgtIdx = copy.indexOf(targetColId);
        if (srcIdx !== -1 && tgtIdx !== -1) {
          copy.splice(srcIdx, 1);
          copy.splice(tgtIdx, 0, sourceColId);
          try {
            remoteStore.setItem("seqcarver_aniplayer_columns_v2", JSON.stringify(copy));
          } catch {}
          return copy;
        }
        return prev;
      });
    }
  };

  // Drag handlers for transport bar controls
  const handleTransportItemDragStart = (e: React.DragEvent, itemId: string) => {
    e.stopPropagation();
    setDraggedTransportItem(itemId);
    e.dataTransfer.setData("application/x-anitransport", itemId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleTransportItemDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragOverTransportItem !== itemId) {
      setDragOverTransportItem(itemId);
    }
  };

  const handleTransportItemDragEnd = () => {
    setDraggedTransportItem(null);
    setDragOverTransportItem(null);
  };

  const handleTransportItemDrop = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceItemId = e.dataTransfer.getData("application/x-anitransport") || draggedTransportItem;
    setDraggedTransportItem(null);
    setDragOverTransportItem(null);

    if (sourceItemId && sourceItemId !== targetItemId) {
      setAniTransportOrder((prev) => {
        const copy = [...prev];
        const srcIdx = copy.indexOf(sourceItemId);
        const tgtIdx = copy.indexOf(targetItemId);
        if (srcIdx !== -1 && tgtIdx !== -1) {
          copy.splice(srcIdx, 1);
          copy.splice(tgtIdx, 0, sourceItemId);
          try {
            remoteStore.setItem("seqcarver_aniplayer_transport_v2", JSON.stringify(copy));
          } catch {}
          return copy;
        }
        return prev;
      });
    }
  };

  const handleResetAniLayout = () => {
    setAniPanelsOrder(["speed", "transitions", "export"]);
    setAniColumnsOrder(["stage", "controls"]);
    setAniTransportOrder(["ani_play_reverse", "ani_play_pause", "ani_step_next", "ani_play_fwd", "ani_loop_mode"]);
    try {
      remoteStore.removeItem("seqcarver_aniplayer_panels_v2");
      remoteStore.removeItem("seqcarver_aniplayer_columns_v2");
      remoteStore.removeItem("seqcarver_aniplayer_transport_v2");
    } catch {}
  };

  // Derive active frames array safely
  const activeFrames: FrameItem[] = React.useMemo(() => {
    if (sequenceSource === "storyboard") {
      return (storyboardSlots || [])
        .filter((slot) => slot && slot.url !== null)
        .map((slot, idx) => ({
          url: slot.url!,
          name: slot.name || `Frame ${idx + 1}`,
          story: slot.story,
        }));
    }
    return (storyboardSlices || []).map((slice, idx) => ({
      url: slice.url,
      name: slice.name || `Slice ${idx + 1}`,
    }));
  }, [sequenceSource, storyboardSlots, storyboardSlices]);

  // Reset defaults on open: auto-play at 1 fps with zoom transition as default
  useEffect(() => {
    if (isOpen) {
      setFps(1);
      setTransitionEffect("zoom");
      setIsPlaying(true);
      setCurrentFrameIdx(0);
    }
  }, [isOpen]);

  // Keep frame index valid
  useEffect(() => {
    if (activeFrames.length === 0) {
      setCurrentFrameIdx(0);
      setIsPlaying(false);
    } else if (currentFrameIdx >= activeFrames.length) {
      setCurrentFrameIdx(activeFrames.length - 1);
    }
  }, [activeFrames.length, currentFrameIdx]);

  // Preload images into memory for smooth rendering
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  useEffect(() => {
    activeFrames.forEach((frame) => {
      if (!loadedImagesRef.current.has(frame.url)) {
        const img = new Image();
        if (frame.url.startsWith("http://") || frame.url.startsWith("https://")) {
          img.crossOrigin = "anonymous";
        }
        img.onerror = () => {
          console.warn("Failed to preload frame image in FramePlayerModal");
        };
        img.src = frame.url;
        loadedImagesRef.current.set(frame.url, img);
      }
    });
  }, [activeFrames]);

  // Playback ticker loop
  const handleNextStep = useCallback(() => {
    if (activeFrames.length === 0) return;

    setCurrentFrameIdx((prev) => {
      const maxIdx = activeFrames.length - 1;

      if (loopMode === "ping-pong") {
        if (!isPingPongReverseRef.current) {
          if (prev >= maxIdx) {
            isPingPongReverseRef.current = true;
            return Math.max(0, maxIdx - 1);
          }
          return prev + 1;
        } else {
          if (prev <= 0) {
            isPingPongReverseRef.current = false;
            return Math.min(maxIdx, 1);
          }
          return prev - 1;
        }
      }

      if (playDirection === "forward") {
        if (prev >= maxIdx) {
          if (loopMode === "once") {
            setIsPlaying(false);
            return maxIdx;
          }
          return 0;
        }
        return prev + 1;
      } else {
        // Reverse
        if (prev <= 0) {
          if (loopMode === "once") {
            setIsPlaying(false);
            return 0;
          }
          return maxIdx;
        }
        return prev - 1;
      }
    });
  }, [activeFrames.length, loopMode, playDirection]);

  useEffect(() => {
    if (!isPlaying || activeFrames.length <= 1) return;

    const intervalMs = transitionEffect === "pause" ? pauseDuration * 1000 : 1000 / fps;
    const intervalId = setInterval(() => {
      handleNextStep();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [isPlaying, fps, transitionEffect, pauseDuration, activeFrames.length, handleNextStep]);

  // Helper to draw image onto canvas with scaling & offset
  const renderSingleImage = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    img: HTMLImageElement | null,
    offsetX = 0,
    offsetY = 0,
    scale = 1,
    alpha = 1
  ) => {
    if (!img || !img.complete || !img.width || !img.height) return;
    const width = canvas.width || 1280;
    const height = canvas.height || 720;

    const hRatio = width / img.width;
    const vRatio = height / img.height;
    const ratio = Math.min(hRatio, vRatio) * scale;
    const centerShift_x = (width - img.width * ratio) / 2 + offsetX;
    const centerShift_y = (height - img.height * ratio) / 2 + offsetY;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.drawImage(
      img,
      0,
      0,
      img.width,
      img.height,
      centerShift_x,
      centerShift_y,
      img.width * ratio,
      img.height * ratio
    );
    ctx.restore();
  };

  // Render transition frame blending
  const drawTransitionToCanvas = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      prevImg: HTMLImageElement | null,
      currImg: HTMLImageElement | null,
      progress: number,
      effect: string
    ) => {
      const width = canvas.width || 1280;
      const height = canvas.height || 720;

      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, width, height);

      if (effect === "none" || effect === "pause" || !prevImg || progress >= 1) {
        if (currImg) renderSingleImage(ctx, canvas, currImg);
        return;
      }

      if (effect === "crossfade") {
        renderSingleImage(ctx, canvas, prevImg, 0, 0, 1, 1 - progress);
        if (currImg) renderSingleImage(ctx, canvas, currImg, 0, 0, 1, progress);
      } else if (effect === "slide-left") {
        renderSingleImage(ctx, canvas, prevImg, -width * progress, 0, 1, 1);
        if (currImg) renderSingleImage(ctx, canvas, currImg, width * (1 - progress), 0, 1, 1);
      } else if (effect === "slide-right") {
        renderSingleImage(ctx, canvas, prevImg, width * progress, 0, 1, 1);
        if (currImg) renderSingleImage(ctx, canvas, currImg, -width * (1 - progress), 0, 1, 1);
      } else if (effect === "zoom") {
        renderSingleImage(ctx, canvas, prevImg, 0, 0, 1 + progress * 0.25, 1 - progress);
        if (currImg) renderSingleImage(ctx, canvas, currImg, 0, 0, 0.8 + progress * 0.2, progress);
      } else if (effect === "fade-black") {
        if (progress < 0.5) {
          renderSingleImage(ctx, canvas, prevImg, 0, 0, 1, 1 - progress * 2);
        } else {
          if (currImg) renderSingleImage(ctx, canvas, currImg, 0, 0, 1, (progress - 0.5) * 2);
        }
      }
    },
    []
  );

  // Canvas drawing with dynamic transition animations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || activeFrames.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentFrame = activeFrames[currentFrameIdx];
    const prevFrame = activeFrames[prevFrameIdxRef.current] || currentFrame;

    if (!currentFrame) return;

    const currImg = loadedImagesRef.current.get(currentFrame.url) || new Image();
    const prevImg = loadedImagesRef.current.get(prevFrame?.url || "") || null;

    if (!currImg.complete) {
      currImg.src = currentFrame.url;
    }
    if (prevImg && !prevImg.complete && prevFrame?.url) {
      prevImg.src = prevFrame.url;
    }

    if (animFrameReqRef.current) {
      cancelAnimationFrame(animFrameReqRef.current);
    }

    // If no transition effect or frame didn't change, render static frame immediately
    if (transitionEffect === "none" || prevFrameIdxRef.current === currentFrameIdx) {
      drawTransitionToCanvas(ctx, canvas, null, currImg, 1, "none");
      prevFrameIdxRef.current = currentFrameIdx;
      return;
    }

    // Animate transition progress 0 -> 1 over 220ms
    const transitionDurationMs = Math.min(300, Math.max(120, 1000 / fps));
    const startTime = performance.now();

    const animateTransition = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / transitionDurationMs);

      drawTransitionToCanvas(ctx, canvas, prevImg, currImg, progress, transitionEffect);

      if (progress < 1) {
        animFrameReqRef.current = requestAnimationFrame(animateTransition);
      } else {
        prevFrameIdxRef.current = currentFrameIdx;
      }
    };

    animFrameReqRef.current = requestAnimationFrame(animateTransition);

    return () => {
      if (animFrameReqRef.current) {
        cancelAnimationFrame(animFrameReqRef.current);
      }
    };
  }, [currentFrameIdx, activeFrames, transitionEffect, fps, drawTransitionToCanvas]);

  // Step Controls
  const stepPrev = () => {
    setIsPlaying(false);
    setCurrentFrameIdx((prev) => (prev <= 0 ? activeFrames.length - 1 : prev - 1));
  };

  const stepNext = () => {
    setIsPlaying(false);
    setCurrentFrameIdx((prev) => (prev >= activeFrames.length - 1 ? 0 : prev + 1));
  };

  const jumpStart = () => {
    setIsPlaying(false);
    setCurrentFrameIdx(0);
  };

  const jumpEnd = () => {
    setIsPlaying(false);
    setCurrentFrameIdx(Math.max(0, activeFrames.length - 1));
  };

  const togglePlayForward = () => {
    if (activeFrames.length === 0) return;
    setPlayDirection("forward");
    setIsPlaying((prev) => !prev);
  };

  const togglePlayReverse = () => {
    if (activeFrames.length === 0) return;
    setPlayDirection("reverse");
    setIsPlaying((prev) => !prev);
  };

  // Export Sequence as MP4, GIF, or WebM
  const handleExportSequence = async () => {
    if (activeFrames.length === 0) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportStatusText("Preparing frames for export...");
    setIsPlaying(false);

    try {
      const fallbackName =
        sequenceSource === "storyboard"
          ? `storyboard_movie_${fps}fps`
          : `slice_animation_${fps}fps`;

      const result = await exportSequenceMovie({
        frames: activeFrames,
        fps,
        format: exportFormat,
        filename: exportFilename.trim() || fallbackName,
        transitionEffect,
        pauseDuration,
        onProgress: (percent, statusMessage) => {
          setExportProgress(percent);
          if (statusMessage) {
            setExportStatusText(statusMessage);
          }
        },
      });

      // Trigger automatic file download
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
          URL.revokeObjectURL(url);
        } catch {}
      }, 1500);

      setExportNotice(`Exported "${result.filename}" successfully!`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error("Export Sequence Error:", err);
      setExportNotice(`Export failed: ${err?.message || "Error rendering sequence"}`);
      setTimeout(() => setExportNotice(null), 4000);
    } finally {
      setIsExporting(false);
      setExportStatusText("");
    }
  };

  const lastTapTimeRef = useRef<number>(0);
  const handleStageDoubleTap = (e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 350) {
      setIsPlaying((prev) => !prev);
    }
    lastTapTimeRef.current = now;
  };

  const renderTransportButton = (btnId: string) => {
    switch (btnId) {
      case "ani_play_reverse":
        return (
          <CustomizableButton
            buttonId="ani_play_reverse"
            defaultLabel=""
            defaultIcon={<Play className="w-3.5 h-3.5 fill-amber-400 text-amber-400 -scale-x-100" />}
            onClick={togglePlayReverse}
            disabled={activeFrames.length === 0}
            className={cn(
              "w-9 h-9 rounded-full bg-[#020617] border-2 border-amber-500/90 flex items-center justify-center cursor-pointer transition-all shadow-md hover:scale-105 active:scale-95 disabled:opacity-30",
              isPlaying && playDirection === "reverse" && "bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/30 animate-pulse"
            )}
            title="Play Reverse"
          />
        );
      case "ani_play_pause":
        return (
          <CustomizableButton
            buttonId="ani_play_pause"
            defaultLabel=""
            defaultIcon={
              isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-white text-white" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
              )
            }
            onClick={() => {
              if (isPlaying) {
                setIsPlaying(false);
              } else {
                togglePlayForward();
              }
            }}
            disabled={activeFrames.length === 0}
            className={cn(
              "w-9 h-9 rounded-full bg-[#020617] border-2 border-[#10b981] flex items-center justify-center cursor-pointer transition-all shadow-md hover:scale-105 active:scale-95 disabled:opacity-30",
              isPlaying && playDirection === "forward" && "bg-[#10b981]/20 border-emerald-400 ring-2 ring-[#10b981]/30 animate-pulse"
            )}
            title={isPlaying ? "Pause Playback" : "Play / Pause"}
          />
        );
      case "ani_step_next":
        return (
          <CustomizableButton
            buttonId="ani_step_next"
            defaultLabel=""
            defaultIcon={<SkipForward className="w-5 h-5 text-[#10b981]" />}
            onClick={stepNext}
            disabled={activeFrames.length === 0}
            className="p-1.5 hover:bg-[#10b981]/15 text-[#10b981] rounded-xl transition-all cursor-pointer disabled:opacity-30 active:scale-95 flex items-center justify-center"
            title="Step Next Frame"
          />
        );
      case "ani_play_fwd":
        return (
          <CustomizableButton
            buttonId="ani_play_fwd"
            defaultLabel="FWD"
            defaultIcon={<Play className="w-3 h-3 fill-[#10b981] text-[#10b981]" />}
            onClick={togglePlayForward}
            disabled={activeFrames.length === 0}
            className={cn(
              "px-4 py-1 rounded-xl border-2 border-[#10b981] bg-[#10b981]/10 hover:bg-[#10b981]/25 font-mono font-bold text-xs text-[#10b981] flex items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-30",
              isPlaying && playDirection === "forward" && "bg-[#10b981]/30 border-emerald-300"
            )}
            title="Play Forward"
          />
        );
      case "ani_loop_mode":
        return (
          <CustomizableButton
            buttonId="ani_loop_mode"
            defaultLabel=""
            defaultIcon={<Repeat className="w-4 h-4 text-[#10b981]" />}
            onClick={() => {
              setLoopMode((prev) => (prev === "loop" ? "ping-pong" : prev === "ping-pong" ? "once" : "loop"));
            }}
            className="w-9 h-9 rounded-xl bg-[#10b981]/15 border border-[#10b981]/50 hover:bg-[#10b981]/25 text-[#10b981] flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-sm"
            title={`Loop Mode: ${loopMode} (Click to cycle)`}
          />
        );
      default:
        return null;
    }
  };

  const renderSidebarPanel = (panelId: AniSidebarPanelId) => {
    switch (panelId) {
      case "speed":
        return (
          <div
            key="speed"
            draggable={showAniPlayerDragHandles}
            onDragStart={(e) => handleAniPanelDragStart(e, "speed")}
            onDragOver={(e) => handleAniPanelDragOver(e, "speed")}
            onDrop={(e) => handleAniPanelDrop(e, "speed")}
            onDragEnd={handleAniPanelDragEnd}
            className={cn(
              "bg-[#020617] p-4 rounded-2xl border border-[#1e293b] space-y-3 group/panel transition-all",
              draggedAniPanel === "speed" && "opacity-30 scale-[0.98] ring-2 ring-emerald-500",
              dragOverAniPanel === "speed" && "ring-2 ring-emerald-400 bg-emerald-500/10"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {showAniPlayerDragHandles && (
                  <div
                    draggable
                    onDragStart={(e) => handleAniPanelDragStart(e, "speed")}
                    onDragEnd={handleAniPanelDragEnd}
                    className="opacity-60 group-hover/panel:opacity-100 hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-emerald-400 cursor-grab active:cursor-grabbing shrink-0"
                    title={uiText("components_frame_player_modal.div.drag_panel_to_reorder_section.title", "Drag panel to reorder section")}
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                )}
                <CustomizableLabel
                  labelId="label_ani_speed"
                  defaultText="Frame Rate (Speed):"
                  defaultIcon={<Zap className="w-4 h-4 text-[#10b981]" />}
                  className="text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                />
              </div>
              <span className="text-xs font-mono font-bold text-[#10b981] bg-[#10b981]/10 px-2.5 py-0.5 rounded-full border border-[#10b981]/30">
                {fps}{uiText("components_frame_player_modal.span.fps", " FPS (")}{Math.round(1000 / fps)}{uiText("components_frame_player_modal.span.ms", "ms)")}
              </span>
            </div>

            {/* Slider & Hold Chevrons */}
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={60}
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value))}
                className="w-full accent-[#10b981] cursor-pointer"
              />
              <div className="flex flex-col gap-0.5">
                <HoldButton
                  onAction={() => setFps((f) => Math.min(60, f + 1))}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-[#10b981] cursor-pointer"
                  title={uiText("components_frame_player_modal.hold_button.increase_fps_hold_for_continuous.title", "Increase FPS (Hold for continuous)")}
                >
                  <ChevronRight className="w-3.5 h-3.5 -rotate-90" />
                </HoldButton>
                <HoldButton
                  onAction={() => setFps((f) => Math.max(1, f - 1))}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-[#10b981] cursor-pointer"
                  title={uiText("components_frame_player_modal.hold_button.decrease_fps_hold_for_continuous.title", "Decrease FPS (Hold for continuous)")}
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                </HoldButton>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-1.5 text-[10px]">
              {[1, 6, 12, 24].map((presetFps) => (
                <CustomizableButton
                  buttonId="frame_player_modal_btn_9"
                  key={presetFps}
type="button"
onClick={() => setFps(presetFps)}
className={cn(
                    "py-1 rounded-lg font-mono text-center font-bold transition-all border cursor-pointer",
                    fps === presetFps
                      ? "bg-[#10b981] text-[#020617] border-[#10b981]"
                      : "bg-slate-900 text-slate-400 border-[#1e293b] hover:text-slate-200"
                  )}
                >
                    {() => (
                        <>
                          {presetFps}
                        {uiText("components_frame_player_modal.button.fps", " FPS")}
                        </>
                      )}
                </CustomizableButton>
              ))}
            </div>
          </div>
        );

      case "transitions":
        return (
          <div
            key="transitions"
            draggable={showAniPlayerDragHandles}
            onDragStart={(e) => handleAniPanelDragStart(e, "transitions")}
            onDragOver={(e) => handleAniPanelDragOver(e, "transitions")}
            onDrop={(e) => handleAniPanelDrop(e, "transitions")}
            onDragEnd={handleAniPanelDragEnd}
            className={cn(
              "bg-[#020617] p-4 rounded-2xl border border-[#1e293b] space-y-3 group/panel transition-all",
              draggedAniPanel === "transitions" && "opacity-30 scale-[0.98] ring-2 ring-emerald-500",
              dragOverAniPanel === "transitions" && "ring-2 ring-emerald-400 bg-emerald-500/10"
            )}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <div className="flex items-center gap-1.5">
                {showAniPlayerDragHandles && (
                  <div
                    draggable
                    onDragStart={(e) => handleAniPanelDragStart(e, "transitions")}
                    onDragEnd={handleAniPanelDragEnd}
                    className="opacity-60 group-hover/panel:opacity-100 hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-emerald-400 cursor-grab active:cursor-grabbing shrink-0"
                    title={uiText("components_frame_player_modal.div.drag_panel_to_reorder_section.title_2", "Drag panel to reorder section")}
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                )}
                <CustomizableLabel
                  labelId="label_ani_transitions"
                  defaultText="Transition Effect:"
                  defaultIcon={<Sliders className="w-4 h-4 text-[#10b981]" />}
                  className="flex items-center gap-1.5 cursor-pointer"
                />
              </div>
              {transitionEffect === "pause" && (
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {uiText("components_frame_player_modal.span.pause", "Pause ")}{pauseDuration}{uiText("components_frame_player_modal.span.s", "s")}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {(
                [
                  { id: "none", label: "None (Cut)" },
                  { id: "crossfade", label: "Crossfade" },
                  { id: "slide-left", label: "Slide Left" },
                  { id: "slide-right", label: "Slide Right" },
                  { id: "zoom", label: "Scale Zoom" },
                  { id: "fade-black", label: "Fade Black" },
                  { id: "pause", label: "Pause Slide (x sec)" },
                ] as { id: TransitionEffect; label: string }[]
              ).map((t) => (
                <CustomizableButton
                  buttonId="frame_player_modal_btn_8"
                  key={t.id}
type="button"
onClick={() => setTransitionEffect(t.id)}
className={cn(
                    "py-1.5 px-2 rounded-xl text-xs font-medium transition-all border text-left cursor-pointer flex items-center justify-between",
                    t.id === "pause" && "col-span-2",
                    transitionEffect === t.id
                      ? t.id === "pause"
                        ? "bg-amber-500/15 text-amber-300 border-amber-500/50 font-bold shadow-sm"
                        : "bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40 font-bold shadow-sm"
                      : "bg-slate-900 text-slate-400 border-[#1e293b] hover:text-slate-200"
                  )}
                >
                    {() => (
                        <>
                          <span>{t.label}</span>
                        {t.id === "pause" && (
                    <Clock className={cn("w-3.5 h-3.5 shrink-0", transitionEffect === "pause" ? "text-amber-400" : "text-slate-500")} />
                  )}
                        </>
                      )}
                </CustomizableButton>
              ))}
            </div>

            {/* Pause Slide Duration Sub-Controls */}
            {transitionEffect === "pause" && (
              <div className="bg-[#090f21] p-3 rounded-xl border border-amber-500/40 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    {uiText("components_frame_player_modal.span.pause_slide_duration", "Pause Slide Duration:")}
                  </span>
                  <span className="font-mono font-bold text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-500/40 text-xs">
                    {pauseDuration} {pauseDuration === 1 ? "second" : "seconds"}
                  </span>
                </div>

                {/* Slider & Chevrons */}
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0.5}
                    max={15}
                    step={0.5}
                    value={pauseDuration}
                    onChange={(e) => setPauseDuration(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex flex-col gap-0.5">
                    <HoldButton
                      onAction={() => setPauseDuration((p) => Math.min(60, Math.round((p + 0.5) * 10) / 10))}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400 cursor-pointer"
                      title={uiText("components_frame_player_modal.hold_button.increase_pause_time_by_0_5s_hold_for_continu.title", "Increase pause time by 0.5s (Hold for continuous)")}
                    >
                      <ChevronRight className="w-3.5 h-3.5 -rotate-90" />
                    </HoldButton>
                    <HoldButton
                      onAction={() => setPauseDuration((p) => Math.max(0.5, Math.round((p - 0.5) * 10) / 10))}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400 cursor-pointer"
                      title={uiText("components_frame_player_modal.hold_button.decrease_pause_time_by_0_5s_hold_for_continu.title", "Decrease pause time by 0.5s (Hold for continuous)")}
                    >
                      <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                    </HoldButton>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-6 gap-1 text-[10px] font-mono">
                  {[0.5, 1, 2, 3, 5, 10].map((sec) => (
                    <CustomizableButton
                      buttonId="frame_player_modal_btn_7"
                      key={sec}
type="button"
onClick={() => setPauseDuration(sec)}
className={cn(
                        "py-1 rounded font-bold border transition-all cursor-pointer text-center",
                        pauseDuration === sec
                          ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow"
                          : "bg-slate-900 text-slate-400 border-[#1e293b] hover:text-slate-200"
                      )}
                    >
                        {() => (
                            <>
                              {sec}
                            {uiText("components_frame_player_modal.button.s", "s")}
                            </>
                          )}
                    </CustomizableButton>
                  ))}
                </div>

                <p className="text-[10.5px] text-slate-400 leading-snug">
                  {uiText("components_frame_player_modal.p.pauses_each_slide_stationary_for", "Pauses each slide stationary for ")}<strong className="text-amber-300 font-mono">{pauseDuration}{uiText("components_frame_player_modal.strong.s", "s")}</strong>{uiText("components_frame_player_modal.p.before_proceeding_to_the_next_slide_in_seque", " before proceeding to the next slide in sequence.")}
                </p>
              </div>
            )}
          </div>
        );

      case "export":
        return (
          <div
            key="export"
            draggable={showAniPlayerDragHandles}
            onDragStart={(e) => handleAniPanelDragStart(e, "export")}
            onDragOver={(e) => handleAniPanelDragOver(e, "export")}
            onDrop={(e) => handleAniPanelDrop(e, "export")}
            onDragEnd={handleAniPanelDragEnd}
            className={cn(
              "bg-[#020617] p-4 rounded-2xl border border-[#1e293b] space-y-3.5 flex-1 flex flex-col justify-between shadow-sm group/panel transition-all",
              draggedAniPanel === "export" && "opacity-30 scale-[0.98] ring-2 ring-emerald-500",
              dragOverAniPanel === "export" && "ring-2 ring-emerald-400 bg-emerald-500/10"
            )}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {showAniPlayerDragHandles && (
                    <div
                      draggable
                      onDragStart={(e) => handleAniPanelDragStart(e, "export")}
                      onDragEnd={handleAniPanelDragEnd}
                      className="opacity-60 group-hover/panel:opacity-100 hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-emerald-400 cursor-grab active:cursor-grabbing shrink-0"
                      title={uiText("components_frame_player_modal.div.drag_panel_to_reorder_section.title_3", "Drag panel to reorder section")}
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <CustomizableLabel
                    labelId="label_ani_export"
                    defaultText="Save / Export Sequence:"
                    defaultIcon={<Video className="w-4 h-4 text-[#10b981]" />}
                    className="text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  {uiText("components_frame_player_modal.span.clean_export", "Clean Export")}
                </span>
              </div>

              {/* Format Selector */}
              <div className="space-y-1.5">
                <div className="text-[10.5px] font-semibold text-slate-400">{uiText("components_frame_player_modal.div.file_format", "File Format:")}</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <CustomizableButton
                    buttonId="ani_export_mp4"
                    defaultLabel=".MP4"
                    defaultIcon={<FileVideo className="w-3.5 h-3.5" />}
                    onClick={() => setExportFormat("mp4")}
                    className={cn(
                      "py-1.5 px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer shadow-sm",
                      exportFormat === "mp4"
                        ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-emerald-950/40"
                        : "bg-slate-900 text-slate-300 border-[#1e293b] hover:bg-slate-800 hover:text-white"
                    )}
                    title="Export as universal MP4 Video (H.264)"
                  />
                  <CustomizableButton
                    buttonId="ani_export_gif"
                    defaultLabel=".GIF"
                    defaultIcon={<ImageIcon className="w-3.5 h-3.5" />}
                    onClick={() => setExportFormat("gif")}
                    className={cn(
                      "py-1.5 px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer shadow-sm",
                      exportFormat === "gif"
                        ? "bg-amber-500 text-slate-950 border-amber-400 shadow-amber-950/40"
                        : "bg-slate-900 text-slate-300 border-[#1e293b] hover:bg-slate-800 hover:text-white"
                    )}
                    title="Export as animated GIF image with color quantization"
                  />
                  <CustomizableButton
                    buttonId="ani_export_webm"
                    defaultLabel=".WebM"
                    defaultIcon={<Video className="w-3.5 h-3.5" />}
                    onClick={() => setExportFormat("webm")}
                    className={cn(
                      "py-1.5 px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer shadow-sm",
                      exportFormat === "webm"
                        ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-950/40"
                        : "bg-slate-900 text-slate-300 border-[#1e293b] hover:bg-slate-800 hover:text-white"
                    )}
                    title="Export as high-efficiency WebM video"
                  />
                </div>
              </div>

              {/* User-Defined Custom Filename Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10.5px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Edit3 className="w-3 h-3 text-slate-400" />
                    {uiText("components_frame_player_modal.span.file_name", "File Name:")}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {uiText("components_frame_player_modal.span.user_defined", "User-Defined")}
                  </span>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={exportFilename}
                    onChange={(e) => setExportFilename(e.target.value)}
                    placeholder={uiText("components_frame_player_modal.input.enter_custom_file_name.placeholder", "Enter custom file name...")}
                    className="w-full bg-[#090f21] border border-[#1e293b] focus:border-emerald-500/70 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none pr-14 transition-colors"
                  />
                  <span className="absolute right-2 text-[11px] font-mono font-bold text-slate-400 px-1.5 py-0.5 bg-slate-900 border border-slate-700/60 rounded-md select-none">
                    .{exportFormat}
                  </span>
                </div>

                {/* Quick Filename Presets */}
                <div className="flex items-center gap-1.5 flex-wrap text-[9.5px]">
                  <span className="text-slate-500">{uiText("components_frame_player_modal.span.presets", "Presets:")}</span>
                  <CustomizableButton
                    buttonId="frame_player_modal_btn_6"
                    type="button"
onClick={() => setExportFilename(`storyboard_movie_${fps}fps`)}
className="px-1.5 py-0.5 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer font-mono"
                  >
                      {() => (
                          <>
                            {uiText("components_frame_player_modal.button.storyboard_movie", "storyboard_movie")}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="frame_player_modal_btn_5"
                    type="button"
onClick={() => setExportFilename(`anim_${fps}fps`)}
className="px-1.5 py-0.5 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer font-mono"
                  >
                      {() => (
                          <>
                            {uiText("components_frame_player_modal.button.anim", "anim_")}
                          {fps}
                          {uiText("components_frame_player_modal.button.fps_2", "fps")}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="frame_player_modal_btn_4"
                    type="button"
onClick={() => {
                      const dateStr = new Date().toISOString().slice(0, 10);
                      setExportFilename(`seq_${dateStr}`);
                    }}
className="px-1.5 py-0.5 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer font-mono"
                  >
                      {() => (
                          <>
                            {uiText("components_frame_player_modal.button.seq_date", "seq_date")}
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-snug">
                {exportFormat === "mp4" && "Renders sequence into standard MP4 video playable on any device."}
                {exportFormat === "gif" && "Generates animated GIF with adaptive 256-color palette quantization."}
                {exportFormat === "webm" && "Renders high-efficiency WebM video stream directly from canvas."}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {isExporting ? (
                <div className="space-y-2 p-3 bg-slate-900/80 rounded-xl border border-emerald-500/40 shadow-md animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs font-mono text-[#10b981]">
                    <span className="font-bold truncate max-w-[200px]">
                      {exportStatusText || `Exporting .${exportFormat.toUpperCase()}...`}
                    </span>
                    <span className="font-bold">{exportProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-150"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <CustomizableButton
                  buttonId="ani_export_start"
                  defaultLabel={`Export Sequence as ${exportFormat === "mp4" ? "MP4 Video (.mp4)" : exportFormat === "gif" ? "GIF Animation (.gif)" : "WebM Video (.webm)"}`}
                  defaultIcon={<Download className="w-4 h-4" />}
                  onClick={handleExportSequence}
                  disabled={activeFrames.length === 0}
                  className={cn(
                    "w-full py-2.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                    exportFormat === "mp4"
                      ? "bg-[#10b981] hover:bg-emerald-400 text-[#020617]"
                      : exportFormat === "gif"
                      ? "bg-amber-500 hover:bg-amber-400 text-[#020617]"
                      : "bg-cyan-500 hover:bg-cyan-400 text-[#020617]"
                  )}
                />
              )}

              {exportNotice && (
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-600/60 rounded-xl text-[11px] text-emerald-200 flex items-center gap-2 animate-in fade-in duration-150">
                  <Sparkles className="w-4 h-4 text-[#10b981] shrink-0" />
                  <span className="font-medium">{exportNotice}</span>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderStageColumn = () => (
    <div
      key="stage"
      draggable={showAniPlayerDragHandles}
      onDragStart={(e) => handleAniColumnDragStart(e, "stage")}
      onDragOver={(e) => handleAniColumnDragOver(e, "stage")}
      onDrop={(e) => handleAniColumnDrop(e, "stage")}
      onDragEnd={handleAniColumnDragEnd}
      className={cn(
        hideOtherPanels ? "lg:col-span-12 w-full" : "lg:col-span-8",
        "flex flex-col items-stretch justify-start space-y-2 group/stage transition-all p-0 m-0",
        draggedAniColumn === "stage" && "opacity-30 scale-[0.98] ring-2 ring-emerald-500 rounded-2xl",
        dragOverAniColumn === "stage" && "ring-2 ring-emerald-400 bg-emerald-500/10 rounded-2xl"
      )}
    >
      {showAniPlayerDragHandles && (
        <div className="w-full flex items-center justify-between px-3 py-1 bg-slate-900/70 rounded-xl border border-slate-800 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <div
              draggable
              onDragStart={(e) => handleAniColumnDragStart(e, "stage")}
              onDragEnd={handleAniColumnDragEnd}
              className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-emerald-400 p-0.5"
              title={uiText("components_frame_player_modal.div.drag_stage_column_to_swap_position.title", "Drag stage column to swap position")}
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-200">{uiText("components_frame_player_modal.span.animation_stage_view", "Animation Stage View")}</span>
          </div>
          <span className="text-[9px] text-slate-500">{uiText("components_frame_player_modal.span.drag_to_swap_with_controls", "Drag to swap with controls")}</span>
        </div>
      )}

      {/* Canvas / Image Display - Topmost, zero padding, maximized viewing area */}
      <div
        onDoubleClick={() => setIsPlaying((prev) => !prev)}
        onTouchEnd={handleStageDoubleTap}
        className={cn(
          "relative w-full bg-[#020617] rounded-xl border border-[#1e293b] overflow-hidden flex items-center justify-center shadow-inner group cursor-pointer select-none transition-all p-0 m-0",
          hideOtherPanels
            ? "h-[calc(86vh-140px)] max-h-[820px] min-h-[420px]"
            : "h-[calc(72vh-140px)] max-h-[640px] min-h-[300px]"
        )}
        title={uiText("components_frame_player_modal.div.double_click_or_double_tap_to_start_stop_pla.title", "Double click or double tap to start / stop playback")}
      >
        {/* Floating Toggle Panels Button inside Stage for immediate 1-click access */}
        <CustomizableButton
          buttonId="frame_player_modal_btn_3"
          type="button"
onClick={(e) => {
            e.stopPropagation();
            toggleHideOtherPanels();
          }}
className="absolute top-2.5 right-2.5 z-20 px-2.5 py-1 rounded-lg bg-slate-950/85 hover:bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-emerald-400 transition-all cursor-pointer shadow-lg backdrop-blur-sm flex items-center gap-1.5 text-xs font-semibold"
title={hideOtherPanels ? "Show all side panels (Speed, Transitions, Export)" : "Hide other panels (Maximum Stage View)"}
        >
            {() => (
                <>
                  {hideOtherPanels ? (
            <>
              <PanelRightOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px]">{uiText("components_frame_player_modal.span.show_panels", "Show Panels")}</span>
            </>
          ) : (
            <>
              <PanelRightClose className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-[11px]">{uiText("components_frame_player_modal.span.hide_panels", "Hide Panels")}</span>
            </>
          )}
                </>
              )}
        </CustomizableButton>

        {activeFrames.length === 0 ? (
          <div className="text-center p-6 text-slate-500 space-y-2">
            <Film className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-xs">{uiText("components_frame_player_modal.p.no_frames_found_in_selected_source", "No frames found in selected source.")}</p>
            <p className="text-[11px] text-slate-600">
              {uiText("components_frame_player_modal.p.add_images_to_storyboard_board_or_create_sli", "Add images to Storyboard Board or create slices in Carve Mode.")}
            </p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="w-full h-full object-contain p-0 m-0 block"
          />
        )}
      </div>

      {/* 2-Way Transport Controls Bar */}
      <div
        className="w-full bg-[#020617] p-2 px-3.5 rounded-xl border-2 border-[#10b981]/80 flex items-center justify-between gap-2 shadow-lg min-h-[56px]"
      >
        {/* Controls Group */}
        <div className="flex items-center gap-2.5 w-full justify-center flex-wrap">
          {aniTransportOrder.map((btnId) => {
            const isDragging = draggedTransportItem === btnId;
            const isDragOver = dragOverTransportItem === btnId;
            return (
              <div
                key={btnId}
                draggable={showAniPlayerDragHandles}
                onDragStart={(e) => handleTransportItemDragStart(e, btnId)}
                onDragOver={(e) => handleTransportItemDragOver(e, btnId)}
                onDrop={(e) => handleTransportItemDrop(e, btnId)}
                onDragEnd={handleTransportItemDragEnd}
                className={cn(
                  "flex items-center gap-1 group/btn transition-all",
                  isDragging && "opacity-30 scale-95 ring-2 ring-emerald-500 rounded-xl",
                  isDragOver && "ring-2 ring-emerald-400 bg-emerald-500/20 rounded-xl"
                )}
              >
                {showAniPlayerDragHandles && (
                  <div
                    draggable
                    onDragStart={(e) => handleTransportItemDragStart(e, btnId)}
                    onDragEnd={handleTransportItemDragEnd}
                    className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-emerald-400 p-0.5"
                    title={uiText("components_frame_player_modal.div.drag_button_to_reposition.title", "Drag button to reposition")}
                  >
                    <GripVertical className="w-2.5 h-2.5" />
                  </div>
                )}
                {renderTransportButton(btnId)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderControlsColumn = () => {
    if (hideOtherPanels) return null;
    return (
      <div
        key="controls"
        draggable={showAniPlayerDragHandles}
        onDragStart={(e) => handleAniColumnDragStart(e, "controls")}
        onDragOver={(e) => handleAniColumnDragOver(e, "controls")}
        onDrop={(e) => handleAniColumnDrop(e, "controls")}
        onDragEnd={handleAniColumnDragEnd}
        className={cn(
          "lg:col-span-4 flex flex-col space-y-3 group/controls transition-all",
          draggedAniColumn === "controls" && "opacity-30 scale-[0.98] ring-2 ring-emerald-500 rounded-2xl",
          dragOverAniColumn === "controls" && "ring-2 ring-emerald-400 bg-emerald-500/10 rounded-2xl"
        )}
      >
        {showAniPlayerDragHandles && (
          <div className="w-full flex items-center justify-between px-3 py-1 bg-slate-900/70 rounded-xl border border-slate-800 text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <div
                draggable
                onDragStart={(e) => handleAniColumnDragStart(e, "controls")}
                onDragEnd={handleAniColumnDragEnd}
                className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-emerald-400 p-0.5"
                title={uiText("components_frame_player_modal.div.drag_controls_column_to_swap_position.title", "Drag controls column to swap position")}
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-slate-200">{uiText("components_frame_player_modal.span.controls_column", "Controls Column")}</span>
            </div>
            <span className="text-[9px] text-slate-500">{uiText("components_frame_player_modal.span.drag_to_swap_with_stage", "Drag to swap with stage")}</span>
          </div>
        )}

        {aniPanelsOrder.map((panelId) => renderSidebarPanel(panelId))}
      </div>
    );
  };

  if (!isOpen) return null;

  const currentFrame = activeFrames[currentFrameIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#090f21] border border-[#1e293b] rounded-2xl w-full max-w-[min(96vw,1280px)] max-h-[min(94vh,960px)] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0f172a] border-b border-[#1e293b] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#10b981]/15 text-[#10b981] rounded-xl border border-[#10b981]/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <CustomizableLabel
                labelId="label_ani_title"
                defaultText="AniPlayer"
                className="text-sm font-bold text-slate-100 flex items-center gap-2 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Frame Badge */}
            {activeFrames.length > 0 && currentFrame && (
              <div className="bg-[#020617] px-3 py-1 rounded-xl border border-[#1e293b] text-xs font-mono font-bold text-slate-200 flex items-center gap-2 shadow-sm">
                <span className="text-[#10b981] inline-block shrink-0" style={{ width: '40px' }}>
                  {uiText("components_frame_player_modal.span.frame", "Frame ")}{currentFrameIdx + 1} / {activeFrames.length}
                </span>
                <span className="text-slate-500">|</span>
                <span className="truncate inline-block" style={{ width: '160px' }}>{currentFrame?.name}</span>
                {transitionEffect === "pause" && (
                  <>
                    <span className="text-slate-500">|</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40 text-[10px]">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {uiText("components_frame_player_modal.span.pause_2", "Pause ")}{pauseDuration}{uiText("components_frame_player_modal.span.s_2", "s")}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Quick Resend Actions (Icons Only) */}
            {activeFrames.length > 0 && currentFrame && onResendFrameToCarve && (
              <CustomizableButton
                buttonId="ani_resend_frame"
                defaultLabel=""
                defaultIcon={<Scissors className="w-4 h-4 text-[#10b981]/75" />}
                onClick={() => {
                  onResendFrameToCarve(currentFrame.url, currentFrame.name);
                  onClose();
                }}
                className="bg-[#020617] hover:bg-[#10b981]/20 text-slate-300 hover:text-[#10b981] p-1.5 rounded-xl border border-[#1e293b] hover:border-[#10b981]/40 transition-all cursor-pointer shadow-sm flex items-center justify-center"
                title="Resend frame to Crop and close player"
              />
            )}

            {/* Source Toggle */}
            <div className="flex items-center bg-[#020617] p-1 rounded-xl border border-[#1e293b]">
              <CustomizableButton
                buttonId="frame_player_modal_btn_2"
                defaultIcon={<Layers className="w-3.5 h-3.5 text-[#10b981]/75" />}
                type="button"
onClick={() => {
                  setSequenceSource("storyboard");
                  setCurrentFrameIdx(0);
                }}
className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  sequenceSource === "storyboard"
                    ? "bg-[#10b981] text-[#020617] shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                  {() => (
                      <>
                        <span>{uiText("components_frame_player_modal.span.storyboard", "Storyboard (")}{storyboardSlots.filter((s) => s.url).length})</span>
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="frame_player_modal_btn_1"
                defaultIcon={<Scissors className="w-3.5 h-3.5 text-[#10b981]/75" />}
                type="button"
onClick={() => {
                  setSequenceSource("slices");
                  setCurrentFrameIdx(0);
                }}
className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  sequenceSource === "slices"
                    ? "bg-[#10b981] text-[#020617] shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                  {() => (
                      <>
                        <span>{uiText("components_frame_player_modal.span.all_slices", "All Slices (")}{storyboardSlices.length})</span>
                      </>
                    )}
              </CustomizableButton>
            </div>

            {/* Toggle Show / Hide Other Panels Button */}
            <CustomizableButton
              buttonId="ani_toggle_panels"
              defaultLabel={hideOtherPanels ? "Show Panels" : "Hide Panels"}
              defaultIcon={
                hideOtherPanels ? (
                  <PanelRightOpen className="w-4 h-4 text-emerald-400" />
                ) : (
                  <PanelRightClose className="w-4 h-4 text-slate-300" />
                )
              }
              onClick={toggleHideOtherPanels}
              className={cn(
                "px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer shadow-sm",
                hideOtherPanels
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30"
                  : "bg-[#020617] text-slate-300 border-[#1e293b] hover:bg-slate-800 hover:text-white"
              )}
              title={hideOtherPanels ? "Show all side panels (Speed, Transitions, Export)" : "Hide other panels to maximize animation stage view"}
            />

            <CustomizableButton
              buttonId="ani_close_player"
              defaultLabel=""
              defaultIcon={<X className="w-4 h-4" />}
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-[#1e293b] flex items-center justify-center"
              title="Close Player"
            />
          </div>
        </div>

        {/* Content Body - Zero unnecessary padding, top-aligned, maximum viewing area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 grid grid-cols-1 lg:grid-cols-12 gap-2.5 min-h-[380px]">
          {aniColumnsOrder.map((colId) => (colId === "stage" ? renderStageColumn() : renderControlsColumn()))}
        </div>
      </div>
    </div>
  );
};
