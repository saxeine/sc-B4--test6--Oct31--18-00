import React, { forwardRef, useState, useRef, useEffect } from "react";
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

export interface CustomizableLabelProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  labelId: string;
  defaultLabel?: string;
  defaultText?: string;
  defaultIcon?: React.ReactNode;
  iconClassName?: string;
  labelClassName?: string;
  badge?: React.ReactNode;
  showIconAlways?: boolean;
  showLabelAlways?: boolean;
  as?: "div" | "span" | "h1" | "h2" | "h3" | "h4" | "label" | "p";
  onContextMenuCustom?: (e: React.MouseEvent) => void;
  children?:
    | React.ReactNode
    | ((props: { label: string; isTextHidden: boolean; config: any }) => React.ReactNode);
}

function normalizeIconElement(iconNode: React.ReactNode, activeSizeClass: string): React.ReactNode {
  if (!React.isValidElement(iconNode)) return iconNode;
  if (iconNode.type === React.Fragment) {
    return (iconNode.props as any)?.children ? iconNode : null;
  }
  const currentClassName = (iconNode.props as any)?.className || "";
  const cleaned = currentClassName.replace(/\b(?:w-(?:2|2\.5|3|3\.5|4|4\.5|5|6)|h-(?:2|2\.5|3|3\.5|4|4\.5|5|6))\b/g, "").trim();
  const updatedClassName = cn(cleaned, activeSizeClass, "shrink-0");
  return React.cloneElement(iconNode, {
    className: updatedClassName,
  } as any);
}

export const CustomizableLabel = forwardRef<
  HTMLElement,
  CustomizableLabelProps
