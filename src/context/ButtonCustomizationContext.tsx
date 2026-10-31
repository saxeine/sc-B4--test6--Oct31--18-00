import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import {
  ButtonCustomConfig,
  GlobalCustomizationSettings,
  ButtonStateBackup,
  BUTTON_DEFINITIONS,
  ButtonDefinition,
  GroupRuleMode,
  ButtonCategory,
  ButtonDetailedState,
  SectionStateBackup,
  SECTION_NAMES,
  ButtonFontSize,
  ButtonIconSize,
} from "../types/buttonCustomization";
import { setActiveGeminiModel } from "../services/gemini";
import {
  HARDCODED_DEFAULT_CUSTOM_CONFIGS,
  HARDCODED_DEFAULT_GLOBAL_SETTINGS,
  HARDCODED_DEFAULT_PANEL_CONTROLS_ORDER,
  HARDCODED_DEFAULT_HEADER_ITEMS_ORDER,
  FRONT_PAGE_ICON_ONLY_BUTTON_IDS,
  USER_DEFAULT_EXPORT_JSON,
} from "../types/hardcodedDefaultConfig";
import {
  getDatabaseConfig,
  saveDatabaseConfig,
  subscribeToDatabaseConfig,
  subscribeToAuth,
  loginWithGoogle as fbLoginWithGoogle,
  getLastAuthError as fbGetLastAuthError,
  logoutUser as fbLogoutUser,
  getAppStateFromDatabase,
  saveAppStateToDatabase,
  isVerifiedCurrentUser,
  auth,
  type User,
} from "../services/firebase";
import { saveStoredJson, getStoredJson } from "../utils/idbStorage";
import { remoteStore } from "../services/remoteKeyValueStore";

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  buttonId: string | null;
}

interface ButtonCustomizationContextType {
  customConfigs: Record<string, ButtonCustomConfig>;
  globalSettings: GlobalCustomizationSettings;
  hasUserDefault: boolean;
  saveCurrentAsDefault: (
    immediateConfigs?: Record<string, ButtonCustomConfig>,
    immediateSettings?: GlobalCustomizationSettings,
    extraPayload?: Record<string, any>
  ) => boolean;
  restoreAllFromSavedSetup: () => { success: boolean; count: number; message: string };
  restoreFullDefaultsFromDatabase: () => Promise<{ success: boolean; count: number; message: string }>;
  resetToUserDefault: () => void;
  resetToFactoryDefaults: () => void;
  clearUserDefault: () => void;
  updateButtonConfig: (id: string, partial: Partial<ButtonCustomConfig>) => void;
  resetButtonConfig: (id: string) => void;
  resetAllConfigs: () => void;
  toggleGlobalZeroTextMode: () => void;
  toggleButtonZeroText: (id: string) => void;
  showCropDragHandles: boolean;
  showAniPlayerDragHandles: boolean;
  toggleCropDragHandles: () => void;
  setCropDragHandles: (show: boolean) => void;
  toggleAniPlayerDragHandles: () => void;
  setAniPlayerDragHandles: (show: boolean) => void;
  stripBackground: string;
  setStripBackground: (color: string) => void;
  stripImageBackground: string;
  setStripImageBackground: (color: string) => void;
  stripPanelBackground: string;
  setStripPanelBackground: (color: string) => void;
  showSlotHeaders: boolean;
  toggleSlotHeaders: () => void;
  setSlotHeaders: (show: boolean) => void;
  showTopPanelButtons: boolean;
  toggleTopPanelButtons: () => void;
  setTopPanelButtons: (show: boolean) => void;
  setGroupRule: (category: ButtonCategory | string, rule: GroupRuleMode) => void;
  getGroupRule: (category: ButtonCategory | string) => GroupRuleMode;
  buttonOrder: string[];
  reorderButtons: (newOrder: string[]) => void;
  resetButtonOrder: () => void;
  panelControlsOrder: string[];
  setPanelControlsOrder: (newOrder: string[] | ((prev: string[]) => string[])) => void;
  resetPanelControlsOrder: () => void;
  headerItemsOrder: string[];
  setHeaderItemsOrder: (newOrder: string[] | ((prev: string[]) => string[])) => void;
  resetHeaderItemsOrder: () => void;
  quickSlots: { id: string; name: string; timestamp?: string; data?: string }[];
  saveToQuickSlot: (slotId: string, name?: string) => boolean;
  loadFromQuickSlot: (slotId: string) => boolean;
  clearQuickSlot: (slotId: string) => void;
  importConfigs: (jsonString: string) => { success: boolean; count: number; error?: string };
  exportConfigs: () => string;
  getConfig: (id: string) => ButtonCustomConfig | undefined;
  getDefinition: (id: string) => ButtonDefinition | undefined;
  isZeroText: (id: string) => boolean;
  isTextOnly: (id: string) => boolean;
  toggleButtonHideIcon: (id: string) => void;
  getButtonLabel: (id: string, defaultLabel: string) => string;
  openContextMenuForButton: (e: React.MouseEvent, buttonId: string) => void;
  openMiniCustomizer: (buttonId?: string, x?: number, y?: number) => void;
  closeContextMenu: () => void;
  contextMenuState: ContextMenuState;
  isStudioModalOpen: boolean;
  activeStudioButtonId: string | null;
  inspectedElementIds: string[];
  studioInspectNonce: number;
  openStudioModal: (buttonId?: string, multiIds?: string[]) => void;
  closeStudioModal: () => void;

  // AI Model Settings in IBC
  activeAiModel: string;
  setActiveAiModel: (model: string) => void;
  aiTemperature: number;
  setAiTemperature: (temp: number) => void;

  // Font Size Settings in IBC
  globalFontSize: ButtonFontSize;
  setGlobalFontSize: (size: ButtonFontSize) => void;

  // Icon Size Settings in IBC
  globalIconSize: ButtonIconSize;
  setGlobalIconSize: (size: ButtonIconSize) => void;

