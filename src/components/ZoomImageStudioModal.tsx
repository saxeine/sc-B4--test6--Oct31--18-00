import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ZoomIn,
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
  Film,
  Layers,
  Sparkles,
  Camera,
  Archive,
  Copy,
  Plus,
  Compass,
  Crosshair,
  Wand2,
  Eye,
  Upload,
  RotateCcw,
  FastForward,
  Activity,
  SplitSquareVertical,
  Columns,
  Maximize2,
  ZoomOut,
} from "lucide-react";
import {
  ZoomStudioConfig,
  DEFAULT_ZOOM_CONFIG,
  ZOOM_PRESETS,
  ZoomPreset,
  GeneratedZoomFrame,
  generateZoomVariationFrames,
  exportZoomSeriesAsZip,
  exportZoomSeriesAsGif,
  loadHtmlImage,
  ZoomMode,
  ZoomEasing,
  ZoomColorGrade,
  ZoomAspectRatio,
  ZoomSpeedRamp,
} from "../utils/zoomStudioEngine";
import { CustomizableButton } from "./CustomizableButton";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableContainer } from "./CustomizableContainer";
import { cn } from "../utils/cn";
import { saveAs } from "file-saver";
import { uiText, uiMessage } from "../hooks/useUIConfig";
import { remoteStore } from "../services/remoteKeyValueStore";

export interface ZoomImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  sliceName?: string;
  sliceIndex?: number | null;
  slices?: Array<{ name: string; url: string }>;
  onNavigateFrame?: (index: number) => void;
  onApplyZoomVariations?: (
    frames: Array<{ name: string; url: string }>,
    mode: "append_storyboard" | "replace_frame",
    targetSliceIndex?: number | null
  ) => void;
  onOpenInAniPlayer?: (
    frames: Array<{ name: string; url: string }>,
    targetSliceIndex?: number | null
  ) => void;
}

type TabType = "zoom_params" | "effects" | "presets";
type FocalTargetType = "start" | "end";
export type PreviewViewMode = "stage" | "split" | "side_by_side";

interface PersistedZoomStudioState {
  config: ZoomStudioConfig;
  activeTab: TabType;
  activePresetId: string;
  isControlsPanelVisible: boolean;
  isFilmstripVisible: boolean;
  isFooterVisible: boolean;
  playbackFps: number;
  showOriginalComparison: boolean;
  activeFocalTarget: FocalTargetType;
  previewViewMode: PreviewViewMode;
  previewZoomLevel: number;
  splitPos: number;
}

const ZOOM_STUDIO_STATE_KEY = "seqcarver_zoom_studio_state_v1";

const DEFAULT_PERSISTED_STATE: PersistedZoomStudioState = {
  config: DEFAULT_ZOOM_CONFIG,
  activeTab: "zoom_params",
  activePresetId: "scifi_warp",
  isControlsPanelVisible: true,
  isFilmstripVisible: true,
  isFooterVisible: true,
  playbackFps: 10,
  showOriginalComparison: false,
  activeFocalTarget: "start",
  previewViewMode: "stage",
  previewZoomLevel: 1.0,
  splitPos: 50,
};

function readPersistedZoomState(): PersistedZoomStudioState {
  const raw = remoteStore.getJSON<Partial<PersistedZoomStudioState>>(
    ZOOM_STUDIO_STATE_KEY,
    DEFAULT_PERSISTED_STATE
  );
  return {
    config: {
      ...DEFAULT_ZOOM_CONFIG,
      ...(raw?.config && typeof raw.config === "object" ? raw.config : {}),
    },
    activeTab:
      raw?.activeTab === "zoom_params" ||
      raw?.activeTab === "effects" ||
      raw?.activeTab === "presets"
        ? raw.activeTab
        : "zoom_params",
    activePresetId:
      typeof raw?.activePresetId === "string" && raw.activePresetId
        ? raw.activePresetId
        : "scifi_warp",
    isControlsPanelVisible:
      typeof raw?.isControlsPanelVisible === "boolean"
        ? raw.isControlsPanelVisible
        : true,
    isFilmstripVisible:
      typeof raw?.isFilmstripVisible === "boolean"
        ? raw.isFilmstripVisible
        : true,
    isFooterVisible:
      typeof raw?.isFooterVisible === "boolean"
        ? raw.isFooterVisible
        : true,
    playbackFps:
      typeof raw?.playbackFps === "number" && raw.playbackFps > 0
        ? raw.playbackFps
        : 10,
    showOriginalComparison: Boolean(raw?.showOriginalComparison),
    activeFocalTarget: raw?.activeFocalTarget === "end" ? "end" : "start",
    previewViewMode:
      raw?.previewViewMode === "split" ||
      raw?.previewViewMode === "side_by_side" ||
      raw?.previewViewMode === "stage"
        ? raw.previewViewMode
        : "stage",
    previewZoomLevel:
      typeof raw?.previewZoomLevel === "number" &&
      raw.previewZoomLevel >= 0.5 &&
      raw.previewZoomLevel <= 3.0
        ? Number(raw.previewZoomLevel.toFixed(2))
        : 1.0,
    splitPos:
      typeof raw?.splitPos === "number" &&
      raw.splitPos >= 0 &&
      raw.splitPos <= 100
        ? Math.round(raw.splitPos)
        : 50,
  };
}

const FOCAL_GRID_POINTS: Array<{
  id: string;
  label: string;
  x: number;
  y: number;
  startBtnId: string;
  endBtnId: string;
}> = [
  { id: "tl", label: "Tl", x: 0.2, y: 0.2, startBtnId: "zoom_studio_focal_tl", endBtnId: "zoom_studio_end_focal_tl" },
  { id: "tc", label: "Tc", x: 0.5, y: 0.2, startBtnId: "zoom_studio_focal_tc", endBtnId: "zoom_studio_end_focal_tc" },
  { id: "tr", label: "Tr", x: 0.8, y: 0.2, startBtnId: "zoom_studio_focal_tr", endBtnId: "zoom_studio_end_focal_tr" },
  { id: "cl", label: "Cl", x: 0.2, y: 0.5, startBtnId: "zoom_studio_focal_cl", endBtnId: "zoom_studio_end_focal_cl" },
  { id: "c", label: "C", x: 0.5, y: 0.5, startBtnId: "zoom_studio_focal_c", endBtnId: "zoom_studio_end_focal_c" },
  { id: "cr", label: "Cr", x: 0.8, y: 0.5, startBtnId: "zoom_studio_focal_cr", endBtnId: "zoom_studio_end_focal_cr" },
  { id: "bl", label: "Bl", x: 0.2, y: 0.8, startBtnId: "zoom_studio_focal_bl", endBtnId: "zoom_studio_end_focal_bl" },
  { id: "bc", label: "Bc", x: 0.5, y: 0.8, startBtnId: "zoom_studio_focal_bc", endBtnId: "zoom_studio_end_focal_bc" },
  { id: "br", label: "Br", x: 0.8, y: 0.8, startBtnId: "zoom_studio_focal_br", endBtnId: "zoom_studio_end_focal_br" },
];

