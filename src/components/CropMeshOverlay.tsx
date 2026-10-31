import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Sparkles,
  Trash2,
  Copy,
  Check,
  Layers,
  X,
  SlidersHorizontal,
  Scissors,
  RotateCcw,
  Maximize2,
  Minimize2,
  CheckSquare,
  Square,
  GripVertical,
  GripHorizontal,
  Send,
  Combine,
  Link2,
  Triangle,
  Spline,
  PenTool,
  MousePointer,
  ChevronDown,
  Plus,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "../utils/cn";
import { FreestyleSlicePreview } from "./FreestyleSlicePreview";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableButton } from "./CustomizableButton";

export interface MeshBounds {
  x: number; // percentage (0-100, can be negative or >100 when dragged outside)
  y: number; // percentage (0-100, can be negative or >100 when dragged outside)
  width: number; // percentage
  height: number; // percentage
}

export interface FreestylePoint {
  x: number; // percentage relative to image (0-100)
  y: number; // percentage relative to image (0-100)
}

export type FreestyleShapeType = "rect" | "polygon" | "trapezoid";

export interface FreestyleSquare {
  id: string;
  x: number; // percentage relative to image
  y: number; // percentage relative to image
  width: number; // percentage relative to image
  height: number; // percentage relative to image
  label?: string;
  shapeType?: FreestyleShapeType;
  points?: FreestylePoint[];
}

export interface TrapezePreset {
  id: string;
  name: string;
  description: string;
  getPoints: (x: number, y: number, width: number, height: number) => FreestylePoint[];
}

export const TRAPEZE_PRESETS: TrapezePreset[] = [
  {
    id: "isosceles",
    name: "Isosceles Trapeze",
    description: "Standard comic & storyboard angled cut (tapered top)",
    getPoints: (x, y, w, h) => [
      { x: Math.round((x + w * 0.2) * 100) / 100, y: Math.round(y * 100) / 100 },
      { x: Math.round((x + w * 0.8) * 100) / 100, y: Math.round(y * 100) / 100 },
      { x: Math.round((x + w) * 100) / 100, y: Math.round((y + h) * 100) / 100 },
      { x: Math.round(x * 100) / 100, y: Math.round((y + h) * 100) / 100 },
    ],
  },
  {
    id: "inverted",
    name: "Inverted Trapeze",
    description: "Top-heavy trapezoid slice (tapered base)",
    getPoints: (x, y, w, h) => [
      { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 },
      { x: Math.round((x + w) * 100) / 100, y: Math.round(y * 100) / 100 },
      { x: Math.round((x + w * 0.8) * 100) / 100, y: Math.round((y + h) * 100) / 100 },
      { x: Math.round((x + w * 0.2) * 100) / 100, y: Math.round((y + h) * 100) / 100 },
    ],
  },
  {
    id: "left_slanted",
    name: "Left Slanted",
    description: "Dynamic left leaning angle slice cut",
    getPoints: (x, y, w, h) => [
      { x: Math.round((x + w * 0.35) * 100) / 100, y: Math.round(y * 100) / 100 },
      { x: Math.round((x + w) * 100) / 100, y: Math.round(y * 100) / 100 },
      { x: Math.round((x + w * 0.65) * 100) / 100, y: Math.round((y + h) * 100) / 100 },
      { x: Math.round(x * 100) / 100, y: Math.round((y + h) * 100) / 100 },
    ],
  },
  {
    id: "right_slanted",
    name: "Right Slanted",
    description: "Dynamic right leaning angle slice cut",
    getPoints: (x, y, w, h) => [
      { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 },
      { x: Math.round((x + w * 0.65) * 100) / 100, y: Math.round(y * 100) / 100 },
      { x: Math.round((x + w) * 100) / 100, y: Math.round((y + h) * 100) / 100 },
      { x: Math.round((x + w * 0.35) * 100) / 100, y: Math.round((y + h) * 100) / 100 },
    ],
  },
  {
    id: "perspective",
    name: "Perspective Wedge",
    description: "Comic action perspective trapezoid slice",
    getPoints: (x, y, w, h) => [
      { x: Math.round(x * 100) / 100, y: Math.round((y + h * 0.05) * 100) / 100 },
      { x: Math.round((x + w * 0.95) * 100) / 100, y: Math.round((y + h * 0.2) * 100) / 100 },
      { x: Math.round((x + w) * 100) / 100, y: Math.round((y + h * 0.8) * 100) / 100 },
      { x: Math.round(x * 100) / 100, y: Math.round((y + h) * 100) / 100 },
    ],
  },
];

export const MESH_COLOR_PRESETS = [
  { id: "emerald", name: "Neon Emerald", hex: "#10b981" },
  { id: "cyan", name: "Cyan Blue", hex: "#06b6d4" },
  { id: "gold", name: "Gold Yellow", hex: "#eab308" },
  { id: "magenta", name: "Hot Magenta", hex: "#ec4899" },
  { id: "crimson", name: "Coral Crimson", hex: "#ef4444" },
  { id: "purple", name: "Cyber Purple", hex: "#a855f7" },
  { id: "orange", name: "Neon Orange", hex: "#f97316" },
  { id: "white", name: "Pure White", hex: "#ffffff" },
];

export const MESH_LINE_WIDTHS = [1, 2, 3, 4, 6];

export interface CropMeshOverlayProps {
  imageElement: HTMLImageElement | null;
  meshBounds: MeshBounds;
  onMeshBoundsChange: (newBounds: MeshBounds) => void;
  squareSize: number;
  onSquareSizeChange?: (newSize: number) => void;
  onCutMesh: (freestyleSquares?: FreestyleSquare[]) => void;
  onClose: () => void;
  slicePrefix?: string;
  gridLineWidth?: number;
  onGridLineWidthChange?: (width: number) => void;
  gridLineColor?: string;
  onGridLineColorChange?: (color: string) => void;
  autoGotoAfterCut?: boolean;
  onToggleAutoGotoAfterCut?: () => void;
  // Manual Grid Line Adjustment props from panel
  isAdjustingLines?: boolean;
  onToggleAdjustLines?: () => void;
  onResetDividers?: () => void;
  // Freestyle synchronization props
  isFreestyle?: boolean;
  freestyleSquares?: FreestyleSquare[];
  onFreestyleSquaresChange?: (squares: FreestyleSquare[] | ((prev: FreestyleSquare[]) => FreestyleSquare[])) => void;
  selectedFreestyleId?: string | null;
  selectedFreestyleIds?: string[];
  onSelectFreestyleId?: (id: string | null) => void;
  onSelectFreestyleIds?: (ids: string[]) => void;
  onResizeFreestyleSquare?: (squareId: string, deltaPx: number) => void;
  onDuplicateFreestyleSquare?: (squareId: string) => void;
  onDuplicateFreestyleSquares?: (squareIds: string[]) => void;
  onDeleteFreestyleSquare?: (squareId: string) => void;
  onDeleteFreestyleSquares?: (squareIds: string[]) => void;
  onMergeFreestyleSquares?: (squareIds: string[]) => void;
  onClearAllFreestyleSquares?: () => void;
  // Slicer Tool Switcher Props (Panel controlled)
  freestyleTool?: "select" | "rect" | "angled" | "trapeze";
  onFreestyleToolChange?: (tool: "select" | "rect" | "angled" | "trapeze") => void;
  activeTrapezePreset?: string;
  onActiveTrapezePresetChange?: (presetId: string) => void;
  activePolygonPoints?: FreestylePoint[];
  onActivePolygonPointsChange?: (points: FreestylePoint[] | ((prev: FreestylePoint[]) => FreestylePoint[])) => void;
  onJumpToPanelPreview?: () => void;
}

