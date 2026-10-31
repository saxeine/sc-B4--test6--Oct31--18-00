import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
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
  Palette,
  ShieldCheck,
  CheckCircle2,
  Crop,
  Split,
  Cpu,
  Layers,
  LayoutGrid,
  Sliders,
  MessageSquareCode,
  Keyboard,
  ScrollText,
  Tag,
  Database,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "../utils/cn";
import { CustomizableButton } from "./CustomizableButton";
import { CustomizableLabel } from "./CustomizableLabel";
import { useButtonCustomization } from "../context/ButtonCustomizationContext";
import { uiText } from "../hooks/useUIConfig";
import { remoteStore } from "../services/remoteKeyValueStore";
import { NamedWorkspaceDialog } from "./NamedWorkspaceDialog";
import type { NamedWorkspaceSnapshot } from "../types/namedWorkspace";

export type UtilityCategory = "customizers" | "workspace" | "tools";

export interface UtilityCategoryConfig {
  id: "all" | UtilityCategory;
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

export const UTILITY_MODAL_CATEGORIES: UtilityCategoryConfig[] = [
  {
    id: "all",
    buttonId: "utility_modal_tab_all",
    name: "All Utilities",
    shortLabel: "All",
    icon: Layers,
    color: "#38bdf8",
    activeBg: "bg-sky-500",
    activeText: "text-slate-950 font-bold",
    activeBorder: "border-sky-400",
    glow: "rgba(56,189,248,0.45)",
    badgeBg: "bg-sky-500/20",
    badgeText: "text-sky-300",
    badgeBorder: "border-sky-500/40",
    description: "All workspace customizers, config editors, logs, image joining, layout presets & hotkey utilities",
  },
  {
    id: "customizers",
    buttonId: "utility_modal_tab_customizers",
    name: "Customizers",
    shortLabel: "Customizers",
    icon: Cpu,
    color: "#10b981",
    activeBg: "bg-emerald-500",
    activeText: "text-slate-950 font-bold",
    activeBorder: "border-emerald-400",
    glow: "rgba(16,185,129,0.45)",
    badgeBg: "bg-emerald-500/20",
    badgeText: "text-emerald-300",
    badgeBorder: "border-emerald-500/40",
    description: "Button customizer, mini customizer, mouse-over dialogs & shortcut manager",
  },
  {
    id: "workspace",
    buttonId: "utility_modal_tab_workspace",
    name: "Data & Logs",
    shortLabel: "Data & Logs",
    icon: Database,
    color: "#f59e0b",
    activeBg: "bg-amber-500",
    activeText: "text-slate-950 font-bold",
    activeBorder: "border-amber-400",
    glow: "rgba(245,158,11,0.45)",
    badgeBg: "bg-amber-500/20",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/40",
    description: "Cloud database live editor, sequential changelog & custom grid layout presets",
  },
  {
    id: "tools",
    buttonId: "utility_modal_tab_tools",
    name: "Image Tools",
    shortLabel: "Image Tools",
    icon: Crop,
    color: "#06b6d4",
    activeBg: "bg-cyan-500",
    activeText: "text-slate-950 font-bold",
    activeBorder: "border-cyan-400",
    glow: "rgba(6,182,212,0.45)",
    badgeBg: "bg-cyan-500/20",
    badgeText: "text-cyan-300",
    badgeBorder: "border-cyan-500/40",
    description: "Bulk rename studio, smart auto-crop alpha trim & horizontal/vertical image joiner",
  },
];

export interface UtilityFolderConfig {
  id: string;
  name: string;
  color: string;
  appIds: string[];
}

export interface UtilityAppItem {
  id: string;
  buttonId: string;
  name: string;
  subtitle: string;
  category: UtilityCategory;
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
  { name: "Sky", color: "#38bdf8" },
  { name: "Emerald", color: "#10b981" },
  { name: "Cyan", color: "#06b6d4" },
  { name: "Amber", color: "#f59e0b" },
  { name: "Purple", color: "#a855f7" },
  { name: "Rose", color: "#f43f5e" },
  { name: "Blue", color: "#3b82f6" },
  { name: "Indigo", color: "#6366f1" },
  { name: "Teal", color: "#14b8a6" },
  { name: "Orange", color: "#f97316" },
];

const DEFAULT_UTILITY_FOLDERS: UtilityFolderConfig[] = [
  {
    id: "folder_customizers",
    name: "Customizer",
    color: "#10b981",
    appIds: ["button_customizer", "mini_button_customizer", "mouse_over_studio", "shortcut_manager"],
  },
  {
    id: "folder_data_logs",
    name: "Data & Logs",
    color: "#f59e0b",
    appIds: ["cloud_db_config", "the_log", "layout_presets_manager"],
  },
  {
    id: "folder_image_tools",
    name: "Image Tools",
    color: "#06b6d4",
    appIds: ["rename_studio", "smart_trim", "join_images"],
  },
];

export type UtilitySortMode = "name_asc" | "name_desc" | "original";

export const UTILITY_MODAL_DEFAULT_STATE_KEY = "seqcarver_utility_modal_default_state_v1";

export interface UtilityModalDefaultState {
  folders: UtilityFolderConfig[];
  activeCategory: "all" | UtilityCategory;
  activeFolderTab: string;
  showTags: boolean;
  isManagingFolders: boolean;
  sortMode?: UtilitySortMode;
  size: { width: number; height: number };
  position?: { x: number; y: number };
  lastSavedAt?: string;
}

export interface UtilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  captureNamedState: () => NamedWorkspaceSnapshot;
  restoreNamedState: (state: NamedWorkspaceSnapshot) => Promise<void>;
  onOpenButtonCustomizer: () => void;
  onOpenMiniCustomizer?: () => void;
  onOpenAppLog: () => void;
  onOpenRenameStudio: () => void;
  onOpenMouseOverStudio?: () => void;
  onOpenSmartTrim?: () => void;
  onOpenJoinImages?: () => void;
  onOpenLayoutPresets?: () => void;
  onOpenShortcutManager?: () => void;
}

const DEFAULT_WIDTH = 500;
const DEFAULT_HEIGHT = 420;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 280;

