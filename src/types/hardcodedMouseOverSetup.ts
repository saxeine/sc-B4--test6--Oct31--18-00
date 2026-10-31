import { BUTTON_DEFINITIONS, ButtonCategory, ButtonDefinition, SECTION_NAMES } from "./buttonCustomization";

export type ActionType =
  | "Action"
  | "Navigation"
  | "Toggle"
  | "Export"
  | "Preset"
  | "Transform"
  | "AI / Studio"
  | "Delete / Reset";

export interface MouseOverButtonEntry {
  id: string;
  category: ButtonCategory;
  categoryName: string;
  label: string;
  defaultTooltip: string;
  currentTooltip: string;
  isCustomized: boolean;
  detailedDescription: string;
  keyboardShortcut: string;
  actionType: ActionType;
  iconName: string;
}

/**
 * Infer keyboard shortcut hint based on button ID, category, or default behavior
 */
function inferKeyboardShortcut(btn: ButtonDefinition): string {
  const id = btn.id.toLowerCase();
  const label = btn.defaultLabel.toLowerCase();

  if (id.includes("undo")) return "Ctrl+Z";
  if (id.includes("redo")) return "Ctrl+Y / Ctrl+Shift+Z";
  if (id.includes("revert")) return "Alt+R";
  if (id.includes("reset")) return "Shift+R";
  if (id.includes("play") || id.includes("pause")) return "Spacebar";
  if (id.includes("save") || id.includes("export")) return "Ctrl+S";
  if (id.includes("zoom_in")) return "Ctrl + / Scroll Up";
  if (id.includes("zoom_out")) return "Ctrl - / Scroll Down";
  if (id.includes("fit_screen")) return "Ctrl+0";
  if (id.includes("pan_tool")) return "Hold Space + Drag";
  if (id.includes("delete") || id.includes("trash")) return "Del / Backspace";
  if (id.includes("select_all")) return "Ctrl+A";
  if (id.includes("close") || id.includes("exit")) return "Esc";
  if (id.includes("prev")) return "Left Arrow (←)";
  if (id.includes("next")) return "Right Arrow (→)";
  if (id.includes("mode_crop")) return "Key 1";
  if (id.includes("mode_carve")) return "Key 2";
  if (id.includes("mode_storyboard")) return "Key 3";
  if (id.includes("header_studio") || id.includes("creative_studio")) return "Shift+S";
  if (label.includes("spin") || label.includes("rotate")) return "R / Shift+R";

  return "Right-Click to Customize";
}

/**
 * Infer action type based on button properties
 */
function inferActionType(btn: ButtonDefinition): ActionType {
  const id = btn.id.toLowerCase();
  const cat = btn.category;

  if (id.includes("reset") || id.includes("delete") || id.includes("clear") || id.includes("trash")) {
    return "Delete / Reset";
  }
  if (id.includes("export") || id.includes("zip") || id.includes("download") || id.includes("backup")) {
    return "Export";
  }
  if (id.includes("preset") || id.includes("ratio_") || id.includes("aspect_") || id.includes("fx_")) {
    return "Preset";
  }
  if (id.includes("toggle") || id.includes("show_") || id.includes("hide_") || id.includes("mode_") || id.includes("zero_text")) {
    return "Toggle";
  }
  if (cat === "modes" || cat === "header" || id.includes("home") || id.includes("tab_")) {
    return "Navigation";
  }
  if (cat === "crop" || cat === "multicrop" || id.includes("spin") || id.includes("zoom") || id.includes("scale") || id.includes("flip")) {
    return "Transform";
  }
  if (cat === "creative_studio" || id.includes("sharpener") || id.includes("resample") || id.includes("img_desc") || id.includes("variations") || id.includes("neo1")) {
    return "AI / Studio";
  }

  return "Action";
}

/**
 * Hardcoded baseline representation of every button's Mouse Over Dialog
 * in the current state of SeqCarver.
 */
