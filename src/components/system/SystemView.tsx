/**
 * System View (`/system`)
 * =======================
 * The application's maintenance cockpit. It hosts the Component Maintenance
 * Cheat Sheet and the database sync telemetry for the Button & Layout Optimizer
 * Studio.
 *
 * Like every other surface, the page chrome is composed from atomic
 * configuration primitives — no literal headings, labels or button text.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  RefreshCw,
} from "lucide-react";
import { useUIConfigContext } from "../../context/UIConfigProvider";
import { uiIcon, uiText } from "../../hooks/useUIConfig";
import { renderIconByName } from "../ui/iconResolver";
import {
  ConfigButton,
  ConfigHeader,
  ConfigLabel,
  ConfigSection,
  ConfigSubLabel,
  ConfigText,
} from "../ui/ConfigPrimitives";
import { ComponentCheatSheet } from "./ComponentCheatSheet";
import { cn } from "../../utils/cn";
import type { ComponentIndexEntry } from "../../types/componentIndex";
import { isCustomised } from "../../types/uiConfigSchema";

function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function SystemView() {
  const { records, syncStatus, kvStatus, reloadFromDatabase } = useUIConfigContext();
  const [entries, setEntries] = useState<ComponentIndexEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    import("../../types/componentIndex.generated")
      .then((module) => {
        if (cancelled) return;
        setEntries(module.COMPONENT_INDEX);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const previous = document.title;
    document.title = uiText("system_view.page.main_heading", "Component Maintenance");
    return () => {
      document.title = previous;
    };
  }, []);

  const stats = useMemo(() => {
    const list = entries || [];
    return {
      total: list.length,
      buttons: list.filter((entry) => entry.source === "button").length,
      headers: list.filter((entry) =>
        ["header", "subheader", "section"].includes(entry.element_type)
      ).length,
      overrides: Object.values(records).filter((record) => isCustomised(record)).length,
      pending: (kvStatus.pending || 0) + (syncStatus.pending || 0),
    };
  }, [entries, records, kvStatus.pending, syncStatus.pending]);

  const isDegraded = syncStatus.state === "error" || syncStatus.state === "offline";
  const databaseError = syncStatus.lastError || kvStatus.lastError;

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await reloadFromDatabase();
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-200">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(34,211,238,0.10),transparent_45%),radial-gradient(circle_at_85%_0%,rgba(217,70,239,0.08),transparent_40%)]" />

      <div className="relative max-w-[1560px] mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4">
        {/* ---------------- Page header ---------------- */}
        <header className="rounded-2xl border border-[#0d2235] bg-[#050b14]/95 p-4 sm:p-5 shadow-2xl shadow-black/40">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <ConfigLabel
                elementKey="system_view.page.eyebrow_label"
                className="text-[9px] font-black uppercase tracking-[0.24em] text-cyan-400"
                iconName="Settings"
                iconClassName="w-3 h-3"
              />
              <ConfigHeader
                elementKey="system_view.page.main_heading"
                as="h1"
                className="mt-1 text-2xl sm:text-3xl font-black text-slate-50 tracking-tight"
                iconClassName="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300"
              />
              <ConfigSubLabel
                elementKey="system_view.page.subtitle_label"
                as="p"
                className="mt-1.5 max-w-4xl text-[11px] sm:text-[12px] leading-relaxed text-slate-400"
                iconClassName="hidden"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ConfigButton
                elementKey="system_view.nav.back_button"
                onClick={() => window.location.assign("/")}
                iconName="ArrowLeft"
                iconClassName="w-3.5 h-3.5"
                className="h-8 px-3 rounded-xl border border-[#1e293b] bg-[#07111e] text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 text-[10px] font-bold"
              />
              <ConfigButton
                elementKey="system_view.nav.reload_button"
                onClick={() => void handleReload()}
                iconName="RefreshCw"
                iconClassName={cn("w-3.5 h-3.5", isReloading && "animate-spin")}
                className="h-8 px-3 rounded-xl border border-emerald-500/50 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50 text-[10px] font-bold"
              />
            </div>
          </div>

          {/* ---------------- Statistics ---------------- */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
            <StatCard
              labelKey="system_view.stats.total_label"
              fallback="Registered components"
              value={String(stats.total)}
              iconName="Hash"
              accent="text-cyan-300 border-cyan-500/30"
            />
            <StatCard
              labelKey="system_view.stats.buttons_label"
              fallback="Buttons & labels"
              value={String(stats.buttons)}
              iconName="MousePointerClick"
              accent="text-fuchsia-300 border-fuchsia-500/30"
            />
            <StatCard
              labelKey="system_view.stats.headers_label"
              fallback="Headers & sections"
              value={String(stats.headers)}
              iconName="Type"
              accent="text-emerald-300 border-emerald-500/30"
            />
            <StatCard
              labelKey="system_view.stats.overrides_label"
              fallback="Database overrides"
              value={String(stats.overrides)}
              iconName="Database"
              accent="text-amber-300 border-amber-500/30"
            />
            <StatCard
              labelKey="system_view.stats.sync_label"
              fallback="Database sync"
              value={syncStatus.state}
              hint={formatTimestamp(syncStatus.lastSyncedAt)}
              iconName={isDegraded ? "Cloud" : "Activity"}
              accent={isDegraded ? "text-rose-300 border-rose-500/30" : "text-sky-300 border-sky-500/30"}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[9.5px] text-slate-500">
              <Boxes className="w-3 h-3 text-slate-500" />
              {uiText("system_view.stats.database_writes_label", "Pending database writes")}
              <span
                className={cn(
                  "font-mono font-bold tabular-nums",
                  stats.pending > 0 ? "text-amber-300" : "text-emerald-300"
                )}
              >
                {stats.pending}
              </span>
            </span>
            {databaseError ? (
              <span className="text-[9.5px] text-rose-400 truncate max-w-full" title={databaseError}>
                {databaseError}
              </span>
            ) : null}
          </div>
        </header>

        {/* ---------------- Cheat sheet ---------------- */}
        <ComponentCheatSheet entries={entries} isLoading={isLoading} loadError={loadError} />

        {/* ---------------- Help ---------------- */}
        <ConfigSection
          elementKey="system_view.help.section"
          className="rounded-2xl border border-[#0d2235] bg-[#050b14]/95 p-4 sm:p-5"
        >
          <ConfigHeader
            elementKey="system_view.help.main_heading"
            as="h2"
            className="text-sm font-black text-slate-100"
            iconClassName="w-4 h-4 text-cyan-300"
          />
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <HelpCard
              headingKey="system_view.help.ids_heading"
              bodyKey="system_view.help.ids_body"
            />
            <HelpCard
              headingKey="system_view.help.persistence_heading"
              bodyKey="system_view.help.persistence_body"
            />
            <HelpCard
              headingKey="system_view.help.atomic_heading"
              bodyKey="system_view.help.atomic_body"
            />
          </div>
        </ConfigSection>

        {/* ---------------- Footer ---------------- */}
        <footer className="flex flex-wrap items-center justify-between gap-2 px-1 pb-3">
          <ConfigText
            elementKey="system_view.footer.note"
            as="p"
            className="text-[9.5px] text-slate-600"
            iconClassName="w-3 h-3"
          />
          <span className="text-[9px] font-mono text-slate-700">
            {uiText("system_view.stats.total_label", "Registered components")} {stats.total}
          </span>
        </footer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Local presentational helpers (label + value only; all copy via uiText)
 * ------------------------------------------------------------------ */

function StatCard({
  labelKey,
  fallback,
  value,
  hint,
  iconName,
  accent,
}: {
  labelKey: string;
  fallback: string;
  value: string;
  hint?: string;
  iconName: string;
  accent: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-[#030a14]/80 px-2.5 py-2 min-w-0", accent)}>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="shrink-0 opacity-80">
          {renderIconByName(uiIcon(labelKey, iconName), "w-3.5 h-3.5")}
        </span>
        <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 truncate">
          {uiText(labelKey, fallback)}
        </span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="text-lg font-black text-slate-100 tabular-nums leading-none">{value}</span>
        {hint ? (
          <span className="text-[8px] font-mono text-slate-500 truncate" title={hint}>
            {hint}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function HelpCard({ headingKey, bodyKey }: { headingKey: string; bodyKey: string }) {
  return (
    <div className="rounded-xl border border-[#10263c] bg-[#030a14]/70 p-3">
      <ConfigHeader
        elementKey={headingKey}
        as="h3"
        className="text-[11px] font-black text-slate-200"
        iconClassName="w-3.5 h-3.5 text-cyan-300"
      />
      <ConfigText
        elementKey={bodyKey}
        as="p"
        className="mt-1.5 text-[10px] leading-relaxed text-slate-500"
        iconClassName="w-3 h-3"
      />
    </div>
  );
}

export default SystemView;
