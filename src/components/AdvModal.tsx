import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Zap,
  X,
  FolderOpen,
  Folder,
  FolderPlus,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  GripHorizontal,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Scissors,
  Grid,
  Focus,
  Sparkles,
  Film,
  Tag,
  Layers,
  Wand2,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { MesshiIcon } from "./MesshiIcon";
import { KrumsIcon } from "./KrumsIcon";
import { cn } from "../utils/cn";
import { CustomizableButton } from "./CustomizableButton";
import { CustomizableLabel } from "./CustomizableLabel";
import { useButtonCustomization } from "../context/ButtonCustomizationContext";
import { uiText } from "../hooks/useUIConfig";
import { remoteStore } from "../services/remoteKeyValueStore";

export type AdvModalCategory = "all" | "slicers" | "resamplers" | "animator";

export interface AdvModalCategoryConfig {
  id: AdvModalCategory;
  buttonId: string;
  name: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
  glow: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
}

export const ADV_MODAL_CATEGORIES: AdvModalCategoryConfig[] = [
  {
    id: "all",
    buttonId: "adv_modal_tab_all",
    name: "All Advanced Tools",
    shortLabel: "All",
    icon: Layers,
    color: "#10b981",
    activeBg: "bg-emerald-500",
    activeText: "text-slate-950 font-bold",
    activeBorder: "border-emerald-400",
    glow: "rgba(16,185,129,0.45)",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-300",
    badgeBorder: "border-emerald-500/30",
    description: "All optical boundary slicers, mesh engines, loaders, HD upscalers & timeline animators",
  },
  {
    id: "slicers",
    buttonId: "adv_modal_tab_slicers",
    name: "Slicers & Mesh",
    shortLabel: "Slicers",
    icon: Scissors,
    color: "#00f0ff",
    activeBg: "bg-cyan-500",
    activeText: "text-slate-950 font-bold",
    activeBorder: "border-cyan-400",
    glow: "rgba(0,240,255,0.45)",
    badgeBg: "bg-cyan-500/15",
    badgeText: "text-cyan-300",
    badgeBorder: "border-cyan-500/30",
    description: "Auto Slice, Messhi Grid, Uniform Grid Mesh & Smart Contour Auto-Slicer",
  },
  {
    id: "resamplers",
    buttonId: "adv_modal_tab_resamplers",
    name: "HD Resamplers",
    shortLabel: "HD Audio/Visual",
    icon: Sparkles,
    color: "#f59e0b",
    activeBg: "bg-amber-500",
    activeText: "text-slate-950 font-bold",
    activeBorder: "border-amber-400",
    glow: "rgba(245,158,11,0.45)",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/30",
    description: "Resolution Sharpener 4x, Resample Studio HD de-grain & Krums multi-image loader",
  },
  {
    id: "animator",
    buttonId: "adv_modal_tab_animator",
    name: "Keyframe Animator",
    shortLabel: "Animation",
    icon: Film,
    color: "#a855f7",
    activeBg: "bg-purple-500",
    activeText: "text-slate-950 font-bold",
    activeBorder: "border-purple-400",
    glow: "rgba(168,85,247,0.45)",
    badgeBg: "bg-purple-500/15",
    badgeText: "text-purple-300",
    badgeBorder: "border-purple-500/30",
    description: "Anicomper4 Keyframed Timeline & Multi-track Onion-Skinning Studio",
  },
];

export interface AdvModalFolderConfig {
  id: string;
  name: string;
  color: string;
  appIds: string[];
}

export interface AdvModalAppItem {
  id: string;
  buttonId: string;
  name: string;
  subtitle: string;
  category: AdvModalCategory;
  categoryLabel: string;
  badge?: string;
  badgeColor?: string;
  color: string;
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  hoverBorder: string;
  hoverBg: string;
  action: () => void;
}

const FOLDER_COLOR_PRESETS = [
  { name: "Emerald", color: "#10b981" },
  { name: "Cyan", color: "#00f0ff" },
  { name: "Amber", color: "#f59e0b" },
  { name: "Purple", color: "#a855f7" },
  { name: "Rose", color: "#f43f5e" },
  { name: "Blue", color: "#3b82f6" },
  { name: "Indigo", color: "#6366f1" },
  { name: "Teal", color: "#14b8a6" },
  { name: "Orange", color: "#f97316" },
  { name: "Lime", color: "#84cc16" },
];

const DEFAULT_FOLDERS: AdvModalFolderConfig[] = [
  {
    id: "folder_slicing",
    name: "Slicers & Mesh",
    color: "#10b981",
    appIds: ["auto_slice", "messhi", "grid_mesh", "smart_contour"],
  },
  {
    id: "folder_hd_engine",
    name: "HD & Loaders",
    color: "#f59e0b",
    appIds: ["krums", "image_sharpener", "resample_studio"],
  },
  {
    id: "folder_animation",
    name: "Timeline Studio",
    color: "#a855f7",
    appIds: ["anicomposer"],
  },
];

export type AdvModalSortMode = "name_asc" | "name_desc" | "original";

export const ADV_MODAL_DEFAULT_STATE_KEY = "seqcarver_adv_modal_default_state_v1";

export interface AdvModalDefaultState {
  folders: AdvModalFolderConfig[];
  activeCategory: AdvModalCategory;
  activeFolderTab: string;
  showTags: boolean;
  isManagingFolders: boolean;
  sortMode?: AdvModalSortMode;
  size: { width: number; height: number };
  position?: { x: number; y: number };
  lastSavedAt?: string;
}

const DEFAULT_WIDTH = 500;
const DEFAULT_HEIGHT = 420;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 280;

interface AdvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAutoSlice?: () => void;
  onOpenMesshi?: () => void;
  onOpenKrums?: () => void;
  onOpenGridMesh?: () => void;
  onOpenImageSharpener?: () => void;
  onOpenResampleStudio?: () => void;
  onOpenAniComposer?: () => void;
  onOpenSmartContourSlicer?: () => void;
}

