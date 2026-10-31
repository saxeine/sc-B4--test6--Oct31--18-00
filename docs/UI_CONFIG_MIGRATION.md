# Centralised UI Copy & Layout — Migration Guide

> **Update — Component Maintenance System.** The registry now also owns a
> sequential numeric **Component ID** for every element, database-backed icon
> overrides, DOM tagging (`data-component-id`) and the in-app cheat sheet at
> **`/system`**. See [`COMPONENT_MAINTENANCE_SYSTEM.md`](./COMPONENT_MAINTENANCE_SYSTEM.md)
> for the full architecture, schema and workflow.

The **Button & Layout Optimizer Studio** is now the single source of truth for
UI copy and layout configuration. Every user-facing string resolves through a
registered `element_key` and persists in the database. `localStorage` is gone
from the configuration path.

---

## 1. Results

| Metric | Before | After |
| --- | ---: | ---: |
| Hardcoded user-facing literals | **3 818** | **0** |
| Studio-bound literals | 760 | **4 620** (781 component props + 3 839 registry slots) |
| Registry slots catalogued | 0 | **3 839** across **81 modules** |
| Component IDs allocated | 0 | **5 139** (atomic + buttons + copy slots) |
| `localStorage` / `sessionStorage` accesses | 528 in 23 files | **0** |
| Imperative messages inventoried | — | 319 (5 bound via `uiMessage`) |
| `tsc --noEmit` | clean | clean |
| `vite build` | clean | clean |

Re-verify at any time:

```bash
npm run ui:check      # verify harness + index/icon check + audit + typecheck
```

---

## 2. Architecture

```
                         ┌──────────────────────────────────────────┐
                         │  Button & Layout Optimizer Studio        │
                         │  ButtonCustomizationModal.tsx            │
                         │    ├─ CUSTOMIZE / STYLES / GROUPS / …    │  ← buttons & labels
                         │    └─ COPY  → UICopyRegistryPanel.tsx    │  ← all other copy
                         └───────────────┬──────────────────────────┘
                                         │  Component ID
                         ┌───────────────▼──────────────────────────┐
                         │  /system → ComponentCheatSheet.tsx       │
                         │  search · inline edit · icon switch      │
                         │  layout flags · studio deep link         │
                         └───────────────┬──────────────────────────┘
                                         │ optimistic writes
                         ┌───────────────▼──────────────────────────┐
                         │  UIConfigProvider  (context/)            │
                         │  hydrate · subscribe · patch · rollback  │
                         └───────┬───────────────────┬──────────────┘
                                 │                   │
            ┌────────────────────▼──────┐   ┌────────▼───────────────────────┐
            │ uiConfigRepository.ts     │   │ uiConfigStore.ts               │
            │ Firestore CRUD + audit    │   │ synchronous read mirror        │
            └────────────┬──────────────┘   └────────┬───────────────────────┘
                         │                           │ uiText() / uiMessage()
            ┌────────────▼──────────────┐   ┌────────▼───────────────────────┐
            │ ui_config_registry/{mod}  │   │ every component in src/         │
            │ ui_config_audit/{id}      │   └────────────────────────────────┘
            │ ui_kv/{shard}             │  ← database-backed localStorage replacement
            └───────────────────────────┘
```

### Files added

| Path | Responsibility |
| --- | --- |
| `src/types/uiConfigSchema.ts` | `UIConfigRecord`, `UILayoutProperties`, validators, resolution order |
| `src/types/generatedCopyRegistry.ts` | **generated** — 3 839 slots with compile-time fallbacks |
| `src/services/uiConfigRepository.ts` | Firestore CRUD for `ui_config_registry` + append-only `ui_config_audit` |
| `src/services/uiConfigStore.ts` | Synchronous read mirror, `uiText`, `uiMessage`, `uiLayout`, runtime slot discovery |
| `src/services/remoteKeyValueStore.ts` | Database-backed `localStorage` replacement (`ui_kv` collection) |
| `src/context/UIConfigProvider.tsx` | Hydration, live subscription, optimistic writes, rollback, sync status |
| `src/hooks/useUIConfig.ts` | `useUIConfig` / `useUIText` / `useUILayout` / `uiText` / `uiMessage` |
| `src/components/UICopyRegistryPanel.tsx` | Studio **COPY** tab — search, edit, preview, layout, revert |
| `scripts/auditUiStrings.cjs` | Phase 1 audit (AST-based) |
| `scripts/migrateHardcodedStrings.cjs` | Phase 3 codemod (idempotent) |
| `scripts/migrateLocalStorage.cjs` | Phase 2 storage codemod |
| `scripts/verifyUiConfig.ts` | 66-assertion verification harness |

