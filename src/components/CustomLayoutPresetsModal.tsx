import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  LayoutGrid,
  Plus,
  Trash2,
  Bookmark,
  Sparkles,
  Download,
  Upload,
  Check,
  Star,
  Copy,
  Edit2,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Info,
  Layers,
  ArrowRight,
  Maximize2,
  FileJson,
  CheckSquare,
  Square,
  Search,
  Filter,
} from "lucide-react";
import { cn } from "../utils/cn";
import {
  type CustomLayoutPreset,
  type PresetCategory,
  BUILTIN_LAYOUT_PRESETS,
} from "../types/layoutPresets";
import { getStoredJson, saveStoredJson } from "../utils/idbStorage";
import { uiText } from "../hooks/useUIConfig";
import { remoteStore } from "../services/remoteKeyValueStore";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

const STORAGE_KEY = "seqcarver_custom_layout_presets_v1";

export interface CurrentGridSnapshot {
  numRows: number;
  numCols: number;
  rowCuts: number[];
  colCuts: number[];
  carverSkew: number;
  carveImageWidth: number;
  carveImageHeight: number;
  sliceLineColor: string;
  sliceLineStyle: "solid" | "dashed" | "dotted";
  sliceLineThickness: number;
  sliceLineThicknessX?: number;
  sliceLineThicknessY?: number;
  isGapLocked?: boolean;
  outerMargin: number;
  numberingOrigin?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  numberingFlow?: "horizontal" | "vertical";
  namingStyle?: "sequential" | "grid";
  format?: "image/png" | "image/jpeg";
  showGridLabels?: boolean;
  showPixelLabels?: boolean;
  gridLabelPreset?: string;
  customGridLabelPrefix?: string;
}

interface CustomLayoutPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGrid: CurrentGridSnapshot;
  onApplyPreset: (preset: CustomLayoutPreset, applyStyle: boolean) => void;
}

