import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Lock,
  Unlock,
  Layers,
  LayoutGrid,
  Image as ImageIcon,
  RotateCw,
  GitBranch,
  Link2,
  Palette,
  Compass,
  ArrowUpDown,
  Scissors,
  Upload,
  Plus,
  Check,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Trash2,
  Bookmark,
  Play,
  Pause,
  Shuffle,
  Undo2,
  MousePointerClick,
  Sliders,
  Grid,
  Edit2,
  Save,
  Database,
  Search,
  ArrowRight,
  FolderPlus,
  Copy,
  Tag,
  CheckCircle2,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  ArrowLeftRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "../utils/cn";
import { CustomizableButton } from "./CustomizableButton";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableContainer } from "./CustomizableContainer";
import { NamedWorkspaceDialog } from "./NamedWorkspaceDialog";
import type { NamedWorkspaceSnapshot } from "../types/namedWorkspace";
import { saveStoredDefaultImage, saveStoredJson } from "../utils/idbStorage";
import {
  saveAppStateToDatabase,
  getAppStateFromDatabase,
  saveDatabaseConfig,
} from "../services/firebase";
import type { TileLinkConfig } from "./TileLinkModal";
import { uiText } from "../hooks/useUIConfig";
import { remoteStore } from "../services/remoteKeyValueStore";
import {
  SequencerPanel,
  getPresetPath,
  type SequencerPanelState,
  type SequencerSource,
} from "./SequencerPanel";
import eurospectImg from "../assets/images/eurospect_header_1786007763255.jpg";
import { DEFAULT_USER_DEFINED_IMAGE_PATH } from "../types/userDefinedImage";

export interface ControlDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  captureNamedState: () => NamedWorkspaceSnapshot;
  restoreNamedState: (state: NamedWorkspaceSnapshot) => Promise<void>;
  initialBoxId?: number;
  initialTab?: "SPREAD" | "IMAGE" | "ROTATION" | "SEQUENCER" | "LINK" | "STYLE" | "MOTION" | "SORTER";
  boxImages: Record<number, string>;
  setBoxImages: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  boxRotationSeries: Record<number, string[]>;
  setBoxRotationSeries: React.Dispatch<React.SetStateAction<Record<number, string[]>>>;
  boxRotationIntervals: Record<number, number>;
  setBoxRotationIntervals: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  boxRotationActive: Record<number, boolean>;
  setBoxRotationActive: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  boxLinkConfigs: Record<number, TileLinkConfig>;
  setBoxLinkConfigs: React.Dispatch<React.SetStateAction<Record<number, TileLinkConfig>>>;
  defaultBoxImages?: Record<number, string>;
  storyboardSlices?: { name: string; url: string }[];
  originalSpreadImage?: string;
  setOriginalSpreadImage?: (url: string) => void;
  is4x4?: boolean;
  onToggleGridMode?: () => void;
  gridMode?: "3x3" | "4x4";
  handleSplitImageToNBoxes?: (imageUrl?: string, n?: number) => void;
  handleSetNBoxDefault?: (imageUrl: string, n?: number) => void;
  handleReset9BoxDefault?: () => void;
  handleSendBoxImageToCarver?: (imageUrl: string) => void;
  handleBoxImageUpload?: (boxId: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  sequencerState: SequencerPanelState;
  setSequencerState: React.Dispatch<React.SetStateAction<SequencerPanelState>>;
}

// Saved Artwork Source record interface for database persistence
export interface SavedArtworkSource {
  id: string;
  name: string;
  url: string;
  timestamp: string;
}

// URL Library Item interface for editable library and instant panel recall
export interface UrlLibraryItem {
  id: string;
  title: string;
  url: string;
  category?: string;
  createdAt: string;
  updatedAt?: string;
}

// Default persistent artwork sources in the database (matching 3x4 grid)
const DEFAULT_SAVED_ARTWORK_SOURCES: SavedArtworkSource[] = [
  { id: "seq_src_user_def", name: "User Defined Default", url: DEFAULT_USER_DEFINED_IMAGE_PATH, timestamp: "Default" },
  { id: "seq_src_01", name: "Fog Castle", url: "/sequencer/sources/source-01.jpg", timestamp: "Default" },
  { id: "seq_src_02", name: "Aurora Flow", url: "/sequencer/sources/source-02.jpg", timestamp: "Default" },
  { id: "seq_src_03", name: "Red Mountain", url: "/sequencer/sources/source-03.jpg", timestamp: "Default" },
  { id: "seq_src_04", name: "Floating City", url: "/sequencer/sources/source-04.jpg", timestamp: "Default" },
  { id: "seq_src_05", name: "Crimson Muse", url: "/sequencer/sources/source-05.jpg", timestamp: "Default" },
  { id: "seq_src_06", name: "Night Rider", url: "/sequencer/sources/source-06.jpg", timestamp: "Default" },
  { id: "seq_src_07", name: "Signal Tower", url: "/sequencer/sources/source-07.jpg", timestamp: "Default" },
  { id: "seq_src_08", name: "Prism Portrait", url: "/sequencer/sources/source-08.jpg", timestamp: "Default" },
  { id: "seq_src_09", name: "Neon Forest", url: "/sequencer/sources/source-09.jpg", timestamp: "Default" },
  { id: "seq_src_10", name: "City Arrival", url: "/sequencer/sources/source-10.jpg", timestamp: "Default" },
  { id: "seq_src_11", name: "Blue Gaze", url: "/sequencer/sources/source-11.jpg", timestamp: "Default" },
  { id: "seq_src_12", name: "Pastel Wash", url: "/sequencer/sources/source-12.jpg", timestamp: "Default" },
];

// Default URL library items ready for on-the-fly recall to panel positions
const DEFAULT_URL_LIBRARY: UrlLibraryItem[] = [
  {
    id: "url_neon_banner",
    title: "Cyberpunk Neon Banner",
    url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    category: "Neon",
    createdAt: new Date().toISOString(),
  },
  {
    id: "url_fluid_3d",
    title: "Abstract Fluid Wave",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    category: "3D",
    createdAt: new Date().toISOString(),
  },
  {
    id: "url_retro_synth",
    title: "Retro Synth Sunset",
    url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80",
    category: "Retro",
    createdAt: new Date().toISOString(),
  },
  {
    id: "url_hologram",
    title: "Holographic Sphere",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80",
    category: "3D",
    createdAt: new Date().toISOString(),
  },
  {
    id: "url_tokyo_alley",
    title: "Tokyo Cyber Alley",
    url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
    category: "City",
    createdAt: new Date().toISOString(),
  },
  {
    id: "url_geometric",
    title: "Minimal Geometric Art",
    url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80",
    category: "Design",
    createdAt: new Date().toISOString(),
  },
];

