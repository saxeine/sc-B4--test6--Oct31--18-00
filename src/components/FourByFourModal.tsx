// UTF-8: ✓ SeqCarver Studio - 4x4 Frontpage Advert Panel Launcher Modal (16-Screen Matrix Studio)
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  Grid,
  Grid3x3,
  ExternalLink,
  Play,
  Pause,
  Check,
  CheckCircle2,
  Sliders,
  Plus,
  RefreshCw,
  Layers,
  Clock,
  Settings,
  ArrowRight,
  ArrowLeftRight,
  Bookmark,
  Minus,
  Box,
  EyeOff,
  Zap,
  Star,
  SlidersHorizontal,
  Palette,
  Circle,
  Download,
  Send,
  Undo2,
  PanelRightClose,
  Eye,
} from "lucide-react";
import { cn } from "../utils/cn";
import { CustomizableButton } from "./CustomizableButton";
import { CustomizableLabel } from "./CustomizableLabel";
import { useButtonCustomization } from "../context/ButtonCustomizationContext";
import eurospectImg from "../assets/images/eurospect_header_1786007763255.jpg";
import { DEFAULT_USER_DEFINED_IMAGE_PATH } from "../types/userDefinedImage";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { RadialColorPicker } from "./RadialColorPicker";
import {
  saveStoredJson,
  getStoredJson,
  saveStoredDefaultImage,
  getStoredDefaultImage,
} from "../utils/idbStorage";
import { uiText } from "../hooks/useUIConfig";
import { remoteStore } from "../services/remoteKeyValueStore";

export interface FourByFourWholePanelStyle {
  // Whole Panel Itself
  primaryColor: string;          // Master theme / accent color
  panelBorderColor: string;      // Outer frame border of the whole panel
  panelBgColor: string;          // Surface background tint
  glowColor: string;             // Ambient glow / drop-shadow
  headerBgColor: string;         // Header and sub-toolbar background tint
  textColor: string;             // Title, labels, and badge text
  // Its Divisions
  divisionColor: string;         // Grid cell divider lines & section separation lines
  divisionWidth: number;         // Division border width: 1, 2, 3, or 4px
  divisionStyle: "solid" | "dashed" | "glow" | "double"; // Division border style
}

// Baseline flat hairline tile style with zero glow and zero outer panel
export const DEFAULT_4X4_PANEL_STYLE: FourByFourWholePanelStyle = {
  primaryColor: "#6366f1",
  panelBorderColor: "transparent",
  panelBgColor: "transparent",
  glowColor: "transparent",
  headerBgColor: "#080d1a",
  textColor: "#c7d2fe",
  divisionColor: "rgba(99, 102, 241, 0.38)",
  divisionWidth: 1,
  divisionStyle: "solid",
};

// Generates harmonious whole panel and division colors from any user-defined primary hex
export function generateHarmonicPanelStyle(primaryHex: string): FourByFourWholePanelStyle {
  const hex = primaryHex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) || 217;
  const g = parseInt(hex.substring(2, 4), 16) || 70;
  const b = parseInt(hex.substring(4, 6), 16) || 239;

  const bgR = Math.max(3, Math.round(r * 0.05));
  const bgG = Math.max(4, Math.round(g * 0.05));
  const bgB = Math.max(8, Math.round(b * 0.05));
  const panelBgColor = `rgb(${bgR}, ${bgG}, ${bgB})`;

  const hR = Math.max(9, Math.round(r * 0.12));
  const hG = Math.max(11, Math.round(g * 0.12));
  const hB = Math.max(20, Math.round(b * 0.12));
  const headerBgColor = `rgb(${hR}, ${hG}, ${hB})`;

  const divR = Math.min(255, Math.round(r * 0.8));
  const divG = Math.min(255, Math.round(g * 0.8));
  const divB = Math.min(255, Math.round(b * 0.8));
  const divisionColor = `rgba(${divR}, ${divG}, ${divB}, 0.45)`;

  const txtR = Math.min(255, Math.round(r * 0.25 + 195));
  const txtG = Math.min(255, Math.round(g * 0.25 + 195));
  const txtB = Math.min(255, Math.round(b * 0.25 + 195));
  const textColor = `rgb(${txtR}, ${txtG}, ${txtB})`;

  return {
    primaryColor: primaryHex,
    panelBorderColor: "transparent",
    panelBgColor,
    glowColor: "transparent",
    headerBgColor,
    textColor,
    divisionColor,
    divisionWidth: 1,
    divisionStyle: "solid",
  };
}

export const PRESET_COLORWAYS_4X4: Array<{
  name: string;
  style: FourByFourWholePanelStyle;
}> = [
  {
    name: "Cyber Fuchsia (Purple Default)",
    style: DEFAULT_4X4_PANEL_STYLE,
  },
  {
    name: "Electric Cyan (Cyber Aqua)",
    style: {
      primaryColor: "#06b6d4",
      panelBorderColor: "#06b6d4",
      panelBgColor: "#03121d",
      glowColor: "#06b6d4",
      headerBgColor: "#061e30",
      textColor: "#cffafe",
      divisionColor: "rgba(6, 182, 212, 0.55)",
      divisionWidth: 1,
      divisionStyle: "solid",
    },
  },
  {
    name: "Emerald Matrix (Neon Green)",
    style: {
      primaryColor: "#10b981",
      panelBorderColor: "#10b981",
      panelBgColor: "#02170d",
      glowColor: "#10b981",
      headerBgColor: "#052718",
      textColor: "#d1fae5",
      divisionColor: "rgba(16, 185, 129, 0.55)",
      divisionWidth: 1,
      divisionStyle: "solid",
    },
  },
  {
    name: "Solar Amber (Gold Hazard)",
    style: {
      primaryColor: "#f59e0b",
      panelBorderColor: "#f59e0b",
      panelBgColor: "#170d02",
      glowColor: "#f59e0b",
      headerBgColor: "#261504",
      textColor: "#fef3c7",
      divisionColor: "rgba(245, 158, 11, 0.55)",
      divisionWidth: 1,
      divisionStyle: "solid",
    },
  },
  {
    name: "Crimson Pulse (Neon Scarlet)",
    style: {
      primaryColor: "#ef4444",
      panelBorderColor: "#ef4444",
      panelBgColor: "#170404",
      glowColor: "#ef4444",
      headerBgColor: "#260808",
      textColor: "#fee2e2",
      divisionColor: "rgba(239, 68, 68, 0.55)",
      divisionWidth: 1,
      divisionStyle: "solid",
    },
  },
  {
    name: "Royal Cobalt (Deep Sapphire)",
    style: {
      primaryColor: "#3b82f6",
      panelBorderColor: "#3b82f6",
      panelBgColor: "#040e1c",
      glowColor: "#3b82f6",
      headerBgColor: "#071630",
      textColor: "#dbeafe",
      divisionColor: "rgba(59, 130, 246, 0.55)",
      divisionWidth: 1,
      divisionStyle: "solid",
    },
  },
  {
    name: "Acid Lime (High-Vis Neon)",
    style: {
      primaryColor: "#84cc16",
      panelBorderColor: "#84cc16",
      panelBgColor: "#0f1703",
      glowColor: "#84cc16",
      headerBgColor: "#182405",
      textColor: "#ecfccb",
      divisionColor: "rgba(132, 204, 22, 0.55)",
      divisionWidth: 1,
      divisionStyle: "solid",
    },
  },
  {
    name: "Monochrome Platinum (Stealth Slate)",
    style: {
      primaryColor: "#94a3b8",
      panelBorderColor: "#64748b",
      panelBgColor: "#0b0f17",
      glowColor: "#94a3b8",
      headerBgColor: "#141c2b",
      textColor: "#f1f5f9",
      divisionColor: "rgba(148, 163, 184, 0.45)",
      divisionWidth: 1,
      divisionStyle: "solid",
    },
  },
];

export interface TileLinkConfig4x4 {
  url: string;
  target?: "_blank" | "_self";
  hoverEffect?: "none" | "zoom" | "spin" | "glow" | "border" | "change-image" | "vivid";
  hoverImage?: string;
  title?: string;
}

export interface FourByFourModalProps {
  isOpen: boolean;
  onClose: () => void;
  heroImage?: string;
  storyboardSlices?: Array<{ name: string; url: string; [key: string]: any }>;
  onSendToCarver?: (imageUrl: string) => void;
  onSendToStoryboard?: (slices: Array<{ name: string; url: string }>) => void;
  onSendToStoryboardReplace?: (slices: Array<{ name: string; url: string }>) => void;
  onApplyToMain3x3?: (boxes: Record<number, string>) => void;
  onReplaceFrontPageWith4x4?: (boxes: Record<number, string>) => void;
  onReplaceSingleFrontPageBox?: (boxId: number, imageUrl: string) => void;
  frontPageGridMode?: "3x3" | "4x4";
  onToggleFrontPageGridMode?: (mode: "3x3" | "4x4") => void;
  panelStyle?: FourByFourWholePanelStyle;
  onUpdatePanelStyle?: (style: FourByFourWholePanelStyle) => void;
}

export const SPREAD_EFFECTS_4X4 = [
  { id: "none", label: "Normal", filter: "none", icon: Sparkles },
  { id: "grayscale", label: "B&W", filter: "grayscale(100%)", icon: Circle },
  { id: "sepia", label: "Sepia", filter: "sepia(100%)", icon: Palette },
  { id: "invert", label: "Invert", filter: "invert(100%)", icon: RefreshCw },
  { id: "blur", label: "Soft", filter: "blur(2px)", icon: EyeOff },
  { id: "hue-rotate", label: "Cyber", filter: "hue-rotate(180deg)", icon: Sliders },
  { id: "contrast", label: "Contrast", filter: "contrast(180%)", icon: Zap },
  { id: "saturate", label: "Vivid", filter: "saturate(200%)", icon: Star },
];

export const SPREAD_PRESETS_4X4 = [
  { label: "16 Panels (4×4)", count: 16, boxes: Array.from({ length: 16 }, (_, i) => i + 1) },
  { label: "12 Panels (4×3)", count: 12, boxes: Array.from({ length: 12 }, (_, i) => i + 1) },
  { label: "9 Panels (3×3)", count: 9, boxes: [1, 2, 3, 5, 6, 7, 9, 10, 11] },
  { label: "8 Panels (4×2)", count: 8, boxes: Array.from({ length: 8 }, (_, i) => i + 1) },
  { label: "4 Panels (2×2)", count: 4, boxes: [1, 2, 5, 6] },
];

const STORAGE_KEY_4X4_BOXES = "seqcarver_json_boxImages_4x4";
const STORAGE_KEY_4X4_DEFAULTS = "seqcarver_defaultBoxImages_4x4";
const STORAGE_KEY_4X4_SPREAD_SRC = "seqcarver_originalSpreadImage_4x4";
const STORAGE_KEY_4X4_ROTATION = "seqcarver_json_boxRotationSeries_4x4";
const STORAGE_KEY_4X4_LINKS = "seqcarver_json_boxLinkConfigs_4x4";
const STORAGE_KEY_4X4_PANEL_STYLE = "seqcarver_4x4_panel_style";
const STORAGE_KEY_4X4_THEME_COLOR = "seqcarver_4x4_theme_color";

