import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  MessageSquare,
  Clapperboard,
  Tag,
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
  Image as ImageIcon,
  Shapes,
  ZoomIn,
  Layers,
  Box,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpAZ,
  Film,
  LayoutGrid,
  ArrowDownUp,
  Type,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { cn } from "../utils/cn";
import { CustomizableButton } from "./CustomizableButton";
import { CustomizableLabel } from "./CustomizableLabel";
import { useButtonCustomization } from "../context/ButtonCustomizationContext";
import { uiText } from "../hooks/useUIConfig";
import { remoteStore } from "../services/remoteKeyValueStore";

export type CreativeStudioCategory = "creative";

export interface CreativeStudioCategoryConfig {
  id: "all" | CreativeStudioCategory;
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

export const CREATIVE_STUDIO_CATEGORIES: CreativeStudioCategoryConfig[] = [
  {
    id: "all",
    buttonId: "creative_studio_tab_all",
    name: "All tools",
    shortLabel: "All",
    icon: Layers,
    color: "#06b6d4",
    activeBg: "bg-cyan-500",
    activeText: "text-slate-950 font-bold",
    activeBorder: "border-cyan-400",
    glow: "rgba(6,182,212,0.45)",
    badgeBg: "bg-cyan-500/15",
    badgeText: "text-cyan-300",
    badgeBorder: "border-cyan-500/30",
    description: "All creative studios & visual composition engines",
  },
];


export interface CreativeStudioFolderConfig {
  id: string;
  name: string;
  color: string;
  appIds: string[];
}

export interface CreativeStudioAppItem {
  id: string;
  buttonId: string;
  name: string;
  subtitle: string;
  category: CreativeStudioCategory;
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
  { name: "Cyan", color: "#06b6d4" },
  { name: "Purple", color: "#a855f7" },
  { name: "Emerald", color: "#10b981" },
  { name: "Amber", color: "#f59e0b" },
  { name: "Rose", color: "#f43f5e" },
  { name: "Blue", color: "#3b82f6" },
  { name: "Indigo", color: "#6366f1" },
  { name: "Teal", color: "#14b8a6" },
  { name: "Orange", color: "#f97316" },
  { name: "Pink", color: "#ec4899" },
  { name: "Lime", color: "#84cc16" },
];

const DEFAULT_FOLDERS: CreativeStudioFolderConfig[] = [
  {
    id: "folder_creative",
    name: "Creative",
    color: "#a855f7",
    appIds: ["aniplayer", "bubba1", "neo1", "shape_studio", "zoom_studio"],
  },
  {
    id: "folder_playground",
    name: "Playground",
    color: "#06b6d4",
    appIds: ["img_desc", "screenplay", "tracestudio", "txt_studio", "variations_studio"],
  },
];

export type CreativeStudioSortMode = "name_asc" | "name_desc" | "original";

export const CREATIVE_STUDIO_DEFAULT_STATE_KEY = "seqcarver_creative_studio_default_state_v1";

export interface CreativeStudioDefaultState {
  folders: CreativeStudioFolderConfig[];
  activeCategory: "all" | CreativeStudioCategory;
  activeFolderTab: string;
  showTags: boolean;
  isManagingFolders: boolean;
  sortMode?: CreativeStudioSortMode;
  size: { width: number; height: number };
  position?: { x: number; y: number };
  lastSavedAt?: string;
}

export const HARDCODED_DEFAULT_CREATIVE_STUDIO_STATE: CreativeStudioDefaultState = {
  folders: DEFAULT_FOLDERS,
  activeCategory: "all",
  activeFolderTab: "folder_creative",
  showTags: true,
  isManagingFolders: false,
  sortMode: "name_asc",
  size: { width: 500, height: 420 },
  position: { x: 255, y: 45 },
};

export interface CreativeStudioMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenImgDesc: () => void;
  onOpenNeo1: () => void;
  onOpenBubba1: () => void;
  onOpenShapeStudio: () => void;
  onOpenScreenplay: () => void;
  onOpenVariationsStudio?: () => void;
  onOpenZoomStudio?: () => void;
  onOpenTraceStudio?: () => void;
  onOpenParallaxStudio?: () => void;
  onOpenAniPlayer?: () => void;
  onOpenSpreadStudio?: () => void;
  onOpenAssetSorter?: () => void;
  onOpenTxtStudio?: () => void;
  onOpenRenameStudio?: () => void;
}

const DEFAULT_WIDTH = 500;
const DEFAULT_HEIGHT = 420;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 280;

