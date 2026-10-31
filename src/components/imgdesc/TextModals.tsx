import React from "react";
import { MessageSquare, Type, Settings2, X, Plus, Trash2 } from "lucide-react";
import { uiText } from "../../hooks/useUIConfig";
import { CustomizableLabel } from "../CustomizableLabel";
import { CustomizableButton } from "../CustomizableButton";

export const CaptionsModal = ({
  isOpen, onClose, captions, setCaptions, frameCount
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-pink-400" />
            <CustomizableLabel
              labelId="imgdesc_text_modals_item_20"
              as="h2"
              className="text-base font-bold text-zinc-100"
            >
                {() => (
                    <>
                      {uiText("components_imgdesc_text_modals.h2.speaker_captions_and_dialogue", "Speaker Captions & Dialogue")}
                    </>
                  )}
            </CustomizableLabel>
          </div>
          <CustomizableButton
            buttonId="imgdesc_text_modals_btn_19"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          />
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {captions.map((caption: any, idx: number) => (
            <div key={idx} className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <CustomizableLabel
                    labelId="imgdesc_text_modals_item_18"
                    as="label"
                    className="text-[10px] text-zinc-500 uppercase block mb-0.5"
                  >
                      {() => (
                          <>
                            {uiText("components_imgdesc_text_modals.label.speaker", "Speaker")}
                          </>
                        )}
                  </CustomizableLabel>
                  <input
                    type="text"
                    value={caption.speaker}
                    onChange={(e) => {
                      const updated = [...captions];
                      updated[idx].speaker = e.target.value;
                      setCaptions(updated);
                    }}
                    placeholder={uiText("components_imgdesc_text_modals.input.e_g_detective.placeholder", "e.g. Detective")}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-zinc-200"
                  />
                </div>
                <div>
                  <CustomizableLabel
                    labelId="imgdesc_text_modals_item_17"
                    as="label"
                    className="text-[10px] text-zinc-500 uppercase block mb-0.5"
                  >
                      {() => (
                          <>
                            {uiText("components_imgdesc_text_modals.label.panel", "Panel")}
                          </>
                        )}
                  </CustomizableLabel>
                  <select
                    value={caption.panel || "Panel 1"}
                    onChange={(e) => {
                      const updated = [...captions];
                      updated[idx].panel = e.target.value;
                      setCaptions(updated);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-zinc-200"
                  >
                    {Array.from({ length: frameCount || 4 }).map((_, i) => (
                      <option key={i} value={`Panel ${i + 1}`}>{uiText("components_imgdesc_text_modals.option.panel", "Panel ")}{i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={caption.text}
                  onChange={(e) => {
                    const updated = [...captions];
                    updated[idx].text = e.target.value;
                    setCaptions(updated);
                  }}
                  placeholder={uiText("components_imgdesc_text_modals.input.dialogue_text.placeholder", "Dialogue text...")}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-xs text-zinc-200"
                />
                {captions.length > 1 && (
                  <CustomizableButton
                    buttonId="imgdesc_text_modals_btn_16"
                    defaultIcon={<Trash2 className="w-4 h-4" />}
                    onClick={() => setCaptions(captions.filter((_: any, i: number) => i !== idx))}
className="p-1.5 text-zinc-600 hover:text-red-400"
                  />
                )}
              </div>
            </div>
          ))}

          {captions.length < 5 && (
            <CustomizableButton
              buttonId="imgdesc_text_modals_btn_15"
              defaultIcon={<Plus className="w-4 h-4" />}
              onClick={() => setCaptions([...captions, { speaker: "", text: "", panel: "Panel 1" }])}
className="w-full py-2 border border-dashed border-zinc-700 hover:border-pink-500/50 rounded-xl text-xs text-zinc-400 hover:text-pink-300 flex items-center justify-center gap-1.5 transition"
            >
                {() => (
                    <>
                      {uiText("components_imgdesc_text_modals.button.add_speaker_dialogue", " Add Speaker Dialogue")}
                    </>
                  )}
            </CustomizableButton>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
          <CustomizableButton
            buttonId="imgdesc_text_modals_btn_14"
            onClick={onClose}
className="px-5 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold"
          >
              {() => (
                  <>
                    {uiText("components_imgdesc_text_modals.button.done", "Done")}
                  </>
                )}
          </CustomizableButton>
        </div>
      </div>
    </div>
  );
};

export const HeadersModal = ({
  isOpen, onClose, headersSettings, setHeadersSettings, frameCount
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-fuchsia-400" />
            <CustomizableLabel
              labelId="imgdesc_text_modals_item_13"
              as="h2"
              className="text-base font-bold text-zinc-100"
            >
                {() => (
                    <>
                      {uiText("components_imgdesc_text_modals.h2.frame_headers_and_titles", "Frame Headers & Titles")}
                    </>
                  )}
            </CustomizableLabel>
          </div>
          <CustomizableButton
            buttonId="imgdesc_text_modals_btn_12"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          />
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
            <span className="font-semibold text-zinc-200">{uiText("components_imgdesc_text_modals.span.enable_headers", "Enable Headers")}</span>
            <input
              type="checkbox"
              checked={headersSettings.enabled}
              onChange={(e) => setHeadersSettings({ ...headersSettings, enabled: e.target.checked })}
              className="accent-fuchsia-500 w-4 h-4 cursor-pointer"
            />
          </div>

          {headersSettings.enabled && (
            <div className="space-y-3">
              <div>
                <CustomizableLabel
                  labelId="imgdesc_text_modals_item_11"
                  as="label"
                  className="text-[10px] text-zinc-500 uppercase block mb-1"
                >
                    {() => (
                        <>
                          {uiText("components_imgdesc_text_modals.label.header_style", "Header Style")}
                        </>
                      )}
                </CustomizableLabel>
                <select
                  value={headersSettings.font}
                  onChange={(e) => setHeadersSettings({ ...headersSettings, font: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                >
                  <option value="Classic Comic">{uiText("components_imgdesc_text_modals.option.classic_comic", "Classic Comic")}</option>
                  <option value="Action Red">{uiText("components_imgdesc_text_modals.option.action_red", "Action Red")}</option>
                  <option value="Neon Glow">{uiText("components_imgdesc_text_modals.option.neon_glow", "Neon Glow")}</option>
                  <option value="Vintage Print">{uiText("components_imgdesc_text_modals.option.vintage_print", "Vintage Print")}</option>
                </select>
              </div>

              <div>
                <CustomizableLabel
                  labelId="imgdesc_text_modals_item_10"
                  as="label"
                  className="text-[10px] text-zinc-500 uppercase block mb-1"
                >
                    {() => (
                        <>
                          {uiText("components_imgdesc_text_modals.label.color", "Color")}
                        </>
                      )}
                </CustomizableLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={headersSettings.color}
                    onChange={(e) => setHeadersSettings({ ...headersSettings, color: e.target.value })}
                    className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={headersSettings.color}
                    onChange={(e) => setHeadersSettings({ ...headersSettings, color: e.target.value })}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-zinc-200 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <CustomizableLabel
                  labelId="imgdesc_text_modals_item_9"
                  as="label"
                  className="text-[10px] text-zinc-500 uppercase block mb-1"
                >
                    {() => (
                        <>
                          {uiText("components_imgdesc_text_modals.label.title_text", "Title Text")}
                        </>
                      )}
                </CustomizableLabel>
                <input
                  type="text"
                  value={headersSettings.headers?.[0]?.text || ""}
                  onChange={(e) => {
                    const h = [...(headersSettings.headers || [])];
                    if (h[0]) h[0].text = e.target.value;
                    else h.push({ text: e.target.value, assignedFrames: "1" });
                    setHeadersSettings({ ...headersSettings, headers: h });
                  }}
                  placeholder={uiText("components_imgdesc_text_modals.input.e_g_episode_1_the_discovery.placeholder", "e.g. EPISODE 1: THE DISCOVERY")}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
          <CustomizableButton
            buttonId="imgdesc_text_modals_btn_8"
            onClick={onClose}
className="px-5 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-bold"
          >
              {() => (
                  <>
                    {uiText("components_imgdesc_text_modals.button.done_2", "Done")}
                  </>
                )}
          </CustomizableButton>
        </div>
      </div>
    </div>
  );
};

export const TextLabModal = ({
  isOpen, onClose, textSettings, setTextSettings
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-sky-400" />
            <CustomizableLabel
              labelId="imgdesc_text_modals_item_7"
              as="h2"
              className="text-base font-bold text-zinc-100"
            >
                {() => (
                    <>
                      {uiText("components_imgdesc_text_modals.h2.textlab_typography_settings", "TextLab Typography Settings")}
                    </>
                  )}
            </CustomizableLabel>
          </div>
          <CustomizableButton
            buttonId="imgdesc_text_modals_btn_6"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          />
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-3.5 text-xs">
          <div>
            <CustomizableLabel
              labelId="imgdesc_text_modals_item_5"
              as="label"
              className="text-[10px] text-zinc-500 uppercase block mb-1"
            >
                {() => (
                    <>
                      {uiText("components_imgdesc_text_modals.label.comic_font_family", "Comic Font Family")}
                    </>
                  )}
            </CustomizableLabel>
            <select
              value={textSettings.font}
              onChange={(e) => setTextSettings({ ...textSettings, font: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
            >
              <option value="Classic Comic">{uiText("components_imgdesc_text_modals.option.classic_comic_2", "Classic Comic")}</option>
              <option value="Action Red">{uiText("components_imgdesc_text_modals.option.action_red_2", "Action Red")}</option>
              <option value="Handwritten">{uiText("components_imgdesc_text_modals.option.handwritten", "Handwritten")}</option>
              <option value="Neon Glow">{uiText("components_imgdesc_text_modals.option.neon_glow_2", "Neon Glow")}</option>
              <option value="Vintage Print">{uiText("components_imgdesc_text_modals.option.vintage_print_2", "Vintage Print")}</option>
            </select>
          </div>

          <div>
            <CustomizableLabel
              labelId="imgdesc_text_modals_item_4"
              as="label"
              className="text-[10px] text-zinc-500 uppercase block mb-1"
            >
                {() => (
                    <>
                      {uiText("components_imgdesc_text_modals.label.text_color", "Text Color")}
                    </>
                  )}
            </CustomizableLabel>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textSettings.color}
                onChange={(e) => setTextSettings({ ...textSettings, color: e.target.value })}
                className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={textSettings.color}
                onChange={(e) => setTextSettings({ ...textSettings, color: e.target.value })}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-zinc-200 font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <CustomizableLabel
              labelId="imgdesc_text_modals_item_3"
              as="label"
              className="text-[10px] text-zinc-500 uppercase block mb-1"
            >
                {() => (
                    <>
                      {uiText("components_imgdesc_text_modals.label.size", "Size")}
                    </>
                  )}
            </CustomizableLabel>
            <select
              value={textSettings.size}
              onChange={(e) => setTextSettings({ ...textSettings, size: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
            >
              <option value="small">{uiText("components_imgdesc_text_modals.option.small", "Small")}</option>
              <option value="medium">{uiText("components_imgdesc_text_modals.option.medium", "Medium")}</option>
              <option value="large">{uiText("components_imgdesc_text_modals.option.large", "Large")}</option>
              <option value="xlarge">{uiText("components_imgdesc_text_modals.option.extra_large", "Extra Large")}</option>
            </select>
          </div>

          <div>
            <CustomizableLabel
              labelId="imgdesc_text_modals_item_2"
              as="label"
              className="text-[10px] text-zinc-500 uppercase block mb-1"
            >
                {() => (
                    <>
                      {uiText("components_imgdesc_text_modals.label.target_application", "Target Application")}
                    </>
                  )}
            </CustomizableLabel>
            <select
              value={textSettings.assignment}
              onChange={(e) => setTextSettings({ ...textSettings, assignment: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
            >
              <option value="speech">{uiText("components_imgdesc_text_modals.option.speech_bubbles_only", "Speech Bubbles Only")}</option>
              <option value="captions">{uiText("components_imgdesc_text_modals.option.captions_only", "Captions Only")}</option>
              <option value="headers">{uiText("components_imgdesc_text_modals.option.headers_only", "Headers Only")}</option>
              <option value="all">{uiText("components_imgdesc_text_modals.option.all_text_elements", "All Text Elements")}</option>
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
          <CustomizableButton
            buttonId="imgdesc_text_modals_btn_1"
            onClick={onClose}
className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold"
          >
              {() => (
                  <>
                    {uiText("components_imgdesc_text_modals.button.done_3", "Done")}
                  </>
                )}
          </CustomizableButton>
        </div>
      </div>
    </div>
  );
};