export const HARDCODED_MOUSE_OVER_BASELINE: Record<string, {
  defaultTooltip: string;
  detailedDescription: string;
  keyboardShortcut: string;
  actionType: ActionType;
}> = Object.fromEntries(
  BUTTON_DEFINITIONS.map((btn) => {
    const shortcut = inferKeyboardShortcut(btn);
    const actionType = inferActionType(btn);
    const detailedDescription = btn.description && btn.description !== btn.defaultLabel
      ? `${btn.description}. ${btn.defaultTooltip}`
      : `${btn.defaultTooltip} across the SeqCarver studio workspace.`;

    return [
      btn.id,
      {
        defaultTooltip: btn.defaultTooltip || btn.defaultLabel,
        detailedDescription,
        keyboardShortcut: shortcut,
        actionType,
      },
    ];
  })
);

/**
 * Generate complete list of MouseOverButtonEntry items representing the app's current state,
 * merged with any active custom overrides from ButtonCustomizationContext.
 */
export function getHardcodedMouseOverList(
  customConfigs: Record<string, { customTooltip?: string; label?: string }> = {}
): MouseOverButtonEntry[] {
  return BUTTON_DEFINITIONS.map((btn) => {
    const baseline = HARDCODED_MOUSE_OVER_BASELINE[btn.id] || {
      defaultTooltip: btn.defaultTooltip || btn.defaultLabel,
      detailedDescription: btn.description || btn.defaultTooltip,
      keyboardShortcut: inferKeyboardShortcut(btn),
      actionType: inferActionType(btn),
    };

    const custom = customConfigs[btn.id];
    const isCustomized = Boolean(custom?.customTooltip && custom.customTooltip.trim() !== "" && custom.customTooltip !== baseline.defaultTooltip);
    const currentTooltip = custom?.customTooltip || baseline.defaultTooltip;
    const currentLabel = custom?.label || btn.defaultLabel;
    const catName = SECTION_NAMES[btn.category]?.name || btn.category;

    return {
      id: btn.id,
      category: btn.category,
      categoryName: catName,
      label: currentLabel,
      defaultTooltip: baseline.defaultTooltip,
      currentTooltip,
      isCustomized,
      detailedDescription: baseline.detailedDescription,
      keyboardShortcut: baseline.keyboardShortcut,
      actionType: baseline.actionType,
      iconName: btn.defaultIconName || "Sparkles",
    };
  });
}

/**
 * JSON manifest export format for Mouse Over Dialogs
 */
export interface MouseOverExportData {
  version: string;
  exportDate: string;
  application: string;
  totalButtons: number;
  totalCustomized: number;
  categoriesCovered: string[];
  tooltips: Record<string, {
    label: string;
    category: string;
    tooltip: string;
    defaultTooltip: string;
    shortcut?: string;
    actionType?: string;
  }>;
}

export function exportMouseOverDialogsToJson(
  entries: MouseOverButtonEntry[]
): string {
  const customized = entries.filter((e) => e.isCustomized);
  const categories = Array.from(new Set(entries.map((e) => e.category)));

  const tooltipsMap: Record<string, any> = {};
  entries.forEach((e) => {
    tooltipsMap[e.id] = {
      label: e.label,
      category: e.category,
      categoryName: e.categoryName,
      tooltip: e.currentTooltip,
      defaultTooltip: e.defaultTooltip,
      shortcut: e.keyboardShortcut,
      actionType: e.actionType,
      isCustomized: e.isCustomized,
    };
  });

  const exportObj: MouseOverExportData = {
    version: "1.0",
    exportDate: new Date().toISOString(),
    application: "SeqCarver Creative Studio",
    totalButtons: entries.length,
    totalCustomized: customized.length,
    categoriesCovered: categories,
    tooltips: tooltipsMap,
  };

  return JSON.stringify(exportObj, null, 2);
}