  // Cloud Database Integration
  isDatabaseConnected: boolean;
  isDatabaseSyncing: boolean;
  lastDatabaseSyncTime: string | null;
  isLiveCloudEditorOpen: boolean;
  openLiveCloudEditor: () => void;
  closeLiveCloudEditor: () => void;
  currentUser: User | null;
  isLoggingIn: boolean;
  authNotice: string | null;
  setAuthNotice: (notice: string | null) => void;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: (displayName?: string) => Promise<void>;
  loginAsDevUser: (email?: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  saveConfigurationToDatabase: (customName?: string) => Promise<boolean>;
  updateDatabaseConfigOnTheFly: (newConfigJson: string) => Promise<{ success: boolean; error?: string }>;
  reloadConfigurationFromDatabase: () => Promise<void>;
  recallAllDefaultsFromDatabase: (user?: User | null) => Promise<void>;
  // IBC Inspector
  isIbcInspectorActive: boolean;
  setIsIbcInspectorActive: (active: boolean) => void;
  toggleIbcInspector: (override?: boolean) => void;
}

const BUTTON_DEFINITIONS_MAP = new Map<string, ButtonDefinition>(
  BUTTON_DEFINITIONS.map((b) => [b.id, b])
);

const HARDCODED_VERSION_KEY = "seqcarver_default_version_marker_v23";
const CURRENT_VERSION_VAL = "2026-10-28-creative-playground-modal-v23";

const STORAGE_KEY = "seqcarver_button_customizations_v1";
const SETTINGS_KEY = "seqcarver_customization_settings_v1";
const DEFAULT_CUSTOMIZATIONS_KEY = "seqcarver_button_customizations_user_default_v1";
const DEFAULT_SETTINGS_KEY = "seqcarver_customization_settings_user_default_v1";
const DEFAULT_MARKER_KEY = "seqcarver_has_saved_user_default_v1";
const QUICK_SLOTS_KEY = "seqcarver_button_quick_slots_v1";
export const HEADER_LOGO_STORAGE_KEY = "seqcarver_header_logo_config";

const LEGACY_HARDCODED_HEADER_STRINGS: Record<string, string[]> = {
  header_logo: ["SeqCarver Sept 26"],
  header_load_image: ["Load Image"],
  header_rename_tag: ["Rename Studio"],
  header_cloud_db: ["Cloud DB"],
  header_utility_modal: ["Utility", "Utility Modal"],
  header_studio_palette: ["Creative Studios"],
  header_anim_player: ["Animation Player"],
  front_page_ad_header_title: ["Front Page Advert Panels"],
  front_page_ad_header_badge: ["9 Panels (3×3)", "16 Panels (4×4)"],
  front_page_ad_header_reset_btn: ["Reset to Default"],
  ad_panel_header_title: [
    "Front Page Advert Panels",
    "PANEL EDIT : FRONT PAGE ADVERT PANELS CONTROL STUDIO",
  ],
  label_define_canvas_crop: ["Crop Definition", "Define Canvas & Crop"],
  label_crop_area_header: ["Crop Area"],
  creative_studio_header_title: ["Creative Studio"],
};

const LEGACY_ICON_MIGRATIONS: Record<string, { from: string[]; to: string }> = {
  front_page_ad_toggle_panel_bar: { from: ["SlidersHorizontal"], to: "Eye" },
  front_page_ad_slide_menu_trigger: { from: ["SlidersHorizontal"], to: "Signpost" },
  front_page_ad_utility_modal: { from: ["SlidersHorizontal"], to: "Cpu" },
  front_page_ad_adv_modal: { from: ["Cpu", "SlidersHorizontal"], to: "Zap" },
};

function sanitizeLegacyHeaderConfigs(
  configs: Record<string, ButtonCustomConfig>
): Record<string, ButtonCustomConfig> {
  const cleaned = { ...configs };
  for (const [id, legacyLabels] of Object.entries(LEGACY_HARDCODED_HEADER_STRINGS)) {
    const entry = cleaned[id];
    if (!entry) continue;
    const currentLabel = typeof entry.label === "string" ? entry.label.trim() : undefined;
    if (id === "header_logo") {
      if (!currentLabel || legacyLabels.includes(currentLabel)) {
        cleaned[id] = {
          ...entry,
          label: "SeqCarver 26 oct",
          hideText: false,
          hideIcon: false,
          accentColor: "",
        };
      }
      continue;
    }
    if (currentLabel === undefined || legacyLabels.includes(currentLabel)) {
      cleaned[id] = {
        ...entry,
        label: "",
        hideText: true,
      };
    }
  }
  return cleaned;
}

function sanitizeFrontPageCleanDefaults(
  configs: Record<string, ButtonCustomConfig>
): Record<string, ButtonCustomConfig> {
  const cleaned = sanitizeLegacyHeaderConfigs(configs);

  for (const containerId of ["header_container", "panel_controls_container"]) {
    if (cleaned[containerId]) {
      cleaned[containerId] = {
        ...cleaned[containerId],
        label: "",
        hideText: true,
        backgroundColor: "",
        borderColor: "",
        accentColor: "",
      };
    }
  }

  for (const id of FRONT_PAGE_ICON_ONLY_BUTTON_IDS) {
    const existing = cleaned[id];
    const base = HARDCODED_DEFAULT_CUSTOM_CONFIGS[id] || { id };
    const merged: ButtonCustomConfig = {
      ...base,
      ...(existing || {}),
      id,
      label: "",
      hideText: true,
      hideIcon: false,
      accentColor: "",
      backgroundColor: "",
      borderColor: "",
    };
    const iconMigration = LEGACY_ICON_MIGRATIONS[id];
    if (
      iconMigration &&
      merged.customIconType !== "image" &&
      merged.customIconType !== "emoji" &&
      (!merged.iconName || iconMigration.from.includes(merged.iconName))
    ) {
      merged.iconName = iconMigration.to;
    }
    cleaned[id] = merged;
  }

  const existingLogo = cleaned.header_logo;
  const trimmedLogoLabel = typeof existingLogo?.label === "string" ? existingLogo.label.trim() : "";
  const isLegacyLogo =
    !trimmedLogoLabel || LEGACY_HARDCODED_HEADER_STRINGS.header_logo.includes(trimmedLogoLabel);
  cleaned.header_logo = {
    ...(HARDCODED_DEFAULT_CUSTOM_CONFIGS.header_logo || { id: "header_logo" }),
    ...(existingLogo || {}),
    id: "header_logo",
    label: isLegacyLogo ? "SeqCarver 26 oct" : trimmedLogoLabel,
    hideText: isLegacyLogo ? false : existingLogo?.hideText === true && trimmedLogoLabel.length === 0,
    hideIcon: existingLogo?.hideIcon === true ? true : false,
    accentColor: "",
  };
  if (!cleaned.header_logo.iconName && !cleaned.header_logo.customIconType) {
    cleaned.header_logo.iconName = "Zap";
  }

  return cleaned;
}

function normalizeHeaderItemsOrder(rawOrder?: string[]): string[] {
  if (!Array.isArray(rawOrder) || rawOrder.length === 0) {
    return [...HARDCODED_DEFAULT_HEADER_ITEMS_ORDER];
  }
  const mapped = rawOrder
    .filter(Boolean)
    .map((item) => (item === "utility_modal" ? "panel_controls" : item));
  const deduped = Array.from(new Set(mapped));
  for (const req of HARDCODED_DEFAULT_HEADER_ITEMS_ORDER) {
    if (!deduped.includes(req)) {
      deduped.push(req);
    }
  }
  return deduped;
}

export const DEFAULT_SETTINGS: GlobalCustomizationSettings = {
  ...HARDCODED_DEFAULT_GLOBAL_SETTINGS,
};

const DEFAULT_SNAPSHOT_PAYLOAD = JSON.stringify({
  customConfigs: HARDCODED_DEFAULT_CUSTOM_CONFIGS,
  globalSettings: HARDCODED_DEFAULT_GLOBAL_SETTINGS,
});

export const DEFAULT_QUICK_SLOTS = [
  { id: "slot_1", name: "Quick Snapshot A (Hardcoded Default)", timestamp: "Factory Default", data: DEFAULT_SNAPSHOT_PAYLOAD },
  { id: "slot_2", name: "Quick Snapshot B", timestamp: undefined, data: undefined },
  { id: "slot_3", name: "Quick Snapshot C", timestamp: undefined, data: undefined },
];

const ButtonCustomizationContext = createContext<
  ButtonCustomizationContextType | undefined
>(undefined);

export function ensureButtonCustomizationDefaults(): void {
  try {
    const existingCustom = remoteStore.getItem(DEFAULT_CUSTOMIZATIONS_KEY) || remoteStore.getItem(STORAGE_KEY);
    const hasDefault = remoteStore.getItem(DEFAULT_MARKER_KEY) === "true";
    const existingLogo = remoteStore.getItem(HEADER_LOGO_STORAGE_KEY);
    const versionMarker = remoteStore.getItem(HARDCODED_VERSION_KEY);
    const versionMismatch = versionMarker !== CURRENT_VERSION_VAL;

    if (!existingCustom || !hasDefault || versionMismatch) {
      let initialConfigs: Record<string, ButtonCustomConfig> = { ...HARDCODED_DEFAULT_CUSTOM_CONFIGS };
      if (existingCustom) {
        try {
          const parsedCustom = JSON.parse(existingCustom);
          if (parsedCustom && typeof parsedCustom === "object") {
            initialConfigs = { ...initialConfigs, ...parsedCustom };
          }
        } catch {}
      }
      if (existingLogo) {
        try {
          const parsed = JSON.parse(existingLogo);
          if (parsed && typeof parsed === "object") {
            initialConfigs.header_logo = { ...(initialConfigs.header_logo || {}), ...parsed };
          }
        } catch {}
      }
      initialConfigs = sanitizeFrontPageCleanDefaults(initialConfigs);
      if (initialConfigs.header_logo) {
        remoteStore.setItem(HEADER_LOGO_STORAGE_KEY, JSON.stringify(initialConfigs.header_logo));
      }
      remoteStore.setItem(HARDCODED_VERSION_KEY, CURRENT_VERSION_VAL);
      remoteStore.setItem(DEFAULT_CUSTOMIZATIONS_KEY, JSON.stringify(initialConfigs));
      remoteStore.setItem(STORAGE_KEY, JSON.stringify(initialConfigs));
      remoteStore.setItem(DEFAULT_MARKER_KEY, "true");

      const existingSettings = remoteStore.getItem(DEFAULT_SETTINGS_KEY) || remoteStore.getItem(SETTINGS_KEY);
      if (!existingSettings || versionMismatch) {
        let nextSettings: GlobalCustomizationSettings = { ...HARDCODED_DEFAULT_GLOBAL_SETTINGS };
        if (existingSettings) {
          try {
            const parsedSettings = JSON.parse(existingSettings);
            if (parsedSettings && typeof parsedSettings === "object") {
              nextSettings = {
                ...HARDCODED_DEFAULT_GLOBAL_SETTINGS,
                ...parsedSettings,
                headerItemsOrder: [...HARDCODED_DEFAULT_HEADER_ITEMS_ORDER],
                panelControlsOrder: [...HARDCODED_DEFAULT_PANEL_CONTROLS_ORDER],
                groupSettings: {
                  ...(parsedSettings.groupSettings || {}),
                  ...HARDCODED_DEFAULT_GLOBAL_SETTINGS.groupSettings,
                },
              };
            }
          } catch {}
        }
        remoteStore.setItem(DEFAULT_SETTINGS_KEY, JSON.stringify(nextSettings));
        remoteStore.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
        remoteStore.setItem("seqcarver_header_items_order", JSON.stringify(HARDCODED_DEFAULT_HEADER_ITEMS_ORDER));
        remoteStore.setItem("seqcarver_panel_controls_order", JSON.stringify(HARDCODED_DEFAULT_PANEL_CONTROLS_ORDER));
      }
    }
  } catch (e) {
    console.error("Storage initialization error", e);
  }
}

export function ButtonCustomizationProvider({ children }: { children: ReactNode }) {
  // Ensure the user's export configuration file is loaded initially if no saved setup exists,
  // safely executed within useEffect to avoid updating other components during render.
  useEffect(() => {
    ensureButtonCustomizationDefaults();
  }, []);

  // State: load saved user default (including header_logo and all custom buttons) as permanent default
  const [customConfigs, setCustomConfigs] = useState<Record<string, ButtonCustomConfig>>(() => {
    let resolved: Record<string, ButtonCustomConfig> = { ...HARDCODED_DEFAULT_CUSTOM_CONFIGS };
    try {
      const savedUserDefault = remoteStore.getItem(DEFAULT_CUSTOMIZATIONS_KEY);
      if (savedUserDefault) {
        const parsed = JSON.parse(savedUserDefault);
        if (parsed && typeof parsed === "object") {
          resolved = { ...resolved, ...parsed };
        }
      } else {
        const savedStorage = remoteStore.getItem(STORAGE_KEY);
        if (savedStorage) {
          const parsed = JSON.parse(savedStorage);
          if (parsed && typeof parsed === "object") {
            resolved = { ...resolved, ...parsed };
          }
        }
      }
      const savedLogo = remoteStore.getItem(HEADER_LOGO_STORAGE_KEY);
      if (savedLogo) {
        const parsed = JSON.parse(savedLogo);
        if (parsed && typeof parsed === "object") {
          resolved.header_logo = { ...(resolved.header_logo || {}), ...parsed };
        }
      }
    } catch (e) {
      console.warn("Storage read error on init:", e);
    }
    return sanitizeFrontPageCleanDefaults(resolved);
  });

  const [globalSettings, setGlobalSettings] = useState<GlobalCustomizationSettings>(() => {
    try {
      const savedSettings = remoteStore.getItem(DEFAULT_SETTINGS_KEY) || remoteStore.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed && typeof parsed === "object") {
          const cleanButtonOrder = Array.isArray(parsed.buttonOrder)
            ? Array.from(new Set(parsed.buttonOrder.filter(Boolean) as string[]))
            : undefined;
          return {
            ...HARDCODED_DEFAULT_GLOBAL_SETTINGS,
            ...parsed,
            headerItemsOrder: normalizeHeaderItemsOrder(parsed.headerItemsOrder),
            groupSettings: {
              ...(parsed.groupSettings || {}),
              ...HARDCODED_DEFAULT_GLOBAL_SETTINGS.groupSettings,
            },
            ...(cleanButtonOrder ? { buttonOrder: cleanButtonOrder } : {}),
          };
        }
      }
    } catch (e) {
      console.warn("Settings storage read error on init:", e);
    }
    return { ...HARDCODED_DEFAULT_GLOBAL_SETTINGS };
  });

  const customConfigsRef = useRef<Record<string, ButtonCustomConfig>>(customConfigs);
  customConfigsRef.current = customConfigs;
  const globalSettingsRef = useRef<GlobalCustomizationSettings>(globalSettings);
  globalSettingsRef.current = globalSettings;

  const [quickSlots, setQuickSlots] = useState<{ id: string; name: string; timestamp?: string; data?: string }[]>(() => {
    try {
      const saved = remoteStore.getItem(QUICK_SLOTS_KEY);
      if (saved) return JSON.parse(saved);
      return DEFAULT_QUICK_SLOTS;
    } catch {
      return DEFAULT_QUICK_SLOTS;
    }
  });

  const [hasUserDefault, setHasUserDefault] = useState<boolean>(() => {
    try {
      return remoteStore.getItem(DEFAULT_MARKER_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [contextMenuState, setContextMenuState] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    buttonId: null,
  });

  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false);
  const [activeStudioButtonId, setActiveStudioButtonId] = useState<string | null>(null);
  const [inspectedElementIds, setInspectedElementIds] = useState<string[]>([]);
  const [studioInspectNonce, setStudioInspectNonce] = useState(0);

  // Cloud Database state
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean>(() =>
    isVerifiedCurrentUser(auth.currentUser)
  );
  const [isDatabaseSyncing, setIsDatabaseSyncing] = useState(false);
  const [lastDatabaseSyncTime, setLastDatabaseSyncTime] = useState<string | null>(null);
  const [isLiveCloudEditorOpen, setIsLiveCloudEditorOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const buttonOrder = useMemo(() => {
    const rawOrder =
      globalSettings.buttonOrder && globalSettings.buttonOrder.length > 0
        ? globalSettings.buttonOrder
        : BUTTON_DEFINITIONS.map((b) => b.id);
    const seen = new Set<string>();
    const deduped: string[] = [];
    rawOrder.forEach((id) => {
      if (id && !seen.has(id)) {
        seen.add(id);
        deduped.push(id);
      }
    });
    BUTTON_DEFINITIONS.forEach((b) => {
      if (!seen.has(b.id)) {
        seen.add(b.id);
        deduped.push(b.id);
      }
    });
    return deduped;
  }, [globalSettings.buttonOrder]);

  const buttonOrderRef = useRef<string[]>(buttonOrder);
  buttonOrderRef.current = buttonOrder;
  const quickSlotsRef = useRef(quickSlots);
  quickSlotsRef.current = quickSlots;

  // Save customizations locally and automatically make all button customizer changes the default!
  useEffect(() => {
    try {
      remoteStore.setItem(STORAGE_KEY, JSON.stringify(customConfigs));
      remoteStore.setItem(DEFAULT_CUSTOMIZATIONS_KEY, JSON.stringify(customConfigs));
      remoteStore.setItem(DEFAULT_MARKER_KEY, "true");
      setHasUserDefault(true);
    } catch (e) {
      console.error("Failed to save button customizations", e);
    }
  }, [customConfigs]);

  useEffect(() => {
    try {
      remoteStore.setItem(SETTINGS_KEY, JSON.stringify(globalSettings));
      remoteStore.setItem(DEFAULT_SETTINGS_KEY, JSON.stringify(globalSettings));
    } catch (e) {
      console.error("Failed to save customization settings", e);
    }
  }, [globalSettings]);

  useEffect(() => {
    try {
      remoteStore.setItem(QUICK_SLOTS_KEY, JSON.stringify(quickSlots));
    } catch (e) {
      console.error("Failed to save quick slots", e);
    }
  }, [quickSlots]);

  // Canonical normalization helper for panel controls items to prune verbose duplicate aliases
  const canonicalPanelControlId = (rawId: string): string | null => {
    if (!rawId || typeof rawId !== "string") return null;
    const id = rawId.trim();
    if (
      [
        "four_by_four",
        "4x4",
        "front_page_ad_btn_4x4",
        "front_page_ad_4x4",
        "front_page_ad_4x4_launcher",
        "grid_mode_toggle",
        "toggle_links",
        "save_default",
        "cloud_db",
        "tilelink",
        "front_page_ad_tilelink_modal",
        "hide_bar",
        "front_page_ad_hide_panel_bar",
        "reset_spread",
        "front_page_ad_reset_spread",
        "quick_action",
        "quick_act",
        "front_page_ad_quick_action",
        "ibc_inspector",
        "front_page_ad_ibc_inspector",
        "rotation",
        "front_page_ad_global_rotation",
      ].includes(id)
    ) {
      return null;
    }
    if (["control_deck", "deck", "front_page_ad_control_deck"].includes(id)) {
      return "control_deck";
    }
    if (["utility_modal", "util_modal", "util", "front_page_ad_utility_modal"].includes(id)) {
      return "utility_modal";
    }
    if (["adv_modal", "adv", "front_page_ad_adv_modal"].includes(id)) {
      return "adv_modal";
    }
    if (["swap_panels", "front_page_ad_swap_panels"].includes(id)) {
      return "swap_panels";
    }
    if (["slide_menu", "front_page_ad_slide_menu_trigger"].includes(id)) {
      return "slide_menu";
    }
    if (["button_customizer", "customizer", "front_page_ad_button_customizer"].includes(id)) {
      return "button_customizer";
    }
    if (["undo_swap", "front_page_ad_undo_swap"].includes(id)) {
      return "undo_swap";
    }
    if (["logo", "header_logo"].includes(id)) {
      return "logo";
    }
    return id;
  };

  const pruneAndCanonicalizePanelControls = useCallback((order: string[]): string[] => {
    const cleanList: string[] = [];
    const seen = new Set<string>();

    for (const raw of order || []) {
      const canonical = canonicalPanelControlId(raw);
      if (canonical && !seen.has(canonical)) {
        seen.add(canonical);
        cleanList.push(canonical);
      }
    }

    if (!seen.has("control_deck")) {
      const swapIdx = cleanList.indexOf("swap_panels");
      if (swapIdx >= 0) {
        cleanList.splice(swapIdx + 1, 0, "control_deck");
      } else {
        cleanList.push("control_deck");
      }
      seen.add("control_deck");
    }

    for (const defItem of HARDCODED_DEFAULT_PANEL_CONTROLS_ORDER) {
      if (!seen.has(defItem)) {
        seen.add(defItem);
        cleanList.push(defItem);
      }
    }

    return cleanList;
  }, []);

  const [panelControlsOrder, setPanelControlsOrderState] = useState<string[]>(() => {
    try {
      if (Array.isArray(globalSettings.panelControlsOrder) && globalSettings.panelControlsOrder.length > 0) {
        return pruneAndCanonicalizePanelControls(globalSettings.panelControlsOrder);
      }
      const saved = remoteStore.getItem("seqcarver_panel_controls_order");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return pruneAndCanonicalizePanelControls(parsed);
        }
      }
    } catch {}
    return [...HARDCODED_DEFAULT_PANEL_CONTROLS_ORDER];
  });

  const panelControlsOrderRef = useRef<string[]>(panelControlsOrder);
  panelControlsOrderRef.current = panelControlsOrder;

  const setPanelControlsOrder = useCallback((update: string[] | ((prev: string[]) => string[])) => {
    setPanelControlsOrderState((prev) => {
      const nextRaw = typeof update === "function" ? update(prev) : update;
      const clean = pruneAndCanonicalizePanelControls(nextRaw);
      panelControlsOrderRef.current = clean;
      try {
        remoteStore.setItem("seqcarver_panel_controls_order", JSON.stringify(clean));
      } catch {}
      setGlobalSettings((curr) => ({
        ...curr,
        panelControlsOrder: clean,
      }));
      return clean;
    });
  }, [pruneAndCanonicalizePanelControls]);

  const resetPanelControlsOrder = useCallback(() => {
    const clean = [...HARDCODED_DEFAULT_PANEL_CONTROLS_ORDER];
    setPanelControlsOrder(clean);
  }, [setPanelControlsOrder]);

  const [headerItemsOrder, setHeaderItemsOrderState] = useState<string[]>(() => {
    try {
      if (Array.isArray(globalSettings.headerItemsOrder) && globalSettings.headerItemsOrder.length > 0) {
        return normalizeHeaderItemsOrder(globalSettings.headerItemsOrder);
      }
      const saved = remoteStore.getItem("seqcarver_header_items_order");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return normalizeHeaderItemsOrder(parsed);
        }
      }
    } catch {}
    return [...HARDCODED_DEFAULT_HEADER_ITEMS_ORDER];
  });

  const headerItemsOrderRef = useRef<string[]>(headerItemsOrder);
  headerItemsOrderRef.current = headerItemsOrder;

  const setHeaderItemsOrder = useCallback((update: string[] | ((prev: string[]) => string[])) => {
    setHeaderItemsOrderState((prev) => {
      const nextRaw = typeof update === "function" ? update(prev) : update;
      const clean = Array.from(new Set((nextRaw || []).filter(Boolean)));
      headerItemsOrderRef.current = clean;
      try {
        remoteStore.setItem("seqcarver_header_items_order", JSON.stringify(clean));
      } catch {}
      setGlobalSettings((curr) => ({
        ...curr,
        headerItemsOrder: clean,
      }));
      return clean;
    });
  }, []);

  const resetHeaderItemsOrder = useCallback(() => {
    const clean = [...HARDCODED_DEFAULT_HEADER_ITEMS_ORDER];
    setHeaderItemsOrder(clean);
  }, [setHeaderItemsOrder]);

  // Build the complete configuration backup JSON
  const buildBackupPayload = useCallback(
    (
      currentCustom: Record<string, ButtonCustomConfig>,
      currentSettings: GlobalCustomizationSettings,
      order: string[],
      slots: { id: string; name: string; timestamp?: string }[]
    ): ButtonStateBackup => {
      const cleanOrder = Array.from(new Set((order || []).filter(Boolean)));
      const rawPanelControls = (
        (panelControlsOrderRef.current && panelControlsOrderRef.current.length > 0)
          ? panelControlsOrderRef.current
          : (currentSettings.panelControlsOrder || HARDCODED_DEFAULT_PANEL_CONTROLS_ORDER)
      );
      const cleanPanelControlsOrder = pruneAndCanonicalizePanelControls(rawPanelControls);

      const rawHeaderItems = (
        (headerItemsOrderRef.current && headerItemsOrderRef.current.length > 0)
          ? headerItemsOrderRef.current
          : (currentSettings.headerItemsOrder || HARDCODED_DEFAULT_HEADER_ITEMS_ORDER)
      );
      const cleanHeaderItemsOrder = Array.from(new Set((rawHeaderItems || []).filter(Boolean)));

      const cleanSettings: GlobalCustomizationSettings = {
        ...currentSettings,
        buttonOrder: cleanOrder,
        panelControlsOrder: cleanPanelControlsOrder,
        headerItemsOrder: cleanHeaderItemsOrder,
      };

      const backup: ButtonStateBackup = {
        version: "3.0",
        appName: "SeqCarver",
        exportType: "button_and_label_customization_backup",
        timestamp: new Date().toISOString(),
        dateFormatted: new Date().toLocaleString(),
        buttonCount: BUTTON_DEFINITIONS.length,
        totalButtonsConfigured: Object.keys(currentCustom).length,
        totalSectionsCovered: 21,
        globalSettings: cleanSettings,
        customConfigs: currentCustom,
        buttonOrder: cleanOrder,
        panelControlsOrder: cleanPanelControlsOrder,
        headerItemsOrder: cleanHeaderItemsOrder,
        quickSlots: slots.map((qs) => ({
          id: qs.id,
          name: qs.name,
          timestamp: qs.timestamp || new Date().toISOString(),
        })),
      };

      return backup;
    },
    [pruneAndCanonicalizePanelControls]
  );

  // Auto-save all IBC changes to Firestore Cloud Database on the fly when signed in!
  const isInitialMountForDbSync = useRef(true);
  const lastSavedJsonRef = useRef<string>("");
  useEffect(() => {
    if (isInitialMountForDbSync.current) {
      isInitialMountForDbSync.current = false;
      return;
    }

    if (!isVerifiedCurrentUser(auth.currentUser)) {
      return;
    }

    const timer = setTimeout(() => {
      if (!isVerifiedCurrentUser(auth.currentUser)) {
        return;
      }
      const backup = buildBackupPayload(
        customConfigsRef.current || customConfigs,
        globalSettingsRef.current || globalSettings,
        buttonOrderRef.current || buttonOrder,
        quickSlotsRef.current || quickSlots
      );
      const serialized = JSON.stringify(backup);
      if (serialized === lastSavedJsonRef.current) {
        return;
      }
      lastSavedJsonRef.current = serialized;

      saveDatabaseConfig(backup)
        .then((saved) => {
          if (saved) {
            setIsDatabaseConnected(true);
            setLastDatabaseSyncTime(new Date().toLocaleTimeString());
          }
        })
        .catch((err) => {
          console.warn("Auto-save IBC config to Firestore database warning:", err);
        });
    }, 1500);

    return () => clearTimeout(timer);
  }, [customConfigs, globalSettings, buttonOrder, quickSlots, buildBackupPayload]);

  // Firestore Real-Time On-The-Fly Sync & Initial Boot Fetch (when signed in)
  useEffect(() => {
    let isSubscribed = true;

    // 1. Initial fetch from Firestore Cloud Database (no-op returning defaults if signed out)
    getDatabaseConfig()
      .then((remoteConfig) => {
        if (!isSubscribed || !remoteConfig) return;
        if (isVerifiedCurrentUser(auth.currentUser)) {
          setIsDatabaseConnected(true);
          setLastDatabaseSyncTime(new Date().toLocaleTimeString());
        }

        if (remoteConfig.customConfigs && typeof remoteConfig.customConfigs === "object") {
          setCustomConfigs((prev) => {
            const next = {
              ...prev,
              ...(remoteConfig.customConfigs as Record<string, ButtonCustomConfig>),
            };
            const savedLogo = remoteStore.getItem(HEADER_LOGO_STORAGE_KEY);
            if (savedLogo) {
              try {
                const parsed = JSON.parse(savedLogo);
                if (parsed && typeof parsed === "object") {
                  next.header_logo = { ...(next.header_logo || {}), ...parsed };
                }
              } catch {}
            }
            return sanitizeFrontPageCleanDefaults(next);
          });
        }
        if (remoteConfig.globalSettings && typeof remoteConfig.globalSettings === "object") {
          setGlobalSettings((prev) => ({
            ...prev,
            ...remoteConfig.globalSettings,
            headerItemsOrder: normalizeHeaderItemsOrder(remoteConfig.globalSettings?.headerItemsOrder),
            groupSettings: {
              ...(remoteConfig.globalSettings?.groupSettings || {}),
              ...HARDCODED_DEFAULT_GLOBAL_SETTINGS.groupSettings,
            },
          }));
          if (Array.isArray(remoteConfig.globalSettings.panelControlsOrder) && remoteConfig.globalSettings.panelControlsOrder.length > 0) {
            setPanelControlsOrderState(pruneAndCanonicalizePanelControls(remoteConfig.globalSettings.panelControlsOrder));
          }
          if (Array.isArray(remoteConfig.globalSettings.headerItemsOrder) && remoteConfig.globalSettings.headerItemsOrder.length > 0) {
            setHeaderItemsOrderState(normalizeHeaderItemsOrder(remoteConfig.globalSettings.headerItemsOrder));
          }
        } else if (remoteConfig.panelControlsOrder || remoteConfig.headerItemsOrder) {
          if (Array.isArray(remoteConfig.panelControlsOrder) && remoteConfig.panelControlsOrder.length > 0) {
            setPanelControlsOrderState(pruneAndCanonicalizePanelControls(remoteConfig.panelControlsOrder));
          }
          if (Array.isArray(remoteConfig.headerItemsOrder) && remoteConfig.headerItemsOrder.length > 0) {
            setHeaderItemsOrderState(normalizeHeaderItemsOrder(remoteConfig.headerItemsOrder));
          }
        }
        if (remoteConfig.quickSlots && Array.isArray(remoteConfig.quickSlots)) {
          setQuickSlots(remoteConfig.quickSlots);
        }

        // Dedicated header_logo persistent state retrieval
        getAppStateFromDatabase<ButtonCustomConfig>("header_logo_custom_config")
          .then((remoteLogo) => {
            if (!isSubscribed || !remoteLogo) return;
            const trimmedRemoteLabel = typeof remoteLogo.label === "string" ? remoteLogo.label.trim() : "";
            const isLegacyRemoteLogo =
              !trimmedRemoteLabel || LEGACY_HARDCODED_HEADER_STRINGS.header_logo.includes(trimmedRemoteLabel);
            const sanitizedLogo: ButtonCustomConfig = {
              ...remoteLogo,
              id: "header_logo",
              label: isLegacyRemoteLogo ? "SeqCarver 26 oct" : trimmedRemoteLabel,
              hideText: isLegacyRemoteLogo ? false : remoteLogo.hideText === true && trimmedRemoteLabel.length === 0,
              accentColor: "",
            };
            setCustomConfigs((prev) => ({
              ...prev,
              header_logo: { ...(prev.header_logo || {}), ...sanitizedLogo },
            }));
            try {
              remoteStore.setItem(HEADER_LOGO_STORAGE_KEY, JSON.stringify(sanitizedLogo));
            } catch {}
          })
          .catch(() => {});
      })
      .catch((err) => {
        console.warn("Initial Firestore database load error:", err);
      });

    // 2. Real-time onSnapshot listener for on-the-fly updates from database
    const unsub = subscribeToDatabaseConfig((remoteConfig) => {
      if (!isSubscribed || !remoteConfig) return;
      setIsDatabaseConnected(true);
      setLastDatabaseSyncTime(new Date().toLocaleTimeString());

      if (remoteConfig.customConfigs && typeof remoteConfig.customConfigs === "object") {
        setCustomConfigs((prev) =>
          sanitizeFrontPageCleanDefaults({
            ...prev,
            ...(remoteConfig.customConfigs as Record<string, ButtonCustomConfig>),
          })
        );
      }
      if (remoteConfig.globalSettings && typeof remoteConfig.globalSettings === "object") {
        setGlobalSettings((prev) => ({
          ...prev,
          ...remoteConfig.globalSettings,
          headerItemsOrder: normalizeHeaderItemsOrder(remoteConfig.globalSettings?.headerItemsOrder),
          groupSettings: {
            ...(remoteConfig.globalSettings?.groupSettings || {}),
            ...HARDCODED_DEFAULT_GLOBAL_SETTINGS.groupSettings,
          },
        }));
        if (Array.isArray(remoteConfig.globalSettings.panelControlsOrder) && remoteConfig.globalSettings.panelControlsOrder.length > 0) {
          setPanelControlsOrderState(pruneAndCanonicalizePanelControls(remoteConfig.globalSettings.panelControlsOrder));
        }
        if (Array.isArray(remoteConfig.globalSettings.headerItemsOrder) && remoteConfig.globalSettings.headerItemsOrder.length > 0) {
          setHeaderItemsOrderState(normalizeHeaderItemsOrder(remoteConfig.globalSettings.headerItemsOrder));
        }
      } else if (remoteConfig.panelControlsOrder || remoteConfig.headerItemsOrder) {
        if (Array.isArray(remoteConfig.panelControlsOrder) && remoteConfig.panelControlsOrder.length > 0) {
          setPanelControlsOrderState(pruneAndCanonicalizePanelControls(remoteConfig.panelControlsOrder));
        }
        if (Array.isArray(remoteConfig.headerItemsOrder) && remoteConfig.headerItemsOrder.length > 0) {
          setHeaderItemsOrderState(normalizeHeaderItemsOrder(remoteConfig.headerItemsOrder));
        }
      }
    });

    return () => {
      isSubscribed = false;
      unsub();
    };
  }, []);

  const reorderButtons = useCallback((newOrder: string[]) => {
    setGlobalSettings((prev) => ({
      ...prev,
      buttonOrder: newOrder,
    }));
  }, []);

  const resetButtonOrder = useCallback(() => {
    setGlobalSettings((prev) => ({
      ...prev,
      buttonOrder: [...HARDCODED_DEFAULT_GLOBAL_SETTINGS.buttonOrder],
    }));
  }, []);

  const saveToQuickSlot = useCallback((slotId: string, customName?: string): boolean => {
    try {
      const now = new Date();
      const timeStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const payload = JSON.stringify({
        customConfigs,
        globalSettings,
      });

      const updated = quickSlots.map((slot) => {
        if (slot.id === slotId) {
          return {
            ...slot,
            name: customName || slot.name,
            timestamp: timeStr,
            data: payload,
          };
        }
        return slot;
      });

      setQuickSlots(updated);

      // Async save configuration to Firestore Database
      const backup = buildBackupPayload(customConfigs, globalSettings, buttonOrder, updated);
      saveDatabaseConfig(backup).catch((e) => console.warn("Cloud slot sync err:", e));

      return true;
    } catch (e) {
      console.error("Failed to save quick slot", e);
      return false;
    }
  }, [customConfigs, globalSettings, quickSlots, buttonOrder, buildBackupPayload]);

  const loadFromQuickSlot = useCallback((slotId: string): boolean => {
    try {
      const slot = quickSlots.find((s) => s.id === slotId);
      if (!slot || !slot.data) return false;
      const parsed = JSON.parse(slot.data);
      if (parsed.customConfigs) {
        setCustomConfigs(parsed.customConfigs);
      }
      if (parsed.globalSettings) {
        setGlobalSettings(parsed.globalSettings);
      }
      return true;
    } catch (e) {
      console.error("Failed to load quick slot", e);
      return false;
    }
  }, [quickSlots]);

  const clearQuickSlot = useCallback((slotId: string) => {
    setQuickSlots((prev) =>
      prev.map((slot) => {
        if (slot.id === slotId) {
          return { ...slot, timestamp: undefined, data: undefined };
        }
        return slot;
      })
    );
  }, []);

  const updateButtonConfig = useCallback(
    (id: string, partial: Partial<ButtonCustomConfig>) => {
      setCustomConfigs((prev) => {
        const current = prev[id] || { id };
        const updated = {
          ...current,
          ...partial,
        };
        const next = {
          ...prev,
          [id]: updated,
        };

        // Instantly persist ALL button customizations (IBC and Control Panel) to permanent storage, IndexedDB, and Firestore
        try {
          remoteStore.setItem(STORAGE_KEY, JSON.stringify(next));
          remoteStore.setItem(DEFAULT_CUSTOMIZATIONS_KEY, JSON.stringify(next));
          remoteStore.setItem(DEFAULT_MARKER_KEY, "true");
          setHasUserDefault(true);
          saveStoredJson("button_customizations_user_default", next).catch(console.warn);

          // If logo is modified, instantly persist to dedicated local storage and Firestore documents
          if (id === "header_logo" || id === "logo") {
            remoteStore.setItem(HEADER_LOGO_STORAGE_KEY, JSON.stringify(updated));
            saveAppStateToDatabase("header_logo_custom_config", updated).catch(console.warn);
            if (typeof updated.customIconData === "string" && updated.customIconData.startsWith("data:image/")) {
              saveAppStateToDatabase("img_btn_icon_header_logo", updated.customIconData).catch(console.warn);
            }
          }
          if (typeof updated.customIconData === "string" && updated.customIconData.startsWith("data:image/")) {
            saveAppStateToDatabase(`img_btn_icon_${id}`, updated.customIconData).catch(console.warn);
          }
        } catch (e) {
          console.warn(`Error persisting config for button ${id}:`, e);
        }

        return next;
      });
    },
    []
  );

  const resetButtonConfig = useCallback((id: string) => {
    setCustomConfigs((prev) => {
      const copy = { ...prev };
      if (HARDCODED_DEFAULT_CUSTOM_CONFIGS[id]) {
        copy[id] = { ...HARDCODED_DEFAULT_CUSTOM_CONFIGS[id] };
      } else {
        delete copy[id];
      }
      try {
        if (id === "header_logo" || id === "logo") {
          const defaultLogo = HARDCODED_DEFAULT_CUSTOM_CONFIGS.header_logo || {
            id: "header_logo",
            label: "SeqCarver 26 oct",
            iconName: "Zap",
            hideText: false,
            hideIcon: false,
            accentColor: "",
          };
          copy.header_logo = { ...defaultLogo };
          remoteStore.setItem(HEADER_LOGO_STORAGE_KEY, JSON.stringify(defaultLogo));
          saveAppStateToDatabase("header_logo_custom_config", defaultLogo).catch(console.warn);
        }
        remoteStore.setItem(STORAGE_KEY, JSON.stringify(copy));
        remoteStore.setItem(DEFAULT_CUSTOMIZATIONS_KEY, JSON.stringify(copy));
        saveStoredJson("button_customizations_user_default", copy).catch(console.warn);
      } catch {}
      return copy;
    });
  }, []);

  /**
   * Save Current as Default:
   * Saves directly to Firestore cloud database so all sessions load it,
   * with local storage fallback.
   */
  const saveCurrentAsDefault = useCallback(
    (
      immediateConfigs?: Record<string, ButtonCustomConfig>,
      immediateSettings?: GlobalCustomizationSettings,
      extraPayload?: Record<string, any>
    ) => {
      try {
        const configsToSave = immediateConfigs || customConfigsRef.current || customConfigs;
        const settingsToSave = immediateSettings || globalSettingsRef.current || globalSettings;
        const currentButtonOrder = buttonOrderRef.current || buttonOrder;
        const currentQuickSlots = quickSlotsRef.current || quickSlots;

        // 1. Direct Save to Firestore Cloud Database
        setIsDatabaseSyncing(true);
        const backup = {
          ...buildBackupPayload(configsToSave, settingsToSave, currentButtonOrder, currentQuickSlots),
          ...(extraPayload || {}),
        };
        saveDatabaseConfig(backup)
          .then(() => {
            setLastDatabaseSyncTime(new Date().toLocaleTimeString());
          })
          .catch((err) => {
            console.error("Failed to save master config to Firestore database:", err);
          })
          .finally(() => {
            setIsDatabaseSyncing(false);
          });

        // 2. Local Cache
        remoteStore.setItem(STORAGE_KEY, JSON.stringify(configsToSave));
        remoteStore.setItem(SETTINGS_KEY, JSON.stringify(settingsToSave));
        remoteStore.setItem(DEFAULT_CUSTOMIZATIONS_KEY, JSON.stringify(configsToSave));
        remoteStore.setItem(DEFAULT_SETTINGS_KEY, JSON.stringify(settingsToSave));
        remoteStore.setItem(DEFAULT_MARKER_KEY, "true");
        setHasUserDefault(true);
        return true;
      } catch (e) {
        console.error("Failed to save default customizations", e);
        return false;
      }
    },
    [buildBackupPayload]
  );

  const restoreFullDefaultsFromDatabase = useCallback(
    async (): Promise<{ success: boolean; count: number; message: string }> => {
      try {
        setIsDatabaseSyncing(true);
        const remoteConfig = await getDatabaseConfig();
        if (remoteConfig) {
          if (remoteConfig.customConfigs && typeof remoteConfig.customConfigs === "object") {
            setCustomConfigs({
              ...HARDCODED_DEFAULT_CUSTOM_CONFIGS,
              ...remoteConfig.customConfigs,
            });
            try {
              remoteStore.setItem(DEFAULT_CUSTOMIZATIONS_KEY, JSON.stringify(remoteConfig.customConfigs));
            } catch {}
          }
          if (remoteConfig.globalSettings && typeof remoteConfig.globalSettings === "object") {
            const mergedSettings: GlobalCustomizationSettings = {
              ...DEFAULT_SETTINGS,
              ...remoteConfig.globalSettings,
            };
            if (remoteConfig.buttonOrder && Array.isArray(remoteConfig.buttonOrder)) {
              mergedSettings.buttonOrder = remoteConfig.buttonOrder;
            }
            setGlobalSettings(mergedSettings);
            try {
              remoteStore.setItem(DEFAULT_SETTINGS_KEY, JSON.stringify(mergedSettings));
              remoteStore.setItem(SETTINGS_KEY, JSON.stringify(mergedSettings));
            } catch {}
          }
          if (remoteConfig.quickSlots && Array.isArray(remoteConfig.quickSlots)) {
            setQuickSlots(remoteConfig.quickSlots);
            try {
              remoteStore.setItem(QUICK_SLOTS_KEY, JSON.stringify(remoteConfig.quickSlots));
            } catch {}
          }
          setIsDatabaseConnected(true);
          setLastDatabaseSyncTime(new Date().toLocaleTimeString());
          const count = Object.keys(remoteConfig.customConfigs || {}).length;
          return {
            success: true,
            count,
            message: `✓ Successfully restored full defaults (${count} button configs & layout) from Firestore database!`,
          };
        }
        return {
          success: false,
          count: 0,
          message: "No configuration document found in Firestore database.",
        };
      } catch (err: any) {
        console.error("Error restoring full defaults from DB:", err);
        return {
          success: false,
          count: 0,
          message: `Failed to restore defaults from DB: ${err?.message || "Database error"}`,
        };
      } finally {
        setIsDatabaseSyncing(false);
      }
    },
    []
  );

  const restoreAllFromSavedSetup = useCallback((): { success: boolean; count: number; message: string } => {
    try {
      // Asynchronously restore full defaults directly from Firestore database
      restoreFullDefaultsFromDatabase().catch((e) => {
        console.warn("restoreFullDefaultsFromDatabase background error:", e);
      });

      const userCustom = remoteStore.getItem(DEFAULT_CUSTOMIZATIONS_KEY);
      const userSettings = remoteStore.getItem(DEFAULT_SETTINGS_KEY);
      if (userCustom) {
        const parsedCustom = JSON.parse(userCustom);
        setCustomConfigs({
          ...HARDCODED_DEFAULT_CUSTOM_CONFIGS,
          ...parsedCustom,
        });
        if (userSettings) {
          setGlobalSettings({
            ...DEFAULT_SETTINGS,
            ...JSON.parse(userSettings),
          });
        }
        setHasUserDefault(true);
        const count = Object.keys(parsedCustom).length;
        return {
          success: true,
          count,
          message: `Restoring full defaults from cloud database (${count} button customizations)...`,
        };
      }

      setCustomConfigs({ ...HARDCODED_DEFAULT_CUSTOM_CONFIGS });
      setGlobalSettings({ ...HARDCODED_DEFAULT_GLOBAL_SETTINGS });
      return {
        success: true,
        count: Object.keys(HARDCODED_DEFAULT_CUSTOM_CONFIGS).length,
        message: "Restored baseline configuration layout of icons, labels, and settings from database!",
      };
    } catch (e: any) {
      console.error("Failed to restore saved setup", e);
      return {
        success: false,
        count: 0,
        message: `Failed to restore saved setup: ${e?.message || "Storage error"}`,
      };
    }
  }, [restoreFullDefaultsFromDatabase]);

  const resetToUserDefault = useCallback(() => {
    let permanentLogo: ButtonCustomConfig | null = null;
    try {
      const savedLogo = remoteStore.getItem(HEADER_LOGO_STORAGE_KEY);
      if (savedLogo) permanentLogo = JSON.parse(savedLogo);
    } catch {}

    try {
      const userCustom = remoteStore.getItem(DEFAULT_CUSTOMIZATIONS_KEY);
      const userSettings = remoteStore.getItem(DEFAULT_SETTINGS_KEY);
      if (userCustom) {
        setCustomConfigs({
          ...HARDCODED_DEFAULT_CUSTOM_CONFIGS,
          ...JSON.parse(userCustom),
          ...(permanentLogo ? { header_logo: permanentLogo } : {}),
        });
        if (userSettings) {
          setGlobalSettings({
            ...HARDCODED_DEFAULT_GLOBAL_SETTINGS,
            ...JSON.parse(userSettings),
          });
        }
        return;
      }
    } catch {}
    setCustomConfigs({
      ...HARDCODED_DEFAULT_CUSTOM_CONFIGS,
      ...(permanentLogo ? { header_logo: permanentLogo } : {}),
    });
    setGlobalSettings({ ...HARDCODED_DEFAULT_GLOBAL_SETTINGS });
  }, []);

  const resetToFactoryDefaults = useCallback(() => {
    let permanentLogo: ButtonCustomConfig | null = null;
    try {
      const savedLogo = remoteStore.getItem(HEADER_LOGO_STORAGE_KEY);
      if (savedLogo) permanentLogo = JSON.parse(savedLogo);
    } catch {}

    const freshConfigs = {
      ...HARDCODED_DEFAULT_CUSTOM_CONFIGS,
      ...(permanentLogo ? { header_logo: permanentLogo } : {}),
    };

    setCustomConfigs(freshConfigs);
    setGlobalSettings({ ...HARDCODED_DEFAULT_GLOBAL_SETTINGS });
    const backup = buildBackupPayload(
      freshConfigs,
      HARDCODED_DEFAULT_GLOBAL_SETTINGS,
      HARDCODED_DEFAULT_GLOBAL_SETTINGS.buttonOrder,
      DEFAULT_QUICK_SLOTS
    );
    saveDatabaseConfig(backup).catch(() => {});
    setHasUserDefault(true);
  }, [buildBackupPayload]);

  const clearUserDefault = useCallback(() => {
    let permanentLogo: ButtonCustomConfig | null = null;
    try {
      const savedLogo = remoteStore.getItem(HEADER_LOGO_STORAGE_KEY);
      if (savedLogo) permanentLogo = JSON.parse(savedLogo);
    } catch {}

    setCustomConfigs({
      ...HARDCODED_DEFAULT_CUSTOM_CONFIGS,
      ...(permanentLogo ? { header_logo: permanentLogo } : {}),
    });
    setGlobalSettings({ ...HARDCODED_DEFAULT_GLOBAL_SETTINGS });
  }, []);

  const resetAllConfigs = useCallback(() => {
    resetToUserDefault();
  }, [resetToUserDefault]);

  const toggleGlobalZeroTextMode = useCallback(() => {
    setGlobalSettings((prev) => ({
      ...prev,
      globalZeroTextMode: !prev.globalZeroTextMode,
    }));
  }, []);

  const toggleButtonZeroText = useCallback((id: string) => {
    setCustomConfigs((prev) => {
      const current = prev[id];
      const settings = globalSettingsRef.current;
      let effectiveHidden: boolean;
      if (current?.hideIcon) {
        effectiveHidden = false;
      } else if (current && typeof current.hideText === "boolean") {
        effectiveHidden = current.hideText;
      } else {
        const definition = BUTTON_DEFINITIONS_MAP.get(id);
        if (definition && definition.supportsZeroText === false) {
          effectiveHidden = false;
        } else if (definition?.category && settings?.groupSettings?.[definition.category]) {
          const rule = settings.groupSettings[definition.category];
          effectiveHidden =
            rule === "icon_only"
              ? true
              : rule === "icon_and_text"
              ? false
              : Boolean(settings?.globalZeroTextMode);
        } else {
          effectiveHidden = Boolean(settings?.globalZeroTextMode);
        }
      }

      const nextHideText = !effectiveHidden;
      const updated: ButtonCustomConfig = {
        ...(current || { id }),
        hideText: nextHideText,
      };
      const next = {
        ...prev,
        [id]: updated,
      };
      try {
        remoteStore.setItem(STORAGE_KEY, JSON.stringify(next));
        remoteStore.setItem(DEFAULT_CUSTOMIZATIONS_KEY, JSON.stringify(next));
        remoteStore.setItem(DEFAULT_MARKER_KEY, "true");
        saveStoredJson("button_customizations_user_default", next).catch(console.warn);
        if (id === "header_logo" || id === "logo") {
          remoteStore.setItem(HEADER_LOGO_STORAGE_KEY, JSON.stringify(updated));
          saveAppStateToDatabase("header_logo_custom_config", updated).catch(console.warn);
        }
      } catch {}
      return next;
    });
  }, []);

  const toggleButtonHideIcon = useCallback((id: string) => {
    setCustomConfigs((prev) => {
      const current = prev[id];
      const currentlyHiddenIcon = current?.hideIcon ?? false;
      const updated: ButtonCustomConfig = {
        ...(current || { id }),
        hideIcon: !currentlyHiddenIcon,
      };
      const next = {
        ...prev,
        [id]: updated,
      };
      try {
        remoteStore.setItem(STORAGE_KEY, JSON.stringify(next));
        remoteStore.setItem(DEFAULT_CUSTOMIZATIONS_KEY, JSON.stringify(next));
        remoteStore.setItem(DEFAULT_MARKER_KEY, "true");
        saveStoredJson("button_customizations_user_default", next).catch(console.warn);
        if (id === "header_logo" || id === "logo") {
          remoteStore.setItem(HEADER_LOGO_STORAGE_KEY, JSON.stringify(updated));
          saveAppStateToDatabase("header_logo_custom_config", updated).catch(console.warn);
        }
      } catch {}
      return next;
    });
  }, []);

  const toggleCropDragHandles = useCallback(() => {
    setGlobalSettings((prev) => ({
      ...prev,
      showCropDragHandles: !prev.showCropDragHandles,
    }));
  }, []);

  const setCropDragHandles = useCallback((show: boolean) => {
    setGlobalSettings((prev) => ({
      ...prev,
      showCropDragHandles: show,
    }));
  }, []);

  const toggleAniPlayerDragHandles = useCallback(() => {
    setGlobalSettings((prev) => ({
      ...prev,
      showAniPlayerDragHandles: !prev.showAniPlayerDragHandles,
    }));
  }, []);

  const setAniPlayerDragHandles = useCallback((show: boolean) => {
    setGlobalSettings((prev) => ({
      ...prev,
      showAniPlayerDragHandles: show,
    }));
  }, []);

  const setStripBackground = useCallback((color: string) => {
    setGlobalSettings((prev) => ({
      ...prev,
      stripBackground: color,
    }));
  }, []);

  const setStripImageBackground = useCallback((color: string) => {
    setGlobalSettings((prev) => ({
      ...prev,
      stripImageBackground: color,
    }));
  }, []);

  const setStripPanelBackground = useCallback((color: string) => {
    setGlobalSettings((prev) => ({
      ...prev,
      stripPanelBackground: color,
    }));
  }, []);

  const toggleSlotHeaders = useCallback(() => {
    setGlobalSettings((prev) => ({
      ...prev,
      showSlotHeaders: prev.showSlotHeaders === undefined ? false : !prev.showSlotHeaders,
    }));
  }, []);

  const setSlotHeaders = useCallback((show: boolean) => {
    setGlobalSettings((prev) => ({
      ...prev,
      showSlotHeaders: show,
    }));
  }, []);

  const toggleTopPanelButtons = useCallback(() => {
    setGlobalSettings((prev) => ({
      ...prev,
      showTopPanelButtons: prev.showTopPanelButtons === undefined ? false : !prev.showTopPanelButtons,
    }));
  }, []);

  const setTopPanelButtons = useCallback((show: boolean) => {
    setGlobalSettings((prev) => ({
      ...prev,
      showTopPanelButtons: show,
    }));
  }, []);

  const setGroupRule = useCallback((category: ButtonCategory | string, rule: GroupRuleMode) => {
    setGlobalSettings((prev) => ({
      ...prev,
      groupSettings: {
        ...(prev.groupSettings || {}),
        [category]: rule,
      },
    }));
  }, []);

  const getGroupRule = useCallback(
    (category: ButtonCategory | string): GroupRuleMode => {
      return globalSettings.groupSettings?.[category] || "inherit";
    },
    [globalSettings.groupSettings]
  );

  const getConfig = useCallback(
    (id: string): ButtonCustomConfig | undefined => {
      if (id === "label_storyboard_matrix" && !customConfigs[id] && customConfigs["storyboard_matrix_title"]) {
        return customConfigs["storyboard_matrix_title"];
      }
      if (id === "storyboard_matrix_title" && !customConfigs[id] && customConfigs["label_storyboard_matrix"]) {
        return customConfigs["label_storyboard_matrix"];
      }
      return customConfigs[id];
    },
    [customConfigs]
  );

  const getDefinition = useCallback((id: string): ButtonDefinition | undefined => {
    return BUTTON_DEFINITIONS_MAP.get(id);
  }, []);

  const isZeroText = useCallback(
    (id: string): boolean => {
      const config = customConfigs[id];
      if (config?.hideIcon) {
        return false;
      }
      if (config && typeof config.hideText === "boolean") {
        return config.hideText;
      }
      const definition = BUTTON_DEFINITIONS_MAP.get(id);
      if (definition && definition.supportsZeroText === false) {
        return false;
      }
      if (definition?.category) {
        const groupRule = globalSettings.groupSettings?.[definition.category];
        if (groupRule === "icon_only") {
          return true;
        }
        if (groupRule === "icon_and_text") {
          return false;
        }
      }
      return globalSettings.globalZeroTextMode;
    },
    [customConfigs, globalSettings.globalZeroTextMode, globalSettings.groupSettings]
  );

  const isTextOnly = useCallback(
    (id: string): boolean => {
      return customConfigs[id]?.hideIcon === true;
    },
    [customConfigs]
  );

  const getButtonLabel = useCallback(
    (id: string, defaultLabel: string): string => {
      const config = customConfigs[id];
      // Explicit user customization (including clearing to empty string "") always wins
      if (config && typeof config.label === "string") {
        return config.label;
      }
      if (id === "front_page_ad_hide_panel_bar") {
        return "";
      }
      if (id === "front_page_ad_tilelink_modal") {
        return "panel edit";
      }
      if (id === "front_page_ad_toggle_links") {
        return "on/off";
      }
      return defaultLabel;
    },
    [customConfigs]
  );

  const openContextMenuForButton = useCallback((e: React.MouseEvent, buttonId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 260;
    const menuHeight = 320;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

    setContextMenuState({
      isOpen: true,
      x: Math.max(10, x),
      y: Math.max(10, y),
      buttonId,
    });
  }, []);

  const openMiniCustomizer = useCallback((buttonId?: string, x?: number, y?: number) => {
    const targetId = buttonId || "header_studio_palette";
    const targetX = x ?? Math.max(10, Math.round(window.innerWidth / 2 - 150));
    const targetY = y ?? Math.max(10, Math.round(window.innerHeight / 2 - 260));
    setContextMenuState({
      isOpen: true,
      x: targetX,
      y: targetY,
      buttonId: targetId,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenuState((prev) => ({ ...prev, isOpen: false, buttonId: null }));
  }, []);

  const openStudioModal = useCallback((buttonId?: string, multiIds?: string[]) => {
    const primaryId = buttonId || (multiIds && multiIds[0]) || null;
    setActiveStudioButtonId(primaryId);
    if (multiIds && multiIds.length > 0) {
      setInspectedElementIds(multiIds);
    } else if (primaryId) {
      setInspectedElementIds([primaryId]);
    } else {
      setInspectedElementIds([]);
    }
    setStudioInspectNonce((n) => n + 1);
    setIsStudioModalOpen(true);
    setContextMenuState((prev) => ({ ...prev, isOpen: false, buttonId: null }));
  }, []);

  const closeStudioModal = useCallback(() => {
    setIsStudioModalOpen(false);
    setActiveStudioButtonId(null);
    saveCurrentAsDefault();
  }, [saveCurrentAsDefault]);

  const openLiveCloudEditor = useCallback(() => {
    setIsLiveCloudEditorOpen(true);
  }, []);

  const closeLiveCloudEditor = useCallback(() => {
    setIsLiveCloudEditorOpen(false);
  }, []);

  const exportConfigs = useCallback((): string => {
    const payload = buildBackupPayload(customConfigs, globalSettings, buttonOrder, quickSlots);
    return JSON.stringify(payload, null, 2);
  }, [customConfigs, globalSettings, buttonOrder, quickSlots, buildBackupPayload]);

  const importConfigs = useCallback(
    (jsonString: string): { success: boolean; count: number; error?: string } => {
      try {
        const parsed = JSON.parse(jsonString);
        let configsToImport: Record<string, ButtonCustomConfig> = {};

        if (parsed.customConfigs && typeof parsed.customConfigs === "object") {
          configsToImport = parsed.customConfigs;
        } else if (parsed.allButtonStates && typeof parsed.allButtonStates === "object") {
          Object.values(parsed.allButtonStates).forEach((item: any) => {
            if (item && item.id) {
              const cfg: ButtonCustomConfig = { id: item.id };
              if (item.isCustomLabel && item.label) cfg.label = item.label;
              if (item.iconName && item.iconName !== item.defaultIconName) cfg.iconName = item.iconName;
              if (item.customIconType) cfg.customIconType = item.customIconType;
              if (item.customIconData) cfg.customIconData = item.customIconData;
              if (typeof item.hideText === "boolean") cfg.hideText = item.hideText;
              if (typeof item.hideIcon === "boolean") cfg.hideIcon = item.hideIcon;
              if (item.tooltip && item.tooltip !== item.defaultTooltip) cfg.customTooltip = item.tooltip;
              if (item.accentColor) cfg.accentColor = item.accentColor;
              if (Object.keys(cfg).length > 1) {
                configsToImport[item.id] = cfg;
              }
            }
          });
        } else if (typeof parsed === "object") {
          configsToImport = parsed;
        }

        const validKeys = Object.keys(configsToImport).filter(
          (k) => configsToImport[k] && typeof configsToImport[k] === "object"
        );
        setCustomConfigs(configsToImport);

        let newSettings = globalSettings;
        if (parsed.globalSettings) {
          newSettings = parsed.globalSettings;
          setGlobalSettings(parsed.globalSettings);
        } else if (parsed.buttonOrder && Array.isArray(parsed.buttonOrder)) {
          newSettings = { ...globalSettings, buttonOrder: parsed.buttonOrder };
          setGlobalSettings(newSettings);
        }

        if (parsed.globalSettings?.panelControlsOrder || parsed.panelControlsOrder) {
          const rawPanel = parsed.globalSettings?.panelControlsOrder || parsed.panelControlsOrder;
          if (Array.isArray(rawPanel)) {
            setPanelControlsOrder(rawPanel);
          }
        }
        if (parsed.globalSettings?.headerItemsOrder || parsed.headerItemsOrder) {
          const rawHeader = parsed.globalSettings?.headerItemsOrder || parsed.headerItemsOrder;
          if (Array.isArray(rawHeader)) {
            setHeaderItemsOrder(rawHeader);
          }
        }

        // Keep the dedicated logo cache in sync with the imported configuration too.
        if (configsToImport.header_logo) {
          remoteStore.setItem(HEADER_LOGO_STORAGE_KEY, JSON.stringify(configsToImport.header_logo));
          saveAppStateToDatabase("header_logo_custom_config", configsToImport.header_logo).catch(console.warn);
        } else {
          remoteStore.removeItem(HEADER_LOGO_STORAGE_KEY);
        }

        // Also push imported state to Firestore Database
        const backup = buildBackupPayload(configsToImport, newSettings, newSettings.buttonOrder || buttonOrder, quickSlots);
        // The order refs can still contain the previous render during this import.
        if (Array.isArray(newSettings.headerItemsOrder)) {
          backup.headerItemsOrder = newSettings.headerItemsOrder;
          backup.globalSettings.headerItemsOrder = newSettings.headerItemsOrder;
        }
        if (Array.isArray(newSettings.panelControlsOrder)) {
          backup.panelControlsOrder = newSettings.panelControlsOrder;
          backup.globalSettings.panelControlsOrder = newSettings.panelControlsOrder;
        }
        saveDatabaseConfig(backup).catch(() => {});

        return { success: true, count: validKeys.length };
      } catch (e: any) {
        console.error("Failed to import configs", e);
        return { success: false, count: 0, error: e?.message || "JSON parse error" };
      }
    },
    [globalSettings, buttonOrder, quickSlots, buildBackupPayload]
  );

  /**
   * Save configuration to database as custom named snapshot
   */
  const saveConfigurationToDatabase = useCallback(
    async (customName?: string): Promise<boolean> => {
      try {
        setIsDatabaseSyncing(true);
        const backup = buildBackupPayload(customConfigs, globalSettings, buttonOrder, quickSlots);
        const configId = customName
          ? customName.toLowerCase().replace(/[^a-z0-9_\-]/g, "_")
          : "main_config";
        await saveDatabaseConfig(backup, configId);
        setLastDatabaseSyncTime(new Date().toLocaleTimeString());
        return true;
      } catch (e) {
        console.error("Save config to database error:", e);
        return false;
      } finally {
        setIsDatabaseSyncing(false);
      }
    },
    [customConfigs, globalSettings, buttonOrder, quickSlots, buildBackupPayload]
  );

  /**
   * Update database configuration file on the fly
   */
  const updateDatabaseConfigOnTheFly = useCallback(
    async (newConfigJson: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const parsed = JSON.parse(newConfigJson);
        if (!parsed || typeof parsed !== "object") {
          return { success: false, error: "Invalid JSON object" };
        }
        setIsDatabaseSyncing(true);
        await saveDatabaseConfig(parsed, "main_config");
        importConfigs(newConfigJson);
        setLastDatabaseSyncTime(new Date().toLocaleTimeString());
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message || "Failed to parse or save" };
      } finally {
        setIsDatabaseSyncing(false);
      }
    },
    [importConfigs]
  );

  const reloadConfigurationFromDatabase = useCallback(async (): Promise<void> => {
    try {
      setIsDatabaseSyncing(true);
      const remote = await getDatabaseConfig();
      if (remote) {
        importConfigs(JSON.stringify(remote));
        setLastDatabaseSyncTime(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.warn("Reload configuration from database error:", e);
    } finally {
      setIsDatabaseSyncing(false);
    }
  }, [importConfigs]);

  const activeAiModel = globalSettings.activeAiModel || "models/gemini-3.8-flash";
  const setActiveAiModel = useCallback((model: string) => {
    setActiveGeminiModel(model);
    setGlobalSettings((prev) => ({
      ...prev,
      activeAiModel: model,
    }));
  }, []);

  const aiTemperature = globalSettings.aiTemperature ?? 0.7;
  const setAiTemperature = useCallback((temp: number) => {
    setGlobalSettings((prev) => ({
      ...prev,
      aiTemperature: temp,
    }));
  }, []);

  const globalFontSize: ButtonFontSize = globalSettings.globalFontSize || "normal";
  const setGlobalFontSize = useCallback((size: ButtonFontSize) => {
    setGlobalSettings((prev) => ({
      ...prev,
      globalFontSize: size,
    }));
  }, []);

  const globalIconSize: ButtonIconSize = globalSettings.globalIconSize || "normal";
  const setGlobalIconSize = useCallback((size: ButtonIconSize) => {
    setGlobalSettings((prev) => ({
      ...prev,
      globalIconSize: size,
    }));
  }, []);

  const recallAllDefaultsFromDatabase = useCallback(
    async (user?: User | null): Promise<void> => {
      try {
        setIsDatabaseSyncing(true);
        const remoteConfig = await getDatabaseConfig();
        if (remoteConfig) {
          if (remoteConfig.customConfigs && typeof remoteConfig.customConfigs === "object") {
            setCustomConfigs((prev) => {
              const next = {
                ...HARDCODED_DEFAULT_CUSTOM_CONFIGS,
                ...prev,
                ...remoteConfig.customConfigs,
              };
              if (remoteConfig.customConfigs.header_logo) {
                next.header_logo = { ...(next.header_logo || {}), ...remoteConfig.customConfigs.header_logo };
              }
              return next;
            });
            try {
              remoteStore.setItem(DEFAULT_CUSTOMIZATIONS_KEY, JSON.stringify(remoteConfig.customConfigs));
              remoteStore.setItem(STORAGE_KEY, JSON.stringify(remoteConfig.customConfigs));
              if (remoteConfig.customConfigs.header_logo) {
                remoteStore.setItem(HEADER_LOGO_STORAGE_KEY, JSON.stringify(remoteConfig.customConfigs.header_logo));
              }
            } catch {}
          }
          if (remoteConfig.globalSettings && typeof remoteConfig.globalSettings === "object") {
            setGlobalSettings((prev) => ({
              ...DEFAULT_SETTINGS,
              ...prev,
              ...remoteConfig.globalSettings,
            }));
            try {
              remoteStore.setItem(DEFAULT_SETTINGS_KEY, JSON.stringify(remoteConfig.globalSettings));
              remoteStore.setItem(SETTINGS_KEY, JSON.stringify(remoteConfig.globalSettings));
            } catch {}
          }
          if (remoteConfig.quickSlots && Array.isArray(remoteConfig.quickSlots)) {
            setQuickSlots(remoteConfig.quickSlots);
            try {
              remoteStore.setItem(QUICK_SLOTS_KEY, JSON.stringify(remoteConfig.quickSlots));
            } catch {}
          }
        }

        // Dedicated header logo retrieval
        const remoteLogo = await getAppStateFromDatabase<ButtonCustomConfig>("header_logo_custom_config").catch(() => null);
        if (remoteLogo && typeof remoteLogo === "object") {
          setCustomConfigs((prev) => ({
            ...prev,
            header_logo: { ...(prev.header_logo || {}), ...remoteLogo },
          }));
          try {
            remoteStore.setItem(HEADER_LOGO_STORAGE_KEY, JSON.stringify(remoteLogo));
          } catch {}
        }

        void remoteStore.flush();
        setIsDatabaseConnected(true);
        setLastDatabaseSyncTime(new Date().toLocaleTimeString());
        const userEmail = user?.email || auth.currentUser?.email || user?.displayName || "Google Account";
        setAuthNotice(`✓ Signed in as ${userEmail} — Cloud Database synced!`);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("seqcarver:auth-defaults-recalled", {
              detail: { user, remoteConfig },
            })
          );
        }
      } catch (err: any) {
        console.warn("Failed recalling defaults from database:", err);
      } finally {
        setIsDatabaseSyncing(false);
      }
    },
    []
  );

  // Subscribe to Auth state changes and automatically recall defaults from cloud database upon login
  const currentUserRef = useRef<User | null>(auth.currentUser);
  useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      const prevUser = currentUserRef.current;
      setCurrentUser(user);
      currentUserRef.current = user;
      setIsDatabaseConnected(isVerifiedCurrentUser(user));
      if (user && (!prevUser || prevUser.uid !== user.uid)) {
        void recallAllDefaultsFromDatabase(user);
      }
    });
    return () => unsubAuth();
  }, [recallAllDefaultsFromDatabase]);

  // IBC Inspector Mode State
  const [isIbcInspectorActive, setIsIbcInspectorActive] = useState<boolean>(false);
  const toggleIbcInspector = useCallback((override?: boolean) => {
    setIsIbcInspectorActive((prev) => (typeof override === "boolean" ? override : !prev));
  }, []);

  // Apply customizations live to any runtime-inspected non-IBC DOM elements
  useEffect(() => {
    if (typeof document === "undefined") return;
    const runtimeNodes = document.querySelectorAll<HTMLElement>("[data-ibc-runtime='true']");
    runtimeNodes.forEach((el) => {
      const id = el.getAttribute("data-ibc-id");
      if (!id) return;
      const cfg = customConfigs[id];
      el.style.display = cfg?.hidden ? "none" : "";
      el.style.backgroundColor = cfg?.backgroundColor || "";
      el.style.backgroundImage = cfg?.backgroundColor ? "none" : "";
      el.style.color = cfg?.textColor || "";
      el.style.borderColor = cfg?.borderColor || "";
      el.style.boxShadow = cfg?.accentColor ? `0 0 12px ${cfg.accentColor}` : "";
      el.style.fontFamily = cfg?.fontFamily && cfg.fontFamily !== "inherit" ? cfg.fontFamily : "";
      el.style.textTransform = cfg?.textTransform && cfg.textTransform !== "none" ? cfg.textTransform : "";
      el.style.letterSpacing = cfg?.letterSpacing || "";

      const weightMap: Record<string, string> = {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
      };
      el.style.fontWeight = cfg?.fontWeight ? weightMap[cfg.fontWeight] || "" : "";

      const sizeMap: Record<string, string> = {
        tiny: "9px",
        small: "10px",
        normal: "11px",
        medium: "12px",
        large: "14px",
      };
      el.style.fontSize = cfg?.fontSize ? sizeMap[cfg.fontSize] || "" : "";

      const padMap: Record<string, string> = {
        none: "0px",
        compact: "6px",
        normal: "12px",
        spacious: "20px",
      };
      el.style.padding = cfg?.customPadding || (cfg?.padding ? padMap[cfg.padding] || "" : "");

      const radMap: Record<string, string> = {
        none: "0px",
        sm: "6px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        full: "9999px",
      };
      el.style.borderRadius =
        cfg?.customCornerRadius || (cfg?.cornerRadius ? radMap[cfg.cornerRadius] || "" : "");

      if (cfg && (typeof cfg.label === "string" || typeof cfg.hideText === "boolean")) {
        const origLabel = el.getAttribute("data-ibc-orig-label") || "";
        const targetLabel = cfg.hideText ? "" : typeof cfg.label === "string" ? cfg.label : origLabel;
        const textSpan = Array.from(el.childNodes).find(
          (n) =>
            (n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) ||
            (n.nodeType === Node.ELEMENT_NODE &&
              (n as HTMLElement).tagName === "SPAN" &&
              (n as HTMLElement).children.length === 0)
        );
        if (textSpan) {
          textSpan.textContent = targetLabel;
        } else if (el.children.length === 0) {
          el.textContent = targetLabel;
        }
      }
    });
  }, [customConfigs]);

  const loginWithGoogle = useCallback(async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setAuthNotice("Opening Google Sign-In...");
    try {
      const user = await fbLoginWithGoogle();
      if (user) {
        setCurrentUser(user);
        currentUserRef.current = user;
        setIsDatabaseConnected(isVerifiedCurrentUser(user));
        await recallAllDefaultsFromDatabase(user);
        setAuthNotice(`✓ Signed in as ${user.email || user.displayName || "Google Account"}`);
      } else {
        const errText = fbGetLastAuthError();
        setAuthNotice(errText || "Google sign-in was cancelled.");
      }
    } catch (e: any) {
      setAuthNotice(`Google sign-in error: ${e?.message || "Please try again."}`);
    } finally {
      setIsLoggingIn(false);
    }
  }, [isLoggingIn, recallAllDefaultsFromDatabase]);

  const loginAsGuest = useCallback(async () => {
    await loginWithGoogle();
  }, [loginWithGoogle]);

  const loginAsDevUser = useCallback(async () => {
    await loginWithGoogle();
  }, [loginWithGoogle]);

  const logoutUser = useCallback(async () => {
    try {
      await fbLogoutUser();
      setCurrentUser(null);
      currentUserRef.current = null;
      setIsDatabaseConnected(false);
      setAuthNotice("Signed out of Cloud Database.");
    } catch (e) {
      console.warn("Logout notice:", e);
    }
  }, []);

  return (
    <ButtonCustomizationContext.Provider
      value={{
        customConfigs,
        globalSettings,
        hasUserDefault,
        saveCurrentAsDefault,
        restoreAllFromSavedSetup,
        restoreFullDefaultsFromDatabase,
        resetToUserDefault,
        resetToFactoryDefaults,
        clearUserDefault,
        updateButtonConfig,
        resetButtonConfig,
        resetAllConfigs,
        toggleGlobalZeroTextMode,
        toggleButtonZeroText,
        showCropDragHandles: globalSettings.showCropDragHandles ?? false,
        showAniPlayerDragHandles: globalSettings.showAniPlayerDragHandles ?? false,
        toggleCropDragHandles,
        setCropDragHandles,
        toggleAniPlayerDragHandles,
        setAniPlayerDragHandles,
        stripBackground: globalSettings.stripBackground ?? "#000000",
        setStripBackground,
        stripImageBackground: globalSettings.stripImageBackground ?? "#000000",
        setStripImageBackground,
        stripPanelBackground: globalSettings.stripPanelBackground ?? "#000000",
        setStripPanelBackground,
        showSlotHeaders: globalSettings.showSlotHeaders ?? true,
        toggleSlotHeaders,
        setSlotHeaders,
        showTopPanelButtons: globalSettings.showTopPanelButtons ?? true,
        toggleTopPanelButtons,
        setTopPanelButtons,
        setGroupRule,
        getGroupRule,
        buttonOrder,
        reorderButtons,
        resetButtonOrder,
        panelControlsOrder,
        setPanelControlsOrder,
        resetPanelControlsOrder,
        headerItemsOrder,
        setHeaderItemsOrder,
        resetHeaderItemsOrder,
        quickSlots,
        saveToQuickSlot,
        loadFromQuickSlot,
        clearQuickSlot,
        importConfigs,
        exportConfigs,
        getConfig,
        getDefinition,
        isZeroText,
        isTextOnly,
        toggleButtonHideIcon,
        getButtonLabel,
        openContextMenuForButton,
        openMiniCustomizer,
        closeContextMenu,
        contextMenuState,
        isStudioModalOpen,
        activeStudioButtonId,
        inspectedElementIds,
        studioInspectNonce,
        openStudioModal,
        closeStudioModal,
        // AI Model Settings in IBC
        activeAiModel,
        setActiveAiModel,
        aiTemperature,
        setAiTemperature,
        // Font Size Settings in IBC
        globalFontSize,
        setGlobalFontSize,
        // Icon Size Settings in IBC
        globalIconSize,
        setGlobalIconSize,

        // Cloud Database Integration
        isDatabaseConnected,
        isDatabaseSyncing,
        lastDatabaseSyncTime,
        isLiveCloudEditorOpen,
        openLiveCloudEditor,
        closeLiveCloudEditor,
        currentUser,
        isLoggingIn,
        authNotice,
        setAuthNotice,
        loginWithGoogle,
        loginAsGuest,
        loginAsDevUser,
        logoutUser,
        saveConfigurationToDatabase,
        updateDatabaseConfigOnTheFly,
        reloadConfigurationFromDatabase,
        recallAllDefaultsFromDatabase,
        // IBC Inspector
        isIbcInspectorActive,
        setIsIbcInspectorActive,
        toggleIbcInspector,
      }}
    >
      {children}
    </ButtonCustomizationContext.Provider>
  );
}

export function useButtonCustomization() {
  const context = useContext(ButtonCustomizationContext);
  if (!context) {
    throw new Error(
      "useButtonCustomization must be used within a ButtonCustomizationProvider"
    );
  }
  return context;
}
