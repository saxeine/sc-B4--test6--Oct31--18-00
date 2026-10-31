import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  FileJson,
  Download,
  Sparkles,
  Folder,
  FolderOpen,
  FolderCheck,
  Plus,
  Pencil,
  Trash2,
  Check,
  RotateCcw,
  HardDrive,
  Settings2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "../utils/cn";
import { saveStoredJson, getStoredJson } from "../utils/idbStorage";
import { uiText } from "../hooks/useUIConfig";
import { remoteStore } from "../services/remoteKeyValueStore";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export interface ExportJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (
    filename: string,
    options?: {
      folderPath?: string;
      savedDirectly?: boolean;
    }
  ) => void | Promise<void>;
  defaultFilename?: string;
  title?: string;
  description?: string;
  itemCount?: number;
  getJsonData?: () => string;
}

// In-memory directory handle reference retained across modal opens within session
let cachedSessionDirHandle: any = null;

const STORAGE_KEY_DEFAULT_FOLDER_NAME = "seqcarver_default_export_folder_name";
const STORAGE_KEY_DEFAULT_FOLDER_PATH = "seqcarver_default_export_folder_path";

const DEFAULT_BUTTON_SUGGESTIONS = [
  "seqcarver-button-state-{date}",
  "button-customizations-backup",
  "seqcarver-state-theme",
  "control-deck-layout-{date}",
  "production-buttons-v1",
  "seqcarver-backup-{time}",
];

const DEFAULT_STORYBOARD_SUGGESTIONS = [
  "storyboard-{date}",
  "storyboard-export",
  "seqcarver-storyboard-v1",
  "storyboard-slots-{count}",
  "shot-list-{date}",
  "animatic-sequence-{time}",
];