export function UtilityModal({
  isOpen,
  onClose,
  captureNamedState,
  restoreNamedState,
  onOpenButtonCustomizer,
  onOpenMiniCustomizer,
  onOpenAppLog,
  onOpenRenameStudio,
  onOpenMouseOverStudio,
  onOpenSmartTrim,
  onOpenJoinImages,
  onOpenLayoutPresets,
  onOpenShortcutManager,
}: UtilityModalProps) {
  const {
    getButtonLabel,
    saveCurrentAsDefault,
    restoreAllFromSavedSetup,
    openLiveCloudEditor,
    isDatabaseConnected,
  } = useButtonCustomization();
  const [showNamedStates, setShowNamedStates] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<string | null>(null);

  // Window Size State (persisted in localStorage)
  const [size, setSize] = useState<{ width: number; height: number }>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_utility_modal_size_v1");
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
      const stored = remoteStore.getItem("seqcarver_utility_modal_pos_v1");
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
      const stored = remoteStore.getItem("seqcarver_utility_modal_size_v1");
      if (!stored || stored.includes("450") || (stored.includes("500") && stored.includes("500\"}"))) {
        setSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
        try {
          remoteStore.setItem("seqcarver_utility_modal_size_v1", JSON.stringify({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }));
        } catch {}
      }
      const storedPos = remoteStore.getItem("seqcarver_utility_modal_pos_v1");
      if (!storedPos || storedPos.includes("760") || storedPos.includes("64")) {
        setPosition({ x: 255, y: 45 });
        try {
          remoteStore.setItem("seqcarver_utility_modal_pos_v1", JSON.stringify({ x: 255, y: 45 }));
        } catch {}
      }
      const storedTab = remoteStore.getItem("seqcarver_utility_modal_active_tab_v1");
      if (!storedTab || storedTab === "all") {
        setActiveFolderTab("folder_customizers");
      }
      const storedTags = remoteStore.getItem("seqcarver_utility_modal_show_tags_v1");
      if (storedTags === null) {
        setShowTags(false);
      }
      setIsManagingFolders(false);
    }
  }, [isOpen]);

  // Tag visibility state (persisted in localStorage, default false = all tags off)
  const [showTags, setShowTags] = useState<boolean>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_utility_modal_show_tags_v1");
      return stored === "true";
    } catch {
      return false;
    }
  });

  // Folders state
  const [folders, setFolders] = useState<UtilityFolderConfig[]>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_utility_modal_folders_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((f: UtilityFolderConfig) => {
            if (f.id === "folder_customizers" && f.name !== "Customizer") {
              return { ...f, name: "Customizer" };
            }
            return f;
          });
        }
      }
      return DEFAULT_UTILITY_FOLDERS;
    } catch {
      return DEFAULT_UTILITY_FOLDERS;
    }
  });

  const [activeFolderTab, setActiveFolderTab] = useState<string>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_utility_modal_active_tab_v1");
      if (stored && stored !== "all") return stored;
    } catch {}
    return "folder_customizers";
  });

  // Category filter tabs state ('all', 'customizers', 'workspace', 'tools')
  const [activeCategory, setActiveCategory] = useState<"all" | UtilityCategory>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_utility_modal_category_v1");
      if (stored && ["all", "customizers", "workspace", "tools"].includes(stored)) {
        return stored as "all" | UtilityCategory;
      }
    } catch {}
    return "all";
  });

  // Sort mode state: default is 'a to z, name' ("name_asc")
  const [sortMode, setSortMode] = useState<UtilitySortMode>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_utility_modal_sort_mode_v1");
      if (stored === "name_asc" || stored === "name_desc" || stored === "original") {
        return stored as UtilitySortMode;
      }
    } catch {}
    return "name_asc";
  });

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_utility_modal_sort_mode_v1", sortMode);
    } catch (e) {
      console.warn("Failed to persist utility sort mode", e);
    }
  }, [sortMode]);

  // Fast inline search query
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_utility_modal_category_v1", activeCategory);
    } catch (e) {
      console.warn("Failed to persist active utility category", e);
    }
  }, [activeCategory]);

  const [isManagingFolders, setIsManagingFolders] = useState<boolean>(() => {
    try {
      return remoteStore.getItem("seqcarver_utility_modal_show_folders_v1") === "true";
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

  // Save showTags to localStorage
  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_utility_modal_show_tags_v1", String(showTags));
    } catch (e) {
      console.warn("Failed to persist tag visibility", e);
    }
  }, [showTags]);

  // Save folders to localStorage persistently
  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_utility_modal_folders_v1", JSON.stringify(folders));
    } catch (e) {
      console.warn("Failed to persist utility modal folders", e);
    }
  }, [folders]);

  // Save active folder tab preference
  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_utility_modal_active_tab_v1", activeFolderTab);
    } catch (e) {
      console.warn("Failed to persist active folder tab", e);
    }
  }, [activeFolderTab]);

  // Save folder management panel visibility preference
  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_utility_modal_show_folders_v1", String(isManagingFolders));
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

  // Draggable mouse event listeners with requestAnimationFrame
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
        remoteStore.setItem("seqcarver_utility_modal_pos_v1", JSON.stringify(latestPosRef.current));
      } catch (e) {
        console.warn("Failed to persist utility modal position", e);
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

  // Resizing mouse event listeners (drag to size h/w) with requestAnimationFrame
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
        remoteStore.setItem("seqcarver_utility_modal_size_v1", JSON.stringify(latestSizeRef.current));
      } catch (e) {
        console.warn("Failed to persist utility modal size", e);
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
      remoteStore.setItem("seqcarver_utility_modal_size_v1", JSON.stringify(defaultSz));
      remoteStore.setItem("seqcarver_utility_modal_pos_v1", JSON.stringify(defaultPos));
    } catch {}
  };

  // Save All Changes as permanent default
  const handleSaveAllAsDefault = () => {
    try {
      const defaultState: UtilityModalDefaultState = {
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
      remoteStore.setItem(UTILITY_MODAL_DEFAULT_STATE_KEY, JSON.stringify(defaultState));
      remoteStore.setItem("seqcarver_utility_modal_folders_v1", JSON.stringify(folders));
      remoteStore.setItem("seqcarver_utility_modal_size_v1", JSON.stringify(size));
      remoteStore.setItem("seqcarver_utility_modal_pos_v1", JSON.stringify(position));
      remoteStore.setItem("seqcarver_utility_modal_active_tab_v1", activeFolderTab);
      remoteStore.setItem("seqcarver_utility_modal_category_v1", activeCategory);
      remoteStore.setItem("seqcarver_utility_modal_show_folders_v1", String(isManagingFolders));
      remoteStore.setItem("seqcarver_utility_modal_show_tags_v1", String(showTags));
      remoteStore.setItem("seqcarver_utility_modal_sort_mode_v1", sortMode);
      remoteStore.setItem("seqcarver_utility_modal_sort_mode_default_v1", sortMode);

      // Also persist button customizations across app
      saveCurrentAsDefault();

      setSaveDefaultSuccess(true);
      setTimeout(() => setSaveDefaultSuccess(false), 4000);
    } catch (e) {
      console.error("Failed to save utility modal settings as default", e);
    }
  };

  // Restore all from saved setup
  const handleRestoreSetup = () => {
    try {
      let savedFolders = DEFAULT_UTILITY_FOLDERS;
      let savedSize = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
      let savedPos: { x: number; y: number } | undefined = { x: 255, y: 45 };
      let savedTags = false;
      let savedCategory: "all" | UtilityCategory = "all";
      let savedActiveTab = "folder_customizers";
      let savedSortMode: UtilitySortMode = "name_asc";

      const storedUnified = remoteStore.getItem(UTILITY_MODAL_DEFAULT_STATE_KEY);
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
        const savedSortRaw = remoteStore.getItem("seqcarver_utility_modal_sort_mode_default_v1");
        if (savedSortRaw && ["name_asc", "name_desc", "original"].includes(savedSortRaw)) {
          savedSortMode = savedSortRaw as UtilitySortMode;
        }
      }

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
      console.error("Failed to restore utility modal setup", e);
      setRestoreFeedback(`Restore failed: ${e?.message || "Error"}`);
      setTimeout(() => setRestoreFeedback(null), 3500);
    }
  };

  // The 10 Utility Apps moved from Creative Studio
  const appItems: UtilityAppItem[] = useMemo(
    () => [
      {
        id: "cloud_db_config",
        buttonId: "utility_modal_cloud_db_config",
        name: "Cloud DB Config & Live Editor",
        subtitle: "Database Saves & On-the-Fly Config Sync",
        category: "workspace" as const,
        categoryLabel: "Data & DB",
        badge: isDatabaseConnected ? "Cloud Live" : "Offline",
        badgeColor: isDatabaseConnected
          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          : "bg-slate-700/50 text-slate-300 border border-slate-600/40",
        color: "#10b981",
        icon: <Database className="w-3.5 h-3.5 text-emerald-400" style={{ color: "#10b981" }} />,
        iconBg: "bg-emerald-500/15",
        iconBorder: "border-emerald-500/40",
        iconColor: "text-emerald-400",
        hoverBorder: "hover:border-emerald-500/60",
        hoverBg: "hover:bg-emerald-950/25",
        action: () => {
          onClose();
          openLiveCloudEditor();
        },
      },
      {
        id: "button_customizer",
        buttonId: "utility_modal_button_customizer",
        name: "Button Customizer",
        subtitle: "Button & Layout Optimizer",
        category: "customizers" as const,
        categoryLabel: "Customizer",
        badge: "Customizer",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        color: "#10b981",
        icon: <Cpu className="w-3.5 h-3.5 text-emerald-400" style={{ color: "#10b981" }} />,
        iconBg: "bg-emerald-500/15",
        iconBorder: "border-emerald-500/40",
        iconColor: "text-emerald-400",
        hoverBorder: "hover:border-emerald-500/60",
        hoverBg: "hover:bg-emerald-950/25",
        action: () => {
          onClose();
          onOpenButtonCustomizer();
        },
      },
      {
        id: "mini_button_customizer",
        buttonId: "utility_modal_mini_customizer",
        name: "Mini Button Customizer",
        subtitle: "Quick Floating Context Customizer",
        category: "customizers" as const,
        categoryLabel: "Customizer",
        badge: "Quick Mini",
        badgeColor: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
        color: "#06b6d4",
        icon: <Sliders className="w-3.5 h-3.5 text-cyan-400" style={{ color: "#06b6d4" }} />,
        iconBg: "bg-cyan-500/15",
        iconBorder: "border-cyan-500/40",
        iconColor: "text-cyan-400",
        hoverBorder: "hover:border-cyan-500/60",
        hoverBg: "hover:bg-cyan-950/25",
        action: () => {
          onClose();
          if (onOpenMiniCustomizer) onOpenMiniCustomizer();
        },
      },
      {
        id: "mouse_over_studio",
        buttonId: "utility_modal_mouse_over_studio",
        name: "Mouse Over Dialog Studio",
        subtitle: "Global Button Tooltip, Hover Dialog & Shortcut Editor",
        category: "customizers" as const,
        categoryLabel: "Customizer",
        badge: "Hover & Tips",
        badgeColor: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
        color: "#8b5cf6",
        icon: <MessageSquareCode className="w-3.5 h-3.5 text-violet-400" style={{ color: "#8b5cf6" }} />,
        iconBg: "bg-violet-500/15",
        iconBorder: "border-violet-500/40",
        iconColor: "text-violet-400",
        hoverBorder: "hover:border-violet-500/60",
        hoverBg: "hover:bg-violet-950/25",
        action: () => {
          onClose();
          if (onOpenMouseOverStudio) onOpenMouseOverStudio();
        },
      },
      {
        id: "the_log",
        buttonId: "utility_modal_the_log",
        name: "The Log",
        subtitle: "Sequential Changelog & Inputs",
        category: "workspace" as const,
        categoryLabel: "Audit",
        badge: "Audit",
        badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
        color: "#f59e0b",
        icon: <ScrollText className="w-3.5 h-3.5 text-amber-400" style={{ color: "#f59e0b" }} />,
        iconBg: "bg-amber-500/15",
        iconBorder: "border-amber-500/40",
        iconColor: "text-amber-400",
        hoverBorder: "hover:border-amber-500/60",
        hoverBg: "hover:bg-amber-950/25",
        action: () => {
          onClose();
          onOpenAppLog();
        },
      },
      {
        id: "rename_studio",
        buttonId: "utility_modal_rename_studio",
        name: "Rename Studio",
        subtitle: "Bulk Rename & Filename Tags",
        category: "tools" as const,
        categoryLabel: "Image Tools",
        badge: "Tags",
        badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
        color: "#f43f5e",
        icon: <Tag className="w-3.5 h-3.5 text-rose-400" style={{ color: "#f43f5e" }} />,
        iconBg: "bg-rose-500/15",
        iconBorder: "border-rose-500/40",
        iconColor: "text-rose-400",
        hoverBorder: "hover:border-rose-500/60",
        hoverBg: "hover:bg-rose-950/25",
        action: () => {
          onClose();
          onOpenRenameStudio();
        },
      },
      {
        id: "smart_trim",
        buttonId: "utility_modal_smart_trim",
        name: "Smart Auto-Crop",
        subtitle: "Alpha Padding Trim & Pivot Anchors",
        category: "tools" as const,
        categoryLabel: "Image Tools",
        badge: "Pivot Align",
        badgeColor: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
        color: "#06b6d4",
        icon: <Crop className="w-3.5 h-3.5 text-cyan-400" style={{ color: "#06b6d4" }} />,
        iconBg: "bg-cyan-500/15",
        iconBorder: "border-cyan-500/40",
        iconColor: "text-cyan-400",
        hoverBorder: "hover:border-cyan-500/60",
        hoverBg: "hover:bg-cyan-950/25",
        action: () => {
          onClose();
          if (onOpenSmartTrim) onOpenSmartTrim();
        },
      },
      {
        id: "join_images",
        buttonId: "utility_modal_join_images",
        name: "Join / Stitch Studio",
        subtitle: "Join Images Together (H / W)",
        category: "tools" as const,
        categoryLabel: "Image Tools",
        badge: "H / W Join",
        badgeColor: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
        color: "#06b6d4",
        icon: <Split className="w-3.5 h-3.5 text-cyan-400" style={{ color: "#06b6d4" }} />,
        iconBg: "bg-cyan-500/15",
        iconBorder: "border-cyan-500/40",
        iconColor: "text-cyan-400",
        hoverBorder: "hover:border-cyan-400/70",
        hoverBg: "hover:bg-cyan-950/30",
        action: () => {
          onClose();
          if (onOpenJoinImages) onOpenJoinImages();
        },
      },
      {
        id: "layout_presets_manager",
        buttonId: "utility_modal_layout_presets_manager",
        name: "Layout Presets Studio",
        subtitle: "Save & Load Custom Canvas Grid Configurations",
        category: "workspace" as const,
        categoryLabel: "Data & DB",
        badge: "Grid Presets",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        color: "#10b981",
        icon: <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" style={{ color: "#10b981" }} />,
        iconBg: "bg-emerald-500/15",
        iconBorder: "border-emerald-500/40",
        iconColor: "text-emerald-400",
        hoverBorder: "hover:border-emerald-500/60",
        hoverBg: "hover:bg-emerald-950/25",
        action: () => {
          onClose();
          if (onOpenLayoutPresets) onOpenLayoutPresets();
        },
      },
      {
        id: "shortcut_manager",
        buttonId: "utility_modal_shortcut_manager",
        name: "Custom Shortcut Manager",
        subtitle: "Configure Hotkeys for Fast One-Key Slicing & Tools",
        category: "customizers" as const,
        categoryLabel: "Customizer",
        badge: "Hotkeys",
        badgeColor: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
        color: "#06b6d4",
        icon: <Keyboard className="w-3.5 h-3.5 text-cyan-400" style={{ color: "#06b6d4" }} />,
        iconBg: "bg-cyan-500/15",
        iconBorder: "border-cyan-500/40",
        iconColor: "text-cyan-400",
        hoverBorder: "hover:border-cyan-500/60",
        hoverBg: "hover:bg-cyan-950/25",
        action: () => {
          onClose();
          if (onOpenShortcutManager) onOpenShortcutManager();
        },
      },
    ],
    [
      onClose,
      openLiveCloudEditor,
      isDatabaseConnected,
      onOpenButtonCustomizer,
      onOpenMiniCustomizer,
      onOpenAppLog,
      onOpenRenameStudio,
      onOpenMouseOverStudio,
      onOpenSmartTrim,
      onOpenJoinImages,
      onOpenLayoutPresets,
      onOpenShortcutManager,
    ]
  );

  // Helper to assign an app to a folder
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
        remoteStore.setItem("seqcarver_utility_modal_folders_v1", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to persist folder assignment", e);
      }
      return updated;
    });
  };

  // Helper to create a new folder
  const handleCreateFolder = (nameInput?: string, colorInput?: string) => {
    const trimmed = (nameInput || quickFolderName || newFolderName).trim();
    const finalName = trimmed || `Folder ${folders.length + 1}`;
    const finalColor =
      colorInput ||
      newFolderColor ||
      FOLDER_COLOR_PRESETS[folders.length % FOLDER_COLOR_PRESETS.length].color;

    const newFolder: UtilityFolderConfig = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: finalName,
      color: finalColor,
      appIds: [],
    };

    setFolders((prev) => {
      const next = [...prev, newFolder];
      try {
        remoteStore.setItem("seqcarver_utility_modal_folders_v1", JSON.stringify(next));
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

  // Helper to delete a folder
  const handleDeleteFolder = (folderId: string) => {
    setFolders((prev) => {
      const next = prev.filter((f) => f.id !== folderId);
      try {
        remoteStore.setItem("seqcarver_utility_modal_folders_v1", JSON.stringify(next));
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

  // Helper to reorder folders
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
        remoteStore.setItem("seqcarver_utility_modal_folders_v1", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to persist folder reordering", e);
      }
      return updated;
    });
  };

  // Helper to rename a folder
  const handleRenameFolder = (folderId: string, newName: string) => {
    if (!newName.trim()) return;
    setFolders((prev) => {
      const updated = prev.map((f) =>
        f.id === folderId ? { ...f, name: newName.trim() } : f
      );
      try {
        remoteStore.setItem("seqcarver_utility_modal_folders_v1", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to persist folder rename", e);
      }
      return updated;
    });
    setEditingFolderId(null);
    setEditingName("");
  };

  // Helper to update folder color
  const handleChangeFolderColor = (folderId: string, newColor: string) => {
    setFolders((prev) => {
      const updated = prev.map((f) =>
        f.id === folderId ? { ...f, color: newColor } : f
      );
      try {
        remoteStore.setItem("seqcarver_utility_modal_folders_v1", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to persist folder color", e);
      }
      return updated;
    });
    setColorPickerFolderId(null);
  };

  // Helper to reset folders back to standard default
  const handleResetFoldersToDefault = () => {
    setFolders(DEFAULT_UTILITY_FOLDERS);
    setColorPickerFolderId(null);
    setEditingFolderId(null);
    setIsCreatingFolder(false);
    try {
      remoteStore.setItem("seqcarver_utility_modal_folders_v1", JSON.stringify(DEFAULT_UTILITY_FOLDERS));
    } catch (e) {
      console.warn("Failed to persist default folders", e);
    }
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: appItems.length,
      customizers: 0,
      workspace: 0,
      tools: 0,
    };
    appItems.forEach((app) => {
      if (counts[app.category] !== undefined) {
        counts[app.category]++;
      }
    });
    return counts;
  }, [appItems]);

  // Filter apps by category, folder, and search query
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
      id="utility_modal_panel"
      data-utility-modal="true"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
      className={cn(
        "fixed bg-[#0a0f1d] border border-sky-500/50 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-2.5 z-[9998] text-slate-100 select-none flex flex-col overflow-hidden will-change-transform",
        isDragging && "ring-2 ring-sky-400 shadow-sky-500/25 opacity-95",
        isResizing && "ring-2 ring-emerald-400/90"
      )}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDragStart={(e) => e.stopPropagation()}
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleDragStart}
        className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-800 cursor-grab active:cursor-grabbing group/header shrink-0"
        title={uiText("components_utility_modal.div.click_and_drag_to_move_utility_modal.title", "Click and drag to move Utility Modal")}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="text-slate-500 group-hover/header:text-sky-400 transition-colors shrink-0">
            <GripHorizontal className="w-3.5 h-3.5" />
          </div>
          <CustomizableLabel
            as="h3"
            labelId="utility_modal_header_title"
            defaultLabel="Utility Modal"
            showLabelAlways={true}
            defaultIcon={<Cpu className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
            className="font-bold text-xs text-slate-100 tracking-normal truncate leading-tight pl-1"
          />
          {/* Live X, Y Screen Position Indicator */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/80 border border-sky-500/30 text-[9px] font-mono text-sky-300 font-bold shrink-0 ml-1 shadow-sm select-none"
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
            buttonId="utility_modal_toggle_tags"
            defaultLabel={showTags ? "Tags" : "Tags off"}
            defaultIcon={
              <Tag
                className={cn(
                  "w-3 h-3 transition-colors",
                  showTags ? "text-sky-400" : "text-slate-500 line-through opacity-70"
                )}
              />
            }
            onClick={() => setShowTags(!showTags)}
            className={cn(
              "flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md cursor-pointer transition-all shadow-sm border",
              showTags
                ? "text-sky-300 hover:text-sky-100 bg-sky-500/15 hover:bg-sky-500/30 border-sky-500/40"
                : "text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-slate-800 border-slate-700/60"
            )}
            title={showTags ? "Click to hide all tag badges" : "Click to show all tag badges"}
          />

          {/* DEFAULT BUTTON: Saves all changes as permanent default */}
          <CustomizableButton
            buttonId="utility_modal_save_default"
            defaultLabel="Default"
            defaultIcon={<ShieldCheck className="w-3 h-3 text-amber-400" />}
            onClick={handleSaveAllAsDefault}
            className="flex items-center gap-1 text-[9.5px] font-bold text-amber-300 hover:text-amber-100 bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 px-1.5 py-0.5 rounded-md cursor-pointer transition-all shadow-sm"
            title="Save all Utility settings, folders, size, position, tags visibility, and button customizations as permanent default"
          />

          {/* RESTORE BUTTON */}
          <CustomizableButton
            buttonId="utility_modal_restore_setup"
            defaultLabel="Restore"
            defaultIcon={<RotateCcw className="w-3 h-3 text-sky-400" />}
            onClick={handleRestoreSetup}
            className="flex items-center gap-1 text-[9.5px] font-bold text-sky-300 hover:text-sky-100 bg-sky-500/15 hover:bg-sky-500/30 border border-sky-500/40 px-1.5 py-0.5 rounded-md cursor-pointer transition-all shadow-sm"
            title="Restore all button labels, icons, zero-text and layout settings from your saved setup across the entire application"
          />

          {/* CLOUD DB QUICK BUTTON */}
          <CustomizableButton
            buttonId="utility_modal_btn_29"
            defaultIcon={<Database className="w-3 h-3 text-emerald-400" />}
            type="button"
onClick={() => {
              onClose();
              openLiveCloudEditor();
            }}
className={cn(
              "flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md cursor-pointer transition-all shadow-sm border",
              isDatabaseConnected
                ? "text-emerald-300 hover:text-emerald-100 bg-emerald-500/15 hover:bg-emerald-500/30 border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-slate-800 border-slate-700/60"
            )}
title={uiText("components_utility_modal.button.open_cloud_database_configuration_manager_an.title", "Open Cloud Database Configuration Manager & Live On-the-Fly Editor")}
          >
              {() => (
                  <>
                    <span>{uiText("components_utility_modal.span.cloud_db", "Cloud DB")}</span>
                  </>
                )}
          </CustomizableButton>

          <button type="button" onClick={() => setShowNamedStates(true)}
            className="text-[9.5px] font-bold text-sky-300 hover:text-white bg-sky-500/15 hover:bg-sky-500/30 border border-sky-500/40 px-1.5 py-0.5 rounded-md"
            title="Save a named workspace and exit, or recall a saved state">
            Save &amp; Exit
          </button>

          {/* Close Button */}
          <CustomizableButton
            buttonId="utility_modal_btn_28"
            defaultIcon={<X className="w-3 h-3" />}
            type="button"
onClick={onClose}
className="p-1 text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-md cursor-pointer transition-colors"
title={uiText("components_utility_modal.button.close_utility_modal.title", "Close Utility Modal")}
          />
        </div>
      </div>

      {/* Restore Feedback Notification Banner */}
      {restoreFeedback && (
        <div className="mb-2 px-2 py-1 bg-sky-950/90 border border-sky-500/50 rounded-lg flex items-center justify-between gap-1.5 text-[10px] text-sky-200 animate-in fade-in slide-in-from-top-1 duration-150 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <RotateCcw className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate font-semibold">{restoreFeedback}</span>
          </div>
          <CustomizableButton
            buttonId="utility_modal_btn_27"
            defaultIcon={<X className="w-3 h-3" />}
            type="button"
onClick={() => setRestoreFeedback(null)}
className="text-sky-400 hover:text-white p-0.5"
          />
        </div>
      )}

      {/* Save as Default Success Notification Banner */}
      {saveDefaultSuccess && (
        <div className="mb-2 px-2 py-1 bg-emerald-950/90 border border-emerald-500/50 rounded-lg flex items-center justify-between gap-1.5 text-[10px] text-emerald-200 animate-in fade-in slide-in-from-top-1 duration-150 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate font-semibold">
              {uiText("components_utility_modal.span.all_utility_settings_folders_and_button_cust", "All Utility settings, folders & button customizations saved as default!")}
            </span>
          </div>
          <CustomizableButton
            buttonId="utility_modal_btn_26"
            defaultIcon={<X className="w-3 h-3" />}
            type="button"
onClick={() => setSaveDefaultSuccess(false)}
className="text-emerald-400 hover:text-white p-0.5"
          />
        </div>
      )}

      {/* Preset Category Filter Tabs Bar & Search */}
      <div className="flex flex-col gap-1.5 mb-2 shrink-0">
        <div className="flex items-center justify-between gap-1.5">
          {/* Scrollable Category Filter Tabs & Folder Icons in Filter Header (where 'all' is located) */}
          <div className="relative flex items-center min-w-0 flex-1 group/filter">
            {/* Scroll Left Button */}
            <CustomizableButton
              buttonId="utility_modal_btn_25"
              defaultIcon={<ChevronLeft className="w-3 h-3" />}
              type="button"
onClick={() => {
                if (filterHeaderRef.current) {
                  filterHeaderRef.current.scrollBy({ left: -140, behavior: "smooth" });
                }
              }}
className="p-0.5 rounded text-slate-500 hover:text-sky-300 hover:bg-slate-800/80 cursor-pointer shrink-0 mr-0.5 transition-colors"
title={uiText("components_utility_modal.button.scroll_left.title", "Scroll left")}
            />

            <div
              ref={filterHeaderRef}
              className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-thin flex-1 min-w-0 scroll-smooth"
            >
              {UTILITY_MODAL_CATEGORIES.map((cat) => {
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
                const folderBtnId = `utility_modal_${folder.id}`;

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
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-sky-500/60 shrink-0 animate-in fade-in duration-100">
                  <Folder className="w-3 h-3 text-sky-400 shrink-0 ml-1" />
                  <input
                    type="text"
                    value={quickFolderName}
                    onChange={(e) => setQuickFolderName(e.target.value)}
                    placeholder={uiText("components_utility_modal.input.folder_name.placeholder", "Folder name...")}
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
                    buttonId="utility_modal_btn_24"
                    defaultIcon={<Check className="w-2.5 h-2.5" />}
                    type="button"
onClick={() => handleCreateFolder(quickFolderName)}
className="p-1 text-emerald-400 hover:text-emerald-200 cursor-pointer"
title={uiText("components_utility_modal.button.add_folder.title", "Add folder")}
                  />
                  <CustomizableButton
                    buttonId="utility_modal_btn_23"
                    defaultIcon={<X className="w-2.5 h-2.5" />}
                    type="button"
onClick={() => {
                      setIsQuickAddingFolder(false);
                      setQuickFolderName("");
                    }}
className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
title={uiText("components_utility_modal.button.cancel.title", "Cancel")}
                  />
                </div>
              ) : (
                <CustomizableButton
                  buttonId="utility_modal_add_folder"
                  defaultLabel="+ Folder"
                  defaultIcon={<FolderPlus className="w-3 h-3 text-sky-400 shrink-0" />}
                  onClick={() => setIsQuickAddingFolder(true)}
                  className="px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 border shrink-0 bg-slate-900/60 text-sky-400 hover:text-sky-200 border-sky-500/30 hover:border-sky-400/60 hover:bg-sky-950/30"
                  title="Add a new folder (creates a new folder icon here in filter header)"
                />
              )}
            </div>

            {/* Scroll Right Button */}
            <CustomizableButton
              buttonId="utility_modal_btn_22"
              defaultIcon={<ChevronRight className="w-3 h-3" />}
              type="button"
onClick={() => {
                if (filterHeaderRef.current) {
                  filterHeaderRef.current.scrollBy({ left: 140, behavior: "smooth" });
                }
              }}
className="p-0.5 rounded text-slate-500 hover:text-sky-300 hover:bg-slate-800/80 cursor-pointer shrink-0 ml-0.5 transition-colors"
title={uiText("components_utility_modal.button.scroll_right.title", "Scroll right")}
            />
          </div>

          {/* Right Action Tools: Folders Tray toggle & Sort */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Sort Dropdown / Cycle Button */}
            <CustomizableButton
              buttonId="utility_modal_btn_21"
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
                  ? "text-sky-300 bg-sky-500/20 border-sky-500/40"
                  : sortMode === "name_desc"
                  ? "text-indigo-300 bg-indigo-500/20 border-indigo-500/40"
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
                <ArrowDownAZ className="w-3 h-3 text-sky-400 shrink-0" />
              ) : sortMode === "name_desc" ? (
                <ArrowUpAZ className="w-3 h-3 text-indigo-400 shrink-0" />
              ) : (
                <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
              )}
                    <span className="hidden sm:inline">
                {sortMode === "name_asc" ? "A-Z" : sortMode === "name_desc" ? "Z-A" : "Default"}
              </span>
                    </>
                  )}
            </CustomizableButton>

            <CustomizableButton
              buttonId="utility_modal_btn_20"
              defaultIcon={<FolderOpen className="w-3 h-3 text-sky-400" />}
              type="button"
onClick={() => setIsManagingFolders(!isManagingFolders)}
className={cn(
                "px-1.5 py-1 rounded-md text-[10px] cursor-pointer transition-colors shrink-0 border flex items-center gap-1 font-semibold",
                isManagingFolders || activeFolderTab !== "all"
                  ? "text-sky-300 bg-sky-500/20 border-sky-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-800"
              )}
title={isManagingFolders ? "Hide Folders Tray" : "Manage / Filter by Custom Folders"}
            >
                {() => (
                    <>
                      <span className="hidden sm:inline">{uiText("components_utility_modal.span.folders", "Folders")}</span>
                    </>
                  )}
            </CustomizableButton>
          </div>
        </div>

        {/* Active Category Description / Reset Banner */}
        {activeCategory !== "all" && (
          <div className="flex items-center justify-between px-2 py-0.5 rounded bg-slate-900/70 border border-slate-800/80 text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-300 truncate">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    UTILITY_MODAL_CATEGORIES.find((c) => c.id === activeCategory)?.color || "#38bdf8",
                }}
              />
              <span className="font-bold text-slate-200 capitalize">
                {UTILITY_MODAL_CATEGORIES.find((c) => c.id === activeCategory)?.name}:
              </span>
              <span className="text-slate-400 truncate">
                {UTILITY_MODAL_CATEGORIES.find((c) => c.id === activeCategory)?.description}
              </span>
            </div>
            <CustomizableButton
              buttonId="utility_modal_btn_19"
              type="button"
onClick={() => setActiveCategory("all")}
className="text-[9.5px] text-sky-400 hover:text-sky-200 font-bold ml-2 shrink-0 cursor-pointer"
            >
                {() => (
                    <>
                      {uiText("components_utility_modal.button.show_all", "Show All")}
                    </>
                  )}
            </CustomizableButton>
          </div>
        )}

        {/* Dynamic Folders Bar */}
        {(isManagingFolders || activeFolderTab !== "all") && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-thin pt-0.5 border-t border-slate-800/60">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 shrink-0 mr-0.5">
              {uiText("components_utility_modal.span.folder", "Folder:")}
            </span>
            <CustomizableButton
              buttonId="utility_modal_btn_18"
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
                      {uiText("components_utility_modal.button.all_folders", "All Folders")}
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
                  buttonId="utility_modal_btn_17"
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
              buttonId="utility_modal_btn_16"
              defaultIcon={<Plus className="w-2.5 h-2.5" />}
              type="button"
onClick={() => {
                setIsManagingFolders(true);
                setIsCreatingFolder(true);
              }}
className="p-0.5 px-1 rounded text-[9.5px] text-sky-400 hover:text-sky-200 hover:bg-sky-500/20 bg-slate-900/80 border border-sky-500/30 cursor-pointer transition-colors flex items-center gap-0.5 shrink-0"
title={uiText("components_utility_modal.button.add_new_folder.title", "Add New Folder")}
            />
          </div>
        )}
      </div>

      {/* Show/Hide Folder Management Tray */}
      {isManagingFolders && (
        <div className="mb-2 p-2 bg-slate-900/95 border border-sky-500/30 rounded-lg space-y-2 text-xs shrink-0 animate-in fade-in duration-150 max-h-[220px] overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between text-[10px] font-bold text-sky-300 pb-1 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>{uiText("components_utility_modal.span.utility_folders", "Utility Folders (")}{folders.length})</span>
            </div>
            <div className="flex items-center gap-1">
              <CustomizableButton
                buttonId="utility_modal_btn_15"
                defaultIcon={<FolderPlus className="w-2.5 h-2.5" />}
                type="button"
onClick={() => setIsCreatingFolder(!isCreatingFolder)}
className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded border cursor-pointer flex items-center gap-1 transition-colors font-bold",
                  isCreatingFolder
                    ? "bg-sky-500 text-slate-950 border-sky-400"
                    : "text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/40"
                )}
title={uiText("components_utility_modal.button.add_a_new_custom_folder.title", "Add a new custom folder")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_utility_modal.span.folder_2", "+ Folder")}</span>
                      </>
                    )}
              </CustomizableButton>

              <CustomizableButton
                buttonId="utility_modal_btn_14"
                type="button"
