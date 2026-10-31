import React, { useState, useEffect } from "react";
import { UserPlus, X, RefreshCw, Wand2, Play, Pause, Download, Terminal, Upload, Trash2 } from "lucide-react";
import { generateAvatarFrame } from "../../services/gemini";
import { uiText } from "../../hooks/useUIConfig";
import { CustomizableLabel } from "../CustomizableLabel";
import { CustomizableButton } from "../CustomizableButton";

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToScripter: (avatarDesc: string) => void;
  onSaveToCharacterManager: (name: string, desc: string, frame: string) => void;
  onSendToCarverCanvas: (frame: string) => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  isOpen, onClose, onSendToScripter, onSaveToCharacterManager, onSendToCarverCanvas
}) => {
  const [characterName, setCharacterName] = useState("Vigilante");
  const [feature, setFeature] = useState("Eyes");
  const [degree, setDegree] = useState(5);
  const [style, setStyle] = useState("Chromakey");
  const [removeText, setRemoveText] = useState(true);
  const [rotX, setRotX] = useState(30);
  const [rotY, setRotY] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [zoom, setZoom] = useState(false);
  const [zoomX, setZoomX] = useState(50);
  const [zoomY, setZoomY] = useState(50);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && frames.length > 0) {
      interval = setInterval(() => {
        setPreviewIndex((prev) => (prev + 1) % frames.length);
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isPlaying, frames]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setFrames([]);
    setPreviewIndex(0);
    setIsPlaying(false);
    try {
      const generatedFrames: string[] = [];
      const totalFrames = 7;
      const base64Data = avatarImage?.split(",")[1] || "";
      const mimeType = avatarImage?.split(";")[0]?.split(":")[1] || "image/png";

      for (let i = 0; i < totalFrames; i++) {
        const frame = await generateAvatarFrame(
          base64Data, mimeType, feature, degree, style, removeText, zoom, zoomX, zoomY,
          rotX, rotY, speed, i, totalFrames
        );
        generatedFrames.push(frame);
        setFrames([...generatedFrames]);
      }
      setIsPlaying(true);
    } catch (e) {
      console.error("Avatar generation error", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") {
        setAvatarImage(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <CustomizableLabel
                labelId="imgdesc_avatar_modal_item_13"
                as="h2"
                className="text-base font-bold text-zinc-100"
              >
                  {() => (
                      <>
                        {uiText("components_imgdesc_avatar_modal.h2.avatar_creator_and_turnaround_studio", "Avatar Creator & Turnaround Studio")}
                      </>
                    )}
              </CustomizableLabel>
              <p className="text-[11px] text-zinc-400">{uiText("components_imgdesc_avatar_modal.p.produce_7_frame_rotational_and_expression_an", "Produce 7-frame rotational and expression animation sequences")}</p>
            </div>
          </div>
          <CustomizableButton
            buttonId="imgdesc_avatar_modal_btn_12"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Settings Left */}
          <div className="md:col-span-4 space-y-4">
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-3">
              <CustomizableLabel
                labelId="imgdesc_avatar_modal_item_11"
                as="label"
                className="text-[10px] text-zinc-400 font-bold uppercase block"
              >
                  {() => (
                      <>
                        {uiText("components_imgdesc_avatar_modal.label.character_info", "Character Info")}
                      </>
                    )}
              </CustomizableLabel>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder={uiText("components_imgdesc_avatar_modal.input.character_name.placeholder", "Character Name...")}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
              />

              <div className="relative aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                {avatarImage ? (
                  <img src={avatarImage} alt={uiText("components_imgdesc_avatar_modal.img.avatar.alt", "Avatar")} className="w-full h-full object-cover" />
                ) : (
                  <CustomizableLabel
                    labelId="imgdesc_avatar_modal_item_10"
                    defaultIcon={<Upload className="w-6 h-6 text-zinc-500 mb-1" />}
                    as="label"
                    className="flex flex-col items-center justify-center cursor-pointer p-4 text-center"
                  >
                      {() => (
                          <>
                            <span className="text-[11px] text-zinc-400 font-semibold">{uiText("components_imgdesc_avatar_modal.span.upload_source_character", "Upload Source Character")}</span>
                          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                          </>
                        )}
                  </CustomizableLabel>
                )}
              </div>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <CustomizableLabel
                    labelId="imgdesc_avatar_modal_item_9"
                    as="label"
                    className="text-[10px] text-zinc-500 uppercase block mb-1"
                  >
                      {() => (
                          <>
                            {uiText("components_imgdesc_avatar_modal.label.focus_feature", "Focus Feature")}
                          </>
                        )}
                  </CustomizableLabel>
                  <select
                    value={feature}
                    onChange={(e) => setFeature(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-zinc-200"
                  >
                    <option value="Eyes">{uiText("components_imgdesc_avatar_modal.option.eyes", "Eyes")}</option>
                    <option value="Mouth">{uiText("components_imgdesc_avatar_modal.option.mouth", "Mouth")}</option>
                    <option value="Head Turn">{uiText("components_imgdesc_avatar_modal.option.head_turn", "Head Turn")}</option>
                    <option value="Full Torso">{uiText("components_imgdesc_avatar_modal.option.full_torso", "Full Torso")}</option>
                  </select>
                </div>
                <div>
                  <CustomizableLabel
                    labelId="imgdesc_avatar_modal_item_8"
                    as="label"
                    className="text-[10px] text-zinc-500 uppercase block mb-1"
                  >
                      {() => (
                          <>
                            {uiText("components_imgdesc_avatar_modal.label.style", "Style")}
                          </>
                        )}
                  </CustomizableLabel>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-zinc-200"
                  >
                    <option value="Chromakey">{uiText("components_imgdesc_avatar_modal.option.chromakey", "Chromakey")}</option>
                    <option value="Cyberpunk">{uiText("components_imgdesc_avatar_modal.option.cyberpunk", "Cyberpunk")}</option>
                    <option value="Pencil Sketch">{uiText("components_imgdesc_avatar_modal.option.sketch", "Sketch")}</option>
                    <option value="Anime Cel">{uiText("components_imgdesc_avatar_modal.option.anime_cel", "Anime Cel")}</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                  <span>{uiText("components_imgdesc_avatar_modal.span.intensity", "Intensity")}</span>
                  <span className="text-purple-400 font-bold">{degree}</span>
                </div>
                <input type="range" min="1" max="10" value={degree} onChange={(e) => setDegree(parseInt(e.target.value))} className="w-full accent-purple-500" />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                  <span>{uiText("components_imgdesc_avatar_modal.span.rotation_angle", "Rotation Angle")}</span>
                  <span className="text-purple-400 font-bold">{rotX}°</span>
                </div>
                <input type="range" min="10" max="90" value={rotX} onChange={(e) => setRotX(parseInt(e.target.value))} className="w-full accent-purple-500" />
              </div>
            </div>
          </div>

          {/* Preview Player Center */}
          <div className="md:col-span-8 flex flex-col justify-between space-y-4">
            <div className="flex-1 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center p-4 relative min-h-[340px]">
              {frames.length > 0 ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={frames[previewIndex]}
                    alt={`Frame ${previewIndex + 1}`}
                    className="max-h-[380px] max-w-full object-contain rounded-xl shadow-2xl"
                  />
                  <div className="absolute bottom-4 flex items-center gap-3 bg-zinc-900/90 backdrop-blur px-4 py-2 rounded-full border border-zinc-700 shadow-xl">
                    <CustomizableButton
                      buttonId="imgdesc_avatar_modal_btn_7"
                      onClick={() => setIsPlaying(!isPlaying)}
className="p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full transition"
                    >
                        {() => (
                            <>
                              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </>
                          )}
                    </CustomizableButton>
                    <div className="flex gap-1">
                      {frames.map((_, i) => (
                        <CustomizableButton
                          buttonId="imgdesc_avatar_modal_btn_6"
                          key={i}
onClick={() => { setIsPlaying(false); setPreviewIndex(i); }}
className={`w-2.5 h-2.5 rounded-full transition-all ${i === previewIndex ? "bg-purple-500 w-5" : "bg-zinc-700"}`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">{previewIndex + 1}/7</span>
                  </div>
                </div>
              ) : isGenerating ? (
                <div className="flex flex-col items-center gap-3 text-zinc-400">
                  <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                  <p className="text-xs font-semibold">{uiText("components_imgdesc_avatar_modal.p.generating_7_frame_sequence", "Generating 7-Frame Sequence...")}</p>
                </div>
              ) : (
                <div className="text-center text-zinc-600 text-xs italic">
                  {uiText("components_imgdesc_avatar_modal.div.upload_an_avatar_or_configure_parameters_the", "Upload an avatar or configure parameters, then render the 7-frame rotational animation sequence.")}
                </div>
              )}
            </div>

            {frames.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <CustomizableButton
                  buttonId="imgdesc_avatar_modal_btn_5"
                  defaultIcon={<Terminal className="w-3.5 h-3.5 text-indigo-400" />}
                  onClick={() => {
                    onSendToScripter(`[Avatar: ${characterName}] Style: ${style}, Feature: ${feature}`);
                    onClose();
                  }}
className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                    {() => (
                        <>
                          {uiText("components_imgdesc_avatar_modal.button.send_to_scripter", " Send to Scripter")}
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="imgdesc_avatar_modal_btn_4"
                  defaultIcon={<UserPlus className="w-3.5 h-3.5 text-emerald-400" />}
                  onClick={() => {
                    onSaveToCharacterManager(characterName, `Avatar with ${feature} animation`, frames[previewIndex]);
                    onClose();
                  }}
className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                    {() => (
                        <>
                          {uiText("components_imgdesc_avatar_modal.button.save_to_characters", " Save to Characters")}
                        </>
                      )}
                </CustomizableButton>
                <CustomizableButton
                  buttonId="imgdesc_avatar_modal_btn_3"
                  defaultIcon={<Wand2 className="w-3.5 h-3.5" />}
                  onClick={() => {
                    onSendToCarverCanvas(frames[previewIndex]);
                    onClose();
                  }}
className="py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                    {() => (
                        <>
                          {uiText("components_imgdesc_avatar_modal.button.send_to_carver", " Send to Carver")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex justify-end gap-2.5">
          <CustomizableButton
            buttonId="imgdesc_avatar_modal_btn_2"
            onClick={onClose}
className="px-4 py-2 text-xs text-zinc-400 hover:text-white rounded-xl"
          >
              {() => (
                  <>
                    {uiText("components_imgdesc_avatar_modal.button.cancel", "Cancel")}
                  </>
                )}
          </CustomizableButton>
          <CustomizableButton
            buttonId="imgdesc_avatar_modal_btn_1"
            onClick={handleGenerate}
disabled={isGenerating}
className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/30"
          >
              {() => (
                  <>
                    {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {uiText("components_imgdesc_avatar_modal.button.render_7_frame_sequence", "Render 7-Frame Sequence")}
                  </>
                )}
          </CustomizableButton>
        </div>
      </div>
    </div>
  );
};
