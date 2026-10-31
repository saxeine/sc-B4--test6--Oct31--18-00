// UTF-8: ✓ SeqCarver Studio - Front Page Advert Panels: Panel 1 Full Screen Control Studio
import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Maximize2,
  Minimize2,
  RotateCw,
  RotateCcw,
  Upload,
  Sparkles,
  Scissors,
  Trash2,
  Link2,
  LayoutGrid,
  Grid3x3,
  ExternalLink,
  Play,
  Pause,
  Check,
  CheckCircle2,
  Sliders,
  Plus,
  RefreshCw,
  MousePointerClick,
  Layers,
  Info,
  Clock,
  Settings,
  ArrowRight,
  ArrowLeftRight,
  Bookmark,
  ShieldCheck,
  PanelRightClose,
  Minus,
  GripVertical,
  Box,
  ArrowDownUp,
  Move,
  EyeOff,
  Zap,
  Star,
  SlidersHorizontal,
  Palette,
  Circle,
  CheckSquare,
  Square,
  Filter,
  Disc,
  Grid,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Scaling,
} from "lucide-react";
import { cn } from "../utils/cn";
import { CustomizableButton } from "./CustomizableButton";
import { CustomizableLabel } from "./CustomizableLabel";
import { useButtonCustomization } from "../context/ButtonCustomizationContext";
import { RadialColorPicker } from "./RadialColorPicker";
import { AdvertPanelPaletteWheel } from "./AdvertPanelPaletteWheel";
import type { TileLinkConfig } from "./TileLinkModal";
import {
  type SortMode,
  type GroupMode,
  type SliceAssetMetadata,
  sortSlicesByMode,
  groupSlicesByMode,
} from "../utils/storyboardAssetSorter";
import { uiText } from "../hooks/useUIConfig";

export type AdvertPanelTab =
  | "spread"
  | "spread_studio"
  | "asset_sorter"
  | "parallax"
  | "media"
  | "rotation"
  | "link"
  | "swap"
  | "actions"
  | "palette"
  | "styles";

export const SPREAD_EFFECTS = [
  { id: "none", label: "Normal", filter: "none", icon: Sparkles },
  { id: "grayscale", label: "B&W", filter: "grayscale(100%)", icon: Circle },
  { id: "sepia", label: "Sepia", filter: "sepia(100%)", icon: Palette },
  { id: "invert", label: "Invert", filter: "invert(100%)", icon: RefreshCw },
  { id: "blur", label: "Blur", filter: "blur(2px)", icon: EyeOff },
  { id: "hue-rotate", label: "Hue", filter: "hue-rotate(90deg)", icon: Sliders },
  { id: "contrast", label: "Contrast", filter: "contrast(200%)", icon: Zap },
  { id: "saturate", label: "Vivid", filter: "saturate(200%)", icon: Star },
];

