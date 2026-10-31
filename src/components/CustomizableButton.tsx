import React, { forwardRef } from "react";
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
import { componentDataAttributes } from "../types/componentIndex";
import { getComponentIdForButton } from "../types/componentLookup";
import { FRONT_PAGE_ICON_ONLY_BUTTON_IDS } from "../types/hardcodedDefaultConfig";

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

export interface CustomizableButtonProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  buttonId: string;
  defaultLabel?: string;
  defaultIcon?: React.ReactNode;
  iconClassName?: string;
  labelClassName?: string;
  badge?: React.ReactNode;
  showLabelAlways?: boolean;
  forceZeroText?: boolean;
  lockIconOnly?: boolean;
  disableGlow?: boolean;
  as?: "button" | "label" | "div" | "span";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onContextMenuCustom?: (e: React.MouseEvent) => void;
  children?:
    | React.ReactNode
    | ((props: { label: string; isTextHidden: boolean; config: any }) => React.ReactNode);
}

/**
 * Normalizes any passed React icon element so that tiny legacy icon dimensions
 * (w-2, w-2.5, w-3, w-3.5) are automatically upscaled to the active ergonomic icon size.
 */
function normalizeIconElement(iconNode: React.ReactNode, activeSizeClass: string): React.ReactNode {
  if (!React.isValidElement(iconNode)) return iconNode;
  // React.Fragment does not accept className or HTML attributes
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

export const CustomizableButton = forwardRef<
  HTMLElement,
  CustomizableButtonProps
>(
  (
    {
      buttonId,
      defaultLabel = "",
      defaultIcon,
      iconClassName = "w-4 h-4 shrink-0",
      labelClassName = "",
      badge,
      showLabelAlways = false,
      forceZeroText = false,
      lockIconOnly = false,
      disableGlow = false,
      as: Component = "button",
      onContextMenuCustom,
      className,
      style,
      title,
      children,
      onClick,
      disabled,
      type = "button",
      ...rest
    },
    ref
  ) => {
    const {
      getConfig,
      getDefinition,
      isZeroText,
      getButtonLabel,
      openContextMenuForButton,
      openStudioModal,
      globalFontSize,
      globalIconSize,
    } = useButtonCustomization();

    const config = getConfig(buttonId);
    if (config?.hidden) {
      return null;
    }
    const definition = getDefinition(buttonId);

    const effectiveLockIconOnly = Boolean(
      lockIconOnly || FRONT_PAGE_ICON_ONLY_BUTTON_IDS.has(buttonId)
    );
    const effectiveDisableGlow = Boolean(
      disableGlow || FRONT_PAGE_ICON_ONLY_BUTTON_IDS.has(buttonId)
    );

    const fallbackLabel = defaultLabel || definition?.defaultLabel || "";
    const activeLabel = effectiveLockIconOnly
      ? ""
      : getButtonLabel(buttonId, fallbackLabel);

    let isTextHidden: boolean;
    if (effectiveLockIconOnly) {
      isTextHidden = true;
    } else if (config && typeof config.hideText === "boolean") {
      isTextHidden = config.hideText;
    } else if (config?.label && config.label.trim().length > 0) {
      isTextHidden = false;
    } else if (forceZeroText) {
      isTextHidden = true;
    } else if (showLabelAlways || definition?.supportsZeroText === false) {
      isTextHidden = false;
    } else {
      isTextHidden = isZeroText(buttonId);
    }

    const finalTitle =
      config?.customTooltip ||
      title ||
      definition?.defaultTooltip ||
      activeLabel ||
      definition?.description ||
      buttonId;

    const finalTooltip = config?.customTooltip
      ? config.customTooltip
      : `${finalTitle}${finalTitle.includes("(Right-click") ? "" : " (Right-click to customize)"}`;

    const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (onContextMenuCustom) {
        onContextMenuCustom(e);
      } else if (e.shiftKey) {
        openStudioModal(buttonId);
      } else {
        openContextMenuForButton(e, buttonId);
      }
    };

    // Calculate active icon sizing (individual override > global override > standard w-4 h-4 16px)
    const customIconSizeClass = getButtonIconSizeClass(config?.iconSize);
    const globalIconSizeClass = globalIconSize && globalIconSize !== "normal" ? getButtonIconSizeClass(globalIconSize) : null;
    const activeIconSizeClass = customIconSizeClass || globalIconSizeClass || "w-4 h-4";

    const isIconHidden = config?.hideIcon === true;
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

    const hasExplicitTextSize =
      Boolean(className && /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|\d+px|\[[\d.]+(?:px|rem|em)\])\b/.test(className)) ||
      Boolean(labelClassName && /\btext-/.test(labelClassName));

    // Custom individual button font size has highest priority, then global font size, then explicit class, then default text-[11px]
    const customSizeClass = getButtonFontSizeClass(config?.fontSize);
    const globalSizeClass = globalFontSize && globalFontSize !== "normal" ? getButtonFontSizeClass(globalFontSize) : null;
    const computedFontSizeClass = customSizeClass || globalSizeClass || (!hasExplicitTextSize ? "text-[11px]" : "");

    // Strip oversized classes from outer container when an override is active
    const cleanClassName = (customSizeClass || globalSizeClass)
      ? className?.replace(/\btext-(?:xs|sm|base|lg|xl|2xl|3xl|\[[\d.]+(?:px|rem|em)\])\b/g, "")
      : className;

    const hasVisibleLabelText = !isTextHidden && activeLabel.trim().length > 0;
    const widthAdjustedClassName = hasVisibleLabelText && cleanClassName
      ? cleanClassName.replace(/\bw-(?:8|9|10|11|12)\b/g, "min-w-9 px-2.5")
      : cleanClassName;

    const paddingClass = getComponentPaddingClass(config?.padding);
    const radiusClass = getComponentRadiusClass(config?.cornerRadius);
    const fontWeightClass = getComponentFontWeightClass(config?.fontWeight);

    const customStyles: React.CSSProperties = {
      ...(style || {}),
      ...(config?.textColor ? { color: config.textColor } : {}),
      ...(!effectiveLockIconOnly && config?.backgroundColor ? { backgroundColor: config.backgroundColor, backgroundImage: "none" } : {}),
      ...(!effectiveLockIconOnly && config?.borderColor ? { borderColor: config.borderColor, borderStyle: "solid" } : {}),
      ...(!effectiveDisableGlow && hasActiveGlow(config?.accentColor)
        ? { boxShadow: `0 0 12px ${config!.accentColor}`, outlineColor: config!.accentColor }
        : {}),
      ...(config?.fontFamily && config.fontFamily !== "inherit" ? { fontFamily: config.fontFamily } : {}),
      ...(config?.customPadding ? { padding: config.customPadding } : {}),
      ...(config?.customCornerRadius ? { borderRadius: config.customCornerRadius } : {}),
      ...(config?.textTransform && config.textTransform !== "none" ? { textTransform: config.textTransform } : {}),
      ...(config?.letterSpacing ? { letterSpacing: config.letterSpacing } : {}),
    };

    const componentProps: any = {
      ...rest,
      ref,
      id: rest.id || buttonId,
      ...componentDataAttributes(getComponentIdForButton(buttonId), `button:${buttonId}`),
      "data-ibc-id": buttonId,
      "data-ibc-type": config?.componentType || "button",
      "data-ibc-title": activeLabel || definition?.description || buttonId,
      onClick,
      onContextMenu: handleContextMenu,
      style: customStyles,
      className: cn(
        "transition-all flex items-center justify-center cursor-pointer select-none",
        !hasVisibleLabelText ? "px-2 py-1.5" : "gap-1.5",
        widthAdjustedClassName,
        paddingClass,
        radiusClass,
        fontWeightClass
      ),
      title: finalTooltip,
    };

    if (Component === "button") {
      componentProps.type = type;
      componentProps.disabled = disabled;
    }

    return (
      <Component {...componentProps}>
        {renderedIcon}
        {typeof children === "function" ? (
          children({ label: activeLabel, isTextHidden, config })
        ) : (
          <>
            {!isTextHidden && activeLabel && (
              <span
                style={config?.textColor ? { color: config.textColor } : undefined}
                className={cn(
                  "truncate whitespace-nowrap",
                  !customSizeClass && !globalSizeClass && computedFontSizeClass,
                  labelClassName,
                  (customSizeClass || globalSizeClass),
                  fontWeightClass
                )}
              >
                {activeLabel}
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

CustomizableButton.displayName = "CustomizableButton";
