/**
 * Component Index
 * ===============
 * The numeric address book for every configurable UI element in the app.
 *
 * Every button, section, header, label, sub-label, icon and copy slot receives a
 * stable, sequential, zero-padded **Component ID** (`0001`, `0002`, `0034` …).
 * The IDs are produced by `scripts/generateComponentIndex.ts`, committed to the
 * repository (`componentIdMap.generated.ts` / `componentIndex.generated.ts`) and
 * never recomputed in the browser, so an ID always points at the same component
 * across deployments, database documents and screenshots.
 *
 * Two generated artifacts exist on purpose:
 *
 *   componentIdMap.generated.ts   → tiny `component_key → id` map, imported by
 *                                   the DOM-tagging helpers on the hot path.
 *   componentIndex.generated.ts   → full metadata catalogue (element type,
 *                                   parent section, module path, default copy
 *                                   and default icon), lazy-loaded by the
 *                                   System cheat sheet.
 */

import type { UIElementKind } from "./uiConfigSchema";

/** Element classes understood by the Button & Layout Optimizer Studio. */
export type ComponentElementType =
  | "section"
  | "header"
  | "subheader"
  | "label"
  | "sublabel"
  | "button"
  | "icon"
  | "text"
  | "input"
  | "option"
  | "message"
  | "panel"
  | "tab"
  | "modal"
  | "page";

/** Where the component's defaults come from. */
export type ComponentSource = "atomic" | "button" | "copy";

/** A fully resolved row of the master component index. */
export interface ComponentIndexEntry {
  /** Sequential numeric ID, zero padded to four digits: `"0034"`. */
  component_id: string;
  /** Canonical lookup key: `element:<element_key>` or `button:<button_id>`. */
  component_key: string;
  source: ComponentSource;
  element_type: ComponentElementType;
  /** Human readable parent, e.g. `System View → Cheat Sheet`. */
  parent_section: string;
  /** File / registry path the component lives in. */
  module_path: string;
  default_label: string;
  default_icon?: string;
  /** Present for copy/atomic slots (persisted in `ui_config_registry`). */
  element_key?: string;
  /** Present for registered buttons (persisted by the button customizer). */
  button_id?: string;
  /** Slot kind used to choose the editable database field. */
  element_kind?: UIElementKind;
  /** Button category (`header`, `crop`, …) when applicable. */
  category?: string;
}

/** Compile-time declaration used by the generator for atomic components. */
export interface ComponentSeed {
  element_key: string;
  element_type: ComponentElementType;
  parent_section: string;
  module_path: string;
  default_label: string;
  default_icon?: string;
  element_kind?: UIElementKind;
}

const ELEMENT_PREFIX = "element:";
const BUTTON_PREFIX = "button:";

/** Zero-pads a sequence number into the canonical four-digit shape. */
export function formatComponentId(sequence: number): string {
  if (!Number.isFinite(sequence) || sequence < 1) return "0000";
  return String(Math.floor(sequence)).padStart(4, "0");
}

const NUMERIC_ID_PATTERN = /^\d{4,6}$/;

/** True for a canonical ID such as `"0034"`. */
export function isComponentId(value: unknown): value is string {
  return typeof value === "string" && NUMERIC_ID_PATTERN.test(value);
}

/** Builds the canonical key prefix used by the generated ID map. */
export function componentKeyForElementKey(elementKey: string): string {
  return `${ELEMENT_PREFIX}${elementKey}`;
}

/** Builds the canonical button key used by the generated ID map. */
export function componentKeyForButton(buttonId: string): string {
  return `${BUTTON_PREFIX}${buttonId}`;
}

/** Parses a canonical key back into its element key / button id. */
export function parseComponentKey(componentKey: string | undefined): {
  kind: "element" | "button";
  id: string;
} | null {
  if (!componentKey) return null;
  if (componentKey.startsWith(ELEMENT_PREFIX)) {
    return { kind: "element", id: componentKey.slice(ELEMENT_PREFIX.length) };
  }
  if (componentKey.startsWith(BUTTON_PREFIX)) {
    return { kind: "button", id: componentKey.slice(BUTTON_PREFIX.length) };
  }
  return null;
}

/** Data attributes mounted on every atomic element (safe to spread on any tag). */
export function componentDataAttributes(componentId: string | undefined, componentKey?: string) {
  if (!componentId) return {} as Record<string, string>;
  const attrs: Record<string, string> = { "data-component-id": componentId };
  if (componentKey) attrs["data-component-key"] = componentKey;
  return attrs;
}

/* ------------------------------------------------------------------ *
 * Type / label conversion helpers
 * ------------------------------------------------------------------ */

/** Maps a `UIElementKind` onto the coarse cheat-sheet element type. */
export function elementTypeFromKind(kind: UIElementKind | undefined): ComponentElementType {
  switch (kind) {
    case "heading":
      return "header";
    case "sub_label":
      return "sublabel";
    case "label":
      return "label";
    case "placeholder":
      return "input";
    case "option":
      return "option";
    case "message":
      return "message";
    case "badge":
    case "tooltip":
    case "helper":
    case "alt":
    case "text":
    default:
      return "text";
  }
}

/** Maps a button registry `componentType` onto the cheat-sheet element type. */
export function elementTypeFromComponentType(type: string | undefined): ComponentElementType {
  switch (type) {
    case "label":
      return "label";
    case "page":
      return "page";
    case "tab":
      return "tab";
    case "modal":
      return "modal";
    case "panel":
      return "panel";
    case "section":
      return "section";
    case "button":
    default:
      return "button";
  }
}

/** `asset_pool` → `Asset Pool`. */
export function humanizeIdentifier(value: string): string {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** The database field a cheat-sheet edit should write for a given slot kind. */
export function editableFieldForKind(
  kind: UIElementKind | undefined
): "text" | "placeholder" | "tooltip" | "sub_label" | "helper_text" | "label" {
  switch (kind) {
    case "placeholder":
      return "placeholder";
    case "tooltip":
      return "tooltip";
    case "sub_label":
      return "sub_label";
    case "helper":
      return "helper_text";
    case "label":
      return "label";
    default:
      return "text";
  }
}
