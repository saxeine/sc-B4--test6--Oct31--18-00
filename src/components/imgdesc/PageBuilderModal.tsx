import React, { useState } from "react";
import { Grid, X, Plus, Sparkles, RefreshCw, Trash2 } from "lucide-react";
import type { PageLayout, GridPanel, Character, BibleEntry } from "./types";
import { generateImage } from "../../services/gemini";
import { uiText } from "../../hooks/useUIConfig";
import { CustomizableLabel } from "../CustomizableLabel";
import { CustomizableButton } from "../CustomizableButton";

interface PageBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageLayout: PageLayout;
  setPageLayout: React.Dispatch<React.SetStateAction<PageLayout>>;
  characters: Character[];
  locations: BibleEntry[];
  onExportPageToCanvas: (imageUrl: string) => void;
}

export const PageBuilderModal: React.FC<PageBuilderModalProps> = ({
  isOpen, onClose, pageLayout, setPageLayout, characters, locations, onExportPageToCanvas
}) => {
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(pageLayout.panels[0]?.id || null);
  const [isCompilingPanel, setIsCompilingPanel] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedPanel = pageLayout.panels.find((p) => p.id === selectedPanelId);

  const resetPreset = (preset: "quad" | "cinematic" | "manga" | "strip") => {
    let rows = 2;
    let cols = 2;
    let panels: GridPanel[] = [];

    if (preset === "quad") {
      rows = 2; cols = 2;
      panels = [
        { id: "p1", name: "Panel 1", row: 0, col: 0, rowSpan: 1, colSpan: 1, aspectRatio: "1:1", prompt: "" },
        { id: "p2", name: "Panel 2", row: 0, col: 1, rowSpan: 1, colSpan: 1, aspectRatio: "1:1", prompt: "" },
        { id: "p3", name: "Panel 3", row: 1, col: 0, rowSpan: 1, colSpan: 1, aspectRatio: "1:1", prompt: "" },
        { id: "p4", name: "Panel 4", row: 1, col: 1, rowSpan: 1, colSpan: 1, aspectRatio: "1:1", prompt: "" },
      ];
    } else if (preset === "cinematic") {
      rows = 3; cols = 1;
      panels = [
        { id: "p1", name: "Wide Scene 1", row: 0, col: 0, rowSpan: 1, colSpan: 1, aspectRatio: "16:9", prompt: "" },
        { id: "p2", name: "Wide Scene 2", row: 1, col: 0, rowSpan: 1, colSpan: 1, aspectRatio: "16:9", prompt: "" },
        { id: "p3", name: "Wide Scene 3", row: 2, col: 0, rowSpan: 1, colSpan: 1, aspectRatio: "16:9", prompt: "" },
      ];
    } else if (preset === "manga") {
      rows = 3; cols = 2;
      panels = [
        { id: "p1", name: "Hero Climax", row: 0, col: 0, rowSpan: 2, colSpan: 2, aspectRatio: "16:9", prompt: "" },
        { id: "p2", name: "Action Left", row: 2, col: 0, rowSpan: 1, colSpan: 1, aspectRatio: "1:1", prompt: "" },
        { id: "p3", name: "Reaction Right", row: 2, col: 1, rowSpan: 1, colSpan: 1, aspectRatio: "1:1", prompt: "" },
      ];
    } else {
      rows = 1; cols = 3;
      panels = [
        { id: "p1", name: "Panel 1", row: 0, col: 0, rowSpan: 1, colSpan: 1, aspectRatio: "3:4", prompt: "" },
        { id: "p2", name: "Panel 2", row: 0, col: 1, rowSpan: 1, colSpan: 1, aspectRatio: "3:4", prompt: "" },
        { id: "p3", name: "Panel 3", row: 0, col: 2, rowSpan: 1, colSpan: 1, aspectRatio: "3:4", prompt: "" },
      ];
    }

    setPageLayout({
      id: `layout-${preset}`,
      name: `${preset.toUpperCase()} Layout`,
      rows, cols, margin: 8, borderColor: "#000000", panels,
    });
    setSelectedPanelId(panels[0]?.id || null);
  };

  const handleCompilePanel = async () => {
    if (!selectedPanel) return;
    if (!selectedPanel.prompt?.trim()) {
      setCompileError("Please enter a prompt for this panel.");
      return;
    }
    setIsCompilingPanel(true);
    setCompileError(null);
    try {
      let resolvedPrompt = selectedPanel.prompt;
      characters.forEach((c) => {
        resolvedPrompt = resolvedPrompt.replace(new RegExp(`\\{character:${c.name}\\}`, "gi"), `${c.name}: ${c.description}`);
      });
      locations.forEach((l) => {
        resolvedPrompt = resolvedPrompt.replace(new RegExp(`\\{location:${l.name}\\}`, "gi"), `${l.name}: ${l.description}`);
      });

      const ar = selectedPanel.colSpan > selectedPanel.rowSpan ? "16:9" : selectedPanel.colSpan < selectedPanel.rowSpan ? "9:16" : "1:1";
      const fullPrompt = `${resolvedPrompt}, comic book panel illustration, crisp line art, beautiful colors, aspect ratio ${ar}`;
      const imgUrl = await generateImage(fullPrompt);

      setPageLayout((prev) => ({
        ...prev,
        panels: prev.panels.map((p) => p.id === selectedPanel.id ? { ...p, image: imgUrl } : p)
      }));
    } catch (e: any) {
      setCompileError(e.message || "Failed to generate panel.");
    } finally {
      setIsCompilingPanel(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-5xl h-[86vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <CustomizableLabel
                labelId="imgdesc_page_builder_modal_item_10"
                as="h2"
                className="text-base font-bold text-zinc-100"
              >
                  {() => (
                      <>
                        {uiText("components_imgdesc_page_builder_modal.h2.manga_page_builder_and_fluid_grid_compiler", "Manga Page Builder & Fluid Grid Compiler")}
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-[11px] text-zinc-400">{uiText("components_imgdesc_page_builder_modal.p.compose_custom_multi_panel_pages_with_real_t", "Compose custom multi-panel pages with real-time aspect ratio grounding")}</p>
            </div>
          </div>
          <CustomizableButton
            buttonId="imgdesc_page_builder_modal_btn_9"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          />
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-800">
          {/* Visual Grid Stage */}
          <div className="flex-1 p-6 bg-zinc-950/60 flex items-center justify-center overflow-y-auto">
            <div className="w-full max-w-[440px] aspect-[3/4] bg-zinc-900 rounded-xl p-3 shadow-2xl border border-zinc-800 flex flex-col">
              <div
                className="grid h-full w-full gap-2"
                style={{
                  display: "grid",
                  gridTemplateRows: `repeat(${pageLayout.rows}, minmax(0, 1fr))`,
                  gridTemplateColumns: `repeat(${pageLayout.cols}, minmax(0, 1fr))`,
                }}
              >
                {pageLayout.panels.map((panel) => {
                  const isSelected = selectedPanelId === panel.id;
                  const ar = panel.colSpan > panel.rowSpan ? "16:9" : panel.colSpan < panel.rowSpan ? "9:16" : "1:1";
                  return (
                    <div
                      key={panel.id}
                      onClick={() => setSelectedPanelId(panel.id)}
                      style={{
                        gridRow: `${panel.row + 1} / span ${panel.rowSpan}`,
                        gridColumn: `${panel.col + 1} / span ${panel.colSpan}`,
                      }}
                      className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        isSelected ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-zinc-900" : "border-zinc-800 hover:border-zinc-600 bg-zinc-950"
                      }`}
                    >
                      {panel.image ? (
                        <img src={panel.image} alt={panel.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-zinc-500 hover:text-zinc-300">
                          <Plus className="w-4 h-4 mb-1 text-emerald-400" />
                          <span className="text-[11px] font-semibold text-zinc-300">{panel.name}</span>
                          <span className="text-[9px] font-mono text-zinc-500">{ar}</span>
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 bg-black/75 px-1 py-0.5 rounded text-[8px] font-mono text-zinc-300 uppercase">
                        {ar}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Inspector sidebar */}
          <div className="w-full md:w-80 bg-zinc-900 p-5 flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block mb-1.5">{uiText("components_imgdesc_page_builder_modal.span.presets", "Presets")}</span>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <CustomizableButton
                    buttonId="imgdesc_page_builder_modal_btn_8"
                    onClick={() => resetPreset("quad")}
className="p-1.5 bg-zinc-950 hover:bg-zinc-800 rounded border border-zinc-800 text-zinc-300 font-medium"
                  >
                      {() => (
                          <>
                            {uiText("components_imgdesc_page_builder_modal.button.classic_2x2", "Classic 2x2")}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="imgdesc_page_builder_modal_btn_7"
                    onClick={() => resetPreset("cinematic")}
className="p-1.5 bg-zinc-950 hover:bg-zinc-800 rounded border border-zinc-800 text-zinc-300 font-medium"
                  >
                      {() => (
                          <>
                            {uiText("components_imgdesc_page_builder_modal.button.cinematic_3", "Cinematic 3")}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="imgdesc_page_builder_modal_btn_6"
                    onClick={() => resetPreset("manga")}
className="p-1.5 bg-zinc-950 hover:bg-zinc-800 rounded border border-zinc-800 text-zinc-300 font-medium"
                  >
                      {() => (
                          <>
                            {uiText("components_imgdesc_page_builder_modal.button.manga_hero", "Manga Hero")}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="imgdesc_page_builder_modal_btn_5"
                    onClick={() => resetPreset("strip")}
className="p-1.5 bg-zinc-950 hover:bg-zinc-800 rounded border border-zinc-800 text-zinc-300 font-medium"
                  >
                      {() => (
                          <>
                            {uiText("components_imgdesc_page_builder_modal.button.3_strip", "3-Strip")}
                          </>
                        )}
                  </CustomizableButton>
                </div>
              </div>

              {selectedPanel && (
                <div className="space-y-3 pt-3 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200">{selectedPanel.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                      {selectedPanel.colSpan > selectedPanel.rowSpan ? "16:9" : selectedPanel.colSpan < selectedPanel.rowSpan ? "9:16" : "1:1"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold self-center mr-1">{uiText("components_imgdesc_page_builder_modal.span.tokens", "Tokens:")}</span>
                    {characters.map((c) => (
                      <CustomizableButton
                        buttonId="imgdesc_page_builder_modal_btn_4"
                        key={c.id}
onClick={() => {
                          setPageLayout((prev) => ({
                            ...prev,
                            panels: prev.panels.map((p) => p.id === selectedPanel.id ? { ...p, prompt: `${p.prompt || ""} {character:${c.name}}`.trim() } : p)
                          }));
                        }}
className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded hover:bg-emerald-500/20"
                      >
                          {() => (
                              <>
                                {c.name}
                              </>
                            )}
                      </CustomizableButton>
                    ))}
                    {locations.map((l) => (
                      <CustomizableButton
                        buttonId="imgdesc_page_builder_modal_btn_3"
                        key={l.id}
onClick={() => {
                          setPageLayout((prev) => ({
                            ...prev,
                            panels: prev.panels.map((p) => p.id === selectedPanel.id ? { ...p, prompt: `${p.prompt || ""} {location:${l.name}}`.trim() } : p)
                          }));
                        }}
className="text-[9px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded hover:bg-sky-500/20"
                      >
                          {() => (
                              <>
                                {l.name}
                              </>
                            )}
                      </CustomizableButton>
                    ))}
                  </div>

                  <textarea
                    value={selectedPanel.prompt || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPageLayout((prev) => ({
                        ...prev,
                        panels: prev.panels.map((p) => p.id === selectedPanel.id ? { ...p, prompt: val } : p)
                      }));
                    }}
                    placeholder={uiText("components_imgdesc_page_builder_modal.textarea.enter_prompt_for_this_specific_panel.placeholder", "Enter prompt for this specific panel...")}
                    className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none"
                  />

                  <CustomizableButton
                    buttonId="imgdesc_page_builder_modal_btn_2"
                    onClick={handleCompilePanel}
disabled={isCompilingPanel || !selectedPanel.prompt}
className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow"
                  >
                      {() => (
                          <>
                            {isCompilingPanel ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          {uiText("components_imgdesc_page_builder_modal.button.compile_panel_image", "Compile Panel Image")}
                          </>
                        )}
                  </CustomizableButton>

                  {compileError && <div className="text-[10px] text-red-400 p-2 bg-red-950/20 rounded border border-red-500/20">{compileError}</div>}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-800">
              <CustomizableButton
                buttonId="imgdesc_page_builder_modal_btn_1"
                onClick={() => {
                  const firstRendered = pageLayout.panels.find((p) => p.image)?.image;
                  if (firstRendered) onExportPageToCanvas(firstRendered);
                  onClose();
                }}
className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
              >
                  {() => (
                      <>
                        {uiText("components_imgdesc_page_builder_modal.button.done", "Done")}
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