export const CropMeshOverlay: React.FC<CropMeshOverlayProps> = ({
  imageElement,
  meshBounds,
  onMeshBoundsChange,
  squareSize,
  onCutMesh,
  gridLineWidth = 2,
  gridLineColor = "#10b981",
  isAdjustingLines: controlledAdjustingLines,
  onToggleAdjustLines,
  onResetDividers,
  isFreestyle = false,
  freestyleSquares = [],
  onFreestyleSquaresChange,
  selectedFreestyleId = null,
  selectedFreestyleIds = [],
  onSelectFreestyleId,
  onSelectFreestyleIds,
  onDuplicateFreestyleSquare,
  onDuplicateFreestyleSquares,
  onDeleteFreestyleSquare,
  onDeleteFreestyleSquares,
  onMergeFreestyleSquares,
  onClearAllFreestyleSquares,
  freestyleTool: controlledFreestyleTool,
  onFreestyleToolChange,
  activeTrapezePreset: controlledTrapezePreset,
  onActiveTrapezePresetChange,
  activePolygonPoints: controlledPolygonPoints,
  onActivePolygonPointsChange,
  onJumpToPanelPreview,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dragging state for main uniform mesh outer boundary
  const [dragMode, setDragMode] = useState<
    | "move"
    | "nw"
    | "ne"
    | "se"
    | "sw"
    | "n"
    | "s"
    | "e"
    | "w"
    | null
  >(null);
  const [dragStart, setDragStart] = useState<{
    mouseX: number;
    mouseY: number;
    initialBounds: MeshBounds;
    parentWidth: number;
    parentHeight: number;
  } | null>(null);

  // Manual grid line adjustment toggle & custom divider ratios
  const [internalAdjustingLines, setInternalAdjustingLines] = useState<boolean>(false);
  const isAdjustingLines = controlledAdjustingLines !== undefined ? controlledAdjustingLines : internalAdjustingLines;
  const toggleAdjustLines = onToggleAdjustLines || (() => setInternalAdjustingLines((prev) => !prev));

  const [customColDividers, setCustomColDividers] = useState<number[]>([]);
  const [customRowDividers, setCustomRowDividers] = useState<number[]>([]);
  const [activeDividerDrag, setActiveDividerDrag] = useState<{
    type: "col" | "row";
    index: number;
    startClientPos: number;
    initialDividers: number[];
    parentDimPx: number;
  } | null>(null);

  // Uniform Grid Multi-Square Selection State
  const [selectedUniformIndices, setSelectedUniformIndices] = useState<number[]>([]);
  const [lastSelectedUniformIndex, setLastSelectedUniformIndex] = useState<number | null>(null);
  const [isSpacebarDown, setIsSpacebarDown] = useState<boolean>(false);

  // Track spacebar pressed state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = document.activeElement as HTMLElement | null;
      const tagName = (target?.tagName || "").toLowerCase();
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.code === "Space" || e.key === " ") {
        setIsSpacebarDown(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        setIsSpacebarDown(false);
      }
    };

    const handleWindowBlur = () => {
      setIsSpacebarDown(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  // Unified effective selected IDs list for Freestyle
  const effectiveSelectedIds = useMemo(() => {
    if (selectedFreestyleIds && selectedFreestyleIds.length > 0) {
      return selectedFreestyleIds;
    }
    if (selectedFreestyleId) {
      return [selectedFreestyleId];
    }
    return [];
  }, [selectedFreestyleIds, selectedFreestyleId]);

  // Primary active square in Freestyle
  const primarySelectedId = useMemo(() => {
    if (selectedFreestyleId && effectiveSelectedIds.includes(selectedFreestyleId)) {
      return selectedFreestyleId;
    }
    return effectiveSelectedIds[effectiveSelectedIds.length - 1] || null;
  }, [effectiveSelectedIds, selectedFreestyleId]);

  const selectedSq = useMemo(() => {
    if (!primarySelectedId) return null;
    return freestyleSquares.find((s) => s.id === primarySelectedId) || null;
  }, [freestyleSquares, primarySelectedId]);

  const selectedSqIdx = useMemo(() => {
    if (!selectedSq) return -1;
    return freestyleSquares.findIndex((s) => s.id === selectedSq.id);
  }, [freestyleSquares, selectedSq]);

  // Dragging state for freestyle squares
  const [freestyleDragMode, setFreestyleDragMode] = useState<
    "move" | "nw" | "ne" | "se" | "sw" | "n" | "s" | "e" | "w" | null
  >(null);
  const [freestyleDragStart, setFreestyleDragStart] = useState<{
    mouseX: number;
    mouseY: number;
    squareId: string;
    initialSquare: FreestyleSquare;
    initialSquaresMap: Record<string, FreestyleSquare>;
    parentWidth: number;
    parentHeight: number;
  } | null>(null);

  // Marquee drag selection state on empty canvas
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number; isShift: boolean } | null>(null);
  const [marqueeCurrent, setMarqueeCurrent] = useState<{ x: number; y: number } | null>(null);

  // Slicer Tool Modes: "select" | "rect" | "angled" | "trapeze"
  const [internalFreestyleTool, setInternalFreestyleTool] = useState<"select" | "rect" | "angled" | "trapeze">("select");
  const freestyleTool = controlledFreestyleTool !== undefined ? controlledFreestyleTool : internalFreestyleTool;
  const setFreestyleTool = onFreestyleToolChange || setInternalFreestyleTool;

  const [internalTrapezePreset, setInternalTrapezePreset] = useState<string>("isosceles");
  const activeTrapezePreset = controlledTrapezePreset !== undefined ? controlledTrapezePreset : internalTrapezePreset;
  const setActiveTrapezePreset = onActiveTrapezePresetChange || setInternalTrapezePreset;

  const [isTrapezePresetMenuOpen, setIsTrapezePresetMenuOpen] = useState<boolean>(false);

  // Angled Polygon Drawing State (drops arbitrary vertices, closes by magnetic snapping to 1st point)
  const [internalPolygonPoints, setInternalPolygonPoints] = useState<FreestylePoint[]>([]);
  const activePolygonPoints = controlledPolygonPoints !== undefined ? controlledPolygonPoints : internalPolygonPoints;
  const setActivePolygonPoints = onActivePolygonPointsChange || setInternalPolygonPoints;

  const [activePolygonCursor, setActivePolygonCursor] = useState<FreestylePoint | null>(null);
  const [isSnappedToFirst, setIsSnappedToFirst] = useState<boolean>(false);

  // Trapeze Drag-To-Draw State
  const [trapezeDragStart, setTrapezeDragStart] = useState<{ x: number; y: number } | null>(null);
  const [trapezeDragCurrent, setTrapezeDragCurrent] = useState<{ x: number; y: number } | null>(null);

  // Vertex Dragging State (for adjusting individual vertices of existing polygon/trapeze)
  const [vertexDrag, setVertexDrag] = useState<{
    squareId: string;
    vertexIndex: number;
    parentWidth: number;
    parentHeight: number;
  } | null>(null);

  // Ctrl+Shift interactive square drawing state
  const [isDrawingSquare, setIsDrawingSquare] = useState(false);
  const [drawSquareStart, setDrawSquareStart] = useState<{ x: number; y: number } | null>(null);
  const [drawSquareCurrent, setDrawSquareCurrent] = useState<{ x: number; y: number } | null>(null);

  const [isFlashCutting, setIsFlashCutting] = useState(false);

  // Compute actual pixel dimensions of the image
  const naturalDimensions = useMemo(() => {
    if (!imageElement) return { width: 800, height: 600 };
    return {
      width: imageElement.naturalWidth || 800,
      height: imageElement.naturalHeight || 600,
    };
  }, [imageElement]);

  // Compute pixel dimensions of the mesh area on the natural image
  const meshPixelInfo = useMemo(() => {
    const pxX = Math.round((meshBounds.x / 100) * naturalDimensions.width);
    const pxY = Math.round((meshBounds.y / 100) * naturalDimensions.height);
    const pxW = Math.max(1, Math.round((meshBounds.width / 100) * naturalDimensions.width));
    const pxH = Math.max(1, Math.round((meshBounds.height / 100) * naturalDimensions.height));

    const effectiveSquare = Math.max(8, squareSize);
    const cols = Math.max(1, Math.floor(pxW / effectiveSquare));
    const rows = Math.max(1, Math.floor(pxH / effectiveSquare));
    const totalSquares = cols * rows;

    return {
      pxX,
      pxY,
      pxW,
      pxH,
      cols,
      rows,
      totalSquares,
      effectiveSquare,
      gridWidthPercent: (cols * effectiveSquare / naturalDimensions.width) * 100,
      gridHeightPercent: (rows * effectiveSquare / naturalDimensions.height) * 100,
    };
  }, [meshBounds, naturalDimensions, squareSize]);

  // Synchronize column and row dividers when mesh columns or rows change
  useEffect(() => {
    const cols = meshPixelInfo.cols;
    if (cols > 1) {
      setCustomColDividers((prev) => {
        if (prev.length === cols - 1) return prev;
        const init: number[] = [];
        for (let i = 1; i < cols; i++) {
          init.push((i / cols) * 100);
        }
        return init;
      });
    } else {
      setCustomColDividers([]);
    }
  }, [meshPixelInfo.cols]);

  useEffect(() => {
    const rows = meshPixelInfo.rows;
    if (rows > 1) {
      setCustomRowDividers((prev) => {
        if (prev.length === rows - 1) return prev;
        const init: number[] = [];
        for (let j = 1; j < rows; j++) {
          init.push((j / rows) * 100);
        }
        return init;
      });
    } else {
      setCustomRowDividers([]);
    }
  }, [meshPixelInfo.rows]);

  // Compute calculated cell column bounds and row bounds in percentage (0 to 100%)
  const { colBounds, rowBounds } = useMemo(() => {
    const cols = meshPixelInfo.cols;
    const rows = meshPixelInfo.rows;

    let cBounds: { start: number; end: number; size: number }[] = [];
    if (customColDividers.length === cols - 1 && cols > 1) {
      const pts = [0, ...customColDividers, 100];
      for (let i = 0; i < cols; i++) {
        cBounds.push({
          start: pts[i],
          end: pts[i + 1],
          size: pts[i + 1] - pts[i],
        });
      }
    } else {
      const step = 100 / cols;
      for (let i = 0; i < cols; i++) {
        cBounds.push({
          start: i * step,
          end: (i + 1) * step,
          size: step,
        });
      }
    }

    let rBounds: { start: number; end: number; size: number }[] = [];
    if (customRowDividers.length === rows - 1 && rows > 1) {
      const pts = [0, ...customRowDividers, 100];
      for (let j = 0; j < rows; j++) {
        rBounds.push({
          start: pts[j],
          end: pts[j + 1],
          size: pts[j + 1] - pts[j],
        });
      }
    } else {
      const step = 100 / rows;
      for (let j = 0; j < rows; j++) {
        rBounds.push({
          start: j * step,
          end: (j + 1) * step,
          size: step,
        });
      }
    }

    return { colBounds: cBounds, rowBounds: rBounds };
  }, [meshPixelInfo.cols, meshPixelInfo.rows, customColDividers, customRowDividers]);

  // Check if grid lines have been modified from uniform
  const hasCustomDividers = useMemo(() => {
    const cols = meshPixelInfo.cols;
    const rows = meshPixelInfo.rows;
    if (cols > 1 && customColDividers.length === cols - 1) {
      const isColsCustom = customColDividers.some((val, idx) => Math.abs(val - ((idx + 1) / cols) * 100) > 0.5);
      if (isColsCustom) return true;
    }
    if (rows > 1 && customRowDividers.length === rows - 1) {
      const isRowsCustom = customRowDividers.some((val, idx) => Math.abs(val - ((idx + 1) / rows) * 100) > 0.5);
      if (isRowsCustom) return true;
    }
    return false;
  }, [meshPixelInfo.cols, meshPixelInfo.rows, customColDividers, customRowDividers]);

  // Reset dividers back to exact uniform spacing
  const handleResetDividers = useCallback(() => {
    const cols = meshPixelInfo.cols;
    const rows = meshPixelInfo.rows;
    if (cols > 1) {
      const initCols: number[] = [];
      for (let i = 1; i < cols; i++) initCols.push((i / cols) * 100);
      setCustomColDividers(initCols);
    }
    if (rows > 1) {
      const initRows: number[] = [];
      for (let j = 1; j < rows; j++) initRows.push((j / rows) * 100);
      setCustomRowDividers(initRows);
    }
  }, [meshPixelInfo.cols, meshPixelInfo.rows]);

  // Update freestyle selection helper
  const updateSelection = useCallback((nextIds: string[]) => {
    onSelectFreestyleIds?.(nextIds);
    if (nextIds.length > 0) {
      onSelectFreestyleId?.(nextIds[nextIds.length - 1]);
    } else {
      onSelectFreestyleId?.(null);
    }
  }, [onSelectFreestyleIds, onSelectFreestyleId]);

  // Drag & Resize Handlers for Uniform Mesh Boundary
  const handlePointerDown = (
    e: React.PointerEvent,
    mode: "move" | "nw" | "ne" | "se" | "sw" | "n" | "s" | "e" | "w"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const parentEl = imageElement?.parentElement;
    if (!parentEl) return;

    const parentRect = parentEl.getBoundingClientRect();
    setDragMode(mode);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialBounds: { ...meshBounds },
      parentWidth: parentRect.width,
      parentHeight: parentRect.height,
    });
  };

  // Drag Handler for Manual Grid Line Dividers
  const handleDividerPointerDown = (
    e: React.PointerEvent,
    type: "col" | "row",
    index: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;
    const gridRect = containerRef.current.getBoundingClientRect();
    const parentDimPx = type === "col" ? gridRect.width : gridRect.height;
    if (parentDimPx <= 0) return;

    setActiveDividerDrag({
      type,
      index,
      startClientPos: type === "col" ? e.clientX : e.clientY,
      initialDividers: type === "col" ? [...customColDividers] : [...customRowDividers],
      parentDimPx,
    });
  };

  // Pointer move & up effects for Manual Grid Divider Line Dragging
  useEffect(() => {
    if (!activeDividerDrag) return;

    const handleDividerMove = (e: PointerEvent) => {
      const { type, index, startClientPos, initialDividers, parentDimPx } = activeDividerDrag;
      const currentClientPos = type === "col" ? e.clientX : e.clientY;
      const deltaPx = currentClientPos - startClientPos;
      const deltaPercent = (deltaPx / parentDimPx) * 100;

      const minGapPercent = (10 / parentDimPx) * 100; // minimum 10px spacing
      const prevPos = index === 0 ? 0 : initialDividers[index - 1];
      const nextPos = index === initialDividers.length - 1 ? 100 : initialDividers[index + 1];

      const minAllowed = prevPos + minGapPercent;
      const maxAllowed = nextPos - minGapPercent;

      const rawNewPos = initialDividers[index] + deltaPercent;
      const clampedPos = Math.max(minAllowed, Math.min(maxAllowed, rawNewPos));

      if (type === "col") {
        setCustomColDividers((prev) => {
          const next = [...prev];
          next[index] = Math.round(clampedPos * 100) / 100;
          return next;
        });
      } else {
        setCustomRowDividers((prev) => {
          const next = [...prev];
          next[index] = Math.round(clampedPos * 100) / 100;
          return next;
        });
      }
    };

    const handleDividerUp = () => {
      setActiveDividerDrag(null);
    };

    window.addEventListener("pointermove", handleDividerMove);
    window.addEventListener("pointerup", handleDividerUp);
    return () => {
      window.removeEventListener("pointermove", handleDividerMove);
      window.removeEventListener("pointerup", handleDividerUp);
    };
  }, [activeDividerDrag]);

  // Click Handler for Uniform Grid Squares (Spacebar + Click, Multi-Select, Auto-Send to Carved Slices)
  const handleUniformSquareClick = (
    e: React.MouseEvent,
    index: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.shiftKey && lastSelectedUniformIndex !== null) {
      // Range selection
      const start = Math.min(lastSelectedUniformIndex, index);
      const end = Math.max(lastSelectedUniformIndex, index);
      const rangeIndices: number[] = [];
      for (let k = start; k <= end; k++) {
        rangeIndices.push(k);
      }
      const combined = Array.from(new Set([...selectedUniformIndices, ...rangeIndices]));
      setSelectedUniformIndices(combined);
      setLastSelectedUniformIndex(index);
      return;
    }

    // Spacebar + 1 Click or click:
    // If already selected -> deselect
    // If not selected -> select and auto-cut/send to Carved Slices in storyboard
    const isAlreadySelected = selectedUniformIndices.includes(index);
    if (isAlreadySelected) {
      setSelectedUniformIndices(selectedUniformIndices.filter((i) => i !== index));
      setLastSelectedUniformIndex(index);
      return;
    } else {
      setSelectedUniformIndices([...selectedUniformIndices, index]);
      setLastSelectedUniformIndex(index);

      // Auto-send slice to Carved Slices in storyboard on selection
      const totalCols = meshPixelInfo.cols;
      const r = Math.floor(index / totalCols);
      const c = index % totalCols;
      const colB = colBounds[c] || { start: (c / totalCols) * 100, size: 100 / totalCols };
      const rowB = rowBounds[r] || { start: (r / meshPixelInfo.rows) * 100, size: 100 / meshPixelInfo.rows };
      const sqX = meshBounds.x + (colB.start / 100) * meshPixelInfo.gridWidthPercent;
      const sqY = meshBounds.y + (rowB.start / 100) * meshPixelInfo.gridHeightPercent;
      const sqW = (colB.size / 100) * meshPixelInfo.gridWidthPercent;
      const sqH = (rowB.size / 100) * meshPixelInfo.gridHeightPercent;

      const singleSlice: FreestyleSquare = {
        id: `cut_u_${index}`,
        x: Math.round(sqX * 100) / 100,
        y: Math.round(sqY * 100) / 100,
        width: Math.max(0.5, Math.round(sqW * 100) / 100),
        height: Math.max(0.5, Math.round(sqH * 100) / 100),
        label: `Tile ${index + 1}`,
      };
      onCutMesh([singleSlice]);
      return;
    }
  };

  // Convert Selected Uniform Squares into Freestyle Squares
  const handleConvertUniformToFreestyle = useCallback(() => {
    if (selectedUniformIndices.length === 0) return;

    const totalCols = meshPixelInfo.cols;
    const totalRows = meshPixelInfo.rows;
    const gridLeft = meshBounds.x;
    const gridTop = meshBounds.y;
    const gridWidth = meshPixelInfo.gridWidthPercent;
    const gridHeight = meshPixelInfo.gridHeightPercent;

    const newFreestyleSquares: FreestyleSquare[] = selectedUniformIndices.map((idx, seq) => {
      const r = Math.floor(idx / totalCols);
      const c = idx % totalCols;

      const colB = colBounds[c] || { start: (c / totalCols) * 100, size: 100 / totalCols };
      const rowB = rowBounds[r] || { start: (r / totalRows) * 100, size: 100 / totalRows };

      const sqX = gridLeft + (colB.start / 100) * gridWidth;
      const sqY = gridTop + (rowB.start / 100) * gridHeight;
      const sqW = (colB.size / 100) * gridWidth;
      const sqH = (rowB.size / 100) * gridHeight;

      return {
        id: `freestyle_u_${Date.now()}_${idx}_${seq}`,
        x: Math.round(sqX * 100) / 100,
        y: Math.round(sqY * 100) / 100,
        width: Math.max(0.5, Math.round(sqW * 100) / 100),
        height: Math.max(0.5, Math.round(sqH * 100) / 100),
        label: `Tile ${idx + 1}`,
      };
    });

    onFreestyleSquaresChange?.((prev) => [...prev, ...newFreestyleSquares]);
    updateSelection(newFreestyleSquares.map((s) => s.id));
    setSelectedUniformIndices([]);
  }, [
    selectedUniformIndices,
    meshPixelInfo,
    meshBounds,
    colBounds,
    rowBounds,
    onFreestyleSquaresChange,
    updateSelection,
  ]);

  // Cut only selected uniform squares
  const handleCutSelectedUniform = useCallback(() => {
    if (selectedUniformIndices.length === 0) {
      onCutMesh();
      return;
    }

    const totalCols = meshPixelInfo.cols;
    const gridLeft = meshBounds.x;
    const gridTop = meshBounds.y;
    const gridWidth = meshPixelInfo.gridWidthPercent;
    const gridHeight = meshPixelInfo.gridHeightPercent;

    const squaresToCut: FreestyleSquare[] = selectedUniformIndices.map((idx) => {
      const r = Math.floor(idx / totalCols);
      const c = idx % totalCols;

      const colB = colBounds[c] || { start: (c / totalCols) * 100, size: 100 / totalCols };
      const rowB = rowBounds[r] || { start: (r / meshPixelInfo.rows) * 100, size: 100 / meshPixelInfo.rows };

      const sqX = gridLeft + (colB.start / 100) * gridWidth;
      const sqY = gridTop + (rowB.start / 100) * gridHeight;
      const sqW = (colB.size / 100) * gridWidth;
      const sqH = (rowB.size / 100) * gridHeight;

      return {
        id: `cut_u_${idx}`,
        x: Math.round(sqX * 100) / 100,
        y: Math.round(sqY * 100) / 100,
        width: Math.max(0.5, Math.round(sqW * 100) / 100),
        height: Math.max(0.5, Math.round(sqH * 100) / 100),
      };
    });

    setIsFlashCutting(true);
    setTimeout(() => setIsFlashCutting(false), 600);
    onCutMesh(squaresToCut);
  }, [selectedUniformIndices, meshPixelInfo, meshBounds, colBounds, rowBounds, onCutMesh]);

  // Drag & Resize Handlers for Individual / Multi Freestyle Squares
  const handleFreestylePointerDown = (
    e: React.PointerEvent,
    squareId: string,
    mode: "move" | "nw" | "ne" | "se" | "sw" | "n" | "s" | "e" | "w"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const targetSquare = freestyleSquares.find((s) => s.id === squareId);
    if (!targetSquare) return;

    const isMultiKey =
      isSpacebarDown ||
      (e.ctrlKey && e.altKey) ||
      (e.metaKey && e.altKey) ||
      e.shiftKey ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey;

    let activeSelectedGroup = [...effectiveSelectedIds];

    if (mode === "move") {
      if (isMultiKey) {
        if (activeSelectedGroup.includes(squareId)) {
          // Deselect on click a second time
          activeSelectedGroup = activeSelectedGroup.filter((id) => id !== squareId);
        } else {
          // Select and auto-send slice to Carved Slices
          activeSelectedGroup = [...activeSelectedGroup, squareId];
          onCutMesh([targetSquare]);
        }
        updateSelection(activeSelectedGroup);
        return;
      }

      if (!activeSelectedGroup.includes(squareId)) {
        activeSelectedGroup = [squareId];
        updateSelection(activeSelectedGroup);
        onCutMesh([targetSquare]);
      }
    } else {
      if (!activeSelectedGroup.includes(squareId)) {
        activeSelectedGroup = [squareId];
        updateSelection(activeSelectedGroup);
      }
    }

    const parentEl = imageElement?.parentElement;
    if (!parentEl) return;

    const parentRect = parentEl.getBoundingClientRect();

    const initialSquaresMap: Record<string, FreestyleSquare> = {};
    freestyleSquares.forEach((s) => {
      if (activeSelectedGroup.includes(s.id)) {
        initialSquaresMap[s.id] = { ...s };
      }
    });

    setFreestyleDragMode(mode);
    setFreestyleDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      squareId,
      initialSquare: { ...targetSquare },
      initialSquaresMap,
      parentWidth: parentRect.width,
      parentHeight: parentRect.height,
    });
  };

  // Close and commit active Angled Polygon Slice
  const handleClosePolygonSlice = useCallback(() => {
    if (activePolygonPoints.length < 3) return;

    const minX = Math.min(...activePolygonPoints.map((p) => p.x));
    const minY = Math.min(...activePolygonPoints.map((p) => p.y));
    const maxX = Math.max(...activePolygonPoints.map((p) => p.x));
    const maxY = Math.max(...activePolygonPoints.map((p) => p.y));

    const newId = `slice_poly_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSq: FreestyleSquare = {
      id: newId,
      x: Math.round(minX * 100) / 100,
      y: Math.round(minY * 100) / 100,
      width: Math.max(0.5, Math.round((maxX - minX) * 100) / 100),
      height: Math.max(0.5, Math.round((maxY - minY) * 100) / 100),
      shapeType: "polygon",
      points: [...activePolygonPoints],
      label: `Angled Slice ${freestyleSquares.length + 1}`,
    };

    onFreestyleSquaresChange?.((prev) => [...prev, newSq]);
    updateSelection([newId]);
    setActivePolygonPoints([]);
    setActivePolygonCursor(null);
    setIsSnappedToFirst(false);
    setFreestyleTool("select");
  }, [activePolygonPoints, freestyleSquares.length, onFreestyleSquaresChange, updateSelection, setFreestyleTool, setActivePolygonPoints]);

  // Quick Insert Trapeze Preset into canvas center
  const handleInsertTrapezePreset = useCallback(
    (presetId: string) => {
      const preset = TRAPEZE_PRESETS.find((p) => p.id === presetId) || TRAPEZE_PRESETS[0];
      const wPct = 25;
      const hPct = 25;
      const xPct = 50 - wPct / 2;
      const yPct = 50 - hPct / 2;
      const points = preset.getPoints(xPct, yPct, wPct, hPct);
      const minX = Math.min(...points.map((p) => p.x));
      const minY = Math.min(...points.map((p) => p.y));
      const maxX = Math.max(...points.map((p) => p.x));
      const maxY = Math.max(...points.map((p) => p.y));

      const newId = `slice_trapeze_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newSq: FreestyleSquare = {
        id: newId,
        x: Math.round(minX * 100) / 100,
        y: Math.round(minY * 100) / 100,
        width: Math.max(0.5, Math.round((maxX - minX) * 100) / 100),
        height: Math.max(0.5, Math.round((maxY - minY) * 100) / 100),
        shapeType: "trapezoid",
        points,
        label: `${preset.name} ${freestyleSquares.length + 1}`,
      };

      onFreestyleSquaresChange?.((prev) => [...prev, newSq]);
      updateSelection([newId]);
      setFreestyleTool("select");
    },
    [freestyleSquares.length, onFreestyleSquaresChange, updateSelection, setFreestyleTool]
  );

  // Keyboard shortcuts for Angled Polygon (Enter to close, Esc to cancel, Backspace to undo point)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = document.activeElement as HTMLElement | null;
      const tagName = (target?.tagName || "").toLowerCase();
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (freestyleTool === "angled" && activePolygonPoints.length > 0) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleClosePolygonSlice();
        } else if (e.key === "Escape") {
          e.preventDefault();
          setActivePolygonPoints([]);
          setActivePolygonCursor(null);
          setIsSnappedToFirst(false);
        } else if (e.key === "Backspace" || e.key === "Delete") {
          e.preventDefault();
          setActivePolygonPoints((prev) => prev.slice(0, -1));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [freestyleTool, activePolygonPoints, handleClosePolygonSlice]);

  // Vertex Drag Listener for polygon / trapezoid shape adjustment
  useEffect(() => {
    if (!vertexDrag || !imageElement?.parentElement) return;

    const handleVertexMove = (e: PointerEvent) => {
      const parentEl = imageElement.parentElement;
      if (!parentEl) return;
      const parentRect = parentEl.getBoundingClientRect();

      let pctX = ((e.clientX - parentRect.left) / parentRect.width) * 100;
      let pctY = ((e.clientY - parentRect.top) / parentRect.height) * 100;
      pctX = Math.max(0, Math.min(100, Math.round(pctX * 100) / 100));
      pctY = Math.max(0, Math.min(100, Math.round(pctY * 100) / 100));

      onFreestyleSquaresChange?.((prev) =>
        prev.map((sq) => {
          if (sq.id !== vertexDrag.squareId || !sq.points) return sq;
          const nextPoints = sq.points.map((pt, idx) =>
            idx === vertexDrag.vertexIndex ? { x: pctX, y: pctY } : pt
          );

          const minX = Math.min(...nextPoints.map((p) => p.x));
          const minY = Math.min(...nextPoints.map((p) => p.y));
          const maxX = Math.max(...nextPoints.map((p) => p.x));
          const maxY = Math.max(...nextPoints.map((p) => p.y));

          return {
            ...sq,
            points: nextPoints,
            x: Math.round(minX * 100) / 100,
            y: Math.round(minY * 100) / 100,
            width: Math.max(0.5, Math.round((maxX - minX) * 100) / 100),
            height: Math.max(0.5, Math.round((maxY - minY) * 100) / 100),
          };
        })
      );
    };

    const handleVertexUp = () => {
      setVertexDrag(null);
    };

    window.addEventListener("pointermove", handleVertexMove);
    window.addEventListener("pointerup", handleVertexUp);
    return () => {
      window.removeEventListener("pointermove", handleVertexMove);
      window.removeEventListener("pointerup", handleVertexUp);
    };
  }, [vertexDrag, imageElement, onFreestyleSquaresChange]);

  // Trapeze Drag Listener
  useEffect(() => {
    if (!trapezeDragStart) return;

    const handleTrapezeMove = (e: PointerEvent) => {
      setTrapezeDragCurrent({ x: e.clientX, y: e.clientY });
    };

    const handleTrapezeUp = (e: PointerEvent) => {
      const parentEl = imageElement?.parentElement;
      if (parentEl && trapezeDragStart) {
        const parentRect = parentEl.getBoundingClientRect();
        const startX = trapezeDragStart.x;
        const startY = trapezeDragStart.y;
        const endX = e.clientX;
        const endY = e.clientY;

        let leftPx = Math.min(startX, endX) - parentRect.left;
        let topPx = Math.min(startY, endY) - parentRect.top;
        let widthPx = Math.abs(endX - startX);
        let heightPx = Math.abs(endY - startY);

        if (widthPx < 10 || heightPx < 10) {
          const defPx = 100;
          widthPx = defPx;
          heightPx = defPx;
          leftPx = startX - parentRect.left - defPx / 2;
          topPx = startY - parentRect.top - defPx / 2;
        }

        const xPct = Math.round(((leftPx / parentRect.width) * 100) * 100) / 100;
        const yPct = Math.round(((topPx / parentRect.height) * 100) * 100) / 100;
        const wPct = Math.max(0.5, Math.round(((widthPx / parentRect.width) * 100) * 100) / 100);
        const hPct = Math.max(0.5, Math.round(((heightPx / parentRect.height) * 100) * 100) / 100);

        const preset = TRAPEZE_PRESETS.find((p) => p.id === activeTrapezePreset) || TRAPEZE_PRESETS[0];
        const points = preset.getPoints(xPct, yPct, wPct, hPct);
        const minX = Math.min(...points.map((p) => p.x));
        const minY = Math.min(...points.map((p) => p.y));
        const maxX = Math.max(...points.map((p) => p.x));
        const maxY = Math.max(...points.map((p) => p.y));

        const newId = `slice_trapeze_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const newSquare: FreestyleSquare = {
          id: newId,
          x: Math.round(minX * 100) / 100,
          y: Math.round(minY * 100) / 100,
          width: Math.max(0.5, Math.round((maxX - minX) * 100) / 100),
          height: Math.max(0.5, Math.round((maxY - minY) * 100) / 100),
          shapeType: "trapezoid",
          points,
          label: `${preset.name} ${freestyleSquares.length + 1}`,
        };

        onFreestyleSquaresChange?.((prev) => [...prev, newSquare]);
        updateSelection([newId]);
        setFreestyleTool("select");
      }

      setTrapezeDragStart(null);
      setTrapezeDragCurrent(null);
    };

    window.addEventListener("pointermove", handleTrapezeMove);
    window.addEventListener("pointerup", handleTrapezeUp);
    return () => {
      window.removeEventListener("pointermove", handleTrapezeMove);
      window.removeEventListener("pointerup", handleTrapezeUp);
    };
  }, [trapezeDragStart, activeTrapezePreset, imageElement, freestyleSquares.length, onFreestyleSquaresChange, updateSelection, setFreestyleTool]);

  // Background pointer down on canvas: Angled vertex placement, Trapeze drag, Marquee selection, or Rect drawing
  const handleBackgroundPointerDown = (e: React.PointerEvent) => {
    if (!isFreestyle) {
      // In uniform mode, clicking outside deselects uniform squares unless modifier is held
      if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        setSelectedUniformIndices([]);
      }
      return;
    }

    const parentEl = imageElement?.parentElement;
    if (!parentEl) return;
    const parentRect = parentEl.getBoundingClientRect();
    const curPctX = Math.max(0, Math.min(100, ((e.clientX - parentRect.left) / parentRect.width) * 100));
    const curPctY = Math.max(0, Math.min(100, ((e.clientY - parentRect.top) / parentRect.height) * 100));

    // Angled Slicing Workflow: dropping arbitrary vertices and closing polygon by magnetic snapping
    if (freestyleTool === "angled") {
      if (isSnappedToFirst && activePolygonPoints.length >= 3) {
        handleClosePolygonSlice();
        return;
      }
      const newPt: FreestylePoint = {
        x: Math.round(curPctX * 100) / 100,
        y: Math.round(curPctY * 100) / 100,
      };
      setActivePolygonPoints((prev) => [...prev, newPt]);
      return;
    }

    // Trapeze Slicing Mode: drag-to-draw
    if (freestyleTool === "trapeze") {
      setTrapezeDragStart({ x: e.clientX, y: e.clientY });
      setTrapezeDragCurrent({ x: e.clientX, y: e.clientY });
      return;
    }

    // Rect Box Slicer Mode: drag-to-draw
    if (freestyleTool === "rect") {
      setIsDrawingSquare(true);
      setDrawSquareStart({ x: e.clientX, y: e.clientY });
      setDrawSquareCurrent({ x: e.clientX, y: e.clientY });
      return;
    }

    if (e.target !== e.currentTarget) return;

    const isCtrlShift = (e.ctrlKey || e.metaKey) && e.shiftKey;
    if (isCtrlShift) {
      setIsDrawingSquare(true);
      setDrawSquareStart({ x: e.clientX, y: e.clientY });
      setDrawSquareCurrent({ x: e.clientX, y: e.clientY });
      return;
    }

    const isShift = e.shiftKey || e.ctrlKey || e.metaKey || e.altKey;
    setMarqueeStart({ x: e.clientX, y: e.clientY, isShift });
    setMarqueeCurrent({ x: e.clientX, y: e.clientY });
  };

  // Pointer move & up effects for Uniform Grid Boundary
  useEffect(() => {
    if (!dragMode || !dragStart) return;

    const handlePointerMove = (e: PointerEvent) => {
      // Smooth continuous drag with Shift key fine-tuning modifier
      const fineTuneFactor = e.shiftKey ? 0.25 : 1;
      const deltaX = (((e.clientX - dragStart.mouseX) / dragStart.parentWidth) * 100) * fineTuneFactor;
      const deltaY = (((e.clientY - dragStart.mouseY) / dragStart.parentHeight) * 100) * fineTuneFactor;

      const init = dragStart.initialBounds;
      let nextX = init.x;
      let nextY = init.y;
      let nextW = init.width;
      let nextH = init.height;

      const minSize = 0.5;

      if (dragMode === "move") {
        nextX = init.x + deltaX;
        nextY = init.y + deltaY;
      } else {
        if (dragMode.includes("e")) {
          nextW = Math.max(minSize, init.width + deltaX);
        }
        if (dragMode.includes("w")) {
          nextW = Math.max(minSize, init.width - deltaX);
          nextX = init.x + deltaX;
        }
        if (dragMode.includes("s")) {
          nextH = Math.max(minSize, init.height + deltaY);
        }
        if (dragMode.includes("n")) {
          nextH = Math.max(minSize, init.height - deltaY);
          nextY = init.y + deltaY;
        }
      }

      onMeshBoundsChange({
        x: Math.round(nextX * 100) / 100,
        y: Math.round(nextY * 100) / 100,
        width: Math.max(minSize, Math.round(nextW * 100) / 100),
        height: Math.max(minSize, Math.round(nextH * 100) / 100),
      });
    };

    const handlePointerUp = () => {
      setDragMode(null);
      setDragStart(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragMode, dragStart, onMeshBoundsChange]);

  // Pointer move & up for Freestyle Squares
  useEffect(() => {
    if (!freestyleDragMode || !freestyleDragStart) return;

    const handleFreestylePointerMove = (e: PointerEvent) => {
      // Smooth continuous drag with Shift key modifier for fine-tuning
      const fineTuneFactor = e.shiftKey ? 0.25 : 1;
      const deltaX = (((e.clientX - freestyleDragStart.mouseX) / freestyleDragStart.parentWidth) * 100) * fineTuneFactor;
      const deltaY = (((e.clientY - freestyleDragStart.mouseY) / freestyleDragStart.parentHeight) * 100) * fineTuneFactor;

      const minSize = 0.2;

      if (freestyleDragMode === "move" && freestyleDragStart.initialSquaresMap) {
        const initMap = freestyleDragStart.initialSquaresMap;
        onFreestyleSquaresChange?.((prev) =>
          prev.map((s) => {
            const init = initMap[s.id];
            if (!init) return s;
            const newX = Math.round((init.x + deltaX) * 100) / 100;
            const newY = Math.round((init.y + deltaY) * 100) / 100;
            const actualDeltaX = newX - init.x;
            const actualDeltaY = newY - init.y;

            return {
              ...s,
              x: newX,
              y: newY,
              points: init.points
                ? init.points.map((p) => ({
                    x: Math.round((p.x + actualDeltaX) * 100) / 100,
                    y: Math.round((p.y + actualDeltaY) * 100) / 100,
                  }))
                : undefined,
            };
          })
        );
      } else {
        const init = freestyleDragStart.initialSquare;
        let nextX = init.x;
        let nextY = init.y;
        let nextW = init.width;
        let nextH = init.height;

        if (freestyleDragMode.includes("e")) {
          nextW = Math.max(minSize, init.width + deltaX);
        }
        if (freestyleDragMode.includes("w")) {
          nextW = Math.max(minSize, init.width - deltaX);
          nextX = init.x + deltaX;
        }
        if (freestyleDragMode.includes("s")) {
          nextH = Math.max(minSize, init.height + deltaY);
        }
        if (freestyleDragMode.includes("n")) {
          nextH = Math.max(minSize, init.height - deltaY);
          nextY = init.y + deltaY;
        }

        const scaleX = init.width > 0 ? nextW / init.width : 1;
        const scaleY = init.height > 0 ? nextH / init.height : 1;

        const nextPoints = init.points
          ? init.points.map((p) => ({
              x: Math.round((nextX + (p.x - init.x) * scaleX) * 100) / 100,
              y: Math.round((nextY + (p.y - init.y) * scaleY) * 100) / 100,
            }))
          : undefined;

        onFreestyleSquaresChange?.((prev) =>
          prev.map((s) =>
            s.id === freestyleDragStart.squareId
              ? {
                  ...s,
                  x: Math.round(nextX * 100) / 100,
                  y: Math.round(nextY * 100) / 100,
                  width: Math.max(minSize, Math.round(nextW * 100) / 100),
                  height: Math.max(minSize, Math.round(nextH * 100) / 100),
                  points: nextPoints,
                }
              : s
          )
        );
      }
    };

    const handleFreestylePointerUp = () => {
      setFreestyleDragMode(null);
      setFreestyleDragStart(null);
    };

    window.addEventListener("pointermove", handleFreestylePointerMove);
    window.addEventListener("pointerup", handleFreestylePointerUp);
    return () => {
      window.removeEventListener("pointermove", handleFreestylePointerMove);
      window.removeEventListener("pointerup", handleFreestylePointerUp);
    };
  }, [freestyleDragMode, freestyleDragStart, onFreestyleSquaresChange]);

  // Pointer move & up for Canvas Marquee Selection
  useEffect(() => {
    if (!marqueeStart) return;

    const handleMarqueePointerMove = (e: PointerEvent) => {
      setMarqueeCurrent({ x: e.clientX, y: e.clientY });
    };

    const handleMarqueePointerUp = (e: PointerEvent) => {
      const parentEl = imageElement?.parentElement;
      if (parentEl && marqueeStart) {
        const parentRect = parentEl.getBoundingClientRect();
        const startX = marqueeStart.x;
        const startY = marqueeStart.y;
        const endX = e.clientX;
        const endY = e.clientY;

        const dist = Math.hypot(endX - startX, endY - startY);

        if (dist > 5) {
          const leftPx = Math.min(startX, endX) - parentRect.left;
          const rightPx = Math.max(startX, endX) - parentRect.left;
          const topPx = Math.min(startY, endY) - parentRect.top;
          const bottomPx = Math.max(startY, endY) - parentRect.top;

          const boxX1 = (leftPx / parentRect.width) * 100;
          const boxX2 = (rightPx / parentRect.width) * 100;
          const boxY1 = (topPx / parentRect.height) * 100;
          const boxY2 = (bottomPx / parentRect.height) * 100;

          const selectedInBox = freestyleSquares
            .filter((sq) => {
              const sqX1 = sq.x;
              const sqX2 = sq.x + sq.width;
              const sqY1 = sq.y;
              const sqY2 = sq.y + sq.height;

              return !(sqX2 < boxX1 || sqX1 > boxX2 || sqY2 < boxY1 || sqY1 > boxY2);
            })
            .map((s) => s.id);

          if (marqueeStart.isShift) {
            const merged = Array.from(new Set([...effectiveSelectedIds, ...selectedInBox]));
            updateSelection(merged);
          } else {
            updateSelection(selectedInBox);
          }
        } else {
          if (!marqueeStart.isShift) {
            updateSelection([]);
          }
        }
      }

      setMarqueeStart(null);
      setMarqueeCurrent(null);
    };

    window.addEventListener("pointermove", handleMarqueePointerMove);
    window.addEventListener("pointerup", handleMarqueePointerUp);
    return () => {
      window.removeEventListener("pointermove", handleMarqueePointerMove);
      window.removeEventListener("pointerup", handleMarqueePointerUp);
    };
  }, [marqueeStart, freestyleSquares, effectiveSelectedIds, imageElement, updateSelection]);

  // Pointer move & up for Interactive Ctrl+Shift Square Drawing
  useEffect(() => {
    if (!isDrawingSquare || !drawSquareStart) return;

    const handleDrawMove = (e: PointerEvent) => {
      setDrawSquareCurrent({ x: e.clientX, y: e.clientY });
    };

    const handleDrawUp = (e: PointerEvent) => {
      const parentEl = imageElement?.parentElement;
      if (parentEl && drawSquareStart) {
        const parentRect = parentEl.getBoundingClientRect();
        const startX = drawSquareStart.x;
        const startY = drawSquareStart.y;
        const endX = e.clientX;
        const endY = e.clientY;

        let leftPx = Math.min(startX, endX) - parentRect.left;
        let topPx = Math.min(startY, endY) - parentRect.top;
        let widthPx = Math.abs(endX - startX);
        let heightPx = Math.abs(endY - startY);

        if (widthPx < 8 || heightPx < 8) {
          const defPx = squareSize > 0 ? squareSize : 64;
          widthPx = defPx;
          heightPx = defPx;
          leftPx = (startX - parentRect.left) - defPx / 2;
          topPx = (startY - parentRect.top) - defPx / 2;
        }

        const xPct = Math.round(((leftPx / parentRect.width) * 100) * 100) / 100;
        const yPct = Math.round(((topPx / parentRect.height) * 100) * 100) / 100;
        const wPct = Math.max(0.5, Math.round(((widthPx / parentRect.width) * 100) * 100) / 100);
        const hPct = Math.max(0.5, Math.round(((heightPx / parentRect.height) * 100) * 100) / 100);

        const newId = `sq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newSquare: FreestyleSquare = {
          id: newId,
          x: Math.max(0, Math.min(100 - wPct, xPct)),
          y: Math.max(0, Math.min(100 - hPct, yPct)),
          width: Math.min(100, wPct),
          height: Math.min(100, hPct),
        };

        onFreestyleSquaresChange?.((prev) => [...prev, newSquare]);
        updateSelection([newId]);
        if (freestyleTool === "rect") {
          setFreestyleTool("select");
        }
      }

      setIsDrawingSquare(false);
      setDrawSquareStart(null);
      setDrawSquareCurrent(null);
    };

    window.addEventListener("pointermove", handleDrawMove);
    window.addEventListener("pointerup", handleDrawUp);
    return () => {
      window.removeEventListener("pointermove", handleDrawMove);
      window.removeEventListener("pointerup", handleDrawUp);
    };
  }, [isDrawingSquare, drawSquareStart, imageElement, squareSize, onFreestyleSquaresChange, updateSelection, freestyleTool, setFreestyleTool]);

  // Helper to duplicate selected freestyle squares
  const handleDuplicateSelected = useCallback(() => {
    if (effectiveSelectedIds.length === 0) return;
    if (onDuplicateFreestyleSquares) {
      onDuplicateFreestyleSquares(effectiveSelectedIds);
    } else if (onDuplicateFreestyleSquare) {
      effectiveSelectedIds.forEach((id) => onDuplicateFreestyleSquare(id));
    }
  }, [effectiveSelectedIds, onDuplicateFreestyleSquares, onDuplicateFreestyleSquare]);

  // Helper to delete selected freestyle squares
  const handleDeleteSelected = useCallback(() => {
    if (effectiveSelectedIds.length === 0) return;
    if (onDeleteFreestyleSquares) {
      onDeleteFreestyleSquares(effectiveSelectedIds);
    } else if (onDeleteFreestyleSquare) {
      effectiveSelectedIds.forEach((id) => onDeleteFreestyleSquare(id));
    }
  }, [effectiveSelectedIds, onDeleteFreestyleSquares, onDeleteFreestyleSquare]);

  // Helper to merge selected freestyle squares into 1 single bounding box
  const handleMergeSelected = useCallback(() => {
    if (effectiveSelectedIds.length < 2) return;
    if (onMergeFreestyleSquares) {
      onMergeFreestyleSquares(effectiveSelectedIds);
      return;
    }

    const selectedSquares = freestyleSquares.filter((s) => effectiveSelectedIds.includes(s.id));
    if (selectedSquares.length < 2) return;

    const minX = Math.min(...selectedSquares.map((s) => s.x));
    const minY = Math.min(...selectedSquares.map((s) => s.y));
    const maxX = Math.max(...selectedSquares.map((s) => s.x + s.width));
    const maxY = Math.max(...selectedSquares.map((s) => s.y + s.height));
    const width = Math.max(0.5, Math.round((maxX - minX) * 100) / 100);
    const height = Math.max(0.5, Math.round((maxY - minY) * 100) / 100);

    const mergedSquare: FreestyleSquare = {
      id: `fs_merged_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x: Math.round(minX * 100) / 100,
      y: Math.round(minY * 100) / 100,
      width,
      height,
      label: `Merged (${selectedSquares.length} slices)`,
    };

    const selectedSet = new Set(effectiveSelectedIds);
    const remaining = freestyleSquares.filter((s) => !selectedSet.has(s.id));
    const nextSquares = [...remaining, mergedSquare];

    onFreestyleSquaresChange?.(nextSquares);
    updateSelection([mergedSquare.id]);
  }, [effectiveSelectedIds, onMergeFreestyleSquares, freestyleSquares, onFreestyleSquaresChange, updateSelection]);

  // Clear all freestyle squares
  const handleClearAll = useCallback(() => {
    if (onClearAllFreestyleSquares) {
      onClearAllFreestyleSquares();
    } else if (onFreestyleSquaresChange) {
      onFreestyleSquaresChange([]);
    }
    updateSelection([]);
  }, [onClearAllFreestyleSquares, onFreestyleSquaresChange, updateSelection]);

  // Global Keyboard shortcuts: Escape (Clear Selection), Alt+M (Toggle Adjust Lines), Delete (Remove Selected), J/M (Merge Selected)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = document.activeElement as HTMLElement | null;
      const tagName = (target?.tagName || "").toLowerCase();
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (!isFreestyle && selectedUniformIndices.length > 0) {
          e.preventDefault();
          setSelectedUniformIndices([]);
        } else if (isFreestyle && effectiveSelectedIds.length > 0) {
          e.preventDefault();
          updateSelection([]);
        }
      } else if ((e.altKey && (e.key === "m" || e.key === "M")) && !isFreestyle) {
        e.preventDefault();
        toggleAdjustLines();
      } else if (isFreestyle && (e.key === "Delete" || e.key === "Backspace")) {
        if (effectiveSelectedIds.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
      } else if (
        isFreestyle &&
        (e.key === "j" || e.key === "J" || e.key === "m" || e.key === "M") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        if (effectiveSelectedIds.length >= 2) {
          e.preventDefault();
          handleMergeSelected();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isFreestyle,
    selectedUniformIndices,
    effectiveSelectedIds,
    handleDeleteSelected,
    handleMergeSelected,
    toggleAdjustLines,
    updateSelection,
  ]);

  const triggerCut = () => {
    setIsFlashCutting(true);
    setTimeout(() => setIsFlashCutting(false), 600);
    if (isFreestyle) {
      onCutMesh(freestyleSquares);
    } else {
      if (selectedUniformIndices.length > 0) {
        handleCutSelectedUniform();
      } else {
        onCutMesh();
      }
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerCut();
  };

  const activeColorHex = gridLineColor || "#10b981";
  const activeLineWidth = gridLineWidth || 2;

  // Compute marquee bounding rect for UI display
  const marqueeUiRect = useMemo(() => {
    if (!marqueeStart || !marqueeCurrent || !imageElement?.parentElement) return null;
    const parentRect = imageElement.parentElement.getBoundingClientRect();
    const left = Math.min(marqueeStart.x, marqueeCurrent.x) - parentRect.left;
    const top = Math.min(marqueeStart.y, marqueeCurrent.y) - parentRect.top;
    const width = Math.abs(marqueeCurrent.x - marqueeStart.x);
    const height = Math.abs(marqueeCurrent.y - marqueeStart.y);

    if (width < 3 && height < 3) return null;

    return { left, top, width, height };
  }, [marqueeStart, marqueeCurrent, imageElement]);

  // Compute live drawn square UI rect
  const drawSquareUiRect = useMemo(() => {
    if (!isDrawingSquare || !drawSquareStart || !drawSquareCurrent || !imageElement?.parentElement) return null;
    const parentRect = imageElement.parentElement.getBoundingClientRect();
    const left = Math.min(drawSquareStart.x, drawSquareCurrent.x) - parentRect.left;
    const top = Math.min(drawSquareStart.y, drawSquareCurrent.y) - parentRect.top;
    const width = Math.abs(drawSquareCurrent.x - drawSquareStart.x);
    const height = Math.abs(drawSquareCurrent.y - drawSquareStart.y);

    return { left, top, width, height };
  }, [isDrawingSquare, drawSquareStart, drawSquareCurrent, imageElement]);

  const handleContainerPointerMove = (e: React.PointerEvent) => {
    if (freestyleTool === "angled" && activePolygonPoints.length > 0 && imageElement?.parentElement) {
      const parentEl = imageElement.parentElement;
      const parentRect = parentEl.getBoundingClientRect();
      const curPctX = ((e.clientX - parentRect.left) / parentRect.width) * 100;
      const curPctY = ((e.clientY - parentRect.top) / parentRect.height) * 100;

      // Check distance to 1st placed point in screen pixels
      const firstPt = activePolygonPoints[0];
      const firstPtPxX = (firstPt.x / 100) * parentRect.width + parentRect.left;
      const firstPtPxY = (firstPt.y / 100) * parentRect.height + parentRect.top;
      const distPx = Math.hypot(e.clientX - firstPtPxX, e.clientY - firstPtPxY);

      if (activePolygonPoints.length >= 2 && distPx <= 24) {
        setIsSnappedToFirst(true);
        setActivePolygonCursor({ x: firstPt.x, y: firstPt.y });
      } else {
        setIsSnappedToFirst(false);
        setActivePolygonCursor({
          x: Math.max(0, Math.min(100, curPctX)),
          y: Math.max(0, Math.min(100, curPctY)),
        });
      }
    }
  };

  // Trapeze in-progress preview polygon points
  const liveTrapezePoints = useMemo(() => {
    if (!trapezeDragStart || !trapezeDragCurrent || !imageElement?.parentElement) return null;
    const parentEl = imageElement.parentElement;
    const parentRect = parentEl.getBoundingClientRect();

    const startX = trapezeDragStart.x;
    const startY = trapezeDragStart.y;
    const endX = trapezeDragCurrent.x;
    const endY = trapezeDragCurrent.y;

    let leftPx = Math.min(startX, endX) - parentRect.left;
    let topPx = Math.min(startY, endY) - parentRect.top;
    let widthPx = Math.abs(endX - startX);
    let heightPx = Math.abs(endY - startY);

    if (widthPx < 10 || heightPx < 10) {
      const defPx = 100;
      widthPx = defPx;
      heightPx = defPx;
      leftPx = startX - parentRect.left - defPx / 2;
      topPx = startY - parentRect.top - defPx / 2;
    }

    const xPct = (leftPx / parentRect.width) * 100;
    const yPct = (topPx / parentRect.height) * 100;
    const wPct = (widthPx / parentRect.width) * 100;
    const hPct = (heightPx / parentRect.height) * 100;

    const preset = TRAPEZE_PRESETS.find((p) => p.id === activeTrapezePreset) || TRAPEZE_PRESETS[0];
    return preset.getPoints(xPct, yPct, wPct, hPct);
  }, [trapezeDragStart, trapezeDragCurrent, activeTrapezePreset, imageElement]);

  return (
    <div
      onPointerDown={handleBackgroundPointerDown}
      onPointerMove={handleContainerPointerMove}
      className="absolute inset-0 pointer-events-auto z-50 select-none overflow-visible"
    >
      {/* ================= FREESTYLE MODE OVERLAY ================= */}
      {isFreestyle ? (
        <div className={cn(
          "w-full h-full relative overflow-visible",
          freestyleTool === "angled" ? "cursor-crosshair" : freestyleTool === "trapeze" || freestyleTool === "rect" ? "cursor-crosshair" : "cursor-default"
        )}>
          {/* SVG Overlay for Angled Polygon In-Progress & Existing Non-Rect Slices */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-40 overflow-visible">
            {/* Render In-Progress Angled Slicer Rubberband & Points */}
            {freestyleTool === "angled" && activePolygonPoints.length > 0 && (
              <g className="in-progress-polygon">
                {/* Connecting lines between placed points */}
                {activePolygonPoints.map((pt, i) => {
                  if (i === 0) return null;
                  const prev = activePolygonPoints[i - 1];
                  return (
                    <line
                      key={`line-${i}`}
                      x1={`${prev.x}%`}
                      y1={`${prev.y}%`}
                      x2={`${pt.x}%`}
                      y2={`${pt.y}%`}
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                    />
                  );
                })}

                {/* Rubberband to current mouse cursor */}
                {activePolygonCursor && (
                  <line
                    x1={`${activePolygonPoints[activePolygonPoints.length - 1].x}%`}
                    y1={`${activePolygonPoints[activePolygonPoints.length - 1].y}%`}
                    x2={`${activePolygonCursor.x}%`}
                    y2={`${activePolygonCursor.y}%`}
                    stroke={isSnappedToFirst ? "#10b981" : "#fbbf24"}
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Placed vertex marker nodes */}
                {activePolygonPoints.map((pt, i) => {
                  const isFirst = i === 0;
                  return (
                    <g key={`pt-${i}`}>
                      {isFirst && isSnappedToFirst && (
                        <circle
                          cx={`${pt.x}%`}
                          cy={`${pt.y}%`}
                          r="14"
                          fill="rgba(16, 185, 129, 0.25)"
                          stroke="#10b981"
                          strokeWidth="2"
                          className="animate-ping"
                        />
                      )}
                      <circle
                        cx={`${pt.x}%`}
                        cy={`${pt.y}%`}
                        r={isFirst ? "6" : "4.5"}
                        fill={isFirst ? (isSnappedToFirst ? "#10b981" : "#f59e0b") : "#38bdf8"}
                        stroke="#0f172a"
                        strokeWidth="2"
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* Live Trapeze Drag-To-Draw Preview Polygon with Precision Bounding Lines */}
            {liveTrapezePoints && (() => {
              const minX = Math.min(...liveTrapezePoints.map((p) => p.x));
              const minY = Math.min(...liveTrapezePoints.map((p) => p.y));
              const maxX = Math.max(...liveTrapezePoints.map((p) => p.x));
              const maxY = Math.max(...liveTrapezePoints.map((p) => p.y));
              const bw = maxX - minX;
              const bh = maxY - minY;

              return (
                <g className="live-trapeze-group">
                  {/* Outer Bounding Box Lines */}
                  <rect
                    x={`${minX}%`}
                    y={`${minY}%`}
                    width={`${bw}%`}
                    height={`${bh}%`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    opacity="0.9"
                  />
                  {/* 4 Viewfinder Corner Brackets */}
                  <path
                    d={`M ${minX}% ${minY + Math.min(bh * 0.25, 2.5)}% L ${minX}% ${minY}% L ${minX + Math.min(bw * 0.25, 2.5)}% ${minY}%`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />
                  <path
                    d={`M ${maxX - Math.min(bw * 0.25, 2.5)}% ${minY}% L ${maxX}% ${minY}% L ${maxX}% ${minY + Math.min(bh * 0.25, 2.5)}%`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />
                  <path
                    d={`M ${maxX}% ${maxY - Math.min(bh * 0.25, 2.5)}% L ${maxX}% ${maxY}% L ${maxX - Math.min(bw * 0.25, 2.5)}% ${maxY}%`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />
                  <path
                    d={`M ${minX + Math.min(bw * 0.25, 2.5)}% ${maxY}% L ${minX}% ${maxY}% L ${minX}% ${maxY - Math.min(bh * 0.25, 2.5)}%`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />

                  {/* Trapeze Polygon */}
                  <polygon
                    points={liveTrapezePoints.map((p) => `${p.x}%,${p.y}%`).join(" ")}
                    fill="rgba(16, 185, 129, 0.25)"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />

                  {/* Placed vertex nodes */}
                  {liveTrapezePoints.map((pt, i) => (
                    <circle
                      key={`live-t-pt-${i}`}
                      cx={`${pt.x}%`}
                      cy={`${pt.y}%`}
                      r="4.5"
                      fill="#38bdf8"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                  ))}
                </g>
              );
            })()}

            {/* Render Custom Polygons & Trapezoid Shapes with Bounding Lines for Finished Slices */}
            {freestyleSquares
              .filter((sq) => sq.points && sq.points.length > 2)
              .map((sq) => {
                const isSelected = effectiveSelectedIds.includes(sq.id);
                const pointsAttr = (sq.points || []).map((p) => `${p.x}%,${p.y}%`).join(" ");

                return (
                  <g key={`poly-render-${sq.id}`} className="pointer-events-none">
                    {/* Always visible Bounding Lines for Trapezoid & Angled Polygon Shapes */}
                    <g className="polygon-bounding-envelope">
                      {/* Outer Enclosing Rectangle Dotted Bounding Lines */}
                      <rect
                        x={`${sq.x}%`}
                        y={`${sq.y}%`}
                        width={`${sq.width}%`}
                        height={`${sq.height}%`}
                        fill="none"
                        stroke={isSelected ? "#38bdf8" : "#06b6d4"}
                        strokeWidth={isSelected ? "1.75" : "1.25"}
                        strokeDasharray="4 3"
                        opacity={isSelected ? "1" : "0.85"}
                      />

                      {/* Corner Brackets on 4 bounding box corners */}
                      <path
                        d={`M ${sq.x}% ${sq.y + Math.min(sq.height * 0.25, 2.5)}% L ${sq.x}% ${sq.y}% L ${sq.x + Math.min(sq.width * 0.25, 2.5)}% ${sq.y}%`}
                        fill="none"
                        stroke={isSelected ? "#38bdf8" : "#22d3ee"}
                        strokeWidth="2"
                        opacity={isSelected ? "1" : "0.9"}
                      />
                      <path
                        d={`M ${sq.x + sq.width - Math.min(sq.width * 0.25, 2.5)}% ${sq.y}% L ${sq.x + sq.width}% ${sq.y}% L ${sq.x + sq.width}% ${sq.y + Math.min(sq.height * 0.25, 2.5)}%`}
                        fill="none"
                        stroke={isSelected ? "#38bdf8" : "#22d3ee"}
                        strokeWidth="2"
                        opacity={isSelected ? "1" : "0.9"}
                      />
                      <path
                        d={`M ${sq.x + sq.width}% ${sq.y + sq.height - Math.min(sq.height * 0.25, 2.5)}% L ${sq.x + sq.width}% ${sq.y + sq.height}% L ${sq.x + sq.width - Math.min(sq.width * 0.25, 2.5)}% ${sq.y + sq.height}%`}
                        fill="none"
                        stroke={isSelected ? "#38bdf8" : "#22d3ee"}
                        strokeWidth="2"
                        opacity={isSelected ? "1" : "0.9"}
                      />
                      <path
                        d={`M ${sq.x + Math.min(sq.width * 0.25, 2.5)}% ${sq.y + sq.height}% L ${sq.x}% ${sq.y + sq.height}% L ${sq.x}% ${sq.y + sq.height - Math.min(sq.height * 0.25, 2.5)}%`}
                        fill="none"
                        stroke={isSelected ? "#38bdf8" : "#22d3ee"}
                        strokeWidth="2"
                        opacity={isSelected ? "1" : "0.9"}
                      />

                      {/* Parallel base guidelines if 4 points / trapeze */}
                      {sq.points && sq.points.length === 4 && (
                        <>
                          <line
                            x1={`${sq.points[0].x}%`}
                            y1={`${sq.points[0].y}%`}
                            x2={`${sq.points[1].x}%`}
                            y2={`${sq.points[1].y}%`}
                            stroke={isSelected ? "rgba(56, 189, 248, 0.85)" : "rgba(34, 211, 238, 0.65)"}
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                          />
                          <line
                            x1={`${sq.points[3].x}%`}
                            y1={`${sq.points[3].y}%`}
                            x2={`${sq.points[2].x}%`}
                            y2={`${sq.points[2].y}%`}
                            stroke={isSelected ? "rgba(56, 189, 248, 0.85)" : "rgba(34, 211, 238, 0.65)"}
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                          />
                        </>
                      )}
                    </g>

                    {/* Trapezoid / Polygon Cut Shape */}
                    <polygon
                      points={pointsAttr}
                      fill={isSelected ? `${activeColorHex}40` : `${activeColorHex}20`}
                      stroke={isSelected ? "#34d399" : activeColorHex}
                      strokeWidth={isSelected ? "2.5" : `${activeLineWidth}`}
                      strokeLinejoin="round"
                    />
                  </g>
                );
              })}
          </svg>

          {/* Magnetic Snap Badge for 1st Point */}
          {freestyleTool === "angled" && isSnappedToFirst && activePolygonPoints.length >= 2 && (
            <div
              className="absolute z-50 pointer-events-none -translate-x-1/2 -translate-y-9 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xl flex items-center gap-1 border border-white animate-bounce"
              style={{
                left: `${activePolygonPoints[0].x}%`,
                top: `${activePolygonPoints[0].y}%`,
              }}
            >
              <Sparkles className="w-3 h-3 stroke-[3]" />
              <span>{uiText("components_crop_mesh_overlay.span.click_to_close_slice", "Click to Close Slice")}</span>
            </div>
          )}

          {/* Live Ctrl+Shift Draw Preview Box */}
          {drawSquareUiRect && (
            <div
              className="absolute border-2 border-dashed border-cyan-400 bg-cyan-500/20 rounded pointer-events-none z-50 shadow-xl flex items-center justify-center"
              style={{
                left: `${drawSquareUiRect.left}px`,
                top: `${drawSquareUiRect.top}px`,
                width: `${drawSquareUiRect.width}px`,
                height: `${drawSquareUiRect.height}px`,
              }}
            >
              <div className="bg-slate-950/90 text-cyan-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-cyan-400/60 shadow">
                {Math.round(drawSquareUiRect.width)}×{Math.round(drawSquareUiRect.height)}{uiText("components_crop_mesh_overlay.div.px", "px")}
              </div>
            </div>
          )}

          {/* Marquee Selection Box */}
          {marqueeUiRect && (
            <div
              className="absolute border-2 border-dashed border-emerald-400 bg-emerald-500/15 rounded pointer-events-none z-50 shadow-sm"
              style={{
                left: `${marqueeUiRect.left}px`,
                top: `${marqueeUiRect.top}px`,
                width: `${marqueeUiRect.width}px`,
                height: `${marqueeUiRect.height}px`,
              }}
            />
          )}

          {/* Render each freestyle square independently with handles */}
          {freestyleSquares.map((sq, idx) => {
            const isSelected = effectiveSelectedIds.includes(sq.id);
            const isPrimary = primarySelectedId === sq.id;
            const pxW = Math.round((sq.width / 100) * naturalDimensions.width);
            const pxH = Math.round((sq.height / 100) * naturalDimensions.height);

            return (
              <div
                key={sq.id}
                onPointerDown={(e) => handleFreestylePointerDown(e, sq.id, "move")}
                onDoubleClick={handleDoubleClick}
                className={cn(
                  "absolute pointer-events-auto cursor-move transition-shadow rounded-sm z-50 group",
                  isSelected
                    ? "shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-2 ring-emerald-300"
                    : "shadow-md hover:brightness-110 hover:border-emerald-300"
                )}
                style={{
                  left: `${sq.x}%`,
                  top: `${sq.y}%`,
                  width: `${sq.width}%`,
                  height: `${sq.height}%`,
                  borderWidth: sq.points && sq.points.length > 2 ? "1px" : `${activeLineWidth}px`,
                  borderStyle: sq.points && sq.points.length > 2 ? "dashed" : "solid",
                  borderColor: isSelected ? "#34d399" : sq.points && sq.points.length > 2 ? "rgba(52, 211, 153, 0.4)" : activeColorHex,
                  backgroundColor: sq.points && sq.points.length > 2 ? "transparent" : isSelected ? `${activeColorHex}35` : `${activeColorHex}15`,
                }}
              >
                {/* Index & Dimension Badge + Selection Checkmark Tickbox */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isSelected) {
                      // Clicking a second time on selected box deselects it
                      updateSelection(effectiveSelectedIds.filter((id) => id !== sq.id));
                    } else {
                      // Selecting tickbox selects slice and adds to selection, then auto-sends slice
                      updateSelection([...effectiveSelectedIds, sq.id]);
                      onCutMesh([sq]);
                    }
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={cn(
                    "absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold flex items-center gap-1 shadow-sm border cursor-pointer transition-all pointer-events-auto select-none",
                    isSelected
                      ? "bg-emerald-950 text-emerald-200 border-emerald-400 ring-1 ring-emerald-400/50 scale-105"
                      : "bg-slate-950/90 text-white border-slate-700 hover:border-emerald-400 hover:text-emerald-300"
                  )}
                  title={isSelected ? "Click to deselect this square" : "Click tickbox to select & add to Carved Slices"}
                >
                  {isSelected ? (
                    <CheckSquare className="w-3 h-3 text-emerald-400 stroke-[2.5]" />
                  ) : (
                    <Square className="w-3 h-3 text-slate-400 group-hover:text-emerald-400 stroke-[2]" />
                  )}
                  <span>#{idx + 1}</span>
                  {sq.shapeType === "polygon" && (
                    <span className="text-amber-300 font-bold bg-amber-950/80 px-1 rounded text-[7.5px]">{uiText("components_crop_mesh_overlay.span.angled", "Angled")}</span>
                  )}
                  {sq.shapeType === "trapezoid" && (
                    <span className="text-emerald-300 font-bold bg-emerald-950/80 px-1 rounded text-[7.5px]">{uiText("components_crop_mesh_overlay.span.trapeze", "Trapeze")}</span>
                  )}
                  <span className="text-emerald-400 font-bold">{pxW}×{pxH}{uiText("components_crop_mesh_overlay.span.px", "px")}</span>
                </div>

                {/* Direct Vertex Drag Handles for Angled Polygon / Trapezoid */}
                {isSelected && sq.points && sq.points.length > 2 && (
                  <>
                    {sq.points.map((pt, ptIdx) => {
                      const relX = sq.width > 0 ? ((pt.x - sq.x) / sq.width) * 100 : 0;
                      const relY = sq.height > 0 ? ((pt.y - sq.y) / sq.height) * 100 : 0;

                      return (
                        <div
                          key={`v-handle-${sq.id}-${ptIdx}`}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            const parentEl = imageElement?.parentElement;
                            if (parentEl) {
                              const rect = parentEl.getBoundingClientRect();
                              setVertexDrag({
                                squareId: sq.id,
                                vertexIndex: ptIdx,
                                parentWidth: rect.width,
                                parentHeight: rect.height,
                              });
                            }
                          }}
                          className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 bg-amber-400 hover:bg-amber-300 border-2 border-slate-950 rounded-full shadow-lg cursor-crosshair pointer-events-auto z-[60] hover:scale-125 transition-transform"
                          style={{
                            left: `${relX}%`,
                            top: `${relY}%`,
                          }}
                          title={`Drag to adjust vertex #${ptIdx + 1}`}
                        />
                      );
                    })}
                  </>
                )}

                {/* Quick Action Bar on Single Selection or Hover (Icon-Only Buttons) */}
                {isSelected && (
                  <div
                    className={cn(
                      "absolute -top-7 right-0 flex items-center gap-1 bg-slate-950/95 border border-slate-700 rounded-lg p-0.5 pointer-events-auto z-50 shadow-xl backdrop-blur-sm",
                      effectiveSelectedIds.length > 1 ? "opacity-70 hover:opacity-100" : ""
                    )}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {/* Sent to Carved Slices Icon */}
                    <CustomizableButton
                      buttonId="crop_mesh_overlay_btn_9"
                      defaultIcon={<Send className="w-2.5 h-2.5 text-emerald-400" />}
                      type="button"
onClick={(e) => {
                        e.stopPropagation();
                        onCutMesh([sq]);
                      }}
className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 rounded cursor-pointer transition-colors"
title={uiText("components_crop_mesh_overlay.button.send_slice_to_carved_slices_in_storyboard.title", "Send slice to Carved Slices in Storyboard")}
                    />
                    {onDuplicateFreestyleSquare && (
                      <CustomizableButton
                        buttonId="crop_mesh_overlay_btn_8"
                        defaultIcon={<Copy className="w-2.5 h-2.5 text-emerald-400" />}
                        type="button"
onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateFreestyleSquare(sq.id);
                        }}
className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 rounded cursor-pointer transition-colors"
title={uiText("components_crop_mesh_overlay.button.duplicate_this_square.title", "Duplicate this square")}
                      />
                    )}
                    {onDeleteFreestyleSquare && (
                      <CustomizableButton
                        buttonId="crop_mesh_overlay_btn_7"
                        defaultIcon={<Trash2 className="w-2.5 h-2.5" />}
                        type="button"
onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFreestyleSquare(sq.id);
                        }}
