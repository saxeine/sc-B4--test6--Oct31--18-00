import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  X,
  LayoutGrid,
  Check,
  CheckCircle2,
  Sliders,
  Lock,
  Unlock,
  RefreshCw,
  Sparkles,
  Circle,
  Palette,
  EyeOff,
  Zap,
  Star,
  Upload,
  Database,
  RotateCcw,
  Layers,
  Grid,
  GitBranch,
  Save,
  Trash2,
} from "lucide-react";
import { cn } from "../utils/cn";
import { CustomizableButton } from "./CustomizableButton";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableContainer } from "./CustomizableContainer";
import eurospectImg from "../assets/images/eurospect_header_1786007763255.jpg";
import { DEFAULT_USER_DEFINED_IMAGE_PATH } from "../types/userDefinedImage";
import {
  getDatabaseConfig,
  getAppStateFromDatabase,
  saveAppStateToDatabase,
  saveDatabaseConfig,
} from "../services/firebase";
import { saveStoredJson } from "../utils/idbStorage";
import { uiText } from "../hooks/useUIConfig";
import { remoteStore } from "../services/remoteKeyValueStore";
import type { SavedArtworkSource } from "./ControlDeckModal";

interface CustomSpreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onApplySpread: (
    selectedBoxes: number[],
    imageUrl: string,
    filter: string,
    stretchX: number,
    stretchY: number,
    gridCols?: 2 | 3 | 4
  ) => void;
  onImageChange?: (imageUrl: string) => void;
  onRestoreDefaultsFromDb?: () => Promise<void> | void;
  boxImages?: Record<number, string>;
  setBoxImages?: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  gridMode?: "3x3" | "4x4";
  onToggleGridMode?: (mode?: "3x3" | "4x4") => void;
  onProceedToSequencer?: () => void;
}

