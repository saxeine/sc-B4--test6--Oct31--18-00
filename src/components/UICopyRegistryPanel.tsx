import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CloudOff,
  Database,
  Eye,
  EyeOff,
  Filter,
  Loader2,
  RotateCcw,
  Search,
  Type,
} from "lucide-react";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { useUIConfigContext } from "../context/UIConfigProvider";
import { getRuntimeSlots } from "../services/uiConfigStore";
import { getComponentIdForElementKey } from "../types/componentLookup";
import { IconNameSelect } from "./ui/IconNameSelect";
import type {
  UIConfigPatch,
  UIConfigRecord,
  UICopySlotDefinition,
  UILayoutProperties,
} from "../types/uiConfigSchema";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

/**
 * Copy & Layout Registry — the Button & Layout Optimizer Studio surface that
 * edits every non-button string in the application.
 *
 * Buttons/labels registered in BUTTON_DEFINITIONS keep their existing tabs;
 * this panel covers the headers, helper copy, placeholders, tooltips, option
 * captions and inline text the codemod bound to `uiText(...)` slots.
 *
 * All reads and writes go through `UIConfigProvider` → `uiConfigRepository` →
 * Firestore. Nothing here touches browser storage.
 */

const PAGE_SIZE = 80;

type EditableField = "text" | "sub_label" | "placeholder" | "tooltip" | "helper_text";

const FIELD_ORDER: Array<{ field: EditableField; labelKey: string; labelDefault: string }> = [
  { field: "text", labelKey: "ui_copy_registry_panel.field.text", labelDefault: "Text / Label" },
  { field: "sub_label", labelKey: "ui_copy_registry_panel.field.sub_label", labelDefault: "Sub-label" },
  { field: "placeholder", labelKey: "ui_copy_registry_panel.field.placeholder", labelDefault: "Placeholder" },
  { field: "tooltip", labelKey: "ui_copy_registry_panel.field.tooltip", labelDefault: "Tooltip" },
  { field: "helper_text", labelKey: "ui_copy_registry_panel.field.helper", labelDefault: "Helper copy" },
];

interface MergedSlot extends UICopySlotDefinition {
  record?: UIConfigRecord;
  isCustomised: boolean;
  resolved: string;
}

function resolvedValueOf(slot: UICopySlotDefinition, record?: UIConfigRecord): string {
  if (record) {
    if (typeof record.text === "string") return record.text;
    if (typeof record.label === "string") return record.label;
    if (slot.kind === "placeholder" && typeof record.placeholder === "string") return record.placeholder;
    if (slot.kind === "tooltip" && typeof record.tooltip === "string") return record.tooltip;
  }
  return slot.default_text;
}

function isSlotCustomised(record?: UIConfigRecord): boolean {
  if (!record) return false;
  return (
    typeof record.text === "string" ||
    typeof record.label === "string" ||
    typeof record.sub_label === "string" ||
    typeof record.placeholder === "string" ||
    typeof record.tooltip === "string" ||
    typeof record.helper_text === "string" ||
    (typeof record.icon_name === "string" && record.icon_name.length > 0) ||
    Boolean(record.layout_properties && Object.keys(record.layout_properties).length > 0)
  );
}

export interface UICopyRegistryPanelProps {
  /** Element key to focus when the studio is opened from the System cheat sheet. */
  focusElementKey?: string | null;
}

