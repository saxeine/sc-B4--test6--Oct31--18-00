import React, { useState, useRef, useEffect } from "react";
import { Zap } from "lucide-react";
import { useButtonCustomization } from "../context/ButtonCustomizationContext";
import { renderCustomIcon } from "../utils/customIconRegistry";
import {
  getButtonFontSizeClass,
  getButtonIconSizeClass,
  getComponentPaddingClass,
  getComponentRadiusClass,
  getComponentFontWeightClass,
} from "../types/buttonCustomization";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { componentDataAttributes } from "../types/componentIndex";
import { getComponentIdForButton } from "../types/componentLookup";

const INERT_GLOW_VALUES = new Set([
  "",
  "none",
  "transparent",
  "#151719",
  "#000000",
  "#020617",
  "#080d1a",
  "#090e1a",
  "#0f172a",
]);

function hasActiveGlow(color?: string): boolean {
  if (!color) return false;
  return !INERT_GLOW_VALUES.has(color.trim().toLowerCase());
}

export interface CustomizableLogoProps {
  onClick?: () => void;
  className?: string;
  disableGlow?: boolean;
}

export function CustomizableLogo({ onClick, className, disableGlow = false }: CustomizableLogoProps) {
  const {
    getConfig,
    getDefinition,
    getButtonLabel,
    isZeroText,
    updateButtonConfig,
    openContextMenuForButton,
    openStudioModal,
    globalFontSize,
    globalIconSize,
  } = useButtonCustomization();

  const buttonId = "header_logo";
  const config = getConfig(buttonId);
  const def = getDefinition?.(buttonId);
  const fallbackLabel = def?.defaultLabel || "SeqCarver 26 oct";
  const activeLabel = getButtonLabel(buttonId, fallbackLabel) || "SeqCarver 26 oct";

  const [isEditingInline, setIsEditingInline] = useState(false);
  const [draftLabel, setDraftLabel] = useState(activeLabel);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditingInline) {
      setDraftLabel(activeLabel);
    }
  }, [activeLabel, isEditingInline]);

  useEffect(() => {
    if (isEditingInline && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingInline]);

  if (config?.hidden) {
    return null;
  }

  const isIconHidden = config?.hideIcon === true;

  let isTextHidden: boolean;
  if (isIconHidden) {
    isTextHidden = false;
  } else if (config && typeof config.hideText === "boolean") {
    isTextHidden = config.hideText;
  } else if (activeLabel.trim().length > 0) {
    isTextHidden = false;
  } else {
    isTextHidden = isZeroText(buttonId);
  }

  const commitInlineLabel = () => {
    const trimmed = draftLabel.trim();
    updateButtonConfig(buttonId, {
      label: trimmed,
      hideText: trimmed.length === 0,
    });
    setIsEditingInline(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.shiftKey) {
      openStudioModal(buttonId);
    } else {
      openContextMenuForButton(e, buttonId);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraftLabel(activeLabel);
    setIsEditingInline(true);
  };

  const customIconSizeClass = getButtonIconSizeClass(config?.iconSize);
  const globalIconSizeClass =
    globalIconSize && globalIconSize !== "normal" ? getButtonIconSizeClass(globalIconSize) : null;
  const activeIconSizeClass = customIconSizeClass || globalIconSizeClass || "w-3.5 h-3.5";

  const defaultIconNode = (
    <div className="w-5.5 h-5.5 bg-[#10b981] rounded-md flex items-center justify-center font-black text-[#020617] text-xs shrink-0 shadow-none">
      <Zap className={cn("fill-current text-[#020617] shrink-0", activeIconSizeClass)} />
    </div>
  );

  const customIcon = renderCustomIcon(
    config,
    defaultIconNode,
    config?.customIconType === "image"
      ? "w-full h-full"
      : cn(
          "text-[#020617] shrink-0",
          (!config?.iconName || config?.iconName === "Zap") && !config?.customIconType && "fill-current",
          activeIconSizeClass
        )
  );

  const customSizeClass = getButtonFontSizeClass(config?.fontSize);
  const globalSizeClass =
    globalFontSize && globalFontSize !== "normal" ? getButtonFontSizeClass(globalFontSize) : null;
  const computedFontSizeClass = customSizeClass || globalSizeClass || "text-xs";

  const paddingClass = getComponentPaddingClass(config?.padding);
  const radiusClass = getComponentRadiusClass(config?.cornerRadius);
  const fontWeightClass = getComponentFontWeightClass(config?.fontWeight);

  const customStyles: React.CSSProperties = {
    ...(config?.textColor ? { color: config.textColor } : {}),
    ...(config?.backgroundColor ? { backgroundColor: config.backgroundColor, backgroundImage: "none" } : {}),
    ...(config?.borderColor ? { borderColor: config.borderColor, borderStyle: "solid" } : {}),
    ...(!disableGlow && hasActiveGlow(config?.accentColor)
      ? { boxShadow: `0 0 12px ${config!.accentColor}`, outlineColor: config!.accentColor }
      : {}),
    ...(config?.fontFamily && config.fontFamily !== "inherit" ? { fontFamily: config.fontFamily } : {}),
    ...(config?.customPadding ? { padding: config.customPadding } : {}),
    ...(config?.customCornerRadius ? { borderRadius: config.customCornerRadius } : {}),
    ...(config?.textTransform && config.textTransform !== "none" ? { textTransform: config.textTransform } : {}),
    ...(config?.letterSpacing ? { letterSpacing: config.letterSpacing } : {}),
  };

  const showLabelSpan = !isEditingInline && !isTextHidden && activeLabel.trim().length > 0;

  return (
    <button
      type="button"
      id="header_logo"
      {...componentDataAttributes(getComponentIdForButton("header_logo"), "button:header_logo")}
      data-ibc-id="header_logo"
      data-ibc-type={config?.componentType || "button"}
      data-ibc-title={activeLabel || def?.description || "Header Logo"}
      onClick={(e) => {
        if (isEditingInline) {
          e.stopPropagation();
          return;
        }
        onClick?.();
      }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      style={customStyles}
      className={cn(
        "flex items-center bg-[#080d1a] hover:bg-[#0f172a] text-slate-100 border border-slate-800/80 px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 group relative shadow-none",
        (showLabelSpan || isEditingInline) ? "gap-2.5" : "justify-center",
        paddingClass,
        radiusClass,
        fontWeightClass,
        className
      )}
      title={
        config?.customTooltip ||
        "Return to Front Page / Home (Double-click to edit text inline, Right-click to change Logo Text & Icon)"
      }
    >
      {!isIconHidden && (
        config?.iconName || config?.customIconType ? (
          <div
            className={cn(
              "w-5.5 h-5.5 rounded-md flex items-center justify-center font-black text-xs shrink-0 overflow-hidden shadow-none",
              config?.customIconType === "image" ? "bg-transparent" : "bg-[#10b981] text-[#020617]"
            )}
          >
            {customIcon}
          </div>
        ) : (
          defaultIconNode
        )
      )}

      {isEditingInline ? (
        <input
          ref={inputRef}
          type="text"
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onBlur={commitInlineLabel}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              commitInlineLabel();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setDraftLabel(activeLabel);
              setIsEditingInline(false);
            }
          }}
          placeholder={uiText("components_customizable_logo.input.logo_text.placeholder", "Logo text...")}
          className="bg-[#020617] text-emerald-300 border border-emerald-500/60 rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-none w-32"
        />
      ) : showLabelSpan ? (
        <span
          className={cn(
            "font-bold tracking-wide select-none group-hover:text-emerald-300 transition-colors",
            computedFontSizeClass
          )}
        >
          {activeLabel}
        </span>
      ) : isIconHidden ? (
        <span className="text-[10px] font-mono text-slate-400 px-1">{uiText("components_customizable_logo.span.logo", "+ Logo")}</span>
      ) : null}
    </button>
  );
}

