import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Database,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Code2,
  Layers,
  Sparkles,
  SlidersHorizontal,
  ShieldCheck,
  LogIn,
  LogOut,
  FolderArchive,
  History,
  FileJson,
  Eye,
  Zap,
  Palette,
  Disc,
} from "lucide-react";
import { cn } from "../utils/cn";
import { useButtonCustomization } from "../context/ButtonCustomizationContext";
import {
  saveDatabaseConfig,
  getDatabaseConfig,
  listDatabaseConfigs,
  MAIN_CONFIG_DOC_ID,
} from "../services/firebase";
import { USER_DEFAULT_EXPORT_JSON } from "../types/hardcodedDefaultConfig";
import { RadialColorPicker, type ColorTargetProperty } from "./RadialColorPicker";
import { BUTTON_DEFINITIONS, type ButtonCustomConfig } from "../types/buttonCustomization";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

interface CloudConfigEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CloudConfigEditorModal({
  isOpen,
  onClose,
}: CloudConfigEditorModalProps) {
  const {
    customConfigs,
    globalSettings,
    buttonOrder,
    quickSlots,
    exportConfigs,
    importConfigs,
    saveCurrentAsDefault,
    updateButtonConfig,
    isDatabaseConnected,
    isDatabaseSyncing,
    lastDatabaseSyncTime,
    currentUser,
    isLoggingIn,
    authNotice,
    setAuthNotice,
    loginWithGoogle,
    loginAsDevUser,
    loginAsGuest,
    logoutUser,
  } = useButtonCustomization();

  const [activeTab, setActiveTab] = useState<"editor" | "visual" | "styles" | "versions">("editor");
  const [jsonText, setJsonText] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [isUpdatingOnTheFly, setIsUpdatingOnTheFly] = useState(false);
  const [isFetchingFromCloud, setIsFetchingFromCloud] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedCloudConfigs, setSavedCloudConfigs] = useState<
    Array<{ id: string; name: string; updatedAt: string }>
  >([]);
  const [customVersionName, setCustomVersionName] = useState("");
  const [isSavingCustomVersion, setIsSavingCustomVersion] = useState(false);
  const [confirmingFactoryReset, setConfirmingFactoryReset] = useState(false);

  // In-panel Style Dial & Color Studio State
  const [selectedStyleCategory, setSelectedStyleCategory] = useState<string>("all");
  const [activeDialConfig, setActiveDialConfig] = useState<ButtonCustomConfig>({
    id: "cloud_config_dial_preview",
    backgroundColor: "#064e3b",
    textColor: "#6ee7b7",
    borderColor: "#10b981",
    accentColor: "#10b981",
  });
  const [panelThemeColor, setPanelThemeColor] = useState<string>("#10b981");
  const [panelThemeBorder, setPanelThemeBorder] = useState<string>("#1e293b");

  // Sync current config when modal opens or user auth state changes
  useEffect(() => {
    if (isOpen) {
      try {
        const exported = exportConfigs();
        setJsonText(exported);
        setParseError(null);
        refreshSavedConfigsList();
      } catch (e: any) {
        console.error("Failed to generate export config string", e);
      }
    }
  }, [isOpen, exportConfigs, currentUser?.uid]);

  const refreshSavedConfigsList = async () => {
    try {
      const list = await listDatabaseConfigs();
      setSavedCloudConfigs(list);
    } catch (e) {
      console.warn("Could not list database configs:", e);
    }
  };

  // Validate JSON on change
  const handleJsonChange = (value: string) => {
    setJsonText(value);
    try {
      JSON.parse(value);
      setParseError(null);
    } catch (e: any) {
      setParseError(e.message || "Invalid JSON syntax");
    }
  };

  // Format / Beautify JSON
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      setParseError(null);
      setActionFeedback({
        type: "info",
        message: "JSON formatted and beautified successfully.",
      });
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (e: any) {
      setParseError(e.message || "Cannot format: JSON is invalid");
    }
  };

  // Push / Update on the fly directly to Firestore Database
  const handleUpdateOnTheFly = async () => {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e: any) {
      setParseError(`Cannot push to database: ${e.message}`);
      return;
    }

    if (!parsed || typeof parsed !== "object") {
      setParseError("Invalid configuration object.");
      return;
    }

    if (!currentUser) {
      setActionFeedback({
        type: "info",
        message: "Sign in with Google first to save changes to your Cloud Firestore database.",
      });
      return;
    }

    setIsUpdatingOnTheFly(true);
    try {
      // 1. Save directly to master database document in Firestore
      await saveDatabaseConfig(parsed, MAIN_CONFIG_DOC_ID);

      // 2. Import into current application state
      importConfigs(jsonText);
      saveCurrentAsDefault(parsed.customConfigs, parsed.globalSettings);

      setActionFeedback({
        type: "success",
        message:
          "✓ Configuration file updated in database! Applied live on the fly.",
      });
      setTimeout(() => setActionFeedback(null), 4000);
      refreshSavedConfigsList();
    } catch (err: any) {
      console.error("Failed to update database config on the fly:", err);
      setActionFeedback({
        type: "error",
        message: `Failed to update database: ${err.message || "Network error"}`,
      });
    } finally {
      setIsUpdatingOnTheFly(false);
    }
  };

  // Pull latest from Firestore Database
  const handlePullFromDatabase = async () => {
    setIsFetchingFromCloud(true);
    try {
      const remote = await getDatabaseConfig();
      if (remote) {
        const formatted = JSON.stringify(remote, null, 2);
        setJsonText(formatted);
        setParseError(null);
        importConfigs(formatted);
        setActionFeedback({
          type: "success",
          message: "✓ Loaded latest configuration file from Firestore database!",
        });
        setTimeout(() => setActionFeedback(null), 3500);
      }
    } catch (err: any) {
      console.error("Failed to pull from database:", err);
      setActionFeedback({
        type: "error",
        message: `Failed to fetch from database: ${err.message || "Unknown error"}`,
      });
    } finally {
      setIsFetchingFromCloud(false);
    }
  };

  // Reset to permanent factory default in database
  const handleResetToFactoryInDB = async () => {
    if (!confirmingFactoryReset) {
      setConfirmingFactoryReset(true);
      setActionFeedback({
        type: "info",
        message: "Click Reset to Factory again within 5 seconds to confirm resetting your configuration.",
      });
      setTimeout(() => setConfirmingFactoryReset(false), 5000);
      return;
    }
    setConfirmingFactoryReset(false);

    setIsUpdatingOnTheFly(true);
    try {
      if (currentUser) {
        await saveDatabaseConfig(USER_DEFAULT_EXPORT_JSON, MAIN_CONFIG_DOC_ID);
      }
      const formatted = JSON.stringify(USER_DEFAULT_EXPORT_JSON, null, 2);
      setJsonText(formatted);
      setParseError(null);
      importConfigs(formatted);
      setActionFeedback({
        type: "success",
        message: currentUser
          ? "✓ Database configuration reset to factory baseline and applied live!"
          : "✓ Local configuration reset to factory baseline! Sign in with Google to save to cloud.",
      });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: `Reset failed: ${err.message}`,
      });
    } finally {
      setIsUpdatingOnTheFly(false);
    }
  };

  // Save as named custom cloud version
  const handleSaveNamedCloudVersion = async () => {
    const trimmed = customVersionName.trim();
    if (!trimmed) return;
    if (!currentUser) {
      setActionFeedback({
        type: "info",
        message: "Sign in with Google to save named versions to your Cloud Firestore database.",
      });
      return;
    }
    const sanitizedId = trimmed.toLowerCase().replace(/[^a-z0-9_\-]/g, "_");

    setIsSavingCustomVersion(true);
    try {
      const parsed = JSON.parse(jsonText);
      await saveDatabaseConfig(
        {
          ...parsed,
          versionName: trimmed,
        },
        sanitizedId
      );
      setCustomVersionName("");
      setActionFeedback({
        type: "success",
        message: `✓ Saved cloud version "${trimmed}" to database!`,
      });
      setTimeout(() => setActionFeedback(null), 3500);
      refreshSavedConfigsList();
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: `Failed to save custom version: ${err.message}`,
      });
    } finally {
      setIsSavingCustomVersion(false);
    }
  };

  // Load a named cloud version
  const handleLoadCloudVersion = async (configId: string) => {
    try {
      setIsFetchingFromCloud(true);
      const remote = await getDatabaseConfig(configId);
      if (remote) {
        const formatted = JSON.stringify(remote, null, 2);
        setJsonText(formatted);
        setParseError(null);
        importConfigs(formatted);
        setActionFeedback({
          type: "success",
          message: `✓ Loaded version "${configId}" from database and applied live!`,
        });
        setTimeout(() => setActionFeedback(null), 3500);
      }
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: `Failed to load version: ${err.message}`,
      });
    } finally {
      setIsFetchingFromCloud(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `seqcarver-cloud-config-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed:", e);
    }
  };

  // Apply style updates from the radial dial modal
  const handleUpdateStyleFromDial = (styleUpdates: Partial<ButtonCustomConfig>) => {
    setActiveDialConfig((prev) => ({ ...prev, ...styleUpdates }));

    if (selectedStyleCategory === "panel_theme") {
      if (styleUpdates.borderColor) setPanelThemeBorder(styleUpdates.borderColor);
      if (styleUpdates.accentColor) setPanelThemeColor(styleUpdates.accentColor);
      if (styleUpdates.backgroundColor) setPanelThemeColor(styleUpdates.backgroundColor);
      setActionFeedback({
        type: "success",
        message: "✓ Cloud Manager panel styling updated live with dial modal!",
      });
      setTimeout(() => setActionFeedback(null), 3000);
      return;
    }

    try {
      let parsed: any;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        parsed = { customConfigs: { ...customConfigs }, globalSettings: { ...globalSettings } };
      }
      if (!parsed.customConfigs) parsed.customConfigs = {};

      let targetIds: string[] = [];
      if (selectedStyleCategory === "all") {
        targetIds = BUTTON_DEFINITIONS.map((b) => b.id);
      } else {
        targetIds = BUTTON_DEFINITIONS.filter(
          (b) => b.category === selectedStyleCategory
        ).map((b) => b.id);
        if (targetIds.length === 0) {
          targetIds = BUTTON_DEFINITIONS.slice(0, 30).map((b) => b.id);
        }
      }

      targetIds.forEach((id) => {
        parsed.customConfigs[id] = {
          ...(parsed.customConfigs[id] || {}),
          ...styleUpdates,
        };
        updateButtonConfig(id, styleUpdates);
      });

      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      setParseError(null);
      setActionFeedback({
        type: "success",
        message: `✓ Dialed new styles applied to ${targetIds.length} button(s) live in config!`,
      });
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      console.error("Failed to update styles from dial:", err);
    }
  };

  const handleApplyPresetColorway = (preset: {
    label: string;
    bg: string;
    text: string;
    border: string;
    accent: string;
  }) => {
    handleUpdateStyleFromDial({
      backgroundColor: preset.bg,
      textColor: preset.text,
      borderColor: preset.border,
      accentColor: preset.accent,
    });
  };

  const configStats = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonText);
      return {
        valid: true,
        version: parsed.version || "3.0",
        appName: parsed.appName || "SeqCarver",
        customCount: Object.keys(parsed.customConfigs || {}).length,
        buttonOrderCount: (parsed.buttonOrder || parsed.globalSettings?.buttonOrder || []).length,
        zeroText: Boolean(parsed.globalSettings?.globalZeroTextMode),
        sectionsCovered: (parsed.sections || []).length || parsed.totalSectionsCovered || 19,
      };
    } catch {
      return {
        valid: false,
        version: "Unknown",
        appName: "Unknown",
        customCount: Object.keys(customConfigs).length,
        buttonOrderCount: buttonOrder.length,
        zeroText: globalSettings.globalZeroTextMode,
        sectionsCovered: 19,
      };
    }
  }, [jsonText, customConfigs, buttonOrder, globalSettings]);

  if (!isOpen) return null;

  return (
    <div
      data-ibc-ui="true"
      className="fixed inset-0 z-[100000] pointer-events-auto flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150 select-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          borderColor: panelThemeBorder,
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px ${panelThemeColor}22`,
        }}
        className="bg-[#090e1a] border rounded-3xl w-full max-w-5xl h-[88vh] max-h-[880px] flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150 relative"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 border-b border-[#1e293b] bg-[#020617]/95 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CustomizableLabel
                  labelId="cloud_config_editor_modal_item_28"
                  as="h2"
                  className="text-base font-black text-slate-100 uppercase tracking-wide"
                >
                    {() => (
                        <>
                          {uiText("components_cloud_config_editor_modal.h2.cloud_database_configuration_manager", "Cloud Database Configuration Manager")}
                        </>
                      )}
                </CustomizableLabel>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1",
                    currentUser
                      ? "bg-emerald-950 border-emerald-500/40 text-emerald-300"
                      : "bg-amber-950/70 border-amber-500/40 text-amber-300"
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      currentUser ? "bg-emerald-400" : "bg-amber-400"
                    )}
                  />
                  {currentUser
                    ? `Cloud Synced (${currentUser.email || currentUser.displayName || "Signed In"})`
                    : "Local Session (Sign in to sync Cloud DB)"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                  {uiText("components_cloud_config_editor_modal.span.target_configurations_main_config", "Target: configurations/main_config")}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {uiText("components_cloud_config_editor_modal.p.saved_in_persistent_cloud_database_modify_va", "Saved in persistent cloud database. Modify, validate, and broadcast live configuration updates on the fly.")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User Google Authentication Status */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-900 border border-emerald-600/40 px-3 py-1.5 rounded-xl text-xs shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt=""
                    className="w-4 h-4 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
                <span
                  className="text-emerald-300 font-semibold max-w-[180px] truncate"
                  title={currentUser.email || currentUser.displayName || ""}
                >
                  {currentUser.email || currentUser.displayName || "Signed In"}
                </span>
                <CustomizableButton
                  buttonId="cloud_config_editor_modal_btn_27"
                  defaultIcon={<LogOut className="w-3.5 h-3.5" />}
                  type="button"
onClick={logoutUser}
className="text-slate-400 hover:text-rose-400 ml-1 p-0.5 transition-colors cursor-pointer"
title={uiText("components_cloud_config_editor_modal.button.sign_out_of_database_session.title", "Sign out of database session")}
                />
              </div>
            ) : (
              <CustomizableButton
                buttonId="cloud_config_editor_modal_btn_26"
                defaultIcon={<LogIn className="w-3.5 h-3.5 text-emerald-400" />}
                type="button"
disabled={isLoggingIn}
onClick={() => {
                  loginWithGoogle().catch(() => {});
                }}
className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-pointer disabled:opacity-60"
title={uiText("components_cloud_config_editor_modal.button.sign_in_with_google_oauth.title", "Sign in with your Google account to sync with Cloud Firestore")}
              >
                  {() => (
                      <>
                        <span>{isLoggingIn ? "Signing in..." : "Sign in with Google"}</span>
                      </>
                    )}
              </CustomizableButton>
            )}

            <CustomizableButton
              buttonId="cloud_config_editor_modal_btn_25"
              defaultIcon={<X className="w-4 h-4" />}
              type="button"
