# Component Maintenance System

The **Button & Layout Optimizer Studio** is the single engine for every label,
icon and layout flag in the application. This document describes the layers added
on top of it: sequential Component IDs, atomic configuration primitives,
database-backed icon overrides, and the in-app **Component Maintenance Cheat
Sheet** under `/system`.

---

## 1. What is addressable now

| Layer | Count | Where |
| --- | ---: | --- |
| Atomic System components | 75 | `src/types/atomicComponentManifest.ts` |
| Registered buttons & labels | 1,225 | `BUTTON_DEFINITIONS` / `CATALOGUED_COMPONENTS` |
| Bound copy slots | 3,839 | `src/types/generatedCopyRegistry.ts` |
| **Total Component IDs** | **5,139** | `src/types/componentIdMap.generated.ts` |

The complete, generated catalogue lives in
`src/types/componentIndex.generated.ts` (lazy-loaded by `/system`). A human
summary is generated at `docs/COMPONENT_INDEX.md`.

Every ID is a zero-padded numeric string that never changes once allocated:

```
0001  system_view.page.eyebrow_label
0002  system_view.page.main_heading
0054  button:header_logo
1263  element:app.b.append
5102  element:ui_controls.icon_select.quick_switch_option
```

---

## 2. ID architecture

```
src/types/atomicComponentManifest.ts   ← developers declare new atomic components
                │
                ▼
scripts/generateComponentIndex.ts      ← npm run ui:index
                │  preserves existing IDs, appends new ones
                ├─► componentIdMap.generated.ts     (fast key → ID lookup, DOM tagging)
                ├─► componentIndex.generated.ts     (full metadata catalogue, lazy)
                └─► docs/COMPONENT_INDEX.md         (generated summary)
```

### Why two generated files?

* **`componentIdMap.generated.ts`** is imported by the hot path that mounts
  `data-component-id` on buttons, labels, containers and atomic primitives.
* **`componentIndex.generated.ts`** carries element type, parent section, module
  path, default copy/icon and is only loaded when the System view opens.

### Stable allocation

The generator reads the committed map before allocating:

1. Existing `component_key → ID` pairs are preserved verbatim.
2. New keys append the next available ID.
3. Removed components retire their IDs — numbers are never reused.

Regenerate and verify:

```bash
npm run ui:index        # mint IDs + refresh the Lucide icon map
npm run ui:icons        # refresh only the icon map
npm run ui:index:check  # CI guard: fails if generated files are stale
npm run ui:check        # verify harness + index check + copy audit + tsc
```

### DOM tagging

Every configurable primitive mounts both attributes:

```html
<button data-component-id="0054" data-component-key="button:header_logo" data-ibc-id="header_logo">
```

Look up a live element from DevTools or an automated test:

```js
document.querySelector('[data-component-id="0054"]');
```

Covered primitives:

| Component | Mounted ID source |
| --- | --- |
| `CustomizableButton` | `getComponentIdForButton(buttonId)` |
| `CustomizableLabel` | `getComponentIdForButton(labelId)` |
| `CustomizableContainer` | `getComponentIdForButton(ibcId)` |
| `CustomizableLogo` | `button:header_logo` |
| `ConfigSection` / `ConfigHeader` / `ConfigLabel` / `ConfigSubLabel` / `ConfigIcon` / `ConfigButton` | `getComponentIdForElementKey(elementKey)` |
| Cheat-sheet & COPY registry rows | `data-component-id` + `data-component-row-id` |

---

## 3. Database schema

### Public contract

```typescript
interface ComponentConfig {
  component_id: string;          // "0034"
  element_type: "section" | "header" | "label" | "sublabel" | "button" | "icon" | "text" | …;
  parent_section: string;        // "System → Cheat Sheet → Table"
  label: string;
  sub_label?: string;
  icon_name?: string;            // "Folder", "Settings", "Check", any registered icon name
  layout_props: {
    visible: boolean;
    order?: number;
    variant?: string;
  };
  last_updated_at: string;
  element_key: string;           // database address
  module_path?: string;
  kind: string;
}
```

`toComponentConfig(record, entry?)` in `src/types/uiConfigSchema.ts` derives this
shape from a persisted record. The internal record is a superset:

