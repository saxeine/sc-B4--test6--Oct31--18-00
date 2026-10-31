/**
 * Verification harness for the database-backed UI configuration layer.
 *
 *   npx tsx scripts/verifyUiConfig.ts
 *
 * Checks (no network / no browser required):
 *   1. Every generated element_key satisfies the schema key grammar.
 *   2. Keys are unique and every slot carries a compile-time fallback.
 *   3. Resolution order works: database record → registry default → inline fallback.
 *   4. Runtime self-registration captures keys the codemod never saw.
 *   5. Record validation rejects malformed payloads.
 *   6. Sequential Component IDs are complete, unique and index-consistent.
 *   7. Numeric IDs / icon overrides survive persistence and flattening.
 *   8. No browser storage is used anywhere under `src/`.
 *   9. Component index → Optimizer Studio deep links round-trip.
 */

import fs from "node:fs";
import path from "node:path";
import {
  GENERATED_COPY_SLOTS,
  GENERATED_COPY_MODULES,
} from "../src/types/generatedCopyRegistry";
import { BUTTON_DEFINITIONS } from "../src/types/buttonCustomization";
import { ATOMIC_COMPONENT_MANIFEST } from "../src/types/atomicComponentManifest";
import { COMPONENT_INDEX, COMPONENT_INDEX_BY_ID } from "../src/types/componentIndex.generated";
import {
  getComponentIdForButton,
  getComponentIdForElementKey,
  COMPONENT_ID_MAP,
} from "../src/types/componentLookup";
import {
  applyPatch,
  createRecord,
  isValidElementKey,
  moduleDocId,
  sanitizeRecordForPersistence,
  toComponentConfig,
  validateUIConfigRecord,
  type UIConfigRecord,
} from "../src/types/uiConfigSchema";
import {
  getRuntimeSlots,
  putRecord,
  replaceAllRecords,
  resolveSlot,
  uiText,
  uiVisible,
} from "../src/services/uiConfigStore";
import { isKnownIcon } from "../src/components/ui/iconResolver";
import {
  buildStudioHref,
  consumePendingStudioDeepLink,
  parseStudioDeepLink,
  requestStudioDeepLink,
  studioHrefForComponent,
} from "../src/services/studioDeepLink";

/** Recursively collects every TypeScript source file under a directory. */
const walk = (dir: string, acc: string[] = []): string[] => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full);
  }
  return acc;
};

