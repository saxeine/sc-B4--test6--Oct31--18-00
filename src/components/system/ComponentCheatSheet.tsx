/**
 * Component Maintenance Cheat Sheet
 * =================================
 * The interactive table embedded in the System view (`/system`).
 *
 *  • Lists every Component ID from the committed index.
 *  • Shows element type, current copy, active icon, parent section, module path,
 *    visibility, order and edit provenance.
 *  • Edits copy, icons, visibility, order, variant, alignment and notes inline.
 *  • Commits copy/icon edits to `ui_config_registry` through UIConfigProvider
 *    (atomic document merge + audit entry + rollback on rejection) and button
 *    edits through the Optimizer Studio's database-backed button config.
 *  • Links every row straight into the matching Optimizer Studio tab.
 */

import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useUIConfigContext } from "../../context/UIConfigProvider";
import { useButtonCustomization } from "../../context/ButtonCustomizationContext";
import { uiIcon, uiMessage, uiText } from "../../hooks/useUIConfig";
import {
  ConfigButton,
  ConfigHeader,
  ConfigInput,
  ConfigLabel,
  ConfigOption,
  ConfigSubLabel,
} from "../ui/ConfigPrimitives";
import { IconNameSelect } from "../ui/IconNameSelect";
import { renderIconByName } from "../ui/iconResolver";
import { cn } from "../../utils/cn";
import type {
  ComponentElementType,
  ComponentIndexEntry,
} from "../../types/componentIndex";
import { editableFieldForKind, humanizeIdentifier } from "../../types/componentIndex";
import { isCustomised, type UIConfigPatch, type UIConfigRecord } from "../../types/uiConfigSchema";
import { studioHrefForComponent } from "../../services/studioDeepLink";
import { ATOMIC_COMPONENT_SEED_MAP } from "../../types/atomicComponentManifest";
import { getComponentIdForElementKey } from "../../types/componentLookup";
import { componentDataAttributes } from "../../types/componentIndex";
import { CustomizableButton } from "../CustomizableButton";
import { CustomizableLabel } from "../CustomizableLabel";

const PAGE_SIZE = 80;

type RowStatus = "saving" | "saved" | "error";

interface CheatSheetRowModel {
  entry: ComponentIndexEntry;
  record?: UIConfigRecord;
  label: string;
  iconName: string;
  visible: boolean;
  order?: number;
  isCustomised: boolean;
  tooltip: string;
  updatedAt?: string;
}

interface ComponentCheatSheetProps {
  entries: ComponentIndexEntry[] | null;
  isLoading: boolean;
  loadError?: string | null;
}

function resolvedCopy(entry: ComponentIndexEntry, record?: UIConfigRecord): string {
  if (!record) return entry.default_label;
  switch (entry.element_kind) {
    case "placeholder":
      return record.placeholder ?? entry.default_label;
    case "tooltip":
      return record.tooltip ?? entry.default_label;
    case "sub_label":
      return record.sub_label ?? entry.default_label;
    case "helper":
      return record.helper_text ?? entry.default_label;
    case "label":
      return record.label ?? record.text ?? entry.default_label;
    case "option":
    case "message":
      return record.text ?? record.label ?? entry.default_label;
    default:
      return record.text ?? record.label ?? entry.default_label;
  }
}

function typeBadgeClass(type: ComponentElementType): string {
  switch (type) {
    case "button":
      return "border-fuchsia-500/40 bg-fuchsia-950/30 text-fuchsia-300";
    case "header":
    case "subheader":
      return "border-cyan-500/40 bg-cyan-950/30 text-cyan-300";
    case "label":
      return "border-emerald-500/40 bg-emerald-950/30 text-emerald-300";
    case "sublabel":
      return "border-teal-500/40 bg-teal-950/30 text-teal-300";
    case "icon":
      return "border-amber-500/40 bg-amber-950/30 text-amber-300";
    case "input":
      return "border-indigo-500/40 bg-indigo-950/30 text-indigo-300";
    case "option":
      return "border-violet-500/40 bg-violet-950/30 text-violet-300";
    case "message":
      return "border-orange-500/40 bg-orange-950/30 text-orange-300";
    case "section":
    case "panel":
    case "modal":
    case "tab":
    case "page":
      return "border-sky-500/40 bg-sky-950/30 text-sky-300";
    default:
      return "border-slate-600/50 bg-slate-900/60 text-slate-300";
  }
}