export function AdvModal({
  isOpen,
  onClose,
  onOpenAutoSlice,
  onOpenMesshi,
  onOpenKrums,
  onOpenGridMesh,
  onOpenImageSharpener,
  onOpenResampleStudio,
  onOpenAniComposer,
  onOpenSmartContourSlicer,
}: AdvModalProps) {
  const {
    getButtonLabel,
    saveCurrentAsDefault,
    restoreAllFromSavedSetup,
  } = useButtonCustomization();
  const [restoreFeedback, setRestoreFeedback] = useState<string | null>(null);

  // Window Size State (persisted in localStorage)
  const [size, setSize] = useState<{ width: number; height: number }>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_adv_modal_size_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.width === "number" && typeof parsed.height === "number") {
          return {
            width: Math.max(MIN_WIDTH, Math.min((window.innerWidth || 1200) - 20, parsed.width)),
            height: Math.max(MIN_HEIGHT, Math.min((window.innerHeight || 800) - 20, parsed.height)),
          };
        }
      }
    } catch {
      // fallback
    }
    return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
  });

  // Draggable position state (persisted in localStorage)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_adv_modal_pos_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          const clampedX = Math.max(8, Math.min((window.innerWidth || 1200) - DEFAULT_WIDTH - 8, parsed.x));
          const clampedY = Math.max(8, Math.min((window.innerHeight || 800) - 80, parsed.y));
          return { x: clampedX, y: clampedY };
        }
      }
    } catch {
      // fallback
    }
    return { x: 255, y: 45 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });

  // Resizing state
  const [isResizing, setIsResizing] = useState<"se" | "e" | "s" | null>(null);
  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; initWidth: number; initHeight: number }>({
    mouseX: 0,
    mouseY: 0,
    initWidth: DEFAULT_WIDTH,
    initHeight: DEFAULT_HEIGHT,
  });

  // Save Default feedback state
  const [saveDefaultSuccess, setSaveDefaultSuccess] = useState(false);

  // Lifecycle guarantee: ensure default dimensions, positioning, default folder, tags off
  useEffect(() => {
    if (isOpen) {
      const stored = remoteStore.getItem("seqcarver_adv_modal_size_v1");
      if (!stored || stored.includes("450") || (stored.includes("500") && stored.includes("500\"}"))) {
        setSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
        try {
          remoteStore.setItem("seqcarver_adv_modal_size_v1", JSON.stringify({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }));
        } catch {}
      }
      const storedPos = remoteStore.getItem("seqcarver_adv_modal_pos_v1");
      if (!storedPos || storedPos.includes("200") || storedPos.includes("120")) {
        setPosition({ x: 255, y: 45 });
        try {
          remoteStore.setItem("seqcarver_adv_modal_pos_v1", JSON.stringify({ x: 255, y: 45 }));
        } catch {}
      }
      const storedTab = remoteStore.getItem("seqcarver_adv_modal_active_tab_v1");
      if (!storedTab || storedTab === "all") {
        setActiveFolderTab("folder_slicing");
      }
      const storedTags = remoteStore.getItem("seqcarver_adv_modal_show_tags_v1");
      if (storedTags === null) {
        setShowTags(false);
      }
      setIsManagingFolders(false);
    }
  }, [isOpen]);

  // Tag visibility state (persisted in localStorage, default false = all tags off)
  const [showTags, setShowTags] = useState<boolean>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_adv_modal_show_tags_v1");
      return stored === "true";
    } catch {
      return false;
    }
  });

  // Folder state
  const [folders, setFolders] = useState<AdvModalFolderConfig[]>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_adv_modal_folders_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_FOLDERS;
    } catch {
      return DEFAULT_FOLDERS;
    }
  });

  const [activeFolderTab, setActiveFolderTab] = useState<string>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_adv_modal_active_tab_v1");
      if (stored && stored !== "all") return stored;
    } catch {}
    return "folder_slicing";
  });

  // Category filter tabs state ('all', 'slicers', 'resamplers', 'animator')
  const [activeCategory, setActiveCategory] = useState<AdvModalCategory>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_adv_modal_category_v1");
      if (stored && ["all", "slicers", "resamplers", "animator"].includes(stored)) {
        return stored as AdvModalCategory;
      }
    } catch {}
    return "all";
  });

  // Sort mode state: default is 'a to z, name' ("name_asc")
  const [sortMode, setSortMode] = useState<AdvModalSortMode>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_adv_modal_sort_mode_v1");
      if (stored === "name_asc" || stored === "name_desc" || stored === "original") {
        return stored as AdvModalSortMode;
      }
    } catch {}
    return "name_asc";
  });

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_adv_modal_sort_mode_v1", sortMode);
    } catch (e) {
      console.warn("Failed to persist sort mode", e);
    }
  }, [sortMode]);

  // Inline search query
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_adv_modal_category_v1", activeCategory);
    } catch (e) {
      console.warn("Failed to persist active category", e);
    }
  }, [activeCategory]);

  const [isManagingFolders, setIsManagingFolders] = useState<boolean>(() => {
    try {
      return remoteStore.getItem("seqcarver_adv_modal_show_folders_v1") === "true";
    } catch {
      return false;
    }
  });

  // New folder creation state
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [isQuickAddingFolder, setIsQuickAddingFolder] = useState<boolean>(false);
  const [quickFolderName, setQuickFolderName] = useState<string>("");
  const filterHeaderRef = useRef<HTMLDivElement>(null);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [newFolderColor, setNewFolderColor] = useState<string>(FOLDER_COLOR_PRESETS[0].color);

  // Editing / Palette states
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [colorPickerFolderId, setColorPickerFolderId] = useState<string | null>(null);

  // Save preferences
  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_adv_modal_show_tags_v1", String(showTags));
    } catch (e) {
      console.warn("Failed to persist tag visibility", e);
    }
  }, [showTags]);

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_adv_modal_folders_v1", JSON.stringify(folders));
    } catch (e) {
      console.warn("Failed to persist adv modal folders", e);
    }
  }, [folders]);

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_adv_modal_active_tab_v1", activeFolderTab);
    } catch (e) {
      console.warn("Failed to persist active folder tab", e);
    }
  }, [activeFolderTab]);

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_adv_modal_show_folders_v1", String(isManagingFolders));
    } catch (e) {
      console.warn("Failed to persist folder management visibility", e);
    }
  }, [isManagingFolders]);

  const latestPosRef = useRef(position);
  latestPosRef.current = position;
  const latestSizeRef = useRef(size);
  latestSizeRef.current = size;

  // Window resize handler to keep modal within screen bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const curW = latestSizeRef.current.width;
        const newX = Math.max(8, Math.min((window.innerWidth || 1200) - curW - 8, prev.x));
        const newY = Math.max(8, Math.min((window.innerHeight || 800) - 80, prev.y));
        return { x: newX, y: newY };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Ensure default setup is established
  useEffect(() => {
    try {
      const existingDefault = remoteStore.getItem(ADV_MODAL_DEFAULT_STATE_KEY);
      if (!existingDefault) {
        const defaultState: AdvModalDefaultState = {
          folders: DEFAULT_FOLDERS,
          activeCategory: "all",
          activeFolderTab: "all",
          showTags: true,
          isManagingFolders: false,
          size: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
          lastSavedAt: new Date().toISOString(),
        };
        remoteStore.setItem(ADV_MODAL_DEFAULT_STATE_KEY, JSON.stringify(defaultState));
        remoteStore.setItem("seqcarver_adv_modal_folders_default_v1", JSON.stringify(DEFAULT_FOLDERS));
        remoteStore.setItem("seqcarver_adv_modal_size_default_v1", JSON.stringify({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }));
        remoteStore.setItem("seqcarver_adv_modal_category_default_v1", "all");
        remoteStore.setItem("seqcarver_adv_modal_active_tab_default_v1", "all");
        remoteStore.setItem("seqcarver_adv_modal_show_tags_default_v1", "true");
        remoteStore.setItem("seqcarver_adv_modal_show_folders_default_v1", "false");
      }
    } catch (e) {
      console.warn("Failed to initialize persistent adv modal default state", e);
    }
  }, []);

  // Draggable mouse event listeners
  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, select, a, [data-interactive='true']")) return;

    e.preventDefault();
    setIsDragging(true);
    dragOffsetRef.current = {
      offsetX: e.clientX - position.x,
      offsetY: e.clientY - position.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const maxW = window.innerWidth || 1200;
        const maxH = window.innerHeight || 800;
        const curW = latestSizeRef.current.width;
        const newX = Math.max(8, Math.min(maxW - curW - 8, e.clientX - dragOffsetRef.current.offsetX));
        const newY = Math.max(8, Math.min(maxH - 80, e.clientY - dragOffsetRef.current.offsetY));
        setPosition({ x: newX, y: newY });
      });
    };

    const handleMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      setIsDragging(false);
      try {
        remoteStore.setItem("seqcarver_adv_modal_pos_v1", JSON.stringify(latestPosRef.current));
      } catch (e) {
        console.warn("Failed to persist adv modal position", e);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Resizing mouse event listeners
  const handleResizeStart = (e: React.MouseEvent, direction: "se" | "e" | "s") => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(direction);
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initWidth: size.width,
      initHeight: size.height,
    };
  };

  useEffect(() => {
    if (!isResizing) return;

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const dx = e.clientX - resizeStartRef.current.mouseX;
        const dy = e.clientY - resizeStartRef.current.mouseY;
        const posX = latestPosRef.current.x;
        const posY = latestPosRef.current.y;
        const maxAllowedWidth = Math.max(MIN_WIDTH, (window.innerWidth || 1200) - posX - 16);
        const maxAllowedHeight = Math.max(MIN_HEIGHT, (window.innerHeight || 800) - posY - 16);

        setSize((prev) => {
          let newWidth = prev.width;
          let newHeight = prev.height;

          if (isResizing === "se" || isResizing === "e") {
            newWidth = Math.max(MIN_WIDTH, Math.min(maxAllowedWidth, resizeStartRef.current.initWidth + dx));
          }
          if (isResizing === "se" || isResizing === "s") {
            newHeight = Math.max(MIN_HEIGHT, Math.min(maxAllowedHeight, resizeStartRef.current.initHeight + dy));
          }
          return { width: newWidth, height: newHeight };
        });
      });
    };

    const handleMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      setIsResizing(null);
      try {
        remoteStore.setItem("seqcarver_adv_modal_size_v1", JSON.stringify(latestSizeRef.current));
      } catch (e) {
        console.warn("Failed to persist adv modal size", e);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleResetSize = () => {
    const defaultSz = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
    const defaultPos = { x: 255, y: 45 };
    setSize(defaultSz);
    setPosition(defaultPos);
    try {
      remoteStore.setItem("seqcarver_adv_modal_size_v1", JSON.stringify(defaultSz));
      remoteStore.setItem("seqcarver_adv_modal_pos_v1", JSON.stringify(defaultPos));
    } catch {}
  };

  // Save All as Default
  const handleSaveAllAsDefault = () => {
    try {
      const defaultState: AdvModalDefaultState = {
        folders,
        activeCategory,
        activeFolderTab,
        showTags,
        isManagingFolders,
        sortMode,
        size,
        position,
        lastSavedAt: new Date().toISOString(),
      };
      remoteStore.setItem(ADV_MODAL_DEFAULT_STATE_KEY, JSON.stringify(defaultState));
      remoteStore.setItem("seqcarver_adv_modal_folders_v1", JSON.stringify(folders));
      remoteStore.setItem("seqcarver_adv_modal_folders_default_v1", JSON.stringify(folders));
      remoteStore.setItem("seqcarver_adv_modal_size_v1", JSON.stringify(size));
      remoteStore.setItem("seqcarver_adv_modal_size_default_v1", JSON.stringify(size));
      remoteStore.setItem("seqcarver_adv_modal_pos_v1", JSON.stringify(position));
      remoteStore.setItem("seqcarver_adv_modal_pos_default_v1", JSON.stringify(position));
      remoteStore.setItem("seqcarver_adv_modal_active_tab_v1", activeFolderTab);
      remoteStore.setItem("seqcarver_adv_modal_active_tab_default_v1", activeFolderTab);
      remoteStore.setItem("seqcarver_adv_modal_category_v1", activeCategory);
      remoteStore.setItem("seqcarver_adv_modal_category_default_v1", activeCategory);
      remoteStore.setItem("seqcarver_adv_modal_show_folders_v1", String(isManagingFolders));
      remoteStore.setItem("seqcarver_adv_modal_show_folders_default_v1", String(isManagingFolders));
      remoteStore.setItem("seqcarver_adv_modal_show_tags_v1", String(showTags));
      remoteStore.setItem("seqcarver_adv_modal_show_tags_default_v1", String(showTags));
      remoteStore.setItem("seqcarver_adv_modal_sort_mode_v1", sortMode);
      remoteStore.setItem("seqcarver_adv_modal_sort_mode_default_v1", sortMode);

      saveCurrentAsDefault();

      setSaveDefaultSuccess(true);
      setTimeout(() => setSaveDefaultSuccess(false), 4000);
    } catch (e) {
      console.error("Failed to save changes as default", e);
    }
  };

  // Restore Setup
  const handleRestoreSetup = () => {
    try {
      let savedFolders = DEFAULT_FOLDERS;
      let savedSize = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
      let savedPos: { x: number; y: number } | undefined = { x: 255, y: 45 };
      let savedTags = false;
      let savedCategory: AdvModalCategory = "all";
      let savedActiveTab = "folder_slicing";
      let savedSortMode: AdvModalSortMode = "name_asc";

      try {
        const storedUnified = remoteStore.getItem(ADV_MODAL_DEFAULT_STATE_KEY);
        if (storedUnified) {
          const parsed = JSON.parse(storedUnified);
          if (Array.isArray(parsed.folders) && parsed.folders.length > 0) savedFolders = parsed.folders;
          if (parsed.size?.width && parsed.size?.height) savedSize = parsed.size;
          if (parsed.position?.x !== undefined && parsed.position?.y !== undefined) savedPos = parsed.position;
          if (typeof parsed.showTags === "boolean") savedTags = parsed.showTags;
          if (parsed.activeCategory) savedCategory = parsed.activeCategory;
          if (parsed.activeFolderTab) savedActiveTab = parsed.activeFolderTab;
          if (parsed.sortMode) savedSortMode = parsed.sortMode;
        } else {
          const savedFoldersRaw = remoteStore.getItem("seqcarver_adv_modal_folders_default_v1");
          if (savedFoldersRaw) {
            const parsed = JSON.parse(savedFoldersRaw);
            if (Array.isArray(parsed) && parsed.length > 0) savedFolders = parsed;
          }
          const savedSizeRaw = remoteStore.getItem("seqcarver_adv_modal_size_default_v1");
          if (savedSizeRaw) {
            const parsed = JSON.parse(savedSizeRaw);
            if (typeof parsed.width === "number" && typeof parsed.height === "number") savedSize = parsed;
          }
          const savedPosRaw = remoteStore.getItem("seqcarver_adv_modal_pos_default_v1");
          if (savedPosRaw) {
            const parsed = JSON.parse(savedPosRaw);
            if (typeof parsed.x === "number" && typeof parsed.y === "number") savedPos = parsed;
          }
          const savedTagsRaw = remoteStore.getItem("seqcarver_adv_modal_show_tags_default_v1");
          if (savedTagsRaw !== null) savedTags = savedTagsRaw === "true";
          const savedCatRaw = remoteStore.getItem("seqcarver_adv_modal_category_default_v1");
          if (savedCatRaw && ["all", "slicers", "resamplers", "animator"].includes(savedCatRaw)) {
            savedCategory = savedCatRaw as any;
          }
          const savedSortRaw = remoteStore.getItem("seqcarver_adv_modal_sort_mode_default_v1");
          if (savedSortRaw && ["name_asc", "name_desc", "original"].includes(savedSortRaw)) {
            savedSortMode = savedSortRaw as AdvModalSortMode;
          }
        }
      } catch {}

      setFolders(savedFolders);
      setSize(savedSize);
      if (savedPos) setPosition(savedPos);
      setShowTags(savedTags);
      setActiveCategory(savedCategory);
      setActiveFolderTab(savedActiveTab);
      setSortMode(savedSortMode);

      const res = restoreAllFromSavedSetup();
      setRestoreFeedback(res.message);
      setTimeout(() => setRestoreFeedback(null), 3500);
    } catch (e: any) {
      console.error("Failed to restore saved setup", e);
      setRestoreFeedback(`Restore failed: ${e?.message || "Error"}`);
      setTimeout(() => setRestoreFeedback(null), 3500);
    }
  };

  // All 8 Advanced items extracted from Creative Studio
  const appItems: AdvModalAppItem[] = useMemo(
    () => [
      {
        id: "auto_slice",
        buttonId: "adv_modal_auto_slice",
        name: "Auto Slice",
        subtitle: "Optical & Transparency Sprite Detect",
        category: "slicers",
        categoryLabel: "Advanced",
        badge: "Smart Alpha",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        color: "#10b981",
        icon: <Scissors className="w-3.5 h-3.5 text-emerald-400" style={{ color: "#10b981" }} />,
        iconBg: "bg-emerald-500/15",
        iconBorder: "border-emerald-500/40",
        iconColor: "text-emerald-400",
        hoverBorder: "hover:border-emerald-500/60",
        hoverBg: "hover:bg-emerald-950/25",
        action: () => {
          onClose();
          if (onOpenAutoSlice) onOpenAutoSlice();
        },
      },
      {
        id: "messhi",
        buttonId: "adv_modal_messhi",
        name: "Messhi Grid Studio",
        subtitle: "Mesh Overlay Slicing & Subdivision",
        category: "slicers",
        categoryLabel: "Advanced",
        badge: "Mesh Grid",
        badgeColor: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
        color: "#00f0ff",
        icon: <MesshiIcon className="w-3.5 h-3.5 text-cyan-300" style={{ color: "#00f0ff" }} />,
        iconBg: "bg-cyan-500/15",
        iconBorder: "border-cyan-500/40",
        iconColor: "text-cyan-300",
        hoverBorder: "hover:border-cyan-400/70",
        hoverBg: "hover:bg-cyan-950/30",
        action: () => {
          onClose();
          if (onOpenMesshi) onOpenMesshi();
        },
      },
      {
        id: "krums",
        buttonId: "adv_modal_krums",
        name: "Krums Image Loader",
        subtitle: "Multi-Image Staging, Storyboard Reorder & Matrix FX",
        category: "resamplers",
        categoryLabel: "Advanced",
        badge: "Loader & FX",
        badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
        color: "#f59e0b",
        icon: <KrumsIcon className="w-3.5 h-3.5 text-amber-400" />,
        iconBg: "bg-amber-500/15",
        iconBorder: "border-amber-500/40",
        iconColor: "text-amber-400",
        hoverBorder: "hover:border-amber-400/70",
        hoverBg: "hover:bg-amber-950/30",
        action: () => {
          onClose();
          if (onOpenKrums) onOpenKrums();
        },
      },
      {
        id: "grid_mesh",
        buttonId: "adv_modal_grid_mesh",
        name: "Grid Mesh Studio",
        subtitle: "Uniform Grid & Freestyle Polygon Mesh",
        category: "slicers",
        categoryLabel: "Advanced",
        badge: "Full Slicer",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        color: "#10b981",
        icon: <Grid className="w-3.5 h-3.5 text-emerald-400" style={{ color: "#10b981" }} />,
        iconBg: "bg-emerald-500/15",
        iconBorder: "border-emerald-500/40",
        iconColor: "text-emerald-400",
        hoverBorder: "hover:border-emerald-400/70",
        hoverBg: "hover:bg-emerald-950/30",
        action: () => {
          onClose();
          if (onOpenGridMesh) onOpenGridMesh();
        },
      },
      {
        id: "image_sharpener",
        buttonId: "adv_modal_image_sharpener",
        name: "Resolution Sharpener Studio",
        subtitle: "HD Upscale, USM Sharpness & Clarity",
        category: "resamplers",
        categoryLabel: "Advanced",
        badge: "HD 4x",
        badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
        color: "#f59e0b",
        icon: <Focus className="w-3.5 h-3.5 text-amber-400" style={{ color: "#f59e0b" }} />,
        iconBg: "bg-amber-500/15",
        iconBorder: "border-amber-500/40",
        iconColor: "text-amber-400",
        hoverBorder: "hover:border-amber-500/60",
        hoverBg: "hover:bg-amber-950/25",
        action: () => {
          onClose();
          if (onOpenImageSharpener) onOpenImageSharpener();
        },
      },
      {
        id: "resample_studio",
        buttonId: "adv_modal_resample_studio",
        name: "Resample Studio",
        subtitle: "HD Definition, De-Grain, Blur Fix & Lanczos Upscaling",
        category: "resamplers",
        categoryLabel: "Advanced",
        badge: "HD De-Grain",
        badgeColor: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
        color: "#06b6d4",
        icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" style={{ color: "#06b6d4" }} />,
        iconBg: "bg-cyan-500/15",
        iconBorder: "border-cyan-500/40",
        iconColor: "text-cyan-400",
        hoverBorder: "hover:border-cyan-500/60",
        hoverBg: "hover:bg-cyan-950/25",
        action: () => {
          onClose();
          if (onOpenResampleStudio) onOpenResampleStudio();
        },
      },
      {
        id: "anicomposer",
        buttonId: "adv_modal_anicomposer",
        name: "Anicomper4 studio",
        subtitle: "Keyframed timeline & onion-skinning studio",
        category: "animator",
        categoryLabel: "Advanced",
        badge: "Animator",
        badgeColor: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
        color: "#a855f7",
        icon: <Film className="w-3.5 h-3.5 text-purple-400" style={{ color: "#a855f7" }} />,
        iconBg: "bg-purple-500/15",
        iconBorder: "border-purple-500/40",
        iconColor: "text-purple-400",
        hoverBorder: "hover:border-purple-500/60",
        hoverBg: "hover:bg-purple-950/25",
        action: () => {
          onClose();
          if (onOpenAniComposer) onOpenAniComposer();
        },
      },
      {
        id: "smart_contour",
        buttonId: "adv_modal_smart_contour",
        name: "Smart Contour Auto-Slicer",
        subtitle: "Optical Boundary Detection & Object Isolator",
        category: "slicers",
        categoryLabel: "Advanced",
        badge: "Contour Slicer",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        color: "#10b981",
        icon: <Scissors className="w-3.5 h-3.5 text-emerald-400" style={{ color: "#10b981" }} />,
        iconBg: "bg-emerald-500/15",
        iconBorder: "border-emerald-500/40",
        iconColor: "text-emerald-400",
        hoverBorder: "hover:border-emerald-500/60",
        hoverBg: "hover:bg-emerald-950/25",
        action: () => {
          onClose();
          if (onOpenSmartContourSlicer) onOpenSmartContourSlicer();
        },
      },
    ],
    [
      onClose,
      onOpenAutoSlice,
      onOpenMesshi,
      onOpenKrums,
      onOpenGridMesh,
      onOpenImageSharpener,
      onOpenResampleStudio,
      onOpenAniComposer,
      onOpenSmartContourSlicer,
    ]
  );

  // Helper to assign app to folder
  const handleAssignAppToFolder = (appId: string, folderId: string) => {
    setFolders((prev) => {
      const updated = prev.map((folder) => {
        if (folder.id === folderId) {
          if (!folder.appIds.includes(appId)) {
            return { ...folder, appIds: [...folder.appIds, appId] };
          }
        } else {
          return { ...folder, appIds: folder.appIds.filter((id) => id !== appId) };
        }
        return folder;
      });
      try {
        remoteStore.setItem("seqcarver_adv_modal_folders_v1", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to persist folder assignment", e);
      }
      return updated;
    });
  };

  // Helper to create new folder
  const handleCreateFolder = (nameInput?: string, colorInput?: string) => {
    const trimmed = (nameInput || quickFolderName || newFolderName).trim();
    const finalName = trimmed || `Folder ${folders.length + 1}`;
    const finalColor =
      colorInput ||
      newFolderColor ||
      FOLDER_COLOR_PRESETS[folders.length % FOLDER_COLOR_PRESETS.length].color;

    const newFolder: AdvModalFolderConfig = {
      id: `adv_folder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: finalName,
      color: finalColor,
      appIds: [],
    };

    setFolders((prev) => {
      const next = [...prev, newFolder];
      try {
        remoteStore.setItem("seqcarver_adv_modal_folders_v1", JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to save new folder", e);
      }
      return next;
    });

    setNewFolderName("");
    setQuickFolderName("");
    setIsCreatingFolder(false);
    setIsQuickAddingFolder(false);
    setActiveFolderTab(newFolder.id);
    setActiveCategory("all");

    setTimeout(() => {
      if (filterHeaderRef.current) {
        filterHeaderRef.current.scrollTo({
          left: filterHeaderRef.current.scrollWidth,
          behavior: "smooth",
        });
      }
    }, 60);
  };

  // Helper to delete folder
  const handleDeleteFolder = (folderId: string) => {
    setFolders((prev) => {
      const next = prev.filter((f) => f.id !== folderId);
      try {
        remoteStore.setItem("seqcarver_adv_modal_folders_v1", JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to save deleted folder", e);
      }
      return next;
    });

    if (activeFolderTab === folderId) {
      setActiveFolderTab("all");
    }
    if (editingFolderId === folderId) {
      setEditingFolderId(null);
    }
    if (colorPickerFolderId === folderId) {
      setColorPickerFolderId(null);
    }
  };

  // Helper to move folder
  const handleMoveFolder = (folderId: string, direction: "up" | "down") => {
    setFolders((prev) => {
      const index = prev.findIndex((f) => f.id === folderId);
      if (index === -1) return prev;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;

      try {
        remoteStore.setItem("seqcarver_adv_modal_folders_v1", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to persist folder reordering", e);
      }
      return updated;
    });
  };

  // Helper to rename folder
  const handleRenameFolder = (folderId: string, newName: string) => {
    if (!newName.trim()) return;
    setFolders((prev) => {
      const updated = prev.map((f) =>
        f.id === folderId ? { ...f, name: newName.trim() } : f
      );
      try {
        remoteStore.setItem("seqcarver_adv_modal_folders_v1", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to persist folder rename", e);
      }
      return updated;
    });
    setEditingFolderId(null);
    setEditingName("");
  };

  // Helper to change folder color
  const handleChangeFolderColor = (folderId: string, newColor: string) => {
    setFolders((prev) => {
      const updated = prev.map((f) =>
        f.id === folderId ? { ...f, color: newColor } : f
      );
      try {
        remoteStore.setItem("seqcarver_adv_modal_folders_v1", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to persist folder color", e);
      }
      return updated;
    });
    setColorPickerFolderId(null);
  };

  // Helper to reset folders back to default setup
  const handleResetFoldersToDefault = () => {
    let defaultF = DEFAULT_FOLDERS;
    try {
      const savedFolders = remoteStore.getItem("seqcarver_adv_modal_folders_default_v1");
      if (savedFolders) {
        const parsed = JSON.parse(savedFolders);
        if (Array.isArray(parsed) && parsed.length > 0) defaultF = parsed;
      }
    } catch {}
    setFolders(defaultF);
    setColorPickerFolderId(null);
    setEditingFolderId(null);
    setIsCreatingFolder(false);
    try {
      remoteStore.setItem("seqcarver_adv_modal_folders_v1", JSON.stringify(defaultF));
    } catch (e) {
      console.warn("Failed to persist default folders", e);
    }
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: appItems.length,
      slicers: 0,
      resamplers: 0,
      animator: 0,
    };
    appItems.forEach((app) => {
      if (counts[app.category] !== undefined) {
        counts[app.category]++;
      }
    });
    return counts;
  }, [appItems]);

  // Filter and sort apps
  const filteredApps = useMemo(() => {
    const list = appItems.filter((app) => {
      if (activeCategory !== "all" && app.category !== activeCategory) {
        return false;
      }
      if (activeFolderTab !== "all") {
        const folder = folders.find((f) => f.id === activeFolderTab);
        if (folder && !folder.appIds.includes(app.id)) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = app.name.toLowerCase().includes(q);
        const matchesSub = app.subtitle.toLowerCase().includes(q);
        const matchesCat = app.categoryLabel.toLowerCase().includes(q);
        const matchesBadge = app.badge ? app.badge.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesSub && !matchesCat && !matchesBadge) {
          return false;
        }
      }
      return true;
    });

    if (sortMode === "name_asc") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    } else if (sortMode === "name_desc") {
      return [...list].sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: "base" }));
    }
    return list;
  }, [activeCategory, activeFolderTab, appItems, folders, searchQuery, sortMode]);

  const panelElement = (
    <div
      id="adv_modal_panel"
      data-adv-modal="true"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
      className={cn(
        "fixed bg-[#09131d] border border-emerald-500/60 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.92)] p-2.5 z-[9998] text-slate-100 select-none flex flex-col overflow-hidden will-change-transform",
        isDragging && "ring-2 ring-emerald-400 shadow-emerald-500/30 opacity-95",
        isResizing && "ring-2 ring-cyan-400/90"
      )}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDragStart={(e) => e.stopPropagation()}
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleDragStart}
        className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-800 cursor-grab active:cursor-grabbing group/header shrink-0"
        title={uiText("components_adv_modal.div.click_and_drag_to_move_adv_modal.title", "Click and drag to move Adv modal")}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="text-slate-500 group-hover/header:text-emerald-400 transition-colors shrink-0">
            <GripHorizontal className="w-3.5 h-3.5" />
          </div>
          <CustomizableLabel
            as="h3"
            labelId="adv_modal_header_title"
            defaultLabel="Adv Modal"
            showLabelAlways={true}
            defaultIcon={<Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            className="font-bold text-xs text-emerald-300 tracking-normal truncate leading-tight pl-1"
          />
          {/* Live X, Y Screen Position Indicator */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/80 border border-emerald-500/30 text-[9px] font-mono text-emerald-300 font-bold shrink-0 ml-1 shadow-sm select-none"
            title={`Current panel screen position: X: ${Math.round(position.x)}px, Y: ${Math.round(position.y)}px (Width: ${Math.round(size.width)}px, Height: ${Math.round(size.height)}px)`}
          >
            <span className="text-slate-400 font-semibold">X:</span>
            <span>{Math.round(position.x)}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-semibold">Y:</span>
            <span>{Math.round(position.y)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          {/* SHOW / HIDE TAGS TOGGLE BUTTON */}
          <CustomizableButton
            buttonId="adv_modal_toggle_tags"
            defaultLabel={showTags ? "Tags" : "Tags off"}
            defaultIcon={
              <Tag
                className={cn(
                  "w-3 h-3 transition-colors",
                  showTags ? "text-emerald-400" : "text-slate-500 line-through opacity-70"
                )}
              />
            }
            onClick={() => setShowTags(!showTags)}
            className={cn(
              "flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md cursor-pointer transition-all shadow-sm border",
              showTags
                ? "text-emerald-300 hover:text-emerald-100 bg-emerald-500/15 hover:bg-emerald-500/30 border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-slate-800 border-slate-700/60"
            )}
            title={showTags ? "Click to hide tag badges" : "Click to show tag badges"}
          />

          {/* DEFAULT BUTTON: Saves all changes as permanent default! */}
          <CustomizableButton
            buttonId="adv_modal_save_default"
            defaultLabel="Default"
            defaultIcon={<ShieldCheck className="w-3 h-3 text-amber-400" />}
            onClick={handleSaveAllAsDefault}
            className="flex items-center gap-1 text-[9.5px] font-bold text-amber-300 hover:text-amber-100 bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 px-1.5 py-0.5 rounded-md cursor-pointer transition-all shadow-sm"
            title="Save all Adv modal settings, folders, size, position, tags visibility, and button customizations as permanent default"
          />

          {/* RESTORE BUTTON */}
          <CustomizableButton
            buttonId="adv_modal_restore_setup"
            defaultLabel="Restore"
            defaultIcon={<RotateCcw className="w-3 h-3 text-emerald-400" />}
            onClick={handleRestoreSetup}
            className="flex items-center gap-1 text-[9.5px] font-bold text-emerald-300 hover:text-emerald-100 bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/40 px-1.5 py-0.5 rounded-md cursor-pointer transition-all shadow-sm"
            title="Restore all button labels, icons, zero-text and layout settings from your saved setup across the application"
          />

          {/* Close Button */}
          <CustomizableButton
            buttonId="adv_modal_btn_27"
            defaultIcon={<X className="w-3 h-3" />}
            type="button"
onClick={onClose}
className="p-1 text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-md cursor-pointer transition-colors"
title={uiText("components_adv_modal.button.close.title", "Close")}
          />
        </div>
      </div>

      {/* Restore Feedback Notification Banner */}
      {restoreFeedback && (
        <div className="mb-2 px-2 py-1 bg-emerald-950/90 border border-emerald-500/50 rounded-lg flex items-center justify-between gap-1.5 text-[10px] text-emerald-200 animate-in fade-in slide-in-from-top-1 duration-150 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate font-semibold">{restoreFeedback}</span>
          </div>
          <CustomizableButton
            buttonId="adv_modal_btn_26"
            defaultIcon={<X className="w-3 h-3" />}
            type="button"
onClick={() => setRestoreFeedback(null)}
className="text-emerald-400 hover:text-white p-0.5"
          />
        </div>
      )}

      {/* Save as Default Success Notification Banner */}
      {saveDefaultSuccess && (
        <div className="mb-2 px-2 py-1 bg-emerald-950/90 border border-emerald-500/50 rounded-lg flex items-center justify-between gap-1.5 text-[10px] text-emerald-200 animate-in fade-in slide-in-from-top-1 duration-150 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate font-semibold">
              {uiText("components_adv_modal.span.all_adv_modal_settings_folders_and_button_cu", "All Adv modal settings, folders & button customizations saved as default!")}
            </span>
          </div>
          <CustomizableButton
            buttonId="adv_modal_btn_25"
            defaultIcon={<X className="w-3 h-3" />}
            type="button"
onClick={() => setSaveDefaultSuccess(false)}
className="text-emerald-400 hover:text-white p-0.5"
          />
        </div>
      )}

      {/* Preset Category Filter Tabs Bar & Search */}
      <div className="flex flex-col gap-1.5 mb-2 shrink-0">
        {/* Top row: Category filter tabs + inline search + folders tray toggle */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Scrollable Category Filter Tabs & Folder Icons in Filter Header (where 'all' is located) */}
          <div className="relative flex items-center min-w-0 flex-1 group/filter">
            {/* Scroll Left Button */}
            <CustomizableButton
              buttonId="adv_modal_btn_24"
              defaultIcon={<ChevronLeft className="w-3 h-3" />}
              type="button"
onClick={() => {
                if (filterHeaderRef.current) {
                  filterHeaderRef.current.scrollBy({ left: -140, behavior: "smooth" });
                }
              }}
className="p-0.5 rounded text-slate-500 hover:text-emerald-300 hover:bg-slate-800/80 cursor-pointer shrink-0 mr-0.5 transition-colors"
title={uiText("components_adv_modal.button.scroll_left.title", "Scroll left")}
            />

            <div
              ref={filterHeaderRef}
              className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-thin flex-1 min-w-0 scroll-smooth"
            >
              {ADV_MODAL_CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat.id && activeFolderTab === "all";
                const count = categoryCounts[cat.id] ?? 0;

                return (
                  <CustomizableButton
                    key={cat.id}
                    buttonId={cat.buttonId}
                    defaultLabel={`${cat.shortLabel} (${count})`}
                    defaultIcon={<cat.icon className="w-3 h-3 shrink-0" />}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setActiveFolderTab("all");
                    }}
                    className={cn(
                      "px-2 py-1 rounded-md text-[10.5px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border shrink-0",
                      isSelected
                        ? `${cat.activeBg} ${cat.activeText} ${cat.activeBorder} shadow-sm`
                        : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800/80 hover:bg-slate-800"
                    )}
                    style={{
                      boxShadow: isSelected ? `0 0 10px ${cat.glow}` : "none",
                    }}
                  />
                );
              })}

              {/* Folder Icons directly in filter header (where 'all' is located) */}
              {folders.map((folder) => {
                const count = folder.appIds.filter((id) =>
                  appItems.some((a) => a.id === id)
                ).length;
                const isSelected = activeFolderTab === folder.id;
                const folderBtnId =
                  folder.id === "folder_creative"
                    ? "adv_modal_folder_creative"
                    : `adv_modal_folder_${folder.id}`;

                return (
                  <CustomizableButton
                    key={folder.id}
                    buttonId={folderBtnId}
                    defaultLabel={`${folder.name} (${count})`}
                    defaultIcon={
                      <Folder
                        className="w-3 h-3 shrink-0"
                        style={{ color: folder.color, fill: `${folder.color}33` }}
                      />
                    }
                    onClick={() => {
                      if (activeFolderTab === folder.id) {
                        setActiveFolderTab("all");
                        setActiveCategory("all");
                      } else {
                        setActiveFolderTab(folder.id);
                        setActiveCategory("all");
                      }
                    }}
                    className={cn(
                      "px-2 py-1 rounded-md text-[10.5px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border shrink-0",
                      isSelected
                        ? "bg-slate-800 text-white shadow-sm font-extrabold"
                        : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800/80 hover:bg-slate-800"
                    )}
                    style={{
                      borderColor: isSelected ? folder.color : undefined,
                      boxShadow: isSelected ? `0 0 10px ${folder.color}55` : "none",
                      color: isSelected ? folder.color : undefined,
                    }}
                    title={`Filter by Folder: ${folder.name} (${count} apps)`}
                  />
                );
              })}

              {/* Inline Quick Add Folder Input in Filter Header */}
              {isQuickAddingFolder ? (
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-emerald-500/60 shrink-0 animate-in fade-in duration-100">
                  <Folder className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
                  <input
                    type="text"
                    value={quickFolderName}
                    onChange={(e) => setQuickFolderName(e.target.value)}
                    placeholder={uiText("components_adv_modal.input.folder_name.placeholder", "Folder name...")}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCreateFolder(quickFolderName);
                      } else if (e.key === "Escape") {
                        setIsQuickAddingFolder(false);
                        setQuickFolderName("");
                      }
                    }}
                    className="w-24 bg-transparent text-[10px] text-slate-100 px-1 py-0.5 focus:outline-none placeholder-slate-500 font-bold"
                  />
                  <CustomizableButton
                    buttonId="adv_modal_btn_23"
                    defaultIcon={<Check className="w-2.5 h-2.5" />}
                    type="button"
onClick={() => handleCreateFolder(quickFolderName)}
className="p-1 text-emerald-400 hover:text-emerald-200 cursor-pointer"
title={uiText("components_adv_modal.button.add_folder.title", "Add folder")}
                  />
                  <CustomizableButton
                    buttonId="adv_modal_btn_22"
                    defaultIcon={<X className="w-2.5 h-2.5" />}
                    type="button"
onClick={() => {
                      setIsQuickAddingFolder(false);
                      setQuickFolderName("");
                    }}
className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
title={uiText("components_adv_modal.button.cancel.title", "Cancel")}
                  />
                </div>
              ) : (
                <CustomizableButton
                  buttonId="adv_modal_add_folder"
                  defaultLabel="+ Folder"
                  defaultIcon={<FolderPlus className="w-3 h-3 text-emerald-400 shrink-0" />}
                  onClick={() => setIsQuickAddingFolder(true)}
                  className="px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 border shrink-0 bg-slate-900/60 text-emerald-400 hover:text-emerald-200 border-emerald-500/30 hover:border-emerald-400/60 hover:bg-emerald-950/30"
                  title="Add a new folder (creates a new folder icon here in filter header)"
                />
              )}
            </div>

            {/* Scroll Right Button */}
            <CustomizableButton
              buttonId="adv_modal_btn_21"
              defaultIcon={<ChevronRight className="w-3 h-3" />}
              type="button"
onClick={() => {
                if (filterHeaderRef.current) {
                  filterHeaderRef.current.scrollBy({ left: 140, behavior: "smooth" });
                }
              }}
className="p-0.5 rounded text-slate-500 hover:text-emerald-300 hover:bg-slate-800/80 cursor-pointer shrink-0 ml-0.5 transition-colors"
title={uiText("components_adv_modal.button.scroll_right.title", "Scroll right")}
            />
          </div>

          {/* Right Action Tools: Folders Tray toggle & Sort */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Sort Dropdown / Cycle Button */}
            <CustomizableButton
              buttonId="adv_modal_btn_20"
              type="button"
onClick={() => {
                setSortMode((prev) => {
                  if (prev === "name_asc") return "name_desc";
                  if (prev === "name_desc") return "original";
                  return "name_asc";
                });
              }}
className={cn(
                "px-1.5 py-1 rounded-md text-[10px] cursor-pointer transition-colors shrink-0 border flex items-center gap-1 font-semibold",
                sortMode === "name_asc"
                  ? "text-emerald-300 bg-emerald-500/20 border-emerald-500/40"
                  : sortMode === "name_desc"
                  ? "text-cyan-300 bg-cyan-500/20 border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-800"
              )}
title={`Sort items by name: ${
                sortMode === "name_asc"
                  ? "A to Z (Default)"
                  : sortMode === "name_desc"
                  ? "Z to A"
                  : "Original Order"
              } (Click to change)`}
            >
                {() => (
                    <>
                      {sortMode === "name_asc" ? (
                <ArrowDownAZ className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : sortMode === "name_desc" ? (
                <ArrowUpAZ className="w-3 h-3 text-cyan-400 shrink-0" />
              ) : (
                <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
              )}
                    <span className="hidden sm:inline">
                {sortMode === "name_asc" ? "A-Z" : sortMode === "name_desc" ? "Z-A" : "Default"}
              </span>
                    </>
                  )}
            </CustomizableButton>

            {/* Folders Toggle Button */}
            <CustomizableButton
              buttonId="adv_modal_btn_19"
              defaultIcon={<FolderOpen className="w-3 h-3 text-emerald-400" />}
              type="button"
onClick={() => setIsManagingFolders(!isManagingFolders)}
className={cn(
                "px-1.5 py-1 rounded-md text-[10px] cursor-pointer transition-colors shrink-0 border flex items-center gap-1 font-semibold",
                isManagingFolders || activeFolderTab !== "all"
                  ? "text-emerald-300 bg-emerald-500/20 border-emerald-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-800"
              )}
title={isManagingFolders ? "Hide Folders Tray" : "Manage / Filter by Custom Folders"}
            >
                {() => (
                    <>
                      <span className="hidden sm:inline">{uiText("components_adv_modal.span.folders", "Folders")}</span>
                    </>
                  )}
            </CustomizableButton>
          </div>
        </div>

        {/* Active Category Description Banner */}
        {activeCategory !== "all" && (
          <div className="flex items-center justify-between px-2 py-0.5 rounded bg-slate-900/70 border border-slate-800/80 text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-300 truncate">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    ADV_MODAL_CATEGORIES.find((c) => c.id === activeCategory)?.color || "#10b981",
                }}
              />
              <span className="font-bold text-slate-200 capitalize">
                {ADV_MODAL_CATEGORIES.find((c) => c.id === activeCategory)?.name}:
              </span>
              <span className="text-slate-400 truncate">
                {ADV_MODAL_CATEGORIES.find((c) => c.id === activeCategory)?.description}
              </span>
            </div>
            <CustomizableButton
              buttonId="adv_modal_btn_18"
              type="button"
onClick={() => setActiveCategory("all")}
className="text-[9.5px] text-emerald-400 hover:text-emerald-200 font-bold ml-2 shrink-0 cursor-pointer"
            >
                {() => (
                    <>
                      {uiText("components_adv_modal.button.show_all", "Show All")}
                    </>
                  )}
            </CustomizableButton>
          </div>
        )}

        {/* Dynamic Folders Bar */}
        {(isManagingFolders || activeFolderTab !== "all") && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-thin pt-0.5 border-t border-slate-800/60">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 shrink-0 mr-0.5">
              {uiText("components_adv_modal.span.folder", "Folder:")}
            </span>
            <CustomizableButton
              buttonId="adv_modal_btn_17"
              type="button"
onClick={() => setActiveFolderTab("all")}
className={cn(
                "px-1.5 py-0.5 rounded text-[9.5px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 border",
                activeFolderTab === "all"
                  ? "bg-slate-700 text-white border-slate-500"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800"
              )}
            >
                {() => (
                    <>
                      {uiText("components_adv_modal.button.all_folders", "All Folders")}
                    </>
                  )}
            </CustomizableButton>
            {folders.map((folder) => {
              const count = folder.appIds.filter((id) =>
                appItems.some((a) => a.id === id)
              ).length;
              const isSelected = activeFolderTab === folder.id;
              return (
                <CustomizableButton
                  buttonId="adv_modal_btn_16"
                  defaultIcon={<Folder
                    className="w-2.5 h-2.5 shrink-0"
                    style={{ color: folder.color, fill: `${folder.color}30` }}
                  />}
                  key={folder.id}
type="button"
onClick={() => setActiveFolderTab(folder.id)}
className={cn(
                    "px-1.5 py-0.5 rounded text-[9.5px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 border shrink-0",
                    isSelected
                      ? "bg-slate-800 text-white shadow-sm"
                      : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800"
                  )}
style={{
                    borderColor: isSelected ? folder.color : "transparent",
                    boxShadow: isSelected ? `0 0 6px ${folder.color}33` : "none",
                  }}
                >
                    {() => (
                        <>
                          <span className="truncate max-w-[70px]">{folder.name}</span>
                        <span
                    className="text-[8px] font-semibold px-0.5 rounded"
                    style={{
                      backgroundColor: isSelected ? `${folder.color}30` : "transparent",
                      color: isSelected ? folder.color : undefined,
                    }}
                  >
                    ({count})
                  </span>
                        </>
                      )}
                </CustomizableButton>
              );
            })}
            <CustomizableButton
              buttonId="adv_modal_btn_15"
              defaultIcon={<Plus className="w-2.5 h-2.5" />}
              type="button"
onClick={() => {
                setIsManagingFolders(true);
                setIsCreatingFolder(true);
              }}
className="p-0.5 px-1 rounded text-[9.5px] text-emerald-400 hover:text-emerald-200 hover:bg-emerald-500/20 bg-slate-900/80 border border-emerald-500/30 cursor-pointer transition-colors flex items-center gap-0.5 shrink-0"
title={uiText("components_adv_modal.button.add_new_folder.title", "Add New Folder")}
            />
          </div>
        )}
      </div>

      {/* Folder Management Tray */}
      {isManagingFolders && (
        <div className="mb-2 p-2 bg-slate-900/95 border border-emerald-500/30 rounded-lg space-y-2 text-xs shrink-0 animate-in fade-in duration-150 max-h-[220px] overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-300 pb-1 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>{uiText("components_adv_modal.span.folder_management", "Folder Management (")}{folders.length})</span>
            </div>
            <div className="flex items-center gap-1">
              <CustomizableButton
                buttonId="adv_modal_btn_14"
                defaultIcon={<FolderPlus className="w-2.5 h-2.5" />}
                type="button"
onClick={() => setIsCreatingFolder(!isCreatingFolder)}
className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded border cursor-pointer flex items-center gap-1 transition-colors font-bold",
                  isCreatingFolder
                    ? "bg-emerald-500 text-slate-950 border-emerald-400"
                    : "text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40"
                )}
title={uiText("components_adv_modal.button.add_a_new_custom_folder.title", "Add a new custom folder")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_adv_modal.span.folder_2", "+ Folder")}</span>
                      </>
                    )}
              </CustomizableButton>

              <CustomizableButton
                buttonId="adv_modal_btn_13"
                type="button"
onClick={handleResetFoldersToDefault}
className="text-[9px] text-amber-300 hover:text-amber-200 px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 cursor-pointer transition-colors"
title={uiText("components_adv_modal.button.reset_folders_back_to_standard_default.title", "Reset folders back to standard default")}
              >
                  {() => (
                      <>
                        {uiText("components_adv_modal.button.reset", "Reset")}
                      </>
                    )}
              </CustomizableButton>

              <CustomizableButton
                buttonId="adv_modal_btn_12"
                type="button"
onClick={() => setIsManagingFolders(false)}
className="text-[9px] text-slate-400 hover:text-emerald-300 px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer"
title={uiText("components_adv_modal.button.hide_folder_management_tray.title", "Hide folder management tray")}
              >
                  {() => (
                      <>
                        {uiText("components_adv_modal.button.hide", "Hide")}
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>

          {/* New Folder Creation Bar */}
          {isCreatingFolder && (
            <div className="p-1.5 bg-slate-950/90 rounded-md border border-emerald-500/50 space-y-1.5 animate-in fade-in duration-100">
              <div className="flex items-center gap-1.5">
                <Folder
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: newFolderColor, fill: `${newFolderColor}30` }}
                />
                <input
                  type="text"
                  placeholder={uiText("components_adv_modal.input.new_folder_name.placeholder", "New Folder Name...")}
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateFolder();
                    }
                  }}
                  autoFocus
                  className="bg-slate-900 text-slate-100 text-[10px] px-2 py-1 rounded border border-emerald-500/60 focus:outline-none flex-1 min-w-0"
                />
                <CustomizableButton
                  buttonId="adv_modal_btn_11"
                  defaultIcon={<Plus className="w-3 h-3" />}
                  type="button"
onClick={() => handleCreateFolder()}
className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] rounded cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                >
                    {() => (
                        <>
                          <span>{uiText("components_adv_modal.span.add", "Add")}</span>
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="adv_modal_btn_10"
                  defaultIcon={<X className="w-3 h-3" />}
                  type="button"
onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName("");
                  }}
className="p-1 text-slate-400 hover:text-rose-300 cursor-pointer"
title={uiText("components_adv_modal.button.cancel.title_2", "Cancel")}
                />
              </div>

              {/* Color swatch selection */}
              <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                <span className="text-[8px] text-slate-400 font-semibold pl-1">{uiText("components_adv_modal.span.color", "Color:")}</span>
                {FOLDER_COLOR_PRESETS.map((preset) => (
                  <CustomizableButton
                    buttonId="adv_modal_btn_9"
                    key={preset.color}
type="button"
onClick={() => setNewFolderColor(preset.color)}
className={cn(
                      "w-3.5 h-3.5 rounded-full border transition-all cursor-pointer",
                      newFolderColor === preset.color
                        ? "border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                        : "border-transparent opacity-75 hover:opacity-100 hover:scale-105"
                    )}
style={{ backgroundColor: preset.color }}
title={preset.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Existing folders */}
          <div className="space-y-1">
            {folders.length === 0 ? (
              <div className="text-center py-2 text-slate-500 text-[10px]">
                {uiText("components_adv_modal.div.no_custom_folders_click_folder_to_create_one", "No custom folders. Click \"+ Folder\" to create one.")}
              </div>
            ) : (
              folders.map((folder, index) => {
                const isEditing = editingFolderId === folder.id;
                const isColorPicking = colorPickerFolderId === folder.id;
                const count = folder.appIds.length;

                return (
                  <div key={folder.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-1 bg-slate-950/90 p-1.5 rounded-md border border-slate-800 hover:border-slate-700">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <CustomizableButton
                          buttonId="adv_modal_btn_8"
                          type="button"
onClick={() =>
                            setColorPickerFolderId(isColorPicking ? null : folder.id)
                          }
className="w-3 h-3 rounded-full shrink-0 border border-white/20 hover:scale-110 transition-transform cursor-pointer"
style={{ backgroundColor: folder.color }}
title={uiText("components_adv_modal.button.change_folder_color.title", "Change folder color")}
                        />
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleRenameFolder(folder.id, editingName);
                              } else if (e.key === "Escape") {
                                setEditingFolderId(null);
                              }
                            }}
                            autoFocus
                            className="bg-slate-900 text-slate-100 text-[10px] px-1 py-0.5 rounded border border-emerald-500/60 focus:outline-none flex-1 min-w-0"
                          />
                        ) : (
                          <span
                            className="font-bold text-[10px] truncate cursor-pointer hover:text-emerald-300"
                            onClick={() => {
                              setEditingFolderId(folder.id);
                              setEditingName(folder.name);
                            }}
                            title={uiText("components_adv_modal.span.click_to_rename.title", "Click to rename")}
                          >
                            {folder.name}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-500 shrink-0">
                          ({count} {count === 1 ? "app" : "apps"})
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        {isEditing ? (
                          <CustomizableButton
                            buttonId="adv_modal_btn_7"
                            defaultIcon={<Check className="w-3 h-3" />}
                            type="button"
onClick={() => handleRenameFolder(folder.id, editingName)}
className="p-1 text-emerald-400 hover:text-emerald-200 cursor-pointer"
title={uiText("components_adv_modal.button.save_name.title", "Save name")}
                          />
                        ) : (
                          <CustomizableButton
                            buttonId="adv_modal_btn_6"
                            defaultIcon={<Edit2 className="w-2.5 h-2.5" />}
                            type="button"
onClick={() => {
                              setEditingFolderId(folder.id);
                              setEditingName(folder.name);
                            }}
className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
title={uiText("components_adv_modal.button.rename_folder.title", "Rename folder")}
                          />
                        )}
                        <CustomizableButton
                          buttonId="adv_modal_btn_5"
                          defaultIcon={<ArrowUp className="w-2.5 h-2.5" />}
                          type="button"
onClick={() => handleMoveFolder(folder.id, "up")}
disabled={index === 0}
className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
title={uiText("components_adv_modal.button.move_up.title", "Move Up")}
                        />
                        <CustomizableButton
                          buttonId="adv_modal_btn_4"
                          defaultIcon={<ArrowDown className="w-2.5 h-2.5" />}
                          type="button"
onClick={() => handleMoveFolder(folder.id, "down")}
disabled={index === folders.length - 1}
className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
title={uiText("components_adv_modal.button.move_down.title", "Move Down")}
                        />
                        <CustomizableButton
                          buttonId="adv_modal_btn_3"
                          defaultIcon={<Trash2 className="w-2.5 h-2.5" />}
                          type="button"
onClick={() => handleDeleteFolder(folder.id)}
className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
title={uiText("components_adv_modal.button.delete_folder.title", "Delete Folder")}
                        />
                      </div>
                    </div>

                    {isColorPicking && (
                      <div className="flex items-center gap-1 p-1 bg-slate-950/95 rounded border border-slate-800 flex-wrap animate-in fade-in duration-100">
                        {FOLDER_COLOR_PRESETS.map((p) => (
                          <CustomizableButton
                            buttonId="adv_modal_btn_2"
                            key={p.color}
type="button"
onClick={() => handleChangeFolderColor(folder.id, p.color)}
className={cn(
                              "w-3 h-3 rounded-full border transition-all cursor-pointer",
                              folder.color === p.color ? "border-white scale-110" : "border-transparent opacity-75 hover:opacity-100"
                            )}
style={{ backgroundColor: p.color }}
title={p.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Main Apps List Container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1.5 pr-0.5">
        {filteredApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-44 text-slate-500 text-xs gap-1.5">
            <Zap className="w-6 h-6 text-slate-600" />
            <span>{uiText("components_adv_modal.span.no_advanced_tools_match_your_filter_or_searc", "No advanced tools match your filter or search.")}</span>
            {(searchQuery || activeCategory !== "all" || activeFolderTab !== "all") && (
              <CustomizableButton
                buttonId="adv_modal_btn_1"
                type="button"
onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                  setActiveFolderTab("all");
                }}
className="mt-1 text-[10px] text-emerald-400 hover:underline cursor-pointer"
              >
                  {() => (
                      <>
                        {uiText("components_adv_modal.button.clear_all_filters", "Clear all filters")}
                      </>
                    )}
              </CustomizableButton>
            )}
          </div>
        ) : (
          filteredApps.map((app) => {
            const assignedFolder = folders.find((f) => f.appIds.includes(app.id));
            const displayLabel = getButtonLabel(app.buttonId, app.name);
            const itemColor = app.color || "#10b981";

            return (
              <div
                key={app.id}
                className={cn(
                  "flex items-center justify-between gap-2 p-1.5 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/80 transition-all group",
                  app.hoverBorder,
                  app.hoverBg
                )}
              >
                {/* App Button Trigger */}
                <CustomizableButton
                  buttonId={app.buttonId}
                  defaultLabel={app.name}
                  defaultIcon={
                    <div
                      className={cn(
                        "p-1.5 rounded-md border shrink-0 transition-transform group-hover:scale-110 shadow-sm flex items-center justify-center",
                        app.iconBg,
                        app.iconBorder,
                        app.iconColor
                      )}
                      style={{
                        color: itemColor,
                        borderColor: `${itemColor}70`,
                        backgroundColor: `${itemColor}20`,
                        boxShadow: `0 0 12px ${itemColor}35`,
                      }}
                    >
                      {app.icon}
                    </div>
                  }
                  onClick={app.action}
                  className="flex-1 !justify-start gap-2 px-1 py-0.5 text-left cursor-pointer min-w-0 bg-transparent hover:bg-transparent border-0"
                >
                  {({ label, isTextHidden }) =>
                    !isTextHidden ? (
                      <div className="flex flex-col min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-bold text-[11.5px] text-slate-100 group-hover:text-white truncate transition-colors"
                            style={{
                              textShadow: `0 0 16px ${itemColor}40`,
                            }}
                          >
                            {label || displayLabel || app.name}
                          </span>
                          {/* CATEGORY BADGE PILL */}
                          <span className="text-[8px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 uppercase tracking-wider border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                            {app.categoryLabel}
                          </span>
                          {/* SHOW / HIDE TAGS BADGE */}
                          {showTags && app.badge && (
                            <span
                              className={cn(
                                "text-[8px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 animate-in fade-in duration-150",
                                app.badgeColor
                              )}
                            >
                              {app.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 group-hover:text-slate-300 truncate">
                          {app.subtitle}
                        </span>
                      </div>
                    ) : null
                  }
                </CustomizableButton>

                {/* Color-Coded Folder Selector Tag */}
                <div className="pr-1 shrink-0 flex items-center gap-1">
                  {assignedFolder && (
                    <div
                      className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: assignedFolder.color }}
                      title={`In folder: ${assignedFolder.name}`}
                    />
                  )}
                  <select
                    value={assignedFolder?.id || "none"}
                    onChange={(e) => {
                      const newFolderId = e.target.value;
                      if (newFolderId === "none") {
                        setFolders((prev) =>
                          prev.map((f) => ({
                            ...f,
                            appIds: f.appIds.filter((id) => id !== app.id),
                          }))
                        );
                      } else {
                        handleAssignAppToFolder(app.id, newFolderId);
                      }
                    }}
                    className="text-[9px] bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-slate-300 focus:outline-none focus:border-emerald-400 cursor-pointer max-w-[86px] truncate font-medium hover:border-slate-700"
                    title={uiText("components_adv_modal.select.assign_app_to_folder.title", "Assign app to folder")}
                  >
                    <option value="none">{uiText("components_adv_modal.option.unfiled", "Unfiled")}</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resize Handles (Drag to Size h/w) */}
      <div
        onMouseDown={(e) => handleResizeStart(e, "e")}
        className="absolute top-0 right-0 w-2 h-full cursor-e-resize hover:bg-emerald-500/20 active:bg-emerald-500/40 transition-colors z-20"
        title={uiText("components_adv_modal.div.drag_horizontally_to_resize_width.title", "Drag horizontally to resize width")}
      />
      <div
        onMouseDown={(e) => handleResizeStart(e, "s")}
        className="absolute bottom-0 left-0 w-full h-2 cursor-s-resize hover:bg-emerald-500/20 active:bg-emerald-500/40 transition-colors z-20"
        title={uiText("components_adv_modal.div.drag_vertically_to_resize_height.title", "Drag vertically to resize height")}
      />
      <div
        onMouseDown={(e) => handleResizeStart(e, "se")}
        onDoubleClick={handleResetSize}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 text-emerald-400 hover:text-emerald-200 z-30 group/grip"
        title={uiText("components_adv_modal.div.drag_to_resize_width_and_height_double_click.title", "Drag to resize width and height (Double-click to reset size)")}
      >
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          className="opacity-60 group-hover/grip:opacity-100 transition-opacity"
        >
          <path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );

  if (!isOpen) return null;

  if (typeof document !== "undefined") {
    return createPortal(panelElement, document.body);
  }
  return panelElement;
}