onClick={handleResetFoldersToDefault}
className="text-[9px] text-amber-300 hover:text-amber-200 px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 cursor-pointer transition-colors"
title={uiText("components_utility_modal.button.reset_folders_back_to_standard_default.title", "Reset folders back to standard default")}
              >
                  {() => (
                      <>
                        {uiText("components_utility_modal.button.reset", "Reset")}
                      </>
                    )}
              </CustomizableButton>

              <CustomizableButton
                buttonId="utility_modal_btn_13"
                type="button"
onClick={() => setIsManagingFolders(false)}
className="text-[9px] text-slate-400 hover:text-sky-300 px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer"
title={uiText("components_utility_modal.button.hide_folder_management_tray.title", "Hide folder management tray")}
              >
                  {() => (
                      <>
                        {uiText("components_utility_modal.button.hide", "Hide")}
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>

          {/* New Folder Creation Bar */}
          {isCreatingFolder && (
            <div className="p-1.5 bg-slate-950/90 rounded-md border border-sky-500/50 space-y-1.5 animate-in fade-in duration-100">
              <div className="flex items-center gap-1.5">
                <Folder
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: newFolderColor, fill: `${newFolderColor}30` }}
                />
                <input
                  type="text"
                  placeholder={uiText("components_utility_modal.input.new_folder_name.placeholder", "New Folder Name...")}
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateFolder();
                    }
                  }}
                  autoFocus
                  className="bg-slate-900 text-slate-100 text-[10px] px-2 py-1 rounded border border-sky-500/60 focus:outline-none flex-1 min-w-0"
                />
                <CustomizableButton
                  buttonId="utility_modal_btn_12"
                  defaultIcon={<Plus className="w-3 h-3" />}
                  type="button"
