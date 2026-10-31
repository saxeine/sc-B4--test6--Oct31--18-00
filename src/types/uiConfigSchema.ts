/**
 * UI Configuration Schema
 * =======================
 * Single source of truth for the shape of every piece of UI copy and layout
 * configuration owned by the **Button & Layout Optimizer Studio**.
 *
 * Every user-facing string in the application resolves through a record of this
 * shape. Records live in the remote database (Firestore collection
 * `ui_config_registry`, one document per module) and are mirrored into memory
 * for synchronous reads during render.
 *
 * Schema v3 adds the denormalised Component ID metadata (`numeric_component_id`,
 * `element_type`, `parent_section`) and the database `icon_name` override.
 *
 * Fallback defaults are declared in the registry (see `generatedCopyRegistry.ts`
 * and `componentRegistry.ts`) so the UI is never blank before hydration — but
 * the rendered output always prefers the runtime, database-backed value.
 */

export const UI_CONFIG_SCHEMA_VERSION = 3 as const;

/** Classification of the slot a string occupies in the UI. */
export type UIElementKind =
  | "text" // generic inline / block copy
  | "label" // button or control label
  | "sub_label" // secondary caption under a label
  | "heading" // page / modal / section title
  | "placeholder" // input placeholder
  | "tooltip" // title attribute / hover hint
  | "helper" // helper or hint copy under a control
  | "badge" // small pill / counter caption
  | "alt" // image alternative text
  | "option" // select option caption
  | "message"; // status, empty-state, confirmation copy

/** Visual/structural properties the studio can drive without touching styling code. */
export interface UILayoutProperties {
  /** Sort index within its parent slot. */
  order?: number;
  /** Hard visibility switch — `false` removes the element from the tree. */
  visible?: boolean;
  /** Named variant understood by the consuming component. */
  variant?: string;
  /** Optional explicit dimensions (CSS values, e.g. "240px", "100%"). */
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  /** Text alignment inside the slot. */
  align?: "left" | "center" | "right" | "justify";
  /** Grid/flex span for elements rendered inside a layout grid. */
  span?: number;
  /** Free-form slot used by individual studios for bespoke layout flags. */
  meta?: Record<string, string | number | boolean>;
}

/** Audit metadata attached to every persisted record. */
export interface UIConfigAuditMeta {
  /** ISO-8601 timestamp of the most recent successful database write. */
  last_updated_at: string;
  /** Account identifier (email/uid) that performed the write. */
  last_updated_by: string;
  /** Monotonic revision counter, incremented on every committed mutation. */
  revision: number;
  /** Schema version the record was written with. */
  schema_version: number;
}

/**
 * A single addressable UI slot.
 * `element_key` is a hierarchical, globally-unique identifier:
 *   `<module>.<component>.<slot>` e.g. `dashboard.header.title`,
 *   `auth.submit_button.label`, `crop_sidebar.aspect_ratio.placeholder`.
 */
export interface UIConfigRecord extends UIConfigAuditMeta {
  element_key: string;
  /** Component the slot belongs to, e.g. `CropSidebar`. */
  component_id: string;
  /** Logical module / feature area, e.g. `crop_sidebar`. */
  module: string;
  /** What kind of slot this is. */
  kind: UIElementKind;

  /** Primary rendered copy. */
  text?: string;
  /** Control label (buttons / form controls). */
  label?: string;
  /** Secondary caption rendered beneath the label. */
  sub_label?: string;
  /** Input placeholder copy. */
  placeholder?: string;
  /** Hover / `title` copy. */
  tooltip?: string;
  /** Helper or hint copy. */
  helper_text?: string;

  /**
   * Sequential numeric Component ID (`"0034"`). Denormalised onto every
   * database record so a document is self-describing even without the
   * compile-time index.
   */
  numeric_component_id?: string;
  /** Coarse element class understood by the System cheat sheet. */
  element_type?: string;
  /** Human-readable parent section, e.g. `System → Cheat Sheet → Table`. */
  parent_section?: string;
  /** Active icon name (preset or generated Lucide key), database override. */
  icon_name?: string;

