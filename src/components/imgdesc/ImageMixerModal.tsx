import React, { useState } from "react";
import { Layers, Edit3, Grid, X, Upload, Wand2, Download, Check, RefreshCw } from "lucide-react";
import { MaskingCanvas } from "../MaskingCanvas";
import { editImage, mixImages, analyzeImageCoordinates } from "../../services/gemini";
import { uiText } from "../../hooks/useUIConfig";
import { CustomizableLabel } from "../CustomizableLabel";
import { CustomizableButton } from "../CustomizableButton";

interface ImageMixerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToCanvas: (url: string) => void;
  onSendToPrompt: (coords: string) => void;
}

export const ImageMixerModal: React.FC<ImageMixerModalProps> = ({
  isOpen, onClose, onSendToCanvas, onSendToPrompt
}) => {
  const [activeTab, setActiveTab] = useState<"mix" | "edit" | "pinpoint">("mix");
  const [images, setImages] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("Seamlessly blend these subjects into a dramatic high-contrast comic book illustration.");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [maskData, setMaskData] = useState<string | null>(null);
  const [pinpointQuery, setPinpointQuery] = useState("Find key character faces and subjects.");
  const [pinpointResult, setPinpointResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === "string") {
          setImages((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRunMixOrEdit = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setResultImage(null);
    try {
      const formatted = images.map((url) => ({
        base64Data: url.split("base64,")[1] || url,
        mimeType: url.split(";")[0]?.split(":")[1] || "image/png"
      }));

      if (activeTab === "edit") {
        const maskBase64 = maskData ? maskData.split("base64,")[1] : undefined;
        const res = await editImage(formatted[0].base64Data, formatted[0].mimeType, instructions, undefined, undefined, undefined, maskBase64);
        setResultImage(res);
      } else {
        const res = await mixImages(formatted, instructions);
        setResultImage(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePinpoint = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setPinpointResult(null);
    try {
      const base64Data = images[0].split("base64,")[1] || images[0];
      const mimeType = images[0].split(";")[0]?.split(":")[1] || "image/png";
      const res = await analyzeImageCoordinates(base64Data, mimeType, pinpointQuery);
      setPinpointResult(res);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
              <CustomizableButton
                buttonId="imgdesc_image_mixer_modal_btn_18"
                defaultIcon={<Layers className="w-3.5 h-3.5" />}
                onClick={() => setActiveTab("mix")}
className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 ${activeTab === "mix" ? "bg-purple-600 text-white" : "text-zinc-400"}`}
              >
                  {() => (
                      <>
                        {uiText("components_imgdesc_image_mixer_modal.button.image_mixer", " Image Mixer")}
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="imgdesc_image_mixer_modal_btn_17"
                defaultIcon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => setActiveTab("edit")}
className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 ${activeTab === "edit" ? "bg-emerald-600 text-white" : "text-zinc-400"}`}
              >
                  {() => (
                      <>
                        {uiText("components_imgdesc_image_mixer_modal.button.inpaint_edit", " Inpaint / Edit")}
                      </>
                    )}
              </CustomizableButton>
              <CustomizableButton
                buttonId="imgdesc_image_mixer_modal_btn_16"
                defaultIcon={<Grid className="w-3.5 h-3.5" />}
                onClick={() => setActiveTab("pinpoint")}
className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 ${activeTab === "pinpoint" ? "bg-blue-600 text-white" : "text-zinc-400"}`}
              >
                  {() => (
                      <>
                        {uiText("components_imgdesc_image_mixer_modal.button.pinpointer", " Pinpointer")}
                      </>
                    )}
              </CustomizableButton>
            </div>
          </div>
          <CustomizableButton
            buttonId="imgdesc_image_mixer_modal_btn_15"
            defaultIcon={<X className="w-5 h-5" />}
            onClick={onClose}
className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Controls & Inputs */}
          <div className="space-y-4">
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">{uiText("components_imgdesc_image_mixer_modal.span.uploaded_images", "Uploaded Images (")}{images.length})</span>
                {images.length > 0 && (
                  <CustomizableButton
                    buttonId="imgdesc_image_mixer_modal_btn_14"
                    onClick={() => setImages([])}
className="text-[10px] text-red-400 hover:underline"
                  >
                      {() => (
                          <>
                            {uiText("components_imgdesc_image_mixer_modal.button.clear", "Clear")}
                          </>
                        )}
                  </CustomizableButton>
                )}
              </div>

              {images.length === 0 ? (
                <CustomizableLabel
                  labelId="imgdesc_image_mixer_modal_item_13"
                  defaultIcon={<Upload className="w-6 h-6 text-zinc-600 mb-1" />}
                  as="label"
                  className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer"
                >
                    {() => (
                        <>
                          <span className="text-xs text-zinc-300 font-semibold">{uiText("components_imgdesc_image_mixer_modal.span.upload_image_s", "Upload Image(s)")}</span>
                        <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
                        </>
                      )}
                </CustomizableLabel>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-700 group">
                      <img src={img} alt={uiText("components_imgdesc_image_mixer_modal.img.uploaded.alt", "Uploaded")} className="w-full h-full object-cover" />
                      <CustomizableButton
                        buttonId="imgdesc_image_mixer_modal_btn_12"
                        defaultIcon={<X className="w-2.5 h-2.5" />}
                        onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
className="absolute top-1 right-1 p-1 bg-black/75 rounded-full text-white opacity-0 group-hover:opacity-100"
                      />
                    </div>
                  ))}
                  <CustomizableLabel
                    labelId="imgdesc_image_mixer_modal_item_11"
                    defaultIcon={<Upload className="w-4 h-4 text-zinc-500" />}
                    as="label"
                    className="border border-dashed border-zinc-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-zinc-900 aspect-square"
                  >
                      {() => (
                          <>
                            <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
                          </>
                        )}
                  </CustomizableLabel>
                </div>
              )}
            </div>

            {activeTab === "edit" && images.length > 0 && (
              <div className="space-y-1.5">
                <CustomizableLabel
                  labelId="imgdesc_image_mixer_modal_item_10"
                  as="label"
                  className="text-[10px] text-zinc-400 font-bold uppercase block"
                >
                    {() => (
                        <>
                          {uiText("components_imgdesc_image_mixer_modal.label.inpaint_brush_mask", "Inpaint / Brush Mask")}
                        </>
                      )}
                </CustomizableLabel>
                <MaskingCanvas imageSrc={images[0]} onMaskChange={setMaskData} brushSize={24} />
              </div>
            )}

            {activeTab !== "pinpoint" ? (
              <div className="space-y-2">
                <CustomizableLabel
                  labelId="imgdesc_image_mixer_modal_item_9"
                  as="label"
                  className="text-[10px] text-zinc-400 font-bold uppercase block"
                >
                    {() => (
                        <>
                          {uiText("components_imgdesc_image_mixer_modal.label.instruction_prompt", "Instruction Prompt")}
                        </>
                      )}
                </CustomizableLabel>
                <div className="flex gap-1.5 flex-wrap text-[10px]">
                  <CustomizableButton
                    buttonId="imgdesc_image_mixer_modal_btn_8"
                    onClick={() => setInstructions((prev) => `${prev} Add vibrant green chromakey background.`)}
className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300"
                  >
                      {() => (
                          <>
                            {uiText("components_imgdesc_image_mixer_modal.button.chromakey", "Chromakey")}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="imgdesc_image_mixer_modal_btn_7"
                    onClick={() => setInstructions((prev) => `${prev} Remove background leaving clean cutout subject.`)}
className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300"
                  >
                      {() => (
                          <>
                            {uiText("components_imgdesc_image_mixer_modal.button.remove_bg", "Remove BG")}
                          </>
                        )}
                  </CustomizableButton>
                  <CustomizableButton
                    buttonId="imgdesc_image_mixer_modal_btn_6"
                    onClick={() => setInstructions((prev) => `${prev} Add dramatic comic book ink lineart.`)}
className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300"
                  >
                      {() => (
                          <>
                            {uiText("components_imgdesc_image_mixer_modal.button.ink_lines", "Ink Lines")}
                          </>
                        )}
                  </CustomizableButton>
                </div>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-purple-500 resize-none"
                />
                <CustomizableButton
                  buttonId="imgdesc_image_mixer_modal_btn_5"
                  onClick={handleRunMixOrEdit}
disabled={isProcessing || images.length === 0}
className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow"
                >
                    {() => (
                        <>
                          {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        {activeTab === "edit" ? "Apply Canvas Edits" : "Generate Blend"}
                        </>
                      )}
                </CustomizableButton>
              </div>
            ) : (
              <div className="space-y-2">
                <CustomizableLabel
                  labelId="imgdesc_image_mixer_modal_item_4"
                  as="label"
                  className="text-[10px] text-zinc-400 font-bold uppercase block"
                >
                    {() => (
                        <>
                          {uiText("components_imgdesc_image_mixer_modal.label.pinpoint_target_query", "Pinpoint Target Query")}
                        </>
                      )}
                </CustomizableLabel>
                <input
                  type="text"
                  value={pinpointQuery}
                  onChange={(e) => setPinpointQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                />
                <CustomizableButton
                  buttonId="imgdesc_image_mixer_modal_btn_3"
                  onClick={handlePinpoint}
disabled={isProcessing || images.length === 0}
className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                    {() => (
                        <>
                          {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Grid className="w-4 h-4" />}
                        {uiText("components_imgdesc_image_mixer_modal.button.locate_coordinates", "Locate Coordinates")}
                        </>
                      )}
                </CustomizableButton>
              </div>
            )}
          </div>

          {/* Results Right */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="flex-1 bg-zinc-950 rounded-2xl border border-zinc-800 p-3 flex flex-col items-center justify-center min-h-[300px]">
              {resultImage ? (
                <img src={resultImage} alt={uiText("components_imgdesc_image_mixer_modal.img.result.alt", "Result")} className="max-w-full max-h-[360px] object-contain rounded-xl shadow-2xl" />
              ) : pinpointResult ? (
                <div className="w-full h-full p-3 font-mono text-xs text-emerald-400 whitespace-pre-wrap overflow-y-auto">
                  {pinpointResult}
                </div>
              ) : (
                <div className="text-zinc-600 text-xs italic text-center">
                  {uiText("components_imgdesc_image_mixer_modal.div.output_will_appear_here_once_processed", "Output will appear here once processed.")}
                </div>
              )}
            </div>

            {resultImage && (
              <div className="grid grid-cols-2 gap-2">
                <CustomizableButton
                  buttonId="imgdesc_image_mixer_modal_btn_2"
                  defaultIcon={<Check className="w-3.5 h-3.5" />}
                  onClick={() => {
                    onSendToCanvas(resultImage);
                    onClose();
                  }}
className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                    {() => (
                        <>
                          {uiText("components_imgdesc_image_mixer_modal.button.use_as_active_image", " Use as Active Image")}
                        </>
                      )}
                </CustomizableButton>
                <a
                  href={resultImage}
                  download={`mixed-img-${Date.now()}.png`}
                  className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />{uiText("components_imgdesc_image_mixer_modal.a.download", " Download")}
                </a>
              </div>
            )}

            {pinpointResult && (
              <CustomizableButton
                buttonId="imgdesc_image_mixer_modal_btn_1"
                onClick={() => {
                  onSendToPrompt(`\n[Reference Coordinates: ${pinpointResult}]`);
                  onClose();
                }}
className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
              >
                  {() => (
                      <>
                        {uiText("components_imgdesc_image_mixer_modal.button.inject_coordinates_into_prompt", "Inject Coordinates into Prompt")}
                      </>
                    )}
              </CustomizableButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