---

## 3. Migration checklist

Completed in this change set — reuse the same order for any further module.

- [x] **1. Audit** — `npm run ui:audit` inventories every literal, attribute and
      storage access into `docs/ui-copy-audit.json` + `docs/UI_COPY_AUDIT.md`.
- [x] **2. Schema** — `src/types/uiConfigSchema.ts` defines `element_key`,
      `component_id`, `module`, `text` / `label` / `sub_label` / `placeholder` /
      `tooltip` / `helper_text`, `layout_properties`, `last_updated_at`,
      `last_updated_by`, `revision`, `schema_version` + runtime validation.
- [x] **3. Data layer** — `uiConfigRepository.ts` (one document per module,
      append-only audit trail) and `remoteKeyValueStore.ts` (sharded `ui_kv`
      mirror with optimistic batching and rollback).
- [x] **4. Security rules** — `firestore.rules` grants scoped access to
      `ui_config_registry`, `ui_config_audit` (create-only) and `ui_kv`.
- [x] **5. Boot order** — `src/main.tsx` awaits `hydrateRemoteStore()` before the
      first paint and mounts `<UIConfigProvider>` above the app.
- [x] **6. Storage removal** — `npm run ui:migrate:storage` rewrote 501
      accesses; `src/utils/idbStorage.ts` was hand-migrated to
      “Firestore primary + IndexedDB binary cache”.
- [x] **7. Copy binding** — `npm run ui:migrate:copy` bound 3 804 literals in 79
      files and generated the slot registry.
- [x] **8. Studio surface** — new **COPY** tab (`UICopyRegistryPanel`) with
      search, module filter, “edited only”, inline editing, sub-label /
      placeholder / tooltip / helper fields, layout controls, revert, live sync
      badge and “Reload from DB”.
- [x] **9. Verification** — `npm run ui:verify` (28 assertions), `npm run lint`,
      `npx vite build`, dev-server smoke test.
- [ ] **10. Phase 5 (backlog)** — wrap the 318 inventoried imperative messages
      with `uiMessage()`; four exemplars are already migrated in
      `ButtonCustomizationModal.tsx`.

---

## 4. Developer workflow

### Rendering copy

```tsx
import { uiText } from "../hooks/useUIConfig";

<h2>{uiText("crop_sidebar.h2.crop_and_carve", "Crop & Carve")}</h2>
<input placeholder={uiText("crop_sidebar.input.file_name.placeholder", "File name")} />
```

`uiText` is a plain function, so it is legal inside attributes, `.map()`
callbacks and conditionals — places where React forbids hooks. Re-rendering is
driven by `UIConfigProvider`, whose context value changes on every commit.

### Reactive / richer access

```tsx
const slot = useUIConfig("storyboard.export_button", "Export");
if (!slot.visible) return null;
<button title={slot.tooltip} style={{ order: slot.layout.order }}>{slot.label}</button>
```

### Dynamic messages

```ts
setStatus(uiMessage("export.toast.done", "Exported {count} slices", { count }));
```

### Adding a new string

1. Write it inline: `uiText("my_module.my_component.my_slot", "My copy")`.
2. Run `npm run ui:migrate:copy` to refresh `generatedCopyRegistry.ts`.
   (Skipping this is safe — the slot self-registers at runtime and still appears
   in the studio; regenerating just adds its provenance and fallback.)
3. Run `npm run ui:check`.

### Key grammar

`<module>.<component>.<slot>[.<attribute>]` — lower snake, dot separated,
validated by `isValidElementKey()`:

```
crop_sidebar.h2.crop_and_carve
adv_modal.input.search_assets.placeholder
button_customization_modal.message.restored_from_json
```