  /** Layout configuration for the slot. */
  layout_properties?: UILayoutProperties;

  /** Compile-time fallback shipped with the code (never written by users). */
  default_text: string;
  /** Provenance, used by the studio to deep-link to source. */
  source_file?: string;
  source_line?: number;
  /** Free-form notes authored inside the studio. */
  notes?: string;
}

/** Only the user-editable surface of a record. */
export type UIConfigPatch = Partial<
  Pick<
    UIConfigRecord,
    | "text"
    | "label"
    | "sub_label"
    | "placeholder"
    | "tooltip"
    | "helper_text"
    | "icon_name"
    | "layout_properties"
    | "notes"
  >
>;

/** One database document: all overrides for a single module. */
export interface UIConfigDocument extends UIConfigAuditMeta {
  module: string;
  records: Record<string, UIConfigRecord>;
}

/** Compile-time registry entry (the fallback catalogue the studio enumerates). */
export interface UICopySlotDefinition {
  element_key: string;
  module: string;
  component_id: string;
  kind: UIElementKind;
  default_text: string;
  source_file?: string;
  source_line?: number;
  /** Numeric Component ID resolved from the committed index. */
  numeric_component_id?: string;
  /** Coarse element class (section / header / label / button / icon / …). */
  element_type?: string;
  /** Human-readable parent section. */
  parent_section?: string;
}

/** Status reported by the persistence layer, surfaced as a sync indicator. */
export type UIConfigSyncState =
  | "idle"
  | "hydrating"
  | "saving"
  | "saved"
  | "error"
  | "offline";

export interface UIConfigSyncStatus {
  state: UIConfigSyncState;
  /** Number of mutations waiting to be flushed to the database. */
  pending: number;
  lastSyncedAt: string | null;
  lastError: string | null;
}

/* ------------------------------------------------------------------ *
 * Validation helpers (no external dependency — runtime-safe)
 * ------------------------------------------------------------------ */

export const ELEMENT_KEY_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*(?:\.[a-z0-9]+(?:_[a-z0-9]+)*)+$/;

export function isValidElementKey(key: unknown): key is string {
  return typeof key === "string" && key.length > 0 && key.length <= 180 && ELEMENT_KEY_PATTERN.test(key);
}

/** Firestore-safe document id for a module. */
export function moduleDocId(module: string): string {
  return String(module || "general")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .slice(0, 120) || "general";
}

export function moduleOfKey(elementKey: string): string {
  const idx = elementKey.indexOf(".");
  return idx === -1 ? "general" : elementKey.slice(0, idx);
}

