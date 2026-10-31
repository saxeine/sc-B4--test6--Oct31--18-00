import React, { forwardRef } from "react";
import { useButtonCustomization } from "../context/ButtonCustomizationContext";
import {
  type ComponentType,
  type ButtonCustomConfig,
  getButtonFontSizeClass,
  getComponentPaddingClass,
  getComponentRadiusClass,
  getComponentFontWeightClass,
} from "../types/buttonCustomization";
import { cn } from "../utils/cn";
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

export interface CustomizableContainerProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  ibcId: string;
  componentType?: ComponentType;
  defaultTitle?: string;
  defaultLabel?: string;
  disableGlow?: boolean;
  ignoreCustomPanelStyles?: boolean;
  as?: keyof HTMLElementTagNameMap | React.ComponentType<any>;
  children?:
    | React.ReactNode
    | ((props: {
        config?: ButtonCustomConfig;
        title: string;
        isHidden: boolean;
      }) => React.ReactNode);
  hideWhenEmpty?: boolean;
}

export const CustomizableContainer = forwardRef<
  HTMLElement,
  CustomizableContainerProps
>(
  (
    {
      ibcId,
      componentType = "panel",
      defaultTitle,
      defaultLabel,
      disableGlow = false,
      ignoreCustomPanelStyles = false,
      as: Component = "div",
      className,
      style,
      children,
      onContextMenu,
      ...rest
    },
    ref
  ) => {
    const {
      getConfig,
      getDefinition,
      getButtonLabel,
      openStudioModal,
    } = useButtonCustomization();

    const config = getConfig(ibcId);
    const definition = getDefinition(ibcId);

    // If marked hidden in customization
    if (config?.hidden) {
      return null;
    }

    const fallbackTitle =
      defaultTitle || defaultLabel || definition?.defaultLabel || "";
    const activeTitle = getButtonLabel(ibcId, fallbackTitle);

    const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
      if (onContextMenu) {
        onContextMenu(e);
      } else {
        e.preventDefault();
        e.stopPropagation();
        openStudioModal(ibcId);
      }
    };

    // Typography & layout styling
    const paddingClass = ignoreCustomPanelStyles ? "" : getComponentPaddingClass(config?.padding);
    const radiusClass = ignoreCustomPanelStyles ? "" : getComponentRadiusClass(config?.cornerRadius);
    const fontWeightClass = getComponentFontWeightClass(config?.fontWeight);
    const fontSizeClass = getButtonFontSizeClass(config?.fontSize);

    const customStyles: React.CSSProperties = {
      ...(style || {}),
      ...(!ignoreCustomPanelStyles && config?.backgroundColor
        ? { backgroundColor: config.backgroundColor, backgroundImage: "none" }
        : {}),
      ...(config?.textColor ? { color: config.textColor } : {}),
      ...(!ignoreCustomPanelStyles && config?.borderColor
        ? { borderColor: config.borderColor, borderStyle: "solid" }
        : {}),
      ...(!ignoreCustomPanelStyles && !disableGlow && hasActiveGlow(config?.accentColor)
        ? {
            boxShadow: `0 0 16px ${config!.accentColor}`,
            outlineColor: config!.accentColor,
          }
        : {}),
      ...(config?.fontFamily && config.fontFamily !== "inherit"
        ? { fontFamily: config.fontFamily }
        : {}),
      ...(!ignoreCustomPanelStyles && config?.customPadding ? { padding: config.customPadding } : {}),
      ...(!ignoreCustomPanelStyles && config?.customCornerRadius
        ? { borderRadius: config.customCornerRadius }
        : {}),
      ...(config?.textTransform && config.textTransform !== "none"
        ? { textTransform: config.textTransform }
        : {}),
      ...(config?.letterSpacing ? { letterSpacing: config.letterSpacing } : {}),
    };

    const containerProps: any = {
      ...rest,
      ref,
      id: rest.id || ibcId,
      ...componentDataAttributes(getComponentIdForButton(ibcId), `button:${ibcId}`),
      "data-ibc-id": ibcId,
      "data-ibc-type": componentType,
      "data-ibc-title": activeTitle,
      onContextMenu: handleContextMenu,
      style: customStyles,
      className: cn(
        className,
        paddingClass,
        radiusClass,
        fontWeightClass,
        fontSizeClass
      ),
    };

    return (
      <Component {...containerProps}>
        {typeof children === "function"
          ? children({
              config,
              title: activeTitle,
              isHidden: false,
            })
          : children}
      </Component>
    );
  }
);

CustomizableContainer.displayName = "CustomizableContainer";
