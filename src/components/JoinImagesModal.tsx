import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  ArrowRight,
  ArrowDown,
  Layers,
  Download,
  Upload,
  MoveUp,
  MoveDown,
  Sparkles,
  Maximize2,
  RefreshCw,
  Copy,
  Check,
  Split,
  Image as ImageIcon,
  Grid,
  CheckSquare,
  Square,
  Search,
  Filter,
  ArrowLeftRight,
  ArrowUpDown,
  Sliders,
  Eye,
  ZoomIn,
  ZoomOut,
  Palette,
  CheckCircle2,
} from "lucide-react";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export interface JoinImageItem {
  id: string;
  name: string;
  url: string;
  width?: number;
  height?: number;
}

export type JoinDirection = "horizontal" | "vertical" | "grid";
export type ScaleMode = "match-dimension" | "original" | "fit-max";
export type AlignmentMode = "start" | "center" | "end";

interface JoinImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImages?: Array<{ url: string; name?: string }>;
  availableSlices?: Array<{ url: string; name?: string }>;
  onApplyJoinedImage?: (dataUrl: string, name: string) => void;
  onAddToStoryboard?: (slice: { url: string; name: string }) => void;
}

export function JoinImagesModal({
  isOpen,
  onClose,
  initialImages = [],
  availableSlices = [],
  onApplyJoinedImage,
  onAddToStoryboard,
}: JoinImagesModalProps) {
  // Current Stitching Queue
  const [items, setItems] = useState<JoinImageItem[]>([]);

  // Active Tab for Left Panel: "pool" (Carved Slices Pool), "queue" (Stitching Sequence), "settings" (Stitch Settings)
  const [activeTab, setActiveTab] = useState<"pool" | "queue" | "settings">("pool");

  // Multi-selection state in Carved Slices Pool
  const [selectedPoolIndices, setSelectedPoolIndices] = useState<Set<number>>(new Set());
  const [poolSearchQuery, setPoolSearchQuery] = useState<string>("");

  // Stitch Options
  const [direction, setDirection] = useState<JoinDirection>("horizontal");
  const [scaleMode, setScaleMode] = useState<ScaleMode>("match-dimension");
  const [alignment, setAlignment] = useState<AlignmentMode>("center");
  const [spacing, setSpacing] = useState<number>(0);
  const [gridCols, setGridCols] = useState<number>(2);
  const [bgColor, setBgColor] = useState<string>("transparent");
  const [customBgHex, setCustomBgHex] = useState<string>("#020617");
  const [exportFormat, setExportFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/png");
  const [exportQuality, setExportQuality] = useState<number>(0.92);
  const [outputName, setOutputName] = useState<string>("joined-sprites");
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Zoom / Preview Viewport State
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [autoFitPreview, setAutoFitPreview] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [outputDimensions, setOutputDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Filtered Carved Slices Pool based on search query
  const filteredPoolSlices = useMemo(() => {
    if (!poolSearchQuery.trim()) {
      return availableSlices.map((slice, index) => ({ slice, originalIndex: index }));
    }
    const q = poolSearchQuery.toLowerCase().trim();
    return availableSlices
      .map((slice, index) => ({ slice, originalIndex: index }))
      .filter(({ slice, originalIndex }) => {
        const name = (slice.name || `Slice ${originalIndex + 1}`).toLowerCase();
        return name.includes(q) || `#${originalIndex + 1}`.includes(q);
      });
  }, [availableSlices, poolSearchQuery]);

  // Counts of each slice currently present in items queue
  const poolUsageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      counts.set(item.url, (counts.get(item.url) || 0) + 1);
    });
    return counts;
  }, [items]);

  // Initialize items when opened with initial images
  useEffect(() => {
    if (isOpen) {
      if (initialImages.length > 0 && items.length === 0) {
        const mapped = initialImages.map((img, idx) => ({
          id: `join_item_${Date.now()}_${idx}`,
          name: img.name || `Image ${idx + 1}`,
          url: img.url,
        }));
        setItems(mapped);
      } else if (availableSlices.length > 0 && items.length === 0) {
        // If no initial images, switch default tab to 'pool' so user sees all carved slices immediately
        setActiveTab("pool");
      }
    }
  }, [isOpen]);

  // Load image natural dimensions for each item in the queue
  useEffect(() => {
    let isCancelled = false;
    items.forEach((item, index) => {
      if (!item.width || !item.height) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          if (!isCancelled) {
            setItems((prev) => {
              const next = [...prev];
              if (next[index] && next[index].id === item.id) {
                next[index] = { ...next[index], width: img.naturalWidth, height: img.naturalHeight };
              }
              return next;
            });
          }
        };
        img.src = item.url;
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [items.map((i) => i.id).join(",")]);

  // Render composite joined image to canvas
  useEffect(() => {
    if (!isOpen || items.length === 0) {
      setPreviewDataUrl(null);
      setOutputDimensions({ width: 0, height: 0 });
      return;
    }

    let isCancelled = false;
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    items.forEach((item, idx) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (isCancelled) return;
        loadedImages[idx] = img;
        loadedCount++;
        if (loadedCount === items.length) {
          renderComposite(loadedImages);
        }
      };
      img.onerror = () => {
        if (isCancelled) return;
        loadedCount++;
        if (loadedCount === items.length) {
          renderComposite(loadedImages.filter(Boolean));
        }
      };
      img.src = item.url;
    });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, items, direction, scaleMode, alignment, spacing, gridCols, bgColor, customBgHex, exportFormat, exportQuality]);

  const renderComposite = (images: HTMLImageElement[]) => {
    if (!images || images.length === 0) return;

    let targetWidth = 0;
    let targetHeight = 0;
    const count = images.length;

    // Sizing & positioning
    let drawInfos: Array<{ img: HTMLImageElement; x: number; y: number; w: number; h: number }> = [];

    if (direction === "horizontal") {
      // Horizontal Stitching (Width concatenation)
      let baseHeight = images[0].naturalHeight || 300;
      if (scaleMode === "match-dimension") {
        baseHeight = Math.max(...images.map((img) => img.naturalHeight || 1));
      }

      let currentX = 0;
      let maxHeight = 0;

      images.forEach((img) => {
        let drawW = img.naturalWidth || 1;
        let drawH = img.naturalHeight || 1;

        if (scaleMode === "match-dimension") {
          const ratio = baseHeight / (img.naturalHeight || 1);
          drawH = baseHeight;
          drawW = Math.round((img.naturalWidth || 1) * ratio);
        }

        maxHeight = Math.max(maxHeight, drawH);
        drawInfos.push({ img, x: currentX, y: 0, w: drawW, h: drawH });
        currentX += drawW + spacing;
      });

      targetWidth = Math.max(1, currentX - (spacing > 0 ? spacing : 0));
      targetHeight = maxHeight;

      // Adjust vertical alignment
      drawInfos = drawInfos.map((info) => {
        let y = 0;
        if (alignment === "center") {
          y = Math.round((targetHeight - info.h) / 2);
        } else if (alignment === "end") {
          y = targetHeight - info.h;
        }
        return { ...info, y };
      });
    } else if (direction === "vertical") {
      // Vertical Stitching (Height concatenation)
      let baseWidth = images[0].naturalWidth || 300;
      if (scaleMode === "match-dimension") {
        baseWidth = Math.max(...images.map((img) => img.naturalWidth || 1));
      }

      let currentY = 0;
      let maxWidth = 0;

      images.forEach((img) => {
        let drawW = img.naturalWidth || 1;
        let drawH = img.naturalHeight || 1;

        if (scaleMode === "match-dimension") {
          const ratio = baseWidth / (img.naturalWidth || 1);
          drawW = baseWidth;
          drawH = Math.round((img.naturalHeight || 1) * ratio);
        }

        maxWidth = Math.max(maxWidth, drawW);
        drawInfos.push({ img, x: 0, y: currentY, w: drawW, h: drawH });
        currentY += drawH + spacing;
      });

      targetWidth = maxWidth;
      targetHeight = Math.max(1, currentY - (spacing > 0 ? spacing : 0));

      // Adjust horizontal alignment
      drawInfos = drawInfos.map((info) => {
        let x = 0;
        if (alignment === "center") {
          x = Math.round((targetWidth - info.w) / 2);
        } else if (alignment === "end") {
          x = targetWidth - info.w;
        }
        return { ...info, x };
      });
    } else {
      // Grid Stitching
      const cols = Math.max(1, gridCols);
      const rows = Math.ceil(count / cols);
      const cellWidth = Math.max(...images.map((img) => img.naturalWidth || 1));
      const cellHeight = Math.max(...images.map((img) => img.naturalHeight || 1));

      targetWidth = cols * cellWidth + (cols - 1) * spacing;
      targetHeight = rows * cellHeight + (rows - 1) * spacing;

      images.forEach((img, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = col * (cellWidth + spacing);
        const y = row * (cellHeight + spacing);

        let drawW = img.naturalWidth || 1;
        let drawH = img.naturalHeight || 1;

        if (scaleMode === "match-dimension") {
          const ratio = Math.min(cellWidth / (img.naturalWidth || 1), cellHeight / (img.naturalHeight || 1));
          drawW = Math.round((img.naturalWidth || 1) * ratio);
          drawH = Math.round((img.naturalHeight || 1) * ratio);
        }

        const offsetX = alignment === "center" ? Math.round((cellWidth - drawW) / 2) : alignment === "end" ? cellWidth - drawW : 0;
        const offsetY = alignment === "center" ? Math.round((cellHeight - drawH) / 2) : alignment === "end" ? cellHeight - drawH : 0;

        drawInfos.push({
          img,
          x: x + offsetX,
          y: y + offsetY,
          w: drawW,
          h: drawH,
        });
      });
    }

    // Create / use canvas
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, targetWidth);
    canvas.height = Math.max(1, targetHeight);
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Fill background
    const effectiveBg = bgColor === "custom" ? customBgHex : bgColor;
    if (effectiveBg !== "transparent") {
      ctx.fillStyle = effectiveBg;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else {
      ctx.clearRect(0, 0, targetWidth, targetHeight);
    }

    // Draw images
    drawInfos.forEach(({ img, x, y, w, h }) => {
      ctx.drawImage(img, x, y, w, h);
    });

    const dataUrl = canvas.toDataURL(exportFormat, exportQuality);
    setPreviewDataUrl(dataUrl);
    setOutputDimensions({ width: targetWidth, height: targetHeight });
  };

  // Carved Slices Pool Actions
  const handleAddSingleSlice = (slice: { url: string; name?: string }, originalIndex: number) => {
    const newItem: JoinImageItem = {
      id: `join_item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: slice.name || `Slice #${originalIndex + 1}`,
      url: slice.url,
    };
    setItems((prev) => [...prev, newItem]);
    setCopiedNotification(`Added "${newItem.name}" to Join Queue!`);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  const handleTogglePoolSelect = (index: number) => {
    setSelectedPoolIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSelectAllPool = () => {
    const allIndices = new Set(filteredPoolSlices.map((f) => f.originalIndex));
    setSelectedPoolIndices(allIndices);
  };

  const handleDeselectAllPool = () => {
    setSelectedPoolIndices(new Set());
  };

  const handleInvertPoolSelection = () => {
    setSelectedPoolIndices((prev) => {
      const next = new Set<number>();
      filteredPoolSlices.forEach(({ originalIndex }) => {
        if (!prev.has(originalIndex)) {
          next.add(originalIndex);
        }
      });
      return next;
    });
  };

  const handleAddSelectedPoolSlices = () => {
    if (selectedPoolIndices.size === 0) return;
    const slicesToAdd: JoinImageItem[] = [];
    // Maintain ascending order of selection
    Array.from(selectedPoolIndices)
      .sort((a, b) => a - b)
      .forEach((idx) => {
        const slice = availableSlices[idx];
        if (slice) {
          slicesToAdd.push({
            id: `join_item_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
            name: slice.name || `Slice #${idx + 1}`,
            url: slice.url,
          });
        }
      });

    setItems((prev) => [...prev, ...slicesToAdd]);
    setSelectedPoolIndices(new Set());
    setCopiedNotification(`Added ${slicesToAdd.length} slice(s) to Join Queue!`);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  const handleAddAllCarvedSlices = () => {
    if (availableSlices.length === 0) return;
    const slicesToAdd: JoinImageItem[] = availableSlices.map((slice, idx) => ({
      id: `join_item_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      name: slice.name || `Slice #${idx + 1}`,
      url: slice.url,
    }));
    setItems((prev) => [...prev, ...slicesToAdd]);
    setCopiedNotification(`Added all ${slicesToAdd.length} Carved Slices to Join Queue!`);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  // Reorder & Queue handlers
  const handleMove = (index: number, delta: number) => {
    const newIdx = index + delta;
    if (newIdx < 0 || newIdx >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[newIdx];
      next[newIdx] = temp;
      return next;
    });
  };

  const handleMoveToBoundary = (index: number, position: "top" | "bottom") => {
    if (position === "top" && index === 0) return;
    if (position === "bottom" && index === items.length - 1) return;
    setItems((prev) => {
      const item = prev[index];
      const remaining = prev.filter((_, i) => i !== index);
      return position === "top" ? [item, ...remaining] : [...remaining, item];
    });
  };

  const handleReverseQueue = () => {
    setItems((prev) => [...prev].reverse());
    setCopiedNotification("Reversed joining order!");
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearQueue = () => {
    if (items.length === 0) return;
    setItems([]);
    setCopiedNotification("Cleared joining queue");
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  const handleDuplicate = (item: JoinImageItem) => {
    setItems((prev) => [
      ...prev,
      {
        ...item,
        id: `join_item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: `${item.name} (Copy)`,
      },
    ]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const url = event.target.result as string;
          setItems((prev) => [
            ...prev,
            {
              id: `join_item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name: file.name.replace(/\.[^/.]+$/, ""),
              url,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
    setCopiedNotification(`Imported ${files.length} custom file(s)!`);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  const handleDownload = () => {
    if (!previewDataUrl) return;
    const a = document.createElement("a");
    a.href = previewDataUrl;
    const ext = exportFormat === "image/jpeg" ? "jpg" : exportFormat === "image/webp" ? "webp" : "png";
    a.download = `${outputName || "joined-sprites"}.${ext}`;
    a.click();
  };

  const handleApplyToCanvas = () => {
    if (!previewDataUrl) return;
    if (onApplyJoinedImage) {
      onApplyJoinedImage(previewDataUrl, outputName || "joined-sprites");
    }
    onClose();
  };

  const handleAddJoinedToStoryboard = () => {
    if (!previewDataUrl) return;
    if (onAddToStoryboard) {
      onAddToStoryboard({ url: previewDataUrl, name: outputName || "Joined Sprites" });
      setCopiedNotification("✓ Added joined composite to Storyboard!");
      setTimeout(() => setCopiedNotification(null), 3000);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!previewDataUrl) return;
    try {
      const res = await fetch(previewDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopiedNotification("✓ Image copied to clipboard!");
      setTimeout(() => setCopiedNotification(null), 3000);
    } catch (err) {
      console.error("Failed to copy image blob:", err);
      // Fallback
      navigator.clipboard.writeText(previewDataUrl);
      setCopiedNotification("✓ Data URL copied to clipboard!");
      setTimeout(() => setCopiedNotification(null), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="join_images_modal_overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="join_images_modal_container"
        className="bg-[#0b1329] border border-cyan-500/40 rounded-2xl w-full max-w-7xl h-[94vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-cyan-400/20 text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-[#070e20] border-b border-cyan-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-sm shrink-0">
              <Split className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CustomizableLabel
                  labelId="join_images_modal_item_46"
                  as="h2"
                  className="text-base font-bold text-slate-100 flex items-center gap-2"
                >
                    {() => (
                        <>
                          {uiText("components_join_images_modal.h2.join_stitch_images", "Join / Stitch Images")}
                        </>
                      )}
                </CustomizableLabel>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {uiText("components_join_images_modal.span.visual_slices_picker", "Visual Slices Picker")}
                </span>
                <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                  {uiText("components_join_images_modal.span.stitch_horizontal_vertical_or_grid_sprite_st", "• Stitch horizontal, vertical, or grid sprite strips")}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 sm:hidden">
                {uiText("components_join_images_modal.p.visually_pick_carved_slices_and_stitch_into", "Visually pick carved slices & stitch into composite sheets")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {copiedNotification && (
              <span className="text-xs text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-700/50 px-2.5 py-1 rounded-md animate-pulse shadow-sm">
                {copiedNotification}
              </span>
            )}
            <CustomizableButton
              buttonId="join_images_modal_btn_45"
              defaultIcon={<X className="w-5 h-5" />}
              type="button"
onClick={onClose}
className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
title={uiText("components_join_images_modal.button.close_join_dialog.title", "Close Join Dialog")}
            />
          </div>
        </div>

        {/* Modal Main Body: Dual-Pane Interface */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Left Panel: Tabs for Visual Carved Slices Pool, Stitch Queue & Settings */}
          <div className="w-full lg:w-[460px] xl:w-[500px] border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-[#070d1d] flex flex-col shrink-0 overflow-hidden">
            {/* Navigation Tabs Header */}
            <div className="grid grid-cols-3 p-1.5 bg-slate-950/80 border-b border-slate-800/80 gap-1 shrink-0">
              <CustomizableButton
                buttonId="join_images_modal_btn_44"
                defaultIcon={<ImageIcon className="w-3.5 h-3.5" />}
                type="button"
onClick={() => setActiveTab("pool")}
className={cn(
                  "py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === "pool"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                )}
title={uiText("components_join_images_modal.button.browse_and_visually_pick_slices_from_the_sto.title", "Browse & visually pick slices from the Storyboard Carved Slices pool")}
              >
                  {() => (
                      <>
                        <span className="truncate">{uiText("components_join_images_modal.span.carved_slices", "Carved Slices (")}{availableSlices.length})</span>
                      </>
                    )}
              </CustomizableButton>

              <CustomizableButton
                buttonId="join_images_modal_btn_43"
                defaultIcon={<Layers className="w-3.5 h-3.5" />}
                type="button"
onClick={() => setActiveTab("queue")}
className={cn(
                  "py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative",
                  activeTab === "queue"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                )}
title={uiText("components_join_images_modal.button.view_and_reorder_currently_queued_images_for.title", "View and reorder currently queued images for stitching")}
              >
                  {() => (
                      <>
                        <span className="truncate">{uiText("components_join_images_modal.span.stitch_queue", "Stitch Queue")}</span>
                      {items.length > 0 && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold",
                      activeTab === "queue"
                        ? "bg-slate-950 text-cyan-300"
                        : "bg-cyan-500/30 text-cyan-300 border border-cyan-500/40"
                    )}
                  >
                    {items.length}
                  </span>
                )}
                      </>
                    )}
              </CustomizableButton>

              <CustomizableButton
                buttonId="join_images_modal_btn_42"
                defaultIcon={<Sliders className="w-3.5 h-3.5" />}
                type="button"
onClick={() => setActiveTab("settings")}
className={cn(
                  "py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === "settings"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                )}
title={uiText("components_join_images_modal.button.configure_stitch_direction_spacing_alignment.title", "Configure stitch direction, spacing, alignment, and gap colors")}
              >
                  {() => (
                      <>
                        <span className="truncate">{uiText("components_join_images_modal.span.settings", "Settings")}</span>
                      </>
                    )}
              </CustomizableButton>
            </div>

            {/* TAB 1: VISUAL CARVED SLICES POOL */}
            {activeTab === "pool" && (
              <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-2.5">
                {/* Search & Batch Actions Toolbar */}
                <div className="space-y-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={poolSearchQuery}
                        onChange={(e) => setPoolSearchQuery(e.target.value)}
                        placeholder={uiText("components_join_images_modal.input.search_slices_by_name_or.placeholder", "Search slices by name or #...")}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
                      />
                      {poolSearchQuery && (
                        <CustomizableButton
                          buttonId="join_images_modal_btn_41"
                          defaultIcon={<X className="w-3 h-3" />}
                          type="button"
onClick={() => setPoolSearchQuery("")}
className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        />
                      )}
                    </div>

                    <CustomizableButton
                      buttonId="join_images_modal_btn_40"
                      defaultIcon={<Upload className="w-3.5 h-3.5" />}
                      type="button"
onClick={() => fileInputRef.current?.click()}
className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
title={uiText("components_join_images_modal.button.upload_custom_image_files_from_your_computer.title", "Upload custom image files from your computer to join")}
                    >
                        {() => (
                            <>
                              <span>{uiText("components_join_images_modal.span.upload", "Upload")}</span>
                            </>
                          )}
                    </CustomizableButton>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Batch Selection & Action Row */}
                  <div className="flex items-center justify-between gap-1.5 flex-wrap bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-[11px]">
                    <div className="flex items-center gap-1">
                      <CustomizableButton
                        buttonId="join_images_modal_btn_39"
                        type="button"
onClick={handleSelectAllPool}
className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md font-medium transition-colors cursor-pointer"
title={uiText("components_join_images_modal.button.select_all_visible_slices_in_the_pool.title", "Select all visible slices in the pool")}
                      >
                          {() => (
                              <>
                                {uiText("components_join_images_modal.button.select_all", "Select All")}
                              </>
                            )}
                      </CustomizableButton>
                      <CustomizableButton
                        buttonId="join_images_modal_btn_38"
                        type="button"
onClick={handleDeselectAllPool}
disabled={selectedPoolIndices.size === 0}
className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white rounded-md font-medium transition-colors cursor-pointer"
title={uiText("components_join_images_modal.button.deselect_all.title", "Deselect all")}
                      >
                          {() => (
                              <>
                                {uiText("components_join_images_modal.button.clear", "Clear")}
                              </>
                            )}
                      </CustomizableButton>
                      <CustomizableButton
                        buttonId="join_images_modal_btn_37"
                        type="button"
onClick={handleInvertPoolSelection}
className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md font-medium transition-colors cursor-pointer"
title={uiText("components_join_images_modal.button.invert_current_pool_selection.title", "Invert current pool selection")}
                      >
                          {() => (
                              <>
                                {uiText("components_join_images_modal.button.invert", "Invert")}
                              </>
                            )}
                      </CustomizableButton>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {selectedPoolIndices.size > 0 ? (
                        <CustomizableButton
                          buttonId="join_images_modal_btn_36"
                          defaultIcon={<Plus className="w-3.5 h-3.5" />}
                          type="button"
onClick={handleAddSelectedPoolSlices}
className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-md transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                        >
                            {() => (
                                <>
                                  <span>{uiText("components_join_images_modal.span.add_selected", "Add Selected (")}{selectedPoolIndices.size})</span>
                                </>
                              )}
                        </CustomizableButton>
                      ) : (
                        <CustomizableButton
                          buttonId="join_images_modal_btn_35"
                          defaultIcon={<Plus className="w-3.5 h-3.5" />}
                          type="button"
onClick={handleAddAllCarvedSlices}
disabled={availableSlices.length === 0}
className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-md transition-all shadow-sm flex items-center gap-1 cursor-pointer"
title={uiText("components_join_images_modal.button.add_all_carved_slices_to_stitch_queue.title", "Add all carved slices to stitch queue")}
                        >
                            {() => (
                                <>
                                  <span>{uiText("components_join_images_modal.span.add_all", "Add All (")}{availableSlices.length})</span>
                                </>
                              )}
                        </CustomizableButton>
                      )}
                    </div>
                  </div>
                </div>

                {/* Visual Thumbnail Grid of Carved Slices */}
                <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
                  {availableSlices.length === 0 ? (
                    <div className="h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                      <ImageIcon className="w-10 h-10 text-slate-600 mb-2" />
                      <p className="text-sm font-semibold text-slate-300">{uiText("components_join_images_modal.p.no_carved_slices_in_storyboard", "No Carved Slices in Storyboard")}</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs">
                        {uiText("components_join_images_modal.p.slice_an_image_in_carve_crop_mode_or_click_u", "Slice an image in Carve / Crop mode or click Upload above to add custom image files.")}
                      </p>
                      <CustomizableButton
                        buttonId="join_images_modal_btn_34"
                        defaultIcon={<Upload className="w-3.5 h-3.5" />}
                        type="button"
onClick={() => fileInputRef.current?.click()}
className="mt-3 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                          {() => (
                              <>
                                <span>{uiText("components_join_images_modal.span.upload_images_to_join", "Upload Images to Join")}</span>
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  ) : filteredPoolSlices.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      {uiText("components_join_images_modal.div.no_slices_match", "No slices match \"")}{poolSearchQuery}".
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-2">
                      {filteredPoolSlices.map(({ slice, originalIndex }) => {
                        const isSelected = selectedPoolIndices.has(originalIndex);
                        const usageCount = poolUsageCounts.get(slice.url) || 0;

                        return (
                          <div
                            key={`pool_${originalIndex}_${slice.url.substring(0, 32)}`}
                            className={cn(
                              "relative group flex flex-col rounded-xl border p-2 bg-slate-900/90 hover:bg-slate-900 transition-all cursor-pointer select-none",
                              isSelected
                                ? "border-cyan-400 ring-2 ring-cyan-500/40 bg-cyan-950/30"
                                : "border-slate-800 hover:border-slate-700"
                            )}
                            onClick={() => handleTogglePoolSelect(originalIndex)}
                            onDoubleClick={() => handleAddSingleSlice(slice, originalIndex)}
                          >
                            {/* Card Top Header: Slice Index & Multi-Select Checkbox */}
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                #{originalIndex + 1}
                              </span>

                              <div className="flex items-center gap-1">
                                {usageCount > 0 && (
                                  <span
                                    className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5"
                                    title={`Already in Stitch Queue (${usageCount}x)`}
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                    <span>{usageCount}{uiText("components_join_images_modal.span.x", "x")}</span>
                                  </span>
                                )}

                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePoolSelect(originalIndex);
                                  }}
                                  className={cn(
                                    "w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer",
                                    isSelected
                                      ? "bg-cyan-500 text-slate-950"
                                      : "border border-slate-700 hover:border-slate-500 bg-slate-950 text-transparent"
                                  )}
                                >
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              </div>
                            </div>

                            {/* Slice Thumbnail with Transparency Checkerboard */}
                            <div className="w-full h-24 bg-[linear-gradient(45deg,#0f172a_25%,transparent_25%),linear-gradient(-45deg,#0f172a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0f172a_75%),linear-gradient(-45deg,transparent_75%,#0f172a_75%)] bg-[size:10px_10px] bg-[#020617] rounded-lg border border-slate-800/80 p-1 flex items-center justify-center overflow-hidden relative shadow-inner">
                              <img
                                src={slice.url}
                                alt={slice.name || `Slice ${originalIndex + 1}`}
                                className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105"
                                loading="lazy"
                              />

                              {/* Quick Hover Add Button */}
                              <CustomizableButton
                                buttonId="join_images_modal_btn_33"
                                defaultIcon={<Plus className="w-5 h-5 text-cyan-300" />}
                                type="button"
onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddSingleSlice(slice, originalIndex);
                                }}
className="absolute inset-0 bg-cyan-950/80 text-cyan-200 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity backdrop-blur-[2px] font-bold text-xs cursor-pointer"
title={uiText("components_join_images_modal.button.click_to_append_this_slice_to_the_stitch_que.title", "Click to append this slice to the Stitch Queue")}
                              >
                                  {() => (
                                      <>
                                        <span>{uiText("components_join_images_modal.span.add_to_queue", "+ Add to Queue")}</span>
                                      </>
                                    )}
                              </CustomizableButton>
                            </div>

                            {/* Slice Name / Caption */}
                            <div className="mt-1.5 flex items-center justify-between gap-1">
                              <span
                                className="text-[11px] font-semibold text-slate-200 truncate flex-1"
                                title={slice.name || `Slice ${originalIndex + 1}`}
                              >
                                {slice.name || `Slice ${originalIndex + 1}`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Status Bar */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
                  <span>
                    {uiText("components_join_images_modal.span.pool", "Pool: ")}<strong className="text-slate-200">{availableSlices.length}</strong>{uiText("components_join_images_modal.span.slices", " slices")}
                  </span>
                  <CustomizableButton
                    buttonId="join_images_modal_btn_32"
                    defaultIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    type="button"
onClick={() => setActiveTab("queue")}
className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_join_images_modal.span.view_stitch_queue", "View Stitch Queue (")}{items.length})</span>
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>
            )}

            {/* TAB 2: STITCHING QUEUE & REORDERING */}
            {activeTab === "queue" && (
              <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3">
                {/* Queue Header & Actions */}
                <div className="flex items-center justify-between shrink-0 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      {uiText("components_join_images_modal.span.stitch_sequence", "Stitch Sequence (")}{items.length})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <CustomizableButton
                      buttonId="join_images_modal_btn_31"
                      defaultIcon={<ArrowLeftRight className="w-3 h-3 text-cyan-400" />}
                      type="button"
onClick={handleReverseQueue}
disabled={items.length < 2}
className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
title={uiText("components_join_images_modal.button.reverse_the_order_of_images_in_queue.title", "Reverse the order of images in queue")}
                    >
                        {() => (
                            <>
                              <span>{uiText("components_join_images_modal.span.reverse", "Reverse")}</span>
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="join_images_modal_btn_30"
                      defaultIcon={<Trash2 className="w-3 h-3 text-rose-400" />}
                      type="button"
onClick={handleClearQueue}
disabled={items.length === 0}
className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 disabled:opacity-40 text-rose-300 hover:text-rose-100 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
title={uiText("components_join_images_modal.button.clear_all_images_from_queue.title", "Clear all images from queue")}
                    >
                        {() => (
                            <>
                              <span>{uiText("components_join_images_modal.span.clear", "Clear")}</span>
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                </div>

                {/* Queue Items Ordered List */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                  {items.length === 0 ? (
                    <div className="h-full min-h-[200px] flex flex-col items-center justify-center p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                      <ImageIcon className="w-10 h-10 text-slate-600 mb-2" />
                      <p className="text-sm font-semibold text-slate-300">{uiText("components_join_images_modal.p.stitch_queue_is_empty", "Stitch Queue is Empty")}</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs">
                        {uiText("components_join_images_modal.p.pick_slices_from_the_carved_slices_pool_or_u", "Pick slices from the \"Carved Slices\" pool or upload image files to stitch together.")}
                      </p>
                      <CustomizableButton
                        buttonId="join_images_modal_btn_29"
                        defaultIcon={<ImageIcon className="w-3.5 h-3.5" />}
                        type="button"
onClick={() => setActiveTab("pool")}
className="mt-3 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                          {() => (
                              <>
                                <span>{uiText("components_join_images_modal.span.browse_carved_slices", "Browse Carved Slices (")}{availableSlices.length})</span>
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  ) : (
                    items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-xl transition-all group shadow-sm"
                      >
                        {/* Sequence Number Badge */}
                        <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-cyan-400 shrink-0">
                          {idx + 1}
                        </span>

                        {/* Thumbnail */}
                        <div className="w-11 h-11 rounded-lg bg-[linear-gradient(45deg,#0f172a_25%,transparent_25%),linear-gradient(-45deg,#0f172a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0f172a_75%),linear-gradient(-45deg,transparent_75%,#0f172a_75%)] bg-[size:8px_8px] bg-[#020617] border border-slate-800 shrink-0 p-0.5 flex items-center justify-center overflow-hidden">
                          <img
                            src={item.url}
                            alt={item.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>

                        {/* Name & Sizing */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{item.name}</p>
                          {item.width && item.height && (
                            <p className="text-[10px] font-mono text-slate-400">
                              {item.width} × {item.height}{uiText("components_join_images_modal.p.px", " px")}
                            </p>
                          )}
                        </div>

                        {/* Reorder & Action Controls */}
                        <div className="flex items-center gap-0.5 shrink-0 opacity-85 group-hover:opacity-100">
                          <CustomizableButton
                            buttonId="join_images_modal_btn_28"
                            defaultIcon={<MoveUp className="w-3.5 h-3.5" />}
                            type="button"
onClick={() => handleMove(idx, -1)}
disabled={idx === 0}
className="p-1.5 text-slate-400 hover:text-cyan-300 disabled:opacity-30 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
title={uiText("components_join_images_modal.button.move_up_in_sequence.title", "Move Up in Sequence")}
                          />
                          <CustomizableButton
                            buttonId="join_images_modal_btn_27"
                            defaultIcon={<MoveDown className="w-3.5 h-3.5" />}
                            type="button"
onClick={() => handleMove(idx, 1)}
disabled={idx === items.length - 1}
className="p-1.5 text-slate-400 hover:text-cyan-300 disabled:opacity-30 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
title={uiText("components_join_images_modal.button.move_down_in_sequence.title", "Move Down in Sequence")}
                          />
                          <CustomizableButton
                            buttonId="join_images_modal_btn_26"
                            defaultIcon={<Copy className="w-3.5 h-3.5" />}
                            type="button"
onClick={() => handleDuplicate(item)}
className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
title={uiText("components_join_images_modal.button.duplicate_slice_in_queue.title", "Duplicate Slice in Queue")}
                          />
                          <CustomizableButton
                            buttonId="join_images_modal_btn_25"
                            defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                            type="button"
onClick={() => handleRemove(item.id)}
className="p-1.5 text-rose-400 hover:text-rose-200 rounded-lg hover:bg-rose-950/40 cursor-pointer transition-colors"
title={uiText("components_join_images_modal.button.remove_from_queue.title", "Remove from Queue")}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Bottom Add Options */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
                  <CustomizableButton
                    buttonId="join_images_modal_btn_24"
                    defaultIcon={<Plus className="w-3.5 h-3.5" />}
                    type="button"
onClick={() => setActiveTab("pool")}
className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_join_images_modal.span.pick_more_slices", "Pick More Slices")}</span>
                          </>
                        )}
                  </CustomizableButton>

                  <CustomizableButton
                    buttonId="join_images_modal_btn_23"
                    defaultIcon={<Sliders className="w-3.5 h-3.5" />}
                    type="button"
onClick={() => setActiveTab("settings")}
className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_join_images_modal.span.adjust_stitch_settings", "Adjust Stitch Settings")}</span>
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>
            )}

            {/* TAB 3: STITCH SETTINGS */}
            {activeTab === "settings" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {/* Join Direction */}
                <div className="space-y-1.5">
                  <CustomizableLabel
                    labelId="join_images_modal_item_22"
                    as="label"
                    className="text-xs font-bold text-slate-300 uppercase tracking-wider"
                  >
                      {() => (
                          <>
                            {uiText("components_join_images_modal.label.join_direction", "Join Direction")}
                          </>
                        )}
                  </CustomizableLabel>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
                    <CustomizableButton
                      buttonId="join_images_modal_btn_21"
                      defaultIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      type="button"
onClick={() => setDirection("horizontal")}
className={cn(
                        "flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        direction === "horizontal"
                          ? "bg-cyan-600 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      )}
title={uiText("components_join_images_modal.button.horizontal_side_by_side_sprite_strip.title", "Horizontal (Side-by-Side Sprite Strip)")}
                    >
                        {() => (
                            <>
                              <span>{uiText("components_join_images_modal.span.horizontal_h", "Horizontal (H)")}</span>
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="join_images_modal_btn_20"
                      defaultIcon={<ArrowDown className="w-3.5 h-3.5" />}
                      type="button"
onClick={() => setDirection("vertical")}
className={cn(
                        "flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        direction === "vertical"
                          ? "bg-cyan-600 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      )}
title={uiText("components_join_images_modal.button.vertical_stacked_column.title", "Vertical (Stacked Column)")}
                    >
                        {() => (
                            <>
                              <span>{uiText("components_join_images_modal.span.vertical_v", "Vertical (V)")}</span>
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="join_images_modal_btn_19"
                      defaultIcon={<Grid className="w-3.5 h-3.5" />}
                      type="button"
onClick={() => setDirection("grid")}
className={cn(
                        "flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        direction === "grid"
                          ? "bg-cyan-600 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      )}
title={uiText("components_join_images_modal.button.grid_matrix_layout.title", "Grid Matrix Layout")}
                    >
                        {() => (
                            <>
                              <span>{uiText("components_join_images_modal.span.grid_matrix", "Grid Matrix")}</span>
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                </div>

                {/* Grid Columns (if Grid mode) */}
                {direction === "grid" && (
                  <div className="space-y-1.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <CustomizableLabel
                        labelId="join_images_modal_item_18"
                        as="label"
                        className="text-xs font-semibold text-slate-300"
                      >
                          {() => (
                              <>
                                {uiText("components_join_images_modal.label.grid_columns", "Grid Columns")}
                              </>
                            )}
                      </CustomizableLabel>
                      <span className="text-xs font-mono font-bold text-cyan-400">{gridCols}{uiText("components_join_images_modal.span.columns", " Columns")}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={8}
                      value={gridCols}
                      onChange={(e) => setGridCols(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{uiText("components_join_images_modal.span.1_col", "1 Col")}</span>
                      <span>{uiText("components_join_images_modal.span.4_cols", "4 Cols")}</span>
                      <span>{uiText("components_join_images_modal.span.8_cols", "8 Cols")}</span>
                    </div>
                  </div>
                )}

                {/* Dimension Scaling */}
                <div className="space-y-1.5">
                  <CustomizableLabel
                    labelId="join_images_modal_item_17"
                    as="label"
                    className="text-xs font-semibold text-slate-300"
                  >
                      {() => (
                          <>
                            {uiText("components_join_images_modal.label.dimension_scaling", "Dimension Scaling")}
                          </>
                        )}
                  </CustomizableLabel>
                  <select
                    value={scaleMode}
                    onChange={(e) => setScaleMode(e.target.value as ScaleMode)}
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="match-dimension">
                      {direction === "horizontal"
                        ? "Match Height (Equal Vertical Size across sprites)"
                        : "Match Width (Equal Horizontal Size across sprites)"}
                    </option>
                    <option value="original">{uiText("components_join_images_modal.option.keep_individual_original_resolutions", "Keep Individual Original Resolutions")}</option>
                  </select>
                </div>

                {/* Alignment */}
                <div className="space-y-1.5">
                  <CustomizableLabel
                    labelId="join_images_modal_item_16"
                    as="label"
                    className="text-xs font-semibold text-slate-300"
                  >
                      {() => (
                          <>
                            {uiText("components_join_images_modal.label.alignment", "Alignment")}
                          </>
                        )}
                  </CustomizableLabel>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["start", "center", "end"] as AlignmentMode[]).map((mode) => (
                      <CustomizableButton
                        buttonId="join_images_modal_btn_15"
                        key={mode}
type="button"
onClick={() => setAlignment(mode)}
className={cn(
                          "py-1.5 text-xs rounded-lg border capitalize transition-all font-semibold cursor-pointer",
                          alignment === mode
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                        )}
                      >
                          {() => (
                              <>
                                {mode}
                              </>
                            )}
                      </CustomizableButton>
                    ))}
                  </div>
                </div>

                {/* Spacing / Gap Slider with Presets */}
                <div className="space-y-1.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <CustomizableLabel
                      labelId="join_images_modal_item_14"
                      as="label"
                      className="text-xs font-semibold text-slate-300"
                    >
                        {() => (
                            <>
                              {uiText("components_join_images_modal.label.spacing_gap", "Spacing / Gap")}
                            </>
                          )}
                    </CustomizableLabel>
                    <span className="text-xs font-mono font-bold text-cyan-400">{spacing}{uiText("components_join_images_modal.span.px", " px")}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={64}
                    value={spacing}
                    onChange={(e) => setSpacing(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex items-center gap-1 pt-1">
                    {[0, 2, 4, 8, 16, 24, 32].map((gap) => (
                      <CustomizableButton
                        buttonId="join_images_modal_btn_13"
                        key={gap}
type="button"
onClick={() => setSpacing(gap)}
className={cn(
                          "px-2 py-0.5 text-[10px] font-mono rounded border transition-all cursor-pointer",
                          spacing === gap
                            ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                        )}
                      >
                          {() => (
                              <>
                                {gap}
                              {uiText("components_join_images_modal.button.px", "px")}
                              </>
                            )}
                      </CustomizableButton>
                    ))}
                  </div>
                </div>

                {/* Background Gap Color */}
                <div className="space-y-1.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <CustomizableLabel
                    labelId="join_images_modal_item_12"
                    as="label"
                    className="text-xs font-semibold text-slate-300"
                  >
                      {() => (
                          <>
                            {uiText("components_join_images_modal.label.background_gap_color", "Background Gap Color")}
                          </>
                        )}
                  </CustomizableLabel>
                  <div className="grid grid-cols-4 gap-1.5">
                    <CustomizableButton
                      buttonId="join_images_modal_btn_11"
                      type="button"
onClick={() => setBgColor("transparent")}
className={cn(
                        "py-1.5 text-xs rounded-lg border transition-all font-medium cursor-pointer text-center",
                        bgColor === "transparent"
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                      )}
                    >
                        {() => (
                            <>
                              {uiText("components_join_images_modal.button.transparent", "Transparent")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="join_images_modal_btn_10"
                      type="button"
onClick={() => setBgColor("#000000")}
className={cn(
                        "py-1.5 text-xs rounded-lg border transition-all font-medium cursor-pointer text-center",
                        bgColor === "#000000"
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                      )}
                    >
                        {() => (
                            <>
                              {uiText("components_join_images_modal.button.black", "Black")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="join_images_modal_btn_9"
                      type="button"
onClick={() => setBgColor("#ffffff")}
className={cn(
                        "py-1.5 text-xs rounded-lg border transition-all font-medium cursor-pointer text-center",
                        bgColor === "#ffffff"
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                      )}
                    >
                        {() => (
                            <>
                              {uiText("components_join_images_modal.button.white", "White")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="join_images_modal_btn_8"
                      defaultIcon={<Palette className="w-3 h-3" />}
                      type="button"
onClick={() => setBgColor("custom")}
className={cn(
                        "py-1.5 text-xs rounded-lg border transition-all font-medium cursor-pointer text-center flex items-center justify-center gap-1",
                        bgColor === "custom"
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                      )}
                    >
                        {() => (
                            <>
                              <span>{uiText("components_join_images_modal.span.custom", "Custom")}</span>
                            </>
                          )}
                    </CustomizableButton>
                  </div>

                  {bgColor === "custom" && (
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="color"
                        value={customBgHex}
                        onChange={(e) => setCustomBgHex(e.target.value)}
                        className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customBgHex}
                        onChange={(e) => setCustomBgHex(e.target.value)}
                        className="flex-1 bg-slate-950 text-xs px-2.5 py-1 rounded-lg border border-slate-700 font-mono text-slate-200"
                        placeholder="#000000"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Live Joined Composite Preview & Output Controls */}
          <div className="flex-1 flex flex-col bg-[#040814] overflow-hidden relative">
            {/* Live Preview Info Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#070e20] border-b border-slate-800/80 text-xs shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{uiText("components_join_images_modal.span.live_joined_preview", "Live Joined Preview")}</span>
                </div>
                {outputDimensions.width > 0 && (
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {outputDimensions.width} × {outputDimensions.height}{uiText("components_join_images_modal.span.px_2", " px")}
                  </span>
                )}
              </div>

              {/* Sizing & Filename Bar */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                  <CustomizableButton
                    buttonId="join_images_modal_btn_7"
                    defaultIcon={<ZoomOut className="w-3.5 h-3.5" />}
                    type="button"
onClick={() => setPreviewZoom((z) => Math.max(0.25, z - 0.25))}
className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
title={uiText("components_join_images_modal.button.zoom_out.title", "Zoom Out")}
                  />
                  <span className="text-[10px] font-mono text-slate-300 w-10 text-center">
                    {Math.round(previewZoom * 100)}%
                  </span>
                  <CustomizableButton
                    buttonId="join_images_modal_btn_6"
                    defaultIcon={<ZoomIn className="w-3.5 h-3.5" />}
                    type="button"
onClick={() => setPreviewZoom((z) => Math.min(4, z + 0.25))}
className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
title={uiText("components_join_images_modal.button.zoom_in.title", "Zoom In")}
                  />
                  <CustomizableButton
                    buttonId="join_images_modal_1_1"
                    defaultLabel={"1:1"}
                    type="button"
onClick={() => setPreviewZoom(1)}
className="px-1.5 py-0.5 text-[9.5px] font-mono text-cyan-400 hover:text-cyan-300 rounded hover:bg-slate-800"
title={uiText("components_join_images_modal.button.reset_zoom_to_100.title", "Reset Zoom to 100%")}
                  />
                </div>

                <input
                  type="text"
                  value={outputName}
                  onChange={(e) => setOutputName(e.target.value)}
                  placeholder={uiText("components_join_images_modal.input.output_filename.placeholder", "Output filename")}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 w-36 font-mono"
                />
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="image/png">{uiText("components_join_images_modal.option.png", "PNG")}</option>
                  <option value="image/jpeg">{uiText("components_join_images_modal.option.jpeg", "JPEG")}</option>
                  <option value="image/webp">{uiText("components_join_images_modal.option.webp", "WEBP")}</option>
                </select>
              </div>
            </div>

            {/* Visual Sequence Strip (Mini preview of slices in order) */}
            {items.length > 0 && (
              <div className="px-4 py-1.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 shrink-0">
                  <span>{uiText("components_join_images_modal.span.sequence", "Sequence:")}</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  {items.map((item, idx) => (
                    <div
                      key={`strip_${item.id}_${idx}`}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10.5px] shrink-0"
                    >
                      <span className="font-mono text-cyan-400 font-bold">{idx + 1}</span>
                      <img src={item.url} alt="" className="w-5 h-5 object-contain rounded bg-black/40" />
                      <span className="max-w-[80px] truncate text-slate-300">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Canvas Viewport with Zoom / Pan */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
              {previewDataUrl ? (
                <div
                  className="relative border border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl bg-[linear-gradient(45deg,#0f172a_25%,transparent_25%),linear-gradient(-45deg,#0f172a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0f172a_75%),linear-gradient(-45deg,transparent_75%,#0f172a_75%)] bg-[size:16px_16px] bg-[#020617] max-w-full flex items-center justify-center transition-transform"
                  style={{
                    transform: `scale(${previewZoom})`,
                    transformOrigin: "center center",
                  }}
                >
                  <img
                    src={previewDataUrl}
                    alt={uiText("components_join_images_modal.img.joined_preview.alt", "Joined Preview")}
                    className="max-h-[calc(85vh-200px)] max-w-full object-contain rounded-lg shadow-inner"
                  />
                </div>
              ) : (
                <div className="text-center text-slate-500 space-y-3 p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-950/30 max-w-md">
                  <ImageIcon className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
                  <div>
                    <p className="text-base font-bold text-slate-300">{uiText("components_join_images_modal.p.no_images_to_stitch_yet", "No Images to Stitch Yet")}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {uiText("components_join_images_modal.p.click_the", "Click the ")}<strong className="text-cyan-400">{uiText("components_join_images_modal.strong.carved_slices", "\"Carved Slices (")}{availableSlices.length})"</strong>{uiText("components_join_images_modal.p.tab_to_visually_select_slices_from_your_stor", " tab to visually select slices from your Storyboard pool.")}
                    </p>
                  </div>
                  {availableSlices.length > 0 && (
                    <CustomizableButton
                      buttonId="join_images_modal_btn_5"
                      defaultIcon={<Plus className="w-4 h-4" />}
                      type="button"
onClick={() => setActiveTab("pool")}
className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 cursor-pointer"
                    >
                        {() => (
                            <>
                              <span>{uiText("components_join_images_modal.span.pick_from_carved_slices_pool", "Pick from Carved Slices Pool")}</span>
                            </>
                          )}
                    </CustomizableButton>
                  )}
                </div>
              )}
            </div>

            {/* Footer Action Controls */}
            <div className="px-4 sm:px-5 py-3 bg-[#070e20] border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 shrink-0">
              <div className="text-xs text-slate-400">
                <strong className="text-cyan-400">{items.length}</strong> {items.length === 1 ? "image" : "images"}{uiText("components_join_images_modal.div.queued", " queued •")}{" "}
                <span className="capitalize text-slate-300 font-semibold">{direction}</span>{uiText("components_join_images_modal.div.layout", " layout")}
              </div>

              <div className="flex items-center gap-2">
                <CustomizableButton
                  buttonId="join_images_modal_btn_4"
                  defaultIcon={<Copy className="w-3.5 h-3.5 text-slate-400" />}
                  type="button"
onClick={handleCopyToClipboard}
disabled={!previewDataUrl}
className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
title={uiText("components_join_images_modal.button.copy_joined_image_to_clipboard.title", "Copy Joined Image to Clipboard")}
                >
                    {() => (
                        <>
                          <span className="hidden sm:inline">{uiText("components_join_images_modal.span.copy", "Copy")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="join_images_modal_btn_3"
                  defaultIcon={<Download className="w-3.5 h-3.5 text-cyan-400" />}
                  type="button"
onClick={handleDownload}
disabled={!previewDataUrl}
className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
title={uiText("components_join_images_modal.button.download_joined_image_file.title", "Download Joined Image File")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_join_images_modal.span.download", "Download")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="join_images_modal_btn_2"
                  defaultIcon={<Layers className="w-3.5 h-3.5 text-indigo-400" />}
                  type="button"
onClick={handleAddJoinedToStoryboard}
disabled={!previewDataUrl}
className="px-3.5 py-1.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-md"
title={uiText("components_join_images_modal.button.add_joined_image_as_a_new_slice_in_storyboar.title", "Add Joined Image as a new slice in Storyboard")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_join_images_modal.span.add_to_storyboard", "Add to Storyboard")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="join_images_modal_btn_1"
                  defaultIcon={<Sparkles className="w-3.5 h-3.5 text-white" />}
                  type="button"
onClick={handleApplyToCanvas}
disabled={!previewDataUrl}
className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 shadow-lg cursor-pointer"
title={uiText("components_join_images_modal.button.load_the_joined_image_into_the_main_canvas.title", "Load the Joined Image into the main Canvas")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_join_images_modal.span.load_to_canvas", "Load to Canvas")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
