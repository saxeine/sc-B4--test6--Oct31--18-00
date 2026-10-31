import React, { useState, useEffect } from "react";
import {
  X,
  Keyboard,
  RotateCcw,
  Check,
  Save,
  Sliders,
  Zap,
} from "lucide-react";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { remoteStore } from "../services/remoteKeyValueStore";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export interface ShortcutBinding {
  id: string;
  actionName: string;
  category: "navigation" | "slicing" | "studios" | "frame";
  key: string; // Key combination e.g. "c", "s", "1", "ctrl+z"
  description: string;
}

export const DEFAULT_SHORTCUTS: ShortcutBinding[] = [
  { id: "mode_crop", actionName: "Switch to Crop Mode", category: "navigation", key: "c", description: "Jump directly to Crop workspace" },
  { id: "mode_carve", actionName: "Switch to Carve Mode", category: "navigation", key: "s", description: "Jump directly to Carve / Split Grid workspace" },
  { id: "mode_storyboard", actionName: "Switch to Storyboard", category: "navigation", key: "b", description: "Jump directly to Storyboard matrix workspace" },
  { id: "auto_slice", actionName: "Trigger Optical Auto-Slice", category: "slicing", key: "a", description: "Run optical boundary sprite auto-slice" },
  { id: "smart_trim", actionName: "Trigger Smart Auto-Crop", category: "slicing", key: "t", description: "Run alpha padding smart trim" },
  { id: "frame_prev", actionName: "Previous Storyboard Frame", category: "frame", key: "ArrowLeft", description: "Navigate to previous frame in sequence" },
  { id: "frame_next", actionName: "Next Storyboard Frame", category: "frame", key: "ArrowRight", description: "Navigate to next frame in sequence" },
  { id: "open_anicomposer", actionName: "Launch AniComposer Studio", category: "studios", key: "1", description: "Open Sprite Animator & AniComposer Studio" },
  { id: "open_tracestudio", actionName: "Launch Trace & Swatch Studio", category: "studios", key: "2", description: "Open Trace & Color Swatch Studio" },
  { id: "open_parallax", actionName: "Launch 2.5D Parallax Studio", category: "studios", key: "3", description: "Open 2.5D Depth & Parallax Studio" },
  { id: "open_contour", actionName: "Launch Smart Contour Slicer", category: "studios", key: "4", description: "Open Smart Contour Auto-Slicer" },
];

export const SHORTCUTS_STORAGE_KEY = "seqcarver_custom_shortcuts_v1";

interface ShortcutManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: ShortcutBinding[];
  onSaveShortcuts?: (updated: ShortcutBinding[]) => void;
}

export const ShortcutManagerModal: React.FC<ShortcutManagerModalProps> = ({
  isOpen,
  onClose,
  onSaveShortcuts,
}) => {
  const [bindings, setBindings] = useState<ShortcutBinding[]>(() => {
    try {
      const stored = remoteStore.getItem(SHORTCUTS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      return DEFAULT_SHORTCUTS;
    } catch {
      return DEFAULT_SHORTCUTS;
    }
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [pressedKey, setPressedKey] = useState<string>("");
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Capture Keypress when recording custom hotkey
  useEffect(() => {
    if (!editingId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let key = e.key;
      if (key === " ") key = "Space";
      if (key.length === 1) key = key.toLowerCase();

      setPressedKey(key);
      setBindings((prev) =>
        prev.map((b) => (b.id === editingId ? { ...b, key } : b))
      );
      setEditingId(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingId]);

  if (!isOpen) return null;

  const handleResetDefaults = () => {
    setBindings(DEFAULT_SHORTCUTS);
    remoteStore.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(DEFAULT_SHORTCUTS));
  };

  const handleSave = () => {
    remoteStore.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(bindings));
    if (onSaveShortcuts) onSaveShortcuts(bindings);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <CustomizableLabel
                labelId="shortcut_manager_modal_item_6"
                as="h2"
                className="text-base font-bold text-white flex items-center gap-2"
              >
                  {() => (
                      <>
                        {uiText("components_shortcut_manager_modal.h2.custom_keyboard_shortcut_manager", "Custom Keyboard Shortcut Manager")}
                      <span className="text-[10px] uppercase font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  {uiText("components_shortcut_manager_modal.span.hotkeys", "Hotkeys")}
                </span>
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-xs text-slate-400">
                {uiText("components_shortcut_manager_modal.p.configure_global_one_key_hotkeys_for_fast_mo", "Configure global one-key hotkeys for fast mode switching, slicing & studio launches")}
              </p>
            </div>
          </div>
          <CustomizableButton
            buttonId="shortcut_manager_modal_btn_5"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          />
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {editingId && (
            <div className="p-3 bg-amber-500/20 border border-amber-500/40 text-amber-200 rounded-xl text-xs font-bold flex items-center justify-between animate-pulse">
              <span>{uiText("components_shortcut_manager_modal.span.press_any_key_on_your_keyboard_to_set_new_ho", "Press any key on your keyboard to set new hotkey...")}</span>
              <CustomizableButton
                buttonId="shortcut_manager_modal_btn_4"
                onClick={() => setEditingId(null)}
className="text-slate-400 hover:text-white text-[11px] underline"
              >
                  {() => (
                      <>
                        {uiText("components_shortcut_manager_modal.button.cancel", "Cancel")}
                      </>
                    )}
              </CustomizableButton>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2.5">
            {bindings.map((b) => (
              <div
                key={b.id}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    {b.actionName}
                    <span className="text-[9px] uppercase font-semibold px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                      {b.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{b.description}</p>
                </div>

                <CustomizableButton
                  buttonId="shortcut_manager_modal_btn_3"
                  onClick={() => setEditingId(b.id)}
className={cn(
                    "px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer min-w-[70px] text-center shadow",
                    editingId === b.id
                      ? "bg-amber-500 text-slate-950 border-amber-400 scale-105"
                      : "bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700"
                  )}
                >
                    {() => (
                        <>
                          {editingId === b.id ? "Press Key..." : b.key.toUpperCase()}
                        </>
                      )}
                </CustomizableButton>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 text-xs shrink-0">
          <CustomizableButton
            buttonId="shortcut_manager_modal_btn_2"
            defaultIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleResetDefaults}
className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
              {() => (
                  <>
                    {uiText("components_shortcut_manager_modal.button.reset_default_hotkeys", "Reset Default Hotkeys")}
                  </>
                )}
          </CustomizableButton>

          <CustomizableButton
            buttonId="shortcut_manager_modal_btn_1"
            onClick={handleSave}
className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
          >
              {() => (
                  <>
                    {isSaved ? <Check className="w-4 h-4 text-emerald-950" /> : <Save className="w-4 h-4" />}
                  {isSaved ? "Saved!" : "Save Shortcut Hotkeys"}
                  </>
                )}
          </CustomizableButton>
        </div>
      </div>
    </div>
  );
};