```typescript
interface UIConfigRecord {
  element_key: string;
  component_id: string;          // component slug (legacy compatibility)
  numeric_component_id?: string; // sequential Component ID, persisted
  element_type?: string;
  parent_section?: string;
  module: string;
  kind: string;
  text?: string;
  label?: string;
  sub_label?: string;
  placeholder?: string;
  tooltip?: string;
  helper_text?: string;
  icon_name?: string;
  layout_properties?: UILayoutProperties;
  default_text: string;
  notes?: string;
  last_updated_at: string;
  last_updated_by: string;
  revision: number;
  schema_version: number;          // current version: 3
}
```

### Collections

| Collection | Purpose |
| --- | --- |
| `ui_config_registry/{module}` | One document per module; `records[element_key]` holds the override. |
| `ui_config_audit/{auditId}` | Append-only before/after log for every upsert, bulk upsert and reset. |
| `ui_kv/{shard}` | Database-backed key/value mirror for the button customizer and legacy configuration keys. |

No configuration state is written to `localStorage` or `sessionStorage`. The
verification harness scans `src/` on every `npm run ui:check` and fails on any
storage call.

### Write path

```
System cheat sheet / Optimizer Studio
        │  inline edit
        ▼
UIConfigProvider
        │  1. optimistic in-memory patch (instant paint)
        │  2. validateUIConfigRecord()      → schema errors reject the write
        │  3. setDoc(..., { merge: true })  → atomic document merge
        │  4. ui_config_audit entry         → before / after / author / timestamp
        │  5. on rejection: rollback + syncState = "error"
        ▼
Firestore  ──onSnapshot──►  every open tab re-renders
```

Button/label edits go through `ButtonCustomizationContext`, which persists its
map into the database-backed `remoteKeyValueStore` (`ui_kv` shards + dedicated
`app_states` documents) with the same optimistic/rollback behaviour.

---

## 4. System view & cheat sheet

Route: **`/system`** (also reachable from the front-page **System** slide-out
menu). The route is resolved in `src/main.tsx`; Express/Vite SPA fallback serves
the app shell for the path in both dev and production.

### Capabilities

| Capability | Behaviour |
| --- | --- |
| Full registry listing | All 5,139 IDs, paginated 80 rows at a time. |
| Search | ID (`0034` or `34`), label, icon, parent, module path, element key, button id. |
| Filters | Element type, source (`button` / `copy` / `atomic`), database overrides only. |
| Sort | Component ID, label, element type, parent section or last-edited timestamp. |
| Jump to ID | Enter a numeric ID, expands + scrolls + highlights the row. |
| Inline label edit | Commits on blur/Enter to `ui_config_registry`. |
| Inline icon edit | Quick-switch palette (Folder, Settings, Check, Lock, Database, …) or any name in the generated 460-icon Lucide map. |
| Layout overrides | Visible toggle, order, variant, alignment. |
| Advanced row | Sub-label, tooltip, variant, alignment, maintenance notes, module path, raw key. |
| Reset | Clears the override and returns to the registry default. |
| Studio deep link | Opens the exact button/copy slot in the Button & Layout Optimizer Studio. |
| Sync telemetry | Registry state, last sync timestamp, pending writes, last error. |

### Deep-link contract

```
/?studio=1&tab=copy&elementKey=app.button.append&componentId=1263
/?studio=1&tab=customize&buttonId=header_logo&componentId=0054
/?studio=1&componentId=1263          # bare ID → resolves to the copy slot
/?studio=1&componentId=0054          # bare ID → resolves to the button
```

`StudioDeepLinkBridge` consumes the query on boot, calls `openStudioModal`, and
cleans the URL with `history.replaceState`. The modal applies the target tab and
passes `focusElementKey` to the COPY panel, which searches, expands and scrolls
to the row. No browser storage is involved.

---

## 5. Atomic primitives

`src/components/ui/ConfigPrimitives.tsx` exposes one component per element
class. Every primitive resolves copy, icon, visibility and layout from the
database first, then the atomic manifest.

```tsx
import {
  ConfigSection, ConfigHeader, ConfigLabel, ConfigSubLabel,
  ConfigIcon, ConfigButton, ConfigText, ConfigInput, ConfigOption, ConfigMessage,
} from "../components/ui/ConfigPrimitives";

<ConfigSection elementKey="system_view.help.section">
  <ConfigHeader elementKey="system_view.help.main_heading" as="h2" />
  <ConfigSubLabel elementKey="system_view.page.subtitle_label" as="p" />
  <ConfigLabel elementKey="system_view.stats.total_label" iconName="Hash" />
  <ConfigButton elementKey="system_view.nav.reload_button" onClick={reload} />
</ConfigSection>
```

