// UTF-8: ✓ SeqCarver Studio
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import eurospectImg from "./assets/images/eurospect_header_1786007763255.jpg";
import { DEFAULT_USER_DEFINED_IMAGE_PATH } from "./types/userDefinedImage";

export const DEFAULT_FRONT_PAGE_IMAGE = DEFAULT_USER_DEFINED_IMAGE_PATH;
import ReactCrop, { type Crop } from "react-image-crop";
import { motion, AnimatePresence } from "motion/react";
import "react-image-crop/dist/ReactCrop.css";
import {
  Upload,
  Crop as CropIcon,
  Grid,
  Download,
  Settings,
  Check,
  Image as ImageIcon,
  Archive,
  GripHorizontal,
  GripVertical,
  Move,
  LayoutGrid,
  Trash2,
  Plus,
  Minus,
  RefreshCw,
  FileJson,
  CheckSquare,
  Square,
  Circle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Palette,
  Disc,
  Cpu,
  Info,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowLeftRight,
  Maximize2,
  Minimize2,
  Search,
  Scissors,
  Split,
  Hand,
  AlignCenter,
  PanelLeftClose,
  PanelLeftOpen,
  Tag,
  Columns,
  List,
  ListOrdered,
  Film,
  MessageSquare,
  Type,
  FileText,
  Link,
  Unlink,
  Clapperboard,
  Youtube,
  RotateCcw,
  RotateCw,
  Undo2,
  Redo2,
  History,
  Play,
  Pause,
  Clock,
  Repeat,
  ImagePlus,
  Eye,
  EyeOff,
  LayoutList,
  Columns3,
  Rows3,
  SlidersHorizontal,
  Zap,
  Globe,
  Link2,
  Menu,
  X,
  Grid3x3,
  Star,
  Layers,
  CheckCircle2,
  SquareArrowRight,
  Bookmark,
  FileDown,
  Lock,
  Unlock,
  Eraser,
  ZoomIn,
  ZoomOut,
  Scan,
  Monitor,
  Scaling,
  ScrollText,
  Copy,
  CopyPlus,
  Send,
  Combine,
  PenTool,
  Triangle,
  MousePointer,
  Ruler,
  Camera,
  Database,
  Signpost,
  ReplaceAll,
  Wrench,
} from "lucide-react";
import { cn } from "./utils/cn";
import {
  getStoredDefaultImage,
  saveStoredDefaultImage,
  clearStoredDefaultImage,
  getUserDefinedMasterImage,
  saveUserDefinedMasterImage,
  getStoredJson,
  saveStoredJson,
  clearStoredJson,
  clearAllStoredState,
} from "./utils/idbStorage";
import {
  getCroppedImg,
  sliceImage,
  autoDetectBorders,
  getGridCellSequence,
  trimAlphaPadding,
  type NumberingOrigin,
  type NumberingFlow,
  type NamingStyle,
} from "./utils/imageUtils";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import { exportStoryboardSlicesToPsd, PsdExportSliceItem } from "./utils/psdExportImport";
import { ExpandViewModal } from "./components/ExpandViewModal";
import { BulkRenamePanel } from "./components/BulkRenamePanel";
import { BulkRenameModal } from "./components/BulkRenameModal";
import { HoldButton } from "./components/HoldButton";
import { FramePlayerModal } from "./components/FramePlayerModal";
import { Neo1StudioModal } from "./components/Neo1StudioModal";
import { Bubba1StudioModal } from "./components/Bubba1StudioModal";
import { StoryboardOperationsModal } from "./components/StoryboardOperationsModal";
import { ShapeStudioModal } from "./components/ShapeStudioModal";
import { ShapeStudioIcon } from "./components/ShapeStudioIcon";
import { ImageSharpenerModal } from "./components/ImageSharpenerModal";
import { ResampleStudioModal } from "./components/ResampleStudioModal";
import { VariationsStudioModal } from "./components/VariationsStudioModal";
import { ZoomImageStudioModal } from "./components/ZoomImageStudioModal";
import { AniComposerModal } from "./components/AniComposerModal";
import { TraceStudioModal } from "./components/TraceStudioModal";
import { ParallaxStudioModal } from "./components/ParallaxStudioModal";
import { SmartContourAutoSlicerModal } from "./components/SmartContourAutoSlicerModal";
import { ShortcutManagerModal, DEFAULT_SHORTCUTS, SHORTCUTS_STORAGE_KEY, type ShortcutBinding } from "./components/ShortcutManagerModal";
import {
  type GridLabelPreset,
  GRID_LABEL_PRESETS,
  getSegmentPresetLabel,
} from "./utils/gridLabelPresets";
import { CanvasHistoryVisualizer } from "./components/CanvasHistoryVisualizer";
import { ImgDescStudioModal } from "./components/ImgDescStudioModal";
import { ScreenplayWriter, type Slide } from "./components/ScreenplayWriter";
import { RotationSeriesModal } from "./components/RotationSeriesModal";
import { CustomSpreadModal } from "./components/CustomSpreadModal";
import { TileLinkModal, type TileLinkConfig } from "./components/TileLinkModal";
import { ControlDeckModal } from "./components/ControlDeckModal";
import {
  createSequencerPanelState,
  getSequencerRuntimeStyle,
  type SequencerPanelState,
} from "./components/SequencerPanel";
import { ZipNameModal } from "./components/ZipNameModal";
import { ExportJsonModal } from "./components/ExportJsonModal";
import { AppLogModal } from "./components/AppLogModal";
import { CustomLayoutPresetsModal } from "./components/CustomLayoutPresetsModal";
import { CustomizableButton } from "./components/CustomizableButton";
import { CustomizableLabel } from "./components/CustomizableLabel";
import { CustomizableLogo } from "./components/CustomizableLogo";
import { CustomizableContainer } from "./components/CustomizableContainer";
import { ButtonContextMenu } from "./components/ButtonContextMenu";
import { ButtonCustomizationModal } from "./components/ButtonCustomizationModal";
import { IbcInspectorOverlay } from "./components/IbcInspectorOverlay";
import { DialControl, RotaryDialKnob } from "./components/DialControl";
import { RadialColorPicker } from "./components/RadialColorPicker";
import { useButtonCustomization } from "./context/ButtonCustomizationContext";
import { HARDCODED_DEFAULT_PANEL_CONTROLS_ORDER } from "./types/hardcodedDefaultConfig";
import {
  CropMeshOverlay,
  type MeshBounds,
  type FreestyleSquare,
  type FreestylePoint,
  MESH_COLOR_PRESETS,
  MESH_LINE_WIDTHS,
  TRAPEZE_PRESETS,
} from "./components/CropMeshOverlay";
import { CreativeStudioMenu } from "./components/CreativeStudioMenu";
import { TxtStudioModal } from "./components/TxtStudioModal";
import { AdvModal } from "./components/AdvModal";
import { UtilityModal } from "./components/UtilityModal";
import type { NamedWorkspaceSnapshot } from "./types/namedWorkspace";
import { CloudConfigEditorModal } from "./components/CloudConfigEditorModal";
import { AutoSliceModal } from "./components/AutoSliceModal";
import { SmartTrimModal, type TrimTargetItem } from "./components/SmartTrimModal";
import { MesshiStudioModal } from "./components/MesshiStudioModal";
import { KrumsStudioModal } from "./components/KrumsStudioModal";
import { GridMeshStudioModal } from "./components/GridMeshStudioModal";
import { JoinImagesModal } from "./components/JoinImagesModal";
import { MouseOverStudioModal } from "./components/MouseOverStudioModal";
import { MesshiIcon } from "./components/MesshiIcon";
import { CropSidebar } from "./components/CropSidebar";
import { FullScreenCropControlPanel } from "./components/FullScreenCropControlPanel";
import { AdvertPanelFullScreenModal } from "./components/AdvertPanelFullScreenModal";
import {
  FourByFourModal,
  type FourByFourWholePanelStyle,
  DEFAULT_4X4_PANEL_STYLE,
  generateHarmonicPanelStyle,
} from "./components/FourByFourModal";
import { SplitsPreviewDock } from "./components/SplitsPreviewDock";
import type { DetectedSpriteBox, TrimResult } from "./utils/imageUtils";
import {
  bulkAnalyzeSlices,
  sortSlicesByMode,
  groupSlicesByMode,
  type SortMode,
  type GroupMode,
  type SliceAssetMetadata,
} from "./utils/storyboardAssetSorter";
import {
  StoryboardAssetSorterBar,
  SliceAssetBadge,
} from "./components/StoryboardAssetSorterBar";
import { uiText } from "./hooks/useUIConfig";
import { remoteStore } from "./services/remoteKeyValueStore";

export const STORYBOARD_DEFAULT_STATE_KEY = "seqcarver_storyboard_default_state_v1";

export interface StoryboardDefaultState {
  slots: Array<{ url: string | null; name: string; story: string; title?: string }>;
  slices: Array<{ name: string; url: string }>;
  cellMode: "image-only" | "image-name" | "image-name-story" | "full";
  layout: "grid9" | "list-dynamic" | "strip";
  slotSize: "sm" | "md" | "lg";
  isReverseInsert: boolean;
  storyboardDropAction: string;
  carvedSlicesBgColor: string;
  carvedSlicesExpandedCols: number;
  isStoryboardLocked: boolean;
  isStoryboardVisible: boolean;
  stripBackground?: string;
  stripPanelBackground?: string;
  showSlotHeaders?: boolean;
  storyboardToolbarOrder?: string[];
  buttonCustomizations?: Record<string, any>;
  globalTheme?: any;
  activeSortMode?: SortMode;
  activeGroupMode?: GroupMode;
  selectedGroupFilter?: string | null;
  autoSortOnImport?: boolean;
  isExportBarCompact?: boolean;
  lastSavedAt?: string;
}

export const CROP_DEFAULT_STATE_KEY = "seqcarver_crop_default_state_v1";

export interface CropDefaultSetup {
  panelsOrder: string[];
  quickToolsOrder: string[];
  sbFrameOrder: string[];
  aspectOrder: string[];
  primaryOrder: string[];
  utilityOrder: string[];
  shapeStudioOrder: string[];
  multiCropBatchOrder: string[];
  aspect?: number | "circle" | "oval";
  isCircularCrop?: boolean;
  meshSquareSize?: number;
  meshMode?: "uniform" | "freestyle";
  meshGridLineColor?: string;
  meshGridLineWidth?: number;
  meshAutoGotoAfterCut?: boolean;
  meshDestination?: "storyboard-slices" | "storyboard-slots" | "multi-crops";
  savedAt?: string;
}

export const BASELINE_CROP_DEFAULT_SETUP: CropDefaultSetup = {
  panelsOrder: ["quick_tools", "sb_frame", "crop_area", "multi_crops"],
  quickToolsOrder: ["crop_auto_slice", "crop_smart_trim"],
  sbFrameOrder: ["crop_sb_frame_prev", "crop_sb_frame_counter", "crop_sb_frame_next", "crop_sb_frame_delete"],
  aspectOrder: [
    "crop_aspect_free",
    "crop_aspect_1_1",
    "crop_aspect_16_9",
    "crop_aspect_9_16",
    "crop_aspect_4_3",
    "crop_aspect_3_2",
    "crop_aspect_circle",
    "crop_aspect_oval",
  ],
  primaryOrder: ["crop_2canvas", "crop_and_go", "crop_2sbrd", "crop_replace_sbrd"],
  utilityOrder: [
    "crop_select_all",
    "crop_undo",
    "crop_redo",
    "crop_revert",
    "multiCropAdd",
    "crop_mesh_tool",
    "join_images_tool",
    "messhi_grid_tool",
    "krums_loader_tool",
  ],
  shapeStudioOrder: ["crop_ss_send_direct", "crop_ss_apply_back", "crop_ss_cancel_back"],
  multiCropBatchOrder: ["multiCropSendAllGrid", "multiCropToSlices", "multiCropStayInCrop"],
  aspect: undefined,
  isCircularCrop: false,
  meshSquareSize: 64,
  meshMode: "uniform",
  meshGridLineColor: "#10b981",
  meshGridLineWidth: 2,
  meshAutoGotoAfterCut: false,
  meshDestination: "storyboard-slices",
};

export function getLoadedCropDefaultSetup(): CropDefaultSetup {
  try {
    const raw = remoteStore.getItem(CROP_DEFAULT_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...BASELINE_CROP_DEFAULT_SETUP,
        ...parsed,
        panelsOrder: Array.isArray(parsed.panelsOrder) && parsed.panelsOrder.length > 0 ? parsed.panelsOrder : BASELINE_CROP_DEFAULT_SETUP.panelsOrder,
        quickToolsOrder: Array.isArray(parsed.quickToolsOrder) && parsed.quickToolsOrder.length > 0 ? parsed.quickToolsOrder : BASELINE_CROP_DEFAULT_SETUP.quickToolsOrder,
        sbFrameOrder: Array.isArray(parsed.sbFrameOrder) && parsed.sbFrameOrder.length > 0 ? parsed.sbFrameOrder : BASELINE_CROP_DEFAULT_SETUP.sbFrameOrder,
        aspectOrder: Array.isArray(parsed.aspectOrder) && parsed.aspectOrder.length > 0 ? parsed.aspectOrder : BASELINE_CROP_DEFAULT_SETUP.aspectOrder,
        primaryOrder: Array.isArray(parsed.primaryOrder) && parsed.primaryOrder.length > 0 ? parsed.primaryOrder : BASELINE_CROP_DEFAULT_SETUP.primaryOrder,
        utilityOrder: Array.isArray(parsed.utilityOrder) && parsed.utilityOrder.length > 0 ? parsed.utilityOrder : BASELINE_CROP_DEFAULT_SETUP.utilityOrder,
        shapeStudioOrder: Array.isArray(parsed.shapeStudioOrder) && parsed.shapeStudioOrder.length > 0 ? parsed.shapeStudioOrder : BASELINE_CROP_DEFAULT_SETUP.shapeStudioOrder,
        multiCropBatchOrder: Array.isArray(parsed.multiCropBatchOrder) && parsed.multiCropBatchOrder.length > 0 ? parsed.multiCropBatchOrder : BASELINE_CROP_DEFAULT_SETUP.multiCropBatchOrder,
      };
    }
  } catch {}
  return BASELINE_CROP_DEFAULT_SETUP;
}

type Mode = "crop" | "carve" | "storyboard";
type SlotSize = "sm" | "md" | "lg";

const CARVED_SLICES_BG_PRESETS = [
  { id: "slate", name: "Slate Dark (Default)", bg: "#0f172a", cardBg: "#020617", border: "#1e293b", text: "#94a3b8" },
  { id: "midnight", name: "Midnight Navy", bg: "#081b33", cardBg: "#030e1c", border: "#103c6e", text: "#60a5fa" },
  { id: "emerald", name: "Forest Emerald", bg: "#062c22", cardBg: "#021712", border: "#0e5944", text: "#34d399" },
  { id: "indigo", name: "Deep Indigo", bg: "#191036", cardBg: "#0b071a", border: "#3b2678", text: "#a78bfa" },
  { id: "charcoal", name: "Rich Charcoal", bg: "#18181b", cardBg: "#09090b", border: "#27272a", text: "#a1a1aa" },
  { id: "bronze", name: "Warm Bronze / Umber", bg: "#24180c", cardBg: "#120c06", border: "#4a331a", text: "#fbbf24" },
  { id: "plum", name: "Deep Plum / Wine", bg: "#2c0926", cardBg: "#140411", border: "#5c1950", text: "#f472b6" },
  { id: "cyber", name: "Cyber Teal", bg: "#042226", cardBg: "#011114", border: "#0b464f", text: "#2dd4bf" },
  { id: "obsidian", name: "Pitch Obsidian", bg: "#020617", cardBg: "#000000", border: "#1e293b", text: "#64748b" },
];

/**
 * Convert a data URL into the raw bytes that JSZip's `base64: true` option
 * expects. Strips "data:<mime>;base64," prefix and any embedded whitespace.
 */
function dataUrlToBase64(dataUrl: string): string {
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) return dataUrl;
  return dataUrl.substring(commaIdx + 1).replace(/\s+/g, "");
}

function safeDataUrlToBlob(dataUrl: string, fallbackType: string = "image/jpeg"): Blob {
  try {
    const base64Data = dataUrlToBase64(dataUrl);
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: fallbackType });
  } catch (err) {
    console.warn("Failed to convert data URL to blob:", err);
    return new Blob([], { type: fallbackType });
  }
}

/**
 * Helper to download a blob, featuring robust fallback if file-saver fails
 * in restrictive iframe or sandbox settings.
 */
function downloadBlob(blob: Blob, filename: string) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
  } catch (err) {
    console.warn("Native a.click download failed, trying FileSaver saveAs:", err);
    try {
      saveAs(blob, filename);
    } catch (saveErr) {
      console.error("All download methods failed:", saveErr);
    }
  }
}

/**
 * Helper to prompt directory/location picker or fallback to downloadBlob
 */
async function saveZipToFolder(blob: Blob, filename: string): Promise<boolean> {
  if (typeof window !== "undefined" && "showDirectoryPicker" in window) {
    try {
      const dirHandle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
      if (dirHandle) {
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      }
    } catch (err: any) {
      if (err.name === "AbortError") return false;
      console.warn("showDirectoryPicker unavailable or blocked:", err);
    }
  }

  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: "ZIP Archive",
            accept: { "application/zip": [".zip"] },
          },
        ],
      });
      if (handle) {
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      }
    } catch (err: any) {
      if (err.name === "AbortError") return false;
      console.warn("showSaveFilePicker unavailable or blocked:", err);
    }
  }

  downloadBlob(blob, filename);
  return true;
}

/**
 * Converts image URL into base64 JPEG data URL for PDF generation
 */
async function getImageDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:image/")) return url;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width || 400;
      canvas.height = img.naturalHeight || img.height || 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } else {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

/**
 * Resolves clean, exact filename for sliced/storyboard assets,
 * strictly respecting user renames from Bulk Rename Studio / Panel.
 */
function getFormattedFilename(
  rawName: string | undefined,
  defaultIndex: number,
  fallbackExt: string,
  filePrefix?: string
): string {
  let clean = (rawName || "").trim();
  if (!clean) {
    clean = `frame-${defaultIndex + 1}`;
  }

  // Remove illegal OS characters but preserve dots, spaces, dashes, underscores, case
  clean = clean.replace(/[/\\?%*:|"<>]/g, "_").trim();

  // Check if clean already has a valid image file extension
  const hasExt = /\.(png|jpg|jpeg|webp|svg|bmp|gif)$/i.test(clean);
  let filename = hasExt ? clean : `${clean}.${fallbackExt}`;

  // Prepend filePrefix if set and not already present
  if (filePrefix && filePrefix.trim()) {
    const cleanPrefix = filePrefix.trim().replace(/-+$/, "");
    if (cleanPrefix) {
      const lowerFile = filename.toLowerCase();
      const lowerPfx = cleanPrefix.toLowerCase();
      if (!lowerFile.startsWith(lowerPfx) && !lowerFile.startsWith(`${lowerPfx}-`)) {
        filename = `${cleanPrefix}-${filename.replace(/^-+/, "")}`;
      }
    }
  }

  // Sanitize any accidental double dashes like "prefix--name" -> "prefix-name"
  filename = filename.replace(/^([a-zA-Z0-9_]+)--+/g, "$1-");

  return filename;
}

export default function App() {
  const {
    openStudioModal,
    openMiniCustomizer,
    stripBackground,
    setStripBackground,
    stripImageBackground,
    setStripImageBackground,
    stripPanelBackground,
    setStripPanelBackground,
    showSlotHeaders,
    toggleSlotHeaders,
    customConfigs,
    importConfigs,
    exportConfigs,
    setSlotHeaders,
    resetToFactoryDefaults,
    saveCurrentAsDefault,
    isDatabaseConnected,
    isDatabaseSyncing,
    currentUser,
    restoreFullDefaultsFromDatabase,
    isLiveCloudEditorOpen,
    openLiveCloudEditor,
    closeLiveCloudEditor,
    isIbcInspectorActive,
    toggleIbcInspector,
    panelControlsOrder,
    setPanelControlsOrder,
    headerItemsOrder,
    setHeaderItemsOrder,
  } = useButtonCustomization();
  const [imageSrc, setImageSrc] = useState<string>("");
  const [mode, setMode] = useState<Mode>("crop");
  const [slicePrefix, setSlicePrefix] = useState<string>("");
  // User-defined default master image for panels (survives reloads)
  const [userDefault3x3Image, setUserDefault3x3Image] = useState<string>(() => {
    try {
      const stored =
        remoteStore.getItem("seqcarver_user_defined_master_image") ||
        remoteStore.getItem("seqcarver_user_default_3x3_image") ||
        remoteStore.getItem("seqcarver_originalSpreadImage");
      if (stored && !stored.includes("source-01.jpg") && !stored.includes("eurospect_header")) {
        return stored;
      }
      return DEFAULT_FRONT_PAGE_IMAGE;
    } catch {
      return DEFAULT_FRONT_PAGE_IMAGE;
    }
  });

  const [defaultBoxImages, setDefaultBoxImages] = useState<Record<number, string>>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_json_defaultBoxImages");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && Object.values(parsed).some(Boolean)) {
          return parsed;
        }
      }
      const uDef = remoteStore.getItem("seqcarver_user_defined_master_image") || remoteStore.getItem("seqcarver_user_default_3x3_image");
      if (uDef && !uDef.includes("source-01.jpg") && !uDef.includes("eurospect_header")) return { 1: uDef };
      const b1 = remoteStore.getItem("seqcarver_defaultBox1Image");
      if (b1 && !b1.includes("source-01.jpg") && !b1.includes("eurospect_header")) return { 1: b1 };
      const spread = remoteStore.getItem("seqcarver_originalSpreadImage");
      if (spread && !spread.includes("source-01.jpg") && !spread.includes("eurospect_header")) return { 1: spread };
      return { 1: DEFAULT_FRONT_PAGE_IMAGE };
    } catch {
      return { 1: DEFAULT_FRONT_PAGE_IMAGE };
    }
  });

  const [boxImages, setBoxImages] = useState<Record<number, string>>(() => {
    const defaults: Record<number, string> = {};
    for (let i = 1; i <= 16; i++) defaults[i] = "";
    defaults[1] = DEFAULT_FRONT_PAGE_IMAGE;
    try {
      const stored = remoteStore.getItem("seqcarver_json_boxImages") || remoteStore.getItem("seqcarver_json_defaultBoxImages");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && Object.values(parsed).some(Boolean)) {
          return { ...defaults, ...parsed };
        }
      }
      const uDef = remoteStore.getItem("seqcarver_user_defined_master_image") || remoteStore.getItem("seqcarver_user_default_3x3_image");
      if (uDef && !uDef.includes("source-01.jpg") && !uDef.includes("eurospect_header")) {
        return { ...defaults, 1: uDef };
      }
      const b1 = remoteStore.getItem("seqcarver_defaultBox1Image");
      if (b1 && !b1.includes("source-01.jpg") && !b1.includes("eurospect_header")) {
        return { ...defaults, 1: b1 };
      }
      const spread = remoteStore.getItem("seqcarver_originalSpreadImage");
      if (spread && !spread.includes("source-01.jpg") && !spread.includes("eurospect_header")) {
        return { ...defaults, 1: spread };
      }
      return defaults;
    } catch {
      return defaults;
    }
  });

  // Target master original image for spreading across panels
  const [originalSpreadImage, setOriginalSpreadImage] = useState<string>(() => {
    try {
      const uDef = remoteStore.getItem("seqcarver_user_defined_master_image") || remoteStore.getItem("seqcarver_user_default_3x3_image");
      if (uDef && !uDef.includes("source-01.jpg") && !uDef.includes("eurospect_header")) return uDef;
      const stored = remoteStore.getItem("seqcarver_originalSpreadImage");
      if (stored && !stored.includes("source-01.jpg") && !stored.includes("eurospect_header")) return stored;
      const b1 = remoteStore.getItem("seqcarver_defaultBox1Image");
      if (b1 && !b1.includes("source-01.jpg") && !b1.includes("eurospect_header")) return b1;
      return DEFAULT_FRONT_PAGE_IMAGE;
    } catch {
      return DEFAULT_FRONT_PAGE_IMAGE;
    }
  });

  const updateOriginalSpreadImage = useCallback((imgUrl: string) => {
    if (!imgUrl) return;
    setOriginalSpreadImage(imgUrl);
    try {
      remoteStore.setItem("seqcarver_originalSpreadImage", imgUrl);
    } catch (e) {
      console.warn("Failed to store originalSpreadImage", e);
    }
  }, []);

  // Front Page Advert Panels: Grid Layout Mode (4x4 default with 16 panels, or 3x3 with 9 panels)
  const [frontPageGridMode, setFrontPageGridMode] = useState<"3x3" | "4x4">(() => {
    try {
      return (remoteStore.getItem("seqcarver_frontPageGridMode") as "3x3" | "4x4") || "4x4";
    } catch {
      return "4x4";
    }
  });

  // Front Page 4x4 Whole Panel & Divisions Style (clean hairline borders, zero outer panel or glow)
  const [fourByFourPanelStyle, setFourByFourPanelStyle] = useState<FourByFourWholePanelStyle>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_4x4_panel_style");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          return {
            ...DEFAULT_4X4_PANEL_STYLE,
            ...parsed,
            panelBorderColor: "transparent",
            panelBgColor: "transparent",
            glowColor: "transparent",
            divisionStyle: parsed.divisionStyle === "glow" ? "solid" : (parsed.divisionStyle || "solid"),
          };
        }
      }
      const oldColor = remoteStore.getItem("seqcarver_4x4_theme_color");
      if (oldColor) return generateHarmonicPanelStyle(oldColor);
    } catch {}
    return DEFAULT_4X4_PANEL_STYLE;
  });

  const handleUpdate4x4PanelStyle = useCallback((updated: FourByFourWholePanelStyle | Partial<FourByFourWholePanelStyle>) => {
    setFourByFourPanelStyle((prev) => {
      const next = { ...prev, ...updated };
      try {
        remoteStore.setItem("seqcarver_4x4_panel_style", JSON.stringify(next));
        remoteStore.setItem("seqcarver_4x4_theme_color", next.primaryColor);
      } catch {}
      return next;
    });
  }, []);

  const handleToggleFrontPageGridMode = useCallback((mode?: "3x3" | "4x4") => {
    setFrontPageGridMode((prev) => {
      const next = mode ?? (prev === "3x3" ? "4x4" : "3x3");
      try {
        remoteStore.setItem("seqcarver_frontPageGridMode", next);
      } catch {}
      return next;
    });
  }, []);

  const handleReplaceFrontPageWith4x4 = useCallback((newBoxes: Record<number, string>) => {
    setBoxImages((prev) => {
      const updated = { ...prev, ...newBoxes };
      try {
        remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(updated));
        saveStoredJson("boxImages", updated).catch(console.warn);
      } catch {}
      return updated;
    });
    setFrontPageGridMode("4x4");
    try {
      remoteStore.setItem("seqcarver_frontPageGridMode", "4x4");
    } catch {}
    try {
      const storedLinks = remoteStore.getItem("seqcarver_4x4_links");
      if (storedLinks) {
        const parsed = JSON.parse(storedLinks);
        setBoxLinkConfigs((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
    setAdvertNotice("✓ Front page replaced with 4×4 (16 Panels) Advert Grid!");
    setTimeout(() => {
      setAdvertNotice((curr) => (curr?.includes("Front page replaced") ? null : curr));
    }, 4000);
  }, []);

  const handleReplaceSingleFrontPageBox = useCallback((boxId: number, imageUrl: string) => {
    setBoxImages((prev) => {
      const updated = { ...prev, [boxId]: imageUrl };
      try {
        remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(updated));
        saveStoredJson("boxImages", updated).catch(console.warn);
      } catch {}
      return updated;
    });
    setAdvertNotice(`✓ Replaced Front Page Box #${boxId}!`);
    setTimeout(() => {
      setAdvertNotice((curr) => (curr?.includes(`Box #${boxId}`) ? null : curr));
    }, 3000);
  }, []);

  // Auto-persist all 3x3/4x4 box changes so they survive reloads, restarts, and code amendments
  useEffect(() => {
    const hasAny = Object.values(boxImages).some(Boolean);
    if (!hasAny) return;
    try {
      remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(boxImages));
      saveStoredJson("boxImages", boxImages).catch(console.warn);
      // NOTE: Do not overwrite user_default_3x3_image with sliced tile #1!
      // Master images must be preserved and set via intentional user definition actions.
    } catch (e) {
      console.warn("Auto-save boxImages error:", e);
    }
  }, [boxImages]);

  // Image Series Rotation State
  const [boxRotationSeries, setBoxRotationSeries] = useState<Record<number, string[]>>({
    1: [],
    9: [],
  });
  const [boxRotationIntervals, setBoxRotationIntervals] = useState<Record<number, number>>({
    1: 3,
    9: 3,
  });
  const [boxRotationActive, setBoxRotationActive] = useState<Record<number, boolean>>({
    1: false,
    9: false,
  });
  const [boxRotationIndex, setBoxRotationIndex] = useState<Record<number, number>>({
    1: 0,
    9: 0,
  });
   const [rotationModalBoxId, setRotationModalBoxId] = useState<number | null>(null);
 
  // Tile Links & Hover Configs State
  const [disableBoxActions, setDisableBoxActions] = useState<boolean>(true);
  const [isBottomControlBarVisible, setIsBottomControlBarVisible] = useState<boolean>(false);
  const setEyePanelOpen = useCallback((next: boolean) => {
    setIsBottomControlBarVisible(next);
    try {
      remoteStore.setItem("seqcarver_eye_panel_open", String(next));
    } catch {}
  }, []);
  const [boxLinkConfigs, setBoxLinkConfigs] = useState<Record<number, TileLinkConfig>>(() => {
    try {
      const stored = remoteStore.getItem("seqcarver_json_boxLinkConfigs");
      if (stored) return JSON.parse(stored);
      return {};
    } catch {
      return {};
    }
  });
  const [sequencerPanelState, setSequencerPanelState] = useState<SequencerPanelState>(() => {
    const fallback = createSequencerPanelState(frontPageGridMode === "4x4" ? 16 : 9);
    try {
      const stored = remoteStore.getItem("seqcarver_sequencer_panel_v2");
      if (!stored) return fallback;
      const parsed = JSON.parse(stored);
      return {
        ...fallback,
        ...parsed,
        secondaryImages:
          typeof parsed.secondaryImages === "object" && parsed.secondaryImages !== null
            ? parsed.secondaryImages
            : {},
        activeSlots: Array.isArray(parsed.activeSlots) ? parsed.activeSlots : fallback.activeSlots,
        path: Array.isArray(parsed.path) ? parsed.path : fallback.path,
        showMouseOverLockIcons: Boolean(parsed.showMouseOverLockIcons ?? false),
      };
    } catch {
      return fallback;
    }
  });
  const [tileLinkModalBoxId, setTileLinkModalBoxId] = useState<number | null>(null);
  const [isControlDeckOpen, setIsControlDeckOpen] = useState<boolean>(false);
  const [controlDeckInitialTab, setControlDeckInitialTab] = useState<
    "SPREAD" | "IMAGE" | "ROTATION" | "SEQUENCER" | "LINK" | "STYLE" | "MOTION" | "SORTER"
  >("SPREAD");

  // Keep the sequencer's secondary images available to the front-page hover system.
  useEffect(() => {
    setBoxLinkConfigs((previous) => {
      const next = { ...previous };
      let changed = false;
      // Also clean up any slots that were unlocked/cleared from secondaryImages
      Object.keys(next).forEach((slotKey) => {
        const slot = Number(slotKey);
        if (next[slot]?.hoverEffect === "change-image" && !sequencerPanelState.secondaryImages[slot]) {
          next[slot] = { ...next[slot], hoverEffect: "none", hoverImage: "" };
          changed = true;
        }
      });
      Object.entries(sequencerPanelState.secondaryImages).forEach(([slotKey, url]) => {
        if (!url) return;
        const slot = Number(slotKey);
        const config = next[slot] || { url: "", target: "_blank", hoverEffect: "none" };
        if (config.hoverImage !== url || config.hoverEffect !== "change-image") {
          next[slot] = { ...config, hoverEffect: "change-image", hoverImage: url };
          changed = true;
        }
      });
      return changed ? next : previous;
    });
  }, [sequencerPanelState.secondaryImages]);

  // Persist the complete sequencer runtime so reloads keep the front-page transmission.
  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_sequencer_panel_v2", JSON.stringify(sequencerPanelState));
      saveStoredJson("sequencerPanelState", sequencerPanelState).catch(console.warn);
    } catch (error) {
      console.warn("Sequencer state persistence notice:", error);
    }
  }, [sequencerPanelState]);

  // One shared transport clock drives both the deck preview and the live front page.
  useEffect(() => {
    if (sequencerPanelState.bypassed || !sequencerPanelState.playing) return;
    const timer = window.setInterval(() => {
      setSequencerPanelState((previous) => {
        const path = previous.path.filter(
          (slot) => previous.activeSlots.includes(slot) && slot <= (frontPageGridMode === "4x4" ? 16 : 9),
        );
        if (path.length === 0) return { ...previous, playing: false };

        if (previous.wrapMode === "once") {
          if (previous.currentStep >= path.length) {
            return { ...previous, currentStep: path.length, playing: false, direction: 1 };
          }
          return { ...previous, currentStep: previous.currentStep + 1, direction: 1 };
        }

        if (previous.wrapMode === "pingpong") {
          let nextStep = previous.currentStep + previous.direction;
          let direction = previous.direction;
          if (nextStep > path.length) {
            direction = -1;
            nextStep = Math.max(1, path.length - 1);
          } else if (nextStep < 1) {
            direction = 1;
            nextStep = Math.min(path.length, 2);
          }
          return { ...previous, currentStep: nextStep, direction };
        }

        return {
          ...previous,
          currentStep: previous.currentStep >= path.length ? 1 : previous.currentStep + 1,
          direction: 1,
        };
      });
    }, Math.max(120, sequencerPanelState.stepIntervalMs));
    return () => window.clearInterval(timer);
  }, [
    sequencerPanelState.bypassed,
    sequencerPanelState.playing,
    sequencerPanelState.stepIntervalMs,
    sequencerPanelState.wrapMode,
    frontPageGridMode,
  ]);

  // Advert Panel Slide-Out Menu State (Gathers Bookmark default, Cloud DB, and On/Off toggle into a space-saving slide-out menu)
  const [isSlideMenuOpen, setIsSlideMenuOpen] = useState<boolean>(false);

  const toggleSlideMenu = useCallback(() => {
    setIsSlideMenuOpen((prev) => {
      const next = !prev;
      try {
        remoteStore.setItem("seqcarver_ad_slide_menu_open", String(next));
      } catch {}
      return next;
    });
  }, []);

  const closeSlideMenu = useCallback(() => {
    setIsSlideMenuOpen(false);
    try {
      remoteStore.setItem("seqcarver_ad_slide_menu_open", "false");
    } catch {}
  }, []);

  // Ensure panel control buttons are closed by default on initial load
  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_eye_panel_open", "false");
      remoteStore.setItem("seqcarver_ad_slide_menu_open", "false");
    } catch {}
  }, []);

  // Screenplay Writer State
  const [isScreenplayOpen, setIsScreenplayOpen] = useState<boolean>(false);
  const [screenplaySlides, setScreenplaySlides] = useState<Slide[]>([]);
  const [activeScreenplaySlideId, setActiveScreenplaySlideId] = useState<string>("");

  // Intended Splits Preview Dock Controls State
  const [splitPreviewSize, setSplitPreviewSize] = useState<"small" | "medium" | "large">("medium");
  const [splitPreviewLayout, setSplitPreviewLayout] = useState<"strip" | "grid" | "compact">("strip");
  const [isSplitPreviewCollapsed, setIsSplitPreviewCollapsed] = useState<boolean>(false);
  const [isSplitPreviewVisible, setIsSplitPreviewVisible] = useState<boolean>(true);
  const [splitPreviewOrientation, setSplitPreviewOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const [splitGridCols, setSplitGridCols] = useState<number>(8); // 4, 6, 8, 12, 16

  // Workspace Auto-Save & Restoration State
  const [isStateRestored, setIsStateRestored] = useState<boolean>(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving">("saved");


  const [freestyleToolbarOrder, setFreestyleToolbarOrder] = useState<string[]>([
    "freestyle_tool_select",
    "freestyle_tool_square",
    "freestyle_tool_polygon",
    "freestyle_tool_trapeze",
  ]);

  // Advert Panel Controls Bar Drag and Drop Order State
  const DEFAULT_PANEL_CONTROLS_ORDER: string[] = HARDCODED_DEFAULT_PANEL_CONTROLS_ORDER;

  // Canonical normalization helper for panel controls items to prune verbose duplicate aliases
  const canonicalPanelControlId = (rawId: string): string | null => {
    if (!rawId || typeof rawId !== "string") return null;
    const id = rawId.trim();
    if (
      [
        "four_by_four",
        "4x4",
        "front_page_ad_btn_4x4",
        "front_page_ad_4x4",
        "front_page_ad_4x4_launcher",
        "grid_mode_toggle",
        "toggle_links",
        "save_default",
        "cloud_db",
        "tilelink",
        "front_page_ad_tilelink_modal",
        "hide_bar",
        "front_page_ad_hide_panel_bar",
        "reset_spread",
        "front_page_ad_reset_spread",
        "quick_action",
        "quick_act",
        "front_page_ad_quick_action",
        "ibc_inspector",
        "front_page_ad_ibc_inspector",
        "rotation",
        "front_page_ad_global_rotation",
      ].includes(id)
    ) {
      return null;
    }
    if (["control_deck", "deck", "front_page_ad_control_deck"].includes(id)) {
      return "control_deck";
    }
    if (["utility_modal", "util_modal", "util", "front_page_ad_utility_modal"].includes(id)) {
      return "utility_modal";
    }
    if (["adv_modal", "adv", "front_page_ad_adv_modal"].includes(id)) {
      return "adv_modal";
    }
    if (["swap_panels", "front_page_ad_swap_panels"].includes(id)) {
      return "swap_panels";
    }
    if (["slide_menu", "front_page_ad_slide_menu_trigger"].includes(id)) {
      return "slide_menu";
    }
    if (["button_customizer", "customizer", "front_page_ad_button_customizer"].includes(id)) {
      return "button_customizer";
    }
    if (["undo_swap", "front_page_ad_undo_swap"].includes(id)) {
      return "undo_swap";
    }
    if (["logo", "header_logo"].includes(id)) {
      return "logo";
    }
    return id;
  };

  const pruneAndCanonicalizePanelControlsOrder = (order: string[]): string[] => {
    const cleanList: string[] = [];
    const seen = new Set<string>();

    for (const raw of order || []) {
      const canonical = canonicalPanelControlId(raw);
      if (canonical && !seen.has(canonical)) {
        seen.add(canonical);
        cleanList.push(canonical);
      }
    }

    // Ensure control_deck is present if missing
    if (!seen.has("control_deck")) {
      const swapIdx = cleanList.indexOf("swap_panels");
      if (swapIdx >= 0) {
        cleanList.splice(swapIdx + 1, 0, "control_deck");
      } else {
        cleanList.push("control_deck");
      }
      seen.add("control_deck");
    }

    // Ensure all default items exist
    for (const defItem of DEFAULT_PANEL_CONTROLS_ORDER) {
      if (!seen.has(defItem)) {
        seen.add(defItem);
        cleanList.push(defItem);
      }
    }

    return cleanList;
  };



  const [draggedPanelItem, setDraggedPanelItem] = useState<string | null>(null);
  const [dragOverPanelItem, setDragOverPanelItem] = useState<string | null>(null);

  const [draggedUniversalItem, setDraggedUniversalItem] = useState<string | null>(null);
  const [dragOverUniversalItem, setDragOverUniversalItem] = useState<string | null>(null);

  const handleUniversalDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("application/x-universal-toolbar", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedUniversalItem(id);
  };

  const handleUniversalDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverUniversalItem !== id) {
      setDragOverUniversalItem(id);
    }
  };

  const handleUniversalDrop = (e: React.DragEvent, targetId: string, zone: "header" | "storyboard" | "freestyle") => {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData("application/x-universal-toolbar");
    if (!id || id === targetId) {
      setDraggedUniversalItem(null);
      setDragOverUniversalItem(null);
      return;
    }

    let h = headerItemsOrder.filter(x => x !== id);
    let s = storyboardToolbarOrder.filter(x => x !== id);
    let f = freestyleToolbarOrder.filter(x => x !== id);

    const insert = (arr: string[]) => {
      const idx = arr.indexOf(targetId);
      if (idx !== -1) {
         const next = [...arr];
         next.splice(idx, 0, id);
         return next;
      }
      return [...arr, id];
    };

    if (zone === "header") h = insert(h);
    else if (zone === "storyboard") s = insert(s);
    else if (zone === "freestyle") f = insert(f);

    setHeaderItemsOrder(h);
    setStoryboardToolbarOrder(s);
    setFreestyleToolbarOrder(f);
    
    setDraggedUniversalItem(null);
    setDragOverUniversalItem(null);
  };

  const handleUniversalZoneDrop = (e: React.DragEvent, zone: "header" | "storyboard" | "freestyle") => {
    e.preventDefault();
    const id = e.dataTransfer.getData("application/x-universal-toolbar");
    if (!id) return;
    
    let h = headerItemsOrder.filter(x => x !== id);
    let s = storyboardToolbarOrder.filter(x => x !== id);
    let f = freestyleToolbarOrder.filter(x => x !== id);

    if (zone === "header") h.push(id);
    else if (zone === "storyboard") s.push(id);
    else if (zone === "freestyle") f.push(id);

    setHeaderItemsOrder(h);
    setStoryboardToolbarOrder(s);
    setFreestyleToolbarOrder(f);

    setDraggedUniversalItem(null);
    setDragOverUniversalItem(null);
  };

  const handleUniversalDragEnd = () => {
    setDraggedUniversalItem(null);
    setDragOverUniversalItem(null);
  };

  // Panel Controls Bar Drag and Drop Handlers
  const handlePanelControlsDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("application/x-panel-control-item", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedPanelItem(id);
  };

  const handlePanelControlsDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverPanelItem !== id) {
      setDragOverPanelItem(id);
    }
  };

  const handlePanelControlsDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData("application/x-panel-control-item");
    if (!id || id === targetId) {
      setDraggedPanelItem(null);
      setDragOverPanelItem(null);
      return;
    }

    setPanelControlsOrder((prev) => {
      const canonicalTarget = canonicalPanelControlId(targetId) || targetId;
      const canonicalSource = canonicalPanelControlId(id) || id;
      const cleanPrev = pruneAndCanonicalizePanelControlsOrder(prev);
      const next = cleanPrev.filter((x) => x !== canonicalSource);
      const targetIdx = next.indexOf(canonicalTarget);
      if (targetIdx !== -1) {
        next.splice(targetIdx, 0, canonicalSource);
      } else {
        next.push(canonicalSource);
      }
      const pruned = pruneAndCanonicalizePanelControlsOrder(next);
      try {
        remoteStore.setItem("seqcarver_panel_controls_order", JSON.stringify(pruned));
      } catch {}
      return pruned;
    });

    setDraggedPanelItem(null);
    setDragOverPanelItem(null);
  };

  const handlePanelControlsZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("application/x-panel-control-item");
    if (!id) return;
    setPanelControlsOrder((prev) => {
      const canonicalSource = canonicalPanelControlId(id) || id;
      const cleanPrev = pruneAndCanonicalizePanelControlsOrder(prev);
      const next = cleanPrev.filter((x) => x !== canonicalSource);
      next.push(canonicalSource);
      const pruned = pruneAndCanonicalizePanelControlsOrder(next);
      try {
        remoteStore.setItem("seqcarver_panel_controls_order", JSON.stringify(pruned));
      } catch {}
      return pruned;
    });
    setDraggedPanelItem(null);
    setDragOverPanelItem(null);
  };

  const handlePanelControlsDragEnd = () => {
    setDraggedPanelItem(null);
    setDragOverPanelItem(null);
  };

  // --- Define Canvas & Crop Drag-and-Drop State ---
  const [cropPanelsOrder, setCropPanelsOrder] = useState<string[]>(() => {
    try {
      const saved = remoteStore.getItem("seqcarver_crop_panels_order");
      if (saved) return JSON.parse(saved);
    } catch {}
    return getLoadedCropDefaultSetup().panelsOrder;
  });

  const [cropQuickToolsOrder, setCropQuickToolsOrder] = useState<string[]>(() => {
    try {
      const saved = remoteStore.getItem("seqcarver_crop_quick_tools_order");
      if (saved) return JSON.parse(saved);
    } catch {}
    return getLoadedCropDefaultSetup().quickToolsOrder;
  });

  const [cropSbFrameOrder, setCropSbFrameOrder] = useState<string[]>(() => {
    try {
      const saved = remoteStore.getItem("seqcarver_crop_sb_frame_order");
      if (saved) return JSON.parse(saved);
    } catch {}
    return getLoadedCropDefaultSetup().sbFrameOrder;
  });

  const [cropAspectOrder, setCropAspectOrder] = useState<string[]>(() => {
    try {
      const saved = remoteStore.getItem("seqcarver_crop_aspect_order");
      if (saved) return JSON.parse(saved);
    } catch {}
    return getLoadedCropDefaultSetup().aspectOrder;
  });

  const [cropPrimaryOrder, setCropPrimaryOrder] = useState<string[]>(() => {
    try {
      const saved = remoteStore.getItem("seqcarver_crop_primary_order");
      if (saved) return JSON.parse(saved);
    } catch {}
    return getLoadedCropDefaultSetup().primaryOrder;
  });

  const [cropUtilityOrder, setCropUtilityOrder] = useState<string[]>(() => {
    try {
      const saved = remoteStore.getItem("seqcarver_crop_utility_order");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.includes("krums_loader_tool")) {
          const mIdx = parsed.indexOf("messhi_grid_tool");
          if (mIdx !== -1) {
            parsed.splice(mIdx + 1, 0, "krums_loader_tool");
          } else {
            parsed.push("krums_loader_tool");
          }
        }
        return parsed;
      }
    } catch {}
    return getLoadedCropDefaultSetup().utilityOrder;
  });

  const [cropShapeStudioOrder, setCropShapeStudioOrder] = useState<string[]>(() => {
    try {
      const saved = remoteStore.getItem("seqcarver_crop_ss_order");
      if (saved) return JSON.parse(saved);
    } catch {}
    return getLoadedCropDefaultSetup().shapeStudioOrder;
  });

  const [cropMultiCropBatchOrder, setCropMultiCropBatchOrder] = useState<string[]>(() => {
    try {
      const saved = remoteStore.getItem("seqcarver_crop_multicrop_batch_order");
      if (saved) return JSON.parse(saved);
    } catch {}
    return getLoadedCropDefaultSetup().multiCropBatchOrder;
  });

  const [draggedCropItem, setDraggedCropItem] = useState<{ id: string; zone: string } | null>(null);
  const [dragOverCropItem, setDragOverCropItem] = useState<string | null>(null);

  const [draggedCropPanel, setDraggedCropPanel] = useState<string | null>(null);
  const [dragOverCropPanel, setDragOverCropPanel] = useState<string | null>(null);

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_crop_panels_order", JSON.stringify(cropPanelsOrder));
    } catch {}
  }, [cropPanelsOrder]);

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_crop_quick_tools_order", JSON.stringify(cropQuickToolsOrder));
    } catch {}
  }, [cropQuickToolsOrder]);

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_crop_sb_frame_order", JSON.stringify(cropSbFrameOrder));
    } catch {}
  }, [cropSbFrameOrder]);

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_crop_aspect_order", JSON.stringify(cropAspectOrder));
    } catch {}
  }, [cropAspectOrder]);

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_crop_primary_order", JSON.stringify(cropPrimaryOrder));
    } catch {}
  }, [cropPrimaryOrder]);

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_crop_utility_order", JSON.stringify(cropUtilityOrder));
    } catch {}
  }, [cropUtilityOrder]);

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_crop_ss_order", JSON.stringify(cropShapeStudioOrder));
    } catch {}
  }, [cropShapeStudioOrder]);

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_crop_multicrop_batch_order", JSON.stringify(cropMultiCropBatchOrder));
    } catch {}
  }, [cropMultiCropBatchOrder]);

  const handleCropItemDragStart = (e: React.DragEvent, id: string, zone: string) => {
    e.dataTransfer.setData("application/x-crop-item", JSON.stringify({ id, zone }));
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedCropItem({ id, zone });
  };

  const handleCropItemDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCropItem !== id) {
      setDragOverCropItem(id);
    }
  };

  const handleCropItemDrop = (e: React.DragEvent, targetId: string, zone: string) => {
    e.preventDefault();
    e.stopPropagation();
    let dragData = draggedCropItem;
    if (!dragData) {
      try {
        const raw = e.dataTransfer.getData("application/x-crop-item");
        if (raw) dragData = JSON.parse(raw);
      } catch {}
    }
    if (!dragData || dragData.id === targetId) {
      setDraggedCropItem(null);
      setDragOverCropItem(null);
      return;
    }

    const { id } = dragData;

    // Remove from other zones if dragged across zones
    if (zone !== "quick_tools") setCropQuickToolsOrder((prev) => prev.filter((x) => x !== id));
    if (zone !== "sb_frame") setCropSbFrameOrder((prev) => prev.filter((x) => x !== id));
    if (zone !== "aspect") setCropAspectOrder((prev) => prev.filter((x) => x !== id));
    if (zone !== "primary") setCropPrimaryOrder((prev) => prev.filter((x) => x !== id));
    if (zone !== "utility") setCropUtilityOrder((prev) => prev.filter((x) => x !== id));
    if (zone !== "ss") setCropShapeStudioOrder((prev) => prev.filter((x) => x !== id));
    if (zone !== "multicrop_batch") setCropMultiCropBatchOrder((prev) => prev.filter((x) => x !== id));

    const insertAtTarget = (arr: string[]) => {
      const filtered = arr.filter((x) => x !== id);
      const targetIdx = filtered.indexOf(targetId);
      if (targetIdx !== -1) {
        filtered.splice(targetIdx, 0, id);
        return filtered;
      }
      return [...filtered, id];
    };

    if (zone === "quick_tools") setCropQuickToolsOrder((prev) => insertAtTarget(prev));
    else if (zone === "sb_frame") setCropSbFrameOrder((prev) => insertAtTarget(prev));
    else if (zone === "aspect") setCropAspectOrder((prev) => insertAtTarget(prev));
    else if (zone === "primary") setCropPrimaryOrder((prev) => insertAtTarget(prev));
    else if (zone === "utility") setCropUtilityOrder((prev) => insertAtTarget(prev));
    else if (zone === "ss") setCropShapeStudioOrder((prev) => insertAtTarget(prev));
    else if (zone === "multicrop_batch") setCropMultiCropBatchOrder((prev) => insertAtTarget(prev));

    setDraggedCropItem(null);
    setDragOverCropItem(null);
  };

  const handleCropZoneDrop = (e: React.DragEvent, zone: string) => {
    e.preventDefault();
    e.stopPropagation();
    let dragData = draggedCropItem;
    if (!dragData) {
      try {
        const raw = e.dataTransfer.getData("application/x-crop-item");
        if (raw) dragData = JSON.parse(raw);
      } catch {}
    }
    if (!dragData) return;
    const { id } = dragData;

    // Remove from other zones if dragged across zones
    if (zone !== "quick_tools") setCropQuickToolsOrder((prev) => prev.filter((x) => x !== id));
    if (zone !== "sb_frame") setCropSbFrameOrder((prev) => prev.filter((x) => x !== id));
    if (zone !== "aspect") setCropAspectOrder((prev) => prev.filter((x) => x !== id));
    if (zone !== "primary") setCropPrimaryOrder((prev) => prev.filter((x) => x !== id));
    if (zone !== "utility") setCropUtilityOrder((prev) => prev.filter((x) => x !== id));
    if (zone !== "ss") setCropShapeStudioOrder((prev) => prev.filter((x) => x !== id));
    if (zone !== "multicrop_batch") setCropMultiCropBatchOrder((prev) => prev.filter((x) => x !== id));

    const append = (prev: string[]) => (prev.includes(id) ? prev : [...prev, id]);

    if (zone === "quick_tools") setCropQuickToolsOrder(append);
    else if (zone === "sb_frame") setCropSbFrameOrder(append);
    else if (zone === "aspect") setCropAspectOrder(append);
    else if (zone === "primary") setCropPrimaryOrder(append);
    else if (zone === "utility") setCropUtilityOrder(append);
    else if (zone === "ss") setCropShapeStudioOrder(append);
    else if (zone === "multicrop_batch") setCropMultiCropBatchOrder(append);

    setDraggedCropItem(null);
    setDragOverCropItem(null);
  };

  const handleCropItemDragEnd = () => {
    setDraggedCropItem(null);
    setDragOverCropItem(null);
  };

  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDraggedCropItem(null);
      setDragOverCropItem(null);
      setDraggedCropPanel(null);
      setDragOverCropPanel(null);
    };
    window.addEventListener("dragend", handleGlobalDragEnd);
    window.addEventListener("drop", handleGlobalDragEnd);
    window.addEventListener("mouseup", handleGlobalDragEnd);
    window.addEventListener("pointerup", handleGlobalDragEnd);
    window.addEventListener("dragcancel", handleGlobalDragEnd);
    return () => {
      window.removeEventListener("dragend", handleGlobalDragEnd);
      window.removeEventListener("drop", handleGlobalDragEnd);
      window.removeEventListener("mouseup", handleGlobalDragEnd);
      window.removeEventListener("pointerup", handleGlobalDragEnd);
      window.removeEventListener("dragcancel", handleGlobalDragEnd);
    };
  }, []);

  const handleCropPanelDragStart = (e: React.DragEvent, panelId: string) => {
    e.dataTransfer.setData("application/x-crop-panel", panelId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedCropPanel(panelId);
  };

  const handleCropPanelDragOver = (e: React.DragEvent, panelId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCropPanel !== panelId) {
      setDragOverCropPanel(panelId);
    }
  };

  const handleCropPanelDragEnd = () => {
    setDraggedCropPanel(null);
    setDragOverCropPanel(null);
  };

  const handleCropPanelDrop = (e: React.DragEvent, targetPanelId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const sourcePanelId = draggedCropPanel || e.dataTransfer.getData("application/x-crop-panel");
    if (!sourcePanelId || sourcePanelId === targetPanelId) {
      setDraggedCropPanel(null);
      setDragOverCropPanel(null);
      return;
    }
    setCropPanelsOrder((prev) => {
      const filtered = prev.filter((p) => p !== sourcePanelId);
      const targetIdx = filtered.indexOf(targetPanelId);
      if (targetIdx !== -1) {
        filtered.splice(targetIdx, 0, sourcePanelId);
        return filtered;
      }
      return [...filtered, sourcePanelId];
    });
    setDraggedCropPanel(null);
    setDragOverCropPanel(null);
  };

  // Restore persistent workspace state on mount
  useEffect(() => {
    let isMounted = true;

    getStoredJson<Record<string, any>>("full_app_state_v2")
      .then((savedState) => {
        if (!isMounted) return;

        if (savedState && typeof savedState === "object") {
          if (savedState.imageSrc !== undefined) setImageSrc(savedState.imageSrc);
          if (savedState.originalImageSrc !== undefined) setOriginalImageSrc(savedState.originalImageSrc);
          if (savedState.croppedImageSrc !== undefined) setCroppedImageSrc(savedState.croppedImageSrc);
          if (savedState.mode !== undefined) setMode(savedState.mode);
          if (savedState.slicePrefix !== undefined) setSlicePrefix(savedState.slicePrefix);
          if (typeof savedState.numRows === "number") setNumRows(savedState.numRows);
          if (typeof savedState.numCols === "number") setNumCols(savedState.numCols);
          if (Array.isArray(savedState.rowCuts)) setRowCuts(savedState.rowCuts);
          if (Array.isArray(savedState.colCuts)) setColCuts(savedState.colCuts);
          if (savedState.carveImageSize) setCarveImageSize(savedState.carveImageSize);
          if (savedState.format) setFormat(savedState.format);
          if (savedState.numberingOrigin) setNumberingOrigin(savedState.numberingOrigin);
          if (savedState.numberingFlow) setNumberingFlow(savedState.numberingFlow);
          if (savedState.namingStyle) setNamingStyle(savedState.namingStyle);
          if (savedState.sliceLineColor) setSliceLineColor(savedState.sliceLineColor);
          if (savedState.sliceLineStyle) setSliceLineStyle(savedState.sliceLineStyle);
          if (typeof savedState.sliceLineThickness === "number") setSliceLineThickness(savedState.sliceLineThickness);
          if (typeof savedState.sliceLineThicknessX === "number") setSliceLineThicknessX(savedState.sliceLineThicknessX);
          if (typeof savedState.sliceLineThicknessY === "number") setSliceLineThicknessY(savedState.sliceLineThicknessY);
          if (typeof savedState.isGapLocked === "boolean") setIsGapLocked(savedState.isGapLocked);
          if (typeof savedState.outerMargin === "number") setOuterMargin(savedState.outerMargin);
          if (typeof savedState.sliceCellPadding === "number") setSliceCellPadding(savedState.sliceCellPadding);
          if (typeof savedState.showPixelLabels === "boolean") setShowPixelLabels(savedState.showPixelLabels);
          if (typeof savedState.showGridLabels === "boolean") setShowGridLabels(savedState.showGridLabels);
          if (savedState.canvasFitMode) setCanvasFitMode(savedState.canvasFitMode);
          if (typeof savedState.sidebarWidth === "number") setSidebarWidth(savedState.sidebarWidth);

          if (savedState.originalSpreadImage) {
            setOriginalSpreadImage(savedState.originalSpreadImage);
            try { remoteStore.setItem("seqcarver_originalSpreadImage", savedState.originalSpreadImage); } catch {}
          }
          if (savedState.defaultBox1Image) {
            setBoxImages((prev) => ({ ...prev, 1: savedState.defaultBox1Image }));
            setDefaultBoxImages((prev) => ({ ...prev, 1: savedState.defaultBox1Image }));
            try { remoteStore.setItem("seqcarver_defaultBox1Image", savedState.defaultBox1Image); } catch {}
          }
          if (savedState.boxImages && typeof savedState.boxImages === "object" && Object.values(savedState.boxImages).some(Boolean)) {
            setBoxImages((prev) => ({ ...prev, ...savedState.boxImages }));
            try { remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(savedState.boxImages)); } catch {}
          }
          if (savedState.defaultBoxImages && typeof savedState.defaultBoxImages === "object" && Object.values(savedState.defaultBoxImages).some(Boolean)) {
            setDefaultBoxImages(savedState.defaultBoxImages);
            try { remoteStore.setItem("seqcarver_json_defaultBoxImages", JSON.stringify(savedState.defaultBoxImages)); } catch {}
          }
          if (savedState.boxRotationSeries) setBoxRotationSeries(savedState.boxRotationSeries);
          if (savedState.boxRotationIntervals) setBoxRotationIntervals(savedState.boxRotationIntervals);
          if (savedState.boxRotationActive) setBoxRotationActive(savedState.boxRotationActive);
          if (savedState.boxLinkConfigs) setBoxLinkConfigs(savedState.boxLinkConfigs);
          if (savedState.sequencerPanelState) {
            setSequencerPanelState((previous) => ({
              ...previous,
              ...savedState.sequencerPanelState,
              secondaryImages: {
                ...previous.secondaryImages,
                ...(savedState.sequencerPanelState.secondaryImages || {}),
              },
            }));
          }
          if (typeof savedState.disableBoxActions === "boolean") setDisableBoxActions(savedState.disableBoxActions);
          // Panel controls ('eye' button) and slide menu must be closed by default on initial load and refresh
          setIsBottomControlBarVisible(false);
          setIsSlideMenuOpen(false);
          try {
            remoteStore.setItem("seqcarver_eye_panel_open", "false");
            remoteStore.setItem("seqcarver_ad_slide_menu_open", "false");
          } catch {}

           if (savedState.neo1LayersMap) setNeo1LayersMap(savedState.neo1LayersMap);
          if (savedState.bubba1BubblesMap) setBubba1BubblesMap(savedState.bubba1BubblesMap);

          if (Array.isArray(savedState.multiCrops)) setMultiCrops(savedState.multiCrops);
          if (Array.isArray(savedState.storyboardSlices)) setStoryboardSlices(savedState.storyboardSlices);
          if (Array.isArray(savedState.storyboardSlots)) setStoryboardSlots(savedState.storyboardSlots);
          if (savedState.storyboardCellMode) setStoryboardCellMode(savedState.storyboardCellMode);
          if (savedState.storyboardLayout) setStoryboardLayout(savedState.storyboardLayout);
          if (savedState.slotSize) setSlotSize(savedState.slotSize);
          if (typeof savedState.isReverseInsert === "boolean") setIsReverseInsert(savedState.isReverseInsert);
          if (savedState.storyboardDropAction) setStoryboardDropAction(savedState.storyboardDropAction);
          if (typeof savedState.isStoryboardLocked === "boolean") setIsStoryboardLocked(savedState.isStoryboardLocked);
          if (typeof savedState.isStoryboardVisible === "boolean") setIsStoryboardVisible(savedState.isStoryboardVisible);
          if (typeof savedState.carvedSlicesBgColor === "string") setCarvedSlicesBgColor(savedState.carvedSlicesBgColor);
          if (typeof savedState.carvedSlicesExpandedCols === "number") setCarvedSlicesExpandedCols(savedState.carvedSlicesExpandedCols);
          if (savedState.activeSortMode) setActiveSortMode(savedState.activeSortMode);
          if (savedState.activeGroupMode) setActiveGroupMode(savedState.activeGroupMode);
          if (savedState.selectedGroupFilter !== undefined) setSelectedGroupFilter(savedState.selectedGroupFilter);
          if (typeof savedState.autoSortOnImport === "boolean") setAutoSortOnImport(savedState.autoSortOnImport);
          if (Array.isArray(savedState.storyboardToolbarOrder)) {
            let order = savedState.storyboardToolbarOrder.filter(
              (id: string) => id !== "clearEmpty" && id !== "studios" && id !== "lock" && id !== "stripBg" && id !== "togglePanel"
            );
            if (order.length > 0 && order[0] === "divider_1") {
              order.shift();
            }
            const clearIdx = order.indexOf("clear");
            if (clearIdx !== -1) {
              order.splice(clearIdx + 1, 0, "clearEmpty");
            } else {
              order.push("clearEmpty");
            }
            if (!order.includes("selectAll")) {
              const opIdx = order.indexOf("operations");
              if (opIdx !== -1) {
                order.splice(opIdx, 0, "selectAll");
              } else {
                order.push("selectAll");
              }
            }
            if (!order.includes("duplicate")) {
              const revIdx = order.indexOf("reverse");
              if (revIdx !== -1) {
                order.splice(revIdx + 1, 0, "duplicate");
              } else {
                order.push("duplicate");
              }
            }
            if (!order.includes("saveDefaultState")) {
              const dupIdx = order.indexOf("duplicate");
              if (dupIdx !== -1) {
                order.splice(dupIdx + 1, 0, "saveDefaultState", "restoreDefaultState");
              } else {
                order.push("saveDefaultState", "restoreDefaultState");
              }
            }
            setStoryboardToolbarOrder(order);
          }
          if (Array.isArray(savedState.headerItemsOrder)) {
            const sanitized = savedState.headerItemsOrder.filter(
              (id: string) => !["upload_carved_grid", "upload_multiple_storyboard", "divider_2", "rotation", "cloud_db", "utility_modal"].includes(id)
            );
            if (!sanitized.includes("panel_controls")) {
              const animIdx = sanitized.indexOf("anim_player");
              if (animIdx !== -1) {
                sanitized.splice(animIdx + 1, 0, "panel_controls");
              } else {
                sanitized.push("panel_controls");
              }
            }
            setHeaderItemsOrder(sanitized);
          }
          if (Array.isArray(savedState.freestyleToolbarOrder)) {
            setFreestyleToolbarOrder(savedState.freestyleToolbarOrder);
          }
          if (Array.isArray(savedState.panelControlsOrder)) {
            const clean = pruneAndCanonicalizePanelControlsOrder(savedState.panelControlsOrder);
            setPanelControlsOrder(clean);
          }

          if (savedState.splitPreviewSize) setSplitPreviewSize(savedState.splitPreviewSize);
          if (savedState.splitPreviewLayout) setSplitPreviewLayout(savedState.splitPreviewLayout);
          if (typeof savedState.isSplitPreviewCollapsed === "boolean") setIsSplitPreviewCollapsed(savedState.isSplitPreviewCollapsed);
          if (typeof savedState.isSplitPreviewVisible === "boolean") setIsSplitPreviewVisible(savedState.isSplitPreviewVisible);
          if (savedState.splitPreviewOrientation) setSplitPreviewOrientation(savedState.splitPreviewOrientation);
          if (typeof savedState.splitGridCols === "number") setSplitGridCols(savedState.splitGridCols);

          if (Array.isArray(savedState.screenplaySlides)) setScreenplaySlides(savedState.screenplaySlides);
          if (savedState.activeScreenplaySlideId) setActiveScreenplaySlideId(savedState.activeScreenplaySlideId);
          if (typeof savedState.isScreenplayOpen === "boolean") setIsScreenplayOpen(savedState.isScreenplayOpen);

          if (typeof savedState.meshSquareSize === "number") setMeshSquareSize(savedState.meshSquareSize);
          if (savedState.meshBounds) setMeshBounds(savedState.meshBounds);
          if (savedState.meshMode) setMeshMode(savedState.meshMode);
          if (savedState.meshDestination) setMeshDestination(savedState.meshDestination);
          if (typeof savedState.meshGridLineWidth === "number") setMeshGridLineWidth(savedState.meshGridLineWidth);
          if (savedState.meshGridLineColor) setMeshGridLineColor(savedState.meshGridLineColor);
          if (typeof savedState.meshAutoGotoAfterCut === "boolean") setMeshAutoGotoAfterCut(savedState.meshAutoGotoAfterCut);
          if (Array.isArray(savedState.freestyleSquares)) setFreestyleSquares(savedState.freestyleSquares);
        } else {
          // Fallback to legacy single storage keys
          getStoredJson<Record<number, TileLinkConfig>>("boxLinkConfigs").then((storedConfigs) => {
            if (!isMounted) return;
            if (storedConfigs) setBoxLinkConfigs(storedConfigs);
          });

          getStoredJson<Record<number, string>>("defaultBoxImages").then((storedImages) => {
            if (!isMounted) return;
            if (storedImages && typeof storedImages === "object" && Object.values(storedImages).some(Boolean)) {
              setDefaultBoxImages(storedImages);
              setBoxImages((prev) => ({ ...prev, ...storedImages }));
            }
          });

          getStoredDefaultImage("defaultBox1Image").then((storedB1) => {
            if (!isMounted || !storedB1) return;
            setBoxImages((prev) => ({ ...prev, 1: storedB1 }));
            setDefaultBoxImages((prev) => ({ ...prev, 1: storedB1 }));
          });

          getStoredDefaultImage("originalSpreadImage").then((storedSpread) => {
            if (!isMounted || !storedSpread) return;
            setOriginalSpreadImage(storedSpread);
          });

          getStoredJson<{ series: string[]; interval: number; active: boolean }>("rotation_box1").then((config) => {
            if (!isMounted || !config) return;
            if (config.series?.length) setBoxRotationSeries((prev) => ({ ...prev, 1: config.series }));
            if (config.interval) setBoxRotationIntervals((prev) => ({ ...prev, 1: config.interval }));
            if (typeof config.active === "boolean") setBoxRotationActive((prev) => ({ ...prev, 1: config.active }));
          });

          getStoredJson<{ series: string[]; interval: number; active: boolean }>("rotation_box9").then((config) => {
            if (!isMounted || !config) return;
            if (config.series?.length) setBoxRotationSeries((prev) => ({ ...prev, 9: config.series }));
            if (config.interval) setBoxRotationIntervals((prev) => ({ ...prev, 9: config.interval }));
            if (typeof config.active === "boolean") setBoxRotationActive((prev) => ({ ...prev, 9: config.active }));
          });
        }

        // Always check and restore dedicated persistent default images from IndexedDB / Firestore
        getStoredDefaultImage("user_default_3x3_image").then((userImg) => {
          if (!isMounted || !userImg) return;
          setUserDefault3x3Image(userImg);
          setOriginalSpreadImage((curr) => curr === eurospectImg ? userImg : curr);
          try { remoteStore.setItem("seqcarver_user_default_3x3_image", userImg); } catch {}
        });

        getStoredDefaultImage("defaultBox1Image").then((storedB1) => {
          if (!isMounted || !storedB1) return;
          setDefaultBoxImages((prev) => ({ ...prev, 1: storedB1 }));
          if (!remoteStore.getItem("seqcarver_json_boxImages")) {
            setBoxImages((prev) => ({ ...prev, 1: storedB1 }));
          }
          try { remoteStore.setItem("seqcarver_defaultBox1Image", storedB1); } catch {}
        });

        getStoredDefaultImage("originalSpreadImage").then((storedSpread) => {
          if (!isMounted || !storedSpread) return;
          setOriginalSpreadImage(storedSpread);
          try { remoteStore.setItem("seqcarver_originalSpreadImage", storedSpread); } catch {}
        });

        getStoredJson<Record<number, string>>("defaultBoxImages").then((storedImages) => {
          if (!isMounted || !storedImages) return;
          if (typeof storedImages === "object" && Object.values(storedImages).some(Boolean)) {
            setDefaultBoxImages(storedImages);
            if (!remoteStore.getItem("seqcarver_json_boxImages")) {
              setBoxImages((prev) => ({ ...prev, ...storedImages }));
            }
            try { remoteStore.setItem("seqcarver_json_defaultBoxImages", JSON.stringify(storedImages)); } catch {}
          }
        });

        // Check for persistent storyboard default state metadata and ensure present setup is default
        getStoredJson<StoryboardDefaultState>(STORYBOARD_DEFAULT_STATE_KEY)
          .then((defaultState) => {
            if (!isMounted) return;
            const stateToUse = defaultState || {
              slots: Array.from({ length: 9 }, () => ({ url: null, name: "", story: "" })),
              slices: [],
              cellMode: "image-name",
              layout: "grid9",
              slotSize: "md",
              isReverseInsert: false,
              storyboardDropAction: "insert",
              carvedSlicesBgColor: "#0f172a",
              isLeftSidebarVisible: true,
              isStoryboardVisible: true,
              stripBackground: "#000000",
              stripImageBackground: "#000000",
              stripPanelBackground: "#000000",
              showSlotHeaders: true,
              activeSortMode: "none",
              activeGroupMode: "none",
              selectedGroupFilter: null,
              autoSortOnImport: false,
              isExportBarCompact: true,
              lastSavedAt: new Date().toISOString(),
            };
            if (!defaultState) {
              saveStoredJson(STORYBOARD_DEFAULT_STATE_KEY, stateToUse);
            }
            setSavedStoryboardDefaultInfo({
              savedAt: stateToUse.lastSavedAt || new Date().toISOString(),
              slotsCount: stateToUse.slots?.length || 0,
              slicesCount: stateToUse.slices?.length || 0,
              layout: stateToUse.layout || "grid9",
              cellMode: stateToUse.cellMode || "image-name",
            });
          })
          .catch(console.warn);

        // Check for persistent crop (Define Canvas & Crop) default state and ensure present setup is persistent default
        try {
          const storedCropDefault = remoteStore.getItem(CROP_DEFAULT_STATE_KEY);
          if (!storedCropDefault) {
            remoteStore.setItem(CROP_DEFAULT_STATE_KEY, JSON.stringify(BASELINE_CROP_DEFAULT_SETUP));
          }
        } catch {}

        setIsStateRestored(true);
      })
      .catch((err) => {
        console.warn("Failed to restore app state:", err);
        setIsStateRestored(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Image Series Rotation Timer Loop
  useEffect(() => {
    const activeBoxIds = Object.keys(boxRotationActive)
      .map(Number)
      .filter((id) => boxRotationActive[id] && (boxRotationSeries[id]?.length ?? 0) > 0);

    if (activeBoxIds.length === 0) return;

    const timers: Record<number, number> = {};

    activeBoxIds.forEach((boxId) => {
      const series = boxRotationSeries[boxId] || [];
      if (series.length === 0) return;
      const seconds = Math.max(1, boxRotationIntervals[boxId] || 3);

      timers[boxId] = window.setInterval(() => {
        setBoxRotationIndex((prevIdxs) => {
          const current = prevIdxs[boxId] || 0;
          const next = (current + 1) % series.length;
          setBoxImages((prevBoxImgs) => ({
            ...prevBoxImgs,
            [boxId]: series[next],
          }));
          return { ...prevIdxs, [boxId]: next };
        });
      }, seconds * 1000);
    });

    return () => {
      Object.values(timers).forEach((t) => clearInterval(t));
    };
  }, [boxRotationActive, boxRotationSeries, boxRotationIntervals]);

  const updateRotationConfig = useCallback(
    (boxId: number, series: string[], interval: number, active: boolean) => {
      setBoxRotationSeries((prev) => ({ ...prev, [boxId]: series }));
      setBoxRotationIntervals((prev) => ({ ...prev, [boxId]: interval }));
      setBoxRotationActive((prev) => ({ ...prev, [boxId]: active }));
      // If series has elements and box was set to active, make sure box shows current series item
      if (active && series.length > 0) {
        setBoxImages((prev) => ({ ...prev, [boxId]: series[0] }));
        setBoxRotationIndex((prev) => ({ ...prev, [boxId]: 0 }));
      }
      saveStoredJson(`rotation_box${boxId}`, { series, interval, active }).catch(console.warn);
    },
    []
  );

  const handleSetNBoxDefault = useCallback((imageUrl?: string, numBoxes: number = 9) => {
    const sourceImg = imageUrl || boxImages[1] || originalSpreadImage || eurospectImg;
    if (!sourceImg) return;
    if (imageUrl) {
      updateOriginalSpreadImage(imageUrl);
    }

    if (numBoxes === 1) {
      const finalDefaults: Record<number, string> = { ...boxImages, 1: sourceImg };
      setBoxImages(finalDefaults);
      setDefaultBoxImages(finalDefaults);
      setUserDefault3x3Image(sourceImg);
      updateOriginalSpreadImage(sourceImg);
      try {
        remoteStore.setItem("seqcarver_user_default_3x3_image", sourceImg);
        remoteStore.setItem("seqcarver_json_defaultBoxImages", JSON.stringify(finalDefaults));
        remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(finalDefaults));
        remoteStore.setItem("seqcarver_defaultBox1Image", sourceImg);
        remoteStore.setItem("seqcarver_originalSpreadImage", sourceImg);
        saveStoredDefaultImage("user_default_3x3_image", sourceImg).catch(console.warn);
        saveStoredJson("defaultBoxImages", finalDefaults).catch(console.warn);
        saveStoredJson("boxImages", finalDefaults).catch(console.warn);
        saveStoredDefaultImage("defaultBox1Image", sourceImg).catch(console.warn);
        saveStoredDefaultImage("originalSpreadImage", sourceImg).catch(console.warn);
      } catch (err) {
        console.warn("Failed to save default for Box 1", err);
      }
      saveCurrentAsDefault(undefined, undefined, {
        boxLinkConfigs,
        boxRotationSeries,
        boxRotationIntervals,
        boxRotationActive,
        disableBoxActions,
        defaultBoxImages: finalDefaults,
        boxImages: finalDefaults,
        originalSpreadImage: sourceImg,
        defaultBox1Image: sourceImg,
        userDefault3x3Image: sourceImg,
      });
      setAdvertNotice("✓ Set Box 1 image as permanent default!");
      setTimeout(() => setAdvertNotice((curr) => (curr?.includes("Set Box 1 image") ? null : curr)), 3000);
      return;
    }

    const img = new Image();
    if (sourceImg.startsWith("http://") || sourceImg.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      let cols = 3;
      let rows = 3;
      let targetBoxes: number[] = [];

      if (numBoxes === 9) {
        cols = 3; rows = 3;
        targetBoxes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      } else if (numBoxes === 8) {
        cols = 3; rows = 3;
        targetBoxes = [1, 2, 3, 4, 5, 6, 7, 8];
      } else if (numBoxes === 7) {
        cols = 3; rows = 3;
        targetBoxes = [1, 2, 3, 4, 5, 6, 7];
      } else if (numBoxes === 6) {
        cols = 3; rows = 2;
        targetBoxes = [1, 2, 3, 4, 5, 6];
      } else if (numBoxes === 5) {
        cols = 3; rows = 2;
        targetBoxes = [1, 2, 3, 4, 5];
      } else if (numBoxes === 4) {
        cols = 2; rows = 2;
        targetBoxes = [1, 2, 4, 5];
      } else {
        cols = 3; rows = 3;
        targetBoxes = Array.from({ length: numBoxes }, (_, i) => i + 1);
      }

      const pieceW = img.naturalWidth / cols;
      const pieceH = img.naturalHeight / rows;
      const canvas = document.createElement("canvas");
      canvas.width = pieceW;
      canvas.height = pieceH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const newDefaults: Record<number, string> = {};
      let boxIndex = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (boxIndex >= targetBoxes.length) break;
          const boxId = targetBoxes[boxIndex];
          ctx.clearRect(0, 0, pieceW, pieceH);
          ctx.drawImage(img, c * pieceW, r * pieceH, pieceW, pieceH, 0, 0, pieceW, pieceH);
          newDefaults[boxId] = canvas.toDataURL("image/jpeg", 0.9);
          boxIndex++;
        }
      }

      const finalDefaults: Record<number, string> = {};
      for (let i = 1; i <= 9; i++) {
        finalDefaults[i] = newDefaults[i] || "";
      }

      setBoxImages(prev => ({ ...prev, ...finalDefaults }));
      setDefaultBoxImages(finalDefaults);
      setUserDefault3x3Image(sourceImg);
      updateOriginalSpreadImage(sourceImg);
      try {
        remoteStore.setItem("seqcarver_user_default_3x3_image", sourceImg);
        remoteStore.setItem("seqcarver_json_defaultBoxImages", JSON.stringify(finalDefaults));
        remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(finalDefaults));
        remoteStore.setItem("seqcarver_defaultBox1Image", finalDefaults[1] || sourceImg);
        remoteStore.setItem("seqcarver_originalSpreadImage", sourceImg);
        saveStoredDefaultImage("user_default_3x3_image", sourceImg).catch(console.warn);
        saveStoredJson("defaultBoxImages", finalDefaults).catch(console.warn);
        saveStoredJson("boxImages", finalDefaults).catch(console.warn);
        saveStoredDefaultImage("defaultBox1Image", finalDefaults[1] || sourceImg).catch(console.warn);
        saveStoredDefaultImage("originalSpreadImage", sourceImg).catch(console.warn);
      } catch (err) {
        console.warn("Failed to save defaults", err);
      }
      saveCurrentAsDefault(undefined, undefined, {
        boxLinkConfigs,
        boxRotationSeries,
        boxRotationIntervals,
        boxRotationActive,
        disableBoxActions,
        defaultBoxImages: finalDefaults,
        boxImages: finalDefaults,
        originalSpreadImage: sourceImg,
        defaultBox1Image: finalDefaults[1] || sourceImg,
        userDefault3x3Image: sourceImg,
      });
      setAdvertNotice(`✓ Set ${numBoxes}-tile spread as persistent default!`);
      setTimeout(() => setAdvertNotice((curr) => (curr?.includes("default") ? null : curr)), 3000);
    };
    img.src = sourceImg;
  }, [
    boxImages,
    originalSpreadImage,
    updateOriginalSpreadImage,
    boxLinkConfigs,
    boxRotationSeries,
    boxRotationIntervals,
    boxRotationActive,
    disableBoxActions,
    saveCurrentAsDefault,
  ]);

  const handleSet9BoxDefault = useCallback((imageUrl?: string) => {
    handleSetNBoxDefault(imageUrl, 9);
  }, [handleSetNBoxDefault]);

  const handleSaveAllTileLinkConfigs = useCallback((updatedConfigs: Record<number, TileLinkConfig>) => {
    setBoxLinkConfigs(updatedConfigs);
    try {
      remoteStore.setItem("seqcarver_json_boxLinkConfigs", JSON.stringify(updatedConfigs));
      saveStoredJson("boxLinkConfigs", updatedConfigs).catch(console.warn);
    } catch (err) {
      console.warn("Failed to save boxLinkConfigs", err);
    }
  }, []);

  const handleCustomSpread = useCallback((selectedBoxes: number[], imageUrl: string, filter?: string, stretchX: number = 1.0, stretchY: number = 1.0, gridCols?: 2 | 3 | 4) => {
    if (!imageUrl || selectedBoxes.length === 0) return;

    const effectiveCols: 2 | 3 | 4 =
      gridCols ?? (selectedBoxes.some((b) => b > 9) ? 4 : 3);
    const cols = effectiveCols;
    const rows = effectiveCols;
    const totalGridSlots = cols * rows;

    const img = new Image();
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }

    const processSlices = () => {
      const pieceW = Math.max(1, Math.floor(img.naturalWidth / cols));
      const pieceH = Math.max(1, Math.floor(img.naturalHeight / rows));

      const canvas = document.createElement("canvas");
      canvas.width = pieceW;
      canvas.height = pieceH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (filter && filter !== "none") {
        ctx.filter = filter;
      }

      const updates: Record<number, string> = {};
      const safeStretchX = stretchX > 0 ? stretchX : 1.0;
      const safeStretchY = stretchY > 0 ? stretchY : 1.0;

      selectedBoxes.forEach((boxId) => {
        if (boxId < 1 || boxId > totalGridSlots) return;
        const idx = boxId - 1;
        const c = idx % cols;
        const r = Math.floor(idx / cols);

        const srcW = pieceW / safeStretchX;
        const srcH = pieceH / safeStretchY;
        const sourceX =
          img.naturalWidth / 2 + (c * pieceW - img.naturalWidth / 2) / safeStretchX;
        const sourceY =
          img.naturalHeight / 2 + (r * pieceH - img.naturalHeight / 2) / safeStretchY;

        ctx.clearRect(0, 0, pieceW, pieceH);
        ctx.drawImage(img, sourceX, sourceY, srcW, srcH, 0, 0, pieceW, pieceH);

        updates[boxId] = canvas.toDataURL("image/jpeg", 0.9);
      });

      const finalBoxes: Record<number, string> = {};
      for (let i = 1; i <= 16; i++) {
        finalBoxes[i] =
          i <= totalGridSlots && selectedBoxes.includes(i) ? updates[i] || "" : "";
      }

      if (effectiveCols === 4 && frontPageGridMode !== "4x4") {
        handleToggleFrontPageGridMode("4x4");
      } else if (effectiveCols === 3 && frontPageGridMode === "4x4") {
        handleToggleFrontPageGridMode("3x3");
      }

      setBoxImages(finalBoxes);
      setDefaultBoxImages(finalBoxes);
      try {
        remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(finalBoxes));
        remoteStore.setItem("seqcarver_json_defaultBoxImages", JSON.stringify(finalBoxes));
        remoteStore.setItem("seqcarver_originalSpreadImage", imageUrl);
        if (finalBoxes[1]) {
          remoteStore.setItem("seqcarver_defaultBox1Image", finalBoxes[1]);
        }
        saveStoredJson("boxImages", finalBoxes).catch(console.warn);
        saveStoredJson("defaultBoxImages", finalBoxes).catch(console.warn);
        saveStoredDefaultImage("originalSpreadImage", imageUrl).catch(console.warn);
      } catch (err) {
        console.warn("Failed to persist custom spread to storage", err);
      }
      updateOriginalSpreadImage(imageUrl);
      setCustomSpreadImageUrl(imageUrl);
      saveCurrentAsDefault(undefined, undefined, {
        boxLinkConfigs,
        boxRotationSeries,
        boxRotationIntervals,
        boxRotationActive,
        disableBoxActions,
        defaultBoxImages: finalBoxes,
        boxImages: finalBoxes,
        originalSpreadImage: imageUrl,
      });
      setAdvertNotice(`✓ Applied custom spread to ${selectedBoxes.length} front page panels!`);
      setTimeout(() => setAdvertNotice((curr) => (curr?.includes("Applied custom spread") ? null : curr)), 3000);
    };

    if (img.complete && img.naturalWidth > 0) {
      processSlices();
    } else {
      img.onload = processSlices;
    }
    img.src = imageUrl;
  }, [updateOriginalSpreadImage, saveCurrentAsDefault, boxLinkConfigs, boxRotationSeries, boxRotationIntervals, boxRotationActive, disableBoxActions, frontPageGridMode, handleToggleFrontPageGridMode]);

  const [storyboardPickerBoxId, setStoryboardPickerBoxId] = useState<number | null>(null);

  const handleBoxImageUpload = useCallback((boxId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result?.toString() || "";
        setBoxImages((prev) => ({ ...prev, [boxId]: result }));
        if (boxId === 1) {
          updateOriginalSpreadImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  }, [updateOriginalSpreadImage]);

  // Front Page Advert Panels: Drag-and-drop & swap state
  const [draggedBoxId, setDraggedBoxId] = useState<number | null>(null);
  const [dragOverBoxId, setDragOverBoxId] = useState<number | null>(null);
  const [swapSelectedBoxId, setSwapSelectedBoxId] = useState<number | null>(null);
  const [lastSwappedPair, setLastSwappedPair] = useState<{ a: number; b: number } | null>(null);
  const [advertNotice, setAdvertNotice] = useState<string | null>(null);

  const handleSwapBoxPanels = useCallback((sourceId: number, targetId: number) => {
    if (sourceId === targetId || sourceId < 1 || sourceId > 9 || targetId < 1 || targetId > 9) return;

    // Swap images in boxImages
    setBoxImages((prev) => {
      const sourceImg = prev[sourceId] || "";
      const targetImg = prev[targetId] || "";
      const updated = {
        ...prev,
        [sourceId]: targetImg,
        [targetId]: sourceImg,
      };
      if (sourceId === 1 && targetImg) {
        updateOriginalSpreadImage(targetImg);
      } else if (targetId === 1 && sourceImg) {
        updateOriginalSpreadImage(sourceImg);
      }
      return updated;
    });

    // Swap rotation series
    setBoxRotationSeries((prev) => ({
      ...prev,
      [sourceId]: prev[targetId] || [],
      [targetId]: prev[sourceId] || [],
    }));

    // Swap rotation intervals
    setBoxRotationIntervals((prev) => ({
      ...prev,
      [sourceId]: prev[targetId] ?? 3,
      [targetId]: prev[sourceId] ?? 3,
    }));

    // Swap rotation active status
    setBoxRotationActive((prev) => ({
      ...prev,
      [sourceId]: !!prev[targetId],
      [targetId]: !!prev[sourceId],
    }));

    // Swap rotation indexes
    setBoxRotationIndex((prev) => ({
      ...prev,
      [sourceId]: prev[targetId] ?? 0,
      [targetId]: prev[sourceId] ?? 0,
    }));

    // Swap link configurations
    setBoxLinkConfigs((prev) => ({
      ...prev,
      [sourceId]: prev[targetId] ? { ...prev[targetId] } : { url: "", target: "_blank", hoverEffect: "none" },
      [targetId]: prev[sourceId] ? { ...prev[sourceId] } : { url: "", target: "_blank", hoverEffect: "none" },
    }));

    // If defaultBoxImages exists, swap those as well
    setDefaultBoxImages((prev) => {
      if (!prev || Object.keys(prev).length === 0) return prev;
      return {
        ...prev,
        [sourceId]: prev[targetId] || "",
        [targetId]: prev[sourceId] || "",
      };
    });

    setLastSwappedPair({ a: sourceId, b: targetId });
    setSwapSelectedBoxId(null);
    setDraggedBoxId(null);
    setDragOverBoxId(null);

    setAdvertNotice("✓ Swapped panels!");
    setTimeout(() => {
      setAdvertNotice((curr) => (curr?.includes("Swapped panels") ? null : curr));
    }, 3500);
  }, [updateOriginalSpreadImage]);

  const handleSelectPanelForSwap = useCallback((boxId: number) => {
    if (swapSelectedBoxId === null) {
      setSwapSelectedBoxId(boxId);
      setAdvertNotice("Panel selected. Drop onto or click another panel to swap!");
    } else if (swapSelectedBoxId === boxId) {
      setSwapSelectedBoxId(null);
      setAdvertNotice(null);
    } else {
      handleSwapBoxPanels(swapSelectedBoxId, boxId);
    }
  }, [swapSelectedBoxId, handleSwapBoxPanels]);

  const handleUndoSwap = useCallback(() => {
    if (lastSwappedPair) {
      handleSwapBoxPanels(lastSwappedPair.a, lastSwappedPair.b);
      setLastSwappedPair(null);
      setAdvertNotice("✓ Reverted panel swap");
      setTimeout(() => {
        setAdvertNotice((curr) => (curr?.includes("Reverted panel swap") ? null : curr));
      }, 3000);
    }
  }, [lastSwappedPair, handleSwapBoxPanels]);

  const handleSplitImageToNBoxes = useCallback((imageUrl?: string, numBoxes: number = 9) => {
    let sourceImg = imageUrl || boxImages[1] || originalSpreadImage || eurospectImg;
    if (imageUrl) {
      sourceImg = imageUrl;
      updateOriginalSpreadImage(imageUrl);
    }
    if (!sourceImg) return;
    const img = new Image();
    if (sourceImg.startsWith("http://") || sourceImg.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    const processSplit = () => {
      let cols = 3;
      let rows = 3;
      let targetBoxes: number[] = [];

      if (numBoxes === 9) {
        cols = 3; rows = 3;
        targetBoxes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      } else if (numBoxes === 8) {
        cols = 3; rows = 3;
        targetBoxes = [1, 2, 3, 4, 5, 6, 7, 8];
      } else if (numBoxes === 7) {
        cols = 3; rows = 3;
        targetBoxes = [1, 2, 3, 4, 5, 6, 7];
      } else if (numBoxes === 6) {
        cols = 3; rows = 2;
        targetBoxes = [1, 2, 3, 4, 5, 6];
      } else if (numBoxes === 5) {
        cols = 3; rows = 2;
        targetBoxes = [1, 2, 3, 4, 5];
      } else if (numBoxes === 4) {
        cols = 2; rows = 2;
        targetBoxes = [1, 2, 4, 5];
      } else if (numBoxes === 16) {
        cols = 4; rows = 4;
        targetBoxes = Array.from({ length: 16 }, (_, i) => i + 1);
      } else if (numBoxes === 12) {
        cols = 4; rows = 3;
        targetBoxes = Array.from({ length: 12 }, (_, i) => i + 1);
      } else {
        cols = 3; rows = 3;
        targetBoxes = Array.from({ length: numBoxes }, (_, i) => i + 1);
      }

      const pieceW = img.naturalWidth / cols;
      const pieceH = img.naturalHeight / rows;
      const canvas = document.createElement("canvas");
      canvas.width = pieceW;
      canvas.height = pieceH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const newBoxes: Record<number, string> = {};
      let boxIndex = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (boxIndex >= targetBoxes.length) break;
          const boxId = targetBoxes[boxIndex];
          ctx.clearRect(0, 0, pieceW, pieceH);
          ctx.drawImage(img, c * pieceW, r * pieceH, pieceW, pieceH, 0, 0, pieceW, pieceH);
          newBoxes[boxId] = canvas.toDataURL("image/png");
          boxIndex++;
        }
      }

      const finalBoxes: Record<number, string> = {};
      const maxBoxes = Math.max(numBoxes, 9);
      for (let i = 1; i <= maxBoxes; i++) {
        finalBoxes[i] = newBoxes[i] || "";
      }

      if (numBoxes === 16) {
        setFrontPageGridMode("4x4");
        try {
          remoteStore.setItem("seqcarver_frontPageGridMode", "4x4");
        } catch {}
      }

      setBoxImages(finalBoxes);
      setDefaultBoxImages(finalBoxes);
      try {
        remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(finalBoxes));
        remoteStore.setItem("seqcarver_json_defaultBoxImages", JSON.stringify(finalBoxes));
        remoteStore.setItem("seqcarver_originalSpreadImage", sourceImg);
        if (finalBoxes[1]) {
          remoteStore.setItem("seqcarver_defaultBox1Image", finalBoxes[1]);
        }
        saveStoredJson("boxImages", finalBoxes).catch(console.warn);
        saveStoredJson("defaultBoxImages", finalBoxes).catch(console.warn);
        saveStoredDefaultImage("originalSpreadImage", sourceImg).catch(console.warn);
      } catch (err) {
        console.warn("Failed to persist split images to storage", err);
      }

      saveCurrentAsDefault(undefined, undefined, {
        boxLinkConfigs,
        boxRotationSeries,
        boxRotationIntervals,
        boxRotationActive,
        disableBoxActions,
        defaultBoxImages: finalBoxes,
        boxImages: finalBoxes,
        originalSpreadImage: sourceImg,
      });

      setAdvertNotice(`✓ Applied ${numBoxes}-panel spread directly to Front Page!`);
      setTimeout(() => setAdvertNotice((curr) => (curr?.includes("Applied") ? null : curr)), 3000);
    };

    if (img.complete && img.naturalWidth > 0) {
      processSplit();
    } else {
      img.onload = processSplit;
    }
    img.src = sourceImg;
  }, [boxImages, originalSpreadImage, updateOriginalSpreadImage, saveCurrentAsDefault, boxLinkConfigs, boxRotationSeries, boxRotationIntervals, boxRotationActive, disableBoxActions]);

  const handleSplitImageTo9Boxes = useCallback((imageUrl?: string) => {
    handleSplitImageToNBoxes(imageUrl, 9);
  }, [handleSplitImageToNBoxes]);

  const handleReset9BoxDefault = useCallback(() => {
    if (frontPageGridMode === "4x4") {
      const defaultToUse = userDefault3x3Image || originalSpreadImage || boxImages[1] || DEFAULT_FRONT_PAGE_IMAGE;
      handleSplitImageToNBoxes(defaultToUse, 16);
      setSwapSelectedBoxId(null);
      setLastSwappedPair(null);
      setAdvertNotice("✓ Restored 4×4 layout to default 16-panel spread!");
      setTimeout(() => setAdvertNotice(null), 3000);
      return;
    }

    // If user has saved multiple default box tiles, restore them directly
    if (defaultBoxImages && Object.keys(defaultBoxImages).length > 1 && Object.values(defaultBoxImages).some(Boolean)) {
      setBoxImages(defaultBoxImages);
      setSwapSelectedBoxId(null);
      setLastSwappedPair(null);
      setBoxRotationSeries({ 1: [], 9: [] });
      setBoxRotationIntervals({ 1: 3, 9: 3 });
      setBoxRotationActive({ 1: false, 9: false });
      setBoxRotationIndex({ 1: 0, 9: 0 });
      setBoxLinkConfigs({});
      setDisableBoxActions(true);
      try {
        remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(defaultBoxImages));
        saveStoredJson("boxImages", defaultBoxImages).catch(console.warn);
      } catch {}
      setAdvertNotice("✓ Restored 3x3 layout to your saved default tiles!");
      setTimeout(() => setAdvertNotice(null), 3000);
      return;
    }

    const defaultToUse = userDefault3x3Image || originalSpreadImage || boxImages[1] || DEFAULT_FRONT_PAGE_IMAGE;
    const img = new Image();
    if (defaultToUse.startsWith("http://") || defaultToUse.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    const processReset = () => {
      const cols = 3;
      const rows = 3;
      const pieceW = img.naturalWidth / cols;
      const pieceH = img.naturalHeight / rows;
      const canvas = document.createElement("canvas");
      canvas.width = pieceW;
      canvas.height = pieceH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const slices: Record<number, string> = {};
      let boxIndex = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.clearRect(0, 0, pieceW, pieceH);
          ctx.drawImage(img, c * pieceW, r * pieceH, pieceW, pieceH, 0, 0, pieceW, pieceH);
          slices[boxIndex] = canvas.toDataURL("image/jpeg", 0.9);
          boxIndex++;
        }
      }

      setBoxImages(slices);
      setDefaultBoxImages(slices);
      updateOriginalSpreadImage(defaultToUse);
      setSwapSelectedBoxId(null);
      setLastSwappedPair(null);
      setBoxRotationSeries({ 1: [], 9: [] });
      setBoxRotationIntervals({ 1: 3, 9: 3 });
      setBoxRotationActive({ 1: false, 9: false });
      setBoxRotationIndex({ 1: 0, 9: 0 });
      setBoxLinkConfigs({});
      setDisableBoxActions(true);

      try {
        remoteStore.setItem("seqcarver_json_defaultBoxImages", JSON.stringify(slices));
        remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(slices));
        remoteStore.setItem("seqcarver_originalSpreadImage", defaultToUse);
        remoteStore.setItem("seqcarver_defaultBox1Image", slices[1] || defaultToUse);
        remoteStore.setItem("seqcarver_user_default_3x3_image", defaultToUse);
        remoteStore.removeItem("seqcarver_json_boxRotationSeries");
        remoteStore.removeItem("seqcarver_json_boxRotationIntervals");
        remoteStore.removeItem("seqcarver_json_boxRotationActive");
        remoteStore.removeItem("seqcarver_json_boxLinkConfigs");
        remoteStore.removeItem("seqcarver_disableBoxActions");

        saveStoredJson("defaultBoxImages", slices).catch(console.warn);
        saveStoredJson("boxImages", slices).catch(console.warn);
        saveStoredDefaultImage("originalSpreadImage", defaultToUse).catch(console.warn);
        saveStoredDefaultImage("defaultBox1Image", slices[1] || defaultToUse).catch(console.warn);
        saveStoredDefaultImage("user_default_3x3_image", defaultToUse).catch(console.warn);
        clearStoredJson("boxRotationSeries").catch(console.warn);
        clearStoredJson("boxRotationIntervals").catch(console.warn);
        clearStoredJson("boxRotationActive").catch(console.warn);
        clearStoredJson("boxLinkConfigs").catch(console.warn);
      } catch (e) {
        console.warn("Failed clearing local advert overrides:", e);
      }

      saveCurrentAsDefault(undefined, undefined, {
        boxLinkConfigs: {},
        boxRotationSeries: { 1: [], 9: [] },
        boxRotationIntervals: { 1: 3, 9: 3 },
        boxRotationActive: { 1: false, 9: false },
        disableBoxActions: true,
        defaultBoxImages: slices,
        boxImages: slices,
        originalSpreadImage: defaultToUse,
        defaultBox1Image: slices[1] || defaultToUse,
        userDefault3x3Image: defaultToUse,
      });

      setAdvertNotice("✓ Reset 3x3 advert panels to default layout!");
      setTimeout(() => {
        setAdvertNotice((curr) => (curr?.includes("default layout") ? null : curr));
      }, 4000);
    };

    if (img.complete && img.naturalWidth > 0) {
      processReset();
    } else {
      img.onload = processReset;
    }
    img.src = defaultToUse;
  }, [defaultBoxImages, userDefault3x3Image, originalSpreadImage, boxImages, updateOriginalSpreadImage, saveCurrentAsDefault]);

  const handleSavePresentAdvertStateAsDefault = useCallback(() => {
    const activeImage = boxImages[1] || originalSpreadImage || userDefault3x3Image || eurospectImg;
    const newDefaults: Record<number, string> = { ...boxImages };

    setDefaultBoxImages(newDefaults);
    if (activeImage) {
      setUserDefault3x3Image(activeImage);
      updateOriginalSpreadImage(activeImage);
    }

    // Register front page with panel controls closed
    setIsBottomControlBarVisible(false);

    try {
      remoteStore.setItem("seqcarver_eye_panel_open", "false");
      remoteStore.setItem("seqcarver_ad_slide_menu_open", "false");
      if (activeImage) {
        remoteStore.setItem("seqcarver_user_default_3x3_image", activeImage);
        saveStoredDefaultImage("user_default_3x3_image", activeImage).catch(console.warn);
      }
      remoteStore.setItem("seqcarver_json_defaultBoxImages", JSON.stringify(newDefaults));
      remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(newDefaults));
      remoteStore.setItem("seqcarver_originalSpreadImage", activeImage);
      remoteStore.setItem("seqcarver_defaultBox1Image", activeImage);
      remoteStore.setItem("seqcarver_json_boxRotationSeries", JSON.stringify(boxRotationSeries));
      remoteStore.setItem("seqcarver_json_boxRotationIntervals", JSON.stringify(boxRotationIntervals));
      remoteStore.setItem("seqcarver_json_boxRotationActive", JSON.stringify(boxRotationActive));
      remoteStore.setItem("seqcarver_json_boxLinkConfigs", JSON.stringify(boxLinkConfigs));
      remoteStore.setItem("seqcarver_disableBoxActions", JSON.stringify(disableBoxActions));

      saveStoredJson("defaultBoxImages", newDefaults).catch(console.warn);
      saveStoredJson("boxImages", newDefaults).catch(console.warn);
      saveStoredJson("boxRotationSeries", boxRotationSeries).catch(console.warn);
      saveStoredJson("boxRotationIntervals", boxRotationIntervals).catch(console.warn);
      saveStoredJson("boxRotationActive", boxRotationActive).catch(console.warn);
      saveStoredJson("boxLinkConfigs", boxLinkConfigs).catch(console.warn);
      if (activeImage) {
        saveStoredDefaultImage("defaultBox1Image", activeImage).catch(console.warn);
        saveStoredDefaultImage("originalSpreadImage", activeImage).catch(console.warn);
      }
    } catch (e) {
      console.warn("Failed saving advert default images locally:", e);
    }

    saveCurrentAsDefault(undefined, undefined, {
      boxLinkConfigs,
      boxRotationSeries,
      boxRotationIntervals,
      boxRotationActive,
      disableBoxActions,
      defaultBoxImages: newDefaults,
      boxImages: newDefaults,
      originalSpreadImage: activeImage,
      defaultBox1Image: activeImage,
      userDefault3x3Image: activeImage,
      isBottomControlBarVisible: false,
      seqcarver_eye_panel_open: "false",
      seqcarver_ad_slide_menu_open: "false",
      panelControlsOrder: pruneAndCanonicalizePanelControlsOrder(panelControlsOrder),
    });

    setAdvertNotice("✓ Saved present advert panel state & active image as permanent baseline default with panel controls closed!");
    setTimeout(() => {
      setAdvertNotice((curr) => (curr?.includes("Saved present advert panel") ? null : curr));
    }, 4500);
  }, [
    originalSpreadImage,
    boxImages,
    userDefault3x3Image,
    boxLinkConfigs,
    boxRotationSeries,
    boxRotationIntervals,
    boxRotationActive,
    disableBoxActions,
    saveCurrentAsDefault,
    updateOriginalSpreadImage,
  ]);

  const handleLoadPresentImageAsDefault4x4 = useCallback((sourceImageUrl?: string) => {
    const activeImage = sourceImageUrl || originalSpreadImage || boxImages[1] || userDefault3x3Image || DEFAULT_FRONT_PAGE_IMAGE;
    handleSplitImageToNBoxes(activeImage, 16);
    setFrontPageGridMode("4x4");
    setIsBottomControlBarVisible(false);
    setIsSlideMenuOpen(false);
    try {
      remoteStore.setItem("seqcarver_frontPageGridMode", "4x4");
      remoteStore.setItem("seqcarver_originalSpreadImage", activeImage);
      remoteStore.setItem("seqcarver_user_defined_master_image", activeImage);
      remoteStore.setItem("seqcarver_user_default_3x3_image", activeImage);
      remoteStore.setItem("seqcarver_eye_panel_open", "false");
      remoteStore.setItem("seqcarver_ad_slide_menu_open", "false");
    } catch {}
    saveUserDefinedMasterImage(activeImage).catch(console.warn);
    setAdvertNotice("✓ Loaded present image as default 4×4 matrix (16 panels) with panel controls closed!");
    setTimeout(() => {
      setAdvertNotice((curr) => (curr?.includes("default 4×4") ? null : curr));
    }, 4000);
  }, [originalSpreadImage, boxImages, userDefault3x3Image, handleSplitImageToNBoxes]);

  const handleSetPresentImageAsUserDefinedDefault = useCallback(async (sourceImageUrl?: string) => {
    const activeImage = sourceImageUrl || originalSpreadImage || imageSrc || userDefault3x3Image || DEFAULT_FRONT_PAGE_IMAGE;
    if (!activeImage) return;
    setUserDefault3x3Image(activeImage);
    setOriginalSpreadImage(activeImage);
    await saveUserDefinedMasterImage(activeImage);
    handleSplitImageToNBoxes(activeImage, 16);
    setFrontPageGridMode("4x4");
    setIsBottomControlBarVisible(false);
    setIsSlideMenuOpen(false);
    try {
      remoteStore.setItem("seqcarver_frontPageGridMode", "4x4");
      remoteStore.setItem("seqcarver_originalSpreadImage", activeImage);
      remoteStore.setItem("seqcarver_user_defined_master_image", activeImage);
      remoteStore.setItem("seqcarver_user_default_3x3_image", activeImage);
      remoteStore.setItem("seqcarver_eye_panel_open", "false");
      remoteStore.setItem("seqcarver_ad_slide_menu_open", "false");
    } catch {}
    setAdvertNotice("✓ Saved present image as permanent User Defined Default! All resets will restore this image.");
    setTimeout(() => {
      setAdvertNotice((curr) => (curr?.includes("permanent User Defined") ? null : curr));
    }, 4000);
  }, [originalSpreadImage, imageSrc, userDefault3x3Image, handleSplitImageToNBoxes]);

  const handleResetToUserDefinedImage = useCallback(async () => {
    const masterImg = await getUserDefinedMasterImage();
    const finalImage = masterImg || DEFAULT_FRONT_PAGE_IMAGE;
    setUserDefault3x3Image(finalImage);
    setOriginalSpreadImage(finalImage);
    setImageSrc(finalImage);
    handleSplitImageToNBoxes(finalImage, frontPageGridMode === "4x4" ? 16 : 9);
    setAdvertNotice("✓ Reset to user defined image successfully across all panels!");
    setTimeout(() => {
      setAdvertNotice((curr) => (curr?.includes("user defined image") ? null : curr));
    }, 4000);
  }, [frontPageGridMode, handleSplitImageToNBoxes]);

  // Seed default 16-box spread on initial mount (Load present image as default 4x4)
  const hasInitializedBoxImagesRef = useRef(false);
  useEffect(() => {
    if (hasInitializedBoxImagesRef.current) return;
    hasInitializedBoxImagesRef.current = true;

    // Ensure front page grid mode is 4x4 by default
    setFrontPageGridMode("4x4");
    try {
      remoteStore.setItem("seqcarver_frontPageGridMode", "4x4");
    } catch {}

    const storedBoxes = remoteStore.getItem("seqcarver_json_boxImages");
    let hasComplete16Spread = false;
    if (storedBoxes) {
      try {
        const parsed = JSON.parse(storedBoxes);
        if (parsed && typeof parsed === "object") {
          const count = Object.keys(parsed).filter((k) => Number(k) >= 1 && Number(k) <= 16 && Boolean(parsed[k])).length;
          if (count === 16) {
            hasComplete16Spread = true;
          }
        }
      } catch {}
    }

    getUserDefinedMasterImage().then((masterImg) => {
      const activeMaster = masterImg || userDefault3x3Image || originalSpreadImage || DEFAULT_FRONT_PAGE_IMAGE;
      if (activeMaster && !activeMaster.includes("source-01.jpg") && !activeMaster.includes("eurospect_header")) {
        setUserDefault3x3Image(activeMaster);
        setOriginalSpreadImage(activeMaster);
        if (!hasComplete16Spread) {
          handleSplitImageToNBoxes(activeMaster, 16);
        }
      } else if (!hasComplete16Spread) {
        handleSplitImageToNBoxes(activeMaster, 16);
      }
    });
  }, [handleSplitImageToNBoxes, userDefault3x3Image, originalSpreadImage]);

  // Automatically recall all default settings, 3x3 layout, and images from Firestore after login
  useEffect(() => {
    const handleAuthDefaultsRecalled = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const user = customEvent.detail?.user;
      console.info("Auth defaults recalled event received in App.tsx for user:", user?.email);

      try {
        const [cloudUserDef, cloudSpread, cloudB1, cloudBoxImages, cloudDefaultBoxes, cloudLinkConfigs] =
          await Promise.all([
            getStoredDefaultImage("user_default_3x3_image").catch(() => null),
            getStoredDefaultImage("originalSpreadImage").catch(() => null),
            getStoredDefaultImage("defaultBox1Image").catch(() => null),
            getStoredJson<Record<number, string>>("boxImages").catch(() => null),
            getStoredJson<Record<number, string>>("defaultBoxImages").catch(() => null),
            getStoredJson<Record<number, TileLinkConfig>>("boxLinkConfigs").catch(() => null),
          ]);

        if (cloudUserDef) {
          setUserDefault3x3Image(cloudUserDef);
          try {
            remoteStore.setItem("seqcarver_user_default_3x3_image", cloudUserDef);
          } catch {}
        }
        if (cloudSpread) {
          setOriginalSpreadImage(cloudSpread);
          try {
            remoteStore.setItem("seqcarver_originalSpreadImage", cloudSpread);
          } catch {}
        }
        if (cloudBoxImages && typeof cloudBoxImages === "object" && Object.values(cloudBoxImages).some(Boolean)) {
          setBoxImages((prev) => ({ ...prev, ...cloudBoxImages }));
          try {
            remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(cloudBoxImages));
          } catch {}
        }
        if (cloudDefaultBoxes && typeof cloudDefaultBoxes === "object" && Object.values(cloudDefaultBoxes).some(Boolean)) {
          setDefaultBoxImages(cloudDefaultBoxes);
          try {
            remoteStore.setItem("seqcarver_json_defaultBoxImages", JSON.stringify(cloudDefaultBoxes));
          } catch {}
        } else if (cloudUserDef) {
          setDefaultBoxImages({ 1: cloudUserDef });
        }
        if (cloudB1) {
          try {
            remoteStore.setItem("seqcarver_defaultBox1Image", cloudB1);
          } catch {}
        }
        if (cloudLinkConfigs) {
          setBoxLinkConfigs(cloudLinkConfigs);
        }

        setAdvertNotice(`✓ Recalled 3x3 advert layout and default settings from database for ${user?.email || "user"}!`);
        setTimeout(() => setAdvertNotice(null), 4000);
      } catch (err) {
        console.warn("Failed recalling 3x3 defaults upon auth in App.tsx:", err);
      }
    };

    window.addEventListener("seqcarver:auth-defaults-recalled", handleAuthDefaultsRecalled);
    return () => window.removeEventListener("seqcarver:auth-defaults-recalled", handleAuthDefaultsRecalled);
  }, []);

  const handleUploadAndSpreadTo9Boxes = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result?.toString() || "";
        if (result) {
          updateOriginalSpreadImage(result);
          handleSplitImageTo9Boxes(result);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  }, [handleSplitImageTo9Boxes, updateOriginalSpreadImage]);

  const handleSendBoxImageToCarver = useCallback((imageUrl: string) => {
    if (!imageUrl) return;
    setImageSrc(imageUrl);
    setCroppedImageSrc(imageUrl);
    setCrop(undefined);
    setCompletedPercentCrop(null);
    setMode("crop");
  }, []);

  // Crop State
  const [originalImageSrc, setOriginalImageSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedPercentCrop, setCompletedPercentCrop] = useState<Crop | null>(
    null
  );
  const [completedPixelCrop, setCompletedPixelCrop] = useState<Crop | null>(
    null
  );
  const [cropAspect, setCropAspect] = useState<number | undefined>(undefined);
  const [isCircularCrop, setIsCircularCrop] = useState<boolean>(false);
  const [cropNotice, setCropNotice] = useState<string | null>(null);
  const [multiCrops, setMultiCrops] = useState<{ id: string; crop: Crop; isCircular: boolean }[]>([]);
  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);

  // Crop Grid Mesh Tool State
  const [isMeshToolActive, setIsMeshToolActive] = useState<boolean>(false);
  const [meshMode, setMeshMode] = useState<"uniform" | "freestyle">("uniform");
  const [meshBounds, setMeshBounds] = useState<MeshBounds>({
    x: 15,
    y: 15,
    width: 70,
    height: 70,
  });
  const [meshSquareSize, setMeshSquareSize] = useState<number>(64);
  const [meshDestination, setMeshDestination] = useState<"storyboard-slices" | "storyboard-slots" | "multi-crops">("storyboard-slices");
  const [meshGridLineWidth, setMeshGridLineWidth] = useState<number>(2);
  const [meshGridLineColor, setMeshGridLineColor] = useState<string>("#10b981");
  const [meshAutoGotoAfterCut, setMeshAutoGotoAfterCut] = useState<boolean>(false);

  // Freestyle Squares State
  const [isAdjustingGridLines, setIsAdjustingGridLines] = useState<boolean>(false);
  const [freestyleSquares, setFreestyleSquares] = useState<FreestyleSquare[]>([]);
  const [selectedFreestyleSquareIds, setSelectedFreestyleSquareIds] = useState<string[]>([]);
  const [freestyleTool, setFreestyleTool] = useState<"select" | "rect" | "angled" | "trapeze">("select");
  const [activeTrapezePreset, setActiveTrapezePreset] = useState<string>("isosceles");
  const [activePolygonPoints, setActivePolygonPoints] = useState<FreestylePoint[]>([]);
  const [isTrapezePresetMenuOpen, setIsTrapezePresetMenuOpen] = useState<boolean>(false);

  // Primary selected square ID (last selected, or null)
  const selectedFreestyleSquareId = selectedFreestyleSquareIds[selectedFreestyleSquareIds.length - 1] || null;
  const setSelectedFreestyleSquareId = useCallback((id: string | null) => {
    setSelectedFreestyleSquareIds(id ? [id] : []);
  }, []);

  // Ref to the live preview component in the sidebar for auto-scrolling
  const freestyleSlicePreviewRef = useRef<HTMLDivElement>(null);

  // Jump/scroll left sidebar directly into view of the live preview
  const handleJumpToSidebarLivePreview = useCallback(() => {
    if (freestyleSlicePreviewRef.current) {
      freestyleSlicePreviewRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, []);

  // Auto snap to live preview on the left if selected slice changes
  useEffect(() => {
    if (selectedFreestyleSquareId && freestyleSlicePreviewRef.current) {
      freestyleSlicePreviewRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedFreestyleSquareId]);

  // Collapsible section states in Mesh Grid Tool Panel
  const [isMeshAppearanceOpen, setIsMeshAppearanceOpen] = useState<boolean>(false);
  const [isMeshIndividualSizingOpen, setIsMeshIndividualSizingOpen] = useState<boolean>(true);
  const [isMeshImageInfoOpen, setIsMeshImageInfoOpen] = useState<boolean>(false);

  // Helper to initialize 1 default freestyle square on first click / activation
  const handleInitializeDefaultFreestyleSquares = useCallback(() => {
    const naturalW = imgRef.current?.naturalWidth || 800;
    const naturalH = imgRef.current?.naturalHeight || 600;

    // 1 default square centered across the image area
    const sqWidth = 28; // 28%
    const sqHeight = 32; // 32%
    const startX = 36; // 36% centered
    const topY = 34; // 34% centered

    const defaultSquares: FreestyleSquare[] = [
      {
        id: `fs_1_${Math.random().toString(36).substring(2, 6)}`,
        x: startX,
        y: topY,
        width: sqWidth,
        height: sqHeight,
        label: "Square 1",
      },
    ];

    setFreestyleSquares(defaultSquares);
    setSelectedFreestyleSquareIds([defaultSquares[0].id]);
    setMeshMode("freestyle");

    // Auto snap to live preview on the left if it is out of view
    setTimeout(() => {
      if (freestyleSlicePreviewRef.current) {
        freestyleSlicePreviewRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, 60);
  }, []);

  // Helper to initialize freestyle squares from current uniform grid (if full grid is requested)
  const handleInitializeFreestyleFromGrid = useCallback(() => {
    const naturalW = imgRef.current?.naturalWidth || 800;
    const naturalH = imgRef.current?.naturalHeight || 600;
    const squares: FreestyleSquare[] = [];
    const effectiveSquare = Math.max(8, meshSquareSize);
    const pxX = Math.round((meshBounds.x / 100) * naturalW);
    const pxY = Math.round((meshBounds.y / 100) * naturalH);
    const pxW = Math.max(1, Math.round((meshBounds.width / 100) * naturalW));
    const pxH = Math.max(1, Math.round((meshBounds.height / 100) * naturalH));
    const cols = Math.max(1, Math.floor(pxW / effectiveSquare));
    const rows = Math.max(1, Math.floor(pxH / effectiveSquare));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellX = pxX + c * effectiveSquare;
        const cellY = pxY + r * effectiveSquare;
        const pX = (cellX / naturalW) * 100;
        const pY = (cellY / naturalH) * 100;
        const pW = (effectiveSquare / naturalW) * 100;
        const pH = (effectiveSquare / naturalH) * 100;

        squares.push({
          id: `fs_${r}_${c}_${Math.random().toString(36).substring(2, 6)}`,
          x: Math.round(pX * 100) / 100,
          y: Math.round(pY * 100) / 100,
          width: Math.round(pW * 100) / 100,
          height: Math.round(pH * 100) / 100,
          label: `Square ${squares.length + 1}`,
        });
      }
    }
    setFreestyleSquares(squares);
    setSelectedFreestyleSquareIds(squares.length > 0 ? [squares[0].id] : []);
    setMeshMode("freestyle");

    // Auto snap to live preview on the left if it is out of view
    setTimeout(() => {
      if (freestyleSlicePreviewRef.current) {
        freestyleSlicePreviewRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, 60);
  }, [meshBounds, meshSquareSize]);

  // Add new freestyle square at center
  const handleAddFreestyleSquare = useCallback(() => {
    const naturalW = imgRef.current?.naturalWidth || 800;
    const naturalH = imgRef.current?.naturalHeight || 600;
    const effectiveSquare = Math.max(8, meshSquareSize);
    const pW = (effectiveSquare / naturalW) * 100;
    const pH = (effectiveSquare / naturalH) * 100;

    const newSq: FreestyleSquare = {
      id: `fs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x: Math.max(0, Math.round((50 - pW / 2) * 100) / 100),
      y: Math.max(0, Math.round((50 - pH / 2) * 100) / 100),
      width: Math.round(pW * 100) / 100,
      height: Math.round(pH * 100) / 100,
      label: `Square ${freestyleSquares.length + 1}`,
    };

    setFreestyleSquares((prev) => [...prev, newSq]);
    setSelectedFreestyleSquareIds([newSq.id]);

    // Auto snap to live preview on the left if it is out of view
    setTimeout(() => {
      if (freestyleSlicePreviewRef.current) {
        freestyleSlicePreviewRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, 60);
  }, [meshSquareSize, freestyleSquares.length]);

  // Insert Trapeze Preset directly from panel
  const handleInsertTrapezePresetFromPanel = useCallback((presetId: string) => {
    const preset = TRAPEZE_PRESETS.find((p) => p.id === presetId) || TRAPEZE_PRESETS[0];
    const naturalW = imgRef.current?.naturalWidth || 800;
    const naturalH = imgRef.current?.naturalHeight || 600;
    const effectiveSquare = Math.max(32, meshSquareSize);
    const pW = (effectiveSquare / naturalW) * 100;
    const pH = (effectiveSquare / naturalH) * 100;
    const x = Math.max(0, Math.round((50 - pW / 2) * 100) / 100);
    const y = Math.max(0, Math.round((50 - pH / 2) * 100) / 100);
    const pts = preset.getPoints(x, y, pW, pH);

    const newSq: FreestyleSquare = {
      id: `fs_trapeze_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x,
      y,
      width: Math.round(pW * 100) / 100,
      height: Math.round(pH * 100) / 100,
      label: `${preset.name} ${freestyleSquares.length + 1}`,
      shapeType: "trapezoid",
      points: pts,
    };

    setFreestyleSquares((prev) => [...prev, newSq]);
    setSelectedFreestyleSquareIds([newSq.id]);
    setFreestyleTool("select");

    // Auto snap to live preview on the left if it is out of view
    setTimeout(() => {
      if (freestyleSlicePreviewRef.current) {
        freestyleSlicePreviewRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, 60);
  }, [meshSquareSize, freestyleSquares.length]);

  // Close Angled Polygon slice from panel
  const handleClosePolygonSliceFromPanel = useCallback(() => {
    if (activePolygonPoints.length < 3) {
      alert("Please place at least 3 points on the canvas before completing the angled polygon slice.");
      return;
    }
    const minX = Math.min(...activePolygonPoints.map((p) => p.x));
    const maxX = Math.max(...activePolygonPoints.map((p) => p.x));
    const minY = Math.min(...activePolygonPoints.map((p) => p.y));
    const maxY = Math.max(...activePolygonPoints.map((p) => p.y));
    const width = Math.max(0.5, Math.round((maxX - minX) * 100) / 100);
    const height = Math.max(0.5, Math.round((maxY - minY) * 100) / 100);

    const newSq: FreestyleSquare = {
      id: `fs_poly_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x: Math.round(minX * 100) / 100,
      y: Math.round(minY * 100) / 100,
      width,
      height,
      label: `Angled Slice ${freestyleSquares.length + 1}`,
      shapeType: "polygon",
      points: [...activePolygonPoints],
    };

    setFreestyleSquares((prev) => [...prev, newSq]);
    setSelectedFreestyleSquareIds([newSq.id]);
    setActivePolygonPoints([]);
    setFreestyleTool("select");

    // Auto snap to live preview on the left if it is out of view
    setTimeout(() => {
      if (freestyleSlicePreviewRef.current) {
        freestyleSlicePreviewRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, 60);
  }, [activePolygonPoints, freestyleSquares.length]);

  // Resize individual square (+ / - delta px)
  const handleResizeFreestyleSquare = useCallback((squareId: string, deltaPx: number) => {
    const naturalW = imgRef.current?.naturalWidth || 800;
    const naturalH = imgRef.current?.naturalHeight || 600;
    const deltaW = (deltaPx / naturalW) * 100;
    const deltaH = (deltaPx / naturalH) * 100;

    setFreestyleSquares((prev) =>
      prev.map((s) => {
        if (s.id !== squareId) return s;
        const nextW = Math.max(0.5, s.width + deltaW);
        const nextH = Math.max(0.5, s.height + deltaH);
        let scaledPoints = s.points;
        if (s.points && s.points.length > 0 && s.width > 0 && s.height > 0) {
          scaledPoints = s.points.map((pt) => ({
            x: Math.round((s.x + ((pt.x - s.x) / s.width) * nextW) * 100) / 100,
            y: Math.round((s.y + ((pt.y - s.y) / s.height) * nextH) * 100) / 100,
          }));
        }
        return {
          ...s,
          width: Math.round(nextW * 100) / 100,
          height: Math.round(nextH * 100) / 100,
          points: scaledPoints,
        };
      })
    );
  }, []);

  // Resize multiple squares (+ / - delta px)
  const handleResizeFreestyleSquares = useCallback((squareIds: string[], deltaPx: number) => {
    const naturalW = imgRef.current?.naturalWidth || 800;
    const naturalH = imgRef.current?.naturalHeight || 600;
    const deltaW = (deltaPx / naturalW) * 100;
    const deltaH = (deltaPx / naturalH) * 100;

    setFreestyleSquares((prev) =>
      prev.map((s) => {
        if (!squareIds.includes(s.id)) return s;
        const nextW = Math.max(0.5, s.width + deltaW);
        const nextH = Math.max(0.5, s.height + deltaH);
        let scaledPoints = s.points;
        if (s.points && s.points.length > 0 && s.width > 0 && s.height > 0) {
          scaledPoints = s.points.map((pt) => ({
            x: Math.round((s.x + ((pt.x - s.x) / s.width) * nextW) * 100) / 100,
            y: Math.round((s.y + ((pt.y - s.y) / s.height) * nextH) * 100) / 100,
          }));
        }
        return {
          ...s,
          width: Math.round(nextW * 100) / 100,
          height: Math.round(nextH * 100) / 100,
          points: scaledPoints,
        };
      })
    );
  }, []);

  // Set precise pixel dimension for selected square
  const handleSetFreestyleSquarePixelSize = useCallback((squareId: string, sizePx: number) => {
    const naturalW = imgRef.current?.naturalWidth || 800;
    const naturalH = imgRef.current?.naturalHeight || 600;
    const pW = (sizePx / naturalW) * 100;
    const pH = (sizePx / naturalH) * 100;

    setFreestyleSquares((prev) =>
      prev.map((s) => {
        if (s.id !== squareId) return s;
        let scaledPoints = s.points;
        if (s.points && s.points.length > 0 && s.width > 0 && s.height > 0) {
          scaledPoints = s.points.map((pt) => ({
            x: Math.round((s.x + ((pt.x - s.x) / s.width) * pW) * 100) / 100,
            y: Math.round((s.y + ((pt.y - s.y) / s.height) * pH) * 100) / 100,
          }));
        }
        return {
          ...s,
          width: Math.round(pW * 100) / 100,
          height: Math.round(pH * 100) / 100,
          points: scaledPoints,
        };
      })
    );
  }, []);

  // Set precise pixel dimension for multiple squares
  const handleSetFreestyleSquaresPixelSize = useCallback((squareIds: string[], sizePx: number) => {
    const naturalW = imgRef.current?.naturalWidth || 800;
    const naturalH = imgRef.current?.naturalHeight || 600;
    const pW = (sizePx / naturalW) * 100;
    const pH = (sizePx / naturalH) * 100;

    setFreestyleSquares((prev) =>
      prev.map((s) => {
        if (!squareIds.includes(s.id)) return s;
        let scaledPoints = s.points;
        if (s.points && s.points.length > 0 && s.width > 0 && s.height > 0) {
          scaledPoints = s.points.map((pt) => ({
            x: Math.round((s.x + ((pt.x - s.x) / s.width) * pW) * 100) / 100,
            y: Math.round((s.y + ((pt.y - s.y) / s.height) * pH) * 100) / 100,
          }));
        }
        return {
          ...s,
          width: Math.round(pW * 100) / 100,
          height: Math.round(pH * 100) / 100,
          points: scaledPoints,
        };
      })
    );
  }, []);

  // Set manual width/height in px
  const handleSetFreestyleSquareDimensionsPx = useCallback((squareId: string, widthPx?: number, heightPx?: number) => {
    const naturalW = imgRef.current?.naturalWidth || 800;
    const naturalH = imgRef.current?.naturalHeight || 600;

    setFreestyleSquares((prev) =>
      prev.map((s) => {
        if (s.id !== squareId) return s;
        const nextW = widthPx !== undefined ? Math.max(0.5, (widthPx / naturalW) * 100) : s.width;
        const nextH = heightPx !== undefined ? Math.max(0.5, (heightPx / naturalH) * 100) : s.height;
        let scaledPoints = s.points;
        if (s.points && s.points.length > 0 && s.width > 0 && s.height > 0) {
          scaledPoints = s.points.map((pt) => ({
            x: Math.round((s.x + ((pt.x - s.x) / s.width) * nextW) * 100) / 100,
            y: Math.round((s.y + ((pt.y - s.y) / s.height) * nextH) * 100) / 100,
          }));
        }
        return {
          ...s,
          width: Math.round(nextW * 100) / 100,
          height: Math.round(nextH * 100) / 100,
          points: scaledPoints,
        };
      })
    );
  }, []);

  // Set manual width/height in px for multiple squares
  const handleSetFreestyleSquaresDimensionsPx = useCallback((squareIds: string[], widthPx?: number, heightPx?: number) => {
    const naturalW = imgRef.current?.naturalWidth || 800;
    const naturalH = imgRef.current?.naturalHeight || 600;

    setFreestyleSquares((prev) =>
      prev.map((s) => {
        if (!squareIds.includes(s.id)) return s;
        const nextW = widthPx !== undefined ? Math.max(0.5, (widthPx / naturalW) * 100) : s.width;
        const nextH = heightPx !== undefined ? Math.max(0.5, (heightPx / naturalH) * 100) : s.height;
        let scaledPoints = s.points;
        if (s.points && s.points.length > 0 && s.width > 0 && s.height > 0) {
          scaledPoints = s.points.map((pt) => ({
            x: Math.round((s.x + ((pt.x - s.x) / s.width) * nextW) * 100) / 100,
            y: Math.round((s.y + ((pt.y - s.y) / s.height) * nextH) * 100) / 100,
          }));
        }
        return {
          ...s,
          width: Math.round(nextW * 100) / 100,
          height: Math.round(nextH * 100) / 100,
          points: scaledPoints,
        };
      })
    );
  }, []);

  // Scale all freestyle squares (e.g. 0.9 or 1.1)
  const handleScaleAllFreestyleSquares = useCallback((factor: number) => {
    setFreestyleSquares((prev) =>
      prev.map((s) => {
        const nextW = Math.max(0.5, Math.round(s.width * factor * 100) / 100);
        const nextH = Math.max(0.5, Math.round(s.height * factor * 100) / 100);
        let scaledPoints = s.points;
        if (s.points && s.points.length > 0 && s.width > 0 && s.height > 0) {
          scaledPoints = s.points.map((pt) => ({
            x: Math.round((s.x + ((pt.x - s.x) / s.width) * nextW) * 100) / 100,
            y: Math.round((s.y + ((pt.y - s.y) / s.height) * nextH) * 100) / 100,
          }));
        }
        return {
          ...s,
          width: nextW,
          height: nextH,
          points: scaledPoints,
        };
      })
    );
  }, []);

  // Duplicate a single square
  const handleDuplicateFreestyleSquare = useCallback((squareId: string) => {
    const target = freestyleSquares.find((s) => s.id === squareId);
    if (!target) return;
    const newSq: FreestyleSquare = {
      ...target,
      id: `fs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x: target.x + 3,
      y: target.y + 3,
      points: target.points ? target.points.map((pt) => ({ x: Math.round((pt.x + 3) * 100) / 100, y: Math.round((pt.y + 3) * 100) / 100 })) : undefined,
      label: `${target.label || "Square"} (Copy)`,
    };
    setFreestyleSquares((prev) => [...prev, newSq]);
    setSelectedFreestyleSquareIds([newSq.id]);
  }, [freestyleSquares]);

  // Duplicate multiple squares simultaneously
  const handleDuplicateFreestyleSquares = useCallback((squareIds: string[]) => {
    if (squareIds.length === 0) return;
    const targetSquares = freestyleSquares.filter((s) => squareIds.includes(s.id));
    if (targetSquares.length === 0) return;

    const newSquares: FreestyleSquare[] = targetSquares.map((target, idx) => ({
      ...target,
      id: `fs_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      x: target.x + 3,
      y: target.y + 3,
      points: target.points ? target.points.map((pt) => ({ x: Math.round((pt.x + 3) * 100) / 100, y: Math.round((pt.y + 3) * 100) / 100 })) : undefined,
      label: `${target.label || "Square"} (Copy)`,
    }));

    setFreestyleSquares((prev) => [...prev, ...newSquares]);
    setSelectedFreestyleSquareIds(newSquares.map((s) => s.id));
  }, [freestyleSquares]);

  // Delete a square
  const handleDeleteFreestyleSquare = useCallback((squareId: string) => {
    setFreestyleSquares((prev) => prev.filter((s) => s.id !== squareId));
    setSelectedFreestyleSquareIds((prev) => prev.filter((id) => id !== squareId));
  }, []);

  // Delete multiple squares
  const handleDeleteFreestyleSquares = useCallback((squareIds: string[]) => {
    setFreestyleSquares((prev) => prev.filter((s) => !squareIds.includes(s.id)));
    setSelectedFreestyleSquareIds((prev) => prev.filter((id) => !squareIds.includes(id)));
  }, []);

  // Merge multiple freestyle squares into 1 single bounding box
  const handleMergeFreestyleSquares = useCallback((squareIds: string[]) => {
    if (squareIds.length < 2) return;
    const targetSquares = freestyleSquares.filter((s) => squareIds.includes(s.id));
    if (targetSquares.length < 2) return;

    const minX = Math.min(...targetSquares.map((s) => s.x));
    const minY = Math.min(...targetSquares.map((s) => s.y));
    const maxX = Math.max(...targetSquares.map((s) => s.x + s.width));
    const maxY = Math.max(...targetSquares.map((s) => s.y + s.height));
    const width = Math.max(0.5, Math.round((maxX - minX) * 100) / 100);
    const height = Math.max(0.5, Math.round((maxY - minY) * 100) / 100);

    const mergedSquare: FreestyleSquare = {
      id: `fs_merged_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x: Math.round(minX * 100) / 100,
      y: Math.round(minY * 100) / 100,
      width,
      height,
      label: `Merged (${targetSquares.length} slices)`,
    };

    const selectedSet = new Set(squareIds);
    const remaining = freestyleSquares.filter((s) => !selectedSet.has(s.id));
    const nextSquares = [...remaining, mergedSquare];

    setFreestyleSquares(nextSquares);
    setSelectedFreestyleSquareIds([mergedSquare.id]);
  }, [freestyleSquares]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(true);
      }

      const isInputActive =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA";

      if (!isInputActive && isMeshToolActive && meshMode === "freestyle") {
        // Ctrl+D or Cmd+D: Duplicate selected squares
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
          e.preventDefault();
          if (selectedFreestyleSquareIds.length > 0) {
            handleDuplicateFreestyleSquares(selectedFreestyleSquareIds);
          }
        }
        // Ctrl+A or Cmd+A: Select all freestyle squares
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
          e.preventDefault();
          setSelectedFreestyleSquareIds(freestyleSquares.map((s) => s.id));
        }
        // Delete or Backspace: Delete selected squares
        if (e.key === "Delete" || e.key === "Backspace") {
          if (selectedFreestyleSquareIds.length > 0) {
            e.preventDefault();
            handleDeleteFreestyleSquares(selectedFreestyleSquareIds);
          }
        }
        // J or M: Merge selected freestyle squares into 1 single bounding box
        if (
          (e.key === "j" || e.key === "J" || e.key === "m" || e.key === "M") &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          if (selectedFreestyleSquareIds.length >= 2) {
            e.preventDefault();
            handleMergeFreestyleSquares(selectedFreestyleSquareIds);
          }
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    isMeshToolActive,
    meshMode,
    selectedFreestyleSquareIds,
    freestyleSquares,
    handleDuplicateFreestyleSquares,
    handleDeleteFreestyleSquares,
    handleMergeFreestyleSquares,
  ]);

  const imgRef = useRef<HTMLImageElement>(null);

  // Carve State
  const [croppedImageSrc, setCroppedImageSrc] = useState<string>("");
  const [isAdjusting, setIsAdjusting] = useState(true);

  // Default Grid Configuration (User Configurable)
  const [defaultNumRows, setDefaultNumRows] = useState<number>(() => {
    try {
      const saved = remoteStore.getItem("default_slice_rows");
      return saved ? Math.max(1, parseInt(saved, 10) || 4) : 4;
    } catch {
      return 4;
    }
  });
  const [defaultNumCols, setDefaultNumCols] = useState<number>(() => {
    try {
      const saved = remoteStore.getItem("default_slice_cols");
      return saved ? Math.max(1, parseInt(saved, 10) || 4) : 4;
    } catch {
      return 4;
    }
  });

  const [numRows, setNumRows] = useState<number>(defaultNumRows);
  const [numCols, setNumCols] = useState<number>(defaultNumCols);
  const [rowCuts, setRowCuts] = useState<number[]>([]);
  const [colCuts, setColCuts] = useState<number[]>([]);
  const [carverSkew, setCarverSkew] = useState<number>(0);
  const [carveImageSize, setCarveImageSize] = useState({ width: 0, height: 0 });
  const [format, setFormat] = useState<"image/png" | "image/jpeg">("image/jpeg");
  const [numberingOrigin, setNumberingOrigin] = useState<NumberingOrigin>("top-left");
  const [numberingFlow, setNumberingFlow] = useState<NumberingFlow>("horizontal");
  const [namingStyle, setNamingStyle] = useState<NamingStyle>("sequential");

  // Storyboard Export Action Bar Size (50% compact by default state)
  const [isExportBarCompact, setIsExportBarCompact] = useState<boolean>(() => {
    try {
      const saved = remoteStore.getItem("storyboard_export_bar_compact");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const handleToggleExportBarCompact = () => {
    setIsExportBarCompact((prev) => {
      const next = !prev;
      try {
        remoteStore.setItem("storyboard_export_bar_compact", String(next));
      } catch {}
      setCropNotice(next ? "✓ Export bar reduced by 50% (Default state)" : "✓ Export bar expanded to full size");
      setTimeout(() => setCropNotice(null), 2500);
      return next;
    });
  };

  const handleResetCrop = useCallback(() => {
    setCrop(undefined);
    setCompletedPercentCrop(null);
    setCompletedPixelCrop(null);
    setCropAspect(undefined);
  }, []);

  const handleRevertToOriginal = useCallback(() => {
    if (originalImageSrc) {
      setImageSrc(originalImageSrc);
      setCroppedImageSrc(originalImageSrc);
      setCrop(undefined);
      setCompletedPercentCrop(null);
      setCompletedPixelCrop(null);
      setCropAspect(undefined);
      setCropNotice("Reverted to original uncropped image!");
      setTimeout(() => setCropNotice(null), 3000);
    }
  }, [originalImageSrc]);

  const handleSetAspect = useCallback(
    (aspect?: number | "circle" | "oval") => {
      let activeAspect: number | undefined;
      if (aspect === "circle") {
        setIsCircularCrop(true);
        activeAspect = 1;
      } else if (aspect === "oval") {
        setIsCircularCrop(true);
        activeAspect = undefined;
      } else {
        setIsCircularCrop(false);
        activeAspect = aspect;
      }
      setCropAspect(activeAspect);
      if (activeAspect && imgRef.current) {
        const { clientWidth, clientHeight } = imgRef.current;
        if (clientWidth && clientHeight) {
          const imgAspect = clientWidth / clientHeight;
          let width = 85;
          let height = 85;
          if (activeAspect > imgAspect) {
            width = 85;
            height = (width / activeAspect) * imgAspect;
          } else {
            height = 85;
            width = (height * activeAspect) / imgAspect;
          }
          const x = Math.max(0, (100 - width) / 2);
          const y = Math.max(0, (100 - height) / 2);
          const newCrop: Crop = { unit: "%", x, y, width, height };
          setCrop(newCrop);
          setCompletedPercentCrop(newCrop);
        }
      } else if (!activeAspect) {
        if (!crop || !crop.width) {
          const newCrop: Crop = { unit: "%", x: 10, y: 10, width: 80, height: 80 };
          setCrop(newCrop);
          setCompletedPercentCrop(newCrop);
        }
      }
    },
    [crop]
  );

  // Configurable Slice Lines & Bounding Frames State
  const [sliceLineColor, setSliceLineColor] = useState<string>("#F43F5E");
  const [sliceLineStyle, setSliceLineStyle] = useState<"solid" | "dashed" | "dotted">("solid");
  const [sliceLineThickness, setSliceLineThickness] = useState<number>(22);
  const [sliceLineThicknessX, setSliceLineThicknessX] = useState<number>(22);
  const [sliceLineThicknessY, setSliceLineThicknessY] = useState<number>(22);
  const [isGapLocked, setIsGapLocked] = useState<boolean>(true);
  const [outerMargin, setOuterMargin] = useState<number>(17);
  const [sliceCellPadding, setSliceCellPadding] = useState<number>(0);

  // Component layer mappings
  const [neo1LayersMap, setNeo1LayersMap] = useState<Record<string, any[]>>({});
  const [bubba1BubblesMap, setBubba1BubblesMap] = useState<Record<string, any[]>>({});

  const [globalTheme, setGlobalTheme] = useState({
    bubbleFillColor: "#ffffff",
    bubbleBorderColor: "#000000",
    bubbleTextColor: "#000000",
    bubbleFontFamily: "sans-serif",
    bubbleBorderWidth: 2,
    bubbleBorderStyle: "solid" as "solid" | "dashed" | "dotted",
    bubbleBorderRadius: 12,
    bubblePadding: 12,
    bubbleFontSize: 14,
    bubbleIsBold: false,
    bubbleIsItalic: false,
  });
  const [isGlobalThemeOpen, setIsGlobalThemeOpen] = useState(false);

  const handlePropagateGlobalTheme = useCallback(() => {
    // 1. Update Bubba1 speech bubbles
    setBubba1BubblesMap((prevMap) => {
      const nextMap = { ...prevMap };
      Object.keys(nextMap).forEach((urlKey) => {
        if (Array.isArray(nextMap[urlKey])) {
          nextMap[urlKey] = nextMap[urlKey].map((bubble: any) => ({
            ...bubble,
            fillColor: globalTheme.bubbleFillColor,
            borderColor: globalTheme.bubbleBorderColor,
            textColor: globalTheme.bubbleTextColor,
            fontFamily: globalTheme.bubbleFontFamily,
            borderWidth: globalTheme.bubbleBorderWidth,
            borderStyle: globalTheme.bubbleBorderStyle,
            borderRadius: globalTheme.bubbleBorderRadius,
            padding: globalTheme.bubblePadding,
            fontSize: globalTheme.bubbleFontSize,
            isBold: globalTheme.bubbleIsBold,
            isItalic: globalTheme.bubbleIsItalic,
          }));
        }
      });
      return nextMap;
    });

    // 2. Update Neo1 text/bubble layers
    setNeo1LayersMap((prevMap) => {
      const nextMap = { ...prevMap };
      Object.keys(nextMap).forEach((urlKey) => {
        if (Array.isArray(nextMap[urlKey])) {
          nextMap[urlKey] = nextMap[urlKey].map((layer: any) => {
            if (layer.type === "text" || layer.type === "bubble" || layer.type === "rect") {
              return {
                ...layer,
                fillColor: layer.type !== "text" ? globalTheme.bubbleFillColor : (layer.fillColor || "transparent"),
                strokeColor: globalTheme.bubbleBorderColor,
                textColor: layer.textColor ? globalTheme.bubbleTextColor : undefined,
                fontFamily: layer.fontFamily ? globalTheme.bubbleFontFamily : undefined,
                strokeWidth: globalTheme.bubbleBorderWidth,
                lineStyle: globalTheme.bubbleBorderStyle,
                borderRadius: layer.borderRadius !== undefined ? globalTheme.bubbleBorderRadius : undefined,
                fontSize: layer.fontSize ? globalTheme.bubbleFontSize : undefined,
                isBold: layer.isBold !== undefined ? globalTheme.bubbleIsBold : undefined,
                isItalic: layer.isItalic !== undefined ? globalTheme.bubbleIsItalic : undefined,
              };
            }
            return layer;
          });
        }
      });
      return nextMap;
    });

    setCropNotice("\u2713 Global Theme Palette synchronized across all storyboard frames!");
    setTimeout(() => setCropNotice(null), 3000);
  }, [globalTheme, setBubba1BubblesMap, setNeo1LayersMap]);

  // Update Slice URL handler from Bubble Studio annotations
  const handleUpdateSliceUrl = useCallback((index: number, newUrl: string, newName?: string) => {
    setStoryboardSlices((prev) => {
      if (!prev[index]) return prev;
      const oldUrl = prev[index].url;
      const nextSlices = [...prev];
      nextSlices[index] = {
        ...nextSlices[index],
        url: newUrl,
        ...(newName ? { name: newName } : {}),
      };

      // Also sync storyboardSlots if holding the old URL
      setStoryboardSlots((slots) =>
        slots.map((slot) => {
          if (slot.url === oldUrl) {
            return {
              ...slot,
              url: newUrl,
              ...(newName ? { name: newName } : {}),
            };
          }
          return slot;
        })
      );

      // Dynamically transfer layer/bubble states when the image url is modified
      if (oldUrl && oldUrl !== newUrl) {
        setNeo1LayersMap((prevMap) => {
          if (prevMap[oldUrl]) {
            const nextMap = { ...prevMap };
            nextMap[newUrl] = prevMap[oldUrl];
            delete nextMap[oldUrl];
            return nextMap;
          }
          return prevMap;
        });
        setBubba1BubblesMap((prevMap) => {
          if (prevMap[oldUrl]) {
            const nextMap = { ...prevMap };
            nextMap[newUrl] = prevMap[oldUrl];
            delete nextMap[oldUrl];
            return nextMap;
          }
          return prevMap;
        });
      }

      return nextSlices;
    });
  }, [setNeo1LayersMap, setBubba1BubblesMap]);

  const [shapeStudioCropIndex, setShapeStudioCropIndex] = useState<number | null>(null);
  const [shapeStudioCropOriginalUrl, setShapeStudioCropOriginalUrl] = useState<string | null>(null);
  const [resentFromStoryboardSliceIndex, setResentFromStoryboardSliceIndex] = useState<number | null>(null);
  const [resentFromStoryboardSlotIndex, setResentFromStoryboardSlotIndex] = useState<number | null>(null);

  // --- Define Canvas & Crop History (Undo / Redo & Baking) ---
  const [cropHistory, setCropHistory] = useState<string[]>([]);
  const [cropHistoryIndex, setCropHistoryIndex] = useState<number>(-1);
  const cropHistoryIndexRef = useRef<number>(-1);
  const [copySnapshotFirst, setCopySnapshotFirst] = useState<boolean>(true);

  // Initialize cropHistory on image load
  useEffect(() => {
    if (imageSrc) {
      setCropHistory((prev) => {
        if (prev.length === 0) {
          cropHistoryIndexRef.current = 0;
          setCropHistoryIndex(0);
          return [imageSrc];
        }
        return prev;
      });
    }
  }, [imageSrc]);

  const pushToCropHistory = useCallback((newUrl: string) => {
    if (!newUrl) return;
    setCropHistory((prev) => {
      const currentIdx = cropHistoryIndexRef.current;
      const truncated = currentIdx >= 0 ? prev.slice(0, currentIdx + 1) : prev;
      if (truncated.length > 0 && truncated[truncated.length - 1] === newUrl) {
        return prev;
      }
      const next = [...truncated, newUrl];
      const nextIdx = next.length - 1;
      cropHistoryIndexRef.current = nextIdx;
      setCropHistoryIndex(nextIdx);
      return next;
    });
  }, []);

  const handleUndoCrop = useCallback(() => {
    setCropHistory((prev) => {
      const currentIdx = cropHistoryIndexRef.current;
      if (currentIdx > 0) {
        const newIdx = currentIdx - 1;
        const targetUrl = prev[newIdx];
        if (targetUrl) {
          cropHistoryIndexRef.current = newIdx;
          setCropHistoryIndex(newIdx);
          setImageSrc(targetUrl);
          setCroppedImageSrc(targetUrl);
          setOriginalImageSrc(targetUrl);
          setCrop(undefined);
          setCompletedPercentCrop(null);
          setCompletedPixelCrop(null);
          if (resentFromStoryboardSliceIndex !== null) {
            handleUpdateSliceUrl(resentFromStoryboardSliceIndex, targetUrl);
          } else if (shapeStudioCropIndex !== null) {
            handleUpdateSliceUrl(shapeStudioCropIndex, targetUrl);
          }
        }
      }
      return prev;
    });
  }, [resentFromStoryboardSliceIndex, shapeStudioCropIndex, handleUpdateSliceUrl]);

  const handleRedoCrop = useCallback(() => {
    setCropHistory((prev) => {
      const currentIdx = cropHistoryIndexRef.current;
      if (currentIdx < prev.length - 1) {
        const newIdx = currentIdx + 1;
        const targetUrl = prev[newIdx];
        if (targetUrl) {
          cropHistoryIndexRef.current = newIdx;
          setCropHistoryIndex(newIdx);
          setImageSrc(targetUrl);
          setCroppedImageSrc(targetUrl);
          setOriginalImageSrc(targetUrl);
          setCrop(undefined);
          setCompletedPercentCrop(null);
          setCompletedPixelCrop(null);
          if (resentFromStoryboardSliceIndex !== null) {
            handleUpdateSliceUrl(resentFromStoryboardSliceIndex, targetUrl);
          } else if (shapeStudioCropIndex !== null) {
            handleUpdateSliceUrl(shapeStudioCropIndex, targetUrl);
          }
        }
      }
      return prev;
    });
  }, [resentFromStoryboardSliceIndex, shapeStudioCropIndex, handleUpdateSliceUrl]);

  const [isHistoryVisualizerOpen, setIsHistoryVisualizerOpen] = useState(false);

  const handleJumpToCropHistoryIndex = useCallback((targetIndex: number) => {
    setCropHistory((prev) => {
      if (targetIndex >= 0 && targetIndex < prev.length) {
        const targetUrl = prev[targetIndex];
        if (targetUrl) {
          cropHistoryIndexRef.current = targetIndex;
          setCropHistoryIndex(targetIndex);
          setImageSrc(targetUrl);
          setCroppedImageSrc(targetUrl);
          setOriginalImageSrc(targetUrl);
          setCrop(undefined);
          setCompletedPercentCrop(null);
          setCompletedPixelCrop(null);
          if (resentFromStoryboardSliceIndex !== null) {
            handleUpdateSliceUrl(resentFromStoryboardSliceIndex, targetUrl);
          } else if (shapeStudioCropIndex !== null) {
            handleUpdateSliceUrl(shapeStudioCropIndex, targetUrl);
          }
        }
      }
      return prev;
    });
  }, [resentFromStoryboardSliceIndex, shapeStudioCropIndex, handleUpdateSliceUrl]);

  const handleCutMeshIntoSquares = useCallback(async (freestyleSquaresToCut?: FreestyleSquare[]) => {
    const sourceImage = imageSrc || originalImageSrc;
    if (!sourceImage) {
      alert("Please load an image first.");
      return;
    }

    const activeFreestyle = freestyleSquaresToCut || (meshMode === "freestyle" ? freestyleSquares : undefined);

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        if (sourceImage.startsWith("http://") || sourceImage.startsWith("https://")) {
          image.crossOrigin = "anonymous";
        }
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Failed to load source image for mesh cutting"));
        image.src = sourceImage;
      });

      const naturalW = img.naturalWidth || 800;
      const naturalH = img.naturalHeight || 600;
      const prefix = slicePrefix.trim() || "Mesh";
      const generatedSlices: { name: string; url: string }[] = [];

      if (activeFreestyle && activeFreestyle.length > 0) {
        // Cut custom freestyle square regions (including squares placed outside canvas and custom polygon/trapezoid shapes)
        for (let i = 0; i < activeFreestyle.length; i++) {
          const sq = activeFreestyle[i];
          const pxX = Math.round((sq.x / 100) * naturalW);
          const pxY = Math.round((sq.y / 100) * naturalH);
          const pxW = Math.max(1, Math.round((sq.width / 100) * naturalW));
          const pxH = Math.max(1, Math.round((sq.height / 100) * naturalH));

          if (pxW <= 0 || pxH <= 0) continue;

          const canvas = document.createElement("canvas");
          canvas.width = pxW;
          canvas.height = pxH;
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          // If sq has custom polygon/trapezoid points, clip the canvas context!
          if (sq.points && sq.points.length > 2) {
            ctx.save();
            ctx.beginPath();
            sq.points.forEach((p, pIdx) => {
              // Convert percent on full natural image to pixel coordinates relative to the slice canvas (pxX, pxY)
              const ptPxX = (p.x / 100) * naturalW - pxX;
              const ptPxY = (p.y / 100) * naturalH - pxY;
              if (pIdx === 0) {
                ctx.moveTo(ptPxX, ptPxY);
              } else {
                ctx.lineTo(ptPxX, ptPxY);
              }
            });
            ctx.closePath();
            ctx.clip();
          }

          // Calculate intersection with natural image bounds
          const srcX = Math.max(0, pxX);
          const srcY = Math.max(0, pxY);
          const srcRight = Math.min(naturalW, pxX + pxW);
          const srcBottom = Math.min(naturalH, pxY + pxH);
          const srcW = srcRight - srcX;
          const srcH = srcBottom - srcY;

          if (srcW > 0 && srcH > 0) {
            const dstX = srcX - pxX;
            const dstY = srcY - pxY;
            ctx.drawImage(img, srcX, srcY, srcW, srcH, dstX, dstY, srcW, srcH);
          }

          if (sq.points && sq.points.length > 2) {
            ctx.restore();
          }

          const dataUrl = canvas.toDataURL(format);
          const shapePrefix = sq.shapeType === "polygon" ? "angled" : sq.shapeType === "trapezoid" ? "trapeze" : "freestyle";
          const sliceName = `${prefix}_${shapePrefix}_${String(i + 1).padStart(2, "0")}`;
          generatedSlices.push({ name: sliceName, url: dataUrl });
        }
      } else {
        // Uniform grid mesh cutting (supports mesh positioned outside canvas)
        const pxX = Math.round((meshBounds.x / 100) * naturalW);
        const pxY = Math.round((meshBounds.y / 100) * naturalH);
        const pxW = Math.max(1, Math.round((meshBounds.width / 100) * naturalW));
        const pxH = Math.max(1, Math.round((meshBounds.height / 100) * naturalH));

        const effectiveSquare = Math.max(8, meshSquareSize);
        const cols = Math.max(1, Math.floor(pxW / effectiveSquare));
        const rows = Math.max(1, Math.floor(pxH / effectiveSquare));
        const totalSquares = cols * rows;

        if (totalSquares <= 0) {
          alert("Mesh area is too small for the selected square size.");
          return;
        }

        if (totalSquares > 256) {
          if (!window.confirm(`This will generate ${totalSquares} square slices (${cols}\u00d7${rows}). Continue?`)) {
            return;
          }
        }

        // Loop through rows and columns to cut square tiles
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cellX = pxX + c * effectiveSquare;
            const cellY = pxY + r * effectiveSquare;
            const cellW = effectiveSquare;
            const cellH = effectiveSquare;

            const canvas = document.createElement("canvas");
            canvas.width = cellW;
            canvas.height = cellH;
            const ctx = canvas.getContext("2d");
            if (!ctx) continue;

            // Calculate intersection with natural image bounds
            const srcX = Math.max(0, cellX);
            const srcY = Math.max(0, cellY);
            const srcRight = Math.min(naturalW, cellX + cellW);
            const srcBottom = Math.min(naturalH, cellY + cellH);
            const srcW = srcRight - srcX;
            const srcH = srcBottom - srcY;

            if (srcW > 0 && srcH > 0) {
              const dstX = srcX - cellX;
              const dstY = srcY - cellY;
              ctx.drawImage(img, srcX, srcY, srcW, srcH, dstX, dstY, srcW, srcH);
            }

            const dataUrl = canvas.toDataURL(format);
            const index = generatedSlices.length + 1;
            const sliceName = `${prefix}_sq_${String(index).padStart(2, "0")}`;
            generatedSlices.push({ name: sliceName, url: dataUrl });
          }
        }
      }

      if (generatedSlices.length > 0) {
        if (meshDestination === "multi-crops") {
          // Add as multi-crop percent regions
          const newMultiCrops: { id: string; crop: Crop; isCircular: boolean }[] = [];
          if (activeFreestyle && activeFreestyle.length > 0) {
            activeFreestyle.forEach((sq) => {
              newMultiCrops.push({
                id: Math.random().toString(36).substr(2, 9),
                crop: {
                  unit: "%" as const,
                  x: sq.x,
                  y: sq.y,
                  width: sq.width,
                  height: sq.height,
                },
                isCircular: false,
              });
            });
          } else {
            const pxX = Math.round((meshBounds.x / 100) * naturalW);
            const pxY = Math.round((meshBounds.y / 100) * naturalH);
            const effectiveSquare = Math.max(8, meshSquareSize);
            const pxW = Math.max(1, Math.round((meshBounds.width / 100) * naturalW));
            const pxH = Math.max(1, Math.round((meshBounds.height / 100) * naturalH));
            const cols = Math.max(1, Math.floor(pxW / effectiveSquare));
            const rows = Math.max(1, Math.floor(pxH / effectiveSquare));

            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                const cellX = pxX + c * effectiveSquare;
                const cellY = pxY + r * effectiveSquare;
                newMultiCrops.push({
                  id: Math.random().toString(36).substr(2, 9),
                  crop: {
                    unit: "%" as const,
                    x: (cellX / naturalW) * 100,
                    y: (cellY / naturalH) * 100,
                    width: (effectiveSquare / naturalW) * 100,
                    height: (effectiveSquare / naturalH) * 100,
                  },
                  isCircular: false,
                });
              }
            }
          }
          setMultiCrops((prev) => [...prev, ...newMultiCrops]);
          setCropNotice(`\u2713 Added ${newMultiCrops.length} square regions to Multi-Crops!`);
        } else if (meshDestination === "storyboard-slots") {
          setStoryboardSlices((prev) => [...prev, ...generatedSlices]);
          setStoryboardSlots((slots) => {
            const nextSlots = [...slots];
            let sliceIdx = 0;
            for (let s = 0; s < nextSlots.length && sliceIdx < generatedSlices.length; s++) {
              if (!nextSlots[s].url) {
                nextSlots[s] = {
                  url: generatedSlices[sliceIdx].url,
                  name: generatedSlices[sliceIdx].name,
                  story: nextSlots[s].story || "",
                };
                sliceIdx++;
              }
            }
            while (sliceIdx < generatedSlices.length) {
              nextSlots.push({
                url: generatedSlices[sliceIdx].url,
                name: generatedSlices[sliceIdx].name,
                story: "",
              });
              sliceIdx++;
            }
            return nextSlots;
          });
          setCropNotice(`\u2713 Cut ${generatedSlices.length} square slices directly to Storyboard slots!`);
        } else {
          // Default: add to storyboard slices asset organizer
          setStoryboardSlices((prev) => [...prev, ...generatedSlices]);
          setCropNotice(`\u2713 Cut ${generatedSlices.length} square slices to Storyboard Slices!`);
        }

        // Post-cut navigation check
        if (meshAutoGotoAfterCut || meshDestination === "storyboard-slots") {
          setMode("storyboard");
        }

        setTimeout(() => setCropNotice(null), 4000);
      }
    } catch (err) {
      console.error("Failed to cut mesh into squares:", err);
      alert(`Failed to cut mesh into squares: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [imageSrc, originalImageSrc, meshMode, freestyleSquares, meshBounds, meshSquareSize, format, slicePrefix, meshDestination, meshAutoGotoAfterCut]);

  // Toggle selection for a single square (selects slice, adds to selection; click 2nd time deselects; on selection auto-sends to Carved Slices)
  const handleToggleFreestyleSquareSelect = useCallback(
    (squareId: string) => {
      const targetSq = freestyleSquares.find((s) => s.id === squareId);
      setSelectedFreestyleSquareIds((prev) => {
        if (prev.includes(squareId)) {
          return prev.filter((id) => id !== squareId);
        } else {
          if (targetSq) {
            handleCutMeshIntoSquares([targetSq]);
          }
          return [...prev, squareId];
        }
      });
    },
    [freestyleSquares, handleCutMeshIntoSquares]
  );

  const handleApplyCrop = useCallback(
    async (proceedToCarve = false) => {
      const sourceImage = imageSrc || originalImageSrc;
      if (!sourceImage) {
        if (proceedToCarve) {
          setMode("carve");
          setIsAdjusting(true);
        }
        return;
      }

      const targetCrop = completedPercentCrop || crop || completedPixelCrop;

      if (
        targetCrop &&
        targetCrop.width &&
        targetCrop.height &&
        targetCrop.width > 0 &&
        targetCrop.height > 0
      ) {
        try {
          const croppedUrl = await getCroppedImg(
            sourceImage,
            targetCrop,
            format,
            imgRef.current,
            isCircularCrop
          );
          
          const finalUrl = croppedUrl || sourceImage;
          
          // "2canvas" bakes the crop into the base image & updates storyboard slice if applicable
          setOriginalImageSrc(finalUrl);
          setImageSrc(finalUrl);
          setCroppedImageSrc(finalUrl);
          setCrop(undefined);
          setCompletedPercentCrop(null);
          setCompletedPixelCrop(null);

          if (resentFromStoryboardSliceIndex !== null) {
            handleUpdateSliceUrl(resentFromStoryboardSliceIndex, finalUrl);
          } else if (shapeStudioCropIndex !== null) {
            handleUpdateSliceUrl(shapeStudioCropIndex, finalUrl);
          }

          pushToCropHistory(finalUrl);

          setCropNotice(proceedToCarve ? "Crop applied & proceeding to carve!" : "\u2713 Crop baked to workspace canvas!");
          setTimeout(() => setCropNotice(null), 3000);
          if (proceedToCarve) {
            setMode("carve");
            setIsAdjusting(true);
          }
          return;
        } catch (err) {
          console.error("Failed to crop image:", err);
          if (proceedToCarve) {
            setOriginalImageSrc(sourceImage);
            setCroppedImageSrc(sourceImage);
            setCrop(undefined);
            setCompletedPercentCrop(null);
            setCompletedPixelCrop(null);
            setMode("carve");
            setIsAdjusting(true);
          } else {
            alert(`Failed to crop image: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }
      } else {
        if (proceedToCarve) {
          if (!originalImageSrc) {
            setOriginalImageSrc(sourceImage);
          }
          setCroppedImageSrc(sourceImage);
          setCrop(undefined);
          setCompletedPercentCrop(null);
          setCompletedPixelCrop(null);
          setMode("carve");
          setIsAdjusting(true);
        } else {
          alert("Please select a crop area first.");
        }
      }
    },
    [
      imageSrc,
      originalImageSrc,
      completedPercentCrop,
      crop,
      completedPixelCrop,
      format,
      isCircularCrop,
      resentFromStoryboardSliceIndex,
      shapeStudioCropIndex,
      handleUpdateSliceUrl,
      pushToCropHistory,
    ]
  );

  const handleResendFrameToCrop = useCallback((url: string, sliceIdx?: number | null, slotIdx?: number | null) => {
    setImageSrc(url);
    setCroppedImageSrc(url);
    setCrop(undefined);
    setCompletedPercentCrop(null);
    setMode("crop");
    setShapeStudioCropIndex(sliceIdx ?? null);
    setShapeStudioCropOriginalUrl(url);
    setIsBubba1ModalOpen(false);
    setIsNeo1ModalOpen(false);
    setExpandedModalOpen(false);
    setIsShapeStudioOpen(false);
    setResentFromStoryboardSliceIndex(sliceIdx ?? null);
    setResentFromStoryboardSlotIndex(slotIdx ?? null);
  }, []);

  const handleApplyCropDirectToStoryboard = useCallback(async () => {
    if (shapeStudioCropIndex === null) return;
    const sourceImage = imageSrc || originalImageSrc;
    if (!sourceImage) return;

    const targetCrop = completedPercentCrop || crop || completedPixelCrop;

    try {
      let croppedUrl = sourceImage;
      if (
        targetCrop &&
        targetCrop.width &&
        targetCrop.height &&
        targetCrop.width > 0 &&
        targetCrop.height > 0
      ) {
        const result = await getCroppedImg(
          sourceImage,
          targetCrop,
          "image/png",
          imgRef.current,
          isCircularCrop
        );
        if (result) {
          croppedUrl = result;
        }
      }

      // Update the storyboard slice URL at shapeStudioCropIndex
      handleUpdateSliceUrl(shapeStudioCropIndex, croppedUrl);

      // Clear states
      setCrop(undefined);
      setCompletedPercentCrop(null);
      setCompletedPixelCrop(null);
      setShapeStudioCropIndex(null);
      setShapeStudioCropOriginalUrl(null);
      setCropNotice("\u2713 Crop applied directly to storyboard!");
      setTimeout(() => setCropNotice(null), 3000);
    } catch (err) {
      console.error("Failed to crop direct to storyboard:", err);
      alert(`Failed to crop: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [shapeStudioCropIndex, imageSrc, originalImageSrc, completedPercentCrop, crop, completedPixelCrop, handleUpdateSliceUrl]);

  const handleApplyCropAndBackToShapeStudio = useCallback(async () => {
    if (shapeStudioCropIndex === null) return;
    const sourceImage = imageSrc || originalImageSrc;
    if (!sourceImage) return;

    const targetCrop = completedPercentCrop || crop || completedPixelCrop;

    try {
      let croppedUrl = sourceImage;
      if (
        targetCrop &&
        targetCrop.width &&
        targetCrop.height &&
        targetCrop.width > 0 &&
        targetCrop.height > 0
      ) {
        const result = await getCroppedImg(
          sourceImage,
          targetCrop,
          "image/png",
          imgRef.current,
          isCircularCrop
        );
        if (result) {
          croppedUrl = result;
        }
      }

      // Update the storyboard slice URL
      handleUpdateSliceUrl(shapeStudioCropIndex, croppedUrl);

      // Reopen ShapeStudio with this index
      setShapeStudioActiveFrameIdx(shapeStudioCropIndex);
      setIsShapeStudioOpen(true);

      // Clear states
      setCrop(undefined);
      setCompletedPercentCrop(null);
      setCompletedPixelCrop(null);
      setShapeStudioCropIndex(null);
      setShapeStudioCropOriginalUrl(null);
    } catch (err) {
      console.error("Failed to crop and go back to ShapeStudio:", err);
      alert(`Failed to crop: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [shapeStudioCropIndex, imageSrc, originalImageSrc, completedPercentCrop, crop, completedPixelCrop, handleUpdateSliceUrl]);

  const handleCancelBackToShapeStudio = useCallback(() => {
    if (shapeStudioCropIndex !== null) {
      setShapeStudioActiveFrameIdx(shapeStudioCropIndex);
      setIsShapeStudioOpen(true);
      setShapeStudioCropIndex(null);
      setShapeStudioCropOriginalUrl(null);
      setCrop(undefined);
      setCompletedPercentCrop(null);
      setCompletedPixelCrop(null);
    }
  }, [shapeStudioCropIndex]);
  const [showPixelLabels, setShowPixelLabels] = useState<boolean>(true);
  const [showGridLabels, setShowGridLabels] = useState<boolean>(true);
  const [gridLabelPreset, setGridLabelPreset] = useState<GridLabelPreset>(() => {
    try {
      const saved = remoteStore.getItem("seqcarver_grid_label_preset_v1");
      return (saved as GridLabelPreset) || "numeric";
    } catch {
      return "numeric";
    }
  });
  const [customGridLabelPrefix, setCustomGridLabelPrefix] = useState<string>(() => {
    try {
      return remoteStore.getItem("seqcarver_grid_label_custom_prefix_v1") || "Shot";
    } catch {
      return "Shot";
    }
  });
  const [isGridLabelMenuOpen, setIsGridLabelMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_grid_label_preset_v1", gridLabelPreset);
    } catch {}
  }, [gridLabelPreset]);

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_grid_label_custom_prefix_v1", customGridLabelPrefix);
    } catch {}
  }, [customGridLabelPrefix]);

  const [renderGridLabelsOnExport, setRenderGridLabelsOnExport] = useState<boolean>(() => {
    try {
      const saved = remoteStore.getItem("seqcarver_render_grid_labels_on_export_v2");
      return saved === "true"; // default is false (off)
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      remoteStore.setItem("seqcarver_render_grid_labels_on_export_v2", String(renderGridLabelsOnExport));
    } catch {}
  }, [renderGridLabelsOnExport]);
  const [isSliceLineSettingsOpen, setIsSliceLineSettingsOpen] = useState<boolean>(false);
  const [isLayoutPresetsOpen, setIsLayoutPresetsOpen] = useState<boolean>(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState<boolean>(false);
  const [autoDetectNotice, setAutoDetectNotice] = useState<string | null>(null);

  const handleAutoDetectBorders = useCallback(async () => {
    const targetImageSrc = croppedImageSrc || imageSrc;
    if (!targetImageSrc) return;

    setIsAutoDetecting(true);
    setAutoDetectNotice(null);
    try {
      const res = await autoDetectBorders(targetImageSrc, rowCuts, colCuts);
      setOuterMargin(res.outerMargin);
      setSliceLineThickness(res.sliceLineThickness);
      setAutoDetectNotice(`Detected F-Trim: ${res.outerMargin}px | Gap: ${res.sliceLineThickness}px`);
      setTimeout(() => setAutoDetectNotice(null), 4000);
    } catch (err) {
      console.error("Auto-detect borders failed:", err);
    } finally {
      setIsAutoDetecting(false);
    }
  }, [croppedImageSrc, imageSrc, rowCuts, colCuts]);

  const handleAutoSizeGrid = useCallback(() => {
    const w = carveImageSize.width;
    const h = carveImageSize.height;
    if (!w || !h) {
      alert("Please load or crop an image into the Carver first.");
      return;
    }

    const aspect = w / h;
    let targetRows = 4;
    let targetCols = 4;

    if (aspect >= 2.5) {
      targetRows = 2;
      targetCols = Math.max(1, Math.min(16, Math.round(2 * aspect)));
    } else if (aspect >= 1.4) {
      targetRows = 3;
      targetCols = Math.max(1, Math.min(16, Math.round(3 * aspect)));
    } else if (aspect <= 0.4) {
      targetCols = 2;
      targetRows = Math.max(1, Math.min(16, Math.round(2 / aspect)));
    } else if (aspect <= 0.7) {
      targetCols = 3;
      targetRows = Math.max(1, Math.min(16, Math.round(3 / aspect)));
    } else {
      targetRows = 4;
      targetCols = 4;
    }

    setNumRows(targetRows);
    setNumCols(targetCols);

    const newRowCuts = Array.from({ length: Math.max(0, targetRows - 1) }, (_, i) =>
      Math.round(((i + 1) * h) / targetRows)
    );
    const newColCuts = Array.from({ length: Math.max(0, targetCols - 1) }, (_, i) =>
      Math.round(((i + 1) * w) / targetCols)
    );

    setRowCuts(newRowCuts);
    setColCuts(newColCuts);
  }, [carveImageSize]);

  const handleApplyLayoutPreset = useCallback((presetType: string) => {
    const w = carveImageSize.width || 800;
    const h = carveImageSize.height || 600;

    if (presetType === "standard_grid") {
      setNumRows(3);
      setNumCols(3);
      setRowCuts([Math.round(h * 0.33), Math.round(h * 0.66)]);
      setColCuts([Math.round(w * 0.33), Math.round(w * 0.66)]);
      setCarverSkew(0);
    } else if (presetType === "asymmetrical_hero") {
      setNumRows(3);
      setNumCols(3);
      setRowCuts([Math.round(h * 0.20), Math.round(h * 0.80)]);
      setColCuts([Math.round(w * 0.20), Math.round(w * 0.80)]);
      setCarverSkew(0);
    } else if (presetType === "cinematic_strip") {
      setNumRows(3);
      setNumCols(1);
      setRowCuts([Math.round(h * 0.15), Math.round(h * 0.85)]);
      setColCuts([]);
      setCarverSkew(0);
    } else if (presetType === "manga_slanted") {
      setNumRows(3);
      setNumCols(2);
      setRowCuts([Math.round(h * 0.30), Math.round(h * 0.68)]);
      setColCuts([Math.round(w * 0.50)]);
      setCarverSkew(-8);
    } else if (presetType === "overlapping_right") {
      setNumRows(3);
      setNumCols(2);
      setRowCuts([Math.round(h * 0.33), Math.round(h * 0.66)]);
      setColCuts([Math.round(w * 0.65)]);
      setCarverSkew(0);
    } else if (presetType === "golden_ratio") {
      setNumRows(2);
      setNumCols(2);
      setRowCuts([Math.round(h * 0.382)]);
      setColCuts([Math.round(w * 0.618)]);
      setCarverSkew(0);
    }
  }, [carveImageSize]);

  const [canvasFitMode, setCanvasFitMode] = useState<"fit" | "fit-width" | "fit-height" | "actual" | "custom">("fit");
  const [canvasZoom, setCanvasZoom] = useState<number>(1);
  const [viewportDimensions, setViewportDimensions] = useState<{ width: number; height: number }>({ width: 1200, height: 800 });
  const [isPanToolActive, setIsPanToolActive] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(340);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isGridConfigVisible, setIsGridConfigVisible] = useState<boolean>(true);
  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);

  const isLeftSidebarVisible = isGridConfigVisible && !isSidebarCollapsed;

  const toggleLeftSidebar = useCallback((explicitState?: boolean) => {
    if (typeof explicitState === "boolean") {
      setIsGridConfigVisible(explicitState);
      setIsSidebarCollapsed(!explicitState);
    } else {
      setIsGridConfigVisible((prev) => {
        const nextVisible = !(prev && !isSidebarCollapsed);
        setIsSidebarCollapsed(!nextVisible);
        return nextVisible;
      });
    }
  }, [isSidebarCollapsed]);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic Viewport-to-Stage Auto-Fit Calculation via ResizeObserver
  useEffect(() => {
    if (!canvasContainerRef.current) return;
    const updateDimensions = () => {
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        const nextWidth = Math.max(100, Math.round(rect.width));
        const nextHeight = Math.max(100, Math.round(rect.height));
        setViewportDimensions((prev) =>
          prev.width === nextWidth && prev.height === nextHeight
            ? prev
            : { width: nextWidth, height: nextHeight }
        );
      }
    };
    updateDimensions();
    const ro = new ResizeObserver(updateDimensions);
    ro.observe(canvasContainerRef.current);
    window.addEventListener("resize", updateDimensions);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Compute exact viewport auto-fit scale
  const autoFitScale = useMemo(() => {
    const activeW = mode === "carve" ? (carveImageSize.width || 800) : 800;
    const activeH = mode === "carve" ? (carveImageSize.height || 600) : 600;
    const padX = 36;
    const padY = 36;
    const availW = Math.max(80, viewportDimensions.width - padX);
    const availH = Math.max(80, viewportDimensions.height - padY);
    const scale = Math.min(availW / activeW, availH / activeH);
    return Math.max(0.1, Math.min(2.5, Math.round(scale * 100) / 100));
  }, [mode, carveImageSize, viewportDimensions]);

  // Fit to screen handler
  const handleFitToScreen = useCallback((targetMode: "fit" | "fit-width" | "fit-height" | "actual" | "custom" = "fit") => {
    setCanvasFitMode(targetMode);
    if (targetMode === "actual") {
      setCanvasZoom(1);
    } else if (targetMode === "fit") {
      setCanvasZoom(autoFitScale);
    } else if (targetMode === "fit-width") {
      const activeW = mode === "carve" ? (carveImageSize.width || 800) : 800;
      const scale = Math.max(0.1, Math.min(3, (viewportDimensions.width - 36) / activeW));
      setCanvasZoom(Math.round(scale * 100) / 100);
    } else if (targetMode === "fit-height") {
      const activeH = mode === "carve" ? (carveImageSize.height || 600) : 600;
      const scale = Math.max(0.1, Math.min(3, (viewportDimensions.height - 36) / activeH));
      setCanvasZoom(Math.round(scale * 100) / 100);
    }
  }, [autoFitScale, mode, carveImageSize, viewportDimensions]);

  // Keyboard shortcut listeners for 'F' (Fit to Screen) and '[' (Toggle Left Sidebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setCanvasFitMode((prev) => (prev === "fit" ? "actual" : "fit"));
      } else if ((e.key === "[" || e.key === "]") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleLeftSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleLeftSidebar]);

  const handleSidebarResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  };

  useEffect(() => {
    if (!isResizingSidebar) return;
    const handlePointerMove = (e: PointerEvent) => {
      const maxAllowed = Math.floor(window.innerWidth * 0.48);
      setSidebarWidth(Math.max(220, Math.min(Math.max(380, maxAllowed), e.clientX)));
    };
    const handlePointerUp = () => {
      setIsResizingSidebar(false);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isResizingSidebar]);
  const isPanningRef = useRef<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const handlePanMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("a")) {
      return;
    }
    if (isPanToolActive || canvasFitMode === "actual" || e.button === 1) {
      const container = canvasContainerRef.current;
      if (!container) return;
      isPanningRef.current = true;
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: container.scrollLeft,
        scrollTop: container.scrollTop,
      };
    }
  };

  const handlePanMouseMove = (e: React.MouseEvent) => {
    if (!isPanningRef.current || !canvasContainerRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    canvasContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
    canvasContainerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const handlePanMouseUp = () => {
    isPanningRef.current = false;
    setIsPanning(false);
  };

  const handleResendFrameToCarve = (imageUrl: string, frameName?: string) => {
    setImageSrc(imageUrl);
    setCroppedImageSrc(imageUrl);
    setCrop(undefined);
    setCompletedPercentCrop(null);
    setMode("carve");
    setIsBubba1ModalOpen(false);
    setIsNeo1ModalOpen(false);
    setExpandedModalOpen(false);
    if (frameName) {
      const cleanName = frameName.replace(/[^a-zA-Z0-9_-]/g, "_");
      setSlicePrefix(`${cleanName}-sub`);
    }
    const img = new Image();
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setCarveImageSize({ width: w, height: h });
      setNumRows(2);
      setNumCols(2);
      setRowCuts([Math.round(h / 2)]);
      setColCuts([Math.round(w / 2)]);
    };
    img.onerror = () => {
      console.warn("Failed to load image dimensions for carving");
    };
    img.src = imageUrl;
  };

  const [isProcessing, setIsProcessing] = useState(false);

  // Storyboard State
  const [storyboardSlices, setStoryboardSlices] = useState<
    { name: string; url: string }[]
  >([]);

  const handleApplyMultiCrops = useCallback(async (
    targetMode: "storyboard-slices" | "storyboard-slots" | "stay-in-crop" = "storyboard-slices"
  ) => {
    const sourceImage = imageSrc || originalImageSrc;
    if (!sourceImage) return;
    if (multiCrops.length === 0) return;

    try {
      const newSlices: { name: string; url: string }[] = [];
      for (let i = 0; i < multiCrops.length; i++) {
        const item = multiCrops[i];
        const croppedUrl = await getCroppedImg(
          sourceImage,
          item.crop,
          format,
          imgRef.current,
          item.isCircular
        );
        if (croppedUrl) {
          const frameNum = storyboardSlices.length + i + 1;
          newSlices.push({
            name: `${slicePrefix || "Frame"} ${frameNum}`,
            url: croppedUrl,
          });
        }
      }

      if (newSlices.length > 0) {
        setStoryboardSlices((prev) => [...prev, ...newSlices]);

        if (targetMode === "storyboard-slots") {
          setStoryboardSlots((slots) => {
            const nextSlots = [...slots];
            let sliceIdx = 0;
            for (let s = 0; s < nextSlots.length && sliceIdx < newSlices.length; s++) {
              if (!nextSlots[s].url) {
                nextSlots[s] = {
                  url: newSlices[sliceIdx].url,
                  name: newSlices[sliceIdx].name,
                  story: nextSlots[s].story || "",
                };
                sliceIdx++;
              }
            }
            while (sliceIdx < newSlices.length) {
              nextSlots.push({
                url: newSlices[sliceIdx].url,
                name: newSlices[sliceIdx].name,
                story: "",
              });
              sliceIdx++;
            }
            return nextSlots;
          });
          setMode("storyboard");
          setCropNotice(`\u2713 Placed ${newSlices.length} multi-crops directly onto Storyboard slots!`);
        } else if (targetMode === "storyboard-slices") {
          setMode("storyboard");
          setCropNotice(`\u2713 Added ${newSlices.length} multi-crop slices to Storyboard!`);
        } else {
          setCropNotice(`\u2713 Added ${newSlices.length} multi-crop slices to Storyboard assets!`);
        }

        setMultiCrops([]);
        setTimeout(() => setCropNotice(null), 3000);
      }
    } catch (err) {
      console.error("Failed to apply multi-crops:", err);
      alert(`Failed to apply multi-crops: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [imageSrc, originalImageSrc, multiCrops, format, storyboardSlices.length, slicePrefix]);

  const handleSendSingleMultiCropToStoryboard = useCallback(async (
    item: { id: string; crop: Crop; isCircular: boolean },
    directToSlot = false
  ) => {
    const sourceImage = imageSrc || originalImageSrc;
    if (!sourceImage) return;

    try {
      const croppedUrl = await getCroppedImg(
        sourceImage,
        item.crop,
        format,
        imgRef.current,
        item.isCircular
      );
      if (croppedUrl) {
        const frameNum = storyboardSlices.length + 1;
        const newName = `${slicePrefix || "Frame"} ${frameNum}`;
        const newSlice = { name: newName, url: croppedUrl };

        setStoryboardSlices((prev) => [...prev, newSlice]);

        if (directToSlot) {
          setStoryboardSlots((slots) => {
            const nextSlots = [...slots];
            const emptyIdx = nextSlots.findIndex((s) => !s.url);
            if (emptyIdx !== -1) {
              nextSlots[emptyIdx] = { url: croppedUrl, name: newName, story: nextSlots[emptyIdx].story || "" };
            } else {
              nextSlots.push({ url: croppedUrl, name: newName, story: "" });
            }
            return nextSlots;
          });
        }

        setMultiCrops((prev) => prev.filter((c) => c.id !== item.id));
        setCropNotice(`\u2713 Sent crop to Storyboard!`);
        setTimeout(() => setCropNotice(null), 2500);
      }
    } catch (err) {
      console.error("Failed to send multi-crop to storyboard:", err);
    }
  }, [imageSrc, originalImageSrc, format, storyboardSlices.length, slicePrefix]);
  const [selectedSliceUrls, setSelectedSliceUrls] = useState<Set<string>>(
    new Set()
  );
  const [lastSelectedSliceIndex, setLastSelectedSliceIndex] = useState<number | null>(null);
  const [selectedSplitIndices, setSelectedSplitIndices] = useState<Set<number>>(
    new Set()
  );

  const toggleSplitIndex = useCallback((num: number) => {
    setSelectedSplitIndices((prev) => {
      const next = new Set(prev);
      if (next.has(num)) {
        next.delete(num);
      } else {
        next.add(num);
      }
      return next;
    });
  }, []);

  const toggleSelectAllSplits = useCallback((total: number) => {
    setSelectedSplitIndices((prev) => {
      if (prev.size === total && total > 0) {
        return new Set();
      } else {
        const all = new Set<number>();
        for (let i = 1; i <= total; i++) {
          all.add(i);
        }
        return all;
      }
    });
  }, []);

  const gridSegments = useMemo(() => {
    if (carveImageSize.width <= 0 || carveImageSize.height <= 0) return [];
    const w = carveImageSize.width;
    const h = carveImageSize.height;

    const rowBounds: number[] = [0, ...rowCuts, h].sort((a, b) => a - b);
    const colBounds: number[] = [0, ...colCuts, w].sort((a, b) => a - b);

    const totalRows = Math.max(1, rowBounds.length - 1);
    const totalCols = Math.max(1, colBounds.length - 1);

    const cells = getGridCellSequence(totalRows, totalCols, numberingOrigin, numberingFlow);

    const defaultThickness = Math.max(0, sliceLineThickness || 0);
    const thicknessX = Math.max(0, sliceLineThicknessX ?? defaultThickness);
    const thicknessY = Math.max(0, sliceLineThicknessY ?? defaultThickness);

    const halfBeforeX = Math.floor(thicknessX / 2);
    const halfAfterX = Math.ceil(thicknessX / 2);
    const halfBeforeY = Math.floor(thicknessY / 2);
    const halfAfterY = Math.ceil(thicknessY / 2);

    const margin = Math.max(0, outerMargin || 0);

    return cells.map(({ r, c, seq }) => {
      let y0 = Math.round(r === 0 ? rowBounds[0] + margin : rowBounds[r] + halfAfterY);
      let y1 = Math.round(r === totalRows - 1 ? rowBounds[totalRows] - margin : rowBounds[r + 1] - halfBeforeY);
      let x0 = Math.round(c === 0 ? colBounds[0] + margin : colBounds[c] + halfAfterX);
      let x1 = Math.round(c === totalCols - 1 ? colBounds[totalCols] - margin : colBounds[c + 1] - halfBeforeX);

      // Apply internal cell padding (positive insets inward, negative expands outward to touch edges)
      if (sliceCellPadding !== 0) {
        const maxPadX = Math.floor((x1 - x0 - 2) / 2);
        const maxPadY = Math.floor((y1 - y0 - 2) / 2);
        const effectivePadX = sliceCellPadding > 0 ? Math.min(sliceCellPadding, Math.max(0, maxPadX)) : sliceCellPadding;
        const effectivePadY = sliceCellPadding > 0 ? Math.min(sliceCellPadding, Math.max(0, maxPadY)) : sliceCellPadding;

        x0 = Math.max(0, Math.min(w - 1, x0 + effectivePadX));
        x1 = Math.max(x0 + 1, Math.min(w, x1 - effectivePadX));
        y0 = Math.max(0, Math.min(h - 1, y0 + effectivePadY));
        y1 = Math.max(y0 + 1, Math.min(h, y1 - effectivePadY));
      }

      if (y1 <= y0) {
        y0 = rowBounds[r];
        y1 = rowBounds[r + 1];
      }
      const heightPx = Math.max(1, y1 - y0);

      if (x1 <= x0) {
        x0 = colBounds[c];
        x1 = colBounds[c + 1];
      }
      const widthPx = Math.max(1, x1 - x0);

      const topPercent = (y0 / h) * 100;
      const leftPercent = (x0 / w) * 100;
      const widthPercent = (widthPx / w) * 100;
      const heightPercent = (heightPx / h) * 100;

      return {
        r,
        c,
        seq,
        topPercent,
        leftPercent,
        widthPercent,
        heightPercent,
        widthPx,
        heightPx,
      };
    });
  }, [
    carveImageSize,
    rowCuts,
    colCuts,
    numberingOrigin,
    numberingFlow,
    sliceLineThickness,
    sliceLineThicknessX,
    sliceLineThicknessY,
    outerMargin,
    sliceCellPadding,
  ]);
  type StoryboardSlotItem = { url: string | null; name: string; story: string; title?: string };
  const [storyboardSlots, setStoryboardSlots] = useState<StoryboardSlotItem[]>(
    Array.from({ length: 9 }, () => ({ url: null, name: "", story: "" }))
  );

  const handleCropToStoryboard = useCallback(
    async () => {
      const sourceImage = imageSrc || originalImageSrc;
      if (!sourceImage) {
        alert("No image to crop!");
        return;
      }

      const targetCrop = completedPercentCrop || crop || completedPixelCrop;

      if (
        targetCrop &&
        targetCrop.width &&
        targetCrop.height &&
        targetCrop.width > 0 &&
        targetCrop.height > 0
      ) {
        try {
          const croppedUrl = await getCroppedImg(
            sourceImage,
            targetCrop,
            format,
            imgRef.current,
            isCircularCrop
          );
          
          const finalUrl = croppedUrl || sourceImage;
          
          // Add to storyboard
          const sliceName = `Crop ${storyboardSlices.length + 1}`;
          const newSlice = { name: sliceName, url: finalUrl };
          setStoryboardSlices((prev) => [...prev, newSlice]);
          
          // Add to first empty slot or append a slot if needed
          setStoryboardSlots((prevSlots) => {
            const nextSlots = [...prevSlots];
            const emptyIdx = nextSlots.findIndex((s) => !s.url);
            if (emptyIdx !== -1) {
              nextSlots[emptyIdx] = { ...nextSlots[emptyIdx], url: finalUrl, name: sliceName };
            } else {
              nextSlots.push({ url: finalUrl, name: sliceName, story: "" });
            }
            return nextSlots;
          });

          // Select the newly cropped image as active to keep state coherent
          setImageSrc(finalUrl);
          setCroppedImageSrc(finalUrl);
          setCrop(undefined);
          setCompletedPercentCrop(null);
          setCompletedPixelCrop(null);

          setCropNotice("\u2713 Crop added to Storyboard!");
          setTimeout(() => setCropNotice(null), 3000);

          // Return to storyboard mode
          setMode("storyboard");
        } catch (err) {
          console.error("Failed to crop to storyboard:", err);
          alert(`Failed to crop to storyboard: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } else {
        alert("Please select a crop area first.");
      }
    },
    [imageSrc, originalImageSrc, completedPercentCrop, crop, completedPixelCrop, format, isCircularCrop, storyboardSlices.length, setStoryboardSlices, setStoryboardSlots, setMode]
  );

  const handleCropToStoryboardReplace = useCallback(
    async () => {
      const sourceImage = imageSrc || originalImageSrc;
      if (!sourceImage) {
        alert("No image to crop!");
        return;
      }

      const targetCrop = completedPercentCrop || crop || completedPixelCrop;

      if (
        targetCrop &&
        targetCrop.width &&
        targetCrop.height &&
        targetCrop.width > 0 &&
        targetCrop.height > 0
      ) {
        try {
          const croppedUrl = await getCroppedImg(
            sourceImage,
            targetCrop,
            format,
            imgRef.current,
            isCircularCrop
          );
          
          const finalUrl = croppedUrl || sourceImage;

          let replaced = false;

          // Replace in storyboard slots
          if (resentFromStoryboardSlotIndex !== null) {
            setStoryboardSlots((prevSlots) => {
              const nextSlots = [...prevSlots];
              if (nextSlots[resentFromStoryboardSlotIndex]) {
                nextSlots[resentFromStoryboardSlotIndex] = {
                  ...nextSlots[resentFromStoryboardSlotIndex],
                  url: finalUrl,
                };
              }
              return nextSlots;
            });
            setCropNotice("\u2713 Crop replaced in Storyboard slot!");
            replaced = true;
          }

          // Replace in storyboard slices
          if (resentFromStoryboardSliceIndex !== null) {
            setStoryboardSlices((prevSlices) => {
              const nextSlices = [...prevSlices];
              if (nextSlices[resentFromStoryboardSliceIndex]) {
                nextSlices[resentFromStoryboardSliceIndex] = {
                  ...nextSlices[resentFromStoryboardSliceIndex],
                  url: finalUrl,
                };
              }
              return nextSlices;
            });
            if (!replaced) {
              setCropNotice("\u2713 Crop replaced in Storyboard slice!");
              replaced = true;
            }
          }

          // Fallback if no specific origin: replace first occupied slot, or last added slice, or first empty slot
          if (!replaced) {
            if (storyboardSlices.length > 0) {
              setStoryboardSlices((prev) => {
                const next = [...prev];
                if (next.length > 0) {
                  next[next.length - 1] = {
                    ...next[next.length - 1],
                    url: finalUrl,
                  };
                }
                return next;
              });
              replaced = true;
            }
            
            setStoryboardSlots((prevSlots) => {
              const nextSlots = [...prevSlots];
              // Try finding slot that had the original image URL
              const originalUrl = imageSrc;
              const idx = nextSlots.findIndex((s) => s.url === originalUrl);
              if (idx !== -1) {
                nextSlots[idx] = { ...nextSlots[idx], url: finalUrl };
              } else if (!replaced) {
                // Replace the first occupied slot, or first empty
                const occIdx = nextSlots.findIndex((s) => s.url);
                if (occIdx !== -1) {
                  nextSlots[occIdx] = { ...nextSlots[occIdx], url: finalUrl };
                } else {
                  nextSlots[0] = { ...nextSlots[0], url: finalUrl };
                }
              }
              return nextSlots;
            });
            
            setCropNotice("\u2713 Crop replaced in Storyboard!");
          }

          setImageSrc(finalUrl);
          setCroppedImageSrc(finalUrl);
          setCrop(undefined);
          setCompletedPercentCrop(null);
          setCompletedPixelCrop(null);

          setTimeout(() => setCropNotice(null), 3000);

          // Return to storyboard mode
          setMode("storyboard");
        } catch (err) {
          console.error("Failed to replace in storyboard:", err);
          alert(`Failed to replace in storyboard: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } else {
        alert("Please select a crop area first.");
      }
    },
    [imageSrc, originalImageSrc, completedPercentCrop, crop, completedPixelCrop, format, isCircularCrop, resentFromStoryboardSliceIndex, resentFromStoryboardSlotIndex, storyboardSlices, setStoryboardSlices, setStoryboardSlots, setMode]
  );

  const [draggedSliceUrl, setDraggedSliceUrl] = useState<string | null>(null);
  const [draggedSlotIdx, setDraggedSlotIdx] = useState<number | null>(null);
  const [storyboardDropAction, setStoryboardDropAction] = useState<"reorder" | "replace" | "swap">("reorder");
  const [storyboardCellMode, setStoryboardCellMode] = useState<
    "image-only" | "image-name" | "full"
  >("image-name");
  const [storyboardLayout, setStoryboardLayout] = useState<
    "grid9" | "list-dynamic" | "strip"
  >("grid9");
  const [slotSize, setSlotSize] = useState<SlotSize>("md");
  const [isReverseInsert, setIsReverseInsert] = useState(false);
  const [isStoryboardLocked, setIsStoryboardLocked] = useState<boolean>(false);

  const [isStoryboardVisible, setIsStoryboardVisible] = useState<boolean>(true);
  const [carvedSlicesBgColor, setCarvedSlicesBgColor] = useState<string>("#0f172a");
  const [isCarvedSlicesColorMenuOpen, setIsCarvedSlicesColorMenuOpen] = useState<boolean>(false);
  const [carvedSlicesExpandedCols, setCarvedSlicesExpandedCols] = useState<number>(4);
  const [carvedSlicesSearch, setCarvedSlicesSearch] = useState<string>("");
  const carvedSlicesColorMenuRef = useRef<HTMLDivElement>(null);
  const carvedSlicesColorMenuExpandedRef = useRef<HTMLDivElement>(null);

  const [draggedToolbarIconId, setDraggedToolbarIconId] = useState<string | null>(null);
  const [storyboardToolbarOrder, setStoryboardToolbarOrder] = useState<string[]>([
    "selectAll",
    "operations",
    "dropAction",
    "autoNumber",
    "title",
    "cellMode",
    "reverse",
    "duplicate",
    "saveDefaultState",
    "restoreDefaultState",
    "divider_2",
    "slotSize",
    "slotHeaders",
    "divider_3",
    "player",
    "rename",
    "divider_4",
    "clear",
    "clearEmpty",
  ]);

  // Shift Multi-Select States for Storyboard Slots
  const [selectedStoryboardSlotIndices, setSelectedStoryboardSlotIndices] = useState<Set<number>>(new Set());
  const [lastSelectedStoryboardSlotIndex, setLastSelectedStoryboardSlotIndex] = useState<number | null>(null);

  // Storyboard Default State Management Metadata
  const [savedStoryboardDefaultInfo, setSavedStoryboardDefaultInfo] = useState<{
    savedAt: string;
    slotsCount: number;
    slicesCount: number;
    layout: string;
    cellMode: string;
  } | null>(null);

  // Storyboard Asset Sorter & Organization State
  const [activeSortMode, setActiveSortMode] = useState<SortMode>("none");
  const [activeGroupMode, setActiveGroupMode] = useState<GroupMode>("none");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string | null>(null);
  const [autoSortOnImport, setAutoSortOnImport] = useState<boolean>(false);
  const [isAnalyzingSlices, setIsAnalyzingSlices] = useState<boolean>(false);
  const [sliceMetadataMap, setSliceMetadataMap] = useState<Map<string, SliceAssetMetadata>>(new Map());

  // Analyze Slices for Asset Sorter & Grouping
  useEffect(() => {
    if (storyboardSlices.length === 0) return;
    let isMounted = true;
    setIsAnalyzingSlices(true);
    bulkAnalyzeSlices(storyboardSlices.map((s) => s.url))
      .then((metaMap) => {
        if (!isMounted) return;
        setSliceMetadataMap(metaMap);
      })
      .catch((err) => {
        console.warn("Failed to analyze storyboard slice metadata:", err);
      })
      .finally(() => {
        if (isMounted) setIsAnalyzingSlices(false);
      });
    return () => {
      isMounted = false;
    };
  }, [storyboardSlices]);

  // Available groups for StoryboardAssetSorterBar
  const availableGroups = useMemo(() => {
    if (activeGroupMode === "none") return [];
    const groups = groupSlicesByMode(storyboardSlices, activeGroupMode, sliceMetadataMap);
    return groups.map((g) => ({
      id: g.id,
      title: g.title,
      count: g.count,
      badge: g.badge,
      colorSwatch: g.colorSwatch,
    }));
  }, [storyboardSlices, sliceMetadataMap, activeGroupMode]);

  // Sorted and filtered slices for the Storyboard Asset Pool display
  const sortedAndFilteredSlices = useMemo(() => {
    let result = [...storyboardSlices];
    if (activeSortMode !== "none") {
      result = sortSlicesByMode(result, activeSortMode, sliceMetadataMap);
    }
    if (activeGroupMode !== "none" && selectedGroupFilter) {
      const groups = groupSlicesByMode(result, activeGroupMode, sliceMetadataMap);
      const targetGroup = groups.find((g) => g.id === selectedGroupFilter);
      if (targetGroup) {
        result = targetGroup.items;
      }
    }
    return result;
  }, [storyboardSlices, activeSortMode, activeGroupMode, selectedGroupFilter, sliceMetadataMap]);

  const handleApplySortedOrderToPool = useCallback(() => {
    if (activeSortMode === "none") return;
    const sorted = sortSlicesByMode(storyboardSlices, activeSortMode, sliceMetadataMap);
    setStoryboardSlices(sorted);
    setCropNotice(`✓ Applied ${activeSortMode} sort order permanently to Asset Pool!`);
    setTimeout(() => setCropNotice(null), 2500);
  }, [activeSortMode, storyboardSlices, sliceMetadataMap]);

  const handleResetSortedOrder = useCallback(() => {
    setActiveSortMode("none");
    setActiveGroupMode("none");
    setSelectedGroupFilter(null);
  }, []);

  const handleSelectStoryboardLayout = (newLayout: "grid9" | "list-dynamic" | "strip") => {
    setStoryboardLayout(newLayout);
    if (newLayout === "grid9") {
      // 3x3 is rows of 3x3 without any info
      setStoryboardCellMode("image-only");
      setStoryboardSlots((prev) => {
        const next = [...prev];
        while (next.length < 9) next.push({ url: null, name: "", story: "" });
        return next;
      });
    } else if (newLayout === "list-dynamic") {
      // Grid is cell with name
      setStoryboardCellMode("image-name");
      const desired = numRows * numCols > 0 ? numRows * numCols : 9;
      setStoryboardSlots((prev) => {
        const next = [...prev];
        while (next.length < desired) next.push({ url: null, name: "", story: "" });
        return next;
      });
    } else if (newLayout === "strip") {
      // strip is 1 row horizontally followed by row 2 etc with full info
      setStoryboardCellMode("full");
    }
  };

  // 1 Button Cycles through the 3 Views (3x3 Grid -> Dynamic Grid -> Strip View)
  const handleCycleStoryboardView = () => {
    if (storyboardLayout === "grid9") {
      handleSelectStoryboardLayout("list-dynamic");
    } else if (storyboardLayout === "list-dynamic") {
      handleSelectStoryboardLayout("strip");
    } else {
      handleSelectStoryboardLayout("grid9");
    }
  };

  // Available Storyboard Assets for filling landing boxes
  const availableStoryboardAssets = useMemo(() => {
    const map = new Map<string, string>();
    storyboardSlices.forEach((slice, i) => {
      if (slice.url) {
        map.set(slice.url, slice.name || `Slice ${i + 1}`);
      }
    });
    storyboardSlots.forEach((slot, i) => {
      if (slot.url && !map.has(slot.url)) {
        map.set(slot.url, slot.name || `Slot ${i + 1}`);
      }
    });
    return Array.from(map.entries()).map(([url, name]) => ({ url, name }));
  }, [storyboardSlices, storyboardSlots]);

  // Continuous debounced auto-save effect
  useEffect(() => {
    if (!isStateRestored) return;

    setAutoSaveStatus("saving");
    const timeoutId = setTimeout(() => {
      const currentState = {
        imageSrc,
        originalImageSrc,
        croppedImageSrc,
        mode,
        slicePrefix,
        numRows,
        numCols,
        rowCuts,
        colCuts,
        carveImageSize,
        format,
        numberingOrigin,
        numberingFlow,
        namingStyle,
        sliceLineColor,
        sliceLineStyle,
        sliceLineThickness,
        sliceLineThicknessX,
        sliceLineThicknessY,
        isGapLocked,
        outerMargin,
        sliceCellPadding,
        showPixelLabels,
        showGridLabels,
        canvasFitMode,
        sidebarWidth,
        boxImages,
        defaultBoxImages,
        originalSpreadImage,
        defaultBox1Image: boxImages[1] || originalSpreadImage || "",
        boxRotationSeries,
        boxRotationIntervals,
        boxRotationActive,
        boxLinkConfigs,
        sequencerPanelState,
        disableBoxActions,
        isBottomControlBarVisible,
        isSlideMenuOpen,
        multiCrops,
        storyboardSlices,
        storyboardSlots,
        storyboardCellMode,
        storyboardLayout,
        slotSize,
        isReverseInsert,
        storyboardDropAction,
        isStoryboardLocked,
        isStoryboardVisible,
        carvedSlicesBgColor,
        carvedSlicesExpandedCols,
        activeSortMode,
        activeGroupMode,
        selectedGroupFilter,
        autoSortOnImport,
        storyboardToolbarOrder,
        headerItemsOrder,
        freestyleToolbarOrder,
        panelControlsOrder,
        splitPreviewSize,
        splitPreviewLayout,
        isSplitPreviewCollapsed,
        isSplitPreviewVisible,
        splitPreviewOrientation,
        splitGridCols,
        screenplaySlides,
        activeScreenplaySlideId,
        isScreenplayOpen,
        meshSquareSize,
        meshBounds,
        meshMode,
        meshDestination,
        meshGridLineWidth,
        meshGridLineColor,
        meshAutoGotoAfterCut,
        freestyleSquares,
      };

      saveStoredJson("full_app_state_v2", currentState)
        .then(() => setAutoSaveStatus("saved"))
        .catch((err) => {
          console.warn("Auto-save failed:", err);
          setAutoSaveStatus("saved");
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    isStateRestored,
    imageSrc, originalImageSrc, croppedImageSrc, mode, slicePrefix,
    numRows, numCols, rowCuts, colCuts, carveImageSize, format,
    numberingOrigin, numberingFlow, namingStyle,
    sliceLineColor, sliceLineStyle, sliceLineThickness, sliceLineThicknessX, sliceLineThicknessY,
    isGapLocked, outerMargin, sliceCellPadding, showPixelLabels, showGridLabels, canvasFitMode, sidebarWidth,
    boxImages, defaultBoxImages, originalSpreadImage, boxRotationSeries, boxRotationIntervals, boxRotationActive,
    boxLinkConfigs, sequencerPanelState, disableBoxActions, isBottomControlBarVisible, isSlideMenuOpen, storyboardSlices, storyboardSlots,
    storyboardCellMode, storyboardLayout, slotSize, isReverseInsert, storyboardDropAction,
    isStoryboardLocked, isStoryboardVisible, carvedSlicesBgColor, carvedSlicesExpandedCols,
    activeSortMode, activeGroupMode, selectedGroupFilter, autoSortOnImport,
    storyboardToolbarOrder, headerItemsOrder, freestyleToolbarOrder, panelControlsOrder, multiCrops,
    splitPreviewSize, splitPreviewLayout, isSplitPreviewCollapsed, isSplitPreviewVisible,
    splitPreviewOrientation, splitGridCols, screenplaySlides, activeScreenplaySlideId, isScreenplayOpen,
    meshSquareSize, meshBounds, meshMode, meshDestination, meshGridLineWidth, meshGridLineColor, meshAutoGotoAfterCut, freestyleSquares,
  ]);

  // Immediate save on window unload / hide event
  useEffect(() => {
    if (!isStateRestored) return;

    const saveImmediate = () => {
      const currentState = {
        imageSrc,
        originalImageSrc,
        croppedImageSrc,
        mode,
        slicePrefix,
        numRows,
        numCols,
        rowCuts,
        colCuts,
        carveImageSize,
        format,
        numberingOrigin,
        numberingFlow,
        namingStyle,
        sliceLineColor,
        sliceLineStyle,
        sliceLineThickness,
        sliceLineThicknessX,
        sliceLineThicknessY,
        isGapLocked,
        outerMargin,
        sliceCellPadding,
        showPixelLabels,
        showGridLabels,
        canvasFitMode,
        sidebarWidth,
        boxImages,
        defaultBoxImages,
        originalSpreadImage,
        defaultBox1Image: boxImages[1] || originalSpreadImage || "",
        boxRotationSeries,
        boxRotationIntervals,
        boxRotationActive,
        boxLinkConfigs,
        sequencerPanelState,
        disableBoxActions,
        isBottomControlBarVisible,
        isSlideMenuOpen,
        multiCrops,
        storyboardSlices,
        storyboardSlots,
        storyboardCellMode,
        storyboardLayout,
        slotSize,
        isReverseInsert,
        storyboardDropAction,
        isStoryboardLocked,
        isStoryboardVisible,
        carvedSlicesBgColor,
        carvedSlicesExpandedCols,
        activeSortMode,
        activeGroupMode,
        selectedGroupFilter,
        autoSortOnImport,
        storyboardToolbarOrder,
        headerItemsOrder,
        freestyleToolbarOrder,
        panelControlsOrder,
        splitPreviewSize,
        splitPreviewLayout,
        isSplitPreviewCollapsed,
        isSplitPreviewVisible,
        splitPreviewOrientation,
        splitGridCols,
        screenplaySlides,
        activeScreenplaySlideId,
        isScreenplayOpen,
        meshSquareSize,
        meshBounds,
        meshMode,
        meshDestination,
        meshGridLineWidth,
        meshGridLineColor,
        meshAutoGotoAfterCut,
        freestyleSquares,
      };
      saveStoredJson("full_app_state_v2", currentState).catch(console.warn);
    };

    const handleBeforeUnload = () => saveImmediate();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") saveImmediate();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    isStateRestored,
    imageSrc, originalImageSrc, croppedImageSrc, mode, slicePrefix,
    numRows, numCols, rowCuts, colCuts, carveImageSize, format,
    numberingOrigin, numberingFlow, namingStyle,
    sliceLineColor, sliceLineStyle, sliceLineThickness, sliceLineThicknessX, sliceLineThicknessY,
    isGapLocked, outerMargin, sliceCellPadding, showPixelLabels, showGridLabels, canvasFitMode, sidebarWidth,
    boxImages, defaultBoxImages, originalSpreadImage, boxRotationSeries, boxRotationIntervals, boxRotationActive,
    boxLinkConfigs, sequencerPanelState, disableBoxActions, isBottomControlBarVisible, isSlideMenuOpen, storyboardSlices, storyboardSlots,
    storyboardCellMode, storyboardLayout, slotSize, isReverseInsert, storyboardDropAction,
    splitPreviewSize, splitPreviewLayout, isSplitPreviewCollapsed, isSplitPreviewVisible,
    splitPreviewOrientation, splitGridCols, screenplaySlides, activeScreenplaySlideId, isScreenplayOpen,
  ]);

  const sequencerRuntimePath = sequencerPanelState.path.filter(
    (slot) =>
      sequencerPanelState.activeSlots.includes(slot) &&
      slot <= (frontPageGridMode === "4x4" ? 16 : 9),
  );
  const activeSequencerSlot = sequencerRuntimePath[sequencerPanelState.currentStep - 1] ?? null;
  const isSequencerLive = !sequencerPanelState.bypassed && sequencerRuntimePath.length > 0;
  const sequencerAssignedCount = Object.values(sequencerPanelState.secondaryImages).filter(Boolean).length;

  const renderInteractiveBoxCard = (boxId: number) => {
    const image = boxImages[boxId];
    const secondarySequenceImage = sequencerPanelState.secondaryImages[boxId];
    const isActiveSequencerSlot =
      isSequencerLive && sequencerPanelState.playing && activeSequencerSlot === boxId;
    const displayedImage =
      isActiveSequencerSlot && secondarySequenceImage
        ? secondarySequenceImage
        : image || secondarySequenceImage;
    const sequencerVisualStyle = getSequencerRuntimeStyle(
      sequencerPanelState.warp,
      sequencerPanelState.turnMode,
      Boolean(isActiveSequencerSlot),
      sequencerPanelState.stepIntervalMs,
    );
    const isSpecialBox = boxId === 1 || boxId === 9;
    const is9BoxDefaultImg = Object.keys(defaultBoxImages).length === 9 && defaultBoxImages[boxId] === image && image !== "";
    const isRotationRunning = boxRotationActive[boxId] && (boxRotationSeries[boxId]?.length ?? 0) > 0;
    const linkConfig = boxLinkConfigs[boxId];
    const hasLink = disableBoxActions && linkConfig && linkConfig.url;

    const isDragSource = draggedBoxId === boxId;
    const isDragTarget = dragOverBoxId === boxId && draggedBoxId !== null && draggedBoxId !== boxId;
    const isSwapSelected = swapSelectedBoxId === boxId;
    const isOtherSwapSelected = swapSelectedBoxId !== null && swapSelectedBoxId !== boxId;

    const ElementType = hasLink ? "a" : "div";
    const linkProps = hasLink ? {
      href: linkConfig.url,
      target: linkConfig.target || "_blank",
      rel: "noopener noreferrer",
    } : {};

    return (
      <ElementType
        key={`interactive-box-${boxId}`}
        id={`box ${boxId}`}
        {...linkProps}
        draggable={!disableBoxActions}
        onDragStart={(e) => {
          if (disableBoxActions) return;
          e.dataTransfer.setData("application/x-seqcarver-panel-id", String(boxId));
          e.dataTransfer.setData("text/plain", image || `panel-${boxId}`);
          e.dataTransfer.effectAllowed = "move";
          setDraggedBoxId(boxId);
        }}
        onDragEnd={() => {
          setDraggedBoxId(null);
          setDragOverBoxId(null);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = e.dataTransfer.types.includes("application/x-seqcarver-panel-id") ? "move" : "copy";
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (draggedBoxId !== null && draggedBoxId !== boxId) {
            setDragOverBoxId(boxId);
          }
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          if (dragOverBoxId === boxId) {
            setDragOverBoxId(null);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          const targetBoxId = boxId;
          const panelIdStr = e.dataTransfer.getData("application/x-seqcarver-panel-id");
          setDragOverBoxId(null);
          setDraggedBoxId(null);
          if (disableBoxActions) return;

          if (panelIdStr) {
            const sourceId = parseInt(panelIdStr, 10);
            if (!isNaN(sourceId) && sourceId !== targetBoxId) {
              handleSwapBoxPanels(sourceId, targetBoxId);
              return;
            }
          }

          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            if (e.dataTransfer.files.length > 1) {
              loadMultipleFilesToStoryboard(Array.from(e.dataTransfer.files));
              return;
            }
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onload = () => {
              const url = reader.result?.toString() || "";
              if (url) {
                if (isSpecialBox) {
                  handleSplitImageTo9Boxes(url);
                } else {
                  setBoxImages((prev) => ({ ...prev, [boxId]: url }));
                }
              }
            };
            reader.readAsDataURL(file);
            return;
          }
          const url = e.dataTransfer.getData("text/plain");
          if (url && !url.startsWith("panel-")) {
            if (isSpecialBox) {
              handleSplitImageTo9Boxes(url);
            } else {
              setBoxImages((prev) => ({ ...prev, [boxId]: url }));
            }
          }
        }}
        onClick={(e) => {
          if (disableBoxActions) return;
          if (swapSelectedBoxId !== null) {
            e.preventDefault();
            e.stopPropagation();
            handleSelectPanelForSwap(boxId);
          }
        }}
        className={cn(
          frontPageGridMode === "4x4"
            ? "w-[min(20vw,110px,15vh)] h-[min(20vw,110px,15vh)] sm:w-[min(18vw,125px,17vh)] sm:h-[min(18vw,125px,17vh)] md:w-[min(16vw,135px,18.5vh)] md:h-[min(16vw,135px,18.5vh)] rounded-xl sm:rounded-2xl"
            : "w-[min(26vw,120px,18vh)] h-[min(26vw,120px,18vh)] sm:w-[min(24vw,135px,21vh)] sm:h-[min(24vw,135px,21vh)] md:w-[min(22vw,145px,23vh)] md:h-[min(22vw,145px,23vh)] rounded-xl",
          "p-0 border-0 bg-transparent flex flex-col items-center justify-between shadow-none shrink-0 overflow-hidden relative group transition-all duration-200 select-none",
          hasLink && "cursor-pointer block",
          !disableBoxActions && "cursor-grab active:cursor-grabbing",
          isDragSource && "opacity-40 scale-95 ring-2 ring-emerald-500/50",
          isDragTarget && "ring-2 ring-cyan-400 scale-[1.03] z-30 bg-cyan-950/80",
          isSwapSelected && "ring-2 ring-amber-400 scale-[1.02] z-20 bg-amber-950/60",
          isOtherSwapSelected && "hover:ring-2 hover:ring-amber-400/80 cursor-pointer"
        )}
        style={{
          perspective: "1000px",
        }}
      >
        {/* Selected indicator badge */}
        {isSwapSelected && (
          <div className="absolute top-1.5 right-1.5 z-25 bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-md animate-pulse flex items-center gap-0.5 pointer-events-none">
            <span>{uiText("app.span.selected", "SELECTED")}</span>
          </div>
        )}

        {/* Drag Target Drop Overlay */}
        {isDragTarget && (
          <div className="absolute inset-0 bg-cyan-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center rounded-xl border-2 border-dashed border-cyan-400 z-40 pointer-events-none animate-in fade-in duration-100">
            <ArrowLeftRight className="w-6 h-6 text-cyan-300 animate-pulse" />
            <span className="text-[10.5px] font-black text-cyan-200 mt-1 uppercase tracking-tight">
              {uiText("app.span.swap_panels", "Swap Panels")}
            </span>
          </div>
        )}

        {image || secondarySequenceImage ? (
          <div
            className={cn(
              "relative w-full h-full overflow-hidden group [perspective:1000px]",
              frontPageGridMode === "4x4" ? "rounded-xl sm:rounded-2xl" : "rounded-xl",
              isActiveSequencerSlot && "ring-2 ring-cyan-300/80 shadow-[0_0_18px_rgba(34,211,238,0.45)] z-20"
            )}
            style={sequencerVisualStyle}
          >
            <AnimatePresence mode="popLayout">
              <motion.img
                key={displayedImage}
                src={displayedImage}
                alt={`Box ${boxId} Image`}
                draggable={false}
                initial={{ opacity: 0, rotateY: isRotationRunning ? 90 : 0, scale: isRotationRunning ? 0.8 : 1 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: isRotationRunning ? -90 : 0, scale: isRotationRunning ? 0.8 : 1 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out",
                  !disableBoxActions && "group-hover:scale-105",
                  disableBoxActions && linkConfig?.hoverEffect === "spin" && "group-hover:[transform:rotateY(360deg)]"
                )}
              />
            </AnimatePresence>

            {/* Secondary image chosen in the Sequencer is transmitted to the front page. */}
            {secondarySequenceImage && (
              <img
                src={secondarySequenceImage}
                alt={`Box ${boxId} Secondary Image`}
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
              />
            )}
            {!secondarySequenceImage &&
              disableBoxActions &&
              linkConfig?.hoverEffect === "change-image" &&
              linkConfig?.hoverImage && (
                <img
                  src={linkConfig.hoverImage}
                  alt={`Box ${boxId} Hover Image`}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                />
              )}

            {/* Mouse-over locked icon representation on the front screen (configurable in backend, default off) */}
            {sequencerPanelState.showMouseOverLockIcons &&
              (secondarySequenceImage || (linkConfig?.hoverEffect === "change-image" && linkConfig?.hoverImage)) && (
                <div
                  className="pointer-events-none absolute bottom-1.5 right-1.5 z-20 flex items-center gap-1 rounded-md bg-slate-950/90 border border-emerald-400/80 px-1.5 py-0.5 shadow-[0_0_8px_rgba(0,223,145,0.4)] backdrop-blur-xs animate-in fade-in"
                  title={`Mouse-Over Locked Image on Panel #${boxId}`}
                >
                  <Lock className="w-2.5 h-2.5 text-emerald-400 stroke-[2.5]" />
                  <span className="text-[8px] font-mono font-bold text-emerald-300">LOCKED</span>
                  {secondarySequenceImage && (
                    <img
                      src={secondarySequenceImage}
                      alt=""
                      className="w-3.5 h-3.5 object-cover rounded-xs border border-emerald-500/50 ml-0.5"
                    />
                  )}
                </div>
              )}
            {!disableBoxActions && (
              <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-1">
                {/* Top Quick Bar (Appears on Hover, Minimal Non-Intrusive) */}
                <div className="flex items-center justify-between w-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-auto">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950/85 text-emerald-300 border border-emerald-500/40 backdrop-blur-xs shadow-xs">
                    #{boxId}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {boxId === 1 && (
                      <CustomizableButton
                        buttonId="front_page_box_set_default_btn"
                        defaultLabel="Set Default"
                        forceZeroText={true}
                        defaultIcon={<Bookmark className="w-2.5 h-2.5 text-amber-300" />}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const imgToUse = boxImages[1] || image;
                          if (imgToUse) {
                            handleSetNBoxDefault(imgToUse, 1);
                          }
                        }}
                        className="bg-slate-950/85 hover:bg-amber-950/80 text-amber-300 border border-amber-400/50 px-1 py-0.5 rounded text-[8px] font-bold flex items-center justify-center cursor-pointer shadow-xs backdrop-blur-xs"
                        title="Set this Box 1 image as permanent default"
                      />
                    )}
                    <CustomizableButton
                      buttonId="front_page_box_fullscreen_btn"
                      defaultLabel="Panel Edit"
                      forceZeroText={true}
                      defaultIcon={<Maximize2 className="w-2.5 h-2.5 text-emerald-300" />}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsAdvertPanel1FullScreenOpen(true);
                      }}
                      className="bg-slate-950/85 hover:bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center justify-center gap-0.5 shadow-xs cursor-pointer backdrop-blur-xs"
                      title={`Launch Panel Edit Studio for Panel ${boxId}`}
                    />
                  </div>
                </div>

                {/* Bottom Compact Action Pill Bar (Unobtrusive & lets image stay visible) */}
                <div className="flex items-center justify-center gap-0.5 bg-slate-950/90 backdrop-blur-md px-1 py-0.5 rounded-lg border border-slate-700/60 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-auto mx-auto max-w-full overflow-x-auto scrollbar-none">
                  <CustomizableButton
                    as="label"
                    buttonId="front_page_box_upload"
                    defaultLabel="Upload Image"
                    forceZeroText={true}
                    defaultIcon={<Upload className="w-2.5 h-2.5 text-[#10b981]" />}
                    className="p-1 rounded hover:bg-slate-800 text-[#10b981] transition-colors flex items-center justify-center cursor-pointer"
                    title="Upload Image"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleBoxImageUpload(boxId, e)}
                      className="hidden"
                    />
                  </CustomizableButton>

                  <CustomizableButton
                    buttonId="front_page_box_from_storyboard"
                    defaultLabel="From Storyboard"
                    forceZeroText={true}
                    defaultIcon={<Sparkles className="w-2.5 h-2.5 text-indigo-300" />}
                    onClick={() => setStoryboardPickerBoxId(boxId)}
                    className="p-1 rounded hover:bg-slate-800 text-indigo-300 transition-colors flex items-center justify-center cursor-pointer"
                    title="From Storyboard"
                  />

                  <CustomizableButton
                    buttonId="front_page_box_send_carver"
                    defaultLabel="To Carver"
                    forceZeroText={true}
                    defaultIcon={<Scissors className="w-2.5 h-2.5 text-cyan-300" />}
                    onClick={() => handleSendBoxImageToCarver(image)}
                    className="p-1 rounded hover:bg-slate-800 text-cyan-300 transition-colors flex items-center justify-center cursor-pointer"
                    title="Send this image to the Carver/Crop engine"
                  />

                  <CustomizableButton
                    buttonId="front_page_box_tilelink"
                    defaultLabel={boxLinkConfigs[boxId]?.url ? "Link Active" : "Link & Hover"}
                    forceZeroText={true}
                    defaultIcon={<Link2 className="w-2.5 h-2.5 text-cyan-300" />}
                    onClick={() => setTileLinkModalBoxId(boxId)}
                    className={cn(
                      "p-1 rounded transition-colors flex items-center justify-center cursor-pointer",
                      boxLinkConfigs[boxId]?.url ? "text-cyan-400 bg-cyan-950/60" : "text-slate-400 hover:bg-slate-800"
                    )}
                    title={`Configure Redirect Link & Hover Animations for Box ${boxId}`}
                  />

                  <CustomizableButton
                    buttonId="front_page_box_rotate_series"
                    defaultLabel={boxRotationActive[boxId] ? "Rotating" : "Rotate Series"}
                    forceZeroText={true}
                    defaultIcon={<RotateCw className={cn("w-2.5 h-2.5 text-purple-300", boxRotationActive[boxId] && "animate-spin")} />}
                    onClick={() => setRotationModalBoxId(boxId)}
                    className={cn(
                      "p-1 rounded transition-colors flex items-center justify-center cursor-pointer",
                      boxRotationActive[boxId] ? "text-purple-300 bg-purple-950/60" : "text-slate-400 hover:bg-slate-800"
                    )}
                    title={`Configure image series rotation for Box ${boxId}`}
                  />

                  {isSpecialBox && (
                    <CustomizableButton
                      buttonId="front_page_box_custom_spread"
                      defaultLabel="Custom Spread"
                      forceZeroText={true}
                      defaultIcon={<LayoutGrid className="w-2.5 h-2.5 text-cyan-300" />}
                      onClick={() => {
                        setCustomSpreadImageUrl(originalSpreadImage);
                        setCustomSpreadModalOpen(true);
                      }}
                      className="p-1 rounded hover:bg-slate-800 text-cyan-300 transition-colors flex items-center justify-center cursor-pointer"
                      title="Custom Spread to selected boxes"
                    />
                  )}

                  <CustomizableButton
                    buttonId="front_page_box_swap_panel"
                    defaultLabel={swapSelectedBoxId === boxId ? "Cancel Swap" : "Swap Panel"}
                    forceZeroText={true}
                    defaultIcon={<ArrowLeftRight className="w-2.5 h-2.5" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPanelForSwap(boxId);
                    }}
                    className={cn(
                      "p-1 rounded transition-colors flex items-center justify-center cursor-pointer",
                      swapSelectedBoxId === boxId
                        ? "bg-amber-500 text-slate-950"
                        : "text-amber-300 hover:bg-slate-800"
                    )}
                    title={`Select Panel ${boxId} to swap content with another panel`}
                  />

                  <CustomizableButton
                    buttonId="front_page_box_clear"
                    defaultLabel="Clear Image"
                    forceZeroText={true}
                    defaultIcon={<Trash2 className="w-2 h-2 text-rose-400" />}
                    onClick={() => setBoxImages((prev) => ({ ...prev, [boxId]: "" }))}
                    className="p-1 rounded hover:bg-rose-950/60 text-rose-400 transition-colors flex items-center justify-center cursor-pointer"
                    title="Clear Image"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full h-full rounded-xl bg-[#030712]/50 border-0 transition-all flex items-center justify-center group/blank overflow-hidden">
            {/* Always blank tile on front page */}
            <div className="w-full h-full" />

            {/* Subtle, minimal hover actions that never clutter the default blank appearance */}
            {!disableBoxActions && (
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/blank:opacity-100 transition-opacity flex flex-col justify-between p-1.5 z-20">
                <div className="flex items-center justify-between w-full pointer-events-auto">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/80 text-slate-400 border border-slate-800">
                    #{boxId}{uiText("app.span.blank", " Blank")}
                  </span>
                  <CustomizableButton
                    buttonId="front_page_box_fullscreen_btn"
                    defaultLabel="Panel Edit"
                    forceZeroText={true}
                    defaultIcon={<Maximize2 className="w-2.5 h-2.5 text-emerald-300" />}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsAdvertPanel1FullScreenOpen(true);
                    }}
                    className="bg-slate-950/85 hover:bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center justify-center gap-0.5 shadow-xs cursor-pointer backdrop-blur-xs"
                    title={`Launch Panel Edit Studio for Panel ${boxId}`}
                  />
                </div>
                <div className="flex items-center justify-center gap-1 pointer-events-auto">
                  <CustomizableButton
                    as="label"
                    buttonId="front_page_box_upload"
                    defaultLabel="Upload"
                    forceZeroText={false}
                    defaultIcon={<Upload className="w-2.5 h-2.5 text-emerald-400" />}
                    className="px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-[9px] font-bold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer shadow-lg backdrop-blur-xs"
                    title={`Upload an image into blank Panel #${boxId}`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleBoxImageUpload(boxId, e)}
                      className="hidden"
                    />
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="front_page_box_from_storyboard"
                    defaultLabel="Pool"
                    forceZeroText={false}
                    defaultIcon={<Sparkles className="w-2.5 h-2.5 text-indigo-400" />}
                    onClick={() => setStoryboardPickerBoxId(boxId)}
                    className="px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-[9px] font-bold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer shadow-lg backdrop-blur-xs"
                    title="Fill from Storyboard"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </ElementType>
    );
  };

  // Bulk Rename Studio & Player States
  const [isRenameStudioOpen, setIsRenameStudioOpen] = useState<boolean>(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);
  const [customSpreadModalOpen, setCustomSpreadModalOpen] = useState<boolean>(false);
  const [customSpreadImageUrl, setCustomSpreadImageUrl] = useState<string>("");

  // Auto-Slicing & Smart Auto-Crop / Trim States
  const [isAutoSliceModalOpen, setIsAutoSliceModalOpen] = useState<boolean>(false);
  const [isSmartTrimModalOpen, setIsSmartTrimModalOpen] = useState<boolean>(false);
  const [smartTrimActiveId, setSmartTrimActiveId] = useState<string | null>(null);
  const [smartTrimItems, setSmartTrimItems] = useState<TrimTargetItem[]>([]);

  // Grid Mesh Studio and Join Images Modal States
  const [isGridMeshModalOpen, setIsGridMeshModalOpen] = useState<boolean>(false);
  const [isJoinImagesModalOpen, setIsJoinImagesModalOpen] = useState<boolean>(false);
  const [isMouseOverStudioOpen, setIsMouseOverStudioOpen] = useState<boolean>(false);

  // New Creative Studio Tools States
  const [isAniComposerOpen, setIsAniComposerOpen] = useState<boolean>(false);
  const [isTraceStudioOpen, setIsTraceStudioOpen] = useState<boolean>(false);
  const [isParallaxStudioOpen, setIsParallaxStudioOpen] = useState<boolean>(false);
  const [isSmartContourOpen, setIsSmartContourOpen] = useState<boolean>(false);
  const [isShortcutManagerOpen, setIsShortcutManagerOpen] = useState<boolean>(false);

  // Messhi Mesh Grid Studio States
  const [isMesshiModalOpen, setIsMesshiModalOpen] = useState<boolean>(false);
  const [messhiInitialImage, setMesshiInitialImage] = useState<string>("");
  const [messhiActiveFrameIdx, setMesshiActiveFrameIdx] = useState<number>(0);

  // Krums Image Loader Studio States
  const [isKrumsModalOpen, setIsKrumsModalOpen] = useState<boolean>(false);
  const [krumsInitialImage, setKrumsInitialImage] = useState<string>("");

  const handleOpenKrums = useCallback((imageSrcToUse?: string) => {
    const source =
      imageSrcToUse ||
      croppedImageSrc ||
      imageSrc ||
      originalImageSrc ||
      storyboardSlices[0]?.url ||
      "";
    setKrumsInitialImage(source);
    setIsKrumsModalOpen(true);
  }, [imageSrc, originalImageSrc, croppedImageSrc, storyboardSlices]);

  const handleApplyFromKrums = useCallback((
    newSlices: Array<{ name: string; url: string }>,
    destination: "storyboard-slots" | "storyboard-slices" | "replace-slots" | "storyboard-first"
  ) => {
    if (newSlices.length === 0) return;

    if (destination === "storyboard-first") {
      // 1. Prepend to storyboardSlices FIRST (at index 0)
      setStoryboardSlices((prev) => [...newSlices, ...prev]);

      // 2. Populate storyboardSlots FIRST (slot 0 or prepend so it's placed first)
      setStoryboardSlots((slots) => {
        const nextSlots = [...slots];
        let sliceIdx = 0;
        for (let s = 0; s < nextSlots.length && sliceIdx < newSlices.length; s++) {
          if (!nextSlots[s].url) {
            nextSlots[s] = {
              url: newSlices[sliceIdx].url,
              name: newSlices[sliceIdx].name,
              story: nextSlots[s].story || "Live canvas appearance snapshot",
            };
            sliceIdx++;
          }
        }
        while (sliceIdx < newSlices.length) {
          nextSlots.unshift({
            url: newSlices[sliceIdx].url,
            name: newSlices[sliceIdx].name,
            story: "Live canvas appearance snapshot",
          });
          sliceIdx++;
        }
        return nextSlots;
      });
      setMode("storyboard");
      setCropNotice(`✓ Copied snapshot reflecting exact live canvas appearance to Storyboard first!`);
    } else if (destination === "replace-slots") {
      const nextSlots = newSlices.map((s) => ({
        url: s.url,
        name: s.name,
        story: "",
      }));
      setStoryboardSlots(nextSlots);
      setStoryboardSlices((prev) => [...prev, ...newSlices]);
      setMode("storyboard");
      setCropNotice(`\u2713 Loaded ${newSlices.length} Krums images into Storyboard Slots!`);
    } else if (destination === "storyboard-slots") {
      setStoryboardSlots((slots) => {
        const nextSlots = [...slots];
        let sliceIdx = 0;
        for (let s = 0; s < nextSlots.length && sliceIdx < newSlices.length; s++) {
          if (!nextSlots[s].url) {
            nextSlots[s] = {
              url: newSlices[sliceIdx].url,
              name: newSlices[sliceIdx].name,
              story: nextSlots[s].story || "",
            };
            sliceIdx++;
          }
        }
        while (sliceIdx < newSlices.length) {
          nextSlots.push({
            url: newSlices[sliceIdx].url,
            name: newSlices[sliceIdx].name,
            story: "",
          });
          sliceIdx++;
        }
        return nextSlots;
      });
      setStoryboardSlices((prev) => [...prev, ...newSlices]);
      setMode("storyboard");
      setCropNotice(`\u2713 Slotted ${newSlices.length} Krums images into Storyboard Slots!`);
    } else {
      setStoryboardSlices((prev) => [...prev, ...newSlices]);
      setMode("storyboard");
      setCropNotice(`\u2713 Added ${newSlices.length} Krums images to Storyboard Assets!`);
    }
    setTimeout(() => setCropNotice(null), 3500);
  }, []);

  // Open Messhi Studio with current or specified image
  const handleOpenMesshi = useCallback((imageSrcToUse?: string, frameIndex?: number) => {
    const source = imageSrcToUse || imageSrc || originalImageSrc || croppedImageSrc || (storyboardSlices[0]?.url) || "";
    if (!source) {
      alert("Please load an image first to use Messhi Mesh Grid Studio.");
      return;
    }
    setMesshiInitialImage(source);
    if (frameIndex !== undefined) {
      setMesshiActiveFrameIdx(frameIndex);
    }
    setIsMesshiModalOpen(true);
  }, [imageSrc, originalImageSrc, croppedImageSrc, storyboardSlices]);

  // Handle slices received from Messhi Studio
  const handleSliceFromMesshi = useCallback((
    newSlices: Array<{ name: string; url: string }>,
    destination: "storyboard-slices" | "storyboard-slots" | "multi-crops"
  ) => {
    if (newSlices.length === 0) return;

    if (destination === "storyboard-slices") {
      setStoryboardSlices((prev) => [...prev, ...newSlices]);
      setMode("storyboard");
      setCropNotice(`\u2713 Added ${newSlices.length} Messhi slices to Storyboard Assets!`);
    } else if (destination === "storyboard-slots") {
      setStoryboardSlots((slots) => {
        const nextSlots = [...slots];
        let sliceIdx = 0;
        for (let s = 0; s < nextSlots.length && sliceIdx < newSlices.length; s++) {
          if (!nextSlots[s].url) {
            nextSlots[s] = {
              url: newSlices[sliceIdx].url,
              name: newSlices[sliceIdx].name,
              story: nextSlots[s].story || "",
            };
            sliceIdx++;
          }
        }
        while (sliceIdx < newSlices.length) {
          nextSlots.push({
            url: newSlices[sliceIdx].url,
            name: newSlices[sliceIdx].name,
            story: "",
          });
          sliceIdx++;
        }
        return nextSlots;
      });
      setStoryboardSlices((prev) => [...prev, ...newSlices]);
      setMode("storyboard");
      setCropNotice(`\u2713 Slotted ${newSlices.length} Messhi slices into Storyboard Slots!`);
    } else if (destination === "multi-crops") {
      setStoryboardSlices((prev) => [...prev, ...newSlices]);
      setMode("crop");
      setCropNotice(`\u2713 ${newSlices.length} Messhi slices saved to pool!`);
    }
    setTimeout(() => setCropNotice(null), 3500);
  }, []);

  // Open Auto-Slice with check for image
  const handleOpenAutoSlice = useCallback(() => {
    const sourceImage = croppedImageSrc || imageSrc || originalImageSrc;
    if (!sourceImage) {
      alert("Please load an image first to use Auto-Slicing.");
      return;
    }
    setIsAutoSliceModalOpen(true);
  }, [croppedImageSrc, imageSrc, originalImageSrc]);

  // Apply Auto-Detected boxes to Multi-Crops
  const handleApplyAutoSliceToMultiCrops = useCallback((detectedBoxes: DetectedSpriteBox[]) => {
    if (detectedBoxes.length === 0) return;
    const newMultiCrops = detectedBoxes.map((box, idx) => ({
      id: `auto_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 6)}`,
      crop: {
        unit: "%" as const,
        x: box.percentX,
        y: box.percentY,
        width: box.percentWidth,
        height: box.percentHeight,
      },
      isCircular: false,
    }));

    setMultiCrops((prev) => [...prev, ...newMultiCrops]);
    setMode("crop");
    setIsAutoSliceModalOpen(false);
    setCropNotice(`\u2713 Added ${newMultiCrops.length} auto-detected sprite boxes to Multi-Crops!`);
    setTimeout(() => setCropNotice(null), 3500);
  }, []);

  // Slice auto-detected boxes directly into storyboard
  const handleSliceAutoDetectedToStoryboard = useCallback(async (
    detectedBoxes: DetectedSpriteBox[],
    destination: "storyboard-slices" | "storyboard-slots"
  ) => {
    const sourceImage = croppedImageSrc || imageSrc || originalImageSrc;
    if (!sourceImage || detectedBoxes.length === 0) return;

    try {
      const newSlices: Array<{ name: string; url: string }> = [];

      for (let i = 0; i < detectedBoxes.length; i++) {
        const box = detectedBoxes[i];
        const cropArea: Crop = {
          unit: "%",
          x: box.percentX,
          y: box.percentY,
          width: box.percentWidth,
          height: box.percentHeight,
        };

        const croppedUrl = await getCroppedImg(
          sourceImage,
          cropArea,
          format,
          imgRef.current,
          false
        );

        if (croppedUrl) {
          const frameNum = storyboardSlices.length + i + 1;
          const name = `${slicePrefix || "Sprite"} ${frameNum}`;
          newSlices.push({ name, url: croppedUrl });
        }
      }

      if (newSlices.length > 0) {
        setStoryboardSlices((prev) => [...prev, ...newSlices]);

        if (destination === "storyboard-slots") {
          setStoryboardSlots((slots) => {
            const nextSlots = [...slots];
            let sliceIdx = 0;
            for (let s = 0; s < nextSlots.length && sliceIdx < newSlices.length; s++) {
              if (!nextSlots[s].url) {
                nextSlots[s] = {
                  url: newSlices[sliceIdx].url,
                  name: newSlices[sliceIdx].name,
                  story: nextSlots[s].story || "",
                };
                sliceIdx++;
              }
            }
            while (sliceIdx < newSlices.length) {
              nextSlots.push({
                url: newSlices[sliceIdx].url,
                name: newSlices[sliceIdx].name,
                story: "",
              });
              sliceIdx++;
            }
            return nextSlots;
          });
        }

        setMode("storyboard");
        setIsAutoSliceModalOpen(false);
        setCropNotice(`\u2713 Auto-sliced ${newSlices.length} sprites to Storyboard!`);
        setTimeout(() => setCropNotice(null), 3500);
      }
    } catch (err) {
      console.error("Auto-slice to storyboard failed:", err);
      alert(`Failed to slice sprites: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [croppedImageSrc, imageSrc, originalImageSrc, format, storyboardSlices.length, slicePrefix]);

  // Convert auto-detected boxes into Freestyle Mesh squares
  const handleAutoSliceConvertToFreestyle = useCallback((detectedBoxes: DetectedSpriteBox[]) => {
    if (detectedBoxes.length === 0) return;
    const newSquares: FreestyleSquare[] = detectedBoxes.map((box, idx) => ({
      id: `fs_auto_${idx}_${Math.random().toString(36).substr(2, 6)}`,
      x: box.percentX,
      y: box.percentY,
      width: box.percentWidth,
      height: box.percentHeight,
      label: `Sprite ${idx + 1}`,
    }));

    setFreestyleSquares(newSquares);
    setSelectedFreestyleSquareId(newSquares[0]?.id || null);
    setMeshMode("freestyle");
    setIsMeshToolActive(true);
    setMode("crop");
    setIsAutoSliceModalOpen(false);
    setCropNotice(`\u2713 Converted ${newSquares.length} auto-detected sprites into Freestyle Mesh!`);
    setTimeout(() => setCropNotice(null), 3500);
  }, []);

  // Open Smart Trim modal with contextually loaded items
  const handleOpenSmartTrim = useCallback(async (targetContext: "storyboard" | "canvas" | "selected" | "grid" = "storyboard", activeUrl?: string) => {
    let itemsToTrim: TrimTargetItem[] = [];

    if (targetContext === "grid") {
      const activeImg = croppedImageSrc || imageSrc || originalImageSrc;
      if (!activeImg) {
        alert("Please load an image first to Smart Trim.");
        return;
      }
      setIsProcessing(true);
      try {
        const rawSlices = await sliceImage(activeImg, rowCuts, colCuts, "image/png", {
          origin: numberingOrigin,
          flow: numberingFlow,
          namingStyle,
          lineThickness: sliceLineThickness,
          lineThicknessX: sliceLineThicknessX,
          lineThicknessY: sliceLineThicknessY,
          outerMargin,
          cellPadding: sliceCellPadding,
        });

        if (rawSlices.length === 0) {
          alert("No grid slices generated. Please check your rows and columns.");
          setIsProcessing(false);
          return;
        }

        itemsToTrim = rawSlices.map((s, idx) => ({
          id: `grid_${idx}`,
          name: slicePrefix ? `${slicePrefix}-${s.name}` : s.name,
          url: s.url,
          isSelected: selectedSplitIndices.size > 0 ? selectedSplitIndices.has(idx + 1) : true,
        }));

        const firstSelectedIdx = rawSlices.findIndex((_, idx) => selectedSplitIndices.has(idx + 1));
        setSmartTrimActiveId(firstSelectedIdx !== -1 ? `grid_${firstSelectedIdx}` : itemsToTrim[0]?.id || null);
      } catch (err) {
        console.error("Error slicing grid for Smart Trim:", err);
        alert("Failed to slice grid for Smart Trim.");
        setIsProcessing(false);
        return;
      } finally {
        setIsProcessing(false);
      }
    } else if (targetContext === "canvas") {
      const activeImg = croppedImageSrc || imageSrc || originalImageSrc;
      if (!activeImg) {
        alert("Please load an image first to Smart Trim.");
        return;
      }
      itemsToTrim = [
        {
          id: "active_canvas",
          name: "Active Canvas",
          url: activeImg,
          isSelected: true,
        },
      ];
      setSmartTrimActiveId("active_canvas");
    } else if (targetContext === "selected" && selectedSliceUrls.size > 0) {
      itemsToTrim = storyboardSlices.map((s, idx) => ({
        id: `slice_${idx}`,
        name: s.name,
        url: s.url,
        isSelected: selectedSliceUrls.has(s.url),
      }));
      const firstSelectedIdx = storyboardSlices.findIndex((s) => selectedSliceUrls.has(s.url));
      setSmartTrimActiveId(firstSelectedIdx !== -1 ? `slice_${firstSelectedIdx}` : null);
    } else if (storyboardSlices.length > 0) {
      itemsToTrim = storyboardSlices.map((s, idx) => ({
        id: `slice_${idx}`,
        name: s.name,
        url: s.url,
        isSelected: selectedSliceUrls.size > 0 ? selectedSliceUrls.has(s.url) : true,
      }));
      if (activeUrl) {
        const foundIdx = storyboardSlices.findIndex((s) => s.url === activeUrl);
        setSmartTrimActiveId(foundIdx !== -1 ? `slice_${foundIdx}` : null);
      } else {
        setSmartTrimActiveId(itemsToTrim[0]?.id || null);
      }
    } else {
      const activeImg = croppedImageSrc || imageSrc || originalImageSrc;
      if (activeImg) {
        itemsToTrim = [
          {
            id: "active_canvas",
            name: "Active Canvas",
            url: activeImg,
            isSelected: true,
          },
        ];
        setSmartTrimActiveId("active_canvas");
      } else {
        alert("No images or storyboard slices available to trim. Please load an image or add slices to the Storyboard.");
        return;
      }
    }

    setSmartTrimItems(itemsToTrim);
    setIsSmartTrimModalOpen(true);
  }, [
    croppedImageSrc,
    imageSrc,
    originalImageSrc,
    storyboardSlices,
    selectedSliceUrls,
    rowCuts,
    colCuts,
    numberingOrigin,
    numberingFlow,
    namingStyle,
    sliceLineThickness,
    sliceLineThicknessX,
    sliceLineThicknessY,
    outerMargin,
    selectedSplitIndices,
    slicePrefix,
  ]);

  // Apply trimmed items back to state
  const handleApplyTrimmedItems = useCallback((trimmedResults: Array<{ id: string; url: string; result: TrimResult }>) => {
    if (trimmedResults.length === 0) return;

    // 1. Check if active canvas was trimmed
    const activeCanvasResult = trimmedResults.find((r) => r.id === "active_canvas");
    if (activeCanvasResult) {
      setImageSrc(activeCanvasResult.url);
      setCroppedImageSrc(activeCanvasResult.url);
      setOriginalImageSrc(activeCanvasResult.url);
      setCrop(undefined);
      setCompletedPercentCrop(null);
      setCompletedPixelCrop(null);
      setCarveImageSize({
        width: activeCanvasResult.result.trimmedWidth,
        height: activeCanvasResult.result.trimmedHeight,
      });
    }

    // 2. Check if grid slices were trimmed
    const gridResults = trimmedResults.filter((r) => r.id.startsWith("grid_"));
    if (gridResults.length > 0) {
      const newStoryboardSlices = gridResults.map((r) => {
        const orig = smartTrimItems.find((item) => item.id === r.id);
        return {
          name: orig?.name || `${r.id}-trimmed.png`,
          url: r.url,
        };
      });
      setStoryboardSlices((prev) => [...prev, ...newStoryboardSlices]);
    }

    // 3. Update storyboard slices
    setStoryboardSlices((prev) => {
      return prev.map((slice, idx) => {
        const match = trimmedResults.find((r) => r.id === `slice_${idx}`);
        if (match) {
          return {
            ...slice,
            url: match.url,
          };
        }
        return slice;
      });
    });

    // 4. Update storyboard slots if they hold corresponding URLs
    setStoryboardSlots((prevSlots) => {
      return prevSlots.map((slot) => {
        if (!slot.url) return slot;
        const sliceIdx = storyboardSlices.findIndex((s) => s.url === slot.url);
        if (sliceIdx !== -1) {
          const match = trimmedResults.find((r) => r.id === `slice_${sliceIdx}`);
          if (match) {
            return {
              ...slot,
              url: match.url,
            };
          }
        }
        return slot;
      });
    });

    setCropNotice(`\u2713 Smart trimmed ${trimmedResults.length} asset(s) with pivot alignment!`);
    setTimeout(() => setCropNotice(null), 3000);
    setIsSmartTrimModalOpen(false);
  }, [storyboardSlices, smartTrimItems]);

  // Direct streamlined Smart Trim Asset Export from Grid Cfg
  const handleSmartTrimGridExport = useCallback(async (onlySelected: boolean = false) => {
    const sourceImage = croppedImageSrc || imageSrc || originalImageSrc;
    if (!sourceImage) {
      alert("Please load an image first to Smart Trim.");
      return;
    }
    if (onlySelected && selectedSplitIndices.size === 0) {
      alert("Please select at least one slice in Grid Cfg to export.");
      return;
    }
    setIsProcessing(true);
    setCropNotice("Smart Trimming grid segments by alpha channel...");
    try {
      const rawSlices = await sliceImage(sourceImage, rowCuts, colCuts, "image/png", {
        origin: numberingOrigin,
        flow: numberingFlow,
        namingStyle,
        lineThickness: sliceLineThickness,
        lineThicknessX: sliceLineThicknessX,
        lineThicknessY: sliceLineThicknessY,
        outerMargin,
        cellPadding: sliceCellPadding,
      });

      if (rawSlices.length === 0) {
        alert("No grid slices generated. Please adjust rows and columns.");
        setIsProcessing(false);
        setCropNotice(null);
        return;
      }

      let slicesToProcess = rawSlices.map((slice, idx) => ({
        ...slice,
        idx,
      }));

      if (onlySelected && selectedSplitIndices.size > 0) {
        slicesToProcess = slicesToProcess.filter((s) => selectedSplitIndices.has(s.idx + 1));
      }

      const trimmedSlices: Array<{ name: string; url: string }> = [];

      for (const slice of slicesToProcess) {
        const trimRes = await trimAlphaPadding(slice.url, {
          alphaThreshold: 10,
          backgroundMode: "auto",
          anchor: "tight",
          padding: 0,
          format: "image/png",
          preserveOriginalSize: false,
        });

        trimmedSlices.push({
          name: slice.name.replace(/\.[^/.]+$/, "") + ".png",
          url: trimRes.url,
        });
      }

      if (trimmedSlices.length === 1) {
        const single = trimmedSlices[0];
        const blob = safeDataUrlToBlob(single.url, "image/png");
        const filename = getFormattedFilename(single.name, 0, "image/png", slicePrefix);
        downloadBlob(blob, filename);
        setCropNotice(`\u2713 Smart trimmed 1 slice and exported asset!`);
      } else {
        const zip = new JSZip();
        const usedNames = new Set<string>();

        trimmedSlices.forEach((sliceItem, i) => {
          const base64Data = dataUrlToBase64(sliceItem.url);
          let filename = getFormattedFilename(
            sliceItem.name,
            i,
            "image/png",
            slicePrefix
          );
          let counter = 1;
          while (usedNames.has(filename)) {
            const dotIdx = filename.lastIndexOf(".");
            const base = dotIdx > 0 ? filename.slice(0, dotIdx) : filename;
            const extStr = dotIdx > 0 ? filename.slice(dotIdx) : ".png";
            filename = `${base}_${counter}${extStr}`;
            counter++;
          }
          usedNames.add(filename);
          zip.file(filename, base64Data, { base64: true });
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipName = slicePrefix ? `${slicePrefix}-smart-trimmed.zip` : "smart-trimmed-grid-slices.zip";
        downloadBlob(zipBlob, zipName);
        setCropNotice(`\u2713 Smart trimmed ${trimmedSlices.length} grid slice(s) (alpha padding removed) & exported ZIP!`);
      }

      setTimeout(() => setCropNotice(null), 3500);
    } catch (err) {
      console.error("Smart Trim Grid Export error:", err);
      alert("An error occurred while smart trimming grid slices.");
    } finally {
      setIsProcessing(false);
    }
  }, [
    croppedImageSrc,
    imageSrc,
    originalImageSrc,
    rowCuts,
    colCuts,
    numberingOrigin,
    numberingFlow,
    namingStyle,
    sliceLineThickness,
    sliceLineThicknessX,
    sliceLineThicknessY,
    outerMargin,
    selectedSplitIndices,
    slicePrefix,
  ]);

  // ZIP Download Naming Modal State
  const [zipModalConfig, setZipModalConfig] = useState<{
    isOpen: boolean;
    defaultName: string;
    suggestions: string[];
    itemCount: number;
    title: string;
    onConfirm: (zipName: string, browseFolder?: boolean) => void;
  }>({
    isOpen: false,
    defaultName: "download.zip",
    suggestions: [],
    itemCount: 0,
    title: "Name ZIP Archive",
    onConfirm: () => {},
  });

  // Helper to open Rename Studio, auto-populating slices from current carve layout if empty
  const handleOpenRenameStudio = useCallback(async () => {
    if (storyboardSlices.length === 0 && croppedImageSrc) {
      try {
        const slices = await sliceImage(croppedImageSrc, rowCuts, colCuts, format, {
          origin: numberingOrigin,
          flow: numberingFlow,
          namingStyle,
          lineThickness: sliceLineThickness,
          lineThicknessX: sliceLineThicknessX,
          lineThicknessY: sliceLineThicknessY,
          outerMargin,
          cellPadding: sliceCellPadding,
        });
        if (slices.length > 0) {
          const mappedSlices = slices.map((slice) => ({
            ...slice,
            name: slicePrefix ? `${slicePrefix}-${slice.name}` : slice.name,
          }));
          setStoryboardSlices(mappedSlices);
        }
      } catch (err) {
        console.error("Failed to initialize slices for Rename Studio:", err);
      }
    }
    setIsRenameStudioOpen(true);
  }, [
    storyboardSlices.length,
    croppedImageSrc,
    rowCuts,
    colCuts,
    format,
    numberingOrigin,
    numberingFlow,
    namingStyle,
    sliceLineThickness,
    outerMargin,
    sliceCellPadding,
    slicePrefix,
  ]);

  // Storyboard Shift Multi-Select Handlers
  const handleToggleSelectStoryboardSlot = useCallback(
    (idx: number, e?: React.MouseEvent) => {
      const isShift = e ? e.shiftKey || isShiftPressed : isShiftPressed;

      setSelectedStoryboardSlotIndices((prev) => {
        const next = new Set(prev);
        if (isShift && lastSelectedStoryboardSlotIndex !== null) {
          const min = Math.min(lastSelectedStoryboardSlotIndex, idx);
          const max = Math.max(lastSelectedStoryboardSlotIndex, idx);
          for (let i = min; i <= max; i++) {
            next.add(i);
          }
        } else {
          if (next.has(idx)) {
            next.delete(idx);
          } else {
            next.add(idx);
          }
        }
        return next;
      });
      setLastSelectedStoryboardSlotIndex(idx);
    },
    [isShiftPressed, lastSelectedStoryboardSlotIndex]
  );

  const handleSelectAllStoryboardSlots = useCallback(() => {
    const filledIndices = storyboardSlots
      .map((slot, i) => (slot.url ? i : -1))
      .filter((i) => i !== -1);
    const targetIndices = filledIndices.length > 0 ? filledIndices : storyboardSlots.map((_, i) => i);

    setSelectedStoryboardSlotIndices((prev) => {
      if (prev.size === targetIndices.length) {
        return new Set();
      }
      return new Set(targetIndices);
    });
  }, [storyboardSlots]);

  const handleClearStoryboardSlotSelection = useCallback(() => {
    setSelectedStoryboardSlotIndices(new Set());
    setLastSelectedStoryboardSlotIndex(null);
  }, []);

  const handleSendSelectedStoryboardToRenameStudio = useCallback(() => {
    const selectedUrls = new Set<string>();
    const newSlicesToAdd: Array<{ name: string; url: string }> = [];
    const existingSliceUrls = new Set(storyboardSlices.map((s) => s.url));

    selectedStoryboardSlotIndices.forEach((idx) => {
      const slot = storyboardSlots[idx];
      if (slot && slot.url) {
        selectedUrls.add(slot.url);
        if (!existingSliceUrls.has(slot.url)) {
          newSlicesToAdd.push({
            name: slot.name && slot.name.trim() ? slot.name : `Slot ${idx + 1}`,
            url: slot.url,
          });
          existingSliceUrls.add(slot.url);
        }
      }
    });

    if (newSlicesToAdd.length > 0) {
      setStoryboardSlices((prev) => [...prev, ...newSlicesToAdd]);
    }

    if (selectedUrls.size > 0) {
      setSelectedSliceUrls(selectedUrls);
    }
    setIsRenameStudioOpen(true);
  }, [selectedStoryboardSlotIndices, storyboardSlots, storyboardSlices]);
  const [isHeaderStudioMenuOpen, setIsHeaderStudioMenuOpen] = useState<boolean>(false);
  const headerStudioMenuRef = useRef<HTMLDivElement>(null);
  const [isUtilityModalOpen, setIsUtilityModalOpen] = useState<boolean>(false);
  const headerUtilityMenuRef = useRef<HTMLDivElement>(null);
  const panelUtilityMenuRef = useRef<HTMLDivElement>(null);
  const [isAdvModalOpen, setIsAdvModalOpen] = useState<boolean>(false);
  const panelAdvModalRef = useRef<HTMLDivElement>(null);
  const [isCustomLayoutPresetsModalOpen, setIsCustomLayoutPresetsModalOpen] = useState<boolean>(false);
  const headerLoadMenuRef = useRef<HTMLDivElement>(null);
  const headerRotationPresetsMenuRef = useRef<HTMLDivElement>(null);

  const [isRotationAndPresetsMenuOpen, setIsRotationAndPresetsMenuOpen] = useState<boolean>(false);
  const [isLoadImageMenuOpen, setIsLoadImageMenuOpen] = useState<boolean>(false);
  const [rotationModalSize, setRotationModalSize] = useState<"sm" | "md" | "lg" | "xl">(() => {
    try {
      const s = remoteStore.getItem("seqcarver_rotation_panel_size");
      if (s === "sm" || s === "md" || s === "lg" || s === "xl") return s;
    } catch (e) {}
    return "lg";
  });
  const [loadImageModalSize, setLoadImageModalSize] = useState<"sm" | "md" | "lg" | "xl">(() => {
    try {
      const s = remoteStore.getItem("seqcarver_load_image_panel_size");
      if (s === "sm" || s === "md" || s === "lg" || s === "xl") return s;
    } catch (e) {}
    return "lg";
  });
  const [isExportJsonModalOpen, setIsExportJsonModalOpen] = useState<boolean>(false);
  const [imageUrlInput, setImageUrlInput] = useState<string>("");
  const [loadImageTarget, setLoadImageTarget] = useState<"carver" | "box" | "storyboard" | "spread" | "spread_4x4">("carver");
  const [selectedBoxTarget, setSelectedBoxTarget] = useState<number>(1);

  // Auto-detect 4x4 vs 3x3 layout target when opening Load Image Menu
  useEffect(() => {
    if (isLoadImageMenuOpen) {
      if (frontPageGridMode === "4x4") {
        if (loadImageTarget === "spread") {
          setLoadImageTarget("spread_4x4");
        }
      } else if (frontPageGridMode === "3x3") {
        if (loadImageTarget === "spread_4x4") {
          setLoadImageTarget("spread");
        }
      }
    }
  }, [isLoadImageMenuOpen, frontPageGridMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node | null;
      const targetEl = event.target as HTMLElement | null;
      if (!targetNode || !targetEl) return;

      // For Creative Studio: do NOT close if clicked inside the header button ref,
      // or inside the floating Creative Studio panel (data-creative-studio),
      // or inside a button customization menu (data-custom-button-menu),
      // or if the clicked element was disconnected/unmounted during the interaction
      if (
        headerStudioMenuRef.current &&
        !headerStudioMenuRef.current.contains(targetNode) &&
        !targetEl.closest?.('[data-creative-studio="true"]') &&
        !targetEl.closest?.('[data-custom-button-menu="true"]') &&
        targetNode.isConnected
      ) {
        setIsHeaderStudioMenuOpen(false);
      }
      const clickedUtilityTrigger =
        (headerUtilityMenuRef.current && headerUtilityMenuRef.current.contains(targetNode)) ||
        (panelUtilityMenuRef.current && panelUtilityMenuRef.current.contains(targetNode));
      if (
        !clickedUtilityTrigger &&
        !targetEl.closest?.('[data-utility-modal="true"]') &&
        !targetEl.closest?.('[data-custom-button-menu="true"]') &&
        targetNode.isConnected
      ) {
        setIsUtilityModalOpen(false);
      }
      const clickedAdvTrigger =
        panelAdvModalRef.current && panelAdvModalRef.current.contains(targetNode);
      if (
        !clickedAdvTrigger &&
        !targetEl.closest?.('[data-adv-modal="true"]') &&
        !targetEl.closest?.('[data-custom-button-menu="true"]') &&
        targetNode.isConnected
      ) {
        setIsAdvModalOpen(false);
      }
      if (
        headerLoadMenuRef.current &&
        !headerLoadMenuRef.current.contains(targetNode) &&
        targetNode.isConnected
      ) {
        setIsLoadImageMenuOpen(false);
      }
      if (
        headerRotationPresetsMenuRef.current &&
        !headerRotationPresetsMenuRef.current.contains(targetNode) &&
        targetNode.isConnected
      ) {
        setIsRotationAndPresetsMenuOpen(false);
      }
      if (
        carvedSlicesColorMenuRef.current &&
        !carvedSlicesColorMenuRef.current.contains(targetNode) &&
        (!carvedSlicesColorMenuExpandedRef.current || !carvedSlicesColorMenuExpandedRef.current.contains(targetNode)) &&
        targetNode.isConnected
      ) {
        setIsCarvedSlicesColorMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLoadImageFromUrl = (urlToLoad: string, nameHint?: string) => {
    const trimmed = urlToLoad.trim();
    if (!trimmed) return;

    if (loadImageTarget === "carver") {
      setImageSrc(trimmed);
      setOriginalImageSrc(trimmed);
      setCroppedImageSrc(trimmed);
      setCrop(undefined);
      setCompletedPercentCrop(null);
      if (nameHint) {
        setSlicePrefix(nameHint.replace(/[^a-zA-Z0-9_-]/g, "_"));
      } else {
        setSlicePrefix("web_image");
      }
      setMode("crop");
    } else if (loadImageTarget === "box") {
      setBoxImages((prev) => ({ ...prev, [selectedBoxTarget]: trimmed }));
    } else if (loadImageTarget === "spread") {
      if (frontPageGridMode === "4x4") {
        handleSplitImageToNBoxes(trimmed, 16);
      } else {
        handleSplitImageTo9Boxes(trimmed);
      }
    } else if (loadImageTarget === "spread_4x4") {
      handleSplitImageToNBoxes(trimmed, 16);
      setFrontPageGridMode("4x4");
      try {
        remoteStore.setItem("seqcarver_frontPageGridMode", "4x4");
      } catch {}
    } else if (loadImageTarget === "storyboard") {
      const sliceName = nameHint || `Loaded Image ${storyboardSlices.length + 1}`;
      setStoryboardSlices((prev) => [...prev, { name: sliceName, url: trimmed }]);
      setStoryboardSlots((prevSlots) => {
        const nextSlots = [...prevSlots];
        let slotIdx = nextSlots.findIndex((s) => !s.url);
        if (slotIdx !== -1) {
          nextSlots[slotIdx] = { ...nextSlots[slotIdx], url: trimmed, name: sliceName };
        } else {
          nextSlots.push({ url: trimmed, name: sliceName, story: "" });
        }
        return nextSlots;
      });
      setImageSrc((prev) => prev || trimmed);
      setSlicePrefix((prev) => prev || sliceName.replace(/[^a-zA-Z0-9_-]/g, "_"));
      setMode("storyboard");
    }

    setIsLoadImageMenuOpen(false);
    setImageUrlInput("");
  };

  const handleHeaderFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const dotIndex = file.name.lastIndexOf(".");
      const rawName = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
      const sanitized = rawName.replace(/[^a-zA-Z0-9_-]/g, "_");

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result?.toString() || "";
        if (!result) return;
        if (loadImageTarget === "carver") {
          setCrop(undefined);
          setCompletedPercentCrop(null);
          setSlicePrefix(sanitized);
          setImageSrc(result);
          setCroppedImageSrc("");
          setMode("crop");
        } else if (loadImageTarget === "box") {
          setBoxImages((prev) => ({ ...prev, [selectedBoxTarget]: result }));
        } else if (loadImageTarget === "spread") {
          if (frontPageGridMode === "4x4") {
            handleSplitImageToNBoxes(result, 16);
          } else {
            handleSplitImageTo9Boxes(result);
          }
        } else if (loadImageTarget === "spread_4x4") {
          handleSplitImageToNBoxes(result, 16);
          setFrontPageGridMode("4x4");
          try {
            remoteStore.setItem("seqcarver_frontPageGridMode", "4x4");
          } catch {}
        } else if (loadImageTarget === "storyboard") {
          setStoryboardSlices((prev) => [...prev, { name: sanitized, url: result }]);
          setStoryboardSlots((prevSlots) => {
            const nextSlots = [...prevSlots];
            let slotIdx = nextSlots.findIndex((s) => !s.url);
            if (slotIdx !== -1) {
              nextSlots[slotIdx] = { ...nextSlots[slotIdx], url: result, name: sanitized };
            } else {
              nextSlots.push({ url: result, name: sanitized, story: "" });
            }
            return nextSlots;
          });
          setImageSrc((prev) => prev || result);
          setSlicePrefix((prev) => prev || sanitized);
          setMode("storyboard");
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
    setIsLoadImageMenuOpen(false);
  };

  const [isImgDescModalOpen, setIsImgDescModalOpen] = useState<boolean>(false);
  const [isTxtStudioOpen, setIsTxtStudioOpen] = useState<boolean>(false);
  const [isAppLogModalOpen, setIsAppLogModalOpen] = useState<boolean>(false);
  const [isNeo1ModalOpen, setIsNeo1ModalOpen] = useState<boolean>(false);
  const [neo1InitialImage, setNeo1InitialImage] = useState<string | undefined>(undefined);
  const [neo1NextImageUrl, setNeo1NextImageUrl] = useState<string | undefined>(undefined);
  const [neo1PrevImageUrl, setNeo1PrevImageUrl] = useState<string | undefined>(undefined);
  const [neo1SliceIndex, setNeo1SliceIndex] = useState<number | null>(null);
  const [neo1SliceName, setNeo1SliceName] = useState<string | undefined>(undefined);

  // Bubba1 Studio State
  const [isBubba1ModalOpen, setIsBubba1ModalOpen] = useState<boolean>(false);
  const [bubba1SliceIndex, setBubba1SliceIndex] = useState<number>(0);
  const [bubba1CustomImageUrl, setBubba1CustomImageUrl] = useState<string | null>(null);
  const [bubba1CustomSliceName, setBubba1CustomSliceName] = useState<string | null>(null);
  const [isStoryboardOperationsOpen, setIsStoryboardOperationsOpen] = useState<boolean>(false);

  // Image Sharpener Studio State
  const [isImageSharpenerOpen, setIsImageSharpenerOpen] = useState<boolean>(false);
  const [imageSharpenerUrl, setImageSharpenerUrl] = useState<string | undefined>(undefined);
  const [imageSharpenerName, setImageSharpenerName] = useState<string | undefined>(undefined);
  const [imageSharpenerIndex, setImageSharpenerIndex] = useState<number | null>(null);

  // Resample Studio State
  const [isResampleStudioOpen, setIsResampleStudioOpen] = useState<boolean>(false);
  const [resampleStudioUrl, setResampleStudioUrl] = useState<string | undefined>(undefined);
  const [resampleStudioName, setResampleStudioName] = useState<string | undefined>(undefined);
  const [resampleStudioIndex, setResampleStudioIndex] = useState<number | null>(null);

  // Variations Image Studio State
  const [isVariationsStudioOpen, setIsVariationsStudioOpen] = useState<boolean>(false);
  const [variationsStudioUrl, setVariationsStudioUrl] = useState<string | undefined>(undefined);
  const [variationsStudioName, setVariationsStudioName] = useState<string | undefined>(undefined);
  const [variationsStudioIndex, setVariationsStudioIndex] = useState<number | null>(null);

  // Zoom Image Studio State
  const [isZoomStudioOpen, setIsZoomStudioOpen] = useState<boolean>(false);
  const [zoomStudioUrl, setZoomStudioUrl] = useState<string | undefined>(undefined);
  const [zoomStudioName, setZoomStudioName] = useState<string | undefined>(undefined);
  const [zoomStudioIndex, setZoomStudioIndex] = useState<number | null>(null);

  // Front Page Panel 1 Full Screen Control Panel State
  const [isFullScreenCropControlPanelOpen, setIsFullScreenCropControlPanelOpen] = useState<boolean>(false);

  // Front Page Advert Panels: Panel 1 Full Screen Control Panel State
  const [isAdvertPanel1FullScreenOpen, setIsAdvertPanel1FullScreenOpen] = useState<boolean>(false);

  // Front Page Advert Panels: 4x4 Panel Launcher Modal State
  const [isFourByFourModalOpen, setIsFourByFourModalOpen] = useState<boolean>(false);

  const handleOpenBubba1Studio = (index?: number, customUrl?: string, customName?: string) => {
    setBubba1SliceIndex(index ?? 0);
    setBubba1CustomImageUrl(customUrl || null);
    setBubba1CustomSliceName(customName || null);
    setIsBubba1ModalOpen(true);
  };

  // Batch helpers for Storyboard Operations
  const handleSendSelectedStoryboardToCrop = useCallback((url?: string, index?: number) => {
    if (url) {
      handleResendFrameToCrop(url, index ?? 0, null);
      return;
    }
    const selected = Array.from(selectedStoryboardSlotIndices)
      .sort((a, b) => a - b)
      .map((idx) => ({ slot: storyboardSlots[idx], index: idx }))
      .filter((item) => item.slot && item.slot.url);
    if (selected.length > 0) {
      handleResendFrameToCrop(selected[0].slot.url!, selected[0].index, null);
    }
  }, [selectedStoryboardSlotIndices, storyboardSlots, handleResendFrameToCrop]);

  const handleSendSelectedStoryboardToCarver = useCallback((url?: string, name?: string) => {
    if (url) {
      handleResendFrameToCarve(url, name);
      return;
    }
    const selected = Array.from(selectedStoryboardSlotIndices)
      .sort((a, b) => a - b)
      .map((idx) => storyboardSlots[idx])
      .filter((s) => s && s.url);
    if (selected.length > 0) {
      handleResendFrameToCarve(selected[0].url!, selected[0].name);
    }
  }, [selectedStoryboardSlotIndices, storyboardSlots, handleResendFrameToCarve]);

  const handleSendSelectedStoryboardToScreenplay = useCallback(() => {
    const selected = Array.from(selectedStoryboardSlotIndices)
      .sort((a, b) => a - b)
      .map((idx) => storyboardSlots[idx])
      .filter((s) => s && s.url);

    const targetSlots = selected.length > 0 ? selected : storyboardSlots.filter((s) => s.url);
    if (targetSlots.length === 0) return;

    const newSlides: Slide[] = targetSlots.map((s, idx) => ({
      id: `slide-storyboard-${idx}-${Date.now()}`,
      shotNo: idx + 1,
      imageUrl: s.url!,
      action: s.name || `Shot ${idx + 1}`,
      captions: s.story ? [{ id: `cap-${idx}`, text: s.story, type: "narration" }] : [],
    }));

    setScreenplaySlides(newSlides);
    setActiveScreenplaySlideId(newSlides[0].id);
    setIsScreenplayOpen(true);
  }, [selectedStoryboardSlotIndices, storyboardSlots]);

  // ShapeStudio State
  const [isShapeStudioOpen, setIsShapeStudioOpen] = useState<boolean>(false);
  const [shapeStudioActiveFrameIdx, setShapeStudioActiveFrameIdx] = useState<number>(0);

  const handleOpenShapeStudio = (index?: number) => {
    setShapeStudioActiveFrameIdx(index ?? 0);
    setIsShapeStudioOpen(true);
  };

  const handleOpenScreenplayWriter = () => {
    // Sync current storyboard slices into slides format if needed
    const sources =
      storyboardSlices.length > 0
        ? storyboardSlices
        : croppedImageSrc
        ? [{ name: slicePrefix || "Frame 1", url: croppedImageSrc }]
        : [];

    const existingSlideIds = new Set(screenplaySlides.map((s) => s.id));
    const initialSlides: Slide[] = sources.map((s, idx) => ({
      id: `slide-initial-${idx}-${s.url.substring(s.url.length - 12)}`,
      shotNo: idx + 1,
      imageUrl: s.url,
      action: s.name || `Shot ${idx + 1}`,
      captions: [],
    }));

    if (screenplaySlides.length === 0 && initialSlides.length > 0) {
      setScreenplaySlides(initialSlides);
      setActiveScreenplaySlideId(initialSlides[0].id);
    } else if (screenplaySlides.length > 0 && !activeScreenplaySlideId) {
      setActiveScreenplaySlideId(screenplaySlides[0].id);
    }

    setIsScreenplayOpen(true);
  };

  // =========================================================================
  // Storyboard Default State Management (STORYBOARD_DEFAULT_STATE_KEY)
  // Present State as Default:
  // Captures slots, sliced fragments, layout, cell mode, button state & sorting configuration
  // =========================================================================
  const handleSavePresentStateAsDefault = useCallback(async () => {
    try {
      const defaultState: StoryboardDefaultState = {
        slots: storyboardSlots.map((s) => ({
          url: s.url,
          name: s.name || "",
          story: s.story || "",
          title: s.title || "",
        })),
        slices: storyboardSlices.map((s) => ({
          name: s.name,
          url: s.url,
        })),
        cellMode: storyboardCellMode,
        layout: storyboardLayout,
        slotSize,
        isReverseInsert,
        storyboardDropAction,
        carvedSlicesBgColor,
        carvedSlicesExpandedCols,
        isStoryboardLocked,
        isStoryboardVisible,
        stripBackground,
        stripPanelBackground,
        showSlotHeaders,
        storyboardToolbarOrder: [...storyboardToolbarOrder],
        buttonCustomizations: customConfigs,
        activeSortMode,
        activeGroupMode,
        selectedGroupFilter,
        autoSortOnImport,
        isExportBarCompact,
        lastSavedAt: new Date().toISOString(),
      };

      const success = await saveStoredJson(STORYBOARD_DEFAULT_STATE_KEY, defaultState);
      if (success) {
        setSavedStoryboardDefaultInfo({
          savedAt: defaultState.lastSavedAt!,
          slotsCount: defaultState.slots.length,
          slicesCount: defaultState.slices.length,
          layout: defaultState.layout,
          cellMode: defaultState.cellMode,
        });
        setCropNotice(
          `✓ Present storyboard state (${defaultState.slots.length} slots, ${defaultState.slices.length} sliced fragments, layout: ${defaultState.layout}, cell: ${defaultState.cellMode}) saved as persistent default state!`
        );
      } else {
        setCropNotice("⚠️ Failed to save Storyboard default state.");
      }
      setTimeout(() => setCropNotice(null), 3500);
    } catch (err) {
      console.error("Error saving storyboard default state:", err);
      setCropNotice("⚠️ Error saving storyboard default state.");
      setTimeout(() => setCropNotice(null), 3000);
    }
  }, [
    storyboardSlots,
    storyboardSlices,
    storyboardCellMode,
    storyboardLayout,
    slotSize,
    isReverseInsert,
    storyboardDropAction,
    carvedSlicesBgColor,
    carvedSlicesExpandedCols,
    isStoryboardLocked,
    isStoryboardVisible,
    stripBackground,
    stripPanelBackground,
    showSlotHeaders,
    storyboardToolbarOrder,
    customConfigs,
    activeSortMode,
    activeGroupMode,
    selectedGroupFilter,
    autoSortOnImport,
  ]);

  const handleRestoreDefaultState = useCallback(async () => {
    try {
      const savedDefault = await getStoredJson<StoryboardDefaultState>(STORYBOARD_DEFAULT_STATE_KEY);
      if (!savedDefault) {
        setCropNotice("⚠️ No saved default state found. Click 'Set as Default State' first.");
        setTimeout(() => setCropNotice(null), 3000);
        return;
      }

      if (Array.isArray(savedDefault.slots)) {
        setStoryboardSlots(savedDefault.slots);
      }
      if (Array.isArray(savedDefault.slices)) {
        setStoryboardSlices(savedDefault.slices);
      }
      if (savedDefault.layout) {
        setStoryboardLayout(savedDefault.layout);
      }
      if (savedDefault.cellMode) {
        setStoryboardCellMode(
          savedDefault.cellMode === "image-name-story" ? "full" : (savedDefault.cellMode as any)
        );
      }
      if (savedDefault.slotSize) {
        setSlotSize(savedDefault.slotSize);
      }
      if (typeof savedDefault.isReverseInsert === "boolean") {
        setIsReverseInsert(savedDefault.isReverseInsert);
      }
      if (savedDefault.storyboardDropAction) {
        setStoryboardDropAction(savedDefault.storyboardDropAction as any);
      }
      if (typeof savedDefault.isStoryboardLocked === "boolean") {
        setIsStoryboardLocked(savedDefault.isStoryboardLocked);
      }
      if (typeof savedDefault.isStoryboardVisible === "boolean") {
        setIsStoryboardVisible(savedDefault.isStoryboardVisible);
      }
      if (savedDefault.carvedSlicesBgColor) {
        setCarvedSlicesBgColor(savedDefault.carvedSlicesBgColor);
      }
      if (typeof savedDefault.carvedSlicesExpandedCols === "number") {
        setCarvedSlicesExpandedCols(savedDefault.carvedSlicesExpandedCols);
      }
      if (savedDefault.stripBackground) {
        setStripBackground(savedDefault.stripBackground);
        setStripImageBackground(savedDefault.stripBackground);
      }
      if (savedDefault.stripPanelBackground) {
        setStripPanelBackground(savedDefault.stripPanelBackground);
      }
      if (typeof savedDefault.showSlotHeaders === "boolean") {
        setSlotHeaders(savedDefault.showSlotHeaders);
      }
      if (Array.isArray(savedDefault.storyboardToolbarOrder)) {
        setStoryboardToolbarOrder(savedDefault.storyboardToolbarOrder);
      }
      if (savedDefault.activeSortMode) {
        setActiveSortMode(savedDefault.activeSortMode);
      }
      if (savedDefault.activeGroupMode) {
        setActiveGroupMode(savedDefault.activeGroupMode);
      }
      if (savedDefault.selectedGroupFilter !== undefined) {
        setSelectedGroupFilter(savedDefault.selectedGroupFilter);
      }
      if (typeof savedDefault.autoSortOnImport === "boolean") {
        setAutoSortOnImport(savedDefault.autoSortOnImport);
      }
      if (typeof savedDefault.isExportBarCompact === "boolean") {
        setIsExportBarCompact(savedDefault.isExportBarCompact);
      }
      if (savedDefault.buttonCustomizations && typeof savedDefault.buttonCustomizations === "object") {
        importConfigs(JSON.stringify({ customConfigs: savedDefault.buttonCustomizations }));
      }

      setCropNotice(
        `✓ Storyboard restored to saved default state (${savedDefault.slots?.length || 0} slots, ${savedDefault.slices?.length || 0} sliced fragments, layout: ${savedDefault.layout || "grid9"})!`
      );
      setTimeout(() => setCropNotice(null), 3000);
    } catch (err) {
      console.error("Error restoring storyboard default state:", err);
      setCropNotice("⚠️ Error restoring storyboard default state.");
      setTimeout(() => setCropNotice(null), 3000);
    }
  }, [
    setStoryboardSlots,
    setStoryboardSlices,
    setStoryboardLayout,
    setStoryboardCellMode,
    setSlotSize,
    setIsReverseInsert,
    setStoryboardDropAction,
    setIsStoryboardLocked,
    setIsStoryboardVisible,
    setCarvedSlicesBgColor,
    setCarvedSlicesExpandedCols,
    setStripBackground,
    setStripImageBackground,
    setStripPanelBackground,
    setSlotHeaders,
    setStoryboardToolbarOrder,
    setActiveSortMode,
    setActiveGroupMode,
    setSelectedGroupFilter,
    setAutoSortOnImport,
    importConfigs,
  ]);

  const handleClearSavedDefaultState = useCallback(async () => {
    try {
      await clearStoredJson(STORYBOARD_DEFAULT_STATE_KEY);
      setSavedStoryboardDefaultInfo(null);
      setCropNotice("✓ Cleared saved Storyboard default state.");
      setTimeout(() => setCropNotice(null), 2500);
    } catch (err) {
      console.warn("Failed to clear saved storyboard default state:", err);
    }
  }, []);

  // =========================================================================
  // Define Canvas & Crop Default Setup Management (CROP_DEFAULT_STATE_KEY)
  // Configured to be the persistent default state across all sessions and resets.
  // =========================================================================
  const handleSavePresentCropStateAsDefault = useCallback(() => {
    try {
      const defaultState: CropDefaultSetup = {
        panelsOrder: [...cropPanelsOrder],
        quickToolsOrder: [...cropQuickToolsOrder],
        sbFrameOrder: [...cropSbFrameOrder],
        aspectOrder: [...cropAspectOrder],
        primaryOrder: [...cropPrimaryOrder],
        utilityOrder: [...cropUtilityOrder],
        shapeStudioOrder: [...cropShapeStudioOrder],
        multiCropBatchOrder: [...cropMultiCropBatchOrder],
        aspect: cropAspect,
        isCircularCrop,
        meshSquareSize,
        meshMode,
        meshGridLineColor,
        meshGridLineWidth,
        meshAutoGotoAfterCut,
        meshDestination,
        savedAt: new Date().toISOString(),
      };

      remoteStore.setItem(CROP_DEFAULT_STATE_KEY, JSON.stringify(defaultState));
      // Keep active stored orders aligned with persistent default
      remoteStore.setItem("seqcarver_crop_panels_order", JSON.stringify(cropPanelsOrder));
      remoteStore.setItem("seqcarver_crop_quick_tools_order", JSON.stringify(cropQuickToolsOrder));
      remoteStore.setItem("seqcarver_crop_sb_frame_order", JSON.stringify(cropSbFrameOrder));
      remoteStore.setItem("seqcarver_crop_aspect_order", JSON.stringify(cropAspectOrder));
      remoteStore.setItem("seqcarver_crop_primary_order", JSON.stringify(cropPrimaryOrder));
      remoteStore.setItem("seqcarver_crop_utility_order", JSON.stringify(cropUtilityOrder));
      remoteStore.setItem("seqcarver_crop_ss_order", JSON.stringify(cropShapeStudioOrder));
      remoteStore.setItem("seqcarver_crop_multicrop_batch_order", JSON.stringify(cropMultiCropBatchOrder));

      setCropNotice("✓ Present state saved as persistent default for 'Define Canvas & Crop'");
      setTimeout(() => setCropNotice(null), 3000);
    } catch (err) {
      console.error("Failed to save crop default state:", err);
      setCropNotice("⚠️ Error saving persistent crop default state.");
      setTimeout(() => setCropNotice(null), 3000);
    }
  }, [
    cropPanelsOrder,
    cropQuickToolsOrder,
    cropSbFrameOrder,
    cropAspectOrder,
    cropPrimaryOrder,
    cropUtilityOrder,
    cropShapeStudioOrder,
    cropMultiCropBatchOrder,
    cropAspect,
    isCircularCrop,
    meshSquareSize,
    meshMode,
    meshGridLineColor,
    meshGridLineWidth,
    meshAutoGotoAfterCut,
    meshDestination,
  ]);

  const handleResetCropLayout = useCallback(() => {
    const def = getLoadedCropDefaultSetup();
    setCropPanelsOrder([...def.panelsOrder]);
    setCropQuickToolsOrder([...def.quickToolsOrder]);
    setCropSbFrameOrder([...def.sbFrameOrder]);
    setCropAspectOrder([...def.aspectOrder]);
    setCropPrimaryOrder([...def.primaryOrder]);
    setCropUtilityOrder([...def.utilityOrder]);
    setCropShapeStudioOrder([...def.shapeStudioOrder]);
    setCropMultiCropBatchOrder([...def.multiCropBatchOrder]);
    if (def.aspect === "circle" || def.aspect === "oval" || typeof def.aspect === "number" || def.aspect === undefined) {
      handleSetAspect(def.aspect);
    }
    if (typeof def.isCircularCrop === "boolean") setIsCircularCrop(def.isCircularCrop);
    if (typeof def.meshSquareSize === "number") setMeshSquareSize(def.meshSquareSize);
    if (def.meshMode === "uniform" || def.meshMode === "freestyle") setMeshMode(def.meshMode);
    if (def.meshGridLineColor) setMeshGridLineColor(def.meshGridLineColor);
    if (typeof def.meshGridLineWidth === "number") setMeshGridLineWidth(def.meshGridLineWidth);
    if (typeof def.meshAutoGotoAfterCut === "boolean") setMeshAutoGotoAfterCut(def.meshAutoGotoAfterCut);
    if (def.meshDestination) setMeshDestination(def.meshDestination);

    try {
      remoteStore.setItem("seqcarver_crop_panels_order", JSON.stringify(def.panelsOrder));
      remoteStore.setItem("seqcarver_crop_quick_tools_order", JSON.stringify(def.quickToolsOrder));
      remoteStore.setItem("seqcarver_crop_sb_frame_order", JSON.stringify(def.sbFrameOrder));
      remoteStore.setItem("seqcarver_crop_aspect_order", JSON.stringify(def.aspectOrder));
      remoteStore.setItem("seqcarver_crop_primary_order", JSON.stringify(def.primaryOrder));
      remoteStore.setItem("seqcarver_crop_utility_order", JSON.stringify(def.utilityOrder));
      remoteStore.setItem("seqcarver_crop_ss_order", JSON.stringify(def.shapeStudioOrder));
      remoteStore.setItem("seqcarver_crop_multicrop_batch_order", JSON.stringify(def.multiCropBatchOrder));
    } catch {}

    setCropNotice("✓ 'Define Canvas & Crop' restored to default setup");
    setTimeout(() => setCropNotice(null), 2500);
  }, []);

  // Moved handleUpdateSliceUrl definition higher up to resolve block-scoped hoisting issues

  // Active slice sequence for creative studios (Neo1, Bubba1, etc.)
  const activeStudioSlices = useMemo(() => {
    if (storyboardSlices && storyboardSlices.length > 0) {
      return storyboardSlices;
    }
    const filledSlots = storyboardSlots
      .map((s, idx) => ({ name: s.name || `Strip ${idx + 1}`, url: s.url }))
      .filter((s): s is { name: string; url: string } => Boolean(s.url));
    if (filledSlots.length > 0) {
      return filledSlots;
    }
    if (croppedImageSrc) {
      return [{ name: slicePrefix || "Carved Frame 1", url: croppedImageSrc }];
    }
    return [];
  }, [storyboardSlices, storyboardSlots, croppedImageSrc, slicePrefix]);

  // Open Neo1 Studio with selected slice or default canvas
  const handleOpenNeo1Studio = useCallback(
    (index?: number, customUrl?: string, customName?: string) => {
      if (customUrl) {
        setNeo1SliceIndex(index ?? null);
        setNeo1InitialImage(customUrl);
        setNeo1SliceName(customName || `Frame ${(index ?? 0) + 1}`);
      } else if (index !== undefined && index !== null && activeStudioSlices[index]) {
        setNeo1SliceIndex(index);
        setNeo1InitialImage(activeStudioSlices[index].url);
        setNeo1SliceName(activeStudioSlices[index].name);
      } else if (activeStudioSlices.length > 0) {
        setNeo1SliceIndex(0);
        setNeo1InitialImage(activeStudioSlices[0].url);
        setNeo1SliceName(activeStudioSlices[0].name);
      } else {
        setNeo1SliceIndex(null);
        setNeo1InitialImage(croppedImageSrc || undefined);
        setNeo1SliceName(slicePrefix || "Frame 1");
      }
      setIsNeo1ModalOpen(true);
    },
    [activeStudioSlices, croppedImageSrc, slicePrefix]
  );

  // Save composition from Neo1 Studio back to Asset Organiser / Storyboard
  const handleSaveFromNeo1ToOrganiser = useCallback(
    (dataUrl: string, sliceIdx?: number | null, name?: string, layers?: any[]) => {
      if (sliceIdx !== undefined && sliceIdx !== null) {
        if (storyboardSlices[sliceIdx]) {
          handleUpdateSliceUrl(sliceIdx, dataUrl, name);
        } else if (storyboardSlots[sliceIdx]) {
          setStoryboardSlots((prev) => {
            const next = [...prev];
            next[sliceIdx] = {
              ...next[sliceIdx],
              url: dataUrl,
              name: name || next[sliceIdx].name,
            };
            return next;
          });
        } else {
          setStoryboardSlices((prev) => [
            ...prev,
            { name: name || `Neo1 Slice ${prev.length + 1}`, url: dataUrl },
          ]);
        }
        if (layers) {
          setNeo1LayersMap((prev) => ({
            ...prev,
            [dataUrl]: layers,
          }));
        }
      } else {
        const newSliceName = name || `Neo1 Slice ${storyboardSlices.length + 1}`;
        setStoryboardSlices((prev) => [
          ...prev,
          { name: newSliceName, url: dataUrl },
        ]);
        if (layers) {
          setNeo1LayersMap((prev) => ({
            ...prev,
            [dataUrl]: layers,
          }));
        }
      }
    },
    [storyboardSlices, storyboardSlots, handleUpdateSliceUrl, setNeo1LayersMap]
  );

  // Save composition from Bubba1 Studio back to Asset Organiser / Storyboard
  const handleSaveFromBubba1ToOrganiser = useCallback(
    (dataUrl: string, sliceIdx?: number | null, name?: string, layers?: any[]) => {
      if (sliceIdx !== undefined && sliceIdx !== null) {
        if (storyboardSlices[sliceIdx]) {
          handleUpdateSliceUrl(sliceIdx, dataUrl, name);
        } else if (storyboardSlots[sliceIdx]) {
          setStoryboardSlots((prev) => {
            const next = [...prev];
            next[sliceIdx] = {
              ...next[sliceIdx],
              url: dataUrl,
              name: name || next[sliceIdx].name,
            };
            return next;
          });
        } else {
          setStoryboardSlices((prev) => [
            ...prev,
            { name: name || `Bubba1 Slice ${prev.length + 1}`, url: dataUrl },
          ]);
        }
        if (layers) {
          setBubba1BubblesMap((prev) => ({
            ...prev,
            [dataUrl]: layers,
          }));
        }
      } else {
        const newSliceName = name || `Bubba1 Slice ${storyboardSlices.length + 1}`;
        setStoryboardSlices((prev) => [
          ...prev,
          { name: newSliceName, url: dataUrl },
        ]);
        if (layers) {
          setBubba1BubblesMap((prev) => ({
            ...prev,
            [dataUrl]: layers,
          }));
        }
      }
    },
    [storyboardSlices, storyboardSlots, handleUpdateSliceUrl, setBubba1BubblesMap]
  );

  // Auto-Number: Sequentially re-number Scene
  const handleAutoNumberScenes = useCallback(() => {
    const prefix = slicePrefix.trim() || "Scene";

    // 1. Re-number storyboardSlices sequentially
    setStoryboardSlices((prev) =>
      prev.map((slice, idx) => ({
        ...slice,
        name: `${prefix}_${String(idx + 1).padStart(2, "0")}`,
      }))
    );

    // 2. Re-number storyboardSlots
    setStoryboardSlots((prev) =>
      prev.map((slot, idx) => {
        if (!slot.url) return slot;
        return {
          ...slot,
          name: `${prefix}_${String(idx + 1).padStart(2, "0")}`,
        };
      })
    );

    // 3. Re-number screenplaySlides
    setScreenplaySlides((prev) =>
      prev.map((slide, idx) => ({
        ...slide,
        shotNo: idx + 1,
        action: slide.action.toLowerCase().includes("shot") || slide.action.toLowerCase().includes("scene")
          ? `${prefix} ${idx + 1}`
          : slide.action,
      }))
    );
  }, [slicePrefix]);

 

  // Expand View Modal State
  const [expandedModalOpen, setExpandedModalOpen] = useState(false);
  const [expandedSliceIndex, setExpandedSliceIndex] = useState<number | null>(null);
  const [expandedCustomSlice, setExpandedCustomSlice] = useState<{
    name: string;
    url: string;
  } | null>(null);

  // Bulk Rename & Studio Sync Handler (Supports renaming, reordering & frame deletions)
  const handleApplyBulkRename = (
    renamedSlices: Array<{ url: string; oldName: string; newName: string }>,
    syncSlots: boolean,
    deletedUrls?: Set<string>,
    customItemsOrder?: Array<{ url: string; name: string }>
  ) => {
    const renameMap = new Map<string, string>();
    renamedSlices.forEach((r) => renameMap.set(r.url, r.newName));
    const deletedSet = deletedUrls || new Set<string>();

    // 1. Update storyboardSlices order & names & filter out deleted
    setStoryboardSlices((prev) => {
      const prevMap = new Map<string, { url: string; name: string }>(prev.map((s) => [s.url, s]));
      const nextSlices: Array<{ url: string; name: string }> = [];

      // If custom reordering was performed in rename studio
      if (customItemsOrder && customItemsOrder.length > 0) {
        customItemsOrder.forEach((item) => {
          if (!deletedSet.has(item.url)) {
            nextSlices.push({
              url: item.url,
              name: renameMap.get(item.url) || item.name,
            });
            prevMap.delete(item.url);
          }
        });

        // Append remaining unselected slices
        prevMap.forEach((slice, url) => {
          if (!deletedSet.has(url)) {
            nextSlices.push({
              url: slice.url,
              name: renameMap.get(url) || slice.name,
            });
          }
        });

        return nextSlices;
      }

      // Standard mapping
      return prev
        .filter((slice) => !deletedSet.has(slice.url))
        .map((slice) => {
          if (renameMap.has(slice.url)) {
            return { ...slice, name: renameMap.get(slice.url)! };
          }
          return slice;
        });
    });

    // 2. Update storyboardSlots
    if (syncSlots) {
      setStoryboardSlots((prev) => {
        if (customItemsOrder && customItemsOrder.length > 0) {
          const activeOrderedItems = customItemsOrder
            .filter((item) => !deletedSet.has(item.url))
            .map((item) => ({
              url: item.url,
              name: renameMap.get(item.url) || item.name,
            }));

          const activeUrlSet = new Set(activeOrderedItems.map((i) => i.url));

          // Find slot indices that currently hold URLs belonging to activeUrlSet or deletedSet
          const occupiedIndices: number[] = [];
          prev.forEach((slot, idx) => {
            if (slot.url && (activeUrlSet.has(slot.url) || deletedSet.has(slot.url))) {
              occupiedIndices.push(idx);
            }
          });

          const nextSlots = [...prev];

          // Fill occupied slot positions in the exact new order from Rename Studio
          let activeIdx = 0;
          occupiedIndices.forEach((slotIdx) => {
            if (activeIdx < activeOrderedItems.length) {
              const item = activeOrderedItems[activeIdx];
              nextSlots[slotIdx] = {
                ...nextSlots[slotIdx],
                url: item.url,
                name: item.name,
              };
              activeIdx++;
            } else {
              // Free up slot if item was deleted in studio
              nextSlots[slotIdx] = { url: null, name: "", story: "" };
            }
          });

          // If there are remaining active items not yet placed in occupied slots
          if (activeIdx < activeOrderedItems.length) {
            for (let i = 0; i < nextSlots.length && activeIdx < activeOrderedItems.length; i++) {
              if (!nextSlots[i].url) {
                const item = activeOrderedItems[activeIdx];
                nextSlots[i] = { url: item.url, name: item.name, story: "" };
                activeIdx++;
              }
            }
          }

          return nextSlots.map((slot) => {
            if (slot.url && deletedSet.has(slot.url)) {
              return { ...slot, url: null, name: "" };
            }
            if (slot.url && renameMap.has(slot.url)) {
              return { ...slot, name: renameMap.get(slot.url)! };
            }
            return slot;
          });
        }

        return prev.map((slot) => {
          if (slot.url && deletedSet.has(slot.url)) {
            return { ...slot, url: null, name: "" };
          }
          if (slot.url && renameMap.has(slot.url)) {
            return { ...slot, name: renameMap.get(slot.url)! };
          }
          return slot;
        });
      });
    }
  };

  // Open Image Sharpener Studio
  const handleOpenImageSharpener = useCallback(
    (customUrl?: string, customName?: string, index?: number) => {
      if (customUrl) {
        setImageSharpenerIndex(index ?? null);
        setImageSharpenerUrl(customUrl);
        setImageSharpenerName(customName || `Frame ${(index ?? 0) + 1}`);
      } else if (index !== undefined && index !== null && activeStudioSlices[index]) {
        setImageSharpenerIndex(index);
        setImageSharpenerUrl(activeStudioSlices[index].url);
        setImageSharpenerName(activeStudioSlices[index].name);
      } else if (activeStudioSlices.length > 0) {
        setImageSharpenerIndex(0);
        setImageSharpenerUrl(activeStudioSlices[0].url);
        setImageSharpenerName(activeStudioSlices[0].name);
      } else {
        setImageSharpenerIndex(null);
        setImageSharpenerUrl(croppedImageSrc || imageSrc || originalImageSrc || undefined);
        setImageSharpenerName(slicePrefix || "Canvas Image");
      }
      setIsImageSharpenerOpen(true);
    },
    [activeStudioSlices, croppedImageSrc, imageSrc, originalImageSrc, slicePrefix]
  );

  // Apply enhanced/sharpened image back to App
  const handleApplyEnhancedImage = useCallback(
    (
      enhancedUrl: string,
      targetSliceIndex?: number | null,
      name?: string,
      mode?: "replace" | "new_frame" | "asset_pool" | "canvas"
    ) => {
      if (mode === "canvas") {
        setImageSrc(enhancedUrl);
        setCroppedImageSrc(enhancedUrl);
        setOriginalImageSrc(enhancedUrl);
        return;
      }

      if (mode === "new_frame" || mode === "asset_pool") {
        const frameName = name || `Sharpened Frame ${storyboardSlices.length + 1}`;
        setStoryboardSlices((prev) => [...prev, { name: frameName, url: enhancedUrl }]);
        if (mode === "new_frame") {
          setStoryboardSlots((prev) => {
            const next = [...prev];
            const emptyIdx = next.findIndex((s) => !s.url);
            if (emptyIdx !== -1) {
              next[emptyIdx] = { ...next[emptyIdx], url: enhancedUrl, name: frameName };
            } else {
              next.push({ url: enhancedUrl, name: frameName, story: "" });
            }
            return next;
          });
        }
        return;
      }

      // mode === "replace" or default
      if (targetSliceIndex !== undefined && targetSliceIndex !== null) {
        if (storyboardSlices[targetSliceIndex]) {
          handleUpdateSliceUrl(targetSliceIndex, enhancedUrl, name);
        } else if (storyboardSlots[targetSliceIndex]) {
          setStoryboardSlots((prev) => {
            const next = [...prev];
            next[targetSliceIndex] = {
              ...next[targetSliceIndex],
              url: enhancedUrl,
              name: name || next[targetSliceIndex].name,
            };
            return next;
          });
        } else {
          setStoryboardSlices((prev) => [
            ...prev,
            { name: name || `Sharpened Slice ${prev.length + 1}`, url: enhancedUrl },
          ]);
        }
      } else if (expandedCustomSlice) {
        setExpandedCustomSlice({
          name: name || expandedCustomSlice.name,
          url: enhancedUrl,
        });
      } else if (storyboardSlices.length > 0) {
        handleUpdateSliceUrl(0, enhancedUrl, name);
      } else {
        setImageSrc(enhancedUrl);
        setCroppedImageSrc(enhancedUrl);
        setOriginalImageSrc(enhancedUrl);
      }
    },
    [storyboardSlices, storyboardSlots, handleUpdateSliceUrl, expandedCustomSlice]
  );

  // Open Resample Studio
  const handleOpenResampleStudio = useCallback(
    (customUrl?: string, customName?: string, index?: number) => {
      if (customUrl) {
        setResampleStudioIndex(index ?? null);
        setResampleStudioUrl(customUrl);
        setResampleStudioName(customName || `Frame ${(index ?? 0) + 1}`);
      } else if (index !== undefined && index !== null && activeStudioSlices[index]) {
        setResampleStudioIndex(index);
        setResampleStudioUrl(activeStudioSlices[index].url);
        setResampleStudioName(activeStudioSlices[index].name);
      } else if (activeStudioSlices.length > 0) {
        setResampleStudioIndex(0);
        setResampleStudioUrl(activeStudioSlices[0].url);
        setResampleStudioName(activeStudioSlices[0].name);
      } else {
        setResampleStudioIndex(null);
        setResampleStudioUrl(croppedImageSrc || imageSrc || originalImageSrc || undefined);
        setResampleStudioName(slicePrefix || "Canvas Image");
      }
      setIsResampleStudioOpen(true);
    },
    [activeStudioSlices, croppedImageSrc, imageSrc, originalImageSrc, slicePrefix]
  );

  // Apply resampled image back to App
  const handleApplyResampledImage = useCallback(
    (
      resampledUrl: string,
      targetSliceIndex?: number | null,
      name?: string,
      mode?: "replace" | "new_frame" | "asset_pool" | "canvas"
    ) => {
      if (mode === "canvas") {
        setImageSrc(resampledUrl);
        setCroppedImageSrc(resampledUrl);
        setOriginalImageSrc(resampledUrl);
        return;
      }

      if (mode === "new_frame" || mode === "asset_pool") {
        const frameName = name || `Resampled Frame ${storyboardSlices.length + 1}`;
        setStoryboardSlices((prev) => [...prev, { name: frameName, url: resampledUrl }]);
        if (mode === "new_frame") {
          setStoryboardSlots((prev) => {
            const next = [...prev];
            const emptyIdx = next.findIndex((s) => !s.url);
            if (emptyIdx !== -1) {
              next[emptyIdx] = { ...next[emptyIdx], url: resampledUrl, name: frameName };
            } else {
              next.push({ url: resampledUrl, name: frameName, story: "" });
            }
            return next;
          });
        }
        return;
      }

      // mode === "replace" or default
      if (targetSliceIndex !== undefined && targetSliceIndex !== null) {
        if (storyboardSlices[targetSliceIndex]) {
          handleUpdateSliceUrl(targetSliceIndex, resampledUrl, name);
        } else if (storyboardSlots[targetSliceIndex]) {
          setStoryboardSlots((prev) => {
            const next = [...prev];
            next[targetSliceIndex] = {
              ...next[targetSliceIndex],
              url: resampledUrl,
              name: name || next[targetSliceIndex].name,
            };
            return next;
          });
        } else {
          setStoryboardSlices((prev) => [
            ...prev,
            { name: name || `Resampled Slice ${prev.length + 1}`, url: resampledUrl },
          ]);
        }
      } else if (expandedCustomSlice) {
        setExpandedCustomSlice({
          name: name || expandedCustomSlice.name,
          url: resampledUrl,
        });
      } else if (storyboardSlices.length > 0) {
        handleUpdateSliceUrl(0, resampledUrl, name);
      } else {
        setImageSrc(resampledUrl);
        setCroppedImageSrc(resampledUrl);
        setOriginalImageSrc(resampledUrl);
      }
    },
    [storyboardSlices, storyboardSlots, handleUpdateSliceUrl, expandedCustomSlice]
  );

  // Open Variations Image Studio
  const handleOpenVariationsStudio = useCallback(
    (customUrl?: string, customName?: string, index?: number) => {
      if (customUrl) {
        setVariationsStudioIndex(index ?? null);
        setVariationsStudioUrl(customUrl);
        setVariationsStudioName(customName || `Frame ${(index ?? 0) + 1}`);
      } else if (index !== undefined && index !== null && activeStudioSlices[index]) {
        setVariationsStudioIndex(index);
        setVariationsStudioUrl(activeStudioSlices[index].url);
        setVariationsStudioName(activeStudioSlices[index].name);
      } else if (activeStudioSlices.length > 0) {
        setVariationsStudioIndex(0);
        setVariationsStudioUrl(activeStudioSlices[0].url);
        setVariationsStudioName(activeStudioSlices[0].name);
      } else {
        setVariationsStudioIndex(null);
        setVariationsStudioUrl(croppedImageSrc || imageSrc || originalImageSrc || undefined);
        setVariationsStudioName(slicePrefix || "Canvas Image");
      }
      setIsVariationsStudioOpen(true);
    },
    [activeStudioSlices, croppedImageSrc, imageSrc, originalImageSrc, slicePrefix]
  );

  // Fallback-aware slice sequence for Zoom Image Studio (includes Front Page panels & master artwork when Storyboard is empty)
  const zoomStudioSlices = useMemo(() => {
    if (activeStudioSlices.length > 0) {
      return activeStudioSlices;
    }
    const items: Array<{ name: string; url: string }> = [];
    const seenUrls = new Set<string>();
    const masterCandidate =
      croppedImageSrc || imageSrc || originalImageSrc || originalSpreadImage;
    if (masterCandidate) {
      items.push({
        name: slicePrefix || "Master artwork",
        url: masterCandidate,
      });
      seenUrls.add(masterCandidate);
    }
    for (let i = 1; i <= 16; i++) {
      const panelUrl = boxImages[i];
      if (panelUrl && !seenUrls.has(panelUrl)) {
        items.push({ name: `Panel ${i}`, url: panelUrl });
        seenUrls.add(panelUrl);
      }
    }
    if (items.length === 0 && DEFAULT_FRONT_PAGE_IMAGE) {
      items.push({ name: "Master artwork", url: DEFAULT_FRONT_PAGE_IMAGE });
    }
    return items;
  }, [
    activeStudioSlices,
    croppedImageSrc,
    imageSrc,
    originalImageSrc,
    originalSpreadImage,
    boxImages,
    slicePrefix,
  ]);

  // Open Zoom Image Studio
  const handleOpenZoomStudio = useCallback(
    (customUrl?: string, customName?: string, index?: number) => {
      if (customUrl) {
        setZoomStudioIndex(index ?? null);
        setZoomStudioUrl(customUrl);
        setZoomStudioName(customName || `Frame ${(index ?? 0) + 1}`);
      } else if (
        index !== undefined &&
        index !== null &&
        zoomStudioSlices[index]
      ) {
        setZoomStudioIndex(index);
        setZoomStudioUrl(zoomStudioSlices[index].url);
        setZoomStudioName(zoomStudioSlices[index].name);
      } else if (zoomStudioSlices.length > 0) {
        setZoomStudioIndex(0);
        setZoomStudioUrl(zoomStudioSlices[0].url);
        setZoomStudioName(zoomStudioSlices[0].name);
      } else {
        setZoomStudioIndex(null);
        setZoomStudioUrl(
          croppedImageSrc ||
            imageSrc ||
            originalImageSrc ||
            originalSpreadImage ||
            DEFAULT_FRONT_PAGE_IMAGE ||
            undefined
        );
        setZoomStudioName(slicePrefix || "Master artwork");
      }
      setIsZoomStudioOpen(true);
    },
    [
      zoomStudioSlices,
      croppedImageSrc,
      imageSrc,
      originalImageSrc,
      originalSpreadImage,
      slicePrefix,
    ]
  );

  // Apply variations back to App storyboard / slices
  const handleApplyVariations = useCallback(
    (
      variationFrames: Array<{ name: string; url: string }>,
      mode: "append_storyboard" | "replace_frame",
      targetSliceIndex?: number | null
    ) => {
      if (mode === "append_storyboard") {
        setStoryboardSlices((prev) => [...prev, ...variationFrames]);
        setStoryboardSlots((prev) => {
          const next = [...prev];
          variationFrames.forEach((frame) => {
            const emptyIdx = next.findIndex((s) => !s.url);
            if (emptyIdx !== -1) {
              next[emptyIdx] = { ...next[emptyIdx], url: frame.url, name: frame.name };
            } else {
              next.push({ url: frame.url, name: frame.name, story: "" });
            }
          });
          return next;
        });
      } else {
        // replace_frame sequence
        if (targetSliceIndex !== null && targetSliceIndex !== undefined && storyboardSlices[targetSliceIndex]) {
          setStoryboardSlices((prev) => {
            const next = [...prev];
            next.splice(targetSliceIndex, 1, ...variationFrames);
            return next;
          });
          setStoryboardSlots((prev) => {
            const next = [...prev];
            if (next[targetSliceIndex]) {
              next.splice(
                targetSliceIndex,
                1,
                ...variationFrames.map((f) => ({ url: f.url, name: f.name, story: "" }))
              );
            }
            return next;
          });
        } else {
          setStoryboardSlices((prev) => [...prev, ...variationFrames]);
          setStoryboardSlots((prev) => {
            const next = [...prev];
            variationFrames.forEach((frame) => {
              const emptyIdx = next.findIndex((s) => !s.url);
              if (emptyIdx !== -1) {
                next[emptyIdx] = { ...next[emptyIdx], url: frame.url, name: frame.name };
              } else {
                next.push({ url: frame.url, name: frame.name, story: "" });
              }
            });
            return next;
          });
        }
      }
    },
    [storyboardSlices]
  );

  // Push generated zoom frames directly into Storyboard & open AniPlayer
  const handleOpenZoomInAniPlayer = useCallback(
    (
      variationFrames: Array<{ name: string; url: string }>,
      targetSliceIndex?: number | null
    ) => {
      const applyMode =
        targetSliceIndex !== null &&
        targetSliceIndex !== undefined &&
        Boolean(storyboardSlices[targetSliceIndex])
          ? "replace_frame"
          : "append_storyboard";
      handleApplyVariations(variationFrames, applyMode, targetSliceIndex);
      setIsPlayerModalOpen(true);
    },
    [storyboardSlices, handleApplyVariations]
  );

  // Reversing & Duplicating helpers
  const handleReverseStoryboardSlices = () => {
    setStoryboardSlices((prev) => [...prev].reverse());
  };

  const handleReverseStoryboardSlots = useCallback(() => {
    if (storyboardSlots.length <= 1) return;
    if (selectedStoryboardSlotIndices.size > 1) {
      const sorted = Array.from(selectedStoryboardSlotIndices).sort((a, b) => a - b);
      const reversed = sorted.map((idx) => storyboardSlots[idx]).reverse();
      setStoryboardSlots((prev) => {
        const next = [...prev];
        sorted.forEach((origIdx, i) => {
          next[origIdx] = reversed[i];
        });
        return next;
      });
      setCropNotice(`✓ Reversed order of ${sorted.length} selected storyboard slots!`);
      setTimeout(() => setCropNotice(null), 2500);
    } else {
      setStoryboardSlots((prev) => [...prev].reverse());
      setCropNotice(`✓ Reversed order of all ${storyboardSlots.length} storyboard slots!`);
      setTimeout(() => setCropNotice(null), 2500);
    }
  }, [storyboardSlots, selectedStoryboardSlotIndices]);

  const handleDuplicateStoryboardSlots = useCallback(() => {
    if (storyboardSlots.length === 0) return;
    if (selectedStoryboardSlotIndices.size > 0) {
      const sorted = Array.from(selectedStoryboardSlotIndices).sort((a, b) => a - b);
      const nextSlots: StoryboardSlotItem[] = [];
      const newSelected = new Set<number>();
      storyboardSlots.forEach((slot, i) => {
        nextSlots.push(slot);
        if (selectedStoryboardSlotIndices.has(i)) {
          const copy: StoryboardSlotItem = {
            ...slot,
            name: slot.name ? `${slot.name} (Copy)` : "Copy",
            title: slot.title ? `${slot.title} (Copy)` : undefined,
          };
          nextSlots.push(copy);
          newSelected.add(nextSlots.length - 1);
        }
      });
      setStoryboardSlots(nextSlots);
      setSelectedStoryboardSlotIndices(newSelected);
      setCropNotice(`✓ Duplicated ${sorted.length} selected frame(s) in storyboard!`);
      setTimeout(() => setCropNotice(null), 2500);
    } else {
      const filledSlots = storyboardSlots.filter((s) => s.url);
      if (filledSlots.length === 0) {
        setCropNotice("No filled frames to duplicate. Add images to slots first.");
        setTimeout(() => setCropNotice(null), 2500);
        return;
      }
      const nextSlots: StoryboardSlotItem[] = [];
      const newSelected = new Set<number>();
      storyboardSlots.forEach((slot) => {
        nextSlots.push(slot);
        if (slot.url) {
          const copy: StoryboardSlotItem = {
            ...slot,
            name: slot.name ? `${slot.name} (Copy)` : "Copy",
            title: slot.title ? `${slot.title} (Copy)` : undefined,
          };
          nextSlots.push(copy);
          newSelected.add(nextSlots.length - 1);
        }
      });
      setStoryboardSlots(nextSlots);
      setSelectedStoryboardSlotIndices(newSelected);
      setCropNotice(`✓ Duplicated all ${filledSlots.length} filled frame(s) in storyboard!`);
      setTimeout(() => setCropNotice(null), 2500);
    }
  }, [selectedStoryboardSlotIndices, storyboardSlots]);

  const handleDuplicateAndReverseStoryboardSlots = useCallback(() => {
    if (storyboardSlots.length === 0) return;
    let targetIndices = Array.from(selectedStoryboardSlotIndices).sort((a, b) => a - b);
    if (targetIndices.length === 0) {
      targetIndices = storyboardSlots
        .map((s, i) => (s.url ? i : -1))
        .filter((i) => i !== -1);
    }
    if (targetIndices.length === 0) {
      setCropNotice("No slots to duplicate & reverse. Add images to slots first.");
      setTimeout(() => setCropNotice(null), 2500);
      return;
    }

    const duplicates = targetIndices
      .map((i) => storyboardSlots[i])
      .reverse()
      .map((slot) => ({
        ...slot,
        name: slot.name ? `${slot.name} (Loop)` : "Loop",
        title: slot.title ? `${slot.title} (Loop)` : undefined,
      }));

    const nextSlots = [...storyboardSlots, ...duplicates];
    const newSelected = new Set<number>();
    for (let i = storyboardSlots.length; i < nextSlots.length; i++) {
      newSelected.add(i);
    }

    setStoryboardSlots(nextSlots);
    setSelectedStoryboardSlotIndices(newSelected);
    setCropNotice(`✓ Duplicated ${duplicates.length} frame(s) in reverse sequence (Ping-Pong Loop)!`);
    setTimeout(() => setCropNotice(null), 2500);
  }, [selectedStoryboardSlotIndices, storyboardSlots]);

  const activeToolbarOrder = useMemo(() => {
    return storyboardToolbarOrder;
  }, [storyboardToolbarOrder]);

  // Enhanced Slice Selection Helpers (Supports 1-click & Shift range selection)
  const handleToggleSelectSlice = useCallback(
    (url: string, index: number, e?: React.MouseEvent) => {
      const isShift = e ? e.shiftKey || isShiftPressed : isShiftPressed;

      setSelectedSliceUrls((prev) => {
        const next = new Set(prev);
        if (isShift && lastSelectedSliceIndex !== null) {
          const min = Math.min(lastSelectedSliceIndex, index);
          const max = Math.max(lastSelectedSliceIndex, index);
          for (let i = min; i <= max; i++) {
            if (storyboardSlices[i]) {
              next.add(storyboardSlices[i].url);
            }
          }
        } else {
          if (next.has(url)) {
            next.delete(url);
          } else {
            next.add(url);
          }
        }
        return next;
      });
      setLastSelectedSliceIndex(index);
    },
    [isShiftPressed, lastSelectedSliceIndex, storyboardSlices]
  );

  const toggleSelectSlice = (url: string) => {
    const idx = storyboardSlices.findIndex((s) => s.url === url);
    handleToggleSelectSlice(url, idx !== -1 ? idx : 0);
  };

  const handleClearSliceSelection = useCallback(() => {
    setSelectedSliceUrls(new Set());
    setLastSelectedSliceIndex(null);
  }, []);

  const toggleSelectAllSlices = () => {
    if (selectedSliceUrls.size === storyboardSlices.length && storyboardSlices.length > 0) {
      setSelectedSliceUrls(new Set());
      setLastSelectedSliceIndex(null);
    } else {
      setSelectedSliceUrls(new Set(storyboardSlices.map((s) => s.url)));
    }
  };

  const handleDeleteSelectedSlices = () => {
    if (selectedSliceUrls.size === 0) return;
    const count = selectedSliceUrls.size;
    setStoryboardSlices((prev) => prev.filter((s) => !selectedSliceUrls.has(s.url)));
    setSelectedSliceUrls(new Set());
    setLastSelectedSliceIndex(null);
    setCropNotice(`\u2713 Removed ${count} slice(s) from Carved Slices`);
    setTimeout(() => setCropNotice(null), 3000);
  };

  const handleDownloadSelectedSlices = async () => {
    const selectedSlices = storyboardSlices.filter((s) => selectedSliceUrls.has(s.url));
    const targets = selectedSlices.length > 0 ? selectedSlices : storyboardSlices;
    if (targets.length === 0) {
      alert("No slices selected to download.");
      return;
    }

    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const filePrefix = slicePrefix ? `${slicePrefix}` : "";
      const usedNames = new Set<string>();

      targets.forEach((item, idx) => {
        if (!item.url) return;
        const mimeMatch = item.url.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,/i);
        const ext = mimeMatch
          ? mimeMatch[1].toLowerCase().includes("jpeg")
            ? "jpg"
            : mimeMatch[1].toLowerCase().includes("webp")
            ? "webp"
            : "png"
          : "png";
        const base64Data = dataUrlToBase64(item.url);
        const rawName = item.name || `slice-${idx + 1}`;
        let filename = getFormattedFilename(rawName, idx, ext, filePrefix ? "" : filePrefix);

        let counter = 1;
        while (usedNames.has(filename)) {
          const dotIdx = filename.lastIndexOf(".");
          if (dotIdx > 0) {
            const base = filename.substring(0, dotIdx);
            const extension = filename.substring(dotIdx);
            filename = `${base}-${counter}${extension}`;
          } else {
            filename = `${filename}-${counter}`;
          }
          counter++;
        }
        usedNames.add(filename);
        zip.file(filename, base64Data, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const archiveName = slicePrefix
        ? `${slicePrefix.trim()}-carved-slices-selected.zip`
        : "carved-slices-selected.zip";
      saveAs(zipBlob, archiveName);
      setCropNotice(`\u2713 Downloaded ${targets.length} selected slice(s) as ZIP archive!`);
      setTimeout(() => setCropNotice(null), 3000);
    } catch (err) {
      console.error("Failed to download selected slices:", err);
      alert("Failed to create ZIP for selected slices.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Double click slice to insert into first empty slot
  const handleDoubleClickSlice = (sliceUrl: string, sliceName: string) => {
    setStoryboardSlots((prev) => {
      const next = [...prev];
      const emptyIdx = next.findIndex((slot) => !slot.url);
      if (emptyIdx !== -1) {
        next[emptyIdx] = {
          ...next[emptyIdx],
          url: sliceUrl,
          name: next[emptyIdx].name || sliceName,
        };
      } else {
        next.push({ url: sliceUrl, name: sliceName, story: "" });
      }
      return next;
    });
  };

  // Multi-Insert Handler (Overwrite, Fill Empties, Append)
  const handleMultiInsert = (
    insertMode: "overwrite" | "fill-empties" | "append"
  ) => {
    const selectedSlices = storyboardSlices.filter((s) =>
      selectedSliceUrls.has(s.url)
    );
    let targets = selectedSlices.length > 0 ? selectedSlices : storyboardSlices;

    // Fallback: If no storyboardSlices, also check boxImages (e.g. from 9-screen landing page)
    if (targets.length === 0) {
      const boxList = Object.entries(boxImages)
        .filter(([_, url]) => Boolean(url))
        .map(([id, url]) => ({ url: url as string, name: `Panel ${id}` }));
      if (boxList.length > 0) {
        targets = boxList;
        setStoryboardSlices(boxList);
      }
    }

    if (targets.length === 0) {
      setCropNotice("⚠️ No slices available. Please import slices or carve an image first!");
      setTimeout(() => setCropNotice(null), 3000);
      return;
    }

    if (isReverseInsert) {
      targets = [...targets].reverse();
    }

    setStoryboardSlots((prev) => {
      let next = [...prev];

      if (insertMode === "overwrite") {
        const baseLength = storyboardLayout === "grid9" ? 9 : numRows * numCols > 0 ? numRows * numCols : 9;
        const totalSlotsNeeded = Math.max(baseLength, targets.length);
        // Completely clear the entire storyboard slots first
        next = Array.from({ length: totalSlotsNeeded }, () => ({
          url: null,
          name: "",
          story: "",
        }));

        // Then insert the slices sequentially starting from slot 1
        targets.forEach((target, i) => {
          next[i] = {
            url: target.url,
            name: target.name || `Screen ${i + 1}`,
            story: "",
          };
        });
      } else if (insertMode === "fill-empties") {
        let targetIdx = 0;
        for (let i = 0; i < next.length && targetIdx < targets.length; i++) {
          if (!next[i].url) {
            next[i] = {
              ...next[i],
              url: targets[targetIdx].url,
              name: targets[targetIdx].name || next[i].name || `Screen ${i + 1}`,
            };
            targetIdx++;
          }
        }
        if (targetIdx < targets.length) {
          const remaining = targets.slice(targetIdx);
          remaining.forEach((target) => {
            next.push({
              url: target.url,
              name: target.name || `Screen ${next.length + 1}`,
              story: "",
            });
          });
        }
      } else if (insertMode === "append") {
        let lastFilledIdx = -1;
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].url) {
            lastFilledIdx = i;
            break;
          }
        }
        const startIdx = lastFilledIdx + 1;
        targets.forEach((target, i) => {
          const targetSlotIdx = startIdx + i;
          if (targetSlotIdx < next.length) {
            next[targetSlotIdx] = {
              ...next[targetSlotIdx],
              url: target.url,
              name: target.name || next[targetSlotIdx].name || `Screen ${targetSlotIdx + 1}`,
            };
          } else {
            next.push({
              url: target.url,
              name: target.name || `Screen ${next.length + 1}`,
              story: "",
            });
          }
        });
      }

      return next;
    });

    const actionText =
      insertMode === "overwrite"
        ? "Overwrote"
        : insertMode === "fill-empties"
        ? "Filled empty slots with"
        : "Appended";
    setCropNotice(`✓ ${actionText} ${targets.length} slice(s) in Storyboard!`);
    setTimeout(() => setCropNotice(null), 3000);
  };

  const handleStoryboardSlotDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (isStoryboardLocked) return;

    // Direct image file dropped onto slot
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith("image/")) return;
      handleStoryboardSlotUpload(file, targetIdx);
      return;
    }

    // Dragged from another slot in the storyboard
    if (draggedSlotIdx !== null && draggedSlotIdx !== targetIdx) {
      setStoryboardSlots((prev) => {
        const next = [...prev];
        if (storyboardDropAction === "swap") {
          const temp = next[targetIdx];
          next[targetIdx] = next[draggedSlotIdx];
          next[draggedSlotIdx] = temp;
        } else if (storyboardDropAction === "replace") {
          next[targetIdx] = { ...next[draggedSlotIdx] };
        } else {
          // "reorder": move dragged slot to target position
          const [moved] = next.splice(draggedSlotIdx, 1);
          next.splice(targetIdx, 0, moved);
        }
        return next;
      });
      setDraggedSlotIdx(null);
      return;
    }

    // Dragged from Assets pool
    const sliceUrl = draggedSliceUrl || e.dataTransfer.getData("text/plain");
    if (sliceUrl) {
      const matchingSlice = storyboardSlices.find((s) => s.url === sliceUrl);
      const sliceName = matchingSlice?.name || `Screen ${targetIdx + 1}`;

      setStoryboardSlots((prev) => {
        const next = [...prev];
        if (storyboardDropAction === "reorder") {
          next.splice(targetIdx, 0, { url: sliceUrl, name: sliceName, story: "" });
        } else {
          next[targetIdx] = {
            ...next[targetIdx],
            url: sliceUrl,
            name: sliceName,
          };
        }
        return next;
      });
      setDraggedSliceUrl(null);
      setCropNotice(`✓ Placed ${sliceName} into Slot #${targetIdx + 1}`);
      setTimeout(() => setCropNotice(null), 2500);
    }
  };

  const handleStoryboardSlotUpload = (file: File, slotIdx: number) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result?.toString() || "";
      if (url) {
        const fileName = file.name.replace(/\.[^/.]+$/, "") || `Screen ${slotIdx + 1}`;
        setStoryboardSlots((prev) => {
          const next = [...prev];
          next[slotIdx] = {
            url,
            name: fileName,
            story: next[slotIdx]?.story || "",
          };
          return next;
        });
        setStoryboardSlices((prev) => {
          if (!prev.some((s) => s.url === url)) {
            return [...prev, { url, name: fileName }];
          }
          return prev;
        });
        setCropNotice(`✓ Loaded ${fileName} into Slot #${slotIdx + 1}`);
        setTimeout(() => setCropNotice(null), 2500);
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * Download all storyboard assets as a ZIP.
   */
  const handleDownloadAssets = async () => {
    const filledSlots = storyboardSlots.filter((s) => s.url);
    const sliceNameMap = new Map(storyboardSlices.map((s) => [s.url, s.name]));
    const slotNameMap = new Map(
      storyboardSlots
        .filter((s) => s.url && s.name && s.name.trim())
        .map((s) => [s.url!, s.name.trim()])
    );

    let itemsToPackage: Array<{ url: string; name: string; hasCustomName: boolean }>;

    if (filledSlots.length > 0) {
      itemsToPackage = filledSlots.map((slot, idx) => {
        const slotCustomName = slot.name && slot.name.trim() ? slot.name.trim() : "";
        const sliceCustomName = sliceNameMap.get(slot.url!) || "";
        const customName = slotCustomName || sliceCustomName;
        const rawName = customName || `screen-${idx + 1}`;
        return { url: slot.url!, name: rawName, hasCustomName: !!customName };
      });
    } else if (storyboardSlices.length > 0) {
      itemsToPackage = storyboardSlices.map((slice, idx) => {
        const slotCustomName = slotNameMap.get(slice.url) || "";
        const sliceCustomName = slice.name && slice.name.trim() ? slice.name.trim() : "";
        const customName = slotCustomName || sliceCustomName;
        const rawName = customName || `screen-${idx + 1}`;
        return { url: slice.url, name: rawName, hasCustomName: !!customName };
      });
    } else {
      alert("There are no storyboard assets or filled slots to download.");
      return;
    }

    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const filePrefix = slicePrefix ? `${slicePrefix}` : "";
      const usedNames = new Set<string>();

      itemsToPackage.forEach((item, idx) => {
        if (!item.url) return;
        const mimeMatch = item.url.match(
          /^data:(image\/(?:png|jpeg|jpg|webp));base64,/i
        );
        const ext = mimeMatch
          ? mimeMatch[1].toLowerCase().includes("jpeg")
            ? "jpg"
            : mimeMatch[1].toLowerCase().includes("webp")
            ? "webp"
            : "png"
          : "png";
        const base64Data = dataUrlToBase64(item.url);

        const rawName = item.name || `screen-${idx + 1}`;
        let filename = getFormattedFilename(
          rawName,
          idx,
          ext,
          item.hasCustomName ? "" : filePrefix
        );

        let counter = 1;
        while (usedNames.has(filename)) {
          const dotIdx = filename.lastIndexOf(".");
          if (dotIdx > 0) {
            const base = filename.slice(0, dotIdx);
            const extStr = filename.slice(dotIdx);
            filename = `${base}_${counter}${extStr}`;
          } else {
            filename = `${filename}_${counter}`;
          }
          counter++;
        }
        usedNames.add(filename);
        zip.file(filename, base64Data, { base64: true });
      });

      const content = await zip.generateAsync({ type: "blob" });
      const defaultZipName = slicePrefix
        ? `${slicePrefix}-storyboard-assets.zip`
        : "storyboard-assets.zip";

      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const hhmm = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
      const fullStamp = `${today}_${hhmm}`;
      const rawPrefix = slicePrefix ? slicePrefix : "storyboard";

      const cleanSliceNames = itemsToPackage
        .map((i) => i.name)
        .filter(Boolean)
        .map((n) =>
          n
            .trim()
            .replace(/[/\\?%*:|"<>]/g, "")
            .replace(/\s+/g, "-")
        )
        .filter((n) => n.length > 0);

      const uniqueSliceNames = Array.from(new Set(cleanSliceNames));
      const firstName = uniqueSliceNames[0] || "slice";
      const lastName = uniqueSliceNames[uniqueSliceNames.length - 1] || "slice";
      const secondName = uniqueSliceNames[1];

      const sliceBasedSuggestions: string[] = [];

      if (uniqueSliceNames.length > 0) {
        sliceBasedSuggestions.push(`${firstName}-${today}.zip`);
        if (uniqueSliceNames.length > 1 && firstName !== lastName) {
          sliceBasedSuggestions.push(`${firstName}-to-${lastName}.zip`);
        }
        if (secondName) {
          sliceBasedSuggestions.push(`${firstName}_${secondName}.zip`);
        }
        sliceBasedSuggestions.push(`${firstName}-${itemsToPackage.length}-slices.zip`);
        sliceBasedSuggestions.push(`${firstName}_${fullStamp}.zip`);
      }

      const suggestions = [
        defaultZipName,
        ...sliceBasedSuggestions,
        `${rawPrefix}-${today}.zip`,
        `${rawPrefix}-${fullStamp}.zip`,
        `${rawPrefix}-assets-${itemsToPackage.length}-items.zip`,
        `${today}.zip`,
        `${fullStamp}.zip`,
      ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

      setZipModalConfig({
        isOpen: true,
        defaultName: defaultZipName,
        suggestions,
        itemCount: itemsToPackage.length,
        title: "Name Board Assets ZIP Archive",
        onConfirm: async (finalZipName, browseFolder) => {
          if (browseFolder) {
            await saveZipToFolder(content, finalZipName);
          } else {
            downloadBlob(content, finalZipName);
          }
        },
      });
    } catch (e) {
      console.error(e);
      alert("Failed to package assets. See the console for details.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportStoryboard = () => {
    setIsExportJsonModalOpen(true);
  };

  const handleConfirmExportStoryboardJson = (filename: string) => {
    try {
      const dataStr = JSON.stringify(storyboardSlots, null, 2);
      const finalName = filename.toLowerCase().endsWith(".json") ? filename : `${filename}.json`;
      const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", url);
      linkElement.setAttribute("download", finalName);
      linkElement.style.display = "none";
      document.body.appendChild(linkElement);
      linkElement.click();
      setTimeout(() => {
        try {
          if (document.body.contains(linkElement)) {
            document.body.removeChild(linkElement);
          }
          URL.revokeObjectURL(url);
        } catch {}
      }, 1500);
      setCropNotice(`\u2713 Exported ${storyboardSlots.length} storyboard slots to "${finalName}"!`);
      setTimeout(() => setCropNotice(null), 3000);
    } catch (err) {
      console.error("Storyboard JSON export failed", err);
    }
  };

  const handleExportStoryboardPDF = async () => {
    const filledSlots = storyboardSlots
      .map((slot, index) => ({ ...slot, originalIndex: index + 1 }))
      .filter((s) => s.url);

    if (filledSlots.length === 0) {
      alert("No storyboard slots contain images to export to PDF.");
      return;
    }

    setIsProcessing(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      const headerHeight = 16;

      const cols = 3;
      const rows = 2;
      const itemsPerPage = cols * rows;

      const gapX = 8;
      const gapY = 8;
      const availableWidth = pageWidth - margin * 2 - gapX * (cols - 1);
      const availableHeight = pageHeight - margin * 2 - headerHeight - gapY * (rows - 1);

      const cellWidth = availableWidth / cols;
      const cellHeight = availableHeight / rows;
      const imageHeight = cellHeight * 0.66;

      for (let i = 0; i < filledSlots.length; i++) {
        const slot = filledSlots[i];
        const pageIndex = Math.floor(i / itemsPerPage);
        const itemOnPage = i % itemsPerPage;

        if (i > 0 && itemOnPage === 0) {
          doc.addPage();
        }

        if (itemOnPage === 0) {
          doc.setFillColor(9, 14, 26);
          doc.rect(0, 0, pageWidth, pageHeight, "F");

          doc.setTextColor(16, 185, 129);
          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          const titleText = (slicePrefix ? `${slicePrefix.toUpperCase()} - ` : "") + "STORYBOARD";
          doc.text(titleText, margin, margin + 4);

          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(148, 163, 184);
          const totalPages = Math.ceil(filledSlots.length / itemsPerPage);
          const subtitle = `Total Shots: ${filledSlots.length} | Page ${pageIndex + 1} of ${totalPages}`;
          doc.text(subtitle, pageWidth - margin, margin + 4, { align: "right" });

          doc.setDrawColor(30, 41, 59);
          doc.setLineWidth(0.4);
          doc.line(margin, margin + 7, pageWidth - margin, margin + 7);
        }

        const colIndex = itemOnPage % cols;
        const rowIndex = Math.floor(itemOnPage / cols);

        const x = margin + colIndex * (cellWidth + gapX);
        const y = margin + headerHeight + rowIndex * (cellHeight + gapY);

        doc.setFillColor(15, 23, 42);
        doc.setDrawColor(30, 41, 59);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, cellWidth, cellHeight, 2, 2, "FD");

        if (slot.url) {
          try {
            const imgData = await getImageDataUrl(slot.url);
            const imgMargin = 2;
            const imgW = cellWidth - imgMargin * 2;
            const imgH = imageHeight - imgMargin;
            doc.addImage(imgData, "JPEG", x + imgMargin, y + imgMargin, imgW, imgH, undefined, "FAST");
          } catch (err) {
            console.warn("PDF image error:", err);
          }
        }

        const textY = y + imageHeight + 1;

        doc.setFillColor(16, 185, 129);
        doc.roundedRect(x + 2, textY, 13, 4.5, 1, 1, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(2, 6, 23);
        doc.text(`#${slot.originalIndex}`, x + 8.5, textY + 3.2, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(241, 245, 249);
        const frameTitle = slot.name || `Shot ${slot.originalIndex}`;
        const truncatedTitle = frameTitle.length > 28 ? frameTitle.substring(0, 26) + "..." : frameTitle;
        doc.text(truncatedTitle, x + 17, textY + 3.5);

        if (slot.story) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.5);
          doc.setTextColor(148, 163, 184);
          const splitLines = doc.splitTextToSize(slot.story, cellWidth - 4);
          const maxLines = 3;
          const linesToPrint = splitLines.slice(0, maxLines);
          linesToPrint.forEach((line: string, lineIdx: number) => {
            doc.text(line, x + 2, textY + 8.5 + lineIdx * 3);
          });
        }
      }

      const pdfFilename = `${slicePrefix ? slicePrefix.toLowerCase() + "-" : ""}storyboard.pdf`;
      doc.save(pdfFilename);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to export Storyboard PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportStoryboardPSD = async (targetMode?: "selected" | "workspace" | "all") => {
    setIsProcessing(true);
    try {
      let targets: { name: string; url: string; index: number }[] = [];

      const selectedSlices = storyboardSlices.filter((s) => selectedSliceUrls.has(s.url));

      if (targetMode === "selected" || (selectedSlices.length > 0 && targetMode !== "workspace")) {
        targets = selectedSlices.map((s, idx) => ({
          name: s.name || `Selected Slice ${idx + 1}`,
          url: s.url,
          index: idx,
        }));
      } else {
        const filledSlots = storyboardSlots
          .map((slot, index) => ({ slot, index }))
          .filter(({ slot }) => Boolean(slot.url));

        if (filledSlots.length > 0) {
          targets = filledSlots.map(({ slot, index }) => ({
            name: slot.name || slot.title || `Storyboard Frame ${index + 1}`,
            url: slot.url!,
            index,
          }));
        } else if (storyboardSlices.length > 0) {
          targets = storyboardSlices.map((s, idx) => ({
            name: s.name || `Slice ${idx + 1}`,
            url: s.url,
            index: idx,
          }));
        }
      }

      if (targets.length === 0) {
        alert("No storyboard slices or frames available to export to PSD.");
        return;
      }

      const items: PsdExportSliceItem[] = targets.map((t) => ({
        name: t.name,
        url: t.url,
      }));

      const projectName = slicePrefix
        ? `${slicePrefix.trim()}-storyboard-layers`
        : `storyboard-composition-${Date.now()}`;

      await exportStoryboardSlicesToPsd(items, {
        projectName,
        backgroundColor: "#0f172a",
      });

      setCropNotice(`✓ Exported ${targets.length} slice(s) to multi-layer PSD "${projectName}.psd"!`);
      setTimeout(() => setCropNotice(null), 3500);
    } catch (err) {
      console.error("Storyboard PSD export failed:", err);
      alert("Failed to export slices to PSD file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportStoryboard = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as any[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed.length !== 9) setStoryboardLayout("list-dynamic");
          setStoryboardSlots(parsed);
          const newSlices: { name: string; url: string }[] = [];
          parsed.forEach((slot, idx) => {
            if (slot.url && !newSlices.find((s) => s.url === slot.url)) {
              newSlices.push({ name: slot.name || `Imported-${idx + 1}`, url: slot.url });
            }
          });
          if (newSlices.length > 0) {
            setStoryboardSlices((prev) => {
              const combined = [...prev];
              newSlices.forEach((ns) => {
                if (!combined.find((c) => c.url === ns.url)) combined.push(ns);
              });
              return combined;
            });
          }
          setMode("storyboard");
        } else {
          alert("Invalid storyboard file format. Expected a non-empty array of screens.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse storyboard file.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  // Capture a snapshot reflecting the exact live canvas appearance
  const captureLiveCanvasSnapshot = useCallback(async (): Promise<string | null> => {
    const currentSrc =
      mode === "carve"
        ? croppedImageSrc || imageSrc
        : imageSrc || originalImageSrc;
    if (!currentSrc) return null;

    return new Promise((resolve) => {
      const img = new Image();
      if (currentSrc.startsWith("http://") || currentSrc.startsWith("https://")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => {
        const naturalW = img.naturalWidth || 800;
        const naturalH = img.naturalHeight || 600;

        const canvas = document.createElement("canvas");
        canvas.width = naturalW;
        canvas.height = naturalH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.save();

        // 1. Carver skew transformation (if active in Carve mode)
        if (mode === "carve" && carverSkew !== 0) {
          ctx.translate(naturalW / 2, naturalH / 2);
          ctx.transform(1, 0, Math.tan((carverSkew * Math.PI) / 180), 1, 0, 0);
          ctx.translate(-naturalW / 2, -naturalH / 2);
        }

        // 2. Draw base canvas image
        ctx.drawImage(img, 0, 0, naturalW, naturalH);

        if (mode === "carve") {
          // 3. Outer Frame Margin / Perimeter Trim Overlays
          if (outerMargin > 0) {
            ctx.save();
            ctx.fillStyle = sliceLineColor;
            ctx.globalAlpha = sliceLineColor.toLowerCase() === "#ffffff" ? 0.85 : 0.65;
            ctx.fillRect(0, 0, naturalW, outerMargin); // Top
            ctx.fillRect(0, naturalH - outerMargin, naturalW, outerMargin); // Bottom
            ctx.fillRect(0, 0, outerMargin, naturalH); // Left
            ctx.fillRect(naturalW - outerMargin, 0, outerMargin, naturalH); // Right

            // Dashed trim boundary lines
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = sliceLineColor.toLowerCase() === "#ffffff" ? "#cbd5e1" : sliceLineColor;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(0, outerMargin);
            ctx.lineTo(naturalW, outerMargin);
            ctx.moveTo(0, naturalH - outerMargin);
            ctx.lineTo(naturalW, naturalH - outerMargin);
            ctx.moveTo(outerMargin, 0);
            ctx.lineTo(outerMargin, naturalH);
            ctx.moveTo(naturalW - outerMargin, 0);
            ctx.lineTo(naturalW - outerMargin, naturalH);
            ctx.stroke();
            ctx.restore();
          }

          // 4. Active Slice Cell Bounds Highlight when Cell Padding is configured
          if (sliceCellPadding !== 0 && gridSegments.length > 0) {
            ctx.save();
            gridSegments.forEach((seg) => {
              const x = (seg.leftPercent / 100) * naturalW;
              const y = (seg.topPercent / 100) * naturalH;
              const w = (seg.widthPercent / 100) * naturalW;
              const h = (seg.heightPercent / 100) * naturalH;

              ctx.strokeStyle = sliceCellPadding < 0 ? "rgba(251, 191, 36, 0.85)" : "rgba(6, 182, 212, 0.85)";
              ctx.fillStyle = sliceCellPadding < 0 ? "rgba(251, 191, 36, 0.08)" : "rgba(6, 182, 212, 0.08)";
              ctx.lineWidth = 1.5;
              ctx.setLineDash([4, 4]);
              ctx.fillRect(x, y, w, h);
              ctx.strokeRect(x, y, w, h);

              // Padding tag
              ctx.setLineDash([]);
              const tagText = `${sliceCellPadding < 0 ? "EXPAND" : "PAD"} ${Math.abs(sliceCellPadding)}px`;
              ctx.font = "bold 10px monospace";
              const m = ctx.measureText(tagText);
              ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
              ctx.fillRect(x + 4, y + 4, m.width + 6, 14);
              ctx.fillStyle = sliceCellPadding < 0 ? "#fef08a" : "#a5f3fc";
              ctx.fillText(tagText, x + 7, y + 15);
            });
            ctx.restore();
          }

          // 5. Grid Segment Numbering Labels (1-N badges)
          if (showGridLabels && gridSegments.length > 0) {
            gridSegments.forEach((seg) => {
              const isSelected = selectedSplitIndices.has(seg.seq);
              const isNumberOne = seg.seq === 1;
              const displayLabel = getSegmentPresetLabel(
                gridLabelPreset,
                { r: seg.r, c: seg.c, seq: seg.seq },
                customGridLabelPrefix
              );

              const cx = ((seg.leftPercent + seg.widthPercent / 2) / 100) * naturalW;
              const cy = ((seg.topPercent + seg.heightPercent / 2) / 100) * naturalH;

              const minDim = Math.min((seg.widthPercent / 100) * naturalW, (seg.heightPercent / 100) * naturalH);
              const fontSize = Math.max(12, Math.min(36, Math.round(minDim * 0.16)));

              ctx.save();
              ctx.font = `900 ${fontSize}px monospace, ui-monospace, sans-serif`;
              const textMetrics = ctx.measureText(displayLabel);
              const textW = textMetrics.width;
              const padX = Math.round(fontSize * 0.6);
              const padY = Math.round(fontSize * 0.35);
              const badgeW = textW + padX * 2;
              const badgeH = fontSize + padY * 2;
              const bx = cx - badgeW / 2;
              const by = cy - badgeH / 2;
              const radius = Math.min(badgeH / 2, 8);

              // Badge background & shadow
              ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
              ctx.shadowBlur = 10;
              ctx.shadowOffsetY = 2;

              ctx.beginPath();
              if (typeof ctx.roundRect === "function") {
                ctx.roundRect(bx, by, badgeW, badgeH, radius);
              } else {
                ctx.rect(bx, by, badgeW, badgeH);
              }

              if (isNumberOne) {
                ctx.fillStyle = isSelected ? "#fbbf24" : "rgba(2, 6, 23, 0.92)";
                ctx.strokeStyle = "#fbbf24";
              } else if (isSelected) {
                ctx.fillStyle = "#10b981";
                ctx.strokeStyle = "#6ee7b7";
              } else {
                ctx.fillStyle = "rgba(2, 6, 23, 0.88)";
                ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
              }
              ctx.lineWidth = 2;
              ctx.fill();
              ctx.stroke();

              // Text
              ctx.shadowColor = "transparent";
              ctx.shadowBlur = 0;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              if (isNumberOne) {
                ctx.fillStyle = isSelected ? "#020617" : "#fde047";
              } else if (isSelected) {
                ctx.fillStyle = "#020617";
              } else {
                ctx.fillStyle = "#34d399";
              }
              ctx.fillText(displayLabel, cx, cy);
              ctx.restore();
            });
          }

          // 6. Row cut lines (rose-coral lines)
          rowCuts.forEach((cutY) => {
            ctx.save();
            const thickness = Math.max(1, sliceLineThicknessY);
            ctx.strokeStyle = "#f43f5e";
            ctx.lineWidth = thickness;
            if (sliceLineStyle === "dashed") ctx.setLineDash([8, 6]);
            else if (sliceLineStyle === "dotted") ctx.setLineDash([2, 4]);
            else ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(0, cutY);
            ctx.lineTo(naturalW, cutY);
            ctx.stroke();
            ctx.restore();
          });

          // 7. Column cut lines (cyan lines)
          colCuts.forEach((cutX) => {
            ctx.save();
            const thickness = Math.max(1, sliceLineThicknessX);
            ctx.strokeStyle = "#06b6d4";
            ctx.lineWidth = thickness;
            if (sliceLineStyle === "dashed") ctx.setLineDash([8, 6]);
            else if (sliceLineStyle === "dotted") ctx.setLineDash([2, 4]);
            else ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(cutX, 0);
            ctx.lineTo(cutX, naturalH);
            ctx.stroke();
            ctx.restore();
          });
        } else if (mode === "crop") {
          // Multi-crops overlays if any
          if (multiCrops && multiCrops.length > 0) {
            multiCrops.forEach((mc, index) => {
              const x = (mc.crop.x / 100) * naturalW;
              const y = (mc.crop.y / 100) * naturalH;
              const w = (mc.crop.width / 100) * naturalW;
              const h = (mc.crop.height / 100) * naturalH;

              ctx.save();
              ctx.strokeStyle = "#10b981";
              ctx.lineWidth = 2;
              ctx.setLineDash([6, 6]);
              ctx.fillStyle = "rgba(16, 185, 129, 0.15)";

              if (mc.isCircular) {
                ctx.beginPath();
                ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
              } else {
                ctx.fillRect(x, y, w, h);
                ctx.strokeRect(x, y, w, h);
              }

              // Tag badge
              ctx.setLineDash([]);
              ctx.fillStyle = "#10b981";
              ctx.font = "bold 11px sans-serif";
              const tag = `#${index + 1} ${mc.isCircular ? "Oval" : "Rect"}`;
              const tw = ctx.measureText(tag).width;
              ctx.fillRect(x + 2, y + 2, tw + 8, 16);
              ctx.fillStyle = "#020617";
              ctx.fillText(tag, x + 6, y + 14);
              ctx.restore();
            });
          }

          // Active crop boundary
          const activeC = completedPercentCrop || crop;
          if (activeC && activeC.width && activeC.height && activeC.width > 0 && activeC.height > 0) {
            const x = (activeC.x / 100) * naturalW;
            const y = (activeC.y / 100) * naturalH;
            const w = (activeC.width / 100) * naturalW;
            const h = (activeC.height / 100) * naturalH;

            ctx.save();
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.strokeRect(x, y, w, h);
            ctx.restore();
          }
        }

        ctx.restore();
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(null);
      img.src = currentSrc;
    });
  }, [
    mode,
    croppedImageSrc,
    imageSrc,
    originalImageSrc,
    carverSkew,
    outerMargin,
    sliceLineColor,
    sliceCellPadding,
    gridSegments,
    showGridLabels,
    gridLabelPreset,
    customGridLabelPrefix,
    selectedSplitIndices,
    rowCuts,
    colCuts,
    sliceLineThicknessX,
    sliceLineThicknessY,
    sliceLineStyle,
    multiCrops,
    completedPercentCrop,
    crop,
  ]);

  // Handler to capture snapshot reflecting exact live canvas appearance and copy to Storyboard first
  const handleCopyLiveCanvasSnapshotToStoryboardFirst = useCallback(async () => {
    setIsProcessing(true);
    try {
      const liveSnapshotUrl = await captureLiveCanvasSnapshot();
      if (!liveSnapshotUrl) {
        alert("Failed to capture live canvas snapshot.");
        return;
      }
      const name =
        mode === "carve"
          ? `Live Canvas Snapshot (${numRows}×${numCols} Grid Overview)`
          : `Live Canvas Snapshot (${meshMode === "freestyle" ? "Freestyle Mesh" : "Crop View"})`;
      const snapshotItem = { name, url: liveSnapshotUrl };

      // 1. Copy to storyboard slices FIRST (prepended at index 0)
      setStoryboardSlices((prev) => [snapshotItem, ...prev]);

      // 2. Copy to storyboard slots FIRST (in slot 0 or first empty slot)
      setStoryboardSlots((prevSlots) => {
        const nextSlots = [...prevSlots];
        const firstEmptyIdx = nextSlots.findIndex((s) => !s.url);
        if (firstEmptyIdx !== -1) {
          nextSlots[firstEmptyIdx] = {
            ...nextSlots[firstEmptyIdx],
            url: snapshotItem.url,
            name: snapshotItem.name,
          };
        } else {
          nextSlots.unshift({
            url: snapshotItem.url,
            name: snapshotItem.name,
            story: "Live canvas snapshot overview",
          });
        }
        return nextSlots;
      });

      setMode("storyboard");
      setCropNotice("✓ Snapshot reflecting exact live canvas appearance copied to Storyboard first!");
      setTimeout(() => setCropNotice(null), 3500);
    } catch (err) {
      console.error("Failed to copy live canvas snapshot to storyboard:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [mode, numRows, numCols, meshMode, captureLiveCanvasSnapshot]);

  const handleOpenStoryboard = async (onlySelected = false) => {
    if (!croppedImageSrc) return;
    if (onlySelected && selectedSplitIndices.size === 0) {
      alert("Please select at least one slice in Splits Preview or Grid Cfg.");
      return;
    }
    setIsProcessing(true);
    try {
      const slices = await sliceImage(croppedImageSrc, rowCuts, colCuts, format, {
        origin: numberingOrigin,
        flow: numberingFlow,
        namingStyle,
        lineThickness: sliceLineThickness,
        lineThicknessX: sliceLineThicknessX,
        lineThicknessY: sliceLineThicknessY,
        outerMargin,
        cellPadding: sliceCellPadding,
        gridLabelPreset,
        customGridLabelPrefix,
        renderLabelOnImage: renderGridLabelsOnExport,
      });
      if (slices.length > 0) {
        let chosenSlices = slices;
        if (onlySelected && selectedSplitIndices.size > 0) {
          chosenSlices = slices.filter((_, idx) => selectedSplitIndices.has(idx + 1));
        }
        if (chosenSlices.length > 0) {
          const mappedSlices = chosenSlices.map((slice) => {
            const rawDesignation = slice.designation || slice.name.replace(/\.[^/.]+$/, "");
            return {
              ...slice,
              name: slicePrefix ? `${slicePrefix} ${rawDesignation}` : rawDesignation,
            };
          });

          // Generate snapshot reflecting exact live canvas appearance to copy to Storyboard first
          let liveSnapshotItem: { name: string; url: string } | null = null;
          if (copySnapshotFirst) {
            try {
              const liveSnapshotUrl = await captureLiveCanvasSnapshot();
              if (liveSnapshotUrl) {
                liveSnapshotItem = {
                  name: `Live Canvas Snapshot (${numRows}×${numCols} Grid Overview)`,
                  url: liveSnapshotUrl,
                };
              }
            } catch (snapErr) {
              console.warn("Failed to generate live canvas snapshot:", snapErr);
            }
          }

          const allSlicesToAdd = liveSnapshotItem
            ? [liveSnapshotItem, ...mappedSlices]
            : mappedSlices;

          // 1. Copy to Storyboard Slices asset organizer FIRST
          setStoryboardSlices((prev) => [
            ...(liveSnapshotItem ? [liveSnapshotItem] : []),
            ...mappedSlices,
            ...prev,
          ]);

          // 2. Also populate Storyboard Slots with live canvas snapshot FIRST followed by carved slices
          setStoryboardSlots((prevSlots) => {
            const nextSlots = [...prevSlots];
            let slotIdx = 0;
            allSlicesToAdd.forEach((item) => {
              while (slotIdx < nextSlots.length && nextSlots[slotIdx].url) {
                slotIdx++;
              }
              if (slotIdx < nextSlots.length) {
                nextSlots[slotIdx] = {
                  ...nextSlots[slotIdx],
                  url: item.url,
                  name: item.name,
                };
                slotIdx++;
              } else {
                nextSlots.push({
                  url: item.url,
                  name: item.name,
                  story: item === liveSnapshotItem ? "Live Canvas Appearance Overview" : "",
                });
                slotIdx++;
              }
            });
            return nextSlots;
          });

          setMode("storyboard");
          setSelectedSliceUrls(new Set());
          if (liveSnapshotItem) {
            setCropNotice(
              `✓ Copied snapshot reflecting exact live canvas appearance first + ${mappedSlices.length} carved slice${mappedSlices.length > 1 ? "s" : ""} to Storyboard!`
            );
          } else {
            setCropNotice(
              `✓ Sent ${mappedSlices.length} slice${mappedSlices.length > 1 ? "s" : ""} to Storyboard (${gridLabelPreset})!`
            );
          }
          setTimeout(() => setCropNotice(null), 3500);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadMultipleFilesToStoryboard = useCallback((files: File[]) => {
    if (!files || files.length === 0) return;
    let loadedCount = 0;
    const newSlices: { name: string; url: string }[] = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newSlices.push({
          name: file.name.replace(/\.[^/.]+$/, ""),
          url: reader.result?.toString() || "",
        });
        loadedCount++;
        if (loadedCount === files.length) {
          setStoryboardSlices((prev) => [...prev, ...newSlices]);
          setStoryboardSlots((prevSlots) => {
            const nextSlots = [...prevSlots];
            let slotIdx = 0;
            newSlices.forEach((slice) => {
              while (slotIdx < nextSlots.length && nextSlots[slotIdx].url) {
                slotIdx++;
              }
              if (slotIdx < nextSlots.length) {
                nextSlots[slotIdx] = {
                  ...nextSlots[slotIdx],
                  url: slice.url,
                  name: slice.name,
                };
                slotIdx++;
              } else {
                nextSlots.push({
                  url: slice.url,
                  name: slice.name,
                  story: "",
                });
                slotIdx++;
              }
            });
            return nextSlots;
          });
          if (newSlices.length > 0) {
            setImageSrc((prev) => prev || newSlices[0].url);
            setSlicePrefix((prev) => prev || newSlices[0].name.replace(/[^a-zA-Z0-9_-]/g, "_"));
          }
          setMode("storyboard");
          setIsLoadImageMenuOpen(false);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const onSelectOtherImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      loadMultipleFilesToStoryboard(files);
      e.target.value = "";
    }
  };

  const onUploadToCarvedSlices = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      let loadedCount = 0;
      const newSlices: { name: string; url: string }[] = [];
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          newSlices.push({
            name: file.name.replace(/\.[^/.]+$/, ""),
            url: reader.result?.toString() || "",
          });
          loadedCount++;
          if (loadedCount === files.length) {
            setStoryboardSlices((prev) => [...prev, ...newSlices]);
            setCropNotice(`\u2713 Uploaded ${newSlices.length} image(s) directly to Carved Slices!`);
            setTimeout(() => setCropNotice(null), 3000);
          }
        };
        reader.readAsDataURL(file);
      });
      e.target.value = "";
    }
  };

  // Drag & Selection State for grid handles (Cuts)
  const carveImgRef = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState<{
    type: "row" | "col";
    index: number;
    startClientY?: number;
    startClientX?: number;
    startCutVal?: number;
  } | null>(null);
  const [selectedCutLine, setSelectedCutLine] = useState<{
    type: "row" | "col";
    index: number;
  } | null>(null);

  const updateCutFromPointer = useCallback(
    (
      clientX: number,
      clientY: number,
      drag: {
        type: "row" | "col";
        index: number;
        startClientY?: number;
        startClientX?: number;
        startCutVal?: number;
      },
      isShiftPressed = false
    ) => {
      const img = carveImgRef.current;
      if (!img || carveImageSize.width === 0 || carveImageSize.height === 0) return;
      const rect = img.getBoundingClientRect();
      if (rect.height === 0 || rect.width === 0) return;

      if (drag.type === "row") {
        setRowCuts((prev) => {
          if (drag.index < 0 || drag.index >= prev.length) return prev;
          const minBound = drag.index === 0 ? 3 : prev[drag.index - 1] + 3;
          const maxBound =
            drag.index === prev.length - 1
              ? carveImageSize.height - 3
              : prev[drag.index + 1] - 3;
          if (minBound >= maxBound) return prev;

          let px: number;
          if (
            isShiftPressed &&
            drag.startClientY !== undefined &&
            drag.startCutVal !== undefined
          ) {
            // Fine-grained micro precision mode when Shift is held (0.2x dampening)
            const deltaY = clientY - drag.startClientY;
            const sensitivity = (carveImageSize.height / rect.height) * 0.2;
            px = Math.round(drag.startCutVal + deltaY * sensitivity);
          } else {
            const relY = (clientY - rect.top) / rect.height;
            px = Math.round(Math.max(0, Math.min(1, relY)) * carveImageSize.height);
          }

          const clampedPx = Math.max(minBound, Math.min(maxBound, px));
          if (prev[drag.index] === clampedPx) return prev;
          const next = [...prev];
          next[drag.index] = clampedPx;
          return next;
        });
      } else {
        setColCuts((prev) => {
          if (drag.index < 0 || drag.index >= prev.length) return prev;
          const minBound = drag.index === 0 ? 3 : prev[drag.index - 1] + 3;
          const maxBound =
            drag.index === prev.length - 1
              ? carveImageSize.width - 3
              : prev[drag.index + 1] - 3;
          if (minBound >= maxBound) return prev;

          let px: number;
          if (
            isShiftPressed &&
            drag.startClientX !== undefined &&
            drag.startCutVal !== undefined
          ) {
            // Fine-grained micro precision mode when Shift is held (0.2x dampening)
            const deltaX = clientX - drag.startClientX;
            const sensitivity = (carveImageSize.width / rect.width) * 0.2;
            px = Math.round(drag.startCutVal + deltaX * sensitivity);
          } else {
            const relX = (clientX - rect.left) / rect.width;
            px = Math.round(Math.max(0, Math.min(1, relX)) * carveImageSize.width);
          }

          const clampedPx = Math.max(minBound, Math.min(maxBound, px));
          if (prev[drag.index] === clampedPx) return prev;
          const next = [...prev];
          next[drag.index] = clampedPx;
          return next;
        });
      }
    },
    [carveImageSize]
  );

  const nudgeCut = useCallback(
    (type: "row" | "col", index: number, delta: number) => {
      if (type === "row") {
        setRowCuts((prev) => {
          if (index < 0 || index >= prev.length) return prev;
          const minBound = index === 0 ? 3 : prev[index - 1] + 3;
          const maxBound =
            index === prev.length - 1
              ? carveImageSize.height - 3
              : prev[index + 1] - 3;
          const clampedPx = Math.max(minBound, Math.min(maxBound, prev[index] + delta));
          if (clampedPx === prev[index]) return prev;
          const next = [...prev];
          next[index] = clampedPx;
          return next;
        });
      } else {
        setColCuts((prev) => {
          if (index < 0 || index >= prev.length) return prev;
          const minBound = index === 0 ? 3 : prev[index - 1] + 3;
          const maxBound =
            index === prev.length - 1
              ? carveImageSize.width - 3
              : prev[index + 1] - 3;
          const clampedPx = Math.max(minBound, Math.min(maxBound, prev[index] + delta));
          if (clampedPx === prev[index]) return prev;
          const next = [...prev];
          next[index] = clampedPx;
          return next;
        });
      }
    },
    [carveImageSize]
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      e.preventDefault();
      updateCutFromPointer(e.clientX, e.clientY, dragging, e.shiftKey);
    };
    const onUp = () => setDragging(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragging, updateCutFromPointer]);

  // Keyboard navigation for active cut line (Arrow keys for 1px nudging, Shift+Arrow for 5px)
  useEffect(() => {
    if (!selectedCutLine || !isAdjusting || mode !== "carve") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA"
      )
        return;
      const step = e.shiftKey ? 5 : 1;
      if (selectedCutLine.type === "row") {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          nudgeCut("row", selectedCutLine.index, -step);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          nudgeCut("row", selectedCutLine.index, step);
        } else if (e.key === "Escape") {
          setSelectedCutLine(null);
        }
      } else {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          nudgeCut("col", selectedCutLine.index, -step);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          nudgeCut("col", selectedCutLine.index, step);
        } else if (e.key === "Escape") {
          setSelectedCutLine(null);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedCutLine, isAdjusting, mode, nudgeCut]);

  // Map cell coordinates (r, c) to slice sequence index 1..N based on origin and flow
  const getSliceNumberMap = (
    totalRows: number,
    totalCols: number,
    origin: NumberingOrigin,
    flow: NumberingFlow
  ): Map<string, number> => {
    const map = new Map<string, number>();

    const isBottomStart = origin === "bottom-left" || origin === "bottom-right";
    const rowIndices: number[] = [];
    if (isBottomStart) {
      for (let r = totalRows - 1; r >= 0; r--) rowIndices.push(r);
    } else {
      for (let r = 0; r < totalRows; r++) rowIndices.push(r);
    }

    const isRightStart = origin === "top-right" || origin === "bottom-right";
    const colIndices: number[] = [];
    if (isRightStart) {
      for (let c = totalCols - 1; c >= 0; c--) colIndices.push(c);
    } else {
      for (let c = 0; c < totalCols; c++) colIndices.push(c);
    }

    let seq = 1;
    if (flow === "horizontal") {
      for (const r of rowIndices) {
        for (const c of colIndices) {
          map.set(`${r}-${c}`, seq++);
        }
      }
    } else {
      for (const c of colIndices) {
        for (const r of rowIndices) {
          map.set(`${r}-${c}`, seq++);
        }
      }
    }

    return map;
  };

  const handleSetDefaultGrid = useCallback((r?: number, c?: number) => {
    const rows = Math.max(1, Math.min(20, r ?? numRows));
    const cols = Math.max(1, Math.min(20, c ?? numCols));
    setDefaultNumRows(rows);
    setDefaultNumCols(cols);
    try {
      remoteStore.setItem("default_slice_rows", String(rows));
      remoteStore.setItem("default_slice_cols", String(cols));
    } catch (e) {
      console.warn("Failed to write default slice grid to the database-backed store", e);
    }
    setCropNotice(`\u2713 Default slice grid set to ${rows}\u00d7${cols}`);
    setTimeout(() => setCropNotice(null), 3000);
  }, [numRows, numCols]);

  const handleReset = async () => {
    await clearAllStoredState();
    resetToFactoryDefaults();
    const userDefinedImg = await getUserDefinedMasterImage();
    const activeMaster = userDefinedImg || DEFAULT_FRONT_PAGE_IMAGE;
    setImageSrc(activeMaster);
    setOriginalImageSrc(activeMaster);
    setUserDefault3x3Image(activeMaster);
    setOriginalSpreadImage(activeMaster);
    handleSplitImageToNBoxes(activeMaster, 16);
    setFrontPageGridMode("4x4");
    setCrop(undefined);
    setCompletedPercentCrop(null);
    setCroppedImageSrc("");
    setIsAdjusting(true);
    setNumRows(defaultNumRows);
    setNumCols(defaultNumCols);
    setRowCuts([]);
    setColCuts([]);
    setCarveImageSize({ width: 0, height: 0 });
    setSlicePrefix("");
    setStoryboardSlices([]);
    setSelectedSliceUrls(new Set());
    setStoryboardSlots(
      Array.from({ length: 16 }, () => ({ url: null, name: "", story: "" }))
    );
    setScreenplaySlides([]);
    setActiveScreenplaySlideId("");
    setMode("crop");

    // Restore Define Canvas & Crop persistent default setup across resets
    try {
      const def = getLoadedCropDefaultSetup();
      setCropPanelsOrder([...def.panelsOrder]);
      setCropQuickToolsOrder([...def.quickToolsOrder]);
      setCropSbFrameOrder([...def.sbFrameOrder]);
      setCropAspectOrder([...def.aspectOrder]);
      setCropPrimaryOrder([...def.primaryOrder]);
      setCropUtilityOrder([...def.utilityOrder]);
      setCropShapeStudioOrder([...def.shapeStudioOrder]);
      setCropMultiCropBatchOrder([...def.multiCropBatchOrder]);
      if (def.aspect === "circle" || def.aspect === "oval" || typeof def.aspect === "number" || def.aspect === undefined) {
        handleSetAspect(def.aspect);
      }
      if (typeof def.isCircularCrop === "boolean") setIsCircularCrop(def.isCircularCrop);
      if (typeof def.meshSquareSize === "number") setMeshSquareSize(def.meshSquareSize);
      if (def.meshMode === "uniform" || def.meshMode === "freestyle") setMeshMode(def.meshMode);
      if (def.meshGridLineColor) setMeshGridLineColor(def.meshGridLineColor);
      if (typeof def.meshGridLineWidth === "number") setMeshGridLineWidth(def.meshGridLineWidth);
      if (typeof def.meshAutoGotoAfterCut === "boolean") setMeshAutoGotoAfterCut(def.meshAutoGotoAfterCut);
      if (def.meshDestination) setMeshDestination(def.meshDestination);
    } catch {}
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      setCompletedPercentCrop(null);
      const file = e.target.files[0];
      const dotIndex = file.name.lastIndexOf(".");
      const fileNameWithoutExtension =
        dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
      const sanitizedPrefix = fileNameWithoutExtension.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );
      setSlicePrefix(sanitizedPrefix);
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const result = reader.result?.toString() || "";
        setImageSrc(result);
        setOriginalImageSrc(result);
      });
      reader.readAsDataURL(file);
      setMode("crop");
      setCroppedImageSrc("");
    }
  };

  // Generate cropped image when switching to carve mode
  useEffect(() => {
    if (mode === "carve" && imageSrc) {
      const targetCrop = completedPercentCrop || crop || completedPixelCrop;
      if (
        targetCrop &&
        targetCrop.width &&
        targetCrop.height &&
        targetCrop.width > 0 &&
        targetCrop.height > 0
      ) {
        getCroppedImg(imageSrc, targetCrop, format, imgRef.current)
          .then((url) => {
            if (url && url !== imageSrc) {
              if (!originalImageSrc) {
                setOriginalImageSrc(imageSrc);
              }
              setCroppedImageSrc(url);
            } else {
              setCroppedImageSrc(imageSrc);
            }
          })
          .catch((err) => {
            console.error("Cropping failed:", err);
            setCroppedImageSrc(imageSrc);
          });
      } else {
        setCroppedImageSrc(imageSrc);
      }
      setIsAdjusting(true);
    }
  }, [mode, imageSrc, completedPercentCrop, crop, completedPixelCrop, format, originalImageSrc]);

  // Initialize cuts when numRows/numCols or image size changes
  useEffect(() => {
    if (carveImageSize.width > 0 && carveImageSize.height > 0) {
      setRowCuts((prev) => {
        const newCuts = Array.from(
          { length: Math.max(0, numRows - 1) },
          (_, i) => {
            return prev[i] !== undefined
              ? prev[i]
              : Math.round(((i + 1) * carveImageSize.height) / numRows);
          }
        );
        return newCuts;
      });
      setColCuts((prev) => {
        const newCuts = Array.from(
          { length: Math.max(0, numCols - 1) },
          (_, i) => {
            return prev[i] !== undefined
              ? prev[i]
              : Math.round(((i + 1) * carveImageSize.width) / numCols);
          }
        );
        return newCuts;
      });
    }
  }, [numRows, numCols, carveImageSize]);

  const handleDownload = async (onlySelected = false) => {
    if (!croppedImageSrc) return;
    if (onlySelected && selectedSplitIndices.size === 0) {
      alert("Please select at least one slice to download.");
      return;
    }
    setIsProcessing(true);
    try {
      const rawSlices = await sliceImage(croppedImageSrc, rowCuts, colCuts, format, {
        origin: numberingOrigin,
        flow: numberingFlow,
        namingStyle,
        lineThickness: sliceLineThickness,
        lineThicknessX: sliceLineThicknessX,
        lineThicknessY: sliceLineThicknessY,
        outerMargin,
        cellPadding: sliceCellPadding,
        gridLabelPreset,
        customGridLabelPrefix,
        renderLabelOnImage: renderGridLabelsOnExport,
      });

      let slicesWithIdx = rawSlices.map((slice, originalIdx) => ({
        ...slice,
        originalIdx,
      }));

      if (onlySelected && selectedSplitIndices.size > 0) {
        slicesWithIdx = slicesWithIdx.filter((s) => selectedSplitIndices.has(s.originalIdx + 1));
      }
      if (slicesWithIdx.length === 0) return;

      const slotNameMap = new Map(
        storyboardSlots
          .filter((s) => s.url && s.name && s.name.trim())
          .map((s) => [s.url!, s.name.trim()])
      );
      const sliceNameMap = new Map(storyboardSlices.map((s) => [s.url, s.name]));

      if (slicesWithIdx.length === 1) {
        const item = slicesWithIdx[0];
        const slotCustomName =
          slotNameMap.get(item.url) ||
          (storyboardSlots[item.originalIdx]?.name && storyboardSlots[item.originalIdx].name.trim());
        const sliceCustomName =
          sliceNameMap.get(item.url) ||
          (storyboardSlices[item.originalIdx]?.name && storyboardSlices[item.originalIdx].name.trim());

        const customName = slotCustomName || sliceCustomName;
        const matchingName = customName || item.name;
        const nameWithPrefix = getFormattedFilename(
          matchingName,
          item.originalIdx,
          format,
          customName ? "" : slicePrefix
        );

        const blob = safeDataUrlToBlob(item.url, format);
        downloadBlob(blob, nameWithPrefix);
      } else {
        const zip = new JSZip();
        const usedNames = new Set<string>();

        slicesWithIdx.forEach((sliceItem) => {
          const base64Data = dataUrlToBase64(sliceItem.url);
          const slotCustomName =
            slotNameMap.get(sliceItem.url) ||
            (storyboardSlots[sliceItem.originalIdx]?.name && storyboardSlots[sliceItem.originalIdx].name.trim());
          const sliceCustomName =
            sliceNameMap.get(sliceItem.url) ||
            (storyboardSlices[sliceItem.originalIdx]?.name && storyboardSlices[sliceItem.originalIdx].name.trim());

          const customName = slotCustomName || sliceCustomName;
          const matchingName = customName || sliceItem.name;

          let filename = getFormattedFilename(
            matchingName,
            sliceItem.originalIdx,
            format,
            customName ? "" : slicePrefix
          );

          let counter = 1;
          while (usedNames.has(filename)) {
            const dotIdx = filename.lastIndexOf(".");
            if (dotIdx > 0) {
              const base = filename.slice(0, dotIdx);
              const extStr = filename.slice(dotIdx);
              filename = `${base}_${counter}${extStr}`;
            } else {
              filename = `${filename}_${counter}`;
            }
            counter++;
          }
          usedNames.add(filename);
          zip.file(filename, base64Data, { base64: true });
        });

        const content = await zip.generateAsync({ type: "blob" });
        const defaultZipName = slicePrefix
          ? `${slicePrefix}-carved-slices.zip`
          : "carved-slices.zip";

        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        const hhmm = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
        const fullStamp = `${today}_${hhmm}`;
        const rawPrefix = slicePrefix ? slicePrefix : "carved";

        const cleanSliceNames = slicesWithIdx
          .map((sliceItem) => {
            const slotCustomName =
              slotNameMap.get(sliceItem.url) ||
              (storyboardSlots[sliceItem.originalIdx]?.name && storyboardSlots[sliceItem.originalIdx].name.trim());
            const sliceCustomName =
              sliceNameMap.get(sliceItem.url) ||
              (storyboardSlices[sliceItem.originalIdx]?.name && storyboardSlices[sliceItem.originalIdx].name.trim());
            const customName = slotCustomName || sliceCustomName;
            const matchingName = customName || sliceItem.name;
            return (matchingName || "")
              .trim()
              .replace(/[/\\?%*:|"<>]/g, "")
              .replace(/\s+/g, "-");
          })
          .filter((n) => n.length > 0);

        const uniqueSliceNames = Array.from(new Set(cleanSliceNames));
        const firstName = uniqueSliceNames[0] || "slice";
        const lastName = uniqueSliceNames[uniqueSliceNames.length - 1] || "slice";
        const secondName = uniqueSliceNames[1];

        const sliceBasedSuggestions: string[] = [];

        if (uniqueSliceNames.length > 0) {
          sliceBasedSuggestions.push(`${firstName}-${today}.zip`);
          if (uniqueSliceNames.length > 1 && firstName !== lastName) {
            sliceBasedSuggestions.push(`${firstName}-to-${lastName}.zip`);
          }
          if (secondName) {
            sliceBasedSuggestions.push(`${firstName}_${secondName}.zip`);
          }
          sliceBasedSuggestions.push(`${firstName}-${slicesWithIdx.length}-slices.zip`);
          sliceBasedSuggestions.push(`${firstName}_${fullStamp}.zip`);
        }

        const suggestions = [
          defaultZipName,
          ...sliceBasedSuggestions,
          `${rawPrefix}-${today}.zip`,
          `${rawPrefix}-${fullStamp}.zip`,
          `${rawPrefix}-slices-${slicesWithIdx.length}-items.zip`,
          `${today}.zip`,
          `${fullStamp}.zip`,
        ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

        setZipModalConfig({
          isOpen: true,
          defaultName: defaultZipName,
          suggestions,
          itemCount: slicesWithIdx.length,
          title: "Name Carved Slices ZIP Archive",
          onConfirm: async (finalZipName, browseFolder) => {
            if (browseFolder) {
              await saveZipToFolder(content, finalZipName);
            } else {
              downloadBlob(content, finalZipName);
            }
          },
        });
      }
    } catch (e) {
      console.error(e);
      alert("Failed to download slices. See console for details.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderUniversalItemInner = (id: string, placement: "top" | "bottom" = "top") => {
    const isFrontPage = !imageSrc && mode !== "storyboard";
    switch (id) {
      case "logo":
        return (
          <CustomizableLogo
            disableGlow={isFrontPage}
            onClick={() => {
              setImageSrc(null);
              setMode("crop");
            }}
          />
        );

      case "rotation":
        const rotationWidthClass =
          rotationModalSize === "sm"
            ? "w-[17rem]"
            : rotationModalSize === "md"
            ? "w-[24rem]"
            : rotationModalSize === "xl"
            ? "w-[40rem]"
            : "w-[32rem]"; // default lg

        return (
          <div className="relative shrink-0" ref={headerRotationPresetsMenuRef}>
            <CustomizableButton
              buttonId={placement === "bottom" ? "front_page_ad_global_rotation" : "header_rotation_controls"}
              defaultLabel=""
              defaultIcon={<RotateCw className="w-4 h-4 text-purple-300" />}
              forceZeroText={true}
              badge={
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform text-purple-300",
                    isRotationAndPresetsMenuOpen && "rotate-180"
                  )}
                />
              }
              onClick={() => setIsRotationAndPresetsMenuOpen((prev) => !prev)}
              className={cn(
                placement === "bottom"
                  ? "h-9 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border shadow-xs"
                  : "p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border shadow-sm",
                isRotationAndPresetsMenuOpen
                  ? "bg-purple-500 text-white border-purple-400"
                  : placement === "bottom"
                  ? "bg-[#221235] hover:bg-[#2c1745] text-purple-300 border-purple-500/60 hover:border-purple-400"
                  : "bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border-purple-500/40 hover:border-purple-400"
              )}
              title="Global Rotation Controls & Sample Presets"
            />

            {isRotationAndPresetsMenuOpen && (
              <div
                className={cn(
                  "absolute left-0 max-h-[75vh] overflow-y-auto pr-0.5 bg-[#090e1a]/98 border border-purple-500/30 rounded-xl shadow-2xl p-2.5 z-50 flex flex-col gap-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150",
                  placement === "bottom" ? "bottom-full mb-1.5" : "top-full mt-1",
                  rotationWidthClass
                )}
              >
                {/* Header with Editable Title and Size Options */}
                <div className="px-1 py-1 text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-purple-500/20 flex items-center justify-between">
                  <CustomizableLabel
                    as="span"
                    labelId="header_rotation_dropdown_title"
                    defaultLabel=""
                    defaultIcon={<RotateCw className="w-3.5 h-3.5 text-purple-400" />}
                    className="text-purple-300"
                  />
                  {/* Size Toggle Buttons */}
                  <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-purple-500/20">
                    <span className="text-[9px] text-slate-500 font-mono px-1">{uiText("app.span.size", "Size:")}</span>
                    {(["sm", "md", "lg", "xl"] as const).map((sz) => (
                      <CustomizableButton
                        buttonId="app_btn_123"
                        key={sz}
type="button"
onClick={() => {
                          setRotationModalSize(sz);
                          try {
                            remoteStore.setItem("seqcarver_rotation_panel_size", sz);
                          } catch (e) {}
                        }}
className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all cursor-pointer",
                          rotationModalSize === sz
                            ? "bg-purple-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200 hover:bg-purple-950/40"
                        )}
title={`Switch to ${sz.toUpperCase()} size (${sz === "lg" ? "Default" : sz})`}
                      >
                          {() => (
                              <>
                                {sz}
                              </>
                            )}
                      </CustomizableButton>
                    ))}
                    <CustomizableButton
                      buttonId="app_btn_122"
                      defaultIcon={<X className="w-3 h-3" />}
                      type="button"
onClick={() => setIsRotationAndPresetsMenuOpen(false)}
className="ml-1 p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
title={uiText("app.button.close.title", "Close")}
                    />
                  </div>
                </div>

                {/* Global Rotation Controls Panel */}
                <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-[#020617] border border-purple-500/20 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                      <RotateCw className="w-3 h-3 text-purple-400" />
                      <span>{uiText("app.span.rotation_engine", "Rotation Engine")}</span>
                    </span>
                    <span className="text-[9px] text-purple-400 font-mono">
                      {Object.values(boxRotationActive).filter(Boolean).length} / 9 Active
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <CustomizableButton
                      buttonId="app_btn_121"
                      defaultIcon={<Pause className="w-2.5 h-2.5 fill-current" />}
                      type="button"
onClick={() => setBoxRotationActive(prev => { const next = {...prev}; for (let i=1;i<=9;i++) next[i] = false; return next; })}
className="flex-1 bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 border border-rose-500/40 py-1 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                        {() => (
                            <>
                              {uiText("app.button.stop_all", " Stop All")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="app_btn_120"
                      defaultIcon={<Play className="w-2.5 h-2.5 fill-current" />}
                      type="button"
onClick={() => setBoxRotationActive(prev => { const next = {...prev}; for (let i=1;i<=9;i++) next[i] = true; return next; })}
className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 py-1 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                        {() => (
                            <>
                              {uiText("app.button.start_all", " Start All")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="app_btn_119"
                      defaultIcon={<Trash2 className="w-2.5 h-2.5" />}
                      type="button"
onClick={() => {
                        setBoxRotationSeries(prev => { const next = {...prev}; for (let i=1;i<=9;i++) next[i] = []; return next; });
                        setBoxRotationActive(prev => { const next = {...prev}; for (let i=1;i<=9;i++) next[i] = false; return next; });
                      }}
className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-1 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                        {() => (
                            <>
                              {uiText("app.button.clear_all", " Clear All")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>

                  {/* Series Rotation Shortcuts for Box 1 & Box 9 */}
                  <div className="grid grid-cols-2 gap-1 pt-1 border-t border-[#1e293b]/60">
                    <CustomizableButton
                      buttonId="app_btn_118"
                      defaultIcon={<RotateCw className="w-2.5 h-2.5" />}
                      type="button"
onClick={() => setRotationModalBoxId(1)}
className="bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 py-1 px-1.5 rounded-md text-[9.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                        {() => (
                            <>
                              <span>{uiText("app.span.box_1_series", "Box 1 Series (")}{boxRotationSeries[1]?.length || 0})</span>
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="app_btn_117"
                      defaultIcon={<RotateCw className="w-2.5 h-2.5" />}
                      type="button"
onClick={() => setRotationModalBoxId(9)}
className="bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 py-1 px-1.5 rounded-md text-[9.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                        {() => (
                            <>
                              <span>{uiText("app.span.box_9_series", "Box 9 Series (")}{boxRotationSeries[9]?.length || 0})</span>
                            </>
                          )}
                    </CustomizableButton>
                  </div>

                  {/* 9-Box State Section */}
                  <div className="flex items-center justify-between text-[9px] bg-slate-900/80 px-2 py-1 rounded-md border border-slate-800/80 mt-0.5">
                    <span className="font-semibold text-slate-400">{uiText("app.span.9_box_pattern", "9-Box Pattern:")}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8.5px] text-purple-300 font-mono font-medium">
                        {Object.keys(defaultBoxImages).length === 9 ? "Custom Overrides" : "Eurospect 3x3 Default"}
                      </span>
                      <CustomizableButton
                        buttonId="app_btn_116"
                        type="button"
onClick={handleReset9BoxDefault}
className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-bold cursor-pointer transition-colors",
                          Object.keys(defaultBoxImages).length === 9
                            ? "bg-amber-600 hover:bg-amber-500 text-white font-black shadow-xs"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        )}
title={uiText("app.button.reset_3x3_panel_to_default_eurospect_layout.title", "Reset 3x3 panel to default Eurospect layout")}
                      >
                          {() => (
                              <>
                                {uiText("app.button.reset", "Reset")}
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  </div>
                </div>

                {/* Sample Presets Panel */}
                <div className="flex flex-col gap-1 pt-1 border-t border-[#1e293b]/60">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{uiText("app.span.sample_presets", "Sample Presets:")}</span>
                    <span className="text-[8px] text-slate-500 font-mono">{uiText("app.span.1_click_load", "1-Click Load")}</span>
                  </div>
                  <div className={cn("grid gap-1", rotationModalSize === "sm" ? "grid-cols-2" : "grid-cols-4")}>
                    <CustomizableButton
                      buttonId="app_btn_115"
                      type="button"
onClick={() => handleLoadImageFromUrl(eurospectImg, "Eurospect")}
className="flex items-center gap-1.5 p-1 bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] hover:border-indigo-500/40 rounded-lg transition-all cursor-pointer group"
                    >
                        {() => (
                            <>
                              <img src={eurospectImg} alt={uiText("app.img.eurospect.alt", "Eurospect")} className="w-5 h-5 object-cover rounded border border-slate-700 shrink-0 group-hover:scale-105 transition-transform" />
                            <span className="text-[9px] font-semibold text-slate-200 group-hover:text-indigo-300 truncate">{uiText("app.span.eurospect", "Eurospect")}</span>
                            </>
                          )}
                    </CustomizableButton>

                    <CustomizableButton
                      buttonId="app_btn_114"
                      type="button"
onClick={() => handleLoadImageFromUrl("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80", "Cyberpunk")}
className="flex items-center gap-1.5 p-1 bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] hover:border-cyan-500/40 rounded-lg transition-all cursor-pointer group"
                    >
                        {() => (
                            <>
                              <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80" alt={uiText("app.img.cyberpunk.alt", "Cyberpunk")} className="w-5 h-5 object-cover rounded border border-slate-700 shrink-0 group-hover:scale-105 transition-transform" />
                            <span className="text-[9px] font-semibold text-slate-200 group-hover:text-cyan-300 truncate">{uiText("app.span.cyberpunk", "Cyberpunk")}</span>
                            </>
                          )}
                    </CustomizableButton>

                    <CustomizableButton
                      buttonId="app_btn_113"
                      type="button"
onClick={() => handleLoadImageFromUrl("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80", "Comic Art")}
className="flex items-center gap-1.5 p-1 bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] hover:border-purple-500/40 rounded-lg transition-all cursor-pointer group"
                    >
                        {() => (
                            <>
                              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80" alt={uiText("app.img.comic_art.alt", "Comic Art")} className="w-5 h-5 object-cover rounded border border-slate-700 shrink-0 group-hover:scale-105 transition-transform" />
                            <span className="text-[9px] font-semibold text-slate-200 group-hover:text-purple-300 truncate">{uiText("app.span.comic_art", "Comic Art")}</span>
                            </>
                          )}
                    </CustomizableButton>

                    <CustomizableButton
                      buttonId="app_btn_112"
                      type="button"
onClick={() => handleLoadImageFromUrl("https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80", "Neon Grid")}
className="flex items-center gap-1.5 p-1 bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] hover:border-emerald-500/40 rounded-lg transition-all cursor-pointer group"
                    >
                        {() => (
                            <>
                              <img src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80" alt={uiText("app.img.neon_grid.alt", "Neon Grid")} className="w-5 h-5 object-cover rounded border border-slate-700 shrink-0 group-hover:scale-105 transition-transform" />
                            <span className="text-[9px] font-semibold text-slate-200 group-hover:text-emerald-300 truncate">{uiText("app.span.neon_grid", "Neon Grid")}</span>
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "upload":
        const loadImageWidthClass =
          loadImageModalSize === "sm"
            ? "w-[17rem]"
            : loadImageModalSize === "md"
            ? "w-[24rem]"
            : loadImageModalSize === "xl"
            ? "w-[40rem]"
            : "w-[32rem]"; // default lg

        return (
          <div className="relative shrink-0" ref={headerLoadMenuRef}>
            <CustomizableButton
              buttonId="header_upload_main"
              defaultLabel=""
              defaultIcon={<Upload className="w-4 h-4" />}
              forceZeroText={true}
              lockIconOnly={isFrontPage}
              disableGlow={isFrontPage}
              badge={<ChevronDown className={cn("w-3 h-3 transition-transform", isLoadImageMenuOpen && "rotate-180")} />}
              onClick={() => setIsLoadImageMenuOpen((prev) => !prev)}
              className={cn(
                "h-9 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border shadow-none",
                isLoadImageMenuOpen
                  ? "bg-[#0d2620] text-[#10b981] border-[#10b981]/70"
                  : "bg-[#080d1a] hover:bg-[#0f172a] text-[#10b981] border-[#10b981]/35 hover:border-[#10b981]/60"
              )}
              title="Load Images into Carver, Panels or Storyboard"
            />

            {isLoadImageMenuOpen && (
              <div
                className={cn(
                  "absolute left-0 top-full mt-1 max-h-[75vh] overflow-y-auto pr-0.5 bg-[#090e1a]/98 border border-emerald-500/30 rounded-xl shadow-2xl p-2.5 z-50 flex flex-col gap-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150",
                  loadImageWidthClass
                )}
              >
                {/* Header with Editable Title and Size Options */}
                <div className="px-1 py-1 text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-emerald-500/20 flex items-center justify-between">
                  <CustomizableLabel
                    as="span"
                    labelId="header_load_dropdown_title"
                    defaultLabel=""
                    defaultIcon={<ImageIcon className="w-3.5 h-3.5 text-[#10b981]" />}
                    className="text-emerald-400"
                  />
                  {/* Size Toggle Buttons */}
                  <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-emerald-500/20">
                    <span className="text-[9px] text-slate-500 font-mono px-1">{uiText("app.span.size_2", "Size:")}</span>
                    {(["sm", "md", "lg", "xl"] as const).map((sz) => (
                      <CustomizableButton
                        buttonId="app_btn_111"
                        key={sz}
type="button"
onClick={() => {
                          setLoadImageModalSize(sz);
                          try {
                            remoteStore.setItem("seqcarver_load_image_panel_size", sz);
                          } catch (e) {}
                        }}
className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all cursor-pointer",
                          loadImageModalSize === sz
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200 hover:bg-emerald-950/40"
                        )}
title={`Switch to ${sz.toUpperCase()} size (${sz === "lg" ? "Default" : sz})`}
                      >
                          {() => (
                              <>
                                {sz}
                              </>
                            )}
                      </CustomizableButton>
                    ))}
                    <CustomizableButton
                      buttonId="app_btn_110"
                      defaultIcon={<X className="w-3 h-3" />}
                      type="button"
onClick={() => setIsLoadImageMenuOpen(false)}
className="ml-1 p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
title={uiText("app.button.close.title_2", "Close")}
                    />
                  </div>
                </div>

                {/* Top Upload Buttons Panel */}
                <div className="grid grid-cols-2 gap-1.5">
                  <CustomizableButton
                    buttonId="load_img_upload_local"
                    defaultLabel="Upload Local"
                    defaultIcon={<Upload className="w-3.5 h-3.5 text-[#10b981] shrink-0" />}
                    as="label"
                    className="bg-[#10b981]/15 hover:bg-[#10b981]/25 text-[#10b981] border border-[#10b981]/40 hover:border-[#10b981] py-1.5 px-2 rounded-lg text-[9.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm"
                  >
                    <input type="file" accept="image/*" onChange={handleHeaderFileUpload} className="hidden" />
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="load_img_multi_upload"
                    defaultLabel="Multi Upload"
                    defaultIcon={<ImagePlus className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    as="label"
                    className="bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/40 hover:border-blue-500 py-1.5 px-2 rounded-lg text-[9.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm"
                  >
                    <input type="file" accept="image/*" multiple onChange={onSelectOtherImages} className="hidden" />
                  </CustomizableButton>
                </div>

                {/* Grid for Target & JSON/PDF in Large & XL mode */}
                <div className={cn("grid gap-2", (loadImageModalSize === "lg" || loadImageModalSize === "xl") ? "grid-cols-2" : "grid-cols-1")}>
                  {/* Target Destination Selector */}
                  <div className="flex flex-col gap-1 bg-[#020617] p-1.5 rounded-lg border border-[#1e293b]">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">{uiText("app.span.load_target", "Load Target:")}</span>
                      {frontPageGridMode === "4x4" ? (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 rounded flex items-center gap-1 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {uiText("app.span.auto_detected_4_4", "Auto-detected: 4×4")}
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 text-slate-400 bg-slate-900 border border-slate-700/60 rounded">
                          {uiText("app.span.auto_detected_3_3", "Auto-detected: 3×3")}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <CustomizableButton
                        buttonId="load_target_carver"
                        defaultLabel="Carver Canvas"
                        defaultIcon={<CropIcon className="w-2.5 h-2.5 shrink-0" />}
                        onClick={() => setLoadImageTarget("carver")}
                        className={cn(
                          "py-1 px-1 rounded-md text-[8.5px] font-bold transition-all text-center cursor-pointer border",
                          loadImageTarget === "carver"
                            ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/60 shadow-sm"
                            : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200"
                        )}
                      />
                      <CustomizableButton
                        buttonId="load_target_single_box"
                        defaultLabel="Single Box"
                        defaultIcon={<Square className="w-2.5 h-2.5 shrink-0" />}
                        onClick={() => setLoadImageTarget("box")}
                        className={cn(
                          "py-1 px-1 rounded-md text-[8.5px] font-bold transition-all text-center cursor-pointer border",
                          loadImageTarget === "box"
                            ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/60 shadow-sm"
                            : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200"
                        )}
                      />
                      <CustomizableButton
                        buttonId="load_target_spread_3x3"
                        defaultLabel="Spread 3x3"
                        defaultIcon={<Grid3x3 className="w-2.5 h-2.5 shrink-0" />}
                        onClick={() => {
                          setLoadImageTarget("spread");
                          setFrontPageGridMode("3x3");
                          try {
                            remoteStore.setItem("seqcarver_frontPageGridMode", "3x3");
                          } catch {}
                        }}
                        className={cn(
                          "py-1 px-1 rounded-md text-[8.5px] font-bold transition-all text-center cursor-pointer border flex items-center justify-center gap-1",
                          loadImageTarget === "spread"
                            ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/60 shadow-sm"
                            : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200"
                        )}
                      />
                      <CustomizableButton
                        buttonId="load_target_spread_4x4"
                        defaultLabel={frontPageGridMode === "4x4" ? "Spread 4x4 (Auto)" : "Spread 4x4"}
                        defaultIcon={<LayoutGrid className="w-2.5 h-2.5 shrink-0" />}
                        onClick={() => {
                          setLoadImageTarget("spread_4x4");
                          setFrontPageGridMode("4x4");
                          try {
                            remoteStore.setItem("seqcarver_frontPageGridMode", "4x4");
                          } catch {}
                        }}
                        className={cn(
                          "py-1 px-1 rounded-md text-[8.5px] font-bold transition-all text-center cursor-pointer border flex items-center justify-center gap-1",
                          loadImageTarget === "spread_4x4"
                            ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/60 shadow-sm ring-1 ring-[#10b981]/50"
                            : frontPageGridMode === "4x4"
                            ? "bg-emerald-950/30 text-emerald-400 border-emerald-800/60 hover:text-emerald-300"
                            : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200"
                        )}
                      />
                      <CustomizableButton
                        buttonId="load_target_storyboard"
                        defaultLabel="Storyboard"
                        defaultIcon={<Layers className="w-2.5 h-2.5 shrink-0" />}
                        onClick={() => setLoadImageTarget("storyboard")}
                        className={cn(
                          "col-span-2 py-1 px-1 rounded-md text-[8.5px] font-bold transition-all text-center cursor-pointer border",
                          loadImageTarget === "storyboard"
                            ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/60 shadow-sm"
                            : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200"
                        )}
                      />
                    </div>

                    {loadImageTarget === "box" && (
                      <div className="flex items-center justify-between gap-1 mt-1 pt-1 border-t border-[#1e293b] px-0.5">
                        <span className="text-[8.5px] font-semibold text-slate-400">{uiText("app.span.target_box", "Target Box:")}</span>
                        <select
                          value={selectedBoxTarget}
                          onChange={(e) => setSelectedBoxTarget(Number(e.target.value))}
                          className="bg-[#0f172a] text-[#10b981] font-bold text-[9px] border border-[#1e293b] rounded px-1.5 py-0.5 outline-none cursor-pointer"
                        >
                          {(frontPageGridMode === "4x4"
                            ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
                            : [1, 2, 3, 4, 5, 6, 7, 8, 9]
                          ).map((b) => (
                            <option key={b} value={b}>
                              {uiText("app.option.box", "Box ")}{b}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Disable 9-Box Actions Toggle */}
                    <div className="flex items-center justify-between p-1 rounded bg-[#090e1a] border border-[#1e293b]/70 mt-1">
                      <span className="text-[8.5px] font-bold text-slate-300 flex items-center gap-1">
                        <EyeOff className="w-2.5 h-2.5 text-[#10b981]" />
                        <span>{uiText("app.span.hide_badges", "Hide Badges")}</span>
                      </span>
                      <CustomizableButton
                        buttonId="app_btn_109"
                        type="button"
onClick={() => setDisableBoxActions((prev) => !prev)}
className={cn(
                          "relative inline-flex h-3.5 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          disableBoxActions ? "bg-[#10b981]" : "bg-slate-700"
                        )}
title={uiText("app.button.toggle_hover_actions.title", "Toggle hover actions")}
                      >
                          {() => (
                              <>
                                <span
                          className={cn(
                            "pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            disableBoxActions ? "translate-x-3.5" : "translate-x-0"
                          )}
                        />
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  </div>

                  {/* Storyboard JSON Import & Export with File Naming */}
                  <div className="flex flex-col gap-1 bg-[#020617] p-1.5 rounded-lg border border-[#1e293b]">
                    <span className="text-[8.5px] font-bold text-emerald-400 uppercase tracking-wider px-0.5">
                      {uiText("app.span.json_and_pdf_tools", "JSON & PDF Tools")}
                    </span>

                    <div className="grid grid-cols-1 gap-1">
                      <CustomizableButton
                        buttonId="load_img_import_json"
                        defaultLabel="Import Storyboard JSON"
                        defaultIcon={<Upload className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />}
                        as="label"
                        className="flex items-center justify-between gap-1 p-1.5 rounded-md bg-[#090e1a] hover:bg-[#0f172a] border border-[#1e293b] hover:border-emerald-500/50 text-slate-200 transition-all cursor-pointer shadow-sm group"
                        title="Import Storyboard JSON file"
                      >
                        <span className="text-[7.5px] text-slate-500 font-mono ml-auto">{uiText("app.span.json", ".json")}</span>
                        <input
                          type="file"
                          accept=".json,application/json"
                          onChange={(e) => {
                            setIsLoadImageMenuOpen(false);
                            handleImportStoryboard(e);
                          }}
                          className="hidden"
                        />
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="load_img_export_json"
                        defaultLabel="Export storyboard json"
                        defaultIcon={<Download className="w-2.5 h-2.5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />}
                        onClick={() => {
                          setIsLoadImageMenuOpen(false);
                          handleExportStoryboard();
                        }}
                        className="flex items-center justify-between gap-1 p-1 rounded-md bg-[#090e1a] hover:bg-[#0f172a] border border-[#1e293b] hover:border-emerald-500/50 text-slate-200 transition-all cursor-pointer shadow-sm group text-[8px]"
                        title="Export storyboard json (choose file name)"
                      >
                        <span className="text-[7px] text-emerald-400 font-mono font-bold ml-auto">{uiText("app.span.custom_name", "Custom name")}</span>
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="load_img_save_pdf"
                        defaultLabel="Save storyboard pdf"
                        defaultIcon={<FileText className="w-2.5 h-2.5 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />}
                        onClick={() => {
                          setIsLoadImageMenuOpen(false);
                          handleExportStoryboardPDF();
                        }}
                        className="flex items-center justify-between gap-1 p-1 rounded-md bg-[#090e1a] hover:bg-[#0f172a] border border-[#1e293b] hover:border-cyan-500/50 text-slate-200 transition-all cursor-pointer shadow-sm group text-[8px]"
                        title="Save storyboard as pdf document"
                      >
                        <span className="text-[7px] text-cyan-400 font-mono ml-auto">{uiText("app.span.pdf", ".pdf")}</span>
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="load_img_export_psd"
                        defaultLabel="Export storyboard psd"
                        defaultIcon={<Layers className="w-2.5 h-2.5 text-purple-400 group-hover:scale-110 transition-transform shrink-0" />}
                        onClick={() => {
                          setIsLoadImageMenuOpen(false);
                          handleExportStoryboardPSD();
                        }}
                        className="flex items-center justify-between gap-1 p-1 rounded-md bg-[#090e1a] hover:bg-[#0f172a] border border-[#1e293b] hover:border-purple-500/50 text-slate-200 transition-all cursor-pointer shadow-sm group text-[8px]"
                        title="Export storyboard as multi-layer psd file"
                      >
                        <span className="text-[7px] text-purple-400 font-mono ml-auto">{uiText("app.span.psd", ".psd")}</span>
                      </CustomizableButton>
                    </div>
                  </div>
                </div>

                {/* Option 2: Image URL Input */}
                <div className="flex flex-col gap-1 bg-[#020617] p-1.5 rounded-lg border border-[#1e293b]">
                  <span className="text-[8.5px] font-semibold text-slate-400 px-0.5">{uiText("app.span.or_load_web_url", "Or Load Web URL:")}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleLoadImageFromUrl(imageUrlInput);
                      }}
                      className="flex-1 bg-[#090e1a] border border-[#1e293b] rounded px-2 py-1 text-[9px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#10b981]"
                    />
                    <CustomizableButton
                      buttonId="load_img_btn_load_url"
                      defaultLabel="Load URL"
                      defaultIcon={<Link className="w-3 h-3 shrink-0" />}
                      onClick={() => handleLoadImageFromUrl(imageUrlInput)}
                      className="bg-[#10b981] hover:bg-emerald-400 text-[#020617] font-bold px-2.5 py-1 rounded text-[9px] cursor-pointer transition-colors shrink-0 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "modes":
        return (
          <div className="flex items-center gap-1 bg-[#040914] p-1 rounded-xl border border-[#1e293b] text-[11px] font-medium shrink-0 shadow-none">
            <CustomizableButton
              buttonId="mode_crop"
              defaultLabel=""
              forceZeroText={true}
              lockIconOnly={isFrontPage}
              disableGlow={isFrontPage}
              defaultIcon={<CropIcon className="w-3.5 h-3.5" />}
              onClick={() => setMode("crop")}
              className={cn(
                "px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-none",
                mode === "crop"
                  ? "bg-[#080d1a] text-[#10b981] border border-[#10b981]/35"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              )}
            />
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
            <CustomizableButton
              buttonId="mode_carve"
              defaultLabel=""
              forceZeroText={true}
              lockIconOnly={isFrontPage}
              disableGlow={isFrontPage}
              defaultIcon={<Grid className="w-3.5 h-3.5" />}
              onClick={() => setMode("carve")}
              className={cn(
                "px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-none",
                mode === "carve"
                  ? "bg-[#080d1a] text-[#10b981] border border-[#10b981]/35"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              )}
            />
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
            <CustomizableButton
              buttonId="mode_storyboard"
              defaultLabel=""
              forceZeroText={true}
              lockIconOnly={isFrontPage}
              disableGlow={isFrontPage}
              defaultIcon={<Clapperboard className="w-3.5 h-3.5" />}
              onClick={() => setMode("storyboard")}
              className={cn(
                "px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-none",
                mode === "storyboard"
                  ? "bg-[#080d1a] text-[#10b981] border border-[#10b981]/35"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              )}
            />
          </div>
        );

      case "slots_stepper":
        if (mode !== "storyboard") return null;
        return (
          <div className="flex items-center bg-[#020617] px-2 py-1 rounded-lg border border-[#1e293b] gap-1.5 shadow-inner shrink-0" title={uiText("app.div.add_remove_storyboard_slots.title", "Add / Remove Storyboard Slots")}>
            <HoldButton
              onAction={() => setStoryboardSlots((prev) => [...prev, { url: null, name: "", story: "" }])}
              className="w-5 h-5 flex items-center justify-center text-[#10b981] hover:text-emerald-300 font-bold text-xs cursor-pointer transition-colors"
              title={uiText("app.hold_button.add_storyboard_slot_hold_for_continuous.title", "Add storyboard slot (Hold for continuous)")}
            >
              <Plus className="w-3.5 h-3.5 text-[#10b981]" />
            </HoldButton>
            <span className="text-[11px] font-mono font-bold text-slate-300 select-none px-1 inline-flex items-center gap-1">
              <span>{storyboardSlots.length}</span>
              <CustomizableLabel
                as="span"
                labelId="header_slots_stepper_label"
                defaultLabel=""
                showIconAlways={false}
                className="text-[11px] font-mono font-bold text-slate-300"
              />
            </span>
            <HoldButton
              onAction={() => { if (storyboardSlots.length > 1) setStoryboardSlots((prev) => prev.slice(0, -1)); }}
              disabled={storyboardSlots.length <= 1}
              className="w-5 h-5 flex items-center justify-center text-rose-500 hover:text-rose-400 font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title={uiText("app.hold_button.remove_storyboard_slot_hold_for_continuous.title", "Remove storyboard slot (Hold for continuous)")}
            >
              <Minus className="w-3.5 h-3.5 text-rose-500" />
            </HoldButton>
          </div>
        );

      case "studio_palette":
        return (
          <div className="relative shrink-0" ref={headerStudioMenuRef}>
            <CustomizableButton
              buttonId="header_studio_palette"
              defaultLabel=""
              defaultIcon={<Palette className="w-4 h-4 transition-transform group-hover:rotate-12" />}
              onClick={(e) => {
                e.stopPropagation();
                setIsHeaderStudioMenuOpen((prev) => !prev);
              }}
              className={cn(
                "w-9 h-9 rounded-full bg-[#040914] hover:bg-[#0b1324] border transition-all flex items-center justify-center shadow-none cursor-pointer group relative p-0",
                isHeaderStudioMenuOpen
                  ? "border-cyan-400/70 bg-[#0b1324] text-cyan-300"
                  : "border-[#1e293b] hover:border-cyan-400/50 text-cyan-400"
              )}
              title="Creative Studios Menu (imgDesc, Neo1, Bubba1, ShapeStudio, Screenplay, Variations, Zoom, Trace, Parallax, AniPlayer, Spread & Sorter)"
              forceZeroText={true}
              lockIconOnly={isFrontPage}
              disableGlow={isFrontPage}
            />
          </div>
        );

      case "utility_modal":
        return (
          <div className="relative shrink-0" ref={placement === "bottom" ? panelUtilityMenuRef : headerUtilityMenuRef}>
            <CustomizableButton
              buttonId={placement === "bottom" ? "front_page_ad_utility_modal" : "header_utility_modal"}
              defaultLabel=""
              defaultIcon={<Cpu className="w-4 h-4 text-slate-200 shrink-0" />}
              onClick={(e) => {
                e.stopPropagation();
                setIsUtilityModalOpen((prev) => !prev);
              }}
              className={cn(
                placement === "bottom"
                  ? "h-9 w-11 rounded-xl text-xs font-bold bg-[#080d1a] hover:bg-[#0f172a] border border-slate-700/70 hover:border-cyan-500/50 text-slate-200 transition-all cursor-pointer flex items-center justify-center shadow-none active:scale-95 group"
                  : "w-9 h-9 rounded-xl bg-[#080d1a] hover:bg-[#0f172a] border border-slate-700/70 hover:border-cyan-400/60 text-slate-200 transition-all flex items-center justify-center shadow-none cursor-pointer group relative p-0"
              )}
              title="Open Utility Modal"
              forceZeroText={true}
              lockIconOnly={true}
              disableGlow={true}
            />
          </div>
        );

      case "adv_modal":
        return (
          <div className="relative shrink-0" ref={panelAdvModalRef}>
            <CustomizableButton
              buttonId="front_page_ad_adv_modal"
              defaultLabel=""
              defaultIcon={<Zap className="w-4 h-4 text-slate-200 shrink-0 transition-transform group-hover:scale-105" />}
              onClick={(e) => {
                e.stopPropagation();
                setIsAdvModalOpen((prev) => !prev);
              }}
              className={cn(
                "h-9 w-11 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center shadow-none active:scale-95 group",
                isAdvModalOpen
                  ? "bg-[#0c1d18] text-emerald-300 border-emerald-400/70"
                  : "bg-[#080d1a] hover:bg-[#0f172a] text-slate-200 border-slate-700/70 hover:border-emerald-500/50"
              )}
              title="Open Adv Modal (Auto Slice, Messhi Grid, Krums Loader, Grid Mesh, Resolution Sharpener, Resample Studio, AniComposer & Smart Contour)"
              forceZeroText={true}
              lockIconOnly={true}
              disableGlow={true}
            />
          </div>
        );

      case "cloud_db":
        return (
          <CustomizableButton
            buttonId="header_cloud_db"
            defaultLabel=""
            defaultIcon={
              <Database
                className={cn(
                  "w-4 h-4",
                  currentUser ? "text-emerald-400" : "text-amber-400"
                )}
              />
            }
            onClick={() => openLiveCloudEditor()}
            className={cn(
              placement === "bottom"
                ? "h-9 w-9 rounded-xl border text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-none shrink-0 bg-[#080d1a] hover:bg-[#0f172a] text-emerald-400 border-slate-700/70 hover:border-emerald-500/50"
                : "w-9 h-9 rounded-xl border text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-none shrink-0 bg-[#080d1a] hover:bg-[#0f172a] text-emerald-400 border-slate-700/70 hover:border-emerald-500/50"
            )}
            title={
              currentUser
                ? `Cloud Database (${currentUser.email || currentUser.displayName || "Signed In"}${isDatabaseSyncing ? " • Syncing..." : " • Connected"})`
                : "Cloud Database Manager (Sign in with Google to sync)"
            }
            forceZeroText={true}
            lockIconOnly={true}
            disableGlow={true}
          />
        );

      case "upload_carved_grid":
        return (
          <CustomizableButton
            as="label"
            buttonId="header_upload_carved_grid"
            defaultLabel=""
            forceZeroText={true}
            defaultIcon={<Upload className="w-3.5 h-3.5 text-[#10b981]" />}
            className="cursor-pointer bg-[#020617] hover:bg-[#0f172a] text-[#10b981] hover:text-emerald-300 border border-[#1e293b] hover:border-[#10b981]/50 p-2 rounded-lg text-xs transition-all flex items-center justify-center shadow-none shrink-0"
            title="Upload New Image to Carved Slices Grid"
          >
            <input type="file" accept="image/*" multiple onChange={onUploadToCarvedSlices} className="hidden" />
          </CustomizableButton>
        );

      case "upload_multiple_storyboard":
        return (
          <CustomizableButton
            as="label"
            buttonId="header_upload_multiple_storyboard"
            defaultLabel=""
            forceZeroText={true}
            defaultIcon={<ImagePlus className="w-3.5 h-3.5 text-blue-400" />}
            className="cursor-pointer bg-[#020617] hover:bg-[#0f172a] text-blue-400 hover:text-blue-300 border border-[#1e293b] hover:border-blue-400/50 p-2 rounded-lg text-xs transition-all flex items-center justify-center shadow-none shrink-0"
            title="Upload Multiple Images directly to Storyboard"
          >
            <input type="file" accept="image/*" multiple onChange={onSelectOtherImages} className="hidden" />
          </CustomizableButton>
        );

      case "screenplay":
        return (
          <CustomizableButton
            buttonId="header_screenplay"
            defaultLabel=""
            defaultIcon={<Clapperboard className="w-4 h-4" />}
            onClick={handleOpenScreenplayWriter}
            className="w-9 h-9 rounded-xl bg-transparent hover:bg-[#080d1a] text-blue-400 border border-slate-800 hover:border-blue-400/40 p-0 transition-colors shadow-none font-bold cursor-pointer shrink-0 flex items-center justify-center"
            title="Screenplay Studio"
            forceZeroText={true}
            lockIconOnly={isFrontPage}
            disableGlow={isFrontPage}
          />
        );

      case "anim_player":
        return (
          <CustomizableButton
            buttonId="header_anim_player"
            defaultLabel=""
            defaultIcon={
              <svg viewBox="0 0 24 24" className="w-4 h-3.5 transition-transform group-hover:scale-105">
                <rect x="1" y="3.5" width="22" height="17" rx="5" fill="#FF0000" />
                <path d="M10 8.5v7l6-3.5-6-3.5z" fill="#FFFFFF" />
              </svg>
            }
            onClick={() => setIsPlayerModalOpen(true)}
            className="w-9 h-9 rounded-xl bg-transparent hover:bg-[#080d1a] text-red-500 border border-transparent hover:border-slate-800 p-0 transition-colors shadow-none font-bold cursor-pointer shrink-0 flex items-center justify-center group"
            title="Animation Player"
            forceZeroText={true}
            lockIconOnly={isFrontPage}
            disableGlow={isFrontPage}
          />
        );

      case "quick_ibc":
        return (
          <CustomizableButton
            buttonId="header_quick_ibc_inspector"
            defaultLabel=""
            forceZeroText={true}
            lockIconOnly={isFrontPage}
            disableGlow={isFrontPage}
            defaultIcon={<Search className="w-4 h-4 text-cyan-300" />}
            onClick={() => toggleIbcInspector()}
            className={cn(
              "w-9 h-9 rounded-xl border text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-none shrink-0 p-0",
              isIbcInspectorActive
                ? "bg-[#0d2236] text-cyan-200 border-cyan-400"
                : "bg-[#080d1a] hover:bg-[#0f172a] text-cyan-300 border-cyan-500/35 hover:border-cyan-400/60"
            )}
            title="Toggle IBC Interactive Element Inspector (Alt+I)"
          />
        );

      case "panel_controls":
        return (
          <CustomizableButton
            buttonId="front_page_ad_toggle_panel_bar"
            defaultLabel=""
            defaultIcon={
              isBottomControlBarVisible ? (
                <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
              ) : (
                <EyeOff className="w-4 h-4 text-slate-400 shrink-0" />
              )
            }
            forceZeroText={true}
            lockIconOnly={isFrontPage}
            disableGlow={isFrontPage}
            onClick={() => {
              if (imageSrc || mode === "storyboard") {
                setImageSrc(null);
                setMode("crop");
                setEyePanelOpen(false);
              } else if (isBottomControlBarVisible) {
                setEyePanelOpen(false);
                closeSlideMenu();
              } else {
                setEyePanelOpen(true);
              }
            }}
            className={cn(
              "w-9 h-9 rounded-xl text-xs font-bold border transition-all flex items-center justify-center cursor-pointer shadow-none active:scale-95 shrink-0 p-0",
              isBottomControlBarVisible && !imageSrc && mode !== "storyboard"
                ? "bg-[#0b1526] text-slate-100 border-cyan-500/45"
                : "bg-[#080d1a] hover:bg-[#0f172a] text-slate-300 border-slate-800 hover:border-cyan-500/40"
            )}
            title={
              isBottomControlBarVisible
                ? "Panel controls (Open) — click to close"
                : "Panel controls (Closed) — click to open"
            }
          />
        );

      case "rename_tag":
        return (
          <CustomizableButton
            buttonId="header_rename_tag"
            defaultLabel=""
            defaultIcon={<Tag className="w-4 h-4 text-[#10b981]" />}
            onClick={handleOpenRenameStudio}
            className="w-9 h-9 rounded-xl bg-transparent hover:bg-[#080d1a] text-[#10b981] border border-slate-800 hover:border-[#10b981]/40 p-0 transition-colors shadow-none font-bold cursor-pointer shrink-0 flex items-center justify-center"
            title="Rename Studio"
            forceZeroText={true}
            lockIconOnly={isFrontPage}
            disableGlow={isFrontPage}
          />
        );

      case "reset_all":
        if (!imageSrc) return null;
        return (
          <CustomizableButton
            buttonId="header_reset_all"
            defaultLabel=""
            defaultIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={handleReset}
            className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/40 p-2 rounded transition-colors shadow-sm font-bold cursor-pointer shrink-0"
            title="Reset All"
            forceZeroText={true}
          />
        );

      // --- Freestyle Tools ---
      case "freestyle_tool_select":
        return (
          <CustomizableButton
            buttonId="app_btn_108"
            defaultIcon={<MousePointer className="w-3.5 h-3.5" />}
            type="button"
onClick={() => setFreestyleTool("select")}
className={cn(
              "py-1.5 px-1 rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border text-center h-full w-14",
              freestyleTool === "select"
                ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md scale-102"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white"
            )}
title={uiText("app.button.select_move_and_transform_slices.title", "Select, Move, and Transform Slices")}
          >
              {() => (
                  <>
                    <span className="text-[9px] leading-none">{uiText("app.span.select", "Select")}</span>
                  </>
                )}
          </CustomizableButton>
        );
      case "freestyle_tool_square":
        return (
          <CustomizableButton
            buttonId="app_btn_107"
            defaultIcon={<Square className="w-3.5 h-3.5" />}
            type="button"
onClick={() => setFreestyleTool("rect")}
className={cn(
              "py-1.5 px-1 rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border text-center h-full w-14",
              freestyleTool === "rect"
                ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md scale-102"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white"
            )}
title={uiText("app.button.drag_to_draw_rectangular_slice.title", "Drag to Draw Rectangular Slice")}
          >
              {() => (
                  <>
                    <span className="text-[9px] leading-none">{uiText("app.span.box", "Box")}</span>
                  </>
                )}
          </CustomizableButton>
        );
      case "freestyle_tool_polygon":
        return (
          <CustomizableButton
            buttonId="app_btn_106"
            defaultIcon={<PenTool className="w-3.5 h-3.5" />}
            type="button"
onClick={() => setFreestyleTool("angled")}
className={cn(
              "py-1.5 px-1 rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border text-center h-full w-14",
              freestyleTool === "angled"
                ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md scale-102"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white"
            )}
title={uiText("app.button.click_on_canvas_to_drop_vertices_for_custom.title", "Click on Canvas to Drop Vertices for Custom Angled Polygon Slice")}
          >
              {() => (
                  <>
                    <span className="text-[9px] leading-none">{uiText("app.span.angled", "Angled")}</span>
                  </>
                )}
          </CustomizableButton>
        );
      case "freestyle_tool_trapeze":
        return (
          <CustomizableButton
            buttonId="app_btn_105"
            defaultIcon={<Triangle className="w-3.5 h-3.5" />}
            type="button"
onClick={() => setFreestyleTool("trapeze")}
className={cn(
              "py-1.5 px-1 rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border text-center h-full w-14",
              freestyleTool === "trapeze"
                ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md scale-102"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white"
            )}
title={uiText("app.button.drag_to_draw_trapezoid_or_insert_shape_prese.title", "Drag to Draw Trapezoid or Insert Shape Presets")}
          >
              {() => (
                  <>
                    <span className="text-[9px] leading-none">{uiText("app.span.trapeze", "Trapeze")}</span>
                  </>
                )}
          </CustomizableButton>
        );
      case "togglePanel":
        return null;
      case "autoNumber":
        return (
          <CustomizableButton
            buttonId="storyboard_tool_auto_number"
            defaultLabel="Auto-Number"
            forceZeroText={true}
            onClick={handleAutoNumberScenes}
            className="w-5.5 h-5.5 rounded-full border border-[#10b981] bg-[#020617] hover:bg-[#10b981]/20 flex items-center justify-center text-[10px] font-mono font-bold text-[#10b981] transition-all cursor-pointer shadow-sm"
            title={`Auto-Number: Sequentially re-number Scenes (${storyboardSlots.filter((s) => s.url).length} slices loaded) - Drag to reorder`}
          >
            {storyboardSlots.filter((s) => s.url).length}
          </CustomizableButton>
        );
      case "title":
        return (
          <div
            onDoubleClick={() =>
              setStoryboardToolbarOrder([
                "selectAll",
                "operations",
                "dropAction",
                "autoNumber",
                "title",
                "cellMode",
                "reverse",
                "divider_2",
                "slotSize",
                "slotHeaders",
                "divider_3",
                "player",
                "rename",
                "divider_4",
                "clear",
                "clearEmpty",
              ])
            }
            className="flex items-center px-1.5 py-0.5 select-none rounded-lg hover:bg-slate-800/30 transition-colors cursor-pointer"
            title={uiText("app.div.storyboard_title_label_drag_to_reorder_doubl.title", "Storyboard Title Label - Drag to reorder (Double-click to reset toolbar layout to default)")}
          >
            <CustomizableLabel
              labelId="storyboard_matrix_title"
              defaultText="Storyboard"
              showIconAlways={false}
              className="text-xs font-black text-slate-100 tracking-wider uppercase font-sans flex items-center"
            />
          </div>
        );
      case "rename":
        return (
          <CustomizableButton
            buttonId="storyboard_tool_rename"
            defaultLabel="Rename Studio"
            defaultIcon={<Tag className="w-3.5 h-3.5 text-emerald-400" />}
            forceZeroText={true}
            onClick={() => {
              if (selectedStoryboardSlotIndices.size > 0) {
                handleSendSelectedStoryboardToRenameStudio();
              } else {
                handleOpenRenameStudio();
              }
            }}
            className={cn(
              "p-1.5 bg-[#020617] hover:bg-[#0f172a] border rounded-lg transition-all flex items-center justify-center shadow-sm cursor-pointer relative group",
              selectedStoryboardSlotIndices.size > 0
                ? "border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 bg-emerald-950/50"
                : "border-[#1e293b] hover:border-emerald-500/40 text-emerald-400"
            )}
            title={
              selectedStoryboardSlotIndices.size > 0
                ? `Send ${selectedStoryboardSlotIndices.size} Selected Storyboard Frame(s) to Rename Studio - Drag to reorder`
                : "Rename Studio (Bulk Rename Frames) - Drag to reorder"
            }
            badge={
              selectedStoryboardSlotIndices.size > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 font-mono text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {selectedStoryboardSlotIndices.size}
                </span>
              ) : undefined
            }
          />
        );
      case "player":
        return (
          <CustomizableButton
            buttonId="storyboard_tool_player"
            defaultLabel="Animation player"
            defaultIcon={
              <svg viewBox="0 0 24 24" className="w-4 h-3.5 transition-transform group-hover:scale-105">
                <rect x="1" y="3.5" width="22" height="17" rx="5" fill="#FF0000" />
                <path d="M10 8.5v7l6-3.5-6-3.5z" fill="#FFFFFF" />
              </svg>
            }
            forceZeroText={true}
            onClick={() => setIsPlayerModalOpen(true)}
            className="p-1.5 bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] hover:border-red-500/50 rounded-lg transition-all flex items-center justify-center shadow-sm cursor-pointer group"
            title="Animation player - Drag to reorder"
          />
        );
      case "anicomper4":
        return (
          <CustomizableButton
            buttonId="storyboard_tool_anicomper4"
            defaultLabel="Anicomper4 studio"
            defaultIcon={<Film className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />}
            forceZeroText={true}
            onClick={() => setIsAniComposerOpen(true)}
            className="p-1.5 bg-[#020617] hover:bg-cyan-950/40 border border-[#1e293b] hover:border-cyan-500/50 rounded-lg transition-all flex items-center justify-center shadow-sm cursor-pointer group"
            title="AniComper4 - Keyframed timeline & onion-skinning studio"
          />
        );
      case "cellMode":
      case "layout":
        return (
          <CustomizableButton
            buttonId="storyboard_tool_view_cycle"
            defaultLabel={
              storyboardLayout === "grid9"
                ? "3x3 (No Info)"
                : storyboardLayout === "list-dynamic"
                ? "Grid (Name)"
                : "Strip (Full Info)"
            }
            defaultIcon={
              storyboardLayout === "grid9" ? (
                <LayoutGrid className="w-3.5 h-3.5 text-[#10b981]" />
              ) : storyboardLayout === "list-dynamic" ? (
                <Grid className="w-3.5 h-3.5 text-[#10b981]" />
              ) : (
                <Film className="w-3.5 h-3.5 text-cyan-400" />
              )
            }
            forceZeroText={true}
            onClick={(e) => {
              if (e.shiftKey) {
                setStoryboardCellMode((prev) => {
                  if (prev === "image-only") return "image-name";
                  if (prev === "image-name") return "full";
                  return "image-only";
                });
              } else {
                handleCycleStoryboardView();
              }
            }}
            title={`Slot & Cell View: ${
              storyboardLayout === "grid9"
                ? "3x3 (Rows of 3x3 without info)"
                : storyboardLayout === "list-dynamic"
                ? "Grid (Cell with name)"
                : "Strip (1 row horizontally with full info)"
            } • Click: Cycle view mode • Shift+Click: Cycle cell info • Right-click: Open Button Customizer`}
            className={cn(
              "p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center shadow-sm relative group",
              storyboardLayout === "strip"
                ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/60 hover:border-cyan-400 shadow-cyan-950/40"
                : storyboardLayout === "list-dynamic"
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/50 hover:border-emerald-400 shadow-emerald-950/30"
                : "bg-[#020617] hover:bg-[#0f172a] text-[#10b981] border-[#1e293b] hover:border-[#10b981]/50"
            )}
          />
        );
      case "reverse":
        return (
          <CustomizableButton
            buttonId="storyboard_tool_reverse"
            defaultLabel={selectedStoryboardSlotIndices.size > 1 ? "Reverse Selected" : "Reverse Board"}
            defaultIcon={<ArrowUpDown className="w-3.5 h-3.5 text-[#10b981]" />}
            forceZeroText={true}
            onClick={handleReverseStoryboardSlots}
            disabled={storyboardSlots.length <= 1}
            className={cn(
              "p-1.5 border rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-sm disabled:opacity-40",
              selectedStoryboardSlotIndices.size > 1
                ? "bg-amber-950/70 hover:bg-amber-900/80 border-amber-500/60 text-amber-300"
                : "bg-[#020617] hover:bg-[#0f172a] border-[#1e293b] hover:border-[#10b981]/40 text-[#10b981]"
            )}
            title={
              selectedStoryboardSlotIndices.size > 1
                ? `Reverse order of ${selectedStoryboardSlotIndices.size} selected slots - Drag to reorder`
                : "Reverse entire storyboard slots - Drag to reorder"
            }
          />
        );
      case "duplicate":
        return (
          <CustomizableButton
            buttonId="storyboard_tool_duplicate"
            defaultLabel={selectedStoryboardSlotIndices.size > 0 ? "Duplicate Selected" : "Duplicate Frames"}
            defaultIcon={<Copy className="w-3.5 h-3.5 text-cyan-400" />}
            forceZeroText={true}
            onClick={handleDuplicateStoryboardSlots}
            disabled={storyboardSlots.filter((s) => s.url).length === 0}
            className={cn(
              "p-1.5 border rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-sm disabled:opacity-40",
              selectedStoryboardSlotIndices.size > 0
                ? "bg-cyan-950/80 hover:bg-cyan-900 border-cyan-500/60 text-cyan-300"
                : "bg-[#020617] hover:bg-[#0f172a] border-[#1e293b] hover:border-cyan-500/40 text-cyan-400"
            )}
            title={
              selectedStoryboardSlotIndices.size > 0
                ? `Duplicate ${selectedStoryboardSlotIndices.size} selected frame(s)`
                : "Duplicate all filled frames in storyboard"
            }
          />
        );
      case "saveDefaultState":
        return (
          <CustomizableButton
            buttonId="storyboard_tool_save_default_state"
            defaultLabel="Set as Default State"
            defaultIcon={<Bookmark className="w-3.5 h-3.5 text-amber-400" />}
            forceZeroText={true}
            onClick={handleSavePresentStateAsDefault}
            className="p-1.5 bg-[#020617] hover:bg-amber-950/60 border border-[#1e293b] hover:border-amber-500/40 rounded-lg text-amber-400 transition-all cursor-pointer flex items-center justify-center shadow-sm active:scale-95"
            title="Present State as Default: Captures storyboard's present slots, sliced fragments, layout, cell mode, button state and sorting configuration as its persistent default state (STORYBOARD_DEFAULT_STATE_KEY)"
          />
        );
      case "restoreDefaultState":
        return (
          <CustomizableButton
            buttonId="storyboard_tool_restore_default_state"
            defaultLabel="Restore Default State"
            defaultIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-300" />}
            forceZeroText={true}
            onClick={handleRestoreDefaultState}
            disabled={!savedStoryboardDefaultInfo}
            className={cn(
              "p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-sm active:scale-95 border",
              savedStoryboardDefaultInfo
                ? "bg-[#020617] hover:bg-amber-950/60 border-[#1e293b] hover:border-amber-500/40 text-amber-300"
                : "bg-[#020617] border-[#1e293b]/40 text-slate-600 opacity-40 cursor-not-allowed"
            )}
            title={
              savedStoryboardDefaultInfo
                ? `Restore Storyboard to saved default state (${savedStoryboardDefaultInfo.slotsCount} slots, ${savedStoryboardDefaultInfo.slicesCount} slices, layout: ${savedStoryboardDefaultInfo.layout}) - Drag to reorder`
                : "Restore Storyboard to saved default state (no saved default state yet) - Drag to reorder"
            }
          />
        );
      case "slotSize":
        return (
          <CustomizableButton
            buttonId="storyboard_tool_slot_size"
            defaultLabel={`Size: ${slotSize.toUpperCase()} (${slotSize === "sm" ? "5 rows" : slotSize === "md" ? "3 rows" : "2 rows"})`}
            defaultIcon={<Maximize2 className="w-3.5 h-3.5 text-[#10b981]" />}
            badge={
              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-800/60">
                {slotSize.toUpperCase()}: {slotSize === "sm" ? "5" : slotSize === "md" ? "3" : "2"}
              </span>
            }
            onClick={() => {
              setSlotSize((prev) => {
                if (prev === "sm") return "md";
                if (prev === "md") return "lg";
                return "sm";
              });
            }}
            title={`Slot Size: ${slotSize.toUpperCase()} (SM = 5 rows, MD = 3 rows, LG = 2 rows of increasingly larger slots) - Click to cycle SM / MD / LG`}
            className="p-1.5 bg-[#020617] hover:bg-[#0f172a] text-[#10b981] border border-[#1e293b] hover:border-[#10b981]/40 rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-sm"
          />
        );
      case "slotHeaders":
        return (
          <CustomizableButton
            buttonId="storyboard_tool_slot_headers"
            defaultLabel={showSlotHeaders ? "Hide Headers" : "Show Headers"}
            defaultIcon={
              showSlotHeaders ? (
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              )
            }
            forceZeroText={true}
            onClick={toggleSlotHeaders}
            className={cn(
              "p-1.5 border rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-sm",
              showSlotHeaders
                ? "bg-[#020617] hover:bg-[#0f172a] text-rose-400 border-[#1e293b] hover:border-rose-500/40"
                : "bg-rose-950/30 hover:bg-rose-950/50 text-slate-400 border-rose-900/40 hover:border-slate-500"
            )}
            title={`Slot Panel Headers (Trashcans & Actions): ${
              showSlotHeaders ? "Visible (Click to Hide)" : "Hidden (Click to Show)"
            } - Drag to reorder`}
          />
        );
      case "stripBg":
        return (
          <div className="relative group/stripbg flex items-center">
            <CustomizableButton
              buttonId="storyboard_tool_strip_bg"
              defaultLabel="Strip BG"
              defaultIcon={<Palette className="w-3.5 h-3.5 text-cyan-400" />}
              forceZeroText={true}
              onClick={() => {
                const presets = ["#000000", "#050505", "#0a0a0a", "#020617", "#070d1e", "#0f172a", "#18181b"];
                const currIdx = presets.indexOf((stripBackground || "#000000").toLowerCase());
                const nextColor = presets[(currIdx + 1) % presets.length];
                setStripBackground(nextColor);
                setStripImageBackground(nextColor);
                setStripPanelBackground(nextColor);
              }}
              className="p-1.5 bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] hover:border-cyan-500/40 rounded-lg text-cyan-400 transition-all cursor-pointer flex items-center justify-center shadow-sm"
              title={`Strip Panel & Image Background: ${stripBackground || "#000000"} - Click to cycle black/dark presets / Hover for picker - Drag to reorder`}
            />
            <input
              type="color"
              value={stripBackground || "#000000"}
              onChange={(e) => {
                setStripBackground(e.target.value);
                setStripImageBackground(e.target.value);
                setStripPanelBackground(e.target.value);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none group-hover/stripbg:pointer-events-auto"
              title={uiText("app.input.pick_custom_strip_panel_and_image_background.title", "Pick custom Strip Panel & Image background color")}
            />
          </div>
        );
      case "dropAction":
        return (
          <CustomizableButton
            buttonId="storyboard_tool_drop_action"
            defaultLabel={`Drop: ${storyboardDropAction}`}
            forceZeroText={true}
            onClick={() => {
              setStoryboardDropAction((prev) => {
                if (prev === "reorder") return "replace";
                if (prev === "replace") return "swap";
                return "reorder";
              });
            }}
            title={`Drop Action: ${
              storyboardDropAction === "reorder"
                ? "Reorder (Re) - Shifts existing slots"
                : storyboardDropAction === "replace"
                ? "Replace (Rp) - Overwrites target slot"
                : "Swap (Sw) - Exchanges slot positions"
            } (Click to toggle, Drag to reorder)`}
            className={cn(
              "w-6 h-6 rounded-full border-2 font-extrabold text-[9.5px] leading-none flex items-center justify-center transition-all cursor-pointer shadow-sm select-none shrink-0 tracking-tighter",
              storyboardDropAction === "reorder"
                ? "border-emerald-500 text-emerald-400 bg-emerald-950/80 hover:bg-emerald-900 shadow-emerald-950/40"
                : storyboardDropAction === "replace"
                ? "border-amber-500 text-amber-400 bg-amber-950/80 hover:bg-amber-900 shadow-amber-950/40"
                : "border-cyan-400 text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 shadow-cyan-950/40"
            )}
          >
            {storyboardDropAction === "reorder"
              ? "Re"
              : storyboardDropAction === "replace"
              ? "Rp"
              : "Sw"}
          </CustomizableButton>
        );
      case "clearEmpty":
        return (
          <CustomizableButton
            buttonId="storyboard_tool_clear_empty"
            defaultLabel="Clear Empty"
            defaultIcon={<Eraser className="w-3.5 h-3.5 text-amber-400" />}
            forceZeroText={true}
            onClick={() => {
              const filledSlots = storyboardSlots.filter(
                (slot) => Boolean((slot.url && slot.url.trim() !== "") || (slot.name && slot.name.trim() !== "") || (slot.story && slot.story.trim() !== ""))
              );
              const baseLen = storyboardLayout === "grid9" ? 9 : numRows * numCols;
              if (filledSlots.length === 0) {
                setStoryboardSlots(
                  Array.from({ length: baseLen }, () => ({
                    url: null,
                    name: "",
                    story: "",
                  }))
                );
              } else {
                setStoryboardSlots(filledSlots);
              }
              setCropNotice("✓ Cleared all empty slots from Storyboard!");
              setTimeout(() => setCropNotice(null), 2500);
            }}
            title="Clear Empty Slots (Removes all unfilled slots) - Drag to reorder"
            className="p-1.5 bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] hover:border-amber-500/40 rounded-lg text-amber-400 transition-all cursor-pointer flex items-center justify-center shadow-sm"
          />
        );
      case "clear":
        return (
          <CustomizableButton
            buttonId="storyboard_tool_clear"
            defaultLabel="Clear Board"
            defaultIcon={<RotateCcw className="w-3.5 h-3.5 text-rose-400" />}
            forceZeroText={true}
            onClick={() => {
              const desiredLength = storyboardLayout === "grid9" ? 9 : numRows * numCols;
              setStoryboardSlots(Array.from({ length: desiredLength }, () => ({ url: null, name: "", story: "" })));
            }}
            title="Clear Board - Drag to reorder"
            className="p-1.5 bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] hover:border-rose-500/40 rounded-lg text-rose-400 transition-all cursor-pointer flex items-center justify-center shadow-sm"
          />
        );
      case "lock":
        return (
          <CustomizableButton
            buttonId="storyboard_tool_lock"
            defaultLabel={isStoryboardLocked ? "Unlock Board" : "Lock Board"}
            defaultIcon={isStoryboardLocked ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
            forceZeroText={true}
            onClick={() => setIsStoryboardLocked((prev) => !prev)}
            title={
              isStoryboardLocked
                ? "Storyboard Locked (Click to Unlock Drag & Drop)"
                : "Storyboard Unlocked (Click to Lock Drag & Drop)"
            }
            className={cn(
              "p-1.5 border rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-sm select-none",
              isStoryboardLocked
                ? "bg-slate-800/90 text-slate-400 border-slate-700 hover:bg-slate-700/90 hover:text-slate-200 shadow-slate-900/40"
                : "bg-[#020617] hover:bg-[#0f172a] text-emerald-400 border-[#1e293b] hover:border-emerald-500/40 shadow-emerald-950/20"
            )}
          />
        );
      case "selectAll":
        return (
          <CustomizableButton
            buttonId="storyboard_select_all"
            defaultLabel={
              selectedStoryboardSlotIndices.size === storyboardSlots.length && storyboardSlots.length > 0
                ? "Deselect All"
                : "Select All"
            }
            defaultIcon={
              selectedStoryboardSlotIndices.size === storyboardSlots.length && storyboardSlots.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )
            }
            forceZeroText={true}
            onClick={() => {
              if (selectedStoryboardSlotIndices.size === storyboardSlots.length) {
                setSelectedStoryboardSlotIndices(new Set());
              } else {
                setSelectedStoryboardSlotIndices(new Set(storyboardSlots.map((_, idx) => idx)));
              }
            }}
            title={
              selectedStoryboardSlotIndices.size === storyboardSlots.length
                ? `Deselect All Slots (${storyboardSlots.length} selected) - Drag to reorder`
                : `Select All Slots (${storyboardSlots.length} total) - Drag to reorder`
            }
            className={cn(
              "p-1.5 border rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-sm select-none relative",
              selectedStoryboardSlotIndices.size === storyboardSlots.length && storyboardSlots.length > 0
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/60 hover:bg-emerald-900/80"
                : "bg-[#020617] hover:bg-[#0f172a] text-slate-400 border-[#1e293b] hover:border-slate-600 hover:text-white"
            )}
          />
        );
      case "operations":
        return (
          <CustomizableButton
            buttonId="storyboard_tool_operations"
            defaultLabel="Slot Operations"
            defaultIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />}
            forceZeroText={true}
            onClick={() => setIsStoryboardOperationsOpen(true)}
            title={`Storyboard Slot Operations: Multi select/deselect, move by X, send to tools, delete slots (${selectedStoryboardSlotIndices.size} selected) - Drag to reorder`}
            className="p-1.5 bg-[#020617] hover:bg-amber-950/50 border border-[#1e293b] hover:border-amber-500/50 rounded-lg text-amber-400 transition-all cursor-pointer flex items-center justify-center shadow-sm relative group"
            badge={
              selectedStoryboardSlotIndices.size > 0 ? (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-mono text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-sm">
                  {selectedStoryboardSlotIndices.size}
                </span>
              ) : undefined
            }
          />
        );
      default:
        return null;
    }
  };

  const renderUniversalItem = (id: string, zone: "header" | "storyboard" | "freestyle") => {
    if (id.startsWith("divider_")) {
      return (
        <div
          key={id}
          draggable
          onDragStart={(e) => handleUniversalDragStart(e, id)}
          onDragEnd={handleUniversalDragEnd}
          onDragOver={(e) => handleUniversalDragOver(e, id)}
          onDrop={(e) => handleUniversalDrop(e, id, zone)}
          className={cn(
            "h-6 px-1.5 flex items-center justify-center cursor-grab active:cursor-grabbing group/div select-none transition-all shrink-0",
            draggedUniversalItem === id && "opacity-40 scale-90",
            dragOverUniversalItem === id && "ring-2 ring-emerald-400/80 bg-emerald-500/10 border-emerald-400/40 rounded"
          )}
          title={uiText("app.div.draggable_divider_drag_to_reposition_separat.title", "Draggable Divider - Drag to reposition separator")}
        >
          <div className="w-[1.5px] h-3.5 bg-slate-700/90 group-hover/div:bg-emerald-400 group-hover/div:w-[2px] transition-all rounded-full" />
        </div>
      );
    }
    const content = renderUniversalItemInner(id);
    if (!content) return null;
    if (id === "modes") {
      return <div key={id} className="flex items-center">{content}</div>;
    }
    
    if (id === "anim_player") {
      return (
        <React.Fragment key={id}>
          <div className="h-4 w-[1px] bg-slate-700/80 mx-1 shrink-0" />
          <div
            draggable
            onDragStart={(e) => handleUniversalDragStart(e, id)}
            onDragEnd={handleUniversalDragEnd}
            onDragOver={(e) => handleUniversalDragOver(e, id)}
            onDrop={(e) => handleUniversalDrop(e, id, zone)}
            className={cn(
              "transition-all relative flex items-center shrink-0 cursor-grab hover:scale-105 active:cursor-grabbing",
              zone === "header" && "p-0.5 rounded border border-transparent group",
              draggedUniversalItem === id && "opacity-40 scale-90 ring-2 ring-emerald-500 rounded-xl",
              dragOverUniversalItem === id && "ring-2 ring-emerald-400/80 bg-emerald-500/10 border-emerald-400/40 rounded-xl"
            )}
          >
            {content}
          </div>
        </React.Fragment>
      );
    }
    
    return (
      <div
        key={id}
        draggable
        onDragStart={(e) => handleUniversalDragStart(e, id)}
        onDragEnd={handleUniversalDragEnd}
        onDragOver={(e) => handleUniversalDragOver(e, id)}
        onDrop={(e) => handleUniversalDrop(e, id, zone)}
        className={cn(
          "transition-all relative flex items-center shrink-0 cursor-grab hover:scale-105 active:cursor-grabbing",
          zone === "header" && "p-0.5 rounded border border-transparent group",
          draggedUniversalItem === id && "opacity-40 scale-90 ring-2 ring-emerald-500 rounded-xl",
          dragOverUniversalItem === id && "ring-2 ring-emerald-400/80 bg-emerald-500/10 border-emerald-400/40 rounded-xl"
        )}
      >
        {zone === "header" && (
          <div className="px-0.5 text-slate-600 hover:text-slate-200 opacity-20 group-hover:opacity-100 transition-opacity flex items-center justify-center shrink-0">
            <GripVertical className="w-3 h-3" />
          </div>
        )}
        {content}
      </div>
    );
  };
  const modesIdx = headerItemsOrder.indexOf("modes");
  const leftHeaderItems =
    modesIdx !== -1
      ? headerItemsOrder.slice(0, modesIdx)
      : headerItemsOrder.filter((id) => ["logo", "upload"].includes(id));
  const rightHeaderItems =
    modesIdx !== -1
      ? headerItemsOrder.slice(modesIdx + 1)
      : headerItemsOrder.filter((id) => id !== "modes" && !["logo", "upload"].includes(id));

  // Both entry points operate on the same workspace snapshot and saved-state library.
  const captureNamedState = (): NamedWorkspaceSnapshot => ({
    version: 1, buttonConfig: exportConfigs(), frontPageGridMode, fourByFourPanelStyle,
    originalSpreadImage, userDefault3x3Image, boxImages, defaultBoxImages,
    boxRotationSeries, boxRotationIntervals, boxRotationActive, boxLinkConfigs,
    sequencerPanelState, disableBoxActions, isBottomControlBarVisible,
  });
  const restoreNamedState = async (state: NamedWorkspaceSnapshot) => {
    if (!state || state.version !== 1 || !state.buttonConfig || !state.sequencerPanelState || !state.boxImages) {
      throw new Error("This saved state is invalid or not supported.");
    }
    const result = importConfigs(state.buttonConfig);
    if (!result.success) throw new Error(result.error || "Could not restore button settings.");
    setFrontPageGridMode(state.frontPageGridMode);
    remoteStore.setItem("seqcarver_frontPageGridMode", state.frontPageGridMode);
    handleUpdate4x4PanelStyle(state.fourByFourPanelStyle);
    updateOriginalSpreadImage(state.originalSpreadImage);
    setUserDefault3x3Image(state.userDefault3x3Image);
    remoteStore.setItem("seqcarver_user_default_3x3_image", state.userDefault3x3Image);
    remoteStore.setItem("seqcarver_user_defined_master_image", state.userDefault3x3Image);
    setBoxImages(state.boxImages);
    setDefaultBoxImages(state.defaultBoxImages);
    setBoxRotationSeries(state.boxRotationSeries);
    setBoxRotationIntervals(state.boxRotationIntervals);
    setBoxRotationActive(state.boxRotationActive);
    setBoxLinkConfigs(state.boxLinkConfigs);
    setSequencerPanelState(state.sequencerPanelState);
    setDisableBoxActions(state.disableBoxActions);
    setEyePanelOpen(state.isBottomControlBarVisible);
    // The startup path also reads these dedicated image defaults.
    await Promise.all([
      saveStoredDefaultImage("originalSpreadImage", state.originalSpreadImage),
      saveStoredDefaultImage("user_default_3x3_image", state.userDefault3x3Image),
      saveStoredDefaultImage("defaultBox1Image", state.defaultBoxImages[1] || ""),
      saveStoredJson("defaultBoxImages", state.defaultBoxImages),
    ]);
  };

  const isFrontPageView = !imageSrc && mode !== "storyboard";

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-100 font-sans overflow-hidden select-none">
      {/* ===== Top compact navbar ===== */}
      <CustomizableContainer
        as="header"
        ibcId="header_container"
        componentType="panel"
        defaultTitle="Main Header Navbar"
        ignoreCustomPanelStyles={isFrontPageView}
        disableGlow={isFrontPageView}
        className={cn(
          "relative z-40 flex items-center justify-between px-4 py-2 shrink-0 h-13 overflow-visible select-none",
          isFrontPageView
            ? "bg-transparent border-b border-transparent shadow-none"
            : "border-b border-[#1e293b] bg-[#0f172a]"
        )}
      >
        {/* Left Header Items (no spacing between icons) */}
        <div
          className="flex items-center gap-0.5 shrink-0 z-30 min-w-[32px]"
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
          onDrop={(e) => handleUniversalZoneDrop(e, "header")}
        >
          {leftHeaderItems.map((id) => renderUniversalItem(id, "header"))}
        </div>

        {/* Center Mode Switcher - Crop / Split Grid / Storyboard strictly centered */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center pointer-events-auto">
          {renderUniversalItem("modes", "header")}
        </div>

        {/* Right Header Items (no spacing between icons) */}
        <div
          className="flex items-center gap-1 shrink-0 ml-auto z-30 min-w-[32px]"
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
          onDrop={(e) => handleUniversalZoneDrop(e, "header")}
        >
          {rightHeaderItems.map((id) => renderUniversalItem(id, "header"))}
        </div>
      </CustomizableContainer>

      {/* ===== Main Content Workspace ===== */}
      <div className="flex flex-1 overflow-hidden">
        {imageSrc || mode === "storyboard" ? (
          <div className="flex-1 flex overflow-hidden bg-[#020617]">
            {/* Sidebar Controls - Left Panel */}
            {(isLeftSidebarVisible || (mode === "storyboard" && !isStoryboardVisible)) && (
              <aside
                style={{
                  width: mode === "storyboard" && !isStoryboardVisible ? "100%" : `${sidebarWidth}px`,
                  maxWidth: mode === "storyboard" && !isStoryboardVisible ? "100%" : "min(48vw, 700px)",
                  minWidth: mode === "storyboard" && !isStoryboardVisible ? "100%" : "240px",
                  backgroundColor: mode === "storyboard" ? carvedSlicesBgColor : undefined,
                }}
                className={cn(
                  "bg-[#0f172a] flex flex-col overflow-y-auto select-text relative transition-all duration-150",
                  mode === "storyboard" && !isStoryboardVisible
                    ? "flex-1 w-full h-full border-r-0 z-10"
                    : "border-r border-[#1e293b] shrink-0 group/sidebar"
                )}
              >
              {/* Step 1: Crop */}
              {mode === "crop" && (
                <CropSidebar
                  onToggleFullScreenControlPanel={() => setIsFullScreenCropControlPanelOpen((prev) => !prev)}
                  isFullScreenControlPanelOpen={isFullScreenCropControlPanelOpen}
                  cropPanelsOrder={cropPanelsOrder}
                  cropQuickToolsOrder={cropQuickToolsOrder}
                  cropSbFrameOrder={cropSbFrameOrder}
                  cropAspectOrder={cropAspectOrder}
                  cropPrimaryOrder={cropPrimaryOrder}
                  cropUtilityOrder={cropUtilityOrder}
                  cropShapeStudioOrder={cropShapeStudioOrder}
                  cropMultiCropBatchOrder={cropMultiCropBatchOrder}

                  draggedCropPanel={draggedCropPanel}
                  dragOverCropPanel={dragOverCropPanel}
                  handleCropPanelDragStart={handleCropPanelDragStart}
                  handleCropPanelDragOver={handleCropPanelDragOver}
                  handleCropPanelDrop={handleCropPanelDrop}
                  handleCropPanelDragEnd={handleCropPanelDragEnd}

                  draggedCropItem={draggedCropItem}
                  dragOverCropItem={dragOverCropItem}
                  handleCropItemDragStart={handleCropItemDragStart}
                  handleCropItemDragOver={handleCropItemDragOver}
                  handleCropItemDrop={handleCropItemDrop}
                  handleCropItemDragEnd={handleCropItemDragEnd}
                  handleCropZoneDrop={handleCropZoneDrop}
                  handleResetCropLayout={handleResetCropLayout}
                  handleSavePresentCropStateAsDefault={handleSavePresentCropStateAsDefault}

                  cropNotice={cropNotice}
                  setCropNotice={setCropNotice}
                  completedPercentCrop={completedPercentCrop}
                  completedPixelCrop={completedPixelCrop}
                  crop={crop}
                  setCrop={setCrop}
                  setCompletedPercentCrop={setCompletedPercentCrop}
                  setCompletedPixelCrop={setCompletedPixelCrop}
                  isCircularCrop={isCircularCrop}
                  cropAspect={cropAspect}
                  handleSetAspect={handleSetAspect}

                  shapeStudioCropIndex={shapeStudioCropIndex}
                  setShapeStudioCropIndex={setShapeStudioCropIndex}
                  resentFromStoryboardSliceIndex={resentFromStoryboardSliceIndex}
                  setResentFromStoryboardSliceIndex={setResentFromStoryboardSliceIndex}
                  storyboardSlices={storyboardSlices}
                  setStoryboardSlices={setStoryboardSlices}
                  cropHistory={cropHistory}
                  cropHistoryIndex={cropHistoryIndex}
                  originalImageSrc={originalImageSrc}
                  imageSrc={imageSrc}
                  setImageSrc={setImageSrc}
                  croppedImageSrc={croppedImageSrc}
                  setCroppedImageSrc={setCroppedImageSrc}
                  multiCrops={multiCrops}
                  setMultiCrops={setMultiCrops}
                  setMode={setMode}

                  handleOpenAutoSlice={handleOpenAutoSlice}
                  handleOpenSmartTrim={handleOpenSmartTrim}
                  handleApplyCrop={handleApplyCrop}
                  handleCropToStoryboard={handleCropToStoryboard}
                  handleCropToStoryboardReplace={handleCropToStoryboardReplace}
                  handleUndoCrop={handleUndoCrop}
                  handleRedoCrop={handleRedoCrop}
                  handleRevertToOriginal={handleRevertToOriginal}
                  handleJumpToCropHistoryIndex={handleJumpToCropHistoryIndex}
                  onOpenHistoryVisualizer={() => setIsHistoryVisualizerOpen(true)}
                  setIsGridMeshModalOpen={setIsGridMeshModalOpen}
                  setIsJoinImagesModalOpen={setIsJoinImagesModalOpen}
                  handleOpenMesshi={handleOpenMesshi}
                  handleOpenKrums={handleOpenKrums}
                  handleApplyCropDirectToStoryboard={handleApplyCropDirectToStoryboard}
                  handleApplyCropAndBackToShapeStudio={handleApplyCropAndBackToShapeStudio}
                  handleCancelBackToShapeStudio={handleCancelBackToShapeStudio}
                  handleApplyMultiCrops={handleApplyMultiCrops}
                  handleSendSingleMultiCropToStoryboard={handleSendSingleMultiCropToStoryboard}

                  isMeshToolActive={isMeshToolActive}
                  setIsMeshToolActive={setIsMeshToolActive}
                  imgRef={imgRef}
                  meshBounds={meshBounds}
                  meshSquareSize={meshSquareSize}
                  meshMode={meshMode}
                  setMeshMode={setMeshMode}
                  freestyleSquares={freestyleSquares}
                  setFreestyleSquares={setFreestyleSquares}
                  selectedFreestyleSquareId={selectedFreestyleSquareId}
                  setSelectedFreestyleSquareId={setSelectedFreestyleSquareId}
                  selectedFreestyleSquareIds={selectedFreestyleSquareIds}
                  setSelectedFreestyleSquareIds={setSelectedFreestyleSquareIds}
                  handleInitializeDefaultFreestyleSquares={handleInitializeDefaultFreestyleSquares}
                  freestyleSlicePreviewRef={freestyleSlicePreviewRef}
                  isMeshImageInfoOpen={isMeshImageInfoOpen}
                  setIsMeshImageInfoOpen={setIsMeshImageInfoOpen}
                  isMeshAppearanceOpen={isMeshAppearanceOpen}
                  setIsMeshAppearanceOpen={setIsMeshAppearanceOpen}
                  meshGridLineColor={meshGridLineColor}
                  setMeshGridLineColor={setMeshGridLineColor}
                  meshGridLineWidth={meshGridLineWidth}
                  setMeshGridLineWidth={setMeshGridLineWidth}
                  meshAutoGotoAfterCut={meshAutoGotoAfterCut}
                  setMeshAutoGotoAfterCut={setMeshAutoGotoAfterCut}
                  meshDestination={meshDestination}
                  setMeshDestination={setMeshDestination}
                  handleCutMeshIntoSquares={handleCutMeshIntoSquares}
                  MESH_COLOR_PRESETS={MESH_COLOR_PRESETS}
                  MESH_LINE_WIDTHS={MESH_LINE_WIDTHS}
                />
              )}

              {/* Step 2: Carve */}
              {mode === "carve" && (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
                    <CustomizableLabel
                      as="h2"
                      labelId="carve_sidebar_header_title"
                      defaultLabel=""
                      defaultIcon={<Grid className="w-3.5 h-3.5" />}
                      className="text-xs font-bold text-[#10b981] flex items-center gap-1.5"
                    />
                  </div>

                  {/* Optical Auto-Slice & Smart Trim Quick Tools */}
                  <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-900/50 rounded-xl border border-emerald-500/30 shadow-inner">
                    <CustomizableButton
                      buttonId="carve_auto_slice"
                      defaultLabel="Auto-Slice"
                      defaultIcon={<Scissors className="w-3.5 h-3.5 text-slate-950 shrink-0" />}
                      onClick={handleOpenAutoSlice}
                      className="py-1.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      title="Auto-detect individual sprites & bounds via optical alpha thresholding"
                    />
                    <CustomizableButton
                      buttonId="carve_smart_trim"
                      defaultLabel="Smart Trim"
                      defaultIcon={<CropIcon className="w-3.5 h-3.5 text-cyan-200 shrink-0" />}
                      onClick={() => handleOpenSmartTrim("grid")}
                      className="py-1.5 px-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      title="Smart Auto-Crop & Alpha Trimming: automatically detects and removes outer padding of each slice based on the alpha channel of the grid segments"
                    />
                  </div>

                  {/* Selection & Action Buttons Bar (Moved to Top of Panel) */}
                  <div className="space-y-2 pb-2 border-b border-[#1e293b]">
                    {/* Selection Status Badge */}
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-300 px-0.5">
                      <span className="flex items-center gap-1 text-slate-400">
                        <CheckSquare className="w-3.5 h-3.5 text-[#10b981]" />
                        {uiText("app.span.selection", "Selection:")}
                      </span>
                      <span className={cn("font-mono font-bold px-1.5 py-0.5 rounded-full border text-[9.5px]",
                        selectedSplitIndices.size > 0 
                          ? "bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40" 
                          : "bg-slate-900 text-slate-500 border-slate-800"
                      )}>
                        {selectedSplitIndices.size} / {numRows * numCols}{uiText("app.span.selected_2", " Selected")}
                      </span>
                    </div>

                    {/* Icon-Only Action Buttons Bar */}
                    <div className="grid grid-cols-6 gap-1 pt-0.5">
                      {/* Select / Deselect All */}
                      <CustomizableButton
                        buttonId="carve_select_all"
                        defaultLabel={selectedSplitIndices.size === numRows * numCols && numRows * numCols > 0 ? "Deselect All" : "Select All"}
                        defaultIcon={
                          selectedSplitIndices.size === numRows * numCols && numRows * numCols > 0 ? (
                            <CheckSquare className="w-4 h-4 text-[#10b981]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )
                        }
                        onClick={() => toggleSelectAllSplits(numRows * numCols)}
                        className={cn(
                          "p-2 rounded-lg font-bold transition-all border flex items-center justify-center cursor-pointer shadow-sm",
                          selectedSplitIndices.size === numRows * numCols && numRows * numCols > 0
                            ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/50 hover:bg-[#10b981]/30"
                            : "bg-[#020617] hover:bg-slate-800 text-slate-300 border-[#1e293b]"
                        )}
                        title={selectedSplitIndices.size === numRows * numCols ? "Deselect All Slices" : "Select All Slices"}
                      />

                      {/* Send Selected Slices to Storyboard */}
                      <CustomizableButton
                        buttonId="carve_send_selected"
                        defaultLabel="Send Selected"
                        defaultIcon={<CheckCircle2 className="w-4 h-4 text-emerald-100" />}
                        onClick={() => handleOpenStoryboard(true)}
                        disabled={isProcessing || selectedSplitIndices.size === 0}
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800/80 disabled:text-slate-600 disabled:border-slate-800/80 text-white rounded-lg font-bold transition-all border border-emerald-500 flex items-center justify-center shadow-sm cursor-pointer"
                        title={selectedSplitIndices.size > 0 ? `Send ${selectedSplitIndices.size} Selected Slice(s) to Storyboard` : "Send Selected Slices to Storyboard (No slices selected)"}
                      />

                      {/* Send All Slices to Storyboard */}
                      <CustomizableButton
                        buttonId="carve_send_all"
                        defaultLabel="Send All"
                        defaultIcon={<SquareArrowRight className="w-4 h-4 text-purple-100" />}
                        onClick={() => handleOpenStoryboard(false)}
                        disabled={isProcessing}
                        className="p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800/80 disabled:text-slate-600 disabled:border-slate-800/80 text-white rounded-lg font-bold transition-all border border-purple-500 flex items-center justify-center shadow-sm cursor-pointer"
                        title="Send All Slices to Storyboard"
                      />

                      {/* Snapshot Reflecting Live Canvas Appearance -> Storyboard First */}
                      <CustomizableButton
                        buttonId="carve_snapshot_storyboard_first"
                        defaultLabel="Snapshot First"
                        defaultIcon={<Camera className="w-4 h-4 text-cyan-200" />}
                        onClick={handleCopyLiveCanvasSnapshotToStoryboardFirst}
                        disabled={isProcessing}
                        className="p-2 bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-800/80 disabled:text-slate-600 text-white rounded-lg font-bold transition-all border border-cyan-500/60 flex items-center justify-center shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        title="Capture snapshot reflecting exact live canvas appearance and copy to Storyboard first"
                      />

                      {/* Download Selected Slices ZIP */}
                      <CustomizableButton
                        buttonId="carve_zip_selected"
                        defaultLabel="ZIP Selected"
                        defaultIcon={<Archive className="w-4 h-4 text-amber-100" />}
                        onClick={() => handleDownload(true)}
                        disabled={isProcessing || selectedSplitIndices.size === 0}
                        className="p-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800/80 disabled:text-slate-600 disabled:border-slate-800/80 text-white rounded-lg font-bold transition-all border border-amber-500 flex items-center justify-center shadow-sm cursor-pointer"
                        title={selectedSplitIndices.size > 0 ? `Download ${selectedSplitIndices.size} Selected Slice(s) ZIP` : "Download Selected Slices ZIP (No slices selected)"}
                      />

                      {/* Download All Slices ZIP */}
                      <CustomizableButton
                        buttonId="carve_zip_all"
                        defaultLabel="ZIP All"
                        defaultIcon={<Download className="w-4 h-4" />}
                        onClick={() => handleDownload(false)}
                        disabled={isProcessing}
                        className="p-2 bg-[#10b981] hover:bg-emerald-400 disabled:bg-slate-800/80 disabled:text-slate-600 disabled:border-slate-850 text-[#020617] rounded-lg font-bold transition-all border border-emerald-500/30 flex items-center justify-center shadow-sm cursor-pointer"
                        title={`Download All ${numRows * numCols} Slices ZIP`}
                      />
                    </div>

                    {/* Toggle: Copy live canvas snapshot to Storyboard first */}
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] shadow-inner">
                      <CustomizableLabel
                        labelId="app_item_104"
                        as="label"
                        className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none"
                      >
                          {() => (
                              <>
                                <input
                          type="checkbox"
                          checked={copySnapshotFirst}
                          onChange={(e) => setCopySnapshotFirst(e.target.checked)}
                          className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                        />
                              <span className="font-semibold text-slate-200">{uiText("app.span.copy_canvas_snapshot_first", "Copy Canvas Snapshot First")}</span>
                              </>
                            )}
                      </CustomizableLabel>
                      <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                        <Camera className="w-2.5 h-2.5 text-cyan-400" />
                        {uiText("app.span.live_appearance", "Live Appearance")}
                      </span>
                    </div>

                    {/* Streamlined Smart Trim Asset Export Button */}
                    <div className="pt-1">
                      <CustomizableButton
                        buttonId="carve_smart_trim_export"
                        defaultLabel="Smart Trim Export (Alpha)"
                        defaultIcon={<Sparkles className="w-3.5 h-3.5 text-cyan-200 shrink-0" />}
                        onClick={() => handleSmartTrimGridExport(selectedSplitIndices.size > 0)}
                        disabled={isProcessing}
                        className="w-full py-1.5 px-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all border border-cyan-400/40 flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                        title={
                          selectedSplitIndices.size > 0
                            ? `Smart Trim & Export ${selectedSplitIndices.size} Selected Slice(s): Automatically removes outer padding based on alpha channel`
                            : `Smart Trim & Export All ${numRows * numCols} Slices: Automatically removes outer padding based on alpha channel`
                        }
                      />
                    </div>
                  </div>

                  {isAdjusting ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="space-y-0.5">
                          <CustomizableLabel
                            labelId="app_item_103"
                            as="label"
                            className="text-[9.5px] font-medium text-slate-400 block"
                          >
                              {() => (
                                  <>
                                    {uiText("app.label.rows", "Rows")}
                                  </>
                                )}
                          </CustomizableLabel>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={numRows}
                              onChange={(e) => setNumRows(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                              className="w-full bg-[#020617] border border-[#1e293b] rounded-lg pl-2.5 pr-6 py-1 text-xs font-semibold text-slate-100 focus:outline-none focus:border-[#10b981] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <div className="absolute right-1 flex flex-col gap-0.5">
                              <HoldButton
                                onAction={() => setNumRows((r) => Math.min(20, r + 1))}
                                className="p-0.5 hover:bg-[#1e293b] rounded text-slate-400 hover:text-[#10b981] transition-colors cursor-pointer"
                                title={uiText("app.hold_button.increase_rows_hold_for_continuous.title", "Increase Rows (Hold for continuous)")}
                              >
                                <ChevronUp className="w-2.5 h-2.5" />
                              </HoldButton>
                              <HoldButton
                                onAction={() => setNumRows((r) => Math.max(1, r - 1))}
                                className="p-0.5 hover:bg-[#1e293b] rounded text-slate-400 hover:text-[#10b981] transition-colors cursor-pointer"
                                title={uiText("app.hold_button.decrease_rows_hold_for_continuous.title", "Decrease Rows (Hold for continuous)")}
                              >
                                <ChevronDown className="w-2.5 h-2.5" />
                              </HoldButton>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <CustomizableLabel
                            labelId="app_item_102"
                            as="label"
                            className="text-[9.5px] font-medium text-slate-400 block"
                          >
                              {() => (
                                  <>
                                    {uiText("app.label.columns", "Columns")}
                                  </>
                                )}
                          </CustomizableLabel>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={numCols}
                              onChange={(e) => setNumCols(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                              className="w-full bg-[#020617] border border-[#1e293b] rounded-lg pl-2.5 pr-6 py-1 text-xs font-semibold text-slate-100 focus:outline-none focus:border-[#10b981] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <div className="absolute right-1 flex flex-col gap-0.5">
                              <HoldButton
                                onAction={() => setNumCols((c) => Math.min(20, c + 1))}
                                className="p-0.5 hover:bg-[#1e293b] rounded text-slate-400 hover:text-[#10b981] transition-colors cursor-pointer"
                                title={uiText("app.hold_button.increase_columns_hold_for_continuous.title", "Increase Columns (Hold for continuous)")}
                              >
                                <ChevronUp className="w-2.5 h-2.5" />
                              </HoldButton>
                              <HoldButton
                                onAction={() => setNumCols((c) => Math.max(1, c - 1))}
                                className="p-0.5 hover:bg-[#1e293b] rounded text-slate-400 hover:text-[#10b981] transition-colors cursor-pointer"
                                title={uiText("app.hold_button.decrease_columns_hold_for_continuous.title", "Decrease Columns (Hold for continuous)")}
                              >
                                <ChevronDown className="w-2.5 h-2.5" />
                              </HoldButton>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Set Default Slice Grid Button */}
                      <div className="pt-0.5 flex items-center justify-between gap-1 text-[10px]">
                        <CustomizableButton
                          buttonId="app_btn_101"
                          defaultIcon={<Bookmark className={cn("w-3 h-3 text-emerald-400 shrink-0", numRows === defaultNumRows && numCols === defaultNumCols && "fill-emerald-400/30")} />}
                          type="button"
onClick={() => handleSetDefaultGrid(numRows, numCols)}
className={cn(
                            "px-2 py-1 rounded-md border flex items-center gap-1 transition-all cursor-pointer font-medium text-[10px]",
                            numRows === defaultNumRows && numCols === defaultNumCols
                              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                              : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white"
                          )}
title={`Set current ${numRows}\u00d7${numCols} as default slice grid`}
                        >
                            {() => (
                                <>
                                  <span>
                            {numRows === defaultNumRows && numCols === defaultNumCols
                              ? `Default (${defaultNumRows}\u00d7${defaultNumCols})`
                              : `Set as Default (${numRows}\u00d7${numCols})`}
                          </span>
                                </>
                              )}
                        </CustomizableButton>

                        {(numRows !== defaultNumRows || numCols !== defaultNumCols) && (
                          <CustomizableButton
                            buttonId="app_btn_100"
                            defaultLabel={")"}
                            type="button"
onClick={() => {
                              setNumRows(defaultNumRows);
                              setNumCols(defaultNumCols);
                            }}
className="px-1.5 py-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer underline text-[9.5px]"
title={`Reset grid to saved default (${defaultNumRows}\u00d7${defaultNumCols})`}
                          >
                              {(ibcProps) => (
                                  <>
                                    {uiText("app.button.reset_2", "Reset (")}
                                  {defaultNumRows}
                                  {uiText("app.button.u00d7", "\\u00d7")}
                                  {defaultNumCols}
                                  {!ibcProps.isTextHidden ? ibcProps.label : null}
                                  </>
                                )}
                          </CustomizableButton>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-[#020617]/80 rounded-xl p-3 border border-[#1e293b] flex items-center justify-between shadow-inner">
                        <div className="flex gap-4">
                          <div className="text-center">
                            <span className="block text-lg font-bold text-slate-200 leading-none">{numRows}</span>
                            <span className="text-[9px] text-slate-400 font-bold">{uiText("app.span.rows", "Rows")}</span>
                          </div>
                          <div className="w-px bg-slate-850 self-stretch"></div>
                          <div className="text-center">
                            <span className="block text-lg font-bold text-slate-200 leading-none">{numCols}</span>
                            <span className="text-[9px] text-slate-400 font-bold">{uiText("app.span.cols", "Cols")}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-base font-bold text-[#10b981] leading-none">{numRows * numCols}</span>
                          <span className="text-[9px] text-slate-400 font-bold">{uiText("app.span.slices", "Slices")}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <CustomizableLabel
                          labelId="app_item_99"
                          as="label"
                          className="text-[10px] font-semibold text-slate-300"
                        >
                            {() => (
                                <>
                                  {uiText("app.label.format", "Format")}
                                </>
                              )}
                        </CustomizableLabel>
                        <div className="grid grid-cols-2 gap-2">
                          <CustomizableButton
                            buttonId="app_btn_98"
                            onClick={() => setFormat("image/png")}
className={cn(
                              "py-1.5 px-2 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                              format === "image/png"
                                ? "bg-[#10b981]/10 border-[#10b981] text-[#10b981] font-semibold"
                                : "bg-[#020617] border-[#1e293b] text-slate-400 hover:border-slate-700"
                            )}
                          >
                              {() => (
                                  <>
                                    {uiText("app.button.png", "PNG")}
                                  {format === "image/png" && <Check className="w-3 h-3" />}
                                  </>
                                )}
                          </CustomizableButton>
                          <CustomizableButton
                            buttonId="app_btn_97"
                            onClick={() => setFormat("image/jpeg")}
className={cn(
                              "py-1.5 px-2 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                              format === "image/jpeg"
                                ? "bg-[#10b981]/10 border-[#10b981] text-[#10b981] font-semibold"
                                : "bg-[#020617] border-[#1e293b] text-slate-400 hover:border-slate-700"
                            )}
                          >
                              {() => (
                                  <>
                                    {uiText("app.button.jpeg", "JPEG")}
                                  {format === "image/jpeg" && <Check className="w-3 h-3" />}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <CustomizableLabel
                          labelId="app_item_96"
                          as="label"
                          className="text-[10px] font-semibold text-slate-300 block"
                        >
                            {() => (
                                <>
                                  {uiText("app.label.slice_file_name_prefix", "Slice File Name Prefix")}
                                </>
                              )}
                        </CustomizableLabel>
                        <input
                          type="text"
                          value={slicePrefix}
                          onChange={(e) => setSlicePrefix(e.target.value)}
                          placeholder={uiText("app.input.e_g_book.placeholder", "e.g. BOOK")}
                          className="w-full bg-[#020617] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#10b981]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Layout Presets Section */}
                  <div className="space-y-2.5 pt-2.5 border-t border-[#1e293b]">
                    <CustomizableButton
                      buttonId="app_btn_95"
                      defaultIcon={<ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-transform duration-200",
                          isLayoutPresetsOpen && "rotate-180"
                        )}
                      />}
                      type="button"
onClick={() => setIsLayoutPresetsOpen(!isLayoutPresetsOpen)}
className="w-full flex items-center justify-between text-left cursor-pointer group"
                    >
                        {() => (
                            <>
                              <CustomizableLabel
                        labelId="app_item_94"
                        as="label"
                        className="text-[10px] font-bold text-slate-300 block cursor-pointer group-hover:text-emerald-400 transition-colors"
                      >
                          {() => (
                              <>
                                {uiText("app.label.layout_presets", "Layout Presets")}
                              </>
                            )}
                      </CustomizableLabel>
                            </>
                          )}
                    </CustomizableButton>

                    {isLayoutPresetsOpen && (
                      <div className="space-y-3 pt-1">
                        <p className="text-[9.5px] text-slate-400 leading-normal">
                          {uiText("app.p.instantly_divide_your_canvas_into_asymmetric", "Instantly divide your canvas into asymmetrical, dynamic comic-manga or overlapping panels.")}
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <CustomizableButton
                            buttonId="app_btn_93"
                            type="button"
onClick={() => handleApplyLayoutPreset("standard_grid")}
className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-[#10b981]/50 p-2 rounded-lg text-left transition-all cursor-pointer flex flex-col gap-1"
                          >
                              {() => (
                                  <>
                                    <span className="text-xs font-bold text-slate-200">{uiText("app.span.standard_grid", "Standard Grid")}</span>
                                  <span className="text-[9px] text-slate-400 leading-tight">{uiText("app.span.balanced_3x3_layout_cuts", "Balanced 3x3 layout cuts")}</span>
                                  </>
                                )}
                          </CustomizableButton>

                          <CustomizableButton
                            buttonId="app_btn_92"
                            type="button"
onClick={() => handleApplyLayoutPreset("asymmetrical_hero")}
className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-[#10b981]/50 p-2 rounded-lg text-left transition-all cursor-pointer flex flex-col gap-1"
                          >
                              {() => (
                                  <>
                                    <span className="text-xs font-bold text-[#10b981]">{uiText("app.span.big_center_hero", "Big Center Hero")}</span>
                                  <span className="text-[9px] text-slate-400 leading-tight">{uiText("app.span.massive_focal_center_panel", "Massive focal center panel")}</span>
                                  </>
                                )}
                          </CustomizableButton>

                          <CustomizableButton
                            buttonId="app_btn_91"
                            type="button"
onClick={() => handleApplyLayoutPreset("manga_slanted")}
className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-[#10b981]/50 p-2 rounded-lg text-left transition-all cursor-pointer flex flex-col gap-1"
                          >
                              {() => (
                                  <>
                                    <span className="text-xs font-bold text-rose-400">{uiText("app.span.slanted_slash", "Slanted Slash")}</span>
                                  <span className="text-[9px] text-slate-400 leading-tight">{uiText("app.span.action_diagonal_skewed_cuts", "Action diagonal skewed cuts")}</span>
                                  </>
                                )}
                          </CustomizableButton>

                          <CustomizableButton
                            buttonId="app_btn_90"
                            type="button"
onClick={() => handleApplyLayoutPreset("overlapping_right")}
className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-[#10b981]/50 p-2 rounded-lg text-left transition-all cursor-pointer flex flex-col gap-1"
                          >
                              {() => (
                                  <>
                                    <span className="text-xs font-bold text-indigo-400">{uiText("app.span.overlap_stack", "Overlap Stack")}</span>
                                  <span className="text-[9px] text-slate-400 leading-tight">{uiText("app.span.overlapping_right_tier_blocks", "Overlapping right tier blocks")}</span>
                                  </>
                                )}
                          </CustomizableButton>

                          <CustomizableButton
                            buttonId="app_btn_89"
                            type="button"
onClick={() => handleApplyLayoutPreset("cinematic_strip")}
className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-[#10b981]/50 p-2 rounded-lg text-left transition-all cursor-pointer flex flex-col gap-1 col-span-2"
                          >
                              {() => (
                                  <>
                                    <span className="text-xs font-bold text-emerald-400">{uiText("app.span.cinematic_panorama", "Cinematic Panorama")}</span>
                                  <span className="text-[9px] text-slate-400 leading-tight">{uiText("app.span.wide_middle_tier_with_slim_letterboxes", "Wide middle tier with slim letterboxes")}</span>
                                  </>
                                )}
                          </CustomizableButton>

                          <CustomizableButton
                            buttonId="app_btn_88"
                            type="button"
onClick={() => handleApplyLayoutPreset("golden_ratio")}
className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-[#10b981]/50 p-2 rounded-lg text-left transition-all cursor-pointer flex flex-col gap-1 col-span-2"
                          >
                              {() => (
                                  <>
                                    <span className="text-xs font-bold text-amber-400">{uiText("app.span.golden_ratio_phi", "Golden Ratio (Phi)")}</span>
                                  <span className="text-[9px] text-slate-400 leading-tight">{uiText("app.span.aesthetic_fibonacci_proportion_grid", "Aesthetic Fibonacci proportion grid")}</span>
                                  </>
                                )}
                          </CustomizableButton>
                        </div>

                        {/* Custom Skew Adjustment Slider */}
                        <div className="bg-[#020617]/50 p-2.5 rounded-lg border border-slate-850 space-y-1.5 mt-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-300">
                            <span className="font-semibold text-slate-400">{uiText("app.span.slash_skew_angle", "Slash Skew Angle:")}</span>
                            <span className="font-mono text-emerald-400 font-bold">{carverSkew}{uiText("app.span.u00b0", "\\u00b0")}</span>
                          </div>
                          <input
                            type="range"
                            min="-20"
                            max="20"
                            value={carverSkew}
                            onChange={(e) => setCarverSkew(parseInt(e.target.value))}
                            className="w-full accent-emerald-500 h-1 rounded bg-slate-800 cursor-ew-resize"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Slice Cut Line Configuration */}
                  <div className="space-y-2.5 pt-2.5 border-t border-[#1e293b]">
                    <CustomizableButton
                      buttonId="app_btn_87"
                      type="button"
onClick={() => setIsSliceLineSettingsOpen(!isSliceLineSettingsOpen)}
className="w-full flex items-center justify-between text-left cursor-pointer group"
                    >
                        {() => (
                            <>
                              <CustomizableLabel
                        labelId="label_trimfx_status"
                        defaultText="TrimFX"
                        defaultIcon={<Scissors className="w-3 h-3 text-slate-300" />}
                        className="text-[10px] font-bold text-slate-300 flex items-center gap-1 cursor-pointer group-hover:text-emerald-400 transition-colors"
                      />
                            <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-slate-400 font-mono">
                          {uiText("app.span.gap", "Gap: ")}{sliceLineThickness}{uiText("app.span.px_outer", "px | Outer: ")}{outerMargin}{uiText("app.span.px", "px")}{sliceCellPadding !== 0 ? ` | Pad: ${sliceCellPadding > 0 ? `+${sliceCellPadding}` : sliceCellPadding}px` : ""}
                        </span>
                        <ChevronDown
                          className={cn(
                            "w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-transform duration-200",
                            isSliceLineSettingsOpen && "rotate-180"
                          )}
                        />
                      </div>
                            </>
                          )}
                    </CustomizableButton>

                    {isSliceLineSettingsOpen && (
                      <div className="space-y-2 text-[10px] pt-1">
                        {/* Auto-Detect Borders Button */}
                        <CustomizableButton
                          buttonId="carve_auto_detect"
                          defaultLabel={isAutoDetecting ? "Analyzing Borders..." : "Auto-Detect Borders"}
                          defaultIcon={<Sparkles className={cn("w-3.5 h-3.5 text-[#10b981] transition-transform duration-300 group-hover:scale-110", isAutoDetecting && "animate-spin")} />}
                          onClick={handleAutoDetectBorders}
                          disabled={isAutoDetecting || (!croppedImageSrc && !imageSrc)}
                          className="w-full py-1.5 px-2 bg-[#10b981]/10 hover:bg-[#10b981]/20 active:bg-[#10b981]/30 border border-[#10b981]/30 hover:border-[#10b981]/60 rounded-lg text-[#10b981] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-sm group"
                          title="Auto-detect border margins and cut gap thickness using image contrast analysis"
                        />

                        {autoDetectNotice && (
                          <div className="text-[9.5px] font-mono text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 px-2 py-1 rounded text-center animate-fade-in font-semibold">
                            {uiText("app.div.u2728", "\\u2728 ")}{autoDetectNotice}
                          </div>
                        )}

                        {/* Combined F-Trim, Cut Gap & Color Selector Row */}
                        <div className="bg-[#020617]/60 p-2 rounded-lg border border-[#1e293b] flex items-center justify-between gap-1.5 flex-wrap sm:flex-nowrap">
                          {/* F-Trim */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-semibold text-slate-300 shrink-0">
                              {uiText("app.span.f_trim", "F-Trim")}
                            </span>
                            <div className="flex items-center gap-1 bg-[#020617] border border-[#1e293b] rounded px-1.5 py-0.5 shadow-inner">
                              <span className="text-xs font-mono font-bold text-[#10b981] min-w-[24px] text-right select-none">
                                {outerMargin}{uiText("app.span.px_2", "px")}
                              </span>
                              <div className="flex flex-col border-l border-[#1e293b] pl-0.5">
                                <HoldButton
                                  onAction={() => setOuterMargin((v) => Math.min(200, v + 1))}
                                  className="p-0 hover:bg-[#0f172a] text-slate-300 hover:text-[#10b981] active:text-[#10b981] rounded transition-colors cursor-pointer"
                                  title={uiText("app.hold_button.increase_f_trim_hold_for_continuous.title", "Increase F-Trim (Hold for continuous)")}
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </HoldButton>
                                <HoldButton
                                  onAction={() => setOuterMargin((v) => Math.max(0, v - 1))}
                                  className="p-0 hover:bg-[#0f172a] text-slate-300 hover:text-[#10b981] active:text-[#10b981] rounded transition-colors cursor-pointer"
                                  title={uiText("app.hold_button.decrease_f_trim_hold_for_continuous.title", "Decrease F-Trim (Hold for continuous)")}
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </HoldButton>
                              </div>
                            </div>
                          </div>

                          {/* Independent Gap Controls (W, Lock, H) */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-semibold text-slate-300 shrink-0" title={uiText("app.span.column_gap_width.title", "Column Gap Width")}>
                              {uiText("app.span.gap_w", "Gap W")}
                            </span>
                            <div className="flex items-center gap-1 bg-[#020617] border border-[#1e293b] rounded px-1.5 py-0.5 shadow-inner">
                              <span className="text-xs font-mono font-bold text-[#10b981] min-w-[20px] text-right select-none">
                                {sliceLineThicknessX}{uiText("app.span.px_3", "px")}
                              </span>
                              <div className="flex flex-col border-l border-[#1e293b] pl-0.5">
                                <HoldButton
                                  onAction={() => {
                                    setSliceLineThicknessX((x) => {
                                      const next = Math.min(200, x + 1);
                                      if (isGapLocked) setSliceLineThicknessY(next);
                                      setSliceLineThickness(next);
                                      return next;
                                    });
                                  }}
                                  className="p-0 hover:bg-[#0f172a] text-slate-300 hover:text-[#10b981] active:text-[#10b981] rounded transition-colors cursor-pointer"
                                  title={uiText("app.hold_button.increase_column_gap_hold_for_continuous.title", "Increase Column Gap (Hold for continuous)")}
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </HoldButton>
                                <HoldButton
                                  onAction={() => {
                                    setSliceLineThicknessX((x) => {
                                      const next = Math.max(0, x - 1);
                                      if (isGapLocked) setSliceLineThicknessY(next);
                                      setSliceLineThickness(next);
                                      return next;
                                    });
                                  }}
                                  className="p-0 hover:bg-[#0f172a] text-slate-300 hover:text-[#10b981] active:text-[#10b981] rounded transition-colors cursor-pointer"
                                  title={uiText("app.hold_button.decrease_column_gap_hold_for_continuous.title", "Decrease Column Gap (Hold for continuous)")}
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </HoldButton>
                              </div>
                            </div>

                            {/* Lock / Unlock Toggle */}
                            <CustomizableButton
                              buttonId="app_btn_86"
                              type="button"
onClick={() => setIsGapLocked((prev) => !prev)}
className={cn(
                                "p-1 rounded border transition-colors cursor-pointer",
                                isGapLocked
                                  ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40"
                                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                              )}
title={
                                isGapLocked
                                  ? "Gap W and H are LOCKED together. Click to unlock independent W/H gap adjustments."
                                  : "Gap W and H are UNLOCKED (independent). Click to lock together."
                              }
                            >
                                {() => (
                                    <>
                                      {isGapLocked ? <Link className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
                                    </>
                                  )}
                            </CustomizableButton>

                            <span className="text-[10px] font-semibold text-slate-300 shrink-0" title={uiText("app.span.row_gap_height.title", "Row Gap Height")}>
                              {uiText("app.span.gap_h", "Gap H")}
                            </span>
                            <div className="flex items-center gap-1 bg-[#020617] border border-[#1e293b] rounded px-1.5 py-0.5 shadow-inner">
                              <span className="text-xs font-mono font-bold text-[#10b981] min-w-[20px] text-right select-none">
                                {sliceLineThicknessY}{uiText("app.span.px_4", "px")}
                              </span>
                              <div className="flex flex-col border-l border-[#1e293b] pl-0.5">
                                <HoldButton
                                  onAction={() => {
                                    setSliceLineThicknessY((y) => {
                                      const next = Math.min(200, y + 1);
                                      if (isGapLocked) setSliceLineThicknessX(next);
                                      setSliceLineThickness(next);
                                      return next;
                                    });
                                  }}
                                  className="p-0 hover:bg-[#0f172a] text-slate-300 hover:text-[#10b981] active:text-[#10b981] rounded transition-colors cursor-pointer"
                                  title={uiText("app.hold_button.increase_row_gap_hold_for_continuous.title", "Increase Row Gap (Hold for continuous)")}
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </HoldButton>
                                <HoldButton
                                  onAction={() => {
                                    setSliceLineThicknessY((y) => {
                                      const next = Math.max(0, y - 1);
                                      if (isGapLocked) setSliceLineThicknessX(next);
                                      setSliceLineThickness(next);
                                      return next;
                                    });
                                  }}
                                  className="p-0 hover:bg-[#0f172a] text-slate-300 hover:text-[#10b981] active:text-[#10b981] rounded transition-colors cursor-pointer"
                                  title={uiText("app.hold_button.decrease_row_gap_hold_for_continuous.title", "Decrease Row Gap (Hold for continuous)")}
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </HoldButton>
                              </div>
                            </div>
                          </div>

                          {/* Color Swatch Button */}
                          <CustomizableButton
                            buttonId="app_btn_85"
                            type="button"
onClick={() => {
                              const colors = ["#F43F5E", "#10b981", "#06b6d4", "#f59e0b", "#a855f7", "#ffffff", "#000000"];
                              const currentIdx = colors.findIndex((c) => c.toLowerCase() === sliceLineColor.toLowerCase());
                              const nextIdx = (currentIdx + 1) % colors.length;
                              setSliceLineColor(colors[nextIdx]);
                            }}
className="flex items-center justify-center bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] hover:border-[#10b981]/50 rounded p-1.5 transition-all cursor-pointer group shadow-inner"
title={`Cut Frame Color: ${sliceLineColor} (Click to cycle)`}
                          >
                              {() => (
                                  <>
                                    <div
                              className="w-4 h-4 rounded-full border border-slate-500 group-hover:scale-110 transition-transform shrink-0 shadow-sm"
                              style={{ backgroundColor: sliceLineColor }}
                            />
                                  </>
                                )}
                          </CustomizableButton>
                        </div>

                        {/* Cell Internal Padding Slider Card */}
                        <div className="bg-[#020617]/70 p-2 rounded-lg border border-[#1e293b] space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                              <SlidersHorizontal className="w-3.5 h-3.5 text-[#10b981]" />
                              <span>{uiText("app.span.cell_internal_padding", "Cell Internal Padding")}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span
                                className={cn(
                                  "font-mono font-bold text-[11px] px-1.5 py-0.5 rounded",
                                  sliceCellPadding === 0
                                    ? "bg-slate-800 text-slate-300 border border-slate-700"
                                    : sliceCellPadding < 0
                                    ? "bg-amber-950/70 text-amber-300 border border-amber-700/60"
                                    : "bg-emerald-950/70 text-emerald-300 border border-emerald-700/60"
                                )}
                              >
                                {sliceCellPadding > 0 ? `+${sliceCellPadding}` : sliceCellPadding}{uiText("app.span.px_5", "px")}{" "}
                                <span className="text-[9px] font-normal opacity-85">
                                  {sliceCellPadding === 0
                                    ? "(Flush)"
                                    : sliceCellPadding < 0
                                    ? "(Touch Edges)"
                                    : "(Inset)"}
                                </span>
                              </span>
                              {sliceCellPadding !== 0 && (
                                <CustomizableButton
                                  buttonId="app_btn_84"
                                  defaultIcon={<RotateCcw className="w-3 h-3" />}
                                  type="button"
onClick={() => setSliceCellPadding(0)}
className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded cursor-pointer transition-colors"
title={uiText("app.button.reset_cell_padding_to_0px_flush_with_cut_bou.title", "Reset cell padding to 0px (Flush with cut boundaries)")}
                                />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[9px] font-mono text-amber-400 shrink-0 select-none">{uiText("app.span.50px", "-50px")}</span>
                            <input
                              type="range"
                              min="-50"
                              max="50"
                              step="1"
                              value={sliceCellPadding}
                              onChange={(e) => setSliceCellPadding(parseInt(e.target.value) || 0)}
                              className="w-full accent-emerald-500 h-1.5 rounded bg-slate-800 cursor-ew-resize"
                            />
                            <span className="text-[9px] font-mono text-emerald-400 shrink-0 select-none">{uiText("app.span.50px_2", "+50px")}</span>
                          </div>

                          <div className="flex items-center justify-between gap-1 pt-0.5 flex-wrap">
                            <span className="text-[9px] text-slate-400">
                              {uiText("app.span.negative_expands_content_to_touch_edges", "Negative expands content to touch edges")}
                            </span>
                            <div className="flex items-center gap-1">
                              <CustomizableButton
                                buttonId="app_btn_83"
                                type="button"
onClick={() => setSliceCellPadding(-15)}
className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer border",
                                  sliceCellPadding === -15
                                    ? "bg-amber-900/60 border-amber-600 text-amber-200"
                                    : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                                )}
title={uiText("app.button.expand_slice_bounds_by_15px_so_content_touch.title", "Expand slice bounds by 15px so content touches/bleeds past edges")}
                              >
                                  {() => (
                                      <>
                                        {uiText("app.button.15px", "-15px")}
                                      </>
                                    )}
                              </CustomizableButton>
                              <CustomizableButton
                                buttonId="app_btn_82"
                                type="button"
onClick={() => setSliceCellPadding(-5)}
className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer border",
                                  sliceCellPadding === -5
                                    ? "bg-amber-900/60 border-amber-600 text-amber-200"
                                    : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                                )}
title={uiText("app.button.expand_slice_bounds_by_5px.title", "Expand slice bounds by 5px")}
                              >
                                  {() => (
                                      <>
                                        {uiText("app.button.5px", "-5px")}
                                      </>
                                    )}
                              </CustomizableButton>
                              <CustomizableButton
                                buttonId="app_btn_81"
                                type="button"
onClick={() => setSliceCellPadding(0)}
className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer border",
                                  sliceCellPadding === 0
                                    ? "bg-emerald-900/60 border-emerald-600 text-emerald-200"
                                    : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                                )}
title={uiText("app.button.zero_padding_flush_with_grid_cut_lines.title", "Zero padding (Flush with grid cut lines)")}
                              >
                                  {() => (
                                      <>
                                        {uiText("app.button.0px", "0px")}
                                      </>
                                    )}
                              </CustomizableButton>
                              <CustomizableButton
                                buttonId="app_btn_80"
                                type="button"
onClick={() => setSliceCellPadding(10)}
className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer border",
                                  sliceCellPadding === 10
                                    ? "bg-cyan-900/60 border-cyan-600 text-cyan-200"
                                    : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                                )}
title={uiText("app.button.inset_slice_bounds_by_10px_internal_padding.title", "Inset slice bounds by 10px internal padding")}
                              >
                                  {() => (
                                      <>
                                        {uiText("app.button.10px", "+10px")}
                                      </>
                                    )}
                              </CustomizableButton>
                            </div>
                          </div>
                        </div>

                        {/* Style & Handle Toggles */}
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-medium mb-1">{uiText("app.span.line_style", "Line Style:")}</span>
                            <CustomizableButton
                              buttonId="app_btn_79"
                              defaultIcon={<RefreshCw className="w-3 h-3 text-slate-400 group-hover:text-[#10b981] transition-transform duration-300 group-hover:rotate-180" />}
                              type="button"
onClick={() => {
                                const styles: Array<"solid" | "dashed" | "dotted"> = ["solid", "dashed", "dotted"];
                                const nextIdx = (styles.indexOf(sliceLineStyle) + 1) % styles.length;
                                setSliceLineStyle(styles[nextIdx]);
                              }}
className="w-full py-1 px-2 bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] rounded-lg text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer group"
                            >
                                {() => (
                                    <>
                                      <span className="capitalize font-mono text-[#10b981] font-bold text-[11px]">{sliceLineStyle}</span>
                                    </>
                                  )}
                            </CustomizableButton>
                          </div>

                          <div>
                            <span className="text-[9px] text-slate-400 block font-medium mb-1">{uiText("app.span.pixel_labels", "Pixel Labels:")}</span>
                            <CustomizableButton
                              buttonId="app_btn_78"
                              type="button"
onClick={() => setShowPixelLabels(!showPixelLabels)}
className={cn(
                                "w-full py-1 px-2 border rounded-lg text-[11px] font-semibold flex items-center justify-center transition-colors cursor-pointer",
                                showPixelLabels
                                  ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/50"
                                  : "bg-[#020617] text-slate-400 border-[#1e293b]"
                              )}
                            >
                                {() => (
                                    <>
                                      {showPixelLabels ? "Visible" : "Hidden"}
                                    </>
                                  )}
                            </CustomizableButton>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Split Grid Numbering & Sequence controls */}
                  <div className="space-y-2.5 pt-2.5 border-t border-[#1e293b]">
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-medium mb-1">{uiText("app.span.grid_flow", "Grid Flow:")}</span>
                        <div className="flex bg-[#020617] p-0.5 rounded-lg border border-[#1e293b] text-[10px]">
                          <CustomizableButton
                            buttonId="app_btn_77"
                            type="button"
onClick={() => setNumberingFlow("horizontal")}
className={cn(
                              "flex-1 py-1 rounded-md text-center font-semibold transition-all cursor-pointer",
                              numberingFlow === "horizontal"
                                ? "bg-[#0f172a] text-[#10b981] shadow-sm font-bold"
                                : "text-slate-400 hover:text-slate-200"
                            )}
                          >
                              {() => (
                                  <>
                                    {uiText("app.button.horizontal", "Horizontal")}
                                  </>
                                )}
                          </CustomizableButton>
                          <CustomizableButton
                            buttonId="app_btn_76"
                            type="button"
onClick={() => setNumberingFlow("vertical")}
className={cn(
                              "flex-1 py-1 rounded-md text-center font-semibold transition-all cursor-pointer",
                              numberingFlow === "vertical"
                                ? "bg-[#0f172a] text-[#10b981] shadow-sm font-bold"
                                : "text-slate-400 hover:text-slate-200"
                            )}
                          >
                              {() => (
                                  <>
                                    {uiText("app.button.vertical", "Vertical")}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] text-slate-400 block font-medium mb-1">{uiText("app.span.naming_format", "Naming Format:")}</span>
                        <div className="flex bg-[#020617] p-0.5 rounded-lg border border-[#1e293b] text-[10px]">
                          <CustomizableButton
                            buttonId="app_01_02"
                            defaultLabel={"01, 02..."}
                            type="button"
onClick={() => setNamingStyle("sequential")}
className={cn(
                              "flex-1 py-1 rounded-md text-center font-semibold transition-all cursor-pointer",
                              namingStyle === "sequential"
                                ? "bg-[#0f172a] text-[#10b981] shadow-sm font-bold"
                                : "text-slate-400 hover:text-slate-200"
                            )}
                          />
                          <CustomizableButton
                            buttonId="app_btn_75"
                            type="button"
onClick={() => setNamingStyle("grid")}
className={cn(
                              "flex-1 py-1 rounded-md text-center font-semibold transition-all cursor-pointer",
                              namingStyle === "grid"
                                ? "bg-[#0f172a] text-[#10b981] shadow-sm font-bold"
                                : "text-slate-400 hover:text-slate-200"
                            )}
                          >
                              {() => (
                                  <>
                                    {uiText("app.button.r1_c1", "R1-C1")}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Storyboard Sidebar */}
              {mode === "storyboard" && (
                <div className="flex-1 flex flex-col select-none overflow-hidden h-full">
                  <div className="p-2.5 border-b border-[#1e293b] bg-[#020617]/50 flex items-center justify-between gap-1.5 relative">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <CustomizableLabel
                        labelId="label_asset_pool_section"
                        defaultText="Assets"
                        defaultIcon={<LayoutGrid className="w-3.5 h-3.5 text-[#10b981]" />}
                        className="text-xs font-bold text-slate-200 flex items-center gap-1 shrink-0"
                      />
                      {!isStoryboardVisible && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-semibold shrink-0">
                          {uiText("app.span.expanded_canvas_closed", "Expanded (Canvas Closed)")}
                        </span>
                      )}
                      <CustomizableLabel
                        labelId="app_item_74"
                        defaultIcon={<ArrowUpDown className="w-3 h-3 text-[#10b981]" />}
                        as="label"
                        className="flex items-center gap-1 text-[10px] font-semibold text-slate-300 cursor-pointer select-none shrink-0"
title={uiText("app.label.reverse_insert_order.title", "Reverse Insert Order")}
                      >
                          {() => (
                              <>
                                <input
                          type="checkbox"
                          checked={isReverseInsert}
                          onChange={(e) => setIsReverseInsert(e.target.checked)}
                          className="rounded bg-[#020617] border-[#1e293b] text-[#10b981] focus:ring-0 cursor-pointer w-3 h-3"
                        />
                              </>
                            )}
                      </CustomizableLabel>
                      <CustomizableButton
                        buttonId="app_btn_73"
                        onClick={toggleSelectAllSlices}
className="text-[10px] text-[#10b981] hover:text-emerald-300 font-semibold cursor-pointer shrink-0"
                      >
                          {() => (
                              <>
                                {selectedSliceUrls.size === storyboardSlices.length && storyboardSlices.length > 0
                          ? "Deselect All"
                          : `Select All (${storyboardSlices.length})`}
                              </>
                            )}
                      </CustomizableButton>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Background Color Picker Menu */}
                      <div className="relative" ref={carvedSlicesColorMenuRef}>
                        <CustomizableButton
                          buttonId="app_btn_72"
                          type="button"
onClick={() => setIsCarvedSlicesColorMenuOpen((prev) => !prev)}
className="p-1.5 bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] hover:border-cyan-500/40 rounded-xl text-cyan-400 transition-all cursor-pointer flex items-center justify-center shadow-sm"
title={uiText("app.button.change_carved_slices_background_color.title", "Change Carved Slices Background Color")}
                        >
                            {() => (
                                <>
                                  <div
                            className="w-3.5 h-3.5 rounded-full border border-cyan-400/80 shadow-sm"
                            style={{ backgroundColor: carvedSlicesBgColor }}
                          />
                                </>
                              )}
                        </CustomizableButton>

                        {isCarvedSlicesColorMenuOpen && (
                          <div className="absolute right-0 top-full mt-1.5 w-44 p-2 bg-[#0a1120] border border-[#1e293b] rounded-xl shadow-2xl z-50 text-xs space-y-2 backdrop-blur-md">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                              <span className="font-bold text-slate-200 flex items-center gap-1 text-[10px]">
                                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                                {uiText("app.span.slice_color", "Slice color")}
                              </span>
                              <CustomizableButton
                                buttonId="app_btn_71"
                                onClick={() => setCarvedSlicesBgColor("#0f172a")}
className="text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                              >
                                  {() => (
                                      <>
                                        {uiText("app.button.reset_3", "Reset")}
                                      </>
                                    )}
                              </CustomizableButton>
                            </div>
                            <div className="flex items-center justify-between gap-1.5 pt-1">
                              <span className="text-[10px] text-slate-400">{uiText("app.span.color", "Color:")}</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="color"
                                  value={carvedSlicesBgColor}
                                  onChange={(e) => setCarvedSlicesBgColor(e.target.value)}
                                  className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent p-0"
                                />
                                <input
                                  type="text"
                                  value={carvedSlicesBgColor}
                                  onChange={(e) => setCarvedSlicesBgColor(e.target.value)}
                                  className="w-16 px-1.5 py-0.5 bg-[#020617] border border-slate-800 rounded text-[10px] font-mono text-slate-200 uppercase text-center focus:border-cyan-400 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Smart Auto-Crop & Trim All Assets Button */}
                      <CustomizableButton
                        buttonId="storyboard_trim_all_assets"
                        defaultLabel="Smart Trim"
                        defaultIcon={<CropIcon className="w-3.5 h-3.5 text-cyan-400" />}
                        onClick={() => handleOpenSmartTrim("storyboard")}
                        disabled={storyboardSlices.length === 0}
                        className="p-1.5 bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] hover:border-cyan-500/40 rounded-xl text-cyan-400 transition-all cursor-pointer flex items-center justify-center shadow-sm disabled:opacity-30 disabled:pointer-events-none shrink-0"
                        title="Smart Alpha Trim & Crop Assets"
                      />

                      {/* Set Present State as Default */}
                      <CustomizableButton
                        buttonId="app_btn_70"
                        defaultIcon={<Bookmark className="w-3.5 h-3.5 text-amber-400" />}
                        type="button"
onClick={handleSavePresentStateAsDefault}
className="p-1.5 bg-[#020617] hover:bg-amber-950/70 border border-[#1e293b] hover:border-amber-500/50 rounded-xl text-amber-400 transition-all cursor-pointer flex items-center justify-center shadow-sm active:scale-95 shrink-0"
title={uiText("app.button.present_state_as_default_captures_storyboard.title", "Present State as Default: Captures storyboard's present slots, sliced fragments, layout, cell mode, button state and sorting configuration as its persistent default state (STORYBOARD_DEFAULT_STATE_KEY)")}
                      />

                      {/* Restore Default State */}
                      <CustomizableButton
                        buttonId="app_btn_69"
                        defaultIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-300" />}
                        type="button"
onClick={handleRestoreDefaultState}
disabled={!savedStoryboardDefaultInfo}
className={cn(
                          "p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shadow-sm active:scale-95 shrink-0",
                          savedStoryboardDefaultInfo
                            ? "bg-[#020617] hover:bg-amber-950/70 border-[#1e293b] hover:border-amber-500/50 text-amber-300"
                            : "bg-[#020617] border-[#1e293b]/40 text-slate-600 opacity-40 cursor-not-allowed"
                        )}
title={
                          savedStoryboardDefaultInfo
                            ? `Restore Storyboard to saved default state (${savedStoryboardDefaultInfo.slotsCount} slots, ${savedStoryboardDefaultInfo.slicesCount} slices)`
                            : "Restore Storyboard to saved default state (no saved default state yet)"
                        }
                      />

                      {/* Expand Carved Slices & Close Canvas Button */}
                      <CustomizableButton
                        buttonId="app_btn_68"
                        type="button"
onClick={() => setIsStoryboardVisible((prev) => !prev)}
className={cn(
                          "p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shadow-sm shrink-0",
                          !isStoryboardVisible
                            ? "bg-cyan-950/90 hover:bg-cyan-900 border-cyan-500 text-cyan-200 shadow-cyan-950/50 ring-1 ring-cyan-400/40"
                            : "bg-[#020617] hover:bg-[#0f172a] border-[#1e293b] hover:border-cyan-400/50 text-cyan-400"
                        )}
title={
                          !isStoryboardVisible
                            ? "Restore Canvas & Normal Sidebar View"
                            : "Close Canvas & Expand Asset Slices Panel"
                        }
                      >
                          {() => (
                              <>
                                {!isStoryboardVisible ? (
                          <Minimize2 className="w-3.5 h-3.5 text-cyan-300" />
                        ) : (
                          <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                              </>
                            )}
                      </CustomizableButton>

                      {/* Clear Assets */}
                      <CustomizableButton
                        buttonId="app_btn_67"
                        defaultIcon={<RotateCcw className="w-3.5 h-3.5 text-rose-400" />}
                        type="button"
onClick={() => {
                          setStoryboardSlices([]);
                          setSelectedSliceUrls(new Set());
                        }}
disabled={storyboardSlices.length === 0}
className="p-1.5 bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] hover:border-rose-500/40 rounded-xl text-rose-400 transition-all cursor-pointer flex items-center justify-center shadow-sm disabled:opacity-30 disabled:pointer-events-none shrink-0"
title={uiText("app.button.clear_assets.title", "Clear Assets")}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-[#020617]/60 border-b border-[#1e293b] space-y-2">
                    <div className="grid grid-cols-3 gap-1">
                      <CustomizableButton
                        buttonId="app_btn_66"
                        onClick={() => handleMultiInsert("overwrite")}
title={uiText("app.button.clears_the_storyboard_completely_first_then.title", "Clears the storyboard completely first, then inserts selected or all carved slices sequentially from slot 1.")}
className="py-1 px-1 bg-[#10b981]/5 hover:bg-[#10b981]/15 text-[10px] rounded-lg font-semibold text-[#10b981] border border-[#10b981]/20 flex flex-col items-center justify-center gap-0.5 cursor-pointer leading-tight transition-all"
                      >
                          {() => (
                              <>
                                <span>{uiText("app.span.overwrite", "Overwrite")}</span>
                              <span className="text-[8px] text-slate-500 font-normal">{uiText("app.span.from_slot_1", "From Slot 1")}</span>
                              </>
                            )}
                      </CustomizableButton>
                      <CustomizableButton
                        buttonId="app_btn_65"
                        onClick={() => handleMultiInsert("fill-empties")}
title={uiText("app.button.sequentially_fills_only_the_empty_storyboard.title", "Sequentially fills only the empty storyboard slots. Adds slots at the end if there are more slices.")}
className="py-1 px-1 bg-sky-500/5 hover:bg-sky-500/15 text-[10px] rounded-lg font-semibold text-sky-400 border border-sky-500/20 flex flex-col items-center justify-center gap-0.5 cursor-pointer leading-tight transition-all"
                      >
                          {() => (
                              <>
                                <span>{uiText("app.span.fill_empties", "Fill Empties")}</span>
                              <span className="text-[8px] text-slate-500 font-normal">{uiText("app.span.keep_filled", "Keep Filled")}</span>
                              </>
                            )}
                      </CustomizableButton>
                      <CustomizableButton
                        buttonId="app_btn_64"
                        onClick={() => handleMultiInsert("append")}
title={uiText("app.button.appends_all_selected_slices_after_the_last_f.title", "Appends all selected slices after the last filled storyboard slot.")}
className="py-1 px-1 bg-purple-500/5 hover:bg-purple-500/15 text-[10px] rounded-lg font-semibold text-purple-400 border border-purple-500/20 flex flex-col items-center justify-center gap-0.5 cursor-pointer leading-tight transition-all"
                      >
                          {() => (
                              <>
                                <span>{uiText("app.span.append", "Append")}</span>
                              <span className="text-[8px] text-slate-500 font-normal">{uiText("app.span.at_the_end", "At the End")}</span>
                              </>
                            )}
                      </CustomizableButton>
                    </div>

                    {selectedSliceUrls.size > 0 && (
                      <p className="text-[9px] text-[#10b981]/90 text-center font-medium bg-[#10b981]/5 py-1 px-2 border border-[#10b981]/10 rounded-lg">
                        {uiText("app.p.applying_to", "Applying to ")}{selectedSliceUrls.size}{uiText("app.p.selected_slices", " selected slices")}
                      </p>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {/* Expanded Mode Status & Quick Restore Bar */}
                    {!isStoryboardVisible && (
                      <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs text-cyan-200 shadow-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <Maximize2 className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="text-[11px] font-medium truncate">{uiText("app.span.asset_slices_panel_is_expanded_full_width_st", "Asset Slices Panel is expanded full-width. Storyboard canvas is closed.")}</span>
                        </div>
                        <CustomizableButton
                          buttonId="app_btn_63"
                          defaultIcon={<Minimize2 className="w-3.5 h-3.5" />}
                          type="button"
onClick={() => setIsStoryboardVisible(true)}
className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-bold rounded-lg shadow transition-all cursor-pointer shrink-0 flex items-center gap-1"
                        >
                            {() => (
                                <>
                                  <span>{uiText("app.span.restore_canvas", "Restore Canvas")}</span>
                                </>
                              )}
                        </CustomizableButton>
                      </div>
                    )}

                    {/* Multi-Crops available banner in Storyboard Mode */}
                    {multiCrops.length > 0 && (
                      <div className="bg-indigo-950/80 p-2.5 rounded-xl border border-indigo-500/50 space-y-2 shadow-xl">
                        <div className="flex items-center justify-between text-[11px] font-bold text-indigo-200">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            {multiCrops.length}{uiText("app.span.multi_crop", " Multi-Crop")}{multiCrops.length > 1 ? "s" : ""}{uiText("app.span.available", " Available")}
                          </span>
                          <CustomizableButton
                            buttonId="app_btn_62"
                            type="button"
onClick={() => setMultiCrops([])}
className="text-[10px] text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
title={uiText("app.button.clear_multi_crops.title", "Clear multi-crops")}
                          >
                              {() => (
                                  <>
                                    {uiText("app.button.clear", "Clear")}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>
                        <p className="text-[10px] text-indigo-300/80 leading-tight">
                          {uiText("app.p.import_multi_crops_from_crop_mode_into_story", "Import multi-crops from Crop mode into Storyboard:")}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                          <CustomizableButton
                            buttonId="app_btn_61"
                            defaultIcon={<Plus className="w-3 h-3" />}
                            type="button"
onClick={() => handleApplyMultiCrops("storyboard-slices")}
className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
title={uiText("app.button.import_all_multi_crops_into_asset_organizer.title", "Import all multi-crops into Asset Organizer slices")}
                          >
                              {() => (
                                  <>
                                    {uiText("app.button.to_slices", "To Slices")}
                                  </>
                                )}
                          </CustomizableButton>
                          <CustomizableButton
                            buttonId="app_btn_60"
                            defaultIcon={<Sparkles className="w-3 h-3" />}
                            type="button"
onClick={() => handleApplyMultiCrops("storyboard-slots")}
className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
title={uiText("app.button.import_all_multi_crops_directly_to_storyboar.title", "Import all multi-crops directly to Storyboard Grid Slots")}
                          >
                              {() => (
                                  <>
                                    {uiText("app.button.fill_grid_slots", "Fill Grid Slots")}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>
                      </div>
                    )}

                    {/* Carved Slices Sidebar Selection Action Banner */}
                    <AnimatePresence>
                      {selectedSliceUrls.size > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="p-2.5 bg-[#0b1b17] border border-emerald-500/50 rounded-xl space-y-2 shadow-xl backdrop-blur-md"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300">
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{selectedSliceUrls.size}{uiText("app.span.slice", " slice")}{selectedSliceUrls.size === 1 ? "" : "s"}{uiText("app.span.selected_3", " selected")}</span>
                            </div>
                            <CustomizableButton
                              buttonId="app_btn_59"
                              type="button"
onClick={handleClearSliceSelection}
className="text-[9px] text-slate-400 hover:text-rose-300 px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800 transition-colors cursor-pointer"
title={uiText("app.button.clear_slice_selection.title", "Clear slice selection")}
                            >
                                {() => (
                                    <>
                                      {uiText("app.button.clear_2", "Clear")}
                                    </>
                                  )}
                            </CustomizableButton>
                          </div>

                          <div className="grid grid-cols-4 gap-1 text-[10px]">
                            <CustomizableButton
                              buttonId="app_btn_58"
                              defaultIcon={<Tag className="w-3 h-3 text-slate-950 shrink-0" />}
                              type="button"
onClick={() => handleOpenRenameStudio()}
className="py-1 px-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-black transition-all flex items-center justify-center gap-1 shadow cursor-pointer active:scale-95"
title={uiText("app.button.send_selected_slices_to_rename_studio.title", "Send selected slices to Rename Studio")}
                            >
                                {() => (
                                    <>
                                      <span className="truncate">{uiText("app.span.rename", "Rename")}</span>
                                    </>
                                  )}
                            </CustomizableButton>
                            <CustomizableButton
                              buttonId="storyboard_slices_smart_trim"
                              defaultLabel="Smart Trim"
                              defaultIcon={<CropIcon className="w-3 h-3 text-cyan-200 shrink-0" />}
                              onClick={() => handleOpenSmartTrim("storyboard")}
                              className="py-1 px-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-1 shadow cursor-pointer active:scale-95"
                              title="Smart Auto-Crop & Alpha Trim selected slices"
                            />
                            <CustomizableButton
                              buttonId="app_btn_57"
                              defaultIcon={<Download className="w-3 h-3 text-cyan-400 shrink-0" />}
                              type="button"
onClick={handleDownloadSelectedSlices}
className="py-1 px-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 rounded-lg font-bold border border-cyan-500/40 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
title={uiText("app.button.download_selected_slices_as_zip.title", "Download selected slices as ZIP")}
                            >
                                {() => (
                                    <>
                                      <span className="truncate">{uiText("app.span.zip", "ZIP")}</span>
                                    </>
                                  )}
                            </CustomizableButton>
                            <CustomizableButton
                              buttonId="storyboard_slices_export_psd"
                              defaultLabel="Export psd"
                              defaultIcon={<Layers className="w-3 h-3 text-purple-300 shrink-0" />}
                              onClick={() => handleExportStoryboardPSD("selected")}
                              className="py-1 px-1 bg-purple-950/80 hover:bg-purple-900 text-purple-300 rounded-lg font-bold border border-purple-500/40 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                              title="Export selected slices to multi-layer PSD file"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-emerald-900/50 text-[9px]">
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] text-slate-400 font-medium">{uiText("app.span.insert", "Insert:")}</span>
                              <CustomizableButton
                                buttonId="app_btn_56"
                                type="button"
onClick={() => handleMultiInsert("overwrite")}
className="px-1.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-800/60 font-semibold cursor-pointer"
title={uiText("app.button.overwrite_storyboard_from_slot_1_with_select.title", "Overwrite Storyboard from Slot 1 with selected slices")}
                              >
                                  {() => (
                                      <>
                                        {uiText("app.button.overwrite", "Overwrite")}
                                      </>
                                    )}
                              </CustomizableButton>
                              <CustomizableButton
                                buttonId="app_btn_55"
                                type="button"
onClick={() => handleMultiInsert("fill-empties")}
className="px-1.5 py-0.5 bg-sky-950 hover:bg-sky-900 text-sky-300 rounded border border-sky-800/60 font-semibold cursor-pointer"
title={uiText("app.button.fill_empty_storyboard_slots_with_selected_sl.title", "Fill empty Storyboard slots with selected slices")}
                              >
                                  {() => (
                                      <>
                                        {uiText("app.button.fill", "Fill")}
                                      </>
                                    )}
                              </CustomizableButton>
                              <CustomizableButton
                                buttonId="app_btn_54"
                                type="button"
onClick={() => handleMultiInsert("append")}
className="px-1.5 py-0.5 bg-purple-950 hover:bg-purple-900 text-purple-300 rounded border border-purple-800/60 font-semibold cursor-pointer"
title={uiText("app.button.append_selected_slices_at_end_of_storyboard.title", "Append selected slices at end of Storyboard")}
                              >
                                  {() => (
                                      <>
                                        {uiText("app.button.append", "Append")}
                                      </>
                                    )}
                              </CustomizableButton>
                            </div>
                            <CustomizableButton
                              buttonId="app_btn_53"
                              defaultIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                              type="button"
onClick={handleDeleteSelectedSlices}
className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950/60 transition-colors cursor-pointer"
title={`Remove ${selectedSliceUrls.size} selected slice(s) from pool`}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-300">{uiText("app.span.carved_slices", "Carved Slices")}</span>
                        {!isStoryboardVisible && (
                          <div className="flex items-center gap-1 bg-[#020617]/90 px-1.5 py-0.5 rounded-lg border border-[#1e293b]">
                            <span className="text-[9px] text-slate-500 font-semibold mr-0.5">{uiText("app.span.cols_2", "Cols:")}</span>
                            {[3, 4, 5, 6].map((cols) => (
                              <CustomizableButton
                                buttonId="app_btn_52"
                                key={cols}
type="button"
onClick={() => setCarvedSlicesExpandedCols(cols)}
className={cn(
                                  "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer",
                                  carvedSlicesExpandedCols === cols
                                    ? "bg-cyan-500 text-slate-950 shadow-sm"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                )}
                              >
                                  {() => (
                                      <>
                                        {cols}
                                      </>
                                    )}
                              </CustomizableButton>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <CustomizableButton
                          buttonId="app_btn_51"
                          defaultIcon={<ArrowUpDown className="w-3 h-3 text-[#10b981]" />}
                          type="button"
onClick={handleReverseStoryboardSlices}
disabled={storyboardSlices.length <= 1}
className="text-[10px] text-slate-400 hover:text-[#10b981] disabled:opacity-40 flex items-center gap-1 font-semibold cursor-pointer transition-colors"
title={uiText("app.button.reverse_slice_order_in_the_pool.title", "Reverse slice order in the pool")}
                        >
                            {() => (
                                <>
                                  {uiText("app.button.reverse", "Reverse")}
                                </>
                              )}
                        </CustomizableButton>
                        <CustomizableButton
                          buttonId="app_btn_50"
                          defaultIcon={<Trash2 className="w-3 h-3 text-rose-400" />}
                          type="button"
onClick={() => {
                            setStoryboardSlices([]);
                            setSelectedSliceUrls(new Set());
                          }}
disabled={storyboardSlices.length === 0}
className="text-[10px] text-slate-400 hover:text-rose-400 disabled:opacity-40 flex items-center gap-1 font-semibold cursor-pointer transition-colors"
title={uiText("app.button.clear_all_slices_from_asset_organizer.title", "Clear all slices from Asset Organizer")}
                        >
                            {() => (
                                <>
                                  {uiText("app.button.clear_pool", "Clear Pool")}
                                </>
                              )}
                        </CustomizableButton>
                        <span className="text-[10px] text-slate-500 font-medium">{storyboardSlices.length}{uiText("app.span.total", " total")}</span>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "grid gap-2",
                        !isStoryboardVisible
                          ? carvedSlicesExpandedCols === 3
                            ? "grid-cols-2 sm:grid-cols-3"
                            : carvedSlicesExpandedCols === 5
                            ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                            : carvedSlicesExpandedCols === 6
                            ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                          : "grid-cols-2"
                      )}
                    >
                      {sortedAndFilteredSlices.map((slice, i) => {
                        const isSelected = selectedSliceUrls.has(slice.url);
                        return (
                          <div
                            key={i}
                            onClick={(e) => {
                              if ((e.target as HTMLElement).closest("button, input, textarea, a, label")) return;
                              handleToggleSelectSlice(slice.url, i, e);
                            }}
                            onDoubleClick={() => handleDoubleClickSlice(slice.url, slice.name)}
                            className={cn(
                              "bg-[#020617] border rounded-xl overflow-hidden aspect-square flex flex-col justify-between cursor-pointer active:scale-[0.98] hover:border-[#10b981]/50 transition-all relative group/slice select-none",
                              isSelected ? "border-[#10b981] ring-2 ring-[#10b981]/30 bg-emerald-950/20 shadow-md shadow-emerald-950/40" : "border-[#1e293b]"
                            )}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", slice.url);
                              setDraggedSliceUrl(slice.url);
                            }}
                            onDragEnd={() => setDraggedSliceUrl(null)}
                          >
                            <div className="absolute top-1.5 left-1.5 z-10 flex items-center justify-center">
                              <CustomizableButton
                                buttonId="app_btn_49"
                                type="button"
onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleToggleSelectSlice(slice.url, i, e);
                                }}
className={cn(
                                  "transition-colors cursor-pointer p-0.5 rounded border shadow-sm",
                                  isSelected
                                    ? "bg-emerald-500 text-slate-950 border-emerald-400"
                                    : "bg-[#020617]/90 text-slate-300 border-slate-700/60 hover:text-white"
                                )}
title={isSelected ? "Deselect slice (Hold Shift for range)" : "Select slice (Hold Shift for range)"}
                              >
                                  {() => (
                                      <>
                                        {isSelected ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-slate-950 font-bold" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200" />
                                )}
                                      </>
                                    )}
                              </CustomizableButton>
                            </div>
                            <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 justify-center">
                              <CustomizableButton
                                buttonId="app_btn_48"
                                defaultIcon={<MessageSquare className="w-3.5 h-3.5 text-purple-400" />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleOpenBubba1Studio(i);
                                }}
className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer bg-[#020617]/90 p-0.5 rounded border border-purple-500/40"
title={uiText("app.button.send_carved_slice_to_bubba1_studio_speech_bu.title", "Send carved slice to Bubba1 Studio (Speech Bubbles & Narration)")}
                              />

                              <CustomizableButton
                                buttonId="app_btn_47"
                                defaultIcon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleOpenNeo1Studio(i);
                                }}
className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer bg-[#020617]/90 p-0.5 rounded border border-cyan-500/40"
title={uiText("app.button.send_carved_slice_to_neo1_studio_design_and.title", "Send carved slice to Neo1 Studio (Design & Typography)")}
                              />

                              <CustomizableButton
                                buttonId="app_btn_46"
                                defaultIcon={<Maximize2 className="w-3.5 h-3.5" />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setExpandedSliceIndex(i);
                                  setExpandedCustomSlice(null);
                                  setExpandedModalOpen(true);
                                }}
className="text-slate-300 hover:text-[#10b981] transition-colors cursor-pointer bg-[#020617]/90 p-0.5 rounded border border-slate-700/60"
title={uiText("app.button.expand_view_full_resolution.title", "Expand View (Full Resolution)")}
                              />
                            </div>
                            {sliceMetadataMap.has(slice.url) && (activeSortMode !== "none" || activeGroupMode !== "none") && (
                              <div className="absolute bottom-7 left-1.5 z-10 pointer-events-none">
                                <SliceAssetBadge
                                  metadata={sliceMetadataMap.get(slice.url)}
                                />
                              </div>
                            )}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSelectSlice(slice.url, i, e);
                              }}
                              className="flex-1 flex items-center justify-center p-1.5 overflow-hidden cursor-pointer group-hover/slice:scale-[1.02] transition-transform"
                              title={uiText("app.div.click_to_select_slice_for_actions_hold_shift.title", "Click to select slice for actions (Hold Shift for range) \\u2022 Double-click to insert into Storyboard")}
                            >
                              <img src={slice.url} alt={slice.name} className="max-w-full max-h-full object-contain pointer-events-none select-none" />
                            </div>
                            <div className="bg-[#0f172a] py-1 px-1.5 border-t border-[#1e293b] flex items-center justify-between text-[8px] font-medium text-slate-400 select-none">
                              <span className="truncate flex-1 max-w-[80px]" title={slice.name}>{slice.name}</span>
                              <div className="flex items-center gap-1">
                                <CustomizableButton
                                  buttonId="app_btn_45"
                                  defaultIcon={<Scissors className="w-2.5 h-2.5 text-[#10b981]" />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleResendFrameToCrop(slice.url, i, null);
                                  }}
className="text-slate-500 hover:text-[#10b981] p-0.5 rounded cursor-pointer"
title={uiText("app.button.resend_frame_to_crop.title", "Resend frame to Crop")}
                                />
                                <CustomizableButton
                                  buttonId="app_btn_44"
                                  defaultIcon={<Trash2 className="w-2.5 h-2.5" />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setStoryboardSlices((prev) => prev.filter((_, idx) => idx !== i));
                                    setSelectedSliceUrls((prev) => {
                                      const next = new Set(prev);
                                      next.delete(slice.url);
                                      return next;
                                    });
                                  }}
className="text-slate-500 hover:text-rose-400 p-0.5 rounded cursor-pointer"
title={uiText("app.button.remove_asset.title", "Remove asset")}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border border-dashed border-[#1e293b] hover:border-[#10b981]/50 rounded-xl p-3 transition-colors bg-[#020617]/30">
                      <CustomizableLabel
                        labelId="app_item_43"
                        defaultIcon={<ImageIcon className="w-5 h-5 text-[#10b981]" />}
                        as="label"
                        className="flex flex-col items-center justify-center gap-1 cursor-pointer"
                      >
                          {() => (
                              <>
                                <span className="text-[11px] font-semibold text-emerald-300 text-center">{uiText("app.span.import_custom_slices", "Import Custom Slices")}</span>
                              <span className="text-[9px] text-slate-500 text-center">{uiText("app.span.select_multiple_image_files", "Select multiple image files")}</span>
                              <input type="file" accept="image/*" multiple onChange={onSelectOtherImages} className="hidden" />
                              </>
                            )}
                      </CustomizableLabel>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "border-t border-[#1e293b] bg-[#020617]/50 shrink-0 transition-all",
                      isExportBarCompact ? "p-1" : "p-2"
                    )}
                  >
                    <div className={cn("grid grid-cols-4", isExportBarCompact ? "gap-1" : "gap-1.5")}>
                      <CustomizableButton
                        buttonId="storyboard_save_pdf"
                        defaultLabel="Save pdf"
                        defaultIcon={<FileText className={isExportBarCompact ? "w-2 h-2 shrink-0" : "w-3 h-3 shrink-0"} />}
                        onClick={handleExportStoryboardPDF}
                        disabled={isProcessing || !storyboardSlots.some((s) => s.url)}
                        className={cn(
                          "w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800 font-bold transition-all border border-cyan-400/30 flex items-center justify-center gap-0.5 shadow-sm cursor-pointer truncate",
                          isExportBarCompact ? "py-0.5 px-0.5 rounded text-[8px] h-5" : "py-1 px-1 rounded-md text-[9.5px] h-8"
                        )}
                        title="Export current storyboard as pdf document"
                      />
                      <CustomizableButton
                        buttonId="storyboard_export_json_btn"
                        defaultLabel="Export json"
                        defaultIcon={<FileJson className={isExportBarCompact ? "w-2 h-2 shrink-0" : "w-3 h-3 shrink-0"} />}
                        onClick={handleExportStoryboard}
                        disabled={isProcessing || !storyboardSlots.some((s) => s.url)}
                        className={cn(
                          "w-full bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800 font-bold transition-all border border-amber-400/30 flex items-center justify-center gap-0.5 shadow-sm cursor-pointer truncate",
                          isExportBarCompact ? "py-0.5 px-0.5 rounded text-[8px] h-5" : "py-1 px-1 rounded-md text-[9.5px] h-8"
                        )}
                        title="Export storyboard as json file"
                      />
                      <CustomizableButton
                        buttonId="storyboard_download_zip"
                        defaultLabel={isProcessing ? "Packaging..." : "Download zip"}
                        defaultIcon={<Archive className={isExportBarCompact ? "w-2 h-2 shrink-0" : "w-3 h-3 shrink-0"} />}
                        onClick={handleDownloadAssets}
                        disabled={isProcessing || !storyboardSlots.some((s) => s.url)}
                        className={cn(
                          "w-full bg-[#10b981] hover:bg-emerald-400 text-[#020617] disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800 font-bold transition-all border border-emerald-500/20 flex items-center justify-center gap-0.5 shadow-sm cursor-pointer truncate",
                          isExportBarCompact ? "py-0.5 px-0.5 rounded text-[8px] h-5" : "py-1 px-1 rounded-md text-[9.5px] h-8"
                        )}
                        title="Download board assets as zip archive"
                      />
                      <CustomizableButton
                        buttonId="storyboard_export_psd"
                        defaultLabel="Export psd"
                        defaultIcon={<Layers className={isExportBarCompact ? "w-2 h-2 shrink-0" : "w-3 h-3 shrink-0"} />}
                        onClick={() => handleExportStoryboardPSD()}
                        disabled={isProcessing || (!storyboardSlots.some((s) => s.url) && storyboardSlices.length === 0)}
                        className={cn(
                          "w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800 font-bold transition-all border border-indigo-400/30 flex items-center justify-center gap-0.5 shadow-sm cursor-pointer truncate",
                          isExportBarCompact ? "py-0.5 px-0.5 rounded text-[8px] h-5" : "py-1 px-1 rounded-md text-[9.5px] h-8"
                        )}
                        title="Export current workspace or slices as multi-layer psd file"
                      />
                    </div>
                  </div>
                </div>
              )}
              {/* Adjustable Resizer Drag Handle */}
              {!(mode === "storyboard" && !isStoryboardVisible) && (
                <div
                  onPointerDown={handleSidebarResizeStart}
                  className="absolute top-0 right-0 w-2.5 h-full cursor-col-resize hover:bg-[#10b981]/50 active:bg-[#10b981] z-30 transition-colors flex items-center justify-center group-hover/sidebar:bg-[#1e293b]/60"
                  title={uiText("app.div.click_and_drag_left_right_to_adjust_asset_or.title", "Click & drag left/right to adjust Asset Organiser / Sidebar width")}
                >
                  <div className="w-0.5 h-10 bg-slate-600 rounded-full group-hover/sidebar:bg-[#10b981] transition-colors" />
                </div>
              )}
            </aside>
          )}

          {/* Workspace Canvas */}
          {!(mode === "storyboard" && !isStoryboardVisible) && (
            <main className="flex-1 flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950 overflow-hidden relative">
            {/* Sleek Floating Expand Button on left edge when Sidebar is Collapsed */}
            {!isLeftSidebarVisible && (mode !== "storyboard" || isStoryboardVisible) && (
              <CustomizableButton
                buttonId="app_btn_42"
                defaultIcon={<PanelLeftOpen className="w-4 h-4 text-[#10b981] group-hover:scale-110 transition-transform" />}
                type="button"
onClick={() => toggleLeftSidebar(true)}
className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-[#0f172a]/95 hover:bg-emerald-950/90 text-[#10b981] hover:text-emerald-200 border-y border-r border-[#1e293b] hover:border-emerald-500/60 py-3.5 px-2 rounded-r-xl shadow-2xl backdrop-blur-md transition-all flex flex-col items-center gap-2 cursor-pointer group hover:scale-105"
title={`Show ${mode === "crop" ? "Crop" : mode === "carve" ? "Split Grid" : "Asset"} Panel (Shortcut: [)`}
              >
                  {() => (
                      <>
                        <span className="text-[10px] font-bold text-slate-300 group-hover:text-emerald-300 [writing-mode:vertical-lr] tracking-wider uppercase">
                  {mode === "crop" ? "Show Crop" : mode === "carve" ? "Show Grid" : "Show Panel"}
                </span>
                      </>
                    )}
              </CustomizableButton>
            )}

            <div className="bg-[#0f172a] px-4 py-2 border-b border-[#1e293b] flex items-center justify-between shrink-0 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  {/* Responsive Sidebar Collapse / Expand Toggle Button - Always available to show/hide */}
                  {(mode !== "storyboard" || isStoryboardVisible) && (
                    <CustomizableButton
                      buttonId="canvas_toggle_left_sidebar"
                      defaultLabel={
                        isLeftSidebarVisible
                          ? "Collapse Panel"
                          : mode === "crop"
                          ? "Show Crop Panel"
                          : mode === "carve"
                          ? "Show Grid Panel"
                          : "Show Panel"
                      }
                      defaultIcon={
                        isLeftSidebarVisible ? (
                          <PanelLeftClose className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <PanelLeftOpen className="w-3.5 h-3.5 text-[#10b981]" />
                        )
                      }
                      onClick={() => toggleLeftSidebar()}
                      className={cn(
                        "p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-sm",
                        isLeftSidebarVisible
                          ? "bg-[#020617] hover:bg-[#1e293b] text-slate-400 hover:text-slate-200 border-[#1e293b]"
                          : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10"
                      )}
                      title={
                        isLeftSidebarVisible
                          ? "Collapse Left Panel for Wider Canvas View (Shortcut: [)"
                          : "Show / Expand Left Panel (Shortcut: [)"
                      }
                    />
                  )}

                  <CustomizableLabel
                    as="span"
                    labelId="canvas_header_title"
                    defaultLabel=""
                    showIconAlways={false}
                    className="font-semibold text-slate-400 tracking-wider"
                  />
                  {mode === "carve" && carveImageSize.width > 0 && (
                    <span className="font-mono text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded text-[10px] border border-[#10b981]/20">
                      {carveImageSize.width}{uiText("app.span.u00d7", " \\u00d7 ")}{carveImageSize.height}{uiText("app.span.px_6", " px")}
                    </span>
                  )}

                  {/* Storyboard Toolbar Controls inside Canvas Header Bar */}
                  {mode === "storyboard" && isStoryboardVisible && (
                    <div
                      className="flex items-center gap-1.5 flex-wrap ml-1 min-h-[36px] min-w-[60px]"
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                      onDrop={(e) => handleUniversalZoneDrop(e, "storyboard")}
                    >
                      {multiCrops.length > 0 && (
                        <CustomizableButton
                          buttonId="app_btn_41"
                          defaultIcon={<Layers className="w-3.5 h-3.5 text-indigo-400" />}
                          type="button"
onClick={() => handleApplyMultiCrops("storyboard-slots")}
className="px-2.5 py-1 rounded-xl bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/50 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md animate-pulse"
title={`Click to fill ${multiCrops.length} multi-crops directly into Storyboard slots`}
                        >
                            {() => (
                                <>
                                  <span>{uiText("app.span.import", "Import ")}{multiCrops.length}{uiText("app.span.multi_crops", " Multi-Crops")}</span>
                                </>
                              )}
                        </CustomizableButton>
                      )}

{activeToolbarOrder.map((id) => renderUniversalItem(id, "storyboard"))}                    </div>
                  )}

                  {/* Auto-Fit Stage & Zoom Controls Bar */}
                  {(mode === "crop" || mode === "carve") && imageSrc && (
                    <div className="flex items-center gap-1 bg-[#020617] px-2 py-0.5 rounded-lg border border-[#1e293b] ml-1 shadow-inner">
                      {/* Dedicated Fit to Screen Toggle */}
                      <CustomizableButton
                        buttonId="canvas_fit_screen"
                        defaultLabel=""
                        forceZeroText={true}
                        defaultIcon={<Scaling className="w-3 h-3" />}
                        onClick={() => handleFitToScreen(canvasFitMode === "fit" ? "actual" : "fit")}
                        className={cn(
                          "px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border shadow-sm",
                          canvasFitMode === "fit"
                            ? "bg-[#10b981] text-[#020617] border-[#10b981]"
                            : "bg-[#0f172a] hover:bg-[#1e293b] text-slate-300 border-[#1e293b]"
                        )}
                        title={`Fit to Screen (Shortcut: F). Current Viewport: ${Math.round(viewportDimensions.width)}\u00d7${Math.round(viewportDimensions.height)}px`}
                      />

                      {/* Zoom Out */}
                      <CustomizableButton
                        buttonId="canvas_zoom_out"
                        defaultLabel=""
                        forceZeroText={true}
                        defaultIcon={<ZoomOut className="w-3 h-3" />}
                        onClick={() => {
                          setCanvasFitMode("custom");
                          setCanvasZoom((z) => Math.max(0.1, Math.round((z - 0.1) * 10) / 10));
                        }}
                        className="px-1.5 py-0.5 hover:bg-[#1e293b] rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                        title="Zoom Out"
                      />

                      {/* Mode / Zoom Badge */}
                      <CustomizableButton
                        buttonId="canvas_zoom_badge"
                        defaultLabel={
                          canvasFitMode === "fit"
                            ? `Fit (${Math.round(autoFitScale * 100)}%)`
                            : canvasFitMode === "actual"
                            ? "100%"
                            : canvasFitMode === "fit-width"
                            ? "Fit-W"
                            : canvasFitMode === "fit-height"
                            ? "Fit-H"
                            : `${Math.round(canvasZoom * 100)}%`
                        }
                        defaultIcon={null}
                        onClick={() => {
                          const modes: ("fit" | "fit-width" | "fit-height" | "actual")[] = ["fit", "fit-width", "fit-height", "actual"];
                          const nextIdx = (modes.indexOf(canvasFitMode as any) + 1) % modes.length;
                          handleFitToScreen(modes[nextIdx]);
                        }}
                        className="text-[10px] font-mono font-bold text-[#10b981] px-1.5 py-0.5 rounded hover:bg-[#1e293b] transition-colors cursor-pointer"
                        title="Cycle Viewport Modes: Fit Screen, Fit Width, Fit Height, 1:1 Actual"
                      />

                      {/* Zoom In */}
                      <CustomizableButton
                        buttonId="canvas_zoom_in"
                        defaultLabel=""
                        forceZeroText={true}
                        defaultIcon={<ZoomIn className="w-3 h-3" />}
                        onClick={() => {
                          setCanvasFitMode("custom");
                          setCanvasZoom((z) => Math.min(3, Math.round((z + 0.1) * 10) / 10));
                        }}
                        className="px-1.5 py-0.5 hover:bg-[#1e293b] rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                        title="Zoom In"
                      />

                      {/* Pan Hand Tool */}
                      <CustomizableButton
                        buttonId="canvas_pan_tool"
                        defaultLabel=""
                        forceZeroText={true}
                        defaultIcon={<Hand className="w-3 h-3" />}
                        onClick={() => setIsPanToolActive((prev) => !prev)}
                        className={cn(
                          "px-1.5 py-0.5 rounded transition-colors cursor-pointer border flex items-center gap-1 text-[11px] font-semibold",
                          isPanToolActive
                            ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40"
                            : "hover:bg-[#1e293b] text-slate-400 border-transparent"
                        )}
                        title={isPanToolActive ? "Pan Hand Tool Active (Click and drag stage)" : "Activate Pan Hand Tool"}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(mode === "crop" || mode === "carve") && imageSrc && (
                    <>
                      {/* Canvas History Snapshots Visualizer */}
                      <CustomizableButton
                        buttonId="canvas_history_visualizer"
                        defaultLabel=""
                        defaultIcon={<History className="w-3.5 h-3.5 text-amber-400" />}
                        onClick={() => setIsHistoryVisualizerOpen(true)}
                        title={`Canvas Undo/Redo Snapshots Timeline (${cropHistory.length} states, current: #${cropHistoryIndex + 1})`}
                        className="px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center cursor-pointer border shadow-sm bg-[#020617] hover:bg-[#0f172a] text-amber-400 border-[#1e293b] hover:border-amber-500/50"
                        forceZeroText={true}
                      />

                      {/* Snapshot Reflecting Exact Live Canvas Appearance -> Storyboard First */}
                      <CustomizableButton
                        buttonId="canvas_snapshot_storyboard_first"
                        defaultLabel=""
                        defaultIcon={<Camera className="w-3.5 h-3.5 text-cyan-400" />}
                        onClick={handleCopyLiveCanvasSnapshotToStoryboardFirst}
                        title="Capture snapshot reflecting exact live canvas appearance and copy to Storyboard first"
                        className="px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center cursor-pointer border shadow-sm bg-[#020617] hover:bg-[#0f172a] text-cyan-400 border-[#1e293b] hover:border-cyan-500/50"
                        forceZeroText={true}
                      />

                      {/* Toggle Grid Segment Numbering Labels & Preset Dropdown */}
                      {mode === "carve" && (
                        <div className="relative inline-flex items-center">
                          <CustomizableButton
                            id="canvas_toggle_grid_labels"
                            buttonId="canvas_toggle_grid_labels"
                            defaultLabel="Grid #s"
                            defaultIcon={
                              showGridLabels ? (
                                <Eye className="w-3.5 h-3.5 text-[#10b981]" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                              )
                            }
                            onClick={() => setShowGridLabels((prev) => !prev)}
                            title={
                              showGridLabels
                                ? `Hide Grid Segment Labels (Active Preset: ${GRID_LABEL_PRESETS.find((p) => p.id === gridLabelPreset)?.name})`
                                : "Show Grid Segment Numbering Labels"
                            }
                            className={cn(
                              "px-2 py-1 rounded-l-lg text-xs font-semibold transition-all flex items-center justify-center cursor-pointer border shadow-sm",
                              showGridLabels
                                ? "bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40 border-r-0"
                                : "bg-[#020617] hover:bg-[#0f172a] text-slate-400 border-[#1e293b] border-r-0"
                            )}
                            forceZeroText={true}
                          />
                          <CustomizableButton
                            id="canvas_grid_label_presets"
                            buttonId="canvas_grid_label_presets"
                            defaultLabel="Label Presets"
                            defaultIcon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsGridLabelMenuOpen((prev) => !prev);
                            }}
                            className={cn(
                              "px-1.5 py-1 rounded-r-lg text-xs font-semibold transition-all flex items-center justify-center cursor-pointer border border-l-0 shadow-sm",
                              isGridLabelMenuOpen
                                ? "bg-cyan-500/25 text-cyan-300 border-cyan-500/50"
                                : showGridLabels
                                ? "bg-[#10b981]/25 text-emerald-300 border-[#10b981]/40 hover:bg-[#10b981]/35"
                                : "bg-[#020617] hover:bg-[#0f172a] text-slate-400 border-[#1e293b]"
                            )}
                            title={`Choose Grid Segment Label Preset (Active: ${GRID_LABEL_PRESETS.find((p) => p.id === gridLabelPreset)?.name})`}
                            forceZeroText={true}
                          />

                          {/* Popover Dropdown for Presets */}
                          {isGridLabelMenuOpen && (
                            <div
                              className="absolute right-0 top-full mt-1.5 w-64 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/80">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>{uiText("app.span.grid_label_presets", "Grid Label Presets")}</span>
                                </div>
                                <CustomizableButton
                                  buttonId="app_btn_40"
                                  defaultIcon={<X className="w-3.5 h-3.5" />}
                                  type="button"
onClick={() => setIsGridLabelMenuOpen(false)}
className="text-slate-400 hover:text-slate-200 p-0.5 rounded cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                                {GRID_LABEL_PRESETS.map((preset) => {
                                  const isSelected = gridLabelPreset === preset.id;
                                  return (
                                    <CustomizableButton
                                      buttonId="app_btn_39"
                                      key={preset.id}
type="button"
onClick={() => {
                                        setGridLabelPreset(preset.id);
                                        setShowGridLabels(true);
                                        if (preset.id !== "custom") {
                                          setIsGridLabelMenuOpen(false);
                                        }
                                      }}
className={cn(
                                        "w-full px-2 py-1.5 rounded-lg text-left transition-all border flex items-center justify-between cursor-pointer group",
                                        isSelected
                                          ? "bg-cyan-950/80 border-cyan-500/80 text-cyan-200 ring-1 ring-cyan-400/50"
                                          : "bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/60 text-slate-300 hover:text-white"
                                      )}
                                    >
                                        {() => (
                                            <>
                                              <div>
                                        <div className="text-xs font-bold flex items-center gap-1.5">
                                          <span>{preset.name}</span>
                                          {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                                        </div>
                                        <div className="text-[10px] text-slate-400 group-hover:text-slate-300 font-sans">
                                          {preset.description}
                                        </div>
                                      </div>
                                            <div className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30 shrink-0">
                                        {preset.example}
                                      </div>
                                            </>
                                          )}
                                    </CustomizableButton>
                                  );
                                })}
                              </div>

                              {gridLabelPreset === "custom" && (
                                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">{uiText("app.span.custom", "Custom:")}</span>
                                  <input
                                    type="text"
                                    value={customGridLabelPrefix}
                                    onChange={(e) => setCustomGridLabelPrefix(e.target.value)}
                                    placeholder={uiText("app.input.e_g_shot_cut_scene.placeholder", "e.g. Shot, Cut, Scene")}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                                  />
                                </div>
                              )}

                              <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                                <span className="text-slate-400">{uiText("app.span.labels_visibility", "Labels Visibility:")}</span>
                                <CustomizableButton
                                  buttonId="app_btn_38"
                                  type="button"
onClick={() => setShowGridLabels((prev) => !prev)}
className={cn(
                                    "px-2 py-0.5 rounded font-mono font-bold cursor-pointer transition-colors border",
                                    showGridLabels
                                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                      : "bg-slate-800 text-slate-400 border-slate-700"
                                  )}
                                >
                                    {() => (
                                        <>
                                          {showGridLabels ? "Visible" : "Hidden"}
                                        </>
                                      )}
                                </CustomizableButton>
                              </div>

                              <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                                <div className="flex flex-col">
                                  <span className="text-slate-300 font-semibold">{uiText("app.span.storyboard_name", "Storyboard Name:")}</span>
                                  <span className="text-[9px] text-cyan-400 font-mono">
                                    {gridLabelPreset === "custom"
                                      ? `${customGridLabelPrefix || "Shot"} 1, 2...`
                                      : (GRID_LABEL_PRESETS.find((p) => p.id === gridLabelPreset)?.example || "P1, P2, P3...")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-400 font-medium">{uiText("app.span.burnt_on_image", "Burnt on image:")}</span>
                                  <CustomizableButton
                                    buttonId="app_btn_37"
                                    type="button"
onClick={() => setRenderGridLabelsOnExport((prev) => !prev)}
title={uiText("app.button.when_active_burns_the_styled_label_badge_dir.title", "When active, burns the styled label badge directly onto exported slice images. Default is Off.")}
className={cn(
                                      "px-2 py-0.5 rounded font-mono font-bold cursor-pointer transition-colors border text-[9px]",
                                      renderGridLabelsOnExport
                                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                                        : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                                    )}
                                  >
                                      {() => (
                                          <>
                                            {renderGridLabelsOnExport ? "On" : "Off"}
                                          </>
                                        )}
                                  </CustomizableButton>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hide/Show Splits Dock 1 Cycle Button */}
                      {mode === "carve" && (
                        <CustomizableButton
                          buttonId="canvas_toggle_split_dock"
                          defaultLabel={isSplitPreviewVisible ? "Hide Splits" : "Show Splits"}
                          defaultIcon={
                            isSplitPreviewVisible ? (
                              <EyeOff className="w-3.5 h-3.5 text-[#10b981]/75" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-slate-400/80" />
                            )
                          }
                          onClick={() => setIsSplitPreviewVisible((prev) => !prev)}
                          title={isSplitPreviewVisible ? "Hide Splits Preview Dock" : "Show Splits Preview Dock"}
                          className={cn(
                            "px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center cursor-pointer border shadow-sm",
                            isSplitPreviewVisible
                              ? "bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40"
                              : "bg-[#020617] hover:bg-[#0f172a] text-slate-400 border-[#1e293b]"
                          )}
                          forceZeroText={true}
                        />
                      )}

                      {/* H/V Layout Toggle Button (Icons Only) */}
                      {mode === "carve" && (
                        <CustomizableButton
                          buttonId="canvas_toggle_split_orientation"
                          defaultLabel={splitPreviewOrientation === "horizontal" ? "Vertical Dock" : "Horizontal Dock"}
                          defaultIcon={
                            splitPreviewOrientation === "horizontal" ? (
                              <Columns3 className="w-3.5 h-3.5 text-[#10b981]" />
                            ) : (
                              <Rows3 className="w-3.5 h-3.5 text-[#10b981]" />
                            )
                          }
                          onClick={() => {
                            setSplitPreviewOrientation((prev) => (prev === "horizontal" ? "vertical" : "horizontal"));
                            setIsSplitPreviewVisible(true);
                          }}
                          title={splitPreviewOrientation === "horizontal" ? "Switch to Vertical (Sidebar) Dock Layout" : "Switch to Horizontal (Bottom) Dock Layout"}
                          className={cn(
                            "px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center cursor-pointer border shadow-sm",
                            isSplitPreviewVisible && splitPreviewOrientation === "vertical"
                              ? "bg-[#10b981]/25 text-[#10b981] border-[#10b981]/50 shadow-emerald-950/40"
                              : "bg-[#020617] hover:bg-[#0f172a] text-[#10b981] border-[#1e293b]"
                          )}
                          forceZeroText={true}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Grid Configuration Top Control Panel */}
              {mode === "carve" && (
                <div className="bg-[#0b1329] px-4 py-2 border-b border-[#1e293b] flex items-center justify-between gap-3 flex-wrap shrink-0 text-xs shadow-md">
                  {/* Left group: Title, Lock Cuts, Reset, Rows & Cols */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <CustomizableButton
                      buttonId="carve_grid_cfg_badge"
                      defaultLabel="Grid Cfg"
                      defaultIcon={<Settings className="w-3.5 h-3.5 text-[#10b981]" />}
                      className="bg-transparent hover:bg-slate-800/40 text-slate-200 font-bold pr-2 border-r border-[#1e293b] rounded text-xs transition-colors p-0.5 flex items-center gap-1.5 cursor-pointer"
                      title="Grid Configuration Controls"
                    />

                    <div className="flex items-center gap-1.5">
                      <CustomizableButton
                        buttonId="carve_lock_cuts"
                        defaultLabel={isAdjusting ? "Unlock" : "Lock"}
                        defaultIcon={
                          isAdjusting ? (
                            <Unlock className="w-3.5 h-3.5" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" />
                          )
                        }
                        onClick={() => setIsAdjusting(!isAdjusting)}
                        className={cn(
                          "w-7 h-7 flex items-center justify-center rounded-lg transition-colors border cursor-pointer shadow-sm p-0",
                          isAdjusting
                            ? "bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40 hover:bg-[#10b981]/25"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                        )}
                        title={isAdjusting ? "Lock Cuts" : "Edit Cuts"}
                        forceZeroText={true}
                      />
                      <CustomizableButton
                        buttonId="carve_reset_cuts"
                        defaultLabel="Reset"
                        defaultIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setNumRows(0);
                          setNumCols(0);
                          setOuterMargin(0);
                          setSliceLineThicknessX(0);
                          setSliceLineThicknessY(0);
                          setSliceLineThickness(0);
                          setSliceCellPadding(0);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition-colors cursor-pointer shadow-sm p-0"
                        title="Reset all rows, columns, trimfx, and gaps to 0"
                        forceZeroText={true}
                      />

                      <CustomizableButton
                        buttonId="carve_auto_size_grid"
                        defaultLabel="<-> Grid"
                        defaultIcon={<Grid className="w-3.5 h-3.5" />}
                        onClick={handleAutoSizeGrid}
                        className="text-[11px] font-semibold px-2.5 h-7 rounded-lg bg-[#10b981]/15 hover:bg-[#10b981]/25 text-[#10b981] border border-[#10b981]/40 transition-colors cursor-pointer flex items-center justify-center shadow-sm"
                        title="Auto Size Grid into equal parts based on image dimensions and aspect ratio"
                      />

                      <CustomizableButton
                        buttonId="carve_detect_edges"
                        defaultLabel={isAutoDetecting ? "Detecting..." : "?-Edges"}
                        defaultIcon={<Sparkles className="w-3.5 h-3.5" />}
                        onClick={handleAutoDetectBorders}
                        disabled={isAutoDetecting}
                        className="text-[11px] font-semibold px-2.5 h-7 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 transition-colors cursor-pointer flex items-center justify-center shadow-sm disabled:opacity-50"
                        title="Auto detect outer frame trim and gap thickness"
                      />

                      <CustomizableButton
                        buttonId="carve_top_smart_trim"
                        defaultLabel="Smart Trim"
                        defaultIcon={<CropIcon className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenSmartTrim("grid")}
                        className="text-[11px] font-semibold px-2.5 h-7 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/50 transition-colors cursor-pointer flex items-center justify-center shadow-sm"
                        title="Smart Trim: Auto-detect and remove outer padding of each slice based on the alpha channel of the grid segments"
                      />
                    </div>

                    {/* Rows & Columns controls */}
                    <div className="flex items-center gap-2 pl-2 border-l border-[#1e293b]">
                      <div className="flex items-center gap-1.5">
                        <CustomizableLabel
                          labelId="app_item_36"
                          as="label"
                          className="text-[10px] font-semibold text-slate-400"
                        >
                            {() => (
                                <>
                                  {uiText("app.label.rows_2", "Rows")}
                                </>
                              )}
                        </CustomizableLabel>
                        <div className="relative flex items-center w-16">
                          <input
                            type="number"
                            min={0}
                            max={20}
                            value={numRows}
                            onChange={(e) => setNumRows(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
                            className="w-full bg-[#020617] border border-[#1e293b] rounded-lg pl-2 pr-5 py-1 text-xs font-semibold text-slate-100 focus:outline-none focus:border-[#10b981] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <div className="absolute right-0.5 flex flex-col gap-0.5">
                            <HoldButton
                              onAction={() => setNumRows((r) => Math.min(20, r + 1))}
                              className="p-0.5 hover:bg-[#1e293b] rounded text-slate-400 hover:text-[#10b981] cursor-pointer"
                              title={uiText("app.hold_button.increase_rows.title", "Increase Rows")}
                            >
                              <ChevronUp className="w-2.5 h-2.5" />
                            </HoldButton>
                            <HoldButton
                              onAction={() => setNumRows((r) => Math.max(0, r - 1))}
                              className="p-0.5 hover:bg-[#1e293b] rounded text-slate-400 hover:text-[#10b981] cursor-pointer"
                              title={uiText("app.hold_button.decrease_rows.title", "Decrease Rows")}
                            >
                              <ChevronDown className="w-2.5 h-2.5" />
                            </HoldButton>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <CustomizableLabel
                          labelId="app_item_35"
                          as="label"
                          className="text-[10px] font-semibold text-slate-400"
                        >
                            {() => (
                                <>
                                  {uiText("app.label.cols", "Cols")}
                                </>
                              )}
                        </CustomizableLabel>
                        <div className="relative flex items-center w-16">
                          <input
                            type="number"
                            min={0}
                            max={20}
                            value={numCols}
                            onChange={(e) => setNumCols(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
                            className="w-full bg-[#020617] border border-[#1e293b] rounded-lg pl-2 pr-5 py-1 text-xs font-semibold text-slate-100 focus:outline-none focus:border-[#10b981] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <div className="absolute right-0.5 flex flex-col gap-0.5">
                            <HoldButton
                              onAction={() => setNumCols((c) => Math.min(20, c + 1))}
                              className="p-0.5 hover:bg-[#1e293b] rounded text-slate-400 hover:text-[#10b981] cursor-pointer"
                              title={uiText("app.hold_button.increase_columns.title", "Increase Columns")}
                            >
                              <ChevronUp className="w-2.5 h-2.5" />
                            </HoldButton>
                            <HoldButton
                              onAction={() => setNumCols((c) => Math.max(0, c - 1))}
                              className="p-0.5 hover:bg-[#1e293b] rounded text-slate-400 hover:text-[#10b981] cursor-pointer"
                              title={uiText("app.hold_button.decrease_columns.title", "Decrease Columns")}
                            >
                              <ChevronDown className="w-2.5 h-2.5" />
                            </HoldButton>
                          </div>
                        </div>
                      </div>

                      {/* Set Default Grid button */}
                      <CustomizableButton
                        buttonId="app_btn_34"
                        defaultIcon={<Bookmark className={cn("w-3.5 h-3.5", numRows === defaultNumRows && numCols === defaultNumCols ? "text-emerald-400 fill-emerald-400/30" : "text-amber-400")} />}
                        type="button"
onClick={() => handleSetDefaultGrid(numRows, numCols)}
className={cn(
                          "px-2 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] font-semibold shrink-0 ml-1",
                          numRows === defaultNumRows && numCols === defaultNumCols
                            ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-300"
                            : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white"
                        )}
title={
                          numRows === defaultNumRows && numCols === defaultNumCols
                            ? `Current grid matches saved default (${defaultNumRows}\u00d7${defaultNumCols})`
                            : `Set ${numRows}\u00d7${numCols} as default grid`
                        }
                      >
                          {() => (
                              <>
                                <span className="hidden xl:inline">
                          {numRows === defaultNumRows && numCols === defaultNumCols ? "Default" : "Set Default"}
                        </span>
                              </>
                            )}
                      </CustomizableButton>
                    </div>

                    {/* Internal Cell Padding Slider Control */}
                    <div className="flex items-center gap-1.5 pl-2 border-l border-[#1e293b]">
                      <div className="flex items-center gap-1.5" title={uiText("app.div.cell_internal_padding_specify_internal_paddi.title", "Cell Internal Padding: Specify internal padding for each slice cell. Negative values expand content to touch or bleed past edges; positive values inset content inward.")}>
                        <CustomizableLabel
                          labelId="carve_cell_padding_badge"
                          defaultText="Cell Pad"
                          defaultIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-[#10b981]" />}
                          className="text-[10px] font-semibold text-slate-300 hidden sm:flex items-center gap-1 shrink-0 select-none cursor-pointer"
                        />
                        <input
                          type="range"
                          min={-50}
                          max={50}
                          step={1}
                          value={sliceCellPadding}
                          onChange={(e) => setSliceCellPadding(parseInt(e.target.value) || 0)}
                          className="w-16 sm:w-20 md:w-24 accent-emerald-500 h-1.5 rounded bg-slate-800 cursor-ew-resize shrink-0"
                          title={`Cell Internal Padding: ${sliceCellPadding > 0 ? `+${sliceCellPadding}` : sliceCellPadding}px (Drag slider: negative expands to touch edges, positive insets)`}
                        />
                        <div className="flex items-center gap-0.5 bg-[#020617] border border-[#1e293b] rounded px-1.5 py-0.5 shadow-inner shrink-0">
                          <span
                            className={cn(
                              "text-xs font-mono font-bold min-w-[34px] text-right select-none",
                              sliceCellPadding === 0
                                ? "text-slate-300"
                                : sliceCellPadding < 0
                                ? "text-amber-400"
                                : "text-emerald-400"
                            )}
                            title={
                              sliceCellPadding === 0
                                ? "0px (Flush with cut boundaries)"
                                : sliceCellPadding < 0
                                ? `${sliceCellPadding}px (Expanded to touch/bleed past edges)`
                                : `+${sliceCellPadding}px (Inset internal padding)`
                            }
                          >
                            {sliceCellPadding > 0 ? `+${sliceCellPadding}` : sliceCellPadding}{uiText("app.span.px_7", "px")}
                          </span>
                          <div className="flex flex-col border-l border-[#1e293b] pl-0.5 ml-0.5">
                            <HoldButton
                              onAction={() => setSliceCellPadding((p) => Math.min(100, p + 1))}
                              className="p-0 hover:bg-[#0f172a] text-slate-300 hover:text-[#10b981] rounded cursor-pointer"
                              title={uiText("app.hold_button.increase_padding_hold_for_continuous.title", "Increase Padding (Hold for continuous)")}
                            >
                              <ChevronUp className="w-2.5 h-2.5" />
                            </HoldButton>
                            <HoldButton
                              onAction={() => setSliceCellPadding((p) => Math.max(-100, p - 1))}
                              className="p-0 hover:bg-[#0f172a] text-slate-300 hover:text-[#10b981] rounded cursor-pointer"
                              title={uiText("app.hold_button.decrease_padding_expand_to_edges_hold_for_co.title", "Decrease Padding / Expand to edges (Hold for continuous)")}
                            >
                              <ChevronDown className="w-2.5 h-2.5" />
                            </HoldButton>
                          </div>
                          {sliceCellPadding !== 0 && (
                            <CustomizableButton
                              buttonId="app_btn_33"
                              defaultIcon={<RotateCcw className="w-2.5 h-2.5" />}
                              type="button"
onClick={() => setSliceCellPadding(0)}
className="p-0.5 text-slate-400 hover:text-rose-400 rounded cursor-pointer transition-colors ml-0.5"
title={uiText("app.button.reset_padding_to_0px_touch_cut_lines.title", "Reset padding to 0px (touch cut lines)")}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right group: Actions (Auto-Number, Corner, Style, Send to Storyboard, Download) */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Auto-Number Slices Button (Circle displaying frame count) */}
                    <CustomizableButton
                      buttonId="app_btn_32"
                      type="button"
onClick={handleAutoNumberScenes}
className="p-1 bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] hover:border-[#10b981]/50 rounded-lg text-[11px] font-bold text-[#10b981] flex items-center justify-center cursor-pointer shadow-sm transition-all"
title={`Auto-Number Slices (${carveImageSize.width > 0 ? (rowCuts.length + 1) * (colCuts.length + 1) : 0} Frames)`}
                    >
                        {() => (
                            <>
                              <div className="w-5 h-5 rounded-full border border-[#10b981] bg-[#10b981]/10 flex items-center justify-center text-[10px] font-mono font-bold leading-none text-[#10b981]">
                        {carveImageSize.width > 0 ? (rowCuts.length + 1) * (colCuts.length + 1) : 0}
                      </div>
                            </>
                          )}
                    </CustomizableButton>

                    {/* Corner Numbering Cycle */}
                    <CustomizableButton
                      buttonId="app_btn_31"
                      type="button"
onClick={() => {
                        const origins: NumberingOrigin[] = ["top-left", "top-right", "bottom-right", "bottom-left"];
                        const nextIdx = (origins.indexOf(numberingOrigin) + 1) % origins.length;
                        setNumberingOrigin(origins[nextIdx]);
                      }}
className="px-2 py-1 bg-[#020617] hover:bg-[#0f172a] border border-[#1e293b] rounded-lg text-[11px] font-semibold text-slate-300 flex items-center gap-1 cursor-pointer"
title={uiText("app.button.cycle_corner_numbering_origin.title", "Cycle Corner Numbering Origin")}
                    >
                        {() => (
                            <>
                              <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                            <span className="capitalize text-[10px] font-mono">{numberingOrigin.replace("-", " ")}</span>
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                </div>
              )}

              <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative w-full h-full min-h-0">
                {mode === "storyboard" ? (
                  isStoryboardVisible ? (
                    <div
                      className="flex-1 p-3 sm:p-5 flex flex-col select-none w-full overflow-y-auto overflow-x-hidden items-center transition-colors duration-200"
                      style={{
                        backgroundColor: storyboardLayout === "strip" ? (stripBackground || "#000000") : "#020617",
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                    >
                      {/* 3x3 Grid / Dynamic Grid / Strip View of Storyboard Slots */}
                      <div
                        className={cn(
                          "w-full transition-all duration-150",
                          storyboardLayout === "strip"
                            ? cn(
                                "flex flex-col py-2 px-1 transition-all mx-auto",
                                slotSize === "sm" && "max-w-4xl gap-2.5",
                                slotSize === "md" && "max-w-5xl gap-3.5",
                                slotSize === "lg" && "max-w-6xl gap-5"
                              )
                            : cn(
                                "grid transition-all mx-auto",
                                storyboardLayout === "grid9"
                                  ? cn(
                                      "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
                                      slotSize === "sm" && "max-w-3xl gap-2 sm:gap-2.5",
                                      slotSize === "md" && "max-w-5xl gap-3 sm:gap-4",
                                      slotSize === "lg" && "max-w-7xl gap-4 sm:gap-6"
                                    )
                                  : cn(
                                      // Grid view: sm = 5 columns, md = 3 columns, lg = 2 columns of increasingly larger slots
                                      slotSize === "sm"
                                        ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 max-w-7xl gap-2 sm:gap-2.5"
                                        : slotSize === "md"
                                        ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-5xl gap-3 sm:gap-4"
                                        : "grid-cols-1 sm:grid-cols-2 max-w-4xl gap-4 sm:gap-5"
                                    )
                              )
                        )}
                      >
                        {storyboardSlots.map((slot, i) => {
                          const isSelected = selectedStoryboardSlotIndices.has(i);
                          const isFilled = Boolean(slot.url);

                          if (storyboardLayout === "strip") {
                            return (
                              <div
                                key={i}
                                onClick={(e) => handleToggleSelectStoryboardSlot(i, e)}
                                draggable={!isStoryboardLocked && isFilled}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData("text/plain", slot.url || "");
                                  setDraggedSlotIdx(i);
                                }}
                                onDragEnd={() => setDraggedSlotIdx(null)}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = "move";
                                }}
                                onDrop={(e) => handleStoryboardSlotDrop(e, i)}
                                className={cn(
                                  "w-full border rounded-2xl shadow-xl transition-all duration-150 flex flex-col sm:flex-row items-stretch relative group/strip select-none",
                                  slotSize === "sm"
                                    ? "p-2 sm:p-2.5 gap-2.5 sm:gap-3"
                                    : slotSize === "md"
                                    ? "p-3 sm:p-4 gap-3.5 sm:gap-4"
                                    : "p-4 sm:p-5 gap-4 sm:gap-5",
                                  isSelected
                                    ? "border-emerald-500 ring-2 ring-emerald-500/40 shadow-emerald-950/40"
                                    : "border-emerald-500/30 hover:border-emerald-500/60",
                                  draggedSlotIdx === i && "opacity-40 border-dashed border-cyan-400"
                                )}
                                style={{
                                  backgroundColor: stripPanelBackground || stripBackground || "#000000",
                                }}
                              >
                                {/* Left Side: Thumbnail Preview Card */}
                                <div
                                  className={cn(
                                    "relative rounded-xl overflow-hidden border border-slate-700/50 flex items-center justify-center shrink-0 group/thumb transition-all",
                                    slotSize === "sm"
                                      ? "w-full sm:w-44 md:w-52 h-28 sm:h-32"
                                      : slotSize === "md"
                                      ? "w-full sm:w-64 md:w-72 h-44 sm:h-48"
                                      : "w-full sm:w-96 md:w-[420px] h-60 sm:h-68"
                                  )}
                                  style={{
                                    backgroundColor: stripImageBackground || stripBackground || "#000000",
                                  }}
                                >
                                  {isFilled ? (
                                    <img
                                      src={slot.url!}
                                      alt={slot.name || `Strip ${i + 1}`}
                                      className="w-full h-full object-contain pointer-events-none select-none"
                                    />
                                  ) : (
                                    <CustomizableLabel
                                      labelId="app_item_30"
                                      defaultIcon={<ImagePlus className="w-6 h-6 text-slate-400 mb-1" />}
                                      as="label"
                                      onClick={(e) => e.stopPropagation()}
className="w-full h-full flex flex-col items-center justify-center p-3 text-center cursor-pointer border-2 border-dashed border-slate-700 hover:border-emerald-500 hover:bg-slate-900/60 transition-all rounded-lg m-2 bg-black/40 text-slate-300"
                                    >
                                        {() => (
                                            <>
                                              <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleStoryboardSlotUpload(file, i);
                                        }}
                                      />
                                            <span className="text-xs font-semibold text-slate-200">{uiText("app.span.empty_slot", "Empty Slot #")}{i + 1}</span>
                                            <span className="text-[10px] text-slate-400">{uiText("app.span.drop_slice_or_click_to_upload", "Drop slice or click to upload")}</span>
                                            </>
                                          )}
                                    </CustomizableLabel>
                                  )}

                                  {/* Quick Strip Image Panel Background Color Selector */}
                                  <div className="absolute bottom-2 right-2 z-20 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center gap-1 bg-black/85 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-slate-700 shadow-md">
                                    <CustomizableButton
                                      buttonId="app_btn_29"
                                      defaultIcon={<Palette className="w-3 h-3 text-cyan-400" />}
                                      type="button"
onClick={(e) => {
                                        e.stopPropagation();
                                        const presets = ["#000000", "#050505", "#0a0a0a", "#020617", "#0f172a", "#18181b"];
                                        const curr = (stripImageBackground || stripBackground || "#000000").toLowerCase();
                                        const next = presets[(presets.indexOf(curr) + 1) % presets.length];
                                        setStripImageBackground(next);
                                        setStripBackground(next);
                                        setStripPanelBackground(next);
                                      }}
className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer text-[10px] font-mono"
title={`Strip Panel & Image Background: ${stripImageBackground || stripBackground || "#000000"} (Click to cycle black/dark presets)`}
                                    >
                                        {() => (
                                            <>
                                              <span>{uiText("app.span.bg", "BG")}</span>
                                            </>
                                          )}
                                    </CustomizableButton>
                                    <CustomizableLabel
                                      labelId="app_item_28"
                                      as="label"
                                      onClick={(e) => e.stopPropagation()}
className="relative cursor-pointer flex items-center ml-0.5"
title={uiText("app.label.pick_custom_image_panel_background_color.title", "Pick custom image panel background color")}
                                    >
                                        {() => (
                                            <>
                                              <input
                                        type="color"
                                        value={stripImageBackground || stripBackground || "#000000"}
                                        onChange={(e) => {
                                          setStripImageBackground(e.target.value);
                                          setStripBackground(e.target.value);
                                          setStripPanelBackground(e.target.value);
                                        }}
                                        className="w-3.5 h-3.5 opacity-0 absolute inset-0 cursor-pointer"
                                      />
                                            <div
                                        className="w-3 h-3 rounded-full border border-slate-400 shadow-xs"
                                        style={{ backgroundColor: stripImageBackground || stripBackground || "#000000" }}
                                      />
                                            </>
                                          )}
                                    </CustomizableLabel>
                                  </div>

                                  {/* Top-left: Selection Checkbox & Slice Name */}
                                  <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 max-w-[85%]">
                                    <CustomizableButton
                                      buttonId="app_btn_27"
                                      defaultIcon={<Check className="w-4 h-4 stroke-[3]" />}
                                      type="button"
onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleSelectStoryboardSlot(i, e);
                                      }}
className={cn(
                                        "w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0",
                                        isSelected
                                          ? "bg-[#00e599] text-black ring-1 ring-emerald-400"
                                          : "bg-emerald-400/90 hover:bg-[#00e599] text-black border border-emerald-500/50"
                                      )}
title={isSelected ? "Selected (Click to deselect)" : "Click to select"}
                                    />
                                    {slot.name && (
                                      <span
                                        className="text-xs font-semibold text-slate-900 truncate px-1.5 py-0.5 rounded shadow-xs bg-white/90 backdrop-blur-xs"
                                        title={slot.name}
                                      >
                                        {slot.name}
                                      </span>
                                    )}
                                  </div>

                                  {/* Bottom-left: Slot Number Drag Grip Badge */}
                                  <div
                                    className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 bg-[#090e1a]/95 border border-slate-700/80 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-slate-200 backdrop-blur-md shadow-md"
                                  >
                                    <GripVertical className="w-3.5 h-3.5 text-slate-400 cursor-grab active:cursor-grabbing shrink-0" />
                                    <span className="text-emerald-400">{uiText("app.span.slot", "Slot ")}{i + 1}</span>
                                  </div>

                                  {/* Top-right: Slot action buttons on hover */}
                                  {showSlotHeaders && (
                                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity bg-[#090e1a]/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-md">
                                      <CustomizableButton
                                        buttonId="app_btn_26"
                                        defaultIcon={<Maximize2 className="w-3 h-3" />}
                                        type="button"
disabled={!isFilled}
onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedSliceIndex(i);
                                          setExpandedCustomSlice(slot.url ? { name: slot.name || `Screen ${i + 1}`, url: slot.url } : null);
                                          setExpandedModalOpen(true);
                                        }}
className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30"
title={uiText("app.button.expand_preview.title", "Expand Preview")}
                                      />
                                      <CustomizableButton
                                        buttonId="app_btn_25"
                                        defaultIcon={<CropIcon className="w-3 h-3" />}
                                        type="button"
disabled={!isFilled}
onClick={(e) => {
                                          e.stopPropagation();
                                          if (slot.url) {
                                            handleResendFrameToCrop(slot.url, null, i);
                                          }
                                        }}
className="w-6 h-6 rounded bg-slate-900 hover:bg-amber-950 text-slate-400 hover:text-amber-300 flex items-center justify-center transition-all cursor-pointer disabled:opacity-30"
title={uiText("app.button.edit_crop_frame.title", "Edit / Crop Frame")}
                                      />
                                      <CustomizableButton
                                        buttonId="app_btn_24"
                                        defaultIcon={<Copy className="w-3 h-3" />}
                                        type="button"
disabled={!isFilled}
onClick={(e) => {
                                          e.stopPropagation();
                                          const copy: StoryboardSlotItem = {
                                            ...slot,
                                            name: slot.name ? `${slot.name} (Copy)` : "Copy",
                                            title: slot.title ? `${slot.title} (Copy)` : undefined,
                                          };
                                          setStoryboardSlots((prev) => [
                                            ...prev.slice(0, i + 1),
                                            copy,
                                            ...prev.slice(i + 1),
                                          ]);
                                          setCropNotice(`✓ Duplicated Frame #${i + 1}!`);
                                          setTimeout(() => setCropNotice(null), 2500);
                                        }}
className="w-6 h-6 rounded bg-slate-900 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-all cursor-pointer disabled:opacity-30"
title={uiText("app.button.duplicate_frame.title", "Duplicate Frame")}
                                      />
                                      <CustomizableButton
                                        buttonId="app_btn_23"
                                        defaultIcon={<X className="w-3 h-3" />}
                                        type="button"
disabled={!isFilled}
onClick={(e) => {
                                          e.stopPropagation();
                                          setStoryboardSlots((prev) => {
                                            const next = [...prev];
                                            next[i] = { url: null, name: "", story: "" };
                                            return next;
                                          });
                                        }}
className="w-6 h-6 rounded bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer disabled:opacity-30"
title={uiText("app.button.clear_slot.title", "Clear Slot")}
                                      />
                                      <CustomizableButton
                                        buttonId="app_btn_22"
                                        defaultIcon={<Trash2 className="w-3 h-3" />}
                                        type="button"
onClick={(e) => {
                                          e.stopPropagation();
                                          setStoryboardSlots((prev) => {
                                            const next = prev.filter((_, idx) => idx !== i);
                                            return next.length > 0 ? next : [{ url: null, name: "", story: "" }];
                                          });
                                          setSelectedStoryboardSlotIndices((prev) => {
                                            const next = new Set<number>();
                                            prev.forEach((sel) => {
                                              if (sel < i) next.add(sel);
                                              else if (sel > i) next.add(sel - 1);
                                            });
                                            return next;
                                          });
                                        }}
className="w-6 h-6 rounded bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer"
title={uiText("app.button.delete_slot.title", "Delete Slot")}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Right Side: Title Input & Description Textarea */}
                                <div className="flex-1 flex flex-col gap-2.5 justify-between min-w-0">
                                  {/* Strip Title Input */}
                                  <div className="w-full">
                                    <input
                                      type="text"
                                      value={
                                        slot.title !== undefined
                                          ? slot.title
                                          : slot.name
                                          ? `${String(i + 1).padStart(2, "0")} ${slot.name}`
                                          : `${String(i + 1).padStart(2, "0")} Strip ${i + 1}`
                                      }
                                      placeholder={`${String(i + 1).padStart(2, "0")} Strip Title...`}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setStoryboardSlots((prev) => {
                                          const next = [...prev];
                                          next[i] = { ...next[i], title: val };
                                          return next;
                                        });
                                      }}
                                      className={cn(
                                        "w-full bg-transparent border border-emerald-500/70 focus:border-[#00e599] rounded-lg font-semibold text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#00e599]/50 transition-all font-sans",
                                        slotSize === "sm" ? "px-2.5 py-1 text-xs sm:text-sm" : slotSize === "md" ? "px-3 py-1.5 text-sm sm:text-base" : "px-3.5 py-2 text-base"
                                      )}
                                    />
                                  </div>

                                  {/* Description Textarea */}
                                  <div className="flex-1 flex flex-col">
                                    <textarea
                                      value={slot.story || ""}
                                      placeholder={uiText("app.textarea.this_is_the_description_of_image_number.placeholder", "this is the description of image number...")}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setStoryboardSlots((prev) => {
                                          const next = [...prev];
                                          next[i] = { ...next[i], story: val };
                                          return next;
                                        });
                                      }}
                                      className={cn(
                                        "w-full flex-1 bg-transparent border border-transparent hover:border-slate-800/80 focus:border-emerald-500/50 rounded-lg text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all font-sans leading-relaxed",
                                        slotSize === "sm" ? "p-2 min-h-[50px] text-xs" : slotSize === "md" ? "p-2.5 min-h-[95px] text-xs sm:text-sm" : "p-3 min-h-[145px] text-sm"
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={i}
                              onClick={(e) => handleToggleSelectStoryboardSlot(i, e)}
                              draggable={!isStoryboardLocked && isFilled}
                              onDragStart={(e) => {
                                e.dataTransfer.setData("text/plain", slot.url || "");
                                setDraggedSlotIdx(i);
                              }}
                              onDragEnd={() => setDraggedSlotIdx(null)}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "move";
                              }}
                              onDrop={(e) => handleStoryboardSlotDrop(e, i)}
                              className={cn(
                                "bg-[#090e1a]/90 border rounded-2xl shadow-xl transition-all duration-150 flex flex-col justify-between overflow-hidden relative group/slot cursor-pointer select-none",
                                isSelected
                                  ? "border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-950/25 shadow-emerald-950/40"
                                  : "border-[#1e293b] hover:border-slate-600",
                                draggedSlotIdx === i && "opacity-40 border-dashed border-cyan-400"
                              )}
                            >
                              {/* Slot Top Bar - Compatible with Cell Display Modes */}
                              {showSlotHeaders && (
                                <div
                                  className={cn(
                                  "bg-[#0b1329] px-2 py-1.5 border-b border-[#1e293b] flex items-center justify-between gap-1 text-xs transition-all z-10",
                                  storyboardCellMode === "image-only" &&
                                    "hidden group-hover/slot:flex absolute top-0 left-0 right-0 z-30 bg-[#090e1a]/95 backdrop-blur-md shadow-lg"
                                )}
                              >
                                {/* Left Action Buttons */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Maximize / Expand Preview */}
                                  <CustomizableButton
                                    buttonId="app_btn_21"
                                    defaultIcon={<Maximize2 className="w-3.5 h-3.5" />}
                                    type="button"
disabled={!isFilled}
onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedSliceIndex(i);
                                      setExpandedCustomSlice(
                                        slot.url ? { name: slot.name || `Screen ${i + 1}`, url: slot.url } : null
                                      );
                                      setExpandedModalOpen(true);
                                    }}
className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#020617]/90 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-[#1e293b] flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
title={uiText("app.button.expand_preview.title_2", "Expand Preview")}
                                  />
                                </div>

                                {/* Right Action Buttons */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Duplicate Slot */}
                                  <CustomizableButton
                                    buttonId="app_btn_20"
                                    defaultIcon={<Copy className="w-3.5 h-3.5" />}
                                    type="button"
disabled={!isFilled}
onClick={(e) => {
                                      e.stopPropagation();
                                      const copy: StoryboardSlotItem = {
                                        ...slot,
                                        name: slot.name ? `${slot.name} (Copy)` : "Copy",
                                        title: slot.title ? `${slot.title} (Copy)` : undefined,
                                      };
                                      setStoryboardSlots((prev) => [
                                        ...prev.slice(0, i + 1),
                                        copy,
                                        ...prev.slice(i + 1),
                                      ]);
                                      setCropNotice(`✓ Duplicated Slot #${i + 1}!`);
                                      setTimeout(() => setCropNotice(null), 2500);
                                    }}
className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#020617]/90 hover:bg-cyan-950/80 text-slate-400 hover:text-cyan-300 border border-[#1e293b] hover:border-cyan-500/40 flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
title={uiText("app.button.duplicate_frame.title_2", "Duplicate Frame")}
                                  />

                                  {/* Clear Slot Contents */}
                                  <CustomizableButton
                                    buttonId="app_btn_19"
                                    defaultIcon={<X className="w-3.5 h-3.5" />}
                                    type="button"
disabled={!isFilled}
onClick={(e) => {
                                      e.stopPropagation();
                                      setStoryboardSlots((prev) => {
                                        const next = [...prev];
                                        next[i] = { url: null, name: "", story: "" };
                                        return next;
                                      });
                                    }}
className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#020617]/90 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-[#1e293b] hover:border-rose-900/50 flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
title={uiText("app.button.clear_image_and_story_from_slot.title", "Clear image and story from slot")}
                                  />

                                  {/* Delete Slot Completely */}
                                  <CustomizableButton
                                    buttonId="app_btn_18"
                                    defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                                    type="button"
onClick={(e) => {
                                      e.stopPropagation();
                                      setStoryboardSlots((prev) => {
                                        const next = prev.filter((_, idx) => idx !== i);
                                        return next.length > 0 ? next : [{ url: null, name: "", story: "" }];
                                      });
                                      setSelectedStoryboardSlotIndices((prev) => {
                                        const next = new Set<number>();
                                        prev.forEach((sel) => {
                                          if (sel < i) next.add(sel);
                                          else if (sel > i) next.add(sel - 1);
                                        });
                                        return next;
                                      });
                                    }}
className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#020617]/90 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-[#1e293b] hover:border-rose-500/40 flex items-center justify-center transition-all cursor-pointer shadow-sm"
title={uiText("app.button.delete_slot_completely_from_storyboard.title", "Delete slot completely from storyboard")}
                                  />
                                </div>
                              </div>
                            )}

                              {/* Slot Canvas / Image Body - Scaled with slotSize */}
                              <div
                                className={cn(
                                  "w-full relative flex items-center justify-center overflow-hidden bg-[#020617]/80 group transition-all",
                                  slotSize === "sm"
                                    ? "aspect-[4/3] max-h-36 sm:max-h-44"
                                    : slotSize === "md"
                                    ? "aspect-[4/3] max-h-56 sm:max-h-64"
                                    : "aspect-[4/3] max-h-80 sm:max-h-96"
                                )}
                              >
                                {isFilled ? (
                                  <>
                                    <img
                                      src={slot.url!}
                                      alt={slot.name || `Screen ${i + 1}`}
                                      className="w-full h-full object-contain pointer-events-none select-none transition-transform group-hover/slot:scale-[1.02]"
                                    />

                                    {/* Bottom-left Slot Identifier Badge (Shown in Grid mode with name, hidden in 3x3 no info mode) */}
                                    {storyboardCellMode !== "image-only" && (
                                      <div
                                        className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 bg-[#090e1a]/95 border border-[#1e293b] hover:border-slate-600 px-2 py-1 rounded-lg text-[11px] font-mono font-bold text-slate-200 backdrop-blur-md shadow-md max-w-[85%]"
                                      >
                                        <GripVertical className="w-3.5 h-3.5 text-slate-500 cursor-grab active:cursor-grabbing shrink-0" />
                                        <span className="shrink-0 text-emerald-400 font-black">
                                          {uiText("app.span.slot_2", "Slot ")}{i + 1}
                                        </span>
                                        <input
                                          type="text"
                                          value={slot.name || `Screen ${i + 1}`}
                                          placeholder={`Screen ${i + 1}`}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setStoryboardSlots((prev) => {
                                              const next = [...prev];
                                              next[i] = { ...next[i], name: val };
                                              return next;
                                            });
                                          }}
                                          className="bg-transparent border-0 hover:bg-[#020617]/60 focus:bg-[#020617] text-[11px] font-sans font-medium text-slate-300 px-1 py-0.5 rounded truncate min-w-0 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                        />
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <CustomizableLabel
                                    labelId="app_item_17"
                                    defaultIcon={<ImagePlus className="w-6 h-6 text-slate-600 mb-1.5 group-hover/slot:text-emerald-400 transition-colors" />}
                                    as="label"
                                    onClick={(e) => e.stopPropagation()}
className="w-full h-full flex flex-col items-center justify-center p-3 text-center cursor-pointer border-2 border-dashed border-[#1e293b] hover:border-emerald-500/50 hover:bg-emerald-950/10 transition-all rounded-xl m-2"
                                  >
                                      {() => (
                                          <>
                                            <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleStoryboardSlotUpload(file, i);
                                      }}
                                    />
                                          <span className="text-[11px] font-semibold text-slate-400 group-hover/slot:text-slate-200">
                                      {uiText("app.span.empty_slot_2", "Empty Slot #")}{i + 1}
                                    </span>
                                          <span className="text-[9px] text-slate-600 mt-0.5">
                                      {uiText("app.span.drop_slice_or_click_to_upload_2", "Drop slice or click to upload")}
                                    </span>
                                          </>
                                        )}
                                  </CustomizableLabel>
                                )}
                              </div>

                              {/* Slot Footer (Story / Dialogue narration if cellMode === "full") */}
                              {storyboardCellMode === "full" && (
                                <div className="p-2 border-t border-[#1e293b] bg-[#020617]/50">
                                  <textarea
                                    value={slot.story || ""}
                                    placeholder={uiText("app.textarea.frame_dialogue_story_notes.placeholder", "Frame dialogue / story notes...")}
                                    rows={2}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setStoryboardSlots((prev) => {
                                        const next = [...prev];
                                        next[i] = { ...next[i], story: val };
                                        return next;
                                      });
                                    }}
                                    className="w-full bg-[#090e1a] border border-[#1e293b] focus:border-emerald-500 rounded p-1.5 text-[10px] text-slate-300 resize-none focus:outline-none placeholder:text-slate-600"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Floating / Sticky Slot Operations Bar for Quick Selection, Reverse, and Duplicate */}
                      {selectedStoryboardSlotIndices.size > 0 && (
                        <div className="sticky bottom-3 z-40 mx-auto max-w-2xl w-full px-4 py-2.5 bg-[#090e1a]/95 border border-emerald-500/60 rounded-2xl shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in slide-in-from-bottom-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-mono font-black text-xs flex items-center justify-center shadow-sm">
                              {selectedStoryboardSlotIndices.size}
                            </span>
                            <span className="text-xs font-bold text-slate-100">
                              {uiText("app.span.slot_3", "Slot")}{selectedStoryboardSlotIndices.size > 1 ? "s" : ""}{uiText("app.span.selected_4", " Selected")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Reverse Selected */}
                            <CustomizableButton
                              buttonId="app_btn_16"
                              defaultIcon={<ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />}
                              type="button"
onClick={handleReverseStoryboardSlots}
className="px-2.5 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-200 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
title={uiText("app.button.reverse_the_sequence_order_of_the_selected_s.title", "Reverse the sequence order of the selected slots")}
                            >
                                {() => (
                                    <>
                                      <span>{uiText("app.span.reverse_selected", "Reverse Selected")}</span>
                                    </>
                                  )}
                            </CustomizableButton>

                            {/* Duplicate Selected */}
                            <CustomizableButton
                              buttonId="app_btn_15"
                              defaultIcon={<Copy className="w-3.5 h-3.5 text-cyan-400" />}
                              type="button"
onClick={handleDuplicateStoryboardSlots}
className="px-2.5 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
title={uiText("app.button.duplicate_the_selected_frames_in_storyboard.title", "Duplicate the selected frames in storyboard")}
                            >
                                {() => (
                                    <>
                                      <span>{uiText("app.span.duplicate_frames", "Duplicate Frames")}</span>
                                    </>
                                  )}
                            </CustomizableButton>

                            {/* Duplicate & Reverse (Loop) */}
                            <CustomizableButton
                              buttonId="app_btn_14"
                              defaultIcon={<RefreshCw className="w-3.5 h-3.5 text-indigo-400" />}
                              type="button"
onClick={handleDuplicateAndReverseStoryboardSlots}
className="px-2.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/60 text-indigo-200 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all hidden sm:flex"
title={uiText("app.button.duplicate_selected_frames_in_reverse_sequenc.title", "Duplicate selected frames in reverse sequence (Ping-Pong loop)")}
                            >
                                {() => (
                                    <>
                                      <span>{uiText("app.span.duplicate_and_reverse", "Duplicate & Reverse")}</span>
                                    </>
                                  )}
                            </CustomizableButton>

                            {/* Slot Operations Modal */}
                            <CustomizableButton
                              buttonId="app_btn_13"
                              defaultIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />}
                              type="button"
onClick={() => setIsStoryboardOperationsOpen(true)}
className="px-2.5 py-1.5 bg-[#020617] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
title={uiText("app.button.open_complete_storyboard_slot_operations_dia.title", "Open complete Storyboard Slot Operations dialog")}
                            >
                                {() => (
                                    <>
                                      <span>{uiText("app.span.more_operations", "More Operations")}</span>
                                    </>
                                  )}
                            </CustomizableButton>

                            {/* Clear selection */}
                            <CustomizableButton
                              buttonId="app_btn_12"
                              defaultIcon={<X className="w-3.5 h-3.5" />}
                              type="button"
onClick={() => setSelectedStoryboardSlotIndices(new Set())}
className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-700 flex items-center justify-center cursor-pointer transition-all ml-0.5"
title={uiText("app.button.deselect_all_slots.title", "Deselect all slots")}
                            />
                          </div>
                        </div>
                      )}

                      {/* Hint underneath Storyboard grid */}
                      <div className="flex flex-wrap items-center justify-between w-full max-w-5xl mt-3 px-2 text-[10px] text-slate-500 gap-2 shrink-0">
                        <span>{uiText("app.span.drag_slices_from_the_left_panel_onto_any_slo", "💡 Drag slices from the left panel onto any slot, or use ")}<b>{uiText("app.b.overwrite", "Overwrite")}</b>, <b>{uiText("app.b.fill_empties", "Fill Empties")}</b>{uiText("app.span.and", ", and ")}<b>{uiText("app.b.append", "Append")}</b>{uiText("app.span.to_batch_insert", " to batch insert.")}</span>
                        <div className="flex items-center gap-3">
                          <CustomizableButton
                            buttonId="app_btn_11"
                            type="button"
onClick={() =>
                              setStoryboardSlots(
                                Array.from({ length: 9 }, () => ({
                                  url: null,
                                  name: "",
                                  story: "",
                                }))
                              )
                            }
className="text-slate-500 hover:text-slate-300 underline cursor-pointer"
                          >
                              {() => (
                                  <>
                                    {uiText("app.button.reset_to_9_empty_slots", "Reset to 9 Empty Slots")}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#020617]">
                      <Film className="w-10 h-10 text-slate-600 mb-3" />
                      <CustomizableLabel
                        labelId="app_item_10"
                        as="h3"
                        className="text-sm font-bold text-slate-200 mb-1"
                      >
                          {() => (
                              <>
                                {uiText("app.h3.storyboard_canvas_is_hidden", "Storyboard Canvas is Hidden")}
                              </>
                            )}
                      </CustomizableLabel>
                      <p className="text-xs text-slate-400 mb-4">{uiText("app.p.you_have_expanded_the_carved_slices_panel", "You have expanded the Carved Slices panel.")}</p>
                      <CustomizableButton
                        buttonId="app_btn_9"
                        type="button"
onClick={() => setIsStoryboardVisible(true)}
className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                      >
                          {() => (
                              <>
                                {uiText("app.button.restore_storyboard_view", "Restore Storyboard View")}
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  )
                ) : (
                <div
                  ref={canvasContainerRef}
                onMouseDown={handlePanMouseDown}
                onMouseMove={handlePanMouseMove}
                onMouseUp={handlePanMouseUp}
                onMouseLeave={handlePanMouseUp}
                className={cn(
                  "flex-1 p-4 overflow-auto flex items-center justify-center relative select-none",
                  (isPanToolActive || canvasFitMode === "actual") && (isPanning ? "cursor-grabbing" : "cursor-grab")
                )}
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDcwZTE2IiAvPgo8cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDcwZTE2IiAvPgo8L3N2Zz4=\")",
                }}
              >
                {/* Floating Clear Cuts Action Button in Canvas Viewport */}
                {(mode === "crop" || mode === "carve") && imageSrc && (
                  <div className="absolute top-3 left-4 z-20 pointer-events-auto">
                    <CustomizableButton
                      buttonId="canvas_clear_cuts"
                      defaultLabel="Clear Cuts"
                      defaultIcon={<Scissors className="w-3.5 h-3.5 text-rose-400" />}
                      onClick={() => {
                        if (mode === "carve") {
                          setRowCuts([]);
                          setColCuts([]);
                          setNumRows(1);
                          setNumCols(1);
                          setCropNotice("\u2713 Cleared all cut lines on canvas");
                        } else {
                          setCrop(undefined);
                          setCompletedPercentCrop(null);
                          setCompletedPixelCrop(null);
                          setMultiCrops([]);
                          setFreestyleSquares([]);
                          setSelectedFreestyleSquareId(null);
                          setSelectedFreestyleSquareIds([]);
                          setCropNotice("\u2713 Cleared all active cuts & selections on canvas");
                        }
                        setTimeout(() => setCropNotice(null), 2500);
                      }}
                      title="Clear all active cuts and reset crop/grid cuts"
                      className="px-2.5 py-1 bg-rose-950/70 hover:bg-rose-900/90 text-rose-300 border border-rose-800/60 hover:border-rose-500/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer backdrop-blur-sm"
                    />
                  </div>
                )}

                {mode === "crop" && (
                  <div
                    onWheel={(e) => {
                      // Shift + Mouse Wheel Vertical Panning: smoothly moves the image viewport up and down without triggering slice rotation
                      if (e.shiftKey) {
                        const container = e.currentTarget;
                        container.scrollTop += e.deltaY;
                        return;
                      }

                      // In crop canvas, mouse wheel rotates to next slice
                      if (storyboardSlices.length > 1) {
                        e.preventDefault();
                        const currentUrls = Array.from(selectedSliceUrls);
                        const firstSelectedUrl = currentUrls[0];
                        const currentIdx = firstSelectedUrl ? storyboardSlices.findIndex((s) => s.url === firstSelectedUrl) : 0;
                        const validCurrentIdx = currentIdx >= 0 ? currentIdx : 0;

                        if (e.deltaY > 0) {
                          const nextIdx = (validCurrentIdx + 1) % storyboardSlices.length;
                          setSelectedSliceUrls(new Set([storyboardSlices[nextIdx].url]));
                        } else if (e.deltaY < 0) {
                          const prevIdx = (validCurrentIdx - 1 + storyboardSlices.length) % storyboardSlices.length;
                          setSelectedSliceUrls(new Set([storyboardSlices[prevIdx].url]));
                        }
                      } else if (isMeshToolActive && meshMode === "freestyle" && freestyleSquares.length > 1) {
                        e.preventDefault();
                        const curIdx = freestyleSquares.findIndex((s) => s.id === selectedFreestyleSquareId);
                        const validIdx = curIdx >= 0 ? curIdx : 0;
                        if (e.deltaY > 0) {
                          const nextIdx = (validIdx + 1) % freestyleSquares.length;
                          setSelectedFreestyleSquareId(freestyleSquares[nextIdx].id);
                          setSelectedFreestyleSquareIds([freestyleSquares[nextIdx].id]);
                        } else if (e.deltaY < 0) {
                          const prevIdx = (validIdx - 1 + freestyleSquares.length) % freestyleSquares.length;
                          setSelectedFreestyleSquareId(freestyleSquares[prevIdx].id);
                          setSelectedFreestyleSquareIds([freestyleSquares[prevIdx].id]);
                        }
                      }
                    }}
                    className={cn(
                      "flex items-center justify-center border border-slate-800 shadow-2xl bg-slate-950 rounded-lg p-1 transition-all duration-150 relative",
                      isMeshToolActive
                        ? "!overflow-visible z-20"
                        : canvasFitMode === "fit"
                        ? "max-w-full max-h-full overflow-hidden"
                        : canvasFitMode === "fit-width"
                        ? "w-full max-h-full overflow-hidden"
                        : canvasFitMode === "fit-height"
                        ? "h-full max-w-full overflow-hidden"
                        : canvasFitMode === "custom"
                        ? "overflow-auto"
                        : "max-w-none max-h-none overflow-auto"
                    )}
                    style={canvasFitMode === "custom" ? { transform: `scale(${canvasZoom})`, transformOrigin: "center center" } : undefined}
                  >
                    <ReactCrop
                      crop={crop}
                      aspect={cropAspect}
                      circularCrop={isCircularCrop}
                      disabled={isMeshToolActive}
                      onChange={(c, pc) => {
                        setCrop(c);
                        setCompletedPercentCrop(pc);
                      }}
                      onComplete={(c, pc) => {
                        setCompletedPixelCrop(c);
                        setCompletedPercentCrop(pc);

                        if (isShiftPressed && pc.width && pc.height && pc.width > 0 && pc.height > 0) {
                          const isDuplicate = multiCrops.some(
                            (item) =>
                              Math.abs(item.crop.x - pc.x) < 0.1 && Math.abs(item.crop.y - pc.y) < 0.1
                          );
                          if (!isDuplicate) {
                            setMultiCrops((prev) => [
                              ...prev,
                              {
                                id: Math.random().toString(36).substr(2, 9),
                                crop: { ...pc },
                                isCircular: isCircularCrop,
                              },
                            ]);
                            setCrop(undefined);
                            setCompletedPercentCrop(null);
                            setCompletedPixelCrop(null);
                            setCropNotice("\u2713 Multi-crop area added!");
                            setTimeout(() => setCropNotice(null), 2000);
                          }
                        }
                      }}
                      className={cn(
                        isMeshToolActive ? "!overflow-visible z-20" : "",
                        canvasFitMode === "fit" ? "max-h-[calc(100vh-140px)]" : "max-h-none max-w-none"
                      )}
                    >
                      <img
                        ref={imgRef}
                        alt={uiText("app.img.workspace_upload.alt", "Workspace Upload")}
                        src={imageSrc}
                        onLoad={(e) => {
                          const target = e.currentTarget;
                          if (target && target.src && !originalImageSrc) {
                            setOriginalImageSrc(target.src);
                          }
                        }}
                        className={cn(
                          "block transition-all select-none",
                          canvasFitMode === "fit"
                            ? "max-w-full max-h-[calc(100vh-140px)] w-auto h-auto object-contain"
                            : canvasFitMode === "fit-width"
                            ? "w-full max-w-full h-auto object-contain"
                            : canvasFitMode === "fit-height"
                            ? "h-full max-h-[calc(100vh-140px)] w-auto object-contain"
                            : canvasFitMode === "custom"
                            ? "max-w-none max-h-none w-auto h-auto"
                            : "max-w-none max-h-none w-auto h-auto object-none"
                        )}
                      />

                      {/* Render interactive Mesh Grid Overlay if mesh tool is active */}
                      {isMeshToolActive && imageSrc && (
                        <CropMeshOverlay
                          imageElement={imgRef.current}
                          meshBounds={meshBounds}
                          onMeshBoundsChange={setMeshBounds}
                          squareSize={meshSquareSize}
                          onSquareSizeChange={setMeshSquareSize}
                          gridLineWidth={meshGridLineWidth}
                          onGridLineWidthChange={setMeshGridLineWidth}
                          gridLineColor={meshGridLineColor}
                          onGridLineColorChange={setMeshGridLineColor}
                          autoGotoAfterCut={meshAutoGotoAfterCut}
                          onToggleAutoGotoAfterCut={() => setMeshAutoGotoAfterCut((prev) => !prev)}
                          onCutMesh={handleCutMeshIntoSquares}
                          onClose={() => setIsMeshToolActive(false)}
                          slicePrefix={slicePrefix}
                          isAdjustingLines={isAdjustingGridLines}
                          onToggleAdjustLines={() => setIsAdjustingGridLines((prev) => !prev)}
                          isFreestyle={meshMode === "freestyle"}
                          freestyleSquares={freestyleSquares}
                          onFreestyleSquaresChange={setFreestyleSquares}
                          selectedFreestyleId={selectedFreestyleSquareId}
                          onSelectFreestyleId={setSelectedFreestyleSquareId}
                          selectedFreestyleIds={selectedFreestyleSquareIds}
                          onSelectFreestyleIds={setSelectedFreestyleSquareIds}
                          onResizeFreestyleSquare={handleResizeFreestyleSquare}
                          onDuplicateFreestyleSquare={handleDuplicateFreestyleSquare}
                          onDuplicateFreestyleSquares={handleDuplicateFreestyleSquares}
                          onDeleteFreestyleSquare={handleDeleteFreestyleSquare}
                          onDeleteFreestyleSquares={handleDeleteFreestyleSquares}
                          onMergeFreestyleSquares={handleMergeFreestyleSquares}
                          freestyleTool={freestyleTool}
                          onFreestyleToolChange={setFreestyleTool}
                          activeTrapezePreset={activeTrapezePreset}
                          onActiveTrapezePresetChange={setActiveTrapezePreset}
                          activePolygonPoints={activePolygonPoints}
                          onActivePolygonPointsChange={setActivePolygonPoints}
                          onJumpToPanelPreview={handleJumpToSidebarLivePreview}
                        />
                      )}

                      {/* Render other saved multi-crop areas */}
                      {multiCrops.map((item, index) => (
                        <div
                          key={item.id}
                          className={cn(
                            "absolute border-2 border-dashed border-[#10b981] pointer-events-auto z-10 flex items-center justify-center group shadow-md transition-all",
                            item.isCircular ? "rounded-full" : ""
                          )}
                          style={{
                            left: `${item.crop.x}%`,
                            top: `${item.crop.y}%`,
                            width: `${item.crop.width}%`,
                            height: `${item.crop.height}%`,
                            backgroundColor: "rgba(16, 185, 129, 0.15)",
                          }}
                        >
                          <div className="absolute top-1 left-1 bg-emerald-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow pointer-events-none select-none">
                            <span>#{index + 1}</span>
                            {item.isCircular ? <span>{uiText("app.span.oval", "Oval")}</span> : <span>{uiText("app.span.rect", "Rect")}</span>}
                          </div>

                          {/* Hover delete button */}
                          <CustomizableButton
                            buttonId="app_btn_8"
                            defaultIcon={<Trash2 className="w-3 h-3" />}
                            type="button"
onClick={(e) => {
                              e.stopPropagation();
                              setMultiCrops((prev) => prev.filter((c) => c.id !== item.id));
                            }}
className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-rose-600 hover:bg-rose-500 text-white rounded-full p-1 cursor-pointer shadow-lg"
title={uiText("app.button.remove_this_crop_area.title", "Remove this crop area")}
                          />
                        </div>
                      ))}
                    </ReactCrop>
                  </div>
                )}

                {mode === "carve" && croppedImageSrc && (
                  <div
                    className={cn(
                      "relative border border-slate-800 shadow-2xl bg-slate-950 inline-block rounded-lg select-none transition-all duration-150",
                      canvasFitMode === "fit"
                        ? "max-w-full max-h-full overflow-hidden"
                        : canvasFitMode === "fit-width"
                        ? "w-full max-h-full overflow-hidden"
                        : canvasFitMode === "fit-height"
                        ? "h-full max-w-full overflow-hidden"
                        : canvasFitMode === "custom"
                        ? "overflow-auto"
                        : "max-w-none max-h-none overflow-auto",
                      dragging && "cursor-grabbing"
                    )}
                    style={canvasFitMode === "custom" ? { transform: `scale(${canvasZoom})`, transformOrigin: "center center" } : undefined}
                  >
                    <img
                      ref={carveImgRef}
                      src={croppedImageSrc}
                      alt={uiText("app.img.cropped_segment_preview.alt", "Cropped segment preview")}
                      className={cn(
                        "block pointer-events-none transition-all",
                        canvasFitMode === "fit"
                          ? "max-w-full max-h-[calc(100vh-140px)] w-auto h-auto object-contain"
                          : canvasFitMode === "fit-width"
                          ? "w-full max-w-full h-auto object-contain"
                          : canvasFitMode === "fit-height"
                          ? "h-full max-h-[calc(100vh-140px)] w-auto object-contain"
                          : canvasFitMode === "custom"
                          ? "max-w-none max-h-none w-auto h-auto"
                          : "max-w-none max-h-none w-auto h-auto"
                      )}
                      draggable={false}
                      onLoad={(e) => setCarveImageSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
                    />
                    {carveImageSize.width > 0 && carveImageSize.height > 0 && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div
                          className="relative w-full h-full"
                          style={carverSkew !== 0 ? { transform: `skewX(${carverSkew}deg)`, transformOrigin: "center" } : undefined}
                        >
                          {/* Outer Frame Margin / Perimeter Trim Overlays */}
                          {outerMargin > 0 && (
                            <>
                              {/* Top Trim */}
                              <div
                                className="absolute top-0 left-0 right-0 z-10 pointer-events-none transition-all shadow-sm border-b border-dashed"
                                style={{
                                  height: `${(outerMargin / carveImageSize.height) * 100}%`,
                                  backgroundColor: sliceLineColor,
                                  opacity: sliceLineColor.toLowerCase() === "#ffffff" ? 0.85 : 0.65,
                                  borderColor: sliceLineColor.toLowerCase() === "#ffffff" ? "#cbd5e1" : sliceLineColor,
                                }}
                              />
                              {/* Bottom Trim */}
                              <div
                                className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none transition-all shadow-sm border-t border-dashed"
                                style={{
                                  height: `${(outerMargin / carveImageSize.height) * 100}%`,
                                  backgroundColor: sliceLineColor,
                                  opacity: sliceLineColor.toLowerCase() === "#ffffff" ? 0.85 : 0.65,
                                  borderColor: sliceLineColor.toLowerCase() === "#ffffff" ? "#cbd5e1" : sliceLineColor,
                                }}
                              />
                              {/* Left Trim */}
                              <div
                                className="absolute top-0 bottom-0 left-0 z-10 pointer-events-none transition-all shadow-sm border-r border-dashed"
                                style={{
                                  width: `${(outerMargin / carveImageSize.width) * 100}%`,
                                  backgroundColor: sliceLineColor,
                                  opacity: sliceLineColor.toLowerCase() === "#ffffff" ? 0.85 : 0.65,
                                  borderColor: sliceLineColor.toLowerCase() === "#ffffff" ? "#cbd5e1" : sliceLineColor,
                                }}
                              />
                              {/* Right Trim */}
                              <div
                                className="absolute top-0 bottom-0 right-0 z-10 pointer-events-none transition-all shadow-sm border-l border-dashed"
                                style={{
                                  width: `${(outerMargin / carveImageSize.width) * 100}%`,
                                  backgroundColor: sliceLineColor,
                                  opacity: sliceLineColor.toLowerCase() === "#ffffff" ? 0.85 : 0.65,
                                  borderColor: sliceLineColor.toLowerCase() === "#ffffff" ? "#cbd5e1" : sliceLineColor,
                                }}
                              />
                            </>
                          )}

                          {/* Active Slice Cell Bounds Highlight when Cell Padding is configured */}
                          {sliceCellPadding !== 0 && gridSegments.length > 0 && (
                            <div className="absolute inset-0 pointer-events-none z-10">
                              {gridSegments.map((seg) => (
                                <div
                                  key={`cell-pad-box-${seg.r}-${seg.c}-${seg.seq}`}
                                  className={cn(
                                    "absolute pointer-events-none rounded transition-all border",
                                    sliceCellPadding < 0
                                      ? "border-amber-400/70 border-dashed bg-amber-400/5 shadow-[0_0_10px_rgba(251,191,36,0.15)]"
                                      : "border-cyan-400/70 border-dashed bg-cyan-400/5 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                                  )}
                                  style={{
                                    top: `${seg.topPercent}%`,
                                    left: `${seg.leftPercent}%`,
                                    width: `${seg.widthPercent}%`,
                                    height: `${seg.heightPercent}%`,
                                  }}
                                >
                                  <div className="absolute top-1 left-1 text-[8px] font-mono px-1 py-0.2 rounded bg-black/75 text-slate-200">
                                    {sliceCellPadding < 0 ? "EXPAND" : "PAD"} {Math.abs(sliceCellPadding)}{uiText("app.div.px", "px")}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Grid Segment Numbering Labels (1-N) */}
                          {showGridLabels && gridSegments.length > 0 && (
                            <div className="absolute inset-0 pointer-events-none z-10">
                              {gridSegments.map((seg) => {
                                const isSelected = selectedSplitIndices.has(seg.seq);
                                const isNumberOne = seg.seq === 1;
                                const displayLabel = getSegmentPresetLabel(
                                  gridLabelPreset,
                                  { r: seg.r, c: seg.c, seq: seg.seq },
                                  customGridLabelPrefix
                                );
                                return (
                                  <div
                                    key={`segment-num-${seg.r}-${seg.c}-${seg.seq}`}
                                    className="absolute flex items-center justify-center pointer-events-none select-none"
                                    style={{
                                      top: `${seg.topPercent}%`,
                                      left: `${seg.leftPercent}%`,
                                      width: `${seg.widthPercent}%`,
                                      height: `${seg.heightPercent}%`,
                                    }}
                                  >
                                    <CustomizableButton
                                      buttonId="app_btn_7"
                                      type="button"
onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSplitIndex(seg.seq);
                                      }}
className={cn(
                                        "pointer-events-auto cursor-pointer transition-all duration-150 select-none group flex items-center justify-center gap-1",
                                        "font-mono font-black rounded-lg shadow-2xl backdrop-blur-md border",
                                        "hover:scale-110 active:scale-95",
                                        isNumberOne
                                          ? isSelected
                                            ? "bg-amber-400 text-slate-950 border-amber-200 ring-2 ring-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.95)] scale-110 px-3 py-1.5 text-sm sm:text-base font-black"
                                            : "bg-slate-950/90 hover:bg-slate-900 text-amber-300 hover:text-amber-200 border-amber-400/80 hover:border-amber-300 ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.5)] scale-110 px-3 py-1.5 text-sm sm:text-base font-black"
                                          : isSelected
                                          ? "bg-[#10b981] text-slate-950 border-emerald-300 ring-2 ring-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.8)] scale-105 px-2.5 py-1 text-xs sm:text-sm"
                                          : "bg-slate-950/85 hover:bg-slate-900 text-emerald-400 hover:text-emerald-300 border-emerald-500/50 hover:border-emerald-400 ring-1 ring-emerald-500/25 shadow-[0_4px_12px_rgba(0,0,0,0.85)] px-2.5 py-1 text-xs sm:text-sm"
                                      )}
title={`Grid Segment ${displayLabel}${isNumberOne ? " (Starting Corner #1)" : ""} (${seg.widthPx} × ${seg.heightPx} px) — Click to toggle selection`}
                                    >
                                        {() => (
                                            <>
                                              <span
                                        className={cn(
                                          "leading-none drop-shadow-sm font-black",
                                          isNumberOne && !isSelected && "text-amber-300"
                                        )}
                                      >
                                        {displayLabel}
                                      </span>
                                            {namingStyle === "grid" && gridLabelPreset !== "matrix" && (
                                        <span
                                          className={cn(
                                            "text-[9px] font-mono leading-none tracking-tighter opacity-80",
                                            isSelected ? "text-slate-900 font-bold" : isNumberOne ? "text-amber-400/80" : "text-slate-400"
                                          )}
                                        >
                                          {uiText("app.span.r", "R")}{seg.r + 1}{uiText("app.span.c", "C")}{seg.c + 1}
                                        </span>
                                      )}
                                            </>
                                          )}
                                    </CustomizableButton>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {rowCuts.map((cutY, idx) => {
                            const isDraggingThis =
                              dragging?.type === "row" && dragging.index === idx;
                            const isSelected =
                              selectedCutLine?.type === "row" &&
                              selectedCutLine.index === idx;
                            const isActive = isDraggingThis || isSelected;
                            const halfBefore = Math.floor(sliceLineThicknessY / 2);
                            const thickness = Math.max(1, sliceLineThicknessY);
                            // Vibrant Rose/Coral for rows
                            const rowColor = "#f43f5e";
                            return (
                              <div
                                key={`line-r-${idx}`}
                                className={cn(
                                  "absolute left-0 right-0 z-20 group select-none",
                                  isAdjusting && "pointer-events-auto cursor-row-resize"
                                )}
                                style={{
                                  top: `${(cutY / carveImageSize.height) * 100}%`,
                                  marginTop: `-${halfBefore}px`,
                                  height: `${thickness}px`,
                                }}
                                onPointerDown={
                                  isAdjusting
                                    ? (e) => {
                                        e.preventDefault();
                                        (e.currentTarget as HTMLElement).setPointerCapture?.(
                                          e.pointerId
                                        );
                                        setSelectedCutLine({ type: "row", index: idx });
                                        setDragging({
                                          type: "row",
                                          index: idx,
                                          startClientY: e.clientY,
                                          startCutVal: cutY,
                                        });
                                      }
                                    : undefined
                                }
                              >
                                {/* Invisible 28px Hit Area to prevent cursor slipping or sticky tracking */}
                                {isAdjusting && (
                                  <div className="absolute -top-3.5 -bottom-3.5 left-0 right-0 cursor-row-resize z-20 pointer-events-auto" />
                                )}
                                <div
                                  className={cn(
                                    "absolute inset-0 transition-colors shadow-[0_0_8px_rgba(0,0,0,0.8)]",
                                    sliceLineStyle === "dashed" && "border-t border-dashed",
                                    sliceLineStyle === "dotted" && "border-t border-dotted",
                                    isActive
                                      ? "animate-pulse opacity-100 ring-1 ring-rose-400"
                                      : "opacity-90",
                                    isAdjusting && "group-hover:opacity-100"
                                  )}
                                  style={{
                                    backgroundColor:
                                      sliceLineStyle === "solid" ? rowColor : "transparent",
                                    borderColor: rowColor,
                                    borderTopWidth:
                                      sliceLineStyle !== "solid"
                                        ? `${thickness}px`
                                        : undefined,
                                  }}
                                />
                                {isAdjusting && (showPixelLabels || isActive) && (
                                  <div
                                    className={cn(
                                      "absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-auto px-1.5 py-0.5 rounded-full border shadow-lg transition-transform text-[9px] font-mono font-bold gap-1 select-none z-30 pointer-events-auto backdrop-blur-md",
                                      isActive
                                        ? "scale-110 bg-slate-900 border-rose-500 text-rose-300 ring-2 ring-rose-500/30"
                                        : "bg-slate-900/90 border-slate-700 text-slate-300 hover:border-rose-400"
                                    )}
                                    title={uiText("app.div.click_to_select_drag_to_move_hold_shift_for.title", "Click to select • Drag to move • Hold Shift for micro-adjust • Up/Down arrows to nudge 1px")}
                                  >
                                    <CustomizableButton
                                      buttonId="app_btn_6"
                                      defaultLabel={"-"}
                                      type="button"
onClick={(e) => {
                                        e.stopPropagation();
                                        nudgeCut("row", idx, -1);
                                      }}
className="hover:text-rose-400 px-1 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer text-[10px]"
title={uiText("app.button.nudge_up_1px_arrowup.title", "Nudge Up 1px (ArrowUp)")}
                                    />
                                    <span>{Math.round(cutY)}{uiText("app.span.px_8", "px")}</span>
                                    <CustomizableButton
                                      buttonId="app_btn_5"
                                      defaultLabel={"+"}
                                      type="button"
onClick={(e) => {
                                        e.stopPropagation();
                                        nudgeCut("row", idx, 1);
                                      }}
className="hover:text-rose-400 px-1 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer text-[10px]"
title={uiText("app.button.nudge_down_1px_arrowdown.title", "Nudge Down 1px (ArrowDown)")}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {colCuts.map((cutX, idx) => {
                            const isDraggingThis =
                              dragging?.type === "col" && dragging.index === idx;
                            const isSelected =
                              selectedCutLine?.type === "col" &&
                              selectedCutLine.index === idx;
                            const isActive = isDraggingThis || isSelected;
                            const halfBefore = Math.floor(sliceLineThicknessX / 2);
                            const thickness = Math.max(1, sliceLineThicknessX);
                            const colColor = "#06b6d4";
                            return (
                              <div
                                key={`line-c-${idx}`}
                                className={cn(
                                  "absolute top-0 bottom-0 z-20 group select-none",
                                  isAdjusting && "pointer-events-auto cursor-col-resize"
                                )}
                                style={{
                                  left: `${(cutX / carveImageSize.width) * 100}%`,
                                  marginLeft: `-${halfBefore}px`,
                                  width: `${thickness}px`,
                                }}
                                onPointerDown={
                                  isAdjusting
                                    ? (e) => {
                                        e.preventDefault();
                                        (e.currentTarget as HTMLElement).setPointerCapture?.(
                                          e.pointerId
                                        );
                                        setSelectedCutLine({ type: "col", index: idx });
                                        setDragging({
                                          type: "col",
                                          index: idx,
                                          startClientX: e.clientX,
                                          startCutVal: cutX,
                                        });
                                      }
                                    : undefined
                                }
                              >
                                {/* Invisible 28px Hit Area to prevent cursor slipping or sticky tracking */}
                                {isAdjusting && (
                                  <div className="absolute -left-3.5 -right-3.5 top-0 bottom-0 cursor-col-resize z-20 pointer-events-auto" />
                                )}
                                <div
                                  className={cn(
                                    "absolute inset-0 transition-colors shadow-[0_0_8px_rgba(0,0,0,0.8)]",
                                    sliceLineStyle === "dashed" && "border-l border-dashed",
                                    sliceLineStyle === "dotted" && "border-l border-dotted",
                                    isActive
                                      ? "animate-pulse opacity-100 ring-1 ring-cyan-400"
                                      : "opacity-90",
                                    isAdjusting && "group-hover:opacity-100"
                                  )}
                                  style={{
                                    backgroundColor:
                                      sliceLineStyle === "solid" ? colColor : "transparent",
                                    borderColor: colColor,
                                    borderLeftWidth:
                                      sliceLineStyle !== "solid"
                                        ? `${thickness}px`
                                        : undefined,
                                  }}
                                />
                                {isAdjusting && (showPixelLabels || isActive) && (
                                  <div
                                    className={cn(
                                      "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-auto px-1.5 py-0.5 rounded-full border shadow-lg transition-transform text-[9px] font-mono font-bold gap-1 select-none z-30 pointer-events-auto backdrop-blur-md",
                                      isActive
                                        ? "scale-110 bg-slate-900 border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/30"
                                        : "bg-slate-900/90 border-slate-700 text-slate-300 hover:border-cyan-400"
                                    )}
                                    title={uiText("app.div.click_to_select_drag_to_move_hold_shift_for.title_2", "Click to select • Drag to move • Hold Shift for micro-adjust • Left/Right arrows to nudge 1px")}
                                  >
                                    <CustomizableButton
                                      buttonId="app_btn_4"
                                      defaultLabel={"-"}
                                      type="button"
onClick={(e) => {
                                        e.stopPropagation();
                                        nudgeCut("col", idx, -1);
                                      }}
className="hover:text-cyan-400 px-1 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer text-[10px]"
title={uiText("app.button.nudge_left_1px_arrowleft.title", "Nudge Left 1px (ArrowLeft)")}
                                    />
                                    <span>{Math.round(cutX)}{uiText("app.span.px_9", "px")}</span>
                                    <CustomizableButton
                                      buttonId="app_btn_3"
                                      defaultLabel={"+"}
                                      type="button"
onClick={(e) => {
                                        e.stopPropagation();
                                        nudgeCut("col", idx, 1);
                                      }}
className="hover:text-cyan-400 px-1 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer text-[10px]"
title={uiText("app.button.nudge_right_1px_arrowright.title", "Nudge Right 1px (ArrowRight)")}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
                )}
            </div>

            {/* Live Splits Preview Dock - Horizontal Bottom Layout */}
            {mode === "carve" && isSplitPreviewVisible && splitPreviewOrientation === "horizontal" && (
              <SplitsPreviewDock
                gridSegments={gridSegments}
                selectedSplitIndices={selectedSplitIndices}
                toggleSplitIndex={toggleSplitIndex}
                toggleSelectAllSplits={toggleSelectAllSplits}
                imageSrc={croppedImageSrc || imageSrc}
                orientation="horizontal"
                onToggleOrientation={() => setSplitPreviewOrientation("vertical")}
                onClose={() => setIsSplitPreviewVisible(false)}
                onSendToStoryboard={handleOpenStoryboard}
                onDownloadZip={handleDownload}
                onCopySnapshotFirst={handleCopyLiveCanvasSnapshotToStoryboardFirst}
                copySnapshotFirst={copySnapshotFirst}
                onToggleCopySnapshotFirst={setCopySnapshotFirst}
                gridLabelPreset={gridLabelPreset}
                customGridLabelPrefix={customGridLabelPrefix}
                splitPreviewSize={splitPreviewSize}
                setSplitPreviewSize={setSplitPreviewSize}
                isProcessing={isProcessing}
              />
            )}
          </main>
          )}

          {/* Live Splits Preview Dock - Vertical Sidebar Layout */}
          {mode === "carve" && isSplitPreviewVisible && splitPreviewOrientation === "vertical" && (
            <SplitsPreviewDock
              gridSegments={gridSegments}
              selectedSplitIndices={selectedSplitIndices}
              toggleSplitIndex={toggleSplitIndex}
              toggleSelectAllSplits={toggleSelectAllSplits}
              imageSrc={croppedImageSrc || imageSrc}
              orientation="vertical"
              onToggleOrientation={() => setSplitPreviewOrientation("horizontal")}
              onClose={() => setIsSplitPreviewVisible(false)}
              onSendToStoryboard={handleOpenStoryboard}
              onDownloadZip={handleDownload}
              onCopySnapshotFirst={handleCopyLiveCanvasSnapshotToStoryboardFirst}
              copySnapshotFirst={copySnapshotFirst}
              onToggleCopySnapshotFirst={setCopySnapshotFirst}
              gridLabelPreset={gridLabelPreset}
              customGridLabelPrefix={customGridLabelPrefix}
              splitPreviewSize={splitPreviewSize}
              setSplitPreviewSize={setSplitPreviewSize}
              isProcessing={isProcessing}
            />
          )}
        </div>
      ) : (
        <div className="relative flex-1 flex flex-col justify-between overflow-hidden select-none bg-[#020617]">
          {/* Eye-triggered Top-Right Slide-Out Panel Controls Menu (2–6 + Sub-Cascade 6-1 to 6-5) */}
          <AnimatePresence>
            {isBottomControlBarVisible && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute top-3 right-3 sm:right-5 z-30 pointer-events-none"
              >
                <CustomizableContainer
                  as="div"
                  id="panel_controls_bar"
                  ibcId="panel_controls_container"
                  componentType="panel"
                  defaultTitle="Panel controls menu container"
                  ignoreCustomPanelStyles={true}
                  disableGlow={true}
                  className="bg-transparent border-0 shadow-none p-0 flex flex-col gap-2.5"
                >
                  {/* Primary 3-column grid: Row 1 [empty, Control deck, Button customizer], Row 2 [Utility, Adv, empty], Row 3 [System trigger, Swap, Links] */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Row 1, Col 1: Alignment spacer */}
                    <div className="w-11 h-11 pointer-events-none" aria-hidden="true" />

                    {/* Row 1, Col 2: Control deck */}
                    <motion.div
                      initial={{ opacity: 0, x: 10, y: -8, scale: 0.94 }}
                      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.94 }}
                      transition={{ duration: 0.16, delay: 0 }}
                      className="pointer-events-auto"
                    >
                      <CustomizableButton
                        buttonId="front_page_ad_control_deck"
                        defaultLabel=""
                        forceZeroText={true}
                        lockIconOnly={true}
                        disableGlow={true}
                        defaultIcon={<Layers className="w-4 h-4 text-emerald-400 shrink-0" />}
                        onClick={() => setIsControlDeckOpen(true)}
                        className="w-11 h-11 rounded-2xl text-xs font-bold bg-[#051814] hover:bg-[#08261f] text-emerald-400 border border-emerald-500/40 hover:border-emerald-400/70 flex items-center justify-center cursor-pointer transition-all shadow-none active:scale-95 p-0"
                        title="Control deck"
                      />
                    </motion.div>

                    {/* Row 1, Col 3: Button customizer studio */}
                    <motion.div
                      initial={{ opacity: 0, x: 10, y: -8, scale: 0.94 }}
                      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.94 }}
                      transition={{ duration: 0.16, delay: 0.035 }}
                      className="pointer-events-auto"
                    >
                      <CustomizableButton
                        buttonId="front_page_ad_button_customizer"
                        defaultLabel=""
                        forceZeroText={true}
                        lockIconOnly={true}
                        disableGlow={true}
                        defaultIcon={<ReplaceAll className="w-4 h-4 text-emerald-400 shrink-0" />}
                        onClick={() => openStudioModal()}
                        className="w-11 h-11 rounded-2xl text-xs font-bold bg-[#051814] hover:bg-[#08261f] text-emerald-400 border border-emerald-500/40 hover:border-emerald-400/70 flex items-center justify-center cursor-pointer transition-all shadow-none active:scale-95 p-0"
                        title="Button customizer studio"
                      />
                    </motion.div>

                    {/* Row 2, Col 1: Utility modal */}
                    <motion.div
                      ref={panelUtilityMenuRef}
                      initial={{ opacity: 0, x: 10, y: -8, scale: 0.94 }}
                      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.94 }}
                      transition={{ duration: 0.16, delay: 0.07 }}
                      className="pointer-events-auto"
                    >
                      <CustomizableButton
                        buttonId="front_page_ad_utility_modal"
                        defaultLabel=""
                        forceZeroText={true}
                        lockIconOnly={true}
                        disableGlow={true}
                        defaultIcon={<Cpu className="w-4 h-4 text-slate-200 shrink-0" />}
                        onClick={() => setIsUtilityModalOpen((prev) => !prev)}
                        className={cn(
                          "w-11 h-11 rounded-2xl text-xs font-bold border flex items-center justify-center cursor-pointer transition-all shadow-none active:scale-95 p-0",
                          isUtilityModalOpen
                            ? "bg-[#0b1829] text-cyan-200 border-cyan-400/70"
                            : "bg-[#080d1a] hover:bg-[#0f172a] text-slate-200 border-slate-700/70 hover:border-cyan-500/50"
                        )}
                        title="Utility modal"
                      />
                    </motion.div>

                    {/* Row 2, Col 2: Adv modal */}
                    <motion.div
                      ref={panelAdvModalRef}
                      initial={{ opacity: 0, x: 10, y: -8, scale: 0.94 }}
                      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.94 }}
                      transition={{ duration: 0.16, delay: 0.105 }}
                      className="pointer-events-auto"
                    >
                      <CustomizableButton
                        buttonId="front_page_ad_adv_modal"
                        defaultLabel=""
                        forceZeroText={true}
                        lockIconOnly={true}
                        disableGlow={true}
                        defaultIcon={<Zap className="w-4 h-4 text-slate-200 shrink-0" />}
                        onClick={() => setIsAdvModalOpen((prev) => !prev)}
                        className={cn(
                          "w-11 h-11 rounded-2xl text-xs font-bold border flex items-center justify-center cursor-pointer transition-all shadow-none active:scale-95 p-0",
                          isAdvModalOpen
                            ? "bg-[#08261f] text-emerald-200 border-emerald-400/70"
                            : "bg-[#080d1a] hover:bg-[#0f172a] text-slate-200 border-slate-700/70 hover:border-emerald-500/50"
                        )}
                        title="Adv modal"
                      />
                    </motion.div>

                    {/* Row 2, Col 3: Alignment spacer */}
                    <div className="w-11 h-11 pointer-events-none" aria-hidden="true" />

                    {/* Row 3, Col 1: System slide-out trigger */}
                    <motion.div
                      initial={{ opacity: 0, x: 10, y: -8, scale: 0.94 }}
                      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.94 }}
                      transition={{ duration: 0.16, delay: 0.14 }}
                      className="pointer-events-auto"
                    >
                      <CustomizableButton
                        buttonId="front_page_ad_slide_menu_trigger"
                        defaultLabel=""
                        forceZeroText={true}
                        lockIconOnly={true}
                        disableGlow={true}
                        defaultIcon={<Signpost className="w-4 h-4 text-emerald-400 shrink-0" />}
                        onClick={toggleSlideMenu}
                        className={cn(
                          "w-11 h-11 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center shadow-none active:scale-95 p-0 select-none",
                          isSlideMenuOpen
                            ? "bg-[#08261f] text-emerald-300 border-emerald-400/70"
                            : "bg-[#061318] hover:bg-[#0b1f26] text-emerald-400 border-slate-700/70 hover:border-emerald-500/50"
                        )}
                        title={isSlideMenuOpen ? "Collapse sub-controls menu" : "Expand sub-controls menu"}
                      />
                    </motion.div>

                    {/* Row 3, Col 2: Sub-control 1 — Swap panels */}
                    <div className="w-11 h-11">
                      <AnimatePresence>
                        {isSlideMenuOpen && (
                          <motion.div
                            key="sub-swap"
                            initial={{ opacity: 0, x: -12, scale: 0.92 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -10, scale: 0.92 }}
                            transition={{ duration: 0.15, delay: 0 }}
                            className="pointer-events-auto"
                          >
                            <CustomizableButton
                              buttonId="front_page_ad_swap_panels"
                              defaultLabel=""
                              forceZeroText={true}
                              lockIconOnly={true}
                              disableGlow={true}
                              defaultIcon={<ArrowLeftRight className="w-4 h-4 text-indigo-300 shrink-0" />}
                              onClick={() => {
                                if (swapSelectedBoxId !== null) {
                                  setSwapSelectedBoxId(null);
                                  setAdvertNotice(null);
                                } else {
                                  setAdvertNotice("Drag any panel onto another, or click two panels to swap.");
                                  setTimeout(() => {
                                    setAdvertNotice((curr) => (curr?.includes("Drag any panel") ? null : curr));
                                  }, 4000);
                                }
                              }}
                              className={cn(
                                "w-11 h-11 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center shadow-none active:scale-95 p-0",
                                swapSelectedBoxId !== null
                                  ? "bg-amber-950/60 text-amber-300 border-amber-400/60"
                                  : "bg-[#090b1e] hover:bg-[#101433] text-indigo-200 border-indigo-500/40 hover:border-indigo-400/70"
                              )}
                              title={swapSelectedBoxId !== null ? "Cancel swap" : "Swap panels"}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Row 3, Col 3: Sub-control 2 — Interactive links toggle */}
                    <div className="w-11 h-11">
                      <AnimatePresence>
                        {isSlideMenuOpen && (
                          <motion.div
                            key="sub-links"
                            initial={{ opacity: 0, x: -12, scale: 0.92 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -10, scale: 0.92 }}
                            transition={{ duration: 0.15, delay: 0.035 }}
                            className="pointer-events-auto"
                          >
                            <CustomizableButton
                              buttonId="front_page_ad_toggle_links"
                              defaultLabel=""
                              forceZeroText={true}
                              lockIconOnly={true}
                              disableGlow={true}
                              defaultIcon={
                                <Circle
                                  className={cn(
                                    "w-4 h-4 shrink-0",
                                    disableBoxActions ? "text-emerald-400" : "text-slate-400"
                                  )}
                                />
                              }
                              onClick={() => setDisableBoxActions((prev) => !prev)}
                              className={cn(
                                "w-11 h-11 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center shadow-none active:scale-95 p-0",
                                disableBoxActions
                                  ? "bg-[#051814] text-emerald-400 border-emerald-500/45 hover:border-emerald-400/70"
                                  : "bg-[#080d1a] hover:bg-[#0f172a] text-slate-400 border-slate-700/70"
                              )}
                              title={`Interactive links: ${disableBoxActions ? "on" : "off"}`}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Row 4: Sub-controls 3, 4, 5 [Save baseline default, Cloud database, Open system view] */}
                  <AnimatePresence>
                    {isSlideMenuOpen && (
                      <motion.div
                        key="sub-row-4"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <CustomizableContainer
                          as="div"
                          ibcId="panel_sub_controls_container"
                          componentType="panel"
                          defaultTitle="Panel sub-controls menu container"
                          ignoreCustomPanelStyles={true}
                          disableGlow={true}
                          className="bg-transparent border-0 shadow-none p-0 grid grid-cols-3 gap-2.5"
                        >
                          {/* Row 4, Col 1: Sub-control 3 — Save present state as baseline default */}
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.92 }}
                            transition={{ duration: 0.15, delay: 0.07 }}
                            className="pointer-events-auto"
                          >
                            <CustomizableButton
                              buttonId="front_page_ad_save_as_default"
                              defaultLabel=""
                              forceZeroText={true}
                              lockIconOnly={true}
                              disableGlow={true}
                              defaultIcon={<Bookmark className="w-4 h-4 text-amber-400 shrink-0" />}
                              onClick={handleSavePresentAdvertStateAsDefault}
                              className="w-11 h-11 rounded-2xl text-xs font-bold bg-[#080d1a] hover:bg-[#0f172a] text-amber-400 border border-slate-700/70 hover:border-amber-500/50 flex items-center justify-center cursor-pointer transition-all shadow-none active:scale-95 p-0"
                              title="Save present advert panel arrangement as baseline default"
                            />
                          </motion.div>

                          {/* Row 4, Col 2: Sub-control 4 — Cloud database manager */}
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.92 }}
                            transition={{ duration: 0.15, delay: 0.105 }}
                            className="pointer-events-auto"
                          >
                            <CustomizableButton
                              buttonId="header_cloud_db"
                              defaultLabel=""
                              forceZeroText={true}
                              lockIconOnly={true}
                              disableGlow={true}
                              defaultIcon={
                                <Database
                                  className={cn(
                                    "w-4 h-4 shrink-0",
                                    currentUser ? "text-emerald-400" : "text-amber-400"
                                  )}
                                />
                              }
                              onClick={() => openLiveCloudEditor()}
                              className="w-11 h-11 rounded-2xl text-xs font-bold bg-[#080d1a] hover:bg-[#0f172a] text-emerald-400 border border-slate-700/70 hover:border-emerald-500/50 flex items-center justify-center cursor-pointer transition-all shadow-none active:scale-95 p-0"
                              title={
                                currentUser
                                  ? `Cloud database (${currentUser.email || currentUser.displayName || "signed in"}${isDatabaseSyncing ? " · syncing" : " · connected"})`
                                  : "Cloud database manager"
                              }
                            />
                          </motion.div>

                          {/* Row 4, Col 3: Sub-control 5 — System view */}
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.92 }}
                            transition={{ duration: 0.15, delay: 0.14 }}
                            className="pointer-events-auto"
                          >
                            <CustomizableButton
                              buttonId="front_page_ad_open_system_view"
                              defaultLabel=""
                              forceZeroText={true}
                              lockIconOnly={true}
                              disableGlow={true}
                              onClick={() => window.location.assign("/system")}
                              defaultIcon={<Wrench className="w-4 h-4 text-cyan-400 shrink-0" />}
                              className="w-11 h-11 rounded-2xl text-xs font-bold bg-[#080d1a] hover:bg-[#0f172a] text-cyan-300 border border-slate-700/70 hover:border-cyan-500/50 flex items-center justify-center cursor-pointer transition-all shadow-none active:scale-95 p-0"
                              title="Open system view"
                            />
                          </motion.div>

                          {/* Row 5, Col 1: Sub-control 6 — Load present image as default 4x4 */}
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.92 }}
                            transition={{ duration: 0.15, delay: 0.175 }}
                            className="pointer-events-auto"
                          >
                            <CustomizableButton
                              buttonId="front_page_ad_load_present_image_4x4"
                              defaultLabel="Load present image as default 4x4"
                              forceZeroText={true}
                              lockIconOnly={true}
                              disableGlow={true}
                              defaultIcon={<LayoutGrid className="w-4 h-4 text-emerald-400 shrink-0" />}
                              onClick={() => handleLoadPresentImageAsDefault4x4()}
                              className="w-11 h-11 rounded-2xl text-xs font-bold bg-[#051814] hover:bg-[#08261f] text-emerald-400 border border-emerald-500/40 hover:border-emerald-400/70 flex items-center justify-center cursor-pointer transition-all shadow-none active:scale-95 p-0"
                              title="Load present image as default 4x4"
                            />
                          </motion.div>

                          {/* Row 5, Col 2: Sub-control 7 — Set present image as user defined default */}
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.92 }}
                            transition={{ duration: 0.15, delay: 0.21 }}
                            className="pointer-events-auto"
                          >
                            <CustomizableButton
                              buttonId="front_page_ad_set_as_user_default"
                              defaultLabel="Set as user default"
                              forceZeroText={true}
                              lockIconOnly={true}
                              disableGlow={true}
                              defaultIcon={<Bookmark className="w-4 h-4 text-emerald-300 shrink-0" />}
                              onClick={() => handleSetPresentImageAsUserDefinedDefault()}
                              className="w-11 h-11 rounded-2xl text-xs font-bold bg-[#051814] hover:bg-[#08261f] text-emerald-300 border border-emerald-500/50 hover:border-emerald-400/80 flex items-center justify-center cursor-pointer transition-all shadow-none active:scale-95 p-0"
                              title="Set present image as permanent user defined default"
                            />
                          </motion.div>

                          {/* Row 5, Col 3: Sub-control 8 — Reset to user defined image */}
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.92 }}
                            transition={{ duration: 0.15, delay: 0.245 }}
                            className="pointer-events-auto"
                          >
                            <CustomizableButton
                              buttonId="front_page_ad_reset_to_user_default"
                              defaultLabel="Reset to user default"
                              forceZeroText={true}
                              lockIconOnly={true}
                              disableGlow={true}
                              defaultIcon={<RotateCcw className="w-4 h-4 text-emerald-400 shrink-0" />}
                              onClick={() => handleResetToUserDefinedImage()}
                              className="w-11 h-11 rounded-2xl text-xs font-bold bg-[#051814] hover:bg-[#08261f] text-emerald-400 border border-emerald-500/40 hover:border-emerald-400/70 flex items-center justify-center cursor-pointer transition-all shadow-none active:scale-95 p-0"
                              title="Reset all panels to user defined default image"
                            />
                          </motion.div>
                        </CustomizableContainer>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CustomizableContainer>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main 9-Screen / 16-Screen Advert & Tile Matrix Viewport */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-3 sm:p-6 min-h-0">
            {/* Advert Notice / Swap Instruction Banner */}
            <AnimatePresence>
              {(advertNotice || swapSelectedBoxId !== null) && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className={cn(
                    "w-full max-w-[500px] mb-2 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-none border shrink-0",
                    swapSelectedBoxId !== null
                      ? "bg-amber-950/80 border-amber-500/50 text-amber-200"
                      : "bg-[#080d1a] border-emerald-500/40 text-emerald-200"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <ArrowLeftRight className="w-3.5 h-3.5 shrink-0 text-current" />
                    <span className="truncate">
                      {swapSelectedBoxId !== null
                        ? "Panel selected — drop onto or click another panel to swap"
                        : advertNotice}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {swapSelectedBoxId !== null && (
                      <CustomizableButton
                        buttonId="front_page_ad_cancel_swap"
                        defaultLabel=""
                        forceZeroText={true}
                        lockIconOnly={true}
                        disableGlow={true}
                        defaultIcon={<X className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setSwapSelectedBoxId(null);
                          setAdvertNotice(null);
                        }}
                        className="w-7 h-7 bg-amber-500/20 hover:bg-amber-500/30 p-0 rounded-lg border border-amber-400/40 text-amber-300 font-bold cursor-pointer flex items-center justify-center shadow-none"
                        title="Cancel swap"
                      />
                    )}
                    {lastSwappedPair && !swapSelectedBoxId && (
                      <CustomizableButton
                        buttonId="front_page_ad_undo_swap"
                        defaultLabel=""
                        forceZeroText={true}
                        lockIconOnly={true}
                        disableGlow={true}
                        defaultIcon={<Undo2 className="w-3.5 h-3.5" />}
                        onClick={handleUndoSwap}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 p-0 rounded-lg border border-slate-600 text-slate-200 font-bold cursor-pointer flex items-center justify-center shadow-none"
                        title="Undo swap"
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Front Page Advert Grid: 3x3 (9 Tiles) or 4x4 (16 Tiles) — sits directly on #020617 with zero surrounding panel */}
            <div className="relative shrink-0 border-0 bg-transparent shadow-none p-0">
              <div
                className={cn(
                  "relative shrink-0 transition-all duration-200",
                  frontPageGridMode === "4x4"
                    ? "grid grid-cols-4 gap-2.5 sm:gap-3"
                    : "grid grid-cols-3 gap-2.5 sm:gap-3"
                )}
              >
                {(frontPageGridMode === "4x4"
                  ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
                  : [1, 2, 3, 4, 5, 6, 7, 8, 9]
                ).map((boxId) => renderInteractiveBoxCard(boxId))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Modals */}
    <ExpandViewModal
      isOpen={expandedModalOpen}
      onClose={() => setExpandedModalOpen(false)}
      slices={storyboardSlices}
      currentIndex={expandedSliceIndex}
      onNavigate={setExpandedSliceIndex}
      customSlice={expandedCustomSlice}
      onResendToCarve={handleResendFrameToCarve}
      onResendToCrop={(url: string, index?: number | null, custom?: { name: string; url: string } | null) => {
        if (custom) {
          // Custom slice was passed from a storyboard slot (or single slot preview)
          handleResendFrameToCrop(url, null, index ?? null);
        } else {
          // Resent from general storyboard slices
          handleResendFrameToCrop(url, index ?? null, null);
        }
      }}
      onOpenNeo1Studio={(idx: number) => {
        if (expandedCustomSlice) {
          handleOpenNeo1Studio(idx, expandedCustomSlice.url, expandedCustomSlice.name);
        } else {
          handleOpenNeo1Studio(idx);
        }
      }}
      onOpenBubba1Studio={(idx: number) => {
        if (expandedCustomSlice) {
          handleOpenBubba1Studio(idx, expandedCustomSlice.url, expandedCustomSlice.name);
        } else {
          handleOpenBubba1Studio(idx);
        }
      }}
      onOpenShapeStudio={(idx: number) => {
        handleOpenShapeStudio(idx);
      }}
      onOpenImageSharpener={handleOpenImageSharpener}
      onOpenResampleStudio={handleOpenResampleStudio}
      onOpenVariationsStudio={handleOpenVariationsStudio}
      onOpenZoomStudio={handleOpenZoomStudio}
    />

    <BulkRenameModal
      isOpen={isRenameStudioOpen}
      onClose={() => setIsRenameStudioOpen(false)}
      slices={storyboardSlices}
      selectedSliceUrls={selectedSliceUrls}
      storyboardSlots={storyboardSlots}
      onApplyRename={handleApplyBulkRename}
    />

    <FramePlayerModal
      isOpen={isPlayerModalOpen}
      onClose={() => setIsPlayerModalOpen(false)}
      storyboardSlots={storyboardSlots}
      storyboardSlices={storyboardSlices}
      onResendFrameToCarve={handleResendFrameToCarve}
      onResendFrameToCrop={handleResendFrameToCrop}
    />

    <Neo1StudioModal
      isOpen={isNeo1ModalOpen}
      onClose={() => setIsNeo1ModalOpen(false)}
      imageUrl={neo1InitialImage}
      nextImageUrl={neo1NextImageUrl}
      prevImageUrl={neo1PrevImageUrl}
      slices={activeStudioSlices}
      allFrames={activeStudioSlices.map((s) => s.url)}
      sliceIndex={neo1SliceIndex}
      sliceName={neo1SliceName}
      onNavigateFrame={(newIdx) => {
        setNeo1SliceIndex(newIdx);
        if (activeStudioSlices[newIdx]) {
          setNeo1InitialImage(activeStudioSlices[newIdx].url);
          setNeo1SliceName(activeStudioSlices[newIdx].name);
        }
      }}
      onSaveToAssetOrganiser={handleSaveFromNeo1ToOrganiser}
    />

    <Bubba1StudioModal
      isOpen={isBubba1ModalOpen}
      onClose={() => setIsBubba1ModalOpen(false)}
      slices={activeStudioSlices}
      currentIndex={bubba1SliceIndex ?? undefined}
      imageUrl={bubba1CustomImageUrl || undefined}
      sliceName={bubba1CustomSliceName || undefined}
      onUpdateSliceUrl={(idx, newUrl) => {
        if (storyboardSlices[idx]) {
          handleUpdateSliceUrl(idx, newUrl);
        } else if (storyboardSlots[idx]) {
          setStoryboardSlots((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], url: newUrl };
            return next;
          });
        }
      }}
      onNavigateFrame={(newIdx) => {
        setBubba1SliceIndex(newIdx);
        setBubba1CustomImageUrl(null);
        setBubba1CustomSliceName(null);
      }}
      onSaveToAssetOrganiser={handleSaveFromBubba1ToOrganiser}
    />

    <StoryboardOperationsModal
      isOpen={isStoryboardOperationsOpen}
      onClose={() => setIsStoryboardOperationsOpen(false)}
      slots={storyboardSlots}
      selectedIndices={selectedStoryboardSlotIndices}
      onUpdateSelectedIndices={setSelectedStoryboardSlotIndices}
      onUpdateSlots={setStoryboardSlots}
      onSendToCrop={handleSendSelectedStoryboardToCrop}
      onSendToCarve={handleSendSelectedStoryboardToCarver}
      onSendToNeo1={(idx, url, name) => handleOpenNeo1Studio(idx, url, name)}
      onSendToBubba1={(idx, url, name) => handleOpenBubba1Studio(idx, url, name)}
      onSendToShapeStudio={(idx) => handleOpenShapeStudio(idx)}
      onSendToPlayer={() => setIsPlayerModalOpen(true)}
      onSendToAniComper4={() => setIsAniComposerOpen(true)}
      onSendToRenameStudio={handleSendSelectedStoryboardToRenameStudio}
      onSendToScreenplay={handleSendSelectedStoryboardToScreenplay}
      isStoryboardLocked={isStoryboardLocked}
      onToggleStoryboardLock={() => setIsStoryboardLocked((prev) => !prev)}
      stripPanelBackground={stripPanelBackground || stripBackground || "#000000"}
      onUpdateStripPanelBackground={(color: string) => {
        setStripBackground(color);
        setStripImageBackground(color);
        setStripPanelBackground(color);
      }}
      onSaveDefaultState={handleSavePresentStateAsDefault}
      onRestoreDefaultState={handleRestoreDefaultState}
      onClearDefaultState={handleClearSavedDefaultState}
      savedDefaultInfo={savedStoryboardDefaultInfo}
    />

    <ShapeStudioModal
      isOpen={isShapeStudioOpen}
      onClose={() => setIsShapeStudioOpen(false)}
      slices={storyboardSlices}
      activeFrameIdx={shapeStudioActiveFrameIdx || 0}
      onUpdateSliceUrl={handleUpdateSliceUrl}
      onNavigateFrame={setShapeStudioActiveFrameIdx}
      onResendToCrop={(url: string, sliceIndex: number) => handleResendFrameToCrop(url, sliceIndex)}
    />

    <ImgDescStudioModal
      isOpen={isImgDescModalOpen}
      onClose={() => setIsImgDescModalOpen(false)}
      onAddToStoryboard={(name: string, url: string) => {
        setStoryboardSlices((prev) => [...prev, { name, url }]);
      }}
      onSendToCarver={(url: string) => handleResendFrameToCarve(url)}
      onSendToBox={(boxId: number, url: string) => {
        setBoxImages((prev) => ({ ...prev, [boxId]: url }));
      }}
    />

    <ScreenplayWriter
      isOpen={isScreenplayOpen}
      onClose={() => setIsScreenplayOpen(false)}
      slides={screenplaySlides}
      activeSlideId={activeScreenplaySlideId}
      onSelectSlideId={setActiveScreenplaySlideId}
      onUpdateSlides={setScreenplaySlides}
      onSyncToStoryboard={(sliceIdx: number, newImageUrl: string) => handleUpdateSliceUrl(sliceIdx, newImageUrl)}
      onOpenBubba1Studio={(imageUrl: string) => {
        handleOpenBubba1Studio(0);
      }}
      onSendToNeo1={(url: string, name: string) => {
        setNeo1InitialImage(url);
        setNeo1SliceName(name);
        setIsNeo1ModalOpen(true);
      }}
    />

    {rotationModalBoxId !== null && (
      <RotationSeriesModal
        boxId={rotationModalBoxId}
        isOpen={rotationModalBoxId !== null}
        onClose={() => setRotationModalBoxId(null)}
        series={boxRotationSeries[rotationModalBoxId] || []}
        interval={boxRotationIntervals[rotationModalBoxId] || 3}
        isActive={boxRotationActive[rotationModalBoxId] || false}
        onUpdateConfig={(series, interval, active) => {
          setBoxRotationSeries((prev) => ({ ...prev, [rotationModalBoxId]: series }));
          setBoxRotationIntervals((prev) => ({ ...prev, [rotationModalBoxId]: interval }));
          setBoxRotationActive((prev) => ({ ...prev, [rotationModalBoxId]: active }));
        }}
        currentBoxImage={boxImages[rotationModalBoxId] || ""}
        storyboardSlices={storyboardSlices}
      />
    )}

    <CustomSpreadModal
      isOpen={customSpreadModalOpen}
      onClose={() => setCustomSpreadModalOpen(false)}
      imageUrl={customSpreadImageUrl}
      onApplySpread={handleCustomSpread}
      onImageChange={(newUrl) => {
        setCustomSpreadImageUrl(newUrl);
        updateOriginalSpreadImage(newUrl);
      }}
      onRestoreDefaultsFromDb={async () => {
        handleReset9BoxDefault();
        await restoreFullDefaultsFromDatabase();
      }}
      boxImages={boxImages}
      setBoxImages={setBoxImages}
      gridMode={frontPageGridMode}
      onToggleGridMode={handleToggleFrontPageGridMode}
      onProceedToSequencer={() => {
        setCustomSpreadModalOpen(false);
        setControlDeckInitialTab("SEQUENCER");
        setIsControlDeckOpen(true);
      }}
    />

    {tileLinkModalBoxId !== null && (
      <AdvertPanelFullScreenModal
        isOpen={tileLinkModalBoxId !== null}
        onClose={() => setTileLinkModalBoxId(null)}
        targetBoxId={tileLinkModalBoxId}
        boxImages={boxImages}
        setBoxImages={setBoxImages}
        boxRotationSeries={boxRotationSeries}
        setBoxRotationSeries={setBoxRotationSeries}
        boxRotationIntervals={boxRotationIntervals}
        setBoxRotationIntervals={setBoxRotationIntervals}
        boxRotationActive={boxRotationActive}
        setBoxRotationActive={setBoxRotationActive}
        boxLinkConfigs={boxLinkConfigs}
        setBoxLinkConfigs={setBoxLinkConfigs}
        disableBoxActions={disableBoxActions}
        setDisableBoxActions={setDisableBoxActions}
        defaultBoxImages={defaultBoxImages}
        storyboardSlices={storyboardSlices}
        handleSplitImageToNBoxes={handleSplitImageToNBoxes}
        handleSplitImageTo9Boxes={handleSplitImageTo9Boxes}
        handleSetNBoxDefault={handleSetNBoxDefault}
        handleReset9BoxDefault={handleReset9BoxDefault}
        handleSendBoxImageToCarver={handleSendBoxImageToCarver}
        handleBoxImageUpload={handleBoxImageUpload}
        setCustomSpreadImageUrl={setCustomSpreadImageUrl}
        setCustomSpreadModalOpen={setCustomSpreadModalOpen}
        originalSpreadImage={originalSpreadImage}
        setOriginalSpreadImage={setOriginalSpreadImage}
        handleSwapBoxPanels={handleSwapBoxPanels}
        onOpenFourByFour={() => setIsFourByFourModalOpen(true)}
        gridMode={frontPageGridMode}
        onToggleGridMode={handleToggleFrontPageGridMode}
      />
    )}

    <ZipNameModal
      isOpen={zipModalConfig.isOpen}
      onClose={() => setZipModalConfig((prev) => ({ ...prev, isOpen: false }))}
      defaultName={zipModalConfig.defaultName}
      suggestions={zipModalConfig.suggestions}
      itemCount={zipModalConfig.itemCount}
      title={zipModalConfig.title}
      onConfirm={zipModalConfig.onConfirm}
    />

    <ExportJsonModal
      isOpen={isExportJsonModalOpen}
      onClose={() => setIsExportJsonModalOpen(false)}
      onExport={handleConfirmExportStoryboardJson}
      getJsonData={() => JSON.stringify(storyboardSlots, null, 2)}
      defaultFilename="storyboard_export.json"
      title={uiText("app.export_json_modal.export_storyboard_json.title", "Export Storyboard JSON")}
      description={uiText("app.export_json_modal.export_current_storyboard_slots_and_metadata.description", "Export current storyboard slots and metadata as structured JSON.")}
      itemCount={storyboardSlots.length}
    />

    <AppLogModal
      isOpen={isAppLogModalOpen}
      onClose={() => setIsAppLogModalOpen(false)}
    />

    <AutoSliceModal
      isOpen={isAutoSliceModalOpen}
      onClose={() => setIsAutoSliceModalOpen(false)}
      imageSrc={croppedImageSrc || imageSrc || originalImageSrc || ""}
      onApplyToMultiCrops={handleApplyAutoSliceToMultiCrops}
      onSliceToStoryboard={handleSliceAutoDetectedToStoryboard}
      onConvertToFreestyle={handleAutoSliceConvertToFreestyle}
    />

    <SmartTrimModal
      isOpen={isSmartTrimModalOpen}
      onClose={() => setIsSmartTrimModalOpen(false)}
      items={smartTrimItems}
      activeItemId={smartTrimActiveId}
      onApplyTrimmedItems={handleApplyTrimmedItems}
    />

    <GridMeshStudioModal
      isOpen={isGridMeshModalOpen}
      onClose={() => setIsGridMeshModalOpen(false)}
      imageSrc={croppedImageSrc || imageSrc || originalImageSrc || ""}
      slicePrefix={slicePrefix || "Mesh"}
      format={format}
      onCutMeshIntoStoryboard={(slices, destination) => {
        if (destination === "storyboard-slots") {
          setStoryboardSlots((prev) => {
            const nextSlots = [...prev];
            let sIdx = 0;
            for (let i = 0; i < nextSlots.length && sIdx < slices.length; i++) {
              if (!nextSlots[i].url) {
                nextSlots[i] = { url: slices[sIdx].url, name: slices[sIdx].name, story: "" };
                sIdx++;
              }
            }
            while (sIdx < slices.length) {
              nextSlots.push({ url: slices[sIdx].url, name: slices[sIdx].name, story: "" });
              sIdx++;
            }
            return nextSlots;
          });
          setMode("storyboard");
        } else {
          setStoryboardSlices((prev) => [...prev, ...slices]);
          setMode("storyboard");
        }
        setIsGridMeshModalOpen(false);
      }}
    />

    <JoinImagesModal
      isOpen={isJoinImagesModalOpen}
      onClose={() => setIsJoinImagesModalOpen(false)}
      initialImages={storyboardSlices}
      availableSlices={storyboardSlices}
      onApplyJoinedImage={(dataUrl) => {
        setImageSrc(dataUrl);
        setCroppedImageSrc(dataUrl);
        setOriginalImageSrc(dataUrl);
        setIsJoinImagesModalOpen(false);
      }}
      onAddToStoryboard={(slice) => {
        setStoryboardSlices((prev) => [...prev, slice]);
        setIsJoinImagesModalOpen(false);
      }}
    />

    <MesshiStudioModal
      isOpen={isMesshiModalOpen}
      onClose={() => setIsMesshiModalOpen(false)}
      initialImageSrc={croppedImageSrc || imageSrc || originalImageSrc || ""}
      slices={storyboardSlices}
      activeFrameIndex={shapeStudioActiveFrameIdx || 0}
      onSliceToStoryboard={(newSlices, destination) => {
        if (destination === "storyboard-slots") {
          setStoryboardSlots((prev) => {
            const nextSlots = [...prev];
            let sIdx = 0;
            for (let i = 0; i < nextSlots.length && sIdx < newSlices.length; i++) {
              if (!nextSlots[i].url) {
                nextSlots[i] = { url: newSlices[sIdx].url, name: newSlices[sIdx].name, story: "" };
                sIdx++;
              }
            }
            while (sIdx < newSlices.length) {
              nextSlots.push({ url: newSlices[sIdx].url, name: newSlices[sIdx].name, story: "" });
              sIdx++;
            }
            return nextSlots;
          });
          setMode("storyboard");
        } else {
          setStoryboardSlices((prev) => [...prev, ...newSlices]);
          setMode("storyboard");
        }
        setIsMesshiModalOpen(false);
      }}
      onSendToCropTool={(img, c) => {
        setImageSrc(img);
        setCroppedImageSrc(img);
        setOriginalImageSrc(img);
        setMode("crop");
        if (c) setCrop(c);
        setIsMesshiModalOpen(false);
      }}
    />

    <KrumsStudioModal
      isOpen={isKrumsModalOpen}
      onClose={() => setIsKrumsModalOpen(false)}
      initialImage={krumsInitialImage}
      initialImages={storyboardSlices.length > 0 ? storyboardSlices : undefined}
      onApplyToStoryboard={(slices, dest, keepModalOpen) => {
        handleApplyFromKrums(slices, dest);
        if (!keepModalOpen) {
          setIsKrumsModalOpen(false);
        }
      }}
      onSendToCarverCanvas={(imgUrl) => {
        setImageSrc(imgUrl);
        setCroppedImageSrc(imgUrl);
        setOriginalImageSrc(imgUrl);
        setMode("crop");
        setIsKrumsModalOpen(false);
      }}
      storyboardSlicesCount={storyboardSlices.length}
    />

    <ImageSharpenerModal
      isOpen={isImageSharpenerOpen}
      onClose={() => setIsImageSharpenerOpen(false)}
      imageUrl={imageSharpenerUrl}
      sliceName={imageSharpenerName}
      sliceIndex={imageSharpenerIndex}
      slices={activeStudioSlices}
      onNavigateFrame={(newIdx) => {
        setImageSharpenerIndex(newIdx);
        if (activeStudioSlices[newIdx]) {
          setImageSharpenerUrl(activeStudioSlices[newIdx].url);
          setImageSharpenerName(activeStudioSlices[newIdx].name);
        }
      }}
      onApplyEnhanced={handleApplyEnhancedImage}
    />

    <ResampleStudioModal
      isOpen={isResampleStudioOpen}
      onClose={() => setIsResampleStudioOpen(false)}
      imageUrl={resampleStudioUrl}
      sliceName={resampleStudioName}
      sliceIndex={resampleStudioIndex}
      slices={activeStudioSlices}
      onNavigateFrame={(newIdx) => {
        setResampleStudioIndex(newIdx);
        if (activeStudioSlices[newIdx]) {
          setResampleStudioUrl(activeStudioSlices[newIdx].url);
          setResampleStudioName(activeStudioSlices[newIdx].name);
        }
      }}
      onApplyResampled={handleApplyResampledImage}
    />

    <VariationsStudioModal
      isOpen={isVariationsStudioOpen}
      onClose={() => setIsVariationsStudioOpen(false)}
      imageUrl={variationsStudioUrl}
      sliceName={variationsStudioName}
      sliceIndex={variationsStudioIndex}
      slices={activeStudioSlices}
      onNavigateFrame={(newIdx) => {
        setVariationsStudioIndex(newIdx);
        if (activeStudioSlices[newIdx]) {
          setVariationsStudioUrl(activeStudioSlices[newIdx].url);
          setVariationsStudioName(activeStudioSlices[newIdx].name);
        }
      }}
      onApplyVariations={handleApplyVariations}
    />

    <ZoomImageStudioModal
      isOpen={isZoomStudioOpen}
      onClose={() => setIsZoomStudioOpen(false)}
      imageUrl={zoomStudioUrl}
      sliceName={zoomStudioName}
      sliceIndex={zoomStudioIndex}
      slices={zoomStudioSlices}
      onNavigateFrame={(newIdx) => {
        setZoomStudioIndex(newIdx);
        if (zoomStudioSlices[newIdx]) {
          setZoomStudioUrl(zoomStudioSlices[newIdx].url);
          setZoomStudioName(zoomStudioSlices[newIdx].name);
        }
      }}
      onApplyZoomVariations={handleApplyVariations}
      onOpenInAniPlayer={handleOpenZoomInAniPlayer}
    />

    <FullScreenCropControlPanel
      isOpen={isFullScreenCropControlPanelOpen}
      onClose={() => setIsFullScreenCropControlPanelOpen(false)}
      imageSrc={imageSrc}
      originalImageSrc={originalImageSrc}
      croppedImageSrc={croppedImageSrc}
      setImageSrc={setImageSrc}
      setCroppedImageSrc={setCroppedImageSrc}
      crop={crop}
      setCrop={setCrop}
      completedPercentCrop={completedPercentCrop}
      setCompletedPercentCrop={setCompletedPercentCrop}
      completedPixelCrop={completedPixelCrop}
      setCompletedPixelCrop={setCompletedPixelCrop}
      isCircularCrop={isCircularCrop}
      cropAspect={cropAspect}
      handleSetAspect={handleSetAspect}
      storyboardSlices={storyboardSlices}
      setStoryboardSlices={setStoryboardSlices}
      shapeStudioCropIndex={shapeStudioCropIndex}
      setShapeStudioCropIndex={setShapeStudioCropIndex}
      resentFromStoryboardSliceIndex={resentFromStoryboardSliceIndex}
      setResentFromStoryboardSliceIndex={setResentFromStoryboardSliceIndex}
      handleApplyCrop={handleApplyCrop}
      handleCropToStoryboard={handleCropToStoryboard}
      handleCropToStoryboardReplace={handleCropToStoryboardReplace}
      handleApplyCropDirectToStoryboard={handleApplyCropDirectToStoryboard}
      handleOpenAutoSlice={handleOpenAutoSlice}
      handleOpenSmartTrim={handleOpenSmartTrim}
      cropHistory={cropHistory}
      cropHistoryIndex={cropHistoryIndex}
      handleUndoCrop={handleUndoCrop}
      handleRedoCrop={handleRedoCrop}
      handleRevertToOriginal={handleRevertToOriginal}
      handleJumpToCropHistoryIndex={handleJumpToCropHistoryIndex}
      multiCrops={multiCrops}
      setMultiCrops={setMultiCrops}
      handleApplyMultiCrops={handleApplyMultiCrops}
      handleSendSingleMultiCropToStoryboard={handleSendSingleMultiCropToStoryboard}
      cropNotice={cropNotice}
      setCropNotice={setCropNotice}
    />

    <AdvertPanelFullScreenModal
      isOpen={isAdvertPanel1FullScreenOpen}
      onClose={() => setIsAdvertPanel1FullScreenOpen(false)}
      targetBoxId={1}
      boxImages={boxImages}
      setBoxImages={setBoxImages}
      boxRotationSeries={boxRotationSeries}
      setBoxRotationSeries={setBoxRotationSeries}
      boxRotationIntervals={boxRotationIntervals}
      setBoxRotationIntervals={setBoxRotationIntervals}
      boxRotationActive={boxRotationActive}
      setBoxRotationActive={setBoxRotationActive}
      boxLinkConfigs={boxLinkConfigs}
      setBoxLinkConfigs={setBoxLinkConfigs}
      disableBoxActions={disableBoxActions}
      setDisableBoxActions={setDisableBoxActions}
      defaultBoxImages={defaultBoxImages}
      storyboardSlices={storyboardSlices}
      handleSplitImageToNBoxes={handleSplitImageToNBoxes}
      handleSplitImageTo9Boxes={handleSplitImageTo9Boxes}
      handleSetNBoxDefault={handleSetNBoxDefault}
      handleReset9BoxDefault={handleReset9BoxDefault}
      handleSendBoxImageToCarver={handleSendBoxImageToCarver}
      handleBoxImageUpload={handleBoxImageUpload}
      setCustomSpreadImageUrl={setCustomSpreadImageUrl}
      setCustomSpreadModalOpen={setCustomSpreadModalOpen}
      originalSpreadImage={originalSpreadImage}
      setOriginalSpreadImage={updateOriginalSpreadImage}
      handleSwapBoxPanels={handleSwapBoxPanels}
      onApplySpread={handleCustomSpread}
      activeSortMode={activeSortMode}
      onSelectSortMode={setActiveSortMode}
      activeGroupMode={activeGroupMode}
      onSelectGroupMode={setActiveGroupMode}
      selectedGroupFilter={selectedGroupFilter}
      onSelectGroupFilter={setSelectedGroupFilter}
      autoSortOnImport={autoSortOnImport}
      onToggleAutoSortOnImport={setAutoSortOnImport}
      onApplySortedOrderToPool={handleApplySortedOrderToPool}
      onResetSortedOrder={handleResetSortedOrder}
      availableGroups={availableGroups}
      isAnalyzingSlices={isAnalyzingSlices}
      onOpenFourByFour={() => setIsFourByFourModalOpen(true)}
      gridMode={frontPageGridMode}
      onToggleGridMode={handleToggleFrontPageGridMode}
    />

    <ControlDeckModal
      captureNamedState={captureNamedState}
      restoreNamedState={restoreNamedState}
      isOpen={isControlDeckOpen}
      onClose={() => {
        setIsControlDeckOpen(false);
        setControlDeckInitialTab("SPREAD");
      }}
      initialBoxId={4}
      initialTab={controlDeckInitialTab}
      boxImages={boxImages}
      setBoxImages={setBoxImages}
      boxRotationSeries={boxRotationSeries}
      setBoxRotationSeries={setBoxRotationSeries}
      boxRotationIntervals={boxRotationIntervals}
      setBoxRotationIntervals={setBoxRotationIntervals}
      boxRotationActive={boxRotationActive}
      setBoxRotationActive={setBoxRotationActive}
      boxLinkConfigs={boxLinkConfigs}
      setBoxLinkConfigs={setBoxLinkConfigs}
      defaultBoxImages={defaultBoxImages}
      storyboardSlices={storyboardSlices}
      originalSpreadImage={originalSpreadImage}
      setOriginalSpreadImage={updateOriginalSpreadImage}
      is4x4={frontPageGridMode === "4x4"}
      gridMode={frontPageGridMode}
      onToggleGridMode={handleToggleFrontPageGridMode}
      handleSplitImageToNBoxes={handleSplitImageToNBoxes}
      handleSetNBoxDefault={handleSetNBoxDefault}
      handleReset9BoxDefault={handleReset9BoxDefault}
      handleSendBoxImageToCarver={handleSendBoxImageToCarver}
      handleBoxImageUpload={handleBoxImageUpload}
      sequencerState={sequencerPanelState}
      setSequencerState={setSequencerPanelState}
    />

    <FourByFourModal
      isOpen={isFourByFourModalOpen}
      onClose={() => setIsFourByFourModalOpen(false)}
      heroImage={originalSpreadImage || boxImages[1] || eurospectImg}
      storyboardSlices={storyboardSlices}
      onSendToCarver={handleSendBoxImageToCarver}
      onSendToStoryboard={(slices) => {
        setStoryboardSlices((prev) => [...slices, ...prev]);
      }}
      onSendToStoryboardReplace={(slices) => {
        setStoryboardSlices(slices);
      }}
      onApplyToMain3x3={(new3x3) => {
        setBoxImages((prev) => {
          const updated = { ...prev, ...new3x3 };
          try {
            remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(updated));
            saveStoredJson("boxImages", updated).catch(console.warn);
          } catch {}
          return updated;
        });
      }}
      onReplaceFrontPageWith4x4={handleReplaceFrontPageWith4x4}
      onReplaceSingleFrontPageBox={handleReplaceSingleFrontPageBox}
      frontPageGridMode={frontPageGridMode}
      onToggleFrontPageGridMode={handleToggleFrontPageGridMode}
    />

    <ButtonCustomizationModal />
    <ButtonContextMenu />
    <IbcInspectorOverlay />

    <CanvasHistoryVisualizer
      isOpen={isHistoryVisualizerOpen}
      onClose={() => setIsHistoryVisualizerOpen(false)}
      cropHistory={cropHistory}
      cropHistoryIndex={cropHistoryIndex}
      onJumpToSnapshot={handleJumpToCropHistoryIndex}
      onUndo={handleUndoCrop}
      onRedo={handleRedoCrop}
      onRevertToOriginal={handleRevertToOriginal}
      onCopySnapshotToStoryboardFirst={(snapshotUrl, idx) => {
        const snapshotSlice = {
          name: `Canvas History Snapshot #${idx + 1}`,
          url: snapshotUrl,
        };
        // 1. Copy to storyboard slices FIRST
        setStoryboardSlices((prev) => [snapshotSlice, ...prev]);

        // 2. Copy to storyboard slots FIRST
        setStoryboardSlots((prevSlots) => {
          const nextSlots = [...prevSlots];
          const emptyIdx = nextSlots.findIndex((s) => !s.url);
          if (emptyIdx !== -1) {
            nextSlots[emptyIdx] = {
              ...nextSlots[emptyIdx],
              url: snapshotUrl,
              name: snapshotSlice.name,
            };
          } else {
            nextSlots.unshift({
              url: snapshotUrl,
              name: snapshotSlice.name,
              story: `Canvas snapshot #${idx + 1}`,
            });
          }
          return nextSlots;
        });

        setMode("storyboard");
        setIsHistoryVisualizerOpen(false);
        setCropNotice(`✓ Copied Snapshot #${idx + 1} to Storyboard first!`);
        setTimeout(() => setCropNotice(null), 3000);
      }}
      mode={mode as any}
    />

    {isHeaderStudioMenuOpen && (
      <CreativeStudioMenu
        isOpen={isHeaderStudioMenuOpen}
        onClose={() => setIsHeaderStudioMenuOpen(false)}
        onOpenImgDesc={() => setIsImgDescModalOpen(true)}
        onOpenNeo1={() => setIsNeo1ModalOpen(true)}
        onOpenBubba1={() => {
          setBubba1SliceIndex(0);
          setIsBubba1ModalOpen(true);
        }}
        onOpenShapeStudio={() => handleOpenShapeStudio(0)}
        onOpenScreenplay={() => handleOpenScreenplayWriter()}
        onOpenVariationsStudio={() => handleOpenVariationsStudio()}
        onOpenZoomStudio={() => handleOpenZoomStudio()}
        onOpenTraceStudio={() => setIsTraceStudioOpen(true)}
        onOpenParallaxStudio={() => setIsParallaxStudioOpen(true)}
        onOpenAniPlayer={() => setIsPlayerModalOpen(true)}
        onOpenSpreadStudio={() => {
          setCustomSpreadImageUrl(originalSpreadImage || croppedImageSrc || imageSrc || storyboardSlices[0]?.url || "");
          setCustomSpreadModalOpen(true);
        }}
        onOpenAssetSorter={() => {
          setMode("storyboard");
          setIsStoryboardOperationsOpen(true);
        }}
        onOpenTxtStudio={() => setIsTxtStudioOpen(true)}
        onOpenRenameStudio={() => handleOpenRenameStudio()}
      />
    )}

    {isTxtStudioOpen && (
      <TxtStudioModal
        isOpen={isTxtStudioOpen}
        onClose={() => setIsTxtStudioOpen(false)}
        baseImageUrl={storyboardSlices[0]?.url || croppedImageSrc || imageSrc || null}
        activeSliceIndex={0}
        storyboardSlotsCount={storyboardSlots.length}
        onBakeToActiveSlice={(dataUrl, sliceIdx) => {
          const targetIdx = typeof sliceIdx === "number" ? sliceIdx : 0;
          handleUpdateSliceUrl(targetIdx, dataUrl);
        }}
        onSaveNewFrameToStoryboard={(newSlice) => {
          setStoryboardSlices((prev) => [
            ...prev,
            { id: `slice_${Date.now()}`, name: newSlice.name, url: newSlice.url },
          ]);
          setStoryboardSlots((prev) => [
            ...prev,
            { url: newSlice.url, name: newSlice.name, story: "" },
          ]);
        }}
      />
    )}

    {isAdvModalOpen && (
      <AdvModal
        isOpen={isAdvModalOpen}
        onClose={() => setIsAdvModalOpen(false)}
        onOpenAutoSlice={handleOpenAutoSlice}
        onOpenMesshi={() => handleOpenMesshi()}
        onOpenKrums={() => handleOpenKrums()}
        onOpenGridMesh={() => setIsGridMeshModalOpen(true)}
        onOpenImageSharpener={() => handleOpenImageSharpener()}
        onOpenResampleStudio={() => handleOpenResampleStudio()}
        onOpenAniComposer={() => setIsAniComposerOpen(true)}
        onOpenSmartContourSlicer={() => setIsSmartContourOpen(true)}
      />
    )}

    {isUtilityModalOpen && (
      <UtilityModal
        isOpen={isUtilityModalOpen}
        onClose={() => setIsUtilityModalOpen(false)}
        captureNamedState={captureNamedState}
        restoreNamedState={restoreNamedState}
        onOpenButtonCustomizer={() => openStudioModal()}
        onOpenMiniCustomizer={() => openMiniCustomizer()}
        onOpenAppLog={() => setIsAppLogModalOpen(true)}
        onOpenRenameStudio={() => handleOpenRenameStudio()}
        onOpenMouseOverStudio={() => setIsMouseOverStudioOpen(true)}
        onOpenSmartTrim={() => handleOpenSmartTrim("storyboard")}
        onOpenJoinImages={() => setIsJoinImagesModalOpen(true)}
        onOpenLayoutPresets={() => setIsCustomLayoutPresetsModalOpen(true)}
        onOpenShortcutManager={() => setIsShortcutManagerOpen(true)}
      />
    )}

    <CustomLayoutPresetsModal
      isOpen={isCustomLayoutPresetsModalOpen}
      onClose={() => setIsCustomLayoutPresetsModalOpen(false)}
      currentGrid={{
        numRows,
        numCols,
        rowCuts,
        colCuts,
        carverSkew,
        carveImageWidth: carveImageSize.width || 800,
        carveImageHeight: carveImageSize.height || 600,
        sliceLineColor,
        sliceLineStyle,
        sliceLineThickness,
        outerMargin,
        numberingOrigin,
        numberingFlow,
        namingStyle,
      }}
      onApplyPreset={(preset, applyStyle) => {
        const h = carveImageSize.height || 600;
        const w = carveImageSize.width || 800;
        setNumRows(preset.numRows);
        setNumCols(preset.numCols);
        if (preset.rowPixelCuts && preset.rowPixelCuts.length > 0) {
          setRowCuts([...preset.rowPixelCuts]);
        } else {
          setRowCuts(preset.rowRatios.map((r) => Math.round(r * h)));
        }
        if (preset.colPixelCuts && preset.colPixelCuts.length > 0) {
          setColCuts([...preset.colPixelCuts]);
        } else {
          setColCuts(preset.colRatios.map((c) => Math.round(c * w)));
        }
        if (preset.carverSkew !== undefined) setCarverSkew(preset.carverSkew);
        if (applyStyle && preset.styleSettings) {
          if (preset.styleSettings.sliceLineColor) setSliceLineColor(preset.styleSettings.sliceLineColor);
          if (preset.styleSettings.sliceLineStyle) setSliceLineStyle(preset.styleSettings.sliceLineStyle);
          if (preset.styleSettings.sliceLineThickness !== undefined) setSliceLineThickness(preset.styleSettings.sliceLineThickness);
          if (preset.styleSettings.outerMargin !== undefined) setOuterMargin(preset.styleSettings.outerMargin);
        }
        setIsCustomLayoutPresetsModalOpen(false);
      }}
    />

    <AniComposerModal
      isOpen={isAniComposerOpen}
      onClose={() => setIsAniComposerOpen(false)}
      slices={storyboardSlices}
      storyboardSlots={storyboardSlots}
    />

    <TraceStudioModal
      isOpen={isTraceStudioOpen}
      onClose={() => setIsTraceStudioOpen(false)}
      activeImageSrc={croppedImageSrc || imageSrc || originalImageSrc || storyboardSlices[0]?.url}
    />

    <ParallaxStudioModal
      isOpen={isParallaxStudioOpen}
      onClose={() => setIsParallaxStudioOpen(false)}
      activeImageSrc={croppedImageSrc || imageSrc || originalImageSrc || storyboardSlices[0]?.url}
    />

    <SmartContourAutoSlicerModal
      isOpen={isSmartContourOpen}
      onClose={() => setIsSmartContourOpen(false)}
      activeImageSrc={croppedImageSrc || imageSrc || originalImageSrc || storyboardSlices[0]?.url}
      onSendSlicesToStoryboard={(slices) => {
        setStoryboardSlices((prev) => [...prev, ...slices]);
        setCropNotice(`✓ Added ${slices.length} isolated contour sprite slices to Asset Pool`);
        setTimeout(() => setCropNotice(null), 3000);
      }}
    />

    <ShortcutManagerModal
      isOpen={isShortcutManagerOpen}
      onClose={() => setIsShortcutManagerOpen(false)}
    />

    <MouseOverStudioModal
      isOpen={isMouseOverStudioOpen}
      onClose={() => setIsMouseOverStudioOpen(false)}
    />

    <CloudConfigEditorModal
      isOpen={isLiveCloudEditorOpen}
      onClose={closeLiveCloudEditor}
    />
  </div>
);
}
