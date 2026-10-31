/**
 * UI Config Store
 * ===============
 * Framework-agnostic, synchronous mirror of the database-backed copy/layout
 * registry. The React provider (`UIConfigProvider`) owns the I/O; this module
 * owns the *read* path so that any call site — including plain attribute
 * expressions that cannot legally call a hook — can resolve its copy during
 * render without reaching for `localStorage`.
 *
 *   value resolution:  database record → generated registry default → inline fallback
 *
 * Every lookup self-registers the slot, so a key that the static codemod never
 * saw (dynamically composed keys, late-added components) still shows up inside
 * the Button & Layout Optimizer Studio with its inline fallback.
 */

import {
  resolveText,
  type UIConfigRecord,
  type UICopySlotDefinition,
  type UIElementKind,
  type UILayoutProperties,
} from "../types/uiConfigSchema";
import {
  elementTypeFromKind,
  humanizeIdentifier,
} from "../types/componentIndex";
import { getComponentIdForElementKey } from "../types/componentLookup";
import { ATOMIC_COMPONENT_SEED_MAP } from "../types/atomicComponentManifest";

type Listener = () => void;

/** Database-backed overrides, keyed by `element_key`. */
let records: Record<string, UIConfigRecord> = {};
/** Slots observed at runtime (inline fallbacks captured at the call site). */
const runtimeSlots = new Map<string, UICopySlotDefinition>();
/** Monotonic counter bumped on every change — drives React re-renders. */
let revision = 0;

const listeners = new Set<Listener>();

function emit() {
  revision += 1;
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {
      /* a broken listener must never take down rendering */
    }
  });
}

export function subscribeToUIConfigStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getUIConfigRevision(): number {
  return revision;
}

/* ------------------------------------------------------------------ *
 * Write path (used by the provider only)
 * ------------------------------------------------------------------ */

export function replaceAllRecords(next: Record<string, UIConfigRecord>) {
  records = { ...next };
  emit();
}

export function mergeRecords(partial: Record<string, UIConfigRecord>) {
  if (!partial || !Object.keys(partial).length) return;
  records = { ...records, ...partial };
  emit();
}

export function putRecord(record: UIConfigRecord) {
  records = { ...records, [record.element_key]: record };
  emit();
}

export function dropRecord(elementKey: string) {
  if (!(elementKey in records)) return;
  const next = { ...records };
  delete next[elementKey];
  records = next;
  emit();
}

export function getRecord(elementKey: string): UIConfigRecord | undefined {
  return records[elementKey];
}

export function getAllRecords(): Record<string, UIConfigRecord> {
  return records;
}

/* ------------------------------------------------------------------ *
 * Slot registry
 * ------------------------------------------------------------------ */

/** Manifest-declared atomic slots are known before first render. */
for (const seed of Object.values(ATOMIC_COMPONENT_SEED_MAP)) {
  registerRuntimeSlot(seed.element_key, seed.default_label, seed.element_kind);
}

function inferKind(elementKey: string, explicit?: UIElementKind): UIElementKind {
  if (explicit) return explicit;
  if (/\.placeholder$/.test(elementKey)) return "placeholder";
  if (/\.(title|tooltip)$/.test(elementKey)) return "tooltip";
  if (/\.alt$/.test(elementKey)) return "alt";
  if (/\.aria_label$/.test(elementKey)) return "label";
  if (/\.(heading|header)(_|$)/.test(elementKey)) return "heading";
  if (/\.sub_label$/.test(elementKey)) return "sub_label";
  return "text";
}

function deriveComponent(elementKey: string): { module: string; component: string } {
  const parts = elementKey.split(".");
  return {
    module: parts[0] || "general",
    component: parts.length > 2 ? parts[1] : parts[0] || "general",
  };
}

/** Registers a slot discovered at runtime (idempotent, cheap). */
export function registerRuntimeSlot(
  elementKey: string,
  defaultText: string,
  kind?: UIElementKind
): UICopySlotDefinition {
  const existing = runtimeSlots.get(elementKey);
  if (existing) {
    // Keep the richest fallback we have seen for this key.
    if (!existing.default_text && defaultText) existing.default_text = defaultText;
    if (!existing.numeric_component_id) {
      existing.numeric_component_id = getComponentIdForElementKey(elementKey);
    }
    return existing;
  }
  const { module, component } = deriveComponent(elementKey);
  const seed = ATOMIC_COMPONENT_SEED_MAP[elementKey];
  const resolvedKind = inferKind(elementKey, kind ?? seed?.element_kind);
  const slot: UICopySlotDefinition = {
    element_key: elementKey,
    module,
    component_id: component,
    kind: resolvedKind,
    default_text: defaultText || seed?.default_label || "",
    // Denormalised metadata persisted with every database record.
    numeric_component_id: getComponentIdForElementKey(elementKey),
    element_type: seed?.element_type || elementTypeFromKind(resolvedKind),
    parent_section:
      seed?.parent_section || `${humanizeIdentifier(module)} › ${humanizeIdentifier(component)}`,
    source_file: seed?.module_path,
  };
  runtimeSlots.set(elementKey, slot);
  return slot;
}

