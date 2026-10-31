/**
 * Atomic configuration primitives
 * ===============================
 * Sections, headers, labels, sub-labels, icons and buttons are *discrete*
 * components. Each one:
 *
 *   • resolves its copy from the database-backed registry (never a literal),
 *   • resolves its icon by name from the same record,
 *   • honours visibility / order / alignment / sizing layout props,
 *   • mounts its numeric Component ID on the DOM (`data-component-id`).
 *
 * Views should compose these instead of writing `<h2>`, `<span>` or `<button>`
 * directly, so every element is addressable in the System cheat sheet.
 */

import React from "react";
import { useUIConfig, type ResolvedUISlot } from "../../hooks/useUIConfig";
import { registerRuntimeSlot } from "../../services/uiConfigStore";
import { ATOMIC_COMPONENT_SEED_MAP } from "../../types/atomicComponentManifest";
import { componentDataAttributes } from "../../types/componentIndex";
import { getComponentIdForElementKey } from "../../types/componentLookup";
import { renderIconByName } from "./iconResolver";
import { cn } from "../../utils/cn";
import { CustomizableButton } from "../CustomizableButton";

/* ------------------------------------------------------------------ *
 * Shared resolution
 * ------------------------------------------------------------------ */

function registerSeed(elementKey: string, fallback?: string) {
  const seed = ATOMIC_COMPONENT_SEED_MAP[elementKey];
  const defaultText = fallback ?? seed?.default_label ?? "";
  registerRuntimeSlot(elementKey, defaultText, seed?.element_kind);
  return defaultText;
}

function useAtomicSlot(elementKey: string, fallback?: string): ResolvedUISlot {
  const defaultText = registerSeed(elementKey, fallback);
  return useUIConfig(elementKey, defaultText);
}

/** Layout props → inline style. Order/align/width/height are all database driven. */
function layoutStyle(slot: ResolvedUISlot): React.CSSProperties {
  const style: React.CSSProperties = {};
  const { order, align, width, height, minWidth, maxWidth } = slot.layout;
  if (typeof order === "number") style.order = order;
  if (align) style.textAlign = align;
  if (width) style.width = width;
  if (height) style.height = height;
  if (minWidth) style.minWidth = minWidth;
  if (maxWidth) style.maxWidth = maxWidth;
  return style;
}

function elementAttributes(elementKey: string): Record<string, string> {
  return {
    ...componentDataAttributes(getComponentIdForElementKey(elementKey), `element:${elementKey}`),
    "data-element-key": elementKey,
  } as Record<string, string>;
}

/** Numeric ID for display in headers / test helpers. */
export function useComponentId(elementKey: string): string | undefined {
  return getComponentIdForElementKey(elementKey);
}

/* ------------------------------------------------------------------ *
 * Section
 * ------------------------------------------------------------------ */

export interface ConfigSectionProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  elementKey: string;
  fallback?: string;
  as?: React.ElementType;
  children?: React.ReactNode;
}

/** A visibility / order aware section container with its own Component ID. */
export function ConfigSection({
  elementKey,
  fallback,
  as: Component = "section",
  className,
  style,
  children,
  ...rest
}: ConfigSectionProps) {
  const slot = useAtomicSlot(elementKey, fallback);
  if (!slot.visible) return null;
  return (
    <Component
      {...rest}
      {...elementAttributes(elementKey)}
      style={{ ...layoutStyle(slot), ...style }}
      className={className}
    >
      {children}
    </Component>
  );
}

/* ------------------------------------------------------------------ *
 * Header
 * ------------------------------------------------------------------ */