export function UICopyRegistryPanel({ focusElementKey }: UICopyRegistryPanelProps = {}) {
  const { records, syncStatus, kvStatus, updateSlot, resetSlot, reloadFromDatabase } =
    useUIConfigContext();

  const [generatedSlots, setGeneratedSlots] = useState<UICopySlotDefinition[]>([]);
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [customisedOnly, setCustomisedOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<Record<EditableField, string>>>>({});
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});

  // The generated catalogue is ~1 MB of fallbacks; load it on demand so it is
  // code-split out of the main application bundle.
  useEffect(() => {
    let cancelled = false;
    setIsLoadingRegistry(true);
    import("../types/generatedCopyRegistry")
      .then((mod) => {
        if (!cancelled) setGeneratedSlots(mod.GENERATED_COPY_SLOTS);
      })
      .catch((err) => console.warn("Could not load generated copy registry:", err))
      .finally(() => {
        if (!cancelled) setIsLoadingRegistry(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Generated catalogue ∪ runtime discoveries ∪ database records. */
  const allSlots = useMemo<MergedSlot[]>(() => {
    const byKey = new Map<string, UICopySlotDefinition>();
    for (const slot of generatedSlots) byKey.set(slot.element_key, slot);
    for (const slot of getRuntimeSlots()) {
      if (!byKey.has(slot.element_key)) byKey.set(slot.element_key, slot);
    }
    for (const [key, record] of Object.entries(records)) {
      if (!byKey.has(key)) {
        byKey.set(key, {
          element_key: key,
          module: record.module,
          component_id: record.component_id,
          kind: record.kind,
          default_text: record.default_text,
          source_file: record.source_file,
          source_line: record.source_line,
        });
      }
    }
    return Array.from(byKey.values())
      .map((slot) => {
        const record = records[slot.element_key];
        return {
          ...slot,
          record,
          isCustomised: isSlotCustomised(record),
          resolved: resolvedValueOf(slot, record),
        };
      })
      .sort((a, b) => a.element_key.localeCompare(b.element_key));
  }, [generatedSlots, records]);

  const modules = useMemo(() => {
    const set = new Set<string>();
    allSlots.forEach((s) => set.add(s.module));
    return Array.from(set).sort();
  }, [allSlots]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return allSlots.filter((slot) => {
      if (moduleFilter !== "all" && slot.module !== moduleFilter) return false;
      if (customisedOnly && !slot.isCustomised) return false;
      if (!needle) return true;
      const numericId = getComponentIdForElementKey(slot.element_key);
      const numericQuery = needle.replace(/^#/, "");
      return (
        (numericId &&
          (numericId === numericQuery ||
            String(Number(numericId)) === numericQuery ||
            `#${numericId}` === needle)) ||
        slot.element_key.toLowerCase().includes(needle) ||
        slot.default_text.toLowerCase().includes(needle) ||
        slot.resolved.toLowerCase().includes(needle) ||
        (slot.source_file || "").toLowerCase().includes(needle)
      );
    });
  }, [allSlots, search, moduleFilter, customisedOnly]);

  useEffect(() => setVisibleCount(PAGE_SIZE), [search, moduleFilter, customisedOnly]);

  // Deep-link focus: show, expand and scroll to the requested slot.
  useEffect(() => {
    if (!focusElementKey || !generatedSlots.length) return;
    setSearch(focusElementKey);
    setModuleFilter("all");
    setCustomisedOnly(false);
    setExpandedKey(focusElementKey);
    setVisibleCount(PAGE_SIZE * 4);
    const timer = setTimeout(() => {
      document
        .querySelector(`[data-element-key="${focusElementKey.replace(/"/g, '\\"')}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 90);
    return () => clearTimeout(timer);
  }, [focusElementKey, generatedSlots.length]);

  const customisedCount = useMemo(() => allSlots.filter((s) => s.isCustomised).length, [allSlots]);

  const commit = useCallback(
    async (slot: MergedSlot, patch: UIConfigPatch) => {
      setSavingKeys((prev) => ({ ...prev, [slot.element_key]: true }));
      setRowError((prev) => {
        const next = { ...prev };
        delete next[slot.element_key];
        return next;
      });
      const ok = await updateSlot(slot.element_key, patch, slot.default_text);
      setSavingKeys((prev) => {
        const next = { ...prev };
        delete next[slot.element_key];
        return next;
      });
      if (!ok) {
        setRowError((prev) => ({
          ...prev,
          [slot.element_key]: uiText(
            "ui_copy_registry_panel.error.save_failed",
            "Database write failed — the previous value was restored."
          ),
        }));
      } else {
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[slot.element_key];
          return next;
        });
      }
      return ok;
    },
    [updateSlot]
  );

  const commitField = useCallback(
    (slot: MergedSlot, field: EditableField, value: string) => {
      const patch: UIConfigPatch = field === "text" ? { text: value, label: value } : { [field]: value };
      void commit(slot, patch);
    },
    [commit]
  );

  const commitIcon = useCallback(
    (slot: MergedSlot, value: string) => {
      void commit(slot, { icon_name: value });
    },
    [commit]
  );

  const commitLayout = useCallback(
    (slot: MergedSlot, layout: UILayoutProperties) => {
      void commit(slot, { layout_properties: layout });
    },
    [commit]
  );

  const revert = useCallback(
    async (slot: MergedSlot) => {
      setSavingKeys((prev) => ({ ...prev, [slot.element_key]: true }));
      await resetSlot(slot.element_key);
      setSavingKeys((prev) => {
        const next = { ...prev };
        delete next[slot.element_key];
        return next;
      });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[slot.element_key];
        return next;
      });
    },
    [resetSlot]
  );

  const draftValue = (slot: MergedSlot, field: EditableField): string => {
    const draft = drafts[slot.element_key]?.[field];
    if (typeof draft === "string") return draft;
    const record = slot.record;
    if (record && typeof record[field] === "string") return record[field] as string;
    if (field === "text") return slot.default_text;
    return "";
  };

  const setDraft = (slot: MergedSlot, field: EditableField, value: string) =>
    setDrafts((prev) => ({
      ...prev,
      [slot.element_key]: { ...(prev[slot.element_key] || {}), [field]: value },
    }));

  const statusBadge = (() => {
    const state = syncStatus.state;
    if (state === "saving")
      return {
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
        text: uiText("ui_copy_registry_panel.status.saving", "Saving to database…"),
        className: "text-amber-300 border-amber-500/40 bg-amber-950/30",
      };
    if (state === "error")
      return {
        icon: <AlertTriangle className="w-3 h-3" />,
        text: syncStatus.lastError || uiText("ui_copy_registry_panel.status.error", "Database error"),
        className: "text-rose-300 border-rose-500/40 bg-rose-950/30",
      };
    if (state === "offline")
      return {
        icon: <CloudOff className="w-3 h-3" />,
        text: uiText("ui_copy_registry_panel.status.offline", "Offline — showing registry defaults"),
        className: "text-slate-300 border-slate-600/40 bg-slate-900/60",
      };
    if (state === "hydrating")
      return {
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
        text: uiText("ui_copy_registry_panel.status.loading", "Loading from database…"),
        className: "text-cyan-300 border-cyan-500/40 bg-cyan-950/30",
      };
    return {
      icon: <Check className="w-3 h-3" />,
      text: uiText("ui_copy_registry_panel.status.synced", "Synced with database"),
      className: "text-emerald-300 border-emerald-500/40 bg-emerald-950/30",
    };
  })();

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-2.5 space-y-2">
      {/* ---------------- toolbar ---------------- */}
      <div className="bg-[#07111e]/95 border border-[#0d2235] px-3 py-2 rounded-xl flex flex-col gap-2 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Type className="w-4 h-4 text-fuchsia-400 shrink-0" />
            <div className="min-w-0">
              <CustomizableLabel
                labelId="uicopy_registry_panel_item_11"
                as="h3"
                className="text-[12px] font-extrabold text-slate-100 tracking-tight truncate"
              >
                  {() => (
                      <>
                        {uiText("ui_copy_registry_panel.heading.title", "Copy & Layout Registry")}
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-[9.5px] text-slate-500 truncate">
                {uiText(
                  "ui_copy_registry_panel.heading.subtitle",
                  "Every header, label, helper line, placeholder and tooltip in the application — stored in the database."
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                "flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg border",
                statusBadge.className
              )}
              title={syncStatus.lastError || ""}
            >
              {statusBadge.icon}
              <span className="truncate max-w-[220px]">{statusBadge.text}</span>
            </span>
            <span
              className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-300"
              title={kvStatus.lastError || ""}
            >
              <Database className="w-3 h-3" />
              {uiText("ui_copy_registry_panel.status.kv", "Layout store")}: {kvStatus.state}
              {kvStatus.pending > 0 ? ` (${kvStatus.pending})` : ""}
            </span>
            <CustomizableButton
              buttonId="uicopy_registry_panel_btn_10"
              defaultIcon={<RotateCcw className="w-3 h-3" />}
              type="button"
onClick={() => void reloadFromDatabase()}
className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg border border-cyan-600/50 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/40 transition-colors cursor-pointer"
title={uiText(
                "ui_copy_registry_panel.button.reload.title",
                "Discard local view and re-read every record from the database"
              )}
            >
                {() => (
                    <>
                      {uiText("ui_copy_registry_panel.button.reload", "Reload from DB")}
                    </>
                  )}
            </CustomizableButton>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={uiText(
                "ui_copy_registry_panel.input.search.placeholder",
                "Search copy, Component ID, element key or source file…"
              )}
              className="w-full bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-100 rounded-lg pl-7 pr-2 py-1.5 text-[11px] outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="bg-[#020617] border border-[#1e293b] text-slate-200 rounded-lg px-2 py-1.5 text-[10px] outline-none focus:border-fuchsia-500 max-w-[180px]"
            >
              <option value="all">
                {uiText("ui_copy_registry_panel.option.all_modules", "All modules")} ({modules.length})
              </option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <CustomizableButton
            buttonId="uicopy_registry_panel_btn_9"
            type="button"
onClick={() => setCustomisedOnly((v) => !v)}
className={cn(
              "flex items-center gap-1 text-[9.5px] font-bold px-2 py-1.5 rounded-lg border transition-colors cursor-pointer",
              customisedOnly
                ? "border-fuchsia-500/70 bg-fuchsia-950/40 text-fuchsia-200"
                : "border-slate-700/60 bg-slate-900/50 text-slate-400 hover:text-slate-200"
            )}
          >
              {() => (
                  <>
                    {customisedOnly ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {uiText("ui_copy_registry_panel.button.customised_only", "Edited only")}
                  (
                  {customisedCount}
                  )
          
                  </>
                )}
          </CustomizableButton>

          <span className="text-[9.5px] font-mono text-slate-500">
            {filtered.length} / {allSlots.length}{" "}
            {uiText("ui_copy_registry_panel.label.slots", "slots")}
          </span>
        </div>
      </div>

      {/* ---------------- rows ---------------- */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
        {isLoadingRegistry && !allSlots.length ? (
          <div className="flex items-center justify-center gap-2 text-slate-500 text-[11px] py-10">
            <Loader2 className="w-4 h-4 animate-spin" />
            {uiText("ui_copy_registry_panel.message.loading", "Loading the copy registry…")}
          </div>
        ) : null}

        {filtered.slice(0, visibleCount).map((slot) => {
          const isExpanded = expandedKey === slot.element_key;
          const isSaving = Boolean(savingKeys[slot.element_key]);
          const error = rowError[slot.element_key];
          const layout = slot.record?.layout_properties || {};

          return (
            <div
              key={slot.element_key}
              data-component-id={getComponentIdForElementKey(slot.element_key)}
              data-component-row-id={getComponentIdForElementKey(slot.element_key)}
              data-element-key={slot.element_key}
              className={cn(
                "bg-[#07111e]/80 border rounded-xl px-2.5 py-2 transition-colors",
                slot.isCustomised ? "border-fuchsia-700/50" : "border-[#0d2235]",
                isExpanded && "border-fuchsia-500/70 bg-[#0a1526]"
              )}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black font-mono text-amber-300 tabular-nums">
                      #{getComponentIdForElementKey(slot.element_key) || "—"}
                    </span>
                    <code className="text-[9px] font-mono text-cyan-400/90 truncate max-w-full">
                      {slot.element_key}
                    </code>
                    <span className="text-[8px] font-bold uppercase px-1 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
                      {slot.kind}
                    </span>
                    {slot.isCustomised ? (
                      <span className="text-[8px] font-bold uppercase px-1 py-0.5 rounded bg-fuchsia-950/60 text-fuchsia-300 border border-fuchsia-700/50">
                        {uiText("ui_copy_registry_panel.badge.edited", "edited")}
                      </span>
                    ) : null}
                    {layout.visible === false ? (
                      <span className="text-[8px] font-bold uppercase px-1 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-700/50">
                        {uiText("ui_copy_registry_panel.badge.hidden", "hidden")}
                      </span>
                    ) : null}
                  </div>

                  <input
                    type="text"
                    value={draftValue(slot, "text")}
                    onChange={(e) => setDraft(slot, "text", e.target.value)}
                    onBlur={(e) => {
                      const next = e.target.value;
                      if (next !== resolvedValueOf(slot, slot.record)) commitField(slot, "text", next);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    className="mt-1 w-full bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-100 rounded-lg px-2 py-1 text-[11px] outline-none transition-all"
                  />

                  {slot.source_file ? (
                    <p className="mt-0.5 text-[8.5px] font-mono text-slate-600 truncate">
                      {slot.source_file}
                      {slot.source_line ? `:${slot.source_line}` : ""} ·{" "}
                      {uiText("ui_copy_registry_panel.label.default", "default")}: “{slot.default_text}”
                    </p>
                  ) : null}

                  {error ? (
                    <p className="mt-0.5 text-[9px] text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {error}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> : null}
                  <CustomizableButton
                    buttonId="uicopy_registry_panel_btn_8"
                    type="button"
onClick={() => setExpandedKey(isExpanded ? null : slot.element_key)}
className="text-[9px] font-bold px-2 py-1 rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
title={uiText(
                      "ui_copy_registry_panel.button.expand.title",
                      "Edit sub-label, placeholder, tooltip, helper copy and layout"
                    )}
                  >
                      {() => (
                          <>
                            {isExpanded
                      ? uiText("ui_copy_registry_panel.button.collapse", "Less")
                      : uiText("ui_copy_registry_panel.button.expand", "More")}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="uicopy_registry_panel_btn_7"
                    type="button"
disabled={!slot.isCustomised}
onClick={() => void revert(slot)}
className={cn(
                      "text-[9px] font-bold px-2 py-1 rounded-lg border transition-colors",
                      slot.isCustomised
                        ? "border-rose-700/50 bg-rose-950/40 text-rose-300 hover:bg-rose-900/40 cursor-pointer"
                        : "border-slate-800 bg-slate-900/40 text-slate-600 cursor-not-allowed"
                    )}
title={uiText(
                      "ui_copy_registry_panel.button.revert.title",
                      "Clear the database override and fall back to the registry default"
                    )}
                  >
                      {() => (
                          <>
                            {uiText("ui_copy_registry_panel.button.revert", "Revert")}
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>

              {isExpanded ? (
                <div className="mt-2 pt-2 border-t border-[#0d2235] grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FIELD_ORDER.filter((f) => f.field !== "text").map(({ field, labelKey, labelDefault }) => (
                    <CustomizableLabel
                      labelId="uicopy_registry_panel_item_6"
                      as="label"
                      key={field}
className="flex flex-col gap-0.5"
                    >
                        {() => (
                            <>
                              <span className="text-[8.5px] font-bold uppercase tracking-wide text-slate-500">
                        {uiText(labelKey, labelDefault)}
                      </span>
                            <input
                        type="text"
                        value={draftValue(slot, field)}
                        onChange={(e) => setDraft(slot, field, e.target.value)}
                        onBlur={(e) => commitField(slot, field, e.target.value)}
                        className="bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-200 rounded-lg px-2 py-1 text-[10.5px] outline-none"
                      />
                            </>
                          )}
                    </CustomizableLabel>
                  ))}

                  {/* active icon override */}
                  <div className="flex flex-col gap-0.5 sm:col-span-2">
                    <span className="text-[8.5px] font-bold uppercase tracking-wide text-slate-500">
                      {uiText("ui_copy_registry_panel.field.icon", "Active icon")}
                    </span>
                    <IconNameSelect
                      value={slot.record?.icon_name || ""}
                      onCommit={(value) => commitIcon(slot, value)}
                      compact
                    />
                  </div>

                  {/* layout properties */}
                  <CustomizableLabel
                    labelId="uicopy_registry_panel_item_5"
                    as="label"
                    className="flex flex-col gap-0.5"
                  >
                      {() => (
                          <>
                            <span className="text-[8.5px] font-bold uppercase tracking-wide text-slate-500">
                      {uiText("ui_copy_registry_panel.layout.order", "Order")}
                    </span>
                          <input
                      type="number"
                      defaultValue={layout.order ?? ""}
                      onBlur={(e) =>
                        commitLayout(slot, {
                          ...layout,
                          order: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                      className="bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-200 rounded-lg px-2 py-1 text-[10.5px] outline-none"
                    />
                          </>
                        )}
                  </CustomizableLabel>

                  <CustomizableLabel
                    labelId="uicopy_registry_panel_item_4"
                    as="label"
                    className="flex flex-col gap-0.5"
                  >
                      {() => (
                          <>
                            <span className="text-[8.5px] font-bold uppercase tracking-wide text-slate-500">
                      {uiText("ui_copy_registry_panel.layout.variant", "Variant")}
                    </span>
                          <input
                      type="text"
                      defaultValue={layout.variant ?? ""}
                      onBlur={(e) => commitLayout(slot, { ...layout, variant: e.target.value || undefined })}
                      className="bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-200 rounded-lg px-2 py-1 text-[10.5px] outline-none"
                    />
                          </>
                        )}
                  </CustomizableLabel>

                  <CustomizableLabel
                    labelId="uicopy_registry_panel_item_3"
                    as="label"
                    className="flex flex-col gap-0.5"
                  >
                      {() => (
                          <>
                            <span className="text-[8.5px] font-bold uppercase tracking-wide text-slate-500">
                      {uiText("ui_copy_registry_panel.layout.align", "Alignment")}
                    </span>
                          <select
                      defaultValue={layout.align ?? ""}
                      onChange={(e) =>
                        commitLayout(slot, {
                          ...layout,
                          align: (e.target.value || undefined) as UILayoutProperties["align"],
                        })
                      }
                      className="bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-200 rounded-lg px-2 py-1 text-[10.5px] outline-none"
                    >
                      <option value="">{uiText("ui_copy_registry_panel.option.inherit", "Inherit")}</option>
                      <option value="left">{uiText("ui_copy_registry_panel.option.left", "Left")}</option>
                      <option value="center">{uiText("ui_copy_registry_panel.option.center", "Center")}</option>
                      <option value="right">{uiText("ui_copy_registry_panel.option.right", "Right")}</option>
                      <option value="justify">{uiText("ui_copy_registry_panel.option.justify", "Justify")}</option>
                    </select>
                          </>
                        )}
                  </CustomizableLabel>

                  <CustomizableLabel
                    labelId="uicopy_registry_panel_item_2"
                    as="label"
                    className="flex items-center gap-2 mt-1"
                  >
                      {() => (
                          <>
                            <input
                      type="checkbox"
                      checked={layout.visible !== false}
                      onChange={(e) => commitLayout(slot, { ...layout, visible: e.target.checked })}
                      className="accent-fuchsia-500"
                    />
                          <span className="text-[9.5px] text-slate-300">
                      {uiText("ui_copy_registry_panel.layout.visible", "Visible in the interface")}
                    </span>
                          </>
                        )}
                  </CustomizableLabel>
                </div>
              ) : null}
            </div>
          );
        })}

        {filtered.length > visibleCount ? (
          <CustomizableButton
            buttonId="uicopy_registry_panel_btn_1"
            type="button"
onClick={() => setVisibleCount((c) => c + PAGE_SIZE * 2)}
className="w-full text-[10px] font-bold py-2 rounded-xl border border-[#0d2235] bg-[#07111e]/80 text-slate-400 hover:text-slate-100 hover:border-fuchsia-600/50 transition-colors cursor-pointer"
          >
              {() => (
                  <>
                    {uiText("ui_copy_registry_panel.button.load_more", "Show more slots")}
                  (
            
                  {filtered.length - visibleCount}
                  )
          
                  </>
                )}
          </CustomizableButton>
        ) : null}

        {!isLoadingRegistry && !filtered.length ? (
          <div className="text-center text-slate-500 text-[11px] py-10">
            {uiText("ui_copy_registry_panel.message.empty", "No slots match the current filters.")}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default UICopyRegistryPanel;