let failures = 0;
const check = (name: string, condition: boolean, detail = "") => {
  if (condition) {
    console.log(`  ✓ ${name}`);
  } else {
    failures += 1;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

console.log("\n1. Generated registry integrity");
const invalidKeys = GENERATED_COPY_SLOTS.filter((s) => !isValidElementKey(s.element_key));
check(
  `all ${GENERATED_COPY_SLOTS.length} element keys match the schema grammar`,
  invalidKeys.length === 0,
  invalidKeys
    .slice(0, 5)
    .map((s) => s.element_key)
    .join(", ")
);

const seen = new Set<string>();
const duplicates: string[] = [];
for (const slot of GENERATED_COPY_SLOTS) {
  if (seen.has(slot.element_key)) duplicates.push(slot.element_key);
  seen.add(slot.element_key);
}
check("element keys are unique", duplicates.length === 0, duplicates.slice(0, 5).join(", "));

const missingFallback = GENERATED_COPY_SLOTS.filter(
  (s) => typeof s.default_text !== "string" || s.default_text.length === 0
);
check("every slot ships a non-empty fallback", missingFallback.length === 0, String(missingFallback.length));

const missingProvenance = GENERATED_COPY_SLOTS.filter((s) => !s.source_file);
check("every slot records its source file", missingProvenance.length === 0, String(missingProvenance.length));

check(`modules catalogued: ${GENERATED_COPY_MODULES.length}`, GENERATED_COPY_MODULES.length > 0);
check(
  "module doc ids are Firestore-safe",
  GENERATED_COPY_MODULES.every((m) => /^[a-z0-9_-]{1,120}$/.test(moduleDocId(m)))
);

console.log("\n2. Resolution order");
replaceAllRecords({});
const sample = GENERATED_COPY_SLOTS[0];
check(
  "falls back to the registry default when the database is empty",
  uiText(sample.element_key, sample.default_text) === sample.default_text
);
check(
  "falls back to the inline default for an unknown key",
  uiText("verify.inline.only", "Inline Fallback") === "Inline Fallback"
);

const dbRecord: UIConfigRecord = createRecord(
  { ...sample },
  { text: "Database Override" },
  "verify@test"
);
putRecord(dbRecord);
check(
  "database record wins over the registry default",
  uiText(sample.element_key, sample.default_text) === "Database Override"
);

putRecord({ ...dbRecord, text: "" });
check(
  "an explicitly blanked label is honoured (not replaced by the default)",
  uiText(sample.element_key, sample.default_text) === ""
);

console.log("\n3. Runtime self-registration");
uiText("verify_module.runtime_component.discovered_at_runtime", "Discovered At Runtime");
const runtime = getRuntimeSlots().find(
  (s) => s.element_key === "verify_module.runtime_component.discovered_at_runtime"
);
check("unknown keys self-register for the studio", Boolean(runtime));
check("self-registered slot keeps its inline fallback", runtime?.default_text === "Discovered At Runtime");
check("self-registered slot infers its module", runtime?.module === "verify_module");

console.log("\n4. Layout properties");
putRecord({
  ...dbRecord,
  text: "Visible Text",
  layout_properties: { visible: false, order: 3, align: "center" },
});
check("visibility flag is respected", uiVisible(sample.element_key) === false);
check(
  "hidden slots resolve to empty copy everywhere",
  uiText(sample.element_key, sample.default_text) === ""
);
const resolved = resolveSlot(sample.element_key, sample.default_text);
check("layout order round-trips", resolved.layout.order === 3);
check("layout alignment round-trips", resolved.layout.align === "center");
check("slot reports itself as customised", resolved.isCustomised === true);

const patched = applyPatch(
  { ...dbRecord, layout_properties: { order: 1 } },
  { layout_properties: { visible: true } },
  "verify@test"
);
check("patch merges layout instead of replacing it", patched.layout_properties?.order === 1);
check("patch applies the new layout field", patched.layout_properties?.visible === true);
check("patch bumps the revision", patched.revision === (dbRecord.revision || 0) + 1);
check("patch stamps the author", patched.last_updated_by === "verify@test");

console.log("\n5. Validation");
check("valid record passes validation", validateUIConfigRecord(dbRecord).valid);
check(
  "bad element key is rejected",
  !validateUIConfigRecord({ ...dbRecord, element_key: "Not A Key!" }).valid
);
check(
  "oversized copy is rejected",
  !validateUIConfigRecord({ ...dbRecord, text: "x".repeat(4001) }).valid
);
check(
  "bad layout alignment is rejected",
  !validateUIConfigRecord({ ...dbRecord, layout_properties: { align: "diagonal" as any } }).valid
);

const sanitized = sanitizeRecordForPersistence({
  ...dbRecord,
  tooltip: undefined,
  // @ts-expect-error — deliberately injecting an unknown field
  rogue_field: "should be stripped",
});
check("undefined fields are stripped for Firestore", !("tooltip" in sanitized));
check("unknown fields are stripped for Firestore", !("rogue_field" in sanitized));

console.log("\n6. Sequential Component ID index");
check(`component index has ${COMPONENT_INDEX.length} entries`, COMPONENT_INDEX.length > 0);
check(
  "every atomic System component is indexed",
  ATOMIC_COMPONENT_MANIFEST.every((seed) => Boolean(getComponentIdForElementKey(seed.element_key))),
  ATOMIC_COMPONENT_MANIFEST.filter((seed) => !getComponentIdForElementKey(seed.element_key))
    .slice(0, 5)
    .map((seed) => seed.element_key)
    .join(", ")
);
check(
  "every registered button is indexed",
  BUTTON_DEFINITIONS.every((definition) => Boolean(getComponentIdForButton(definition.id))),
  BUTTON_DEFINITIONS.filter((definition) => !getComponentIdForButton(definition.id))
    .slice(0, 5)
    .map((definition) => definition.id)
    .join(", ")
);
check(
  "every generated copy slot is indexed",
  GENERATED_COPY_SLOTS.every((slot) => Boolean(getComponentIdForElementKey(slot.element_key))),
  GENERATED_COPY_SLOTS.filter((slot) => !getComponentIdForElementKey(slot.element_key))
    .slice(0, 5)
    .map((slot) => slot.element_key)
    .join(", ")
);

const malformedIds = COMPONENT_INDEX.filter((entry) => !/^\d{4,6}$/.test(entry.component_id));
check("all Component IDs are zero-padded numeric strings", malformedIds.length === 0);
const duplicateIds = COMPONENT_INDEX.length - new Set(COMPONENT_INDEX.map((entry) => entry.component_id)).size;
check("Component IDs are unique", duplicateIds === 0, String(duplicateIds));
check(
  "the lookup map and the catalogue agree",
  Object.keys(COMPONENT_ID_MAP).length === COMPONENT_INDEX.length &&
    Object.keys(COMPONENT_INDEX_BY_ID).length === COMPONENT_INDEX.length
);
check(
  "every catalogue row resolves back to its own ID",
  COMPONENT_INDEX.every((entry) => COMPONENT_ID_MAP[entry.component_key] === entry.component_id)
);
/* Every buttonId / labelId rendered in src/ must own a registry entry — and
   therefore a Component ID — or the studio cannot address it. */
const renderedButtonIds = new Set<string>();
for (const file of walk(path.resolve("src"))) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(/(?:buttonId|labelId)="([A-Za-z0-9_]+)"/g)) {
    renderedButtonIds.add(match[1]);
  }
}
const registeredButtonIds = new Set(BUTTON_DEFINITIONS.map((definition) => definition.id));
const unregisteredButtonIds = [...renderedButtonIds].filter((id) => !registeredButtonIds.has(id));
check(
  `every rendered button / label is registered (${renderedButtonIds.size} ids)`,
  unregisteredButtonIds.length === 0,
  unregisteredButtonIds.slice(0, 8).join(", ")
);
check(
  "every registered button owns a Component ID",
  BUTTON_DEFINITIONS.every((definition) => getComponentIdForButton(definition.id) === COMPONENT_ID_MAP[`button:${definition.id}`]) &&
    BUTTON_DEFINITIONS.every((definition) => Boolean(getComponentIdForButton(definition.id))),
  BUTTON_DEFINITIONS.filter((definition) => !getComponentIdForButton(definition.id))
    .slice(0, 5)
    .map((definition) => definition.id)
    .join(", ")
);

