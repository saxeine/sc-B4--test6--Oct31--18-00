import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  X,
  Plus,
  Trash2,
  Check,
  Scissors,
  Layers,
  Copy,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Download,
  Grid,
  RefreshCw,
  Eye,
  Sliders,
  SlidersHorizontal,
  Move,
  LayoutGrid,
  FileArchive,
  MousePointer,
  CheckSquare,
  Square,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ArrowRight,
  Split,
  FolderPlus,
  ExternalLink,
  Combine,
  Link2,
  Triangle,
  Spline,
  PenTool,
  Send,
  HelpCircle,
  FolderDown,
  FileText,
  RotateCcw,
} from "lucide-react";
import { cn } from "../utils/cn";
import {
  CropMeshOverlay,
  type MeshBounds,
  type FreestyleSquare,
  type FreestylePoint,
  MESH_COLOR_PRESETS,
  MESH_LINE_WIDTHS,
  TRAPEZE_PRESETS,
} from "./CropMeshOverlay";
import { FreestyleSlicePreview } from "./FreestyleSlicePreview";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export interface GridMeshStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  slicePrefix?: string;
  format?: string;
  onCutMeshIntoStoryboard: (slices: { name: string; url: string }[], destination: "storyboard-slices" | "storyboard-slots" | "multi-crops") => void;
  onAddMultiCrops?: (crops: { id: string; crop: { x: number; y: number; width: number; height: number; unit: "%" }; isCircular: boolean }[]) => void;
}