export function ExportJsonModal({
  isOpen,
  onClose,
  onExport,
  defaultFilename = "export",
  title = "Export JSON File",
  description = "Specify a name for your JSON export file and choose your local save destination.",
  itemCount,
  getJsonData,
}: ExportJsonModalProps) {
  const isButtonState =
    title.toLowerCase().includes("button") ||
    defaultFilename.toLowerCase().includes("button");

  const suggestionsStorageKey = isButtonState
    ? "seqcarver_export_quick_suggestions_button"
    : "seqcarver_export_quick_suggestions_storyboard";

  const baselineDefaultSuggestions = isButtonState
    ? DEFAULT_BUTTON_SUGGESTIONS
    : DEFAULT_STORYBOARD_SUGGESTIONS;

  const [filename, setFilename] = useState<string>(() => {
    return defaultFilename.replace(/\.json$/i, "") || "export";
  });
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSavingDirectly, setIsSavingDirectly] = useState(false);

  // Folder management state
  const [defaultFolderName, setDefaultFolderName] = useState<string>(() => {
    try {
      return remoteStore.getItem(STORAGE_KEY_DEFAULT_FOLDER_NAME) || "";
    } catch {
      return "";
    }
  });

  const [defaultFolderPath, setDefaultFolderPath] = useState<string>(() => {
    try {
      return remoteStore.getItem(STORAGE_KEY_DEFAULT_FOLDER_PATH) || "";
    } catch {
      return "";
    }
  });

  const [isEditingFolderPath, setIsEditingFolderPath] = useState(false);
  const [folderPathInput, setFolderPathInput] = useState("");
  const [activeDirHandle, setActiveDirHandle] = useState<any>(cachedSessionDirHandle);

  // Quick suggestions state
  const [suggestions, setSuggestions] = useState<string[]>(() => {
    try {
      const stored = remoteStore.getItem(suggestionsStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return baselineDefaultSuggestions;
  });

  // Suggestion editing state
  const [isAddingSuggestion, setIsAddingSuggestion] = useState(false);
  const [newSuggestionInput, setNewSuggestionInput] = useState("");
  const [editingSuggestionIndex, setEditingSuggestionIndex] = useState<number | null>(null);
  const [editingSuggestionValue, setEditingSuggestionValue] = useState("");

  // Re-sync on modal open
  useEffect(() => {
    if (isOpen) {
      const cleanName = defaultFilename.replace(/\.json$/i, "");
      setFilename(cleanName || "export");
      setError(null);
      setStatusMessage(null);
      setIsSavingDirectly(false);
      setIsAddingSuggestion(false);
      setEditingSuggestionIndex(null);
      setIsEditingFolderPath(false);

      // Reload default folder from localStorage / IndexedDB
      try {
        const storedName = remoteStore.getItem(STORAGE_KEY_DEFAULT_FOLDER_NAME) || "";
        const storedPath = remoteStore.getItem(STORAGE_KEY_DEFAULT_FOLDER_PATH) || "";
        setDefaultFolderName(storedName);
        setDefaultFolderPath(storedPath);
        setFolderPathInput(storedPath || storedName);
      } catch {}

      // Reload suggestions
      try {
        const storedSugg = remoteStore.getItem(suggestionsStorageKey);
        if (storedSugg) {
          const parsed = JSON.parse(storedSugg);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSuggestions(parsed);
          }
        }
      } catch {}
    }
  }, [isOpen, defaultFilename, suggestionsStorageKey]);

  // Dynamic template replacement helper
  const resolveTemplate = (template: string): string => {
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10);
    const timeStamp = now.toTimeString().slice(0, 5).replace(":", "");
    return template
      .replace(/\{date\}/gi, dateStamp)
      .replace(/\{time\}/gi, timeStamp)
      .replace(/\{count\}/gi, String(itemCount || 0))
      .replace(/\{preset\}/gi, isButtonState ? "buttons" : "storyboard");
  };

  if (!isOpen) return null;

  // Sanitize and normalize filename
  const getSanitizedFilename = (): string => {
    const trimmed = filename.trim();
    if (!trimmed) return "export.json";
    const sanitized = trimmed.replace(/[\\/:*?"<>|]/g, "_");
    return sanitized.toLowerCase().endsWith(".json") ? sanitized : `${sanitized}.json`;
  };

  // Suggestion Management Handlers
  const handleSelectSuggestion = (template: string) => {
    const resolved = resolveTemplate(template);
    setFilename(resolved);
    setError(null);
  };

  const handleSaveNewSuggestion = () => {
    const trimmed = newSuggestionInput.trim();
    if (!trimmed) {
      setIsAddingSuggestion(false);
      return;
    }
    const clean = trimmed.replace(/\.json$/i, "");
    if (!suggestions.includes(clean)) {
      const updated = [...suggestions, clean];
      setSuggestions(updated);
      try {
        remoteStore.setItem(suggestionsStorageKey, JSON.stringify(updated));
        saveStoredJson(suggestionsStorageKey, updated).catch(console.warn);
      } catch {}
    }
    setNewSuggestionInput("");
    setIsAddingSuggestion(false);
  };

  const handleStartEditSuggestion = (e: React.MouseEvent, index: number, value: string) => {
    e.stopPropagation();
    setEditingSuggestionIndex(index);
    setEditingSuggestionValue(value);
  };

  const handleSaveEditedSuggestion = (index: number) => {
    const trimmed = editingSuggestionValue.trim();
    if (!trimmed) {
      setEditingSuggestionIndex(null);
      return;
    }
    const clean = trimmed.replace(/\.json$/i, "");
    const updated = [...suggestions];
    updated[index] = clean;
    setSuggestions(updated);
    try {
      remoteStore.setItem(suggestionsStorageKey, JSON.stringify(updated));
      saveStoredJson(suggestionsStorageKey, updated).catch(console.warn);
    } catch {}
    setEditingSuggestionIndex(null);
  };

  const handleDeleteSuggestion = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const updated = suggestions.filter((_, i) => i !== index);
    const finalSet = updated.length > 0 ? updated : baselineDefaultSuggestions;
    setSuggestions(finalSet);
    try {
      remoteStore.setItem(suggestionsStorageKey, JSON.stringify(finalSet));
      saveStoredJson(suggestionsStorageKey, finalSet).catch(console.warn);
    } catch {}
  };

  const handleResetSuggestions = () => {
    setSuggestions(baselineDefaultSuggestions);
    try {
      remoteStore.setItem(suggestionsStorageKey, JSON.stringify(baselineDefaultSuggestions));
      saveStoredJson(suggestionsStorageKey, baselineDefaultSuggestions).catch(console.warn);
    } catch {}
    setStatusMessage("✓ Restored quick suggestions to default presets");
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Folder Management Handlers
  const handleBrowseAndPickFolder = async () => {
    setError(null);
    try {
      if ("showDirectoryPicker" in window) {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: "readwrite",
        });
        if (dirHandle) {
          cachedSessionDirHandle = dirHandle;
          setActiveDirHandle(dirHandle);
          setDefaultFolderName(dirHandle.name);
          setDefaultFolderPath(dirHandle.name);
          setFolderPathInput(dirHandle.name);
          try {
            remoteStore.setItem(STORAGE_KEY_DEFAULT_FOLDER_NAME, dirHandle.name);
            remoteStore.setItem(STORAGE_KEY_DEFAULT_FOLDER_PATH, dirHandle.name);
          } catch {}
          setStatusMessage(`✓ Selected folder: "${dirHandle.name}"`);
          setTimeout(() => setStatusMessage(null), 3000);
        }
      } else {
        // Fallback for browsers without showDirectoryPicker
        setIsEditingFolderPath(true);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.warn("Directory picker error or sandbox restriction:", err);
        setIsEditingFolderPath(true);
      }
    }
  };

  const handleSaveManualFolderPath = () => {
    const trimmed = folderPathInput.trim();
    if (!trimmed) {
      setIsEditingFolderPath(false);
      return;
    }
    setDefaultFolderName(trimmed);
    setDefaultFolderPath(trimmed);
    try {
      remoteStore.setItem(STORAGE_KEY_DEFAULT_FOLDER_NAME, trimmed);
      remoteStore.setItem(STORAGE_KEY_DEFAULT_FOLDER_PATH, trimmed);
    } catch {}
    setIsEditingFolderPath(false);
    setStatusMessage(`✓ Default save folder set to: "${trimmed}"`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleClearDefaultFolder = () => {
    cachedSessionDirHandle = null;
    setActiveDirHandle(null);
    setDefaultFolderName("");
    setDefaultFolderPath("");
    setFolderPathInput("");
    try {
      remoteStore.removeItem(STORAGE_KEY_DEFAULT_FOLDER_NAME);
      remoteStore.removeItem(STORAGE_KEY_DEFAULT_FOLDER_PATH);
    } catch {}
    setStatusMessage("✓ Reset save folder to browser standard Downloads");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Direct Save via File System Access API
  const handleBrowseFolderAndSave = async () => {
    setError(null);
    const finalFilename = getSanitizedFilename();
    const content = getJsonData ? getJsonData() : null;

    setIsSavingDirectly(true);
    try {
      // 1. Try showSaveFilePicker (allows user to browse folders and name file in one native step)
      if ("showSaveFilePicker" in window) {
        try {
          const pickerOptions: any = {
            suggestedName: finalFilename,
            types: [
              {
                description: "JSON Configuration File (*.json)",
                accept: { "application/json": [".json"] },
              },
            ],
          };
          if (activeDirHandle) {
            pickerOptions.startIn = activeDirHandle;
          }

          const fileHandle = await (window as any).showSaveFilePicker(pickerOptions);
          if (fileHandle) {
            const jsonStringToWrite = content || "{}";
            const writableStream = await fileHandle.createWritable();
            await writableStream.write(jsonStringToWrite);
            await writableStream.close();

            await onExport(finalFilename, {
              folderPath: fileHandle.name,
              savedDirectly: true,
            });
            onClose();
            return;
          }
        } catch (pickerErr: any) {
          if (pickerErr?.name === "AbortError") {
            setIsSavingDirectly(false);
            return;
          }
          console.warn("showSaveFilePicker unsupported or blocked in context, trying directory fallback:", pickerErr);
        }
      }

      // 2. Try showDirectoryPicker if active handle exists or can be chosen
      let dirHandleToUse = activeDirHandle;
      if (!dirHandleToUse && "showDirectoryPicker" in window) {
        dirHandleToUse = await (window as any).showDirectoryPicker({ mode: "readwrite" });
        cachedSessionDirHandle = dirHandleToUse;
        setActiveDirHandle(dirHandleToUse);
        setDefaultFolderName(dirHandleToUse.name);
        try {
          remoteStore.setItem(STORAGE_KEY_DEFAULT_FOLDER_NAME, dirHandleToUse.name);
        } catch {}
      }

      if (dirHandleToUse) {
        const fileHandle = await dirHandleToUse.getFileHandle(finalFilename, { create: true });
        const jsonStringToWrite = content || "{}";
        const writable = await fileHandle.createWritable();
        await writable.write(jsonStringToWrite);
        await writable.close();

        await onExport(finalFilename, {
          folderPath: dirHandleToUse.name,
          savedDirectly: true,
        });
        onClose();
        return;
      }

      // 3. Fallback to standard export
      await onExport(finalFilename, {
        folderPath: defaultFolderPath || defaultFolderName || undefined,
        savedDirectly: false,
      });
      onClose();
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setIsSavingDirectly(false);
        return;
      }
      console.warn("Direct folder save fallback to standard download:", err);
      // Seamlessly fallback to standard download
      await onExport(finalFilename, {
        folderPath: defaultFolderPath || defaultFolderName || undefined,
        savedDirectly: false,
      });
      onClose();
    } finally {
      setIsSavingDirectly(false);
    }
  };

  const handleStandardConfirm = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const finalFilename = getSanitizedFilename();
    try {
      onExport(finalFilename, {
        folderPath: defaultFolderPath || defaultFolderName || undefined,
        savedDirectly: false,
      });
      onClose();
    } catch (err: any) {
      console.error("Export modal error:", err);
      setError(err?.message || "Failed to export");
    }
  };

  return (
    <div
      data-ibc-ui="true"
      className="fixed inset-0 z-[100000] pointer-events-auto flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150 select-auto overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-4 sm:p-5 max-w-lg w-full shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150 pointer-events-auto select-auto my-auto"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <CustomizableLabel
                labelId="export_json_modal_item_19"
                as="h3"
                className="text-base font-extrabold text-slate-100 flex items-center gap-2"
              >
                  {() => (
                      <>
                        <span>{title}</span>
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  {uiText("components_export_json_modal.span.folder_and_suggestions_enabled", "Folder & Suggestions Enabled")}
                </span>
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-xs text-slate-400">{description}</p>
            </div>
          </div>
          <CustomizableButton
            buttonId="export_json_modal_btn_18"
            defaultIcon={<X className="w-4 h-4" />}
            type="button"
onClick={onClose}
className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
title={uiText("components_export_json_modal.button.cancel_and_close.title", "Cancel & Close")}
          />
        </div>

        {/* Status notice */}
        {statusMessage && (
          <div className="text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-3 py-2 rounded-xl flex items-center gap-2 animate-in fade-in">
            <FolderCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleStandardConfirm} className="flex flex-col gap-4">
          {/* File Name Field */}
          <div>
            <CustomizableLabel
              labelId="export_json_modal_item_17"
              as="label"
              className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between"
            >
                {() => (
                    <>
                      <span>{uiText("components_export_json_modal.span.file_name", "File Name:")}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{uiText("components_export_json_modal.span.format_json", "Format: JSON")}</span>
                    </>
                  )}
            </CustomizableLabel>
            <div className="relative flex items-center">
              <input
                type="text"
                autoFocus
                value={filename}
                onChange={(e) => {
                  setFilename(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={isButtonState ? "e.g. seqcarver-button-state" : "e.g. my-project-storyboard"}
                className="w-full bg-[#020617] border border-[#1e293b] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 rounded-xl px-3 py-2 text-sm pr-16 outline-none transition-all placeholder:text-slate-600 font-mono select-text"
              />
              <div className="absolute right-3 text-xs font-mono font-bold text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50 pointer-events-none">
                {uiText("components_export_json_modal.div.json", ".json")}
              </div>
            </div>
            {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
          </div>

          {/* SECTION: Quick Suggestions (Interactive, Editable, Addable) */}
          <div className="flex flex-col gap-2 bg-[#020617] p-3 rounded-xl border border-[#1e293b]/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {uiText("components_export_json_modal.span.quick_suggestions", "Quick Suggestions (")}{suggestions.length}):
              </span>
              <div className="flex items-center gap-1.5">
                <CustomizableButton
                  buttonId="export_json_modal_btn_16"
                  defaultIcon={<Plus className="w-3 h-3" />}
                  type="button"
onClick={() => setIsAddingSuggestion(true)}
className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
title={uiText("components_export_json_modal.button.add_a_custom_quick_suggestion_template.title", "Add a custom quick suggestion template")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_export_json_modal.span.add_suggestion", "Add Suggestion")}</span>
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="export_json_modal_btn_15"
                  defaultIcon={<RotateCcw className="w-3 h-3" />}
                  type="button"
onClick={handleResetSuggestions}
className="text-[10px] text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer"
title={uiText("components_export_json_modal.button.reset_to_default_preset_suggestions.title", "Reset to default preset suggestions")}
                />
              </div>
            </div>

            {/* Inline Add Suggestion Input */}
            {isAddingSuggestion && (
              <div className="flex items-center gap-1.5 p-1.5 bg-[#081220] border border-emerald-500/40 rounded-lg animate-in fade-in">
                <input
                  type="text"
                  autoFocus
                  value={newSuggestionInput}
                  onChange={(e) => setNewSuggestionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveNewSuggestion();
                    } else if (e.key === "Escape") {
                      setIsAddingSuggestion(false);
                    }
                  }}
                  placeholder={uiText("components_export_json_modal.input.new_suggestion_name_supports_date_time.placeholder", "New suggestion name (supports {date}, {time})...")}
                  className="flex-1 bg-[#020617] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
                <CustomizableButton
                  buttonId="export_json_modal_btn_14"
                  defaultIcon={<Check className="w-3 h-3" />}
                  type="button"
onClick={handleSaveNewSuggestion}
className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded cursor-pointer font-bold"
title={uiText("components_export_json_modal.button.save_suggestion.title", "Save suggestion")}
                />
                <CustomizableButton
                  buttonId="export_json_modal_btn_13"
                  defaultIcon={<X className="w-3 h-3" />}
                  type="button"
onClick={() => setIsAddingSuggestion(false)}
className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer"
title={uiText("components_export_json_modal.button.cancel.title", "Cancel")}
                />
              </div>
            )}

            {/* Suggestions Pills Grid */}
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {suggestions.map((sugg, index) => {
                const isEditing = editingSuggestionIndex === index;
                const resolved = resolveTemplate(sugg);
                const isCurrent = filename === resolved || filename === sugg;

                if (isEditing) {
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-slate-900 border border-cyan-500/60 rounded-lg p-0.5"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={editingSuggestionValue}
                        onChange={(e) => setEditingSuggestionValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveEditedSuggestion(index);
                          } else if (e.key === "Escape") {
                            setEditingSuggestionIndex(null);
                          }
                        }}
                        className="bg-black/60 border border-slate-700 text-cyan-300 font-mono text-[11px] px-1.5 py-0.5 rounded w-36 outline-none"
                      />
                      <CustomizableButton
                        buttonId="export_json_modal_btn_12"
                        defaultIcon={<Check className="w-3 h-3" />}
                        type="button"
onClick={() => handleSaveEditedSuggestion(index)}
className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
title={uiText("components_export_json_modal.button.save_edit.title", "Save edit")}
                      />
                      <CustomizableButton
                        buttonId="export_json_modal_btn_11"
                        defaultIcon={<X className="w-3 h-3" />}
                        type="button"
onClick={() => setEditingSuggestionIndex(null)}
className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
title={uiText("components_export_json_modal.button.cancel_edit.title", "Cancel edit")}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={index}
                    onClick={() => handleSelectSuggestion(sugg)}
                    className={cn(
                      "group text-[11px] border px-2 py-1 rounded-lg transition-all cursor-pointer font-mono flex items-center gap-1.5 select-none",
                      isCurrent
                        ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/70 shadow-xs"
                        : "bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border-slate-700/80 hover:border-slate-600"
                    )}
                    title={`Click to use "${resolved}"`}
                  >
                    <span className="truncate max-w-[170px]">{resolved}</span>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity ml-0.5">
                      <CustomizableButton
                        buttonId="export_json_modal_btn_10"
                        defaultIcon={<Pencil className="w-2.5 h-2.5" />}
                        type="button"
onClick={(e) => handleStartEditSuggestion(e, index, sugg)}
className="p-0.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-700/80 rounded cursor-pointer"
title={uiText("components_export_json_modal.button.edit_suggestion_template.title", "Edit suggestion template")}
                      />
                      <CustomizableButton
                        buttonId="export_json_modal_btn_9"
                        defaultIcon={<Trash2 className="w-2.5 h-2.5" />}
                        type="button"
onClick={(e) => handleDeleteSuggestion(e, index)}
className="p-0.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/80 rounded cursor-pointer"
title={uiText("components_export_json_modal.button.remove_suggestion.title", "Remove suggestion")}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[9.5px] text-slate-500">
              {uiText("components_export_json_modal.p.tip_click_to_apply_hover_a_suggestion_to_edi", "Tip: Click to apply. Hover a suggestion to edit or remove. Supports tokens like ")}<code className="text-slate-400 font-mono">{uiText("components_export_json_modal.code.date", "{date}")}</code>{uiText("components_export_json_modal.p.and", " and ")}<code className="text-slate-400 font-mono">{uiText("components_export_json_modal.code.time", "{time}")}</code>.
            </p>
          </div>

          {/* SECTION: Save Destination & Default Save Folder */}
          <div className="flex flex-col gap-2 bg-[#020617] p-3 rounded-xl border border-[#1e293b]/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                {uiText("components_export_json_modal.span.default_save_folder_destination", "Default Save Folder Destination:")}
              </span>
              <div className="flex items-center gap-1.5">
                <CustomizableButton
                  buttonId="export_json_modal_btn_8"
                  defaultIcon={<FolderOpen className="w-3 h-3" />}
                  type="button"
onClick={handleBrowseAndPickFolder}
className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
title={uiText("components_export_json_modal.button.browse_local_drive_to_choose_default_save_fo.title", "Browse local drive to choose default save folder")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_export_json_modal.span.browse_folder", "Browse Folder...")}</span>
                        </>
                      )}
                </CustomizableButton>
                {defaultFolderName && (
                  <CustomizableButton
                    buttonId="export_json_modal_btn_7"
                    defaultIcon={<X className="w-3 h-3" />}
                    type="button"
onClick={handleClearDefaultFolder}
className="text-[10px] text-slate-400 hover:text-rose-400 p-0.5 rounded cursor-pointer"
title={uiText("components_export_json_modal.button.clear_default_folder.title", "Clear default folder")}
                  />
                )}
              </div>
            </div>

            {/* Folder Path Display or Edit Input */}
            {isEditingFolderPath ? (
              <div className="flex items-center gap-1.5 bg-[#081220] p-1.5 rounded-lg border border-cyan-500/40">
                <input
                  type="text"
                  autoFocus
                  value={folderPathInput}
                  onChange={(e) => setFolderPathInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveManualFolderPath();
                    } else if (e.key === "Escape") {
                      setIsEditingFolderPath(false);
                    }
                  }}
                  placeholder={uiText("components_export_json_modal.input.e_g_documents_seqcarver_backups_or_seqcarver.placeholder", "e.g. Documents/SeqCarver/Backups or ~/SeqCarver...")}
                  className="flex-1 bg-[#020617] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
                <CustomizableButton
                  buttonId="export_json_modal_btn_6"
                  type="button"
onClick={handleSaveManualFolderPath}
className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded text-xs cursor-pointer"
                >
                    {() => (
                        <>
                          {uiText("components_export_json_modal.button.set", "Set")}
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="export_json_modal_btn_5"
                  defaultIcon={<X className="w-3 h-3" />}
                  type="button"
onClick={() => setIsEditingFolderPath(false)}
className="p-1 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-400 font-semibold">{uiText("components_export_json_modal.span.active_destination", "Active Destination:")}</span>
                  <span className="font-mono text-cyan-300 font-bold truncate">
                    {defaultFolderPath || defaultFolderName || "Browser Standard Downloads Folder"}
                  </span>
                </div>
                <CustomizableButton
                  buttonId="export_json_modal_btn_4"
                  type="button"
onClick={() => setIsEditingFolderPath(true)}
className="text-[10px] text-slate-400 hover:text-cyan-300 underline cursor-pointer ml-2 shrink-0"
title={uiText("components_export_json_modal.button.type_custom_folder_path.title", "Type custom folder path")}
                >
                    {() => (
                        <>
                          {uiText("components_export_json_modal.button.edit_path", "Edit Path")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            )}

            <p className="text-[9.5px] text-slate-500 flex items-center gap-1">
              <span>{uiText("components_export_json_modal.span.selected_folder_is_remembered_as_the_default", "Selected folder is remembered as the default target across sessions and restarts.")}</span>
            </p>
          </div>

          {typeof itemCount === "number" && (
            <div className="text-xs text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <span>{uiText("components_export_json_modal.span.items_to_export", "Items to Export:")}</span>
              <span className="font-bold text-emerald-400">{itemCount}{uiText("components_export_json_modal.span.items_configurations", " items / configurations")}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-[#1e293b]">
            <CustomizableButton
              buttonId="export_json_modal_btn_3"
              type="button"
onClick={onClose}
className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer text-center"
            >
                {() => (
                    <>
                      {uiText("components_export_json_modal.button.cancel", "Cancel")}
                    </>
                  )}
            </CustomizableButton>

            <div className="flex items-center gap-2">
              {/* Primary Action 1: Browse Folder & Save Locally */}
              <CustomizableButton
                buttonId="export_json_modal_btn_2"
                defaultIcon={<FolderOpen className="w-3.5 h-3.5" />}
                type="button"
onClick={handleBrowseFolderAndSave}
disabled={isSavingDirectly}
className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
title={uiText("components_export_json_modal.button.browse_local_folders_and_save_file_directly.title", "Browse local folders and save file directly via File System Access")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_export_json_modal.span.browse_folder_and_save", "Browse Folder & Save")}</span>
                      </>
                    )}
              </CustomizableButton>

              {/* Primary Action 2: Standard Download */}
              <CustomizableButton
                buttonId="export_json_modal_btn_1"
                defaultIcon={<Download className="w-3.5 h-3.5" />}
                type="submit"
disabled={isSavingDirectly}
className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
title={uiText("components_export_json_modal.button.export_and_download_json_file_to_default_fol.title", "Export & Download JSON file to default folder")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_export_json_modal.span.download_json", "Download .JSON")}</span>
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
