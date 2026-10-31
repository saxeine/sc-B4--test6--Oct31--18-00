import React from "react";
import {
  Palette,
  Disc,
  X,
  RotateCcw,
  SlidersHorizontal,
  Grid3x3,
  Grid,
  Check,
  Sparkles,
} from "lucide-react";
import {
  FourByFourWholePanelStyle,
  DEFAULT_4X4_PANEL_STYLE,
  generateHarmonicPanelStyle,
  PRESET_COLORWAYS_4X4,
} from "./FourByFourModal";
import { RadialColorPicker } from "./RadialColorPicker";
import { uiText } from "../hooks/useUIConfig";
import { CustomizableLabel } from "./CustomizableLabel";
import { CustomizableButton } from "./CustomizableButton";

export interface WholePanelStyleDialModalProps {
  isOpen: boolean;
  onClose: () => void;
  panelStyle: FourByFourWholePanelStyle;
  onUpdatePanelStyle: (
    style: FourByFourWholePanelStyle | Partial<FourByFourWholePanelStyle>
  ) => void;
  frontPageGridMode?: "3x3" | "4x4";
  onToggleFrontPageGridMode?: (mode: "3x3" | "4x4") => void;
}

export const WholePanelStyleDialModal: React.FC<WholePanelStyleDialModalProps> = ({
  isOpen,
  onClose,
  panelStyle,
  onUpdatePanelStyle,
  frontPageGridMode = "4x4",
  onToggleFrontPageGridMode,
}) => {
  if (!isOpen) return null;

  const handleMasterDialColor = (colorHex: string) => {
    const harmonic = generateHarmonicPanelStyle(colorHex);
    onUpdatePanelStyle({
      ...harmonic,
      divisionWidth: panelStyle.divisionWidth,
      divisionStyle: panelStyle.divisionStyle,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[10050] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 select-none animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          borderColor: panelStyle.panelBorderColor,
          backgroundColor: panelStyle.headerBgColor,
          boxShadow: `0 25px 60px -15px ${panelStyle.glowColor}50, 0 0 40px rgba(0,0,0,0.9)`,
        }}
        className="w-full max-w-[440px] max-h-[92vh] rounded-2xl border flex flex-col overflow-hidden text-slate-200 animate-in zoom-in-95 duration-150 shadow-2xl"
      >
        {/* Modal Header */}
        <div
          style={{
            borderBottomColor: panelStyle.divisionColor,
            backgroundColor: `${panelStyle.panelBgColor}ee`,
          }}
          className="px-4 py-3 border-b flex items-center justify-between shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <div
              className="p-1.5 rounded-xl border flex items-center justify-center shadow-md"
              style={{
                borderColor: panelStyle.panelBorderColor,
                backgroundColor: `${panelStyle.primaryColor}25`,
                color: panelStyle.primaryColor,
              }}
            >
              <Disc className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CustomizableLabel
                  labelId="whole_panel_style_dial_modal_item_9"
                  as="h3"
                  className="text-xs font-black uppercase tracking-wider"
style={{ color: panelStyle.textColor }}
                >
                    {() => (
                        <>
                          {uiText("components_whole_panel_style_dial_modal.h3.circular_radial_dial_modal", "Circular Radial Dial Modal")}
                        </>
                      )}
                </CustomizableLabel>
                <span
                  style={{
                    color: panelStyle.textColor,
                    borderColor: panelStyle.divisionColor,
                    backgroundColor: `${panelStyle.primaryColor}25`,
                  }}
                  className="text-[8.5px] font-mono px-1.5 py-0.2 rounded border"
                >
                  {uiText("components_whole_panel_style_dial_modal.span.whole_panel_and_divisions", "Whole Panel & Divisions")}
                </span>
              </div>
              <p className="text-[9.5px] text-slate-400">
                {uiText("components_whole_panel_style_dial_modal.p.customize_4_4_panel_style_and_grid_division", "Customize 4×4 panel style & grid division lines")}
              </p>
            </div>
          </div>

          <CustomizableButton
            buttonId="whole_panel_style_dial_modal_btn_8"
            defaultIcon={<X className="w-4 h-4" />}
            type="button"
onClick={onClose}
className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
title={uiText("components_whole_panel_style_dial_modal.button.close_dial_modal.title", "Close Dial Modal")}
          />
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
          {/* Scope Controls Explainer Banner */}
          <div
            style={{
              borderColor: panelStyle.divisionColor,
              backgroundColor: `${panelStyle.panelBgColor}bb`,
            }}
            className="p-2.5 rounded-xl border text-[9.5px] leading-relaxed space-y-1"
          >
            <div className="flex items-center gap-1.5 font-bold" style={{ color: panelStyle.textColor }}>
              <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: panelStyle.primaryColor }} />
              <span>{uiText("components_whole_panel_style_dial_modal.span.scope_whole_panel_and_its_divisions", "Scope: Whole Panel & Its Divisions")}</span>
            </div>
            <p className="text-slate-300">
              {uiText("components_whole_panel_style_dial_modal.p.style_controls_apply_to_the", "Style controls apply to the ")}<strong>{uiText("components_whole_panel_style_dial_modal.strong.whole_panel_itself", "whole panel itself")}</strong>{uiText("components_whole_panel_style_dial_modal.p.frame_border_glow_background_tint_and", " (frame border, glow, background tint) and ")}<strong>{uiText("components_whole_panel_style_dial_modal.strong.its_divisions", "its divisions")}</strong>{uiText("components_whole_panel_style_dial_modal.p.the_dividing_lines_separating_all_16_cells", " (the dividing lines separating all 16 cells), ")}<em>{uiText("components_whole_panel_style_dial_modal.em.not", "not")}</em>{uiText("components_whole_panel_style_dial_modal.p.individually_across_each_of_the_16_content_p", " individually across each of the 16 content panels.")}
            </p>
            <p className="text-slate-400 text-[8.5px]">
              {uiText("components_whole_panel_style_dial_modal.p.baseline_default_is_purple", "Baseline default is Purple (")}<span className="font-mono text-fuchsia-300">#d946ef</span>{uiText("components_whole_panel_style_dial_modal.p.turn_the_dials_below_to_change_to_your_custo", "). Turn the dials below to change to your custom colors.")}
            </p>
          </div>

          {/* Master Circular Radial Dial Trigger Button */}
          <div
            style={{
              borderColor: panelStyle.divisionColor,
              backgroundColor: `${panelStyle.panelBgColor}99`,
            }}
            className="p-3 rounded-xl border space-y-2 text-center"
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: panelStyle.textColor }}
              >
                <Palette className="w-3.5 h-3.5" style={{ color: panelStyle.primaryColor }} />
                {uiText("components_whole_panel_style_dial_modal.span.master_theme_radial_dial_360", "Master Theme Radial Dial (360°)")}
              </span>
              <span
                className="text-[9px] font-mono px-2 py-0.5 rounded border font-bold"
                style={{
                  color: panelStyle.primaryColor,
                  borderColor: panelStyle.divisionColor,
                  backgroundColor: `${panelStyle.primaryColor}20`,
                }}
              >
                {panelStyle.primaryColor.toUpperCase()}
              </span>
            </div>

            <RadialColorPicker
              color={panelStyle.primaryColor}
              onChange={handleMasterDialColor}
              compactTrigger={false}
              buttonLabel="Launch 360° Circular Radial Dial Wheel"
              buttonClassName="w-full py-2.5 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all"
              style={{
                backgroundColor: panelStyle.primaryColor,
                boxShadow: `0 4px 18px ${panelStyle.glowColor}70`,
              }}
            />
            <p className="text-[8.5px] text-slate-400">
              {uiText("components_whole_panel_style_dial_modal.p.turning_the_360_master_dial_recalculates_har", "Turning the 360° master dial recalculates harmonious shades for panel frame, glow, surface, and division lines.")}
            </p>
          </div>

          {/* Channel Dials: Frame, Divisions, Surface, Text */}
          <div
            style={{
              borderColor: panelStyle.divisionColor,
              backgroundColor: `${panelStyle.panelBgColor}77`,
            }}
            className="p-3 rounded-xl border space-y-2"
          >
            <span
              className="text-[10px] font-bold uppercase tracking-wider block"
              style={{ color: panelStyle.textColor }}
            >
              {uiText("components_whole_panel_style_dial_modal.span.independent_channel_dials", "Independent Channel Dials:")}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Channel 1: Panel Outer Frame Border */}
              <div
                style={{
                  borderColor: panelStyle.divisionColor,
                  backgroundColor: `${panelStyle.headerBgColor}cc`,
                }}
                className="p-2.5 rounded-xl border space-y-1.5 bg-[#090e1a]/80"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-200 font-bold">{uiText("components_whole_panel_style_dial_modal.span.outer_border_and_glow", "Outer Border & Glow:")}</span>
                  <span
                    className="w-4 h-4 rounded-md border shadow-inner shrink-0"
                    style={{
                      backgroundColor: panelStyle.panelBorderColor,
                      borderColor: panelStyle.divisionColor,
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={panelStyle.panelBorderColor}
                    onChange={(e) =>
                      onUpdatePanelStyle({ panelBorderColor: e.target.value, glowColor: e.target.value })
                    }
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0 shrink-0"
                    title={uiText("components_whole_panel_style_dial_modal.input.pick_outer_border_color.title", "Pick Outer Border Color")}
                  />
                  <div className="flex-1 min-w-0">
                    <RadialColorPicker
                      color={panelStyle.panelBorderColor}
                      onChange={(c) =>
                        onUpdatePanelStyle({ panelBorderColor: c, glowColor: c })
                      }
                      compactTrigger
                      buttonLabel="Dial Border"
                      buttonClassName="w-full px-2 py-1 text-[9.5px] font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-lg cursor-pointer justify-center"
                    />
                  </div>
                </div>
              </div>

              {/* Channel 2: Grid Divisions / Separator Lines */}
              <div
                style={{
                  borderColor: panelStyle.divisionColor,
                  backgroundColor: `${panelStyle.headerBgColor}cc`,
                }}
                className="p-2.5 rounded-xl border space-y-1.5 bg-[#090e1a]/80"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-200 font-bold">{uiText("components_whole_panel_style_dial_modal.span.grid_divisions", "Grid Divisions:")}</span>
                  <span
                    className="w-4 h-4 rounded-md border shadow-inner shrink-0"
                    style={{
                      backgroundColor: panelStyle.divisionColor,
                      borderColor: panelStyle.panelBorderColor,
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={panelStyle.divisionColor}
                    onChange={(e) => onUpdatePanelStyle({ divisionColor: e.target.value })}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0 shrink-0"
                    title={uiText("components_whole_panel_style_dial_modal.input.pick_grid_division_line_color.title", "Pick Grid Division Line Color")}
                  />
                  <div className="flex-1 min-w-0">
                    <RadialColorPicker
                      color={panelStyle.divisionColor}
                      onChange={(c) => onUpdatePanelStyle({ divisionColor: c })}
                      compactTrigger
                      buttonLabel="Dial Divisions"
                      buttonClassName="w-full px-2 py-1 text-[9.5px] font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-lg cursor-pointer justify-center"
                    />
                  </div>
                </div>
              </div>

              {/* Channel 3: Surface Background Tint */}
              <div
                style={{
                  borderColor: panelStyle.divisionColor,
                  backgroundColor: `${panelStyle.headerBgColor}cc`,
                }}
                className="p-2.5 rounded-xl border space-y-1.5 bg-[#090e1a]/80"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-200 font-bold">{uiText("components_whole_panel_style_dial_modal.span.surface_tint", "Surface Tint:")}</span>
                  <span
                    className="w-4 h-4 rounded-md border shadow-inner shrink-0"
                    style={{
                      backgroundColor: panelStyle.panelBgColor,
                      borderColor: panelStyle.divisionColor,
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={panelStyle.panelBgColor}
                    onChange={(e) => onUpdatePanelStyle({ panelBgColor: e.target.value })}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0 shrink-0"
                    title={uiText("components_whole_panel_style_dial_modal.input.pick_surface_tint_background_color.title", "Pick Surface Tint Background Color")}
                  />
                  <div className="flex-1 min-w-0">
                    <RadialColorPicker
                      color={panelStyle.panelBgColor}
                      onChange={(c) => onUpdatePanelStyle({ panelBgColor: c })}
                      compactTrigger
                      buttonLabel="Dial Surface"
                      buttonClassName="w-full px-2 py-1 text-[9.5px] font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-lg cursor-pointer justify-center"
                    />
                  </div>
                </div>
              </div>

              {/* Channel 4: Text & Accent */}
              <div
                style={{
                  borderColor: panelStyle.divisionColor,
                  backgroundColor: `${panelStyle.headerBgColor}cc`,
                }}
                className="p-2.5 rounded-xl border space-y-1.5 bg-[#090e1a]/80"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-200 font-bold">{uiText("components_whole_panel_style_dial_modal.span.text_and_labels", "Text & Labels:")}</span>
                  <span
                    className="w-4 h-4 rounded-md border shadow-inner shrink-0"
                    style={{
                      backgroundColor: panelStyle.textColor,
                      borderColor: panelStyle.divisionColor,
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={panelStyle.textColor}
                    onChange={(e) => onUpdatePanelStyle({ textColor: e.target.value })}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0 shrink-0"
                    title={uiText("components_whole_panel_style_dial_modal.input.pick_text_and_label_color.title", "Pick Text & Label Color")}
                  />
                  <div className="flex-1 min-w-0">
                    <RadialColorPicker
                      color={panelStyle.textColor}
                      onChange={(c) => onUpdatePanelStyle({ textColor: c })}
                      compactTrigger
                      buttonLabel="Dial Text"
                      buttonClassName="w-full px-2 py-1 text-[9.5px] font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-lg cursor-pointer justify-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Division Lines Controls (Thickness & Style) */}
          <div
            style={{
              borderColor: panelStyle.divisionColor,
              backgroundColor: `${panelStyle.panelBgColor}77`,
            }}
            className="p-3 rounded-xl border space-y-2.5"
          >
            <span
              className="text-[10px] font-bold uppercase tracking-wider block"
              style={{ color: panelStyle.textColor }}
            >
              {uiText("components_whole_panel_style_dial_modal.span.division_lines_thickness_and_border_style", "Division Lines Thickness & Border Style:")}
            </span>

            {/* Thickness */}
            <div className="space-y-1">
              <span className="text-[8.5px] text-slate-300 font-medium block">
                {uiText("components_whole_panel_style_dial_modal.span.divider_width_between_16_cells", "Divider Width Between 16 Cells:")}
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { w: 1, label: "1px Hairline" },
                  { w: 2, label: "2px Solid" },
                  { w: 3, label: "3px Bold" },
                  { w: 4, label: "4px Chunky" },
                ].map((item) => (
                  <CustomizableButton
                    buttonId="whole_panel_style_dial_modal_btn_7"
                    key={item.w}
type="button"
onClick={() => onUpdatePanelStyle({ divisionWidth: item.w })}
style={
                      panelStyle.divisionWidth === item.w
                        ? {
                            backgroundColor: panelStyle.primaryColor,
                            color: "#020617",
                            borderColor: panelStyle.panelBorderColor,
                          }
                        : {
                            borderColor: panelStyle.divisionColor,
                            backgroundColor: `${panelStyle.headerBgColor}cc`,
                          }
                    }
className="py-1 px-1 rounded-lg text-[8.5px] font-bold border cursor-pointer transition-colors text-center"
                  >
                      {() => (
                          <>
                            {item.label}
                          </>
                        )}
                  </CustomizableButton>
                ))}
              </div>
            </div>

            {/* Border Style */}
            <div className="space-y-1 pt-1">
              <span className="text-[8.5px] text-slate-300 font-medium block">
                {uiText("components_whole_panel_style_dial_modal.span.divider_style", "Divider Style:")}
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(["solid", "dashed", "glow", "double"] as const).map((sty) => (
                  <CustomizableButton
                    buttonId="whole_panel_style_dial_modal_btn_6"
                    key={sty}
type="button"
onClick={() => onUpdatePanelStyle({ divisionStyle: sty })}
style={
                      panelStyle.divisionStyle === sty
                        ? {
                            backgroundColor: panelStyle.primaryColor,
                            color: "#020617",
                            borderColor: panelStyle.panelBorderColor,
                          }
                        : {
                            borderColor: panelStyle.divisionColor,
                            backgroundColor: `${panelStyle.headerBgColor}cc`,
                          }
                    }
className="py-1 px-1 rounded-lg text-[8.5px] font-bold border capitalize cursor-pointer transition-colors text-center"
                  >
                      {() => (
                          <>
                            {sty}
                          </>
                        )}
                  </CustomizableButton>
                ))}
              </div>
            </div>
          </div>

          {/* Curated Color Presets */}
          <div
            style={{
              borderColor: panelStyle.divisionColor,
              backgroundColor: `${panelStyle.panelBgColor}77`,
            }}
            className="p-3 rounded-xl border space-y-2"
          >
            <span
              className="text-[10px] font-bold uppercase tracking-wider block"
              style={{ color: panelStyle.textColor }}
            >
              {uiText("components_whole_panel_style_dial_modal.span.curated_presets", "Curated Presets:")}
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_COLORWAYS_4X4.map((cw) => (
                <CustomizableButton
                  buttonId="whole_panel_style_dial_modal_btn_5"
                  key={cw.name}
type="button"
onClick={() => onUpdatePanelStyle(cw.style)}
style={{
                    borderColor: panelStyle.divisionColor,
                    backgroundColor: `${panelStyle.headerBgColor}bb`,
                  }}
className="px-2 py-1.5 rounded-lg border hover:brightness-125 flex items-center gap-1.5 cursor-pointer text-left transition-all"
                >
                    {() => (
                        <>
                          <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs border border-white/40"
                    style={{ backgroundColor: cw.style.primaryColor }}
                  />
                        <span className="text-[8.5px] font-bold text-slate-200 truncate">
                    {cw.name}
                  </span>
                        </>
                      )}
                </CustomizableButton>
              ))}
            </div>
          </div>

          {/* Live Mini Preview of 4x4 Panel with Divisions */}
          <div
            style={{
              borderColor: panelStyle.divisionColor,
              backgroundColor: `${panelStyle.panelBgColor}ee`,
            }}
            className="p-3 rounded-xl border space-y-1.5"
          >
            <span
              className="text-[9.5px] font-bold uppercase tracking-wider block"
              style={{ color: panelStyle.textColor }}
            >
              {uiText("components_whole_panel_style_dial_modal.span.live_whole_panel_and_division_preview", "Live Whole Panel & Division Preview:")}
            </span>
            <div
              style={{
                borderColor: panelStyle.panelBorderColor,
                backgroundColor: panelStyle.panelBgColor,
                boxShadow: `0 0 20px ${panelStyle.glowColor}40`,
              }}
              className="p-2 rounded-xl border grid grid-cols-4 gap-1 w-full max-w-[280px] mx-auto"
            >
              {Array.from({ length: 16 }, (_, i) => i + 1).map((idx) => (
                <div
                  key={idx}
                  style={{
                    borderColor: panelStyle.divisionColor,
                    borderWidth: `${panelStyle.divisionWidth}px`,
                    borderStyle:
                      panelStyle.divisionStyle === "glow"
                        ? "solid"
                        : panelStyle.divisionStyle,
                    boxShadow:
                      panelStyle.divisionStyle === "glow"
                        ? `0 0 6px ${panelStyle.divisionColor}`
                        : undefined,
                    backgroundColor: `${panelStyle.headerBgColor}aa`,
                  }}
                  className="aspect-square rounded flex items-center justify-center text-[7.5px] font-bold"
                >
                  <span style={{ color: panelStyle.textColor }}>{idx}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reset & Return to 3x3 Layout Section */}
          <div className="space-y-2 pt-1">
            <CustomizableButton
              buttonId="whole_panel_style_dial_modal_btn_4"
              defaultIcon={<RotateCcw className="w-3 h-3 text-fuchsia-400" />}
              type="button"
onClick={() => onUpdatePanelStyle(DEFAULT_4X4_PANEL_STYLE)}
style={{ borderColor: panelStyle.divisionColor }}
className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-[9.5px] font-bold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
                {() => (
                    <>
                      <span>{uiText("components_whole_panel_style_dial_modal.span.reset_to_baseline_purple_default_d946ef", "Reset to Baseline Purple Default (#d946ef)")}</span>
                    </>
                  )}
            </CustomizableButton>

            {/* Return to 3x3 layout button */}
            <div
              style={{
                borderColor: panelStyle.divisionColor,
                backgroundColor: "#051322",
              }}
              className="p-2.5 rounded-xl border space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-bold text-cyan-300 flex items-center gap-1">
                  <Grid3x3 className="w-3.5 h-3.5 text-cyan-400" />
                  {uiText("components_whole_panel_style_dial_modal.span.front_page_layout_mode", "Front Page Layout Mode")}
                </span>
                <span className="text-[8.5px] font-mono font-bold text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-500/40">
                  {frontPageGridMode.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CustomizableButton
                  buttonId="whole_panel_style_dial_modal_btn_3"
                  defaultIcon={<Grid3x3 className="w-3.5 h-3.5 text-cyan-400" />}
                  type="button"
onClick={() => {
                    if (onToggleFrontPageGridMode) {
                      onToggleFrontPageGridMode("3x3");
                    }
                    onClose();
                  }}
className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 text-[9.5px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md"
                >
                    {() => (
                        <>
                          <span>{uiText("components_whole_panel_style_dial_modal.span.return_to_3_3_9_panels", "Return to 3×3 (9 Panels)")}</span>
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="whole_panel_style_dial_modal_btn_2"
                  defaultIcon={<Grid className="w-3.5 h-3.5 text-fuchsia-400" />}
                  type="button"
onClick={() => {
                    if (onToggleFrontPageGridMode) {
                      onToggleFrontPageGridMode("4x4");
                    }
                  }}
className="flex-1 py-1.5 px-2 rounded-lg bg-fuchsia-950 hover:bg-fuchsia-900 border border-fuchsia-500/60 text-fuchsia-200 text-[9.5px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md"
                >
                    {() => (
                        <>
                          <span>{uiText("components_whole_panel_style_dial_modal.span.switch_to_4_4_16_panels", "Switch to 4×4 (16 Panels)")}</span>
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            borderTopColor: panelStyle.divisionColor,
            backgroundColor: `${panelStyle.panelBgColor}ee`,
          }}
          className="px-4 py-2.5 border-t flex items-center justify-end gap-2 shrink-0"
        >
          <CustomizableButton
            buttonId="whole_panel_style_dial_modal_btn_1"
            type="button"
onClick={onClose}
className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
          >
              {() => (
                  <>
                    {uiText("components_whole_panel_style_dial_modal.button.done", "Done")}
                  </>
                )}
          </CustomizableButton>
        </div>
      </div>
    </div>
  );
};
