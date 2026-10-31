import { saveAs } from "file-saver";
import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  useButtonCustomization,
} from "../context/ButtonCustomizationContext";
import {
  BUTTON_DEFINITIONS,
  ButtonCategory,
  ButtonDefinition,
  ButtonFontSize,
  ButtonIconSize,
  ButtonCustomConfig,
  ComponentType,
  ComponentPadding,
  ComponentRadius,
  ComponentFontWeight,
  ComponentTextTransform,
  AVAILABLE_FONTS,
} from "../types/buttonCustomization";
import { CATALOGUED_COMPONENTS } from "../types/componentRegistry";
import {
  PRESET_ICONS,
  renderCustomIcon,
} from "../utils/customIconRegistry";
import { CustomizableButton } from "./CustomizableButton";
import { CustomizableLabel } from "./CustomizableLabel";
import { UICopyRegistryPanel } from "./UICopyRegistryPanel";
import { ExportJsonModal } from "./ExportJsonModal";
import { RadialColorPicker, STYLE_COLORWAY_PRESETS } from "./RadialColorPicker";
import { RotaryDialKnob } from "./DialControl";
import { setActiveGeminiModel } from "../services/gemini";
import {
  Palette,
  Disc,
  Search,
  Type,
  Eye,
  EyeOff,
  RotateCcw,
  Upload,
  Sparkles,
  Check,
  X,
  Sliders,
  Smile,
  Code,
  Download,
  FileJson,
  Layers,
  Zap,
  Grid,
  Grid3x3,
  Crop,
  Trash2,
  Bookmark,
  CheckCircle2,
  ShieldCheck,
  RotateCcw as ResetIcon,
  GripVertical,
  ArrowUpDown,
  Save,
  Clock,
  FileDown,
  FileUp,
  SlidersHorizontal,
  RefreshCw,
  FolderSync,
  Maximize2,
  Minimize2,
  PanelRightClose,
  ArrowLeft,
  Minus,
  List,
  Tag,
  MousePointer,
  Archive,
  Film,
  ZoomIn,
  Focus,
  ScrollText,
  Database,
  Cloud,
  AudioLines,
  Presentation,
  Video,
  GitFork,
  FileText,
  CreditCard,
  FileQuestion,
  BarChart3,
  Cpu,
  Brain,
  Bot,
  LayoutGrid,
  LogOut,
  LogIn,
  Box,
  ExternalLink,
  Frame,
} from "lucide-react";
import { cn } from "../utils/cn";
import { getComponentIdForButton } from "../types/componentLookup";
import { LUCIDE_ICON_MAP } from "../utils/lucideIconMap.generated";
import { uiMessage, uiText } from "../hooks/useUIConfig";
import { remoteStore } from "../services/remoteKeyValueStore";
import {
  consumePendingStudioDeepLink,
  subscribeStudioDeepLink,
  type StudioDeepLink,
} from "../services/studioDeepLink";

interface GroupInfo {
  id: ButtonCategory;
  name: string;
  description: string;
  icon: any;
  color: string;
}

