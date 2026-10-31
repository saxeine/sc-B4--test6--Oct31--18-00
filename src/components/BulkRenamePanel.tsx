import React, { useState, useMemo } from "react";
import {
  Tag,
  Wand2,
  ChevronUp,
  ChevronDown,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "../utils/cn";
import { HoldButton } from "./HoldButton";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

type RenameMode = "prefix-suffix" | "regex";
type RenameTarget = "selected" | "all";

interface BulkRenamePanelProps {
  slices: Array<{ name: string; url: string }>;
  selectedSliceUrls: Set<string>;
  onApplyRename: (
    renamedSlices: Array<{ url: string; oldName: string; newName: string }>,
    syncSlots: boolean
  ) => void;
  onOpenStudio?: () => void;
}

export const BulkRenamePanel: React.FC<BulkRenamePanelProps> = ({
  slices,
  selectedSliceUrls,
  onApplyRename,
  onOpenStudio,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [target, setTarget] = useState<RenameTarget>("selected");
  const [mode, setMode] = useState<RenameMode>("prefix-suffix");

  // Prefix & Suffix State
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [addNumbering, setAddNumbering] = useState(false);
  const [numberStart, setNumberStart] = useState(1);
  const [numberPadding, setNumberPadding] = useState(2);

  // Regex State
  const [findPattern, setFindPattern] = useState("");
  const [replacePattern, setReplacePattern] = useState("");
  const [regexGlobal, setRegexGlobal] = useState(true);
  const [regexCaseInsensitive, setRegexCaseInsensitive] = useState(true);

  // Sync state
  const [syncBoardSlots, setSyncBoardSlots] = useState(true);
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  // Target slices list
  const targetSlices = useMemo(() => {
    if (target === "selected" && selectedSliceUrls.size > 0) {
      return slices.filter((s) => selectedSliceUrls.has(s.url));
    }
    return slices;
  }, [slices, selectedSliceUrls, target]);

  // Regex error evaluation
  const regexError = useMemo(() => {
    if (mode !== "regex" || !findPattern) return null;
    try {
      const flags = `${regexGlobal ? "g" : ""}${regexCaseInsensitive ? "i" : ""}`;
      new RegExp(findPattern, flags);
      return null;
    } catch (err: any) {
      return err?.message || "Invalid regular expression pattern";
    }
  }, [mode, findPattern, regexGlobal, regexCaseInsensitive]);

  // Compute live previews for target slices
  const previewResults = useMemo(() => {
    if (targetSlices.length === 0) return [];

    return targetSlices.map((slice, index) => {
      let newName = slice.name;

      if (mode === "prefix-suffix") {
        const extMatch = slice.name.match(/(\.[a-zA-Z0-9]{2,5})$/i);
        let baseName = slice.name;
        let ext = "";
        if (extMatch) {
          ext = extMatch[1];
          baseName = slice.name.slice(0, extMatch.index);
        }

        const numStr = addNumbering
          ? `_${String(numberStart + index).padStart(numberPadding, "0")}`
          : "";
        newName = `${prefix}${baseName}${suffix}${numStr}${ext}`;
      } else if (mode === "regex" && findPattern && !regexError) {
        try {
          const flags = `${regexGlobal ? "g" : ""}${regexCaseInsensitive ? "i" : ""}`;
          const re = new RegExp(findPattern, flags);
          newName = slice.name.replace(re, replacePattern);
        } catch (e) {
          newName = slice.name;
        }
      }

      return {
        url: slice.url,
        oldName: slice.name,
        newName: newName.trim() || slice.name,
      };
    });
  }, [
    targetSlices,
    mode,
    prefix,
    suffix,
    addNumbering,
    numberStart,
    numberPadding,
    findPattern,
    replacePattern,
    regexGlobal,
    regexCaseInsensitive,
    regexError,
  ]);

  const handleApply = () => {
    if (previewResults.length === 0) return;
    if (mode === "regex" && regexError) return;

    onApplyRename(previewResults, syncBoardSlots);
    setAppliedFeedback(`Renamed ${previewResults.length} slices successfully!`);
    setTimeout(() => setAppliedFeedback(null), 3000);
  };

  const handleResetFields = () => {
    setPrefix("");
    setSuffix("");
    setAddNumbering(false);
    setNumberStart(1);
    setNumberPadding(2);
    setFindPattern("");
    setReplacePattern("");
  };

  const effectiveTargetCount =
    target === "selected" && selectedSliceUrls.size > 0
      ? selectedSliceUrls.size
      : slices.length;

  return (
    <div className="relative">
      {/* Header Toolbar Trigger Button */}
      <CustomizableButton
        buttonId="bulk_rename_panel_btn_17"
        defaultIcon={<Tag className="w-3.5 h-3.5 text-[#10b981]" />}
        type="button"
onClick={() => setIsExpanded(!isExpanded)}
className="bg-[#020617] hover:bg-[#0f172a] text-slate-300 border border-[#1e293b] hover:border-[#10b981]/50 px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-sm font-semibold cursor-pointer"
title={uiText("components_bulk_rename_panel.button.bulk_rename_panel.title", "Bulk Rename Panel")}
      >
          {() => (
              <>
                <span className="hidden sm:inline">{uiText("components_bulk_rename_panel.span.bulk_rename", "Bulk Rename")}</span>
              <span className="text-[10px] text-slate-500 font-medium">
          ({effectiveTargetCount})
        </span>
              {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        )}
              </>
            )}
      </CustomizableButton>

      {/* Expanded Floating Popover Dropdown Panel */}
      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#090d16] border border-[#1e293b] rounded-xl shadow-2xl p-3 z-50 space-y-3 max-h-[480px] overflow-y-auto">
          {/* Launch Studio Banner Button */}
          {onOpenStudio && (
            <CustomizableButton
              buttonId="bulk_rename_panel_btn_16"
              defaultIcon={<Sparkles className="w-3.5 h-3.5 text-[#10b981] group-hover:rotate-12 transition-transform" />}
              type="button"
onClick={onOpenStudio}
className="w-full py-1.5 px-2 bg-[#10b981]/10 hover:bg-[#10b981]/20 active:bg-[#10b981]/30 border border-[#10b981]/30 hover:border-[#10b981]/60 rounded-lg text-[#10b981] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer group"
            >
                {() => (
                    <>
                      <span>{uiText("components_bulk_rename_panel.span.open_renaming_studio_modal", "Open Renaming Studio Modal")}</span>
                    </>
                  )}
            </CustomizableButton>
          )}

          {/* Target Scope Switch */}
          <div className="space-y-1">
            <CustomizableLabel
              labelId="bulk_rename_panel_item_15"
              as="label"
              className="text-[10px] font-bold text-slate-300 block"
            >
                {() => (
                    <>
                      {uiText("components_bulk_rename_panel.label.apply_renaming_to", "Apply Renaming To:")}
                    </>
                  )}
            </CustomizableLabel>
            <div className="grid grid-cols-2 gap-1 bg-[#020617] p-0.5 rounded-lg border border-[#1e293b]">
              <CustomizableButton
                buttonId="bulk_rename_panel_btn_14"
                type="button"
onClick={() => setTarget("selected")}
disabled={selectedSliceUrls.size === 0}
className={cn(
                  "py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1",
                  target === "selected" && selectedSliceUrls.size > 0
                    ? "bg-[#0f172a] text-[#10b981] shadow-sm"
                    : "text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                  {() => (
                      <>
                        <span>{uiText("components_bulk_rename_panel.span.selected", "Selected (")}{selectedSliceUrls.size})</span>
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="bulk_rename_panel_btn_13"
                type="button"
onClick={() => setTarget("all")}
className={cn(
                  "py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1",
                  target === "all" || selectedSliceUrls.size === 0
                    ? "bg-[#0f172a] text-[#10b981] shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                  {() => (
                      <>
                        <span>{uiText("components_bulk_rename_panel.span.all_pool_slices", "All Pool Slices (")}{slices.length})</span>
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-[#020617] p-0.5 rounded-lg border border-[#1e293b] text-[10px]">
            <CustomizableButton
              buttonId="bulk_rename_panel_btn_12"
              type="button"
onClick={() => setMode("prefix-suffix")}
className={cn(
                "flex-1 py-1 rounded-md text-center font-bold transition-all cursor-pointer",
                mode === "prefix-suffix"
                  ? "bg-[#0f172a] text-[#10b981] shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
                {() => (
                    <>
                      {uiText("components_bulk_rename_panel.button.prefix_and_suffix", "Prefix & Suffix")}
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="bulk_rename_panel_btn_11"
              defaultIcon={<Wand2 className="w-3 h-3 text-[#10b981]" />}
              type="button"
onClick={() => setMode("regex")}
className={cn(
                "flex-1 py-1 rounded-md text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1",
                mode === "regex"
                  ? "bg-[#0f172a] text-[#10b981] shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
                {() => (
                    <>
                      {uiText("components_bulk_rename_panel.button.regex_replace", "Regex Replace")}
                    </>
                  )}
            </CustomizableButton>
          </div>

          {/* Mode 1: Prefix / Suffix Controls */}
          {mode === "prefix-suffix" && (
            <div className="space-y-2.5 bg-[#020617]/70 p-2.5 rounded-lg border border-[#1e293b]">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <CustomizableLabel
                    labelId="bulk_rename_panel_item_10"
                    as="label"
                    className="text-[10px] font-semibold text-slate-400 block"
                  >
                      {() => (
                          <>
                            {uiText("components_bulk_rename_panel.label.prefix_add_before", "Prefix (Add Before)")}
                          </>
                        )}
                  </CustomizableLabel>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder={uiText("components_bulk_rename_panel.input.e_g_frame.placeholder", "e.g. Frame_")}
                    className="w-full bg-[#020617] border border-[#1e293b] rounded-md px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#10b981]"
                  />
                </div>
                <div className="space-y-1">
                  <CustomizableLabel
                    labelId="bulk_rename_panel_item_9"
                    as="label"
                    className="text-[10px] font-semibold text-slate-400 block"
                  >
                      {() => (
                          <>
                            {uiText("components_bulk_rename_panel.label.suffix_add_after", "Suffix (Add After)")}
                          </>
                        )}
                  </CustomizableLabel>
                  <input
                    type="text"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    placeholder={uiText("components_bulk_rename_panel.input.e_g_v1.placeholder", "e.g. _v1")}
                    className="w-full bg-[#020617] border border-[#1e293b] rounded-md px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#10b981]"
                  />
                </div>
              </div>

              {/* Numbering Option */}
              <div className="pt-1 border-t border-[#1e293b]/60 space-y-2">
                <CustomizableLabel
                  labelId="bulk_rename_panel_item_8"
                  as="label"
                  className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-300 cursor-pointer select-none"
                >
                    {() => (
                        <>
                          <input
                    type="checkbox"
                    checked={addNumbering}
                    onChange={(e) => setAddNumbering(e.target.checked)}
                    className="rounded bg-[#020617] border-[#1e293b] text-[#10b981] focus:ring-0 cursor-pointer"
                  />
                        <span>{uiText("components_bulk_rename_panel.span.append_sequential_index_01_02", "Append Sequential Index (_01, _02)")}</span>
                        </>
                      )}
                </CustomizableLabel>

                {addNumbering && (
                  <div className="grid grid-cols-2 gap-2 pl-4">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 block">
                        {uiText("components_bulk_rename_panel.span.start_from", "Start From:")}
                      </span>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min={0}
                          max={9999}
                          value={numberStart}
                          onChange={(e) =>
                            setNumberStart(parseInt(e.target.value) || 0)
                          }
                          className="w-full bg-[#020617] border border-[#1e293b] rounded pl-2 pr-6 py-0.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-[#10b981] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-0.5 flex flex-col">
                          <HoldButton
                            onAction={() => setNumberStart((v) => Math.min(9999, v + 1))}
                            className="p-0.5 text-slate-400 hover:text-[#10b981] transition-colors cursor-pointer"
                            title={uiText("components_bulk_rename_panel.hold_button.increase_start_hold_for_continuous.title", "Increase Start (Hold for continuous)")}
                          >
                            <ChevronUp className="w-2.5 h-2.5" />
                          </HoldButton>
                          <HoldButton
                            onAction={() => setNumberStart((v) => Math.max(0, v - 1))}
                            className="p-0.5 text-slate-400 hover:text-[#10b981] transition-colors cursor-pointer"
                            title={uiText("components_bulk_rename_panel.hold_button.decrease_start_hold_for_continuous.title", "Decrease Start (Hold for continuous)")}
                          >
                            <ChevronDown className="w-2.5 h-2.5" />
                          </HoldButton>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 block">
                        {uiText("components_bulk_rename_panel.span.digits_pad", "Digits (Pad):")}
                      </span>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min={1}
                          max={6}
                          value={numberPadding}
                          onChange={(e) =>
                            setNumberPadding(parseInt(e.target.value) || 1)
                          }
                          className="w-full bg-[#020617] border border-[#1e293b] rounded pl-2 pr-6 py-0.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-[#10b981] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-0.5 flex flex-col">
                          <HoldButton
                            onAction={() => setNumberPadding((v) => Math.min(6, v + 1))}
                            className="p-0.5 text-slate-400 hover:text-[#10b981] transition-colors cursor-pointer"
                            title={uiText("components_bulk_rename_panel.hold_button.increase_padding_hold_for_continuous.title", "Increase Padding (Hold for continuous)")}
                          >
                            <ChevronUp className="w-2.5 h-2.5" />
                          </HoldButton>
                          <HoldButton
                            onAction={() => setNumberPadding((v) => Math.max(1, v - 1))}
                            className="p-0.5 text-slate-400 hover:text-[#10b981] transition-colors cursor-pointer"
                            title={uiText("components_bulk_rename_panel.hold_button.decrease_padding_hold_for_continuous.title", "Decrease Padding (Hold for continuous)")}
                          >
                            <ChevronDown className="w-2.5 h-2.5" />
                          </HoldButton>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode 2: Regex Controls */}
          {mode === "regex" && (
            <div className="space-y-2 bg-[#020617]/70 p-2.5 rounded-lg border border-[#1e293b]">
              <div className="space-y-1">
                <CustomizableLabel
                  labelId="bulk_rename_panel_item_7"
                  as="label"
                  className="text-[10px] font-semibold text-slate-400 block flex items-center justify-between"
                >
                    {() => (
                        <>
                          <span>{uiText("components_bulk_rename_panel.span.find_pattern_regex", "Find Pattern (Regex)")}</span>
                        <span className="text-[9px] text-slate-500 font-mono">
                    {uiText("components_bulk_rename_panel.span.e_g_slice_d", "e.g. slice-(\\d+)")}
                  </span>
                        </>
                      )}
                </CustomizableLabel>
                <input
                  type="text"
                  value={findPattern}
                  onChange={(e) => setFindPattern(e.target.value)}
                  placeholder={uiText("components_bulk_rename_panel.input.e_g_slice_d_or.placeholder", "e.g. slice-(\\d+) or ^(.+)$")}
                  className={cn(
                    "w-full bg-[#020617] border rounded-md px-2 py-1 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none",
                    regexError ? "border-rose-500" : "border-[#1e293b] focus:border-[#10b981]"
                  )}
                />
              </div>

              <div className="space-y-1">
                <CustomizableLabel
                  labelId="bulk_rename_panel_item_6"
                  as="label"
                  className="text-[10px] font-semibold text-slate-400 block flex items-center justify-between"
                >
                    {() => (
                        <>
                          <span>{uiText("components_bulk_rename_panel.span.replace_with", "Replace With")}</span>
                        <span className="text-[9px] text-slate-500 font-mono">
                    {uiText("components_bulk_rename_panel.span.use_1_2_for_groups", "Use $1, $2 for groups")}
                  </span>
                        </>
                      )}
                </CustomizableLabel>
                <input
                  type="text"
                  value={replacePattern}
                  onChange={(e) => setReplacePattern(e.target.value)}
                  placeholder={uiText("components_bulk_rename_panel.input.e_g_frame_1_or_hero_slice.placeholder", "e.g. frame_$1 or hero_slice")}
                  className="w-full bg-[#020617] border border-[#1e293b] rounded-md px-2 py-1 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-[#10b981]"
                />
              </div>

              {/* Regex Flags */}
              <div className="flex items-center gap-4 pt-1 text-[10px] text-slate-400">
                <CustomizableLabel
                  labelId="bulk_rename_panel_item_5"
                  as="label"
                  className="flex items-center gap-1 cursor-pointer select-none"
                >
                    {() => (
                        <>
                          <input
                    type="checkbox"
                    checked={regexGlobal}
                    onChange={(e) => setRegexGlobal(e.target.checked)}
                    className="rounded bg-[#020617] border-[#1e293b] text-[#10b981] focus:ring-0"
                  />
                        <span>{uiText("components_bulk_rename_panel.span.global_g", "Global (g)")}</span>
                        </>
                      )}
                </CustomizableLabel>
                <CustomizableLabel
                  labelId="bulk_rename_panel_item_4"
                  as="label"
                  className="flex items-center gap-1 cursor-pointer select-none"
                >
                    {() => (
                        <>
                          <input
                    type="checkbox"
                    checked={regexCaseInsensitive}
                    onChange={(e) => setRegexCaseInsensitive(e.target.checked)}
                    className="rounded bg-[#020617] border-[#1e293b] text-[#10b981] focus:ring-0"
                  />
                        <span>{uiText("components_bulk_rename_panel.span.case_insensitive_i", "Case-insensitive (i)")}</span>
                        </>
                      )}
                </CustomizableLabel>
              </div>

              {regexError && (
                <div className="flex items-center gap-1.5 p-1.5 bg-rose-950/40 border border-rose-900/60 rounded text-[10px] text-rose-300">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{regexError}</span>
                </div>
              )}
            </div>
          )}

          {/* Live Preview List */}
          <div className="space-y-1 bg-[#020617] p-2 rounded-lg border border-[#1e293b]">
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-1">
              <span>{uiText("components_bulk_rename_panel.span.renaming_preview_first", "Renaming Preview (First ")}{Math.min(3, previewResults.length)})</span>
              <span className="text-emerald-400 font-mono font-normal">
                {previewResults.length}{uiText("components_bulk_rename_panel.span.total", " total")}
              </span>
            </div>

            {previewResults.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic text-center py-1">
                {uiText("components_bulk_rename_panel.p.no_slices_available_to_rename", "No slices available to rename.")}
              </p>
            ) : (
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {previewResults.slice(0, 3).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[10px] bg-[#0f172a] p-1.5 rounded border border-[#1e293b] font-mono gap-1"
                  >
                    <span className="text-slate-400 truncate max-w-[42%]" title={item.oldName}>
                      {item.oldName}
                    </span>
                    <ArrowRight className="w-3 h-3 text-[#10b981] shrink-0" />
                    <span
                      className={cn(
                        "truncate max-w-[48%] font-bold",
                        item.oldName !== item.newName
                          ? "text-emerald-300 font-semibold"
                          : "text-slate-400"
                      )}
                      title={item.newName}
                    >
                      {item.newName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sync Option */}
          <div className="pt-1">
            <CustomizableLabel
              labelId="bulk_rename_panel_item_3"
              as="label"
              className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer select-none"
            >
                {() => (
                    <>
                      <input
                type="checkbox"
                checked={syncBoardSlots}
                onChange={(e) => setSyncBoardSlots(e.target.checked)}
                className="rounded bg-[#020617] border-[#1e293b] text-[#10b981] focus:ring-0 cursor-pointer"
              />
                    <span>{uiText("components_bulk_rename_panel.span.also_update_names_of_filled_storyboard_board", "Also update names of filled Storyboard Board slots")}</span>
                    </>
                  )}
            </CustomizableLabel>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <CustomizableButton
              buttonId="bulk_rename_panel_btn_2"
              defaultIcon={<RefreshCw className="w-3.5 h-3.5" />}
              type="button"
onClick={handleResetFields}
className="p-1.5 bg-[#020617] hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-[#1e293b] rounded-lg transition-colors cursor-pointer"
title={uiText("components_bulk_rename_panel.button.reset_fields.title", "Reset fields")}
            />
            <CustomizableButton
              buttonId="bulk_rename_panel_btn_1"
              defaultIcon={<Check className="w-3.5 h-3.5" />}
              type="button"
onClick={handleApply}
disabled={
                previewResults.length === 0 || (mode === "regex" && !!regexError)
              }
className="flex-1 py-1.5 bg-[#10b981] hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800 text-[#020617] font-bold rounded-lg border border-emerald-500/20 transition-all flex items-center justify-center gap-1.5 text-xs shadow-sm cursor-pointer"
            >
                {() => (
                    <>
                      <span>{uiText("components_bulk_rename_panel.span.apply_bulk_rename", "Apply Bulk Rename")}</span>
                    </>
                  )}
            </CustomizableButton>
          </div>

          {appliedFeedback && (
            <div className="flex items-center justify-center gap-1.5 p-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-[10px] font-bold text-emerald-300 animate-in fade-in">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{appliedFeedback}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
