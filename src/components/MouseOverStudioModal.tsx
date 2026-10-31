import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  X,
  Search,
  MessageSquareCode,
  RotateCcw,
  Download,
  Upload,
  Check,
  Copy,
  Keyboard,
  Sparkles,
  HelpCircle,
  FileJson,
  Eye,
  Sliders,
  MousePointer,
  ShieldCheck,
  RefreshCw,
  Table,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";
import { useButtonCustomization } from "../context/ButtonCustomizationContext";
import {
  BUTTON_DEFINITIONS,
  ButtonCategory,
  SECTION_NAMES,
} from "../types/buttonCustomization";
import {
  HARDCODED_MOUSE_OVER_BASELINE,
  getHardcodedMouseOverList,
  exportMouseOverDialogsToJson,
  MouseOverButtonEntry,
  ActionType,
} from "../types/hardcodedMouseOverSetup";
import { renderCustomIcon } from "../utils/customIconRegistry";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

interface MouseOverStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialButtonId?: string;
}

export const MouseOverStudioModal: React.FC<MouseOverStudioModalProps> = ({
  isOpen,
  onClose,
  initialButtonId,
}) => {
  const {
    customConfigs,
    updateButtonConfig,
    resetButtonConfig,
    saveCurrentAsDefault,
    restoreAllFromSavedSetup,
  } = useButtonCustomization();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "customized" | "default">("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [activeButtonId, setActiveButtonId] = useState<string>(
    initialButtonId || "header_studio_palette"
  );
  const [notification, setNotification] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [liveHoveredButtonId, setLiveHoveredButtonId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set active button if initialButtonId is passed
  useEffect(() => {
    if (initialButtonId) {
      setActiveButtonId(initialButtonId);
    }
  }, [initialButtonId]);

  // Generate complete list of buttons representing the current app state
  const allEntries: MouseOverButtonEntry[] = useMemo(() => {
    return getHardcodedMouseOverList(customConfigs);
  }, [customConfigs]);

  // Statistics
  const stats = useMemo(() => {
    const total = allEntries.length;
    const customized = allEntries.filter((e) => e.isCustomized).length;
    const defaults = total - customized;
    return { total, customized, defaults };
  }, [allEntries]);

  // Filtered list based on search, category, and status
  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allEntries.filter((entry) => {
      // Category filter
      if (selectedCategory !== "all" && entry.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === "customized" && !entry.isCustomized) {
        return false;
      }
      if (statusFilter === "default" && entry.isCustomized) {
        return false;
      }

      // Search query
      if (query) {
        const matchId = entry.id.toLowerCase().includes(query);
        const matchLabel = entry.label.toLowerCase().includes(query);
        const matchTooltip = entry.currentTooltip.toLowerCase().includes(query);
        const matchCategory = entry.categoryName.toLowerCase().includes(query);
        const matchShortcut = entry.keyboardShortcut.toLowerCase().includes(query);
        const matchDesc = entry.detailedDescription.toLowerCase().includes(query);
        return (
          matchId ||
          matchLabel ||
          matchTooltip ||
          matchCategory ||
          matchShortcut ||
          matchDesc
        );
      }

      return true;
    });
  }, [allEntries, searchQuery, selectedCategory, statusFilter]);

  // Active selected entry for detailed inspector
  const activeEntry = useMemo(() => {
    return (
      allEntries.find((e) => e.id === activeButtonId) ||
      allEntries[0] ||
      null
    );
  }, [allEntries, activeButtonId]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Handlers for single button mouse-over tooltip
  const handleUpdateTooltip = (btnId: string, newTooltip: string) => {
    updateButtonConfig(btnId, { customTooltip: newTooltip });
  };

  const handleRevertSingle = (btnId: string) => {
    const baseline = HARDCODED_MOUSE_OVER_BASELINE[btnId];
    if (baseline) {
      updateButtonConfig(btnId, { customTooltip: baseline.defaultTooltip });
      showNotification(`Reverted ${btnId} to hardcoded baseline.`);
    }
  };

  // Batch action: Append Right-Click hint to all
  const handleAppendRightClickHintAll = () => {
    let count = 0;
    const hint = " (Right-click to customize)";
    allEntries.forEach((entry) => {
      if (!entry.currentTooltip.includes("(Right-click")) {
        updateButtonConfig(entry.id, {
          customTooltip: `${entry.currentTooltip.trim()}${hint}`,
        });
        count++;
      }
    });
    showNotification(`Appended right-click hints to ${count} button tooltips.`);
  };

  // Batch action: Clean tooltips (remove right-click hints for clean look)
  const handleCleanTooltipsAll = () => {
    let count = 0;
    allEntries.forEach((entry) => {
      if (entry.currentTooltip.includes("(Right-click")) {
        const cleaned = entry.currentTooltip
          .replace(/\s*\(Right-click to customize\)/gi, "")
          .trim();
        updateButtonConfig(entry.id, { customTooltip: cleaned });
        count++;
      }
    });
    showNotification(`Cleaned right-click hints from ${count} button tooltips.`);
  };

  // Batch action: Reset ALL to hardcoded baseline
  const handleResetAllToBaseline = () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all mouse-over dialogs to the hardcoded application baseline?"
      )
    ) {
      return;
    }
    allEntries.forEach((entry) => {
      const baseline = HARDCODED_MOUSE_OVER_BASELINE[entry.id];
      if (baseline) {
        updateButtonConfig(entry.id, { customTooltip: baseline.defaultTooltip });
      }
    });
    showNotification("All mouse-over dialogs reset to hardcoded baseline.");
  };

  // Save current setup as permanent default
  const handleSaveAsDefault = () => {
    saveCurrentAsDefault();
    showNotification("All mouse-over dialogs saved as permanent default!");
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonStr = exportMouseOverDialogsToJson(allEntries);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seqcarver_mouse_over_dialogs_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification("Exported mouse-over setup JSON successfully!");
  };

  // Import JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data && data.tooltips && typeof data.tooltips === "object") {
          let importedCount = 0;
          Object.entries(data.tooltips).forEach(([btnId, val]: [string, any]) => {
            const tip = typeof val === "string" ? val : val?.tooltip;
            if (tip) {
              updateButtonConfig(btnId, { customTooltip: tip });
              importedCount++;
            }
          });
          showNotification(`Imported ${importedCount} mouse-over tooltips from JSON!`);
        } else {
          showNotification("Invalid JSON format. Expected tooltips object.");
        }
      } catch (err: any) {
        showNotification(`Failed to parse JSON: ${err?.message || "Invalid file"}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Copy All Tooltips to clipboard
  const handleCopyAll = () => {
    const lines = allEntries.map(
      (e) => `[${e.id}] (${e.category}): "${e.currentTooltip}"`
    );
    navigator.clipboard.writeText(lines.join("\n"));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
    showNotification("Copied all button mouse-over tooltips to clipboard!");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-7xl h-[92vh] bg-[#030712] border border-violet-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* ================= MODAL HEADER ================= */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#030712] via-[#090d20] to-[#030712] border-b border-violet-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shadow-lg shadow-violet-500/10">
              <MessageSquareCode className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CustomizableLabel
                  labelId="mouse_over_studio_modal_item_28"
                  as="h2"
                  className="text-sm sm:text-base font-extrabold tracking-wide text-violet-300"
                >
                    {() => (
                        <>
                          {uiText("components_mouse_over_studio_modal.h2.mouse_over_dialog_studio", "Mouse Over Dialog Studio")}
                        </>
                      )}
                </CustomizableLabel>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                  {uiText("components_mouse_over_studio_modal.span.global_tooltips", "Global Tooltips")}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25">
                  {uiText("components_mouse_over_studio_modal.span.app_state_baseline", "App State Baseline")}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {uiText("components_mouse_over_studio_modal.p.edit_mouse_over_hover_dialogs_action_descrip", "Edit mouse-over hover dialogs, action descriptions & keyboard shortcuts for all buttons in the application.")}
              </p>
            </div>
          </div>

          {/* Right Header Stats & Close */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span className="text-slate-400">
                {uiText("components_mouse_over_studio_modal.span.total", "Total: ")}<strong className="text-slate-200">{stats.total}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-violet-400">
                {uiText("components_mouse_over_studio_modal.span.customized", "Customized: ")}<strong>{stats.customized}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400">
                {uiText("components_mouse_over_studio_modal.span.defaults", "Defaults: ")}<strong>{stats.defaults}</strong>
              </span>
            </div>

            <CustomizableButton
              buttonId="mouse_over_studio_modal_btn_27"
              defaultIcon={<X className="w-5 h-5" />}
              type="button"
onClick={onClose}
className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors cursor-pointer border border-transparent hover:border-slate-700"
title={uiText("components_mouse_over_studio_modal.button.close_mouse_over_studio_esc.title", "Close Mouse Over Studio (Esc)")}
            />
          </div>
        </div>

        {/* ================= ACTION & FILTER TOOLBAR ================= */}
        <div className="px-5 py-2.5 bg-[#070b19] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Search Input */}
          <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={uiText("components_mouse_over_studio_modal.input.search_buttons_by_label_id_tooltip_or_shortc.placeholder", "Search buttons by label, ID, tooltip or shortcut...")}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-400 transition-colors"
              />
              {searchQuery && (
                <CustomizableButton
                  buttonId="mouse_over_studio_modal_btn_26"
                  defaultIcon={<X className="w-3 h-3" />}
                  type="button"
onClick={() => setSearchQuery("")}
className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                />
              )}
            </div>
          </div>

          {/* Quick Preset Actions & JSON Tools */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <CustomizableButton
              buttonId="mouse_over_studio_modal_btn_25"
              defaultIcon={<Sliders className="w-3 h-3 text-violet-400" />}
              type="button"
onClick={handleAppendRightClickHintAll}
className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-violet-500/50 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
title={uiText("components_mouse_over_studio_modal.button.add_right_click_to_customize_to_all_tooltips.title", "Add '(Right-click to customize)' to all tooltips")}
            >
                {() => (
                    <>
                      <span>{uiText("components_mouse_over_studio_modal.span.right_click_hint", "+ Right-Click Hint")}</span>
                    </>
                  )}
            </CustomizableButton>

            <CustomizableButton
              buttonId="mouse_over_studio_modal_btn_24"
              defaultIcon={<Eye className="w-3 h-3 text-cyan-400" />}
              type="button"
onClick={handleCleanTooltipsAll}
className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-violet-500/50 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
title={uiText("components_mouse_over_studio_modal.button.remove_right_click_hint_for_clean_minimal_to.title", "Remove right-click hint for clean, minimal tooltips")}
            >
                {() => (
                    <>
                      <span>{uiText("components_mouse_over_studio_modal.span.clean_minimal", "Clean Minimal")}</span>
                    </>
                  )}
            </CustomizableButton>

            <CustomizableButton
              buttonId="mouse_over_studio_modal_btn_23"
              defaultIcon={<Copy className="w-3 h-3 text-amber-400" />}
              type="button"
onClick={handleCopyAll}
className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
title={uiText("components_mouse_over_studio_modal.button.copy_all_tooltips_to_clipboard.title", "Copy all tooltips to clipboard")}
            >
                {() => (
                    <>
                      <span>{isCopied ? "Copied!" : "Copy All"}</span>
                    </>
                  )}
            </CustomizableButton>

            <CustomizableButton
              buttonId="mouse_over_studio_modal_btn_22"
              defaultIcon={<Download className="w-3 h-3 text-emerald-400" />}
              type="button"
onClick={handleExportJson}
className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
title={uiText("components_mouse_over_studio_modal.button.export_all_mouse_over_tooltips_to_json.title", "Export all mouse-over tooltips to JSON")}
            >
                {() => (
                    <>
                      <span className="hidden sm:inline">{uiText("components_mouse_over_studio_modal.span.export_json", "Export JSON")}</span>
                    </>
                  )}
            </CustomizableButton>

            <CustomizableLabel
              labelId="mouse_over_studio_modal_item_21"
              defaultIcon={<Upload className="w-3 h-3 text-purple-400" />}
              as="label"
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
title={uiText("components_mouse_over_studio_modal.label.import_mouse_over_tooltips_from_json.title", "Import mouse-over tooltips from JSON")}
            >
                {() => (
                    <>
                      <span className="hidden sm:inline">{uiText("components_mouse_over_studio_modal.span.import_json", "Import JSON")}</span>
                    <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
                    </>
                  )}
            </CustomizableLabel>

            <CustomizableButton
              buttonId="mouse_over_studio_modal_btn_20"
              defaultIcon={<RotateCcw className="w-3 h-3 text-rose-400" />}
              type="button"
onClick={handleResetAllToBaseline}
className="px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
title={uiText("components_mouse_over_studio_modal.button.reset_all_buttons_to_the_hardcoded_baseline.title", "Reset all buttons to the hardcoded baseline")}
            >
                {() => (
                    <>
                      <span>{uiText("components_mouse_over_studio_modal.span.reset_baseline", "Reset Baseline")}</span>
                    </>
                  )}
            </CustomizableButton>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 ml-1">
              <CustomizableButton
                buttonId="mouse_over_studio_modal_btn_19"
                defaultIcon={<Layers className="w-3.5 h-3.5" />}
                type="button"
onClick={() => setViewMode("cards")}
className={cn(
                  "p-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                  viewMode === "cards"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
title={uiText("components_mouse_over_studio_modal.button.cards_view.title", "Cards View")}
              />
              <CustomizableButton
                buttonId="mouse_over_studio_modal_btn_18"
                defaultIcon={<Table className="w-3.5 h-3.5" />}
                type="button"
onClick={() => setViewMode("table")}
className={cn(
                  "p-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                  viewMode === "table"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
title={uiText("components_mouse_over_studio_modal.button.spreadsheet_table_view.title", "Spreadsheet Table View")}
              />
            </div>
          </div>
        </div>

        {/* ================= CATEGORY TABS & STATUS PILLS ================= */}
        <div className="px-5 py-2 bg-[#020617] border-b border-slate-800/80 flex items-center justify-between gap-3 overflow-x-auto shrink-0 no-scrollbar">
          {/* Category Tabs */}
          <div className="flex items-center gap-1">
            <CustomizableButton
              buttonId="mouse_over_studio_modal_btn_17"
              defaultLabel={")"}
              type="button"
onClick={() => setSelectedCategory("all")}
className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap border",
                selectedCategory === "all"
                  ? "bg-violet-500/25 text-violet-200 border-violet-500/50 shadow-sm"
                  : "bg-slate-900/60 text-slate-400 border-transparent hover:text-slate-200"
              )}
            >
                {(ibcProps) => (
                    <>
                      {uiText("components_mouse_over_studio_modal.button.all_categories", "All Categories (")}
                    {allEntries.length}
                    {!ibcProps.isTextHidden ? ibcProps.label : null}
                    </>
                  )}
            </CustomizableButton>

            {Object.entries(SECTION_NAMES).map(([catKey, sec]) => {
              const count = allEntries.filter((e) => e.category === catKey).length;
              return (
                <CustomizableButton
                  buttonId="mouse_over_studio_modal_btn_16"
                  key={catKey}
type="button"
onClick={() => setSelectedCategory(catKey)}
className={cn(
                    "px-2 py-1 rounded-lg text-[10.5px] font-medium transition-all cursor-pointer whitespace-nowrap border flex items-center gap-1",
                    selectedCategory === catKey
                      ? "bg-violet-500/20 text-violet-300 border-violet-500/40 font-bold"
                      : "bg-slate-900/40 text-slate-400 border-transparent hover:text-slate-200"
                  )}
                >
                    {() => (
                        <>
                          <span>{sec.name}</span>
                        <span className="text-[9px] font-mono opacity-60">({count})</span>
                        </>
                      )}
                </CustomizableButton>
              );
            })}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 shrink-0">
            <CustomizableButton
              buttonId="mouse_over_studio_modal_btn_15"
              defaultLabel={")"}
              type="button"
onClick={() => setStatusFilter("all")}
className={cn(
                "px-2 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer border",
                statusFilter === "all"
                  ? "bg-slate-800 text-slate-200 border-slate-600"
                  : "text-slate-500 border-transparent hover:text-slate-400"
              )}
            >
                {(ibcProps) => (
                    <>
                      {uiText("components_mouse_over_studio_modal.button.all", "All (")}
                    {filteredEntries.length}
                    {!ibcProps.isTextHidden ? ibcProps.label : null}
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="mouse_over_studio_modal_btn_14"
              defaultLabel={")"}
              type="button"
onClick={() => setStatusFilter("customized")}
className={cn(
                "px-2 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer border",
                statusFilter === "customized"
                  ? "bg-violet-500/20 text-violet-300 border-violet-500/40 font-bold"
                  : "text-slate-500 border-transparent hover:text-slate-400"
              )}
            >
                {(ibcProps) => (
                    <>
                      {uiText("components_mouse_over_studio_modal.button.customized", "Customized (")}
                    {stats.customized}
                    {!ibcProps.isTextHidden ? ibcProps.label : null}
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="mouse_over_studio_modal_btn_13"
              defaultLabel={")"}
              type="button"
onClick={() => setStatusFilter("default")}
className={cn(
                "px-2 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer border",
                statusFilter === "default"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
                  : "text-slate-500 border-transparent hover:text-slate-400"
              )}
            >
                {(ibcProps) => (
                    <>
                      {uiText("components_mouse_over_studio_modal.button.defaults", "Defaults (")}
                    {stats.defaults}
                    {!ibcProps.isTextHidden ? ibcProps.label : null}
                    </>
                  )}
            </CustomizableButton>
          </div>
        </div>

        {/* ================= NOTIFICATION BANNER ================= */}
        {notification && (
          <div className="px-5 py-2 bg-gradient-to-r from-violet-950 via-indigo-950 to-violet-950 border-b border-violet-500/40 text-violet-200 text-xs font-semibold flex items-center justify-between animate-fadeIn shrink-0">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              {notification}
            </span>
            <CustomizableButton
              buttonId="mouse_over_studio_modal_btn_12"
              defaultIcon={<X className="w-3.5 h-3.5" />}
              type="button"
onClick={() => setNotification(null)}
className="text-violet-400 hover:text-white"
            />
          </div>
        )}

        {/* ================= MAIN CONTENT SPLIT VIEW ================= */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden bg-[#030712]">
          {/* LEFT: Button List (8 cols or 7 cols) */}
          <div className="col-span-12 lg:col-span-8 flex flex-col border-r border-slate-800/80 overflow-hidden">
            {/* List Header */}
            <div className="px-4 py-2 bg-[#060a18] border-b border-slate-800/70 flex items-center justify-between text-xs text-slate-400 font-semibold shrink-0">
              <span className="flex items-center gap-1.5">
                <MousePointer className="w-3.5 h-3.5 text-violet-400" />
                {uiText("components_mouse_over_studio_modal.span.showing", "Showing ")}{filteredEntries.length}{uiText("components_mouse_over_studio_modal.span.buttons", " buttons")}
                {selectedCategory !== "all" && (
                  <span className="text-violet-300">
                    {uiText("components_mouse_over_studio_modal.span.in", "in ")}{SECTION_NAMES[selectedCategory as ButtonCategory]?.name || selectedCategory}
                  </span>
                )}
              </span>
              <span className="text-[11px] text-slate-500">
                {uiText("components_mouse_over_studio_modal.span.click_any_row_or_edit_directly_in_the_input", "Click any row or edit directly in the input box")}
              </span>
            </div>

            {/* List Items Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredEntries.length === 0 ? (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold">{uiText("components_mouse_over_studio_modal.p.no_buttons_found_matching_criteria", "No buttons found matching criteria.")}</p>
                  <p className="text-xs text-slate-600">
                    {uiText("components_mouse_over_studio_modal.p.try_adjusting_your_search_terms_or_selecting", "Try adjusting your search terms or selecting \"All Categories\".")}
                  </p>
                </div>
              ) : viewMode === "cards" ? (
                // ================= CARD VIEW =================
                filteredEntries.map((entry) => {
                  const isSelected = entry.id === activeButtonId;
                  const config = customConfigs[entry.id];

                  return (
                    <div
                      key={entry.id}
                      onClick={() => setActiveButtonId(entry.id)}
                      onMouseEnter={() => setLiveHoveredButtonId(entry.id)}
                      onMouseLeave={() => setLiveHoveredButtonId(null)}
                      className={cn(
                        "p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                        isSelected
                          ? "bg-violet-950/30 border-violet-500/60 shadow-lg shadow-violet-500/5 ring-1 ring-violet-500/30"
                          : "bg-slate-900/40 border-slate-800/70 hover:border-slate-700 hover:bg-slate-900/80"
                      )}
                    >
                      {/* Left: Button Preview & Identifiers */}
                      <div className="flex items-center gap-3 min-w-[210px] shrink-0">
                        {/* Live Button Look */}
                        <div
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 text-xs font-bold text-slate-200 select-none shadow-sm"
                          title={entry.currentTooltip}
                        >
                          {renderCustomIcon(
                            config,
                            <Sparkles className="w-3.5 h-3.5 text-violet-400" />,
                            "w-3.5 h-3.5"
                          )}
                          <span className="truncate max-w-[110px]">{entry.label}</span>
                        </div>

                        {/* ID & Category */}
                        <div className="flex flex-col">
                          <span className="font-mono text-[10.5px] text-slate-300 font-semibold">
                            {entry.id}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9.5px] text-violet-400 font-medium">
                              {entry.categoryName}
                            </span>
                            {entry.isCustomized && (
                              <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold">
                                {uiText("components_mouse_over_studio_modal.span.customized_2", "Customized")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Live Editable Mouse-Over Dialog Input */}
                      <div className="flex-1 min-w-[260px]">
                        <div className="relative">
                          <input
                            type="text"
                            value={entry.currentTooltip}
                            onChange={(e) => handleUpdateTooltip(entry.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={entry.defaultTooltip}
                            className={cn(
                              "w-full px-3 py-1.5 rounded-lg text-xs font-medium focus:outline-none transition-all border",
                              entry.isCustomized
                                ? "bg-slate-950 border-violet-500/50 text-violet-200 focus:border-violet-400"
                                : "bg-slate-950/70 border-slate-800 text-slate-300 focus:border-slate-600"
                            )}
                            title={`Edit mouse-over dialog for ${entry.label}`}
                          />
                        </div>
                      </div>

                      {/* Right: Quick Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {entry.isCustomized && (
                          <CustomizableButton
                            buttonId="mouse_over_studio_modal_btn_11"
                            defaultIcon={<RotateCcw className="w-3.5 h-3.5" />}
                            type="button"
onClick={(e) => {
                              e.stopPropagation();
                              handleRevertSingle(entry.id);
                            }}
className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-700"
title={uiText("components_mouse_over_studio_modal.button.reset_this_button_to_hardcoded_baseline.title", "Reset this button to hardcoded baseline")}
                          />
                        )}

                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-mono border",
                            entry.actionType === "Transform"
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                              : entry.actionType === "Navigation"
                              ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                              : entry.actionType === "Export"
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                              : entry.actionType === "Delete / Reset"
                              ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          )}
                        >
                          {entry.actionType}
                        </span>

                        <ChevronRight
                          className={cn(
                            "w-4 h-4 transition-transform",
                            isSelected ? "text-violet-400 translate-x-0.5" : "text-slate-600"
                          )}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                // ================= TABLE VIEW =================
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">{uiText("components_mouse_over_studio_modal.th.button_id", "Button / ID")}</th>
                        <th className="py-2.5 px-3">{uiText("components_mouse_over_studio_modal.th.category", "Category")}</th>
                        <th className="py-2.5 px-3">{uiText("components_mouse_over_studio_modal.th.mouse_over_dialog_editable", "Mouse Over Dialog (Editable)")}</th>
                        <th className="py-2.5 px-3">{uiText("components_mouse_over_studio_modal.th.action_type", "Action Type")}</th>
                        <th className="py-2.5 px-3 text-right">{uiText("components_mouse_over_studio_modal.th.reset", "Reset")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredEntries.map((entry) => {
                        const isSelected = entry.id === activeButtonId;
                        return (
                          <tr
                            key={entry.id}
                            onClick={() => setActiveButtonId(entry.id)}
                            className={cn(
                              "transition-colors cursor-pointer",
                              isSelected ? "bg-violet-950/40" : "hover:bg-slate-900/50"
                            )}
                          >
                            <td className="py-2 px-3 font-semibold text-slate-200">
                              <div className="flex items-center gap-1.5">
                                <span className="text-violet-400">{entry.label}</span>
                                <span className="font-mono text-[10px] text-slate-500">
                                  ({entry.id})
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-slate-400 text-[11px]">
                              {entry.categoryName}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={entry.currentTooltip}
                                onChange={(e) => handleUpdateTooltip(entry.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-slate-900 border border-slate-800 focus:border-violet-400 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                              />
                            </td>
                            <td className="py-2 px-3 text-slate-400 text-[10.5px]">
                              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                                {entry.actionType}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              {entry.isCustomized && (
                                <CustomizableButton
                                  buttonId="mouse_over_studio_modal_btn_10"
                                  type="button"
onClick={(e) => {
                                    e.stopPropagation();
                                    handleRevertSingle(entry.id);
                                  }}
className="text-xs text-rose-400 hover:text-rose-300 font-bold"
title={uiText("components_mouse_over_studio_modal.button.revert_to_baseline.title", "Revert to baseline")}
                                >
                                    {() => (
                                        <>
                                          {uiText("components_mouse_over_studio_modal.button.revert", "Revert")}
                                        </>
                                      )}
                                </CustomizableButton>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Live Interactive Mouse-Over Previewer & Detailed Inspector (4 cols) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col bg-[#05091a] overflow-hidden">
            {activeEntry ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* 1. Live Mouse-Over Interactive Tester */}
                <div className="p-4 bg-slate-950 border border-violet-500/30 rounded-2xl space-y-3 shadow-lg shadow-violet-500/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      {uiText("components_mouse_over_studio_modal.span.live_mouse_over_hover_tester", "Live Mouse-Over Hover Tester")}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {uiText("components_mouse_over_studio_modal.span.real_time", "Real-Time")}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    {uiText("components_mouse_over_studio_modal.p.hover_your_mouse_directly_over_the_simulated", "Hover your mouse directly over the simulated button below to test its live dialog popup:")}
                  </p>

                  {/* Simulated Button Test Area */}
                  <div className="p-6 rounded-xl bg-[#030712] border border-slate-800/80 flex flex-col items-center justify-center gap-3">
                    <div
                      className="group relative cursor-pointer"
                      title={activeEntry.currentTooltip}
                    >
                      <CustomizableButton
                        buttonId="mouse_over_studio_modal_btn_9"
                        type="button"
className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-500/20 border border-violet-400/40 flex items-center gap-2 transition-all group-hover:scale-105"
                      >
                          {() => (
                              <>
                                {renderCustomIcon(
                          customConfigs[activeEntry.id],
                          <Sparkles className="w-4 h-4 text-white" />,
                          "w-4 h-4"
                        )}
                              <span>{activeEntry.label}</span>
                              </>
                            )}
                      </CustomizableButton>

                      {/* Rich Floating Tooltip Simulation on Hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col w-64 p-3 bg-slate-950/95 border border-violet-500/50 rounded-xl shadow-2xl z-50 pointer-events-none animate-fadeIn">
                        <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800">
                          <span className="text-xs font-bold text-violet-300 truncate">
                            {activeEntry.label}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300">
                            {activeEntry.actionType}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-slate-200 font-medium leading-relaxed">
                          {activeEntry.currentTooltip}
                        </p>
                        {activeEntry.keyboardShortcut && (
                          <div className="mt-2 pt-1 border-t border-slate-800 flex items-center justify-between text-[9.5px] text-slate-400">
                            <span className="flex items-center gap-1 font-mono">
                              <Keyboard className="w-3 h-3 text-cyan-400" />
                              {activeEntry.keyboardShortcut}
                            </span>
                            <span className="text-violet-400">{uiText("components_mouse_over_studio_modal.span.hover_active", "Hover Active")}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono text-center">
                      {uiText("components_mouse_over_studio_modal.span.simulating_customizablebutton_buttonid", "Simulating <CustomizableButton buttonId=\"")}{activeEntry.id}{uiText("components_mouse_over_studio_modal.span.x", "\" />")}
                    </span>
                  </div>
                </div>

                {/* 2. Detailed Editor for Selected Button */}
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-violet-400" />
                      {uiText("components_mouse_over_studio_modal.span.detailed_tooltip_dialog_editor", "Detailed Tooltip Dialog Editor")}
                    </span>
                    <CustomizableButton
                      buttonId="mouse_over_studio_modal_btn_8"
                      defaultIcon={<RotateCcw className="w-3 h-3" />}
                      type="button"
onClick={() => handleRevertSingle(activeEntry.id)}
className="text-[11px] text-slate-400 hover:text-rose-300 flex items-center gap-1 font-semibold cursor-pointer"
title={uiText("components_mouse_over_studio_modal.button.reset_this_button_to_baseline.title", "Reset this button to baseline")}
                    >
                        {() => (
                            <>
                              <span>{uiText("components_mouse_over_studio_modal.span.revert_baseline", "Revert Baseline")}</span>
                            </>
                          )}
                    </CustomizableButton>
                  </div>

                  {/* Button Target Info */}
                  <div className="text-xs space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{uiText("components_mouse_over_studio_modal.span.target_id", "Target ID:")}</span>
                      <span className="text-violet-300 font-bold">{activeEntry.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{uiText("components_mouse_over_studio_modal.span.category", "Category:")}</span>
                      <span className="text-slate-300">{activeEntry.categoryName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{uiText("components_mouse_over_studio_modal.span.current_label", "Current Label:")}</span>
                      <span className="text-emerald-400 font-bold">{activeEntry.label}</span>
                    </div>
                  </div>

                  {/* Multi-line Mouse-Over Textarea */}
                  <div className="space-y-1.5">
                    <CustomizableLabel
                      labelId="mouse_over_studio_modal_item_7"
                      as="label"
                      className="text-[11px] font-semibold text-slate-300 flex items-center justify-between"
                    >
                        {() => (
                            <>
                              <span>{uiText("components_mouse_over_studio_modal.span.mouse_over_dialog_text", "Mouse Over Dialog Text:")}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                        {activeEntry.currentTooltip.length}{uiText("components_mouse_over_studio_modal.span.chars", " chars")}
                      </span>
                            </>
                          )}
                    </CustomizableLabel>
                    <textarea
                      rows={3}
                      value={activeEntry.currentTooltip}
                      onChange={(e) => handleUpdateTooltip(activeEntry.id, e.target.value)}
                      placeholder={activeEntry.defaultTooltip}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-400 font-medium leading-relaxed resize-none"
                    />
                  </div>

                  {/* Hardcoded Baseline Reference */}
                  <div className="space-y-1 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {uiText("components_mouse_over_studio_modal.span.hardcoded_application_baseline", "Hardcoded Application Baseline:")}
                    </span>
                    <p className="text-[11px] text-slate-400 italic">
                      "{activeEntry.defaultTooltip}"
                    </p>
                  </div>

                  {/* Quick Preset Builders */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {uiText("components_mouse_over_studio_modal.span.quick_preset_text_modifiers", "Quick Preset Text Modifiers:")}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <CustomizableButton
                        buttonId="mouse_over_studio_modal_btn_6"
                        type="button"
onClick={() =>
                          handleUpdateTooltip(
                            activeEntry.id,
                            `${activeEntry.defaultTooltip} (Right-click to customize)`
                          )
                        }
className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10.5px] font-medium text-slate-300 border border-slate-800 text-left truncate"
title={uiText("components_mouse_over_studio_modal.button.add_customize_hint.title", "Add customize hint")}
                      >
                          {() => (
                              <>
                                {uiText("components_mouse_over_studio_modal.button.right_click_hint", "+ Right-Click Hint")}
                              </>
                            )}
                      </CustomizableButton>
                      <CustomizableButton
                        buttonId="mouse_over_studio_modal_btn_5"
                        type="button"
onClick={() =>
                          handleUpdateTooltip(
                            activeEntry.id,
                            activeEntry.currentTooltip.replace(/\s*\(Right-click to customize\)/gi, "")
                          )
                        }
className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10.5px] font-medium text-slate-300 border border-slate-800 text-left truncate"
title={uiText("components_mouse_over_studio_modal.button.remove_hint.title", "Remove hint")}
                      >
                          {() => (
                              <>
                                {uiText("components_mouse_over_studio_modal.button.strip_hint", "- Strip Hint")}
                              </>
                            )}
                      </CustomizableButton>
                      <CustomizableButton
                        buttonId="mouse_over_studio_modal_btn_4"
                        type="button"
onClick={() =>
                          handleUpdateTooltip(
                            activeEntry.id,
                            `Click to ${activeEntry.label.toLowerCase()} in SeqCarver.`
                          )
                        }
className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10.5px] font-medium text-slate-300 border border-slate-800 text-left truncate"
                      >
                          {() => (
                              <>
                                {uiText("components_mouse_over_studio_modal.button.click_to_action", "\"Click to [Action]\"")}
                              </>
                            )}
                      </CustomizableButton>
                      <CustomizableButton
                        buttonId="mouse_over_studio_modal_btn_3"
                        type="button"
onClick={() =>
                          handleUpdateTooltip(
                            activeEntry.id,
                            `${activeEntry.label} • ${activeEntry.keyboardShortcut}`
                          )
                        }
className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10.5px] font-medium text-slate-300 border border-slate-800 text-left truncate"
                      >
                          {() => (
                              <>
                                {uiText("components_mouse_over_studio_modal.button.label_shortcut", "\"[Label] • Shortcut\"")}
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  </div>

                  {/* Keyboard Shortcut & Action Info */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
                        {uiText("components_mouse_over_studio_modal.span.keyboard_shortcut", "Keyboard Shortcut:")}
                      </span>
                      <span className="font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60">
                        {activeEntry.keyboardShortcut}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-violet-400" />
                        {uiText("components_mouse_over_studio_modal.span.action_category", "Action Category:")}
                      </span>
                      <span className="font-semibold text-slate-200">
                        {activeEntry.actionType}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-slate-500 text-xs">
                {uiText("components_mouse_over_studio_modal.div.select_a_button_from_the_list_to_inspect_and", "Select a button from the list to inspect and edit its mouse-over dialog.")}
              </div>
            )}
          </div>
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="px-5 py-3 bg-[#030712] border-t border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              <strong className="text-violet-300">{stats.customized}</strong>{uiText("components_mouse_over_studio_modal.span.buttons_customized_in_this_session", " buttons customized in this session.")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CustomizableButton
              buttonId="mouse_over_studio_modal_btn_2"
              defaultIcon={<ShieldCheck className="w-4 h-4 text-violet-400" />}
              type="button"
onClick={handleSaveAsDefault}
className="px-4 py-2 bg-violet-950 hover:bg-violet-900 text-violet-200 border border-violet-500/50 hover:border-violet-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
title={uiText("components_mouse_over_studio_modal.button.save_all_customized_mouse_over_dialogs_as_th.title", "Save all customized mouse-over dialogs as the permanent default")}
            >
                {() => (
                    <>
                      <span>{uiText("components_mouse_over_studio_modal.span.save_as_permanent_default", "Save as Permanent Default")}</span>
                    </>
                  )}
            </CustomizableButton>

            <CustomizableButton
              buttonId="mouse_over_studio_modal_btn_1"
              type="button"
onClick={onClose}
className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-violet-500/20"
            >
                {() => (
                    <>
                      {uiText("components_mouse_over_studio_modal.button.done", "Done")}
                    </>
                  )}
            </CustomizableButton>
          </div>
        </div>
      </div>
    </div>
  );
};
