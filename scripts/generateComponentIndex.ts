/**
 * Component Index Generator
 * =========================
 * Mints the sequential Component IDs that the System cheat sheet and every
 * atomic UI primitive use.
 *
 * Sources, in allocation order:
 *   1. `ATOMIC_COMPONENT_MANIFEST`   — System view / cheat-sheet primitives
 *   2. `BUTTON_DEFINITIONS`          — every registered button & label
 *   3. `GENERATED_COPY_SLOTS`        — every copy slot bound to the studio
 *
 * Existing IDs are read back from the committed map before new keys are
 * allocated, so adding a component only ever appends a new ID — it never
 * renumbers existing components.
 *
 *   npm run ui:index           # regenerate
 *   npm run ui:index:check     # CI: fail when the committed index is stale
 */

import fs from "node:fs";
import path from "node:path";

import type { ComponentIndexEntry } from "../src/types/componentIndex";
import {
  componentKeyForButton,
  componentKeyForElementKey,
  elementTypeFromComponentType,
  elementTypeFromKind,
  humanizeIdentifier,
} from "../src/types/componentIndex";
import { ATOMIC_COMPONENT_MANIFEST } from "../src/types/atomicComponentManifest";
import { BUTTON_DEFINITIONS, SECTION_NAMES } from "../src/types/buttonCustomization";
import { GENERATED_COPY_SLOTS } from "../src/types/generatedCopyRegistry";

const ROOT = process.cwd();
const MAP_FILE = path.join(ROOT, "src/types/componentIdMap.generated.ts");
const INDEX_FILE = path.join(ROOT, "src/types/componentIndex.generated.ts");
const DOC_FILE = path.join(ROOT, "docs/COMPONENT_INDEX.md");
const CHECK = process.argv.includes("--check");

const HEADER = `// @ts-nocheck — generated artefact; the module's exported types are checked at every consumer.
/**
 * GENERATED FILE — DO NOT EDIT BY HAND
 * ------------------------------------
 * Produced by \`npm run ui:index\` (scripts/generateComponentIndex.ts).
 *
 * Existing IDs are preserved across regenerations; new components append the
 * next numeric ID. Never delete or renumber an entry that has shipped: the ID
 * is persisted on database records, QA notes and design hand-offs.
 */`;

function pad(sequence: number): string {
  return String(sequence).padStart(4, "0");
}

function q(value: unknown): string {
  return JSON.stringify(value);
}

function loadPreviousMap(): Record<string, string> {
  if (!fs.existsSync(MAP_FILE)) return {};
  try {
    const source = fs.readFileSync(MAP_FILE, "utf8");
    const result: Record<string, string> = {};
    const pattern = /"((?:[^"\\]|\\.)*)"\s*:\s*"(\d{4,6})"/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source))) {
      result[JSON.parse(`"${match[1]}"`)] = match[2];
    }
    return result;
  } catch (error) {
    console.warn("Could not read the previous component ID map — allocating fresh IDs:", error);
    return {};
  }
}

function buildEntries(): ComponentIndexEntry[] {
  const entries: ComponentIndexEntry[] = [];
  const seen = new Set<string>();

  const push = (entry: ComponentIndexEntry) => {
    if (seen.has(entry.component_key)) {
      console.warn(`Duplicate component key skipped: ${entry.component_key}`);
      return;
    }
    seen.add(entry.component_key);
    entries.push(entry);
  };

  /* 1. Atomic primitives declared for the System view and future screens. */
  for (const seed of ATOMIC_COMPONENT_MANIFEST) {
    push({
      component_id: "",
      component_key: componentKeyForElementKey(seed.element_key),
      source: "atomic",
      element_type: seed.element_type,
      parent_section: seed.parent_section,
      module_path: seed.module_path,
      default_label: seed.default_label,
      default_icon: seed.default_icon,
      element_key: seed.element_key,
      element_kind: seed.element_kind,
    });
  }

  /* 2. Every registered button / label in the Button & Layout Optimizer. */
  for (const definition of BUTTON_DEFINITIONS) {
    push({
      component_id: "",
      component_key: componentKeyForButton(definition.id),
      source: "button",
      element_type: elementTypeFromComponentType(definition.componentType),
      parent_section:
        SECTION_NAMES[definition.category]?.name || humanizeIdentifier(definition.category),
      module_path: `src/types/buttonCustomization.ts › BUTTON_DEFINITIONS › ${definition.category}`,
      default_label: definition.defaultLabel || "",
      default_icon: definition.defaultIconName,
      button_id: definition.id,
      category: definition.category,
    });
  }

  /* 3. Every copy slot the codemod bound to the studio, sorted for stability. */
  const copySlots = [...GENERATED_COPY_SLOTS].sort((a, b) =>
    a.element_key.localeCompare(b.element_key)
  );
  for (const slot of copySlots) {
    push({
      component_id: "",
      component_key: componentKeyForElementKey(slot.element_key),
      source: "copy",
      element_type: elementTypeFromKind(slot.kind),
      parent_section: `${humanizeIdentifier(slot.module)} › ${humanizeIdentifier(
        slot.component_id
      )}`,
      module_path: slot.source_file
        ? `${slot.source_file}${slot.source_line ? `:${slot.source_line}` : ""}`
        : "src/",
      default_label: slot.default_text,
      element_key: slot.element_key,
      element_kind: slot.kind,
    });
  }

  return entries;
}