>(
  (
    {
      labelId,
      defaultLabel,
      defaultText,
      defaultIcon,
      iconClassName = "w-4 h-4 shrink-0",
      labelClassName = "",
      badge,
      showIconAlways = true,
      showLabelAlways = false,
      as: Component = "div",
      onContextMenuCustom,
      className,
      style,
      title,
      children,
      onClick,
      onDoubleClick,
      ...rest
    },
    ref
  ) => {
    const {
      getConfig,
      getDefinition,
      isZeroText,
      getButtonLabel,
      updateButtonConfig,
      openContextMenuForButton,
      openStudioModal,
      globalFontSize,
      globalIconSize,
      isIbcInspectorActive,
    } = useButtonCustomization();

    const config = getConfig(labelId);
    const definition = getDefinition(labelId);

    const fallbackLabel = defaultLabel ?? defaultText ?? definition?.defaultLabel ?? "";
    const activeLabel = getButtonLabel(labelId, fallbackLabel);

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
    } else if (config && typeof config.label === "string" && config.label.trim().length > 0) {
      isTextHidden = false;
    } else if (showLabelAlways || definition?.supportsZeroText === false) {
      isTextHidden = false;
    } else {
      isTextHidden = isZeroText(labelId);
    }

    const displayTitleName = activeLabel || definition?.description || labelId;

    const finalTitle =
      config?.customTooltip ||
      title ||
      definition?.defaultTooltip ||
      `${displayTitleName} (Double-click to edit text, Right-click to customize)`;

    const commitInlineLabel = () => {
      const trimmed = draftLabel.trim();
      updateButtonConfig(labelId, {
        label: trimmed,
        hideText: trimmed.length === 0,
      });
      setIsEditingInline(false);
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (onContextMenuCustom) {
        onContextMenuCustom(e);
      } else if (e.shiftKey) {
        openStudioModal(labelId);
      } else {
        openContextMenuForButton(e, labelId);
      }
    };

    const handleDoubleClick = (e: React.MouseEvent<HTMLElement>) => {
      if (onDoubleClick) {
        onDoubleClick(e);
        if (e.defaultPrevented) return;
      }
      e.preventDefault();
      e.stopPropagation();
      setDraftLabel(activeLabel);
      setIsEditingInline(true);
    };

    const customIconSizeClass = getButtonIconSizeClass(config?.iconSize);
    const globalIconSizeClass = globalIconSize && globalIconSize !== "normal" ? getButtonIconSizeClass(globalIconSize) : null;
    const activeIconSizeClass = customIconSizeClass || globalIconSizeClass || "w-4 h-4";

    const effectiveDefaultIcon = normalizeIconElement(defaultIcon, activeIconSizeClass);
    const cleanIconClassName = cn(
      iconClassName.replace(/\b(?:w-(?:2|2\.5|3|3\.5|4|4\.5|5|6)|h-(?:2|2\.5|3|3\.5|4|4\.5|5|6))\b/g, "").trim(),
      activeIconSizeClass,
      "shrink-0"
    );

    const renderedIcon = !isIconHidden
      ? renderCustomIcon(
          config,
          effectiveDefaultIcon,
          cleanIconClassName
        )
      : null;

    const shouldRenderIcon = Boolean(
      !isIconHidden && renderedIcon && (showIconAlways || config?.iconName || config?.customIconType)
    );
    const shouldRenderText = Boolean(!isTextHidden && activeLabel && activeLabel.trim().length > 0);
    const hasCustomChildren = Boolean(children || badge);

    // If completely empty (no icon, no text, not editing, not in IBC Inspector mode, no children), render nothing so empty header labels take zero space
    if (!shouldRenderIcon && !shouldRenderText && !isEditingInline && !isIbcInspectorActive && !hasCustomChildren) {
      return null;
    }

    const hasExplicitTextSize =
      Boolean(className && /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|\d+px|\[[\d.]+(?:px|rem|em)\])\b/.test(className)) ||
      Boolean(labelClassName && /\btext-/.test(labelClassName));

    const customSizeClass = getButtonFontSizeClass(config?.fontSize);
    const globalSizeClass = globalFontSize && globalFontSize !== "normal" ? getButtonFontSizeClass(globalFontSize) : null;
    const computedFontSizeClass = customSizeClass || globalSizeClass || (!hasExplicitTextSize ? "text-[11px]" : "");

    const cleanClassName = (customSizeClass || globalSizeClass)
      ? className?.replace(/\btext-(?:xs|sm|base|lg|xl|2xl|3xl|\[[\d.]+(?:px|rem|em)\])\b/g, "")
      : className;

    const paddingClass = getComponentPaddingClass(config?.padding);
    const radiusClass = getComponentRadiusClass(config?.cornerRadius);
    const fontWeightClass = getComponentFontWeightClass(config?.fontWeight);

    const customStyles: React.CSSProperties = {
      ...(style || {}),
      ...(config?.textColor ? { color: config.textColor } : {}),
      ...(config?.backgroundColor ? { backgroundColor: config.backgroundColor, backgroundImage: "none" } : {}),
      ...(config?.borderColor ? { borderColor: config.borderColor, borderStyle: "solid" } : {}),
      ...(config?.accentColor ? { textShadow: `0 0 10px ${config.accentColor}` } : {}),
      ...(config?.fontFamily && config.fontFamily !== "inherit" ? { fontFamily: config.fontFamily } : {}),
      ...(config?.customPadding ? { padding: config.customPadding } : {}),
      ...(config?.customCornerRadius ? { borderRadius: config.customCornerRadius } : {}),
      ...(config?.textTransform && config.textTransform !== "none" ? { textTransform: config.textTransform } : {}),
      ...(config?.letterSpacing ? { letterSpacing: config.letterSpacing } : {}),
    };

    return (
      <Component
        {...(rest as any)}
        ref={ref as any}
        id={rest.id || labelId}
        {...componentDataAttributes(getComponentIdForButton(labelId), `button:${labelId}`)}
        data-ibc-id={labelId}
        data-ibc-type={config?.componentType || "label"}
        data-ibc-title={displayTitleName}
        onClick={(e: React.MouseEvent<HTMLElement>) => {
          if (isEditingInline) {
            e.stopPropagation();
            return;
          }
          onClick?.(e);
        }}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        style={customStyles}
        className={cn(
          "inline-flex items-center gap-1.5 select-none transition-all cursor-context-menu",
          cleanClassName,
          paddingClass,
          radiusClass,
          fontWeightClass,
          (customSizeClass || globalSizeClass)
        )}
        title={finalTitle}
      >
        {shouldRenderIcon ? renderedIcon : null}
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
            placeholder={uiText("components_customizable_label.input.label_text.placeholder", "Label text...")}
            className="bg-[#020617] text-emerald-300 border border-emerald-500/60 rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-none min-w-[96px]"
          />
        ) : typeof children === "function" ? (
          children({ label: activeLabel, isTextHidden, config })
        ) : (
          <>
            {shouldRenderText && (
              <span
                style={config?.textColor ? { color: config.textColor } : undefined}
                className={cn(
                  "truncate",
                  !customSizeClass && !globalSizeClass && computedFontSizeClass,
                  labelClassName,
                  (customSizeClass || globalSizeClass),
                  fontWeightClass
                )}
              >
                {activeLabel}
              </span>
            )}
            {!shouldRenderIcon && !shouldRenderText && isIbcInspectorActive && !hasCustomChildren && (
              <span className="px-1.5 py-0.5 rounded border border-dashed border-cyan-500/50 bg-cyan-950/40 text-[9.5px] font-mono text-cyan-300 whitespace-nowrap">
                + {definition?.description || labelId}
              </span>
            )}
            {children}
          </>
        )}
        {badge}
      </Component>
    );
  }
);

CustomizableLabel.displayName = "CustomizableLabel";