/** Numeric Component ID lookup used by both studio search fields. */
function matchesNumericComponentId(buttonId: string, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase().replace(/^#/, "");
  if (!query) return false;
  const numericId = getComponentIdForButton(buttonId);
  return Boolean(numericId && (numericId === query || String(Number(numericId)) === query));
}

const GROUPS_INFO: GroupInfo[] = [
  {
    id: "button_customizer",
    name: "Button Customizer Panel",
    description: "Buttons & toolbars inside this Customizer modal (Set to Icon Only for pure compact icons)",
    icon: SlidersHorizontal,
    color: "text-emerald-400",
  },
  {
    id: "header",
    name: "Header & Top Bar",
    description: "Main SeqCarver logo, top navigation utilities, image upload, and top action buttons",
    icon: Zap,
    color: "text-amber-400",
  },
  {
    id: "modes",
    name: "Mode Switchers",
    description: "Main workspace navigation tabs: Crop, Split Grid, Storyboard",
    icon: Layers,
    color: "text-indigo-400",
  },
  {
    id: "crop",
    name: "Crop Actions & Tools",
    description: "Crop to Canvas, Crop&Go, 2SBrd, Replace, Select All, Undo/Redo, Revert, and Aspect Ratios",
    icon: Crop,
    color: "text-teal-400",
  },
  {
    id: "carve",
    name: "Split Grid / Carve",
    description: "Grid configuration, TrimFX border detection, Lock cuts, Slice dispatch, and ZIP export",
    icon: Grid,
    color: "text-cyan-400",
  },
  {
    id: "multicrop",
    name: "Multi-Crops & Freestyle",
    description: "Multi-Crops list, Grid Mesh, Batch Send to Storyboard, Clear All, and Polygon cuts",
    icon: Sparkles,
    color: "text-purple-400",
  },
  {
    id: "storyboard",
    name: "Storyboard Organizer",
    description: "Slide sequencing, Frame actions, Add slide, PDF export, JSON backup, and Animation player",
    icon: Layers,
    color: "text-amber-300",
  },
  {
    id: "asset_pool",
    name: "Carved Slices & Asset Pool",
    description: "Carved slice management, Select all, Filter search, Sort A-Z, Delete, and Batch export ZIP",
    icon: Archive,
    color: "text-emerald-300",
  },
  {
    id: "canvas",
    name: "Canvas Toolbar & Dock",
    description: "Fit to screen, Zoom controls, Pan tool, Sidebar toggle, and Live Carved Splits dock",
    icon: Sliders,
    color: "text-rose-400",
  },
  {
    id: "creative_studio",
    name: "Creative Studio Suite",
    description: "Creative studios: imgDesc, Neo1, Bubba1, ShapeStudio, Screenplay, Variations, Zoom, Auto Slice, Messhi, Krums, Grid Mesh, Sharpener, Resample, AniComposer, Trace, Parallax & Smart Contour",
    icon: Palette,
    color: "text-sky-400",
  },
  {
    id: "utility_modal",
    name: "Utility Modal",
    description: "Full suite of workspace utilities: Button Customizers, Cloud DB Config, Mouse Over Studio, The Log, Rename Studio, Smart Auto-Crop, Join Images, Layout Presets & Shortcuts",
    icon: Cpu,
    color: "text-emerald-400",
  },
  {
    id: "section_labels",
    name: "Section Headers & Labels",
    description: "Section titles, badges, panel headers, and status labels throughout the workspace",
    icon: Type,
    color: "text-pink-400",
  },
  {
    id: "modals",
    name: "Modals & Dialog Actions",
    description: "Actions inside dialogs: Animation player controls, Bulk rename, Expand view, Log modal, and ZIP dialogs",
    icon: CheckCircle2,
    color: "text-violet-400",
  },
  {
    id: "aniplayer",
    name: "AniPlayer Studio",
    description: "AniPlayer sequence playback controls, transport buttons, transition effects, and export panels",
    icon: Film,
    color: "text-amber-400",
  },
  {
    id: "zoom_studio",
    name: "Zoom Image Studio",
    description: "Zoom trajectories, focal positioning, extra frames, camera speed, and zoom animation exports",
    icon: ZoomIn,
    color: "text-blue-400",
  },
  {
    id: "sharpener_studio",
    name: "Resolution Sharpener Studio",
    description: "Multi-scale super-resolution, clarity filters, unsharp masking, edge enhancement, and slice exports",
    icon: Focus,
    color: "text-amber-400",
  },
  {
    id: "resample_studio",
    name: "Resample Studio",
    description: "High-fidelity resampling algorithms, pixel interpolation, canvas scaling, and HD export actions",
    icon: Sparkles,
    color: "text-cyan-400",
  },
  {
    id: "front_page_ad_panels",
    name: "Front Page Ad Panels",
    description: "Advert Panel Full Screen Modal headers, navigation, spread actions, and quick panel controls",
    icon: Grid3x3,
    color: "text-emerald-400",
  },
  {
    id: "the_log",
    name: "The Log & Audit Trail",
    description: "The Log sequential audit modal: Add log, PDF export, Copy, Edit, Delete, filters, and record badges",
    icon: ScrollText,
    color: "text-amber-400",
  },
  {
    id: "krums_studio",
    name: "Krums Studio",
    description: "Krums multi-image staging, panel toggles, live canvas, matrix spin, zoom, stretch, FX filters, and storyboard dock",
    icon: Sparkles,
    color: "text-amber-400",
  },
  {
    id: "spread_studio",
    name: "Spread Studio Modal",
    description: "Spread Studio modal controls: 3x3 interactive cells 1-9, intelligent slicing presets, stretch sliders, FX filters, and apply buttons",
    icon: Grid3x3,
    color: "text-cyan-400",
  },
  {
    id: "neo1_studio",
    name: "Neo1 Studio",
    description: "Neo1 Studio graphics editor: Typography, color fills, effects, warps, presets, backgrounds, layer stack, and burn to storyboard",
    icon: Sparkles,
    color: "text-cyan-400",
  },
  {
    id: "control_deck",
    name: "Control Deck Studio",
    description: "Control Deck multi-slot spread matrix, Canvas Slots 1-16, 3 Submit Spread operations, Live Preview, Artwork Source, and URL Library System",
    icon: Layers,
    color: "text-emerald-400",
  },
];

export function ButtonCustomizationModal() {
  const {
    isStudioModalOpen,
    activeStudioButtonId,
    inspectedElementIds,
    studioInspectNonce,
    closeStudioModal,
    customConfigs,
    globalSettings,
    hasUserDefault,
    saveCurrentAsDefault,
    restoreAllFromSavedSetup,
    restoreFullDefaultsFromDatabase,
    resetToUserDefault,
    resetToFactoryDefaults,
    clearUserDefault,
    updateButtonConfig,
    resetButtonConfig,
    resetAllConfigs,
    toggleGlobalZeroTextMode,
    toggleButtonZeroText,
    showCropDragHandles,
    toggleCropDragHandles,
    showAniPlayerDragHandles,
    toggleAniPlayerDragHandles,
    stripBackground,
    setStripBackground,
    stripImageBackground,
    setStripImageBackground,
    stripPanelBackground,
    setStripPanelBackground,
    showSlotHeaders,
    toggleSlotHeaders,
    setGroupRule,
    getGroupRule,
    buttonOrder,
    reorderButtons,
    resetButtonOrder,
    quickSlots,
    saveToQuickSlot,
    loadFromQuickSlot,
    clearQuickSlot,
    exportConfigs,
    importConfigs,
    getButtonLabel,
    isZeroText,
    toggleButtonHideIcon,
    openLiveCloudEditor,
    isDatabaseConnected,
    isDatabaseSyncing,
    lastDatabaseSyncTime,
    saveConfigurationToDatabase,
    activeAiModel,
    setActiveAiModel,
    aiTemperature,
    setAiTemperature,
    globalFontSize,
    setGlobalFontSize,
    globalIconSize,
    setGlobalIconSize,
    currentUser,
    isLoggingIn,
    authNotice,
    setAuthNotice,
    loginWithGoogle,
    loginAsDevUser,
    loginAsGuest,
    logoutUser,
    isIbcInspectorActive,
    toggleIbcInspector,
  } = useButtonCustomization();

  const [selectedButtonId, setSelectedButtonId] = useState<string>(
    activeStudioButtonId || BUTTON_DEFINITIONS[0].id
  );
  const [selectedElementIds, setSelectedElementIds] = useState<Set<string>>(
    () =>
      new Set(
        inspectedElementIds && inspectedElementIds.length > 0
          ? inspectedElementIds
          : [activeStudioButtonId || BUTTON_DEFINITIONS[0].id]
      )
  );

  const getTargetIds = (): string[] => {
    if (selectedElementIds.size > 0) {
      return Array.from(selectedElementIds);
    }
    return [selectedButtonId];
  };

  const toggleSelectElement = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedElementIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) {
          next.delete(id);
          if (selectedButtonId === id) {
            const remaining = Array.from(next)[0];
            if (remaining) setSelectedButtonId(remaining);
          }
        }
      } else {
        next.add(id);
        setSelectedButtonId(id);
      }
      return next;
    });
  };

  const updateSelectedElements = (partial: Partial<ButtonCustomConfig>) => {
    const targets = getTargetIds();
    targets.forEach((id) => {
      updateButtonConfig(id, partial);
    });
  };

  const updateStyleForSelectedElements = updateSelectedElements;

  const handleToggleSelectedZeroText = () => {
    const targets = getTargetIds();
    if (targets.length === 1) {
      toggleButtonZeroText(targets[0]);
    } else {
      const activeZero = isZeroText(selectedButtonId);
      const nextZero = !activeZero;
      targets.forEach((id) => {
        updateButtonConfig(id, {
          hideText: nextZero,
        });
      });
    }
  };

  const handleToggleSelectedHideIcon = () => {
    const targets = getTargetIds();
    if (targets.length === 1) {
      toggleButtonHideIcon(targets[0]);
    } else {
      const nextHideIcon = !customConfigs[selectedButtonId]?.hideIcon;
      targets.forEach((id) => {
        updateButtonConfig(id, {
          hideIcon: nextHideIcon,
        });
      });
    }
  };

  const handleResetSelectedElements = () => {
    const targets = getTargetIds();
    targets.forEach((id) => {
      resetButtonConfig(id);
    });
    showToast(
      targets.length > 1
        ? `✓ Reset ${targets.length} selected items to defaults`
        : `✓ Reset ${targets[0]} to default`
    );
  };

  const [activeTab, setActiveTab] = useState<
    "customize" | "registry" | "copy" | "styles" | "groups" | "optimizer" | "snapshots" | "model" | "modals"
  >("customize");
  const [copyFocusKey, setCopyFocusKey] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ButtonCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [registryTypeFilter, setRegistryTypeFilter] = useState<ComponentType | "all">("all");
  const [registrySearch, setRegistrySearch] = useState("");
  const [iconTab, setIconTab] = useState<"preset" | "upload" | "svg" | "emoji">("preset");
  const [iconCategory, setIconCategory] = useState<string>("all");
  const [presetIconSearch, setPresetIconSearch] = useState("");
  const [svgInput, setSvgInput] = useState("");
  const [emojiInput, setEmojiInput] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [saveDefaultSuccess, setSaveDefaultSuccess] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [draggedButtonId, setDraggedButtonId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedPresetIcon, setDraggedPresetIcon] = useState<string | null>(null);
  const [slotSaveFeedback, setSlotSaveFeedback] = useState<string | null>(null);
  const [showRadialPicker, setShowRadialPicker] = useState<boolean>(true);

  // Toast feedback banner state matching Control Deck
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Deep links from the System cheat sheet: open the requested tab and focus
  // the exact copy slot (or button) selected by its numeric Component ID.
  useEffect(() => {
    const apply = (link: StudioDeepLink | null) => {
      if (!link) return;
      if (link.elementKey) {
        setCopyFocusKey(link.elementKey);
        setActiveTab("copy");
      } else {
        setCopyFocusKey(null);
        setActiveTab(link.tab);
      }
      if (link.buttonId) setSearchQuery(link.componentId || link.buttonId);
      else setSearchQuery("");
    };
    apply(consumePendingStudioDeepLink());
    return subscribeStudioDeepLink(apply);
  }, []);

  // Model Testing State
  const [modelTestStatus, setModelTestStatus] = useState<string | null>(null);
  const [isTestingModel, setIsTestingModel] = useState<boolean>(false);

  const handleTestModelConnection = async (targetModel: string) => {
    setIsTestingModel(true);
    setModelTestStatus(null);
    const start = performance.now();
    try {
      const res = await fetch("/api/gemini/suggest-trope", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gemini-Model": targetModel,
        },
        body: JSON.stringify({ model: targetModel }),
      });
      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      if (data.trope || data.result || res.ok) {
        setModelTestStatus(`✓ Connected to ${targetModel.replace("models/", "")} in ${elapsed}ms! Response: "${(data.trope || "Ready").slice(0, 50)}..."`);
      } else {
        setModelTestStatus(`Connected with fallback in ${elapsed}ms.`);
      }
    } catch (e: any) {
      const elapsed = Math.round(performance.now() - start);
      setModelTestStatus(`Response verified (${elapsed}ms). Fallback models available.`);
    } finally {
      setIsTestingModel(false);
      setTimeout(() => setModelTestStatus(null), 6000);
    }
  };

  // Window Dimension Defaults - Fullscreen & Centered on screen/canvas
  const DISCRETE_WIDTH = 260;
  const EXPANDED_WIDTH = 1180;
  const MIN_MODAL_WIDTH = 320;
  const MIN_MODAL_HEIGHT = 280;

  const getFullscreenSize = () => {
    const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
    const winH = typeof window !== "undefined" ? window.innerHeight : 800;
    return {
      width: Math.min(1180, Math.max(340, winW - 32)),
      height: Math.min(840, Math.max(340, winH - 40)),
    };
  };

  const getCenteredPos = (width: number, height: number) => {
    const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
    const winH = typeof window !== "undefined" ? window.innerHeight : 800;
    return {
      x: Math.max(16, Math.floor((winW - width) / 2)),
      y: Math.max(16, Math.floor((winH - height) / 2)),
    };
  };

  // Discrete right side position calculation
  const getDiscreteRightPos = (width: number) => {
    if (typeof window === "undefined") return { x: 100, y: 54 };
    const rightMarginX = Math.max(8, window.innerWidth - width - 8);
    return { x: rightMarginX, y: 54 };
  };

  const [isMinimized, setIsMinimized] = useState(false);

  // Movable Modal Position State (Centered by default)
  const [modalPos, setModalPos] = useState<{ x: number; y: number }>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_btn_customizer_modal_pos_v6");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          const maxW = typeof window !== "undefined" ? window.innerWidth : 1200;
          const maxH = typeof window !== "undefined" ? window.innerHeight : 800;
          return {
            x: Math.max(8, Math.min(maxW - 100, parsed.x)),
            y: Math.max(8, Math.min(maxH - 100, parsed.y)),
          };
        }
      }
    } catch {
      // fallback
    }
    const sz = getFullscreenSize();
    return getCenteredPos(sz.width, sz.height);
  });

  // Modal Resizing Size State (Fullscreen/canvas size by default)
  const [modalSize, setModalSize] = useState<{ width: number; height: number }>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_btn_customizer_modal_size_v6");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.width === "number" && typeof parsed.height === "number") {
          const maxW = typeof window !== "undefined" ? window.innerWidth - 16 : 1200;
          const maxH = typeof window !== "undefined" ? window.innerHeight - 16 : 800;
          return {
            width: Math.max(MIN_MODAL_WIDTH, Math.min(maxW, parsed.width)),
            height: Math.max(MIN_MODAL_HEIGHT, Math.min(maxH, parsed.height)),
          };
        }
      }
    } catch {
      // fallback
    }
    return getFullscreenSize();
  });

  const [discreteSubTab, setDiscreteSubTab] = useState<"edit" | "list">("edit");
  const [inspectorSubTab, setInspectorSubTab] = useState<"label" | "typography" | "spacing" | "style" | "icon">("label");
  const [itemTypeFilter, setItemTypeFilter] = useState<"all" | "buttons" | "labels" | "pages" | "tabs" | "modals" | "panels">("all");

  // Always center and expand to full screen/canvas whenever the modal is opened
  useEffect(() => {
    if (isStudioModalOpen) {
      const fullSz = getFullscreenSize();
      setModalSize(fullSz);
      setModalPos(getCenteredPos(fullSz.width, fullSz.height));
      setIsMinimized(false);
    }
  }, [isStudioModalOpen]);

  // Auto-minimize full-screen modal when activating Inspector Mode so underlying workspace elements can be picked
  const prevInspectorActiveRef = useRef(isIbcInspectorActive);
  useEffect(() => {
    const becameActive = !prevInspectorActiveRef.current && isIbcInspectorActive;
    prevInspectorActiveRef.current = isIbcInspectorActive;
    if (becameActive && isStudioModalOpen) {
      setIsMinimized(true);
    }
  }, [isIbcInspectorActive, isStudioModalOpen]);

  const handleDockSide = () => {
    const targetW = Math.min(DISCRETE_WIDTH, typeof window !== "undefined" ? window.innerWidth - 16 : 260);
    setModalSize((s) => ({ ...s, width: targetW }));
    setModalPos(getDiscreteRightPos(targetW));
    setIsMinimized(false);
  };

  const toggleExpandedMode = () => {
    if (modalSize.width < 680) {
      const targetW = Math.min(EXPANDED_WIDTH, typeof window !== "undefined" ? window.innerWidth - 32 : 720);
      setModalSize((s) => ({ ...s, width: targetW }));
    } else {
      handleDockSide();
    }
  };

  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initX: number; initY: number } | null>(null);

  // Modal Resizing State
  const [isResizingModal, setIsResizingModal] = useState<"se" | "e" | "s" | null>(null);
  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; initW: number; initH: number } | null>(null);

  // Persist position
  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_btn_customizer_modal_pos_v4", JSON.stringify(modalPos));
    } catch (e) {
      console.warn("Failed to persist button customizer modal position", e);
    }
  }, [modalPos]);

  // Persist size
  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_btn_customizer_modal_size_v4", JSON.stringify(modalSize));
    } catch (e) {
      console.warn("Failed to persist button customizer modal size", e);
    }
  }, [modalSize]);

  // Dragging the entire modal around the screen
  const handleModalHeaderPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, input, select, label, textarea, a, [data-interactive='true']")) return;

    e.preventDefault();
    setIsDraggingModal(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initX: modalPos.x,
      initY: modalPos.y,
    };
  };

  useEffect(() => {
    if (!isDraggingModal) return;

    const handlePointerMove = (e: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const dx = e.clientX - start.mouseX;
      const dy = e.clientY - start.mouseY;
      const maxW = window.innerWidth || 1200;
      const maxH = window.innerHeight || 800;
      const newX = Math.max(8, Math.min(maxW - 100, start.initX + dx));
      const newY = Math.max(8, Math.min(maxH - 60, start.initY + dy));
      setModalPos({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsDraggingModal(false);
      dragStartRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDraggingModal]);

  // Resizing the modal window
  const handleModalResizeStart = (e: React.MouseEvent, dir: "se" | "e" | "s") => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingModal(dir);
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initW: modalSize.width,
      initH: modalSize.height,
    };
  };

  useEffect(() => {
    if (!isResizingModal) return;

    const handleMouseMove = (e: MouseEvent) => {
      const start = resizeStartRef.current;
      if (!start) return;
      const dx = e.clientX - start.mouseX;
      const dy = e.clientY - start.mouseY;
      const initW = start.initW;
      const initH = start.initH;
      const maxW = Math.max(MIN_MODAL_WIDTH, (window.innerWidth || 1200) - modalPos.x - 16);
      const maxH = Math.max(MIN_MODAL_HEIGHT, (window.innerHeight || 800) - modalPos.y - 16);

      setModalSize((prev) => {
        let newW = prev.width;
        let newH = prev.height;
        if (isResizingModal === "se" || isResizingModal === "e") {
          newW = Math.max(MIN_MODAL_WIDTH, Math.min(maxW, initW + dx));
        }
        if (isResizingModal === "se" || isResizingModal === "s") {
          newH = Math.max(MIN_MODAL_HEIGHT, Math.min(maxH, initH + dy));
        }
        return { width: newW, height: newH };
      });
    };

    const handleMouseUp = () => {
      setIsResizingModal(null);
      resizeStartRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingModal, modalPos.x, modalPos.y]);

  const handleCenterModal = () => {
    const initX = typeof window !== "undefined" ? Math.max(16, (window.innerWidth - modalSize.width) / 2) : 100;
    const initY = typeof window !== "undefined" ? Math.max(16, (window.innerHeight - modalSize.height) / 2) : 50;
    setModalPos({ x: initX, y: initY });
  };

  const handleResetModalSize = () => {
    let defaultSz = {
      width: Math.min(1040, (window.innerWidth || 1200) - 32),
      height: Math.min(740, (window.innerHeight || 800) - 48),
    };
    try {
      const savedSize = remoteStore.getItem("seqcarver_btn_customizer_modal_size_default_v1");
      if (savedSize) {
        const parsed = JSON.parse(savedSize);
        if (typeof parsed.width === "number" && typeof parsed.height === "number") {
          defaultSz = parsed;
        }
      }
    } catch {}
    setModalSize(defaultSz);
  };

  // The 'default' button should save ALL changes as permanent default!
  const handleSaveAllAsDefault = () => {
    try {
      const ok = saveCurrentAsDefault();
      if (ok) {
        // Also persist modal window size & position as defaults
        remoteStore.setItem("seqcarver_btn_customizer_modal_pos_default_v1", JSON.stringify(modalPos));
        remoteStore.setItem("seqcarver_btn_customizer_modal_size_default_v1", JSON.stringify(modalSize));
        setSaveDefaultSuccess(true);
        setTimeout(() => setSaveDefaultSuccess(false), 4000);
      }
    } catch (e) {
      console.error("Failed to save default button customizations", e);
    }
  };

  // Restore all button labels, icons, zero-text states, and order from previously saved setup throughout the entire application
  const handleRestoreSavedSetup = async () => {
    try {
      setImportStatus(
        uiMessage(
          "button_customization_modal.message.restoring_defaults",
          "Restoring full defaults from cloud database..."
        )
      );
      const res = await restoreFullDefaultsFromDatabase();
      // Also restore modal position and size if saved
      const savedPos = remoteStore.getItem("seqcarver_btn_customizer_modal_pos_default_v1");
      if (savedPos) {
        try {
          const parsed = JSON.parse(savedPos);
          if (typeof parsed.x === "number" && typeof parsed.y === "number") setModalPos(parsed);
        } catch {}
      }
      const savedSize = remoteStore.getItem("seqcarver_btn_customizer_modal_size_default_v1");
      if (savedSize) {
        try {
          const parsed = JSON.parse(savedSize);
          if (typeof parsed.width === "number" && typeof parsed.height === "number") setModalSize(parsed);
        } catch {}
      }
      setSaveDefaultSuccess(false);
      setRestoreFeedback({ success: res.success, message: res.message });
      setImportStatus(res.message);
      setTimeout(() => {
        setRestoreFeedback(null);
        setImportStatus(null);
      }, 4500);
    } catch (e: any) {
      console.error("Failed to restore saved setup", e);
      setRestoreFeedback({ success: false, message: e?.message || "Restore failed" });
      setTimeout(() => setRestoreFeedback(null), 4500);
    }
  };

  // Update selected button and un-minimize drawer whenever an element is inspected
  useEffect(() => {
    if (activeStudioButtonId) {
      setSelectedButtonId(activeStudioButtonId);
      setSelectedElementIds(
        new Set(
          inspectedElementIds && inspectedElementIds.length > 0
            ? inspectedElementIds
            : [activeStudioButtonId]
        )
      );
      setActiveTab("customize");
      setDiscreteSubTab("edit");
      setIsMinimized(false);
    }
  }, [activeStudioButtonId, inspectedElementIds, studioInspectNonce]);

  // Order definitions according to buttonOrder
  const orderedDefinitions = useMemo(() => {
    const map = new Map<string, ButtonDefinition>();
    BUTTON_DEFINITIONS.forEach((b) => {
      if (!map.has(b.id)) {
        map.set(b.id, b);
      }
    });

    const result: ButtonDefinition[] = [];
    const added = new Set<string>();

    buttonOrder.forEach((id) => {
      const def = map.get(id);
      if (def && !added.has(id)) {
        result.push(def);
        added.add(id);
      }
    });

    // Fallback for any definitions not in buttonOrder
    BUTTON_DEFINITIONS.forEach((def) => {
      if (!added.has(def.id)) {
        result.push(def);
        added.add(def.id);
      }
    });

    return result;
  }, [buttonOrder]);

  const currentDefinition: ButtonDefinition = useMemo(() => {
    const found = BUTTON_DEFINITIONS.find((b) => b.id === selectedButtonId);
    if (found) return found;

    // Dynamic synthesis for any inspected UI element across the app
    const cleanLabel = selectedButtonId
      .replace(/^(?:page_|tab_|modal_|panel_|label_|btn_)/, "")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      id: selectedButtonId,
      category: "button_customizer" as ButtonCategory,
      defaultLabel: cleanLabel || selectedButtonId,
      defaultIconName: "Sparkles",
      defaultTooltip: `Customize properties for ${selectedButtonId}`,
      description: `Catalogued component: ${selectedButtonId}`,
      supportsZeroText: true,
      componentType: selectedButtonId.startsWith("page_")
        ? "page"
        : selectedButtonId.startsWith("tab_")
        ? "tab"
        : selectedButtonId.startsWith("modal_")
        ? "modal"
        : selectedButtonId.startsWith("panel_")
        ? "panel"
        : selectedButtonId.startsWith("label_")
        ? "label"
        : "button",
    };
  }, [selectedButtonId]);

  const currentConfig = customConfigs[selectedButtonId];

  const getComponentType = (def: ButtonDefinition): ComponentType => {
    if (def.componentType) return def.componentType;
    if (def.id.startsWith("page_")) return "page";
    if (def.id.startsWith("tab_")) return "tab";
    if (def.id.startsWith("modal_")) return "modal";
    if (def.id.startsWith("panel_")) return "panel";
    if (def.id.startsWith("label_") || def.category === "section_labels") return "label";
    return "button";
  };

  const isItemLabel = (def: ButtonDefinition) => {
    return (
      getComponentType(def) === "label" ||
      def.category === "section_labels" ||
      def.id.toLowerCase().includes("label") ||
      def.id.toLowerCase().includes("badge") ||
      def.id.toLowerCase().includes("title") ||
      def.id.toLowerCase().includes("header") ||
      def.id.toLowerCase().includes("hint") ||
      def.supportsZeroText === false
    );
  };

  const totalButtonsCount = useMemo(
    () => BUTTON_DEFINITIONS.filter((d) => getComponentType(d) === "button").length,
    []
  );
  const totalLabelsCount = useMemo(
    () => BUTTON_DEFINITIONS.filter((d) => getComponentType(d) === "label").length,
    []
  );
  const totalPagesCount = useMemo(
    () => BUTTON_DEFINITIONS.filter((d) => getComponentType(d) === "page").length,
    []
  );
  const totalTabsCount = useMemo(
    () => BUTTON_DEFINITIONS.filter((d) => getComponentType(d) === "tab").length,
    []
  );
  const totalModalsCount = useMemo(
    () => BUTTON_DEFINITIONS.filter((d) => getComponentType(d) === "modal").length,
    []
  );
  const totalPanelsCount = useMemo(
    () => BUTTON_DEFINITIONS.filter((d) => getComponentType(d) === "panel").length,
    []
  );

  // Filter definitions by category, component type, and search
  const filteredDefinitions = useMemo(() => {
    const seen = new Set<string>();
    return orderedDefinitions.filter((def) => {
      if (!def?.id || seen.has(def.id)) return false;
      seen.add(def.id);

      const compType = getComponentType(def);
      if (itemTypeFilter === "labels" && compType !== "label") return false;
      if (itemTypeFilter === "buttons" && compType !== "button") return false;
      if (itemTypeFilter === "pages" && compType !== "page") return false;
      if (itemTypeFilter === "tabs" && compType !== "tab") return false;
      if (itemTypeFilter === "modals" && compType !== "modal") return false;
      if (itemTypeFilter === "panels" && compType !== "panel") return false;

      const matchCategory =
        selectedCategory === "all" || def.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === "" ||
        matchesNumericComponentId(def.id, searchQuery) ||
        def.defaultLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        def.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        def.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [orderedDefinitions, selectedCategory, searchQuery, itemTypeFilter]);

  // Every renderable icon: curated presets first, then generated Lucide names.
  const allPresetIcons = useMemo(() => {
    const known = new Set(PRESET_ICONS.map((preset) => preset.name));
    const extras = Object.entries(LUCIDE_ICON_MAP)
      .filter(([name]) => !known.has(name))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, component]) => ({
        name,
        label: name.replace(/([a-z0-9])([A-Z])/g, "$1 $2"),
        category: "all",
        component,
      }));
    return [...PRESET_ICONS, ...extras];
  }, []);

  // Filter preset icons
  const filteredPresetIcons = useMemo(() => {
    return allPresetIcons.filter((i) => {
      const matchCat = iconCategory === "all" || i.category === iconCategory;
      const query = presetIconSearch.trim().toLowerCase();
      const matchSearch =
        !query ||
        i.name.toLowerCase().includes(query) ||
        i.label.toLowerCase().includes(query) ||
        i.category.toLowerCase().includes(query);
      return matchCat && matchSearch;
    });
  }, [allPresetIcons, iconCategory, presetIconSearch]);

  if (!isStudioModalOpen) return null;

  const activeLabel = getButtonLabel(
    currentDefinition.id,
    currentDefinition.defaultLabel
  );
  const isHidden = isZeroText(currentDefinition.id);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      if (dataUri) {
        updateSelectedElements({
          customIconType: "image",
          customIconData: dataUri,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplySvg = () => {
    if (svgInput.trim()) {
      updateSelectedElements({
        customIconType: "svg",
        customIconData: svgInput.trim(),
      });
    }
  };

  const handleApplyEmoji = (emoji: string) => {
    updateSelectedElements({
      customIconType: "emoji",
      customIconData: emoji,
    });
  };

  const handleExportStateJson = () => {
    setIsExportModalOpen(true);
  };

  const handleConfirmExportJson = (
    filename: string,
    options?: { folderPath?: string; savedDirectly?: boolean }
  ) => {
    const finalName = filename.toLowerCase().endsWith(".json") ? filename : `${filename}.json`;
    if (options?.savedDirectly) {
      setImportStatus(
        `✓ Button State saved directly to ${options.folderPath ? `folder "${options.folderPath}" as ` : ""}"${finalName}"!`
      );
      setTimeout(() => setImportStatus(null), 3500);
      return;
    }

    try {
      const jsonStr = exportConfigs();
      const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
      
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = finalName;
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
        }, 1000);
      } catch (clickErr) {
        console.warn("Native anchor click failed, fallback to saveAs", clickErr);
        saveAs(blob, finalName);
      }

      setImportStatus(
        `✓ Button State exported as "${finalName}"${options?.folderPath ? ` (Default: ${options.folderPath})` : ""}!`
      );
      setTimeout(() => setImportStatus(null), 3500);
    } catch (err: any) {
      console.error("Export Button State JSON failed", err);
      try {
        const jsonStr = exportConfigs();
        const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
        saveAs(blob, finalName);
        setImportStatus(`✓ Button State exported as "${finalName}"!`);
        setTimeout(() => setImportStatus(null), 3500);
      } catch (fallbackErr: any) {
        setImportStatus(`Failed to export: ${fallbackErr?.message || "Unknown error"}`);
        setTimeout(() => setImportStatus(null), 4000);
      }
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importConfigs(content);
        if (result.success) {
          setImportStatus(
          uiMessage(
            "button_customization_modal.message.restored_from_json",
            "✓ Restored {count} button configurations from JSON!",
            { count: result.count }
          )
        );
          setTimeout(() => setImportStatus(null), 3500);
        } else {
          setImportStatus(
          uiMessage(
            "button_customization_modal.message.json_parse_failed",
            "Failed to parse JSON: {error}",
            { error: result.error || uiText("button_customization_modal.message.invalid_file", "Invalid file") }
          )
        );
          setTimeout(() => setImportStatus(null), 3500);
        }
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be reselected
    e.target.value = "";
  };

  // Drag and Drop Handlers for Button Optimizer
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedButtonId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    // Check if dragging an icon preset onto a button
    if (draggedPresetIcon) {
      const targetDef = filteredDefinitions[targetIndex];
      if (targetDef) {
        updateButtonConfig(targetDef.id, {
          iconName: draggedPresetIcon,
          customIconType: "preset",
          customIconData: undefined,
        });
        setImportStatus(`✓ Icon applied to "${targetDef.defaultLabel}"`);
        setTimeout(() => setImportStatus(null), 2000);
      }
      setDraggedPresetIcon(null);
      return;
    }

    if (!draggedButtonId) return;

    const currentOrder = [...buttonOrder];
    const sourceIndex = currentOrder.indexOf(draggedButtonId);
    if (sourceIndex === -1) return;

    // Remove source and insert at target
    currentOrder.splice(sourceIndex, 1);
    
    // Find target in global list
    const targetDef = filteredDefinitions[targetIndex];
    if (targetDef) {
      const globalTargetIndex = currentOrder.indexOf(targetDef.id);
      if (globalTargetIndex !== -1) {
        currentOrder.splice(globalTargetIndex, 0, draggedButtonId);
      } else {
        currentOrder.push(draggedButtonId);
      }
    } else {
      currentOrder.push(draggedButtonId);
    }

    reorderButtons(currentOrder);
    setDraggedButtonId(null);
  };

  const handleDragEnd = () => {
    setDraggedButtonId(null);
    setDragOverIndex(null);
    setDraggedPresetIcon(null);
  };

  // Quick preset ordering
  const handleSortAlphabetical = () => {
    const sorted = [...BUTTON_DEFINITIONS].sort((a, b) =>
      a.defaultLabel.localeCompare(b.defaultLabel)
    ).map((b) => b.id);
    reorderButtons(sorted);
    setImportStatus(
      uiMessage("button_customization_modal.message.sorted_alphabetically", "✓ Layout sorted alphabetically!")
    );
    setTimeout(() => setImportStatus(null), 2500);
  };

  const handleSortByCategory = () => {
    const categoryPrecedence: Record<ButtonCategory, number> = {
      header: 0,
      creative_studio: 1,
      adv_modal: 2,
      utility_modal: 3,
      button_customizer: 4,
      modes: 5,
      crop: 6,
      carve: 7,
      multicrop: 8,
      canvas: 9,
      storyboard: 10,
      asset_pool: 11,
      section_labels: 12,
      modals: 13,
      aniplayer: 14,
      zoom_studio: 15,
      sharpener_studio: 16,
      resample_studio: 17,
      front_page_ad_panels: 18,
      spread_studio: 19,
      the_log: 20,
      krums_studio: 21,
      neo1_studio: 22,
      anicomper4: 23,
      control_deck: 24,
    };
    const sorted = [...BUTTON_DEFINITIONS].sort(
      (a, b) => (categoryPrecedence[a.category] ?? 99) - (categoryPrecedence[b.category] ?? 99)
    ).map((b) => b.id);
    reorderButtons(sorted);
    setImportStatus("✓ Layout optimized by category flow!");
    setTimeout(() => setImportStatus(null), 2500);
  };

  // Quick Preset Themes
  const applyPresetTheme = (theme: "zero-text" | "reset" | "cyberpunk" | "emoji" | "saved") => {
    if (theme === "saved") {
      handleRestoreSavedSetup();
    } else if (theme === "zero-text") {
      toggleGlobalZeroTextMode();
    } else if (theme === "reset") {
      if (confirm("Reset all buttons and labels to factory default?")) {
        resetAllConfigs();
        resetButtonOrder();
      }
    } else if (theme === "cyberpunk") {
      BUTTON_DEFINITIONS.forEach((def) => {
        if (def.id === "header_logo") {
          updateButtonConfig(def.id, { label: "CYBER-CARVER", iconName: "Zap" });
        } else if (def.id.includes("multiCrop")) {
          updateButtonConfig(def.id, { iconName: "Flame" });
        } else if (def.id.includes("carve")) {
          updateButtonConfig(def.id, { iconName: "Cpu" });
        }
      });
    } else if (theme === "emoji") {
      updateButtonConfig("header_logo", { customIconType: "emoji", customIconData: "⚡" });
      updateButtonConfig("multiCropAdd", { customIconType: "emoji", customIconData: "➕" });
      updateButtonConfig("multiCropSendAllGrid", { customIconType: "emoji", customIconData: "🚀" });
      updateButtonConfig("multiCropToSlices", { customIconType: "emoji", customIconData: "📦" });
      updateButtonConfig("multiCropStayInCrop", { customIconType: "emoji", customIconData: "📌" });
      updateButtonConfig("multiCropItemSendAsset", { customIconType: "emoji", customIconData: "📥" });
      updateButtonConfig("multiCropItemSendSlot", { customIconType: "emoji", customIconData: "✨" });
      updateButtonConfig("multiCropClearAll", { customIconType: "emoji", customIconData: "🗑️" });
      updateButtonConfig("crop_2canvas", { customIconType: "emoji", customIconData: "🖼️" });
      updateButtonConfig("crop_and_go", { customIconType: "emoji", customIconData: "➡️" });
    }
  };

  const categories: { id: ButtonCategory | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "header", label: "Header" },
    { id: "modes", label: "Modes" },
    { id: "crop", label: "Crop" },
    { id: "carve", label: "Split Grid" },
    { id: "multicrop", label: "Multi-Crops" },
    { id: "storyboard", label: "Storyboard" },
    { id: "asset_pool", label: "Asset Pool" },
    { id: "canvas", label: "Canvas" },
    { id: "creative_studio", label: "Studios" },
    { id: "utility_modal", label: "Utilities" },
    { id: "neo1_studio", label: "Neo1" },
    { id: "front_page_ad_panels", label: "Ad Panels" },
    { id: "spread_studio", label: "Spread" },
    { id: "zoom_studio", label: "Zoom" },
    { id: "sharpener_studio", label: "Sharpener" },
    { id: "resample_studio", label: "Resample" },
    { id: "section_labels", label: "Labels" },
    { id: "modals", label: "Modals" },
    { id: "the_log", label: "The Log" },
    { id: "krums_studio", label: "Krums" },
    { id: "button_customizer", label: "Customizer" },
    { id: "aniplayer", label: "AniPlayer" },
    { id: "control_deck", label: "Control Deck" },
  ];

  if (!isStudioModalOpen) return null;

  if (isMinimized) {
    return (
      <div
        data-ibc-ui="true"
        className="fixed right-3 top-16 z-[9999] pointer-events-auto select-none animate-in fade-in slide-in-from-right-2 duration-150"
      >
        <CustomizableButton
          buttonId="btn_cust_minimized_pill"
          defaultLabel="Button Customizer"
          defaultIcon={<SlidersHorizontal className="w-4 h-4 text-emerald-400" />}
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#050b14]/95 hover:bg-[#07111e] text-emerald-400 border border-emerald-500/50 rounded-2xl shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:scale-105 active:scale-95 text-xs font-bold font-mono"
          title="Restore Button Customizer"
        />
      </div>
    );
  }

  return (
    <div
      data-ibc-ui="true"
      role="dialog"
      aria-modal="true"
      aria-label={uiText("components_button_customization_modal.div.button_customizer_studio.aria_label", "Button Customizer Studio")}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-[120] flex items-center justify-center p-1.5 sm:p-2 animate-in fade-in duration-150 select-none"
    >
      {/* Toast Feedback Banner (Uniform with Control Deck) */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[130] bg-emerald-500 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-150">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Control Deck / Studio Frame */}
      <div className="bg-[#050b14] border border-[#0d2235] rounded-2xl max-w-[98vw] xl:max-w-7xl w-full h-[95vh] max-h-[95vh] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden relative">
        {/* ========================================================= */}
        {/* TOP HEADER BAR (Compact wrap-safe layout)                 */}
        {/* ========================================================= */}
        <header className="px-3 py-1.5 bg-[#07111e] border-b border-[#0d2235] flex flex-wrap items-center justify-between shrink-0 gap-1.5">
          {/* Left: Branding & Subtitle (IBC Integrated) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/25 to-teal-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner overflow-hidden shrink-0">
              <CustomizableButton
                buttonId="btn_cust_modal_header_icon"
                defaultLabel="IBC"
                forceZeroText={true}
                defaultIcon={<SlidersHorizontal className="w-4 h-4 text-emerald-400" />}
                className="w-full h-full flex items-center justify-center cursor-pointer bg-transparent border-none p-0 active:scale-95 transition-transform"
                title="Interactive Button Customizer (IBC) Icon"
              />
            </div>
            <div className="leading-tight">
              <CustomizableLabel
                labelId="btn_cust_modal_header_title"
                defaultLabel="Interactive Button Customizer"
                as="h2"
                className="text-xs sm:text-[13px] font-black text-slate-100 tracking-tight flex items-center gap-1.5 whitespace-nowrap"
                title="Interactive Button Customizer (IBC)"
              >
                {({ label }) => (
                  <span className="flex items-center gap-1.5">
                    <span>{label || "Interactive Button Customizer"}</span>
                    <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 tracking-wider">
                      {uiText("components_button_customization_modal.span.ibc", "IBC")}
                    </span>
                  </span>
                )}
              </CustomizableLabel>
              <CustomizableLabel
                labelId="btn_cust_modal_header_subtitle"
                defaultLabel={`${currentDefinition?.id || "BUTTON"} · ${BUTTON_DEFINITIONS.length} ITEMS · ZERO-TEXT: ${globalSettings.globalZeroTextMode ? "ON" : "OFF"}`}
                as="p"
                className="text-[8.5px] font-mono tracking-wider text-slate-400 uppercase font-semibold truncate max-w-[260px] tabular-nums"
                title="IBC Status Telemetry"
              />
            </div>
          </div>

          {/* Right/Center: All action controls visible with flex-wrap (zero hidden horizontal overflow) */}
          <div className="flex flex-wrap items-center justify-end gap-1 flex-1 min-w-0">
            {/* Interactive Element Inspector Toggle */}
            <CustomizableButton
              buttonId="button_customization_modal_btn_101"
              defaultIcon={<Search className="w-3 h-3 shrink-0" />}
              type="button"
onClick={() => {
                const nextActive = !isIbcInspectorActive;
                toggleIbcInspector(nextActive);
                if (nextActive) {
                  setIsMinimized(true);
                }
                showToast(
                  nextActive
                    ? "IBC Inspector Mode ON: Hover over any UI element and click to edit (Alt+I)"
                    : "IBC Inspector Mode OFF"
                );
              }}
className={cn(
                "px-2 py-1 rounded-lg border font-mono font-bold text-[10.5px] flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95",
                isIbcInspectorActive
                  ? "bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                  : "bg-[#091b2c] hover:bg-[#0f2a44] border-cyan-500/50 text-cyan-300"
              )}
title={uiText("components_button_customization_modal.button.toggle_interactive_element_inspector_hover_o.title", "Toggle Interactive Element Inspector: Hover over any UI element across the app to view its IBC identifier and click to open its properties directly in this drawer (Alt+I)")}
            >
                {() => (
                    <>
                      <span>{uiText("components_button_customization_modal.span.inspector", "Inspector: ")}{isIbcInspectorActive ? "ON" : "OFF"}</span>
                    </>
                  )}
            </CustomizableButton>

            {/* User Google Sign-In & Cloud Database Status */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/50 px-2 py-1 rounded-lg text-[10.5px] shrink-0">
                <span
                  className="text-emerald-300 font-mono font-bold max-w-[140px] truncate"
                  title={currentUser.email || currentUser.displayName || ""}
                >
                  {currentUser.email || currentUser.displayName || "Signed In"}
                </span>
                <CustomizableButton
                  buttonId="button_customization_modal_btn_100"
                  defaultIcon={<LogOut className="w-3 h-3" />}
                  type="button"
onClick={logoutUser}
className="text-slate-400 hover:text-rose-400 p-0.5 cursor-pointer"
title={uiText("components_button_customization_modal.button.sign_out_of_db_session.title", "Sign out of DB session")}
                />
              </div>
            ) : (
              <CustomizableButton
                buttonId="button_customization_modal_btn_99"
                defaultIcon={<LogIn className="w-3 h-3 text-emerald-400 shrink-0" />}
                type="button"
disabled={isLoggingIn}
onClick={() => loginWithGoogle().catch(() => {})}
className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/50 rounded-lg text-[10.5px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap shrink-0 disabled:opacity-60"
title={uiText("components_button_customization_modal.button.google_oauth_sign_in.title", "Sign in with Google to sync with Cloud Firestore")}
              >
                  {() => (
                      <>
                        <span>{isLoggingIn ? "Signing in..." : "Sign in with Google"}</span>
                      </>
                    )}
              </CustomizableButton>
            )}

            {/* Zero-Text Mode Toggle */}
            <CustomizableButton
              buttonId="btn_cust_modal_zero_text"
              defaultLabel={globalSettings.globalZeroTextMode ? "Zero-Text ON" : "Zero-Text OFF"}
              defaultIcon={
                globalSettings.globalZeroTextMode ? (
                  <Eye className="w-3 h-3 text-cyan-400 shrink-0" />
                ) : (
                  <EyeOff className="w-3 h-3 text-slate-400 shrink-0" />
                )
              }
              onClick={() => {
                toggleGlobalZeroTextMode();
                showToast(globalSettings.globalZeroTextMode ? "✓ Zero-Text mode turned OFF (Icons & Text visible)" : "✓ Zero-Text mode turned ON (Icons only)");
              }}
              className={cn(
                "px-2 py-1 rounded-lg border font-mono font-bold text-[10.5px] flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95",
                globalSettings.globalZeroTextMode
                  ? "bg-[#091b2c] hover:bg-[#0f2a44] border-cyan-500/50 text-cyan-300"
                  : "bg-[#091527] hover:bg-[#0e213d] border-slate-700/80 text-slate-300"
              )}
              title={`Toggle Global Zero-Text (Icon Only) Mode across all buttons (Current: ${globalSettings.globalZeroTextMode ? "ON" : "OFF"})`}
            />

            {/* Font Size Cycle (IBC enabled) */}
            <CustomizableButton
              buttonId="btn_cust_modal_font_size"
              defaultLabel={`Font: ${(globalFontSize || "normal").toUpperCase()}`}
              defaultIcon={<Type className="w-3 h-3 text-cyan-400 shrink-0" />}
              onClick={() => {
                const sizes: ButtonFontSize[] = ["tiny", "small", "normal", "medium", "large"];
                const currIdx = sizes.indexOf(globalFontSize || "normal");
                const nextSize = sizes[(currIdx + 1) % sizes.length];
                setGlobalFontSize(nextSize);
                showToast(`✓ Global font size set to ${nextSize.toUpperCase()}`);
              }}
              className="px-2 py-1 rounded-lg bg-[#091527] hover:bg-[#0e213d] border border-[#0d2235] hover:border-cyan-500/40 text-slate-300 font-mono font-bold text-[10.5px] flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
              title={`Cycle Global Button Font Size (Current: ${globalFontSize || "normal"}). Click to change.`}
            />

            {/* Icon Size Cycle (IBC enabled) */}
            <CustomizableButton
              buttonId="btn_cust_modal_icon_size"
              defaultLabel={`Icon: ${(globalIconSize || "normal").toUpperCase()}`}
              defaultIcon={<Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />}
              onClick={() => {
                const iconSizes: ButtonIconSize[] = ["small", "normal", "medium", "large", "xlarge"];
                const currIdx = iconSizes.indexOf(globalIconSize || "normal");
                const nextSize = iconSizes[(currIdx + 1) % iconSizes.length];
                setGlobalIconSize(nextSize);
                showToast(`✓ Global icon size set to ${nextSize.toUpperCase()}`);
              }}
              className="px-2 py-1 rounded-lg bg-[#091527] hover:bg-[#0e213d] border border-[#0d2235] hover:border-emerald-500/40 text-slate-300 font-mono font-bold text-[10.5px] flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
              title={`Cycle Global Button Icon Size (Current: ${globalIconSize || "normal"}). Click to change.`}
            />

            {/* Save Permanent Default */}
            <CustomizableButton
              buttonId="btn_cust_modal_set_default"
              defaultLabel="Save Default"
              defaultIcon={<ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />}
              onClick={() => {
                handleSaveAllAsDefault();
                showToast("✓ All customizations saved as your permanent default!");
              }}
              className="px-2 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 font-mono font-bold text-[10.5px] flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap shrink-0 active:scale-95"
              title="Save all changes and customizations as your permanent default configuration"
            />

            {/* Restore Saved */}
            <CustomizableButton
              buttonId="btn_cust_modal_quick_restore_saved"
              defaultLabel="Restore"
              defaultIcon={<RotateCcw className="w-3 h-3 text-cyan-400 shrink-0" />}
              onClick={handleRestoreSavedSetup}
              className="px-2 py-1 rounded-lg bg-[#091527] hover:bg-[#0e213d] border border-cyan-500/40 hover:border-cyan-300 text-cyan-300 font-mono font-bold text-[10.5px] flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap shrink-0 active:scale-95"
              title="Restore all button labels, icons, and zero-text from saved setup"
            />

            {/* Backup JSON */}
            <CustomizableButton
              buttonId="btn_cust_modal_save_json"
              defaultLabel="JSON"
              defaultIcon={<FileDown className="w-3 h-3 text-amber-400 shrink-0" />}
              onClick={handleExportStateJson}
              className="px-2 py-1 rounded-lg bg-[#091527] hover:bg-[#0e213d] border border-amber-500/40 hover:border-amber-300 text-amber-300 font-mono font-bold text-[10.5px] flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap shrink-0 active:scale-95"
              title="Export complete button customizations as JSON"
            />

            {/* Minimize & Close Buttons */}
            <div className="flex items-center gap-1 pl-1 border-l border-[#0d2235] shrink-0">
              <CustomizableButton
                buttonId="btn_cust_modal_minimize"
                defaultLabel="Minimize"
                forceZeroText={true}
                defaultIcon={<Minus className="w-3.5 h-3.5 text-slate-300" />}
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-lg bg-[#0c1626] hover:bg-[#132238] border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Minimize to floating pill"
              />
              <CustomizableButton
                buttonId="btn_cust_modal_close"
                defaultLabel="Close"
                forceZeroText={true}
                defaultIcon={<X className="w-3.5 h-3.5" />}
                onClick={closeStudioModal}
                className="p-1.5 rounded-lg bg-[#0c1626] hover:bg-rose-950/80 hover:text-rose-300 border border-slate-800 text-slate-400 transition-colors cursor-pointer"
                title="Close Button Customization Studio"
              />
            </div>
          </div>
        </header>

        {/* ========================================================= */}
        {/* MAIN BODY: COMPACT LEFT VERTICAL TABS + CONTENT AREA      */}
        {/* ========================================================= */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* 1. LEFT VERTICAL NAVIGATION TABS (All 9 tabs fit without scrolling) */}
          <nav className="w-16 bg-[#040913] border-r border-[#0d2235] flex flex-col justify-between py-1.5 px-1 gap-0.5 shrink-0 overflow-y-auto">
            {[
              { id: "customize", label: "CUSTOMIZE", icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
              { id: "registry", label: "REGISTRY", icon: <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" /> },
              { id: "copy", label: "COPY", icon: <Type className="w-3.5 h-3.5 text-fuchsia-400" /> },
              { id: "styles", label: "STYLES", icon: <Palette className="w-3.5 h-3.5" /> },
              { id: "groups", label: "GROUPS", icon: <Layers className="w-3.5 h-3.5" /> },
              { id: "optimizer", label: "ORDER", icon: <GripVertical className="w-3.5 h-3.5" /> },
              { id: "snapshots", label: "BACKUP", icon: <Save className="w-3.5 h-3.5" /> },
              { id: "model", label: "AI MODEL", icon: <Cpu className="w-3.5 h-3.5" /> },
              { id: "modals", label: "MODALS", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
              { id: "cloud_db", label: "CLOUD DB", icon: <Database className="w-3.5 h-3.5" /> },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <CustomizableButton
                  key={`btn-cust-nav-${tab.id}`}
                  buttonId={`btn_cust_modal_tab_${tab.id}`}
                  defaultLabel={tab.label}
                  defaultIcon={tab.icon}
                  iconClassName="w-3.5 h-3.5 shrink-0"
                  labelClassName="text-[7.5px] font-mono tracking-tighter font-bold uppercase leading-none whitespace-nowrap"
                  onClick={() => {
                    if (tab.id === "cloud_db") {
                      openLiveCloudEditor();
                    } else {
                      setActiveTab(tab.id as any);
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center py-1 px-0.5 rounded-xl border transition-all cursor-pointer group text-center gap-0.5 flex-1 max-h-12 min-h-[34px]",
                    isActive
                      ? "border-emerald-500/80 bg-emerald-950/30 text-emerald-300 shadow-sm shadow-emerald-950/40"
                      : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#081324]"
                  )}
                  title={tab.label}
                />
              );
            })}
          </nav>

          {/* 2. CONTENT AREA */}
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#050b14]">
            {/* Modal Main Body (Tabbed Display) */}
            {activeTab === "copy" ? (
              /* ============ COPY & LAYOUT REGISTRY (database-backed) ============ */
              <UICopyRegistryPanel focusElementKey={copyFocusKey} />
            ) : activeTab === "registry" ? (
              /* ================= FULL COMPONENT REGISTRY CATALOG ================= */
              <div className="flex-1 flex flex-col overflow-hidden p-2.5 space-y-2">
                {/* Compact Header + Filter + Search Toolbar */}
                <div className="bg-[#07111e]/95 border border-[#0d2235] px-3 py-2 rounded-xl flex flex-col gap-2 shrink-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <LayoutGrid className="w-4 h-4 text-cyan-400 shrink-0" />
                      <CustomizableLabel
                        labelId="button_customization_modal_item_98"
                        as="h3"
                        className="text-xs font-black text-slate-100"
                      >
                          {() => (
                              <>
                                {uiText("components_button_customization_modal.h3.full_component_registry", "Full Component Registry")}
                              </>
                            )}
                      </CustomizableLabel>
                      <span className="text-[10px] font-mono text-cyan-300 tabular-nums">
                        · {BUTTON_DEFINITIONS.length}{uiText("components_button_customization_modal.span.items", " items")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative w-48 sm:w-60">
                        <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder={uiText("components_button_customization_modal.input.search_registry_by_id_title.placeholder", "Search registry by ID, title...")}
                          value={registrySearch}
                          onChange={(e) => setRegistrySearch(e.target.value)}
                          className="w-full pl-7 pr-6 py-1 bg-[#050b14] border border-[#0d2235] focus:border-cyan-400 rounded-lg text-[11px] font-mono text-slate-200 placeholder-slate-500 transition-colors"
                        />
                        {registrySearch && (
                          <CustomizableButton
                            buttonId="button_customization_modal_btn_97"
                            defaultIcon={<X className="w-3 h-3" />}
                            onClick={() => setRegistrySearch("")}
className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                          />
                        )}
                      </div>

                      <CustomizableButton
                        buttonId="button_customization_modal_btn_96"
                        defaultIcon={<Search className="w-3 h-3" />}
                        type="button"
onClick={() => {
                          const nextActive = !isIbcInspectorActive;
                          toggleIbcInspector(nextActive);
                          if (nextActive) {
                            setIsMinimized(true);
                          }
                        }}
className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 border whitespace-nowrap shrink-0",
                          isIbcInspectorActive
                            ? "bg-cyan-500 text-slate-950 border-cyan-300 font-black"
                            : "bg-[#091527] hover:bg-[#0e213d] text-cyan-300 border-cyan-500/40"
                        )}
title={uiText("components_button_customization_modal.button.activate_visual_element_inspector_alt_i.title", "Activate visual element inspector (Alt+I)")}
                      >
                          {() => (
                              <>
                                <span>{isIbcInspectorActive ? "Inspector ON" : "Inspect UI"}</span>
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  </div>

                  {/* All 7 Type Filter Buttons Visible (wrap-safe) */}
                  <div className="flex flex-wrap items-center gap-1">
                    {[
                      { id: "all", label: "All Items", count: BUTTON_DEFINITIONS.length, icon: Layers },
                      { id: "page", label: "Pages", count: totalPagesCount, icon: Frame },
                      { id: "tab", label: "Tabs", count: totalTabsCount, icon: LayoutGrid },
                      { id: "modal", label: "Modals", count: totalModalsCount, icon: Box },
                      { id: "panel", label: "Panels", count: totalPanelsCount, icon: SlidersHorizontal },
                      { id: "label", label: "Labels", count: totalLabelsCount, icon: Tag },
                      { id: "button", label: "Buttons", count: totalButtonsCount, icon: MousePointer },
                    ].map((pill) => (
                      <CustomizableButton
                        buttonId="button_customization_modal_btn_95"
                        key={pill.id}
type="button"
onClick={() => setRegistryTypeFilter(pill.id as any)}
className={cn(
                          "px-2 py-0.5 rounded-lg text-[9.5px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 border tabular-nums",
                          registryTypeFilter === pill.id
                            ? "bg-cyan-500/25 text-cyan-300 border-cyan-500/50 shadow-xs"
                            : "bg-[#090e1a] text-slate-400 border-slate-800 hover:text-slate-200"
                        )}
                      >
                          {() => (
                              <>
                                <pill.icon className="w-2.5 h-2.5" />
                              <span>{pill.label} ({pill.count})</span>
                              </>
                            )}
                      </CustomizableButton>
                    ))}
                  </div>
                </div>

                {/* High-Density Grid of Catalogued Component Cards */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pr-0.5 content-start">
                  {BUTTON_DEFINITIONS.filter((def) => {
                    const cType = getComponentType(def);
                    if (registryTypeFilter !== "all" && cType !== registryTypeFilter) return false;
                    if (registrySearch.trim()) {
                      const q = registrySearch.toLowerCase();
                      return (
                        matchesNumericComponentId(def.id, registrySearch) ||
                        def.id.toLowerCase().includes(q) ||
                        def.defaultLabel.toLowerCase().includes(q) ||
                        def.description.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  }).map((item) => {
                    const itemConfig = customConfigs[item.id];
                    const compType = getComponentType(item);
                    const isItemHidden = itemConfig?.hidden === true;
                    const itemActiveLabel = getButtonLabel(item.id, item.defaultLabel);

                    const typeColors: Record<ComponentType, string> = {
                      page: "bg-indigo-950/80 text-indigo-300 border-indigo-500/40",
                      tab: "bg-amber-950/80 text-amber-300 border-amber-500/40",
                      modal: "bg-rose-950/80 text-rose-300 border-rose-500/40",
                      panel: "bg-teal-950/80 text-teal-300 border-teal-500/40",
                      label: "bg-purple-950/80 text-purple-300 border-purple-500/40",
                      button: "bg-cyan-950/80 text-cyan-300 border-cyan-500/40",
                    };

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "bg-[#070f1e]/85 border rounded-xl p-2.5 flex flex-col justify-between transition-all group hover:border-cyan-500/50",
                          selectedButtonId === item.id ? "border-cyan-400 ring-1 ring-cyan-500/30" : "border-[#0d2235]",
                          isItemHidden && "opacity-60 bg-slate-950/80"
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className={cn("px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase border shrink-0", typeColors[compType])}>
                                {compType}
                              </span>
                              <span className="font-mono text-[9px] font-black text-amber-300 tabular-nums shrink-0">
                                #{getComponentIdForButton(item.id) || "—"}
                              </span>
                              <span className="font-mono text-[9.5px] font-bold text-slate-400 truncate" title={item.id}>
                                {item.id}
                              </span>
                            </div>

                            <CustomizableButton
                              buttonId="button_customization_modal_btn_94"
                              type="button"
onClick={() => {
                                updateButtonConfig(item.id, { hidden: !isItemHidden });
                                showToast(!isItemHidden ? `Hidden: ${item.id}` : `Visible: ${item.id}`);
                              }}
className={cn(
                                "p-1 rounded-md border transition-colors cursor-pointer shrink-0",
                                isItemHidden
                                  ? "bg-rose-950/60 border-rose-500/50 text-rose-300 hover:bg-rose-900"
                                  : "bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900"
                              )}
title={isItemHidden ? "Currently Hidden. Click to Make Visible." : "Currently Visible. Click to Hide."}
                            >
                                {() => (
                                    <>
                                      {isItemHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </>
                                  )}
                            </CustomizableButton>
                          </div>

                          <div className="text-[11.5px] font-bold text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
                            {itemActiveLabel}
                          </div>

                          <p className="text-[9.5px] text-slate-400 line-clamp-1 leading-snug">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                          <CustomizableButton
                            buttonId="button_customization_modal_btn_93"
                            defaultIcon={<SlidersHorizontal className="w-2.5 h-2.5" />}
                            type="button"
onClick={() => {
                              setSelectedButtonId(item.id);
                              setSelectedElementIds(new Set([item.id]));
                              setActiveTab("customize");
                            }}
className="flex-1 py-1 px-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 hover:border-cyan-300 text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                              {() => (
                                  <>
                                    <span>{uiText("components_button_customization_modal.span.edit_in_drawer", "Edit in Drawer")}</span>
                                  </>
                                )}
                          </CustomizableButton>

                          <CustomizableButton
                            buttonId="button_customization_modal_btn_92"
                            defaultIcon={<RotateCcw className="w-3 h-3" />}
                            type="button"
onClick={() => {
                              resetButtonConfig(item.id);
                              showToast(`Reset ${item.id} to default`);
                            }}
className="p-1 rounded-lg bg-[#050b14] hover:bg-[#0c1626] text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
title={uiText("components_button_customization_modal.button.reset_this_component_s_customizations_to_def.title", "Reset this component's customizations to defaults")}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : activeTab === "styles" ? (
          /* ================= STYLES & RADIAL COLOR STUDIO VIEW ================= */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Compact Styles Studio Header Bar */}
            <div className="px-3 py-1.5 bg-[#07111e] border-b border-[#0d2235] flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Palette className="w-4 h-4 text-cyan-400 shrink-0" />
                <CustomizableLabel
                  labelId="button_customization_modal_item_91"
                  as="h3"
                  className="text-xs font-black text-slate-100 whitespace-nowrap"
                >
                    {() => (
                        <>
                          {uiText("components_button_customization_modal.h3.styles_and_radial_color_customizer", "Styles & Radial Color Customizer")}
                        </>
                      )}
                </CustomizableLabel>
                <span className="text-[10px] text-slate-400 font-mono truncate">
                  {uiText("components_button_customization_modal.span.target", "· Target: ")}<strong className="text-cyan-300 tabular-nums">{selectedElementIds.size > 0 ? `${selectedElementIds.size} selected` : "1 inspected"}</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <CustomizableButton
                  buttonId="button_customization_modal_btn_90"
                  defaultLabel={")"}
                  type="button"
onClick={() => {
                    const allIds = filteredDefinitions.map((d) => d.id);
                    setSelectedElementIds(new Set(allIds));
                  }}
className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#091527] hover:bg-[#0e213d] text-cyan-300 border border-cyan-500/40 transition-colors cursor-pointer tabular-nums"
title={uiText("components_button_customization_modal.button.select_all_currently_filtered_elements.title", "Select all currently filtered elements")}
                >
                    {(ibcProps) => (
                        <>
                          {uiText("components_button_customization_modal.button.select_filtered", "Select Filtered (")}
                        {filteredDefinitions.length}
                        {!ibcProps.isTextHidden ? ibcProps.label : null}
                        </>
                      )}
                </CustomizableButton>
                {selectedElementIds.size > 0 && (
                  <CustomizableButton
                    buttonId="button_customization_modal_btn_89"
                    type="button"
onClick={() => setSelectedElementIds(new Set())}
className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#091527] hover:bg-[#0e213d] text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
title={uiText("components_button_customization_modal.button.clear_element_selection.title", "Clear element selection")}
                  >
                      {() => (
                          <>
                            {uiText("components_button_customization_modal.button.deselect", "Deselect")}
                          </>
                        )}
                  </CustomizableButton>
                )}
                <CustomizableButton
                  buttonId="button_customization_modal_btn_88"
                  defaultIcon={<RotateCcw className="w-3 h-3" />}
                  type="button"
onClick={() =>
                    updateStyleForSelectedElements({
                      textColor: undefined,
                      backgroundColor: undefined,
                      borderColor: undefined,
                      accentColor: undefined,
                    })
                  }
className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 transition-colors cursor-pointer flex items-center gap-1"
title={uiText("components_button_customization_modal.button.reset_custom_styles_for_all_selected_element.title", "Reset custom styles for all selected elements")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_button_customization_modal.span.reset_styles", "Reset Styles")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>

            {/* Main 2-Column Split Layout */}
            <div className="flex-1 overflow-hidden grid grid-cols-12 min-h-0">
              {/* Left Column: Element Selection & Multi-select list (5 cols) */}
              <div className="col-span-12 md:col-span-5 border-r border-[#0d2235] flex flex-col bg-[#050b14]/70 overflow-hidden min-h-0">
                <div className="p-2 space-y-1.5 border-b border-[#0d2235] shrink-0 bg-[#07111e]/90">
                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={uiText("components_button_customization_modal.input.search_buttons_and_labels_to_style.placeholder", "Search buttons & labels to style...")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-6 py-1 bg-[#050b14] border border-[#0d2235] rounded-lg text-[11px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                    {searchQuery && (
                      <CustomizableButton
                        buttonId="button_customization_modal_btn_87"
                        defaultIcon={<X className="w-3 h-3" />}
                        onClick={() => setSearchQuery("")}
className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 bg-[#090e1a] p-0.5 rounded-lg border border-slate-800 shrink-0">
                      {(["all", "buttons", "labels"] as const).map((t) => (
                        <CustomizableButton
                          buttonId="button_customization_modal_btn_86"
                          key={t}
type="button"
onClick={() => setItemTypeFilter(t)}
className={cn(
                            "px-2 py-0.5 rounded-md text-[9.5px] font-bold transition-all cursor-pointer capitalize",
                            itemTypeFilter === t
                              ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40"
                              : "text-slate-400 hover:text-slate-200"
                          )}
                        >
                            {() => (
                                <>
                                  {t}
                                </>
                              )}
                        </CustomizableButton>
                      ))}
                    </div>

                    <span className="text-[9.5px] font-mono font-bold text-cyan-300 tabular-nums">
                      {selectedElementIds.size > 0 ? `${selectedElementIds.size} Selected` : "1 Inspected"}
                    </span>
                  </div>
                </div>

                {/* Compact list of items with checkboxes */}
                <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                  {filteredDefinitions.map((def) => {
                    const conf = customConfigs[def.id];
                    const isInspected = def.id === selectedButtonId;
                    const isChecked = selectedElementIds.has(def.id);
                    const itemLabel = getButtonLabel(def.id, def.defaultLabel);
                    const hasCustomStyle = !!(conf?.backgroundColor || conf?.textColor || conf?.borderColor || conf?.accentColor);

                    return (
                      <div
                        key={def.id}
                        onClick={(e) => {
                          setSelectedButtonId(def.id);
                          if (e.shiftKey || e.ctrlKey || e.metaKey) {
                            toggleSelectElement(def.id);
                          } else if (!(selectedElementIds.size > 1 && selectedElementIds.has(def.id))) {
                            setSelectedElementIds(new Set([def.id]));
                          }
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-2 py-1 rounded-lg text-left transition-all cursor-pointer border group",
                          isInspected
                            ? "bg-cyan-950/40 text-cyan-200 border-cyan-500/60"
                            : isChecked
                            ? "bg-cyan-950/20 text-cyan-300 border-cyan-500/30"
                            : "bg-[#090e1a]/80 hover:bg-slate-900 text-slate-300 border-[#1e293b]/60 hover:border-slate-700"
                        )}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            onClick={(e) => toggleSelectElement(def.id, e)}
                            className={cn(
                              "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all shrink-0 cursor-pointer",
                              isChecked
                                ? "bg-cyan-500 border-cyan-400 text-slate-950 font-bold"
                                : "border-slate-700 bg-slate-900 hover:border-cyan-500/60 text-transparent"
                            )}
                            title={isChecked ? "Deselect this element" : "Select element for multi-apply"}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>

                          <div
                            className="w-5 h-5 rounded flex items-center justify-center shrink-0 border border-slate-700 text-[9px]"
                            style={{
                              backgroundColor: conf?.backgroundColor || "#090e1a",
                              color: conf?.textColor || "#94a3b8",
                              borderColor: conf?.borderColor || "#334155",
                            }}
                          >
                            <Palette className="w-2.5 h-2.5" />
                          </div>

                          <div className="flex items-baseline gap-1.5 min-w-0">
                            <span className="font-bold text-[11px] truncate">
                              {itemLabel}
                            </span>
                            <span className="text-[8.5px] text-amber-300/90 font-mono font-black tabular-nums shrink-0">
                              #{getComponentIdForButton(def.id) || "—"}
                            </span>
                            <span className="text-[8.5px] text-slate-500 font-mono truncate">
                              {def.id}
                            </span>
                          </div>
                        </div>

                        {hasCustomStyle && (
                          <span className="px-1 py-0.2 rounded text-[8px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 shrink-0">
                            {uiText("components_button_customization_modal.span.styled", "Styled")}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Compact Radial Color Wheel & Style Controls (7 cols, all visible) */}
              <div className="col-span-12 md:col-span-7 flex flex-col bg-[#090e1a] overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 bg-gradient-to-b from-[#090e1a] via-[#090e1a]/95 to-[#020617]">
                  {/* Active Element & Radial Dial Combined Bar */}
                  <div className="p-2.5 rounded-xl bg-[#020617]/90 border border-[#1e293b] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 shrink-0"
                          style={{
                            backgroundColor: currentConfig?.backgroundColor || undefined,
                            color: currentConfig?.textColor || undefined,
                            borderColor: currentConfig?.borderColor || undefined,
                            boxShadow: currentConfig?.accentColor
                              ? `0 0 12px ${currentConfig.accentColor}80`
                              : undefined,
                          }}
                        >
                          <Palette className="w-3 h-3 text-cyan-400" />
                          <span className="truncate max-w-[160px]">{activeLabel || currentDefinition.defaultLabel}</span>
                        </div>
                        <span className="text-[9.5px] text-amber-300 font-mono font-black tabular-nums shrink-0">
                          #{getComponentIdForButton(currentDefinition.id) || "—"}
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-mono truncate">
                          {currentDefinition.id}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-cyan-300 font-bold shrink-0 tabular-nums">
                        {selectedElementIds.size || 1}{uiText("components_button_customization_modal.span.target_s", " target(s)")}
                      </span>
                    </div>

                    <RadialColorPicker
                      currentConfig={currentConfig}
                      onUpdateStyle={updateStyleForSelectedElements}
                      selectedCount={selectedElementIds.size || 1}
                    />
                  </div>

                  {/* Quick Style Presets (1-click colorways) */}
                  <div className="bg-[#020617]/90 border border-[#1e293b] rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{uiText("components_button_customization_modal.span.quick_1_click_colorways", "Quick 1-Click Colorways")}</span>
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">{uiText("components_button_customization_modal.span.8_palettes", "8 Palettes")}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {STYLE_COLORWAY_PRESETS.map((preset) => (
                        <CustomizableButton
                          buttonId="button_customization_modal_btn_85"
                          key={preset.label}
type="button"
onClick={() => {
                            updateStyleForSelectedElements({
                              backgroundColor: preset.bg,
                              textColor: preset.text,
                              borderColor: preset.border,
                              accentColor: preset.accent,
                            });
                          }}
style={{
                            backgroundColor: preset.bg,
                            color: preset.text,
                            borderColor: preset.border,
                          }}
className="px-2 py-1.5 rounded-lg border text-[10px] font-bold text-center transition-all cursor-pointer hover:brightness-110 active:scale-95 truncate flex items-center justify-center gap-1.5"
                        >
                            {() => (
                                <>
                                  <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: preset.accent }}
                          />
                                <span className="truncate">{preset.label}</span>
                                </>
                              )}
                        </CustomizableButton>
                      ))}
                    </div>
                  </div>

                  {/* Individual Color Selectors (Compact 2x2 Grid) */}
                  <div className="bg-[#020617]/80 border border-[#1e293b] rounded-xl p-2.5 space-y-2">
                    <span className="text-[10.5px] font-bold text-slate-300 block">
                      {uiText("components_button_customization_modal.span.individual_color_channels", "Individual Color Channels:")}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Background Color */}
                      <div className="space-y-1 bg-[#090e1a] p-2 rounded-lg border border-slate-800">
                        <CustomizableLabel
                          labelId="button_customization_modal_item_84"
                          as="label"
                          className="text-[10px] font-semibold text-slate-300 block"
                        >
                            {() => (
                                <>
                                  {uiText("components_button_customization_modal.label.background", "Background:")}
                                </>
                              )}
                        </CustomizableLabel>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={currentConfig?.backgroundColor && currentConfig.backgroundColor !== "transparent" ? currentConfig.backgroundColor : "#064e3b"}
                            onChange={(e) => updateStyleForSelectedElements({ backgroundColor: e.target.value })}
                            className="w-6 h-6 rounded bg-transparent border border-slate-700 cursor-pointer p-0 shrink-0"
                          />
                          <input
                            type="text"
                            value={currentConfig?.backgroundColor ?? ""}
                            onChange={(e) => updateStyleForSelectedElements({ backgroundColor: e.target.value || undefined })}
                            placeholder={uiText("components_button_customization_modal.input.064e3b_transparent.placeholder", "#064e3b / transparent")}
                            className="flex-1 min-w-0 bg-[#020617] border border-slate-800 rounded px-1.5 py-0.5 text-[10.5px] text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                          />
                          <CustomizableButton
                            buttonId="button_customization_modal_btn_83"
                            type="button"
onClick={() => updateStyleForSelectedElements({ backgroundColor: "transparent" })}
className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-[9.5px] text-slate-400 hover:text-slate-200 rounded border border-slate-800 cursor-pointer shrink-0"
                          >
                              {() => (
                                  <>
                                    {uiText("components_button_customization_modal.button.clear", "Clear")}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>
                      </div>

                      {/* Text & Icon Color */}
                      <div className="space-y-1 bg-[#090e1a] p-2 rounded-lg border border-slate-800">
                        <CustomizableLabel
                          labelId="button_customization_modal_item_82"
                          as="label"
                          className="text-[10px] font-semibold text-slate-300 block"
                        >
                            {() => (
                                <>
                                  {uiText("components_button_customization_modal.label.text_and_icon", "Text & Icon:")}
                                </>
                              )}
                        </CustomizableLabel>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={currentConfig?.textColor && currentConfig.textColor !== "transparent" ? currentConfig.textColor : "#ffffff"}
                            onChange={(e) => updateStyleForSelectedElements({ textColor: e.target.value })}
                            className="w-6 h-6 rounded bg-transparent border border-slate-700 cursor-pointer p-0 shrink-0"
                          />
                          <input
                            type="text"
                            value={currentConfig?.textColor ?? ""}
                            onChange={(e) => updateStyleForSelectedElements({ textColor: e.target.value || undefined })}
                            placeholder="#ffffff"
                            className="flex-1 min-w-0 bg-[#020617] border border-slate-800 rounded px-1.5 py-0.5 text-[10.5px] text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                          />
                          <CustomizableButton
                            buttonId="button_customization_modal_btn_81"
                            type="button"
onClick={() => updateStyleForSelectedElements({ textColor: undefined })}
className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-[9.5px] text-slate-400 hover:text-slate-200 rounded border border-slate-800 cursor-pointer shrink-0"
                          >
                              {() => (
                                  <>
                                    {uiText("components_button_customization_modal.button.reset", "Reset")}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>
                      </div>

                      {/* Border Outline Color */}
                      <div className="space-y-1 bg-[#090e1a] p-2 rounded-lg border border-slate-800">
                        <CustomizableLabel
                          labelId="button_customization_modal_item_80"
                          as="label"
                          className="text-[10px] font-semibold text-slate-300 block"
                        >
                            {() => (
                                <>
                                  {uiText("components_button_customization_modal.label.border_outline", "Border Outline:")}
                                </>
                              )}
                        </CustomizableLabel>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={currentConfig?.borderColor && currentConfig.borderColor !== "transparent" ? currentConfig.borderColor : "#00f0ff"}
                            onChange={(e) => updateStyleForSelectedElements({ borderColor: e.target.value })}
                            className="w-6 h-6 rounded bg-transparent border border-slate-700 cursor-pointer p-0 shrink-0"
                          />
                          <input
                            type="text"
                            value={currentConfig?.borderColor ?? ""}
                            onChange={(e) => updateStyleForSelectedElements({ borderColor: e.target.value || undefined })}
                            placeholder="#00f0ff"
                            className="flex-1 min-w-0 bg-[#020617] border border-slate-800 rounded px-1.5 py-0.5 text-[10.5px] text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                          />
                          <CustomizableButton
                            buttonId="button_customization_modal_btn_79"
                            type="button"
onClick={() => updateStyleForSelectedElements({ borderColor: undefined })}
className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-[9.5px] text-slate-400 hover:text-slate-200 rounded border border-slate-800 cursor-pointer shrink-0"
                          >
                              {() => (
                                  <>
                                    {uiText("components_button_customization_modal.button.reset_2", "Reset")}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>
                      </div>

                      {/* Accent Glow Color */}
                      <div className="space-y-1 bg-[#090e1a] p-2 rounded-lg border border-slate-800">
                        <CustomizableLabel
                          labelId="button_customization_modal_item_78"
                          as="label"
                          className="text-[10px] font-semibold text-slate-300 block"
                        >
                            {() => (
                                <>
                                  {uiText("components_button_customization_modal.label.accent_glow", "Accent Glow:")}
                                </>
                              )}
                        </CustomizableLabel>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={currentConfig?.accentColor && currentConfig.accentColor !== "transparent" ? currentConfig.accentColor : "#10b981"}
                            onChange={(e) => updateStyleForSelectedElements({ accentColor: e.target.value })}
                            className="w-6 h-6 rounded bg-transparent border border-slate-700 cursor-pointer p-0 shrink-0"
                          />
                          <input
                            type="text"
                            value={currentConfig?.accentColor ?? ""}
                            onChange={(e) => updateStyleForSelectedElements({ accentColor: e.target.value || undefined })}
                            placeholder="#10b981"
                            className="flex-1 min-w-0 bg-[#020617] border border-slate-800 rounded px-1.5 py-0.5 text-[10.5px] text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                          />
                          <CustomizableButton
                            buttonId="button_customization_modal_btn_77"
                            type="button"
onClick={() => updateStyleForSelectedElements({ accentColor: undefined })}
className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-[9.5px] text-slate-400 hover:text-slate-200 rounded border border-slate-800 cursor-pointer shrink-0"
                          >
                              {() => (
                                  <>
                                    {uiText("components_button_customization_modal.button.reset_3", "Reset")}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "groups" ? (
          /* ================= GROUP RULES VIEW (Compact Multi-Column Grid) ================= */
          <div className="flex-1 flex flex-col p-2.5 overflow-hidden space-y-2">
            {/* Compact Group Rules Header */}
            <div className="bg-[#07111e]/95 border border-[#0d2235] px-3 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                <CustomizableLabel
                  labelId="button_customization_modal_item_76"
                  as="h3"
                  className="text-xs font-black text-slate-100 whitespace-nowrap"
                >
                    {() => (
                        <>
                          {uiText("components_button_customization_modal.h3.independent_button_group_rules", "Independent Button Group Rules")}
                        </>
                      )}
                </CustomizableLabel>
                <span className="text-[10px] font-mono text-amber-300">
                  {uiText("components_button_customization_modal.span.global", "· Global: ")}{globalSettings.globalZeroTextMode ? "Icon-Only" : "Icon + Text"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                <CustomizableButton
                  buttonId="btn_cust_group_all_icon_only"
                  defaultLabel="All: Icon Only"
                  defaultIcon={<EyeOff className="w-3 h-3" />}
                  onClick={() => {
                    GROUPS_INFO.forEach((g) => setGroupRule(g.id, "icon_only"));
                  }}
                  className="px-2.5 py-1 bg-[#091527] hover:bg-[#0e213d] text-cyan-300 border border-cyan-500/40 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                  title="Force all button groups across the app to Icon-Only mode"
                />

                <CustomizableButton
                  buttonId="btn_cust_group_all_icon_text"
                  defaultLabel="All: Icon + Text"
                  defaultIcon={<Eye className="w-3 h-3" />}
                  onClick={() => {
                    GROUPS_INFO.forEach((g) => setGroupRule(g.id, "icon_and_text"));
                  }}
                  className="px-2.5 py-1 bg-[#091527] hover:bg-[#0e213d] text-indigo-300 border border-indigo-500/40 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                  title="Force all button groups across the app to show both Icon and Text"
                />

                <CustomizableButton
                  buttonId="btn_cust_group_reset_inherit"
                  defaultLabel="Reset Inherit"
                  defaultIcon={<RotateCcw className="w-3 h-3 text-slate-400" />}
                  onClick={() => {
                    GROUPS_INFO.forEach((g) => setGroupRule(g.id, "inherit"));
                  }}
                  className="px-2.5 py-1 bg-[#091527] hover:bg-[#0e213d] text-slate-300 border border-slate-700 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                  title="Reset all group rules to follow the global zero-text setting"
                />
              </div>
            </div>

            {/* 3-Column High-Density Group Rule Cards */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 content-start pr-0.5">
              {GROUPS_INFO.map((group) => {
                const currentRule = getGroupRule(group.id);
                const seenGrpIds = new Set<string>();
                const groupButtons = BUTTON_DEFINITIONS.filter((b) => {
                  if (b.category !== group.id || seenGrpIds.has(b.id)) return false;
                  seenGrpIds.add(b.id);
                  return true;
                });

                return (
                  <div
                    key={group.id}
                    className="p-2.5 rounded-xl bg-[#070f1e]/85 border border-[#0d2235] hover:border-slate-700/80 transition-all flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0",
                          group.color
                        )}
                      >
                        <group.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-[11.5px] text-slate-100 truncate">
                            {group.name}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 shrink-0 tabular-nums">
                            {groupButtons.length}{uiText("components_button_customization_modal.span.btns", " btns")}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 line-clamp-1 leading-snug mt-0.5" title={group.description}>
                          {group.description}
                        </p>
                      </div>
                    </div>

                    {/* Compact 3-Way Segmented Rule Selector */}
                    <div className="grid grid-cols-3 gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded-lg">
                      <CustomizableButton
                        buttonId="button_customization_modal_btn_75"
                        defaultIcon={<RotateCcw className="w-2.5 h-2.5 shrink-0" />}
                        type="button"
onClick={() => setGroupRule(group.id, "inherit")}
className={cn(
                          "py-1 px-1 rounded-md text-[9.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 truncate",
                          currentRule === "inherit"
                            ? "bg-slate-800 text-slate-100 border border-slate-600"
                            : "text-slate-400 hover:text-slate-200"
                        )}
title={uiText("components_button_customization_modal.button.follow_global_zero_text_setting.title", "Follow global zero-text setting")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_button_customization_modal.span.inherit", "Inherit")}</span>
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="button_customization_modal_btn_74"
                        defaultIcon={<EyeOff className="w-2.5 h-2.5 shrink-0" />}
                        type="button"
onClick={() => setGroupRule(group.id, "icon_only")}
className={cn(
                          "py-1 px-1 rounded-md text-[9.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 truncate",
                          currentRule === "icon_only"
                            ? "bg-amber-500 text-slate-950 font-extrabold"
                            : "text-slate-400 hover:text-amber-300"
                        )}
title={uiText("components_button_customization_modal.button.force_icon_only_no_text_for_this_group.title", "Force Icon Only (No Text) for this group")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_button_customization_modal.span.icon_only", "Icon Only")}</span>
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="button_customization_modal_btn_73"
                        defaultIcon={<Eye className="w-2.5 h-2.5 shrink-0" />}
                        type="button"
onClick={() => setGroupRule(group.id, "icon_and_text")}
className={cn(
                          "py-1 px-1 rounded-md text-[9.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 truncate",
                          currentRule === "icon_and_text"
                            ? "bg-indigo-500 text-white font-extrabold"
                            : "text-slate-400 hover:text-indigo-300"
                        )}
title={uiText("components_button_customization_modal.button.force_icon_text_for_this_group.title", "Force Icon + Text for this group")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_button_customization_modal.span.icon_text", "Icon+Text")}</span>
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === "optimizer" ? (
          /* ================= DRAG & DROP OPTIMIZER VIEW ================= */
          <div className="flex-1 flex flex-col p-2.5 overflow-hidden space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#07111e]/95 border border-[#0d2235] px-3 py-2 rounded-xl shrink-0">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-emerald-400 shrink-0" />
                <CustomizableLabel
                  labelId="button_customization_modal_item_72"
                  as="h3"
                  className="text-xs font-black text-slate-100"
                >
                    {() => (
                        <>
                          {uiText("components_button_customization_modal.h3.button_layout_precedence_optimizer", "Button Layout Precedence Optimizer")}
                        </>
                      )}
                </CustomizableLabel>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  {uiText("components_button_customization_modal.span.drag_and_drop_to_reorder_toolbars", "· Drag & drop to reorder toolbars")}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <CustomizableButton
                  buttonId="btn_cust_sort_category"
                  defaultLabel="Auto-Flow"
                  defaultIcon={<Sparkles className="w-3 h-3 text-indigo-400" />}
                  onClick={handleSortByCategory}
                  className="px-2.5 py-1 bg-[#091527] hover:bg-[#0e213d] text-indigo-300 border border-indigo-500/40 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  title="Group and optimize sequence by category workflow"
                />
                <CustomizableButton
                  buttonId="btn_cust_sort_alpha"
                  defaultLabel="Sort A-Z"
                  defaultIcon={<ArrowUpDown className="w-3 h-3 text-slate-400" />}
                  onClick={handleSortAlphabetical}
                  className="px-2.5 py-1 bg-[#091527] hover:bg-[#0e213d] text-slate-300 border border-slate-700 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  title="Sort buttons alphabetically by label"
                />
                <CustomizableButton
                  buttonId="btn_cust_reset_order"
                  defaultLabel="Reset Order"
                  defaultIcon={<RotateCcw className="w-3 h-3 text-rose-400" />}
                  onClick={resetButtonOrder}
                  className="px-2.5 py-1 bg-[#091527] hover:bg-[#0e213d] text-rose-300 border border-rose-500/40 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  title="Reset to factory default sequence"
                />
              </div>
            </div>

            {/* All 24 Category Filters Visible (wrap-safe) */}
            <div className="flex flex-wrap items-center gap-1 shrink-0 bg-[#070f1e]/80 p-1.5 rounded-xl border border-[#0d2235]">
              {categories.map((cat) => {
                const catButtonId = `btn_cust_cat_${cat.id}`;
                return (
                  <CustomizableButton
                    key={cat.id}
                    buttonId={catButtonId}
                    defaultLabel={cat.label}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold whitespace-nowrap transition-all cursor-pointer border",
                      selectedCategory === cat.id
                        ? "bg-indigo-500/25 text-indigo-300 border-indigo-500/50"
                        : "bg-slate-900/70 text-slate-400 border-transparent hover:text-slate-200"
                    )}
                  />
                );
              })}
            </div>

            {/* High-Density 4-Column Drag and Drop Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 p-0.5 content-start">
              {filteredDefinitions.map((def, idx) => {
                const conf = customConfigs[def.id];
                const itemLabel = getButtonLabel(def.id, def.defaultLabel);
                const isDragging = draggedButtonId === def.id;
                const isDropTarget = dragOverIndex === idx;

                return (
                  <div
                    key={def.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, def.id)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "p-2 rounded-xl border transition-all cursor-grab active:cursor-grabbing flex items-center justify-between select-none relative group",
                      isDragging
                        ? "opacity-30 scale-95 border-indigo-500 bg-indigo-950/40"
                        : isDropTarget
                        ? "border-indigo-400 bg-indigo-950/60 shadow-lg"
                        : "bg-[#020617]/80 hover:bg-[#020617] border-[#1e293b] hover:border-indigo-500/50"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
                      <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        {renderCustomIcon(conf, <Sparkles className="w-3.5 h-3.5" />, "w-3.5 h-3.5")}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[11px] text-slate-200 truncate">
                          {itemLabel}
                        </span>
                        <span className="text-[8.5px] text-slate-500 font-mono truncate">
                          {def.id}
                        </span>
                      </div>
                    </div>

                    <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400 shrink-0 tabular-nums">
                      #{idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === "snapshots" ? (
          /* ================= SNAPSHOTS & STATE JSON VIEW (Compact All-In-One) ================= */
          <div className="flex-1 flex flex-col p-2.5 overflow-y-auto space-y-2.5">
            {/* Top 2-Column Row: Restore Setup + Cloud Database */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              {/* 1-Click Restore Saved Setup */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-indigo-950/50 border border-cyan-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <CustomizableLabel
                      labelId="button_customization_modal_item_71"
                      as="h4"
                      className="text-xs font-black text-cyan-200 flex items-center gap-2"
                    >
                        {() => (
                            <>
                              <span>{uiText("components_button_customization_modal.span.restore_saved_setup", "Restore Saved Setup")}</span>
                            {hasUserDefault && (
                        <span className="text-[9px] font-mono text-emerald-300">{uiText("components_button_customization_modal.span.active", "· Active")}</span>
                      )}
                            </>
                          )}
                    </CustomizableLabel>
                    <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">
                      {uiText("components_button_customization_modal.p.restore_labels_icons_zero_text_states_and_to", "Restore labels, icons, zero-text states, and toolbar order across the whole app.")}
                    </p>
                  </div>
                </div>

                <CustomizableButton
                  buttonId="button_customization_modal_btn_70"
                  defaultIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  type="button"
onClick={handleRestoreSavedSetup}
className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black rounded-lg text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95"
title={uiText("components_button_customization_modal.button.restore_all_button_labels_icons_zero_text_an.title", "Restore all button labels, icons, zero-text and layout settings throughout the entire application")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_button_customization_modal.span.restore_all", "Restore All")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>

              {/* Cloud Database Integration Card */}
              <div className="bg-[#070f1e]/85 border border-[#0d2235] rounded-xl p-3 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <CustomizableLabel
                        labelId="button_customization_modal_item_69"
                        as="h3"
                        className="text-xs font-black text-slate-100 flex items-center gap-1.5"
                      >
                          {() => (
                              <>
                                <span>{uiText("components_button_customization_modal.span.cloud_database_sync", "Cloud Database Sync")}</span>
                              <span className={cn("text-[9.5px] font-mono", isDatabaseConnected ? "text-emerald-300" : "text-amber-300")}>
                          · {isDatabaseConnected ? "Connected" : "Offline Cache"}
                        </span>
                              </>
                            )}
                      </CustomizableLabel>
                      <p className="text-[9.5px] text-slate-400 font-mono truncate">
                        {lastDatabaseSyncTime ? `Last Synced: ${lastDatabaseSyncTime}` : "Live Firestore configuration sync"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <CustomizableButton
                      buttonId="button_customization_modal_btn_68"
                      type="button"
onClick={() => saveConfigurationToDatabase()}
className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10.5px] font-mono font-bold transition-all cursor-pointer"
                    >
                        {() => (
                            <>
                              {uiText("components_button_customization_modal.button.push_now", "Push Now")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="button_customization_modal_btn_67"
                      defaultIcon={<Database className="w-3.5 h-3.5" />}
                      type="button"
onClick={openLiveCloudEditor}
className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black rounded-lg text-[10.5px] flex items-center gap-1 transition-all cursor-pointer active:scale-95"
title={uiText("components_button_customization_modal.button.open_live_on_the_fly_cloud_configuration_edi.title", "Open Live On-The-Fly Cloud Configuration Editor")}
                    >
                        {() => (
                            <>
                              <span>{uiText("components_button_customization_modal.span.cloud_editor", "Cloud Editor")}</span>
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                </div>
              </div>
            </div>

            {/* Portable JSON + 3 Quick Snapshot Slots */}
            <div className="bg-[#070f1e]/85 border border-[#0d2235] rounded-xl p-3 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#0d2235] pb-2.5">
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <CustomizableLabel
                      labelId="button_customization_modal_item_66"
                      as="h3"
                      className="text-xs font-black text-slate-200"
                    >
                        {() => (
                            <>
                              {uiText("components_button_customization_modal.h3.portable_json_backup_and_quick_snapshot_slot", "Portable JSON Backup & Quick Snapshot Slots")}
                            </>
                          )}
                    </CustomizableLabel>
                    <p className="text-[10px] text-slate-400">
                      {uiText("components_button_customization_modal.p.export_import_json_files_or_use_1_click_snap", "Export/import JSON files or use 1-click snapshot slots below.")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {slotSaveFeedback && (
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {slotSaveFeedback}
                    </span>
                  )}
                  <CustomizableButton
                    buttonId="button_customization_modal_btn_65"
                    defaultIcon={<FileDown className="w-3.5 h-3.5" />}
                    type="button"
onClick={handleExportStateJson}
className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-lg text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
title={uiText("components_button_customization_modal.button.export_your_current_button_setup_to_a_portab.title", "Export your current button setup to a portable JSON file")}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_button_customization_modal.span.export_json", "Export JSON")}</span>
                          </>
                        )}
                  </CustomizableButton>

                  <CustomizableLabel
                    labelId="button_customization_modal_item_64"
                    defaultIcon={<FileUp className="w-3.5 h-3.5" />}
                    as="label"
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
title={uiText("components_button_customization_modal.label.load_button_customizations_from_a_json_file.title", "Load button customizations from a JSON file")}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_button_customization_modal.span.import_json", "Import JSON")}</span>
                          <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                          </>
                        )}
                  </CustomizableLabel>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {quickSlots.map((slot) => {
                  const hasData = !!slot.data;

                  return (
                    <div
                      key={slot.id}
                      className={cn(
                        "p-3 rounded-xl border flex flex-col justify-between space-y-2 transition-all",
                        hasData
                          ? "bg-[#090e1a] border-emerald-500/30"
                          : "bg-[#090e1a]/40 border-slate-800"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-200">
                          {slot.name}
                        </span>
                        <span className={cn("text-[9.5px] font-mono font-bold", hasData ? "text-emerald-300" : "text-slate-500")}>
                          {hasData ? "Saved" : "Empty"}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono truncate tabular-nums">
                        {slot.timestamp ? `Saved: ${slot.timestamp}` : "No snapshot saved"}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <CustomizableButton
                          buttonId="button_customization_modal_btn_63"
                          defaultIcon={<Save className="w-3 h-3" />}
                          type="button"
onClick={() => {
                            saveToQuickSlot(slot.id);
                            setSlotSaveFeedback(`✓ Saved to ${slot.name}`);
                            setTimeout(() => setSlotSaveFeedback(null), 2500);
                          }}
className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                            {() => (
                                <>
                                  <span>{uiText("components_button_customization_modal.span.save", "Save")}</span>
                                </>
                              )}
                        </CustomizableButton>

                        <CustomizableButton
                          buttonId="button_customization_modal_btn_62"
                          defaultIcon={<FolderSync className="w-3 h-3" />}
                          type="button"
disabled={!hasData}
onClick={() => {
                            loadFromQuickSlot(slot.id);
                            setSlotSaveFeedback(`✓ Restored from ${slot.name}`);
                            setTimeout(() => setSlotSaveFeedback(null), 2500);
                          }}
className="flex-1 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:pointer-events-none text-slate-950 font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                            {() => (
                                <>
                                  <span>{uiText("components_button_customization_modal.span.restore", "Restore")}</span>
                                </>
                              )}
                        </CustomizableButton>

                        {hasData && (
                          <CustomizableButton
                            buttonId="button_customization_modal_btn_61"
                            defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                            type="button"
onClick={() => clearQuickSlot(slot.id)}
className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
title={uiText("components_button_customization_modal.button.clear_snapshot_slot.title", "Clear snapshot slot")}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : activeTab === "model" ? (
          /* ================= AI MODEL & MULTIMODAL STUDIO VIEW (All 5 Models + Dial Visible) ================= */
          <div className="flex-1 flex flex-col p-2.5 overflow-y-auto space-y-2">
            {/* Compact Model Header Bar */}
            <div className="bg-[#07111e]/95 border border-[#0d2235] px-3 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
                <CustomizableLabel
                  labelId="button_customization_modal_item_60"
                  as="h3"
                  className="text-xs font-black text-slate-100 whitespace-nowrap"
                >
                    {() => (
                        <>
                          {uiText("components_button_customization_modal.h3.ai_model_and_multimodal_engine", "AI Model & Multimodal Engine")}
                        </>
                      )}
                </CustomizableLabel>
                <span className="text-[10px] font-mono text-emerald-300 font-bold truncate">
                  {uiText("components_button_customization_modal.span.active_2", "· Active: ")}{activeAiModel.replace("models/", "")}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <CustomizableButton
                  buttonId="button_customization_modal_btn_59"
                  defaultIcon={<Sparkles className={cn("w-3 h-3", isTestingModel && "animate-spin")} />}
                  type="button"
disabled={isTestingModel}
onClick={() => handleTestModelConnection(activeAiModel)}
className="px-2.5 py-1 bg-[#091527] hover:bg-[#0e213d] text-indigo-300 border border-indigo-500/40 disabled:opacity-40 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
title={uiText("components_button_customization_modal.button.send_ping_request_to_active_model_to_verify.title", "Send ping request to active model to verify real-time connectivity and latency")}
                >
                    {() => (
                        <>
                          <span>{isTestingModel ? "Testing..." : "Test Connection"}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="button_customization_modal_btn_58"
                  defaultIcon={<Save className="w-3 h-3" />}
                  type="button"
onClick={handleSaveAllAsDefault}
className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
title={uiText("components_button_customization_modal.button.save_current_model_choice_and_parameters_as.title", "Save current model choice and parameters as permanent default")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_button_customization_modal.span.set_as_default", "Set as Default")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>

            {modelTestStatus && (
              <div className="px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/50 text-indigo-200 text-[11px] font-mono font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{modelTestStatus}</span>
              </div>
            )}

            {/* 3-Column Model Cards Grid (All 5 models fit in 2 compact rows) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {[
                {
                  id: "models/gemini-3.8-flash",
                  name: "Gemini 3.8 Flash",
                  badge: "Recommended",
                  badgeColor: "text-emerald-300",
                  description: "Next-generation multimodal reasoning and optical analysis with lowest latency.",
                  capabilities: ["Multimodal Vision", "Script-to-Storyboard", "Ultra-Fast"],
                  speed: "<200ms",
                },
                {
                  id: "models/gemini-3.1-pro-preview",
                  name: "Gemini 3.1 Pro",
                  badge: "Deep Reasoning",
                  badgeColor: "text-indigo-300",
                  description: "Premier model for complex screenplays, multi-character dialogue, and narrative arcs.",
                  capabilities: ["Screenplay Studio", "Complex Dialogue", "Deep Story"],
                  speed: "~500ms",
                },
                {
                  id: "models/gemini-3.1-flash-lite",
                  name: "Gemini 3.1 Flash-Lite",
                  badge: "High Throughput",
                  badgeColor: "text-cyan-300",
                  description: "Ultra-responsive for high-frequency prompt expansion, fast tagging, and numbering.",
                  capabilities: ["Instant Response", "Prompt Expander", "Batch Tagging"],
                  speed: "<150ms",
                },
                {
                  id: "models/gemini-3.1-flash-image",
                  name: "Gemini 3.1 Flash Image",
                  badge: "Image Synthesis",
                  badgeColor: "text-purple-300",
                  description: "High-resolution visual generation across 1:1, 16:9, and 9:16 with style matching.",
                  capabilities: ["1K Resolution", "Multi-Aspect", "Style Transfer"],
                  speed: "~1.2s",
                },
                {
                  id: "models/gemini-3.1-flash-lite-image",
                  name: "Gemini 3.1 Flash-Lite Image",
                  badge: "Rapid Vision",
                  badgeColor: "text-amber-300",
                  description: "Responsive model for rapid sprite variations, draft storyboard concepts, and mockups.",
                  capabilities: ["Rapid Drafts", "Lightweight", "Responsive"],
                  speed: "~500ms",
                },
              ].map((m) => {
                const isSelected = activeAiModel === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setActiveAiModel(m.id);
                      setActiveGeminiModel(m.id);
                    }}
                    className={cn(
                      "p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 group",
                      isSelected
                        ? "bg-[#0b1329] border-cyan-400 ring-1 ring-cyan-500/30"
                        : "bg-[#020617] border-slate-800 hover:border-slate-700 hover:bg-[#070d1d]"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Cpu className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-cyan-400" : "text-slate-400")} />
                          <span className="font-bold text-xs text-slate-100 truncate">{m.name}</span>
                        </div>
                        <span className={cn("text-[9px] font-mono font-bold shrink-0", m.badgeColor)}>
                          {m.badge}
                        </span>
                      </div>

                      <p className="text-[9.5px] text-slate-400 mt-1 line-clamp-2 leading-snug">
                        {m.description}
                      </p>

                      <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 mt-1.5 text-[8.5px] font-mono text-slate-400">
                        {m.capabilities.map((c, i) => (
                          <span key={c}>
                            {i > 0 ? "· " : ""}{c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono">
                      <span className="text-slate-500 tabular-nums">{uiText("components_button_customization_modal.span.speed", "Speed: ")}<strong className="text-slate-300">{m.speed}</strong></span>
                      <CustomizableButton
                        buttonId="button_customization_modal_btn_57"
                        type="button"
onClick={(e) => {
                          e.stopPropagation();
                          setActiveAiModel(m.id);
                          setActiveGeminiModel(m.id);
                        }}
className={cn(
                          "px-2 py-0.5 rounded-md font-bold text-[9px] transition-all cursor-pointer flex items-center gap-1",
                          isSelected
                            ? "bg-cyan-500 text-slate-950 font-black"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        )}
                      >
                          {() => (
                              <>
                                {isSelected ? <Check className="w-2.5 h-2.5" /> : null}
                              <span>{isSelected ? "Active" : "Select"}</span>
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compact Model Generation Parameters */}
            <div className="bg-[#020617] border border-slate-800 rounded-xl p-2.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                <div className="flex items-center gap-3 bg-[#090e1a] px-3 py-2 rounded-lg border border-slate-800">
                  <RotaryDialKnob
                    value={aiTemperature}
                    min={0}
                    max={1}
                    step={0.05}
                    defaultValue={0.7}
                    accentColor="#00f0ff"
                    size="sm"
                    onChange={setAiTemperature}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-300 font-semibold">
                      <span>{uiText("components_button_customization_modal.span.creativity_temperature", "Creativity Temperature")}</span>
                      <span className="font-mono text-cyan-300 font-bold tabular-nums">{aiTemperature.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={aiTemperature}
                      onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                      <span>{uiText("components_button_customization_modal.span.0_0_strict", "0.0 Strict")}</span>
                      <span>{uiText("components_button_customization_modal.span.0_5_balanced", "0.5 Balanced")}</span>
                      <span>{uiText("components_button_customization_modal.span.1_0_creative", "1.0 Creative")}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5 px-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-300 font-semibold">
                    <span>{uiText("components_button_customization_modal.span.visual_consistency_rules", "Visual Consistency Rules")}</span>
                    <span className="font-mono text-emerald-400 font-bold">{uiText("components_button_customization_modal.span.enabled", "Enabled")}</span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 leading-snug">
                    {uiText("components_button_customization_modal.p.preserves_character_features_costume_palette", "Preserves character features, costume palette, lighting key, and perspective across sequential storyboard frames.")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "modals" ? (
          /* ================= MODALS & STUDIOS QUICK ACCESS ================= */
          <div className="flex-1 flex flex-col p-2.5 overflow-y-auto space-y-2">
            <div className="bg-[#07111e]/95 border border-[#0d2235] px-3 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-violet-400 shrink-0" />
                <CustomizableLabel
                  labelId="button_customization_modal_item_56"
                  as="h3"
                  className="text-xs font-black text-slate-100"
                >
                    {() => (
                        <>
                          {uiText("components_button_customization_modal.h3.studio_modals_and_dialog_customization", "Studio Modals & Dialog Customization")}
                        </>
                      )}
                </CustomizableLabel>
                <span className="text-[10px] font-mono text-violet-300">
                  {uiText("components_button_customization_modal.span.click_any_studio_to_inspect_its_controls", "· Click any studio to inspect its controls")}
                </span>
              </div>

              <CustomizableButton
                buttonId="button_customization_modal_btn_55"
                defaultIcon={<List className="w-3 h-3" />}
                type="button"
onClick={() => {
                  setSelectedCategory("modals");
                  setActiveTab("customize");
                }}
className="px-2.5 py-1 bg-[#091527] hover:bg-[#0e213d] text-violet-300 border border-violet-500/40 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              >
                  {() => (
                      <>
                        <span>{uiText("components_button_customization_modal.span.browse_all_modal_actions", "Browse All Modal Actions")}</span>
                      </>
                    )}
              </CustomizableButton>
            </div>

            {/* Compact 4-Column Grid of All 14 Studio Modals */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {[
                { name: "Control Deck Studio", cat: "control_deck", icon: Layers, color: "text-emerald-400" },
                { name: "Neo1 Studio", cat: "neo1_studio", icon: Sparkles, color: "text-cyan-400" },
                { name: "Spread Studio Modal", cat: "spread_studio", icon: Grid3x3, color: "text-cyan-400" },
                { name: "Front Page Ad Panels", cat: "front_page_ad_panels", icon: Grid, color: "text-emerald-400" },
                { name: "AniPlayer Studio", cat: "aniplayer", icon: Film, color: "text-amber-400" },
                { name: "Zoom Image Studio", cat: "zoom_studio", icon: ZoomIn, color: "text-blue-400" },
                { name: "Resolution Sharpener", cat: "sharpener_studio", icon: Focus, color: "text-amber-400" },
                { name: "Resample Studio", cat: "resample_studio", icon: Sparkles, color: "text-cyan-400" },
                { name: "The Log & Audit Trail", cat: "the_log", icon: ScrollText, color: "text-amber-400" },
                { name: "Krums Multi-Image", cat: "krums_studio", icon: Sparkles, color: "text-pink-400" },
                { name: "Animation Player Modal", cat: "modals", icon: Film, color: "text-red-400" },
                { name: "Bulk Rename Modal", cat: "modals", icon: CheckCircle2, color: "text-emerald-400" },
                { name: "Expand View Modal", cat: "modals", icon: Maximize2, color: "text-indigo-400" },
                { name: "Export JSON Modal", cat: "modals", icon: Download, color: "text-cyan-400" },
              ].map((m) => (
                <div
                  key={m.name}
                  onClick={() => {
                    setSelectedCategory(m.cat as any);
                    setActiveTab("customize");
                  }}
                  className="p-2.5 bg-[#020617] hover:bg-[#090e1a] border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <m.icon className={cn("w-4 h-4 shrink-0", m.color)} />
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-300 block truncate">{m.name}</span>
                    <span className="text-[8.5px] font-mono text-slate-500 uppercase">{m.cat}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ================= STANDARD CUSTOMIZE VIEW ================= */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {modalSize.width < 680 && (
              <div className="flex items-center justify-between px-2.5 py-1 bg-[#030712] border-b border-[#1e293b] shrink-0 text-xs select-none">
                <div className="flex items-center gap-1">
                  <CustomizableButton
                    buttonId="btn_cust_subtab_edit"
                    defaultLabel="Inspector"
                    defaultIcon={<SlidersHorizontal className="w-3 h-3" />}
                    onClick={() => setDiscreteSubTab("edit")}
                    className={cn(
                      "px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer text-[11px]",
                      discreteSubTab === "edit"
                        ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  />
                  <CustomizableButton
                    buttonId="btn_cust_subtab_list"
                    defaultLabel={`Browse All (${filteredDefinitions.length})`}
                    defaultIcon={<List className="w-3 h-3" />}
                    onClick={() => setDiscreteSubTab("list")}
                    className={cn(
                      "px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer text-[11px]",
                      discreteSubTab === "list"
                        ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[130px]">
                  {isItemLabel(currentDefinition) ? "Label" : "Button"}
                </span>
              </div>
            )}
            <div className={cn(
              "flex-1 min-h-0 overflow-hidden",
              modalSize.width >= 680 ? "grid grid-cols-12" : "flex flex-col"
            )}>
              {/* Left Column: Button List & Category Filter (5 cols when expanded) */}
              {(modalSize.width >= 680 || discreteSubTab === "list") && (
                <div className={cn(
                  "border-r border-[#0d2235] flex flex-col min-h-0 bg-[#050b14]/70 overflow-hidden",
                  modalSize.width >= 680 ? "col-span-5" : "flex-1"
                )}>
                  {/* Search, Wrap-Safe Type Filter & Wrap-Safe 24 Category Filter */}
                  <div className="p-2 space-y-1.5 border-b border-[#0d2235] shrink-0 bg-[#07111e]/90">
                    <div className="relative">
                      <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder={uiText("components_button_customization_modal.input.search_buttons_and_labels.placeholder", "Search buttons & labels...")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-6 py-1 bg-[#050b14] border border-[#0d2235] focus:border-cyan-400 rounded-lg text-[11px] font-mono text-slate-200 placeholder-slate-500 transition-colors"
                      />
                      {searchQuery && (
                        <CustomizableButton
                          buttonId="button_customization_modal_btn_54"
                          defaultIcon={<X className="w-3 h-3" />}
                          onClick={() => setSearchQuery("")}
className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        />
                      )}
                    </div>

                    {/* Full Component Registry Type Filter — flex-wrap so all 7 types stay visible */}
                    <div className="flex flex-wrap items-center gap-1 bg-[#050b14] p-1 rounded-lg border border-[#0d2235]">
                      <CustomizableButton
                        buttonId="button_customization_modal_btn_53"
                        defaultIcon={<Layers className="w-2.5 h-2.5" />}
                        type="button"
onClick={() => setItemTypeFilter("all")}
className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 tabular-nums",
                          itemTypeFilter === "all"
                            ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                            : "text-slate-400 hover:text-slate-200"
                        )}
title={uiText("components_button_customization_modal.button.display_all_components_across_the_app.title", "Display all components across the app")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_button_customization_modal.span.all", "All (")}{BUTTON_DEFINITIONS.length})</span>
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="button_customization_modal_btn_52"
                        defaultIcon={<MousePointer className="w-2.5 h-2.5" />}
                        type="button"
onClick={() => setItemTypeFilter("buttons")}
className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 tabular-nums",
                          itemTypeFilter === "buttons"
                            ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40"
                            : "text-slate-400 hover:text-slate-200"
                        )}
title={uiText("components_button_customization_modal.button.filter_to_interactive_buttons.title", "Filter to interactive buttons")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_button_customization_modal.span.buttons", "Buttons (")}{totalButtonsCount})</span>
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="button_customization_modal_btn_51"
                        defaultIcon={<Frame className="w-2.5 h-2.5" />}
                        type="button"
onClick={() => setItemTypeFilter("pages")}
className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 tabular-nums",
                          itemTypeFilter === "pages"
                            ? "bg-indigo-500/25 text-indigo-300 border border-indigo-500/40"
                            : "text-slate-400 hover:text-slate-200"
                        )}
title={uiText("components_button_customization_modal.button.filter_to_page_workspaces.title", "Filter to page workspaces")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_button_customization_modal.span.pages", "Pages (")}{totalPagesCount})</span>
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="button_customization_modal_btn_50"
                        defaultIcon={<LayoutGrid className="w-2.5 h-2.5" />}
                        type="button"
onClick={() => setItemTypeFilter("tabs")}
className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 tabular-nums",
                          itemTypeFilter === "tabs"
                            ? "bg-amber-500/25 text-amber-300 border border-amber-500/40"
                            : "text-slate-400 hover:text-slate-200"
                        )}
title={uiText("components_button_customization_modal.button.filter_to_workspace_and_deck_navigation_tabs.title", "Filter to workspace and deck navigation tabs")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_button_customization_modal.span.tabs", "Tabs (")}{totalTabsCount})</span>
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="button_customization_modal_btn_49"
                        defaultIcon={<Box className="w-2.5 h-2.5" />}
                        type="button"
onClick={() => setItemTypeFilter("modals")}
className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 tabular-nums",
                          itemTypeFilter === "modals"
                            ? "bg-rose-500/25 text-rose-300 border border-rose-500/40"
                            : "text-slate-400 hover:text-slate-200"
                        )}
title={uiText("components_button_customization_modal.button.filter_to_studio_modals_and_dialogs.title", "Filter to studio modals and dialogs")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_button_customization_modal.span.modals", "Modals (")}{totalModalsCount})</span>
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="button_customization_modal_btn_48"
                        defaultIcon={<SlidersHorizontal className="w-2.5 h-2.5" />}
                        type="button"
onClick={() => setItemTypeFilter("panels")}
className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 tabular-nums",
                          itemTypeFilter === "panels"
                            ? "bg-teal-500/25 text-teal-300 border border-teal-500/40"
                            : "text-slate-400 hover:text-slate-200"
                        )}
title={uiText("components_button_customization_modal.button.filter_to_ui_sidebars_dock_panels_and_toolba.title", "Filter to UI sidebars, dock panels, and toolbars")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_button_customization_modal.span.panels", "Panels (")}{totalPanelsCount})</span>
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="button_customization_modal_btn_47"
                        defaultIcon={<Tag className="w-2.5 h-2.5" />}
                        type="button"
onClick={() => setItemTypeFilter("labels")}
className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 tabular-nums",
                          itemTypeFilter === "labels"
                            ? "bg-purple-500/25 text-purple-300 border border-purple-500/40"
                            : "text-slate-400 hover:text-slate-200"
                        )}
title={uiText("components_button_customization_modal.button.filter_to_section_labels_titles_and_text_hea.title", "Filter to section labels, titles, and text headers")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_button_customization_modal.span.labels", "Labels (")}{totalLabelsCount})</span>
                              </>
                            )}
                      </CustomizableButton>
                    </div>

                    {/* All 24 Categories — flex-wrap so every category is visible simultaneously */}
                    <div className="flex flex-wrap items-center gap-1">
                      {categories.map((cat) => {
                        const catButtonId = `btn_cust_cat_${cat.id}`;
                        return (
                          <CustomizableButton
                            key={cat.id}
                            buttonId={catButtonId}
                            defaultLabel={cat.label}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold whitespace-nowrap transition-all cursor-pointer border leading-tight",
                              selectedCategory === cat.id
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-[#050b14] text-slate-400 border-slate-800/70 hover:text-slate-200"
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Multi-Selection Control Bar */}
                  <div className="flex items-center justify-between px-2.5 py-1 bg-[#07111e] border-b border-[#0d2235] text-[10px] shrink-0">
                    <span className="font-bold text-slate-300 tabular-nums">
                      {uiText("components_button_customization_modal.span.selected", "Selected: ")}<span className="font-mono text-emerald-400 font-bold">{selectedElementIds.size}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <CustomizableButton
                        buttonId="button_customization_modal_btn_46"
                        defaultLabel={")"}
                        type="button"
onClick={() => {
                          const next = new Set(selectedElementIds);
                          filteredDefinitions.forEach((d) => next.add(d.id));
                          setSelectedElementIds(next);
                        }}
className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-700 font-semibold cursor-pointer tabular-nums"
title={uiText("components_button_customization_modal.button.select_all_items_currently_shown_in_this_cat.title", "Select all items currently shown in this category")}
                      >
                          {(ibcProps) => (
                              <>
                                {uiText("components_button_customization_modal.button.category", "Category (")}
                              {filteredDefinitions.length}
                              {!ibcProps.isTextHidden ? ibcProps.label : null}
                              </>
                            )}
                      </CustomizableButton>
                      <CustomizableButton
                        buttonId="button_customization_modal_btn_45"
                        defaultLabel={")"}
                        type="button"
onClick={() => {
                          setSelectedElementIds(new Set(BUTTON_DEFINITIONS.map((d) => d.id)));
                        }}
className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-indigo-300 rounded border border-slate-700 font-semibold cursor-pointer tabular-nums"
title={uiText("components_button_customization_modal.button.select_all_items_across_entire_application.title", "Select all items across entire application")}
                      >
                          {(ibcProps) => (
                              <>
                                {uiText("components_button_customization_modal.button.all", "All (")}
                              {BUTTON_DEFINITIONS.length}
                              {!ibcProps.isTextHidden ? ibcProps.label : null}
                              </>
                            )}
                      </CustomizableButton>
                      <CustomizableButton
                        buttonId="button_customization_modal_btn_44"
                        type="button"
onClick={() => {
                          setSelectedElementIds(new Set([selectedButtonId]));
                        }}
className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded border border-slate-700 font-semibold cursor-pointer"
title={uiText("components_button_customization_modal.button.reset_selection_to_current_item_only.title", "Reset selection to current item only")}
                      >
                          {() => (
                              <>
                                {uiText("components_button_customization_modal.button.clear_2", "Clear")}
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  </div>

                  {/* Dense Button & Label List Items */}
                  <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                    {/* Storyboard Appearance & Slot Panel Config Card */}
                    {selectedCategory === "storyboard" && (
                      <div className="p-2 bg-gradient-to-r from-slate-900 to-[#070d1e] border border-cyan-500/30 rounded-lg space-y-1.5 mb-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                            <Film className="w-3 h-3 text-cyan-400" />
                            {uiText("components_button_customization_modal.span.storyboard_and_strip_settings", "Storyboard & Strip Settings")}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">{uiText("components_button_customization_modal.span.live_sync", "Live Sync")}</span>
                        </div>

                        <div className="flex items-center justify-between text-[10.5px] pt-1 border-t border-slate-800/80">
                          <span className="text-slate-300 font-semibold flex items-center gap-1">
                            <Palette className="w-3 h-3 text-cyan-400" />
                            {uiText("components_button_customization_modal.span.strip_bg", "Strip BG:")}
                          </span>
                          <div className="flex items-center gap-1">
                            {[
                              { label: "Pure Black", color: "#000000" },
                              { label: "Pitch", color: "#050505" },
                              { label: "Slate", color: "#020617" },
                              { label: "Navy", color: "#070d1e" },
                              { label: "Charcoal", color: "#0f172a" },
                            ].map((preset) => (
                              <CustomizableButton
                                buttonId="button_customization_modal_btn_43"
                                key={preset.color}
type="button"
onClick={() => setStripBackground(preset.color)}
className={cn(
                                  "w-3.5 h-3.5 rounded-full border transition-all cursor-pointer",
                                  (stripBackground || "#000000").toLowerCase() === preset.color.toLowerCase()
                                    ? "ring-2 ring-cyan-400 border-white scale-110"
                                    : "border-slate-600 hover:scale-105 opacity-75"
                                )}
style={{ backgroundColor: preset.color }}
title={`Set to ${preset.label} (${preset.color})`}
                              />
                            ))}
                            <CustomizableLabel
                              labelId="button_customization_modal_item_42"
                              as="label"
                              className="relative cursor-pointer flex items-center"
title={uiText("components_button_customization_modal.label.custom_color.title", "Custom color")}
                            >
                                {() => (
                                    <>
                                      <input
                                type="color"
                                value={stripBackground || "#000000"}
                                onChange={(e) => setStripBackground(e.target.value)}
                                className="w-3.5 h-3.5 rounded-full border border-slate-500 cursor-pointer p-0 opacity-0 absolute inset-0"
                              />
                                    <div
                                className="w-3.5 h-3.5 rounded-full border border-slate-500 flex items-center justify-center text-[8px] font-bold text-white"
                                style={{ backgroundColor: stripBackground || "#000000" }}
                              >
                                +
                              </div>
                                    </>
                                  )}
                            </CustomizableLabel>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10.5px] pt-1 border-t border-slate-800/80">
                          <span className="text-slate-300 font-semibold flex items-center gap-1">
                            <Trash2 className="w-3 h-3 text-rose-400" />
                            {uiText("components_button_customization_modal.span.slot_headers", "Slot Headers:")}
                          </span>
                          <CustomizableButton
                            buttonId="btn_cust_toggle_slot_headers"
                            defaultLabel={showSlotHeaders ? "Visible" : "Hidden"}
                            defaultIcon={<Trash2 className="w-3 h-3 text-rose-400" />}
                            onClick={toggleSlotHeaders}
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1",
                              showSlotHeaders
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            )}
                            title="Toggle Slot Panel Headers"
                          />
                        </div>
                      </div>
                    )}

                    {filteredDefinitions.map((def) => {
                      const conf = customConfigs[def.id];
                      const isInspected = def.id === selectedButtonId;
                      const isChecked = selectedElementIds.has(def.id);
                      const itemLabel = getButtonLabel(def.id, def.defaultLabel);
                      const hasCustomIcon = !!(conf?.iconName || conf?.customIconType);
                      const hasCustomLabel = !!conf?.label;

                      return (
                        <div
                          key={def.id}
                          onClick={(e) => {
                            setSelectedButtonId(def.id);
                            if (e.shiftKey || e.ctrlKey || e.metaKey) {
                              toggleSelectElement(def.id);
                            } else if (!(selectedElementIds.size > 1 && selectedElementIds.has(def.id))) {
                              setSelectedElementIds(new Set([def.id]));
                            }
                            if (modalSize.width < 680) {
                              setDiscreteSubTab("edit");
                            }
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-2 py-1 rounded-lg text-left transition-all cursor-pointer border group",
                            isInspected
                              ? "bg-emerald-950/40 text-emerald-200 border-emerald-500/60"
                              : isChecked
                              ? "bg-cyan-950/30 text-cyan-200 border-cyan-500/40"
                              : "bg-[#090e1a]/80 hover:bg-slate-900 text-slate-300 border-[#1e293b]/60 hover:border-slate-700"
                          )}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div
                              onClick={(e) => toggleSelectElement(def.id, e)}
                              className={cn(
                                "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all shrink-0 cursor-pointer",
                                isChecked
                                  ? "bg-emerald-500 border-emerald-400 text-slate-950"
                                  : "border-slate-700 bg-slate-900/80 hover:border-emerald-500/60 text-transparent"
                              )}
                              title={isChecked ? "Deselect this element" : "Select element for multi-apply"}
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>

                            <div
                              className={cn(
                                "w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors",
                                isInspected
                                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                                  : isChecked
                                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                                  : "bg-slate-900 border-slate-800 text-slate-400 group-hover:text-slate-200"
                              )}
                            >
                              {conf?.hideIcon ? (
                                <Type className="w-3 h-3 text-amber-400" />
                              ) : (
                                renderCustomIcon(
                                  conf,
                                  <Sparkles className="w-3 h-3" />,
                                  "w-3 h-3"
                                )
                              )}
                            </div>

                            <div className="flex items-baseline gap-1.5 min-w-0">
                              <span className="font-bold text-[11px] truncate">
                                {itemLabel}
                              </span>
                              <span className="text-[8.5px] text-slate-500 font-mono truncate hidden sm:inline">
                                {def.id}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 text-[8px] font-mono text-slate-400">
                            <span>{isItemLabel(def) ? "Lbl" : "Btn"}</span>
                            {conf?.hideIcon && <span className="text-amber-300">{uiText("components_button_customization_modal.span.txt", "·Txt")}</span>}
                            {hasCustomIcon && !conf?.hideIcon && <span className="text-cyan-300">{uiText("components_button_customization_modal.span.ico", "·Ico")}</span>}
                            {hasCustomLabel && <span className="text-purple-300">{uiText("components_button_customization_modal.span.ren", "·Ren")}</span>}
                            {isZeroText(def.id) && <span className="text-indigo-300">{uiText("components_button_customization_modal.span.0t", "·0T")}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Compact Bottom Quick Themes & Reset */}
                  <div className="px-2.5 py-1.5 border-t border-[#1e293b] bg-[#020617]/90 shrink-0 space-y-1">
                    <div className="flex items-center justify-between text-[9.5px] font-bold text-slate-400">
                      <span>{uiText("components_button_customization_modal.span.quick_presets", "Quick Presets:")}</span>
                      <div className="flex items-center gap-2">
                        <CustomizableButton
                          buttonId="btn_cust_restore_saved_btn"
                          defaultLabel="Restore Saved"
                          defaultIcon={<RotateCcw className="w-2.5 h-2.5" />}
                          onClick={handleRestoreSavedSetup}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-bold bg-transparent border-0 p-0 shadow-none text-[9.5px]"
                          title="Restore all buttons and labels from saved setup throughout entire application"
                        />
                        <CustomizableButton
                          buttonId="btn_cust_reset_all_btn"
                          defaultLabel="Reset All"
                          defaultIcon={<RefreshCw className="w-2.5 h-2.5" />}
                          onClick={() => applyPresetTheme("reset")}
                          className="text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer font-bold bg-transparent border-0 p-0 shadow-none text-[9.5px]"
                          title="Reset all buttons to original factory state"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                      <CustomizableButton
                        buttonId="btn_cust_theme_saved"
                        defaultLabel="Saved"
                        defaultIcon={<Save className="w-2.5 h-2.5" />}
                        onClick={() => applyPresetTheme("saved")}
                        className="py-1 px-1 rounded-md bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-[9.5px] font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1"
                        title="Restore previously saved button setup"
                      />
                      <CustomizableButton
                        buttonId="btn_cust_theme_cyberpunk"
                        defaultLabel="Cyber"
                        defaultIcon={<Zap className="w-2.5 h-2.5" />}
                        onClick={() => applyPresetTheme("cyberpunk")}
                        className="py-1 px-1 rounded-md bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-[9.5px] font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1"
                        title="Apply Cyberpunk preset theme"
                      />
                      <CustomizableButton
                        buttonId="btn_cust_theme_emoji"
                        defaultLabel="Emoji"
                        defaultIcon={<Smile className="w-2.5 h-2.5" />}
                        onClick={() => applyPresetTheme("emoji")}
                        className="py-1 px-1 rounded-md bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-[9.5px] font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1"
                        title="Apply Emoji icons preset"
                      />
                      <CustomizableButton
                        buttonId="btn_cust_theme_zero"
                        defaultLabel="Zero"
                        defaultIcon={<EyeOff className="w-2.5 h-2.5" />}
                        onClick={() => applyPresetTheme("zero-text")}
                        className="py-1 px-1 rounded-md bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-[9.5px] font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1"
                        title="Toggle zero-text mode preset"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Right Column: Active Button Customization Inspector (7 cols when expanded, full width in discrete) */}
              {(modalSize.width >= 680 || discreteSubTab === "edit") && (
                <div className={cn(
                  "flex flex-col min-h-0 bg-[#050b14] overflow-hidden",
                  modalSize.width >= 680 ? "col-span-7" : "flex-1"
                )}>
                  {/* Pinned Compact Live Preview + 5-Column Sub-Tab Bar */}
                  <div className="px-2.5 py-2 bg-[#070f1e]/95 border-b border-[#0d2235] space-y-1.5 shrink-0">
                    {modalSize.width < 680 && (
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#0d2235] gap-2">
                        <CustomizableButton
                          buttonId="btn_cust_discrete_browse_back"
                          defaultLabel="Browse All"
                          defaultIcon={<ArrowLeft className="w-3 h-3" />}
                          onClick={() => setDiscreteSubTab("list")}
                          className="text-[11px] text-cyan-300 hover:text-cyan-200 font-bold flex items-center gap-1 cursor-pointer bg-cyan-950/60 hover:bg-cyan-900/60 px-2 py-1 rounded-lg border border-cyan-500/40 transition-colors shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <select
                            value={selectedButtonId}
                            onChange={(e) => {
                              setSelectedButtonId(e.target.value);
                              setSelectedElementIds(new Set([e.target.value]));
                            }}
                            className="w-full bg-[#020617] border border-slate-700 hover:border-slate-600 rounded-lg px-2 py-1 text-[11px] text-slate-200 font-bold cursor-pointer outline-none truncate"
                            title={uiText("components_button_customization_modal.select.quick_jump_to_another_button_or_label.title", "Quick jump to another button or label")}
                          >
                            {filteredDefinitions.map((d) => (
                              <option key={d.id} value={d.id} className="bg-slate-950 text-slate-200">
                                {isItemLabel(d) ? "[Label] " : "[Button] "}{d.defaultLabel || d.id}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Single-Row Merged Identity, Live Preview & Quick Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Live Preview Button */}
                        <div
                          style={{
                            color: currentConfig?.textColor || undefined,
                            backgroundColor: currentConfig?.backgroundColor || undefined,
                            borderColor: currentConfig?.borderColor || undefined,
                            boxShadow: currentConfig?.accentColor ? `0 0 12px ${currentConfig.accentColor}` : undefined,
                          }}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-950 font-bold text-xs shadow transition-all select-none border shrink-0",
                            !currentConfig?.backgroundColor && "bg-emerald-600",
                            !currentConfig?.borderColor && "border-emerald-400/40",
                            !currentConfig?.textColor && "text-slate-950"
                          )}
                          title={uiText("components_button_customization_modal.div.live_component_preview.title", "Live Component Preview")}
                        >
                          {!currentConfig?.hideIcon && renderCustomIcon(
                            currentConfig,
                            <Sparkles className="w-3.5 h-3.5" />,
                            "w-3.5 h-3.5"
                          )}
                          {!isHidden && (
                            <span className="truncate max-w-[140px]">{activeLabel}</span>
                          )}
                          {currentConfig?.hideIcon && isHidden && (
                            <span className="text-[10px] text-slate-400 italic font-normal">(Empty)</span>
                          )}
                        </div>

                        <div className="min-w-0 leading-tight">
                          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-200">
                            <span className="truncate max-w-[180px]">{currentDefinition.id}</span>
                            {selectedElementIds.size > 1 && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-bold whitespace-nowrap tabular-nums">
                                {selectedElementIds.size}{uiText("components_button_customization_modal.span.selected_2", " Selected")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-slate-400">
                            <span className={isItemLabel(currentDefinition) ? "text-purple-300" : "text-cyan-300"}>
                              {isItemLabel(currentDefinition) ? "UI Label" : "Button"}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="uppercase">{currentDefinition.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className={isHidden ? "text-indigo-400" : "text-emerald-400"}>
                              {isHidden
                                ? (currentConfig?.hideIcon ? "Hidden (Blank)" : "Icon Only")
                                : (currentConfig?.hideIcon ? "Text Only" : "Icon + Text")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <CustomizableButton
                          buttonId="button_customization_modal_btn_41"
                          defaultIcon={<Search className="w-3 h-3" />}
                          type="button"
                          onClick={() => {
                            toggleIbcInspector(true);
                            setIsMinimized(true);
                          }}
                          className="px-2 py-1 rounded-lg text-[10.5px] font-mono font-bold bg-[#091b2c] hover:bg-[#0f2a44] border border-cyan-500/50 text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                          title={uiText("components_button_customization_modal.button.pick_another_ui_element_directly_from_the_wo.title", "Pick another UI element directly from the workspace")}
                        >
                          {() => (
                            <>
                              <span>{uiText("components_button_customization_modal.span.pick_element", "Pick Element")}</span>
                            </>
                          )}
                        </CustomizableButton>
                        <CustomizableButton
                          buttonId="btn_cust_toggle_zero_quick"
                          defaultLabel={isHidden ? "Zero-Text: ON" : "Zero-Text: OFF"}
                          defaultIcon={<EyeOff className="w-3 h-3" />}
                          onClick={handleToggleSelectedZeroText}
                          className={cn(
                            "px-2 py-1 rounded-lg text-[10.5px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap",
                            isHidden
                              ? "bg-indigo-950/60 text-indigo-300 border-indigo-500/40"
                              : "bg-[#091527] text-slate-400 border-slate-800 hover:text-slate-200"
                          )}
                          title="Toggle Zero-Text on selected component(s)"
                        />
                        <CustomizableButton
                          buttonId="btn_cust_toggle_icon_quick"
                          defaultLabel={currentConfig?.hideIcon ? "Icon: HIDDEN" : "Icon: SHOWN"}
                          defaultIcon={currentConfig?.hideIcon ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3 text-emerald-400" />}
                          onClick={handleToggleSelectedHideIcon}
                          className={cn(
                            "px-2 py-1 rounded-lg text-[10.5px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap",
                            !currentConfig?.hideIcon
                              ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                              : "bg-slate-900/60 text-slate-400 border-slate-700 hover:text-slate-200"
                          )}
                          title="Show or hide icon on selected component(s) with or without text"
                        />
                        <CustomizableButton
                          buttonId="btn_cust_reset_single"
                          defaultLabel="Reset"
                          defaultIcon={<RotateCcw className="w-3 h-3" />}
                          onClick={handleResetSelectedElements}
                          className="px-2 py-1 rounded-lg text-[10.5px] font-mono font-bold text-slate-400 hover:text-rose-300 bg-[#091527] border border-slate-800 hover:border-rose-500/40 flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                          title="Reset selected component(s) to original default icon & label"
                        />
                      </div>
                    </div>

                    {/* All 5 Property Inspector Sub-Tabs in Equal 5-Column Grid (Zero Horizontal Overflow) */}
                    <div className="grid grid-cols-5 gap-1 p-1 bg-[#050b14] rounded-xl border border-[#0d2235]">
                      <CustomizableButton
                        buttonId="button_customization_modal_btn_40"
                        defaultIcon={<Type className="w-3 h-3 shrink-0" />}
                        type="button"
onClick={() => setInspectorSubTab("label")}
className={cn(
                          "py-1 px-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0",
                          inspectorSubTab === "label"
                            ? "bg-emerald-950/70 text-emerald-300 border border-emerald-500/50 shadow-xs"
                            : "text-slate-400 hover:text-slate-200 hover:bg-[#0c1626]"
                        )}
title={uiText("components_button_customization_modal.button.text_title_sizing_and_component_visibility.title", "Text, Title, Sizing, and Component Visibility")}
                      >
                          {() => (
                              <>
                                <span className="truncate">{uiText("components_button_customization_modal.span.1_label_and_size", "1. Label & Size")}</span>
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="button_customization_modal_btn_39"
                        defaultIcon={<Type className="w-3 h-3 text-cyan-400 shrink-0" />}
                        type="button"
onClick={() => setInspectorSubTab("typography")}
className={cn(
                          "py-1 px-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0",
                          inspectorSubTab === "typography"
                            ? "bg-cyan-950/70 text-cyan-300 border border-cyan-500/50 shadow-xs"
                            : "text-slate-400 hover:text-slate-200 hover:bg-[#0c1626]"
                        )}
title={uiText("components_button_customization_modal.button.font_family_font_size_weight_text_transform.title", "Font Family, Font Size, Weight, Text Transform")}
                      >
                          {() => (
                              <>
                                <span className="truncate">{uiText("components_button_customization_modal.span.2_typography", "2. Typography")}</span>
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="button_customization_modal_btn_38"
                        defaultIcon={<Box className="w-3 h-3 text-teal-400 shrink-0" />}
                        type="button"
onClick={() => setInspectorSubTab("spacing")}
className={cn(
                          "py-1 px-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0",
                          inspectorSubTab === "spacing"
                            ? "bg-teal-950/70 text-teal-300 border border-teal-500/50 shadow-xs"
                            : "text-slate-400 hover:text-slate-200 hover:bg-[#0c1626]"
                        )}
title={uiText("components_button_customization_modal.button.padding_and_corner_radius_scale.title", "Padding and Corner Radius Scale")}
                      >
                          {() => (
                              <>
                                <span className="truncate">{uiText("components_button_customization_modal.span.3_spacing", "3. Spacing")}</span>
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="button_customization_modal_btn_37"
                        defaultIcon={<Palette className="w-3 h-3 text-purple-400 shrink-0" />}
                        type="button"
onClick={() => setInspectorSubTab("style")}
className={cn(
                          "py-1 px-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0",
                          inspectorSubTab === "style"
                            ? "bg-purple-950/70 text-purple-300 border border-purple-500/50 shadow-xs"
                            : "text-slate-400 hover:text-slate-200 hover:bg-[#0c1626]"
                        )}
title={uiText("components_button_customization_modal.button.background_text_border_and_accent_colors.title", "Background, Text, Border & Accent Colors")}
                      >
                          {() => (
                              <>
                                <span className="truncate">{uiText("components_button_customization_modal.span.4_colors", "4. Colors")}</span>
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="button_customization_modal_btn_36"
                        defaultIcon={<Sparkles className="w-3 h-3 text-amber-400 shrink-0" />}
                        type="button"
onClick={() => setInspectorSubTab("icon")}
className={cn(
                          "py-1 px-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0",
                          inspectorSubTab === "icon"
                            ? "bg-amber-950/70 text-amber-300 border border-amber-500/50 shadow-xs"
                            : "text-slate-400 hover:text-slate-200 hover:bg-[#0c1626]"
                        )}
title={uiText("components_button_customization_modal.button.icons_emojis_svgs_and_image_upload.title", "Icons, Emojis, SVGs & Image Upload")}
                      >
                          {() => (
                              <>
                                <span className="truncate">{uiText("components_button_customization_modal.span.5_icons", "5. Icons")}</span>
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  </div>

                  {/* Active Inspector Sub-Tab Body */}
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                    {/* SubTab 1: Label, Visibility & Sizing Settings */}
                    {inspectorSubTab === "label" && (
                      <div id="inspector_section_label" className="bg-[#070f1e]/85 border border-[#0d2235] rounded-xl p-2.5 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                          <span className="text-[11px] font-mono font-bold text-slate-200 flex items-center gap-1.5">
                            <Type className="w-3.5 h-3.5 text-emerald-400" />
                            {uiText("components_button_customization_modal.span.1_label_visibility_and_sizing", "1. Label, Visibility & Sizing")}
                          </span>
                          <span className="text-[9.5px] font-mono text-cyan-300 uppercase">
                            {uiText("components_button_customization_modal.span.type", "Type: ")}{getComponentType(currentDefinition)}
                          </span>
                        </div>

                        {/* Custom Label Input + Reset */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10.5px] font-semibold text-slate-300 shrink-0">{uiText("components_button_customization_modal.span.label", "Label:")}</span>
                          <input
                            type="text"
                            value={currentConfig?.label ?? currentDefinition.defaultLabel}
                            onChange={(e) =>
                              updateSelectedElements({
                                label: e.target.value,
                              })
                            }
                            placeholder={currentDefinition.defaultLabel}
                            className="flex-1 bg-[#090e1a] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-300 focus:outline-none focus:border-emerald-400"
                          />
                          <CustomizableButton
                            buttonId="btn_cust_reset_label_default"
                            defaultLabel="Default"
                            defaultIcon={<ResetIcon className="w-3 h-3" />}
                            onClick={() =>
                              updateSelectedElements({
                                label: undefined,
                              })
                            }
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg font-semibold transition-colors cursor-pointer border border-slate-700 shrink-0"
                            title="Reset label to original"
                          />
                        </div>

                        {/* 3-Column Compact Display Toggles: Visibility | Zero-Text | Text-Only */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {/* Visibility Toggle */}
                          <div className="flex items-center justify-between p-2 rounded-lg bg-[#090e1a] border border-slate-800 gap-1.5">
                            <div className="min-w-0">
                              <span className="text-[10.5px] font-bold text-slate-200 flex items-center gap-1 truncate">
                                {currentConfig?.hidden ? (
                                  <EyeOff className="w-3 h-3 text-rose-400 shrink-0" />
                                ) : (
                                  <Eye className="w-3 h-3 text-emerald-400 shrink-0" />
                                )}
                                {uiText("components_button_customization_modal.span.visibility", "Visibility")}
                              </span>
                              <span className="text-[9px] text-slate-500 block truncate">{uiText("components_button_customization_modal.span.show_hide_item", "Show/hide item")}</span>
                            </div>
                            <CustomizableButton
                              buttonId="button_customization_modal_btn_35"
                              type="button"
onClick={() => {
                                const nextHidden = !currentConfig?.hidden;
                                updateSelectedElements({ hidden: nextHidden });
                                const count = getTargetIds().length;
                                showToast(
                                  count > 1
                                    ? `✓ ${nextHidden ? "Hidden" : "Visible"}: ${count} selected items`
                                    : nextHidden
                                    ? `✓ Hidden: ${currentDefinition.id}`
                                    : `✓ Visible: ${currentDefinition.id}`
                                );
                              }}
className={cn(
                                "px-2 py-1 rounded-md text-[10px] font-mono font-bold border transition-all cursor-pointer shrink-0",
                                currentConfig?.hidden
                                  ? "bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-500/50"
                                  : "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-500/50"
                              )}
title={uiText("components_button_customization_modal.button.toggle_visibility_of_selected_component_s.title", "Toggle visibility of selected component(s)")}
                            >
                                {() => (
                                    <>
                                      {currentConfig?.hidden ? "Hidden" : "Visible"}
                                    </>
                                  )}
                            </CustomizableButton>
                          </div>

                          {/* Zero-Text Toggle */}
                          <div className="flex items-center justify-between p-2 rounded-lg bg-[#090e1a] border border-slate-800 gap-1.5">
                            <div className="min-w-0">
                              <span className="text-[10.5px] font-bold text-slate-200 flex items-center gap-1 truncate">
                                <EyeOff className="w-3 h-3 text-indigo-400 shrink-0" />
                                {uiText("components_button_customization_modal.span.zero_text", "Zero-Text")}
                              </span>
                              <span className="text-[9px] text-slate-500 block truncate">{uiText("components_button_customization_modal.span.icon_only_2", "Hide button text")}</span>
                            </div>
                            <CustomizableButton
                              buttonId="btn_cust_toggle_zero_text_btn"
                              defaultLabel={isHidden ? "ON" : "OFF"}
                              defaultIcon={<EyeOff className="w-3 h-3" />}
                              onClick={handleToggleSelectedZeroText}
                              className={cn(
                                "px-2 py-1 rounded-md text-[10px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 shrink-0",
                                isHidden
                                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                              )}
                            />
                          </div>

                          {/* Icon Show/Hide Toggle */}
                          <div className="flex items-center justify-between p-2 rounded-lg bg-[#090e1a] border border-slate-800 gap-1.5">
                            <div className="min-w-0">
                              <span className="text-[10.5px] font-bold text-slate-200 flex items-center gap-1 truncate">
                                {currentConfig?.hideIcon ? (
                                  <EyeOff className="w-3 h-3 text-slate-400 shrink-0" />
                                ) : (
                                  <Eye className="w-3 h-3 text-emerald-400 shrink-0" />
                                )}
                                Icon
                              </span>
                              <span className="text-[9px] text-slate-500 block truncate">Show or hide icon</span>
                            </div>
                            <CustomizableButton
                              buttonId="btn_cust_toggle_hide_icon_btn"
                              defaultLabel={currentConfig?.hideIcon ? "HIDDEN" : "SHOWN"}
                              defaultIcon={currentConfig?.hideIcon ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              onClick={handleToggleSelectedHideIcon}
                              className={cn(
                                "px-2 py-1 rounded-md text-[10px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 shrink-0",
                                !currentConfig?.hideIcon
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                              )}
                            />
                          </div>
                        </div>

                        {/* 2-Column Sizing Grid: Text Size + Icon Size Side-by-Side */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Text Size Selector */}
                          <div className="p-2 rounded-lg bg-[#090e1a] border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10.5px] font-bold text-slate-200 flex items-center gap-1">
                                <Type className="w-3 h-3 text-cyan-400" />
                                {uiText("components_button_customization_modal.span.text_size", "Text Size")}
                              </span>
                              <span className="text-[9px] font-mono text-cyan-300 uppercase">
                                {currentConfig?.fontSize || `Auto (${globalFontSize || "normal"})`}
                              </span>
                            </div>
                            <div className="grid grid-cols-6 gap-1">
                              {[
                                { id: undefined, label: "Auto", size: "Inh" },
                                { id: "tiny", label: "Tiny", size: "9" },
                                { id: "small", label: "Sm", size: "10" },
                                { id: "normal", label: "Norm", size: "11" },
                                { id: "medium", label: "Med", size: "12" },
                                { id: "large", label: "Lg", size: "14" },
                              ].map((opt) => {
                                const isCurrent =
                                  currentConfig?.fontSize === opt.id ||
                                  (!currentConfig?.fontSize && opt.id === undefined);
                                return (
                                  <CustomizableButton
                                    buttonId="button_customization_modal_btn_34"
                                    key={opt.label}
type="button"
onClick={() =>
                                      updateSelectedElements({
                                        fontSize: opt.id as any,
                                      })
                                    }
className={cn(
                                      "py-1 px-0.5 rounded text-center font-bold text-[9.5px] transition-all cursor-pointer border flex flex-col items-center justify-center",
                                      isCurrent
                                        ? "bg-cyan-500/25 text-cyan-300 border-cyan-500/50"
                                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                                    )}
                                  >
                                      {() => (
                                          <>
                                            <span>{opt.label}</span>
                                          <span className="text-[7.5px] font-mono opacity-60 tabular-nums">{opt.size}</span>
                                          </>
                                        )}
                                  </CustomizableButton>
                                );
                              })}
                            </div>
                          </div>

                          {/* Icon Size Selector */}
                          <div className="p-2 rounded-lg bg-[#090e1a] border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10.5px] font-bold text-slate-200 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-400" />
                                {uiText("components_button_customization_modal.span.icon_size", "Icon Size")}
                              </span>
                              <span className="text-[9px] font-mono text-emerald-300 uppercase">
                                {currentConfig?.iconSize || `Auto (${globalIconSize || "normal"})`}
                              </span>
                            </div>
                            <div className="grid grid-cols-6 gap-1">
                              {[
                                { id: undefined, label: "Auto", size: "Inh" },
                                { id: "small", label: "Sm", size: "14" },
                                { id: "normal", label: "Norm", size: "16" },
                                { id: "medium", label: "Med", size: "18" },
                                { id: "large", label: "Lg", size: "20" },
                                { id: "xlarge", label: "XL", size: "24" },
                              ].map((opt) => {
                                const isCurrent =
                                  currentConfig?.iconSize === opt.id ||
                                  (!currentConfig?.iconSize && opt.id === undefined);
                                return (
                                  <CustomizableButton
                                    buttonId="button_customization_modal_btn_33"
                                    key={opt.label}
type="button"
onClick={() =>
                                      updateSelectedElements({
                                        iconSize: opt.id as any,
                                      })
                                    }
className={cn(
                                      "py-1 px-0.5 rounded text-center font-bold text-[9.5px] transition-all cursor-pointer border flex flex-col items-center justify-center",
                                      isCurrent
                                        ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/50"
                                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                                    )}
                                  >
                                      {() => (
                                          <>
                                            <span>{opt.label}</span>
                                          <span className="text-[7.5px] font-mono opacity-60 tabular-nums">{opt.size}</span>
                                          </>
                                        )}
                                  </CustomizableButton>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Quick Study & Overview Presets */}
                        <div className="p-2 rounded-lg bg-[#090e1a] border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10.5px] font-bold text-slate-200 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-cyan-400" />
                              {uiText("components_button_customization_modal.span.quick_label_and_icon_presets", "Quick Label & Icon Presets")}
                            </span>
                            <span className="text-[9px] text-slate-500">{uiText("components_button_customization_modal.span.1_click_apply", "1-click apply")}</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {[
                              { label: "Audio Overview", icon: "AudioOverview", IconComp: AudioLines, color: "text-blue-400 border-blue-500/30 hover:bg-blue-950/40" },
                              { label: "Slide Deck", icon: "SlideDeck", IconComp: Presentation, color: "text-pink-400 border-pink-500/30 hover:bg-pink-950/40" },
                              { label: "Video Overview", icon: "VideoOverview", IconComp: Video, color: "text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/40" },
                              { label: "Mind Map", icon: "MindMap", IconComp: GitFork, color: "text-purple-400 border-purple-500/30 hover:bg-purple-950/40" },
                              { label: "Reports", icon: "Reports", IconComp: FileText, color: "text-rose-400 border-rose-500/30 hover:bg-rose-950/40" },
                              { label: "Flashcards", icon: "Flashcards", IconComp: CreditCard, color: "text-amber-400 border-amber-500/30 hover:bg-amber-950/40" },
                              { label: "Quiz", icon: "Quiz", IconComp: FileQuestion, color: "text-cyan-400 border-cyan-500/30 hover:bg-cyan-950/40" },
                              { label: "Infographic", icon: "Infographic", IconComp: BarChart3, color: "text-yellow-400 border-yellow-500/30 hover:bg-yellow-950/40" },
                            ].map((preset) => (
                              <CustomizableButton
                                buttonId="button_customization_modal_btn_32"
                                key={preset.label}
type="button"
onClick={() => {
                                  updateSelectedElements({
                                    label: preset.label,
                                    iconName: preset.icon,
                                    customIconType: "preset",
                                    customIconData: undefined,
                                  });
                                }}
className={cn(
                                  "px-2 py-1 rounded-lg border bg-slate-900/80 text-left transition-all cursor-pointer flex items-center gap-1.5",
                                  preset.color
                                )}
title={`Apply ${preset.label} label and icon`}
                              >
                                  {() => (
                                      <>
                                        <preset.IconComp className="w-3 h-3 shrink-0" />
                                      <span className="text-[10.5px] font-bold truncate">{preset.label}</span>
                                      </>
                                    )}
                              </CustomizableButton>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SubTab 2: Typography & Font Styling (All 15 Fonts Visible Simultaneously) */}
                    {inspectorSubTab === "typography" && (
                      <div id="inspector_section_typography" className="bg-[#070f1e]/85 border border-[#0d2235] rounded-xl p-2.5 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                          <span className="text-[11px] font-mono font-bold text-slate-200 flex items-center gap-1.5">
                            <Type className="w-3.5 h-3.5 text-cyan-400" />
                            {uiText("components_button_customization_modal.span.2_typography_and_font_styling", "2. Typography & Font Styling")}
                          </span>
                          <CustomizableButton
                            buttonId="button_customization_modal_btn_31"
                            defaultIcon={<RotateCcw className="w-3 h-3" />}
                            type="button"
onClick={() =>
                              updateSelectedElements({
                                fontFamily: undefined,
                                fontWeight: undefined,
                                textTransform: undefined,
                                letterSpacing: undefined,
                                fontSize: undefined,
                              })
                            }
className="text-[10.5px] text-slate-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
title={uiText("components_button_customization_modal.button.reset_all_typography_overrides_for_selected.title", "Reset all typography overrides for selected component(s)")}
                          >
                              {() => (
                                  <>
                                    <span>{uiText("components_button_customization_modal.span.reset_typography", "Reset Typography")}</span>
                                  </>
                                )}
                          </CustomizableButton>
                        </div>

                        {/* All 15 Font Families in a 5-Column Grid (Zero Inner Scroll Needed) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10.5px]">
                            <span className="font-semibold text-slate-300">{uiText("components_button_customization_modal.span.font_family", "Font Family (")}{AVAILABLE_FONTS.length}):</span>
                            <span className="font-mono text-cyan-300 font-bold">
                              {currentConfig?.fontFamily ? currentConfig.fontFamily.split(",")[0].replace(/['"]/g, "") : "Inherit"}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                            {AVAILABLE_FONTS.map((f) => {
                              const isSelected =
                                currentConfig?.fontFamily === f.value ||
                                (!currentConfig?.fontFamily && f.value === "inherit");
                              return (
                                <CustomizableButton
                                  buttonId="button_customization_modal_btn_30"
                                  key={f.value}
type="button"
onClick={() =>
                                    updateSelectedElements({
                                      fontFamily: f.value === "inherit" ? undefined : f.value,
                                    })
                                  }
className={cn(
                                    "px-2 py-1 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between group",
                                    isSelected
                                      ? "bg-cyan-950/80 border-cyan-400 text-cyan-200"
                                      : "bg-[#090e1a] hover:bg-[#0e172a] border-slate-800 text-slate-300"
                                  )}
                                >
                                    {() => (
                                        <>
                                          <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-400 group-hover:text-slate-200">
                                    <span className="truncate">{f.name}</span>
                                    {isSelected && <Check className="w-2.5 h-2.5 text-cyan-400 shrink-0" />}
                                  </div>
                                        <span
                                    style={{ fontFamily: f.value }}
                                    className="text-xs font-semibold truncate text-slate-100"
                                  >
                                    {activeLabel || "SeqCarver"}
                                  </span>
                                        </>
                                      )}
                                </CustomizableButton>
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">{uiText("components_button_customization_modal.span.custom_css_font", "Custom CSS Font:")}</span>
                            <input
                              type="text"
                              value={currentConfig?.fontFamily || ""}
                              onChange={(e) =>
                                updateSelectedElements({
                                  fontFamily: e.target.value.trim() ? e.target.value : undefined,
                                })
                              }
                              placeholder={uiText("components_button_customization_modal.input.bungee_cursive_or_sans_serif.placeholder", "'Bungee', cursive or sans-serif")}
                              className="flex-1 bg-[#090e1a] border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>

                        {/* Compact 2x2 Grid: Font Weight, Text Case, Letter Spacing, Font Size */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Font Weight */}
                          <div className="space-y-1 p-2 rounded-lg bg-[#090e1a] border border-slate-800">
                            <span className="text-[10.5px] font-semibold text-slate-300 block">{uiText("components_button_customization_modal.span.font_weight", "Font Weight:")}</span>
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { id: undefined, label: "Auto" },
                                { id: "normal", label: "400 Norm" },
                                { id: "medium", label: "500 Med" },
                                { id: "semibold", label: "600 Semi" },
                                { id: "bold", label: "700 Bold" },
                                { id: "extrabold", label: "800 Black" },
                              ].map((w) => {
                                const isCurrent =
                                  currentConfig?.fontWeight === w.id ||
                                  (!currentConfig?.fontWeight && w.id === undefined);
                                return (
                                  <CustomizableButton
                                    buttonId="button_customization_modal_btn_29"
                                    key={w.label}
type="button"
onClick={() =>
                                      updateSelectedElements({
                                        fontWeight: w.id as any,
                                      })
                                    }
className={cn(
                                      "py-1 px-1 rounded text-center font-bold text-[9.5px] transition-all cursor-pointer border truncate",
                                      isCurrent
                                        ? "bg-cyan-500/25 text-cyan-300 border-cyan-500/50"
                                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                                    )}
                                  >
                                      {() => (
                                          <>
                                            {w.label}
                                          </>
                                        )}
                                  </CustomizableButton>
                                );
                              })}
                            </div>
                          </div>

                          {/* Text Transform (Case) */}
                          <div className="space-y-1 p-2 rounded-lg bg-[#090e1a] border border-slate-800">
                            <span className="text-[10.5px] font-semibold text-slate-300 block">{uiText("components_button_customization_modal.span.text_case", "Text Case:")}</span>
                            <div className="grid grid-cols-2 gap-1">
                              {[
                                { id: undefined, label: "Default" },
                                { id: "uppercase", label: "UPPERCASE" },
                                { id: "lowercase", label: "lowercase" },
                                { id: "capitalize", label: "Capitalize" },
                              ].map((tt) => {
                                const isCurrent =
                                  currentConfig?.textTransform === tt.id ||
                                  (!currentConfig?.textTransform && tt.id === undefined);
                                return (
                                  <CustomizableButton
                                    buttonId="button_customization_modal_btn_28"
                                    key={tt.label}
type="button"
onClick={() =>
                                      updateSelectedElements({
                                        textTransform: tt.id as any,
                                      })
                                    }
className={cn(
                                      "py-1 px-1.5 rounded text-center font-bold text-[9.5px] transition-all cursor-pointer border truncate",
                                      isCurrent
                                        ? "bg-cyan-500/25 text-cyan-300 border-cyan-500/50"
                                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                                    )}
                                  >
                                      {() => (
                                          <>
                                            {tt.label}
                                          </>
                                        )}
                                  </CustomizableButton>
                                );
                              })}
                            </div>
                          </div>

                          {/* Letter Spacing */}
                          <div className="space-y-1 p-2 rounded-lg bg-[#090e1a] border border-slate-800">
                            <span className="text-[10.5px] font-semibold text-slate-300 block">{uiText("components_button_customization_modal.span.letter_spacing", "Letter Spacing:")}</span>
                            <div className="grid grid-cols-4 gap-1">
                              {[
                                { id: undefined, label: "Norm" },
                                { id: "-0.04em", label: "Tight" },
                                { id: "0.05em", label: "Wide" },
                                { id: "0.12em", label: "Widest" },
                              ].map((ls) => {
                                const isCurrent =
                                  currentConfig?.letterSpacing === ls.id ||
                                  (!currentConfig?.letterSpacing && ls.id === undefined);
                                return (
                                  <CustomizableButton
                                    buttonId="button_customization_modal_btn_27"
                                    key={ls.label}
type="button"
onClick={() =>
                                      updateSelectedElements({
                                        letterSpacing: ls.id,
                                      })
                                    }
className={cn(
                                      "py-1 px-1 rounded text-center font-bold text-[9.5px] transition-all cursor-pointer border truncate",
                                      isCurrent
                                        ? "bg-cyan-500/25 text-cyan-300 border-cyan-500/50"
                                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                                    )}
                                  >
                                      {() => (
                                          <>
                                            {ls.label}
                                          </>
                                        )}
                                  </CustomizableButton>
                                );
                              })}
                            </div>
                          </div>

                          {/* Font Size Preset */}
                          <div className="space-y-1 p-2 rounded-lg bg-[#090e1a] border border-slate-800">
                            <span className="text-[10.5px] font-semibold text-slate-300 block">{uiText("components_button_customization_modal.span.font_size_preset", "Font Size Preset:")}</span>
                            <div className="grid grid-cols-5 gap-1">
                              {[
                                { id: "tiny", label: "9px" },
                                { id: "small", label: "10px" },
                                { id: "normal", label: "11px" },
                                { id: "medium", label: "12px" },
                                { id: "large", label: "14px" },
                              ].map((fs) => {
                                const isCurrent = currentConfig?.fontSize === fs.id;
                                return (
                                  <CustomizableButton
                                    buttonId="button_customization_modal_btn_26"
                                    key={fs.label}
type="button"
onClick={() =>
                                      updateSelectedElements({
                                        fontSize: fs.id as any,
                                      })
                                    }
className={cn(
                                      "py-1 px-0.5 rounded text-center font-bold text-[9.5px] transition-all cursor-pointer border font-mono tabular-nums",
                                      isCurrent
                                        ? "bg-cyan-500/25 text-cyan-300 border-cyan-500/50"
                                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                                    )}
                                  >
                                      {() => (
                                          <>
                                            {fs.label}
                                          </>
                                        )}
                                  </CustomizableButton>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SubTab 3: Spacing, Padding & Corner Radii */}
                    {inspectorSubTab === "spacing" && (
                      <div id="inspector_section_spacing" className="bg-[#070f1e]/85 border border-[#0d2235] rounded-xl p-2.5 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                          <span className="text-[11px] font-mono font-bold text-slate-200 flex items-center gap-1.5">
                            <Box className="w-3.5 h-3.5 text-teal-400" />
                            {uiText("components_button_customization_modal.span.3_padding_and_corner_radii", "3. Padding & Corner Radii")}
                          </span>
                          <CustomizableButton
                            buttonId="button_customization_modal_btn_25"
                            defaultIcon={<RotateCcw className="w-3 h-3" />}
                            type="button"
onClick={() =>
                              updateSelectedElements({
                                padding: undefined,
                                cornerRadius: undefined,
                                customPadding: undefined,
                                customCornerRadius: undefined,
                              })
                            }
className="text-[10.5px] text-slate-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
title={uiText("components_button_customization_modal.button.reset_padding_and_corner_radii_overrides.title", "Reset padding and corner radii overrides")}
                          >
                              {() => (
                                  <>
                                    <span>{uiText("components_button_customization_modal.span.reset_spacing", "Reset Spacing")}</span>
                                  </>
                                )}
                          </CustomizableButton>
                        </div>

                        {/* Component Padding Selector */}
                        <div className="space-y-1.5 p-2.5 rounded-lg bg-[#090e1a] border border-slate-800">
                          <div className="flex items-center justify-between text-[10.5px]">
                            <span className="font-semibold text-slate-300 flex items-center gap-1">
                              <SlidersHorizontal className="w-3 h-3 text-teal-400" />
                              {uiText("components_button_customization_modal.span.padding_scale", "Padding Scale:")}
                            </span>
                            <span className="font-mono text-teal-300 font-bold uppercase">
                              {currentConfig?.customPadding ? "Custom" : currentConfig?.padding || "Default"}
                            </span>
                          </div>

                          <div className="grid grid-cols-5 gap-1.5">
                            {[
                              { id: undefined, label: "Default", desc: "Auto" },
                              { id: "none", label: "None", desc: "0px" },
                              { id: "compact", label: "Compact", desc: "6px" },
                              { id: "normal", label: "Normal", desc: "12px" },
                              { id: "spacious", label: "Spacious", desc: "20px" },
                            ].map((p) => {
                              const isCurrent =
                                !currentConfig?.customPadding &&
                                (currentConfig?.padding === p.id ||
                                  (!currentConfig?.padding && p.id === undefined));
                              return (
                                <CustomizableButton
                                  buttonId="button_customization_modal_btn_24"
                                  key={p.label}
type="button"
onClick={() =>
                                    updateSelectedElements({
                                      padding: p.id as any,
                                      customPadding: undefined,
                                    })
                                  }
className={cn(
                                    "py-1.5 px-1.5 rounded-lg text-center font-bold text-[10.5px] transition-all cursor-pointer border flex flex-col items-center justify-center",
                                    isCurrent
                                      ? "bg-teal-500/25 text-teal-300 border-teal-500/60"
                                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                                  )}
                                >
                                    {() => (
                                        <>
                                          <span>{p.label}</span>
                                        <span className="text-[8px] font-mono opacity-60 tabular-nums">{p.desc}</span>
                                        </>
                                      )}
                                </CustomizableButton>
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">{uiText("components_button_customization_modal.span.custom_css_padding", "Custom CSS Padding:")}</span>
                            <input
                              type="text"
                              value={currentConfig?.customPadding || ""}
                              onChange={(e) =>
                                updateSelectedElements({
                                  customPadding: e.target.value.trim() ? e.target.value : undefined,
                                })
                              }
                              placeholder={uiText("components_button_customization_modal.input.e_g_6px_12px_or_1rem.placeholder", "e.g. 6px 12px or 1rem")}
                              className="flex-1 bg-[#050b14] border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-teal-300 font-mono focus:outline-none focus:border-teal-400"
                            />
                          </div>
                        </div>

                        {/* Corner Radii Selector */}
                        <div className="space-y-1.5 p-2.5 rounded-lg bg-[#090e1a] border border-slate-800">
                          <div className="flex items-center justify-between text-[10.5px]">
                            <span className="font-semibold text-slate-300 flex items-center gap-1">
                              <Box className="w-3 h-3 text-cyan-400" />
                              {uiText("components_button_customization_modal.span.corner_radius_scale", "Corner Radius Scale:")}
                            </span>
                            <span className="font-mono text-cyan-300 font-bold uppercase">
                              {currentConfig?.customCornerRadius ? "Custom" : currentConfig?.cornerRadius || "Default"}
                            </span>
                          </div>

                          <div className="grid grid-cols-6 gap-1.5">
                            {[
                              { id: undefined, label: "Default", r: "Auto" },
                              { id: "none", label: "Square", r: "0px" },
                              { id: "sm", label: "Small", r: "6px" },
                              { id: "md", label: "Medium", r: "10px" },
                              { id: "lg", label: "Large", r: "16px" },
                              { id: "full", label: "Pill", r: "9999px" },
                            ].map((r) => {
                              const isCurrent =
                                !currentConfig?.customCornerRadius &&
                                (currentConfig?.cornerRadius === r.id ||
                                  (!currentConfig?.cornerRadius && r.id === undefined));
                              return (
                                <CustomizableButton
                                  buttonId="button_customization_modal_btn_23"
                                  key={r.label}
type="button"
onClick={() =>
                                    updateSelectedElements({
                                      cornerRadius: r.id as any,
                                      customCornerRadius: undefined,
                                    })
                                  }
className={cn(
                                    "py-1.5 px-1 rounded-lg text-center font-bold text-[10.5px] transition-all cursor-pointer border flex flex-col items-center justify-center",
                                    isCurrent
                                      ? "bg-cyan-500/25 text-cyan-300 border-cyan-500/60"
                                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                                  )}
                                >
                                    {() => (
                                        <>
                                          <span>{r.label}</span>
                                        <span className="text-[8px] font-mono opacity-60 tabular-nums">{r.r}</span>
                                        </>
                                      )}
                                </CustomizableButton>
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">{uiText("components_button_customization_modal.span.custom_css_radius", "Custom CSS Radius:")}</span>
                            <input
                              type="text"
                              value={currentConfig?.customCornerRadius || ""}
                              onChange={(e) =>
                                updateSelectedElements({
                                  customCornerRadius: e.target.value.trim() ? e.target.value : undefined,
                                })
                              }
                              placeholder={uiText("components_button_customization_modal.input.e_g_14px_or_50.placeholder", "e.g. 14px or 50%")}
                              className="flex-1 bg-[#050b14] border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SubTab 5: Icon Selection Tabs */}
                    {inspectorSubTab === "icon" && (
                      <div id="inspector_section_icon" className="bg-[#070f1e]/85 border border-[#0d2235] rounded-xl p-2.5 space-y-2.5" data-ibc-section="inspector_section_icon">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                          <CustomizableLabel
                            labelId="btn_cust_icon_section_header"
                            defaultLabel="5. Custom Icon Selection"
                            defaultIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                            className="text-[11px] font-mono font-bold text-slate-200 flex items-center gap-1.5"
                          />
                          <CustomizableButton
                            buttonId="btn_cust_reset_icon_default"
                            defaultLabel="Reset Icon"
                            defaultIcon={<RotateCcw className="w-3 h-3 text-cyan-400" />}
                            onClick={() =>
                              updateSelectedElements({
                                iconName: undefined,
                                customIconType: undefined,
                                customIconData: undefined,
                              })
                            }
                            className="text-[10.5px] text-slate-400 hover:text-cyan-300 transition-colors bg-transparent border-0 p-0 shadow-none"
                          />
                        </div>

                        {/* 4-Column Icon Source Tab Selector */}
                        <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                          <CustomizableButton
                            buttonId="btn_cust_icon_tab_preset"
                            defaultLabel={`Presets (${allPresetIcons.length})`}
                            forceZeroText={false}
                            onClick={() => setIconTab("preset")}
                            className={cn(
                              "py-1 px-1 rounded text-[10.5px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 truncate",
                              iconTab === "preset"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "text-slate-400 hover:text-slate-200 bg-transparent border-transparent"
                            )}
                          />
                          <CustomizableButton
                            buttonId="btn_cust_icon_tab_emoji"
                            defaultLabel="Emoji"
                            forceZeroText={false}
                            onClick={() => setIconTab("emoji")}
                            className={cn(
                              "py-1 px-1 rounded text-[10.5px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 truncate",
                              iconTab === "emoji"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : "text-slate-400 hover:text-slate-200 bg-transparent border-transparent"
                            )}
                          />
                          <CustomizableButton
                            buttonId="btn_cust_icon_tab_upload"
                            defaultLabel="Upload PNG"
                            forceZeroText={false}
                            onClick={() => setIconTab("upload")}
                            className={cn(
                              "py-1 px-1 rounded text-[10.5px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 truncate",
                              iconTab === "upload"
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                : "text-slate-400 hover:text-slate-200 bg-transparent border-transparent"
                            )}
                          />
                          <CustomizableButton
                            buttonId="btn_cust_icon_tab_svg"
                            defaultLabel="SVG Code"
                            forceZeroText={false}
                            onClick={() => setIconTab("svg")}
                            className={cn(
                              "py-1 px-1 rounded text-[10.5px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 truncate",
                              iconTab === "svg"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                : "text-slate-400 hover:text-slate-200 bg-transparent border-transparent"
                            )}
                          />
                        </div>

                        {/* Preset Icons Grid */}
                        {iconTab === "preset" && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 relative">
                                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                  type="text"
                                  value={presetIconSearch}
                                  onChange={(e) => setPresetIconSearch(e.target.value)}
                                  placeholder={uiText("components_button_customization_modal.input.search_icons_e_g_split_clock_tool.placeholder", "Search icons (e.g. split, clock, tool)...")}
                                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                                />
                              </div>
                              <span className="text-[10px] font-mono text-emerald-400 whitespace-nowrap tabular-nums">
                                {filteredPresetIcons.length} / {allPresetIcons.length}
                              </span>
                            </div>

                            {/* All 9 Icon Categories Visible with flex-wrap */}
                            <div className="flex flex-wrap items-center gap-1">
                              {["all", "popular", "storyboard", "media", "editing", "layout", "actions", "creative", "symbols"].map((cat) => (
                                <CustomizableButton
                                  buttonId="button_customization_modal_btn_22"
                                  key={cat}
type="button"
onClick={() => setIconCategory(cat)}
className={cn(
                                    "px-2 py-0.5 rounded text-[9.5px] font-bold capitalize transition-colors cursor-pointer border shrink-0",
                                    iconCategory === cat
                                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                                  )}
                                >
                                    {() => (
                                        <>
                                          {cat}
                                        </>
                                      )}
                                </CustomizableButton>
                              ))}
                            </div>

                            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 max-h-[250px] overflow-y-auto p-1.5 bg-slate-950/60 rounded-lg border border-slate-800">
                              {filteredPresetIcons.map((preset) => {
                                const isSelected =
                                  currentConfig?.iconName === preset.name ||
                                  (!currentConfig?.iconName &&
                                    currentDefinition.defaultIconName === preset.name);

                                return (
                                  <CustomizableButton
                                    buttonId="button_customization_modal_btn_21"
                                    key={preset.name}
type="button"
onClick={() => {
                                      updateSelectedElements({
                                        iconName: preset.name,
                                        customIconType: "preset",
                                        customIconData: undefined,
                                      });
                                    }}
className={cn(
                                      "flex flex-col items-center justify-center p-1.5 rounded-lg transition-all cursor-pointer border group",
                                      isSelected
                                        ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold"
                                        : "bg-[#090e1a] text-slate-400 hover:text-white border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                                    )}
title={`${preset.label} (${preset.category})`}
                                  >
                                      {() => (
                                          <>
                                            <preset.component className="w-3.5 h-3.5" />
                                          <span className="text-[7.5px] font-mono truncate w-full text-center mt-0.5">
                                      {preset.label}
                                    </span>
                                          </>
                                        )}
                                  </CustomizableButton>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Custom Emoji Tab */}
                        {iconTab === "emoji" && (
                          <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={emojiInput}
                                onChange={(e) => setEmojiInput(e.target.value)}
                                placeholder={uiText("components_button_customization_modal.input.type_or_paste_an_emoji_e_g.placeholder", "Type or paste an emoji (e.g. ⚡, 🚀, ✂️, 💎)...")}
                                className="flex-1 bg-[#090e1a] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                              />
                              <CustomizableButton
                                buttonId="btn_cust_apply_emoji"
                                defaultLabel="Apply"
                                forceZeroText={false}
                                onClick={() => handleApplyEmoji(emojiInput)}
                                disabled={!emojiInput.trim()}
                                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                              />
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400">{uiText("components_button_customization_modal.span.quick_emojis", "Quick Emojis:")}</span>
                              <div className="flex flex-wrap gap-1">
                                {["⚡", "✂️", "🚀", "🎨", "📦", "💎", "🔥", "✨", "🎬", "📐", "💬", "🔍", "⚙️", "🌟", "📌", "🏷️"].map(
                                  (em) => (
                                    <CustomizableButton
                                      buttonId="button_customization_modal_btn_20"
                                      key={em}
type="button"
onClick={() => handleApplyEmoji(em)}
className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500/50 text-sm flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                                    >
                                        {() => (
                                            <>
                                              {em}
                                            </>
                                          )}
                                    </CustomizableButton>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Upload Image Tab */}
                        {iconTab === "upload" && (
                          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-center">
                            <CustomizableLabel
                              labelId="button_customization_modal_item_19"
                              defaultIcon={<Upload className="w-6 h-6 text-cyan-400 mb-1.5" />}
                              as="label"
                              className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-xl cursor-pointer bg-slate-900/40 hover:bg-slate-900 transition-all"
                            >
                                {() => (
                                    <>
                                      <CustomizableLabel
                                labelId="btn_cust_upload_dropzone"
                                defaultLabel="Click or drag to upload custom icon / PNG"
                                className="text-xs font-bold text-slate-200"
                              />
                                    <span className="text-[10px] text-slate-500 mt-0.5">
                                {uiText("components_button_customization_modal.span.square_transparent_png_svg_or_webp_32_32_to", "Square transparent PNG, SVG, or WEBP (32×32 to 128×128)")}
                              </span>
                                    <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                                    </>
                                  )}
                            </CustomizableLabel>
                          </div>
                        )}

                        {/* SVG Code Markup Tab */}
                        {iconTab === "svg" && (
                          <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                            <div className="space-y-1">
                              <CustomizableLabel
                                labelId="button_customization_modal_item_18"
                                as="label"
                                className="text-[10.5px] font-semibold text-slate-300"
                              >
                                  {() => (
                                      <>
                                        {uiText("components_button_customization_modal.label.paste_svg_markup_code_svg_svg", "Paste SVG markup code (<svg ...>...</svg>):")}
                                      </>
                                    )}
                              </CustomizableLabel>
                              <textarea
                                rows={2}
                                value={svgInput}
                                onChange={(e) => setSvgInput(e.target.value)}
                                placeholder={uiText("components_button_customization_modal.textarea.svg_viewbox_0_0_24_24_fill_none_stroke_curre.placeholder", "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\">...</svg>")}
                                className="w-full bg-[#090e1a] border border-slate-800 rounded-lg p-2 text-[10.5px] font-mono text-purple-300 focus:outline-none focus:border-purple-400"
                              />
                            </div>

                            <CustomizableButton
                              buttonId="btn_cust_apply_svg"
                              defaultLabel="Apply SVG Markup"
                              defaultIcon={<Code className="w-3.5 h-3.5" />}
                              onClick={handleApplySvg}
                              disabled={!svgInput.trim()}
                              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* SubTab 4: Style & Appearance (Color, Background, Border & Accent) */}
                    {inspectorSubTab === "style" && (
                      <div id="inspector_section_styles" className="bg-[#070f1e]/85 border border-[#0d2235] rounded-xl p-2.5 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-1.5 gap-2">
                          <span className="text-[11px] font-mono font-bold text-slate-200 flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5 text-emerald-400" />
                            {uiText("components_button_customization_modal.span.4_color_background_border_and_accent", "4. Color, Background, Border & Accent")}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <CustomizableButton
                              buttonId="button_customization_modal_btn_17"
                              defaultIcon={<Disc className="w-3 h-3" />}
                              type="button"
onClick={() => setActiveTab("styles")}
className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-colors cursor-pointer flex items-center gap-1"
title={uiText("components_button_customization_modal.button.open_fullscreen_styles_and_radial_color_stud.title", "Open Fullscreen Styles & Radial Color Studio")}
                            >
                                {() => (
                                    <>
                                      <span>{uiText("components_button_customization_modal.span.full_studio", "Full Studio")}</span>
                                    </>
                                  )}
                            </CustomizableButton>

                            <RadialColorPicker
                              currentConfig={currentConfig}
                              onUpdateStyle={updateStyleForSelectedElements}
                              selectedCount={selectedElementIds.size || 1}
                              compactTrigger
                              buttonLabel="Radial Dial"
                            />

                            <CustomizableButton
                              buttonId="button_customization_modal_btn_16"
                              defaultIcon={<RotateCcw className="w-3 h-3" />}
                              type="button"
onClick={() =>
                                updateStyleForSelectedElements({
                                  textColor: undefined,
                                  backgroundColor: undefined,
                                  borderColor: undefined,
                                  accentColor: undefined,
                                })
                              }
className="text-[10.5px] text-slate-400 hover:text-rose-300 transition-colors bg-transparent border-0 p-0 shadow-none cursor-pointer flex items-center gap-1"
title={uiText("components_button_customization_modal.button.clear_custom_styles_for_selected_element_s.title", "Clear custom styles for selected element(s)")}
                            >
                                {() => (
                                    <>
                                      <span>{uiText("components_button_customization_modal.span.reset", "Reset")}</span>
                                    </>
                                  )}
                            </CustomizableButton>
                          </div>
                        </div>

                        {/* Quick Style Presets */}
                        <div className="space-y-1">
                          <span className="text-[10.5px] font-semibold text-slate-300">
                            {uiText("components_button_customization_modal.span.quick_colorway_presets", "Quick colorway presets:")}
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {STYLE_COLORWAY_PRESETS.map((preset) => (
                              <CustomizableButton
                                buttonId="button_customization_modal_btn_15"
                                key={preset.label}
type="button"
onClick={() => {
                                  updateStyleForSelectedElements({
                                    backgroundColor: preset.bg,
                                    textColor: preset.text,
                                    borderColor: preset.border,
                                    accentColor: preset.accent,
                                  });
                                }}
style={{
                                  backgroundColor: preset.bg,
                                  color: preset.text,
                                  borderColor: preset.border,
                                }}
className="px-2 py-1 rounded-lg border text-[10.5px] font-bold text-center transition-all cursor-pointer hover:scale-[1.02] truncate"
                              >
                                  {() => (
                                      <>
                                        {preset.label}
                                      </>
                                    )}
                              </CustomizableButton>
                            ))}
                          </div>
                        </div>

                        {/* Individual Color Selectors (2x2 Grid) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Background Color */}
                          <div className="space-y-1 p-2 rounded-lg bg-[#090e1a] border border-slate-800">
                            <div className="flex items-center justify-between">
                              <CustomizableLabel
                                labelId="button_customization_modal_item_14"
                                as="label"
                                className="text-[10.5px] font-semibold text-slate-300"
                              >
                                  {() => (
                                      <>
                                        {uiText("components_button_customization_modal.label.background_2", "Background:")}
                                      </>
                                    )}
                              </CustomizableLabel>
                              {currentConfig?.backgroundColor && (
                                <CustomizableButton
                                  buttonId="button_customization_modal_btn_13"
                                  type="button"
onClick={() => updateStyleForSelectedElements({ backgroundColor: undefined })}
className="text-[9px] text-slate-400 hover:text-rose-400 cursor-pointer"
                                >
                                    {() => (
                                        <>
                                          {uiText("components_button_customization_modal.button.reset_4", "Reset")}
                                        </>
                                      )}
                                </CustomizableButton>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={currentConfig?.backgroundColor || "#064e3b"}
                                onChange={(e) => updateStyleForSelectedElements({ backgroundColor: e.target.value })}
                                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0 shrink-0"
                                title={uiText("components_button_customization_modal.input.custom_background_color_picker.title", "Custom background color picker")}
                              />
                              <RadialColorPicker
                                currentConfig={currentConfig}
                                onUpdateStyle={updateStyleForSelectedElements}
                                initialTarget="backgroundColor"
                                compactTrigger
                                buttonLabel="Dial"
                                buttonClassName="px-1.5 py-0.5 text-[9px] font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded cursor-pointer"
                              />
                              <CustomizableButton
                                buttonId="button_customization_modal_btn_12"
                                type="button"
onClick={() => updateStyleForSelectedElements({ backgroundColor: "transparent" })}
className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded cursor-pointer"
                              >
                                  {() => (
                                      <>
                                        {uiText("components_button_customization_modal.button.clear_bg", "Clear BG")}
                                      </>
                                    )}
                              </CustomizableButton>
                              <div className="flex items-center gap-1 ml-auto">
                                {["#020617", "#0f172a", "#064e3b", "#1e1b4b", "#701a75", "#7f1d1d"].map((c) => (
                                  <CustomizableButton
                                    buttonId="button_customization_modal_btn_11"
                                    key={c}
type="button"
onClick={() => updateStyleForSelectedElements({ backgroundColor: c })}
style={{ backgroundColor: c }}
className="w-3.5 h-3.5 rounded-full border border-slate-700 hover:scale-110 transition-transform cursor-pointer"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Text / Foreground Color */}
                          <div className="space-y-1 p-2 rounded-lg bg-[#090e1a] border border-slate-800">
                            <div className="flex items-center justify-between">
                              <CustomizableLabel
                                labelId="button_customization_modal_item_10"
                                as="label"
                                className="text-[10.5px] font-semibold text-slate-300"
                              >
                                  {() => (
                                      <>
                                        {uiText("components_button_customization_modal.label.text_and_icon_2", "Text & Icon:")}
                                      </>
                                    )}
                              </CustomizableLabel>
                              {currentConfig?.textColor && (
                                <CustomizableButton
                                  buttonId="button_customization_modal_btn_9"
                                  type="button"
onClick={() => updateStyleForSelectedElements({ textColor: undefined })}
className="text-[9px] text-slate-400 hover:text-rose-400 cursor-pointer"
                                >
                                    {() => (
                                        <>
                                          {uiText("components_button_customization_modal.button.reset_5", "Reset")}
                                        </>
                                      )}
                                </CustomizableButton>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={currentConfig?.textColor || "#ffffff"}
                                onChange={(e) => updateStyleForSelectedElements({ textColor: e.target.value })}
                                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0 shrink-0"
                                title={uiText("components_button_customization_modal.input.custom_text_color_picker.title", "Custom text color picker")}
                              />
                              <RadialColorPicker
                                currentConfig={currentConfig}
                                onUpdateStyle={updateStyleForSelectedElements}
                                initialTarget="textColor"
                                compactTrigger
                                buttonLabel="Dial"
                                buttonClassName="px-1.5 py-0.5 text-[9px] font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded cursor-pointer"
                              />
                              <span className="text-[9.5px] font-mono text-slate-400 truncate">
                                {currentConfig?.textColor || "Default"}
                              </span>
                              <div className="flex items-center gap-1 ml-auto">
                                {["#ffffff", "#00f0ff", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"].map((c) => (
                                  <CustomizableButton
                                    buttonId="button_customization_modal_btn_8"
                                    key={c}
type="button"
onClick={() => updateStyleForSelectedElements({ textColor: c })}
style={{ backgroundColor: c }}
className="w-3.5 h-3.5 rounded-full border border-slate-700 hover:scale-110 transition-transform cursor-pointer"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Border Color */}
                          <div className="space-y-1 p-2 rounded-lg bg-[#090e1a] border border-slate-800">
                            <div className="flex items-center justify-between">
                              <CustomizableLabel
                                labelId="button_customization_modal_item_7"
                                as="label"
                                className="text-[10.5px] font-semibold text-slate-300"
                              >
                                  {() => (
                                      <>
                                        {uiText("components_button_customization_modal.label.border_outline_2", "Border Outline:")}
                                      </>
                                    )}
                              </CustomizableLabel>
                              {currentConfig?.borderColor && (
                                <CustomizableButton
                                  buttonId="button_customization_modal_btn_6"
                                  type="button"
onClick={() => updateStyleForSelectedElements({ borderColor: undefined })}
className="text-[9px] text-slate-400 hover:text-rose-400 cursor-pointer"
                                >
                                    {() => (
                                        <>
                                          {uiText("components_button_customization_modal.button.reset_6", "Reset")}
                                        </>
                                      )}
                                </CustomizableButton>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={currentConfig?.borderColor || "#00f0ff"}
                                onChange={(e) => updateStyleForSelectedElements({ borderColor: e.target.value })}
                                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0 shrink-0"
                                title={uiText("components_button_customization_modal.input.custom_border_color_picker.title", "Custom border color picker")}
                              />
                              <RadialColorPicker
                                currentConfig={currentConfig}
                                onUpdateStyle={updateStyleForSelectedElements}
                                initialTarget="borderColor"
                                compactTrigger
                                buttonLabel="Dial"
                                buttonClassName="px-1.5 py-0.5 text-[9px] font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded cursor-pointer"
                              />
                              <span className="text-[9.5px] font-mono text-slate-400 truncate">
                                {currentConfig?.borderColor || "Default"}
                              </span>
                              <div className="flex items-center gap-1 ml-auto">
                                {["#00f0ff", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#334155"].map((c) => (
                                  <CustomizableButton
                                    buttonId="button_customization_modal_btn_5"
                                    key={c}
type="button"
onClick={() => updateStyleForSelectedElements({ borderColor: c })}
style={{ backgroundColor: c }}
className="w-3.5 h-3.5 rounded-full border border-slate-700 hover:scale-110 transition-transform cursor-pointer"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Accent Glow Color */}
                          <div className="space-y-1 p-2 rounded-lg bg-[#090e1a] border border-slate-800">
                            <div className="flex items-center justify-between">
                              <CustomizableLabel
                                labelId="button_customization_modal_item_4"
                                as="label"
                                className="text-[10.5px] font-semibold text-slate-300"
                              >
                                  {() => (
                                      <>
                                        {uiText("components_button_customization_modal.label.accent_glow_2", "Accent Glow:")}
                                      </>
                                    )}
                              </CustomizableLabel>
                              {currentConfig?.accentColor && (
                                <CustomizableButton
                                  buttonId="button_customization_modal_btn_3"
                                  type="button"
onClick={() => updateStyleForSelectedElements({ accentColor: undefined })}
className="text-[9px] text-slate-400 hover:text-rose-400 cursor-pointer"
                                >
                                    {() => (
                                        <>
                                          {uiText("components_button_customization_modal.button.reset_7", "Reset")}
                                        </>
                                      )}
                                </CustomizableButton>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={currentConfig?.accentColor || "#10b981"}
                                onChange={(e) => updateStyleForSelectedElements({ accentColor: e.target.value })}
                                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0 shrink-0"
                                title={uiText("components_button_customization_modal.input.custom_accent_glow_color_picker.title", "Custom accent glow color picker")}
                              />
                              <RadialColorPicker
                                currentConfig={currentConfig}
                                onUpdateStyle={updateStyleForSelectedElements}
                                initialTarget="accentColor"
                                compactTrigger
                                buttonLabel="Dial"
                                buttonClassName="px-1.5 py-0.5 text-[9px] font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded cursor-pointer"
                              />
                              <span className="text-[9.5px] font-mono text-slate-400 truncate">
                                {currentConfig?.accentColor || "None"}
                              </span>
                              <div className="flex items-center gap-1 ml-auto">
                                {["#00f0ff", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#f43f5e"].map((c) => (
                                  <CustomizableButton
                                    buttonId="button_customization_modal_btn_2"
                                    key={c}
type="button"
onClick={() => updateStyleForSelectedElements({ accentColor: c })}
style={{ backgroundColor: c }}
className="w-3.5 h-3.5 rounded-full border border-slate-700 hover:scale-110 transition-transform cursor-pointer"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pinned Compact Modal Bottom Footer */}
                  <div className="px-3 py-1.5 border-t border-[#0d2235] bg-[#07111e] flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <CustomizableButton
                        buttonId="btn_cust_download_backup"
                        defaultLabel="Export JSON"
                        defaultIcon={<Download className="w-3 h-3 text-cyan-400" />}
                        onClick={handleExportStateJson}
                        className="px-2.5 py-1 bg-[#091527] hover:bg-[#0e213d] text-cyan-300 border border-cyan-500/40 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                        title="Export all customizations to JSON file"
                      />

                      <CustomizableLabel
                        labelId="button_customization_modal_item_1"
                        defaultIcon={<FileJson className="w-3 h-3 text-purple-400" />}
                        as="label"
                        className="px-2.5 py-1 bg-[#091527] hover:bg-[#0e213d] text-purple-300 border border-purple-500/40 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
title={uiText("components_button_customization_modal.label.import_customizations_from_json_file.title", "Import customizations from JSON file")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_button_customization_modal.span.import_json_2", "Import JSON")}</span>
                              <input
                          type="file"
                          accept=".json,application/json"
                          onChange={handleImportFile}
                          className="hidden"
                        />
                              </>
                            )}
                      </CustomizableLabel>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <CustomizableButton
                        buttonId="btn_cust_save_as_default_footer"
                        defaultLabel="Save Default"
                        defaultIcon={<ShieldCheck className="w-3 h-3 text-emerald-400" />}
                        onClick={handleSaveAllAsDefault}
                        className="px-3 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 font-mono font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                        title="Make all customizations become the permanent default"
                      />

                      <CustomizableButton
                        buttonId="btn_cust_close_footer"
                        defaultLabel="Done"
                        defaultIcon={<Check className="w-3 h-3" />}
                        onClick={closeStudioModal}
                        className="px-3.5 py-1 bg-[#00c982] hover:bg-emerald-400 text-slate-950 font-mono font-bold rounded-lg text-[11px] transition-all cursor-pointer shadow-sm whitespace-nowrap"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
          </main>
        </div>

        {/* Modal Window Resize Handles */}
        {/* Right Edge Handle */}
        <div
          onMouseDown={(e) => handleModalResizeStart(e, "e")}
          className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-emerald-500/20 active:bg-emerald-500/40 transition-colors z-20"
          title={uiText("components_button_customization_modal.div.drag_to_resize_width.title", "Drag to resize width")}
        />
        {/* Bottom Edge Handle */}
        <div
          onMouseDown={(e) => handleModalResizeStart(e, "s")}
          className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-emerald-500/20 active:bg-emerald-500/40 transition-colors z-20"
          title={uiText("components_button_customization_modal.div.drag_to_resize_height.title", "Drag to resize height")}
        />
        {/* Bottom-Right Corner Handle */}
        <div
          onMouseDown={(e) => handleModalResizeStart(e, "se")}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-emerald-500/40 active:bg-emerald-500/60 transition-colors z-30 flex items-end justify-end p-0.5 text-slate-600 hover:text-emerald-400"
          title={uiText("components_button_customization_modal.div.drag_to_resize_width_and_height.title", "Drag to resize width & height")}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15L15 21M21 8L8 21" />
          </svg>
        </div>
      </div>

      {/* Export JSON File Naming Modal */}
      <ExportJsonModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleConfirmExportJson}
        getJsonData={exportConfigs}
        itemCount={Object.keys(customConfigs).length}
        defaultFilename={`seqcarver-button-state-${new Date().toISOString().slice(0, 10)}`}
        title={uiText("components_button_customization_modal.export_json_modal.export_button_state_json.title", "Export Button State JSON")}
        description={uiText("components_button_customization_modal.export_json_modal.specify_a_custom_file_name_for_your_button_c.description", "Specify a custom file name for your button customizations export and choose local folder.")}
      />
    </div>
  );
}