className="p-1 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded cursor-pointer transition-colors"
title={uiText("components_crop_mesh_overlay.button.delete_this_square.title", "Delete this square")}
                      />
                    )}
                  </div>
                )}

                {/* 8 Drag & Resize Handles */}
                {isSelected && (
                  <>
                    <div
                      onPointerDown={(e) => handleFreestylePointerDown(e, sq.id, "nw")}
                      className={cn(
                        "absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border rounded-xs cursor-nwse-resize pointer-events-auto shadow-md",
                        isPrimary ? "border-emerald-600 ring-1 ring-emerald-400" : "border-slate-950"
                      )}
                      title={uiText("components_crop_mesh_overlay.div.resize_top_left_hold_shift_for_fine_tuning.title", "Resize Top-Left (Hold Shift for fine-tuning)")}
                    />
                    <div
                      onPointerDown={(e) => handleFreestylePointerDown(e, sq.id, "ne")}
                      className={cn(
                        "absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border rounded-xs cursor-nesw-resize pointer-events-auto shadow-md",
                        isPrimary ? "border-emerald-600 ring-1 ring-emerald-400" : "border-slate-950"
                      )}
                      title={uiText("components_crop_mesh_overlay.div.resize_top_right_hold_shift_for_fine_tuning.title", "Resize Top-Right (Hold Shift for fine-tuning)")}
                    />
                    <div
                      onPointerDown={(e) => handleFreestylePointerDown(e, sq.id, "se")}
                      className={cn(
                        "absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border rounded-xs cursor-nwse-resize pointer-events-auto shadow-md",
                        isPrimary ? "border-emerald-600 ring-1 ring-emerald-400" : "border-slate-950"
                      )}
                      title={uiText("components_crop_mesh_overlay.div.resize_bottom_right_hold_shift_for_fine_tuni.title", "Resize Bottom-Right (Hold Shift for fine-tuning)")}
                    />
                    <div
                      onPointerDown={(e) => handleFreestylePointerDown(e, sq.id, "sw")}
                      className={cn(
                        "absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border rounded-xs cursor-nesw-resize pointer-events-auto shadow-md",
                        isPrimary ? "border-emerald-600 ring-1 ring-emerald-400" : "border-slate-950"
                      )}
                      title={uiText("components_crop_mesh_overlay.div.resize_bottom_left_hold_shift_for_fine_tunin.title", "Resize Bottom-Left (Hold Shift for fine-tuning)")}
                    />

                    <div
                      onPointerDown={(e) => handleFreestylePointerDown(e, sq.id, "n")}
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-emerald-400 border border-slate-950 rounded-xs cursor-ns-resize pointer-events-auto shadow-sm"
                      title={uiText("components_crop_mesh_overlay.div.resize_top_edge_hold_shift_for_fine_tuning.title", "Resize Top Edge (Hold Shift for fine-tuning)")}
                    />
                    <div
                      onPointerDown={(e) => handleFreestylePointerDown(e, sq.id, "s")}
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-emerald-400 border border-slate-950 rounded-xs cursor-ns-resize pointer-events-auto shadow-sm"
                      title={uiText("components_crop_mesh_overlay.div.resize_bottom_edge_hold_shift_for_fine_tunin.title", "Resize Bottom Edge (Hold Shift for fine-tuning)")}
                    />
                    <div
                      onPointerDown={(e) => handleFreestylePointerDown(e, sq.id, "w")}
                      className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-4 bg-emerald-400 border border-slate-950 rounded-xs cursor-ew-resize pointer-events-auto shadow-sm"
                      title={uiText("components_crop_mesh_overlay.div.resize_left_edge_hold_shift_for_fine_tuning.title", "Resize Left Edge (Hold Shift for fine-tuning)")}
                    />
                    <div
                      onPointerDown={(e) => handleFreestylePointerDown(e, sq.id, "e")}
                      className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-4 bg-emerald-400 border border-slate-950 rounded-xs cursor-ew-resize pointer-events-auto shadow-sm"
                      title={uiText("components_crop_mesh_overlay.div.resize_right_edge_hold_shift_for_fine_tuning.title", "Resize Right Edge (Hold Shift for fine-tuning)")}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= UNIFORM GRID OVERLAY ================= */
        <>
          {/* Top Quick Dock for Uniform Grid (Shortcuts & Reset Spacing) */}
          <div
            className="absolute top-2 right-2 flex items-center gap-1.5 bg-slate-950/95 border border-slate-800 rounded-xl px-2.5 py-1.5 pointer-events-auto z-[60] shadow-xl backdrop-blur-md select-none"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {hasCustomDividers && (
              <CustomizableButton
                buttonId="crop_mesh_overlay_btn_6"
                defaultIcon={<RotateCcw className="w-3 h-3 text-cyan-400" />}
                type="button"
onClick={handleResetDividers}
className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 border border-slate-700 cursor-pointer transition-colors shadow-sm"
title={uiText("components_crop_mesh_overlay.button.reset_grid_lines_to_uniform_spacing.title", "Reset grid lines to uniform spacing")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_crop_mesh_overlay.span.reset_spacing", "Reset Spacing")}</span>
                      </>
                    )}
              </CustomizableButton>
            )}

            <span className="text-[9.5px] font-mono text-slate-400 hidden xl:inline">
              <span className="text-amber-400 font-bold">{uiText("components_crop_mesh_overlay.span.spacebar_click", "Spacebar + Click")}</span>{uiText("components_crop_mesh_overlay.span.select_deselect", " Select / Deselect • ")}<span className="text-emerald-400 font-bold">{uiText("components_crop_mesh_overlay.span.shift_drag", "Shift+Drag")}</span>{uiText("components_crop_mesh_overlay.span.fine_tune", " Fine-Tune")}
            </span>
          </div>

          {/* Floating Action Bar when Uniform Squares are Selected */}
          {selectedUniformIndices.length > 0 && (
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-950/98 border border-amber-500/80 rounded-xl px-3 py-1.5 pointer-events-auto z-[60] shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150 ring-2 ring-amber-400/30"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-300 pr-2 border-r border-amber-500/40">
                <CheckSquare className="w-4 h-4 text-amber-400" />
                <span>{selectedUniformIndices.length} / {meshPixelInfo.totalSquares}{uiText("components_crop_mesh_overlay.span.squares_selected", " Squares Selected")}</span>
              </div>

              {/* Send Selected Uniform Squares to Carved Slices (Icon Only) */}
              <CustomizableButton
                buttonId="crop_mesh_overlay_btn_5"
                defaultIcon={<Send className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />}
                type="button"
onClick={handleCutSelectedUniform}
className="p-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-lg cursor-pointer transition-all shadow-md active:scale-95 flex items-center justify-center"
title={`Send ${selectedUniformIndices.length} selected squares to Carved Slices in Storyboard`}
              />

              {/* Cut Selected Squares */}
              <CustomizableButton
                buttonId="crop_mesh_overlay_btn_4"
                defaultIcon={<Scissors className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />}
                type="button"
onClick={handleCutSelectedUniform}
className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-lg text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
title={uiText("components_crop_mesh_overlay.button.cut_and_export_only_the_selected_uniform_squ.title", "Cut and export only the selected uniform squares")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_crop_mesh_overlay.span.cut_selected", "Cut Selected (")}{selectedUniformIndices.length})</span>
                      </>
                    )}
              </CustomizableButton>

              {/* Convert to Freestyle */}
              <CustomizableButton
                buttonId="crop_mesh_overlay_btn_3"
                defaultIcon={<Maximize2 className="w-3 h-3 text-cyan-400" />}
                type="button"
onClick={handleConvertUniformToFreestyle}
className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 rounded-lg text-[10.5px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-cyan-500/40 shadow-sm"
title={uiText("components_crop_mesh_overlay.button.convert_selected_squares_into_movable_resiza.title", "Convert selected squares into movable, resizable freestyle squares")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_crop_mesh_overlay.span.convert_to_freestyle", "Convert to Freestyle")}</span>
                      </>
                    )}
              </CustomizableButton>

              {/* Select All */}
              <CustomizableButton
                buttonId="crop_mesh_overlay_btn_2"
                type="button"
onClick={() => {
                  if (selectedUniformIndices.length === meshPixelInfo.totalSquares) {
                    setSelectedUniformIndices([]);
                  } else {
                    setSelectedUniformIndices(Array.from({ length: meshPixelInfo.totalSquares }, (_, i) => i));
                  }
                }}
className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
title={uiText("components_crop_mesh_overlay.button.select_all_squares_in_the_grid.title", "Select all squares in the grid")}
              >
                  {() => (
                      <>
                        {selectedUniformIndices.length === meshPixelInfo.totalSquares ? "Deselect All" : "Select All"}
                      </>
                    )}
              </CustomizableButton>

              {/* Clear Selection */}
              <CustomizableButton
                buttonId="crop_mesh_overlay_btn_1"
                defaultIcon={<X className="w-4 h-4" />}
                type="button"
onClick={() => setSelectedUniformIndices([])}
className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer transition-colors"
title={uiText("components_crop_mesh_overlay.button.clear_selection_esc.title", "Clear selection (Esc)")}
              />
            </div>
          )}

          {/* Main Uniform Grid Container with smooth 1:1 bounds sizing */}
          <div
            ref={containerRef}
            onDoubleClick={handleDoubleClick}
            className={cn(
              "absolute z-50 select-none transition-shadow overflow-visible",
              isFlashCutting && "ring-4 ring-emerald-400 bg-emerald-400/20",
              selectedUniformIndices.length > 0 && "ring-1 ring-amber-400/40"
            )}
            style={{
              left: `${meshBounds.x}%`,
              top: `${meshBounds.y}%`,
              width: `${meshBounds.width}%`,
              height: `${meshBounds.height}%`,
              borderWidth: `${activeLineWidth}px`,
              borderStyle: "solid",
              borderColor: selectedUniformIndices.length > 0 ? "#f59e0b" : activeColorHex,
            }}
          >
            {/* Interactive Grid Cells & Multi-Square Selection Layer */}
            <div className="absolute inset-0 z-10 overflow-hidden">
              {Array.from({ length: meshPixelInfo.rows }).map((_, r) => {
                const rowB = rowBounds[r] || { start: (r / meshPixelInfo.rows) * 100, size: 100 / meshPixelInfo.rows };
                return Array.from({ length: meshPixelInfo.cols }).map((__, c) => {
                  const colB = colBounds[c] || { start: (c / meshPixelInfo.cols) * 100, size: 100 / meshPixelInfo.cols };
                  const cellIdx = r * meshPixelInfo.cols + c;
                  const isSelected = selectedUniformIndices.includes(cellIdx);
                  const selectedSeq = selectedUniformIndices.indexOf(cellIdx) + 1;

                  // Actual pixel size of this cell
                  const cellPixelW = Math.round((colB.size / 100) * (meshPixelInfo.cols * meshPixelInfo.effectiveSquare));
                  const cellPixelH = Math.round((rowB.size / 100) * (meshPixelInfo.rows * meshPixelInfo.effectiveSquare));

                  return (
                    <div
                      key={`grid-cell-${cellIdx}`}
                      onClick={(e) => handleUniformSquareClick(e, cellIdx)}
                      className={cn(
                        "absolute transition-all cursor-pointer pointer-events-auto group border flex items-center justify-center",
                        isSelected
                          ? "bg-amber-500/40 border-amber-300 ring-2 ring-amber-400/80 shadow-[inset_0_0_16px_rgba(245,158,11,0.5),0_0_12px_rgba(245,158,11,0.6)] z-30"
                          : "border-slate-500/30 hover:bg-emerald-500/15 hover:border-emerald-400/60 z-10"
                      )}
                      style={{
                        left: `${colB.start}%`,
                        top: `${rowB.start}%`,
                        width: `${colB.size}%`,
                        height: `${rowB.size}%`,
                        borderColor: isSelected ? "#fbbf24" : `${activeColorHex}40`,
                      }}
                      title={`Square #${cellIdx + 1} (${cellPixelW}×${cellPixelH}px) • Ctrl+Alt+Click to multi-select`}
                    >
                      {/* Selection Badge with Color Change Feedback */}
                      {isSelected ? (
                        <div className="absolute top-1 left-1 bg-amber-500 text-slate-950 font-mono font-black text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-md border border-amber-300 animate-in zoom-in-95 duration-100 select-none">
                          <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                          <span>#{selectedSeq}</span>
                          <span className="text-[8px] opacity-90">{cellPixelW}×{cellPixelH}{uiText("components_crop_mesh_overlay.span.px_2", "px")}</span>
                        </div>
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/80 text-emerald-300 font-mono font-bold text-[8.5px] px-1 py-0.5 rounded border border-emerald-500/40 pointer-events-none select-none">
                          #{cellIdx + 1}
                        </div>
                      )}
                    </div>
                  );
                });
              })}
            </div>

            {/* Draggable Vertical Column Divider Lines (When Manual Adjust is ON) */}
            {isAdjustingLines && customColDividers.map((divPos, idx) => {
              const isDraggingThis = activeDividerDrag?.type === "col" && activeDividerDrag.index === idx;
              return (
                <div
                  key={`col-divider-${idx}`}
                  onPointerDown={(e) => handleDividerPointerDown(e, "col", idx)}
                  className="absolute top-0 bottom-0 z-40 group cursor-col-resize pointer-events-auto flex items-center justify-center -translate-x-1/2"
                  style={{
                    left: `${divPos}%`,
                    width: "14px",
                  }}
                  title={`Drag to adjust column ${idx + 1} divider line`}
                >
                  {/* Vertical Line Visual */}
                  <div
                    className={cn(
                      "w-[3px] h-full transition-colors shadow-sm",
                      isDraggingThis
                        ? "bg-amber-400 shadow-[0_0_10px_#f59e0b]"
                        : "bg-amber-500/80 group-hover:bg-amber-300 group-hover:w-[4px]"
                    )}
                  />
                  {/* Grip Handle & Live Position Tooltip */}
                  <div
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-4 h-6 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg border border-amber-300 transition-transform select-none",
                      isDraggingThis ? "scale-125 bg-amber-300" : "opacity-80 group-hover:opacity-100 group-hover:scale-110"
                    )}
                  >
                    <GripVertical className="w-3 h-3 text-slate-950 stroke-[2.5]" />
                  </div>
                </div>
              );
            })}

            {/* Draggable Horizontal Row Divider Lines (When Manual Adjust is ON) */}
            {isAdjustingLines && customRowDividers.map((divPos, idx) => {
              const isDraggingThis = activeDividerDrag?.type === "row" && activeDividerDrag.index === idx;
              return (
                <div
                  key={`row-divider-${idx}`}
                  onPointerDown={(e) => handleDividerPointerDown(e, "row", idx)}
                  className="absolute left-0 right-0 z-40 group cursor-row-resize pointer-events-auto flex items-center justify-center -translate-y-1/2"
                  style={{
                    top: `${divPos}%`,
                    height: "14px",
                  }}
                  title={`Drag to adjust row ${idx + 1} divider line`}
                >
                  {/* Horizontal Line Visual */}
                  <div
                    className={cn(
                      "h-[3px] w-full transition-colors shadow-sm",
                      isDraggingThis
                        ? "bg-amber-400 shadow-[0_0_10px_#f59e0b]"
                        : "bg-amber-500/80 group-hover:bg-amber-300 group-hover:h-[4px]"
                    )}
                  />
                  {/* Grip Handle & Live Position Tooltip */}
                  <div
                    className={cn(
                      "absolute left-1/2 -translate-x-1/2 h-4 w-6 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg border border-amber-300 transition-transform select-none",
                      isDraggingThis ? "scale-125 bg-amber-300" : "opacity-80 group-hover:opacity-100 group-hover:scale-110"
                    )}
                  >
                    <GripHorizontal className="w-3 h-3 text-slate-950 stroke-[2.5]" />
                  </div>
                </div>
              );
            })}

            {/* Center Grid Drag Handle & Info Pill */}
            {!isAdjustingLines && selectedUniformIndices.length === 0 && (
              <div
                onPointerDown={(e) => handlePointerDown(e, "move")}
                className="absolute inset-0 cursor-move pointer-events-none flex items-center justify-center"
              >
                <div
                  onPointerDown={(e) => handlePointerDown(e, "move")}
                  className="bg-slate-950/85 text-emerald-300 text-[10.5px] font-mono font-bold px-2.5 py-1 rounded-xl border border-emerald-500/50 pointer-events-auto shadow-lg flex items-center gap-1.5 backdrop-blur-sm hover:scale-105 transition-transform"
                  title={uiText("components_crop_mesh_overlay.div.drag_to_move_entire_grid_position.title", "Drag to move entire grid position")}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {meshPixelInfo.cols}{uiText("components_crop_mesh_overlay.span.c", "c × ")}{meshPixelInfo.rows}{uiText("components_crop_mesh_overlay.span.r", "r (")}{meshPixelInfo.totalSquares}{uiText("components_crop_mesh_overlay.span.tiles", " tiles @ ")}{meshPixelInfo.effectiveSquare}{uiText("components_crop_mesh_overlay.span.px_3", "px)")}
                  </span>
                </div>
              </div>
            )}

            {/* 4 Corner Drag Handles */}
            <div
              onPointerDown={(e) => handlePointerDown(e, "nw")}
              className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-emerald-600 rounded-xs cursor-nwse-resize pointer-events-auto shadow-md z-40"
              title={uiText("components_crop_mesh_overlay.div.resize_top_left.title", "Resize Top-Left")}
            />
            <div
              onPointerDown={(e) => handlePointerDown(e, "ne")}
              className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-emerald-600 rounded-xs cursor-nesw-resize pointer-events-auto shadow-md z-40"
              title={uiText("components_crop_mesh_overlay.div.resize_top_right.title", "Resize Top-Right")}
            />
            <div
              onPointerDown={(e) => handlePointerDown(e, "se")}
              className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-emerald-600 rounded-xs cursor-nwse-resize pointer-events-auto shadow-md z-40"
              title={uiText("components_crop_mesh_overlay.div.resize_bottom_right.title", "Resize Bottom-Right")}
            />
            <div
              onPointerDown={(e) => handlePointerDown(e, "sw")}
              className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-emerald-600 rounded-xs cursor-nesw-resize pointer-events-auto shadow-md z-40"
              title={uiText("components_crop_mesh_overlay.div.resize_bottom_left.title", "Resize Bottom-Left")}
            />

            {/* 4 Edge Midpoint Drag Handles */}
            <div
              onPointerDown={(e) => handlePointerDown(e, "n")}
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-emerald-400 border border-slate-950 rounded-xs cursor-ns-resize pointer-events-auto shadow-sm z-40"
              title={uiText("components_crop_mesh_overlay.div.resize_top_edge.title", "Resize Top Edge")}
            />
            <div
              onPointerDown={(e) => handlePointerDown(e, "s")}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-emerald-400 border border-slate-950 rounded-xs cursor-ns-resize pointer-events-auto shadow-sm z-40"
              title={uiText("components_crop_mesh_overlay.div.resize_bottom_edge.title", "Resize Bottom Edge")}
            />
            <div
              onPointerDown={(e) => handlePointerDown(e, "w")}
              className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-6 bg-emerald-400 border border-slate-950 rounded-xs cursor-ew-resize pointer-events-auto shadow-sm z-40"
              title={uiText("components_crop_mesh_overlay.div.resize_left_edge.title", "Resize Left Edge")}
            />
            <div
              onPointerDown={(e) => handlePointerDown(e, "e")}
              className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-6 bg-emerald-400 border border-slate-950 rounded-xs cursor-ew-resize pointer-events-auto shadow-sm z-40"
              title={uiText("components_crop_mesh_overlay.div.resize_right_edge.title", "Resize Right Edge")}
            />
          </div>
        </>
      )}
    </div>
  );
};