export const SPREAD_PRESETS = [
  { label: "16 Panels (4×4)", count: 16, boxes: Array.from({ length: 16 }, (_, i) => i + 1) },
  { label: "9 Panels (3×3)", count: 9, boxes: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { label: "8 Panels", count: 8, boxes: [1, 2, 3, 4, 5, 6, 7, 8] },
  { label: "7 Panels", count: 7, boxes: [1, 2, 3, 4, 5, 6, 7] },
  { label: "6 Panels", count: 6, boxes: [1, 2, 3, 4, 5, 6] },
  { label: "5 Panels", count: 5, boxes: [1, 2, 3, 4, 5] },
  { label: "4 Panels", count: 4, boxes: [1, 2, 4, 5] },
];

export interface AdvertPanelFullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Box 1 (or active panel) data
  targetBoxId?: number;
  boxImages: Record<number, string>;
  setBoxImages: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  boxRotationSeries: Record<number, string[]>;
  setBoxRotationSeries: React.Dispatch<React.SetStateAction<Record<number, string[]>>>;
  boxRotationIntervals: Record<number, number>;
  setBoxRotationIntervals: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  boxRotationActive: Record<number, boolean>;
  setBoxRotationActive: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  boxLinkConfigs: Record<number, TileLinkConfig>;
  setBoxLinkConfigs: React.Dispatch<React.SetStateAction<Record<number, TileLinkConfig>>>;
  disableBoxActions: boolean;
  setDisableBoxActions: React.Dispatch<React.SetStateAction<boolean>>;
  defaultBoxImages: Record<number, string>;

  // Slices from storyboard
  storyboardSlices: Array<{ name: string; url: string; [key: string]: any }>;

  // Handlers from App.tsx
  handleSplitImageToNBoxes: (imageUrl: string, numBoxes?: number) => void;
  handleSplitImageTo9Boxes: (imageUrl: string) => void;
  handleSetNBoxDefault: (imageUrl: string, numBoxes?: number) => void;
  handleReset9BoxDefault: () => void;
  handleSendBoxImageToCarver: (imageUrl: string) => void;
  handleBoxImageUpload: (boxId: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  setCustomSpreadImageUrl: (url: string) => void;
  setCustomSpreadModalOpen: (open: boolean) => void;
  originalSpreadImage?: string;
  setOriginalSpreadImage?: (url: string) => void;
  handleSwapBoxPanels?: (sourceId: number, targetId: number) => void;

  // Dedicated Spread Studio handler
  onApplySpread?: (selectedBoxes: number[], imageUrl: string, filter?: string, stretchX?: number, stretchY?: number) => void;

  // Dedicated Asset Sorter Handlers & State
  activeSortMode?: SortMode;
  onSelectSortMode?: (mode: SortMode) => void;
  activeGroupMode?: GroupMode;
  onSelectGroupMode?: (mode: GroupMode) => void;
  selectedGroupFilter?: string | null;
  onSelectGroupFilter?: (groupId: string | null) => void;
  autoSortOnImport?: boolean;
  onToggleAutoSortOnImport?: (enabled: boolean) => void;
  onApplySortedOrderToPool?: () => void;
  onResetSortedOrder?: () => void;
  availableGroups?: Array<{ id: string; title: string; count: number; badge?: string; colorSwatch?: string }>;
  isAnalyzingSlices?: boolean;
  onOpenFourByFour?: () => void;
  gridMode?: "3x3" | "4x4";
  onToggleGridMode?: (mode: "3x3" | "4x4") => void;
}

export const AdvertPanelFullScreenModal: React.FC<AdvertPanelFullScreenModalProps> = ({
  isOpen,
  onClose,
  targetBoxId = 1,
  boxImages,
  setBoxImages,
  boxRotationSeries,
  setBoxRotationSeries,
  boxRotationIntervals,
  setBoxRotationIntervals,
  boxRotationActive,
  setBoxRotationActive,
  boxLinkConfigs,
  setBoxLinkConfigs,
  disableBoxActions,
  setDisableBoxActions,
  defaultBoxImages,
  storyboardSlices,
  handleSplitImageToNBoxes,
  handleSplitImageTo9Boxes,
  handleSetNBoxDefault,
  handleReset9BoxDefault,
  handleSendBoxImageToCarver,
  handleBoxImageUpload,
  setCustomSpreadImageUrl,
  setCustomSpreadModalOpen,
  originalSpreadImage,
  setOriginalSpreadImage,
  handleSwapBoxPanels,
  onApplySpread,
  activeSortMode,
  onSelectSortMode,
  activeGroupMode,
  onSelectGroupMode,
  selectedGroupFilter,
  onSelectGroupFilter,
  autoSortOnImport,
  onToggleAutoSortOnImport,
  onApplySortedOrderToPool,
  onResetSortedOrder,
  availableGroups,
  isAnalyzingSlices,
  onOpenFourByFour,
  gridMode = "3x3",
  onToggleGridMode,
}) => {
  // Grid Mode (3x3 vs 4x4)
  const [internalGridMode, setInternalGridMode] = useState<"3x3" | "4x4">(gridMode || "3x3");

  useEffect(() => {
    if (gridMode) setInternalGridMode(gridMode);
  }, [gridMode]);

  const is4x4 = internalGridMode === "4x4";
  const boxCount = is4x4 ? 16 : 9;
  const panelIds = useMemo(
    () => Array.from({ length: boxCount }, (_, i) => i + 1),
    [boxCount]
  );

  const handleToggleMode = () => {
    const nextMode = internalGridMode === "3x3" ? "4x4" : "3x3";
    setInternalGridMode(nextMode);
    if (onToggleGridMode) {
      onToggleGridMode(nextMode);
    }
    showToast(`✓ Switched to ${nextMode} grid layout (${nextMode === "4x4" ? 16 : 9} panels)`);
  };

  const [selectedBoxId, setSelectedBoxId] = useState<number>(targetBoxId);
  const [activeTab, setActiveTab] = useState<AdvertPanelTab>("spread");
  const [isTestHoverActive, setIsTestHoverActive] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [draggedBoxId, setDraggedBoxId] = useState<number | null>(null);
  const [dragOverBoxId, setDragOverBoxId] = useState<number | null>(null);

  // Auto-clamp selectedBoxId if grid shrinks
  useEffect(() => {
    if (selectedBoxId > boxCount) {
      setSelectedBoxId(1);
    }
  }, [boxCount, selectedBoxId]);

  // Zoom and Canvas View Controls matching FullScreenCropControlPanel
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Spread Studio Tab State
  const [spreadStudioSelectedBoxes, setSpreadStudioSelectedBoxes] = useState<number[]>(() =>
    Array.from({ length: 9 }, (_, i) => i + 1)
  );

  useEffect(() => {
    setSpreadStudioSelectedBoxes(panelIds);
  }, [panelIds]);
  const [spreadStudioEffect, setSpreadStudioEffect] = useState<string>("none");
  const [spreadStudioStretchX, setSpreadStudioStretchX] = useState<number>(1.0);
  const [spreadStudioStretchY, setSpreadStudioStretchY] = useState<number>(1.0);
  const [spreadStudioLockAspect, setSpreadStudioLockAspect] = useState<boolean>(true);
  const [spreadStudioImage, setSpreadStudioImage] = useState<string>("");
  const spreadStudioFileInputRef = useRef<HTMLInputElement>(null);

  // Asset Sorter Fallback State
  const [localSortMode, setLocalSortMode] = useState<SortMode>(activeSortMode || "none");
  const [localGroupMode, setLocalGroupMode] = useState<GroupMode>(activeGroupMode || "none");
  const [localGroupFilter, setLocalGroupFilter] = useState<string | null>(selectedGroupFilter || null);
  const [localAutoSort, setLocalAutoSort] = useState<boolean>(autoSortOnImport || false);

  useEffect(() => {
    if (activeSortMode !== undefined) setLocalSortMode(activeSortMode);
  }, [activeSortMode]);
  useEffect(() => {
    if (activeGroupMode !== undefined) setLocalGroupMode(activeGroupMode);
  }, [activeGroupMode]);
  useEffect(() => {
    if (selectedGroupFilter !== undefined) setLocalGroupFilter(selectedGroupFilter);
  }, [selectedGroupFilter]);
  useEffect(() => {
    if (autoSortOnImport !== undefined) setLocalAutoSort(autoSortOnImport);
  }, [autoSortOnImport]);

  // 2.5D Depth & Parallax Tab State
  const [parallaxTiltX, setParallaxTiltX] = useState<number>(0);
  const [parallaxTiltY, setParallaxTiltY] = useState<number>(0);
  const [parallaxDepthAmount, setParallaxDepthAmount] = useState<number>(25);
  const [isParallaxAutoOrbit, setIsParallaxAutoOrbit] = useState<boolean>(true);
  const [parallaxOrbitSpeed, setParallaxOrbitSpeed] = useState<number>(1);
  const [parallaxForegroundScale, setParallaxForegroundScale] = useState<number>(1.08);
  const [parallaxMidgroundScale, setParallaxMidgroundScale] = useState<number>(1.04);
  const [parallaxShowWireframe, setParallaxShowWireframe] = useState<boolean>(false);

  // Auto-Orbit Parallax Loop
  useEffect(() => {
    if (!isOpen || activeTab !== "parallax" || !isParallaxAutoOrbit) return;

    let angle = 0;
    let animId: number | null = null;
    const animate = () => {
      angle += 0.03 * parallaxOrbitSpeed;
      setParallaxTiltX(Math.sin(angle) * parallaxDepthAmount);
      setParallaxTiltY(Math.cos(angle * 0.7) * (parallaxDepthAmount * 0.8));
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isOpen, activeTab, isParallaxAutoOrbit, parallaxOrbitSpeed, parallaxDepthAmount]);

  const handleParallaxMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isParallaxAutoOrbit) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setParallaxTiltX(x * parallaxDepthAmount * 2);
    setParallaxTiltY(y * parallaxDepthAmount * 2);
  };

  // Optional discrete side-dock mode
  const [isDiscreteMode, setIsDiscreteMode] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Live View Aspect Ratio State
  const [liveImgDimensions, setLiveImgDimensions] = useState<{ width: number; height: number } | null>(null);
  const [liveAspectMode, setLiveAspectMode] = useState<"auto" | "1:1" | "16:9" | "4:3">("auto");

  // File input refs
  const targetSpreadFileInputRef = useRef<HTMLInputElement>(null);
  const uploadSpreadFileInputRef = useRef<HTMLInputElement>(null);
  const rotationFrameFileInputRef = useRef<HTMLInputElement>(null);
  const hoverImageFileInputRef = useRef<HTMLInputElement>(null);
  const activePanelFileInputRef = useRef<HTMLInputElement>(null);

  // Advert Panel Style & Color Dial state
  const [panelStyles, setPanelStyles] = useState<
    Record<
      number,
      {
        borderColor?: string;
        backgroundColor?: string;
        accentColor?: string;
        textColor?: string;
      }
    >
  >({
    1: { borderColor: "#10b981", backgroundColor: "transparent", accentColor: "#10b981", textColor: "#38bdf8" },
  });

  const handleUpdatePanelStyle = (
    boxId: number,
    updates: { borderColor?: string; backgroundColor?: string; accentColor?: string; textColor?: string }
  ) => {
    setPanelStyles((prev) => ({
      ...prev,
      [boxId]: {
        ...(prev[boxId] || {}),
        ...updates,
      },
    }));
  };

  const handleApplyStyleToAllPanels = (
    updates: { borderColor?: string; backgroundColor?: string; accentColor?: string; textColor?: string }
  ) => {
    setPanelStyles((prev) => {
      const next: Record<number, any> = { ...prev };
      for (let i = 1; i <= boxCount; i++) {
        next[i] = { ...(next[i] || {}), ...updates };
      }
      return next;
    });
    showToast(`✓ Applied palette updates to all ${boxCount} panels!`);
  };

  const { saveCurrentAsDefault } = useButtonCustomization();

  // Sync target box when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedBoxId(targetBoxId);
    }
  }, [targetBoxId, isOpen]);

  // Keyboard Escape listener
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const currentImage = boxImages[selectedBoxId] || "";
  const panel1Image = boxImages[1] || "";
  const targetMasterImage = originalSpreadImage || panel1Image || currentImage;
  const currentRotationSeries = boxRotationSeries[selectedBoxId] || [];
  const currentInterval = boxRotationIntervals[selectedBoxId] || 3;
  const isRotating = boxRotationActive[selectedBoxId] && currentRotationSeries.length > 0;
  const currentLink = boxLinkConfigs[selectedBoxId] || {
    url: "",
    target: "_blank",
    hoverEffect: "none",
  };

  // Rotation frame preview index in studio
  const [previewFrameIdx, setPreviewFrameIdx] = useState<number>(0);
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isRotating || currentRotationSeries.length === 0) {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
      return;
    }
    rotationTimerRef.current = setInterval(() => {
      setPreviewFrameIdx((prev) => (prev + 1) % currentRotationSeries.length);
    }, currentInterval * 1000);

    return () => {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
    };
  }, [isRotating, currentRotationSeries, currentInterval]);

  const displayImage = isRotating && currentRotationSeries[previewFrameIdx]
    ? currentRotationSeries[previewFrameIdx]
    : currentImage;

  // Auto detect image dimensions for aspect ratio preservation
  useEffect(() => {
    if (!displayImage) {
      setLiveImgDimensions(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setLiveImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.src = displayImage;
  }, [displayImage]);

  const computedLiveAspect = useMemo(() => {
    if (liveAspectMode === "1:1") return 1;
    if (liveAspectMode === "16:9") return 16 / 9;
    if (liveAspectMode === "4:3") return 4 / 3;
    if (liveImgDimensions && liveImgDimensions.height > 0) {
      return liveImgDimensions.width / liveImgDimensions.height;
    }
    return 1;
  }, [liveAspectMode, liveImgDimensions]);

  const aspectLabel = useMemo(() => {
    if (liveAspectMode !== "auto") return liveAspectMode;
    if (!liveImgDimensions) return "1:1";
    const { width: w, height: h } = liveImgDimensions;
    const r = w / h;
    if (Math.abs(r - 1) < 0.04) return "1:1";
    if (Math.abs(r - 16 / 9) < 0.05) return "16:9";
    if (Math.abs(r - 9 / 16) < 0.05) return "9:16";
    if (Math.abs(r - 4 / 3) < 0.05) return "4:3";
    if (Math.abs(r - 3 / 2) < 0.05) return "3:2";
    if (Math.abs(r - 21 / 9) < 0.08) return "21:9";
    return `${w}×${h}`;
  }, [liveAspectMode, liveImgDimensions]);

  // Link update helpers
  const handleUpdateLink = (field: keyof TileLinkConfig, value: any) => {
    setBoxLinkConfigs((prev) => ({
      ...prev,
      [selectedBoxId]: {
        ...(prev[selectedBoxId] || {
          url: "",
          target: "_blank",
          hoverEffect: "none",
        }),
        [field]: value,
      },
    }));
  };

  // Add image to rotation series
  const handleAddImageToRotationSeries = (imgUrl: string) => {
    if (!imgUrl) return;
    const updated = [...currentRotationSeries, imgUrl];
    setBoxRotationSeries((prev) => ({ ...prev, [selectedBoxId]: updated }));
    showToast(`✓ Added frame to Panel ${selectedBoxId} rotation series!`);
  };

  const handleRemoveRotationFrame = (idx: number) => {
    const updated = currentRotationSeries.filter((_, i) => i !== idx);
    setBoxRotationSeries((prev) => ({ ...prev, [selectedBoxId]: updated }));
    if (previewFrameIdx >= updated.length) {
      setPreviewFrameIdx(Math.max(0, updated.length - 1));
    }
  };

  // Swap panels logic (supports all slots in 3x3 or 4x4)
  const handleSwapPanels = (sourceId: number, targetId: number) => {
    if (sourceId === targetId || sourceId < 1 || sourceId > boxCount || targetId < 1 || targetId > boxCount) return;
    if (handleSwapBoxPanels) {
      handleSwapBoxPanels(sourceId, targetId);
    } else {
      setBoxImages((prev) => ({
        ...prev,
        [sourceId]: prev[targetId] || "",
        [targetId]: prev[sourceId] || "",
      }));
      setBoxRotationSeries((prev) => ({
        ...prev,
        [sourceId]: prev[targetId] || [],
        [targetId]: prev[sourceId] || [],
      }));
      setBoxRotationIntervals((prev) => ({
        ...prev,
        [sourceId]: prev[targetId] ?? 3,
        [targetId]: prev[sourceId] ?? 3,
      }));
      setBoxRotationActive((prev) => ({
        ...prev,
        [sourceId]: !!prev[targetId],
        [targetId]: !!prev[sourceId],
      }));
      setBoxLinkConfigs((prev) => ({
        ...prev,
        [sourceId]: prev[targetId] ? { ...prev[targetId] } : { url: "", target: "_blank", hoverEffect: "none" },
        [targetId]: prev[sourceId] ? { ...prev[sourceId] } : { url: "", target: "_blank", hoverEffect: "none" },
      }));
    }
    showToast(`✓ Swapped Panel ${sourceId} and Panel ${targetId}!`);
  };

  if (!isOpen) return null;

  // Minimized State: Tiny floating pill docked to screen edge
  if (isMinimized) {
    return (
      <div className="fixed top-14 right-3 z-50 pointer-events-auto select-none animate-in fade-in duration-150">
        <CustomizableButton
          buttonId="ad_panel_btn_minimized_pill"
          defaultLabel={`Panel ${selectedBoxId} Inspector`}
          defaultIcon={<Grid3x3 className="w-3.5 h-3.5 text-emerald-400" />}
          onClick={() => setIsMinimized(false)}
          className="px-3 py-1.5 rounded-xl bg-[#090f1d]/95 hover:bg-[#0f172a] border border-emerald-500/50 text-emerald-300 font-bold text-xs shadow-2xl backdrop-blur-md flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          title="Restore Advert Panel Inspector"
        />
      </div>
    );
  }

  // Active Panel Mini Card (top of inspector)
  const renderActivePanelCard = () => (
    <div className="p-3 bg-[#070c17] border-b border-slate-800/80 flex items-center gap-3 shrink-0">
      <div className="w-12 h-12 rounded-xl border border-emerald-500/40 bg-black/60 overflow-hidden relative shrink-0 shadow-inner group/preview flex items-center justify-center">
        {displayImage ? (
          <img
            src={displayImage}
            alt={`Panel ${selectedBoxId}`}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              isTestHoverActive && currentLink.hoverEffect === "spin" && "[transform:rotateY(180deg)]",
              isTestHoverActive && currentLink.hoverEffect === "change-image" && currentLink.hoverImage && "opacity-0"
            )}
          />
        ) : (
          <Grid3x3 className="w-5 h-5 text-slate-600" />
        )}
        {isTestHoverActive && currentLink.hoverEffect === "change-image" && currentLink.hoverImage && (
          <img src={currentLink.hoverImage} alt={uiText("components_advert_panel_full_screen_modal.img.hover_preview.alt", "Hover preview")} className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <CustomizableLabel
            labelId="ad_panel_label_active_panel"
            defaultLabel={`Panel ${selectedBoxId} Inspector`}
            className="text-xs font-bold text-slate-100 uppercase tracking-wide"
          />
          <CustomizableLabel
            labelId="ad_panel_label_panel_badge"
            defaultLabel={selectedBoxId === 1 ? "Hero Screen" : `Tile ${selectedBoxId}`}
            className={cn(
              "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border",
              selectedBoxId === 1 ? "bg-emerald-950 text-emerald-300 border-emerald-500/40" : "bg-cyan-950 text-cyan-300 border-cyan-500/40"
            )}
          />
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            {is4x4 ? "4×4 (16 slots)" : "3×3 (9 slots)"}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 truncate mt-0.5">
          {displayImage ? (liveImgDimensions ? `${liveImgDimensions.width}×${liveImgDimensions.height}px • ${aspectLabel}` : "Artwork Loaded") : "Slot Empty • Add artwork or spread"}
        </p>

        {/* Quick action buttons on active panel */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <CustomizableButton
            buttonId="ad_panel_btn_upload_active_panel"
            defaultLabel="Upload"
            defaultIcon={<Upload className="w-3 h-3" />}
            onClick={() => activePanelFileInputRef.current?.click()}
            className="px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            title="Upload image to panel"
          />
          <input
            ref={activePanelFileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleBoxImageUpload(selectedBoxId, e)}
            className="hidden"
          />
          {currentImage && (
            <CustomizableButton
              buttonId="ad_panel_btn_send_to_carver"
              defaultLabel="To Carver"
              defaultIcon={<Scissors className="w-3 h-3" />}
              onClick={() => {
                handleSendBoxImageToCarver(currentImage);
                showToast(`✓ Sent Panel ${selectedBoxId} to Carver!`);
                onClose();
              }}
              className="px-2 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              title="Send to Carver Canvas"
            />
          )}
          {currentImage && (
            <CustomizableButton
              buttonId="ad_panel_btn_clear_image"
              defaultLabel="Clear"
              defaultIcon={<Trash2 className="w-3 h-3" />}
              onClick={() => {
                setBoxImages((prev) => ({ ...prev, [selectedBoxId]: "" }));
                showToast(`✓ Cleared Panel ${selectedBoxId} image`);
              }}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-rose-950/80 hover:text-rose-300 border border-slate-700 text-slate-400 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Clear Image"
            />
          )}
        </div>
      </div>
    </div>
  );

  // Render controls deck content
  const renderControlsDeck = () => (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Deck Tab Navigation with visible icons and text labels matching FullScreenCropControlPanel */}
      <div className="flex items-center px-2 py-2 bg-[#040814] border-b border-slate-800 gap-1.5 text-xs font-bold shrink-0 overflow-x-auto scrollbar-none">
        {[
          { id: "spread", buttonId: "ad_panel_tab_spread", icon: <LayoutGrid className="w-3.5 h-3.5" />, label: "Spread" },
          { id: "spread_studio", buttonId: "ad_panel_tab_spread_studio", icon: <Grid3x3 className="w-3.5 h-3.5 text-cyan-400" />, label: "Spread Studio" },
          { id: "asset_sorter", buttonId: "ad_panel_tab_asset_sorter", icon: <ArrowDownUp className="w-3.5 h-3.5 text-amber-400" />, label: "Asset Sorter" },
          { id: "parallax", buttonId: "ad_panel_tab_parallax", icon: <Box className="w-3.5 h-3.5 text-purple-400" />, label: "2.5D Parallax" },
          { id: "media", buttonId: "ad_panel_tab_media", icon: <Sparkles className="w-3.5 h-3.5" />, label: "Media" },
          { id: "rotation", buttonId: "ad_panel_tab_rotation", icon: <RotateCw className="w-3.5 h-3.5" />, label: "Rotate" },
          { id: "link", buttonId: "ad_panel_tab_link", icon: <Link2 className="w-3.5 h-3.5" />, label: "Links" },
          { id: "swap", buttonId: "ad_panel_tab_swap", icon: <ArrowLeftRight className="w-3.5 h-3.5" />, label: "Swap" },
          { id: "actions", buttonId: "ad_panel_tab_actions", icon: <Scissors className="w-3.5 h-3.5" />, label: "Actions" },
          { id: "palette", buttonId: "ad_panel_tab_palette", icon: <Palette className="w-3.5 h-3.5 text-cyan-400" />, label: "Palette" },
        ].map((tab) => {
          const isActive =
            activeTab === tab.id ||
            (tab.id === "palette" && (activeTab as string) === "styles");
          return (
            <CustomizableButton
              key={`tab-btn-${tab.id}`}
              buttonId={tab.buttonId}
              defaultLabel={tab.label}
              forceZeroText={false}
              defaultIcon={tab.icon}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "py-1.5 px-3 rounded-xl text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 text-xs",
                isActive
                  ? "bg-[#00c988] text-slate-950 font-black shadow-md ring-1 ring-emerald-400/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/60"
              )}
              title={tab.label}
            />
          );
        })}
      </div>

      {/* Deck Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ============================================== */}
        {/* TAB 1: MULTI-SPREAD ENGINE                     */}
        {/* ============================================== */}
        {activeTab === "spread" && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            {/* Master Spread Target Card */}
            <div className="bg-[#030d1a] p-3.5 rounded-2xl border border-emerald-500/35 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-1.5 border-b border-emerald-500/20">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <LayoutGrid className="w-4 h-4 text-emerald-400" />
                  {uiText("components_advert_panel_full_screen_modal.span.master_spread_target", "Master Spread Target")}
                </span>
                <CustomizableLabel
                  labelId="ad_panel_label_master_badge"
                  defaultLabel="Master Source"
                  className="text-[9px] font-mono text-emerald-400 font-bold bg-[#042922] border border-emerald-500/30 px-2 py-0.5 rounded"
                />
              </div>

              {/* Target Master Image Thumbnail Card */}
              <div className="flex items-center gap-3 p-2.5 bg-[#020713] rounded-xl border border-emerald-500/25">
                <div className="w-11 h-11 rounded-lg border border-emerald-500/40 overflow-hidden shrink-0 bg-slate-900 flex items-center justify-center">
                  {targetMasterImage ? (
                    <img src={targetMasterImage} alt={uiText("components_advert_panel_full_screen_modal.img.master_target.alt", "Master Target")} className="w-full h-full object-cover" />
                  ) : (
                    <Grid3x3 className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <CustomizableLabel
                    labelId="ad_panel_label_target_spread_image"
                    defaultLabel="Target Spread Image"
                    className="text-xs font-bold text-emerald-400 block truncate leading-tight"
                  />
                  <CustomizableLabel
                    labelId="ad_panel_label_target_spread_desc"
                    defaultLabel="Un-sliced spread source"
                    className="text-[10px] text-slate-400 leading-tight truncate mt-0.5 block"
                  />
                </div>
                <CustomizableButton
                  buttonId="ad_panel_btn_change_target_image"
                  defaultLabel="Change"
                  defaultIcon={<Upload className="w-3 h-3 text-emerald-400" />}
                  onClick={() => targetSpreadFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-[#062c28] hover:bg-[#0a3f3a] text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1"
                  title="Change Target Spread Image"
                />
                <input
                  ref={targetSpreadFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        const url = reader.result?.toString() || "";
                        if (url) {
                          setOriginalSpreadImage?.(url);
                          showToast("✓ New target image set as spread source!");
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                    e.target.value = "";
                  }}
                  className="hidden"
                />
              </div>

              {/* Primary Action: Spread Target Image */}
              <CustomizableButton
                buttonId="ad_panel_btn_spread_target_9"
                defaultLabel={is4x4 ? "Spread Target Image (4×4 Grid)" : "Spread Target Image (3×3 Grid)"}
                defaultIcon={<LayoutGrid className="w-4 h-4 text-slate-950" />}
                onClick={() => {
                  if (targetMasterImage) {
                    if (is4x4) {
                      handleSplitImageToNBoxes(targetMasterImage, 16);
                      showToast("✓ Parsed target image across 4×4 (All 16 panels)!");
                    } else {
                      handleSplitImageTo9Boxes(targetMasterImage);
                      showToast("✓ Parsed target image across 3×3 (All 9 panels)!");
                    }
                  }
                }}
                className="w-full py-2.5 px-4 bg-[#00c988] hover:bg-[#00b077] text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                title="Spread Target Image across grid"
              />

              {/* Secondary Action: Upload New Image & Spread */}
              <CustomizableButton
                buttonId="ad_panel_btn_upload_spread_9"
                defaultLabel="Upload New Image & Spread"
                defaultIcon={<Upload className="w-4 h-4 text-[#2dd4bf]" />}
                onClick={() => uploadSpreadFileInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-[#072d2e] hover:bg-[#0b3c3d] text-[#2dd4bf] border border-teal-500/40 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                title="Upload New Image & Spread"
              />
              <input
                ref={uploadSpreadFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const url = reader.result?.toString() || "";
                      if (url) {
                        setOriginalSpreadImage?.(url);
                        if (is4x4) {
                          handleSplitImageToNBoxes(url, 16);
                        } else {
                          handleSplitImageTo9Boxes(url);
                        }
                        showToast(`✓ Uploaded target and spread across ${boxCount} panels!`);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                  e.target.value = "";
                }}
                className="hidden"
              />
            </div>

            {/* Quick Spread N-Box Selector */}
            <div className="bg-[#030d1a] p-3.5 rounded-2xl border border-slate-800/90 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between pb-0.5">
                <CustomizableLabel
                  labelId="ad_panel_label_quick_spread_nbox"
                  defaultLabel="QUICK SPREAD N-BOX"
                  className="text-xs font-bold text-slate-100 uppercase tracking-wider block font-sans"
                />
                <span className="text-[10px] font-mono text-slate-500 font-semibold">{uiText("components_advert_panel_full_screen_modal.span.slice_and_distribute", "Slice & Distribute")}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 16, id: "ad_panel_btn_n_spread_16", label: "16 Panels (4×4)" },
                  { count: 9, id: "ad_panel_btn_n_spread_9", label: "9 Panels (3×3)" },
                  { count: 8, id: "ad_panel_btn_n_spread_8", label: "8 Panels" },
                  { count: 7, id: "ad_panel_btn_n_spread_7", label: "7 Panels" },
                  { count: 6, id: "ad_panel_btn_n_spread_6", label: "6 Panels" },
                  { count: 4, id: "ad_panel_btn_n_spread_4", label: "4 Panels" },
                ].map((item) => (
                  <CustomizableButton
                    key={`n-spread-${item.count}`}
                    buttonId={item.id}
                    defaultLabel={item.label}
                    onClick={() => {
                      if (targetMasterImage) {
                        handleSplitImageToNBoxes(targetMasterImage, item.count);
                        showToast(`✓ Shared target image across ${item.count} panels!`);
                      }
                    }}
                    className="py-2.5 px-2 rounded-xl border border-slate-700/80 bg-[#0c1524] hover:bg-emerald-950/60 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 font-bold text-xs transition-all cursor-pointer text-center"
                    title={`Split and spread target across ${item.count} panels`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* TAB 2: SPREAD STUDIO                           */}
        {/* ============================================== */}
        {activeTab === "spread_studio" && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <div className="bg-[#030d1a] p-3.5 rounded-2xl border border-cyan-500/35 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <Grid3x3 className="w-4 h-4 text-cyan-400" />
                  <CustomizableLabel
                    labelId="ad_panel_label_spread_studio_title"
                    defaultLabel="Spread Studio"
                    className="text-xs font-bold text-cyan-300 uppercase tracking-wider"
                  />
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded">
                  {spreadStudioSelectedBoxes.length}{uiText("components_advert_panel_full_screen_modal.span.panels_selected", " Panels Selected")}
                </span>
              </div>

              {/* Source Image Selector */}
              <div className="flex items-center gap-3 p-2 bg-[#020713] rounded-xl border border-cyan-500/25">
                <div className="w-11 h-11 rounded-lg border border-cyan-500/40 overflow-hidden shrink-0 bg-slate-900 flex items-center justify-center">
                  {(spreadStudioImage || targetMasterImage || currentImage || panel1Image) ? (
                    <img
                      src={spreadStudioImage || targetMasterImage || currentImage || panel1Image}
                      alt={uiText("components_advert_panel_full_screen_modal.img.spread_source.alt", "Spread Source")}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Grid3x3 className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-cyan-400 block truncate">{uiText("components_advert_panel_full_screen_modal.span.spread_source_image", "Spread Source Image")}</span>
                  <span className="text-[10px] text-slate-400 block truncate">{uiText("components_advert_panel_full_screen_modal.span.target_image_to_carve_and_distribute", "Target image to carve & distribute")}</span>
                </div>
                <CustomizableButton
                  buttonId="spread_studio_change_img_btn"
                  defaultLabel="Change"
                  defaultIcon={<Upload className="w-3 h-3 text-cyan-400" />}
                  onClick={() => spreadStudioFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                />
                <input
                  ref={spreadStudioFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        const url = reader.result?.toString() || "";
                        if (url) {
                          setSpreadStudioImage(url);
                          setCustomSpreadImageUrl(url);
                          showToast("✓ Custom Spread image loaded!");
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                    e.target.value = "";
                  }}
                  className="hidden"
                />
              </div>

              {/* Panel Presets */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">{uiText("components_advert_panel_full_screen_modal.span.spread_presets", "Spread Presets:")}</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {SPREAD_PRESETS.map((p) => (
                    <CustomizableButton
                      buttonId="advert_panel_full_screen_modal_btn_21"
                      key={p.label}
type="button"
onClick={() => setSpreadStudioSelectedBoxes(p.boxes)}
className={cn(
                        "py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center",
                        spreadStudioSelectedBoxes.length === p.count && spreadStudioSelectedBoxes.every((b) => p.boxes.includes(b))
                          ? "bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-sm"
                          : "bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/60"
                      )}
                    >
                        {() => (
                            <>
                              {p.label}
                            </>
                          )}
                    </CustomizableButton>
                  ))}
                </div>
              </div>

              {/* Interactive Target Panels Selector */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    {uiText("components_advert_panel_full_screen_modal.span.target_panels_1", "Target Panels (1–")}{boxCount}):
                  </span>
                  <div className="flex gap-2 text-xs">
                    <CustomizableButton
                      buttonId="advert_panel_full_screen_modal_btn_20"
                      type="button"
onClick={() => setSpreadStudioSelectedBoxes(panelIds)}
className="text-cyan-400 hover:underline cursor-pointer"
                    >
                        {() => (
                            <>
                              {uiText("components_advert_panel_full_screen_modal.button.all", "All")}
                            </>
                          )}
                    </CustomizableButton>
                    <span className="text-slate-600">|</span>
                    <CustomizableButton
                      buttonId="advert_panel_full_screen_modal_btn_19"
                      type="button"
onClick={() => setSpreadStudioSelectedBoxes([])}
className="text-slate-400 hover:underline cursor-pointer"
                    >
                        {() => (
                            <>
                              {uiText("components_advert_panel_full_screen_modal.button.clear", "Clear")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                </div>
                <div className={cn(
                  "grid gap-1.5 p-2 bg-[#020617] rounded-xl border border-slate-800",
                  is4x4 ? "grid-cols-8" : "grid-cols-9"
                )}>
                  {panelIds.map((bId) => {
                    const isSelected = spreadStudioSelectedBoxes.includes(bId);
                    return (
                      <CustomizableButton
                        buttonId="advert_panel_full_screen_modal_btn_18"
                        key={`spread-box-pick-${bId}`}
type="button"
onClick={() => {
                          setSpreadStudioSelectedBoxes((prev) =>
                            prev.includes(bId) ? prev.filter((id) => id !== bId) : [...prev, bId]
                          );
                        }}
className={cn(
                          "h-8 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center",
                          isSelected
                            ? "bg-cyan-500 text-slate-950 shadow-sm font-black scale-105"
                            : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                        )}
                      >
                          {() => (
                              <>
                                {bId}
                              </>
                            )}
                      </CustomizableButton>
                    );
                  })}
                </div>
              </div>

              {/* Visual Filter Effects */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">{uiText("components_advert_panel_full_screen_modal.span.visual_fx_filter", "Visual FX Filter:")}</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {SPREAD_EFFECTS.map((fx) => (
                    <CustomizableButton
                      buttonId="advert_panel_full_screen_modal_btn_17"
                      key={fx.id}
type="button"
onClick={() => setSpreadStudioEffect(fx.id)}
className={cn(
                        "py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1",
                        spreadStudioEffect === fx.id
                          ? "bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-sm"
                          : "bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/60"
                      )}
                    >
                        {() => (
                            <>
                              <span>{fx.label}</span>
                            </>
                          )}
                    </CustomizableButton>
                  ))}
                </div>
              </div>

              {/* Stretch & Transform Controls */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{uiText("components_advert_panel_full_screen_modal.span.stretch_aspect_scale", "Stretch / Aspect Scale:")}</span>
                  <CustomizableButton
                    buttonId="advert_panel_full_screen_modal_btn_16"
                    type="button"
onClick={() => setSpreadStudioLockAspect((prev) => !prev)}
className={cn(
                      "text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer",
                      spreadStudioLockAspect ? "bg-cyan-950 text-cyan-300 border-cyan-500/40" : "bg-slate-900 text-slate-400 border-slate-800"
                    )}
                  >
                      {() => (
                          <>
                            {spreadStudioLockAspect ? "Aspect Locked" : "Free Transform"}
                          </>
                        )}
                  </CustomizableButton>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>{uiText("components_advert_panel_full_screen_modal.span.width_stretch", "Width Stretch:")}</span>
                      <span className="font-mono text-cyan-400">{spreadStudioStretchX.toFixed(2)}{uiText("components_advert_panel_full_screen_modal.span.x", "x")}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={spreadStudioStretchX}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setSpreadStudioStretchX(val);
                        if (spreadStudioLockAspect) setSpreadStudioStretchY(val);
                      }}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>{uiText("components_advert_panel_full_screen_modal.span.height_stretch", "Height Stretch:")}</span>
                      <span className="font-mono text-cyan-400">{spreadStudioStretchY.toFixed(2)}{uiText("components_advert_panel_full_screen_modal.span.x_2", "x")}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={spreadStudioStretchY}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setSpreadStudioStretchY(val);
                        if (spreadStudioLockAspect) setSpreadStudioStretchX(val);
                      }}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button: Apply Custom Spread */}
              <CustomizableButton
                buttonId="spread_studio_apply_action"
                defaultLabel="Apply Custom Spread to Panels"
                defaultIcon={<Check className="w-4 h-4 text-slate-950" />}
                onClick={() => {
                  const src = spreadStudioImage || targetMasterImage || currentImage || panel1Image;
                  if (!src) {
                    showToast("Please choose or upload a spread source image first!");
                    return;
                  }
                  if (spreadStudioSelectedBoxes.length === 0) {
                    showToast("Please select at least one panel to apply the spread to!");
                    return;
                  }
                  if (onApplySpread) {
                    onApplySpread(spreadStudioSelectedBoxes, src, spreadStudioEffect, spreadStudioStretchX, spreadStudioStretchY);
                  } else {
                    handleSplitImageToNBoxes(src, spreadStudioSelectedBoxes.length);
                  }
                  showToast(`✓ Applied spread across ${spreadStudioSelectedBoxes.length} panels!`);
                }}
                className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                title="Apply Spread to target panels"
              />
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* TAB 3: ASSET SORTER                            */}
        {/* ============================================== */}
        {activeTab === "asset_sorter" && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <div className="bg-[#0e1628] p-3.5 rounded-2xl border border-amber-500/35 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/20">
                <div className="flex items-center gap-2">
                  <ArrowDownUp className="w-4 h-4 text-amber-400" />
                  <CustomizableLabel
                    labelId="ad_panel_label_asset_sorter_title"
                    defaultLabel="Storyboard Asset Sorter"
                    className="text-xs font-bold text-amber-300 uppercase tracking-wider"
                  />
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded">
                  {storyboardSlices.length}{uiText("components_advert_panel_full_screen_modal.span.slices_in_pool", " Slices in Pool")}
                </span>
              </div>

              {/* Sort Modes */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">{uiText("components_advert_panel_full_screen_modal.span.sort_slices_by", "Sort Slices By:")}</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { mode: "name", label: "Alphabetical (A-Z)" },
                    { mode: "brightness", label: "Luminance / Brightness" },
                    { mode: "dominant-color", label: "Color Spectrum" },
                    { mode: "complexity", label: "Visual Complexity" },
                    { mode: "aspect-ratio", label: "Aspect Ratio" },
                    { mode: "aspect-shape", label: "Shape (Wide/Tall)" },
                  ].map((s) => (
                    <CustomizableButton
                      buttonId="advert_panel_full_screen_modal_btn_15"
                      key={s.mode}
type="button"
onClick={() => {
                        setLocalSortMode(s.mode as SortMode);
                        onSelectSortMode?.(s.mode as SortMode);
                        showToast(`✓ Sorted storyboard pool by ${s.label}`);
                      }}
className={cn(
                        "py-2 px-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer flex items-center justify-between",
                        localSortMode === s.mode
                          ? "bg-amber-500/20 text-amber-300 border-amber-400 shadow-sm"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                      )}
                    >
                        {() => (
                            <>
                              <span>{s.label}</span>
                            {localSortMode === s.mode && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            </>
                          )}
                    </CustomizableButton>
                  ))}
                </div>
              </div>

              {/* Apply Sorted Order */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <CustomizableButton
                  buttonId="asset_sorter_apply_to_pool"
                  defaultLabel="Apply Sorted Order to Storyboard Pool"
                  defaultIcon={<Check className="w-4 h-4 text-slate-950" />}
                  onClick={() => {
                    onApplySortedOrderToPool?.();
                    showToast("✓ Sorted order applied to permanent storyboard pool!");
                  }}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* TAB 4: 2.5D PARALLAX & DEPTH                   */}
        {/* ============================================== */}
        {activeTab === "parallax" && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <div className="bg-[#0e1628] p-3.5 rounded-2xl border border-purple-500/35 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/20">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-purple-400" />
                  <CustomizableLabel
                    labelId="ad_panel_label_parallax_title"
                    defaultLabel="2.5D Depth & Parallax"
                    className="text-xs font-bold text-purple-300 uppercase tracking-wider"
                  />
                </div>
                <CustomizableButton
                  buttonId="advert_panel_full_screen_modal_btn_14"
                  type="button"
onClick={() => setIsParallaxAutoOrbit((prev) => !prev)}
className={cn(
                    "text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer",
                    isParallaxAutoOrbit ? "bg-purple-950 text-purple-300 border-purple-500/40" : "bg-slate-900 text-slate-400 border-slate-800"
                  )}
                >
                    {() => (
                        <>
                          {isParallaxAutoOrbit ? "Auto Orbit ON" : "Mouse Tilt Mode"}
                        </>
                      )}
                </CustomizableButton>
              </div>

              {/* Depth Sliders */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>{uiText("components_advert_panel_full_screen_modal.span.parallax_depth_intensity", "Parallax Depth Intensity:")}</span>
                    <span className="font-mono text-purple-400">{parallaxDepthAmount}{uiText("components_advert_panel_full_screen_modal.span.px", "px")}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={parallaxDepthAmount}
                    onChange={(e) => setParallaxDepthAmount(parseInt(e.target.value, 10))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>{uiText("components_advert_panel_full_screen_modal.span.orbit_rotation_speed", "Orbit Rotation Speed:")}</span>
                    <span className="font-mono text-purple-400">{parallaxOrbitSpeed}{uiText("components_advert_panel_full_screen_modal.span.x_3", "x")}</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.1"
                    value={parallaxOrbitSpeed}
                    onChange={(e) => setParallaxOrbitSpeed(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-400 text-xs">{uiText("components_advert_panel_full_screen_modal.span.show_depth_wireframe_guide", "Show Depth Wireframe Guide:")}</span>
                  <input
                    type="checkbox"
                    checked={parallaxShowWireframe}
                    onChange={(e) => setParallaxShowWireframe(e.target.checked)}
                    className="accent-purple-500 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>

              <CustomizableButton
                buttonId="parallax_apply_to_panel"
                defaultLabel={`Set Depth Animation for Panel ${selectedBoxId}`}
                defaultIcon={<Check className="w-4 h-4 text-slate-950" />}
                onClick={() => {
                  showToast(`✓ Applied 2.5D Parallax depth settings to Panel ${selectedBoxId}!`);
                }}
                className="w-full py-2.5 px-4 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              />
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* TAB 5: MEDIA & STORYBOARD SLICES               */}
        {/* ============================================== */}
        {activeTab === "media" && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <div className="bg-[#0e1628] p-3.5 rounded-2xl border border-slate-800 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <CustomizableLabel
                    labelId="ad_panel_label_media_title"
                    defaultLabel={`Panel ${selectedBoxId} Artwork`}
                    className="text-xs font-bold text-cyan-300 uppercase tracking-wider"
                  />
                </div>
              </div>

              {/* Storyboard Slices Picker */}
              <div className="space-y-2">
                <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
                  {uiText("components_advert_panel_full_screen_modal.span.pick_from_storyboard_slices", "Pick from Storyboard Slices (")}{storyboardSlices.length}):
                </span>
                {storyboardSlices.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1 bg-[#020617] rounded-xl border border-slate-800">
                    {storyboardSlices.map((slice, sIdx) => (
                      <CustomizableButton
                        key={`sb-slice-${sIdx}`}
                        buttonId={`ad_panel_sb_slice_${sIdx + 1}`}
                        defaultLabel={`Slice ${sIdx + 1}`}
                        onClick={() => {
                          setBoxImages((prev) => ({ ...prev, [selectedBoxId]: slice.url }));
                          showToast(`✓ Loaded "${slice.name || `Slice ${sIdx + 1}`}" into Panel ${selectedBoxId}!`);
                        }}
                        className="rounded-lg border border-slate-800 hover:border-cyan-400 overflow-hidden aspect-square p-0 relative group/slice cursor-pointer transition-all bg-slate-900"
                        title={`Apply ${slice.name || `Slice ${sIdx + 1}`} to Panel ${selectedBoxId}`}
                      >
                        <img src={slice.url} alt="" className="w-full h-full object-cover group-hover/slice:scale-105 transition-transform" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-mono text-cyan-300 px-1 py-0.5 truncate text-center">
                          #{sIdx + 1}
                        </span>
                      </CustomizableButton>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
                    {uiText("components_advert_panel_full_screen_modal.div.no_slices_in_pool_carve_images_or_add_crops", "No slices in pool. Carve images or add crops to fill this library.")}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* TAB 6: ROTATE & ANIMATION SERIES               */}
        {/* ============================================== */}
        {activeTab === "rotation" && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <div className="bg-[#0e1628] p-3.5 rounded-2xl border border-purple-500/35 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/20">
                <div className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-purple-400" />
                  <CustomizableLabel
                    labelId="ad_panel_label_rotation_title"
                    defaultLabel={`Panel ${selectedBoxId} Rotation Loop`}
                    className="text-xs font-bold text-purple-300 uppercase tracking-wider"
                  />
                </div>
                <CustomizableButton
                  buttonId="ad_panel_btn_rotation_toggle"
                  defaultLabel={isRotating ? "Loop Active" : "Loop Inactive"}
                  defaultIcon={isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setBoxRotationActive((prev) => ({ ...prev, [selectedBoxId]: !prev[selectedBoxId] }));
                    showToast(`✓ Rotation loop ${!isRotating ? "activated" : "paused"} for Panel ${selectedBoxId}`);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1",
                    isRotating ? "bg-purple-600 text-white border-purple-400" : "bg-slate-900 text-slate-400 border-slate-700"
                  )}
                />
              </div>

              {/* Interval Slider */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <CustomizableLabel
                    labelId="ad_panel_label_rotation_interval"
                    defaultLabel="Frame Interval (Seconds)"
                    className="text-xs font-semibold"
                  />
                  <span className="font-mono text-purple-400 font-bold">{currentInterval}{uiText("components_advert_panel_full_screen_modal.span.s", "s")}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={currentInterval}
                  onChange={(e) => {
                    const sec = parseInt(e.target.value, 10);
                    setBoxRotationIntervals((prev) => ({ ...prev, [selectedBoxId]: sec }));
                  }}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Playlist Frame Queue */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <CustomizableLabel
                    labelId="ad_panel_label_rotation_playlist"
                    defaultLabel={`Playlist Frames (${currentRotationSeries.length})`}
                    className="text-xs font-bold text-slate-300 uppercase tracking-wider"
                  />
                  {currentRotationSeries.length > 0 && (
                    <CustomizableButton
                      buttonId="ad_panel_btn_clear_rotation_playlist"
                      defaultLabel="Clear All"
                      onClick={() => setBoxRotationSeries((prev) => ({ ...prev, [selectedBoxId]: [] }))}
                      className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                    />
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1.5 bg-[#020617] rounded-xl border border-slate-800">
                  {currentRotationSeries.map((frameUrl, fIdx) => (
                    <div key={`frame-${fIdx}`} className="relative rounded-lg border border-slate-800 overflow-hidden aspect-square group">
                      <img src={frameUrl} alt="" className="w-full h-full object-cover" />
                      <CustomizableButton
                        buttonId="advert_panel_full_screen_modal_btn_13"
                        defaultIcon={<Trash2 className="w-3 h-3" />}
                        type="button"
onClick={() => handleRemoveRotationFrame(fIdx)}
className="absolute top-1 right-1 p-1 bg-rose-600/90 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      />
                      <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] font-mono text-purple-300 px-1 rounded">
                        #{fIdx + 1}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <CustomizableButton
                    buttonId="ad_panel_btn_add_active_to_rotation"
                    defaultLabel="Add Active Image"
                    defaultIcon={<Plus className="w-3.5 h-3.5 text-purple-400" />}
                    onClick={() => handleAddImageToRotationSeries(currentImage)}
                    className="py-2 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  />
                  <CustomizableButton
                    buttonId="ad_panel_btn_upload_rotation_frame"
                    defaultLabel="Upload Frame"
                    defaultIcon={<Upload className="w-3.5 h-3.5 text-purple-400" />}
                    onClick={() => rotationFrameFileInputRef.current?.click()}
                    className="py-2 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  />
                  <input
                    ref={rotationFrameFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const url = reader.result?.toString() || "";
                          if (url) handleAddImageToRotationSeries(url);
                        };
                        reader.readAsDataURL(file);
                      }
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* TAB 7: LINK & HOVER ANIMATION ENGINE           */}
        {/* ============================================== */}
        {activeTab === "link" && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <div className="bg-[#0e1628] p-3.5 rounded-2xl border border-cyan-500/35 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-cyan-400" />
                  <CustomizableLabel
                    labelId="ad_panel_label_link_title"
                    defaultLabel={`Panel ${selectedBoxId} Link & Hover`}
                    className="text-xs font-bold text-cyan-300 uppercase tracking-wider"
                  />
                </div>
                {currentLink.url && (
                  <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 rounded">
                    {uiText("components_advert_panel_full_screen_modal.span.active_link", "Active Link")}
                  </span>
                )}
              </div>

              {/* Destination URL */}
              <div className="space-y-1.5">
                <CustomizableLabel
                  labelId="ad_panel_label_dest_url"
                  defaultLabel="Destination URL"
                  className="text-xs text-slate-300 font-semibold block"
                />
                <input
                  type="url"
                  value={currentLink.url || ""}
                  onChange={(e) => handleUpdateLink("url", e.target.value)}
                  placeholder="https://example.com/landing"
                  className="w-full bg-[#030712] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Target Window */}
              <div className="space-y-1.5">
                <CustomizableLabel
                  labelId="ad_panel_label_target_window"
                  defaultLabel="Target Window"
                  className="text-xs text-slate-300 font-semibold block"
                />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <CustomizableButton
                    buttonId="ad_panel_btn_link_target_blank"
                    defaultLabel="New Window (_blank)"
                    onClick={() => handleUpdateLink("target", "_blank")}
                    className={cn(
                      "py-2 px-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer text-xs",
                      currentLink.target === "_blank"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    )}
                  />
                  <CustomizableButton
                    buttonId="ad_panel_btn_link_target_self"
                    defaultLabel="Same Tab (_self)"
                    onClick={() => handleUpdateLink("target", "_self")}
                    className={cn(
                      "py-2 px-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer text-xs",
                      currentLink.target === "_self"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    )}
                  />
                </div>
              </div>

              {/* Hover Animation Effect */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <CustomizableLabel
                    labelId="ad_panel_label_hover_fx"
                    defaultLabel="Hover Animation Effect"
                    className="text-xs text-slate-300 font-semibold"
                  />
                  <CustomizableButton
                    buttonId="ad_panel_btn_test_hover"
                    defaultLabel="Simulate Hover"
                    defaultIcon={<MousePointerClick className="w-3.5 h-3.5 text-current" />}
                    onClick={() => setIsTestHoverActive((prev) => !prev)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1",
                      isTestHoverActive ? "bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-sm" : "bg-slate-900 text-slate-400 border-slate-800"
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: "none", label: "None" },
                    { id: "spin", label: "3D Spin" },
                    { id: "change-image", label: "Swap Image" },
                  ].map((effect) => (
                    <CustomizableButton
                      key={`hover-fx-${effect.id}`}
                      buttonId={`ad_panel_btn_hover_fx_${effect.id}`}
                      defaultLabel={effect.label}
                      onClick={() => handleUpdateLink("hoverEffect", effect.id)}
                      className={cn(
                        "py-2 px-2 rounded-xl border text-center font-bold transition-all cursor-pointer text-xs",
                        currentLink.hoverEffect === effect.id
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 font-black"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      )}
                    />
                  ))}
                </div>

                {/* Secondary Hover Image if change-image selected */}
                {currentLink.hoverEffect === "change-image" && (
                  <div className="p-3 bg-[#020617] rounded-xl border border-slate-800 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <CustomizableLabel
                        labelId="ad_panel_label_secondary_hover_image"
                        defaultLabel="Secondary Hover Image"
                        className="text-xs font-semibold text-cyan-300"
                      />
                      {currentLink.hoverImage && (
                        <CustomizableButton
                          buttonId="ad_panel_btn_remove_hover_image"
                          defaultLabel="Remove"
                          onClick={() => handleUpdateLink("hoverImage", "")}
                          className="text-xs text-rose-400 hover:underline cursor-pointer"
                        />
                      )}
                    </div>
                    {currentLink.hoverImage ? (
                      <div className="w-16 h-16 rounded-lg border border-slate-700 overflow-hidden">
                        <img src={currentLink.hoverImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <CustomizableButton
                        buttonId="ad_panel_btn_upload_hover_image"
                        defaultLabel="Upload Secondary Hover Artwork"
                        defaultIcon={<Upload className="w-3.5 h-3.5 text-cyan-400" />}
                        onClick={() => hoverImageFileInputRef.current?.click()}
                        className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      />
                    )}
                    <input
                      ref={hoverImageFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const url = reader.result?.toString() || "";
                            if (url) handleUpdateLink("hoverImage", url);
                          };
                          reader.readAsDataURL(file);
                        }
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* TAB 8: SWAP PANELS MATRIX                      */}
        {/* ============================================== */}
        {activeTab === "swap" && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <div className="bg-[#0e1628] p-3.5 rounded-2xl border border-indigo-500/35 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-1.5 border-b border-indigo-500/20">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
                  <CustomizableLabel
                    labelId="ad_panel_label_swap_title"
                    defaultLabel={`Swap Panel ${selectedBoxId}`}
                    className="text-xs font-bold text-indigo-300 uppercase tracking-wider"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-400">
                {uiText("components_advert_panel_full_screen_modal.p.click_any_destination_panel_below_to_swap_im", "Click any destination panel below to swap images, rotation playlists, and links directly with Panel ")}{selectedBoxId}:
              </p>

              <div className={cn(
                "grid gap-2",
                is4x4 ? "grid-cols-4" : "grid-cols-3"
              )}>
                {panelIds.map((pId) => {
                  const isCurrent = pId === selectedBoxId;
                  const pImg = boxImages[pId];
                  return (
                    <CustomizableButton
                      key={`swap-pick-${pId}`}
                      buttonId={`ad_panel_btn_swap_target_${pId}`}
                      defaultLabel={isCurrent ? `Panel ${pId} (Active)` : `Swap with #${pId}`}
                      onClick={() => !isCurrent && handleSwapPanels(selectedBoxId, pId)}
                      disabled={isCurrent}
                      className={cn(
                        "p-2.5 rounded-xl border text-center font-bold transition-all flex flex-col items-center gap-1.5 relative overflow-hidden",
                        isCurrent
                          ? "bg-indigo-950/40 border-indigo-400/80 text-indigo-300 ring-2 ring-indigo-400/30 opacity-80"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:border-indigo-400 hover:bg-slate-800/90 cursor-pointer"
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg border border-slate-700 bg-black/60 overflow-hidden flex items-center justify-center">
                        {pImg ? (
                          <img src={pImg} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-slate-600">#{pId}</span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold">
                        {isCurrent ? "Active" : `Swap #${pId}`}
                      </span>
                    </CustomizableButton>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* TAB 9: ACTIONS & SYSTEM PERSISTENCE            */}
        {/* ============================================== */}
        {activeTab === "actions" && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            <div className="bg-[#0e1628] p-3.5 rounded-2xl border border-slate-800 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-cyan-400" />
                  <CustomizableLabel
                    labelId="ad_panel_label_actions_title"
                    defaultLabel={`Panel ${selectedBoxId} Quick Actions`}
                    className="text-xs font-bold text-cyan-300 uppercase tracking-wider"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {currentImage && (
                  <CustomizableButton
                    buttonId="ad_panel_btn_actions_send_carver"
                    defaultLabel="Send Panel Image to Carver Engine"
                    defaultIcon={<Scissors className="w-3.5 h-3.5 text-cyan-300" />}
                    onClick={() => {
                      handleSendBoxImageToCarver(currentImage);
                      showToast(`✓ Sent Panel ${selectedBoxId} image to Carver!`);
                      onClose();
                    }}
                    className="w-full py-2.5 px-3 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-400/50 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                    title="Send active panel image to Carver workspace"
                  />
                )}

                <CustomizableButton
                  buttonId="ad_panel_btn_actions_clear_image"
                  defaultLabel="Clear Panel Image"
                  defaultIcon={<Trash2 className="w-3.5 h-3.5 text-rose-300" />}
                  onClick={() => {
                    setBoxImages((prev) => ({ ...prev, [selectedBoxId]: "" }));
                    showToast(`✓ Cleared Panel ${selectedBoxId} image`);
                  }}
                  className="w-full py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                  title="Clear active panel image"
                />

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <CustomizableLabel
                    labelId="ad_panel_label_actions_persistence"
                    defaultLabel="System Persistence"
                    className="text-xs font-bold text-slate-300 block uppercase tracking-wider"
                  />
                  <CustomizableButton
                    buttonId="ad_panel_btn_actions_save_all_default"
                    defaultLabel="Save All Setup As Baseline Default"
                    defaultIcon={<Bookmark className="w-4 h-4 text-slate-950" />}
                    onClick={() => {
                      const activeImg = targetMasterImage || boxImages[1];
                      if (activeImg) {
                        handleSetNBoxDefault(activeImg, boxCount);
                      }
                      saveCurrentAsDefault(undefined, undefined, {
                        boxLinkConfigs,
                        boxRotationIntervals,
                        boxRotationActive,
                        disableBoxActions,
                      });
                      showToast("✓ Saved complete setup as permanent default!");
                    }}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] border border-emerald-400/50"
                    title="Save complete layout and configurations as default"
                  />

                  <CustomizableButton
                    buttonId="ad_panel_btn_actions_reset_9_box"
                    defaultLabel={`Reset ${is4x4 ? "16" : "9"}-Panel Layout`}
                    defaultIcon={<RefreshCw className="w-3.5 h-3.5 text-slate-300" />}
                    onClick={() => {
                      handleReset9BoxDefault();
                      showToast(`✓ Reset ${is4x4 ? "16" : "9"}-panel layout to defaults`);
                    }}
                    className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    title="Reset panels to initial state"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* TAB 10: CHROMATIC PALETTE WHEEL STUDIO        */}
        {/* ============================================== */}
        {(activeTab === "palette" || (activeTab as string) === "styles") && (
          <AdvertPanelPaletteWheel
            selectedBoxId={selectedBoxId}
            totalBoxes={boxCount}
            currentStyle={
              panelStyles[selectedBoxId] || {
                borderColor: "#10b981",
                backgroundColor: "transparent",
                accentColor: "#10b981",
                textColor: "#38bdf8",
              }
            }
            onUpdateStyle={(updates) => handleUpdatePanelStyle(selectedBoxId, updates)}
            onApplyToAllPanels={handleApplyStyleToAllPanels}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Toast Notification Notice */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-300 pointer-events-auto"
          >
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DISCRETE MODE: Side-docked inspector panel (if toggled) */}
      {isDiscreteMode ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={uiText("components_advert_panel_full_screen_modal.div.front_page_advert_panels_inspector.aria_label", "Front Page Advert Panels Inspector")}
          className="fixed inset-0 z-50 pointer-events-none bg-transparent flex justify-end p-2 sm:p-3 overflow-hidden select-none"
        >
          <div className="pointer-events-auto w-[420px] max-w-[calc(100vw-16px)] h-[calc(100vh-68px)] max-h-[820px] bg-[#090f1d]/98 backdrop-blur-xl border border-emerald-500/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-slate-100 animate-in slide-in-from-right-4 duration-200 mt-12 mb-2">
            {/* Header */}
            <div className="px-3 py-2 bg-[#040a17] border-b border-emerald-500/25 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300 font-mono">{uiText("components_advert_panel_full_screen_modal.span.panel_edit", "PANEL EDIT")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CustomizableButton
                  buttonId="advert_panel_full_screen_modal_btn_12"
                  defaultIcon={<Maximize2 className="w-3.5 h-3.5" />}
                  type="button"
onClick={() => setIsDiscreteMode(false)}
className="p-1.5 rounded-lg border border-cyan-500/40 bg-[#061426] text-cyan-400 hover:text-white transition-colors cursor-pointer"
title={uiText("components_advert_panel_full_screen_modal.button.expand_to_full_screen_studio.title", "Expand to Full Screen Studio")}
                />
                <CustomizableButton
                  buttonId="advert_panel_full_screen_modal_btn_11"
                  defaultIcon={<X className="w-3.5 h-3.5" />}
                  type="button"
onClick={onClose}
className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
title={uiText("components_advert_panel_full_screen_modal.button.close_inspector.title", "Close Inspector")}
                />
              </div>
            </div>
            {renderActivePanelCard()}
            {renderControlsDeck()}
          </div>
        </div>
      ) : (
        /* FULL SCREEN STUDIO MODE: Exactly matching FullScreenCropControlPanel layout & ergonomics */
        <div
          role="dialog"
          aria-modal="true"
          aria-label={uiText("components_advert_panel_full_screen_modal.div.panel_edit_front_page_advert_panels_control.aria_label", "Panel Edit - Front Page Advert Panels Control Studio")}
          className="fixed inset-0 z-50 bg-[#070b14] text-slate-100 flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-150"
        >
          {/* ======================================================== */}
          {/* 1. TOP HEADER BAR WITH CONTROLS & EXIT TOGGLE           */}
          {/* ======================================================== */}
          <header className="h-14 px-4 bg-[#0a1120] border-b border-emerald-500/20 flex items-center justify-between shrink-0 shadow-lg relative z-30">
            {/* Left: Branding & Dimensions info */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <CustomizableLabel
                  as="h1"
                  labelId="ad_panel_header_title"
                  defaultLabel=""
                  defaultIcon={
                    <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner shrink-0">
                      <LayoutGrid className="w-5 h-5 text-emerald-400" />
                    </div>
                  }
                  className="text-sm font-black text-emerald-300 tracking-wide flex items-center gap-2 font-mono"
                />
                <CustomizableLabel
                  as="span"
                  labelId="ad_panel_label_master_badge"
                  defaultLabel=""
                  showIconAlways={false}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                />
                <CustomizableLabel
                  as="span"
                  labelId="ad_panel_label_panel_badge"
                  defaultLabel=""
                  showIconAlways={false}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                />
              </div>
            </div>

            {/* Center: Panel Switcher & Navigation */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#020617] p-1 rounded-xl border border-emerald-500/30 shadow-inner">
                <CustomizableButton
                  buttonId="advert_panel_full_screen_modal_btn_10"
                  defaultIcon={<ChevronLeft className="w-4 h-4" />}
                  type="button"
onClick={() => setSelectedBoxId((prev) => (prev <= 1 ? boxCount : prev - 1))}
className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
title={uiText("components_advert_panel_full_screen_modal.button.previous_panel.title", "Previous Panel")}
                />

                {/* Quick Panel Number Pills */}
                <div className="flex items-center gap-1 px-1 overflow-x-auto max-w-[320px] scrollbar-none">
                  {panelIds.map((bId) => {
                    const isSelected = selectedBoxId === bId;
                    const hasImg = !!boxImages[bId];
                    const hasLink = !!(boxLinkConfigs[bId]?.url || boxLinkConfigs[bId]?.hoverEffect !== "none");
                    return (
                      <CustomizableButton
                        key={`header-panel-btn-${bId}`}
                        buttonId={`ad_panel_switcher_btn_${bId}`}
                        defaultLabel={String(bId)}
                        onClick={() => setSelectedBoxId(bId)}
                        className={cn(
                          "w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center relative p-0",
                          isSelected
                            ? "bg-emerald-500 text-slate-950 font-black shadow-md scale-105"
                            : "text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700"
                        )}
                        title={`Select Panel ${bId}${hasImg ? " (Has Art)" : ""}${hasLink ? " (Has Link)" : ""}`}
                      >
                        {bId}
                        {hasImg && !isSelected && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                        {hasLink && !isSelected && !hasImg && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        )}
                      </CustomizableButton>
                    );
                  })}
                </div>

                <CustomizableButton
                  buttonId="advert_panel_full_screen_modal_btn_9"
                  defaultIcon={<ChevronRight className="w-4 h-4" />}
                  type="button"
onClick={() => setSelectedBoxId((prev) => (prev >= boxCount ? 1 : prev + 1))}
className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
title={uiText("components_advert_panel_full_screen_modal.button.next_panel.title", "Next Panel")}
                />
              </div>

              {/* 3x3 <-> 4x4 Quick Switcher */}
              <CustomizableButton
                buttonId="ad_panel_header_btn_4x4"
                defaultLabel={is4x4 ? "3×3" : "4×4"}
                defaultIcon={is4x4 ? <Grid3x3 className="w-3.5 h-3.5 text-cyan-300" /> : <LayoutGrid className="w-3.5 h-3.5 text-fuchsia-300" />}
                onClick={handleToggleMode}
                className={cn(
                  "h-8 px-2.5 rounded-xl border font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow-sm active:scale-95",
                  is4x4
                    ? "border-cyan-500/60 bg-[#081e30] hover:bg-[#0c2b45] text-cyan-300 ring-1 ring-cyan-400/40"
                    : "border-fuchsia-500/50 bg-[#1f0b2e] hover:bg-[#2e1045] text-fuchsia-300"
                )}
                title={is4x4 ? "Switch to 9-Panel (3×3) Grid" : "Switch to 16-Panel (4×4) Grid"}
              />
            </div>

            {/* Right: Actions, Palette, Exit Full Screen */}
            <div className="flex items-center gap-2">
              {/* Palette Wheel Trigger */}
              <CustomizableButton
                buttonId="ad_panel_header_btn_palette"
                defaultLabel="Palette"
                defaultIcon={<Palette className="w-3.5 h-3.5 text-cyan-400" />}
                onClick={() => setActiveTab("palette")}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-sm",
                  activeTab === "palette"
                    ? "border-cyan-400 bg-cyan-950 text-cyan-300 ring-1 ring-cyan-400/50"
                    : "border-slate-700 bg-[#061426] hover:bg-[#0a233f] text-slate-300 hover:text-cyan-300"
                )}
                title="Open Chromatic Color Wheel & Styles"
              />

              {/* Reset Spread */}
              <CustomizableButton
                buttonId="ad_panel_btn_reset_spread_overview"
                defaultLabel="Reset Spread"
                defaultIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
                onClick={() => {
                  handleReset9BoxDefault();
                  showToast(`✓ Reset ${is4x4 ? "16" : "9"}-panel spread to baseline defaults`);
                }}
                className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
                title="Reset Spread Layout to Defaults"
              />

              {/* Save All As Default */}
              <CustomizableButton
                buttonId="advert_panel_full_screen_modal_btn_8"
                defaultIcon={<Bookmark className="w-3.5 h-3.5 text-emerald-400" />}
                type="button"
onClick={() => {
                  const activeImg = targetMasterImage || boxImages[1];
                  if (activeImg) {
                    handleSetNBoxDefault(activeImg, boxCount);
                  }
                  saveCurrentAsDefault(undefined, undefined, {
                    boxLinkConfigs,
                    boxRotationIntervals,
                    boxRotationActive,
                    disableBoxActions,
                  });
                  showToast("✓ Saved complete setup as permanent default!");
                }}
className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-950/40"
title={uiText("components_advert_panel_full_screen_modal.button.save_layout_and_settings_as_baseline_default.title", "Save Layout & Settings as Baseline Default")}
              >
                  {() => (
                      <>
                        <span className="text-[11px]">{uiText("components_advert_panel_full_screen_modal.span.save_default", "Save Default")}</span>
                      </>
                    )}
              </CustomizableButton>

              {/* Dock to side toggle */}
              <CustomizableButton
                buttonId="ad_panel_btn_dock_side"
                defaultLabel=""
                forceZeroText={true}
                defaultIcon={<PanelRightClose className="w-4 h-4 text-slate-400" />}
                onClick={() => setIsDiscreteMode(true)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Dock Inspector to Side"
              />

              {/* Prominent Exit Full Screen Button matching FullScreenCropControlPanel */}
              <CustomizableButton
                buttonId="advert_panel_full_screen_modal_btn_7"
                defaultIcon={<Minimize2 className="w-4 h-4 text-slate-950" />}
                type="button"
onClick={onClose}
className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
title={uiText("components_advert_panel_full_screen_modal.button.exit_full_screen_control_studio_esc.title", "Exit Full Screen Control Studio (Esc)")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_advert_panel_full_screen_modal.span.exit_full_screen", "Exit Full Screen")}</span>
                      </>
                    )}
              </CustomizableButton>

              {/* Close X */}
              <CustomizableButton
                buttonId="advert_panel_full_screen_modal_btn_6"
                defaultIcon={<X className="w-5 h-5" />}
                type="button"
onClick={onClose}
className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
title={uiText("components_advert_panel_full_screen_modal.button.close_panel_edit_esc.title", "Close Panel Edit (Esc)")}
              />
            </div>
          </header>

          {/* ======================================================== */}
          {/* 2. MAIN WORKSPACE: CANVAS (LEFT) & CONTROL DECK (RIGHT)  */}
          {/* ======================================================== */}
          <div className="flex-1 flex overflow-hidden">
            {/* ==================================================== */}
            {/* LEFT PANE: HIGH RESOLUTION INTERACTIVE ADVERT STAGE  */}
            {/* ==================================================== */}
            <section className="flex-1 flex flex-col bg-[#050811] relative overflow-hidden border-r border-[#1a2333]">
              {/* Canvas Top Toolbar */}
              <div className="h-11 px-3 bg-[#0c1322] border-b border-slate-800/80 flex items-center justify-between shrink-0">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">{uiText("components_advert_panel_full_screen_modal.span.zoom", "Zoom:")}</span>
                  <CustomizableButton
                    buttonId="advert_panel_full_screen_modal_btn_5"
                    defaultIcon={<ZoomOut className="w-3.5 h-3.5" />}
                    type="button"
onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.15))}
className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
title={uiText("components_advert_panel_full_screen_modal.button.zoom_out.title", "Zoom Out")}
                  />
                  <span className="text-xs font-mono font-bold text-emerald-400 min-w-[45px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <CustomizableButton
                    buttonId="advert_panel_full_screen_modal_btn_4"
                    defaultIcon={<ZoomIn className="w-3.5 h-3.5" />}
                    type="button"
onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.15))}
className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
title={uiText("components_advert_panel_full_screen_modal.button.zoom_in.title", "Zoom In")}
                  />
                  <CustomizableButton
                    buttonId="advert_panel_full_screen_modal_100"
                    defaultLabel={"100%"}
                    type="button"
onClick={() => setZoomLevel(1)}
className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 ml-1 transition-colors cursor-pointer"
title={uiText("components_advert_panel_full_screen_modal.button.reset_zoom_to_100.title", "Reset Zoom to 100%")}
                  />
                </div>

                {/* Center: Stage Hint */}
                <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{uiText("components_advert_panel_full_screen_modal.span.interactive_stage_drag_any_panel_to_swap_cli", "Interactive Stage • Drag any panel to swap • Click to inspect & customize")}</span>
                </div>

                {/* Right: Aspect Ratio & Simulation Controls */}
                <div className="flex items-center gap-2">
                  {/* Test Hover Trigger */}
                  <CustomizableButton
                    buttonId="advert_panel_full_screen_modal_btn_3"
                    defaultIcon={<MousePointerClick className="w-3.5 h-3.5" />}
                    type="button"
onClick={() => setIsTestHoverActive((prev) => !prev)}
className={cn(
                      "px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs",
                      isTestHoverActive
                        ? "bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md shadow-cyan-500/20"
                        : "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700"
                    )}
title={uiText("components_advert_panel_full_screen_modal.button.simulate_live_user_hover_effects_3d_spin_ima.title", "Simulate live user hover effects (3D spin, image swap)")}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_advert_panel_full_screen_modal.span.test_hover", "Test Hover")}</span>
                          </>
                        )}
                  </CustomizableButton>

                  {/* Aspect Ratio Modes */}
                  <div className="flex items-center gap-1 bg-[#030712] p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
                    {[
                      { mode: "auto", id: "ad_panel_btn_aspect_auto", label: "Auto" },
                      { mode: "1:1", id: "ad_panel_btn_aspect_1_1", label: "1:1" },
                      { mode: "16:9", id: "ad_panel_btn_aspect_16_9", label: "16:9" },
                      { mode: "4:3", id: "ad_panel_btn_aspect_4_3", label: "4:3" },
                    ].map((item) => (
                      <CustomizableButton
                        key={`aspect-mode-${item.mode}`}
                        buttonId={item.id}
                        defaultLabel={item.label}
                        onClick={() => setLiveAspectMode(item.mode as any)}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer",
                          liveAspectMode === item.mode
                            ? "bg-emerald-500 text-slate-950 font-black shadow-xs"
                            : "text-slate-400 hover:text-slate-200"
                        )}
                        title={`Set live view aspect ratio to ${item.mode === "auto" ? "Original Image Aspect" : item.mode}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Interactive Stage Area */}
              <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-[radial-gradient(#152033_1px,transparent_1px)] [background-size:16px_16px] relative">
                <div
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: "center center",
                    transition: "transform 100ms ease-out",
                  }}
                  className="relative shadow-2xl rounded-2xl flex items-center justify-center max-w-full max-h-full"
                >
                  {/* SPECIAL MODE: 2.5D Parallax Stage */}
                  {activeTab === "parallax" ? (
                    <div
                      onMouseMove={handleParallaxMouseMove}
                      style={{
                        aspectRatio: `${computedLiveAspect}`,
                        width: "min(640px, 85vw)",
                        height: "min(540px, 75vh)",
                      }}
                      className="relative overflow-hidden rounded-2xl border-2 border-purple-500/70 shadow-[0_0_35px_rgba(168,85,247,0.3)] bg-[#090e1a] flex items-center justify-center select-none cursor-crosshair [perspective:1000px] p-4"
                      title={isParallaxAutoOrbit ? "Auto Orbit Active (toggle off for mouse tilt)" : "Move mouse to tilt depth layers"}
                    >
                      {/* Background Layer */}
                      <div
                        className="absolute inset-0 transition-transform duration-75 ease-out filter brightness-75 blur-[1px]"
                        style={{
                          transform: `translate3d(${-parallaxTiltX * 0.3}px, ${-parallaxTiltY * 0.3}px, -50px) scale(1.15)`,
                        }}
                      >
                        <img
                          src={displayImage || currentImage || targetMasterImage || panel1Image}
                          alt={uiText("components_advert_panel_full_screen_modal.img.background.alt", "Background")}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Midground Layer */}
                      <div
                        className="absolute inset-0 transition-transform duration-75 ease-out"
                        style={{
                          transform: `translate3d(${parallaxTiltX * 0.4}px, ${parallaxTiltY * 0.4}px, 0px) scale(${parallaxMidgroundScale})`,
                        }}
                      >
                        <img
                          src={displayImage || currentImage || targetMasterImage || panel1Image}
                          alt={uiText("components_advert_panel_full_screen_modal.img.midground.alt", "Midground")}
                          className="w-full h-full object-cover filter contrast-105"
                        />
                      </div>

                      {/* Foreground Layer */}
                      <div
                        className="absolute inset-0 transition-transform duration-75 ease-out filter drop-shadow-2xl"
                        style={{
                          transform: `translate3d(${parallaxTiltX * 0.8}px, ${parallaxTiltY * 0.8}px, 50px) scale(${parallaxForegroundScale})`,
                        }}
                      >
                        <img
                          src={displayImage || currentImage || targetMasterImage || panel1Image}
                          alt={uiText("components_advert_panel_full_screen_modal.img.foreground.alt", "Foreground")}
                          className="w-full h-full object-contain filter saturate-120"
                        />
                      </div>

                      {parallaxShowWireframe && (
                        <div className="absolute inset-4 border-2 border-dashed border-purple-400/60 pointer-events-none rounded-xl" />
                      )}

                      <div className="absolute top-3 left-3 text-xs font-mono text-purple-300 bg-purple-950/80 border border-purple-500/30 px-2.5 py-1 rounded-lg shadow-md">
                        {uiText("components_advert_panel_full_screen_modal.div.2_5d_parallax_stage_tilt", "2.5D Parallax Stage • Tilt: ")}{Math.round(parallaxTiltX)}{uiText("components_advert_panel_full_screen_modal.div.px", "px, ")}{Math.round(parallaxTiltY)}{uiText("components_advert_panel_full_screen_modal.div.px_2", "px")}
                      </div>
                    </div>
                  ) : activeTab === "spread_studio" ? (
                    /* SPECIAL MODE: Spread Studio Preview */
                    <div
                      style={{
                        aspectRatio: `${computedLiveAspect}`,
                        width: "min(640px, 85vw)",
                        height: "min(540px, 75vh)",
                      }}
                      className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/70 shadow-[0_0_35px_rgba(6,182,212,0.3)] bg-[#090e1a] flex items-center justify-center p-4"
                    >
                      <img
                        src={spreadStudioImage || targetMasterImage || currentImage || panel1Image || displayImage}
                        alt={uiText("components_advert_panel_full_screen_modal.img.spread_preview.alt", "Spread Preview")}
                        style={{
                          filter: SPREAD_EFFECTS.find((e) => e.id === spreadStudioEffect)?.filter || "none",
                          transform: `scale(${spreadStudioStretchX}, ${spreadStudioStretchY})`,
                        }}
                        className="max-w-full max-h-full object-contain transition-all duration-300 rounded-lg shadow-lg"
                      />
                      {/* Refined Minimal Grid Overlay for Spread Studio */}
                      <div className={cn(
                        "absolute inset-4 pointer-events-none gap-1.5 border border-cyan-500/20 rounded-xl overflow-hidden",
                        is4x4 ? "grid grid-cols-4 grid-rows-4" : "grid grid-cols-3 grid-rows-3"
                      )}>
                        {panelIds.map((bId) => {
                          const isSelected = spreadStudioSelectedBoxes.includes(bId);
                          return (
                            <div
                              key={`overlay-box-${bId}`}
                              className={cn(
                                "border flex items-start justify-start p-1 transition-all",
                                isSelected
                                  ? "border-cyan-400/60 bg-cyan-500/10"
                                  : "border-slate-700/20 bg-transparent"
                              )}
                            >
                              <span className={cn(
                                "font-mono text-[9px] font-bold px-1 py-0.5 rounded backdrop-blur-xs",
                                isSelected ? "bg-cyan-500 text-slate-950" : "text-slate-400 bg-black/60"
                              )}>
                                #{bId}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* STANDARD MODE: Full Interactive 3x3 or 4x4 Advert Stage */
                    <div
                      className={cn(
                        "p-0 bg-transparent border-0 shadow-none",
                        "w-[600px] xl:w-[680px] max-w-[88vw] aspect-square",
                        is4x4 ? "grid grid-cols-4 grid-rows-4 gap-2.5" : "grid grid-cols-3 grid-rows-3 gap-3"
                      )}
                    >
                      {panelIds.map((bId) => {
                        const bImg = boxImages[bId];
                        const isSelected = selectedBoxId === bId;
                        const bCfg = boxLinkConfigs[bId];
                        const isRotatingThis = boxRotationActive[bId] && (boxRotationSeries[bId]?.length || 0) > 0;
                        const isHero = bId === 1;

                        const isDragSource = draggedBoxId === bId;
                        const isDropTarget = dragOverBoxId === bId;

                        return (
                          <div
                            key={`stage-tile-${bId}`}
                            draggable
                            onDragStart={() => setDraggedBoxId(bId)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (dragOverBoxId !== bId) setDragOverBoxId(bId);
                            }}
                            onDragLeave={() => {
                              if (dragOverBoxId === bId) setDragOverBoxId(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverBoxId(null);
                              if (draggedBoxId && draggedBoxId !== bId) {
                                handleSwapPanels(draggedBoxId, bId);
                                setDraggedBoxId(null);
                              }
                            }}
                            onClick={() => setSelectedBoxId(bId)}
                            className={cn(
                              "relative rounded-xl border-2 overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between p-2 select-none group/tile",
                              isSelected
                                ? "border-emerald-400 ring-4 ring-emerald-500/30 bg-emerald-950/20 shadow-[0_0_30px_rgba(16,185,129,0.35)] scale-[1.02] z-10"
                                : isDropTarget
                                ? "border-amber-400 ring-4 ring-amber-500/40 bg-amber-950/30 scale-105"
                                : isDragSource
                                ? "opacity-50 border-dashed border-slate-600"
                                : bImg
                                ? "border-slate-800 bg-[#090f1d] hover:border-slate-600 hover:shadow-lg"
                                : "border-dashed border-slate-800/80 bg-[#060a14] hover:border-slate-700"
                            )}
                          >
                            {/* Artwork Image - Clear, crisp, no dark overlays */}
                            {bImg ? (
                              <img
                                src={bImg}
                                alt={`Tile ${bId}`}
                                className={cn(
                                  "absolute inset-0 w-full h-full object-cover transition-all duration-500 pointer-events-none",
                                  isTestHoverActive && bCfg?.hoverEffect === "spin" && "[transform:rotateY(180deg)]",
                                  isTestHoverActive && bCfg?.hoverEffect === "change-image" && bCfg.hoverImage && "opacity-0"
                                )}
                              />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                                <Grid3x3 className="w-5 h-5 text-slate-700 mb-1" />
                                <span className="text-[10px] font-bold text-slate-500">{uiText("components_advert_panel_full_screen_modal.span.panel", "Panel ")}{bId}{uiText("components_advert_panel_full_screen_modal.span.empty", " Empty")}</span>
                              </div>
                            )}

                            {/* Secondary hover image swap simulation */}
                            {isTestHoverActive && bCfg?.hoverEffect === "change-image" && bCfg.hoverImage && (
                              <img
                                src={bCfg.hoverImage}
                                alt={uiText("components_advert_panel_full_screen_modal.img.hover_preview.alt_2", "Hover preview")}
                                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                              />
                            )}

                            {/* Minimal, non-intrusive top badge row */}
                            <div className="flex items-center justify-between w-full relative z-10 pointer-events-none">
                              <span
                                className={cn(
                                  "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm backdrop-blur-xs transition-colors",
                                  isSelected
                                    ? "bg-emerald-500 text-slate-950 font-black shadow-emerald-500/30"
                                    : isHero
                                    ? "bg-slate-950/80 text-emerald-300 border border-emerald-500/40"
                                    : "bg-slate-950/75 text-slate-300 border border-slate-700/50"
                                )}
                              >
                                {isHero ? "Hero #1" : `#${bId}`}
                              </span>

                              {/* Right Badges: Link or Rotation indicator */}
                              <div className="flex items-center gap-1">
                                {bCfg?.url && (
                                  <div
                                    className="p-1 bg-cyan-950/80 border border-cyan-400/40 rounded text-cyan-300 shadow-sm backdrop-blur-xs"
                                    title={`Redirect Target: ${bCfg.url}`}
                                  >
                                    <Link2 className="w-2.5 h-2.5" />
                                  </div>
                                )}
                                {isRotatingThis && (
                                  <div
                                    className="p-1 bg-purple-950/80 border border-purple-400/40 rounded text-purple-300 shadow-sm backdrop-blur-xs"
                                    title={uiText("components_advert_panel_full_screen_modal.div.rotation_series_active.title", "Rotation Series Active")}
                                  >
                                    <RotateCw className="w-2.5 h-2.5 animate-spin" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Sleek, compact hover action pill (appears only on hover without obscuring image) */}
                            <div className="absolute bottom-1.5 inset-x-1.5 z-10 flex items-center justify-between opacity-0 group-hover/tile:opacity-100 transition-opacity duration-150 pointer-events-auto">
                              <span className={cn(
                                "text-[8.5px] font-mono px-1.5 py-0.5 rounded backdrop-blur-md shadow font-semibold",
                                isSelected ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-950/85 text-slate-200 border border-slate-700/60"
                              )}>
                                {isSelected ? "Active" : `Select #${bId}`}
                              </span>
                              <div className="flex items-center gap-1">
                                <CustomizableButton
                                  buttonId="advert_panel_full_screen_modal_btn_2"
                                  defaultIcon={<Upload className="w-2.5 h-2.5" />}
                                  type="button"
onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBoxId(bId);
                                    activePanelFileInputRef.current?.click();
                                  }}
className="p-1 rounded bg-slate-900/90 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700/60 transition-colors shadow-xs cursor-pointer"
title={`Upload artwork to Panel ${bId}`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Panels Filmstrip / Quick Gallery */}
              <div className="h-14 px-4 bg-[#060a14] border-t border-slate-800/80 flex items-center justify-between shrink-0 gap-3 z-20">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold shrink-0">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{uiText("components_advert_panel_full_screen_modal.span.panels_filmstrip", "Panels Filmstrip (")}{panelIds.length}):</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin flex-1">
                  {panelIds.map((pId) => {
                    const isSelected = selectedBoxId === pId;
                    const pImg = boxImages[pId];
                    return (
                      <CustomizableButton
                        buttonId="advert_panel_full_screen_modal_btn_1"
                        key={`fs-panel-thumb-${pId}`}
type="button"
onClick={() => setSelectedBoxId(pId)}
className={cn(
                          "relative w-10 h-10 rounded-lg border overflow-hidden shrink-0 transition-all cursor-pointer bg-black/60 flex items-center justify-center group",
                          isSelected
                            ? "ring-2 ring-emerald-400 border-emerald-400 scale-105 shadow-md shadow-emerald-500/20"
                            : "border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100"
                        )}
title={`Select Panel #${pId}${isSelected ? " (Active)" : ""}`}
                      >
                          {() => (
                              <>
                                {pImg ? (
                          <img src={pImg} alt={`Panel ${pId}`} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-mono text-slate-600 font-bold">#{pId}</span>
                        )}
                              <span className={cn(
                          "absolute bottom-0 right-0 px-1 text-[8px] font-mono font-bold rounded-tl",
                          isSelected ? "bg-emerald-500 text-slate-950 font-black" : "bg-black/80 text-white"
                        )}>
                          {pId}
                        </span>
                              </>
                            )}
                      </CustomizableButton>
                    );
                  })}
                </div>
                {/* Quick stats on right side of filmstrip */}
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 shrink-0 font-mono">
                  <span className="text-emerald-400 font-bold">{uiText("components_advert_panel_full_screen_modal.span.panel_2", "Panel #")}{selectedBoxId}{uiText("components_advert_panel_full_screen_modal.span.selected", " Selected")}</span>
                  <span>•</span>
                  <span>{is4x4 ? "4×4 (16 Slots)" : "3×3 (9 Slots)"}</span>
                </div>
              </div>
            </section>

            {/* ==================================================== */}
            {/* RIGHT PANE: CONTROL DECK (440px wide)                 */}
            {/* ==================================================== */}
            <aside className="w-[430px] xl:w-[480px] bg-[#080d19] flex flex-col shrink-0 border-l border-slate-800/90 shadow-2xl overflow-hidden">
              {renderActivePanelCard()}
              {renderControlsDeck()}
            </aside>
          </div>
        </div>
      )}
    </>
  );
};