export const ZoomImageStudioModal: React.FC<ZoomImageStudioModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  sliceName,
  sliceIndex,
  slices,
  onNavigateFrame,
  onApplyZoomVariations,
  onOpenInAniPlayer,
}) => {
  // Navigation across frames if slices provided (strictly nullable so custom imageUrl is never shadowed)
  const [activeSliceIdx, setActiveSliceIdx] = useState<number | null>(
    sliceIndex !== undefined ? sliceIndex : null
  );

  useEffect(() => {
    setActiveSliceIdx(sliceIndex !== undefined ? sliceIndex : null);
  }, [sliceIndex, imageUrl, isOpen]);

  const currentSlice =
    activeSliceIdx !== null && slices && slices[activeSliceIdx]
      ? slices[activeSliceIdx]
      : null;
  const activeImageUrl = currentSlice?.url || imageUrl || slices?.[0]?.url || "";
  const activeBaseName =
    currentSlice?.name ||
    sliceName ||
    slices?.[0]?.name ||
    `Frame ${(activeSliceIdx ?? 0) + 1}`;

  // Persistent configuration & workspace UI state (hydrated from Firestore-backed remoteStore)
  const initialPersisted = useRef<PersistedZoomStudioState>(readPersistedZoomState());
  const [config, setConfig] = useState<ZoomStudioConfig>(initialPersisted.current.config);
  const [activeTab, setActiveTab] = useState<TabType>(initialPersisted.current.activeTab);
  const [activePresetId, setActivePresetId] = useState<string>(
    initialPersisted.current.activePresetId
  );
  const [isControlsPanelVisible, setIsControlsPanelVisible] = useState<boolean>(
    initialPersisted.current.isControlsPanelVisible
  );
  const [isFilmstripVisible, setIsFilmstripVisible] = useState<boolean>(
    initialPersisted.current.isFilmstripVisible
  );
  const [isFooterVisible, setIsFooterVisible] = useState<boolean>(
    initialPersisted.current.isFooterVisible
  );
  const [playbackFps, setPlaybackFps] = useState<number>(
    initialPersisted.current.playbackFps
  );
  const [showOriginalComparison, setShowOriginalComparison] = useState<boolean>(
    initialPersisted.current.showOriginalComparison
  );
  const [activeFocalTarget, setActiveFocalTarget] = useState<FocalTargetType>(
    initialPersisted.current.activeFocalTarget
  );
  const [previewViewMode, setPreviewViewMode] = useState<PreviewViewMode>(
    initialPersisted.current.previewViewMode
  );
  const [previewZoomLevel, setPreviewZoomLevel] = useState<number>(
    initialPersisted.current.previewZoomLevel
  );
  const [splitPos, setSplitPos] = useState<number>(
    initialPersisted.current.splitPos
  );
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [isHoldingOriginal, setIsHoldingOriginal] = useState<boolean>(false);

  // Sync live updates when Firestore remoteStore hydrates on refresh or updates across tabs
  const isApplyingRemoteRef = useRef<boolean>(false);
  useEffect(() => {
    const unsubscribe = remoteStore.subscribe((changedKeys) => {
      if (!changedKeys.includes(ZOOM_STUDIO_STATE_KEY)) return;
      const incoming = readPersistedZoomState();
      isApplyingRemoteRef.current = true;
      setConfig(incoming.config);
      setActiveTab(incoming.activeTab);
      setActivePresetId(incoming.activePresetId);
      setIsControlsPanelVisible(incoming.isControlsPanelVisible);
      setIsFilmstripVisible(incoming.isFilmstripVisible);
      setIsFooterVisible(incoming.isFooterVisible);
      setPlaybackFps(incoming.playbackFps);
      setShowOriginalComparison(incoming.showOriginalComparison);
      setActiveFocalTarget(incoming.activeFocalTarget);
      setPreviewViewMode(incoming.previewViewMode);
      setPreviewZoomLevel(incoming.previewZoomLevel);
      setSplitPos(incoming.splitPos);
      queueMicrotask(() => {
        isApplyingRemoteRef.current = false;
      });
    });
    return unsubscribe;
  }, []);

  // Persist every Zoom Studio state change to Firestore-backed remoteStore
  const hasMountedPersistRef = useRef<boolean>(false);
  useEffect(() => {
    if (!hasMountedPersistRef.current) {
      hasMountedPersistRef.current = true;
      return;
    }
    if (isApplyingRemoteRef.current) return;
    const payload: PersistedZoomStudioState = {
      config,
      activeTab,
      activePresetId,
      isControlsPanelVisible,
      isFilmstripVisible,
      isFooterVisible,
      playbackFps,
      showOriginalComparison,
      activeFocalTarget,
      previewViewMode,
      previewZoomLevel,
      splitPos,
    };
    remoteStore.setJSON(ZOOM_STUDIO_STATE_KEY, payload);
  }, [
    config,
    activeTab,
    activePresetId,
    isControlsPanelVisible,
    isFilmstripVisible,
    isFooterVisible,
    playbackFps,
    showOriginalComparison,
    activeFocalTarget,
    previewViewMode,
    previewZoomLevel,
    splitPos,
  ]);

  // Output generated frames
  const [generatedFrames, setGeneratedFrames] = useState<GeneratedZoomFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const generationRunIdRef = useRef<number>(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Stop playback and cancel pending renders when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      generationRunIdRef.current += 1;
    }
  }, [isOpen]);

  // Custom image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customUploadedUrl, setCustomUploadedUrl] = useState<string | null>(null);
  const [customUploadedName, setCustomUploadedName] = useState<string | null>(null);

  // Dragging focal point directly on the rendered image bounds
  const imageStageRef = useRef<HTMLDivElement>(null);
  const [isDraggingFocal, setIsDraggingFocal] = useState<boolean>(false);

  // Toast / feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 2600);
  }, []);

  const effectiveImageUrl = customUploadedUrl || activeImageUrl;
  const effectiveBaseName = customUploadedName || activeBaseName;

  // Cancellation-safe async frame generator that never reads stale React closures
  const runGeneration = useCallback(
    async (
      sourceUrl: string,
      targetConfig: ZoomStudioConfig,
      targetBaseName: string
    ) => {
      if (!sourceUrl) {
        setGeneratedFrames([]);
        setIsGenerating(false);
        return;
      }
      const runId = ++generationRunIdRef.current;
      setIsGenerating(true);
      setGenerationProgress(0);
      try {
        const frames = await generateZoomVariationFrames(
          sourceUrl,
          targetConfig,
          targetBaseName,
          (pct) => {
            if (generationRunIdRef.current === runId) {
              setGenerationProgress(pct);
            }
          },
          () => generationRunIdRef.current !== runId
        );
        if (generationRunIdRef.current !== runId) return;
        setGeneratedFrames(frames);
        setCurrentFrameIndex((prev) =>
          Math.min(prev, Math.max(0, frames.length - 1))
        );
      } catch (err) {
        if (generationRunIdRef.current !== runId) return;
        console.error("Zoom Studio generation failed:", err);
        showToast(
          uiMessage(
            "zoom_studio.toast.generation_failed",
            "Generation failed. Check image source."
          )
        );
      } finally {
        if (generationRunIdRef.current === runId) {
          setIsGenerating(false);
        }
      }
    },
    [showToast]
  );

  // Reactive regeneration: immediate on modal open or source image change; debounced on parameter edits
  const prevOpenRef = useRef<boolean>(false);
  const prevImageRef = useRef<string>("");
  useEffect(() => {
    if (!isOpen) {
      prevOpenRef.current = false;
      return;
    }
    if (!effectiveImageUrl) {
      setGeneratedFrames([]);
      return;
    }

    const justOpened = !prevOpenRef.current;
    const imageChanged = prevImageRef.current !== effectiveImageUrl;
    prevOpenRef.current = true;
    prevImageRef.current = effectiveImageUrl;

    if (justOpened || imageChanged) {
      void runGeneration(effectiveImageUrl, config, effectiveBaseName);
      return;
    }

    const timer = window.setTimeout(() => {
      void runGeneration(effectiveImageUrl, config, effectiveBaseName);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [isOpen, effectiveImageUrl, config, effectiveBaseName, runGeneration]);

  // Clean config updater (state updates trigger reactive debounced generation + Firestore persistence)
  const handleConfigChange = useCallback(
    (updater: (prev: ZoomStudioConfig) => ZoomStudioConfig) => {
      setConfig((prev) => updater(prev));
    },
    []
  );

  // Canvas inspection zoom handlers
  const handleZoomIn = () => {
    setPreviewZoomLevel((z) => Math.min(3.0, Number((z + 0.25).toFixed(2))));
  };
  const handleZoomOut = () => {
    setPreviewZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))));
  };
  const handleZoomReset = () => {
    setPreviewZoomLevel(1.0);
  };
  const handleZoomFit = () => {
    setPreviewZoomLevel(1.0);
  };

  // Split-slider drag event listeners
  useEffect(() => {
    if (!isDraggingSplit) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const stageEl = imageStageRef.current;
      if (!stageEl) return;
      const rect = stageEl.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      setSplitPos(Math.round(pos));
    };
    const handleUp = () => {
      setIsDraggingSplit(false);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDraggingSplit]);

  // Reset all settings and parameters to factory defaults
  const handleResetAllToDefault = () => {
    setConfig({ ...DEFAULT_ZOOM_CONFIG });
    setActivePresetId("scifi_warp");
    setPlaybackFps(10);
    setShowOriginalComparison(false);
    setActiveFocalTarget("start");
    setPreviewViewMode("stage");
    setPreviewZoomLevel(1.0);
    setSplitPos(50);
    setIsHoldingOriginal(false);
    setIsControlsPanelVisible(true);
    setIsFilmstripVisible(true);
    setIsFooterVisible(true);
    showToast(
      uiMessage(
        "zoom_studio.toast.reset_defaults",
        "All zoom parameters reset to factory defaults"
      )
    );
  };

  // Keyboard navigation & escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.tagName === "TEXTAREA");
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " " && !isTyping && generatedFrames.length > 0) {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === "ArrowLeft" && !isTyping && generatedFrames.length > 0) {
        e.preventDefault();
        setCurrentFrameIndex(
          (idx) => (idx - 1 + generatedFrames.length) % generatedFrames.length
        );
      } else if (e.key === "ArrowRight" && !isTyping && generatedFrames.length > 0) {
        e.preventDefault();
        setCurrentFrameIndex((idx) => (idx + 1) % generatedFrames.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, generatedFrames.length]);

  // Playback timer loop with dynamic Speed Ramp pacing
  useEffect(() => {
    if (!isPlaying || generatedFrames.length <= 1) {
      return;
    }

    const baseDelayMs = Math.round(1000 / Math.max(1, playbackFps));
    let timeoutId: number;

    const scheduleNextFrame = (nextIdx: number) => {
      let delay = baseDelayMs;
      if (config.speedRamp === "bullet_time") {
        const mid = (generatedFrames.length - 1) / 2;
        const distFromMid = Math.abs(nextIdx - mid) / Math.max(1, mid);
        delay = Math.round(baseDelayMs * (distFromMid < 0.35 ? 2.4 : 0.7));
      } else if (config.speedRamp === "slow_to_fast") {
        const progress = nextIdx / Math.max(1, generatedFrames.length - 1);
        delay = Math.round(baseDelayMs * (progress < 0.5 ? 1.7 : 0.6));
      } else if (config.speedRamp === "fast_to_slow") {
        const progress = nextIdx / Math.max(1, generatedFrames.length - 1);
        delay = Math.round(baseDelayMs * (progress < 0.5 ? 0.6 : 1.7));
      } else if (config.speedRamp === "hyper_jump") {
        const progress = nextIdx / Math.max(1, generatedFrames.length - 1);
        delay = Math.round(baseDelayMs * (progress < 0.3 ? 1.9 : 0.5));
      }

      timeoutId = window.setTimeout(() => {
        setCurrentFrameIndex(nextIdx);
        scheduleNextFrame((nextIdx + 1) % generatedFrames.length);
      }, Math.max(25, delay));
    };

    scheduleNextFrame((currentFrameIndex + 1) % generatedFrames.length);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isPlaying, playbackFps, generatedFrames.length, config.speedRamp]);

  // Apply preset cleanly
  const handleSelectPreset = (preset: ZoomPreset) => {
    setActivePresetId(preset.id);
    setConfig((prev) => ({
      ...prev,
      ...preset.config,
    }));
    if (preset.config.mode !== "ken_burns") {
      setActiveFocalTarget("start");
    }
    showToast(
      uiMessage("zoom_studio.toast.preset_applied", "Preset applied: {name}", {
        name: preset.name,
      })
    );
  };

  // Update focal coordinates strictly relative to rendered image bounds
  const applyPointerFocalCoords = (clientX: number, clientY: number) => {
    if (!imageStageRef.current || showOriginalComparison) return;
    const rect = imageStageRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    handleConfigChange((prev) => {
      if (prev.mode === "ken_burns" && activeFocalTarget === "end") {
        return {
          ...prev,
          endFocalX: Number(x.toFixed(3)),
          endFocalY: Number(y.toFixed(3)),
        };
      }
      return {
        ...prev,
        focalX: Number(x.toFixed(3)),
        focalY: Number(y.toFixed(3)),
      };
    });
  };

  const handleFocalPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (showOriginalComparison || !imageStageRef.current) return;
    applyPointerFocalCoords(e.clientX, e.clientY);
    setIsDraggingFocal(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore pointer capture edge cases
    }
  };

  const handleFocalPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingFocal) return;
    applyPointerFocalCoords(e.clientX, e.clientY);
  };

  const handleFocalPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingFocal) {
      setIsDraggingFocal(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Custom Image Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (typeof evt.target?.result === "string") {
        const cleanName = file.name.replace(/\.[^/.]+$/, "") || "Uploaded image";
        setCustomUploadedUrl(evt.target.result);
        setCustomUploadedName(cleanName);
        showToast(
          uiMessage(
            "zoom_studio.toast.uploaded_custom_image",
            "Loaded custom image: {name}",
            { name: file.name }
          )
        );
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Navigate to prev/next slice cleanly (clearing custom upload override if active)
  const handleStepSlice = (delta: number) => {
    if (!slices || slices.length <= 1) return;
    const baseIdx = activeSliceIdx !== null ? activeSliceIdx : 0;
    const nextIdx = (baseIdx + delta + slices.length) % slices.length;
    setCustomUploadedUrl(null);
    setCustomUploadedName(null);
    setIsPlaying(false);
    setActiveSliceIdx(nextIdx);
    if (onNavigateFrame) onNavigateFrame(nextIdx);
  };

  // Download Single Frame
  const handleDownloadSingleFrame = () => {
    const frame = generatedFrames[currentFrameIndex];
    if (!frame) return;
    const ext = frame.url.includes("image/jpeg") ? "jpg" : "png";
    const a = document.createElement("a");
    a.href = frame.url;
    a.download = `${frame.name}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(
      uiMessage("zoom_studio.toast.downloaded_frame", "Downloaded active frame")
    );
  };

  // Download All as ZIP
  const handleDownloadZip = async () => {
    if (generatedFrames.length === 0) return;
    showToast(
      uiMessage("zoom_studio.toast.packaging_zip", "Packaging zip archive...")
    );
    try {
      await exportZoomSeriesAsZip(
        generatedFrames,
        `${effectiveBaseName}_zoom_variations`
      );
      showToast(
        uiMessage("zoom_studio.toast.zip_downloaded", "Zip archive downloaded")
      );
    } catch (err) {
      console.error(err);
      showToast(
        uiMessage("zoom_studio.toast.zip_failed", "Failed to create zip archive")
      );
    }
  };

  // Download Looping GIF
  const handleDownloadGif = async () => {
    if (generatedFrames.length === 0) return;
    showToast(
      uiMessage("zoom_studio.toast.generating_gif", "Encoding animated gif...")
    );
    try {
      const gifBlob = await exportZoomSeriesAsGif(
        generatedFrames,
        playbackFps,
        undefined,
        config.speedRamp
      );
      saveAs(gifBlob, `${effectiveBaseName}_zoom_loop.gif`);
      showToast(
        uiMessage("zoom_studio.toast.gif_exported", "Animated gif exported")
      );
    } catch (err) {
      console.error(err);
      showToast(
        uiMessage("zoom_studio.toast.gif_failed", "Failed to export animated gif")
      );
    }
  };

  // Copy Single Frame to Clipboard (ensuring PNG blob compatibility across all browsers)
  const handleCopySingleFrame = async () => {
    const frame = generatedFrames[currentFrameIndex];
    if (!frame) return;
    try {
      let pngBlob: Blob | null = null;
      if (frame.url.startsWith("data:image/png")) {
        const response = await fetch(frame.url);
        pngBlob = await response.blob();
      } else {
        const img = await loadHtmlImage(frame.url);
        const c = document.createElement("canvas");
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const cCtx = c.getContext("2d");
        if (cCtx) {
          cCtx.drawImage(img, 0, 0);
          pngBlob = await new Promise<Blob | null>((resolve) =>
            c.toBlob((b) => resolve(b), "image/png")
          );
        }
      }
      if (!pngBlob) throw new Error("Could not encode PNG blob");
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": pngBlob }),
      ]);
      showToast(
        uiMessage(
          "zoom_studio.toast.copied_clipboard",
          "Active frame copied to clipboard"
        )
      );
    } catch {
      showToast(
        uiMessage(
          "zoom_studio.toast.copy_failed",
          "Could not copy frame to clipboard"
        )
      );
    }
  };

  // Apply to Storyboard
  const handleSendToStoryboard = (mode: "append_storyboard" | "replace_frame") => {
    if (generatedFrames.length === 0 || !onApplyZoomVariations) return;
    const framesPayload = generatedFrames.map((f) => ({
      name: f.name,
      url: f.url,
    }));
    onApplyZoomVariations(framesPayload, mode, activeSliceIdx);
    showToast(
      mode === "append_storyboard"
        ? uiMessage(
            "zoom_studio.toast.appended_storyboard",
            "Appended {count} zoom frames to storyboard",
            { count: generatedFrames.length }
          )
        : uiMessage(
            "zoom_studio.toast.replaced_frame",
            "Replaced frame with {count} zoom frames",
            { count: generatedFrames.length }
          )
    );
    onClose();
  };

  // Push sequence straight into AniPlayer
  const handleSendToAniPlayer = () => {
    if (generatedFrames.length === 0 || !onOpenInAniPlayer) return;
    const framesPayload = generatedFrames.map((f) => ({
      name: f.name,
      url: f.url,
    }));
    onOpenInAniPlayer(framesPayload, activeSliceIdx);
    onClose();
  };

  if (!isOpen) return null;

  const currentFrame = generatedFrames[currentFrameIndex];
  const totalFrames = (config.extraFrames || 5) + 1;
  const displaySlicePosition =
    activeSliceIdx !== null ? activeSliceIdx + 1 : 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <CustomizableContainer
        ibcId="zoom_studio_modal_container"
        componentType="modal"
        defaultTitle="Zoom image studio"
        className="w-full max-w-7xl h-[94vh] max-h-[950px] bg-[#020617] border border-[#1e293b] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <CustomizableContainer
          ibcId="zoom_studio_header_panel"
          componentType="panel"
          defaultTitle="Zoom studio header"
          className="flex items-center justify-between gap-4 px-4 py-3 bg-[#0f172a] border-b border-[#1e293b] shrink-0"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <ZoomIn className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CustomizableButton
                  buttonId="zoom_studio_label_title"
                  defaultLabel="Zoom image studio"
                  defaultIcon={<ZoomIn className="w-4 h-4 text-blue-400" />}
                  className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2 truncate cursor-default whitespace-nowrap"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="truncate max-w-[220px] text-slate-300 font-medium font-mono text-[11px]">
                  {effectiveBaseName}
                </span>
                {slices && slices.length > 1 && (
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-md px-1 py-0.5 ml-1 shrink-0">
                    <CustomizableButton
                      buttonId="zoom_studio_frame_prev"
                      defaultLabel="Prev"
                      defaultIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                      onClick={() => handleStepSlice(-1)}
                      className="p-0.5 text-slate-400 hover:text-blue-400 rounded cursor-pointer whitespace-nowrap shrink-0"
                      title="Previous frame"
                    />
                    <span className="text-[10px] font-mono tabular-nums font-semibold text-slate-400 px-1">
                      {displaySlicePosition} / {slices.length}
                    </span>
                    <CustomizableButton
                      buttonId="zoom_studio_frame_next"
                      defaultLabel="Next"
                      defaultIcon={<ChevronRight className="w-3.5 h-3.5" />}
                      onClick={() => handleStepSlice(1)}
                      className="p-0.5 text-slate-400 hover:text-blue-400 rounded cursor-pointer whitespace-nowrap shrink-0"
                      title="Next frame"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <CustomizableButton
              buttonId="zoom_studio_upload_image"
              defaultLabel="Upload image"
              defaultIcon={<Upload className="w-3.5 h-3.5 text-blue-400" />}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-[#020617] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#1e293b] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Upload custom image to zoom"
            />

            {customUploadedUrl && (
              <CustomizableButton
                buttonId="zoom_studio_reset_upload"
                defaultLabel="Revert image"
                defaultIcon={<RotateCcw className="w-3 h-3" />}
                onClick={() => {
                  setCustomUploadedUrl(null);
                  setCustomUploadedName(null);
                  showToast(
                    uiMessage(
                      "zoom_studio.toast.reverted_original",
                      "Reverted to workspace frame"
                    )
                  );
                }}
                className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                title="Clear custom upload and restore active workspace frame"
              />
            )}

            <CustomizableButton
              buttonId="zoom_studio_reset_defaults"
              defaultLabel="Reset defaults"
              defaultIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
              onClick={handleResetAllToDefault}
              className="px-3 py-1.5 bg-[#020617] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#1e293b] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Reset all zoom trajectory, optical fx, and speed ramp settings to defaults"
            />

            <CustomizableButton
              buttonId="zoom_studio_toggle_filmstrip"
              defaultLabel={
                isFilmstripVisible ? "Hide filmstrip" : "Show filmstrip"
              }
              defaultIcon={<Film className="w-3.5 h-3.5 text-blue-400" />}
              onClick={() => setIsFilmstripVisible((v) => !v)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border whitespace-nowrap shrink-0",
                isFilmstripVisible
                  ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                  : "bg-blue-600/20 text-blue-300 border-blue-500/40 hover:bg-blue-600/30"
              )}
              title={
                isFilmstripVisible
                  ? "Hide zoom sequence filmstrip panel"
                  : "Show zoom sequence filmstrip panel"
              }
            />

            <CustomizableButton
              buttonId="zoom_studio_toggle_footer"
              defaultLabel={
                isFooterVisible ? "Hide footer" : "Show footer"
              }
              defaultIcon={<Download className="w-3.5 h-3.5 text-blue-400" />}
              onClick={() => setIsFooterVisible((v) => !v)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border whitespace-nowrap shrink-0",
                isFooterVisible
                  ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                  : "bg-blue-600/20 text-blue-300 border-blue-500/40 hover:bg-blue-600/30"
              )}
              title={
                isFooterVisible
                  ? "Hide export and actions footer panel"
                  : "Show export and actions footer panel"
              }
            />

            <CustomizableButton
              buttonId="zoom_studio_toggle_controls"
              defaultLabel={
                isControlsPanelVisible ? "Hide controls" : "Show controls"
              }
              defaultIcon={<Sliders className="w-3.5 h-3.5 text-blue-400" />}
              onClick={() => setIsControlsPanelVisible((v) => !v)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border whitespace-nowrap shrink-0",
                isControlsPanelVisible
                  ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                  : "bg-blue-600/20 text-blue-300 border-blue-500/40 hover:bg-blue-600/30"
              )}
              title={
                isControlsPanelVisible
                  ? "Hide controls panel"
                  : "Show controls panel"
              }
            />

            <CustomizableButton
              buttonId="zoom_studio_regenerate"
              defaultLabel={isGenerating ? "Rendering..." : "Regenerate"}
              defaultIcon={
                <RefreshCw
                  className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")}
                />
              }
              onClick={() =>
                void runGeneration(effectiveImageUrl, config, effectiveBaseName)
              }
              disabled={isGenerating || !effectiveImageUrl}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Regenerate all zoom variation frames"
            />

            <CustomizableButton
              buttonId="zoom_studio_close"
              defaultLabel=""
              forceZeroText={true}
              defaultIcon={<X className="w-4 h-4" />}
              onClick={onClose}
              className="p-2 bg-slate-800/80 hover:bg-rose-950 hover:text-rose-300 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer ml-1 shrink-0"
              title="Close zoom image studio"
            />
          </div>
        </CustomizableContainer>

        {/* Studio Workspace Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left / Center: Interactive Preview Canvas & Filmstrip */}
          <div className="flex-1 flex flex-col bg-[#020617] border-b lg:border-b-0 lg:border-r border-[#1e293b] overflow-hidden">
            {/* Top Preview Toolbar */}
            <CustomizableContainer
              ibcId="zoom_studio_toolbar_panel"
              componentType="panel"
              defaultTitle="Preview playback toolbar"
              className="px-4 py-2 bg-[#090d16] border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-2 shrink-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <CustomizableButton
                  buttonId="zoom_studio_play_pause"
                  defaultLabel={isPlaying ? "Pause" : "Play sequence"}
                  defaultIcon={
                    isPlaying ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )
                  }
                  onClick={() => setIsPlaying((p) => !p)}
                  disabled={generatedFrames.length <= 1}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40 whitespace-nowrap shrink-0",
                    isPlaying
                      ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                      : "bg-blue-600 text-white hover:bg-blue-500"
                  )}
                  title="Play or pause zoom animation"
                />

                {/* FPS Selector */}
                <div className="flex items-center gap-1.5 bg-[#020617] border border-[#1e293b] rounded-lg px-2 py-1 text-xs">
                  <CustomizableLabel
                    labelId="zoom_studio_label_speed"
                    defaultLabel="Speed:"
                    className="text-[11px] text-slate-400 font-medium"
                  />
                  <CustomizableButton
                    buttonId="zoom_studio_speed_5"
                    defaultLabel="5fps"
                    onClick={() => setPlaybackFps(5)}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0",
                      playbackFps === 5
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                    title="Set playback to 5 frames per second"
                  />
                  <CustomizableButton
                    buttonId="zoom_studio_speed_10"
                    defaultLabel="10fps"
                    onClick={() => setPlaybackFps(10)}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0",
                      playbackFps === 10
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                    title="Set playback to 10 frames per second"
                  />
                  <CustomizableButton
                    buttonId="zoom_studio_speed_16"
                    defaultLabel="16fps"
                    onClick={() => setPlaybackFps(16)}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0",
                      playbackFps === 16
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                    title="Set playback to 16 frames per second"
                  />
                  <CustomizableButton
                    buttonId="zoom_studio_speed_24"
                    defaultLabel="24fps"
                    onClick={() => setPlaybackFps(24)}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0",
                      playbackFps === 24
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                    title="Set playback to 24 frames per second"
                  />
                </div>

                {/* View Mode Selector */}
                <div className="flex items-center bg-[#020617] border border-[#1e293b] rounded-lg p-0.5 gap-0.5">
                  <CustomizableButton
                    buttonId="zoom_studio_view_stage"
                    defaultLabel="Stage"
                    defaultIcon={<Film className="w-3.5 h-3.5" />}
                    onClick={() => setPreviewViewMode("stage")}
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0",
                      previewViewMode === "stage"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                    title="Single zoomed frame stage view"
                  />
                  <CustomizableButton
                    buttonId="zoom_studio_view_split"
                    defaultLabel="Split"
                    defaultIcon={<SplitSquareVertical className="w-3.5 h-3.5" />}
                    onClick={() => setPreviewViewMode("split")}
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0",
                      previewViewMode === "split"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                    title="Interactive split comparison slider"
                  />
                  <CustomizableButton
                    buttonId="zoom_studio_view_side_by_side"
                    defaultLabel="Side-by-side"
                    defaultIcon={<Columns className="w-3.5 h-3.5" />}
                    onClick={() => setPreviewViewMode("side_by_side")}
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0",
                      previewViewMode === "side_by_side"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                    title="Side-by-side original and zoomed comparison"
                  />
                </div>

                {/* Hold for Original Button */}
                <CustomizableButton
                  buttonId="zoom_studio_hold_original"
                  defaultLabel="Hold for original"
                  defaultIcon={<Eye className="w-3.5 h-3.5" />}
                  onMouseDown={() => setIsHoldingOriginal(true)}
                  onMouseUp={() => setIsHoldingOriginal(false)}
                  onTouchStart={() => setIsHoldingOriginal(true)}
                  onTouchEnd={() => setIsHoldingOriginal(false)}
                  disabled={!effectiveImageUrl}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 select-none",
                    isHoldingOriginal
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                      : "bg-[#020617] text-slate-400 hover:text-slate-200 border-[#1e293b]"
                  )}
                  title="Hold button to view raw source image"
                />

                {/* Preview Canvas Inspection Zoom Controls */}
                <div className="flex items-center bg-[#020617] border border-[#1e293b] rounded-lg p-0.5 gap-0.5">
                  <CustomizableButton
                    buttonId="zoom_studio_zoom_out"
                    defaultLabel=""
                    forceZeroText={true}
                    defaultIcon={<ZoomOut className="w-3.5 h-3.5" />}
                    onClick={handleZoomOut}
                    disabled={previewZoomLevel <= 0.5}
                    className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 cursor-pointer whitespace-nowrap shrink-0"
                    title="Zoom out canvas preview"
                  />
                  <CustomizableButton
                    buttonId="zoom_studio_zoom_reset"
                    defaultLabel={`${Math.round(previewZoomLevel * 100)}%`}
                    onClick={handleZoomReset}
                    className="px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
                    title="Reset canvas preview to 100%"
                  />
                  <CustomizableButton
                    buttonId="zoom_studio_zoom_in"
                    defaultLabel=""
                    forceZeroText={true}
                    defaultIcon={<ZoomIn className="w-3.5 h-3.5" />}
                    onClick={handleZoomIn}
                    disabled={previewZoomLevel >= 3.0}
                    className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 cursor-pointer whitespace-nowrap shrink-0"
                    title="Zoom in canvas preview"
                  />
                  <CustomizableButton
                    buttonId="zoom_studio_zoom_fit"
                    defaultLabel="Fit"
                    defaultIcon={<Maximize2 className="w-3 h-3" />}
                    onClick={handleZoomFit}
                    className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
                    title="Fit preview to container"
                  />
                </div>
              </div>

              {/* Current frame unboxed metadata readout */}
              <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-400">
                {currentFrame && (
                  <>
                    <span className="text-blue-300 font-semibold">
                      {currentFrame.zoomPercentage}
                      {uiText(
                        "components_zoom_image_studio_modal.span.zoom_lowercase",
                        " zoom"
                      )}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {uiText(
                        "components_zoom_image_studio_modal.span.frame",
                        "Frame "
                      )}
                      {currentFrameIndex + 1} / {generatedFrames.length}
                    </span>
                    <span aria-hidden="true" className="hidden sm:inline">
                      ·
                    </span>
                    <span className="hidden sm:inline text-slate-500">
                      {currentFrame.width} × {currentFrame.height}
                    </span>
                  </>
                )}
              </div>
            </CustomizableContainer>

            {/* Main Image Stage */}
            <CustomizableContainer
              ibcId="zoom_studio_stage_panel"
              componentType="panel"
              defaultTitle="Interactive zoom stage"
              className="flex-1 relative flex items-center justify-center p-4 sm:p-6 overflow-auto select-none bg-[#050811]"
            >
              {isGenerating && (
                <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 pointer-events-none">
                  <div className="w-11 h-11 rounded-full border-2 border-blue-500/25 border-t-blue-400 animate-spin" />
                  <div className="text-center">
                    <CustomizableLabel
                      labelId="zoom_studio_label_generating"
                      defaultLabel="Generating zoom sequence..."
                      as="p"
                      className="text-sm font-semibold text-slate-200"
                    />
                    <p className="text-xs font-mono tabular-nums text-blue-400 mt-1">
                      {Math.round(generationProgress)}%
                    </p>
                  </div>
                </div>
              )}

              {/* View State A: Holding Original */}
              {isHoldingOriginal && effectiveImageUrl ? (
                <div
                  className="relative max-w-full max-h-full flex flex-col items-center justify-center transition-transform duration-100"
                  style={{
                    transform: previewZoomLevel !== 1 ? `scale(${previewZoomLevel})` : undefined,
                    transformOrigin: "center center",
                  }}
                >
                  <div className="absolute top-3 left-3 z-20 bg-amber-950/90 text-amber-300 border border-amber-500/50 px-2.5 py-1 rounded text-[11px] font-bold tracking-wide">
                    Raw source (100%)
                  </div>
                  <img
                    src={effectiveImageUrl}
                    alt={uiText("components_zoom_image_studio_modal.img.original.alt", "Original")}
                    referrerPolicy="no-referrer"
                    draggable={false}
                    className="max-w-full max-h-[50vh] sm:max-h-[56vh] object-contain rounded-lg border border-amber-500/50 shadow-2xl"
                  />
                </div>
              ) : previewViewMode === "split" && effectiveImageUrl && currentFrame ? (
                /* View State B: Split Interactive Comparison Slider */
                <div
                  ref={imageStageRef}
                  className="relative select-none max-w-full max-h-full overflow-hidden rounded-lg border border-[#1e293b] shadow-2xl transition-transform duration-100 cursor-ew-resize"
                  style={{
                    transform: previewZoomLevel !== 1 ? `scale(${previewZoomLevel})` : undefined,
                    transformOrigin: "center center",
                  }}
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (rect.width > 0) {
                      const pos = ((e.clientX - rect.left) / rect.width) * 100;
                      setSplitPos(Math.round(Math.max(0, Math.min(100, pos))));
                      setIsDraggingSplit(true);
                    }
                  }}
                  onTouchStart={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (rect.width > 0 && e.touches[0]) {
                      const pos = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
                      setSplitPos(Math.round(Math.max(0, Math.min(100, pos))));
                      setIsDraggingSplit(true);
                    }
                  }}
                >
                  {/* Background: Current Zoom Frame */}
                  <img
                    src={currentFrame.url}
                    alt={currentFrame.name}
                    referrerPolicy="no-referrer"
                    draggable={false}
                    className="max-w-full max-h-[50vh] sm:max-h-[56vh] object-contain block pointer-events-none"
                  />

                  {/* Foreground: Raw Original Image clipped by splitPos */}
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                  >
                    <img
                      src={effectiveImageUrl}
                      alt={uiText("components_zoom_image_studio_modal.img.original.alt", "Original")}
                      referrerPolicy="no-referrer"
                      draggable={false}
                      className="max-w-full max-h-[50vh] sm:max-h-[56vh] object-contain block"
                    />
                    <div className="absolute top-2 left-2 bg-slate-950/85 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                      Raw source
                    </div>
                  </div>

                  {/* Right Badge: Zoomed Frame Info */}
                  <div
                    className="absolute top-2 right-2 bg-blue-950/90 text-blue-300 border border-blue-500/50 px-2 py-0.5 rounded text-[10px] font-semibold pointer-events-none transition-opacity"
                    style={{ opacity: splitPos < 80 ? 1 : 0 }}
                  >
                    Zoomed ({currentFrame.zoomPercentage})
                  </div>

                  {/* Split Handle Divider */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-blue-400 cursor-ew-resize z-20 pointer-events-none"
                    style={{ left: `${splitPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-blue-500 border-2 border-slate-950 shadow-lg flex items-center justify-center text-slate-950">
                      <SplitSquareVertical className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ) : previewViewMode === "side_by_side" && effectiveImageUrl ? (
                /* View State C: Side-by-Side Comparison */
                <div
                  className="relative max-w-full max-h-full grid grid-cols-1 sm:grid-cols-2 gap-4 items-center justify-center transition-transform duration-100"
                  style={{
                    transform: previewZoomLevel !== 1 ? `scale(${previewZoomLevel})` : undefined,
                    transformOrigin: "center center",
                  }}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <CustomizableLabel
                      labelId="zoom_studio_label_original_source"
                      defaultLabel="Original source"
                      className="text-xs font-medium text-slate-400"
                    />
                    <img
                      src={effectiveImageUrl}
                      alt={uiText(
                        "components_zoom_image_studio_modal.img.original.alt",
                        "Original"
                      )}
                      referrerPolicy="no-referrer"
                      draggable={false}
                      className="max-w-full max-h-[46vh] object-contain rounded-lg border border-[#1e293b]"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <CustomizableLabel
                        labelId="zoom_studio_label_zoomed_preview"
                        defaultLabel="Zoomed preview"
                        className="font-medium text-blue-300"
                      />
                      <span className="font-mono tabular-nums text-slate-400">
                        ({currentFrame?.zoomPercentage || "100%"})
                      </span>
                    </div>
                    {currentFrame && (
                      <img
                        src={currentFrame.url}
                        alt={uiText(
                          "components_zoom_image_studio_modal.img.zoomed.alt",
                          "Zoomed"
                        )}
                        referrerPolicy="no-referrer"
                        draggable={false}
                        className="max-w-full max-h-[46vh] object-contain rounded-lg border border-blue-500/40"
                      />
                    )}
                  </div>
                </div>
              ) : currentFrame ? (
                /* View State D: Hero Stage with Interactive Focal Anchor */
                <div
                  ref={imageStageRef}
                  onPointerDown={handleFocalPointerDown}
                  onPointerMove={handleFocalPointerMove}
                  onPointerUp={handleFocalPointerUp}
                  onPointerCancel={handleFocalPointerUp}
                  className="relative inline-flex items-center justify-center max-w-full max-h-full cursor-crosshair touch-none transition-transform duration-100"
                  style={{
                    transform: previewZoomLevel !== 1 ? `scale(${previewZoomLevel})` : undefined,
                    transformOrigin: "center center",
                  }}
                >
                  <img
                    src={currentFrame.url}
                    alt={currentFrame.name}
                    referrerPolicy="no-referrer"
                    draggable={false}
                    className="max-w-full max-h-[50vh] sm:max-h-[56vh] object-contain rounded-lg border border-[#1e293b] pointer-events-none select-none"
                  />

                  {/* Ken Burns trajectory vector overlay when in ken_burns mode */}
                  {config.mode === "ken_burns" && (
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <line
                        x1={config.focalX * 100}
                        y1={config.focalY * 100}
                        x2={config.endFocalX * 100}
                        y2={config.endFocalY * 100}
                        stroke="rgba(96, 165, 250, 0.7)"
                        strokeWidth="0.6"
                        strokeDasharray="2 1.5"
                      />
                    </svg>
                  )}

                  {/* Start / Primary Focal Point Marker */}
                  <div
                    className="absolute pointer-events-none transition-transform duration-75"
                    style={{
                      left: `${config.focalX * 100}%`,
                      top: `${config.focalY * 100}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="relative flex items-center justify-center">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full border-2 backdrop-blur-sm",
                          activeFocalTarget === "start" || config.mode !== "ken_burns"
                            ? "border-blue-400 bg-blue-500/20"
                            : "border-blue-400/60 bg-blue-500/10"
                        )}
                      />
                      <div className="absolute w-1.5 h-1.5 rounded-full bg-white" />
                      <span className="absolute top-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-950/90 border border-blue-500/40 text-[10px] font-mono tabular-nums text-blue-300 whitespace-nowrap">
                        {config.mode === "ken_burns"
                          ? uiText(
                              "components_zoom_image_studio_modal.span.start_anchor_coord",
                              "Start "
                            )
                          : uiText(
                              "components_zoom_image_studio_modal.span.focal_center",
                              "Focus "
                            )}
                        ({Math.round(config.focalX * 100)}%,{" "}
                        {Math.round(config.focalY * 100)}%)
                      </span>
                    </div>
                  </div>

                  {/* Secondary End Focal Marker for Ken Burns Panning */}
                  {config.mode === "ken_burns" && (
                    <div
                      className="absolute pointer-events-none transition-transform duration-75"
                      style={{
                        left: `${config.endFocalX * 100}%`,
                        top: `${config.endFocalY * 100}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div className="relative flex items-center justify-center">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full border-2 backdrop-blur-sm",
                            activeFocalTarget === "end"
                              ? "border-amber-400 bg-amber-500/20"
                              : "border-amber-400/60 bg-amber-500/10"
                          )}
                        />
                        <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-300" />
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-950/90 border border-amber-500/40 text-[10px] font-mono tabular-nums text-amber-300 whitespace-nowrap">
                          {uiText(
                            "components_zoom_image_studio_modal.span.end_anchor_coord",
                            "End "
                          )}
                          ({Math.round(config.endFocalX * 100)}%,{" "}
                          {Math.round(config.endFocalY * 100)}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-center max-w-sm px-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                    <ZoomIn className="w-6 h-6" />
                  </div>
                  <CustomizableLabel
                    labelId="zoom_studio_label_empty_state"
                    defaultLabel="Upload an artwork image or load a frame to generate zoom sequences."
                    as="p"
                    className="text-xs text-slate-400 leading-relaxed"
                  />
                  <CustomizableButton
                    buttonId="zoom_studio_empty_upload_cta"
                    defaultLabel="Upload image"
                    defaultIcon={<Upload className="w-3.5 h-3.5" />}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    title="Upload an image from your device"
                  />
                </div>
              )}

              {/* Focal Drag Helper Caption */}
              {previewViewMode === "stage" && !isHoldingOriginal && currentFrame && (
                <div className="absolute bottom-3 left-4 pointer-events-none bg-slate-950/85 border border-[#1e293b] rounded-lg px-2.5 py-1 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <CustomizableLabel
                    labelId="zoom_studio_label_focal_hint"
                    defaultLabel="Click or drag on the image to position the active focal anchor"
                  />
                </div>
              )}

              {/* Floating button to restore controls panel when hidden */}
              {!isControlsPanelVisible && (
                <CustomizableButton
                  buttonId="zoom_studio_show_controls_float"
                  defaultLabel="Show controls"
                  defaultIcon={<Sliders className="w-3.5 h-3.5 text-blue-400" />}
                  onClick={() => setIsControlsPanelVisible(true)}
                  className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg bg-[#090d16]/95 hover:bg-[#0f172a] text-blue-300 hover:text-white border border-blue-500/40 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  title="Expand controls sidebar"
                />
              )}

              {/* Floating button to restore filmstrip panel when hidden */}
              {!isFilmstripVisible && (
                <CustomizableButton
                  buttonId="zoom_studio_show_filmstrip_float"
                  defaultLabel="Show filmstrip"
                  defaultIcon={<Film className="w-3.5 h-3.5 text-blue-400" />}
                  onClick={() => setIsFilmstripVisible(true)}
                  className="absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-lg bg-[#090d16]/95 hover:bg-[#0f172a] text-blue-300 hover:text-white border border-blue-500/40 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-lg"
                  title="Restore zoom sequence filmstrip panel"
                />
              )}
            </CustomizableContainer>

            {/* Filmstrip Sequence Scrubber */}
            {isFilmstripVisible && (
              <CustomizableContainer
                ibcId="zoom_studio_filmstrip_panel"
                componentType="panel"
                defaultTitle="Zoom sequence filmstrip"
                className="bg-[#090d16] border-t border-[#1e293b] p-3 shrink-0 flex flex-col gap-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Film className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <CustomizableLabel
                      labelId="zoom_studio_label_sequence_strip"
                      defaultLabel="Zoom variation sequence"
                    />
                    <span className="text-slate-500 font-mono tabular-nums text-[11px]">
                      ({generatedFrames.length}
                      {uiText(
                        "components_zoom_image_studio_modal.span.frames",
                        " frames)"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <CustomizableLabel
                        labelId="zoom_studio_label_scrubber"
                        defaultLabel="Frame scrubber:"
                      />
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, generatedFrames.length - 1)}
                        value={currentFrameIndex}
                        disabled={generatedFrames.length <= 1}
                        onChange={(e) => {
                          setIsPlaying(false);
                          setCurrentFrameIndex(Number(e.target.value));
                        }}
                        className="w-32 sm:w-48 accent-blue-500 cursor-pointer disabled:opacity-40"
                      />
                    </div>
                    <CustomizableButton
                      buttonId="zoom_studio_filmstrip_collapse"
                      defaultLabel="Hide"
                      defaultIcon={<ChevronDown className="w-3.5 h-3.5" />}
                      onClick={() => setIsFilmstripVisible(false)}
                      className="px-2 py-1 rounded text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                      title="Hide sequence filmstrip panel"
                    />
                  </div>
                </div>

                {/* Thumbnails filmstrip */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
                  {generatedFrames.map((frame, idx) => {
                    const isSelected = currentFrameIndex === idx;
                    return (
                      <CustomizableButton
                        buttonId="zoom_image_studio_modal_btn_14"
                        key={frame.id}
                        onClick={() => {
                          setCurrentFrameIndex(idx);
                          setIsPlaying(false);
                        }}
                        className={cn(
                          "relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border transition-all cursor-pointer group",
                          isSelected
                            ? "border-blue-500 ring-2 ring-blue-500/40 z-10"
                            : "border-[#1e293b] hover:border-slate-600 opacity-75 hover:opacity-100"
                        )}
                        title={`${frame.name} (${frame.zoomPercentage})`}
                      >
                        {() => (
                          <>
                            <img
                              src={frame.url}
                              alt={frame.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-x-0 bottom-0 px-1.5 py-0.5 bg-gradient-to-t from-black/85 via-black/50 to-transparent flex items-center justify-between text-[10px] font-mono tabular-nums">
                              <span className="text-slate-200 font-semibold">
                                #{idx + 1}
                              </span>
                              <span className="text-blue-300 font-semibold">
                                {frame.zoomPercentage}
                              </span>
                            </div>
                          </>
                        )}
                      </CustomizableButton>
                    );
                  })}
                </div>
              </CustomizableContainer>
            )}
          </div>

          {/* Right Sidebar: Comprehensive Zoom Parameters & FX Controls */}
          {isControlsPanelVisible && (
            <CustomizableContainer
              ibcId="zoom_studio_sidebar_panel"
              componentType="panel"
              defaultTitle="Zoom studio controls sidebar"
              className="w-full lg:w-80 xl:w-96 flex flex-col bg-[#090d16] overflow-y-auto shrink-0 divide-y divide-[#1e293b]"
            >
              {/* Sidebar Tab Navigation */}
              <div className="grid grid-cols-3 p-2 gap-1 bg-[#020617] border-b border-[#1e293b] shrink-0">
                <CustomizableButton
                  buttonId="zoom_studio_tab_zoom"
                  defaultLabel="Zoom"
                  defaultIcon={<Sliders className="w-3.5 h-3.5" />}
                  onClick={() => setActiveTab("zoom_params")}
                  className={cn(
                    "py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0",
                    activeTab === "zoom_params"
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  )}
                  title="Zoom parameters and trajectory controls"
                />
                <CustomizableButton
                  buttonId="zoom_studio_tab_effects"
                  defaultLabel="Effects"
                  defaultIcon={<Sparkles className="w-3.5 h-3.5" />}
                  onClick={() => setActiveTab("effects")}
                  className={cn(
                    "py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0",
                    activeTab === "effects"
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  )}
                  title="Optical effects and color grading"
                />
                <CustomizableButton
                  buttonId="zoom_studio_tab_presets"
                  defaultLabel="Presets"
                  defaultIcon={<Wand2 className="w-3.5 h-3.5" />}
                  onClick={() => setActiveTab("presets")}
                  className={cn(
                    "py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0",
                    activeTab === "presets"
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  )}
                  title="Curated zoom presets"
                />
              </div>

              {/* TAB 1: Zoom Settings & Extra Frames Control */}
              {activeTab === "zoom_params" && (
                <CustomizableContainer
                  ibcId="zoom_studio_tab_panel_zoom"
                  componentType="tab"
                  defaultTitle="Zoom parameters tab"
                  className="p-4 space-y-5"
                >
                  {/* Zoom Range: Start Zoom & End Zoom */}
                  <div className="space-y-3 pb-4 border-b border-[#1e293b]">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <CustomizableLabel
                            labelId="zoom_studio_label_start_zoom"
                            defaultLabel="Start zoom"
                            className="text-xs text-slate-300 font-medium"
                          />
                          <span className="text-[11px] font-mono tabular-nums text-blue-400 font-bold">
                            {Math.round(config.startZoom * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.5}
                          max={3.0}
                          step={0.05}
                          value={config.startZoom}
                          onChange={(e) =>
                            handleConfigChange((prev) => ({
                              ...prev,
                              startZoom: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <CustomizableLabel
                            labelId="zoom_studio_label_end_zoom"
                            defaultLabel="End zoom"
                            className="text-xs text-slate-300 font-medium"
                          />
                          <span className="text-[11px] font-mono tabular-nums text-blue-400 font-bold">
                            {Math.round(config.endZoom * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.5}
                          max={5.0}
                          step={0.05}
                          value={config.endZoom}
                          onChange={(e) =>
                            handleConfigChange((prev) => ({
                              ...prev,
                              endZoom: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Zoom Mode Selector */}
                  <div className="space-y-1.5 pb-3 border-b border-[#1e293b]">
                    <CustomizableLabel
                      labelId="zoom_image_studio_modal_item_12"
                      defaultLabel="Zoom trajectory mode"
                      className="text-xs font-semibold text-slate-300 block"
                    />
                    <select
                      value={config.mode}
                      onChange={(e) => {
                        const nextMode = e.target.value as ZoomMode;
                        handleConfigChange((prev) => {
                          if (
                            nextMode === "ken_burns" &&
                            Math.abs(prev.focalX - prev.endFocalX) < 0.03 &&
                            Math.abs(prev.focalY - prev.endFocalY) < 0.03
                          ) {
                            return {
                              ...prev,
                              mode: nextMode,
                              focalX: 0.35,
                              focalY: 0.4,
                              endFocalX: 0.65,
                              endFocalY: 0.6,
                            };
                          }
                          if (
                            nextMode === "spiral_twist" &&
                            prev.spiralAngle === 0
                          ) {
                            return {
                              ...prev,
                              mode: nextMode,
                              spiralAngle: 15,
                            };
                          }
                          return {
                            ...prev,
                            mode: nextMode,
                          };
                        });
                      }}
                      className="w-full bg-[#020617] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="zoom_in">
                        {uiText(
                          "components_zoom_image_studio_modal.option.zoom_in_push_in_to_subject",
                          "Zoom in (push-in to subject)"
                        )}
                      </option>
                      <option value="zoom_out">
                        {uiText(
                          "components_zoom_image_studio_modal.option.zoom_out_pull_back_to_wide",
                          "Zoom out (pull-back to wide)"
                        )}
                      </option>
                      <option value="yoyo">
                        {uiText(
                          "components_zoom_image_studio_modal.option.yo_yo_loop_zoom_in_and_out",
                          "Yo-yo loop (zoom in and out)"
                        )}
                      </option>
                      <option value="pulse">
                        {uiText(
                          "components_zoom_image_studio_modal.option.pulse_rhythmic_breathe",
                          "Pulse rhythmic breathe"
                        )}
                      </option>
                      <option value="spiral_twist">
                        {uiText(
                          "components_zoom_image_studio_modal.option.spiral_twist_corkscrew",
                          "Spiral twist corkscrew"
                        )}
                      </option>
                      <option value="dolly_vertigo">
                        {uiText(
                          "components_zoom_image_studio_modal.option.dolly_vertigo_optical_push_pull",
                          "Dolly vertigo optical push-pull"
                        )}
                      </option>
                      <option value="ken_burns">
                        {uiText(
                          "components_zoom_image_studio_modal.option.ken_burns_focal_drift",
                          "Ken burns focal drift"
                        )}
                      </option>
                    </select>
                  </div>

                  {/* Extra Frames Counter */}
                  <div className="space-y-2 pb-4 border-b border-[#1e293b]">
                    <div className="flex items-center justify-between gap-2">
                      <CustomizableButton
                        buttonId="zoom_studio_label_extra_frames"
                        defaultLabel="Amount of extra frames"
                        defaultIcon={<Layers className="w-4 h-4 text-blue-400" />}
                        className="text-xs font-semibold text-slate-100 flex items-center gap-1.5 cursor-default whitespace-nowrap"
                      />
                      <span className="text-[11px] font-mono tabular-nums text-blue-300 font-semibold">
                        +{config.extraFrames}
                        {uiText(
                          "components_zoom_image_studio_modal.span.extra_sep",
                          " · "
                        )}
                        {totalFrames}
                        {uiText(
                          "components_zoom_image_studio_modal.span.total_lowercase",
                          " total"
                        )}
                      </span>
                    </div>

                    <CustomizableLabel
                      labelId="zoom_studio_label_extra_frames_desc"
                      defaultLabel="Choose how many zoom variation frames to generate alongside the base frame."
                      as="p"
                      className="text-[11px] text-slate-400 leading-snug"
                    />

                    <div className="flex items-center gap-2">
                      <CustomizableButton
                        buttonId="zoom_studio_extra_frames_dec"
                        defaultLabel="-"
                        onClick={() =>
                          handleConfigChange((prev) => ({
                            ...prev,
                            extraFrames: Math.max(1, prev.extraFrames - 1),
                          }))
                        }
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Decrease extra frames"
                      />
                      <input
                        type="range"
                        min={1}
                        max={24}
                        value={config.extraFrames}
                        onChange={(e) =>
                          handleConfigChange((prev) => ({
                            ...prev,
                            extraFrames: Number(e.target.value),
                          }))
                        }
                        className="flex-1 accent-blue-500 cursor-pointer"
                      />
                      <CustomizableButton
                        buttonId="zoom_studio_extra_frames_inc"
                        defaultLabel="+"
                        onClick={() =>
                          handleConfigChange((prev) => ({
                            ...prev,
                            extraFrames: Math.min(24, prev.extraFrames + 1),
                          }))
                        }
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Increase extra frames"
                      />
                      <span className="w-7 text-right font-mono tabular-nums font-bold text-xs text-slate-100">
                        {config.extraFrames}
                      </span>
                    </div>

                    {/* Quick Preset Buttons for Extra Frames */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <CustomizableLabel
                        labelId="zoom_studio_label_quick_counts"
                        defaultLabel="Quick:"
                        className="text-[11px] text-slate-500"
                      />
                      <CustomizableButton
                        buttonId="zoom_studio_quick_frames_3"
                        defaultLabel="+3"
                        onClick={() =>
                          handleConfigChange((prev) => ({ ...prev, extraFrames: 3 }))
                        }
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-mono tabular-nums font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0",
                          config.extraFrames === 3
                            ? "bg-blue-600 text-white"
                            : "bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800"
                        )}
                      />
                      <CustomizableButton
                        buttonId="zoom_studio_quick_frames_5"
                        defaultLabel="+5"
                        onClick={() =>
                          handleConfigChange((prev) => ({ ...prev, extraFrames: 5 }))
                        }
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-mono tabular-nums font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0",
                          config.extraFrames === 5
                            ? "bg-blue-600 text-white"
                            : "bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800"
                        )}
                      />
                      <CustomizableButton
                        buttonId="zoom_studio_quick_frames_8"
                        defaultLabel="+8"
                        onClick={() =>
                          handleConfigChange((prev) => ({ ...prev, extraFrames: 8 }))
                        }
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-mono tabular-nums font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0",
                          config.extraFrames === 8
                            ? "bg-blue-600 text-white"
                            : "bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800"
                        )}
                      />
                      <CustomizableButton
                        buttonId="zoom_studio_quick_frames_12"
                        defaultLabel="+12"
                        onClick={() =>
                          handleConfigChange((prev) => ({ ...prev, extraFrames: 12 }))
                        }
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-mono tabular-nums font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0",
                          config.extraFrames === 12
                            ? "bg-blue-600 text-white"
                            : "bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800"
                        )}
                      />
                      <CustomizableButton
                        buttonId="zoom_studio_quick_frames_16"
                        defaultLabel="+16"
                        onClick={() =>
                          handleConfigChange((prev) => ({ ...prev, extraFrames: 16 }))
                        }
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-mono tabular-nums font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0",
                          config.extraFrames === 16
                            ? "bg-blue-600 text-white"
                            : "bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800"
                        )}
                      />
                    </div>
                  </div>

                  {/* Speed Ramp FX Selector */}
                  <div className="space-y-1.5 pb-3 border-b border-[#1e293b]">
                    <div className="flex items-center justify-between gap-2">
                      <CustomizableLabel
                        labelId="zoom_image_studio_modal_item_11"
                        defaultLabel="Speed ramp curve"
                        defaultIcon={<FastForward className="w-3.5 h-3.5 text-blue-400" />}
                        className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
                      />
                      {config.speedRamp && config.speedRamp !== "none" && (
                        <span className="text-[11px] font-mono text-amber-300 font-medium">
                          {uiText(
                            "components_zoom_image_studio_modal.span.ramping",
                            "Active"
                          )}
                        </span>
                      )}
                    </div>
                    <select
                      value={config.speedRamp || "none"}
                      onChange={(e) =>
                        handleConfigChange((prev) => ({
                          ...prev,
                          speedRamp: e.target.value as ZoomSpeedRamp,
                        }))
                      }
                      className="w-full bg-[#020617] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="none">
                        {uiText(
                          "components_zoom_image_studio_modal.option.none_constant_linear_velocity",
                          "None (constant velocity)"
                        )}
                      </option>
                      <option value="slow_to_fast">
                        {uiText(
                          "components_zoom_image_studio_modal.option.slow_to_fast_rocket_push_in",
                          "Slow to fast (rocket push-in)"
                        )}
                      </option>
                      <option value="fast_to_slow">
                        {uiText(
                          "components_zoom_image_studio_modal.option.fast_to_slow_impact_deceleration",
                          "Fast to slow (impact deceleration)"
                        )}
                      </option>
                      <option value="bullet_time">
                        {uiText(
                          "components_zoom_image_studio_modal.option.bullet_time_mid_sequence_freeze_and_burst",
                          "Bullet-time (mid-sequence freeze and burst)"
                        )}
                      </option>
                      <option value="hyper_jump">
                        {uiText(
                          "components_zoom_image_studio_modal.option.hyper_jump_sci_fi_quantum_warp_acceleration",
                          "Hyper-jump (quantum warp acceleration)"
                        )}
                      </option>
                    </select>
                  </div>

                  {/* Quick Presets Bar */}
                  <div className="space-y-2 pb-4 border-b border-[#1e293b]">
                    <div className="flex items-center justify-between gap-2">
                      <CustomizableButton
                        buttonId="zoom_studio_label_quick_presets"
                        defaultLabel="Quick style presets"
                        defaultIcon={<Wand2 className="w-3.5 h-3.5 text-blue-400" />}
                        className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-default whitespace-nowrap"
                      />
                      <CustomizableButton
                        buttonId="zoom_studio_view_all_presets"
                        defaultLabel="View all"
                        onClick={() => setActiveTab("presets")}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer whitespace-nowrap shrink-0"
                        title="Browse all presets"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ZOOM_PRESETS.slice(0, 4).map((preset) => {
                        const isActive = activePresetId === preset.id;
                        return (
                          <CustomizableButton
                            buttonId={preset.quickButtonId}
                            key={preset.quickButtonId}
                            defaultLabel={preset.shortLabel}
                            onClick={() => handleSelectPreset(preset)}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center border whitespace-nowrap truncate",
                              isActive
                                ? "bg-blue-600 text-white border-blue-500"
                                : "bg-[#020617] text-slate-300 hover:text-white border-[#1e293b] hover:border-slate-700"
                            )}
                            title={preset.description}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Easing Curve */}
                  <div className="space-y-1.5">
                    <CustomizableLabel
                      labelId="zoom_image_studio_modal_item_10"
                      defaultLabel="Interpolation easing"
                      as="label"
                      className="text-xs font-semibold text-slate-300 block"
                    />
                    <select
                      value={config.easing}
                      onChange={(e) =>
                        handleConfigChange((prev) => ({
                          ...prev,
                          easing: e.target.value as ZoomEasing,
                        }))
                      }
                      className="w-full bg-[#020617] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="ease_in_out">
                        {uiText(
                          "components_zoom_image_studio_modal.option.ease_in_out_cinematic_smooth_s_curve",
                          "Ease in-out (smooth s-curve)"
                        )}
                      </option>
                      <option value="ease_in">
                        {uiText(
                          "components_zoom_image_studio_modal.option.ease_in_accelerating_speed_push",
                          "Ease in (accelerating push)"
                        )}
                      </option>
                      <option value="ease_out">
                        {uiText(
                          "components_zoom_image_studio_modal.option.ease_out_decelerating_landing",
                          "Ease out (decelerating landing)"
                        )}
                      </option>
                      <option value="linear">
                        {uiText(
                          "components_zoom_image_studio_modal.option.linear_constant_speed_rate",
                          "Linear (constant rate)"
                        )}
                      </option>
                      <option value="bounce">
                        {uiText(
                          "components_zoom_image_studio_modal.option.bounce_impact_elastic_punch",
                          "Bounce impact (elastic punch)"
                        )}
                      </option>
                    </select>
                  </div>

                  {/* Focal Anchor Grid Selection (with Start & End Switcher in Ken Burns Mode) */}
                  <div className="space-y-2.5 pt-2 border-t border-[#1e293b]">
                    <div className="flex items-center justify-between gap-2">
                      <CustomizableLabel
                        labelId="zoom_studio_label_focal_anchor"
                        defaultLabel="Focal point anchor"
                        defaultIcon={<Compass className="w-3.5 h-3.5 text-blue-400" />}
                        className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
                      />
                      <span className="text-[11px] font-mono tabular-nums text-slate-400">
                        {Math.round(
                          (config.mode === "ken_burns" && activeFocalTarget === "end"
                            ? config.endFocalX
                            : config.focalX) * 100
                        )}
                        %,{" "}
                        {Math.round(
                          (config.mode === "ken_burns" && activeFocalTarget === "end"
                            ? config.endFocalY
                            : config.focalY) * 100
                        )}
                        %
                      </span>
                    </div>

                    {config.mode === "ken_burns" && (
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#020617] border border-[#1e293b] rounded-lg">
                        <CustomizableButton
                          buttonId="zoom_studio_focal_target_start"
                          defaultLabel="Start anchor"
                          onClick={() => setActiveFocalTarget("start")}
                          className={cn(
                            "py-1 px-2 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0",
                            activeFocalTarget === "start"
                              ? "bg-blue-600 text-white"
                              : "text-slate-400 hover:text-slate-200"
                          )}
                          title="Position start focal anchor on canvas"
                        />
                        <CustomizableButton
                          buttonId="zoom_studio_focal_target_end"
                          defaultLabel="End anchor"
                          onClick={() => setActiveFocalTarget("end")}
                          className={cn(
                            "py-1 px-2 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0",
                            activeFocalTarget === "end"
                              ? "bg-amber-500 text-slate-950 font-semibold"
                              : "text-slate-400 hover:text-slate-200"
                          )}
                          title="Position end focal anchor on canvas for ken burns drift"
                        />
                      </div>
                    )}

                    {/* 3x3 Focal Anchor Grid */}
                    <div className="grid grid-cols-3 gap-1.5 w-40 mx-auto">
                      {FOCAL_GRID_POINTS.map((pt) => {
                        const editingEnd =
                          config.mode === "ken_burns" && activeFocalTarget === "end";
                        const targetX = editingEnd ? config.endFocalX : config.focalX;
                        const targetY = editingEnd ? config.endFocalY : config.focalY;
                        const isSelected =
                          Math.abs(targetX - pt.x) < 0.08 &&
                          Math.abs(targetY - pt.y) < 0.08;
                        return (
                          <CustomizableButton
                            buttonId={editingEnd ? pt.endBtnId : pt.startBtnId}
                            key={editingEnd ? pt.endBtnId : pt.startBtnId}
                            defaultLabel={pt.label}
                            onClick={() =>
                              handleConfigChange((prev) =>
                                editingEnd
                                  ? { ...prev, endFocalX: pt.x, endFocalY: pt.y }
                                  : { ...prev, focalX: pt.x, focalY: pt.y }
                              )
                            }
                            className={cn(
                              "py-1.5 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap",
                              isSelected
                                ? editingEnd
                                  ? "bg-amber-500 text-slate-950"
                                  : "bg-blue-600 text-white"
                                : "bg-[#020617] text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-[#1e293b]"
                            )}
                            title={`Set anchor to ${pt.label}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Spiral Rotation Angle */}
                  <div className="space-y-1.5 pt-2 border-t border-[#1e293b]">
                    <div className="flex items-center justify-between">
                      <CustomizableLabel
                        labelId="zoom_studio_label_spiral_angle"
                        defaultLabel="Spiral rotation angle"
                        className="text-xs font-semibold text-slate-300"
                      />
                      <span className="text-xs font-mono tabular-nums text-cyan-400 font-semibold">
                        {config.spiralAngle}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-45}
                      max={45}
                      step={1}
                      value={config.spiralAngle}
                      onChange={(e) =>
                        handleConfigChange((prev) => ({
                          ...prev,
                          spiralAngle: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* Aspect Ratio Framing */}
                  <div className="space-y-1.5">
                    <CustomizableLabel
                      labelId="zoom_image_studio_modal_item_8"
                      defaultLabel="Aspect ratio framing"
                      as="label"
                      className="text-xs font-semibold text-slate-300 block"
                    />
                    <select
                      value={config.aspectRatio}
                      onChange={(e) =>
                        handleConfigChange((prev) => ({
                          ...prev,
                          aspectRatio: e.target.value as ZoomAspectRatio,
                        }))
                      }
                      className="w-full bg-[#020617] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="original">
                        {uiText(
                          "components_zoom_image_studio_modal.option.original_aspect_ratio",
                          "Original aspect ratio"
                        )}
                      </option>
                      <option value="1:1">
                        {uiText(
                          "components_zoom_image_studio_modal.option.1_1_square_1080_1080",
                          "1:1 square"
                        )}
                      </option>
                      <option value="16:9">
                        {uiText(
                          "components_zoom_image_studio_modal.option.16_9_cinema_wide",
                          "16:9 cinema wide"
                        )}
                      </option>
                      <option value="9:16">
                        {uiText(
                          "components_zoom_image_studio_modal.option.9_16_mobile_vertical_story",
                          "9:16 vertical story"
                        )}
                      </option>
                      <option value="4:3">
                        {uiText(
                          "components_zoom_image_studio_modal.option.4_3_classic_photo",
                          "4:3 classic frame"
                        )}
                      </option>
                    </select>
                  </div>
                </CustomizableContainer>
              )}

              {/* TAB 2: Cinematic Optical Effects */}
              {activeTab === "effects" && (
                <CustomizableContainer
                  ibcId="zoom_studio_tab_panel_effects"
                  componentType="tab"
                  defaultTitle="Optical effects tab"
                  className="p-4 space-y-4"
                >
                  <CustomizableLabel
                    labelId="zoom_studio_label_effects_intro"
                    defaultLabel="Layer optical depth, radial blur, lens dispersion, camera shake, and color grading."
                    as="p"
                    className="text-[11px] text-slate-400 leading-snug"
                  />

                  {/* Effect 1: Radial Zoom Blur */}
                  <div className="pb-3 border-b border-[#1e293b] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="zoom-fx-motion-blur" className="flex items-center gap-2 cursor-pointer">
                        <input
                          id="zoom-fx-motion-blur"
                          type="checkbox"
                          checked={config.effectMotionBlur}
                          onChange={(e) =>
                            handleConfigChange((prev) => ({
                              ...prev,
                              effectMotionBlur: e.target.checked,
                            }))
                          }
                          className="rounded border-[#1e293b] text-blue-500 focus:ring-0 cursor-pointer"
                        />
                        <CustomizableLabel
                          labelId="zoom_image_studio_modal_item_7"
                          defaultLabel="Radial zoom blur"
                          className="text-xs font-semibold text-slate-200 cursor-pointer"
                        />
                      </label>
                      <span className="text-[11px] font-mono tabular-nums text-blue-400 font-semibold">
                        {config.motionBlurStrength}%
                      </span>
                    </div>
                    {config.effectMotionBlur && (
                      <input
                        type="range"
                        min={5}
                        max={100}
                        value={config.motionBlurStrength}
                        onChange={(e) =>
                          handleConfigChange((prev) => ({
                            ...prev,
                            motionBlurStrength: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    )}
                  </div>

                  {/* Effect 2: Chromatic Aberration / RGB Split */}
                  <div className="pb-3 border-b border-[#1e293b] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="zoom-fx-rgb-split" className="flex items-center gap-2 cursor-pointer">
                        <input
                          id="zoom-fx-rgb-split"
                          type="checkbox"
                          checked={config.effectRgbSplit}
                          onChange={(e) =>
                            handleConfigChange((prev) => ({
                              ...prev,
                              effectRgbSplit: e.target.checked,
                            }))
                          }
                          className="rounded border-[#1e293b] text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                        <CustomizableLabel
                          labelId="zoom_image_studio_modal_item_6"
                          defaultLabel="Chromatic rgb split"
                          className="text-xs font-semibold text-slate-200 cursor-pointer"
                        />
                      </label>
                      <span className="text-[11px] font-mono tabular-nums text-cyan-400 font-semibold">
                        {config.rgbSplitAmount}
                        {uiText(
                          "components_zoom_image_studio_modal.span.px",
                          "px"
                        )}
                      </span>
                    </div>
                    {config.effectRgbSplit && (
                      <input
                        type="range"
                        min={1}
                        max={20}
                        value={config.rgbSplitAmount}
                        onChange={(e) =>
                          handleConfigChange((prev) => ({
                            ...prev,
                            rgbSplitAmount: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    )}
                  </div>

                  {/* Effect 3: Depth Vignette */}
                  <div className="pb-3 border-b border-[#1e293b] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="zoom-fx-vignette" className="flex items-center gap-2 cursor-pointer">
                        <input
                          id="zoom-fx-vignette"
                          type="checkbox"
                          checked={config.effectVignette}
                          onChange={(e) =>
                            handleConfigChange((prev) => ({
                              ...prev,
                              effectVignette: e.target.checked,
                            }))
                          }
                          className="rounded border-[#1e293b] text-blue-500 focus:ring-0 cursor-pointer"
                        />
                        <CustomizableLabel
                          labelId="zoom_image_studio_modal_item_5"
                          defaultLabel="Depth vignette"
                          className="text-xs font-semibold text-slate-200 cursor-pointer"
                        />
                      </label>
                      <span className="text-[11px] font-mono tabular-nums text-blue-400 font-semibold">
                        {config.vignetteStrength}%
                      </span>
                    </div>
                    {config.effectVignette && (
                      <input
                        type="range"
                        min={5}
                        max={100}
                        value={config.vignetteStrength}
                        onChange={(e) =>
                          handleConfigChange((prev) => ({
                            ...prev,
                            vignetteStrength: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    )}
                  </div>

                  {/* Effect 4: Highlight Bloom */}
                  <div className="pb-3 border-b border-[#1e293b] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="zoom-fx-glow" className="flex items-center gap-2 cursor-pointer">
                        <input
                          id="zoom-fx-glow"
                          type="checkbox"
                          checked={config.effectGlow}
                          onChange={(e) =>
                            handleConfigChange((prev) => ({
                              ...prev,
                              effectGlow: e.target.checked,
                            }))
                          }
                          className="rounded border-[#1e293b] text-amber-500 focus:ring-0 cursor-pointer"
                        />
                        <CustomizableLabel
                          labelId="zoom_image_studio_modal_item_4"
                          defaultLabel="Highlight bloom"
                          className="text-xs font-semibold text-slate-200 cursor-pointer"
                        />
                      </label>
                      <span className="text-[11px] font-mono tabular-nums text-amber-400 font-semibold">
                        {config.glowStrength}%
                      </span>
                    </div>
                    {config.effectGlow && (
                      <input
                        type="range"
                        min={5}
                        max={100}
                        value={config.glowStrength}
                        onChange={(e) =>
                          handleConfigChange((prev) => ({
                            ...prev,
                            glowStrength: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    )}
                  </div>

                  {/* Effect 5: Camera Shake (Restored Engine Feature) */}
                  <div className="pb-3 border-b border-[#1e293b] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="zoom-fx-shake" className="flex items-center gap-2 cursor-pointer">
                        <input
                          id="zoom-fx-shake"
                          type="checkbox"
                          checked={config.effectShake}
                          onChange={(e) =>
                            handleConfigChange((prev) => ({
                              ...prev,
                              effectShake: e.target.checked,
                            }))
                          }
                          className="rounded border-[#1e293b] text-rose-500 focus:ring-0 cursor-pointer"
                        />
                        <CustomizableLabel
                          labelId="zoom_studio_label_camera_shake"
                          defaultLabel="Camera shake"
                          defaultIcon={<Activity className="w-3.5 h-3.5 text-rose-400" />}
                          className="text-xs font-semibold text-slate-200 cursor-pointer flex items-center gap-1.5"
                        />
                      </label>
                      <span className="text-[11px] font-mono tabular-nums text-rose-400 font-semibold">
                        {config.shakeStrength}
                        {uiText(
                          "components_zoom_image_studio_modal.span.px_shake",
                          "px"
                        )}
                      </span>
                    </div>
                    {config.effectShake && (
                      <input
                        type="range"
                        min={1}
                        max={15}
                        value={config.shakeStrength}
                        onChange={(e) =>
                          handleConfigChange((prev) => ({
                            ...prev,
                            shakeStrength: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    )}
                  </div>

                  {/* Effect 6: Film Grain */}
                  <div className="pb-3 border-b border-[#1e293b] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="zoom-fx-grain" className="flex items-center gap-2 cursor-pointer">
                        <input
                          id="zoom-fx-grain"
                          type="checkbox"
                          checked={config.effectFilmGrain}
                          onChange={(e) =>
                            handleConfigChange((prev) => ({
                              ...prev,
                              effectFilmGrain: e.target.checked,
                            }))
                          }
                          className="rounded border-[#1e293b] text-blue-500 focus:ring-0 cursor-pointer"
                        />
                        <CustomizableLabel
                          labelId="zoom_image_studio_modal_item_3"
                          defaultLabel="Film grain"
                          className="text-xs font-semibold text-slate-200 cursor-pointer"
                        />
                      </label>
                      <span className="text-[11px] font-mono tabular-nums text-blue-400 font-semibold">
                        {config.grainStrength}%
                      </span>
                    </div>
                    {config.effectFilmGrain && (
                      <input
                        type="range"
                        min={5}
                        max={80}
                        value={config.grainStrength}
                        onChange={(e) =>
                          handleConfigChange((prev) => ({
                            ...prev,
                            grainStrength: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    )}
                  </div>

                  {/* Color Grading Profile */}
                  <div className="space-y-1.5">
                    <CustomizableLabel
                      labelId="zoom_image_studio_modal_item_2"
                      defaultLabel="Cinematic color grade"
                      as="label"
                      className="text-xs font-semibold text-slate-300 block"
                    />
                    <select
                      value={config.colorGrading}
                      onChange={(e) =>
                        handleConfigChange((prev) => ({
                          ...prev,
                          colorGrading: e.target.value as ZoomColorGrade,
                        }))
                      }
                      className="w-full bg-[#020617] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="none">
                        {uiText(
                          "components_zoom_image_studio_modal.option.original_colors_no_grade",
                          "Original colors (no grade)"
                        )}
                      </option>
                      <option value="cinematic">
                        {uiText(
                          "components_zoom_image_studio_modal.option.cinematic_teal_and_orange",
                          "Cinematic teal and orange"
                        )}
                      </option>
                      <option value="cyberpunk">
                        {uiText(
                          "components_zoom_image_studio_modal.option.cyberpunk_neon",
                          "Cyberpunk neon"
                        )}
                      </option>
                      <option value="golden_hour">
                        {uiText(
                          "components_zoom_image_studio_modal.option.golden_hour_amber",
                          "Golden hour amber"
                        )}
                      </option>
                      <option value="noir">
                        {uiText(
                          "components_zoom_image_studio_modal.option.high_contrast_film_noir",
                          "High-contrast film noir"
                        )}
                      </option>
                      <option value="vintage">
                        {uiText(
                          "components_zoom_image_studio_modal.option.vintage_sepia",
                          "Vintage sepia"
                        )}
                      </option>
                      <option value="punchy">
                        {uiText(
                          "components_zoom_image_studio_modal.option.punchy_high_contrast",
                          "Punchy high contrast"
                        )}
                      </option>
                    </select>
                  </div>

                  {/* Output Format & Quality */}
                  <div className="space-y-2 pt-2 border-t border-[#1e293b]">
                    <CustomizableLabel
                      labelId="zoom_studio_label_output_format"
                      defaultLabel="Output image format"
                      as="label"
                      className="text-xs font-semibold text-slate-300 block"
                    />
                    <select
                      value={config.outputFormat}
                      onChange={(e) =>
                        handleConfigChange((prev) => ({
                          ...prev,
                          outputFormat: e.target.value as "image/png" | "image/jpeg",
                        }))
                      }
                      className="w-full bg-[#020617] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="image/png">
                        {uiText(
                          "components_zoom_image_studio_modal.option.png_lossless",
                          "Png lossless"
                        )}
                      </option>
                      <option value="image/jpeg">
                        {uiText(
                          "components_zoom_image_studio_modal.option.jpeg_compact",
                          "Jpeg compact"
                        )}
                      </option>
                    </select>

                    {config.outputFormat === "image/jpeg" && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between">
                          <CustomizableLabel
                            labelId="zoom_studio_label_output_quality"
                            defaultLabel="Compression quality"
                            className="text-xs text-slate-400"
                          />
                          <span className="text-[11px] font-mono tabular-nums text-blue-400 font-semibold">
                            {Math.round((config.outputQuality || 0.95) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.5}
                          max={1.0}
                          step={0.05}
                          value={config.outputQuality || 0.95}
                          onChange={(e) =>
                            handleConfigChange((prev) => ({
                              ...prev,
                              outputQuality: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </CustomizableContainer>
              )}

              {/* TAB 3: Instant Presets */}
              {activeTab === "presets" && (
                <CustomizableContainer
                  ibcId="zoom_studio_tab_panel_presets"
                  componentType="tab"
                  defaultTitle="Style presets tab"
                  className="p-4 space-y-3"
                >
                  <CustomizableLabel
                    labelId="zoom_studio_label_presets_intro"
                    defaultLabel="Select a curated zoom trajectory and optical recipe for cinema, suspense, documentary, or seamless loops."
                    as="p"
                    className="text-[11px] text-slate-400 leading-snug"
                  />

                  <div className="space-y-2">
                    {ZOOM_PRESETS.map((preset) => {
                      const isActive = activePresetId === preset.id;
                      return (
                        <CustomizableButton
                          buttonId={preset.buttonId}
                          key={preset.buttonId}
                          defaultLabel={preset.name}
                          onClick={() => handleSelectPreset(preset)}
                          className={cn(
                            "w-full text-left p-3 rounded-xl border transition-colors cursor-pointer group flex flex-col gap-1",
                            isActive
                              ? "bg-blue-950/35 border-blue-500/70"
                              : "bg-[#020617] hover:bg-slate-900 border-[#1e293b] hover:border-slate-700"
                          )}
                          title={preset.description}
                        >
                          {({ label, isTextHidden }) => (
                            <>
                              <div className="flex items-center justify-between gap-2">
                                {!isTextHidden && (
                                  <span className="text-xs font-semibold text-slate-100 group-hover:text-blue-300 transition-colors">
                                    {label || preset.name}
                                  </span>
                                )}
                                <span
                                  className={cn(
                                    "text-[11px] font-medium shrink-0",
                                    preset.badgeColor
                                  )}
                                >
                                  {preset.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                                {preset.description}
                              </p>
                            </>
                          )}
                        </CustomizableButton>
                      );
                    })}
                  </div>
                </CustomizableContainer>
              )}
            </CustomizableContainer>
          )}
        </div>

        {/* Footer Actions & Export Bar */}
        {isFooterVisible ? (
          <CustomizableContainer
            ibcId="zoom_studio_footer_panel"
            componentType="panel"
            defaultTitle="Zoom studio export footer"
            className="px-4 py-3 bg-[#0f172a] border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-2 shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              {toastMessage ? (
                <div className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{toastMessage}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 hidden md:inline font-mono tabular-nums">
                  {generatedFrames.length}
                  {uiText(
                    "components_zoom_image_studio_modal.span.frames_ready_space_to_play_pause_drag_on_can",
                    " frames ready · Space to play or pause · Drag image to focus"
                  )}
                </span>
              )}
            </div>

            {/* Export / Pipeline Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <CustomizableButton
                buttonId="zoom_studio_download_active_frame"
                defaultLabel="Active frame"
                defaultIcon={<Download className="w-3.5 h-3.5" />}
                onClick={handleDownloadSingleFrame}
                disabled={generatedFrames.length === 0}
                className="px-3 py-1.5 bg-[#020617] hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white border border-[#1e293b] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Download currently selected frame"
              />

              <CustomizableButton
                buttonId="zoom_studio_download_zip"
                defaultLabel="Download zip"
                defaultIcon={<Archive className="w-3.5 h-3.5" />}
                onClick={handleDownloadZip}
                disabled={generatedFrames.length === 0}
                className="px-3 py-1.5 bg-[#020617] hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white border border-[#1e293b] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Download all zoom variation frames as a zip archive"
              />

              <CustomizableButton
                buttonId="zoom_studio_download_gif"
                defaultLabel="Export gif"
                defaultIcon={<Camera className="w-3.5 h-3.5 text-blue-400" />}
                onClick={handleDownloadGif}
                disabled={generatedFrames.length === 0}
                className="px-3 py-1.5 bg-[#020617] hover:bg-slate-800 disabled:opacity-40 text-blue-300 hover:text-blue-200 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Export looping animated gif"
              />

              <CustomizableButton
                buttonId="zoom_studio_copy_frame"
                defaultLabel="Copy frame"
                defaultIcon={<Copy className="w-3.5 h-3.5 text-slate-400" />}
                onClick={handleCopySingleFrame}
                disabled={generatedFrames.length === 0}
                className="px-3 py-1.5 bg-[#020617] hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white border border-[#1e293b] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Copy active frame image to clipboard"
              />

              {onOpenInAniPlayer && (
                <CustomizableButton
                  buttonId="zoom_studio_open_aniplayer"
                  defaultLabel="Open in aniplayer"
                  defaultIcon={<Film className="w-3.5 h-3.5 text-amber-400" />}
                  onClick={handleSendToAniPlayer}
                  disabled={generatedFrames.length === 0}
                  className="px-3 py-1.5 bg-[#020617] hover:bg-slate-800 disabled:opacity-40 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  title="Load generated zoom sequence into aniplayer"
                />
              )}

              {onApplyZoomVariations && (
                <>
                  <CustomizableButton
                    buttonId="zoom_studio_replace_frame"
                    defaultLabel="Replace frame"
                    defaultIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
                    onClick={() => handleSendToStoryboard("replace_frame")}
                    disabled={generatedFrames.length === 0}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    title="Replace active frame in storyboard with generated zoom sequence"
                  />

                  <CustomizableButton
                    buttonId="zoom_studio_send_storyboard"
                    defaultLabel="Send all to storyboard"
                    defaultIcon={<Plus className="w-3.5 h-3.5 text-white" />}
                    onClick={() => handleSendToStoryboard("append_storyboard")}
                    disabled={generatedFrames.length === 0}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    title="Append all generated zoom frames to storyboard"
                  />
                </>
              )}

              <CustomizableButton
                buttonId="zoom_studio_footer_collapse"
                defaultLabel="Hide"
                defaultIcon={<ChevronDown className="w-3.5 h-3.5" />}
                onClick={() => setIsFooterVisible(false)}
                className="px-2.5 py-1.5 bg-[#020617] hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-[#1e293b] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ml-1"
                title="Hide export and action footer panel"
              />
            </div>
          </CustomizableContainer>
        ) : (
          <div className="px-4 py-2 bg-[#0f172a]/95 backdrop-blur border-t border-[#1e293b] flex items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-slate-500 font-medium">
              {uiText(
                "components_zoom_image_studio_modal.span.footer_panel_hidden",
                "Export and action footer is hidden"
              )}
            </span>
            <CustomizableButton
              buttonId="zoom_studio_show_footer_float"
              defaultLabel="Show footer"
              defaultIcon={<Download className="w-3.5 h-3.5 text-blue-400" />}
              onClick={() => setIsFooterVisible(true)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Show export and action footer panel"
            />
          </div>
        )}
      </CustomizableContainer>
    </div>
  );
};