export const FourByFourModal: React.FC<FourByFourModalProps> = ({
  isOpen,
  onClose,
  heroImage,
  storyboardSlices = [],
  onSendToCarver,
  onSendToStoryboard,
  onSendToStoryboardReplace,
  onApplyToMain3x3,
  onReplaceFrontPageWith4x4,
  onReplaceSingleFrontPageBox,
  frontPageGridMode = "3x3",
  onToggleFrontPageGridMode,
  panelStyle: externalPanelStyle,
  onUpdatePanelStyle,
}) => {
  const masterHero = heroImage || DEFAULT_USER_DEFINED_IMAGE_PATH;

  // 16 Box images state
  const [boxImages, setBoxImages] = useState<Record<number, string>>(() => {
    try {
      const stored = remoteStore.getItem(STORAGE_KEY_4X4_BOXES) || remoteStore.getItem(STORAGE_KEY_4X4_DEFAULTS);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {};
  });

  // Saved baseline default 16 box images
  const [defaultBoxImages, setDefaultBoxImages] = useState<Record<number, string>>(() => {
    try {
      const stored = remoteStore.getItem(STORAGE_KEY_4X4_DEFAULTS) || remoteStore.getItem(STORAGE_KEY_4X4_BOXES);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {};
  });

  // Master spread source image - prioritize last used custom image over eurospect
  const [targetSpreadImage, setTargetSpreadImage] = useState<string>(() => {
    try {
      const stored = remoteStore.getItem(STORAGE_KEY_4X4_SPREAD_SRC);
      if (stored && stored !== eurospectImg) return stored;
    } catch {}
    if (heroImage && heroImage !== eurospectImg) return heroImage;
    return masterHero;
  });

  const [isHydrated, setIsHydrated] = useState(false);

  // Asynchronously hydrate 4x4 panel images from IndexedDB and Firestore
  useEffect(() => {
    Promise.all([
      getStoredJson<Record<number, string>>(STORAGE_KEY_4X4_BOXES).catch(() => null),
      getStoredJson<Record<number, string>>(STORAGE_KEY_4X4_DEFAULTS).catch(() => null),
      getStoredDefaultImage(STORAGE_KEY_4X4_SPREAD_SRC).catch(() => null),
    ])
      .then(([storedBoxes, storedDef, src]) => {
        if (storedBoxes && typeof storedBoxes === "object" && Object.values(storedBoxes).some(Boolean)) {
          setBoxImages(storedBoxes);
        } else if (storedDef && typeof storedDef === "object" && Object.values(storedDef).some(Boolean)) {
          setBoxImages(storedDef);
        }
        if (storedDef && typeof storedDef === "object" && Object.values(storedDef).some(Boolean)) {
          setDefaultBoxImages(storedDef);
        }
        if (src && src !== eurospectImg) {
          setTargetSpreadImage(src);
        }
        setIsHydrated(true);
      })
      .catch((err) => {
        console.warn("Hydration error 4x4:", err);
        setIsHydrated(true);
      });
  }, []);

  // Auto-persist all 4x4 box changes to localStorage, IndexedDB, and Firestore
  useEffect(() => {
    const hasAnyImage = Object.values(boxImages).some(Boolean);
    if (!hasAnyImage) return;
    try {
      remoteStore.setItem(STORAGE_KEY_4X4_BOXES, JSON.stringify(boxImages));
      remoteStore.setItem(STORAGE_KEY_4X4_DEFAULTS, JSON.stringify(boxImages));
      saveStoredJson(STORAGE_KEY_4X4_BOXES, boxImages).catch(console.warn);
      saveStoredJson(STORAGE_KEY_4X4_DEFAULTS, boxImages).catch(console.warn);
    } catch {}
  }, [boxImages]);

  // Selected active panel (1 to 16)
  const [selectedBoxId, setSelectedBoxId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"matrix" | "spread" | "inspector" | "styles" | "batch">("matrix");

  // Whole Panel Style & Divisions State for 4x4
  const [internalPanelStyle, setInternalPanelStyle] = useState<FourByFourWholePanelStyle>(() => {
    try {
      const stored = remoteStore.getItem(STORAGE_KEY_4X4_PANEL_STYLE);
      if (stored) return JSON.parse(stored);
      const oldColor = remoteStore.getItem(STORAGE_KEY_4X4_THEME_COLOR);
      if (oldColor) return generateHarmonicPanelStyle(oldColor);
    } catch {}
    return DEFAULT_4X4_PANEL_STYLE;
  });

  const panelStyle = externalPanelStyle || internalPanelStyle;

  const handleUpdatePanelStyle = useCallback(
    (updates: Partial<FourByFourWholePanelStyle>) => {
      const current = externalPanelStyle || internalPanelStyle;
      const next: FourByFourWholePanelStyle = {
        ...current,
        ...updates,
      };
      setInternalPanelStyle(next);
      try {
        remoteStore.setItem(STORAGE_KEY_4X4_PANEL_STYLE, JSON.stringify(next));
        remoteStore.setItem(STORAGE_KEY_4X4_THEME_COLOR, next.primaryColor);
      } catch {}
      if (onUpdatePanelStyle) {
        onUpdatePanelStyle(next);
      }
    },
    [externalPanelStyle, internalPanelStyle, onUpdatePanelStyle]
  );

  const handleMasterDialColor = useCallback(
    (colorHex: string) => {
      const current = externalPanelStyle || internalPanelStyle;
      const harmonic = generateHarmonicPanelStyle(colorHex);
      const next: FourByFourWholePanelStyle = {
        ...harmonic,
        divisionWidth: current.divisionWidth,
        divisionStyle: current.divisionStyle,
      };
      setInternalPanelStyle(next);
      try {
        remoteStore.setItem(STORAGE_KEY_4X4_PANEL_STYLE, JSON.stringify(next));
        remoteStore.setItem(STORAGE_KEY_4X4_THEME_COLOR, next.primaryColor);
      } catch {}
      if (onUpdatePanelStyle) {
        onUpdatePanelStyle(next);
      }
    },
    [externalPanelStyle, internalPanelStyle, onUpdatePanelStyle]
  );

  // Drag and swap states
  const [draggedBoxId, setDraggedBoxId] = useState<number | null>(null);
  const [dragOverBoxId, setDragOverBoxId] = useState<number | null>(null);
  const [swapSelectedBoxId, setSwapSelectedBoxId] = useState<number | null>(null);
  const [lastSwappedPair, setLastSwappedPair] = useState<{ a: number; b: number } | null>(null);

  // Rotation series state for all 16 panels
  const [boxRotationSeries, setBoxRotationSeries] = useState<Record<number, string[]>>(() => {
    try {
      const stored = remoteStore.getItem(STORAGE_KEY_4X4_ROTATION);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {};
  });
  const [boxRotationIntervals, setBoxRotationIntervals] = useState<Record<number, number>>({});
  const [boxRotationActive, setBoxRotationActive] = useState<Record<number, boolean>>({});
  const [previewFrameIdx, setPreviewFrameIdx] = useState<number>(0);

  // Tile link configs for all 16 panels
  const [boxLinkConfigs, setBoxLinkConfigs] = useState<Record<number, TileLinkConfig4x4>>(() => {
    try {
      const stored = remoteStore.getItem(STORAGE_KEY_4X4_LINKS);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {};
  });

  // Spread Studio state
  const [spreadSelectedBoxes, setSpreadSelectedBoxes] = useState<number[]>(
    Array.from({ length: 16 }, (_, i) => i + 1)
  );
  const [spreadEffect, setSpreadEffect] = useState<string>("none");
  const [spreadLockAspect, setSpreadLockAspect] = useState<boolean>(true);
  const [spreadStretchX, setSpreadStretchX] = useState<number>(1.0);
  const [spreadStretchY, setSpreadStretchY] = useState<number>(1.0);

  // UI Presentation State
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isDiscreteMode, setIsDiscreteMode] = useState<boolean>(false);
  const [isTestHoverActive, setIsTestHoverActive] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [liveAspectMode, setLiveAspectMode] = useState<"auto" | "1:1" | "16:9" | "4:3">("auto");

  // Window Draggable & Resizable state
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });

  const [size, setSize] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== "undefined" ? Math.min(window.innerWidth - 32, 1260) : 1200,
    height: typeof window !== "undefined" ? Math.min(window.innerHeight - 40, 840) : 800,
  }));
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number }>({
    startX: 0,
    startY: 0,
    startW: 1200,
    startH: 800,
  });

  // File input refs
  const masterSpreadFileInputRef = useRef<HTMLInputElement>(null);
  const singlePanelFileInputRef = useRef<HTMLInputElement>(null);
  const rotationFrameFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

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

  // Dragging Header Logic
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("select") || target.closest("a")) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.posX + dx,
        y: dragRef.current.posY + dy,
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Resize Window Logic
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: size.width,
      startH: size.height,
    };
  };

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeRef.current.startX;
      const dy = e.clientY - resizeRef.current.startY;
      setSize({
        width: Math.max(650, resizeRef.current.startW + dx),
        height: Math.max(500, resizeRef.current.startH + dy),
      });
    };
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Slicing engine: Slice any image into a 4x4 matrix (16 tiles)
  const sliceImageTo4x4 = useCallback((sourceUrl: string, selectedBoxes?: number[], fxFilter: string = "none") => {
    if (!sourceUrl) return;
    const img = new Image();
    if (sourceUrl.startsWith("http://") || sourceUrl.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }

    const process = () => {
      const cols = 4;
      const rows = 4;
      const pieceW = img.naturalWidth / cols;
      const pieceH = img.naturalHeight / rows;
      const canvas = document.createElement("canvas");
      canvas.width = pieceW;
      canvas.height = pieceH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const targetBoxes = selectedBoxes || Array.from({ length: 16 }, (_, i) => i + 1);
      const newSlices: Record<number, string> = {};

      let boxIdx = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (targetBoxes.includes(boxIdx)) {
            ctx.clearRect(0, 0, pieceW, pieceH);
            if (fxFilter && fxFilter !== "none") {
              ctx.filter = fxFilter;
            } else {
              ctx.filter = "none";
            }
            ctx.drawImage(img, c * pieceW, r * pieceH, pieceW, pieceH, 0, 0, pieceW, pieceH);
            newSlices[boxIdx] = canvas.toDataURL("image/png");
          }
          boxIdx++;
        }
      }

      setBoxImages((prev) => {
        const updated = { ...prev, ...newSlices };
        try {
          remoteStore.setItem(STORAGE_KEY_4X4_BOXES, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    };

    if (img.complete && img.naturalWidth > 0) {
      process();
    } else {
      img.onload = process;
    }
    img.src = sourceUrl;
  }, []);

  // Initial slice on first open if empty - prioritizes last user image over eurospect
  useEffect(() => {
    if (!isOpen) return;
    const hasAnyImage = Object.values(boxImages).some(Boolean);
    if (!hasAnyImage) {
      const lastUserImage =
        targetSpreadImage && targetSpreadImage !== eurospectImg && !targetSpreadImage.includes("source-01.jpg")
          ? targetSpreadImage
          : heroImage && heroImage !== eurospectImg && !heroImage.includes("source-01.jpg")
          ? heroImage
          : masterHero;
      sliceImageTo4x4(lastUserImage);
    }
  }, [isOpen, boxImages, targetSpreadImage, heroImage, masterHero, sliceImageTo4x4]);

  // Swap panels logic
  const handleSwapPanels = (boxA: number, boxB: number) => {
    if (boxA === boxB || boxA < 1 || boxA > 16 || boxB < 1 || boxB > 16) return;
    setBoxImages((prev) => {
      const updated = {
        ...prev,
        [boxA]: prev[boxB] || "",
        [boxB]: prev[boxA] || "",
      };
      try {
        remoteStore.setItem(STORAGE_KEY_4X4_BOXES, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setBoxRotationSeries((prev) => {
      const updated = {
        ...prev,
        [boxA]: prev[boxB] || [],
        [boxB]: prev[boxA] || [],
      };
      try {
        remoteStore.setItem(STORAGE_KEY_4X4_ROTATION, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setBoxLinkConfigs((prev) => {
      const updated = {
        ...prev,
        [boxA]: prev[boxB] ? { ...prev[boxB] } : { url: "" },
        [boxB]: prev[boxA] ? { ...prev[boxA] } : { url: "" },
      };
      try {
        remoteStore.setItem(STORAGE_KEY_4X4_LINKS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setLastSwappedPair({ a: boxA, b: boxB });
    setSwapSelectedBoxId(null);
    showToast(`✓ Swapped Panel #${boxA} with Panel #${boxB}!`);
  };

  const handleSelectPanelForSwap = (boxId: number) => {
    if (swapSelectedBoxId === null) {
      setSwapSelectedBoxId(boxId);
      showToast(`Panel #${boxId} selected — Click another panel to swap`);
    } else if (swapSelectedBoxId === boxId) {
      setSwapSelectedBoxId(null);
    } else {
      handleSwapPanels(swapSelectedBoxId, boxId);
    }
  };

  const handleUndoSwap = () => {
    if (lastSwappedPair) {
      handleSwapPanels(lastSwappedPair.a, lastSwappedPair.b);
      setLastSwappedPair(null);
      showToast("✓ Reverted panel swap!");
    }
  };

  // Upload to single panel
  const handleSinglePanelUpload = (boxId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result?.toString() || "";
        if (url) {
          setBoxImages((prev) => {
            const updated = { ...prev, [boxId]: url };
            try {
              remoteStore.setItem(STORAGE_KEY_4X4_BOXES, JSON.stringify(updated));
            } catch {}
            return updated;
          });
          showToast(`✓ Uploaded image to Panel #${boxId}!`);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  // Active panel info
  const currentImage = boxImages[selectedBoxId] || "";
  const currentRotation = boxRotationSeries[selectedBoxId] || [];
  const currentInterval = boxRotationIntervals[selectedBoxId] || 3;
  const isRotating = boxRotationActive[selectedBoxId] && currentRotation.length > 0;
  const currentLink = boxLinkConfigs[selectedBoxId] || { url: "", target: "_blank", hoverEffect: "none" };

  // Rotation frame preview
  useEffect(() => {
    if (!isRotating || currentRotation.length === 0) return;
    const timer = setInterval(() => {
      setPreviewFrameIdx((prev) => (prev + 1) % currentRotation.length);
    }, currentInterval * 1000);
    return () => clearInterval(timer);
  }, [isRotating, currentRotation, currentInterval]);

  const activeDisplayImage = isRotating && currentRotation[previewFrameIdx]
    ? currentRotation[previewFrameIdx]
    : currentImage;

  // Batch actions
  const handleExportZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder("4x4_advert_panels");
    let count = 0;

    for (let i = 1; i <= 16; i++) {
      const dataUrl = boxImages[i];
      if (dataUrl && dataUrl.startsWith("data:image")) {
        const base64Data = dataUrl.split(",")[1];
        folder?.file(`panel_${String(i).padStart(2, "0")}.png`, base64Data, { base64: true });
        count++;
      }
    }

    if (count === 0) {
      showToast("No panel images available to export");
      return;
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "seqcarver_4x4_advert_panels.zip");
    showToast(`✓ Downloaded ${count} 4x4 panels as ZIP!`);
  };

  const handleSendAllToStoryboard = (replace: boolean = true) => {
    const slicesToSend: Array<{ name: string; url: string }> = [];
    for (let i = 1; i <= 16; i++) {
      if (boxImages[i]) {
        slicesToSend.push({
          name: `4x4 Panel #${i}${i === 1 ? " (Hero)" : ""}`,
          url: boxImages[i],
        });
      }
    }
    if (slicesToSend.length === 0) {
      showToast("No images to send to storyboard");
      return;
    }
    if (replace && onSendToStoryboardReplace) {
      onSendToStoryboardReplace(slicesToSend);
      showToast(`✓ Replaced Storyboard slots with ${slicesToSend.length} 4×4 frames!`);
    } else if (onSendToStoryboard) {
      onSendToStoryboard(slicesToSend);
      showToast(`✓ Sent ${slicesToSend.length} 4×4 frames to Storyboard!`);
    }
  };

  const handleReplaceFrontPageWith4x4 = () => {
    const hasAnyImage = Object.values(boxImages).some(Boolean);
    if (!hasAnyImage) {
      showToast("No 4×4 panel images to send");
      return;
    }
    if (onReplaceFrontPageWith4x4) {
      onReplaceFrontPageWith4x4(boxImages);
    } else if (onApplyToMain3x3) {
      onApplyToMain3x3(boxImages);
    }
    showToast("✓ Front Page Advert Grid replaced with 4×4 (16 Panels)!");
    onClose();
  };

  const handleReplaceSingleFrontPageBox = (boxId: number) => {
    const img = boxImages[boxId];
    if (!img) {
      showToast(`Panel #${boxId} has no image`);
      return;
    }
    if (onReplaceSingleFrontPageBox) {
      onReplaceSingleFrontPageBox(boxId, img);
      showToast(`✓ Replaced Front Page Box #${boxId}!`);
    } else if (onApplyToMain3x3) {
      onApplyToMain3x3({ [boxId]: img });
      showToast(`✓ Replaced Front Page Box #${boxId}!`);
    }
  };

  const handleApplyToFrontPage3x3 = () => {
    if (onApplyToMain3x3) {
      const main3x3Boxes: Record<number, string> = {};
      for (let i = 1; i <= 9; i++) {
        if (boxImages[i]) {
          main3x3Boxes[i] = boxImages[i];
        }
      }
      onApplyToMain3x3(main3x3Boxes);
      showToast("✓ Applied top 9 panels to main Front Page 3×3 grid!");
    }
  };

  const handleSaveAsDefault = () => {
    setDefaultBoxImages(boxImages);
    try {
      remoteStore.setItem(STORAGE_KEY_4X4_DEFAULTS, JSON.stringify(boxImages));
      remoteStore.setItem(STORAGE_KEY_4X4_SPREAD_SRC, targetSpreadImage);
    } catch {}
    showToast("✓ Saved present 4x4 layout as permanent baseline default!");
  };

  const handleResetToDefault = () => {
    if (defaultBoxImages && Object.keys(defaultBoxImages).length > 0 && Object.values(defaultBoxImages).some(Boolean)) {
      setBoxImages(defaultBoxImages);
      showToast("✓ Restored 4x4 panels from saved baseline default!");
    } else {
      const lastUserImage =
        targetSpreadImage && targetSpreadImage !== eurospectImg && !targetSpreadImage.includes("source-01.jpg")
          ? targetSpreadImage
          : heroImage && heroImage !== eurospectImg && !heroImage.includes("source-01.jpg")
          ? heroImage
          : masterHero;
      sliceImageTo4x4(lastUserImage);
      showToast("✓ Restored 4x4 panels to last saved layout!");
    }
  };

  if (!isOpen) return null;

  // Minimized floating pill docked to screen
  if (isMinimized) {
    return (
      <div className="fixed top-14 right-4 z-50 pointer-events-auto select-none animate-in fade-in duration-150">
        <CustomizableButton
          buttonId="ad_4x4_minimized_pill"
          defaultLabel="4x4 Matrix Studio"
          defaultIcon={<LayoutGrid className="w-3.5 h-3.5 text-fuchsia-400" />}
          onClick={() => setIsMinimized(false)}
          className="px-3 py-1.5 rounded-xl bg-[#140b22]/95 hover:bg-[#1f1136] border border-fuchsia-500/50 text-fuchsia-300 font-bold text-xs shadow-2xl backdrop-blur-md flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          title="Restore 4x4 Advert Panel Studio"
        />
      </div>
    );
  }

  // Header Bar Component
  const renderHeaderBar = () => (
    <div
      onMouseDown={handleHeaderMouseDown}
      style={{
        backgroundColor: panelStyle.headerBgColor,
        borderBottomColor: panelStyle.divisionColor,
      }}
      className="h-10 px-3 border-b flex items-center justify-between select-none cursor-grab active:cursor-grabbing shrink-0 transition-colors"
    >
      <div className="flex items-center gap-2 min-w-0">
        <LayoutGrid className="w-4 h-4 shrink-0 transition-colors" style={{ color: panelStyle.primaryColor }} />
        <CustomizableLabel
          labelId="ad_4x4_header_title"
          defaultLabel="4X4 FRONTPAGE ADVERT PANEL LAUNCHER"
          className="text-[11px] font-black uppercase tracking-wider font-mono truncate"
          style={{ color: panelStyle.textColor }}
        />
        <span
          style={{
            color: panelStyle.textColor,
            borderColor: panelStyle.panelBorderColor,
            backgroundColor: `${panelStyle.headerBgColor}ee`,
          }}
          className="text-[9px] font-mono font-bold border px-2 py-0.5 rounded shadow-xs shrink-0"
        >
          {uiText("components_four_by_four_modal.span.16_panels_4_4", "16 PANELS (4×4)")}
        </span>
      </div>

      {/* Tabs */}
      <div
        style={{
          borderColor: panelStyle.divisionColor,
          backgroundColor: `${panelStyle.panelBgColor}aa`,
        }}
        className="flex items-center gap-1 p-0.5 rounded-lg border text-[10px] font-bold transition-colors"
      >
        {[
          { id: "matrix", label: "16-Grid Matrix", icon: LayoutGrid },
          { id: "spread", label: "Spread 4x4", icon: Grid },
          { id: "inspector", label: "Panel Inspector", icon: Settings },
          { id: "styles", label: "Styles & Dial", icon: Palette },
          { id: "batch", label: "Batch & Export", icon: Layers },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <CustomizableButton
              buttonId="four_by_four_modal_btn_38"
              key={tab.id}
type="button"
onClick={() => setActiveTab(tab.id as any)}
style={
                isActive
                  ? {
                      backgroundColor: panelStyle.primaryColor,
                      color: "#020617",
                    }
                  : undefined
              }
className={cn(
                "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0 font-bold",
                !isActive && "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
                {() => (
                    <>
                      <TabIcon className="w-3 h-3" />
                    <span>{tab.label}</span>
                    </>
                  )}
            </CustomizableButton>
          );
        })}
      </div>

      {/* Window Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <RadialColorPicker
          color={panelStyle.primaryColor}
          onChange={handleMasterDialColor}
          compactTrigger={true}
          buttonLabel="Dial"
          buttonClassName="px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
        />
        <CustomizableButton
          buttonId="four_by_four_modal_btn_37"
          defaultIcon={<Maximize2 className="w-3 h-3" />}
          type="button"
onClick={() => {
            if (size.width >= window.innerWidth - 32 && size.height >= window.innerHeight - 32) {
              setSize({
                width: Math.min(window.innerWidth - 32, 1260),
                height: Math.min(window.innerHeight - 40, 840),
              });
              setPosition({ x: 0, y: 0 });
            } else {
              setSize({ width: window.innerWidth - 16, height: window.innerHeight - 16 });
              setPosition({ x: 0, y: 0 });
            }
          }}
style={{
            borderColor: panelStyle.panelBorderColor,
            backgroundColor: `${panelStyle.headerBgColor}ee`,
            color: panelStyle.textColor,
          }}
className="w-6 h-6 rounded border flex items-center justify-center transition-colors cursor-pointer hover:brightness-125"
title={uiText("components_four_by_four_modal.button.maximize_restore_window.title", "Maximize / Restore Window")}
        />
        <CustomizableButton
          buttonId="four_by_four_modal_btn_36"
          defaultIcon={<Minus className="w-3 h-3" />}
          type="button"
onClick={() => setIsMinimized(true)}
style={{
            borderColor: panelStyle.panelBorderColor,
            backgroundColor: `${panelStyle.headerBgColor}ee`,
            color: panelStyle.textColor,
          }}
className="w-6 h-6 rounded border flex items-center justify-center transition-colors cursor-pointer hover:brightness-125"
title={uiText("components_four_by_four_modal.button.minimize_to_floating_pill.title", "Minimize to floating pill")}
        />
        <CustomizableButton
          buttonId="four_by_four_modal_btn_35"
          defaultIcon={<X className="w-3.5 h-3.5" />}
          type="button"
onClick={onClose}
style={{
            borderColor: panelStyle.panelBorderColor,
            backgroundColor: `${panelStyle.headerBgColor}ee`,
            color: panelStyle.textColor,
          }}
className="w-6 h-6 rounded border hover:bg-rose-950 hover:border-rose-500/60 hover:text-rose-200 flex items-center justify-center transition-colors cursor-pointer"
title={uiText("components_four_by_four_modal.button.close_4x4_modal_esc.title", "Close 4x4 Modal (Esc)")}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Toast Notice */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              backgroundColor: panelStyle.primaryColor,
            }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999] text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 border border-white/40 pointer-events-auto"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={uiText("components_four_by_four_modal.div.4x4_frontpage_advert_panel_launcher_modal.aria_label", "4x4 Frontpage Advert Panel Launcher Modal")}
        className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none bg-black/65 backdrop-blur-xs"
      >
        <div
          style={{
            width: `${size.width}px`,
            height: `${size.height}px`,
            transform: `translate(${position.x}px, ${position.y}px)`,
            maxWidth: "98vw",
            maxHeight: "96vh",
            borderColor: panelStyle.panelBorderColor,
            backgroundColor: panelStyle.panelBgColor,
            boxShadow: `0 25px 60px rgba(0,0,0,0.95), 0 0 50px ${panelStyle.glowColor}50`,
          }}
          className={cn(
            "pointer-events-auto relative border rounded-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150 backdrop-blur-2xl transition-colors",
            (isDragging || isResizing) && "transition-none shadow-[0_0_60px_rgba(255,255,255,0.25)]"
          )}
        >
          {renderHeaderBar()}

          {/* Action Sub-Toolbar */}
          <div
            style={{
              backgroundColor: `${panelStyle.headerBgColor}ee`,
              borderBottomColor: panelStyle.divisionColor,
            }}
            className="h-9 px-3 border-b flex items-center justify-between text-xs shrink-0 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-semibold">{uiText("components_four_by_four_modal.span.active_panel", "Active Panel:")}</span>
              <span
                style={{
                  color: panelStyle.textColor,
                  borderColor: panelStyle.divisionColor,
                  backgroundColor: panelStyle.panelBgColor,
                }}
                className="text-[10px] font-mono font-bold border px-2 py-0.5 rounded shadow-xs"
              >
                #{selectedBoxId} {selectedBoxId === 1 ? "(Hero Screen)" : ""}
              </span>

              {/* Panel Quick Switcher 1 to 16 */}
              <div
                style={{
                  borderColor: panelStyle.divisionColor,
                  backgroundColor: `${panelStyle.panelBgColor}cc`,
                }}
                className="flex items-center gap-0.5 p-0.5 rounded border ml-1 overflow-x-auto max-w-[420px] scrollbar-none"
              >
                {Array.from({ length: 16 }, (_, i) => i + 1).map((bId) => (
                  <CustomizableButton
                    buttonId="four_by_four_modal_btn_34"
                    key={`nav-box-${bId}`}
type="button"
onClick={() => setSelectedBoxId(bId)}
style={
                      selectedBoxId === bId
                        ? {
                            backgroundColor: panelStyle.primaryColor,
                            color: "#020617",
                          }
                        : undefined
                    }
className={cn(
                      "w-4.5 h-4.5 rounded text-[8px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center shrink-0",
                      selectedBoxId !== bId && "text-slate-400 hover:text-white hover:bg-white/10"
                    )}
title={`Panel #${bId}`}
                  >
                      {() => (
                          <>
                            {bId}
                          </>
                        )}
                  </CustomizableButton>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Return to 3x3 Button */}
              <CustomizableButton
                buttonId="four_by_four_modal_btn_33"
                defaultIcon={<Grid3x3 className="w-3.5 h-3.5 text-cyan-400" />}
                type="button"
onClick={() => {
                  if (onToggleFrontPageGridMode) {
                    onToggleFrontPageGridMode("3x3");
                  }
                  showToast("✓ Returned Front Page Advert Grid to 9-Panel (3×3) layout!");
                }}
className="px-2 py-1 rounded text-[10px] font-black bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 flex items-center gap-1 cursor-pointer transition-all shadow-xs active:scale-95"
title={uiText("components_four_by_four_modal.button.return_front_page_advert_grid_to_9_panel_3_3.title", "Return Front Page Advert Grid to 9-Panel (3×3) Layout")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_four_by_four_modal.span.return_to_3_3", "Return to 3×3")}</span>
                      </>
                    )}
              </CustomizableButton>

              {/* Radial Dial Modal for Whole Panel & Divisions */}
              <RadialColorPicker
                color={panelStyle.primaryColor}
                onChange={handleMasterDialColor}
                compactTrigger={true}
                buttonLabel="Dial Panel Styles"
                buttonClassName="px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all shadow-xs"
              />

              <CustomizableButton
                buttonId="four_by_four_modal_btn_32"
                defaultIcon={<Send className="w-3.5 h-3.5 text-white" />}
                type="button"
onClick={handleReplaceFrontPageWith4x4}
style={{
                  borderColor: panelStyle.panelBorderColor,
                  background: `linear-gradient(135deg, ${panelStyle.primaryColor}, #0284c7)`,
                }}
className="px-2.5 py-1 rounded text-[10px] font-black text-white border flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
title={uiText("components_four_by_four_modal.button.send_and_replace_front_page_advert_grid_with.title", "Send and Replace Front Page Advert Grid with 4x4 (16 Panels)")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_four_by_four_modal.span.send_front_page_4_4", "Send Front Page (4×4)")}</span>
                      </>
                    )}
              </CustomizableButton>

              {lastSwappedPair && (
                <CustomizableButton
                  buttonId="four_by_four_modal_btn_31"
                  defaultIcon={<Undo2 className="w-3 h-3" />}
                  type="button"
onClick={handleUndoSwap}
className="px-2 py-1 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                    {() => (
                        <>
                          <span>{uiText("components_four_by_four_modal.span.undo_swap", "Undo Swap")}</span>
                        </>
                      )}
                </CustomizableButton>
              )}

              <CustomizableButton
                buttonId="four_by_four_modal_btn_load_present_4x4"
                defaultIcon={<LayoutGrid className="w-3 h-3 text-emerald-400" />}
                type="button"
                onClick={() => {
                  const lastUserImage =
                    targetSpreadImage && targetSpreadImage !== eurospectImg && !targetSpreadImage.includes("source-01.jpg")
                      ? targetSpreadImage
                      : heroImage && heroImage !== eurospectImg && !heroImage.includes("source-01.jpg")
                      ? heroImage
                      : masterHero;
                  sliceImageTo4x4(lastUserImage);
                  try {
                    remoteStore.setItem(STORAGE_KEY_4X4_SPREAD_SRC, lastUserImage);
                  } catch {}
                  showToast("✓ Loaded present image as default 4×4!");
                }}
                className="px-2 py-1 rounded text-[10px] font-bold bg-[#051814] hover:bg-[#08261f] text-emerald-300 border border-emerald-500/50 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                title={uiText("components_four_by_four_modal.button.load_present_image_as_default_4x4.title", "Load present image as default 4x4")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_four_by_four_modal.span.load_present_4x4", "Load present 4x4")}</span>
                      </>
                    )}
              </CustomizableButton>

              <CustomizableButton
                buttonId="four_by_four_modal_btn_30"
                defaultIcon={<Bookmark className="w-3 h-3 text-amber-400" />}
                type="button"
onClick={handleSaveAsDefault}
className="px-2 py-1 rounded text-[10px] font-bold bg-[#261305] hover:bg-[#381c07] text-amber-300 border border-amber-500/50 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
title={uiText("components_four_by_four_modal.button.save_4x4_state_as_baseline_default.title", "Save 4x4 state as baseline default")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_four_by_four_modal.span.set_default", "Set default")}</span>
                      </>
                    )}
              </CustomizableButton>

              <CustomizableButton
                buttonId="four_by_four_modal_btn_29"
                defaultIcon={<RotateCcw className="w-3 h-3" />}
                type="button"
onClick={handleResetToDefault}
className="px-2 py-1 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
title={uiText("components_four_by_four_modal.button.reset_4x4_to_defaults.title", "Reset 4x4 to defaults")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_four_by_four_modal.span.reset_4x4", "Reset 4x4")}</span>
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Area: 4x4 (16 Panels) Interactive Grid */}
            <div
              style={{
                backgroundColor: `${panelStyle.panelBgColor}88`,
              }}
              className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center min-w-0 transition-colors"
            >
              {/* Swap Notice Banner */}
              {swapSelectedBoxId !== null && (
                <div className="w-full max-w-[640px] mb-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-950/80 border border-amber-500/50 text-amber-200 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2 truncate">
                    <ArrowLeftRight className="w-3.5 h-3.5 shrink-0 text-amber-400 animate-pulse" />
                    <span>{uiText("components_four_by_four_modal.span.panel", "Panel #")}{swapSelectedBoxId}{uiText("components_four_by_four_modal.span.selected_click_another_panel_to_swap_them", " selected. Click another panel to swap them!")}</span>
                  </div>
                  <CustomizableButton
                    buttonId="four_by_four_modal_btn_28"
                    type="button"
onClick={() => setSwapSelectedBoxId(null)}
className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/40 text-amber-300 font-bold cursor-pointer"
                  >
                      {() => (
                          <>
                            {uiText("components_four_by_four_modal.button.cancel", "Cancel")}
                          </>
                        )}
                  </CustomizableButton>
                </div>
              )}

              {/* 4x4 Grid (16 Tiles) */}
              <div
                className="grid grid-cols-4 gap-2 sm:gap-2.5 p-0 border-0 bg-transparent shadow-none max-w-[760px] w-full transition-all"
              >
                {Array.from({ length: 16 }, (_, i) => i + 1).map((boxId) => {
                  const imgUrl = boxImages[boxId] || "";
                  const isSelected = selectedBoxId === boxId;
                  const isSwapTarget = swapSelectedBoxId === boxId;
                  const isDragOver = dragOverBoxId === boxId;
                  const hasLink = !!boxLinkConfigs[boxId]?.url;
                  const hasRotation = !!boxRotationActive[boxId] && (boxRotationSeries[boxId]?.length || 0) > 0;

                  return (
                    <div
                      key={`box-card-4x4-${boxId}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", String(boxId));
                        setDraggedBoxId(boxId);
                      }}
                      onDragEnd={() => {
                        setDraggedBoxId(null);
                        setDragOverBoxId(null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverBoxId(boxId);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const sourceId = parseInt(e.dataTransfer.getData("text/plain"), 10);
                        if (!isNaN(sourceId) && sourceId !== boxId) {
                          handleSwapPanels(sourceId, boxId);
                        }
                        setDraggedBoxId(null);
                        setDragOverBoxId(null);
                      }}
                      onClick={() => {
                        if (swapSelectedBoxId !== null) {
                          handleSelectPanelForSwap(boxId);
                        } else {
                          setSelectedBoxId(boxId);
                        }
                      }}
                      style={{
                        borderWidth: `${panelStyle.divisionWidth}px`,
                        borderStyle: panelStyle.divisionStyle === "glow" ? "solid" : panelStyle.divisionStyle,
                        borderColor: panelStyle.divisionColor,
                        backgroundColor: "rgba(0, 0, 0, 0.75)",
                        boxShadow:
                          panelStyle.divisionStyle === "glow"
                            ? `0 0 10px ${panelStyle.divisionColor}`
                            : isSelected
                            ? `0 0 16px ${panelStyle.primaryColor}`
                            : undefined,
                      }}
                      className={cn(
                        "group relative aspect-square rounded-xl overflow-hidden transition-all cursor-pointer flex flex-col shadow-md",
                        isSelected
                          ? "ring-2 scale-[1.02]"
                          : "hover:scale-[1.01]",
                        isSwapTarget && "ring-2 ring-amber-400 border-amber-300 animate-pulse",
                        isDragOver && "ring-2 ring-cyan-400 bg-cyan-950/40"
                      )}
                    >
                      {/* Image Thumbnail */}
                      <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-slate-950">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={`Panel #${boxId}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-600 gap-1">
                            <LayoutGrid className="w-5 h-5 opacity-40" />
                            <span className="text-[8px] font-mono">{uiText("components_four_by_four_modal.span.empty", "Empty")}</span>
                          </div>
                        )}
                      </div>

                      {/* Header Badge */}
                      <div className="absolute top-1 left-1 flex items-center gap-1 z-10">
                        <span
                          style={{
                            color: boxId === 1 ? "#020617" : panelStyle.textColor,
                            backgroundColor: boxId === 1 ? panelStyle.primaryColor : "rgba(0,0,0,0.85)",
                            borderColor: panelStyle.divisionColor,
                          }}
                          className="text-[8px] font-mono font-black px-1.5 py-0.5 rounded shadow-sm border"
                        >
                          #{boxId}
                          {boxId === 1 ? " Hero" : ""}
                        </span>
                        {hasRotation && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-ping" />
                        )}
                        {hasLink && (
                          <span className="p-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                            <Link2 className="w-2 h-2" />
                          </span>
                        )}
                      </div>

                      {/* Quick Hover Controls Overlay */}
                      <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 z-20">
                        <span className="text-[9px] font-black tracking-wider" style={{ color: panelStyle.textColor }}>
                          {uiText("components_four_by_four_modal.span.panel_2", "Panel #")}{boxId}
                        </span>
                        <div className="flex items-center gap-1">
                          <CustomizableButton
                            buttonId="four_by_four_modal_btn_27"
                            defaultIcon={<Upload className="w-2.5 h-2.5" />}
                            type="button"
onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBoxId(boxId);
                              singlePanelFileInputRef.current?.click();
                            }}
className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 cursor-pointer"
title={uiText("components_four_by_four_modal.button.upload_new_image.title", "Upload new image")}
                          />
                          <CustomizableButton
                            buttonId="four_by_four_modal_btn_26"
                            defaultIcon={<Palette className="w-2.5 h-2.5" />}
                            type="button"
onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBoxId(boxId);
                              setActiveTab("styles");
                            }}
className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 cursor-pointer"
title={uiText("components_four_by_four_modal.button.open_panel_and_divisions_styles_studio.title", "Open Panel & Divisions Styles Studio")}
                          />
                          {imgUrl && onSendToCarver && (
                            <CustomizableButton
                              buttonId="four_by_four_modal_btn_25"
                              defaultIcon={<Scissors className="w-2.5 h-2.5" />}
                              type="button"
onClick={(e) => {
                                e.stopPropagation();
                                onSendToCarver(imgUrl);
                                onClose();
                              }}
className="p-1 rounded bg-indigo-950/90 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/40 cursor-pointer"
title={uiText("components_four_by_four_modal.button.send_to_carver_canvas.title", "Send to Carver Canvas")}
                            />
                          )}
                          {imgUrl && (
                            <CustomizableButton
                              buttonId="four_by_four_modal_btn_24"
                              defaultIcon={<Send className="w-2.5 h-2.5" />}
                              type="button"
onClick={(e) => {
                                e.stopPropagation();
                                handleReplaceSingleFrontPageBox(boxId);
                              }}
className="p-1 rounded bg-purple-950/90 hover:bg-purple-800 text-purple-200 border border-purple-500/40 cursor-pointer"
title={`Send to Front Page Box #${boxId}`}
                            />
                          )}
                          <CustomizableButton
                            buttonId="four_by_four_modal_btn_23"
                            defaultIcon={<ArrowLeftRight className="w-2.5 h-2.5" />}
                            type="button"
onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPanelForSwap(boxId);
                            }}
className="p-1 rounded bg-amber-950/90 hover:bg-amber-800 text-amber-200 border border-amber-500/40 cursor-pointer"
title={uiText("components_four_by_four_modal.button.swap_panel_position.title", "Swap panel position")}
                          />
                          {imgUrl && (
                            <CustomizableButton
                              buttonId="four_by_four_modal_btn_22"
                              defaultIcon={<Trash2 className="w-2.5 h-2.5" />}
                              type="button"
onClick={(e) => {
                                e.stopPropagation();
                                setBoxImages((prev) => ({ ...prev, [boxId]: "" }));
                                showToast(`✓ Cleared Panel #${boxId}`);
                              }}
className="p-1 rounded bg-rose-950/90 hover:bg-rose-800 text-rose-200 border border-rose-500/40 cursor-pointer"
title={uiText("components_four_by_four_modal.button.clear_panel_image.title", "Clear panel image")}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hidden file input for single panel upload */}
              <input
                ref={singlePanelFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleSinglePanelUpload(selectedBoxId, e)}
                className="hidden"
              />
            </div>

            {/* Right Area: Control Deck Sidebar */}
            <div
              style={{
                borderLeftColor: panelStyle.divisionColor,
                backgroundColor: `${panelStyle.panelBgColor}dd`,
              }}
              className="w-[360px] max-w-[40%] border-l flex flex-col min-h-0 overflow-hidden shrink-0 transition-colors"
            >
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* TAB 1: SPREAD 4x4 */}
                {activeTab === "spread" && (
                  <div className="space-y-3 animate-in fade-in duration-100">
                    <div className="bg-[#120726] p-3 rounded-2xl border border-fuchsia-500/30 space-y-2.5">
                      <div className="flex items-center justify-between pb-1 border-b border-fuchsia-500/20">
                        <div className="flex items-center gap-1.5">
                          <Grid className="w-4 h-4 text-fuchsia-400" />
                          <span className="text-[10px] font-bold text-fuchsia-300 uppercase tracking-wider">
                            {uiText("components_four_by_four_modal.span.master_spread_4_4", "Master Spread (4×4)")}
                          </span>
                        </div>
                        <span className="text-[8.5px] font-mono text-fuchsia-400 bg-fuchsia-950/80 px-2 py-0.5 rounded border border-fuchsia-500/30">
                          {spreadSelectedBoxes.length}{uiText("components_four_by_four_modal.span.panels_target", " Panels Target")}
                        </span>
                      </div>

                      {/* Master Image Preview */}
                      <div className="flex items-center gap-2.5 p-2 bg-[#080212] rounded-xl border border-fuchsia-950">
                        <div className="w-10 h-10 rounded-lg border border-fuchsia-500/40 overflow-hidden shrink-0 bg-slate-900 flex items-center justify-center">
                          {targetSpreadImage ? (
                            <img src={targetSpreadImage} alt={uiText("components_four_by_four_modal.img.master_spread.alt", "Master Spread")} className="w-full h-full object-cover" />
                          ) : (
                            <LayoutGrid className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-fuchsia-300 block truncate">
                            {uiText("components_four_by_four_modal.span.target_master_image", "Target Master Image")}
                          </span>
                          <span className="text-[8px] text-slate-400 block truncate">
                            {uiText("components_four_by_four_modal.span.un_sliced_4_4_source_image", "Un-sliced 4×4 source image")}
                          </span>
                        </div>
                        <CustomizableButton
                          buttonId="four_by_four_modal_btn_21"
                          type="button"
onClick={() => masterSpreadFileInputRef.current?.click()}
className="px-2 py-1 bg-fuchsia-950 hover:bg-fuchsia-900 border border-fuchsia-500/40 text-fuchsia-300 rounded-lg text-[9px] font-bold cursor-pointer transition-colors"
                        >
                            {() => (
                                <>
                                  {uiText("components_four_by_four_modal.button.change", "Change")}
                                </>
                              )}
                        </CustomizableButton>
                        <input
                          ref={masterSpreadFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                const url = reader.result?.toString() || "";
                                if (url) {
                                  setTargetSpreadImage(url);
                                  try {
                                    remoteStore.setItem(STORAGE_KEY_4X4_SPREAD_SRC, url);
                                  } catch {}
                                  showToast("✓ Target master image updated!");
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                      </div>

                      {/* Primary Actions */}
                      <CustomizableButton
                        buttonId="four_by_four_modal_btn_20"
                        defaultIcon={<LayoutGrid className="w-3.5 h-3.5" />}
                        type="button"
onClick={() => {
                          if (targetSpreadImage) {
                            sliceImageTo4x4(targetSpreadImage, spreadSelectedBoxes, spreadEffect);
                            showToast(`✓ Sliced & spread image across ${spreadSelectedBoxes.length} panels!`);
                          }
                        }}
className="w-full py-2 px-3 bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 text-slate-950 font-black text-[10px] rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.99]"
                      >
                          {() => (
                              <>
                                <span>{uiText("components_four_by_four_modal.span.spread_target_image_to_4_4_16_panels", "Spread Target Image to 4×4 (16 Panels)")}</span>
                              </>
                            )}
                      </CustomizableButton>

                      {/* Spread Presets */}
                      <div className="space-y-1">
                        <span className="text-[8.5px] text-slate-400 font-semibold block uppercase tracking-wider">
                          {uiText("components_four_by_four_modal.span.preset_panel_groups", "Preset Panel Groups:")}
                        </span>
                        <div className="grid grid-cols-2 gap-1">
                          {SPREAD_PRESETS_4X4.map((p) => (
                            <CustomizableButton
                              buttonId="four_by_four_modal_btn_19"
                              key={p.label}
type="button"
onClick={() => setSpreadSelectedBoxes(p.boxes)}
className={cn(
                                "py-1 px-1.5 rounded-lg text-[8.5px] font-bold border transition-all cursor-pointer text-center",
                                spreadSelectedBoxes.length === p.count &&
                                  spreadSelectedBoxes.every((b) => p.boxes.includes(b))
                                  ? "bg-fuchsia-500 text-slate-950 border-fuchsia-400 font-black"
                                  : "bg-[#0c0419] text-slate-300 hover:text-white border-fuchsia-950"
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

                      {/* FX Filters */}
                      <div className="space-y-1 pt-1 border-t border-fuchsia-950">
                        <span className="text-[8.5px] text-slate-400 font-semibold block uppercase tracking-wider">
                          {uiText("components_four_by_four_modal.span.filter_fx_preset", "Filter / FX Preset:")}
                        </span>
                        <div className="grid grid-cols-4 gap-1">
                          {SPREAD_EFFECTS_4X4.map((fx) => {
                            const FxIcon = fx.icon;
                            const isSelected = spreadEffect === fx.id;
                            return (
                              <CustomizableButton
                                buttonId="four_by_four_modal_btn_18"
                                key={fx.id}
type="button"
onClick={() => setSpreadEffect(fx.id)}
className={cn(
                                  "py-1 px-1 rounded-md text-[8px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1",
                                  isSelected
                                    ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400"
                                    : "bg-[#0b0318] text-slate-400 hover:text-white border-fuchsia-950"
                                )}
                              >
                                  {() => (
                                      <>
                                        <FxIcon className="w-2.5 h-2.5" />
                                      <span className="truncate">{fx.label}</span>
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

                {/* TAB 2: ACTIVE PANEL INSPECTOR */}
                {(activeTab === "inspector" || activeTab === "matrix") && (
                  <div className="space-y-3 animate-in fade-in duration-100">
                    <div className="bg-[#120726] p-3 rounded-2xl border border-fuchsia-500/30 space-y-2.5">
                      <div className="flex items-center justify-between pb-1 border-b border-fuchsia-500/20">
                        <div className="flex items-center gap-1.5">
                          <Settings className="w-4 h-4 text-fuchsia-400" />
                          <span className="text-[10px] font-bold text-fuchsia-300 uppercase tracking-wider">
                            {uiText("components_four_by_four_modal.span.panel_3", "Panel #")}{selectedBoxId}{uiText("components_four_by_four_modal.span.inspector", " Inspector")}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border",
                            selectedBoxId === 1
                              ? "bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500/50"
                              : "bg-slate-900 text-slate-400 border-slate-700"
                          )}
                        >
                          {selectedBoxId === 1 ? "Hero Screen" : `Tile #${selectedBoxId}`}
                        </span>
                      </div>

                      {/* Live Image Preview */}
                      <div className="flex items-center gap-2.5 p-2 bg-[#080212] rounded-xl border border-fuchsia-950">
                        <div className="w-12 h-12 rounded-lg border border-fuchsia-500/40 overflow-hidden shrink-0 bg-slate-900 flex items-center justify-center">
                          {activeDisplayImage ? (
                            <img
                              src={activeDisplayImage}
                              alt={`Panel #${selectedBoxId}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <LayoutGrid className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-slate-200 block truncate">
                            {currentImage ? "Image Loaded" : "Empty Panel"}
                          </span>
                          <span className="text-[8px] text-slate-400 block truncate">
                            {isRotating
                              ? `Rotation Active (${currentRotation.length} frames)`
                              : currentLink.url
                              ? `Link: ${currentLink.url}`
                              : "Click Upload to replace"}
                          </span>
                        </div>
                      </div>

                      {/* Quick Panel Actions */}
                      <div className="grid grid-cols-3 gap-1">
                        <CustomizableButton
                          buttonId="four_by_four_modal_btn_17"
                          defaultIcon={<Upload className="w-3 h-3" />}
                          type="button"
onClick={() => singlePanelFileInputRef.current?.click()}
className="py-1.5 px-2 bg-fuchsia-950 hover:bg-fuchsia-900 border border-fuchsia-500/40 text-fuchsia-200 rounded-lg text-[9px] font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
                        >
                            {() => (
                                <>
                                  <span>{uiText("components_four_by_four_modal.span.upload", "Upload")}</span>
                                </>
                              )}
                        </CustomizableButton>
                        {currentImage && onSendToCarver && (
                          <CustomizableButton
                            buttonId="four_by_four_modal_btn_16"
                            defaultIcon={<Scissors className="w-3 h-3" />}
                            type="button"
onClick={() => {
                              onSendToCarver(currentImage);
                              onClose();
                            }}
className="py-1.5 px-2 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 rounded-lg text-[9px] font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
                          >
                              {() => (
                                  <>
                                    <span>{uiText("components_four_by_four_modal.span.to_carver", "To Carver")}</span>
                                  </>
                                )}
                          </CustomizableButton>
                        )}
                        {currentImage && (
                          <CustomizableButton
                            buttonId="four_by_four_modal_btn_15"
                            defaultIcon={<Trash2 className="w-3 h-3" />}
                            type="button"
onClick={() => {
                              setBoxImages((prev) => ({ ...prev, [selectedBoxId]: "" }));
                              showToast(`✓ Cleared Panel #${selectedBoxId}`);
                            }}
className="py-1.5 px-2 bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-200 rounded-lg text-[9px] font-bold cursor-pointer transition-colors flex items-center justify-center gap-1"
                          >
                              {() => (
                                  <>
                                    <span>{uiText("components_four_by_four_modal.span.clear", "Clear")}</span>
                                  </>
                                )}
                          </CustomizableButton>
                        )}
                      </div>

                      {currentImage && (
                        <CustomizableButton
                          buttonId="four_by_four_modal_btn_14"
                          defaultIcon={<Send className="w-3 h-3 text-fuchsia-300" />}
                          type="button"
onClick={() => handleReplaceSingleFrontPageBox(selectedBoxId)}
className="w-full mt-1.5 py-1.5 px-2 bg-gradient-to-r from-purple-950 to-fuchsia-950 hover:from-purple-900 hover:to-fuchsia-900 border border-fuchsia-500/50 text-fuchsia-200 rounded-lg text-[9px] font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs"
title={`Send & Replace Front Page Box #${selectedBoxId} with this image`}
                        >
                            {() => (
                                <>
                                  <span>{uiText("components_four_by_four_modal.span.send_and_replace_front_page_box", "Send & Replace Front Page Box #")}{selectedBoxId}</span>
                                </>
                              )}
                        </CustomizableButton>
                      )}

                      {/* TileLink Config for active panel */}
                      <div className="space-y-1.5 pt-2 border-t border-fuchsia-950">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-cyan-300">
                          <Link2 className="w-3 h-3" />
                          <span>{uiText("components_four_by_four_modal.span.tilelink_click_action", "TileLink / Click Action:")}</span>
                        </div>
                        <input
                          type="text"
                          placeholder="https://example.com/target"
                          value={currentLink.url || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBoxLinkConfigs((prev) => {
                              const updated = {
                                ...prev,
                                [selectedBoxId]: { ...currentLink, url: val },
                              };
                              try {
                                remoteStore.setItem(STORAGE_KEY_4X4_LINKS, JSON.stringify(updated));
                              } catch {}
                              return updated;
                            });
                          }}
                          className="w-full px-2 py-1 bg-[#070211] border border-cyan-500/40 rounded-lg text-[9px] text-cyan-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      {/* Rotation Series Config for active panel */}
                      <div className="space-y-1.5 pt-2 border-t border-fuchsia-950">
                        <div className="flex items-center justify-between text-[9px] font-bold text-fuchsia-300">
                          <div className="flex items-center gap-1">
                            <RotateCw className="w-3 h-3" />
                            <span>{uiText("components_four_by_four_modal.span.rotation_series", "Rotation Series (")}{currentRotation.length}{uiText("components_four_by_four_modal.span.frames", " frames):")}</span>
                          </div>
                          <CustomizableButton
                            buttonId="four_by_four_modal_btn_13"
                            type="button"
onClick={() => {
                              setBoxRotationActive((prev) => ({
                                ...prev,
                                [selectedBoxId]: !prev[selectedBoxId],
                              }));
                            }}
className={cn(
                              "px-1.5 py-0.5 rounded text-[8px] font-mono font-bold cursor-pointer transition-colors border",
                              boxRotationActive[selectedBoxId]
                                ? "bg-emerald-950 text-emerald-300 border-emerald-500/50"
                                : "bg-slate-900 text-slate-400 border-slate-700"
                            )}
                          >
                              {() => (
                                  <>
                                    {boxRotationActive[selectedBoxId] ? "Active ON" : "Paused OFF"}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>

                        {/* Add frame button */}
                        <div className="flex items-center gap-1">
                          <CustomizableButton
                            buttonId="four_by_four_modal_btn_12"
                            defaultIcon={<Plus className="w-2.5 h-2.5" />}
                            type="button"
onClick={() => rotationFrameFileInputRef.current?.click()}
className="flex-1 py-1 px-2 rounded-lg bg-[#0e041d] hover:bg-fuchsia-950 border border-fuchsia-500/30 text-fuchsia-300 text-[8.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                              {() => (
                                  <>
                                    <span>{uiText("components_four_by_four_modal.span.add_frame_to_series", "Add Frame to Series")}</span>
                                  </>
                                )}
                          </CustomizableButton>
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
                                  if (url) {
                                    setBoxRotationSeries((prev) => {
                                      const updatedList = [...(prev[selectedBoxId] || []), url];
                                      const updated = { ...prev, [selectedBoxId]: updatedList };
                                      try {
                                        remoteStore.setItem(STORAGE_KEY_4X4_ROTATION, JSON.stringify(updated));
                                      } catch {}
                                      return updated;
                                    });
                                    setBoxRotationActive((prev) => ({ ...prev, [selectedBoxId]: true }));
                                    showToast(`✓ Frame added to Panel #${selectedBoxId} series!`);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                              e.target.value = "";
                            }}
                            className="hidden"
                          />
                        </div>

                        {/* Rotation Frame Thumbnails */}
                        {currentRotation.length > 0 && (
                          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[#06020e] rounded-lg border border-fuchsia-950/60 max-w-full">
                            {currentRotation.map((frameUrl, idx) => (
                              <div
                                key={`rot-frame-${idx}`}
                                className="w-7 h-7 rounded border border-fuchsia-500/40 overflow-hidden relative shrink-0 group/frame"
                              >
                                <img src={frameUrl} alt={uiText("components_four_by_four_modal.img.frame.alt", "Frame")} className="w-full h-full object-cover" />
                                <CustomizableButton
                                  buttonId="four_by_four_modal_btn_11"
                                  defaultIcon={<X className="w-2.5 h-2.5" />}
                                  type="button"
onClick={() => {
                                    setBoxRotationSeries((prev) => ({
                                      ...prev,
                                      [selectedBoxId]: prev[selectedBoxId].filter((_, i) => i !== idx),
                                    }));
                                  }}
className="absolute inset-0 bg-rose-950/80 text-rose-300 opacity-0 group-hover/frame:opacity-100 flex items-center justify-center cursor-pointer"
title={uiText("components_four_by_four_modal.button.delete_frame.title", "Delete frame")}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: 4x4 WHOLE PANEL & DIVISIONS STYLES STUDIO */}
                {activeTab === "styles" && (
                  <div className="space-y-3 animate-in fade-in duration-100">
                    <div
                      style={{
                        borderColor: panelStyle.divisionColor,
                        backgroundColor: `${panelStyle.panelBgColor}cc`,
                      }}
                      className="p-3 rounded-2xl border space-y-3 transition-colors"
                    >
                      <div
                        style={{ borderBottomColor: panelStyle.divisionColor }}
                        className="flex items-center justify-between pb-1 border-b"
                      >
                        <div className="flex items-center gap-1.5">
                          <Palette className="w-4 h-4" style={{ color: panelStyle.primaryColor }} />
                          <span
                            style={{ color: panelStyle.textColor }}
                            className="text-[10px] font-bold uppercase tracking-wider"
                          >
                            {uiText("components_four_by_four_modal.span.whole_panel_and_divisions_styles", "Whole Panel & Divisions Styles")}
                          </span>
                        </div>
                        <span
                          style={{
                            color: panelStyle.textColor,
                            borderColor: panelStyle.panelBorderColor,
                            backgroundColor: `${panelStyle.headerBgColor}ee`,
                          }}
                          className="text-[8.5px] font-mono px-2 py-0.5 rounded border"
                        >
                          {uiText("components_four_by_four_modal.span.panel_and_grid_divisions", "Panel & Grid Divisions")}
                        </span>
                      </div>

                      {/* Scope Notice Banner */}
                      <div
                        style={{
                          borderColor: panelStyle.divisionColor,
                          backgroundColor: `${panelStyle.headerBgColor}bb`,
                        }}
                        className="p-2 rounded-xl border text-[9px] leading-relaxed space-y-1"
                      >
                        <span className="font-bold flex items-center gap-1" style={{ color: panelStyle.textColor }}>
                          <SlidersHorizontal className="w-3 h-3" style={{ color: panelStyle.primaryColor }} />
                          {uiText("components_four_by_four_modal.span.scoped_to_whole_panel_and_divisions", "Scoped to Whole Panel & Divisions:")}
                        </span>
                        <p className="text-slate-300 text-[8.5px]">
                          {uiText("components_four_by_four_modal.p.controls_apply_to_the_entire_4_4_panel_itsel", "Controls apply to the entire 4×4 panel itself (frame border, surface tint, glow) and its divisions (grid divider lines between all 16 cells and section separators). Change from purple to any user-defined colors.")}
                        </p>
                      </div>

                      {/* Primary Master Circular Radial Dial Trigger Button */}
                      <div className="pt-0.5 space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: panelStyle.textColor }}>
                          {uiText("components_four_by_four_modal.span.master_color_dial", "Master Color Dial:")}
                        </span>
                        <RadialColorPicker
                          color={panelStyle.primaryColor}
                          onChange={handleMasterDialColor}
                          compactTrigger={false}
                          buttonLabel="Launch Circular Radial Dial (Master Theme)"
                          buttonClassName="w-full py-2 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                          style={{
                            backgroundColor: panelStyle.primaryColor,
                            boxShadow: `0 4px 14px ${panelStyle.glowColor}60`,
                          }}
                        />
                      </div>

                      {/* Channel Dials with Circular Radial Pickers */}
                      <div
                        style={{
                          borderColor: panelStyle.divisionColor,
                          backgroundColor: `${panelStyle.headerBgColor}88`,
                        }}
                        className="p-2.5 rounded-xl border space-y-2"
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: panelStyle.textColor }}>
                          {uiText("components_four_by_four_modal.span.fine_tune_panel_and_division_channels", "Fine-Tune Panel & Division Channels:")}
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {/* Panel Outer Frame Border */}
                          <div
                            style={{
                              borderColor: panelStyle.divisionColor,
                              backgroundColor: `${panelStyle.panelBgColor}bb`,
                            }}
                            className="p-2 rounded-lg border space-y-1"
                          >
                            <div className="flex items-center justify-between text-[9px]">
                              <span className="text-slate-300 font-bold">{uiText("components_four_by_four_modal.span.panel_border", "Panel Border")}</span>
                              <span
                                className="w-3.5 h-3.5 rounded border inline-block shadow-inner"
                                style={{
                                  backgroundColor: panelStyle.panelBorderColor,
                                  borderColor: panelStyle.divisionColor,
                                }}
                              />
                            </div>
                            <RadialColorPicker
                              color={panelStyle.panelBorderColor}
                              onChange={(c) => handleUpdatePanelStyle({ panelBorderColor: c, glowColor: c })}
                              compactTrigger
                              buttonLabel="Dial Border"
                              buttonClassName="w-full py-1 text-slate-200 border rounded text-[8.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              style={{
                                borderColor: panelStyle.divisionColor,
                                backgroundColor: `${panelStyle.headerBgColor}bb`,
                              }}
                            />
                          </div>

                          {/* Grid Divisions / Separator Lines */}
                          <div
                            style={{
                              borderColor: panelStyle.divisionColor,
                              backgroundColor: `${panelStyle.panelBgColor}bb`,
                            }}
                            className="p-2 rounded-lg border space-y-1"
                          >
                            <div className="flex items-center justify-between text-[9px]">
                              <span className="text-slate-300 font-bold">{uiText("components_four_by_four_modal.span.divisions_grid", "Divisions / Grid")}</span>
                              <span
                                className="w-3.5 h-3.5 rounded border inline-block shadow-inner"
                                style={{
                                  backgroundColor: panelStyle.divisionColor,
                                  borderColor: panelStyle.panelBorderColor,
                                }}
                              />
                            </div>
                            <RadialColorPicker
                              color={panelStyle.divisionColor}
                              onChange={(c) => handleUpdatePanelStyle({ divisionColor: c })}
                              compactTrigger
                              buttonLabel="Dial Divisions"
                              buttonClassName="w-full py-1 text-slate-200 border rounded text-[8.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              style={{
                                borderColor: panelStyle.divisionColor,
                                backgroundColor: `${panelStyle.headerBgColor}bb`,
                              }}
                            />
                          </div>

                          {/* Panel Surface / Background Tint */}
                          <div
                            style={{
                              borderColor: panelStyle.divisionColor,
                              backgroundColor: `${panelStyle.panelBgColor}bb`,
                            }}
                            className="p-2 rounded-lg border space-y-1"
                          >
                            <div className="flex items-center justify-between text-[9px]">
                              <span className="text-slate-300 font-bold">{uiText("components_four_by_four_modal.span.surface_tint", "Surface Tint")}</span>
                              <span
                                className="w-3.5 h-3.5 rounded border inline-block shadow-inner"
                                style={{
                                  backgroundColor: panelStyle.panelBgColor,
                                  borderColor: panelStyle.divisionColor,
                                }}
                              />
                            </div>
                            <RadialColorPicker
                              color={panelStyle.panelBgColor}
                              onChange={(c) => handleUpdatePanelStyle({ panelBgColor: c })}
                              compactTrigger
                              buttonLabel="Dial Surface"
                              buttonClassName="w-full py-1 text-slate-200 border rounded text-[8.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              style={{
                                borderColor: panelStyle.divisionColor,
                                backgroundColor: `${panelStyle.headerBgColor}bb`,
                              }}
                            />
                          </div>

                          {/* Header & Text Accent */}
                          <div
                            style={{
                              borderColor: panelStyle.divisionColor,
                              backgroundColor: `${panelStyle.panelBgColor}bb`,
                            }}
                            className="p-2 rounded-lg border space-y-1"
                          >
                            <div className="flex items-center justify-between text-[9px]">
                              <span className="text-slate-300 font-bold">{uiText("components_four_by_four_modal.span.text_accent", "Text / Accent")}</span>
                              <span
                                className="w-3.5 h-3.5 rounded border inline-block shadow-inner"
                                style={{
                                  backgroundColor: panelStyle.textColor,
                                  borderColor: panelStyle.divisionColor,
                                }}
                              />
                            </div>
                            <RadialColorPicker
                              color={panelStyle.textColor}
                              onChange={(c) => handleUpdatePanelStyle({ textColor: c })}
                              compactTrigger
                              buttonLabel="Dial Text"
                              buttonClassName="w-full py-1 text-slate-200 border rounded text-[8.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              style={{
                                borderColor: panelStyle.divisionColor,
                                backgroundColor: `${panelStyle.headerBgColor}bb`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Grid Division Line Controls (Width & Style) */}
                      <div
                        style={{
                          borderColor: panelStyle.divisionColor,
                          backgroundColor: `${panelStyle.headerBgColor}88`,
                        }}
                        className="p-2.5 rounded-xl border space-y-2"
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: panelStyle.textColor }}>
                          {uiText("components_four_by_four_modal.span.division_lines_thickness_and_style", "Division Lines Thickness & Style:")}
                        </span>

                        {/* Division Thickness */}
                        <div className="space-y-1">
                          <span className="text-[8.5px] text-slate-300 font-medium block">
                            {uiText("components_four_by_four_modal.span.thickness_dividers_between_16_cells", "Thickness (Dividers between 16 cells):")}
                          </span>
                          <div className="grid grid-cols-4 gap-1">
                            {[
                              { w: 1, label: "1px Hair" },
                              { w: 2, label: "2px Solid" },
                              { w: 3, label: "3px Bold" },
                              { w: 4, label: "4px Thick" },
                            ].map((item) => (
                              <CustomizableButton
                                buttonId="four_by_four_modal_btn_10"
                                key={item.w}
type="button"
onClick={() => handleUpdatePanelStyle({ divisionWidth: item.w })}
style={
                                  panelStyle.divisionWidth === item.w
                                    ? {
                                        backgroundColor: panelStyle.primaryColor,
                                        color: "#020617",
                                        borderColor: panelStyle.panelBorderColor,
                                      }
                                    : {
                                        borderColor: panelStyle.divisionColor,
                                        backgroundColor: `${panelStyle.panelBgColor}cc`,
                                      }
                                }
className="py-1 px-1.5 rounded text-[8.5px] font-bold border cursor-pointer transition-colors text-center"
                              >
                                  {() => (
                                      <>
                                        {item.label}
                                      </>
                                    )}
                              </CustomizableButton>
                            ))}
                          </div>
                        </div>

                        {/* Division Border Style */}
                        <div className="space-y-1 pt-1">
                          <span className="text-[8.5px] text-slate-300 font-medium block">
                            {uiText("components_four_by_four_modal.span.division_line_style", "Division Line Style:")}
                          </span>
                          <div className="grid grid-cols-4 gap-1">
                            {(["solid", "dashed", "glow", "double"] as const).map((sty) => (
                              <CustomizableButton
                                buttonId="four_by_four_modal_btn_9"
                                key={sty}
type="button"
onClick={() => handleUpdatePanelStyle({ divisionStyle: sty })}
style={
                                  panelStyle.divisionStyle === sty
                                    ? {
                                        backgroundColor: panelStyle.primaryColor,
                                        color: "#020617",
                                        borderColor: panelStyle.panelBorderColor,
                                      }
                                    : {
                                        borderColor: panelStyle.divisionColor,
                                        backgroundColor: `${panelStyle.panelBgColor}cc`,
                                      }
                                }
className="py-1 px-1.5 rounded text-[8.5px] font-bold border capitalize cursor-pointer transition-colors text-center"
                              >
                                  {() => (
                                      <>
                                        {sty}
                                      </>
                                    )}
                              </CustomizableButton>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Quick Colorway Presets */}
                      <div
                        style={{ borderTopColor: panelStyle.divisionColor }}
                        className="space-y-1.5 pt-1 border-t"
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: panelStyle.textColor }}>
                          {uiText("components_four_by_four_modal.span.curated_palette_presets", "Curated Palette Presets:")}
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {PRESET_COLORWAYS_4X4.map((cw) => (
                            <CustomizableButton
                              buttonId="four_by_four_modal_btn_8"
                              key={cw.name}
type="button"
onClick={() => {
                                handleUpdatePanelStyle(cw.style);
                                showToast(`✓ Applied ${cw.name} to whole panel & divisions!`);
                              }}
style={{
                                borderColor: panelStyle.divisionColor,
                                backgroundColor: `${panelStyle.panelBgColor}bb`,
                              }}
className="px-2 py-1.5 rounded-lg border hover:brightness-125 flex items-center gap-1.5 cursor-pointer text-left transition-all"
                            >
                                {() => (
                                    <>
                                      <span
                                className="w-3 h-3 rounded-full shrink-0 shadow-xs border border-white/30"
                                style={{ backgroundColor: cw.style.primaryColor }}
                              />
                                    <span className="text-[8.5px] font-bold text-slate-200 truncate">{cw.name}</span>
                                    </>
                                  )}
                            </CustomizableButton>
                          ))}
                        </div>
                      </div>

                      {/* Reset to Default Purple */}
                      <div
                        style={{ borderTopColor: panelStyle.divisionColor }}
                        className="pt-1 border-t"
                      >
                        <CustomizableButton
                          buttonId="four_by_four_modal_btn_7"
                          type="button"
onClick={() => {
                            handleUpdatePanelStyle(DEFAULT_4X4_PANEL_STYLE);
                            showToast("✓ Restored default Purple style for whole panel & divisions!");
                          }}
style={{
                            borderColor: panelStyle.divisionColor,
                          }}
className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[9px] font-bold border cursor-pointer transition-colors text-center"
                        >
                            {() => (
                                <>
                                  {uiText("components_four_by_four_modal.button.reset_to_baseline_purple_default", "Reset to Baseline Purple Default")}
                                </>
                              )}
                        </CustomizableButton>
                      </div>

                      {/* Return to 3x3 layout card */}
                      <div className="bg-[#061725] p-2.5 rounded-xl border border-cyan-800/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[9px] font-bold text-cyan-300">
                            <Grid3x3 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{uiText("components_four_by_four_modal.span.front_page_advert_layout", "Front Page Advert Layout:")}</span>
                          </div>
                          <span className="text-[8px] font-mono font-bold text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-600/40">
                            {uiText("components_four_by_four_modal.span.mode", "Mode: ")}{frontPageGridMode.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[8.5px] text-slate-300">
                          {uiText("components_four_by_four_modal.p.toggle_between_the_16_panel_4_4_and_original", "Toggle between the 16-Panel (4×4) and original 9-Panel (3×3) front page advert layouts anytime.")}
                        </p>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <CustomizableButton
                            buttonId="four_by_four_modal_btn_6"
                            defaultIcon={<Grid3x3 className="w-3 h-3 text-cyan-400" />}
                            type="button"
onClick={() => {
                              if (onToggleFrontPageGridMode) {
                                onToggleFrontPageGridMode("3x3");
                              }
                              showToast("✓ Returned Front Page to 9-Panel (3×3) layout!");
                            }}
className="flex-1 py-1 px-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 text-[9px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                          >
                              {() => (
                                  <>
                                    <span>{uiText("components_four_by_four_modal.span.return_to_3_3_9_panels", "Return to 3×3 (9 Panels)")}</span>
                                  </>
                                )}
                          </CustomizableButton>
                          <CustomizableButton
                            buttonId="four_by_four_modal_btn_5"
                            defaultIcon={<Grid className="w-3 h-3 text-fuchsia-400" />}
                            type="button"
onClick={() => {
                              if (onToggleFrontPageGridMode) {
                                onToggleFrontPageGridMode("4x4");
                              }
                              showToast("✓ Switched Front Page to 16-Panel (4×4) layout!");
                            }}
className="flex-1 py-1 px-2 rounded-lg bg-fuchsia-950 hover:bg-fuchsia-900 border border-fuchsia-500/60 text-fuchsia-200 text-[9px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                          >
                              {() => (
                                  <>
                                    <span>{uiText("components_four_by_four_modal.span.switch_to_4_4_16_panels", "Switch to 4×4 (16 Panels)")}</span>
                                  </>
                                )}
                          </CustomizableButton>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: BATCH & EXPORT */}
                {activeTab === "batch" && (
                  <div className="space-y-3 animate-in fade-in duration-100">
                    <div className="bg-[#120726] p-3 rounded-2xl border border-fuchsia-500/30 space-y-2.5">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-fuchsia-500/20">
                        <Layers className="w-4 h-4 text-fuchsia-400" />
                        <span className="text-[10px] font-bold text-fuchsia-300 uppercase tracking-wider">
                          {uiText("components_four_by_four_modal.span.batch_operations_and_export", "Batch Operations & Export")}
                        </span>
                      </div>

                      {/* Send and Replace Front Page Advert Grid with 4x4 */}
                      <CustomizableButton
                        buttonId="four_by_four_modal_btn_4"
                        defaultIcon={<Send className="w-3.5 h-3.5 text-white" />}
                        type="button"
onClick={handleReplaceFrontPageWith4x4}
className="w-full py-2.5 px-3 bg-gradient-to-r from-fuchsia-600 via-pink-600 to-fuchsia-600 hover:from-fuchsia-500 hover:to-pink-500 border border-fuchsia-400 text-white font-black text-[11px] rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
title={uiText("components_four_by_four_modal.button.send_and_replace_front_page_advert_grid_with.title_2", "Send and Replace Front Page Advert Grid with 4x4 (16 Panels)")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_four_by_four_modal.span.send_and_replace_front_page_4_4", "Send & Replace Front Page (4×4)")}</span>
                              </>
                            )}
                      </CustomizableButton>

                      {/* Send all to Storyboard */}
                      <CustomizableButton
                        buttonId="four_by_four_modal_btn_3"
                        defaultIcon={<Send className="w-3.5 h-3.5 text-indigo-400" />}
                        type="button"
onClick={() => handleSendAllToStoryboard(true)}
className="w-full py-2 px-3 bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-200 font-bold text-[10px] rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                      >
                          {() => (
                              <>
                                <span>{uiText("components_four_by_four_modal.span.send_all_16_panels_to_storyboard", "Send All 16 Panels to Storyboard")}</span>
                              </>
                            )}
                      </CustomizableButton>

                      {/* Export all 16 as ZIP */}
                      <CustomizableButton
                        buttonId="four_by_four_modal_btn_2"
                        defaultIcon={<Download className="w-3.5 h-3.5 text-emerald-400" />}
                        type="button"
onClick={handleExportZip}
className="w-full py-2 px-3 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 font-bold text-[10px] rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                      >
                          {() => (
                              <>
                                <span>{uiText("components_four_by_four_modal.span.export_4_4_16_panels_as_zip", "Export 4×4 (16 Panels) as ZIP")}</span>
                              </>
                            )}
                      </CustomizableButton>

                      {/* Apply to Main Front Page 3x3 */}
                      <CustomizableButton
                        buttonId="four_by_four_modal_btn_1"
                        defaultIcon={<Grid3x3 className="w-3.5 h-3.5 text-purple-400" />}
                        type="button"
onClick={handleApplyToFrontPage3x3}
className="w-full py-2 px-3 bg-purple-950/90 hover:bg-purple-900 border border-purple-500/50 text-purple-200 font-bold text-[10px] rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                      >
                          {() => (
                              <>
                                <span>{uiText("components_four_by_four_modal.span.apply_top_9_panels_to_main_front_page_3_3", "Apply Top 9 Panels to Main Front Page (3×3)")}</span>
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom footer bar */}
              <div className="p-2.5 bg-[#0e051f] border-t border-fuchsia-950 flex items-center justify-between text-[9px] text-slate-400 shrink-0">
                <span>{uiText("components_four_by_four_modal.span.seqcarver_4_4_matrix_studio", "SeqCarver 4×4 Matrix Studio")}</span>
                <span className="font-mono text-fuchsia-400">{uiText("components_four_by_four_modal.span.16_panel_grid_ready", "16-Panel Grid Ready")}</span>
              </div>
            </div>
          </div>

          {/* Draggable bottom-right resize grip handle */}
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-fuchsia-500/60 hover:text-fuchsia-300 z-50 select-none"
            title={uiText("components_four_by_four_modal.div.drag_to_resize_window.title", "Drag to resize window")}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15l-6 6M21 8l-13 13" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
};
