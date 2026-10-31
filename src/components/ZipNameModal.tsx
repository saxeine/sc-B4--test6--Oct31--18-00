import React, { useState, useEffect, useRef, useMemo } from "react";
import { Download, X, Sparkles, Archive, FileText, Check, Calendar, Clock, Plus, Folder } from "lucide-react";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

interface ZipNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultName: string;
  suggestions: string[];
  itemCount: number;
  title?: string;
  onConfirm: (zipFileName: string, browseFolder?: boolean) => void;
}

export const ZipNameModal: React.FC<ZipNameModalProps> = ({
  isOpen,
  onClose,
  defaultName,
  suggestions,
  itemCount,
  title = "Name ZIP Archive",
  onConfirm,
}) => {
  const [zipName, setZipName] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Date and timestamp formats
  const dateFormats = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    const dateIso = `${yyyy}-${mm}-${dd}`;
    const dateCompact = `${yyyy}${mm}${dd}`;
    const timeShort = `${hh}-${min}`;
    const fullStamp = `${dateIso}_${timeShort}`;
    const fullStampWithSec = `${dateIso}_${hh}-${min}-${ss}`;

    return {
      dateIso,
      dateCompact,
      timeShort,
      fullStamp,
      fullStampWithSec,
    };
  }, [isOpen]);

  // Combined suggestions ensuring date stamps are present
  const allSuggestions = useMemo(() => {
    const base = zipName.replace(/\.zip$/i, "").trim() || defaultName.replace(/\.zip$/i, "").trim() || "download";
    // Strip trailing date stamps if already present to construct clean base
    const cleanBase = base.replace(/[-_]\d{4}[-_]\d{2}[-_]\d{2}(.*)$/i, "");

    const dateItems = [
      `${dateFormats.dateIso}.zip`,
      `${dateFormats.fullStamp}.zip`,
      cleanBase ? `${cleanBase}-${dateFormats.dateIso}.zip` : "",
      cleanBase ? `${cleanBase}-${dateFormats.fullStamp}.zip` : "",
    ].filter(Boolean);

    const merged = [...(suggestions || []), ...dateItems];
    return Array.from(new Set(merged));
  }, [suggestions, zipName, defaultName, dateFormats]);

  useEffect(() => {
    if (isOpen) {
      setZipName(defaultName);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Select basename without .zip extension for easy typing
          const dotIdx = defaultName.lastIndexOf(".");
          if (dotIdx > 0) {
            inputRef.current.setSelectionRange(0, dotIdx);
          } else {
            inputRef.current.select();
          }
        }
      }, 50);
    }
  }, [isOpen, defaultName]);

  if (!isOpen) return null;

  const handleAppendStamp = (stamp: string) => {
    const raw = zipName.replace(/\.zip$/i, "").trim();
    if (!raw) {
      setZipName(`${stamp}.zip`);
    } else if (raw.endsWith("-") || raw.endsWith("_")) {
      setZipName(`${raw}${stamp}.zip`);
    } else {
      setZipName(`${raw}-${stamp}.zip`);
    }
  };

  const handleSubmit = (e?: React.FormEvent, browseFolder: boolean = false) => {
    if (e) e.preventDefault();
    let finalName = zipName.trim();
    if (!finalName) {
      finalName = defaultName || "download.zip";
    }
    // Ensure .zip extension
    if (!finalName.toLowerCase().endsWith(".zip")) {
      finalName = `${finalName}.zip`;
    }
    onConfirm(finalName, browseFolder);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onKeyDown={handleKeyDown}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b] bg-[#020617]/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981]">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <CustomizableLabel
                labelId="zip_name_modal_item_13"
                as="h3"
                className="text-base font-bold text-slate-100 leading-tight"
              >
                  {() => (
                      <>
                        {title}
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-xs text-slate-400">
                {uiText("components_zip_name_modal.p.packaging", "Packaging ")}<span className="font-semibold text-emerald-400">{itemCount}</span>{uiText("components_zip_name_modal.p.file", " file")}
                {itemCount === 1 ? "" : "s"}{uiText("components_zip_name_modal.p.into_zip_download", " into ZIP download")}
              </p>
            </div>
          </div>
          <CustomizableButton
            buttonId="zip_name_modal_btn_12"
            defaultIcon={<X className="w-4 h-4" />}
            onClick={onClose}
className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-[#1e293b] transition-colors cursor-pointer"
title={uiText("components_zip_name_modal.button.close.title", "Close")}
          />
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div>
            <CustomizableLabel
              labelId="zip_name_modal_item_11"
              as="label"
              className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between"
            >
                {() => (
                    <>
                      <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                {uiText("components_zip_name_modal.span.zip_archive_name", "ZIP Archive Name")}
              </span>
                    <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30">
                <Calendar className="w-3 h-3" />
                {dateFormats.dateIso}
              </span>
                    </>
                  )}
            </CustomizableLabel>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={zipName}
                onChange={(e) => setZipName(e.target.value)}
                placeholder={uiText("components_zip_name_modal.input.e_g_my_project_assets_zip.placeholder", "e.g. my-project-assets.zip")}
                className="w-full px-3.5 py-2.5 bg-[#020617] border border-[#1e293b] rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all"
              />
              {!zipName.toLowerCase().endsWith(".zip") && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 pointer-events-none">
                  {uiText("components_zip_name_modal.span.zip", ".zip")}
                </span>
              )}
            </div>
          </div>

          {/* Date Stamp Quick Append Actions */}
          <div className="bg-[#020617]/70 p-3 rounded-xl border border-[#1e293b] space-y-2">
            <CustomizableLabel
              labelId="zip_name_modal_item_10"
              as="label"
              className="text-[11px] font-bold text-slate-300 block flex items-center justify-between"
            >
                {() => (
                    <>
                      <span className="flex items-center gap-1.5 text-emerald-400">
                <Clock className="w-3.5 h-3.5" />
                {uiText("components_zip_name_modal.span.date_stamp_presets", "Date Stamp Presets:")}
              </span>
                    <span className="text-[9.5px] font-mono text-slate-500">
                {uiText("components_zip_name_modal.span.click_to_append_or_apply", "Click to append or apply")}
              </span>
                    </>
                  )}
            </CustomizableLabel>

            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              <CustomizableButton
                buttonId="zip_name_modal_btn_9"
                type="button"
onClick={() => handleAppendStamp(dateFormats.dateIso)}
className="px-2.5 py-1.5 bg-slate-900 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 rounded-lg flex items-center justify-between transition-all cursor-pointer group text-left"
title={`Append current date (${dateFormats.dateIso})`}
              >
                  {() => (
                      <>
                        <span className="truncate flex items-center gap-1 text-[11px]">
                  <Plus className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                  {uiText("components_zip_name_modal.span.date", "Date (")}{dateFormats.dateIso})
                </span>
                      </>
                    )}
              </CustomizableButton>

              <CustomizableButton
                buttonId="zip_name_modal_btn_8"
                type="button"
onClick={() => handleAppendStamp(dateFormats.fullStamp)}
className="px-2.5 py-1.5 bg-slate-900 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 rounded-lg flex items-center justify-between transition-all cursor-pointer group text-left"
title={`Append date & time stamp (${dateFormats.fullStamp})`}
              >
                  {() => (
                      <>
                        <span className="truncate flex items-center gap-1 text-[11px]">
                  <Plus className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                  {uiText("components_zip_name_modal.span.time", "Time (")}{dateFormats.timeShort})
                </span>
                      </>
                    )}
              </CustomizableButton>

              <CustomizableButton
                buttonId="zip_name_modal_btn_7"
                type="button"
onClick={() => setZipName(`${dateFormats.dateIso}.zip`)}
className="px-2.5 py-1.5 bg-slate-900/80 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 rounded-lg flex items-center justify-between transition-all cursor-pointer text-left"
title={`Set ZIP name strictly to date (${dateFormats.dateIso}.zip)`}
              >
                  {() => (
                      <>
                        <span className="truncate text-[11px]">{uiText("components_zip_name_modal.span.date_only", "Date Only")}</span>
                      <span className="text-[10px] text-amber-400 font-bold">{uiText("components_zip_name_modal.span.zip_2", ".zip")}</span>
                      </>
                    )}
              </CustomizableButton>

              <CustomizableButton
                buttonId="zip_name_modal_btn_6"
                type="button"
onClick={() => setZipName(`${dateFormats.fullStamp}.zip`)}
className="px-2.5 py-1.5 bg-slate-900/80 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 rounded-lg flex items-center justify-between transition-all cursor-pointer text-left"
title={`Set ZIP name strictly to full timestamp (${dateFormats.fullStamp}.zip)`}
              >
                  {() => (
                      <>
                        <span className="truncate text-[11px]">{uiText("components_zip_name_modal.span.full_stamp", "Full Stamp")}</span>
                      <span className="text-[10px] text-amber-400 font-bold">{uiText("components_zip_name_modal.span.zip_3", ".zip")}</span>
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>

          {/* All Suggestions Section */}
          {allSuggestions && allSuggestions.length > 0 && (
            <div>
              <CustomizableLabel
                labelId="zip_name_modal_item_5"
                defaultIcon={<Sparkles className="w-3 h-3 text-amber-400" />}
                as="label"
                className="block text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1"
              >
                  {() => (
                      <>
                        {uiText("components_zip_name_modal.label.quick_suggestions", "Quick Suggestions:")}
                      </>
                    )}
              </CustomizableLabel>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {allSuggestions.map((sug, idx) => {
                  const isSelected = zipName === sug || `${zipName}.zip` === sug;
                  return (
                    <CustomizableButton
                      buttonId="zip_name_modal_btn_4"
                      key={idx}
type="button"
onClick={() => setZipName(sug)}
className={cn(
                        "px-2.5 py-1 text-xs font-mono rounded-lg border transition-all text-left flex items-center gap-1.5 cursor-pointer",
                        isSelected
                          ? "bg-[#10b981]/20 border-[#10b981] text-emerald-300 font-semibold"
                          : "bg-[#020617] border-[#1e293b] text-slate-300 hover:border-slate-600 hover:text-slate-100"
                      )}
                    >
                        {() => (
                            <>
                              {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                            <span className="truncate max-w-[280px]">{sug}</span>
                            </>
                          )}
                    </CustomizableButton>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-[#1e293b] bg-[#020617]/60 flex-wrap">
          <CustomizableButton
            buttonId="zip_name_modal_btn_3"
            defaultIcon={<Folder className="w-4 h-4 text-cyan-400" />}
            type="button"
onClick={() => handleSubmit(undefined, true)}
className="px-3.5 py-2 bg-[#020617] hover:bg-slate-800 text-cyan-300 font-semibold text-xs rounded-xl border border-cyan-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:border-cyan-400"
title={uiText("components_zip_name_modal.button.browse_to_select_folder_where_to_save_file_z.title", "Browse to select folder where to save file zip")}
          >
              {() => (
                  <>
                    <span>{uiText("components_zip_name_modal.span.browse_folder", "Browse Folder")}</span>
                  </>
                )}
          </CustomizableButton>

          <div className="flex items-center gap-2">
            <CustomizableButton
              buttonId="zip_name_modal_btn_2"
              type="button"
onClick={onClose}
className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-[#1e293b] rounded-xl transition-all cursor-pointer"
            >
                {() => (
                    <>
                      {uiText("components_zip_name_modal.button.cancel", "Cancel")}
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="zip_name_modal_btn_1"
              defaultIcon={<Download className="w-4 h-4" />}
              type="button"
onClick={() => handleSubmit()}
className="px-4 py-2 bg-[#10b981] hover:bg-emerald-400 text-[#020617] font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-1.5 transition-all cursor-pointer"
            >
                {() => (
                    <>
                      {uiText("components_zip_name_modal.button.download_zip", "Download ZIP")}
                    </>
                  )}
            </CustomizableButton>
          </div>
        </div>
      </div>
    </div>
  );
};