export function getRuntimeSlots(): UICopySlotDefinition[] {
  return Array.from(runtimeSlots.values());
}

export function getRuntimeSlot(elementKey: string): UICopySlotDefinition | undefined {
  return runtimeSlots.get(elementKey);
}

/* ------------------------------------------------------------------ *
 * Read path
 * ------------------------------------------------------------------ */

/**
 * Resolve the rendered copy for a slot.
 *
 * This is deliberately a plain function (not a hook) so it is legal inside
 * attribute expressions, `.map()` callbacks and conditional branches. React
 * re-renders are driven by the provider's context value, which changes on every
 * store mutation.
 */
export function uiText(elementKey: string, fallback = ""): string {
  const slot = registerRuntimeSlot(elementKey, fallback);
  const record = records[elementKey];
  // Layout visibility is honoured everywhere: a hidden slot renders no copy.
  if (record?.layout_properties?.visible === false) return "";
  const field = slot.kind === "placeholder"
    ? "placeholder"
    : slot.kind === "tooltip"
    ? "tooltip"
    : slot.kind === "sub_label"
    ? "sub_label"
    : slot.kind === "helper"
    ? "helper_text"
    : "text";
  const resolved = resolveText(record, slot, fallback, field as any);
  return resolved === "" && record === undefined ? fallback : resolved;
}

/**
 * Resolve an *imperative* message (toast, alert, status line, validation error).
 *
 * These strings are produced outside the render tree, so they cannot be bound by
 * the JSX codemod. Use named `{tokens}` for the dynamic parts so the studio can
 * reorder or reword the sentence without touching code:
 *
 *   uiMessage(
 *     "crop.toast.slices_exported",
 *     "Exported {count} slices to {folder}",
 *     { count: slices.length, folder: name }
 *   )
 */
export function uiMessage(
  elementKey: string,
  fallback: string,
  vars: Record<string, string | number> = {}
): string {
  registerRuntimeSlot(elementKey, fallback, "message");
  const template = uiText(elementKey, fallback);
  return template.replace(/\{(\w+)\}/g, (match, token) =>
    Object.prototype.hasOwnProperty.call(vars, token) ? String(vars[token]) : match
  );
}

/** Layout configuration for a slot (order / visibility / variant / dimensions). */
export function uiLayout(elementKey: string): UILayoutProperties {
  return records[elementKey]?.layout_properties || {};
}

/** Database icon override for a slot, falling back to its manifest seed. */
export function uiIconName(elementKey: string): string {
  return records[elementKey]?.icon_name || ATOMIC_COMPONENT_SEED_MAP[elementKey]?.default_icon || "";
}

/** `false` when the studio has explicitly hidden the slot. */
export function uiVisible(elementKey: string): boolean {
  const visible = records[elementKey]?.layout_properties?.visible;
  return visible === undefined ? true : Boolean(visible);
}

/** Full resolved view of a slot, used by `useUIConfig`. */
export interface ResolvedUISlot {
  elementKey: string;
  text: string;
  label: string;
  subLabel: string;
  placeholder: string;
  tooltip: string;
  helperText: string;
  layout: UILayoutProperties;
  visible: boolean;
  /** Database icon override for this slot (empty when none is set). */
  iconName: string;
  record?: UIConfigRecord;
  definition: UICopySlotDefinition;
  isCustomised: boolean;
}

export function resolveSlot(elementKey: string, fallback = ""): ResolvedUISlot {
  const definition = registerRuntimeSlot(elementKey, fallback);
  const record = records[elementKey];
  const seedIcon = ATOMIC_COMPONENT_SEED_MAP[elementKey]?.default_icon || "";
  return {
    elementKey,
    text: resolveText(record, definition, fallback, "text"),
    label: resolveText(record, definition, fallback, "label"),
    subLabel: record?.sub_label ?? "",
    placeholder: record?.placeholder ?? (definition.kind === "placeholder" ? definition.default_text : ""),
    tooltip: record?.tooltip ?? (definition.kind === "tooltip" ? definition.default_text : ""),
    helperText: record?.helper_text ?? "",
    layout: record?.layout_properties || {},
    visible: record?.layout_properties?.visible !== false,
    iconName: record?.icon_name || seedIcon,
    record,
    definition,
    isCustomised: Boolean(
      record &&
        (typeof record.text === "string" ||
          typeof record.label === "string" ||
          typeof record.sub_label === "string" ||
          typeof record.placeholder === "string" ||
          typeof record.tooltip === "string" ||
          typeof record.helper_text === "string" ||
          (typeof record.icon_name === "string" && record.icon_name.length > 0) ||
          (record.layout_properties && Object.keys(record.layout_properties).length > 0))
    ),
  };
}
