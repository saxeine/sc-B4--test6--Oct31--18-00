import React, { useState } from "react";
import { Film, X, RefreshCw, Wand2, Check, LayoutTemplate, MessageSquare } from "lucide-react";
import type { ParsedScriptPanel } from "./types";
import { parseScriptToStoryboard, generateScriptToPrompt } from "../../services/gemini";
import { uiText } from "../../hooks/useUIConfig";
import { CustomizableLabel } from "../CustomizableLabel";
import { CustomizableButton } from "../CustomizableButton";

interface ScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  scriptText: string;
  setScriptText: (text: string) => void;
  onApplyPrompt: (prompt: string) => void;
  onApplyParsedPanelsToPageBuilder: (panels: ParsedScriptPanel[]) => void;
  onAddDialogueOverlay: (panel: ParsedScriptPanel) => void;
}

export const ScriptModal: React.FC<ScriptModalProps> = ({
  isOpen, onClose, scriptText, setScriptText, onApplyPrompt, onApplyParsedPanelsToPageBuilder, onAddDialogueOverlay
}) => {
  const [isConverting, setIsConverting] = useState(false);
  const [parsedPanels, setParsedPanels] = useState<ParsedScriptPanel[]>([]);
  const [convertedPrompt, setConvertedPrompt] = useState("");

  if (!isOpen) return null;

  const handleConvert = async () => {
    if (!scriptText.trim()) return;
    setIsConverting(true);
    setParsedPanels([]);
    setConvertedPrompt("");
    try {
      const panels = await parseScriptToStoryboard(scriptText);
      if (panels && panels.length > 0) {
        setParsedPanels(panels);
      } else {
        const prompt = await generateScriptToPrompt(scriptText);
        setConvertedPrompt(prompt);
      }
    } catch (e) {
      const prompt = await generateScriptToPrompt(scriptText);
      setConvertedPrompt(prompt);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[88vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-500/20 text-orange-400 rounded-xl">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <CustomizableLabel
                labelId="imgdesc_script_modal_item_10"
                as="h2"
                className="text-base font-bold text-zinc-100"
              >
                  {() => (
                      <>
                        {uiText("components_imgdesc_script_modal.h2.script_2_prompt_and_storyboard_parser", "Script 2 Prompt & Storyboard Parser")}
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-[11px] text-zinc-400">{uiText("components_imgdesc_script_modal.p.convert_screenplay_outlines_into_storyboard", "Convert screenplay outlines into storyboard prompts and fluid manga grids")}</p>
            </div>
          </div>
          <CustomizableButton
            buttonId="imgdesc_script_modal_btn_9"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          />
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-800">
          {/* Script Input Column */}
          <div className="flex-1 p-5 space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase">{uiText("components_imgdesc_script_modal.span.input_script_outline", "Input Script Outline")}</span>
              <div className="flex gap-1.5">
                <CustomizableButton
                  buttonId="imgdesc_script_modal_btn_8"
                  onClick={() => setScriptText("Panel 1: Cyra overlooks the rainy neon megacity from a skyscraper ledge. Panel 2: A stealth drone spots her, turning red. Panel 3: She dives off the ledge into an alleyway.")}
className="text-[10px] px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                >
                    {() => (
                        <>
                          {uiText("components_imgdesc_script_modal.button.sci_fi", "Sci-Fi")}
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="imgdesc_script_modal_btn_7"
                  onClick={() => setScriptText("Panel 1: A trench-coated detective investigates a dimly lit office. Panel 2: A shadow looms behind frosted glass. Panel 3: Gunfire shatters the door.")}
className="text-[10px] px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                >
                    {() => (
                        <>
                          {uiText("components_imgdesc_script_modal.button.noir", "Noir")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            </div>

            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder={uiText("components_imgdesc_script_modal.textarea.e_g_panel_1_hero_discovers_ancient_map_in_du.placeholder", "e.g. Panel 1: Hero discovers ancient map in dungeon. Panel 2: Traps activate with fire jets. Panel 3: Hero barely leaps across a chasm.")}
              className="w-full h-48 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-orange-500 resize-none font-mono"
            />

            <CustomizableButton
              buttonId="imgdesc_script_modal_btn_6"
              onClick={handleConvert}
disabled={isConverting || !scriptText.trim()}
className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-900/30"
            >
                {() => (
                    <>
                      {isConverting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {uiText("components_imgdesc_script_modal.button.convert_script_to_panels", "Convert Script to Panels")}
                    </>
                  )}
            </CustomizableButton>
          </div>

          {/* Results Column */}
          <div className="flex-1 p-5 space-y-3 overflow-y-auto bg-zinc-950/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase">{uiText("components_imgdesc_script_modal.span.parsed_panels_and_prompts", "Parsed Panels & Prompts")}</span>
              {parsedPanels.length > 0 && (
                <CustomizableButton
                  buttonId="imgdesc_script_modal_btn_5"
                  defaultIcon={<LayoutTemplate className="w-3 h-3" />}
                  onClick={() => {
                    onApplyParsedPanelsToPageBuilder(parsedPanels);
                    onClose();
                  }}
className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                >
                    {() => (
                        <>
                          {uiText("components_imgdesc_script_modal.button.send_to_page_builder", " Send to Page Builder")}
                        </>
                      )}
                </CustomizableButton>
              )}
            </div>

            {parsedPanels.length > 0 ? (
              <div className="space-y-2.5">
                {parsedPanels.map((p, idx) => (
                  <div key={idx} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-400">{uiText("components_imgdesc_script_modal.span.panel", "Panel ")}{p.panelNumber}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">{p.aspectRatio}</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">{p.prompt}</p>
                    {p.dialogue && (
                      <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800 text-[10px] text-zinc-300 flex items-center justify-between">
                        <span>💬 <span className="font-bold text-pink-400">{p.speaker || "Character"}:</span> "{p.dialogue}"</span>
                        <CustomizableButton
                          buttonId="imgdesc_script_modal_btn_4"
                          onClick={() => onAddDialogueOverlay(p)}
className="text-[9px] text-blue-400 hover:text-blue-300 px-1 py-0.5 rounded bg-blue-500/10"
                        >
                            {() => (
                                <>
                                  {uiText("components_imgdesc_script_modal.button.balloon", "+ Balloon")}
                                </>
                              )}
                        </CustomizableButton>
                      </div>
                    )}
                    <CustomizableButton
                      buttonId="imgdesc_script_modal_btn_3"
                      defaultIcon={<Check className="w-3 h-3 text-emerald-400" />}
                      onClick={() => {
                        onApplyPrompt(p.prompt);
                        onClose();
                      }}
className="text-[9px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded flex items-center gap-1"
                    >
                        {() => (
                            <>
                              {uiText("components_imgdesc_script_modal.button.apply_to_base_prompt", " Apply to Base Prompt")}
                            </>
                          )}
                    </CustomizableButton>
                  </div>
                ))}
              </div>
            ) : convertedPrompt ? (
              <div className="space-y-3">
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-200 leading-relaxed font-mono">
                  {convertedPrompt}
                </div>
                <CustomizableButton
                  buttonId="imgdesc_script_modal_btn_2"
                  defaultIcon={<Check className="w-4 h-4" />}
                  onClick={() => {
                    onApplyPrompt(convertedPrompt);
                    onClose();
                  }}
className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                    {() => (
                        <>
                          {uiText("components_imgdesc_script_modal.button.apply_converted_prompt", " Apply Converted Prompt")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-600 text-xs italic">
                {uiText("components_imgdesc_script_modal.div.enter_your_script_on_the_left_and_click_conv", "Enter your script on the left and click convert to see structured panels here.")}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
          <CustomizableButton
            buttonId="imgdesc_script_modal_btn_1"
            onClick={onClose}
className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
          >
              {() => (
                  <>
                    {uiText("components_imgdesc_script_modal.button.close", "Close")}
                  </>
                )}
          </CustomizableButton>
        </div>
      </div>
    </div>
  );
};
