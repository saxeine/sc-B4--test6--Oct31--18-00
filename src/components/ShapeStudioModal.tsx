import React, { useState, useEffect, useCallback, useRef } from "react";
import { ShapeStudioIcon } from "./ShapeStudioIcon";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { getCroppedImg } from "../utils/imageUtils";
import { getStoredJson, saveStoredJson } from "../utils/idbStorage";
import {
  X,
  Plus,
  Trash2,
  Check,
  Palette,
  Pipette,
  Scissors,
  Crop as CropIcon,
  Layers,
  Copy,
  Eye,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Undo2,
  Redo2,
  MousePointer,
  Pencil,
  Square,
  Circle,
  MessageSquare,
  Type,
  Sparkles,
  Hand,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronUp, ChevronLeft, ChevronRight,
  Star,
  Heart,
  Minus,
  Shapes,
  Bookmark,
  Folder,
  CornerUpRight,
  CornerUpLeft,
  ArrowRight,
  ArrowLeftRight,
  ChevronsRight,
  ExternalLink,
  SquarePlus,
  BoxSelect, Maximize2, Scaling,
  Navigation,
  Flame,
  CheckCheck,
  Droplet,
  Pentagon,
  Bandage,
  Wind,
  Cloud,
  Paintbrush,
  Highlighter,
  Image as ImageIcon,
  Wand2,
  Download,
} from "lucide-react";
import { uiText } from "../hooks/useUIConfig";
import { remoteStore } from "../services/remoteKeyValueStore";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export interface Slice {
  name: string;
  url: string;
  story?: string;
}

export interface ShapeLayer {
  id: string;
  name?: string;
  type: "rect" | "circle" | "bubble" | "text" | "arrow" | "curvedArrow" | "curvedArrowLeft" | "doubleArrow" | "tripleArrow" | "line" | "star" | "heart" | "pointer" | "icon" | "image";
  imageUrl?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius?: number;
  lineStyle: "solid" | "dashed" | "dotted";
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  textAlign?: "left" | "center" | "right";
  isBold?: boolean;
  isItalic?: boolean;
  bubbleTail?: { x: number; y: number };
  bubbleType?: "speech" | "thought" | "shout" | "caption" | "box";
  iconName?: string;
  visible?: boolean;
  locked?: boolean;
  skewX?: number;
  skewY?: number;
}

export interface FreehandLine {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  opacity: number;
  arrowEnd?: boolean;
  isSmudge?: boolean;
  isSprayCan?: boolean;
  isBlur?: boolean;
  blurPressure?: number;
  penShape?: "standard" | "dots" | "stars" | "cars" | "hearts" | "sparkles" | "arrows";
}

export interface SavedLayerAsset {
  id: string;
  name: string;
  type: "cutout" | "selection" | "shape" | "layer" | "clone" | "pen" | "image" | "bubble" | "text";
  createdAt: number;
  previewUrl?: string;
  layerData: Partial<ShapeLayer>;
  lineData?: FreehandLine;
}

export interface FrameData {
  [frameIdx: number]: {
    layers: ShapeLayer[];
    freehandLines: FreehandLine[];
    bgFillColor?: string;
  };
}

export interface ShapeStudioMultiCropItem {
  id: string;
  crop: Crop;
  cropShape: "rect" | "oval";
  frameIdx: number;
  frameName?: string;
  createdAt: number;
}

export interface ShapeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  slices: Slice[];
  activeFrameIdx: number;
  onUpdateSliceUrl: (index: number, newUrl: string, newName?: string) => void;
  onAddFrame?: (newFrame: Slice, insertAtIndex?: number) => void;
  onNavigateFrame?: (index: number) => void;
  onDeleteFrame?: (index: number) => void;
  onResendToCrop?: (url: string, sliceIndex: number) => void;
}

const PRESET_COLORS = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#ffffff", // White
  "#000000", // Black
  "transparent",
];

const THICKNESS_PRESETS = [1, 2, 4, 8, 12, 18, 24, 32];

const FONT_FAMILIES = [
  "Inter, sans-serif",
  "Arial, sans-serif",
  "Impact, sans-serif",
  "Georgia, serif",
  "Courier New, monospace",
  "Comic Sans MS, cursive",
];

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      let temp = t;
      if (temp < 0) temp += 1;
      if (temp > 1) temp -= 1;
      if (temp < 1 / 6) return p + (q - p) * 6 * temp;
      if (temp < 1 / 2) return q;
      if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  s = s / 100;
  v = v / 100;
  let r = 0, g = 0, b = 0;
  let i = Math.floor(h / 60) % 6;
  let f = h / 60 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);
  switch (i) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255;
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  let d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleaned = hex.replace(/^#/, "");
  if (cleaned.length === 3) {
    cleaned = cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2];
  }
  const num = parseInt(cleaned, 16) || 0;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.min(Math.max(0, val), 255);
  const rr = clamp(r).toString(16).padStart(2, "0");
  const gg = clamp(g).toString(16).padStart(2, "0");
  const bb = clamp(b).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
}

const AdvancedColorPicker: React.FC<{ color: string; onChange: (hex: string) => void }> = ({ color, onChange }) => {
  const [h, setH] = useState(0);
  const [s, setS] = useState(100);
  const [v, setV] = useState(100);

  const [inputR, setInputR] = useState("255");
  const [inputG, setInputG] = useState("0");
  const [inputB, setInputB] = useState("0");

  const [isDraggingSV, setIsDraggingSV] = useState(false);
  const svRef = useRef<HTMLDivElement>(null);
  const lastColorRef = useRef("");

  useEffect(() => {
    const cleanedColor = color.startsWith("#") ? color : "#10b981";
    if (cleanedColor !== lastColorRef.current) {
      lastColorRef.current = cleanedColor;
      const rgb = hexToRgb(cleanedColor);
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setH(hsv.h);
      setS(hsv.s);
      setV(hsv.v);
      setInputR(rgb.r.toString());
      setInputG(rgb.g.toString());
      setInputB(rgb.b.toString());
    }
  }, [color]);

  const updateHSV = (newH: number, newS: number, newV: number) => {
    setH(newH);
    setS(newS);
    setV(newV);

    const rgb = hsvToRgb(newH, newS, newV);
    setInputR(rgb.r.toString());
    setInputG(rgb.g.toString());
    setInputB(rgb.b.toString());

    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    lastColorRef.current = hex;
    onChange(hex);
  };

  const handleSVPaint = (clientX: number, clientY: number) => {
    if (!svRef.current) return;
    const rect = svRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(0, clientX - rect.left), rect.width);
    const y = Math.min(Math.max(0, clientY - rect.top), rect.height);
    const newS = Math.round((x / rect.width) * 100);
    const newV = Math.round((1 - y / rect.height) * 100);
    updateHSV(h, newS, newV);
  };

  const handleRGBChange = (channel: "r" | "g" | "b", valStr: string) => {
    const valClean = valStr.replace(/[^0-9]/g, "");
    let num = parseInt(valClean) || 0;
    if (num > 255) num = 255;

    let nextR = parseInt(inputR) || 0;
    let nextG = parseInt(inputG) || 0;
    let nextB = parseInt(inputB) || 0;

    if (channel === "r") {
      setInputR(valClean);
      nextR = num;
    } else if (channel === "g") {
      setInputG(valClean);
      nextG = num;
    } else {
      setInputB(valClean);
      nextB = num;
    }

    const hex = rgbToHex(nextR, nextG, nextB);
    const hsv = rgbToHsv(nextR, nextG, nextB);
    setH(hsv.h);
    setS(hsv.s);
    setV(hsv.v);

    lastColorRef.current = hex;
    onChange(hex);
  };

  const handleEyedropper = async () => {
    if (!(window as any).EyeDropper) {
      alert("Eyedropper not supported in this browser. Please enter a hex code or use the slider.");
      return;
    }
    try {
      const eyedropper = new (window as any).EyeDropper();
      const result = await eyedropper.open();
      onChange(result.sRGBHex);
    } catch (err) {
      console.log("Eyedropper closed or failed", err);
    }
  };

  const cleanedColor = color.startsWith("#") ? color : "#10b981";

  return (
    <div className="w-full bg-white rounded-lg shadow-xl overflow-hidden text-black flex flex-col border border-slate-200">
      {/* 1. Saturation-Value 2D Area */}
      <div
        ref={svRef}
        className="relative h-[52px] w-full cursor-crosshair select-none overflow-hidden rounded-t-lg"
        style={{
          backgroundColor: `hsl(${h}, 100%, 50%)`,
        }}
        onPointerDown={(e) => {
          setIsDraggingSV(true);
          e.currentTarget.setPointerCapture(e.pointerId);
          handleSVPaint(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (isDraggingSV) {
            handleSVPaint(e.clientX, e.clientY);
          }
        }}
        onPointerUp={(e) => {
          setIsDraggingSV(false);
          try {
            e.currentTarget.releasePointerCapture(e.pointerId);
          } catch {}
        }}
      >
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

        {/* Selection marker/pointer */}
        <div
          className="absolute w-2 h-2 rounded-full border border-white shadow pointer-events-none -translate-x-1/2 translate-y-1/2"
          style={{
            left: `${s}%`,
            bottom: `${v}%`,
            backgroundColor: cleanedColor,
          }}
        />
      </div>

      {/* 2. Controls Area (Eyedropper, circular preview, rainbow slider) */}
      <div className="p-1 pb-0.5 flex items-center gap-1 bg-white">
        {/* Eyedropper button */}
        <CustomizableButton
          buttonId="shape_studio_modal_btn_189"
          defaultIcon={<svg
            stroke="currentColor"
            fill="none"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-2.5 h-2.5 text-slate-700"
          >
            <path d="m2 22 1-1c.7-.7.7-1.9 0-2.6L12 9" />
            <path d="M19 8c.6.6 1.4.9 2.2.8.8-.1 1.5-.7 1.7-1.5.3-.9 0-1.9-.7-2.6l-2.2-2.2c-.7-.7-1.7-1-2.6-.7-.8.2-1.4.9-1.5 1.7-.1.8.2 1.6.8 2.2" />
            <path d="m14 11 3 3" />
          </svg>}
          onClick={handleEyedropper}
className="p-0.5 hover:bg-slate-100 rounded transition-all cursor-pointer border border-slate-200/60"
title={uiText("components_shape_studio_modal.button.eye_dropper_tool.title", "Eye Dropper Tool")}
        />

        {/* Big circular color preview */}
        <div
          className="w-3.5 h-3.5 rounded-full border border-slate-200/80 shadow-inner shrink-0"
          style={{ backgroundColor: cleanedColor }}
        />

        {/* Rainbow Hue Slider */}
        <div className="flex-1 relative flex items-center h-2">
          <input
            type="range"
            min="0"
            max="360"
            value={h}
            onChange={(e) => updateHSV(parseInt(e.target.value), s, v)}
            className="w-full h-1 rounded-full appearance-none cursor-pointer outline-none border border-slate-200/60"
            style={{
              background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
            }}
          />
        </div>
      </div>

      {/* 3. Inputs Area (RGB boxes with labels underneath) */}
      <div className="px-1 pb-1 grid grid-cols-4 gap-0.5 bg-white items-center">
        <div className="flex flex-col items-center">
          <input
            type="text"
            value={inputR}
            onChange={(e) => handleRGBChange("r", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded p-0 text-center text-[9px] font-bold text-slate-800 outline-none focus:border-indigo-500"
          />
          <span className="text-[7px] font-bold text-slate-400 select-none">{uiText("components_shape_studio_modal.span.r", "R")}</span>
        </div>

        <div className="flex flex-col items-center">
          <input
            type="text"
            value={inputG}
            onChange={(e) => handleRGBChange("g", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded p-0 text-center text-[9px] font-bold text-slate-800 outline-none focus:border-indigo-500"
          />
          <span className="text-[7px] font-bold text-slate-400 select-none">{uiText("components_shape_studio_modal.span.g", "G")}</span>
        </div>

        <div className="flex flex-col items-center">
          <input
            type="text"
            value={inputB}
            onChange={(e) => handleRGBChange("b", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded p-0 text-center text-[9px] font-bold text-slate-800 outline-none focus:border-indigo-500"
          />
          <span className="text-[7px] font-bold text-slate-400 select-none">{uiText("components_shape_studio_modal.span.b", "B")}</span>
        </div>

        {/* Decorative format selection chevron */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
        </div>
      </div>
    </div>
  );
};

export const ShapeStudioModal: React.FC<ShapeStudioModalProps> = ({
  isOpen,
  onClose,
  slices,
  activeFrameIdx,
  onUpdateSliceUrl,
  onAddFrame,
  onNavigateFrame,
  onDeleteFrame,
  onResendToCrop,
}) => {
  // Global frame vector state
  const [frameData, setFrameData] = useState<FrameData>({});

  // Active frame selection & studio settings
  const [activeIdx, setActiveIdx] = useState<number>(activeFrameIdx);
  const [activeTool, setActiveTool] = useState<
    "pointer" | "brush" | "shapes" | "bubbles" | "text" | "icon" | "pan" | "crop" | "marquee" | "lines" | "smudge" | "sprayCan" | "blur" | "polygonSelection" | "patch" | "canvasSize" | "chromaKey" | "pen" | "magicWand" | "selectResize"
  >("brush");

  // Blur Brush Settings
  const [blurPressure, setBlurPressure] = useState<number>(50);

  // Magic Wand Tool States
  const [wandTolerance, setWandTolerance] = useState<number>(32);
  const [wandContiguous, setWandContiguous] = useState<boolean>(true);
  const [wandSelection, setWandSelection] = useState<{
    maskDataUrl: string;
    cutoutDataUrl: string;
    bounds: { x: number; y: number; width: number; height: number };
    sampledColor: string;
    pixelCount: number;
    totalPixels: number;
    selectedIndices: Uint8Array;
    seedX: number;
    seedY: number;
  } | null>(null);
  const [isProcessingWand, setIsProcessingWand] = useState<boolean>(false);

  // State to manage the visibility of the right side pane
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(true);

  // Helper to get default top-right corner position for flyout option boxes
  const getTopRightPos = useCallback(() => ({
    x: typeof window !== "undefined" ? Math.max(16, window.innerWidth - 320) : 800,
    y: 16
  }), []);

  // Flyout menu state ("shapes" | "pen" | "color" | "lines" | "selection" | "vectorPen" | null)
  const [openFlyout, setOpenFlyout] = useState<"shapes" | "pen" | "color" | "lines" | "selection" | "vectorPen" | null>(null);
  const [shapesFlyoutPos, setShapesFlyoutPos] = useState(() => getTopRightPos());
  const [isDraggingShapesFlyout, setIsDraggingShapesFlyout] = useState(false);
  const [shapesFlyoutDragStart, setShapesFlyoutDragStart] = useState({ x: 0, y: 0 });

  const [linesFlyoutPos, setLinesFlyoutPos] = useState(() => getTopRightPos());
  const [isDraggingLinesFlyout, setIsDraggingLinesFlyout] = useState(false);
  const [linesFlyoutDragStart, setLinesFlyoutDragStart] = useState({ x: 0, y: 0 });

  const [penFlyoutPos, setPenFlyoutPos] = useState(() => getTopRightPos());
  const [isDraggingPenFlyout, setIsDraggingPenFlyout] = useState(false);
  const [penFlyoutDragStart, setPenFlyoutDragStart] = useState({ x: 0, y: 0 });

  const [selectionFlyoutPos, setSelectionFlyoutPos] = useState(() => getTopRightPos());
  const [isDraggingSelectionFlyout, setIsDraggingSelectionFlyout] = useState(false);
  const [selectionFlyoutDragStart, setSelectionFlyoutDragStart] = useState({ x: 0, y: 0 });

  const [colorFlyoutPos, setColorFlyoutPos] = useState(() => getTopRightPos());
  const [isDraggingColorFlyout, setIsDraggingColorFlyout] = useState(false);
  const [colorFlyoutDragStart, setColorFlyoutDragStart] = useState({ x: 0, y: 0 });

  // Moveable Advanced Retouching Panel State
  const [isAdvancedPanelOpen, setIsAdvancedPanelOpen] = useState<boolean>(false);
  const [advancedPanelPos, setAdvancedPanelPos] = useState(() => getTopRightPos());
  const [isDraggingAdvancedPanel, setIsDraggingAdvancedPanel] = useState(false);
  const [advancedPanelDragStart, setAdvancedPanelDragStart] = useState({ x: 0, y: 0 });

  // Helper to open a flyout defaulting to top-right
  const handleOpenFlyout = useCallback((flyout: "shapes" | "pen" | "color" | "lines" | "selection" | "vectorPen" | null) => {
    if (flyout) {
      const pos = getTopRightPos();
      if (flyout === "shapes") setShapesFlyoutPos(pos);
      if (flyout === "lines") setLinesFlyoutPos(pos);
      if (flyout === "pen") setPenFlyoutPos(pos);
      if (flyout === "selection" || flyout === "vectorPen") setSelectionFlyoutPos(pos);
      if (flyout === "color") setColorFlyoutPos(pos);
    }
    setOpenFlyout(flyout === "vectorPen" ? "selection" : flyout);
  }, [getTopRightPos]);

  // Canvas Size Tool States
  const [canvasWidthInput, setCanvasWidthInput] = useState<number>(0);
  const [canvasHeightInput, setCanvasHeightInput] = useState<number>(0);
  const [canvasWidthOffset, setCanvasWidthOffset] = useState<number>(0);
  const [canvasHeightOffset, setCanvasHeightOffset] = useState<number>(0);
  const [canvasRelative, setCanvasRelative] = useState<boolean>(false);
  const [canvasAnchor, setCanvasAnchor] = useState<number>(4); // Default to middle-center (0-8)
  const [canvasExtensionColorType, setCanvasExtensionColorType] = useState<"transparent" | "white" | "black" | "custom">("transparent");
  const [canvasExtensionCustomColor, setCanvasExtensionCustomColor] = useState<string>("#a3e635"); // Default green accent
  const [showCanvasResizePreview, setShowCanvasResizePreview] = useState<boolean>(true);

  // Chroma Key Tool States
  const [chromaKeyColor, setChromaKeyColor] = useState<string>("#00ff00");
  const [chromaKeyTolerance, setChromaKeyTolerance] = useState<number>(30);
  const [chromaKeySmoothness, setChromaKeySmoothness] = useState<number>(10);

  // Advanced Retouch Dropdown state
  const [isRetouchDropdownOpen, setIsRetouchDropdownOpen] = useState<boolean>(false);
  const [expandedRetouchFolder, setExpandedRetouchFolder] = useState<number | null>(0);

  // Selected shape preset for creation
  const [selectedShapePreset, setSelectedShapePreset] = useState<
    "line" | "arrow" | "curvedArrow" | "curvedArrowLeft" | "doubleArrow" | "tripleArrow" | "rect_outline" | "rect_filled" | "circle_outline" | "circle_filled" | "star" | "bubble" | "pointer"
  >("rect_outline");

  // Multi / single layer selection
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);

  // Visibility Toggles
  const [showShapeLayers, setShowShapeLayers] = useState<boolean>(true);
  const [showFreehandLines, setShowFreehandLines] = useState<boolean>(true);

  // Accordion panel states
  const [isVisibilityOpen, setIsVisibilityOpen] = useState<boolean>(true);
  const [isNamedLayersOpen, setIsNamedLayersOpen] = useState<boolean>(true);
  const [isFreehandLinesSectionOpen, setIsFreehandLinesSectionOpen] = useState<boolean>(true);

  // Canvas visibility panel auto-hides on launch of any tool option box, and relaunches when all tool option boxes close
  useEffect(() => {
    const isAnyOptionBoxOpen = openFlyout !== null || isAdvancedPanelOpen;
    if (isAnyOptionBoxOpen) {
      setIsVisibilityOpen(false);
      setIsRightSidebarOpen(false);
    } else {
      setIsVisibilityOpen(true);
      setIsRightSidebarOpen(true);
    }
  }, [openFlyout, isAdvancedPanelOpen]);

  // Saved Layer Assets state (persisted to IndexedDB with localStorage fallback)
  const [savedLayerAssets, setSavedLayerAssets] = useState<SavedLayerAsset[]>(() => {
    try {
      const stored = remoteStore.getItem("shapestudio_layer_assets");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Hydrate from IndexedDB on mount (where large image/cutout layer assets are safely kept without quota issues)
  useEffect(() => {
    let isMounted = true;
    getStoredJson<SavedLayerAsset[]>("shapestudio_layer_assets")
      .then((data) => {
        if (isMounted && data && Array.isArray(data) && data.length > 0) {
          setSavedLayerAssets(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Persist full asset list to IndexedDB
    saveStoredJson("shapestudio_layer_assets", savedLayerAssets).catch(() => {});

    // Try keeping a lightweight copy in localStorage if small, but gracefully clear on quota exceeded
    try {
      const serialized = JSON.stringify(savedLayerAssets);
      if (serialized.length < 200 * 1024) {
        remoteStore.setItem("shapestudio_layer_assets", serialized);
      } else {
        remoteStore.removeItem("shapestudio_layer_assets");
      }
    } catch {
      try {
        remoteStore.removeItem("shapestudio_layer_assets");
      } catch {}
    }
  }, [savedLayerAssets]);

  const [isLayerAssetsOpen, setIsLayerAssetsOpen] = useState<boolean>(true);

  const handleSaveLayerAsAsset = (layer: Partial<ShapeLayer>, nameHint?: string) => {
    const isImage = !!layer.imageUrl || layer.type === "image";
    let inferredType: "cutout" | "selection" | "shape" | "layer" | "clone" | "pen" | "image" | "bubble" | "text" = "shape";
    if (isImage) {
      if (layer.name?.toLowerCase().includes("clone")) inferredType = "clone";
      else if (layer.name?.toLowerCase().includes("pen") || layer.name?.toLowerCase().includes("cutout")) inferredType = "cutout";
      else if (layer.name?.toLowerCase().includes("patch")) inferredType = "selection";
      else inferredType = "image";
    } else if (layer.type === "bubble") {
      inferredType = "bubble";
    } else if (layer.type === "text") {
      inferredType = "text";
    }

    const defaultName = nameHint || layer.name || `${layer.type ? layer.type.charAt(0).toUpperCase() + layer.type.slice(1) : 'Layer'} Asset`;

    const newAsset: SavedLayerAsset = {
      id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: defaultName,
      type: inferredType,
      createdAt: Date.now(),
      previewUrl: layer.imageUrl,
      layerData: {
        type: layer.type || "rect",
        width: layer.width || 120,
        height: layer.height || 120,
        fillColor: layer.fillColor || "#6366f1",
        strokeColor: layer.strokeColor || "#ffffff",
        strokeWidth: layer.strokeWidth || 2,
        lineStyle: layer.lineStyle || "solid",
        borderRadius: layer.borderRadius || 0,
        rotation: layer.rotation || 0,
        skewX: layer.skewX || 0,
        skewY: layer.skewY || 0,
        opacity: layer.opacity ?? 1,
        text: layer.text,
        textColor: layer.textColor,
        fontSize: layer.fontSize,
        fontFamily: layer.fontFamily,
        textAlign: layer.textAlign,
        isBold: layer.isBold,
        isItalic: layer.isItalic,
        bubbleType: layer.bubbleType,
        bubbleTail: layer.bubbleTail,
        imageUrl: layer.imageUrl,
        name: defaultName,
      },
    };
    setSavedLayerAssets((prev) => [newAsset, ...prev]);
    setToastNotice(`⭐ Saved "${newAsset.name}" to Layer Assets!`);
    setTimeout(() => setToastNotice(null), 2500);
  };

  const handleSaveLineAsAsset = (line: FreehandLine, nameHint?: string) => {
    let previewUrl: string | undefined;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (ctx && line.points && line.points.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        line.points.forEach((p) => {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        });
        const w = Math.max(8, maxX - minX);
        const h = Math.max(8, maxY - minY);
        const scale = Math.min(46 / w, 46 / h);
        const offsetX = 32 - (w * scale) / 2;
        const offsetY = 32 - (h * scale) / 2;

        ctx.save();
        ctx.strokeStyle = line.color || "#10b981";
        ctx.lineWidth = Math.max(2, (line.width || 4) * scale);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        line.points.forEach((p, i) => {
          const px = offsetX + (p.x - minX) * scale;
          const py = offsetY + (p.y - minY) * scale;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.restore();
        previewUrl = canvas.toDataURL("image/png");
      }
    } catch (e) {
      console.warn("Could not generate line preview:", e);
    }

    const defaultName = nameHint || `Pen Stroke (${line.width}px)`;
    const newAsset: SavedLayerAsset = {
      id: `asset_line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: defaultName,
      type: "pen",
      createdAt: Date.now(),
      previewUrl,
      lineData: line,
      layerData: {
        type: "line",
        width: line.width,
        height: line.width,
        strokeColor: line.color,
        strokeWidth: line.width,
        opacity: line.opacity,
        name: defaultName,
      },
    };
    setSavedLayerAssets((prev) => [newAsset, ...prev]);
    setToastNotice(`⭐ Saved "${newAsset.name}" to Layer Assets!`);
    setTimeout(() => setToastNotice(null), 2500);
  };

  const handleInsertLayerAsset = (asset: SavedLayerAsset) => {
    pushHistory();
    if (asset.lineData) {
      const newLine: FreehandLine = {
        ...asset.lineData,
        id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      };
      updateActiveFrameData(currentLayers, [...currentFreehandLines, newLine]);
      setToastNotice(`＋ Inserted Pen Stroke into Frame ${activeIdx + 1}`);
      setTimeout(() => setToastNotice(null), 2500);
      return;
    }

    const stageW = imgNaturalSize.width || 800;
    const stageH = imgNaturalSize.height || 600;
    const newLayer: ShapeLayer = {
      id: `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: (asset.layerData.type as any) || "rect",
      x: Math.round(stageW / 2 - (asset.layerData.width || 120) / 2),
      y: Math.round(stageH / 2 - (asset.layerData.height || 120) / 2),
      width: asset.layerData.width || 120,
      height: asset.layerData.height || 120,
      fillColor: asset.layerData.fillColor || "#6366f1",
      strokeColor: asset.layerData.strokeColor || "#ffffff",
      strokeWidth: asset.layerData.strokeWidth ?? 2,
      lineStyle: asset.layerData.lineStyle || "solid",
      borderRadius: asset.layerData.borderRadius || 0,
      rotation: asset.layerData.rotation || 0,
      skewX: asset.layerData.skewX || 0,
      skewY: asset.layerData.skewY || 0,
      opacity: asset.layerData.opacity ?? 1,
      zIndex: currentLayers.length + 1,
      text: asset.layerData.text,
      textColor: asset.layerData.textColor,
      fontSize: asset.layerData.fontSize,
      fontFamily: asset.layerData.fontFamily,
      textAlign: asset.layerData.textAlign,
      isBold: asset.layerData.isBold,
      isItalic: asset.layerData.isItalic,
      bubbleType: asset.layerData.bubbleType,
      bubbleTail: asset.layerData.bubbleTail,
      imageUrl: asset.layerData.imageUrl,
      name: asset.name,
      locked: false,
      visible: true,
    };
    updateActiveFrameData((prev = []) => [...(Array.isArray(prev) ? prev : []), newLayer]);
    setSelectedLayerIds([newLayer.id]);
    setToastNotice(`＋ Inserted "${asset.name}" into Frame ${activeIdx + 1}`);
    setTimeout(() => setToastNotice(null), 2500);
  };

  // Brush Settings & Pen Shape Stamp styles
  const [brushColor, setBrushColor] = useState<string>("#10b981");
  const [brushWidth, setBrushWidth] = useState<number>(4);
  const [brushOpacity, setBrushOpacity] = useState<number>(1);
  const [brushArrowEnd, setBrushArrowEnd] = useState<boolean>(false);
  const [brushLineMode, setBrushLineMode] = useState<"freehand" | "straight" | "continuous_straight">("freehand");
  const [penShape, setPenShape] = useState<"standard" | "dots" | "stars" | "cars" | "hearts" | "sparkles" | "arrows">("standard");
  const [isPenShapesOpen, setIsPenShapesOpen] = useState<boolean>(true);

  // Default shape colors
  const [fillColor, setFillColor] = useState<string>("transparent");
  const [strokeColor, setStrokeColor] = useState<string>("#10b981");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [borderRadius, setBorderRadius] = useState<number>(2);

  // Polygon Selection State
  const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);
  const [isPolygonClosed, setIsPolygonClosed] = useState<boolean>(false);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  // Pen & Lasso Cutout State
  const [penPoints, setPenPoints] = useState<{ x: number; y: number }[]>([]);
  const [isPenClosed, setIsPenClosed] = useState<boolean>(false);

  // Patch Tool State
  const [patchSourceBox, setPatchSourceBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [patchDestBox, setPatchDestBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [draggedPatchBox, setDraggedPatchBox] = useState<"source" | "dest" | null>(null);
  const [patchDragStart, setPatchDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Stage Pan & Zoom
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Natural image dimensions
  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number }>({
    width: 960,
    height: 540,
  });

  // Dynamic Viewport-to-Stage Auto-Fit calculation
  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const padX = 48;
    const padY = 48;
    const availW = Math.max(100, rect.width - padX);
    const availH = Math.max(100, rect.height - padY);
    const scale = Math.min(availW / (imgNaturalSize.width || 960), availH / (imgNaturalSize.height || 540));
    setZoomLevel(Math.max(0.15, Math.min(2.5, Math.round(scale * 100) / 100)));
    setPanOffset({ x: 0, y: 0 });
    setToastNotice("✓ Fitted stage to screen");
    setTimeout(() => setToastNotice(null), 1500);
  }, [imgNaturalSize]);

  useEffect(() => {
    if (imgNaturalSize.width && imgNaturalSize.height) {
      setCanvasWidthInput(imgNaturalSize.width);
      setCanvasHeightInput(imgNaturalSize.height);
    }
  }, [imgNaturalSize]);

  // Crop Tool state inside ShapeStudio
  const [marqueeBox, setMarqueeBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Select & Resize Tool state
  const [selectResizeBox, setSelectResizeBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectResizeSnapshot, setSelectResizeSnapshot] = useState<{
    originalBox: { x: number; y: number; width: number; height: number };
    imageUrl: string;
  } | null>(null);
  const [selectResizeOpacity, setSelectResizeOpacity] = useState<number>(1);
  const [selectResizeKeepAspect, setSelectResizeKeepAspect] = useState<boolean>(false);
  const [selectResizeClearOriginal, setSelectResizeClearOriginal] = useState<boolean>(false);

  const selectResizeBoxRef = useRef(selectResizeBox);
  selectResizeBoxRef.current = selectResizeBox;
  const selectResizeSnapshotRef = useRef(selectResizeSnapshot);
  selectResizeSnapshotRef.current = selectResizeSnapshot;
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isCropSelected, setIsCropSelected] = useState<boolean>(true);
  const [cropAspect, setCropAspect] = useState<"free" | "16:9" | "4:3" | "1:1" | "9:16">("free");
  const [cropShape, setCropShape] = useState<"rect" | "oval">("rect");
  const [crop, setCrop] = useState<Crop>();
  const [completedPercentCrop, setCompletedPercentCrop] = useState<Crop | null>(null);
  const [completedPixelCrop, setCompletedPixelCrop] = useState<Crop | null>(null);
  const [multiCrops, setMultiCrops] = useState<ShapeStudioMultiCropItem[]>([]);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Undo / Redo stacks supporting layers, drawings, active tool and crop state
  const [undoStack, setUndoStack] = useState<{
    layers: ShapeLayer[];
    freehandLines: FreehandLine[];
    cropBox?: { x: number; y: number; width: number; height: number } | null;
    isCropSelected?: boolean;
    cropAspect?: "free" | "16:9" | "4:3" | "1:1" | "9:16";
    cropShape?: "rect" | "oval";
    activeTool?: "pointer" | "brush" | "shapes" | "bubbles" | "text" | "icon" | "pan" | "crop" | "marquee" | "lines" | "smudge" | "sprayCan" | "blur" | "polygonSelection" | "patch" | "canvasSize" | "chromaKey" | "pen" | "magicWand" | "selectResize";
    sliceUrl?: string;
    bgFillColor?: string;
  }[]>([]);
  const [redoStack, setRedoStack] = useState<{
    layers: ShapeLayer[];
    freehandLines: FreehandLine[];
    cropBox?: { x: number; y: number; width: number; height: number } | null;
    isCropSelected?: boolean;
    cropAspect?: "free" | "16:9" | "4:3" | "1:1" | "9:16";
    cropShape?: "rect" | "oval";
    activeTool?: "pointer" | "brush" | "shapes" | "bubbles" | "text" | "icon" | "pan" | "crop" | "marquee" | "lines" | "smudge" | "sprayCan" | "blur" | "polygonSelection" | "patch" | "canvasSize" | "chromaKey" | "pen" | "magicWand" | "selectResize";
    sliceUrl?: string;
    bgFillColor?: string;
  }[]>([]);

  // Toast feedback
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [frameToDeleteIdx, setFrameToDeleteIdx] = useState<number | null>(null);

  // Interactive drawing & dragging state
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentLinePoints, setCurrentLinePoints] = useState<{ x: number; y: number }[]>([]);

  // Layer dragging / resizing state
  const [dragState, setDragState] = useState<{
    type: "move" | "resize" | "rotate" | "bubbleTail" | "crop" | "marquee" | "skewX" | "skewY" | "marquee_adjust" | "marquee_move" | "crop_adjust" | "crop_move" | "canvas_resize_handle" | "select_resize_draw" | "select_resize_adjust" | "select_resize_move";
    handle?: string;
    startX: number;
    startY: number;
    initialLayers: ShapeLayer[];
    initialCropBox?: { x: number; y: number; width: number; height: number };
    initialMarqueeBox?: { x: number; y: number; width: number; height: number };
    initialSelectResizeBox?: { x: number; y: number; width: number; height: number };
    initialCanvasW?: number;
    initialCanvasH?: number;
  } | null>(null);

  // Text inline editing modal
  const [editingLayerText, setEditingLayerText] = useState<{ id: string; text: string } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTime = useRef(0);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Active slice
  const activeSlice = slices && slices[activeIdx] ? slices[activeIdx] : null;

  // Initialize frame layers/lines if empty
  const currentLayers = frameData[activeIdx]?.layers || [];
  const currentFreehandLines = frameData[activeIdx]?.freehandLines || [];

  const selectedLayer = currentLayers.find((l) => selectedLayerIds.includes(l.id));

  // Synchronize activeIdx with prop
  useEffect(() => {
    setActiveIdx(activeFrameIdx);
  }, [activeFrameIdx]);

  // Synchronize strokeWidth and borderRadius states when selectedLayer changes
  useEffect(() => {
    if (selectedLayer) {
      if (typeof selectedLayer.strokeWidth === "number") {
        setStrokeWidth(selectedLayer.strokeWidth);
      }
      if (typeof selectedLayer.borderRadius === "number") {
        setBorderRadius(selectedLayer.borderRadius);
      }
      if (selectedLayer.strokeColor) {
        setBrushColor(selectedLayer.strokeColor);
        setStrokeColor(selectedLayer.strokeColor);
      }
    }
  }, [selectedLayer?.id, selectedLayer?.strokeWidth, selectedLayer?.borderRadius, selectedLayer?.strokeColor]);

  // Measure natural image size on change

  useEffect(() => {
    if (isOpen) {
      setActiveTool("crop");
      setCropBox(null);
      setMarqueeBox(null);
      setCrop(undefined);
      setCompletedPercentCrop(null);
      setCompletedPixelCrop(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTool !== "pan") setIsPanning(false);
    if (activeTool !== "marquee") setMarqueeBox(null);
    if (activeTool !== "selectResize") {
      setSelectResizeBox(null);
      setSelectResizeSnapshot(null);
    }
    if (activeTool !== "polygonSelection") {
      setPolygonPoints([]);
      setIsPolygonClosed(false);
      setHoverCoords(null);
    }
    if (activeTool !== "patch") {
      setPatchSourceBox(null);
      setPatchDestBox(null);
      setDraggedPatchBox(null);
    }
    if (activeTool !== "crop") {
      setCropBox(null);
      setCropShape("rect");
      setCrop(undefined);
      setCompletedPercentCrop(null);
      setCompletedPixelCrop(null);
    }
  }, [activeTool]);

  useEffect(() => {
    const isRetouchTool = ["sprayCan", "smudge", "blur", "polygonSelection", "patch", "canvasSize", "chromaKey"].includes(activeTool);
    if (isRetouchTool) {
      setIsAdvancedPanelOpen(true);
      setIsRightSidebarOpen(false);
    } else {
      setIsAdvancedPanelOpen(false);
      setIsRightSidebarOpen(true);
    }
    if (activeTool === "magicWand" || activeTool === "pen" || activeTool === "marquee" || activeTool === "selectResize") {
      setOpenFlyout("selection");
    }
  }, [activeTool]);

  useEffect(() => {
    if (activeSlice?.url) {
      const img = new Image();
      if (activeSlice.url.startsWith("http://") || activeSlice.url.startsWith("https://")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => {
        const w = img.naturalWidth || 960;
        const h = img.naturalHeight || 540;
        setImgNaturalSize({ width: w, height: h });
      };
      img.onerror = () => {
        setImgNaturalSize({ width: 960, height: 540 });
      };
      img.src = activeSlice.url;
    }
  }, [activeSlice?.url]);

  // Push history state (including layers, drawings, crop frame state, and active tool)
  const pushHistory = useCallback((overrideCropBox?: { x: number; y: number; width: number; height: number } | null) => {
    setUndoStack((prev = []) => [
      ...(Array.isArray(prev) ? prev : []),
      {
        layers: JSON.parse(JSON.stringify(currentLayers)),
        freehandLines: JSON.parse(JSON.stringify(currentFreehandLines)),
        cropBox: overrideCropBox !== undefined ? (overrideCropBox ? { ...overrideCropBox } : null) : (cropBox ? { ...cropBox } : null),
        isCropSelected,
        cropAspect,
        cropShape,
        activeTool,
        sliceUrl: activeSlice?.url,
        bgFillColor: frameData[activeIdx]?.bgFillColor,
      },
    ]);
    setRedoStack([]);
  }, [currentLayers, currentFreehandLines, cropBox, isCropSelected, cropAspect, cropShape, activeTool, activeSlice?.url, frameData, activeIdx]);

  // Update current frame data helper
  const updateActiveFrameData = useCallback(
    (
      newLayers?: ShapeLayer[] | ((prev: ShapeLayer[]) => ShapeLayer[]),
      newLines?: FreehandLine[] | ((prev: FreehandLine[]) => FreehandLine[]),
      newBgFillColor?: string | null
    ) => {
      setFrameData((prevObj = {}) => {
        const safePrevObj = prevObj || {};
        const frame = safePrevObj[activeIdx] || { layers: [], freehandLines: [] };
        const safeExistingLayers = Array.isArray(frame.layers) ? frame.layers : [];
        const safeExistingLines = Array.isArray(frame.freehandLines) ? frame.freehandLines : [];

        let updatedLayers: ShapeLayer[];
        if (newLayers === undefined) {
          updatedLayers = safeExistingLayers;
        } else if (typeof newLayers === "function") {
          const result = newLayers(safeExistingLayers);
          updatedLayers = Array.isArray(result) ? result : safeExistingLayers;
        } else {
          updatedLayers = Array.isArray(newLayers) ? newLayers : safeExistingLayers;
        }

        let updatedLines: FreehandLine[];
        if (newLines === undefined) {
          updatedLines = safeExistingLines;
        } else if (typeof newLines === "function") {
          const result = newLines(safeExistingLines);
          updatedLines = Array.isArray(result) ? result : safeExistingLines;
        } else {
          updatedLines = Array.isArray(newLines) ? newLines : safeExistingLines;
        }

        let bgFillColor = frame.bgFillColor;
        if (newBgFillColor === null) {
          bgFillColor = undefined;
        } else if (typeof newBgFillColor === "string") {
          bgFillColor = newBgFillColor;
        }

        return {
          ...safePrevObj,
          [activeIdx]: {
            layers: updatedLayers,
            freehandLines: updatedLines,
            bgFillColor,
          },
        };
      });
    },
    [activeIdx]
  );

  // Undo / Redo action handlers
  const handleUndo = useCallback(() => {
    if (!Array.isArray(undoStack) || undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev = []) => (Array.isArray(prev) ? prev.slice(0, prev.length - 1) : []));
    setRedoStack((prev = []) => [
      ...(Array.isArray(prev) ? prev : []),
      {
        layers: JSON.parse(JSON.stringify(currentLayers)),
        freehandLines: JSON.parse(JSON.stringify(currentFreehandLines)),
        cropBox: cropBox ? { ...cropBox } : null,
        isCropSelected,
        cropAspect,
        cropShape,
        activeTool,
        sliceUrl: activeSlice?.url,
        bgFillColor: frameData[activeIdx]?.bgFillColor,
      },
    ]);

    // Restore layers, freehand lines & background
    updateActiveFrameData(previous.layers, previous.freehandLines, previous.bgFillColor);

    // Restore crop state
    if (previous.cropBox !== undefined) {
      setCropBox(previous.cropBox);
    }
    if (previous.isCropSelected !== undefined) {
      setIsCropSelected(previous.isCropSelected);
    }
    if (previous.cropAspect !== undefined) {
      setCropAspect(previous.cropAspect);
    }
    if (previous.cropShape !== undefined) {
      setCropShape(previous.cropShape);
    }
    if (previous.activeTool !== undefined) {
      setActiveTool(previous.activeTool);
    }
    if (previous.sliceUrl && activeSlice?.url && previous.sliceUrl !== activeSlice.url) {
      onUpdateSliceUrl(activeIdx, previous.sliceUrl);
    }
    setToastNotice("Undo");
    setTimeout(() => setToastNotice(null), 1200);
  }, [undoStack, currentLayers, currentFreehandLines, cropBox, isCropSelected, cropAspect, cropShape, activeTool, activeSlice?.url, frameData, activeIdx, updateActiveFrameData, onUpdateSliceUrl]);

  const handleRedo = useCallback(() => {
    if (!Array.isArray(redoStack) || redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev = []) => (Array.isArray(prev) ? prev.slice(0, prev.length - 1) : []));
    setUndoStack((prev = []) => [
      ...(Array.isArray(prev) ? prev : []),
      {
        layers: JSON.parse(JSON.stringify(currentLayers)),
        freehandLines: JSON.parse(JSON.stringify(currentFreehandLines)),
        cropBox: cropBox ? { ...cropBox } : null,
        isCropSelected,
        cropAspect,
        cropShape,
        activeTool,
        sliceUrl: activeSlice?.url,
        bgFillColor: frameData[activeIdx]?.bgFillColor,
      },
    ]);

    // Restore layers, freehand lines & background
    updateActiveFrameData(next.layers, next.freehandLines, next.bgFillColor);

    // Restore crop state
    if (next.cropBox !== undefined) {
      setCropBox(next.cropBox);
    }
    if (next.isCropSelected !== undefined) {
      setIsCropSelected(next.isCropSelected);
    }
    if (next.cropAspect !== undefined) {
      setCropAspect(next.cropAspect);
    }
    if (next.cropShape !== undefined) {
      setCropShape(next.cropShape);
    }
    if (next.activeTool !== undefined) {
      setActiveTool(next.activeTool);
    }
    if (next.sliceUrl && activeSlice?.url && next.sliceUrl !== activeSlice.url) {
      onUpdateSliceUrl(activeIdx, next.sliceUrl);
    }
    setToastNotice("Redo");
    setTimeout(() => setToastNotice(null), 1200);
  }, [redoStack, currentLayers, currentFreehandLines, cropBox, isCropSelected, cropAspect, cropShape, activeTool, activeSlice?.url, frameData, activeIdx, updateActiveFrameData, onUpdateSliceUrl]);

  // Clone Area inside Marquee Selection to new layer
  const handleCloneArea = useCallback(async (box: { x: number; y: number; width: number; height: number }) => {
    const sourceImage = activeSlice?.url;
    if (!sourceImage) return;

    try {
      const clonedUrl = await getCroppedImg(
        sourceImage,
        {
          unit: "px",
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        },
        "image/png"
      );

      if (!clonedUrl) {
        throw new Error("getCroppedImg returned empty URL");
      }

      pushHistory();

      const newLayer: ShapeLayer = {
        id: `layer_${Date.now()}`,
        name: "Clone Layer",
        type: "image",
        x: box.x + 20,
        y: box.y + 20,
        width: box.width,
        height: box.height,
        imageUrl: clonedUrl,
        rotation: 0,
        opacity: 1,
        zIndex: (currentLayers.length || 0) + 1,
        strokeColor: "#000000",
        strokeWidth: 0,
        fillColor: "transparent",
        lineStyle: "solid",
        visible: true,
        locked: false,
        skewX: 0,
        skewY: 0,
      };

      updateActiveFrameData((prev = []) => [...(Array.isArray(prev) ? prev : []), newLayer]);
      setSelectedLayerIds([newLayer.id]);
      setMarqueeBox(null);
      setActiveTool("pointer");
      setToastNotice("✓ Cloned selection as a new layer!");
      setTimeout(() => setToastNotice(null), 2500);
    } catch (err) {
      console.error("Failed to clone marquee area:", err);
      setToastNotice("Failed to clone selection");
      setTimeout(() => setToastNotice(null), 2500);
    }
  }, [activeSlice, currentLayers, pushHistory, updateActiveFrameData]);

  // Save Area inside Marquee Selection directly to Layer Assets
  const handleSaveMarqueeAsAsset = useCallback(async (box: { x: number; y: number; width: number; height: number }) => {
    const sourceImage = activeSlice?.url;
    if (!sourceImage || box.width <= 0 || box.height <= 0) return;

    try {
      const croppedUrl = await getCroppedImg(
        sourceImage,
        {
          unit: "px",
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        },
        "image/png"
      );

      if (!croppedUrl) {
        throw new Error("getCroppedImg returned empty URL");
      }

      const newAsset: SavedLayerAsset = {
        id: `asset_${Date.now()}`,
        name: `Clone (${Math.round(box.width)}×${Math.round(box.height)})`,
        type: "clone",
        createdAt: Date.now(),
        previewUrl: croppedUrl,
        layerData: {
          id: `layer_${Date.now()}`,
          name: `Clone (${Math.round(box.width)}×${Math.round(box.height)})`,
          type: "image",
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          imageUrl: croppedUrl,
          rotation: 0,
          opacity: 1,
          zIndex: (currentLayers.length || 0) + 1,
          strokeColor: "#000000",
          strokeWidth: 0,
          fillColor: "transparent",
          lineStyle: "solid",
          visible: true,
          locked: false,
          skewX: 0,
          skewY: 0,
        },
      };

      setSavedLayerAssets((prev) => [newAsset, ...(Array.isArray(prev) ? prev : [])]);
      setIsLayerAssetsOpen(true);
      setMarqueeBox(null);
      setActiveTool("pointer");
      setToastNotice("✓ Selection saved to Layer Assets!");
      setTimeout(() => setToastNotice(null), 2500);
    } catch (err) {
      console.error("Failed to save selection to layer assets:", err);
      setToastNotice("Failed to save selection to assets");
      setTimeout(() => setToastNotice(null), 2500);
    }
  }, [activeSlice, currentLayers, setSavedLayerAssets, setIsLayerAssetsOpen]);

  // Delete Selected Layers
  const handleDeleteSelected = useCallback(() => {
    if (selectedLayerIds.length === 0) return;
    pushHistory();

    updateActiveFrameData((prev = []) =>
      (Array.isArray(prev) ? prev : []).filter((l) => !selectedLayerIds.includes(l.id))
    );
    setSelectedLayerIds([]);
    setToastNotice("✓ Layer(s) deleted");
    setTimeout(() => setToastNotice(null), 2000);
  }, [selectedLayerIds, pushHistory, updateActiveFrameData]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Crop Tool Selection Keyboard Shortcuts
      if (activeTool === "crop") {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
          e.preventDefault();
          e.stopPropagation();
          setCropBox({ x: 0, y: 0, width: imgNaturalSize.width, height: imgNaturalSize.height });
          setToastNotice("✓ Selected whole canvas (100%)");
          setTimeout(() => setToastNotice(null), 2000);
          return;
        }

        if (cropBox && cropBox.width > 0 && cropBox.height > 0) {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            if (e.shiftKey) {
              handleAddMultiCrop();
            } else {
              handleApplyCrop();
            }
            return;
          }

          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            setCropBox(null);
            return;
          }

          if (
            e.key === "ArrowUp" ||
            e.key === "ArrowDown" ||
            e.key === "ArrowLeft" ||
            e.key === "ArrowRight"
          ) {
            e.preventDefault();
            e.stopPropagation();
            const step = e.shiftKey ? 10 : 1;
            setCropBox((prev) => {
              if (!prev) return null;
              let newX = prev.x;
              let newY = prev.y;
              if (e.key === "ArrowUp") newY = Math.max(0, newY - step);
              if (e.key === "ArrowDown") newY = Math.min(imgNaturalSize.height - prev.height, newY + step);
              if (e.key === "ArrowLeft") newX = Math.max(0, newX - step);
              if (e.key === "ArrowRight") newX = Math.min(imgNaturalSize.width - prev.width, newX + step);
              return {
                ...prev,
                x: newX,
                y: newY,
              };
            });
            return;
          }
        }
      }

      // Marquee Clone Selection Keyboard Shortcuts
      if (marqueeBox && marqueeBox.width > 0 && marqueeBox.height > 0) {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          if (e.shiftKey) {
            handleSaveMarqueeAsAsset(marqueeBox);
          } else {
            handleCloneArea(marqueeBox);
          }
          return;
        }

        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          setMarqueeBox(null);
          return;
        }

        if (
          e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight"
        ) {
          e.preventDefault();
          e.stopPropagation();
          const step = e.shiftKey ? 10 : 1;
          setMarqueeBox((prev) => {
            if (!prev) return null;
            let newX = prev.x;
            let newY = prev.y;
            if (e.key === "ArrowUp") newY -= step;
            if (e.key === "ArrowDown") newY += step;
            if (e.key === "ArrowLeft") newX -= step;
            if (e.key === "ArrowRight") newX += step;
            return {
              ...prev,
              x: newX,
              y: newY,
            };
          });
          return;
        }
      }

      // Select & Resize Keyboard Shortcuts
      if (activeTool === "selectResize" && selectResizeBoxRef.current && selectResizeSnapshotRef.current) {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          if (e.shiftKey) {
            handleConvertSelectResizeToLayer();
          } else {
            handleStampSelectResize();
          }
          return;
        }

        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          handleCancelSelectResize();
          return;
        }

        if (
          e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight"
        ) {
          e.preventDefault();
          e.stopPropagation();
          const step = e.shiftKey ? 10 : 1;
          setSelectResizeBox((prev) => {
            if (!prev) return null;
            let newX = prev.x;
            let newY = prev.y;
            if (e.key === "ArrowUp") newY -= step;
            if (e.key === "ArrowDown") newY += step;
            if (e.key === "ArrowLeft") newX -= step;
            if (e.key === "ArrowRight") newX += step;
            return {
              ...prev,
              x: newX,
              y: newY,
            };
          });
          return;
        }
      }

      if (activeTool === "canvasSize") {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          handleApplyCanvasSize();
          return;
        }

        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          setCanvasWidthInput(imgNaturalSize.width);
          setCanvasHeightInput(imgNaturalSize.height);
          setCanvasWidthOffset(0);
          setCanvasHeightOffset(0);
          setToastNotice("Reset canvas dimensions to original");
          setTimeout(() => setToastNotice(null), 2000);
          return;
        }

        if (
          e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight"
        ) {
          e.preventDefault();
          e.stopPropagation();
          const step = e.shiftKey ? 10 : 1;
          if (canvasRelative) {
            if (e.key === "ArrowRight") setCanvasWidthOffset((v) => v + step);
            if (e.key === "ArrowLeft") setCanvasWidthOffset((v) => v - step);
            if (e.key === "ArrowDown") setCanvasHeightOffset((v) => v + step);
            if (e.key === "ArrowUp") setCanvasHeightOffset((v) => v - step);
          } else {
            if (e.key === "ArrowRight") setCanvasWidthInput((v) => v + step);
            if (e.key === "ArrowLeft") setCanvasWidthInput((v) => Math.max(1, v - step));
            if (e.key === "ArrowDown") setCanvasHeightInput((v) => v + step);
            if (e.key === "ArrowUp") setCanvasHeightInput((v) => Math.max(1, v - step));
          }
          return;
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setActiveTool("marquee");
        setOpenFlyout(null);
        setToastNotice("Drag over canvas to clone area");
        setTimeout(() => setToastNotice(null), 2000);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c" && wandSelection) {
        e.preventDefault();
        handleWandCopyToLayer();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x" && wandSelection) {
        e.preventDefault();
        handleWandCutSelection();
      } else if (e.key === "Escape" && wandSelection) {
        setWandSelection(null);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (wandSelection) {
          handleWandDeleteSelection();
        } else {
          handleDeleteSelected();
        }
      } else if (e.key.toLowerCase() === "w") {
        setActiveTool("magicWand");
        handleOpenFlyout("selection");
      } else if (e.key.toLowerCase() === "v") {
        setActiveTool("pointer");
        setOpenFlyout(null);
      } else if (e.key.toLowerCase() === "p") {
        setActiveTool("brush");
        setOpenFlyout("pen");
      } else if (e.key.toLowerCase() === "u") {
        setActiveTool("shapes");
        setOpenFlyout("shapes");
      } else if (e.key.toLowerCase() === "h") {
        setActiveTool("pan");
        setOpenFlyout(null);
      } else if (e.key.toLowerCase() === "c") {
        setActiveTool("crop");
        setIsRightSidebarOpen(true);
        setIsVisibilityOpen(true);
        setOpenFlyout(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, marqueeBox, selectResizeBox, selectResizeSnapshot, handleCloneArea, handleSaveMarqueeAsAsset, handleUndo, handleRedo, handleDeleteSelected, onResendToCrop, activeSlice, activeIdx, onClose, activeTool]);

  // Helper to calculate exact mouse position inside image stage
  const getStageCoords = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!stageRef.current) return { x: 0, y: 0 };
      const rect = stageRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left) / zoomLevel;
      const rawY = (e.clientY - rect.top) / zoomLevel;
      return {
        x: Math.round(Math.max(0, Math.min(imgNaturalSize.width, rawX))),
        y: Math.round(Math.max(0, Math.min(imgNaturalSize.height, rawY))),
      };
    },
    [zoomLevel, imgNaturalSize]
  );

  // Helper to calculate unconstrained mouse position inside image stage for resize handles
  const getUnconstrainedStageCoords = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!stageRef.current) return { x: 0, y: 0 };
      const rect = stageRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left) / zoomLevel;
      const rawY = (e.clientY - rect.top) / zoomLevel;
      return {
        x: Math.round(rawX),
        y: Math.round(rawY),
      };
    },
    [zoomLevel]
  );

  // Add Shape Layer directly onto stage
  const handleAddShapePreset = (
    presetKey:
      | "line"
      | "arrow"
      | "curvedArrow"
      | "curvedArrowLeft"
      | "doubleArrow"
      | "tripleArrow"
      | "rect_outline"
      | "rect_filled"
      | "circle_outline"
      | "circle_filled"
      | "star"
      | "bubble"
      | "pointer"
  ) => {
    pushHistory();
    const newId = `shape_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const centerX = Math.round(imgNaturalSize.width / 2 - 100);
    const centerY = Math.round(imgNaturalSize.height / 2 - 60);

    let newLayer: ShapeLayer = {
      id: newId,
      name: `Layer ${currentLayers.length + 1}`,
      type: "rect",
      x: centerX,
      y: centerY,
      width: 200,
      height: 120,
      rotation: 0,
      opacity: 1,
      zIndex: currentLayers.length + 1,
      fillColor: fillColor !== "transparent" ? fillColor : "#3b82f6",
      strokeColor: strokeColor,
      strokeWidth: strokeWidth || 3,
      borderRadius: borderRadius,
      lineStyle: "solid",
      visible: true,
      locked: false,
    };

    switch (presetKey) {
      case "line":
        newLayer.type = "line";
        newLayer.height = 10;
        newLayer.strokeColor = strokeColor || "#10b981";
        newLayer.strokeWidth = 4;
        newLayer.fillColor = "transparent";
        break;
      case "arrow":
        newLayer.type = "arrow";
        newLayer.height = 20;
        newLayer.strokeColor = strokeColor || "#10b981";
        newLayer.fillColor = strokeColor || "#10b981";
        break;
      case "curvedArrow":
        newLayer.type = "curvedArrow";
        newLayer.height = 100;
        newLayer.strokeColor = strokeColor || "#10b981";
        newLayer.fillColor = strokeColor || "#10b981";
        break;
      case "curvedArrowLeft":
        newLayer.type = "curvedArrowLeft";
        newLayer.height = 100;
        newLayer.strokeColor = strokeColor || "#10b981";
        newLayer.fillColor = strokeColor || "#10b981";
        break;
      case "doubleArrow":
        newLayer.type = "doubleArrow";
        newLayer.height = 20;
        newLayer.strokeColor = strokeColor || "#10b981";
        newLayer.fillColor = strokeColor || "#10b981";
        break;
      case "tripleArrow":
        newLayer.type = "tripleArrow";
        newLayer.height = 20;
        newLayer.strokeColor = strokeColor || "#10b981";
        newLayer.fillColor = strokeColor || "#10b981";
        break;
      case "rect_outline":
        newLayer.type = "rect";
        newLayer.fillColor = "transparent";
        newLayer.strokeColor = strokeColor || "#10b981";
        newLayer.strokeWidth = 3;
        break;
      case "rect_filled":
        newLayer.type = "rect";
        newLayer.fillColor = brushColor || "#10b981";
        newLayer.strokeColor = "transparent";
        newLayer.strokeWidth = 0;
        break;
      case "circle_outline":
        newLayer.type = "circle";
        newLayer.width = 140;
        newLayer.height = 140;
        newLayer.fillColor = "transparent";
        newLayer.strokeColor = strokeColor || "#10b981";
        newLayer.strokeWidth = 3;
        break;
      case "circle_filled":
        newLayer.type = "circle";
        newLayer.width = 140;
        newLayer.height = 140;
        newLayer.fillColor = brushColor || "#10b981";
        newLayer.strokeColor = "transparent";
        newLayer.strokeWidth = 0;
        break;
      case "star":
        newLayer.type = "star";
        newLayer.width = 140;
        newLayer.height = 140;
        newLayer.fillColor = "#f59e0b";
        newLayer.strokeColor = "#ffffff";
        newLayer.strokeWidth = 2;
        break;
      case "bubble":
        newLayer.type = "bubble";
        newLayer.width = 220;
        newLayer.height = 110;
        newLayer.fillColor = "#ffffff";
        newLayer.strokeColor = "#000000";
        newLayer.strokeWidth = 2;
        newLayer.text = "Add speech text...";
        newLayer.textColor = "#0f172a";
        newLayer.bubbleTail = { x: 30, y: 150 };
        break;
      case "pointer":
        newLayer.type = "pointer";
        newLayer.width = 100;
        newLayer.height = 100;
        newLayer.fillColor = "#ec4899";
        newLayer.strokeColor = "#ffffff";
        newLayer.strokeWidth = 2;
        break;
    }

    updateActiveFrameData((prev = []) => [...(Array.isArray(prev) ? prev : []), newLayer]);
    setSelectedLayerIds([newId]);
    setActiveTool("pointer");
    setOpenFlyout(null);
  };

  // Render 2D Canvas composite for baking/exporting
  const renderCompositeCanvas = useCallback(
    async (
      imgSrc: string,
      layers: ShapeLayer[],
      lines: FreehandLine[],
      targetWidth: number,
      targetHeight: number,
      bgFillColor?: string
    ): Promise<string> => {
      return new Promise(async (resolve) => {
        // Pre-load layer images if any
        const loadedImages: Record<string, HTMLImageElement> = {};
        for (const l of layers) {
          if (l.type === "image" && l.imageUrl) {
            await new Promise<void>((res) => {
              const img = new Image();
              if (l.imageUrl && (l.imageUrl.startsWith("http://") || l.imageUrl.startsWith("https://"))) {
                img.crossOrigin = "anonymous";
              }
              img.onload = () => {
                loadedImages[l.id] = img;
                res();
              };
              img.onerror = () => res();
              img.src = l.imageUrl!;
            });
          }
        }

        const img = new Image();
        if (imgSrc.startsWith("http://") || imgSrc.startsWith("https://")) {
          img.crossOrigin = "anonymous";
        }
        img.onload = () => {
          const actualW = targetWidth || img.naturalWidth || img.width;
          const actualH = targetHeight || img.naturalHeight || img.height;
          const canvas = document.createElement("canvas");
          canvas.width = actualW;
          canvas.height = actualH;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(imgSrc);
            return;
          }

          // Draw full frame background fill color if present
          if (bgFillColor) {
            ctx.fillStyle = bgFillColor;
            ctx.fillRect(0, 0, actualW, actualH);
          }

          // Draw base image
          ctx.drawImage(img, 0, 0, actualW, actualH);

          // Render Freehand Lines
          if (showFreehandLines) {
            lines.forEach((line) => {
              if (line.points.length < 2) return;
              ctx.save();

              if (line.isBlur) {
                // Genuine canvas blur mask trick with pressure support!
                const scratchCanvas = document.createElement("canvas");
                scratchCanvas.width = canvas.width;
                scratchCanvas.height = canvas.height;
                const scratchCtx = scratchCanvas.getContext("2d");
                if (scratchCtx) {
                  const pressureRatio = (line.blurPressure ?? 50) / 100;
                  const blurRadius = Math.max(2, Math.round(pressureRatio * Math.max(6, line.width / 2.5)));
                  // Draw blurred version of current canvas content
                  scratchCtx.filter = `blur(${blurRadius}px)`;
                  scratchCtx.drawImage(canvas, 0, 0);

                  // Keep only where the line path is stroked
                  scratchCtx.globalCompositeOperation = "destination-in";
                  scratchCtx.beginPath();
                  scratchCtx.lineCap = "round";
                  scratchCtx.lineJoin = "round";
                  scratchCtx.lineWidth = line.width;
                  scratchCtx.strokeStyle = "black";
                  scratchCtx.moveTo(line.points[0].x, line.points[0].y);
                  for (let i = 1; i < line.points.length; i++) {
                    scratchCtx.lineTo(line.points[i].x, line.points[i].y);
                  }
                  scratchCtx.stroke();
                }

                // Draw blurred path back to main canvas with proportional alpha
                const pressureRatio = (line.blurPressure ?? 50) / 100;
                ctx.globalAlpha = Math.min(1, Math.max(0.2, pressureRatio * 1.05));
                ctx.drawImage(scratchCanvas, 0, 0);
                ctx.restore();
                return;
              }

              if (line.penShape && line.penShape !== "standard") {
                const step = Math.max(14, line.width * 2.5);
                const pts: { x: number; y: number }[] = [];
                if (line.points.length > 0) {
                  pts.push(line.points[0]);
                  let acc = 0;
                  for (let i = 1; i < line.points.length; i++) {
                    const p1 = line.points[i - 1];
                    const p2 = line.points[i];
                    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                    if (dist === 0) continue;
                    acc += dist;
                    while (acc >= step) {
                      acc -= step;
                      const ratio = 1 - acc / dist;
                      pts.push({ x: p1.x + (p2.x - p1.x) * ratio, y: p1.y + (p2.y - p1.y) * ratio });
                    }
                  }
                }

                ctx.globalAlpha = line.opacity;
                if (line.penShape === "dots") {
                  ctx.fillStyle = line.color;
                  pts.forEach((p) => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, line.width, 0, Math.PI * 2);
                    ctx.fill();
                  });
                } else {
                  const charMap: Record<string, string> = {
                    stars: "⭐",
                    cars: "🚗",
                    hearts: "❤️",
                    sparkles: "✨",
                    arrows: "➔",
                  };
                  const stampChar = charMap[line.penShape] || "⭐";
                  ctx.font = `${Math.max(12, line.width * 3)}px sans-serif`;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  if (line.penShape === "arrows") ctx.fillStyle = line.color;
                  pts.forEach((p) => {
                    ctx.fillText(stampChar, p.x, p.y);
                  });
                }
                ctx.restore();
                return;
              }

              ctx.beginPath();
              ctx.strokeStyle = line.color;
              ctx.lineWidth = line.width;
              ctx.globalAlpha = line.opacity;
              ctx.lineCap = "round";
              ctx.lineJoin = "round";
              if (line.isSmudge) {
                ctx.filter = "blur(6px)";
              }

              ctx.moveTo(line.points[0].x, line.points[0].y);
              for (let i = 1; i < line.points.length; i++) {
                ctx.lineTo(line.points[i].x, line.points[i].y);
              }
              ctx.stroke();

              if (line.arrowEnd && line.points.length >= 2) {
                const pEnd = line.points[line.points.length - 1];
                const pPrev = line.points[line.points.length - 2];
                const angle = Math.atan2(pEnd.y - pPrev.y, pEnd.x - pPrev.x);
                const headLen = Math.max(12, line.width * 3.5);
                ctx.save();
                ctx.beginPath();
                ctx.fillStyle = line.color;
                ctx.globalAlpha = line.opacity;
                ctx.moveTo(pEnd.x, pEnd.y);
                ctx.lineTo(
                  pEnd.x - headLen * Math.cos(angle - Math.PI / 6),
                  pEnd.y - headLen * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                  pEnd.x - headLen * Math.cos(angle + Math.PI / 6),
                  pEnd.y - headLen * Math.sin(angle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fill();
                ctx.restore();
              }

              ctx.restore();
            });
          }

          // Render Shape Layers with exact user positioning and CSS box-sizing alignment
          if (showShapeLayers) {
            const sortedLayers = [...layers]
              .filter((l) => l.visible !== false)
              .sort((a, b) => a.zIndex - b.zIndex);

            sortedLayers.forEach((layer) => {
              ctx.save();
              const centerX = layer.x + layer.width / 2;
              const centerY = layer.y + layer.height / 2;
              ctx.translate(centerX, centerY);
              if (layer.rotation) ctx.rotate((layer.rotation * Math.PI) / 180);
              if (layer.skewX || layer.skewY) {
                const tanX = Math.tan(((layer.skewX || 0) * Math.PI) / 180);
                const tanY = Math.tan(((layer.skewY || 0) * Math.PI) / 180);
                ctx.transform(1, tanY, tanX, 1, 0, 0);
              }
              ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1;

              const halfW = layer.width / 2;
              const halfH = layer.height / 2;

              if (layer.lineStyle === "dashed") ctx.setLineDash([8, 6]);
              else if (layer.lineStyle === "dotted") ctx.setLineDash([3, 4]);
              else ctx.setLineDash([]);

              ctx.fillStyle = layer.fillColor || "transparent";
              ctx.strokeStyle = layer.strokeColor || "transparent";
              ctx.lineWidth = layer.strokeWidth || 0;

              const sw = (layer.strokeWidth && layer.strokeColor && layer.strokeColor !== "transparent" && layer.strokeColor !== "none") ? layer.strokeWidth : 0;
              const hasFill = layer.fillColor && layer.fillColor !== "transparent" && layer.fillColor !== "none";

              switch (layer.type) {
                case "image":
                  if (loadedImages[layer.id]) {
                    ctx.drawImage(loadedImages[layer.id], -halfW, -halfH, layer.width, layer.height);
                  }
                  if (sw > 0) {
                    ctx.beginPath();
                    const inset = sw / 2;
                    ctx.rect(-halfW + inset, -halfH + inset, layer.width - sw, layer.height - sw);
                    ctx.stroke();
                  }
                  break;

                case "rect": {
                  const r = layer.borderRadius ?? 0;
                  if (hasFill) {
                    ctx.beginPath();
                    if (typeof ctx.roundRect === "function" && r > 0) {
                      ctx.roundRect(-halfW, -halfH, layer.width, layer.height, r);
                    } else {
                      ctx.rect(-halfW, -halfH, layer.width, layer.height);
                    }
                    ctx.fill();
                  }
                  if (sw > 0) {
                    ctx.beginPath();
                    const inset = sw / 2;
                    const innerR = Math.max(0, r - inset);
                    if (typeof ctx.roundRect === "function" && innerR > 0) {
                      ctx.roundRect(-halfW + inset, -halfH + inset, layer.width - sw, layer.height - sw, innerR);
                    } else {
                      ctx.rect(-halfW + inset, -halfH + inset, layer.width - sw, layer.height - sw);
                    }
                    ctx.stroke();
                  }
                  break;
                }

                case "circle": {
                  if (hasFill) {
                    ctx.beginPath();
                    ctx.ellipse(0, 0, halfW, halfH, 0, 0, 2 * Math.PI);
                    ctx.fill();
                  }
                  if (sw > 0) {
                    ctx.beginPath();
                    const inset = sw / 2;
                    ctx.ellipse(0, 0, Math.max(0.1, halfW - inset), Math.max(0.1, halfH - inset), 0, 0, 2 * Math.PI);
                    ctx.stroke();
                  }
                  break;
                }

                case "line": {
                  const lw = layer.strokeWidth || 4;
                  ctx.lineWidth = lw;
                  ctx.beginPath();
                  ctx.moveTo(-halfW, 0);
                  ctx.lineTo(halfW, 0);
                  ctx.stroke();
                  break;
                }

                case "arrow": {
                  const lw = layer.strokeWidth || 3;
                  ctx.lineWidth = lw;
                  ctx.strokeStyle = layer.strokeColor || "#10b981";
                  ctx.fillStyle = layer.strokeColor || "#10b981";
                  ctx.beginPath();
                  ctx.moveTo(-halfW, 0);
                  ctx.lineTo(halfW - 16, 0);
                  ctx.stroke();
                  // Arrow Head matching DOM border-l-[16px] border-y-8
                  ctx.beginPath();
                  ctx.moveTo(halfW, 0);
                  ctx.lineTo(halfW - 16, -8);
                  ctx.lineTo(halfW - 16, 8);
                  ctx.closePath();
                  ctx.fill();
                  break;
                }

                case "curvedArrow": {
                  ctx.lineWidth = layer.strokeWidth || 3;
                  ctx.strokeStyle = layer.strokeColor || "#10b981";
                  ctx.fillStyle = layer.strokeColor || "#10b981";
                  ctx.beginPath();
                  ctx.moveTo(-halfW, halfH);
                  ctx.quadraticCurveTo(0, -halfH, halfW - 20, -halfH + 20);
                  ctx.stroke();
                  // Arrow Head
                  ctx.beginPath();
                  ctx.moveTo(halfW, -halfH + 20);
                  ctx.lineTo(halfW - 15, -halfH + 10);
                  ctx.lineTo(halfW - 10, -halfH + 28);
                  ctx.closePath();
                  ctx.fill();
                  break;
                }

                case "curvedArrowLeft": {
                  ctx.lineWidth = layer.strokeWidth || 3;
                  ctx.strokeStyle = layer.strokeColor || "#10b981";
                  ctx.fillStyle = layer.strokeColor || "#10b981";
                  ctx.beginPath();
                  ctx.moveTo(halfW, halfH);
                  ctx.quadraticCurveTo(0, -halfH, -halfW + 20, -halfH + 20);
                  ctx.stroke();
                  // Arrow Head on left
                  ctx.beginPath();
                  ctx.moveTo(-halfW, -halfH + 20);
                  ctx.lineTo(-halfW + 15, -halfH + 10);
                  ctx.lineTo(-halfW + 10, -halfH + 28);
                  ctx.closePath();
                  ctx.fill();
                  break;
                }

                case "doubleArrow": {
                  ctx.lineWidth = layer.strokeWidth || 3;
                  ctx.strokeStyle = layer.strokeColor || "#10b981";
                  ctx.fillStyle = layer.strokeColor || "#10b981";
                  ctx.beginPath();
                  ctx.moveTo(-halfW + 16, 0);
                  ctx.lineTo(halfW - 16, 0);
                  ctx.stroke();
                  // Left Head
                  ctx.beginPath();
                  ctx.moveTo(-halfW, 0);
                  ctx.lineTo(-halfW + 18, -8);
                  ctx.lineTo(-halfW + 18, 8);
                  ctx.closePath();
                  ctx.fill();
                  // Right Head
                  ctx.beginPath();
                  ctx.moveTo(halfW, 0);
                  ctx.lineTo(halfW - 18, -8);
                  ctx.lineTo(halfW - 18, 8);
                  ctx.closePath();
                  ctx.fill();
                  break;
                }

                case "tripleArrow": {
                  ctx.lineWidth = layer.strokeWidth || 3;
                  ctx.strokeStyle = layer.strokeColor || "#10b981";
                  ctx.fillStyle = layer.strokeColor || "#10b981";
                  const spacing = layer.width / 3;
                  for (let i = 0; i < 3; i++) {
                    const cx = -halfW + i * spacing + spacing / 2;
                    const aw = spacing - 8;
                    ctx.beginPath();
                    ctx.moveTo(cx - aw / 2, 0);
                    ctx.lineTo(cx + aw / 2 - 12, 0);
                    ctx.stroke();
                    // Arrow Head
                    ctx.beginPath();
                    ctx.moveTo(cx + aw / 2, 0);
                    ctx.lineTo(cx + aw / 2 - 14, -7);
                    ctx.lineTo(cx + aw / 2 - 14, 7);
                    ctx.closePath();
                    ctx.fill();
                  }
                  break;
                }

                case "star": {
                  ctx.beginPath();
                  const numPoints = 5;
                  const outerR = Math.min(halfW, halfH);
                  const innerR = outerR * 0.4;
                  for (let i = 0; i < numPoints * 2; i++) {
                    const r = i % 2 === 0 ? outerR : innerR;
                    const angle = (i * Math.PI) / numPoints - Math.PI / 2;
                    const px = r * Math.cos(angle);
                    const py = r * Math.sin(angle);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                  }
                  ctx.closePath();
                  if (hasFill) {
                    ctx.fill();
                  }
                  if (sw > 0) {
                    ctx.stroke();
                  }
                  break;
                }

                case "bubble": {
                  const r = 16;
                  if (hasFill) {
                    ctx.beginPath();
                    if (typeof ctx.roundRect === "function") {
                      ctx.roundRect(-halfW, -halfH, layer.width, layer.height, r);
                    } else {
                      ctx.rect(-halfW, -halfH, layer.width, layer.height);
                    }
                    ctx.fill();
                  }

                  if (sw > 0) {
                    ctx.beginPath();
                    const inset = sw / 2;
                    if (typeof ctx.roundRect === "function") {
                      ctx.roundRect(-halfW + inset, -halfH + inset, layer.width - sw, layer.height - sw, Math.max(0, r - inset));
                    } else {
                      ctx.rect(-halfW + inset, -halfH + inset, layer.width - sw, layer.height - sw);
                    }
                    ctx.stroke();
                  }

                  // Bubble Tail
                  if (layer.bubbleTail) {
                    ctx.save();
                    const tailX = layer.bubbleTail.x - centerX;
                    const tailY = layer.bubbleTail.y - centerY;
                    ctx.beginPath();
                    ctx.moveTo(-halfW + 30, halfH - 2);
                    ctx.lineTo(tailX, tailY);
                    ctx.lineTo(-halfW + 60, halfH - 2);
                    ctx.closePath();
                    if (hasFill) {
                      ctx.fillStyle = layer.fillColor;
                      ctx.fill();
                    }
                    if (sw > 0) {
                      ctx.stroke();
                    }
                    ctx.restore();
                  }

                  if (layer.text) {
                    ctx.fillStyle = layer.textColor || "#0f172a";
                    const fontStyle = `${layer.isItalic ? "italic " : ""}${
                      layer.isBold ? "bold " : ""
                    }${layer.fontSize || 18}px ${layer.fontFamily || FONT_FAMILIES[0]}`;
                    ctx.font = fontStyle;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(layer.text, 0, 0);
                  }
                  break;
                }

                case "text":
                  if (layer.text) {
                    ctx.fillStyle = layer.textColor || "#ffffff";
                    const fontStyle = `${layer.isItalic ? "italic " : ""}${
                      layer.isBold ? "bold " : ""
                    }${layer.fontSize || 24}px ${layer.fontFamily || FONT_FAMILIES[0]}`;
                    ctx.font = fontStyle;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(layer.text, 0, 0);
                  }
                  break;
              }

              ctx.restore();
            });
          }

          resolve(canvas.toDataURL("image/png"));
        };

        img.onerror = () => resolve(imgSrc);
        img.src = imgSrc;
      });
    },
    [showFreehandLines, showShapeLayers]
  );

  // Select & Resize Area Tool Handlers
  const captureSelectResizeArea = useCallback(
    async (box: { x: number; y: number; width: number; height: number }) => {
      if (!activeSlice?.url) return;
      if (box.width < 5 || box.height < 5) {
        setSelectResizeBox(null);
        setSelectResizeSnapshot(null);
        return;
      }

      try {
        const sourceImage =
          currentLayers.length > 0 || currentFreehandLines.length > 0 || frameData[activeIdx]?.bgFillColor
            ? await renderCompositeCanvas(
                activeSlice.url,
                currentLayers,
                currentFreehandLines,
                imgNaturalSize.width,
                imgNaturalSize.height,
                frameData[activeIdx]?.bgFillColor
              )
            : activeSlice.url;

        const croppedUrl = await getCroppedImg(
          sourceImage,
          {
            unit: "px",
            x: Math.round(box.x),
            y: Math.round(box.y),
            width: Math.round(box.width),
            height: Math.round(box.height),
          },
          "image/png"
        );

        if (!croppedUrl) throw new Error("Could not crop selection area");

        const normalizedBox = {
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
        };

        setSelectResizeSnapshot({
          originalBox: { ...normalizedBox },
          imageUrl: croppedUrl,
        });
        setSelectResizeBox({ ...normalizedBox });
        setToastNotice("✓ Area selected! Drag handles to stretch & resize over the image.");
        setTimeout(() => setToastNotice(null), 3000);
      } catch (err) {
        console.error("Failed to capture area for select and resize:", err);
        setToastNotice("Failed to select area");
        setTimeout(() => setToastNotice(null), 2500);
        setSelectResizeBox(null);
        setSelectResizeSnapshot(null);
      }
    },
    [activeSlice, currentLayers, currentFreehandLines, frameData, activeIdx, imgNaturalSize, renderCompositeCanvas]
  );

  const handleStampSelectResize = useCallback(async () => {
    if (!activeSlice?.url || !selectResizeBox || !selectResizeSnapshot) return;

    try {
      pushHistory();

      const canvas = document.createElement("canvas");
      canvas.width = imgNaturalSize.width;
      canvas.height = imgNaturalSize.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get 2d context");

      // 1. Draw base image
      const baseImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = activeSlice.url;
      });
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

      // If user chose to cut / clear the original hole before stretching over
      if (selectResizeClearOriginal) {
        const ob = selectResizeSnapshot.originalBox;
        ctx.clearRect(ob.x, ob.y, ob.width, ob.height);
        if (frameData[activeIdx]?.bgFillColor) {
          ctx.fillStyle = frameData[activeIdx]?.bgFillColor || "#ffffff";
          ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
        }
      }

      // 2. Draw stretched patch image at current box position & size
      const patchImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = selectResizeSnapshot.imageUrl;
      });

      ctx.save();
      ctx.globalAlpha = selectResizeOpacity;
      ctx.drawImage(
        patchImg,
        selectResizeBox.x,
        selectResizeBox.y,
        selectResizeBox.width,
        selectResizeBox.height
      );
      ctx.restore();

      const bakedUrl = canvas.toDataURL("image/png");
      onUpdateSliceUrl(activeIdx, bakedUrl);
      setSelectResizeBox(null);
      setSelectResizeSnapshot(null);
      setToastNotice("✓ Stretched area stamped onto underlying image!");
      setTimeout(() => setToastNotice(null), 2500);
    } catch (err) {
      console.error("Failed to stamp stretched area:", err);
      setToastNotice("Failed to stamp stretched area");
      setTimeout(() => setToastNotice(null), 2500);
    }
  }, [
    activeSlice,
    selectResizeBox,
    selectResizeSnapshot,
    selectResizeOpacity,
    selectResizeClearOriginal,
    imgNaturalSize,
    frameData,
    activeIdx,
    pushHistory,
    onUpdateSliceUrl,
  ]);

  const handleConvertSelectResizeToLayer = useCallback(() => {
    if (!selectResizeBox || !selectResizeSnapshot) return;
    pushHistory();

    const newLayer: ShapeLayer = {
      id: `layer_${Date.now()}`,
      name: "Stretched Patch",
      type: "image",
      x: selectResizeBox.x,
      y: selectResizeBox.y,
      width: selectResizeBox.width,
      height: selectResizeBox.height,
      imageUrl: selectResizeSnapshot.imageUrl,
      rotation: 0,
      opacity: selectResizeOpacity,
      zIndex: (currentLayers.length || 0) + 1,
      strokeColor: "#000000",
      strokeWidth: 0,
      fillColor: "transparent",
      lineStyle: "solid",
      visible: true,
      locked: false,
      skewX: 0,
      skewY: 0,
    };

    updateActiveFrameData((prev = []) => [...(Array.isArray(prev) ? prev : []), newLayer]);
    setSelectedLayerIds([newLayer.id]);
    setSelectResizeBox(null);
    setSelectResizeSnapshot(null);
    setActiveTool("pointer");
    setToastNotice("✓ Stretched area added as movable layer!");
    setTimeout(() => setToastNotice(null), 2500);
  }, [selectResizeBox, selectResizeSnapshot, selectResizeOpacity, currentLayers, pushHistory, updateActiveFrameData]);

  const handleResetSelectResize = useCallback(() => {
    if (selectResizeSnapshot) {
      setSelectResizeBox({ ...selectResizeSnapshot.originalBox });
    }
  }, [selectResizeSnapshot]);

  const handleCancelSelectResize = useCallback(() => {
    setSelectResizeBox(null);
    setSelectResizeSnapshot(null);
  }, []);

  // Pen Tool / Lasso transparent PNG cutout helper
  const handlePenCutout = async (target: "layer" | "download" | "storyboard") => {
    if (penPoints.length < 3 || !activeSlice?.url) return;
    try {
      const xs = penPoints.map((p) => p.x);
      const ys = penPoints.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const width = maxX - minX;
      const height = maxY - minY;

      if (width < 2 || height < 2) return;

      const img = new Image();
      if (activeSlice.url.startsWith("http://") || activeSlice.url.startsWith("https://")) {
        img.crossOrigin = "anonymous";
      }

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = activeSlice.url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(penPoints[0].x - minX, penPoints[0].y - minY);
      for (let i = 1; i < penPoints.length; i++) {
        ctx.lineTo(penPoints[i].x - minX, penPoints[i].y - minY);
      }
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(img, minX, minY, width, height, 0, 0, width, height);
      const croppedUrl = canvas.toDataURL("image/png");

      if (target === "layer") {
        pushHistory();
        const newLayer: ShapeLayer = {
          id: `layer_pen_${Date.now()}`,
          name: "Pen Cutout",
          type: "image",
          x: minX,
          y: minY,
          width: width,
          height: height,
          imageUrl: croppedUrl,
          rotation: 0,
          opacity: 1,
          zIndex: (currentLayers.length || 0) + 1,
          strokeColor: "#000000",
          strokeWidth: 0,
          fillColor: "transparent",
          lineStyle: "solid",
          visible: true,
          locked: false,
          skewX: 0,
          skewY: 0,
        };
        updateActiveFrameData((prev = []) => [...(Array.isArray(prev) ? prev : []), newLayer]);
        setSelectedLayerIds([newLayer.id]);
        setToastNotice("✓ PNG Cutout added as a new canvas layer!");
      } else if (target === "download") {
        const link = document.createElement("a");
        link.download = `character-cutout-${Date.now()}.png`;
        link.href = croppedUrl;
        link.click();
        setToastNotice("✓ Transparent PNG cutout downloaded!");
      } else if (target === "storyboard") {
        if (onUpdateSliceUrl && activeIdx !== null && activeIdx !== undefined) {
          onUpdateSliceUrl(activeIdx, croppedUrl);
          setToastNotice("✓ Storyboard frame replaced with transparent cutout!");
        } else {
          setToastNotice("Unable to find active storyboard frame context.");
        }
      }

      setPenPoints([]);
      setIsPenClosed(false);
      setActiveTool("pointer");
      setTimeout(() => setToastNotice(null), 2500);
    } catch (err: any) {
      console.error(err);
      setToastNotice(`Cutout failed: ${err.message || err}`);
      setTimeout(() => setToastNotice(null), 3000);
    }
  };

  // Polygon Selection Clone Helper
  const handlePolygonClone = async () => {
    if (polygonPoints.length < 3 || !activeSlice?.url) return;
    try {
      const xs = polygonPoints.map((p) => p.x);
      const ys = polygonPoints.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const width = maxX - minX;
      const height = maxY - minY;

      if (width < 2 || height < 2) return;

      const img = new Image();
      if (activeSlice.url.startsWith("http://") || activeSlice.url.startsWith("https://")) {
        img.crossOrigin = "anonymous";
      }

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = activeSlice.url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(polygonPoints[0].x - minX, polygonPoints[0].y - minY);
      for (let i = 1; i < polygonPoints.length; i++) {
        ctx.lineTo(polygonPoints[i].x - minX, polygonPoints[i].y - minY);
      }
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(img, minX, minY, width, height, 0, 0, width, height);
      const croppedUrl = canvas.toDataURL("image/png");

      pushHistory();

      const newLayer: ShapeLayer = {
        id: `layer_polygon_${Date.now()}`,
        name: "Polygon Cutout",
        type: "image",
        x: minX,
        y: minY,
        width: width,
        height: height,
        imageUrl: croppedUrl,
        rotation: 0,
        opacity: 1,
        zIndex: (currentLayers.length || 0) + 1,
        strokeColor: "#000000",
        strokeWidth: 0,
        fillColor: "transparent",
        lineStyle: "solid",
        visible: true,
        locked: false,
        skewX: 0,
        skewY: 0,
      };

      updateActiveFrameData((prev = []) => [...(Array.isArray(prev) ? prev : []), newLayer]);
      setSelectedLayerIds([newLayer.id]);
      setPolygonPoints([]);
      setIsPolygonClosed(false);
      setActiveTool("pointer");
      setToastNotice("✓ Cloned polygon area as a new layer!");
      setTimeout(() => setToastNotice(null), 2500);
    } catch (err) {
      console.error("Failed to crop polygon area:", err);
      setToastNotice("Failed to clone polygon area");
      setTimeout(() => setToastNotice(null), 2500);
    }
  };

  // Patch Tool Apply Helper
  const handleApplyPatch = async () => {
    if (!patchSourceBox || !patchDestBox || !activeSlice?.url) return;
    try {
      const croppedUrl = await getCroppedImg(
        activeSlice.url,
        {
          unit: "px",
          x: patchDestBox.x,
          y: patchDestBox.y,
          width: patchDestBox.width,
          height: patchDestBox.height,
        },
        "image/png"
      );

      if (!croppedUrl) return;

      pushHistory();

      const newLayer: ShapeLayer = {
        id: `layer_patch_${Date.now()}`,
        name: "Patch Stamp",
        type: "image",
        x: patchSourceBox.x,
        y: patchSourceBox.y,
        width: patchSourceBox.width,
        height: patchSourceBox.height,
        imageUrl: croppedUrl,
        rotation: 0,
        opacity: 1,
        zIndex: (currentLayers.length || 0) + 1,
        strokeColor: "#000000",
        strokeWidth: 0,
        fillColor: "transparent",
        lineStyle: "solid",
        visible: true,
        locked: false,
        skewX: 0,
        skewY: 0,
      };

      updateActiveFrameData((prev = []) => [...(Array.isArray(prev) ? prev : []), newLayer]);
      setSelectedLayerIds([newLayer.id]);
      setPatchSourceBox(null);
      setPatchDestBox(null);
      setActiveTool("pointer");
      setToastNotice("✓ Applied patch clone successfully!");
      setTimeout(() => setToastNotice(null), 2500);
    } catch (err) {
      console.error("Failed to apply patch:", err);
      setToastNotice("Failed to apply patch");
      setTimeout(() => setToastNotice(null), 2500);
    }
  };

  // Canvas Size Handler
  const handleApplyCanvasSize = async () => {
    if (!activeSlice?.url) return;
    const finalWidth = Math.max(1, canvasRelative ? (imgNaturalSize.width + canvasWidthOffset) : canvasWidthInput);
    const finalHeight = Math.max(1, canvasRelative ? (imgNaturalSize.height + canvasHeightOffset) : canvasHeightInput);

    const oldWidth = imgNaturalSize.width;
    const oldHeight = imgNaturalSize.height;

    let xOffset = 0;
    let yOffset = 0;

    // canvasAnchor values: 0-8 row-major:
    // Row 0: 0 (top-left), 1 (top-center), 2 (top-right)
    // Row 1: 3 (middle-left), 4 (middle-center), 5 (middle-right)
    // Row 2: 6 (bottom-left), 7 (bottom-center), 8 (bottom-right)

    // X offsets:
    if ([1, 4, 7].includes(canvasAnchor)) {
      xOffset = Math.round((finalWidth - oldWidth) / 2);
    } else if ([2, 5, 8].includes(canvasAnchor)) {
      xOffset = finalWidth - oldWidth;
    }

    // Y offsets:
    if ([3, 4, 5].includes(canvasAnchor)) {
      yOffset = Math.round((finalHeight - oldHeight) / 2);
    } else if ([6, 7, 8].includes(canvasAnchor)) {
      yOffset = finalHeight - oldHeight;
    }

    const img = new Image();
    if (activeSlice.url.startsWith("http://") || activeSlice.url.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fill background color
      if (canvasExtensionColorType === "white") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, finalWidth, finalHeight);
      } else if (canvasExtensionColorType === "black") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, finalWidth, finalHeight);
      } else if (canvasExtensionColorType === "custom") {
        ctx.fillStyle = canvasExtensionCustomColor;
        ctx.fillRect(0, 0, finalWidth, finalHeight);
      } else {
        // Transparent default, do nothing or clearRect (which is transparent by default)
        ctx.clearRect(0, 0, finalWidth, finalHeight);
      }

      // Draw original image on the new canvas at the calculated offset
      ctx.drawImage(img, xOffset, yOffset);

      try {
        const resizedUrl = canvas.toDataURL("image/png");

        pushHistory();

        // Reposition layers
        const newLayers = currentLayers.map((layer) => ({
          ...layer,
          x: layer.x + xOffset,
          y: layer.y + yOffset,
        }));

        // Reposition freehand lines
        const newLines = currentFreehandLines.map((line) => ({
          ...line,
          points: line.points.map((p) => ({
            x: p.x + xOffset,
            y: p.y + yOffset,
          })),
        }));

        updateActiveFrameData(newLayers, newLines);
        onUpdateSliceUrl(activeIdx, resizedUrl);

        // Reset relative offsets
        if (canvasRelative) {
          setCanvasWidthOffset(0);
          setCanvasHeightOffset(0);
        }

        // Re-open main retouch panel after apply
        setIsAdvancedPanelOpen(true);
        setActiveTool("sprayCan");
        setToastNotice("✓ Canvas resized successfully!");
        setTimeout(() => setToastNotice(null), 2500);
      } catch (err) {
        console.error("Failed to resize canvas:", err);
        setToastNotice("Failed to resize canvas");
        setTimeout(() => setToastNotice(null), 2500);
      }
    };
    img.onerror = () => {
      setToastNotice("Failed to load source image for resize");
      setTimeout(() => setToastNotice(null), 2500);
    };
    img.src = activeSlice.url;
  };

  // Chroma Key Background Removal
  const pickColorFromImage = (x: number, y: number) => {
    if (!activeSlice?.url) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = imgNaturalSize.width || img.width;
      canvas.height = imgNaturalSize.height || img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const pixel = ctx.getImageData(
          Math.min(canvas.width - 1, Math.max(0, x)),
          Math.min(canvas.height - 1, Math.max(0, y)),
          1,
          1
        ).data;
        const r = pixel[0];
        const g = pixel[1];
        const b = pixel[2];
        const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        setChromaKeyColor(hex);
        setToastNotice(`Selected Key Color: ${hex}`);
        setTimeout(() => setToastNotice(null), 2000);
      }
    };
    img.src = activeSlice.url;
  };

  const handleApplyChromaKey = async () => {
    if (!activeSlice?.url) return;
    
    setToastNotice("Processing Chroma Key background removal...");
    
    let tr = 0, tg = 255, tb = 0;
    const hex = chromaKeyColor.replace("#", "");
    if (hex.length === 6) {
      tr = parseInt(hex.substring(0, 2), 16);
      tg = parseInt(hex.substring(2, 4), 16);
      tb = parseInt(hex.substring(4, 6), 16);
    } else if (hex.length === 3) {
      tr = parseInt(hex.charAt(0) + hex.charAt(0), 16);
      tg = parseInt(hex.charAt(1) + hex.charAt(1), 16);
      tb = parseInt(hex.charAt(2) + hex.charAt(2), 16);
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setToastNotice("Failed to initialize canvas context");
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        const maxDist = (chromaKeyTolerance / 100) * 442;
        const smoothnessRange = (chromaKeySmoothness / 100) * 442;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a === 0) continue;

          const rDiff = r - tr;
          const gDiff = g - tg;
          const bDiff = b - tb;
          const distance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);

          if (distance < maxDist - smoothnessRange) {
            data[i + 3] = 0;
          } else if (distance < maxDist) {
            if (smoothnessRange > 0) {
              const ratio = (distance - (maxDist - smoothnessRange)) / smoothnessRange;
              data[i + 3] = Math.min(a, Math.round(ratio * a));
            } else {
              data[i + 3] = 0;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const processedUrl = canvas.toDataURL("image/png");
        
        onUpdateSliceUrl(activeIdx, processedUrl);
        setToastNotice("✓ Chroma Key Applied!");
        setTimeout(() => setToastNotice(null), 3000);
      } catch (err) {
        console.error("Chroma key execution error:", err);
        setToastNotice("Error executing Chroma Key");
      }
    };
    img.onerror = () => {
      setToastNotice("Failed to load source image");
    };
    img.src = activeSlice.url;
  };

  // Magic Selection Wand Execution Handler
  const executeMagicWandSelection = async (clickX: number, clickY: number) => {
    if (!activeSlice?.url) return;
    setIsProcessingWand(true);
    setToastNotice("Magic Wand: Analyzing region...");

    try {
      const img = new Image();
      if (activeSlice.url.startsWith("http://") || activeSlice.url.startsWith("https://")) {
        img.crossOrigin = "anonymous";
      }

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image for selection"));
        img.src = activeSlice.url;
      });

      const width = imgNaturalSize.width || img.naturalWidth || img.width;
      const height = imgNaturalSize.height || img.naturalHeight || img.height;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        setIsProcessingWand(false);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      const startX = Math.floor(Math.min(width - 1, Math.max(0, clickX)));
      const startY = Math.floor(Math.min(height - 1, Math.max(0, clickY)));
      const seedIdx = (startY * width + startX) * 4;

      const sr = data[seedIdx];
      const sg = data[seedIdx + 1];
      const sb = data[seedIdx + 2];
      const sa = data[seedIdx + 3];

      const sampledHex = "#" + ((1 << 24) + (sr << 16) + (sg << 8) + sb).toString(16).slice(1);
      const maxDistance = (wandTolerance / 100) * 441.67;

      const selectedIndices = new Uint8Array(width * height);
      let pixelCount = 0;
      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;

      const isMatch = (r: number, g: number, b: number, a: number) => {
        if (sa === 0 && a === 0) return true;
        if (sa === 0 || a === 0) {
          return Math.abs(sa - a) <= (wandTolerance / 100) * 255;
        }
        const dr = r - sr;
        const dg = g - sg;
        const db = b - sb;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        return dist <= maxDistance;
      };

      if (wandContiguous) {
        // High-performance BFS flood fill using Int32Array queue
        const queue = new Int32Array(width * height);
        let head = 0;
        let tail = 0;

        queue[tail++] = startY * width + startX;
        selectedIndices[startY * width + startX] = 1;

        while (head < tail) {
          const current = queue[head++];
          const cx = current % width;
          const cy = Math.floor(current / width);

          pixelCount++;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          // 4-neighborhood
          const nUp = cy > 0 ? (cy - 1) * width + cx : -1;
          const nDown = cy < height - 1 ? (cy + 1) * width + cx : -1;
          const nLeft = cx > 0 ? cy * width + (cx - 1) : -1;
          const nRight = cx < width - 1 ? cy * width + (cx + 1) : -1;

          const neighbors = [nUp, nDown, nLeft, nRight];
          for (let i = 0; i < 4; i++) {
            const nIdx = neighbors[i];
            if (nIdx !== -1 && selectedIndices[nIdx] === 0) {
              const byteIdx = nIdx * 4;
              if (isMatch(data[byteIdx], data[byteIdx + 1], data[byteIdx + 2], data[byteIdx + 3])) {
                selectedIndices[nIdx] = 1;
                queue[tail++] = nIdx;
              }
            }
          }
        }
      } else {
        // Global color match across the entire image
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const byteIdx = idx * 4;
            if (isMatch(data[byteIdx], data[byteIdx + 1], data[byteIdx + 2], data[byteIdx + 3])) {
              selectedIndices[idx] = 1;
              pixelCount++;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
      }

      if (pixelCount === 0) {
        setWandSelection(null);
        setIsProcessingWand(false);
        setToastNotice("No matching pixels found");
        setTimeout(() => setToastNotice(null), 2000);
        return;
      }

      // Generate Mask Data URL (for SVG highlight overlay)
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext("2d");
      if (maskCtx) {
        const maskImgData = maskCtx.createImageData(width, height);
        const mData = maskImgData.data;
        for (let i = 0; i < width * height; i++) {
          if (selectedIndices[i] === 1) {
            mData[i * 4] = 99;     // Indigo R
            mData[i * 4 + 1] = 102; // Indigo G
            mData[i * 4 + 2] = 241; // Indigo B
            mData[i * 4 + 3] = 150; // Alpha
          }
        }
        maskCtx.putImageData(maskImgData, 0, 0);
      }
      const maskDataUrl = maskCanvas.toDataURL("image/png");

      // Generate Cutout Data URL (tight bounding box with transparent background)
      const boundW = Math.max(1, maxX - minX + 1);
      const boundH = Math.max(1, maxY - minY + 1);

      const cutoutCanvas = document.createElement("canvas");
      cutoutCanvas.width = boundW;
      cutoutCanvas.height = boundH;
      const cutoutCtx = cutoutCanvas.getContext("2d");
      if (cutoutCtx) {
        const cutoutImgData = cutoutCtx.createImageData(boundW, boundH);
        const cData = cutoutImgData.data;

        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            const srcIdx = y * width + x;
            if (selectedIndices[srcIdx] === 1) {
              const srcByte = srcIdx * 4;
              const dstByte = ((y - minY) * boundW + (x - minX)) * 4;
              cData[dstByte] = data[srcByte];
              cData[dstByte + 1] = data[srcByte + 1];
              cData[dstByte + 2] = data[srcByte + 2];
              cData[dstByte + 3] = data[srcByte + 3];
            }
          }
        }
        cutoutCtx.putImageData(cutoutImgData, 0, 0);
      }
      const cutoutDataUrl = cutoutCanvas.toDataURL("image/png");

      setWandSelection({
        maskDataUrl,
        cutoutDataUrl,
        bounds: { x: minX, y: minY, width: boundW, height: boundH },
        sampledColor: sampledHex,
        pixelCount,
        totalPixels: width * height,
        selectedIndices,
        seedX: startX,
        seedY: startY,
      });

      setIsProcessingWand(false);
      const pct = ((pixelCount / (width * height)) * 100).toFixed(1);
      setToastNotice(`✓ Magic Wand selected ${pixelCount.toLocaleString()} px (${pct}%)`);
      setTimeout(() => setToastNotice(null), 3000);
    } catch (err: any) {
      console.error("Magic wand selection error:", err);
      setIsProcessingWand(false);
      setToastNotice(`Magic Wand error: ${err.message || err}`);
      setTimeout(() => setToastNotice(null), 3000);
    }
  };

  // Magic Wand Action: Copy Selection to New Movable Layer
  const handleWandCopyToLayer = () => {
    if (!wandSelection || !wandSelection.cutoutDataUrl) return;
    pushHistory();
    const newLayer: ShapeLayer = {
      id: `wand_layer_${Date.now()}`,
      name: `Wand Cutout (${wandSelection.sampledColor})`,
      type: "image",
      x: wandSelection.bounds.x,
      y: wandSelection.bounds.y,
      width: wandSelection.bounds.width,
      height: wandSelection.bounds.height,
      imageUrl: wandSelection.cutoutDataUrl,
      rotation: 0,
      opacity: 1,
      zIndex: (currentLayers.length || 0) + 1,
      strokeColor: "#000000",
      strokeWidth: 0,
      fillColor: "transparent",
      lineStyle: "solid",
      visible: true,
      locked: false,
      skewX: 0,
      skewY: 0,
    };
    updateActiveFrameData((prev = []) => [...(Array.isArray(prev) ? prev : []), newLayer]);
    setSelectedLayerIds([newLayer.id]);
    setToastNotice("✓ Selection copied to a new layer!");
    setTimeout(() => setToastNotice(null), 2500);
  };

  // Magic Wand Action: Delete / Erase Selected Pixels from the Image
  const handleWandDeleteSelection = async () => {
    if (!wandSelection || !activeSlice?.url) return;
    try {
      pushHistory();
      const img = new Image();
      if (activeSlice.url.startsWith("http://") || activeSlice.url.startsWith("https://")) {
        img.crossOrigin = "anonymous";
      }
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image for deletion"));
        img.src = activeSlice.url;
      });

      const width = imgNaturalSize.width || img.naturalWidth || img.width;
      const height = imgNaturalSize.height || img.naturalHeight || img.height;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      const indices = wandSelection.selectedIndices;
      for (let i = 0; i < width * height; i++) {
        if (indices[i] === 1) {
          data[i * 4 + 3] = 0; // Transparent
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const updatedUrl = canvas.toDataURL("image/png");
      onUpdateSliceUrl(activeIdx, updatedUrl);
      setWandSelection(null);
      setToastNotice("✓ Selected region deleted from image!");
      setTimeout(() => setToastNotice(null), 2500);
    } catch (err: any) {
      console.error("Magic Wand delete error:", err);
      setToastNotice(`Delete failed: ${err.message || err}`);
      setTimeout(() => setToastNotice(null), 3000);
    }
  };

  // Magic Wand Action: Cut (Copy to Layer + Erase from Image)
  const handleWandCutSelection = async () => {
    if (!wandSelection) return;
    handleWandCopyToLayer();
    await handleWandDeleteSelection();
    setToastNotice("✓ Selection cut & converted to a new layer!");
    setTimeout(() => setToastNotice(null), 2500);
  };

  // Magic Wand Action: Invert Selection
  const handleWandInvertSelection = async () => {
    if (!wandSelection || !activeSlice?.url) return;
    try {
      const img = new Image();
      if (activeSlice.url.startsWith("http://") || activeSlice.url.startsWith("https://")) {
        img.crossOrigin = "anonymous";
      }
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = activeSlice.url;
      });

      const width = imgNaturalSize.width || img.naturalWidth || img.width;
      const height = imgNaturalSize.height || img.naturalHeight || img.height;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      const newIndices = new Uint8Array(width * height);
      let pixelCount = 0;
      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;

      for (let i = 0; i < width * height; i++) {
        if (wandSelection.selectedIndices[i] === 0) {
          newIndices[i] = 1;
          pixelCount++;
          const px = i % width;
          const py = Math.floor(i / width);
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        }
      }

      if (pixelCount === 0) {
        setWandSelection(null);
        return;
      }

      const boundW = Math.max(1, maxX - minX + 1);
      const boundH = Math.max(1, maxY - minY + 1);

      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext("2d");
      if (maskCtx) {
        const maskImgData = maskCtx.createImageData(width, height);
        const mData = maskImgData.data;
        for (let i = 0; i < width * height; i++) {
          if (newIndices[i] === 1) {
            mData[i * 4] = 99;
            mData[i * 4 + 1] = 102;
            mData[i * 4 + 2] = 241;
            mData[i * 4 + 3] = 150;
          }
        }
        maskCtx.putImageData(maskImgData, 0, 0);
      }

      const cutoutCanvas = document.createElement("canvas");
      cutoutCanvas.width = boundW;
      cutoutCanvas.height = boundH;
      const cutoutCtx = cutoutCanvas.getContext("2d");
      if (cutoutCtx) {
        const cutoutImgData = cutoutCtx.createImageData(boundW, boundH);
        const cData = cutoutImgData.data;
        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            const srcIdx = y * width + x;
            if (newIndices[srcIdx] === 1) {
              const srcByte = srcIdx * 4;
              const dstByte = ((y - minY) * boundW + (x - minX)) * 4;
              cData[dstByte] = data[srcByte];
              cData[dstByte + 1] = data[srcByte + 1];
              cData[dstByte + 2] = data[srcByte + 2];
              cData[dstByte + 3] = data[srcByte + 3];
            }
          }
        }
        cutoutCtx.putImageData(cutoutImgData, 0, 0);
      }

      setWandSelection({
        maskDataUrl: maskCanvas.toDataURL("image/png"),
        cutoutDataUrl: cutoutCanvas.toDataURL("image/png"),
        bounds: { x: minX, y: minY, width: boundW, height: boundH },
        sampledColor: wandSelection.sampledColor,
        pixelCount,
        totalPixels: width * height,
        selectedIndices: newIndices,
        seedX: wandSelection.seedX,
        seedY: wandSelection.seedY,
      });

      setToastNotice("✓ Selection inverted!");
      setTimeout(() => setToastNotice(null), 2000);
    } catch (err: any) {
      console.error("Magic wand invert error:", err);
    }
  };

  // Magic Wand Action: Download Cutout as PNG
  const handleWandDownloadCutout = () => {
    if (!wandSelection?.cutoutDataUrl) return;
    const link = document.createElement("a");
    link.download = `magic-wand-cutout-${Date.now()}.png`;
    link.href = wandSelection.cutoutDataUrl;
    link.click();
    setToastNotice("✓ Transparent PNG cutout downloaded!");
    setTimeout(() => setToastNotice(null), 2500);
  };

  // 1. Bake Current Frame
  const handleApplyToCurrentFrame = async () => {
    if (!activeSlice?.url) return;
    const bakedUrl = await renderCompositeCanvas(
      activeSlice.url,
      currentLayers,
      currentFreehandLines,
      imgNaturalSize.width,
      imgNaturalSize.height,
      frameData[activeIdx]?.bgFillColor
    );

    onUpdateSliceUrl(activeIdx, bakedUrl);
    updateActiveFrameData([], []);
    setUndoStack([]);
    setRedoStack([]);

    setToastNotice("✓ Frame Baked! Shapes & lines merged onto image...");
    setTimeout(() => setToastNotice(null), 3000);
  };

  // 2. Save to New Frame
  const handleSaveToNewFrame = async () => {
    if (!activeSlice?.url) return;
    const bakedUrl = await renderCompositeCanvas(
      activeSlice.url,
      currentLayers,
      currentFreehandLines,
      imgNaturalSize.width,
      imgNaturalSize.height,
      frameData[activeIdx]?.bgFillColor
    );

    const nextIdx = activeIdx + 1;
    const newFrameName = `${activeSlice.name || "Frame"} (ShapeStudio)`;

    if (onAddFrame) {
      onAddFrame({ name: newFrameName, url: bakedUrl, story: activeSlice.story }, nextIdx);
    }

    if (onNavigateFrame) {
      onNavigateFrame(nextIdx);
    } else {
      setActiveIdx(nextIdx);
    }

    setToastNotice(`✓ Saved as new frame #${nextIdx + 1}!`);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // 3. Bake All Frames & Close
  const handleBakeAllFrames = async () => {
    for (let i = 0; i < slices.length; i++) {
      const slice = slices[i];
      const data = frameData[i];
      if (slice?.url && data && (data.layers.length > 0 || data.freehandLines.length > 0 || data.bgFillColor)) {
        const bakedUrl = await renderCompositeCanvas(
          slice.url,
          data.layers,
          data.freehandLines,
          imgNaturalSize.width,
          imgNaturalSize.height,
          data.bgFillColor
        );
        onUpdateSliceUrl(i, bakedUrl);
      }
    }

    setFrameData({});
    onClose();
  };

  // Delete current frame and shift down layers
  const handleDeleteFrame = (indexToDelete: number) => {
    // 1. Shift frameData
    setFrameData((prev) => {
      const next: FrameData = {};
      Object.keys(prev).forEach((keyStr) => {
        const key = parseInt(keyStr);
        if (key < indexToDelete) {
          next[key] = prev[key];
        } else if (key > indexToDelete) {
          next[key - 1] = prev[key];
        }
      });
      return next;
    });

    // 2. Call the parent prop
    if (onDeleteFrame) {
      onDeleteFrame(indexToDelete);
    }
  };

  // Select whole canvas as crop area
  const handleSelectWholeCanvas = () => {
    if (imgNaturalSize.width && imgNaturalSize.height) {
      pushHistory();
      setCropBox({ x: 0, y: 0, width: imgNaturalSize.width, height: imgNaturalSize.height });
      setIsCropSelected(true);
      setToastNotice("✓ Selected whole canvas (100%)");
      setTimeout(() => setToastNotice(null), 2000);
    }
  };

  // Apply Crop in ShapeStudio
  const handleApplyCrop = async () => {
    const sourceImage = activeSlice?.url;
    if (!sourceImage) return;

    if (cropBox && cropBox.width > 0 && cropBox.height > 0 && imgNaturalSize.width && imgNaturalSize.height) {
      try {
        const targetCrop: Crop = {
          unit: "%",
          x: (cropBox.x / imgNaturalSize.width) * 100,
          y: (cropBox.y / imgNaturalSize.height) * 100,
          width: (cropBox.width / imgNaturalSize.width) * 100,
          height: (cropBox.height / imgNaturalSize.height) * 100,
        };

        const croppedUrl = await getCroppedImg(
          sourceImage,
          targetCrop,
          "image/png",
          null,
          cropShape === "oval"
        );

        if (!croppedUrl) {
          throw new Error("getCroppedImg returned empty URL");
        }

        pushHistory();
        onUpdateSliceUrl(activeIdx, croppedUrl);
        setCropBox(null);
        setCrop(undefined);
        setCompletedPercentCrop(null);
        setCompletedPixelCrop(null);
        setActiveTool("crop");
        setIsRightSidebarOpen(true);
        setIsVisibilityOpen(true);
        setToastNotice("✓ Frame cropped! Ready for next crop.");
        setTimeout(() => setToastNotice(null), 2500);
      } catch (err) {
        console.error("Failed to crop image:", err);
        setToastNotice("Failed to crop image");
        setTimeout(() => setToastNotice(null), 2500);
      }
    } else {
      setToastNotice("Please select a crop area first.");
      setTimeout(() => setToastNotice(null), 2500);
    }
  };

  // Copy Crop Selection as new image layer
  const handleCopyCrop = async () => {
    const sourceImage = activeSlice?.url;
    if (!sourceImage) return;

    if (cropBox && cropBox.width > 0 && cropBox.height > 0 && imgNaturalSize.width && imgNaturalSize.height) {
      try {
        const targetCrop: Crop = {
          unit: "%",
          x: (cropBox.x / imgNaturalSize.width) * 100,
          y: (cropBox.y / imgNaturalSize.height) * 100,
          width: (cropBox.width / imgNaturalSize.width) * 100,
          height: (cropBox.height / imgNaturalSize.height) * 100,
        };

        const croppedUrl = await getCroppedImg(
          sourceImage,
          targetCrop,
          "image/png",
          null,
          cropShape === "oval"
        );

        if (!croppedUrl) {
          throw new Error("getCroppedImg returned empty URL");
        }

        pushHistory();

        const stageX = cropBox.x;
        const stageY = cropBox.y;
        const stageW = cropBox.width;
        const stageH = cropBox.height;

        const newLayer: ShapeLayer = {
          id: `layer_${Date.now()}`,
          name: "Crop Cutout",
          type: "image",
          x: stageX,
          y: stageY,
          width: stageW,
          height: stageH,
          imageUrl: croppedUrl,
          rotation: 0,
          opacity: 1,
          zIndex: (currentLayers.length || 0) + 1,
          strokeColor: "#000000",
          strokeWidth: 0,
          fillColor: "transparent",
          lineStyle: "solid",
          visible: true,
          locked: false,
        };

        updateActiveFrameData((prev = []) => [...(Array.isArray(prev) ? prev : []), newLayer]);
        setSelectedLayerIds([newLayer.id]);
        setCropBox(null);
        setCrop(undefined);
        setCompletedPercentCrop(null);
        setCompletedPixelCrop(null);
        setActiveTool("crop");
        setIsRightSidebarOpen(true);
        setIsVisibilityOpen(true);
        setToastNotice("✓ Selection copied as new layer!");
        setTimeout(() => setToastNotice(null), 2500);
      } catch (err) {
        console.error("Failed to copy image selection:", err);
        setToastNotice("Failed to copy image selection");
        setTimeout(() => setToastNotice(null), 2500);
      }
    } else {
      setToastNotice("Please select a crop area first.");
      setTimeout(() => setToastNotice(null), 2500);
    }
  };

  // Multi-Crops Handlers for ShapeStudio
  const handleAddMultiCrop = () => {
    if (cropBox && cropBox.width > 0 && cropBox.height > 0 && imgNaturalSize.width && imgNaturalSize.height) {
      const targetCrop: Crop = {
        unit: "%",
        x: (cropBox.x / imgNaturalSize.width) * 100,
        y: (cropBox.y / imgNaturalSize.height) * 100,
        width: (cropBox.width / imgNaturalSize.width) * 100,
        height: (cropBox.height / imgNaturalSize.height) * 100,
      };
      const newItem: ShapeStudioMultiCropItem = {
        id: `mc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        crop: targetCrop,
        cropShape: cropShape,
        frameIdx: activeIdx,
        frameName: activeSlice?.name || `Frame ${activeIdx + 1}`,
        createdAt: Date.now(),
      };
      setMultiCrops((prev) => [...prev, newItem]);
      setCropBox(null);
      setCrop(undefined);
      setCompletedPercentCrop(null);
      setCompletedPixelCrop(null);
      setActiveTool("crop");
      setIsRightSidebarOpen(true);
      setIsVisibilityOpen(true);
      setToastNotice(`✓ Added area to Multi-Crops (#${multiCrops.length + 1})!`);
      setTimeout(() => setToastNotice(null), 2500);
    } else {
      setToastNotice("Please select a crop area on the canvas first.");
      setTimeout(() => setToastNotice(null), 2500);
    }
  };

  const handleApplySingleMultiCropToCurrent = async (item: ShapeStudioMultiCropItem) => {
    const sourceSlice = slices[item.frameIdx] || activeSlice;
    if (!sourceSlice?.url) return;
    try {
      const croppedUrl = await getCroppedImg(
        sourceSlice.url,
        item.crop,
        "image/png",
        null,
        item.cropShape === "oval"
      );
      if (!croppedUrl) throw new Error("Crop returned empty image");
      onUpdateSliceUrl(activeIdx, croppedUrl);
      setCropBox(null);
      setCrop(undefined);
      setCompletedPercentCrop(null);
      setCompletedPixelCrop(null);
      setActiveTool("crop");
      setToastNotice("✓ Applied multi-crop to active frame!");
      setTimeout(() => setToastNotice(null), 2500);
    } catch (err) {
      console.error("Failed to apply multi-crop:", err);
      setToastNotice("Failed to apply crop");
      setTimeout(() => setToastNotice(null), 2500);
    }
  };

  const handleApplySingleMultiCropToNewFrame = async (item: ShapeStudioMultiCropItem) => {
    const sourceSlice = slices[item.frameIdx] || activeSlice;
    if (!sourceSlice?.url) return;
    try {
      const croppedUrl = await getCroppedImg(
        sourceSlice.url,
        item.crop,
        "image/png",
        null,
        item.cropShape === "oval"
      );
      if (!croppedUrl) throw new Error("Crop returned empty image");
      const nextIdx = slices.length;
      const cropIdx = multiCrops.findIndex((c) => c.id === item.id);
      const newFrameName = `${sourceSlice.name || "Frame"} (Crop #${cropIdx >= 0 ? cropIdx + 1 : 1})`;
      if (onAddFrame) {
        onAddFrame({ name: newFrameName, url: croppedUrl, story: sourceSlice.story }, nextIdx);
      }
      setActiveTool("crop");
      setToastNotice(`✓ Extracted to new Frame #${nextIdx + 1}!`);
      setTimeout(() => setToastNotice(null), 2500);
    } catch (err) {
      console.error("Failed to extract multi-crop to frame:", err);
      setToastNotice("Failed to extract frame");
      setTimeout(() => setToastNotice(null), 2500);
    }
  };

  const handleApplySingleMultiCropAsLayer = async (item: ShapeStudioMultiCropItem) => {
    const sourceSlice = slices[item.frameIdx] || activeSlice;
    if (!sourceSlice?.url) return;
    try {
      const croppedUrl = await getCroppedImg(
        sourceSlice.url,
        item.crop,
        "image/png",
        null,
        item.cropShape === "oval"
      );
      if (!croppedUrl) throw new Error("Crop returned empty image");

      pushHistory();

      let stageX = 100;
      let stageY = 100;
      let stageW = 200;
      let stageH = 150;

      const isPercent = item.crop.unit === "%";
      if (imgNaturalSize.width && imgNaturalSize.height) {
        let pixelX = item.crop.x || 0;
        let pixelY = item.crop.y || 0;
        let pixelW = item.crop.width || 0;
        let pixelH = item.crop.height || 0;
        if (isPercent) {
          pixelX = (pixelX / 100) * imgNaturalSize.width;
          pixelY = (pixelY / 100) * imgNaturalSize.height;
          pixelW = (pixelW / 100) * imgNaturalSize.width;
          pixelH = (pixelH / 100) * imgNaturalSize.height;
        }
        stageX = Math.round(pixelX);
        stageY = Math.round(pixelY);
        stageW = Math.round(pixelW);
        stageH = Math.round(pixelH);
      }

      const newLayer: ShapeLayer = {
        id: `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: `Crop Cutout`,
        type: "image",
        x: stageX,
        y: stageY,
        width: stageW,
        height: stageH,
        imageUrl: croppedUrl,
        rotation: 0,
        opacity: 1,
        zIndex: (currentLayers.length || 0) + 1,
        strokeColor: "#000000",
        strokeWidth: 0,
        fillColor: "transparent",
        lineStyle: "solid",
        visible: true,
        locked: false,
      };

      updateActiveFrameData((prev = []) => [...(Array.isArray(prev) ? prev : []), newLayer]);
      setSelectedLayerIds([newLayer.id]);
      setActiveTool("crop");
      setToastNotice("✓ Multi-crop added as canvas layer!");
      setTimeout(() => setToastNotice(null), 2500);
    } catch (err) {
      console.error("Failed to add multi-crop as layer:", err);
      setToastNotice("Failed to add layer");
      setTimeout(() => setToastNotice(null), 2500);
    }
  };

  const handleApplyAllMultiCropsToNewFrames = async () => {
    if (multiCrops.length === 0) return;
    try {
      setToastNotice(`Processing ${multiCrops.length} multi-crops...`);
      let addedCount = 0;
      for (let i = 0; i < multiCrops.length; i++) {
        const item = multiCrops[i];
        const sourceSlice = slices[item.frameIdx] || activeSlice;
        if (!sourceSlice?.url) continue;
        const croppedUrl = await getCroppedImg(
          sourceSlice.url,
          item.crop,
          "image/png",
          null,
          item.cropShape === "oval"
        );
        if (croppedUrl && onAddFrame) {
          const newIdx = slices.length + addedCount;
          const newName = `${sourceSlice.name || "Frame"} (Crop ${i + 1})`;
          onAddFrame({ name: newName, url: croppedUrl, story: sourceSlice.story }, newIdx);
          addedCount++;
        }
      }
      setMultiCrops([]);
      setActiveTool("crop");
      setToastNotice(`✓ Extracted ${addedCount} multi-crops to new frames!`);
      setTimeout(() => setToastNotice(null), 3000);
    } catch (err) {
      console.error("Failed to batch extract multi-crops:", err);
      setToastNotice("Error during batch extraction");
      setTimeout(() => setToastNotice(null), 2500);
    }
  };

  const handleApplyAllMultiCropsAsLayers = async () => {
    if (multiCrops.length === 0) return;
    try {
      pushHistory();
      setToastNotice(`Adding ${multiCrops.length} layers...`);
      const newLayersToAdd: ShapeLayer[] = [];
      for (let i = 0; i < multiCrops.length; i++) {
        const item = multiCrops[i];
        const sourceSlice = slices[item.frameIdx] || activeSlice;
        if (!sourceSlice?.url) continue;
        const croppedUrl = await getCroppedImg(
          sourceSlice.url,
          item.crop,
          "image/png",
          null,
          item.cropShape === "oval"
        );
        if (!croppedUrl) continue;

        let stageX = 50 + i * 25;
        let stageY = 50 + i * 25;
        let stageW = 200;
        let stageH = 150;

        const isPercent = item.crop.unit === "%";
        if (imgNaturalSize.width && imgNaturalSize.height) {
          let pixelX = item.crop.x || 0;
          let pixelY = item.crop.y || 0;
          let pixelW = item.crop.width || 0;
          let pixelH = item.crop.height || 0;
          if (isPercent) {
            pixelX = (pixelX / 100) * imgNaturalSize.width;
            pixelY = (pixelY / 100) * imgNaturalSize.height;
            pixelW = (pixelW / 100) * imgNaturalSize.width;
            pixelH = (pixelH / 100) * imgNaturalSize.height;
          }
          stageX = Math.round(pixelX);
          stageY = Math.round(pixelY);
          stageW = Math.round(pixelW);
          stageH = Math.round(pixelH);
        }

        newLayersToAdd.push({
          id: `layer_${Date.now()}_${i}`,
          name: `Crop Cutout #${i + 1}`,
          type: "image",
          x: stageX,
          y: stageY,
          width: stageW,
          height: stageH,
          imageUrl: croppedUrl,
          rotation: 0,
          opacity: 1,
          zIndex: (currentLayers.length || 0) + 1 + i,
          strokeColor: "#000000",
          strokeWidth: 0,
          fillColor: "transparent",
          lineStyle: "solid",
          visible: true,
          locked: false,
        });
      }
      if (newLayersToAdd.length > 0) {
        updateActiveFrameData((prev = []) => [...(Array.isArray(prev) ? prev : []), ...newLayersToAdd]);
        setSelectedLayerIds(newLayersToAdd.map((l) => l.id));
      }
      setMultiCrops([]);
      setActiveTool("crop");
      setToastNotice(`✓ Added ${newLayersToAdd.length} multi-crops as layers!`);
      setTimeout(() => setToastNotice(null), 3000);
    } catch (err) {
      console.error("Failed to batch insert multi-crops as layers:", err);
      setToastNotice("Error inserting multi-crops");
      setTimeout(() => setToastNotice(null), 2500);
    }
  };

  // Finish Continuous Line Drawing
  const finishContinuousDrawing = useCallback(() => {
    if (isDrawing && currentLinePoints.length > 1) {
      const filteredPoints = currentLinePoints.filter((p, i, arr) => {
        if (i === 0) return true;
        const prev = arr[i - 1];
        return Math.hypot(p.x - prev.x, p.y - prev.y) > 2;
      });

      if (filteredPoints.length > 1) {
        pushHistory();
        const newLine: FreehandLine = {
          id: `line_${Date.now()}`,
          points: filteredPoints,
          color: brushColor,
          width: brushWidth,
          opacity: brushOpacity,
          arrowEnd: brushArrowEnd,
        };
        updateActiveFrameData(undefined, (prev = []) => [
          ...(Array.isArray(prev) ? prev : []),
          newLine,
        ]);
      }
    }
    setIsDrawing(false);
    setCurrentLinePoints([]);
  }, [isDrawing, currentLinePoints, pushHistory, brushColor, brushWidth, brushOpacity, brushArrowEnd, updateActiveFrameData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      if (isDrawing && activeTool === "brush") {
        if (e.key === "Enter" || e.key === "Escape") {
          finishContinuousDrawing();
          return;
        }
      }

      // Undo / Redo Global Hotkeys (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y)
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          return;
        }
        if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          handleRedo();
          return;
        }
        if (e.key.toLowerCase() === "a" && activeTool === "crop") {
          e.preventDefault();
          handleSelectWholeCanvas();
          return;
        }
      }

      // Crop specific hotkeys
      if (activeTool === "crop") {
        if (e.key === "Enter") {
          if (e.shiftKey) {
            handleAddMultiCrop();
          } else if (cropBox && cropBox.width > 0 && cropBox.height > 0) {
            handleApplyCrop();
          }
        } else if (e.key === "Escape") {
          if (isCropSelected) {
            setIsCropSelected(false);
            setToastNotice("Crop deselected (definition kept)");
            setTimeout(() => setToastNotice(null), 1500);
          } else if (cropBox) {
            pushHistory();
            setCropBox(null);
          }
        }
      }
    };
    const handleGlobalMouseUp = () => {
      setDragState(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDrawing, activeTool, finishContinuousDrawing, handleUndo, handleRedo, handleSelectWholeCanvas, handleAddMultiCrop, handleApplyCrop, cropBox, isCropSelected, pushHistory]);

  // Interactive Stage Mouse Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setOpenFlyout(null);
    const coords = getStageCoords(e);

    if (activeTool === "chromaKey") {
      pickColorFromImage(coords.x, coords.y);
      return;
    }

    if (activeTool === "magicWand") {
      executeMagicWandSelection(coords.x, coords.y);
      return;
    }

    if (activeTool === "smudge" || activeTool === "sprayCan" || activeTool === "blur") {
      setIsDrawing(true);
      setCurrentLinePoints([{ x: coords.x, y: coords.y }]);
      return;
    }

    if (activeTool === "polygonSelection") {
      if (isPolygonClosed) {
        setPolygonPoints([{ x: coords.x, y: coords.y }]);
        setIsPolygonClosed(false);
        return;
      }
      if (polygonPoints.length >= 3) {
        const firstPt = polygonPoints[0];
        const dist = Math.hypot(coords.x - firstPt.x, coords.y - firstPt.y);
        if (dist < 15 / zoomLevel) {
          setIsPolygonClosed(true);
          setToastNotice("Polygon selection closed!");
          setTimeout(() => setToastNotice(null), 2000);
          return;
        }
      }
      setPolygonPoints((prev) => [...prev, { x: coords.x, y: coords.y }]);
      return;
    }

    if (activeTool === "pen") {
      if (isPenClosed) {
        setPenPoints([{ x: coords.x, y: coords.y }]);
        setIsPenClosed(false);
        setIsDrawing(true);
        return;
      }
      if (penPoints.length >= 3) {
        const firstPt = penPoints[0];
        const dist = Math.hypot(coords.x - firstPt.x, coords.y - firstPt.y);
        if (dist < 15 / zoomLevel) {
          setIsPenClosed(true);
          setToastNotice("Vector cutout path closed!");
          setTimeout(() => setToastNotice(null), 2000);
          return;
        }
      }
      setIsDrawing(true);
      setPenPoints((prev) => [...prev, { x: coords.x, y: coords.y }]);
      return;
    }

    if (activeTool === "patch") {
      if (!patchSourceBox) {
        setDragState({
          type: "marquee",
          startX: coords.x,
          startY: coords.y,
          initialLayers: [],
        });
        setPatchSourceBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
        return;
      }

      const inSource = (
        coords.x >= patchSourceBox.x &&
        coords.x <= patchSourceBox.x + patchSourceBox.width &&
        coords.y >= patchSourceBox.y &&
        coords.y <= patchSourceBox.y + patchSourceBox.height
      );

      const inDest = patchDestBox && (
        coords.x >= patchDestBox.x &&
        coords.x <= patchDestBox.x + patchDestBox.width &&
        coords.y >= patchDestBox.y &&
        coords.y <= patchDestBox.y + patchDestBox.height
      );

      if (inSource) {
        setDraggedPatchBox("source");
        setPatchDragStart({ x: coords.x - patchSourceBox.x, y: coords.y - patchSourceBox.y });
        return;
      } else if (inDest && patchDestBox) {
        setDraggedPatchBox("dest");
        setPatchDragStart({ x: coords.x - patchDestBox.x, y: coords.y - patchDestBox.y });
        return;
      } else {
        setDragState({
          type: "marquee",
          startX: coords.x,
          startY: coords.y,
          initialLayers: [],
        });
        setPatchSourceBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
        setPatchDestBox(null);
      }
      return;
    }

    if (activeTool === "marquee") {
      setDragState({
        type: "marquee",
        startX: coords.x,
        startY: coords.y,
        initialLayers: [],
      });
      setMarqueeBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
      return;
    }

    if (activeTool === "selectResize") {
      if (selectResizeSnapshot && selectResizeBox) {
        const inBox = (
          coords.x >= selectResizeBox.x &&
          coords.x <= selectResizeBox.x + selectResizeBox.width &&
          coords.y >= selectResizeBox.y &&
          coords.y <= selectResizeBox.y + selectResizeBox.height
        );
        if (inBox) {
          setDragState({
            type: "select_resize_move",
            startX: coords.x,
            startY: coords.y,
            initialLayers: [],
            initialSelectResizeBox: { ...selectResizeBox },
          });
          return;
        }
      }
      setSelectResizeSnapshot(null);
      setSelectResizeBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
      setDragState({
        type: "select_resize_draw",
        startX: coords.x,
        startY: coords.y,
        initialLayers: [],
      });
      return;
    }

    if (activeTool === "crop") {
      // Check if clicked inside existing cropBox for selecting / moving
      if (cropBox && cropBox.width > 0 && cropBox.height > 0) {
        const inCrop = (
          coords.x >= cropBox.x &&
          coords.x <= cropBox.x + cropBox.width &&
          coords.y >= cropBox.y &&
          coords.y <= cropBox.y + cropBox.height
        );
        if (inCrop) {
          setIsCropSelected(true);
          // Only initiate move state if it was already selected; otherwise, this click purely selects the frame
          if (isCropSelected) {
            setDragState({
              type: "crop_move",
              startX: coords.x,
              startY: coords.y,
              initialLayers: [],
              initialCropBox: { ...cropBox },
            });
          } else {
            setDragState(null);
          }
          return;
        } else {
          // Immediately deselect focus of the crop frame when clicking outside
          if (isCropSelected) {
            setIsCropSelected(false);
          }
        }
      }

      // Clicked outside existing crop definition: record drag start and keep initial definition so single click deselects
      setDragState({
        type: "crop",
        startX: coords.x,
        startY: coords.y,
        initialLayers: [],
        initialCropBox: cropBox && cropBox.width > 0 && cropBox.height > 0 ? { ...cropBox } : undefined,
      });
      return;
    }

    if (activeTool === "brush" || activeTool === "lines") {
      if (brushLineMode === "continuous_straight") {
        if (!isDrawing) {
          setIsDrawing(true);
          setCurrentLinePoints([
            { x: coords.x, y: coords.y },
            { x: coords.x, y: coords.y },
          ]);
        } else {
          // Add a confirmed vertex, and set up next segment candidate point
          setCurrentLinePoints((prev = []) => [
            ...prev,
            { x: coords.x, y: coords.y },
          ]);
        }
        return;
      }

      setIsDrawing(true);
      setCurrentLinePoints([{ x: coords.x, y: coords.y }]);
      return;
    }

    if (activeTool === "pointer") {
      // Find top clicked layer
      const sortedLayers = [...currentLayers].sort((a, b) => b.zIndex - a.zIndex);
      const clickedLayer = sortedLayers.find((layer) => {
        if (layer.visible === false || layer.locked) return false;
        return (
          coords.x >= layer.x &&
          coords.x <= layer.x + layer.width &&
          coords.y >= layer.y &&
          coords.y <= layer.y + layer.height
        );
      });

      if (clickedLayer) {
        if (e.shiftKey) {
          setSelectedLayerIds((prev = []) => {
            const list = Array.isArray(prev) ? prev : [];
            return list.includes(clickedLayer.id)
              ? list.filter((id) => id !== clickedLayer.id)
              : [...list, clickedLayer.id];
          });
        } else {
          setSelectedLayerIds([clickedLayer.id]);
        }

        setDragState({
          type: "move",
          startX: coords.x,
          startY: coords.y,
          initialLayers: JSON.parse(JSON.stringify(currentLayers)),
        });
      } else {
        if (!e.shiftKey) {
          setSelectedLayerIds([]);
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getStageCoords(e);

    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (activeTool === "polygonSelection" && polygonPoints.length > 0 && !isPolygonClosed) {
      setHoverCoords(coords);
    } else if (activeTool === "pen" && penPoints.length > 0 && !isPenClosed) {
      setHoverCoords(coords);
      if (isDrawing) {
        const lastPt = penPoints[penPoints.length - 1];
        const dist = Math.hypot(coords.x - lastPt.x, coords.y - lastPt.y);
        if (dist >= 5 / zoomLevel) {
          setPenPoints((prev) => [...prev, { x: coords.x, y: coords.y }]);
        }
      }
    } else {
      setHoverCoords(null);
    }

    if (isDrawing && (activeTool === "smudge" || activeTool === "sprayCan" || activeTool === "blur")) {
      setCurrentLinePoints((prev = []) => {
        const arr = Array.isArray(prev) ? prev : [];
        if (arr.length > 0) {
          const lastPt = arr[arr.length - 1];
          const dist = Math.hypot(coords.x - lastPt.x, coords.y - lastPt.y);
          if (dist < 1.5) return arr;
        }
        return [...arr, { x: coords.x, y: coords.y }];
      });
      return;
    }

    if (activeTool === "patch") {
      if (draggedPatchBox === "source" && patchSourceBox) {
        setPatchSourceBox({
          ...patchSourceBox,
          x: Math.max(0, Math.min(imgNaturalSize.width - patchSourceBox.width, coords.x - patchDragStart.x)),
          y: Math.max(0, Math.min(imgNaturalSize.height - patchSourceBox.height, coords.y - patchDragStart.y)),
        });
      } else if (draggedPatchBox === "dest" && patchDestBox) {
        setPatchDestBox({
          ...patchDestBox,
          x: Math.max(0, Math.min(imgNaturalSize.width - patchDestBox.width, coords.x - patchDragStart.x)),
          y: Math.max(0, Math.min(imgNaturalSize.height - patchDestBox.height, coords.y - patchDragStart.y)),
        });
      } else if (dragState && dragState.type === "marquee") {
        const dx = coords.x - dragState.startX;
        const dy = coords.y - dragState.startY;
        setPatchSourceBox({
          x: dx < 0 ? coords.x : dragState.startX,
          y: dy < 0 ? coords.y : dragState.startY,
          width: Math.abs(dx),
          height: Math.abs(dy),
        });
      }
      return;
    }

    if (isDrawing && (activeTool === "brush" || activeTool === "lines")) {
      if (e.shiftKey || brushLineMode === "straight") {
        // Lock straight line from initial point
        setCurrentLinePoints((prev = []) => [
          prev[0] || { x: coords.x, y: coords.y },
          { x: coords.x, y: coords.y },
        ]);
      } else if (brushLineMode === "continuous_straight") {
        // Update candidate point for active segment
        setCurrentLinePoints((prev = []) => {
          if (prev.length === 0) return [{ x: coords.x, y: coords.y }];
          return [...prev.slice(0, -1), { x: coords.x, y: coords.y }];
        });
      } else {
        // Freehand mode - filter out micro-movements under 1.5px to eliminate drag lag
        setCurrentLinePoints((prev = []) => {
          const arr = Array.isArray(prev) ? prev : [];
          if (arr.length > 0) {
            const lastPt = arr[arr.length - 1];
            const dist = Math.hypot(coords.x - lastPt.x, coords.y - lastPt.y);
            if (dist < 1.5) return arr;
          }
          return [...arr, { x: coords.x, y: coords.y }];
        });
      }
      return;
    }

    if (dragState) {
      if (e.buttons === 0) {
        setDragState(null);
        return;
      }

      if (dragState.type === "move") {
        const dx = coords.x - dragState.startX;
        const dy = coords.y - dragState.startY;

        updateActiveFrameData((prev = []) =>
          (Array.isArray(prev) ? prev : []).map((layer) => {
            if (selectedLayerIds.includes(layer.id)) {
              const initial = dragState.initialLayers.find((l) => l.id === layer.id);
              if (!initial) return layer;
              return {
                ...layer,
                x: Math.round(initial.x + dx),
                y: Math.round(initial.y + dy),
              };
            }
            return layer;
          })
        );
      } else if (dragState.type === "resize" && selectedLayerIds.length > 0) {
        const dx = coords.x - dragState.startX;
        const dy = coords.y - dragState.startY;

        updateActiveFrameData((prev = []) =>
          (Array.isArray(prev) ? prev : []).map((layer) => {
            if (layer.id === selectedLayerIds[0]) {
              const initial = dragState.initialLayers.find((l) => l.id === layer.id);
              if (!initial) return layer;

              let newWidth = initial.width;
              let newHeight = initial.height;
              let newX = initial.x;
              let newY = initial.y;

              const handle = dragState.handle;

              if (handle === "e" || handle === "se" || handle === "ne") {
                newWidth = Math.max(20, Math.round(initial.width + dx));
              }
              if (handle === "w" || handle === "sw" || handle === "nw") {
                const w = Math.max(20, Math.round(initial.width - dx));
                newX = initial.x + (initial.width - w);
                newWidth = w;
              }
              if (handle === "s" || handle === "se" || handle === "sw") {
                newHeight = Math.max(20, Math.round(initial.height + dy));
              }
              if (handle === "n" || handle === "ne" || handle === "nw") {
                const h = Math.max(20, Math.round(initial.height - dy));
                newY = initial.y + (initial.height - h);
                newHeight = h;
              }

              return {
                ...layer,
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight,
              };
            }
            return layer;
          })
        );
      } else if (dragState.type === "rotate" && selectedLayerIds.length > 0) {
        updateActiveFrameData((prev = []) =>
          (Array.isArray(prev) ? prev : []).map((layer) => {
            if (layer.id === selectedLayerIds[0]) {
              const initial = dragState.initialLayers.find((l) => l.id === layer.id);
              if (!initial) return layer;
              const centerX = initial.x + initial.width / 2;
              const centerY = initial.y + initial.height / 2;
              const angleRad = Math.atan2(coords.y - centerY, coords.x - centerX);
              let angleDeg = angleRad * (180 / Math.PI) + 90;
              if (angleDeg < 0) angleDeg += 360;
              return {
                ...layer,
                rotation: Math.round(angleDeg),
              };
            }
            return layer;
          })
        );
      } else if (dragState.type === "skewX" && selectedLayerIds.length > 0) {
        const dx = coords.x - dragState.startX;
        updateActiveFrameData((prev = []) =>
          (Array.isArray(prev) ? prev : []).map((layer) => {
            if (layer.id === selectedLayerIds[0]) {
              const initial = dragState.initialLayers.find((l) => l.id === layer.id);
              if (!initial) return layer;
              return {
                ...layer,
                skewX: Math.max(-60, Math.min(60, Math.round((initial.skewX || 0) + dx / 2))),
              };
            }
            return layer;
          })
        );
      } else if (dragState.type === "skewY" && selectedLayerIds.length > 0) {
        const dy = coords.y - dragState.startY;
        updateActiveFrameData((prev = []) =>
          (Array.isArray(prev) ? prev : []).map((layer) => {
            if (layer.id === selectedLayerIds[0]) {
              const initial = dragState.initialLayers.find((l) => l.id === layer.id);
              if (!initial) return layer;
              return {
                ...layer,
                skewY: Math.max(-60, Math.min(60, Math.round((initial.skewY || 0) + dy / 2))),
              };
            }
            return layer;
          })
        );
      } else if (dragState.type === "crop") {
        let dx = coords.x - dragState.startX;
        let dy = coords.y - dragState.startY;
        const dist = Math.hypot(dx, dy);

        // Only begin defining a new crop box if dragged >= 5px or if no initial crop existed
        if (dist >= 5 || !dragState.initialCropBox) {
          let w = Math.abs(dx);
          let h = Math.abs(dy);

          if (cropAspect !== "free") {
            const ratio = cropAspect === "16:9" ? 16 / 9 : (cropAspect === "4:3" ? 4 / 3 : (cropAspect === "1:1" ? 1 : 9 / 16));
            if (w / h > ratio) {
              w = h * ratio;
            } else {
              h = w / ratio;
            }
          }

          const finalX = dx < 0 ? Math.max(0, dragState.startX - w) : Math.min(imgNaturalSize.width - w, dragState.startX);
          const finalY = dy < 0 ? Math.max(0, dragState.startY - h) : Math.min(imgNaturalSize.height - h, dragState.startY);

          setCropBox({
            x: Math.round(finalX),
            y: Math.round(finalY),
            width: Math.round(w),
            height: Math.round(h),
          });
          setIsCropSelected(true);
        }
      } else if (dragState.type === "crop_adjust" && dragState.initialCropBox) {
        const init = dragState.initialCropBox;
        const handle = dragState.handle || "se";
        let newX = init.x;
        let newY = init.y;
        let newW = init.width;
        let newH = init.height;

        if (handle.includes("e")) {
          newW = Math.max(10, coords.x - init.x);
        }
        if (handle.includes("s")) {
          newH = Math.max(10, coords.y - init.y);
        }
        if (handle.includes("w")) {
          const right = init.x + init.width;
          newX = Math.min(right - 10, Math.max(0, coords.x));
          newW = right - newX;
        }
        if (handle.includes("n")) {
          const bottom = init.y + init.height;
          newY = Math.min(bottom - 10, Math.max(0, coords.y));
          newH = bottom - newY;
        }

        if (cropAspect !== "free") {
          const ratio = cropAspect === "16:9" ? 16 / 9 : (cropAspect === "4:3" ? 4 / 3 : (cropAspect === "1:1" ? 1 : 9 / 16));
          if (handle === "e" || handle === "w") {
            newH = newW / ratio;
          } else if (handle === "n" || handle === "s") {
            newW = newH * ratio;
          } else {
            newH = newW / ratio;
          }
        }

        newX = Math.max(0, Math.min(imgNaturalSize.width - 10, newX));
        newY = Math.max(0, Math.min(imgNaturalSize.height - 10, newY));
        newW = Math.min(imgNaturalSize.width - newX, newW);
        newH = Math.min(imgNaturalSize.height - newY, newH);

        setCropBox({
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        });
      } else if (dragState.type === "crop_move" && dragState.initialCropBox) {
        const dx = coords.x - dragState.startX;
        const dy = coords.y - dragState.startY;
        if (Math.hypot(dx, dy) >= 4) {
          const init = dragState.initialCropBox;
          const newX = Math.max(0, Math.min(imgNaturalSize.width - init.width, init.x + dx));
          const newY = Math.max(0, Math.min(imgNaturalSize.height - init.height, init.y + dy));
          setCropBox({
            ...init,
            x: Math.round(newX),
            y: Math.round(newY),
          });
        }
      } else if (dragState.type === "marquee") {
        const dx = coords.x - dragState.startX;
        const dy = coords.y - dragState.startY;
        setMarqueeBox({
          x: dx < 0 ? coords.x : dragState.startX,
          y: dy < 0 ? coords.y : dragState.startY,
          width: Math.abs(dx),
          height: Math.abs(dy),
        });
      } else if (dragState.type === "marquee_adjust") {
        const x1 = dragState.startX;
        const y1 = dragState.startY;
        const x2 = coords.x;
        const y2 = coords.y;
        setMarqueeBox({
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          width: Math.abs(x1 - x2),
          height: Math.abs(y1 - y2),
        });
      } else if (dragState.type === "marquee_move" && dragState.initialMarqueeBox) {
        const dx = coords.x - dragState.startX;
        const dy = coords.y - dragState.startY;
        const init = dragState.initialMarqueeBox;
        setMarqueeBox({
          ...init,
          x: Math.round(init.x + dx),
          y: Math.round(init.y + dy),
        });
      } else if (dragState.type === "select_resize_draw") {
        const dx = coords.x - dragState.startX;
        const dy = coords.y - dragState.startY;
        setSelectResizeBox({
          x: dx < 0 ? coords.x : dragState.startX,
          y: dy < 0 ? coords.y : dragState.startY,
          width: Math.abs(dx),
          height: Math.abs(dy),
        });
      } else if (dragState.type === "select_resize_adjust" && dragState.initialSelectResizeBox) {
        const init = dragState.initialSelectResizeBox;
        const h = dragState.handle || "se";
        let x = init.x;
        let y = init.y;
        let w = init.width;
        let h_len = init.height;

        const dx = coords.x - dragState.startX;
        const dy = coords.y - dragState.startY;

        if (h === "e") {
          w = Math.max(10, init.width + dx);
        } else if (h === "w") {
          const rawW = init.width - dx;
          if (rawW >= 10) {
            x = init.x + dx;
            w = rawW;
          }
        } else if (h === "s") {
          h_len = Math.max(10, init.height + dy);
        } else if (h === "n") {
          const rawH = init.height - dy;
          if (rawH >= 10) {
            y = init.y + dy;
            h_len = rawH;
          }
        } else if (h === "se") {
          w = Math.max(10, init.width + dx);
          h_len = Math.max(10, init.height + dy);
        } else if (h === "sw") {
          const rawW = init.width - dx;
          if (rawW >= 10) {
            x = init.x + dx;
            w = rawW;
          }
          h_len = Math.max(10, init.height + dy);
        } else if (h === "ne") {
          w = Math.max(10, init.width + dx);
          const rawH = init.height - dy;
          if (rawH >= 10) {
            y = init.y + dy;
            h_len = rawH;
          }
        } else if (h === "nw") {
          const rawW = init.width - dx;
          const rawH = init.height - dy;
          if (rawW >= 10) {
            x = init.x + dx;
            w = rawW;
          }
          if (rawH >= 10) {
            y = init.y + dy;
            h_len = rawH;
          }
        }

        if (selectResizeKeepAspect && init.width > 0 && init.height > 0) {
          const ratio = init.width / init.height;
          if (h.includes("e") || h.includes("w")) {
            h_len = Math.round(w / ratio);
          } else {
            w = Math.round(h_len * ratio);
          }
        }

        setSelectResizeBox({
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(w),
          height: Math.round(h_len),
        });
      } else if (dragState.type === "select_resize_move" && dragState.initialSelectResizeBox) {
        const dx = coords.x - dragState.startX;
        const dy = coords.y - dragState.startY;
        const init = dragState.initialSelectResizeBox;
        setSelectResizeBox({
          ...init,
          x: Math.round(init.x + dx),
          y: Math.round(init.y + dy),
        });
      } else if (dragState.type === "canvas_resize_handle" && dragState.initialCanvasW && dragState.initialCanvasH) {
        const unconstrained = getUnconstrainedStageCoords(e);
        const dx = unconstrained.x - dragState.startX;
        const dy = unconstrained.y - dragState.startY;
        let newW = dragState.initialCanvasW;
        let newH = dragState.initialCanvasH;
        const h = dragState.handle || "";

        if (h.includes("e")) {
          if ([2, 5, 8].includes(canvasAnchor)) {
            newW = dragState.initialCanvasW + dx;
          } else if ([1, 4, 7].includes(canvasAnchor)) {
            newW = dragState.initialCanvasW + dx * 2;
          } else {
            newW = dragState.initialCanvasW + dx;
          }
        }
        if (h.includes("w")) {
          if ([0, 3, 6].includes(canvasAnchor)) {
            newW = dragState.initialCanvasW - dx;
          } else if ([1, 4, 7].includes(canvasAnchor)) {
            newW = dragState.initialCanvasW - dx * 2;
          } else {
            newW = dragState.initialCanvasW - dx;
          }
        }
        if (h.includes("s")) {
          if ([6, 7, 8].includes(canvasAnchor)) {
            newH = dragState.initialCanvasH + dy;
          } else if ([3, 4, 5].includes(canvasAnchor)) {
            newH = dragState.initialCanvasH + dy * 2;
          } else {
            newH = dragState.initialCanvasH + dy;
          }
        }
        if (h.includes("n")) {
          if ([0, 1, 2].includes(canvasAnchor)) {
            newH = dragState.initialCanvasH - dy;
          } else if ([3, 4, 5].includes(canvasAnchor)) {
            newH = dragState.initialCanvasH - dy * 2;
          } else {
            newH = dragState.initialCanvasH - dy;
          }
        }

        newW = Math.max(1, Math.round(newW));
        newH = Math.max(1, Math.round(newH));

        if (canvasRelative) {
          setCanvasWidthOffset(newW - imgNaturalSize.width);
          setCanvasHeightOffset(newH - imgNaturalSize.height);
        } else {
          setCanvasWidthInput(newW);
          setCanvasHeightInput(newH);
        }
      }
    }
  };

  const handleMouseUp = (e?: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (activeTool === "pen") {
      setIsDrawing(false);
      // If they were drawing a freehand lasso path, auto-close it when they release the mouse!
      if (penPoints.length > 5 && !isPenClosed) {
        setIsPenClosed(true);
        setToastNotice("✓ Freehand Lasso cutout region closed!");
        setTimeout(() => setToastNotice(null), 2000);
      }
    }

    if (isDrawing && (activeTool === "smudge" || activeTool === "sprayCan" || activeTool === "blur")) {
      if (currentLinePoints.length > 1) {
        pushHistory();
        const isBlurTool = activeTool === "blur";
        const isSprayTool = activeTool === "sprayCan";
        const isSmudgeTool = activeTool === "smudge";
        const newLine: FreehandLine = {
          id: `${activeTool}_${Date.now()}`,
          points: currentLinePoints,
          color: isBlurTool ? "rgba(255,255,255,0.15)" : brushColor,
          width: brushWidth * 2,
          opacity: isBlurTool ? Math.min(1, Math.max(0.2, (blurPressure / 100) * 0.95)) : 0.5,
          arrowEnd: false,
          isSmudge: isSmudgeTool || isSprayTool,
          isSprayCan: isSprayTool,
          isBlur: isBlurTool,
          blurPressure: isBlurTool ? blurPressure : undefined,
        };
        updateActiveFrameData(undefined, (prev = []) => [
          ...(Array.isArray(prev) ? prev : []),
          newLine,
        ]);
      }
      setIsDrawing(false);
      setCurrentLinePoints([]);
    }

    if (activeTool === "patch") {
      if (dragState && dragState.type === "marquee") {
        if (patchSourceBox && patchSourceBox.width > 5 && patchSourceBox.height > 5) {
          setPatchDestBox({
            x: Math.min(imgNaturalSize.width - patchSourceBox.width, patchSourceBox.x + patchSourceBox.width + 20),
            y: patchSourceBox.y,
            width: patchSourceBox.width,
            height: patchSourceBox.height,
          });
        } else {
          setPatchSourceBox(null);
          setPatchDestBox(null);
        }
      }
      setDraggedPatchBox(null);
      setDragState(null);
      return;
    }

    if (isDrawing && (activeTool === "brush" || activeTool === "lines")) {
      if (brushLineMode === "continuous_straight") {
        // Continuous straight line stays active for adding points until double-click / Enter / Finish button
        return;
      }

      if (currentLinePoints.length > 1) {
        pushHistory();
        const newLine: FreehandLine = {
          id: `line_${Date.now()}`,
          points: currentLinePoints,
          color: brushColor,
          width: brushWidth,
          opacity: brushOpacity,
          arrowEnd: brushArrowEnd,
          penShape: penShape,
        };
        updateActiveFrameData(undefined, (prev = []) => [
          ...(Array.isArray(prev) ? prev : []),
          newLine,
        ]);
      }
      setIsDrawing(false);
      setCurrentLinePoints([]);
    }

    if (dragState) {
      if (dragState.type === "crop" || dragState.type === "crop_adjust" || dragState.type === "crop_move") {
        if (dragState.type === "crop") {
          const coords = getStageCoords(e);
          const dist = Math.hypot(coords.x - dragState.startX, coords.y - dragState.startY);

          if (dragState.initialCropBox && dist < 5) {
            // Clicked outside existing selection frame: deselect keeping that definition
            setCropBox(dragState.initialCropBox);
            setIsCropSelected(false);
            setToastNotice("Crop deselected (definition kept)");
            setTimeout(() => setToastNotice(null), 1800);
          } else if (cropBox && (cropBox.width < 5 || cropBox.height < 5)) {
            if (dragState.initialCropBox) {
              setCropBox(dragState.initialCropBox);
              setIsCropSelected(false);
            } else {
              setCropBox(null);
            }
          } else if (cropBox && e.shiftKey && imgNaturalSize.width && imgNaturalSize.height) {
            pushHistory();
            const targetCrop: Crop = {
              unit: "%",
              x: (cropBox.x / imgNaturalSize.width) * 100,
              y: (cropBox.y / imgNaturalSize.height) * 100,
              width: (cropBox.width / imgNaturalSize.width) * 100,
              height: (cropBox.height / imgNaturalSize.height) * 100,
            };
            const newItem: ShapeStudioMultiCropItem = {
              id: `mc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              crop: targetCrop,
              cropShape: cropShape,
              frameIdx: activeIdx,
              frameName: activeSlice?.name || `Frame ${activeIdx + 1}`,
              createdAt: Date.now(),
            };
            setMultiCrops((prev) => [...prev, newItem]);
            setCropBox(null);
            setIsCropSelected(true);
            setToastNotice(`✓ Added area to Multi-Crops (#${multiCrops.length + 1})!`);
            setTimeout(() => setToastNotice(null), 2500);
          } else if (cropBox && cropBox.width >= 5 && cropBox.height >= 5 && dist >= 5) {
            // User drew a new crop box -> record previous crop state to history
            pushHistory(dragState.initialCropBox);
            setIsCropSelected(true);
          }
        } else if (dragState.type === "crop_adjust" || dragState.type === "crop_move") {
          if (
            dragState.initialCropBox &&
            cropBox &&
            (dragState.initialCropBox.x !== cropBox.x ||
              dragState.initialCropBox.y !== cropBox.y ||
              dragState.initialCropBox.width !== cropBox.width ||
              dragState.initialCropBox.height !== cropBox.height)
          ) {
            pushHistory(dragState.initialCropBox);
          }
          if (cropBox && (cropBox.width < 5 || cropBox.height < 5)) {
            setCropBox(null);
          }
        }
      } else if (dragState.type === "marquee" || dragState.type === "marquee_adjust" || dragState.type === "marquee_move") {
        if (marqueeBox && (marqueeBox.width < 5 || marqueeBox.height < 5)) {
          setMarqueeBox(null);
        }
      } else if (dragState.type === "select_resize_draw") {
        if (selectResizeBox && selectResizeBox.width >= 5 && selectResizeBox.height >= 5) {
          captureSelectResizeArea(selectResizeBox);
        } else {
          setSelectResizeBox(null);
          setSelectResizeSnapshot(null);
        }
      } else {
        pushHistory();
      }
      setDragState(null);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Select & Resize double-click inside stretched area to stamp onto image
    if (activeTool === "selectResize" && selectResizeBox && selectResizeSnapshot) {
      const coords = getStageCoords(e);
      if (
        coords.x >= selectResizeBox.x &&
        coords.x <= selectResizeBox.x + selectResizeBox.width &&
        coords.y >= selectResizeBox.y &&
        coords.y <= selectResizeBox.y + selectResizeBox.height
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleStampSelectResize();
        return;
      }
    }
    // Crop Tool double-click inside selection to apply, or double click canvas to select whole
    if (activeTool === "crop") {
      if (cropBox && cropBox.width > 0 && cropBox.height > 0) {
        const coords = getStageCoords(e);
        if (
          coords.x >= cropBox.x &&
          coords.x <= cropBox.x + cropBox.width &&
          coords.y >= cropBox.y &&
          coords.y <= cropBox.y + cropBox.height
        ) {
          e.preventDefault();
          e.stopPropagation();
          handleApplyCrop();
          return;
        }
      } else if (imgNaturalSize.width && imgNaturalSize.height) {
        e.preventDefault();
        e.stopPropagation();
        handleSelectWholeCanvas();
        return;
      }
    }

    // Clone Area selection double-click to apply
    if (marqueeBox && marqueeBox.width > 0 && marqueeBox.height > 0) {
      const coords = getStageCoords(e);
      if (
        coords.x >= marqueeBox.x &&
        coords.x <= marqueeBox.x + marqueeBox.width &&
        coords.y >= marqueeBox.y &&
        coords.y <= marqueeBox.y + marqueeBox.height
      ) {
        handleCloneArea(marqueeBox);
        return;
      }
    }

    // Vector Pen / Lasso Cutout double-click to apply
    if (activeTool === "pen" && penPoints.length >= 3) {
      const coords = getStageCoords(e);
      const xs = penPoints.map((p) => p.x);
      const ys = penPoints.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      // Ray-casting point-in-polygon check
      let inside = false;
      for (let i = 0, j = penPoints.length - 1; i < penPoints.length; j = i++) {
        const xi = penPoints[i].x, yi = penPoints[i].y;
        const xj = penPoints[j].x, yj = penPoints[j].y;
        const intersect = ((yi > coords.y) !== (yj > coords.y))
            && (coords.x < (xj - xi) * (coords.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      const inBBox = coords.x >= minX - 15 && coords.x <= maxX + 15 && coords.y >= minY - 15 && coords.y <= maxY + 15;

      if (inside || inBBox || isPenClosed) {
        setIsPenClosed(true);
        handlePenCutout("layer");
        return;
      }
    }

    if (isDrawing && (activeTool === "brush" || activeTool === "lines")) {
      finishContinuousDrawing();
    }

    if (activeTool === "polygonSelection" && polygonPoints.length >= 3) {
      if (isPolygonClosed) {
        handlePolygonClone();
      } else {
        setIsPolygonClosed(true);
        setToastNotice("Polygon selection closed! Double-click again or click Save Polygon Clone to apply.");
        setTimeout(() => setToastNotice(null), 2500);
      }
      return;
    }

    if (activeTool === "patch" && patchSourceBox && patchDestBox) {
      const coords = getStageCoords(e);
      const inSource = (
        coords.x >= patchSourceBox.x &&
        coords.x <= patchSourceBox.x + patchSourceBox.width &&
        coords.y >= patchSourceBox.y &&
        coords.y <= patchSourceBox.y + patchSourceBox.height
      );
      const inDest = (
        coords.x >= patchDestBox.x &&
        coords.x <= patchDestBox.x + patchDestBox.width &&
        coords.y >= patchDestBox.y &&
        coords.y <= patchDestBox.y + patchDestBox.height
      );
      if (inSource || inDest) {
        handleApplyPatch();
        return;
      }
    }
  };

  const handleDuplicateLayer = (layerToDup: ShapeLayer) => {
    pushHistory();
    const newId = `layer_dup_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const maxZ = Math.max(...currentLayers.map((l) => l.zIndex), 0);
    
    const duplicated: ShapeLayer = {
      ...layerToDup,
      id: newId,
      name: `${layerToDup.name || layerToDup.type} (Copy)`,
      x: layerToDup.x + 15,
      y: layerToDup.y + 15,
      zIndex: maxZ + 1,
    };

    updateActiveFrameData((prev = []) => {
      const layers = Array.isArray(prev) ? prev : [];
      return [...layers, duplicated];
    });

    // Automatically select the newly duplicated layer
    setSelectedLayerIds([newId]);
    
    setToastNotice("✓ Layer duplicated!");
    setTimeout(() => setToastNotice(null), 2000);
  };

  const handleZIndexChange = (direction: "top" | "up" | "down" | "bottom") => {
    if (selectedLayerIds.length === 0) return;
    pushHistory();

    updateActiveFrameData((prev = []) => {
      const layers = [...(Array.isArray(prev) ? prev : [])];
      const targetId = selectedLayerIds[0];
      const idx = layers.findIndex((l) => l.id === targetId);
      if (idx === -1) return layers;

      if (direction === "top") {
        const [moved] = layers.splice(idx, 1);
        layers.push(moved);
      } else if (direction === "bottom") {
        const [moved] = layers.splice(idx, 1);
        layers.unshift(moved);
      } else if (direction === "up" && idx < layers.length - 1) {
        const temp = layers[idx];
        layers[idx] = layers[idx + 1];
        layers[idx + 1] = temp;
      } else if (direction === "down" && idx > 0) {
        const temp = layers[idx];
        layers[idx] = layers[idx - 1];
        layers[idx - 1] = temp;
      }

      return layers.map((l, i) => ({ ...l, zIndex: i + 1 }));
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const zoomChange = e.deltaY > 0 ? -0.1 : 0.1;
      setZoomLevel((z) => Math.max(0.1, Math.min(5, z + zoomChange)));
    } else {
      if (!slices || slices.length <= 1) return;
      const now = Date.now();
      if (now - lastScrollTime.current > 300) {
        if (e.deltaY > 10) {
           const next = activeIdx < slices.length - 1 ? activeIdx + 1 : 0;
           setActiveIdx(next);
           if (onNavigateFrame) onNavigateFrame(next);
           lastScrollTime.current = now;
        } else if (e.deltaY < -10) {
           const next = activeIdx > 0 ? activeIdx - 1 : slices.length - 1;
           setActiveIdx(next);
           if (onNavigateFrame) onNavigateFrame(next);
           lastScrollTime.current = now;
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-1.5 sm:p-3 md:p-4 font-sans text-slate-100 select-none">
      <div className="w-full h-full max-w-[min(98vw,1800px)] max-h-[min(96vh,1050px)] bg-[#0b0f19] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Toast Alert */}
        {toastNotice && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-emerald-600/90 border border-emerald-400 text-white font-bold text-sm rounded-xl shadow-xl backdrop-blur-md animate-fade-in flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>{toastNotice}</span>
          </div>
        )}

        {/* Inline Text Editor Modal */}
        {editingLayerText && (
          <div className="absolute inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0e1322] border border-indigo-500/40 p-5 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
              <CustomizableLabel
                labelId="shape_studio_modal_item_188"
                defaultIcon={<Type className="w-4 h-4" />}
                as="h3"
                className="font-bold text-sm text-indigo-300 flex items-center gap-2"
              >
                  {() => (
                      <>
                        {uiText("components_shape_studio_modal.h3.edit_layer_text", " Edit Layer Text")}
                      </>
                    )}
              </CustomizableLabel>
              <textarea
                value={editingLayerText.text}
                onChange={(e) => setEditingLayerText({ ...editingLayerText, text: e.target.value })}
                className="w-full h-28 bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                placeholder={uiText("components_shape_studio_modal.textarea.enter_text.placeholder", "Enter text...")}
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <CustomizableButton
                  buttonId="shape_studio_modal_btn_187"
                  onClick={() => setEditingLayerText(null)}
className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                    {() => (
                        <>
                          {uiText("components_shape_studio_modal.button.cancel", "Cancel")}
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="shape_studio_modal_btn_186"
                  onClick={() => {
                    pushHistory();
                    updateActiveFrameData((prev = []) =>
                      (Array.isArray(prev) ? prev : []).map((l) =>
                        l.id === editingLayerText.id ? { ...l, text: editingLayerText.text } : l
                      )
                    );
                    setEditingLayerText(null);
                  }}
className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                    {() => (
                        <>
                          {uiText("components_shape_studio_modal.button.save_text", "Save Text")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>
          </div>
        )}

        {/* TOP NAVBAR */}
        <div className="h-14 px-4 bg-[#0a0d16] border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShapeStudioIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <CustomizableLabel
                labelId="shape_studio_modal_item_185"
                as="h1"
                className="font-bold text-base text-slate-100 tracking-wide flex items-center gap-2"
              >
                  {() => (
                      <>
                        {uiText("components_shape_studio_modal.h1.shapestudio", "ShapeStudio")}
                      </>
                    )}
              </CustomizableLabel>
            </div>
          </div>
          {slices && slices.length > 1 && (
            <div className="flex items-center gap-1.5 ml-4 bg-slate-900/50 px-2 py-1 rounded-lg border border-slate-800">
              <CustomizableButton
                buttonId="shape_studio_modal_btn_184"
                defaultIcon={<ChevronLeft className="w-4 h-4" />}
                type="button"
onClick={() => {
                  const next = activeIdx > 0 ? activeIdx - 1 : slices.length - 1;
                  setActiveIdx(next);
                  if (onNavigateFrame) onNavigateFrame(next);
                }}
className="p-1 hover:bg-slate-800 rounded-md text-slate-300 transition-colors cursor-pointer"
title={uiText("components_shape_studio_modal.button.previous_frame.title", "Previous Frame")}
              />
              <span className="text-xs font-bold font-mono text-slate-400 min-w-[50px] text-center">
                {activeIdx + 1} / {slices.length}
              </span>
              <CustomizableButton
                buttonId="shape_studio_modal_btn_183"
                defaultIcon={<ChevronRight className="w-4 h-4" />}
                type="button"
onClick={() => {
                  const next = activeIdx < slices.length - 1 ? activeIdx + 1 : 0;
                  setActiveIdx(next);
                  if (onNavigateFrame) onNavigateFrame(next);
                }}
className="p-1 hover:bg-slate-800 rounded-md text-slate-300 transition-colors cursor-pointer"
title={uiText("components_shape_studio_modal.button.next_frame.title", "Next Frame")}
              />

              {onDeleteFrame && (
                <>
                  <div className="w-px h-4 bg-slate-800 mx-1" />
                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_182"
                    defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                    type="button"
onClick={() => {
                      if (frameToDeleteIdx === activeIdx) {
                        const indexToDelete = activeIdx;
                        handleDeleteFrame(indexToDelete);
                        const nextIdx = activeIdx > 0 ? activeIdx - 1 : 0;
                        setActiveIdx(nextIdx);
                        if (onNavigateFrame) onNavigateFrame(nextIdx);
                        setFrameToDeleteIdx(null);
                        setToastNotice("✓ Frame deleted!");
                        setTimeout(() => setToastNotice(null), 2500);
                      } else {
                        setFrameToDeleteIdx(activeIdx);
                        setTimeout(() => setFrameToDeleteIdx(null), 3000);
                      }
                    }}
className={`p-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                      frameToDeleteIdx === activeIdx
                        ? "bg-rose-600 hover:bg-rose-500 text-white px-2 py-0.5 text-[10px] font-bold animate-pulse"
                        : "hover:bg-rose-950/40 text-rose-500 hover:text-rose-400"
                    }`}
title={frameToDeleteIdx === activeIdx ? "Click again to confirm delete" : "Delete Current Frame"}
                  >
                      {() => (
                          <>
                            {frameToDeleteIdx === activeIdx && <span>{uiText("components_shape_studio_modal.span.confirm", "Confirm?")}</span>}
                          </>
                        )}
                  </CustomizableButton>
                </>
              )}
            </div>
          )}

          {/* Center Stage Info & Zoom Controls */}
          <div className="flex items-center justify-between gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-800 text-xs h-[35px]">
            <span className="font-mono text-slate-400 text-[11px] whitespace-nowrap">
              {imgNaturalSize.width}×{imgNaturalSize.height}
            </span>
            <div className="w-px h-3.5 bg-slate-800" />
            <CustomizableButton
              buttonId="shape_studio_modal_btn_181"
              defaultIcon={<Maximize2 className="w-3 h-3" />}
              type="button"
onClick={handleFitToScreen}
className="px-2 py-0.5 bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/40 hover:border-indigo-500/60 font-bold rounded-lg text-[10px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 shadow-sm"
title={uiText("components_shape_studio_modal.button.fit_stage_to_screen_auto_fit_viewport_bounds.title", "Fit Stage to Screen (Auto-fit viewport bounds)")}
            >
                {() => (
                    <>
                      <span>{uiText("components_shape_studio_modal.span.fit", "Fit")}</span>
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="shape_studio_modal_btn_180"
              defaultIcon={<ZoomOut className="w-3.5 h-3.5" />}
              onClick={() => setZoomLevel((z) => Math.max(0.25, z - 0.15))}
className="p-1 hover:bg-slate-800 rounded text-slate-300 transition-colors cursor-pointer"
title={uiText("components_shape_studio_modal.button.zoom_out.title", "Zoom Out")}
            />
            <span className="font-mono font-bold text-indigo-400 min-w-[34px] text-center text-[11px]">
              {Math.round(zoomLevel * 100)}%
            </span>
            <CustomizableButton
              buttonId="shape_studio_modal_btn_179"
              defaultIcon={<ZoomIn className="w-3.5 h-3.5" />}
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.15))}
className="p-1 hover:bg-slate-800 rounded text-slate-300 transition-colors cursor-pointer"
title={uiText("components_shape_studio_modal.button.zoom_in.title", "Zoom In")}
            />
            <div className="w-px h-3.5 bg-slate-800" />
            <CustomizableButton
              buttonId="shape_studio_modal_btn_178"
              defaultIcon={<RotateCcw className="w-3 h-3" />}
              onClick={() => {
                pushHistory();
                setZoomLevel(1);
                setPanOffset({ x: 0, y: 0 });
                setActiveTool("pointer");
                setSelectedLayerIds([]);
                setOpenFlyout(null);
                updateActiveFrameData([], []);
                setToastNotice("Studio reset");
                setTimeout(() => setToastNotice(null), 2000);
              }}
className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 border border-rose-500/40 hover:border-rose-500/60 font-bold rounded-lg text-[10px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 shadow-sm"
title={uiText("components_shape_studio_modal.button.single_reset_button_reset_view_zoom_pan_sele.title", "Single Reset Button: Reset view (zoom/pan), selection, tool and frame drawings")}
            >
                {() => (
                    <>
                      <span>{uiText("components_shape_studio_modal.span.reset", "Reset")}</span>
                    </>
                  )}
            </CustomizableButton>
          </div>

          {/* Top Action Buttons */}
          <div className="flex items-center gap-2">
            <CustomizableButton
              buttonId="shape_studio_modal_btn_177"
              defaultIcon={<Undo2 className="w-4 h-4" />}
              onClick={handleUndo}
disabled={undoStack.length === 0}
className="h-[35px] w-[35px] flex items-center justify-center bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all cursor-pointer"
title={uiText("components_shape_studio_modal.button.undo_ctrl_z.title", "Undo (Ctrl+Z)")}
            />

            <CustomizableButton
              buttonId="shape_studio_modal_btn_176"
              defaultIcon={<Redo2 className="w-4 h-4" />}
              onClick={handleRedo}
disabled={redoStack.length === 0}
className="h-[35px] w-[35px] flex items-center justify-center bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all cursor-pointer"
title={uiText("components_shape_studio_modal.button.redo_ctrl_shift_z.title", "Redo (Ctrl+Shift+Z)")}
            />

            <CustomizableButton
              buttonId="shape_studio_modal_btn_175"
              defaultIcon={<SquarePlus className="w-4 h-4 shrink-0" />}
              onClick={handleSaveToNewFrame}
className="h-[35px] w-[35px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center cursor-pointer shrink-0"
title={uiText("components_shape_studio_modal.button.new_frame.title", "New Frame")}
            />

            <CustomizableButton
              buttonId="shape_studio_modal_btn_174"
              defaultIcon={<Flame className="w-4 h-4 shrink-0" />}
              onClick={handleApplyToCurrentFrame}
className="h-[35px] w-[35px] bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center cursor-pointer shrink-0"
title={uiText("components_shape_studio_modal.button.bake_frame.title", "Bake Frame")}
            />

            <CustomizableButton
              buttonId="shape_studio_modal_btn_173"
              defaultIcon={<CheckCheck className="w-4 h-4 shrink-0" />}
              onClick={handleBakeAllFrames}
className="h-[35px] w-[35px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center cursor-pointer shrink-0"
title={uiText("components_shape_studio_modal.button.bake_and_close.title", "Bake & Close")}
            />

            <CustomizableButton
              buttonId="shape_studio_modal_btn_172"
              defaultIcon={<Layers className="w-4 h-4" />}
              id="ss3-toolbar-toggle-btn"
onClick={() => setIsRightSidebarOpen((v) => !v)}
className={`h-[35px] w-[35px] flex items-center justify-center bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-200 transition-all cursor-pointer ${
                isRightSidebarOpen ? "text-indigo-400 border-indigo-500/40 bg-indigo-950/30 shadow-sm" : ""
              }`}
title={isRightSidebarOpen ? "Hide Shape & Layer Studio" : "Show Shape & Layer Studio"}
            />

            <div className="w-px h-5 bg-slate-800 mx-1" />

            <CustomizableButton
              buttonId="shape_studio_modal_btn_171"
              defaultIcon={<X className="w-5 h-5" />}
              onClick={onClose}
className="p-2 hover:bg-rose-950/80 hover:text-rose-400 text-slate-400 rounded-xl transition-colors cursor-pointer"
            />
          </div>
        </div>

        {/* MAIN BODY LAYOUT */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* LEFT VERTICAL TOOLBAR */}
          <div id="ss1" className="w-[60px] h-[400px] bg-[#080b13] border-r border-[#86fb11]/40 flex flex-col items-center py-2 gap-1.5 shrink-0 z-30 relative my-auto">
            {/* 1. Advanced Retouch Panel Toggle (Moved to Very Top) */}
            <CustomizableButton
              buttonId="shape_studio_modal_btn_170"
              defaultIcon={<Sparkles className="w-5 h-5" />}
              type="button"
onClick={() => {
                const newState = !isAdvancedPanelOpen;
                setIsAdvancedPanelOpen(newState);
                setOpenFlyout(null);
                if (newState) {
                  setActiveTool("sprayCan");
                  setIsRightSidebarOpen(false);
                } else {
                  setActiveTool("pointer");
                  setIsRightSidebarOpen(true);
                }
              }}
className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                isAdvancedPanelOpen || activeTool === "smudge" || activeTool === "sprayCan" || activeTool === "blur" || activeTool === "polygonSelection" || activeTool === "patch" || activeTool === "canvasSize" || activeTool === "chromaKey"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-indigo-400"
              }`}
title={uiText("components_shape_studio_modal.button.advanced_retouch_tools_spray_can_blur_polygo.title", "Advanced Retouch Tools: Spray Can, Blur, Polygon Clone, and Patch Tool Panel")}
            />

            {/* 2. Shapes Tool (Triggers DRAWING SHAPES Flyout Panel) */}
            <CustomizableButton
              buttonId="shape_studio_modal_btn_169"
              defaultIcon={<Shapes className="w-5 h-5" />}
              onClick={() => {
                setActiveTool("shapes");
                handleOpenFlyout(openFlyout === "shapes" ? null : "shapes");
              }}
className={`p-2.5 rounded-xl transition-all cursor-pointer relative ${
                activeTool === "shapes" || openFlyout === "shapes"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
title={uiText("components_shape_studio_modal.button.drawing_shapes_menu_u.title", "Drawing Shapes Menu (U)")}
            />

            {/* 2B. Lines & Arrows Tool */}
            <CustomizableButton
              buttonId="shape_studio_modal_btn_168"
              defaultIcon={<ArrowRight className={`w-5 h-5 ${activeTool === "lines" || openFlyout === "lines" ? "text-white" : "text-emerald-400"}`} />}
              onClick={() => {
                setActiveTool("lines");
                handleOpenFlyout(openFlyout === "lines" ? null : "lines");
              }}
className={`p-2.5 rounded-xl transition-all cursor-pointer relative ${
                activeTool === "lines" || openFlyout === "lines"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
title={uiText("components_shape_studio_modal.button.lines_and_arrows_menu.title", "Lines & Arrows Menu")}
            />
 
            {/* 3. Pen / Freehand Brush Tool */}
            <CustomizableButton
              buttonId="shape_studio_modal_btn_167"
              defaultIcon={<Pencil className="w-5 h-5" />}
              onClick={() => {
                setActiveTool("brush");
                handleOpenFlyout(openFlyout === "pen" ? null : "pen");
              }}
className={`p-2.5 rounded-xl transition-all cursor-pointer relative ${
                activeTool === "brush" || openFlyout === "pen"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
title={uiText("components_shape_studio_modal.button.pen_brush_tool_p.title", "Pen / Brush Tool (P)")}
            />
 
            {/* 4. Circular Active Color Patch Block */}
            <CustomizableButton
              buttonId="shape_studio_modal_btn_166"
              onClick={() => handleOpenFlyout(openFlyout === "color" ? null : "color")}
className={`p-1.5 rounded-full border-2 transition-all cursor-pointer relative group ${
                openFlyout === "color"
                  ? "border-indigo-400 scale-110 shadow-lg shadow-indigo-500/40"
                  : "border-slate-700 hover:border-slate-400 hover:scale-105"
              }`}
title={uiText("components_shape_studio_modal.button.active_color_preview_patch_click_for_color_p.title", "Active Color Preview Patch - Click for Color Picker")}
            >
                {() => (
                    <>
                      <div
                className="w-7 h-7 rounded-full border border-white/20 shadow-inner transition-transform group-hover:scale-105"
                style={{ backgroundColor: brushColor }}
              />
                    </>
                  )}
            </CustomizableButton>
 
            {/* 7. Crop Tool */}
            <CustomizableButton
              buttonId="shape_studio_modal_btn_165"
              defaultIcon={<CropIcon className="w-5 h-5" />}
              onClick={() => {
                setActiveTool("crop");
                setIsRightSidebarOpen(true);
                setIsVisibilityOpen(true);
                setOpenFlyout(null);
              }}
className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                activeTool === "crop"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 text-cyan-300"
                  : "text-slate-400 hover:bg-slate-800 hover:text-cyan-400"
              }`}
title={uiText("components_shape_studio_modal.button.crop_frame_tool_c.title", "Crop Frame Tool (C)")}
            />
 
            <div className="w-8 h-px bg-slate-800/80 my-1" />
 
            {/* Bottom Actions: Selection & Cutout Tools (Magic Wand, Vector Pen, Clone Area, Select & Resize) */}
            <CustomizableButton
              buttonId="shape_studio_modal_btn_164"
              onClick={() => {
                if (activeTool !== "magicWand" && activeTool !== "pen" && activeTool !== "marquee" && activeTool !== "selectResize") {
                  setActiveTool("selectResize");
                }
                handleOpenFlyout(openFlyout === "selection" ? null : "selection");
              }}
className={`p-2.5 rounded-xl transition-all cursor-pointer relative ${
                activeTool === "magicWand" || activeTool === "pen" || activeTool === "marquee" || activeTool === "selectResize" || openFlyout === "selection"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-purple-400"
              }`}
title={uiText("components_shape_studio_modal.button.selection_and_cutout_menu_magic_wand_w_vecto.title", "Selection & Cutout Menu: Magic Wand (W), Vector Pen & Lasso, Clone Area (Ctrl+D), and Select & Resize")}
            >
                {() => (
                    <>
                      {activeTool === "marquee" ? (
                <BoxSelect className="w-5 h-5 text-amber-300" />
              ) : activeTool === "pen" ? (
                <Scissors className="w-5 h-5 text-rose-300" />
              ) : activeTool === "selectResize" ? (
                <Scaling className="w-5 h-5 text-cyan-300" />
              ) : (
                <Wand2 className={`w-5 h-5 ${activeTool === "magicWand" || openFlyout === "selection" ? "text-white" : "text-purple-400"}`} />
              )}
                    </>
                  )}
            </CustomizableButton>

            {/* ==================== FLYOUT PANELS ==================== */}

            {/* FLYOUT 1: DRAWING SHAPES PANEL (Matching Reference Image) */}
            {openFlyout === "shapes" && (
              <div
                style={{ left: shapesFlyoutPos.x, top: shapesFlyoutPos.y }}
                className="absolute bg-[#0d1222] border border-indigo-500/30 rounded-2xl p-4 shadow-2xl z-50 w-64 text-slate-100 backdrop-blur-2xl animate-fade-in flex flex-col gap-2"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div 
                  className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-1 cursor-move"
                  onPointerDown={(e) => {
                    setIsDraggingShapesFlyout(true);
                    setShapesFlyoutDragStart({ x: e.clientX - shapesFlyoutPos.x, y: e.clientY - shapesFlyoutPos.y });
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (isDraggingShapesFlyout) {
                      setShapesFlyoutPos({
                        x: e.clientX - shapesFlyoutDragStart.x,
                        y: e.clientY - shapesFlyoutDragStart.y
                      });
                    }
                  }}
                  onPointerUp={(e) => {
                    setIsDraggingShapesFlyout(false);
                    try {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    } catch {}
                  }}
                >
                  <span className="text-[11px] font-extrabold tracking-wider text-emerald-400 flex items-center gap-1.5 select-none pointer-events-none">
                    <Shapes className="w-3.5 h-3.5 text-emerald-400" />
                    {uiText("components_shape_studio_modal.span.drawing_shapes", "Drawing shapes")}
                  </span>
                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_163"
                    defaultIcon={<X className="w-4 h-4" />}
                    onClick={() => setOpenFlyout(null)}
onPointerDown={(e) => e.stopPropagation()}
className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  />
                </div>

                <CustomizableButton
                  buttonId="shape_studio_modal_btn_162"
                  defaultIcon={<Square className={`w-4 h-4 ${selectedShapePreset === "rect_outline" ? "text-white" : "text-emerald-400"}`} />}
                  onClick={() => {
                    setSelectedShapePreset("rect_outline");
                    handleAddShapePreset("rect_outline");
                  }}
className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer text-left ${
                    selectedShapePreset === "rect_outline"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                  }`}
                >
                    {() => (
                        <>
                          <span>{uiText("components_shape_studio_modal.span.box_outline", "Box (outline)")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="shape_studio_modal_btn_161"
                  onClick={() => {
                    setSelectedShapePreset("rect_filled");
                    handleAddShapePreset("rect_filled");
                  }}
className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer text-left ${
                    selectedShapePreset === "rect_filled"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                  }`}
                >
                    {() => (
                        <>
                          <div className={`w-3.5 h-3.5 rounded-sm ${selectedShapePreset === "rect_filled" ? "bg-white" : "bg-emerald-400"}`} />
                        <span>{uiText("components_shape_studio_modal.span.filled_box", "Filled box")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="shape_studio_modal_btn_160"
                  defaultIcon={<Circle className={`w-4 h-4 ${selectedShapePreset === "circle_outline" ? "text-white" : "text-emerald-400"}`} />}
                  onClick={() => {
                    setSelectedShapePreset("circle_outline");
                    handleAddShapePreset("circle_outline");
                  }}
className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer text-left ${
                    selectedShapePreset === "circle_outline"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                  }`}
                >
                    {() => (
                        <>
                          <span>{uiText("components_shape_studio_modal.span.circle_outline", "Circle (outline)")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="shape_studio_modal_btn_159"
                  onClick={() => {
                    setSelectedShapePreset("circle_filled");
                    handleAddShapePreset("circle_filled");
                  }}
className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer text-left ${
                    selectedShapePreset === "circle_filled"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                  }`}
                >
                    {() => (
                        <>
                          <div className={`w-3.5 h-3.5 rounded-full ${selectedShapePreset === "circle_filled" ? "bg-white" : "bg-emerald-400"}`} />
                        <span>{uiText("components_shape_studio_modal.span.filled_circle", "Filled circle")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="shape_studio_modal_btn_158"
                  defaultIcon={<Star className={`w-4 h-4 ${selectedShapePreset === "star" ? "text-white fill-white" : "text-amber-400 fill-amber-400"}`} />}
                  onClick={() => {
                    setSelectedShapePreset("star");
                    handleAddShapePreset("star");
                  }}
className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer text-left ${
                    selectedShapePreset === "star"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                  }`}
                >
                    {() => (
                        <>
                          <span>{uiText("components_shape_studio_modal.span.star", "Star")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="shape_studio_modal_btn_157"
                  defaultIcon={<MessageSquare className={`w-4 h-4 ${selectedShapePreset === "bubble" ? "text-white" : "text-indigo-400"}`} />}
                  onClick={() => {
                    setSelectedShapePreset("bubble");
                    handleAddShapePreset("bubble");
                  }}
className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer text-left ${
                    selectedShapePreset === "bubble"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                  }`}
                >
                    {() => (
                        <>
                          <span>{uiText("components_shape_studio_modal.span.speech_bubble", "Speech bubble")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            )}

            {/* FLYOUT 1B: LINES & ARROWS PANEL */}
            {openFlyout === "lines" && (
              <div
                style={{ left: linesFlyoutPos.x, top: linesFlyoutPos.y }}
                className="absolute bg-[#0d1222] border border-indigo-500/30 rounded-2xl p-4 shadow-2xl z-50 w-64 text-slate-100 backdrop-blur-2xl animate-fade-in flex flex-col gap-2"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div 
                  className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-1 cursor-move"
                  onPointerDown={(e) => {
                    setIsDraggingLinesFlyout(true);
                    setLinesFlyoutDragStart({ x: e.clientX - linesFlyoutPos.x, y: e.clientY - linesFlyoutPos.y });
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (isDraggingLinesFlyout) {
                      setLinesFlyoutPos({
                        x: e.clientX - linesFlyoutDragStart.x,
                        y: e.clientY - linesFlyoutDragStart.y
                      });
                    }
                  }}
                  onPointerUp={(e) => {
                    setIsDraggingLinesFlyout(false);
                    try {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    } catch {}
                  }}
                >
                  <span className="text-[11px] font-extrabold tracking-wider text-emerald-400 flex items-center gap-1.5 select-none pointer-events-none">
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    {uiText("components_shape_studio_modal.span.lines_and_arrows", "Lines & arrows")}
                  </span>
                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_156"
                    defaultIcon={<X className="w-4 h-4" />}
                    onClick={() => setOpenFlyout(null)}
onPointerDown={(e) => e.stopPropagation()}
className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  />
                </div>

                {/* Canvas Interactive Drawing Mode */}
                <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-800/60">
                  <span className="text-[10px] font-bold tracking-wide text-slate-400">{uiText("components_shape_studio_modal.span.drawing_mode", "Drawing mode")}</span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_155"
                      onClick={() => {
                        setBrushLineMode("freehand");
                        setActiveTool("lines");
                      }}
className={`py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                        brushLineMode === "freehand" && activeTool === "lines"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      }`}
                    >
                        {() => (
                            <>
                              {uiText("components_shape_studio_modal.button.freehand", "Freehand")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_154"
                      onClick={() => {
                        setBrushLineMode("straight");
                        setActiveTool("lines");
                      }}
className={`py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                        brushLineMode === "straight" && activeTool === "lines"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      }`}
                    >
                        {() => (
                            <>
                              {uiText("components_shape_studio_modal.button.straight", "Straight")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_153"
                      onClick={() => {
                        setBrushLineMode("continuous_straight");
                        setActiveTool("lines");
                      }}
className={`py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                        brushLineMode === "continuous_straight" && activeTool === "lines"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      }`}
                    >
                        {() => (
                            <>
                              {uiText("components_shape_studio_modal.button.continuous", "Continuous")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>

                  {/* Draw Arrowhead Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold tracking-wide text-slate-400 flex items-center gap-1.5">
                      <CornerUpRight className="w-3.5 h-3.5 text-indigo-400" />
                      {uiText("components_shape_studio_modal.span.draw_arrowhead", "Draw arrowhead")}
                    </span>
                    <CustomizableLabel
                      labelId="shape_studio_modal_item_152"
                      as="label"
                      className="relative inline-flex items-center cursor-pointer"
                    >
                        {() => (
                            <>
                              <input
                        type="checkbox"
                        checked={brushArrowEnd}
                        onChange={(e) => setBrushArrowEnd(e.target.checked)}
                        className="sr-only peer"
                      />
                            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                            </>
                          )}
                    </CustomizableLabel>
                  </div>
                </div>

                {/* Quick 1-Click Arrow Draw Presets */}
                <div className="flex flex-col gap-1 pb-2 border-b border-slate-800/60">
                  <span className="text-[10px] font-bold tracking-wide text-slate-400">{uiText("components_shape_studio_modal.span.draw_1_arrow_directly", "Draw 1 arrow directly:")}</span>
                  <div className="grid grid-cols-3 gap-1">
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_151"
                      defaultIcon={<Pencil className="w-3 h-3 text-emerald-400" />}
                      onClick={() => {
                        setBrushLineMode("freehand");
                        setBrushArrowEnd(true);
                        setActiveTool("lines");
                      }}
className={`p-1.5 rounded-lg border text-[9.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        brushLineMode === "freehand" && brushArrowEnd && activeTool === "lines"
                          ? "bg-indigo-600 text-white border-indigo-400 shadow"
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                      }`}
title={uiText("components_shape_studio_modal.button.draw_1_freehand_arrow.title", "Draw 1 Freehand Arrow")}
                    >
                        {() => (
                            <>
                              {uiText("components_shape_studio_modal.button.freehand_2", "Freehand")}
                            </>
                          )}
                    </CustomizableButton>

                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_150"
                      defaultIcon={<ArrowRight className="w-3 h-3 text-emerald-400" />}
                      onClick={() => {
                        setBrushLineMode("straight");
                        setBrushArrowEnd(true);
                        setActiveTool("lines");
                      }}
className={`p-1.5 rounded-lg border text-[9.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        brushLineMode === "straight" && brushArrowEnd && activeTool === "lines"
                          ? "bg-indigo-600 text-white border-indigo-400 shadow"
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                      }`}
title={uiText("components_shape_studio_modal.button.draw_1_straight_arrow.title", "Draw 1 Straight Arrow")}
                    >
                        {() => (
                            <>
                              {uiText("components_shape_studio_modal.button.straight_2", "Straight")}
                            </>
                          )}
                    </CustomizableButton>

                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_149"
                      defaultIcon={<ChevronsRight className="w-3 h-3 text-emerald-400" />}
                      onClick={() => {
                        setBrushLineMode("continuous_straight");
                        setBrushArrowEnd(true);
                        setActiveTool("lines");
                      }}
className={`p-1.5 rounded-lg border text-[9.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        brushLineMode === "continuous_straight" && brushArrowEnd && activeTool === "lines"
                          ? "bg-indigo-600 text-white border-indigo-400 shadow"
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                      }`}
title={uiText("components_shape_studio_modal.button.draw_1_continuous_arrow.title", "Draw 1 Continuous Arrow")}
                    >
                        {() => (
                            <>
                              {uiText("components_shape_studio_modal.button.continuous_2", "Continuous")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold tracking-wide text-slate-400">{uiText("components_shape_studio_modal.span.add_preset_layer", "Add preset layer:")}</span>

                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_148"
                    defaultIcon={<Minus className={`w-3.5 h-3.5 ${selectedShapePreset === "line" ? "text-white" : "text-emerald-400"}`} />}
                    onClick={() => {
                      setSelectedShapePreset("line");
                      handleAddShapePreset("line");
                    }}
className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                      selectedShapePreset === "line"
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                    }`}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_shape_studio_modal.span.straight_line", "Straight line")}</span>
                          </>
                        )}
                  </CustomizableButton>

                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_147"
                    defaultIcon={<ArrowRight className={`w-3.5 h-3.5 ${selectedShapePreset === "arrow" ? "text-white" : "text-emerald-400"}`} />}
                    onClick={() => {
                      setSelectedShapePreset("arrow");
                      handleAddShapePreset("arrow");
                    }}
className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                      selectedShapePreset === "arrow"
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                    }`}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_shape_studio_modal.span.straight_arrow_layer", "Straight arrow layer")}</span>
                          </>
                        )}
                  </CustomizableButton>

                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_146"
                    defaultIcon={<CornerUpRight className={`w-3.5 h-3.5 ${selectedShapePreset === "curvedArrow" ? "text-white" : "text-emerald-400"}`} />}
                    onClick={() => {
                      setSelectedShapePreset("curvedArrow");
                      handleAddShapePreset("curvedArrow");
                    }}
className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                      selectedShapePreset === "curvedArrow"
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                    }`}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_shape_studio_modal.span.curved_arrow_right", "Curved arrow right")}</span>
                          </>
                        )}
                  </CustomizableButton>

                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_145"
                    defaultIcon={<CornerUpLeft className={`w-3.5 h-3.5 ${selectedShapePreset === "curvedArrowLeft" ? "text-white" : "text-emerald-400"}`} />}
                    onClick={() => {
                      setSelectedShapePreset("curvedArrowLeft");
                      handleAddShapePreset("curvedArrowLeft");
                    }}
className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                      selectedShapePreset === "curvedArrowLeft"
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                    }`}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_shape_studio_modal.span.curved_arrow_left", "Curved arrow left")}</span>
                          </>
                        )}
                  </CustomizableButton>

                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_144"
                    defaultIcon={<ArrowLeftRight className={`w-3.5 h-3.5 ${selectedShapePreset === "doubleArrow" ? "text-white" : "text-emerald-400"}`} />}
                    onClick={() => {
                      setSelectedShapePreset("doubleArrow");
                      handleAddShapePreset("doubleArrow");
                    }}
className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                      selectedShapePreset === "doubleArrow"
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                    }`}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_shape_studio_modal.span.double_arrow", "Double arrow")}</span>
                          </>
                        )}
                  </CustomizableButton>

                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_143"
                    defaultIcon={<ChevronsRight className={`w-3.5 h-3.5 ${selectedShapePreset === "tripleArrow" ? "text-white" : "text-emerald-400"}`} />}
                    onClick={() => {
                      setSelectedShapePreset("tripleArrow");
                      handleAddShapePreset("tripleArrow");
                    }}
className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                      selectedShapePreset === "tripleArrow"
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                    }`}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_shape_studio_modal.span.triple_arrow", "Triple arrow")}</span>
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>
            )}

            {/* FLYOUT 2: PEN / FREEHAND BRUSH CONFIG (20% smaller w-[230px]) */}
            {openFlyout === "pen" && (
              <div
                style={{ left: penFlyoutPos.x, top: penFlyoutPos.y }}
                className="absolute bg-[#0d1222] border border-indigo-500/30 rounded-2xl p-2.5 shadow-2xl z-50 w-[230px] text-slate-100 backdrop-blur-2xl animate-fade-in flex flex-col gap-2"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div 
                  className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 cursor-move"
                  onPointerDown={(e) => {
                    setIsDraggingPenFlyout(true);
                    setPenFlyoutDragStart({ x: e.clientX - penFlyoutPos.x, y: e.clientY - penFlyoutPos.y });
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (isDraggingPenFlyout) {
                      setPenFlyoutPos({
                        x: e.clientX - penFlyoutDragStart.x,
                        y: e.clientY - penFlyoutDragStart.y
                      });
                    }
                  }}
                  onPointerUp={(e) => {
                    setIsDraggingPenFlyout(false);
                    try {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    } catch {}
                  }}
                >
                  <span className="text-[10px] font-extrabold tracking-wider text-emerald-400 flex items-center gap-1 select-none pointer-events-none">
                    <Paintbrush className="w-3.5 h-3.5 text-emerald-400" />
                    {uiText("components_shape_studio_modal.span.pen_and_brush_config", "Pen & brush config")}
                  </span>
                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_142"
                    defaultIcon={<X className="w-3.5 h-3.5" />}
                    onClick={() => setOpenFlyout(null)}
onPointerDown={(e) => e.stopPropagation()}
className="p-0.5 text-slate-400 hover:text-white rounded cursor-pointer"
                  />
                </div>

                {/* Tool Selector Grid (Brush, Pen, Marker, Spray, Smudge, Blur) */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold tracking-wide text-slate-400">{uiText("components_shape_studio_modal.span.brush_and_pen_tools", "Brush & pen tools")}</span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_141"
                      defaultIcon={<Paintbrush className="w-2.5 h-2.5 text-emerald-400" />}
                      type="button"
onClick={() => {
                        setActiveTool("brush");
                        setPenShape("standard");
                        setBrushOpacity(0.85);
                      }}
className={`py-1 px-1 text-[9px] font-bold rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        activeTool === "brush" && penShape === "standard" && brushOpacity < 0.95
                          ? "bg-emerald-600 text-white shadow"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      }`}
title={uiText("components_shape_studio_modal.button.soft_artistic_brush.title", "Soft Artistic Brush")}
                    >
                        {() => (
                            <>
                              {uiText("components_shape_studio_modal.button.brush", "Brush")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_140"
                      defaultIcon={<Pencil className="w-2.5 h-2.5 text-indigo-400" />}
                      type="button"
onClick={() => {
                        setActiveTool("brush");
                        setPenShape("standard");
                        setBrushOpacity(1);
                      }}
className={`py-1 px-1 text-[9px] font-bold rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        activeTool === "brush" && penShape === "standard" && brushOpacity >= 0.95
                          ? "bg-indigo-600 text-white shadow"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      }`}
title={uiText("components_shape_studio_modal.button.solid_ink_pen.title", "Solid Ink Pen")}
                    >
                        {() => (
                            <>
                              {uiText("components_shape_studio_modal.button.pen", "Pen")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_139"
                      defaultIcon={<Highlighter className="w-2.5 h-2.5 text-amber-400" />}
                      type="button"
onClick={() => {
                        setActiveTool("brush");
                        setPenShape("standard");
                        setBrushOpacity(0.45);
                        setBrushWidth(12);
                      }}
className={`py-1 px-1 text-[9px] font-bold rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        activeTool === "brush" && brushOpacity <= 0.5
                          ? "bg-amber-600 text-white shadow"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      }`}
title={uiText("components_shape_studio_modal.button.semi_transparent_marker_highlighter.title", "Semi-transparent Marker / Highlighter")}
                    >
                        {() => (
                            <>
                              {uiText("components_shape_studio_modal.button.marker", "Marker")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_138"
                      defaultIcon={<Wind className="w-2.5 h-2.5 text-cyan-400" />}
                      type="button"
onClick={() => setActiveTool("sprayCan")}
className={`py-1 px-1 text-[9px] font-bold rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        activeTool === "sprayCan"
                          ? "bg-cyan-600 text-white shadow"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      }`}
title={uiText("components_shape_studio_modal.button.spray_can.title", "Spray Can")}
                    >
                        {() => (
                            <>
                              {uiText("components_shape_studio_modal.button.spray", "Spray")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_137"
                      defaultIcon={<Droplet className="w-2.5 h-2.5 text-rose-400" />}
                      type="button"
onClick={() => setActiveTool("smudge")}
className={`py-1 px-1 text-[9px] font-bold rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        activeTool === "smudge"
                          ? "bg-rose-600 text-white shadow"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      }`}
title={uiText("components_shape_studio_modal.button.smudge_blend_tool.title", "Smudge Blend Tool")}
                    >
                        {() => (
                            <>
                              {uiText("components_shape_studio_modal.button.smudge", "Smudge")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_136"
                      defaultIcon={<Cloud className="w-2.5 h-2.5 text-blue-400" />}
                      type="button"
onClick={() => setActiveTool("blur")}
className={`py-1 px-1 text-[9px] font-bold rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        activeTool === "blur"
                          ? "bg-blue-600 text-white shadow"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      }`}
title={uiText("components_shape_studio_modal.button.blur_brush_tool.title", "Blur Brush Tool")}
                    >
                        {() => (
                            <>
                              {uiText("components_shape_studio_modal.button.blur", "Blur")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                </div>

                {/* Brush Line Mode */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold tracking-wide text-slate-400">{uiText("components_shape_studio_modal.span.drawing_mode_2", "Drawing mode")}</span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_135"
                      onClick={() => setBrushLineMode("freehand")}
className={`py-0.5 text-[9px] font-bold rounded transition-colors cursor-pointer ${
                        brushLineMode === "freehand"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      }`}
                    >
                        {() => (
                            <>
                              {uiText("components_shape_studio_modal.button.freehand_3", "Freehand")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_134"
                      onClick={() => setBrushLineMode("straight")}
className={`py-0.5 text-[9px] font-bold rounded transition-colors cursor-pointer ${
                        brushLineMode === "straight"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      }`}
                    >
                        {() => (
                            <>
                              {uiText("components_shape_studio_modal.button.straight_3", "Straight")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_133"
                      onClick={() => setBrushLineMode("continuous_straight")}
className={`py-0.5 text-[9px] font-bold rounded transition-colors cursor-pointer ${
                        brushLineMode === "continuous_straight"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      }`}
                    >
                        {() => (
                            <>
                              {uiText("components_shape_studio_modal.button.continuous_3", "Continuous")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                </div>

                {/* Brush Width / Thickness */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[9px] font-bold tracking-wide text-slate-400">
                    <span>{uiText("components_shape_studio_modal.span.size_thickness", "Size / thickness")}</span>
                    <span className="font-mono text-emerald-400 text-[10px] bg-slate-950 px-1 py-0.5 rounded border border-slate-800">{brushWidth}{uiText("components_shape_studio_modal.span.px", "px")}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushWidth}
                    onChange={(e) => setBrushWidth(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                  />
                  {/* Presets */}
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {THICKNESS_PRESETS.map((t) => (
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_132"
                        key={t}
onClick={() => setBrushWidth(t)}
className={`px-1 py-0.5 rounded text-[9px] font-mono border cursor-pointer transition-all ${
                          brushWidth === t
                            ? "bg-indigo-600 text-white border-indigo-400"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                          {() => (
                              <>
                                {t}
                              </>
                            )}
                      </CustomizableButton>
                    ))}
                  </div>
                </div>

                {/* Brush Opacity */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[9px] font-bold tracking-wide text-slate-400">
                    <span>{uiText("components_shape_studio_modal.span.opacity", "Opacity")}</span>
                    <span className="font-mono text-emerald-400 text-[10px] bg-slate-950 px-1 py-0.5 rounded border border-slate-800">{Math.round(brushOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={brushOpacity}
                    onChange={(e) => setBrushOpacity(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Foldable Shape Stamp Pen Section */}
                <div className="border border-slate-800/80 bg-slate-950/60 rounded-xl overflow-hidden mt-0.5">
                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_131"
                    type="button"
onClick={() => setIsPenShapesOpen((v) => !v)}
className="w-full px-2 py-1 flex items-center justify-between text-[9px] font-bold tracking-wider text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                      {() => (
                          <>
                            <span className="flex items-center gap-1 text-indigo-400">
                      <Shapes className="w-3 h-3 text-indigo-400" />
                      {uiText("components_shape_studio_modal.span.shape_stamp_styles", "Shape stamp styles")}
                    </span>
                          {isPenShapesOpen ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
                          </>
                        )}
                  </CustomizableButton>

                  {isPenShapesOpen && (
                    <div className="p-1.5 pt-0 grid grid-cols-2 gap-1">
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_130"
                        defaultIcon={<Pencil className="w-2.5 h-2.5 text-indigo-400 shrink-0" />}
                        type="button"
onClick={() => setPenShape("standard")}
className={`p-1 rounded-lg border text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          penShape === "standard"
                            ? "bg-indigo-600 text-white border-indigo-400 shadow"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                        }`}
                      >
                          {() => (
                              <>
                                {uiText("components_shape_studio_modal.button.standard", "Standard")}
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_129"
                        defaultIcon={<Circle className="w-2.5 h-2.5 text-emerald-400 shrink-0" />}
                        type="button"
onClick={() => setPenShape("dots")}
className={`p-1 rounded-lg border text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          penShape === "dots"
                            ? "bg-indigo-600 text-white border-indigo-400 shadow"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                        }`}
                      >
                          {() => (
                              <>
                                {uiText("components_shape_studio_modal.button.dots", "Dots")}
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_128"
                        defaultIcon={<Star className="w-2.5 h-2.5 text-amber-400 shrink-0 fill-amber-400/30" />}
                        type="button"
onClick={() => setPenShape("stars")}
className={`p-1 rounded-lg border text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          penShape === "stars"
                            ? "bg-indigo-600 text-white border-indigo-400 shadow"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                        }`}
                      >
                          {() => (
                              <>
                                {uiText("components_shape_studio_modal.button.stars", "Stars ⭐")}
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_127"
                        type="button"
onClick={() => setPenShape("cars")}
className={`p-1 rounded-lg border text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          penShape === "cars"
                            ? "bg-indigo-600 text-white border-indigo-400 shadow"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                        }`}
                      >
                          {() => (
                              <>
                                <span className="text-[10px] shrink-0">🚗</span>
                              {uiText("components_shape_studio_modal.button.cars", "Cars")}
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_126"
                        defaultIcon={<Heart className="w-2.5 h-2.5 text-rose-400 shrink-0 fill-rose-400/30" />}
                        type="button"
onClick={() => setPenShape("hearts")}
className={`p-1 rounded-lg border text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          penShape === "hearts"
                            ? "bg-indigo-600 text-white border-indigo-400 shadow"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                        }`}
                      >
                          {() => (
                              <>
                                {uiText("components_shape_studio_modal.button.hearts", "Hearts ❤️")}
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_125"
                        defaultIcon={<Sparkles className="w-2.5 h-2.5 text-cyan-400 shrink-0" />}
                        type="button"
onClick={() => setPenShape("sparkles")}
className={`p-1 rounded-lg border text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          penShape === "sparkles"
                            ? "bg-indigo-600 text-white border-indigo-400 shadow"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                        }`}
                      >
                          {() => (
                              <>
                                {uiText("components_shape_studio_modal.button.sparkles", "Sparkles ✨")}
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_124"
                        defaultIcon={<ArrowRight className="w-2.5 h-2.5 text-indigo-400 shrink-0" />}
                        type="button"
onClick={() => setPenShape("arrows")}
className={`p-1 rounded-lg border text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer col-span-2 ${
                          penShape === "arrows"
                            ? "bg-indigo-600 text-white border-indigo-400 shadow"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                        }`}
                      >
                          {() => (
                              <>
                                {uiText("components_shape_studio_modal.button.arrow_path", "Arrow path ➔")}
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  )}
                </div>

                {/* Arrowhead toggle */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-0.5">
                  <span className="text-[9px] font-bold tracking-wide text-slate-400 flex items-center gap-1">
                    <CornerUpRight className="w-3 h-3 text-indigo-400" />
                    {uiText("components_shape_studio_modal.span.arrowheads", "Arrowheads")}
                  </span>
                  <CustomizableLabel
                    labelId="shape_studio_modal_item_123"
                    as="label"
                    className="relative inline-flex items-center cursor-pointer"
                  >
                      {() => (
                          <>
                            <input
                      type="checkbox"
                      checked={brushArrowEnd}
                      onChange={(e) => setBrushArrowEnd(e.target.checked)}
                      className="sr-only peer"
                    />
                          <div className="w-7 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                          </>
                        )}
                  </CustomizableLabel>
                </div>

                {/* Save Current Pen/Brush Stroke to Assets */}
                <CustomizableButton
                  buttonId="shape_studio_modal_btn_122"
                  defaultIcon={<Bookmark className="w-3 h-3" />}
                  type="button"
disabled={currentFreehandLines.length === 0}
onClick={() => {
                    const lastLine = currentFreehandLines[currentFreehandLines.length - 1];
                    if (lastLine) {
                      handleSaveLineAsAsset(lastLine);
                    }
                  }}
className="w-full mt-0.5 py-1 px-2 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-30 border border-amber-500/40 text-amber-300 font-bold text-[9px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                >
                    {() => (
                        <>
                          {uiText("components_shape_studio_modal.button.save_last_stroke_to_assets", "Save last stroke to assets")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            )}

            {/* FLYOUT: UNIFIED SELECTION & CUTOUT PANEL (Magic Wand, Vector Pen & Lasso, Clone Area) */}
            {(openFlyout === "selection" || openFlyout === "vectorPen") && (
              <div
                style={{ left: selectionFlyoutPos.x, top: selectionFlyoutPos.y }}
                className="absolute bg-[#0d1222] border border-purple-500/30 rounded-2xl p-3.5 shadow-2xl z-50 w-80 text-slate-100 backdrop-blur-2xl animate-fade-in flex flex-col gap-3"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Draggable Header */}
                <div 
                  className="flex items-center justify-between border-b border-slate-800/80 pb-2 cursor-move select-none"
                  onPointerDown={(e) => {
                    setIsDraggingSelectionFlyout(true);
                    setSelectionFlyoutDragStart({ x: e.clientX - selectionFlyoutPos.x, y: e.clientY - selectionFlyoutPos.y });
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (isDraggingSelectionFlyout) {
                      setSelectionFlyoutPos({
                        x: e.clientX - selectionFlyoutDragStart.x,
                        y: e.clientY - selectionFlyoutDragStart.y
                      });
                    }
                  }}
                  onPointerUp={(e) => {
                    setIsDraggingSelectionFlyout(false);
                    try {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    } catch {}
                  }}
                >
                  <span className="text-[11px] font-extrabold tracking-wider text-purple-400 flex items-center gap-1.5 select-none pointer-events-none">
                    {activeTool === "pen" ? (
                      <Scissors className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    ) : activeTool === "marquee" ? (
                      <BoxSelect className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    ) : activeTool === "selectResize" ? (
                      <Scaling className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    )}
                    {uiText("components_shape_studio_modal.span.selection_and_cutouts", "Selection & cutouts")}
                  </span>
                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_121"
                    defaultIcon={<X className="w-4 h-4" />}
                    onClick={() => setOpenFlyout(null)}
onPointerDown={(e) => e.stopPropagation()}
className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  />
                </div>

                {/* Top 4-Tool Switcher */}
                <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_120"
                    defaultIcon={<Wand2 className="w-3.5 h-3.5 text-purple-300" />}
                    type="button"
onClick={() => setActiveTool("magicWand")}
className={`py-1.5 px-1 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      activeTool === "magicWand"
                        ? "bg-purple-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
title={uiText("components_shape_studio_modal.button.magic_wand_select_regions_by_color.title", "Magic Wand: Select regions by color")}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_shape_studio_modal.span.wand", "Wand")}</span>
                          </>
                        )}
                  </CustomizableButton>

                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_119"
                    defaultIcon={<Scissors className="w-3.5 h-3.5 text-rose-300" />}
                    type="button"
onClick={() => setActiveTool("pen")}
className={`py-1.5 px-1 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      activeTool === "pen"
                        ? "bg-rose-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
title={uiText("components_shape_studio_modal.button.vector_pen_draw_custom_points_or_lasso_cutou.title", "Vector Pen: Draw custom points or lasso cutout")}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_shape_studio_modal.span.pen", "Pen")}</span>
                          </>
                        )}
                  </CustomizableButton>

                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_118"
                    defaultIcon={<BoxSelect className="w-3.5 h-3.5 text-amber-300" />}
                    type="button"
onClick={() => {
                      setActiveTool("marquee");
                      setToastNotice("Drag selection box over canvas to clone area");
                      setTimeout(() => setToastNotice(null), 2000);
                    }}
className={`py-1.5 px-1 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      activeTool === "marquee"
                        ? "bg-amber-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
title={uiText("components_shape_studio_modal.button.clone_area_drag_selection_box_to_duplicate_r.title", "Clone Area: Drag selection box to duplicate region")}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_shape_studio_modal.span.clone", "Clone")}</span>
                          </>
                        )}
                  </CustomizableButton>

                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_117"
                    defaultIcon={<Scaling className="w-3.5 h-3.5 text-cyan-300" />}
                    type="button"
onClick={() => {
                      setActiveTool("selectResize");
                      setToastNotice("Draw an area on the image to stretch & resize it");
                      setTimeout(() => setToastNotice(null), 2500);
                    }}
className={`py-1.5 px-1 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      activeTool === "selectResize"
                        ? "bg-cyan-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
title={uiText("components_shape_studio_modal.button.select_and_resize_draw_an_area_and_stretch_o.title", "Select & Resize: Draw an area and stretch or resize it over the underlying image")}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_shape_studio_modal.span.resize", "Resize")}</span>
                          </>
                        )}
                  </CustomizableButton>
                </div>

                {/* TAB 1: MAGIC WAND CONTROLS */}
                {activeTool === "magicWand" && (
                  <div className="flex flex-col gap-2.5">
                    {/* Tolerance Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] font-medium text-slate-300">
                        <span>{uiText("components_shape_studio_modal.span.color_tolerance", "Color Tolerance")}</span>
                        <span className="font-mono text-purple-400 font-bold">{wandTolerance}%</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={wandTolerance}
                        onChange={(e) => setWandTolerance(Number(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer bg-slate-800 rounded-lg h-1.5"
                      />
                    </div>

                    {/* Contiguous Flood Fill vs Global Toggle */}
                    <div className="flex items-center justify-between bg-slate-950/60 p-1.5 rounded-lg border border-slate-900">
                      <span className="text-[10.5px] text-slate-300 font-medium">{uiText("components_shape_studio_modal.span.mode", "Mode:")}</span>
                      <div className="flex items-center gap-1">
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_116"
                          type="button"
onClick={() => setWandContiguous(true)}
className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                            wandContiguous
                              ? "bg-purple-600 text-white shadow"
                              : "bg-slate-900 text-slate-400 hover:text-slate-200"
                          }`}
title={uiText("components_shape_studio_modal.button.select_only_adjacent_connected_pixels.title", "Select only adjacent connected pixels")}
                        >
                            {() => (
                                <>
                                  {uiText("components_shape_studio_modal.button.contiguous", "Contiguous")}
                                </>
                              )}
                        </CustomizableButton>
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_115"
                          type="button"
onClick={() => setWandContiguous(false)}
className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                            !wandContiguous
                              ? "bg-purple-600 text-white shadow"
                              : "bg-slate-900 text-slate-400 hover:text-slate-200"
                          }`}
title={uiText("components_shape_studio_modal.button.select_matching_color_everywhere_on_the_enti.title", "Select matching color everywhere on the entire image")}
                        >
                            {() => (
                                <>
                                  {uiText("components_shape_studio_modal.button.global", "Global")}
                                </>
                              )}
                        </CustomizableButton>
                      </div>
                    </div>

                    {/* Selection Status or Guide */}
                    {!wandSelection ? (
                      <div className="bg-purple-950/30 border border-purple-900/40 rounded-lg p-2 flex flex-col gap-1 text-[10px] text-purple-300">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                          <span>{uiText("components_shape_studio_modal.span.click_canvas_image", "Click canvas image")}</span>
                        </div>
                        <p className="text-slate-400 leading-tight">
                          {uiText("components_shape_studio_modal.p.click_any_color_on_the_frame_to_select_it_pr", "Click any color on the frame to select it. Press ")}<kbd className="bg-slate-900 text-slate-300 px-1 py-0.2 rounded border border-slate-700 font-mono">{uiText("components_shape_studio_modal.kbd.w", "W")}</kbd>{uiText("components_shape_studio_modal.p.anytime", " anytime.")}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {/* Selection Info Stats Card */}
                        <div className="bg-slate-950/80 border border-purple-500/40 rounded-lg p-2 flex flex-col gap-1.5 text-[10.5px]">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">{uiText("components_shape_studio_modal.span.selected_color", "Selected Color:")}</span>
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-3.5 h-3.5 rounded border border-white/40 shadow-sm"
                                style={{ backgroundColor: wandSelection.sampledColor }}
                              />
                              <span className="font-mono text-[10px] font-bold text-slate-200">
                                {wandSelection.sampledColor}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">{uiText("components_shape_studio_modal.span.coverage", "Coverage:")}</span>
                            <span className="font-mono font-bold text-purple-300">
                              {wandSelection.pixelCount.toLocaleString()}{uiText("components_shape_studio_modal.span.px_2", " px (")}
                              {((wandSelection.pixelCount / wandSelection.totalPixels) * 100).toFixed(1)}%)
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">{uiText("components_shape_studio_modal.span.bounds", "Bounds:")}</span>
                            <span className="font-mono text-slate-300">
                              {wandSelection.bounds.width}×{wandSelection.bounds.height}{uiText("components_shape_studio_modal.span.px_3", " px")}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons Grid */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <CustomizableButton
                            buttonId="shape_studio_modal_btn_114"
                            defaultIcon={<Layers className="w-3 h-3" />}
                            type="button"
onClick={handleWandCopyToLayer}
className="py-1.5 px-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow active:scale-[0.98]"
title={uiText("components_shape_studio_modal.button.copy_selection_to_a_movable_layer_ctrl_c.title", "Copy selection to a movable layer (Ctrl+C)")}
                          >
                              {() => (
                                  <>
                                    {uiText("components_shape_studio_modal.button.copy_to_layer", "Copy to Layer")}
                                  </>
                                )}
                          </CustomizableButton>

                          <CustomizableButton
                            buttonId="shape_studio_modal_btn_113"
                            defaultIcon={<Scissors className="w-3 h-3" />}
                            type="button"
onClick={handleWandCutSelection}
className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow active:scale-[0.98]"
title={uiText("components_shape_studio_modal.button.cut_selection_and_create_layer_ctrl_x.title", "Cut selection and create layer (Ctrl+X)")}
                          >
                              {() => (
                                  <>
                                    {uiText("components_shape_studio_modal.button.cut_to_layer", "Cut to Layer")}
                                  </>
                                )}
                          </CustomizableButton>

                          <CustomizableButton
                            buttonId="shape_studio_modal_btn_112"
                            defaultIcon={<Trash2 className="w-3 h-3" />}
                            type="button"
onClick={handleWandDeleteSelection}
className="py-1.5 px-2 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-300 font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98]"
title={uiText("components_shape_studio_modal.button.erase_make_transparent_del_backspace.title", "Erase / Make transparent (Del / Backspace)")}
                          >
                              {() => (
                                  <>
                                    {uiText("components_shape_studio_modal.button.delete_pixels", "Delete Pixels")}
                                  </>
                                )}
                          </CustomizableButton>

                          <CustomizableButton
                            buttonId="shape_studio_modal_btn_111"
                            defaultIcon={<RotateCcw className="w-3 h-3" />}
                            type="button"
onClick={handleWandInvertSelection}
className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98]"
title={uiText("components_shape_studio_modal.button.invert_current_selection.title", "Invert current selection")}
                          >
                              {() => (
                                  <>
                                    {uiText("components_shape_studio_modal.button.invert_sel", "Invert Sel")}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <CustomizableButton
                            buttonId="shape_studio_modal_btn_110"
                            defaultIcon={<Download className="w-3 h-3" />}
                            type="button"
onClick={handleWandDownloadCutout}
className="flex-1 py-1 px-2 bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 font-bold text-[9.5px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98]"
title={uiText("components_shape_studio_modal.button.download_transparent_png_cutout_of_the_selec.title", "Download transparent PNG cutout of the selected area")}
                          >
                              {() => (
                                  <>
                                    {uiText("components_shape_studio_modal.button.save_png_cutout", "Save PNG Cutout")}
                                  </>
                                )}
                          </CustomizableButton>

                          <CustomizableButton
                            buttonId="shape_studio_modal_btn_109"
                            type="button"
onClick={() => setWandSelection(null)}
className="py-1 px-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-[9.5px] font-medium rounded-lg transition-colors cursor-pointer"
title={uiText("components_shape_studio_modal.button.deselect_esc.title", "Deselect (Esc)")}
                          >
                              {() => (
                                  <>
                                    {uiText("components_shape_studio_modal.button.deselect", "Deselect")}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: VECTOR PEN & LASSO CONTROLS */}
                {activeTool === "pen" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                      <span className="text-slate-400 text-[10.5px]">{uiText("components_shape_studio_modal.span.vector_points", "Vector points:")}</span>
                      <span className="font-mono font-bold bg-rose-950 text-rose-300 px-2 py-0.5 rounded text-[11px] border border-rose-900/40">
                        {penPoints.length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 text-[10px] text-slate-400 leading-normal bg-slate-950/40 p-2.5 rounded-lg border border-slate-900/60">
                      {penPoints.length === 0 ? (
                        <span className="text-slate-300 italic">{uiText("components_shape_studio_modal.span.click_on_image_canvas_to_draw_anchor_points", "🔷 Click on image canvas to draw anchor points, or drag to draw a Lasso cutout.")}</span>
                      ) : isPenClosed ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">{uiText("components_shape_studio_modal.span.closed_cutout_ready_double_click_inside_sele", "✓ Closed cutout ready! Double-click inside selection to apply.")}</span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1">{uiText("components_shape_studio_modal.span.click_near_first_point_green_circle_or_doubl", "⚡ Click near first point (green circle) or double-click to close & apply.")}</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 pt-1">
                      {penPoints.length >= 3 && !isPenClosed && (
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_108"
                          type="button"
onClick={(e) => {
                            e.stopPropagation();
                            setIsPenClosed(true);
                          }}
className="w-full bg-rose-600 hover:bg-rose-500 text-white py-1.5 rounded-lg font-bold text-[10.5px] transition-colors cursor-pointer text-center"
                        >
                            {() => (
                                <>
                                  {uiText("components_shape_studio_modal.button.close_path", "Close Path")}
                                </>
                              )}
                        </CustomizableButton>
                      )}

                      {(isPenClosed || penPoints.length >= 3) && (
                        <>
                          <CustomizableButton
                            buttonId="shape_studio_modal_btn_107"
                            type="button"
onClick={(e) => {
                              e.stopPropagation();
                              handlePenCutout("layer");
                            }}
className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-1.5 rounded-lg font-bold text-[10.5px] transition-colors cursor-pointer text-center shadow-lg"
                          >
                              {() => (
                                  <>
                                    {uiText("components_shape_studio_modal.button.cutout_to_canvas_layer", "Cutout to Canvas Layer")}
                                  </>
                                )}
                          </CustomizableButton>

                          <CustomizableButton
                            buttonId="shape_studio_modal_btn_106"
                            type="button"
onClick={(e) => {
                              e.stopPropagation();
                              handlePenCutout("download");
                            }}
className="w-full bg-rose-500 hover:bg-rose-400 text-white py-1.5 rounded-lg font-bold text-[10.5px] transition-colors cursor-pointer text-center"
                          >
                              {() => (
                                  <>
                                    {uiText("components_shape_studio_modal.button.download_cutout_png", "Download Cutout PNG")}
                                  </>
                                )}
                          </CustomizableButton>

                          {onUpdateSliceUrl && (
                            <CustomizableButton
                              buttonId="shape_studio_modal_btn_105"
                              type="button"
onClick={(e) => {
                                e.stopPropagation();
                                handlePenCutout("storyboard");
                              }}
className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-lg font-bold text-[10.5px] transition-colors cursor-pointer text-center"
                            >
                                {() => (
                                    <>
                                      {uiText("components_shape_studio_modal.button.send_cutout_to_storyboard", "Send Cutout to Storyboard")}
                                    </>
                                  )}
                            </CustomizableButton>
                          )}
                        </>
                      )}

                      {penPoints.length > 0 && (
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_104"
                          type="button"
onClick={(e) => {
                            e.stopPropagation();
                            setPenPoints([]);
                            setIsPenClosed(false);
                          }}
className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 py-1.5 rounded-lg font-medium text-[10.5px] transition-colors cursor-pointer text-center"
                        >
                            {() => (
                                <>
                                  {uiText("components_shape_studio_modal.button.reset_path", "Reset Path")}
                                </>
                              )}
                        </CustomizableButton>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: CLONE AREA (MARQUEE) CONTROLS */}
                {activeTool === "marquee" && (
                  <div className="flex flex-col gap-2.5">
                    <div className="bg-amber-950/30 border border-amber-900/40 rounded-lg p-2.5 flex flex-col gap-1.5 text-[10px] text-amber-200">
                      <div className="flex items-center gap-1.5 font-bold text-amber-400 text-[11px]">
                        <BoxSelect className="w-4 h-4" />
                        <span>{uiText("components_shape_studio_modal.span.rectangular_clone_area", "Rectangular Clone Area")}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {uiText("components_shape_studio_modal.p.drag_a_selection_box_over_any_area_of_the_ca", "Drag a selection box over any area of the canvas. Double-click inside the selection box or press ")}<kbd className="bg-slate-900 text-slate-200 px-1 py-0.2 rounded border border-slate-700 font-mono">{uiText("components_shape_studio_modal.kbd.enter", "Enter")}</kbd>{uiText("components_shape_studio_modal.p.to_duplicate_and_stamp_that_region", " to duplicate and stamp that region.")}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 bg-slate-950/60 p-2 rounded-lg border border-slate-900 text-[10px] text-slate-400">
                      <div className="flex items-center justify-between">
                        <span>{uiText("components_shape_studio_modal.span.shortcut", "Shortcut:")}</span>
                        <kbd className="bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded border border-slate-800 font-mono font-bold">
                          {uiText("components_shape_studio_modal.kbd.ctrl_d", "Ctrl + D")}
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{uiText("components_shape_studio_modal.span.apply_stamp", "Apply Stamp:")}</span>
                        <span className="text-slate-300 font-mono">{uiText("components_shape_studio_modal.span.enter_or_double_click", "Enter or Double-Click")}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: SELECT & RESIZE / STRETCH CONTROLS */}
                {activeTool === "selectResize" && (
                  <div className="flex flex-col gap-2.5">
                    {!selectResizeSnapshot ? (
                      <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-lg p-2.5 flex flex-col gap-1.5 text-[10px] text-cyan-200">
                        <div className="flex items-center gap-1.5 font-bold text-cyan-400 text-[11px]">
                          <Scaling className="w-4 h-4" />
                          <span>{uiText("components_shape_studio_modal.span.select_and_resize_stretch_tool", "Select & Resize / Stretch Tool")}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {uiText("components_shape_studio_modal.p.click_and_drag_a_box_across_any_part_of_the", "Click and drag a box across any part of the image to select that area. Once selected, drag the 8 corner and edge handles to stretch or scale it right over the underlying image!")}
                        </p>
                        <div className="flex items-center gap-1 text-[9px] text-cyan-400/90 mt-0.5">
                          <kbd className="bg-slate-900 text-cyan-300 px-1 py-0.2 rounded border border-cyan-800/60 font-mono font-bold">{uiText("components_shape_studio_modal.kbd.drag", "Drag")}</kbd>
                          <span>{uiText("components_shape_studio_modal.span.to_select_area", "to select area")}</span>
                          <span className="mx-1">•</span>
                          <kbd className="bg-slate-900 text-cyan-300 px-1 py-0.2 rounded border border-cyan-800/60 font-mono font-bold">{uiText("components_shape_studio_modal.kbd.enter_2", "Enter")}</kbd>
                          <span>{uiText("components_shape_studio_modal.span.to_stamp_onto_image", "to stamp onto image")}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {/* Dimensions & Stretch Stats */}
                        <div className="bg-slate-950/80 border border-cyan-500/40 rounded-lg p-2 flex flex-col gap-1.5 text-[10.5px]">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 font-medium">{uiText("components_shape_studio_modal.span.original_area", "Original Area:")}</span>
                            <span className="font-mono text-slate-300">
                              {Math.round(selectResizeSnapshot.originalBox.width)}×{Math.round(selectResizeSnapshot.originalBox.height)}{uiText("components_shape_studio_modal.span.px_4", " px")}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 font-medium">{uiText("components_shape_studio_modal.span.stretched_area", "Stretched Area:")}</span>
                            <span className="font-mono font-bold text-cyan-300">
                              {Math.round(selectResizeBox?.width || 0)}×{Math.round(selectResizeBox?.height || 0)}{uiText("components_shape_studio_modal.span.px_5", " px")}
                              {selectResizeSnapshot.originalBox.width > 0 && selectResizeBox ? (
                                <span className="ml-1 text-[9px] text-cyan-400/80">
                                  ({Math.round((selectResizeBox.width / selectResizeSnapshot.originalBox.width) * 100)}{uiText("components_shape_studio_modal.span.w", "% W ×")}{" "}
                                  {Math.round((selectResizeBox.height / selectResizeSnapshot.originalBox.height) * 100)}{uiText("components_shape_studio_modal.span.h", "% H)")}
                                </span>
                              ) : null}
                            </span>
                          </div>
                        </div>

                        {/* Stretch controls: Opacity and Lock Ratio */}
                        <div className="flex flex-col gap-1.5 bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                          <div className="flex items-center justify-between text-[10.5px]">
                            <span className="text-slate-400 font-medium">{uiText("components_shape_studio_modal.span.stretch_opacity", "Stretch Opacity:")}</span>
                            <span className="font-mono font-bold text-cyan-400">{Math.round(selectResizeOpacity * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.05"
                            value={selectResizeOpacity}
                            onChange={(e) => setSelectResizeOpacity(parseFloat(e.target.value))}
                            className="w-full accent-cyan-400 cursor-pointer bg-slate-800 rounded-lg h-1.5"
                          />

                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                            <CustomizableLabel
                              labelId="shape_studio_modal_item_103"
                              as="label"
                              className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-300 select-none"
                            >
                                {() => (
                                    <>
                                      <input
                                type="checkbox"
                                checked={selectResizeKeepAspect}
                                onChange={(e) => setSelectResizeKeepAspect(e.target.checked)}
                                className="rounded text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-500"
                              />
                                    <span>{uiText("components_shape_studio_modal.span.lock_ratio", "Lock Ratio")}</span>
                                    </>
                                  )}
                            </CustomizableLabel>
                            <CustomizableLabel
                              labelId="shape_studio_modal_item_102"
                              as="label"
                              className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-300 select-none"
                            >
                                {() => (
                                    <>
                                      <input
                                type="checkbox"
                                checked={selectResizeClearOriginal}
                                onChange={(e) => setSelectResizeClearOriginal(e.target.checked)}
                                className="rounded text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-500"
                              />
                                    <span>{uiText("components_shape_studio_modal.span.cut_original_hole", "Cut original hole")}</span>
                                    </>
                                  )}
                            </CustomizableLabel>
                          </div>
                        </div>

                        {/* Primary Action Buttons */}
                        <div className="flex flex-col gap-1.5">
                          <CustomizableButton
                            buttonId="shape_studio_modal_btn_101"
                            defaultIcon={<Check className="w-3.5 h-3.5" />}
                            type="button"
onClick={handleStampSelectResize}
className="py-2 px-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-[10.5px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg active:scale-[0.98]"
title={uiText("components_shape_studio_modal.button.stamp_and_bake_the_stretched_area_permanentl.title", "Stamp and bake the stretched area permanently onto the underlying image (Enter or Double-click)")}
                          >
                              {() => (
                                  <>
                                    <span>{uiText("components_shape_studio_modal.span.stamp_onto_image", "Stamp onto Image")}</span>
                                  <kbd className="bg-cyan-950/80 text-cyan-200 px-1 py-0.2 text-[8px] rounded font-mono border border-cyan-700/50">{uiText("components_shape_studio_modal.kbd.enter_3", "Enter")}</kbd>
                                  </>
                                )}
                          </CustomizableButton>

                          <div className="grid grid-cols-2 gap-1.5">
                            <CustomizableButton
                              buttonId="shape_studio_modal_btn_100"
                              defaultIcon={<Layers className="w-3 h-3" />}
                              type="button"
onClick={handleConvertSelectResizeToLayer}
className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow active:scale-[0.98]"
title={uiText("components_shape_studio_modal.button.save_the_stretched_area_as_a_movable_canvas.title", "Save the stretched area as a movable canvas layer")}
                            >
                                {() => (
                                    <>
                                      <span>{uiText("components_shape_studio_modal.span.to_layer", "To Layer")}</span>
                                    </>
                                  )}
                            </CustomizableButton>

                            <CustomizableButton
                              buttonId="shape_studio_modal_btn_99"
                              defaultIcon={<RotateCcw className="w-3 h-3" />}
                              type="button"
onClick={handleResetSelectResize}
className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98]"
title={uiText("components_shape_studio_modal.button.reset_to_original_dimensions.title", "Reset to original dimensions")}
                            >
                                {() => (
                                    <>
                                      <span>{uiText("components_shape_studio_modal.span.reset_size", "Reset Size")}</span>
                                    </>
                                  )}
                            </CustomizableButton>
                          </div>

                          <CustomizableButton
                            buttonId="shape_studio_modal_btn_98"
                            type="button"
onClick={handleCancelSelectResize}
className="py-1 px-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-[9.5px] font-medium rounded-lg transition-colors cursor-pointer text-center"
title={uiText("components_shape_studio_modal.button.deselect_and_cancel_esc.title", "Deselect and cancel (Esc)")}
                          >
                              {() => (
                                  <>
                                    {uiText("components_shape_studio_modal.button.cancel_deselect_esc", "Cancel / Deselect (Esc)")}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FLYOUT 3: COLOR PALETTE/WHEEL PANEL */}
            {openFlyout === "color" && (
              <div
                style={{ left: colorFlyoutPos.x, top: colorFlyoutPos.y }}
                className="absolute bg-[#0d1222] border border-indigo-500/30 rounded-xl p-2.5 shadow-2xl z-50 w-[172px] text-slate-100 backdrop-blur-2xl animate-fade-in flex flex-col gap-2"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div 
                  className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 cursor-move select-none"
                  onPointerDown={(e) => {
                    setIsDraggingColorFlyout(true);
                    setColorFlyoutDragStart({ x: e.clientX - colorFlyoutPos.x, y: e.clientY - colorFlyoutPos.y });
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (isDraggingColorFlyout) {
                      setColorFlyoutPos({
                        x: e.clientX - colorFlyoutDragStart.x,
                        y: e.clientY - colorFlyoutDragStart.y
                      });
                    }
                  }}
                  onPointerUp={(e) => {
                    setIsDraggingColorFlyout(false);
                    try {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    } catch {}
                  }}
                >
                  <span className="text-[9.5px] font-extrabold tracking-wider text-indigo-400 flex items-center gap-1 select-none pointer-events-none">
                    <Palette className="w-3 h-3 text-indigo-400" />
                    {uiText("components_shape_studio_modal.span.color_picker", "Color picker")}
                  </span>
                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_97"
                    defaultIcon={<X className="w-3.5 h-3.5" />}
                    onClick={() => setOpenFlyout(null)}
onPointerDown={(e) => e.stopPropagation()}
className="p-0.5 text-slate-400 hover:text-white rounded cursor-pointer"
                  />
                </div>

                {/* Advanced Color Picker Card (White Box) */}
                <AdvancedColorPicker
                  color={brushColor.startsWith("#") ? brushColor : "#10b981"}
                  onChange={(hex) => {
                    setBrushColor(hex);
                    setStrokeColor(hex);
                    if (selectedLayer) {
                      updateActiveFrameData((prev = []) =>
                        (Array.isArray(prev) ? prev : []).map((l) =>
                          l.id === selectedLayer.id
                            ? {
                                ...l,
                                strokeColor: hex,
                                fillColor: l.fillColor !== "transparent" ? hex : "transparent",
                              }
                            : l
                        )
                      );
                    }
                  }}
                />

                {/* Preset Color Swatches row below the white card */}
                <div className="grid grid-cols-3 gap-1.5 mt-0.5">
                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_96"
                    onClick={() => {
                      const hex = "#e12020";
                      setBrushColor(hex);
                      setStrokeColor(hex);
                      if (selectedLayer) {
                        updateActiveFrameData((prev = []) =>
                          (Array.isArray(prev) ? prev : []).map((l) =>
                            l.id === selectedLayer.id
                              ? {
                                  ...l,
                                  strokeColor: hex,
                                  fillColor: l.fillColor !== "transparent" ? hex : "transparent",
                                }
                              : l
                          )
                        );
                      }
                    }}
className="h-4.5 rounded border border-slate-700 bg-[#e12020] hover:scale-105 transition-transform cursor-pointer shadow-md"
title={uiText("components_shape_studio_modal.button.red.title", "Red")}
                  />
                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_95"
                    onClick={() => {
                      const hex = "#1a202c";
                      setBrushColor(hex);
                      setStrokeColor(hex);
                      if (selectedLayer) {
                        updateActiveFrameData((prev = []) =>
                          (Array.isArray(prev) ? prev : []).map((l) =>
                            l.id === selectedLayer.id
                              ? {
                                  ...l,
                                  strokeColor: hex,
                                  fillColor: l.fillColor !== "transparent" ? hex : "transparent",
                                }
                              : l
                          )
                        );
                      }
                    }}
className="h-4.5 rounded border border-slate-700 bg-[#1a202c] hover:scale-105 transition-transform cursor-pointer shadow-md"
title={uiText("components_shape_studio_modal.button.charcoal.title", "Charcoal")}
                  />
                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_94"
                    onClick={() => {
                      const hex = "#e2b10c";
                      setBrushColor(hex);
                      setStrokeColor(hex);
                      if (selectedLayer) {
                        updateActiveFrameData((prev = []) =>
                          (Array.isArray(prev) ? prev : []).map((l) =>
                            l.id === selectedLayer.id
                              ? {
                                  ...l,
                                  strokeColor: hex,
                                  fillColor: l.fillColor !== "transparent" ? hex : "transparent",
                                }
                              : l
                          )
                        );
                      }
                    }}
className="h-4.5 rounded border border-slate-700 bg-[#e2b10c] hover:scale-105 transition-transform cursor-pointer shadow-md"
title={uiText("components_shape_studio_modal.button.yellow.title", "Yellow")}
                  />
                </div>

                {/* Border Width and Border Radius Sliders row */}
                <div className="grid grid-cols-2 gap-2 mt-0.5 pt-1.5 border-t border-slate-800/40">
                  {/* Border Width */}
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-extrabold tracking-wider text-slate-300">
                      {uiText("components_shape_studio_modal.span.border", "Border (")}{strokeWidth}{uiText("components_shape_studio_modal.span.px_6", "px)")}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={strokeWidth}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setStrokeWidth(val);
                        if (selectedLayer) {
                          updateActiveFrameData((prev = []) =>
                            (Array.isArray(prev) ? prev : []).map((l) =>
                              l.id === selectedLayer.id ? { ...l, strokeWidth: val } : l
                            )
                          );
                        }
                      }}
                      className="w-full h-1 bg-white rounded-full appearance-none cursor-pointer outline-none accent-indigo-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:shadow-md"
                    />
                  </div>

                  {/* Border Radius */}
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-extrabold tracking-wider text-slate-300">
                      {uiText("components_shape_studio_modal.span.radius", "Radius (")}{borderRadius}{uiText("components_shape_studio_modal.span.px_7", "px)")}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="48"
                      value={borderRadius}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setBorderRadius(val);
                        if (selectedLayer) {
                          updateActiveFrameData((prev = []) =>
                            (Array.isArray(prev) ? prev : []).map((l) =>
                              l.id === selectedLayer.id ? { ...l, borderRadius: val } : l
                            )
                          );
                        }
                      }}
                      className="w-full h-1 bg-white rounded-full appearance-none cursor-pointer outline-none accent-indigo-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:shadow-md"
                    />
                  </div>
                </div>

                <CustomizableButton
                  buttonId="shape_studio_modal_btn_93"
                  onClick={() => setOpenFlyout(null)}
className="w-full py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer mt-0.5"
                >
                    {() => (
                        <>
                          {uiText("components_shape_studio_modal.button.apply_and_close", "Apply & Close")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            )}
          </div>

          {/* MAIN INTERACTIVE CANVAS VIEWPORT */}
          <div
            id="ss2"
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={(e) => {
              setOpenFlyout(null);
              if (e.target === containerRef.current && activeTool === "crop" && cropBox && isCropSelected) {
                setIsCropSelected(false);
                setToastNotice("Crop deselected (definition kept)");
                setTimeout(() => setToastNotice(null), 1500);
              }
            }}
            className={`flex-1 relative bg-[#04060a] overflow-hidden flex items-center justify-center select-none ${
              activeTool === "chromaKey" ? "cursor-cell" : "cursor-crosshair"
            }`}
            style={{
              backgroundImage:
                'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+CjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMwNzA5MTAiIC8+CjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMwNzA5MTAiIC8+Cjwvc3ZnPg==")',
            }}
          >
            {activeSlice ? (() => {
              const targetCanvasWidth = Math.max(1, canvasRelative ? (imgNaturalSize.width + canvasWidthOffset) : canvasWidthInput);
              const targetCanvasHeight = Math.max(1, canvasRelative ? (imgNaturalSize.height + canvasHeightOffset) : canvasHeightInput);
              const oldCanvasWidth = imgNaturalSize.width || 1;
              const oldCanvasHeight = imgNaturalSize.height || 1;

              let canvasOffsetX = 0;
              let canvasOffsetY = 0;
              if ([1, 4, 7].includes(canvasAnchor)) {
                canvasOffsetX = Math.round((targetCanvasWidth - oldCanvasWidth) / 2);
              } else if ([2, 5, 8].includes(canvasAnchor)) {
                canvasOffsetX = targetCanvasWidth - oldCanvasWidth;
              }

              if ([3, 4, 5].includes(canvasAnchor)) {
                canvasOffsetY = Math.round((targetCanvasHeight - oldCanvasHeight) / 2);
              } else if ([6, 7, 8].includes(canvasAnchor)) {
                canvasOffsetY = targetCanvasHeight - oldCanvasHeight;
              }

              const previewBoxLeft = -canvasOffsetX;
              const previewBoxTop = -canvasOffsetY;
              const previewBoxWidth = targetCanvasWidth;
              const previewBoxHeight = targetCanvasHeight;

              return (
              <div
                ref={stageRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onDoubleClick={handleDoubleClick}
                className={`relative transition-transform duration-75 origin-center shadow-2xl ${
                  activeTool === "canvasSize" && showCanvasResizePreview
                    ? "overflow-visible border border-cyan-500/30"
                    : "overflow-hidden border border-slate-800/80 rounded-lg"
                } shrink-0`}
                style={{
                  width: `${imgNaturalSize.width}px`,
                  height: `${imgNaturalSize.height}px`,
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  flexShrink: 0,
                }}
              >
                {/* Live Canvas Resize Extension Fill Preview */}
                {activeTool === "canvasSize" && showCanvasResizePreview && (
                  <div
                    className="absolute pointer-events-none transition-all duration-75 z-0"
                    style={{
                      left: `${previewBoxLeft}px`,
                      top: `${previewBoxTop}px`,
                      width: `${previewBoxWidth}px`,
                      height: `${previewBoxHeight}px`,
                      backgroundColor:
                        canvasExtensionColorType === "white"
                          ? "#ffffff"
                          : canvasExtensionColorType === "black"
                          ? "#000000"
                          : canvasExtensionColorType === "custom"
                          ? canvasExtensionCustomColor
                          : undefined,
                      backgroundImage:
                        canvasExtensionColorType === "transparent"
                          ? 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+CjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMxZTI5M2IiIC8+CjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMxZTI5M2IiIC8+Cjwvc3ZnPg==")'
                          : undefined,
                    }}
                  />
                )}

                {/* Full Frame Fill Background Overlay */}
                {frameData[activeIdx]?.bgFillColor && (
                  <div
                    className="absolute inset-0 pointer-events-none transition-colors z-0"
                    style={{ backgroundColor: frameData[activeIdx]?.bgFillColor }}
                  />
                )}

                {/* Base Image Frame */}
                <img
                  ref={imgRef}
                  src={activeSlice.url}
                  alt={activeSlice.name}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />

                {/* Active / Deselected Crop Tool Box Overlay */}
                {activeTool === "crop" && cropBox && cropBox.width > 0 && cropBox.height > 0 && (
                  <div
                    className={`absolute z-30 select-none ${
                      cropShape === "oval" ? "rounded-full" : "rounded-none"
                    } ${
                      isCropSelected
                        ? "border-2 border-cyan-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] cursor-move group"
                        : "border-2 border-dashed border-cyan-400/80 bg-cyan-500/10 hover:bg-cyan-500/20 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-colors"
                    }`}
                    style={{
                      left: `${cropBox.x}px`,
                      top: `${cropBox.y}px`,
                      width: `${cropBox.width}px`,
                      height: `${cropBox.height}px`,
                    }}
                    onClick={(e) => {
                      if (!isCropSelected) {
                        e.stopPropagation();
                        setIsCropSelected(true);
                        setDragState(null);
                      }
                    }}
                    onMouseDown={(e) => {
                      if (!isCropSelected) {
                        e.stopPropagation();
                        setIsCropSelected(true);
                        setDragState(null);
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleApplyCrop();
                    }}
                  >
                    {/* Rule-of-Thirds Grid (When Selected) */}
                    {isCropSelected && cropShape === "rect" && (
                      <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-40">
                        <div className="border-r border-b border-cyan-300/40" />
                        <div className="border-r border-b border-cyan-300/40" />
                        <div className="border-b border-cyan-300/40" />
                        <div className="border-r border-b border-cyan-300/40" />
                        <div className="border-r border-b border-cyan-300/40" />
                        <div className="border-b border-cyan-300/40" />
                        <div className="border-r border-cyan-300/40" />
                        <div className="border-r border-cyan-300/40" />
                        <div />
                      </div>
                    )}

                    {/* Deselected State Top Badge */}
                    {!isCropSelected && (
                      <div
                        className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-0.5 bg-slate-950/90 border border-cyan-500/40 rounded-md shadow-lg text-[9px] font-semibold text-cyan-300 pointer-events-auto whitespace-nowrap z-40 hover:border-cyan-400 transition-colors"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsCropSelected(true);
                          setDragState(null);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCropSelected(true);
                          setDragState(null);
                        }}
                      >
                        <span className="font-mono text-slate-300">
                          {cropBox.width} × {cropBox.height}{uiText("components_shape_studio_modal.span.px_8", " px")}
                        </span>
                        <span className="text-cyan-400 font-bold text-[8.5px] bg-cyan-950/80 px-1 py-0.2 rounded border border-cyan-800/40">
                          {uiText("components_shape_studio_modal.span.deselected", "Deselected")}
                        </span>
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_92"
                          type="button"
onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsCropSelected(true);
                            setDragState(null);
                          }}
onClick={(e) => {
                            e.stopPropagation();
                            setIsCropSelected(true);
                            setDragState(null);
                          }}
className="text-[8.5px] text-cyan-300 hover:text-white underline cursor-pointer"
                        >
                            {() => (
                                <>
                                  {uiText("components_shape_studio_modal.button.select", "Select")}
                                </>
                              )}
                        </CustomizableButton>
                      </div>
                    )}

                    {/* Top Info & Quick Action Badge (When Selected) */}
                    {isCropSelected && (
                      <div
                        className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-0.5 bg-slate-950/95 border border-cyan-500/60 rounded-md shadow-xl text-[9.5px] font-bold text-cyan-300 pointer-events-auto whitespace-nowrap z-40"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="font-mono text-white">
                          {cropBox.width} × {cropBox.height}{uiText("components_shape_studio_modal.span.px_9", " px")}
                        </span>
                        {cropAspect !== "free" && (
                          <span className="text-[8.5px] text-cyan-400 bg-cyan-950/80 px-1 py-0.2 rounded border border-cyan-800/50">
                            {cropAspect}
                          </span>
                        )}
                        <span className="text-slate-500">|</span>
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_91"
                          defaultIcon={<Check className="w-2.5 h-2.5" />}
                          type="button"
onClick={(e) => {
                            e.stopPropagation();
                            handleApplyCrop();
                          }}
className="px-1.5 py-0.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded text-[9px] cursor-pointer transition-all active:scale-95 flex items-center gap-0.5"
title={uiText("components_shape_studio_modal.button.apply_crop_double_click_inside_selection_or.title", "Apply Crop (Double-click inside selection or press Enter)")}
                        >
                            {() => (
                                <>
                                  {uiText("components_shape_studio_modal.button.apply", " Apply")}
                                </>
                              )}
                        </CustomizableButton>
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_90"
                          defaultIcon={<Plus className="w-2.5 h-2.5" />}
                          type="button"
onClick={(e) => {
                            e.stopPropagation();
                            handleAddMultiCrop();
                          }}
className="px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-[9px] cursor-pointer transition-all active:scale-95 flex items-center gap-0.5"
title={uiText("components_shape_studio_modal.button.add_to_multi_crops_queue_shift_enter.title", "Add to Multi-Crops queue (Shift+Enter)")}
                        >
                            {() => (
                                <>
                                  {uiText("components_shape_studio_modal.button.queue", " + Queue")}
                                </>
                              )}
                        </CustomizableButton>
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_89"
                          type="button"
onClick={(e) => {
                            e.stopPropagation();
                            setIsCropSelected(false);
                          }}
className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] cursor-pointer transition-all"
title={uiText("components_shape_studio_modal.button.deselect_selection_frame.title", "Deselect selection frame")}
                        >
                            {() => (
                                <>
                                  {uiText("components_shape_studio_modal.button.deselect_2", "Deselect")}
                                </>
                              )}
                        </CustomizableButton>
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_88"
                          defaultIcon={<X className="w-3 h-3" />}
                          type="button"
onClick={(e) => {
                            e.stopPropagation();
                            setCropBox(null);
                            setIsCropSelected(true);
                          }}
className="p-0.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded cursor-pointer transition-colors"
title={uiText("components_shape_studio_modal.button.clear_crop_box_esc.title", "Clear crop box (Esc)")}
                        />
                      </div>
                    )}

                    {/* Resize Handles (8 directions - only when selected) */}
                    {isCropSelected && [
                      { handle: "nw", style: "top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize" },
                      { handle: "n",  style: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize" },
                      { handle: "ne", style: "top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize" },
                      { handle: "e",  style: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-ew-resize" },
                      { handle: "se", style: "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize" },
                      { handle: "s",  style: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize" },
                      { handle: "sw", style: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize" },
                      { handle: "w",  style: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize" },
                    ].map(({ handle, style }) => (
                      <div
                        key={handle}
                        className={`absolute w-2.5 h-2.5 bg-white border-2 border-cyan-500 rounded-sm shadow-md z-40 ${style}`}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const coords = getStageCoords(e);
                          setDragState({
                            type: "crop_adjust",
                            handle,
                            startX: coords.x,
                            startY: coords.y,
                            initialLayers: [],
                            initialCropBox: { ...cropBox },
                          });
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Visual Overlay of queued Multi-Crops on Active Frame */}
                {activeTool === "crop" && multiCrops.filter((mc) => mc.frameIdx === activeIdx).map((mc) => {
                  const isPercent = mc.crop.unit === "%";
                  const leftPercent = isPercent ? (mc.crop.x || 0) : (imgNaturalSize.width ? ((mc.crop.x || 0) / imgNaturalSize.width) * 100 : 0);
                  const topPercent = isPercent ? (mc.crop.y || 0) : (imgNaturalSize.height ? ((mc.crop.y || 0) / imgNaturalSize.height) * 100 : 0);
                  const widthPercent = isPercent ? (mc.crop.width || 0) : (imgNaturalSize.width ? ((mc.crop.width || 0) / imgNaturalSize.width) * 100 : 0);
                  const heightPercent = isPercent ? (mc.crop.height || 0) : (imgNaturalSize.height ? ((mc.crop.height || 0) / imgNaturalSize.height) * 100 : 0);
                  const cropNum = multiCrops.findIndex((c) => c.id === mc.id) + 1;

                  return (
                    <div
                      key={mc.id}
                      className={`absolute pointer-events-auto z-25 border-2 border-dashed border-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/30 transition-all group ${
                        mc.cropShape === "oval" ? "rounded-full" : "rounded-sm"
                      }`}
                      style={{
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        width: `${widthPercent}%`,
                        height: `${heightPercent}%`,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="absolute -top-5 left-0 flex items-center gap-1 bg-emerald-700/90 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-md pointer-events-auto select-none">
                        <span>#{cropNum} {mc.cropShape === "oval" ? "Oval" : "Rect"}</span>
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_87"
                          defaultIcon={<Check className="w-2.5 h-2.5" />}
                          type="button"
onClick={(e) => {
                            e.stopPropagation();
                            handleApplySingleMultiCropToCurrent(mc);
                          }}
className="hover:bg-emerald-500 p-0.5 rounded cursor-pointer"
title={uiText("components_shape_studio_modal.button.apply_this_crop_to_active_frame.title", "Apply this crop to active frame")}
                        />
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_86"
                          defaultIcon={<X className="w-2.5 h-2.5" />}
                          type="button"
onClick={(e) => {
                            e.stopPropagation();
                            setMultiCrops((prev) => prev.filter((c) => c.id !== mc.id));
                          }}
className="hover:bg-rose-500 p-0.5 rounded cursor-pointer"
title={uiText("components_shape_studio_modal.button.remove_from_multi_crop_queue.title", "Remove from multi-crop queue")}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Live Canvas Resize Trimming / Cropping Mask */}
                {activeTool === "canvasSize" && showCanvasResizePreview && (previewBoxWidth < imgNaturalSize.width || previewBoxHeight < imgNaturalSize.height) && (
                  <div className="absolute inset-0 pointer-events-none z-35 overflow-hidden">
                    {/* Top trimmed region */}
                    {canvasOffsetY > 0 && (
                      <div
                        className="absolute top-0 left-0 w-full bg-rose-950/75 border-b border-rose-500/60 backdrop-blur-[1px] flex items-center justify-center text-[10px] text-rose-300 font-bold tracking-wider select-none pointer-events-none"
                        style={{ height: `${canvasOffsetY}px` }}
                      >
                        <span>{uiText("components_shape_studio_modal.span.trimmed_top", "✂ Trimmed top (")}{canvasOffsetY}{uiText("components_shape_studio_modal.span.px_10", "px)")}</span>
                      </div>
                    )}
                    {/* Bottom trimmed region */}
                    {canvasOffsetY + previewBoxHeight < imgNaturalSize.height && (
                      <div
                        className="absolute bottom-0 left-0 w-full bg-rose-950/75 border-t border-rose-500/60 backdrop-blur-[1px] flex items-center justify-center text-[10px] text-rose-300 font-bold tracking-wider select-none pointer-events-none"
                        style={{ height: `${imgNaturalSize.height - (canvasOffsetY + previewBoxHeight)}px` }}
                      >
                        <span>{uiText("components_shape_studio_modal.span.trimmed_bottom", "✂ Trimmed bottom (")}{imgNaturalSize.height - (canvasOffsetY + previewBoxHeight)}{uiText("components_shape_studio_modal.span.px_11", "px)")}</span>
                      </div>
                    )}
                    {/* Left trimmed region */}
                    {canvasOffsetX > 0 && (
                      <div
                        className="absolute bg-rose-950/75 border-r border-rose-500/60 backdrop-blur-[1px] flex items-center justify-center text-[10px] text-rose-300 font-bold tracking-wider select-none pointer-events-none"
                        style={{
                          top: `${Math.max(0, canvasOffsetY)}px`,
                          left: 0,
                          width: `${canvasOffsetX}px`,
                          height: `${Math.min(previewBoxHeight, imgNaturalSize.height)}px`,
                        }}
                      >
                        <span className="-rotate-90">{uiText("components_shape_studio_modal.span.trimmed_left", "✂ Trimmed left")}</span>
                      </div>
                    )}
                    {/* Right trimmed region */}
                    {canvasOffsetX + previewBoxWidth < imgNaturalSize.width && (
                      <div
                        className="absolute bg-rose-950/75 border-l border-rose-500/60 backdrop-blur-[1px] flex items-center justify-center text-[10px] text-rose-300 font-bold tracking-wider select-none pointer-events-none"
                        style={{
                          top: `${Math.max(0, canvasOffsetY)}px`,
                          left: `${canvasOffsetX + previewBoxWidth}px`,
                          width: `${imgNaturalSize.width - (canvasOffsetX + previewBoxWidth)}px`,
                          height: `${Math.min(previewBoxHeight, imgNaturalSize.height)}px`,
                        }}
                      >
                        <span className="rotate-90">{uiText("components_shape_studio_modal.span.trimmed_right", "✂ Trimmed right")}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Freehand Lines SVG Overlay */}
                {showFreehandLines && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                      <mask id="blur-live-mask">
                        <rect width="100%" height="100%" fill="black" />
                        {currentFreehandLines.filter((l) => l.isBlur).map((line) => (
                          <polyline
                            key={`mask_${line.id}`}
                            points={line.points.map((p) => `${p.x},${p.y}`).join(" ")}
                            fill="none"
                            stroke="white"
                            strokeWidth={line.width}
                            strokeOpacity={line.blurPressure ? Math.min(1, Math.max(0.2, (line.blurPressure / 100) * 0.95)) : line.opacity}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        ))}
                        {isDrawing && activeTool === "blur" && currentLinePoints.length > 1 && (
                          <polyline
                            points={currentLinePoints.map((p) => `${p.x},${p.y}`).join(" ")}
                            fill="none"
                            stroke="white"
                            strokeWidth={brushWidth * 2}
                            strokeOpacity={Math.min(1, Math.max(0.2, (blurPressure / 100) * 0.95))}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                      </mask>
                      {currentFreehandLines.map((line) => line.arrowEnd ? (
                        <marker
                          key={`arrow_${line.id}`}
                          id={`arrow_${line.id}`}
                          markerWidth="6"
                          markerHeight="6"
                          refX="4"
                          refY="3"
                          orient="auto-start-reverse"
                          markerUnits="strokeWidth"
                        >
                          <path d="M 0 0 L 6 3 L 0 6 z" fill={line.color} />
                        </marker>
                      ) : null)}
                      <marker
                        id="arrow_active"
                        markerWidth="6"
                        markerHeight="6"
                        refX="4"
                        refY="3"
                        orient="auto-start-reverse"
                        markerUnits="strokeWidth"
                      >
                        <path d="M 0 0 L 6 3 L 0 6 z" fill={brushColor} />
                      </marker>
                    </defs>

                    {/* Live Blurred Image Layer, masked only over the blur strokes */}
                    {(currentFreehandLines.some((l) => l.isBlur) || (isDrawing && activeTool === "blur" && currentLinePoints.length > 1)) && (
                      <image
                        href={activeSlice.url}
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        preserveAspectRatio="none"
                        style={{ filter: `blur(${Math.max(3, Math.round((blurPressure / 100) * 20))}px)` }}
                        mask="url(#blur-live-mask)"
                      />
                    )}

                    {currentFreehandLines.filter((l) => !l.isBlur).map((line) => {
                      if (line.penShape && line.penShape !== "standard") {
                        const step = Math.max(14, line.width * 2.5);
                        const pts: { x: number; y: number }[] = [];
                        if (line.points.length > 0) {
                          pts.push(line.points[0]);
                          let acc = 0;
                          for (let i = 1; i < line.points.length; i++) {
                            const p1 = line.points[i - 1];
                            const p2 = line.points[i];
                            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                            if (dist === 0) continue;
                            acc += dist;
                            while (acc >= step) {
                              acc -= step;
                              const ratio = 1 - acc / dist;
                              pts.push({ x: p1.x + (p2.x - p1.x) * ratio, y: p1.y + (p2.y - p1.y) * ratio });
                            }
                          }
                        }

                        if (line.penShape === "dots") {
                          return (
                            <g key={line.id}>
                              {pts.map((p, idx) => (
                                <circle key={idx} cx={p.x} cy={p.y} r={line.width} fill={line.color} opacity={line.opacity} />
                              ))}
                            </g>
                          );
                        }

                        const charMap: Record<string, string> = {
                          stars: "⭐",
                          cars: "🚗",
                          hearts: "❤️",
                          sparkles: "✨",
                          arrows: "➔",
                        };

                        const stampChar = charMap[line.penShape] || "⭐";
                        return (
                          <g key={line.id}>
                            {pts.map((p, idx) => (
                              <text
                                key={idx}
                                x={p.x}
                                y={p.y}
                                fontSize={`${Math.max(12, line.width * 3)}px`}
                                textAnchor="middle"
                                dominantBaseline="central"
                                opacity={line.opacity}
                                fill={line.penShape === "arrows" ? line.color : undefined}
                              >
                                {stampChar}
                              </text>
                            ))}
                          </g>
                        );
                      }

                      return (
                        <polyline
                          key={line.id}
                          points={line.points.map((p) => `${p.x},${p.y}`).join(" ")}
                          fill="none"
                          stroke={line.color}
                          strokeWidth={line.width}
                          strokeOpacity={line.opacity}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          markerEnd={line.arrowEnd ? `url(#arrow_${line.id})` : undefined}
                          style={line.isSmudge ? { filter: "blur(6px)" } : undefined}
                        />
                      );
                    })}

                    {isDrawing && currentLinePoints.length > 1 && activeTool !== "blur" && (
                      penShape && penShape !== "standard" ? (
                        (() => {
                          const step = Math.max(14, brushWidth * 2.5);
                          const pts: { x: number; y: number }[] = [];
                          if (currentLinePoints.length > 0) {
                            pts.push(currentLinePoints[0]);
                            let acc = 0;
                            for (let i = 1; i < currentLinePoints.length; i++) {
                              const p1 = currentLinePoints[i - 1];
                              const p2 = currentLinePoints[i];
                              const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                              if (dist === 0) continue;
                              acc += dist;
                              while (acc >= step) {
                                acc -= step;
                                const ratio = 1 - acc / dist;
                                pts.push({ x: p1.x + (p2.x - p1.x) * ratio, y: p1.y + (p2.y - p1.y) * ratio });
                              }
                            }
                          }

                          if (penShape === "dots") {
                            return (
                              <g>
                                {pts.map((p, idx) => (
                                  <circle key={idx} cx={p.x} cy={p.y} r={brushWidth} fill={brushColor} opacity={brushOpacity} />
                                ))}
                              </g>
                            );
                          }

                          const charMap: Record<string, string> = {
                            stars: "⭐",
                            cars: "🚗",
                            hearts: "❤️",
                            sparkles: "✨",
                            arrows: "➔",
                          };

                          const stampChar = charMap[penShape] || "⭐";
                          return (
                            <g>
                              {pts.map((p, idx) => (
                                <text
                                  key={idx}
                                  x={p.x}
                                  y={p.y}
                                  fontSize={`${Math.max(12, brushWidth * 3)}px`}
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  opacity={brushOpacity}
                                  fill={penShape === "arrows" ? brushColor : undefined}
                                >
                                  {stampChar}
                                </text>
                              ))}
                            </g>
                          );
                        })()
                      ) : (
                        <polyline
                          points={currentLinePoints.map((p) => `${p.x},${p.y}`).join(" ")}
                          fill="none"
                          stroke={(activeTool === "smudge" || activeTool === "sprayCan") ? (brushColor || "#10b981") : brushColor}
                          strokeWidth={(activeTool === "smudge" || activeTool === "sprayCan") ? brushWidth * 2 : brushWidth}
                          strokeOpacity={(activeTool === "smudge" || activeTool === "sprayCan") ? 0.5 : brushOpacity}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          markerEnd={brushArrowEnd ? `url(#arrow_active)` : undefined}
                          style={(activeTool === "smudge" || activeTool === "sprayCan") ? { filter: "blur(6px)" } : undefined}
                        />
                      )
                    )}
                  </svg>
                )}

                {/* Custom Tools Overlay (Polygon Selection, Patch Boxes) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                  {/* Polygon Selection Overlay */}
                  {activeTool === "polygonSelection" && polygonPoints.length > 0 && (
                    <g>
                      {isPolygonClosed ? (
                        <polygon
                          points={polygonPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                          fill="rgba(99, 102, 241, 0.18)"
                          stroke="#6366f1"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          className="pointer-events-auto cursor-pointer"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handlePolygonClone();
                          }}
                        >
                          <title>{uiText("components_shape_studio_modal.title.double_click_to_apply_polygon_clone", "Double-click to apply polygon clone")}</title>
                        </polygon>
                      ) : (
                        <polyline
                          points={polygonPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                          fill="rgba(99, 102, 241, 0.08)"
                          stroke="#6366f1"
                          strokeWidth="2"
                          className="pointer-events-auto cursor-pointer"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (polygonPoints.length >= 3) {
                              setIsPolygonClosed(true);
                              handlePolygonClone();
                            }
                          }}
                        />
                      )}
                      {hoverCoords && !isPolygonClosed && (
                        <line
                          x1={polygonPoints[polygonPoints.length - 1].x}
                          y1={polygonPoints[polygonPoints.length - 1].y}
                          x2={hoverCoords.x}
                          y2={hoverCoords.y}
                          stroke="#6366f1"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                        />
                      )}
                      {polygonPoints.map((pt, idx) => (
                        <circle
                          key={idx}
                          cx={pt.x}
                          cy={pt.y}
                          r="5"
                          fill={idx === 0 ? "#10b981" : "#6366f1"}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="pointer-events-auto cursor-pointer"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (polygonPoints.length >= 3) {
                              setIsPolygonClosed(true);
                              handlePolygonClone();
                            }
                          }}
                        />
                      ))}
                    </g>
                  )}

                  {/* Pen / Lasso Selection Overlay */}
                  {activeTool === "pen" && penPoints.length > 0 && (
                    <g>
                      {isPenClosed ? (
                        <polygon
                          points={penPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                          fill="rgba(244, 63, 94, 0.18)"
                          stroke="#f43f5e"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          className="pointer-events-auto cursor-pointer"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handlePenCutout("layer");
                          }}
                        >
                          <title>{uiText("components_shape_studio_modal.title.double_click_to_apply_cutout_to_layer", "Double-click to apply cutout to layer")}</title>
                        </polygon>
                      ) : (
                        <polyline
                          points={penPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                          fill="rgba(244, 63, 94, 0.08)"
                          stroke="#f43f5e"
                          strokeWidth="2"
                          className="pointer-events-auto cursor-pointer"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (penPoints.length >= 3) {
                              setIsPenClosed(true);
                              handlePenCutout("layer");
                            }
                          }}
                        />
                      )}
                      {hoverCoords && !isPenClosed && (
                        <line
                          x1={penPoints[penPoints.length - 1].x}
                          y1={penPoints[penPoints.length - 1].y}
                          x2={hoverCoords.x}
                          y2={hoverCoords.y}
                          stroke="#f43f5e"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                        />
                      )}
                      {penPoints.map((pt, idx) => (
                        <circle
                          key={idx}
                          cx={pt.x}
                          cy={pt.y}
                          r="5"
                          fill={idx === 0 ? "#10b981" : "#f43f5e"}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="pointer-events-auto cursor-pointer"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (penPoints.length >= 3) {
                              setIsPenClosed(true);
                              handlePenCutout("layer");
                            }
                          }}
                        />
                      ))}
                    </g>
                  )}

                  {/* Patch Tool Overlay Boxes */}
                  {activeTool === "patch" && (
                    <g>
                      {patchSourceBox && (
                        <g>
                          <rect
                            x={patchSourceBox.x}
                            y={patchSourceBox.y}
                            width={patchSourceBox.width}
                            height={patchSourceBox.height}
                            fill="rgba(239, 68, 68, 0.15)"
                            stroke="#ef4444"
                            strokeWidth="2"
                            strokeDasharray="5 5"
                            className="cursor-move pointer-events-auto"
                          />
                          <foreignObject
                            x={patchSourceBox.x}
                            y={patchSourceBox.y - 22}
                            width={Math.max(120, patchSourceBox.width)}
                            height="20"
                          >
                            <div className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap w-fit">
                              {uiText("components_shape_studio_modal.div.source_patch_target", "Source (Patch Target)")}
                            </div>
                          </foreignObject>
                        </g>
                      )}
                      {patchDestBox && (
                        <g>
                          <rect
                            x={patchDestBox.x}
                            y={patchDestBox.y}
                            width={patchDestBox.width}
                            height={patchDestBox.height}
                            fill="rgba(34, 197, 94, 0.15)"
                            stroke="#22c55e"
                            strokeWidth="2"
                            strokeDasharray="5 5"
                            className="cursor-move pointer-events-auto"
                          />
                          <foreignObject
                            x={patchDestBox.x}
                            y={patchDestBox.y - 22}
                            width={Math.max(120, patchDestBox.width)}
                            height="20"
                          >
                            <div className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap w-fit">
                              {uiText("components_shape_studio_modal.div.destination_sample_pixels", "Destination (Sample Pixels)")}
                            </div>
                          </foreignObject>
                        </g>
                      )}
                      {patchSourceBox && patchDestBox && (
                        <line
                          x1={patchDestBox.x + patchDestBox.width / 2}
                          y1={patchDestBox.y + patchDestBox.height / 2}
                          x2={patchSourceBox.x + patchSourceBox.width / 2}
                          y2={patchSourceBox.y + patchSourceBox.height / 2}
                          stroke="#3b82f6"
                          strokeWidth="2.5"
                          strokeDasharray="6 4"
                        />
                      )}
                    </g>
                  )}

                  {/* Magic Wand Selection Mask Overlay */}
                  {activeTool === "magicWand" && wandSelection && (
                    <g>
                      <image
                        href={wandSelection.maskDataUrl}
                        x="0"
                        y="0"
                        width={imgNaturalSize.width}
                        height={imgNaturalSize.height}
                        preserveAspectRatio="none"
                        className="pointer-events-none"
                        opacity="0.85"
                      />
                      <rect
                        x={wandSelection.bounds.x - 2}
                        y={wandSelection.bounds.y - 2}
                        width={wandSelection.bounds.width + 4}
                        height={wandSelection.bounds.height + 4}
                        fill="none"
                        stroke="#c084fc"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                        className="pointer-events-none animate-pulse"
                      />
                    </g>
                  )}
                </svg>

                {/* Vector Shape Layers Overlay */}
                {showShapeLayers &&
                  currentLayers
                    .filter((l) => l.visible !== false)
                    .map((layer) => {
                      const isSelected = selectedLayerIds.includes(layer.id);
                      return (
                        <div
                          key={layer.id}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (layer.type === "bubble" || layer.type === "text") {
                              setEditingLayerText({ id: layer.id, text: layer.text || "" });
                            }
                          }}
                          className={`absolute group/layer ${
                            isSelected ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950" : ""
                          } ${activeTool === "crop" ? "pointer-events-none" : ""}`}
                          style={{
                            left: `${layer.x}px`,
                            top: `${layer.y}px`,
                            width: `${layer.width}px`,
                            height: `${layer.height}px`,
                            transform: `rotate(${layer.rotation || 0}deg) skew(${layer.skewX || 0}deg, ${layer.skewY || 0}deg)`,
                            opacity: layer.opacity,
                            zIndex: layer.zIndex,
                          }}
                        >
                          {/* Shape Content */}
                          <div className="w-full h-full flex items-center justify-center relative">
                            {layer.type === "image" && layer.imageUrl && (
                              <img
                                src={layer.imageUrl}
                                alt={uiText("components_shape_studio_modal.img.marquee_copy.alt", "Marquee Copy")}
                                className="w-full h-full object-fill pointer-events-none"
                              />
                            )}

                            {layer.type === "rect" && (
                              <div
                                className="w-full h-full"
                                style={{
                                  backgroundColor: layer.fillColor,
                                  border: `${layer.strokeWidth}px ${layer.lineStyle} ${layer.strokeColor}`,
                                  borderRadius: `${layer.borderRadius ?? 0}px`,
                                }}
                              />
                            )}

                            {layer.type === "circle" && (
                              <div
                                className="w-full h-full rounded-full"
                                style={{
                                  backgroundColor: layer.fillColor,
                                  border: `${layer.strokeWidth}px ${layer.lineStyle} ${layer.strokeColor}`,
                                }}
                              />
                            )}

                            {layer.type === "line" && (
                              <div
                                className="w-full"
                                style={{
                                  height: `${layer.strokeWidth || 4}px`,
                                  backgroundColor: layer.strokeColor || "#10b981",
                                }}
                              />
                            )}

                            {layer.type === "arrow" && (
                              <div className="w-full h-full flex items-center justify-between relative">
                                <div
                                  className="flex-1"
                                  style={{
                                    height: `${layer.strokeWidth || 3}px`,
                                    backgroundColor: layer.strokeColor || "#10b981",
                                  }}
                                />
                                <div
                                  className="w-0 h-0 border-y-8 border-y-transparent border-l-[16px]"
                                  style={{ borderLeftColor: layer.strokeColor || "#10b981" }}
                                />
                              </div>
                            )}

                            {layer.type === "curvedArrow" && (
                              <svg className="w-full h-full">
                                <path
                                  d={`M 0 ${layer.height} Q ${layer.width / 2} 0 ${layer.width - 20} 20`}
                                  fill="none"
                                  stroke={layer.strokeColor || "#10b981"}
                                  strokeWidth={layer.strokeWidth || 3}
                                />
                                <polygon
                                  points={`${layer.width},20 ${layer.width - 15},10 ${layer.width - 10},28`}
                                  fill={layer.strokeColor || "#10b981"}
                                />
                              </svg>
                            )}

                            {layer.type === "curvedArrowLeft" && (
                              <svg className="w-full h-full">
                                <path
                                  d={`M ${layer.width} ${layer.height} Q ${layer.width / 2} 0 20 20`}
                                  fill="none"
                                  stroke={layer.strokeColor || "#10b981"}
                                  strokeWidth={layer.strokeWidth || 3}
                                />
                                <polygon
                                  points={`0,20 15,10 10,28`}
                                  fill={layer.strokeColor || "#10b981"}
                                />
                              </svg>
                            )}

                            {layer.type === "doubleArrow" && (
                              <svg className="w-full h-full">
                                <line
                                  x1="16"
                                  y1={layer.height / 2}
                                  x2={layer.width - 16}
                                  y2={layer.height / 2}
                                  stroke={layer.strokeColor || "#10b981"}
                                  strokeWidth={layer.strokeWidth || 3}
                                />
                                <polygon
                                  points={`0,${layer.height / 2} 18,${layer.height / 2 - 8} 18,${layer.height / 2 + 8}`}
                                  fill={layer.strokeColor || "#10b981"}
                                />
                                <polygon
                                  points={`${layer.width},${layer.height / 2} ${layer.width - 18},${layer.height / 2 - 8} ${layer.width - 18},${layer.height / 2 + 8}`}
                                  fill={layer.strokeColor || "#10b981"}
                                />
                              </svg>
                            )}

                            {layer.type === "tripleArrow" && (
                              <svg className="w-full h-full">
                                {[0, 1, 2].map((i) => {
                                  const spacing = layer.width / 3;
                                  const cx = i * spacing + spacing / 2;
                                  const aw = spacing - 8;
                                  const cy = layer.height / 2;
                                  return (
                                    <React.Fragment key={i}>
                                      <line
                                        x1={cx - aw / 2}
                                        y1={cy}
                                        x2={cx + aw / 2 - 12}
                                        y2={cy}
                                        stroke={layer.strokeColor || "#10b981"}
                                        strokeWidth={layer.strokeWidth || 3}
                                      />
                                      <polygon
                                        points={`${cx + aw / 2},${cy} ${cx + aw / 2 - 14},${cy - 7} ${cx + aw / 2 - 14},${cy + 7}`}
                                        fill={layer.strokeColor || "#10b981"}
                                      />
                                    </React.Fragment>
                                  );
                                })}
                              </svg>
                            )}

                            {layer.type === "star" && (
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{ color: layer.fillColor }}
                              >
                                <Star className="w-full h-full fill-current stroke-slate-100" />
                              </div>
                            )}

                            {layer.type === "bubble" && (
                              <div
                                className="w-full h-full rounded-2xl flex items-center justify-center text-center p-3 shadow-lg relative"
                                style={{
                                  backgroundColor: layer.fillColor,
                                  border: `${layer.strokeWidth}px ${layer.lineStyle} ${layer.strokeColor}`,
                                  color: layer.textColor || "#0f172a",
                                  fontSize: `${layer.fontSize || 18}px`,
                                  fontFamily: layer.fontFamily,
                                }}
                              >
                                {layer.text || "Double click to edit text..."}
                              </div>
                            )}

                            {layer.type === "text" && (
                              <div
                                className="w-full h-full flex items-center justify-center text-center p-2"
                                style={{
                                  color: layer.textColor || "#ffffff",
                                  fontSize: `${layer.fontSize || 24}px`,
                                  fontFamily: layer.fontFamily,
                                  fontWeight: layer.isBold ? "bold" : "normal",
                                  fontStyle: layer.isItalic ? "italic" : "normal",
                                }}
                              >
                                {layer.text || "Double click to edit..."}
                              </div>
                            )}
                          </div>

                           {/* Grab Handles Suite for H/W/skew/rotate/delete */}
                           {isSelected && (
                             <>
                               {/* Rotate Handle */}
                               <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-50 pointer-events-auto">
                                 <div className="w-0.5 h-3.5 bg-indigo-500" />
                                 <div
                                   onMouseDown={(e) => {
                                     e.stopPropagation();
                                     const coords = getStageCoords(e);
                                     setDragState({
                                       type: "rotate",
                                       startX: coords.x,
                                       startY: coords.y,
                                       initialLayers: JSON.parse(JSON.stringify(currentLayers)),
                                     });
                                   }}
                                   className="w-4 h-4 bg-indigo-500 hover:bg-indigo-400 border border-white rounded-full cursor-grab active:cursor-grabbing shadow-md flex items-center justify-center text-[10px] text-white font-bold select-none"
                                   title={uiText("components_shape_studio_modal.div.rotate.title", "Rotate")}
                                 >
                                   ↻
                                 </div>
                               </div>

                               {/* Width Handle (E) */}
                               <div
                                 onMouseDown={(e) => {
                                   e.stopPropagation();
                                   const coords = getStageCoords(e);
                                   setDragState({
                                     type: "resize",
                                     handle: "e",
                                     startX: coords.x,
                                     startY: coords.y,
                                     initialLayers: JSON.parse(JSON.stringify(currentLayers)),
                                   });
                                 }}
                                 className="w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm absolute top-1/2 -translate-y-1/2 -right-1.5 cursor-e-resize shadow-md z-50 pointer-events-auto"
                                 title={uiText("components_shape_studio_modal.div.resize_width.title", "Resize Width")}
                               />

                               {/* Height Handle (S) */}
                               <div
                                 onMouseDown={(e) => {
                                   e.stopPropagation();
                                   const coords = getStageCoords(e);
                                   setDragState({
                                     type: "resize",
                                     handle: "s",
                                     startX: coords.x,
                                     startY: coords.y,
                                     initialLayers: JSON.parse(JSON.stringify(currentLayers)),
                                   });
                                 }}
                                 className="w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm absolute left-1/2 -translate-x-1/2 -bottom-1.5 cursor-s-resize shadow-md z-50 pointer-events-auto"
                                 title={uiText("components_shape_studio_modal.div.resize_height.title", "Resize Height")}
                               />

                               {/* Corner Scale Handle (SE) */}
                               <div
                                 onMouseDown={(e) => {
                                   e.stopPropagation();
                                   const coords = getStageCoords(e);
                                   setDragState({
                                     type: "resize",
                                     handle: "se",
                                     startX: coords.x,
                                     startY: coords.y,
                                     initialLayers: JSON.parse(JSON.stringify(currentLayers)),
                                   });
                                 }}
                                 className="w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm absolute -bottom-1.5 -right-1.5 cursor-se-resize shadow-md z-50 pointer-events-auto"
                                 title={uiText("components_shape_studio_modal.div.resize_corner.title", "Resize Corner")}
                               />

                               {/* Skew X Handle */}
                               <div
                                 onMouseDown={(e) => {
                                   e.stopPropagation();
                                   const coords = getStageCoords(e);
                                   setDragState({
                                     type: "skewX",
                                     startX: coords.x,
                                     startY: coords.y,
                                     initialLayers: JSON.parse(JSON.stringify(currentLayers)),
                                   });
                                 }}
                                 className="w-3 h-3 bg-amber-400 hover:bg-amber-300 border border-amber-600 rounded-full absolute -top-1.5 left-1/4 -translate-x-1/2 cursor-ew-resize shadow-md z-50 pointer-events-auto"
                                 title={uiText("components_shape_studio_modal.div.skew_x.title", "Skew X")}
                               />

                               {/* Skew Y Handle */}
                               <div
                                 onMouseDown={(e) => {
                                   e.stopPropagation();
                                   const coords = getStageCoords(e);
                                   setDragState({
                                     type: "skewY",
                                     startX: coords.x,
                                     startY: coords.y,
                                     initialLayers: JSON.parse(JSON.stringify(currentLayers)),
                                   });
                                 }}
                                 className="w-3 h-3 bg-amber-400 hover:bg-amber-300 border border-amber-600 rounded-full absolute top-1/4 -translate-y-1/2 -left-1.5 cursor-ns-resize shadow-md z-50 pointer-events-auto"
                                 title={uiText("components_shape_studio_modal.div.skew_y.title", "Skew Y")}
                               />

                               {/* Delete Handle */}
                               <CustomizableButton
                                 buttonId="shape_studio_modal_btn_85"
                                 defaultLabel={"✕"}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleDeleteSelected();
                                 }}
className="w-4 h-4 bg-rose-600 hover:bg-rose-500 border border-white rounded-full absolute -top-2 -right-2 cursor-pointer flex items-center justify-center text-white text-[9px] font-bold shadow-md z-50 transition-transform hover:scale-110 active:scale-90 pointer-events-auto"
title={uiText("components_shape_studio_modal.button.delete_layer.title", "Delete Layer")}
                               />
                             </>
                           )}
                        </div>
                      );
                    })}



                {/* Visual Marquee Box with handles & clone button */}
                {marqueeBox && (
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const coords = getStageCoords(e);
                      setDragState({
                        type: "marquee_move",
                        startX: coords.x,
                        startY: coords.y,
                        initialLayers: [],
                        initialMarqueeBox: { ...marqueeBox },
                      });
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (marqueeBox && marqueeBox.width > 0 && marqueeBox.height > 0) {
                        handleCloneArea(marqueeBox);
                      }
                    }}
                    className="absolute border-2 border-dashed border-indigo-500 bg-indigo-500/10 pointer-events-auto z-45 cursor-move"
                    style={{
                      left: `${marqueeBox.x}px`,
                      top: `${marqueeBox.y}px`,
                      width: `${marqueeBox.width}px`,
                      height: `${marqueeBox.height}px`,
                    }}
                    title={uiText("components_shape_studio_modal.div.double_click_inside_selection_to_apply_clone.title", "Double-click inside selection to apply clone | Drag to reposition | Arrow keys to nudge (Shift for 10px) | Enter to Clone | Shift+Enter to Save Asset")}
                  >
                    {/* Corner resize handles for marquee box */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setDragState({
                          type: "marquee_adjust",
                          handle: "nw",
                          startX: marqueeBox.x + marqueeBox.width,
                          startY: marqueeBox.y + marqueeBox.height,
                          initialLayers: [],
                        });
                      }}
                      className="w-2.5 h-2.5 bg-white border border-indigo-600 rounded-sm absolute -top-1.25 -left-1.25 cursor-nwse-resize shadow z-50 pointer-events-auto"
                      title={uiText("components_shape_studio_modal.div.adjust_top_left.title", "Adjust Top Left")}
                    />
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setDragState({
                          type: "marquee_adjust",
                          handle: "ne",
                          startX: marqueeBox.x,
                          startY: marqueeBox.y + marqueeBox.height,
                          initialLayers: [],
                        });
                      }}
                      className="w-2.5 h-2.5 bg-white border border-indigo-600 rounded-sm absolute -top-1.25 -right-1.25 cursor-nesw-resize shadow z-50 pointer-events-auto"
                      title={uiText("components_shape_studio_modal.div.adjust_top_right.title", "Adjust Top Right")}
                    />
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setDragState({
                          type: "marquee_adjust",
                          handle: "sw",
                          startX: marqueeBox.x + marqueeBox.width,
                          startY: marqueeBox.y,
                          initialLayers: [],
                        });
                      }}
                      className="w-2.5 h-2.5 bg-white border border-indigo-600 rounded-sm absolute -bottom-1.25 -left-1.25 cursor-nesw-resize shadow z-50 pointer-events-auto"
                      title={uiText("components_shape_studio_modal.div.adjust_bottom_left.title", "Adjust Bottom Left")}
                    />
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setDragState({
                          type: "marquee_adjust",
                          handle: "se",
                          startX: marqueeBox.x,
                          startY: marqueeBox.y,
                          initialLayers: [],
                        });
                      }}
                      className="w-2.5 h-2.5 bg-white border border-indigo-600 rounded-sm absolute -bottom-1.25 -right-1.25 cursor-nwse-resize shadow z-50 pointer-events-auto"
                      title={uiText("components_shape_studio_modal.div.adjust_bottom_right.title", "Adjust Bottom Right")}
                    />

                    {/* Floating Marquee Control Overlay at Top of Selection */}
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#090d19]/95 border border-indigo-500/40 rounded-xl px-2.5 py-1.5 shadow-2xl flex items-center gap-1.5 whitespace-nowrap z-50 pointer-events-auto"
                    >
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_84"
                        defaultIcon={<Copy className="w-3 h-3" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloneArea(marqueeBox);
                        }}
className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow"
title={uiText("components_shape_studio_modal.button.clone_selection_as_a_new_layer_double_click.title", "Clone selection as a new layer (Double-click selection or press Enter)")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_shape_studio_modal.span.clone_2", "Clone")}</span>
                              <kbd className="bg-indigo-900/90 text-indigo-200 px-1 py-0.2 text-[8px] rounded font-mono border border-indigo-700/50">{uiText("components_shape_studio_modal.kbd.enter_4", "Enter")}</kbd>
                              </>
                            )}
                      </CustomizableButton>
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_83"
                        defaultIcon={<Bookmark className="w-3 h-3" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveMarqueeAsAsset(marqueeBox);
                        }}
className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow"
title={uiText("components_shape_studio_modal.button.save_selection_directly_to_saved_layer_asset.title", "Save selection directly to Saved Layer Assets (Press Shift+Enter)")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_shape_studio_modal.span.save", "Save")}</span>
                              <kbd className="bg-emerald-900/90 text-emerald-200 px-1 py-0.2 text-[8px] rounded font-mono border border-emerald-700/50">{uiText("components_shape_studio_modal.kbd.enter_5", "⇧+Enter")}</kbd>
                              </>
                            )}
                      </CustomizableButton>
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_82"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMarqueeBox(null);
                        }}
className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer"
title={uiText("components_shape_studio_modal.button.cancel_selection_press_esc.title", "Cancel selection (Press Esc)")}
                      >
                          {() => (
                              <>
                                {uiText("components_shape_studio_modal.button.cancel_2", "Cancel")}
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  </div>
                )}

                {/* Live Select & Resize / Stretch Tool Overlay */}
                {activeTool === "selectResize" && selectResizeBox && !selectResizeSnapshot && (
                  <div
                    className="absolute border-2 border-dashed border-cyan-400 bg-cyan-500/15 pointer-events-none z-45"
                    style={{
                      left: `${selectResizeBox.x}px`,
                      top: `${selectResizeBox.y}px`,
                      width: `${selectResizeBox.width}px`,
                      height: `${selectResizeBox.height}px`,
                    }}
                  >
                    <div className="absolute top-1 left-1 bg-cyan-950/90 border border-cyan-500/60 rounded px-1.5 py-0.5 text-[9px] font-mono text-cyan-300 shadow">
                      {Math.round(selectResizeBox.width)}×{Math.round(selectResizeBox.height)}{uiText("components_shape_studio_modal.div.px", " px")}
                    </div>
                  </div>
                )}

                {activeTool === "selectResize" && selectResizeBox && selectResizeSnapshot && (
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const coords = getStageCoords(e);
                      setDragState({
                        type: "select_resize_move",
                        startX: coords.x,
                        startY: coords.y,
                        initialLayers: [],
                        initialSelectResizeBox: { ...selectResizeBox },
                      });
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleStampSelectResize();
                    }}
                    className="absolute border-2 border-cyan-400 bg-cyan-400/5 pointer-events-auto z-45 cursor-move shadow-2xl"
                    style={{
                      left: `${selectResizeBox.x}px`,
                      top: `${selectResizeBox.y}px`,
                      width: `${selectResizeBox.width}px`,
                      height: `${selectResizeBox.height}px`,
                    }}
                    title={uiText("components_shape_studio_modal.div.drag_to_reposition_drag_handles_to_stretch_r.title", "Drag to reposition | Drag handles to stretch/resize | Double-click or press Enter to stamp onto image")}
                  >
                    {/* Live Stretched Texture Preview */}
                    <img
                      src={selectResizeSnapshot.imageUrl}
                      alt={uiText("components_shape_studio_modal.img.stretched_area.alt", "Stretched Area")}
                      draggable={false}
                      className="w-full h-full pointer-events-none select-none"
                      style={{
                        objectFit: "fill",
                        opacity: selectResizeOpacity,
                      }}
                    />

                    {/* Center Dimension Badge */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950/80 border border-cyan-500/40 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-300 pointer-events-none shadow backdrop-blur-sm opacity-90">
                      {Math.round(selectResizeBox.width)}×{Math.round(selectResizeBox.height)}
                    </div>

                    {/* 8 Resize/Stretch Handles (4 Corners + 4 Edges) */}
                    {/* Corner NW */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const coords = getStageCoords(e);
                        setDragState({
                          type: "select_resize_adjust",
                          handle: "nw",
                          startX: coords.x,
                          startY: coords.y,
                          initialLayers: [],
                          initialSelectResizeBox: { ...selectResizeBox },
                        });
                      }}
                      className="w-3 h-3 bg-white border-2 border-cyan-600 rounded-sm absolute -top-1.5 -left-1.5 cursor-nwse-resize shadow z-50 pointer-events-auto"
                      title={uiText("components_shape_studio_modal.div.stretch_top_left.title", "Stretch Top-Left")}
                    />
                    {/* Edge N */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const coords = getStageCoords(e);
                        setDragState({
                          type: "select_resize_adjust",
                          handle: "n",
                          startX: coords.x,
                          startY: coords.y,
                          initialLayers: [],
                          initialSelectResizeBox: { ...selectResizeBox },
                        });
                      }}
                      className="w-3 h-3 bg-white border-2 border-cyan-600 rounded-sm absolute -top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize shadow z-50 pointer-events-auto"
                      title={uiText("components_shape_studio_modal.div.stretch_height_top.title", "Stretch Height (Top)")}
                    />
                    {/* Corner NE */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const coords = getStageCoords(e);
                        setDragState({
                          type: "select_resize_adjust",
                          handle: "ne",
                          startX: coords.x,
                          startY: coords.y,
                          initialLayers: [],
                          initialSelectResizeBox: { ...selectResizeBox },
                        });
                      }}
                      className="w-3 h-3 bg-white border-2 border-cyan-600 rounded-sm absolute -top-1.5 -right-1.5 cursor-nesw-resize shadow z-50 pointer-events-auto"
                      title={uiText("components_shape_studio_modal.div.stretch_top_right.title", "Stretch Top-Right")}
                    />
                    {/* Edge E */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const coords = getStageCoords(e);
                        setDragState({
                          type: "select_resize_adjust",
                          handle: "e",
                          startX: coords.x,
                          startY: coords.y,
                          initialLayers: [],
                          initialSelectResizeBox: { ...selectResizeBox },
                        });
                      }}
                      className="w-3 h-3 bg-white border-2 border-cyan-600 rounded-sm absolute top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize shadow z-50 pointer-events-auto"
                      title={uiText("components_shape_studio_modal.div.stretch_width_right.title", "Stretch Width (Right)")}
                    />
                    {/* Corner SE */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const coords = getStageCoords(e);
                        setDragState({
                          type: "select_resize_adjust",
                          handle: "se",
                          startX: coords.x,
                          startY: coords.y,
                          initialLayers: [],
                          initialSelectResizeBox: { ...selectResizeBox },
                        });
                      }}
                      className="w-3 h-3 bg-white border-2 border-cyan-600 rounded-sm absolute -bottom-1.5 -right-1.5 cursor-nwse-resize shadow z-50 pointer-events-auto"
                      title={uiText("components_shape_studio_modal.div.stretch_bottom_right.title", "Stretch Bottom-Right")}
                    />
                    {/* Edge S */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const coords = getStageCoords(e);
                        setDragState({
                          type: "select_resize_adjust",
                          handle: "s",
                          startX: coords.x,
                          startY: coords.y,
                          initialLayers: [],
                          initialSelectResizeBox: { ...selectResizeBox },
                        });
                      }}
                      className="w-3 h-3 bg-white border-2 border-cyan-600 rounded-sm absolute -bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize shadow z-50 pointer-events-auto"
                      title={uiText("components_shape_studio_modal.div.stretch_height_bottom.title", "Stretch Height (Bottom)")}
                    />
                    {/* Corner SW */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const coords = getStageCoords(e);
                        setDragState({
                          type: "select_resize_adjust",
                          handle: "sw",
                          startX: coords.x,
                          startY: coords.y,
                          initialLayers: [],
                          initialSelectResizeBox: { ...selectResizeBox },
                        });
                      }}
                      className="w-3 h-3 bg-white border-2 border-cyan-600 rounded-sm absolute -bottom-1.5 -left-1.5 cursor-nesw-resize shadow z-50 pointer-events-auto"
                      title={uiText("components_shape_studio_modal.div.stretch_bottom_left.title", "Stretch Bottom-Left")}
                    />
                    {/* Edge W */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const coords = getStageCoords(e);
                        setDragState({
                          type: "select_resize_adjust",
                          handle: "w",
                          startX: coords.x,
                          startY: coords.y,
                          initialLayers: [],
                          initialSelectResizeBox: { ...selectResizeBox },
                        });
                      }}
                      className="w-3 h-3 bg-white border-2 border-cyan-600 rounded-sm absolute top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize shadow z-50 pointer-events-auto"
                      title={uiText("components_shape_studio_modal.div.stretch_width_left.title", "Stretch Width (Left)")}
                    />

                    {/* Floating Action Pill directly above the stretched area */}
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#090d19]/95 border border-cyan-500/50 rounded-xl px-2.5 py-1.5 shadow-2xl flex items-center gap-1.5 whitespace-nowrap z-50 pointer-events-auto"
                    >
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_81"
                        defaultIcon={<Check className="w-3 h-3" />}
                        type="button"
onClick={(e) => {
                          e.stopPropagation();
                          handleStampSelectResize();
                        }}
className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow active:scale-95"
title={uiText("components_shape_studio_modal.button.stamp_stretched_area_onto_image_press_enter.title", "Stamp stretched area onto image (Press Enter or Double-click)")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_shape_studio_modal.span.stamp_onto_image_2", "Stamp onto Image")}</span>
                              <kbd className="bg-cyan-950/90 text-cyan-200 px-1 py-0.2 text-[8px] rounded font-mono border border-cyan-700/50">{uiText("components_shape_studio_modal.kbd.enter_6", "Enter")}</kbd>
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_80"
                        defaultIcon={<Layers className="w-3 h-3" />}
                        type="button"
onClick={(e) => {
                          e.stopPropagation();
                          handleConvertSelectResizeToLayer();
                        }}
className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow active:scale-95"
title={uiText("components_shape_studio_modal.button.save_as_movable_canvas_layer.title", "Save as movable canvas layer")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_shape_studio_modal.span.to_layer_2", "To Layer")}</span>
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_79"
                        defaultIcon={<RotateCcw className="w-3 h-3" />}
                        type="button"
onClick={(e) => {
                          e.stopPropagation();
                          handleResetSelectResize();
                        }}
className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium px-1.5 py-1 rounded-lg transition-colors cursor-pointer"
title={uiText("components_shape_studio_modal.button.reset_to_initial_size.title", "Reset to initial size")}
                      />

                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_78"
                        type="button"
onClick={(e) => {
                          e.stopPropagation();
                          handleCancelSelectResize();
                        }}
className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium px-2 py-1 rounded-lg transition-colors cursor-pointer"
title={uiText("components_shape_studio_modal.button.cancel_press_esc.title", "Cancel (Press Esc)")}
                      >
                          {() => (
                              <>
                                {uiText("components_shape_studio_modal.button.cancel_3", "Cancel")}
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  </div>
                )}

                {/* Live Canvas Resize Interactive Bounding Box & Handles Overlay */}
                {activeTool === "canvasSize" && showCanvasResizePreview && (
                  <div
                    className="absolute border-2 border-dashed border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.45)] pointer-events-none z-45"
                    style={{
                      left: `${previewBoxLeft}px`,
                      top: `${previewBoxTop}px`,
                      width: `${previewBoxWidth}px`,
                      height: `${previewBoxHeight}px`,
                    }}
                  >
                    {/* Visual Anchor Indicator Crosshair */}
                    <div
                      className={`absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/30 border border-cyan-400 flex items-center justify-center shadow-lg pointer-events-none ${
                        canvasAnchor < 3 ? "top-3" : canvasAnchor < 6 ? "top-1/2" : "bottom-1"
                      } ${
                        canvasAnchor % 3 === 0 ? "left-3" : canvasAnchor % 3 === 1 ? "left-1/2" : "right-1"
                      }`}
                      title={uiText("components_shape_studio_modal.div.canvas_anchor_point.title", "Canvas Anchor Point")}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 absolute" />
                    </div>

                    {/* Top Center Floating Dimension & Action HUD */}
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#090d19]/95 border border-cyan-500/50 rounded-xl px-3 py-1.5 shadow-2xl flex items-center gap-2 whitespace-nowrap z-50 pointer-events-auto"
                    >
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-slate-300 font-medium">{uiText("components_shape_studio_modal.span.new_frame", "New Frame:")}</span>
                        <span className="text-cyan-300 font-bold">
                          {previewBoxWidth} × {previewBoxHeight}{uiText("components_shape_studio_modal.span.px_12", " px")}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({previewBoxWidth >= imgNaturalSize.width ? `+${previewBoxWidth - imgNaturalSize.width}` : `${previewBoxWidth - imgNaturalSize.width}`}{uiText("components_shape_studio_modal.span.w_2", "w,")}{" "}
                          {previewBoxHeight >= imgNaturalSize.height ? `+${previewBoxHeight - imgNaturalSize.height}` : `${previewBoxHeight - imgNaturalSize.height}`}{uiText("components_shape_studio_modal.span.h_2", "h)")}
                        </span>
                      </div>

                      <div className="h-3 w-px bg-slate-800 mx-0.5" />

                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_77"
                        defaultIcon={<Check className="w-3 h-3" />}
                        type="button"
onClick={(e) => {
                          e.stopPropagation();
                          handleApplyCanvasSize();
                        }}
className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow"
title={uiText("components_shape_studio_modal.button.apply_canvas_size_press_enter.title", "Apply Canvas Size (Press Enter)")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_shape_studio_modal.span.apply", "Apply")}</span>
                              <kbd className="bg-emerald-900/90 text-emerald-200 px-1 py-0.2 text-[8px] rounded font-mono border border-emerald-700/50">{uiText("components_shape_studio_modal.kbd.enter_7", "Enter")}</kbd>
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_76"
                        defaultIcon={<RotateCcw className="w-2.5 h-2.5" />}
                        type="button"
onClick={(e) => {
                          e.stopPropagation();
                          setCanvasWidthInput(imgNaturalSize.width);
                          setCanvasHeightInput(imgNaturalSize.height);
                          setCanvasWidthOffset(0);
                          setCanvasHeightOffset(0);
                        }}
className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
title={uiText("components_shape_studio_modal.button.reset_canvas_size_to_original_press_esc.title", "Reset Canvas Size to Original (Press Esc)")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_shape_studio_modal.span.reset_2", "Reset")}</span>
                              <kbd className="bg-slate-900 text-slate-400 px-1 py-0.2 text-[8px] rounded font-mono border border-slate-700">{uiText("components_shape_studio_modal.kbd.esc", "Esc")}</kbd>
                              </>
                            )}
                      </CustomizableButton>
                    </div>

                    {/* 8-Point Interactive Canvas Resize Handles */}
                    {/* NW */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const unconstrained = getUnconstrainedStageCoords(e);
                        setDragState({
                          type: "canvas_resize_handle",
                          handle: "nw",
                          startX: unconstrained.x,
                          startY: unconstrained.y,
                          initialLayers: [],
                          initialCanvasW: previewBoxWidth,
                          initialCanvasH: previewBoxHeight,
                        });
                      }}
                      className="w-3 h-3 bg-cyan-400 hover:bg-cyan-300 border-2 border-white rounded-xs absolute -top-1.5 -left-1.5 cursor-nwse-resize shadow-md z-50 pointer-events-auto hover:scale-125 transition-transform"
                      title={uiText("components_shape_studio_modal.div.drag_to_resize_nw_corner.title", "Drag to resize NW corner")}
                    />
                    {/* N */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const unconstrained = getUnconstrainedStageCoords(e);
                        setDragState({
                          type: "canvas_resize_handle",
                          handle: "n",
                          startX: unconstrained.x,
                          startY: unconstrained.y,
                          initialLayers: [],
                          initialCanvasW: previewBoxWidth,
                          initialCanvasH: previewBoxHeight,
                        });
                      }}
                      className="w-3 h-3 bg-cyan-400 hover:bg-cyan-300 border-2 border-white rounded-xs absolute -top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize shadow-md z-50 pointer-events-auto hover:scale-125 transition-transform"
                      title={uiText("components_shape_studio_modal.div.drag_to_resize_height_top.title", "Drag to resize height (Top)")}
                    />
                    {/* NE */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const unconstrained = getUnconstrainedStageCoords(e);
                        setDragState({
                          type: "canvas_resize_handle",
                          handle: "ne",
                          startX: unconstrained.x,
                          startY: unconstrained.y,
                          initialLayers: [],
                          initialCanvasW: previewBoxWidth,
                          initialCanvasH: previewBoxHeight,
                        });
                      }}
                      className="w-3 h-3 bg-cyan-400 hover:bg-cyan-300 border-2 border-white rounded-xs absolute -top-1.5 -right-1.5 cursor-nesw-resize shadow-md z-50 pointer-events-auto hover:scale-125 transition-transform"
                      title={uiText("components_shape_studio_modal.div.drag_to_resize_ne_corner.title", "Drag to resize NE corner")}
                    />
                    {/* E */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const unconstrained = getUnconstrainedStageCoords(e);
                        setDragState({
                          type: "canvas_resize_handle",
                          handle: "e",
                          startX: unconstrained.x,
                          startY: unconstrained.y,
                          initialLayers: [],
                          initialCanvasW: previewBoxWidth,
                          initialCanvasH: previewBoxHeight,
                        });
                      }}
                      className="w-3 h-3 bg-cyan-400 hover:bg-cyan-300 border-2 border-white rounded-xs absolute top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize shadow-md z-50 pointer-events-auto hover:scale-125 transition-transform"
                      title={uiText("components_shape_studio_modal.div.drag_to_resize_width_right.title", "Drag to resize width (Right)")}
                    />
                    {/* SE */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const unconstrained = getUnconstrainedStageCoords(e);
                        setDragState({
                          type: "canvas_resize_handle",
                          handle: "se",
                          startX: unconstrained.x,
                          startY: unconstrained.y,
                          initialLayers: [],
                          initialCanvasW: previewBoxWidth,
                          initialCanvasH: previewBoxHeight,
                        });
                      }}
                      className="w-3 h-3 bg-cyan-400 hover:bg-cyan-300 border-2 border-white rounded-xs absolute -bottom-1.5 -right-1.5 cursor-nwse-resize shadow-md z-50 pointer-events-auto hover:scale-125 transition-transform"
                      title={uiText("components_shape_studio_modal.div.drag_to_resize_se_corner.title", "Drag to resize SE corner")}
                    />
                    {/* S */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const unconstrained = getUnconstrainedStageCoords(e);
                        setDragState({
                          type: "canvas_resize_handle",
                          handle: "s",
                          startX: unconstrained.x,
                          startY: unconstrained.y,
                          initialLayers: [],
                          initialCanvasW: previewBoxWidth,
                          initialCanvasH: previewBoxHeight,
                        });
                      }}
                      className="w-3 h-3 bg-cyan-400 hover:bg-cyan-300 border-2 border-white rounded-xs absolute -bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize shadow-md z-50 pointer-events-auto hover:scale-125 transition-transform"
                      title={uiText("components_shape_studio_modal.div.drag_to_resize_height_bottom.title", "Drag to resize height (Bottom)")}
                    />
                    {/* SW */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const unconstrained = getUnconstrainedStageCoords(e);
                        setDragState({
                          type: "canvas_resize_handle",
                          handle: "sw",
                          startX: unconstrained.x,
                          startY: unconstrained.y,
                          initialLayers: [],
                          initialCanvasW: previewBoxWidth,
                          initialCanvasH: previewBoxHeight,
                        });
                      }}
                      className="w-3 h-3 bg-cyan-400 hover:bg-cyan-300 border-2 border-white rounded-xs absolute -bottom-1.5 -left-1.5 cursor-nesw-resize shadow-md z-50 pointer-events-auto hover:scale-125 transition-transform"
                      title={uiText("components_shape_studio_modal.div.drag_to_resize_sw_corner.title", "Drag to resize SW corner")}
                    />
                    {/* W */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const unconstrained = getUnconstrainedStageCoords(e);
                        setDragState({
                          type: "canvas_resize_handle",
                          handle: "w",
                          startX: unconstrained.x,
                          startY: unconstrained.y,
                          initialLayers: [],
                          initialCanvasW: previewBoxWidth,
                          initialCanvasH: previewBoxHeight,
                        });
                      }}
                      className="w-3 h-3 bg-cyan-400 hover:bg-cyan-300 border-2 border-white rounded-xs absolute top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize shadow-md z-50 pointer-events-auto hover:scale-125 transition-transform"
                      title={uiText("components_shape_studio_modal.div.drag_to_resize_width_left.title", "Drag to resize width (Left)")}
                    />
                  </div>
                )}
              </div>
              );
            })() : (
              <div className="text-slate-500 text-sm font-medium">{uiText("components_shape_studio_modal.div.no_active_frame_selected", "No active frame selected")}</div>
            )}

            {/* Polygon Selection Floating Action Bar */}
            {activeTool === "polygonSelection" && polygonPoints.length > 0 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#090e1a]/95 border border-indigo-500/60 text-slate-100 px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs font-medium pointer-events-auto animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Pentagon className="w-4 h-4" />
                  <span>{uiText("components_shape_studio_modal.span.polygon_clone", "Polygon Clone")}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({polygonPoints.length}{uiText("components_shape_studio_modal.span.pts", " pts)")}</span>
                </div>

                {!isPolygonClosed ? (
                  <>
                    <span className="text-slate-400 text-[11px]">{uiText("components_shape_studio_modal.span.click_vertices_on_canvas", "(Click vertices on canvas)")}</span>
                    {polygonPoints.length >= 3 && (
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_75"
                        type="button"
onClick={(e) => {
                          e.stopPropagation();
                          setIsPolygonClosed(true);
                        }}
className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-xl font-bold text-[11px] transition-all shadow cursor-pointer active:scale-95 flex items-center gap-1"
                      >
                          {() => (
                              <>
                                {uiText("components_shape_studio_modal.button.close_selection", "Close Selection")}
                              </>
                            )}
                      </CustomizableButton>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />{uiText("components_shape_studio_modal.span.closed", " Closed")}
                    </span>
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_74"
                      defaultIcon={<Copy className="w-3.5 h-3.5" />}
                      type="button"
onClick={(e) => {
                        e.stopPropagation();
                        handlePolygonClone();
                      }}
className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1 rounded-xl font-extrabold text-[11px] transition-all shadow-lg cursor-pointer active:scale-95 flex items-center gap-1.5"
                    >
                        {() => (
                            <>
                              {uiText("components_shape_studio_modal.button.save_polygon_clone", " Save Polygon Clone")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                )}

                <CustomizableButton
                  buttonId="shape_studio_modal_btn_73"
                  type="button"
onClick={(e) => {
                    e.stopPropagation();
                    setPolygonPoints([]);
                    setIsPolygonClosed(false);
                  }}
className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-xl font-semibold text-[11px] transition-colors cursor-pointer"
                >
                    {() => (
                        <>
                          {uiText("components_shape_studio_modal.button.reset", "Reset")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            )}

            {/* Vector Pen & Lasso Selection Floating Action Bar */}
            {activeTool === "pen" && penPoints.length > 0 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#090e1a]/95 border border-rose-500/60 text-slate-100 px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs font-medium pointer-events-auto animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                  <Scissors className="w-4 h-4" />
                  <span>{uiText("components_shape_studio_modal.span.vector_cutout", "Vector Cutout")}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({penPoints.length}{uiText("components_shape_studio_modal.span.pts_2", " pts)")}</span>
                </div>

                {!isPenClosed ? (
                  <>
                    <span className="text-slate-400 text-[11px]">{uiText("components_shape_studio_modal.span.click_anchor_points_or_drag_for_lasso", "(Click anchor points or drag for Lasso)")}</span>
                    {penPoints.length >= 3 && (
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_72"
                        type="button"
onClick={(e) => {
                          e.stopPropagation();
                          setIsPenClosed(true);
                        }}
className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-xl font-bold text-[11px] transition-all shadow cursor-pointer active:scale-95 flex items-center gap-1"
                      >
                          {() => (
                              <>
                                {uiText("components_shape_studio_modal.button.close_path_2", "Close Path")}
                              </>
                            )}
                      </CustomizableButton>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />{uiText("components_shape_studio_modal.span.closed_2", " Closed")}
                    </span>
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_71"
                      defaultIcon={<Layers className="w-3.5 h-3.5" />}
                      type="button"
onClick={(e) => {
                        e.stopPropagation();
                        handlePenCutout("layer");
                      }}
className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1 rounded-xl font-extrabold text-[11px] transition-all shadow-lg cursor-pointer active:scale-95 flex items-center gap-1.5"
title={uiText("components_shape_studio_modal.button.double_click_selection_or_click_to_apply_cut.title", "Double-click selection or click to apply cutout to canvas layer")}
                    >
                        {() => (
                            <>
                              {uiText("components_shape_studio_modal.button.cutout_to_layer", " Cutout to Layer")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                )}

                {penPoints.length >= 3 && !isPenClosed && (
                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_70"
                    defaultIcon={<Layers className="w-3.5 h-3.5" />}
                    type="button"
onClick={(e) => {
                      e.stopPropagation();
                      setIsPenClosed(true);
                      handlePenCutout("layer");
                    }}
className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1 rounded-xl font-extrabold text-[11px] transition-all shadow-lg cursor-pointer active:scale-95 flex items-center gap-1.5"
title={uiText("components_shape_studio_modal.button.double_click_selection_or_click_to_close_and.title", "Double-click selection or click to close & apply cutout")}
                  >
                      {() => (
                          <>
                            {uiText("components_shape_studio_modal.button.cutout_to_layer_2", " Cutout to Layer")}
                          </>
                        )}
                  </CustomizableButton>
                )}

                <CustomizableButton
                  buttonId="shape_studio_modal_btn_69"
                  type="button"
onClick={(e) => {
                    e.stopPropagation();
                    setPenPoints([]);
                    setIsPenClosed(false);
                  }}
className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-xl font-semibold text-[11px] transition-colors cursor-pointer"
                >
                    {() => (
                        <>
                          {uiText("components_shape_studio_modal.button.reset_2", "Reset")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            )}

            {/* Continuous Straight Drawing Active Indicator Bar (Outside of scaled canvas) */}
            {isDrawing && activeTool === "brush" && brushLineMode === "continuous_straight" && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#090e1a]/95 border border-indigo-500/50 text-slate-100 px-3.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-medium pointer-events-auto">
                <span className="text-indigo-400 font-mono font-bold flex items-center gap-1">
                  <span>📐</span>{uiText("components_shape_studio_modal.span.continuous_line", " Continuous Line")}
                </span>
                <span className="text-slate-400 text-[10.5px]">{uiText("components_shape_studio_modal.span.click_points_to_draw_segments", "(Click points to draw segments)")}</span>
                <CustomizableButton
                  buttonId="shape_studio_modal_btn_68"
                  type="button"
onClick={(e) => {
                    e.stopPropagation();
                    finishContinuousDrawing();
                  }}
className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-0.5 rounded-full font-bold text-[11px] transition-colors shadow-sm cursor-pointer ml-1"
                >
                    {() => (
                        <>
                          {uiText("components_shape_studio_modal.button.finish_line_enter_double_click", "Finish Line (Enter / Double-Click)")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            )}

            {/* ADVANCED RETOUCH PANEL - Only show when activeTool is NOT canvasSize */}
            {isAdvancedPanelOpen && activeTool !== "canvasSize" && (
              <div
                style={{ left: advancedPanelPos.x, top: advancedPanelPos.y }}
                className="absolute bg-[#090e20]/95 border border-indigo-500/40 rounded-xl p-3 shadow-2xl z-50 w-[224px] text-slate-100 backdrop-blur-2xl flex flex-col gap-2.5 select-none animate-in fade-in zoom-in-95 pointer-events-auto text-left"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Drag Handle Header */}
                <div
                  className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-0.5 cursor-move"
                  onPointerDown={(e) => {
                    setIsDraggingAdvancedPanel(true);
                    setAdvancedPanelDragStart({
                      x: e.clientX - advancedPanelPos.x,
                      y: e.clientY - advancedPanelPos.y,
                    });
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    if (isDraggingAdvancedPanel) {
                      const newX = e.clientX - advancedPanelDragStart.x;
                      const newY = e.clientY - advancedPanelDragStart.y;
                      setAdvancedPanelPos({
                        x: Math.max(10, Math.min(window.innerWidth - 320, newX)),
                        y: Math.max(10, Math.min(window.innerHeight - 300, newY)),
                      });
                    }
                  }}
                  onPointerUp={(e) => {
                    setIsDraggingAdvancedPanel(false);
                    try {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    } catch {}
                  }}
                >
                  <span className="text-[10.5px] font-extrabold tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {uiText("components_shape_studio_modal.span.advanced_retouch", "Advanced retouch")}
                  </span>
                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_67"
                    defaultIcon={<X className="w-3.5 h-3.5" />}
                    type="button"
onClick={() => {
                      setIsAdvancedPanelOpen(false);
                      setIsRightSidebarOpen(true);
                      setActiveTool("pointer");
                    }}
onPointerDown={(e) => e.stopPropagation()}
className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                  />
                </div>

                {/* Compact Custom Dropdown Selector */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-400 font-extrabold tracking-wider">{uiText("components_shape_studio_modal.span.select_retouch_tool", "Select retouch tool")}</span>
                  <div className="relative">
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_66"
                      defaultIcon={<ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isRetouchDropdownOpen ? "rotate-180 text-indigo-400" : ""}`} />}
                      type="button"
onClick={() => setIsRetouchDropdownOpen(!isRetouchDropdownOpen)}
className="w-full flex items-center justify-between bg-slate-950/80 hover:bg-slate-900 border border-slate-800/85 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-200 transition-all cursor-pointer shadow-inner active:scale-[0.99]"
                    >
                        {() => (
                            <>
                              <div className="flex items-center gap-2">
                        {activeTool === "sprayCan" && <Wind className="w-4 h-4 text-emerald-400" />}
                        {activeTool === "blur" && <Cloud className="w-4 h-4 text-blue-400" />}
                        {(activeTool as string) === "canvasSize" && <Maximize2 className="w-4 h-4 text-indigo-400" />}
                        {activeTool === "polygonSelection" && <Pentagon className="w-4 h-4 text-amber-400" />}
                        {activeTool === "patch" && <Bandage className="w-4 h-4 text-rose-400" />}
                        {activeTool === "chromaKey" && <Pipette className="w-4 h-4 text-teal-400" />}
                        {activeTool === "pen" && <Scissors className="w-4 h-4 text-rose-400" />}
                        
                        <span>
                          {activeTool === "sprayCan" && "Spray Can"}
                          {activeTool === "blur" && "Real-Time Blur"}
                          {(activeTool as string) === "canvasSize" && "Canvas Size"}
                          {activeTool === "polygonSelection" && "Polygon Clone"}
                          {activeTool === "patch" && "Patch Tool"}
                          {activeTool === "chromaKey" && "Chroma Key"}
                          {activeTool === "pen" && "Pen & Lasso"}
                        </span>
                      </div>
                            </>
                          )}
                    </CustomizableButton>

                    {isRetouchDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#090e20] border border-slate-800 rounded-xl shadow-2xl z-55 overflow-hidden p-1.5 flex flex-col gap-1 animate-in fade-in slide-in-from-top-1">
                        {[
                          {
                            folderId: 0,
                            folderName: "Folder 1",
                            tools: [
                              { id: "sprayCan", name: "Spray Can", desc: "Blurry soft spray-paint stroke", icon: Wind, color: "text-emerald-400" },
                              { id: "blur", name: "Real-Time Blur", desc: "Live pixel blurring brush", icon: Cloud, color: "text-blue-400" },
                            ],
                          },
                          {
                            folderId: 1,
                            folderName: "Folder 2",
                            tools: [
                              { id: "polygonSelection", name: "Polygon Clone", desc: "Clone custom hand-drawn regions", icon: Pentagon, color: "text-amber-400" },
                              { id: "patch", name: "Patch Tool", desc: "Patch pixels from source to dest", icon: Bandage, color: "text-rose-400" },
                              { id: "pen", name: "Pen & Lasso Cutout", desc: "Draw custom vector paths around objects", icon: Scissors, color: "text-rose-400" },
                            ],
                          },
                          {
                            folderId: 2,
                            folderName: "Folder 3",
                            tools: [
                              { id: "canvasSize", name: "Canvas Size", desc: "Change active canvas bounds", icon: Maximize2, color: "text-indigo-400" },
                              { id: "chromaKey", name: "Chroma Key", desc: "Remove colored background screens", icon: Pipette, color: "text-teal-400" },
                            ],
                          },
                        ].map((folder) => {
                          const isExpanded = expandedRetouchFolder === folder.folderId;
                          return (
                            <div key={folder.folderId} className="border border-slate-800/80 rounded-lg overflow-hidden bg-slate-950/50">
                              <CustomizableButton
                                buttonId="shape_studio_modal_btn_65"
                                defaultIcon={<ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${isExpanded ? "rotate-180 text-indigo-400" : ""}`} />}
                                type="button"
onClick={() => setExpandedRetouchFolder(isExpanded ? null : folder.folderId)}
className="w-full flex items-center justify-between p-1.5 text-[10.5px] font-bold text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
                              >
                                  {() => (
                                      <>
                                        <div className="flex items-center gap-2">
                                  <span className="text-indigo-400">📁</span>
                                  <span>{folder.folderName}</span>
                                </div>
                                      </>
                                    )}
                              </CustomizableButton>

                              {isExpanded && (
                                <div className="p-1 border-t border-slate-900 flex flex-col gap-0.5 bg-[#070b16]">
                                  {folder.tools.map((tool) => {
                                    const IconComponent = tool.icon;
                                    return (
                                      <CustomizableButton
                                        buttonId="shape_studio_modal_btn_64"
                                        key={tool.id}
type="button"
onClick={() => {
                                          setActiveTool(tool.id as any);
                                          setIsRetouchDropdownOpen(false);
                                        }}
className={`w-full flex items-start gap-2 p-1.5 rounded-md text-left transition-all cursor-pointer ${
                                          activeTool === tool.id
                                            ? "bg-indigo-600/20 text-white border border-indigo-500/30"
                                            : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border border-transparent"
                                        }`}
                                      >
                                          {() => (
                                              <>
                                                <IconComponent className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${tool.color}`} />
                                              <div className="flex flex-col">
                                          <span className="text-[10px] font-bold text-slate-200 leading-none">{tool.name}</span>
                                          <span className="text-[8px] text-slate-500 leading-tight mt-0.5">{tool.desc}</span>
                                        </div>
                                              </>
                                            )}
                                      </CustomizableButton>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tool Options / Tool Info Section */}
                {activeTool === "sprayCan" ? (
                  <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-900/80 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] tracking-wider text-emerald-400 font-extrabold flex items-center gap-1">
                        <Wind className="w-3 h-3 text-emerald-400" />{uiText("components_shape_studio_modal.span.spray_can_options", " Spray can options")}
                      </span>
                      <span className="font-mono text-emerald-400 text-[10px] font-bold">{brushWidth * 2}{uiText("components_shape_studio_modal.span.px_13", "px")}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10.5px] font-medium text-slate-300">
                        <span>{uiText("components_shape_studio_modal.span.brush_size", "Brush Size")}</span>
                        <span className="font-mono text-indigo-400 font-bold">{brushWidth * 2}{uiText("components_shape_studio_modal.span.px_14", "px")}</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="80"
                        value={brushWidth}
                        onChange={(e) => setBrushWidth(Number(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer bg-slate-800 rounded-lg h-1.5"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-900/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-slate-400 italic">{uiText("components_shape_studio_modal.span.drag_on_canvas_to_spray_soft_color", "Drag on canvas to spray soft color")}</span>
                    </div>
                  </div>
                ) : activeTool === "blur" ? (
                  <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-900/80 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] tracking-wider text-blue-400 font-extrabold flex items-center gap-1">
                        <Cloud className="w-3 h-3 text-blue-400" />{uiText("components_shape_studio_modal.span.blur_brush_options", " Blur brush options")}
                      </span>
                      <span className="font-mono text-blue-400 text-[10px] font-bold">{blurPressure}%</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10.5px] font-medium text-slate-300">
                        <span>{uiText("components_shape_studio_modal.span.blur_brush_size", "Blur Brush Size")}</span>
                        <span className="font-mono text-indigo-400 font-bold">{brushWidth * 2}{uiText("components_shape_studio_modal.span.px_15", "px")}</span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="80"
                        value={brushWidth}
                        onChange={(e) => setBrushWidth(Number(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer bg-slate-800 rounded-lg h-1.5"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10.5px] font-medium text-slate-300">
                        <span>{uiText("components_shape_studio_modal.span.blur_pressure_strength", "Blur Pressure / Strength")}</span>
                        <span className="font-mono text-blue-400 font-bold">{blurPressure}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={blurPressure}
                        onChange={(e) => setBlurPressure(Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer bg-slate-800 rounded-lg h-1.5"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-900/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-[10px] text-slate-400 italic">{uiText("components_shape_studio_modal.span.drag_on_canvas_to_blur_pixels", "Drag on canvas to blur pixels")}</span>
                    </div>
                  </div>
                ) : activeTool === "polygonSelection" ? (
                  <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-900/80 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] tracking-wider text-amber-400 font-extrabold flex items-center gap-1">
                        <Pentagon className="w-3 h-3 text-amber-400" />{uiText("components_shape_studio_modal.span.polygon_clone_options", " Polygon clone options")}
                      </span>
                      <span className="font-mono text-amber-300 text-[10px] font-bold bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.5 rounded">
                        {polygonPoints.length} {polygonPoints.length === 1 ? "vertex" : "vertices"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 text-[10px] text-slate-300 leading-snug">
                      {polygonPoints.length === 0 ? (
                        <span className="text-slate-400 italic">{uiText("components_shape_studio_modal.span.click_on_image_canvas_to_draw_vertices", "🔷 Click on image canvas to draw vertices")}</span>
                      ) : isPolygonClosed ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">{uiText("components_shape_studio_modal.span.closed_polygon_ready_to_clone", "✓ Closed polygon ready to clone")}</span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">{uiText("components_shape_studio_modal.span.click_to_add_vertices", "⚡ Click to add vertices (")}{polygonPoints.length}{uiText("components_shape_studio_modal.span.added", " added)")}</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-900/60">
                      {polygonPoints.length >= 3 && !isPolygonClosed && (
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_63"
                          type="button"
onClick={(e) => {
                            e.stopPropagation();
                            setIsPolygonClosed(true);
                          }}
className="w-full bg-amber-600 hover:bg-amber-500 text-white py-1.5 rounded-lg font-bold text-[10px] transition-colors cursor-pointer text-center shadow"
                        >
                            {() => (
                                <>
                                  {uiText("components_shape_studio_modal.button.close_polygon_area", "Close Polygon Area")}
                                </>
                              )}
                        </CustomizableButton>
                      )}
                      {isPolygonClosed && (
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_62"
                          defaultIcon={<Copy className="w-3.5 h-3.5" />}
                          type="button"
onClick={(e) => {
                            e.stopPropagation();
                            handlePolygonClone();
                          }}
className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-1.5 rounded-lg font-extrabold text-[10px] transition-colors cursor-pointer text-center shadow-lg flex items-center justify-center gap-1 active:scale-[0.98]"
                        >
                            {() => (
                                <>
                                  {uiText("components_shape_studio_modal.button.save_polygon_clone_2", " Save Polygon Clone")}
                                </>
                              )}
                        </CustomizableButton>
                      )}
                      {polygonPoints.length > 0 && (
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_61"
                          type="button"
onClick={(e) => {
                            e.stopPropagation();
                            setPolygonPoints([]);
                            setIsPolygonClosed(false);
                          }}
className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 py-1 rounded-lg font-medium text-[9.5px] transition-colors cursor-pointer text-center"
                        >
                            {() => (
                                <>
                                  {uiText("components_shape_studio_modal.button.reset_vertices", "Reset Vertices")}
                                </>
                              )}
                        </CustomizableButton>
                      )}
                    </div>
                  </div>
                ) : activeTool === "patch" ? (
                  <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-900/80 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] tracking-wider text-rose-400 font-extrabold flex items-center gap-1">
                        <Bandage className="w-3 h-3 text-rose-400" />{uiText("components_shape_studio_modal.span.patch_tool_options", " Patch tool options")}
                      </span>
                      <span className="font-mono text-rose-300 text-[10px] font-bold bg-rose-950/60 border border-rose-800/40 px-1.5 py-0.5 rounded">
                        {patchSourceBox ? (patchDestBox ? "Ready" : "Placed") : "Idle"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 text-[10px] text-slate-300 leading-snug">
                      {!patchSourceBox ? (
                        <span className="text-slate-400 italic">{uiText("components_shape_studio_modal.span.drag_on_canvas_to_select_patch_source_area", "🩹 Drag on canvas to select patch source area")}</span>
                      ) : (
                        <span className="text-indigo-300 font-medium">{uiText("components_shape_studio_modal.span.drag_box_onto_target_area_to_patch", "✨ Drag box onto target area to patch")}</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-900/60">
                      {patchSourceBox && patchDestBox && (
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_60"
                          type="button"
onClick={(e) => {
                            e.stopPropagation();
                            handleApplyPatch();
                          }}
className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-1.5 rounded-lg font-bold text-[10px] transition-colors cursor-pointer text-center shadow-lg active:scale-[0.98]"
                        >
                            {() => (
                                <>
                                  {uiText("components_shape_studio_modal.button.apply_patch_layer", "Apply Patch Layer")}
                                </>
                              )}
                        </CustomizableButton>
                      )}
                      {patchSourceBox && (
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_59"
                          type="button"
onClick={(e) => {
                            e.stopPropagation();
                            setPatchSourceBox(null);
                            setPatchDestBox(null);
                          }}
className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 py-1 rounded-lg font-medium text-[9.5px] transition-colors cursor-pointer text-center"
                        >
                            {() => (
                                <>
                                  {uiText("components_shape_studio_modal.button.reset_patch_box", "Reset Patch Box")}
                                </>
                              )}
                        </CustomizableButton>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/50 rounded-xl p-2.5 border border-slate-900/60 flex flex-col gap-1.5 text-[10.5px] text-slate-400 leading-relaxed">
                    <div className="text-[9px] tracking-wider text-indigo-400 font-extrabold flex items-center gap-1">
                      <span>⚡</span>{uiText("components_shape_studio_modal.div.tool_info", " Tool info")}
                    </div>
                    {(activeTool as string) === "canvasSize" && (
                      <div className="flex flex-col gap-1 text-[10.5px]">
                        <p className="text-slate-300 font-semibold">{uiText("components_shape_studio_modal.p.canvas_bounds_editor", "Canvas Bounds Editor")}</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">{uiText("components_shape_studio_modal.p.resize_or_extend_active_canvas_boundaries_wi", "Resize or extend active canvas boundaries with solid or transparent fills.")}</p>
                      </div>
                    )}
                    {activeTool === "chromaKey" && (
                      <div className="flex flex-col gap-1 text-[10.5px]">
                        <p className="text-slate-300 font-semibold">{uiText("components_shape_studio_modal.p.chroma_key_background", "Chroma Key Background")}</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">{uiText("components_shape_studio_modal.p.instantly_remove_solid_color_backgrounds_fro", "Instantly remove solid color backgrounds from pictures or drawings.")}</p>
                      </div>
                    )}
                    {activeTool === "pen" && (
                      <div className="flex flex-col gap-1 text-[10.5px]">
                        <p className="text-rose-400 font-semibold">{uiText("components_shape_studio_modal.p.vector_pen_and_lasso_cutout", "Vector Pen & Lasso Cutout")}</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">{uiText("components_shape_studio_modal.p.click_to_place_precise_vector_anchors_or_cli", "Click to place precise vector anchors, or click & drag to draw a freehand Lasso cutout of objects or characters.")}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Panel Footer */}
                {activeTool === "sprayCan" || activeTool === "blur" ? (
                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-900/60 font-bold">
                    <span className="text-slate-400">{uiText("components_shape_studio_modal.span.brush_active", "Brush active")}</span>
                    <span className={activeTool === "sprayCan" ? "text-emerald-400/90" : "text-blue-400/90"}>{uiText("components_shape_studio_modal.span.real_time_canvas_drawing", "Real-time canvas drawing")}</span>
                  </div>
                ) : activeTool === "polygonSelection" ? (
                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-900/60 font-bold">
                    <span className="text-slate-400">{uiText("components_shape_studio_modal.span.polygon_active", "Polygon active")}</span>
                    <span className="text-amber-400/90 font-mono">{polygonPoints.length}{uiText("components_shape_studio_modal.span.vertices", " vertices")}</span>
                  </div>
                ) : activeTool === "patch" ? (
                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-900/60 font-bold">
                    <span className="text-slate-400">{uiText("components_shape_studio_modal.span.patch_active", "Patch active")}</span>
                    <span className="text-rose-400/90">{patchSourceBox ? (patchDestBox ? "Ready to apply" : "Move to target") : "Select source"}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-900/60 font-bold">
                    <span>{uiText("components_shape_studio_modal.span.wing_attached", "Wing attached")}</span>
                    <span className="text-indigo-400/85 animate-pulse">{uiText("components_shape_studio_modal.span.options_panel_open", "👉 Options panel open")}</span>
                  </div>
                )}
              </div>
            )}

            {/* SECONDARY OPTIONS FLYOUT WING (Attached to the right of the Retouch Panel, or standalone when canvasSize) */}
            {isAdvancedPanelOpen && activeTool !== "sprayCan" && activeTool !== "blur" && activeTool !== "polygonSelection" && activeTool !== "patch" && activeTool !== "pen" && (
              <div
                style={{
                  left: activeTool === "canvasSize" ? advancedPanelPos.x : advancedPanelPos.x + 222,
                  top: advancedPanelPos.y,
                }}
                className={`absolute bg-[#090e20]/95 border border-indigo-500/40 rounded-xl p-3 shadow-2xl z-50 w-[240px] text-slate-100 backdrop-blur-2xl flex flex-col gap-2.5 select-none ${
                  activeTool === "canvasSize" ? "animate-in fade-in zoom-in-95" : "animate-in slide-in-from-left-2"
                } pointer-events-auto text-left`}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Wing Header */}
                <div
                  className={`flex items-center justify-between border-b border-slate-800/80 pb-2 mb-0.5 ${
                    activeTool === "canvasSize" ? "cursor-move" : ""
                  }`}
                  onPointerDown={(e) => {
                    if (activeTool === "canvasSize") {
                      setIsDraggingAdvancedPanel(true);
                      setAdvancedPanelDragStart({
                        x: e.clientX - advancedPanelPos.x,
                        y: e.clientY - advancedPanelPos.y,
                      });
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }
                  }}
                  onPointerMove={(e) => {
                    if (isDraggingAdvancedPanel && activeTool === "canvasSize") {
                      const newX = e.clientX - advancedPanelDragStart.x;
                      const newY = e.clientY - advancedPanelDragStart.y;
                      setAdvancedPanelPos({
                        x: Math.max(10, Math.min(window.innerWidth - 320, newX)),
                        y: Math.max(10, Math.min(window.innerHeight - 300, newY)),
                      });
                    }
                  }}
                  onPointerUp={(e) => {
                    if (activeTool === "canvasSize") {
                      setIsDraggingAdvancedPanel(false);
                      try {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      } catch {}
                    }
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] font-extrabold tracking-wider text-slate-300">
                      {activeTool === "canvasSize" && "Canvas size options"}
                      {activeTool === "chromaKey" && "Chroma key options"}
                    </span>
                  </div>

                  {activeTool === "canvasSize" && (
                    <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_58"
                        type="button"
onClick={() => {
                          setActiveTool("sprayCan");
                        }}
className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors text-[9px] font-bold"
title={uiText("components_shape_studio_modal.button.return_to_main_retouch_tools.title", "Return to Main Retouch Tools")}
                      >
                          {() => (
                              <>
                                {uiText("components_shape_studio_modal.button.tools", "Tools")}
                              </>
                            )}
                      </CustomizableButton>
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_57"
                        defaultIcon={<X className="w-3.5 h-3.5" />}
                        type="button"
onClick={() => {
                          setIsAdvancedPanelOpen(false);
                          setIsRightSidebarOpen(true);
                          setActiveTool("pointer");
                        }}
className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
title={uiText("components_shape_studio_modal.button.close.title", "Close")}
                      />
                    </div>
                  )}
                </div>

                {/* Sub-controls based on activeTool */}
                <div className="text-xs flex flex-col gap-2.5">
                  {activeTool === "canvasSize" && (
                    <div className="flex flex-col gap-2 text-slate-200">
                      {/* Dimensions Info: Compact Inline Row */}
                      <div className="text-[10px] bg-slate-950/60 p-1.5 rounded-lg border border-slate-900/60 flex flex-col gap-1 font-mono">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">{uiText("components_shape_studio_modal.span.current", "Current:")}</span>
                          <span className="font-bold text-slate-300">
                            {imgNaturalSize.width}×{imgNaturalSize.height}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-medium">{uiText("components_shape_studio_modal.span.new_est", "New Est:")}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-cyan-400 font-bold">
                              {(() => {
                                const w = canvasRelative ? (imgNaturalSize.width + canvasWidthOffset) : canvasWidthInput;
                                const h = canvasRelative ? (imgNaturalSize.height + canvasHeightOffset) : canvasHeightInput;
                                return `${Math.max(1, w)}×${Math.max(1, h)}`;
                              })()}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {(() => {
                                const w = canvasRelative ? (imgNaturalSize.width + canvasWidthOffset) : canvasWidthInput;
                                const h = canvasRelative ? (imgNaturalSize.height + canvasHeightOffset) : canvasHeightInput;
                                const dw = Math.max(1, w) - imgNaturalSize.width;
                                const dh = Math.max(1, h) - imgNaturalSize.height;
                                return `(${dw >= 0 ? `+${dw}` : dw}, ${dh >= 0 ? `+${dh}` : dh})`;
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Live Preview Toggle Pill */}
                      <div className="flex items-center justify-between bg-slate-950/40 px-2 py-1 rounded-lg border border-slate-900/60">
                        <span className="text-[9.5px] text-slate-300 flex items-center gap-1 font-medium">
                          <Eye className={`w-3 h-3 ${showCanvasResizePreview ? "text-cyan-400" : "text-slate-500"}`} />
                          {uiText("components_shape_studio_modal.span.live_frame_preview", "Live Frame Preview")}
                        </span>
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_56"
                          type="button"
onClick={() => setShowCanvasResizePreview(!showCanvasResizePreview)}
className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                            showCanvasResizePreview
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                              : "bg-slate-900 text-slate-500 border border-slate-800"
                          }`}
                        >
                            {() => (
                                <>
                                  {showCanvasResizePreview ? "ON" : "OFF"}
                                </>
                              )}
                        </CustomizableButton>
                      </div>

                      {/* Inputs with Up/Down Chevrons in a tight flex row */}
                      <div className="flex items-center gap-1.5 bg-slate-950/30 p-1.5 rounded-lg border border-slate-900/50">
                        {/* Width Input + Stepper Chevrons */}
                        <div className="flex items-center gap-1 flex-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 focus-within:border-cyan-500 min-w-0">
                          <span className="text-[9.5px] font-bold text-slate-400 shrink-0">{uiText("components_shape_studio_modal.span.w_3", "W:")}</span>
                          <input
                            type="number"
                            value={canvasRelative ? canvasWidthOffset : canvasWidthInput}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (canvasRelative) {
                                setCanvasWidthOffset(val);
                              } else {
                                setCanvasWidthInput(Math.max(1, val));
                              }
                            }}
                            className="w-full bg-transparent text-[10.5px] text-white font-mono text-center focus:outline-none min-w-0"
                          />
                          <div className="flex flex-col -my-0.5 shrink-0">
                            <CustomizableButton
                              buttonId="shape_studio_modal_btn_55"
                              defaultIcon={<ChevronUp className="w-2.5 h-2.5" />}
                              type="button"
onClick={() => {
                                if (canvasRelative) {
                                  setCanvasWidthOffset((v) => v + 10);
                                } else {
                                  setCanvasWidthInput((v) => v + 10);
                                }
                              }}
className="text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded p-0.25 cursor-pointer transition-colors"
title={uiText("components_shape_studio_modal.button.increase_width_10px.title", "Increase Width (+10px)")}
                            />
                            <CustomizableButton
                              buttonId="shape_studio_modal_btn_54"
                              defaultIcon={<ChevronDown className="w-2.5 h-2.5" />}
                              type="button"
onClick={() => {
                                if (canvasRelative) {
                                  setCanvasWidthOffset((v) => v - 10);
                                } else {
                                  setCanvasWidthInput((v) => Math.max(1, v - 10));
                                }
                              }}
className="text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded p-0.25 cursor-pointer transition-colors"
title={uiText("components_shape_studio_modal.button.decrease_width_10px.title", "Decrease Width (-10px)")}
                            />
                          </div>
                        </div>

                        {/* Height Input + Stepper Chevrons */}
                        <div className="flex items-center gap-1 flex-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 focus-within:border-cyan-500 min-w-0">
                          <span className="text-[9.5px] font-bold text-slate-400 shrink-0">{uiText("components_shape_studio_modal.span.h_3", "H:")}</span>
                          <input
                            type="number"
                            value={canvasRelative ? canvasHeightOffset : canvasHeightInput}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (canvasRelative) {
                                setCanvasHeightOffset(val);
                              } else {
                                setCanvasHeightInput(Math.max(1, val));
                              }
                            }}
                            className="w-full bg-transparent text-[10.5px] text-white font-mono text-center focus:outline-none min-w-0"
                          />
                          <div className="flex flex-col -my-0.5 shrink-0">
                            <CustomizableButton
                              buttonId="shape_studio_modal_btn_53"
                              defaultIcon={<ChevronUp className="w-2.5 h-2.5" />}
                              type="button"
onClick={() => {
                                if (canvasRelative) {
                                  setCanvasHeightOffset((v) => v + 10);
                                } else {
                                  setCanvasHeightInput((v) => v + 10);
                                }
                              }}
className="text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded p-0.25 cursor-pointer transition-colors"
title={uiText("components_shape_studio_modal.button.increase_height_10px.title", "Increase Height (+10px)")}
                            />
                            <CustomizableButton
                              buttonId="shape_studio_modal_btn_52"
                              defaultIcon={<ChevronDown className="w-2.5 h-2.5" />}
                              type="button"
onClick={() => {
                                if (canvasRelative) {
                                  setCanvasHeightOffset((v) => v - 10);
                                } else {
                                  setCanvasHeightInput((v) => Math.max(1, v - 10));
                                }
                              }}
className="text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded p-0.25 cursor-pointer transition-colors"
title={uiText("components_shape_studio_modal.button.decrease_height_10px.title", "Decrease Height (-10px)")}
                            />
                          </div>
                        </div>

                        {/* Relative Toggle checkbox */}
                        <CustomizableLabel
                          labelId="shape_studio_modal_item_51"
                          as="label"
                          className="flex items-center gap-1 cursor-pointer select-none pl-0.5 shrink-0"
title={uiText("components_shape_studio_modal.label.relative_offset_mode.title", "Relative offset mode")}
                        >
                            {() => (
                                <>
                                  <input
                            type="checkbox"
                            checked={canvasRelative}
                            onChange={(e) => setCanvasRelative(e.target.checked)}
                            className="rounded border-slate-800 text-cyan-600 focus:ring-cyan-500/20 w-3 h-3 bg-slate-950 cursor-pointer"
                          />
                                <span className="text-[9.5px] text-slate-300 font-medium">{uiText("components_shape_studio_modal.span.rel", "Rel")}</span>
                                </>
                              )}
                        </CustomizableLabel>
                      </div>

                      {/* Anchor & Extension Color Inline side-by-side */}
                      <div className="grid grid-cols-2 gap-2 pt-0.5 items-center">
                        {/* Anchor */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-400 font-bold tracking-wider">{uiText("components_shape_studio_modal.span.anchor", "Anchor:")}</span>
                          <div className="grid grid-cols-3 gap-0.5 w-[42px] h-[42px] bg-slate-950 border border-slate-800 p-0.5 rounded">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
                              <CustomizableButton
                                buttonId="shape_studio_modal_btn_50"
                                key={idx}
type="button"
onClick={() => setCanvasAnchor(idx)}
className={`w-full h-full rounded-sm flex items-center justify-center transition-all ${
                                  canvasAnchor === idx
                                    ? "bg-cyan-600 border border-cyan-400/30 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                                    : "bg-slate-900 hover:bg-slate-800"
                                }`}
                              >
                                  {() => (
                                      <>
                                        {canvasAnchor === idx ? (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white shadow" />
                                ) : (
                                  <div className="w-0.5 h-0.5 rounded-full bg-slate-700/60" />
                                )}
                                      </>
                                    )}
                              </CustomizableButton>
                            ))}
                          </div>
                        </div>

                        {/* Extension Color Type */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-400 font-bold tracking-wider">{uiText("components_shape_studio_modal.span.fill_color", "Fill color:")}</span>
                          <select
                            value={canvasExtensionColorType}
                            onChange={(e) => setCanvasExtensionColorType(e.target.value as any)}
                            className="bg-slate-950 border border-slate-800 text-slate-300 rounded p-0.5 text-[10px] w-full focus:outline-none focus:border-cyan-500"
                          >
                            <option value="transparent">{uiText("components_shape_studio_modal.option.transparent", "Transparent")}</option>
                            <option value="white">{uiText("components_shape_studio_modal.option.white", "White")}</option>
                            <option value="black">{uiText("components_shape_studio_modal.option.black", "Black")}</option>
                            <option value="custom">{uiText("components_shape_studio_modal.option.custom", "Custom")}</option>
                          </select>

                          {canvasExtensionColorType === "custom" && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                type="color"
                                value={canvasExtensionCustomColor}
                                onChange={(e) => setCanvasExtensionCustomColor(e.target.value)}
                                className="w-4 h-4 rounded border-0 cursor-pointer bg-transparent p-0"
                              />
                              <input
                                type="text"
                                value={canvasExtensionCustomColor}
                                onChange={(e) => setCanvasExtensionCustomColor(e.target.value)}
                                className="w-11 bg-slate-950 border border-slate-800 text-[8px] font-mono text-center rounded p-0.5 text-white"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-1.5 mt-1">
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_49"
                          defaultIcon={<Check className="w-3 h-3" />}
                          type="button"
onClick={handleApplyCanvasSize}
className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-1.5 rounded-lg font-bold text-[10px] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98]"
title={uiText("components_shape_studio_modal.button.apply_canvas_size_press_enter.title_2", "Apply Canvas Size (Press Enter)")}
                        >
                            {() => (
                                <>
                                  {uiText("components_shape_studio_modal.button.apply_2", " Apply")}
                                </>
                              )}
                        </CustomizableButton>
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_48"
                          defaultIcon={<RotateCcw className="w-2.5 h-2.5" />}
                          type="button"
onClick={() => {
                            setCanvasWidthInput(imgNaturalSize.width);
                            setCanvasHeightInput(imgNaturalSize.height);
                            setCanvasWidthOffset(0);
                            setCanvasHeightOffset(0);
                          }}
className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 py-1.5 rounded-lg font-semibold text-[10px] transition-all cursor-pointer flex items-center justify-center gap-1"
title={uiText("components_shape_studio_modal.button.reset_to_original_dimensions_press_esc.title", "Reset to Original Dimensions (Press Esc)")}
                        >
                            {() => (
                                <>
                                  {uiText("components_shape_studio_modal.button.reset_3", " Reset")}
                                </>
                              )}
                        </CustomizableButton>
                      </div>
                    </div>
                  )}

                  {activeTool === "chromaKey" && (
                    <div className="flex flex-col gap-2.5 text-slate-200">
                      <div className="text-[10px] bg-indigo-950/40 p-2 rounded-lg border border-indigo-900/30 text-slate-300 italic">
                        {uiText("components_shape_studio_modal.div.click_anywhere_on_the_image_above_to_pick_yo", "💡 Click anywhere on the image above to pick your chroma key color!")}
                      </div>

                      {/* Color Picker Section */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 font-bold tracking-wider">{uiText("components_shape_studio_modal.span.key_color", "Key color")}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={chromaKeyColor}
                            onChange={(e) => setChromaKeyColor(e.target.value)}
                            className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent p-0"
                            title={uiText("components_shape_studio_modal.input.choose_color.title", "Choose color")}
                          />
                          <input
                            type="text"
                            value={chromaKeyColor}
                            onChange={(e) => setChromaKeyColor(e.target.value)}
                            className="w-20 bg-slate-950 border border-slate-800 text-xs font-mono text-center rounded py-1 text-white uppercase focus:outline-none focus:border-indigo-500"
                          />
                          <div className="flex gap-1.5 ml-auto">
                            <CustomizableButton
                              buttonId="shape_studio_modal_btn_47"
                              type="button"
onClick={() => setChromaKeyColor("#00ff00")}
className="w-5 h-5 rounded bg-[#00ff00] border border-slate-700/60 hover:scale-105 transition-transform"
title={uiText("components_shape_studio_modal.button.green_screen_key.title", "Green Screen key")}
                            />
                            <CustomizableButton
                              buttonId="shape_studio_modal_btn_46"
                              type="button"
onClick={() => setChromaKeyColor("#0000ff")}
className="w-5 h-5 rounded bg-[#0000ff] border border-slate-700/60 hover:scale-105 transition-transform"
title={uiText("components_shape_studio_modal.button.blue_screen_key.title", "Blue Screen key")}
                            />
                            <CustomizableButton
                              buttonId="shape_studio_modal_btn_45"
                              type="button"
onClick={() => setChromaKeyColor("#ffffff")}
className="w-5 h-5 rounded bg-[#ffffff] border border-slate-700/60 hover:scale-105 transition-transform"
title={uiText("components_shape_studio_modal.button.white_key.title", "White key")}
                            />
                            <CustomizableButton
                              buttonId="shape_studio_modal_btn_44"
                              type="button"
onClick={() => setChromaKeyColor("#000000")}
className="w-5 h-5 rounded bg-[#000000] border border-slate-700/60 hover:scale-105 transition-transform"
title={uiText("components_shape_studio_modal.button.black_key.title", "Black key")}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tolerance slider */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px] font-medium text-slate-300">
                          <span>{uiText("components_shape_studio_modal.span.tolerance", "Tolerance")}</span>
                          <span className="font-mono text-indigo-400 font-bold">{chromaKeyTolerance}%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={chromaKeyTolerance}
                          onChange={(e) => setChromaKeyTolerance(Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer bg-slate-800 rounded-lg h-1.5"
                        />
                      </div>

                      {/* Smoothness slider */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px] font-medium text-slate-300">
                          <span>{uiText("components_shape_studio_modal.span.smoothness", "Smoothness")}</span>
                          <span className="font-mono text-indigo-400 font-bold">{chromaKeySmoothness}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={chromaKeySmoothness}
                          onChange={(e) => setChromaKeySmoothness(Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer bg-slate-800 rounded-lg h-1.5"
                        />
                      </div>

                      {/* Execute Button */}
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_43"
                        defaultIcon={<Pipette className="w-3.5 h-3.5" />}
                        type="button"
onClick={handleApplyChromaKey}
className="mt-1 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-1.5 rounded-lg font-bold text-[10.5px] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98]"
                      >
                          {() => (
                              <>
                                {uiText("components_shape_studio_modal.button.apply_chroma_key", "Apply Chroma Key")}
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Small Show Button when right sidebar panel is collapsed */}
            {!isRightSidebarOpen && (
              <CustomizableButton
                buttonId="shape_studio_modal_btn_42"
                id="ss3-show-btn"
type="button"
onClick={() => setIsRightSidebarOpen(true)}
className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-slate-900/95 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 border-l border-y border-indigo-500/40 rounded-l-xl p-2 py-3 shadow-2xl flex flex-col items-center gap-1.5 transition-all cursor-pointer hover:pl-3 group"
title={uiText("components_shape_studio_modal.button.show_shape_and_layer_studio.title", "Show Shape & Layer Studio")}
              >
                  {() => (
                      <>
                        <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-indigo-400" />
                      <Layers className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300" />
                      </>
                    )}
              </CustomizableButton>
            )}
          </div>

          {/* RIGHT SIDEBAR - "SHAPE & LAYER STUDIO" */}
          {isRightSidebarOpen && (
            <div id="ss3" className="w-80 bg-[#090d18] border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto z-20">
              {/* Section 1 (ABSOLUTE TOP): SAVED LAYER ASSETS */}
              <div className="border-b border-slate-800/80 flex flex-col bg-slate-950/40">
                <CustomizableButton
                  buttonId="shape_studio_modal_btn_41"
                  onClick={() => setIsLayerAssetsOpen((v) => !v)}
className="w-full p-3.5 flex items-center justify-between text-xs font-bold tracking-wider text-amber-300 hover:bg-slate-900/50 cursor-pointer transition-colors"
                >
                    {() => (
                        <>
                          <span className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-amber-400" />
                    {uiText("components_shape_studio_modal.span.saved_layer_assets", "Saved layer assets (")}{savedLayerAssets.length})
                  </span>
                        {isLayerAssetsOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                        </>
                      )}
                </CustomizableButton>

                {isLayerAssetsOpen && (
                  <div className="px-4 pb-4 flex flex-col gap-2">
                    {/* Action buttons to save layers or strokes */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_40"
                        defaultIcon={<Plus className="w-3 h-3" />}
                        disabled={!selectedLayer}
onClick={() => selectedLayer && handleSaveLayerAsAsset(selectedLayer)}
className="py-1.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 border border-amber-500/40 text-amber-300 font-bold text-[10px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98]"
title={uiText("components_shape_studio_modal.button.save_highlighted_canvas_layer_to_assets.title", "Save highlighted canvas layer to assets")}
                      >
                          {() => (
                              <>
                                {uiText("components_shape_studio_modal.button.save_layer", "Save layer")}
                              </>
                            )}
                      </CustomizableButton>

                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_39"
                        defaultIcon={<Bookmark className="w-3 h-3" />}
                        disabled={currentFreehandLines.length === 0}
onClick={() => {
                          const lastLine = currentFreehandLines[currentFreehandLines.length - 1];
                          if (lastLine) handleSaveLineAsAsset(lastLine);
                        }}
className="py-1.5 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98]"
title={uiText("components_shape_studio_modal.button.save_last_drawn_pen_brush_line_to_assets.title", "Save last drawn pen/brush line to assets")}
                      >
                          {() => (
                              <>
                                {uiText("components_shape_studio_modal.button.save_pen_line", "Save pen line")}
                              </>
                            )}
                      </CustomizableButton>
                    </div>

                    {/* List of saved assets */}
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                      {savedLayerAssets.length === 0 ? (
                        <div className="text-center py-4 text-slate-500 text-[11px] font-medium bg-slate-950/40 rounded-xl border border-slate-900 p-2">
                          {uiText("components_shape_studio_modal.div.no_saved_layer_assets_yet_select_a_layer_cut", "No saved layer assets yet. Select a layer, cutout, clone, or pen stroke and click save.")}
                        </div>
                      ) : (
                        savedLayerAssets.map((asset) => (
                          <div
                            key={asset.id}
                            className="p-2 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-all flex items-center justify-between gap-2 text-xs font-medium"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              {asset.previewUrl ? (
                                <img
                                  src={asset.previewUrl}
                                  alt={asset.name}
                                  className="w-7 h-7 object-contain rounded bg-slate-950 border border-slate-800 shrink-0"
                                />
                              ) : (
                                <div
                                  className="w-7 h-7 rounded bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0"
                                  style={{
                                    backgroundColor: asset.layerData?.fillColor && asset.layerData.fillColor !== "transparent" ? asset.layerData.fillColor : "transparent",
                                    borderColor: asset.layerData?.strokeColor || "#6366f1",
                                  }}
                                >
                                  {asset.type === "pen" ? (
                                    <Paintbrush className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : asset.type === "clone" || asset.type === "image" ? (
                                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                                  ) : asset.type === "bubble" || asset.type === "text" ? (
                                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                                  ) : (
                                    <Shapes className="w-3.5 h-3.5 text-amber-400" />
                                  )}
                                </div>
                              )}
                              <div className="flex flex-col overflow-hidden">
                                <span className="font-bold text-slate-200 truncate max-w-[100px] text-[11px]">
                                  {asset.name}
                                </span>
                                <span className="text-[9px] text-amber-400/90 capitalize font-mono">
                                  {asset.type}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <CustomizableButton
                                buttonId="shape_studio_modal_btn_38"
                                defaultIcon={<Plus className="w-3 h-3" />}
                                type="button"
onClick={() => handleInsertLayerAsset(asset)}
className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9.5px] rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-sm active:scale-95"
title={uiText("components_shape_studio_modal.button.use_in_current_storyboard_frame.title", "Use in current storyboard frame")}
                              >
                                  {() => (
                                      <>
                                        {uiText("components_shape_studio_modal.button.insert", " Insert")}
                                      </>
                                    )}
                              </CustomizableButton>
                              <CustomizableButton
                                buttonId="shape_studio_modal_btn_37"
                                defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                                type="button"
onClick={() => {
                                  setSavedLayerAssets((prev) => prev.filter((a) => a.id !== asset.id));
                                }}
className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer rounded transition-colors"
title={uiText("components_shape_studio_modal.button.delete_saved_asset.title", "Delete saved asset")}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: CANVAS VISIBILITY */}
              <div className="border-b border-slate-800/80">
                <CustomizableButton
                  buttonId="shape_studio_modal_btn_36"
                  onClick={() => setIsVisibilityOpen((v) => !v)}
className="w-full p-3.5 flex items-center justify-between text-xs font-bold tracking-wider text-slate-300 hover:bg-slate-900/50 cursor-pointer"
                >
                    {() => (
                        <>
                          <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  {uiText("components_shape_studio_modal.span.canvas_visibility", "Canvas visibility")}
                </span>
                        {isVisibilityOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
                        </>
                      )}
                </CustomizableButton>

              {isVisibilityOpen && (
                <div className="px-4 pb-4 space-y-2.5">
                  {/* Crop Controls (80% Smaller Panel) */}
                  <div className="p-2.5 bg-slate-900/90 border border-cyan-500/40 rounded-xl space-y-2 shadow-lg scale-90 origin-top">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-[10px] font-extrabold tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <CropIcon className="w-3.5 h-3.5 text-cyan-400" />
                        {uiText("components_shape_studio_modal.span.crop_workspace", "Crop workspace")}
                      </span>
                      {slices && slices.length > 0 && (
                        <div className="flex items-center gap-1 bg-slate-950/80 px-1.5 py-0.5 rounded-lg border border-cyan-500/20">
                          <CustomizableButton
                            buttonId="shape_studio_modal_btn_35"
                            defaultIcon={<ChevronLeft className="w-3 h-3" />}
                            type="button"
onClick={() => {
                              const next = activeIdx > 0 ? activeIdx - 1 : slices.length - 1;
                              setActiveIdx(next);
                              if (onNavigateFrame) onNavigateFrame(next);
                              setCrop(undefined);
                              setCompletedPercentCrop(null);
                              setCompletedPixelCrop(null);
                            }}
className="p-0.5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 rounded transition-all cursor-pointer"
title={uiText("components_shape_studio_modal.button.previous_frame.title_2", "Previous Frame")}
                          />
                          <span className="text-[9px] font-bold font-mono text-cyan-300 px-1">
                            {activeIdx + 1} / {slices.length}
                          </span>
                          <CustomizableButton
                            buttonId="shape_studio_modal_btn_34"
                            defaultIcon={<ChevronRight className="w-3 h-3" />}
                            type="button"
onClick={() => {
                              const next = activeIdx < slices.length - 1 ? activeIdx + 1 : 0;
                              setActiveIdx(next);
                              if (onNavigateFrame) onNavigateFrame(next);
                              setCrop(undefined);
                              setCompletedPercentCrop(null);
                              setCompletedPixelCrop(null);
                            }}
className="p-0.5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 rounded transition-all cursor-pointer"
title={uiText("components_shape_studio_modal.button.next_frame.title_2", "Next Frame")}
                          />
                        </div>
                      )}
                    </div>

                    {/* Shape Selector & Aspect Ratio */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-medium text-slate-400">{uiText("components_shape_studio_modal.span.crop_shape", "Crop shape:")}</span>
                        <div className="flex items-center gap-1">
                          <CustomizableButton
                            buttonId="shape_studio_modal_btn_33"
                            type="button"
onClick={() => setCropShape("rect")}
className={`px-2 py-0.5 text-[9.5px] font-bold rounded-md transition-all border cursor-pointer ${
                              cropShape === "rect"
                                ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                              {() => (
                                  <>
                                    {uiText("components_shape_studio_modal.button.rectangle", "Rectangle")}
                                  </>
                                )}
                          </CustomizableButton>
                          <CustomizableButton
                            buttonId="shape_studio_modal_btn_32"
                            type="button"
onClick={() => setCropShape("oval")}
className={`px-2 py-0.5 text-[9.5px] font-bold rounded-md transition-all border cursor-pointer ${
                              cropShape === "oval"
                                ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                              {() => (
                                  <>
                                    {uiText("components_shape_studio_modal.button.oval_circle", "Oval / circle")}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>
                      </div>

                      {/* Aspect Ratio Presets */}
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/60">
                        <span className="text-[10px] font-medium text-slate-400">{uiText("components_shape_studio_modal.span.aspect", "Aspect:")}</span>
                        <div className="flex items-center gap-1">
                          {(["free", "16:9", "4:3", "1:1", "9:16"] as const).map((ratio) => (
                            <CustomizableButton
                              buttonId="shape_studio_modal_btn_31"
                              key={ratio}
type="button"
onClick={() => setCropAspect(ratio)}
className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all border cursor-pointer ${
                                cropAspect === ratio
                                  ? "bg-cyan-500/30 border-cyan-400 text-cyan-200"
                                  : "bg-slate-950/80 border-slate-800/80 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                                {() => (
                                    <>
                                      {ratio === "free" ? "Free" : ratio}
                                    </>
                                  )}
                            </CustomizableButton>
                          ))}
                        </div>
                      </div>

                      {/* Quick Select Canvas (100%) */}
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_30"
                        defaultIcon={<Maximize2 className="w-3 h-3" />}
                        type="button"
onClick={handleSelectWholeCanvas}
className="w-full py-1 px-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 text-[9.5px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
title={uiText("components_shape_studio_modal.button.select_full_canvas_ctrl_a_or_double_click_on.title", "Select full canvas (Ctrl+A or Double-click on empty canvas)")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_shape_studio_modal.span.select_whole_canvas_100", "Select whole canvas (100%)")}</span>
                              </>
                            )}
                      </CustomizableButton>

                      {cropBox && cropBox.width > 0 && cropBox.height > 0 && (
                        <div className="flex items-center justify-between text-[9px] px-2 py-1 bg-slate-950/90 rounded-lg border border-slate-800">
                          <span className="text-slate-400">
                            {cropBox.width} × {cropBox.height}{uiText("components_shape_studio_modal.span.px_16", " px")}
                          </span>
                          <CustomizableButton
                            buttonId="shape_studio_modal_btn_29"
                            type="button"
onClick={() => setIsCropSelected((prev) => !prev)}
className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold cursor-pointer transition-colors ${
                              isCropSelected
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30"
                                : "bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                            }`}
title={isCropSelected ? "Click to deselect (keeps definition)" : "Click to select"}
                          >
                              {() => (
                                  <>
                                    {isCropSelected ? "Selected (Deselect)" : "Deselected (Select)"}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-800/80">
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_28"
                        defaultIcon={<Check className="w-3 h-3" />}
                        onClick={handleApplyCrop}
disabled={!(cropBox && cropBox.width > 0 && cropBox.height > 0)}
className="px-2 py-1 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-extrabold text-[9.5px] rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
title={uiText("components_shape_studio_modal.button.apply_crop_to_active_frame_double_click_insi.title", "Apply Crop to active frame (Double click inside selection)")}
                      >
                          {() => (
                              <>
                                {uiText("components_shape_studio_modal.button.apply_3", " Apply")}
                              </>
                            )}
                      </CustomizableButton>
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_27"
                        defaultIcon={<Copy className="w-3 h-3" />}
                        onClick={handleCopyCrop}
disabled={!(cropBox && cropBox.width > 0 && cropBox.height > 0)}
className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-extrabold text-[9.5px] rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
title={uiText("components_shape_studio_modal.button.copy_selection_into_layer.title", "Copy selection into layer")}
                      >
                          {() => (
                              <>
                                {uiText("components_shape_studio_modal.button.copy", " Copy")}
                              </>
                            )}
                      </CustomizableButton>
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_26"
                        onClick={() => {
                          setCropBox(null);
                          setCrop(undefined);
                          setCompletedPercentCrop(null);
                          setCompletedPixelCrop(null);
                        }}
disabled={!(cropBox && cropBox.width > 0 && cropBox.height > 0)}
className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-bold text-[9.5px] rounded-lg cursor-pointer transition-all text-center"
                      >
                          {() => (
                              <>
                                {uiText("components_shape_studio_modal.button.clear", "Clear")}
                              </>
                            )}
                      </CustomizableButton>
                    </div>

                    {/* Multi-Crops Section */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_25"
                        defaultIcon={<Plus className="w-3 h-3 text-cyan-300" />}
                        type="button"
onClick={handleAddMultiCrop}
disabled={!(cropBox && cropBox.width > 0 && cropBox.height > 0)}
className="w-full py-1.5 px-2 bg-gradient-to-r from-cyan-600/50 to-indigo-600/50 hover:from-cyan-500/70 hover:to-indigo-500/70 disabled:opacity-40 text-cyan-100 hover:text-white border border-cyan-500/40 rounded-lg font-extrabold text-[9.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
title={uiText("components_shape_studio_modal.button.add_current_crop_box_to_multi_crops_queue_sh.title", "Add current crop box to Multi-Crops queue (Shift+drag or Shift+Enter)")}
                      >
                          {() => (
                              <>
                                <span>{uiText("components_shape_studio_modal.span.add_to_multi_crops", "+ Add to multi-crops")}</span>
                              </>
                            )}
                      </CustomizableButton>

                      {/* Multi-Crops Header */}
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-cyan-400" />
                          {uiText("components_shape_studio_modal.span.multi_crops", "Multi-crops (")}{multiCrops.length})
                        </span>
                        {multiCrops.length > 0 && (
                          <CustomizableButton
                            buttonId="shape_studio_modal_btn_24"
                            type="button"
onClick={() => setMultiCrops([])}
className="text-[9px] font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                          >
                              {() => (
                                  <>
                                    {uiText("components_shape_studio_modal.button.clear_all", "Clear all")}
                                  </>
                                )}
                          </CustomizableButton>
                        )}
                      </div>

                      {/* Multi-Crops Items List */}
                      {multiCrops.length === 0 ? (
                        <div className="text-[8.5px] text-slate-500 text-center py-2 px-1 border border-dashed border-slate-800/80 rounded-lg">
                          {uiText("components_shape_studio_modal.div.draw_crop_box_and_click", "Draw crop box & click ")}<span className="text-cyan-400 font-semibold">{uiText("components_shape_studio_modal.span.add_to_multi_crops_2", "+ Add to multi-crops")}</span>{uiText("components_shape_studio_modal.div.to_queue_multiple_cuts", " to queue multiple cuts")}
                        </div>
                      ) : (
                        <div className="space-y-1 max-h-[145px] overflow-y-auto pr-0.5 custom-scrollbar">
                          {multiCrops.map((item, idx) => (
                            <div
                              key={item.id}
                              className="p-1.5 bg-slate-950/90 border border-slate-800/80 rounded-lg flex items-center justify-between text-[9px] gap-1 hover:border-cyan-500/40 transition-colors"
                            >
                              <div className="flex items-center gap-1 min-w-0">
                                <span className="text-cyan-400 font-bold shrink-0">#{idx + 1}</span>
                                <span className="text-slate-300 font-medium truncate">
                                  {item.cropShape === "oval" ? "Oval" : "Rect"}
                                  {item.crop.unit === "%"
                                    ? ` (${Math.round(item.crop.width || 0)}%×${Math.round(item.crop.height || 0)}%)`
                                    : ` (${Math.round(item.crop.width || 0)}×${Math.round(item.crop.height || 0)}px)`}
                                </span>
                              </div>

                              <div className="flex items-center gap-0.5 shrink-0">
                                <CustomizableButton
                                  buttonId="shape_studio_modal_btn_23"
                                  defaultIcon={<Check className="w-2.5 h-2.5" />}
                                  type="button"
onClick={() => handleApplySingleMultiCropToCurrent(item)}
className="p-1 text-cyan-400 hover:text-cyan-200 bg-cyan-950/50 hover:bg-cyan-900/60 rounded border border-cyan-800/50 cursor-pointer"
title={uiText("components_shape_studio_modal.button.crop_current_active_frame_to_this_area.title", "Crop current active frame to this area")}
                                />
                                <CustomizableButton
                                  buttonId="shape_studio_modal_btn_22"
                                  defaultIcon={<Copy className="w-2.5 h-2.5" />}
                                  type="button"
onClick={() => handleApplySingleMultiCropAsLayer(item)}
className="p-1 text-indigo-400 hover:text-indigo-200 bg-indigo-950/50 hover:bg-indigo-900/60 rounded border border-indigo-800/50 cursor-pointer"
title={uiText("components_shape_studio_modal.button.add_as_image_layer.title", "Add as Image Layer")}
                                />
                                <CustomizableButton
                                  buttonId="shape_studio_modal_btn_21"
                                  defaultIcon={<Plus className="w-2.5 h-2.5" />}
                                  type="button"
onClick={() => handleApplySingleMultiCropToNewFrame(item)}
className="p-1 text-emerald-400 hover:text-emerald-200 bg-emerald-950/50 hover:bg-emerald-900/60 rounded border border-emerald-800/50 cursor-pointer"
title={uiText("components_shape_studio_modal.button.extract_as_new_storyboard_frame.title", "Extract as New Storyboard Frame")}
                                />
                                <CustomizableButton
                                  buttonId="shape_studio_modal_btn_20"
                                  defaultIcon={<Trash2 className="w-2.5 h-2.5" />}
                                  type="button"
onClick={() => setMultiCrops((prev) => prev.filter((c) => c.id !== item.id))}
className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
title={uiText("components_shape_studio_modal.button.delete_this_multi_crop.title", "Delete this multi-crop")}
                                />
                              </div>
                            </div>
                          ))}

                          {/* Multi-Crops Batch Actions */}
                          <div className="pt-1 space-y-1">
                            <CustomizableButton
                              buttonId="shape_studio_modal_btn_19"
                              defaultIcon={<Sparkles className="w-3 h-3 text-emerald-200" />}
                              type="button"
onClick={handleApplyAllMultiCropsToNewFrames}
className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[9.5px] rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
title={uiText("components_shape_studio_modal.button.extract_all_queued_multi_crops_as_new_storyb.title", "Extract all queued multi-crops as new storyboard frames")}
                            >
                                {() => (
                                    <>
                                      <span>{uiText("components_shape_studio_modal.span.extract_all", "Extract all (")}{multiCrops.length}{uiText("components_shape_studio_modal.span.to_frames", ") to frames")}</span>
                                    </>
                                  )}
                            </CustomizableButton>
                            <CustomizableButton
                              buttonId="shape_studio_modal_btn_18"
                              defaultIcon={<Layers className="w-3 h-3 text-indigo-300" />}
                              type="button"
onClick={handleApplyAllMultiCropsAsLayers}
className="w-full py-1 px-2 bg-indigo-600/70 hover:bg-indigo-600 text-indigo-100 font-bold text-[9px] rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
title={uiText("components_shape_studio_modal.button.insert_all_queued_multi_crops_as_layers.title", "Insert all queued multi-crops as layers")}
                            >
                                {() => (
                                    <>
                                      <span>{uiText("components_shape_studio_modal.span.insert_all", "Insert all (")}{multiCrops.length}{uiText("components_shape_studio_modal.span.as_layers", ") as layers")}</span>
                                    </>
                                  )}
                            </CustomizableButton>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Separate option in SS3 to redirect to Define Canvas & Crop toolbar */}
                    {onResendToCrop && (
                      <div className="pt-1.5 border-t border-slate-800/80">
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_17"
                          type="button"
onClick={() => {
                            if (onResendToCrop && activeSlice) {
                              onResendToCrop(activeSlice.url, activeIdx);
                              onClose();
                            }
                          }}
className="w-full py-1.5 px-2 bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-500/40 hover:border-emerald-500/80 text-emerald-300 font-bold text-[9.5px] rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 group"
title={uiText("components_shape_studio_modal.button.open_active_frame_in_define_canvas_and_crop.title", "Open active frame in 'Define Canvas & Crop' toolbar")}
                        >
                            {() => (
                                <>
                                  <Scissors className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                                <span className="truncate">{uiText("components_shape_studio_modal.span.define_canvas_and_crop_toolbar", "Define canvas & crop toolbar")}</span>
                                <ExternalLink className="w-3 h-3 text-emerald-400/80 shrink-0 ml-auto" />
                                </>
                              )}
                        </CustomizableButton>
                      </div>
                    )}
                  </div>

                  {/* Shape Layers */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      {uiText("components_shape_studio_modal.span.shape_layers", "Shape layers")}
                    </span>
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_16"
                      onClick={() => setShowShapeLayers((v) => !v)}
className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        showShapeLayers
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-800 text-slate-500 border-slate-700"
                      }`}
                    >
                        {() => (
                            <>
                              {showShapeLayers ? "Show" : "Hide"}
                            </>
                          )}
                    </CustomizableButton>
                  </div>

                  {/* Freehand Lines */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                      <Pencil className="w-3.5 h-3.5 text-indigo-400" />
                      {uiText("components_shape_studio_modal.span.freehand_lines", "Freehand lines")}
                    </span>
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_15"
                      onClick={() => setShowFreehandLines((v) => !v)}
className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        showFreehandLines
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-800 text-slate-500 border-slate-700"
                      }`}
                    >
                        {() => (
                            <>
                              {showFreehandLines ? "Show" : "Hide"}
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: NAMED LAYERS LIST */}
            <div className="border-b border-slate-800/80 flex-1 flex flex-col min-h-[220px]">
              <CustomizableButton
                buttonId="shape_studio_modal_btn_14"
                onClick={() => setIsNamedLayersOpen((v) => !v)}
className="w-full p-3.5 flex items-center justify-between text-xs font-bold tracking-wider text-slate-300 hover:bg-slate-900/50 cursor-pointer"
              >
                  {() => (
                      <>
                        <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  {uiText("components_shape_studio_modal.span.named_layers", "Named layers (")}{currentLayers.length})
                </span>
                      {isNamedLayersOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
                      </>
                    )}
              </CustomizableButton>

              {isNamedLayersOpen && (
                <div className="flex-1 px-4 pb-4 flex flex-col gap-3">
                  <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                    <CustomizableLabel
                      labelId="shape_studio_modal_item_13"
                      as="label"
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                        {() => (
                            <>
                              <input
                        type="checkbox"
                        checked={currentLayers.length > 0 && selectedLayerIds.length === currentLayers.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLayerIds(currentLayers.map((l) => l.id));
                          } else {
                            setSelectedLayerIds([]);
                          }
                        }}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500/20 w-3.5 h-3.5 bg-slate-950 cursor-pointer"
                      />
                            <span className="text-[10px] font-bold text-slate-400">
                        {selectedLayerIds.length > 0 ? `${selectedLayerIds.length} sel` : "All"}
                      </span>
                            </>
                          )}
                    </CustomizableLabel>
                    <div className="flex items-center gap-1.5">
                      {selectedLayerIds.length > 0 && (
                        <CustomizableButton
                          buttonId="shape_studio_modal_btn_12"
                          defaultLabel={")"}
                          defaultIcon={<Trash2 className="w-3 h-3 text-rose-400" />}
                          onClick={() => {
                            pushHistory();
                            updateActiveFrameData((prev = []) =>
                              (Array.isArray(prev) ? prev : []).filter((l) => !selectedLayerIds.includes(l.id))
                            );
                            setSelectedLayerIds([]);
                            setToastNotice(`✓ Deleted ${selectedLayerIds.length} layer(s)`);
                            setTimeout(() => setToastNotice(null), 2000);
                          }}
className="p-1 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 rounded cursor-pointer flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 border border-rose-500/20 bg-rose-500/10 transition-colors"
title={uiText("components_shape_studio_modal.button.delete_selected_layers.title", "Delete Selected Layers")}
                        >
                            {(ibcProps) => (
                                <>
                                  {uiText("components_shape_studio_modal.button.del", "Del (")}
                                {selectedLayerIds.length}
                                {!ibcProps.isTextHidden ? ibcProps.label : null}
                                </>
                              )}
                        </CustomizableButton>
                      )}
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_11"
                        defaultIcon={<ArrowUp className="w-3.5 h-3.5 text-indigo-400" />}
                        onClick={() => handleZIndexChange("top")}
className="p-1 hover:bg-slate-800 text-slate-300 rounded cursor-pointer"
title={uiText("components_shape_studio_modal.button.bring_to_front.title", "Bring to Front")}
                      />
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_10"
                        defaultIcon={<ArrowDown className="w-3.5 h-3.5 text-indigo-400" />}
                        onClick={() => handleZIndexChange("bottom")}
className="p-1 hover:bg-slate-800 text-slate-300 rounded cursor-pointer"
title={uiText("components_shape_studio_modal.button.send_to_back.title", "Send to Back")}
                      />
                    </div>
                  </div>

                  {/* Layers List */}
                  <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                    {currentLayers.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs font-medium">
                        {uiText("components_shape_studio_modal.div.no_vector_layers_on_stage_yet", "No vector layers on stage yet")}
                      </div>
                    ) : (
                      [...currentLayers]
                        .reverse()
                        .map((layer) => {
                          const isSelected = selectedLayerIds.includes(layer.id);
                          const isText = layer.type === "text";
                          const hasFill = layer.fillColor && layer.fillColor !== "transparent" && layer.fillColor !== "none";
                          const hasStroke = layer.strokeColor && layer.strokeColor !== "transparent" && layer.strokeColor !== "none";

                          return (
                            <div
                              key={layer.id}
                              onClick={() => setSelectedLayerIds([layer.id])}
                              className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                                  : "bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-800/60"
                              }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden mr-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      if (!selectedLayerIds.includes(layer.id)) {
                                        setSelectedLayerIds((prev) => [...prev, layer.id]);
                                      }
                                    } else {
                                      setSelectedLayerIds((prev) => prev.filter((id) => id !== layer.id));
                                    }
                                  }}
                                  className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500/20 w-3.5 h-3.5 bg-slate-950 cursor-pointer shrink-0"
                                />

                                {/* Color Indication */}
                                <div
                                  className="w-3.5 h-3.5 rounded shadow-sm shrink-0 flex items-center justify-center relative overflow-hidden"
                                  style={{
                                    backgroundColor: isText ? "transparent" : (hasFill ? layer.fillColor : "transparent"),
                                    borderColor: hasStroke ? layer.strokeColor : (isText ? (layer.textColor || "#ffffff") : "rgba(255,255,255,0.15)"),
                                    borderWidth: hasStroke || isText ? "1.5px" : "1px",
                                    borderStyle: "solid"
                                  }}
                                  title={`Color info - Fill: ${layer.fillColor || 'transparent'}, Stroke: ${layer.strokeColor || 'none'}`}
                                >
                                  {isText && (
                                    <span className="text-[8px] font-black leading-none" style={{ color: layer.textColor || "#ffffff" }}>{uiText("components_shape_studio_modal.span.t", "T")}</span>
                                  )}
                                  {!isText && !hasFill && (
                                    <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: layer.strokeColor || '#94a3b8' }} />
                                    </div>
                                  )}
                                </div>

                                <span className="truncate max-w-[110px] font-bold text-slate-200">
                                  {layer.name || layer.type}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-400">
                                <CustomizableButton
                                  buttonId="shape_studio_modal_btn_9"
                                  defaultIcon={<Bookmark className="w-3.5 h-3.5" />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveLayerAsAsset(layer);
                                  }}
className="p-1 hover:text-amber-400 cursor-pointer"
title={uiText("components_shape_studio_modal.button.save_to_layer_assets_folder.title", "Save to Layer Assets folder")}
                                />
                                <CustomizableButton
                                  buttonId="shape_studio_modal_btn_8"
                                  defaultIcon={<Copy className="w-3.5 h-3.5" />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateLayer(layer);
                                  }}
className="p-1 hover:text-indigo-400 cursor-pointer"
title={uiText("components_shape_studio_modal.button.duplicate_layer.title", "Duplicate Layer")}
                                />
                                <CustomizableButton
                                  buttonId="shape_studio_modal_btn_7"
                                  defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    pushHistory();
                                    updateActiveFrameData((prev = []) =>
                                      (Array.isArray(prev) ? prev : []).filter((l) => l.id !== layer.id)
                                    );
                                    setSelectedLayerIds((prev = []) =>
                                      (Array.isArray(prev) ? prev : []).filter((id) => id !== layer.id)
                                    );
                                  }}
className="p-1 hover:text-rose-400 cursor-pointer"
title={uiText("components_shape_studio_modal.button.delete_layer.title_2", "Delete Layer")}
                                />
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2.5: FREEHAND LINES LIST */}
            <div className="border-b border-slate-800/80 flex flex-col min-h-[150px]">
              <CustomizableButton
                buttonId="shape_studio_modal_btn_6"
                onClick={() => setIsFreehandLinesSectionOpen((v) => !v)}
className="w-full p-3.5 flex items-center justify-between text-xs font-bold tracking-wider text-slate-300 hover:bg-slate-900/50 cursor-pointer"
              >
                  {() => (
                      <>
                        <span className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-indigo-400" />
                  {uiText("components_shape_studio_modal.span.freehand_lines_2", "Freehand lines (")}{currentFreehandLines.length})
                </span>
                      {isFreehandLinesSectionOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
                      </>
                    )}
              </CustomizableButton>

              {isFreehandLinesSectionOpen && (
                <div className="px-4 pb-4 flex flex-col gap-3">
                  {/* Freehand Lines List */}
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {currentFreehandLines.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs font-medium">
                        {uiText("components_shape_studio_modal.div.no_freehand_lines_drawn_yet", "No freehand lines drawn yet")}
                      </div>
                    ) : (
                      [...currentFreehandLines]
                        .reverse()
                        .map((line, idx) => {
                          return (
                            <div
                              key={line.id}
                              className="p-2 px-3 rounded-xl border border-slate-800 bg-slate-900/40 text-xs font-medium flex items-center justify-between text-slate-300"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3.5 h-3.5 rounded-full border border-slate-700/80"
                                  style={{ backgroundColor: line.color }}
                                />
                                <span className="font-bold">
                                  {uiText("components_shape_studio_modal.span.line", "Line #")}{currentFreehandLines.length - idx} ({line.width}{uiText("components_shape_studio_modal.span.px_17", "px)")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-400">
                                <CustomizableButton
                                  buttonId="shape_studio_modal_btn_5"
                                  defaultIcon={<Bookmark className="w-3.5 h-3.5" />}
                                  onClick={() => handleSaveLineAsAsset(line)}
className="p-1 hover:text-emerald-400 cursor-pointer"
title={uiText("components_shape_studio_modal.button.save_pen_stroke_to_layer_assets.title", "Save Pen Stroke to Layer Assets")}
                                />
                                <CustomizableButton
                                  buttonId="shape_studio_modal_btn_4"
                                  defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                                  onClick={() => {
                                    pushHistory();
                                    updateActiveFrameData(
                                      currentLayers,
                                      currentFreehandLines.filter((l) => l.id !== line.id)
                                    );
                                  }}
className="p-1 hover:text-rose-400 cursor-pointer"
title={uiText("components_shape_studio_modal.button.delete_line.title", "Delete Line")}
                                />
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2.7: FULL FRAME FILL BACKGROUND */}
            <div className="border-b border-slate-800/80 p-3.5 space-y-2.5 bg-slate-950/20">
              <div className="flex items-center justify-between text-xs font-bold tracking-wider text-slate-300">
                <span className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-400" />
                  {uiText("components_shape_studio_modal.span.full_frame_background", "Full frame background")}
                </span>
                {frameData[activeIdx]?.bgFillColor ? (
                  <span className="text-[10px] font-mono text-emerald-400 font-extrabold bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                    {uiText("components_shape_studio_modal.span.active", "Active")}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">{uiText("components_shape_studio_modal.span.none", "None")}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={frameData[activeIdx]?.bgFillColor || "#ffffff"}
                  onChange={(e) => {
                    const color = e.target.value;
                    updateActiveFrameData(currentLayers, currentFreehandLines, color);
                  }}
                  className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent p-0 cursor-pointer shadow-md"
                  title={uiText("components_shape_studio_modal.input.choose_full_frame_fill_color.title", "Choose Full Frame Fill Color")}
                />
                <div className="flex-1 flex items-center gap-1">
                  {["#ffffff", "#000000", "#1e293b", "#0f172a", "#f8fafc"].map((c) => (
                    <CustomizableButton
                      buttonId="shape_studio_modal_btn_3"
                      key={c}
type="button"
onClick={() => updateActiveFrameData(currentLayers, currentFreehandLines, c)}
className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 cursor-pointer ${
                        frameData[activeIdx]?.bgFillColor === c ? "border-emerald-400 scale-105 ring-2 ring-emerald-500/40" : "border-slate-700"
                      }`}
style={{ backgroundColor: c }}
title={`Fill background with ${c}`}
                    />
                  ))}
                  <CustomizableButton
                    buttonId="shape_studio_modal_btn_2"
                    type="button"
onClick={() => updateActiveFrameData(currentLayers, currentFreehandLines, undefined)}
className="px-2 py-1 text-[9.5px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-md cursor-pointer ml-auto"
title={uiText("components_shape_studio_modal.button.clear_background_fill.title", "Clear Background Fill")}
                  >
                      {() => (
                          <>
                            {uiText("components_shape_studio_modal.button.clear_2", "Clear")}
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>
            </div>

            {/* Section 3: SELECTED LAYER STYLING */}
            {selectedLayer && (
              <div className="p-4 space-y-4 border-t border-slate-800 bg-slate-900/30">
                <span className="text-xs font-extrabold tracking-wider text-indigo-400 block">
                  {uiText("components_shape_studio_modal.span.layer_styling", "Layer styling (")}{selectedLayer.type})
                </span>

                {/* Fill Color */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">{uiText("components_shape_studio_modal.span.fill_color_2", "Fill color")}</span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PRESET_COLORS.slice(0, 10).map((c) => (
                      <CustomizableButton
                        buttonId="shape_studio_modal_btn_1"
                        key={c}
onClick={() => {
                          pushHistory();
                          updateActiveFrameData((prev = []) =>
                            (Array.isArray(prev) ? prev : []).map((l) =>
                              l.id === selectedLayer.id ? { ...l, fillColor: c } : l
                            )
                          );
                        }}
className={`h-6 rounded-md border transition-transform hover:scale-110 ${
                          selectedLayer.fillColor === c ? "ring-2 ring-indigo-400 border-white" : "border-slate-700"
                        }`}
style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Stroke Width */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>{uiText("components_shape_studio_modal.span.stroke_width", "Stroke width")}</span>
                    <span className="font-mono text-indigo-400">{selectedLayer.strokeWidth}{uiText("components_shape_studio_modal.span.px_18", "px")}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={selectedLayer.strokeWidth}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateActiveFrameData((prev = []) =>
                        (Array.isArray(prev) ? prev : []).map((l) =>
                          l.id === selectedLayer.id ? { ...l, strokeWidth: val } : l
                        )
                      );
                    }}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};
