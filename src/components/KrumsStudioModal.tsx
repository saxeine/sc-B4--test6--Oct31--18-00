import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Upload,
  Layers,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sparkles,
  Palette,
  Sliders,
  SlidersHorizontal,
  StretchHorizontal,
  StretchVertical,
  ArrowUp,
  ArrowDown,
  Trash2,
  Copy,
  Plus,
  ArrowRight,
  Download,
  Archive,
  RefreshCw,
  Check,
  Eye,
  Shuffle,
  ListOrdered,
  FileImage,
  Clipboard,
  Play,
  Grid,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Square,
  Camera,
  CheckCheck,
  Bookmark,
} from "lucide-react";
import { cn } from "../utils/cn";
import { KrumsIcon } from "./KrumsIcon";
import JSZip from "jszip";
import saveAs from "file-saver";
import { CustomizableButton } from "./CustomizableButton";
import { CustomizableLabel } from "./CustomizableLabel";
import { uiText } from "../hooks/useUIConfig";
import { remoteStore } from "../services/remoteKeyValueStore";

const PRESET_BUTTON_IDS: Record<string, string> = {
  Clean: "krums_fx_preset_clean",
  "Cyber Glow": "krums_fx_preset_cyberglow",
  "Warm Gold": "krums_fx_preset_warmgold",
  "Drama Noir": "krums_fx_preset_noir",
  "Vivid Pop": "krums_fx_preset_vividpop",
  "Retro 90s": "krums_fx_preset_retro90s",
  "Acid Neon": "krums_fx_preset_acidneon",
  "Cool Frost": "krums_fx_preset_coolfrost",
  "Dreamy Soft": "krums_fx_preset_dreamy",
};

const STRETCH_BUTTON_IDS: Record<string, string> = {
  "1:1 Square": "krums_stretch_preset_square",
  "16:9 Wide": "krums_stretch_preset_wide",
  "9:16 Reel": "krums_stretch_preset_tall",
  "4:5 Portrait": "krums_stretch_preset_portrait",
  "4:3 Classic": "krums_stretch_preset_classic",
  "21:9 Cinema": "krums_stretch_preset_cinema",
};

const ANGLE_BUTTON_IDS: Record<number, string> = {
  [-90]: "krums_spin_angle_m90",
  [-45]: "krums_spin_angle_m45",
  [0]: "krums_spin_angle_0",
  [45]: "krums_spin_angle_p45",
};

const ZOOM_BUTTON_IDS: Record<number, string> = {
  [0.5]: "krums_zoom_preset_50",
  [1.0]: "krums_zoom_preset_100",
  [1.5]: "krums_zoom_preset_150",
  [2.0]: "krums_zoom_preset_200",
};

export interface KrumsImageItem {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  // Spin
  rotation: number; // degrees -180 to 180
  flipH: boolean;
  flipV: boolean;
  // Zoom & Pan
  zoom: number; // scale 0.1 to 5
  panX: number;
  panY: number;
  // Stretch
  stretchX: number; // 0.1 to 3
  stretchY: number; // 0.1 to 3
  skewX: number; // degrees -45 to 45
  skewY: number; // degrees -45 to 45
  // Effects
  brightness: number; // 0 to 200 (100 is default)
  contrast: number; // 0 to 200 (100 is default)
  saturate: number; // 0 to 250 (100 is default)
  hueRotate: number; // 0 to 360 (0 is default)
  blur: number; // 0 to 20 (0 is default)
  invert: number; // 0 to 100 (0 is default)
  sepia: number; // 0 to 100 (0 is default)
  grayscale: number; // 0 to 100 (0 is default)
  vignette: number; // 0 to 100
  tintColor: string; // hex
  tintOpacity: number; // 0 to 100
  tintBlendMode: "overlay" | "multiply" | "screen" | "color";
  filterPresetName?: string;
}

export const KRUMS_DEFAULT_STATE_KEY = "seqcarver_krums_studio_default_state_v1";

export interface KrumsDefaultState {
  transforms: Omit<KrumsImageItem, "id" | "name" | "url" | "width" | "height">;
  activeTab?: "spin" | "zoom" | "stretch" | "effects";
  showQueuePanel?: boolean;
  showViewportPanel?: boolean;
  showTransformsPanel?: boolean;
  showExportDock?: boolean;
  lastSavedAt?: string;
}

export interface PanelCyclePreset {
  id: "all" | "queue" | "canvas" | "matrix";
  label: string;
  badge: string;
  description: string;
  queue: boolean;
  viewport: boolean;
  transforms: boolean;
  iconName: string;
}

export const PANEL_CYCLE_PRESETS: PanelCyclePreset[] = [
  {
    id: "all",
    label: "All Panels",
    badge: "Q • C • M",
    description: "Queue, Canvas & Matrix all visible",
    queue: true,
    viewport: true,
    transforms: true,
    iconName: "LayoutGrid",
  },
  {
    id: "queue",
    label: "Queue",
    badge: "Queue Focus",
    description: "Queue & Canvas visible, Matrix collapsed",
    queue: true,
    viewport: true,
    transforms: false,
    iconName: "Layers",
  },
  {
    id: "canvas",
    label: "Canvas",
    badge: "Canvas Only",
    description: "Canvas Viewport maximized, side panels collapsed",
    queue: false,
    viewport: true,
    transforms: false,
    iconName: "Eye",
  },
  {
    id: "matrix",
    label: "Matrix",
    badge: "Matrix Focus",
    description: "Transforms Matrix & Canvas visible, Queue collapsed",
    queue: false,
    viewport: true,
    transforms: true,
    iconName: "SlidersHorizontal",
  },
];

export interface KrumsStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string;
  initialImages?: Array<{ url: string; name?: string }>;
  onApplyToStoryboard: (
    slices: Array<{ name: string; url: string }>,
    destination: "storyboard-slots" | "storyboard-slices" | "replace-slots" | "storyboard-first",
    keepModalOpen?: boolean
  ) => void;
  onSendToCarverCanvas?: (imageUrl: string) => void;
  storyboardSlicesCount?: number;
}

const DEFAULT_TRANSFORMS: Omit<KrumsImageItem, "id" | "name" | "url" | "width" | "height"> = {
  rotation: 0,
  flipH: false,
  flipV: false,
  zoom: 1,
  panX: 0,
  panY: 0,
  stretchX: 1,
  stretchY: 1,
  skewX: 0,
  skewY: 0,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  hueRotate: 0,
  blur: 0,
  invert: 0,
  sepia: 0,
  grayscale: 0,
  vignette: 0,
  tintColor: "#00f0ff",
  tintOpacity: 0,
  tintBlendMode: "overlay",
  filterPresetName: "Normal",
};

const FILTER_PRESETS: Array<{
  name: string;
  label: string;
  color: string;
  apply: Partial<KrumsImageItem>;
}> = [
  {
    name: "Normal",
    label: "Clean",
    color: "#94a3b8",
    apply: {
      brightness: 100,
      contrast: 100,
      saturate: 100,
      hueRotate: 0,
      blur: 0,
      invert: 0,
      sepia: 0,
      grayscale: 0,
      vignette: 0,
      tintOpacity: 0,
    },
  },
  {
    name: "Cyberpunk",
    label: "Cyber Glow",
    color: "#06b6d4",
    apply: {
      brightness: 110,
      contrast: 135,
      saturate: 160,
      hueRotate: 190,
      vignette: 35,
      tintColor: "#00f0ff",
      tintOpacity: 25,
      tintBlendMode: "overlay",
    },
  },
  {
    name: "GoldenHour",
    label: "Warm Gold",
    color: "#f59e0b",
    apply: {
      brightness: 105,
      contrast: 110,
      saturate: 130,
      sepia: 40,
      vignette: 25,
      tintColor: "#f59e0b",
      tintOpacity: 20,
      tintBlendMode: "overlay",
    },
  },
  {
    name: "Noir",
    label: "Drama Noir",
    color: "#cbd5e1",
    apply: {
      brightness: 95,
      contrast: 155,
      grayscale: 100,
      saturate: 0,
      vignette: 50,
      tintOpacity: 0,
    },
  },
  {
    name: "VividPop",
    label: "Vivid Pop",
    color: "#ec4899",
    apply: {
      brightness: 108,
      contrast: 125,
      saturate: 185,
      hueRotate: 345,
      vignette: 15,
      tintOpacity: 0,
    },
  },
  {
    name: "Retro90s",
    label: "Retro 90s",
    color: "#84cc16",
    apply: {
      brightness: 105,
      contrast: 95,
      saturate: 85,
      sepia: 25,
      vignette: 30,
      tintColor: "#a3e635",
      tintOpacity: 15,
      tintBlendMode: "screen",
    },
  },
  {
    name: "AcidGlitch",
    label: "Acid Neon",
    color: "#10b981",
    apply: {
      brightness: 115,
      contrast: 160,
      saturate: 220,
      hueRotate: 90,
      invert: 15,
      vignette: 40,
    },
  },
  {
    name: "CoolFrost",
    label: "Cool Frost",
    color: "#38bdf8",
    apply: {
      brightness: 104,
      contrast: 115,
      saturate: 110,
      hueRotate: 210,
      vignette: 20,
      tintColor: "#38bdf8",
      tintOpacity: 25,
      tintBlendMode: "overlay",
    },
  },
  {
    name: "PastelDream",
    label: "Dreamy Soft",
    color: "#c084fc",
    apply: {
      brightness: 120,
      contrast: 85,
      saturate: 115,
      blur: 0.8,
      tintColor: "#e879f9",
      tintOpacity: 20,
      tintBlendMode: "screen",
    },
  },
];

const ASPECT_STRETCH_PRESETS = [
  { label: "1:1 Square", sx: 1, sy: 1 },
  { label: "16:9 Landscape", sx: 1.77, sy: 1 },
  { label: "9:16 Reel/Story", sx: 0.56, sy: 1 },
  { label: "4:5 Portrait", sx: 0.8, sy: 1 },
  { label: "4:3 Classic", sx: 1.33, sy: 1 },
  { label: "21:9 Cinema", sx: 2.33, sy: 1 },
];

