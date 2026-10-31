import React, { useState, useEffect, useRef } from "react";
import {
  useButtonCustomization,
} from "../context/ButtonCustomizationContext";
import {
  PRESET_ICONS,
} from "../utils/customIconRegistry";
import {
  BUTTON_DEFINITIONS,
  type ButtonCustomConfig,
} from "../types/buttonCustomization";
import { FRONT_PAGE_ICON_ONLY_BUTTON_IDS } from "../types/hardcodedDefaultConfig";
import { RadialColorPicker } from "./RadialColorPicker";
import {
  Palette,
  Type,
  Eye,
  EyeOff,
  RotateCcw,
  Upload,
  Sparkles,
  Check,
  X,
  Sliders,
  Smile,
  ShieldCheck,
  GripVertical,
  Trash2,
  RefreshCw,
  Search,
} from "lucide-react";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export function ButtonContextMenu() {
  const {
    contextMenuState,
    closeContextMenu,
    customConfigs,
    getConfig,
    getDefinition,
    getButtonLabel,
    isZeroText,
    updateButtonConfig,
    resetButtonConfig,
    toggleButtonZeroText,
    toggleButtonHideIcon,
    toggleGlobalZeroTextMode,
    showCropDragHandles,
    toggleCropDragHandles,
    showAniPlayerDragHandles,
    toggleAniPlayerDragHandles,
    showSlotHeaders,
    toggleSlotHeaders,
    showTopPanelButtons,
    toggleTopPanelButtons,
    globalSettings,
    openStudioModal,
    saveCurrentAsDefault,
    restoreAllFromSavedSetup,
  } = useButtonCustomization();

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [newLabelText, setNewLabelText] = useState("");
  const [isCustomEmojiOpen, setIsCustomEmojiOpen] = useState(false);
  const [emojiInput, setEmojiInput] = useState("");
  const [savedDefaultFeedback, setSavedDefaultFeedback] = useState(false);
  const [restoredDefaultFeedback, setRestoredDefaultFeedback] = useState<string | null>(null);

  // Default active tab: "toggles" - as requested
  const [activeTab, setActiveTab] = useState<"styles" | "icons" | "toggles" | null>("toggles");
  const [iconSearchQuery, setIconSearchQuery] = useState("");
  const [styleTargetScope, setStyleTargetScope] = useState<"single" | "category" | "all">("single");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { isOpen, buttonId } = contextMenuState;

  // Moveable state & refs
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingMenu, setIsDraggingMenu] = useState(false);
  const dragStartRef = useRef<{ startMouseX: number; startMouseY: number; startPosX: number; startPosY: number } | null>(null);
  const isDraggingRef = useRef(false);
  const lastDragEndRef = useRef(0);

  const definition = buttonId ? getDefinition(buttonId) : undefined;
  const config = buttonId ? getConfig(buttonId) : undefined;
  const activeLabel = buttonId
    ? getButtonLabel(buttonId, definition?.defaultLabel || "")
    : "";
  const isHidden = buttonId ? isZeroText(buttonId) : false;

  const handleUpdateStyle = (styleUpdates: Partial<ButtonCustomConfig>) => {
    if (!buttonId) return;
    if (styleTargetScope === "single") {
      updateButtonConfig(buttonId, styleUpdates);
    } else if (styleTargetScope === "category") {
      const def = getDefinition(buttonId);
      if (def?.category) {
        BUTTON_DEFINITIONS.filter((b) => b.category === def.category).forEach((b) => {
          updateButtonConfig(b.id, styleUpdates);
        });
      } else {
        updateButtonConfig(buttonId, styleUpdates);
      }
    } else if (styleTargetScope === "all") {
      BUTTON_DEFINITIONS.forEach((b) => {
        updateButtonConfig(b.id, styleUpdates);
      });
    }
  };

  // Always open CENTERED on the canvas rather than far right
  useEffect(() => {
    if (isOpen) {
      const menuWidth = 320;
      const menuHeight = 380;
      const centerX = Math.max(10, Math.floor((window.innerWidth - menuWidth) / 2));
      const centerY = Math.max(10, Math.floor((window.innerHeight - menuHeight) / 2));
      setPosition({ x: centerX, y: centerY });
      setActiveTab(buttonId === "header_logo" ? "icons" : "toggles");
      setIconSearchQuery("");
      setStyleTargetScope("single");
    }
  }, [isOpen, buttonId]);

  // Pointer drag event handlers for moveable panel header
  const handleHeaderPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("input") ||
      (e.target as HTMLElement).closest("label")
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    dragStartRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
    setIsDraggingMenu(true);
    isDraggingRef.current = true;
  };

  useEffect(() => {
    if (!isDraggingMenu) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.startMouseX;
      const dy = e.clientY - dragStartRef.current.startMouseY;

      const menuWidth = 320;
      const newX = Math.max(8, Math.min(window.innerWidth - menuWidth, dragStartRef.current.startPosX + dx));
      const newY = Math.max(8, Math.min(window.innerHeight - 80, dragStartRef.current.startPosY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsDraggingMenu(false);
      dragStartRef.current = null;
      lastDragEndRef.current = Date.now();
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 50);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDraggingMenu]);

  useEffect(() => {
    if (isOpen && activeLabel) {
      setNewLabelText(activeLabel);
      setIsEditingLabel(false);
      setIsCustomEmojiOpen(false);
    }
  }, [isOpen, activeLabel]);

  // Click outside to close (disabled while or immediately after dragging)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (isDraggingRef.current || Date.now() - lastDragEndRef.current < 200) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeContextMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeContextMenu]);

  if (!isOpen || !buttonId) return null;

  const isLockedIconOnly = Boolean(buttonId && FRONT_PAGE_ICON_ONLY_BUTTON_IDS.has(buttonId));
  const isHeaderLogo = buttonId === "header_logo";

  const handleQuickSelectIcon = (iconName: string) => {
    updateButtonConfig(buttonId, {
      iconName,
      customIconType: "preset",
      customIconData: undefined,
      ...(isHeaderLogo ? { hideIcon: false } : {}),
    });
  };

  const handleSaveLabel = () => {
    const trimmed = newLabelText.trim();
    if (isHeaderLogo) {
      updateButtonConfig(buttonId, { label: trimmed, hideText: trimmed.length === 0 });
    } else if (!isLockedIconOnly && trimmed) {
      updateButtonConfig(buttonId, { label: trimmed, hideText: false });
    }
    setIsEditingLabel(false);
  };

  const handleSaveAsDefault = () => {
    let updatedConfigs = { ...customConfigs };
    const trimmed = newLabelText.trim();
    if (!isLockedIconOnly && (isHeaderLogo || trimmed)) {
      const patch = isHeaderLogo
        ? { label: trimmed, hideText: trimmed.length === 0 }
        : { label: trimmed, hideText: false };
      updateButtonConfig(buttonId, patch);
      updatedConfigs[buttonId] = {
        ...(customConfigs[buttonId] || { id: buttonId }),
        ...patch,
      };
      setIsEditingLabel(false);
    }
    saveCurrentAsDefault(updatedConfigs);
    setSavedDefaultFeedback(true);
    setTimeout(() => {
      setSavedDefaultFeedback(false);
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      if (dataUri) {
        updateButtonConfig(buttonId, {
          customIconType: "image",
          customIconData: dataUri,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyEmoji = () => {
    if (emojiInput.trim()) {
      updateButtonConfig(buttonId, {
        customIconType: "emoji",
        customIconData: emojiInput.trim(),
      });
      setIsCustomEmojiOpen(false);
      setEmojiInput("");
    }
  };

  return (
    <div
      ref={menuRef}
      data-ibc-ui="true"
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
      className={cn(
        "fixed z-[9999] bg-[#090e1a]/98 border border-[#1e293b] rounded-xl shadow-2xl p-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-slate-200 select-none text-xs flex flex-col gap-1.5 max-h-[95vh] overflow-y-auto w-[312px]"
      )}
    >
      {/* 1. Header: Drag handle on left, button label in middle, close 'x' on right */}
      <div
        onPointerDown={handleHeaderPointerDown}
        className={cn(
          "flex items-center justify-between border-b border-[#1e293b] pb-1.5 px-1 cursor-grab active:cursor-grabbing select-none rounded-t-lg transition-colors shrink-0",
          isDraggingMenu ? "bg-emerald-500/15" : "hover:bg-slate-800/30"
        )}
        title={uiText("components_button_context_menu.div.click_and_drag_header_to_move_panel_anywhere.title", "Click & drag header to move panel anywhere on screen")}
      >
        <div className="flex items-center gap-1.5 min-w-0 pointer-events-none">
          <div
            className="text-slate-400 p-0.5 rounded-md transition-colors shrink-0"
            title={uiText("components_button_context_menu.div.drag_to_reposition_panel.title", "Drag to reposition panel")}
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-100 truncate text-[11.5px]">
            {activeLabel || definition?.defaultLabel || buttonId}
          </span>
        </div>

        <CustomizableButton
          buttonId="button_context_menu_btn_28"
          defaultIcon={<X className="w-3.5 h-3.5" />}
          onClick={closeContextMenu}
className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
title={uiText("components_button_context_menu.button.close_mini_customizer.title", "Close mini customizer")}
        />
      </div>

      {isHeaderLogo && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[10px] font-medium shrink-0">
          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>{uiText("components_button_context_menu.span.permanent_default_logo_changes_auto_saved_to", "Logo text & icon changes auto-save to defaults")}</span>
        </div>
      )}

      {/* 2. Inline Label Editing (enabled for Logo and non-locked buttons; hidden on icon-only front page controls) */}
      {isLockedIconOnly ? (
        <div className="px-2.5 py-1.5 rounded-xl text-[10px] text-slate-400 bg-[#020617]/60 border border-slate-800/80 shrink-0">
          {uiText("components_button_context_menu.div.front_page_controls_display_icons_only_right", "Front page controls display icons only. Right-click Logo to edit text & icon.")}
        </div>
      ) : isEditingLabel ? (
        <div className="flex items-center gap-1 bg-[#020617] p-1.5 rounded-xl border border-emerald-500/50 shrink-0">
          <input
            type="text"
            value={newLabelText}
            onChange={(e) => setNewLabelText(e.target.value)}
            placeholder={uiText("components_button_context_menu.input.enter_custom_button_label.placeholder", "Enter custom button label...")}
            className="flex-1 bg-transparent text-xs text-emerald-300 font-semibold focus:outline-none px-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveLabel();
              if (e.key === "Escape") setIsEditingLabel(false);
            }}
          />
          <CustomizableButton
            buttonId="button_context_menu_btn_27"
            defaultIcon={<Check className="w-3 h-3" />}
            onClick={handleSaveLabel}
className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors cursor-pointer"
title={uiText("components_button_context_menu.button.save_custom_label.title", "Save custom label")}
          />
          <CustomizableButton
            buttonId="button_context_menu_btn_26"
            defaultIcon={<X className="w-3 h-3" />}
            onClick={() => setIsEditingLabel(false)}
className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-md transition-colors cursor-pointer"
title={uiText("components_button_context_menu.button.cancel.title", "Cancel")}
          />
        </div>
      ) : (
        <CustomizableButton
          buttonId="button_context_menu_btn_25"
          onClick={() => {
            setNewLabelText(activeLabel || definition?.defaultLabel || "");
            setIsEditingLabel(true);
          }}
className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-200 hover:bg-[#020617] hover:text-emerald-300 border border-slate-800/80 hover:border-emerald-500/30 transition-all text-left group bg-[#020617]/40 shrink-0 cursor-pointer"
title={uiText("components_button_context_menu.button.click_to_rename_button_label.title", "Click to rename button label")}
        >
            {() => (
                <>
                  <span className="flex items-center gap-2">
            <Type className="w-3.5 h-3.5 text-emerald-400" />
            <span>{uiText("components_button_context_menu.span.rename_label", "Rename Label")}</span>
          </span>
                <span className="text-[10px] text-slate-400 font-mono group-hover:text-emerald-400">
            {uiText("components_button_context_menu.span.edit", "Edit »")}
          </span>
                </>
              )}
        </CustomizableButton>
      )}

      {/* 3. Compact Segmented Mode Selector: Side-by-Side to Save Real Estate */}
      <div className="grid grid-cols-3 gap-1 bg-[#020617] p-1 rounded-xl border border-slate-800/90 shrink-0">
        <CustomizableButton
          buttonId="button_context_menu_btn_24"
          defaultIcon={<Palette className="w-3 h-3 text-cyan-400 shrink-0" />}
          type="button"
onClick={() => setActiveTab((prev) => (prev === "styles" ? null : "styles"))}
className={cn(
            "py-1.5 px-1 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border min-w-0",
            activeTab === "styles"
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-xs"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          )}
title={uiText("components_button_context_menu.button.styles_and_colors_palette.title", "Styles & Colors Palette")}
        >
            {() => (
                <>
                  <span className="truncate">{uiText("components_button_context_menu.span.styles", "Styles")}</span>
                </>
              )}
        </CustomizableButton>

        <CustomizableButton
          buttonId="button_context_menu_btn_23"
          defaultIcon={<Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />}
          type="button"
onClick={() => setActiveTab((prev) => (prev === "icons" ? null : "icons"))}
className={cn(
            "py-1.5 px-1 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border min-w-0",
            activeTab === "icons"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          )}
title={uiText("components_button_context_menu.button.icon_selector_library.title", "Icon Selector Library")}
        >
            {() => (
                <>
                  <span className="truncate">{uiText("components_button_context_menu.span.icons", "Icons")}</span>
                </>
              )}
        </CustomizableButton>

        <CustomizableButton
          buttonId="button_context_menu_btn_22"
          defaultIcon={<Sliders className="w-3 h-3 text-purple-400 shrink-0" />}
          type="button"
onClick={() => setActiveTab((prev) => (prev === "toggles" ? null : "toggles"))}
className={cn(
            "py-1.5 px-1 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border min-w-0",
            activeTab === "toggles"
              ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-xs"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          )}
title={uiText("components_button_context_menu.button.advanced_toggles_and_handles.title", "Advanced Toggles & Handles")}
        >
            {() => (
                <>
                  <span className="truncate">{uiText("components_button_context_menu.span.toggles", "Toggles")}</span>
                </>
              )}
        </CustomizableButton>
      </div>

      {/* 4. TAB 1: Styles & Colors */}
      {activeTab === "styles" && (
        <div className="flex flex-col gap-2 p-2 bg-[#020617] rounded-xl border border-slate-800 animate-in fade-in duration-150 shrink-0">
          {/* Quick Style Presets Swatches */}
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9.5px] text-slate-400 font-mono">{uiText("components_button_context_menu.span.1_click", "1-Click:")}</span>
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { label: "Cyan", bg: "#082f49", text: "#38bdf8", border: "#00f0ff", accent: "#00f0ff" },
                { label: "Mint", bg: "#064e3b", text: "#6ee7b7", border: "#10b981", accent: "#10b981" },
                { label: "Amber", bg: "#451a03", text: "#fcd34d", border: "#f59e0b", accent: "#f59e0b" },
                { label: "Pink", bg: "#4c0519", text: "#f472b6", border: "#ec4899", accent: "#ec4899" },
                { label: "Dark", bg: "#0f172a", text: "#e2e8f0", border: "#334155", accent: "#64748b" },
              ].map((s) => (
                <CustomizableButton
                  buttonId="button_context_menu_btn_21"
                  key={s.label}
type="button"
onClick={() => {
                    handleUpdateStyle({
                      backgroundColor: s.bg,
                      textColor: s.text,
                      borderColor: s.border,
                      accentColor: s.accent,
                    });
                  }}
style={{ backgroundColor: s.bg, borderColor: s.border }}
className="w-4 h-4 rounded-md border hover:scale-125 transition-transform cursor-pointer shadow-xs"
title={`Apply ${s.label} color theme`}
                />
              ))}
              <CustomizableButton
                buttonId="button_context_menu_btn_20"
                defaultLabel={"✕"}
                type="button"
onClick={() => {
                  handleUpdateStyle({
                    backgroundColor: undefined,
                    textColor: undefined,
                    borderColor: undefined,
                    accentColor: undefined,
                  });
                }}
className="w-4 h-4 rounded-md bg-slate-900 border border-slate-700 text-[8px] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
title={uiText("components_button_context_menu.button.reset_style.title", "Reset style")}
              />
            </div>
          </div>

          {/* Target Scope Switcher (Side-by-Side) */}
          <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-800/80">
            <span className="text-[9.5px] text-slate-400 font-mono">{uiText("components_button_context_menu.span.scope", "Scope:")}</span>
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[9px]">
              <CustomizableButton
                buttonId="button_context_menu_btn_19"
                type="button"
onClick={() => setStyleTargetScope("single")}
className={cn(
                  "px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer",
                  styleTargetScope === "single"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                )}
title={uiText("components_button_context_menu.button.apply_only_to_this_inspected_element.title", "Apply only to this inspected element")}
              >
                  {() => (
                      <>
                        {uiText("components_button_context_menu.button.this_button", "This Button")}
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="button_context_menu_btn_18"
                type="button"
onClick={() => setStyleTargetScope("category")}
className={cn(
                  "px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer",
                  styleTargetScope === "category"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                )}
title={`Apply to all elements in category (${definition?.category || "current"})`}
              >
                  {() => (
                      <>
                        {uiText("components_button_context_menu.button.category", "Category")}
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="button_context_menu_btn_17"
                type="button"
onClick={() => setStyleTargetScope("all")}
className={cn(
                  "px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer",
                  styleTargetScope === "all"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                )}
title={uiText("components_button_context_menu.button.apply_to_all_buttons_across_entire_app.title", "Apply to all buttons across entire app")}
              >
                  {() => (
                      <>
                        {uiText("components_button_context_menu.button.all", "All")}
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>

          {/* Minimalist Drawing-Tool Radial Dial Trigger & Channels */}
          <div className="pt-2 border-t border-slate-800/80">
            <RadialColorPicker
              currentConfig={config}
              onUpdateStyle={handleUpdateStyle}
              selectedCount={
                styleTargetScope === "single"
                  ? 1
                  : styleTargetScope === "category"
                  ? BUTTON_DEFINITIONS.filter((b) => b.category === definition?.category).length
                  : BUTTON_DEFINITIONS.length
              }
            />
          </div>
        </div>
      )}

      {/* 5. TAB 2: Icon Selector Library */}
      {activeTab === "icons" && (
        <div className="flex flex-col gap-2 p-2 bg-[#020617] rounded-xl border border-slate-800 animate-in fade-in duration-150 shrink-0">
          {/* Quick Icon Search */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={iconSearchQuery}
              onChange={(e) => setIconSearchQuery(e.target.value)}
              placeholder={uiText("components_button_context_menu.input.search_icons.placeholder", "Search icons...")}
              className="w-full bg-[#040814] border border-[#1e293b] focus:border-emerald-500/50 rounded-lg pl-7 pr-2 py-1 text-[10px] text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Quick Icon Selector Palette Grid (7 cols) */}
          <div className="flex flex-col gap-1 bg-[#040814]/90 p-1.5 rounded-xl border border-[#1e293b] max-h-36 overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-7 gap-1 pt-0.5">
              {PRESET_ICONS.filter((iconObj) => {
                if (!iconSearchQuery.trim()) return true;
                const q = iconSearchQuery.toLowerCase();
                return (
                  iconObj.name.toLowerCase().includes(q) ||
                  iconObj.label.toLowerCase().includes(q) ||
                  iconObj.category.toLowerCase().includes(q)
                );
              }).map((iconObj) => {
                const isSelected =
                  config?.iconName === iconObj.name && config?.customIconType !== "image";

                return (
                  <CustomizableButton
                    buttonId="button_context_menu_btn_16"
                    key={iconObj.name}
onClick={() => handleQuickSelectIcon(iconObj.name)}
className={cn(
                      "p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer border",
                      isSelected
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-xs"
                        : "bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border-transparent"
                    )}
title={`Select ${iconObj.label} (${iconObj.name})`}
                  >
                      {() => (
                          <>
                            <iconObj.component className="w-3.5 h-3.5" />
                          </>
                        )}
                  </CustomizableButton>
                );
              })}
            </div>
          </div>

          {/* Upload & Emoji Icon Row: Side-by-Side and Compact */}
          {isCustomEmojiOpen ? (
            <div className="flex items-center gap-1 bg-[#040814] p-1.5 rounded-xl border border-amber-500/50">
              <input
                type="text"
                value={emojiInput}
                onChange={(e) => setEmojiInput(e.target.value)}
                placeholder={uiText("components_button_context_menu.input.type_emoji_e_g.placeholder", "Type emoji (e.g. ✂️, ⚡)...")}
                className="flex-1 bg-transparent text-xs text-amber-300 font-semibold focus:outline-none px-1"
                autoFocus
                maxLength={4}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyEmoji();
                  if (e.key === "Escape") setIsCustomEmojiOpen(false);
                }}
              />
              <CustomizableButton
                buttonId="button_context_menu_btn_15"
                defaultIcon={<Check className="w-3 h-3" />}
                onClick={handleApplyEmoji}
className="p-1 bg-amber-600 hover:bg-amber-500 text-white rounded-md transition-colors cursor-pointer"
title={uiText("components_button_context_menu.button.set_custom_emoji.title", "Set custom emoji")}
              />
              <CustomizableButton
                buttonId="button_context_menu_btn_14"
                defaultIcon={<X className="w-3 h-3" />}
                onClick={() => setIsCustomEmojiOpen(false)}
className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-md transition-colors cursor-pointer"
title={uiText("components_button_context_menu.button.cancel.title_2", "Cancel")}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {/* Upload Custom Image Icon */}
              <CustomizableLabel
                labelId="button_context_menu_item_13"
                defaultIcon={<Upload className="w-3 h-3 text-cyan-400 shrink-0" />}
                as="label"
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-[10.5px] font-semibold text-slate-300 bg-[#040814] hover:bg-[#0f172a] hover:text-cyan-300 border border-[#1e293b] hover:border-cyan-500/30 transition-all cursor-pointer shadow-xs text-center"
title={uiText("components_button_context_menu.label.upload_custom_icon_image_file_png_svg_jpg.title", "Upload custom icon image file (PNG, SVG, JPG)")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_button_context_menu.span.upload_icon", "Upload Icon")}</span>
                      <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.svg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                      </>
                    )}
              </CustomizableLabel>

              {/* Emoji Icon */}
              <CustomizableButton
                buttonId="button_context_menu_btn_12"
                defaultIcon={<Smile className="w-3 h-3 text-amber-400 shrink-0" />}
                onClick={() => setIsCustomEmojiOpen(true)}
className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-[10.5px] font-semibold text-slate-300 bg-[#040814] hover:bg-[#0f172a] hover:text-amber-300 border border-[#1e293b] hover:border-amber-500/30 transition-all cursor-pointer shadow-xs text-center"
title={uiText("components_button_context_menu.button.set_single_emoji_as_button_icon.title", "Set single emoji as button icon")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_button_context_menu.span.emoji_icon", "Emoji Icon")}</span>
                      </>
                    )}
              </CustomizableButton>
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 3: Advanced Toggles & Handles - Side-by-Side 2-Column Grid (New Positions) */}
      {activeTab === "toggles" && (
        <div className="flex flex-col gap-1.5 p-2 bg-[#020617] rounded-xl border border-slate-800 animate-in fade-in duration-150 shrink-0">
          {/* Individual Button Zero-Text (when button supports text customization) */}
          {!isLockedIconOnly && (
            <CustomizableButton
              buttonId="button_context_menu_btn_11"
              type="button"
              onClick={() => toggleButtonZeroText(buttonId)}
              className={cn(
                "w-full flex items-center justify-between p-1.5 rounded-lg border transition-all text-left cursor-pointer min-w-0",
                isHidden
                  ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-300"
                  : "bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700"
              )}
              title={uiText("components_button_context_menu.button.toggle_zero_text_mode_for_this_button.title", "Toggle Zero-Text mode for this button")}
            >
              {() => (
                <>
                  <div className="flex items-center gap-1 min-w-0">
                    {isHidden ? <Eye className="w-3 h-3 text-indigo-400 shrink-0" /> : <EyeOff className="w-3 h-3 text-slate-500 shrink-0" />}
                    <span className="text-[9.5px] font-bold truncate">{uiText("components_button_context_menu.span.zero_text", "Zero-Text")} (This Button)</span>
                  </div>
                  <span className={cn(
                    "text-[8px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0",
                    isHidden ? "bg-indigo-500/25 text-indigo-300" : "bg-slate-800 text-slate-500"
                  )}>
                    {isHidden ? "OFF" : "ON"}
                  </span>
                </>
              )}
            </CustomizableButton>
          )}

          {/* 2-Column Grid (Row 1: Global Zero & Icon, Row 2: Crop Handles & Ani Handles, Row 3: Slot Panel Header Bars & Top Panel) */}
          <div className="grid grid-cols-2 gap-1.5">
            {/* Row 1 Col 1: Global Zero-Text */}
            <CustomizableButton
              buttonId="button_context_menu_btn_10"
              type="button"
              onClick={toggleGlobalZeroTextMode}
              className={cn(
                "flex items-center justify-between p-1.5 rounded-lg border transition-all text-left cursor-pointer min-w-0",
                globalSettings.globalZeroTextMode
                  ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-300"
                  : "bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700"
              )}
              title={uiText("components_button_context_menu.button.toggle_global_zero_text_mode_for_all_buttons.title", "Toggle Global Zero-Text mode for all buttons")}
            >
              {() => (
                <>
                  <div className="flex items-center gap-1 min-w-0">
                    <Sliders className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="text-[9.5px] font-bold truncate">{uiText("components_button_context_menu.span.global_zero", "Global Zero")}</span>
                  </div>
                  <span className={cn(
                    "text-[8px] font-mono font-bold px-1 py-0.2 rounded shrink-0",
                    globalSettings.globalZeroTextMode ? "bg-cyan-500/25 text-cyan-300" : "bg-slate-800 text-slate-500"
                  )}>
                    {globalSettings.globalZeroTextMode ? "ON" : "OFF"}
                  </span>
                </>
              )}
            </CustomizableButton>

            {/* Row 1 Col 2: Icon Show/Hide (with or without text throughout entirety of application) */}
            <CustomizableButton
              buttonId="button_context_menu_btn_9"
              type="button"
              onClick={() => toggleButtonHideIcon(buttonId)}
              className={cn(
                "flex items-center justify-between p-1.5 rounded-lg border transition-all text-left cursor-pointer min-w-0",
                !config?.hideIcon
                  ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                  : "bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700"
              )}
              title="Show or hide icon for this button or label (with or without text)"
            >
              {() => (
                <>
                  <div className="flex items-center gap-1 min-w-0">
                    {config?.hideIcon ? (
                      <EyeOff className="w-3 h-3 text-slate-400 shrink-0" />
                    ) : (
                      <Eye className="w-3 h-3 text-emerald-400 shrink-0" />
                    )}
                    <span className="text-[9.5px] font-bold truncate">Icon</span>
                  </div>
                  <span className={cn(
                    "text-[8px] font-mono font-bold px-1 py-0.2 rounded shrink-0",
                    !config?.hideIcon ? "bg-emerald-500/25 text-emerald-300" : "bg-slate-800 text-slate-400"
                  )}>
                    {config?.hideIcon ? "HIDDEN" : "SHOWN"}
                  </span>
                </>
              )}
            </CustomizableButton>

            {/* Row 2 Col 1: Crop Drag Handles */}
            <CustomizableButton
              buttonId="button_context_menu_btn_7"
              type="button"
              onClick={toggleCropDragHandles}
              className={cn(
                "flex items-center justify-between p-1.5 rounded-lg border transition-all text-left cursor-pointer min-w-0",
                showCropDragHandles
                  ? "bg-teal-950/40 border-teal-500/50 text-teal-300"
                  : "bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700"
              )}
              title={uiText("components_button_context_menu.button.toggle_visibility_of_drag_and_drop_handles_i.title", "Toggle visibility of drag & drop handles in Crop section")}
            >
              {() => (
                <>
                  <div className="flex items-center gap-1 min-w-0">
                    <GripVertical className="w-3 h-3 text-teal-400 shrink-0" />
                    <span className="text-[9.5px] font-bold truncate">{uiText("components_button_context_menu.span.crop_handles", "Crop Handles")}</span>
                  </div>
                  <span className={cn(
                    "text-[8px] font-mono font-bold px-1 py-0.2 rounded shrink-0",
                    showCropDragHandles ? "bg-teal-500/25 text-teal-300" : "bg-slate-800 text-slate-500"
                  )}>
                    {showCropDragHandles ? "ON" : "OFF"}
                  </span>
                </>
              )}
            </CustomizableButton>

            {/* Row 2 Col 2: AniPlayer Drag Handles */}
            <CustomizableButton
              buttonId="button_context_menu_btn_6"
              type="button"
              onClick={toggleAniPlayerDragHandles}
              className={cn(
                "flex items-center justify-between p-1.5 rounded-lg border transition-all text-left cursor-pointer min-w-0",
                showAniPlayerDragHandles
                  ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-300"
                  : "bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700"
              )}
              title={uiText("components_button_context_menu.button.toggle_visibility_of_drag_and_drop_handles_i.title_2", "Toggle visibility of drag & drop handles in AniPlayer panels")}
            >
              {() => (
                <>
                  <div className="flex items-center gap-1 min-w-0">
                    <GripVertical className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="text-[9.5px] font-bold truncate">{uiText("components_button_context_menu.span.ani_handles", "Ani Handles")}</span>
                  </div>
                  <span className={cn(
                    "text-[8px] font-mono font-bold px-1 py-0.2 rounded shrink-0",
                    showAniPlayerDragHandles ? "bg-cyan-500/25 text-cyan-300" : "bg-slate-800 text-slate-500"
                  )}>
                    {showAniPlayerDragHandles ? "ON" : "OFF"}
                  </span>
                </>
              )}
            </CustomizableButton>

            {/* Row 3 Col 1: Slot Panel Headers */}
            <CustomizableButton
              buttonId="button_context_menu_btn_5"
              type="button"
              onClick={toggleSlotHeaders}
              className={cn(
                "flex items-center justify-between p-1.5 rounded-lg border transition-all text-left cursor-pointer min-w-0",
                showSlotHeaders
                  ? "bg-rose-950/30 border-rose-500/40 text-rose-300"
                  : "bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700"
              )}
              title={uiText("components_button_context_menu.button.toggle_visibility_of_slot_panel_header_bars.title", "Toggle visibility of slot panel header bars with trashcans and actions")}
            >
              {() => (
                <>
                  <div className="flex items-center gap-1 min-w-0">
                    <Trash2 className="w-3 h-3 text-rose-400 shrink-0" />
                    <span className="text-[9.5px] font-bold truncate">{uiText("components_button_context_menu.span.slot_panel_header_bars", "Slot Panel Header Bars")}</span>
                  </div>
                  <span className={cn(
                    "text-[8px] font-mono font-bold px-1 py-0.2 rounded shrink-0",
                    showSlotHeaders ? "bg-rose-500/25 text-rose-300" : "bg-slate-800 text-slate-500"
                  )}>
                    {showSlotHeaders ? "SHOWN" : "HIDDEN"}
                  </span>
                </>
              )}
            </CustomizableButton>

            {/* Row 3 Col 2: Top Panel Buttons */}
            <CustomizableButton
              buttonId="button_context_menu_btn_8"
              type="button"
              onClick={toggleTopPanelButtons}
              className={cn(
                "flex items-center justify-between p-1.5 rounded-lg border transition-all text-left cursor-pointer min-w-0",
                showTopPanelButtons
                  ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                  : "bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700"
              )}
              title={uiText("components_button_context_menu.button.show_or_hide_top_panel_slot_buttons.title", "Show or hide top panel slot buttons")}
            >
              {() => (
                <>
                  <div className="flex items-center gap-1 min-w-0">
                    {showTopPanelButtons ? <Eye className="w-3 h-3 text-emerald-400 shrink-0" /> : <EyeOff className="w-3 h-3 text-slate-500 shrink-0" />}
                    <span className="text-[9.5px] font-bold truncate">{uiText("components_button_context_menu.span.top_panel", "Top Panel")}</span>
                  </div>
                  <span className={cn(
                    "text-[8px] font-mono font-bold px-1 py-0.2 rounded shrink-0",
                    showTopPanelButtons ? "bg-emerald-500/25 text-emerald-300" : "bg-slate-800 text-slate-500"
                  )}>
                    {showTopPanelButtons ? "SHOWN" : "HIDDEN"}
                  </span>
                </>
              )}
            </CustomizableButton>
          </div>
        </div>
      )}

      {/* 7. Dedicated Execution & State Actions Bar: 4 Buttons Side-by-Side and Compact */}
      <div className="grid grid-cols-4 gap-1 pt-1 border-t border-[#1e293b] shrink-0">
        {/* Button 1: Save as Default */}
        <CustomizableButton
          buttonId="button_context_menu_btn_4"
          defaultIcon={<ShieldCheck className="w-3 h-3 mb-0.5 text-emerald-400 shrink-0" />}
          type="button"
onClick={handleSaveAsDefault}
className={cn(
            "flex flex-col items-center justify-center py-1 px-1 rounded-lg text-center transition-all cursor-pointer border min-w-0 active:scale-95",
            savedDefaultFeedback
              ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
              : "bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-500/40 text-emerald-300 hover:text-emerald-200"
          )}
title={uiText("components_button_context_menu.button.save_all_button_labels_icons_zero_text_and_l.title", "Save all button labels, icons, zero-text, and layout customizations as permanent defaults that persist across updates and reloads")}
        >
            {() => (
                <>
                  <span className="text-[9px] font-bold leading-tight truncate w-full">
            {savedDefaultFeedback ? "Saved!" : "Save Def"}
          </span>
                </>
              )}
        </CustomizableButton>

        {/* Button 2: Restore Saved Setup */}
        <CustomizableButton
          buttonId="button_context_menu_btn_3"
          defaultIcon={<RotateCcw className="w-3 h-3 mb-0.5 text-cyan-400 shrink-0" />}
          type="button"
onClick={() => {
            const res = restoreAllFromSavedSetup();
            setRestoredDefaultFeedback(res.success ? "Restored!" : "No Setup");
            setTimeout(() => {
              setRestoredDefaultFeedback(null);
            }, 1200);
          }}
className={cn(
            "flex flex-col items-center justify-center py-1 px-1 rounded-lg text-center transition-all cursor-pointer border min-w-0 active:scale-95",
            restoredDefaultFeedback
              ? "bg-cyan-500/30 border-cyan-400 text-cyan-200"
              : "bg-cyan-950/40 hover:bg-cyan-900/60 border-cyan-500/40 text-cyan-300 hover:text-cyan-200"
          )}
title={uiText("components_button_context_menu.button.restore_all_button_labels_icons_zero_text_an.title", "Restore all button labels, icons, zero-text and layout settings from your saved setup across the entire application")}
        >
            {() => (
                <>
                  <span className="text-[9px] font-bold leading-tight truncate w-full">
            {restoredDefaultFeedback || "Restore"}
          </span>
                </>
              )}
        </CustomizableButton>

        {/* Button 3: Full Customizer Studio */}
        <CustomizableButton
          buttonId="button_context_menu_btn_2"
          defaultIcon={<Palette className="w-3 h-3 mb-0.5 text-purple-400 shrink-0" />}
          type="button"
onClick={() => {
            closeContextMenu();
            openStudioModal(buttonId);
          }}
className="flex flex-col items-center justify-center py-1 px-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 hover:text-purple-200 text-center transition-all cursor-pointer min-w-0 active:scale-95"
title={uiText("components_button_context_menu.button.open_full_button_customizer_studio.title", "Open Full Button Customizer Studio")}
        >
            {() => (
                <>
                  <span className="text-[9px] font-bold leading-tight truncate w-full">{uiText("components_button_context_menu.span.studio", "Studio")}</span>
                </>
              )}
        </CustomizableButton>

        {/* Button 4: Reset Button */}
        <CustomizableButton
          buttonId="button_context_menu_btn_1"
          defaultIcon={<RefreshCw className="w-3 h-3 mb-0.5 text-slate-400 hover:text-rose-400 shrink-0" />}
          type="button"
onClick={() => {
            resetButtonConfig(buttonId);
            closeContextMenu();
          }}
className="flex flex-col items-center justify-center py-1 px-1 rounded-lg bg-slate-900/80 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-center transition-all cursor-pointer min-w-0 active:scale-95"
title={uiText("components_button_context_menu.button.reset_this_button_to_original_default_icon_a.title", "Reset this button to original default icon & label")}
        >
            {() => (
                <>
                  <span className="text-[9px] font-bold leading-tight truncate w-full">{uiText("components_button_context_menu.span.reset", "Reset")}</span>
                </>
              )}
        </CustomizableButton>
      </div>
    </div>
  );
}