const EDITABLE_TEXT_FIELDS = [
  "text",
  "label",
  "sub_label",
  "placeholder",
  "tooltip",
  "helper_text",
  "notes",
] as const;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateLayoutProperties(layout: unknown): ValidationResult {
  const errors: string[] = [];
  if (layout === undefined || layout === null) return { valid: true, errors };
  if (typeof layout !== "object" || Array.isArray(layout)) {
    return { valid: false, errors: ["layout_properties must be an object"] };
  }
  const l = layout as UILayoutProperties;
  if (l.order !== undefined && (typeof l.order !== "number" || !Number.isFinite(l.order))) {
    errors.push("layout_properties.order must be a finite number");
  }
  if (l.visible !== undefined && typeof l.visible !== "boolean") {
    errors.push("layout_properties.visible must be a boolean");
  }
  if (l.span !== undefined && (typeof l.span !== "number" || l.span < 1 || l.span > 24)) {
    errors.push("layout_properties.span must be between 1 and 24");
  }
  if (l.align !== undefined && !["left", "center", "right", "justify"].includes(l.align)) {
    errors.push("layout_properties.align is not a recognised alignment");
  }
  for (const dim of ["width", "height", "minWidth", "maxWidth"] as const) {
    const v = l[dim];
    if (v !== undefined && (typeof v !== "string" || v.length > 32)) {
      errors.push(`layout_properties.${dim} must be a short CSS length string`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateUIConfigRecord(record: unknown): ValidationResult {
  const errors: string[] = [];
  if (!record || typeof record !== "object") {
    return { valid: false, errors: ["record must be an object"] };
  }
  const r = record as UIConfigRecord;
  if (!isValidElementKey(r.element_key)) {
    errors.push(
      `element_key "${String(r.element_key)}" must be a dotted lower_snake path such as "dashboard.header.title"`
    );
  }
  if (typeof r.module !== "string" || !r.module) errors.push("module is required");
  if (typeof r.component_id !== "string" || !r.component_id) errors.push("component_id is required");
  if (typeof r.default_text !== "string") errors.push("default_text is required");
  for (const field of EDITABLE_TEXT_FIELDS) {
    const value = r[field];
    if (value !== undefined && typeof value !== "string") {
      errors.push(`${field} must be a string when provided`);
    } else if (typeof value === "string" && value.length > 4000) {
      errors.push(`${field} exceeds the 4000 character limit`);
    }
  }
  if (r.numeric_component_id !== undefined && !/^\d{4,6}$/.test(String(r.numeric_component_id))) {
    errors.push("numeric_component_id must be a zero-padded numeric string such as \"0034\"");
  }
  if (r.element_type !== undefined && (typeof r.element_type !== "string" || r.element_type.length > 32)) {
    errors.push("element_type must be a short string");
  }
  if (
    r.parent_section !== undefined &&
    (typeof r.parent_section !== "string" || r.parent_section.length > 200)
  ) {
    errors.push("parent_section must be a string of at most 200 characters");
  }
  if (r.icon_name !== undefined && (typeof r.icon_name !== "string" || r.icon_name.length > 80)) {
    errors.push("icon_name must be a string of at most 80 characters");
  }
  const layout = validateLayoutProperties(r.layout_properties);
  errors.push(...layout.errors);
  return { valid: errors.length === 0, errors };
}

/** Strips `undefined` (Firestore rejects it) and unknown keys before persisting. */
export function sanitizeRecordForPersistence(record: UIConfigRecord): UIConfigRecord {
  const clean: Record<string, unknown> = {};
  const allowed = new Set([
    "element_key",
    "component_id",
    "module",
    "kind",
    "text",
    "label",
    "sub_label",
    "placeholder",
    "tooltip",
    "helper_text",
    "icon_name",
    "numeric_component_id",
    "element_type",
    "parent_section",
    "layout_properties",
    "default_text",
    "source_file",
    "source_line",
    "notes",
    "last_updated_at",
    "last_updated_by",
    "revision",
    "schema_version",
  ]);
  for (const [key, value] of Object.entries(record)) {
    if (!allowed.has(key)) continue;
    if (value === undefined) continue;
    if (key === "layout_properties" && value && typeof value === "object") {
      const layout: Record<string, unknown> = {};
      for (const [lk, lv] of Object.entries(value as Record<string, unknown>)) {
        if (lv !== undefined) layout[lk] = lv;
      }
      clean[key] = layout;
      continue;
    }
    clean[key] = value;
  }
  return clean as unknown as UIConfigRecord;
}

/** Builds a fully-formed record from a registry definition + an edit patch. */
export function createRecord(
  definition: UICopySlotDefinition,
  patch: UIConfigPatch = {},
  author = "system",
  previousRevision = 0
): UIConfigRecord {
  return sanitizeRecordForPersistence({
    element_key: definition.element_key,
    component_id: definition.component_id,
    module: definition.module,
    kind: definition.kind,
    default_text: definition.default_text,
    source_file: definition.source_file,
    source_line: definition.source_line,
    numeric_component_id: definition.numeric_component_id,
    element_type: definition.element_type,
    parent_section: definition.parent_section,
    ...patch,
    last_updated_at: new Date().toISOString(),
    last_updated_by: author,
    revision: previousRevision + 1,
    schema_version: UI_CONFIG_SCHEMA_VERSION,
  });
}

/** Merge an edit into an existing record, bumping audit metadata. */
export function applyPatch(
  record: UIConfigRecord,
  patch: UIConfigPatch,
  author = "system"
): UIConfigRecord {
  const next: UIConfigRecord = {
    ...record,
    ...patch,
    layout_properties:
      patch.layout_properties === undefined
        ? record.layout_properties
        : { ...(record.layout_properties || {}), ...patch.layout_properties },
    last_updated_at: new Date().toISOString(),
    last_updated_by: author,
    revision: (record.revision || 0) + 1,
    schema_version: UI_CONFIG_SCHEMA_VERSION,
  };
  return sanitizeRecordForPersistence(next);
}

/**
 * Resolution order used by every consumer:
 *   database record value → registry default → inline fallback supplied at the call site.
 * An explicit empty string in the database is honoured (users may blank a label).
 */
export function resolveText(
  record: UIConfigRecord | undefined,
  definition: UICopySlotDefinition | undefined,
  inlineFallback?: string,
  field: "text" | "label" | "sub_label" | "placeholder" | "tooltip" | "helper_text" = "text"
): string {
  if (record) {
    const value = record[field];
    if (typeof value === "string") return value;
    // `text` and `label` are interchangeable for simple slots.
    if (field === "text" && typeof record.label === "string") return record.label;
    if (field === "label" && typeof record.text === "string") return record.text;
  }
  if (definition && typeof definition.default_text === "string" && definition.default_text.length) {
    return definition.default_text;
  }
  return inlineFallback ?? "";
}

/** True when the record carries at least one user override. */
export function isCustomised(record: UIConfigRecord | undefined): boolean {
  if (!record) return false;
  for (const field of EDITABLE_TEXT_FIELDS) {
    const value = record[field];
    if (typeof value === "string" && value !== record.default_text) return true;
  }
  if (typeof record.icon_name === "string" && record.icon_name.length > 0) return true;
  return Boolean(record.layout_properties && Object.keys(record.layout_properties).length > 0);
}

/* ------------------------------------------------------------------ *
 * Public ComponentConfig contract
 * ------------------------------------------------------------------ *
 * The System cheat sheet and any external maintenance tooling consume this
 * stable, flattened shape. It is derived from — never duplicated alongside —
 * the database record, so `ui_config_registry` remains the single source of
 * truth.
 */

export type ComponentConfigElementType =
  | "section"
  | "header"
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

export interface ComponentConfig {
  /** Sequential numeric Component ID, e.g. `"0034"`. */
  component_id: string;
  element_type: ComponentConfigElementType;
  /** e.g. `"UserSettings.Security"` or `"System → Cheat Sheet → Table"`. */
  parent_section: string;
  label: string;
  sub_label?: string;
  icon_name?: string;
  layout_props: {
    visible: boolean;
    order?: number;
    variant?: string;
  };
  last_updated_at: string;
  /** Underlying database document address. */
  element_key: string;
  module_path?: string;
  kind: UIElementKind;
}

/**
 * Flattens a persisted `UIConfigRecord` into the public `ComponentConfig`
 * contract. The optional index entry supplies parent/module metadata for
 * records written before those fields were denormalised.
 */
export function toComponentConfig(
  record: UIConfigRecord,
  entry?: {
    component_id?: string;
    element_type?: string;
    parent_section?: string;
    module_path?: string;
  }
): ComponentConfig {
  return {
    component_id:
      record.numeric_component_id || entry?.component_id || record.component_id || "0000",
    element_type: (record.element_type ||
      entry?.element_type ||
      (record.kind === "heading"
        ? "header"
        : record.kind === "sub_label"
        ? "sublabel"
        : record.kind === "label"
        ? "label"
        : "text")) as ComponentConfigElementType,
    parent_section:
      record.parent_section || entry?.parent_section || record.module || "General",
    label: record.label ?? record.text ?? record.default_text,
    sub_label: record.sub_label,
    icon_name: record.icon_name,
    layout_props: {
      visible: record.layout_properties?.visible !== false,
      order: record.layout_properties?.order,
      variant: record.layout_properties?.variant,
    },
    last_updated_at: record.last_updated_at,
    element_key: record.element_key,
    module_path: entry?.module_path || record.source_file,
    kind: record.kind,
  };
}