export const KrumsStudioModal: React.FC<KrumsStudioModalProps> = ({
  isOpen,
  onClose,
  initialImage,
  initialImages,
  onApplyToStoryboard,
  onSendToCarverCanvas,
  storyboardSlicesCount = 0,
}) => {
  const [images, setImages] = useState<KrumsImageItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Persistent default state for Krums Studio (use present state as default)
  const [defaultTransforms, setDefaultTransforms] = useState<
    Omit<KrumsImageItem, "id" | "name" | "url" | "width" | "height">
  >(() => {
    try {
      const stored = remoteStore.getItem(KRUMS_DEFAULT_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.transforms) {
          return { ...DEFAULT_TRANSFORMS, ...parsed.transforms };
        }
      }
    } catch (e) {
      console.warn("Failed to load Krums default state from storage", e);
    }
    return DEFAULT_TRANSFORMS;
  });

  const [activeTab, setActiveTab] = useState<"spin" | "zoom" | "stretch" | "effects">(() => {
    try {
      const stored = remoteStore.getItem(KRUMS_DEFAULT_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.activeTab) return parsed.activeTab;
      }
    } catch {}
    return "spin";
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showOriginalComparison, setShowOriginalComparison] = useState<boolean>(false);
  const [isShutterFlashing, setIsShutterFlashing] = useState<boolean>(false);

  // Panel visibility toggles (all panels can be shown / hidden)
  const [showQueuePanel, setShowQueuePanel] = useState<boolean>(() => {
    try {
      const stored = remoteStore.getItem(KRUMS_DEFAULT_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed?.showQueuePanel === "boolean") return parsed.showQueuePanel;
      }
    } catch {}
    return true;
  });
  const [showViewportPanel, setShowViewportPanel] = useState<boolean>(() => {
    try {
      const stored = remoteStore.getItem(KRUMS_DEFAULT_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed?.showViewportPanel === "boolean") return parsed.showViewportPanel;
      }
    } catch {}
    return true;
  });
  const [showTransformsPanel, setShowTransformsPanel] = useState<boolean>(() => {
    try {
      const stored = remoteStore.getItem(KRUMS_DEFAULT_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed?.showTransformsPanel === "boolean") return parsed.showTransformsPanel;
      }
    } catch {}
    return true;
  });
  const [showExportDock, setShowExportDock] = useState<boolean>(() => {
    try {
      const stored = remoteStore.getItem(KRUMS_DEFAULT_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed?.showExportDock === "boolean") return parsed.showExportDock;
      }
    } catch {}
    return true;
  });

  // Drag-and-drop reorder state for thumbnail queue
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Interactive canvas panning
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragOverQueue, setIsDragOverQueue] = useState<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  }, []);

  // Ensure present state of Krums Studio is saved as default state in localStorage
  useEffect(() => {
    try {
      const stateToPersist: KrumsDefaultState = {
        transforms: DEFAULT_TRANSFORMS,
        activeTab: "spin",
        showQueuePanel: true,
        showViewportPanel: true,
        showTransformsPanel: true,
        showExportDock: true,
        lastSavedAt: new Date().toISOString(),
      };
      const existing = remoteStore.getItem(KRUMS_DEFAULT_STATE_KEY);
      if (!existing) {
        remoteStore.setItem(KRUMS_DEFAULT_STATE_KEY, JSON.stringify(stateToPersist));
      }
    } catch (e) {
      console.warn("Could not save initial Krums default state", e);
    }
  }, []);

  // Panel Cycle Presets & Handler
  const currentCyclePreset = useMemo(() => {
    const match = PANEL_CYCLE_PRESETS.find(
      (p) =>
        p.queue === showQueuePanel &&
        p.viewport === showViewportPanel &&
        p.transforms === showTransformsPanel
    );
    if (match) return match;
    return {
      id: "all" as const,
      label: "Custom",
      badge: "Custom",
      description: "Custom panel layout",
      queue: showQueuePanel,
      viewport: showViewportPanel,
      transforms: showTransformsPanel,
      iconName: "RotateCw",
    };
  }, [showQueuePanel, showViewportPanel, showTransformsPanel]);

  const handleCyclePanels = useCallback(() => {
    const currentIndex = PANEL_CYCLE_PRESETS.findIndex((p) => p.id === currentCyclePreset.id);
    const nextIndex = (currentIndex + 1) % PANEL_CYCLE_PRESETS.length;
    const nextPreset = PANEL_CYCLE_PRESETS[nextIndex];
    setShowQueuePanel(nextPreset.queue);
    setShowViewportPanel(nextPreset.viewport);
    setShowTransformsPanel(nextPreset.transforms);
    showToast(`Switched view to ${nextPreset.label}`);
  }, [currentCyclePreset, showToast]);

  const currentCycleIcon = useMemo(() => {
    switch (currentCyclePreset.id) {
      case "queue":
        return <Layers className="w-3 h-3 text-amber-400" />;
      case "canvas":
        return <Eye className="w-3 h-3 text-amber-400" />;
      case "matrix":
        return <SlidersHorizontal className="w-3 h-3 text-amber-400" />;
      default:
        return <LayoutGrid className="w-3 h-3 text-amber-400" />;
    }
  }, [currentCyclePreset.id]);

  // Helper to create an image item
  const createImageItem = useCallback((url: string, name: string): Promise<KrumsImageItem> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          id: `krum_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: name.replace(/\.[^/.]+$/, "") || "Krums Image",
          url,
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 800,
          ...defaultTransforms,
        });
      };
      img.onerror = () => {
        resolve({
          id: `krum_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: name || "Krums Image",
          url,
          width: 800,
          height: 800,
          ...defaultTransforms,
        });
      };
      img.src = url;
    });
  }, [defaultTransforms]);

  // Populate initial images
  useEffect(() => {
    if (!isOpen) return;

    const loadInitial = async () => {
      const itemsToLoad: Array<{ url: string; name: string }> = [];
      if (initialImages && initialImages.length > 0) {
        initialImages.forEach((im, idx) => {
          if (im.url) itemsToLoad.push({ url: im.url, name: im.name || `Image ${idx + 1}` });
        });
      } else if (initialImage) {
        itemsToLoad.push({ url: initialImage, name: "Initial Image" });
      }

      if (itemsToLoad.length > 0) {
        const loaded = await Promise.all(
          itemsToLoad.map((item) => createImageItem(item.url, item.name))
        );
        setImages((prev) => {
          if (prev.length === 0) {
            setSelectedImageId(loaded[0].id);
            return loaded;
          }
          return prev;
        });
      }
    };

    loadInitial();
  }, [isOpen, initialImage, initialImages, createImageItem]);

  // Selected item reference
  const activeItem = useMemo(() => {
    return images.find((im) => im.id === selectedImageId) || images[0] || null;
  }, [images, selectedImageId]);

  // Active index
  const activeIndex = useMemo(() => {
    return activeItem ? images.findIndex((im) => im.id === activeItem.id) : -1;
  }, [images, activeItem]);

  // Mutator for active item transforms
  const updateActiveTransforms = useCallback(
    (updater: Partial<KrumsImageItem> | ((prev: KrumsImageItem) => Partial<KrumsImageItem>)) => {
      if (!activeItem) return;
      setImages((prev) =>
        prev.map((item) => {
          if (item.id === activeItem.id) {
            const updates = typeof updater === "function" ? updater(item) : updater;
            return { ...item, ...updates };
          }
          return item;
        })
      );
    },
    [activeItem]
  );

  // File Upload Handler (Multiple Images)
  const handleFilesUpload = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files || files.length === 0) return;
      const fileList = Array.from(files);
      const validFiles = fileList.filter(
        (f) =>
          f.type.startsWith("image/") ||
          /\.(jpe?g|png|webp|gif|svg|avif|bmp|tiff|ico)$/i.test(f.name)
      );

      if (validFiles.length === 0) {
        showToast("Please upload valid image files.");
        return;
      }

      setIsProcessing(true);
      try {
        const loadPromises = validFiles.map(async (file) => {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
            reader.readAsDataURL(file);
          });
          return createImageItem(dataUrl, file.name);
        });

        const newItems = await Promise.all(loadPromises);

        setImages((prev) => {
          const next = [...prev, ...newItems];
          if (!selectedImageId && newItems[0]) {
            setSelectedImageId(newItems[0].id);
          }
          return next;
        });

        showToast(`Added ${newItems.length} image(s) to Queue!`);
      } catch (err: any) {
        console.error("Error reading uploaded files", err);
        showToast("Error processing some image files.");
      } finally {
        setIsProcessing(false);
      }
    },
    [createImageItem, selectedImageId, showToast]
  );

  // Clipboard Paste Support
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault();
        const newItems: KrumsImageItem[] = [];
        for (const file of pastedFiles) {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          const item = await createImageItem(dataUrl, `Pasted_${Date.now()}`);
          newItems.push(item);
        }
        setImages((prev) => [...prev, ...newItems]);
        if (newItems[0]) setSelectedImageId(newItems[0].id);
        showToast(`Pasted ${newItems.length} image(s) from clipboard!`);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, createImageItem, showToast]);

  // Load Sample Demo Images for immediate testing
  const handleLoadSamplePack = useCallback(async () => {
    setIsProcessing(true);
    // Create 3 sleek geometric canvas art pieces to test immediately
    const sampleUrls: Array<{ name: string; url: string }> = [];

    const themes = [
      { name: "Cyber Neon Matrix", color1: "#0f172a", color2: "#06b6d4", color3: "#a855f7" },
      { name: "Solar Flare Pop", color1: "#1c1917", color2: "#f97316", color3: "#eab308" },
      { name: "Emerald Glitch", color1: "#022c22", color2: "#10b981", color3: "#064e3b" },
    ];

    for (const theme of themes) {
      const sc = document.createElement("canvas");
      sc.width = 600;
      sc.height = 600;
      const ctx = sc.getContext("2d");
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 600, 600);
        grad.addColorStop(0, theme.color1);
        grad.addColorStop(0.5, theme.color2);
        grad.addColorStop(1, theme.color3);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 600);

        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 4;
        for (let i = 0; i < 600; i += 60) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 600);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(600, i);
          ctx.stroke();
        }

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 40px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("KRUMS", 300, 270);
        ctx.font = "20px monospace";
        ctx.fillText(theme.name, 300, 320);

        sampleUrls.push({ name: theme.name, url: sc.toDataURL("image/jpeg", 0.9) });
      }
    }

    const loaded = await Promise.all(
      sampleUrls.map((s) => createImageItem(s.url, s.name))
    );
    setImages((prev) => [...prev, ...loaded]);
    if (!selectedImageId && loaded[0]) setSelectedImageId(loaded[0].id);
    setIsProcessing(false);
    showToast("Loaded 3 demo graphics into Krums!");
  }, [createImageItem, selectedImageId, showToast]);

  // Reordering functions
  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const handleReverseOrder = useCallback(() => {
    setImages((prev) => [...prev].reverse());
    showToast("Reversed image order!");
  }, [showToast]);

  const handleShuffleOrder = useCallback(() => {
    setImages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
    showToast("Shuffled image sequence!");
  }, [showToast]);

  const handleDuplicate = useCallback((item: KrumsImageItem) => {
    const duplicated: KrumsImageItem = {
      ...item,
      id: `krum_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${item.name} (Copy)`,
    };
    setImages((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      const next = [...prev];
      next.splice(idx + 1, 0, duplicated);
      return next;
    });
    showToast(`Duplicated ${item.name}`);
  }, [showToast]);

  const handleDelete = useCallback((id: string) => {
    setImages((prev) => {
      const next = prev.filter((i) => i.id !== id);
      if (selectedImageId === id) {
        setSelectedImageId(next[0]?.id || null);
      }
      return next;
    });
  }, [selectedImageId]);

  // Apply active styling to all images in queue
  const handleApplyTransformsToAll = useCallback(() => {
    if (!activeItem) return;
    setImages((prev) =>
      prev.map((item) => ({
        ...item,
        rotation: activeItem.rotation,
        flipH: activeItem.flipH,
        flipV: activeItem.flipV,
        zoom: activeItem.zoom,
        panX: activeItem.panX,
        panY: activeItem.panY,
        stretchX: activeItem.stretchX,
        stretchY: activeItem.stretchY,
        skewX: activeItem.skewX,
        skewY: activeItem.skewY,
        brightness: activeItem.brightness,
        contrast: activeItem.contrast,
        saturate: activeItem.saturate,
        hueRotate: activeItem.hueRotate,
        blur: activeItem.blur,
        invert: activeItem.invert,
        sepia: activeItem.sepia,
        grayscale: activeItem.grayscale,
        vignette: activeItem.vignette,
        tintColor: activeItem.tintColor,
        tintOpacity: activeItem.tintOpacity,
        tintBlendMode: activeItem.tintBlendMode,
        filterPresetName: activeItem.filterPresetName,
      }))
    );
    showToast(`Applied all matrix transforms & effects to ${images.length} images!`);
  }, [activeItem, images.length, showToast]);

  // Bake a single item onto offscreen high-res canvas with complete transforms & filters applied
  const bakeImageItem = useCallback((item: KrumsImageItem): Promise<{ name: string; url: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const naturalW = img.naturalWidth || item.width || 800;
        const naturalH = img.naturalHeight || item.height || 800;

        const offCanvas = document.createElement("canvas");
        offCanvas.width = naturalW;
        offCanvas.height = naturalH;
        const ctx = offCanvas.getContext("2d");

        if (!ctx) {
          resolve({ name: item.name, url: item.url });
          return;
        }

        // Apply CSS filters string directly to canvas context
        ctx.filter = `brightness(${item.brightness}%) contrast(${item.contrast}%) saturate(${item.saturate}%) hue-rotate(${item.hueRotate}deg) blur(${item.blur}px) invert(${item.invert}%) sepia(${item.sepia}%) grayscale(${item.grayscale}%)`;

        ctx.save();
        // Move to center
        ctx.translate(naturalW / 2 + item.panX, naturalH / 2 + item.panY);

        // Rotation & Flips
        const rad = (item.rotation * Math.PI) / 180;
        ctx.rotate(rad);
        ctx.scale(
          (item.flipH ? -1 : 1) * item.zoom * item.stretchX,
          (item.flipV ? -1 : 1) * item.zoom * item.stretchY
        );

        // Skew
        if (item.skewX !== 0 || item.skewY !== 0) {
          const tanX = Math.tan((item.skewX * Math.PI) / 180);
          const tanY = Math.tan((item.skewY * Math.PI) / 180);
          ctx.transform(1, tanY, tanX, 1, 0, 0);
        }

        // Draw Image centered
        ctx.drawImage(img, -naturalW / 2, -naturalH / 2, naturalW, naturalH);
        ctx.restore();

        // Optional Vignette overlay
        if (item.vignette > 0) {
          ctx.save();
          ctx.filter = "none";
          const radius = Math.max(naturalW, naturalH) / 1.4;
          const vigGrad = ctx.createRadialGradient(
            naturalW / 2,
            naturalH / 2,
            radius * 0.4,
            naturalW / 2,
            naturalH / 2,
            radius
          );
          vigGrad.addColorStop(0, "rgba(0,0,0,0)");
          vigGrad.addColorStop(1, `rgba(0,0,0,${(item.vignette / 100) * 0.85})`);
          ctx.fillStyle = vigGrad;
          ctx.fillRect(0, 0, naturalW, naturalH);
          ctx.restore();
        }

        // Optional Color Tint
        if (item.tintOpacity > 0) {
          ctx.save();
          ctx.filter = "none";
          ctx.globalCompositeOperation = item.tintBlendMode || "overlay";
          ctx.globalAlpha = item.tintOpacity / 100;
          ctx.fillStyle = item.tintColor || "#00f0ff";
          ctx.fillRect(0, 0, naturalW, naturalH);
          ctx.restore();
        }

        resolve({
          name: item.name,
          url: offCanvas.toDataURL("image/png"),
        });
      };
      img.onerror = () => {
        resolve({ name: item.name, url: item.url });
      };
      img.src = item.url;
    });
  }, []);

  // Send All Images to Storyboard (Baking each item with their custom spin, zoom, stretch, fx)
  const handleSendAllToStoryboard = useCallback(
    async (destination: "storyboard-slots" | "storyboard-slices" | "replace-slots") => {
      if (images.length === 0) {
        showToast("No images to send! Please add images first.");
        return;
      }
      setIsProcessing(true);
      showToast("Baking matrix transforms for all images...");

      const bakedSlices: Array<{ name: string; url: string }> = [];
      for (const item of images) {
        const baked = await bakeImageItem(item);
        bakedSlices.push(baked);
      }

      onApplyToStoryboard(bakedSlices, destination);
      setIsProcessing(false);
      showToast(`✓ Sent ${bakedSlices.length} images to Storyboard in exact order!`);
      onClose();
    },
    [images, bakeImageItem, onApplyToStoryboard, onClose, showToast]
  );

  // Send Active Item to Storyboard
  const handleSendActiveToStoryboard = useCallback(async () => {
    if (!activeItem) return;
    setIsProcessing(true);
    const baked = await bakeImageItem(activeItem);
    onApplyToStoryboard([baked], "storyboard-slots");
    setIsProcessing(false);
    showToast(`✓ Sent "${activeItem.name}" to Storyboard!`);
  }, [activeItem, bakeImageItem, onApplyToStoryboard, showToast]);

  // Send Active to Carver Canvas
  const handleSendActiveToCanvas = useCallback(async () => {
    if (!activeItem || !onSendToCarverCanvas) return;
    setIsProcessing(true);
    const baked = await bakeImageItem(activeItem);
    onSendToCarverCanvas(baked.url);
    setIsProcessing(false);
    showToast(`✓ Loaded "${activeItem.name}" onto Carver Canvas!`);
    onClose();
  }, [activeItem, onSendToCarverCanvas, bakeImageItem, showToast, onClose]);

  // Download Active Item
  const handleDownloadActive = useCallback(async () => {
    if (!activeItem) return;
    setIsProcessing(true);
    const baked = await bakeImageItem(activeItem);
    const link = document.createElement("a");
    link.download = `${activeItem.name}-krums.png`;
    link.href = baked.url;
    link.click();
    setIsProcessing(false);
    showToast("Downloaded active image!");
  }, [activeItem, bakeImageItem, showToast]);

  // Export All as ZIP
  const handleExportZip = useCallback(async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    showToast("Generating ZIP archive with all baked frames...");

    const zip = new JSZip();
    const folder = zip.folder("krums_sequence") || zip;

    for (let i = 0; i < images.length; i++) {
      const baked = await bakeImageItem(images[i]);
      const base64Data = baked.url.replace(/^data:image\/(png|jpeg);base64,/, "");
      const paddedIdx = String(i + 1).padStart(3, "0");
      folder.file(`${paddedIdx}_${images[i].name}.png`, base64Data, { base64: true });
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `krums-image-pack-${Date.now()}.zip`);
    setIsProcessing(false);
    showToast("Downloaded complete ZIP package!");
  }, [images, bakeImageItem, showToast]);

  // Check if any images have uncommitted transformations
  const hasUncommittedChanges = useMemo(() => {
    return images.some((item) => {
      return (
        item.rotation !== 0 ||
        item.flipH ||
        item.flipV ||
        item.zoom !== 1 ||
        item.panX !== 0 ||
        item.panY !== 0 ||
        item.stretchX !== 1 ||
        item.stretchY !== 1 ||
        item.skewX !== 0 ||
        item.skewY !== 0 ||
        item.brightness !== 100 ||
        item.contrast !== 100 ||
        item.saturate !== 100 ||
        item.hueRotate !== 0 ||
        item.blur !== 0 ||
        item.invert !== 0 ||
        item.sepia !== 0 ||
        item.grayscale !== 0 ||
        item.vignette !== 0 ||
        item.tintOpacity !== 0
      );
    });
  }, [images]);

  // Commit All Changes: permanently bake all transformations & effects into the base images
  const handleCommitAllChanges = useCallback(async () => {
    if (images.length === 0) {
      showToast("No images to commit!");
      return;
    }
    setIsProcessing(true);
    showToast(`Committing & baking all transformations for ${images.length} image(s)...`);

    try {
      const committed: KrumsImageItem[] = [];
      for (const item of images) {
        const baked = await bakeImageItem(item);
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = baked.url;
        });

        committed.push({
          ...item,
          url: baked.url,
          width: img.naturalWidth || item.width,
          height: img.naturalHeight || item.height,
          ...defaultTransforms,
        });
      }

      setImages(committed);
      showToast(`✓ Successfully committed all transformations into ${committed.length} image(s)!`);
    } catch (err) {
      console.error("Failed to commit all changes:", err);
      showToast("Error committing changes. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [images, bakeImageItem, defaultTransforms, showToast]);

  // Commit active item changes only
  const handleCommitActiveItem = useCallback(async () => {
    if (!activeItem) return;
    setIsProcessing(true);
    showToast(`Committing transformations for "${activeItem.name}"...`);

    try {
      const baked = await bakeImageItem(activeItem);
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = baked.url;
      });

      setImages((prev) =>
        prev.map((item) => {
          if (item.id === activeItem.id) {
            return {
              ...item,
              url: baked.url,
              width: img.naturalWidth || item.width,
              height: img.naturalHeight || item.height,
              ...defaultTransforms,
            };
          }
          return item;
        })
      );
      showToast(`✓ Committed transformations into "${activeItem.name}"!`);
    } catch (err) {
      console.error("Failed to commit active item:", err);
      showToast("Error committing item. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [activeItem, bakeImageItem, defaultTransforms, showToast]);

  // Capture snapshot reflecting exact live canvas appearance and copy to Storyboard first (not download image)
  const handleCopyLiveCanvasSnapshotToStoryboard = useCallback(
    async (addToQueue = false, keepModalOpen = false) => {
      if (!activeItem) {
        showToast("No active image on canvas to capture!");
        return;
      }
      setIsProcessing(true);
      // Trigger camera shutter flash visual effect
      setIsShutterFlashing(true);
      setTimeout(() => setIsShutterFlashing(false), 350);

      try {
        const baked = await bakeImageItem(activeItem);
        const cleanName = activeItem.name.replace(/\.[^/.]+$/, "") || "krums-canvas";
        const snapshotItem = {
          name: `${cleanName} (Canvas Snapshot)`,
          url: baked.url,
        };

        // NOT download image: copy to Storyboard first!
        onApplyToStoryboard([snapshotItem], "storyboard-first", keepModalOpen);

        // Attempt copying PNG to clipboard (optional convenience)
        let copied = false;
        try {
          const res = await fetch(baked.url);
          const blob = await res.blob();
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            copied = true;
          }
        } catch {
          // Clipboard write optional
        }

        if (addToQueue) {
          const newItem = await createImageItem(baked.url, `${cleanName} (Snapshot)`);
          setImages((prev) => [...prev, newItem]);
          setSelectedImageId(newItem.id);
          showToast(`📸 Snapshot reflecting exact live canvas appearance copied to Storyboard first & added to queue!`);
        } else if (copied) {
          showToast(`📸 Snapshot reflecting exact live canvas appearance copied to Storyboard first & clipboard!`);
        } else {
          showToast(`✓ Copied snapshot reflecting exact live canvas appearance to Storyboard first!`);
        }
      } catch (err) {
        console.error("Failed to copy live canvas snapshot to Storyboard:", err);
        showToast("Error capturing canvas snapshot.");
      } finally {
        setIsProcessing(false);
      }
    },
    [activeItem, bakeImageItem, onApplyToStoryboard, createImageItem, showToast]
  );

  // Backward-compatible alias for any callers
  const handleScreenshotCanvas = handleCopyLiveCanvasSnapshotToStoryboard;

  // Save the present state of Krums Studio as its default state
  const handleSavePresentStateAsDefault = useCallback(() => {
    const transformsToSave = activeItem
      ? {
          rotation: activeItem.rotation,
          flipH: activeItem.flipH,
          flipV: activeItem.flipV,
          zoom: activeItem.zoom,
          panX: activeItem.panX,
          panY: activeItem.panY,
          stretchX: activeItem.stretchX,
          stretchY: activeItem.stretchY,
          skewX: activeItem.skewX,
          skewY: activeItem.skewY,
          brightness: activeItem.brightness,
          contrast: activeItem.contrast,
          saturate: activeItem.saturate,
          hueRotate: activeItem.hueRotate,
          blur: activeItem.blur,
          invert: activeItem.invert,
          sepia: activeItem.sepia,
          grayscale: activeItem.grayscale,
          vignette: activeItem.vignette,
          tintColor: activeItem.tintColor,
          tintOpacity: activeItem.tintOpacity,
          tintBlendMode: activeItem.tintBlendMode,
          filterPresetName: activeItem.filterPresetName || "Normal",
        }
      : defaultTransforms;

    const stateToSave: KrumsDefaultState = {
      transforms: transformsToSave,
      activeTab,
      showQueuePanel,
      showViewportPanel,
      showTransformsPanel,
      showExportDock,
      lastSavedAt: new Date().toISOString(),
    };

    try {
      remoteStore.setItem(KRUMS_DEFAULT_STATE_KEY, JSON.stringify(stateToSave));
      setDefaultTransforms(stateToSave.transforms);
      showToast("✓ Saved present state of Krums Studio as its default state!");
    } catch (err) {
      console.error("Failed to save Krums default state:", err);
      showToast("Error saving Krums default state.");
    }
  }, [
    activeItem,
    defaultTransforms,
    activeTab,
    showQueuePanel,
    showViewportPanel,
    showTransformsPanel,
    showExportDock,
    showToast,
  ]);

  // Reset active item to saved default state
  const handleResetToDefaultState = useCallback(() => {
    if (!activeItem) return;
    updateActiveTransforms({
      ...defaultTransforms,
    });
    showToast("✓ Reset transforms to Krums Studio default state!");
  }, [activeItem, defaultTransforms, updateActiveTransforms, showToast]);

  // Computed CSS styles for the live preview canvas
  const previewFilterString = useMemo(() => {
    if (!activeItem || showOriginalComparison) return "none";
    return `brightness(${activeItem.brightness}%) contrast(${activeItem.contrast}%) saturate(${activeItem.saturate}%) hue-rotate(${activeItem.hueRotate}deg) blur(${activeItem.blur}px) invert(${activeItem.invert}%) sepia(${activeItem.sepia}%) grayscale(${activeItem.grayscale}%)`;
  }, [activeItem, showOriginalComparison]);

  const previewTransformString = useMemo(() => {
    if (!activeItem || showOriginalComparison) return "none";
    const rad = activeItem.rotation;
    const sx = (activeItem.flipH ? -1 : 1) * activeItem.zoom * activeItem.stretchX;
    const sy = (activeItem.flipV ? -1 : 1) * activeItem.zoom * activeItem.stretchY;
    const skew = `skew(${activeItem.skewX}deg, ${activeItem.skewY}deg)`;
    return `translate(${activeItem.panX}px, ${activeItem.panY}px) rotate(${rad}deg) scale(${sx}, ${sy}) ${skew}`;
  }, [activeItem, showOriginalComparison]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-1 sm:p-3 overflow-hidden select-none",
        !isOpen && "hidden pointer-events-none"
      )}
      style={{ display: isOpen ? "flex" : "none" }}
    >
      <div
        className={cn(
          "bg-[#080d19] border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 transition-all duration-200 animate-in fade-in zoom-in-95",
          isMaximized ? "w-full h-full rounded-none" : "w-[98vw] max-w-7xl h-[94vh]"
        )}
      >
        {/* TOP BAR / HEADER */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0b1324] border-b border-amber-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 border border-amber-400/50 rounded-xl text-amber-300 shadow-sm">
              <KrumsIcon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CustomizableLabel
                  labelId="krums_title_label"
                  defaultText="Krums Image Loader Studio"
                  showIconAlways={false}
                  className="flex items-center gap-1.5"
                >
                  {({ label }) => (
                    <CustomizableLabel
                      labelId="krums_studio_modal_item_4"
                      as="h2"
                      className="text-sm font-extrabold tracking-wide text-white flex items-center gap-1.5"
                    >
                        {() => (
                            <>
                              {label}
                            </>
                          )}
                    </CustomizableLabel>
                  )}
                </CustomizableLabel>
                <CustomizableLabel
                  labelId="krums_header_count_badge"
                  defaultText={`${images.length} Image${images.length !== 1 ? "s" : ""} Loaded`}
                  showIconAlways={false}
                  className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800"
                />
                {activeItem && (
                  <CustomizableLabel
                    labelId="krums_header_res_badge"
                    defaultText={`${activeItem.width} × ${activeItem.height} px`}
                    showIconAlways={false}
                    className="hidden sm:inline-block text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Panel Visibility Toggles & Header Controls */}
          <div className="flex items-center gap-1.5">
            {/* Show/Hide Toggles for Panels */}
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#070b16] border border-slate-800/90 text-slate-400 mr-1">
              <CustomizableButton
                buttonId="krums_panel_cycle_view"
                id="krums_panel_cycle_view"
                defaultLabel={currentCyclePreset.label}
                defaultIcon={currentCycleIcon}
                onClick={handleCyclePanels}
                className="px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 shadow-sm active:scale-95"
                title={`Panel View: ${currentCyclePreset.label} (${currentCyclePreset.description}) — Click to cycle: All → Queue → Canvas → Matrix`}
              />
              <CustomizableButton
                buttonId="krums_panel_toggle_dock"
                defaultLabel="Dock"
                defaultIcon={<Download className="w-3 h-3" />}
                onClick={() => setShowExportDock((prev) => !prev)}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border",
                  showExportDock
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                    : "bg-slate-900/80 text-slate-500 border-slate-800 hover:text-slate-300"
                )}
                title={showExportDock ? "Hide Export Dock" : "Show Export Dock"}
              />
            </div>

            <CustomizableButton
              buttonId="krums_btn_close"
              defaultLabel="Close"
              defaultIcon={<X className="w-4 h-4" />}
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 border border-transparent hover:border-rose-800 transition-colors cursor-pointer"
              title="Close Krums Studio"
              forceZeroText
            />
          </div>
        </div>

        {/* TOAST / NOTICE */}
        {notice && (
          <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-emerald-500/20 border-b border-amber-500/40 px-4 py-1.5 text-xs text-amber-200 font-bold flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              {notice}
            </span>
            <CustomizableButton
              buttonId="krums_notice_dismiss"
              defaultLabel=""
              defaultIcon={<X className="w-3.5 h-3.5" />}
              onClick={() => setNotice(null)}
              className="text-amber-400/80 hover:text-white text-[10px] p-0.5 rounded hover:bg-amber-500/20"
              title="Dismiss Notification"
              forceZeroText
            />
          </div>
        )}

        {/* MAIN BODY 3-COLUMN LAYOUT */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* COLUMN 1: IMAGE QUEUE & REORDERING (LEFT) */}
          {showQueuePanel ? (
            <div
              onDragOver={(e) => {
                if (e.dataTransfer?.types?.includes("Files")) {
                  e.preventDefault();
                  setIsDragOverQueue(true);
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsDragOverQueue(false);
                }
              }}
              onDrop={(e) => {
                if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOverQueue(false);
                  handleFilesUpload(e.dataTransfer.files);
                }
              }}
              className={cn(
                "w-full md:w-72 lg:w-80 bg-[#060a14] border-r border-slate-800/80 flex flex-col shrink-0 overflow-hidden relative transition-colors",
                isDragOverQueue && "bg-amber-950/20 ring-2 ring-amber-400 ring-inset"
              )}
            >
              {/* Queue Panel Header */}
              <div className="p-2.5 border-b border-slate-800/80 flex items-center justify-between bg-[#0a0f1d] gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CustomizableLabel
                    labelId="krums_queue_header_label"
                    defaultText="Queue"
                    defaultIcon={<Layers className="w-3.5 h-3.5 text-amber-400" />}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-200 shrink-0"
                  />
                  {images.length > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-800 text-amber-400 rounded-full border border-slate-700 shrink-0">
                      {images.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <CustomizableButton
                    buttonId="krums_queue_reverse"
                    defaultLabel=""
                    defaultIcon={<ListOrdered className="w-3.5 h-3.5" />}
                    onClick={handleReverseOrder}
                    disabled={images.length <= 1}
                    className="p-1 text-slate-400 hover:text-amber-300 disabled:opacity-30 rounded hover:bg-slate-800 cursor-pointer"
                    title="Reverse sequence order"
                    forceZeroText
                  />
                  <CustomizableButton
                    buttonId="krums_queue_shuffle"
                    defaultLabel=""
                    defaultIcon={<Shuffle className="w-3.5 h-3.5" />}
                    onClick={handleShuffleOrder}
                    disabled={images.length <= 1}
                    className="p-1 text-slate-400 hover:text-amber-300 disabled:opacity-30 rounded hover:bg-slate-800 cursor-pointer"
                    title="Shuffle sequence"
                    forceZeroText
                  />
                  <CustomizableButton
                    buttonId="krums_queue_clear_all"
                    defaultLabel=""
                    defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => {
                      if (confirm("Clear all images from Krums?")) setImages([]);
                    }}
                    disabled={images.length === 0}
                    className="p-1 text-slate-400 hover:text-rose-400 disabled:opacity-30 rounded hover:bg-slate-800 cursor-pointer"
                    title="Clear all images"
                    forceZeroText
                  />
                  <CustomizableButton
                    buttonId="krums_panel_collapse_queue"
                    defaultLabel=""
                    defaultIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                    onClick={() => setShowQueuePanel(false)}
                    className="p-1 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 ml-1 border border-slate-800/80 cursor-pointer"
                    title="Collapse Queue Panel"
                    forceZeroText
                  />
                </div>
              </div>

              {/* Upload Button at the top of the Queue Panel */}
              <div className="p-2 border-b border-slate-800/80 bg-[#080d19]">
                <CustomizableButton
                  buttonId="krums_btn_add_images"
                  defaultLabel="Upload Images"
                  defaultIcon={<Upload className="w-3.5 h-3.5" />}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 transition-all cursor-pointer shadow-md active:scale-[0.98]"
                  title="Upload multiple images from local device"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFilesUpload(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>

              {/* Drag & Drop Thumbnail List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                {images.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-amber-500/30 hover:border-amber-400/60 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-amber-950/10 hover:bg-amber-950/20 mt-4"
                  >
                    <KrumsIcon className="w-8 h-8 text-amber-400 mb-2 animate-pulse" />
                    <p className="text-xs font-bold text-amber-300">{uiText("components_krums_studio_modal.p.drop_multiple_images_here", "Drop Multiple Images Here")}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {uiText("components_krums_studio_modal.p.or_click_to_browse_from_device_paste_ctrl_v", "Or click to browse from device / Paste (Ctrl+V)")}
                    </p>
                    <CustomizableButton
                      buttonId="krums_queue_load_sample"
                      defaultLabel="Load Sample Set"
                      defaultIcon={<Sparkles className="w-3 h-3" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadSamplePack();
                      }}
                      className="mt-3 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold rounded border border-amber-500/40 flex items-center gap-1 cursor-pointer"
                      title="Load sample test graphics"
                    />
                  </div>
                ) : (
                  images.map((item, idx) => {
                    const isSelected = item.id === selectedImageId;
                    const isDragging = draggedIndex === idx;
                    const isOver = dragOverIndex === idx;

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => setDraggedIndex(idx)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragOverIndex !== idx) setDragOverIndex(idx);
                        }}
                        onDragEnd={() => {
                          if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
                            moveItem(draggedIndex, dragOverIndex);
                          }
                          setDraggedIndex(null);
                          setDragOverIndex(null);
                        }}
                        onClick={() => setSelectedImageId(item.id)}
                        className={cn(
                          "group relative flex items-center gap-2 p-1.5 rounded-xl border transition-all cursor-pointer select-none",
                          isSelected
                            ? "bg-amber-950/40 border-amber-400/70 shadow-lg shadow-amber-950/40"
                            : "bg-[#0c1222] border-slate-800/80 hover:border-slate-700 hover:bg-[#10172c]",
                          isOver && "border-t-2 border-t-amber-400 scale-[1.01]",
                          isDragging && "opacity-40"
                        )}
                      >
                        {/* Frame Index Number Badge */}
                        <CustomizableLabel
                          labelId="krums_queue_item_frame_badge"
                          defaultText={`#${idx + 1}`}
                          showIconAlways={false}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0",
                            isSelected
                              ? "bg-amber-400 text-slate-950"
                              : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
                          )}
                        />

                        {/* Thumbnail Preview with Live CSS Transform Miniaturized */}
                        <div className="w-12 h-12 rounded-lg bg-black/60 border border-slate-800 shrink-0 overflow-hidden flex items-center justify-center relative">
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform"
                            style={{
                              transform: `rotate(${item.rotation}deg) scale(${
                                (item.flipH ? -1 : 1) * item.stretchX
                              }, ${(item.flipV ? -1 : 1) * item.stretchY})`,
                              filter: `hue-rotate(${item.hueRotate}deg) saturate(${item.saturate}%)`,
                            }}
                          />
                          {/* Modified indicators */}
                          {(item.rotation !== 0 || item.zoom !== 1 || item.stretchX !== 1 || item.hueRotate !== 0) && (
                            <div className="absolute bottom-0 right-0 w-2 h-2 bg-amber-400 rounded-tl" />
                          )}
                        </div>

                        {/* Info & Name */}
                        <div className="flex-1 min-w-0 pr-1">
                          <p className="text-[11px] font-bold text-slate-200 truncate leading-tight">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400 mt-0.5">
                            <span>{item.rotation !== 0 ? `${item.rotation}°` : "0°"}</span>
                            <span>•</span>
                            <span>{item.zoom !== 1 ? `${item.zoom.toFixed(1)}x` : "1x"}</span>
                            {item.filterPresetName && item.filterPresetName !== "Normal" && (
                              <>
                                <span>•</span>
                                <span className="text-amber-400 font-medium truncate">
                                  {item.filterPresetName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Reorder Up/Down & Row Actions */}
                        <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 shrink-0">
                          <CustomizableButton
                            buttonId="krums_queue_item_move_up"
                            defaultLabel=""
                            defaultIcon={<ArrowUp className="w-3 h-3" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveItem(idx, idx - 1);
                            }}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-amber-300 disabled:opacity-20 rounded cursor-pointer"
                            title="Move Up"
                            forceZeroText
                          />
                          <CustomizableButton
                            buttonId="krums_queue_item_move_down"
                            defaultLabel=""
                            defaultIcon={<ArrowDown className="w-3 h-3" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveItem(idx, idx + 1);
                            }}
                            disabled={idx === images.length - 1}
                            className="p-1 text-slate-400 hover:text-amber-300 disabled:opacity-20 rounded cursor-pointer"
                            title="Move Down"
                            forceZeroText
                          />
                          <CustomizableButton
                            buttonId="krums_queue_item_duplicate"
                            defaultLabel=""
                            defaultIcon={<Copy className="w-3 h-3" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(item);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-300 rounded cursor-pointer"
                            title="Duplicate item"
                            forceZeroText
                          />
                          <CustomizableButton
                            buttonId="krums_queue_item_delete"
                            defaultLabel=""
                            defaultIcon={<Trash2 className="w-3 h-3" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                            title="Delete item"
                            forceZeroText
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Left Column Bottom Quick Bar */}
              <div className="p-2 border-t border-slate-800/80 bg-[#090e1c] flex items-center justify-between text-[10px] text-slate-400">
                <CustomizableLabel
                  labelId="krums_queue_bottom_hint"
                  defaultText="Drag cards to reorder"
                  showIconAlways={false}
                  className="text-[10px] text-slate-400"
                />
                <CustomizableButton
                  buttonId="krums_queue_add_more"
                  defaultLabel="Add More"
                  defaultIcon={<Plus className="w-3 h-3" />}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  title="Add more images to queue"
                />
              </div>
            </div>
          ) : (
            <div className="w-9 bg-[#060a14] border-r border-slate-800/80 flex flex-col items-center py-3 shrink-0 select-none">
              <CustomizableButton
                buttonId="krums_panel_expand_queue"
                defaultLabel=""
                defaultIcon={<ChevronRight className="w-4 h-4 text-amber-400" />}
                onClick={() => setShowQueuePanel(true)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 cursor-pointer shadow-sm"
                title="Expand Queue Panel"
                forceZeroText
              />
              <span className="[writing-mode:vertical-lr] text-[10px] font-bold text-slate-500 tracking-wider uppercase mt-3">
                {uiText("components_krums_studio_modal.span.queue", "Queue (")}{images.length})
              </span>
            </div>
          )}

          {/* COLUMN 2: ACTIVE IMAGE CANVAS & INTERACTIVE VIEWPORT (CENTER) */}
          {showViewportPanel ? (
            <div className="flex-1 flex flex-col bg-[#03060f] relative overflow-hidden">
              {/* Viewport Control Bar */}
              <div className="px-3 py-2 bg-[#090f1e] border-b border-slate-800/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  {activeItem && (
                    <CustomizableLabel
                      labelId="krums_viewport_frame_indicator"
                      defaultText={`Frame ${activeIndex + 1} of ${images.length}`}
                      showIconAlways={false}
                      className="text-[10px] text-slate-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800"
                    />
                  )}
                </div>

                {/* Viewport Actions: Snapshot to Storyboard, Zoom, Pan, Compare Original, Commit */}
                <div className="flex items-center gap-1.5">
                  <CustomizableButton
                    buttonId="krums_viewport_screenshot"
                    defaultLabel="Snapshot to Storyboard"
                    defaultIcon={<Camera className="w-3.5 h-3.5 text-emerald-400" />}
                    onClick={() => handleCopyLiveCanvasSnapshotToStoryboard(false, false)}
                    disabled={!activeItem || isProcessing}
                    className="px-2.5 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-500/50 hover:border-emerald-400 shadow-sm active:scale-95"
                    title="Capture snapshot reflecting exact live canvas appearance and copy to Storyboard first (not download image)"
                  />

                  <CustomizableButton
                    buttonId="krums_viewport_hold_original"
                    defaultLabel="Hold for Original"
                    defaultIcon={<Eye className="w-3 h-3" />}
                    onMouseDown={() => setShowOriginalComparison(true)}
                    onMouseUp={() => setShowOriginalComparison(false)}
                    onMouseLeave={() => setShowOriginalComparison(false)}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer",
                      showOriginalComparison
                        ? "bg-amber-400 text-slate-950 border-amber-300"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                    )}
                    title="Press and hold to view original untransformed image"
                  />

                  <div className="h-4 w-px bg-slate-800 mx-1" />

                  <CustomizableButton
                    buttonId="krums_viewport_rotate_ccw"
                    defaultLabel=""
                    defaultIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={() => updateActiveTransforms((prev) => ({ rotation: prev.rotation - 90 }))}
                    className="p-1.5 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 cursor-pointer"
                    title="Rotate 90° CCW"
                    forceZeroText
                  />
                  <CustomizableButton
                    buttonId="krums_viewport_rotate_cw"
                    defaultLabel=""
                    defaultIcon={<RotateCw className="w-3.5 h-3.5" />}
                    onClick={() => updateActiveTransforms((prev) => ({ rotation: prev.rotation + 90 }))}
                    className="p-1.5 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 cursor-pointer"
                    title="Rotate 90° CW"
                    forceZeroText
                  />
                  <CustomizableButton
                    buttonId="krums_viewport_flip_h"
                    defaultLabel=""
                    defaultIcon={<FlipHorizontal className="w-3.5 h-3.5" />}
                    onClick={() => updateActiveTransforms((prev) => ({ flipH: !prev.flipH }))}
                    className="p-1.5 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 cursor-pointer"
                    title="Flip Horizontal"
                    forceZeroText
                  />
                  <CustomizableButton
                    buttonId="krums_viewport_flip_v"
                    defaultLabel=""
                    defaultIcon={<FlipVertical className="w-3.5 h-3.5" />}
                    onClick={() => updateActiveTransforms((prev) => ({ flipV: !prev.flipV }))}
                    className="p-1.5 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 cursor-pointer"
                    title="Flip Vertical"
                    forceZeroText
                  />

                  <div className="h-4 w-px bg-slate-800 mx-1" />

                  <CustomizableButton
                    buttonId="krums_viewport_zoom_out"
                    defaultLabel=""
                    defaultIcon={<ZoomOut className="w-3.5 h-3.5" />}
                    onClick={() => updateActiveTransforms((prev) => ({ zoom: Math.max(0.1, prev.zoom - 0.2) }))}
                    className="p-1.5 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 cursor-pointer"
                    title="Zoom Out"
                    forceZeroText
                  />
                  <span className="text-[10px] font-mono text-amber-300 w-10 text-center">
                    {activeItem ? `${Math.round(activeItem.zoom * 100)}%` : "100%"}
                  </span>
                  <CustomizableButton
                    buttonId="krums_viewport_zoom_in"
                    defaultLabel=""
                    defaultIcon={<ZoomIn className="w-3.5 h-3.5" />}
                    onClick={() => updateActiveTransforms((prev) => ({ zoom: Math.min(5, prev.zoom + 0.2) }))}
                    className="p-1.5 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 cursor-pointer"
                    title="Zoom In"
                    forceZeroText
                  />

                  <CustomizableButton
                    buttonId="krums_viewport_reset_transforms"
                    defaultLabel="Reset to Default"
                    defaultIcon={<RotateCcw className="w-3 h-3" />}
                    onClick={handleResetToDefaultState}
                    className="px-2 py-1 rounded text-[10px] font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 ml-1 cursor-pointer flex items-center gap-1"
                    title="Reset transforms to Krums Studio default state"
                  />

                  <CustomizableButton
                    buttonId="krums_viewport_commit_active"
                    defaultLabel="Commit"
                    defaultIcon={<Check className="w-3 h-3 text-emerald-400" />}
                    onClick={handleCommitActiveItem}
                    disabled={!activeItem || isProcessing}
                    className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/40 hover:border-emerald-500 flex items-center gap-1 cursor-pointer"
                    title="Commit active transformations permanently into this image"
                  />
                </div>
              </div>

              {/* Interactive Canvas Centerpiece */}
              <div
                className="flex-1 relative flex items-center justify-center overflow-hidden p-6 cursor-grab active:cursor-grabbing bg-[#03060f]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, #1e293b 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
                onMouseDown={(e) => {
                  setIsPanning(true);
                  setPanStart({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  if (!isPanning || !activeItem) return;
                  const dx = e.clientX - panStart.x;
                  const dy = e.clientY - panStart.y;
                  setPanStart({ x: e.clientX, y: e.clientY });
                  updateActiveTransforms((prev) => ({
                    panX: prev.panX + dx,
                    panY: prev.panY + dy,
                  }));
                }}
                onMouseUp={() => setIsPanning(false)}
                onMouseLeave={() => setIsPanning(false)}
                onWheel={(e) => {
                  e.preventDefault();
                  const delta = e.deltaY > 0 ? -0.1 : 0.1;
                  updateActiveTransforms((prev) => ({
                    zoom: Math.min(5, Math.max(0.1, Number((prev.zoom + delta).toFixed(2)))),
                  }));
                }}
              >
                {/* Floating Quick Snapshot Action Button (Copies to Storyboard First, not download image) */}
                {activeItem && (
                  <CustomizableButton
                    buttonId="krums_studio_modal_btn_3"
                    defaultIcon={<Camera className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-emerald-400" />}
                    type="button"
onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLiveCanvasSnapshotToStoryboard(false, false);
                    }}
disabled={isProcessing}
className="absolute top-3 right-3 z-20 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-emerald-950 text-emerald-300 hover:text-emerald-200 border border-slate-700/80 hover:border-emerald-500/60 shadow-lg text-[10.5px] font-bold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer group active:scale-95 disabled:opacity-40"
title={uiText("components_krums_studio_modal.button.capture_snapshot_reflecting_exact_live_canva.title", "Capture snapshot reflecting exact live canvas appearance and copy to Storyboard first (not download image)")}
                  >
                      {() => (
                          <>
                            <span>{uiText("components_krums_studio_modal.span.snapshot_to_storyboard_first", "Snapshot to Storyboard First")}</span>
                          </>
                        )}
                  </CustomizableButton>
                )}

                {/* Camera Shutter Flash Effect */}
                {isShutterFlashing && (
                  <div className="absolute inset-0 bg-white/70 pointer-events-none z-30 transition-opacity duration-300 animate-out fade-out" />
                )}
                {activeItem ? (
                  <div className="relative max-w-full max-h-full flex items-center justify-center transition-all duration-75">
                    <div
                      className="relative shadow-2xl rounded-sm overflow-hidden"
                      style={{
                        transform: previewTransformString,
                        filter: previewFilterString,
                        transformOrigin: "center center",
                      }}
                    >
                      <img
                        src={activeItem.url}
                        alt={activeItem.name}
                        draggable={false}
                        className="max-h-[62vh] max-w-[50vw] object-contain block pointer-events-none select-none"
                      />

                      {/* Live Vignette Preview Layer */}
                      {!showOriginalComparison && activeItem.vignette > 0 && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `radial-gradient(circle at center, transparent 40%, rgba(0,0,0,${
                              (activeItem.vignette / 100) * 0.9
                            }) 100%)`,
                          }}
                        />
                      )}

                      {/* Live Color Tint Preview Layer */}
                      {!showOriginalComparison && activeItem.tintOpacity > 0 && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundColor: activeItem.tintColor,
                            opacity: activeItem.tintOpacity / 100,
                            mixBlendMode: activeItem.tintBlendMode,
                          }}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500">
                    <FileImage className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-bold">{uiText("components_krums_studio_modal.p.no_image_selected", "No Image Selected")}</p>
                    <p className="text-xs">{uiText("components_krums_studio_modal.p.add_images_via_the_left_panel_or_click_demo", "Add images via the left panel or click Demo Pack")}</p>
                  </div>
                )}

                {/* Viewport Corner Status HUD */}
                {activeItem && (
                  <CustomizableLabel
                    labelId="krums_viewport_hud_badge"
                    defaultText={`Spin: ${activeItem.rotation}° | Scale: ${Math.round(activeItem.zoom * 100)}% | Stretch: ${activeItem.stretchX.toFixed(2)}x × ${activeItem.stretchY.toFixed(2)}x`}
                    showIconAlways={false}
                    className="absolute bottom-3 left-3 pointer-events-none"
                  >
                    {() => (
                      <div className="bg-slate-950/80 border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-[10.5px] font-mono text-slate-400 space-y-0.5 backdrop-blur-sm">
                        <div>
                          {uiText("components_krums_studio_modal.div.spin", "Spin: ")}<span className="text-amber-400 font-bold">{activeItem.rotation}°</span>
                          {activeItem.flipH ? " (FlipH)" : ""}
                          {activeItem.flipV ? " (FlipV)" : ""}
                        </div>
                        <div>
                          {uiText("components_krums_studio_modal.div.scale", "Scale:")}{" "}
                          <span className="text-cyan-400 font-bold">
                            {Math.round(activeItem.zoom * 100)}%
                          </span>{" "}
                          {uiText("components_krums_studio_modal.div.stretch", "• Stretch:")}{" "}
                          <span className="text-emerald-400 font-bold">
                            {activeItem.stretchX.toFixed(2)}{uiText("components_krums_studio_modal.span.x", "x × ")}{activeItem.stretchY.toFixed(2)}{uiText("components_krums_studio_modal.span.x_2", "x")}
                          </span>
                        </div>
                      </div>
                    )}
                  </CustomizableLabel>
                )}
              </div>
            </div>
          ) : (
            <div className="w-9 bg-[#03060f] border-r border-slate-800/80 flex flex-col items-center py-3 shrink-0 select-none">
              <CustomizableButton
                buttonId="krums_panel_toggle_viewport"
                defaultLabel=""
                defaultIcon={<Eye className="w-4 h-4 text-amber-400" />}
                onClick={() => setShowViewportPanel(true)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 cursor-pointer shadow-sm"
                title="Expand Live Canvas Viewport"
                forceZeroText
              />
              <span className="[writing-mode:vertical-lr] text-[10px] font-bold text-slate-500 tracking-wider uppercase mt-3">
                {uiText("components_krums_studio_modal.span.canvas", "Canvas")}
              </span>
            </div>
          )}

          {/* COLUMN 3: TRANSFORMS & EFFECTS MATRIX STUDIO (RIGHT) */}
          {showTransformsPanel ? (
            <div className="w-full md:w-80 lg:w-96 bg-[#080d1a] border-l border-slate-800/80 flex flex-col shrink-0 overflow-hidden">
              {/* Header / Collapse Bar */}
              <div className="px-3 py-2 bg-[#090f1f] border-b border-slate-800/80 flex items-center justify-between shrink-0">
                <CustomizableLabel
                  labelId="krums_transforms_header_label"
                  defaultText="Transforms Matrix Studio"
                  defaultIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />}
                  className="text-xs font-bold text-slate-200 flex items-center gap-1.5"
                />
                <CustomizableButton
                  buttonId="krums_panel_collapse_transforms"
                  defaultLabel=""
                  defaultIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  onClick={() => setShowTransformsPanel(false)}
                  className="p-1 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 border border-slate-800 cursor-pointer"
                  title="Collapse Transforms Matrix Panel"
                  forceZeroText
                />
              </div>

              {/* Tab Navigation: Spin | Zoom | Stretch | Effects */}
              <div className="grid grid-cols-4 p-1.5 bg-[#0a1122] border-b border-slate-800/80 gap-1 text-[10px] font-bold">
                <CustomizableButton
                  buttonId="krums_tab_spin"
                  defaultLabel="Spin"
                  defaultIcon={<RotateCw className="w-3 h-3" />}
                  onClick={() => setActiveTab("spin")}
                  className={cn(
                    "py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all",
                    activeTab === "spin"
                      ? "bg-amber-500 text-slate-950 font-black shadow-md"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  )}
                />

                <CustomizableButton
                  buttonId="krums_tab_zoom"
                  defaultLabel="Zoom"
                  defaultIcon={<ZoomIn className="w-3 h-3" />}
                  onClick={() => setActiveTab("zoom")}
                  className={cn(
                    "py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all",
                    activeTab === "zoom"
                      ? "bg-amber-500 text-slate-950 font-black shadow-md"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  )}
                />

                <CustomizableButton
                  buttonId="krums_tab_stretch"
                  defaultLabel="Stretch"
                  defaultIcon={<StretchHorizontal className="w-3 h-3" />}
                  onClick={() => setActiveTab("stretch")}
                  className={cn(
                    "py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all",
                    activeTab === "stretch"
                      ? "bg-amber-500 text-slate-950 font-black shadow-md"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  )}
                />

                <CustomizableButton
                  buttonId="krums_tab_effects"
                  defaultLabel="Effects"
                  defaultIcon={<Sparkles className="w-3 h-3" />}
                  onClick={() => setActiveTab("effects")}
                  className={cn(
                    "py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all",
                    activeTab === "effects"
                      ? "bg-amber-500 text-slate-950 font-black shadow-md"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  )}
                />
              </div>

              {/* Tab Panels */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar text-xs">
                {/* TAB 1: SPIN & ORIENTATION */}
                {activeTab === "spin" && activeItem && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <CustomizableLabel
                        labelId="krums_spin_header_label"
                        defaultText="Spin & Rotation Angle"
                        defaultIcon={<RotateCw className="w-3.5 h-3.5" />}
                        className="font-bold text-amber-300 flex items-center gap-1.5"
                      />
                      <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {activeItem.rotation}°
                      </span>
                    </div>

                    {/* Rotation Slider */}
                    <div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={activeItem.rotation}
                        onChange={(e) => updateActiveTransforms({ rotation: Number(e.target.value) })}
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                        <span>-180°</span>
                        <span>-90°</span>
                        <span>0°</span>
                        <span>+90°</span>
                        <span>+180°</span>
                      </div>
                    </div>

                    {/* Quick Angle Buttons */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {([-90, -45, 0, 45] as const).map((deg) => (
                        <CustomizableButton
                          key={deg}
                          buttonId={ANGLE_BUTTON_IDS[deg] || `krums_spin_angle_${deg}`}
                          defaultLabel={deg > 0 ? `+${deg}°` : `${deg}°`}
                          onClick={() => updateActiveTransforms({ rotation: deg })}
                          className="py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-mono font-bold text-slate-300 border border-slate-800 cursor-pointer"
                        />
                      ))}
                    </div>

                    {/* Orientation Toggles */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <CustomizableLabel
                        labelId="krums_spin_mirror_label"
                        defaultText="Mirror / Reflection"
                        showIconAlways={false}
                        className="font-bold text-slate-300 text-[11px] block"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <CustomizableButton
                          buttonId="krums_spin_flip_h"
                          defaultLabel="Flip Horizontal"
                          defaultIcon={<FlipHorizontal className="w-3.5 h-3.5" />}
                          onClick={() => updateActiveTransforms((prev) => ({ flipH: !prev.flipH }))}
                          className={cn(
                            "py-2 px-3 rounded-lg border font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer",
                            activeItem.flipH
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                              : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                          )}
                        />
                        <CustomizableButton
                          buttonId="krums_spin_flip_v"
                          defaultLabel="Flip Vertical"
                          defaultIcon={<FlipVertical className="w-3.5 h-3.5" />}
                          onClick={() => updateActiveTransforms((prev) => ({ flipV: !prev.flipV }))}
                          className={cn(
                            "py-2 px-3 rounded-lg border font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer",
                            activeItem.flipV
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                              : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                          )}
                        />
                      </div>
                    </div>

                    <CustomizableButton
                      buttonId="krums_spin_reset"
                      defaultLabel="Reset Spin"
                      onClick={() =>
                        updateActiveTransforms({ rotation: 0, flipH: false, flipV: false })
                      }
                      className="w-full py-1.5 text-center text-[10.5px] font-bold text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 rounded-lg border border-slate-800/80 cursor-pointer"
                    />
                  </div>
                )}

                {/* TAB 2: ZOOM & PAN */}
                {activeTab === "zoom" && activeItem && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <CustomizableLabel
                        labelId="krums_zoom_header_label"
                        defaultText="Zoom Scale"
                        defaultIcon={<ZoomIn className="w-3.5 h-3.5" />}
                        className="font-bold text-amber-300 flex items-center gap-1.5"
                      />
                      <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {Math.round(activeItem.zoom * 100)}%
                      </span>
                    </div>

                    {/* Zoom Slider */}
                    <div>
                      <input
                        type="range"
                        min="0.2"
                        max="4.0"
                        step="0.05"
                        value={activeItem.zoom}
                        onChange={(e) => updateActiveTransforms({ zoom: Number(e.target.value) })}
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                        <span>20%</span>
                        <span>100%</span>
                        <span>200%</span>
                        <span>300%</span>
                        <span>400%</span>
                      </div>
                    </div>

                    {/* Quick Scale Presets */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {([0.5, 1.0, 1.5, 2.0] as const).map((s) => (
                        <CustomizableButton
                          key={s}
                          buttonId={ZOOM_BUTTON_IDS[s] || `krums_zoom_preset_${s}`}
                          defaultLabel={`${Math.round(s * 100)}%`}
                          onClick={() => updateActiveTransforms({ zoom: s })}
                          className="py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-mono font-bold text-slate-300 border border-slate-800 cursor-pointer"
                        />
                      ))}
                    </div>

                    {/* Pan Offsets */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                      <CustomizableLabel
                        labelId="krums_pan_header_label"
                        defaultText="Pan Position Offsets"
                        showIconAlways={false}
                        className="font-bold text-slate-300 text-[11px] block"
                      />

                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{uiText("components_krums_studio_modal.span.offset_x", "Offset X")}</span>
                          <span className="font-mono">{activeItem.panX}{uiText("components_krums_studio_modal.span.px", "px")}</span>
                        </div>
                        <input
                          type="range"
                          min="-400"
                          max="400"
                          value={activeItem.panX}
                          onChange={(e) => updateActiveTransforms({ panX: Number(e.target.value) })}
                          className="w-full accent-amber-400 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{uiText("components_krums_studio_modal.span.offset_y", "Offset Y")}</span>
                          <span className="font-mono">{activeItem.panY}{uiText("components_krums_studio_modal.span.px_2", "px")}</span>
                        </div>
                        <input
                          type="range"
                          min="-400"
                          max="400"
                          value={activeItem.panY}
                          onChange={(e) => updateActiveTransforms({ panY: Number(e.target.value) })}
                          className="w-full accent-amber-400 cursor-pointer"
                        />
                      </div>

                      <CustomizableButton
                        buttonId="krums_pan_center"
                        defaultLabel="Center Pan (0, 0)"
                        onClick={() => updateActiveTransforms({ panX: 0, panY: 0 })}
                        className="w-full py-1 text-center text-[10px] text-slate-400 hover:text-white bg-slate-900 rounded border border-slate-800 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: STRETCH & DISTORT */}
                {activeTab === "stretch" && activeItem && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <CustomizableLabel
                        labelId="krums_stretch_header_label"
                        defaultText="Stretch & Aspect Distort"
                        defaultIcon={<StretchHorizontal className="w-3.5 h-3.5" />}
                        className="font-bold text-amber-300 flex items-center gap-1.5"
                      />
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {activeItem.stretchX.toFixed(2)}{uiText("components_krums_studio_modal.span.x_3", "x : ")}{activeItem.stretchY.toFixed(2)}{uiText("components_krums_studio_modal.span.x_4", "x")}
                      </span>
                    </div>

                    {/* Presets */}
                    <div>
                      <CustomizableLabel
                        labelId="krums_stretch_presets_label"
                        defaultText="Quick Aspect Presets"
                        showIconAlways={false}
                        className="text-[10px] text-slate-400 font-bold block mb-1.5"
                      />
                      <div className="grid grid-cols-3 gap-1.5">
                        {ASPECT_STRETCH_PRESETS.map((p) => (
                          <CustomizableButton
                            key={p.label}
                            buttonId={STRETCH_BUTTON_IDS[p.label] || "krums_stretch_preset_square"}
                            defaultLabel={p.label}
                            onClick={() =>
                              updateActiveTransforms({ stretchX: p.sx, stretchY: p.sy, skewX: 0, skewY: 0 })
                            }
                            className="py-1 px-1.5 rounded bg-slate-900 hover:bg-slate-800 text-[9.5px] font-bold text-slate-300 border border-slate-800 text-center truncate cursor-pointer"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Horizontal Stretch Slider */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                        <span>{uiText("components_krums_studio_modal.span.stretch_x_width", "Stretch X (Width)")}</span>
                        <span className="font-mono font-bold text-amber-400">
                          {activeItem.stretchX.toFixed(2)}{uiText("components_krums_studio_modal.span.x_5", "x")}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="3.0"
                        step="0.05"
                        value={activeItem.stretchX}
                        onChange={(e) =>
                          updateActiveTransforms({ stretchX: Number(e.target.value) })
                        }
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                    </div>

                    {/* Vertical Stretch Slider */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                        <span>{uiText("components_krums_studio_modal.span.stretch_y_height", "Stretch Y (Height)")}</span>
                        <span className="font-mono font-bold text-amber-400">
                          {activeItem.stretchY.toFixed(2)}{uiText("components_krums_studio_modal.span.x_6", "x")}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="3.0"
                        step="0.05"
                        value={activeItem.stretchY}
                        onChange={(e) =>
                          updateActiveTransforms({ stretchY: Number(e.target.value) })
                        }
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                    </div>

                    {/* Skew Controls for 3D/Shear effect */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <CustomizableLabel
                        labelId="krums_skew_header_label"
                        defaultText="Perspective Skew / Shear"
                        showIconAlways={false}
                        className="font-bold text-slate-300 text-[11px] block"
                      />
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{uiText("components_krums_studio_modal.span.skew_x", "Skew X")}</span>
                          <span className="font-mono">{activeItem.skewX}°</span>
                        </div>
                        <input
                          type="range"
                          min="-45"
                          max="45"
                          value={activeItem.skewX}
                          onChange={(e) => updateActiveTransforms({ skewX: Number(e.target.value) })}
                          className="w-full accent-amber-400 cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{uiText("components_krums_studio_modal.span.skew_y", "Skew Y")}</span>
                          <span className="font-mono">{activeItem.skewY}°</span>
                        </div>
                        <input
                          type="range"
                          min="-45"
                          max="45"
                          value={activeItem.skewY}
                          onChange={(e) => updateActiveTransforms({ skewY: Number(e.target.value) })}
                          className="w-full accent-amber-400 cursor-pointer"
                        />
                      </div>
                    </div>

                    <CustomizableButton
                      buttonId="krums_stretch_reset"
                      defaultLabel="Reset Stretch & Skew"
                      onClick={() =>
                        updateActiveTransforms({ stretchX: 1, stretchY: 1, skewX: 0, skewY: 0 })
                      }
                      className="w-full py-1.5 text-center text-[10.5px] font-bold text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 rounded-lg border border-slate-800/80 cursor-pointer"
                    />
                  </div>
                )}

                {/* TAB 4: EFFECTS & COLOR FILTERS */}
                {activeTab === "effects" && activeItem && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <CustomizableLabel
                        labelId="krums_fx_header_label"
                        defaultText="Visual Effects & Color FX"
                        defaultIcon={<Sparkles className="w-3.5 h-3.5" />}
                        className="font-bold text-amber-300 flex items-center gap-1.5"
                      />
                    </div>

                    {/* Presets Palette */}
                    <div>
                      <CustomizableLabel
                        labelId="krums_fx_presets_label"
                        defaultText="Filter Presets"
                        showIconAlways={false}
                        className="text-[10px] text-slate-400 font-bold block mb-1.5"
                      />
                      <div className="grid grid-cols-3 gap-1.5">
                        {FILTER_PRESETS.map((preset) => {
                          const isChosen = activeItem.filterPresetName === preset.name;
                          return (
                            <CustomizableButton
                              key={preset.name}
                              buttonId={PRESET_BUTTON_IDS[preset.name] || "krums_fx_preset_clean"}
                              defaultLabel={preset.label}
                              defaultIcon={
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: preset.color }}
                                />
                              }
                              onClick={() =>
                                updateActiveTransforms({
                                  ...preset.apply,
                                  filterPresetName: preset.name,
                                })
                              }
                              className={cn(
                                "py-1 px-1.5 rounded text-[10px] font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer truncate",
                                isChosen
                                  ? "bg-amber-500/20 text-amber-300 border-amber-400"
                                  : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                              )}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Sliders Grid */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                      {/* Brightness */}
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                          <span>{uiText("components_krums_studio_modal.span.brightness", "Brightness")}</span>
                          <span className="font-mono text-amber-400">{activeItem.brightness}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={activeItem.brightness}
                          onChange={(e) =>
                            updateActiveTransforms({
                              brightness: Number(e.target.value),
                              filterPresetName: "Custom",
                            })
                          }
                          className="w-full accent-amber-400 cursor-pointer"
                        />
                      </div>

                      {/* Contrast */}
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                          <span>{uiText("components_krums_studio_modal.span.contrast", "Contrast")}</span>
                          <span className="font-mono text-amber-400">{activeItem.contrast}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={activeItem.contrast}
                          onChange={(e) =>
                            updateActiveTransforms({
                              contrast: Number(e.target.value),
                              filterPresetName: "Custom",
                            })
                          }
                          className="w-full accent-amber-400 cursor-pointer"
                        />
                      </div>

                      {/* Saturation */}
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                          <span>{uiText("components_krums_studio_modal.span.saturation", "Saturation")}</span>
                          <span className="font-mono text-amber-400">{activeItem.saturate}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="250"
                          value={activeItem.saturate}
                          onChange={(e) =>
                            updateActiveTransforms({
                              saturate: Number(e.target.value),
                              filterPresetName: "Custom",
                            })
                          }
                          className="w-full accent-amber-400 cursor-pointer"
                        />
                      </div>

                      {/* Hue Rotate */}
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                          <span>{uiText("components_krums_studio_modal.span.hue_shift", "Hue Shift")}</span>
                          <span className="font-mono text-amber-400">{activeItem.hueRotate}°</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={activeItem.hueRotate}
                          onChange={(e) =>
                            updateActiveTransforms({
                              hueRotate: Number(e.target.value),
                              filterPresetName: "Custom",
                            })
                          }
                          className="w-full accent-amber-400 cursor-pointer"
                        />
                      </div>

                      {/* Vignette */}
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                          <span>{uiText("components_krums_studio_modal.span.dark_vignette_frame", "Dark Vignette Frame")}</span>
                          <span className="font-mono text-amber-400">{activeItem.vignette}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={activeItem.vignette}
                          onChange={(e) =>
                            updateActiveTransforms({
                              vignette: Number(e.target.value),
                              filterPresetName: "Custom",
                            })
                          }
                          className="w-full accent-amber-400 cursor-pointer"
                        />
                      </div>

                      {/* Sepia & Grayscale */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span>{uiText("components_krums_studio_modal.span.sepia", "Sepia")}</span>
                            <span className="font-mono">{activeItem.sepia}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={activeItem.sepia}
                            onChange={(e) =>
                              updateActiveTransforms({
                                sepia: Number(e.target.value),
                                filterPresetName: "Custom",
                              })
                            }
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span>{uiText("components_krums_studio_modal.span.b_and_w", "B&W")}</span>
                            <span className="font-mono">{activeItem.grayscale}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={activeItem.grayscale}
                            onChange={(e) =>
                              updateActiveTransforms({
                                grayscale: Number(e.target.value),
                                filterPresetName: "Custom",
                              })
                            }
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Reset FX */}
                    <CustomizableButton
                      buttonId="krums_fx_reset"
                      defaultLabel="Reset All Effects"
                      onClick={() =>
                        updateActiveTransforms({
                          brightness: 100,
                          contrast: 100,
                          saturate: 100,
                          hueRotate: 0,
                          blur: 0,
                          invert: 0,
                          sepia: 0,
                          grayscale: 0,
                          vignette: 0,
                          tintOpacity: 0,
                          filterPresetName: "Normal",
                        })
                      }
                      className="w-full py-1.5 text-center text-[10.5px] font-bold text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 rounded-lg border border-slate-800/80 cursor-pointer"
                    />
                  </div>
                )}

                {/* Batch Apply to All Images Banner */}
                {images.length > 1 && (
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1.5">
                    <CustomizableLabel
                      labelId="krums_batch_sync_label"
                      defaultText="Batch Synchronization"
                      showIconAlways={false}
                      className="text-[10px] font-bold text-amber-300 block"
                    />
                    <CustomizableButton
                      buttonId="krums_batch_apply_all"
                      defaultLabel={`Apply Transforms & FX to ALL ${images.length} Images`}
                      onClick={handleApplyTransformsToAll}
                      className="w-full py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10.5px] font-bold rounded-lg border border-amber-500/40 transition-colors cursor-pointer"
                    />
                    <CustomizableButton
                      buttonId="krums_batch_commit_all"
                      defaultLabel={`Commit All Changes to ALL ${images.length} Images`}
                      defaultIcon={<CheckCheck className="w-3.5 h-3.5 text-emerald-300" />}
                      onClick={handleCommitAllChanges}
                      disabled={isProcessing}
                      className="w-full py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-200 text-[10.5px] font-bold rounded-lg border border-emerald-500/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      title="Permanently bake all matrix transforms & effects into image data"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-9 bg-[#080d1a] border-l border-slate-800/80 flex flex-col items-center py-3 shrink-0 select-none">
              <CustomizableButton
                buttonId="krums_panel_expand_transforms"
                defaultLabel=""
                defaultIcon={<ChevronLeft className="w-4 h-4 text-amber-400" />}
                onClick={() => setShowTransformsPanel(true)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 cursor-pointer shadow-sm"
                title="Expand Transforms Matrix Studio"
                forceZeroText
              />
              <span className="[writing-mode:vertical-lr] text-[10px] font-bold text-slate-500 tracking-wider uppercase mt-3">
                {uiText("components_krums_studio_modal.span.matrix", "Matrix")}
              </span>
            </div>
          )}

          {/* All panels collapsed fallback helper */}
          {!showQueuePanel && !showViewportPanel && !showTransformsPanel && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#02050c]">
              <KrumsIcon className="w-12 h-12 text-amber-400/50 mb-3" />
              <CustomizableLabel
                labelId="krums_studio_modal_item_2"
                as="h3"
                className="text-base font-bold text-slate-200 mb-1"
              >
                  {() => (
                      <>
                        {uiText("components_krums_studio_modal.h3.all_studio_panels_hidden", "All Studio Panels Hidden")}
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                {uiText("components_krums_studio_modal.p.you_have_collapsed_all_three_main_panels_cli", "You have collapsed all three main panels. Click below or use the top panel toggles to restore the workspace.")}
              </p>
              <CustomizableButton
                buttonId="krums_studio_modal_btn_1"
                type="button"
onClick={() => {
                  setShowQueuePanel(true);
                  setShowViewportPanel(true);
                  setShowTransformsPanel(true);
                }}
className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg transition-all"
              >
                  {() => (
                      <>
                        {uiText("components_krums_studio_modal.button.restore_all_panels", "Restore All Panels")}
                      </>
                    )}
              </CustomizableButton>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION DOCK: STORYBOARD EXPORT & CARVER SINK */}
        {showExportDock ? (
          <div className="px-4 py-2.5 bg-[#0a0f1f] border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <CustomizableLabel
                labelId="krums_dock_count_label"
                defaultText={`${images.length} image${images.length !== 1 ? "s" : ""} staged in sequence`}
                showIconAlways={false}
                className="text-[11px] text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Download / ZIP backup */}
              <CustomizableButton
                buttonId="krums_dock_download_active"
                defaultLabel="Download Active"
                defaultIcon={<Download className="w-3.5 h-3.5" />}
                onClick={handleDownloadActive}
                disabled={!activeItem || isProcessing}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                title="Download active transformed image"
              />

              <CustomizableButton
                buttonId="krums_dock_export_zip"
                defaultLabel="Export ZIP"
                defaultIcon={<Archive className="w-3.5 h-3.5" />}
                onClick={handleExportZip}
                disabled={images.length === 0 || isProcessing}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                title="Download entire sequence as ZIP"
              />

              {/* Carver Canvas destination */}
              {onSendToCarverCanvas && activeItem && (
                <CustomizableButton
                  buttonId="krums_dock_send_carver"
                  defaultLabel="Send to Carver Canvas"
                  defaultIcon={<Grid className="w-3.5 h-3.5 text-cyan-400" />}
                  onClick={handleSendActiveToCanvas}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                  title="Send active transformed image to the primary Carver Crop Canvas"
                />
              )}

              {/* Snapshot Live Canvas to Storyboard First (No download) */}
              <CustomizableButton
                buttonId="krums_dock_snapshot_storyboard"
                defaultLabel="Snapshot to Storyboard First"
                defaultIcon={<Camera className="w-3.5 h-3.5 text-emerald-400" />}
                onClick={() => handleCopyLiveCanvasSnapshotToStoryboard(false, false)}
                disabled={!activeItem || isProcessing}
                className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Capture snapshot reflecting exact live canvas appearance and copy to Storyboard first (not download image)"
              />

              {/* Set Present State as Default State */}
              <CustomizableButton
                buttonId="krums_dock_save_default_state"
                defaultLabel="Set as Default State"
                defaultIcon={<Bookmark className="w-3.5 h-3.5 text-amber-400" />}
                onClick={handleSavePresentStateAsDefault}
                disabled={isProcessing}
                className="px-2.5 py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                title="Use the present state of Krums Studio as its default state"
              />

              {/* Commit All Changes Button (Bottom Action Dock) */}
              <CustomizableButton
                buttonId="krums_dock_commit_all"
                defaultLabel={`Commit All Changes (${images.length})`}
                defaultIcon={<CheckCheck className="w-3.5 h-3.5 text-emerald-300" />}
                onClick={handleCommitAllChanges}
                disabled={images.length === 0 || isProcessing}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm border active:scale-95 disabled:opacity-40",
                  hasUncommittedChanges
                    ? "bg-emerald-600 hover:bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-emerald-950/40"
                    : "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40"
                )}
                title="Permanently bake all transformations & effects into all staged images"
              />

              {/* SEND ALL TO STORYBOARD SLOTS (Primary Action) */}
              <CustomizableButton
                buttonId="krums_dock_send_storyboard"
                defaultLabel={`Send All (${images.length}) to Storyboard`}
                defaultIcon={<Layers className="w-4 h-4" />}
                onClick={() => handleSendAllToStoryboard("storyboard-slots")}
                disabled={images.length === 0 || isProcessing}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-40"
              />

              <CustomizableButton
                buttonId="krums_panel_collapse_dock"
                defaultLabel=""
                defaultIcon={<ChevronDown className="w-3.5 h-3.5" />}
                onClick={() => setShowExportDock(false)}
                className="p-1.5 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 border border-slate-800 cursor-pointer ml-1"
                title="Collapse Export Dock"
                forceZeroText
              />
            </div>
          </div>
        ) : (
          <div className="px-3 py-1 bg-[#090f1f] border-t border-slate-800/80 flex items-center justify-between shrink-0 text-xs text-slate-500">
            <span className="text-[11px] font-mono">{uiText("components_krums_studio_modal.span.dock_collapsed", "Dock Collapsed (")}{images.length}{uiText("components_krums_studio_modal.span.images_staged", " images staged)")}</span>
            <CustomizableButton
              buttonId="krums_panel_expand_dock"
              defaultLabel="Show Export Dock"
              defaultIcon={<ChevronUp className="w-3.5 h-3.5" />}
              onClick={() => setShowExportDock(true)}
              className="px-2 py-0.5 rounded text-[10px] font-bold text-amber-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center gap-1 cursor-pointer"
              title="Show Export Dock"
            />
          </div>
        )}
      </div>
    </div>
  );
};