const DEFAULT_SAVED_ARTWORK_SOURCES: SavedArtworkSource[] = [
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

const EFFECTS = [
  { id: "none", buttonId: "spread_studio_fx_none", label: "None", filter: "none", icon: Sparkles },
  { id: "grayscale", buttonId: "spread_studio_fx_grayscale", label: "Grayscale", filter: "grayscale(100%)", icon: Circle },
  { id: "sepia", buttonId: "spread_studio_fx_sepia", label: "Sepia", filter: "sepia(100%)", icon: Palette },
  { id: "invert", buttonId: "spread_studio_fx_invert", label: "Invert", filter: "invert(100%)", icon: RefreshCw },
  { id: "blur", buttonId: "spread_studio_fx_blur", label: "Blur", filter: "blur(2px)", icon: EyeOff },
  { id: "hue-rotate", buttonId: "spread_studio_fx_hue", label: "Hue", filter: "hue-rotate(90deg)", icon: Sliders },
  { id: "contrast", buttonId: "spread_studio_fx_contrast", label: "Contrast", filter: "contrast(200%)", icon: Zap },
  { id: "saturate", buttonId: "spread_studio_fx_saturate", label: "Vivid", filter: "saturate(200%)", icon: Star },
];

export function CustomSpreadModal({
  isOpen,
  onClose,
  imageUrl,
  onApplySpread,
  onImageChange,
  onRestoreDefaultsFromDb,
  boxImages = {},
  setBoxImages,
  gridMode,
  onToggleGridMode,
  onProceedToSequencer,
}: CustomSpreadModalProps) {
  const initialSpreadSettings = useMemo(() => {
    const raw = remoteStore.getItem("seqcarver_custom_spread_settings");
    if (raw) {
      try {
        return JSON.parse(raw) as {
          selectedEffect?: string;
          stretchX?: number;
          stretchY?: number;
          lockAspect?: boolean;
          gridMode?: "2x2" | "3x3" | "4x4";
        };
      } catch {}
    }
    return {};
  }, []);

  const [localGridMode, setLocalGridMode] = useState<"2x2" | "3x3" | "4x4">(() => {
    const savedMode =
      initialSpreadSettings.gridMode || remoteStore.getItem("seqcarver_control_deck_grid_mode");
    if (savedMode === "2x2") return "2x2";
    return gridMode === "4x4" ? "4x4" : "3x3";
  });

  const isCurrent4x4 = localGridMode === "4x4";
  const isCurrent2x2 = localGridMode === "2x2";
  const gridCols: 2 | 3 | 4 = isCurrent4x4 ? 4 : isCurrent2x2 ? 2 : 3;
  const totalSlots = gridCols * gridCols;
  const slotList = useMemo(() => Array.from({ length: totalSlots }, (_, i) => i + 1), [totalSlots]);

  const [selectedBoxes, setSelectedBoxes] = useState<number[]>(slotList);
  const [selectedEffect, setSelectedEffect] = useState<string>(
    initialSpreadSettings.selectedEffect || "none"
  );
  const [stretchX, setStretchX] = useState<number>(
    typeof initialSpreadSettings.stretchX === "number" ? initialSpreadSettings.stretchX : 1.0
  );
  const [stretchY, setStretchY] = useState<number>(
    typeof initialSpreadSettings.stretchY === "number" ? initialSpreadSettings.stretchY : 1.0
  );
  const [lockAspect, setLockAspect] = useState<boolean>(
    typeof initialSpreadSettings.lockAspect === "boolean" ? initialSpreadSettings.lockAspect : true
  );
  const [currentImage, setCurrentImage] = useState<string>(imageUrl || DEFAULT_USER_DEFINED_IMAGE_PATH);
  const [isRestoringDb, setIsRestoringDb] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [isAdjustOpen, setIsAdjustOpen] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>("");

  const [savedArtworkSources, setSavedArtworkSources] = useState<SavedArtworkSource[]>(() => {
    const local = remoteStore.getItem("seqcarver_artwork_sources_v2");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length >= 12) return parsed;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p: SavedArtworkSource) => p.id));
          const additions = DEFAULT_SAVED_ARTWORK_SOURCES.filter((d) => !existingIds.has(d.id));
          return [...parsed, ...additions];
        }
      } catch {}
    }
    return DEFAULT_SAVED_ARTWORK_SOURCES;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const adjustPopoverRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      setStatusBanner({ type, message });
      setTimeout(() => {
        setStatusBanner((curr) => (curr?.message === message ? null : curr));
      }, 3200);
    },
    []
  );

  const persistSpreadSettings = useCallback(
    (
      overrides: Partial<{
        selectedEffect: string;
        stretchX: number;
        stretchY: number;
        lockAspect: boolean;
        gridMode: "2x2" | "3x3" | "4x4";
      }>
    ) => {
      const payload = {
        selectedEffect,
        stretchX,
        stretchY,
        lockAspect,
        gridMode: localGridMode,
        ...overrides,
      };
      remoteStore.setItem("seqcarver_custom_spread_settings", JSON.stringify(payload));
      saveAppStateToDatabase("custom_spread_settings", payload).catch(console.warn);
    },
    [selectedEffect, stretchX, stretchY, lockAspect, localGridMode]
  );

  useEffect(() => {
    if (imageUrl) {
      setCurrentImage(imageUrl);
    }
  }, [imageUrl]);

  useEffect(() => {
    if (!isOpen) return;

    const savedMode = remoteStore.getItem("seqcarver_control_deck_grid_mode");
    const mode: "2x2" | "3x3" | "4x4" =
      savedMode === "2x2" && gridMode !== "4x4"
        ? "2x2"
        : gridMode === "4x4"
        ? "4x4"
        : "3x3";
    setLocalGridMode(mode);
    const slots = mode === "4x4" ? 16 : mode === "2x2" ? 4 : 9;

    const activeFrontPageSlots = Array.from({ length: slots }, (_, i) => i + 1).filter((slotNum) =>
      Boolean(boxImages[slotNum] && boxImages[slotNum].trim() !== "")
    );
    if (activeFrontPageSlots.length > 0) {
      setSelectedBoxes(activeFrontPageSlots);
    } else {
      setSelectedBoxes(Array.from({ length: slots }, (_, i) => i + 1));
    }

    if (imageUrl) {
      setCurrentImage(imageUrl);
    }

    getAppStateFromDatabase<SavedArtworkSource[]>("control_deck_artwork_sources_v2")
      .then((remoteSources) => {
        if (remoteSources && Array.isArray(remoteSources) && remoteSources.length > 0) {
          setSavedArtworkSources(remoteSources);
          remoteStore.setItem("seqcarver_artwork_sources_v2", JSON.stringify(remoteSources));
        }
      })
      .catch((e) => console.warn("Notice loading remote artwork sources:", e));

    getAppStateFromDatabase<{
      selectedEffect?: string;
      stretchX?: number;
      stretchY?: number;
      lockAspect?: boolean;
      gridMode?: "2x2" | "3x3" | "4x4";
    }>("custom_spread_settings")
      .then((remoteSettings) => {
        if (remoteSettings && typeof remoteSettings === "object") {
          if (remoteSettings.selectedEffect) setSelectedEffect(remoteSettings.selectedEffect);
          if (typeof remoteSettings.stretchX === "number") setStretchX(remoteSettings.stretchX);
          if (typeof remoteSettings.stretchY === "number") setStretchY(remoteSettings.stretchY);
          if (typeof remoteSettings.lockAspect === "boolean") setLockAspect(remoteSettings.lockAspect);
          remoteStore.setItem("seqcarver_custom_spread_settings", JSON.stringify(remoteSettings));
        }
      })
      .catch((e) => console.warn("Notice loading custom spread settings:", e));
  }, [isOpen, gridMode, imageUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isAdjustOpen) {
          setIsAdjustOpen(false);
        } else {
          onClose();
        }
      }
    };
    const handleOutsideClick = (e: MouseEvent) => {
      if (adjustPopoverRef.current && !adjustPopoverRef.current.contains(e.target as Node)) {
        setIsAdjustOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    if (isAdjustOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, isAdjustOpen, onClose]);

  const handleSaveArtworkSourceToDatabase = useCallback(
    async (sourceToSave: { name: string; url: string }) => {
      if (!sourceToSave.url) return;
      const newRecord: SavedArtworkSource = {
        id: `art_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: sourceToSave.name || `Artwork ${savedArtworkSources.length + 1}`,
        url: sourceToSave.url,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const updatedSources = [
        newRecord,
        ...savedArtworkSources.filter((s) => s.url !== newRecord.url),
      ];
      setSavedArtworkSources(updatedSources);
      remoteStore.setItem("seqcarver_artwork_sources_v2", JSON.stringify(updatedSources));

      try {
        await saveAppStateToDatabase("control_deck_artwork_sources_v2", updatedSources);
        await saveAppStateToDatabase("control_deck_active_artwork", newRecord.url);
        await saveDatabaseConfig({ originalSpreadImage: newRecord.url });
        showToast(`✓ Saved "${newRecord.name}" to database`);
      } catch (e) {
        console.warn("Database save notice:", e);
        showToast(`✓ Saved "${newRecord.name}"`);
      }
    },
    [savedArtworkSources, showToast]
  );

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result?.toString() || "";
        if (result) {
          setCurrentImage(result);
          onImageChange?.(result);
          const cleanName = file.name.replace(/\.[^/.]+$/, "").slice(0, 15) || "Uploaded Art";
          handleSaveArtworkSourceToDatabase({ name: cleanName, url: result });
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleCycleGridMode = () => {
    const was4x4 = localGridMode === "4x4";
    const nextMode: "2x2" | "3x3" | "4x4" =
      localGridMode === "3x3" ? "4x4" : localGridMode === "4x4" ? "2x2" : "3x3";
    setLocalGridMode(nextMode);
    remoteStore.setItem("seqcarver_control_deck_grid_mode", nextMode);
    persistSpreadSettings({ gridMode: nextMode });

    const nextSlots = nextMode === "4x4" ? 16 : nextMode === "2x2" ? 4 : 9;
    const nextSlotArray = Array.from({ length: nextSlots }, (_, i) => i + 1);
    setSelectedBoxes(nextSlotArray);
    remoteStore.setItem("seqcarver_canvas_selected_slots", JSON.stringify(nextSlotArray));

    const nextIs4x4 = nextMode === "4x4";
    if (was4x4 !== nextIs4x4 && onToggleGridMode) {
      onToggleGridMode(nextIs4x4 ? "4x4" : "3x3");
    }
    showToast(`✓ Cycled board to ${nextMode} (${nextSlots} slots)`);
  };

  const toggleBox = (slotId: number) => {
    const isCurrentlySelected = selectedBoxes.includes(slotId);
    if (isCurrentlySelected) {
      if (setBoxImages) {
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
      }
      setSelectedBoxes((prev) => {
        const nextSel = prev.filter((b) => b !== slotId);
        remoteStore.setItem("seqcarver_canvas_selected_slots", JSON.stringify(nextSel));
        return nextSel;
      });
    } else {
      setSelectedBoxes((prev) => {
        const nextSel = [...prev, slotId].sort((a, b) => a - b);
        remoteStore.setItem("seqcarver_canvas_selected_slots", JSON.stringify(nextSel));
        return nextSel;
      });
    }
  };

  const handleSelectAllSlots = () => {
    setSelectedBoxes(slotList);
    remoteStore.setItem("seqcarver_canvas_selected_slots", JSON.stringify(slotList));
    showToast(`✓ Selected all ${slotList.length} slots`);
  };

  const handleClearAllSlots = () => {
    setSelectedBoxes([]);
    remoteStore.setItem("seqcarver_canvas_selected_slots", JSON.stringify([]));
    if (setBoxImages) {
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
    }
    showToast("✓ All slots set to blank");
  };

  const handleInvertSlots = () => {
    const inverted = slotList.filter((id) => !selectedBoxes.includes(id));
    setSelectedBoxes(inverted);
    remoteStore.setItem("seqcarver_canvas_selected_slots", JSON.stringify(inverted));
    showToast(`✓ Inverted selection (${inverted.length} active)`);
  };

  const currentFilter = EFFECTS.find((e) => e.id === selectedEffect)?.filter || "none";
  const activeEffectLabel = EFFECTS.find((e) => e.id === selectedEffect)?.label || "None";

  const handleExecuteSpread = (mode: "preview" | "close" | "proceed") => {
    if (selectedBoxes.length === 0) {
      showToast("Please select at least one active canvas slot", "error");
      return;
    }
    onApplySpread(selectedBoxes, currentImage, currentFilter, stretchX, stretchY, gridCols);
    persistSpreadSettings({});
    handleSaveArtworkSourceToDatabase({ name: "Carved Master Artwork", url: currentImage });

    if (mode === "close") {
      onClose();
    } else if (mode === "proceed") {
      if (onProceedToSequencer) {
        onProceedToSequencer();
      } else {
        onClose();
      }
    } else {
      showToast(`✓ Preview applied across ${selectedBoxes.length} active slots`);
    }
  };

  const handleRestoreDbDefaults = useCallback(async () => {
    setIsRestoringDb(true);
    try {
      let restoredImage = "";
      const dbConfig = await getDatabaseConfig().catch(() => null);
      if (dbConfig) {
        if (
          dbConfig.originalSpreadImage &&
          dbConfig.originalSpreadImage !== "[STORED_IN_APP_STATES]"
        ) {
          restoredImage = dbConfig.originalSpreadImage;
        } else if (dbConfig.boxImages?.[1]) {
          restoredImage = dbConfig.boxImages[1];
        }
      }

      if (!restoredImage) {
        const userDef = await getAppStateFromDatabase<string>("user_default_3x3_image").catch(
          () => null
        );
        if (userDef) {
          restoredImage = userDef;
        } else {
          const remoteSpread = await getAppStateFromDatabase<string>(
            "img_originalSpreadImage"
          ).catch(() => null);
          if (remoteSpread) {
            restoredImage = remoteSpread;
          } else {
            const remoteB1 = await getAppStateFromDatabase<string>("img_defaultBox1Image").catch(
              () => null
            );
            if (remoteB1) {
              restoredImage = remoteB1;
            }
          }
        }
      }

      const localUserDef = remoteStore.getItem("seqcarver_user_defined_master_image") || remoteStore.getItem("seqcarver_user_default_3x3_image");
      const finalImage =
        (restoredImage && !restoredImage.includes("source-01.jpg") && restoredImage !== eurospectImg)
          ? restoredImage
          : (localUserDef && !localUserDef.includes("source-01.jpg") && localUserDef !== eurospectImg)
          ? localUserDef
          : DEFAULT_USER_DEFINED_IMAGE_PATH;
      setCurrentImage(finalImage);
      onImageChange?.(finalImage);

      setSelectedBoxes(slotList);
      setSelectedEffect("none");
      setStretchX(1.0);
      setStretchY(1.0);
      setLockAspect(true);
      persistSpreadSettings({
        selectedEffect: "none",
        stretchX: 1.0,
        stretchY: 1.0,
        lockAspect: true,
      });

      if (onRestoreDefaultsFromDb) {
        await onRestoreDefaultsFromDb();
      }

      showToast("✓ Restored full spread defaults from database");
    } catch (err: any) {
      console.error("Failed to restore spread defaults from database:", err);
      showToast(`Error: ${err?.message || "Storage error"}`, "error");
    } finally {
      setIsRestoringDb(false);
    }
  }, [onImageChange, onRestoreDefaultsFromDb, persistSpreadSettings, showToast, slotList]);

  if (!isOpen) return null;

  const getTileSliceStyle = (slotNum: number): React.CSSProperties => {
    const idx = slotNum - 1;
    const col = idx % gridCols;
    const row = Math.floor(idx / gridCols);
    const posX = gridCols > 1 ? (col / (gridCols - 1)) * 100 : 50;
    const posY = gridCols > 1 ? (row / (gridCols - 1)) * 100 : 50;

    return {
      backgroundImage: `url(${currentImage})`,
      backgroundSize: `${gridCols * 100 * stretchX}% ${gridCols * 100 * stretchY}%`,
      backgroundPosition: `${posX}% ${posY}%`,
      filter: currentFilter,
    };
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={uiText("components_custom_spread_modal.dialog.aria_label", "Spread studio")}
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-3 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-150"
    >
      {/* Toast Feedback Banner */}
      {statusBanner && (
        <div
          className={cn(
            "fixed top-5 left-1/2 -translate-x-1/2 z-[120] font-black text-xs px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-200",
            statusBanner.type === "error"
              ? "bg-rose-500 text-white"
              : "bg-emerald-500 text-slate-950"
          )}
        >
          <Database className="w-3.5 h-3.5 shrink-0" />
          <span>{statusBanner.message}</span>
          <CustomizableButton
            buttonId="custom_spread_modal_btn_2"
            defaultIcon={<X className="w-3 h-3" />}
            forceZeroText={true}
            type="button"
            onClick={() => setStatusBanner(null)}
            className="ml-1 opacity-75 hover:opacity-100 cursor-pointer"
          />
        </div>
      )}

      <CustomizableContainer
        ibcId="spread_studio_modal_panel"
        componentType="modal"
        defaultLabel="Spread studio"
        className="bg-[#050b14] border border-[#0d2235] rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.9)] w-full max-w-[1120px] max-h-[calc(100vh-1.25rem)] flex flex-col overflow-hidden text-slate-100 relative"
      >
        {/* Top Header Bar */}
        <header className="h-12 sm:h-14 px-3.5 sm:px-5 bg-[#060f1c] border-b border-[#0d2235] flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            <CustomizableLabel
              as="h2"
              labelId="spread_studio_label_title"
              defaultLabel="Spread studio"
              defaultIcon={<Layers className="w-4.5 h-4.5 text-emerald-400 shrink-0" />}
              className="text-xs sm:text-sm font-bold text-slate-100 tracking-wide flex items-center gap-2 select-none whitespace-nowrap"
            />

            <div className="flex items-center gap-2 ml-2 shrink-0">
              <CustomizableButton
                buttonId="spread_studio_btn_grid_cycle"
                defaultLabel={
                  isCurrent4x4
                    ? "4×4 (16 slots)"
                    : isCurrent2x2
                    ? "2×2 (4 slots)"
                    : "3×3 (9 slots)"
                }
                forceZeroText={true}
                defaultIcon={<Grid className="w-4 h-4 text-cyan-400 shrink-0" />}
                onClick={handleCycleGridMode}
                className="w-10 h-8 rounded-xl bg-[#071525] hover:bg-[#0e213d] border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center transition-all shadow-xs cursor-pointer shrink-0 active:scale-95 tabular-nums"
                title="Cycle between 2×2 (4 slots), 3×3 (9 slots), and 4×4 (16 slots) layout"
              />

              <CustomizableButton
                buttonId="spread_studio_btn_restore_db_defaults"
                defaultLabel="Restore db defaults"
                forceZeroText={true}
                defaultIcon={
                  <RotateCcw
                    className={cn(
                      "w-4 h-4 text-cyan-400 shrink-0",
                      isRestoringDb && "animate-spin"
                    )}
                  />
                }
                onClick={handleRestoreDbDefaults}
                disabled={isRestoringDb}
                className="w-10 h-8 rounded-xl bg-[#071525] hover:bg-[#0e213d] border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 flex items-center justify-center transition-all shadow-xs cursor-pointer shrink-0 active:scale-95 disabled:opacity-50"
                title="Restore full defaults from Firestore cloud database"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CustomizableButton
              buttonId="spread_studio_btn_lock_aspect"
              defaultLabel={lockAspect ? "Locked" : "Unlocked"}
              forceZeroText={true}
              defaultIcon={
                lockAspect ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )
              }
              onClick={() => {
                const next = !lockAspect;
                setLockAspect(next);
                persistSpreadSettings({ lockAspect: next });
                showToast(next ? "✓ Aspect ratio locked (1:1)" : "Aspect ratio unlocked (free)");
              }}
              className={cn(
                "p-2 w-9 h-9 rounded-xl border transition-colors cursor-pointer flex items-center justify-center",
                lockAspect
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "bg-[#0c1626] hover:bg-[#132238] border-slate-800 text-slate-400 hover:text-white"
              )}
              title={
                lockAspect
                  ? "Aspect ratio locked (click for free stretch)"
                  : "Free stretch (click to lock aspect ratio)"
              }
            />

            <CustomizableButton
              buttonId="spread_studio_btn_close"
              defaultLabel="Close"
              forceZeroText={true}
              defaultIcon={<X className="w-4 h-4" />}
              onClick={onClose}
              className="p-2 w-9 h-9 rounded-xl bg-[#0c1626] hover:bg-rose-950/80 hover:text-rose-300 border border-slate-800 text-slate-400 transition-colors cursor-pointer flex items-center justify-center"
              title="Close spread studio (Esc)"
            />
          </div>
        </header>

        {/* Fit-in-Pane Main Workspace (Zero Vertical Scroll on >=520px) */}
        <main className="flex-1 min-w-0 bg-[#050b14] overflow-y-auto min-[520px]:overflow-hidden p-2.5 sm:p-4 flex flex-col justify-center">
          <CustomizableContainer
            ibcId="spread_studio_fit_pane"
            componentType="panel"
            defaultLabel="Spread studio pane"
            className="w-full bg-[#060e1c]/95 border border-[#0e2036] rounded-2xl sm:rounded-3xl px-3.5 py-3 sm:px-6 sm:py-4 shadow-xl flex flex-col gap-2.5 sm:gap-3.5 relative min-w-0"
          >
            {/* Top Summary Strip */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-3">
                <CustomizableLabel
                  labelId="spread_studio_label_grid_header"
                  defaultLabel="Spread"
                  showIconAlways={false}
                  className="px-2.5 py-0.5 rounded-md bg-[#072920] border border-emerald-500/25 text-xs font-mono font-bold tracking-wide text-[#34eba8] select-none"
                />
                <span className="text-xs sm:text-[13px] font-mono font-semibold text-[#29b6f6] tabular-nums">
                  {selectedBoxes.length}
                  {uiText("components_custom_spread_modal.span.spread_active_sep", " active · ")}
                  {totalSlots - selectedBoxes.length}
                  {uiText("components_custom_spread_modal.span.spread_blank_suffix", " blank")}
                </span>
              </div>
            </div>

            {/* 3 Inline Main Viewers: Canvas slots | Live preview | Saved artwork sources */}
            <div className="grid grid-cols-1 min-[520px]:grid-cols-12 gap-3.5 sm:gap-5 lg:gap-7 items-start min-w-0">
              {/* Viewer 1: Canvas slots */}
              <div className="min-[520px]:col-span-4 flex flex-col gap-2 w-full min-w-0">
                <div className="h-5 flex items-center justify-between">
                  <CustomizableLabel
                    labelId="spread_studio_label_canvas_slots"
                    defaultLabel="Canvas slots"
                    defaultIcon={<LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />}
                    className="text-[11px] sm:text-xs font-mono font-bold tracking-wide text-slate-200 flex items-center gap-1.5 select-none truncate"
                  />
                </div>

                <div
                  className={cn(
                    "grid gap-1.5 sm:gap-2 w-full",
                    isCurrent4x4
                      ? "grid-cols-4"
                      : isCurrent2x2
                      ? "grid-cols-2"
                      : "grid-cols-3"
                  )}
                >
                  {slotList.map((slotNum) => {
                    const isSlotActive = selectedBoxes.includes(slotNum);
                    return (
                      <CustomizableButton
                        key={`spread-cell-${slotNum}`}
                        buttonId={`spread_studio_cell_${slotNum}`}
                        defaultLabel={`#${slotNum}`}
                        type="button"
                        onClick={() => toggleBox(slotNum)}
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
                            ? `Slot #${slotNum} (Active). Click to deselect and display as blank`
                            : `Slot #${slotNum} (Blank). Click to include in spread`
                        }
                      >
                        {() => (
                          <>
                            {isSlotActive && currentImage && (
                              <div
                                className="absolute inset-0 bg-no-repeat opacity-30 group-hover:opacity-20 transition-opacity pointer-events-none"
                                style={getTileSliceStyle(slotNum)}
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
                                ? uiText("components_custom_spread_modal.span.slot_state_active", "Active")
                                : uiText("components_custom_spread_modal.span.slot_state_blank", "Blank")}
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
                    buttonId="spread_studio_btn_submit_preview"
                    defaultLabel="Submit spread"
                    forceZeroText={true}
                    defaultIcon={<Sparkles className="w-4 h-4 text-cyan-300 stroke-[2.2]" />}
                    onClick={() => handleExecuteSpread("preview")}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-[#072430] hover:bg-[#0b3345] border border-cyan-400/75 hover:border-cyan-300 text-cyan-200 transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                    title="Submit spread - live preview on board without closing modal"
                  />

                  <CustomizableButton
                    buttonId="spread_studio_btn_apply"
                    defaultLabel="Apply spread"
                    forceZeroText={true}
                    defaultIcon={<CheckCircle2 className="w-4.5 h-4.5 text-slate-950 stroke-[2.6]" />}
                    onClick={() => handleExecuteSpread("close")}
                    disabled={selectedBoxes.length === 0}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-[#00d48a] hover:bg-[#00e596] active:scale-95 text-slate-950 font-black transition-all shadow-xs shadow-emerald-500/25 flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-50"
                    title="Submit spread and close - apply spread and return to front page"
                  />

                  <CustomizableButton
                    buttonId="spread_studio_btn_submit_proceed"
                    defaultLabel="Submit spread and proceed"
                    forceZeroText={true}
                    defaultIcon={<GitBranch className="w-4 h-4 text-purple-300 stroke-[2.2]" />}
                    onClick={() => handleExecuteSpread("proceed")}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-[#1c1236] hover:bg-[#27184b] border border-purple-400/75 hover:border-purple-300 text-purple-200 transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                    title="Submit spread and proceed - open Sequencer workspace"
                  />
                </div>
              </div>

              {/* Viewer 2: Live preview + Interactive Filter/Stretch Readout + Compact Square Upload */}
              <div className="min-[520px]:col-span-4 flex flex-col items-center w-full min-w-0">
                <div
                  className="w-full max-w-[min(100%,34vh,260px)] flex flex-col gap-1.5 sm:gap-2 relative"
                  ref={adjustPopoverRef}
                >
                  <div className="h-5 flex items-center justify-between w-full gap-1 min-w-0">
                    <CustomizableLabel
                      labelId="spread_studio_label_live_preview"
                      defaultLabel="Live preview"
                      showIconAlways={false}
                      className="text-[11px] sm:text-xs font-mono font-bold tracking-wide text-slate-200 select-none truncate"
                    />
                    <span className="text-[10px] sm:text-[11px] font-mono text-cyan-400 font-bold tabular-nums whitespace-nowrap shrink-0">
                      {isCurrent4x4
                        ? uiText("components_custom_spread_modal.span.slice_mesh_4x4", "4×4 slice mesh")
                        : isCurrent2x2
                        ? uiText("components_custom_spread_modal.span.slice_mesh_2x2", "2×2 slice mesh")
                        : uiText("components_custom_spread_modal.span.slice_mesh_3x3", "3×3 slice mesh")}
                    </span>
                  </div>

                  <div className="w-full aspect-square rounded-2xl border border-slate-700/80 overflow-hidden relative bg-[#040812] flex items-center justify-center p-0.5 shadow-lg">
                    {currentImage ? (
                      <div className="relative w-full h-full overflow-hidden rounded-xl">
                        <img
                          src={currentImage}
                          alt={uiText("components_custom_spread_modal.img.spread_master_preview.alt", "Live preview")}
                          referrerPolicy="no-referrer"
                          style={{
                            filter: currentFilter,
                            transform: `scale(${stretchX}, ${stretchY})`,
                          }}
                          className="w-full h-full object-cover transition-transform duration-150"
                        />
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
                            const isSel = selectedBoxes.includes(sId);
                            return (
                              <div
                                key={`live-mesh-slot-${sId}`}
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
                        {uiText("components_custom_spread_modal.span.no_source", "No source selected")}
                      </span>
                    )}
                  </div>

                  {/* Interactive Filter & Stretch Readout */}
                  <CustomizableButton
                    buttonId="spread_studio_btn_adjust_toggle"
                    type="button"
                    onClick={() => setIsAdjustOpen((prev) => !prev)}
                    className="w-full py-0.5 px-1.5 rounded-lg hover:bg-slate-800/60 text-[10px] sm:text-[11px] font-mono text-slate-400 text-center flex items-center justify-center gap-1 transition-colors cursor-pointer tabular-nums truncate"
                    title="Click to adjust colour filter, geometric stretch, artwork URL, and bulk slot actions"
                  >
                    {() => (
                      <span className="truncate">
                        {uiText("components_custom_spread_modal.span.filter_label", "Filter: ")}
                        <span className="text-emerald-400 font-bold">{activeEffectLabel}</span>
                        {" · "}
                        {uiText("components_custom_spread_modal.span.stretch_label", "Stretch: ")}
                        <span className="text-cyan-400 font-bold">
                          {stretchX.toFixed(2)}×, {stretchY.toFixed(2)}×
                        </span>
                      </span>
                    )}
                  </CustomizableButton>

                  {/* Left-aligned Compact Square Upload Button */}
                  <div className="flex items-center justify-start w-full">
                    <CustomizableButton
                      buttonId="spread_studio_btn_change_image"
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
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Floating Consolidated Adjustments Popover */}
                  {isAdjustOpen && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-11 w-[320px] sm:w-[370px] max-h-[calc(100vh-9rem)] overflow-y-auto bg-[#081222]/98 border border-cyan-500/40 rounded-2xl shadow-2xl p-3.5 z-50 flex flex-col gap-3 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <CustomizableLabel
                          labelId="spread_studio_label_stretch_header"
                          defaultLabel="Geometric stretch & filter"
                          showIconAlways={false}
                          className="text-xs font-mono font-bold text-slate-200 select-none"
                        />
                        <CustomizableButton
                          buttonId="spread_studio_btn_adjust_close"
                          defaultLabel="Done"
                          forceZeroText={true}
                          defaultIcon={<X className="w-3.5 h-3.5" />}
                          onClick={() => setIsAdjustOpen(false)}
                          className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          title="Close adjustments"
                        />
                      </div>

                      {/* Stretch X & Y Sliders */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                            <CustomizableLabel
                              labelId="spread_studio_label_scale_x"
                              defaultLabel="Stretch x"
                              showIconAlways={false}
                              className="text-slate-400 font-bold"
                            />
                            <span className="text-cyan-400 font-semibold">
                              {stretchX.toFixed(2)}×
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="range"
                              min="0.5"
                              max="2.5"
                              step="0.05"
                              value={stretchX}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                const nextY = lockAspect ? val : stretchY;
                                setStretchX(val);
                                if (lockAspect) setStretchY(val);
                                persistSpreadSettings({ stretchX: val, stretchY: nextY });
                              }}
                              className="flex-1 accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                            <CustomizableButton
                              buttonId="spread_studio_btn_reset_stretch_x"
                              defaultLabel="Reset x"
                              forceZeroText={true}
                              defaultIcon={<RefreshCw className="w-2.5 h-2.5 text-cyan-400" />}
                              onClick={() => {
                                setStretchX(1.0);
                                if (lockAspect) setStretchY(1.0);
                                persistSpreadSettings({
                                  stretchX: 1.0,
                                  stretchY: lockAspect ? 1.0 : stretchY,
                                });
                              }}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-300 border border-slate-800 cursor-pointer"
                              title="Reset horizontal scale to 1.00×"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                            <CustomizableLabel
                              labelId="spread_studio_label_scale_y"
                              defaultLabel="Stretch y"
                              showIconAlways={false}
                              className="text-slate-400 font-bold"
                            />
                            <span className="text-cyan-400 font-semibold">
                              {stretchY.toFixed(2)}×
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="range"
                              min="0.5"
                              max="2.5"
                              step="0.05"
                              value={stretchY}
                              disabled={lockAspect}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setStretchY(val);
                                persistSpreadSettings({ stretchY: val });
                              }}
                              className="flex-1 accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg disabled:opacity-40"
                            />
                            <CustomizableButton
                              buttonId="spread_studio_btn_reset_stretch_y"
                              defaultLabel="Reset y"
                              forceZeroText={true}
                              defaultIcon={<RefreshCw className="w-2.5 h-2.5 text-cyan-400" />}
                              disabled={lockAspect}
                              onClick={() => {
                                setStretchY(1.0);
                                persistSpreadSettings({ stretchY: 1.0 });
                              }}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-300 border border-slate-800 cursor-pointer disabled:opacity-40"
                              title="Reset vertical scale to 1.00×"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Colour Treatment */}
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
                        <CustomizableLabel
                          labelId="spread_studio_label_fx_header"
                          defaultLabel="Colour treatment"
                          showIconAlways={false}
                          className="text-[11px] font-mono font-bold text-slate-300 select-none"
                        />
                        <div className="grid grid-cols-4 gap-1.5">
                          {EFFECTS.map((eff) => {
                            const isEffActive = selectedEffect === eff.id;
                            return (
                              <CustomizableButton
                                key={eff.id}
                                buttonId={eff.buttonId}
                                defaultLabel={eff.label}
                                onClick={() => {
                                  setSelectedEffect(eff.id);
                                  persistSpreadSettings({ selectedEffect: eff.id });
                                }}
                                className={cn(
                                  "px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer text-center whitespace-nowrap",
                                  isEffActive
                                    ? "bg-[#00c982] text-slate-950 font-black"
                                    : "bg-[#0c1626] hover:bg-[#132238] border border-slate-800 text-slate-300"
                                )}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Paste Image URL & Quick Bulk Slot Actions */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && urlInput.trim()) {
                                const trimmed = urlInput.trim();
                                setCurrentImage(trimmed);
                                onImageChange?.(trimmed);
                                setUrlInput("");
                                handleSaveArtworkSourceToDatabase({
                                  name: "URL Artwork",
                                  url: trimmed,
                                });
                              }
                            }}
                            placeholder={uiText(
                              "components_custom_spread_modal.input.paste_url.placeholder",
                              "Paste image url (https://)"
                            )}
                            className="flex-1 h-8 px-2.5 bg-[#050b16] border border-slate-800 rounded-lg text-[11px] font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60"
                          />
                          <CustomizableButton
                            buttonId="spread_studio_btn_use_url"
                            defaultLabel="Use & save url"
                            forceZeroText={true}
                            defaultIcon={<Check className="w-3.5 h-3.5" />}
                            onClick={() => {
                              if (urlInput.trim()) {
                                const trimmed = urlInput.trim();
                                setCurrentImage(trimmed);
                                onImageChange?.(trimmed);
                                setUrlInput("");
                                handleSaveArtworkSourceToDatabase({
                                  name: "URL Artwork",
                                  url: trimmed,
                                });
                              }
                            }}
                            className="h-8 px-2.5 rounded-lg bg-[#0a3d31] hover:bg-[#0e4e3f] text-emerald-300 font-bold text-xs cursor-pointer shrink-0 flex items-center justify-center"
                            title="Apply image URL and save to database"
                          />
                          <CustomizableButton
                            buttonId="spread_studio_btn_save_source_db"
                            defaultLabel="Save to db"
                            forceZeroText={true}
                            defaultIcon={<Save className="w-3.5 h-3.5" />}
                            onClick={() =>
                              handleSaveArtworkSourceToDatabase({
                                name: "Master Artwork",
                                url: currentImage,
                              })
                            }
                            className="h-8 px-2.5 rounded-lg bg-[#092e24] hover:bg-[#0d4234] border border-emerald-500/50 text-emerald-300 text-xs font-bold cursor-pointer shrink-0 flex items-center justify-center"
                            title="Save current artwork source to database"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1">
                            <CustomizableButton
                              buttonId="spread_studio_btn_select_all"
                              defaultLabel="All"
                              onClick={handleSelectAllSlots}
                              className="px-2 py-1 rounded-lg bg-[#0d1829] hover:bg-[#16253d] text-emerald-300 border border-slate-800 text-[10px] font-mono font-bold cursor-pointer"
                              title="Select all slots for spread"
                            />
                            <CustomizableButton
                              buttonId="spread_studio_btn_clear_all"
                              defaultLabel="Blank"
                              onClick={handleClearAllSlots}
                              className="px-2 py-1 rounded-lg bg-[#0d1829] hover:bg-rose-950/60 text-rose-300 border border-slate-800 text-[10px] font-mono font-bold cursor-pointer"
                              title="Deselect all slots"
                            />
                            <CustomizableButton
                              buttonId="spread_studio_btn_invert_slots"
                              defaultLabel="Invert"
                              onClick={handleInvertSlots}
                              className="px-2 py-1 rounded-lg bg-[#0d1829] hover:bg-[#16253d] text-cyan-300 border border-slate-800 text-[10px] font-mono font-bold cursor-pointer"
                              title="Invert current slot selection"
                            />
                          </div>

                          <CustomizableButton
                            buttonId="spread_studio_btn_cancel"
                            defaultLabel="Cancel"
                            onClick={onClose}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-[10px] cursor-pointer shrink-0"
                            title="Cancel and close spread studio"
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
                    labelId="spread_studio_label_saved_sources"
                    defaultLabel="Saved artwork sources"
                    showIconAlways={false}
                    className="text-[11px] sm:text-xs font-mono font-bold tracking-wide text-slate-200 select-none truncate"
                  />
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 whitespace-nowrap shrink-0">
                    {uiText("components_custom_spread_modal.span.click_to_apply", "Click to apply")}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full">
                  {savedArtworkSources.slice(0, 12).map((source) => {
                    const isSelected = currentImage === source.url;
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
                          setCurrentImage(source.url);
                          onImageChange?.(source.url);
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
                          buttonId="spread_studio_btn_delete_source"
                          defaultIcon={<Trash2 className="w-2.5 h-2.5" />}
                          forceZeroText={true}
                          type="button"
                          onClick={(e) => handleDeleteArtworkSourceFromDatabase(source.id, e)}
                          className="absolute top-1 right-1 w-4.5 h-4.5 rounded-md bg-black/80 hover:bg-rose-950 text-slate-400 hover:text-rose-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Remove source from database"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CustomizableContainer>
        </main>
      </CustomizableContainer>
    </div>
  );
}