export const CustomLayoutPresetsModal: React.FC<CustomLayoutPresetsModalProps> = ({
  isOpen,
  onClose,
  currentGrid,
  onApplyPreset,
}) => {
  const [presets, setPresets] = useState<CustomLayoutPreset[]>(BUILTIN_LAYOUT_PRESETS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<PresetCategory>("All");
  const [sortOrder, setSortOrder] = useState<"newest" | "name" | "cells">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Save Form State
  const [isSaveDrawerOpen, setIsSaveDrawerOpen] = useState<boolean>(false);
  const [saveName, setSaveName] = useState<string>("");
  const [saveCategory, setSaveCategory] = useState<"Standard" | "Manga / Comic" | "Asymmetric" | "Cinematic" | "Webtoon" | "Custom">("Custom");
  const [saveDescription, setSaveDescription] = useState<string>("");
  const [includeStylesInSave, setIncludeStylesInSave] = useState<boolean>(true);

  // Edit Preset State
  const [editingPreset, setEditingPreset] = useState<CustomLayoutPreset | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editCategory, setEditCategory] = useState<"Standard" | "Manga / Comic" | "Asymmetric" | "Cinematic" | "Webtoon" | "Custom">("Custom");
  const [editDescription, setEditDescription] = useState<string>("");

  // Confirmation modal for deletion
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Load Presets from Storage on open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadPresets() {
      setIsLoading(true);
      try {
        const stored = await getStoredJson<CustomLayoutPreset[]>(STORAGE_KEY);
        if (stored && Array.isArray(stored) && stored.length > 0) {
          // Merge built-in presets that might not be in stored list
          const storedMap = new Map<string, CustomLayoutPreset>(stored.map((p) => [p.id, p]));
          BUILTIN_LAYOUT_PRESETS.forEach((bp) => {
            if (!storedMap.has(bp.id)) {
              storedMap.set(bp.id, bp);
            }
          });
          const merged = Array.from(storedMap.values());
          if (isMounted) setPresets(merged);
        } else {
          if (isMounted) setPresets(BUILTIN_LAYOUT_PRESETS);
          await saveStoredJson(STORAGE_KEY, BUILTIN_LAYOUT_PRESETS);
        }
      } catch (e) {
        console.warn("Failed to load custom layout presets, using defaults", e);
        if (isMounted) setPresets(BUILTIN_LAYOUT_PRESETS);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPresets();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Persist helper
  const persistPresets = async (updated: CustomLayoutPreset[]) => {
    setPresets(updated);
    try {
      await saveStoredJson(STORAGE_KEY, updated);
      try {
        remoteStore.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
    } catch (e) {
      console.error("Failed to persist layout presets:", e);
    }
  };

  // Reset default save name when drawer opens
  useEffect(() => {
    if (isSaveDrawerOpen) {
      const dateStr = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" });
      setSaveName(`Custom ${currentGrid.numRows}×${currentGrid.numCols} (${dateStr})`);
      setSaveDescription(`${currentGrid.numRows} rows × ${currentGrid.numCols} columns layout, skew ${currentGrid.carverSkew}°`);
    }
  }, [isSaveDrawerOpen, currentGrid.numRows, currentGrid.numCols, currentGrid.carverSkew]);

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        if (editingPreset) {
          setEditingPreset(null);
        } else if (isSaveDrawerOpen) {
          setIsSaveDrawerOpen(false);
        } else if (deletingPresetId) {
          setDeletingPresetId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, editingPreset, isSaveDrawerOpen, deletingPresetId, onClose]);

  // Handle Save Current Grid Snapshot as New Preset
  const handleSaveCurrentAsPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = saveName.trim();
    if (!trimmedName) {
      showToast("Please provide a name for your preset.");
      return;
    }

    const imgW = currentGrid.carveImageWidth || 1000;
    const imgH = currentGrid.carveImageHeight || 1000;

    // Calculate normalized relative ratios (0..1)
    const rowRatios = currentGrid.rowCuts
      .map((cut) => Math.max(0.01, Math.min(0.99, cut / imgH)))
      .sort((a, b) => a - b);
    const colRatios = currentGrid.colCuts
      .map((cut) => Math.max(0.01, Math.min(0.99, cut / imgW)))
      .sort((a, b) => a - b);

    const newPreset: CustomLayoutPreset = {
      id: `preset_custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      description: saveDescription.trim() || `${currentGrid.numRows}×${currentGrid.numCols} custom grid layout`,
      category: saveCategory,
      isBuiltIn: false,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      numRows: currentGrid.numRows,
      numCols: currentGrid.numCols,
      rowRatios,
      colRatios,
      carverSkew: currentGrid.carverSkew || 0,
      savedImageWidth: currentGrid.carveImageWidth,
      savedImageHeight: currentGrid.carveImageHeight,
      rowPixelCuts: [...currentGrid.rowCuts],
      colPixelCuts: [...currentGrid.colCuts],
      styleSettings: includeStylesInSave
        ? {
            sliceLineColor: currentGrid.sliceLineColor,
            sliceLineStyle: currentGrid.sliceLineStyle,
            sliceLineThickness: currentGrid.sliceLineThickness,
            sliceLineThicknessX: currentGrid.sliceLineThicknessX,
            sliceLineThicknessY: currentGrid.sliceLineThicknessY,
            isGapLocked: currentGrid.isGapLocked,
            outerMargin: currentGrid.outerMargin,
            numberingOrigin: currentGrid.numberingOrigin,
            numberingFlow: currentGrid.numberingFlow,
            namingStyle: currentGrid.namingStyle,
            format: currentGrid.format,
            showGridLabels: currentGrid.showGridLabels,
            showPixelLabels: currentGrid.showPixelLabels,
            gridLabelPreset: currentGrid.gridLabelPreset,
            customGridLabelPrefix: currentGrid.customGridLabelPrefix,
          }
        : undefined,
    };

    const nextPresets = [newPreset, ...presets];
    await persistPresets(nextPresets);
    setIsSaveDrawerOpen(false);
    showToast(`✓ Saved preset "${newPreset.name}" successfully!`);
  };

  // Overwrite existing custom preset with current grid configuration
  const handleUpdatePresetWithCurrentGrid = async (preset: CustomLayoutPreset) => {
    const imgW = currentGrid.carveImageWidth || 1000;
    const imgH = currentGrid.carveImageHeight || 1000;

    const rowRatios = currentGrid.rowCuts
      .map((cut) => Math.max(0.01, Math.min(0.99, cut / imgH)))
      .sort((a, b) => a - b);
    const colRatios = currentGrid.colCuts
      .map((cut) => Math.max(0.01, Math.min(0.99, cut / imgW)))
      .sort((a, b) => a - b);

    const updated = presets.map((p) => {
      if (p.id === preset.id) {
        return {
          ...p,
          numRows: currentGrid.numRows,
          numCols: currentGrid.numCols,
          rowRatios,
          colRatios,
          carverSkew: currentGrid.carverSkew || 0,
          savedImageWidth: currentGrid.carveImageWidth,
          savedImageHeight: currentGrid.carveImageHeight,
          rowPixelCuts: [...currentGrid.rowCuts],
          colPixelCuts: [...currentGrid.colCuts],
          updatedAt: new Date().toISOString(),
          styleSettings: p.styleSettings
            ? {
                ...p.styleSettings,
                sliceLineColor: currentGrid.sliceLineColor,
                sliceLineStyle: currentGrid.sliceLineStyle,
                sliceLineThickness: currentGrid.sliceLineThickness,
                outerMargin: currentGrid.outerMargin,
              }
            : undefined,
        };
      }
      return p;
    });

    await persistPresets(updated);
    showToast(`✓ Updated "${preset.name}" with current canvas grid!`);
  };

  // Toggle favorite
  const handleToggleFavorite = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = presets.map((p) => {
      if (p.id === presetId) {
        return { ...p, isFavorite: !p.isFavorite };
      }
      return p;
    });
    await persistPresets(updated);
  };

  // Duplicate preset as custom
  const handleDuplicatePreset = async (preset: CustomLayoutPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    const copy: CustomLayoutPreset = {
      ...preset,
      id: `preset_custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${preset.name} (Copy)`,
      isBuiltIn: false,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: undefined,
    };
    const updated = [copy, ...presets];
    await persistPresets(updated);
    showToast(`✓ Duplicated "${preset.name}" as custom preset!`);
  };

  // Delete preset
  const handleConfirmDelete = async () => {
    if (!deletingPresetId) return;
    const target = presets.find((p) => p.id === deletingPresetId);
    const updated = presets.filter((p) => p.id !== deletingPresetId);
    await persistPresets(updated);
    setDeletingPresetId(null);
    showToast(`✓ Removed preset "${target?.name || 'custom'}"`);
  };

  // Start edit preset
  const handleStartEdit = (preset: CustomLayoutPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPreset(preset);
    setEditName(preset.name);
    setEditCategory(preset.category);
    setEditDescription(preset.description || "");
  };

  // Save edit preset
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreset) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      showToast("Preset name cannot be empty.");
      return;
    }
    const updated = presets.map((p) => {
      if (p.id === editingPreset.id) {
        return {
          ...p,
          name: trimmed,
          category: editCategory,
          description: editDescription.trim(),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    await persistPresets(updated);
    setEditingPreset(null);
    showToast(`✓ Preset "${trimmed}" updated!`);
  };

  // Export all presets to JSON
  const handleExportJSON = () => {
    const exportData = {
      app: "SeqCarver",
      schema: "SeqCarverLayoutPresets_v1",
      exportedAt: new Date().toISOString(),
      count: presets.length,
      presets,
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seqcarver-layout-presets-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 400);
    showToast(`✓ Exported ${presets.length} presets to JSON!`);
  };

  // Import presets from JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const incomingList: CustomLayoutPreset[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.presets)
          ? parsed.presets
          : null;

        if (!incomingList || incomingList.length === 0) {
          showToast("Invalid JSON: No layout presets detected.");
          return;
        }

        // Validate and merge incoming presets
        const currentMap = new Map<string, CustomLayoutPreset>(presets.map((p) => [p.id, p]));
        let importedCount = 0;

        incomingList.forEach((item) => {
          if (typeof item.numRows === "number" && typeof item.numCols === "number" && item.name) {
            const newId = currentMap.has(item.id)
              ? `preset_import_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
              : item.id;
            const sanitized: CustomLayoutPreset = {
              ...item,
              id: newId,
              isBuiltIn: false, // Imported are treated as custom/editable
              createdAt: item.createdAt || new Date().toISOString(),
              rowRatios: Array.isArray(item.rowRatios) ? item.rowRatios : [],
              colRatios: Array.isArray(item.colRatios) ? item.colRatios : [],
              carverSkew: typeof item.carverSkew === "number" ? item.carverSkew : 0,
            };
            currentMap.set(newId, sanitized);
            importedCount++;
          }
        });

        const merged = Array.from(currentMap.values());
        await persistPresets(merged);
        showToast(`✓ Successfully imported ${importedCount} layout presets!`);
      } catch (err) {
        console.error("JSON import failed:", err);
        showToast("Error importing presets: Invalid JSON file.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // Restore factory built-in presets
  const handleRestoreBuiltins = async () => {
    const customOnly = presets.filter((p) => !p.isBuiltIn);
    const restored = [...BUILTIN_LAYOUT_PRESETS, ...customOnly];
    await persistPresets(restored);
    showToast("✓ Restored factory layout templates.");
  };

  // Filtered and sorted presets
  const filteredPresets = useMemo(() => {
    let result = presets.filter((p) => {
      // Category filter
      if (activeCategory === "Favorites") {
        if (!p.isFavorite) return false;
      } else if (activeCategory !== "All") {
        if (p.category !== activeCategory) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = (p.description || "").toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        const matchesGrid = `${p.numRows}x${p.numCols}`.includes(q) || `${p.numRows}×${p.numCols}`.includes(q);
        if (!matchesName && !matchesDesc && !matchesCategory && !matchesGrid) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      // Pin favorites first if in All
      if (activeCategory === "All") {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
      }

      if (sortOrder === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortOrder === "cells") {
        return b.numRows * b.numCols - a.numRows * a.numCols;
      }
      // Newest
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return result;
  }, [presets, activeCategory, searchQuery, sortOrder]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: presets.length,
      Favorites: presets.filter((p) => p.isFavorite).length,
      Standard: 0,
      "Manga / Comic": 0,
      Asymmetric: 0,
      Cinematic: 0,
      Webtoon: 0,
      Custom: 0,
    };
    presets.forEach((p) => {
      if (counts[p.category] !== undefined) {
        counts[p.category]++;
      }
    });
    return counts;
  }, [presets]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0b1220] border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/10">
        {/* Top Header */}
        <header className="px-5 py-3.5 bg-[#070c16] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CustomizableLabel
                  labelId="custom_layout_presets_modal_item_46"
                  as="h2"
                  className="text-base font-bold text-slate-100 tracking-tight"
                >
                    {() => (
                        <>
                          {uiText("components_custom_layout_presets_modal.h2.custom_layout_presets", "Custom Layout Presets")}
                        </>
                      )}
                </CustomizableLabel>
                <span className="text-[10px] text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  {presets.length}{uiText("components_custom_layout_presets_modal.span.templates", " Templates")}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {uiText("components_custom_layout_presets_modal.p.save_load_and_organize_custom_grid_configura", "Save, load, and organize custom grid configurations, panel cuts, and canvas styling.")}
              </p>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2">
            <CustomizableButton
              buttonId="custom_layout_presets_modal_btn_45"
              defaultIcon={<Upload className="w-3.5 h-3.5 text-cyan-400" />}
              type="button"
onClick={() => fileInputRef.current?.click()}
className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
title={uiText("components_custom_layout_presets_modal.button.import_presets_from_json.title", "Import Presets from JSON")}
            >
                {() => (
                    <>
                      <span className="hidden sm:inline">{uiText("components_custom_layout_presets_modal.span.import", "Import")}</span>
                    </>
                  )}
            </CustomizableButton>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            <CustomizableButton
              buttonId="custom_layout_presets_modal_btn_44"
              defaultIcon={<Download className="w-3.5 h-3.5 text-amber-400" />}
              type="button"
onClick={handleExportJSON}
className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
title={uiText("components_custom_layout_presets_modal.button.export_presets_to_json.title", "Export Presets to JSON")}
            >
                {() => (
                    <>
                      <span className="hidden sm:inline">{uiText("components_custom_layout_presets_modal.span.export", "Export")}</span>
                    </>
                  )}
            </CustomizableButton>

            <CustomizableButton
              buttonId="custom_layout_presets_modal_btn_43"
              defaultIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-400" />}
              type="button"
onClick={handleRestoreBuiltins}
className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
title={uiText("components_custom_layout_presets_modal.button.restore_factory_built_in_presets.title", "Restore Factory Built-in Presets")}
            >
                {() => (
                    <>
                      <span className="hidden sm:inline">{uiText("components_custom_layout_presets_modal.span.defaults", "Defaults")}</span>
                    </>
                  )}
            </CustomizableButton>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            <CustomizableButton
              buttonId="custom_layout_presets_modal_btn_42"
              defaultIcon={<X className="w-5 h-5" />}
              type="button"
onClick={onClose}
className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
title={uiText("components_custom_layout_presets_modal.button.close_esc.title", "Close (Esc)")}
            />
          </div>
        </header>

        {/* Current Grid Snapshot & 1-Click Save Bar */}
        <section className="px-5 py-3 bg-[#0d1527] border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 overflow-x-auto text-xs py-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
              {uiText("components_custom_layout_presets_modal.span.active_canvas", "Active Canvas:")}
            </span>
            <div className="flex items-center gap-2 text-slate-300 font-mono text-[11.5px] shrink-0">
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-emerald-400 font-bold">
                {currentGrid.numRows} × {currentGrid.numCols}{uiText("components_custom_layout_presets_modal.span.grid", " Grid (")}{currentGrid.numRows * currentGrid.numCols}{uiText("components_custom_layout_presets_modal.span.panels", " Panels)")}
              </span>
              <span className="text-slate-500">•</span>
              <span>{currentGrid.rowCuts.length}{uiText("components_custom_layout_presets_modal.span.h", "H / ")}{currentGrid.colCuts.length}{uiText("components_custom_layout_presets_modal.span.v_cuts", "V Cuts")}</span>
              <span className="text-slate-500">•</span>
              <span>{uiText("components_custom_layout_presets_modal.span.skew", "Skew: ")}{currentGrid.carverSkew}°</span>
              <span className="text-slate-500">•</span>
              <span>{uiText("components_custom_layout_presets_modal.span.gap", "Gap: ")}{currentGrid.sliceLineThickness}{uiText("components_custom_layout_presets_modal.span.px", "px")}</span>
              {currentGrid.carveImageWidth > 0 && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">
                    {currentGrid.carveImageWidth}×{currentGrid.carveImageHeight}{uiText("components_custom_layout_presets_modal.span.px_2", "px")}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CustomizableButton
              buttonId="custom_layout_presets_modal_btn_41"
              defaultIcon={<Plus className="w-4 h-4" />}
              type="button"
onClick={() => setIsSaveDrawerOpen(!isSaveDrawerOpen)}
className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm",
                isSaveDrawerOpen
                  ? "bg-emerald-600 text-white shadow-emerald-500/20"
                  : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50"
              )}
            >
                {() => (
                    <>
                      <span>{isSaveDrawerOpen ? "Close Save Drawer" : "Save Current Grid as Preset"}</span>
                    </>
                  )}
            </CustomizableButton>
          </div>
        </section>

        {/* Drawer for Saving Current Grid Configuration */}
        {isSaveDrawerOpen && (
          <form
            onSubmit={handleSaveCurrentAsPreset}
            className="px-5 py-4 bg-[#0a0f1d] border-b border-emerald-500/30 flex flex-col gap-3 animate-in slide-in-from-top-3 duration-150"
          >
            <div className="flex items-center justify-between">
              <CustomizableLabel
                labelId="custom_layout_presets_modal_item_40"
                defaultIcon={<Bookmark className="w-4 h-4" />}
                as="h3"
                className="text-xs font-bold text-emerald-400 flex items-center gap-2"
              >
                  {() => (
                      <>
                        <span>{uiText("components_custom_layout_presets_modal.span.save_current_grid_as_custom_preset", "Save Current Grid as Custom Preset")}</span>
                      </>
                    )}
              </CustomizableLabel>
              <span className="text-[11px] text-slate-400">
                {uiText("components_custom_layout_presets_modal.span.captures", "Captures ")}{currentGrid.numRows}×{currentGrid.numCols}{uiText("components_custom_layout_presets_modal.span.cuts_proportional_ratios_and_line_styles", " cuts, proportional ratios & line styles")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <CustomizableLabel
                  labelId="custom_layout_presets_modal_item_39"
                  as="label"
                  className="text-[10.5px] font-semibold text-slate-300 block mb-1"
                >
                    {() => (
                        <>
                          {uiText("components_custom_layout_presets_modal.label.preset_name", "Preset Name *")}
                        </>
                      )}
                </CustomizableLabel>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder={uiText("components_custom_layout_presets_modal.input.e_g_manga_5_panel_high_impact.placeholder", "e.g. Manga 5-Panel High Impact")}
                  required
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg text-xs text-slate-100 placeholder-slate-500 outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <CustomizableLabel
                  labelId="custom_layout_presets_modal_item_38"
                  as="label"
                  className="text-[10.5px] font-semibold text-slate-300 block mb-1"
                >
                    {() => (
                        <>
                          {uiText("components_custom_layout_presets_modal.label.category", "Category")}
                        </>
                      )}
                </CustomizableLabel>
                <select
                  value={saveCategory}
                  onChange={(e) => setSaveCategory(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg text-xs text-slate-100 outline-none cursor-pointer"
                >
                  <option value="Custom">{uiText("components_custom_layout_presets_modal.option.custom", "Custom")}</option>
                  <option value="Manga / Comic">{uiText("components_custom_layout_presets_modal.option.manga_comic", "Manga / Comic")}</option>
                  <option value="Standard">{uiText("components_custom_layout_presets_modal.option.standard", "Standard")}</option>
                  <option value="Asymmetric">{uiText("components_custom_layout_presets_modal.option.asymmetric", "Asymmetric")}</option>
                  <option value="Cinematic">{uiText("components_custom_layout_presets_modal.option.cinematic", "Cinematic")}</option>
                  <option value="Webtoon">{uiText("components_custom_layout_presets_modal.option.webtoon", "Webtoon")}</option>
                </select>
              </div>

              <div className="sm:col-span-4">
                <CustomizableLabel
                  labelId="custom_layout_presets_modal_item_37"
                  as="label"
                  className="text-[10.5px] font-semibold text-slate-300 block mb-1"
                >
                    {() => (
                        <>
                          {uiText("components_custom_layout_presets_modal.label.notes_description", "Notes / Description")}
                        </>
                      )}
                </CustomizableLabel>
                <input
                  type="text"
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder={uiText("components_custom_layout_presets_modal.input.optional_layout_description_or_intended_use.placeholder", "Optional layout description or intended use...")}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg text-xs text-slate-100 placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <CustomizableLabel
                labelId="custom_layout_presets_modal_item_36"
                as="label"
                className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300"
              >
                  {() => (
                      <>
                        <input
                  type="checkbox"
                  checked={includeStylesInSave}
                  onChange={(e) => setIncludeStylesInSave(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                      <span>{uiText("components_custom_layout_presets_modal.span.include_current_line_styles_slice_colors_mar", "Include current line styles, slice colors, margin & numbering settings")}</span>
                      </>
                    )}
              </CustomizableLabel>

              <div className="flex items-center gap-2">
                <CustomizableButton
                  buttonId="custom_layout_presets_modal_btn_35"
                  type="button"
onClick={() => setIsSaveDrawerOpen(false)}
className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                    {() => (
                        <>
                          {uiText("components_custom_layout_presets_modal.button.cancel", "Cancel")}
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="custom_layout_presets_modal_btn_34"
                  defaultIcon={<Check className="w-3.5 h-3.5" />}
                  type="submit"
className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                    {() => (
                        <>
                          <span>{uiText("components_custom_layout_presets_modal.span.save_preset", "Save Preset")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>
          </form>
        )}

        {/* Filter & Search Navigation Bar (Anti-Slop segmented controls) */}
        <div className="px-5 py-2.5 bg-[#090e1a] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {(
              [
                "All",
                "Favorites",
                "Standard",
                "Manga / Comic",
                "Asymmetric",
                "Cinematic",
                "Webtoon",
                "Custom",
              ] as PresetCategory[]
            ).map((cat) => {
              const isSelected = activeCategory === cat;
              const count = categoryCounts[cat] || 0;
              return (
                <CustomizableButton
                  buttonId="custom_layout_presets_modal_btn_33"
                  key={cat}
type="button"
onClick={() => setActiveCategory(cat)}
className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                    isSelected
                      ? "bg-slate-800 text-emerald-400 font-bold shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  )}
                >
                    {() => (
                        <>
                          {cat === "Favorites" && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                        <span>{cat}</span>
                        <span className="text-[10px] opacity-60">({count})</span>
                        </>
                      )}
                </CustomizableButton>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={uiText("components_custom_layout_presets_modal.input.search_presets.placeholder", "Search presets...")}
                className="pl-8 pr-7 py-1 bg-slate-900 border border-slate-800 focus:border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 w-40 sm:w-48 outline-none"
              />
              {searchQuery && (
                <CustomizableButton
                  buttonId="custom_layout_presets_modal_btn_32"
                  defaultIcon={<X className="w-3.5 h-3.5" />}
                  type="button"
onClick={() => setSearchQuery("")}
className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                />
              )}
            </div>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg outline-none cursor-pointer"
            >
              <option value="newest">{uiText("components_custom_layout_presets_modal.option.newest_first", "Newest First")}</option>
              <option value="name">{uiText("components_custom_layout_presets_modal.option.name_a_z", "Name (A-Z)")}</option>
              <option value="cells">{uiText("components_custom_layout_presets_modal.option.cell_count", "Cell Count")}</option>
            </select>

            <CustomizableButton
              buttonId="custom_layout_presets_modal_btn_31"
              defaultIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              type="button"
onClick={() => setViewMode(viewMode === "grid" ? "compact" : "grid")}
className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
title={viewMode === "grid" ? "Switch to Compact View" : "Switch to Grid Card View"}
            />
          </div>
        </div>

        {/* Presets List / Grid Area */}
        <div className="flex-1 p-5 overflow-y-auto min-h-0 bg-[#070b14]/50">
          {filteredPresets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-800 rounded-2xl gap-3">
              <LayoutGrid className="w-10 h-10 text-slate-600" />
              <div className="space-y-1">
                <CustomizableLabel
                  labelId="custom_layout_presets_modal_item_30"
                  as="h4"
                  className="text-sm font-bold text-slate-200"
                >
                    {() => (
                        <>
                          {uiText("components_custom_layout_presets_modal.h4.no_layout_presets_found", "No layout presets found")}
                        </>
                      )}
                </CustomizableLabel>
                <p className="text-xs text-slate-400 max-w-sm">
                  {searchQuery
                    ? `No presets match "${searchQuery}". Clear your search or change category filter.`
                    : "No presets in this category yet. Click 'Save Current Grid as Preset' to add one!"}
                </p>
              </div>
              <CustomizableButton
                buttonId="custom_layout_presets_modal_btn_29"
                defaultIcon={<Plus className="w-3.5 h-3.5" />}
                type="button"
onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                  setIsSaveDrawerOpen(true);
                }}
className="mt-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                  {() => (
                      <>
                        <span>{uiText("components_custom_layout_presets_modal.span.create_new_preset", "Create New Preset")}</span>
                      </>
                    )}
              </CustomizableButton>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPresets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  currentGrid={currentGrid}
                  onApply={(applyStyle) => onApplyPreset(preset, applyStyle)}
                  onToggleFavorite={(e) => handleToggleFavorite(preset.id, e)}
                  onDuplicate={(e) => handleDuplicatePreset(preset, e)}
                  onStartEdit={(e) => handleStartEdit(preset, e)}
                  onUpdateWithCurrent={() => handleUpdatePresetWithCurrentGrid(preset)}
                  onDelete={() => setDeletingPresetId(preset.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPresets.map((preset) => (
                <PresetRowItem
                  key={preset.id}
                  preset={preset}
                  currentGrid={currentGrid}
                  onApply={(applyStyle) => onApplyPreset(preset, applyStyle)}
                  onToggleFavorite={(e) => handleToggleFavorite(preset.id, e)}
                  onDuplicate={(e) => handleDuplicatePreset(preset, e)}
                  onStartEdit={(e) => handleStartEdit(preset, e)}
                  onUpdateWithCurrent={() => handleUpdatePresetWithCurrentGrid(preset)}
                  onDelete={() => setDeletingPresetId(preset.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer / Status */}
        <footer className="px-5 py-3 bg-[#070c16] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2 text-slate-400">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {uiText("components_custom_layout_presets_modal.span.presets_scale_proportionally_across_images_o", "Presets scale proportionally across images of any resolution via relative cut coordinates.")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {toastMessage && (
              <span className="text-emerald-400 font-medium animate-in fade-in">
                {toastMessage}
              </span>
            )}
            <CustomizableButton
              buttonId="custom_layout_presets_modal_btn_28"
              type="button"
onClick={onClose}
className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
                {() => (
                    <>
                      {uiText("components_custom_layout_presets_modal.button.close", "Close")}
                    </>
                  )}
            </CustomizableButton>
          </div>
        </footer>
      </div>

      {/* Edit Preset Modal */}
      {editingPreset && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveEdit}
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-100"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <CustomizableLabel
                labelId="custom_layout_presets_modal_item_27"
                defaultIcon={<Edit2 className="w-4 h-4 text-emerald-400" />}
                as="h3"
                className="text-sm font-bold text-slate-100 flex items-center gap-2"
              >
                  {() => (
                      <>
                        <span>{uiText("components_custom_layout_presets_modal.span.edit_layout_preset", "Edit Layout Preset")}</span>
                      </>
                    )}
              </CustomizableLabel>
              <CustomizableButton
                buttonId="custom_layout_presets_modal_btn_26"
                defaultIcon={<X className="w-4 h-4" />}
                type="button"
onClick={() => setEditingPreset(null)}
className="text-slate-400 hover:text-white"
              />
            </div>

            <div className="space-y-3">
              <div>
                <CustomizableLabel
                  labelId="custom_layout_presets_modal_item_25"
                  as="label"
                  className="text-xs font-semibold text-slate-300 block mb-1"
                >
                    {() => (
                        <>
                          {uiText("components_custom_layout_presets_modal.label.preset_name_2", "Preset Name")}
                        </>
                      )}
                </CustomizableLabel>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg text-xs text-slate-100 outline-none"
                />
              </div>

              <div>
                <CustomizableLabel
                  labelId="custom_layout_presets_modal_item_24"
                  as="label"
                  className="text-xs font-semibold text-slate-300 block mb-1"
                >
                    {() => (
                        <>
                          {uiText("components_custom_layout_presets_modal.label.category_2", "Category")}
                        </>
                      )}
                </CustomizableLabel>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg text-xs text-slate-100 outline-none cursor-pointer"
                >
                  <option value="Custom">{uiText("components_custom_layout_presets_modal.option.custom_2", "Custom")}</option>
                  <option value="Manga / Comic">{uiText("components_custom_layout_presets_modal.option.manga_comic_2", "Manga / Comic")}</option>
                  <option value="Standard">{uiText("components_custom_layout_presets_modal.option.standard_2", "Standard")}</option>
                  <option value="Asymmetric">{uiText("components_custom_layout_presets_modal.option.asymmetric_2", "Asymmetric")}</option>
                  <option value="Cinematic">{uiText("components_custom_layout_presets_modal.option.cinematic_2", "Cinematic")}</option>
                  <option value="Webtoon">{uiText("components_custom_layout_presets_modal.option.webtoon_2", "Webtoon")}</option>
                </select>
              </div>

              <div>
                <CustomizableLabel
                  labelId="custom_layout_presets_modal_item_23"
                  as="label"
                  className="text-xs font-semibold text-slate-300 block mb-1"
                >
                    {() => (
                        <>
                          {uiText("components_custom_layout_presets_modal.label.description_notes", "Description / Notes")}
                        </>
                      )}
                </CustomizableLabel>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg text-xs text-slate-100 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <CustomizableButton
                buttonId="custom_layout_presets_modal_btn_22"
                type="button"
onClick={() => setEditingPreset(null)}
className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                  {() => (
                      <>
                        {uiText("components_custom_layout_presets_modal.button.cancel_2", "Cancel")}
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="custom_layout_presets_modal_btn_21"
                type="submit"
className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                  {() => (
                      <>
                        {uiText("components_custom_layout_presets_modal.button.save_changes", "Save Changes")}
                      </>
                    )}
              </CustomizableButton>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPresetId && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-5 h-5" />
              <CustomizableLabel
                labelId="custom_layout_presets_modal_item_20"
                as="h3"
                className="text-sm font-bold text-slate-100"
              >
                  {() => (
                      <>
                        {uiText("components_custom_layout_presets_modal.h3.delete_preset", "Delete Preset?")}
                      </>
                    )}
              </CustomizableLabel>
            </div>
            <p className="text-xs text-slate-300">
              {uiText("components_custom_layout_presets_modal.p.are_you_sure_you_want_to_delete_this_custom", "Are you sure you want to delete this custom preset? This action cannot be undone.")}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <CustomizableButton
                buttonId="custom_layout_presets_modal_btn_19"
                type="button"
onClick={() => setDeletingPresetId(null)}
className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                  {() => (
                      <>
                        {uiText("components_custom_layout_presets_modal.button.cancel_3", "Cancel")}
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="custom_layout_presets_modal_btn_18"
                type="button"
onClick={handleConfirmDelete}
className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                  {() => (
                      <>
                        {uiText("components_custom_layout_presets_modal.button.delete_preset", "Delete Preset")}
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// PRESET SVG THUMBNAIL GENERATOR
// ==========================================
interface PresetThumbnailProps {
  preset: CustomLayoutPreset;
  width?: number;
  height?: number;
  className?: string;
}

export const PresetThumbnail: React.FC<PresetThumbnailProps> = ({
  preset,
  width = 160,
  height = 100,
  className,
}) => {
  const { numRows, numCols, rowRatios, colRatios, carverSkew } = preset;

  // Compute effective lines
  const effectiveColRatios = useMemo(() => {
    if (colRatios && colRatios.length > 0) return colRatios;
    return Array.from({ length: Math.max(0, numCols - 1) }, (_, i) => (i + 1) / numCols);
  }, [colRatios, numCols]);

  const effectiveRowRatios = useMemo(() => {
    if (rowRatios && rowRatios.length > 0) return rowRatios;
    return Array.from({ length: Math.max(0, numRows - 1) }, (_, i) => (i + 1) / numRows);
  }, [rowRatios, numRows]);

  const lineColor = preset.styleSettings?.sliceLineColor || "#10b981";
  const strokeWidth = 1.5;
  const padding = 6;
  const w = width - padding * 2;
  const h = height - padding * 2;

  // Calculate skew offset for slash cut
  const skewRad = ((carverSkew || 0) * Math.PI) / 180;
  const skewOffset = Math.tan(skewRad) * (h / 2);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("bg-slate-950/70 rounded-lg overflow-hidden border border-slate-800/80 shadow-inner", className)}
    >
      <defs>
        <pattern id={`grid-bg-${preset.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.5" fill="#334155" opacity="0.3" />
        </pattern>
      </defs>

      {/* Canvas background area */}
      <rect
        x={padding}
        y={padding}
        width={w}
        height={h}
        rx={3}
        fill="#0f172a"
        stroke="#1e293b"
        strokeWidth={1}
      />
      <rect
        x={padding}
        y={padding}
        width={w}
        height={h}
        fill={`url(#grid-bg-${preset.id})`}
      />

      {/* Vertical Cut Lines */}
      {effectiveColRatios.map((ratio, idx) => {
        const xBase = padding + ratio * w;
        const x1 = Math.max(padding, Math.min(padding + w, xBase - skewOffset));
        const x2 = Math.max(padding, Math.min(padding + w, xBase + skewOffset));
        return (
          <line
            key={`v_${idx}`}
            x1={x1}
            y1={padding}
            x2={x2}
            y2={padding + h}
            stroke={lineColor}
            strokeWidth={strokeWidth}
            strokeDasharray={preset.styleSettings?.sliceLineStyle === "dashed" ? "3 2" : undefined}
          />
        );
      })}

      {/* Horizontal Cut Lines */}
      {effectiveRowRatios.map((ratio, idx) => {
        const y = padding + ratio * h;
        return (
          <line
            key={`h_${idx}`}
            x1={padding}
            y1={y}
            x2={padding + w}
            y2={y}
            stroke={lineColor}
            strokeWidth={strokeWidth}
            strokeDasharray={preset.styleSettings?.sliceLineStyle === "dashed" ? "3 2" : undefined}
          />
        );
      })}

      {/* Cell Count pill watermark */}
      <text
        x={width - padding - 4}
        y={height - padding - 4}
        textAnchor="end"
        fill="#64748b"
        fontSize="8"
        fontFamily="monospace"
        fontWeight="bold"
      >
        {numRows * numCols}{uiText("components_custom_layout_presets_modal.text.p", "P")}
      </text>
    </svg>
  );
};

// ==========================================
// PRESET CARD COMPONENT
// ==========================================
interface PresetCardProps {
  preset: CustomLayoutPreset;
  currentGrid: CurrentGridSnapshot;
  onApply: (applyStyle: boolean) => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onStartEdit: (e: React.MouseEvent) => void;
  onUpdateWithCurrent: () => void;
  onDelete: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  onApply,
  onToggleFavorite,
  onDuplicate,
  onStartEdit,
  onUpdateWithCurrent,
  onDelete,
}) => {
  const [showApplyOptions, setShowApplyOptions] = useState<boolean>(false);

  return (
    <div className="bg-[#0f172a] hover:bg-[#131d35] border border-slate-800 hover:border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-all group shadow-sm">
      {/* Top Card Info */}
      <div className="space-y-2.5">
        {/* Thumbnail Preview */}
        <div className="relative flex justify-center">
          <PresetThumbnail preset={preset} width={240} height={110} className="w-full h-28" />

          {/* Favorite Toggle Button */}
          <CustomizableButton
            buttonId="custom_layout_presets_modal_btn_17"
            defaultIcon={<Star
              className={cn("w-3.5 h-3.5", preset.isFavorite && "fill-amber-400")}
            />}
            type="button"
onClick={onToggleFavorite}
className={cn(
              "absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition-all cursor-pointer",
              preset.isFavorite
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-slate-900/60 text-slate-400 hover:text-amber-400 border border-slate-800"
            )}
title={preset.isFavorite ? "Unfavorite" : "Favorite"}
          />

          {/* Built-in / Custom tag */}
          <div className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-300">
            {preset.isBuiltIn ? "Template" : "Custom"}
          </div>
        </div>

        {/* Title & Metadata */}
        <div>
          <div className="flex items-start justify-between gap-1">
            <CustomizableLabel
              labelId="custom_layout_presets_modal_item_16"
              as="h4"
              className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1"
            >
                {() => (
                    <>
                      {preset.name}
                    </>
                  )}
            </CustomizableLabel>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 font-mono">
            <span className="text-emerald-400 font-bold">{preset.numRows}×{preset.numCols}</span>
            <span>·</span>
            <span>{preset.numRows * preset.numCols}{uiText("components_custom_layout_presets_modal.span.panels_2", " panels")}</span>
            {preset.carverSkew !== 0 && (
              <>
                <span>·</span>
                <span className="text-rose-400">{preset.carverSkew}{uiText("components_custom_layout_presets_modal.span.skew_2", "° skew")}</span>
              </>
            )}
            <span>·</span>
            <span className="text-slate-500">{preset.category}</span>
          </div>

          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {preset.description || "Parametric grid cuts for canvas carving."}
          </p>
        </div>
      </div>

      {/* Card Actions */}
      <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-2">
        {/* Custom Actions (Edit / Update / Delete) */}
        <div className="flex items-center gap-1">
          <CustomizableButton
            buttonId="custom_layout_presets_modal_btn_15"
            defaultIcon={<Copy className="w-3.5 h-3.5" />}
            type="button"
onClick={onDuplicate}
className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
title={uiText("components_custom_layout_presets_modal.button.duplicate_as_editable_custom_preset.title", "Duplicate as editable custom preset")}
          />

          {!preset.isBuiltIn ? (
            <>
              <CustomizableButton
                buttonId="custom_layout_presets_modal_btn_14"
                defaultIcon={<Edit2 className="w-3.5 h-3.5" />}
                type="button"
onClick={onStartEdit}
className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
title={uiText("components_custom_layout_presets_modal.button.edit_name_and_notes.title", "Edit name and notes")}
              />
              <CustomizableButton
                buttonId="custom_layout_presets_modal_btn_13"
                defaultIcon={<Bookmark className="w-3.5 h-3.5" />}
                type="button"
onClick={onUpdateWithCurrent}
className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
title={uiText("components_custom_layout_presets_modal.button.overwrite_with_active_canvas_grid_cuts.title", "Overwrite with active canvas grid cuts")}
              />
              <CustomizableButton
                buttonId="custom_layout_presets_modal_btn_12"
                defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                type="button"
onClick={onDelete}
className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
title={uiText("components_custom_layout_presets_modal.button.delete_custom_preset.title", "Delete custom preset")}
              />
            </>
          ) : null}
        </div>

        {/* Primary Load Button */}
        <div className="relative">
          <div className="flex items-center rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm overflow-hidden">
            <CustomizableButton
              buttonId="custom_layout_presets_modal_btn_11"
              defaultIcon={<Check className="w-3.5 h-3.5" />}
              type="button"
onClick={() => onApply(true)}
className="px-3 py-1 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
title={uiText("components_custom_layout_presets_modal.button.apply_layout_cuts_and_line_styles_to_canvas.title", "Apply layout cuts and line styles to canvas")}
            >
                {() => (
                    <>
                      <span>{uiText("components_custom_layout_presets_modal.span.load_preset", "Load Preset")}</span>
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="custom_layout_presets_modal_btn_10"
              defaultIcon={<ChevronDown className="w-3 h-3" />}
              type="button"
onClick={() => setShowApplyOptions(!showApplyOptions)}
className="px-1.5 py-1 border-l border-emerald-700/60 hover:bg-emerald-700 transition-colors cursor-pointer"
title={uiText("components_custom_layout_presets_modal.button.more_loading_options.title", "More loading options")}
            />
          </div>

          {showApplyOptions && (
            <div className="absolute right-0 bottom-full mb-1.5 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-1 z-20 space-y-1">
              <CustomizableButton
                buttonId="custom_layout_presets_modal_btn_9"
                defaultIcon={<Check className="w-3.5 h-3.5 text-emerald-400" />}
                type="button"
onClick={() => {
                  setShowApplyOptions(false);
                  onApply(true);
                }}
className="w-full px-2 py-1.5 text-left text-xs text-slate-200 hover:bg-emerald-950/60 hover:text-emerald-300 rounded font-medium flex items-center gap-2 cursor-pointer"
              >
                  {() => (
                      <>
                        <span>{uiText("components_custom_layout_presets_modal.span.apply_grid_line_styles", "Apply Grid + Line Styles")}</span>
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="custom_layout_presets_modal_btn_8"
                defaultIcon={<ArrowRight className="w-3.5 h-3.5 text-slate-400" />}
                type="button"
onClick={() => {
                  setShowApplyOptions(false);
                  onApply(false);
                }}
className="w-full px-2 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 rounded font-medium flex items-center gap-2 cursor-pointer"
              >
                  {() => (
                      <>
                        <span>{uiText("components_custom_layout_presets_modal.span.apply_grid_cuts_only", "Apply Grid Cuts Only")}</span>
                      </>
                    )}
              </CustomizableButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// PRESET COMPACT ROW ITEM
// ==========================================
interface PresetRowItemProps {
  preset: CustomLayoutPreset;
  currentGrid: CurrentGridSnapshot;
  onApply: (applyStyle: boolean) => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onStartEdit: (e: React.MouseEvent) => void;
  onUpdateWithCurrent: () => void;
  onDelete: () => void;
}

const PresetRowItem: React.FC<PresetRowItemProps> = ({
  preset,
  onApply,
  onToggleFavorite,
  onDuplicate,
  onStartEdit,
  onUpdateWithCurrent,
  onDelete,
}) => {
  return (
    <div className="bg-[#0f172a] hover:bg-[#131d35] border border-slate-800 hover:border-slate-700/80 rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 transition-all group">
      <div className="flex items-center gap-3 min-w-0">
        <PresetThumbnail preset={preset} width={75} height={48} className="shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CustomizableLabel
              labelId="custom_layout_presets_modal_item_7"
              as="h4"
              className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition-colors truncate"
            >
                {() => (
                    <>
                      {preset.name}
                    </>
                  )}
            </CustomizableLabel>
            <span className="text-[10px] text-slate-500 font-mono">
              {preset.numRows}×{preset.numCols} ({preset.numRows * preset.numCols}{uiText("components_custom_layout_presets_modal.span.p", "p)")}
            </span>
            {preset.isBuiltIn && (
              <span className="text-[9px] text-slate-400 font-semibold px-1 rounded bg-slate-900 border border-slate-800">
                {uiText("components_custom_layout_presets_modal.span.template", "Template")}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate max-w-lg">
            {preset.description || `${preset.category} layout grid`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <CustomizableButton
          buttonId="custom_layout_presets_modal_btn_6"
          defaultIcon={<Star className={cn("w-4 h-4", preset.isFavorite && "fill-amber-400")} />}
          type="button"
onClick={onToggleFavorite}
className={cn(
            "p-1.5 rounded-lg transition-colors cursor-pointer",
            preset.isFavorite
              ? "text-amber-400 hover:bg-slate-800"
              : "text-slate-500 hover:text-amber-400 hover:bg-slate-800"
          )}
title={preset.isFavorite ? "Unfavorite" : "Favorite"}
        />

        <CustomizableButton
          buttonId="custom_layout_presets_modal_btn_5"
          defaultIcon={<Copy className="w-3.5 h-3.5" />}
          type="button"
onClick={onDuplicate}
className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
title={uiText("components_custom_layout_presets_modal.button.duplicate_as_editable_custom_preset.title_2", "Duplicate as editable custom preset")}
        />

        {!preset.isBuiltIn && (
          <>
            <CustomizableButton
              buttonId="custom_layout_presets_modal_btn_4"
              defaultIcon={<Edit2 className="w-3.5 h-3.5" />}
              type="button"
onClick={onStartEdit}
className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
title={uiText("components_custom_layout_presets_modal.button.edit_name_and_notes.title_2", "Edit name and notes")}
            />
            <CustomizableButton
              buttonId="custom_layout_presets_modal_btn_3"
              defaultIcon={<Bookmark className="w-3.5 h-3.5" />}
              type="button"
onClick={onUpdateWithCurrent}
className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
title={uiText("components_custom_layout_presets_modal.button.overwrite_with_active_canvas_grid_cuts.title_2", "Overwrite with active canvas grid cuts")}
            />
            <CustomizableButton
              buttonId="custom_layout_presets_modal_btn_2"
              defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
              type="button"
onClick={onDelete}
className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
title={uiText("components_custom_layout_presets_modal.button.delete_custom_preset.title_2", "Delete custom preset")}
            />
          </>
        )}

        <CustomizableButton
          buttonId="custom_layout_presets_modal_btn_1"
          defaultIcon={<Check className="w-3.5 h-3.5" />}
          type="button"
onClick={() => onApply(true)}
className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ml-1"
        >
            {() => (
                <>
                  <span>{uiText("components_custom_layout_presets_modal.span.load", "Load")}</span>
                </>
              )}
        </CustomizableButton>
      </div>
    </div>
  );
};