onClick={() => handleCreateFolder()}
className="px-2 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-[10px] rounded cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                >
                    {() => (
                        <>
                          <span>{uiText("components_utility_modal.span.add", "Add")}</span>
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="utility_modal_btn_11"
                  defaultIcon={<X className="w-3 h-3" />}
                  type="button"
onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName("");
                  }}
className="p-1 text-slate-400 hover:text-rose-300 cursor-pointer"
title={uiText("components_utility_modal.button.cancel.title_2", "Cancel")}
                />
              </div>

              {/* Color swatch selection for new folder */}
              <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                <span className="text-[8px] text-slate-400 font-semibold pl-1">{uiText("components_utility_modal.span.color", "Color:")}</span>
                {FOLDER_COLOR_PRESETS.map((preset) => (
                  <CustomizableButton
                    buttonId="utility_modal_btn_10"
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

          {/* List of existing folders with edit, color, reorder, delete */}
          <div className="space-y-1">
            {folders.length === 0 ? (
              <div className="text-center py-2 text-slate-500 text-[10px]">
                {uiText("components_utility_modal.div.no_custom_folders_click_folder_to_create_one", "No custom folders. Click \"+ Folder\" to create one.")}
              </div>
            ) : (
              folders.map((folder, index) => {
                const isEditing = editingFolderId === folder.id;
                const isColorPicking = colorPickerFolderId === folder.id;
                const count = folder.appIds.length;

                return (
                  <div key={folder.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-1 bg-slate-950/90 p-1.5 rounded-md border border-slate-800 hover:border-slate-700">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <Folder
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: folder.color, fill: `${folder.color}30` }}
                        />
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleRenameFolder(folder.id, editingName);
                              }
                            }}
                            autoFocus
                            className="bg-slate-900 text-slate-100 text-[10px] px-1.5 py-0.5 rounded border border-sky-500 focus:outline-none flex-1 min-w-0"
                          />
                        ) : (
                          <span className="font-bold text-slate-200 text-[10px] truncate">
                            {folder.name}
                          </span>
                        )}
                        <span
                          className="text-[8.5px] font-mono px-1 rounded shrink-0"
                          style={{ color: folder.color, backgroundColor: `${folder.color}15` }}
                        >
                          ({count}{uiText("components_utility_modal.span.apps", " apps)")}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <CustomizableButton
                          buttonId="utility_modal_btn_9"
                          defaultIcon={<ArrowUp className="w-2.5 h-2.5" />}
                          type="button"
disabled={index === 0}
onClick={() => handleMoveFolder(folder.id, "up")}
className={cn(
                            "p-1 rounded cursor-pointer transition-colors",
                            index === 0
                              ? "text-slate-600 cursor-not-allowed"
                              : "text-slate-400 hover:text-sky-300 hover:bg-slate-800"
                          )}
title={uiText("components_utility_modal.button.move_folder_up.title", "Move folder up")}
                        />

                        <CustomizableButton
                          buttonId="utility_modal_btn_8"
                          defaultIcon={<ArrowDown className="w-2.5 h-2.5" />}
                          type="button"
disabled={index === folders.length - 1}
onClick={() => handleMoveFolder(folder.id, "down")}
className={cn(
                            "p-1 rounded cursor-pointer transition-colors",
                            index === folders.length - 1
                              ? "text-slate-600 cursor-not-allowed"
                              : "text-slate-400 hover:text-sky-300 hover:bg-slate-800"
                          )}
title={uiText("components_utility_modal.button.move_folder_down.title", "Move folder down")}
                        />

                        <CustomizableButton
                          buttonId="utility_modal_btn_7"
                          defaultIcon={<Palette className="w-2.5 h-2.5 text-purple-400" />}
                          type="button"
onClick={() =>
                            setColorPickerFolderId(isColorPicking ? null : folder.id)
                          }
className="p-1 text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded cursor-pointer transition-colors"
title={uiText("components_utility_modal.button.pick_color.title", "Pick color")}
                        />

                        {isEditing ? (
                          <CustomizableButton
                            buttonId="utility_modal_btn_6"
                            defaultIcon={<Check className="w-2.5 h-2.5 text-emerald-400" />}
                            type="button"
onClick={() => handleRenameFolder(folder.id, editingName)}
className="p-1 text-emerald-400 hover:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 rounded cursor-pointer transition-colors"
title={uiText("components_utility_modal.button.save_name.title", "Save name")}
                          />
                        ) : (
                          <CustomizableButton
                            buttonId="utility_modal_btn_5"
                            defaultIcon={<Edit2 className="w-2.5 h-2.5 text-sky-400" />}
                            type="button"
onClick={() => {
                              setEditingFolderId(folder.id);
                              setEditingName(folder.name);
                            }}
className="p-1 text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded cursor-pointer transition-colors"
title={uiText("components_utility_modal.button.rename_folder.title", "Rename folder")}
                          />
                        )}

                        <CustomizableButton
                          buttonId="utility_modal_btn_4"
                          defaultIcon={<Trash2 className="w-2.5 h-2.5 text-rose-400" />}
                          type="button"
onClick={() => handleDeleteFolder(folder.id)}
className="p-1 text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 rounded cursor-pointer transition-colors"
title={`Delete folder "${folder.name}" (apps will remain unfiled)`}
                        />
                      </div>
                    </div>

                    {/* Inline Color Palette Picker */}
                    {isColorPicking && (
                      <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded border border-sky-500/40 animate-in fade-in duration-100">
                        <span className="text-[8px] text-sky-400 font-semibold pl-1">
                          {uiText("components_utility_modal.span.color_2", "Color:")}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {FOLDER_COLOR_PRESETS.map((preset) => (
                            <CustomizableButton
                              buttonId="utility_modal_btn_3"
                              key={preset.color}
type="button"
onClick={() =>
                                handleChangeFolderColor(folder.id, preset.color)
                              }
className={cn(
                                "w-3.5 h-3.5 rounded-full border transition-all cursor-pointer",
                                folder.color === preset.color
                                  ? "border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                                  : "border-transparent opacity-80 hover:opacity-100 hover:scale-105"
                              )}
style={{ backgroundColor: preset.color }}
title={preset.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Utility Apps List */}
      <div className="space-y-1 flex-1 min-h-0 overflow-y-auto pr-0.5 scrollbar-thin">
        {filteredApps.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-[11px] space-y-2">
            <div>
              {searchQuery.trim()
                ? `No utilities match "${searchQuery}".`
                : activeCategory !== "all"
                ? `No utilities found in category "${activeCategory}".`
                : "No utilities found in this filter."}
            </div>
            <div className="pt-1 flex items-center justify-center gap-2">
              <CustomizableButton
                buttonId="utility_modal_btn_2"
                type="button"
onClick={() => {
                  setActiveCategory("all");
                  setActiveFolderTab("all");
                  setSearchQuery("");
                }}
className="px-2 py-1 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 font-bold text-[10px] cursor-pointer border border-sky-500/40"
              >
                  {() => (
                      <>
                        {uiText("components_utility_modal.button.reset_all_filters", "Reset All Filters")}
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="utility_modal_btn_1"
                type="button"
onClick={() => setIsManagingFolders(true)}
className="text-slate-400 hover:text-slate-200 font-semibold text-[10px] cursor-pointer"
              >
                  {() => (
                      <>
                        {uiText("components_utility_modal.button.folders", "Folders")}
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>
        ) : (
          filteredApps.map((app) => {
            const assignedFolder = folders.find((f) => f.appIds.includes(app.id));
            const displayLabel = getButtonLabel(app.buttonId, app.name);
            const itemColor = app.color;

            return (
              <div
                key={app.id}
                className={cn(
                  "group relative flex items-center justify-between rounded-lg bg-slate-900/50 hover:bg-[#060c1c] border border-slate-800/80 transition-all p-1 shadow-sm",
                  app.hoverBorder,
                  app.hoverBg
                )}
              >
                <CustomizableButton
                  buttonId={app.buttonId}
                  defaultLabel={app.name}
                  iconClassName={cn("w-3.5 h-3.5 shrink-0", app.iconColor)}
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
                          {/* CATEGORY BADGE */}
                          <span
                            className={cn(
                              "text-[8px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 uppercase tracking-wider border",
                              app.category === "customizers" && "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
                              app.category === "workspace" && "bg-amber-500/20 text-amber-300 border-amber-500/40",
                              app.category === "tools" && "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                            )}
                          >
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
                    className="text-[9px] bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-slate-300 focus:outline-none focus:border-sky-400 cursor-pointer max-w-[86px] truncate font-medium hover:border-slate-700"
                    title={uiText("components_utility_modal.select.assign_app_to_folder.title", "Assign app to folder")}
                  >
                    <option value="none">{uiText("components_utility_modal.option.unfiled", "Unfiled")}</option>
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
      {/* Right edge handle */}
      <div
        onMouseDown={(e) => handleResizeStart(e, "e")}
        className="absolute top-0 right-0 w-2 h-full cursor-e-resize hover:bg-sky-500/20 active:bg-sky-500/40 transition-colors z-20"
        title={uiText("components_utility_modal.div.drag_horizontally_to_resize_width.title", "Drag horizontally to resize width")}
      />
      {/* Bottom edge handle */}
      <div
        onMouseDown={(e) => handleResizeStart(e, "s")}
        className="absolute bottom-0 left-0 w-full h-2 cursor-s-resize hover:bg-sky-500/20 active:bg-sky-500/40 transition-colors z-20"
        title={uiText("components_utility_modal.div.drag_vertically_to_resize_height.title", "Drag vertically to resize height")}
      />
      {/* Bottom-right diagonal corner handle with visual grip */}
      <div
        onMouseDown={(e) => handleResizeStart(e, "se")}
        onDoubleClick={handleResetSize}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 text-sky-400 hover:text-sky-200 z-30 group/grip"
        title={uiText("components_utility_modal.div.drag_to_resize_width_and_height_double_click.title", "Drag to resize width and height (Double-click to reset size)")}
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
    return createPortal(<>{panelElement}{showNamedStates && <NamedWorkspaceDialog capture={captureNamedState} restore={async (state) => { await restoreNamedState(state); setRestoreFeedback("Named workspace recalled."); }} onClose={() => setShowNamedStates(false)} onExit={onClose} />}</>, document.body);
  }
  return panelElement;
}
