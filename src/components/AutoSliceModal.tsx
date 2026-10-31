import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Sparkles,
  Scissors,
  Sliders,
  Layers,
  Grid,
  Check,
  X,
  RefreshCw,
  Eye,
  Settings2,
  ZoomIn,
  Move,
  LayoutGrid,
  CheckSquare,
  Square,
  Plus,
  Minus,
  RotateCcw,
  MousePointer,
  HelpCircle,
  Link2,
  Combine,
  Trash2,
} from "lucide-react";
import {
  detectSpriteBoundingBoxes,
  DetectedSpriteBox,
  SpriteDetectionOptions,
} from "../utils/imageUtils";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export interface AutoSliceModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onApplyToMultiCrops: (detectedBoxes: DetectedSpriteBox[]) => void;
  onSliceToStoryboard: (detectedBoxes: DetectedSpriteBox[], destination: "storyboard-slices" | "storyboard-slots") => void;
  onConvertToFreestyle: (detectedBoxes: DetectedSpriteBox[]) => void;
}

export const AutoSliceModal: React.FC<AutoSliceModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onApplyToMultiCrops,
  onSliceToStoryboard,
  onConvertToFreestyle,
}) => {
  const [alphaThreshold, setAlphaThreshold] = useState<number>(15);
  const [backgroundMode, setBackgroundMode] = useState<"auto" | "alpha" | "color">("auto");
  const [colorTolerance, setColorTolerance] = useState<number>(25);
  const [customColor, setCustomColor] = useState<string>("#ffffff");
  const [minSize, setMinSize] = useState<number>(10);
  const [mergeDistance, setMergeDistance] = useState<number>(6);
  const [padding, setPadding] = useState<number>(1);
  const [sortOrder, setSortOrder] = useState<"reading" | "left-to-right" | "top-to-bottom" | "area-desc">("reading");

  const [detectedBoxes, setDetectedBoxes] = useState<DetectedSpriteBox[]>([]);
  const [rawDetectedBoxes, setRawDetectedBoxes] = useState<DetectedSpriteBox[]>([]);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [imgNaturalSize, setImgNaturalSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Multi-selection state
  const [selectedBoxIds, setSelectedBoxIds] = useState<Set<string>>(new Set());
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);

  // Active Tool Mode: "auto" (detects Shift for Join/Add, Ctrl for Subtract), "join" (Force Join), "subtract" (Force Subtract)
  const [selectionToolMode, setSelectionToolMode] = useState<"auto" | "join" | "subtract">("auto");

  // Drag selection marquee state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [activeDragAction, setActiveDragAction] = useState<"join" | "subtract" | "select">("join");

  // Live status notice toast
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Track modifier keys for real-time visual indicator
  const [isShiftDown, setIsShiftDown] = useState<boolean>(false);
  const [isCtrlDown, setIsCtrlDown] = useState<boolean>(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Convert hex color to rgb
  const parsedCustomColor = useMemo(() => {
    const hex = customColor.replace("#", "");
    if (hex.length === 6) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      };
    }
    return { r: 255, g: 255, b: 255 };
  }, [customColor]);

  // Load image element when imageSrc changes
  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      imageElementRef.current = img;
      setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
  }, [isOpen, imageSrc]);

  // Quick Selection Actions
  const handleSelectAll = useCallback(() => {
    setSelectedBoxIds(new Set(detectedBoxes.map((b) => b.id)));
  }, [detectedBoxes]);

  const handleDeselectAll = useCallback(() => {
    setSelectedBoxIds(new Set());
  }, []);

  const handleInvertSelection = useCallback(() => {
    setSelectedBoxIds((prev) => {
      const next = new Set<string>();
      detectedBoxes.forEach((b) => {
        if (!prev.has(b.id)) next.add(b.id);
      });
      return next;
    });
  }, [detectedBoxes]);

  // Explicit Join Selected Action (Merges all currently selected boxes into 1 single bounding box)
  const handleJoinSelected = useCallback(() => {
    const selected = detectedBoxes.filter((b) => selectedBoxIds.has(b.id));
    if (selected.length < 2) {
      setNoticeMessage("Select at least 2 boxes to join them together.");
      setTimeout(() => setNoticeMessage(null), 2500);
      return;
    }

    const minX = Math.min(...selected.map((b) => b.x));
    const minY = Math.min(...selected.map((b) => b.y));
    const maxX = Math.max(...selected.map((b) => b.x + b.width));
    const maxY = Math.max(...selected.map((b) => b.y + b.height));
    const width = maxX - minX;
    const height = maxY - minY;
    const imgW = imgNaturalSize.w || 1;
    const imgH = imgNaturalSize.h || 1;

    const joinedBox: DetectedSpriteBox = {
      id: `joined_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x: minX,
      y: minY,
      width,
      height,
      percentX: (minX / imgW) * 100,
      percentY: (minY / imgH) * 100,
      percentWidth: (width / imgW) * 100,
      percentHeight: (height / imgH) * 100,
      pixelCount: selected.reduce((sum, b) => sum + (b.pixelCount || 0), 0) || width * height,
    };

    const selectedIds = new Set(selected.map((b) => b.id));
    setDetectedBoxes((prev) => {
      const remaining = prev.filter((b) => !selectedIds.has(b.id));
      return [...remaining, joinedBox];
    });

    setSelectedBoxIds(new Set([joinedBox.id]));
    setNoticeMessage(`✓ Joined ${selected.length} selections into 1 combined box (${joinedBox.width}×${joinedBox.height}px)!`);
    setTimeout(() => setNoticeMessage(null), 3500);
  }, [detectedBoxes, selectedBoxIds]);

  // Reset to original raw optical detections
  const handleResetToRaw = useCallback(() => {
    if (rawDetectedBoxes.length === 0) return;
    setDetectedBoxes(rawDetectedBoxes);
    setSelectedBoxIds(new Set(rawDetectedBoxes.map((b) => b.id)));
    setNoticeMessage(`✓ Restored ${rawDetectedBoxes.length} original optical detections.`);
    setTimeout(() => setNoticeMessage(null), 3000);
  }, [rawDetectedBoxes]);

  // Listen to modifier keys and keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftDown(true);
      if (e.key === "Control" || e.key === "Meta") setIsCtrlDown(true);
      if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedBoxIds(new Set(detectedBoxes.map((b) => b.id)));
      }
      if ((e.key === "j" || e.key === "J" || e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey) {
        handleJoinSelected();
      }
      if (e.key === "Escape") {
        if (isDragging) {
          setIsDragging(false);
          setDragStart(null);
          setDragCurrent(null);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftDown(false);
      if (e.key === "Control" || e.key === "Meta") setIsCtrlDown(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isOpen, isDragging, detectedBoxes, handleJoinSelected]);

  // Run sprite detection whenever parameters or imageSrc change
  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    let isMounted = true;
    setIsDetecting(true);

    const timer = setTimeout(async () => {
      const options: SpriteDetectionOptions = {
        alphaThreshold,
        backgroundMode,
        backgroundColor: backgroundMode === "color" ? parsedCustomColor : undefined,
        colorTolerance,
        minWidth: minSize,
        minHeight: minSize,
        minArea: Math.max(16, minSize * minSize * 0.4),
        padding,
        mergeDistance,
        sortOrder,
      };

      const boxes = await detectSpriteBoundingBoxes(imageSrc, options);
      if (isMounted) {
        setDetectedBoxes(boxes);
        setRawDetectedBoxes(boxes);
        // By default, select all newly detected boxes
        setSelectedBoxIds(new Set(boxes.map((b) => b.id)));
        setIsDetecting(false);
      }
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    isOpen,
    imageSrc,
    alphaThreshold,
    backgroundMode,
    colorTolerance,
    parsedCustomColor,
    minSize,
    mergeDistance,
    padding,
    sortOrder,
  ]);

  // Helper to check rectangle intersection
  const checkIntersection = useCallback(
    (
      box: DetectedSpriteBox,
      rect: { minX: number; minY: number; maxX: number; maxY: number }
    ) => {
      const boxRight = box.x + box.width;
      const boxBottom = box.y + box.height;
      return !(
        boxRight < rect.minX ||
        box.x > rect.maxX ||
        boxBottom < rect.minY ||
        box.y > rect.maxY
      );
    },
    []
  );

  // Compute current drag marquee rectangle
  const currentMarqueeRect = useMemo(() => {
    if (!isDragging || !dragStart || !dragCurrent) return null;
    const minX = Math.min(dragStart.x, dragCurrent.x);
    const minY = Math.min(dragStart.y, dragCurrent.y);
    const maxX = Math.max(dragStart.x, dragCurrent.x);
    const maxY = Math.max(dragStart.y, dragCurrent.y);
    const width = maxX - minX;
    const height = maxY - minY;
    return { minX, minY, maxX, maxY, width, height };
  }, [isDragging, dragStart, dragCurrent]);

  // Intersecting boxes during active marquee drag
  const intersectingBoxes = useMemo(() => {
    if (!currentMarqueeRect || currentMarqueeRect.width < 2 || currentMarqueeRect.height < 2) {
      return [];
    }
    return detectedBoxes.filter((b) => checkIntersection(b, currentMarqueeRect));
  }, [currentMarqueeRect, detectedBoxes, checkIntersection]);

  const intersectingBoxIds = useMemo(() => {
    return new Set(intersectingBoxes.map((b) => b.id));
  }, [intersectingBoxes]);

  // Union bounding rectangle of all intersecting boxes when in Join / Add mode
  const unionJoinedBounds = useMemo(() => {
    if (activeDragAction !== "join" || intersectingBoxes.length === 0 || !currentMarqueeRect) return null;
    const minX = Math.min(...intersectingBoxes.map((b) => b.x), currentMarqueeRect.minX);
    const minY = Math.min(...intersectingBoxes.map((b) => b.y), currentMarqueeRect.minY);
    const maxX = Math.max(...intersectingBoxes.map((b) => b.x + b.width), currentMarqueeRect.maxX);
    const maxY = Math.max(...intersectingBoxes.map((b) => b.y + b.height), currentMarqueeRect.maxY);
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [activeDragAction, intersectingBoxes, currentMarqueeRect]);

  // Render detection preview overlay on canvas
  useEffect(() => {
    if (!previewCanvasRef.current || !imageElementRef.current || !imgNaturalSize.w) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = imgNaturalSize.w;
    const h = imgNaturalSize.h;
    canvas.width = w;
    canvas.height = h;

    // Draw base image
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(imageElementRef.current, 0, 0, w, h);

    // Draw detected sprite bounding boxes
    detectedBoxes.forEach((box, idx) => {
      const isSelected = selectedBoxIds.has(box.id);
      const isIntersecting = intersectingBoxIds.has(box.id);
      const isHovered = box.id === hoveredBoxId;

      let strokeColor = "#10b981";
      let fillColor = "rgba(16, 185, 129, 0.16)";
      let tagBg = "#047857";
      let tagText = `✓ #${idx + 1} (${box.width}×${box.height})`;
      let lineWidth = 2;
      let lineDash: number[] = [];

      if (isDragging && isIntersecting) {
        if (activeDragAction === "subtract") {
          // Being subtracted
          strokeColor = "#f43f5e";
          fillColor = "rgba(244, 63, 94, 0.32)";
          tagBg = "#be123c";
          tagText = `- #${idx + 1} Subtract`;
          lineWidth = 2.5;
          lineDash = [4, 2];
        } else {
          // Being joined / added
          strokeColor = "#00f0ff";
          fillColor = "rgba(0, 240, 255, 0.28)";
          tagBg = "#0e7490";
          tagText = `🔗 #${idx + 1} Joining`;
          lineWidth = 2.5;
        }
      } else if (isSelected) {
        strokeColor = isHovered ? "#38bdf8" : "#10b981";
        fillColor = isHovered ? "rgba(56, 189, 248, 0.24)" : "rgba(16, 185, 129, 0.16)";
        tagBg = isHovered ? "#0284c7" : "#047857";
        tagText = `✓ #${idx + 1} (${box.width}×${box.height})`;
        lineWidth = isHovered ? 2.5 : 2;
      } else {
        // Deselected / Unselected
        strokeColor = isHovered ? "rgba(148, 163, 184, 0.8)" : "rgba(148, 163, 184, 0.35)";
        fillColor = "rgba(15, 23, 42, 0.35)";
        tagBg = isHovered ? "#475569" : "rgba(51, 65, 85, 0.8)";
        tagText = `#${idx + 1}`;
        lineWidth = 1.5;
        lineDash = [3, 3];
      }

      ctx.setLineDash(lineDash);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = strokeColor;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      ctx.fillStyle = fillColor;
      ctx.fillRect(box.x, box.y, box.width, box.height);

      // Label tag
      ctx.setLineDash([]);
      ctx.font = "bold 10.5px sans-serif";
      const textMetrics = ctx.measureText(tagText);
      const tagW = textMetrics.width + 8;
      const tagH = 15;
      const tagY = Math.max(0, box.y - tagH);

      ctx.fillStyle = tagBg;
      ctx.fillRect(box.x, tagY, tagW, tagH);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(tagText, box.x + 4, tagY + 11.5);
    });

    // Draw Union Preview Box if joining 1+ boxes during drag
    if (unionJoinedBounds && intersectingBoxes.length >= 1) {
      ctx.save();
      ctx.setLineDash([6, 3]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#38bdf8";
      ctx.fillStyle = "rgba(14, 165, 233, 0.12)";
      ctx.fillRect(unionJoinedBounds.x, unionJoinedBounds.y, unionJoinedBounds.width, unionJoinedBounds.height);
      ctx.strokeRect(unionJoinedBounds.x, unionJoinedBounds.y, unionJoinedBounds.width, unionJoinedBounds.height);

      // Corner handles on union preview
      const cornerSize = 8;
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(unionJoinedBounds.x - 4, unionJoinedBounds.y - 4, cornerSize, cornerSize);
      ctx.fillRect(unionJoinedBounds.x + unionJoinedBounds.width - 4, unionJoinedBounds.y - 4, cornerSize, cornerSize);
      ctx.fillRect(unionJoinedBounds.x - 4, unionJoinedBounds.y + unionJoinedBounds.height - 4, cornerSize, cornerSize);
      ctx.fillRect(unionJoinedBounds.x + unionJoinedBounds.width - 4, unionJoinedBounds.y + unionJoinedBounds.height - 4, cornerSize, cornerSize);

      ctx.restore();
    }

    // Draw active drag marquee rectangle
    if (currentMarqueeRect && (currentMarqueeRect.width > 2 || currentMarqueeRect.height > 2)) {
      const { minX, minY, width, height } = currentMarqueeRect;
      const isSubtract = activeDragAction === "subtract";

      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = isSubtract ? "#f43f5e" : "#00f0ff";
      ctx.fillStyle = isSubtract ? "rgba(244, 63, 94, 0.15)" : "rgba(0, 240, 255, 0.15)";

      ctx.fillRect(minX, minY, width, height);
      ctx.strokeRect(minX, minY, width, height);

      // Marquee status badge
      const badgeText = isSubtract
        ? `— Subtracting (${intersectingBoxes.length})`
        : intersectingBoxes.length >= 2
        ? `🔗 Joining ${intersectingBoxes.length} boxes into 1 combined sprite`
        : intersectingBoxes.length === 1
        ? `🔗 Join / Expand box (${intersectingBoxes[0].width}×${intersectingBoxes[0].height})`
        : `+ Add / New Slice (${Math.round(width)}×${Math.round(height)})`;

      ctx.setLineDash([]);
      ctx.font = "bold 11px sans-serif";
      const badgeMetrics = ctx.measureText(badgeText);
      const bW = badgeMetrics.width + 14;
      const bH = 20;
      const bY = Math.max(2, minY - bH - 3);

      ctx.fillStyle = isSubtract ? "rgba(190, 18, 60, 0.95)" : "rgba(14, 116, 144, 0.95)";
      ctx.fillRect(minX, bY, bW, bH);
      ctx.strokeStyle = isSubtract ? "#f43f5e" : "#00f0ff";
      ctx.lineWidth = 1;
      ctx.strokeRect(minX, bY, bW, bH);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(badgeText, minX + 7, bY + 14);
      ctx.restore();
    }
  }, [
    detectedBoxes,
    selectedBoxIds,
    intersectingBoxIds,
    intersectingBoxes,
    unionJoinedBounds,
    hoveredBoxId,
    imgNaturalSize,
    isDragging,
    currentMarqueeRect,
    activeDragAction,
  ]);

  // Convert mouse client coordinates to canvas image natural coordinates
  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!previewCanvasRef.current || !imgNaturalSize.w) return { x: 0, y: 0 };
      const rect = previewCanvasRef.current.getBoundingClientRect();
      const scaleX = imgNaturalSize.w / rect.width;
      const scaleY = imgNaturalSize.h / rect.height;
      const x = Math.max(0, Math.min(imgNaturalSize.w, (e.clientX - rect.left) * scaleX));
      const y = Math.max(0, Math.min(imgNaturalSize.h, (e.clientY - rect.top) * scaleY));
      return { x, y };
    },
    [imgNaturalSize]
  );

  // Mouse Down: Start marquee or identify clicked box
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imgNaturalSize.w) return;
    const { x, y } = getCanvasCoords(e);

    // Determine action mode:
    // 1. Ctrl / Meta key or explicit "subtract" tool => SUBTRACT
    // 2. Shift key or explicit "join" tool => JOIN (Merge selections together)
    // 3. Otherwise: default to JOIN on drag gesture
    let action: "join" | "subtract" | "select" = "join";
    if (e.ctrlKey || e.metaKey || selectionToolMode === "subtract") {
      action = "subtract";
    } else if (e.shiftKey || selectionToolMode === "join") {
      action = "join";
    } else {
      action = "join";
    }

    setActiveDragAction(action);
    setIsDragging(true);
    setDragStart({ x, y });
    setDragCurrent({ x, y });
  };

  // Mouse Move: Update marquee or update hovered sprite box
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imgNaturalSize.w) return;
    const { x, y } = getCanvasCoords(e);

    if (isDragging && dragStart) {
      setDragCurrent({ x, y });
    } else {
      // Find hovered box
      const hovered = detectedBoxes.find(
        (b) => x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height
      );
      setHoveredBoxId(hovered ? hovered.id : null);
    }
  };

  // Mouse Up: Commit marquee join or subtraction or click
  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart || !dragCurrent) {
      setIsDragging(false);
      return;
    }

    const dist = Math.hypot(dragCurrent.x - dragStart.x, dragCurrent.y - dragStart.y);
    const isDragGesture = dist > 5;

    if (isDragGesture) {
      // Marquee Gesture
      const rect = {
        minX: Math.min(dragStart.x, dragCurrent.x),
        minY: Math.min(dragStart.y, dragCurrent.y),
        maxX: Math.max(dragStart.x, dragCurrent.x),
        maxY: Math.max(dragStart.y, dragCurrent.y),
      };

      const touchedBoxes = detectedBoxes.filter((b) => checkIntersection(b, rect));

      if (activeDragAction === "subtract") {
        // Subtract touched boxes from selection
        if (touchedBoxes.length > 0) {
          const touchedIds = new Set(touchedBoxes.map((b) => b.id));
          setSelectedBoxIds((prev) => {
            const next = new Set(prev);
            touchedIds.forEach((id) => next.delete(id));
            return next;
          });
          setNoticeMessage(`— Subtracted ${touchedBoxes.length} sprites from selection`);
          setTimeout(() => setNoticeMessage(null), 2500);
        }
      } else {
        // JOIN / ADD Action: Merge touched boxes together into 1 single bounding box!
        const imgW = imgNaturalSize.w || 1;
        const imgH = imgNaturalSize.h || 1;

        if (touchedBoxes.length >= 2) {
          const minX = Math.min(...touchedBoxes.map((b) => b.x));
          const minY = Math.min(...touchedBoxes.map((b) => b.y));
          const maxX = Math.max(...touchedBoxes.map((b) => b.x + b.width));
          const maxY = Math.max(...touchedBoxes.map((b) => b.y + b.height));
          const width = maxX - minX;
          const height = maxY - minY;

          const joinedBox: DetectedSpriteBox = {
            id: `joined_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            x: minX,
            y: minY,
            width,
            height,
            percentX: (minX / imgW) * 100,
            percentY: (minY / imgH) * 100,
            percentWidth: (width / imgW) * 100,
            percentHeight: (height / imgH) * 100,
            pixelCount: touchedBoxes.reduce((sum, b) => sum + (b.pixelCount || 0), 0) || width * height,
          };

          const touchedIds = new Set(touchedBoxes.map((b) => b.id));
          setDetectedBoxes((prev) => {
            const remaining = prev.filter((b) => !touchedIds.has(b.id));
            return [...remaining, joinedBox];
          });

          setSelectedBoxIds((prev) => {
            const next = new Set(prev);
            touchedIds.forEach((id) => next.delete(id));
            next.add(joinedBox.id);
            return next;
          });

          setNoticeMessage(`✓ Joined ${touchedBoxes.length} sprites together into 1 combined box (${joinedBox.width}×${joinedBox.height}px)!`);
          setTimeout(() => setNoticeMessage(null), 3500);
        } else if (touchedBoxes.length === 1) {
          // Join the single touched box with the dragged marquee area
          const target = touchedBoxes[0];
          const minX = Math.min(target.x, rect.minX);
          const minY = Math.min(target.y, rect.minY);
          const maxX = Math.max(target.x + target.width, rect.maxX);
          const maxY = Math.max(target.y + target.height, rect.maxY);
          const width = maxX - minX;
          const height = maxY - minY;

          const joinedBox: DetectedSpriteBox = {
            id: `joined_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            x: minX,
            y: minY,
            width,
            height,
            percentX: (minX / imgW) * 100,
            percentY: (minY / imgH) * 100,
            percentWidth: (width / imgW) * 100,
            percentHeight: (height / imgH) * 100,
            pixelCount: target.pixelCount || width * height,
          };

          setDetectedBoxes((prev) => {
            const remaining = prev.filter((b) => b.id !== target.id);
            return [...remaining, joinedBox];
          });

          setSelectedBoxIds((prev) => {
            const next = new Set(prev);
            next.delete(target.id);
            next.add(joinedBox.id);
            return next;
          });

          setNoticeMessage(`✓ Joined & expanded sprite box to ${joinedBox.width}×${joinedBox.height}px!`);
          setTimeout(() => setNoticeMessage(null), 3000);
        } else if (rect.maxX - rect.minX > 8 && rect.maxY - rect.minY > 8) {
          // Created a new slice bounding box in empty area
          const width = rect.maxX - rect.minX;
          const height = rect.maxY - rect.minY;
          const newBox: DetectedSpriteBox = {
            id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            x: rect.minX,
            y: rect.minY,
            width,
            height,
            percentX: (rect.minX / imgW) * 100,
            percentY: (rect.minY / imgH) * 100,
            percentWidth: (width / imgW) * 100,
            percentHeight: (height / imgH) * 100,
            pixelCount: width * height,
          };

          setDetectedBoxes((prev) => [...prev, newBox]);
          setSelectedBoxIds((prev) => new Set(prev).add(newBox.id));
          setNoticeMessage(`✓ Added custom slice box (${newBox.width}×${newBox.height}px)!`);
          setTimeout(() => setNoticeMessage(null), 3000);
        }
      }
    } else {
      // Single Click: Toggle or Select
      const clickX = dragStart.x;
      const clickY = dragStart.y;
      const clicked = detectedBoxes.find(
        (b) => clickX >= b.x && clickX <= b.x + b.width && clickY >= b.y && clickY <= b.y + b.height
      );

      if (clicked) {
        setSelectedBoxIds((prev) => {
          const next = new Set(prev);
          if (activeDragAction === "subtract") {
            next.delete(clicked.id);
          } else if (e.shiftKey) {
            // Shift click toggles selection
            if (next.has(clicked.id)) next.delete(clicked.id);
            else next.add(clicked.id);
          } else {
            // Normal click: Toggle
            if (next.has(clicked.id)) {
              next.delete(clicked.id);
            } else {
              next.add(clicked.id);
            }
          }
          return next;
        });
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  };

  const selectedBoxes = useMemo(
    () => detectedBoxes.filter((b) => selectedBoxIds.has(b.id)),
    [detectedBoxes, selectedBoxIds]
  );

  if (!isOpen) return null;

  return (
    <div
      id="auto_slice_modal_overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="auto_slice_modal_container"
        className="relative w-full max-w-5xl bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-emerald-500/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <CustomizableLabel
                labelId="auto_slice_modal_item_21"
                as="h2"
                className="text-sm sm:text-base font-bold text-white flex items-center gap-2"
              >
                  {() => (
                      <>
                        {uiText("components_auto_slice_modal.h2.auto_slicing_via_optical_transparency_and_ed", "Auto-Slicing via Optical Transparency & Edge Detection")}
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-[11px] text-slate-400">
                {uiText("components_auto_slice_modal.p.hold", "Hold ")}<kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[10px] rounded font-bold">{uiText("components_auto_slice_modal.kbd.shift_drag", "Shift + Drag")}</kbd>{uiText("components_auto_slice_modal.p.to", " to ")}<strong>{uiText("components_auto_slice_modal.strong.join_merge_selections_together", "join / merge selections together")}</strong>{uiText("components_auto_slice_modal.p.into_1_combined_slice_and", " into 1 combined slice, and ")}<kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 text-rose-300 font-mono text-[10px] rounded font-bold">{uiText("components_auto_slice_modal.kbd.ctrl_drag", "Ctrl / ⌘ + Drag")}</kbd>{uiText("components_auto_slice_modal.p.to_subtract", " to subtract.")}
              </p>
            </div>
          </div>
          <CustomizableButton
            buttonId="auto_slice_modal_btn_20"
            defaultIcon={<X className="w-5 h-5" />}
            type="button"
onClick={onClose}
className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
title={uiText("components_auto_slice_modal.button.close_auto_slice_modal.title", "Close Auto-Slice Modal")}
          />
        </div>

        {/* Modal Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden min-h-0">
          {/* Left / Main: Live Visual Detection Stage */}
          <div className="lg:col-span-7 bg-slate-950/90 p-3 flex flex-col items-center justify-between border-b lg:border-b-0 lg:border-r border-slate-800 relative overflow-hidden min-h-[340px]">
            {/* Top Selection & Filter Toolbar */}
            <div className="w-full flex items-center justify-between flex-wrap gap-2 mb-2 z-10">
              <div className="flex items-center gap-2">
                <div className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/40 text-[11px] font-mono flex items-center gap-2 shadow-md">
                  <span className="text-emerald-400 font-bold">
                    {selectedBoxes.length} / {detectedBoxes.length}{uiText("components_auto_slice_modal.span.selected", " Selected")}
                  </span>
                  {isDetecting && (
                    <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />{uiText("components_auto_slice_modal.span.scanning", " Scanning...")}
                    </span>
                  )}
                </div>

                {/* Live Modifier Key Indicator Badge */}
                {(isShiftDown || isCtrlDown) && (
                  <span
                    className={cn(
                      "text-[10.5px] font-bold px-2 py-0.5 rounded-md border animate-in fade-in flex items-center gap-1",
                      isCtrlDown
                        ? "bg-rose-950/80 text-rose-300 border-rose-600/50"
                        : "bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-sm"
                    )}
                  >
                    {isCtrlDown ? <Minus className="w-3 h-3 text-rose-400" /> : <Link2 className="w-3 h-3 text-cyan-400" />}
                    <span>{isCtrlDown ? "Subtract Mode (Ctrl)" : "Join Selections (Shift)"}</span>
                  </span>
                )}

                {noticeMessage && (
                  <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/90 border border-cyan-500/40 px-2 py-0.5 rounded-md animate-in fade-in">
                    {noticeMessage}
                  </span>
                )}
              </div>

              {/* Quick Select & Join Buttons */}
              <div className="flex items-center gap-1">
                {/* Tool Mode Pill */}
                <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                  <CustomizableButton
                    buttonId="auto_slice_modal_btn_19"
                    type="button"
onClick={() => setSelectionToolMode("auto")}
className={cn(
                      "px-2 py-1 rounded font-medium transition-all cursor-pointer",
                      selectionToolMode === "auto"
                        ? "bg-slate-700 text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    )}
title={uiText("components_auto_slice_modal.button.auto_mode_hold_shift_to_join_ctrl_to_subtrac.title", "Auto mode: Hold Shift to Join, Ctrl to Subtract")}
                  >
                      {() => (
                          <>
                            {uiText("components_auto_slice_modal.button.auto", "Auto")}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="auto_slice_modal_btn_18"
                    defaultIcon={<Link2 className="w-3 h-3" />}
                    type="button"
onClick={() => setSelectionToolMode("join")}
className={cn(
                      "px-2 py-1 rounded font-medium transition-all flex items-center gap-1 cursor-pointer",
                      selectionToolMode === "join"
                        ? "bg-cyan-600 text-white font-bold"
                        : "text-slate-400 hover:text-cyan-300"
                    )}
title={uiText("components_auto_slice_modal.button.join_mode_marquee_drag_merges_touched_boxes.title", "Join Mode: Marquee drag merges touched boxes together")}
                  >
                      {() => (
                          <>
                            {uiText("components_auto_slice_modal.button.join", " Join")}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="auto_slice_modal_btn_17"
                    defaultIcon={<Minus className="w-3 h-3" />}
                    type="button"
onClick={() => setSelectionToolMode("subtract")}
className={cn(
                      "px-2 py-1 rounded font-medium transition-all flex items-center gap-0.5 cursor-pointer",
                      selectionToolMode === "subtract"
                        ? "bg-rose-600 text-white font-bold"
                        : "text-slate-400 hover:text-rose-300"
                    )}
title={uiText("components_auto_slice_modal.button.force_subtract_mode_marquee_drag_removes_fro.title", "Force Subtract Mode: Marquee drag removes from selection")}
                  >
                      {() => (
                          <>
                            {uiText("components_auto_slice_modal.button.sub", " Sub")}
                          </>
                        )}
                  </CustomizableButton>
                </div>

                {/* Explicit Join Selected Button */}
                <CustomizableButton
                  buttonId="auto_slice_modal_btn_16"
                  defaultIcon={<Combine className="w-3.5 h-3.5 text-cyan-400" />}
                  type="button"
disabled={selectedBoxes.length < 2}
onClick={handleJoinSelected}
className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 disabled:opacity-40 text-cyan-300 hover:text-cyan-100 border border-cyan-500/40 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
title={uiText("components_auto_slice_modal.button.join_selected_boxes_into_1_combined_box_shor.title", "Join Selected Boxes into 1 Combined Box (Shortcut: J or M)")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_auto_slice_modal.span.join", "Join (")}{selectedBoxes.length})</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="auto_slice_modal_btn_15"
                  defaultIcon={<CheckSquare className="w-3 h-3 text-emerald-400" />}
                  type="button"
onClick={handleSelectAll}
className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[10.5px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
title={uiText("components_auto_slice_modal.button.select_all_sprites_ctrl_a.title", "Select All Sprites (Ctrl+A)")}
                >
                    {() => (
                        <>
                          <span className="hidden sm:inline">{uiText("components_auto_slice_modal.span.all", "All")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="auto_slice_modal_btn_14"
                  defaultIcon={<Square className="w-3 h-3 text-slate-400" />}
                  type="button"
onClick={handleDeselectAll}
className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[10.5px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
title={uiText("components_auto_slice_modal.button.deselect_all.title", "Deselect All")}
                >
                    {() => (
                        <>
                          <span className="hidden sm:inline">{uiText("components_auto_slice_modal.span.none", "None")}</span>
                        </>
                      )}
                </CustomizableButton>

                {detectedBoxes.length !== rawDetectedBoxes.length && (
                  <CustomizableButton
                    buttonId="auto_slice_modal_btn_13"
                    defaultIcon={<RotateCcw className="w-3 h-3 text-amber-400" />}
                    type="button"
onClick={handleResetToRaw}
className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-lg text-[10.5px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
title={uiText("components_auto_slice_modal.button.reset_to_original_optical_scan.title", "Reset to Original Optical Scan")}
                  >
                      {() => (
                          <>
                            <span className="hidden sm:inline">{uiText("components_auto_slice_modal.span.reset", "Reset")}</span>
                          </>
                        )}
                  </CustomizableButton>
                )}
              </div>
            </div>

            {/* Canvas Container with Checkerboard Background */}
            <div className="w-full flex-1 flex items-center justify-center overflow-auto p-2 min-h-0">
              <div className="relative border border-emerald-500/30 rounded-lg shadow-2xl max-w-full max-h-full overflow-hidden bg-[linear-gradient(45deg,#0f172a_25%,transparent_25%),linear-gradient(-45deg,#0f172a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0f172a_75%),linear-gradient(-45deg,transparent_75%,#0f172a_75%)] bg-[size:16px_16px] bg-[#020617] select-none">
                <canvas
                  ref={previewCanvasRef}
                  className="max-w-full max-h-[50vh] object-contain block cursor-crosshair"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={() => {
                    if (isDragging) {
                      setIsDragging(false);
                      setDragStart(null);
                      setDragCurrent(null);
                    }
                    setHoveredBoxId(null);
                  }}
                />
              </div>
            </div>

            {/* Gesture Tip Bar */}
            <div className="w-full flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80 mt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-cyan-300 font-medium">
                  <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 text-cyan-300 font-mono rounded font-bold">{uiText("components_auto_slice_modal.kbd.shift_drag_2", "Shift + Drag")}</kbd>
                  <span>{uiText("components_auto_slice_modal.span.join_selections_together", "🔗 Join Selections Together")}</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-rose-300 font-medium">
                  <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 text-rose-300 font-mono rounded font-bold">{uiText("components_auto_slice_modal.kbd.ctrl_drag_2", "Ctrl / ⌘ + Drag")}</kbd>
                  <span>{uiText("components_auto_slice_modal.span.subtract", "— Subtract")}</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{uiText("components_auto_slice_modal.span.press", "Press ")}<kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 font-mono rounded">{uiText("components_auto_slice_modal.kbd.j", "J")}</kbd>{uiText("components_auto_slice_modal.span.to_join_selected", " to join selected")}</span>
              </div>
              <span className="font-mono text-slate-500 text-[9.5px]">
                {imgNaturalSize.w} × {imgNaturalSize.h}{uiText("components_auto_slice_modal.span.px", " px")}
              </span>
            </div>
          </div>

          {/* Right / Sidebar: Detection Sensitivity & Tuning Parameters */}
          <div className="lg:col-span-5 p-3 sm:p-4 space-y-3.5 overflow-y-auto max-h-[60vh] lg:max-h-full bg-slate-900/60">
            {/* Background Keying Mode */}
            <div className="space-y-1.5">
              <CustomizableLabel
                labelId="auto_slice_modal_item_12"
                defaultIcon={<Eye className="w-3.5 h-3.5 text-emerald-400" />}
                as="label"
                className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5"
              >
                  {() => (
                      <>
                        {uiText("components_auto_slice_modal.label.background_detection_mode", "Background Detection Mode")}
                      </>
                    )}
              </CustomizableLabel>
              <div className="grid grid-cols-3 gap-1.5">
                <CustomizableButton
                  buttonId="auto_slice_modal_btn_11"
                  type="button"
onClick={() => setBackgroundMode("auto")}
className={cn(
                    "py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                    backgroundMode === "auto"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm"
                      : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                  )}
                >
                    {() => (
                        <>
                          {uiText("components_auto_slice_modal.button.auto_detect", "Auto-Detect")}
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="auto_slice_modal_btn_10"
                  type="button"
onClick={() => setBackgroundMode("alpha")}
className={cn(
                    "py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                    backgroundMode === "alpha"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm"
                      : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                  )}
                >
                    {() => (
                        <>
                          {uiText("components_auto_slice_modal.button.transparency", "Transparency")}
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="auto_slice_modal_btn_9"
                  type="button"
onClick={() => setBackgroundMode("color")}
className={cn(
                    "py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                    backgroundMode === "color"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm"
                      : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                  )}
                >
                    {() => (
                        <>
                          {uiText("components_auto_slice_modal.button.solid_color", "Solid Color")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>

            {/* Custom Background Color Picker (if color mode) */}
            {backgroundMode === "color" && (
              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">{uiText("components_auto_slice_modal.span.keying_color", "Keying Color:")}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent"
                    />
                    <span className="font-mono text-xs text-slate-300">{customColor.toUpperCase()}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{uiText("components_auto_slice_modal.span.color_tolerance", "Color Tolerance:")}</span>
                    <span className="text-emerald-400 font-mono font-bold">{colorTolerance}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={colorTolerance}
                    onChange={(e) => setColorTolerance(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Alpha Threshold Sensitivity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  {uiText("components_auto_slice_modal.span.alpha_threshold_sensitivity", "Alpha Threshold (Sensitivity)")}
                </span>
                <span className="text-emerald-400 font-mono font-bold text-xs">
                  {alphaThreshold} / 255
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="255"
                value={alphaThreshold}
                onChange={(e) => setAlphaThreshold(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <p className="text-[9.5px] text-slate-500">
                {uiText("components_auto_slice_modal.p.higher_values_ignore_faint_anti_aliasing_art", "Higher values ignore faint anti-aliasing artifacts; lower values detect subtle glow/shadows.")}
              </p>
            </div>

            {/* Proximity Merge Distance */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-cyan-400" />
                  {uiText("components_auto_slice_modal.span.proximity_merge_distance", "Proximity Merge Distance")}
                </span>
                <span className="text-cyan-400 font-mono font-bold text-xs">
                  {mergeDistance}{uiText("components_auto_slice_modal.span.px_2", " px")}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                value={mergeDistance}
                onChange={(e) => setMergeDistance(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <p className="text-[9.5px] text-slate-500">
                {uiText("components_auto_slice_modal.p.merges_floating_weapon_limb_pixels_into_the", "Merges floating weapon/limb pixels into the character's primary bounding box.")}
              </p>
            </div>

            {/* Minimum Size & Padding Controls */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-400 font-medium">{uiText("components_auto_slice_modal.span.min_size", "Min Size:")}</span>
                  <span className="text-slate-200 font-mono">{minSize}{uiText("components_auto_slice_modal.span.px_3", "px")}</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="128"
                  value={minSize}
                  onChange={(e) => setMinSize(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-400 font-medium">{uiText("components_auto_slice_modal.span.box_padding", "Box Padding:")}</span>
                  <span className="text-slate-200 font-mono">+{padding}{uiText("components_auto_slice_modal.span.px_4", "px")}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  value={padding}
                  onChange={(e) => setPadding(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer h-1 bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            {/* Sort Order Selector */}
            <div className="space-y-1 pt-1">
              <CustomizableLabel
                labelId="auto_slice_modal_item_8"
                as="label"
                className="text-[10.5px] font-medium text-slate-400 block"
              >
                  {() => (
                      <>
                        {uiText("components_auto_slice_modal.label.detected_sprite_sequence_order", "Detected Sprite Sequence Order:")}
                      </>
                    )}
              </CustomizableLabel>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="reading">{uiText("components_auto_slice_modal.option.natural_reading_order_row_by_row", "Natural Reading Order (Row by Row)")}</option>
                <option value="left-to-right">{uiText("components_auto_slice_modal.option.left_to_right_columns_first", "Left to Right (Columns first)")}</option>
                <option value="top-to-bottom">{uiText("components_auto_slice_modal.option.top_to_bottom", "Top to Bottom")}</option>
                <option value="area-desc">{uiText("components_auto_slice_modal.option.largest_area_first", "Largest Area First")}</option>
              </select>
            </div>

            {/* Detected Slices Pill Preview */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span className="flex items-center gap-1">
                  <span>{uiText("components_auto_slice_modal.span.detected_sprites", "Detected Sprites")}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">({detectedBoxes.length})</span>
                </span>
                {selectedBoxes.length >= 2 && (
                  <CustomizableButton
                    buttonId="auto_slice_modal_btn_7"
                    defaultIcon={<Combine className="w-3 h-3" />}
                    type="button"
onClick={handleJoinSelected}
className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-600/40"
                  >
                      {() => (
                          <>
                            {uiText("components_auto_slice_modal.button.join_2", " Join ")}
                          {selectedBoxes.length}
                          {uiText("components_auto_slice_modal.button.selected", " Selected")}
                          </>
                        )}
                  </CustomizableButton>
                )}
              </div>
              <div className="max-h-28 overflow-y-auto bg-slate-950 p-1.5 rounded-lg border border-slate-800 flex flex-wrap gap-1">
                {detectedBoxes.map((box, idx) => {
                  const isSelected = selectedBoxIds.has(box.id);
                  return (
                    <CustomizableButton
                      buttonId="auto_slice_modal_btn_6"
                      key={box.id}
type="button"
onClick={() => {
                        setSelectedBoxIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(box.id)) next.delete(box.id);
                          else next.add(box.id);
                          return next;
                        });
                      }}
onMouseEnter={() => setHoveredBoxId(box.id)}
onMouseLeave={() => setHoveredBoxId(null)}
className={cn(
                        "px-2 py-1 rounded text-[10.5px] font-mono flex items-center gap-1.5 border transition-all cursor-pointer",
                        isSelected
                          ? "bg-emerald-950 text-emerald-300 border-emerald-500/50 font-bold"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                      )}
                    >
                        {() => (
                            <>
                              <span>#{idx + 1}</span>
                            <span className="text-[9.5px] opacity-75">{box.width}×{box.height}</span>
                            </>
                          )}
                    </CustomizableButton>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="text-emerald-400 font-bold">{selectedBoxes.length}</span>
            <span>{uiText("components_auto_slice_modal.span.of", "of ")}{detectedBoxes.length}{uiText("components_auto_slice_modal.span.sprites_selected_for_action", " sprites selected for action")}</span>
            {selectedBoxes.length >= 2 && (
              <CustomizableButton
                buttonId="auto_slice_modal_btn_5"
                defaultIcon={<Combine className="w-3.5 h-3.5 text-cyan-400" />}
                type="button"
onClick={handleJoinSelected}
className="text-[11px] text-cyan-300 hover:text-cyan-200 font-bold flex items-center gap-1 cursor-pointer bg-cyan-950/90 px-2 py-0.5 rounded border border-cyan-500/40 ml-1"
title={uiText("components_auto_slice_modal.button.join_selected_boxes_into_1_combined_box_j.title", "Join selected boxes into 1 combined box (J)")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_auto_slice_modal.span.join_selected", "Join Selected")}</span>
                      </>
                    )}
              </CustomizableButton>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Convert to Freestyle */}
            <CustomizableButton
              buttonId="auto_slice_modal_btn_4"
              defaultIcon={<Grid className="w-3.5 h-3.5 text-cyan-400" />}
              type="button"
disabled={selectedBoxes.length === 0}
onClick={() => {
                onConvertToFreestyle(selectedBoxes);
                onClose();
              }}
className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer transition-colors flex items-center gap-1.5"
            >
                {() => (
                    <>
                      <span>{uiText("components_auto_slice_modal.span.to_freestyle_mesh", "To Freestyle Mesh (")}{selectedBoxes.length})</span>
                    </>
                  )}
            </CustomizableButton>

            {/* Apply to Multi-Crops */}
            <CustomizableButton
              buttonId="auto_slice_modal_btn_3"
              defaultIcon={<Layers className="w-3.5 h-3.5 text-indigo-400" />}
              type="button"
disabled={selectedBoxes.length === 0}
onClick={() => {
                onApplyToMultiCrops(selectedBoxes);
                onClose();
              }}
className="px-3.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 disabled:opacity-40 text-indigo-300 border border-indigo-500/50 hover:border-indigo-400 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
                {() => (
                    <>
                      <span>{uiText("components_auto_slice_modal.span.apply_to_multi_crops", "Apply to Multi-Crops (")}{selectedBoxes.length})</span>
                    </>
                  )}
            </CustomizableButton>

            {/* Direct Slice to Storyboard Slices */}
            <CustomizableButton
              buttonId="auto_slice_modal_btn_2"
              defaultIcon={<LayoutGrid className="w-3.5 h-3.5" />}
              type="button"
disabled={selectedBoxes.length === 0}
onClick={() => {
                onSliceToStoryboard(selectedBoxes, "storyboard-slices");
                onClose();
              }}
className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
            >
                {() => (
                    <>
                      <span>{uiText("components_auto_slice_modal.span.slice_to_slices_pool", "Slice to Slices Pool (")}{selectedBoxes.length})</span>
                    </>
                  )}
            </CustomizableButton>

            {/* Direct Slice to Storyboard Slots */}
            <CustomizableButton
              buttonId="auto_slice_modal_btn_1"
              defaultIcon={<Scissors className="w-3.5 h-3.5" />}
              type="button"
disabled={selectedBoxes.length === 0}
onClick={() => {
                onSliceToStoryboard(selectedBoxes, "storyboard-slots");
                onClose();
              }}
className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 rounded-lg text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer transition-all flex items-center gap-1.5"
            >
                {() => (
                    <>
                      <span>{uiText("components_auto_slice_modal.span.auto_slice_to_storyboard_slots", "Auto-Slice to Storyboard Slots (")}{selectedBoxes.length})</span>
                    </>
                  )}
            </CustomizableButton>
          </div>
        </div>
      </div>
    </div>
  );
};