export function CreativeStudioMenu({
  isOpen,
  onClose,
  onOpenImgDesc,
  onOpenNeo1,
  onOpenBubba1,
  onOpenShapeStudio,
  onOpenScreenplay,
  onOpenVariationsStudio,
  onOpenZoomStudio,
  onOpenTraceStudio,
  onOpenParallaxStudio,
  onOpenAniPlayer,
  onOpenSpreadStudio,
  onOpenAssetSorter,
  onOpenTxtStudio,
  onOpenRenameStudio,
}: CreativeStudioMenuProps) {
  const {
    getButtonLabel,
    saveCurrentAsDefault,
    restoreAllFromSavedSetup,
  } = useButtonCustomization();
  const [restoreFeedback, setRestoreFeedback] = useState<string | null>(null);

  // Helper for initial default position
  const getInitialPosition = () => {
    return { x: 255, y: 45 };
  };

  // Window Size State (persisted in localStorage)
  const [size, setSize] = useState<{ width: number; height: number }>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_creative_studio_size_v1");
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
      const stored = remoteStore.getItem("seqcarver_creative_studio_pos_v1");
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

  // Lifecycle Guarantee: Ensure default layout, spacing and size when called
  useEffect(() => {
    if (isOpen) {
      const stored = remoteStore.getItem("seqcarver_creative_studio_size_v1");
      if (!stored || stored.includes("470") || stored.includes("450") || stored.includes("750") || stored.includes("440")) {
        setSize({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
        try {
          remoteStore.setItem("seqcarver_creative_studio_size_v1", JSON.stringify({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }));
        } catch {}
      }
      const storedPos = remoteStore.getItem("seqcarver_creative_studio_pos_v1");
      if (!storedPos || storedPos.includes("800") || storedPos.includes("56")) {
        setPosition({ x: 255, y: 45 });
        try {
          remoteStore.setItem("seqcarver_creative_studio_pos_v1", JSON.stringify({ x: 255, y: 45 }));
        } catch {}
      } else {
        setPosition((prev) => {
          const maxX = Math.max(16, (window.innerWidth || 1200) - DEFAULT_WIDTH - 16);
          const maxY = Math.max(16, (window.innerHeight || 800) - DEFAULT_HEIGHT - 16);
          if (prev.x > maxX || prev.x <= 0 || prev.y > maxY) {
            return {
              x: Math.min(255, maxX),
              y: Math.min(45, maxY),
            };
          }
          return prev;
        });
      }
      setIsManagingFolders(false);
      const storedTab = remoteStore.getItem("seqcarver_creative_studio_active_tab_v1");
      if (!storedTab || storedTab === "all") {
        setActiveFolderTab("folder_creative");
        setSortMode("name_asc");
      }
      // Ensure creative and playground folders reliably reflect their exact 5 tools
      setFolders((prev) => {
        const targetCreative = ["aniplayer", "bubba1", "neo1", "shape_studio", "zoom_studio"];
        const targetPlayground = ["img_desc", "screenplay", "tracestudio", "txt_studio", "variations_studio"];
        let needsUpdate = false;
        const updated = prev.map((f) => {
          if (f.id === "folder_creative") {
            const hasSame = f.appIds.length === targetCreative.length && targetCreative.every((id) => f.appIds.includes(id));
            if (!hasSame) {
              needsUpdate = true;
              return { ...f, name: "Creative", appIds: targetCreative };
            }
          } else if (f.id === "folder_playground") {
            const hasSame = f.appIds.length === targetPlayground.length && targetPlayground.every((id) => f.appIds.includes(id));
            if (!hasSame) {
              needsUpdate = true;
              return { ...f, name: "Playground", appIds: targetPlayground };
            }
          }
          return f;
        });
        if (needsUpdate) {
          try {
            remoteStore.setItem("seqcarver_creative_studio_folders_v1", JSON.stringify(updated));
          } catch {}
          return updated;
        }
        return prev;
      });
    }
  }, [isOpen]);

  // Tag visibility state (persisted in localStorage)
  const [showTags, setShowTags] = useState<boolean>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_creative_studio_show_tags_v1");
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  // Folder state - reliably loads user custom folders or default folders
  const [folders, setFolders] = useState<CreativeStudioFolderConfig[]>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_creative_studio_folders_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const targetCreative = ["aniplayer", "bubba1", "neo1", "shape_studio", "zoom_studio"];
          const targetPlayground = ["img_desc", "screenplay", "tracestudio", "txt_studio", "variations_studio"];
          const cleaned = parsed
            .filter((f: CreativeStudioFolderConfig) => f.id !== "folder_advanced")
            .map((f: CreativeStudioFolderConfig) => {
              if (f.id === "folder_creative") {
                return { ...f, name: "Creative", appIds: targetCreative };
              }
              if (f.id === "folder_playground") {
                return { ...f, name: "Playground", appIds: targetPlayground };
              }
              return f;
            });
          if (!cleaned.some((f) => f.id === "folder_creative")) {
            cleaned.unshift(DEFAULT_FOLDERS[0]);
          }
          if (!cleaned.some((f) => f.id === "folder_playground")) {
            cleaned.push(DEFAULT_FOLDERS[1]);
          }
          return cleaned;
        }
      }
      return DEFAULT_FOLDERS;
    } catch {
      return DEFAULT_FOLDERS;
    }
  });

  const [activeFolderTab, setActiveFolderTab] = useState<string>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_creative_studio_active_tab_v1") || "folder_creative";
      return stored === "folder_advanced" || stored === "all" ? "folder_creative" : stored;
    } catch {
      return "folder_creative";
    }
  });

  // Category filter tabs state ('all', 'creative')
  const [activeCategory, setActiveCategory] = useState<"all" | CreativeStudioCategory>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_creative_studio_category_v1");
      if (stored === "all") {
        return "all";
      }
    } catch {}
    return "all";
  });

  // Sort mode state: default is 'a to z, name' ("name_asc")
  const [sortMode, setSortMode] = useState<CreativeStudioSortMode>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_creative_studio_sort_mode_v1");
      if (stored === "name_asc" || stored === "name_desc" || stored === "original") {
        return stored as CreativeStudioSortMode;
      }
    } catch {}
    return "name_asc";
  });

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_creative_studio_sort_mode_v1", sortMode);
    } catch (e) {
      console.warn("Failed to persist sort mode", e);
    }
  }, [sortMode]);

  // Fast inline search query for presets and studios
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_creative_studio_category_v1", activeCategory);
    } catch (e) {
      console.warn("Failed to persist active category", e);
    }
  }, [activeCategory]);

  const [isManagingFolders, setIsManagingFolders] = useState<boolean>(() => {
    try {
      return remoteStore.getItem("seqcarver_creative_studio_show_folders_v1") === "true";
    } catch {
      return false;
    }
  });

  // New folder creation state
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [newFolderColor, setNewFolderColor] = useState<string>(FOLDER_COLOR_PRESETS[0].color);

  // Quick inline add folder directly in filter header (where 'all' is located)
  const [isQuickAddingFolder, setIsQuickAddingFolder] = useState<boolean>(false);
  const [quickFolderName, setQuickFolderName] = useState<string>("");
  const filterHeaderRef = useRef<HTMLDivElement | null>(null);

  // Editing / Palette states
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [colorPickerFolderId, setColorPickerFolderId] = useState<string | null>(null);

  // Save showTags to localStorage
  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_creative_studio_show_tags_v1", String(showTags));
    } catch (e) {
      console.warn("Failed to persist tag visibility", e);
    }
  }, [showTags]);

  // Save folders to localStorage persistently
  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_creative_studio_folders_v1", JSON.stringify(folders));
    } catch (e) {
      console.warn("Failed to persist creative studio folders", e);
    }
  }, [folders]);

  // Save active folder tab preference
  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_creative_studio_active_tab_v1", activeFolderTab);
    } catch (e) {
      console.warn("Failed to persist active folder tab", e);
    }
  }, [activeFolderTab]);

  // Save folder management panel visibility preference
  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_creative_studio_show_folders_v1", String(isManagingFolders));
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

  // Ensure default setup for Creative Studio is permanently established and persistent across sessions & resets
  useEffect(() => {
    try {
      const existingDefault = remoteStore.getItem(CREATIVE_STUDIO_DEFAULT_STATE_KEY);
      if (!existingDefault) {
        const defaultState: CreativeStudioDefaultState = {
          folders: DEFAULT_FOLDERS,
          activeCategory: "all",
          activeFolderTab: "all",
          showTags: true,
          isManagingFolders: false,
          size: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
          lastSavedAt: new Date().toISOString(),
        };
        remoteStore.setItem(CREATIVE_STUDIO_DEFAULT_STATE_KEY, JSON.stringify(defaultState));
        remoteStore.setItem("seqcarver_creative_studio_folders_default_v1", JSON.stringify(DEFAULT_FOLDERS));
        remoteStore.setItem("seqcarver_creative_studio_size_default_v1", JSON.stringify({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }));
        remoteStore.setItem("seqcarver_creative_studio_category_default_v1", "all");
        remoteStore.setItem("seqcarver_creative_studio_active_tab_default_v1", "all");
        remoteStore.setItem("seqcarver_creative_studio_show_tags_default_v1", "true");
        remoteStore.setItem("seqcarver_creative_studio_show_folders_default_v1", "false");
      }
    } catch (e) {
      console.warn("Failed to initialize persistent creative studio default state", e);
    }
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
        remoteStore.setItem("seqcarver_creative_studio_pos_v1", JSON.stringify(latestPosRef.current));
      } catch (e) {
        console.warn("Failed to persist creative studio position", e);
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
        remoteStore.setItem("seqcarver_creative_studio_size_v1", JSON.stringify(latestSizeRef.current));
      } catch (e) {
        console.warn("Failed to persist creative studio size", e);
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
      remoteStore.setItem("seqcarver_creative_studio_size_v1", JSON.stringify(defaultSz));
      remoteStore.setItem("seqcarver_creative_studio_pos_v1", JSON.stringify(defaultPos));
    } catch {}
  };

  // The "Default" button saves ALL changes as permanent default!
  const handleSaveAllAsDefault = () => {
    try {
      // 1. Save folders, active tab, panel state, position, size, showTags and activeCategory
      const defaultState: CreativeStudioDefaultState = {
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
      remoteStore.setItem(CREATIVE_STUDIO_DEFAULT_STATE_KEY, JSON.stringify(defaultState));
      remoteStore.setItem("seqcarver_creative_studio_folders_v1", JSON.stringify(folders));
      remoteStore.setItem("seqcarver_creative_studio_folders_default_v1", JSON.stringify(folders));
      remoteStore.setItem("seqcarver_creative_studio_size_v1", JSON.stringify(size));
      remoteStore.setItem("seqcarver_creative_studio_size_default_v1", JSON.stringify(size));
      remoteStore.setItem("seqcarver_creative_studio_pos_v1", JSON.stringify(position));
      remoteStore.setItem("seqcarver_creative_studio_pos_default_v1", JSON.stringify(position));
      remoteStore.setItem("seqcarver_creative_studio_active_tab_v1", activeFolderTab);
      remoteStore.setItem("seqcarver_creative_studio_active_tab_default_v1", activeFolderTab);
      remoteStore.setItem("seqcarver_creative_studio_category_v1", activeCategory);
      remoteStore.setItem("seqcarver_creative_studio_category_default_v1", activeCategory);
      remoteStore.setItem("seqcarver_creative_studio_show_folders_v1", String(isManagingFolders));
      remoteStore.setItem("seqcarver_creative_studio_show_folders_default_v1", String(isManagingFolders));
      remoteStore.setItem("seqcarver_creative_studio_show_tags_v1", String(showTags));
      remoteStore.setItem("seqcarver_creative_studio_show_tags_default_v1", String(showTags));
      remoteStore.setItem("seqcarver_creative_studio_sort_mode_v1", sortMode);
      remoteStore.setItem("seqcarver_creative_studio_sort_mode_default_v1", sortMode);

      // 2. Also save button customizer customizations, labels, icons, order, and zero-text modes!
      saveCurrentAsDefault();

      setSaveDefaultSuccess(true);
      setTimeout(() => setSaveDefaultSuccess(false), 4000);
    } catch (e) {
      console.error("Failed to save changes as default", e);
    }
  };

  // Restore all button labels, icons and layout from saved setup
  const handleRestoreSetup = () => {
    try {
      // 1. Restore folders, size, position, activeTab, showTags from creative studio default state
      let savedFolders = DEFAULT_FOLDERS;
      let savedSize = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
      let savedPos: { x: number; y: number } | undefined;
      let savedTags = true;
      let savedCategory: "all" | CreativeStudioCategory = "all";
      let savedActiveTab = "all";
      let savedSortMode: CreativeStudioSortMode = "name_asc";

      try {
        const storedUnified = remoteStore.getItem(CREATIVE_STUDIO_DEFAULT_STATE_KEY);
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
          const savedFoldersRaw = remoteStore.getItem("seqcarver_creative_studio_folders_default_v1");
          if (savedFoldersRaw) {
            const parsed = JSON.parse(savedFoldersRaw);
            if (Array.isArray(parsed) && parsed.length > 0) savedFolders = parsed;
          }
          const savedSizeRaw = remoteStore.getItem("seqcarver_creative_studio_size_default_v1");
          if (savedSizeRaw) {
            const parsed = JSON.parse(savedSizeRaw);
            if (typeof parsed.width === "number" && typeof parsed.height === "number") savedSize = parsed;
          }
          const savedPosRaw = remoteStore.getItem("seqcarver_creative_studio_pos_default_v1");
          if (savedPosRaw) {
            const parsed = JSON.parse(savedPosRaw);
            if (typeof parsed.x === "number" && typeof parsed.y === "number") savedPos = parsed;
          }
          const savedTagsRaw = remoteStore.getItem("seqcarver_creative_studio_show_tags_default_v1");
          if (savedTagsRaw !== null) savedTags = savedTagsRaw === "true";
          const savedCatRaw = remoteStore.getItem("seqcarver_creative_studio_category_default_v1");
          if (savedCatRaw && ["all", "creative"].includes(savedCatRaw)) {
            savedCategory = savedCatRaw as any;
          }
          const savedSortRaw = remoteStore.getItem("seqcarver_creative_studio_sort_mode_default_v1");
          if (savedSortRaw && ["name_asc", "name_desc", "original"].includes(savedSortRaw)) {
            savedSortMode = savedSortRaw as CreativeStudioSortMode;
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

      // 2. Restore button customizer configuration
      const res = restoreAllFromSavedSetup();
      setRestoreFeedback(res.message);
      setTimeout(() => setRestoreFeedback(null), 3500);
    } catch (e: any) {
      console.error("Failed to restore saved setup", e);
      setRestoreFeedback(`Restore failed: ${e?.message || "Error"}`);
      setTimeout(() => setRestoreFeedback(null), 3500);
    }
  };

  // Rich color-coded item catalog (13 apps)
  const appItems: CreativeStudioAppItem[] = useMemo(
    () => [
    {
      id: "img_desc",
      buttonId: "creative_studio_img_desc",
      name: "A1 Image Tools",
      subtitle: "Ai image prompt & desc",
      category: "creative",
      categoryLabel: "Creative",
      badge: "Playground",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
      color: "#06b6d4",
      icon: <ImageIcon className="w-3.5 h-3.5 text-cyan-400" style={{ color: "#06b6d4" }} />,
      iconBg: "bg-cyan-500/15",
      iconBorder: "border-cyan-500/40",
      iconColor: "text-cyan-400",
      hoverBorder: "hover:border-cyan-500/60",
      hoverBg: "hover:bg-cyan-950/25",
      action: () => {
        onClose();
        onOpenImgDesc();
      },
    },
    {
      id: "neo1",
      buttonId: "creative_studio_neo1",
      name: "Neo Studio",
      subtitle: "Graphics, curves & layers",
      category: "creative",
      categoryLabel: "Creative",
      badge: "Vector",
      badgeColor: "bg-teal-500/20 text-teal-300 border border-teal-500/30",
      color: "#14b8a6",
      icon: <Sparkles className="w-3.5 h-3.5 text-teal-400" style={{ color: "#14b8a6" }} />,
      iconBg: "bg-teal-500/15",
      iconBorder: "border-teal-500/40",
      iconColor: "text-teal-400",
      hoverBorder: "hover:border-teal-500/60",
      hoverBg: "hover:bg-teal-950/25",
      action: () => {
        onClose();
        onOpenNeo1();
      },
    },
    {
      id: "bubba1",
      buttonId: "creative_studio_bubba1",
      name: "Bubble Studio",
      subtitle: "Speech & thought bubbles",
      category: "creative",
      categoryLabel: "Creative",
      badge: "Dialogue",
      badgeColor: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
      color: "#a855f7",
      icon: <MessageSquare className="w-3.5 h-3.5 text-purple-400" style={{ color: "#a855f7" }} />,
      iconBg: "bg-purple-500/15",
      iconBorder: "border-purple-500/40",
      iconColor: "text-purple-400",
      hoverBorder: "hover:border-purple-500/60",
      hoverBg: "hover:bg-purple-950/25",
      action: () => {
        onClose();
        onOpenBubba1();
      },
    },
    {
      id: "shape_studio",
      buttonId: "creative_studio_shape_studio",
      name: "Shape Editor Studio",
      subtitle: "Shapes, freehand & icons",
      category: "creative",
      categoryLabel: "Creative",
      badge: "Canvas",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
      color: "#6366f1",
      icon: <Shapes className="w-3.5 h-3.5 text-indigo-400" style={{ color: "#6366f1" }} />,
      iconBg: "bg-indigo-500/15",
      iconBorder: "border-indigo-500/40",
      iconColor: "text-indigo-400",
      hoverBorder: "hover:border-indigo-500/60",
      hoverBg: "hover:bg-indigo-950/25",
      action: () => {
        onClose();
        onOpenShapeStudio();
      },
    },
    {
      id: "screenplay",
      buttonId: "creative_studio_screenplay",
      name: "A1 Script Writer",
      subtitle: "Screenplay writer & scripts",
      category: "creative",
      categoryLabel: "Creative",
      badge: "Playground",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
      color: "#3b82f6",
      icon: <Clapperboard className="w-3.5 h-3.5 text-blue-400" style={{ color: "#3b82f6" }} />,
      iconBg: "bg-blue-500/15",
      iconBorder: "border-blue-500/40",
      iconColor: "text-blue-400",
      hoverBorder: "hover:border-blue-500/60",
      hoverBg: "hover:bg-blue-950/25",
      action: () => {
        onClose();
        onOpenScreenplay();
      },
    },
    {
      id: "variations_studio",
      buttonId: "creative_studio_variations_studio",
      name: "Variations Studio",
      subtitle: "Motion fx, zoom, color & 11 procedural effects",
      category: "creative",
      categoryLabel: "Creative",
      badge: "Playground",
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
        if (onOpenVariationsStudio) onOpenVariationsStudio();
      },
    },
    {
      id: "zoom_studio",
      buttonId: "creative_studio_zoom_studio",
      name: "Zoom Studio",
      subtitle: "Multi-frame zoom sequences and optical effects",
      category: "creative",
      categoryLabel: "Creative",
      badge: "Zoom fx",
      badgeColor: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
      color: "#3b82f6",
      icon: <ZoomIn className="w-3.5 h-3.5 text-blue-400" style={{ color: "#3b82f6" }} />,
      iconBg: "bg-blue-500/15",
      iconBorder: "border-blue-500/40",
      iconColor: "text-blue-400",
      hoverBorder: "hover:border-blue-500/60",
      hoverBg: "hover:bg-blue-950/25",
      action: () => {
        onClose();
        if (onOpenZoomStudio) onOpenZoomStudio();
      },
    },
    {
      id: "tracestudio",
      buttonId: "creative_studio_tracestudio",
      name: "Raster-to-vector",
      subtitle: "Raster-to-vector auto trace & dominant palette extractor",
      category: "creative",
      categoryLabel: "Creative",
      badge: "Playground",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
      color: "#a855f7",
      icon: <Palette className="w-3.5 h-3.5 text-purple-400" style={{ color: "#a855f7" }} />,
      iconBg: "bg-purple-500/15",
      iconBorder: "border-purple-500/40",
      iconColor: "text-purple-400",
      hoverBorder: "hover:border-purple-500/60",
      hoverBg: "hover:bg-purple-950/25",
      action: () => {
        onClose();
        if (onOpenTraceStudio) onOpenTraceStudio();
      },
    },
    {
      id: "aniplayer",
      buttonId: "creative_studio_aniplayer",
      name: "AniPlayer Studio",
      subtitle: "Timeline, frame sequencer & video export",
      category: "creative",
      categoryLabel: "Creative",
      badge: "Animation",
      badgeColor: "bg-red-500/20 text-red-300 border border-red-500/30",
      color: "#ef4444",
      icon: <Film className="w-3.5 h-3.5 text-red-400" style={{ color: "#ef4444" }} />,
      iconBg: "bg-red-500/15",
      iconBorder: "border-red-500/40",
      iconColor: "text-red-400",
      hoverBorder: "hover:border-red-500/60",
      hoverBg: "hover:bg-red-950/25",
      action: () => {
        onClose();
        if (onOpenAniPlayer) onOpenAniPlayer();
      },
    },
    {
      id: "txt_studio",
      buttonId: "creative_studio_txt_studio",
      name: "Typography Studio",
      subtitle: "Typography, arc/wave text warping & 3d extrusion",
      category: "creative",
      categoryLabel: "Creative",
      badge: "Playground",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
      color: "#00f0ff",
      icon: <Type className="w-3.5 h-3.5 text-cyan-400" style={{ color: "#00f0ff" }} />,
      iconBg: "bg-cyan-500/15",
      iconBorder: "border-cyan-500/40",
      iconColor: "text-cyan-400",
      hoverBorder: "hover:border-cyan-500/60",
      hoverBg: "hover:bg-cyan-950/25",
      action: () => {
        onClose();
        if (onOpenTxtStudio) onOpenTxtStudio();
      },
    },
  ], [
    onClose,
    onOpenImgDesc,
    onOpenNeo1,
    onOpenBubba1,
    onOpenShapeStudio,
    onOpenScreenplay,
    onOpenVariationsStudio,
    onOpenZoomStudio,
    onOpenTraceStudio,
    onOpenParallaxStudio,
    onOpenAniPlayer,
    onOpenSpreadStudio,
    onOpenAssetSorter,
    onOpenTxtStudio,
    onOpenRenameStudio,
  ]);

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
        remoteStore.setItem("seqcarver_creative_studio_folders_v1", JSON.stringify(updated));
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

    const newFolder: CreativeStudioFolderConfig = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: finalName,
      color: finalColor,
      appIds: [],
    };

    setFolders((prev) => {
      const next = [...prev, newFolder];
      try {
        remoteStore.setItem("seqcarver_creative_studio_folders_v1", JSON.stringify(next));
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

    // Automatically scroll the filter header to bring the newly produced folder icon into view
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
        remoteStore.setItem("seqcarver_creative_studio_folders_v1", JSON.stringify(next));
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
        remoteStore.setItem("seqcarver_creative_studio_folders_v1", JSON.stringify(updated));
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
        remoteStore.setItem("seqcarver_creative_studio_folders_v1", JSON.stringify(updated));
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
        remoteStore.setItem("seqcarver_creative_studio_folders_v1", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to persist folder color", e);
      }
      return updated;
    });
    setColorPickerFolderId(null);
  };

  // Helper to reset folders back to persistent default setup
  const handleResetFoldersToDefault = () => {
    let defaultF = DEFAULT_FOLDERS;
    try {
      const savedFolders = remoteStore.getItem("seqcarver_creative_studio_folders_default_v1");
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
      remoteStore.setItem("seqcarver_creative_studio_folders_v1", JSON.stringify(defaultF));
    } catch (e) {
      console.warn("Failed to persist default folders", e);
    }
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: appItems.length,
      creative: 0,
    };
    appItems.forEach((app) => {
      if (counts[app.category] !== undefined) {
        counts[app.category]++;
      }
    });
    return counts;
  }, [appItems]);

  // Filter and sort apps by active category, active folder, search query, and sortMode (memoized)
  const filteredApps = useMemo(() => {
    const list = appItems.filter((app) => {
      // Category filter
      if (activeCategory !== "all" && app.category !== activeCategory) {
        return false;
      }
      // Folder filter
      if (activeFolderTab !== "all") {
        const folder = folders.find((f) => f.id === activeFolderTab);
        if (folder && !folder.appIds.includes(app.id)) {
          return false;
        }
      }
      // Search query filter
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

    // Sort items
    if (sortMode === "name_asc") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    } else if (sortMode === "name_desc") {
      return [...list].sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: "base" }));
    }
    return list;
  }, [activeCategory, activeFolderTab, appItems, folders, searchQuery, sortMode]);

  const panelElement = (
    <div
      id="creative_studio_panel"
      data-creative-studio="true"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
      className={cn(
        "fixed bg-[#0a0f1d]/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] p-3 z-[9998] text-slate-100 select-none flex flex-col overflow-hidden will-change-transform",
        isDragging && "ring-2 ring-cyan-400 shadow-cyan-500/25 opacity-95",
        isResizing && "ring-2 ring-purple-400/90"
      )}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDragStart={(e) => e.stopPropagation()}
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleDragStart}
        className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800/80 cursor-grab active:cursor-grabbing group/header shrink-0"
        title={uiText("components_creative_studio_menu.div.click_and_drag_to_move_creative_studio.title", "Click and drag to move Creative Studio")}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="text-slate-500 group-hover/header:text-cyan-400 transition-colors shrink-0">
            <GripHorizontal className="w-3.5 h-3.5" />
          </div>
          <CustomizableLabel
            as="h3"
            labelId="creative_studio_header_title"
            defaultLabel="Creative Studio"
            showLabelAlways={true}
            defaultIcon={<Palette className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
            className="font-bold text-xs text-slate-100 tracking-normal truncate leading-tight pl-1"
          />
          {/* Live X, Y Screen Position Indicator */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/80 border border-cyan-500/30 text-[9px] font-mono text-cyan-300 font-bold shrink-0 ml-1 shadow-sm select-none"
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
            buttonId="creative_studio_toggle_tags"
            defaultLabel={showTags ? "Tags" : "Tags off"}
            defaultIcon={
              <Tag
                className={cn(
                  "w-3 h-3 transition-colors",
                  showTags ? "text-cyan-400" : "text-slate-500 line-through opacity-70"
                )}
              />
            }
            onClick={() => setShowTags(!showTags)}
            className={cn(
              "flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md cursor-pointer transition-all shadow-sm border",
              showTags
                ? "text-cyan-300 hover:text-cyan-100 bg-cyan-500/15 hover:bg-cyan-500/30 border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-slate-800 border-slate-700/60"
            )}
            title={showTags ? "Click to hide all tag badges" : "Click to show all tag badges"}
          />

          {/* DEFAULT BUTTON: Saves all changes as permanent default! */}
          <CustomizableButton
            buttonId="creative_studio_save_default"
            defaultLabel="Default"
            defaultIcon={<ShieldCheck className="w-3 h-3 text-amber-400" />}
            onClick={handleSaveAllAsDefault}
            className="flex items-center gap-1 text-[9.5px] font-bold text-amber-300 hover:text-amber-100 bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 px-1.5 py-0.5 rounded-md cursor-pointer transition-all shadow-sm"
            title="Save all Creative Studio settings, folders, size, position, tags visibility, and button customizations as permanent default"
          />

          {/* RESTORE BUTTON: Restores all button setups across the application */}
          <CustomizableButton
            buttonId="creative_studio_restore_setup"
            defaultLabel="Restore"
            defaultIcon={<RotateCcw className="w-3 h-3 text-cyan-400" />}
            onClick={handleRestoreSetup}
            className="flex items-center gap-1 text-[9.5px] font-bold text-cyan-300 hover:text-cyan-100 bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/40 px-1.5 py-0.5 rounded-md cursor-pointer transition-all shadow-sm"
            title="Restore all button labels, icons, zero-text and layout settings from your saved setup across the entire application"
          />

          {/* Close Button */}
          <CustomizableButton
            buttonId="creative_studio_menu_btn_29"
            defaultIcon={<X className="w-3 h-3" />}
            type="button"
onClick={onClose}
className="p-1 text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-md cursor-pointer transition-colors"
title={uiText("components_creative_studio_menu.button.close.title", "Close")}
          />
        </div>
      </div>

      {/* Restore Feedback Notification Banner */}
      {restoreFeedback && (
        <div className="mb-2 px-2 py-1 bg-cyan-950/90 border border-cyan-500/50 rounded-lg flex items-center justify-between gap-1.5 text-[10px] text-cyan-200 animate-in fade-in slide-in-from-top-1 duration-150 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate font-semibold">{restoreFeedback}</span>
          </div>
          <CustomizableButton
            buttonId="creative_studio_menu_btn_28"
            defaultIcon={<X className="w-3 h-3" />}
            type="button"
onClick={() => setRestoreFeedback(null)}
className="text-cyan-400 hover:text-white p-0.5"
          />
        </div>
      )}

      {/* Save as Default Success Notification Banner */}
      {saveDefaultSuccess && (
        <div className="mb-2 px-2 py-1 bg-emerald-950/90 border border-emerald-500/50 rounded-lg flex items-center justify-between gap-1.5 text-[10px] text-emerald-200 animate-in fade-in slide-in-from-top-1 duration-150 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate font-semibold">
              {uiText("components_creative_studio_menu.span.all_creative_studio_settings_folders_and_but", "All Creative Studio settings, folders & button customizations saved as default!")}
            </span>
          </div>
          <CustomizableButton
            buttonId="creative_studio_menu_btn_27"
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
            {/* Scroll Left Button (if overflow) */}
            <CustomizableButton
              buttonId="creative_studio_menu_btn_26"
              defaultIcon={<ChevronLeftIcon className="w-3 h-3" />}
              type="button"
onClick={() => {
                if (filterHeaderRef.current) {
                  filterHeaderRef.current.scrollBy({ left: -140, behavior: "smooth" });
                }
              }}
className="p-0.5 rounded text-slate-500 hover:text-cyan-300 hover:bg-slate-800/80 cursor-pointer shrink-0 mr-0.5 transition-colors"
title={uiText("components_creative_studio_menu.button.scroll_left.title", "Scroll left")}
            />

            <div
              ref={filterHeaderRef}
              className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-thin flex-1 min-w-0 scroll-smooth"
            >
              {CREATIVE_STUDIO_CATEGORIES.map((cat) => {
                const isSelected =
                  cat.id === "all"
                    ? activeCategory === "all" && activeFolderTab === "all"
                    : activeCategory === cat.id && activeFolderTab === "all";
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
                    ? "creative_studio_folder_creative"
                    : `creative_studio_folder_${folder.id}`;

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
                        // Toggle back to all if clicked again
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
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-cyan-500/60 shrink-0 animate-in fade-in duration-100">
                  <Folder className="w-3 h-3 text-cyan-400 shrink-0 ml-1" />
                  <input
                    type="text"
                    value={quickFolderName}
                    onChange={(e) => setQuickFolderName(e.target.value)}
                    placeholder={uiText("components_creative_studio_menu.input.folder_name.placeholder", "Folder name...")}
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
                    buttonId="creative_studio_menu_btn_25"
                    defaultIcon={<Check className="w-2.5 h-2.5" />}
                    type="button"
onClick={() => handleCreateFolder(quickFolderName)}
className="p-1 text-emerald-400 hover:text-emerald-200 cursor-pointer"
title={uiText("components_creative_studio_menu.button.add_folder.title", "Add folder")}
                  />
                  <CustomizableButton
                    buttonId="creative_studio_menu_btn_24"
                    defaultIcon={<X className="w-2.5 h-2.5" />}
                    type="button"
onClick={() => {
                      setIsQuickAddingFolder(false);
                      setQuickFolderName("");
                    }}
className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
title={uiText("components_creative_studio_menu.button.cancel.title", "Cancel")}
                  />
                </div>
              ) : (
                <CustomizableButton
                  buttonId="creative_studio_add_folder"
                  defaultLabel="+ Folder"
                  defaultIcon={<FolderPlus className="w-3 h-3 text-cyan-400 shrink-0" />}
                  onClick={() => setIsQuickAddingFolder(true)}
                  className="px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 border shrink-0 bg-slate-900/60 text-cyan-400 hover:text-cyan-200 border-cyan-500/30 hover:border-cyan-400/60 hover:bg-cyan-950/30"
                  title="Add a new folder (creates a new folder icon here in filter header)"
                />
              )}
            </div>

            {/* Scroll Right Button (if overflow) */}
            <CustomizableButton
              buttonId="creative_studio_menu_btn_23"
              defaultIcon={<ChevronRightIcon className="w-3 h-3" />}
              type="button"
onClick={() => {
                if (filterHeaderRef.current) {
                  filterHeaderRef.current.scrollBy({ left: 140, behavior: "smooth" });
                }
              }}
className="p-0.5 rounded text-slate-500 hover:text-cyan-300 hover:bg-slate-800/80 cursor-pointer shrink-0 ml-0.5 transition-colors"
title={uiText("components_creative_studio_menu.button.scroll_right.title", "Scroll right")}
            />
          </div>

          {/* Right Action Tools: Folders Tray toggle & Sort */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Sort Dropdown / Cycle Button */}
            <CustomizableButton
              buttonId="creative_studio_menu_btn_22"
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
                  ? "text-cyan-300 bg-cyan-500/20 border-cyan-500/40"
                  : sortMode === "name_desc"
                  ? "text-purple-300 bg-purple-500/20 border-purple-500/40"
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
                <ArrowDownAZ className="w-3 h-3 text-cyan-400 shrink-0" />
              ) : sortMode === "name_desc" ? (
                <ArrowUpAZ className="w-3 h-3 text-purple-400 shrink-0" />
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
              buttonId="creative_studio_folder_manage"
              defaultLabel="Folders"
              defaultIcon={<FolderOpen className="w-3 h-3 text-cyan-400" />}
              onClick={() => setIsManagingFolders(!isManagingFolders)}
              className={cn(
                "px-1.5 py-1 rounded-md text-[10px] cursor-pointer transition-colors shrink-0 border flex items-center gap-1 font-semibold",
                isManagingFolders || activeFolderTab !== "all"
                  ? "text-cyan-300 bg-cyan-500/20 border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-800"
              )}
              title={isManagingFolders ? "Hide Folders Tray" : "Manage / Filter by Custom Folders"}
            />
          </div>
        </div>

        {/* Active Category / Folder Description / Reset Banner */}
        {(activeCategory !== "all" || activeFolderTab !== "all") && (
          <div className="flex items-center justify-between px-2 py-0.5 rounded bg-slate-900/70 border border-slate-800/80 text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-300 truncate">
              {activeFolderTab !== "all" ? (
                <>
                  <Folder
                    className="w-2.5 h-2.5 shrink-0"
                    style={{
                      color: folders.find((f) => f.id === activeFolderTab)?.color || "#06b6d4",
                      fill: `${folders.find((f) => f.id === activeFolderTab)?.color || "#06b6d4"}33`,
                    }}
                  />
                  <span className="font-bold text-slate-200">
                    {uiText("components_creative_studio_menu.span.folder", "Folder: ")}{folders.find((f) => f.id === activeFolderTab)?.name || "Folder"}
                  </span>
                  <span className="text-slate-400 truncate">
                    ({folders.find((f) => f.id === activeFolderTab)?.appIds.filter((id) => appItems.some((a) => a.id === id)).length || 0}{uiText("components_creative_studio_menu.span.apps_assigned", " apps assigned)")}
                  </span>
                </>
              ) : (
                <>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        CREATIVE_STUDIO_CATEGORIES.find((c) => c.id === activeCategory)?.color || "#06b6d4",
                    }}
                  />
                  <span className="font-bold text-slate-200 capitalize">
                    {CREATIVE_STUDIO_CATEGORIES.find((c) => c.id === activeCategory)?.name}:
                  </span>
                  <span className="text-slate-400 truncate">
                    {CREATIVE_STUDIO_CATEGORIES.find((c) => c.id === activeCategory)?.description}
                  </span>
                </>
              )}
            </div>
            <CustomizableButton
              buttonId="creative_studio_menu_btn_21"
              type="button"
onClick={() => {
                setActiveCategory("all");
                setActiveFolderTab("all");
              }}
className="text-[9.5px] text-cyan-400 hover:text-cyan-200 font-bold ml-2 shrink-0 cursor-pointer"
            >
                {() => (
                    <>
                      {uiText("components_creative_studio_menu.button.show_all", "Show All")}
                    </>
                  )}
            </CustomizableButton>
          </div>
        )}
      </div>

      {/* Show/Hide Folder Management Tray */}
      {isManagingFolders && (
        <div className="mb-2 p-2 bg-slate-900/95 border border-cyan-500/30 rounded-lg space-y-2 text-xs shrink-0 animate-in fade-in duration-150 max-h-[220px] overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between text-[10px] font-bold text-cyan-300 pb-1 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>{uiText("components_creative_studio_menu.span.folder_management", "Folder Management (")}{folders.length})</span>
            </div>
            <div className="flex items-center gap-1">
              {/* + New Folder Toggle */}
              <CustomizableButton
                buttonId="creative_studio_menu_btn_17"
                defaultIcon={<FolderPlus className="w-2.5 h-2.5" />}
                type="button"
onClick={() => setIsCreatingFolder(!isCreatingFolder)}
className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded border cursor-pointer flex items-center gap-1 transition-colors font-bold",
                  isCreatingFolder
                    ? "bg-cyan-500 text-slate-950 border-cyan-400"
                    : "text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/40"
                )}
title={uiText("components_creative_studio_menu.button.add_a_new_custom_folder.title", "Add a new custom folder")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_creative_studio_menu.span.folder_3", "+ Folder")}</span>
                      </>
                    )}
              </CustomizableButton>

              {/* Reset to Factory Defaults */}
              <CustomizableButton
                buttonId="creative_studio_menu_btn_16"
                type="button"
onClick={handleResetFoldersToDefault}
className="text-[9px] text-amber-300 hover:text-amber-200 px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 cursor-pointer transition-colors"
title={uiText("components_creative_studio_menu.button.reset_folders_back_to_standard_default_visua.title", "Reset folders back to standard default (Visual, Scripts, Toolbox)")}
              >
                  {() => (
                      <>
                        {uiText("components_creative_studio_menu.button.reset", "Reset")}
                      </>
                    )}
              </CustomizableButton>

              {/* Hide Tray */}
              <CustomizableButton
                buttonId="creative_studio_menu_btn_15"
                type="button"
onClick={() => setIsManagingFolders(false)}
className="text-[9px] text-slate-400 hover:text-cyan-300 px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer"
title={uiText("components_creative_studio_menu.button.hide_folder_management_tray.title", "Hide folder management tray")}
              >
                  {() => (
                      <>
                        {uiText("components_creative_studio_menu.button.hide", "Hide")}
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>

          {/* New Folder Creation Bar */}
          {isCreatingFolder && (
            <div className="p-1.5 bg-slate-950/90 rounded-md border border-cyan-500/50 space-y-1.5 animate-in fade-in duration-100">
              <div className="flex items-center gap-1.5">
                <Folder
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: newFolderColor, fill: `${newFolderColor}30` }}
                />
                <input
                  type="text"
                  placeholder={uiText("components_creative_studio_menu.input.new_folder_name.placeholder", "New Folder Name...")}
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateFolder();
                    }
                  }}
                  autoFocus
                  className="bg-slate-900 text-slate-100 text-[10px] px-2 py-1 rounded border border-cyan-500/60 focus:outline-none flex-1 min-w-0"
                />
                <CustomizableButton
                  buttonId="creative_studio_menu_btn_14"
                  defaultIcon={<Plus className="w-3 h-3" />}
                  type="button"
onClick={() => handleCreateFolder()}
className="px-2 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] rounded cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                >
                    {() => (
                        <>
                          <span>{uiText("components_creative_studio_menu.span.add", "Add")}</span>
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="creative_studio_menu_btn_13"
                  defaultIcon={<X className="w-3 h-3" />}
                  type="button"
onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName("");
                  }}
className="p-1 text-slate-400 hover:text-rose-300 cursor-pointer"
title={uiText("components_creative_studio_menu.button.cancel.title_2", "Cancel")}
                />
              </div>

              {/* Color swatch selection for new folder */}
              <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                <span className="text-[8px] text-slate-400 font-semibold pl-1">{uiText("components_creative_studio_menu.span.color", "Color:")}</span>
                {FOLDER_COLOR_PRESETS.map((preset) => (
                  <CustomizableButton
                    buttonId="creative_studio_menu_btn_12"
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
                {uiText("components_creative_studio_menu.div.no_custom_folders_click_folder_to_create_one", "No custom folders. Click \"+ Folder\" to create one.")}
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
                        {/* Colored Folder Icon */}
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
                            className="bg-slate-900 text-slate-100 text-[10px] px-1.5 py-0.5 rounded border border-cyan-500 focus:outline-none flex-1 min-w-0"
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
                          ({count}{uiText("components_creative_studio_menu.span.apps", " apps)")}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        {/* Move Up */}
                        <CustomizableButton
                          buttonId="creative_studio_menu_btn_11"
                          defaultIcon={<ArrowUp className="w-2.5 h-2.5" />}
                          type="button"
disabled={index === 0}
onClick={() => handleMoveFolder(folder.id, "up")}
className={cn(
                            "p-1 rounded cursor-pointer transition-colors",
                            index === 0
                              ? "text-slate-600 cursor-not-allowed"
                              : "text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
                          )}
title={uiText("components_creative_studio_menu.button.move_folder_up.title", "Move folder up")}
                        />

                        {/* Move Down */}
                        <CustomizableButton
                          buttonId="creative_studio_menu_btn_10"
                          defaultIcon={<ArrowDown className="w-2.5 h-2.5" />}
                          type="button"
disabled={index === folders.length - 1}
onClick={() => handleMoveFolder(folder.id, "down")}
className={cn(
                            "p-1 rounded cursor-pointer transition-colors",
                            index === folders.length - 1
                              ? "text-slate-600 cursor-not-allowed"
                              : "text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
                          )}
title={uiText("components_creative_studio_menu.button.move_folder_down.title", "Move folder down")}
                        />

                        {/* Pick Color */}
                        <CustomizableButton
                          buttonId="creative_studio_menu_btn_9"
                          defaultIcon={<Palette className="w-2.5 h-2.5 text-purple-400" />}
                          type="button"
onClick={() =>
                            setColorPickerFolderId(isColorPicking ? null : folder.id)
                          }
className="p-1 text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded cursor-pointer transition-colors"
title={uiText("components_creative_studio_menu.button.pick_color.title", "Pick color")}
                        />

                        {/* Rename / Save Name */}
                        {isEditing ? (
                          <CustomizableButton
                            buttonId="creative_studio_menu_btn_8"
                            defaultIcon={<Check className="w-2.5 h-2.5 text-emerald-400" />}
                            type="button"
onClick={() => handleRenameFolder(folder.id, editingName)}
className="p-1 text-emerald-400 hover:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 rounded cursor-pointer transition-colors"
title={uiText("components_creative_studio_menu.button.save_name.title", "Save name")}
                          />
                        ) : (
                          <CustomizableButton
                            buttonId="creative_studio_menu_btn_7"
                            defaultIcon={<Edit2 className="w-2.5 h-2.5 text-cyan-400" />}
                            type="button"
onClick={() => {
                              setEditingFolderId(folder.id);
                              setEditingName(folder.name);
                            }}
className="p-1 text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded cursor-pointer transition-colors"
title={uiText("components_creative_studio_menu.button.rename_folder.title", "Rename folder")}
                          />
                        )}

                        {/* Delete Folder */}
                        <CustomizableButton
                          buttonId="creative_studio_menu_btn_6"
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
                      <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded border border-cyan-500/40 animate-in fade-in duration-100">
                        <span className="text-[8px] text-cyan-400 font-semibold pl-1">
                          {uiText("components_creative_studio_menu.span.color_2", "Color:")}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {FOLDER_COLOR_PRESETS.map((preset) => (
                            <CustomizableButton
                              buttonId="creative_studio_menu_btn_5"
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

      {/* Studio Apps List - Richly Color-Coded with optional Tags display */}
      <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin">
        {filteredApps.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-[11px] space-y-2.5">
            {activeFolderTab !== "all" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-cyan-300 font-bold text-xs">
                  <Folder
                    className="w-4 h-4"
                    style={{
                      color: folders.find((f) => f.id === activeFolderTab)?.color || "#06b6d4",
                      fill: `${folders.find((f) => f.id === activeFolderTab)?.color || "#06b6d4"}33`,
                    }}
                  />
                  <span>
                    {uiText("components_creative_studio_menu.span.folder_4", "Folder \"")}{folders.find((f) => f.id === activeFolderTab)?.name}{uiText("components_creative_studio_menu.span.has_no_tools_assigned", "\" has no tools assigned")}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                  {uiText("components_creative_studio_menu.p.click_show_all_tools_below_then_select", "Click \"Show All Tools\" below, then select \"")}{folders.find((f) => f.id === activeFolderTab)?.name}{uiText("components_creative_studio_menu.p.in_the_folder_dropdown_next_to_any_tool_to_a", "\" in the folder dropdown next to any tool to add it here.")}
                </p>
                <div className="pt-1 flex items-center justify-center gap-2">
                  <CustomizableButton
                    buttonId="creative_studio_menu_btn_4"
                    type="button"
onClick={() => {
                      setActiveCategory("all");
                      setActiveFolderTab("all");
                    }}
className="px-3 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 font-bold text-[10.5px] cursor-pointer border border-cyan-500/40"
                  >
                      {() => (
                          <>
                            {uiText("components_creative_studio_menu.button.show_all_tools", "Show All Tools")}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="creative_studio_menu_btn_3"
                    type="button"
onClick={() => setIsManagingFolders(true)}
className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white font-semibold text-[10px] cursor-pointer border border-slate-700"
                  >
                      {() => (
                          <>
                            {uiText("components_creative_studio_menu.button.manage_folders", "Manage Folders")}
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>
            ) : (
              <>
                <div>
                  {searchQuery.trim()
                    ? `No presets match "${searchQuery}".`
                    : activeCategory !== "all"
                    ? `No presets found in category "${activeCategory}".`
                    : "No apps found in this filter."}
                </div>
                <div className="pt-1 flex items-center justify-center gap-2">
                  <CustomizableButton
                    buttonId="creative_studio_menu_btn_2"
                    type="button"
onClick={() => {
                      setActiveCategory("all");
                      setActiveFolderTab("all");
                      setSearchQuery("");
                    }}
className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 font-bold text-[10px] cursor-pointer border border-cyan-500/40"
                  >
                      {() => (
                          <>
                            {uiText("components_creative_studio_menu.button.reset_all_filters", "Reset All Filters")}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="creative_studio_menu_btn_1"
                    type="button"
onClick={() => setIsManagingFolders(true)}
className="text-slate-400 hover:text-slate-200 font-semibold text-[10px] cursor-pointer"
                  >
                      {() => (
                          <>
                            {uiText("components_creative_studio_menu.button.folders", "Folders")}
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </>
            )}
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
                  "group relative flex items-center justify-between rounded-xl bg-slate-900/60 hover:bg-[#071126] border border-slate-800/80 hover:border-cyan-500/50 transition-all p-1.5 shadow-sm",
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
                        "p-2 rounded-lg border shrink-0 transition-transform group-hover:scale-105 shadow-sm flex items-center justify-center",
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
                            className="font-bold text-xs text-slate-100 group-hover:text-white truncate transition-colors"
                            style={{
                              textShadow: `0 0 16px ${itemColor}40`,
                            }}
                          >
                            {label || displayLabel || app.name}
                          </span>
                          {/* CATEGORY BADGE PILL */}
                          <span
                            className={cn(
                              "text-[8px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 tracking-wide border",
                              "bg-purple-500/20 text-purple-300 border-purple-500/40"
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
                        <span className="text-[10px] text-slate-400 group-hover:text-slate-300 truncate mt-0.5">
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
                    className="text-[9px] bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer max-w-[86px] truncate font-medium hover:border-slate-700"
                    title={uiText("components_creative_studio_menu.select.assign_app_to_folder.title", "Assign app to folder")}
                  >
                    <option value="none">{uiText("components_creative_studio_menu.option.unfiled", "Unfiled")}</option>
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
        className="absolute top-0 right-0 w-2 h-full cursor-e-resize hover:bg-cyan-500/20 active:bg-cyan-500/40 transition-colors z-20"
        title={uiText("components_creative_studio_menu.div.drag_horizontally_to_resize_width.title", "Drag horizontally to resize width")}
      />
      {/* Bottom edge handle */}
      <div
        onMouseDown={(e) => handleResizeStart(e, "s")}
        className="absolute bottom-0 left-0 w-full h-2 cursor-s-resize hover:bg-cyan-500/20 active:bg-cyan-500/40 transition-colors z-20"
        title={uiText("components_creative_studio_menu.div.drag_vertically_to_resize_height.title", "Drag vertically to resize height")}
      />
      {/* Bottom-right diagonal corner handle with visual grip */}
      <div
        onMouseDown={(e) => handleResizeStart(e, "se")}
        onDoubleClick={handleResetSize}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 text-cyan-400 hover:text-cyan-200 z-30 group/grip"
        title={uiText("components_creative_studio_menu.div.drag_to_resize_width_and_height_double_click.title", "Drag to resize width and height (Double-click to reset size)")}
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