// Built-in pool images if storyboard is empty, ensuring the UI is visually rich as in screenshots
const DEFAULT_POOL_SLICES = [
  { name: "Cyber Neon 1", url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80" },
  { name: "Neon District", url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80" },
  { name: "Retro Wave", url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80" },
  { name: "Cyber Portrait", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80" },
  { name: "Synth Horizon", url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80" },
  { name: "Night Club", url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80" },
  { name: "Studio Silhouette", url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80" },
  { name: "Monochrome Gaze", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80" },
  { name: "Silk Aesthetic", url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=600&auto=format&fit=crop&q=80" },
];

export const ControlDeckModal: React.FC<ControlDeckModalProps> = ({
  isOpen,
  onClose,
  captureNamedState,
  restoreNamedState,
  initialBoxId = 4,
  initialTab,
  boxImages,
  setBoxImages,
  boxRotationSeries,
  setBoxRotationSeries,
  boxRotationIntervals,
  setBoxRotationIntervals,
  boxRotationActive,
  setBoxRotationActive,
  boxLinkConfigs,
  setBoxLinkConfigs,
  defaultBoxImages = {},
  storyboardSlices = [],
  originalSpreadImage = "",
  setOriginalSpreadImage,
  is4x4 = false,
  onToggleGridMode,
  gridMode,
  handleSplitImageToNBoxes,
  handleSetNBoxDefault,
  handleReset9BoxDefault,
  handleSendBoxImageToCarver,
  handleBoxImageUpload,
  sequencerState,
  setSequencerState,
}) => {
  const [showNamedStates, setShowNamedStates] = useState(false);
  useEffect(() => {
    if (!isOpen) setShowNamedStates(false);
  }, [isOpen]);

  // Navigation active tab
  const [activeTab, setActiveTab] = useState<
    "SPREAD" | "IMAGE" | "ROTATION" | "SEQUENCER" | "LINK" | "STYLE" | "MOTION" | "SORTER"
  >(initialTab || "SPREAD");

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Local grid mode state (2x2 vs 3x3 vs 4x4) with persistent recall
  const [localGridMode, setLocalGridMode] = useState<"2x2" | "3x3" | "4x4">(() => {
    const savedMode = remoteStore.getItem("seqcarver_control_deck_grid_mode");
    if (savedMode === "2x2") return "2x2";
    return is4x4 || gridMode === "4x4" ? "4x4" : "3x3";
  });

  const isCurrent4x4 = localGridMode === "4x4";
  const isCurrent2x2 = localGridMode === "2x2";
  const gridCols = isCurrent4x4 ? 4 : isCurrent2x2 ? 2 : 3;
  const totalSlots = gridCols * gridCols;
  const slotList = useMemo(() => Array.from({ length: totalSlots }, (_, i) => i + 1), [totalSlots]);

  // Selected active panel (e.g. 1..4, 1..9, or 1..16)
  const [selectedPanelId, setSelectedPanelId] = useState<number>(() => {
    return initialBoxId && initialBoxId <= totalSlots ? initialBoxId : Math.min(4, totalSlots);
  });
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Show / Hide top panel buttons state (defaults to false for clean Fit-in-Pane header)
  const [showTopPanelButtons, setShowTopPanelButtons] = useState<boolean>(() => {
    const saved = remoteStore.getItem("seqcarver_control_deck_show_top_buttons");
    return saved !== null ? saved === "true" : false;
  });

  const handleToggleShowTopPanelButtons = () => {
    setShowTopPanelButtons((prev) => {
      const next = !prev;
      remoteStore.setItem("seqcarver_control_deck_show_top_buttons", String(next));
      saveAppStateToDatabase("control_deck_show_top_buttons", next).catch(console.warn);
      showToast(next ? "✓ Top panel buttons visible" : "✓ Top panel buttons hidden");
      return next;
    });
  };

  // Selected canvas slots for spread carving - reflects front page state
  const [selectedSlots, setSelectedSlots] = useState<number[]>(slotList);

  // Artwork source image (defaults to userDefinedDefault, originalSpreadImage, Box 1 or pool slice)
  const [artworkSource, setArtworkSource] = useState<string>(() => {
    if (originalSpreadImage && !originalSpreadImage.includes("source-01.jpg")) return originalSpreadImage;
    if (boxImages[1] && !boxImages[1].includes("source-01.jpg")) return boxImages[1];
    return DEFAULT_USER_DEFINED_IMAGE_PATH;
  });

  // Saved Artwork Sources in system database
  const [savedArtworkSources, setSavedArtworkSources] = useState<SavedArtworkSource[]>(() => {
    const local = remoteStore.getItem("seqcarver_artwork_sources_v2");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length >= 12) return parsed;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p) => p.id));
          const additions = DEFAULT_SAVED_ARTWORK_SOURCES.filter((d) => !existingIds.has(d.id));
          return [...parsed, ...additions];
        }
      } catch {}
    }
    // Preserve user-added sources from the pre-screenshot artwork library.
    const legacy = remoteStore.getItem("seqcarver_artwork_sources");
    if (legacy) {
      try {
        const parsedLegacy = JSON.parse(legacy) as SavedArtworkSource[];
        const customSources = parsedLegacy.filter(
          (source) =>
            source?.url &&
            !source.id?.startsWith("art_") &&
            !source.id?.startsWith("seq_src_") &&
            !source.url.startsWith("https://images.unsplash.com/"),
        );
        if (customSources.length) return [...customSources, ...DEFAULT_SAVED_ARTWORK_SOURCES];
      } catch {}
    }
    return DEFAULT_SAVED_ARTWORK_SOURCES;
  });

  // URL Library System state
  const [urlLibrary, setUrlLibrary] = useState<UrlLibraryItem[]>(() => {
    const local = remoteStore.getItem("seqcarver_url_library");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_URL_LIBRARY;
  });

  // URL Library Search & Add/Edit Form states
  const [urlSearchQuery, setUrlSearchQuery] = useState<string>("");
  const [editingUrlItem, setEditingUrlItem] = useState<UrlLibraryItem | null>(null);
  const [isAddUrlModalOpen, setIsAddUrlModalOpen] = useState<boolean>(false);
  const [newUrlTitle, setNewUrlTitle] = useState<string>("");
  const [newUrlLink, setNewUrlLink] = useState<string>("");
  const [newUrlCategory, setNewUrlCategory] = useState<string>("Custom");

  // Filtered URL Library for search & recall - declared at top-level before early returns (Rules of Hooks)
  const filteredUrlLibrary = useMemo(() => {
    if (!urlSearchQuery.trim()) return urlLibrary;
    const q = urlSearchQuery.toLowerCase();
    return urlLibrary.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
    );
  }, [urlLibrary, urlSearchQuery]);

  // Load persistent Artwork Sources, URL Library, and Spread settings from Firestore database
  useEffect(() => {
    if (isOpen) {
      getAppStateFromDatabase<SavedArtworkSource[]>("control_deck_artwork_sources_v2")
        .then((remoteSources) => {
          if (remoteSources && Array.isArray(remoteSources) && remoteSources.length > 0) {
            setSavedArtworkSources(remoteSources);
            remoteStore.setItem("seqcarver_artwork_sources_v2", JSON.stringify(remoteSources));
          }
        })
        .catch((e) => console.warn("Notice loading remote artwork sources:", e));

      getAppStateFromDatabase<UrlLibraryItem[]>("url_library")
        .then((remoteLibrary) => {
          if (remoteLibrary && Array.isArray(remoteLibrary) && remoteLibrary.length > 0) {
            setUrlLibrary(remoteLibrary);
            remoteStore.setItem("seqcarver_url_library", JSON.stringify(remoteLibrary));
          }
        })
        .catch((e) => console.warn("Notice loading remote URL library:", e));

      getAppStateFromDatabase<{
        colourTreatment?: "None" | "Grayscale" | "Sepia" | "Invert" | "Contrast" | "Saturate" | "Cool" | "Warm";
        stretchX?: number;
        stretchY?: number;
        isStretchLinked?: boolean;
        rememberAsMaster?: boolean;
        gridMode?: "2x2" | "3x3" | "4x4";
      }>("control_deck_spread_settings")
        .then((remoteSettings) => {
          if (remoteSettings && typeof remoteSettings === "object") {
            if (remoteSettings.colourTreatment) setColourTreatment(remoteSettings.colourTreatment);
            if (typeof remoteSettings.stretchX === "number") setStretchX(remoteSettings.stretchX);
            if (typeof remoteSettings.stretchY === "number") setStretchY(remoteSettings.stretchY);
            if (typeof remoteSettings.isStretchLinked === "boolean") setIsStretchLinked(remoteSettings.isStretchLinked);
            if (typeof remoteSettings.rememberAsMaster === "boolean") setRememberAsMaster(remoteSettings.rememberAsMaster);
            if (remoteSettings.gridMode === "2x2") {
              setLocalGridMode("2x2");
              remoteStore.setItem("seqcarver_control_deck_grid_mode", "2x2");
            }
            remoteStore.setItem("seqcarver_control_deck_spread_settings", JSON.stringify(remoteSettings));
          }
        })
        .catch((e) => console.warn("Notice loading remote spread settings:", e));

      getAppStateFromDatabase<boolean>("control_deck_show_top_buttons")
        .then((remoteShowTop) => {
          if (typeof remoteShowTop === "boolean") {
            setShowTopPanelButtons(remoteShowTop);
            remoteStore.setItem("seqcarver_control_deck_show_top_buttons", String(remoteShowTop));
          }
        })
        .catch((e) => console.warn("Notice loading top button visibility:", e));
    }
  }, [isOpen]);

  // URL input states for SPREAD and IMAGE tabs
  const [urlInput, setUrlInput] = useState<string>("");
  const [imageUrlInput, setImageUrlInput] = useState<string>("");

  // Read cached Spread settings synchronously for instant recall on refresh
  const initialSpreadSettings = useMemo(() => {
    const raw = remoteStore.getItem("seqcarver_control_deck_spread_settings");
    if (raw) {
      try {
        return JSON.parse(raw) as {
          colourTreatment?: "None" | "Grayscale" | "Sepia" | "Invert" | "Contrast" | "Saturate" | "Cool" | "Warm";
          stretchX?: number;
          stretchY?: number;
          isStretchLinked?: boolean;
          rememberAsMaster?: boolean;
          gridMode?: "2x2" | "3x3" | "4x4";
        };
      } catch {}
    }
    return {};
  }, []);

  // Colour treatment filter
  const [colourTreatment, setColourTreatment] = useState<
    "None" | "Grayscale" | "Sepia" | "Invert" | "Contrast" | "Saturate" | "Cool" | "Warm"
  >(initialSpreadSettings.colourTreatment || "None");

  // Stretch X and Y with link support
  const [stretchX, setStretchX] = useState<number>(
    typeof initialSpreadSettings.stretchX === "number" ? initialSpreadSettings.stretchX : 1.0
  );
  const [stretchY, setStretchY] = useState<number>(
    typeof initialSpreadSettings.stretchY === "number" ? initialSpreadSettings.stretchY : 1.0
  );
  const [isStretchLinked, setIsStretchLinked] = useState<boolean>(
    typeof initialSpreadSettings.isStretchLinked === "boolean" ? initialSpreadSettings.isStretchLinked : true
  );

  // Remember this artwork as the master
  const [rememberAsMaster, setRememberAsMaster] = useState<boolean>(
    typeof initialSpreadSettings.rememberAsMaster === "boolean" ? initialSpreadSettings.rememberAsMaster : true
  );

  const persistSpreadSettings = (
    overrides: Partial<{
      colourTreatment: "None" | "Grayscale" | "Sepia" | "Invert" | "Contrast" | "Saturate" | "Cool" | "Warm";
      stretchX: number;
      stretchY: number;
      isStretchLinked: boolean;
      rememberAsMaster: boolean;
      gridMode: "2x2" | "3x3" | "4x4";
    }>
  ) => {
    const payload = {
      colourTreatment,
      stretchX,
      stretchY,
      isStretchLinked,
      rememberAsMaster,
      gridMode: localGridMode,
      ...overrides,
    };
    remoteStore.setItem("seqcarver_control_deck_spread_settings", JSON.stringify(payload));
    saveAppStateToDatabase("control_deck_spread_settings", payload).catch(console.warn);
  };

  const handleStretchXChange = (val: number) => {
    const nextY = isStretchLinked ? val : stretchY;
    setStretchX(val);
    if (isStretchLinked) {
      setStretchY(val);
    }
    persistSpreadSettings({ stretchX: val, stretchY: nextY });
  };

  const handleStretchYChange = (val: number) => {
    const nextX = isStretchLinked ? val : stretchX;
    setStretchY(val);
    if (isStretchLinked) {
      setStretchX(val);
    }
    persistSpreadSettings({ stretchX: nextX, stretchY: val });
  };

  const handleColourTreatmentChange = (
    nextTreatment: "None" | "Grayscale" | "Sepia" | "Invert" | "Contrast" | "Saturate" | "Cool" | "Warm"
  ) => {
    setColourTreatment(nextTreatment);
    persistSpreadSettings({ colourTreatment: nextTreatment });
  };

  // Floating adjustments popover state in compacted Fit-in-Pane Spread view
  const [isSpreadAdjustOpen, setIsSpreadAdjustOpen] = useState<boolean>(false);
  const spreadAdjustPopoverRef = useRef<HTMLDivElement | null>(null);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File upload refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageTabFileInputRef = useRef<HTMLInputElement | null>(null);
  const hoverImageUploadRef = useRef<HTMLInputElement | null>(null);
  const headerSlotUploadInputRef = useRef<HTMLInputElement | null>(null);
  const sequencerSourceUploadRef = useRef<HTMLInputElement | null>(null);

  // Test hover active state for Link tab
  const [isTestHoverActive, setIsTestHoverActive] = useState<boolean>(false);

  // Parallax tilt simulation state for Motion tab
  const [parallaxTilt, setParallaxTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Global rotation dropdown state & ref (moved from front page to Control Deck)
  const [isGlobalRotationMenuOpen, setIsGlobalRotationMenuOpen] = useState<boolean>(false);
  const globalRotationMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (globalRotationMenuRef.current && !globalRotationMenuRef.current.contains(e.target as Node)) {
        setIsGlobalRotationMenuOpen(false);
      }
      if (spreadAdjustPopoverRef.current && !spreadAdjustPopoverRef.current.contains(e.target as Node)) {
        setIsSpreadAdjustOpen(false);
      }
    };
    if (isGlobalRotationMenuOpen || isSpreadAdjustOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isGlobalRotationMenuOpen, isSpreadAdjustOpen]);

  // =========================================================
  // SEQUENCER STATE (Exact matching for screenshot_16.jpg)
  // =========================================================
  const [sequenceMode, setSequenceMode] = useState<"select" | "erase">("select");
  // Default Ring sequence matching screenshot_16.jpg: 1, 2, 3, 4 (middle-right), 5 (bottom-right), 6 (bottom-mid), 7 (bottom-left), 8 (mid-left)
  const [sequencePath, setSequencePath] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8]);
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(false);
  const [currentSequenceStep, setCurrentSequenceStep] = useState<number>(1);
  const [stepIntervalMs, setStepIntervalMs] = useState<number>(900);
  const [wrapMode, setWrapMode] = useState<"loop" | "pingpong" | "once">("loop");
  const [turnBehaviour, setTurnBehaviour] = useState<"step" | "spin" | "pulse">("step");
  const [isSequencerActive, setIsSequencerActive] = useState<boolean>(false);
  const [isPingPongReversing, setIsPingPongReversing] = useState<boolean>(false);

  // Combined pool slices: saved artwork sources + storyboard slices + default demo slices
  const combinedPool = useMemo(() => {
    const list: { name: string; url: string }[] = [];
    savedArtworkSources.forEach((s) => list.push({ name: s.name, url: s.url }));
    storyboardSlices.forEach((s) => list.push(s));
    DEFAULT_POOL_SLICES.forEach((s) => {
      if (!list.some((item) => item.url === s.url)) list.push(s);
    });
    return list;
  }, [savedArtworkSources, storyboardSlices]);

  // Sync initial state on open or grid change
  // User Requirement: "any revisit to the CANVAS SLOTS must reflect the current state of the front page."
  useEffect(() => {
    if (isOpen) {
      const savedMode = remoteStore.getItem("seqcarver_control_deck_grid_mode");
      const mode: "2x2" | "3x3" | "4x4" =
        savedMode === "2x2" && !(is4x4 || gridMode === "4x4")
          ? "2x2"
          : is4x4 || gridMode === "4x4"
          ? "4x4"
          : "3x3";
      setLocalGridMode(mode);
      const slots = mode === "4x4" ? 16 : mode === "2x2" ? 4 : 9;

      // Calculate which slots currently have images on the front page
      const activeFrontPageSlots = Array.from({ length: slots }, (_, i) => i + 1).filter(
        (slotNum) => Boolean(boxImages[slotNum] && boxImages[slotNum].trim() !== "")
      );

      if (activeFrontPageSlots.length > 0) {
        setSelectedSlots(activeFrontPageSlots);
      } else {
        // If all front page slots are currently blank, check cached selection or default to all for slicing
        const cached = remoteStore.getItem("seqcarver_canvas_selected_slots");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSelectedSlots(parsed.filter((s: number) => s <= slots));
            } else {
              setSelectedSlots(Array.from({ length: slots }, (_, i) => i + 1));
            }
          } catch {
            setSelectedSlots(Array.from({ length: slots }, (_, i) => i + 1));
          }
        } else {
          setSelectedSlots(Array.from({ length: slots }, (_, i) => i + 1));
        }
      }

      if (initialBoxId && initialBoxId <= slots) {
        setSelectedPanelId(initialBoxId);
      } else {
        setSelectedPanelId(Math.min(4, slots));
      }
      if (originalSpreadImage) {
        setArtworkSource(originalSpreadImage);
      } else if (boxImages[1]) {
        setArtworkSource(boxImages[1]);
      }
    }
  }, [isOpen, is4x4, gridMode, initialBoxId, totalSlots]);

  // Cycle grid mode across 3x3 -> 4x4 -> 2x2 -> 3x3
  const handleToggleGridMode = () => {
    const was4x4 = localGridMode === "4x4";
    const nextMode: "2x2" | "3x3" | "4x4" =
      localGridMode === "3x3" ? "4x4" : localGridMode === "4x4" ? "2x2" : "3x3";
    setLocalGridMode(nextMode);
    remoteStore.setItem("seqcarver_control_deck_grid_mode", nextMode);
    persistSpreadSettings({ gridMode: nextMode });

    const nextSlots = nextMode === "4x4" ? 16 : nextMode === "2x2" ? 4 : 9;
    const nextSlotArray = Array.from({ length: nextSlots }, (_, i) => i + 1);
    setSelectedSlots(nextSlotArray);
    remoteStore.setItem("seqcarver_canvas_selected_slots", JSON.stringify(nextSlotArray));

    if (selectedPanelId > nextSlots) {
      setSelectedPanelId(1);
    }
    // Update default sequence path for the new grid mode
    if (nextMode === "4x4") {
      setSequencePath([1, 2, 3, 4, 8, 12, 16, 15, 14, 13, 9, 5]);
    } else if (nextMode === "2x2") {
      setSequencePath([1, 2, 4, 3]);
    } else {
      setSequencePath([1, 2, 3, 4, 5, 6, 7, 8]);
    }
    const nextSequencerPath = getPresetPath(sequencerState.preset, nextSlots === 16 ? 16 : 9).filter(
      (id) => id <= nextSlots
    );
    setSequencerState((previous) => ({
      ...previous,
      activeSlots: nextSlotArray,
      path: nextSequencerPath.length > 0 ? nextSequencerPath : nextSlotArray,
      currentStep: 1,
      direction: 1,
    }));
    const nextIs4x4 = nextMode === "4x4";
    if (was4x4 !== nextIs4x4 && onToggleGridMode) {
      onToggleGridMode();
    }
    showToast(`✓ Cycled board to ${nextMode} (${nextSlots} slots)`);
  };

  // Sequencer Playback timer effect
  useEffect(() => {
    if (!isPlayingSequence || sequencePath.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSequenceStep((prevStep) => {
        const total = sequencePath.length;
        if (wrapMode === "loop") {
          return prevStep >= total ? 1 : prevStep + 1;
        } else if (wrapMode === "pingpong") {
          if (!isPingPongReversing) {
            if (prevStep >= total) {
              setIsPingPongReversing(true);
              return Math.max(1, total - 1);
            }
            return prevStep + 1;
          } else {
            if (prevStep <= 1) {
              setIsPingPongReversing(false);
              return 2;
            }
            return prevStep - 1;
          }
        } else {
          // once
          if (prevStep >= total) {
            setIsPlayingSequence(false);
            return total;
          }
          return prevStep + 1;
        }
      });
    }, stepIntervalMs);

    return () => clearInterval(timer);
  }, [isPlayingSequence, sequencePath, stepIntervalMs, wrapMode, isPingPongReversing]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Sequencer source library is shared with the SPREAD tab and persisted locally/remotely.
  const handleSequencerAddSource = (source: SequencerSource) => {
    const updated = [
      source,
      ...savedArtworkSources.filter((existing) => existing.url !== source.url),
    ];
    setSavedArtworkSources(updated);
    remoteStore.setItem("seqcarver_artwork_sources_v2", JSON.stringify(updated));
    saveAppStateToDatabase("control_deck_artwork_sources_v2", updated).catch((error) =>
      console.warn("Notice saving sequencer source:", error),
    );
  };

  const handleSequencerDeleteSource = (id: string) => {
    const updated = savedArtworkSources.filter((source) => source.id !== id);
    setSavedArtworkSources(updated);
    remoteStore.setItem("seqcarver_artwork_sources_v2", JSON.stringify(updated));
    saveAppStateToDatabase("control_deck_artwork_sources_v2", updated).catch((error) =>
      console.warn("Notice deleting sequencer source:", error),
    );
  };

  const toggleSequencerImageLock = () => {
    const nextLocked = !sequencerState.locked;
    setSequencerState((previous) => ({
      ...previous,
      locked: nextLocked,
      bypassed: false,
      playing: nextLocked ? true : previous.playing,
    }));
    showToast(
      nextLocked
        ? "✓ Secondary images locked in and transmitted to the front page"
        : "Secondary images unlocked for editing",
    );
  };

  const handleTopLockClick = () => {
    if (activeTab === "SEQUENCER") {
      toggleSequencerImageLock();
      return;
    }
    setIsLocked((previous) => {
      const next = !previous;
      showToast(next ? "Deck locked" : "Deck unlocked");
      return next;
    });
  };

  const isTopLockActive =
    activeTab === "SEQUENCER" ? sequencerState.locked : isLocked;

  if (!isOpen) return null;

  // Filter CSS mapping
  const getFilterStyle = (treatment: string) => {
    switch (treatment) {
      case "Grayscale":
        return "grayscale(100%)";
      case "Sepia":
        return "sepia(100%)";
      case "Invert":
        return "invert(100%)";
      case "Contrast":
        return "contrast(180%)";
      case "Saturate":
        return "saturate(200%)";
      case "Cool":
        return "hue-rotate(180deg) saturate(120%)";
      case "Warm":
        return "sepia(40%) saturate(160%) hue-rotate(-20deg)";
      default:
        return "none";
    }
  };

  // Toggle individual slot selection in SPREAD
  // User Requirement: "by selecting a panel from CANVAS SLOTS equals deselecting any
  // image or part of image in that slot and should display always as blank, on the front page.
  // It must be persistent and any revisit to the CANVAS SLOTS must reflect the current state of the front page."
  const handleToggleSlot = (slotId: number) => {
    const hasImageOnFrontPage = Boolean(boxImages[slotId] && boxImages[slotId].trim() !== "");
    const isCurrentlySelected = selectedSlots.includes(slotId);

    if (hasImageOnFrontPage || isCurrentlySelected) {
      // Deselecting slot from CANVAS SLOTS: immediately deselects/clears any image in that slot so it displays as blank on front page
      setBoxImages((curr) => {
        const next = { ...curr, [slotId]: "" };
        try {
          remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(next));
          saveStoredJson("boxImages", next).catch(console.warn);
          saveAppStateToDatabase("boxImages", next).catch(console.warn);
          saveDatabaseConfig({ boxImages: next }).catch(console.warn);
        } catch {}
        return next;
      });

      setSelectedSlots((prev) => {
        const nextSel = prev.filter((id) => id !== slotId);
        remoteStore.setItem("seqcarver_canvas_selected_slots", JSON.stringify(nextSel));
        return nextSel;
      });
      showToast(`✓ Deselected Slot #${slotId} — cleared to blank on front page (Saved to DB)`);
    } else {
      // Slot is currently blank on front page: selecting it includes it for spread carving
      setSelectedSlots((prev) => {
        const nextSel = [...prev, slotId].sort((a, b) => a - b);
        remoteStore.setItem("seqcarver_canvas_selected_slots", JSON.stringify(nextSel));
        return nextSel;
      });
      showToast(`✓ Selected Slot #${slotId} for canvas spread`);
    }
  };

  const handleSelectAllSlots = () => {
    setSelectedSlots(slotList);
    remoteStore.setItem("seqcarver_canvas_selected_slots", JSON.stringify(slotList));
    showToast(`✓ Selected all ${slotList.length} slots for spread`);
  };

  const handleSelectNoneSlots = () => {
    setSelectedSlots([]);
    remoteStore.setItem("seqcarver_canvas_selected_slots", JSON.stringify([]));
    setBoxImages((curr) => {
      const next = { ...curr };
      slotList.forEach((s) => {
        next[s] = "";
      });
      try {
        remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(next));
        saveStoredJson("boxImages", next).catch(console.warn);
        saveAppStateToDatabase("boxImages", next).catch(console.warn);
        saveDatabaseConfig({ boxImages: next }).catch(console.warn);
      } catch {}
      return next;
    });
    showToast("✓ All slots deselected — displayed as blank on front page (Saved to DB)");
  };

  const handleInvertSlots = () => {
    setSelectedSlots((prev) => {
      const inverted = slotList.filter((id) => !prev.includes(id));
      remoteStore.setItem("seqcarver_canvas_selected_slots", JSON.stringify(inverted));
      setBoxImages((curr) => {
        const next = { ...curr };
        slotList.forEach((s) => {
          if (!inverted.includes(s)) {
            next[s] = "";
          }
        });
        try {
          remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(next));
          saveStoredJson("boxImages", next).catch(console.warn);
          saveAppStateToDatabase("boxImages", next).catch(console.warn);
          saveDatabaseConfig({ boxImages: next }).catch(console.warn);
        } catch {}
        return next;
      });
      showToast(`✓ Inverted slot selection (${inverted.length} active)`);
      return inverted;
    });
  };

  // ARTWORK SOURCE DATABASE OPERATIONS
  // User Requirement: "ARTWORK SOURCEs must be saved to the system database for persistent recall."
  const syncArtworkToUrlLibrary = (name: string, url: string, category = "Artwork") => {
    if (!url) return;
    setUrlLibrary((prev) => {
      if (prev.some((item) => item.url === url)) return prev;
      const entry: UrlLibraryItem = {
        id: `url_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: name || `Artwork ${prev.length + 1}`,
        url,
        category,
        createdAt: new Date().toISOString(),
      };
      const updated = [entry, ...prev];
      remoteStore.setItem("seqcarver_url_library", JSON.stringify(updated));
      saveAppStateToDatabase("url_library", updated).catch(console.warn);
      saveDatabaseConfig({ urlLibrary: updated }).catch(console.warn);
      return updated;
    });
  };

  const handleSaveArtworkSourceToDatabase = async (sourceToSave: { name: string; url: string }) => {
    const newRecord: SavedArtworkSource = {
      id: `art_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: sourceToSave.name || `Artwork ${savedArtworkSources.length + 1}`,
      url: sourceToSave.url,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedSources = [newRecord, ...savedArtworkSources.filter((s) => s.url !== newRecord.url)];
    setSavedArtworkSources(updatedSources);
    remoteStore.setItem("seqcarver_artwork_sources_v2", JSON.stringify(updatedSources));
    syncArtworkToUrlLibrary(newRecord.name, newRecord.url, "Master");

    try {
      await saveAppStateToDatabase("control_deck_artwork_sources_v2", updatedSources);
      await saveAppStateToDatabase("control_deck_active_artwork", newRecord.url);
      await saveDatabaseConfig({ originalSpreadImage: newRecord.url });
      showToast(`✓ Saved "${newRecord.name}" to system database for persistent recall!`);
    } catch (e) {
      console.warn("Database save notice:", e);
      showToast("✓ Saved artwork source locally");
    }
  };

  const handleDeleteArtworkSourceFromDatabase = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSources = savedArtworkSources.filter((s) => s.id !== id);
    setSavedArtworkSources(updatedSources);
    remoteStore.setItem("seqcarver_artwork_sources_v2", JSON.stringify(updatedSources));
    try {
      await saveAppStateToDatabase("control_deck_artwork_sources_v2", updatedSources);
      showToast("✓ Removed artwork source from database");
    } catch (err) {
      console.warn(err);
    }
  };

  // URL LIBRARY SYSTEM OPERATIONS
  // User Requirement: "require a library system for URL's that user can edit and recall on the fly to panel positions"
  const handleAddUrlToLibrary = async () => {
    if (!newUrlLink.trim()) {
      showToast("⚠ Please provide a valid URL");
      return;
    }
    const newItem: UrlLibraryItem = {
      id: `url_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: newUrlTitle.trim() || `URL ${urlLibrary.length + 1}`,
      url: newUrlLink.trim(),
      category: newUrlCategory.trim() || "Custom",
      createdAt: new Date().toISOString(),
    };

    const updated = [newItem, ...urlLibrary];
    setUrlLibrary(updated);
    remoteStore.setItem("seqcarver_url_library", JSON.stringify(updated));
    setNewUrlTitle("");
    setNewUrlLink("");
    setIsAddUrlModalOpen(false);

    try {
      await saveAppStateToDatabase("url_library", updated);
      await saveDatabaseConfig({ urlLibrary: updated });
      showToast(`✓ Added "${newItem.title}" to URL Library (Saved to DB)`);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleUpdateUrlLibraryItem = async (updatedItem: UrlLibraryItem) => {
    const updated = urlLibrary.map((item) => (item.id === updatedItem.id ? updatedItem : item));
    setUrlLibrary(updated);
    remoteStore.setItem("seqcarver_url_library", JSON.stringify(updated));
    setEditingUrlItem(null);

    try {
      await saveAppStateToDatabase("url_library", updated);
      await saveDatabaseConfig({ urlLibrary: updated });
      showToast(`✓ Updated "${updatedItem.title}" in URL Library`);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDeleteUrlLibraryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = urlLibrary.filter((item) => item.id !== id);
    setUrlLibrary(updated);
    remoteStore.setItem("seqcarver_url_library", JSON.stringify(updated));
    try {
      await saveAppStateToDatabase("url_library", updated);
      await saveDatabaseConfig({ urlLibrary: updated });
      showToast("✓ Deleted URL from library");
    } catch (e) {
      console.warn(e);
    }
  };

  // Recall on the fly to panel positions
  const handleRecallUrlToPanel = (panelId: number, item: UrlLibraryItem) => {
    setBoxImages((prev) => {
      const next = { ...prev, [panelId]: item.url };
      try {
        remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(next));
        saveStoredJson("boxImages", next).catch(console.warn);
        saveAppStateToDatabase("boxImages", next).catch(console.warn);
        saveDatabaseConfig({ boxImages: next }).catch(console.warn);
      } catch {}
      return next;
    });
    // Ensure slot is marked active in selectedSlots if it was deselected
    setSelectedSlots((prev) => (prev.includes(panelId) ? prev : [...prev, panelId].sort((a, b) => a - b)));
    showToast(`✓ Recalled "${item.title}" to Panel #${panelId} on front page!`);
  };

  const handleRecallUrlToMaster = (item: UrlLibraryItem) => {
    setArtworkSource(item.url);
    handleSaveArtworkSourceToDatabase({ name: item.title, url: item.url });
    showToast(`✓ Set "${item.title}" as Master Artwork for spread carving`);
  };

  const handleRecallUrlToAllPanels = (item: UrlLibraryItem) => {
    const next: Record<number, string> = {};
    slotList.forEach((s) => {
      next[s] = item.url;
    });
    setBoxImages(next);
    setSelectedSlots(slotList);
    try {
      remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(next));
      saveStoredJson("boxImages", next).catch(console.warn);
      saveAppStateToDatabase("boxImages", next).catch(console.warn);
      saveDatabaseConfig({ boxImages: next }).catch(console.warn);
    } catch {}
    showToast(`✓ Recalled "${item.title}" to all ${slotList.length} panels on front page!`);
  };

  const handleRecallUrlToTargetLink = (item: UrlLibraryItem) => {
    updateActiveLink({ url: item.url });
    showToast(`✓ Set "${item.title}" as Panel #${selectedPanelId} Target Redirect URL!`);
  };

  const handleRecallUrlToHoverArt = (item: UrlLibraryItem) => {
    updateActiveLink({ hoverImage: item.url, hoverEffect: "change-image" });
    showToast(`✓ Set "${item.title}" as Panel #${selectedPanelId} Hover Artwork!`);
  };

  // User Requirement: by selecting a panel from here equals adding a different image into this slot.
  const handleHeaderSlotFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      const targetId = selectedPanelId;
      reader.onload = () => {
        const url = reader.result?.toString() || "";
        if (url) {
          setBoxImages((prev) => {
            const next = { ...prev, [targetId]: url };
            try {
              remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(next));
              saveStoredJson("boxImages", next).catch(console.warn);
            } catch {}
            return next;
          });
          showToast(`✓ Added different image into Slot #${targetId}!`);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleAssignDifferentPoolImageToSlot = (slotId: number) => {
    const currentImg = boxImages[slotId];
    const availablePool = combinedPool.map((p) => p.url);
    const nextIdx = (availablePool.indexOf(currentImg) + 1) % availablePool.length;
    const newImg = availablePool[nextIdx] || DEFAULT_POOL_SLICES[slotId % DEFAULT_POOL_SLICES.length].url;
    setBoxImages((prev) => {
      const next = { ...prev, [slotId]: newImg };
      try {
        remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(next));
        saveStoredJson("boxImages", next).catch(console.warn);
      } catch {}
      return next;
    });
    showToast(`✓ Added different pool image to Slot #${slotId}!`);
  };

  const handleSelectPanelFromHeader = (slotNum: number) => {
    const wasAlreadyActive = selectedPanelId === slotNum;
    setSelectedPanelId(slotNum);
    setActiveTab("IMAGE");
    if (wasAlreadyActive) {
      // Clicking already active pill triggers file picker to add a different image
      headerSlotUploadInputRef.current?.click();
    } else {
      showToast(`✓ Selected Panel #${slotNum} — click again or use '+ Image' to add a different image`);
    }
  };

  // Sequencer cell toggle (selection mode: click cell to add/remove from sequence)
  const handleSequencerCellClick = (cellId: number) => {
    if (sequenceMode === "erase") {
      setSequencePath((prev) => prev.filter((id) => id !== cellId));
      showToast(`Removed slot #${cellId} from sequence`);
    } else {
      if (sequencePath.includes(cellId)) {
        setSequencePath((prev) => prev.filter((id) => id !== cellId));
      } else {
        setSequencePath((prev) => [...prev, cellId]);
      }
    }
  };

  // Sequencer Path Presets
  const applySequencePreset = (preset: "All" | "Snake" | "Columns" | "Spiral" | "Ring") => {
    if (isCurrent4x4) {
      switch (preset) {
        case "All":
          setSequencePath(Array.from({ length: 16 }, (_, i) => i + 1));
          break;
        case "Snake":
          setSequencePath([1, 2, 3, 4, 8, 7, 6, 5, 9, 10, 11, 12, 16, 15, 14, 13]);
          break;
        case "Columns":
          setSequencePath([1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16]);
          break;
        case "Spiral":
          setSequencePath([1, 2, 3, 4, 8, 12, 16, 15, 14, 13, 9, 5, 6, 7, 11, 10]);
          break;
        case "Ring":
          setSequencePath([1, 2, 3, 4, 8, 12, 16, 15, 14, 13, 9, 5]);
          break;
      }
    } else if (isCurrent2x2) {
      switch (preset) {
        case "All":
          setSequencePath([1, 2, 3, 4]);
          break;
        case "Columns":
          setSequencePath([1, 3, 2, 4]);
          break;
        case "Snake":
        case "Spiral":
        case "Ring":
          setSequencePath([1, 2, 4, 3]);
          break;
      }
    } else {
      switch (preset) {
        case "All":
          setSequencePath([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          break;
        case "Snake":
          setSequencePath([1, 2, 3, 6, 5, 4, 7, 8, 9]);
          break;
        case "Columns":
          setSequencePath([1, 4, 7, 2, 5, 8, 3, 6, 9]);
          break;
        case "Spiral":
          setSequencePath([1, 2, 3, 6, 9, 8, 7, 4, 5]);
          break;
        case "Ring":
          setSequencePath([1, 2, 3, 4, 5, 6, 7, 8]);
          break;
      }
    }
    setCurrentSequenceStep(1);
    showToast(`✓ Applied ${preset} sequence path`);
  };

  // Handle URL load in SPREAD
  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setArtworkSource(urlInput.trim());
    setUrlInput("");
    showToast("✓ Artwork source loaded from URL!");
  };

  // Handle URL load in IMAGE tab (loads into active panel)
  const handleApplyImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setBoxImages((prev) => ({ ...prev, [selectedPanelId]: imageUrlInput.trim() }));
    setImageUrlInput("");
    showToast(`✓ Loaded URL directly into Panel #${selectedPanelId}`);
  };

  // Handle file upload for master artwork in SPREAD
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result?.toString() || "";
        if (url) {
          setArtworkSource(url);
          if (setOriginalSpreadImage) setOriginalSpreadImage(url);
          const newRecord: SavedArtworkSource = {
            id: `art_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: file.name.replace(/\.[^/.]+$/, "").slice(0, 15) || "Uploaded Art",
            url,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setSavedArtworkSources((prev) => {
            const next = [newRecord, ...prev.filter((s) => s.url !== url)];
            remoteStore.setItem("seqcarver_artwork_sources_v2", JSON.stringify(next));
            saveAppStateToDatabase("control_deck_artwork_sources_v2", next).catch(console.warn);
            return next;
          });
          syncArtworkToUrlLibrary(newRecord.name, url, "Uploaded");
          showToast("✓ Custom artwork uploaded to Saved Sources & URL Library!");
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  // Primary Action: Carve spread across selected slots using HTML5 Canvas (3x3 or 4x4)
  // Supports 3 split modes requested by user:
  // 1: "preview" - a preview of changes
  // 2: "close" - edit and close, return to front page
  // 3: "proceed" - edit and proceed to sequencer page to sequence the inputs
  const handleCarveSpread = async (mode: "preview" | "close" | "proceed" = "preview") => {
    if (!artworkSource) {
      showToast("⚠ Please select or upload an artwork source first");
      return;
    }
    if (selectedSlots.length === 0) {
      showToast("⚠ Please select at least one canvas slot");
      return;
    }

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = artworkSource;
      });

      const cols = gridCols;
      const rows = gridCols;

      const pieceW = Math.floor(img.naturalWidth / cols);
      const pieceH = Math.floor(img.naturalHeight / rows);

      const canvas = document.createElement("canvas");
      canvas.width = pieceW;
      canvas.height = pieceH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");

      // Apply colour treatment filter
      const activeFilter = getFilterStyle(colourTreatment);
      if (activeFilter !== "none") {
        ctx.filter = activeFilter;
      }

      const updatedBoxes: Record<number, string> = { ...boxImages };

      // Slice the image into the grid cells
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const slotIndex = r * cols + c + 1;
          if (selectedSlots.includes(slotIndex)) {
            ctx.clearRect(0, 0, pieceW, pieceH);

            // Apply stretch scaling if configured
            ctx.save();
            if (stretchX !== 1 || stretchY !== 1) {
              ctx.translate(pieceW / 2, pieceH / 2);
              ctx.scale(stretchX, stretchY);
              ctx.translate(-pieceW / 2, -pieceH / 2);
            }

            ctx.drawImage(
              img,
              c * pieceW,
              r * pieceH,
              pieceW,
              pieceH,
              0,
              0,
              pieceW,
              pieceH
            );
            ctx.restore();

            updatedBoxes[slotIndex] = canvas.toDataURL("image/png");
          } else {
            // Deselected in CANVAS SLOTS: always blank
            updatedBoxes[slotIndex] = "";
          }
        }
      }

      // Clear any extra indices beyond totalSlots so smaller modes (2x2 / 3x3) stay clean
      for (let extraIdx = cols * rows + 1; extraIdx <= 16; extraIdx++) {
        updatedBoxes[extraIdx] = "";
      }

      setBoxImages(updatedBoxes);

      // Persist to remoteStore, IndexedDB, and Firestore system database
      try {
        remoteStore.setItem("seqcarver_json_boxImages", JSON.stringify(updatedBoxes));
        saveStoredJson("boxImages", updatedBoxes).catch(console.warn);
        saveAppStateToDatabase("boxImages", updatedBoxes).catch(console.warn);
        saveDatabaseConfig({ boxImages: updatedBoxes, originalSpreadImage: artworkSource }).catch(console.warn);
        persistSpreadSettings({});

        if (rememberAsMaster) {
          remoteStore.setItem("seqcarver_originalSpreadImage", artworkSource);
          saveStoredDefaultImage("originalSpreadImage", artworkSource).catch(console.warn);
          saveAppStateToDatabase("control_deck_active_artwork", artworkSource).catch(console.warn);
          if (setOriginalSpreadImage) {
            setOriginalSpreadImage(artworkSource);
          }
        }
        handleSaveArtworkSourceToDatabase({ name: "Carved Master Artwork", url: artworkSource });
      } catch (err) {
        console.warn("Storage sync notice:", err);
      }

      if (mode === "close") {
        showToast(`✓ Spread saved across ${selectedSlots.length} active slots! Returning to front page...`);
        setTimeout(() => {
          onClose();
        }, 300);
      } else if (mode === "proceed") {
        showToast(`✓ Spread submitted across ${selectedSlots.length} active slots! Proceeding to Sequencer...`);
        setActiveTab("SEQUENCER");
      } else {
        showToast(`✓ Preview updated across ${selectedSlots.length} active slots!`);
      }
    } catch (err) {
      console.error("Carve error:", err);
      if (handleSplitImageToNBoxes) {
        handleSplitImageToNBoxes(artworkSource, totalSlots);
        if (mode === "close") {
          showToast(`✓ Applied spread! Returning to front page...`);
          onClose();
        } else if (mode === "proceed") {
          showToast(`✓ Applied spread! Proceeding to Sequencer...`);
          setActiveTab("SEQUENCER");
        } else {
          showToast(`✓ Applied spread preview across board!`);
        }
      } else {
        showToast("⚠ Failed to carve spread from source image");
      }
    }
  };

  // Active panel config for Link tab
  const activeLinkConfig: TileLinkConfig = boxLinkConfigs[selectedPanelId] || {
    url: "",
    target: "_blank",
    hoverEffect: "none",
    hoverImage: "",
  };

  const updateActiveLink = (updates: Partial<TileLinkConfig>) => {
    setBoxLinkConfigs((prev) => ({
      ...prev,
      [selectedPanelId]: {
        ...activeLinkConfig,
        ...updates,
      },
    }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={uiText("components_control_deck_modal.div.control_deck_studio.aria_label", "Control Deck Studio")}
      className={cn(
        "fixed inset-0 bg-black/85 backdrop-blur-md z-[120] flex items-center justify-center animate-in fade-in duration-200 select-none",
        activeTab === "SPREAD" ? "p-2 sm:p-3" : "p-2 sm:p-5"
      )}
    >
      {showNamedStates && (
        <NamedWorkspaceDialog
          capture={captureNamedState}
          restore={async (state) => {
            await restoreNamedState(state);
            // The Spread editor also has local preview and selection state.
            setArtworkSource(state.originalSpreadImage || state.boxImages[1] || "");
            const slots = state.frontPageGridMode === "4x4"
              ? 16
              : remoteStore.getItem("seqcarver_control_deck_grid_mode") === "2x2" ? 4 : 9;
            setSelectedSlots(Array.from({ length: slots }, (_, i) => i + 1)
              .filter((slot) => Boolean(state.boxImages[slot]?.trim())));
            showToast("✓ Named workspace recalled");
          }}
          onClose={() => setShowNamedStates(false)}
          onExit={() => { setShowNamedStates(false); onClose(); }}
        />
      )}
      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[130] bg-emerald-500 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Control Deck Frame */}
      <CustomizableContainer
        ibcId="control_deck_modal_panel"
        componentType="modal"
        defaultLabel="Control deck studio"
        className={cn(
          "bg-[#050b14] border border-[#0d2235] rounded-3xl w-full max-h-[96vh] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden relative",
          activeTab === "SEQUENCER"
            ? "max-w-5xl max-h-[calc(100vh-2rem)]"
            : activeTab === "SPREAD"
            ? "max-w-[1180px] max-h-[calc(100vh-1.25rem)]"
            : "max-w-7xl",
        )}
      >
        {/* ========================================================= */}
        {/* TOP HEADER BAR (with 2x2 ⇄ 3x3 ⇄ 4x4 Cycle Button)        */}
        {/* ========================================================= */}
        <header className="h-12 sm:h-14 px-3.5 sm:px-5 bg-[#060f1c] border-b border-[#0d2235] flex items-center justify-between shrink-0 gap-3 sm:gap-4">
          {/* Left: Editable Branding, Subtitle & Compact Header Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <CustomizableLabel
              as="h2"
              labelId="control_deck_header_title"
              defaultLabel=""
              defaultIcon={
                <div
                  className={cn(
                    "flex items-center justify-center text-emerald-400 shrink-0",
                    activeTab === "SPREAD"
                      ? "w-8 h-8"
                      : "w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-teal-500/10 border border-emerald-500/40 shadow-inner"
                  )}
                >
                  <Layers className="w-4.5 h-4.5 text-emerald-400" />
                </div>
              }
              className="text-base font-black text-slate-100 tracking-tight flex items-center gap-2"
            />
            <CustomizableLabel
              as="p"
              labelId="control_deck_header_subtitle"
              defaultLabel=""
              showIconAlways={false}
              className="text-[10px] font-mono tracking-wide text-slate-400 font-semibold"
            />
            {activeTab === "SEQUENCER" && (
              <div className="flex items-center gap-2 ml-1">
                <CustomizableButton
                  buttonId="control_deck_modal_btn_3"
                  defaultIcon={<Grid className="h-3.5 w-3.5" />}
                  type="button"
onClick={handleToggleGridMode}
className="flex h-9 items-center gap-2 rounded-2xl border border-cyan-500/60 bg-[#071a2a] px-3 text-[12px] font-mono font-bold text-cyan-300 transition-colors hover:bg-[#0d2a40] cursor-pointer tabular-nums"
title={uiText("components_control_deck_modal.button.sequencer_grid_cycle.title", "Cycle between 2×2, 3×3, and 4×4 layout")}
                >
                    {() => (
                        <>
                          {isCurrent4x4
                    ? uiText("components_control_deck_modal.button.grid_4x4", "4×4 (16 slots)")
                    : isCurrent2x2
                    ? uiText("components_control_deck_modal.button.grid_2x2", "2×2 (4 slots)")
                    : uiText("components_control_deck_modal.button.grid_3x3", "3×3 (9 slots)")}
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="control_deck_modal_btn_2"
                  defaultIcon={<Lock className="h-3 w-3 text-emerald-400" />}
                  type="button"
onClick={() => {
                    const nextVal = !sequencerState.showMouseOverLockIcons;
                    setSequencerState((prev) => ({
                      ...prev,
                      showMouseOverLockIcons: nextVal,
                    }));
                    showToast(
                      nextVal
                        ? "✓ Mouse-over lock icons shown on front screen"
                        : "Mouse-over lock icons hidden on front screen (default off)"
                    );
                  }}
className={cn(
                    "flex h-9 items-center gap-1.5 rounded-2xl border px-3 text-[11px] font-mono font-bold transition-all cursor-pointer",
                    sequencerState.showMouseOverLockIcons
                      ? "border-emerald-400 bg-emerald-950/60 text-emerald-300 shadow-[0_0_8px_rgba(0,223,145,0.3)]"
                      : "border-slate-800 bg-[#071322] text-slate-400 hover:text-slate-200"
                  )}
title={uiText("components_control_deck_modal.button.lock_icons_toggle.title", "Show or hide mouse-over locked padlock representation on front screen")}
                >
                    {() => (
                        <>
                          <span>
                    {sequencerState.showMouseOverLockIcons
                      ? uiText("components_control_deck_modal.span.lock_icons_on", "Lock icons: on")
                      : uiText("components_control_deck_modal.span.lock_icons_off", "Lock icons: off")}
                  </span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            )}

            {/* Grid Cycle, Show/Hide Top Panel Buttons & Global Rotation */}
            {activeTab !== "SEQUENCER" && (
              <div
                className={cn(
                  "flex items-center gap-2 shrink-0",
                  activeTab === "SPREAD" ? "ml-5 sm:ml-8" : "ml-3"
                )}
              >
                <CustomizableButton
                  buttonId="control_deck_btn_grid_cycle"
                  defaultLabel={
                    isCurrent4x4
                      ? "4×4 (16 slots)"
                      : isCurrent2x2
                      ? "2×2 (4 slots)"
                      : "3×3 (9 slots)"
                  }
                  forceZeroText={activeTab === "SPREAD"}
                  defaultIcon={<Grid className="w-4 h-4 text-cyan-400 shrink-0" />}
                  onClick={handleToggleGridMode}
                  className={cn(
                    "rounded-xl bg-[#071525] hover:bg-[#0e213d] border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 active:scale-95 tabular-nums",
                    activeTab === "SPREAD" ? "w-10 h-8" : "px-2.5 sm:px-3 py-1.5"
                  )}
                  title="Cycle between 2×2 (4 slots), 3×3 (9 slots), and 4×4 (16 slots) layout"
                />
                <CustomizableButton
                  buttonId="control_deck_btn_toggle_top_panel"
                  defaultLabel={showTopPanelButtons ? "Hide top buttons" : "Show top buttons"}
                  forceZeroText={true}
                  defaultIcon={
                    showTopPanelButtons ? (
                      <Eye className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-cyan-400" />
                    )
                  }
                  onClick={handleToggleShowTopPanelButtons}
                  className={cn(
                    "rounded-xl border transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center",
                    activeTab === "SPREAD" ? "w-10 h-8" : "p-2 w-9 h-9",
                    showTopPanelButtons
                      ? "bg-[#091829] hover:bg-[#0f233b] border-cyan-500/50 text-cyan-300"
                      : "bg-[#071525] hover:bg-[#0e213d] border-cyan-500/40 text-cyan-300"
                  )}
                  title={showTopPanelButtons ? "Hide top panel slot buttons" : "Show top panel slot buttons"}
                />

                {/* Global Rotation Button (shown on non-Spread tabs or when top buttons are expanded) */}
                {(activeTab !== "SPREAD" || showTopPanelButtons) && (
                  <div className="relative shrink-0" ref={globalRotationMenuRef}>
                    <CustomizableButton
                      buttonId="control_deck_btn_global_rotation"
                      defaultLabel="Global rotation"
                      defaultIcon={<RotateCw className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                      badge={
                        <ChevronDown
                          className={cn(
                            "w-3 h-3 transition-transform text-purple-300",
                            isGlobalRotationMenuOpen && "rotate-180"
                          )}
                        />
                      }
                      onClick={() => setIsGlobalRotationMenuOpen((prev) => !prev)}
                      className={cn(
                        "px-2.5 sm:px-3 py-1.5 rounded-xl border font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 active:scale-95",
                        isGlobalRotationMenuOpen
                          ? "bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/30"
                          : "bg-[#180d28] hover:bg-[#25133d] border-purple-500/50 hover:border-purple-400 text-purple-300"
                      )}
                      title="Global rotation controls & engine"
                    />

                    {isGlobalRotationMenuOpen && (
                      <div className="absolute left-0 top-full mt-2 w-80 bg-[#090e1a]/98 border border-purple-500/40 rounded-2xl shadow-2xl p-3 z-50 flex flex-col gap-2.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                          <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                            <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                            {uiText("components_control_deck_modal.span.global_rotation_engine", "Global rotation engine")}
                          </span>
                          <span className="text-[10px] text-purple-400 font-mono font-bold bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-500/30 tabular-nums">
                            {Object.values(boxRotationActive).filter(Boolean).length} / {totalSlots}{uiText("components_control_deck_modal.span.active", " active")}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <CustomizableButton
                            buttonId="control_deck_modal_btn_25"
                            defaultIcon={<Pause className="w-3 h-3 fill-current" />}
                            type="button"
                            onClick={() => {
                              setBoxRotationActive((prev) => {
                                const next = { ...prev };
                                for (let i = 1; i <= totalSlots; i++) next[i] = false;
                                return next;
                              });
                              showToast("✓ Stopped rotation on all panels");
                            }}
                            className="flex-1 bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 border border-rose-500/40 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                          >
                            {() => <>{uiText("components_control_deck_modal.button.stop_all", " Stop all")}</>}
                          </CustomizableButton>
                          <CustomizableButton
                            buttonId="control_deck_modal_btn_24"
                            defaultIcon={<Play className="w-3 h-3 fill-current" />}
                            type="button"
                            onClick={() => {
                              setBoxRotationActive((prev) => {
                                const next = { ...prev };
                                for (let i = 1; i <= totalSlots; i++) next[i] = true;
                                return next;
                              });
                              showToast("✓ Started rotation on all panels");
                            }}
                            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                          >
                            {() => <>{uiText("components_control_deck_modal.button.start_all", " Start all")}</>}
                          </CustomizableButton>
                          <CustomizableButton
                            buttonId="control_deck_modal_btn_23"
                            defaultIcon={<Trash2 className="w-3 h-3" />}
                            type="button"
                            onClick={() => {
                              setBoxRotationSeries((prev) => {
                                const next = { ...prev };
                                for (let i = 1; i <= totalSlots; i++) next[i] = [];
                                return next;
                              });
                              setBoxRotationActive((prev) => {
                                const next = { ...prev };
                                for (let i = 1; i <= totalSlots; i++) next[i] = false;
                                return next;
                              });
                              showToast("✓ Cleared all rotation playlists");
                            }}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                          >
                            {() => <>{uiText("components_control_deck_modal.button.clear_all", " Clear all")}</>}
                          </CustomizableButton>
                        </div>

                        <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            {uiText("components_control_deck_modal.span.panel_playlist_editor", "Panel playlist editor:")}
                          </span>
                          <CustomizableButton
                            buttonId="control_deck_modal_btn_22"
                            defaultIcon={<ArrowRight className="w-3 h-3" />}
                            type="button"
                            onClick={() => {
                              setActiveTab("ROTATION");
                              setIsGlobalRotationMenuOpen(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/35 text-purple-300 border border-purple-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {() => (
                              <span>
                                {uiText("components_control_deck_modal.span.open_rotation_tab", "Open rotation tab")}
                              </span>
                            )}
                          </CustomizableButton>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center: Top Panel Number Selector Pills (1..4, 1..9, or 1..16) - Conditionally Shown */}
          {showTopPanelButtons && activeTab !== "SEQUENCER" && (
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 scrollbar-none flex-1 justify-center max-w-[620px] animate-in fade-in duration-150">
              <span className="text-[10px] font-mono font-bold text-slate-400 hidden xl:inline tracking-wide shrink-0">
                {uiText("components_control_deck_modal.span.slots", "Slots:")}
              </span>

              {/* Hidden file input for adding different image to selected slot */}
              <input
                ref={headerSlotUploadInputRef}
                type="file"
                accept="image/*"
                onChange={handleHeaderSlotFileUpload}
                className="hidden"
              />

              {slotList.map((slotNum) => {
                const isActive = selectedPanelId === slotNum;
                const hasImage = !!boxImages[slotNum];
                return (
                  <CustomizableButton
                    key={`deck-header-pill-${slotNum}`}
                    buttonId={`control_deck_btn_header_slot_${slotNum}`}
                    defaultLabel={`Slot ${slotNum}`}
                    onClick={() => handleSelectPanelFromHeader(slotNum)}
                    className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold transition-all cursor-pointer shrink-0 relative active:scale-95 tabular-nums",
                      isActive
                        ? "bg-[#00c982] text-slate-950 shadow-md shadow-emerald-500/40 font-black scale-105 ring-2 ring-emerald-400"
                        : hasImage
                        ? "bg-[#091b2c] text-cyan-200 hover:text-white hover:bg-[#112940] border border-cyan-500/40"
                        : "bg-[#0c1626] text-slate-400 hover:text-white hover:bg-[#132238] border border-slate-800/80"
                    )}
                    title={`Select panel ${slotNum} to add a different image into this slot (click again to browse file)`}
                  >
                    <span className="relative z-10 pointer-events-none">{slotNum}</span>
                  </CustomizableButton>
                );
              })}

              {/* Direct Quick Add/Change Image Actions for the Selected Slot */}
              <div className="flex items-center gap-1 ml-1 shrink-0">
                <CustomizableButton
                  buttonId="control_deck_btn_header_upload"
                  defaultLabel="+ Image"
                  defaultIcon={<Upload className="w-2.5 h-2.5 text-emerald-400" />}
                  onClick={() => headerSlotUploadInputRef.current?.click()}
                  className="px-2 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs active:scale-95"
                  title={`Upload different image into panel #${selectedPanelId}`}
                />

                <CustomizableButton
                  buttonId="control_deck_btn_header_pool"
                  defaultLabel="Pool"
                  defaultIcon={<Sparkles className="w-2.5 h-2.5 text-cyan-400" />}
                  onClick={() => handleAssignDifferentPoolImageToSlot(selectedPanelId)}
                  className="px-2 py-1 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs active:scale-95"
                  title={`Assign next different image from pool to panel #${selectedPanelId}`}
                />
              </div>
            </div>
          )}

          {/* Right: Add Source, Lock & Close Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {activeTab === "SEQUENCER" && (
              <CustomizableButton
                buttonId="control_deck_modal_btn_1"
                defaultIcon={<Upload className="h-3.5 w-3.5" />}
                type="button"
onClick={() => sequencerSourceUploadRef.current?.click()}
className="flex h-9 items-center gap-1.5 rounded-2xl border border-emerald-400/70 bg-[#06291f] px-4 text-xs font-bold text-emerald-300 transition-all hover:bg-[#094333] cursor-pointer"
title={uiText("components_control_deck_modal.button.sequencer_add_source.title", "Add an image to saved sources")}
              >
                  {() => (
                      <>
                        {uiText("components_control_deck_modal.button.sequencer_add_source", "+ Image")}
                      </>
                    )}
              </CustomizableButton>
            )}
            <CustomizableButton
              buttonId="control_deck_btn_lock"
              defaultLabel={isTopLockActive ? "Locked" : "Unlocked"}
              forceZeroText={true}
              defaultIcon={isTopLockActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              onClick={handleTopLockClick}
              className={cn(
                "p-2 w-9 h-9 rounded-xl border transition-colors cursor-pointer flex items-center justify-center",
                isTopLockActive
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "bg-[#0c1626] hover:bg-[#132238] border-slate-800 text-slate-400 hover:text-white"
              )}
              title={isTopLockActive ? "Locked (click to unlock)" : "Lock deck"}
            />
            <CustomizableButton
              buttonId="control_deck_btn_close"
              defaultLabel="Close"
              forceZeroText={true}
              defaultIcon={<X className="w-4 h-4" />}
              onClick={onClose}
              className="p-2 w-9 h-9 rounded-xl bg-[#0c1626] hover:bg-rose-950/80 hover:text-rose-300 border border-slate-800 text-slate-400 transition-colors cursor-pointer flex items-center justify-center"
              title="Close control deck"
            />
          </div>
        </header>

        {/* ========================================================= */}
        {/* MAIN BODY: LEFT VERTICAL TABS + CONTENT AREA              */}
        {/* ========================================================= */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* 1. LEFT VERTICAL NAVIGATION TABS */}
          <nav
            className={cn(
              "bg-[#040913] border-r border-[#0d2235] flex flex-col py-2 px-1.5 gap-1 shrink-0 overflow-y-auto scrollbar-none",
              activeTab === "SEQUENCER" ? "w-[100px]" : "w-[68px] sm:w-[78px]",
            )}
          >
            {[
              { id: "SPREAD", label: "Spread", icon: <LayoutGrid className="w-4 h-4" /> },
              { id: "IMAGE", label: "Image", icon: <ImageIcon className="w-4 h-4" /> },
              { id: "ROTATION", label: "Rotation", icon: <RotateCw className="w-4 h-4" /> },
              { id: "SEQUENCER", label: "Sequencer", icon: <GitBranch className="w-4 h-4" /> },
              { id: "LINK", label: "Link", icon: <Link2 className="w-4 h-4" /> },
              { id: "STYLE", label: "Style", icon: <Palette className="w-4 h-4" /> },
              { id: "MOTION", label: "Motion", icon: <Compass className="w-4 h-4" /> },
              { id: "SORTER", label: "Sorter", icon: <ArrowUpDown className="w-4 h-4" /> },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <CustomizableButton
                  key={`deck-nav-${tab.id}`}
                  buttonId={`control_deck_nav_${tab.id.toLowerCase()}`}
                  defaultLabel={tab.label}
                  defaultIcon={tab.icon}
                  iconClassName="w-4 h-4 shrink-0"
                  labelClassName="text-[9px] font-mono tracking-wide font-bold whitespace-nowrap"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    "flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl border transition-all cursor-pointer group text-center gap-1 shrink-0",
                    isActive
                      ? "border-emerald-500/80 bg-emerald-950/30 text-emerald-300 shadow-md shadow-emerald-950/40"
                      : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#081324]"
                  )}
                  title={tab.label}
                />
              );
            })}
          </nav>

          {/* 2. TAB CONTENT WORKSPACE */}
          <main
            className={cn(
              "flex-1 min-w-0 bg-[#050b14]",
              activeTab === "SEQUENCER"
                ? "overflow-auto p-3 sm:p-4"
                : activeTab === "SPREAD"
                ? "overflow-y-auto min-[520px]:overflow-hidden p-2.5 sm:p-4 flex flex-col justify-center"
                : "overflow-y-auto p-4 sm:p-6",
            )}
          >
            {/* ----------------------------------------------------- */}
            {/* TAB: SPREAD (Compacted Fit-in-Pane Architecture)      */}
            {/* ----------------------------------------------------- */}
            {activeTab === "SPREAD" && (
              <CustomizableContainer
                ibcId="control_deck_spread_pane"
                componentType="panel"
                defaultLabel="Spread studio pane"
                className="w-full bg-[#060e1c]/95 border border-[#0e2036] rounded-2xl sm:rounded-3xl px-3.5 py-3 sm:px-6 sm:py-4 shadow-xl flex flex-col gap-2.5 sm:gap-3.5 relative min-w-0"
              >
                {/* Top Summary Strip inside Spread Card */}
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-3">
                    <CustomizableLabel
                      labelId="control_deck_label_canvas_slots_preview"
                      defaultLabel="Spread"
                      showIconAlways={false}
                      className="px-2.5 py-0.5 rounded-md bg-[#072920] border border-emerald-500/25 text-xs font-mono font-bold tracking-wide text-[#34eba8] select-none"
                    />
                    <span className="text-xs sm:text-[13px] font-mono font-semibold text-[#29b6f6] tabular-nums">
                      {selectedSlots.length}
                      {uiText("components_control_deck_modal.span.spread_active_sep", " active · ")}
                      {totalSlots - selectedSlots.length}
                      {uiText("components_control_deck_modal.span.spread_blank_suffix", " blank")}
                    </span>
                  </div>
                  <CustomizableButton
                    buttonId="control_deck_btn_named_workspace"
                    defaultLabel="Save & Exit"
                    defaultIcon={<Save className="w-4 h-4" />}
                    forceZeroText
                    aria-label="Save and recall named workspace"
                    title="Save a named workspace and exit, or recall a saved state"
                    onClick={() => setShowNamedStates(true)}
                    className="flex items-center justify-center gap-1 min-w-8 h-8 px-2 shrink-0 rounded-lg bg-sky-500/15 border border-sky-500/40 text-sky-300 hover:bg-sky-500/30 hover:text-white transition-colors cursor-pointer"
                  />
                </div>

                {/* 3 Inline Main Viewers: Canvas slots | Live preview | Saved artwork sources */}
                <div className="grid grid-cols-1 min-[520px]:grid-cols-12 gap-3.5 sm:gap-5 lg:gap-7 items-start min-w-0">
                  {/* Viewer 1: Canvas slots */}
                  <div className="min-[520px]:col-span-4 flex flex-col gap-2 w-full min-w-0">
                    <div className="h-5 flex items-center justify-between">
                      <CustomizableLabel
                        labelId="control_deck_label_canvas_slots_col"
                        defaultLabel="Canvas slots"
                        defaultIcon={<LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />}
                        className="text-[11px] sm:text-xs font-mono font-bold tracking-wide text-slate-200 flex items-center gap-1.5 select-none truncate"
                      />
                    </div>

                    {/* Interactive Slots Matrix (2x2, 3x3, or 4x4 — viewport-adaptive height) */}
                    <div
                      className={cn(
                        "grid gap-1.5 sm:gap-2 w-full",
                        isCurrent4x4 ? "grid-cols-4" : isCurrent2x2 ? "grid-cols-2" : "grid-cols-3"
                      )}
                    >
                      {slotList.map((slotNum) => {
                        const hasImage = Boolean(boxImages[slotNum] && boxImages[slotNum].trim() !== "");
                        const isSelected = selectedSlots.includes(slotNum);
                        const imgThumb = boxImages[slotNum] || (hasImage ? artworkSource : undefined);
                        const isSlotActive = hasImage || isSelected;

                        return (
                          <CustomizableButton
                            buttonId={`control_deck_btn_canvas_slot_${slotNum}`}
                            key={`canvas-slot-${slotNum}`}
                            type="button"
                            onClick={() => handleToggleSlot(slotNum)}
                            className={cn(
                              "rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-0.5 px-1 font-mono transition-all cursor-pointer shadow-xs active:scale-95 relative overflow-hidden group select-none min-w-0",
                              isCurrent4x4
                                ? "h-[clamp(46px,7.2vh,68px)]"
                                : isCurrent2x2
                                ? "h-[clamp(98px,15.2vh,144px)]"
                                : "h-[clamp(64px,10vh,94px)]",
                              isSlotActive
                                ? "border-2 border-[#00d48a] bg-[#221318]/90 text-emerald-300 shadow-[0_0_12px_rgba(0,212,138,0.16)]"
                                : "border border-dashed border-slate-700/80 bg-[#050b14] text-slate-500 hover:border-slate-500 hover:text-slate-300"
                            )}
                            title={
                              isSlotActive
                                ? `Slot #${slotNum} (Active on front page). Click to deselect and display as blank on front page`
                                : `Slot #${slotNum} (Blank on front page). Click to select for canvas spread carving`
                            }
                          >
                            {() => (
                              <>
                                {hasImage && imgThumb && (
                                  <img
                                    src={imgThumb}
                                    alt={uiText("components_control_deck_modal.img.slot_thumb.alt", "Slot preview")}
                                    referrerPolicy="no-referrer"
                                    className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-20 transition-opacity pointer-events-none"
                                  />
                                )}
                                <span
                                  className={cn(
                                    "text-xs sm:text-base font-black relative z-10 pointer-events-none tabular-nums leading-tight",
                                    isSlotActive ? "text-white" : "text-slate-500"
                                  )}
                                >
                                  #{slotNum}
                                </span>
                                <span
                                  className={cn(
                                    "text-[8px] sm:text-[9px] font-mono font-bold tracking-wide relative z-10 pointer-events-none leading-none",
                                    isSlotActive ? "text-[#00e599]" : "text-slate-600"
                                  )}
                                >
                                  {isSlotActive
                                    ? uiText("components_control_deck_modal.span.slot_state_active", "Active")
                                    : uiText("components_control_deck_modal.span.slot_state_blank", "Blank")}
                                </span>
                              </>
                            )}
                          </CustomizableButton>
                        );
                      })}
                    </div>

                    {/* 3 Centered Compact Execution Icon Buttons */}
                    <div className="flex items-center justify-center gap-2 sm:gap-2.5 w-full pt-0.5 shrink-0">
                      <CustomizableButton
                        buttonId="control_deck_btn_submit_preview"
                        defaultLabel="Submit spread"
                        forceZeroText={true}
                        defaultIcon={<Sparkles className="w-4 h-4 text-cyan-300 stroke-[2.2]" />}
                        onClick={() => handleCarveSpread("preview")}
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-[#072430] hover:bg-[#0b3345] border border-cyan-400/75 hover:border-cyan-300 text-cyan-200 transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                        title="Submit spread - live preview on board without closing deck"
                      />

                      <CustomizableButton
                        buttonId="control_deck_btn_submit_close"
                        defaultLabel="Submit spread and close"
                        forceZeroText={true}
                        defaultIcon={<CheckCircle2 className="w-4.5 h-4.5 text-slate-950 stroke-[2.6]" />}
                        onClick={() => handleCarveSpread("close")}
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-[#00d48a] hover:bg-[#00e596] active:scale-95 text-slate-950 font-black transition-all shadow-xs shadow-emerald-500/25 flex items-center justify-center cursor-pointer shrink-0"
                        title="Submit spread and close - save spread changes and return to front page"
                      />

                      <CustomizableButton
                        buttonId="control_deck_btn_submit_proceed"
                        defaultLabel="Submit spread and proceed"
                        forceZeroText={true}
                        defaultIcon={<GitBranch className="w-4 h-4 text-purple-300 stroke-[2.2]" />}
                        onClick={() => handleCarveSpread("proceed")}
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-[#1c1236] hover:bg-[#27184b] border border-purple-400/75 hover:border-purple-300 text-purple-200 transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                        title="Submit spread and proceed - transition into Sequencer tab"
                      />
                    </div>
                  </div>

                  {/* Viewer 2: Live preview + Interactive Filter/Stretch Readout + Compact Square Upload */}
                  <div className="min-[520px]:col-span-4 flex flex-col items-center w-full min-w-0">
                    <div
                      className="w-full max-w-[min(100%,34vh,260px)] flex flex-col gap-1.5 sm:gap-2 relative"
                      ref={spreadAdjustPopoverRef}
                    >
                      <div className="h-5 flex items-center justify-between w-full gap-1 min-w-0">
                        <CustomizableLabel
                          labelId="control_deck_label_live_preview"
                          defaultLabel="Live preview"
                          showIconAlways={false}
                          className="text-[11px] sm:text-xs font-mono font-bold tracking-wide text-slate-200 select-none truncate"
                        />
                        <span className="text-[10px] sm:text-[11px] font-mono text-cyan-400 font-bold tabular-nums whitespace-nowrap shrink-0">
                          {isCurrent4x4
                            ? uiText("components_control_deck_modal.span.slice_mesh_4x4_v2", "4×4 slice mesh")
                            : isCurrent2x2
                            ? uiText("components_control_deck_modal.span.slice_mesh_2x2_v2", "2×2 slice mesh")
                            : uiText("components_control_deck_modal.span.slice_mesh_3x3_v2", "3×3 slice mesh")}
                        </span>
                      </div>

                      <div className="w-full aspect-square rounded-2xl border border-slate-700/80 overflow-hidden relative bg-[#040812] flex items-center justify-center p-0.5 shadow-lg">
                        {artworkSource ? (
                          <div className="relative w-full h-full overflow-hidden rounded-xl">
                            <img
                              src={artworkSource}
                              alt={uiText("components_control_deck_modal.img.live_preview.alt", "Live preview")}
                              referrerPolicy="no-referrer"
                              style={{
                                filter: getFilterStyle(colourTreatment),
                                transform: `scale(${stretchX}, ${stretchY})`,
                              }}
                              className="w-full h-full object-cover transition-transform duration-150"
                            />
                            {/* Slicing Grid Overlay */}
                            <div
                              className={cn(
                                "absolute inset-0 pointer-events-none grid gap-px border border-white/15",
                                isCurrent4x4
                                  ? "grid-cols-4 grid-rows-4"
                                  : isCurrent2x2
                                  ? "grid-cols-2 grid-rows-2"
                                  : "grid-cols-3 grid-rows-3"
                              )}
                            >
                              {slotList.map((sId) => {
                                const isSel = selectedSlots.includes(sId);
                                return (
                                  <div
                                    key={`prev-grid-slot-${sId}`}
                                    className={cn(
                                      "border border-white/20 transition-opacity flex items-center justify-center",
                                      isSel ? "bg-transparent" : "bg-black/65"
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "text-[9px] sm:text-[10px] font-mono font-bold select-none tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]",
                                        isSel ? "text-cyan-300 font-black" : "text-slate-600 line-through"
                                      )}
                                    >
                                      {sId}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 font-mono">
                            {uiText("components_control_deck_modal.span.no_source_selected", "No source selected")}
                          </span>
                        )}
                      </div>

                      {/* Interactive Filter & Stretch Readout (toggles compact adjustments popover) */}
                      <CustomizableButton
                        buttonId="control_deck_btn_spread_adjust_toggle"
                        type="button"
                        onClick={() => setIsSpreadAdjustOpen((prev) => !prev)}
                        className="w-full py-0.5 px-1.5 rounded-lg hover:bg-slate-800/60 text-[10px] sm:text-[11px] font-mono text-slate-400 text-center flex items-center justify-center gap-1 transition-colors cursor-pointer tabular-nums truncate"
                        title="Click to adjust colour filter, geometric stretch, artwork URL, and bulk slot actions"
                      >
                        {() => (
                          <span className="truncate">
                            {uiText("components_control_deck_modal.div.filter", "Filter: ")}
                            <span className="text-emerald-400 font-bold">{colourTreatment}</span>
                            {" · "}
                            {uiText("components_control_deck_modal.div.stretch", "Stretch: ")}
                            <span className="text-cyan-400 font-bold">
                              {stretchX.toFixed(2)}×, {stretchY.toFixed(2)}×
                            </span>
                          </span>
                        )}
                      </CustomizableButton>

                      {/* Left-aligned Compact Square Upload Button */}
                      <div className="flex items-center justify-start w-full">
                        <CustomizableButton
                          buttonId="control_deck_btn_art_upload_preview"
                          defaultLabel="Upload file"
                          forceZeroText={true}
                          defaultIcon={<Upload className="w-4 h-4 text-emerald-400" />}
                          onClick={() => fileInputRef.current?.click()}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#071322] hover:bg-[#0f233d] border border-cyan-500/25 hover:border-emerald-400/60 text-emerald-400 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Upload master artwork file from computer"
                        />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>

                      {/* Floating Consolidated Adjustments Popover (Stretch, Colour Treatment, URL & Bulk Slots) */}
                      {isSpreadAdjustOpen && (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-11 w-[320px] sm:w-[370px] max-h-[calc(100vh-9rem)] overflow-y-auto bg-[#081222]/98 border border-cyan-500/40 rounded-2xl shadow-2xl p-3.5 z-50 flex flex-col gap-3 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-xs font-mono font-bold text-slate-200">
                              {uiText("components_control_deck_modal.span.geometric_stretch_and_persistence", "Geometric stretch & filter")}
                            </span>
                            <CustomizableButton
                              buttonId="control_deck_btn_spread_adjust_close"
                              defaultLabel="Done"
                              forceZeroText={true}
                              defaultIcon={<X className="w-3.5 h-3.5" />}
                              onClick={() => setIsSpreadAdjustOpen(false)}
                              className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 cursor-pointer"
                              title="Close adjustments"
                            />
                          </div>

                          {/* Stretch X & Y Sliders */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                                <span className="text-slate-400 font-bold">
                                  {uiText("components_control_deck_modal.span.stretch_x", "Stretch x")}
                                </span>
                                <span className="text-cyan-400 font-semibold">{stretchX.toFixed(2)}×</span>
                              </div>
                              <input
                                type="range"
                                min="0.5"
                                max="2.5"
                                step="0.05"
                                value={stretchX}
                                onChange={(e) => handleStretchXChange(parseFloat(e.target.value))}
                                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                                <span className="text-slate-400 font-bold">
                                  {uiText("components_control_deck_modal.span.stretch_y", "Stretch y")}
                                </span>
                                <span className="text-cyan-400 font-semibold">{stretchY.toFixed(2)}×</span>
                              </div>
                              <input
                                type="range"
                                min="0.5"
                                max="2.5"
                                step="0.05"
                                value={stretchY}
                                onChange={(e) => handleStretchYChange(parseFloat(e.target.value))}
                                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                              />
                            </div>
                          </div>

                          {/* Link & Master Persistence Checkboxes */}
                          <div className="flex items-center justify-between">
                            <CustomizableLabel
                              labelId="control_deck_modal_item_19"
                              as="label"
                              className="flex items-center gap-1.5 cursor-pointer text-xs select-none"
                            >
                              {() => (
                                <>
                                  <input
                                    type="checkbox"
                                    checked={isStretchLinked}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setIsStretchLinked(checked);
                                      persistSpreadSettings({ isStretchLinked: checked });
                                    }}
                                    className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 accent-emerald-400 cursor-pointer"
                                  />
                                  <span className="text-emerald-400 font-mono text-[11px] font-bold">
                                    {uiText("components_control_deck_modal.span.link", "Link")}
                                  </span>
                                </>
                              )}
                            </CustomizableLabel>

                            <CustomizableLabel
                              labelId="control_deck_modal_item_18"
                              as="label"
                              className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400 select-none"
                            >
                              {() => (
                                <>
                                  <input
                                    type="checkbox"
                                    checked={rememberAsMaster}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setRememberAsMaster(checked);
                                      persistSpreadSettings({ rememberAsMaster: checked });
                                    }}
                                    className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 accent-emerald-500 cursor-pointer"
                                  />
                                  <span>
                                    {uiText("components_control_deck_modal.span.remember_as_master_in_db", "Remember as master in db")}
                                  </span>
                                </>
                              )}
                            </CustomizableLabel>
                          </div>

                          {/* Colour Treatment Buttons */}
                          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
                            <span className="text-[11px] font-mono font-bold text-slate-300">
                              {uiText("components_control_deck_modal.span.colour_treatment", "Colour treatment")}
                            </span>
                            <div className="grid grid-cols-4 gap-1.5">
                              {[
                                "None",
                                "Grayscale",
                                "Sepia",
                                "Invert",
                                "Contrast",
                                "Saturate",
                                "Cool",
                                "Warm",
                              ].map((treatment) => {
                                const isActive = colourTreatment === treatment;
                                return (
                                  <CustomizableButton
                                    key={`filter-${treatment}`}
                                    buttonId={`control_deck_btn_fx_${treatment.toLowerCase()}`}
                                    defaultLabel={treatment}
                                    onClick={() => handleColourTreatmentChange(treatment as typeof colourTreatment)}
                                    className={cn(
                                      "px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer text-center whitespace-nowrap",
                                      isActive
                                        ? "bg-[#00c982] text-slate-950 font-black"
                                        : "bg-[#0c1626] hover:bg-[#132238] border border-slate-800 text-slate-300"
                                    )}
                                  />
                                );
                              })}
                            </div>
                          </div>

                          {/* Quick URL Paste, Save to DB, URL Library & Bulk Slot Actions */}
                          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && urlInput.trim()) {
                                    const trimmed = urlInput.trim();
                                    handleApplyUrl();
                                    handleSaveArtworkSourceToDatabase({ name: "URL Artwork", url: trimmed });
                                  }
                                }}
                                placeholder={uiText("components_control_deck_modal.input.paste_image_url_https.placeholder", "Paste image url (https://)")}
                                className="flex-1 h-8 px-2.5 bg-[#050b16] border border-slate-800 rounded-lg text-[11px] font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60"
                              />
                              <CustomizableButton
                                buttonId="control_deck_btn_art_use_url"
                                defaultLabel="Use & save url"
                                forceZeroText={true}
                                defaultIcon={<Check className="w-3.5 h-3.5" />}
                                onClick={() => {
                                  if (urlInput.trim()) {
                                    const trimmed = urlInput.trim();
                                    handleApplyUrl();
                                    handleSaveArtworkSourceToDatabase({ name: "URL Artwork", url: trimmed });
                                  }
                                }}
                                className="h-8 px-2.5 rounded-lg bg-[#0a3d31] hover:bg-[#0e4e3f] text-emerald-300 font-bold text-xs cursor-pointer shrink-0 flex items-center justify-center"
                                title="Apply image URL and save to database"
                              />
                              <CustomizableButton
                                buttonId="control_deck_btn_art_save_db"
                                defaultLabel="Save to db"
                                forceZeroText={true}
                                defaultIcon={<Save className="w-3.5 h-3.5" />}
                                onClick={() => handleSaveArtworkSourceToDatabase({ name: "Master Artwork", url: artworkSource })}
                                className="h-8 px-2.5 rounded-lg bg-[#092e24] hover:bg-[#0d4234] border border-emerald-500/50 text-emerald-300 text-xs font-bold cursor-pointer shrink-0 flex items-center justify-center"
                                title="Save current artwork source to database"
                              />
                            </div>

                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1">
                                <CustomizableButton
                                  buttonId="control_deck_btn_slot_all"
                                  defaultLabel="All"
                                  onClick={handleSelectAllSlots}
                                  className="px-2 py-1 rounded-lg bg-[#0d1829] hover:bg-[#16253d] text-emerald-300 border border-slate-800 text-[10px] font-mono font-bold cursor-pointer"
                                  title="Select all slots for spread"
                                />
                                <CustomizableButton
                                  buttonId="control_deck_btn_slot_none"
                                  defaultLabel="Blank"
                                  onClick={handleSelectNoneSlots}
                                  className="px-2 py-1 rounded-lg bg-[#0d1829] hover:bg-rose-950/60 text-rose-300 border border-slate-800 text-[10px] font-mono font-bold cursor-pointer"
                                  title="Deselect all slots"
                                />
                                <CustomizableButton
                                  buttonId="control_deck_btn_slot_invert"
                                  defaultLabel="Invert"
                                  onClick={handleInvertSlots}
                                  className="px-2 py-1 rounded-lg bg-[#0d1829] hover:bg-[#16253d] text-cyan-300 border border-slate-800 text-[10px] font-mono font-bold cursor-pointer"
                                  title="Invert current slot selection"
                                />
                              </div>

                              <CustomizableButton
                                buttonId="control_deck_btn_open_url_library"
                                defaultLabel="Url library →"
                                defaultIcon={<Link2 className="w-3 h-3" />}
                                onClick={() => {
                                  setIsSpreadAdjustOpen(false);
                                  setActiveTab("LINK");
                                }}
                                className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-[10px] cursor-pointer flex items-center gap-1 shrink-0"
                                title="Open URL library in Link tab"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Viewer 3: Saved artwork sources */}
                  <div className="min-[520px]:col-span-4 flex flex-col gap-2 w-full min-w-0">
                    <div className="h-5 flex items-center justify-between gap-1 min-w-0">
                      <CustomizableLabel
                        labelId="control_deck_label_saved_sources"
                        defaultLabel="Saved artwork sources"
                        showIconAlways={false}
                        className="text-[11px] sm:text-xs font-mono font-bold tracking-wide text-slate-200 select-none truncate"
                      />
                      <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 whitespace-nowrap shrink-0">
                        {uiText("components_control_deck_modal.span.click_to_apply_v2", "Click to apply")}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full">
                      {savedArtworkSources.slice(0, 12).map((source) => {
                        const isSelected = artworkSource === source.url;
                        return (
                          <div
                            key={source.id}
                            className={cn(
                              "group relative h-[clamp(44px,6.8vh,64px)] rounded-xl border overflow-hidden transition-all cursor-pointer bg-black/70 shadow-xs min-w-0",
                              isSelected
                                ? "border-2 border-[#00d48a] ring-1 ring-emerald-400/50 shadow-md"
                                : "border-slate-800 hover:border-slate-600 opacity-90 hover:opacity-100"
                            )}
                            onClick={() => {
                              setArtworkSource(source.url);
                              if (setOriginalSpreadImage) setOriginalSpreadImage(source.url);
                              showToast(`✓ Selected "${source.name}" as master artwork`);
                            }}
                            title={source.name}
                          >
                            <img
                              src={source.url}
                              alt={source.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex items-end p-1.5">
                              <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold text-white truncate max-w-full">
                                {source.name}
                              </span>
                            </div>
                            {isSelected && (
                              <span
                                aria-hidden="true"
                                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00e599] shadow-[0_0_6px_#00e599] group-hover:opacity-0 transition-opacity pointer-events-none"
                              />
                            )}
                            <CustomizableButton
                              buttonId="control_deck_modal_btn_20"
                              defaultIcon={<Trash2 className="w-2.5 h-2.5" />}
                              type="button"
                              onClick={(e) => handleDeleteArtworkSourceFromDatabase(source.id, e)}
                              className="absolute top-1 right-1 w-4.5 h-4.5 rounded-md bg-black/80 hover:bg-rose-950 text-slate-400 hover:text-rose-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title={uiText("components_control_deck_modal.button.remove_from_database.title", "Remove from database")}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CustomizableContainer>
            )}

            {/* ----------------------------------------------------- */}
            {/* TAB: IMAGE (Enhanced Full Layout with Slot Navigator)  */}
            {/* ----------------------------------------------------- */}
            {activeTab === "IMAGE" && (
              <div className="flex flex-col gap-5">
                {/* Top Slot Pill Cycler for fast panel switching */}
                <div className="bg-[#070e1b] border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                      {uiText("components_control_deck_modal.span.active_panel", "Active Panel:")}
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-lg">
                      #{selectedPanelId}
                    </span>
                  </div>

                  {/* Slot selector pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin">
                    {slotList.map((slotNum) => {
                      const isActive = selectedPanelId === slotNum;
                      const hasImage = !!boxImages[slotNum];
                      return (
                        <CustomizableButton
                          key={`img-tab-pill-${slotNum}`}
                          buttonId={`control_deck_img_slot_pill_${slotNum}`}
                          defaultLabel={`${slotNum}`}
                          onClick={() => setSelectedPanelId(slotNum)}
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition-all cursor-pointer shrink-0 relative",
                            isActive
                              ? "bg-emerald-400 text-slate-950 font-black shadow-md ring-2 ring-emerald-400/50 scale-105"
                              : hasImage
                              ? "bg-[#0c1a2e] text-slate-200 border border-cyan-500/40 hover:bg-[#142640]"
                              : "bg-[#09111e] text-slate-500 border border-slate-800 hover:text-slate-300"
                          )}
                          title={`Select Panel #${slotNum} ${hasImage ? "(Has image)" : "(Empty)"}`}
                        >
                          {slotNum}
                          {hasImage && !isActive && (
                            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          )}
                        </CustomizableButton>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* LEFT COLUMN: PANEL PREVIEW & DIRECT ACTIONS */}
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    {/* Preview Card with Floating Pill Controls */}
                    <div className="w-full max-w-[280px] mx-auto flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                          {uiText("components_control_deck_modal.span.panel", "PANEL ")}{selectedPanelId}{uiText("components_control_deck_modal.span.preview", " PREVIEW")}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400">
                          {boxImages[selectedPanelId] ? "Image Loaded" : "Empty Slot"}
                        </span>
                      </div>

                      {/* Main Square Preview */}
                      <div className="w-full aspect-square rounded-2xl border border-slate-800 bg-[#040812] overflow-hidden relative shadow-xl flex items-center justify-center group">
                        {boxImages[selectedPanelId] ? (
                          <img
                            src={boxImages[selectedPanelId]}
                            alt={`Panel ${selectedPanelId}`}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <ImageIcon className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                            <span className="text-xs font-mono text-slate-500">{uiText("components_control_deck_modal.span.panel_2", "Panel ")}{selectedPanelId}{uiText("components_control_deck_modal.span.empty", " Empty")}</span>
                          </div>
                        )}

                        {/* Tiny Sleek Corner Badge */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 border border-white/10 text-cyan-300 text-[10px] font-mono font-bold">
                          {uiText("components_control_deck_modal.div.slot", "Slot #")}{selectedPanelId}
                        </div>
                      </div>

                      {/* Quick Action Buttons Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <CustomizableButton
                          buttonId="control_deck_img_clear"
                          defaultLabel="Clear image"
                          defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => {
                            setBoxImages((prev) => ({ ...prev, [selectedPanelId]: "" }));
                            showToast(`✓ Cleared image from Panel #${selectedPanelId}`);
                          }}
                          className="py-2 px-3 rounded-xl bg-[#0c1626] hover:bg-rose-950/70 border border-slate-800 hover:border-rose-700/60 text-slate-300 hover:text-rose-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        />

                        <CustomizableButton
                          buttonId="control_deck_img_upload"
                          defaultLabel="Upload File"
                          defaultIcon={<Upload className="w-3.5 h-3.5" />}
                          onClick={() => imageTabFileInputRef.current?.click()}
                          className="py-2 px-3 rounded-xl bg-[#08221c] hover:bg-[#0c332b] border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        />
                      </div>

                      {/* Secondary Actions Row */}
                      <div className="grid grid-cols-2 gap-2">
                        {boxImages[selectedPanelId] && (
                          <CustomizableButton
                            buttonId="control_deck_img_copy_all"
                            defaultLabel="Copy to All"
                            defaultIcon={<Layers className="w-3 h-3" />}
                            onClick={() => {
                              const activeImg = boxImages[selectedPanelId];
                              if (activeImg) {
                                const updated: Record<number, string> = {};
                                slotList.forEach((slotNum) => {
                                  updated[slotNum] = activeImg;
                                });
                                setBoxImages(updated);
                                showToast(`✓ Applied Panel #${selectedPanelId} image to ALL ${totalSlots} slots!`);
                              }
                            }}
                            className="py-1.5 px-2.5 rounded-xl bg-[#0a1829] hover:bg-[#122842] border border-slate-800 text-cyan-300 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            title="Copy this image to all slots across the board"
                          />
                        )}

                        {boxImages[selectedPanelId] && handleSendBoxImageToCarver && (
                          <CustomizableButton
                            buttonId="control_deck_img_to_carver"
                            defaultLabel="To Carver"
                            defaultIcon={<Scissors className="w-3 h-3" />}
                            onClick={() => {
                              handleSendBoxImageToCarver(boxImages[selectedPanelId]);
                              showToast(`✓ Sent Panel #${selectedPanelId} image to SeqCarver!`);
                            }}
                            className="py-1.5 px-2.5 rounded-xl bg-[#0a1829] hover:bg-[#122842] border border-slate-800 text-purple-300 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            title="Send this panel image to SeqCarver for advanced slicing"
                          />
                        )}
                      </div>

                      {/* Mini Board Overview Matrix */}
                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                          {uiText("components_control_deck_modal.span.board_matrix_click_to_inspect", "BOARD MATRIX (CLICK TO INSPECT)")}
                        </span>
                        <div className={cn("grid gap-1.5 max-w-[280px]", isCurrent4x4 ? "grid-cols-4" : "grid-cols-3")}>
                          {slotList.map((slotNum) => {
                            const isCurrent = selectedPanelId === slotNum;
                            const slotImg = boxImages[slotNum];
                            return (
                              <CustomizableButton
                                key={`board-matrix-slot-${slotNum}`}
                                buttonId={`control_deck_img_board_slot_${slotNum}`}
                                defaultLabel={`${slotNum}`}
                                onClick={() => setSelectedPanelId(slotNum)}
                                className={cn(
                                  "aspect-square rounded-xl border overflow-hidden relative transition-all cursor-pointer bg-black/60 group p-0.5",
                                  isCurrent
                                    ? "border-emerald-400 ring-2 ring-emerald-500/50 scale-105 z-10"
                                    : "border-slate-800 hover:border-slate-600"
                                )}
                                title={`Panel #${slotNum}`}
                              >
                                {slotImg ? (
                                  <img src={slotImg} alt={`Slot ${slotNum}`} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-900/60 rounded-lg">
                                    <span className="text-[10px] font-mono text-slate-500">{slotNum}</span>
                                  </div>
                                )}
                                <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-[8px] font-mono font-bold text-white">
                                  {slotNum}
                                </span>
                              </CustomizableButton>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: PICK FROM STORYBOARD POOL & LOAD A URL */}
                  <div className="lg:col-span-7 flex flex-col gap-5">
                    {/* Section: Pick From Storyboard Pool */}
                    <div className="bg-[#070f1e]/60 border border-slate-800/80 rounded-3xl p-5 shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                          {uiText("components_control_deck_modal.span.pick_from_storyboard_pool", "PICK FROM STORYBOARD POOL")}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">
                          {uiText("components_control_deck_modal.span.assigns_to_panel", "Assigns to Panel #")}{selectedPanelId}
                        </span>
                      </div>

                      {/* Wide Pool Cards Grid */}
                      <div className="grid grid-cols-4 gap-2.5">
                        {combinedPool.slice(0, 8).map((slice, sIdx) => {
                          const isCurrent = boxImages[selectedPanelId] === slice.url;
                          return (
                            <CustomizableButton
                              key={`image-tab-pool-${sIdx}`}
                              buttonId={`control_deck_img_pool_${sIdx}`}
                              defaultLabel={slice.name || `Slice #${sIdx + 1}`}
                              onClick={() => {
                                setBoxImages((prev) => ({ ...prev, [selectedPanelId]: slice.url }));
                                showToast(`✓ Assigned "${slice.name || `Slice #${sIdx + 1}`}" to Panel #${selectedPanelId}`);
                              }}
                              className={cn(
                                "h-16 rounded-xl border overflow-hidden relative transition-all cursor-pointer bg-black/60 group p-0 flex flex-col justify-end",
                                isCurrent
                                  ? "border-emerald-400 ring-2 ring-emerald-500/50 scale-[1.03] shadow-md"
                                  : "border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100"
                              )}
                              title={`Assign ${slice.name || `Slice #${sIdx + 1}`} to Panel #${selectedPanelId}`}
                            >
                              <img src={slice.url} alt={slice.name} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                              <div className="relative z-10 w-full bg-black/75 px-1 py-0.5 text-[8px] font-mono text-slate-300 truncate text-center pointer-events-none">
                                {slice.name || `Slice ${sIdx + 1}`}
                              </div>
                            </CustomizableButton>
                          );
                        })}
                      </div>

                      {/* Second row of pool if available */}
                      {combinedPool.length > 8 && (
                        <div className="grid grid-cols-4 gap-2.5 mt-2.5">
                          {combinedPool.slice(8, 12).map((slice, sIdx) => {
                            const isCurrent = boxImages[selectedPanelId] === slice.url;
                            const actualIdx = sIdx + 8;
                            return (
                              <CustomizableButton
                                key={`image-tab-pool-row2-${actualIdx}`}
                                buttonId={`control_deck_img_pool_${actualIdx}`}
                                defaultLabel={slice.name || `Slice #${actualIdx + 1}`}
                                onClick={() => {
                                  setBoxImages((prev) => ({ ...prev, [selectedPanelId]: slice.url }));
                                  showToast(`✓ Assigned "${slice.name}" to Panel #${selectedPanelId}`);
                                }}
                                className={cn(
                                  "h-16 rounded-xl border overflow-hidden relative transition-all cursor-pointer bg-black/60 group p-0 flex flex-col justify-end",
                                  isCurrent
                                    ? "border-emerald-400 ring-2 ring-emerald-500/50 scale-[1.03] shadow-md"
                                    : "border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100"
                                )}
                                title={`Assign ${slice.name} to Panel #${selectedPanelId}`}
                              >
                                <img src={slice.url} alt={slice.name} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                                <div className="relative z-10 w-full bg-black/75 px-1 py-0.5 text-[8px] font-mono text-slate-300 truncate text-center pointer-events-none">
                                  {slice.name}
                                </div>
                              </CustomizableButton>
                            );
                          })}
                        </div>
                      )}

                      {/* Quick Pool Distribution Button */}
                      <div className="pt-3 flex items-center justify-end">
                        <CustomizableButton
                          buttonId="control_deck_img_distribute_pool"
                          defaultLabel="Distribute Pool Across All Slots"
                          defaultIcon={<Shuffle className="w-3.5 h-3.5" />}
                          onClick={() => {
                            const updated: Record<number, string> = { ...boxImages };
                            slotList.forEach((slotNum, idx) => {
                              const poolItem = combinedPool[idx % combinedPool.length];
                              if (poolItem) updated[slotNum] = poolItem.url;
                            });
                            setBoxImages(updated);
                            showToast(`✓ Distributed pool slices across all ${totalSlots} panels!`);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#0c1a2e] hover:bg-[#142640] border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        />
                      </div>
                    </div>

                    {/* Section: Or Load A URL */}
                    <div className="bg-[#070f1e]/60 border border-slate-800/80 rounded-3xl p-5 shadow-lg">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block mb-2">
                        {uiText("components_control_deck_modal.span.or_load_a_url_directly", "OR LOAD A URL DIRECTLY")}
                      </span>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={imageUrlInput}
                            onChange={(e) => setImageUrlInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleApplyImageUrl()}
                            placeholder="https://..."
                            className="w-full h-11 px-3.5 bg-[#070e1b] border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60"
                          />
                        </div>
                        <CustomizableButton
                          buttonId="control_deck_img_load_url"
                          defaultLabel="Load"
                          onClick={handleApplyImageUrl}
                          className="h-11 px-5 rounded-xl bg-[#0a3d31] hover:bg-[#0e4e3f] text-emerald-300 font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-xs"
                        />
                        <CustomizableButton
                          buttonId="control_deck_img_quick_upload"
                          defaultLabel=""
                          forceZeroText={true}
                          defaultIcon={<Plus className="w-4 h-4" />}
                          onClick={() => imageTabFileInputRef.current?.click()}
                          className="h-11 w-11 rounded-xl bg-[#0a1829] hover:bg-[#10243d] border border-slate-700/60 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
                          title="Upload local file directly to this panel"
                        />
                        <input
                          ref={imageTabFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (handleBoxImageUpload) {
                              handleBoxImageUpload(selectedPanelId, e);
                            } else if (e.target.files?.[0]) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                const url = reader.result?.toString() || "";
                                if (url) {
                                  setBoxImages((prev) => ({ ...prev, [selectedPanelId]: url }));
                                  showToast(`✓ Uploaded image to Panel #${selectedPanelId}`);
                                }
                              };
                              reader.readAsDataURL(e.target.files[0]);
                            }
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                      </div>

                      <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                        {uiText("components_control_deck_modal.p.loading_a_single_image_replaces_any_spread_s", "Loading a single image replaces any spread slice on Panel #")}{selectedPanelId}{uiText("components_control_deck_modal.p.the_pool_drawer_assigns_to_whichever_panel_i", ". The pool drawer assigns to whichever panel is active.")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* TAB: SEQUENCER — three inline viewers + live front-page runtime */}
            {/* ----------------------------------------------------- */}
            {activeTab === "SEQUENCER" && (
              <SequencerPanel
                totalSlots={totalSlots}
                is4x4={isCurrent4x4}
                sources={savedArtworkSources.slice(0, 12)}
                state={sequencerState}
                setState={setSequencerState}
                sourceUploadRef={sequencerSourceUploadRef}
                onAddSource={handleSequencerAddSource}
                onDeleteSource={handleSequencerDeleteSource}
                onToggleLock={toggleSequencerImageLock}
                showToast={showToast}
              />
            )}

            {/* ----------------------------------------------------- */}
            {/* TAB: ROTATION (Multi-frame Rotation Series)           */}
            {/* ----------------------------------------------------- */}
            {activeTab === "ROTATION" && (
              <div className="flex flex-col gap-5 max-w-3xl">
                {/* GLOBAL ROTATION ENGINE CARD */}
                <div className="bg-[#090b1c] border border-purple-500/35 p-4 rounded-3xl flex flex-col gap-3.5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                        <RotateCw className="w-4 h-4 text-purple-300" />
                      </div>
                      <div>
                        <CustomizableLabel
                          labelId="control_deck_modal_item_16"
                          as="h4"
                          className="text-sm font-bold text-slate-100 flex items-center gap-2"
                        >
                            {() => (
                                <>
                                  {uiText("components_control_deck_modal.h4.global_rotation_engine", "Global Rotation Engine")}
                                </>
                              )}
                        </CustomizableLabel>
                        <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                          {uiText("components_control_deck_modal.p.synchronized_controls_across_all", "SYNCHRONIZED CONTROLS ACROSS ALL ")}{totalSlots}{uiText("components_control_deck_modal.p.panels", " PANELS (")}{isCurrent4x4 ? "4X4" : "3X3"})
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/80 px-3 py-1 rounded-xl border border-purple-500/35 shadow-inner">
                      {Object.values(boxRotationActive).filter(Boolean).length} / {totalSlots}{uiText("components_control_deck_modal.span.active_4", " Active")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CustomizableButton
                      buttonId="control_deck_modal_btn_15"
                      defaultIcon={<Pause className="w-3.5 h-3.5 fill-current" />}
                      type="button"
onClick={() => {
                        setBoxRotationActive((prev) => {
                          const next = { ...prev };
                          for (let i = 1; i <= totalSlots; i++) next[i] = false;
                          return next;
                        });
                        showToast("✓ Stopped rotation on all panels");
                      }}
className="flex-1 bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 border border-rose-500/40 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                        {() => (
                            <>
                              {uiText("components_control_deck_modal.button.stop_all_2", " Stop All")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="control_deck_modal_btn_14"
                      defaultIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                      type="button"
onClick={() => {
                        setBoxRotationActive((prev) => {
                          const next = { ...prev };
                          for (let i = 1; i <= totalSlots; i++) next[i] = true;
                          return next;
                        });
                        showToast("✓ Started rotation on all panels");
                      }}
className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                        {() => (
                            <>
                              {uiText("components_control_deck_modal.button.start_all_2", " Start All")}
                            </>
                          )}
                    </CustomizableButton>
                    <CustomizableButton
                      buttonId="control_deck_modal_btn_13"
                      defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                      type="button"
onClick={() => {
                        setBoxRotationSeries((prev) => {
                          const next = { ...prev };
                          for (let i = 1; i <= totalSlots; i++) next[i] = [];
                          return next;
                        });
                        setBoxRotationActive((prev) => {
                          const next = { ...prev };
                          for (let i = 1; i <= totalSlots; i++) next[i] = false;
                          return next;
                        });
                        showToast("✓ Cleared all rotation playlists");
                      }}
className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                        {() => (
                            <>
                              {uiText("components_control_deck_modal.button.clear_all_2", " Clear All")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>

                  {/* Quick Global Interval Presets */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-purple-500/20">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                      {uiText("components_control_deck_modal.span.apply_interval_to_all", "Apply Interval To All:")}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 5, 8].map((sec) => (
                        <CustomizableButton
                          buttonId="control_deck_modal_btn_12"
                          key={`glob-int-${sec}`}
type="button"
onClick={() => {
                            setBoxRotationIntervals((prev) => {
                              const next = { ...prev };
                              for (let i = 1; i <= totalSlots; i++) next[i] = sec;
                              return next;
                            });
                            showToast(`✓ Set rotation interval to ${sec}s across all panels`);
                          }}
className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-500/40 text-purple-300 font-mono text-[10px] font-bold cursor-pointer transition-colors active:scale-95"
                        >
                            {() => (
                                <>
                                  {sec}
                                {uiText("components_control_deck_modal.button.s", "s")}
                                </>
                              )}
                        </CustomizableButton>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <CustomizableLabel
                      labelId="control_deck_modal_item_11"
                      defaultIcon={<RotateCw className="w-4 h-4 text-purple-400" />}
                      as="h3"
                      className="text-sm font-bold text-slate-100 flex items-center gap-2"
                    >
                        {() => (
                            <>
                              <span>{uiText("components_control_deck_modal.span.panel_3", "Panel #")}{selectedPanelId}{uiText("components_control_deck_modal.span.rotation_playlist", " Rotation Playlist")}</span>
                            </>
                          )}
                    </CustomizableLabel>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {uiText("components_control_deck_modal.p.configure_automated_multi_image_carousel_rot", "Configure automated multi-image carousel rotation intervals for this panel.")}
                    </p>
                  </div>
                  <CustomizableButton
                    buttonId="control_deck_rot_toggle_active"
                    defaultLabel={boxRotationActive[selectedPanelId] ? "Rotation Active" : "Enable Rotation"}
                    defaultIcon={<RotateCw className="w-3.5 h-3.5" />}
                    onClick={() => {
                      const currentActive = !!boxRotationActive[selectedPanelId];
                      setBoxRotationActive((prev) => ({ ...prev, [selectedPanelId]: !currentActive }));
                      showToast(currentActive ? "Rotation paused" : "✓ Rotation enabled on board!");
                    }}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5",
                      boxRotationActive[selectedPanelId]
                        ? "bg-purple-500 text-slate-950 font-black shadow-md shadow-purple-500/30"
                        : "bg-[#0c1626] border-slate-800 text-purple-300 hover:bg-purple-950/40"
                    )}
                  />
                </div>

                {/* Interval Slider */}
                <div className="bg-[#070e1b] border border-slate-800/80 p-4 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 font-bold">{uiText("components_control_deck_modal.span.rotation_interval", "Rotation Interval")}</span>
                    <span className="text-purple-400 font-bold">
                      {boxRotationIntervals[selectedPanelId] || 3}{uiText("components_control_deck_modal.span.seconds", " seconds")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={boxRotationIntervals[selectedPanelId] || 3}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setBoxRotationIntervals((prev) => ({ ...prev, [selectedPanelId]: val }));
                    }}
                    className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                {/* Playlist Frames */}
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    {uiText("components_control_deck_modal.span.playlist_frames", "PLAYLIST FRAMES (")}{(boxRotationSeries[selectedPanelId]?.length || 0)})
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {(boxRotationSeries[selectedPanelId] || []).map((frameUrl, fIdx) => (
                      <div
                        key={`rot-frame-${fIdx}`}
                        className="w-16 h-16 rounded-xl border border-slate-800 overflow-hidden relative shrink-0 bg-black/60 group"
                      >
                        <img src={frameUrl} alt={`Frame ${fIdx + 1}`} className="w-full h-full object-cover" />
                        <CustomizableButton
                          buttonId={`control_deck_rot_del_frame_${fIdx}`}
                          defaultLabel=""
                          forceZeroText={true}
                          defaultIcon={<Trash2 className="w-2.5 h-2.5" />}
                          onClick={() => {
                            const updated = (boxRotationSeries[selectedPanelId] || []).filter((_, i) => i !== fIdx);
                            setBoxRotationSeries((prev) => ({ ...prev, [selectedPanelId]: updated }));
                          }}
                          className="absolute top-1 right-1 p-1 rounded bg-black/80 hover:bg-rose-900 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Delete frame"
                        />
                      </div>
                    ))}
                    {/* Add current panel image to playlist */}
                    {boxImages[selectedPanelId] && (
                      <CustomizableButton
                        buttonId="control_deck_rot_add_frame"
                        defaultLabel="Add Frame"
                        defaultIcon={<Plus className="w-4 h-4" />}
                        onClick={() => {
                          const currentList = boxRotationSeries[selectedPanelId] || [];
                          if (!currentList.includes(boxImages[selectedPanelId])) {
                            setBoxRotationSeries((prev) => ({
                              ...prev,
                              [selectedPanelId]: [...currentList, boxImages[selectedPanelId]],
                            }));
                            showToast("✓ Added active image to rotation playlist!");
                          }
                        }}
                        className="w-16 h-16 rounded-xl border border-dashed border-purple-500/40 bg-purple-950/20 hover:bg-purple-950/40 text-purple-300 flex flex-col items-center justify-center gap-1 shrink-0 transition-colors cursor-pointer text-[10px] font-bold text-center"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* TAB: LINK (URL Library System & Redirect Destinations) */}
            {/* ----------------------------------------------------- */}
            {activeTab === "LINK" && (
              <div className="flex flex-col gap-6">
                {/* STUDIO CARD: URL LIBRARY SYSTEM (Moved to the Link Button) */}
                <div className="bg-[#070f1e]/85 border border-cyan-500/40 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
                  {/* Header with Title and Add Button */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-cyan-400" />
                      <div>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 block">
                          {uiText("components_control_deck_modal.span.url_library_system_2", "URL LIBRARY SYSTEM")}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {uiText("components_control_deck_modal.span.edit_and_recall_on_the_fly_to_panel_position", "Edit & Recall on the fly to panel positions & link destinations")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                        {filteredUrlLibrary.length}{uiText("components_control_deck_modal.span.urls", " URLs")}
                      </span>
                      <CustomizableButton
                        buttonId="control_deck_btn_url_add"
                        defaultLabel="Add URL"
                        defaultIcon={<Plus className="w-3.5 h-3.5 stroke-[3]" />}
                        onClick={() => setIsAddUrlModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-[#00c982] hover:bg-[#00db8e] text-slate-950 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                        title="Add a new image URL to the library"
                      />
                    </div>
                  </div>

                  {/* Search & Filter Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={urlSearchQuery}
                      onChange={(e) => setUrlSearchQuery(e.target.value)}
                      placeholder={uiText("components_control_deck_modal.input.search_url_library_by_title_or_category.placeholder", "Search URL library by title or category...")}
                      className="w-full h-9 pl-8 pr-3 bg-[#050b16] border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>

                  {/* Grid of URL Library Items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                    {filteredUrlLibrary.length === 0 ? (
                      <div className="col-span-full text-center py-8 text-xs font-mono text-slate-500 bg-[#050b16] rounded-2xl border border-slate-800/60 p-4">
                        {uiText("components_control_deck_modal.div.no_url_items_found_click_add_url_to_add_imag", "No URL items found. Click \"+ Add URL\" to add image URLs.")}
                      </div>
                    ) : (
                      filteredUrlLibrary.map((item) => (
                        <div
                          key={item.id}
                          className="bg-[#050b16] border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-3 flex flex-col gap-2.5 transition-all shadow-xs"
                        >
                          {/* Item Header */}
                          <div className="flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/60 border border-slate-700/60 shrink-0">
                                <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-100 truncate block">
                                    {item.title}
                                  </span>
                                  {item.category && (
                                    <span className="text-[9px] font-mono font-semibold bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded shrink-0">
                                      {item.category}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-slate-500 truncate block max-w-[200px]">
                                  {item.url}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <CustomizableButton
                                buttonId={`control_deck_btn_url_edit_${item.id}`}
                                defaultLabel=""
                                forceZeroText={true}
                                defaultIcon={<Edit2 className="w-3 h-3" />}
                                onClick={() => setEditingUrlItem(item)}
                                className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-colors cursor-pointer"
                                title="Edit Title & URL"
                              />
                              <CustomizableButton
                                buttonId={`control_deck_btn_url_del_${item.id}`}
                                defaultLabel=""
                                forceZeroText={true}
                                defaultIcon={<Trash2 className="w-3 h-3" />}
                                onClick={(e) => handleDeleteUrlLibraryItem(item.id, e)}
                                className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                                title="Delete from library"
                              />
                            </div>
                          </div>

                          {/* Recall Actions */}
                          <div className="pt-1.5 border-t border-slate-800/60 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                                {uiText("components_control_deck_modal.span.recall_on_the_fly", "Recall on the fly:")}
                              </span>
                              <div className="flex items-center gap-1 flex-wrap">
                                <CustomizableButton
                                  buttonId={`control_deck_btn_url_recall_target_${item.id}`}
                                  defaultLabel="→ Target Link"
                                  onClick={() => handleRecallUrlToTargetLink(item)}
                                  className="px-2 py-0.5 rounded-md bg-[#0a1e36] hover:bg-[#102d52] text-cyan-300 border border-cyan-500/40 text-[9px] font-mono font-bold transition-colors cursor-pointer"
                                  title={`Set as Target Redirect URL for Panel #${selectedPanelId}`}
                                />
                                <CustomizableButton
                                  buttonId={`control_deck_btn_url_recall_hover_${item.id}`}
                                  defaultLabel="→ Hover Art"
                                  onClick={() => handleRecallUrlToHoverArt(item)}
                                  className="px-2 py-0.5 rounded-md bg-[#25123d] hover:bg-[#391b5c] text-purple-300 border border-purple-500/40 text-[9px] font-mono font-bold transition-colors cursor-pointer"
                                  title={`Set as Secondary Hover Artwork for Panel #${selectedPanelId}`}
                                />
                                <CustomizableButton
                                  buttonId={`control_deck_btn_url_recall_master_${item.id}`}
                                  defaultLabel="→ Master"
                                  onClick={() => handleRecallUrlToMaster(item)}
                                  className="px-2 py-0.5 rounded-md bg-[#0a2f26] hover:bg-[#0e4437] text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold transition-colors cursor-pointer"
                                  title="Set this URL as Master Artwork for spread"
                                />
                                <CustomizableButton
                                  buttonId={`control_deck_btn_url_recall_all_${item.id}`}
                                  defaultLabel="→ All"
                                  onClick={() => handleRecallUrlToAllPanels(item)}
                                  className="px-2 py-0.5 rounded-md bg-[#0a1f33] hover:bg-[#122e4d] text-cyan-300 border border-cyan-500/40 text-[9px] font-mono font-bold transition-colors cursor-pointer"
                                  title="Assign this URL to all panels on the front page"
                                />
                              </div>
                            </div>

                            {/* Panel Position Chips */}
                            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                              <span className="text-[8.5px] font-mono text-slate-500 shrink-0">{uiText("components_control_deck_modal.span.panel_4", "Panel:")}</span>
                              {slotList.map((slotNum) => (
                                <CustomizableButton
                                  key={`recall-${item.id}-slot-${slotNum}`}
                                  buttonId={`control_deck_btn_recall_slot_${slotNum}_${item.id}`}
                                  defaultLabel={`${slotNum}`}
                                  onClick={() => handleRecallUrlToPanel(slotNum, item)}
                                  className="w-6 h-6 rounded-md bg-[#0c1828] hover:bg-[#00c982] hover:text-slate-950 text-slate-300 border border-slate-700/60 text-[10px] font-mono font-bold transition-all shrink-0 flex items-center justify-center cursor-pointer active:scale-95 p-0"
                                  title={`Recall "${item.title}" to Panel #${slotNum} on the front page`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* PANEL DESTINATION & HOVER INTERACTION CARD */}
                <div className="bg-[#070f1e]/85 border border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
                  <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CustomizableLabel
                        labelId="control_deck_modal_item_10"
                        defaultIcon={<Link2 className="w-4 h-4 text-cyan-400" />}
                        as="h3"
                        className="text-sm font-bold text-slate-100 flex items-center gap-2"
                      >
                          {() => (
                              <>
                                <span>{uiText("components_control_deck_modal.span.panel_5", "Panel #")}{selectedPanelId}{uiText("components_control_deck_modal.span.link_and_hover_destination", " Link & Hover Destination")}</span>
                              </>
                            )}
                      </CustomizableLabel>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {uiText("components_control_deck_modal.p.configure_destination_url_and_choose_interac", "Configure destination URL and choose interactive hover effects for Panel #")}{selectedPanelId}.
                      </p>
                    </div>

                    {/* Quick Panel Switcher */}
                    <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                      {slotList.map((slotNum) => {
                        const isCurrent = selectedPanelId === slotNum;
                        return (
                          <CustomizableButton
                            key={`link-panel-pill-${slotNum}`}
                            buttonId={`control_deck_btn_link_slot_${slotNum}`}
                            defaultLabel={`${slotNum}`}
                            onClick={() => setSelectedPanelId(slotNum)}
                            className={cn(
                              "w-7 h-7 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center",
                              isCurrent
                                ? "bg-cyan-500 text-slate-950 font-black shadow-xs ring-1 ring-cyan-400"
                                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <CustomizableLabel
                        labelId="control_deck_modal_item_9"
                        defaultLabel={")"}
                        as="label"
                        className="text-xs font-mono font-bold text-slate-300 block mb-1"
                      >
                          {(ibcProps) => (
                              <>
                                {uiText("components_control_deck_modal.label.target_redirect_url_panel", "TARGET REDIRECT URL (PANEL #")}
                              {selectedPanelId}
                              {!ibcProps.isTextHidden ? ibcProps.label : null}
                              </>
                            )}
                      </CustomizableLabel>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={activeLinkConfig.url}
                          onChange={(e) => updateActiveLink({ url: e.target.value })}
                          placeholder="https://example.com/promo"
                          className="flex-1 h-10 px-3.5 bg-[#070e1b] border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60"
                        />
                        <select
                          value={activeLinkConfig.target}
                          onChange={(e) => updateActiveLink({ target: e.target.value })}
                          className="h-10 px-3 bg-[#0c1626] border border-slate-800 rounded-xl text-xs font-mono text-slate-200 cursor-pointer outline-none"
                        >
                          <option value="_blank">{uiText("components_control_deck_modal.option.new_tab_blank", "New Tab (_blank)")}</option>
                          <option value="_self">{uiText("components_control_deck_modal.option.same_window_self", "Same Window (_self)")}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <CustomizableLabel
                        labelId="control_deck_modal_item_8"
                        as="label"
                        className="text-xs font-mono font-bold text-slate-300 block mb-1.5"
                      >
                          {() => (
                              <>
                                {uiText("components_control_deck_modal.label.hover_interaction_effect", "HOVER INTERACTION EFFECT")}
                              </>
                            )}
                      </CustomizableLabel>
                      <div className="flex items-center gap-2">
                        {[
                          { id: "none", label: "None (Standard)" },
                          { id: "spin", label: "3D Spin (180°)" },
                          { id: "change-image", label: "Image Swap on Hover" },
                        ].map((effect) => {
                          const isActive = activeLinkConfig.hoverEffect === effect.id;
                          return (
                            <CustomizableButton
                              key={`hover-fx-${effect.id}`}
                              buttonId={`control_deck_btn_link_fx_${effect.id}`}
                              defaultLabel={effect.label}
                              onClick={() => updateActiveLink({ hoverEffect: effect.id as TileLinkConfig["hoverEffect"] })}
                              className={cn(
                                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                isActive
                                  ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30"
                                  : "bg-[#0c1626] border border-slate-800 text-slate-300 hover:bg-[#132238]"
                              )}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {activeLinkConfig.hoverEffect === "change-image" && (
                      <div className="bg-[#070e1b] border border-slate-800/80 p-4 rounded-2xl flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl border border-cyan-500/40 bg-black/60 overflow-hidden relative shrink-0 flex items-center justify-center">
                          {activeLinkConfig.hoverImage ? (
                            <img
                              src={activeLinkConfig.hoverImage}
                              alt={uiText("components_control_deck_modal.img.secondary_hover.alt", "Secondary Hover")}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-bold text-slate-200 block">
                            {uiText("components_control_deck_modal.span.secondary_hover_artwork", "Secondary Hover Artwork")}
                          </span>
                          <p className="text-[10px] text-slate-400 mb-2">
                            {uiText("components_control_deck_modal.p.this_image_replaces_the_primary_tile_artwork", "This image replaces the primary tile artwork when the user hovers over Panel #")}{selectedPanelId}.
                          </p>
                          <CustomizableButton
                            buttonId="control_deck_btn_link_upload_hover"
                            defaultLabel="Upload Secondary Hover Image"
                            defaultIcon={<Upload className="w-3.5 h-3.5" />}
                            onClick={() => hoverImageUploadRef.current?.click()}
                            className="px-3 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-bold cursor-pointer flex items-center gap-1.5"
                          />
                          <input
                            ref={hoverImageUploadRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const url = reader.result?.toString() || "";
                                  if (url) updateActiveLink({ hoverImage: url });
                                };
                                reader.readAsDataURL(e.target.files[0]);
                              }
                              e.target.value = "";
                            }}
                            className="hidden"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex items-center gap-3">
                      <CustomizableButton
                        buttonId="control_deck_btn_link_test_hover"
                        defaultLabel={isTestHoverActive ? "Simulating Hover..." : "Hover over me to test animation"}
                        onMouseEnter={() => setIsTestHoverActive(true)}
                        onMouseLeave={() => setIsTestHoverActive(false)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                          isTestHoverActive
                            ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/40"
                            : "bg-slate-900 border-slate-700 text-slate-300"
                        )}
                      />
                      {activeLinkConfig.url && (
                        <a
                          href={activeLinkConfig.url}
                          target={activeLinkConfig.target || "_blank"}
                          rel="noreferrer"
                          className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <span>{uiText("components_control_deck_modal.span.test_link_target", "Test Link Target")}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* TAB: STYLE (Styling & Aesthetics)                     */}
            {/* ----------------------------------------------------- */}
            {activeTab === "STYLE" && (
              <div className="flex flex-col gap-5 max-w-3xl">
                <div className="border-b border-slate-800/80 pb-3">
                  <CustomizableLabel
                    labelId="control_deck_modal_item_7"
                    defaultIcon={<Palette className="w-4 h-4 text-emerald-400" />}
                    as="h3"
                    className="text-sm font-bold text-slate-100 flex items-center gap-2"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_control_deck_modal.span.board_and_panel_styling", "Board & Panel Styling")}</span>
                          </>
                        )}
                  </CustomizableLabel>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {uiText("components_control_deck_modal.p.customize_division_styling_chromatic_glow_ac", "Customize division styling, chromatic glow accents, and corner rounding.")}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: "cyberpunk", label: "Emerald Cyberpunk", color: "#10b981", desc: "Vibrant neon green border with high-contrast" },
                    { id: "cyan", label: "Deep Cyan Matrix", color: "#06b6d4", desc: "Crisp technological cyan borders" },
                    { id: "vaporwave", label: "Vaporwave Purple", color: "#a855f7", desc: "Synthwave aesthetic with soft glow" },
                    { id: "slate", label: "Dark Minimal Slate", color: "#334155", desc: "Clean studio dark borders" },
                  ].map((preset) => (
                    <CustomizableButton
                      key={`style-preset-${preset.id}`}
                      buttonId={`control_deck_style_${preset.id}`}
                      defaultLabel={preset.label}
                      onClick={() => showToast(`✓ Applied ${preset.label} theme!`)}
                      className="p-3.5 rounded-2xl border border-slate-800 bg-[#070e1b] hover:border-slate-600 flex items-start gap-3 transition-all cursor-pointer text-left"
                    >
                      <div
                        className="w-8 h-8 rounded-xl shrink-0 shadow-sm"
                        style={{ backgroundColor: preset.color }}
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">{preset.label}</span>
                        <span className="text-[10px] text-slate-400">{preset.desc}</span>
                      </div>
                    </CustomizableButton>
                  ))}
                </div>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* TAB: MOTION (2.5D Parallax Simulation)                */}
            {/* ----------------------------------------------------- */}
            {activeTab === "MOTION" && (
              <div className="flex flex-col gap-5 max-w-3xl">
                <div className="border-b border-slate-800/80 pb-3">
                  <CustomizableLabel
                    labelId="control_deck_modal_item_6"
                    defaultIcon={<Compass className="w-4 h-4 text-purple-400" />}
                    as="h3"
                    className="text-sm font-bold text-slate-100 flex items-center gap-2"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_control_deck_modal.span.2_5d_parallax_motion_depth", "2.5D Parallax Motion Depth")}</span>
                          </>
                        )}
                  </CustomizableLabel>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {uiText("components_control_deck_modal.p.live_perspective_tilt_simulation_responding", "Live perspective tilt simulation responding to cursor movement across the canvas.")}
                  </p>
                </div>

                <div
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width - 0.5;
                    const y = (e.clientY - rect.top) / rect.height - 0.5;
                    setParallaxTilt({ x: x * 30, y: y * 30 });
                  }}
                  onMouseLeave={() => setParallaxTilt({ x: 0, y: 0 })}
                  className="w-full h-64 rounded-3xl border border-purple-500/40 bg-[#060a15] overflow-hidden relative flex items-center justify-center p-6 shadow-2xl cursor-crosshair [perspective:1000px]"
                >
                  <div
                    style={{
                      transform: `rotateY(${parallaxTilt.x}deg) rotateX(${-parallaxTilt.y}deg)`,
                      transition: "transform 0.1s ease-out",
                    }}
                    className="w-48 h-48 rounded-2xl border-2 border-purple-400 bg-purple-950/40 overflow-hidden relative shadow-[0_20px_50px_rgba(168,85,247,0.3)] flex items-center justify-center"
                  >
                    {boxImages[selectedPanelId] ? (
                      <img
                        src={boxImages[selectedPanelId]}
                        alt={uiText("components_control_deck_modal.img.parallax.alt", "Parallax")}
                        className="w-full h-full object-cover filter saturate-120"
                      />
                    ) : (
                      <span className="text-xs font-mono text-purple-300 font-bold">{uiText("components_control_deck_modal.span.tilt_active", "Tilt Active")}</span>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3 text-[10px] font-mono text-purple-300 bg-purple-950/80 border border-purple-500/30 px-2.5 py-1 rounded-lg">
                    {uiText("components_control_deck_modal.div.tilt", "Tilt: ")}{Math.round(parallaxTilt.x)}°, {Math.round(parallaxTilt.y)}°
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* TAB: SORTER (Storyboard Asset Sorter)                 */}
            {/* ----------------------------------------------------- */}
            {activeTab === "SORTER" && (
              <div className="flex flex-col gap-5 max-w-3xl">
                <div className="border-b border-slate-800/80 pb-3">
                  <CustomizableLabel
                    labelId="control_deck_modal_item_5"
                    defaultIcon={<ArrowUpDown className="w-4 h-4 text-emerald-400" />}
                    as="h3"
                    className="text-sm font-bold text-slate-100 flex items-center gap-2"
                  >
                      {() => (
                          <>
                            <span>{uiText("components_control_deck_modal.span.storyboard_asset_sorter", "Storyboard Asset Sorter")}</span>
                          </>
                        )}
                  </CustomizableLabel>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {uiText("components_control_deck_modal.p.organize_sort_and_reorder_all_carved_slices", "Organize, sort, and reorder all carved slices in your session gallery.")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <CustomizableButton
                    buttonId="control_deck_sorter_sort_az"
                    defaultLabel="Sort A-Z"
                    defaultIcon={<ArrowUpDown className="w-3.5 h-3.5" />}
                    onClick={() => showToast("✓ Slices sorted alphabetically A-Z")}
                    className="px-3.5 py-2 rounded-xl bg-[#0c1626] hover:bg-[#132238] border border-slate-800 text-slate-200 text-xs font-bold cursor-pointer flex items-center gap-1.5"
                  />
                  <CustomizableButton
                    buttonId="control_deck_sorter_sort_za"
                    defaultLabel="Sort Z-A"
                    defaultIcon={<ArrowUpDown className="w-3.5 h-3.5" />}
                    onClick={() => showToast("✓ Slices sorted Z-A")}
                    className="px-3.5 py-2 rounded-xl bg-[#0c1626] hover:bg-[#132238] border border-slate-800 text-slate-200 text-xs font-bold cursor-pointer flex items-center gap-1.5"
                  />
                  <CustomizableButton
                    buttonId="control_deck_sorter_reverse"
                    defaultLabel="Reverse Order"
                    defaultIcon={<Undo2 className="w-3.5 h-3.5" />}
                    onClick={() => showToast("✓ Slices reversed")}
                    className="px-3.5 py-2 rounded-xl bg-[#0c1626] hover:bg-[#132238] border border-slate-800 text-slate-200 text-xs font-bold cursor-pointer flex items-center gap-1.5"
                  />
                </div>
              </div>
            )}
          </main>
        </div>

        {/* ADD / EDIT URL MODAL DIALOG */}
        {(isAddUrlModalOpen || editingUrlItem) && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#091526] border border-cyan-500/50 rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-cyan-400" />
                  <CustomizableLabel
                    labelId="control_deck_modal_item_4"
                    as="h3"
                    className="text-sm font-bold text-slate-100"
                  >
                      {() => (
                          <>
                            {editingUrlItem ? "Edit URL Library Entry" : "Add New URL to Library"}
                          </>
                        )}
                  </CustomizableLabel>
                </div>
                <CustomizableButton
                  buttonId="control_deck_btn_url_modal_close"
                  defaultLabel=""
                  forceZeroText={true}
                  defaultIcon={<X className="w-4 h-4" />}
                  onClick={() => {
                    setIsAddUrlModalOpen(false);
                    setEditingUrlItem(null);
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                  title="Close modal"
                />
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <CustomizableLabel
                    labelId="control_deck_modal_item_3"
                    as="label"
                    className="text-xs font-mono font-bold text-slate-300 block mb-1"
                  >
                      {() => (
                          <>
                            {uiText("components_control_deck_modal.label.title_label", "TITLE / LABEL")}
                          </>
                        )}
                  </CustomizableLabel>
                  <input
                    type="text"
                    value={editingUrlItem ? editingUrlItem.title : newUrlTitle}
                    onChange={(e) => {
                      if (editingUrlItem) {
                        setEditingUrlItem({ ...editingUrlItem, title: e.target.value });
                      } else {
                        setNewUrlTitle(e.target.value);
                      }
                    }}
                    placeholder={uiText("components_control_deck_modal.input.e_g_promo_hero_banner.placeholder", "e.g. Promo Hero Banner")}
                    className="w-full h-10 px-3 bg-[#050b16] border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <CustomizableLabel
                    labelId="control_deck_modal_item_2"
                    as="label"
                    className="text-xs font-mono font-bold text-slate-300 block mb-1"
                  >
                      {() => (
                          <>
                            {uiText("components_control_deck_modal.label.image_or_redirect_url", "IMAGE OR REDIRECT URL")}
                          </>
                        )}
                  </CustomizableLabel>
                  <input
                    type="url"
                    value={editingUrlItem ? editingUrlItem.url : newUrlLink}
                    onChange={(e) => {
                      if (editingUrlItem) {
                        setEditingUrlItem({ ...editingUrlItem, url: e.target.value });
                      } else {
                        setNewUrlLink(e.target.value);
                      }
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full h-10 px-3 bg-[#050b16] border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <CustomizableLabel
                    labelId="control_deck_modal_item_1"
                    as="label"
                    className="text-xs font-mono font-bold text-slate-300 block mb-1"
                  >
                      {() => (
                          <>
                            {uiText("components_control_deck_modal.label.category", "CATEGORY")}
                          </>
                        )}
                  </CustomizableLabel>
                  <input
                    type="text"
                    value={editingUrlItem ? editingUrlItem.category || "Custom" : newUrlCategory}
                    onChange={(e) => {
                      if (editingUrlItem) {
                        setEditingUrlItem({ ...editingUrlItem, category: e.target.value });
                      } else {
                        setNewUrlCategory(e.target.value);
                      }
                    }}
                    placeholder={uiText("components_control_deck_modal.input.custom_background_hero.placeholder", "Custom / Background / Hero")}
                    className="w-full h-10 px-3 bg-[#050b16] border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <CustomizableButton
                  buttonId="control_deck_btn_url_modal_cancel"
                  defaultLabel="Cancel"
                  defaultIcon={<X className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setIsAddUrlModalOpen(false);
                    setEditingUrlItem(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                />
                <CustomizableButton
                  buttonId="control_deck_btn_url_modal_save"
                  defaultLabel={editingUrlItem ? "Save Changes" : "Save to Library"}
                  defaultIcon={<Save className="w-3.5 h-3.5" />}
                  onClick={() => {
                    if (editingUrlItem) {
                      handleUpdateUrlLibraryItem(editingUrlItem);
                    } else {
                      handleAddUrlToLibrary();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[#00c982] hover:bg-[#00db8e] text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                />
              </div>
            </div>
          </div>
        )}
      </CustomizableContainer>
    </div>
  );
};