export interface ConfigHeaderProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, "children"> {
  elementKey: string;
  fallback?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  iconName?: string;
  iconClassName?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function ConfigHeader({
  elementKey,
  fallback,
  as: Component = "h2",
  iconName,
  iconClassName = "w-4 h-4",
  showIcon = true,
  className,
  style,
  children,
  ...rest
}: ConfigHeaderProps) {
  const slot = useAtomicSlot(elementKey, fallback);
  if (!slot.visible) return null;
  const activeIcon = slot.iconName || iconName;
  const icon = showIcon ? renderIconByName(activeIcon, iconClassName) : null;
  const text = children ?? slot.text;
  return (
    <Component
      {...rest}
      {...elementAttributes(elementKey)}
      title={rest.title ?? (slot.tooltip || undefined)}
      style={{ ...layoutStyle(slot), ...style }}
      className={cn("inline-flex items-center gap-2", className)}
    >
      {icon}
      <span>{text}</span>
    </Component>
  );
}

/* ------------------------------------------------------------------ *
 * Label / sub-label / text
 * ------------------------------------------------------------------ */

export interface ConfigLabelProps extends React.HTMLAttributes<HTMLElement> {
  elementKey: string;
  fallback?: string;
  as?: React.ElementType;
  iconName?: string;
  iconClassName?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function ConfigLabel({
  elementKey,
  fallback,
  as: Component = "span",
  iconName,
  iconClassName = "w-3.5 h-3.5",
  showIcon = true,
  className,
  style,
  children,
  ...rest
}: ConfigLabelProps) {
  const slot = useAtomicSlot(elementKey, fallback);
  if (!slot.visible) return null;
  const icon = showIcon ? renderIconByName(slot.iconName || iconName, iconClassName) : null;
  return (
    <Component
      {...rest}
      {...elementAttributes(elementKey)}
      title={rest.title ?? (slot.tooltip || undefined)}
      style={{ ...layoutStyle(slot), ...style }}
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      {icon}
      <span>{children ?? slot.text}</span>
    </Component>
  );
}

export interface ConfigSubLabelProps extends React.HTMLAttributes<HTMLElement> {
  elementKey: string;
  fallback?: string;
  as?: React.ElementType;
  iconName?: string;
  iconClassName?: string;
  children?: React.ReactNode;
}

export function ConfigSubLabel({
  elementKey,
  fallback,
  as: Component = "span",
  iconName,
  iconClassName = "w-3 h-3",
  className,
  style,
  children,
  ...rest
}: ConfigSubLabelProps) {
  const slot = useAtomicSlot(elementKey, fallback);
  if (!slot.visible) return null;
  const text = children ?? (slot.subLabel || slot.text);
  const icon = renderIconByName(slot.iconName || iconName, iconClassName);
  return (
    <Component
      {...rest}
      {...elementAttributes(elementKey)}
      title={rest.title ?? (slot.tooltip || undefined)}
      style={{ ...layoutStyle(slot), ...style }}
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      {icon}
      <span>{text}</span>
    </Component>
  );
}

export interface ConfigTextProps extends React.HTMLAttributes<HTMLElement> {
  elementKey: string;
  fallback?: string;
  as?: React.ElementType;
  iconName?: string;
  iconClassName?: string;
  children?: React.ReactNode;
}

/** Generic copy block (help paragraphs, statuses, footnotes). */
export function ConfigText({
  elementKey,
  fallback,
  as: Component = "p",
  iconName,
  iconClassName = "w-3.5 h-3.5",
  className,
  style,
  children,
  ...rest
}: ConfigTextProps) {
  const slot = useAtomicSlot(elementKey, fallback);
  if (!slot.visible) return null;
  const icon = renderIconByName(slot.iconName || iconName, iconClassName);
  return (
    <Component
      {...rest}
      {...elementAttributes(elementKey)}
      style={{ ...layoutStyle(slot), ...style }}
      className={className}
    >
      {icon ? <span className="inline-flex align-middle mr-1.5">{icon}</span> : null}
      {children ?? slot.text}
    </Component>
  );
}

/* ------------------------------------------------------------------ *
 * Icon
 * ------------------------------------------------------------------ */

export interface ConfigIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  elementKey: string;
  fallback?: string;
  iconName?: string;
  iconClassName?: string;
}

export function ConfigIcon({
  elementKey,
  fallback,
  iconName,
  iconClassName = "w-4 h-4",
  className,
  ...rest
}: ConfigIconProps) {
  const slot = useAtomicSlot(elementKey, fallback);
  if (!slot.visible) return null;
  const node = renderIconByName(slot.iconName || iconName, iconClassName);
  if (!node) return null;
  return (
    <span
      {...rest}
      {...elementAttributes(elementKey)}
      className={cn("inline-flex items-center justify-center", className)}
    >
      {node}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Button
 * ------------------------------------------------------------------ */

export interface ConfigButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  elementKey: string;
  fallback?: string;
  iconName?: string;
  iconClassName?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function ConfigButton({
  elementKey,
  fallback,
  iconName,
  iconClassName = "w-3.5 h-3.5",
  showIcon = true,
  className,
  style,
  children,
  type = "button",
  ...rest
}: ConfigButtonProps) {
  const slot = useAtomicSlot(elementKey, fallback);
  if (!slot.visible) return null;
  const icon = showIcon ? renderIconByName(slot.iconName || iconName, iconClassName) : null;
  const label = children ?? slot.text;
  return (
    <CustomizableButton
      buttonId="ui_config_primitives_btn_1"
      type={type}
title={rest.title ?? (slot.tooltip || undefined)}
aria-label={rest["aria-label"] ?? (typeof label === "string" ? label : elementKey)}
style={{ ...layoutStyle(slot), ...style }}
className={cn("inline-flex items-center gap-1.5 cursor-pointer", className)}
    >
        {() => (
            <>
              {icon}
            {label ? <span>{label}</span> : null}
            </>
          )}
    </CustomizableButton>
  );
}

/* ------------------------------------------------------------------ *
 * Input / option / message
 * ------------------------------------------------------------------ */

export interface ConfigInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
  elementKey: string;
  fallback?: string;
}

/** Input whose placeholder is a database-driven label slot. */
export function ConfigInput({
  elementKey,
  fallback,
  className,
  ...rest
}: ConfigInputProps) {
  const slot = useAtomicSlot(elementKey, fallback);
  if (!slot.visible) return null;
  return (
    <input
      {...rest}
      {...elementAttributes(elementKey)}
      placeholder={slot.placeholder || slot.text}
      className={className}
    />
  );
}

export interface ConfigOptionProps {
  elementKey: string;
  value: string;
  fallback?: string;
}

export function ConfigOption({ elementKey, value, fallback }: ConfigOptionProps) {
  const slot = useAtomicSlot(elementKey, fallback);
  if (!slot.visible) return null;
  return (
    <option value={value} {...elementAttributes(elementKey)}>
      {slot.text}
    </option>
  );
}

export interface ConfigMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  elementKey: string;
  fallback?: string;
  tone?: "neutral" | "success" | "error" | "info";
}

export function ConfigMessage({
  elementKey,
  fallback,
  tone = "neutral",
  className,
  ...rest
}: ConfigMessageProps) {
  const slot = useAtomicSlot(elementKey, fallback);
  if (!slot.visible) return null;
  const toneClass =
    tone === "success"
      ? "text-emerald-400"
      : tone === "error"
      ? "text-rose-400"
      : tone === "info"
      ? "text-cyan-300"
      : "text-slate-400";
  return (
    <p
      {...rest}
      {...elementAttributes(elementKey)}
      className={cn("inline-flex items-center gap-1.5 text-[11px]", toneClass, className)}
    >
      {renderIconByName(slot.iconName, "w-3.5 h-3.5")}
      <span>{slot.text}</span>
    </p>
  );
}