export const GridMeshStudioModal: React.FC<GridMeshStudioModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  slicePrefix = "Mesh",
  format = "image/png",
  onCutMeshIntoStoryboard,
  onAddMultiCrops,
}) => {
  const [meshMode, setMeshMode] = useState<"uniform" | "freestyle">("uniform");

  // Uniform grid settings
  const [meshBounds, setMeshBounds] = useState<MeshBounds>({
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });
  const [meshSquareSize, setMeshSquareSize] = useState<number>(64);
  const [meshGridLineWidth, setMeshGridLineWidth] = useState<number>(2);
  const [meshGridLineColor, setMeshGridLineColor] = useState<string>("#10b981");
  const [isAdjustingGridLines, setIsAdjustingGridLines] = useState<boolean>(false);

  // Freestyle / Slicer settings
  const [freestyleSquares, setFreestyleSquares] = useState<FreestyleSquare[]>([]);
  const [selectedFreestyleSquareIds, setSelectedFreestyleSquareIds] = useState<string[]>([]);
  const [freestyleTool, setFreestyleTool] = useState<"select" | "rect" | "angled" | "trapeze">("select");
  const [activeTrapezePreset, setActiveTrapezePreset] = useState<string>("isosceles");
  const [activePolygonPoints, setActivePolygonPoints] = useState<FreestylePoint[]>([]);
  const [isTrapezeMenuOpen, setIsTrapezeMenuOpen] = useState<boolean>(false);

  // Right panel tab: "gallery" (all live previews) vs "inspector" (focused active slice)
  const [rightPanelTab, setRightPanelTab] = useState<"gallery" | "inspector">("gallery");

  // Canvas Viewport & Zoom
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isPanActive, setIsPanActive] = useState<boolean>(false);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number; startOffsetX: number; startOffsetY: number }>({
    x: 0,
    y: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  // Cutting & Destination options
  const [meshDestination, setMeshDestination] = useState<"storyboard-slices" | "storyboard-slots" | "multi-crops">("storyboard-slices");
  const [autoCloseAfterCut, setAutoCloseAfterCut] = useState<boolean>(false);
  const [isCutting, setIsCutting] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // DOM and Image Refs
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const livePreviewContainerRef = useRef<HTMLDivElement>(null);

  // Natural image dimensions
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  // Primary selected square ID
  const selectedFreestyleSquareId = selectedFreestyleSquareIds[selectedFreestyleSquareIds.length - 1] || null;
  const selectedSquare = useMemo(() => {
    return freestyleSquares.find((s) => s.id === selectedFreestyleSquareId) || null;
  }, [freestyleSquares, selectedFreestyleSquareId]);

  const selectedSquareIdx = useMemo(() => {
    if (!selectedSquare) return -1;
    return freestyleSquares.findIndex((s) => s.id === selectedSquare.id);
  }, [freestyleSquares, selectedSquare]);

  // Update natural dimensions when image loads
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setNaturalDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    }
  };

  // Helper to initialize 1 default freestyle square on first activation
  const initializeDefaultFreestyleSquare = useCallback(() => {
    const naturalW = naturalDimensions.width;
    const naturalH = naturalDimensions.height;

    const sqWidth = 28;
    const sqHeight = 32;
    const startX = 36;
    const topY = 34;

    const defaultSquare: FreestyleSquare = {
      id: `fs_1_${Math.random().toString(36).substring(2, 6)}`,
      x: startX,
      y: topY,
      width: sqWidth,
      height: sqHeight,
      label: "Square 1",
    };

    setFreestyleSquares([defaultSquare]);
    setSelectedFreestyleSquareIds([defaultSquare.id]);
    setMeshMode("freestyle");
  }, [naturalDimensions]);

  // Initialize from full uniform grid
  const initializeFreestyleFromGrid = useCallback(() => {
    const naturalW = naturalDimensions.width;
    const naturalH = naturalDimensions.height;
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
  }, [naturalDimensions, meshBounds, meshSquareSize]);

  // Ensure default square when modal opens
  useEffect(() => {
    if (isOpen && freestyleSquares.length === 0) {
      initializeDefaultFreestyleSquare();
    }
  }, [isOpen, freestyleSquares.length, initializeDefaultFreestyleSquare]);

  // Compute live uniform grid cells for previews
  const uniformGridCells = useMemo(() => {
    if (meshMode !== "uniform") return [];
    const naturalW = naturalDimensions.width;
    const naturalH = naturalDimensions.height;
    const pxX = Math.round((meshBounds.x / 100) * naturalW);
    const pxY = Math.round((meshBounds.y / 100) * naturalH);
    const pxW = Math.max(1, Math.round((meshBounds.width / 100) * naturalW));
    const pxH = Math.max(1, Math.round((meshBounds.height / 100) * naturalH));

    const effectiveSquare = Math.max(8, meshSquareSize);
    const cols = Math.max(1, Math.floor(pxW / effectiveSquare));
    const rows = Math.max(1, Math.floor(pxH / effectiveSquare));

    const cells: { id: string; row: number; col: number; x: number; y: number; width: number; height: number; pxW: number; pxH: number; label: string }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellX = pxX + c * effectiveSquare;
        const cellY = pxY + r * effectiveSquare;
        cells.push({
          id: `cell_${r}_${c}`,
          row: r + 1,
          col: c + 1,
          x: (cellX / naturalW) * 100,
          y: (cellY / naturalH) * 100,
          width: (effectiveSquare / naturalW) * 100,
          height: (effectiveSquare / naturalH) * 100,
          pxW: effectiveSquare,
          pxH: effectiveSquare,
          label: `R${r + 1}:C${c + 1}`,
        });
      }
    }
    return cells;
  }, [meshMode, naturalDimensions, meshBounds, meshSquareSize]);

  // Add freestyle square
  const handleAddFreestyleSquare = useCallback(() => {
    const naturalW = naturalDimensions.width;
    const naturalH = naturalDimensions.height;
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
    setRightPanelTab("inspector");
  }, [naturalDimensions, meshSquareSize, freestyleSquares.length]);

  // Insert Trapeze Preset
  const handleInsertTrapezePreset = useCallback(
    (presetId: string) => {
      const preset = TRAPEZE_PRESETS.find((p) => p.id === presetId) || TRAPEZE_PRESETS[0];
      const naturalW = naturalDimensions.width;
      const naturalH = naturalDimensions.height;
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
      setRightPanelTab("inspector");
      setIsTrapezeMenuOpen(false);
    },
    [naturalDimensions, meshSquareSize, freestyleSquares.length]
  );

  // Close Angled Polygon slice from panel
  const handleClosePolygonSlice = useCallback(() => {
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
      label: `Angled Polygon ${freestyleSquares.length + 1}`,
      shapeType: "polygon",
      points: [...activePolygonPoints],
    };

    setFreestyleSquares((prev) => [...prev, newSq]);
    setSelectedFreestyleSquareIds([newSq.id]);
    setActivePolygonPoints([]);
    setFreestyleTool("select");
    setRightPanelTab("inspector");
  }, [activePolygonPoints, freestyleSquares.length]);

  // Duplicate single square
  const handleDuplicateSquare = useCallback(
    (squareId: string) => {
      const target = freestyleSquares.find((s) => s.id === squareId);
      if (!target) return;

      const newSq: FreestyleSquare = {
        ...target,
        id: `fs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        x: target.x + 3,
        y: target.y + 3,
        points: target.points
          ? target.points.map((pt) => ({
              x: Math.round((pt.x + 3) * 100) / 100,
              y: Math.round((pt.y + 3) * 100) / 100,
            }))
          : undefined,
        label: `${target.label || "Square"} (Copy)`,
      };

      setFreestyleSquares((prev) => [...prev, newSq]);
      setSelectedFreestyleSquareIds([newSq.id]);
    },
    [freestyleSquares]
  );

  // Duplicate multiple squares
  const handleDuplicateSelectedSquares = useCallback(() => {
    if (selectedFreestyleSquareIds.length === 0) return;
    const targetSquares = freestyleSquares.filter((s) => selectedFreestyleSquareIds.includes(s.id));
    if (targetSquares.length === 0) return;

    const newSquares: FreestyleSquare[] = targetSquares.map((target, idx) => ({
      ...target,
      id: `fs_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      x: target.x + 3,
      y: target.y + 3,
      points: target.points
        ? target.points.map((pt) => ({
            x: Math.round((pt.x + 3) * 100) / 100,
            y: Math.round((pt.y + 3) * 100) / 100,
          }))
        : undefined,
      label: `${target.label || "Square"} (Copy)`,
    }));

    setFreestyleSquares((prev) => [...prev, ...newSquares]);
    setSelectedFreestyleSquareIds(newSquares.map((s) => s.id));
  }, [freestyleSquares, selectedFreestyleSquareIds]);

  // Delete square
  const handleDeleteSquare = useCallback((squareId: string) => {
    setFreestyleSquares((prev) => prev.filter((s) => s.id !== squareId));
    setSelectedFreestyleSquareIds((prev) => prev.filter((id) => id !== squareId));
  }, []);

  // Delete multiple squares
  const handleDeleteSelectedSquares = useCallback(() => {
    if (selectedFreestyleSquareIds.length === 0) return;
    setFreestyleSquares((prev) => prev.filter((s) => !selectedFreestyleSquareIds.includes(s.id)));
    setSelectedFreestyleSquareIds([]);
  }, [selectedFreestyleSquareIds]);

  // Merge selected squares into one bounding box
  const handleMergeSelectedSquares = useCallback(() => {
    if (selectedFreestyleSquareIds.length < 2) return;
    const targetSquares = freestyleSquares.filter((s) => selectedFreestyleSquareIds.includes(s.id));
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

    const selectedSet = new Set(selectedFreestyleSquareIds);
    const remaining = freestyleSquares.filter((s) => !selectedSet.has(s.id));
    setFreestyleSquares([...remaining, mergedSquare]);
    setSelectedFreestyleSquareIds([mergedSquare.id]);
  }, [freestyleSquares, selectedFreestyleSquareIds]);

  // Scale all squares (+/- factor)
  const handleScaleAllSquares = useCallback((factor: number) => {
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

  // Resize single square in px
  const handleSetSquareDimensionsPx = useCallback(
    (squareId: string, widthPx?: number, heightPx?: number) => {
      const naturalW = naturalDimensions.width;
      const naturalH = naturalDimensions.height;

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
    },
    [naturalDimensions]
  );

  // Resize delta in px (+ / - delta)
  const handleResizeFreestyleSquareDelta = useCallback(
    (squareId: string, deltaPx: number) => {
      const naturalW = naturalDimensions.width;
      const naturalH = naturalDimensions.height;
      setFreestyleSquares((prev) =>
        prev.map((s) => {
          if (s.id !== squareId) return s;
          const curW = (s.width / 100) * naturalW;
          const curH = (s.height / 100) * naturalH;
          const nextWPx = Math.max(8, curW + deltaPx);
          const nextHPx = Math.max(8, curH + deltaPx);
          const nextW = (nextWPx / naturalW) * 100;
          const nextH = (nextHPx / naturalH) * 100;

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
    },
    [naturalDimensions]
  );

  // Keyboard Shortcuts inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA";
      if (isInput) return;

      if (e.key === "Escape") {
        if (activePolygonPoints.length > 0) {
          setActivePolygonPoints([]);
          setFreestyleTool("select");
        } else {
          onClose();
        }
      } else if (e.key === "Enter" && freestyleTool === "angled" && activePolygonPoints.length >= 3) {
        e.preventDefault();
        handleClosePolygonSlice();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (selectedFreestyleSquareIds.length > 0) {
          handleDuplicateSelectedSquares();
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (freestyleTool === "angled" && activePolygonPoints.length > 0) {
          e.preventDefault();
          setActivePolygonPoints((prev) => prev.slice(0, -1));
        } else if (selectedFreestyleSquareIds.length > 0) {
          e.preventDefault();
          handleDeleteSelectedSquares();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    freestyleTool,
    activePolygonPoints,
    selectedFreestyleSquareIds,
    handleClosePolygonSlice,
    handleDuplicateSelectedSquares,
    handleDeleteSelectedSquares,
    onClose,
  ]);

  // Execute Cut: Cuts all squares or specified squares into slices and dispatches them
  const executeCut = async (squaresToCut?: FreestyleSquare[]) => {
    if (!imageSrc) {
      alert("Please load an image first.");
      return;
    }

    setIsCutting(true);
    setStatusNotice("Generating precision slices...");

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
          image.crossOrigin = "anonymous";
        }
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Failed to load source image for mesh cutting"));
        image.src = imageSrc;
      });

      const naturalW = img.naturalWidth || naturalDimensions.width || 800;
      const naturalH = img.naturalHeight || naturalDimensions.height || 600;
      const prefix = slicePrefix.trim() || "Mesh";
      const generatedSlices: { name: string; url: string }[] = [];

      const activeFreestyle =
        squaresToCut || (meshMode === "freestyle" ? freestyleSquares : undefined);

      if (activeFreestyle && activeFreestyle.length > 0) {
        // Cut custom freestyle square regions
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

          if (sq.points && sq.points.length > 2) {
            ctx.save();
            ctx.beginPath();
            sq.points.forEach((p, pIdx) => {
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
          const shapePrefix =
            sq.shapeType === "polygon"
              ? "angled"
              : sq.shapeType === "trapezoid"
              ? "trapeze"
              : "freestyle";
          const sliceName = `${prefix}_${shapePrefix}_${String(i + 1).padStart(2, "0")}`;
          generatedSlices.push({ name: sliceName, url: dataUrl });
        }
      } else {
        // Uniform grid mesh cutting
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
          setIsCutting(false);
          setStatusNotice(null);
          return;
        }

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cellX = pxX + c * effectiveSquare;
            const cellY = pxY + r * effectiveSquare;

            const canvas = document.createElement("canvas");
            canvas.width = effectiveSquare;
            canvas.height = effectiveSquare;
            const ctx = canvas.getContext("2d");
            if (!ctx) continue;

            const srcX = Math.max(0, cellX);
            const srcY = Math.max(0, cellY);
            const srcRight = Math.min(naturalW, cellX + effectiveSquare);
            const srcBottom = Math.min(naturalH, cellY + effectiveSquare);
            const srcW = srcRight - srcX;
            const srcH = srcBottom - srcY;

            if (srcW > 0 && srcH > 0) {
              const dstX = srcX - cellX;
              const dstY = srcY - cellY;
              ctx.drawImage(img, srcX, srcY, srcW, srcH, dstX, dstY, srcW, srcH);
            }

            const dataUrl = canvas.toDataURL(format);
            const sliceName = `${prefix}_r${String(r + 1).padStart(2, "0")}_c${String(c + 1).padStart(2, "0")}`;
            generatedSlices.push({ name: sliceName, url: dataUrl });
          }
        }
      }

      if (generatedSlices.length === 0) {
        alert("No valid slices could be cut from the current mesh area.");
        setIsCutting(false);
        setStatusNotice(null);
        return;
      }

      // Dispatch to target destination
      if (meshDestination === "multi-crops" && onAddMultiCrops) {
        const cropsToAdd = (activeFreestyle || []).map((sq, idx) => ({
          id: `mc_${Date.now()}_${idx}`,
          crop: {
            x: sq.x,
            y: sq.y,
            width: sq.width,
            height: sq.height,
            unit: "%" as const,
          },
          isCircular: false,
        }));
        onAddMultiCrops(cropsToAdd);
      } else {
        onCutMeshIntoStoryboard(generatedSlices, meshDestination);
      }

      setStatusNotice(`✓ Successfully generated ${generatedSlices.length} carved slices!`);
      setTimeout(() => setStatusNotice(null), 3000);

      if (autoCloseAfterCut) {
        onClose();
      }
    } catch (err) {
      console.error("Failed to cut mesh into squares:", err);
      alert("An error occurred while cutting the mesh into squares.");
    } finally {
      setIsCutting(false);
    }
  };

  // Direct Download All Slices as ZIP archive
  const handleDownloadZip = async () => {
    if (!imageSrc) return;
    setIsCutting(true);
    setStatusNotice("Packaging slices into ZIP...");

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
          image.crossOrigin = "anonymous";
        }
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Failed to load image"));
        image.src = imageSrc;
      });

      const naturalW = img.naturalWidth || naturalDimensions.width || 800;
      const naturalH = img.naturalHeight || naturalDimensions.height || 600;
      const prefix = slicePrefix.trim() || "Mesh";
      const zip = new JSZip();

      if (meshMode === "freestyle" && freestyleSquares.length > 0) {
        for (let i = 0; i < freestyleSquares.length; i++) {
          const sq = freestyleSquares[i];
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

          if (sq.points && sq.points.length > 2) {
            ctx.save();
            ctx.beginPath();
            sq.points.forEach((p, pIdx) => {
              const ptPxX = (p.x / 100) * naturalW - pxX;
              const ptPxY = (p.y / 100) * naturalH - pxY;
              if (pIdx === 0) ctx.moveTo(ptPxX, ptPxY);
              else ctx.lineTo(ptPxX, ptPxY);
            });
            ctx.closePath();
            ctx.clip();
          }

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

          const dataUrl = canvas.toDataURL("image/png");
          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
          const shapePrefix =
            sq.shapeType === "polygon"
              ? "angled"
              : sq.shapeType === "trapezoid"
              ? "trapeze"
              : "freestyle";
          zip.file(`${prefix}_${shapePrefix}_${String(i + 1).padStart(2, "0")}.png`, base64Data, {
            base64: true,
          });
        }
      } else {
        const pxX = Math.round((meshBounds.x / 100) * naturalW);
        const pxY = Math.round((meshBounds.y / 100) * naturalH);
        const pxW = Math.max(1, Math.round((meshBounds.width / 100) * naturalW));
        const pxH = Math.max(1, Math.round((meshBounds.height / 100) * naturalH));
        const effectiveSquare = Math.max(8, meshSquareSize);
        const cols = Math.max(1, Math.floor(pxW / effectiveSquare));
        const rows = Math.max(1, Math.floor(pxH / effectiveSquare));

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cellX = pxX + c * effectiveSquare;
            const cellY = pxY + r * effectiveSquare;

            const canvas = document.createElement("canvas");
            canvas.width = effectiveSquare;
            canvas.height = effectiveSquare;
            const ctx = canvas.getContext("2d");
            if (!ctx) continue;

            const srcX = Math.max(0, cellX);
            const srcY = Math.max(0, cellY);
            const srcRight = Math.min(naturalW, cellX + effectiveSquare);
            const srcBottom = Math.min(naturalH, cellY + effectiveSquare);
            const srcW = srcRight - srcX;
            const srcH = srcBottom - srcY;

            if (srcW > 0 && srcH > 0) {
              const dstX = srcX - cellX;
              const dstY = srcY - cellY;
              ctx.drawImage(img, srcX, srcY, srcW, srcH, dstX, dstY, srcW, srcH);
            }

            const dataUrl = canvas.toDataURL("image/png");
            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
            zip.file(
              `${prefix}_r${String(r + 1).padStart(2, "0")}_c${String(c + 1).padStart(2, "0")}.png`,
              base64Data,
              { base64: true }
            );
          }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${prefix}_grid_mesh_slices.zip`);
      setStatusNotice("✓ ZIP download started!");
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (err) {
      console.error("Failed to download ZIP:", err);
      alert("Failed to export ZIP archive.");
    } finally {
      setIsCutting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Main Navigation / Header */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left Branding & Mode Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <Grid className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CustomizableLabel
                labelId="grid_mesh_studio_modal_item_42"
                as="h1"
                className="font-bold text-sm text-slate-100 tracking-tight flex items-center gap-1.5"
              >
                  {() => (
                      <>
                        <span>{uiText("components_grid_mesh_studio_modal.span.grid_mesh_studio", "Grid Mesh Studio")}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {uiText("components_grid_mesh_studio_modal.span.full_screen_live", "Full-Screen Live")}
                </span>
                      </>
                    )}
              </CustomizableLabel>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
              <span>{naturalDimensions.width} × {naturalDimensions.height}{uiText("components_grid_mesh_studio_modal.span.px", " px")}</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">
                {meshMode === "freestyle"
                  ? `${freestyleSquares.length} Freestyle / Slicer Cuts`
                  : `${uniformGridCells.length} Grid Tiles`}
              </span>
            </div>
          </div>
        </div>

        {/* Center Primary Mode Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
          <CustomizableButton
            buttonId="grid_mesh_studio_modal_btn_41"
            defaultIcon={<Grid className="w-3.5 h-3.5" />}
            type="button"
onClick={() => setMeshMode("uniform")}
className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
              meshMode === "uniform"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            )}
          >
              {() => (
                  <>
                    <span>{uiText("components_grid_mesh_studio_modal.span.uniform_grid_mesh", "Uniform Grid Mesh")}</span>
                  </>
                )}
          </CustomizableButton>
          <CustomizableButton
            buttonId="grid_mesh_studio_modal_btn_40"
            defaultIcon={<Layers className="w-3.5 h-3.5" />}
            type="button"
onClick={() => {
              if (freestyleSquares.length === 0) {
                initializeDefaultFreestyleSquare();
              } else {
                setMeshMode("freestyle");
              }
            }}
className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
              meshMode === "freestyle"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-900/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            )}
          >
              {() => (
                  <>
                    <span>{uiText("components_grid_mesh_studio_modal.span.freestyle_and_angled_slicer", "Freestyle & Angled Slicer")}</span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded-full border border-cyan-800 font-mono">
              {freestyleSquares.length}
            </span>
                  </>
                )}
          </CustomizableButton>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Notice Banner */}
          {statusNotice && (
            <div className="text-[11px] font-medium text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-3 py-1 rounded-lg flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{statusNotice}</span>
            </div>
          )}

          {/* Download ZIP */}
          <CustomizableButton
            buttonId="grid_mesh_studio_modal_btn_39"
            defaultIcon={<Download className="w-3.5 h-3.5 text-amber-400" />}
            type="button"
onClick={handleDownloadZip}
disabled={isCutting}
className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all disabled:opacity-50"
title={uiText("components_grid_mesh_studio_modal.button.download_all_slices_directly_as_a_zip_archiv.title", "Download all slices directly as a ZIP archive")}
          >
              {() => (
                  <>
                    <span className="hidden sm:inline">{uiText("components_grid_mesh_studio_modal.span.download_zip", "Download ZIP")}</span>
                  </>
                )}
          </CustomizableButton>

          {/* Primary Cut & Export */}
          <CustomizableButton
            buttonId="grid_mesh_studio_modal_btn_38"
            defaultIcon={<Scissors className="w-4 h-4 stroke-[2.5]" />}
            type="button"
onClick={() => executeCut()}
disabled={isCutting}
className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
          >
              {() => (
                  <>
                    <span>
              {meshMode === "freestyle"
                ? `Cut Slices (${freestyleSquares.length})`
                : `Cut Tiles (${uniformGridCells.length})`}
            </span>
                  </>
                )}
          </CustomizableButton>

          {/* Close Modal */}
          <CustomizableButton
            buttonId="grid_mesh_studio_modal_btn_37"
            defaultIcon={<X className="w-5 h-5" />}
            type="button"
onClick={onClose}
className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-1"
title={uiText("components_grid_mesh_studio_modal.button.close_grid_mesh_studio_esc.title", "Close Grid Mesh Studio (Esc)")}
          />
        </div>
      </header>

      {/* Main Workspace (3 Columns: Left Controls, Center Canvas, Right Live Previews) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Tool & Shape Configuration */}
        <aside className="w-72 bg-slate-900/95 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-3 space-y-3">
          {meshMode === "uniform" ? (
            /* Uniform Grid Controls */
            <div className="space-y-3">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{uiText("components_grid_mesh_studio_modal.span.square_tile_size", "Square Tile Size")}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {meshSquareSize}{uiText("components_grid_mesh_studio_modal.span.px_2", " px")}
                  </span>
                </div>

                <input
                  type="range"
                  min="16"
                  max="512"
                  step="8"
                  value={meshSquareSize}
                  onChange={(e) => setMeshSquareSize(parseInt(e.target.value) || 64)}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[32, 64, 128, 256].map((size) => (
                    <CustomizableButton
                      buttonId="grid_mesh_studio_modal_btn_36"
                      key={size}
type="button"
onClick={() => setMeshSquareSize(size)}
className={cn(
                        "py-1 rounded-lg text-[10.5px] font-mono font-bold border transition-all cursor-pointer",
                        meshSquareSize === size
                          ? "bg-emerald-600/40 text-emerald-300 border-emerald-500/60 shadow-sm"
                          : "bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800"
                      )}
                    >
                        {() => (
                            <>
                              {size}
                            {uiText("components_grid_mesh_studio_modal.button.px", "px")}
                            </>
                          )}
                    </CustomizableButton>
                  ))}
                </div>
              </div>

              {/* Grid Appearance */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{uiText("components_grid_mesh_studio_modal.span.grid_appearance", "Grid Appearance")}</span>
                </span>

                {/* Line Color Presets */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-medium">{uiText("components_grid_mesh_studio_modal.span.line_color", "Line Color")}</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {MESH_COLOR_PRESETS.map((preset) => (
                      <CustomizableButton
                        buttonId="grid_mesh_studio_modal_btn_35"
                        key={preset.id}
type="button"
onClick={() => setMeshGridLineColor(preset.hex)}
className={cn(
                          "w-5 h-5 rounded-full border-2 transition-transform cursor-pointer",
                          meshGridLineColor === preset.hex
                            ? "scale-110 border-white ring-2 ring-emerald-500/50"
                            : "border-slate-800 hover:scale-105"
                        )}
style={{ backgroundColor: preset.hex }}
title={preset.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Line Width */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-400 font-medium">{uiText("components_grid_mesh_studio_modal.span.line_thickness", "Line Thickness")}</span>
                  <div className="grid grid-cols-5 gap-1">
                    {MESH_LINE_WIDTHS.map((w) => (
                      <CustomizableButton
                        buttonId="grid_mesh_studio_modal_btn_34"
                        key={w}
type="button"
onClick={() => setMeshGridLineWidth(w)}
className={cn(
                          "py-1 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer",
                          meshGridLineWidth === w
                            ? "bg-cyan-600/40 text-cyan-300 border-cyan-500/60"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                        )}
                      >
                          {() => (
                              <>
                                {w}
                              {uiText("components_grid_mesh_studio_modal.button.px_2", "px")}
                              </>
                            )}
                      </CustomizableButton>
                    ))}
                  </div>
                </div>

                {/* Adjust lines mode toggle */}
                <CustomizableButton
                  buttonId="grid_mesh_studio_modal_btn_33"
                  defaultIcon={<Move className="w-3.5 h-3.5 text-amber-400" />}
                  type="button"
onClick={() => setIsAdjustingGridLines((prev) => !prev)}
className={cn(
                    "w-full py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border mt-1",
                    isAdjustingGridLines
                      ? "bg-amber-600/30 text-amber-300 border-amber-500/60 shadow-sm"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
                  )}
                >
                    {() => (
                        <>
                          <span>{isAdjustingGridLines ? "Done Adjusting Dividers" : "Fine-Tune Dividers"}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>

              {/* Grid Quick Alignments */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{uiText("components_grid_mesh_studio_modal.span.mesh_alignment", "Mesh Alignment")}</span>
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <CustomizableButton
                    buttonId="grid_mesh_studio_modal_btn_32"
                    defaultIcon={<Maximize2 className="w-3 h-3 text-indigo-400" />}
                    type="button"
onClick={() =>
                      setMeshBounds({
                        x: 0,
                        y: 0,
                        width: 100,
                        height: 100,
                      })
                    }
className="py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_grid_mesh_studio_modal.span.fill_image", "Fill Image")}</span>
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="grid_mesh_studio_modal_btn_31"
                    defaultIcon={<AlignCenter className="w-3 h-3 text-indigo-400" />}
                    type="button"
onClick={() =>
                      setMeshBounds({
                        x: 10,
                        y: 10,
                        width: 80,
                        height: 80,
                      })
                    }
className="py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_grid_mesh_studio_modal.span.center_80", "Center 80%")}</span>
                          </>
                        )}
                  </CustomizableButton>
                </div>
                <CustomizableButton
                  buttonId="grid_mesh_studio_modal_btn_30"
                  defaultIcon={<Layers className="w-3.5 h-3.5 text-cyan-400" />}
                  type="button"
onClick={initializeFreestyleFromGrid}
className="w-full py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                    {() => (
                        <>
                          <span>{uiText("components_grid_mesh_studio_modal.span.convert_to_freestyle_slices", "Convert to Freestyle Slices")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>
          ) : (
            /* Freestyle & Angled Slicer Controls */
            <div className="space-y-3">
              {/* Slicer Tool Selection */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Spline className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{uiText("components_grid_mesh_studio_modal.span.cutting_tool", "Cutting Tool")}</span>
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <CustomizableButton
                    buttonId="grid_mesh_studio_modal_btn_29"
                    defaultIcon={<MousePointer className="w-3.5 h-3.5" />}
                    type="button"
onClick={() => setFreestyleTool("select")}
className={cn(
                      "py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer",
                      freestyleTool === "select"
                        ? "bg-cyan-600/40 text-cyan-200 border-cyan-500/60 shadow-sm"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800"
                    )}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_grid_mesh_studio_modal.span.select_drag", "Select / Drag")}</span>
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="grid_mesh_studio_modal_btn_28"
                    defaultIcon={<Square className="w-3.5 h-3.5" />}
                    type="button"
onClick={() => setFreestyleTool("rect")}
className={cn(
                      "py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer",
                      freestyleTool === "rect"
                        ? "bg-cyan-600/40 text-cyan-200 border-cyan-500/60 shadow-sm"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800"
                    )}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_grid_mesh_studio_modal.span.draw_box", "Draw Box")}</span>
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="grid_mesh_studio_modal_btn_27"
                    defaultIcon={<PenTool className="w-3.5 h-3.5" />}
                    type="button"
onClick={() => setFreestyleTool("angled")}
className={cn(
                      "py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer",
                      freestyleTool === "angled"
                        ? "bg-amber-600/40 text-amber-200 border-amber-500/60 shadow-sm"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800"
                    )}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_grid_mesh_studio_modal.span.angled_polygon", "Angled Polygon")}</span>
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="grid_mesh_studio_modal_btn_26"
                    defaultIcon={<Triangle className="w-3.5 h-3.5 rotate-180" />}
                    type="button"
onClick={() => setFreestyleTool("trapeze")}
className={cn(
                      "py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer",
                      freestyleTool === "trapeze"
                        ? "bg-teal-600/40 text-teal-200 border-teal-500/60 shadow-sm"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800"
                    )}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_grid_mesh_studio_modal.span.trapeze_slices", "Trapeze Slices")}</span>
                          </>
                        )}
                  </CustomizableButton>
                </div>

                {/* Angled Polygon Drawing In-Progress Status */}
                {freestyleTool === "angled" && (
                  <div className="bg-amber-950/40 border border-amber-600/50 rounded-lg p-2 space-y-1.5 mt-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-300 flex items-center gap-1">
                        <PenTool className="w-3 h-3 text-amber-400 animate-pulse" />
                        <span>{activePolygonPoints.length}{uiText("components_grid_mesh_studio_modal.span.points_placed", " Points Placed")}</span>
                      </span>
                      {activePolygonPoints.length >= 3 && (
                        <CustomizableButton
                          buttonId="grid_mesh_studio_modal_btn_25"
                          defaultIcon={<Check className="w-3 h-3 stroke-[3]" />}
                          type="button"
onClick={handleClosePolygonSlice}
className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded text-[10px] flex items-center gap-1 cursor-pointer shadow"
                        >
                            {() => (
                                <>
                                  <span>{uiText("components_grid_mesh_studio_modal.span.done_enter", "Done (Enter)")}</span>
                                </>
                              )}
                        </CustomizableButton>
                      )}
                    </div>
                    <p className="text-[10px] text-amber-200/80 leading-relaxed">
                      {uiText("components_grid_mesh_studio_modal.p.click_directly_on_canvas_to_place_vertices_p", "Click directly on canvas to place vertices. Press ")}<b>{uiText("components_grid_mesh_studio_modal.b.enter", "Enter")}</b>{uiText("components_grid_mesh_studio_modal.p.or_click_done_to_create_slice", " or click Done to create slice.")}
                    </p>
                  </div>
                )}

                {/* Trapeze Presets Dropdown */}
                <div className="pt-1">
                  <CustomizableButton
                    buttonId="grid_mesh_studio_modal_btn_24"
                    defaultIcon={<ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isTrapezeMenuOpen && "rotate-180")} />}
                    type="button"
onClick={() => setIsTrapezeMenuOpen((prev) => !prev)}
className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold flex items-center justify-between text-slate-300 cursor-pointer"
                  >
                      {() => (
                          <>
                            <span className="flex items-center gap-1.5">
                      <Triangle className="w-3 h-3 text-teal-400 rotate-180" />
                      <span>{uiText("components_grid_mesh_studio_modal.span.insert_trapeze_preset", "Insert Trapeze Preset")}</span>
                    </span>
                          </>
                        )}
                  </CustomizableButton>

                  {isTrapezeMenuOpen && (
                    <div className="mt-1 bg-slate-950 border border-slate-800 rounded-lg p-1.5 space-y-1 shadow-xl">
                      {TRAPEZE_PRESETS.map((preset) => (
                        <CustomizableButton
                          buttonId="grid_mesh_studio_modal_btn_23"
                          key={preset.id}
type="button"
onClick={() => handleInsertTrapezePreset(preset.id)}
className="w-full text-left p-1.5 rounded hover:bg-slate-800 flex flex-col cursor-pointer transition-colors"
                        >
                            {() => (
                                <>
                                  <span className="text-xs font-bold text-teal-300">{preset.name}</span>
                                <span className="text-[10px] text-slate-400">{preset.description}</span>
                                </>
                              )}
                        </CustomizableButton>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions & Presets */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{uiText("components_grid_mesh_studio_modal.span.add_and_scale_slices", "Add & Scale Slices")}</span>
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <CustomizableButton
                    buttonId="grid_mesh_studio_modal_btn_22"
                    defaultIcon={<Plus className="w-3 h-3 text-emerald-400" />}
                    type="button"
onClick={handleAddFreestyleSquare}
className="py-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_grid_mesh_studio_modal.span.add_box_slice", "Add Box Slice")}</span>
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="grid_mesh_studio_modal_btn_21"
                    defaultIcon={<Triangle className="w-3 h-3 text-teal-400 rotate-180" />}
                    type="button"
onClick={() => handleInsertTrapezePreset("isosceles")}
className="py-1.5 bg-teal-950/60 hover:bg-teal-900 text-teal-300 border border-teal-800/60 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_grid_mesh_studio_modal.span.add_trapeze", "Add Trapeze")}</span>
                          </>
                        )}
                  </CustomizableButton>
                </div>

                {/* Scale All Slices */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span>{uiText("components_grid_mesh_studio_modal.span.scale_all_slices", "Scale All Slices:")}</span>
                  <div className="flex items-center gap-1">
                    <CustomizableButton
                      buttonId="grid_mesh_studio_modal_10_2"
                      defaultLabel={"-10%"}
                      type="button"
onClick={() => handleScaleAllSquares(0.9)}
className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded font-mono font-bold cursor-pointer"
title={uiText("components_grid_mesh_studio_modal.button.shrink_all_slices_10.title", "Shrink all slices 10%")}
                    />
                    <CustomizableButton
                      buttonId="grid_mesh_studio_modal_10"
                      defaultLabel={"+10%"}
                      type="button"
onClick={() => handleScaleAllSquares(1.1)}
className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded font-mono font-bold cursor-pointer"
title={uiText("components_grid_mesh_studio_modal.button.expand_all_slices_10.title", "Expand all slices 10%")}
                    />
                  </div>
                </div>

                {/* Selection & Batch ops */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/80">
                  <CustomizableButton
                    buttonId="grid_mesh_studio_modal_btn_20"
                    defaultIcon={<CheckSquare className="w-3 h-3 text-cyan-400" />}
                    type="button"
onClick={() => {
                      if (selectedFreestyleSquareIds.length === freestyleSquares.length && freestyleSquares.length > 0) {
                        setSelectedFreestyleSquareIds([]);
                      } else {
                        setSelectedFreestyleSquareIds(freestyleSquares.map((s) => s.id));
                      }
                    }}
className="py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                      {() => (
                          <>
                            <span>
                      {selectedFreestyleSquareIds.length === freestyleSquares.length && freestyleSquares.length > 0
                        ? "Deselect All"
                        : "Select All"}
                    </span>
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="grid_mesh_studio_modal_btn_19"
                    defaultIcon={<RefreshCw className="w-3 h-3 text-amber-400" />}
                    type="button"
onClick={initializeDefaultFreestyleSquare}
className="py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer"
title={uiText("components_grid_mesh_studio_modal.button.reset_to_1_centered_slice_square.title", "Reset to 1 centered slice square")}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_grid_mesh_studio_modal.span.reset_1_slice", "Reset (1 Slice)")}</span>
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>
            </div>
          )}

          {/* Export Destination & Routing */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 mt-auto">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>{uiText("components_grid_mesh_studio_modal.span.target_destination", "Target Destination")}</span>
            </span>
            <select
              value={meshDestination}
              onChange={(e) => setMeshDestination(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="storyboard-slices">{uiText("components_grid_mesh_studio_modal.option.storyboard_slices_asset_pool", "Storyboard Slices (Asset Pool)")}</option>
              <option value="storyboard-slots">{uiText("components_grid_mesh_studio_modal.option.storyboard_frame_slots_direct_load", "Storyboard Frame Slots (Direct Load)")}</option>
              <option value="multi-crops">{uiText("components_grid_mesh_studio_modal.option.multi_crops_regions", "Multi-Crops Regions")}</option>
            </select>

            <CustomizableLabel
              labelId="grid_mesh_studio_modal_item_18"
              as="label"
              className="flex items-center gap-2 text-[11px] text-slate-300 pt-1 cursor-pointer"
            >
                {() => (
                    <>
                      <input
                type="checkbox"
                checked={autoCloseAfterCut}
                onChange={(e) => setAutoCloseAfterCut(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
              />
                    <span>{uiText("components_grid_mesh_studio_modal.span.auto_close_studio_after_cut", "Auto Close Studio after Cut")}</span>
                    </>
                  )}
            </CustomizableLabel>
          </div>
        </aside>

        {/* Center Column: Interactive Canvas Stage */}
        <main
          ref={canvasContainerRef}
          className="flex-1 bg-[#070b14] relative overflow-hidden flex flex-col items-center justify-center p-4 select-none"
        >
          {/* Canvas Floating Top Toolbar (Zoom, Fit, Reset) */}
          <div className="absolute top-4 left-4 z-30 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 shadow-2xl backdrop-blur-md">
            <CustomizableButton
              buttonId="grid_mesh_studio_modal_btn_17"
              defaultIcon={<ZoomOut className="w-3.5 h-3.5" />}
              type="button"
onClick={() => setZoomLevel((z) => Math.max(0.2, z - 0.15))}
className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
title={uiText("components_grid_mesh_studio_modal.button.zoom_out.title", "Zoom Out (-)")}
            />
            <span className="font-mono text-xs font-bold text-emerald-400 px-1 min-w-[45px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <CustomizableButton
              buttonId="grid_mesh_studio_modal_btn_16"
              defaultIcon={<ZoomIn className="w-3.5 h-3.5" />}
              type="button"
onClick={() => setZoomLevel((z) => Math.min(3, z + 0.15))}
className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
title={uiText("components_grid_mesh_studio_modal.button.zoom_in.title", "Zoom In (+)")}
            />
            <div className="w-[1px] h-4 bg-slate-800 mx-1" />
            <CustomizableButton
              buttonId="grid_mesh_studio_modal_btn_15"
              type="button"
onClick={() => {
                setZoomLevel(1);
                setPanOffset({ x: 0, y: 0 });
              }}
className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10.5px] font-medium transition-colors cursor-pointer"
            >
                {() => (
                    <>
                      {uiText("components_grid_mesh_studio_modal.button.reset", "Reset")}
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="grid_mesh_studio_modal_btn_14"
              defaultIcon={<Move className="w-3.5 h-3.5" />}
              type="button"
onClick={() => setIsPanActive((p) => !p)}
className={cn(
                "p-1 rounded transition-colors cursor-pointer",
                isPanActive ? "bg-cyan-600 text-white" : "text-slate-300 hover:bg-slate-800"
              )}
title={isPanActive ? "Panning Mode Active (Click & Drag)" : "Enable Pan Mode"}
            />
          </div>

          {/* Interactive Zoomable Viewport */}
          <div
            className={cn(
              "w-full h-full flex items-center justify-center overflow-auto custom-scrollbar relative",
              isPanActive ? "cursor-grab active:cursor-grabbing" : ""
            )}
            onMouseDown={(e) => {
              if (isPanActive || e.button === 1) {
                setIsDraggingPan(true);
                panStartRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                  startOffsetX: panOffset.x,
                  startOffsetY: panOffset.y,
                };
              }
            }}
            onMouseMove={(e) => {
              if (isDraggingPan) {
                const dx = e.clientX - panStartRef.current.x;
                const dy = e.clientY - panStartRef.current.y;
                setPanOffset({
                  x: panStartRef.current.startOffsetX + dx,
                  y: panStartRef.current.startOffsetY + dy,
                });
              }
            }}
            onMouseUp={() => setIsDraggingPan(false)}
          >
            <div
              className="relative inline-block transition-transform duration-75 shadow-2xl border border-slate-800 rounded-lg overflow-visible"
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transformOrigin: "center center",
              }}
            >
              {/* Image Underlay */}
              <img
                ref={imgRef}
                src={imageSrc}
                alt={uiText("components_grid_mesh_studio_modal.img.source_for_mesh.alt", "Source for Mesh")}
                onLoad={handleImageLoad}
                className="max-h-[calc(100vh-140px)] max-w-full block select-none pointer-events-none rounded"
                crossOrigin="anonymous"
              />

              {/* Crop Mesh Overlay on top of image */}
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
                onCutMesh={() => executeCut()}
                onClose={onClose}
                slicePrefix={slicePrefix}
                isAdjustingLines={isAdjustingGridLines}
                onToggleAdjustLines={() => setIsAdjustingGridLines((p) => !p)}
                isFreestyle={meshMode === "freestyle"}
                freestyleSquares={freestyleSquares}
                onFreestyleSquaresChange={setFreestyleSquares}
                selectedFreestyleId={selectedFreestyleSquareId}
                selectedFreestyleIds={selectedFreestyleSquareIds}
                onSelectFreestyleId={(id) => {
                  setSelectedFreestyleSquareIds(id ? [id] : []);
                  if (id) setRightPanelTab("inspector");
                }}
                onSelectFreestyleIds={(ids) => {
                  setSelectedFreestyleSquareIds(ids);
                  if (ids.length > 0) setRightPanelTab("inspector");
                }}
                onResizeFreestyleSquare={handleResizeFreestyleSquareDelta}
                onDuplicateFreestyleSquare={handleDuplicateSquare}
                onDuplicateFreestyleSquares={handleDuplicateSelectedSquares}
                onDeleteFreestyleSquare={handleDeleteSquare}
                onDeleteFreestyleSquares={handleDeleteSelectedSquares}
                onMergeFreestyleSquares={handleMergeSelectedSquares}
                freestyleTool={freestyleTool}
                onFreestyleToolChange={setFreestyleTool}
                activeTrapezePreset={activeTrapezePreset}
                onActiveTrapezePresetChange={setActiveTrapezePreset}
                activePolygonPoints={activePolygonPoints}
                onActivePolygonPointsChange={setActivePolygonPoints}
              />
            </div>
          </div>

          {/* Canvas Bottom Tooltip */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 bg-slate-950/80 border border-slate-800 rounded-full px-4 py-1 text-[11px] text-slate-300 shadow-xl backdrop-blur-md flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{uiText("components_grid_mesh_studio_modal.span.double_click_any_square_directly_on_the_canv", "Double-click any square directly on the canvas to cut slices!")}</span>
          </div>
        </main>

        {/* Right Column: Live Previews Panel & Inspector */}
        <aside
          ref={livePreviewContainerRef}
          className="w-80 bg-slate-900/95 border-l border-slate-800 flex flex-col shrink-0 overflow-hidden"
        >
          {/* Tabs: Live Gallery vs Focused Inspector */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950 p-1">
            <CustomizableButton
              buttonId="grid_mesh_studio_modal_btn_13"
              defaultIcon={<LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />}
              type="button"
onClick={() => setRightPanelTab("gallery")}
className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                rightPanelTab === "gallery"
                  ? "bg-slate-800 text-emerald-300 shadow"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
                {() => (
                    <>
                      <span>{uiText("components_grid_mesh_studio_modal.span.live_gallery", "Live Gallery (")}{meshMode === "freestyle" ? freestyleSquares.length : uniformGridCells.length})</span>
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="grid_mesh_studio_modal_btn_12"
              defaultIcon={<Eye className="w-3.5 h-3.5 text-cyan-400" />}
              type="button"
onClick={() => setRightPanelTab("inspector")}
className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                rightPanelTab === "inspector"
                  ? "bg-slate-800 text-cyan-300 shadow"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
                {() => (
                    <>
                      <span>{uiText("components_grid_mesh_studio_modal.span.active_slice", "Active Slice")}</span>
                    </>
                  )}
            </CustomizableButton>
          </div>

          {/* Panel Content Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
            {rightPanelTab === "gallery" ? (
              /* Live Slices Gallery Grid */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{uiText("components_grid_mesh_studio_modal.span.real_time_slices", "Real-Time Slices")}</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {meshMode === "freestyle" ? `${freestyleSquares.length} slices` : `${uniformGridCells.length} tiles`}
                  </span>
                </div>

                {meshMode === "freestyle" ? (
                  /* Freestyle Slice Previews List */
                  freestyleSquares.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/50 space-y-2">
                      <Layers className="w-6 h-6 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-400">{uiText("components_grid_mesh_studio_modal.p.no_freestyle_slices_created_yet", "No freestyle slices created yet.")}</p>
                      <CustomizableButton
                        buttonId="grid_mesh_studio_modal_btn_11"
                        type="button"
onClick={handleAddFreestyleSquare}
className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow"
                      >
                          {() => (
                              <>
                                {uiText("components_grid_mesh_studio_modal.button.add_first_slice", "+ Add First Slice")}
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {freestyleSquares.map((sq, idx) => {
                        const isSelected = selectedFreestyleSquareIds.includes(sq.id);
                        return (
                          <div
                            key={sq.id}
                            onClick={() => {
                              setSelectedFreestyleSquareIds([sq.id]);
                            }}
                            className={cn(
                              "rounded-xl border p-2 space-y-2 transition-all cursor-pointer bg-slate-950/90 group",
                              isSelected
                                ? "border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg"
                                : "border-slate-800 hover:border-slate-700"
                            )}
                          >
                            <FreestyleSlicePreview
                              imageSrc={imageSrc}
                              square={sq}
                              index={idx}
                              naturalWidth={naturalDimensions.width}
                              naturalHeight={naturalDimensions.height}
                              showBoundingLines={true}
                            />

                            {/* Quick Slices Actions */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                              <span className="text-slate-400 font-mono">
                                #{idx + 1} {sq.label || `Square ${idx + 1}`}
                              </span>
                              <div className="flex items-center gap-1">
                                <CustomizableButton
                                  buttonId="grid_mesh_studio_modal_btn_10"
                                  defaultIcon={<Send className="w-2.5 h-2.5 text-emerald-400" />}
                                  type="button"
onClick={(e) => {
                                    e.stopPropagation();
                                    executeCut([sq]);
                                  }}
className="px-1.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-800/60 font-medium flex items-center gap-1 cursor-pointer"
title={uiText("components_grid_mesh_studio_modal.button.send_this_slice_directly_to_storyboard.title", "Send this slice directly to Storyboard")}
                                >
                                    {() => (
                                        <>
                                          <span>{uiText("components_grid_mesh_studio_modal.span.cut", "Cut")}</span>
                                        </>
                                      )}
                                </CustomizableButton>
                                <CustomizableButton
                                  buttonId="grid_mesh_studio_modal_btn_9"
                                  defaultIcon={<Copy className="w-2.5 h-2.5 text-cyan-400" />}
                                  type="button"
onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateSquare(sq.id);
                                  }}
className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-medium flex items-center gap-1 cursor-pointer"
title={uiText("components_grid_mesh_studio_modal.button.clone_slice.title", "Clone slice")}
                                >
                                    {() => (
                                        <>
                                          <span>{uiText("components_grid_mesh_studio_modal.span.clone", "Clone")}</span>
                                        </>
                                      )}
                                </CustomizableButton>
                                <CustomizableButton
                                  buttonId="grid_mesh_studio_modal_btn_8"
                                  defaultIcon={<Trash2 className="w-2.5 h-2.5 text-rose-400" />}
                                  type="button"
onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSquare(sq.id);
                                  }}
className="px-1.5 py-0.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded border border-rose-800/60 font-medium flex items-center gap-1 cursor-pointer"
title={uiText("components_grid_mesh_studio_modal.button.delete_slice.title", "Delete slice")}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  /* Uniform Grid Cells Previews List */
                  <div className="grid grid-cols-2 gap-2">
                    {uniformGridCells.slice(0, 32).map((cell, idx) => (
                      <div
                        key={cell.id}
                        className="bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-1 text-center"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>#{idx + 1}</span>
                          <span className="text-emerald-400 font-bold">{cell.label}</span>
                        </div>
                        <div
                          className="w-full h-16 bg-slate-900 rounded border border-slate-800/60 overflow-hidden relative"
                          style={{
                            backgroundImage:
                              "url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDcwZTE2IiAvPgo8cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDcwZTE2IiAvPgo8L3N2Zz4=\")",
                          }}
                        >
                          <img
                            src={imageSrc}
                            alt={`Tile ${cell.label}`}
                            className="absolute max-w-none object-none"
                            style={{
                              width: `${(naturalDimensions.width / cell.pxW) * 100}%`,
                              height: `${(naturalDimensions.height / cell.pxH) * 100}%`,
                              left: `-${(cell.x / 100) * (naturalDimensions.width / cell.pxW) * 100}%`,
                              top: `-${(cell.y / 100) * (naturalDimensions.height / cell.pxH) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-[9.5px] font-mono text-slate-400 block pt-0.5">
                          {cell.pxW} × {cell.pxH}{uiText("components_grid_mesh_studio_modal.span.px_3", " px")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Focused Active Slice Inspector */
              <div className="space-y-3">
                {selectedSquare ? (
                  <div className="space-y-3">
                    {/* Large High-Res Live Preview */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-cyan-500/50 space-y-2 shadow-lg">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>
                            {uiText("components_grid_mesh_studio_modal.span.slice", "Slice #")}{selectedSquareIdx + 1}: {selectedSquare.label || `Square ${selectedSquareIdx + 1}`}
                          </span>
                        </span>
                        <span className="text-[10px] bg-cyan-950 text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-800">
                          {selectedSquare.shapeType === "polygon"
                            ? "Angled Polygon"
                            : selectedSquare.shapeType === "trapezoid"
                            ? "Trapeze"
                            : "Box Slice"}
                        </span>
                      </div>

                      <FreestyleSlicePreview
                        imageSrc={imageSrc}
                        square={selectedSquare}
                        index={selectedSquareIdx}
                        naturalWidth={naturalDimensions.width}
                        naturalHeight={naturalDimensions.height}
                        showBoundingLines={true}
                      />
                    </div>

                    {/* Precision Pixel Dimension Inputs */}
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2.5">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{uiText("components_grid_mesh_studio_modal.span.precise_pixel_size", "Precise Pixel Size")}</span>
                      </span>

                      {/* Width & Height Inputs */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <CustomizableLabel
                            labelId="grid_mesh_studio_modal_item_7"
                            as="label"
                            className="text-[10px] text-slate-400 font-mono"
                          >
                              {() => (
                                  <>
                                    {uiText("components_grid_mesh_studio_modal.label.width_px", "Width (px)")}
                                  </>
                                )}
                          </CustomizableLabel>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="8"
                              max={naturalDimensions.width}
                              value={Math.round((selectedSquare.width / 100) * naturalDimensions.width)}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 32;
                                handleSetSquareDimensionsPx(selectedSquare.id, val, undefined);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <CustomizableLabel
                            labelId="grid_mesh_studio_modal_item_6"
                            as="label"
                            className="text-[10px] text-slate-400 font-mono"
                          >
                              {() => (
                                  <>
                                    {uiText("components_grid_mesh_studio_modal.label.height_px", "Height (px)")}
                                  </>
                                )}
                          </CustomizableLabel>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="8"
                              max={naturalDimensions.height}
                              value={Math.round((selectedSquare.height / 100) * naturalDimensions.height)}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 32;
                                handleSetSquareDimensionsPx(selectedSquare.id, undefined, val);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Quick Delta Step Buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10.5px]">
                        <span className="text-slate-400">{uiText("components_grid_mesh_studio_modal.span.step_size_10px", "Step Size (±10px):")}</span>
                        <div className="flex items-center gap-1">
                          <CustomizableButton
                            buttonId="grid_mesh_studio_modal_btn_5"
                            type="button"
onClick={() => handleResizeFreestyleSquareDelta(selectedSquare.id, -10)}
className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded font-mono font-bold cursor-pointer"
                          >
                              {() => (
                                  <>
                                    {uiText("components_grid_mesh_studio_modal.button.10px", "-10px")}
                                  </>
                                )}
                          </CustomizableButton>
                          <CustomizableButton
                            buttonId="grid_mesh_studio_modal_btn_4"
                            type="button"
onClick={() => handleResizeFreestyleSquareDelta(selectedSquare.id, 10)}
className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded font-mono font-bold cursor-pointer"
                          >
                              {() => (
                                  <>
                                    {uiText("components_grid_mesh_studio_modal.button.10px_2", "+10px")}
                                  </>
                                )}
                          </CustomizableButton>
                        </div>
                      </div>
                    </div>

                    {/* Active Slice Action Buttons */}
                    <div className="space-y-1.5 pt-1">
                      <CustomizableButton
                        buttonId="grid_mesh_studio_modal_btn_3"
                        defaultIcon={<Scissors className="w-3.5 h-3.5 stroke-[2.5]" />}
                        type="button"
onClick={() => executeCut([selectedSquare])}
className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
                      >
                          {() => (
                              <>
                                <span>{uiText("components_grid_mesh_studio_modal.span.cut_only_this_slice", "Cut Only This Slice")}</span>
                              </>
                            )}
                      </CustomizableButton>
                      <div className="grid grid-cols-2 gap-1.5">
                        <CustomizableButton
                          buttonId="grid_mesh_studio_modal_btn_2"
                          defaultIcon={<Copy className="w-3 h-3 text-cyan-400" />}
                          type="button"
onClick={() => handleDuplicateSquare(selectedSquare.id)}
className="py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            {() => (
                                <>
                                  <span>{uiText("components_grid_mesh_studio_modal.span.clone_slice", "Clone Slice")}</span>
                                </>
                              )}
                        </CustomizableButton>
                        <CustomizableButton
                          buttonId="grid_mesh_studio_modal_btn_1"
                          defaultIcon={<Trash2 className="w-3 h-3 text-rose-400" />}
                          type="button"
onClick={() => handleDeleteSquare(selectedSquare.id)}
className="py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            {() => (
                                <>
                                  <span>{uiText("components_grid_mesh_studio_modal.span.delete_slice", "Delete Slice")}</span>
                                </>
                              )}
                        </CustomizableButton>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
                    <MousePointer className="w-6 h-6 text-slate-500 mx-auto opacity-70" />
                    <p className="text-xs text-slate-400">{uiText("components_grid_mesh_studio_modal.p.click_any_slice_on_the_canvas_or_gallery_to", "Click any slice on the canvas or gallery to inspect.")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
