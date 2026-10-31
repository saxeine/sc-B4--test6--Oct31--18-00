import React, { useState } from "react";
import {
  ArrowDownUp,
  Layers,
  Palette,
  Sparkles,
  Check,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Filter,
  Flame,
  Sun,
  Moon,
  Ratio,
} from "lucide-react";
import type {
  SortMode,
  GroupMode,
  SliceAssetMetadata,
} from "../utils/storyboardAssetSorter";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export interface StoryboardAssetSorterBarProps {
  totalSlicesCount: number;
  activeSortMode: SortMode;
  activeGroupMode: GroupMode;
  selectedGroupFilter: string | null;
  availableGroups: Array<{ id: string; title: string; count: number; badge?: string; colorSwatch?: string }>;
  isAnalyzing: boolean;
  autoSortOnImport: boolean;
  onSelectSortMode: (mode: SortMode) => void;
  onSelectGroupMode: (mode: GroupMode) => void;
  onSelectGroupFilter: (groupId: string | null) => void;
  onToggleAutoSortOnImport: (enabled: boolean) => void;
  onApplySortedOrderToPool: () => void;
  onResetOrder: () => void;
}

export const StoryboardAssetSorterBar: React.FC<StoryboardAssetSorterBarProps> = ({
  totalSlicesCount,
  activeSortMode,
  activeGroupMode,
  selectedGroupFilter,
  availableGroups,
  isAnalyzing,
  autoSortOnImport,
  onSelectSortMode,
  onSelectGroupMode,
  onSelectGroupFilter,
  onToggleAutoSortOnImport,
  onApplySortedOrderToPool,
  onResetOrder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"aspect" | "color">("aspect");

  const isSorted = activeSortMode !== "none" || activeGroupMode !== "none";

  const getSortDescription = (): string => {
    switch (activeSortMode) {
      case "aspect-shape":
        return "Aspect: Shape Clusters (Square, Landscape, Portrait)";
      case "aspect-wide-tall":
        return "Aspect: Wide to Tall (Descending Ratio)";
      case "aspect-tall-wide":
        return "Aspect: Tall to Wide (Ascending Ratio)";
      case "color-rainbow":
        return "Color: Rainbow Spectrum (Hue 0°–360°)";
      case "color-family":
        return "Color: Grouped by Color Family";
      case "color-warm-cool":
        return "Color: Warm to Cool Tones";
      case "color-light-dark":
        return "Color: High-Key to Dark (Luminance)";
      case "color-dark-light":
        return "Color: Dark to High-Key (Luminance)";
      default:
        return activeGroupMode === "aspect-category"
          ? "Grouped by Aspect Ratio"
          : activeGroupMode === "color-family"
          ? "Grouped by Color Family"
          : "Default Order";
    }
  };

  return (
    <div className="w-full space-y-1.5 text-xs select-none">
      {/* Trigger & Quick Status Bar */}
      <div className="flex items-center justify-between gap-1.5 bg-[#030914] border border-[#1e293b] p-1.5 rounded-xl shadow-sm">
        <CustomizableButton
          buttonId="storyboard_asset_sorter_bar_btn_19"
          type="button"
onClick={() => setIsOpen((prev) => !prev)}
className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer",
            isSorted
              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-sm"
              : "bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60"
          )}
title={uiText("components_storyboard_asset_sorter_bar.button.open_automated_sorting_and_grouping_tool_for.title", "Open automated sorting and grouping tool for Asset Organizer")}
        >
            {() => (
                <>
                  <ArrowDownUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[130px] sm:max-w-none">
            {isSorted ? "Auto-Sorted" : "Sort & Group"}
          </span>
                {isAnalyzing && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          )}
                <ChevronDown
            className={cn("w-3 h-3 text-slate-400 transition-transform", isOpen && "rotate-180")}
          />
                </>
              )}
        </CustomizableButton>

        <div className="flex items-center gap-1 min-w-0">
          {/* Quick Apply to Pool button when sorted */}
          {isSorted && (
            <CustomizableButton
              buttonId="storyboard_asset_sorter_bar_btn_18"
              defaultIcon={<Check className="w-3 h-3 text-cyan-400" />}
              type="button"
onClick={onApplySortedOrderToPool}
className="px-2 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
title={uiText("components_storyboard_asset_sorter_bar.button.apply_current_sorted_order_directly_into_the.title", "Apply current sorted order directly into the Storyboard Asset Pool")}
            >
                {() => (
                    <>
                      <span>{uiText("components_storyboard_asset_sorter_bar.span.apply_order", "Apply Order")}</span>
                    </>
                  )}
            </CustomizableButton>
          )}

          {isSorted && (
            <CustomizableButton
              buttonId="storyboard_asset_sorter_bar_btn_17"
              defaultIcon={<RotateCcw className="w-3 h-3" />}
              type="button"
onClick={onResetOrder}
className="p-1 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
title={uiText("components_storyboard_asset_sorter_bar.button.reset_sorting_to_original_order.title", "Reset sorting to original order")}
            />
          )}
        </div>
      </div>

      {/* Active Sort Description Label if sorted & panel is closed */}
      {!isOpen && isSorted && (
        <div className="flex items-center justify-between px-1 text-[9.5px] text-emerald-400/90 font-medium">
          <span className="truncate flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            {getSortDescription()}
          </span>
          {selectedGroupFilter && (
            <CustomizableButton
              buttonId="storyboard_asset_sorter_bar_btn_16"
              type="button"
onClick={() => onSelectGroupFilter(null)}
className="text-slate-400 hover:text-white underline cursor-pointer ml-1"
            >
                {() => (
                    <>
                      {uiText("components_storyboard_asset_sorter_bar.button.show_all", "Show all")}
                    </>
                  )}
            </CustomizableButton>
          )}
        </div>
      )}

      {/* Expanded Sorting Tool Control Panel */}
      {isOpen && (
        <div className="bg-[#050c1a] border border-[#1e293b] rounded-xl p-2.5 space-y-2.5 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-200 text-[11px]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span>{uiText("components_storyboard_asset_sorter_bar.span.asset_organizer_sorting_tool", "Asset Organizer Sorting Tool")}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {totalSlicesCount}{uiText("components_storyboard_asset_sorter_bar.span.slice", " slice")}{totalSlicesCount === 1 ? "" : "s"}
            </span>
          </div>

          {/* Primary Tabs: Aspect Ratio vs Dominant Color */}
          <div className="grid grid-cols-2 gap-1 bg-[#020617] p-1 rounded-lg border border-slate-800/80">
            <CustomizableButton
              buttonId="storyboard_asset_sorter_bar_btn_15"
              defaultIcon={<Ratio className="w-3.5 h-3.5" />}
              type="button"
onClick={() => setActiveTab("aspect")}
className={cn(
                "py-1 px-2 rounded-md font-bold text-[10.5px] transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                activeTab === "aspect"
                  ? "bg-cyan-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
                {() => (
                    <>
                      <span>{uiText("components_storyboard_asset_sorter_bar.span.aspect_ratio", "Aspect Ratio")}</span>
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="storyboard_asset_sorter_bar_btn_14"
              defaultIcon={<Palette className="w-3.5 h-3.5" />}
              type="button"
onClick={() => setActiveTab("color")}
className={cn(
                "py-1 px-2 rounded-md font-bold text-[10.5px] transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                activeTab === "color"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
                {() => (
                    <>
                      <span>{uiText("components_storyboard_asset_sorter_bar.span.dominant_color", "Dominant Color")}</span>
                    </>
                  )}
            </CustomizableButton>
          </div>

          {/* Aspect Ratio Options */}
          {activeTab === "aspect" && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-medium">{uiText("components_storyboard_asset_sorter_bar.span.sort_and_group_by_ratio", "Sort & Group by Ratio:")}</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                <CustomizableButton
                  buttonId="storyboard_asset_sorter_bar_btn_13"
                  type="button"
onClick={() => {
                    onSelectSortMode("aspect-shape");
                    onSelectGroupMode("aspect-category");
                  }}
className={cn(
                    "p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between",
                    activeSortMode === "aspect-shape"
                      ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/40"
                      : "bg-[#020617] border-slate-800 text-slate-300 hover:border-slate-700"
                  )}
title={uiText("components_storyboard_asset_sorter_bar.button.group_fragments_into_square_1_1_landscape_wi.title", "Group fragments into Square (1:1), Landscape (Wide), Portrait (Tall), Panoramic")}
                >
                    {() => (
                        <>
                          <span className="text-[10px] font-bold">{uiText("components_storyboard_asset_sorter_bar.span.group_by_shape", "Group by Shape")}</span>
                        <span className="text-[8.5px] text-slate-400">{uiText("components_storyboard_asset_sorter_bar.span.square_wide_tall", "Square, Wide, Tall")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="storyboard_asset_sorter_bar_btn_12"
                  type="button"
onClick={() => {
                    onSelectSortMode("aspect-wide-tall");
                    onSelectGroupMode("none");
                  }}
className={cn(
                    "p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between",
                    activeSortMode === "aspect-wide-tall"
                      ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/40"
                      : "bg-[#020617] border-slate-800 text-slate-300 hover:border-slate-700"
                  )}
title={uiText("components_storyboard_asset_sorter_bar.button.sort_from_widest_panoramic_frames_down_to_ta.title", "Sort from widest panoramic frames down to tallest vertical strips")}
                >
                    {() => (
                        <>
                          <span className="text-[10px] font-bold">{uiText("components_storyboard_asset_sorter_bar.span.wide_tall", "Wide → Tall")}</span>
                        <span className="text-[8.5px] text-slate-400">{uiText("components_storyboard_asset_sorter_bar.span.descending_ratio", "Descending Ratio")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="storyboard_asset_sorter_bar_btn_11"
                  type="button"
onClick={() => {
                    onSelectSortMode("aspect-tall-wide");
                    onSelectGroupMode("none");
                  }}
className={cn(
                    "p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between",
                    activeSortMode === "aspect-tall-wide"
                      ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/40"
                      : "bg-[#020617] border-slate-800 text-slate-300 hover:border-slate-700"
                  )}
title={uiText("components_storyboard_asset_sorter_bar.button.sort_from_tallest_vertical_frames_up_to_wide.title", "Sort from tallest vertical frames up to widest landscape frames")}
                >
                    {() => (
                        <>
                          <span className="text-[10px] font-bold">{uiText("components_storyboard_asset_sorter_bar.span.tall_wide", "Tall → Wide")}</span>
                        <span className="text-[8.5px] text-slate-400">{uiText("components_storyboard_asset_sorter_bar.span.ascending_ratio", "Ascending Ratio")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>
          )}

          {/* Dominant Color Options */}
          {activeTab === "color" && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-medium">{uiText("components_storyboard_asset_sorter_bar.span.sort_and_group_by_color", "Sort & Group by Color:")}</span>
              <div className="grid grid-cols-2 gap-1">
                <CustomizableButton
                  buttonId="storyboard_asset_sorter_bar_btn_10"
                  type="button"
onClick={() => {
                    onSelectSortMode("color-rainbow");
                    onSelectGroupMode("none");
                  }}
className={cn(
                    "p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between",
                    activeSortMode === "color-rainbow"
                      ? "bg-purple-950/80 border-purple-400 text-purple-200 ring-1 ring-purple-400/40"
                      : "bg-[#020617] border-slate-800 text-slate-300 hover:border-slate-700"
                  )}
title={uiText("components_storyboard_asset_sorter_bar.button.sort_along_the_chromatic_rainbow_spectrum_re.title", "Sort along the chromatic rainbow spectrum: Red, Orange, Yellow, Green, Cyan, Blue, Purple, Pink, then Neutrals")}
                >
                    {() => (
                        <>
                          <span className="text-[10px] font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
                    {uiText("components_storyboard_asset_sorter_bar.span.rainbow_spectrum", "Rainbow Spectrum")}
                  </span>
                        <span className="text-[8.5px] text-slate-400">{uiText("components_storyboard_asset_sorter_bar.span.hue_0_to_360_flow", "Hue 0° to 360° Flow")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="storyboard_asset_sorter_bar_btn_9"
                  type="button"
onClick={() => {
                    onSelectSortMode("color-family");
                    onSelectGroupMode("color-family");
                  }}
className={cn(
                    "p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between",
                    activeSortMode === "color-family" && activeGroupMode === "color-family"
                      ? "bg-purple-950/80 border-purple-400 text-purple-200 ring-1 ring-purple-400/40"
                      : "bg-[#020617] border-slate-800 text-slate-300 hover:border-slate-700"
                  )}
title={uiText("components_storyboard_asset_sorter_bar.button.group_frames_by_color_families_emerald_sky_b.title", "Group frames by color families (Emerald, Sky Blue, Coral, Amber, Charcoal)")}
                >
                    {() => (
                        <>
                          <span className="text-[10px] font-bold flex items-center gap-1">
                    <Layers className="w-3 h-3 text-purple-400" />
                    {uiText("components_storyboard_asset_sorter_bar.span.color_families", "Color Families")}
                  </span>
                        <span className="text-[8.5px] text-slate-400">{uiText("components_storyboard_asset_sorter_bar.span.clustered_sections", "Clustered Sections")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="storyboard_asset_sorter_bar_btn_8"
                  type="button"
onClick={() => {
                    onSelectSortMode("color-warm-cool");
                    onSelectGroupMode("color-temperature");
                  }}
className={cn(
                    "p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between",
                    activeSortMode === "color-warm-cool"
                      ? "bg-purple-950/80 border-purple-400 text-purple-200 ring-1 ring-purple-400/40"
                      : "bg-[#020617] border-slate-800 text-slate-300 hover:border-slate-700"
                  )}
title={uiText("components_storyboard_asset_sorter_bar.button.sort_warm_tones_first_reds_oranges_yellows_f.title", "Sort warm tones first (Reds, Oranges, Yellows) followed by cool tones (Greens, Teals, Blues)")}
                >
                    {() => (
                        <>
                          <span className="text-[10px] font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    {uiText("components_storyboard_asset_sorter_bar.span.warm_cool", "Warm → Cool")}
                  </span>
                        <span className="text-[8.5px] text-slate-400">{uiText("components_storyboard_asset_sorter_bar.span.temperature_clustering", "Temperature Clustering")}</span>
                        </>
                      )}
                </CustomizableButton>

                <CustomizableButton
                  buttonId="storyboard_asset_sorter_bar_btn_7"
                  type="button"
onClick={() => {
                    onSelectSortMode("color-light-dark");
                    onSelectGroupMode("none");
                  }}
className={cn(
                    "p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between",
                    activeSortMode === "color-light-dark"
                      ? "bg-purple-950/80 border-purple-400 text-purple-200 ring-1 ring-purple-400/40"
                      : "bg-[#020617] border-slate-800 text-slate-300 hover:border-slate-700"
                  )}
title={uiText("components_storyboard_asset_sorter_bar.button.sort_from_brightest_high_key_slices_down_to.title", "Sort from brightest high-key slices down to darkest low-key slices")}
                >
                    {() => (
                        <>
                          <span className="text-[10px] font-bold flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-300" />
                    {uiText("components_storyboard_asset_sorter_bar.span.light_dark", "Light → Dark")}
                  </span>
                        <span className="text-[8.5px] text-slate-400">{uiText("components_storyboard_asset_sorter_bar.span.high_key_to_low_key", "High-Key to Low-Key")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>
          )}

          {/* Group Filter Chips if available */}
          {availableGroups.length > 1 && (
            <div className="space-y-1 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[9.5px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Filter className="w-2.5 h-2.5 text-cyan-400" />
                  {uiText("components_storyboard_asset_sorter_bar.span.filter_by_cluster", "Filter by Cluster:")}
                </span>
                {selectedGroupFilter && (
                  <CustomizableButton
                    buttonId="storyboard_asset_sorter_bar_btn_6"
                    type="button"
onClick={() => onSelectGroupFilter(null)}
className="text-cyan-400 hover:underline cursor-pointer"
                  >
                      {() => (
                          <>
                            {uiText("components_storyboard_asset_sorter_bar.button.clear_filter", "Clear Filter")}
                          </>
                        )}
                  </CustomizableButton>
                )}
              </div>
              <div className="flex items-center gap-1 flex-wrap max-h-24 overflow-y-auto pr-0.5">
                <CustomizableButton
                  buttonId="storyboard_asset_sorter_bar_btn_5"
                  defaultLabel={")"}
                  type="button"
onClick={() => onSelectGroupFilter(null)}
className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-bold transition-all cursor-pointer border",
                    selectedGroupFilter === null
                      ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm"
                      : "bg-[#020617] text-slate-400 border-slate-800 hover:text-slate-200"
                  )}
                >
                    {(ibcProps) => (
                        <>
                          {uiText("components_storyboard_asset_sorter_bar.button.all", "All (")}
                        {totalSlicesCount}
                        {!ibcProps.isTextHidden ? ibcProps.label : null}
                        </>
                      )}
                </CustomizableButton>
                {availableGroups.map((grp) => (
                  <CustomizableButton
                    buttonId="storyboard_asset_sorter_bar_btn_4"
                    key={grp.id}
type="button"
onClick={() => onSelectGroupFilter(selectedGroupFilter === grp.id ? null : grp.id)}
className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-medium transition-all cursor-pointer border flex items-center gap-1",
                      selectedGroupFilter === grp.id
                        ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-sm"
                        : "bg-[#020617] text-slate-300 border-slate-800 hover:border-slate-700"
                    )}
                  >
                      {() => (
                          <>
                            {grp.colorSwatch && (
                      <span
                        className="w-2 h-2 rounded-full border border-black/40 shadow-xs"
                        style={{ backgroundColor: grp.colorSwatch }}
                      />
                    )}
                          <span>{grp.title}</span>
                          <span className="opacity-60 text-[8px] font-mono">({grp.count})</span>
                          </>
                        )}
                  </CustomizableButton>
                ))}
              </div>
            </div>
          )}

          {/* Footer Controls: Auto-sort on Import Toggle & Permanent Commit */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2 flex-wrap">
            <CustomizableLabel
              labelId="storyboard_asset_sorter_bar_item_3"
              as="label"
              className="flex items-center gap-1.5 text-[9.5px] text-slate-400 cursor-pointer select-none"
            >
                {() => (
                    <>
                      <input
                type="checkbox"
                checked={autoSortOnImport}
                onChange={(e) => onToggleAutoSortOnImport(e.target.checked)}
                className="rounded bg-[#020617] border-[#1e293b] text-[#10b981] focus:ring-0 cursor-pointer w-3 h-3"
              />
                    <span>{uiText("components_storyboard_asset_sorter_bar.span.auto_sort_on_new_imports", "Auto-sort on new imports")}</span>
                    </>
                  )}
            </CustomizableLabel>

            <div className="flex items-center gap-1.5 ml-auto">
              <CustomizableButton
                buttonId="storyboard_asset_sorter_bar_btn_2"
                type="button"
onClick={onResetOrder}
disabled={!isSorted}
className="px-2 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] font-medium transition-all cursor-pointer"
              >
                  {() => (
                      <>
                        {uiText("components_storyboard_asset_sorter_bar.button.reset", "Reset")}
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="storyboard_asset_sorter_bar_btn_1"
                defaultIcon={<Check className="w-3 h-3" />}
                type="button"
onClick={() => {
                  onApplySortedOrderToPool();
                  setIsOpen(false);
                }}
disabled={!isSorted}
className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-[10px] font-bold transition-all shadow cursor-pointer flex items-center gap-1"
title={uiText("components_storyboard_asset_sorter_bar.button.save_current_sorted_order_permanently_into_a.title", "Save current sorted order permanently into Asset Organizer pool")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_storyboard_asset_sorter_bar.span.save_order_to_pool", "Save Order to Pool")}</span>
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

/**
 * Visual badge shown on slice cards indicating Aspect Ratio & Dominant Color
 */
export const SliceAssetBadge: React.FC<{
  metadata?: SliceAssetMetadata;
}> = ({ metadata }) => {
  if (!metadata) return null;

  return (
    <div className="absolute bottom-1 left-1 z-10 flex items-center gap-1 pointer-events-none">
      {/* Aspect Ratio Badge */}
      <span
        className="px-1 py-0.2 rounded bg-black/75 backdrop-blur-sm text-[8px] font-mono font-bold text-slate-200 border border-white/10 shadow-sm leading-tight"
        title={`Dimensions: ${metadata.width}×${metadata.height}px (${metadata.aspectLabel})`}
      >
        {metadata.ratioBadge}
      </span>

      {/* Dominant Color Dot */}
      <span
        className="w-2.5 h-2.5 rounded-full border border-black/60 shadow-xs shrink-0"
        style={{ backgroundColor: metadata.dominantColorHex }}
        title={`Dominant Color: ${metadata.dominantColorHex} (${metadata.colorName} • ${metadata.colorFamily})`}
      />
    </div>
  );
};
