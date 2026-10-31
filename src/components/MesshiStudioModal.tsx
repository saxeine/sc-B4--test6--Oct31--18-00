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
  Grid3x3,
  RefreshCw,
  Eye,
  Sliders,
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
} from "lucide-react";
import { MesshiIcon } from "./MesshiIcon";
import { cn } from "../utils/cn";
import { getCroppedImg } from "../utils/imageUtils";
import type { Crop } from "react-image-crop";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export interface MesshiCell {
  id: string;
  name?: string;
  x: number; // percent 0-100
  y: number; // percent 0-100
  width: number; // percent 0-100
  height: number; // percent 0-100
  selected?: boolean;
}

export interface MesshiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImageSrc?: string;
  slices?: Array<{ name: string; url: string; story?: string }>;
  activeFrameIndex?: number;
  onSliceToStoryboard?: (
    newSlices: Array<{ name: string; url: string }>,
    destination: "storyboard-slices" | "storyboard-slots" | "multi-crops"
  ) => void;
  onSendToCropTool?: (imageSrc: string, cropArea?: Crop) => void;
}

const MESH_COLOR_PRESETS = [
  { id: "cyan", name: "Neon Cyan", hex: "#00f0ff" },
  { id: "emerald", name: "Vivid Emerald", hex: "#10b981" },
  { id: "amber", name: "Amber Gold", hex: "#fbbf24" },
  { id: "magenta", name: "Hot Magenta", hex: "#ec4899" },
  { id: "purple", name: "Cyber Purple", hex: "#a855f7" },
  { id: "white", name: "Pure White", hex: "#ffffff" },
  { id: "black", name: "Contrast Dark", hex: "#0f172a" },
];