function allocateIds(
  entries: ComponentIndexEntry[],
  previous: Record<string, string>
): ComponentIndexEntry[] {
  const used = new Set<string>();
  let next = 1;
  for (const id of Object.values(previous)) {
    const n = Number(id);
    if (Number.isFinite(n) && n >= next) next = n + 1;
  }

  for (const entry of entries) {
    const preserved = previous[entry.component_key];
    if (preserved && !used.has(preserved)) {
      entry.component_id = preserved;
      used.add(preserved);
      continue;
    }
    while (used.has(pad(next))) next += 1;
    entry.component_id = pad(next);
    used.add(entry.component_id);
    next += 1;
  }

  return entries.sort((a, b) => a.component_id.localeCompare(b.component_id));
}

function buildMapSource(entries: ComponentIndexEntry[]): string {
  const lines = entries.map(
    (entry) => `  ${q(entry.component_key)}: ${q(entry.component_id)},`
  );
  const highest = entries.reduce(
    (max, entry) => Math.max(max, Number(entry.component_id) || 0),
    0
  );
  return `${HEADER}

export const COMPONENT_ID_MAP: Record<string, string> = {
${lines.join("\n")}
};

/** Highest numeric ID allocated by this build (IDs are never reused). */
export const COMPONENT_ID_ALLOCATED = ${highest};
`;
}

function buildIndexSource(entries: ComponentIndexEntry[]): string {
  const lines = entries.map((entry) => `${JSON.stringify(entry)},`);
  return `${HEADER}

import type { ComponentIndexEntry } from "./componentIndex";

export const COMPONENT_INDEX: ComponentIndexEntry[] = [
${lines.join("\n")}
];

export const COMPONENT_INDEX_BY_ID: Record<string, ComponentIndexEntry> =
  Object.fromEntries(COMPONENT_INDEX.map((entry) => [entry.component_id, entry]));

export const COMPONENT_INDEX_TOTAL = ${entries.length};
`;
}

function buildDoc(entries: ComponentIndexEntry[]): string {
  const byType = new Map<string, number>();
  const bySource = new Map<string, number>();
  for (const entry of entries) {
    byType.set(entry.element_type, (byType.get(entry.element_type) || 0) + 1);
    bySource.set(entry.source, (bySource.get(entry.source) || 0) + 1);
  }
  const typeRows = [...byType.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `| ${type} | ${count} |`)
    .join("\n");
  const sourceRows = [...bySource.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => `| ${source} | ${count} |`)
    .join("\n");

  return `# Component Index

_GENERATED by \`npm run ui:index\` — do not edit by hand._

Every configurable element in the application owns a stable numeric **Component
ID**. IDs are committed to the repository, persisted on database records and
mounted on the live DOM as \`data-component-id\` for inspection and test hooks.

| Metric | Value |
| --- | ---: |
| Allocated component IDs | **${entries.length}** |
| ID range | \`${entries[0]?.component_id || "0000"}\` – \`${
    entries[entries.length - 1]?.component_id || "0000"
  }\` |
| Atomic (System) components | ${bySource.get("atomic") || 0} |
| Registered buttons / labels | ${bySource.get("button") || 0} |
| Bound copy slots | ${bySource.get("copy") || 0} |

## Components by element type

| Element type | Count |
| --- | ---: |
${typeRows}

## Components by source

| Source | Count |
| --- | ---: |
${sourceRows}

## Lookups

- Runtime: **System → Component Maintenance Cheat Sheet** (\`/system\`)
- Studio: search any row by its numeric ID or open the row's Studio link
- Code: \`getComponentIdForElementKey(key)\`, \`getComponentIdForButton(id)\`
- DOM: \`document.querySelector('[data-component-id="0034"]')\`

Regenerate after adding an atomic component:

\`\`\`bash
npm run ui:index
npm run ui:check
\`\`\`
`;
}

async function main() {
  const previous = loadPreviousMap();
  const entries = allocateIds(buildEntries(), previous);

  const outputs: Array<[string, string]> = [
    [MAP_FILE, buildMapSource(entries)],
    [INDEX_FILE, buildIndexSource(entries)],
    [DOC_FILE, buildDoc(entries)],
  ];

  if (CHECK) {
    let stale = false;
    for (const [file, expected] of outputs) {
      const actual = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
      if (actual !== expected) {
        stale = true;
        console.error(`✗ Component index is stale: ${path.relative(ROOT, file)}`);
      }
    }
    if (stale) {
      console.error("Run `npm run ui:index` and commit the regenerated files.");
      process.exit(1);
    }
    console.log(`✓ Component index is up to date (${entries.length} IDs).`);
    return;
  }

  for (const [file, content] of outputs) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, "utf8");
    console.log(`✓ wrote ${path.relative(ROOT, file)}`);
  }
  console.log(`✓ ${entries.length} component IDs allocated (0001–${pad(entries.length)}).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