---

## 5. Persistence model

| Collection | Document | Contents |
| --- | --- | --- |
| `ui_config_registry` | one per module (81) | `{ module, records: { element_key: UIConfigRecord }, revision, last_updated_at, last_updated_by }` |
| `ui_config_audit` | one per commit | `{ element_key, action, before, after, author, timestamp }` — create-only |
| `ui_kv` | one per shard (6) | `{ shard, entries: { key: value }, updatedAt, updatedBy }` |

* **Optimistic updates** — the in-memory record is replaced before the write is
  issued; a rejected write restores the previous value and surfaces the error on
  the row and in the sync badge.
* **Large values** — anything over 60 KB in `ui_kv` is offloaded to its own
  `app_states` document and referenced by pointer, keeping shards far below the
  1 MiB document ceiling.
* **Live sync** — `onSnapshot` on both collections; inbound snapshots never
  clobber a locally pending edit.
* **Clean reload** — `hydrateRemoteStore()` runs before the first paint, so a
  refresh renders database state, not a browser cache. It self-limits to 6 s and
  falls back to registry defaults with an `offline` badge if the database is
  unreachable.

---

## 6. Resolution order

```
database record  →  generated registry default  →  inline call-site fallback
```

An explicitly blanked value (`""`) committed from the studio **is honoured** —
clearing a label hides the text rather than resurrecting the default.

---

## 7. Flagged edge cases

| # | Case | Status | Notes |
| --- | --- | --- | --- |
| 1 | **Imperative messages** (toasts, alerts, status lines) — 318 found | Hook shipped, 4 migrated | Not JSX, so the codemod cannot see them. Use `uiMessage(key, fallback, vars)`. Inventory: `docs/UI_COPY_AUDIT.md`. |
| 2 | **Interpolated sentences** — `Quick Suggestions ({n}):` | Partially bound | The literal prefix is a slot; the trailing punctuation around the expression is not. Convert to a single `uiMessage` with a `{count}` token when the wording must be fully editable. |
| 3 | **Backend / SDK error text** — Firestore + Gemini messages | Intentionally untouched | Rendered verbatim from the service. Wrap with `uiMessage("…", "{error}", { error })` to template the surrounding sentence. |
| 4 | **Auth session cache** — `src/services/firebase.ts` (6 accesses) | Deliberate exception | Session identity is neither copy nor layout, and the shared configuration database must not become a cross-browser session store. |
| 5 | **IndexedDB binary cache** — `src/utils/idbStorage.ts` | Deliberate | Firestore is the system of record; IDB only caches large image payloads offline. No copy or layout lives there. |
| 6 | **Error-boundary copy** — `src/main.tsx` | Bound | Uses `uiText` with inline fallbacks so it still renders if the provider itself failed. |
| 7 | **Document title / meta** — `index.html` | Not bound | Static HTML outside React. Needs a head manager if it must be studio-driven. |
| 8 | **`<option>` captions** — 135 slots | Bound as string expressions | Never wrapped in an element, so `<select>` semantics are unchanged. |
| 9 | **`<pre>` / `<script>` / `<style>` / `<textarea>` children** | Skipped by design | Whitespace-significant; the codemod refuses to reflow them. |
| 10 | **Unknown HTML entities** | Skipped and reported | The codemod only rewrites text whose entities it can decode losslessly. |

---

## 8. Styling guarantee

The codemod replaces a JSX text node with a **string expression**, never with a
wrapper element:

```diff
- <span className="truncate">Add Suggestion</span>
+ <span className="truncate">{uiText("…​.span.add_suggestion", "Add Suggestion")}</span>
```

No DOM node is added, so flex/grid child counts, `:first-child` selectors and
`truncate` behaviour are untouched. JSX whitespace semantics (Babel's
line-trimming algorithm) and HTML entity decoding are reproduced exactly, so the
rendered text is byte-identical before any studio edit.

---

## 9. Rollback

Both codemods are deterministic and idempotent; `git revert` of this change set
restores the previous behaviour. To disable database-backed copy at runtime
without reverting code, clear the `ui_config_registry` collection — every slot
then falls back to its compile-time default.