export const MesshiStudioModal: React.FC<MesshiStudioModalProps> = ({
  isOpen,
  onClose,
  initialImageSrc,
  slices = [],
  activeFrameIndex = 0,
  onSliceToStoryboard,
  onSendToCropTool,
}) => {
  // Current active working image
  const [currentImageSrc, setCurrentImageSrc] = useState<string>("");
  const [selectedFrameIdx, setSelectedFrameIdx] = useState<number>(activeFrameIndex);

  // Natural image dimensions
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Studio Modes: "grid" (Uniform RowsxCols), "lines" (Interactive Dividers), "freestyle" (Custom Rectangles), "auto" (Optical Sprites)
  const [meshMode, setMeshMode] = useState<"grid" | "lines" | "freestyle" | "auto">("grid");

  // Grid mode parameters
  const [gridRows, setGridRows] = useState<number>(3);
  const [gridCols, setGridCols] = useState<number>(3);
  const [gridGapX, setGridGapX] = useState<number>(0); // px
  const [gridGapY, setGridGapY] = useState<number>(0); // px
  const [gridBounds, setGridBounds] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [lockAspectRatio, setLockAspectRatio] = useState<"free" | "1:1" | "4:3" | "16:9" | "9:16" | "3:2">("free");

  // Asymmetric Lines mode parameters (percent 0-100)
  const [horizontalCutLines, setHorizontalCutLines] = useState<number[]>([33.33, 66.66]);
  const [verticalCutLines, setVerticalCutLines] = useState<number[]>([33.33, 66.66]);
  const [draggingLine, setDraggingLine] = useState<{ type: "h" | "v"; index: number } | null>(null);

  // Freestyle custom cells
  const [freestyleCells, setFreestyleCells] = useState<MesshiCell[]>([]);
  const [selectedCellIds, setSelectedCellIds] = useState<string[]>([]);
  const [isDrawingCell, setIsDrawingCell] = useState<boolean>(false);
  const [drawStartPos, setDrawStartPos] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrentPos, setDrawCurrentPos] = useState<{ x: number; y: number } | null>(null);

  // Optical auto-detect parameters
  const [autoThreshold, setAutoThreshold] = useState<number>(15);
  const [autoMinSize, setAutoMinSize] = useState<number>(20);
  const [autoPadding, setAutoPadding] = useState<number>(2);

  // Styling & Appearance
  const [meshLineColor, setMeshLineColor] = useState<string>("#00f0ff");
  const [meshLineWidth, setMeshLineWidth] = useState<number>(2);
  const [meshLineStyle, setMeshLineStyle] = useState<"solid" | "dashed" | "dotted">("solid");
  const [showCellLabels, setShowCellLabels] = useState<boolean>(true);
  const [labelFormat, setLabelFormat] = useState<"index" | "matrix" | "dimensions">("index");
  const [cellTintOpacity, setCellTintOpacity] = useState<number>(15); // percent
  const [showCheckerboard, setShowCheckerboard] = useState<boolean>(true);

  // Slicing & Output Config
  const [slicePrefix, setSlicePrefix] = useState<string>("Messhi");
  const [sliceDestination, setSliceDestination] = useState<"storyboard-slices" | "storyboard-slots" | "multi-crops">("storyboard-slices");
  const [sliceFormat, setSliceFormat] = useState<"image/png" | "image/jpeg">("image/png");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Viewport zoom & pan
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "pan">("select");
  const [cursorCoord, setCursorCoord] = useState<{ x: number; y: number } | null>(null);

  // Preview Drawer
  const [isPreviewDrawerOpen, setIsPreviewDrawerOpen] = useState<boolean>(true);
  const [liveSlicePreviews, setLiveSlicePreviews] = useState<Array<{ id: string; name: string; url: string; w: number; h: number }>>([]);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Initialize or update working image
  useEffect(() => {
    if (!isOpen) return;
    if (initialImageSrc) {
      setCurrentImageSrc(initialImageSrc);
    } else if (slices.length > 0 && slices[selectedFrameIdx]?.url) {
      setCurrentImageSrc(slices[selectedFrameIdx].url);
    }
  }, [isOpen, initialImageSrc, slices, selectedFrameIdx]);

  // Load natural dimensions when image changes and calculate optimal fit zoom
  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current || !naturalSize.width || !naturalSize.height) return;
    const containerW = containerRef.current.clientWidth - 56;
    const containerH = containerRef.current.clientHeight - 56;
    if (containerW <= 0 || containerH <= 0) return;
    const scaleX = containerW / naturalSize.width;
    const scaleY = containerH / naturalSize.height;
    const fitZoom = Math.min(scaleX, scaleY);
    setZoomLevel(Math.max(0.05, Math.min(3, Math.round(fitZoom * 100) / 100)));
    setPanOffset({ x: 0, y: 0 });
  }, [naturalSize.width, naturalSize.height]);

  useEffect(() => {
    if (!currentImageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = currentImageSrc;
    img.onload = () => {
      imageElementRef.current = img;
      const nw = img.naturalWidth || 800;
      const nh = img.naturalHeight || 600;
      setNaturalSize({ width: nw, height: nh });

      // Auto-fit to container viewport bounds so image is never truncated
      if (containerRef.current) {
        const containerW = containerRef.current.clientWidth - 56;
        const containerH = containerRef.current.clientHeight - 56;
        if (containerW > 0 && containerH > 0) {
          const scaleX = containerW / nw;
          const scaleY = containerH / nh;
          const fitZoom = Math.min(scaleX, scaleY);
          setZoomLevel(Math.max(0.05, Math.min(1.5, Math.round(fitZoom * 100) / 100)));
        } else {
          setZoomLevel(1);
        }
      } else {
        setZoomLevel(1);
      }
      setPanOffset({ x: 0, y: 0 });
    };
  }, [currentImageSrc]);

  // Re-fit on maximize toggle or open
  useEffect(() => {
    if (isOpen && naturalSize.width > 0 && naturalSize.height > 0) {
      const timer = setTimeout(() => {
        handleFitToScreen();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMaximized, handleFitToScreen, naturalSize.width, naturalSize.height]);

  // Compute calculated mesh cells based on current mode
  const computedCells: MesshiCell[] = useMemo(() => {
    const naturalW = naturalSize.width;
    const naturalH = naturalSize.height;

    if (meshMode === "grid") {
      const cells: MesshiCell[] = [];
      const { x: bx, y: by, width: bw, height: bh } = gridBounds;

      const gapXPercent = naturalW > 0 ? (gridGapX / naturalW) * 100 : 0;
      const gapYPercent = naturalH > 0 ? (gridGapY / naturalH) * 100 : 0;

      const totalGapW = gapXPercent * (gridCols - 1);
      const totalGapH = gapYPercent * (gridRows - 1);

      const cellW = Math.max(0.1, (bw - totalGapW) / gridCols);
      const cellH = Math.max(0.1, (bh - totalGapH) / gridRows);

      let idx = 1;
      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const cellX = bx + c * (cellW + gapXPercent);
          const cellY = by + r * (cellH + gapYPercent);
          const rowChar = String.fromCharCode(65 + r);
          const colNum = c + 1;
          const matrixName = `${rowChar}${colNum}`;

          cells.push({
            id: `grid_${r}_${c}`,
            name: `${slicePrefix || "Mesh"} ${idx} (${matrixName})`,
            x: Math.round(cellX * 100) / 100,
            y: Math.round(cellY * 100) / 100,
            width: Math.round(cellW * 100) / 100,
            height: Math.round(cellH * 100) / 100,
            selected: selectedCellIds.length === 0 || selectedCellIds.includes(`grid_${r}_${c}`),
          });
          idx++;
        }
      }
      return cells;
    }

    if (meshMode === "lines") {
      const sortedH = [0, ...[...horizontalCutLines].sort((a, b) => a - b), 100];
      const sortedV = [0, ...[...verticalCutLines].sort((a, b) => a - b), 100];
      const cells: MesshiCell[] = [];
      let idx = 1;

      for (let r = 0; r < sortedH.length - 1; r++) {
        for (let c = 0; c < sortedV.length - 1; c++) {
          const y1 = sortedH[r];
          const y2 = sortedH[r + 1];
          const x1 = sortedV[c];
          const x2 = sortedV[c + 1];
          const w = Math.max(0.1, x2 - x1);
          const h = Math.max(0.1, y2 - y1);
          const cellId = `lines_${r}_${c}`;

          cells.push({
            id: cellId,
            name: `${slicePrefix || "Mesh"} ${idx}`,
            x: Math.round(x1 * 100) / 100,
            y: Math.round(y1 * 100) / 100,
            width: Math.round(w * 100) / 100,
            height: Math.round(h * 100) / 100,
            selected: selectedCellIds.length === 0 || selectedCellIds.includes(cellId),
          });
          idx++;
        }
      }
      return cells;
    }

    if (meshMode === "freestyle" || meshMode === "auto") {
      return freestyleCells.map((cell, idx) => ({
        ...cell,
        name: cell.name || `${slicePrefix || "Mesh"} ${idx + 1}`,
        selected: selectedCellIds.length === 0 || selectedCellIds.includes(cell.id),
      }));
    }

    return [];
  }, [
    meshMode,
    gridRows,
    gridCols,
    gridGapX,
    gridGapY,
    gridBounds,
    naturalSize,
    slicePrefix,
    selectedCellIds,
    horizontalCutLines,
    verticalCutLines,
    freestyleCells,
  ]);

  // Optical Auto-Detect Sprite Slices
  const handleRunAutoSpriteDetection = useCallback(async () => {
    if (!currentImageSrc) return;
    setIsProcessing(true);
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.crossOrigin = "anonymous";
        i.src = currentImageSrc;
        i.onload = () => res(i);
        i.onerror = rej;
      });

      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Scan rows and columns for non-transparent / non-background areas
      const isOpaque = (x: number, y: number) => {
        const idx = (y * w + x) * 4;
        const a = data[idx + 3];
        return a > autoThreshold;
      };

      const visited = new Uint8Array(w * h);
      const boxes: Array<{ minX: number; minY: number; maxX: number; maxY: number }> = [];

      // Grid sampling detection
      const step = 2;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const pixelIdx = y * w + x;
          if (visited[pixelIdx] || !isOpaque(x, y)) continue;

          // Flood fill bounding box
          let minX = x;
          let maxX = x;
          let minY = y;
          let maxY = y;

          const queue = [{ x, y }];
          visited[pixelIdx] = 1;

          while (queue.length > 0) {
            const pt = queue.pop()!;
            minX = Math.min(minX, pt.x);
            maxX = Math.max(maxX, pt.x);
            minY = Math.min(minY, pt.y);
            maxY = Math.max(maxY, pt.y);

            const neighbors = [
              { x: pt.x + step, y: pt.y },
              { x: pt.x - step, y: pt.y },
              { x: pt.x, y: pt.y + step },
              { x: pt.x, y: pt.y - step },
            ];

            for (const n of neighbors) {
              if (n.x >= 0 && n.x < w && n.y >= 0 && n.y < h) {
                const nIdx = n.y * w + n.x;
                if (!visited[nIdx] && isOpaque(n.x, n.y)) {
                  visited[nIdx] = 1;
                  queue.push(n);
                }
              }
            }
          }

          const boxW = maxX - minX;
          const boxH = maxY - minY;
          if (boxW >= autoMinSize && boxH >= autoMinSize) {
            boxes.push({ minX, minY, maxX, maxY });
          }
        }
      }

      // Add padding and convert to percentages
      const detectedCells: MesshiCell[] = boxes.map((box, idx) => {
        const px = Math.max(0, box.minX - autoPadding);
        const py = Math.max(0, box.minY - autoPadding);
        const pw = Math.min(w - px, box.maxX - box.minX + autoPadding * 2);
        const ph = Math.min(h - py, box.maxY - box.minY + autoPadding * 2);

        return {
          id: `auto_${Date.now()}_${idx}`,
          name: `${slicePrefix || "Sprite"} ${idx + 1}`,
          x: Math.round(((px / w) * 100) * 100) / 100,
          y: Math.round(((py / h) * 100) * 100) / 100,
          width: Math.round(((pw / w) * 100) * 100) / 100,
          height: Math.round(((ph / h) * 100) * 100) / 100,
        };
      });

      if (detectedCells.length > 0) {
        setFreestyleCells(detectedCells);
        setMeshMode("auto");
        setSelectedCellIds(detectedCells.map((c) => c.id));
        setNoticeMessage(`✓ Detected ${detectedCells.length} optical sprite cells!`);
      } else {
        setNoticeMessage("No separate sprite regions detected with current threshold.");
      }
      setTimeout(() => setNoticeMessage(null), 3000);
    } catch (err) {
      console.error("Auto detect error:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [currentImageSrc, autoThreshold, autoMinSize, autoPadding, slicePrefix]);

  // Generate real-time slice previews for drawer
  useEffect(() => {
    if (!isOpen || !currentImageSrc || computedCells.length === 0) {
      setLiveSlicePreviews([]);
      return;
    }

    let isMounted = true;
    const generatePreviews = async () => {
      try {
        const previews = await Promise.all(
          computedCells.slice(0, 36).map(async (cell) => {
            const crop: Crop = {
              unit: "%",
              x: cell.x,
              y: cell.y,
              width: cell.width,
              height: cell.height,
            };
            const croppedData = await getCroppedImg(
              currentImageSrc,
              crop,
              sliceFormat,
              null,
              false
            );
            const pxW = Math.round((cell.width / 100) * naturalSize.width);
            const pxH = Math.round((cell.height / 100) * naturalSize.height);

            return {
              id: cell.id,
              name: cell.name || `Slice`,
              url: croppedData,
              w: pxW,
              h: pxH,
            };
          })
        );
        if (isMounted) {
          setLiveSlicePreviews(previews);
        }
      } catch (err) {
        console.warn("Preview generation warning:", err);
      }
    };

    const timer = setTimeout(generatePreviews, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, currentImageSrc, computedCells, sliceFormat, naturalSize]);

  // Perform Slicing operation on active cells
  const handlePerformSlicing = useCallback(
    async (targetCells?: MesshiCell[]) => {
      const cellsToSlice = targetCells || computedCells.filter((c) => c.selected !== false);
      if (!currentImageSrc || cellsToSlice.length === 0) {
        alert("No cells selected to slice.");
        return;
      }

      setIsProcessing(true);
      try {
        const slicedResults: Array<{ name: string; url: string }> = [];

        for (let i = 0; i < cellsToSlice.length; i++) {
          const cell = cellsToSlice[i];
          const crop: Crop = {
            unit: "%",
            x: cell.x,
            y: cell.y,
            width: cell.width,
            height: cell.height,
          };
          const croppedUrl = await getCroppedImg(
            currentImageSrc,
            crop,
            sliceFormat,
            null,
            false
          );
          const sliceName = cell.name || `${slicePrefix || "Mesh"} ${i + 1}`;
          slicedResults.push({ name: sliceName, url: croppedUrl });
        }

        if (onSliceToStoryboard) {
          onSliceToStoryboard(slicedResults, sliceDestination);
        }

        setNoticeMessage(`✓ Sliced ${slicedResults.length} mesh parts sent to ${sliceDestination.replace("-", " ")}!`);
        setTimeout(() => setNoticeMessage(null), 3500);
      } catch (err) {
        console.error("Messhi slicing error:", err);
        alert(`Failed to slice: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setIsProcessing(false);
      }
    },
    [computedCells, currentImageSrc, sliceFormat, slicePrefix, onSliceToStoryboard, sliceDestination]
  );

  // Single cell instant slice
  const handleSliceSingleCell = useCallback(
    async (cell: MesshiCell) => {
      await handlePerformSlicing([cell]);
    },
    [handlePerformSlicing]
  );

  // Download all slices as ZIP
  const handleDownloadAllAsZip = useCallback(async () => {
    if (!currentImageSrc || computedCells.length === 0) return;
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const usedNames = new Set<string>();

      for (let i = 0; i < computedCells.length; i++) {
        const cell = computedCells[i];
        const crop: Crop = {
          unit: "%",
          x: cell.x,
          y: cell.y,
          width: cell.width,
          height: cell.height,
        };
        const croppedUrl = await getCroppedImg(
          currentImageSrc,
          crop,
          sliceFormat,
          null,
          false
        );
        const base64Data = croppedUrl.replace(/^data:image\/\w+;base64,/, "");
        const ext = sliceFormat === "image/png" ? "png" : "jpg";
        let filename = `${cell.name || `${slicePrefix || "mesh"}-${i + 1}`}.${ext}`;
        filename = filename.replace(/[/\\?%*:|"<>]/g, "_").trim();

        let counter = 1;
        while (usedNames.has(filename)) {
          filename = `${cell.name || `mesh`}_${counter}.${ext}`;
          counter++;
        }
        usedNames.add(filename);
        zip.file(filename, base64Data, { base64: true });
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const archiveName = `${slicePrefix || "messhi"}-mesh-slices-${Date.now()}.zip`;
      saveAs(zipBlob, archiveName);

      setNoticeMessage(`✓ Downloaded ZIP archive with ${computedCells.length} slices!`);
      setTimeout(() => setNoticeMessage(null), 3000);
    } catch (err) {
      console.error("ZIP download failed:", err);
      alert("Failed to create ZIP download.");
    } finally {
      setIsProcessing(false);
    }
  }, [currentImageSrc, computedCells, sliceFormat, slicePrefix]);

  // Convert current grid to freestyle cells
  const handleConvertGridToFreestyle = useCallback(() => {
    setFreestyleCells([...computedCells]);
    setMeshMode("freestyle");
    setSelectedCellIds(computedCells.map((c) => c.id));
    setNoticeMessage(`✓ Converted grid into ${computedCells.length} freestyle cells!`);
    setTimeout(() => setNoticeMessage(null), 2500);
  }, [computedCells]);

  // Join / Merge selected freestyle/auto cells into a single bounding box
  const handleJoinSelectedCells = useCallback(() => {
    const selected = (meshMode === "freestyle" || meshMode === "auto" ? freestyleCells : computedCells).filter(
      (c) => selectedCellIds.includes(c.id)
    );
    if (selected.length < 2) {
      setNoticeMessage("Select at least 2 cells to join them together.");
      setTimeout(() => setNoticeMessage(null), 2500);
      return;
    }

    const minX = Math.min(...selected.map((c) => c.x));
    const minY = Math.min(...selected.map((c) => c.y));
    const maxX = Math.max(...selected.map((c) => c.x + c.width));
    const maxY = Math.max(...selected.map((c) => c.y + c.height));

    const joinedCell: MesshiCell = {
      id: `joined_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${slicePrefix || "Mesh"} Joined`,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    const selectedIdsSet = new Set(selected.map((c) => c.id));
    const remaining = (meshMode === "freestyle" || meshMode === "auto" ? freestyleCells : computedCells).filter(
      (c) => !selectedIdsSet.has(c.id)
    );

    setFreestyleCells([...remaining, joinedCell]);
    setMeshMode("freestyle");
    setSelectedCellIds([joinedCell.id]);
    setNoticeMessage(`✓ Joined ${selected.length} cells into 1 merged bounding box!`);
    setTimeout(() => setNoticeMessage(null), 3000);
  }, [meshMode, freestyleCells, computedCells, selectedCellIds, slicePrefix]);

  // Send current image to Carver / Crop tool
  const handleSendToCropToolAction = useCallback(() => {
    if (onSendToCropTool && currentImageSrc) {
      onSendToCropTool(currentImageSrc);
      onClose();
    }
  }, [onSendToCropTool, currentImageSrc, onClose]);

  // Canvas Mouse / Drawing Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - svgRect.left) / svgRect.width) * 100;
    const clickY = ((e.clientY - svgRect.top) / svgRect.height) * 100;

    if (activeTool === "pan") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (meshMode === "lines" && activeTool === "select") {
      // Check if clicking near horizontal or vertical divider to drag
      const lineTolerance = 1.5;
      const hIdx = horizontalCutLines.findIndex((line) => Math.abs(line - clickY) < lineTolerance);
      if (hIdx !== -1) {
        setDraggingLine({ type: "h", index: hIdx });
        return;
      }
      const vIdx = verticalCutLines.findIndex((line) => Math.abs(line - clickX) < lineTolerance);
      if (vIdx !== -1) {
        setDraggingLine({ type: "v", index: vIdx });
        return;
      }

      // If clicked on canvas space, add new line
      if (e.altKey || e.shiftKey) {
        setHorizontalCutLines((prev) => [...prev, Math.round(clickY * 100) / 100].sort((a, b) => a - b));
      } else {
        setVerticalCutLines((prev) => [...prev, Math.round(clickX * 100) / 100].sort((a, b) => a - b));
      }
      return;
    }

    if (activeTool === "draw" || meshMode === "freestyle") {
      setIsDrawingCell(true);
      setDrawStartPos({ x: clickX, y: clickY });
      setDrawCurrentPos({ x: clickX, y: clickY });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const currX = Math.max(0, Math.min(100, ((e.clientX - svgRect.left) / svgRect.width) * 100));
    const currY = Math.max(0, Math.min(100, ((e.clientY - svgRect.top) / svgRect.height) * 100));

    setCursorCoord({
      x: Math.round((currX / 100) * naturalSize.width),
      y: Math.round((currY / 100) * naturalSize.height),
    });

    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggingLine) {
      if (draggingLine.type === "h") {
        setHorizontalCutLines((prev) => {
          const next = [...prev];
          next[draggingLine.index] = Math.round(currY * 100) / 100;
          return next;
        });
      } else {
        setVerticalCutLines((prev) => {
          const next = [...prev];
          next[draggingLine.index] = Math.round(currX * 100) / 100;
          return next;
        });
      }
      return;
    }

    if (isDrawingCell && drawStartPos) {
      setDrawCurrentPos({ x: currX, y: currY });
    }
  };

  const handleCanvasMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (draggingLine) {
      setDraggingLine(null);
    }
    if (isDrawingCell && drawStartPos && drawCurrentPos) {
      const minX = Math.min(drawStartPos.x, drawCurrentPos.x);
      const minY = Math.min(drawStartPos.y, drawCurrentPos.y);
      const w = Math.abs(drawCurrentPos.x - drawStartPos.x);
      const h = Math.abs(drawCurrentPos.y - drawStartPos.y);

      if (w > 1 && h > 1) {
        const newCell: MesshiCell = {
          id: `fs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: `${slicePrefix || "Mesh"} ${freestyleCells.length + 1}`,
          x: Math.round(minX * 100) / 100,
          y: Math.round(minY * 100) / 100,
          width: Math.round(w * 100) / 100,
          height: Math.round(h * 100) / 100,
        };
        setFreestyleCells((prev) => [...prev, newCell]);
        setSelectedCellIds([newCell.id]);
      }
      setIsDrawingCell(false);
      setDrawStartPos(null);
      setDrawCurrentPos(null);
    }
  };

  // Image Upload handler
  const handleDirectImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setCurrentImageSrc(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden">
      <div
        className={cn(
          "bg-[#090d16] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 transition-all duration-200 animate-in fade-in zoom-in-95",
          isMaximized ? "w-full h-full rounded-none" : "w-[96vw] max-w-7xl h-[92vh]"
        )}
      >
        {/* TOP BAR / HEADER */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0d1527] border-b border-cyan-950/80 shrink-0">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-cyan-500/20 border border-cyan-400/40 rounded-lg text-cyan-300 shadow-sm">
              <MesshiIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CustomizableLabel
                  labelId="messhi_studio_modal_item_49"
                  as="h2"
                  className="text-sm font-extrabold tracking-wide text-white flex items-center gap-1.5"
                >
                    {() => (
                        <>
                          {uiText("components_messhi_studio_modal.h2.messhi", "Messhi ")}
                        <span className="text-[10px] text-cyan-400 font-mono font-normal uppercase bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">{uiText("components_messhi_studio_modal.span.mesh_grid_studio", "Mesh Grid Studio")}</span>
                        </>
                      )}
                </CustomizableLabel>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  {naturalSize.width} × {naturalSize.height}{uiText("components_messhi_studio_modal.span.px", " px")}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 truncate max-w-md">
                {uiText("components_messhi_studio_modal.p.precision_overlay_mesh_slicing_sprite_subdiv", "Precision overlay mesh slicing, sprite subdivision, and custom grid carving")}
              </p>
            </div>
          </div>

          {/* Storyboard Frame Switcher (if multi frames available) */}
          {slices.length > 1 && (
            <div className="hidden md:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <Layers className="w-3 h-3 text-cyan-400" />{uiText("components_messhi_studio_modal.span.frame", " Frame:")}
              </span>
              <CustomizableButton
                buttonId="messhi_studio_modal_btn_48"
                defaultIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                type="button"
disabled={selectedFrameIdx <= 0}
onClick={() => {
                  const nextIdx = Math.max(0, selectedFrameIdx - 1);
                  setSelectedFrameIdx(nextIdx);
                  if (slices[nextIdx]) setCurrentImageSrc(slices[nextIdx].url);
                }}
className="p-1 text-slate-400 hover:text-cyan-300 disabled:opacity-30 cursor-pointer"
              />
              <span className="text-[10px] font-mono font-bold text-cyan-300 px-1">
                {selectedFrameIdx + 1} / {slices.length}
              </span>
              <CustomizableButton
                buttonId="messhi_studio_modal_btn_47"
                defaultIcon={<ChevronRight className="w-3.5 h-3.5" />}
                type="button"
disabled={selectedFrameIdx >= slices.length - 1}
onClick={() => {
                  const nextIdx = Math.min(slices.length - 1, selectedFrameIdx + 1);
                  setSelectedFrameIdx(nextIdx);
                  if (slices[nextIdx]) setCurrentImageSrc(slices[nextIdx].url);
                }}
className="p-1 text-slate-400 hover:text-cyan-300 disabled:opacity-30 cursor-pointer"
              />
            </div>
          )}

          {/* Top Quick Actions */}
          <div className="flex items-center gap-1.5">
            {/* Direct Upload Image */}
            <CustomizableLabel
              labelId="messhi_studio_modal_item_46"
              defaultIcon={<Upload className="w-3.5 h-3.5 text-cyan-400" />}
              as="label"
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
                {() => (
                    <>
                      <span className="hidden sm:inline">{uiText("components_messhi_studio_modal.span.load_image", "Load Image")}</span>
                    <input type="file" accept="image/*" onChange={handleDirectImageUpload} className="hidden" />
                    </>
                  )}
            </CustomizableLabel>

            {/* Send to Crop / Carver Button */}
            {onSendToCropTool && (
              <CustomizableButton
                buttonId="messhi_studio_modal_btn_45"
                defaultIcon={<Scissors className="w-3.5 h-3.5" />}
                type="button"
onClick={handleSendToCropToolAction}
className="bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
title={uiText("components_messhi_studio_modal.button.send_current_image_to_crop_carver_engine.title", "Send current image to Crop / Carver Engine")}
              >
                  {() => (
                      <>
                        <span className="hidden sm:inline">{uiText("components_messhi_studio_modal.span.crop_tool", "Crop Tool")}</span>
                      </>
                    )}
              </CustomizableButton>
            )}

            {/* Maximize Toggle */}
            <CustomizableButton
              buttonId="messhi_studio_modal_btn_44"
              type="button"
onClick={() => setIsMaximized((prev) => !prev)}
className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
title={isMaximized ? "Restore Window" : "Maximize Window"}
            >
                {() => (
                    <>
                      {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </>
                  )}
            </CustomizableButton>

            {/* Close Button */}
            <CustomizableButton
              buttonId="messhi_studio_modal_btn_43"
              defaultIcon={<X className="w-5 h-5" />}
              type="button"
onClick={onClose}
className="p-1.5 text-slate-400 hover:text-rose-300 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
            />
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {noticeMessage && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 px-4 py-1.5 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in slide-in-from-top-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* WORKSPACE BODY */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* LEFT CONTROLS SIDEBAR */}
          <div className="w-72 sm:w-80 bg-[#0b101d] border-r border-slate-800/80 flex flex-col overflow-y-auto shrink-0 p-3 space-y-3.5">
            {/* MESH MODES TABS */}
            <div>
              <CustomizableLabel
                labelId="messhi_studio_modal_item_42"
                as="label"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5"
              >
                  {() => (
                      <>
                        {uiText("components_messhi_studio_modal.label.subdivision_mode", "Subdivision Mode")}
                      </>
                    )}
              </CustomizableLabel>
              <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
                <CustomizableButton
                  buttonId="messhi_studio_modal_btn_41"
                  defaultIcon={<Grid3x3 className="w-3.5 h-3.5" />}
                  type="button"
onClick={() => setMeshMode("grid")}
className={cn(
                    "py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer",
                    meshMode === "grid"
                      ? "bg-cyan-500 text-slate-950 font-extrabold shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  )}
title={uiText("components_messhi_studio_modal.button.uniform_matrix_grid_rows_cols.title", "Uniform Matrix Grid (Rows × Cols)")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_messhi_studio_modal.span.grid", "Grid")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="messhi_studio_modal_btn_40"
                  defaultIcon={<Split className="w-3.5 h-3.5" />}
                  type="button"
onClick={() => setMeshMode("lines")}
className={cn(
                    "py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer",
                    meshMode === "lines"
                      ? "bg-cyan-500 text-slate-950 font-extrabold shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  )}
title={uiText("components_messhi_studio_modal.button.interactive_divider_cut_lines.title", "Interactive Divider Cut Lines")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_messhi_studio_modal.span.lines", "Lines")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="messhi_studio_modal_btn_39"
                  defaultIcon={<LayoutGrid className="w-3.5 h-3.5" />}
                  type="button"
onClick={() => setMeshMode("freestyle")}
className={cn(
                    "py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer",
                    meshMode === "freestyle"
                      ? "bg-cyan-500 text-slate-950 font-extrabold shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  )}
title={uiText("components_messhi_studio_modal.button.draw_and_position_custom_mesh_cells.title", "Draw & Position Custom Mesh Cells")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_messhi_studio_modal.span.freestyle", "Freestyle")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="messhi_studio_modal_btn_38"
                  defaultIcon={<Sparkles className="w-3.5 h-3.5" />}
                  type="button"
onClick={() => setMeshMode("auto")}
className={cn(
                    "py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer",
                    meshMode === "auto"
                      ? "bg-cyan-500 text-slate-950 font-extrabold shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  )}
title={uiText("components_messhi_studio_modal.button.optical_sprite_boundary_detection.title", "Optical Sprite Boundary Detection")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_messhi_studio_modal.span.auto", "Auto")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>

            {/* MODE 1: GRID CONTROLS */}
            {meshMode === "grid" && (
              <div className="space-y-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
                  <span>{uiText("components_messhi_studio_modal.span.grid_matrix_configuration", "Grid Matrix Configuration")}</span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {gridCols * gridRows}{uiText("components_messhi_studio_modal.span.tiles", " Tiles (")}{gridCols}×{gridRows})
                  </span>
                </div>

                {/* Rows and Cols Steppers */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between text-[10.5px] text-slate-400 font-semibold mb-1">
                      <span>{uiText("components_messhi_studio_modal.span.columns", "Columns:")}</span>
                      <span className="font-mono font-bold text-cyan-300">{gridCols}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CustomizableButton
                        buttonId="messhi_studio_modal_btn_37"
                        defaultLabel={"-"}
                        type="button"
onClick={() => setGridCols((c) => Math.max(1, c - 1))}
className="w-7 h-6 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                      />
                      <input
                        type="range"
                        min="1"
                        max="24"
                        value={gridCols}
                        onChange={(e) => setGridCols(parseInt(e.target.value, 10))}
                        className="flex-1 accent-cyan-400 cursor-pointer"
                      />
                      <CustomizableButton
                        buttonId="messhi_studio_modal_btn_36"
                        defaultLabel={"+"}
                        type="button"
onClick={() => setGridCols((c) => Math.min(32, c + 1))}
className="w-7 h-6 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between text-[10.5px] text-slate-400 font-semibold mb-1">
                      <span>{uiText("components_messhi_studio_modal.span.rows", "Rows:")}</span>
                      <span className="font-mono font-bold text-cyan-300">{gridRows}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CustomizableButton
                        buttonId="messhi_studio_modal_btn_35"
                        defaultLabel={"-"}
                        type="button"
onClick={() => setGridRows((r) => Math.max(1, r - 1))}
className="w-7 h-6 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                      />
                      <input
                        type="range"
                        min="1"
                        max="24"
                        value={gridRows}
                        onChange={(e) => setGridRows(parseInt(e.target.value, 10))}
                        className="flex-1 accent-cyan-400 cursor-pointer"
                      />
                      <CustomizableButton
                        buttonId="messhi_studio_modal_btn_34"
                        defaultLabel={"+"}
                        type="button"
onClick={() => setGridRows((r) => Math.min(32, r + 1))}
className="w-7 h-6 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Matrix Presets */}
                <div>
                  <span className="text-[9.5px] font-semibold text-slate-400 block mb-1">{uiText("components_messhi_studio_modal.span.presets", "Presets:")}</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {[
                      { r: 2, c: 2 },
                      { r: 3, c: 3 },
                      { r: 4, c: 4 },
                      { r: 8, c: 8 },
                      { r: 1, c: 2 },
                      { r: 2, c: 1 },
                      { r: 3, c: 4 },
                      { r: 4, c: 3 },
                    ].map((p) => (
                      <CustomizableButton
                        buttonId="messhi_studio_modal_btn_33"
                        defaultLabel={"×"}
                        key={`${p.r}x${p.c}`}
type="button"
onClick={() => {
                          setGridRows(p.r);
                          setGridCols(p.c);
                        }}
className={cn(
                          "px-2 py-0.5 rounded text-[9.5px] font-mono border transition-all cursor-pointer",
                          gridRows === p.r && gridCols === p.c
                            ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-cyan-300"
                        )}
                      >
                          {(ibcProps) => (
                              <>
                                {p.c}
                              {!ibcProps.isTextHidden ? ibcProps.label : null}
                              {p.r}
                              </>
                            )}
                      </CustomizableButton>
                    ))}
                  </div>
                </div>

                {/* Gutter / Gap Spacing */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60 text-[10px]">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-0.5">
                      <span>{uiText("components_messhi_studio_modal.span.gap_x", "Gap X:")}</span>
                      <span className="font-mono text-cyan-300">{gridGapX}{uiText("components_messhi_studio_modal.span.px_2", "px")}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={gridGapX}
                      onChange={(e) => setGridGapX(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-0.5">
                      <span>{uiText("components_messhi_studio_modal.span.gap_y", "Gap Y:")}</span>
                      <span className="font-mono text-cyan-300">{gridGapY}{uiText("components_messhi_studio_modal.span.px_3", "px")}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={gridGapY}
                      onChange={(e) => setGridGapY(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Convert Grid to Freestyle Button */}
                <CustomizableButton
                  buttonId="messhi_studio_modal_btn_32"
                  defaultIcon={<Sparkles className="w-3 h-3 text-cyan-400" />}
                  type="button"
onClick={handleConvertGridToFreestyle}
className="w-full py-1.5 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm"
                >
                    {() => (
                        <>
                          <span>{uiText("components_messhi_studio_modal.span.convert_to_freestyle_cells", "Convert to Freestyle Cells")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            )}

            {/* MODE 2: DIVIDER LINES CONTROLS */}
            {meshMode === "lines" && (
              <div className="space-y-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
                  <span>{uiText("components_messhi_studio_modal.span.asymmetric_slice_dividers", "Asymmetric Slice Dividers")}</span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {computedCells.length}{uiText("components_messhi_studio_modal.span.sections", " Sections")}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 bg-cyan-950/30 p-2 rounded-lg border border-cyan-800/30">
                  {uiText("components_messhi_studio_modal.div.click_anywhere_on_canvas_to_add_a_cut_line_o", "💡 Click anywhere on canvas to add a cut line, or drag existing lines to reposition!")}
                </div>

                {/* Quick Split Distribution Buttons */}
                <div className="space-y-1.5">
                  <span className="text-[9.5px] font-semibold text-slate-400 block">{uiText("components_messhi_studio_modal.span.snap_presets", "Snap Presets:")}</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <CustomizableButton
                      buttonId="messhi_studio_modal_btn_31"
                      type="button"
onClick={() => {
                        setHorizontalCutLines([50]);
                        setVerticalCutLines([50]);
                      }}
className="py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[10px] font-bold cursor-pointer"
                    >
                        {() => (
                            <>
                              {uiText("components_messhi_studio_modal.button.halves_2_2", "Halves (2×2)")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="messhi_studio_modal_btn_30"
                      type="button"
onClick={() => {
                        setHorizontalCutLines([33.33, 66.66]);
                        setVerticalCutLines([33.33, 66.66]);
                      }}
className="py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[10px] font-bold cursor-pointer"
                    >
                        {() => (
                            <>
                              {uiText("components_messhi_studio_modal.button.rule_of_thirds_3_3", "Rule of Thirds (3×3)")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="messhi_studio_modal_btn_29"
                      type="button"
onClick={() => {
                        setHorizontalCutLines([25, 50, 75]);
                        setVerticalCutLines([25, 50, 75]);
                      }}
className="py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[10px] font-bold cursor-pointer"
                    >
                        {() => (
                            <>
                              {uiText("components_messhi_studio_modal.button.quarters_4_4", "Quarters (4×4)")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="messhi_studio_modal_btn_28"
                      type="button"
onClick={() => {
                        setHorizontalCutLines([38.2, 61.8]);
                        setVerticalCutLines([38.2, 61.8]);
                      }}
className="py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[10px] font-bold cursor-pointer"
                    >
                        {() => (
                            <>
                              {uiText("components_messhi_studio_modal.button.golden_ratio_1_618", "Golden Ratio (1.618)")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                </div>

                {/* Clear Lines */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                  <CustomizableButton
                    buttonId="messhi_studio_modal_btn_27"
                    defaultIcon={<Trash2 className="w-3 h-3" />}
                    type="button"
onClick={() => {
                      setHorizontalCutLines([]);
                      setVerticalCutLines([]);
                    }}
className="text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                      {() => (
                          <>
                            {uiText("components_messhi_studio_modal.button.clear_all_dividers", " Clear All Dividers")}
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>
            )}

            {/* MODE 3: FREESTYLE CELLS CONTROLS */}
            {meshMode === "freestyle" && (
              <div className="space-y-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
                  <span>{uiText("components_messhi_studio_modal.span.freestyle_mesh_boxes", "Freestyle Mesh Boxes")}</span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {freestyleCells.length}{uiText("components_messhi_studio_modal.span.cells", " Cells")}
                  </span>
                </div>

                {/* Add / Clear / Join actions */}
                <div className="grid grid-cols-2 gap-1.5">
                  <CustomizableButton
                    buttonId="messhi_studio_modal_btn_26"
                    defaultIcon={<Plus className="w-3 h-3" />}
                    type="button"
onClick={() => {
                      const newCell: MesshiCell = {
                        id: `fs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                        name: `${slicePrefix || "Mesh"} ${freestyleCells.length + 1}`,
                        x: 25,
                        y: 25,
                        width: 25,
                        height: 25,
                      };
                      setFreestyleCells((prev) => [...prev, newCell]);
                      setSelectedCellIds([newCell.id]);
                    }}
className="py-1 px-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                      {() => (
                          <>
                            {uiText("components_messhi_studio_modal.button.add_box", " Add Box")}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="messhi_studio_modal_btn_25"
                    defaultIcon={<Trash2 className="w-3 h-3" />}
                    type="button"
onClick={() => {
                      if (window.confirm("Clear all freestyle cells?")) {
                        setFreestyleCells([]);
                        setSelectedCellIds([]);
                      }
                    }}
className="py-1 px-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                      {() => (
                          <>
                            {uiText("components_messhi_studio_modal.button.clear_all", " Clear All")}
                          </>
                        )}
                  </CustomizableButton>
                </div>

                {selectedCellIds.length >= 2 && (
                  <CustomizableButton
                    buttonId="messhi_studio_modal_btn_24"
                    defaultIcon={<Combine className="w-3.5 h-3.5 text-cyan-400" />}
                    type="button"
onClick={handleJoinSelectedCells}
className="w-full py-1 px-2 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm animate-in fade-in"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_messhi_studio_modal.span.join", "Join ")}{selectedCellIds.length}{uiText("components_messhi_studio_modal.span.selected_cells", " Selected Cells")}</span>
                          </>
                        )}
                  </CustomizableButton>
                )}

                {/* Preset Arrangements */}
                <div>
                  <span className="text-[9.5px] font-semibold text-slate-400 block mb-1">{uiText("components_messhi_studio_modal.span.arrangement_presets", "Arrangement Presets:")}</span>
                  <div className="grid grid-cols-2 gap-1 text-[9.5px]">
                    <CustomizableButton
                      buttonId="messhi_studio_modal_btn_23"
                      type="button"
onClick={() => {
                        // Bento grid
                        setFreestyleCells([
                          { id: "b1", name: "Hero Large", x: 5, y: 5, width: 45, height: 60 },
                          { id: "b2", name: "Top Right", x: 52, y: 5, width: 43, height: 28 },
                          { id: "b3", name: "Mid Right", x: 52, y: 37, width: 43, height: 28 },
                          { id: "b4", name: "Bottom Span", x: 5, y: 69, width: 90, height: 26 },
                        ]);
                      }}
className="py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 cursor-pointer font-medium"
                    >
                        {() => (
                            <>
                              {uiText("components_messhi_studio_modal.button.bento_4_box", "🍱 Bento 4-Box")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="messhi_studio_modal_btn_22"
                      type="button"
onClick={() => {
                        // Comic 6-panel
                        setFreestyleCells([
                          { id: "c1", name: "Panel 1", x: 5, y: 5, width: 28, height: 42 },
                          { id: "c2", name: "Panel 2", x: 36, y: 5, width: 28, height: 42 },
                          { id: "c3", name: "Panel 3", x: 67, y: 5, width: 28, height: 42 },
                          { id: "c4", name: "Panel 4", x: 5, y: 52, width: 28, height: 42 },
                          { id: "c5", name: "Panel 5", x: 36, y: 52, width: 28, height: 42 },
                          { id: "c6", name: "Panel 6", x: 67, y: 52, width: 28, height: 42 },
                        ]);
                      }}
className="py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 cursor-pointer font-medium"
                    >
                        {() => (
                            <>
                              {uiText("components_messhi_studio_modal.button.comic_6_panel", "💬 Comic 6-Panel")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                </div>
              </div>
            )}

            {/* MODE 4: OPTICAL AUTO-DETECT CONTROLS */}
            {meshMode === "auto" && (
              <div className="space-y-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
                  <span>{uiText("components_messhi_studio_modal.span.optical_alpha_detection", "Optical Alpha Detection")}</span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {freestyleCells.length}{uiText("components_messhi_studio_modal.span.sprites", " Sprites")}
                  </span>
                </div>

                <div className="space-y-2 text-[10px]">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-0.5">
                      <span>{uiText("components_messhi_studio_modal.span.alpha_threshold", "Alpha Threshold:")}</span>
                      <span className="font-mono text-cyan-300">{autoThreshold}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="120"
                      value={autoThreshold}
                      onChange={(e) => setAutoThreshold(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-0.5">
                      <span>{uiText("components_messhi_studio_modal.span.min_sprite_size", "Min Sprite Size:")}</span>
                      <span className="font-mono text-cyan-300">{autoMinSize}{uiText("components_messhi_studio_modal.span.px_4", "px")}</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="120"
                      value={autoMinSize}
                      onChange={(e) => setAutoMinSize(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-0.5">
                      <span>{uiText("components_messhi_studio_modal.span.bounding_padding", "Bounding Padding:")}</span>
                      <span className="font-mono text-cyan-300">{autoPadding}{uiText("components_messhi_studio_modal.span.px_5", "px")}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={autoPadding}
                      onChange={(e) => setAutoPadding(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>

                <CustomizableButton
                  buttonId="messhi_studio_modal_btn_21"
                  defaultIcon={<Sparkles className="w-3.5 h-3.5" />}
                  type="button"
disabled={isProcessing}
onClick={handleRunAutoSpriteDetection}
className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                    {() => (
                        <>
                          <span>{uiText("components_messhi_studio_modal.span.scan_and_detect_sprites", "Scan & Detect Sprites")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            )}

            {/* MESH APPEARANCE & STYLING */}
            <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <CustomizableLabel
                labelId="messhi_studio_modal_item_20"
                as="label"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block"
              >
                  {() => (
                      <>
                        {uiText("components_messhi_studio_modal.label.mesh_line_style_and_display", "Mesh Line Style & Display")}
                      </>
                    )}
              </CustomizableLabel>

              {/* Color Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {MESH_COLOR_PRESETS.map((col) => (
                  <CustomizableButton
                    buttonId="messhi_studio_modal_btn_19"
                    key={col.id}
type="button"
onClick={() => setMeshLineColor(col.hex)}
className={cn(
                      "w-5 h-5 rounded-full border transition-transform cursor-pointer shadow-sm",
                      meshLineColor === col.hex
                        ? "scale-125 ring-2 ring-white border-transparent"
                        : "border-slate-700 hover:scale-110"
                    )}
style={{ backgroundColor: col.hex }}
title={col.name}
                  />
                ))}
              </div>

              {/* Thickness & Style */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                <div>
                  <span className="text-slate-400 block mb-1">{uiText("components_messhi_studio_modal.span.thickness", "Thickness:")}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((w) => (
                      <CustomizableButton
                        buttonId="messhi_studio_modal_btn_18"
                        key={w}
type="button"
onClick={() => setMeshLineWidth(w)}
className={cn(
                          "flex-1 py-0.5 rounded text-[9.5px] font-mono border cursor-pointer",
                          meshLineWidth === w
                            ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400"
                            : "bg-slate-900 text-slate-400 border-slate-800"
                        )}
                      >
                          {() => (
                              <>
                                {w}
                              {uiText("components_messhi_studio_modal.button.px", "px")}
                              </>
                            )}
                      </CustomizableButton>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">{uiText("components_messhi_studio_modal.span.line_pattern", "Line Pattern:")}</span>
                  <div className="flex items-center gap-1">
                    {(["solid", "dashed", "dotted"] as const).map((st) => (
                      <CustomizableButton
                        buttonId="messhi_studio_modal_btn_17"
                        key={st}
type="button"
onClick={() => setMeshLineStyle(st)}
className={cn(
                          "flex-1 py-0.5 rounded text-[9.5px] capitalize border cursor-pointer",
                          meshLineStyle === st
                            ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400"
                            : "bg-slate-900 text-slate-400 border-slate-800"
                        )}
                      >
                          {() => (
                              <>
                                {st}
                              </>
                            )}
                      </CustomizableButton>
                    ))}
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-1.5 pt-1.5 border-t border-slate-800/60 text-[10px]">
                <CustomizableLabel
                  labelId="messhi_studio_modal_item_16"
                  as="label"
                  className="flex items-center justify-between cursor-pointer"
                >
                    {() => (
                        <>
                          <span className="text-slate-300">{uiText("components_messhi_studio_modal.span.show_cell_labels", "Show Cell Labels:")}</span>
                        <input
                    type="checkbox"
                    checked={showCellLabels}
                    onChange={(e) => setShowCellLabels(e.target.checked)}
                    className="accent-cyan-400 rounded cursor-pointer"
                  />
                        </>
                      )}
                </CustomizableLabel>

                {showCellLabels && (
                  <div className="flex items-center gap-1 justify-end">
                    {(["index", "matrix", "dimensions"] as const).map((fmt) => (
                      <CustomizableButton
                        buttonId="messhi_studio_modal_btn_15"
                        key={fmt}
type="button"
onClick={() => setLabelFormat(fmt)}
className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] capitalize border cursor-pointer",
                          labelFormat === fmt
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                            : "bg-slate-900 text-slate-500 border-slate-800"
                        )}
                      >
                          {() => (
                              <>
                                {fmt}
                              </>
                            )}
                      </CustomizableButton>
                    ))}
                  </div>
                )}

                <CustomizableLabel
                  labelId="messhi_studio_modal_item_14"
                  as="label"
                  className="flex items-center justify-between cursor-pointer"
                >
                    {() => (
                        <>
                          <span className="text-slate-300">{uiText("components_messhi_studio_modal.span.alpha_checkerboard", "Alpha Checkerboard:")}</span>
                        <input
                    type="checkbox"
                    checked={showCheckerboard}
                    onChange={(e) => setShowCheckerboard(e.target.checked)}
                    className="accent-cyan-400 rounded cursor-pointer"
                  />
                        </>
                      )}
                </CustomizableLabel>
              </div>
            </div>

            {/* SLICING & DESTINATION CONTROLS */}
            <div className="space-y-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <CustomizableLabel
                labelId="messhi_studio_modal_item_13"
                as="label"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block"
              >
                  {() => (
                      <>
                        {uiText("components_messhi_studio_modal.label.carve_and_export_target", "Carve & Export Target")}
                      </>
                    )}
              </CustomizableLabel>

              <div className="space-y-1.5 text-[10.5px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 w-16 shrink-0">{uiText("components_messhi_studio_modal.span.prefix", "Prefix:")}</span>
                  <input
                    type="text"
                    value={slicePrefix}
                    onChange={(e) => setSlicePrefix(e.target.value)}
                    placeholder={uiText("components_messhi_studio_modal.input.messhi.placeholder", "Messhi")}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono text-[10.5px] focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 w-16 shrink-0">{uiText("components_messhi_studio_modal.span.send_to", "Send To:")}</span>
                  <select
                    value={sliceDestination}
                    onChange={(e) => setSliceDestination(e.target.value as any)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-200 text-[10.5px] focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="storyboard-slices">{uiText("components_messhi_studio_modal.option.storyboard_slices_pool", "Storyboard Slices (Pool)")}</option>
                    <option value="storyboard-slots">{uiText("components_messhi_studio_modal.option.storyboard_frame_slots", "Storyboard Frame Slots")}</option>
                    <option value="multi-crops">{uiText("components_messhi_studio_modal.option.multi_crops_regions", "Multi-Crops Regions")}</option>
                  </select>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="space-y-1.5 pt-1">
                <CustomizableButton
                  buttonId="messhi_studio_modal_btn_12"
                  defaultIcon={<Scissors className="w-4 h-4 text-slate-950" />}
                  type="button"
disabled={isProcessing || computedCells.length === 0}
onClick={() => handlePerformSlicing()}
className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-98 transition-all disabled:opacity-50"
                >
                    {() => (
                        <>
                          <span>{uiText("components_messhi_studio_modal.span.slice_mesh", "Slice Mesh (")}{computedCells.length}{uiText("components_messhi_studio_modal.span.parts", " Parts)")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="messhi_studio_modal_btn_11"
                  defaultIcon={<FileArchive className="w-3.5 h-3.5 text-amber-400" />}
                  type="button"
disabled={isProcessing || computedCells.length === 0}
onClick={handleDownloadAllAsZip}
className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm"
                >
                    {() => (
                        <>
                          <span>{uiText("components_messhi_studio_modal.span.download_slices_as_zip", "Download Slices as ZIP")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>
          </div>

          {/* CENTER INTERACTIVE CANVAS VIEWPORT */}
          <div
            ref={containerRef}
            className={cn(
              "flex-1 flex flex-col relative overflow-hidden bg-[#060a12] select-none",
              showCheckerboard && "bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"
            )}
          >
            {/* Viewport Toolbar Overlay */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl">
              {/* Tool Selection */}
              <CustomizableButton
                buttonId="messhi_studio_modal_btn_10"
                defaultIcon={<MousePointer className="w-4 h-4" />}
                type="button"
onClick={() => setActiveTool("select")}
className={cn(
                  "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeTool === "select"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-400 hover:text-slate-200"
                )}
title={uiText("components_messhi_studio_modal.button.select_tool.title", "Select Tool")}
              />

              <CustomizableButton
                buttonId="messhi_studio_modal_btn_9"
                defaultIcon={<Plus className="w-4 h-4" />}
                type="button"
onClick={() => setActiveTool("draw")}
className={cn(
                  "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeTool === "draw"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-400 hover:text-slate-200"
                )}
title={uiText("components_messhi_studio_modal.button.draw_cell_tool.title", "Draw Cell Tool")}
              />

              <CustomizableButton
                buttonId="messhi_studio_modal_btn_8"
                defaultIcon={<Move className="w-4 h-4" />}
                type="button"
onClick={() => setActiveTool("pan")}
className={cn(
                  "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeTool === "pan"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-400 hover:text-slate-200"
                )}
title={uiText("components_messhi_studio_modal.button.pan_viewport_tool.title", "Pan Viewport Tool")}
              />

              <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />

              {/* Zoom Controls */}
              <CustomizableButton
                buttonId="messhi_studio_modal_btn_7"
                defaultIcon={<ZoomOut className="w-4 h-4" />}
                type="button"
onClick={() => setZoomLevel((z) => Math.max(0.05, Math.round((z - 0.15) * 100) / 100))}
className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
title={uiText("components_messhi_studio_modal.button.zoom_out.title", "Zoom Out (-)")}
              />
              <span className="font-mono text-[10px] text-cyan-300 font-bold px-1 min-w-[40px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <CustomizableButton
                buttonId="messhi_studio_modal_btn_6"
                defaultIcon={<ZoomIn className="w-4 h-4" />}
                type="button"
onClick={() => setZoomLevel((z) => Math.min(5, Math.round((z + 0.15) * 100) / 100))}
className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
title={uiText("components_messhi_studio_modal.button.zoom_in.title", "Zoom In (+)")}
              />
              <CustomizableButton
                buttonId="messhi_studio_modal_btn_5"
                defaultIcon={<Maximize2 className="w-3 h-3" />}
                type="button"
onClick={handleFitToScreen}
className="px-1.5 py-1 text-[9.5px] font-bold text-slate-300 hover:text-cyan-300 bg-slate-900/60 hover:bg-slate-800 rounded border border-slate-800 cursor-pointer flex items-center gap-1"
title={uiText("components_messhi_studio_modal.button.fit_to_screen_full_view.title", "Fit to Screen (Full View)")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_messhi_studio_modal.span.fit", "Fit")}</span>
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="messhi_studio_modal_1_1"
                defaultLabel={"1:1"}
                type="button"
onClick={() => {
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
className="px-1.5 py-1 text-[9.5px] font-bold text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 cursor-pointer"
title={uiText("components_messhi_studio_modal.button.actual_size_1_1_pixels.title", "Actual Size (1:1 Pixels)")}
              />
            </div>

            {/* Coordinates Badge */}
            {cursorCoord && (
              <div className="absolute top-3 right-3 z-20 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800 font-mono text-[9.5px] text-slate-400">
                {uiText("components_messhi_studio_modal.div.x", "X: ")}{cursorCoord.x}{uiText("components_messhi_studio_modal.div.px_y", "px | Y: ")}{cursorCoord.y}{uiText("components_messhi_studio_modal.div.px", "px")}
              </div>
            )}

            {/* Main Interactive Stage */}
            <div
              className="flex-1 flex items-center justify-center overflow-hidden p-6"
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 0.1 : -0.1;
                setZoomLevel((z) => Math.max(0.05, Math.min(5, Math.round((z + delta) * 100) / 100)));
              }}
            >
              <div
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: "center center",
                  transition: isPanning ? "none" : "transform 0.08s ease-out",
                }}
                className="relative flex items-center justify-center shrink-0"
              >
                {currentImageSrc ? (
                  <div
                    style={{
                      width: naturalSize.width ? `${naturalSize.width}px` : "auto",
                      height: naturalSize.height ? `${naturalSize.height}px` : "auto",
                    }}
                    className="relative shadow-2xl border border-slate-800/80 rounded-lg overflow-hidden bg-black/60 shrink-0 select-none"
                  >
                    <img
                      ref={imageElementRef}
                      src={currentImageSrc}
                      alt={uiText("components_messhi_studio_modal.img.mesh_source.alt", "Mesh source")}
                      style={{
                        width: naturalSize.width ? `${naturalSize.width}px` : "100%",
                        height: naturalSize.height ? `${naturalSize.height}px` : "100%",
                      }}
                      className="block object-contain pointer-events-none select-none max-w-none max-h-none"
                    />

                    {/* SVG OVERLAY CANVAS */}
                    <svg
                      className="absolute inset-0 w-full h-full cursor-crosshair"
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      style={{
                        cursor:
                          activeTool === "pan"
                            ? isPanning
                              ? "grabbing"
                              : "grab"
                            : activeTool === "draw"
                            ? "crosshair"
                            : "default",
                      }}
                    >
                      {/* Render Computed Mesh Cells */}
                      {computedCells.map((cell, idx) => {
                        const isSelected = selectedCellIds.length === 0 || selectedCellIds.includes(cell.id);
                        const labelText =
                          labelFormat === "index"
                            ? `#${idx + 1}`
                            : labelFormat === "matrix"
                            ? cell.name?.split(" ")[1] || `#${idx + 1}`
                            : `${Math.round((cell.width / 100) * naturalSize.width)}×${Math.round(
                                (cell.height / 100) * naturalSize.height
                              )}`;

                        return (
                          <g
                            key={cell.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (e.shiftKey) {
                                setSelectedCellIds((prev) =>
                                  prev.includes(cell.id) ? prev.filter((id) => id !== cell.id) : [...prev, cell.id]
                                );
                              } else {
                                setSelectedCellIds([cell.id]);
                              }
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleSliceSingleCell(cell);
                            }}
                            className="cursor-pointer group"
                          >
                            {/* Translucent Cell Fill */}
                            <rect
                              x={`${cell.x}%`}
                              y={`${cell.y}%`}
                              width={`${cell.width}%`}
                              height={`${cell.height}%`}
                              fill={isSelected ? meshLineColor : "transparent"}
                              fillOpacity={isSelected ? cellTintOpacity / 100 : 0.05}
                              stroke={meshLineColor}
                              strokeWidth={meshLineWidth}
                              strokeDasharray={
                                meshLineStyle === "dashed" ? "6 3" : meshLineStyle === "dotted" ? "2 2" : "none"
                              }
                              className="transition-opacity group-hover:fill-opacity-30"
                            />

                            {/* Label Badge */}
                            {showCellLabels && (
                              <g transform={`translate(0, 0)`}>
                                <rect
                                  x={`${cell.x + 0.8}%`}
                                  y={`${cell.y + 0.8}%`}
                                  width="34"
                                  height="18"
                                  rx="3"
                                  fill="#090d16"
                                  fillOpacity="0.85"
                                  stroke={meshLineColor}
                                  strokeWidth="1"
                                />
                                <text
                                  x={`${cell.x + 0.8}%`}
                                  y={`${cell.y + 0.8}%`}
                                  dx="17"
                                  dy="12"
                                  textAnchor="middle"
                                  fill="#ffffff"
                                  fontSize="9"
                                  fontWeight="bold"
                                  fontFamily="monospace"
                                  className="pointer-events-none"
                                >
                                  {labelText}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {/* Asymmetric Cut Lines rendering */}
                      {meshMode === "lines" && (
                        <>
                          {horizontalCutLines.map((line, idx) => (
                            <line
                              key={`h_${idx}`}
                              x1="0%"
                              y1={`${line}%`}
                              x2="100%"
                              y2={`${line}%`}
                              stroke="#ec4899"
                              strokeWidth={meshLineWidth + 1}
                              strokeDasharray="4 2"
                              className="cursor-ns-resize"
                            />
                          ))}
                          {verticalCutLines.map((line, idx) => (
                            <line
                              key={`v_${idx}`}
                              x1={`${line}%`}
                              y1="0%"
                              x2={`${line}%`}
                              y2="100%"
                              stroke="#ec4899"
                              strokeWidth={meshLineWidth + 1}
                              strokeDasharray="4 2"
                              className="cursor-ew-resize"
                            />
                          ))}
                        </>
                      )}

                      {/* Active Drawing Box feedback */}
                      {isDrawingCell && drawStartPos && drawCurrentPos && (
                        <rect
                          x={`${Math.min(drawStartPos.x, drawCurrentPos.x)}%`}
                          y={`${Math.min(drawStartPos.y, drawCurrentPos.y)}%`}
                          width={`${Math.abs(drawCurrentPos.x - drawStartPos.x)}%`}
                          height={`${Math.abs(drawCurrentPos.y - drawStartPos.y)}%`}
                          fill={meshLineColor}
                          fillOpacity="0.25"
                          stroke={meshLineColor}
                          strokeWidth={meshLineWidth + 1}
                          strokeDasharray="4 2"
                        />
                      )}
                    </svg>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 text-center gap-3">
                    <MesshiIcon className="w-12 h-12 text-cyan-400/60" />
                    <span className="text-sm font-bold text-slate-300">{uiText("components_messhi_studio_modal.span.no_image_loaded", "No Image Loaded")}</span>
                    <p className="text-xs text-slate-500 max-w-sm">
                      {uiText("components_messhi_studio_modal.p.upload_an_image_or_send_a_frame_from_storybo", "Upload an image or send a frame from Storyboard/Crop to begin slicing with Messhi.")}
                    </p>
                    <CustomizableLabel
                      labelId="messhi_studio_modal_item_4"
                      as="label"
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-lg"
                    >
                        {() => (
                            <>
                              {uiText("components_messhi_studio_modal.label.upload_image", "Upload Image")}
                            <input type="file" accept="image/*" onChange={handleDirectImageUpload} className="hidden" />
                            </>
                          )}
                    </CustomizableLabel>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT LIVE SLICES PREVIEW DRAWER */}
          <div
            className={cn(
              "bg-[#0b101d] border-l border-slate-800/80 flex flex-col transition-all duration-200 shrink-0",
              isPreviewDrawerOpen ? "w-64 sm:w-72" : "w-10"
            )}
          >
            {/* Drawer Toggle Header */}
            <div className="flex items-center justify-between p-2.5 bg-[#0e1424] border-b border-slate-800">
              <CustomizableButton
                buttonId="messhi_studio_modal_btn_3"
                type="button"
onClick={() => setIsPreviewDrawerOpen((prev) => !prev)}
className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-cyan-300 cursor-pointer"
              >
                  {() => (
                      <>
                        {isPreviewDrawerOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                      {isPreviewDrawerOpen && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{uiText("components_messhi_studio_modal.span.live_slices", "Live Slices (")}{computedCells.length})</span>
                  </span>
                )}
                      </>
                    )}
              </CustomizableButton>

              {isPreviewDrawerOpen && liveSlicePreviews.length > 0 && (
                <CustomizableButton
                  buttonId="messhi_studio_modal_btn_2"
                  defaultIcon={<Download className="w-3.5 h-3.5" />}
                  type="button"
onClick={handleDownloadAllAsZip}
className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800 cursor-pointer"
title={uiText("components_messhi_studio_modal.button.download_all_slices_as_zip.title", "Download All Slices as ZIP")}
                />
              )}
            </div>

            {/* Previews List */}
            {isPreviewDrawerOpen && (
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                {liveSlicePreviews.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {liveSlicePreviews.map((slice, idx) => (
                      <div
                        key={slice.id || idx}
                        onClick={() => setSelectedCellIds([slice.id])}
                        className={cn(
                          "group bg-slate-950/80 border rounded-xl p-1.5 flex flex-col items-center gap-1 cursor-pointer transition-all hover:border-cyan-500/70 shadow-sm",
                          selectedCellIds.includes(slice.id)
                            ? "border-cyan-400 bg-cyan-950/20"
                            : "border-slate-800/80"
                        )}
                      >
                        <div className="w-full aspect-square rounded-lg bg-black/80 flex items-center justify-center overflow-hidden relative">
                          <img
                            src={slice.url}
                            alt={slice.name}
                            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute top-1 left-1 bg-slate-950/80 text-[8px] font-mono text-cyan-300 px-1 py-0.2 rounded border border-cyan-800/40">
                            #{idx + 1}
                          </span>
                        </div>
                        <div className="w-full flex items-center justify-between text-[9px] px-0.5">
                          <span className="text-slate-400 font-mono truncate">{slice.w}×{slice.h}</span>
                          <CustomizableButton
                            buttonId="messhi_studio_modal_btn_1"
                            defaultIcon={<Scissors className="w-2.5 h-2.5" />}
                            type="button"
onClick={(e) => {
                              e.stopPropagation();
                              const targetCell = computedCells.find((c) => c.id === slice.id);
                              if (targetCell) handleSliceSingleCell(targetCell);
                            }}
className="text-slate-400 hover:text-cyan-300 p-0.5"
title={uiText("components_messhi_studio_modal.button.slice_and_send_to_storyboard.title", "Slice & Send to Storyboard")}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 text-[10px] gap-2">
                    <Sparkles className="w-6 h-6 text-slate-600" />
                    <span>{uiText("components_messhi_studio_modal.span.adjust_the_mesh_to_generate_live_slice_previ", "Adjust the mesh to generate live slice previews")}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
