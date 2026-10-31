/**
 * Database-driven icon resolver
 * =============================
 * Icons are stored by name (`"folder"`, `"settings"`, `"check"` …) in the
 * configuration record. This module turns that name into a Lucide element at
 * render time — no icon component is ever hardcoded in a view.
 */

import React from "react";
import { ICON_MAP, resolveIconComponent } from "../../utils/customIconRegistry";
import { LUCIDE_ICON_MAP } from "../../utils/lucideIconMap.generated";

/** Curated quick-switch palette used by the cheat sheet and studio. */
export const ICON_QUICK_SWITCH: Array<{ name: string; label: string }> = [
  { name: "Folder", label: "Folder" },
  { name: "Settings", label: "Settings" },
  { name: "Check", label: "Check" },
  { name: "Lock", label: "Lock" },
  { name: "Database", label: "Database" },
  { name: "Search", label: "Search" },
  { name: "Eye", label: "Eye" },
  { name: "EyeOff", label: "Eye off" },
  { name: "Sparkles", label: "Sparkles" },
  { name: "Star", label: "Star" },
  { name: "Palette", label: "Palette" },
  { name: "SlidersHorizontal", label: "Sliders" },
  { name: "Layers", label: "Layers" },
  { name: "Type", label: "Typography" },
  { name: "Image", label: "Image" },
  { name: "Film", label: "Film" },
  { name: "Grid", label: "Grid" },
  { name: "ListFilter", label: "Filter" },
  { name: "Download", label: "Download" },
  { name: "Upload", label: "Upload" },
  { name: "RefreshCw", label: "Refresh" },
  { name: "Trash2", label: "Delete" },
  { name: "Plus", label: "Add" },
  { name: "X", label: "Close" },
  { name: "CheckCircle2", label: "Check circle" },
  { name: "AlertTriangle", label: "Alert" },
  { name: "Info", label: "Info" },
  { name: "ArrowLeft", label: "Arrow left" },
  { name: "ArrowRight", label: "Arrow right" },
  { name: "ChevronDown", label: "Chevron down" },
  { name: "ExternalLink", label: "External link" },
  { name: "Zap", label: "Zap" },
];

/** Case-insensitive icon lookup, tolerant of `folder`, `Folder` and `folder-icon`. */
export function getIconComponent(iconName?: string): React.ElementType | undefined {
  return resolveIconComponent(iconName);
}

/** Renders an icon by registry name, or `null` when the name is unknown. */
export function renderIconByName(
  iconName: string | undefined,
  className = "w-4 h-4",
  fallback: React.ReactNode = null
): React.ReactNode {
  const Icon = getIconComponent(iconName);
  if (!Icon) return fallback;
  return <Icon className={className} aria-hidden="true" />;
}

/** Names available to the database-driven picker and cheat sheet. */
export function listKnownIconNames(): string[] {
  return Array.from(
    new Set([...Object.keys(ICON_MAP), ...Object.keys(LUCIDE_ICON_MAP)])
  ).sort((a, b) => a.localeCompare(b));
}

/** True when the supplied name resolves to a real icon. */
export function isKnownIcon(iconName: string | undefined): boolean {
  return Boolean(getIconComponent(iconName));
}