The manifest seed supplies the semantic default and the slot `kind`, so the
primitive needs no copy literals:

```typescript
{
  element_key: "system_view.nav.reload_button",
  element_type: "button",
  parent_section: "System → Page Header",
  module_path: "src/components/system/SystemView.tsx",
  default_label: "Reload from database",
  default_icon: "RefreshCw",
  element_kind: "label",
}
```

### Icons

* Stored by name (`icon_name`) on the database record.
* Resolved at render time through the curated `ICON_MAP`
  (`src/utils/customIconRegistry.tsx`) + the generated tree-shakeable
  `LUCIDE_ICON_MAP` (`src/utils/lucideIconMap.generated.ts`). Unknown names
  render nothing and are flagged red in the editor.
* The generated map covers every icon referenced by JSX, button definitions,
  the atomic manifest and the curated presets. `npm run ui:icons` refreshes it
  after a new icon name is introduced; `ui:index:check` fails when it is stale.
* Buttons keep their existing Optimizer Studio icon config (`iconName`,
  `customIconType`, `customIconData`).
* The shared `IconNameSelect` editor is used by both the cheat sheet and the
  studio COPY tab.

---

## 6. Adding a new component (workflow)

1. Add a seed to `src/types/atomicComponentManifest.ts` (or register a new
   button in `BUTTON_DEFINITIONS`).
2. Render it with a `Config*` primitive, or with `CustomizableButton` /
   `CustomizableLabel` if it is a registered button.
3. Run `npm run ui:index` → the next sequential ID is appended and committed.
4. `npm run ui:check` → index check, copy audit, 66-assertion verify harness and
   `tsc --noEmit`.
5. The component appears in `/system` immediately (the cheat sheet loads the
   generated catalogue) and is editable by ID.

### Removing a component

Delete the declaration and run `npm run ui:index`. The ID is retired, never
reused. The map and catalogue shrink to the live set; database records for the
removed key remain in the audit trail.

---

## 7. File map

| Path | Responsibility |
| --- | --- |
| `src/types/componentIndex.ts` | ID types, formatting, element-type mapping, DOM helpers |
| `src/types/componentLookup.ts` | Synchronous generated-map lookups |
| `src/types/componentIdMap.generated.ts` | **generated** key → ID map (hot path) |
| `src/types/componentIndex.generated.ts` | **generated** full catalogue (lazy) |
| `src/types/atomicComponentManifest.ts` | Declarations + defaults for atomic components |
| `src/components/ui/ConfigPrimitives.tsx` | Section / header / label / sub-label / icon / button / text / input / option / message primitives |
| `src/components/ui/IconNameSelect.tsx` | Icon quick-switch + free-text database editor |
| `src/components/ui/iconResolver.tsx` | Name → Lucide resolver + curated palette |
| `src/utils/lucideIconMap.generated.ts` | **generated** tree-shakeable Lucide registry (460 icons) |
| `scripts/generateIconMap.ts` | Regenerates the icon map from source imports / definitions |
| `src/components/system/SystemView.tsx` | `/system` page, stats, help, sync telemetry |
| `src/components/system/ComponentCheatSheet.tsx` | Searchable/editable ID catalogue |
| `src/components/system/StudioDeepLinkBridge.tsx` | Query-string deep link → studio modal |
| `src/services/studioDeepLink.ts` | Deep-link build/parse/queue helpers |
| `scripts/generateComponentIndex.ts` | Stable ID allocator + generated artefacts |
| `scripts/verifyUiConfig.ts` | 66 assertions incl. ID integrity, icon resolution, deep links and the zero-storage guard |

---

## 8. Verification

```bash
npm run ui:verify       # schema, resolution, IDs, icon persistence, zero storage
npm run ui:index:check  # generated index is current
npm run ui:audit        # 0 unbound literals, 0 storage accesses
npm run lint            # tsc --noEmit
npm run build           # vite production build
npm run ui:check        # all of the above (except build)
```

Current result:

```
✓ ALL CHECKS PASSED — 3839 slots across 81 modules, 5139 component IDs
```