const runtimeKeys = new Set(getRuntimeSlots().map((slot) => slot.element_key));
check(
  "atomic System components are pre-registered for the studio",
  ATOMIC_COMPONENT_MANIFEST.every((seed) => runtimeKeys.has(seed.element_key)),
  ATOMIC_COMPONENT_MANIFEST.filter((seed) => !runtimeKeys.has(seed.element_key))
    .slice(0, 5)
    .map((seed) => seed.element_key)
    .join(", ")
);
check(
  "the catalogue is sorted by Component ID",
  COMPONENT_INDEX.every((entry, index) =>
    index === 0 ? true : COMPONENT_INDEX[index - 1].component_id < entry.component_id
  )
);

console.log("\n7. Numeric ID + icon persistence");
const sampleId = getComponentIdForElementKey(sample.element_key);
const iconRecord: UIConfigRecord = createRecord(
  {
    ...sample,
    numeric_component_id: sampleId,
    element_type: "text",
    parent_section: "Verify → Index",
  },
  {
    icon_name: "Folder",
    sub_label: "Folder override",
    layout_properties: { visible: true, order: 7, variant: "compact" },
  },
  "verify@test"
);
putRecord(iconRecord);
const iconResolved = resolveSlot(sample.element_key, sample.default_text);
check("icon override resolves through the store", iconResolved.iconName === "Folder");
check("numeric Component ID is persisted on the record", iconRecord.numeric_component_id === sampleId);
check("element metadata is persisted on the record", iconRecord.element_type === "text");
const flattened = toComponentConfig(iconRecord);
check("public ComponentConfig exposes component_id", flattened.component_id === sampleId);
check("public ComponentConfig exposes layout_props.order", flattened.layout_props.order === 7);
check("public ComponentConfig exposes icon_name", flattened.icon_name === "Folder");
check(
  "invalid icon names are rejected by schema validation",
  !validateUIConfigRecord({ ...iconRecord, icon_name: "x".repeat(81) }).valid
);
const unresolvableIcons = COMPONENT_INDEX.filter(
  (entry) => entry.default_icon && entry.default_icon !== "none" && !isKnownIcon(entry.default_icon)
);
check(
  "every default icon resolves through the icon registry",
  unresolvableIcons.length === 0,
  unresolvableIcons
    .slice(0, 5)
    .map((entry) => `${entry.component_id}:${entry.default_icon}`)
    .join(", ")
);
check(
  "the icon registry resolves names outside the curated palette",
  isKnownIcon("Folder") && isKnownIcon("Check") && isKnownIcon("ChevronDown") && isKnownIcon("folder-icon")
);