onClick={onClose}
className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
title={uiText("components_cloud_config_editor_modal.button.close_modal.title", "Close modal")}
            />
          </div>
        </div>

        {/* Auth Notice Banner */}
        {authNotice && !actionFeedback && (
          <div className="px-4 py-2 text-xs font-bold border-b border-cyan-500/40 bg-cyan-950/80 text-cyan-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{authNotice}</span>
            </div>
            <CustomizableButton
              buttonId="cloud_config_editor_modal_btn_24"
              defaultIcon={<X className="w-3.5 h-3.5" />}
              type="button"
onClick={() => setAuthNotice(null)}
className="text-slate-400 hover:text-white cursor-pointer"
            />
          </div>
        )}

        {/* Action & Status Feedback Banner */}
        {actionFeedback && (
          <div
            className={cn(
              "px-4 py-2 text-xs font-bold border-b flex items-center justify-between shrink-0 animate-in fade-in duration-150",
              actionFeedback.type === "success" &&
                "bg-emerald-950/90 border-emerald-500/50 text-emerald-200",
              actionFeedback.type === "error" &&
                "bg-rose-950/90 border-rose-500/50 text-rose-200",
              actionFeedback.type === "info" &&
                "bg-cyan-950/90 border-cyan-500/50 text-cyan-200"
            )}
          >
            <div className="flex items-center gap-2">
              {actionFeedback.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {actionFeedback.type === "error" && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {actionFeedback.type === "info" && <Sparkles className="w-4 h-4 text-cyan-400" />}
              <span>{actionFeedback.message}</span>
            </div>
            <CustomizableButton
              buttonId="cloud_config_editor_modal_btn_23"
              defaultIcon={<X className="w-3.5 h-3.5" />}
              type="button"
onClick={() => setActionFeedback(null)}
className="text-slate-400 hover:text-white"
            />
          </div>
        )}

        {/* Navigation Tabs & Primary Actions Bar */}
        <div className="bg-[#020617] border-b border-[#1e293b] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <CustomizableButton
              buttonId="cloud_config_editor_modal_btn_22"
              defaultIcon={<Code2 className="w-3.5 h-3.5" />}
              type="button"
onClick={() => setActiveTab("editor")}
className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === "editor"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
                {() => (
                    <>
                      <span>{uiText("components_cloud_config_editor_modal.span.live_json_config_editor", "Live JSON Config Editor")}</span>
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="cloud_config_editor_modal_btn_21"
              defaultIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              type="button"
onClick={() => setActiveTab("visual")}
className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === "visual"
                  ? "bg-cyan-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
                {() => (
                    <>
                      <span>{uiText("components_cloud_config_editor_modal.span.visual_summary_and_toggles", "Visual Summary & Toggles")}</span>
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="cloud_config_editor_modal_btn_20"
              defaultIcon={<Palette className="w-3.5 h-3.5 text-pink-400" />}
              type="button"
onClick={() => setActiveTab("styles")}
className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === "styles"
                  ? "bg-pink-500 text-slate-950 shadow-sm font-black"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
                {() => (
                    <>
                      <span>{uiText("components_cloud_config_editor_modal.span.color_and_style_dial_studio", "Color & Style Dial Studio")}</span>
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="cloud_config_editor_modal_btn_19"
              defaultIcon={<History className="w-3.5 h-3.5" />}
              type="button"
onClick={() => setActiveTab("versions")}
className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === "versions"
                  ? "bg-purple-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
                {() => (
                    <>
                      <span>{uiText("components_cloud_config_editor_modal.span.database_versions", "Database Versions (")}{savedCloudConfigs.length})</span>
                    </>
                  )}
            </CustomizableButton>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct Dial Modal Launcher */}
            <RadialColorPicker
              currentConfig={activeDialConfig}
              onUpdateStyle={handleUpdateStyleFromDial}
              compactTrigger
              buttonLabel="Style Dial"
              buttonClassName="px-3.5 py-2 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-purple-950/50 active:scale-95"
            />

            <CustomizableButton
              buttonId="cloud_config_editor_modal_btn_18"
              defaultIcon={<CloudUpload className="w-4 h-4" />}
              type="button"
disabled={isUpdatingOnTheFly || Boolean(parseError)}
onClick={handleUpdateOnTheFly}
className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-950/40 active:scale-95"
title={uiText("components_cloud_config_editor_modal.button.push_changes_to_firestore_database_and_immed.title", "Push changes to Firestore database and immediately update running application on the fly")}
            >
                {() => (
                    <>
                      <span>{isUpdatingOnTheFly ? "Updating DB..." : "Update on the Fly (Push to DB)"}</span>
                    </>
                  )}
            </CustomizableButton>

            <CustomizableButton
              buttonId="cloud_config_editor_modal_btn_17"
              defaultIcon={<RefreshCw className={cn("w-3.5 h-3.5", isFetchingFromCloud && "animate-spin")} />}
              type="button"
disabled={isFetchingFromCloud}
onClick={handlePullFromDatabase}
className="px-3 py-2 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
title={uiText("components_cloud_config_editor_modal.button.fetch_latest_configuration_directly_from_fir.title", "Fetch latest configuration directly from Firestore database")}
            >
                {() => (
                    <>
                      <span>{uiText("components_cloud_config_editor_modal.span.pull_latest_from_db", "Pull Latest from DB")}</span>
                    </>
                  )}
            </CustomizableButton>

            <CustomizableButton
              buttonId="cloud_config_editor_modal_btn_16"
              defaultIcon={<Code2 className="w-3.5 h-3.5 text-purple-400" />}
              type="button"
onClick={handleFormatJson}
className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
title={uiText("components_cloud_config_editor_modal.button.format_json_structure.title", "Format JSON structure")}
            >
                {() => (
                    <>
                      <span>{uiText("components_cloud_config_editor_modal.span.format", "Format")}</span>
                    </>
                  )}
            </CustomizableButton>

            <CustomizableButton
              buttonId="cloud_config_editor_modal_btn_15"
              type="button"
onClick={handleCopy}
className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
title={uiText("components_cloud_config_editor_modal.button.copy_to_clipboard.title", "Copy to clipboard")}
            >
                {() => (
                    <>
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                    </>
                  )}
            </CustomizableButton>

            <CustomizableButton
              buttonId="cloud_config_editor_modal_btn_14"
              defaultIcon={<Download className="w-3.5 h-3.5" />}
              type="button"
onClick={handleDownload}
className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
title={uiText("components_cloud_config_editor_modal.button.download_json_file.title", "Download JSON file")}
            />
          </div>
        </div>

        {/* Tab 1: Live JSON Editor */}
        {activeTab === "editor" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#050811] p-3">
            {/* Parse error bar if JSON syntax is broken */}
            {parseError && (
              <div className="bg-rose-950/80 border border-rose-500/50 rounded-xl px-3 py-1.5 mb-2 text-rose-300 text-xs font-mono flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="truncate">{uiText("components_cloud_config_editor_modal.span.json_syntax_error", "JSON Syntax Error: ")}{parseError}</span>
              </div>
            )}

            <div className="flex-1 relative rounded-2xl border border-slate-800 bg-[#02050c] overflow-hidden flex flex-col">
              <textarea
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                spellCheck={false}
                className="w-full flex-1 p-4 bg-transparent text-emerald-300/90 font-mono text-[12px] leading-relaxed resize-none focus:outline-none selection:bg-emerald-500/30 overflow-auto"
                placeholder={uiText("components_cloud_config_editor_modal.textarea.paste_or_edit_application_configuration_json.placeholder", "Paste or edit application configuration JSON...")}
              />
            </div>

            {/* Bottom Status Ribbon */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-slate-300">
                  <span className={cn("w-2 h-2 rounded-full", parseError ? "bg-rose-500" : "bg-emerald-400")} />
                  {parseError ? "Schema Invalid" : "Valid JSON"}
                </span>
                <span>{uiText("components_cloud_config_editor_modal.span.configured_buttons", "Configured Buttons: ")}{configStats.customCount}</span>
                <span>{uiText("components_cloud_config_editor_modal.span.toolbar_order", "Toolbar Order: ")}{configStats.buttonOrderCount}{uiText("components_cloud_config_editor_modal.span.items", " items")}</span>
                <span>{uiText("components_cloud_config_editor_modal.span.zero_text_mode", "Zero-Text Mode: ")}{configStats.zeroText ? "ON" : "OFF"}</span>
              </div>

              <div className="flex items-center gap-2">
                <CustomizableButton
                  buttonId="cloud_config_editor_modal_btn_13"
                  type="button"
onClick={handleResetToFactoryInDB}
className="text-amber-400 hover:text-amber-300 underline cursor-pointer text-[11px]"
                >
                    {() => (
                        <>
                          {uiText("components_cloud_config_editor_modal.button.reset_db_config_to_factory", "Reset DB Config to Factory")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Visual Overview & Toggles */}
        {activeTab === "visual" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#020617] border border-[#1e293b] space-y-1">
                <span className="text-xs text-slate-400 font-semibold">{uiText("components_cloud_config_editor_modal.span.configured_buttons_2", "Configured Buttons")}</span>
                <div className="text-2xl font-black text-emerald-400">{configStats.customCount}</div>
                <p className="text-[11px] text-slate-500">{uiText("components_cloud_config_editor_modal.p.custom_labels_custom_icons_or_visibility_ove", "Custom labels, custom icons, or visibility overrides")}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#020617] border border-[#1e293b] space-y-1">
                <span className="text-xs text-slate-400 font-semibold">{uiText("components_cloud_config_editor_modal.span.global_zero_text_mode", "Global Zero-Text Mode")}</span>
                <div className="text-2xl font-black text-cyan-400">{configStats.zeroText ? "Enabled" : "Disabled"}</div>
                <p className="text-[11px] text-slate-500">{uiText("components_cloud_config_editor_modal.p.when_enabled_button_labels_are_cleanly_hidde", "When enabled, button labels are cleanly hidden")}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#020617] border border-[#1e293b] space-y-1">
                <span className="text-xs text-slate-400 font-semibold">{uiText("components_cloud_config_editor_modal.span.sections_covered", "Sections Covered")}</span>
                <div className="text-2xl font-black text-purple-400">{configStats.sectionsCovered}{uiText("components_cloud_config_editor_modal.div.sections", " Sections")}</div>
                <p className="text-[11px] text-slate-500">{uiText("components_cloud_config_editor_modal.p.header_crop_carve_storyboard_creative_studio", "Header, Crop, Carve, Storyboard, Creative Studio, etc.")}</p>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-cyan-950/30 border border-emerald-500/30 space-y-3">
              <CustomizableLabel
                labelId="cloud_config_editor_modal_item_12"
                defaultIcon={<Sparkles className="w-4 h-4 text-emerald-400" />}
                as="h3"
                className="text-sm font-bold text-slate-100 flex items-center gap-2"
              >
                  {() => (
                      <>
                        {uiText("components_cloud_config_editor_modal.h3.instant_on_the_fly_application", "Instant On-The-Fly Application")}
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-xs text-slate-300 leading-relaxed">
                {uiText("components_cloud_config_editor_modal.p.when_you_click", "When you click ")}<span className="text-emerald-300 font-bold">{uiText("components_cloud_config_editor_modal.span.update_on_the_fly_push_to_db", "Update on the Fly (Push to DB)")}</span>{uiText("components_cloud_config_editor_modal.p.the_master_configuration_file_in_firestore_i", ", the master configuration file in Firestore is instantly updated. All active browser tabs and sessions connected to the application will automatically reflect the updated configuration without requiring a page reload!")}
              </p>
              <div className="pt-1">
                <CustomizableButton
                  buttonId="cloud_config_editor_modal_btn_11"
                  defaultIcon={<CloudUpload className="w-4 h-4" />}
                  type="button"
onClick={handleUpdateOnTheFly}
className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                    {() => (
                        <>
                          <span>{uiText("components_cloud_config_editor_modal.span.push_current_app_state_to_database_now", "Push Current App State to Database Now")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Styles & Color Dial Studio */}
        {activeTab === "styles" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#040813]">
            {/* Studio Header Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-indigo-950/40 border border-pink-500/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-300">
                    <Disc className="w-5 h-5 animate-[spin_10s_linear_infinite]" />
                  </div>
                  <div>
                    <CustomizableLabel
                      labelId="cloud_config_editor_modal_item_10"
                      as="h3"
                      className="text-sm font-black text-slate-100 flex items-center gap-2"
                    >
                        {() => (
                            <>
                              <span>{uiText("components_cloud_config_editor_modal.span.interactive_radial_color_dial_and_style_stud", "Interactive Radial Color Dial & Style Studio")}</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-pink-950 border border-pink-500/40 text-pink-300">
                        {uiText("components_cloud_config_editor_modal.span.live_precision_tuner", "Live Precision Tuner")}
                      </span>
                            </>
                          )}
                    </CustomizableLabel>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {uiText("components_cloud_config_editor_modal.p.dial_colors_on_the_drawing_tool_radial_wheel", "Dial colors on the drawing-tool radial wheel, adjust brightness & alpha, and broadcast live configuration updates on the fly.")}
                    </p>
                  </div>
                </div>

                {/* Primary Dial Trigger */}
                <RadialColorPicker
                  currentConfig={activeDialConfig}
                  onUpdateStyle={handleUpdateStyleFromDial}
                  compactTrigger={false}
                  buttonLabel="Open Circular Dial Modal"
                  buttonClassName="px-4 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-400 hover:to-indigo-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-950/50 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                />
              </div>
            </div>

            {/* Target Scope Selection */}
            <div className="bg-[#020617] border border-[#1e293b] rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-pink-400" />
                  <span>{uiText("components_cloud_config_editor_modal.span.1_choose_customization_target", "1. Choose Customization Target:")}</span>
                </span>
                <span className="text-[11px] font-mono text-pink-300">
                  {uiText("components_cloud_config_editor_modal.span.target", "Target: ")}{selectedStyleCategory === "all" ? "All Buttons (700+)" : selectedStyleCategory}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: "All Buttons (Global)" },
                  { id: "header", label: "Header Toolbar" },
                  { id: "crop", label: "Crop Controls" },
                  { id: "carve", label: "Carve Tools" },
                  { id: "canvas", label: "Canvas Deck" },
                  { id: "storyboard", label: "Storyboard" },
                  { id: "modals", label: "Studio Modals" },
                  { id: "front_page_ad_panels", label: "Ad Panels" },
                  { id: "panel_theme", label: "This Cloud Panel (Theme)" },
                ].map((cat) => {
                  const isSelected = selectedStyleCategory === cat.id;
                  return (
                    <CustomizableButton
                      buttonId="cloud_config_editor_modal_btn_9"
                      key={cat.id}
type="button"
onClick={() => setSelectedStyleCategory(cat.id)}
className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                        isSelected
                          ? "bg-gradient-to-r from-pink-500 to-purple-500 text-slate-950 shadow-md font-black scale-105"
                          : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                      )}
                    >
                        {() => (
                            <>
                              <span>{cat.label}</span>
                            </>
                          )}
                    </CustomizableButton>
                  );
                })}
              </div>
            </div>

            {/* 4 Separate Channel Dial Launchers */}
            <div className="bg-[#020617] border border-[#1e293b] rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>{uiText("components_cloud_config_editor_modal.span.2_fine_tune_color_channels_via_dial_modal", "2. Fine-Tune Color Channels via Dial Modal:")}</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Background Channel */}
                <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{uiText("components_cloud_config_editor_modal.span.background", "Background")}</span>
                    <span
                      className="w-4 h-4 rounded border border-slate-700 inline-block shadow-inner"
                      style={{ backgroundColor: activeDialConfig.backgroundColor || "transparent" }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block truncate">
                    {activeDialConfig.backgroundColor || "transparent"}
                  </span>
                  <RadialColorPicker
                    currentConfig={activeDialConfig}
                    initialTarget="backgroundColor"
                    onUpdateStyle={handleUpdateStyleFromDial}
                    compactTrigger
                    buttonLabel="Dial Background"
                    buttonClassName="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  />
                </div>

                {/* Text Channel */}
                <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{uiText("components_cloud_config_editor_modal.span.text_icon", "Text / Icon")}</span>
                    <span
                      className="w-4 h-4 rounded border border-slate-700 inline-block shadow-inner"
                      style={{ backgroundColor: activeDialConfig.textColor || "#ffffff" }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block truncate">
                    {activeDialConfig.textColor || "#ffffff"}
                  </span>
                  <RadialColorPicker
                    currentConfig={activeDialConfig}
                    initialTarget="textColor"
                    onUpdateStyle={handleUpdateStyleFromDial}
                    compactTrigger
                    buttonLabel="Dial Text Color"
                    buttonClassName="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  />
                </div>

                {/* Border Channel */}
                <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{uiText("components_cloud_config_editor_modal.span.border", "Border")}</span>
                    <span
                      className="w-4 h-4 rounded border border-slate-700 inline-block shadow-inner"
                      style={{ backgroundColor: activeDialConfig.borderColor || "#10b981" }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block truncate">
                    {activeDialConfig.borderColor || "#10b981"}
                  </span>
                  <RadialColorPicker
                    currentConfig={activeDialConfig}
                    initialTarget="borderColor"
                    onUpdateStyle={handleUpdateStyleFromDial}
                    compactTrigger
                    buttonLabel="Dial Border Color"
                    buttonClassName="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  />
                </div>

                {/* Accent Channel */}
                <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{uiText("components_cloud_config_editor_modal.span.accent_glow", "Accent / Glow")}</span>
                    <span
                      className="w-4 h-4 rounded border border-slate-700 inline-block shadow-inner"
                      style={{ backgroundColor: activeDialConfig.accentColor || "#10b981" }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block truncate">
                    {activeDialConfig.accentColor || "#10b981"}
                  </span>
                  <RadialColorPicker
                    currentConfig={activeDialConfig}
                    initialTarget="accentColor"
                    onUpdateStyle={handleUpdateStyleFromDial}
                    compactTrigger
                    buttonLabel="Dial Accent Glow"
                    buttonClassName="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Quick 1-Click Style Colorway Presets */}
            <div className="bg-[#020617] border border-[#1e293b] rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{uiText("components_cloud_config_editor_modal.span.3_quick_1_click_colorway_presets", "3. Quick 1-Click Colorway Presets:")}</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Neon Cyan", bg: "#082f49", text: "#38bdf8", border: "#00f0ff", accent: "#00f0ff" },
                  { label: "Emerald Mint", bg: "#064e3b", text: "#6ee7b7", border: "#10b981", accent: "#10b981" },
                  { label: "Amber Sunset", bg: "#451a03", text: "#fcd34d", border: "#f59e0b", accent: "#f59e0b" },
                  { label: "Cyber Fuchsia", bg: "#4c0519", text: "#f472b6", border: "#ec4899", accent: "#ec4899" },
                  { label: "Royal Violet", bg: "#2e1065", text: "#c084fc", border: "#8b5cf6", accent: "#8b5cf6" },
                  { label: "Slate Minimal", bg: "#0f172a", text: "#e2e8f0", border: "#334155", accent: "#64748b" },
                  { label: "Clean Ghost", bg: "transparent", text: "#ffffff", border: "#475569", accent: "transparent" },
                  { label: "Vibrant Ruby", bg: "#4c0519", text: "#fda4af", border: "#f43f5e", accent: "#f43f5e" },
                ].map((preset) => (
                  <CustomizableButton
                    buttonId="cloud_config_editor_modal_btn_8"
                    key={preset.label}
type="button"
onClick={() => handleApplyPresetColorway(preset)}
style={{
                      backgroundColor: preset.bg,
                      color: preset.text,
                      borderColor: preset.border,
                    }}
className="p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer hover:scale-105 shadow-md flex items-center justify-between gap-2"
                  >
                      {() => (
                          <>
                            <span>{preset.label}</span>
                          <span
                      className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: preset.accent }}
                    />
                          </>
                        )}
                  </CustomizableButton>
                ))}
              </div>
            </div>

            {/* Live Interactive Preview Card & Push to DB */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold block">{uiText("components_cloud_config_editor_modal.span.live_element_preview", "Live Element Preview:")}</span>
                <div
                  style={{
                    backgroundColor: activeDialConfig.backgroundColor || "#064e3b",
                    color: activeDialConfig.textColor || "#6ee7b7",
                    borderColor: activeDialConfig.borderColor || "#10b981",
                  }}
                  className="px-4 py-2 rounded-xl border font-bold text-xs flex items-center gap-2 shadow-lg select-none"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{uiText("components_cloud_config_editor_modal.span.preview_button_styled_with_active_dial", "Preview Button Styled with Active Dial")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CustomizableButton
                  buttonId="cloud_config_editor_modal_btn_7"
                  defaultIcon={<CloudUpload className="w-4 h-4" />}
                  type="button"
disabled={isUpdatingOnTheFly}
onClick={handleUpdateOnTheFly}
className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95"
                >
                    {() => (
                        <>
                          <span>{isUpdatingOnTheFly ? "Updating DB..." : "Update on the Fly (Push to DB)"}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Database Versions & Named Profiles */}
        {activeTab === "versions" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Create new named version */}
            <div className="bg-[#020617] border border-[#1e293b] rounded-2xl p-4 space-y-3">
              <CustomizableLabel
                labelId="cloud_config_editor_modal_item_6"
                defaultIcon={<FolderArchive className="w-4 h-4 text-purple-400" />}
                as="h4"
                className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5"
              >
                  {() => (
                      <>
                        {uiText("components_cloud_config_editor_modal.h4.save_new_named_version_in_cloud_database", "Save New Named Version in Cloud Database")}
                      </>
                    )}
              </CustomizableLabel>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={uiText("components_cloud_config_editor_modal.input.e_g_compact_minimalist_client_presentation_d.placeholder", "e.g., compact-minimalist, client-presentation, dark-mode...")}
                  value={customVersionName}
                  onChange={(e) => setCustomVersionName(e.target.value)}
                  className="flex-1 bg-[#090e1a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
                <CustomizableButton
                  buttonId="cloud_config_editor_modal_btn_5"
                  defaultIcon={<CloudUpload className="w-3.5 h-3.5" />}
                  type="button"
disabled={!customVersionName.trim() || isSavingCustomVersion}
onClick={handleSaveNamedCloudVersion}
className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                    {() => (
                        <>
                          <span>{uiText("components_cloud_config_editor_modal.span.save_version_to_cloud", "Save Version to Cloud")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>

            {/* List of configurations in Firestore */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <CustomizableLabel
                  labelId="cloud_config_editor_modal_item_4"
                  as="h4"
                  className="text-xs font-bold text-slate-400 uppercase tracking-wide"
                >
                    {() => (
                        <>
                          {uiText("components_cloud_config_editor_modal.h4.saved_cloud_configurations_in_firestore", "Saved Cloud Configurations in Firestore")}
                        </>
                      )}
                </CustomizableLabel>
                <CustomizableButton
                  buttonId="cloud_config_editor_modal_btn_3"
                  defaultIcon={<RefreshCw className="w-3 h-3" />}
                  type="button"
onClick={refreshSavedConfigsList}
className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                    {() => (
                        <>
                          <span>{uiText("components_cloud_config_editor_modal.span.refresh_list", "Refresh List")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Master config card */}
                <div className="p-4 rounded-2xl bg-[#020617] border border-emerald-500/40 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-200">{uiText("components_cloud_config_editor_modal.span.main_config_master", "main_config (Master)")}</span>
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                        {uiText("components_cloud_config_editor_modal.span.active_master", "Active Master")}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                      {uiText("components_cloud_config_editor_modal.span.target_configurations_main_config_2", "Target: configurations/main_config")}
                    </span>
                  </div>
                  <CustomizableButton
                    buttonId="cloud_config_editor_modal_btn_2"
                    type="button"
onClick={handlePullFromDatabase}
className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
                  >
                      {() => (
                          <>
                            {uiText("components_cloud_config_editor_modal.button.load_into_app", "Load into App")}
                          </>
                        )}
                  </CustomizableButton>
                </div>

                {/* Custom configs */}
                {savedCloudConfigs
                  .filter((c) => c.id !== MAIN_CONFIG_DOC_ID)
                  .map((cfg) => (
                    <div
                      key={cfg.id}
                      className="p-4 rounded-2xl bg-[#020617] border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-200">{cfg.name || cfg.id}</div>
                        <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                          {uiText("components_cloud_config_editor_modal.span.id_configurations", "ID: configurations/")}{cfg.id}
                        </span>
                      </div>
                      <CustomizableButton
                        buttonId="cloud_config_editor_modal_btn_1"
                        type="button"
onClick={() => handleLoadCloudVersion(cfg.id)}
className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 font-bold rounded-xl text-xs cursor-pointer"
                      >
                          {() => (
                              <>
                                {uiText("components_cloud_config_editor_modal.button.load_into_app_2", "Load into App")}
                              </>
                            )}
                      </CustomizableButton>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
