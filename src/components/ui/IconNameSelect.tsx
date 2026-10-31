/**
 * IconNameSelect
 * ==============
 * Inline icon editor shared by the System cheat sheet and the Optimizer
 * Studio's COPY tab. Quick-switch presets (Folder, Settings, Check …) plus a
 * free-text field for any registered Lucide icon name. The chosen name is
 * written to the database through the caller's commit handler.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "../../utils/cn";
import { uiText } from "../../hooks/useUIConfig";
import { ICON_QUICK_SWITCH, getIconComponent, isKnownIcon } from "./iconResolver";
import { CustomizableButton } from "../CustomizableButton";

export interface IconNameSelectProps {
  value?: string;
  /** Commit the icon name to the database. Empty string clears the override. */
  onCommit: (iconName: string) => void;
  className?: string;
  /** Hide the clear button (e.g. when a default icon must always exist). */
  allowClear?: boolean;
  compact?: boolean;
}

export function IconNameSelect({
  value = "",
  onCommit,
  className,
  allowClear = true,
  compact = false,
}: IconNameSelectProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const quickOptions = useMemo(
    () => ICON_QUICK_SWITCH.filter((option) => isKnownIcon(option.name)),
    []
  );
  const isQuickValue = quickOptions.some((option) => option.name === value);
  const ActiveIcon = getIconComponent(draft);

  const commit = (next: string) => {
    const clean = next.trim();
    setDraft(clean);
    if (clean !== value) onCommit(clean);
  };

  return (
    <div className={cn("flex items-center gap-1 min-w-0", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-md border shrink-0",
          compact ? "w-6 h-6" : "w-7 h-7",
          ActiveIcon
            ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-300"
            : "border-[#1e293b] bg-[#020617] text-slate-600"
        )}
        title={draft || uiText("ui_controls.icon_select.no_override_label", "No icon override")}
      >
        {ActiveIcon ? (
          <ActiveIcon className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
        ) : (
          <span className="text-[9px] font-mono">—</span>
        )}
      </span>

      <select
        value={isQuickValue ? value : ""}
        onChange={(event) => commit(event.target.value)}
        className={cn(
          "bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-200 rounded-md outline-none cursor-pointer",
          compact ? "text-[9.5px] px-1 py-0.5 max-w-[92px]" : "text-[10px] px-1.5 py-1 max-w-[120px]"
        )}
        title={uiText("ui_controls.icon_select.quick_switch_aria", "Quick-switch icon")}
        aria-label={uiText("ui_controls.icon_select.quick_switch_aria", "Quick-switch icon")}
      >
        <option value="">{uiText("ui_controls.icon_select.quick_switch_option", "Quick switch…")}</option>
        {quickOptions.map((option) => (
          <option key={option.name} value={option.name}>
            {option.label}
          </option>
        ))}
        {value && !isQuickValue ? <option value={value}>{value}</option> : null}
      </select>

      <input
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") {
            event.preventDefault();
            commit(draft);
            (event.target as HTMLInputElement).blur();
          }
          if (event.key === "Escape") {
            setDraft(value);
            (event.target as HTMLInputElement).blur();
          }
        }}
        placeholder={uiText("ui_controls.icon_select.name_placeholder", "Icon name")}
        className={cn(
          "bg-[#020617] border border-[#1e293b] focus:border-fuchsia-500 text-slate-200 rounded-md outline-none font-mono min-w-0",
          compact ? "text-[9.5px] px-1 py-0.5 w-[68px]" : "text-[10px] px-1.5 py-1 w-[88px]",
          draft && !ActiveIcon && "border-rose-500/60"
        )}
      />

      {draft && draft !== value ? (
        <CustomizableButton
          buttonId="ui_icon_name_select_btn_2"
          defaultIcon={<Check className="w-3 h-3" />}
          type="button"
onClick={() => commit(draft)}
className="w-5 h-5 rounded border border-emerald-500/50 text-emerald-300 hover:bg-emerald-950/40 flex items-center justify-center cursor-pointer"
title={uiText("ui_controls.icon_select.apply_button", "Apply icon")}
        />
      ) : null}

      {allowClear && (value || draft) ? (
        <CustomizableButton
          buttonId="ui_icon_name_select_btn_1"
          defaultIcon={<X className="w-3 h-3" />}
          type="button"
onClick={() => commit("")}
className="w-5 h-5 rounded border border-slate-700 text-slate-500 hover:text-rose-300 hover:border-rose-500/50 flex items-center justify-center cursor-pointer"
title={uiText("ui_controls.icon_select.clear_button", "Use the default icon")}
        />
      ) : null}
    </div>
  );
}

export default IconNameSelect;