console.log("\n8. Persistence boundaries");
const storageHits = walk(path.resolve("src")).filter((file) =>
  /(?:localStorage|sessionStorage)\s*\.\s*(?:getItem|setItem|removeItem|clear|key|length)\b/.test(
    fs.readFileSync(file, "utf8")
  )
);
check("zero localStorage / sessionStorage calls in src/", storageHits.length === 0, storageHits.join(", "));
check(
  "System view route is wired",
  fs.readFileSync(path.resolve("src/main.tsx"), "utf8").includes('=== "/system"')
);
check(
  "System view component exists",
  fs.existsSync(path.resolve("src/components/system/SystemView.tsx"))
);
check(
  "Cheat sheet component exists",
  fs.existsSync(path.resolve("src/components/system/ComponentCheatSheet.tsx"))
);
check(
  "System menu opens the /system route",
  /front_page_ad_open_system_view[\s\S]{0,400}window\.location\.assign\("\/system"\)/.test(
    fs.readFileSync(path.resolve("src/App.tsx"), "utf8")
  )
);

console.log("\n9. Studio deep links");
const copyHref = studioHrefForComponent({ source: "copy", element_key: sample.element_key, component_id: sampleId! });
const buttonHref = studioHrefForComponent({ source: "button", button_id: "header_logo", component_id: "0054" });
check("copy slots deep-link to the COPY tab", copyHref.includes("tab=copy") && copyHref.includes("elementKey="));
check("buttons deep-link to the CUSTOMIZE tab", buttonHref.includes("tab=customize") && buttonHref.includes("buttonId=header_logo"));
const parsedCopy = parseStudioDeepLink(copyHref.slice(copyHref.indexOf("?")));
check(
  "copy deep link parses back to the element key",
  parsedCopy?.elementKey === sample.element_key && parsedCopy?.tab === "copy"
);
const parsedButton = parseStudioDeepLink(buttonHref.slice(buttonHref.indexOf("?")));
check(
  "button deep link parses back to the button id",
  parsedButton?.buttonId === "header_logo" && parsedButton?.tab === "customize"
);
check("plain URLs are not treated as studio links", parseStudioDeepLink("?foo=bar") === null);
const idOnlyCopy = parseStudioDeepLink(`?studio=1&componentId=${sampleId}`);
check(
  "a bare copy-slot Component ID resolves to its element key",
  idOnlyCopy?.elementKey === sample.element_key && idOnlyCopy?.tab === "copy"
);
const idOnlyButton = parseStudioDeepLink("?studio=1&componentId=0054");
check(
  "a bare button Component ID resolves to its button id",
  idOnlyButton?.buttonId === "header_logo" && idOnlyButton?.tab === "customize"
);
const queuedLink = { tab: "copy" as const, elementKey: sample.element_key, componentId: sampleId! };
requestStudioDeepLink(queuedLink);
check("queued deep links are consumed exactly once", consumePendingStudioDeepLink() === queuedLink);
check("the queue is empty after consumption", consumePendingStudioDeepLink() === null);
check(
  "the studio modal subscribes to deep links",
  fs.readFileSync(path.resolve("src/components/ButtonCustomizationModal.tsx"), "utf8").includes("subscribeStudioDeepLink")
);
check(
  "the COPY panel focuses the deep-linked slot",
  fs.readFileSync(path.resolve("src/components/UICopyRegistryPanel.tsx"), "utf8").includes("focusElementKey")
);

console.log(
  `\n${failures === 0 ? "✓ ALL CHECKS PASSED" : `✗ ${failures} CHECK(S) FAILED`} — ${GENERATED_COPY_SLOTS.length} slots across ${GENERATED_COPY_MODULES.length} modules, ${COMPONENT_INDEX.length} component IDs\n`
);
process.exit(failures === 0 ? 0 : 1);