/** Icon name resolved from the database, falling back to the manifest seed. */
function iconFor(key: string): string {
  return uiIcon(key, ATOMIC_COMPONENT_SEED_MAP[key]?.default_icon || "");
}

/* ------------------------------------------------------------------ *
 * Row
 * ------------------------------------------------------------------ */

interface CheatSheetRowProps {
  row: CheatSheetRowModel;
  expanded: boolean;
  highlighted: boolean;
  status?: RowStatus;
  onToggleExpand: () => void;
  onCommitLabel: (value: string) => void;
  onCommitIcon: (value: string) => void;
  onToggleVisible: () => void;
  onCommitOrder: (value: number | undefined) => void;
  onCommitDetail: (patch: UIConfigPatch) => void;
  onReset: () => void;
}

const CheatSheetRow = React.memo(function CheatSheetRow({
  row,
  expanded,
  highlighted,
  status,
  onToggleExpand,
  onCommitLabel,
  onCommitIcon,
  onToggleVisible,
  onCommitOrder,
  onCommitDetail,
  onReset,
}: CheatSheetRowProps) {
  const { entry, record } = row;
  const isButton = entry.source === "button";

  return (
    <div
      data-component-id={entry.component_id}
      data-component-row-id={entry.component_id}
      className={cn(
        "border-b border-[#0b1a2b] transition-colors",
        highlighted ? "bg-cyan-950/25 ring-1 ring-inset ring-cyan-500/40" : "hover:bg-[#06101d]/80"
      )}
    >
      <div className="grid grid-cols-[78px_84px_minmax(180px,1.2fr)_minmax(180px,220px)_minmax(150px,1fr)_minmax(150px,1fr)_58px_64px_190px] gap-2 items-center px-2.5 py-1.5 text-[10.5px] min-w-[1210px]">
        {/* ID */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="font-mono font-black text-cyan-300 tabular-nums"
            title={row.updatedAt ? `${row.updatedAt}` : undefined}
          >
            #{entry.component_id}
          </span>
          {status === "saving" ? (
            <span title={uiText("system_view.cheatsheet.saving_label", "Saving…")}>
              <Loader2 className="w-3 h-3 text-amber-300 animate-spin" />
            </span>
          ) : status === "error" ? (
            <span title={uiText("system_view.cheatsheet.save_failed_label", "Save failed")}>
              <AlertTriangle className="w-3 h-3 text-rose-400" />
            </span>
          ) : status === "saved" ? (
            <span title={uiText("system_view.cheatsheet.saved_label", "Saved")}>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            </span>
          ) : null}
        </div>

        {/* Type + source */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            className={cn(
              "px-1.5 py-0.5 rounded border text-[8.5px] font-bold uppercase tracking-wide truncate",
              typeBadgeClass(entry.element_type)
            )}
          >
            {humanizeIdentifier(entry.element_type)}
          </span>
          <span className="text-[8px] font-mono text-slate-500 truncate" title={entry.component_key}>
            {entry.source}
          </span>
        </div>

        {/* Label / copy */}
        <input
          key={`${entry.component_id}:${row.label}`}
          type="text"
          defaultValue={row.label}
          onBlur={(event) => {
            const next = event.currentTarget.value;
            if (next !== row.label) onCommitLabel(next);
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            } else if (event.key === "Escape") {
              event.currentTarget.value = row.label;
              event.currentTarget.blur();
            }
          }}
          placeholder={
            row.entry.default_label ||
            (isButton && row.entry.button_id
              ? humanizeIdentifier(row.entry.button_id)
              : "—")
          }
          className="bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-100 rounded-md px-2 py-1 text-[10.5px] outline-none min-w-0 w-full"
        />

        {/* Icon */}
        <IconNameSelect
          value={row.iconName}
          onCommit={onCommitIcon}
          compact
          className="min-w-0"
        />

        {/* Parent section */}
        <span className="text-slate-400 truncate" title={entry.parent_section}>
          {entry.parent_section}
        </span>

        {/* Module path */}
        <span className="font-mono text-[9px] text-slate-500 truncate" title={entry.module_path}>
          {entry.module_path}
        </span>

        {/* Visibility */}
        <CustomizableButton
          buttonId="system_component_cheat_sheet_btn_12"
          type="button"
role="switch"
aria-checked={row.visible}
onClick={onToggleVisible}
title={uiText("system_view.cheatsheet.table.visible_label", "Visible")}
className={cn(
            "h-6 w-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer justify-self-start",
            row.visible
              ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-300"
              : "bg-slate-900 border-slate-700 text-slate-500"
          )}
        >
            {() => (
                <>
                  {renderIconByName(
            iconFor("system_view.cheatsheet.table.visible_label"),
            "w-3.5 h-3.5"
          )}
                </>
              )}
        </CustomizableButton>

        {/* Order */}
        <input
          type="number"
          defaultValue={row.order ?? ""}
          disabled={isButton}
          onBlur={(event) => {
            const raw = event.currentTarget.value.trim();
            const next = raw === "" ? undefined : Number(raw);
            if (next === row.order) return;
            onCommitOrder(Number.isFinite(next as number) ? (next as number) : undefined);
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          placeholder="—"
          title={uiText("system_view.cheatsheet.table.order_label", "Order")}
          className="bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-200 rounded-md px-1.5 py-1 text-[10px] outline-none w-full disabled:opacity-40"
        />

        {/* Actions */}
        <div className="flex items-center gap-1 justify-end">
          <a
            href={studioHrefForComponent(entry)}
            className="h-6 px-1.5 rounded-md border border-fuchsia-500/50 text-fuchsia-300 hover:bg-fuchsia-950/40 inline-flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-wide cursor-pointer"
            title={uiText("system_view.cheatsheet.open_studio_button", "Optimizer Studio")}
          >
            <ExternalLink className="w-2.5 h-2.5" />
            {uiText("system_view.cheatsheet.open_studio_short_button", "Studio")}
          </a>
          <CustomizableButton
            buttonId="system_component_cheat_sheet_btn_11"
            type="button"
onClick={onToggleExpand}
className="h-6 w-6 rounded-md border border-[#1e293b] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 inline-flex items-center justify-center cursor-pointer"
title={uiText("system_view.cheatsheet.expand_row_button", "Advanced overrides")}
          >
              {() => (
                  <>
                    {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </>
                )}
          </CustomizableButton>
          <CustomizableButton
            buttonId="system_component_cheat_sheet_btn_10"
            defaultIcon={<RotateCcw className="w-3 h-3" />}
            type="button"
onClick={onReset}
className="h-6 w-6 rounded-md border border-[#1e293b] text-slate-400 hover:text-rose-300 hover:border-rose-500/50 inline-flex items-center justify-center cursor-pointer"
title={uiText("system_view.cheatsheet.reset_row_button", "Reset")}
          />
        </div>
      </div>

      {expanded ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 px-3 pb-2.5 pt-1 border-t border-[#0b1a2b] bg-[#030a14] min-w-[1210px]">
          {!isButton ? (
            <>
              <CustomizableLabel
                labelId="system_component_cheat_sheet_item_9"
                as="label"
                className="flex flex-col gap-0.5 min-w-0"
              >
                  {() => (
                      <>
                        <ConfigLabel
                  elementKey="system_view.cheatsheet.editor.sub_label_label"
                  className="text-[8.5px] font-bold uppercase tracking-wide text-slate-500"
                />
                      <input
                  key={`sub:${entry.component_id}:${record?.sub_label ?? ""}`}
                  type="text"
                  defaultValue={record?.sub_label ?? ""}
                  onBlur={(event) =>
                    onCommitDetail({ sub_label: event.currentTarget.value.trim() || undefined })
                  }
                  className="bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-200 rounded-md px-2 py-1 text-[10px] outline-none"
                />
                      </>
                    )}
              </CustomizableLabel>

              <CustomizableLabel
                labelId="system_component_cheat_sheet_item_8"
                as="label"
                className="flex flex-col gap-0.5 min-w-0"
              >
                  {() => (
                      <>
                        <ConfigLabel
                  elementKey="system_view.cheatsheet.editor.variant_label"
                  className="text-[8.5px] font-bold uppercase tracking-wide text-slate-500"
                />
                      <input
                  key={`variant:${entry.component_id}:${record?.layout_properties?.variant ?? ""}`}
                  type="text"
                  defaultValue={record?.layout_properties?.variant ?? ""}
                  onBlur={(event) =>
                    onCommitDetail({
                      layout_properties: { variant: event.currentTarget.value.trim() || undefined },
                    })
                  }
                  className="bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-200 rounded-md px-2 py-1 text-[10px] outline-none"
                />
                      </>
                    )}
              </CustomizableLabel>

              <CustomizableLabel
                labelId="system_component_cheat_sheet_item_7"
                as="label"
                className="flex flex-col gap-0.5 min-w-0"
              >
                  {() => (
                      <>
                        <ConfigLabel
                  elementKey="system_view.cheatsheet.editor.align_label"
                  className="text-[8.5px] font-bold uppercase tracking-wide text-slate-500"
                />
                      <select
                  key={`align:${entry.component_id}:${record?.layout_properties?.align ?? ""}`}
                  defaultValue={record?.layout_properties?.align ?? ""}
                  onChange={(event) =>
                    onCommitDetail({
                      layout_properties: {
                        align: (event.target.value || undefined) as
                          | "left"
                          | "center"
                          | "right"
                          | "justify"
                          | undefined,
                      },
                    })
                  }
                  className="bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-200 rounded-md px-2 py-1 text-[10px] outline-none"
                >
                  <option value="">—</option>
                  <option value="left">{uiText("ui_copy_registry_panel.option.left", "Left")}</option>
                  <option value="center">{uiText("ui_copy_registry_panel.option.center", "Center")}</option>
                  <option value="right">{uiText("ui_copy_registry_panel.option.right", "Right")}</option>
                  <option value="justify">{uiText("ui_copy_registry_panel.option.justify", "Justify")}</option>
                </select>
                      </>
                    )}
              </CustomizableLabel>
            </>
          ) : null}

          <CustomizableLabel
            labelId="system_component_cheat_sheet_item_6"
            as="label"
            className="flex flex-col gap-0.5 min-w-0"
          >
              {() => (
                  <>
                    <ConfigLabel
              elementKey="system_view.cheatsheet.editor.tooltip_label"
              className="text-[8.5px] font-bold uppercase tracking-wide text-slate-500"
            />
                  <input
              key={`tip:${entry.component_id}:${row.tooltip}`}
              type="text"
              defaultValue={row.tooltip}
              onBlur={(event) =>
                onCommitDetail({ tooltip: event.currentTarget.value.trim() || undefined })
              }
              className="bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-200 rounded-md px-2 py-1 text-[10px] outline-none"
            />
                  </>
                )}
          </CustomizableLabel>

          {!isButton ? (
            <CustomizableLabel
              labelId="system_component_cheat_sheet_item_5"
              as="label"
              className="flex flex-col gap-0.5 min-w-0 lg:col-span-2"
            >
                {() => (
                    <>
                      <ConfigLabel
                elementKey="system_view.cheatsheet.editor.notes_label"
                className="text-[8.5px] font-bold uppercase tracking-wide text-slate-500"
              />
                    <input
                key={`notes:${entry.component_id}:${record?.notes ?? ""}`}
                type="text"
                defaultValue={record?.notes ?? ""}
                onBlur={(event) =>
                  onCommitDetail({ notes: event.currentTarget.value.trim() || undefined })
                }
                className="bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-200 rounded-md px-2 py-1 text-[10px] outline-none"
              />
                    </>
                  )}
            </CustomizableLabel>
          ) : null}

          <div className="flex flex-col gap-0.5 min-w-0">
            <ConfigLabel
              elementKey="system_view.cheatsheet.table.module_label"
              className="text-[8.5px] font-bold uppercase tracking-wide text-slate-500"
            />
            <span className="font-mono text-[9px] text-slate-400 truncate" title={entry.module_path}>
              {entry.module_path}
            </span>
            <span className="font-mono text-[8.5px] text-slate-600 truncate">
              {entry.element_key || entry.button_id}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
});

/* ------------------------------------------------------------------ *
 * Table
 * ------------------------------------------------------------------ */

export function ComponentCheatSheet({ entries, isLoading, loadError }: ComponentCheatSheetProps) {
  const { records, syncStatus, updateSlot, resetSlot } = useUIConfigContext();
  const { getConfig, updateButtonConfig, resetButtonConfig } = useButtonCustomization();

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"id" | "label" | "type" | "parent" | "updated">("id");
  const [editedOnly, setEditedOnly] = useState(false);
  const [jumpValue, setJumpValue] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [jumpError, setJumpError] = useState<string | null>(null);
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({});
  const statusTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const rows = useMemo<CheatSheetRowModel[]>(() => {
    if (!entries) return [];
    return entries.map((entry) => {
      if (entry.source === "button" && entry.button_id) {
        const config = getConfig(entry.button_id);
        return {
          entry,
          label:
            config && typeof config.label === "string" ? config.label : entry.default_label,
          iconName: config?.iconName || entry.default_icon || "",
          visible: config?.hidden !== true,
          isCustomised: Boolean(config && Object.keys(config).length > 0),
          tooltip: config?.customTooltip || "",
        };
      }
      const record = entry.element_key ? records[entry.element_key] : undefined;
      return {
        entry,
        record,
        label: resolvedCopy(entry, record),
        iconName: record?.icon_name || entry.default_icon || "",
        visible: record?.layout_properties?.visible !== false,
        order: record?.layout_properties?.order,
        isCustomised: isCustomised(record),
        tooltip: record?.tooltip || "",
        updatedAt: record?.last_updated_at,
      };
    });
  }, [entries, records, getConfig]);

  const typeOptions = useMemo(() => {
    const set = new Set<ComponentElementType>();
    for (const row of rows) set.add(row.entry.element_type);
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const numericQuery = query.replace(/^#/, "");
    return rows.filter((row) => {
      if (typeFilter !== "all" && row.entry.element_type !== typeFilter) return false;
      if (sourceFilter !== "all" && row.entry.source !== sourceFilter) return false;
      if (editedOnly && !row.isCustomised) return false;
      if (!query) return true;

      const id = row.entry.component_id;
      const idMatches =
        id === numericQuery ||
        String(Number(id)) === numericQuery ||
        `#${id}` === query;
      if (idMatches) return true;

      return [
        row.label,
        row.entry.default_label,
        row.iconName,
        row.entry.parent_section,
        row.entry.module_path,
        row.entry.element_key,
        row.entry.button_id,
        row.entry.component_key,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [rows, deferredSearch, typeFilter, sourceFilter, editedOnly]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      switch (sortBy) {
        case "label":
          return (
            a.label.localeCompare(b.label, undefined, { sensitivity: "base" }) ||
            a.entry.component_id.localeCompare(b.entry.component_id)
          );
        case "type":
          return (
            a.entry.element_type.localeCompare(b.entry.element_type) ||
            a.entry.component_id.localeCompare(b.entry.component_id)
          );
        case "parent":
          return (
            a.entry.parent_section.localeCompare(b.entry.parent_section) ||
            a.entry.component_id.localeCompare(b.entry.component_id)
          );
        case "updated":
          return (
            (b.updatedAt || "").localeCompare(a.updatedAt || "") ||
            a.entry.component_id.localeCompare(b.entry.component_id)
          );
        case "id":
        default:
          return a.entry.component_id.localeCompare(b.entry.component_id);
      }
    });
    return list;
  }, [filtered, sortBy]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [deferredSearch, typeFilter, sourceFilter, sortBy, editedOnly]);

  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => {
      document
        .querySelector(`[data-component-row-id="${highlightId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    return () => clearTimeout(timer);
  }, [highlightId, filtered.length]);

  useEffect(
    () => () => {
      Object.values(statusTimers.current).forEach(clearTimeout);
    },
    []
  );

  const flashStatus = (componentId: string, status: RowStatus) => {
    setRowStatus((prev) => ({ ...prev, [componentId]: status }));
    if (statusTimers.current[componentId]) clearTimeout(statusTimers.current[componentId]);
    statusTimers.current[componentId] = setTimeout(() => {
      setRowStatus((prev) => {
        const next = { ...prev };
        delete next[componentId];
        return next;
      });
    }, status === "error" ? 6000 : 2200);
  };

  const commitCopy = async (
    row: CheatSheetRowModel,
    patch: UIConfigPatch
  ): Promise<boolean> => {
    const entry = row.entry;
    if (!entry.element_key) return false;
    flashStatus(entry.component_id, "saving");
    const ok = await updateSlot(entry.element_key, patch, entry.default_label);
    flashStatus(entry.component_id, ok ? "saved" : "error");
    return ok;
  };

  const commitButton = (row: CheatSheetRowModel, partial: Record<string, unknown>) => {
    if (!row.entry.button_id) return;
    flashStatus(row.entry.component_id, "saving");
    updateButtonConfig(row.entry.button_id, partial as any);
    flashStatus(row.entry.component_id, "saved");
  };

  const handleCommitLabel = async (row: CheatSheetRowModel, value: string) => {
    if (row.entry.source === "button") {
      commitButton(row, { label: value, hideText: value.trim().length === 0 });
      return;
    }
    const field = editableFieldForKind(row.entry.element_kind);
    const patch: UIConfigPatch =
      field === "text" ? { text: value, label: value } : ({ [field]: value } as UIConfigPatch);
    await commitCopy(row, patch);
  };

  const handleCommitIcon = async (row: CheatSheetRowModel, value: string) => {
    if (row.entry.source === "button") {
      commitButton(row, { iconName: value || undefined });
      return;
    }
    await commitCopy(row, { icon_name: value });
  };

  const handleToggleVisible = async (row: CheatSheetRowModel) => {
    const next = !row.visible;
    if (row.entry.source === "button") {
      commitButton(row, { hidden: !next });
      return;
    }
    await commitCopy(row, {
      layout_properties: {
        ...(row.record?.layout_properties || {}),
        visible: next,
      },
    });
  };

  const handleCommitOrder = async (row: CheatSheetRowModel, value: number | undefined) => {
    if (row.entry.source === "button") return;
    await commitCopy(row, {
      layout_properties: {
        ...(row.record?.layout_properties || {}),
        order: value,
      },
    });
  };

  const handleCommitDetail = async (row: CheatSheetRowModel, patch: UIConfigPatch) => {
    if (row.entry.source === "button") {
      if (typeof patch.tooltip === "string") {
        commitButton(row, { customTooltip: patch.tooltip || undefined });
      }
      return;
    }
    await commitCopy(row, patch);
  };

  const handleReset = async (row: CheatSheetRowModel) => {
    if (row.entry.source === "button" && row.entry.button_id) {
      flashStatus(row.entry.component_id, "saving");
      resetButtonConfig(row.entry.button_id);
      flashStatus(row.entry.component_id, "saved");
      return;
    }
    if (!row.entry.element_key) return;
    flashStatus(row.entry.component_id, "saving");
    const ok = await resetSlot(row.entry.element_key);
    flashStatus(row.entry.component_id, ok ? "saved" : "error");
  };

  const handleJump = () => {
    const digits = jumpValue.replace(/\D/g, "");
    if (!digits) return;
    const padded = digits.padStart(4, "0");
    const found = rows.find((row) => row.entry.component_id === padded);
    if (!found) {
      setJumpError(uiText("system_view.cheatsheet.jump_not_found_message", "No component is registered with that ID."));
      setHighlightId(null);
      return;
    }
    setJumpError(null);
    setSearch(padded);
    setTypeFilter("all");
    setSourceFilter("all");
    setSortBy("id");
    setEditedOnly(false);
    setVisibleCount(PAGE_SIZE);
    setExpandedId(padded);
    setHighlightId(padded);
  };

  const handleClearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setSourceFilter("all");
    setSortBy("id");
    setEditedOnly(false);
    setJumpValue("");
    setJumpError(null);
    setHighlightId(null);
  };

  const shownRows = sorted.slice(0, visibleCount);

  return (
    <section className="rounded-2xl border border-[#0d2235] bg-[#050b14]/95 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3.5 pb-3 border-b border-[#0d2235] bg-[#07111e]/80">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <ConfigHeader
              elementKey="system_view.cheatsheet.main_heading"
              as="h2"
              className="text-base font-black text-slate-100"
              iconClassName="w-4 h-4 text-cyan-300"
            />
            <ConfigSubLabel
              elementKey="system_view.cheatsheet.subtitle_label"
              as="p"
              className="text-[10.5px] text-slate-500 mt-1 max-w-3xl leading-relaxed"
              iconClassName="hidden"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9.5px] font-mono text-slate-500">
              {uiMessage(
                "system_view.cheatsheet.rows_shown_message",
                "Showing {shown} of {total} matching components",
                { shown: shownRows.length, total: sorted.length }
              )}
            </span>
            <span
              className={cn(
                "px-2 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wide",
                syncStatus.state === "error" || syncStatus.state === "offline"
                  ? "border-rose-500/50 bg-rose-950/30 text-rose-300"
                  : syncStatus.state === "saving"
                  ? "border-amber-500/50 bg-amber-950/30 text-amber-300"
                  : "border-emerald-500/50 bg-emerald-950/30 text-emerald-300"
              )}
              title={syncStatus.lastError || syncStatus.lastSyncedAt || ""}
            >
              {syncStatus.state}
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="relative min-w-[220px] flex-1">
            <ConfigInput
              elementKey="system_view.cheatsheet.search_placeholder"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-[#020617] border border-[#1e293b] focus:border-cyan-500 text-slate-100 rounded-lg pl-2.5 pr-2 py-1.5 text-[11px] outline-none"
            />
          </div>

          <CustomizableLabel
            labelId="system_component_cheat_sheet_item_4"
            as="label"
            className="flex flex-col gap-0.5"
          >
              {() => (
                  <>
                    <ConfigLabel
              elementKey="system_view.cheatsheet.type_filter_label"
              className="text-[8px] font-bold uppercase tracking-wide text-slate-500"
              iconClassName="w-2.5 h-2.5"
            />
                  <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-200 rounded-lg px-2 py-1.5 text-[10px] outline-none"
            >
              <ConfigOption
                elementKey="system_view.cheatsheet.all_types_option"
                value="all"
              />
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {humanizeIdentifier(type)}
                </option>
              ))}
            </select>
                  </>
                )}
          </CustomizableLabel>

          <CustomizableLabel
            labelId="system_component_cheat_sheet_item_3"
            as="label"
            className="flex flex-col gap-0.5"
          >
              {() => (
                  <>
                    <ConfigLabel
              elementKey="system_view.cheatsheet.source_filter_label"
              className="text-[8px] font-bold uppercase tracking-wide text-slate-500"
              iconClassName="w-2.5 h-2.5"
            />
                  <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-200 rounded-lg px-2 py-1.5 text-[10px] outline-none"
            >
              <ConfigOption
                elementKey="system_view.cheatsheet.all_sources_option"
                value="all"
              />
              {(["button", "copy", "atomic"] as const).map((source) => (
                <option key={source} value={source}>
                  {humanizeIdentifier(source)}
                </option>
              ))}
            </select>
                  </>
                )}
          </CustomizableLabel>

          <CustomizableLabel
            labelId="system_component_cheat_sheet_item_2"
            as="label"
            className="flex flex-col gap-0.5"
          >
              {() => (
                  <>
                    <ConfigLabel
              elementKey="system_view.cheatsheet.sort_label"
              className="text-[8px] font-bold uppercase tracking-wide text-slate-500"
              iconClassName="w-2.5 h-2.5"
            />
                  <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
              className="bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-200 rounded-lg px-2 py-1.5 text-[10px] outline-none"
            >
              <ConfigOption elementKey="system_view.cheatsheet.sort_id_option" value="id" />
              <ConfigOption elementKey="system_view.cheatsheet.sort_label_option" value="label" />
              <ConfigOption elementKey="system_view.cheatsheet.sort_type_option" value="type" />
              <ConfigOption elementKey="system_view.cheatsheet.sort_parent_option" value="parent" />
              <ConfigOption elementKey="system_view.cheatsheet.sort_updated_option" value="updated" />
            </select>
                  </>
                )}
          </CustomizableLabel>

          <CustomizableLabel
            labelId="system_component_cheat_sheet_item_1"
            as="label"
            className="flex items-center gap-1.5 pb-1"
          >
              {() => (
                  <>
                    <input
              type="checkbox"
              checked={editedOnly}
              onChange={(event) => setEditedOnly(event.target.checked)}
              className="accent-cyan-500"
            />
                  <ConfigLabel
              elementKey="system_view.cheatsheet.edited_only_label"
              className="text-[9.5px] text-slate-400"
              iconClassName="w-3 h-3"
            />
                  </>
                )}
          </CustomizableLabel>

          <div className="flex flex-col gap-0.5">
            <ConfigLabel
              elementKey="system_view.cheatsheet.jump_label"
              className="text-[8px] font-bold uppercase tracking-wide text-slate-500"
              iconClassName="w-2.5 h-2.5"
            />
            <div className="flex items-center gap-1">
              <ConfigInput
                elementKey="system_view.cheatsheet.jump_placeholder"
                value={jumpValue}
                onChange={(event) => setJumpValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleJump();
                  }
                }}
                className="bg-[#020617] border border-[#1e293b] focus:border-amber-500 text-slate-100 rounded-lg px-2 py-1.5 text-[10px] outline-none w-24 font-mono"
              />
              <ConfigButton
                elementKey="system_view.cheatsheet.jump_button"
                onClick={handleJump}
                iconName="ArrowRight"
                iconClassName="w-3 h-3"
                className="h-7 px-2 rounded-lg border border-amber-500/50 bg-amber-950/30 text-amber-300 hover:bg-amber-950/50 text-[9px] font-bold uppercase tracking-wide"
              />
            </div>
          </div>

          <ConfigButton
            elementKey="system_view.cheatsheet.clear_filters_button"
            onClick={handleClearFilters}
            iconName="RotateCcw"
            className="h-7 px-2.5 rounded-lg border border-slate-700 bg-slate-900/60 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 text-[9.5px] font-bold"
          />
        </div>

        {jumpError ? (
          <p className="mt-1.5 text-[10px] text-rose-400">{jumpError}</p>
        ) : null}
      </div>

      {/* Column headers */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-[78px_84px_minmax(180px,1.2fr)_minmax(180px,220px)_minmax(150px,1fr)_minmax(150px,1fr)_58px_64px_190px] gap-2 px-2.5 py-1.5 bg-[#040913] border-b border-[#0d2235] min-w-[1210px]">
          {[
            ["system_view.cheatsheet.table.id_label", "ID"],
            ["system_view.cheatsheet.table.type_label", "Element type"],
            ["system_view.cheatsheet.table.label_label", "Label / copy"],
            ["system_view.cheatsheet.table.icon_label", "Active icon"],
            ["system_view.cheatsheet.table.parent_label", "Parent section"],
            ["system_view.cheatsheet.table.module_label", "Module path"],
            ["system_view.cheatsheet.table.visible_label", "Visible"],
            ["system_view.cheatsheet.table.order_label", "Order"],
            ["system_view.cheatsheet.table.actions_label", "Actions"],
          ].map(([key, fallback]) => (
            <span
              key={key}
              {...componentDataAttributes(getComponentIdForElementKey(key), `element:${key}`)}
              className="text-[8px] font-black uppercase tracking-wider text-slate-500"
            >
              {uiText(key, fallback)}
            </span>
          ))}
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-500 text-[11px]">
            <Loader2 className="w-4 h-4 animate-spin" />
            {uiText("system_view.cheatsheet.loading_message", "Loading the component index…")}
          </div>
        ) : loadError ? (
          <div className="py-12 text-center text-rose-400 text-[11px]">{loadError}</div>
        ) : shownRows.length ? (
          shownRows.map((row) => (
            <CheatSheetRow
              key={row.entry.component_id}
              row={row}
              expanded={expandedId === row.entry.component_id}
              highlighted={highlightId === row.entry.component_id}
              status={rowStatus[row.entry.component_id]}
              onToggleExpand={() =>
                setExpandedId((current) =>
                  current === row.entry.component_id ? null : row.entry.component_id
                )
              }
              onCommitLabel={(value) => void handleCommitLabel(row, value)}
              onCommitIcon={(value) => void handleCommitIcon(row, value)}
              onToggleVisible={() => void handleToggleVisible(row)}
              onCommitOrder={(value) => void handleCommitOrder(row, value)}
              onCommitDetail={(patch) => void handleCommitDetail(row, patch)}
              onReset={() => void handleReset(row)}
            />
          ))
        ) : (
          <div className="py-12 text-center text-slate-500 text-[11px]">
            {uiText("system_view.cheatsheet.empty_message", "No components match the current filters.")}
          </div>
        )}
      </div>

      {/* Footer / load more */}
      {sorted.length > visibleCount ? (
        <div className="p-2.5 border-t border-[#0d2235] bg-[#040913]">
          <ConfigButton
            elementKey="system_view.cheatsheet.load_more_button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE * 2)}
            iconName="ChevronDown"
            className="w-full justify-center h-8 rounded-xl border border-[#0d2235] bg-[#07111e]/80 text-slate-400 hover:text-slate-100 hover:border-cyan-600/50 text-[10px] font-bold"
          />
        </div>
      ) : null}
    </section>
  );
}

export default ComponentCheatSheet;
