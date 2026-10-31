import React, { useState, useEffect } from "react";
import {
  X,
  Link2,
  MousePointerClick,
  RotateCw,
  Upload,
  Sparkles,
  Trash2,
  ExternalLink,
  RefreshCw,
  Image as ImageIcon,
  Copy,
  LayoutGrid,
  Settings,
  HelpCircle
} from "lucide-react";
import { cn } from "../utils/cn";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export interface TileLinkConfig {
  url: string;
  target: string;
  hoverEffect: "none" | "spin" | "change-image";
  hoverImage?: string;
}

interface TileLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBoxId: number;
  configs: Record<number, TileLinkConfig>;
  onSaveAll: (configs: Record<number, TileLinkConfig>) => void;
  storyboardSlices: { name: string; url: string }[];
  boxImages: Record<number, string>;
  onUpdateBoxImage?: (boxId: number, imageUrl: string) => void;
}

export function TileLinkModal({
  isOpen,
  onClose,
  initialBoxId,
  configs,
  onSaveAll,
  storyboardSlices,
  boxImages,
  onUpdateBoxImage,
}: TileLinkModalProps) {
  const [allConfigs, setAllConfigs] = useState<Record<number, TileLinkConfig>>({});
  const [activeBoxId, setActiveBoxId] = useState<number>(1);
  const [dragOver, setDragOver] = useState<boolean>(false);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setAllConfigs({ ...configs });
      setActiveBoxId(initialBoxId || 1);
    }
  }, [isOpen, configs, initialBoxId]);

  if (!isOpen) return null;

  // Retrieve current active config
  const activeConfig = allConfigs[activeBoxId] || {
    url: "",
    target: "_blank",
    hoverEffect: "none",
    hoverImage: "",
  };

  const updateActiveConfig = (updates: Partial<TileLinkConfig>) => {
    setAllConfigs((prev) => {
      const current = prev[activeBoxId] || {
        url: "",
        target: "_blank",
        hoverEffect: "none",
        hoverImage: "",
      };
      return {
        ...prev,
        [activeBoxId]: {
          ...current,
          ...updates,
        },
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        updateActiveConfig({ hoverImage: reader.result?.toString() || "" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        updateActiveConfig({ hoverImage: reader.result?.toString() || "" });
      };
      reader.readAsDataURL(file);
    }
  };

  // Bulk Operations
  const handleApplyToAll = () => {
    const updated: Record<number, TileLinkConfig> = {};
    for (let i = 1; i <= 9; i++) {
      updated[i] = {
        url: activeConfig.url,
        target: activeConfig.target,
        hoverEffect: activeConfig.hoverEffect,
        hoverImage: activeConfig.hoverImage,
      };
    }
    setAllConfigs(updated);
  };

  const handleClearCurrent = () => {
    setAllConfigs((prev) => {
      const updated = { ...prev };
      delete updated[activeBoxId];
      return updated;
    });
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear link configurations for all 9 boxes?")) {
      setAllConfigs({});
    }
  };

  const handleSave = () => {
    // Sanitize configs: remove empty or none effects
    const sanitized: Record<number, TileLinkConfig> = {};
    Object.entries(allConfigs).forEach(([boxIdStr, config]) => {
      const bId = parseInt(boxIdStr, 10);
      if (config && (config.url || config.hoverEffect !== "none")) {
        sanitized[bId] = {
          url: config.url || "",
          target: config.target || "_blank",
          hoverEffect: config.hoverEffect || "none",
          hoverImage: config.hoverEffect === "change-image" ? config.hoverImage : undefined,
        };
      }
    });

    onSaveAll(sanitized);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 max-w-4xl w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <CustomizableLabel
                labelId="tile_link_modal_item_17"
                as="h3"
                className="text-base font-extrabold text-slate-100 flex items-center gap-2"
              >
                  {() => (
                      <>
                        <span>{uiText("components_tile_link_modal.span.master_box_redirect_and_hover_linker", "Master Box Redirect & Hover Linker")}</span>
                      <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                  {uiText("components_tile_link_modal.span.9_box_dashboard", "9-Box Dashboard")}
                </span>
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-xs text-slate-400">
                {uiText("components_tile_link_modal.p.configure_custom_redirect_destinations_and_h", "Configure custom redirect destinations and hover animations for all 9 boxes. Active when the layout is in Locked mode.")}
              </p>
            </div>
          </div>
          <CustomizableButton
            buttonId="tile_link_modal_btn_16"
            defaultIcon={<X className="w-5 h-5" />}
            type="button"
onClick={onClose}
className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          />
        </div>

        {/* Dashboard Content split columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch min-h-[380px]">
          
          {/* Left Column: Visual 3x3 Box Selector & Bulk Actions */}
          <div className="md:col-span-5 flex flex-col justify-between gap-4 bg-[#020617] p-4 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2.5 flex items-center gap-1">
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                {uiText("components_tile_link_modal.span.select_box_to_edit", "Select Box to Edit")}
              </span>

              {/* 3x3 Selector Grid */}
              <div className="grid grid-cols-3 gap-2.5 aspect-square max-w-[240px] mx-auto md:max-w-none">
                {Array.from({ length: 9 }).map((_, i) => {
                  const bId = i + 1;
                  const boxImg = boxImages[bId];
                  const boxCfg = allConfigs[bId];
                  const isConfigured = boxCfg && (boxCfg.url || boxCfg.hoverEffect !== "none");
                  const isActive = activeBoxId === bId;

                  return (
                    <CustomizableButton
                      buttonId="tile_link_modal_btn_15"
                      key={`selector-box-${bId}`}
type="button"
onClick={() => setActiveBoxId(bId)}
className={cn(
                        "relative flex flex-col items-center justify-between rounded-xl border overflow-hidden transition-all duration-150 cursor-pointer aspect-square p-1.5 group/tile",
                        isActive
                          ? "border-cyan-400 bg-cyan-950/30 ring-4 ring-cyan-500/25 shadow-lg shadow-cyan-950/40"
                          : isConfigured
                          ? "border-indigo-500/50 bg-indigo-950/20 hover:border-indigo-400 hover:bg-indigo-950/40"
                          : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90"
                      )}
                    >
                        {() => (
                            <>
                              {/* Box Image / Thumbnail Background */}
                            {boxImg ? (
                        <img
                          src={boxImg}
                          alt={`Tile ${bId}`}
                          className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover/tile:opacity-90 transition-opacity pointer-events-none"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-slate-950/50 border border-dashed border-slate-800/80 rounded-lg m-0.5 flex flex-col items-center justify-center pointer-events-none p-1">
                          <span className="text-[10px] text-slate-500 font-bold">{uiText("components_tile_link_modal.span.box", "Box ")}{bId}</span>
                        </div>
                      )}
                            {/* Top Header Row of the selector item */}
                            <div className="flex items-center justify-between w-full relative z-10">
                        <span className={cn(
                          "text-[10px] font-bold flex items-center justify-center w-5 h-5 rounded-md",
                          isActive
                            ? "bg-cyan-500 text-slate-950"
                            : isConfigured
                            ? "bg-indigo-500/20 text-indigo-300"
                            : "bg-slate-800 text-slate-400"
                        )}>
                          {bId}
                        </span>

                        {isConfigured && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        )}
                      </div>
                            {/* Indicators of configured status */}
                            <div className="flex gap-1 items-center justify-center w-full relative z-10">
                        {boxCfg?.url && (
                          <div className="p-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400" title={`Redirect: ${boxCfg.url}`}>
                            <Link2 className="w-3 h-3" />
                          </div>
                        )}
                        {boxCfg?.hoverEffect && boxCfg.hoverEffect !== "none" && (
                          <div className="p-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-purple-400" title={`Hover Effect: ${boxCfg.hoverEffect}`}>
                            <RefreshCw className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                            </>
                          )}
                    </CustomizableButton>
                  );
                })}
              </div>
            </div>

            {/* Bulk / Global Action Panel */}
            <div className="border-t border-slate-800/80 pt-3 space-y-2">
              <span className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-widest block">
                {uiText("components_tile_link_modal.span.bulk_configurations", "Bulk Configurations")}
              </span>
              <CustomizableButton
                buttonId="tile_link_modal_btn_14"
                defaultIcon={<Copy className="w-3.5 h-3.5 text-cyan-400" />}
                type="button"
onClick={handleApplyToAll}
className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-slate-300 hover:text-slate-100 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
title={uiText("components_tile_link_modal.button.apply_the_current_active_box_link_and_hover.title", "Apply the current active box link and hover configurations to all 9 boxes")}
              >
                  {() => (
                      <>
                        <span>{uiText("components_tile_link_modal.span.apply_current_config_to_all_boxes", "Apply Current Config to All Boxes")}</span>
                      </>
                    )}
              </CustomizableButton>
              <div className="flex gap-2">
                <CustomizableButton
                  buttonId="tile_link_modal_btn_13"
                  defaultIcon={<Trash2 className="w-3 h-3" />}
                  type="button"
onClick={handleClearCurrent}
className="flex-1 bg-slate-900/60 hover:bg-slate-800 text-rose-300 hover:text-rose-200 border border-slate-800/80 px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
title={uiText("components_tile_link_modal.button.clear_the_link_configurations_of_the_current.title", "Clear the link configurations of the current active box only")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_tile_link_modal.span.clear_box", "Clear Box ")}{activeBoxId}</span>
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="tile_link_modal_btn_12"
                  defaultIcon={<Trash2 className="w-3 h-3" />}
                  type="button"
onClick={handleClearAll}
className="flex-1 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-rose-900/30 px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
title={uiText("components_tile_link_modal.button.wipe_configurations_for_all_9_boxes.title", "Wipe configurations for all 9 boxes")}
                >
                    {() => (
                        <>
                          <span>{uiText("components_tile_link_modal.span.clear_all_9", "Clear All 9")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>
          </div>

          {/* Right Column: Active Box Editor Form */}
          <div className="md:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-cyan-500 text-slate-950 rounded-lg flex items-center justify-center font-black text-sm">
                  {activeBoxId}
                </div>
                <div>
                  <CustomizableLabel
                    labelId="tile_link_modal_item_11"
                    as="h4"
                    className="text-xs font-extrabold text-slate-200"
                  >
                      {() => (
                          <>
                            {uiText("components_tile_link_modal.h4.box", "Box ")}
                          {activeBoxId}
                          {uiText("components_tile_link_modal.h4.configuration_form", " Configuration Form")}
                          </>
                        )}
                  </CustomizableLabel>
                  <p className="text-[10px] text-slate-400">
                    {boxImages[activeBoxId] ? "Has loaded image" : "No image currently inside"}
                  </p>
                </div>
              </div>

              {/* Box Image Thumbnail & Quick Upload on Editor Header */}
              <div className="flex items-center gap-2">
                {boxImages[activeBoxId] ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border border-slate-700 overflow-hidden bg-slate-950 shrink-0 shadow-sm">
                      <img src={boxImages[activeBoxId]} alt="" className="w-full h-full object-cover" />
                    </div>
                    {onUpdateBoxImage && (
                      <CustomizableLabel
                        labelId="tile_link_modal_item_10"
                        as="label"
                        className="text-[9.5px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1 rounded-lg cursor-pointer transition-colors shadow-sm"
title={uiText("components_tile_link_modal.label.replace_tile_image.title", "Replace tile image")}
                      >
                          {() => (
                              <>
                                {uiText("components_tile_link_modal.label.replace_tile_art", "Replace Tile Art")}
                              <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                const url = reader.result?.toString() || "";
                                if (url) onUpdateBoxImage(activeBoxId, url);
                              };
                              reader.readAsDataURL(e.target.files[0]);
                            }
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                              </>
                            )}
                      </CustomizableLabel>
                    )}
                  </div>
                ) : (
                  onUpdateBoxImage && (
                    <CustomizableLabel
                      labelId="tile_link_modal_item_9"
                      defaultIcon={<Upload className="w-3 h-3" />}
                      as="label"
                      className="text-[10px] font-bold text-cyan-300 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                        {() => (
                            <>
                              <span>{uiText("components_tile_link_modal.span.set_tile_image", "Set Tile Image")}</span>
                            <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              const url = reader.result?.toString() || "";
                              if (url) onUpdateBoxImage(activeBoxId, url);
                            };
                            reader.readAsDataURL(e.target.files[0]);
                          }
                          e.target.value = "";
                        }}
                        className="hidden"
                      />
                            </>
                          )}
                    </CustomizableLabel>
                  )
                )}
              </div>
            </div>

            {/* Form Inputs Container */}
            <div className="space-y-4 flex-1">
              
              {/* Redirect URL input */}
              <div className="flex flex-col gap-1.5 bg-[#020617] p-3 rounded-xl border border-slate-800">
                <CustomizableLabel
                  labelId="tile_link_modal_item_8"
                  as="label"
                  className="text-[11px] font-bold text-slate-300 flex items-center justify-between"
                >
                    {() => (
                        <>
                          <span className="flex items-center gap-1.5">
                    <MousePointerClick className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{uiText("components_tile_link_modal.span.html_redirect_link", "HTML Redirect Link")}</span>
                  </span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">{uiText("components_tile_link_modal.span.active_in_lock_mode", "Active in lock mode")}</span>
                        </>
                      )}
                </CustomizableLabel>
                <div className="flex flex-col sm:flex-row gap-2 mt-1">
                  <input
                    type="url"
                    placeholder="https://example.com/target-page"
                    value={activeConfig.url || ""}
                    onChange={(e) => updateActiveConfig({ url: e.target.value })}
                    className="flex-1 bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
                  />
                  <select
                    value={activeConfig.target || "_blank"}
                    onChange={(e) => updateActiveConfig({ target: e.target.value })}
                    className="bg-[#0f172a] border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="_blank">{uiText("components_tile_link_modal.option.new_tab_blank", "New Tab (_blank)")}</option>
                    <option value="_self">{uiText("components_tile_link_modal.option.same_tab_self", "Same Tab (_self)")}</option>
                  </select>
                </div>
                <p className="text-[9.5px] text-slate-400 mt-1">
                  {uiText("components_tile_link_modal.p.clicking_box", "💡 Clicking Box ")}{activeBoxId}{uiText("components_tile_link_modal.p.during_preview_will_redirect_to_this_destina", " during preview will redirect to this destination when modifications are locked.")}
                </p>
              </div>

              {/* Interactive Mouse Over Effect */}
              <div className="flex flex-col gap-2 bg-[#020617] p-3 rounded-xl border border-slate-800">
                <CustomizableLabel
                  labelId="tile_link_modal_item_7"
                  defaultIcon={<RefreshCw className="w-3.5 h-3.5 text-purple-400" />}
                  as="label"
                  className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5"
                >
                    {() => (
                        <>
                          <span>{uiText("components_tile_link_modal.span.interactive_mouse_over_effect", "Interactive Mouse-Over Effect")}</span>
                        </>
                      )}
                </CustomizableLabel>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(["none", "spin", "change-image"] as const).map((effect) => (
                    <CustomizableButton
                      buttonId="tile_link_modal_btn_6"
                      key={effect}
type="button"
onClick={() => updateActiveConfig({ hoverEffect: effect })}
className={cn(
                        "px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1.5",
                        activeConfig.hoverEffect === effect
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.15)]"
                          : "bg-slate-900/60 hover:bg-slate-800 text-slate-400 border-slate-800"
                      )}
                    >
                        {() => (
                            <>
                              {effect === "none" && (
                        <>
                          <X className="w-4 h-4 text-slate-500" />
                          <span>{uiText("components_tile_link_modal.span.no_effect", "No Effect")}</span>
                        </>
                      )}
                            {effect === "spin" && (
                        <>
                          <RotateCw className="w-4 h-4 text-purple-400 animate-spin-slow" />
                          <span>{uiText("components_tile_link_modal.span.3d_spin", "3D Spin")}</span>
                        </>
                      )}
                            {effect === "change-image" && (
                        <>
                          <ImageIcon className="w-4 h-4 text-emerald-400" />
                          <span>{uiText("components_tile_link_modal.span.swap_image", "Swap Image")}</span>
                        </>
                      )}
                            </>
                          )}
                    </CustomizableButton>
                  ))}
                </div>

                {/* Swap Image Select details */}
                {activeConfig.hoverEffect === "change-image" && (
                  <div className="mt-3 p-3 bg-[#0f172a] rounded-xl border border-slate-800/80 space-y-3 animate-in fade-in duration-150">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      {uiText("components_tile_link_modal.span.select_swap_on_hover_image_for_box", "Select Swap-On-Hover Image for Box ")}{activeBoxId}
                    </span>

                    {/* File Drop/Upload */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center transition-colors cursor-pointer min-h-[90px]",
                        dragOver
                          ? "border-emerald-400 bg-emerald-950/10 text-emerald-300"
                          : "border-slate-700 bg-slate-950/40 hover:border-slate-600 text-slate-400"
                      )}
                    >
                      <CustomizableLabel
                        labelId="tile_link_modal_item_5"
                        defaultIcon={<Upload className="w-5 h-5 text-slate-500" />}
                        as="label"
                        className="cursor-pointer flex flex-col items-center gap-1"
                      >
                          {() => (
                              <>
                                <span className="text-xs font-semibold">
                          {uiText("components_tile_link_modal.span.drag_and_drop_image_or", "Drag & drop image or ")}<span className="text-emerald-400 hover:underline">{uiText("components_tile_link_modal.span.browse", "browse")}</span>
                        </span>
                              <span className="text-[9px] text-slate-500">{uiText("components_tile_link_modal.span.supports_jpg_png_webp_gif_dataurl", "Supports JPG, PNG, WebP, GIF, DataURL")}</span>
                              <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                              </>
                            )}
                      </CustomizableLabel>
                    </div>

                    {/* Web URL input */}
                    <div className="space-y-1">
                      <span className="text-[9.5px] font-bold text-slate-400">{uiText("components_tile_link_modal.span.or_enter_image_url", "Or enter Image URL:")}</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="https://example.com/hover-image.jpg"
                          value={activeConfig.hoverImage?.startsWith("data:") ? "Uploaded Base64 Image" : activeConfig.hoverImage || ""}
                          onChange={(e) => {
                            if (!e.target.value.startsWith("Uploaded")) {
                              updateActiveConfig({ hoverImage: e.target.value });
                            }
                          }}
                          className="flex-1 bg-[#020617] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
                        />
                        {activeConfig.hoverImage && (
                          <CustomizableButton
                            buttonId="tile_link_modal_btn_4"
                            defaultIcon={<Trash2 className="w-3.5 h-3.5" />}
                            type="button"
onClick={() => updateActiveConfig({ hoverImage: "" })}
className="bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/60 px-2 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
                          >
                              {() => (
                                  <>
                                    {uiText("components_tile_link_modal.button.clear", " Clear")}
                                  </>
                                )}
                          </CustomizableButton>
                        )}
                      </div>
                    </div>

                    {/* Storyboard Slices Picker */}
                    {storyboardSlices.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[9.5px] font-bold text-slate-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />{uiText("components_tile_link_modal.span.choose_from_storyboard_slices", " Choose from Storyboard Slices:")}
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
                          {storyboardSlices.map((slice, sIdx) => (
                            <CustomizableButton
                              buttonId="tile_link_modal_btn_3"
                              key={`${slice.name}-${sIdx}`}
type="button"
onClick={() => updateActiveConfig({ hoverImage: slice.url })}
className={cn(
                                "w-12 h-12 rounded-lg overflow-hidden border relative shrink-0 transition-all cursor-pointer hover:scale-105",
                                activeConfig.hoverImage === slice.url ? "border-emerald-400 ring-2 ring-emerald-500/20" : "border-slate-800 hover:border-slate-600"
                              )}
title={slice.name}
                            >
                                {() => (
                                    <>
                                      <img src={slice.url} alt={slice.name} className="w-full h-full object-cover" />
                                    </>
                                  )}
                            </CustomizableButton>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preview swap on hover */}
                    {activeConfig.hoverImage && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                        <div className="w-10 h-10 rounded border border-slate-700 overflow-hidden bg-slate-950 shrink-0">
                          <img src={activeConfig.hoverImage} alt={uiText("components_tile_link_modal.img.hover_swap_preview.alt", "Hover swap preview")} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-400">
                          {uiText("components_tile_link_modal.span.swap_image_configured_successfully_for_hover", "✓ Swap Image configured successfully for hover state.")}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center border-t border-slate-800 pt-3 mt-1">
          <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>{uiText("components_tile_link_modal.span.select_boxes_on_the_left_to_review_or_edit_t", "Select boxes on the left to review or edit their configs.")}</span>
          </div>
          <div className="flex gap-2">
            <CustomizableButton
              buttonId="tile_link_modal_btn_2"
              type="button"
onClick={onClose}
className="px-4 py-2 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
                {() => (
                    <>
                      {uiText("components_tile_link_modal.button.cancel", "Cancel")}
                    </>
                  )}
            </CustomizableButton>
            <CustomizableButton
              buttonId="tile_link_modal_btn_1"
              type="button"
onClick={handleSave}
className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors cursor-pointer font-extrabold flex items-center gap-1.5 shadow-md"
            >
                {() => (
                    <>
                      {uiText("components_tile_link_modal.button.save_configurations", "Save Configurations")}
                    </>
                  )}
            </CustomizableButton>
          </div>
        </div>
      </div>
    </div>
  );
}
